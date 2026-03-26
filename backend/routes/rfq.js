import express from 'express'
import RequestForQuotation from '../models/RequestForQuotation.js'
import Material from '../models/Material.js'
import Vendor from '../models/Vendor.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'
import { notifyProcurementEvent } from '../utils/notificationService.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('rfq', 'view'))

// Get all RFQs
router.get('/', async (req, res) => {
  try {
    const {
      status,
      vendor,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (vendor) queryFilter.invitedVendors = vendor
    if (search) {
      queryFilter.$or = [
        { rfqNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await RequestForQuotation.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const rfqs = await RequestForQuotation.find(queryFilter)
      .populate('project', 'title projectId')
      .populate('purchaseRequisition', 'prNumber')
      .populate('invitedVendors', 'name vendorId email')
      .populate('awardedVendor', 'name vendorId')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: rfqs,
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

// Get single RFQ
router.get('/:id', async (req, res) => {
  try {
    const rfq = await RequestForQuotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('project', 'title projectId')
      .populate('purchaseRequisition', 'prNumber purpose')
      .populate('invitedVendors', 'name vendorId email phone')
      .populate('awardedVendor', 'name vendorId')
      .populate('vendorQuotations.vendor', 'name vendorId email')
      .populate('lineItems.material', 'materialName skuCode')
      .populate('createdBy', 'name')
      .populate('linkedPurchaseOrder', 'poNumber')

    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found' })
    }

    res.json({ success: true, data: rfq })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create RFQ manually
router.post('/', async (req, res) => {
  try {
    const rfq = await RequestForQuotation.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'RFQ created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    const populatedRFQ = await RequestForQuotation.findById(rfq._id)
      .populate('invitedVendors', 'name vendorId email')
      .populate('project', 'title')

    res.status(201).json({ success: true, data: populatedRFQ })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update RFQ
router.put('/:id', async (req, res) => {
  try {
    const rfq = await RequestForQuotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found' })
    }

    if (!['draft', 'sent'].includes(rfq.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update RFQ in current status'
      })
    }

    Object.assign(rfq, req.body)
    rfq.activities.push({
      action: 'updated',
      description: 'RFQ updated',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await rfq.save()

    res.json({ success: true, data: rfq })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Send RFQ to vendors
router.put('/:id/send', async (req, res) => {
  try {
    const rfq = await RequestForQuotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found or not in draft status' })
    }

    if (!rfq.invitedVendors || rfq.invitedVendors.length === 0) {
      return res.status(400).json({ success: false, message: 'No vendors invited to quote' })
    }

    // Initialize vendor quotations with pending status
    rfq.vendorQuotations = rfq.invitedVendors.map(vendorId => ({
      vendor: vendorId,
      status: 'pending',
      quotedItems: [],
      totalQuotedAmount: 0
    }))

    rfq.status = 'sent'
    rfq.activities.push({
      action: 'sent',
      description: `RFQ sent to ${rfq.invitedVendors.length} vendor(s)`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await rfq.save()

    // Notify procurement team about RFQ being sent
    try {
      const vendors = await Vendor.find({ _id: { $in: rfq.invitedVendors } }).select('name').lean()
      const vendorNames = vendors.map(v => v.name).join(', ')
      await notifyProcurementEvent('rfq_sent', {
        rfq,
        vendor: { name: vendorNames },
        company: req.activeCompany,
        performedBy: req.user._id
      })
    } catch (e) {
      console.error('Notification error:', e)
    }

    res.json({ success: true, data: rfq, message: 'RFQ sent to vendors' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Submit vendor quotation (for vendor portal)
router.put('/:id/quotation/:vendorId', async (req, res) => {
  try {
    const { quotedItems, validUntil, paymentTerms, deliveryTerms, notes } = req.body

    const rfq = await RequestForQuotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: { $in: ['sent', 'in_progress'] }
    })

    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found or closed' })
    }

    // Find vendor quotation entry
    const vendorQuotation = rfq.vendorQuotations.find(
      vq => vq.vendor.toString() === req.params.vendorId
    )

    if (!vendorQuotation) {
      return res.status(404).json({ success: false, message: 'Vendor not invited to this RFQ' })
    }

    // Update quotation
    vendorQuotation.quotedItems = quotedItems
    vendorQuotation.totalQuotedAmount = quotedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
    vendorQuotation.validUntil = validUntil
    vendorQuotation.paymentTerms = paymentTerms
    vendorQuotation.deliveryTerms = deliveryTerms
    vendorQuotation.notes = notes
    vendorQuotation.status = 'submitted'
    vendorQuotation.submittedAt = new Date()

    // Update RFQ status to in_progress if first quotation received
    if (rfq.status === 'sent') {
      rfq.status = 'in_progress'
    }

    rfq.activities.push({
      action: 'quotation_received',
      description: `Quotation received from vendor`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await rfq.save()

    // Notify procurement team that a vendor submitted a quotation
    try {
      const vendorDoc = await Vendor.findById(req.params.vendorId).select('name').lean()
      await notifyProcurementEvent('quotation_received', {
        rfq,
        vendor: vendorDoc || { name: 'Unknown Vendor' },
        company: req.activeCompany,
        performedBy: req.user._id
      })
    } catch (e) {
      console.error('Notification error:', e)
    }

    res.json({ success: true, data: rfq, message: 'Quotation submitted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Award RFQ to a vendor
router.put('/:id/award', async (req, res) => {
  try {
    const { vendorId, remarks } = req.body

    const rfq = await RequestForQuotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: { $in: ['sent', 'in_progress'] }
    })

    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found or cannot be awarded' })
    }

    // Verify vendor submitted a quotation
    const vendorQuotation = rfq.vendorQuotations.find(
      vq => vq.vendor.toString() === vendorId && vq.status === 'submitted'
    )

    if (!vendorQuotation) {
      return res.status(400).json({ success: false, message: 'Vendor has not submitted a quotation' })
    }

    // Update vendor quotation status
    vendorQuotation.status = 'accepted'

    // Mark other quotations as rejected
    rfq.vendorQuotations.forEach(vq => {
      if (vq.vendor.toString() !== vendorId && vq.status === 'submitted') {
        vq.status = 'rejected'
      }
    })

    rfq.status = 'awarded'
    rfq.awardedVendor = vendorId
    rfq.awardedAt = new Date()
    rfq.awardRemarks = remarks

    rfq.activities.push({
      action: 'awarded',
      description: `RFQ awarded to vendor${remarks ? `: ${remarks}` : ''}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await rfq.save()

    res.json({ success: true, data: rfq, message: 'RFQ awarded successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Close RFQ without awarding
router.put('/:id/close', async (req, res) => {
  try {
    const { reason } = req.body

    const rfq = await RequestForQuotation.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: { $in: ['draft', 'sent', 'in_progress'] }
    })

    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found or already closed' })
    }

    rfq.status = 'closed'
    rfq.activities.push({
      action: 'closed',
      description: reason || 'RFQ closed',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await rfq.save()

    res.json({ success: true, data: rfq, message: 'RFQ closed' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get RFQs for a specific vendor (for vendor portal)
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const rfqs = await RequestForQuotation.find({
      company: req.activeCompany._id,
      invitedVendors: req.params.vendorId,
      status: { $in: ['sent', 'in_progress', 'closed', 'awarded'] }
    })
      .populate('project', 'title')
      .populate('lineItems.material', 'materialName')
      .select('rfqNumber title lineItems quotationDeadline status vendorQuotations')

    // Filter vendor quotations to only show the requesting vendor's data
    const vendorRFQs = rfqs.map(rfq => {
      const rfqObj = rfq.toObject()
      rfqObj.myQuotation = rfqObj.vendorQuotations.find(
        vq => vq.vendor.toString() === req.params.vendorId
      )
      delete rfqObj.vendorQuotations
      return rfqObj
    })

    res.json({ success: true, data: vendorRFQs })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete RFQ (Super Admin only)
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admin can delete' })
    }

    const rfq = await RequestForQuotation.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'RFQ deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
