import mongoose from 'mongoose'

/**
 * Project Task Instance Model
 * Represents an actual task instance within a project
 * Links to master templates and tracks actual progress, owners, vendors, materials
 */

// Progress update schema
const progressUpdateSchema = new mongoose.Schema({
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  notes: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedByName: String,
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// QC Check schema
const qcCheckSchema = new mongoose.Schema({
  checkName: String,
  status: {
    type: String,
    enum: ['pending', 'passed', 'failed', 'na'],
    default: 'pending'
  },
  remarks: String,
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  checkedByName: String,
  checkedAt: Date,
  photos: [{
    url: String,
    caption: String
  }]
})

const projectTaskInstanceSchema = new mongoose.Schema({
  // Auto-generated Instance ID (e.g., IP-TI-2024-00001)
  instanceId: {
    type: String,
    unique: true,
    sparse: true
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Project Reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },

  // Customer Reference (denormalized for queries)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },

  // Template References
  phaseTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectPhase',
    required: true
  },
  activityTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectActivity',
    required: true
  },
  taskTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTask',
    required: true
  },

  // Entity Type
  entityType: {
    type: String,
    enum: ['interior_plus', 'exterior_plus'],
    required: true,
    index: true
  },

  // Denormalized names for display
  phaseName: String,
  phaseCode: String,
  activityName: String,
  activityCode: String,
  taskName: String,
  taskCode: String,

  // ============================================
  // OWNERSHIP & ASSIGNMENT
  // ============================================

  // Project Owner (from project)
  projectOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  projectOwnerName: String,

  // Activity Owner (Employee only)
  activityOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activityOwnerName: String,

  // Task Owner (Can be Employee or Vendor) - Legacy single owner
  taskOwner: {
    ownerType: {
      type: String,
      enum: ['employee', 'vendor'],
      default: 'employee'
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    employeeName: String,
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    vendorName: String,
    assignedAt: Date,
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedByName: String
  },

  // Multiple Task Owners (NEW - supports multiple employees/vendors)
  taskOwners: [{
    ownerType: {
      type: String,
      enum: ['employee', 'vendor'],
      default: 'employee'
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    employeeName: String,
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    vendorName: String,
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedByName: String
  }],

  // ============================================
  // VENDOR & MATERIAL LINKAGE
  // ============================================

  // Assigned Vendor for this task
  assignedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    index: true
  },
  assignedVendorName: String,
  vendorQuotedAmount: Number,
  vendorAgreedAmount: Number,

  // Materials used in this task
  materials: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    materialName: String,
    materialCode: String,
    quantity: Number,
    unit: String,
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    vendorName: String,
    estimatedCost: Number,
    actualCost: Number,
    status: {
      type: String,
      enum: ['pending', 'ordered', 'received', 'installed'],
      default: 'pending'
    }
  }],

  // ============================================
  // TIMELINE
  // ============================================

  plannedStartDate: Date,
  plannedEndDate: Date,
  actualStartDate: Date,
  actualEndDate: Date,

  estimatedDuration: {
    value: Number,
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'days'
    }
  },

  // ============================================
  // PROGRESS & STATUS
  // ============================================

  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled', 'blocked'],
    default: 'not_started',
    index: true
  },

  // Completion Percentage (0-100)
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Weightage for this task in project completion calculation
  weightage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Progress history
  progressUpdates: [progressUpdateSchema],

  // ============================================
  // QC & QUALITY
  // ============================================

  isQCRequired: {
    type: Boolean,
    default: false
  },
  qcStatus: {
    type: String,
    enum: ['pending', 'passed', 'failed', 'na'],
    default: 'pending'
  },
  qcChecks: [qcCheckSchema],
  qcApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  qcApprovedByName: String,
  qcApprovedAt: Date,
  qcRemarks: String,

  // ============================================
  // SNAGS & ISSUES
  // ============================================

  snags: [{
    description: String,
    severity: {
      type: String,
      enum: ['minor', 'major', 'critical'],
      default: 'minor'
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open'
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedByName: String,
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedByName: String,
    resolvedAt: Date,
    photos: [{
      url: String,
      caption: String,
      type: {
        type: String,
        enum: ['issue', 'resolution']
      }
    }]
  }],

  // ============================================
  // DEPENDENCIES
  // ============================================

  // Tasks that must be completed before this task
  dependsOn: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectTaskInstance'
    },
    type: {
      type: String,
      enum: ['finish_to_start', 'start_to_start', 'finish_to_finish'],
      default: 'finish_to_start'
    }
  }],

  // ============================================
  // NOTES & ATTACHMENTS
  // ============================================

  notes: [{
    content: String,
    type: {
      type: String,
      enum: ['general', 'issue', 'resolution', 'client_feedback'],
      default: 'general'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedByName: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  attachments: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['photo', 'document', 'drawing', 'other']
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedByName: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Display order
  order: {
    type: Number,
    default: 0
  },

  // ============================================
  // APPROVAL WORKFLOW INTEGRATION
  // ============================================

  // Current approval workflow (if pending approval)
  pendingApproval: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApprovalWorkflow'
  },

  // Approval status for this task
  approvalStatus: {
    type: String,
    enum: ['not_required', 'pending', 'approved', 'rejected'],
    default: 'not_required'
  },

  // Approval history for this task
  approvalHistory: [{
    workflowId: String,
    approvalType: {
      type: String,
      enum: ['task_completion', 'material_requisition', 'vendor_assignment', 'qc_approval']
    },
    status: {
      type: String,
      enum: ['approved', 'rejected']
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedByName: String,
    approvedAt: Date,
    comments: String
  }],

  // ============================================
  // COST TRACKING
  // ============================================

  estimatedCost: {
    materials: { type: Number, default: 0 },
    labor: { type: Number, default: 0 },
    vendor: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  actualCost: {
    materials: { type: Number, default: 0 },
    labor: { type: Number, default: 0 },
    vendor: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  // ============================================
  // PAYMENT LINKAGE
  // ============================================

  linkedPaymentMilestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMilestone'
  },

  // Activity log
  activities: [{
    action: String,
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes
projectTaskInstanceSchema.index({ company: 1, project: 1, status: 1 })
projectTaskInstanceSchema.index({ company: 1, project: 1, phaseTemplate: 1 })
projectTaskInstanceSchema.index({ company: 1, project: 1, activityTemplate: 1 })
projectTaskInstanceSchema.index({ company: 1, customer: 1 })
projectTaskInstanceSchema.index({ company: 1, assignedVendor: 1 })
projectTaskInstanceSchema.index({ company: 1, 'taskOwner.employee': 1 })
projectTaskInstanceSchema.index({ company: 1, 'taskOwner.vendor': 1 })
projectTaskInstanceSchema.index({ project: 1, order: 1 })

// Method to update progress
projectTaskInstanceSchema.methods.updateProgress = async function(percentage, notes, userId, userName, attachments = []) {
  this.completionPercentage = percentage

  this.progressUpdates.push({
    percentage,
    notes,
    updatedBy: userId,
    updatedByName: userName,
    attachments
  })

  // Update status based on progress
  if (percentage === 0) {
    this.status = 'not_started'
  } else if (percentage === 100) {
    this.status = 'completed'
    this.actualEndDate = new Date()
  } else if (this.status === 'not_started') {
    this.status = 'in_progress'
    if (!this.actualStartDate) {
      this.actualStartDate = new Date()
    }
  }

  this.activities.push({
    action: 'progress_updated',
    description: `Progress updated to ${percentage}%`,
    performedBy: userId,
    performedByName: userName,
    oldValue: this.completionPercentage,
    newValue: percentage
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method to assign task owner (legacy - single owner)
projectTaskInstanceSchema.methods.assignOwner = async function(ownerType, ownerId, ownerName, assignerId, assignerName) {
  this.taskOwner = {
    ownerType,
    [ownerType]: ownerId,
    [`${ownerType}Name`]: ownerName,
    assignedAt: new Date(),
    assignedBy: assignerId,
    assignedByName: assignerName
  }

  if (ownerType === 'vendor') {
    this.assignedVendor = ownerId
    this.assignedVendorName = ownerName
  }

  this.activities.push({
    action: 'owner_assigned',
    description: `Task assigned to ${ownerName} (${ownerType})`,
    performedBy: assignerId,
    performedByName: assignerName,
    newValue: { ownerType, ownerName }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method to add multiple task owners
projectTaskInstanceSchema.methods.addOwner = async function(ownerType, ownerId, ownerName, assignerId, assignerName) {
  // Check if owner already exists
  const existingOwner = this.taskOwners.find(o =>
    (ownerType === 'employee' && o.employee?.toString() === ownerId.toString()) ||
    (ownerType === 'vendor' && o.vendor?.toString() === ownerId.toString())
  )

  if (existingOwner) {
    return this // Already assigned
  }

  const newOwner = {
    ownerType,
    assignedAt: new Date(),
    assignedBy: assignerId,
    assignedByName: assignerName
  }

  if (ownerType === 'employee') {
    newOwner.employee = ownerId
    newOwner.employeeName = ownerName
  } else {
    newOwner.vendor = ownerId
    newOwner.vendorName = ownerName
    this.assignedVendor = ownerId
    this.assignedVendorName = ownerName
  }

  this.taskOwners.push(newOwner)

  // Also update legacy taskOwner if it's the first assignment
  if (!this.taskOwner?.employee && !this.taskOwner?.vendor) {
    this.taskOwner = newOwner
  }

  this.activities.push({
    action: 'owner_added',
    description: `${ownerName} (${ownerType}) added to task`,
    performedBy: assignerId,
    performedByName: assignerName,
    newValue: { ownerType, ownerName }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method to remove task owner
projectTaskInstanceSchema.methods.removeOwner = async function(ownerType, ownerId, removerId, removerName) {
  const ownerIndex = this.taskOwners.findIndex(o =>
    (ownerType === 'employee' && o.employee?.toString() === ownerId.toString()) ||
    (ownerType === 'vendor' && o.vendor?.toString() === ownerId.toString())
  )

  if (ownerIndex === -1) {
    return this // Not found
  }

  const removedOwner = this.taskOwners[ownerIndex]
  const ownerName = removedOwner.employeeName || removedOwner.vendorName

  this.taskOwners.splice(ownerIndex, 1)

  this.activities.push({
    action: 'owner_removed',
    description: `${ownerName} (${ownerType}) removed from task`,
    performedBy: removerId,
    performedByName: removerName,
    oldValue: { ownerType, ownerName }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Static method to get project completion percentage
projectTaskInstanceSchema.statics.calculateProjectCompletion = async function(projectId) {
  const tasks = await this.find({ project: projectId })

  if (tasks.length === 0) return 0

  const totalWeightage = tasks.reduce((sum, t) => sum + (t.weightage || 0), 0)

  if (totalWeightage === 0) {
    // If no weightage assigned, use simple average
    const totalCompletion = tasks.reduce((sum, t) => sum + t.completionPercentage, 0)
    return Math.round(totalCompletion / tasks.length)
  }

  // Weighted average
  const weightedCompletion = tasks.reduce((sum, t) => {
    return sum + (t.completionPercentage * (t.weightage / totalWeightage))
  }, 0)

  return Math.round(weightedCompletion)
}

// Static method to get phase-wise completion
projectTaskInstanceSchema.statics.getPhaseCompletion = async function(projectId) {
  return this.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: '$phaseTemplate',
        phaseName: { $first: '$phaseName' },
        phaseCode: { $first: '$phaseCode' },
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        avgCompletion: { $avg: '$completionPercentage' },
        totalWeightage: { $sum: '$weightage' },
        weightedCompletion: {
          $sum: { $multiply: ['$completionPercentage', { $divide: ['$weightage', 100] }] }
        }
      }
    },
    { $sort: { phaseCode: 1 } }
  ])
}

export default mongoose.model('ProjectTaskInstance', projectTaskInstanceSchema)
