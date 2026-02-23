import express from 'express'
import WorkOrder from '../models/WorkOrder.js'
import MaterialRequirement from '../models/MaterialRequirement.js'
import MaterialIssue from '../models/MaterialIssue.js'
import LaborEntry from '../models/LaborEntry.js'
import DailyProgressReport from '../models/DailyProgressReport.js'
import ProductionCost from '../models/ProductionCost.js'
import BillOfMaterials from '../models/BillOfMaterials.js'
import {
  protect,
  setCompanyContext
} from '../middleware/rbac.js'
import mongoose from 'mongoose'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// Get PPC Dashboard Overview
router.get('/overview', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfToday = new Date(today)
    endOfToday.setHours(23, 59, 59, 999)

    // Work Order Stats
    const workOrderStats = await WorkOrder.aggregate([
      { $match: { company: companyId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    // Active Work Orders (in_progress)
    const activeWorkOrders = await WorkOrder.countDocuments({
      company: companyId,
      status: 'in_progress'
    })

    // Overdue Work Orders
    const overdueWorkOrders = await WorkOrder.countDocuments({
      company: companyId,
      status: { $in: ['planned', 'in_progress', 'material_ready'] },
      'schedule.plannedEndDate': { $lt: today }
    })

    // Due This Week
    const endOfWeek = new Date(today)
    endOfWeek.setDate(endOfWeek.getDate() + 7)
    const dueThisWeek = await WorkOrder.countDocuments({
      company: companyId,
      status: { $in: ['planned', 'in_progress', 'material_ready'] },
      'schedule.plannedEndDate': { $gte: today, $lte: endOfWeek }
    })

    // Material Shortfall
    const materialShortfall = await MaterialRequirement.aggregate([
      {
        $match: {
          company: companyId,
          'quantity.shortfall': { $gt: 0 },
          status: { $in: ['pending', 'partial'] }
        }
      },
      {
        $group: {
          _id: null,
          totalShortfall: { $sum: '$quantity.shortfall' },
          totalCost: { $sum: '$totalCost' },
          count: { $sum: 1 }
        }
      }
    ])

    // Today's Labor
    const todayLabor = await LaborEntry.aggregate([
      {
        $match: {
          company: companyId,
          entryDate: { $gte: today, $lte: endOfToday }
        }
      },
      {
        $group: {
          _id: null,
          totalHours: { $sum: '$hours.total' },
          totalCost: { $sum: '$cost.totalCost' },
          workerCount: { $addToSet: '$employee' }
        }
      },
      {
        $project: {
          totalHours: 1,
          totalCost: 1,
          workerCount: { $size: '$workerCount' }
        }
      }
    ])

    // Today's Material Issues
    const todayMaterialIssues = await MaterialIssue.aggregate([
      {
        $match: {
          company: companyId,
          issueDate: { $gte: today, $lte: endOfToday }
        }
      },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$totalCost' },
          issueCount: { $sum: 1 }
        }
      }
    ])

    // Cost Summary (YTD)
    const yearStart = new Date(today.getFullYear(), 0, 1)
    const costSummary = await ProductionCost.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: yearStart }
        }
      },
      {
        $group: {
          _id: null,
          totalEstimated: { $sum: '$estimatedCosts.total' },
          totalActual: { $sum: '$actualCosts.total' },
          totalCOGS: { $sum: '$cogs.totalCOGS' },
          totalVariance: { $sum: '$variance.total' }
        }
      }
    ])

    // BOM Stats
    const bomStats = await BillOfMaterials.aggregate([
      { $match: { company: companyId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        workOrders: {
          byStatus: workOrderStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
          active: activeWorkOrders,
          overdue: overdueWorkOrders,
          dueThisWeek
        },
        materialShortfall: materialShortfall[0] || { totalShortfall: 0, totalCost: 0, count: 0 },
        todayLabor: todayLabor[0] || { totalHours: 0, totalCost: 0, workerCount: 0 },
        todayMaterialIssues: todayMaterialIssues[0] || { totalValue: 0, issueCount: 0 },
        costSummary: costSummary[0] || { totalEstimated: 0, totalActual: 0, totalCOGS: 0, totalVariance: 0 },
        bomStats: bomStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get Production Schedule / Calendar View
router.get('/schedule', async (req, res) => {
  try {
    const { startDate, endDate, project } = req.query

    const start = startDate ? new Date(startDate) : new Date()
    start.setDate(1) // Start of month
    const end = endDate ? new Date(endDate) : new Date(start)
    end.setMonth(end.getMonth() + 1)

    const match = {
      company: req.activeCompany._id,
      $or: [
        { 'schedule.plannedStartDate': { $gte: start, $lt: end } },
        { 'schedule.plannedEndDate': { $gte: start, $lt: end } },
        {
          'schedule.plannedStartDate': { $lte: start },
          'schedule.plannedEndDate': { $gte: end }
        }
      ]
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)

    const workOrders = await WorkOrder.find(match)
      .populate('project', 'title projectId')
      .populate('assignment.assignedTo', 'name')
      .select('workOrderId item.name status priority schedule progress assignment')
      .sort({ 'schedule.plannedStartDate': 1 })

    // Group by date for calendar view
    const scheduleByDate = {}
    workOrders.forEach(wo => {
      const startStr = wo.schedule.plannedStartDate?.toISOString().split('T')[0]
      if (startStr) {
        if (!scheduleByDate[startStr]) scheduleByDate[startStr] = []
        scheduleByDate[startStr].push(wo)
      }
    })

    res.json({
      success: true,
      data: {
        workOrders,
        scheduleByDate
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get Work Order Progress Summary
router.get('/work-order-progress', async (req, res) => {
  try {
    const { project } = req.query

    const match = {
      company: req.activeCompany._id,
      status: { $in: ['in_progress', 'material_ready', 'planned'] }
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)

    const workOrders = await WorkOrder.find(match)
      .populate('project', 'title')
      .select('workOrderId item.name status priority progress schedule quantity')
      .sort({ 'schedule.plannedEndDate': 1 })

    // Calculate days remaining / overdue
    const today = new Date()
    const enrichedOrders = workOrders.map(wo => {
      const obj = wo.toObject()
      if (wo.schedule.plannedEndDate) {
        const daysRemaining = Math.ceil((wo.schedule.plannedEndDate - today) / (1000 * 60 * 60 * 24))
        obj.daysRemaining = daysRemaining
        obj.isOverdue = daysRemaining < 0
      }
      return obj
    })

    res.json({ success: true, data: enrichedOrders })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get Material Requirements Summary (MRP Dashboard)
router.get('/mrp-summary', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    // Shortfall by status
    const byStatus = await MaterialRequirement.aggregate([
      { $match: { company: companyId } },
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

    // Critical shortfalls (due within 7 days)
    const criticalDate = new Date()
    criticalDate.setDate(criticalDate.getDate() + 7)

    const criticalShortfalls = await MaterialRequirement.find({
      company: companyId,
      'quantity.shortfall': { $gt: 0 },
      requiredByDate: { $lte: criticalDate },
      status: { $in: ['pending', 'partial'] }
    })
      .populate('material', 'skuCode materialName')
      .populate('workOrder', 'workOrderId item.name')
      .limit(10)
      .sort({ requiredByDate: 1 })

    // Top shortfall materials
    const topShortfalls = await MaterialRequirement.aggregate([
      {
        $match: {
          company: companyId,
          'quantity.shortfall': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$material',
          materialName: { $first: '$materialDetails.name' },
          skuCode: { $first: '$materialDetails.skuCode' },
          totalShortfall: { $sum: '$quantity.shortfall' },
          totalCost: { $sum: { $multiply: ['$quantity.shortfall', '$unitPrice'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalCost: -1 } },
      { $limit: 10 }
    ])

    res.json({
      success: true,
      data: {
        byStatus,
        criticalShortfalls,
        topShortfalls
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get Labor Dashboard
router.get('/labor-summary', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Last 7 days labor trend
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const laborTrend = await LaborEntry.aggregate([
      {
        $match: {
          company: companyId,
          entryDate: { $gte: weekAgo },
          status: { $ne: 'rejected' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$entryDate' } },
          totalHours: { $sum: '$hours.total' },
          totalCost: { $sum: '$cost.totalCost' },
          workerCount: { $addToSet: '$employee' }
        }
      },
      {
        $project: {
          date: '$_id',
          totalHours: 1,
          totalCost: 1,
          workerCount: { $size: '$workerCount' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // By skill type
    const bySkillType = await LaborEntry.aggregate([
      {
        $match: {
          company: companyId,
          entryDate: { $gte: weekAgo },
          status: { $ne: 'rejected' }
        }
      },
      {
        $group: {
          _id: '$employeeDetails.skillType',
          totalHours: { $sum: '$hours.total' },
          totalCost: { $sum: '$cost.totalCost' },
          avgEfficiency: { $avg: '$productivity.efficiency' }
        }
      }
    ])

    // Pending approvals
    const pendingApprovals = await LaborEntry.countDocuments({
      company: companyId,
      status: 'submitted'
    })

    res.json({
      success: true,
      data: {
        laborTrend,
        bySkillType,
        pendingApprovals
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get Cost Dashboard
router.get('/cost-summary', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    // Monthly cost trend (last 6 months)
    const sixMonthsAgo = new Date(today)
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const costTrend = await ProductionCost.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          estimatedCost: { $sum: '$estimatedCosts.total' },
          actualCost: { $sum: '$actualCosts.total' },
          variance: { $sum: '$variance.total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Current month breakdown
    const currentMonthBreakdown = await ProductionCost.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          materialCost: { $sum: '$actualCosts.material' },
          laborCost: { $sum: '$actualCosts.labor' },
          overheadCost: { $sum: '$actualCosts.overhead' },
          scrapCost: { $sum: '$actualCosts.scrap' },
          totalCost: { $sum: '$actualCosts.total' }
        }
      }
    ])

    // High variance work orders
    const highVarianceOrders = await ProductionCost.find({
      company: companyId,
      'variance.percentage': { $gt: 10 }
    })
      .populate('workOrder', 'workOrderId item.name')
      .select('workOrderId variance estimatedCosts.total actualCosts.total')
      .sort({ 'variance.percentage': -1 })
      .limit(5)

    res.json({
      success: true,
      data: {
        costTrend,
        currentMonthBreakdown: currentMonthBreakdown[0] || {
          materialCost: 0,
          laborCost: 0,
          overheadCost: 0,
          scrapCost: 0,
          totalCost: 0
        },
        highVarianceOrders
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get DPR Dashboard / Progress Overview
router.get('/progress-summary', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Today's DPRs
    const todayDPRs = await DailyProgressReport.countDocuments({
      company: companyId,
      reportDate: { $gte: today }
    })

    // Pending DPR approvals
    const pendingDPRs = await DailyProgressReport.countDocuments({
      company: companyId,
      status: { $in: ['submitted', 'reviewed'] }
    })

    // Progress trend by project
    const progressByProject = await DailyProgressReport.aggregate([
      {
        $match: {
          company: companyId,
          reportDate: { $gte: weekAgo },
          status: { $in: ['submitted', 'reviewed', 'approved'] }
        }
      },
      {
        $group: {
          _id: '$project',
          projectName: { $first: '$projectName' },
          latestProgress: { $last: '$overallProgress.actual' },
          avgProgress: { $avg: '$overallProgress.actual' },
          reportCount: { $sum: 1 }
        }
      },
      { $sort: { latestProgress: -1 } }
    ])

    // Issues summary
    const issuesSummary = await DailyProgressReport.aggregate([
      {
        $match: {
          company: companyId,
          reportDate: { $gte: weekAgo },
          'issues.0': { $exists: true }
        }
      },
      { $unwind: '$issues' },
      {
        $group: {
          _id: '$issues.type',
          count: { $sum: 1 },
          openCount: { $sum: { $cond: [{ $eq: ['$issues.status', 'open'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ])

    res.json({
      success: true,
      data: {
        todayDPRs,
        pendingDPRs,
        progressByProject,
        issuesSummary
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get KPIs
router.get('/kpis', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const yearStart = new Date(today.getFullYear(), 0, 1)

    // OEE Calculation (simplified)
    // Availability * Performance * Quality

    // On-Time Delivery Rate (OTD)
    const completedOrders = await WorkOrder.aggregate([
      {
        $match: {
          company: companyId,
          status: 'completed',
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          onTime: {
            $sum: {
              $cond: [
                { $lte: ['$schedule.actualEndDate', '$schedule.plannedEndDate'] },
                1,
                0
              ]
            }
          }
        }
      }
    ])

    const otdRate = completedOrders[0]
      ? ((completedOrders[0].onTime / completedOrders[0].total) * 100).toFixed(1)
      : 0

    // Cost Variance
    const costVariance = await ProductionCost.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: monthStart }
        }
      },
      {
        $group: {
          _id: null,
          totalEstimated: { $sum: '$estimatedCosts.total' },
          totalActual: { $sum: '$actualCosts.total' }
        }
      }
    ])

    const costVariancePercent = costVariance[0] && costVariance[0].totalEstimated > 0
      ? (((costVariance[0].totalActual - costVariance[0].totalEstimated) / costVariance[0].totalEstimated) * 100).toFixed(1)
      : 0

    // Labor Efficiency
    const laborEfficiency = await LaborEntry.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: monthStart },
          'productivity.efficiency': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          avgEfficiency: { $avg: '$productivity.efficiency' }
        }
      }
    ])

    // Material Utilization (1 - scrap rate)
    const materialUtilization = await MaterialIssue.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: monthStart },
          'consumption.totalConsumed': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalIssued: { $sum: '$quantityIssued' },
          totalScrap: { $sum: '$consumption.totalScrap' }
        }
      }
    ])

    const scrapRate = materialUtilization[0] && materialUtilization[0].totalIssued > 0
      ? ((materialUtilization[0].totalScrap / materialUtilization[0].totalIssued) * 100).toFixed(2)
      : 0

    // Safety (Safe Man Hours Rate)
    const safetyMetrics = await DailyProgressReport.aggregate([
      {
        $match: {
          company: companyId,
          reportDate: { $gte: monthStart },
          status: { $in: ['submitted', 'reviewed', 'approved'] }
        }
      },
      {
        $group: {
          _id: null,
          totalManHours: { $sum: '$manpower.totalManHours' },
          safeManHours: { $sum: '$safety.safeManHours' }
        }
      }
    ])

    const safetyRate = safetyMetrics[0] && safetyMetrics[0].totalManHours > 0
      ? ((safetyMetrics[0].safeManHours / safetyMetrics[0].totalManHours) * 100).toFixed(1)
      : 100

    res.json({
      success: true,
      data: {
        onTimeDelivery: parseFloat(otdRate),
        costVariance: parseFloat(costVariancePercent),
        laborEfficiency: laborEfficiency[0]?.avgEfficiency?.toFixed(1) || 0,
        scrapRate: parseFloat(scrapRate),
        materialUtilization: 100 - parseFloat(scrapRate),
        safetyRate: parseFloat(safetyRate)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
