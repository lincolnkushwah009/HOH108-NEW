import express from 'express'
import mongoose from 'mongoose'
import MaterialRequirement from '../models/MaterialRequirement.js'
import WorkOrder from '../models/WorkOrder.js'
import PurchaseRequisition from '../models/PurchaseRequisition.js'
import Material from '../models/Material.js'
import Stock from '../models/Stock.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('mrp', 'view'))

// Get all material requirements (MRP)
router.get('/', async (req, res) => {
  try {
    const {
      status,
      workOrder,
      project,
      hasShortfall,
      search,
      page = 1,
      limit = 20,
      sortBy = 'requiredByDate',
      sortOrder = 'asc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) {
      if (status.includes(',')) {
        queryFilter.status = { $in: status.split(',') }
      } else {
        queryFilter.status = status
      }
    }
    if (workOrder) queryFilter.workOrder = workOrder
    if (project) queryFilter.project = project
    if (hasShortfall === 'true') {
      queryFilter['quantity.shortfall'] = { $gt: 0 }
    }
    if (search) {
      queryFilter.$or = [
        { mrpId: { $regex: search, $options: 'i' } },
        { 'materialDetails.name': { $regex: search, $options: 'i' } },
        { 'materialDetails.skuCode': { $regex: search, $options: 'i' } }
      ]
    }

    const total = await MaterialRequirement.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const requirements = await MaterialRequirement.find(queryFilter)
      .populate('material', 'skuCode materialName unit unitPrice leadTime')
      .populate('workOrder', 'workOrderId item.name')
      .populate('project', 'title projectId')
      .populate('purchaseRequisition', 'prNumber status')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get shortfall summary
    const shortfallSummary = await MaterialRequirement.aggregate([
      { $match: { company: req.activeCompany._id, 'quantity.shortfall': { $gt: 0 } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalShortfall: { $sum: '$quantity.shortfall' },
          totalCost: { $sum: '$totalCost' }
        }
      }
    ])

    res.json({
      success: true,
      data: requirements,
      shortfallSummary,
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

// Get single material requirement
router.get('/:id', async (req, res) => {
  try {
    const requirement = await MaterialRequirement.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('material', 'skuCode materialName unit unitPrice leadTime preferredVendors stockQuantity')
      .populate('workOrder', 'workOrderId item.name schedule')
      .populate('project', 'title projectId')
      .populate('purchaseRequisition', 'prNumber status')
      .populate('purchaseOrder', 'poNumber status')
      .populate('createdBy', 'name')

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Material requirement not found' })
    }

    res.json({ success: true, data: requirement })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Run MRP for a work order
router.post('/run-mrp/:workOrderId', async (req, res) => {
  try {
    const workOrder = await WorkOrder.findOne({
      _id: req.params.workOrderId,
      company: req.activeCompany._id
    }).populate('bom')

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    if (!workOrder.bom || !workOrder.bom.items || workOrder.bom.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Work order does not have a BOM with items' })
    }

    // Run MRP
    const requirements = await MaterialRequirement.runMRP(
      workOrder._id,
      workOrder.bom.items,
      req.user._id
    )

    // Update work order with material requirements
    workOrder.materialRequirements = requirements.map(r => r._id)
    await workOrder.save()

    res.json({ success: true, data: requirements, message: `MRP generated ${requirements.length} material requirements` })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Refresh stock levels for requirements
router.post('/refresh-stock', async (req, res) => {
  try {
    const { requirementIds } = req.body

    const filter = { company: req.activeCompany._id }
    if (requirementIds && requirementIds.length > 0) {
      filter._id = { $in: requirementIds }
    } else {
      filter.status = { $in: ['pending', 'partial'] }
    }

    const requirements = await MaterialRequirement.find(filter)
    let updated = 0

    for (const req of requirements) {
      // Get current stock
      const stock = await Stock.findOne({
        company: req.company,
        material: req.material
      })

      if (stock) {
        req.quantity.stockOnHand = stock.quantity || 0
        req.quantity.reserved = stock.reserved || 0
        // Recalculate available and shortfall (handled by pre-save hook)
        await req.save()
        updated++
      }
    }

    res.json({ success: true, message: `Refreshed stock levels for ${updated} requirements` })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create PR from material requirements
router.post('/create-pr', async (req, res) => {
  try {
    const { requirementIds, vendorId, notes } = req.body

    if (!requirementIds || requirementIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No requirements selected' })
    }

    const requirements = await MaterialRequirement.find({
      _id: { $in: requirementIds },
      company: req.activeCompany._id,
      'quantity.shortfall': { $gt: 0 },
      status: { $in: ['pending', 'partial'] }
    }).populate('material workOrder project')

    if (requirements.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid requirements with shortfall' })
    }

    // Group requirements by project
    const projectGroups = {}
    for (const req of requirements) {
      const projectId = req.project._id.toString()
      if (!projectGroups[projectId]) {
        projectGroups[projectId] = {
          project: req.project,
          items: []
        }
      }
      projectGroups[projectId].items.push(req)
    }

    const createdPRs = []

    // Create PR for each project
    for (const group of Object.values(projectGroups)) {
      const prItems = group.items.map((req, index) => ({
        itemNumber: index + 1,
        material: req.material._id,
        materialName: req.materialDetails.name,
        skuCode: req.materialDetails.skuCode,
        description: req.materialDetails.description,
        quantity: req.quantity.toPurchase,
        unit: req.materialDetails.unit,
        estimatedPrice: req.unitPrice,
        totalPrice: req.quantity.toPurchase * req.unitPrice,
        requiredByDate: req.requiredByDate,
        workOrder: req.workOrder._id,
        notes: `MRP Generated - ${req.mrpId}`
      }))

      const pr = new PurchaseRequisition({
        company: req.activeCompany._id,
        project: group.project._id,
        projectName: group.project.title,
        items: prItems,
        requestedBy: req.user._id,
        requestedByName: req.user.name,
        purpose: 'Production - MRP Generated',
        notes: notes || 'Auto-generated from MRP',
        source: 'mrp',
        status: 'draft'
      })

      await pr.save()
      createdPRs.push(pr)

      // Update requirements with PR reference
      for (const req of group.items) {
        req.purchaseRequisition = pr._id
        req.status = 'pr_created'
        await req.save()
      }
    }

    res.json({
      success: true,
      data: createdPRs,
      message: `Created ${createdPRs.length} purchase requisition(s)`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update requirement status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body

    const requirement = await MaterialRequirement.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Material requirement not found' })
    }

    requirement.status = status
    if (notes) requirement.notes = notes

    await requirement.save()

    res.json({ success: true, data: requirement })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get MRP summary by work order
router.get('/work-order/:workOrderId/summary', async (req, res) => {
  try {
    const summary = await MaterialRequirement.aggregate([
      {
        $match: {
          workOrder: new mongoose.Types.ObjectId(req.params.workOrderId),
          company: req.activeCompany._id
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRequired: { $sum: '$quantity.required' },
          totalShortfall: { $sum: '$quantity.shortfall' },
          totalCost: { $sum: '$totalCost' }
        }
      }
    ])

    const materials = await MaterialRequirement.find({
      workOrder: req.params.workOrderId,
      company: req.activeCompany._id
    })
      .populate('material', 'skuCode materialName')
      .select('materialDetails quantity status')

    res.json({
      success: true,
      data: {
        summary,
        materials
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get shortfall report
router.get('/reports/shortfall', async (req, res) => {
  try {
    const { startDate, endDate, project } = req.query

    const match = {
      company: req.activeCompany._id,
      'quantity.shortfall': { $gt: 0 }
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)
    if (startDate || endDate) {
      match.requiredByDate = {}
      if (startDate) match.requiredByDate.$gte = new Date(startDate)
      if (endDate) match.requiredByDate.$lte = new Date(endDate)
    }

    const shortfalls = await MaterialRequirement.find(match)
      .populate('material', 'skuCode materialName preferredVendors')
      .populate('workOrder', 'workOrderId item.name')
      .populate('project', 'title')
      .sort({ requiredByDate: 1 })

    // Group by material
    const byMaterial = await MaterialRequirement.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$material',
          materialName: { $first: '$materialDetails.name' },
          skuCode: { $first: '$materialDetails.skuCode' },
          totalShortfall: { $sum: '$quantity.shortfall' },
          totalCost: { $sum: { $multiply: ['$quantity.shortfall', '$unitPrice'] } },
          orderCount: { $sum: 1 },
          earliestRequired: { $min: '$requiredByDate' }
        }
      },
      { $sort: { totalCost: -1 } }
    ])

    res.json({
      success: true,
      data: {
        shortfalls,
        byMaterial
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete material requirement (only pending)
router.delete('/:id', async (req, res) => {
  try {
    const requirement = await MaterialRequirement.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'pending'
    })

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Material requirement deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
