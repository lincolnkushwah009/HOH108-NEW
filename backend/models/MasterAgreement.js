import mongoose from 'mongoose'
import crypto from 'crypto'

// Activity log sub-schema
const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  description: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedByName: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Individual Approval Schema (per approver)
const approvalRecordSchema = new mongoose.Schema({
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approverName: String,
  approverRole: {
    type: String,
    enum: ['cbo', 'ceo', 'design_head', 'operations_head', 'finance_head']
  },
  approverEmail: String,

  // Approval Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'changes_requested'],
    default: 'pending'
  },

  // Remarks/Comments
  remarks: String,
  requestedChanges: String,

  // Email Approval Token
  emailToken: String,
  emailTokenExpiry: Date,
  emailSentAt: Date,
  emailOpenedAt: Date,

  // Action Details
  viewedAt: Date,
  actionTakenAt: Date,

  // How approval was done
  approvedVia: {
    type: String,
    enum: ['email', 'dashboard', 'mobile'],
    default: 'dashboard'
  },

  // Audit
  ipAddress: String,
  userAgent: String,

  // Reminder tracking
  remindersSent: [{
    sentAt: Date,
    type: { type: String, enum: ['email', 'push', 'sms'] }
  }]
})

// Approval Item Schema (4 items: Material Quotation, Material Spend, Payment Schedule, Schedule of Work)
const approvalItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['material_quotation', 'material_spend', 'payment_schedule', 'schedule_of_work'],
    required: true
  },

  title: String,
  description: String,

  // Document Reference
  document: {
    name: String,
    url: String,
    fileType: String,
    fileSize: Number,
    version: { type: Number, default: 1 },
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedByName: String
  },

  // Supporting Documents
  supportingDocuments: [{
    name: String,
    url: String,
    fileType: String,
    uploadedAt: Date
  }],

  // Amount (if applicable)
  amount: Number,
  currency: { type: String, default: 'INR' },

  // Details specific to each type
  details: mongoose.Schema.Types.Mixed,

  // Approval records for this item
  approvals: [approvalRecordSchema],

  // Overall Status for this item
  overallStatus: {
    type: String,
    enum: ['pending', 'partially_approved', 'approved', 'rejected', 'changes_requested'],
    default: 'pending'
  },

  // Timestamps
  submittedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,

  // History of changes/revisions
  revisions: [{
    version: Number,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    changedAt: Date,
    changes: String,
    previousDocument: String
  }]
})

const masterAgreementSchema = new mongoose.Schema({
  // Auto-generated Agreement ID (e.g., IP-MA-2024-00001)
  agreementId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Company Association
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Project Reference (main link)
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },

  // Customer Reference
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },

  // Sales Order Reference (optional)
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },

  // Agreement Details
  title: String,
  description: String,
  version: {
    type: Number,
    default: 1
  },

  // Financial Summary
  financials: {
    totalProjectValue: { type: Number, default: 0 },
    materialCost: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    overheadCost: { type: Number, default: 0 },
    profitMargin: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' }
  },

  // The 4 Approval Items
  approvalItems: [approvalItemSchema],

  // Approver Configuration
  approvers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: String,
    email: String,
    role: {
      type: String,
      enum: ['cbo', 'ceo', 'design_head', 'operations_head', 'finance_head'],
      required: true
    },
    order: Number, // For sequential approvals (1, 2, 3...)
    isMandatory: {
      type: Boolean,
      default: true
    },
    canApproveItems: [{
      type: String,
      enum: ['material_quotation', 'material_spend', 'payment_schedule', 'schedule_of_work']
    }]
  }],

  // Overall Agreement Status
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'partially_approved', 'approved', 'rejected', 'changes_requested', 'cancelled'],
    default: 'draft'
  },

  // Status Timestamps
  submittedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,

  // Operations Handover
  handover: {
    isCompleted: {
      type: Boolean,
      default: false
    },
    handedOverBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    handedOverByName: String,
    handedOverByRole: String, // CBO
    handedOverTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    handedOverToName: String,
    handedOverToRole: String, // Operations Manager / PM
    handoverDate: Date,
    handoverNotes: String,
    handoverDocuments: [{
      name: String,
      url: String,
      uploadedAt: Date
    }],
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    projectManagerName: String,
    operationsTeam: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      role: String,
      assignedAt: Date
    }]
  },

  // Notifications Log
  notifications: [{
    type: {
      type: String,
      enum: ['email', 'push', 'sms', 'in_app']
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipientEmail: String,
    subject: String,
    sentAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'opened', 'clicked']
    },
    messageId: String,
    error: String
  }],

  // Escalation Tracking
  escalation: {
    isEscalated: { type: Boolean, default: false },
    escalatedAt: Date,
    escalatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    escalationReason: String,
    escalationLevel: { type: Number, default: 0 }
  },

  // Timeline/SLA
  sla: {
    approvalDeadline: Date,
    reminderFrequency: { type: Number, default: 24 }, // hours
    autoEscalateAfter: { type: Number, default: 48 }, // hours
    isOverdue: { type: Boolean, default: false }
  },

  // Notes
  notes: [{
    content: String,
    type: {
      type: String,
      enum: ['general', 'internal', 'approval', 'rejection', 'handover'],
      default: 'general'
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedByName: String,
    addedAt: { type: Date, default: Date.now },
    isPinned: { type: Boolean, default: false }
  }],

  // Activity Log
  activities: [activitySchema],

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByName: String,

  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedByName: String
}, {
  timestamps: true
})

