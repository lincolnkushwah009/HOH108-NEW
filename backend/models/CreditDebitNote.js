import mongoose from 'mongoose'

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsnCode: String,
  sacCode: String,
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  taxRate: { type: Number, default: 18 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 }
})

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  performedAt: { type: Date, default: Date.now },
  details: String
}, { _id: false })

const creditDebitNoteSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  noteNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  noteType: {
    type: String,
    enum: ['credit_note', 'debit_note'],
    required: [true, 'Note type is required']
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },

  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },

  relatedInvoice: {
    type: mongoose.Schema.Types.ObjectId
  },

  invoiceType: {
    type: String,
    enum: ['customer', 'vendor']
  },

  reason: {
    type: String,
    enum: ['goods_returned', 'price_adjustment', 'quality_issue', 'short_supply', 'other'],
    required: [true, 'Reason is required']
  },

  lineItems: [lineItemSchema],

  subTotal: {
    type: Number,
    default: 0
  },

  totalTax: {
    type: Number,
    default: 0
  },

  totalAmount: {
    type: Number,
    default: 0
  },

  gstTreatment: {
    type: String,
    enum: ['intra_state', 'inter_state', 'exempt'],
    default: 'intra_state'
  },

  status: {
    type: String,
    enum: ['draft', 'approved', 'applied', 'cancelled'],
    default: 'draft'
  },

  appliedToInvoice: {
    type: mongoose.Schema.Types.ObjectId
  },

  appliedAmount: {
    type: Number,
    default: 0
  },

  activities: [activitySchema],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Pre-save: auto-generate noteNumber (CN-YYMM-XXXX or DN-YYMM-XXXX)
creditDebitNoteSchema.pre('save', async function(next) {
  if (!this.noteNumber) {
    const prefix = this.noteType === 'credit_note' ? 'CN' : 'DN'
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const count = await this.constructor.countDocuments({
      company: this.company,
      noteType: this.noteType
    })
    this.noteNumber = `${prefix}-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Indexes
creditDebitNoteSchema.index({ company: 1, noteType: 1 })
creditDebitNoteSchema.index({ company: 1, status: 1 })
creditDebitNoteSchema.index({ company: 1, customer: 1 })
creditDebitNoteSchema.index({ company: 1, vendor: 1 })
// noteNumber already has unique:true which creates an index
creditDebitNoteSchema.index({ relatedInvoice: 1 })
creditDebitNoteSchema.index({ company: 1, createdAt: -1 })

const CreditDebitNote = mongoose.model('CreditDebitNote', creditDebitNoteSchema)

export default CreditDebitNote
