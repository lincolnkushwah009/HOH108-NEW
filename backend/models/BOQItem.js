import mongoose from 'mongoose'

/**
 * BOQ Item Master - Master list of BOQ items with pricing per package
 * Used by sales team to generate quotes
 */

// Pricing config per package
const packagePricingSchema = new mongoose.Schema({
  package: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    default: 0
  },
  percent: {
    type: Number,
    default: 100 // Percentage multiplier (e.g., 100 = 100% = 1x)
  }
}, { _id: false })

const boqItemSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Item Details
  name: {
    type: String,
    required: true,
    trim: true
  },

  code: {
    type: String,
    trim: true,
    uppercase: true
  },

  description: String,

  category: {
    type: String,
    enum: ['civil', 'electrical', 'plumbing', 'furniture', 'modular_kitchen', 'wardrobe', 'false_ceiling', 'painting', 'flooring', 'doors_windows', 'bathroom', 'lighting', 'miscellaneous', 'other'],
    default: 'furniture'
  },

  unit: {
    type: String,
    enum: ['sqft', 'rft', 'nos', 'lot', 'ls', 'sqm', 'set'],
    default: 'sqft'
  },

  // Pricing per package
  packagePricing: [packagePricingSchema],

  // Default rate if no package pricing found
  defaultRate: {
    type: Number,
    default: 0
  },

  // Sorting order
  sortOrder: {
    type: Number,
    default: 0
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
boqItemSchema.index({ company: 1, isActive: 1 })
boqItemSchema.index({ company: 1, category: 1 })
boqItemSchema.index({ company: 1, code: 1 }, { unique: true, sparse: true })

// Method to get rate for a specific package
boqItemSchema.methods.getRateForPackage = function(packageName) {
  const pricing = this.packagePricing.find(p => p.package === packageName)
  if (pricing) {
    return { rate: pricing.rate, percent: pricing.percent }
  }
  return { rate: this.defaultRate, percent: 100 }
}

export default mongoose.model('BOQItem', boqItemSchema)
