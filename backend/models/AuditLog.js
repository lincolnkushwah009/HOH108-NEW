import mongoose from 'mongoose'

/**
 * AuditLog - Track all system activities and changes
 *
 * This model logs all significant actions performed in the system
 * for compliance, debugging, and audit purposes
 */

const changeSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true
  },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed
}, { _id: false })

const auditLogSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // User who performed the action
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Action type
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'VIEW', 'SEND', 'CANCEL', 'SUBMIT', 'ASSIGN', 'CONVERT'],
    required: true
  },

  // Module where the action occurred
  module: {
    type: String,
    enum: ['Projects', 'Sales', 'Inventory', 'Settings', 'Finance', 'Procurement', 'Auth', 'Customers', 'HR', 'Leads', 'Vendors', 'Tickets', 'Reports', 'Users', 'Approvals'],
    required: true
  },

  // Entity type (model name)
  entity: {
    type: String,
    required: true
  },

  // Entity ID
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },

  // Human-readable entity name/identifier
  entityName: {
    type: String
  },

  // Detailed changes (for UPDATE actions)
  changes: [changeSchema],

  // Additional details
  details: {
    type: mongoose.Schema.Types.Mixed
  },

  // Request metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    requestId: String,
    sessionId: String
  },

  // Timestamp (automatically set)
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We use our own timestamp field
})

// Indexes for efficient querying
auditLogSchema.index({ company: 1, timestamp: -1 })
auditLogSchema.index({ company: 1, user: 1, timestamp: -1 })
auditLogSchema.index({ company: 1, module: 1, timestamp: -1 })
auditLogSchema.index({ company: 1, action: 1, timestamp: -1 })
auditLogSchema.index({ company: 1, entity: 1, entityId: 1 })
auditLogSchema.index({ timestamp: -1 })

// TTL index to automatically delete old logs (optional - 2 years retention)
// auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 })

// Static method to log an action
auditLogSchema.statics.logAction = async function({
  company,
  user,
  action,
  module,
  entity,
  entityId,
  entityName,
  changes,
  details,
  metadata
}) {
  try {
    return await this.create({
      company,
      user,
      action,
      module,
      entity,
      entityId,
      entityName,
      changes,
      details,
      metadata,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Error logging audit action:', error)
    // Don't throw - audit logging should not break the main flow
    return null
  }
}

// Static method to get activity for a specific entity
auditLogSchema.statics.getEntityHistory = async function(companyId, entity, entityId) {
  return this.find({
    company: companyId,
    entity,
    entityId
  })
    .populate('user', 'name email')
    .sort({ timestamp: -1 })
}

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(companyId, userId, options = {}) {
  const { page = 1, limit = 50, startDate, endDate } = options

  const filter = {
    company: companyId,
    user: userId
  }

  if (startDate || endDate) {
    filter.timestamp = {}
    if (startDate) filter.timestamp.$gte = new Date(startDate)
    if (endDate) filter.timestamp.$lte = new Date(endDate)
  }

  const logs = await this.find(filter)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)

  const total = await this.countDocuments(filter)

  return {
    logs,
    total,
    pages: Math.ceil(total / limit)
  }
}

// Static method to get statistics
auditLogSchema.statics.getStats = async function(companyId, options = {}) {
  const { startDate, endDate } = options

  const matchStage = { company: new mongoose.Types.ObjectId(companyId) }

  if (startDate || endDate) {
    matchStage.timestamp = {}
    if (startDate) matchStage.timestamp.$gte = new Date(startDate)
    if (endDate) matchStage.timestamp.$lte = new Date(endDate)
  }

  const [byAction, byModule, totalCount] = await Promise.all([
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    this.aggregate([
      { $match: matchStage },
      { $group: { _id: '$module', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    this.countDocuments(matchStage)
  ])

  return {
    total: totalCount,
    byAction: byAction.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {}),
    byModule: byModule.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})
  }
}

const AuditLog = mongoose.model('AuditLog', auditLogSchema)

export default AuditLog
