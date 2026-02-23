import mongoose from 'mongoose'

/**
 * LeadScore - Lead scoring with multi-dimensional breakdown
 *
 * Calculates and tracks lead scores based on demographic, behavioral,
 * engagement, and firmographic factors. Maintains score history for trending.
 */

const scoreFactorSchema = new mongoose.Schema({
  factor: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false })

const scoreCategorySchema = new mongoose.Schema({
  score: {
    type: Number,
    default: 0
  },
  factors: [scoreFactorSchema]
}, { _id: false })

const scoreHistorySchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true
  },
  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F'],
    required: true
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true })

const leadScoreSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },

  totalScore: {
    type: Number,
    default: 0
  },

  scoreBreakdown: {
    demographic: scoreCategorySchema,
    behavioral: scoreCategorySchema,
    engagement: scoreCategorySchema,
    firmographic: scoreCategorySchema
  },

  grade: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'F'],
    default: 'F'
  },

  lastCalculatedAt: {
    type: Date,
    default: Date.now
  },

  history: [scoreHistorySchema]
}, {
  timestamps: true
})

// Indexes
leadScoreSchema.index({ company: 1, lead: 1 }, { unique: true })
leadScoreSchema.index({ company: 1, totalScore: -1 })
leadScoreSchema.index({ company: 1, grade: 1 })
leadScoreSchema.index({ lastCalculatedAt: -1 })

// Pre-save: recalculate totalScore and grade from breakdown
leadScoreSchema.pre('save', function(next) {
  if (this.scoreBreakdown) {
    const breakdown = this.scoreBreakdown
    this.totalScore =
      (breakdown.demographic?.score || 0) +
      (breakdown.behavioral?.score || 0) +
      (breakdown.engagement?.score || 0) +
      (breakdown.firmographic?.score || 0)

    // Assign grade based on totalScore
    if (this.totalScore >= 80) this.grade = 'A'
    else if (this.totalScore >= 60) this.grade = 'B'
    else if (this.totalScore >= 40) this.grade = 'C'
    else if (this.totalScore >= 20) this.grade = 'D'
    else this.grade = 'F'

    this.lastCalculatedAt = new Date()
  }
  next()
})

const LeadScore = mongoose.model('LeadScore', leadScoreSchema)

export default LeadScore
