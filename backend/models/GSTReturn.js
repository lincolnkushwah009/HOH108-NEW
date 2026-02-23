import mongoose from 'mongoose'

const invoiceDetailSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true },
  invoiceDate: { type: Date, required: true },
  invoiceValue: { type: Number, default: 0 },
  taxableValue: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 }
}, { _id: false })

const b2bSchema = new mongoose.Schema({
  customerGSTIN: { type: String, required: true },
  invoices: [invoiceDetailSchema]
})

const b2cSchema = new mongoose.Schema({
  stateCode: { type: String, required: true },
  invoices: [invoiceDetailSchema]
})

const creditDebitNoteDetailSchema = new mongoose.Schema({
  noteNumber: { type: String, required: true },
  noteDate: Date,
  noteType: String,
  originalInvoice: String,
  amount: { type: Number, default: 0 }
}, { _id: false })

const hsnSummarySchema = new mongoose.Schema({
  hsnCode: { type: String, required: true },
  description: String,
  quantity: { type: Number, default: 0 },
  taxableValue: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 }
}, { _id: false })

const gstReturnSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  returnType: {
    type: String,
    enum: ['GSTR1', 'GSTR3B', 'GSTR2A'],
    required: [true, 'Return type is required']
  },

  period: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  },

  status: {
    type: String,
    enum: ['draft', 'prepared', 'reviewed', 'filed'],
    default: 'draft'
  },

  b2b: [b2bSchema],

  b2c: [b2cSchema],

  creditDebitNotes: [creditDebitNoteDetailSchema],

  hsnSummary: [hsnSummarySchema],

  totalTaxableValue: {
    type: Number,
    default: 0
  },

  totalCGST: {
    type: Number,
    default: 0
  },

  totalSGST: {
    type: Number,
    default: 0
  },

  totalIGST: {
    type: Number,
    default: 0
  },

  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
gstReturnSchema.index({ company: 1, returnType: 1, 'period.year': 1, 'period.month': 1 })
gstReturnSchema.index({ company: 1, status: 1 })
gstReturnSchema.index({ company: 1, createdAt: -1 })

const GSTReturn = mongoose.model('GSTReturn', gstReturnSchema)

export default GSTReturn