// Pre-save: Generate Agreement ID
masterAgreementSchema.pre('save', async function(next) {
  if (!this.agreementId && this.company) {
    try {
      const Company = mongoose.model('Company')
      const company = await Company.findById(this.company)
      if (company) {
        if (!company.sequences.masterAgreement) {
          company.sequences.masterAgreement = 0
        }
        company.sequences.masterAgreement += 1
        await company.save()

        const year = new Date().getFullYear()
        const paddedSeq = String(company.sequences.masterAgreement).padStart(5, '0')
        this.agreementId = `${company.code}-MA-${year}-${paddedSeq}`
      }
    } catch (err) {
      console.error('Error generating master agreement ID:', err)
    }
  }
  next()
})

// Method: Generate Email Token for Approver
masterAgreementSchema.methods.generateApprovalToken = function(approverId, itemType) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // Find the approval item and approver
  const item = this.approvalItems.find(i => i.type === itemType)
  if (item) {
    const approvalRecord = item.approvals.find(a => a.approver.toString() === approverId.toString())
    if (approvalRecord) {
      approvalRecord.emailToken = token
      approvalRecord.emailTokenExpiry = expiry
    }
  }

  return { token, expiry }
}

// Method: Validate Email Token
masterAgreementSchema.methods.validateEmailToken = function(token) {
  for (const item of this.approvalItems) {
    for (const approval of item.approvals) {
      if (approval.emailToken === token) {
        if (approval.emailTokenExpiry && approval.emailTokenExpiry > new Date()) {
          return {
            valid: true,
            itemType: item.type,
            approverId: approval.approver,
            approverName: approval.approverName
          }
        }
        return { valid: false, reason: 'Token expired' }
      }
    }
  }
  return { valid: false, reason: 'Invalid token' }
}

// Method: Add Approval Item
masterAgreementSchema.methods.addApprovalItem = function(itemData, userId, userName) {
  // Check if item type already exists
  const existing = this.approvalItems.find(i => i.type === itemData.type)
  if (existing) {
    throw new Error(`Approval item of type ${itemData.type} already exists`)
  }

  // Initialize approvals for all configured approvers
  const approvals = this.approvers
    .filter(a => !a.canApproveItems || a.canApproveItems.length === 0 || a.canApproveItems.includes(itemData.type))
    .map(approver => ({
      approver: approver.user,
      approverName: approver.name,
      approverRole: approver.role,
      approverEmail: approver.email,
      status: 'pending'
    }))

  this.approvalItems.push({
    ...itemData,
    approvals,
    submittedAt: new Date()
  })

  this.activities.push({
    action: 'approval_item_added',
    description: `Added approval item: ${itemData.type}`,
    performedBy: userId,
    performedByName: userName,
    newValue: itemData.type
  })

  return this.save()
}

