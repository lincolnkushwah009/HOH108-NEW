import express from 'express'
import Payment from '../models/Payment.js'
import VendorInvoice from '../models/VendorInvoice.js'
import CustomerInvoice from '../models/CustomerInvoice.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('payments', 'view'))

// Get all payments
router.get('/', async (req, res) => {
  try {
    const {
      paymentType,
      status,
      paymentMethod,
      vendor,
      customer,
      project,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
      sortBy = 'paymentDate',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (paymentType) queryFilter.paymentType = paymentType
    if (status) queryFilter.status = status
    if (paymentMethod) queryFilter.paymentMethod = paymentMethod
    if (vendor) queryFilter.vendor = vendor
    if (customer) queryFilter.customer = customer
    if (project) queryFilter.project = project
    if (dateFrom || dateTo) {
      queryFilter.paymentDate = {}
      if (dateFrom) queryFilter.paymentDate.$gte = new Date(dateFrom)
      if (dateTo) queryFilter.paymentDate.$lte = new Date(dateTo)
    }
    if (search) {
      queryFilter.$or = [
        { paymentNumber: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await Payment.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const payments = await Payment.find(queryFilter)
      .populate('vendor', 'name vendorId')
      .populate('customer', 'name customerId')
      .populate('project', 'title projectId')
      .populate('vendorInvoice', 'invoiceNumber vendorInvoiceNumber')
      .populate('customerInvoice', 'invoiceNumber')
      .populate('processedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await Payment.getStats(req.activeCompany._id, { from: dateFrom, to: dateTo })

    res.json({
      success: true,
      data: payments,
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

// Get single payment
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('vendor', 'name vendorId email phone bankDetails')
      .populate('customer', 'name customerId email phone')
      .populate('project', 'title projectId')
      .populate('vendorInvoice', 'invoiceNumber vendorInvoiceNumber invoiceTotal')
      .populate('customerInvoice', 'invoiceNumber invoiceTotal')
      .populate('processedBy', 'name')
      .populate('approvedBy', 'name')

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    res.json({ success: true, data: payment })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create payment
router.post('/', async (req, res) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'Payment record created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    // Update related invoice if provided
    if (payment.vendorInvoice) {
      const invoice = await VendorInvoice.findById(payment.vendorInvoice)
      if (invoice) {
        invoice.payments.push({
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber,
          recordedBy: req.user._id
        })
        await invoice.save()
      }
    }

    if (payment.customerInvoice) {
      const invoice = await CustomerInvoice.findById(payment.customerInvoice)
      if (invoice) {
        invoice.payments.push({
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber,
          recordedBy: req.user._id
        })
        await invoice.save()
      }
    }

    // Auto-post to General Ledger
    try {
      const LedgerActivityMapping = (await import('../models/LedgerActivityMapping.js')).default
      const triggerEvent = payment.paymentType === 'incoming'
        ? 'payment_incoming_completed'
        : 'payment_outgoing_completed'
      await LedgerActivityMapping.executeMapping(
        payment.company,
        triggerEvent,
        { amount: payment.amount, method: payment.paymentMethod, reference: payment.paymentNumber, vendor: payment.vendor, customer: payment.customer, project: payment.project },
        req.user._id
      )
    } catch (glErr) {
      console.error('GL auto-posting error (non-blocking):', glErr.message)
    }

    const populatedPayment = await Payment.findById(payment._id)
      .populate('vendor', 'name vendorId')
      .populate('customer', 'name customerId')

    res.status(201).json({ success: true, data: populatedPayment })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update payment
router.put('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed payment'
      })
    }

    Object.assign(payment, req.body)
    payment.activities.push({
      action: 'updated',
      description: 'Payment record updated',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await payment.save()

    res.json({ success: true, data: payment })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve payment
router.put('/:id/approve', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      approvalStatus: 'pending'
    })

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found or not pending approval' })
    }

    payment.approvalStatus = 'approved'
    payment.approvedBy = req.user._id
    payment.approvedAt = new Date()
    payment.approvalRemarks = req.body.remarks
    payment.activities.push({
      action: 'approved',
      description: req.body.remarks || 'Payment approved',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await payment.save()

    res.json({ success: true, data: payment })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Process payment
router.put('/:id/process', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    payment.status = 'completed'
    payment.processedBy = req.user._id
    payment.processedAt = new Date()
    if (req.body.transactionId) payment.transactionId = req.body.transactionId
    if (req.body.referenceNumber) payment.referenceNumber = req.body.referenceNumber
    payment.activities.push({
      action: 'processed',
      description: 'Payment processed successfully',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await payment.save()

    // Auto-post to General Ledger
    try {
      const LedgerActivityMapping = (await import('../models/LedgerActivityMapping.js')).default
      const triggerEvent = payment.paymentType === 'incoming'
        ? 'payment_incoming_completed'
        : 'payment_outgoing_completed'
      await LedgerActivityMapping.executeMapping(
        payment.company,
        triggerEvent,
        { amount: payment.amount, method: payment.paymentMethod, reference: payment.paymentNumber, vendor: payment.vendor, customer: payment.customer, project: payment.project },
        req.user._id
      )
    } catch (glErr) {
      console.error('GL auto-posting error (non-blocking):', glErr.message)
    }

    res.json({ success: true, data: payment })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Cancel payment
router.put('/:id/cancel', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' })
    }

    if (payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed payment. Use reverse instead.'
      })
    }

    payment.status = 'cancelled'
    payment.activities.push({
      action: 'cancelled',
      description: req.body.reason || 'Payment cancelled',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await payment.save()

    res.json({ success: true, data: payment })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'pending'
    })

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Payment deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
