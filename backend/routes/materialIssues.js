import express from 'express'
import mongoose from 'mongoose'
import MaterialIssue from '../models/MaterialIssue.js'
import WorkOrder from '../models/WorkOrder.js'
import Material from '../models/Material.js'
import Stock from '../models/Stock.js'
import StockMovement from '../models/StockMovement.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// Get all material issues
router.get('/', async (req, res) => {
  try {
    const {
      status,
      workOrder,
      project,
      material,
      issueDate,
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
    if (workOrder) queryFilter.workOrder = workOrder
    if (project) queryFilter.project = project
    if (material) queryFilter.material = material
    if (issueDate) {
      const date = new Date(issueDate)
      queryFilter.issueDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    }
    if (search) {
      queryFilter.$or = [
        { issueId: { $regex: search, $options: 'i' } },
        { 'materialDetails.name': { $regex: search, $options: 'i' } },
        { 'materialDetails.skuCode': { $regex: search, $options: 'i' } }
      ]
    }

    const total = await MaterialIssue.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const issues = await MaterialIssue.find(queryFilter)
      .populate('material', 'skuCode materialName unit')
      .populate('workOrder', 'workOrderId item.name')
      .populate('project', 'title projectId')
      .populate('issuedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await MaterialIssue.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalCost' }
        }
      }
    ])

    res.json({
      success: true,
      data: issues,
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

// Get single material issue
router.get('/:id', async (req, res) => {
  try {
    const issue = await MaterialIssue.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('material', 'skuCode materialName unit unitPrice')
      .populate('workOrder', 'workOrderId item.name schedule')
      .populate('project', 'title projectId')
      .populate('issuedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('consumption.recordedBy', 'name')

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Material issue not found' })
    }

    res.json({ success: true, data: issue })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Issue material
router.post('/', async (req, res) => {
  try {
    const {
      workOrder: workOrderId,
      material: materialId,
      quantityIssued,
      sourceWarehouse,
      issueToLocation,
      batchNumber,
      notes
    } = req.body

    // Get work order
    const workOrder = await WorkOrder.findOne({
      _id: workOrderId,
      company: req.activeCompany._id
    })

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    // Get material
    const material = await Material.findById(materialId)
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    // Check stock availability
    const stock = await Stock.findOne({
      company: req.activeCompany._id,
      material: materialId,
      warehouse: sourceWarehouse?.warehouse
    })

    if (!stock || stock.quantity < quantityIssued) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${stock?.quantity || 0}, Requested: ${quantityIssued}`
      })
    }

    // Create material issue
    const issue = await MaterialIssue.issueMaterial({
      company: req.activeCompany._id,
      workOrder: workOrderId,
      project: workOrder.project,
      material: materialId,
      quantityIssued,
      unitCost: material.unitPrice || 0,
      sourceWarehouse,
      issueToLocation,
      batchNumber,
      notes,
      issuedBy: req.user._id,
      issuedByName: req.user.name
    })

    const populatedIssue = await MaterialIssue.findById(issue._id)
      .populate('material', 'skuCode materialName')
      .populate('workOrder', 'workOrderId item.name')

    res.status(201).json({ success: true, data: populatedIssue })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Bulk issue materials
router.post('/bulk', async (req, res) => {
  try {
    const { workOrder: workOrderId, materials, sourceWarehouse } = req.body

    const workOrder = await WorkOrder.findOne({
      _id: workOrderId,
      company: req.activeCompany._id
    })

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    const issues = []
    const errors = []

    for (const item of materials) {
      try {
        const material = await Material.findById(item.material)
        if (!material) {
          errors.push({ material: item.material, error: 'Material not found' })
          continue
        }

        const stock = await Stock.findOne({
          company: req.activeCompany._id,
          material: item.material
        })

        if (!stock || stock.quantity < item.quantity) {
          errors.push({
            material: material.materialName,
            error: `Insufficient stock. Available: ${stock?.quantity || 0}`
          })
          continue
        }

        const issue = await MaterialIssue.issueMaterial({
          company: req.activeCompany._id,
          workOrder: workOrderId,
          project: workOrder.project,
          material: item.material,
          quantityIssued: item.quantity,
          unitCost: material.unitPrice || 0,
          sourceWarehouse,
          issuedBy: req.user._id,
          issuedByName: req.user.name
        })

        issues.push(issue)
      } catch (err) {
        errors.push({ material: item.material, error: err.message })
      }
    }

    res.json({
      success: true,
      data: {
        issued: issues,
        errors
      },
      message: `Issued ${issues.length} materials, ${errors.length} errors`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Record consumption
router.post('/:id/consumption', async (req, res) => {
  try {
    const { quantityConsumed, scrapQuantity, notes } = req.body

    const issue = await MaterialIssue.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Material issue not found' })
    }

    await issue.recordConsumption(
      quantityConsumed,
      scrapQuantity || 0,
      req.user._id,
      req.user.name,
      notes
    )

    res.json({ success: true, data: issue })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Return material
router.post('/:id/return', async (req, res) => {
  try {
    const { quantityReturned, reason, returnToWarehouse } = req.body

    const issue = await MaterialIssue.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Material issue not found' })
    }

    await issue.returnMaterial(
      quantityReturned,
      reason,
      req.user._id,
      req.user.name
    )

    // Add stock back
    const stock = await Stock.findOne({
      company: req.activeCompany._id,
      material: issue.material,
      warehouse: returnToWarehouse || issue.sourceWarehouse?.warehouse
    })

    if (stock) {
      stock.quantity += quantityReturned
      await stock.save()

      // Create stock movement
      await StockMovement.create({
        company: req.activeCompany._id,
        material: issue.material,
        type: 'return',
        quantity: quantityReturned,
        fromWarehouse: issue.issueToLocation?.name,
        toWarehouse: returnToWarehouse || issue.sourceWarehouse?.name,
        reference: 'MaterialIssue',
        referenceId: issue._id,
        referenceNumber: issue.issueId,
        notes: `Return from production: ${reason}`,
        createdBy: req.user._id
      })
    }

    res.json({ success: true, data: issue })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve issue
router.put('/:id/approve', async (req, res) => {
  try {
    const issue = await MaterialIssue.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'pending_approval'
    })

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Material issue not found or not pending approval' })
    }

    issue.status = 'issued'
    issue.approvedBy = req.user._id
    issue.approvedByName = req.user.name
    issue.approvedAt = new Date()

    await issue.save()

    res.json({ success: true, data: issue })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get issues by work order
router.get('/work-order/:workOrderId', async (req, res) => {
  try {
    const issues = await MaterialIssue.find({
      workOrder: req.params.workOrderId,
      company: req.activeCompany._id
    })
      .populate('material', 'skuCode materialName unit')
      .sort({ issueDate: -1 })

    // Calculate totals
    const summary = {
      totalIssued: 0,
      totalConsumed: 0,
      totalScrap: 0,
      totalReturned: 0,
      totalCost: 0
    }

    for (const issue of issues) {
      summary.totalIssued += issue.quantityIssued
      summary.totalConsumed += issue.consumption?.totalConsumed || 0
      summary.totalScrap += issue.consumption?.totalScrap || 0
      summary.totalReturned += issue.quantityReturned || 0
      summary.totalCost += issue.totalCost
    }

    res.json({
      success: true,
      data: {
        issues,
        summary
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get daily issue report
router.get('/reports/daily', async (req, res) => {
  try {
    const { date, project } = req.query

    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

    const match = {
      company: req.activeCompany._id,
      issueDate: { $gte: startOfDay, $lte: endOfDay }
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)

    const issues = await MaterialIssue.find(match)
      .populate('material', 'skuCode materialName category')
      .populate('workOrder', 'workOrderId item.name')
      .populate('issuedBy', 'name')

    const summary = await MaterialIssue.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalIssues: { $sum: 1 },
          totalQuantity: { $sum: '$quantityIssued' },
          totalValue: { $sum: '$totalCost' }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        date: targetDate,
        issues,
        summary: summary[0] || { totalIssues: 0, totalQuantity: 0, totalValue: 0 }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get consumption analysis
router.get('/reports/consumption', async (req, res) => {
  try {
    const { startDate, endDate, workOrder, project } = req.query

    const match = {
      company: req.activeCompany._id,
      'consumption.totalConsumed': { $gt: 0 }
    }

    if (workOrder) match.workOrder = new mongoose.Types.ObjectId(workOrder)
    if (project) match.project = new mongoose.Types.ObjectId(project)
    if (startDate || endDate) {
      match.issueDate = {}
      if (startDate) match.issueDate.$gte = new Date(startDate)
      if (endDate) match.issueDate.$lte = new Date(endDate)
    }

    const analysis = await MaterialIssue.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$material',
          materialName: { $first: '$materialDetails.name' },
          totalIssued: { $sum: '$quantityIssued' },
          totalConsumed: { $sum: '$consumption.totalConsumed' },
          totalScrap: { $sum: '$consumption.totalScrap' },
          totalReturned: { $sum: '$quantityReturned' },
          totalCost: { $sum: '$totalCost' },
          issueCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          utilizationRate: {
            $multiply: [
              { $divide: ['$totalConsumed', { $max: ['$totalIssued', 1] }] },
              100
            ]
          },
          scrapRate: {
            $multiply: [
              { $divide: ['$totalScrap', { $max: ['$totalConsumed', 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { totalCost: -1 } }
    ])

    res.json({ success: true, data: analysis })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
