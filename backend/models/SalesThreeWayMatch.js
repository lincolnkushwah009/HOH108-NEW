import mongoose from 'mongoose'

const lineMatchSchema = new mongoose.Schema({
  description: String,
  itemCode: String,
  soQty: { type: Number, default: 0 },
  dispatchedQty: { type: Number, default: 0 },
  invoicedQty: { type: Number, default: 0 },
  soUnitPrice: { type: Number, default: 0 },
  invoicedUnitPrice: { type: Number, default: 0 },
  qtyVariance: { type: Number, default: 0 },
  priceVariance: { type: Number, default: 0 },
  matchStatus: {
    type: String,
    enum: ['matched', 'qty_mismatch', 'price_mismatch', 'both_mismatch'],
    default: 'matched'
  }
})

const salesThreeWayMatchSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  matchNumber: {
    type: String,
    trim: true
  },
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true
  },
  salesDispatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesDispatch',
    required: true
  },
  customerInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerInvoice',
    required: true
  },
  overallStatus: {
    type: String,
    enum: ['pending', 'matched', 'partial_match', 'mismatch', 'exception_pending', 'exception_approved', 'exception_rejected'],
    default: 'pending'
  },
  lineMatches: [lineMatchSchema],
  tolerancePercentage: {
    type: Number,
    default: 2
  },
  totalSOAmount: { type: Number, default: 0 },
  totalDispatchedAmount: { type: Number, default: 0 },
  totalInvoicedAmount: { type: Number, default: 0 },
  exceptionReason: String,
  exceptionApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  exceptionApprovedAt: Date,
  exceptionRemarks: String,
  executedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  executedAt: { type: Date, default: Date.now }
}, { timestamps: true })

salesThreeWayMatchSchema.index({ company: 1, matchNumber: 1 }, { unique: true, sparse: true })
salesThreeWayMatchSchema.index({ company: 1, salesOrder: 1 })
salesThreeWayMatchSchema.index({ company: 1, customerInvoice: 1 })
salesThreeWayMatchSchema.index({ company: 1, overallStatus: 1 })

const SalesThreeWayMatch = mongoose.model('SalesThreeWayMatch', salesThreeWayMatchSchema)
export default SalesThreeWayMatch
