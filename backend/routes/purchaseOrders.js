import express from 'express'
import PurchaseOrder from '../models/PurchaseOrder.js'
import Vendor from '../models/Vendor.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  requireModulePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'
import { notifyProcurementEvent } from '../utils/notificationService.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('purchase_orders', 'view'))

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const {
      status,
      vendor,
      project,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) {
      if (status.includes(',')) {
        queryFilter.status = { $in: status.split(',') }
      } else {
        queryFilter.status = status
      }
    }
    if (vendor) queryFilter.vendor = vendor
    if (project) queryFilter.project = project
    if (search) {
      queryFilter.$or = [
        { poNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await PurchaseOrder.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const orders = await PurchaseOrder.find(queryFilter)
      .populate('vendor', 'name vendorId contactPerson')
      .populate('project', 'title projectId')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await PurchaseOrder.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$poTotal' }
        }
      }
    ])

    res.json({
      success: true,
      data: orders,
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

// Get single purchase order
router.get('/:id', async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('vendor', 'name vendorId email phone contactPerson address bankDetails')
      .populate('project', 'title projectId')
      .populate('purchaseRequisition', 'prNumber')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' })
    }

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create purchase order
router.post('/', async (req, res) => {
  try {
    // Use new + save instead of create so pre-save hook can generate poNumber
    const order = new PurchaseOrder({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'Purchase order created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })
    await order.save()

    const populatedOrder = await PurchaseOrder.findById(order._id)
      .populate('vendor', 'name vendorId')
      .populate('project', 'title projectId')

    res.status(201).json({ success: true, data: populatedOrder })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update purchase order
router.put('/:id', async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' })
    }

    // Only allow updates to draft orders
    if (!['draft', 'pending_approval'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update order in current status'
      })
    }

    Object.assign(order, req.body)
    order.activities.push({
      action: 'updated',
      description: 'Purchase order updated',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Submit for approval
router.put('/:id/submit', async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found or not in draft status' })
    }

    order.status = 'pending_approval'
    order.activities.push({
      action: 'submitted',
      description: 'Submitted for approval',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve purchase order
router.put('/:id/approve', async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'pending_approval'
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found or not pending approval' })
    }

    order.status = 'approved'
    order.approvalStatus = 'approved'
    order.approvedBy = req.user._id
    order.approvedAt = new Date()
    order.approvalRemarks = req.body.remarks
    order.activities.push({
      action: 'approved',
      description: req.body.remarks || 'Purchase order approved',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    // Auto-update project committedCost when PO is approved
    if (order.project) {
      try {
        const Project = (await import('../models/Project.js')).default
        const project = await Project.findById(order.project)
        if (project && project.budget) {
          const approvedPOTotal = await PurchaseOrder.aggregate([
            { $match: { project: order.project, status: { $in: ['approved', 'sent', 'confirmed', 'partially_delivered', 'fully_delivered', 'invoiced'] }, company: order.company } },
            { $group: { _id: null, total: { $sum: '$poTotal' } } }
          ])
          project.budget.committedCost = approvedPOTotal[0]?.total || 0
          project.budget.variance = (project.budget.currentBudget || project.budget.originalBudget || 0) - (project.budget.actualCost || 0)
          await project.save()
        }
      } catch (err) {
        console.error('Failed to update project committedCost:', err.message)
      }
    }

    // Notify procurement team about PO approval
    try {
      const vendorDoc = await Vendor.findById(order.vendor).select('name').lean()
      await notifyProcurementEvent('po_acknowledged', {
        purchaseOrder: order,
        vendor: vendorDoc || { name: 'Unknown Vendor' },
        company: req.activeCompany,
        performedBy: req.user._id
      })
    } catch (e) {
      console.error('Notification error:', e)
    }

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reject purchase order
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' })
    }

    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'pending_approval'
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found or not pending approval' })
    }

    order.status = 'draft'
    order.approvalStatus = 'rejected'
    order.approvalRemarks = reason
    order.activities.push({
      action: 'rejected',
      description: `Rejected: ${reason}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Send to vendor
router.put('/:id/send', async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'approved'
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found or not approved' })
    }

    order.status = 'sent'
    order.activities.push({
      action: 'sent',
      description: 'Purchase order sent to vendor',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Cancel purchase order
router.put('/:id/cancel', async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' })
    }

    if (['paid', 'closed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel completed order' })
    }

    order.status = 'cancelled'
    order.activities.push({
      action: 'cancelled',
      description: req.body.reason || 'Purchase order cancelled',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete purchase order (Super Admin only)
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admin can delete' })
    }

    const order = await PurchaseOrder.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Purchase order deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
