import mongoose from 'mongoose'

const stockMovementSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  movementNumber: {
    type: String,
    required: true
  },
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },
  movementType: {
    type: String,
    enum: ['receipt', 'issue', 'transfer', 'adjustment', 'adjustment_in', 'adjustment_out', 'return'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  warehouse: String, // Primary warehouse for non-transfer movements
  fromWarehouse: String,
  toWarehouse: String,
  reference: {
    type: String,
    enum: ['purchase_order', 'grn', 'project', 'sales_order', 'manual', 'return', 'cycle_count'],
    default: 'manual'
  },
  referenceType: {
    type: String,
    enum: ['PurchaseOrder', 'GoodsReceipt', 'Project', 'SalesOrder', 'CycleCount', 'Manual'],
    default: 'Manual'
  },
  referenceId: mongoose.Schema.Types.ObjectId,
  referenceNumber: String,
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  reason: String,
  notes: String,
  remarks: String, // Alias for notes, used by cycle count
  unitPrice: {
    type: Number,
    default: 0
  },
  totalValue: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'cancelled'],
    default: 'completed'
  }
}, { timestamps: true })

stockMovementSchema.index({ company: 1, createdAt: -1 })
stockMovementSchema.index({ company: 1, material: 1 })
stockMovementSchema.index({ company: 1, movementType: 1 })

stockMovementSchema.pre('save', async function(next) {
  if (!this.movementNumber) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const yy = String(date.getFullYear()).slice(-2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    this.movementNumber = `SM-${yy}${mm}-${String(count + 1).padStart(4, '0')}`
  }
  this.totalValue = this.quantity * this.unitPrice
  next()
})

const StockMovement = mongoose.model('StockMovement', stockMovementSchema)
export default StockMovement
