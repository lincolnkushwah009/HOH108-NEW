import mongoose from 'mongoose'

/**
 * TrainingSkillMatrix - Skills and training tracking
 *
 * Maintains a comprehensive skill inventory and training record
 * for each employee with proficiency levels, certifications, and review cycles.
 */

const skillSchema = new mongoose.Schema({
  skillName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'soft', 'domain', 'tool', 'certification'],
    required: true
  },
  proficiencyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  assessedAt: {
    type: Date,
    default: Date.now
  },
  assessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  certificationExpiry: {
    type: Date
  },
  notes: {
    type: String
  }
}, { _id: true })

const trainingSchema = new mongoose.Schema({
  trainingName: {
    type: String,
    required: true
  },
  provider: {
    type: String
  },
  completedAt: {
    type: Date
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  certificate: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'expired'],
    default: 'planned'
  }
}, { _id: true })

const trainingSkillMatrixSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  skills: [skillSchema],

  trainings: [trainingSchema],

  lastReviewedAt: {
    type: Date
  },

  nextReviewDate: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes
trainingSkillMatrixSchema.index({ company: 1, employee: 1 }, { unique: true })
trainingSkillMatrixSchema.index({ company: 1, 'skills.category': 1 })
trainingSkillMatrixSchema.index({ company: 1, 'skills.proficiencyLevel': 1 })
trainingSkillMatrixSchema.index({ 'skills.certificationExpiry': 1 })
trainingSkillMatrixSchema.index({ 'trainings.status': 1 })
trainingSkillMatrixSchema.index({ nextReviewDate: 1 })

const TrainingSkillMatrix = mongoose.model('TrainingSkillMatrix', trainingSkillMatrixSchema)

export default TrainingSkillMatrix
