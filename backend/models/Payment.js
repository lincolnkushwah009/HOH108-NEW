import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  createdAt: { type: Date, default: Date.now }
})

const paymentSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  paymentNumber: {
    type: String,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true
  },
  // For outgoing payments (to vendors)
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  vendorInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorInvoice'
  },
  // For incoming payments (from customers)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerInvoice'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'neft', 'rtgs', 'imps', 'cheque', 'cash', 'upi', 'card', 'dd', 'other'],
    default: 'bank_transfer'
  },
  bankAccount: {
    bankName: String,
    accountNumber: String,
    ifscCode: String
  },
  chequeDetails: {
    chequeNumber: String,
    chequeDate: Date,
    bankName: String,
    branchName: String
  },
  referenceNumber: String,
  transactionId: String,
  description: String,
  purpose: {
    type: String,
    enum: ['invoice_payment', 'advance', 'refund', 'deposit', 'expense', 'salary', 'other'],
    default: 'invoice_payment'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed'],
    default: 'pending'
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
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
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

// Generate payment number
paymentSchema.pre('validate', async function(next) {
  if (!this.paymentNumber) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const prefix = this.paymentType === 'incoming' ? 'REC' : 'PAY'
    this.paymentNumber = `${prefix}-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Static methods for stats
paymentSchema.statics.getStats = async function(companyId, dateRange = {}) {
  const match = { company: companyId }
  if (dateRange.from) match.paymentDate = { $gte: new Date(dateRange.from) }
  if (dateRange.to) match.paymentDate = { ...match.paymentDate, $lte: new Date(dateRange.to) }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$paymentType',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ])

  return {
    incoming: stats.find(s => s._id === 'incoming') || { total: 0, count: 0 },
    outgoing: stats.find(s => s._id === 'outgoing') || { total: 0, count: 0 }
  }
}

// Indexes
paymentSchema.index({ company: 1, paymentNumber: 1 }, { unique: true })
paymentSchema.index({ company: 1, paymentType: 1 })
paymentSchema.index({ company: 1, vendor: 1 })
paymentSchema.index({ company: 1, customer: 1 })
paymentSchema.index({ company: 1, status: 1 })
paymentSchema.index({ company: 1, paymentDate: -1 })

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment
