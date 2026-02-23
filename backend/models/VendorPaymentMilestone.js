import mongoose from 'mongoose'

const milestonePaymentSchema = new mongoose.Schema({
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

const vendorPaymentMilestoneSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  milestoneId: {
    type: String,
    trim: true
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
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['advance', 'material_delivery', 'installation_complete', 'retention_release', 'final_payment', 'custom'],
    default: 'custom'
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  },
  gst: {
    type: Number,
    default: 0
  },
  totalWithGst: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  dueDate: Date,
  status: {
    type: String,
    enum: ['pending', 'partially_paid', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  payments: [milestonePaymentSchema],
  triggerCondition: {
    type: String,
    enum: ['manual', 'grn_received', 'date_based'],
    default: 'manual'
  },
  order: {
    type: Number,
    default: 0
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true })

vendorPaymentMilestoneSchema.index({ company: 1, milestoneId: 1 }, { unique: true, sparse: true })
vendorPaymentMilestoneSchema.index({ company: 1, vendor: 1 })
vendorPaymentMilestoneSchema.index({ company: 1, purchaseOrder: 1 })
vendorPaymentMilestoneSchema.index({ company: 1, project: 1 })
vendorPaymentMilestoneSchema.index({ company: 1, status: 1 })

vendorPaymentMilestoneSchema.pre('save', async function(next) {
  if (!this.milestoneId) {
    try {
      const Company = mongoose.model('Company')
      const company = await Company.findById(this.company)
      if (company) {
        this.milestoneId = await company.generateId('vendorPaymentMilestone')
      }
    } catch (err) {
      // fallback
    }
  }

  this.totalWithGst = this.amount + this.gst
  this.paidAmount = this.payments.reduce((sum, p) => sum + p.amount, 0)
  this.pendingAmount = this.totalWithGst - this.paidAmount

  if (this.paidAmount >= this.totalWithGst) {
    this.status = 'paid'
  } else if (this.paidAmount > 0) {
    this.status = 'partially_paid'
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue'
  }

  next()
})

const VendorPaymentMilestone = mongoose.model('VendorPaymentMilestone', vendorPaymentMilestoneSchema)
export default VendorPaymentMilestone
