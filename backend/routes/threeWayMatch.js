import express from 'express'
import ThreeWayMatch from '../models/ThreeWayMatch.js'
import VendorInvoice from '../models/VendorInvoice.js'
import PurchaseOrder from '../models/PurchaseOrder.js'
import GoodsReceipt from '../models/GoodsReceipt.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery,
  authorize
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

/**
 * @route   GET /api/three-way-match
 * @desc    Get all three-way match records
 * @access  Private (Finance, Operations, Admin)
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      vendor,
      paymentBlocked,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.overallStatus = status
    if (vendor) queryFilter.vendor = vendor
    if (paymentBlocked !== undefined) queryFilter.paymentBlocked = paymentBlocked === 'true'
    if (startDate || endDate) {
      queryFilter.createdAt = {}
      if (startDate) queryFilter.createdAt.$gte = new Date(startDate)
      if (endDate) queryFilter.createdAt.$lte = new Date(endDate)
    }
    if (search) {
      queryFilter.$or = [
        { matchId: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await ThreeWayMatch.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const matches = await ThreeWayMatch.find(queryFilter)
      .populate('vendor', 'name vendorId')
      .populate('purchaseOrder', 'poNumber poTotal')
      .populate('goodsReceipt', 'grnNumber')
      .populate('vendorInvoice', 'invoiceNumber vendorInvoiceNumber invoiceTotal')
      .populate('matchedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get summary stats
    const stats = await ThreeWayMatch.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$overallStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totals.invoiceTotal' }
        }
      }
    ])

    res.json({
      success: true,
      data: matches,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   GET /api/three-way-match/unmatched
 * @desc    Get invoices pending three-way matching
 * @access  Private
 */
