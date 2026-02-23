import express from 'express'
import { protect, setCompanyContext, requirePermission, PERMISSIONS } from '../middleware/rbac.js'
import Alert from '../models/Alert.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all alerts for user
 * @route   GET /api/alerts
 * @access  Private
 */
router.get('/', requirePermission(PERMISSIONS.ALERTS_VIEW), async (req, res) => {
  try {
    const {
      status,
      severity,
      type,
      page = 1,
      limit = 20
    } = req.query

    const query = {
      assignedTo: req.user._id
    }

    if (status) {
      query.status = status
    } else {
      // Default to active alerts
      query.status = { $in: ['active', 'acknowledged'] }
    }

    if (severity) {
      query.severity = severity
    }

    if (type) {
      query.type = type
    }

    const total = await Alert.countDocuments(query)
    const alerts = await Alert.find(query)
      .sort({ severity: -1, triggeredAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('targetId', 'name email')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')

    // Get counts by severity
    const severityCounts = await Alert.aggregate([
      { $match: { assignedTo: req.user._id, status: 'active' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ])

    res.json({
      success: true,
      data: alerts,
      counts: {
        critical: severityCounts.find(s => s._id === 'critical')?.count || 0,
        warning: severityCounts.find(s => s._id === 'warning')?.count || 0,
        info: severityCounts.find(s => s._id === 'info')?.count || 0
      },
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
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
 * @desc    Get alert by ID
 * @route   GET /api/alerts/:id
 * @access  Private
 */
router.get('/:id', requirePermission(PERMISSIONS.ALERTS_VIEW), async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('targetId')
      .populate('assignedTo', 'name email')
      .populate('acknowledgedBy', 'name')
      .populate('resolvedBy', 'name')
      .populate('company', 'name code')

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      })
    }

    // Check access
    if (!alert.assignedTo.some(u => u._id.toString() === req.user._id.toString()) &&
        req.user.role !== 'super_admin' &&
        req.user.role !== 'company_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this alert'
      })
    }

    res.json({
      success: true,
      data: alert
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Acknowledge an alert
 * @route   PUT /api/alerts/:id/acknowledge
 * @access  Private
 */
router.put('/:id/acknowledge', requirePermission(PERMISSIONS.ALERTS_VIEW), async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      })
    }

    if (alert.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Alert is not in active status'
      })
    }

    alert.status = 'acknowledged'
    alert.acknowledgedBy = req.user._id
    alert.acknowledgedAt = new Date()
    await alert.save()

    res.json({
      success: true,
      data: alert,
      message: 'Alert acknowledged'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Resolve an alert
 * @route   PUT /api/alerts/:id/resolve
 * @access  Private
 */
router.put('/:id/resolve', requirePermission(PERMISSIONS.ALERTS_VIEW), async (req, res) => {
  try {
    const { resolution } = req.body
    const alert = await Alert.findById(req.params.id)

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      })
    }

    if (alert.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Alert is already resolved'
      })
    }

    alert.status = 'resolved'
    alert.resolvedBy = req.user._id
    alert.resolvedAt = new Date()
    alert.resolution = resolution || 'Resolved by user'
    await alert.save()

    res.json({
      success: true,
      data: alert,
      message: 'Alert resolved'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Dismiss an alert
 * @route   PUT /api/alerts/:id/dismiss
 * @access  Private
 */
router.put('/:id/dismiss', requirePermission(PERMISSIONS.ALERTS_VIEW), async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      })
    }

    alert.status = 'dismissed'
    await alert.save()

    res.json({
      success: true,
      message: 'Alert dismissed'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Bulk dismiss alerts
 * @route   POST /api/alerts/dismiss-all
 * @access  Private
 */
router.post('/dismiss-all', requirePermission(PERMISSIONS.ALERTS_VIEW), async (req, res) => {
  try {
    const { alertIds, severity } = req.body

    const query = {
      assignedTo: req.user._id,
      status: { $in: ['active', 'acknowledged'] }
    }

    if (alertIds && alertIds.length > 0) {
      query._id = { $in: alertIds }
    }

    if (severity) {
      query.severity = severity
    }

    const result = await Alert.updateMany(query, {
      $set: { status: 'dismissed' }
    })

    res.json({
      success: true,
      message: `${result.modifiedCount} alerts dismissed`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Create alert (internal use / automation)
 * @route   POST /api/alerts
 * @access  Private (admin only)
 */
router.post('/', requirePermission(PERMISSIONS.ALERTS_MANAGE), async (req, res) => {
  try {
    const {
      type,
      severity,
      priority,
      targetType,
      targetId,
      targetName,
      title,
      message,
      actionUrl,
      assignedTo,
      metadata,
      expiresAt
    } = req.body

    const alert = await Alert.create({
      company: req.activeCompany?._id || req.user.company._id,
      type,
      severity: severity || 'warning',
      priority: priority || 'medium',
      targetType,
      targetId,
      targetName,
      title,
      message,
      actionUrl,
      assignedTo: assignedTo || [req.user._id],
      metadata,
      expiresAt
    })

    res.status(201).json({
      success: true,
      data: alert
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get alert statistics
 * @route   GET /api/alerts/stats
 * @access  Private
 */
router.get('/stats/summary', requirePermission(PERMISSIONS.ALERTS_VIEW), async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $match: {
          assignedTo: req.user._id
        }
      },
      {
        $group: {
          _id: {
            status: '$status',
            severity: '$severity'
          },
          count: { $sum: 1 }
        }
      }
    ])

    const summary = {
      active: { critical: 0, warning: 0, info: 0, total: 0 },
      acknowledged: { critical: 0, warning: 0, info: 0, total: 0 },
      resolved: { total: 0 },
      dismissed: { total: 0 }
    }

    stats.forEach(item => {
      const { status, severity } = item._id
      if (summary[status]) {
        if (severity && summary[status][severity] !== undefined) {
          summary[status][severity] = item.count
        }
        summary[status].total = (summary[status].total || 0) + item.count
      }
    })

    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router
