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
  hsnCode: String,
  unit: String,
  quantity: { type: Number, required: true, default: 0 },
  unitPrice: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  poReference: String,
  grnReference: String,
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
  bankName: String,
  chequeNumber: String,
  remarks: String,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recordedAt: { type: Date, default: Date.now }
})

const vendorInvoiceSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  invoiceNumber: {
    type: String,
    required: true
  },
  vendorInvoiceNumber: {
    type: String,
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  },
  goodsReceipt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoodsReceipt'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  receivedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: Date,

  // ===========================================
  // SOX Control: PTP-004 Three-Way Match Fields
  // ===========================================
  threeWayMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ThreeWayMatch'
  },
  threeWayMatchStatus: {
    type: String,
    enum: ['pending', 'matched', 'partial_match', 'mismatch', 'exception_pending', 'exception_approved', 'exception_rejected', 'not_applicable'],
    default: 'pending'
  },
  // SOX Critical: Payment blocked until 3-way match verified or exception approved
  paymentBlocked: {
    type: Boolean,
    default: true // BLOCKED by default for SOX compliance
  },
  paymentBlockedReason: String,
  paymentBlockedAt: Date,
  paymentUnblockedAt: Date,
  paymentUnblockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Flag to indicate if this invoice requires 3-way matching
  requiresThreeWayMatch: {
    type: Boolean,
    default: true
  },
  // For service invoices that don't need GRN (2-way match only)
  matchType: {
    type: String,
    enum: ['three_way', 'two_way', 'none'],
    default: 'three_way'
  },

  // ===========================================
  // SOX Control: PTP-006 Duplicate Detection
  // ===========================================
  duplicateCheckStatus: {
    type: String,
    enum: ['pending', 'passed', 'potential_duplicate', 'confirmed_not_duplicate'],
    default: 'pending'
  },
  potentialDuplicates: [{
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorInvoice' },
    matchReason: String, // 'same_invoice_number', 'same_amount_date', 'similar_details'
    similarity: Number // Percentage similarity score
  }],
  duplicateConfirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  duplicateConfirmedAt: Date,
  duplicateRemarks: String,
  lineItems: [lineItemSchema],
  subTotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalCGST: { type: Number, default: 0 },
  totalSGST: { type: Number, default: 0 },
  totalIGST: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  tdsAmount: { type: Number, default: 0 },
  tdsRate: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  invoiceTotal: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'pending_verification', 'verified', 'pending_approval', 'approved', 'partially_paid', 'paid', 'disputed', 'cancelled'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid', 'overdue'],
    default: 'unpaid'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalRemarks: String,
  payments: [paymentSchema],
  attachments: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Uploaded invoice file
  uploadedFile: {
    originalName: String,
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: Date,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  dataEntrySource: {
    type: String,
    enum: ['manual', 'uploaded', 'email'],
    default: 'manual'
  },
  internalNotes: String,
  disputeReason: String,
  activities: [activitySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // ===========================================
  // SOX Control: Fiscal Period (GL-006)
  // ===========================================
  fiscalPeriod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FiscalPeriod'
  },
  fiscalYear: Number,
  fiscalMonth: Number
}, {
  timestamps: true
})

