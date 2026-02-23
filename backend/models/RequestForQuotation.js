import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  createdAt: { type: Date, default: Date.now }
})

const lineItemSchema = new mongoose.Schema({
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  },
  description: { type: String, required: true },
  itemCode: String,
  unit: {
    type: String,
    enum: ['sqft', 'sqm', 'rft', 'nos', 'kg', 'ltr', 'set', 'lot', 'sheets', 'rolls', 'boxes', 'pcs'],
    default: 'nos'
  },
  quantity: { type: Number, required: true },
  specifications: String,
  requiredDate: Date
})

// Vendor quotation response schema
const vendorQuotationSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  quotedItems: [{
    lineItemIndex: Number,
    unitPrice: Number,
    totalPrice: Number,
    deliveryDays: Number,
    remarks: String
  }],
  totalQuotedAmount: { type: Number, default: 0 },
  validUntil: Date,
  paymentTerms: String,
  deliveryTerms: String,
  notes: String,
  submittedAt: Date,
  attachments: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
})

const requestForQuotationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  rfqNumber: {
    type: String
    // Auto-generated in pre-save hook
  },
  purchaseRequisition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseRequisition'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  lineItems: [lineItemSchema],

  // Vendors invited to quote
  invitedVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  }],

  // Vendor quotation responses
  vendorQuotations: [vendorQuotationSchema],

  // Deadline for vendors to submit quotations
  quotationDeadline: {
    type: Date,
    required: true
  },
  requiredDeliveryDate: Date,

  status: {
    type: String,
    enum: ['draft', 'sent', 'in_progress', 'closed', 'awarded', 'cancelled'],
    default: 'draft'
  },

  // Selected vendor after comparison
  awardedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  awardedAt: Date,
  awardRemarks: String,

  // Linked Purchase Order after award
  linkedPurchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  activities: [activitySchema],

  internalNotes: String
}, {
  timestamps: true
})

// Generate RFQ number
requestForQuotationSchema.pre('save', async function(next) {
  if (!this.rfqNumber) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    this.rfqNumber = `RFQ-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Indexes
requestForQuotationSchema.index({ company: 1, rfqNumber: 1 }, { unique: true })
requestForQuotationSchema.index({ company: 1, status: 1 })
requestForQuotationSchema.index({ company: 1, purchaseRequisition: 1 })
requestForQuotationSchema.index({ 'invitedVendors': 1 })
requestForQuotationSchema.index({ quotationDeadline: 1 })

const RequestForQuotation = mongoose.model('RequestForQuotation', requestForQuotationSchema)

export default RequestForQuotation
