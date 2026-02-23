import express from 'express'
import AuditLog from '../models/AuditLog.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(protect)

// Get all audit logs with pagination and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      module,
      action,
      userId,
      startDate,
      endDate,
      dateFilter
    } = req.query

    const filter = { company: req.user.company }

    // Module filter
    if (module) filter.module = module

    // Action filter
    if (action) filter.action = action

    // User filter
    if (userId) filter.user = userId

    // Date filters
    if (dateFilter) {
      const now = new Date()
      switch (dateFilter) {
        case 'today':
          filter.timestamp = {
            $gte: new Date(now.setHours(0, 0, 0, 0))
          }
          break
        case 'week':
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          filter.timestamp = { $gte: weekAgo }
          break
        case 'month':
          const monthAgo = new Date()
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          filter.timestamp = { $gte: monthAgo }
          break
      }
    } else if (startDate || endDate) {
      filter.timestamp = {}
      if (startDate) filter.timestamp.$gte = new Date(startDate)
      if (endDate) filter.timestamp.$lte = new Date(endDate)
    }

    // Search filter (search in entityName, entity)
    if (search) {
      filter.$or = [
        { entityName: new RegExp(search, 'i') },
        { entity: new RegExp(search, 'i') }
      ]
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    const total = await AuditLog.countDocuments(filter)

    // Get stats for the filtered period
    const stats = await AuditLog.getStats(req.user.company, {
      startDate: filter.timestamp?.$gte,
      endDate: filter.timestamp?.$lte
    })

    res.json({
      success: true,
      count: logs.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats,
      data: logs
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single audit log
router.get('/:id', async (req, res) => {
  try {
    const log = await AuditLog.findOne({
      _id: req.params.id,
      company: req.user.company
    }).populate('user', 'name email role department')

    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found' })
    }

    res.json({ success: true, data: log })
  } catch (error) {
    console.error('Error fetching audit log:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get audit history for a specific entity
router.get('/entity/:entity/:entityId', async (req, res) => {
  try {
    const { entity, entityId } = req.params
    const { page = 1, limit = 20 } = req.query

    const filter = {
      company: req.user.company,
      entity,
      entityId
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    const total = await AuditLog.countDocuments(filter)

    res.json({
      success: true,
      count: logs.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      data: logs
    })
  } catch (error) {
    console.error('Error fetching entity history:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get user activity
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 20, startDate, endDate } = req.query

    const result = await AuditLog.getUserActivity(
      req.user.company,
      userId,
      { page: parseInt(page), limit: parseInt(limit), startDate, endDate }
    )

    res.json({
      success: true,
      count: result.logs.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: result.pages
      },
      data: result.logs
    })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get audit stats
router.get('/meta/stats', async (req, res) => {
  try {
    const { startDate, endDate, dateFilter } = req.query

    let effectiveStartDate, effectiveEndDate

    if (dateFilter) {
      const now = new Date()
      effectiveEndDate = now
      switch (dateFilter) {
        case 'today':
          effectiveStartDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          effectiveStartDate = new Date()
          effectiveStartDate.setDate(effectiveStartDate.getDate() - 7)
          break
        case 'month':
          effectiveStartDate = new Date()
          effectiveStartDate.setMonth(effectiveStartDate.getMonth() - 1)
          break
        default:
          effectiveStartDate = null
          effectiveEndDate = null
      }
    } else {
      effectiveStartDate = startDate ? new Date(startDate) : null
      effectiveEndDate = endDate ? new Date(endDate) : null
    }

    const stats = await AuditLog.getStats(req.user.company, {
      startDate: effectiveStartDate,
      endDate: effectiveEndDate
    })

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching audit stats:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Export audit logs
router.get('/export/csv', async (req, res) => {
  try {
    const { startDate, endDate, module, action } = req.query

    const filter = { company: req.user.company }
    if (module) filter.module = module
    if (action) filter.action = action
    if (startDate || endDate) {
      filter.timestamp = {}
      if (startDate) filter.timestamp.$gte = new Date(startDate)
      if (endDate) filter.timestamp.$lte = new Date(endDate)
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(10000) // Limit export to 10k records

    // Convert to CSV format
    const headers = ['Timestamp', 'User', 'Email', 'Action', 'Module', 'Entity', 'Entity ID', 'Entity Name', 'Changes']
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.user?.name || 'Unknown',
      log.user?.email || '',
      log.action,
      log.module,
      log.entity,
      log.entityId || '',
      log.entityName || '',
      log.changes ? JSON.stringify(log.changes) : ''
    ])

    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=audit-log-${new Date().toISOString().split('T')[0]}.csv`)
    res.send(csv)
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get available filter options
router.get('/meta/filters', async (req, res) => {
  try {
    const modules = ['Projects', 'Sales', 'Inventory', 'Settings', 'Finance', 'Procurement', 'Auth', 'Customers', 'HR', 'Leads', 'Vendors', 'Tickets', 'Reports', 'Users', 'Approvals']
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'VIEW', 'SEND', 'CANCEL', 'SUBMIT', 'ASSIGN', 'CONVERT']

    res.json({
      success: true,
      data: {
        modules,
        actions
      }
    })
  } catch (error) {
    console.error('Error fetching filter options:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
