import express from 'express'
import { protect, setCompanyContext, requirePermission, PERMISSIONS } from '../middleware/rbac.js'
import KPIConfig from '../models/KPIConfig.js'
import Lead from '../models/Lead.js'
import Customer from '../models/Customer.js'
import Project from '../models/Project.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all KPI configurations
 * @route   GET /api/kpi/configs
 * @access  Private
 */
router.get('/configs', requirePermission(PERMISSIONS.KPI_VIEW), async (req, res) => {
  try {
    const { category, active } = req.query
    const companyId = req.activeCompany?._id || req.user.company._id

    const query = {
      $or: [
        { company: companyId },
        { company: null } // Global configs
      ]
    }

    if (category) {
      query.category = category
    }

    if (active !== undefined) {
      query.isActive = active === 'true'
    }

    const configs = await KPIConfig.find(query)
      .sort({ category: 1, dashboardPosition: 1 })

    res.json({
      success: true,
      data: configs
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get single KPI configuration
 * @route   GET /api/kpi/configs/:id
 * @access  Private
 */
router.get('/configs/:id', requirePermission(PERMISSIONS.KPI_VIEW), async (req, res) => {
  try {
    const config = await KPIConfig.findById(req.params.id)

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'KPI configuration not found'
      })
    }

    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Create KPI configuration
 * @route   POST /api/kpi/configs
 * @access  Private (Admin only)
 */
router.post('/configs', requirePermission(PERMISSIONS.KPI_MANAGE), async (req, res) => {
  try {
    const companyId = req.activeCompany?._id || req.user.company._id

    const config = await KPIConfig.create({
      ...req.body,
      company: req.body.isGlobal ? null : companyId
    })

    res.status(201).json({
      success: true,
      data: config
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Update KPI configuration
 * @route   PUT /api/kpi/configs/:id
 * @access  Private (Admin only)
 */
router.put('/configs/:id', requirePermission(PERMISSIONS.KPI_MANAGE), async (req, res) => {
  try {
    const config = await KPIConfig.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'KPI configuration not found'
      })
    }

    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Delete KPI configuration
 * @route   DELETE /api/kpi/configs/:id
 * @access  Private (Admin only)
 */
router.delete('/configs/:id', requirePermission(PERMISSIONS.KPI_MANAGE), async (req, res) => {
  try {
    const config = await KPIConfig.findByIdAndDelete(req.params.id)

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'KPI configuration not found'
      })
    }

    res.json({
      success: true,
      message: 'KPI configuration deleted'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get current KPI values
 * @route   GET /api/kpi/values
 * @access  Private
 */
router.get('/values', requirePermission(PERMISSIONS.KPI_VIEW), async (req, res) => {
  try {
    const { kpiCodes, period = '30d' } = req.query
    const companyId = req.activeCompany?._id || req.user.company._id
    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Get KPI configs
    let configs
    if (kpiCodes) {
      const codes = kpiCodes.split(',')
      configs = await KPIConfig.find({
        kpiCode: { $in: codes },
        $or: [{ company: companyId }, { company: null }],
        isActive: true
      })
    } else {
      configs = await KPIConfig.find({
        $or: [{ company: companyId }, { company: null }],
        isActive: true,
        showOnDashboard: true
      }).sort({ dashboardPosition: 1 })
    }

    // Calculate values for each KPI
    const values = await Promise.all(configs.map(async (config) => {
      let value = 0
      let trend = 0

      switch (config.kpiCode) {
        case 'lead_conversion_rate': {
          const [current, previous] = await Promise.all([
            Lead.aggregate([
              { $match: { company: companyId, createdAt: { $gte: startDate } } },
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } }
                }
              }
            ]),
            Lead.aggregate([
              {
                $match: {
                  company: companyId,
                  createdAt: {
                    $gte: new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000),
                    $lt: startDate
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } }
                }
              }
            ])
          ])

          const curr = current[0] || { total: 0, won: 0 }
          const prev = previous[0] || { total: 0, won: 0 }

          value = curr.total > 0 ? Math.round((curr.won / curr.total) * 100 * 10) / 10 : 0
          const prevValue = prev.total > 0 ? (prev.won / prev.total) * 100 : 0
          trend = prevValue > 0 ? Math.round(((value - prevValue) / prevValue) * 100) : 0
          break
        }

        case 'avg_response_time': {
          // Assuming firstContactedAt field exists
          const result = await Lead.aggregate([
            {
              $match: {
                company: companyId,
                createdAt: { $gte: startDate },
                firstContactedAt: { $exists: true }
              }
            },
            {
              $project: {
                responseTime: {
                  $divide: [
                    { $subtract: ['$firstContactedAt', '$createdAt'] },
                    1000 * 60 // Convert to minutes
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                avgResponseTime: { $avg: '$responseTime' }
              }
            }
          ])

          value = result[0]?.avgResponseTime || 0
          value = Math.round(value)
          break
        }

        case 'employee_utilization': {
          const [leads, capacity] = await Promise.all([
            Lead.countDocuments({
              company: companyId,
              status: { $nin: ['won', 'lost'] }
            }),
            // Assuming average capacity of 30 leads per sales person
            30
          ])

          value = Math.min(100, Math.round((leads / capacity) * 100))
          break
        }

        case 'revenue_achievement': {
          const projectStats = await Project.aggregate([
            { $match: { company: companyId } },
            {
              $group: {
                _id: null,
                collected: { $sum: { $ifNull: ['$financials.collected', 0] } },
                target: { $sum: { $ifNull: ['$financials.totalBudget', 0] } }
              }
            }
          ])

          const stats = projectStats[0] || { collected: 0, target: 0 }
          value = stats.target > 0 ? Math.round((stats.collected / stats.target) * 100) : 0
          break
        }

        default:
          value = 0
      }

      // Determine status based on thresholds
      let status = 'average'
      if (config.thresholds) {
        if (value >= config.thresholds.excellent) status = 'excellent'
        else if (value >= config.thresholds.good) status = 'good'
        else if (value >= config.thresholds.average) status = 'average'
        else if (value >= config.thresholds.poor) status = 'poor'
        else status = 'critical'
      }

      return {
        kpiCode: config.kpiCode,
        name: config.name,
        value,
        displayValue: formatValue(value, config.displayFormat, config.unit),
        trend,
        status,
        target: config.targets?.global || null,
        thresholds: config.thresholds
      }
    }))

    res.json({
      success: true,
      data: values,
      period: periodDays
    })
  } catch (error) {
    console.error('KPI values error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get KPI history for trend chart
 * @route   GET /api/kpi/values/:kpiCode/history
 * @access  Private
 */
router.get('/values/:kpiCode/history', requirePermission(PERMISSIONS.KPI_VIEW), async (req, res) => {
  try {
    const { kpiCode } = req.params
    const { period = '6m' } = req.query
    const companyId = req.activeCompany?._id || req.user.company._id

    // Determine number of data points based on period
    let dataPoints = 6
    let intervalDays = 30

    if (period === '3m') {
      dataPoints = 3
      intervalDays = 30
    } else if (period === '6m') {
      dataPoints = 6
      intervalDays = 30
    } else if (period === '1y') {
      dataPoints = 12
      intervalDays = 30
    }

    const history = []
    const now = new Date()

    for (let i = dataPoints - 1; i >= 0; i--) {
      const endDate = new Date(now)
      endDate.setMonth(endDate.getMonth() - i)
      const startDate = new Date(endDate)
      startDate.setMonth(startDate.getMonth() - 1)

      let value = 0

      if (kpiCode === 'lead_conversion_rate') {
        const result = await Lead.aggregate([
          {
            $match: {
              company: companyId,
              createdAt: { $gte: startDate, $lt: endDate }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } }
            }
          }
        ])

        const stats = result[0] || { total: 0, won: 0 }
        value = stats.total > 0 ? Math.round((stats.won / stats.total) * 100 * 10) / 10 : 0
      }

      history.push({
        date: endDate.toISOString().substring(0, 7), // YYYY-MM format
        label: endDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        value
      })
    }

    res.json({
      success: true,
      data: {
        kpiCode,
        history
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Initialize default KPIs for company
 * @route   POST /api/kpi/init-defaults
 * @access  Private (Admin only)
 */
router.post('/init-defaults', requirePermission(PERMISSIONS.KPI_MANAGE), async (req, res) => {
  try {
    const companyId = req.activeCompany?._id || req.user.company._id

    // Check if already initialized
    const existing = await KPIConfig.countDocuments({ company: companyId })
    if (existing > 0) {
      return res.status(400).json({
        success: false,
        message: 'KPIs already initialized for this company'
      })
    }

    // Get default KPIs
    const defaults = KPIConfig.getDefaultKPIs()

    // Create for this company
    const configs = await KPIConfig.insertMany(
      defaults.map((kpi, index) => ({
        ...kpi,
        company: companyId,
        dashboardPosition: index,
        isActive: true,
        showOnDashboard: true
      }))
    )

    res.status(201).json({
      success: true,
      data: configs,
      message: `${configs.length} KPI configurations created`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// Helper function to format KPI values
function formatValue(value, format, unit) {
  switch (format) {
    case 'percentage':
      return `${value}%`
    case 'currency':
      if (value >= 10000000) {
        return `${(value / 10000000).toFixed(1)} Cr`
      } else if (value >= 100000) {
        return `${(value / 100000).toFixed(1)} L`
      }
      return `₹${value.toLocaleString('en-IN')}`
    case 'duration':
      if (value >= 60) {
        return `${Math.round(value / 60)} hrs`
      }
      return `${Math.round(value)} ${unit || 'min'}`
    default:
      return `${value}${unit ? ' ' + unit : ''}`
  }
}

export default router
