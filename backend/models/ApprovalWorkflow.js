import mongoose from 'mongoose'

/**
 * ApprovalWorkflow - Tracks individual approval instances
 *
 * When an action requires approval (based on ApprovalMatrix),
 * an instance of ApprovalWorkflow is created to track:
 * - Current status
 * - Approval history
 * - Pending approvers
 * - Timeline
 */

const approvalStepSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true
  },
  levelName: {
    type: String,
    enum: ['maker', 'checker', 'approver', 'final_approver', 'super_approver'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'skipped', 'escalated', 'delegated'],
    default: 'pending'
  },
  // Expected approvers at this level
  expectedApprovers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notifiedAt: Date,
    remindersSent: { type: Number, default: 0 }
  }],
  // Who actually took action
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actionAt: Date,
  comments: String,
  // If delegated, who delegated and to whom
  delegatedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  delegatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Attachments for this step (e.g., supporting documents)
  attachments: [{
    name: String,
    path: String,
    uploadedAt: Date
  }]
}, { _id: true, timestamps: true })

const approvalWorkflowSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Reference to the approval matrix used
  approvalMatrix: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalMatrix',
    required: true
  },

  // Workflow identifier (auto-generated)
  workflowId: {
    type: String,
    unique: true
  },

  // What is being approved
  module: {
    type: String,
    required: true
  },
  activity: {
    type: String,
    required: true
  },

  // Reference to the entity being approved
  entityType: {
    type: String,
    enum: [
      'PurchaseRequisition', 'PurchaseOrder', 'GoodsReceipt', 'VendorInvoice', 'VendorPayment',
      'LeaveRequest', 'Reimbursement', 'AttendanceRegularization', 'SalaryRevision',
      'CustomerInvoice', 'PaymentCollection', 'Expense', 'Budget',
      'Project', 'ProjectTaskInstance', 'DesignIteration', 'PaymentMilestone',
      'StockAdjustment', 'MaterialRequest', 'InterWarehouseTransfer',
      'Quotation', 'SalesOrder', 'Discount',
      'Lead', 'Customer', 'Vendor'
    ],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType'
  },

  // Related entities for context
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  relatedCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  relatedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  relatedMaterial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  },
  relatedDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  // Amount involved (for threshold-based approvals)
  amount: {
    type: Number,
    default: 0
  },

  // Brief description of what's being approved
  title: {
    type: String,
    required: true
  },
  description: String,

  // Initiator
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  initiatedAt: {
    type: Date,
    default: Date.now
  },

  // Overall status
  status: {
    type: String,
    enum: ['draft', 'pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'expired'],
    default: 'pending'
  },

  // Current level being processed
  currentLevel: {
    type: Number,
    default: 1
  },

  // Approval steps (history)
  steps: [approvalStepSchema],

  // Final outcome
  completedAt: Date,
  finalActionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalComments: String,

  // SLA tracking
  sla: {
    dueDate: Date,
    isOverdue: { type: Boolean, default: false },
    overdueNotificationsSent: { type: Number, default: 0 }
  },

  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Tags for filtering
  tags: [String],

  // Audit trail
  auditLog: [{
    action: String,
    actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actionAt: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
})

// Indexes
approvalWorkflowSchema.index({ company: 1, status: 1 })
approvalWorkflowSchema.index({ company: 1, module: 1, activity: 1 })
approvalWorkflowSchema.index({ entityType: 1, entityId: 1 })
approvalWorkflowSchema.index({ initiatedBy: 1, status: 1 })
approvalWorkflowSchema.index({ 'steps.expectedApprovers.user': 1, status: 1 })
approvalWorkflowSchema.index({ relatedProject: 1 })
approvalWorkflowSchema.index({ 'sla.dueDate': 1, status: 1 })

// Generate workflow ID before save
approvalWorkflowSchema.pre('save', async function(next) {
  if (this.isNew && !this.workflowId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const prefix = this.module.substring(0, 3).toUpperCase()
    this.workflowId = `WF-${prefix}-${String(count + 1).padStart(6, '0')}`
  }
  next()
})

// Instance method: Move to next level
approvalWorkflowSchema.methods.moveToNextLevel = async function(actionBy, comments, attachments = []) {
  const currentStep = this.steps.find(s => s.level === this.currentLevel)
  if (!currentStep) throw new Error('Current step not found')

  currentStep.status = 'approved'
  currentStep.actionBy = actionBy
  currentStep.actionAt = new Date()
  currentStep.comments = comments
  if (attachments.length) currentStep.attachments = attachments

  // Check if there are more levels
  const nextLevel = this.currentLevel + 1
  const nextStep = this.steps.find(s => s.level === nextLevel)

  if (nextStep) {
    this.currentLevel = nextLevel
    this.status = 'in_progress'
  } else {
    // Final approval
    this.status = 'approved'
    this.completedAt = new Date()
    this.finalActionBy = actionBy
    this.finalComments = comments
  }

  this.auditLog.push({
    action: nextStep ? 'level_approved' : 'final_approved',
    actionBy,
    details: { level: currentStep.level, levelName: currentStep.levelName }
  })

  await this.save()
  return this
}

// Instance method: Reject at current level
approvalWorkflowSchema.methods.reject = async function(actionBy, comments) {
  const currentStep = this.steps.find(s => s.level === this.currentLevel)
  if (!currentStep) throw new Error('Current step not found')

  currentStep.status = 'rejected'
  currentStep.actionBy = actionBy
  currentStep.actionAt = new Date()
  currentStep.comments = comments

  this.status = 'rejected'
  this.completedAt = new Date()
  this.finalActionBy = actionBy
  this.finalComments = comments

  this.auditLog.push({
    action: 'rejected',
    actionBy,
    details: { level: currentStep.level, levelName: currentStep.levelName, reason: comments }
  })

  await this.save()
  return this
}

// Instance method: Delegate approval
approvalWorkflowSchema.methods.delegate = async function(fromUserId, toUserId, comments) {
  const currentStep = this.steps.find(s => s.level === this.currentLevel)
  if (!currentStep) throw new Error('Current step not found')

  currentStep.status = 'delegated'
  currentStep.delegatedFrom = fromUserId
  currentStep.delegatedTo = toUserId
  currentStep.comments = comments

  // Add delegatee to expected approvers
  currentStep.expectedApprovers.push({
    user: toUserId,
    notifiedAt: new Date()
  })

  this.auditLog.push({
    action: 'delegated',
    actionBy: fromUserId,
    details: { level: currentStep.level, delegatedTo: toUserId, reason: comments }
  })

  await this.save()
  return this
}

// Static method: Create new workflow
approvalWorkflowSchema.statics.createWorkflow = async function(data) {
  const ApprovalMatrix = mongoose.model('ApprovalMatrix')

  // Find applicable matrix
  const result = await ApprovalMatrix.findApplicableMatrix(
    data.company,
    data.module,
    data.activity,
    data.departmentId,
    data.amount || 0
  )

  if (!result || !result.matrix) {
    throw new Error(`No approval matrix found for ${data.module}/${data.activity}`)
  }

  const { matrix, applicableLevels } = result

  // Create approval steps from applicable levels
  const steps = applicableLevels.map(level => ({
    level: level.level,
    levelName: level.levelName,
    status: 'pending',
    expectedApprovers: [] // Will be populated when determining actual approvers
  }))

  // Calculate SLA due date
  const totalHours = applicableLevels.reduce((sum, l) => sum + (l.escalateAfterHours || 48), 0)
  const dueDate = new Date()
  dueDate.setHours(dueDate.getHours() + totalHours)

  const workflow = new this({
    company: data.company,
    approvalMatrix: matrix._id,
    module: data.module,
    activity: data.activity,
    entityType: data.entityType,
    entityId: data.entityId,
    relatedProject: data.relatedProject,
    relatedCustomer: data.relatedCustomer,
    relatedVendor: data.relatedVendor,
    relatedMaterial: data.relatedMaterial,
    relatedDepartment: data.departmentId,
    amount: data.amount || 0,
    title: data.title,
    description: data.description,
    initiatedBy: data.initiatedBy,
    status: 'pending',
    currentLevel: 1,
    steps,
    sla: { dueDate },
    priority: data.priority || 'normal',
    tags: data.tags || []
  })

  workflow.auditLog.push({
    action: 'created',
    actionBy: data.initiatedBy,
    details: { matrix: matrix.name, levels: applicableLevels.length }
  })

  await workflow.save()
  return workflow
}

// Static method: Get pending approvals for a user
approvalWorkflowSchema.statics.getPendingForUser = async function(userId, companyId) {
  return this.find({
    company: companyId,
    status: { $in: ['pending', 'in_progress'] },
    'steps.expectedApprovers.user': userId,
    $expr: {
      $eq: [
        { $arrayElemAt: ['$steps.status', { $subtract: ['$currentLevel', 1] }] },
        'pending'
      ]
    }
  })
  .populate('initiatedBy', 'name email')
  .populate('relatedProject', 'title projectId')
  .populate('relatedCustomer', 'name customerId')
  .populate('relatedVendor', 'name vendorId')
  .sort({ 'sla.dueDate': 1, priority: -1 })
}

// Static method: Get workflow summary by module
approvalWorkflowSchema.statics.getSummaryByModule = async function(companyId) {
  return this.aggregate([
    { $match: { company: mongoose.Types.ObjectId(companyId) } },
    {
      $group: {
        _id: { module: '$module', status: '$status' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.module',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ])
}

const ApprovalWorkflow = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema)

export default ApprovalWorkflow
