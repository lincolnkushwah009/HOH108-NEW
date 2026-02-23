import mongoose from 'mongoose'

const priceHistorySchema = new mongoose.Schema({
  price: { type: Number, required: true },
  priceMax: Number, // For range prices like 650-700
  effectiveDate: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  remarks: String
})

const materialPricelistSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  // Material identification
  materialType: {
    type: String,
    enum: ['cement', 'steel', 'blocks', 'aggregate', 'rmc', 'plywood', 'hardware', 'tiles', 'sanitaryware', 'electrical', 'plumbing', 'other'],
    required: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String, // e.g., 'Cement', 'Steel', 'Blocks', 'Aggregate', 'RMC'
    trim: true
  },
  subCategory: String, // e.g., 'OPC', 'PPC', 'TMT'
  specification: String, // e.g., '4" Block', 'M20 Concrete', '20mm Aggregate'

  // Pricing
  unit: {
    type: String,
    enum: ['bag', 'ton', 'unit', 'sqft', 'sqm', 'rft', 'nos', 'kg', 'ltr', 'cft', 'm3', 'bundle'],
    default: 'unit'
  },
  currentPrice: {
    type: Number,
    required: true
  },
  currentPriceMax: Number, // For range prices
  priceType: {
    type: String,
    enum: ['fixed', 'range', 'negotiable'],
    default: 'fixed'
  },

  // Price history for tracking changes
  priceHistory: [priceHistorySchema],

  // Vendor linkage
  preferredVendors: [{
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    vendorPrice: Number,
    remarks: String
  }],

  // Additional info
  gstRate: {
    type: Number,
    default: 18
  },
  hsnCode: String,
  leadTime: String, // e.g., '2-3 days'
  minOrderQty: Number,

  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  remarks: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Add to price history when price changes
materialPricelistSchema.pre('save', function(next) {
  if (this.isModified('currentPrice') && !this.isNew) {
    this.priceHistory.push({
      price: this.currentPrice,
      priceMax: this.currentPriceMax,
      effectiveDate: new Date(),
      updatedBy: this.lastUpdatedBy
    })
  }
  next()
})

// Indexes
materialPricelistSchema.index({ company: 1, materialType: 1 })
materialPricelistSchema.index({ company: 1, brand: 1 })
materialPricelistSchema.index({ company: 1, category: 1 })
materialPricelistSchema.index({ company: 1, status: 1 })

const MaterialPricelist = mongoose.model('MaterialPricelist', materialPricelistSchema)

export default MaterialPricelist
