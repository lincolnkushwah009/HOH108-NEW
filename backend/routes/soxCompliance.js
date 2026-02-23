import express from 'express'
import SoDConflict from '../models/SoDConflict.js'
import UserAccessReview from '../models/UserAccessReview.js'
import User from '../models/User.js'
import Role from '../models/Role.js'
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

/**
 * Modules to check for SoD conflicts.
 * The Role model has module-level permissions like: Dashboard, Sales, Procurement,
 * Inventory, HR, Finance, Projects, Customers, Leads, Settings, Reports.
 * Each module can have: view, create, edit, delete, approve, export.
 * Conflict: user has both "create" and "approve" for the same module.
 */
const SOD_MODULES = [
  'Sales', 'Procurement', 'Inventory', 'HR', 'Finance', 'Projects', 'Customers', 'Leads'
]

// Scan for SoD conflicts
router.post('/sod/scan', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    // Get all active users in the company
    const users = await User.find({ company: companyId, isActive: true })
      .populate('userRole')
      .select('name email role userRole permissionOverrides')

    // Get all roles for the company
    const roles = await Role.find({ company: companyId, isActive: true })

    const conflicts = []

    for (const user of users) {
      // Get the user's custom Role (if assigned)
      let userCustomRole = user.userRole
      if (!userCustomRole && user.role) {
        // Try to find a matching role by baseRole
        userCustomRole = roles.find(r => r.baseRole === user.role)
      }

      if (!userCustomRole) continue

      const permissions = userCustomRole.permissions || {}

      // Check each module for create + approve conflict
      for (const module of SOD_MODULES) {
        const modulePerms = permissions[module] || []

        const hasCreate = modulePerms.includes('create')
        const hasApprove = modulePerms.includes('approve')

        if (hasCreate && hasApprove) {
          conflicts.push({
            company: companyId,
            user: user._id,
            conflictType: 'permission_conflict',
            conflictingRoles: [userCustomRole.roleName || user.role],
            conflictingPermissions: [`${module}:create`, `${module}:approve`],
            riskLevel: ['Finance', 'Procurement'].includes(module) ? 'high' : 'medium',
            status: 'detected',
            detectedAt: new Date()
          })
        }
      }
    }

    // Save all detected conflicts (avoid duplicates by checking existing)
    let newCount = 0
    let existingCount = 0

    for (const conflict of conflicts) {
      // Check if an identical unresolved conflict already exists
      const existing = await SoDConflict.findOne({
        company: companyId,
        user: conflict.user,
        conflictingPermissions: { $all: conflict.conflictingPermissions },
        status: { $in: ['detected', 'acknowledged'] }
      })

      if (!existing) {
        await SoDConflict.create(conflict)
        newCount++
      } else {
        existingCount++
      }
    }

    res.json({
      success: true,
      message: `SoD scan complete. ${newCount} new conflicts detected, ${existingCount} existing conflicts unchanged.`,
      data: {
        totalUsersScanned: users.length,
        newConflicts: newCount,
        existingConflicts: existingCount,
        totalConflictsFound: conflicts.length
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List SoD conflicts (company scoped, paginated)
router.get('/sod/conflicts', async (req, res) => {
  try {
    const {
      status,
      riskLevel,
      conflictType,
      userId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (riskLevel) queryFilter.riskLevel = riskLevel
    if (conflictType) queryFilter.conflictType = conflictType
    if (userId) queryFilter.user = userId

    const total = await SoDConflict.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const conflicts = await SoDConflict.find(queryFilter)
      .populate('user', 'name email role')
      .populate('resolvedBy', 'name email')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: conflicts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update conflict (mitigate/accept with justification)
router.put('/sod/conflicts/:id', async (req, res) => {
  try {
    const { status, mitigationControl, justification } = req.body

    const conflict = await SoDConflict.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!conflict) {
      return res.status(404).json({ success: false, message: 'SoD conflict not found' })
    }

    if (status) conflict.status = status
    if (mitigationControl) conflict.mitigationControl = mitigationControl
    if (justification) {
      conflict.mitigationControl = conflict.mitigationControl
        ? `${conflict.mitigationControl}\nJustification: ${justification}`
        : `Justification: ${justification}`
    }

    if (['mitigated', 'accepted', 'resolved'].includes(status)) {
      conflict.resolvedAt = new Date()
      conflict.resolvedBy = req.user._id
    }

    await conflict.save()

    const populated = await SoDConflict.findById(conflict._id)
      .populate('user', 'name email role')
      .populate('resolvedBy', 'name email')

    res.json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create access review campaign
router.post('/access-reviews', async (req, res) => {
  try {
    const { name, scope, dueDate } = req.body

    if (!name || !dueDate) {
      return res.status(400).json({ success: false, message: 'Name and dueDate are required' })
    }

    const companyId = req.activeCompany._id

    // Build review entries from active users in company
    const userFilter = { company: companyId, isActive: true }
    if (scope === 'admins') {
      userFilter.role = { $in: ['super_admin', 'company_admin'] }
    } else if (scope === 'finance') {
      userFilter.role = 'finance'
    }

    const users = await User.find(userFilter)
      .select('name email role lastLogin')

    const reviewEntries = users.map(u => ({
      user: u._id,
      currentRole: u.role,
      permissions: u.getPermissions ? u.getPermissions() : [],
      lastLogin: u.lastLogin || null,
      reviewStatus: 'pending'
    }))

    const review = await UserAccessReview.create({
      company: companyId,
      reviewPeriod: {
        from: new Date(),
        to: new Date(dueDate)
      },
      status: 'scheduled',
      reviewType: 'ad_hoc',
      reviewEntries,
      scheduledDate: new Date(dueDate),
      initiatedBy: req.user._id
    })

    const populated = await UserAccessReview.findById(review._id)
      .populate('initiatedBy', 'name email')
      .populate('reviewEntries.user', 'name email role')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List review campaigns
router.get('/access-reviews', async (req, res) => {
  try {
    const {
      status,
      reviewType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (reviewType) queryFilter.reviewType = reviewType

    const total = await UserAccessReview.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const reviews = await UserAccessReview.find(queryFilter)
      .populate('initiatedBy', 'name email')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-reviewEntries')

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get review detail with entries
router.get('/access-reviews/:id', async (req, res) => {
  try {
    const review = await UserAccessReview.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('initiatedBy', 'name email')
      .populate('reviewEntries.user', 'name email role lastLogin')
      .populate('reviewEntries.reviewedBy', 'name email')

    if (!review) {
      return res.status(404).json({ success: false, message: 'Access review not found' })
    }

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Review individual entry (maintain/revoke/modify)
router.put('/access-reviews/:id/entries/:entryId', async (req, res) => {
  try {
    const { decision, notes } = req.body

    if (!decision || !['maintain', 'revoke', 'modify'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be one of: maintain, revoke, modify'
      })
    }

    const review = await UserAccessReview.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!review) {
      return res.status(404).json({ success: false, message: 'Access review not found' })
    }

    const entry = review.reviewEntries.id(req.params.entryId)
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Review entry not found' })
    }

    // Map decision to entry status
    const statusMap = {
      maintain: 'confirmed',
      revoke: 'revoked',
      modify: 'modified'
    }

    entry.reviewStatus = statusMap[decision]
    entry.reviewedBy = req.user._id
    entry.reviewedAt = new Date()
    entry.comments = notes || ''

    // Check if all entries are reviewed
    const allReviewed = review.reviewEntries.every(e => e.reviewStatus !== 'pending')
    if (allReviewed) {
      review.status = 'completed'
      review.completedDate = new Date()
    } else if (review.status === 'scheduled') {
      review.status = 'in_progress'
    }

    await review.save()

    res.json({ success: true, data: entry })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Control effectiveness dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    // Count conflicts by status
    const conflictsByStatus = await SoDConflict.aggregate([
      { $match: { company: companyId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    // Count conflicts by risk level
    const conflictsByRisk = await SoDConflict.aggregate([
      { $match: { company: companyId } },
      {
        $group: {
          _id: '$riskLevel',
          count: { $sum: 1 }
        }
      }
    ])

    // Count access reviews by status
    const reviewsByStatus = await UserAccessReview.aggregate([
      { $match: { company: companyId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    // Total counts
    const totalConflicts = await SoDConflict.countDocuments({ company: companyId })
    const openConflicts = await SoDConflict.countDocuments({
      company: companyId,
      status: { $in: ['detected', 'acknowledged'] }
    })
    const totalReviews = await UserAccessReview.countDocuments({ company: companyId })
    const overdueReviews = await UserAccessReview.countDocuments({
      company: companyId,
      status: { $in: ['scheduled', 'in_progress'] },
      scheduledDate: { $lt: new Date() }
    })

    res.json({
      success: true,
      data: {
        conflicts: {
          total: totalConflicts,
          open: openConflicts,
          byStatus: conflictsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count
            return acc
          }, {}),
          byRiskLevel: conflictsByRisk.reduce((acc, item) => {
            acc[item._id] = item.count
            return acc
          }, {})
        },
        accessReviews: {
          total: totalReviews,
          overdue: overdueReviews,
          byStatus: reviewsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count
            return acc
          }, {})
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
