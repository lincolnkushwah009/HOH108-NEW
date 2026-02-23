import express from 'express'
import MasterAgreement from '../models/MasterAgreement.js'
import Project from '../models/Project.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  canAccessProject,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'
import { notifyEvent } from '../utils/notificationService.js'

const router = express.Router()

// Public route for email approval (uses token)
router.get('/email-approve/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { action } = req.query // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve or reject.'
      })
    }

    // Find agreement with this token
    const agreement = await MasterAgreement.findOne({
      'approvalItems.approvals.emailToken': token
    })

    if (!agreement) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired approval token'
      })
    }

    // Validate and get approval info
    const validation = await agreement.validateEmailToken(token)

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      })
    }

    // Process the approval
    const status = action === 'approve' ? 'approved' : 'rejected'
    await agreement.processApproval(
      validation.approvalItemId,
      validation.approverId,
      status,
      `${action === 'approve' ? 'Approved' : 'Rejected'} via email`,
      validation.approverId,
      'Email Approver'
    )

    // Return success page/redirect
    res.json({
      success: true,
      message: `Successfully ${action}d the approval item`,
      data: {
        agreementId: agreement.agreementId,
        itemType: validation.approvalItem.type,
        action: status
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// Protected routes below
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all master agreements (company-scoped)
 * @route   GET /api/approvals/agreements
 * @access  Private
 */
router.get('/agreements',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const {
        status,
        project,
        customer,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query

      const queryFilter = companyScopedQuery(req)

      if (status) queryFilter.status = status
      if (project) queryFilter.project = project
      if (customer) queryFilter.customer = customer

      const total = await MasterAgreement.countDocuments(queryFilter)

      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

      const agreements = await MasterAgreement.find(queryFilter)
        .populate('project', 'title projectId')
        .populate('customer', 'name customerId')
        .populate('approvers.user', 'name email role')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      res.json({
        success: true,
        data: agreements,
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
 * @desc    Get single master agreement
 * @route   GET /api/approvals/agreements/:id
 * @access  Private
 */
router.get('/agreements/:id',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const agreement = await MasterAgreement.findById(req.params.id)
        .populate('project', 'title projectId status')
        .populate('customer', 'name customerId email phone')
        .populate('salesOrder', 'salesOrderId title')
        .populate('approvers.user', 'name email role approvalAuthority')
        .populate('approvalItems.approvals.approver', 'name email')
        .populate('handover.handedOverBy', 'name')
        .populate('handover.handedOverTo', 'name')
        .populate('handover.projectManager', 'name email')
        .populate('activities.performedBy', 'name avatar')

      if (!agreement) {
        return res.status(404).json({
          success: false,
          message: 'Master agreement not found'
        })
      }

      // Check company access
      if (req.user.role !== 'super_admin' &&
          agreement.company.toString() !== req.activeCompany._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      res.json({
        success: true,
        data: agreement
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
 * @desc    Create master agreement for project
 * @route   POST /api/approvals/agreements
 * @access  Private
 */
router.post('/agreements',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { projectId, approverIds } = req.body

      const project = await Project.findById(projectId)
        .populate('customer')
        .populate('salesOrder')

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      // Check if agreement already exists
      if (project.masterAgreement) {
        return res.status(400).json({
          success: false,
          message: 'Master agreement already exists for this project'
        })
      }

      // Get company for ID generation
      const company = await Company.findById(req.activeCompany._id)
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        })
      }

      // Generate agreement ID
      const agreementId = await company.generateId('masterAgreement')

      // Get approvers
      let approvers = []
      if (approverIds && approverIds.length > 0) {
        const users = await User.find({
          _id: { $in: approverIds },
          'approvalAuthority.isApprover': true
        })

        approvers = users.map(user => ({
          user: user._id,
          role: user.approvalAuthority.approverRole,
          isMandatory: ['cbo', 'ceo'].includes(user.approvalAuthority.approverRole)
        }))
      } else {
        // Auto-assign approvers based on roles
        const approverUsers = await User.find({
          company: req.activeCompany._id,
          'approvalAuthority.isApprover': true,
          isActive: true
        })

        approvers = approverUsers.map(user => ({
          user: user._id,
          role: user.approvalAuthority.approverRole,
          isMandatory: ['cbo', 'ceo'].includes(user.approvalAuthority.approverRole)
        }))
      }

      if (approvers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No approvers configured. Please set up approvers first.'
        })
      }

      const agreement = await MasterAgreement.create({
        agreementId,
        company: req.activeCompany._id,
        project: projectId,
        customer: project.customer?._id,
        salesOrder: project.salesOrder?._id,
        approvers,
        status: 'draft',
        activities: [{
          action: 'created',
          description: `Master agreement created by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        }],
        createdBy: req.user._id,
        createdByName: req.user.name
      })

      // Update project
      project.masterAgreement = agreement._id
      project.activities.push({
        action: 'master_agreement_created',
        description: `Master agreement ${agreementId} created`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })
      await project.save()

      await agreement.populate('approvers.user', 'name email role')

      res.status(201).json({
        success: true,
        data: agreement,
        message: 'Master agreement created successfully'
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
 * @desc    Add approval item to agreement
 * @route   POST /api/approvals/agreements/:id/items
 * @access  Private
 */
router.post('/agreements/:id/items',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { type, documentName, documentUrl, remarks } = req.body

      const agreement = await MasterAgreement.findById(req.params.id)

      if (!agreement) {
        return res.status(404).json({
          success: false,
          message: 'Master agreement not found'
        })
      }

      if (agreement.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify approved agreement'
        })
      }

      // Check if item type already exists
      const existingItem = agreement.approvalItems.find(item => item.type === type)
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: `${type.replace(/_/g, ' ')} already exists. Update it instead.`
        })
      }

      await agreement.addApprovalItem({
        type,
        documentName,
        documentUrl,
        remarks
      }, req.user._id, req.user.name)

      res.json({
        success: true,
        data: agreement,
        message: 'Approval item added successfully'
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
 * @desc    Update approval item document
 * @route   PUT /api/approvals/agreements/:id/items/:itemId
 * @access  Private
 */
router.put('/agreements/:id/items/:itemId',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { documentName, documentUrl, remarks } = req.body

      const agreement = await MasterAgreement.findById(req.params.id)

      if (!agreement) {
        return res.status(404).json({
          success: false,
          message: 'Master agreement not found'
        })
      }

      const item = agreement.approvalItems.id(req.params.itemId)
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Approval item not found'
        })
      }

      if (item.overallStatus === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify approved item'
        })
      }

      // Update document
      if (documentName) item.document.name = documentName
      if (documentUrl) item.document.url = documentUrl
      if (remarks) item.remarks = remarks

      // Reset approvals if document changed
      if (documentUrl && item.approvals.length > 0) {
        item.approvals = []
        item.overallStatus = 'pending'
      }

      agreement.activities.push({
        action: 'item_updated',
        description: `${item.type.replace(/_/g, ' ')} document updated by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })

      await agreement.save()

      res.json({
        success: true,
        data: agreement,
        message: 'Approval item updated'
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
 * @desc    Submit agreement for approval
 * @route   PUT /api/approvals/agreements/:id/submit
 * @access  Private
 */
router.put('/agreements/:id/submit',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { sendEmailNotifications } = req.body

      const agreement = await MasterAgreement.findById(req.params.id)
        .populate('approvers.user', 'name email')

      if (!agreement) {
        return res.status(404).json({
          success: false,
          message: 'Master agreement not found'
        })
      }

      if (agreement.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Only draft agreements can be submitted'
        })
      }

      // Validate all 4 approval items exist
      const requiredTypes = ['material_quotation', 'material_spend', 'payment_schedule', 'schedule_of_work']
      const missingTypes = requiredTypes.filter(type =>
        !agreement.approvalItems.find(item => item.type === type)
      )

      if (missingTypes.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing approval items: ${missingTypes.join(', ').replace(/_/g, ' ')}`
        })
      }

      await agreement.submitForApproval(req.user._id, req.user.name)

      // Generate email tokens if requested
      if (sendEmailNotifications) {
        for (const item of agreement.approvalItems) {
          for (const approver of agreement.approvers) {
            const token = await agreement.generateApprovalToken(item._id, approver.user._id)
            // TODO: Send email with approval link
            // const approvalLink = `${process.env.FRONTEND_URL}/api/approvals/email-approve/${token}?action=approve`
            // const rejectLink = `${process.env.FRONTEND_URL}/api/approvals/email-approve/${token}?action=reject`
          }
        }
      }

      res.json({
        success: true,
        data: agreement,
        message: 'Agreement submitted for approval'
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
 * @desc    Process approval for an item (dashboard approval)
 * @route   PUT /api/approvals/agreements/:id/items/:itemId/approve
 * @access  Private
 */
router.put('/agreements/:id/items/:itemId/approve',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { status, remarks } = req.body

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be approved or rejected'
        })
      }

      const agreement = await MasterAgreement.findById(req.params.id)

      if (!agreement) {
        return res.status(404).json({
          success: false,
          message: 'Master agreement not found'
        })
      }

      // Verify user is an approver
      const isApprover = agreement.approvers.some(
        a => a.user.toString() === req.user._id.toString()
      )

      if (!isApprover && !['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to approve this item'
        })
      }

      await agreement.processApproval(
        req.params.itemId,
        req.user._id,
        status,
        remarks,
        req.user._id,
        req.user.name
      )

      // Update project approval status
      const project = await Project.findById(agreement.project)
      if (project) {
        const item = agreement.approvalItems.id(req.params.itemId)
        if (item) {
          project.approvalStatus[item.type] = item.overallStatus
          project.approvalStatus.allApproved = agreement.status === 'approved'
          await project.save()
        }
      }

      await agreement.populate('approvalItems.approvals.approver', 'name email')

      // Notify all approvers and the agreement creator
      const approvalRecipients = agreement.approvers
        .map(a => a.user.toString())
        .filter(id => id !== req.user._id.toString())
      if (agreement.createdBy) {
        approvalRecipients.push(agreement.createdBy.toString())
      }
      const item = agreement.approvalItems.id(req.params.itemId)
      notifyEvent({
        companyId: agreement.company,
        event: 'approval_status_changed',
        entityType: 'approval',
        entityId: agreement._id,
        title: `Approval ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `${item?.type || 'Item'} in agreement "${agreement.title || agreement.agreementId}" has been ${status} by ${req.user.name}.${remarks ? ` Remarks: ${remarks}` : ''}`,
        recipientUserIds: [...new Set(approvalRecipients)],
        performedBy: req.user._id,
        metadata: { entityLabel: agreement.agreementId || agreement.title, status }
      })

      res.json({
        success: true,
        data: agreement,
        message: `Item ${status}`
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
 * @desc    Complete handover to operations
 * @route   POST /api/approvals/agreements/:id/handover
 * @access  Private
 */
router.post('/agreements/:id/handover',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { projectManagerId, notes, documents } = req.body

      const agreement = await MasterAgreement.findById(req.params.id)

      if (!agreement) {
        return res.status(404).json({
          success: false,
          message: 'Master agreement not found'
        })
      }

      if (agreement.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Agreement must be fully approved before handover'
        })
      }

      // Verify user is CBO or authorized
      const isCBO = req.user.approvalAuthority?.approverRole === 'cbo'
      if (!isCBO && !['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only CBO can perform handover to operations'
        })
      }

      // Get project manager
      const projectManager = await User.findById(projectManagerId)
      if (!projectManager) {
        return res.status(400).json({
          success: false,
          message: 'Project manager not found'
        })
      }

      await agreement.completeHandover(
        projectManagerId,
        projectManager.name,
        req.user._id,
        req.user.name,
        notes,
        documents
      )

      // Update project
      const project = await Project.findById(agreement.project)
      if (project) {
        project.projectManager = projectManagerId
        project.departmentAssignments.operations = {
          lead: projectManagerId,
          team: []
        }
        project.handovers.push({
          from: {
            department: 'sales',
            user: req.user._id
          },
          to: {
            department: 'operations',
            user: projectManagerId
          },
          handoverDate: new Date(),
          notes,
          documents
        })
        project.activities.push({
          action: 'handover_completed',
          description: `Project handed over to ${projectManager.name} by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        })
        await project.save()
      }

      await agreement.populate('handover.projectManager', 'name email')

      res.json({
        success: true,
        data: agreement,
        message: 'Handover to operations completed successfully'
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
 * @desc    Get my pending approvals
 * @route   GET /api/approvals/pending
 * @access  Private
 */
router.get('/pending',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const agreements = await MasterAgreement.find({
        company: req.activeCompany._id,
        'approvers.user': req.user._id,
        status: { $in: ['pending_approval', 'partially_approved'] }
      })
        .populate('project', 'title projectId')
        .populate('customer', 'name')

      // Filter to items that need this user's approval
      const pendingItems = []
      for (const agreement of agreements) {
        for (const item of agreement.approvalItems) {
          const hasApproved = item.approvals.some(
            a => a.approver.toString() === req.user._id.toString()
          )
          if (!hasApproved && item.overallStatus !== 'approved') {
            pendingItems.push({
              agreementId: agreement._id,
              agreementNumber: agreement.agreementId,
              project: agreement.project,
              customer: agreement.customer,
              itemId: item._id,
              itemType: item.type,
              documentName: item.document.name,
              documentUrl: item.document.url,
              submittedAt: agreement.timeline?.submittedAt
            })
          }
        }
      }

      res.json({
        success: true,
        data: pendingItems,
        count: pendingItems.length
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
 * @desc    Get approval statistics
 * @route   GET /api/approvals/stats
 * @access  Private
 */
router.get('/stats',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const queryFilter = companyScopedQuery(req)

      const stats = await MasterAgreement.aggregate([
        { $match: queryFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])

      const totalAgreements = await MasterAgreement.countDocuments(queryFilter)
      const pendingHandover = await MasterAgreement.countDocuments({
        ...queryFilter,
        status: 'approved',
        'handover.isCompleted': false
      })

      res.json({
        success: true,
        data: {
          total: totalAgreements,
          byStatus: stats,
          pendingHandover
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
