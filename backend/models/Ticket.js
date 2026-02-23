import mongoose from 'mongoose'

const attachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: String,
  fileSize: Number,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedByName: String,
  uploadedAt: { type: Date, default: Date.now }
})

const commentSchema = new mongoose.Schema({
  comment: { type: String, required: true },
  isInternal: { type: Boolean, default: false },
  commentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  commentByName: String,
  commentByRole: String,
  attachments: [attachmentSchema],
  createdAt: { type: Date, default: Date.now }
})

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
})

const ticketSchema = new mongoose.Schema({
  ticketId: {
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

  // Ticket Details
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  categoryName: String,
  subCategory: String,
  subCategoryName: String,

  // Priority & SLA
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  slaHours: {
    type: Number,
    default: 24
  },
  slaDueDate: Date,
  slaBreached: {
    type: Boolean,
    default: false
  },
  slaBreachedAt: Date,

  // Status Workflow
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'open', 'in_progress', 'pending_info', 'on_hold', 'resolved', 'closed', 'rejected', 'cancelled'],
    default: 'draft'
  },
  previousStatus: String,

  // Requestor Info
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  requestedByName: String,
  requestedByEmail: String,
  requestedByDepartment: String,
  requestedByPhone: String,

  // Manager Approval
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['not_required', 'pending', 'approved', 'rejected'],
    default: 'not_required'
  },
  approver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approverName: String,
  approvalDate: Date,
  approvalRemarks: String,
  approvalRequestedAt: Date,

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedToName: String,
  assignedToDepartment: String,
  assignedDate: Date,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedByName: String,

  // Support Department
  supportDepartment: {
    type: String,
    enum: ['IT', 'HRMS', 'Finance', 'Operations', 'Design', 'Sales', 'Marketing', 'Management', 'Admin']
  },

  // Resolution
  resolution: String,
  resolutionType: {
    type: String,
    enum: ['resolved', 'workaround', 'cannot_reproduce', 'duplicate', 'wont_fix', 'user_error']
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedByName: String,
  resolvedDate: Date,
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closedByName: String,
  closedDate: Date,
  closureRemarks: String,

  // Attachments
  attachments: [attachmentSchema],

  // Comments/Updates
  comments: [commentSchema],

  // Activity Log
  activities: [activitySchema],

  // Escalation
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalatedToName: String,
  escalationReason: String,
  escalationDate: Date,
  escalationLevel: {
    type: Number,
    default: 0
  },

  // ============================================
  // RELATED ENTITIES (Full Mapping)
  // ============================================

  // Project Mapping
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  relatedProjectId: String, // Project ID for display

  // Customer Mapping
  relatedCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    index: true
  },
  relatedCustomerName: String,

  // Vendor Mapping
  relatedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    index: true
  },
  relatedVendorName: String,

  // Material Mapping
  relatedMaterial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    index: true
  },
  relatedMaterialName: String,
  relatedMaterialCode: String,

  // Employee Mapping (if ticket is about an employee)
  relatedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  relatedEmployeeName: String,

  // Department Mapping
  relatedDepartmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    index: true
  },
  relatedDepartmentName: String,

  // Task Instance Mapping (for project-related tickets)
  relatedTaskInstance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTaskInstance'
  },
  relatedTaskName: String,

  // Payment Milestone Mapping
  relatedPaymentMilestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMilestone'
  },
  relatedMilestoneName: String,

  // Ticket Source
  ticketSource: {
    type: String,
    enum: ['internal', 'customer', 'vendor', 'system'],
    default: 'internal'
  },

  // Ticket Nature
  ticketNature: {
    type: String,
    enum: ['query', 'complaint', 'request', 'feedback', 'escalation', 'payment_issue', 'quality_issue', 'delivery_issue', 'other'],
    default: 'query'
  },

  // Related Asset
  relatedAsset: String,

  // Related Tickets
  relatedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }],

  // Satisfaction
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5
  },
  satisfactionFeedback: String,
  satisfactionRatedAt: Date,

  // Watchers
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Tags
  tags: [String],

  // Timestamps
  submittedAt: Date,
  firstResponseAt: Date,
  lastActivityAt: Date,
  reopenedAt: Date,
  reopenCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Indexes
