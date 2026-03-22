import express from 'express'
import WorkOrder from '../models/WorkOrder.js'
import BillOfMaterials from '../models/BillOfMaterials.js'
import MaterialRequirement from '../models/MaterialRequirement.js'
import Project from '../models/Project.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('work_orders', 'view'))

// Get all work orders
router.get('/', async (req, res) => {
  try {
    const {
      status,
      project,
      priority,
      assignedTo,
      search,
      startDate,
      endDate,
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
    if (project) queryFilter.project = project
    if (priority) queryFilter.priority = priority
    if (assignedTo) queryFilter['assignment.assignedTo'] = assignedTo
    if (search) {
      queryFilter.$or = [
        { workOrderId: { $regex: search, $options: 'i' } },
        { 'item.name': { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } }
      ]
    }
    if (startDate || endDate) {
      queryFilter['schedule.plannedStartDate'] = {}
      if (startDate) queryFilter['schedule.plannedStartDate'].$gte = new Date(startDate)
      if (endDate) queryFilter['schedule.plannedStartDate'].$lte = new Date(endDate)
    }

    const total = await WorkOrder.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const orders = await WorkOrder.find(queryFilter)
      .populate('project', 'title projectId')
      .populate('assignedTo', 'name')
      .populate('supervisor', 'name')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await WorkOrder.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity.ordered' }
        }
      }
    ])

    // Get priority stats
    const priorityStats = await WorkOrder.aggregate([
      { $match: { company: req.activeCompany._id, status: { $nin: ['completed', 'closed', 'cancelled'] } } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      data: orders,
      stats,
      priorityStats,
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

// Get single work order
router.get('/:id', async (req, res) => {
  try {
    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('project', 'title projectId client financials')
      .populate('designIteration', 'iterationNumber designName')
      .populate('bom', 'bomId name')
      .populate('assignedTo', 'name email phone')
      .populate('supervisor', 'name email')
      .populate('laborTeam.employee', 'name')
      .populate('materialRequirements', 'materialDetails quantity status')
      .populate('createdBy', 'name')
      .populate('lastModifiedBy', 'name')

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create work order
router.post('/', async (req, res) => {
  try {
    const order = new WorkOrder({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'Work order created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    // If project is provided, get project name
    if (req.body.project) {
      const project = await Project.findById(req.body.project)
      if (project) {
        order.projectName = project.title
      }
    }

    await order.save()

    const populatedOrder = await WorkOrder.findById(order._id)
      .populate('project', 'title projectId')
      .populate('assignedTo', 'name')

    res.status(201).json({ success: true, data: populatedOrder })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create work order from BOM
router.post('/from-bom/:bomId', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({
      _id: req.params.bomId,
      company: req.activeCompany._id
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' })
    }

    if (bom.status !== 'approved' && bom.status !== 'active') {
      return res.status(400).json({ success: false, message: 'BOM must be approved before creating work order' })
    }

    const order = new WorkOrder({
      company: req.activeCompany._id,
      project: bom.project,
      projectName: bom.projectName,
      designIteration: bom.designIteration,
      bom: bom._id,
      item: {
        name: bom.product.name || bom.name,
        code: bom.product.code,
        category: bom.product.category,
        specifications: bom.product.specifications
      },
      quantity: {
        ordered: req.body.quantity || bom.baseQuantity
      },
      estimatedCost: {
        material: bom.costSummary.materialCost * (req.body.quantity || 1),
        labor: bom.costSummary.laborCost * (req.body.quantity || 1),
        overhead: bom.costSummary.overheadCost * (req.body.quantity || 1),
        total: bom.costSummary.totalCost * (req.body.quantity || 1)
      },
      ...req.body,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: `Work order created from BOM ${bom.bomId}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    await order.save()

    // Run MRP for the work order
    if (bom.items && bom.items.length > 0) {
      await MaterialRequirement.runMRP(order._id, bom.items, req.user._id)
    }

    const populatedOrder = await WorkOrder.findById(order._id)
      .populate('project', 'title projectId')
      .populate('bom', 'bomId name')

    res.status(201).json({ success: true, data: populatedOrder })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update work order
router.put('/:id', async (req, res) => {
  try {
    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    // Only allow updates to draft and planned orders
    if (!['draft', 'planned', 'on_hold'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update work order in current status'
      })
    }

    Object.assign(order, req.body)
    order.lastModifiedBy = req.user._id
    order.activities.push({
      action: 'updated',
      description: 'Work order updated',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Release work order (draft -> planned)
router.put('/:id/release', async (req, res) => {
  try {
    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found or not in draft status' })
    }

    order.status = 'planned'
    order.activities.push({
      action: 'status_change',
      description: 'Work order released for planning',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Start production
router.put('/:id/start', async (req, res) => {
  try {
    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    if (!['planned', 'material_ready'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Work order must be planned or material ready to start' })
    }

    await order.startProduction(req.user._id, req.user.name)

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update progress
router.put('/:id/progress', async (req, res) => {
  try {
    const { completedQuantity, notes } = req.body

    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'in_progress'
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found or not in progress' })
    }

    await order.updateProgress(completedQuantity, req.user._id, req.user.name, notes)

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Complete work order
router.put('/:id/complete', async (req, res) => {
  try {
    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'in_progress'
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found or not in progress' })
    }

    await order.complete(req.user._id, req.user.name)

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Put on hold
router.put('/:id/hold', async (req, res) => {
  try {
    const { reason } = req.body

    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    if (['completed', 'closed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot put completed/closed order on hold' })
    }

    order.status = 'on_hold'
    order.activities.push({
      action: 'status_change',
      description: `Put on hold: ${reason || 'No reason provided'}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Resume from hold
router.put('/:id/resume', async (req, res) => {
  try {
    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'on_hold'
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found or not on hold' })
    }

    // Resume to in_progress if it was started before, otherwise to planned
    order.status = order.schedule.actualStartDate ? 'in_progress' : 'planned'
    order.activities.push({
      action: 'status_change',
      description: 'Resumed from hold',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Cancel work order
router.put('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body

    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    if (['completed', 'closed'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel completed/closed order' })
    }

    order.status = 'cancelled'
    order.activities.push({
      action: 'cancelled',
      description: reason || 'Work order cancelled',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add activity/checkpoint
router.post('/:id/activities', async (req, res) => {
  try {
    const { name, description, status, notes } = req.body

    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    order.activities.push({
      action: name || 'checkpoint',
      description: description || notes,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Record quality check
router.post('/:id/quality-check', async (req, res) => {
  try {
    const { passed, checkedBy, results, notes } = req.body

    const order = await WorkOrder.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    order.qualityCheck = {
      required: true,
      passed,
      checkedBy: checkedBy || req.user._id,
      checkedByName: req.user.name,
      checkedAt: new Date(),
      results,
      notes
    }

    order.activities.push({
      action: 'quality_check',
      description: `Quality check ${passed ? 'passed' : 'failed'}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await order.save()

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get work orders by project
router.get('/project/:projectId', async (req, res) => {
  try {
    const orders = await WorkOrder.find({
      project: req.params.projectId,
      company: req.activeCompany._id
    })
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: orders })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get work order summary/dashboard
router.get('/summary/dashboard', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    // Get counts by status
    const statusCounts = await WorkOrder.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    // Get overdue work orders
    const overdue = await WorkOrder.countDocuments({
      company: companyId,
      status: { $in: ['planned', 'in_progress', 'material_ready'] },
      'schedule.plannedEndDate': { $lt: new Date() }
    })

    // Get work orders due this week
    const endOfWeek = new Date()
    endOfWeek.setDate(endOfWeek.getDate() + 7)
    const dueThisWeek = await WorkOrder.countDocuments({
      company: companyId,
      status: { $in: ['planned', 'in_progress', 'material_ready'] },
      'schedule.plannedEndDate': { $gte: new Date(), $lte: endOfWeek }
    })

    // Get recent activity
    const recentOrders = await WorkOrder.find({ company: companyId })
      .select('workOrderId item.name status progress.percentage schedule')
      .sort({ updatedAt: -1 })
      .limit(10)

    res.json({
      success: true,
      data: {
        statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
        overdue,
        dueThisWeek,
        recentOrders
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete work order (only drafts)
router.delete('/:id', async (req, res) => {
  try {
    const order = await WorkOrder.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Work order not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Work order deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
