import mongoose from 'mongoose'

/**
 * Three-Way Match Model
 * SOX Control: PTP-004 - Three-Way Match
 *
 * Implements the critical control of matching Purchase Orders, Goods Receipts,
 * and Vendor Invoices before payment authorization. Blocks payments until
 * match is verified or exception is approved.
 */

const lineMatchSchema = new mongoose.Schema({
  slNo: Number,
  description: String,
  itemCode: String,
  unit: String,

  // Purchase Order quantities
  poQuantity: { type: Number, default: 0 },
  poUnitPrice: { type: Number, default: 0 },
  poAmount: { type: Number, default: 0 },

  // Goods Receipt quantities
  grnQuantity: { type: Number, default: 0 },
  grnAcceptedQuantity: { type: Number, default: 0 },
  grnRejectedQuantity: { type: Number, default: 0 },

  // Invoice quantities
  invoiceQuantity: { type: Number, default: 0 },
  invoiceUnitPrice: { type: Number, default: 0 },
  invoiceAmount: { type: Number, default: 0 },

  // Variance calculations
  quantityVariance: { type: Number, default: 0 }, // (invoiceQty - grnAcceptedQty) / grnAcceptedQty * 100
  priceVariance: { type: Number, default: 0 },    // (invoicePrice - poPrice) / poPrice * 100
  amountVariance: { type: Number, default: 0 },   // (invoiceAmt - poAmt)

  // Match status for this line
  quantityMatchStatus: {
    type: String,
    enum: ['matched', 'within_tolerance', 'mismatch', 'pending'],
    default: 'pending'
  },
  priceMatchStatus: {
    type: String,
    enum: ['matched', 'within_tolerance', 'mismatch', 'pending'],
    default: 'pending'
  },
  lineMatchStatus: {
    type: String,
    enum: ['matched', 'partial_match', 'mismatch', 'pending'],
    default: 'pending'
  },
  remarks: String
})

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  createdAt: { type: Date, default: Date.now }
})

const threeWayMatchSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Auto-generated Match ID: TWM-YYMM-XXXXX
  matchId: {
    type: String,
    unique: true,
    sparse: true
  },

  // The three documents being matched
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
    required: true
  },
  goodsReceipt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoodsReceipt'
  },
  vendorInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorInvoice',
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

  // Match type
  matchType: {
    type: String,
    enum: ['two_way', 'three_way'], // two_way = PO-Invoice only (for services), three_way = PO-GRN-Invoice
    default: 'three_way'
  },

  // Summary totals
  totals: {
    poTotal: { type: Number, default: 0 },
    grnTotal: { type: Number, default: 0 },   // Based on accepted quantities
    invoiceTotal: { type: Number, default: 0 },

    poQuantity: { type: Number, default: 0 },
    grnQuantity: { type: Number, default: 0 },
    invoiceQuantity: { type: Number, default: 0 }
  },

  // Line-level matching details
  lineMatches: [lineMatchSchema],

  // Overall matching results
  quantityMatch: {
    status: {
      type: String,
      enum: ['matched', 'within_tolerance', 'mismatch', 'pending'],
      default: 'pending'
    },
    totalPoQty: { type: Number, default: 0 },
    totalGrnQty: { type: Number, default: 0 },
    totalInvoiceQty: { type: Number, default: 0 },
    variancePercent: { type: Number, default: 0 }
  },

  priceMatch: {
    status: {
      type: String,
      enum: ['matched', 'within_tolerance', 'mismatch', 'pending'],
      default: 'pending'
    },
    poAmount: { type: Number, default: 0 },
    invoiceAmount: { type: Number, default: 0 },
    variancePercent: { type: Number, default: 0 },
    varianceAmount: { type: Number, default: 0 }
  },

  // Configurable tolerance settings (can override company defaults)
  tolerances: {
    quantityPercent: { type: Number, default: 5 },   // Default 5% quantity tolerance
    pricePercent: { type: Number, default: 2 },      // Default 2% price tolerance
    amountThreshold: { type: Number, default: 1000 } // Absolute amount threshold
  },

  // Overall status
  overallStatus: {
    type: String,
    enum: ['pending', 'matched', 'partial_match', 'mismatch', 'exception_pending', 'exception_approved', 'exception_rejected'],
    default: 'pending'
  },

  // Payment blocking control - SOX Critical
  paymentBlocked: {
    type: Boolean,
    default: true // BLOCKED by default until matched or exception approved
  },
  paymentBlockedReason: String,

  // Exception handling workflow
  exception: {
    isRequired: { type: Boolean, default: false },
    reason: String,
    category: {
      type: String,
      enum: ['quantity_variance', 'price_variance', 'both', 'missing_grn', 'other']
    },
    justification: String,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    approvalRemarks: String,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String
  },

  // Audit trail
  matchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  matchedAt: Date,

  // Auto-match tracking
  isAutoMatched: { type: Boolean, default: false },

  activities: [activitySchema],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Generate Match ID
