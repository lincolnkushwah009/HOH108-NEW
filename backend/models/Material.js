import mongoose from 'mongoose'

/**
 * Material - Master data for inventory items/materials
 */

const materialSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Unique SKU code
  skuCode: {
    type: String,
    required: true
  },

  materialName: {
    type: String,
    required: [true, 'Material name is required']
  },

  description: {
    type: String,
    default: ''
  },

  // Category
  category: {
    type: String,
    enum: ['raw_material', 'hardware', 'fabric', 'wood', 'glass', 'metal', 'electrical', 'plumbing', 'paint', 'adhesive', 'other'],
    default: 'other'
  },

  subCategory: {
    type: String,
    default: ''
  },

  // Unit of measurement
  unit: {
    type: String,
    enum: ['pcs', 'kg', 'g', 'ltr', 'ml', 'sqft', 'sqm', 'rft', 'mtr', 'nos', 'set', 'box', 'roll', 'sheet'],
    default: 'pcs'
  },

  // Pricing
  unitPrice: {
    type: Number,
    default: 0
  },

  currency: {
    type: String,
    default: 'INR'
  },

  // GST
  hsnCode: {
    type: String,
    default: ''
  },

  gstRate: {
    type: Number,
    default: 18
  },

  // Stock thresholds (defaults for new stock entries)
  defaultReorderLevel: {
    type: Number,
    default: 10
  },

  defaultMaxStock: {
    type: Number,
    default: 1000
  },

  // Specifications
  specifications: {
    brand: String,
    model: String,
    size: String,
    color: String,
    weight: Number,
    dimensions: String
  },

  // Vendor information
  preferredVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],

  leadTime: {
    type: Number,
    default: 7 // Days
  },

  // Status
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

// Compound unique index for SKU per company
materialSchema.index({ company: 1, skuCode: 1 }, { unique: true })
materialSchema.index({ company: 1, category: 1 })
materialSchema.index({ company: 1, materialName: 'text' })

// Auto-generate SKU if not provided
materialSchema.pre('save', async function(next) {
  if (!this.skuCode) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const categoryPrefix = this.category.substring(0, 3).toUpperCase()
    this.skuCode = `${categoryPrefix}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

const Material = mongoose.model('Material', materialSchema)

export default Material