ticketSchema.index({ company: 1, status: 1 })
ticketSchema.index({ company: 1, category: 1 })
ticketSchema.index({ company: 1, priority: 1 })
ticketSchema.index({ company: 1, requestedBy: 1 })
ticketSchema.index({ company: 1, assignedTo: 1 })
ticketSchema.index({ company: 1, approver: 1, approvalStatus: 1 })
ticketSchema.index({ company: 1, slaDueDate: 1, slaBreached: 1 })
ticketSchema.index({ company: 1, createdAt: -1 })

// Virtual for SLA status
ticketSchema.virtual('slaStatus').get(function() {
  if (this.status === 'closed' || this.status === 'resolved') {
    return this.slaBreached ? 'breached' : 'met'
  }
  if (!this.slaDueDate) return 'not_set'

  const now = new Date()
  const hoursRemaining = (this.slaDueDate - now) / (1000 * 60 * 60)

  if (hoursRemaining < 0) return 'breached'
  if (hoursRemaining < 2) return 'critical'
  if (hoursRemaining < 4) return 'warning'
  return 'on_track'
})

// Pre-save middleware
ticketSchema.pre('save', function(next) {
  // Update lastActivityAt
  this.lastActivityAt = new Date()

  // Check SLA breach
  if (this.slaDueDate && !this.slaBreached && !['closed', 'resolved', 'cancelled'].includes(this.status)) {
    if (new Date() > this.slaDueDate) {
      this.slaBreached = true
      this.slaBreachedAt = new Date()
    }
  }

  next()
})

// Instance Methods
ticketSchema.methods.addActivity = function(action, description, user, oldValue, newValue, metadata) {
  this.activities.push({
    action,
    description,
    performedBy: user._id,
    performedByName: user.name,
    oldValue,
    newValue,
    metadata
  })
  this.lastActivityAt = new Date()
}

ticketSchema.methods.addComment = function(comment, user, isInternal = false, attachments = []) {
  this.comments.push({
    comment,
    isInternal,
    commentBy: user._id,
    commentByName: user.name,
    commentByRole: user.role,
    attachments
  })

  this.addActivity(
    isInternal ? 'internal_note_added' : 'comment_added',
    `${isInternal ? 'Internal note' : 'Comment'} added by ${user.name}`,
    user
  )

  // Mark first response
  if (!this.firstResponseAt && this.assignedTo && user._id.toString() === this.assignedTo.toString()) {
    this.firstResponseAt = new Date()
  }
}

ticketSchema.methods.submit = async function(user) {
  if (this.status !== 'draft') {
    throw new Error('Only draft tickets can be submitted')
  }

  this.submittedAt = new Date()

  if (this.requiresApproval) {
    this.status = 'pending_approval'
    this.approvalStatus = 'pending'
    this.approvalRequestedAt = new Date()
    this.addActivity('submitted_for_approval', `Ticket submitted for approval by ${user.name}`, user)
  } else {
    this.status = 'open'
    this.addActivity('submitted', `Ticket submitted by ${user.name}`, user)
  }

  // Calculate SLA due date
  if (this.slaHours) {
    this.slaDueDate = new Date(Date.now() + this.slaHours * 60 * 60 * 1000)
  }

  return this.save()
}

ticketSchema.methods.approve = async function(user, remarks) {
  if (this.status !== 'pending_approval') {
    throw new Error('Ticket is not pending approval')
  }

  this.previousStatus = this.status
  this.status = 'open'
  this.approvalStatus = 'approved'
  this.approvalDate = new Date()
  this.approvalRemarks = remarks

  this.addActivity('approved', `Ticket approved by ${user.name}${remarks ? `: ${remarks}` : ''}`, user)

  return this.save()
}

