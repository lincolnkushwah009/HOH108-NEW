import express from 'express'
import ProductionCost from '../models/ProductionCost.js'
import WorkOrder from '../models/WorkOrder.js'
import Project from '../models/Project.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'
import mongoose from 'mongoose'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('production_costs', 'view'))

// Get all production costs
router.get('/', async (req, res) => {
  try {
    const {
      status,
      workOrder,
      project,
      startDate,
      endDate,
      hasVariance,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (workOrder) queryFilter.workOrder = workOrder
    if (project) queryFilter.project = project
    if (hasVariance === 'true') {
      queryFilter['variance.total'] = { $ne: 0 }
    }
    if (startDate || endDate) {
      queryFilter.createdAt = {}
      if (startDate) queryFilter.createdAt.$gte = new Date(startDate)
      if (endDate) queryFilter.createdAt.$lte = new Date(endDate)
    }
    if (search) {
      queryFilter.$or = [
        { costId: { $regex: search, $options: 'i' } },
        { workOrderId: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await ProductionCost.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const costs = await ProductionCost.find(queryFilter)
      .populate('workOrder', 'workOrderId item.name status')
      .populate('project', 'title projectId')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get summary stats
    const stats = await ProductionCost.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEstimated: { $sum: '$estimatedCosts.total' },
          totalActual: { $sum: '$actualCosts.total' },
          totalCOGS: { $sum: '$cogs.totalCOGS' }
        }
      }
    ])

    res.json({
      success: true,
      data: costs,
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

// Get single production cost
router.get('/:id', async (req, res) => {
  try {
    const cost = await ProductionCost.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('workOrder', 'workOrderId item.name status quantity schedule')
      .populate('project', 'title projectId financials')
      .populate('calculatedBy', 'name')
      .populate('finalized.finalizedBy', 'name')

    if (!cost) {
      return res.status(404).json({ success: false, message: 'Production cost not found' })
    }

    res.json({ success: true, data: cost })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Calculate costs for a work order
router.post('/calculate/:workOrderId', async (req, res) => {
  try {
    const cost = await ProductionCost.calculateForWorkOrder(
      req.params.workOrderId,
      req.user._id
    )

    const populatedCost = await ProductionCost.findById(cost._id)
      .populate('workOrder', 'workOrderId item.name')
      .populate('project', 'title projectId')

    res.json({ success: true, data: populatedCost })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Recalculate costs
router.put('/:id/recalculate', async (req, res) => {
  try {
    const cost = await ProductionCost.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!cost) {
      return res.status(404).json({ success: false, message: 'Production cost not found' })
    }

    if (cost.finalized.isFinalized) {
      return res.status(400).json({ success: false, message: 'Cannot recalculate finalized costs' })
    }

    const recalculated = await ProductionCost.calculateForWorkOrder(
      cost.workOrder,
      req.user._id
    )

    res.json({ success: true, data: recalculated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update overhead allocation
router.put('/:id/overhead', async (req, res) => {
  try {
    const { method, rate, allocatedAmount } = req.body

    const cost = await ProductionCost.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!cost) {
      return res.status(404).json({ success: false, message: 'Production cost not found' })
    }

    if (cost.finalized.isFinalized) {
      return res.status(400).json({ success: false, message: 'Cannot modify finalized costs' })
    }

    cost.overheadAllocation.method = method || cost.overheadAllocation.method
    cost.overheadAllocation.rate = rate || cost.overheadAllocation.rate

    // Recalculate overhead based on method
    let base = 0
    switch (cost.overheadAllocation.method) {
      case 'direct_labor_hours':
        // Would need labor hours from work order summary
        base = cost.actualCosts.labor
        break
      case 'direct_labor_cost':
        base = cost.actualCosts.labor
        break
      case 'material_cost':
        base = cost.actualCosts.material
        break
      case 'fixed_percentage':
        base = cost.actualCosts.material + cost.actualCosts.labor
        break
      default:
        base = cost.actualCosts.labor
    }

    cost.overheadAllocation.base = base
    cost.overheadAllocation.allocatedAmount = allocatedAmount || (base * cost.overheadAllocation.rate / 100)
    cost.actualCosts.overhead = cost.overheadAllocation.allocatedAmount

    await cost.save()

    res.json({ success: true, data: cost })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update profitability
router.put('/:id/profitability', async (req, res) => {
  try {
    const { sellingPrice } = req.body

    const cost = await ProductionCost.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!cost) {
      return res.status(404).json({ success: false, message: 'Production cost not found' })
    }

    cost.profitability.sellingPrice = sellingPrice
    // Gross profit and margin will be recalculated by pre-save hook

    await cost.save()

    res.json({ success: true, data: cost })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Verify costs
router.put('/:id/verify', async (req, res) => {
  try {
    const cost = await ProductionCost.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'calculated'
    })

    if (!cost) {
      return res.status(404).json({ success: false, message: 'Cost record not found or not calculated' })
    }

    cost.status = 'verified'
    await cost.save()

    res.json({ success: true, data: cost })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Finalize costs
router.put('/:id/finalize', async (req, res) => {
  try {
    const cost = await ProductionCost.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: { $in: ['calculated', 'verified'] }
    })

    if (!cost) {
      return res.status(404).json({ success: false, message: 'Cost record not found or not ready for finalization' })
    }

    cost.status = 'finalized'
    cost.finalized = {
      isFinalized: true,
      finalizedBy: req.user._id,
      finalizedByName: req.user.name,
      finalizedAt: new Date()
    }

    await cost.save()

    res.json({ success: true, data: cost })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add variance explanation
router.put('/:id/variance-explanation', async (req, res) => {
  try {
    const { explanation } = req.body

    const cost = await ProductionCost.findOneAndUpdate(
      {
        _id: req.params.id,
        company: req.activeCompany._id
      },
      {
        $set: { varianceExplanation: explanation }
      },
      { new: true }
    )

    if (!cost) {
      return res.status(404).json({ success: false, message: 'Cost record not found' })
    }

    res.json({ success: true, data: cost })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get project cost summary
router.get('/project/:projectId/summary', async (req, res) => {
  try {
    const summary = await ProductionCost.getProjectSummary(req.params.projectId)

    // Get work order breakdown
    const workOrderBreakdown = await ProductionCost.find({
      project: req.params.projectId,
      company: req.activeCompany._id
    })
      .populate('workOrder', 'workOrderId item.name')
      .select('workOrderId actualCosts cogs variance status')

    res.json({
      success: true,
      data: {
        summary,
        workOrderBreakdown
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get cost variance report
router.get('/reports/variance', async (req, res) => {
  try {
    const { startDate, endDate, project, threshold } = req.query

    const match = {
      company: req.activeCompany._id
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)
    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }

    // Filter by variance threshold percentage
    if (threshold) {
      match['variance.percentage'] = { $gte: parseFloat(threshold) }
    }

    const report = await ProductionCost.aggregate([
      { $match: match },
      {
        $project: {
          workOrderId: 1,
          projectName: 1,
          estimatedTotal: '$estimatedCosts.total',
          actualTotal: '$actualCosts.total',
          variance: '$variance.total',
          variancePercentage: '$variance.percentage',
          materialVariance: '$variance.material',
          laborVariance: '$variance.labor',
          overheadVariance: '$variance.overhead',
          status: 1
        }
      },
      { $sort: { variancePercentage: -1 } }
    ])

    // Summary
    const summary = await ProductionCost.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalEstimated: { $sum: '$estimatedCosts.total' },
          totalActual: { $sum: '$actualCosts.total' },
          totalVariance: { $sum: '$variance.total' },
          avgVariancePercentage: { $avg: '$variance.percentage' },
          favorableCount: { $sum: { $cond: [{ $lt: ['$variance.total', 0] }, 1, 0] } },
          unfavorableCount: { $sum: { $cond: [{ $gt: ['$variance.total', 0] }, 1, 0] } },
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        details: report,
        summary: summary[0] || {
          totalEstimated: 0,
          totalActual: 0,
          totalVariance: 0,
          avgVariancePercentage: 0,
          favorableCount: 0,
          unfavorableCount: 0,
          count: 0
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get COGS report
router.get('/reports/cogs', async (req, res) => {
  try {
    const { startDate, endDate, project, groupBy = 'month' } = req.query

    const match = {
      company: req.activeCompany._id,
      status: { $in: ['verified', 'finalized', 'posted'] }
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)
    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }

    let dateFormat
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d'
        break
      case 'week':
        dateFormat = '%Y-W%V'
        break
      case 'month':
        dateFormat = '%Y-%m'
        break
      case 'quarter':
        dateFormat = '%Y-Q%q'
        break
      default:
        dateFormat = '%Y-%m'
    }

    const report = await ProductionCost.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          directMaterial: { $sum: '$cogs.directMaterial' },
          directLabor: { $sum: '$cogs.directLabor' },
          manufacturingOverhead: { $sum: '$cogs.manufacturingOverhead' },
          totalCOGS: { $sum: '$cogs.totalCOGS' },
          unitsProduced: { $sum: '$cogs.unitsProduced' },
          workOrderCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          avgCOGSPerUnit: {
            $cond: [
              { $eq: ['$unitsProduced', 0] },
              0,
              { $divide: ['$totalCOGS', '$unitsProduced'] }
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Overall summary
    const summary = await ProductionCost.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalDirectMaterial: { $sum: '$cogs.directMaterial' },
          totalDirectLabor: { $sum: '$cogs.directLabor' },
          totalOverhead: { $sum: '$cogs.manufacturingOverhead' },
          totalCOGS: { $sum: '$cogs.totalCOGS' },
          totalUnits: { $sum: '$cogs.unitsProduced' },
          totalSellingPrice: { $sum: '$profitability.sellingPrice' },
          totalGrossProfit: { $sum: '$profitability.grossProfit' }
        }
      },
      {
        $addFields: {
          avgCOGSPerUnit: {
            $cond: [
              { $eq: ['$totalUnits', 0] },
              0,
              { $divide: ['$totalCOGS', '$totalUnits'] }
            ]
          },
          overallGrossMargin: {
            $cond: [
              { $eq: ['$totalSellingPrice', 0] },
              0,
              { $multiply: [{ $divide: ['$totalGrossProfit', '$totalSellingPrice'] }, 100] }
            ]
          }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        trend: report,
        summary: summary[0] || {
          totalDirectMaterial: 0,
          totalDirectLabor: 0,
          totalOverhead: 0,
          totalCOGS: 0,
          totalUnits: 0,
          avgCOGSPerUnit: 0
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get profitability report
router.get('/reports/profitability', async (req, res) => {
  try {
    const { startDate, endDate, project } = req.query

    const match = {
      company: req.activeCompany._id,
      'profitability.sellingPrice': { $gt: 0 }
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)
    if (startDate || endDate) {
      match.createdAt = {}
      if (startDate) match.createdAt.$gte = new Date(startDate)
      if (endDate) match.createdAt.$lte = new Date(endDate)
    }

    const report = await ProductionCost.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$project',
          projectName: { $first: '$projectName' },
          totalCOGS: { $sum: '$cogs.totalCOGS' },
          totalSellingPrice: { $sum: '$profitability.sellingPrice' },
          totalGrossProfit: { $sum: '$profitability.grossProfit' },
          workOrderCount: { $sum: 1 },
          unitsProduced: { $sum: '$cogs.unitsProduced' }
        }
      },
      {
        $addFields: {
          grossMargin: {
            $cond: [
              { $eq: ['$totalSellingPrice', 0] },
              0,
              { $multiply: [{ $divide: ['$totalGrossProfit', '$totalSellingPrice'] }, 100] }
            ]
          }
        }
      },
      { $sort: { totalGrossProfit: -1 } }
    ])

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Post to GL (Finance integration placeholder)
router.put('/:id/post-to-gl', async (req, res) => {
  try {
    const cost = await ProductionCost.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'finalized'
    })

    if (!cost) {
      return res.status(404).json({ success: false, message: 'Cost record not found or not finalized' })
    }

    // This would integrate with accounting/finance module
    cost.finance.postedToGL = true
    cost.finance.glPostingDate = new Date()
    cost.finance.journalEntryId = `JE-${Date.now()}` // Would be actual GL entry ID
    cost.status = 'posted'

    await cost.save()

    res.json({ success: true, data: cost, message: 'Posted to General Ledger' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