threeWayMatchSchema.pre('save', async function(next) {
  if (!this.matchId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    this.matchId = `TWM-${year}${month}-${String(count + 1).padStart(5, '0')}`
  }

  // Update payment blocked status based on overall status
  if (['matched', 'exception_approved'].includes(this.overallStatus)) {
    this.paymentBlocked = false
    this.paymentBlockedReason = null
  } else {
    this.paymentBlocked = true
    if (this.overallStatus === 'mismatch') {
      this.paymentBlockedReason = 'Three-way match failed - requires exception approval'
    } else if (this.overallStatus === 'partial_match') {
      this.paymentBlockedReason = 'Partial match detected - review required'
    } else if (this.overallStatus === 'exception_pending') {
      this.paymentBlockedReason = 'Exception approval pending'
    } else if (this.overallStatus === 'exception_rejected') {
      this.paymentBlockedReason = 'Exception request was rejected'
    } else {
      this.paymentBlockedReason = 'Matching not completed'
    }
  }

  next()
})

/**
 * Perform three-way matching
 * Compares PO, GRN, and Invoice line items
 */
threeWayMatchSchema.methods.performMatch = function(poData, grnData, invoiceData) {
  const lineMatches = []
  let totalPoQty = 0, totalGrnQty = 0, totalInvoiceQty = 0
  let totalPoAmount = 0, totalInvoiceAmount = 0
  let hasQuantityMismatch = false
  let hasPriceMismatch = false

  // Create a map of PO line items by itemCode or description
  const poItems = new Map()
  poData.lineItems?.forEach(item => {
    const key = item.itemCode || item.description
    poItems.set(key, item)
  })

  // Create a map of GRN line items
  const grnItems = new Map()
  grnData?.lineItems?.forEach(item => {
    const key = item.itemCode || item.description
    grnItems.set(key, item)
  })

  // Match invoice lines against PO and GRN
  invoiceData.lineItems?.forEach((invItem, index) => {
    const key = invItem.itemCode || invItem.description
    const poItem = poItems.get(key)
    const grnItem = grnItems.get(key)

    const lineMatch = {
      slNo: index + 1,
      description: invItem.description,
      itemCode: invItem.itemCode,
      unit: invItem.unit,

      // PO data
      poQuantity: poItem?.quantity || 0,
      poUnitPrice: poItem?.unitPrice || 0,
      poAmount: (poItem?.quantity || 0) * (poItem?.unitPrice || 0),

      // GRN data
      grnQuantity: grnItem?.receivedQuantity || 0,
      grnAcceptedQuantity: grnItem?.acceptedQuantity || grnItem?.receivedQuantity || 0,
      grnRejectedQuantity: grnItem?.rejectedQuantity || 0,

      // Invoice data
      invoiceQuantity: invItem.quantity || 0,
      invoiceUnitPrice: invItem.unitPrice || 0,
      invoiceAmount: (invItem.quantity || 0) * (invItem.unitPrice || 0)
    }

    // Calculate variances
    const compareQty = this.matchType === 'three_way' ? lineMatch.grnAcceptedQuantity : lineMatch.poQuantity
    if (compareQty > 0) {
      lineMatch.quantityVariance = ((lineMatch.invoiceQuantity - compareQty) / compareQty) * 100
    }

    if (lineMatch.poUnitPrice > 0) {
      lineMatch.priceVariance = ((lineMatch.invoiceUnitPrice - lineMatch.poUnitPrice) / lineMatch.poUnitPrice) * 100
    }

    lineMatch.amountVariance = lineMatch.invoiceAmount - lineMatch.poAmount

    // Determine match status
    // Quantity match
    if (Math.abs(lineMatch.quantityVariance) === 0) {
      lineMatch.quantityMatchStatus = 'matched'
    } else if (Math.abs(lineMatch.quantityVariance) <= this.tolerances.quantityPercent) {
      lineMatch.quantityMatchStatus = 'within_tolerance'
    } else {
      lineMatch.quantityMatchStatus = 'mismatch'
      hasQuantityMismatch = true
    }

    // Price match
    if (Math.abs(lineMatch.priceVariance) === 0) {
      lineMatch.priceMatchStatus = 'matched'
    } else if (Math.abs(lineMatch.priceVariance) <= this.tolerances.pricePercent) {
      lineMatch.priceMatchStatus = 'within_tolerance'
    } else {
      lineMatch.priceMatchStatus = 'mismatch'
      hasPriceMismatch = true
    }

    // Overall line status
    if (lineMatch.quantityMatchStatus === 'matched' && lineMatch.priceMatchStatus === 'matched') {
      lineMatch.lineMatchStatus = 'matched'
    } else if (lineMatch.quantityMatchStatus === 'mismatch' || lineMatch.priceMatchStatus === 'mismatch') {
      lineMatch.lineMatchStatus = 'mismatch'
    } else {
      lineMatch.lineMatchStatus = 'partial_match'
    }

    lineMatches.push(lineMatch)

    // Accumulate totals
    totalPoQty += lineMatch.poQuantity
    totalGrnQty += lineMatch.grnAcceptedQuantity
    totalInvoiceQty += lineMatch.invoiceQuantity
    totalPoAmount += lineMatch.poAmount
    totalInvoiceAmount += lineMatch.invoiceAmount
  })

  // Update line matches
  this.lineMatches = lineMatches

  // Update totals
  this.totals = {
    poTotal: poData.poTotal || totalPoAmount,
    grnTotal: grnData?.totalAcceptedQuantity || totalGrnQty,
    invoiceTotal: invoiceData.invoiceTotal || totalInvoiceAmount,
    poQuantity: totalPoQty,
    grnQuantity: totalGrnQty,
    invoiceQuantity: totalInvoiceQty
  }

  // Update overall quantity match
  const compareQtyTotal = this.matchType === 'three_way' ? totalGrnQty : totalPoQty
  const qtyVariance = compareQtyTotal > 0 ? ((totalInvoiceQty - compareQtyTotal) / compareQtyTotal) * 100 : 0
  this.quantityMatch = {
    status: hasQuantityMismatch ? 'mismatch' : (Math.abs(qtyVariance) <= this.tolerances.quantityPercent ? 'matched' : 'within_tolerance'),
    totalPoQty,
    totalGrnQty,
    totalInvoiceQty,
    variancePercent: qtyVariance
  }

  // Update overall price match
  const priceVariance = totalPoAmount > 0 ? ((totalInvoiceAmount - totalPoAmount) / totalPoAmount) * 100 : 0
  const amountVariance = totalInvoiceAmount - totalPoAmount
  this.priceMatch = {
    status: hasPriceMismatch ? 'mismatch' : (Math.abs(priceVariance) <= this.tolerances.pricePercent ? 'matched' : 'within_tolerance'),
    poAmount: totalPoAmount,
    invoiceAmount: totalInvoiceAmount,
    variancePercent: priceVariance,
    varianceAmount: amountVariance
  }

  // Determine overall status
  if (this.quantityMatch.status === 'matched' && this.priceMatch.status === 'matched') {
    this.overallStatus = 'matched'
    this.paymentBlocked = false
  } else if (this.quantityMatch.status === 'mismatch' || this.priceMatch.status === 'mismatch') {
    this.overallStatus = 'mismatch'
    this.paymentBlocked = true
    this.exception.isRequired = true
    this.exception.category = hasQuantityMismatch && hasPriceMismatch ? 'both' :
                             (hasQuantityMismatch ? 'quantity_variance' : 'price_variance')
  } else {
    this.overallStatus = 'partial_match'
    this.paymentBlocked = true
  }

  return this
}

