import express from 'express'
import { protect, setCompanyContext, requirePermission, requireModulePermission, PERMISSIONS } from '../middleware/rbac.js'
import Notification from '../models/Notification.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('notifications_module', 'view'))

/**
 * @desc    Get all notifications for user
 * @route   GET /api/notifications
 * @access  Private
 */
router.get('/', requirePermission(PERMISSIONS.NOTIFICATIONS_VIEW), async (req, res) => {
  try {
    const {
      read,
      category,
      page = 1,
      limit = 20
    } = req.query

    const query = {
      recipient: req.user._id
    }

    if (read !== undefined) {
      query.isRead = read === 'true'
    }

    if (category) {
      query.category = category
    }

    const total = await Notification.countDocuments(query)
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: notifications,
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
 * @desc    Get unread notification count
 * @route   GET /api/notifications/count
 * @access  Private
 */
router.get('/count', async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id)

    res.json({
      success: true,
      data: { unread: count }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      })
    }

    await notification.markRead()

    res.json({
      success: true,
      message: 'Notification marked as read'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
router.put('/read-all', async (req, res) => {
  try {
    const result = await Notification.markAllRead(req.user._id)

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      })
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Delete all read notifications
 * @route   DELETE /api/notifications/clear-read
 * @access  Private
 */
router.delete('/clear-read', async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      isRead: true
    })

    res.json({
      success: true,
      message: `${result.deletedCount} notifications deleted`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get notification by category counts
 * @route   GET /api/notifications/categories
 * @access  Private
 */
router.get('/categories', async (req, res) => {
  try {
    const counts = await Notification.aggregate([
      {
        $match: {
          recipient: req.user._id,
          isRead: false
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ])

    const categories = counts.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router
