import express from 'express'
import PurchaseRequisition from '../models/PurchaseRequisition.js'
import RequestForQuotation from '../models/RequestForQuotation.js'
import Material from '../models/Material.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// Get all purchase requisitions
router.get('/', async (req, res) => {
  try {
    const {
      status,
      project,
      requestedBy,
      priority,
      search,
      city,
      category,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (project) queryFilter.project = project
    if (requestedBy) queryFilter.requestedBy = requestedBy
    if (priority) queryFilter.priority = priority
    if (search) {
      queryFilter.$or = [
        { prNumber: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } }
      ]
    }

    // Filter by project city or category - need to find matching project IDs first
    if (city || category) {
      const Project = (await import('../models/Project.js')).default
      const projectFilter = { company: req.activeCompany._id }
      if (city) projectFilter['location.city'] = { $regex: city, $options: 'i' }
      if (category) projectFilter.category = category
      const matchingProjectIds = await Project.find(projectFilter).distinct('_id')
      queryFilter.project = queryFilter.project
        ? { $in: matchingProjectIds.filter(id => id.toString() === queryFilter.project) }
        : { $in: matchingProjectIds }
    }

    const total = await PurchaseRequisition.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const requisitions = await PurchaseRequisition.find(queryFilter)
      .populate('project', 'title projectId location category')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: requisitions,
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

// Get single purchase requisition
router.get('/:id', async (req, res) => {
  try {
    const requisition = await PurchaseRequisition.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('project', 'title projectId')
      .populate('requestedBy', 'name email department')
      .populate('approvedBy', 'name')
      .populate('lineItems.suggestedVendor', 'name vendorId')
      .populate('linkedPurchaseOrders', 'poNumber status')

    if (!requisition) {
      return res.status(404).json({ success: false, message: 'Purchase requisition not found' })
    }

    res.json({ success: true, data: requisition })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create purchase requisition
router.post('/', async (req, res) => {
  try {
    console.log('Creating PR with body:', JSON.stringify(req.body, null, 2))
    console.log('Active company:', req.activeCompany?._id)
    console.log('User:', req.user?._id)

    const requisition = await PurchaseRequisition.create({
      ...req.body,
      company: req.activeCompany._id,
      requestedBy: req.user._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'Purchase requisition created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    const populatedRequisition = await PurchaseRequisition.findById(requisition._id)
      .populate('requestedBy', 'name')
      .populate('project', 'title projectId')

    res.status(201).json({ success: true, data: populatedRequisition })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update purchase requisition
router.put('/:id', async (req, res) => {
  try {
    const requisition = await PurchaseRequisition.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!requisition) {
      return res.status(404).json({ success: false, message: 'Purchase requisition not found' })
    }

    if (!['draft', 'submitted'].includes(requisition.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update requisition in current status'
      })
    }

    Object.assign(requisition, req.body)
    requisition.activities.push({
      action: 'updated',
      description: 'Purchase requisition updated',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await requisition.save()

    res.json({ success: true, data: requisition })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Submit for approval
router.put('/:id/submit', async (req, res) => {
  try {
    const requisition = await PurchaseRequisition.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!requisition) {
      return res.status(404).json({ success: false, message: 'Purchase requisition not found or not in draft status' })
    }

    requisition.status = 'pending_approval'
    requisition.activities.push({
      action: 'submitted',
      description: 'Submitted for approval',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await requisition.save()

    res.json({ success: true, data: requisition })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve purchase requisition and auto-create RFQ
router.put('/:id/approve', async (req, res) => {
  try {
    const requisition = await PurchaseRequisition.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'pending_approval'
    }).populate('lineItems.material')

    if (!requisition) {
      return res.status(404).json({ success: false, message: 'Purchase requisition not found or not pending approval' })
    }

    requisition.status = 'approved'
    requisition.approvalStatus = 'approved'
    requisition.approvedBy = req.user._id
    requisition.approvedAt = new Date()
    requisition.approvalRemarks = req.body.remarks
    requisition.activities.push({
      action: 'approved',
      description: req.body.remarks || 'Purchase requisition approved',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await requisition.save()

    // Auto-create RFQ and send to selected target vendor
    let rfqCreated = null
    try {
      // Use the targetVendor selected in the PR form
      const vendorIdArray = requisition.targetVendor ? [requisition.targetVendor.toString()] : []

      // Only create RFQ if there is a vendor selected
      if (vendorIdArray.length > 0) {

        // Set quotation deadline to 7 days from now
        const quotationDeadline = new Date()
        quotationDeadline.setDate(quotationDeadline.getDate() + 7)

        // Create RFQ
        const rfq = await RequestForQuotation.create({
          company: req.activeCompany._id,
          purchaseRequisition: requisition._id,
          project: requisition.project,
          title: `RFQ for ${requisition.prNumber}`,
          description: requisition.purpose,
          lineItems: requisition.lineItems.map(item => ({
            material: item.material?._id || item.material,
            description: item.description,
            itemCode: item.itemCode,
            unit: item.unit,
            quantity: item.quantity,
            specifications: item.specifications,
            requiredDate: item.requiredDate || requisition.requiredDate
          })),
          invitedVendors: vendorIdArray,
          vendorQuotations: vendorIdArray.map(vendorId => ({
            vendor: vendorId,
            status: 'pending',
            quotedItems: [],
            totalQuotedAmount: 0
          })),
          quotationDeadline,
          requiredDeliveryDate: requisition.requiredDate,
          status: 'sent',
          createdBy: req.user._id,
          activities: [{
            action: 'created',
            description: `RFQ auto-created from approved PR ${requisition.prNumber}`,
            performedBy: req.user._id,
            performedByName: req.user.name
          }, {
            action: 'sent',
            description: `RFQ sent to ${vendorIdArray.length} vendor(s)`,
            performedBy: req.user._id,
            performedByName: req.user.name
          }]
        })

        rfqCreated = rfq

        // Update requisition with activity
        requisition.activities.push({
          action: 'rfq_created',
          description: `RFQ ${rfq.rfqNumber} created and sent to ${vendorIdArray.length} vendor(s)`,
          performedBy: req.user._id,
          performedByName: req.user.name
        })
        await requisition.save()
      }
    } catch (rfqError) {
      console.error('Error creating RFQ:', rfqError)
      // Don't fail the approval if RFQ creation fails
    }

    res.json({
      success: true,
      data: requisition,
      rfq: rfqCreated,
      message: rfqCreated
        ? `Approved and RFQ ${rfqCreated.rfqNumber} sent to vendor`
        : 'Approved (no vendor selected)'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reject purchase requisition
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' })
    }

    const requisition = await PurchaseRequisition.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'pending_approval'
    })

    if (!requisition) {
      return res.status(404).json({ success: false, message: 'Purchase requisition not found or not pending approval' })
    }

    requisition.status = 'rejected'
    requisition.approvalStatus = 'rejected'
    requisition.rejectionReason = reason
    requisition.activities.push({
      action: 'rejected',
      description: `Rejected: ${reason}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await requisition.save()

    res.json({ success: true, data: requisition })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete purchase requisition (Super Admin only)
router.delete('/:id', async (req, res) => {
  try {
    // Only super admin can delete purchase requisitions
    const userRole = req.user?.role?.toLowerCase() || ''
    if (userRole !== 'super_admin' && userRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can delete purchase requisitions'
      })
    }

    const requisition = await PurchaseRequisition.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!requisition) {
      return res.status(404).json({ success: false, message: 'Purchase requisition not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Purchase requisition deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
