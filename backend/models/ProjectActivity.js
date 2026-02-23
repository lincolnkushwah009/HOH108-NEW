import mongoose from 'mongoose'

/**
 * Project Activity Model
 * Represents the mid-level activity in project hierarchy: Phase > Activity > Task
 * Examples: Factory Production, Installation, Site Preparation, Earth Works
 */
const projectActivitySchema = new mongoose.Schema({
  // Auto-generated Activity ID (e.g., IP-ACT-2024-00001)
  activityId: {
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

  // Parent Phase
  phase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectPhase',
    required: true,
    index: true
  },

  // Entity Type (denormalized for faster queries)
  entityType: {
    type: String,
    enum: ['interior_plus', 'exterior_plus'],
    required: true,
    index: true
  },

  // Activity Name
  name: {
    type: String,
    required: true,
    trim: true
  },

  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },

  description: String,

  // Display Order within phase
  order: {
    type: Number,
    default: 0
  },

  // Default Weightage (percentage contribution to phase completion)
  defaultWeightage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Estimated Duration
  estimatedDuration: {
    value: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'days'
    }
  },

  // Color for UI display
  color: {
    type: String,
    default: '#8b5cf6'
  },

  // Is this a master template activity?
  isTemplate: {
    type: Boolean,
    default: true
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
projectActivitySchema.index({ company: 1, phase: 1, code: 1 }, { unique: true })
projectActivitySchema.index({ company: 1, phase: 1, order: 1 })
projectActivitySchema.index({ company: 1, entityType: 1 })

export default mongoose.model('ProjectActivity', projectActivitySchema)
