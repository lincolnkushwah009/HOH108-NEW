import express from 'express'
import Quotation from '../models/Quotation.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// Get all quotations
router.get('/', requireModulePermission('quotations', 'view'), async (req, res) => {
  try {
    const {
      status,
      customer,
      lead,
      project,
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
    if (customer) queryFilter.customer = customer
    if (lead) queryFilter.lead = lead
    if (project) queryFilter.project = project
    if (dateFrom || dateTo) {
      queryFilter.quotationDate = {}
      if (dateFrom) queryFilter.quotationDate.$gte = new Date(dateFrom)
      if (dateTo) queryFilter.quotationDate.$lte = new Date(dateTo)
    }
    if (search) {
      queryFilter.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await Quotation.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const quotations = await Quotation.find(queryFilter)
      .populate('customer', 'name customerId email')
      .populate('lead', 'name email')
      .populate('project', 'title projectId')
      .populate('preparedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await Quotation.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ])

    res.json({
      success: true,
      data: quotations,
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

// Get single quotation
router.get('/:id', requireModulePermission('quotations', 'view'), async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('customer', 'name customerId email phone address')
      .populate('lead', 'name email phone')
      .populate('project', 'title projectId')
      .populate('parentQuotation', 'quotationNumber revision')
      .populate('convertedToOrder', 'orderNumber')
      .populate('preparedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('createdBy', 'name')

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }

    res.json({ success: true, data: quotation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create quotation
router.post('/', requireModulePermission('quotations', 'edit'), async (req, res) => {
  try {
    const quotation = await Quotation.create({
      ...req.body,
      company: req.activeCompany._id,
      preparedBy: req.user._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'Quotation created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    const populatedQuotation = await Quotation.findById(quotation._id)
      .populate('customer', 'name customerId')
      .populate('lead', 'name')

    res.status(201).json({ success: true, data: populatedQuotation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update quotation
router.put('/:id', requireModulePermission('quotations', 'edit'), async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }

    if (!['draft', 'negotiating'].includes(quotation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update quotation in current status'
      })
    }

    Object.assign(quotation, req.body)
    quotation.activities.push({
      action: 'updated',
      description: 'Quotation updated',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await quotation.save()

    res.json({ success: true, data: quotation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Send quotation to customer
router.put('/:id/send', requireModulePermission('quotations', 'edit'), async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }

    quotation.status = 'sent'
    quotation.sentAt = new Date()
    quotation.activities.push({
      action: 'sent',
      description: 'Quotation sent to customer',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await quotation.save()

    res.json({ success: true, data: quotation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Mark as viewed
router.put('/:id/viewed', requireModulePermission('quotations', 'edit'), async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }

    if (!quotation.viewedAt) {
      quotation.status = 'viewed'
      quotation.viewedAt = new Date()
      quotation.activities.push({
        action: 'viewed',
        description: 'Quotation viewed by customer',
        performedBy: req.user._id,
        performedByName: req.user.name
      })

      await quotation.save()
    }

    res.json({ success: true, data: quotation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Accept quotation
router.put('/:id/accept', requireModulePermission('quotations', 'edit'), async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }

    quotation.status = 'accepted'
    quotation.acceptedAt = new Date()
    quotation.activities.push({
      action: 'accepted',
      description: req.body.notes || 'Quotation accepted by customer',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await quotation.save()

    res.json({ success: true, data: quotation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reject quotation
router.put('/:id/reject', requireModulePermission('quotations', 'edit'), async (req, res) => {
  try {
    const { reason } = req.body

    const quotation = await Quotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }

    quotation.status = 'rejected'
    quotation.rejectedAt = new Date()
    quotation.rejectionReason = reason
    quotation.activities.push({
      action: 'rejected',
      description: reason || 'Quotation rejected by customer',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await quotation.save()

    res.json({ success: true, data: quotation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create revision
router.post('/:id/revision', requireModulePermission('quotations', 'edit'), async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }

    const newQuotation = await quotation.createRevision(req.user._id, req.user.name)

    const populatedQuotation = await Quotation.findById(newQuotation._id)
      .populate('customer', 'name customerId')
      .populate('parentQuotation', 'quotationNumber')

    res.status(201).json({ success: true, data: populatedQuotation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add negotiation
router.post('/:id/negotiate', requireModulePermission('quotations', 'edit'), async (req, res) => {
  try {
    const { proposedAmount, notes, proposedBy } = req.body

    const quotation = await Quotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' })
    }

    quotation.status = 'negotiating'
    quotation.negotiationHistory.push({
      proposedAmount,
      proposedBy: proposedBy || 'company',
      proposedAt: new Date(),
      notes,
      status: 'proposed'
    })
    quotation.activities.push({
      action: 'negotiation_added',
      description: `New proposal: ${proposedAmount}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await quotation.save()

    res.json({ success: true, data: quotation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Convert to sales order
router.post('/:id/convert', requireModulePermission('quotations', 'edit'), async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'accepted'
    })

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found or not accepted' })
    }

    // Create sales order logic would go here
    // For now, just mark as converted
    quotation.status = 'converted'
    quotation.activities.push({
      action: 'converted',
      description: 'Quotation converted to sales order',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await quotation.save()

    res.json({ success: true, data: quotation, message: 'Quotation converted. Sales order creation pending.' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete quotation
router.delete('/:id', requireModulePermission('quotations', 'edit'), async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Quotation deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
