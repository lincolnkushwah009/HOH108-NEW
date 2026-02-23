import express from 'express'
import Reimbursement from '../models/Reimbursement.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'
import { uploadReceipts } from '../middleware/upload.js'

const router = express.Router()

// All routes protected
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all reimbursement requests
 * @route   GET /api/reimbursements
 * @access  Private
 */
router.get('/',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const {
        status,
        category,
        employee,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query

      const queryFilter = companyScopedQuery(req)

      if (status) queryFilter.status = status
      if (category) queryFilter.category = category
      if (employee) queryFilter.employee = employee

      if (startDate && endDate) {
        queryFilter.expenseDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }

      const total = await Reimbursement.countDocuments(queryFilter)

      const reimbursements = await Reimbursement.find(queryFilter)
        .populate('employee', 'name email avatar designation department')
        .populate('approvedBy', 'name')
        .populate('project', 'name projectId')
        .populate('approvers.user', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      // Get stats
      const stats = {
        pending: await Reimbursement.countDocuments({ ...companyScopedQuery(req), status: 'pending' }),
        approved: await Reimbursement.countDocuments({ ...companyScopedQuery(req), status: 'approved' }),
        rejected: await Reimbursement.countDocuments({ ...companyScopedQuery(req), status: 'rejected' }),
        paid: await Reimbursement.countDocuments({ ...companyScopedQuery(req), status: 'paid' })
      }

      // Get total amounts
      const amounts = await Reimbursement.aggregate([
        { $match: companyScopedQuery(req) },
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' }
          }
        }
      ])

      res.json({
        success: true,
        data: reimbursements,
        stats,
        amounts: amounts.reduce((acc, item) => {
          acc[item._id] = item.total
          return acc
        }, {}),
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
 * @desc    Get my reimbursement requests
 * @route   GET /api/reimbursements/my
 * @access  Private
 */
router.get('/my',
  async (req, res) => {
    try {
      const { year, status, category } = req.query

      const targetYear = parseInt(year) || new Date().getFullYear()
      const startOfYear = new Date(targetYear, 0, 1)
      const endOfYear = new Date(targetYear, 11, 31)

      const query = {
        employee: req.user._id,
        expenseDate: { $gte: startOfYear, $lte: endOfYear }
      }

      if (status) query.status = status
      if (category) query.category = category

      const reimbursements = await Reimbursement.find(query)
        .populate('approvedBy', 'name')
        .populate('project', 'name projectId')
        .sort({ createdAt: -1 })

      const summary = await Reimbursement.getEmployeeSummary(
        req.user._id,
        req.activeCompany._id,
        targetYear
      )

      res.json({
        success: true,
        data: {
          reimbursements,
          summary,
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
 * @desc    Get single reimbursement request
 * @route   GET /api/reimbursements/:id
 * @access  Private
 */
router.get('/:id',
  async (req, res) => {
    try {
      const reimbursement = await Reimbursement.findById(req.params.id)
        .populate('employee', 'name email avatar designation department reportsTo')
        .populate('approvedBy', 'name')
        .populate('rejectedBy', 'name')
        .populate('paidBy', 'name')
        .populate('project', 'name projectId')
        .populate('customer', 'name')
        .populate('approvers.user', 'name avatar')
        .populate('activities.performedBy', 'name avatar')

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement request not found'
        })
      }

      res.json({
        success: true,
        data: reimbursement
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
 * @desc    Create reimbursement request
 * @route   POST /api/reimbursements
 * @access  Private
 */
router.post('/',
  uploadReceipts.array('receipts', 5),
  async (req, res) => {
    try {
      const {
        category,
        title,
        description,
        amount,
        expenseDate,
        project,
        customer,
        notes
      } = req.body

      // Parse vendor if it's a string
      let vendor = req.body.vendor
      if (typeof vendor === 'string') {
        try {
          vendor = JSON.parse(vendor)
        } catch {
          vendor = { name: vendor }
        }
      }

      const employee = await User.findById(req.user._id)
        .populate('reportsTo', 'name email')

      // Get company for ID generation
      const company = await Company.findById(req.activeCompany._id)
      const reimbursementId = await company.generateId('reimbursement')

      // Process uploaded files
      const receipts = []
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          receipts.push({
            name: file.originalname,
            url: `/uploads/reimbursements/${file.filename}`,
            type: file.mimetype,
            uploadedAt: new Date()
          })
        }
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

      const reimbursement = await Reimbursement.create({
        reimbursementId,
        employee: req.user._id,
        company: req.activeCompany._id,
        category,
        title,
        description,
        amount: parseFloat(amount),
        expenseDate,
        project: project || undefined,
        customer: customer || undefined,
        vendor,
        receipts,
        notes,
        approvers,
        activities: [{
          action: 'created',
          performedBy: req.user._id,
          performedByName: req.user.name,
          comment: 'Reimbursement request submitted'
        }]
      })

      const populatedReimbursement = await Reimbursement.findById(reimbursement._id)
        .populate('employee', 'name email')
        .populate('approvers.user', 'name email')

      res.status(201).json({
        success: true,
        data: populatedReimbursement,
        message: 'Reimbursement request submitted successfully'
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
 * @desc    Update reimbursement request
 * @route   PUT /api/reimbursements/:id
 * @access  Private
 */
router.put('/:id',
  async (req, res) => {
    try {
      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement request not found'
        })
      }

      // Only allow edit if pending or draft and by the employee
      if (!['pending', 'draft'].includes(reimbursement.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit reimbursement that is not pending or draft'
        })
      }

      if (reimbursement.employee.toString() !== req.user._id.toString() &&
          !['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this reimbursement'
        })
      }

      const {
        category,
        title,
        description,
        amount,
        expenseDate,
        project,
        customer,
        vendor,
        receipts,
        notes
      } = req.body

      Object.assign(reimbursement, {
        category: category || reimbursement.category,
        title: title || reimbursement.title,
        description: description !== undefined ? description : reimbursement.description,
        amount: amount || reimbursement.amount,
        expenseDate: expenseDate || reimbursement.expenseDate,
        project: project !== undefined ? project : reimbursement.project,
        customer: customer !== undefined ? customer : reimbursement.customer,
        vendor: vendor !== undefined ? vendor : reimbursement.vendor,
        receipts: receipts || reimbursement.receipts,
        notes: notes !== undefined ? notes : reimbursement.notes
      })

      reimbursement.activities.push({
        action: 'modified',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment: 'Reimbursement request updated'
      })

      await reimbursement.save()

      res.json({
        success: true,
        data: reimbursement,
        message: 'Reimbursement updated successfully'
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
 * @desc    Approve reimbursement request
 * @route   PUT /api/reimbursements/:id/approve
 * @access  Private (Manager/Admin)
 */
router.put('/:id/approve',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { comment, approvedAmount } = req.body

      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement request not found'
        })
      }

      if (reimbursement.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Reimbursement request is already ${reimbursement.status}`
        })
      }

      // Update approver status
      const approverIndex = reimbursement.approvers.findIndex(
        a => a.user.toString() === req.user._id.toString() && a.status === 'pending'
      )

      if (approverIndex !== -1) {
        reimbursement.approvers[approverIndex].status = 'approved'
        reimbursement.approvers[approverIndex].comment = comment
        reimbursement.approvers[approverIndex].actionAt = new Date()
      }

      // Check if all approvers approved or admin is approving
      const allApproved = reimbursement.approvers.every(a => a.status === 'approved')

      if (allApproved || req.user.role === 'super_admin' || req.user.role === 'company_admin') {
        reimbursement.status = 'approved'
        reimbursement.approvedBy = req.user._id
        reimbursement.approvedAt = new Date()
        reimbursement.approvedAmount = approvedAmount || reimbursement.amount
        reimbursement.managerComments = comment
      }

      reimbursement.activities.push({
        action: 'approved',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment: comment || 'Reimbursement approved'
      })

      await reimbursement.save()

      res.json({
        success: true,
        data: reimbursement,
        message: 'Reimbursement approved successfully'
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
 * @desc    Reject reimbursement request
 * @route   PUT /api/reimbursements/:id/reject
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

      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement request not found'
        })
      }

      if (reimbursement.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Reimbursement request is already ${reimbursement.status}`
        })
      }

      reimbursement.status = 'rejected'
      reimbursement.rejectedBy = req.user._id
      reimbursement.rejectedAt = new Date()
      reimbursement.rejectionReason = reason

      reimbursement.activities.push({
        action: 'rejected',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment: reason
      })

      await reimbursement.save()

      res.json({
        success: true,
        data: reimbursement,
        message: 'Reimbursement rejected'
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
 * @desc    Mark reimbursement as paid
 * @route   PUT /api/reimbursements/:id/pay
 * @access  Private (Finance/Admin)
 */
router.put('/:id/pay',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { paymentMethod, paymentReference, comment } = req.body

      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement request not found'
        })
      }

      if (reimbursement.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Only approved reimbursements can be marked as paid'
        })
      }

      reimbursement.status = 'paid'
      reimbursement.paidBy = req.user._id
      reimbursement.paidAt = new Date()
      reimbursement.paymentMethod = paymentMethod
      reimbursement.paymentReference = paymentReference

      reimbursement.activities.push({
        action: 'paid',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment: comment || `Payment processed via ${paymentMethod}`
      })

      await reimbursement.save()

      res.json({
        success: true,
        data: reimbursement,
        message: 'Reimbursement marked as paid'
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
 * @desc    Cancel reimbursement request
 * @route   PUT /api/reimbursements/:id/cancel
 * @access  Private
 */
router.put('/:id/cancel',
  async (req, res) => {
    try {
      const { reason } = req.body

      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement request not found'
        })
      }

      // Only employee or admin can cancel
      if (reimbursement.employee.toString() !== req.user._id.toString() &&
          !['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to cancel this reimbursement'
        })
      }

      if (!['pending', 'draft', 'approved'].includes(reimbursement.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel ${reimbursement.status} reimbursement`
        })
      }

      reimbursement.status = 'cancelled'
      reimbursement.cancelledBy = req.user._id
      reimbursement.cancelledAt = new Date()
      reimbursement.cancellationReason = reason

      reimbursement.activities.push({
        action: 'cancelled',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment: reason || 'Reimbursement cancelled'
      })

      await reimbursement.save()

      res.json({
        success: true,
        data: reimbursement,
        message: 'Reimbursement cancelled successfully'
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
 * @desc    Delete reimbursement request
 * @route   DELETE /api/reimbursements/:id
 * @access  Private
 */
router.delete('/:id',
  async (req, res) => {
    try {
      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement request not found'
        })
      }

      // Only allow delete if draft and by the employee or admin
      if (reimbursement.status !== 'draft' && !['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(400).json({
          success: false,
          message: 'Only draft reimbursements can be deleted'
        })
      }

      if (reimbursement.employee.toString() !== req.user._id.toString() &&
          !['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this reimbursement'
        })
      }

      await Reimbursement.findByIdAndDelete(req.params.id)

      res.json({
        success: true,
        message: 'Reimbursement deleted successfully'
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
 * @desc    Get team reimbursements (for managers)
 * @route   GET /api/reimbursements/team/pending
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

      const reimbursements = await Reimbursement.find({
        employee: { $in: reportIds },
        status: 'pending'
      })
        .populate('employee', 'name email avatar designation')
        .populate('project', 'name projectId')
        .sort({ createdAt: -1 })

      res.json({
        success: true,
        data: reimbursements
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
 * @desc    Get reimbursement summary/analytics
 * @route   GET /api/reimbursements/analytics
 * @access  Private (Admin)
 */
router.get('/analytics/summary',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const { year, month } = req.query
      const targetYear = parseInt(year) || new Date().getFullYear()

      let startDate, endDate
      if (month) {
        startDate = new Date(targetYear, parseInt(month) - 1, 1)
        endDate = new Date(targetYear, parseInt(month), 0)
      } else {
        startDate = new Date(targetYear, 0, 1)
        endDate = new Date(targetYear, 11, 31)
      }

      const baseQuery = {
        company: req.activeCompany._id,
        expenseDate: { $gte: startDate, $lte: endDate }
      }

      // Category-wise breakdown
      const categoryWise = await Reimbursement.aggregate([
        { $match: { ...baseQuery, status: { $in: ['approved', 'paid'] } } },
        {
          $group: {
            _id: '$category',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } }
      ])

      // Monthly trend
      const monthlyTrend = await Reimbursement.aggregate([
        { $match: { ...baseQuery, status: { $in: ['approved', 'paid'] } } },
        {
          $group: {
            _id: { $month: '$expenseDate' },
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])

      // Top employees by reimbursement
      const topEmployees = await Reimbursement.aggregate([
        { $match: { ...baseQuery, status: { $in: ['approved', 'paid'] } } },
        {
          $group: {
            _id: '$employee',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' },
        {
          $project: {
            totalAmount: 1,
            count: 1,
            'employee.name': 1,
            'employee.designation': 1
          }
        }
      ])

      res.json({
        success: true,
        data: {
          categoryWise,
          monthlyTrend,
          topEmployees,
          period: { year: targetYear, month: month || 'all' }
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

// ============================================
// 3-LEVEL APPROVAL WORKFLOW ROUTES
// ============================================

/**
 * @desc    Get pending approvals by level
 * @route   GET /api/reimbursements/approvals/by-level
 * @access  Private
 */
router.get('/approvals/by-level',
  async (req, res) => {
    try {
      const { level } = req.query
      const companyId = req.activeCompany._id
      const userId = req.user._id
      const userRole = req.user.role

      let query = { company: companyId }

      if (level === '1') {
        // Level 1: Manager approvals
        query.status = 'pending_manager'
        query['managerApproval.approver'] = userId
      } else if (level === '2') {
        // Level 2: HR approvals
        query.status = 'pending_hr'
      } else if (level === '3') {
        // Level 3: Final approvals (Super Admin)
        query.status = 'pending_final'
      } else {
        // Return all pending based on role
        if (userRole === 'super_admin') {
          query.status = { $in: ['pending_manager', 'pending_hr', 'pending_final'] }
        } else if (['company_admin', 'sales_manager'].includes(userRole)) {
          query.status = { $in: ['pending_hr', 'pending_final'] }
        } else {
          query['managerApproval.approver'] = userId
          query.status = 'pending_manager'
        }
      }

      const reimbursements = await Reimbursement.find(query)
        .populate('employee', 'name email avatar designation department')
        .populate('managerApproval.approver', 'name')
        .populate('hrApproval.approver', 'name')
        .populate('finalApproval.approver', 'name')
        .sort({ createdAt: -1 })

      res.json({
        success: true,
        data: reimbursements
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
 * @desc    Manager approval (Level 1)
 * @route   PUT /api/reimbursements/:id/manager-approve
 * @access  Private (Manager)
 */
router.put('/:id/manager-approve',
  async (req, res) => {
    try {
      const { approved, comment, approvedAmount } = req.body

      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement not found'
        })
      }

      if (reimbursement.currentApprovalLevel !== 1) {
        return res.status(400).json({
          success: false,
          message: 'This reimbursement is not at manager approval level'
        })
      }

      if (approved) {
        reimbursement.managerApproval = {
          approver: req.user._id,
          status: 'approved',
          comment,
          approvedAmount: approvedAmount || reimbursement.amount,
          actionAt: new Date()
        }
        reimbursement.status = 'pending_hr'
        reimbursement.currentApprovalLevel = 2

        reimbursement.activities.push({
          action: 'approved',
          performedBy: req.user._id,
          performedByName: req.user.name,
          comment: `Manager approved. ${comment || ''}`
        })
      } else {
        reimbursement.managerApproval = {
          approver: req.user._id,
          status: 'rejected',
          comment,
          actionAt: new Date()
        }
        reimbursement.status = 'rejected'
        reimbursement.rejectedBy = req.user._id
        reimbursement.rejectedAt = new Date()
        reimbursement.rejectionReason = comment

        reimbursement.activities.push({
          action: 'rejected',
          performedBy: req.user._id,
          performedByName: req.user.name,
          comment: `Manager rejected. ${comment || ''}`
        })
      }

      await reimbursement.save()

      res.json({
        success: true,
        data: reimbursement,
        message: approved ? 'Approved and forwarded to HR' : 'Rejected'
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
 * @desc    HR approval (Level 2 - Abhiji/Sandarsh)
 * @route   PUT /api/reimbursements/:id/hr-approve
 * @access  Private (HR)
 */
router.put('/:id/hr-approve',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { approved, comment, approvedAmount } = req.body

      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement not found'
        })
      }

      if (reimbursement.currentApprovalLevel !== 2) {
        return res.status(400).json({
          success: false,
          message: 'This reimbursement is not at HR approval level'
        })
      }

      if (approved) {
        reimbursement.hrApproval = {
          approver: req.user._id,
          status: 'approved',
          comment,
          approvedAmount: approvedAmount || reimbursement.managerApproval?.approvedAmount || reimbursement.amount,
          actionAt: new Date()
        }
        reimbursement.status = 'pending_final'
        reimbursement.currentApprovalLevel = 3

        reimbursement.activities.push({
          action: 'approved',
          performedBy: req.user._id,
          performedByName: req.user.name,
          comment: `HR approved. ${comment || ''}`
        })
      } else {
        reimbursement.hrApproval = {
          approver: req.user._id,
          status: 'rejected',
          comment,
          actionAt: new Date()
        }
        reimbursement.status = 'rejected'
        reimbursement.rejectedBy = req.user._id
        reimbursement.rejectedAt = new Date()
        reimbursement.rejectionReason = comment

        reimbursement.activities.push({
          action: 'rejected',
          performedBy: req.user._id,
          performedByName: req.user.name,
          comment: `HR rejected. ${comment || ''}`
        })
      }

      await reimbursement.save()

      res.json({
        success: true,
        data: reimbursement,
        message: approved ? 'Approved and forwarded for final approval' : 'Rejected'
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
 * @desc    Final approval (Level 3 - Sandeep/Super Admin)
 * @route   PUT /api/reimbursements/:id/final-approve
 * @access  Private (Super Admin)
 */
router.put('/:id/final-approve',
  async (req, res) => {
    try {
      const { approved, comment, approvedAmount } = req.body

      // Check if user is super_admin or company_admin
      if (!['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only super admin can give final approval'
        })
      }

      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement not found'
        })
      }

      if (reimbursement.currentApprovalLevel !== 3) {
        return res.status(400).json({
          success: false,
          message: 'This reimbursement is not at final approval level'
        })
      }

      if (approved) {
        const finalAmount = approvedAmount ||
          reimbursement.hrApproval?.approvedAmount ||
          reimbursement.managerApproval?.approvedAmount ||
          reimbursement.amount

        reimbursement.finalApproval = {
          approver: req.user._id,
          status: 'approved',
          comment,
          approvedAmount: finalAmount,
          actionAt: new Date()
        }
        reimbursement.status = 'pending_payment'
        reimbursement.approvedBy = req.user._id
        reimbursement.approvedAt = new Date()
        reimbursement.approvedAmount = finalAmount

        reimbursement.activities.push({
          action: 'approved',
          performedBy: req.user._id,
          performedByName: req.user.name,
          comment: `Final approval granted. Amount: ₹${finalAmount}. ${comment || ''}`
        })
      } else {
        reimbursement.finalApproval = {
          approver: req.user._id,
          status: 'rejected',
          comment,
          actionAt: new Date()
        }
        reimbursement.status = 'rejected'
        reimbursement.rejectedBy = req.user._id
        reimbursement.rejectedAt = new Date()
        reimbursement.rejectionReason = comment

        reimbursement.activities.push({
          action: 'rejected',
          performedBy: req.user._id,
          performedByName: req.user.name,
          comment: `Final approval rejected. ${comment || ''}`
        })
      }

      await reimbursement.save()

      res.json({
        success: true,
        data: reimbursement,
        message: approved ? 'Final approval granted' : 'Rejected'
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
 * @desc    Tag HR team member
 * @route   PUT /api/reimbursements/:id/tag-hr
 * @access  Private
 */
router.put('/:id/tag-hr',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const { hrUserIds } = req.body

      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement not found'
        })
      }

      // Add HR team members
      for (const hrUserId of hrUserIds) {
        const alreadyTagged = reimbursement.hrTeamTagged?.some(
          t => t.user.toString() === hrUserId
        )

        if (!alreadyTagged) {
          if (!reimbursement.hrTeamTagged) {
            reimbursement.hrTeamTagged = []
          }
          reimbursement.hrTeamTagged.push({
            user: hrUserId,
            taggedAt: new Date(),
            taggedBy: req.user._id
          })

          reimbursement.activities.push({
            action: 'comment_added',
            performedBy: req.user._id,
            performedByName: req.user.name,
            comment: 'Tagged HR team member'
          })
        }
      }

      await reimbursement.save()

      res.json({
        success: true,
        data: reimbursement,
        message: 'HR team members tagged successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ============================================
// SEPARATE PAYMENT ENTRIES
// ============================================

/**
 * @desc    Add payment entry to reimbursement
 * @route   POST /api/reimbursements/:id/payments
 * @access  Private (Finance)
 */
router.post('/:id/payments',
  requirePermission(PERMISSIONS.PROJECTS_MANAGE_FINANCIALS),
  async (req, res) => {
    try {
      const {
        amount,
        paymentMethod,
        transactionReference,
        bankDetails,
        chequeDetails,
        upiDetails,
        remarks
      } = req.body

      const reimbursement = await Reimbursement.findById(req.params.id)

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement not found'
        })
      }

      if (!['approved', 'pending_payment', 'partially_paid'].includes(reimbursement.status)) {
        return res.status(400).json({
          success: false,
          message: 'Reimbursement is not ready for payment'
        })
      }

      // Generate payment ID
      const companyCode = req.activeCompany?.code || 'IP'
      const year = new Date().getFullYear()
      const paymentCount = (reimbursement.payments?.length || 0) + 1
      const paymentId = `${companyCode}-PAY-${year}-${String(paymentCount).padStart(4, '0')}`

      const paymentEntry = {
        paymentId,
        amount: parseFloat(amount),
        paymentDate: new Date(),
        paymentMethod,
        transactionReference,
        bankDetails,
        chequeDetails,
        upiDetails,
        processedBy: req.user._id,
        processedByName: req.user.name,
        remarks,
        createdAt: new Date()
      }

      if (!reimbursement.payments) {
        reimbursement.payments = []
      }

      reimbursement.payments.push(paymentEntry)

      reimbursement.activities.push({
        action: 'paid',
        performedBy: req.user._id,
        performedByName: req.user.name,
        comment: `Payment of ₹${amount} recorded via ${paymentMethod}. Ref: ${transactionReference || 'N/A'}`
      })

      await reimbursement.save() // Pre-save hook will calculate totals

      res.json({
        success: true,
        data: reimbursement,
        message: `Payment of ₹${amount} recorded successfully`
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
 * @desc    Get payment history for a reimbursement
 * @route   GET /api/reimbursements/:id/payments
 * @access  Private
 */
router.get('/:id/payments',
  async (req, res) => {
    try {
      const reimbursement = await Reimbursement.findById(req.params.id)
        .select('payments totalPaidAmount balanceAmount approvedAmount amount')
        .populate('payments.processedBy', 'name')

      if (!reimbursement) {
        return res.status(404).json({
          success: false,
          message: 'Reimbursement not found'
        })
      }

      res.json({
        success: true,
        data: {
          payments: reimbursement.payments || [],
          summary: {
            approvedAmount: reimbursement.approvedAmount || reimbursement.amount,
            totalPaid: reimbursement.totalPaidAmount || 0,
            balance: reimbursement.balanceAmount || (reimbursement.approvedAmount || reimbursement.amount)
          }
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
 * @desc    Get approval workflow summary
 * @route   GET /api/reimbursements/workflow/summary
 * @access  Private (Admin)
 */
router.get('/workflow/summary',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      const summary = await Reimbursement.aggregate([
        { $match: { company: companyId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])

      // Pending at each level
      const pendingManager = await Reimbursement.countDocuments({
        company: companyId,
        status: 'pending_manager'
      })

      const pendingHR = await Reimbursement.countDocuments({
        company: companyId,
        status: 'pending_hr'
      })

      const pendingFinal = await Reimbursement.countDocuments({
        company: companyId,
        status: 'pending_final'
      })

      const pendingPayment = await Reimbursement.countDocuments({
        company: companyId,
        status: { $in: ['pending_payment', 'partially_paid'] }
      })

      res.json({
        success: true,
        data: {
          byStatus: summary,
          workflow: {
            pendingManager,
            pendingHR,
            pendingFinal,
            pendingPayment
          }
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
