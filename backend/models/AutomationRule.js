import mongoose from 'mongoose'

const automationRuleSchema = new mongoose.Schema({
  ruleId: {
    type: String,
    unique: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['lead_assignment', 'follow_up', 'escalation', 'notification', 'status_update'],
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // Trigger Configuration
  trigger: {
    type: {
      type: String,
      enum: ['event', 'schedule', 'condition'],
      required: true
    },
    event: {
      type: String,
      enum: [
        'lead_created',
        'lead_updated',
        'lead_stale',
        'follow_up_due',
        'follow_up_overdue',
        'sla_approaching',
        'sla_breached',
        'project_stage_changed',
        'payment_overdue',
        'customer_created'
      ]
    },
    schedule: {
      frequency: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly']
      },
      time: String,          // "09:00" format
      days: [Number],        // [1,2,3,4,5] for weekdays (0 = Sunday)
      dayOfMonth: Number     // For monthly schedules
    },
    conditions: [{
      field: String,
      operator: {
        type: String,
        enum: ['equals', 'not_equals', 'greater_than', 'less_than',
               'contains', 'not_contains', 'in', 'not_in',
               'is_empty', 'is_not_empty', 'is_true', 'is_false',
               'older_than_hours', 'older_than_days']
      },
      value: mongoose.Schema.Types.Mixed
    }]
  },

  // Action Configuration
  actions: [{
    type: {
      type: String,
      enum: [
        'assign_lead',
        'send_notification',
        'send_email',
        'create_alert',
        'update_status',
        'escalate',
        'create_task',
        'add_note',
        'webhook'
      ],
      required: true
    },
    config: {
      // For assign_lead
      assignmentStrategy: {
        type: String,
        enum: ['round_robin', 'load_balanced', 'skill_based', 'specific_user']
      },
      assignToRole: String,
      assignToUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      assignByVertical: Boolean,

      // For notifications
      notifyRoles: [String],
      notifyUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      notifyManager: Boolean,
      notifyAssignee: Boolean,
      notificationTitle: String,
      notificationMessage: String,

      // For email
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MailTemplate'
      },
      emailSubject: String,
      emailBody: String,

      // For escalation
      escalateTo: {
        type: String,
        enum: ['manager', 'company_admin', 'super_admin', 'specific_user']
      },
      escalationUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      escalationLevel: Number,

      // For status update
      newStatus: String,

      // For create_alert
      alertType: String,
      alertSeverity: String,
      alertTitle: String,
      alertMessage: String,

      // For add_note
      noteContent: String,

      // For webhook
      webhookUrl: String,
      webhookMethod: {
        type: String,
        enum: ['GET', 'POST', 'PUT'],
        default: 'POST'
      },
      webhookHeaders: mongoose.Schema.Types.Mixed,
      webhookPayload: mongoose.Schema.Types.Mixed
    },
    order: {
      type: Number,
      default: 0
    }
  }],

  // Execution Settings
  executionSettings: {
    maxExecutionsPerDay: {
      type: Number,
      default: 100
    },
    cooldownMinutes: {
      type: Number,
      default: 0
    },
    retryOnFailure: {
      type: Boolean,
      default: false
    },
    maxRetries: {
      type: Number,
      default: 3
    }
  },

  // Statistics
  stats: {
    totalExecutions: {
      type: Number,
      default: 0
    },
    successfulExecutions: {
      type: Number,
      default: 0
    },
    failedExecutions: {
      type: Number,
      default: 0
    },
    lastExecutedAt: Date,
    lastResult: String,
    executionsToday: {
      type: Number,
      default: 0
    },
    lastResetDate: Date
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Generate ruleId before save
automationRuleSchema.pre('save', async function(next) {
  if (!this.ruleId) {
    const company = await mongoose.model('Company').findById(this.company)
    const companyCode = company?.code || 'XX'
    const count = await mongoose.model('AutomationRule').countDocuments({ company: this.company })
    this.ruleId = `${companyCode}-AUT-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Indexes
automationRuleSchema.index({ company: 1, isActive: 1 })
automationRuleSchema.index({ category: 1, isActive: 1 })
automationRuleSchema.index({ 'trigger.type': 1, 'trigger.event': 1 })

// Instance method to check if rule can execute
automationRuleSchema.methods.canExecute = function() {
  if (!this.isActive) return false

  const { maxExecutionsPerDay, cooldownMinutes } = this.executionSettings
  const { executionsToday, lastExecutedAt, lastResetDate } = this.stats

  // Check if we need to reset daily counter
  const today = new Date().toDateString()
  if (!lastResetDate || new Date(lastResetDate).toDateString() !== today) {
    this.stats.executionsToday = 0
    this.stats.lastResetDate = new Date()
  }

  // Check max executions
  if (executionsToday >= maxExecutionsPerDay) return false

  // Check cooldown
  if (cooldownMinutes > 0 && lastExecutedAt) {
    const cooldownMs = cooldownMinutes * 60 * 1000
    if (Date.now() - new Date(lastExecutedAt).getTime() < cooldownMs) {
      return false
    }
  }

  return true
}

// Instance method to record execution
automationRuleSchema.methods.recordExecution = async function(success, result) {
  this.stats.totalExecutions += 1
  this.stats.executionsToday += 1
  this.stats.lastExecutedAt = new Date()
  this.stats.lastResult = result || (success ? 'Success' : 'Failed')

  if (success) {
    this.stats.successfulExecutions += 1
  } else {
    this.stats.failedExecutions += 1
  }

  await this.save()
}

// Static method to get rules by trigger event
automationRuleSchema.statics.getByEvent = function(event, companyId) {
  return this.find({
    company: companyId,
    isActive: true,
    'trigger.type': 'event',
    'trigger.event': event
  })
}

// Static method to get scheduled rules
automationRuleSchema.statics.getScheduledRules = function() {
  return this.find({
    isActive: true,
    'trigger.type': 'schedule'
  }).populate('company')
}

const AutomationRule = mongoose.model('AutomationRule', automationRuleSchema)

export default AutomationRule
