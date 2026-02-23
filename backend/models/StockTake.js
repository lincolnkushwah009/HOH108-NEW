import mongoose from 'mongoose'

/**
 * StockTake - Cycle count and inventory verification
 *
 * Tracks full stock takes, cycle counts, and spot checks with
 * variance analysis and approval workflows for adjustments.
 */

const stockTakeEntrySchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  stock: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock'
  },
  systemQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  physicalQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  variance: {
    type: Number,
    default: 0
  },
  varianceValue: {
    type: Number,
    default: 0
  },
  reason: {
    type: String
  },
  adjustmentApproved: {
    type: Boolean,
    default: false
  }
}, { _id: true })

const stockTakeSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  stockTakeId: {
    type: String,
    unique: true
  },

  type: {
    type: String,
    enum: ['full', 'cycle_count', 'spot_check'],
    required: true,
    default: 'cycle_count'
  },

  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'approved'],
    default: 'planned'
  },

  scheduledDate: {
    type: Date,
    required: true
  },

  completedDate: {
    type: Date
  },

  warehouse: {
    type: String,
    required: true,
    default: 'Main Warehouse'
  },

  entries: [stockTakeEntrySchema],

  totalVarianceValue: {
    type: Number,
    default: 0
  },

  conductedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes
stockTakeSchema.index({ company: 1, status: 1 })
stockTakeSchema.index({ company: 1, warehouse: 1 })
stockTakeSchema.index({ company: 1, type: 1 })
stockTakeSchema.index({ company: 1, scheduledDate: -1 })
stockTakeSchema.index({ conductedBy: 1 })

// Generate stockTakeId and calculate variances before save
stockTakeSchema.pre('save', async function(next) {
  if (this.isNew && !this.stockTakeId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.stockTakeId = `ST-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate entry variances and total variance value
  let totalVarianceValue = 0
  if (this.entries && this.entries.length > 0) {
    this.entries.forEach(entry => {
      entry.variance = entry.physicalQuantity - entry.systemQuantity
      totalVarianceValue += entry.varianceValue || 0
    })
  }
  this.totalVarianceValue = totalVarianceValue

  next()
})

const StockTake = mongoose.model('StockTake', stockTakeSchema)

export default StockTake
