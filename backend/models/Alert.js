import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    unique: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Alert Type & Severity
  type: {
    type: String,
    enum: [
      'lead_follow_up_overdue',
      'sla_breach',
      'performance_threshold',
      'lead_aging',
      'payment_overdue',
      'project_delay',
      'target_at_risk',
      'conversion_drop',
      'response_time_breach',
      'escalation'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'warning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Target (what this alert is about)
  targetType: {
    type: String,
    enum: ['user', 'team', 'company', 'lead', 'project', 'customer'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetType'
  },
  targetName: String,

  // Alert Content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  actionUrl: String,
  actionLabel: String,

  // Context Data
  metadata: {
    threshold: Number,
    actualValue: Number,
    leadId: mongoose.Schema.Types.ObjectId,
    projectId: mongoose.Schema.Types.ObjectId,
    customerId: mongoose.Schema.Types.ObjectId,
    period: String,
    originalAssignee: mongoose.Schema.Types.ObjectId,
    reason: String,
    escalationLevel: Number
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active'
  },

  // Assignment & Resolution
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledgedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolution: String,

  // Timing
  triggeredAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date,

  // Notification tracking
  notificationsSent: [{
    channel: {
      type: String,
      enum: ['in_app', 'email', 'sms', 'push']
    },
    sentAt: Date,
    delivered: Boolean
  }]
}, {
  timestamps: true
})

// Generate alertId before save
alertSchema.pre('save', async function(next) {
  if (!this.alertId) {
    const company = await mongoose.model('Company').findById(this.company)
    const companyCode = company?.code || 'XX'
    const year = new Date().getFullYear()
    const count = await mongoose.model('Alert').countDocuments({
      company: this.company,
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    })
    this.alertId = `${companyCode}-ALT-${year}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

// Indexes for efficient queries
alertSchema.index({ company: 1, status: 1 })
alertSchema.index({ assignedTo: 1, status: 1 })
alertSchema.index({ type: 1, status: 1 })
alertSchema.index({ triggeredAt: -1 })
alertSchema.index({ severity: 1, status: 1 })

const Alert = mongoose.model('Alert', alertSchema)

export default Alert
