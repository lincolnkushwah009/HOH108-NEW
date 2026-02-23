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
  sacCode: String, // Service Accounting Code
  hsnCode: String,
  unit: String,
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  remarks: String
})

const paymentSchema = new mongoose.Schema({
  paymentDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cheque', 'cash', 'upi', 'card', 'other'],
    default: 'bank_transfer'
  },
  referenceNumber: String,
  remarks: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedAt: { type: Date, default: Date.now }
})

const customerInvoiceSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  invoiceNumber: {
    type: String
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },
  invoiceType: {
    type: String,
    enum: ['proforma', 'tax_invoice', 'credit_note', 'debit_note'],
    default: 'tax_invoice'
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: Date,
  billingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
    gstNumber: String
  },
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  lineItems: [lineItemSchema],
  subTotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalCGST: { type: Number, default: 0 },
  totalSGST: { type: Number, default: 0 },
  totalIGST: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  shippingCharges: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  invoiceTotal: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },

  // ===========================================
  // SOX Control: OTC-007 AR Aging Fields
  // ===========================================
  daysOverdue: { type: Number, default: 0 },
  agingBucket: {
    type: String,
    enum: ['current', '1-30', '31-60', '61-90', '90+'],
    default: 'current'
  },
  firstOverdueDate: Date,
  lastReminderSent: Date,
  reminderCount: { type: Number, default: 0 },

  // AR-side 3-way match (SO → Dispatch → Invoice)
  salesDispatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesDispatch'
  },
  salesThreeWayMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesThreeWayMatch'
  },
  salesMatchStatus: {
    type: String,
    enum: ['pending', 'matched', 'partial_match', 'mismatch', 'exception_pending', 'exception_approved', 'not_applicable'],
    default: 'not_applicable'
  },

  // Credit note application tracking
  creditNotesApplied: [{
    creditNote: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerInvoice' },
    amount: Number,
    appliedAt: { type: Date, default: Date.now },
    appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  totalCreditApplied: { type: Number, default: 0 },

  // Approval gate
  approvalStatus: {
    type: String,
    enum: ['not_required', 'pending', 'approved', 'rejected'],
    default: 'not_required'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedByName: String,
  approvedAt: Date,
  rejectionReason: String,

  // Dunning tracking
  dunningLevel: { type: Number, default: 0 }, // 0=none, 1=7d, 2=15d, 3=30d, 4=45d, 5=60d
  lastDunningAt: Date,
  dunningHistory: [{
    level: Number,
    sentAt: { type: Date, default: Date.now },
    method: { type: String, enum: ['notification', 'email', 'both'], default: 'notification' }
  }],

  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled', 'disputed'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid', 'overdue'],
    default: 'unpaid'
  },
  sentAt: Date,
  viewedAt: Date,
  payments: [paymentSchema],
  termsAndConditions: String,
  notes: String,
  internalNotes: String,
  attachments: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  activities: [activitySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Generate invoice number and calculate totals
customerInvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate line item totals
  let subTotal = 0
  let totalDiscount = 0
  let totalCGST = 0
  let totalSGST = 0
  let totalIGST = 0

  this.lineItems.forEach((item, index) => {
    item.slNo = index + 1
    const lineTotal = item.quantity * item.unitPrice
    const discountAmount = (lineTotal * item.discount) / 100
    const taxableAmount = lineTotal - discountAmount

    if (item.igst > 0) {
      item.cgst = 0
      item.sgst = 0
      item.taxAmount = item.igst
      totalIGST += item.igst
    } else {
      item.cgst = (taxableAmount * item.taxRate / 2) / 100
      item.sgst = (taxableAmount * item.taxRate / 2) / 100
      item.igst = 0
      item.taxAmount = item.cgst + item.sgst
      totalCGST += item.cgst
      totalSGST += item.sgst
    }

    item.totalAmount = taxableAmount + item.taxAmount
    subTotal += lineTotal
    totalDiscount += discountAmount
  })

  this.subTotal = subTotal
  this.totalDiscount = totalDiscount
  this.totalCGST = totalCGST
  this.totalSGST = totalSGST
  this.totalIGST = totalIGST
  this.totalTax = totalCGST + totalSGST + totalIGST
  this.invoiceTotal = subTotal - totalDiscount + this.totalTax + (this.shippingCharges || 0) + (this.otherCharges || 0) + (this.roundOff || 0)

  // Calculate paid and balance amounts
  this.paidAmount = this.payments.reduce((sum, p) => sum + p.amount, 0)
  this.balanceAmount = this.invoiceTotal - this.paidAmount

  // Update payment status
  if (this.paidAmount >= this.invoiceTotal) {
    this.paymentStatus = 'paid'
    if (this.status !== 'cancelled') this.status = 'paid'
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partially_paid'
    if (this.status !== 'cancelled') this.status = 'partially_paid'
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.paymentStatus = 'overdue'
    if (this.status !== 'cancelled') this.status = 'overdue'
  }

  // ===========================================
  // SOX Control: OTC-007 AR Aging Calculation
  // ===========================================
  if (this.dueDate && this.balanceAmount > 0) {
    const today = new Date()
    const dueDate = new Date(this.dueDate)
    this.daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)))

    // Set first overdue date if not already set and invoice is overdue
    if (this.daysOverdue > 0 && !this.firstOverdueDate) {
      this.firstOverdueDate = dueDate
    }

    // Calculate aging bucket
    if (this.daysOverdue === 0) {
      this.agingBucket = 'current'
    } else if (this.daysOverdue <= 30) {
      this.agingBucket = '1-30'
    } else if (this.daysOverdue <= 60) {
      this.agingBucket = '31-60'
    } else if (this.daysOverdue <= 90) {
      this.agingBucket = '61-90'
    } else {
      this.agingBucket = '90+'
    }
  } else if (this.balanceAmount <= 0) {
    // Reset aging when paid
    this.daysOverdue = 0
    this.agingBucket = 'current'
  }

  next()
})

// Indexes
customerInvoiceSchema.index({ company: 1, invoiceNumber: 1 }, { unique: true })
customerInvoiceSchema.index({ company: 1, customer: 1 })
customerInvoiceSchema.index({ company: 1, project: 1 })
customerInvoiceSchema.index({ company: 1, status: 1 })
customerInvoiceSchema.index({ company: 1, paymentStatus: 1 })
customerInvoiceSchema.index({ company: 1, invoiceDate: -1 })
customerInvoiceSchema.index({ company: 1, dueDate: 1 })
// SOX OTC-007: AR Aging indexes
customerInvoiceSchema.index({ company: 1, agingBucket: 1 })
customerInvoiceSchema.index({ company: 1, daysOverdue: 1 })
customerInvoiceSchema.index({ company: 1, customer: 1, agingBucket: 1 })

const CustomerInvoice = mongoose.model('CustomerInvoice', customerInvoiceSchema)

export default CustomerInvoice
