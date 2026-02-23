import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  createdAt: { type: Date, default: Date.now }
})

const lineItemSchema = new mongoose.Schema({
  slNo: Number,
  poLineItem: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, required: true },
  itemCode: String,
  unit: String,
  orderedQuantity: { type: Number, default: 0 },
  previouslyReceived: { type: Number, default: 0 },
  receivedQuantity: { type: Number, required: true, default: 0 },
  acceptedQuantity: { type: Number, default: 0 },
  rejectedQuantity: { type: Number, default: 0 },
  pendingQuantity: { type: Number, default: 0 },
  rejectionReason: String,
  qualityStatus: {
    type: String,
    enum: ['pending_inspection', 'passed', 'failed', 'partially_passed'],
    default: 'pending_inspection'
  },
  storageLocation: String,
  batchNumber: String,
  remarks: String
})

const goodsReceiptSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  grnNumber: {
    type: String
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  receiptDate: {
    type: Date,
    default: Date.now
  },
  deliveryNoteNumber: String,
  deliveryNoteDate: Date,
  vehicleNumber: String,
  driverName: String,
  driverContact: String,
  lineItems: [lineItemSchema],
  totalReceivedQuantity: { type: Number, default: 0 },
  totalAcceptedQuantity: { type: Number, default: 0 },
  totalRejectedQuantity: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'received', 'inspection_pending', 'inspection_completed', 'partially_accepted', 'accepted', 'rejected', 'cancelled'],
    default: 'draft'
  },
  qualityInspection: {
    inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    inspectedAt: Date,
    overallStatus: {
      type: String,
      enum: ['pending', 'passed', 'failed', 'partially_passed']
    },
    remarks: String
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  storageLocation: String,
  attachments: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  internalNotes: String,
  activities: [activitySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Generate GRN number and calculate totals
goodsReceiptSchema.pre('save', async function(next) {
  if (!this.grnNumber) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    this.grnNumber = `GRN-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate totals
  let totalReceived = 0
  let totalAccepted = 0
  let totalRejected = 0

  this.lineItems.forEach((item, index) => {
    item.slNo = index + 1
    item.acceptedQuantity = item.receivedQuantity - item.rejectedQuantity
    item.pendingQuantity = item.orderedQuantity - item.previouslyReceived - item.receivedQuantity

    totalReceived += item.receivedQuantity
    totalAccepted += item.acceptedQuantity
    totalRejected += item.rejectedQuantity
  })

  this.totalReceivedQuantity = totalReceived
  this.totalAcceptedQuantity = totalAccepted
  this.totalRejectedQuantity = totalRejected

  next()
})

// Indexes
goodsReceiptSchema.index({ company: 1, grnNumber: 1 }, { unique: true })
goodsReceiptSchema.index({ company: 1, purchaseOrder: 1 })
goodsReceiptSchema.index({ company: 1, vendor: 1 })
goodsReceiptSchema.index({ company: 1, status: 1 })
goodsReceiptSchema.index({ company: 1, receiptDate: -1 })

const GoodsReceipt = mongoose.model('GoodsReceipt', goodsReceiptSchema)

export default GoodsReceipt
