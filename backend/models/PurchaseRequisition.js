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
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  },
  description: { type: String, required: true },
  itemCode: String,
  category: String,
  specifications: String,
  unit: {
    type: String,
    enum: ['sqft', 'sqm', 'rft', 'nos', 'kg', 'ltr', 'set', 'lot', 'sheets', 'rolls', 'boxes', 'pcs'],
    default: 'nos'
  },
  quantity: { type: Number, required: true, default: 0 },
  estimatedUnitPrice: { type: Number, default: 0 },
  estimatedTotal: { type: Number, default: 0 },
  requiredDate: Date,
  suggestedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  remarks: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'ordered'],
    default: 'pending'
  }
})

const purchaseRequisitionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  prNumber: {
    type: String
    // Auto-generated in pre-save hook
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  targetVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  department: String,
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  requiredDate: Date,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  purpose: {
    type: String,
    required: true
  },
  lineItems: [lineItemSchema],
  estimatedTotal: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'pending_approval', 'approved', 'partially_approved', 'rejected', 'converted', 'cancelled'],
    default: 'draft'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalRemarks: String,
  rejectionReason: String,
  linkedPurchaseOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  }],
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

// Generate PR number and calculate totals
purchaseRequisitionSchema.pre('save', async function(next) {
  if (!this.prNumber) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    this.prNumber = `PR-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate totals
  let total = 0
  this.lineItems.forEach((item, index) => {
    item.slNo = index + 1
    item.estimatedTotal = item.quantity * item.estimatedUnitPrice
    total += item.estimatedTotal
  })
  this.estimatedTotal = total

  next()
})

// Indexes
purchaseRequisitionSchema.index({ company: 1, prNumber: 1 }, { unique: true })
purchaseRequisitionSchema.index({ company: 1, project: 1 })
purchaseRequisitionSchema.index({ company: 1, status: 1 })
purchaseRequisitionSchema.index({ company: 1, requestedBy: 1 })
purchaseRequisitionSchema.index({ company: 1, requestDate: -1 })

const PurchaseRequisition = mongoose.model('PurchaseRequisition', purchaseRequisitionSchema)

export default PurchaseRequisition
