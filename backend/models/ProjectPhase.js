import mongoose from 'mongoose'

/**
 * Project Phase Model
 * Represents the top-level phase in project hierarchy: Phase > Activity > Task
 * Examples: Design Phase, P2P Phase, Construction Phase
 */
const projectPhaseSchema = new mongoose.Schema({
  // Auto-generated Phase ID (e.g., IP-PH-2024-00001)
  phaseId: {
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

  // Entity Type: Interior Plus or Exterior Plus
  entityType: {
    type: String,
    enum: ['interior_plus', 'exterior_plus'],
    required: true,
    index: true
  },

  // Phase Name
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

  // Display Order
  order: {
    type: Number,
    default: 0
  },

  // Default Weightage (percentage contribution to project completion)
  defaultWeightage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Color for UI display
  color: {
    type: String,
    default: '#6366f1'
  },

  // Icon name (from lucide-react)
  icon: {
    type: String,
    default: 'Layers'
  },

  // Is this a master template phase?
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
projectPhaseSchema.index({ company: 1, entityType: 1, code: 1 }, { unique: true })
projectPhaseSchema.index({ company: 1, entityType: 1, order: 1 })

export default mongoose.model('ProjectPhase', projectPhaseSchema)