// Method: Submit for Approval
masterAgreementSchema.methods.submitForApproval = async function(userId, userName) {
  // Validate all 4 items are present
  const requiredTypes = ['material_quotation', 'material_spend', 'payment_schedule', 'schedule_of_work']
  const existingTypes = this.approvalItems.map(item => item.type)

  const missingTypes = requiredTypes.filter(type => !existingTypes.includes(type))
  if (missingTypes.length > 0) {
    throw new Error(`Missing approval items: ${missingTypes.join(', ')}`)
  }

  // Validate all items have documents
  for (const item of this.approvalItems) {
    if (!item.document || !item.document.url) {
      throw new Error(`Document missing for: ${item.type}`)
    }
  }

  // Validate approvers are configured
  if (this.approvers.length === 0) {
    throw new Error('No approvers configured')
  }

  this.status = 'pending_approval'
  this.submittedAt = new Date()

  // Set SLA deadline
  this.sla.approvalDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

  this.activities.push({
    action: 'submitted_for_approval',
    description: 'Agreement submitted for approval',
    performedBy: userId,
    performedByName: userName
  })

  return this.save()
}

// Method: Process Approval
masterAgreementSchema.methods.processApproval = async function(itemType, approverId, action, remarks, metadata = {}) {
  const item = this.approvalItems.find(i => i.type === itemType)
  if (!item) {
    throw new Error(`Approval item not found: ${itemType}`)
  }

  const approvalRecord = item.approvals.find(a => a.approver.toString() === approverId.toString())
  if (!approvalRecord) {
    throw new Error('Approver not found for this item')
  }

  if (approvalRecord.status !== 'pending') {
    throw new Error(`Already ${approvalRecord.status}`)
  }

  // Update approval record
  approvalRecord.status = action // 'approved', 'rejected', 'changes_requested'
  approvalRecord.remarks = remarks
  approvalRecord.actionTakenAt = new Date()
  approvalRecord.approvedVia = metadata.via || 'dashboard'
  approvalRecord.ipAddress = metadata.ipAddress
  approvalRecord.userAgent = metadata.userAgent

  if (action === 'changes_requested') {
    approvalRecord.requestedChanges = remarks
  }

  // Update item overall status
  const allApprovals = item.approvals
  const approvedCount = allApprovals.filter(a => a.status === 'approved').length
  const rejectedCount = allApprovals.filter(a => a.status === 'rejected').length
  const changesRequestedCount = allApprovals.filter(a => a.status === 'changes_requested').length
  const mandatoryApprovers = this.approvers.filter(a => a.isMandatory)
  const mandatoryApproved = mandatoryApprovers.every(ma =>
    allApprovals.find(a => a.approver.toString() === ma.user.toString() && a.status === 'approved')
  )

  if (rejectedCount > 0) {
    item.overallStatus = 'rejected'
    item.rejectedAt = new Date()
  } else if (changesRequestedCount > 0) {
    item.overallStatus = 'changes_requested'
  } else if (mandatoryApproved) {
    item.overallStatus = 'approved'
    item.approvedAt = new Date()
  } else if (approvedCount > 0) {
    item.overallStatus = 'partially_approved'
  }

  // Update overall agreement status
  this.updateOverallStatus()

  this.activities.push({
    action: `item_${action}`,
    description: `${itemType} ${action} by approver`,
    performedBy: approverId,
    performedByName: approvalRecord.approverName,
    metadata: { itemType, action, remarks }
  })

  return this.save()
}

// Method: Update Overall Status
masterAgreementSchema.methods.updateOverallStatus = function() {
  const allItems = this.approvalItems
  const approvedItems = allItems.filter(i => i.overallStatus === 'approved')
  const rejectedItems = allItems.filter(i => i.overallStatus === 'rejected')
  const changesRequestedItems = allItems.filter(i => i.overallStatus === 'changes_requested')

  if (rejectedItems.length > 0) {
    this.status = 'rejected'
    this.rejectedAt = new Date()
  } else if (changesRequestedItems.length > 0) {
    this.status = 'changes_requested'
  } else if (approvedItems.length === 4) {
    this.status = 'approved'
    this.approvedAt = new Date()
  } else if (approvedItems.length > 0) {
    this.status = 'partially_approved'
  }
}

