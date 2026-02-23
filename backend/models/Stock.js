import mongoose from 'mongoose'

/**
 * Stock - Inventory stock tracking per material/warehouse
 */

const stockSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Material reference
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },

  // Warehouse/Location
  warehouse: {
    type: String,
    required: true,
    default: 'Main Warehouse'
  },

  location: {
    type: String,
    default: ''
  },

  // Stock quantities
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },

  reservedStock: {
    type: Number,
    default: 0,
    min: 0
  },

  // Calculated: currentStock - reservedStock
  availableStock: {
    type: Number,
    default: 0
  },

  // Stock thresholds
  reorderLevel: {
    type: Number,
    default: 10
  },

  maxStock: {
    type: Number,
    default: 1000
  },

  // Stock value (currentStock * unit price)
  stockValue: {
    type: Number,
    default: 0
  },

  // Unit price for value calculation
  unitPrice: {
    type: Number,
    default: 0
  },

  // Last movement tracking
  lastReceived: {
    date: Date,
    quantity: Number,
    reference: String
  },

  lastIssued: {
    date: Date,
    quantity: Number,
    reference: String
  },

  // Batch tracking (optional)
  batches: [{
    batchNumber: String,
    quantity: Number,
    expiryDate: Date,
    manufactureDate: Date,
    receivedDate: Date
  }],

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Compound unique index for material per warehouse
stockSchema.index({ company: 1, material: 1, warehouse: 1 }, { unique: true })
stockSchema.index({ company: 1, warehouse: 1 })
stockSchema.index({ company: 1, currentStock: 1 })

// Pre-save middleware to calculate derived fields
stockSchema.pre('save', function(next) {
  this.availableStock = Math.max(0, this.currentStock - this.reservedStock)
  this.stockValue = this.currentStock * this.unitPrice
  next()
})

// Static method to get stock status
stockSchema.statics.getStockStatus = function(stock) {
  if (stock.currentStock === 0) return 'out_of_stock'
  if (stock.currentStock <= stock.reorderLevel) return 'low_stock'
  if (stock.currentStock >= stock.maxStock * 0.9) return 'overstocked'
  return 'healthy'
}

// Static method to adjust stock
stockSchema.statics.adjustStock = async function(companyId, materialId, warehouse, adjustment, reference) {
  const stock = await this.findOneAndUpdate(
    { company: companyId, material: materialId, warehouse },
    {
      $inc: { currentStock: adjustment },
      $set: adjustment > 0
        ? { lastReceived: { date: new Date(), quantity: adjustment, reference } }
        : { lastIssued: { date: new Date(), quantity: Math.abs(adjustment), reference } }
    },
    { new: true, upsert: true }
  )

  // Recalculate derived fields
  stock.availableStock = Math.max(0, stock.currentStock - stock.reservedStock)
  stock.stockValue = stock.currentStock * stock.unitPrice
  await stock.save()

  return stock
}

// Static method to reserve stock
stockSchema.statics.reserveStock = async function(companyId, materialId, warehouse, quantity) {
  const stock = await this.findOne({ company: companyId, material: materialId, warehouse })
  if (!stock) throw new Error('Stock not found')
  if (stock.availableStock < quantity) throw new Error('Insufficient available stock')

  stock.reservedStock += quantity
  stock.availableStock = stock.currentStock - stock.reservedStock
  await stock.save()

  return stock
}

// Static method to release reservation
stockSchema.statics.releaseReservation = async function(companyId, materialId, warehouse, quantity) {
  const stock = await this.findOne({ company: companyId, material: materialId, warehouse })
  if (!stock) throw new Error('Stock not found')

  stock.reservedStock = Math.max(0, stock.reservedStock - quantity)
  stock.availableStock = stock.currentStock - stock.reservedStock
  await stock.save()

  return stock
}

const Stock = mongoose.model('Stock', stockSchema)

export default Stock
