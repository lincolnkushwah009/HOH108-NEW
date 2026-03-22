import express from 'express'
import Lead from '../models/Lead.js'
import Project from '../models/Project.js'
import CustomerInvoice from '../models/CustomerInvoice.js'
import Payment from '../models/Payment.js'
import User from '../models/User.js'
import Vendor from '../models/Vendor.js'
import PurchaseOrder from '../models/PurchaseOrder.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  requireModulePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('analytics_overview', 'view'))

// GET /sales-pipeline - Aggregate leads by status, count + totalValue per stage
router.get('/sales-pipeline', async (req, res) => {
  try {
    const companyFilter = companyScopedQuery(req)

    const pipeline = await Lead.aggregate([
      { $match: companyFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: {
            $sum: { $ifNull: ['$budget.max', 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ])

    const totalLeads = pipeline.reduce((sum, stage) => sum + stage.count, 0)
    const totalValue = pipeline.reduce((sum, stage) => sum + stage.totalValue, 0)

    res.json({
      success: true,
      data: {
        stages: pipeline.map(stage => ({
          status: stage._id,
          count: stage.count,
          totalValue: stage.totalValue
        })),
        summary: {
          totalLeads,
          totalValue
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /sales-forecast - Revenue forecast: sum of CustomerInvoices by month for next 6 months
router.get('/sales-forecast', async (req, res) => {
  try {
    const companyFilter = companyScopedQuery(req)
    const now = new Date()
    const sixMonthsLater = new Date()
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)

    // Get invoices in the pipeline (not yet paid) for next 6 months
    const forecast = await CustomerInvoice.aggregate([
      {
        $match: {
          ...companyFilter,
          dueDate: { $gte: now, $lte: sixMonthsLater },
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dueDate' },
            month: { $month: '$dueDate' }
          },
          expectedRevenue: { $sum: '$invoiceTotal' },
          paidAmount: { $sum: '$paidAmount' },
          pendingAmount: { $sum: '$balanceAmount' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    // Also get pipeline-based forecast from qualified leads
    const leadForecast = await Lead.aggregate([
      {
        $match: {
          ...companyFilter,
          primaryStatus: { $in: ['qualified', 'in_progress'] },
          isConverted: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          pipelineValue: { $sum: { $ifNull: ['$budget.max', 0] } },
          leadCount: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        monthlyForecast: forecast.map(f => ({
          year: f._id.year,
          month: f._id.month,
          expectedRevenue: f.expectedRevenue,
          paidAmount: f.paidAmount,
          pendingAmount: f.pendingAmount,
          invoiceCount: f.invoiceCount
        })),
        pipelineForecast: leadForecast[0] || { pipelineValue: 0, leadCount: 0 }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /lead-performance - Lead source analysis: group by source, count conversions, calc conversion rate
router.get('/lead-performance', async (req, res) => {
  try {
    const companyFilter = companyScopedQuery(req)

    const sourceAnalysis = await Lead.aggregate([
      { $match: companyFilter },
      {
        $group: {
          _id: '$source',
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: { $cond: ['$isConverted', 1, 0] }
          },
          qualifiedLeads: {
            $sum: { $cond: [{ $eq: ['$primaryStatus', 'qualified'] }, 1, 0] }
          },
          totalValue: {
            $sum: { $ifNull: ['$budget.max', 0] }
          }
        }
      },
      {
        $addFields: {
          conversionRate: {
            $cond: [
              { $gt: ['$totalLeads', 0] },
              { $multiply: [{ $divide: ['$convertedLeads', '$totalLeads'] }, 100] },
              0
            ]
          },
          qualificationRate: {
            $cond: [
              { $gt: ['$totalLeads', 0] },
              { $multiply: [{ $divide: ['$qualifiedLeads', '$totalLeads'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalLeads: -1 } }
    ])

    res.json({
      success: true,
      data: sourceAnalysis.map(s => ({
        source: s._id || 'unknown',
        totalLeads: s.totalLeads,
        convertedLeads: s.convertedLeads,
        qualifiedLeads: s.qualifiedLeads,
        conversionRate: parseFloat(s.conversionRate.toFixed(2)),
        qualificationRate: parseFloat(s.qualificationRate.toFixed(2)),
        totalValue: s.totalValue
      }))
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /resource-utilization - For each active user in company, count assigned leads, projects, tasks
router.get('/resource-utilization', async (req, res) => {
  try {
    const companyFilter = companyScopedQuery(req)

    // Get all active users in the company
    const users = await User.find({
      ...companyFilter,
      isActive: true
    }).select('name email role department')

    const utilization = await Promise.all(users.map(async (user) => {
      const [leadCount, projectCount] = await Promise.all([
        Lead.countDocuments({
          ...companyFilter,
          assignedTo: user._id,
          isConverted: { $ne: true }
        }),
        Project.countDocuments({
          ...companyFilter,
          $or: [
            { projectManager: user._id },
            { 'teamMembers.user': user._id }
          ],
          status: 'active'
        })
      ])

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        assignedLeads: leadCount,
        activeProjects: projectCount
      }
    }))

    res.json({
      success: true,
      data: utilization
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /vendor-dashboard - Aggregate vendor performance: avg rating, order count, on-time delivery %
router.get('/vendor-dashboard', async (req, res) => {
  try {
    const companyFilter = companyScopedQuery(req)

    // Get vendors with their stats
    const vendors = await Vendor.find({
      ...companyFilter,
      status: 'active'
    }).select('name vendorId rating status')

    const vendorStats = await Promise.all(vendors.map(async (vendor) => {
      const orders = await PurchaseOrder.find({
        company: companyFilter.company,
        vendor: vendor._id,
        status: { $nin: ['draft', 'cancelled'] }
      }).select('status expectedDeliveryDate actualDeliveryDate poTotal')

      const totalOrders = orders.length
      const deliveredOrders = orders.filter(o =>
        ['fully_delivered', 'invoiced', 'paid', 'closed'].includes(o.status)
      )
      const onTimeDeliveries = deliveredOrders.filter(o =>
        o.actualDeliveryDate && o.expectedDeliveryDate &&
        o.actualDeliveryDate <= o.expectedDeliveryDate
      )
      const totalOrderValue = orders.reduce((sum, o) => sum + (o.poTotal || 0), 0)

      return {
        vendorId: vendor.vendorId,
        name: vendor.name,
        rating: vendor.rating || null,
        totalOrders,
        deliveredOrders: deliveredOrders.length,
        onTimeDeliveryPercent: deliveredOrders.length > 0
          ? parseFloat(((onTimeDeliveries.length / deliveredOrders.length) * 100).toFixed(2))
          : 0,
        totalOrderValue
      }
    }))

    // Summary stats
    const summary = {
      totalVendors: vendors.length,
      avgRating: vendors.filter(v => v.rating).length > 0
        ? parseFloat((vendors.reduce((sum, v) => sum + (v.rating || 0), 0) / vendors.filter(v => v.rating).length).toFixed(2))
        : 0,
      totalOrders: vendorStats.reduce((sum, v) => sum + v.totalOrders, 0),
      overallOnTimePercent: (() => {
        const totalDelivered = vendorStats.reduce((sum, v) => sum + v.deliveredOrders, 0)
        const totalOnTime = vendorStats.reduce((sum, v) => {
          return sum + Math.round(v.deliveredOrders * v.onTimeDeliveryPercent / 100)
        }, 0)
        return totalDelivered > 0 ? parseFloat(((totalOnTime / totalDelivered) * 100).toFixed(2)) : 0
      })()
    }

    res.json({
      success: true,
      data: {
        vendors: vendorStats,
        summary
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /project-portfolio - Active projects summary: by stage, total budget vs spent, timeline status
router.get('/project-portfolio', async (req, res) => {
  try {
    const companyFilter = companyScopedQuery(req)

    // Aggregate projects by stage
    const byStage = await Project.aggregate([
      { $match: { ...companyFilter, status: 'active' } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalBudget: { $sum: { $ifNull: ['$budget.currentBudget', '$budget.originalBudget'] } },
          totalSpent: { $sum: { $ifNull: ['$budget.actualSpend', 0] } }
        }
      },
      { $sort: { count: -1 } }
    ])

    // Get individual project summaries
    const projects = await Project.find({
      ...companyFilter,
      status: 'active'
    })
      .select('title projectId stage status budget timeline priority')
      .populate('projectManager', 'name')
      .sort({ createdAt: -1 })
      .limit(50)

    const projectSummaries = projects.map(p => {
      const budget = p.budget || {}
      const currentBudget = budget.currentBudget || budget.originalBudget || 0
      const actualSpend = budget.actualSpend || 0
      const timeline = p.timeline || {}

      // Determine timeline status
      let timelineStatus = 'on_track'
      if (timeline.estimatedEndDate && new Date() > new Date(timeline.estimatedEndDate)) {
        timelineStatus = 'overdue'
      } else if (timeline.estimatedEndDate) {
        const daysRemaining = Math.ceil((new Date(timeline.estimatedEndDate) - new Date()) / (1000 * 60 * 60 * 24))
        if (daysRemaining < 7) timelineStatus = 'at_risk'
      }

      return {
        projectId: p.projectId,
        title: p.title,
        stage: p.stage,
        priority: p.priority,
        projectManager: p.projectManager,
        budget: currentBudget,
        spent: actualSpend,
        budgetVariance: currentBudget - actualSpend,
        budgetUtilization: currentBudget > 0
          ? parseFloat(((actualSpend / currentBudget) * 100).toFixed(2))
          : 0,
        timelineStatus
      }
    })

    // Overall summary
    const summary = {
      totalActiveProjects: projects.length,
      totalBudget: byStage.reduce((sum, s) => sum + s.totalBudget, 0),
      totalSpent: byStage.reduce((sum, s) => sum + s.totalSpent, 0),
      byStage: byStage.map(s => ({
        stage: s._id,
        count: s.count,
        totalBudget: s.totalBudget,
        totalSpent: s.totalSpent
      }))
    }
    summary.totalVariance = summary.totalBudget - summary.totalSpent

    res.json({
      success: true,
      data: {
        projects: projectSummaries,
        summary
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /finance-summary - P&L summary: total revenue (paid invoices), total expenses (approved POs), net
router.get('/finance-summary', async (req, res) => {
  try {
    const companyFilter = companyScopedQuery(req)
    const { dateFrom, dateTo } = req.query

    // Build date filter
    const dateFilter = {}
    if (dateFrom) dateFilter.$gte = new Date(dateFrom)
    if (dateTo) dateFilter.$lte = new Date(dateTo)

    // Revenue: sum of paid customer invoices
    const revenueMatch = { ...companyFilter, status: 'paid' }
    if (dateFrom || dateTo) revenueMatch.invoiceDate = dateFilter

    const revenueResult = await CustomerInvoice.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$invoiceTotal' },
          totalPaid: { $sum: '$paidAmount' },
          invoiceCount: { $sum: 1 }
        }
      }
    ])

    // Expenses: sum of approved purchase orders
    const expenseMatch = {
      ...companyFilter,
      status: { $in: ['approved', 'sent', 'confirmed', 'partially_delivered', 'fully_delivered', 'invoiced', 'paid', 'closed'] }
    }
    if (dateFrom || dateTo) expenseMatch.orderDate = dateFilter

    const expenseResult = await PurchaseOrder.aggregate([
      { $match: expenseMatch },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$poTotal' },
          orderCount: { $sum: 1 }
        }
      }
    ])

    // Outstanding receivables
    const receivablesResult = await CustomerInvoice.aggregate([
      {
        $match: {
          ...companyFilter,
          status: { $in: ['sent', 'viewed', 'partially_paid', 'overdue'] }
        }
      },
      {
        $group: {
          _id: null,
          totalReceivables: { $sum: '$balanceAmount' },
          overdueAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'overdue'] }, '$balanceAmount', 0]
            }
          },
          count: { $sum: 1 }
        }
      }
    ])

    const revenue = revenueResult[0] || { totalRevenue: 0, totalPaid: 0, invoiceCount: 0 }
    const expenses = expenseResult[0] || { totalExpenses: 0, orderCount: 0 }
    const receivables = receivablesResult[0] || { totalReceivables: 0, overdueAmount: 0, count: 0 }

    res.json({
      success: true,
      data: {
        revenue: {
          total: revenue.totalRevenue,
          collected: revenue.totalPaid,
          invoiceCount: revenue.invoiceCount
        },
        expenses: {
          total: expenses.totalExpenses,
          orderCount: expenses.orderCount
        },
        receivables: {
          total: receivables.totalReceivables,
          overdue: receivables.overdueAmount,
          count: receivables.count
        },
        netIncome: revenue.totalRevenue - expenses.totalExpenses,
        profitMargin: revenue.totalRevenue > 0
          ? parseFloat((((revenue.totalRevenue - expenses.totalExpenses) / revenue.totalRevenue) * 100).toFixed(2))
          : 0
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /hr-dashboard - Headcount by department, attendance rate this month, leave stats
router.get('/hr-dashboard', async (req, res) => {
  try {
    const companyFilter = companyScopedQuery(req)

    // Headcount by department
    const headcount = await User.aggregate([
      { $match: { ...companyFilter, isActive: true } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])

    const totalEmployees = headcount.reduce((sum, d) => sum + d.count, 0)

    // Attendance rate this month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          ...companyFilter,
          date: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const totalAttendanceRecords = attendanceStats.reduce((sum, s) => sum + s.count, 0)
    const presentRecords = attendanceStats
      .filter(s => ['present', 'late', 'work-from-home', 'half-day'].includes(s._id))
      .reduce((sum, s) => sum + s.count, 0)

    const attendanceRate = totalAttendanceRecords > 0
      ? parseFloat(((presentRecords / totalAttendanceRecords) * 100).toFixed(2))
      : 0

    // Leave stats this month
    const leaveStats = await Leave.aggregate([
      {
        $match: {
          ...companyFilter,
          startDate: { $lte: monthEnd },
          endDate: { $gte: monthStart },
          status: { $in: ['approved', 'pending'] }
        }
      },
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 },
          totalDays: { $sum: '$duration.days' }
        }
      },
      { $sort: { count: -1 } }
    ])

    const pendingLeaves = await Leave.countDocuments({
      ...companyFilter,
      status: 'pending'
    })

    res.json({
      success: true,
      data: {
        headcount: {
          total: totalEmployees,
          byDepartment: headcount.map(d => ({
            department: d._id || 'unassigned',
            count: d.count
          }))
        },
        attendance: {
          month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
          rate: attendanceRate,
          totalRecords: totalAttendanceRecords,
          presentCount: presentRecords,
          byStatus: attendanceStats.map(s => ({
            status: s._id,
            count: s.count
          }))
        },
        leaves: {
          pendingApprovals: pendingLeaves,
          thisMonth: leaveStats.map(l => ({
            type: l._id,
            count: l.count,
            totalDays: l.totalDays
          })),
          totalLeaveDays: leaveStats.reduce((sum, l) => sum + l.totalDays, 0)
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /export - Export analytics data as JSON
router.get('/export', async (req, res) => {
  try {
    const { type, format = 'json' } = req.query

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "type" is required. Supported types: sales-pipeline, finance-summary, lead-performance, resource-utilization, vendor-dashboard, project-portfolio, hr-dashboard'
      })
    }

    if (format !== 'json') {
      return res.status(400).json({
        success: false,
        message: 'Only JSON format is currently supported'
      })
    }

    // Re-use the existing route handlers by making an internal request simulation
    // Instead, we aggregate the data directly based on type
    const companyFilter = companyScopedQuery(req)
    let exportData = null

    switch (type) {
      case 'sales-pipeline': {
        const pipeline = await Lead.aggregate([
          { $match: companyFilter },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalValue: { $sum: { $ifNull: ['$budget.max', 0] } }
            }
          },
          { $sort: { count: -1 } }
        ])
        exportData = {
          type: 'sales-pipeline',
          generatedAt: new Date().toISOString(),
          stages: pipeline.map(s => ({
            status: s._id,
            count: s.count,
            totalValue: s.totalValue
          }))
        }
        break
      }

      case 'finance-summary': {
        const revenue = await CustomerInvoice.aggregate([
          { $match: { ...companyFilter, status: 'paid' } },
          { $group: { _id: null, totalRevenue: { $sum: '$invoiceTotal' }, invoiceCount: { $sum: 1 } } }
        ])
        const expenses = await PurchaseOrder.aggregate([
          { $match: { ...companyFilter, status: { $in: ['approved', 'sent', 'confirmed', 'partially_delivered', 'fully_delivered', 'invoiced', 'paid', 'closed'] } } },
          { $group: { _id: null, totalExpenses: { $sum: '$poTotal' }, orderCount: { $sum: 1 } } }
        ])
        const rev = revenue[0] || { totalRevenue: 0, invoiceCount: 0 }
        const exp = expenses[0] || { totalExpenses: 0, orderCount: 0 }
        exportData = {
          type: 'finance-summary',
          generatedAt: new Date().toISOString(),
          revenue: rev.totalRevenue,
          expenses: exp.totalExpenses,
          netIncome: rev.totalRevenue - exp.totalExpenses,
          invoiceCount: rev.invoiceCount,
          orderCount: exp.orderCount
        }
        break
      }

      case 'lead-performance': {
        const sourceAnalysis = await Lead.aggregate([
          { $match: companyFilter },
          {
            $group: {
              _id: '$source',
              totalLeads: { $sum: 1 },
              convertedLeads: { $sum: { $cond: ['$isConverted', 1, 0] } }
            }
          },
          {
            $addFields: {
              conversionRate: {
                $cond: [
                  { $gt: ['$totalLeads', 0] },
                  { $multiply: [{ $divide: ['$convertedLeads', '$totalLeads'] }, 100] },
                  0
                ]
              }
            }
          },
          { $sort: { totalLeads: -1 } }
        ])
        exportData = {
          type: 'lead-performance',
          generatedAt: new Date().toISOString(),
          sources: sourceAnalysis.map(s => ({
            source: s._id || 'unknown',
            totalLeads: s.totalLeads,
            convertedLeads: s.convertedLeads,
            conversionRate: parseFloat(s.conversionRate.toFixed(2))
          }))
        }
        break
      }

      case 'resource-utilization': {
        const users = await User.find({ ...companyFilter, isActive: true }).select('name email role department')
        const utilization = await Promise.all(users.map(async (user) => {
          const [leadCount, projectCount] = await Promise.all([
            Lead.countDocuments({ ...companyFilter, assignedTo: user._id, isConverted: { $ne: true } }),
            Project.countDocuments({ ...companyFilter, $or: [{ projectManager: user._id }, { 'teamMembers.user': user._id }], status: 'active' })
          ])
          return { name: user.name, role: user.role, department: user.department, assignedLeads: leadCount, activeProjects: projectCount }
        }))
        exportData = {
          type: 'resource-utilization',
          generatedAt: new Date().toISOString(),
          employees: utilization
        }
        break
      }

      case 'vendor-dashboard': {
        const vendors = await Vendor.find({ ...companyFilter, status: 'active' }).select('name vendorId rating')
        const vendorData = await Promise.all(vendors.map(async (vendor) => {
          const orderCount = await PurchaseOrder.countDocuments({ company: companyFilter.company, vendor: vendor._id, status: { $nin: ['draft', 'cancelled'] } })
          return { name: vendor.name, vendorId: vendor.vendorId, rating: vendor.rating, orderCount }
        }))
        exportData = {
          type: 'vendor-dashboard',
          generatedAt: new Date().toISOString(),
          vendors: vendorData
        }
        break
      }

      case 'project-portfolio': {
        const projects = await Project.find({ ...companyFilter, status: 'active' })
          .select('title projectId stage budget priority')
          .sort({ createdAt: -1 })
        exportData = {
          type: 'project-portfolio',
          generatedAt: new Date().toISOString(),
          projects: projects.map(p => ({
            projectId: p.projectId,
            title: p.title,
            stage: p.stage,
            priority: p.priority,
            budget: p.budget?.currentBudget || p.budget?.originalBudget || 0,
            spent: p.budget?.actualSpend || 0
          }))
        }
        break
      }

      case 'hr-dashboard': {
        const headcount = await User.aggregate([
          { $match: { ...companyFilter, isActive: true } },
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ])
        exportData = {
          type: 'hr-dashboard',
          generatedAt: new Date().toISOString(),
          totalEmployees: headcount.reduce((sum, d) => sum + d.count, 0),
          byDepartment: headcount.map(d => ({ department: d._id || 'unassigned', count: d.count }))
        }
        break
      }

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown export type: ${type}. Supported types: sales-pipeline, finance-summary, lead-performance, resource-utilization, vendor-dashboard, project-portfolio, hr-dashboard`
        })
    }

    res.json({
      success: true,
      data: exportData
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * ===========================================
 * SO vs Actual Variance Dashboard (Gap #6)
 * Compares Sales Order quoted amounts vs actual costs and collections per project
 * ===========================================
 */
router.get('/variance-dashboard', async (req, res) => {
  try {
    const companyFilter = companyScopedQuery(req)
    const { projectId } = req.query

    // Base project filter
    const projectFilter = { ...companyFilter, status: { $in: ['active', 'completed'] } }
    if (projectId) projectFilter._id = projectId

    const SalesOrder = (await import('../models/SalesOrder.js')).default
    const MaterialIssue = (await import('../models/MaterialIssue.js')).default

    // Get all active/completed projects with budget info
    const projects = await Project.find(projectFilter)
      .select('title projectId status budget')
      .lean()

    const results = []

    for (const project of projects) {
      // 1. Sales Order quoted amounts (BOQ + BOM)
      const salesOrders = await SalesOrder.find({
        company: companyFilter.company,
        project: project._id,
        status: { $nin: ['cancelled', 'rejected'] }
      }).select('orderNumber boqSummary bomSummary grandTotal').lean()

      const soQuotedTotal = salesOrders.reduce((sum, so) => sum + (so.grandTotal || 0), 0)
      const soBoqTotal = salesOrders.reduce((sum, so) => sum + (so.boqSummary?.totalAmount || 0), 0)
      const soBomTotal = salesOrders.reduce((sum, so) => sum + (so.bomSummary?.totalAmount || 0), 0)

      // 2. Actual costs - POs
      const poActual = await PurchaseOrder.aggregate([
        { $match: { company: companyFilter.company, project: project._id, status: { $nin: ['cancelled', 'rejected'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ])

      // 3. Actual costs - Material Issues
      const materialActual = await MaterialIssue.aggregate([
        { $match: { company: companyFilter.company, project: project._id } },
        { $group: { _id: null, total: { $sum: '$totalCost' }, count: { $sum: 1 } } }
      ])

      // 4. Collections - Customer Invoices & Payments
      const invoiceData = await CustomerInvoice.aggregate([
        { $match: { company: companyFilter.company, project: project._id, status: { $nin: ['cancelled'] } } },
        { $group: {
          _id: null,
          totalInvoiced: { $sum: '$invoiceTotal' },
          totalCollected: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: '$balanceAmount' },
          count: { $sum: 1 }
        }}
      ])

      const actualCost = (poActual[0]?.total || 0) + (materialActual[0]?.total || 0)
      const budgetAllocated = project.budget?.totalBudget || soQuotedTotal
      const costVariance = budgetAllocated - actualCost
      const costVariancePercent = budgetAllocated > 0 ? ((costVariance / budgetAllocated) * 100).toFixed(1) : 0
      const collectionRate = (invoiceData[0]?.totalInvoiced || 0) > 0
        ? (((invoiceData[0]?.totalCollected || 0) / invoiceData[0].totalInvoiced) * 100).toFixed(1)
        : 0

      results.push({
        project: { _id: project._id, title: project.title, projectId: project.projectId, status: project.status },
        quoted: { total: soQuotedTotal, boq: soBoqTotal, bom: soBomTotal, salesOrders: salesOrders.length },
        actual: {
          totalCost: actualCost,
          poCost: poActual[0]?.total || 0,
          poCount: poActual[0]?.count || 0,
          materialCost: materialActual[0]?.total || 0,
          materialIssues: materialActual[0]?.count || 0
        },
        variance: {
          amount: costVariance,
          percent: parseFloat(costVariancePercent),
          status: costVariance >= 0 ? 'under_budget' : 'over_budget'
        },
        collections: {
          totalInvoiced: invoiceData[0]?.totalInvoiced || 0,
          totalCollected: invoiceData[0]?.totalCollected || 0,
          totalOutstanding: invoiceData[0]?.totalOutstanding || 0,
          collectionRate: parseFloat(collectionRate),
          invoiceCount: invoiceData[0]?.count || 0
        },
        profitability: {
          grossProfit: (invoiceData[0]?.totalCollected || 0) - actualCost,
          margin: (invoiceData[0]?.totalCollected || 0) > 0
            ? ((((invoiceData[0]?.totalCollected || 0) - actualCost) / (invoiceData[0]?.totalCollected || 0)) * 100).toFixed(1)
            : 0
        }
      })
    }

    // Summary totals
    const summary = {
      totalProjects: results.length,
      totalQuoted: results.reduce((s, r) => s + r.quoted.total, 0),
      totalActualCost: results.reduce((s, r) => s + r.actual.totalCost, 0),
      totalInvoiced: results.reduce((s, r) => s + r.collections.totalInvoiced, 0),
      totalCollected: results.reduce((s, r) => s + r.collections.totalCollected, 0),
      totalOutstanding: results.reduce((s, r) => s + r.collections.totalOutstanding, 0),
      overBudgetCount: results.filter(r => r.variance.status === 'over_budget').length,
      underBudgetCount: results.filter(r => r.variance.status === 'under_budget').length
    }

    res.json({ success: true, data: { summary, projects: results } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