// Method: Complete Handover
masterAgreementSchema.methods.completeHandover = async function(handoverData, userId, userName) {
  if (this.status !== 'approved') {
    throw new Error('Agreement must be fully approved before handover')
  }

  this.handover = {
    isCompleted: true,
    handedOverBy: userId,
    handedOverByName: userName,
    handedOverByRole: handoverData.fromRole || 'cbo',
    handedOverTo: handoverData.toUser,
    handedOverToName: handoverData.toUserName,
    handedOverToRole: handoverData.toRole || 'operations_manager',
    handoverDate: new Date(),
    handoverNotes: handoverData.notes,
    handoverDocuments: handoverData.documents || [],
    projectManager: handoverData.projectManager,
    projectManagerName: handoverData.projectManagerName,
    operationsTeam: handoverData.operationsTeam || []
  }

  // Update project
  const Project = mongoose.model('Project')
  await Project.findByIdAndUpdate(this.project, {
    projectManager: handoverData.projectManager,
    stage: 'execution',
    'departmentAssignments.operations': {
      lead: handoverData.toUser,
      team: handoverData.operationsTeam
    },
    $push: {
      handovers: {
        from: { department: 'approval', user: userId, userName },
        to: { department: 'operations', user: handoverData.toUser, userName: handoverData.toUserName },
        handoverDate: new Date(),
        notes: handoverData.notes
      },
      activities: {
        action: 'handover_completed',
        description: `Project handed over to operations by ${userName}`,
        performedBy: userId,
        performedByName: userName
      }
    }
  })

  this.activities.push({
    action: 'handover_completed',
    description: `Handed over to ${handoverData.toUserName} (${handoverData.toRole})`,
    performedBy: userId,
    performedByName: userName,
    metadata: this.handover
  })

  return this.save()
}

// Method: Send Reminder
masterAgreementSchema.methods.sendReminder = async function(itemType, approverId) {
  const item = this.approvalItems.find(i => i.type === itemType)
  if (!item) return

  const approvalRecord = item.approvals.find(a => a.approver.toString() === approverId.toString())
  if (!approvalRecord || approvalRecord.status !== 'pending') return

  approvalRecord.remindersSent.push({
    sentAt: new Date(),
    type: 'email'
  })

  this.notifications.push({
    type: 'email',
    recipient: approverId,
    recipientEmail: approvalRecord.approverEmail,
    subject: `Reminder: Approval pending for ${itemType}`,
    sentAt: new Date(),
    status: 'sent'
  })

  return this.save()
}

// Static: Get Pending Approvals for User
masterAgreementSchema.statics.getPendingApprovalsForUser = function(userId) {
  return this.find({
    status: { $in: ['pending_approval', 'partially_approved'] },
    'approvalItems.approvals': {
      $elemMatch: {
        approver: userId,
        status: 'pending'
      }
    }
  })
    .populate('project', 'projectId title')
    .populate('customer', 'name customerId')
    .sort({ submittedAt: -1 })
}

// Static: Get Overdue Approvals
masterAgreementSchema.statics.getOverdueApprovals = function(companyId) {
  return this.find({
    company: companyId,
    status: { $in: ['pending_approval', 'partially_approved'] },
    'sla.approvalDeadline': { $lt: new Date() }
  })
}

// Indexes
masterAgreementSchema.index({ company: 1, status: 1 })
masterAgreementSchema.index({ company: 1, project: 1 })
masterAgreementSchema.index({ 'approvers.user': 1, status: 1 })
masterAgreementSchema.index({ 'approvalItems.approvals.approver': 1, 'approvalItems.approvals.status': 1 })
masterAgreementSchema.index({ 'sla.approvalDeadline': 1, status: 1 })

export default mongoose.model('MasterAgreement', masterAgreementSchema)