ticketSchema.methods.reject = async function(user, remarks) {
  if (this.status !== 'pending_approval') {
    throw new Error('Ticket is not pending approval')
  }

  this.previousStatus = this.status
  this.status = 'rejected'
  this.approvalStatus = 'rejected'
  this.approvalDate = new Date()
  this.approvalRemarks = remarks

  this.addActivity('rejected', `Ticket rejected by ${user.name}: ${remarks}`, user)

  return this.save()
}

ticketSchema.methods.assign = async function(assignee, assigner) {
  const oldAssignee = this.assignedToName

  this.assignedTo = assignee._id
  this.assignedToName = assignee.name
  this.assignedToDepartment = assignee.department
  this.assignedDate = new Date()
  this.assignedBy = assigner._id
  this.assignedByName = assigner.name

  if (this.status === 'open') {
    this.previousStatus = this.status
    this.status = 'in_progress'
  }

  this.addActivity(
    oldAssignee ? 'reassigned' : 'assigned',
    `Ticket ${oldAssignee ? 'reassigned' : 'assigned'} to ${assignee.name} by ${assigner.name}`,
    assigner,
    oldAssignee,
    assignee.name
  )

  return this.save()
}

ticketSchema.methods.startWork = async function(user) {
  if (!['open', 'pending_info'].includes(this.status)) {
    throw new Error('Cannot start work on this ticket')
  }

  this.previousStatus = this.status
  this.status = 'in_progress'

  this.addActivity('work_started', `Work started by ${user.name}`, user)

  return this.save()
}

ticketSchema.methods.requestInfo = async function(user, message) {
  this.previousStatus = this.status
  this.status = 'pending_info'

  this.addComment(message, user, false)
  this.addActivity('info_requested', `Additional information requested by ${user.name}`, user)

  return this.save()
}

ticketSchema.methods.provideInfo = async function(user, message, attachments = []) {
  if (this.status !== 'pending_info') {
    throw new Error('Ticket is not pending information')
  }

  this.previousStatus = this.status
  this.status = 'in_progress'

  this.addComment(message, user, false, attachments)
  this.addActivity('info_provided', `Information provided by ${user.name}`, user)

  return this.save()
}

ticketSchema.methods.putOnHold = async function(user, reason) {
  this.previousStatus = this.status
  this.status = 'on_hold'

  this.addActivity('put_on_hold', `Ticket put on hold by ${user.name}: ${reason}`, user)

  return this.save()
}

ticketSchema.methods.resume = async function(user) {
  if (this.status !== 'on_hold') {
    throw new Error('Ticket is not on hold')
  }

  this.status = this.previousStatus || 'in_progress'

  this.addActivity('resumed', `Ticket resumed by ${user.name}`, user)

  return this.save()
}

ticketSchema.methods.resolve = async function(user, resolution, resolutionType = 'resolved') {
  if (!['open', 'in_progress', 'pending_info'].includes(this.status)) {
    throw new Error('Cannot resolve this ticket')
  }

  this.previousStatus = this.status
  this.status = 'resolved'
  this.resolution = resolution
  this.resolutionType = resolutionType
  this.resolvedBy = user._id
  this.resolvedByName = user.name
  this.resolvedDate = new Date()

  // Check if SLA was met
  if (this.slaDueDate && new Date() > this.slaDueDate) {
    this.slaBreached = true
    this.slaBreachedAt = this.slaBreachedAt || new Date()
  }

  this.addActivity('resolved', `Ticket resolved by ${user.name}: ${resolution}`, user)

  return this.save()
}

ticketSchema.methods.close = async function(user, remarks) {
  if (this.status !== 'resolved') {
    throw new Error('Only resolved tickets can be closed')
  }

  this.previousStatus = this.status
  this.status = 'closed'
  this.closedBy = user._id
  this.closedByName = user.name
  this.closedDate = new Date()
  this.closureRemarks = remarks

  this.addActivity('closed', `Ticket closed by ${user.name}`, user)

  return this.save()
}

