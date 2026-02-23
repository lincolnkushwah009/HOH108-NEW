import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import AdvanceRequest from '../models/AdvanceRequest.js'
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

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/advance-requests'
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'advance-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('Only images and PDF are allowed'))
  }
})

// All routes protected
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all advance requests
 * @route   GET /api/advance-requests
 * @access  Private (HR/Admin)
 */
router.get('/',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const {
        status,
        advanceType,
        employee,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query

      const query = companyScopedQuery(req)

      if (status) query.status = status
      if (advanceType) query.advanceType = advanceType
      if (employee) query.employee = employee

      if (startDate || endDate) {
        query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)
      }

      const total = await AdvanceRequest.countDocuments(query)

      const advances = await AdvanceRequest.find(query)
        .populate('employee', 'name email avatar designation department')
        .populate('managerApproval.approver', 'name email')
        .populate('hrApproval.approver', 'name email')
        .populate('finalApproval.approver', 'name email')
        .populate('disbursement.disbursedBy', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      res.json({
        success: true,
        data: advances,
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
 * @desc    Get my advance requests
 * @route   GET /api/advance-requests/my
 * @access  Private
 */
router.get('/my', async (req, res) => {
  try {
    const advances = await AdvanceRequest.find({
      employee: req.user._id
    })
      .populate('managerApproval.approver', 'name')
      .populate('hrApproval.approver', 'name')
      .populate('finalApproval.approver', 'name')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: advances
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get pending approvals for current user
 * @route   GET /api/advance-requests/pending-approvals
 * @access  Private
 */
router.get('/pending-approvals', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const userId = req.user._id
    const userRole = req.user.role

    let query = { company: companyId }

    // Determine what approvals the user can see
    if (userRole === 'super_admin') {
      // Super admin sees all pending final approvals
      query.status = { $in: ['pending_hr', 'hr_approved', 'pending_finance'] }
    } else if (['company_admin', 'sales_manager'].includes(userRole)) {
      // HR roles see pending HR approvals
      query.$or = [
        { status: 'pending_hr' },
        { 'hrApproval.approver': userId, 'hrApproval.status': 'pending' }
      ]
    } else {
      // Managers see their direct reports' requests
      query['managerApproval.approver'] = userId
      query.status = 'pending_hr'
      query['managerApproval.status'] = 'pending'
    }

    const advances = await AdvanceRequest.find(query)
      .populate('employee', 'name email avatar designation department')
      .populate('managerApproval.approver', 'name')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: advances
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get single advance request
 * @route   GET /api/advance-requests/:id
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const advance = await AdvanceRequest.findById(req.params.id)
      .populate('employee', 'name email avatar designation department salary')
      .populate('managerApproval.approver', 'name email')
      .populate('hrApproval.approver', 'name email')
      .populate('finalApproval.approver', 'name email')
      .populate('hrTeamTagged.user', 'name email avatar')
      .populate('financeProcessing.processedBy', 'name')
      .populate('disbursement.disbursedBy', 'name')
      .populate('recovery.recoveryEntries.recordedBy', 'name')
      .populate('activities.performedBy', 'name')

    if (!advance) {
      return res.status(404).json({
        success: false,
        message: 'Advance request not found'
      })
    }

    res.json({
      success: true,
      data: advance
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Create advance request
 * @route   POST /api/advance-requests
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    // Get company for ID generation
    const company = await Company.findById(companyId)
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Company not found'
      })
    }

    // Get employee's manager
    const employee = await User.findById(req.user._id).populate('reportsTo')

    // Generate advance ID
    const year = new Date().getFullYear()
    const count = await AdvanceRequest.countDocuments({
      company: companyId,
      createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    })
    const advanceId = `${company.code}-ADV-${year}-${String(count + 1).padStart(5, '0')}`

    const advanceData = {
      ...req.body,
      advanceId,
      employee: req.user._id,
      company: companyId,
      managerApproval: {
        approver: employee.reportsTo?._id || null,
        status: 'pending'
      },
      activities: [{
        action: 'created',
        performedBy: req.user._id,
        performedByName: req.user.name,
        createdAt: new Date()
      }]
    }

    const advance = await AdvanceRequest.create(advanceData)

    const populatedAdvance = await AdvanceRequest.findById(advance._id)
      .populate('employee', 'name email')
      .populate('managerApproval.approver', 'name email')

    res.status(201).json({
      success: true,
      data: populatedAdvance,
      message: 'Advance request created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Manager approval (Level 1)
 * @route   PUT /api/advance-requests/:id/manager-approve
 * @access  Private
 */
router.put('/:id/manager-approve', async (req, res) => {
  try {
    const { approved, comment, approvedAmount } = req.body

    const advance = await AdvanceRequest.findById(req.params.id)

    if (!advance) {
      return res.status(404).json({
        success: false,
        message: 'Advance request not found'
      })
    }

    if (advance.currentApprovalLevel !== 1) {
      return res.status(400).json({
        success: false,
        message: 'This request is not at manager approval level'
      })
    }

    if (approved) {
      advance.managerApproval.status = 'approved'
      advance.managerApproval.approvedAmount = approvedAmount || advance.requestedAmount
      advance.status = 'pending_hr'
      advance.currentApprovalLevel = 2

      advance.addActivity('manager_approved', req.user._id, req.user.name, comment)
    } else {
      advance.managerApproval.status = 'rejected'
      advance.status = 'hr_rejected'

      advance.addActivity('manager_rejected', req.user._id, req.user.name, comment)
    }

    advance.managerApproval.approver = req.user._id
    advance.managerApproval.comment = comment
    advance.managerApproval.actionAt = new Date()

    await advance.save()

    res.json({
      success: true,
      data: advance,
      message: approved ? 'Request approved and forwarded to HR' : 'Request rejected'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    HR approval (Level 2)
 * @route   PUT /api/advance-requests/:id/hr-approve
 * @access  Private (HR)
 */
router.put('/:id/hr-approve',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { approved, comment, approvedAmount } = req.body

      const advance = await AdvanceRequest.findById(req.params.id)

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Advance request not found'
        })
      }

      if (advance.currentApprovalLevel !== 2) {
        return res.status(400).json({
          success: false,
          message: 'This request is not at HR approval level'
        })
      }

      if (approved) {
        advance.hrApproval.status = 'approved'
        advance.hrApproval.approvedAmount = approvedAmount ||
          advance.managerApproval.approvedAmount ||
          advance.requestedAmount
        advance.status = 'pending_final'
        advance.currentApprovalLevel = 3

        advance.addActivity('hr_approved', req.user._id, req.user.name, comment)
      } else {
        advance.hrApproval.status = 'rejected'
        advance.status = 'hr_rejected'

        advance.addActivity('hr_rejected', req.user._id, req.user.name, comment)
      }

      advance.hrApproval.approver = req.user._id
      advance.hrApproval.comment = comment
      advance.hrApproval.actionAt = new Date()

      await advance.save()

      res.json({
        success: true,
        data: advance,
        message: approved ? 'Request approved and forwarded for final approval' : 'Request rejected'
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
 * @desc    Final approval (Level 3 - Super Admin)
 * @route   PUT /api/advance-requests/:id/final-approve
 * @access  Private (Super Admin)
 */
router.put('/:id/final-approve', async (req, res) => {
  try {
    const { approved, comment, approvedAmount } = req.body

    // Check if user is super_admin
    if (req.user.role !== 'super_admin' && req.user.role !== 'company_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can give final approval'
      })
    }

    const advance = await AdvanceRequest.findById(req.params.id)

    if (!advance) {
      return res.status(404).json({
        success: false,
        message: 'Advance request not found'
      })
    }

    if (advance.currentApprovalLevel !== 3) {
      return res.status(400).json({
        success: false,
        message: 'This request is not at final approval level'
      })
    }

    if (approved) {
      const finalAmount = approvedAmount ||
        advance.hrApproval.approvedAmount ||
        advance.managerApproval.approvedAmount ||
        advance.requestedAmount

      advance.finalApproval.status = 'approved'
      advance.finalApproval.approvedAmount = finalAmount
      advance.approvedAmount = finalAmount
      advance.status = 'pending_finance'
      advance.recovery.balanceRemaining = finalAmount

      advance.addActivity('final_approved', req.user._id, req.user.name, comment, { approvedAmount: finalAmount })
    } else {
      advance.finalApproval.status = 'rejected'
      advance.status = 'finance_rejected'

      advance.addActivity('final_rejected', req.user._id, req.user.name, comment)
    }

    advance.finalApproval.approver = req.user._id
    advance.finalApproval.comment = comment
    advance.finalApproval.actionAt = new Date()

    await advance.save()

    res.json({
      success: true,
      data: advance,
      message: approved ? 'Request approved and transferred to finance' : 'Request rejected'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Tag HR team member
 * @route   PUT /api/advance-requests/:id/tag-hr
 * @access  Private
 */
router.put('/:id/tag-hr',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const { hrUserIds } = req.body

      const advance = await AdvanceRequest.findById(req.params.id)

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Advance request not found'
        })
      }

      // Add HR team members
      for (const hrUserId of hrUserIds) {
        const alreadyTagged = advance.hrTeamTagged?.some(
          t => t.user.toString() === hrUserId
        )

        if (!alreadyTagged) {
          advance.hrTeamTagged.push({
            user: hrUserId,
            taggedAt: new Date(),
            taggedBy: req.user._id
          })

          advance.addActivity('hr_tagged', req.user._id, req.user.name, `Tagged HR member`)
        }
      }

      await advance.save()

      res.json({
        success: true,
        data: advance,
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

/**
 * @desc    Process finance disbursement
 * @route   PUT /api/advance-requests/:id/disburse
 * @access  Private (Finance)
 */
router.put('/:id/disburse',
  requirePermission(PERMISSIONS.PROJECTS_MANAGE_FINANCIALS),
  async (req, res) => {
    try {
      const {
        disbursementMode,
        transactionReference,
        bankDetails,
        remarks
      } = req.body

      const advance = await AdvanceRequest.findById(req.params.id)

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Advance request not found'
        })
      }

      if (advance.status !== 'pending_finance' && advance.status !== 'finance_approved') {
        return res.status(400).json({
          success: false,
          message: 'This request is not ready for disbursement'
        })
      }

      advance.disbursement = {
        disbursedBy: req.user._id,
        disbursedAt: new Date(),
        disbursementMode,
        transactionReference,
        bankDetails,
        remarks
      }

      advance.status = 'disbursed'

      advance.addActivity('disbursed', req.user._id, req.user.name, remarks, {
        mode: disbursementMode,
        reference: transactionReference
      })

      await advance.save()

      res.json({
        success: true,
        data: advance,
        message: 'Advance disbursed successfully'
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
 * @desc    Record recovery entry
 * @route   POST /api/advance-requests/:id/recovery
 * @access  Private (HR/Finance)
 */
router.post('/:id/recovery',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const {
        amount,
        recoveryMode,
        payrollMonth,
        reference,
        remarks
      } = req.body

      const advance = await AdvanceRequest.findById(req.params.id)

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Advance request not found'
        })
      }

      if (advance.status !== 'disbursed' && advance.status !== 'partially_recovered') {
        return res.status(400).json({
          success: false,
          message: 'This advance is not in a recoverable state'
        })
      }

      if (!advance.recovery) {
        advance.recovery = { totalRecovered: 0, balanceRemaining: advance.approvedAmount, recoveryEntries: [] }
      }

      advance.recovery.recoveryEntries.push({
        amount,
        recoveryDate: new Date(),
        recoveryMode,
        payrollMonth,
        reference,
        recordedBy: req.user._id,
        recordedAt: new Date()
      })

      advance.addActivity('recovery_recorded', req.user._id, req.user.name, remarks, {
        amount,
        mode: recoveryMode
      })

      await advance.save() // Pre-save hook will calculate totals and update status

      res.json({
        success: true,
        data: advance,
        message: `Recovery of ₹${amount} recorded successfully`
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
 * @desc    Upload supporting document
 * @route   POST /api/advance-requests/:id/documents
 * @access  Private
 */
router.post('/:id/documents',
  upload.single('document'),
  async (req, res) => {
    try {
      const advance = await AdvanceRequest.findById(req.params.id)

      if (!advance) {
        return res.status(404).json({
          success: false,
          message: 'Advance request not found'
        })
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a document'
        })
      }

      const documentData = {
        name: req.body.name || req.file.originalname,
        url: `/${req.file.path.replace(/\\/g, '/')}`,
        type: req.file.mimetype,
        uploadedAt: new Date(),
        uploadedBy: req.user._id
      }

      if (!advance.supportingDocuments) {
        advance.supportingDocuments = []
      }

      advance.supportingDocuments.push(documentData)
      await advance.save()

      res.json({
        success: true,
        data: documentData,
        message: 'Document uploaded successfully'
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
 * @desc    Get advance statistics
 * @route   GET /api/advance-requests/stats/summary
 * @access  Private (HR/Admin)
 */
router.get('/stats/summary',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id
      const { year, month } = req.query

      const targetYear = parseInt(year) || new Date().getFullYear()
      const startDate = new Date(targetYear, month ? parseInt(month) - 1 : 0, 1)
      const endDate = month ?
        new Date(targetYear, parseInt(month), 0) :
        new Date(targetYear, 11, 31)

      const stats = await AdvanceRequest.aggregate([
        {
          $match: {
            company: companyId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$requestedAmount' },
            approvedAmount: { $sum: '$approvedAmount' }
          }
        }
      ])

      const byType = await AdvanceRequest.aggregate([
        {
          $match: {
            company: companyId,
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$advanceType',
            count: { $sum: 1 },
            totalAmount: { $sum: '$requestedAmount' }
          }
        }
      ])

      const recoveryStats = await AdvanceRequest.aggregate([
        {
          $match: {
            company: companyId,
            status: { $in: ['disbursed', 'partially_recovered', 'fully_recovered'] }
          }
        },
        {
          $group: {
            _id: null,
            totalDisbursed: { $sum: '$approvedAmount' },
            totalRecovered: { $sum: '$recovery.totalRecovered' },
            totalPending: { $sum: '$recovery.balanceRemaining' }
          }
        }
      ])

      res.json({
        success: true,
        data: {
          byStatus: stats,
          byType,
          recovery: recoveryStats[0] || { totalDisbursed: 0, totalRecovered: 0, totalPending: 0 },
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

export default router
