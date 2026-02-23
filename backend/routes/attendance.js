import express from 'express'
import Attendance from '../models/Attendance.js'
import User from '../models/User.js'
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
 * @desc    Get attendance records
 * @route   GET /api/attendance
 * @access  Private
 */
router.get('/',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const {
        date,
        startDate,
        endDate,
        employee,
        department,
        status,
        page = 1,
        limit = 50
      } = req.query

      const queryFilter = companyScopedQuery(req)

      // Single date or date range
      if (date) {
        const targetDate = new Date(date)
        targetDate.setHours(0, 0, 0, 0)
        queryFilter.date = targetDate
      } else if (startDate && endDate) {
        queryFilter.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      } else {
        // Default to today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        queryFilter.date = today
      }

      if (employee) queryFilter.employee = employee
      if (status) queryFilter.status = status

      // Department filter requires joining with User
      let employeeIds = null
      if (department) {
        const deptEmployees = await User.find({
          company: req.activeCompany._id,
          department: department
        }).select('_id')
        employeeIds = deptEmployees.map(e => e._id)
        queryFilter.employee = { $in: employeeIds }
      }

      const total = await Attendance.countDocuments(queryFilter)

      const attendance = await Attendance.find(queryFilter)
        .populate('employee', 'name email avatar designation department')
        .populate('markedBy', 'name')
        .sort({ date: -1, 'checkIn.time': 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      // Get summary stats
      const stats = {
        present: 0,
        absent: 0,
        late: 0,
        onLeave: 0,
        halfDay: 0,
        workFromHome: 0
      }

      attendance.forEach(record => {
        switch (record.status) {
          case 'present': stats.present++; break
          case 'absent': stats.absent++; break
          case 'late': stats.late++; break
          case 'on-leave': stats.onLeave++; break
          case 'half-day': stats.halfDay++; break
          case 'work-from-home': stats.workFromHome++; break
        }
      })

      res.json({
        success: true,
        data: attendance,
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
 * @desc    Mark attendance (check-in)
 * @route   POST /api/attendance/check-in
 * @access  Private
 */
router.post('/check-in',
  async (req, res) => {
    try {
      const { location, method = 'manual' } = req.body
      const employeeId = req.user._id
      const companyId = req.activeCompany._id

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if already checked in today
      let attendance = await Attendance.findOne({
        employee: employeeId,
        date: today
      })

      if (attendance && attendance.checkIn?.time) {
        return res.status(400).json({
          success: false,
          message: 'Already checked in today'
        })
      }

      const now = new Date()

      // Determine if late (after 9:30 AM)
      const lateThreshold = new Date(today)
      lateThreshold.setHours(9, 30, 0, 0)
      const isLate = now > lateThreshold
      const lateBy = isLate ? Math.round((now - lateThreshold) / (1000 * 60)) : 0

      if (attendance) {
        // Update existing record
        attendance.checkIn = {
          time: now,
          location,
          method,
          ipAddress: req.ip
        }
        attendance.status = isLate ? 'late' : 'present'
        attendance.lateBy = lateBy
        attendance.markedBy = req.user._id
      } else {
        // Create new record
        attendance = new Attendance({
          employee: employeeId,
          company: companyId,
          date: today,
          status: isLate ? 'late' : 'present',
          checkIn: {
            time: now,
            location,
            method,
            ipAddress: req.ip
          },
          lateBy,
          markedBy: req.user._id
        })
      }

      await attendance.save()

      res.json({
        success: true,
        data: attendance,
        message: `Checked in successfully${isLate ? ` (Late by ${lateBy} minutes)` : ''}`
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
 * @desc    Mark attendance (check-out)
 * @route   POST /api/attendance/check-out
 * @access  Private
 */
router.post('/check-out',
  async (req, res) => {
    try {
      const { location, method = 'manual' } = req.body
      const employeeId = req.user._id

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const attendance = await Attendance.findOne({
        employee: employeeId,
        date: today
      })

      if (!attendance || !attendance.checkIn?.time) {
        return res.status(400).json({
          success: false,
          message: 'Please check in first'
        })
      }

      if (attendance.checkOut?.time) {
        return res.status(400).json({
          success: false,
          message: 'Already checked out today'
        })
      }

      const now = new Date()

      // Check for early leave (before 6 PM)
      const earlyLeaveThreshold = new Date(today)
      earlyLeaveThreshold.setHours(18, 0, 0, 0)
      const isEarlyLeave = now < earlyLeaveThreshold
      const earlyLeaveBy = isEarlyLeave ? Math.round((earlyLeaveThreshold - now) / (1000 * 60)) : 0

      attendance.checkOut = {
        time: now,
        location,
        method,
        ipAddress: req.ip
      }
      attendance.earlyLeaveBy = earlyLeaveBy
      attendance.modifiedBy = req.user._id

      await attendance.save()

      res.json({
        success: true,
        data: attendance,
        message: `Checked out successfully. Work hours: ${attendance.workHours.actual.toFixed(2)} hrs`
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
 * @desc    Mark attendance for employee (by admin)
 * @route   POST /api/attendance/mark
 * @access  Private (Admin)
 */
router.post('/mark',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const {
        employeeId,
        date,
        status,
        checkIn,
        checkOut,
        notes
      } = req.body

      const targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)

      // Check if record exists
      let attendance = await Attendance.findOne({
        employee: employeeId,
        date: targetDate
      })

      const employee = await User.findById(employeeId)
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      if (attendance) {
        // Update existing
        attendance.status = status
        if (checkIn) attendance.checkIn = { ...attendance.checkIn, time: new Date(checkIn) }
        if (checkOut) attendance.checkOut = { ...attendance.checkOut, time: new Date(checkOut) }
        if (notes) attendance.notes = notes
        attendance.modifiedBy = req.user._id
      } else {
        // Create new
        attendance = new Attendance({
          employee: employeeId,
          company: employee.company,
          date: targetDate,
          status,
          checkIn: checkIn ? { time: new Date(checkIn), method: 'manual' } : undefined,
          checkOut: checkOut ? { time: new Date(checkOut), method: 'manual' } : undefined,
          notes,
          markedBy: req.user._id
        })
      }

      await attendance.save()

      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('employee', 'name email avatar')
        .populate('markedBy', 'name')

      res.json({
        success: true,
        data: populatedAttendance,
        message: 'Attendance marked successfully'
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
 * @desc    Bulk mark attendance
 * @route   POST /api/attendance/bulk-mark
 * @access  Private (Admin)
 */
router.post('/bulk-mark',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { date, employees, status } = req.body

      const targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)

      const results = {
        success: 0,
        failed: 0,
        errors: []
      }

      for (const employeeId of employees) {
        try {
          const employee = await User.findById(employeeId)
          if (!employee) {
            results.failed++
            results.errors.push({ employeeId, error: 'Employee not found' })
            continue
          }

          await Attendance.findOneAndUpdate(
            { employee: employeeId, date: targetDate },
            {
              employee: employeeId,
              company: employee.company,
              date: targetDate,
              status,
              markedBy: req.user._id
            },
            { upsert: true, new: true }
          )

          results.success++
        } catch (err) {
          results.failed++
          results.errors.push({ employeeId, error: err.message })
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Bulk attendance marked: ${results.success} success, ${results.failed} failed`
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
 * @desc    Get my attendance for current month
 * @route   GET /api/attendance/my
 * @access  Private
 */
router.get('/my',
  async (req, res) => {
    try {
      const { month, year } = req.query

      const targetYear = parseInt(year) || new Date().getFullYear()
      const targetMonth = parseInt(month) || new Date().getMonth()

      const startDate = new Date(targetYear, targetMonth, 1)
      const endDate = new Date(targetYear, targetMonth + 1, 0)

      const attendance = await Attendance.find({
        employee: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 })

      const summary = await Attendance.getSummary(req.user._id, startDate, endDate)

      res.json({
        success: true,
        data: {
          records: attendance,
          summary,
          period: { month: targetMonth, year: targetYear }
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
 * @desc    Request regularization
 * @route   POST /api/attendance/:id/regularize
 * @access  Private
 */
router.post('/:id/regularize',
  async (req, res) => {
    try {
      const { reason } = req.body

      const attendance = await Attendance.findById(req.params.id)

      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        })
      }

      // Verify ownership
      if (attendance.employee.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to regularize this record'
        })
      }

      attendance.regularization = {
        isRegularized: false,
        reason,
        requestedAt: new Date(),
        status: 'pending'
      }

      await attendance.save()

      res.json({
        success: true,
        data: attendance,
        message: 'Regularization request submitted'
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
 * @desc    Approve/Reject regularization
 * @route   PUT /api/attendance/:id/regularization
 * @access  Private (Admin)
 */
router.put('/:id/regularization',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { status, comment } = req.body

      const attendance = await Attendance.findById(req.params.id)

      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        })
      }

      attendance.regularization.status = status
      attendance.regularization.approvedBy = req.user._id
      attendance.regularization.approvedAt = new Date()
      attendance.regularization.isRegularized = status === 'approved'

      if (status === 'approved') {
        // Update attendance status
        attendance.status = 'present'
      }

      await attendance.save()

      res.json({
        success: true,
        data: attendance,
        message: `Regularization ${status}`
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
 * @desc    Get attendance report
 * @route   GET /api/attendance/report
 * @access  Private (Admin)
 */
router.get('/report',
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  async (req, res) => {
    try {
      const { startDate, endDate, department } = req.query

      const start = new Date(startDate)
      const end = new Date(endDate)

      // Get all employees
      const employeeQuery = { company: req.activeCompany._id, isActive: true }
      if (department) employeeQuery.department = department

      const employees = await User.find(employeeQuery)
        .select('name email department designation')
        .lean()

      // Get attendance for all employees in date range
      const report = await Promise.all(
        employees.map(async (emp) => {
          const summary = await Attendance.getSummary(emp._id, start, end)
          return {
            employee: emp,
            ...summary
          }
        })
      )

      // Calculate totals
      const totals = report.reduce((acc, r) => {
        acc.present += r.present
        acc.absent += r.absent
        acc.late += r.late
        acc.onLeave += r.onLeave
        acc.totalWorkHours += r.totalWorkHours
        return acc
      }, { present: 0, absent: 0, late: 0, onLeave: 0, totalWorkHours: 0 })

      res.json({
        success: true,
        data: {
          report,
          totals,
          period: { startDate: start, endDate: end }
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

export default router
