import mongoose from 'mongoose'

/**
 * RiskRegister - Project risk management
 *
 * Tracks identified risks, their probability and impact, mitigation plans,
 * and ongoing monitoring activities for projects.
 */

const riskActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String
  }
}, { _id: true })

// Probability-Impact scoring matrix
const PROBABILITY_SCORES = { very_low: 1, low: 2, medium: 3, high: 4, very_high: 5 }
const IMPACT_SCORES = { negligible: 1, minor: 2, moderate: 3, major: 4, critical: 5 }

const riskRegisterSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  riskId: {
    type: String,
    unique: true
  },

  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  category: {
    type: String,
    enum: ['financial', 'schedule', 'resource', 'quality', 'scope', 'external', 'compliance'],
    required: true
  },

  probability: {
    type: String,
    enum: ['very_low', 'low', 'medium', 'high', 'very_high'],
    required: true,
    default: 'medium'
  },

  impact: {
    type: String,
    enum: ['negligible', 'minor', 'moderate', 'major', 'critical'],
    required: true,
    default: 'moderate'
  },

  riskScore: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['identified', 'analyzing', 'mitigating', 'monitoring', 'closed'],
    default: 'identified'
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  mitigationPlan: {
    type: String
  },

  contingencyPlan: {
    type: String
  },

  triggerConditions: {
    type: String
  },

  reviewDate: {
    type: Date
  },

  activities: [riskActivitySchema],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes
riskRegisterSchema.index({ company: 1, project: 1 })
riskRegisterSchema.index({ company: 1, status: 1 })
riskRegisterSchema.index({ company: 1, category: 1 })
riskRegisterSchema.index({ company: 1, riskScore: -1 })
riskRegisterSchema.index({ owner: 1, status: 1 })
riskRegisterSchema.index({ reviewDate: 1 })

// Generate riskId and calculate riskScore before save
riskRegisterSchema.pre('save', async function(next) {
  if (this.isNew && !this.riskId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.riskId = `RISK-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate risk score from probability x impact
  this.riskScore = (PROBABILITY_SCORES[this.probability] || 0) * (IMPACT_SCORES[this.impact] || 0)

  next()
})

const RiskRegister = mongoose.model('RiskRegister', riskRegisterSchema)

export default RiskRegister
