import mongoose from 'mongoose'

/**
 * Project Task Model (Master Template)
 * Represents the lowest-level task in project hierarchy: Phase > Activity > Task
 * Examples: Creation of BOM, Pasting, Cutting, False Ceiling, Plumbing
 */
const projectTaskSchema = new mongoose.Schema({
  // Auto-generated Task ID (e.g., IP-TSK-2024-00001)
  taskId: {
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

  // Parent Activity
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectActivity',
    required: true,
    index: true
  },

  // Parent Phase (denormalized for faster queries)
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

  // Task Name
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

  // Display Order within activity
  order: {
    type: Number,
    default: 0
  },

  // Default Weightage (percentage contribution to activity completion)
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

  // Task requires vendor assignment?
  requiresVendor: {
    type: Boolean,
    default: false
  },

  // Task requires material?
  requiresMaterial: {
    type: Boolean,
    default: false
  },

  // Is this a QC checkpoint?
  isQCCheckpoint: {
    type: Boolean,
    default: false
  },

  // Is this a milestone task?
  isMilestone: {
    type: Boolean,
    default: false
  },

  // Color for UI display
  color: {
    type: String,
    default: '#06b6d4'
  },

  // Is this a master template task?
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
projectTaskSchema.index({ company: 1, activity: 1, code: 1 }, { unique: true })
projectTaskSchema.index({ company: 1, activity: 1, order: 1 })
projectTaskSchema.index({ company: 1, phase: 1 })
projectTaskSchema.index({ company: 1, entityType: 1 })

export default mongoose.model('ProjectTask', projectTaskSchema)
