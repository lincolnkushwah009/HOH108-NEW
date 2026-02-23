import express from 'express'
import BudgetForecast from '../models/BudgetForecast.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// POST / - Create budget forecast
router.post('/', async (req, res) => {
  try {
    const forecast = await BudgetForecast.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      status: 'draft'
    })

    const populated = await BudgetForecast.findById(forecast._id)
      .populate('department', 'name')
      .populate('project', 'title projectId')
      .populate('createdBy', 'name')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET / - List forecasts (company scoped, paginated, filterable)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      department,
      status,
      fiscalYear,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    // Ensure variance-report is not caught by this route
    // (Express matches routes in order, so /variance-report is defined separately)

    const queryFilter = companyScopedQuery(req)

    if (type) queryFilter.period = type
    if (department) queryFilter.department = department
    if (status) queryFilter.status = status
    if (fiscalYear) queryFilter.fiscalYear = parseInt(fiscalYear)

    const total = await BudgetForecast.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const forecasts = await BudgetForecast.find(queryFilter)
      .populate('department', 'name')
      .populate('project', 'title projectId')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: forecasts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /variance-report - Variance report for approved forecasts
// IMPORTANT: This route must be defined BEFORE /:id to avoid conflicts
router.get('/variance-report', async (req, res) => {
  try {
    const { fiscalYear, period, department } = req.query
    const queryFilter = companyScopedQuery(req, { status: 'approved' })

    if (fiscalYear) queryFilter.fiscalYear = parseInt(fiscalYear)
    if (period) queryFilter.period = period
    if (department) queryFilter.department = department

    const forecasts = await BudgetForecast.find(queryFilter)
      .populate('department', 'name')
      .populate('project', 'title projectId')
      .sort({ fiscalYear: -1, createdAt: -1 })

    const varianceReport = forecasts.map(forecast => {
      const lineItemVariances = forecast.lineItems.map(item => ({
        category: item.category,
        description: item.description,
        budget: item.budgetedAmount,
        actual: item.actualAmount || 0,
        variance: item.budgetedAmount - (item.actualAmount || 0),
        variancePercent: item.budgetedAmount > 0
          ? (((item.budgetedAmount - (item.actualAmount || 0)) / item.budgetedAmount) * 100).toFixed(2)
          : 0
      }))

      return {
        forecastId: forecast.forecastId,
        fiscalYear: forecast.fiscalYear,
        period: forecast.period,
        department: forecast.department,
        project: forecast.project,
        budget: forecast.totalBudgeted,
        actual: forecast.totalActual || 0,
        variance: forecast.totalBudgeted - (forecast.totalActual || 0),
        variancePercent: forecast.totalBudgeted > 0
          ? (((forecast.totalBudgeted - (forecast.totalActual || 0)) / forecast.totalBudgeted) * 100).toFixed(2)
          : 0,
        lineItems: lineItemVariances
      }
    })

    // Calculate summary totals
    const summary = {
      totalBudget: varianceReport.reduce((sum, r) => sum + r.budget, 0),
      totalActual: varianceReport.reduce((sum, r) => sum + r.actual, 0),
      totalVariance: varianceReport.reduce((sum, r) => sum + r.variance, 0),
      forecastCount: varianceReport.length
    }
    summary.totalVariancePercent = summary.totalBudget > 0
      ? ((summary.totalVariance / summary.totalBudget) * 100).toFixed(2)
      : 0

    res.json({
      success: true,
      data: {
        report: varianceReport,
        summary
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /:id - Get forecast detail
router.get('/:id', async (req, res) => {
  try {
    const forecast = await BudgetForecast.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })
      .populate('department', 'name')
      .populate('project', 'title projectId')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')

    if (!forecast) {
      return res.status(404).json({ success: false, message: 'Budget forecast not found' })
    }

    res.json({ success: true, data: forecast })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /:id - Update forecast
router.put('/:id', async (req, res) => {
  try {
    const forecast = await BudgetForecast.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!forecast) {
      return res.status(404).json({ success: false, message: 'Budget forecast not found' })
    }

    if (forecast.status === 'approved' || forecast.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot update a forecast with status '${forecast.status}'`
      })
    }

    // Update allowed fields
    const allowedFields = [
      'fiscalYear', 'period', 'department', 'project',
      'lineItems', 'totalBudgeted', 'totalActual', 'totalVariance', 'status'
    ]

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        forecast[field] = req.body[field]
      }
    }

    // Recalculate totals if lineItems changed
    if (req.body.lineItems) {
      forecast.totalBudgeted = forecast.lineItems.reduce((sum, item) => sum + (item.budgetedAmount || 0), 0)
      forecast.totalActual = forecast.lineItems.reduce((sum, item) => sum + (item.actualAmount || 0), 0)
      forecast.totalVariance = forecast.totalBudgeted - forecast.totalActual
    }

    await forecast.save()

    const populated = await BudgetForecast.findById(forecast._id)
      .populate('department', 'name')
      .populate('project', 'title projectId')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')

    res.json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /:id/approve - Approve forecast
router.put('/:id/approve', async (req, res) => {
  try {
    const forecast = await BudgetForecast.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!forecast) {
      return res.status(404).json({ success: false, message: 'Budget forecast not found' })
    }

    if (forecast.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Forecast is already approved'
      })
    }

    if (forecast.status !== 'submitted' && forecast.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft or submitted forecasts can be approved'
      })
    }

    forecast.status = 'approved'
    forecast.approvedBy = req.user._id

    await forecast.save()

    const populated = await BudgetForecast.findById(forecast._id)
      .populate('department', 'name')
      .populate('project', 'title projectId')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')

    res.json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
