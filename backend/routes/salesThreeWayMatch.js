import express from 'express'
import SalesThreeWayMatch from '../models/SalesThreeWayMatch.js'
import SalesDispatch from '../models/SalesDispatch.js'
import CustomerInvoice from '../models/CustomerInvoice.js'
import SalesOrder from '../models/SalesOrder.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

/**
 * @route   POST /api/sales-three-way-match/execute
 * @desc    Execute a 3-way match between Sales Order, Dispatch, and Customer Invoice
 * @access  Private
 */
router.post('/execute', async (req, res) => {
  try {
    const { salesOrderId, salesDispatchId, customerInvoiceId, tolerancePercentage = 2 } = req.body

    if (!salesOrderId || !salesDispatchId || !customerInvoiceId) {
      return res.status(400).json({
        success: false,
        message: 'salesOrderId, salesDispatchId, and customerInvoiceId are all required'
      })
    }

    // Fetch all three documents
    const [salesOrder, salesDispatch, customerInvoice] = await Promise.all([
      SalesOrder.findOne({ _id: salesOrderId, company: req.activeCompany._id }),
      SalesDispatch.findOne({ _id: salesDispatchId, company: req.activeCompany._id }),
      CustomerInvoice.findOne({ _id: customerInvoiceId, company: req.activeCompany._id })
    ])

    if (!salesOrder) {
      return res.status(404).json({ success: false, message: 'Sales Order not found' })
    }
    if (!salesDispatch) {
      return res.status(404).json({ success: false, message: 'Sales Dispatch not found' })
    }
    if (!customerInvoice) {
      return res.status(404).json({ success: false, message: 'Customer Invoice not found' })
    }

    // Check for existing match
    const existingMatch = await SalesThreeWayMatch.findOne({
      company: req.activeCompany._id,
      customerInvoice: customerInvoiceId
    })

    if (existingMatch && ['matched', 'exception_approved'].includes(existingMatch.overallStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Customer invoice already has a successful match',
        existingMatch: existingMatch._id
      })
    }

    // Build line-level comparison
    // Map SO BOQ items, dispatch line items, and invoice line items by description/itemCode
    const lineMatches = []
    let hasQtyMismatch = false
    let hasPriceMismatch = false

    // Use invoice line items as the base for comparison
    for (const invLine of customerInvoice.lineItems) {
      const matchKey = invLine.itemCode || invLine.description

      // Find matching SO BOQ item
      const soItem = salesOrder.boq?.find(b =>
        (b.itemCode && b.itemCode === invLine.itemCode) ||
        (b.description && b.description === invLine.description)
      )

      // Find matching dispatch line item
      const dispatchItem = salesDispatch.lineItems?.find(d =>
        (d.itemCode && d.itemCode === invLine.itemCode) ||
        (d.description && d.description === invLine.description)
      )

      const soQty = soItem?.quantity || 0
      const soUnitPrice = soItem?.unitRate || 0
      const dispatchedQty = dispatchItem?.dispatchedQty || 0
      const invoicedQty = invLine.quantity || 0
      const invoicedUnitPrice = invLine.unitPrice || 0

      // Calculate variances
      const qtyVariance = invoicedQty - dispatchedQty
      const priceVariance = invoicedUnitPrice - soUnitPrice

      // Determine match status for this line
      const qtyToleranceAmount = (dispatchedQty * tolerancePercentage) / 100
      const priceToleranceAmount = (soUnitPrice * tolerancePercentage) / 100

      const qtyMatch = Math.abs(qtyVariance) <= qtyToleranceAmount
      const priceMatch = soUnitPrice === 0 || Math.abs(priceVariance) <= priceToleranceAmount

      let matchStatus = 'matched'
      if (!qtyMatch && !priceMatch) {
        matchStatus = 'both_mismatch'
        hasQtyMismatch = true
        hasPriceMismatch = true
      } else if (!qtyMatch) {
        matchStatus = 'qty_mismatch'
        hasQtyMismatch = true
      } else if (!priceMatch) {
        matchStatus = 'price_mismatch'
        hasPriceMismatch = true
      }

      lineMatches.push({
        description: invLine.description,
        itemCode: invLine.itemCode || '',
        soQty,
        dispatchedQty,
        invoicedQty,
        soUnitPrice,
        invoicedUnitPrice,
        qtyVariance,
        priceVariance,
        matchStatus
      })
    }

    // Calculate totals
    const totalSOAmount = salesOrder.costEstimation?.finalAmount || salesOrder.boq?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0
    const totalDispatchedAmount = salesDispatch.lineItems?.reduce((sum, d) => sum + (d.dispatchedQty * d.unitPrice), 0) || 0
    const totalInvoicedAmount = customerInvoice.invoiceTotal || 0

    // Determine overall status
    let overallStatus = 'matched'
    if (hasQtyMismatch || hasPriceMismatch) {
      const allMismatch = lineMatches.every(l => l.matchStatus !== 'matched')
      overallStatus = allMismatch ? 'mismatch' : 'partial_match'
    }

    // Create or update match record
    const matchData = {
      company: req.activeCompany._id,
      salesOrder: salesOrderId,
      salesDispatch: salesDispatchId,
      customerInvoice: customerInvoiceId,
      overallStatus,
      lineMatches,
      tolerancePercentage,
      totalSOAmount,
      totalDispatchedAmount,
      totalInvoicedAmount,
      executedBy: req.user._id,
      executedAt: new Date()
    }

    let match
    if (existingMatch) {
      Object.assign(existingMatch, matchData)
      match = await existingMatch.save()
    } else {
      match = await SalesThreeWayMatch.create(matchData)
    }

    // Update Customer Invoice salesMatchStatus
    customerInvoice.salesThreeWayMatch = match._id
    customerInvoice.salesMatchStatus = overallStatus
    await customerInvoice.save()

    const populatedMatch = await SalesThreeWayMatch.findById(match._id)
      .populate('salesOrder', 'salesOrderId title')
      .populate('salesDispatch', 'dispatchNumber')
      .populate('customerInvoice', 'invoiceNumber invoiceTotal')
      .populate('executedBy', 'name')

    res.status(existingMatch ? 200 : 201).json({
      success: true,
      data: populatedMatch,
      matchResult: {
        overallStatus,
        totalSOAmount,
        totalDispatchedAmount,
        totalInvoicedAmount,
        lineMatchSummary: {
          total: lineMatches.length,
          matched: lineMatches.filter(l => l.matchStatus === 'matched').length,
          qtyMismatch: lineMatches.filter(l => l.matchStatus === 'qty_mismatch').length,
          priceMismatch: lineMatches.filter(l => l.matchStatus === 'price_mismatch').length,
          bothMismatch: lineMatches.filter(l => l.matchStatus === 'both_mismatch').length
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   GET /api/sales-three-way-match
 * @desc    List all sales three-way match records
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { overallStatus, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const queryFilter = companyScopedQuery(req)

    if (overallStatus) queryFilter.overallStatus = overallStatus

    const total = await SalesThreeWayMatch.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const matches = await SalesThreeWayMatch.find(queryFilter)
      .populate('salesOrder', 'salesOrderId title')
      .populate('salesDispatch', 'dispatchNumber status')
      .populate('customerInvoice', 'invoiceNumber invoiceTotal')
      .populate('executedBy', 'name')
      .populate('exceptionApprovedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: matches,
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
 * @route   GET /api/sales-three-way-match/:id
 * @desc    Get single match with populated refs
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const match = await SalesThreeWayMatch.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('salesOrder', 'salesOrderId title costEstimation boq clientInfo')
      .populate('salesDispatch', 'dispatchNumber status lineItems dispatchDate deliveredDate')
      .populate('customerInvoice', 'invoiceNumber invoiceTotal lineItems customer paymentStatus')
      .populate('executedBy', 'name')
      .populate('exceptionApprovedBy', 'name')

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match record not found' })
    }

    res.json({ success: true, data: match })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/sales-three-way-match/:id/approve-exception
 * @desc    Approve exception (admin only)
 * @access  Private
 */
router.post('/:id/approve-exception', async (req, res) => {
  try {
    const { remarks } = req.body

    const match = await SalesThreeWayMatch.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match record not found' })
    }

    if (!['mismatch', 'partial_match', 'exception_pending'].includes(match.overallStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve exception for match with status '${match.overallStatus}'`
      })
    }

    match.overallStatus = 'exception_approved'
    match.exceptionApprovedBy = req.user._id
    match.exceptionApprovedAt = new Date()
    match.exceptionRemarks = remarks || ''

    await match.save()

    // Update Customer Invoice salesMatchStatus
    await CustomerInvoice.findByIdAndUpdate(match.customerInvoice, {
      salesMatchStatus: 'exception_approved'
    })

    res.json({
      success: true,
      message: 'Exception approved',
      data: match
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
