import mongoose from 'mongoose'

const remediationStepSchema = new mongoose.Schema({
  step: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  completedAt: Date
}, { _id: false })

const timelineSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedAt: { type: Date, default: Date.now },
  details: String
}, { _id: false })

const breachNotificationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  breachId: {
    type: String,
    unique: true,
    sparse: true
  },

  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Severity is required']
  },

  status: {
    type: String,
    enum: ['detected', 'investigating', 'contained', 'notified', 'resolved'],
    default: 'detected'
  },

  description: {
    type: String,
    required: [true, 'Description is required']
  },

  affectedDataSubjects: {
    type: Number,
    default: 0
  },

  dataTypesAffected: [{
    type: String
  }],

  detectedAt: {
    type: Date,
    default: Date.now
  },

  containedAt: {
    type: Date
  },

  notifiedAuthority: {
    notifiedAt: Date,
    referenceNumber: String
  },

  notifiedSubjects: {
    notifiedAt: Date,
    method: String,
    count: Number
  },

  rootCause: {
    type: String
  },

  remediationSteps: [remediationStepSchema],

  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  timeline: [timelineSchema]
}, {
  timestamps: true
})

// Pre-save: auto-generate breachId
breachNotificationSchema.pre('save', async function(next) {
  if (!this.breachId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.breachId = `BRN-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Indexes
breachNotificationSchema.index({ company: 1, status: 1 })
breachNotificationSchema.index({ company: 1, severity: 1 })
breachNotificationSchema.index({ company: 1, createdAt: -1 })
// breachId already has unique:true which creates an index
breachNotificationSchema.index({ detectedAt: -1 })

const BreachNotification = mongoose.model('BreachNotification', breachNotificationSchema)

export default BreachNotification
