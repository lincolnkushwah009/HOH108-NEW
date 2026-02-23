import mongoose from 'mongoose'

const dataRetentionPolicySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  entityType: {
    type: String,
    enum: ['lead', 'customer', 'employee', 'vendor', 'invoice', 'payment', 'audit_log'],
    required: [true, 'Entity type is required']
  },

  retentionPeriodDays: {
    type: Number,
    required: [true, 'Retention period is required'],
    min: [1, 'Retention period must be at least 1 day']
  },

  action: {
    type: String,
    enum: ['archive', 'anonymize', 'delete'],
    required: [true, 'Action is required']
  },

  isActive: {
    type: Boolean,
    default: true
  },

  lastExecutedAt: {
    type: Date
  },

  nextScheduledAt: {
    type: Date
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
dataRetentionPolicySchema.index({ company: 1, entityType: 1 })
dataRetentionPolicySchema.index({ company: 1, isActive: 1 })
dataRetentionPolicySchema.index({ nextScheduledAt: 1 })

const DataRetentionPolicy = mongoose.model('DataRetentionPolicy', dataRetentionPolicySchema)

export default DataRetentionPolicy