router.get('/unmatched', async (req, res) => {
  try {
    const invoices = await ThreeWayMatch.findUnmatchedInvoices(req.activeCompany._id)

    const populatedInvoices = await VendorInvoice.populate(invoices, [
      { path: 'vendor', select: 'name vendorId' },
      { path: 'purchaseOrder', select: 'poNumber poTotal' },
      { path: 'goodsReceipt', select: 'grnNumber' }
    ])

    res.json({
      success: true,
      data: populatedInvoices,
      count: populatedInvoices.length
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   GET /api/three-way-match/variance-report
 * @desc    Get variance analysis report
 * @access  Private (Finance, Admin)
 */
router.get('/variance-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const report = await ThreeWayMatch.getVarianceReport(
      req.activeCompany._id,
      startDate,
      endDate
    )

    // Get detailed variance breakdown
    const detailedVariances = await ThreeWayMatch.find({
      company: req.activeCompany._id,
      overallStatus: { $in: ['mismatch', 'partial_match', 'exception_pending', 'exception_approved'] },
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) })
        }
      } : {})
    })
    .populate('vendor', 'name vendorId')
    .populate('vendorInvoice', 'invoiceNumber vendorInvoiceNumber')
    .sort({ 'priceMatch.varianceAmount': -1 })
    .limit(50)

    res.json({
      success: true,
      summary: report,
      details: detailedVariances
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   GET /api/three-way-match/:id
 * @desc    Get single three-way match record
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const match = await ThreeWayMatch.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
    .populate('vendor', 'name vendorId email phone')
    .populate('purchaseOrder')
    .populate('goodsReceipt')
    .populate('vendorInvoice')
    .populate('project', 'title projectId')
    .populate('matchedBy', 'name')
    .populate('exception.requestedBy', 'name')
    .populate('exception.approvedBy', 'name')
    .populate('exception.rejectedBy', 'name')
    .populate('activities.performedBy', 'name')

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match record not found' })
    }

    res.json({ success: true, data: match })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/three-way-match
 * @desc    Perform three-way matching for an invoice
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { vendorInvoiceId, tolerances } = req.body

    // Get the vendor invoice
    const invoice = await VendorInvoice.findOne({
      _id: vendorInvoiceId,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Vendor invoice not found' })
    }

    if (!invoice.purchaseOrder) {
      return res.status(400).json({
        success: false,
        message: 'Invoice does not have a linked Purchase Order'
      })
    }

    // Check for existing match
    const existingMatch = await ThreeWayMatch.findOne({
      company: req.activeCompany._id,
      vendorInvoice: vendorInvoiceId
    })

    if (existingMatch && ['matched', 'exception_approved'].includes(existingMatch.overallStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already has a successful match',
        existingMatch: existingMatch._id
      })
    }

    // Get PO
    const po = await PurchaseOrder.findById(invoice.purchaseOrder)
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found' })
    }

    // Get GRN if three-way match is required
    let grn = null
    const matchType = invoice.goodsReceipt ? 'three_way' : 'two_way'

    if (invoice.goodsReceipt) {
      grn = await GoodsReceipt.findById(invoice.goodsReceipt)
    } else if (matchType === 'three_way') {
      // Try to find a GRN for this PO
      grn = await GoodsReceipt.findOne({
        company: req.activeCompany._id,
        purchaseOrder: invoice.purchaseOrder,
        status: { $in: ['accepted', 'inspection_completed', 'partially_accepted'] }
      })
    }

    // Create or update match record
    let match = existingMatch || new ThreeWayMatch({
      company: req.activeCompany._id,
      purchaseOrder: invoice.purchaseOrder,
      goodsReceipt: grn?._id,
      vendorInvoice: invoice._id,
      vendor: invoice.vendor,
      project: invoice.project,
      matchType,
      createdBy: req.user._id
    })

    // Set tolerances
    if (tolerances) {
      match.tolerances = {
        ...match.tolerances,
        ...tolerances
      }
    }

    // Perform the matching
    match.performMatch(po, grn, invoice)
    match.matchedBy = req.user._id
    match.matchedAt = new Date()

    match.activities.push({
      action: 'match_performed',
      description: `Three-way match performed. Result: ${match.overallStatus}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await match.save()

    // Update invoice with match status
    invoice.threeWayMatch = match._id
    invoice.threeWayMatchStatus = match.overallStatus
    invoice.paymentBlocked = match.paymentBlocked
    invoice.paymentBlockedReason = match.paymentBlockedReason
    invoice.matchType = matchType

    if (!match.paymentBlocked) {
      invoice.paymentUnblockedAt = new Date()
      invoice.paymentUnblockedBy = req.user._id
    }

    invoice.activities.push({
      action: 'three_way_match',
      description: `Three-way match completed with status: ${match.overallStatus}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    const populatedMatch = await ThreeWayMatch.findById(match._id)
      .populate('vendor', 'name vendorId')
      .populate('purchaseOrder', 'poNumber')
      .populate('goodsReceipt', 'grnNumber')
      .populate('vendorInvoice', 'invoiceNumber vendorInvoiceNumber')

    res.status(existingMatch ? 200 : 201).json({
      success: true,
      data: populatedMatch,
      matchResult: {
        status: match.overallStatus,
        paymentBlocked: match.paymentBlocked,
        quantityMatch: match.quantityMatch,
        priceMatch: match.priceMatch
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/three-way-match/:id/request-exception
 * @desc    Request exception approval for mismatched invoice
 * @access  Private
 */
router.post('/:id/request-exception', async (req, res) => {
  try {
    const { justification } = req.body

    if (!justification) {
      return res.status(400).json({
        success: false,
        message: 'Justification is required for exception request'
      })
    }

    const match = await ThreeWayMatch.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match record not found' })
    }

    if (['matched', 'exception_approved'].includes(match.overallStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Match is already approved or matched'
      })
    }

    match.requestException(req.user._id, req.user.name, justification)
    await match.save()

    // Update invoice status
    await VendorInvoice.findByIdAndUpdate(match.vendorInvoice, {
      threeWayMatchStatus: 'exception_pending',
      paymentBlocked: true,
      paymentBlockedReason: 'Exception approval pending'
    })

    res.json({
      success: true,
      message: 'Exception request submitted for approval',
      data: match
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/three-way-match/:id/approve-exception
 * @desc    Approve exception - unblocks payment
 * @access  Private (Finance Manager, Admin)
 */
router.post('/:id/approve-exception', authorize('super_admin', 'company_admin', 'finance'), async (req, res) => {
  try {
    const { remarks } = req.body

    const match = await ThreeWayMatch.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match record not found' })
    }

    if (match.overallStatus !== 'exception_pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending exception request to approve'
      })
    }

    // SOX Control: Prevent self-approval
    if (match.exception.requestedBy?.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'SOX Compliance: You cannot approve your own exception request'
      })
    }

    match.approveException(req.user._id, req.user.name, remarks)
    await match.save()

    // Update invoice - unblock payment
    const invoice = await VendorInvoice.findById(match.vendorInvoice)
    if (invoice) {
      invoice.threeWayMatchStatus = 'exception_approved'
      invoice.unblockPayment(req.user._id, 'Exception approved - payment unblocked')
      await invoice.save()
    }

    res.json({
      success: true,
      message: 'Exception approved. Payment is now unblocked.',
      data: match
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/three-way-match/:id/reject-exception
 * @desc    Reject exception - payment remains blocked
 * @access  Private (Finance Manager, Admin)
 */
router.post('/:id/reject-exception', authorize('super_admin', 'company_admin', 'finance'), async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      })
    }

    const match = await ThreeWayMatch.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match record not found' })
    }

    if (match.overallStatus !== 'exception_pending') {
      return res.status(400).json({
        success: false,
        message: 'No pending exception request to reject'
      })
    }

    match.rejectException(req.user._id, req.user.name, reason)
    await match.save()

    // Update invoice
    await VendorInvoice.findByIdAndUpdate(match.vendorInvoice, {
      threeWayMatchStatus: 'exception_rejected',
      paymentBlocked: true,
      paymentBlockedReason: 'Exception request was rejected'
    })

    res.json({
      success: true,
      message: 'Exception rejected. Payment remains blocked.',
      data: match
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/three-way-match/auto-match
 * @desc    Automatically match all pending invoices
 * @access  Private (Admin, Finance)
 */
router.post('/auto-match', authorize('super_admin', 'company_admin', 'finance'), async (req, res) => {
  try {
    const unmatchedInvoices = await ThreeWayMatch.findUnmatchedInvoices(req.activeCompany._id)

    const results = {
      total: unmatchedInvoices.length,
      matched: 0,
      partialMatch: 0,
      mismatch: 0,
      errors: []
    }

    for (const invoice of unmatchedInvoices) {
      try {
        const po = await PurchaseOrder.findById(invoice.purchaseOrder)
        if (!po) continue

        const grn = invoice.goodsReceipt ?
          await GoodsReceipt.findById(invoice.goodsReceipt) :
          await GoodsReceipt.findOne({
            company: req.activeCompany._id,
            purchaseOrder: invoice.purchaseOrder,
            status: { $in: ['accepted', 'inspection_completed'] }
          })

        const match = new ThreeWayMatch({
          company: req.activeCompany._id,
          purchaseOrder: invoice.purchaseOrder,
          goodsReceipt: grn?._id,
          vendorInvoice: invoice._id,
          vendor: invoice.vendor,
          project: invoice.project,
          matchType: grn ? 'three_way' : 'two_way',
          isAutoMatched: true,
          createdBy: req.user._id
        })

        match.performMatch(po, grn, invoice)
        match.matchedBy = req.user._id
        match.matchedAt = new Date()

        match.activities.push({
          action: 'auto_match',
          description: `Auto-matched with result: ${match.overallStatus}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        })

        await match.save()

        // Update invoice
        invoice.threeWayMatch = match._id
        invoice.threeWayMatchStatus = match.overallStatus
        invoice.paymentBlocked = match.paymentBlocked
        invoice.paymentBlockedReason = match.paymentBlockedReason

        if (!match.paymentBlocked) {
          invoice.paymentUnblockedAt = new Date()
          invoice.paymentUnblockedBy = req.user._id
        }

        await invoice.save()

        // Update results
        if (match.overallStatus === 'matched') results.matched++
        else if (match.overallStatus === 'partial_match') results.partialMatch++
        else results.mismatch++

      } catch (err) {
        results.errors.push({
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          error: err.message
        })
      }
    }

    res.json({
      success: true,
      message: 'Auto-matching completed',
      results
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   GET /api/three-way-match/by-invoice/:invoiceId
 * @desc    Get match record by invoice ID
 * @access  Private
 */
router.get('/by-invoice/:invoiceId', async (req, res) => {
  try {
    const match = await ThreeWayMatch.findOne({
      vendorInvoice: req.params.invoiceId,
      company: req.activeCompany._id
    })
    .populate('vendor', 'name vendorId')
    .populate('purchaseOrder', 'poNumber')
    .populate('goodsReceipt', 'grnNumber')
    .populate('vendorInvoice', 'invoiceNumber vendorInvoiceNumber')

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'No match record found for this invoice'
      })
    }

    res.json({ success: true, data: match })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