// Generate invoice number and calculate totals
vendorInvoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    this.invoiceNumber = `VINV-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }

  // ===========================================
  // SOX Control: PTP-006 Duplicate Invoice Detection
  // ===========================================
  if (this.isNew || this.isModified('vendorInvoiceNumber') || this.isModified('vendor')) {
    // Check for duplicate invoice from same vendor
    const existingInvoice = await this.constructor.findOne({
      company: this.company,
      vendor: this.vendor,
      vendorInvoiceNumber: this.vendorInvoiceNumber,
      _id: { $ne: this._id }
    })

    if (existingInvoice) {
      const error = new Error(`Duplicate invoice detected: Invoice number ${this.vendorInvoiceNumber} already exists for this vendor`)
      error.code = 'DUPLICATE_INVOICE'
      error.duplicateId = existingInvoice._id
      return next(error)
    }

    // Check for potential duplicates (same vendor, same amount, same date)
    const potentialDuplicates = await this.constructor.find({
      company: this.company,
      vendor: this.vendor,
      _id: { $ne: this._id },
      $or: [
        // Same invoice total and date within 7 days
        {
          invoiceTotal: this.invoiceTotal,
          invoiceDate: {
            $gte: new Date(this.invoiceDate.getTime() - 7 * 24 * 60 * 60 * 1000),
            $lte: new Date(this.invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      ]
    }).limit(5)

    if (potentialDuplicates.length > 0) {
      this.duplicateCheckStatus = 'potential_duplicate'
      this.potentialDuplicates = potentialDuplicates.map(dup => ({
        invoice: dup._id,
        matchReason: 'same_amount_date',
        similarity: 80
      }))
    } else {
      this.duplicateCheckStatus = 'passed'
    }
  }

  // ===========================================
  // SOX Control: Payment Blocking Logic
  // ===========================================
  // Ensure payment is blocked for new invoices requiring 3-way match
  if (this.isNew && this.requiresThreeWayMatch && this.matchType !== 'none') {
    this.paymentBlocked = true
    this.paymentBlockedReason = 'Pending three-way match verification'
    this.paymentBlockedAt = new Date()
  }

  // Set fiscal period fields
  if (this.invoiceDate) {
    this.fiscalYear = this.invoiceDate.getFullYear()
    this.fiscalMonth = this.invoiceDate.getMonth() + 1
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

    // Split GST into CGST and SGST (for intra-state) or IGST (for inter-state)
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

  // Calculate TDS if applicable
  const tdsAmount = (subTotal - totalDiscount) * (this.tdsRate / 100)
  this.tdsAmount = tdsAmount

  // Calculate invoice total
  this.invoiceTotal = subTotal - totalDiscount + this.totalTax - tdsAmount + (this.otherCharges || 0) + (this.roundOff || 0)

  // Calculate paid and balance amounts
  this.paidAmount = this.payments.reduce((sum, p) => sum + p.amount, 0)
  this.balanceAmount = this.invoiceTotal - this.paidAmount

  // Update payment status
  if (this.paidAmount >= this.invoiceTotal) {
    this.paymentStatus = 'paid'
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'partially_paid'
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.paymentStatus = 'overdue'
  } else {
    this.paymentStatus = 'unpaid'
  }

  next()
})

/**
 * SOX Control: PTP-004 - Check if payment can be recorded
 * Returns { canPay: boolean, reason: string }
 */
vendorInvoiceSchema.methods.canRecordPayment = function() {
  // Check if payment is blocked
  if (this.paymentBlocked) {
    return {
      canPay: false,
      reason: this.paymentBlockedReason || 'Payment is blocked pending three-way match verification'
    }
  }

  // Check invoice status
  if (!['approved', 'partially_paid'].includes(this.status)) {
    return {
      canPay: false,
      reason: 'Invoice must be approved before recording payments'
    }
  }

  // Check three-way match status
  if (this.requiresThreeWayMatch && this.matchType !== 'none') {
    if (!['matched', 'exception_approved', 'not_applicable'].includes(this.threeWayMatchStatus)) {
      return {
        canPay: false,
        reason: `Three-way match status is ${this.threeWayMatchStatus}. Payment requires matched status or approved exception.`
      }
    }
  }

  // Check for potential duplicates that haven't been confirmed
  if (this.duplicateCheckStatus === 'potential_duplicate') {
    return {
      canPay: false,
      reason: 'Potential duplicate invoice detected. Please confirm this is not a duplicate before proceeding.'
    }
  }

  return { canPay: true, reason: null }
}

/**
 * Unblock payment (called after 3-way match success or exception approval)
 */
vendorInvoiceSchema.methods.unblockPayment = function(userId, reason) {
  this.paymentBlocked = false
  this.paymentBlockedReason = null
  this.paymentUnblockedAt = new Date()
  this.paymentUnblockedBy = userId
  this.activities.push({
    action: 'payment_unblocked',
    description: reason || 'Payment unblocked after verification',
    performedBy: userId
  })
  return this
}

// Indexes
vendorInvoiceSchema.index({ company: 1, invoiceNumber: 1 }, { unique: true })
vendorInvoiceSchema.index({ company: 1, vendor: 1 })
vendorInvoiceSchema.index({ company: 1, status: 1 })
vendorInvoiceSchema.index({ company: 1, paymentStatus: 1 })
vendorInvoiceSchema.index({ company: 1, invoiceDate: -1 })
vendorInvoiceSchema.index({ company: 1, dueDate: 1 })
// SOX-related indexes
vendorInvoiceSchema.index({ company: 1, threeWayMatchStatus: 1 })
vendorInvoiceSchema.index({ company: 1, paymentBlocked: 1 })
vendorInvoiceSchema.index({ company: 1, vendor: 1, vendorInvoiceNumber: 1 }) // For duplicate detection
vendorInvoiceSchema.index({ company: 1, fiscalYear: 1, fiscalMonth: 1 })

const VendorInvoice = mongoose.model('VendorInvoice', vendorInvoiceSchema)

export default VendorInvoice