/**
 * Request exception approval
 */
threeWayMatchSchema.methods.requestException = function(userId, userName, justification) {
  this.exception.justification = justification
  this.exception.requestedBy = userId
  this.exception.requestedAt = new Date()
  this.overallStatus = 'exception_pending'
  this.paymentBlocked = true
  this.paymentBlockedReason = 'Exception approval pending'

  this.activities.push({
    action: 'exception_requested',
    description: `Exception requested: ${justification}`,
    performedBy: userId,
    performedByName: userName
  })

  return this
}

/**
 * Approve exception - allows payment despite mismatch
 */
threeWayMatchSchema.methods.approveException = function(userId, userName, remarks) {
  this.exception.approvedBy = userId
  this.exception.approvedAt = new Date()
  this.exception.approvalRemarks = remarks
  this.overallStatus = 'exception_approved'
  this.paymentBlocked = false
  this.paymentBlockedReason = null

  this.activities.push({
    action: 'exception_approved',
    description: `Exception approved: ${remarks}`,
    performedBy: userId,
    performedByName: userName
  })

  return this
}

/**
 * Reject exception - payment remains blocked
 */
threeWayMatchSchema.methods.rejectException = function(userId, userName, reason) {
  this.exception.rejectedBy = userId
  this.exception.rejectedAt = new Date()
  this.exception.rejectionReason = reason
  this.overallStatus = 'exception_rejected'
  this.paymentBlocked = true
  this.paymentBlockedReason = 'Exception request was rejected'

  this.activities.push({
    action: 'exception_rejected',
    description: `Exception rejected: ${reason}`,
    performedBy: userId,
    performedByName: userName
  })

  return this
}