ticketSchema.methods.reopen = async function(user, reason) {
  if (!['resolved', 'closed'].includes(this.status)) {
    throw new Error('Only resolved or closed tickets can be reopened')
  }

  this.previousStatus = this.status
  this.status = 'in_progress'
  this.reopenedAt = new Date()
  this.reopenCount = (this.reopenCount || 0) + 1

  // Reset resolution fields
  this.resolution = null
  this.resolutionType = null
  this.resolvedBy = null
  this.resolvedByName = null
  this.resolvedDate = null

  this.addActivity('reopened', `Ticket reopened by ${user.name}: ${reason}`, user)

  return this.save()
}

ticketSchema.methods.cancel = async function(user, reason) {
  if (['closed', 'cancelled'].includes(this.status)) {
    throw new Error('Cannot cancel this ticket')
  }

  this.previousStatus = this.status
  this.status = 'cancelled'

  this.addActivity('cancelled', `Ticket cancelled by ${user.name}: ${reason}`, user)

  return this.save()
}

ticketSchema.methods.escalate = async function(user, escalateTo, reason) {
  this.isEscalated = true
  this.escalatedTo = escalateTo._id
  this.escalatedToName = escalateTo.name
  this.escalationReason = reason
  this.escalationDate = new Date()
  this.escalationLevel = (this.escalationLevel || 0) + 1

  this.addActivity('escalated', `Ticket escalated to ${escalateTo.name} by ${user.name}: ${reason}`, user)

  return this.save()
}

ticketSchema.methods.rate = async function(user, rating, feedback) {
  if (this.status !== 'closed') {
    throw new Error('Only closed tickets can be rated')
  }

  this.satisfactionRating = rating
  this.satisfactionFeedback = feedback
  this.satisfactionRatedAt = new Date()

  this.addActivity('rated', `Ticket rated ${rating}/5 by ${user.name}`, user)

  return this.save()
}

// Static Methods
ticketSchema.statics.getStats = async function(companyId, filters = {}) {
  const matchStage = { company: new mongoose.Types.ObjectId(companyId) }

  if (filters.dateFrom) {
    matchStage.createdAt = { $gte: new Date(filters.dateFrom) }
  }
  if (filters.dateTo) {
    matchStage.createdAt = { ...matchStage.createdAt, $lte: new Date(filters.dateTo) }
  }
  if (filters.department) {
    matchStage.supportDepartment = filters.department
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        pendingApproval: { $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] } },
        pendingInfo: { $sum: { $cond: [{ $eq: ['$status', 'pending_info'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        slaBreached: { $sum: { $cond: ['$slaBreached', 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        avgRating: { $avg: '$satisfactionRating' }
      }
    }
  ])

  return stats[0] || {
    total: 0, open: 0, inProgress: 0, pendingApproval: 0, pendingInfo: 0,
    resolved: 0, closed: 0, rejected: 0, slaBreached: 0, critical: 0, high: 0, avgRating: null
  }
}

ticketSchema.statics.getStatsByCategory = async function(companyId) {
  return this.aggregate([
    { $match: { company: new mongoose.Types.ObjectId(companyId) } },
    {
      $group: {
        _id: '$category',
        categoryName: { $first: '$categoryName' },
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $in: ['$status', ['open', 'in_progress', 'pending_info']] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } }
      }
    },
    { $sort: { total: -1 } }
  ])
}

ticketSchema.statics.getStatsByDepartment = async function(companyId) {
  return this.aggregate([
    { $match: { company: new mongoose.Types.ObjectId(companyId) } },
    {
      $group: {
        _id: '$supportDepartment',
        total: { $sum: 1 },
        open: { $sum: { $cond: [{ $in: ['$status', ['open', 'in_progress', 'pending_info']] }, 1, 0] } },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $and: ['$resolvedDate', '$submittedAt'] },
              { $subtract: ['$resolvedDate', '$submittedAt'] },
              null
            ]
          }
        }
      }
    },
    { $sort: { total: -1 } }
  ])
}

const Ticket = mongoose.model('Ticket', ticketSchema)

export default Ticket
