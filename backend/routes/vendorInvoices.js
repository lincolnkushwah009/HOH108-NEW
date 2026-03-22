import express from 'express'
import VendorInvoice from '../models/VendorInvoice.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('vendor_invoices', 'view'))

// Get all vendor invoices
router.get('/', async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      vendor,
      project,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (paymentStatus) queryFilter.paymentStatus = paymentStatus
    if (vendor) queryFilter.vendor = vendor
    if (project) queryFilter.project = project
    if (search) {
      queryFilter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { vendorInvoiceNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await VendorInvoice.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const invoices = await VendorInvoice.find(queryFilter)
      .populate('vendor', 'name vendorId')
      .populate('purchaseOrder', 'poNumber')
      .populate('project', 'title projectId')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await VendorInvoice.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          total: { $sum: '$invoiceTotal' }
        }
      }
    ])

    res.json({
      success: true,
      data: invoices,
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

// Get single vendor invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await VendorInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('vendor', 'name vendorId email phone address bankDetails')
      .populate('purchaseOrder', 'poNumber orderDate')
      .populate('goodsReceipt', 'grnNumber receiptDate')
      .populate('project', 'title projectId')
      .populate('verifiedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('payments.recordedBy', 'name')

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Vendor invoice not found' })
    }

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create vendor invoice
router.post('/', async (req, res) => {
  try {
    const invoice = await VendorInvoice.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'Vendor invoice created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    const populatedInvoice = await VendorInvoice.findById(invoice._id)
      .populate('vendor', 'name vendorId')
      .populate('purchaseOrder', 'poNumber')

    res.status(201).json({ success: true, data: populatedInvoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update vendor invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await VendorInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Vendor invoice not found' })
    }

    if (!['draft', 'pending_verification'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update invoice in current status'
      })
    }

    Object.assign(invoice, req.body)
    invoice.activities.push({
      action: 'updated',
      description: 'Vendor invoice updated',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Verify invoice
router.put('/:id/verify', async (req, res) => {
  try {
    const invoice = await VendorInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Vendor invoice not found' })
    }

    invoice.status = 'verified'
    invoice.verifiedBy = req.user._id
    invoice.verifiedAt = new Date()
    invoice.activities.push({
      action: 'verified',
      description: 'Invoice verified',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve invoice
router.put('/:id/approve', async (req, res) => {
  try {
    const invoice = await VendorInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Vendor invoice not found' })
    }

    invoice.status = 'approved'
    invoice.approvedBy = req.user._id
    invoice.approvedAt = new Date()
    invoice.approvalRemarks = req.body.remarks
    invoice.activities.push({
      action: 'approved',
      description: req.body.remarks || 'Invoice approved for payment',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Record payment - SOX Control: PTP-004 Three-Way Match Enforcement
router.post('/:id/payments', async (req, res) => {
  try {
    const invoice = await VendorInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Vendor invoice not found' })
    }

    // SOX Control: Check if payment can be recorded
    const paymentCheck = invoice.canRecordPayment()
    if (!paymentCheck.canPay) {
      return res.status(403).json({
        success: false,
        message: paymentCheck.reason,
        soxControl: 'PTP-004',
        paymentBlocked: invoice.paymentBlocked,
        threeWayMatchStatus: invoice.threeWayMatchStatus
      })
    }

    const payment = {
      ...req.body,
      recordedBy: req.user._id,
      recordedAt: new Date()
    }

    invoice.payments.push(payment)
    invoice.activities.push({
      action: 'payment_recorded',
      description: `Payment of ${req.body.amount} recorded`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// SOX Control: Confirm not duplicate
router.post('/:id/confirm-not-duplicate', async (req, res) => {
  try {
    const { remarks } = req.body
    const invoice = await VendorInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Vendor invoice not found' })
    }

    if (invoice.duplicateCheckStatus !== 'potential_duplicate') {
      return res.status(400).json({
        success: false,
        message: 'Invoice does not have potential duplicates to confirm'
      })
    }

    invoice.duplicateCheckStatus = 'confirmed_not_duplicate'
    invoice.duplicateConfirmedBy = req.user._id
    invoice.duplicateConfirmedAt = new Date()
    invoice.duplicateRemarks = remarks

    invoice.activities.push({
      action: 'duplicate_confirmed_false',
      description: `Confirmed not a duplicate: ${remarks || 'No remarks'}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({
      success: true,
      message: 'Invoice confirmed as not a duplicate',
      data: invoice
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get payment blocking status
router.get('/:id/payment-status', async (req, res) => {
  try {
    const invoice = await VendorInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
    .populate('threeWayMatch', 'matchId overallStatus paymentBlocked')

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Vendor invoice not found' })
    }

    const paymentCheck = invoice.canRecordPayment()

    res.json({
      success: true,
      data: {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        canRecordPayment: paymentCheck.canPay,
        reason: paymentCheck.reason,
        paymentBlocked: invoice.paymentBlocked,
        paymentBlockedReason: invoice.paymentBlockedReason,
        threeWayMatchStatus: invoice.threeWayMatchStatus,
        threeWayMatch: invoice.threeWayMatch,
        duplicateCheckStatus: invoice.duplicateCheckStatus,
        status: invoice.status
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Dispute invoice
router.put('/:id/dispute', async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Dispute reason is required' })
    }

    const invoice = await VendorInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Vendor invoice not found' })
    }

    invoice.status = 'disputed'
    invoice.disputeReason = reason
    invoice.activities.push({
      action: 'disputed',
      description: `Invoice disputed: ${reason}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete vendor invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await VendorInvoice.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Vendor invoice not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Vendor invoice deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
