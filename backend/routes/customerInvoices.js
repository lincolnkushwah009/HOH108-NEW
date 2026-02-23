import express from 'express'
import CustomerInvoice from '../models/CustomerInvoice.js'
import Payment from '../models/Payment.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// Get all customer invoices
router.get('/', async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      customer,
      project,
      invoiceType,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (paymentStatus) queryFilter.paymentStatus = paymentStatus
    if (customer) queryFilter.customer = customer
    if (project) queryFilter.project = project
    if (invoiceType) queryFilter.invoiceType = invoiceType
    if (dateFrom || dateTo) {
      queryFilter.invoiceDate = {}
      if (dateFrom) queryFilter.invoiceDate.$gte = new Date(dateFrom)
      if (dateTo) queryFilter.invoiceDate.$lte = new Date(dateTo)
    }
    if (search) {
      queryFilter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await CustomerInvoice.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const invoices = await CustomerInvoice.find(queryFilter)
      .populate('customer', 'name customerId email')
      .populate('project', 'title projectId')
      .populate('salesOrder', 'orderNumber')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await CustomerInvoice.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          total: { $sum: '$invoiceTotal' },
          balance: { $sum: '$balanceAmount' }
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

// Get single customer invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('customer', 'name customerId email phone address')
      .populate('project', 'title projectId')
      .populate('salesOrder', 'orderNumber orderDate')
      .populate('payments.recordedBy', 'name')
      .populate('createdBy', 'name')

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found' })
    }

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create customer invoice
router.post('/', async (req, res) => {
  try {
    // Credit limit check if customer is provided
    if (req.body.customer) {
      const Customer = (await import('../models/Customer.js')).default
      const customer = await Customer.findById(req.body.customer)
      if (customer && customer.creditLimit > 0) {
        const currentOutstanding = customer.arSummary?.totalOutstanding || 0
        const invoiceAmount = req.body.invoiceTotal || 0
        if (currentOutstanding + invoiceAmount > customer.creditLimit) {
          return res.status(400).json({
            success: false,
            message: `Credit limit exceeded. Limit: ₹${customer.creditLimit.toLocaleString()}, Outstanding: ₹${currentOutstanding.toLocaleString()}, Invoice: ₹${invoiceAmount.toLocaleString()}. Available: ₹${(customer.creditLimit - currentOutstanding).toLocaleString()}`,
            creditInfo: {
              creditLimit: customer.creditLimit,
              currentOutstanding,
              invoiceAmount,
              available: customer.creditLimit - currentOutstanding
            }
          })
        }
      }
    }

    const invoice = await CustomerInvoice.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'Customer invoice created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    const populatedInvoice = await CustomerInvoice.findById(invoice._id)
      .populate('customer', 'name customerId')
      .populate('project', 'title projectId')

    res.status(201).json({ success: true, data: populatedInvoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update customer invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found' })
    }

    if (!['draft'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update invoice in current status'
      })
    }

    Object.assign(invoice, req.body)
    invoice.activities.push({
      action: 'updated',
      description: 'Customer invoice updated',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Submit invoice for approval
router.put('/:id/submit-for-approval', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found' })
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft invoices can be submitted for approval' })
    }

    invoice.status = 'pending_approval'
    invoice.approvalStatus = 'pending'
    invoice.activities.push({
      action: 'submitted_for_approval',
      description: 'Invoice submitted for approval',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice, message: 'Invoice submitted for approval' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve invoice
router.put('/:id/approve', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found' })
    }

    if (invoice.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Invoice is not pending approval' })
    }

    invoice.status = 'approved'
    invoice.approvalStatus = 'approved'
    invoice.approvedBy = req.user._id
    invoice.approvedByName = req.user.name
    invoice.approvedAt = new Date()
    invoice.activities.push({
      action: 'approved',
      description: `Invoice approved by ${req.user.name}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice, message: 'Invoice approved' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reject invoice
router.put('/:id/reject', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found' })
    }

    if (invoice.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Invoice is not pending approval' })
    }

    invoice.status = 'draft'
    invoice.approvalStatus = 'rejected'
    invoice.rejectionReason = req.body.reason || ''
    invoice.activities.push({
      action: 'rejected',
      description: `Invoice rejected by ${req.user.name}: ${req.body.reason || 'No reason provided'}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice, message: 'Invoice rejected and returned to draft' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Send invoice to customer (requires approval)
router.put('/:id/send', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found' })
    }

    // Must be approved before sending (or draft if approval not required)
    if (!['approved', 'draft'].includes(invoice.status)) {
      return res.status(400).json({ success: false, message: 'Invoice must be approved before sending' })
    }

    invoice.status = 'sent'
    invoice.sentAt = new Date()
    invoice.activities.push({
      action: 'sent',
      description: 'Invoice sent to customer',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Send payment reminder
router.put('/:id/reminder', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    }).populate('customer', 'name email')

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found' })
    }

    invoice.lastReminderAt = new Date()
    invoice.reminderCount = (invoice.reminderCount || 0) + 1
    invoice.activities.push({
      action: 'payment_reminder_sent',
      description: `Payment reminder #${invoice.reminderCount} sent to ${invoice.customer?.name || 'customer'}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({
      success: true,
      message: `Reminder sent for invoice ${invoice.invoiceNumber}`,
      data: invoice
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Record payment
router.post('/:id/payments', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    }).populate('customer', 'name customerId')

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found' })
    }

    const paymentData = {
      ...req.body,
      recordedBy: req.user._id,
      recordedAt: new Date()
    }

    // Add payment to invoice's embedded payments array
    invoice.payments.push(paymentData)
    invoice.activities.push({
      action: 'payment_recorded',
      description: `Payment of ${req.body.amount} received`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    // Also create a Payment record in the Payments collection for Finance tracking
    try {
      await Payment.create({
        company: req.activeCompany._id,
        paymentType: 'incoming',
        customer: invoice.customer._id,
        customerInvoice: invoice._id,
        project: invoice.project,
        paymentDate: req.body.paymentDate,
        amount: req.body.amount,
        paymentMethod: req.body.paymentMethod,
        referenceNumber: req.body.referenceNumber,
        remarks: req.body.remarks,
        status: 'completed',
        createdBy: req.user._id,
        processedBy: req.user._id,
        processedAt: new Date(),
        activities: [{
          action: 'created',
          description: `Payment received for invoice ${invoice.invoiceNumber}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        }]
      })
    } catch (paymentErr) {
      console.error('Failed to create payment record:', paymentErr)
      // Don't fail the main request if payment record creation fails
    }

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Cancel invoice
router.put('/:id/cancel', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found' })
    }

    if (invoice.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel invoice with recorded payments'
      })
    }

    invoice.status = 'cancelled'
    invoice.activities.push({
      action: 'cancelled',
      description: req.body.reason || 'Invoice cancelled',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await invoice.save()

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete customer invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Customer invoice deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * ===========================================
 * SOX Control: OTC-009 Credit Note Application
 * ===========================================
 */

// Apply credit note against outstanding invoice
router.post('/:id/apply-credit-note', async (req, res) => {
  try {
    const { creditNoteId, amount } = req.body

    if (!creditNoteId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Credit note ID and valid amount required'
      })
    }

    // Get the invoice to apply credit to
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    if (invoice.balanceAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already paid in full'
      })
    }

    // Get the credit note
    const creditNote = await CustomerInvoice.findOne({
      _id: creditNoteId,
      company: req.activeCompany._id,
      invoiceType: 'credit_note',
      customer: invoice.customer
    })

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        message: 'Credit note not found or does not belong to the same customer'
      })
    }

    // Check credit note has available balance
    const creditNoteAvailable = creditNote.invoiceTotal - (creditNote.totalCreditApplied || 0)
    if (creditNoteAvailable < amount) {
      return res.status(400).json({
        success: false,
        message: `Credit note only has ${creditNoteAvailable} available. Requested: ${amount}`
      })
    }

    // Check invoice balance
    if (invoice.balanceAmount < amount) {
      return res.status(400).json({
        success: false,
        message: `Invoice balance is only ${invoice.balanceAmount}. Requested: ${amount}`
      })
    }

    // Apply credit note to invoice
    invoice.creditNotesApplied.push({
      creditNote: creditNoteId,
      amount: amount,
      appliedAt: new Date(),
      appliedBy: req.user._id
    })
    invoice.totalCreditApplied = (invoice.totalCreditApplied || 0) + amount
    invoice.paidAmount = invoice.paidAmount + amount
    invoice.balanceAmount = invoice.invoiceTotal - invoice.paidAmount

    invoice.activities.push({
      action: 'credit_note_applied',
      description: `Credit note ${creditNote.invoiceNumber} applied for amount ${amount}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    // Update invoice payment status
    if (invoice.balanceAmount <= 0) {
      invoice.paymentStatus = 'paid'
      invoice.status = 'paid'
    } else if (invoice.paidAmount > 0) {
      invoice.paymentStatus = 'partially_paid'
      invoice.status = 'partially_paid'
    }

    await invoice.save()

    // Update credit note used amount
    creditNote.totalCreditApplied = (creditNote.totalCreditApplied || 0) + amount
    creditNote.activities.push({
      action: 'credit_applied',
      description: `Applied ${amount} to invoice ${invoice.invoiceNumber}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })
    await creditNote.save()

    // Update customer AR summary
    const Customer = (await import('../models/Customer.js')).default
    const customer = await Customer.findById(invoice.customer)
    if (customer) {
      await customer.updateARSummary()
    }

    res.json({
      success: true,
      message: `Credit note applied successfully`,
      data: {
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          balanceAmount: invoice.balanceAmount,
          paymentStatus: invoice.paymentStatus
        },
        creditNote: {
          _id: creditNote._id,
          invoiceNumber: creditNote.invoiceNumber,
          remainingCredit: creditNote.invoiceTotal - creditNote.totalCreditApplied
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get available credit notes for a customer
router.get('/credit-notes/:customerId', async (req, res) => {
  try {
    const creditNotes = await CustomerInvoice.find({
      company: req.activeCompany._id,
      customer: req.params.customerId,
      invoiceType: 'credit_note',
      $expr: {
        $gt: [
          '$invoiceTotal',
          { $ifNull: ['$totalCreditApplied', 0] }
        ]
      }
    })
      .select('invoiceNumber invoiceDate invoiceTotal totalCreditApplied')
      .sort({ invoiceDate: -1 })

    const creditNotesWithAvailable = creditNotes.map(cn => ({
      _id: cn._id,
      invoiceNumber: cn.invoiceNumber,
      invoiceDate: cn.invoiceDate,
      totalAmount: cn.invoiceTotal,
      usedAmount: cn.totalCreditApplied || 0,
      availableAmount: cn.invoiceTotal - (cn.totalCreditApplied || 0)
    }))

    res.json({
      success: true,
      data: creditNotesWithAvailable
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
