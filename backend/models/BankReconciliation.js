import mongoose from 'mongoose'

const statementEntrySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  description: { type: String, required: true },
  reference: String,
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  matchStatus: {
    type: String,
    enum: ['unmatched', 'auto_matched', 'manual_matched', 'excluded'],
    default: 'unmatched'
  },
  matchedPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  matchedAt: Date,
  matchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
})

const bankReconciliationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  reconciliationId: {
    type: String,
    unique: true,
    sparse: true
  },

  bankAccount: {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    ifscCode: String
  },

  statementPeriod: {
    from: { type: Date, required: true },
    to: { type: Date, required: true }
  },

  status: {
    type: String,
    enum: ['draft', 'in_progress', 'completed', 'approved'],
    default: 'draft'
  },

  statementEntries: [statementEntrySchema],

  openingBalance: {
    type: Number,
    default: 0
  },

  closingBalance: {
    type: Number,
    default: 0
  },

  systemBalance: {
    type: Number,
    default: 0
  },

  reconciledBalance: {
    type: Number,
    default: 0
  },

  unreconciledItems: {
    type: Number,
    default: 0
  },

  importedAt: {
    type: Date
  },

  importedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Pre-save: auto-generate reconciliationId
bankReconciliationSchema.pre('save', async function(next) {
  if (!this.reconciliationId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.reconciliationId = `RECON-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Indexes
bankReconciliationSchema.index({ company: 1, status: 1 })
bankReconciliationSchema.index({ company: 1, createdAt: -1 })
// reconciliationId already has unique:true which creates an index
bankReconciliationSchema.index({ company: 1, 'bankAccount.accountNumber': 1 })
bankReconciliationSchema.index({ 'statementPeriod.from': 1, 'statementPeriod.to': 1 })

const BankReconciliation = mongoose.model('BankReconciliation', bankReconciliationSchema)

export default BankReconciliation
