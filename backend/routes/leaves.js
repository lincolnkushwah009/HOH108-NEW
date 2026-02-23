import express from 'express'
import Leave from '../models/Leave.js'
import Attendance from '../models/Attendance.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All routes protected
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all leave requests
 * @route   GET /api/leaves
 * @access  Private
 */
router.get('/',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const {
        status,
        leaveType,
        employee,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query

      const queryFilter = companyScopedQuery(req)

      if (status) queryFilter.status = status
      if (leaveType) queryFilter.leaveType = leaveType
      if (employee) queryFilter.employee = employee

      if (startDate && endDate) {
        queryFilter.startDate = { $gte: new Date(startDate) }
        queryFilter.endDate = { $lte: new Date(endDate) }
      }

      const total = await Leave.countDocuments(queryFilter)

      const leaves = await Leave.find(queryFilter)
        .populate('employee', 'name email avatar designation department')
        .populate('approvedBy', 'name')
        .populate('approvers.user', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      // Get stats
      const stats = {
        pending: await Leave.countDocuments({ ...queryFilter, status: 'pending' }),
        approved: await Leave.countDocuments({ ...queryFilter, status: 'approved' }),
        rejected: await Leave.countDocuments({ ...queryFilter, status: 'rejected' })
      }

      res.json({
        success: true,
        data: leaves,
        stats,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get my leave requests
 * @route   GET /api/leaves/my
 * @access  Private
 */
router.get('/my',
  async (req, res) => {
    try {
      const { year, status } = req.query

      const targetYear = parseInt(year) || new Date().getFullYear()
      const startOfYear = new Date(targetYear, 0, 1)
      const endOfYear = new Date(targetYear, 11, 31)

      const query = {
        employee: req.user._id,
        startDate: { $gte: startOfYear, $lte: endOfYear }
      }

      if (status) query.status = status

      const leaves = await Leave.find(query)
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })

      const balance = await Leave.getBalance(
        req.user._id,
        req.activeCompany._id,
        targetYear
      )

      res.json({
        success: true,
        data: {
          leaves,
          balance,
          year: targetYear
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get single leave request
 * @route   GET /api/leaves/:id
 * @access  Private
 */
router.get('/:id',
  async (req, res) => {
    try {
      const leave = await Leave.findById(req.params.id)
        .populate('employee', 'name email avatar designation department reportsTo')
        .populate('approvedBy', 'name')
        .populate('rejectedBy', 'name')
        .populate('approvers.user', 'name avatar')
        .populate('handover.assignee', 'name email')
        .populate('activities.performedBy', 'name avatar')

      if (!leave) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found'
        })
      }

      res.json({
        success: true,
        data: leave
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Apply for leave
 * @route   POST /api/leaves
 * @access  Private
 */
router.post('/',
  async (req, res) => {
    try {
      const {
        leaveType,
        startDate,
        endDate,
        reason,
        isHalfDay,
        halfDayType,
        emergencyContact,
        handover
      } = req.body

      const employee = await User.findById(req.user._id)
        .populate('reportsTo', 'name email')

      // Check for overlapping leaves
      const hasOverlap = await Leave.checkOverlap(
        req.user._id,
        new Date(startDate),
        new Date(endDate)
      )

      if (hasOverlap) {
        return res.status(400).json({
          success: false,
          message: 'You already have a leave request for these dates'
        })
      }

      // Get company for ID generation
      const company = await Company.findById(req.activeCompany._id)
      const leaveId = await company.generateId('leave')

      // Get leave balance
      const currentYear = new Date(startDate).getFullYear()
      const balance = await Leave.getBalance(
        req.user._id,
        req.activeCompany._id,
        currentYear
      )

      // Calculate days
      const start = new Date(startDate)
      const end = new Date(endDate)
      let days = 0
      const current = new Date(start)
      while (current <= end) {
        if (current.getDay() !== 0) days++
        current.setDate(current.getDate() + 1)
      }
      if (isHalfDay) days = 0.5

      // Check balance
      if (leaveType !== 'unpaid' && balance[leaveType]?.available < days) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance. Available: ${balance[leaveType]?.available || 0} days`
        })
      }

      // Set up approvers
      const approvers = []
      if (employee.reportsTo) {
        approvers.push({
          user: employee.reportsTo._id,
          status: 'pending',
          level: 1
        })
      }

      const leave = await Leave.create({
        leaveId,
        employee: req.user._id,
        company: req.activeCompany._id,
        leaveType,
        startDate,
        endDate,
        duration: {
          days,
          isHalfDay: isHalfDay || false,
          halfDayType
        },
        reason,
        emergencyContact,
        handover,
        balanceAtRequest: balance[leaveType]?.available || 0,
        approvers,
        activities: [{
          action: 'created',
          performedBy: req.user._id,
          performedByName: req.user.name,
          comment: 'Leave request submitted'
        }]
      })

      const populatedLeave = await Leave.findById(leave._id)
        .populate('employee', 'name email')
        .populate('approvers.user', 'name email')

      res.status(201).json({
        success: true,
        data: populatedLeave,
        message: 'Leave request submitted successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Approve leave request
 * @route   PUT /api/leaves/:id/approve
 * @access  Private (Manager/Admin)
 */
router.put('/:id/approve',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { comment } = req.body

      const leave = await Leave.findById(req.params.id)

      if (!leave) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found'
        })
      }

      if (leave.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Leave request is already ${leave.status}`
        })
      }

      // Update approver status
      const approverIndex = leave.approvers.findIndex(
        a => a.user.toString() === req.user._id.toString() && a.status === 'pending'
      )

      if (approverIndex !== -1) {
        leave.approvers[approverIndex].status = 'approved'
        leave.approvers[approverIndex].comment = comment
        leave.approvers[approverIndex].actionAt = new Date()
      }

      // Check if all approvers approved
      const allApproved = leave.approvers.every(a => a.status === 'approved')

      if (allApproved || req.user.role === 'super_admin' || req.user.role === 'company_admin') {
        leave.status = 'approved'
        leave.approvedBy = req.user._id
        leave.approvedAt = new Date()
        leave.managerComments = comment

        // Mark attendance as on-leave for the leave period
        const startDate = new Date(leave.startDate)
        const endDate = new Date(leave.endDate)
        const current = new Date(startDate)

        while (current <= endDate) {
          if (current.getDay() !== 0) { // Skip Sundays
            await Attendance.findOneAndUpdate(
              {
                employee: leave.employee,
                date: new Date(current)
              },
              {
                employee: leave.employee,
                company: leave.company,
                date: new Date(current),
                status: 'on-leave',
                leaveRequest: leave._id,
                markedBy: req.user._id
              },
              { upsert: true }
            )
          }
          current.setDate(current.getDate() + 1)
        }
      }

      leave.activities.push({
        action: 'approved',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment: comment || 'Leave approved'
      })

      await leave.save()

      res.json({
        success: true,
        data: leave,
        message: 'Leave approved successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Reject leave request
 * @route   PUT /api/leaves/:id/reject
 * @access  Private (Manager/Admin)
 */
router.put('/:id/reject',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { reason } = req.body

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        })
      }

      const leave = await Leave.findById(req.params.id)

      if (!leave) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found'
        })
      }

      if (leave.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Leave request is already ${leave.status}`
        })
      }

      leave.status = 'rejected'
      leave.rejectedBy = req.user._id
      leave.rejectedAt = new Date()
      leave.rejectionReason = reason

      leave.activities.push({
        action: 'rejected',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment: reason
      })

      await leave.save()

      res.json({
        success: true,
        data: leave,
        message: 'Leave rejected'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Cancel leave request
 * @route   PUT /api/leaves/:id/cancel
 * @access  Private
 */
router.put('/:id/cancel',
  async (req, res) => {
    try {
      const { reason } = req.body

      const leave = await Leave.findById(req.params.id)

      if (!leave) {
        return res.status(404).json({
          success: false,
          message: 'Leave request not found'
        })
      }

      // Only employee or admin can cancel
      if (leave.employee.toString() !== req.user._id.toString() &&
          !['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this leave'
        })
      }

      if (!['pending', 'approved'].includes(leave.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel ${leave.status} leave`
        })
      }

      // If approved, check if leave has started
      if (leave.status === 'approved' && new Date(leave.startDate) <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel leave that has already started'
        })
      }

      leave.status = 'cancelled'
      leave.cancelledBy = req.user._id
      leave.cancelledAt = new Date()
      leave.cancellationReason = reason

      // Remove attendance records if approved
      if (leave.status === 'approved') {
        await Attendance.deleteMany({
          leaveRequest: leave._id
        })
      }

      leave.activities.push({
        action: 'cancelled',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment: reason || 'Leave cancelled'
      })

      await leave.save()

      res.json({
        success: true,
        data: leave,
        message: 'Leave cancelled successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get leave balance
 * @route   GET /api/leaves/balance
 * @access  Private
 */
router.get('/balance/my',
  async (req, res) => {
    try {
      const { year } = req.query
      const targetYear = parseInt(year) || new Date().getFullYear()

      const balance = await Leave.getBalance(
        req.user._id,
        req.activeCompany._id,
        targetYear
      )

      res.json({
        success: true,
        data: balance,
        year: targetYear
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get team leaves (for managers)
 * @route   GET /api/leaves/team
 * @access  Private
 */
router.get('/team/pending',
  async (req, res) => {
    try {
      // Get direct reports
      const directReports = await User.find({
        reportsTo: req.user._id
      }).select('_id')

      const reportIds = directReports.map(r => r._id)

      const leaves = await Leave.find({
        employee: { $in: reportIds },
        status: 'pending'
      })
        .populate('employee', 'name email avatar designation')
        .sort({ createdAt: -1 })

      res.json({
        success: true,
        data: leaves
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get leave calendar (who's on leave)
 * @route   GET /api/leaves/calendar
 * @access  Private
 */
router.get('/calendar',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const { month, year } = req.query

      const targetYear = parseInt(year) || new Date().getFullYear()
      const targetMonth = parseInt(month) || new Date().getMonth()

      const startDate = new Date(targetYear, targetMonth, 1)
      const endDate = new Date(targetYear, targetMonth + 1, 0)

      const leaves = await Leave.find({
        company: req.activeCompany._id,
        status: 'approved',
        $or: [
          { startDate: { $gte: startDate, $lte: endDate } },
          { endDate: { $gte: startDate, $lte: endDate } },
          { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
        ]
      })
        .populate('employee', 'name avatar designation department')
        .select('employee startDate endDate leaveType duration')

      res.json({
        success: true,
        data: leaves,
        period: { month: targetMonth, year: targetYear }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

export default router
