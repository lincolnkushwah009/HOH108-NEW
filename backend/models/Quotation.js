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
  description: { type: String, required: true },
  itemCode: String,
  category: String,
  unit: {
    type: String,
    enum: ['sqft', 'sqm', 'rft', 'nos', 'kg', 'ltr', 'set', 'lot', 'ls', 'hours', 'days'],
    default: 'nos'
  },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  specifications: String,
  remarks: String,
  isOptional: { type: Boolean, default: false }
})

const quotationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  quotationNumber: {
    type: String
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
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
  quotationDate: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  revision: {
    type: Number,
    default: 1
  },
  parentQuotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  lineItems: [lineItemSchema],
  subTotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'negotiating', 'accepted', 'rejected', 'expired', 'converted', 'cancelled'],
    default: 'draft'
  },
  sentAt: Date,
  viewedAt: Date,
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  convertedToOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },
  negotiationHistory: [{
    proposedAmount: Number,
    proposedBy: String, // 'customer' or 'company'
    proposedAt: Date,
    notes: String,
    status: {
      type: String,
      enum: ['proposed', 'accepted', 'rejected', 'countered']
    }
  }],
  termsAndConditions: String,
  paymentTerms: String,
  deliveryTerms: String,
  warranty: String,
  notes: String,
  internalNotes: String,
  attachments: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  activities: [activitySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Generate quotation number and calculate totals
quotationSchema.pre('save', async function(next) {
  if (!this.quotationNumber) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    this.quotationNumber = `QT-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate totals
  let subTotal = 0
  let totalDiscount = 0
  let totalTax = 0

  this.lineItems.forEach((item, index) => {
    item.slNo = index + 1
    const lineTotal = item.quantity * item.unitPrice
    const discountAmount = (lineTotal * item.discount) / 100
    const taxableAmount = lineTotal - discountAmount
    item.taxAmount = (taxableAmount * item.taxRate) / 100
    item.totalAmount = taxableAmount + item.taxAmount

    // Only include non-optional items in totals
    if (!item.isOptional) {
      subTotal += lineTotal
      totalDiscount += discountAmount
      totalTax += item.taxAmount
    }
  })

  this.subTotal = subTotal
  this.totalDiscount = totalDiscount
  this.totalTax = totalTax
  this.totalAmount = subTotal - totalDiscount + totalTax + (this.otherCharges || 0) + (this.roundOff || 0)

  // Check expiry
  if (this.validUntil && new Date() > this.validUntil && this.status === 'sent') {
    this.status = 'expired'
  }

  next()
})

// Create revision
quotationSchema.methods.createRevision = async function(userId, userName) {
  const QuotationModel = this.constructor
  const newQuotation = new QuotationModel({
    ...this.toObject(),
    _id: undefined,
    quotationNumber: undefined,
    revision: this.revision + 1,
    parentQuotation: this._id,
    status: 'draft',
    sentAt: undefined,
    viewedAt: undefined,
    acceptedAt: undefined,
    rejectedAt: undefined,
    activities: [{
      action: 'revision_created',
      description: `Revision ${this.revision + 1} created from ${this.quotationNumber}`,
      performedBy: userId,
      performedByName: userName
    }],
    createdBy: userId
  })

  return await newQuotation.save()
}

// Indexes
quotationSchema.index({ company: 1, quotationNumber: 1 }, { unique: true })
quotationSchema.index({ company: 1, customer: 1 })
quotationSchema.index({ company: 1, lead: 1 })
quotationSchema.index({ company: 1, project: 1 })
quotationSchema.index({ company: 1, status: 1 })
quotationSchema.index({ company: 1, quotationDate: -1 })
quotationSchema.index({ company: 1, validUntil: 1 })

const Quotation = mongoose.model('Quotation', quotationSchema)

export default Quotation