// Static method to find unmatched invoices
threeWayMatchSchema.statics.findUnmatchedInvoices = async function(companyId) {
  const VendorInvoice = mongoose.model('VendorInvoice')

  // Find invoices that don't have a matching record or have failed matches
  const matchedInvoiceIds = await this.distinct('vendorInvoice', {
    company: companyId,
    overallStatus: { $in: ['matched', 'exception_approved'] }
  })

  return VendorInvoice.find({
    company: companyId,
    _id: { $nin: matchedInvoiceIds },
    purchaseOrder: { $exists: true, $ne: null },
    status: { $in: ['pending_verification', 'verified', 'pending_approval', 'approved'] }
  })
}

// Static method to get variance report
threeWayMatchSchema.statics.getVarianceReport = async function(companyId, startDate, endDate) {
  const matchCriteria = { company: companyId }

  if (startDate || endDate) {
    matchCriteria.createdAt = {}
    if (startDate) matchCriteria.createdAt.$gte = new Date(startDate)
    if (endDate) matchCriteria.createdAt.$lte = new Date(endDate)
  }

  return this.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: '$overallStatus',
        count: { $sum: 1 },
        totalInvoiceAmount: { $sum: '$totals.invoiceTotal' },
        totalPoAmount: { $sum: '$totals.poTotal' },
        totalVariance: { $sum: '$priceMatch.varianceAmount' },
        avgQuantityVariance: { $avg: '$quantityMatch.variancePercent' },
        avgPriceVariance: { $avg: '$priceMatch.variancePercent' }
      }
    },
    { $sort: { _id: 1 } }
  ])
}

// Indexes
threeWayMatchSchema.index({ company: 1, matchId: 1 }, { unique: true })
threeWayMatchSchema.index({ company: 1, vendorInvoice: 1 })
threeWayMatchSchema.index({ company: 1, purchaseOrder: 1 })
threeWayMatchSchema.index({ company: 1, overallStatus: 1 })
threeWayMatchSchema.index({ company: 1, paymentBlocked: 1 })
threeWayMatchSchema.index({ company: 1, vendor: 1 })
threeWayMatchSchema.index({ company: 1, createdAt: -1 })

const ThreeWayMatch = mongoose.model('ThreeWayMatch', threeWayMatchSchema)

export default ThreeWayMatch
