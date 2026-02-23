import express from 'express'
import ApprovalDelegation from '../models/ApprovalDelegation.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All routes require authentication and company context
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Create a new approval delegation
 * @route   POST /api/approval-delegations
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const { delegateTo, startDate, endDate, scope, reason } = req.body

    if (!delegateTo || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'delegateTo, startDate, and endDate are required'
      })
    }

    // Check for existing active delegation by this user
    const existingDelegation = await ApprovalDelegation.findOne({
      company: req.activeCompany._id,
      delegator: req.user._id,
      status: 'active',
      endDate: { $gte: new Date() }
    })

    if (existingDelegation) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active delegation. Revoke it first before creating a new one.'
      })
    }

    const delegation = await ApprovalDelegation.create({
      company: req.activeCompany._id,
      delegator: req.user._id,
      delegate: delegateTo,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      modules: scope || [],
      reason,
      status: 'active',
      createdBy: req.user._id
    })

    await delegation.populate('delegator', 'name email')
    await delegation.populate('delegate', 'name email')

    res.status(201).json({
      success: true,
      data: delegation,
      message: 'Approval delegation created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    List delegations (company scoped, optional status filter)
 * @route   GET /api/approval-delegations
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const queryFilter = companyScopedQuery(req)

    if (status) {
      queryFilter.status = status
    }

    // Expire overdue delegations first
    await ApprovalDelegation.expireOverdue()

    const total = await ApprovalDelegation.countDocuments(queryFilter)

    const delegations = await ApprovalDelegation.find(queryFilter)
      .populate('delegator', 'name email designation')
      .populate('delegate', 'name email designation')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: delegations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
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
 * @desc    List active delegations created by current user
 * @route   GET /api/approval-delegations/active
 * @access  Private
 */
router.get('/active', async (req, res) => {
  try {
    // Expire overdue delegations first
    await ApprovalDelegation.expireOverdue()

    const delegations = await ApprovalDelegation.find({
      ...companyScopedQuery(req),
      delegator: req.user._id,
      status: 'active'
    })
      .populate('delegate', 'name email designation')
      .sort({ startDate: -1 })

    res.json({
      success: true,
      data: delegations
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Revoke a delegation
 * @route   PUT /api/approval-delegations/:id/revoke
 * @access  Private
 */
router.put('/:id/revoke', async (req, res) => {
  try {
    const delegation = await ApprovalDelegation.findById(req.params.id)

    if (!delegation) {
      return res.status(404).json({
        success: false,
        message: 'Delegation not found'
      })
    }

    // Verify the delegation belongs to the user's company
    if (delegation.company.toString() !== req.activeCompany._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to revoke this delegation'
      })
    }

    // Only the delegator or company admin can revoke
    if (
      delegation.delegator.toString() !== req.user._id.toString() &&
      !['super_admin', 'company_admin'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Only the delegator or an admin can revoke a delegation'
      })
    }

    if (delegation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot revoke a delegation that is already ${delegation.status}`
      })
    }

    delegation.status = 'revoked'
    delegation.revokedAt = new Date()
    await delegation.save()

    await delegation.populate('delegator', 'name email')
    await delegation.populate('delegate', 'name email')

    res.json({
      success: true,
      data: delegation,
      message: 'Delegation has been revoked'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    List delegations where current user is the delegate
 * @route   GET /api/approval-delegations/for-me
 * @access  Private
 */
router.get('/for-me', async (req, res) => {
  try {
    // Expire overdue delegations first
    await ApprovalDelegation.expireOverdue()

    const delegations = await ApprovalDelegation.find({
      ...companyScopedQuery(req),
      delegate: req.user._id,
      status: 'active'
    })
      .populate('delegator', 'name email designation approvalAuthority')
      .sort({ startDate: -1 })

    res.json({
      success: true,
      data: delegations
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router
