import mongoose from 'mongoose'

/**
 * Package Model - Different pricing packages
 * E.g., Basic, Standard, Premium, Luxury
 */

const packageSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

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

  // Price range for display
  priceRange: {
    min: Number,
    max: Number,
    unit: {
      type: String,
      default: 'sqft'
    }
  },

  // Features included in this package
  features: [String],

  // Color for UI display
  color: {
    type: String,
    default: '#edbc5c'
  },

  // Sorting order
  sortOrder: {
    type: Number,
    default: 0
  },

  isDefault: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
packageSchema.index({ company: 1, isActive: 1 })
packageSchema.index({ company: 1, code: 1 }, { unique: true })

export default mongoose.model('Package', packageSchema)
