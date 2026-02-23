import express from 'express'
import ApprovalMatrix from '../models/ApprovalMatrix.js'
import ApprovalWorkflow from '../models/ApprovalWorkflow.js'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(protect)

// ============================================
// APPROVAL MATRIX MANAGEMENT
// ============================================

// Get all matrices for company
router.get('/matrices', async (req, res) => {
  try {
    const matrices = await ApprovalMatrix.find({ company: req.user.company })
      .populate('department', 'name')
      .populate('createdBy', 'name')
      .sort({ module: 1, activity: 1, priority: -1 })

    res.json({
      success: true,
      count: matrices.length,
      data: matrices
    })
  } catch (error) {
    console.error('Error fetching approval matrices:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single matrix
router.get('/matrices/:id', async (req, res) => {
  try {
    const matrix = await ApprovalMatrix.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .populate('department', 'name')
      .populate('levels.specificUsers', 'name email')
      .populate('levels.department', 'name')

    if (!matrix) {
      return res.status(404).json({ success: false, message: 'Matrix not found' })
    }

    res.json({ success: true, data: matrix })
  } catch (error) {
    console.error('Error fetching matrix:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create new matrix
router.post('/matrices', async (req, res) => {
  try {
    const matrix = await ApprovalMatrix.create({
      ...req.body,
      company: req.user.company,
      createdBy: req.user._id
    })

    res.status(201).json({
      success: true,
      data: matrix
    })
  } catch (error) {
    console.error('Error creating matrix:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update matrix
router.put('/matrices/:id', async (req, res) => {
  try {
    const matrix = await ApprovalMatrix.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    )

    if (!matrix) {
      return res.status(404).json({ success: false, message: 'Matrix not found' })
    }

    res.json({ success: true, data: matrix })
  } catch (error) {
    console.error('Error updating matrix:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete matrix
router.delete('/matrices/:id', async (req, res) => {
  try {
    const matrix = await ApprovalMatrix.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    })

    if (!matrix) {
      return res.status(404).json({ success: false, message: 'Matrix not found' })
    }

    res.json({ success: true, message: 'Matrix deleted' })
  } catch (error) {
    console.error('Error deleting matrix:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Seed default matrices
router.post('/matrices/seed-defaults', async (req, res) => {
  try {
    const created = await ApprovalMatrix.createDefaultMatrices(req.user.company, req.user._id)
    res.json({
      success: true,
      message: `Created ${created.length} default matrices`,
      data: created
    })
  } catch (error) {
    console.error('Error seeding matrices:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get applicable matrix for module/activity
router.get('/matrices/applicable/:module/:activity', async (req, res) => {
  try {
    const { module, activity } = req.params
    const { departmentId, amount } = req.query

    const result = await ApprovalMatrix.findApplicableMatrix(
      req.user.company,
      module,
      activity,
      departmentId || null,
      parseFloat(amount) || 0
    )

    if (!result) {
      return res.status(404).json({
        success: false,
        message: `No approval matrix found for ${module}/${activity}`
      })
    }

    res.json({
      success: true,
      data: {
        matrix: result.matrix,
        applicableLevels: result.applicableLevels
      }
    })
  } catch (error) {
    console.error('Error finding applicable matrix:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// APPROVAL WORKFLOWS
// ============================================

// Get all workflows for company
router.get('/workflows', async (req, res) => {
  try {
    const { status, module, activity, page = 1, limit = 20 } = req.query

    const filter = { company: req.user.company }
    if (status) filter.status = status
    if (module) filter.module = module
    if (activity) filter.activity = activity

    const workflows = await ApprovalWorkflow.find(filter)
      .populate('initiatedBy', 'name email')
      .populate('relatedProject', 'title projectId')
      .populate('relatedCustomer', 'name customerId')
      .populate('relatedVendor', 'name vendorId')
      .populate('finalActionBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    const total = await ApprovalWorkflow.countDocuments(filter)

    res.json({
      success: true,
      count: workflows.length,
      total,
      pages: Math.ceil(total / limit),
      data: workflows
    })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get workflows pending for current user
router.get('/workflows/pending-for-me', async (req, res) => {
  try {
    const workflows = await ApprovalWorkflow.find({
      company: req.user.company,
      status: { $in: ['pending', 'in_progress'] },
      'steps.expectedApprovers.user': req.user._id
    })
      .populate('initiatedBy', 'name email')
      .populate('relatedProject', 'title projectId')
      .populate('relatedCustomer', 'name customerId')
      .populate('approvalMatrix', 'name')
      .sort({ 'sla.dueDate': 1, priority: -1 })

    // Filter to only include workflows where user can act at current level
    const actionableWorkflows = workflows.filter(wf => {
      const currentStep = wf.steps.find(s => s.level === wf.currentLevel)
      return currentStep &&
             currentStep.status === 'pending' &&
             currentStep.expectedApprovers.some(a => a.user.toString() === req.user._id.toString())
    })

    res.json({
      success: true,
      count: actionableWorkflows.length,
      data: actionableWorkflows
    })
  } catch (error) {
    console.error('Error fetching pending workflows:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get workflows initiated by current user
router.get('/workflows/my-requests', async (req, res) => {
  try {
    const { status } = req.query
    const filter = {
      company: req.user.company,
      initiatedBy: req.user._id
    }
    if (status) filter.status = status

    const workflows = await ApprovalWorkflow.find(filter)
      .populate('approvalMatrix', 'name')
      .populate('finalActionBy', 'name')
      .populate('steps.actionBy', 'name')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      count: workflows.length,
      data: workflows
    })
  } catch (error) {
    console.error('Error fetching my requests:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single workflow
router.get('/workflows/:id', async (req, res) => {
  try {
    const workflow = await ApprovalWorkflow.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .populate('approvalMatrix', 'name settings')
      .populate('initiatedBy', 'name email')
      .populate('relatedProject', 'title projectId customer')
      .populate('relatedCustomer', 'name customerId')
      .populate('relatedVendor', 'name vendorId')
      .populate('relatedMaterial', 'name materialCode')
      .populate('steps.expectedApprovers.user', 'name email')
      .populate('steps.actionBy', 'name email')
      .populate('finalActionBy', 'name email')

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' })
    }

    res.json({ success: true, data: workflow })
  } catch (error) {
    console.error('Error fetching workflow:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create new workflow (initiate approval)
router.post('/workflows', async (req, res) => {
  try {
    const workflow = await ApprovalWorkflow.createWorkflow({
      ...req.body,
      company: req.user.company,
      initiatedBy: req.user._id
    })

    // Determine expected approvers at first level and notify them
    // This would typically trigger notifications

    res.status(201).json({
      success: true,
      data: workflow
    })
  } catch (error) {
    console.error('Error creating workflow:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve at current level
router.post('/workflows/:id/approve', async (req, res) => {
  try {
    const { comments, attachments } = req.body

    const workflow = await ApprovalWorkflow.findOne({
      _id: req.params.id,
      company: req.user.company,
      status: { $in: ['pending', 'in_progress'] }
    })

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found or not pending' })
    }

    // Check if user can approve at current level
    const currentStep = workflow.steps.find(s => s.level === workflow.currentLevel)
    const canApprove = currentStep?.expectedApprovers.some(
      a => a.user.toString() === req.user._id.toString()
    )

    if (!canApprove) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve at this level'
      })
    }

    await workflow.moveToNextLevel(req.user._id, comments, attachments)

    // If fully approved, update the source entity
    if (workflow.status === 'approved') {
      await updateEntityOnApproval(workflow)
    }

    res.json({
      success: true,
      message: workflow.status === 'approved' ? 'Workflow fully approved' : 'Approved at current level',
      data: workflow
    })
  } catch (error) {
    console.error('Error approving workflow:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reject workflow
router.post('/workflows/:id/reject', async (req, res) => {
  try {
    const { comments } = req.body

    if (!comments) {
      return res.status(400).json({
        success: false,
        message: 'Comments are required for rejection'
      })
    }

    const workflow = await ApprovalWorkflow.findOne({
      _id: req.params.id,
      company: req.user.company,
      status: { $in: ['pending', 'in_progress'] }
    })

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found or not pending' })
    }

    // Check if user can reject at current level
    const currentStep = workflow.steps.find(s => s.level === workflow.currentLevel)
    const canReject = currentStep?.expectedApprovers.some(
      a => a.user.toString() === req.user._id.toString()
    )

    if (!canReject) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject at this level'
      })
    }

    await workflow.reject(req.user._id, comments)

    // Update the source entity
    await updateEntityOnRejection(workflow)

    res.json({
      success: true,
      message: 'Workflow rejected',
      data: workflow
    })
  } catch (error) {
    console.error('Error rejecting workflow:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delegate approval
router.post('/workflows/:id/delegate', async (req, res) => {
  try {
    const { toUserId, comments } = req.body

    if (!toUserId) {
      return res.status(400).json({
        success: false,
        message: 'Delegate user is required'
      })
    }

    const workflow = await ApprovalWorkflow.findOne({
      _id: req.params.id,
      company: req.user.company,
      status: { $in: ['pending', 'in_progress'] }
    })

    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found or not pending' })
    }

    await workflow.delegate(req.user._id, toUserId, comments)

    res.json({
      success: true,
      message: 'Approval delegated successfully',
      data: workflow
    })
  } catch (error) {
    console.error('Error delegating workflow:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Cancel workflow (only by initiator)
router.post('/workflows/:id/cancel', async (req, res) => {
  try {
    const workflow = await ApprovalWorkflow.findOne({
      _id: req.params.id,
      company: req.user.company,
      initiatedBy: req.user._id,
      status: { $in: ['pending', 'in_progress'] }
    })

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found or you are not the initiator'
      })
    }

    workflow.status = 'cancelled'
    workflow.completedAt = new Date()
    workflow.auditLog.push({
      action: 'cancelled',
      actionBy: req.user._id,
      details: { reason: req.body.reason || 'Cancelled by initiator' }
    })

    await workflow.save()

    res.json({
      success: true,
      message: 'Workflow cancelled',
      data: workflow
    })
  } catch (error) {
    console.error('Error cancelling workflow:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get workflow summary/stats
router.get('/stats', async (req, res) => {
  try {
    const [pending, approved, rejected, myPending] = await Promise.all([
      ApprovalWorkflow.countDocuments({
        company: req.user.company,
        status: { $in: ['pending', 'in_progress'] }
      }),
      ApprovalWorkflow.countDocuments({
        company: req.user.company,
        status: 'approved',
        completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      ApprovalWorkflow.countDocuments({
        company: req.user.company,
        status: 'rejected',
        completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      ApprovalWorkflow.countDocuments({
        company: req.user.company,
        status: { $in: ['pending', 'in_progress'] },
        'steps.expectedApprovers.user': req.user._id
      })
    ])

    // Get module-wise breakdown
    const byModule = await ApprovalWorkflow.aggregate([
      {
        $match: {
          company: req.user.company,
          status: { $in: ['pending', 'in_progress'] }
        }
      },
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        totalPending: pending,
        approvedLast30Days: approved,
        rejectedLast30Days: rejected,
        pendingForMe: myPending,
        byModule: byModule.reduce((acc, m) => {
          acc[m._id] = m.count
          return acc
        }, {})
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Helper function to update entity on approval
async function updateEntityOnApproval(workflow) {
  try {
    const modelMap = {
      'LeaveRequest': 'Leave',
      'Reimbursement': 'Reimbursement',
      'PurchaseOrder': 'PurchaseOrder',
      'ProjectTaskInstance': 'ProjectTaskInstance',
      'PaymentMilestone': 'PaymentMilestone'
    }

    const modelName = modelMap[workflow.entityType]
    if (!modelName) return

    const Model = (await import(`../models/${modelName}.js`)).default
    await Model.findByIdAndUpdate(workflow.entityId, {
      approvalStatus: 'approved',
      approvedAt: new Date(),
      approvedBy: workflow.finalActionBy
    })
  } catch (error) {
    console.error('Error updating entity on approval:', error)
  }
}

// Helper function to update entity on rejection
async function updateEntityOnRejection(workflow) {
  try {
    const modelMap = {
      'LeaveRequest': 'Leave',
      'Reimbursement': 'Reimbursement',
      'PurchaseOrder': 'PurchaseOrder',
      'ProjectTaskInstance': 'ProjectTaskInstance'
    }

    const modelName = modelMap[workflow.entityType]
    if (!modelName) return

    const Model = (await import(`../models/${modelName}.js`)).default
    await Model.findByIdAndUpdate(workflow.entityId, {
      approvalStatus: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: workflow.finalActionBy,
      rejectionReason: workflow.finalComments
    })
  } catch (error) {
    console.error('Error updating entity on rejection:', error)
  }
}

// Get users who can be approvers (for assignment)
router.get('/potential-approvers', async (req, res) => {
  try {
    const { role, departmentId } = req.query

    const filter = { company: req.user.company, status: 'active' }
    if (role) filter.role = role
    if (departmentId) filter.department = departmentId

    const users = await User.find(filter)
      .select('name email role department')
      .populate('department', 'name')
      .sort({ name: 1 })

    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Error fetching potential approvers:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
