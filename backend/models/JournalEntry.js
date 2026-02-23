import mongoose from 'mongoose'

/**
 * Journal Entry Model
 * SOX Controls:
 * - GL-002: Journal Entry Authorization (Maker-Checker-Approver)
 * - GL-003: Standard vs Non-Standard JE Review
 * - GL-006: Period-End Close Procedures (Period validation)
 *
 * Implements complete audit trail and segregation of duties.
 */

const journalLineSchema = new mongoose.Schema({
  lineNumber: {
    type: Number,
    required: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccounts',
    required: [true, 'Account is required']
  },
  accountCode: String,
  accountName: String,
  description: {
    type: String,
    maxlength: [500, 'Line description cannot exceed 500 characters']
  },
  debit: {
    type: Number,
    default: 0,
    min: [0, 'Debit amount cannot be negative']
  },
  credit: {
    type: Number,
    default: 0,
    min: [0, 'Credit amount cannot be negative']
  },
  // Reference to source document (invoice, payment, etc.)
  reference: {
    documentType: String, // 'vendor_invoice', 'customer_invoice', 'payment', 'receipt'
    documentId: mongoose.Schema.Types.ObjectId,
    documentNumber: String
  },
  // Cost center for expense allocation
  costCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CostCenter'
  },
  // Project reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  // Tax details if applicable
  taxDetails: {
    taxType: String, // 'gst', 'tds'
    taxRate: Number,
    taxAmount: Number
  }
})

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now }
})

const journalEntrySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Auto-generated Entry ID: JE-YYMM-XXXXX
  entryId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Entry date (posting date)
  entryDate: {
    type: Date,
    required: [true, 'Entry date is required']
  },

  // Fiscal period reference
  fiscalPeriod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FiscalPeriod'
  },
  fiscalYear: Number,
  fiscalMonth: Number,

  // Entry type - SOX Control: GL-003
  entryType: {
    type: String,
    enum: [
      'standard',      // Regular business transactions
      'adjusting',     // Period-end adjustments
      'closing',       // Year-end closing entries
      'reversing',     // Reversals of previous entries
      'correction',    // Error corrections
      'reclassification', // Account reclassifications
      'system'         // System-generated entries
    ],
    default: 'standard'
  },

  // Entry description/narration
  description: {
    type: String,
    required: [true, 'Entry description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },

  // Reference number (external document)
  reference: String,

  // Journal lines
  lines: {
    type: [journalLineSchema],
    validate: {
      validator: function(lines) {
        return lines && lines.length >= 2
      },
      message: 'Journal entry must have at least 2 lines'
    }
  },

  // Totals
  totalDebit: {
    type: Number,
    default: 0
  },
  totalCredit: {
    type: Number,
    default: 0
  },

  // Currency (for multi-currency support)
  currency: {
    type: String,
    default: 'INR'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },

  // ===========================================
  // SOX Control: GL-002 Maker-Checker-Approver Workflow
  // ===========================================
  status: {
    type: String,
    enum: [
      'draft',           // Being created
      'pending_review',  // Submitted for review (checker)
      'reviewed',        // Reviewed, pending approval
      'pending_approval', // Pending final approval
      'posted',          // Approved and posted to GL
      'rejected',        // Rejected at any stage
      'reversed',        // Entry has been reversed
      'void'             // Voided (keeps record but nullified)
    ],
    default: 'draft'
  },

  // Maker (Creator)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Checker (Reviewer) - SOX Control: First level review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewRemarks: String,

  // Approver - SOX Control: Final approval
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalRemarks: String,

  // Rejection tracking
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,

  // Posted tracking
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  postedAt: Date,

  // ===========================================
  // SOX Control: GL-003 Non-Standard Entry Flags
  // ===========================================
  isNonStandard: {
    type: Boolean,
    default: false
  },
  nonStandardReason: String,
  // Non-standard flags
  flags: {
    isManualEntry: { type: Boolean, default: true },
    isAboveThreshold: { type: Boolean, default: false },
    isRoundAmount: { type: Boolean, default: false },
    isUnusualAccount: { type: Boolean, default: false },
    isNearPeriodEnd: { type: Boolean, default: false },
    isWeekendEntry: { type: Boolean, default: false }
  },

  // Amount threshold for additional review (company-specific)
  reviewThreshold: {
    type: Number,
    default: 100000 // Default 1 lakh
  },

  // ===========================================
  // Reversal tracking
  // ===========================================
  reversalOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry'
  },
  reversalReason: String,

  // Source document tracking (for auto-generated entries)
  sourceDocument: {
    type: { type: String }, // 'vendor_invoice', 'customer_invoice', 'payment', 'payroll'
    id: mongoose.Schema.Types.ObjectId,
    number: String
  },

  // Attachments
  attachments: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Complete audit trail
  activities: [activitySchema]
}, {
  timestamps: true
})

// Pre-save validation and auto-calculations
journalEntrySchema.pre('save', async function(next) {
  // Generate entry ID
  if (!this.entryId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    this.entryId = `JE-${year}${month}-${String(count + 1).padStart(5, '0')}`
  }

  // Set fiscal period info
  if (this.entryDate) {
    this.fiscalYear = this.entryDate.getFullYear()
    this.fiscalMonth = this.entryDate.getMonth() + 1
  }

  // Calculate totals and assign line numbers
  let totalDebit = 0
  let totalCredit = 0

  this.lines.forEach((line, index) => {
    line.lineNumber = index + 1
    totalDebit += line.debit || 0
    totalCredit += line.credit || 0
  })

  this.totalDebit = Math.round(totalDebit * 100) / 100
  this.totalCredit = Math.round(totalCredit * 100) / 100

  // SOX Control: Validate debits equal credits
  if (Math.abs(this.totalDebit - this.totalCredit) > 0.01) {
    const error = new Error(`Journal entry is out of balance. Debits (${this.totalDebit}) must equal Credits (${this.totalCredit})`)
    error.code = 'UNBALANCED_ENTRY'
    return next(error)
  }

  // SOX Control: GL-003 - Flag non-standard entries
  this.flags.isRoundAmount = this.totalDebit % 1000 === 0 && this.totalDebit >= 10000
  this.flags.isAboveThreshold = this.totalDebit >= this.reviewThreshold
  this.flags.isWeekendEntry = [0, 6].includes(new Date(this.entryDate).getDay())

  // Check if near period end (last 3 days of month)
  const entryDay = new Date(this.entryDate).getDate()
  const lastDayOfMonth = new Date(this.entryDate.getFullYear(), this.entryDate.getMonth() + 1, 0).getDate()
  this.flags.isNearPeriodEnd = (lastDayOfMonth - entryDay) <= 3

  // Mark as non-standard if any flag is true (except manual entry)
  this.isNonStandard = this.flags.isAboveThreshold || this.flags.isRoundAmount ||
                       this.flags.isUnusualAccount || this.flags.isNearPeriodEnd ||
                       this.flags.isWeekendEntry

  next()
})

/**
 * Submit for review (Maker → Checker)
 */
journalEntrySchema.methods.submitForReview = function(userId, userName) {
  if (this.status !== 'draft') {
    throw new Error('Only draft entries can be submitted for review')
  }

  // SOX Control: Maker cannot be the checker
  if (this.createdBy.toString() === userId.toString()) {
    throw new Error('SOX Compliance: Entry creator cannot submit for their own review')
  }

  this.status = 'pending_review'
  this.activities.push({
    action: 'submitted_for_review',
    description: 'Entry submitted for review',
    performedBy: userId,
    performedByName: userName
  })

  return this
}

/**
 * Review entry (Checker)
 */
journalEntrySchema.methods.review = function(userId, userName, remarks) {
  if (this.status !== 'pending_review') {
    throw new Error('Entry is not pending review')
  }

  // SOX Control: Creator cannot review their own entry
  if (this.createdBy.toString() === userId.toString()) {
    throw new Error('SOX Compliance: Entry creator cannot review their own entry')
  }

  this.status = 'pending_approval'
  this.reviewedBy = userId
  this.reviewedAt = new Date()
  this.reviewRemarks = remarks

  this.activities.push({
    action: 'reviewed',
    description: remarks || 'Entry reviewed',
    performedBy: userId,
    performedByName: userName
  })

  return this
}

/**
 * Approve and post entry (Approver)
 */
journalEntrySchema.methods.approve = async function(userId, userName, remarks) {
  if (!['pending_approval', 'reviewed'].includes(this.status)) {
    throw new Error('Entry is not pending approval')
  }

  // SOX Control: Creator and Reviewer cannot approve
  if (this.createdBy.toString() === userId.toString()) {
    throw new Error('SOX Compliance: Entry creator cannot approve their own entry')
  }
  if (this.reviewedBy && this.reviewedBy.toString() === userId.toString()) {
    throw new Error('SOX Compliance: Entry reviewer cannot also approve the entry')
  }

  // Check fiscal period
  const FiscalPeriod = mongoose.model('FiscalPeriod')
  const period = await FiscalPeriod.findByDate(this.company, this.entryDate)

  if (!period) {
    throw new Error('No fiscal period found for the entry date')
  }

  const canPost = period.canPost(this.entryType)
  if (!canPost.allowed) {
    throw new Error(canPost.reason)
  }

  this.status = 'posted'
  this.approvedBy = userId
  this.approvedAt = new Date()
  this.approvalRemarks = remarks
  this.postedBy = userId
  this.postedAt = new Date()
  this.fiscalPeriod = period._id

  this.activities.push({
    action: 'approved_and_posted',
    description: remarks || 'Entry approved and posted to General Ledger',
    performedBy: userId,
    performedByName: userName
  })

  // Update account balances
  const ChartOfAccounts = mongoose.model('ChartOfAccounts')
  for (const line of this.lines) {
    const account = await ChartOfAccounts.findById(line.account)
    if (account) {
      await account.updateBalance(line.debit, line.credit)
    }
  }

  // Update period statistics
  period.statistics.totalJournalEntries += 1
  period.statistics.totalDebitAmount += this.totalDebit
  period.statistics.totalCreditAmount += this.totalCredit
  if (this.entryType === 'standard') period.statistics.standardEntries += 1
  else if (this.entryType === 'adjusting') period.statistics.adjustingEntries += 1
  else if (this.entryType === 'reversing') period.statistics.reversingEntries += 1
  await period.save()

  return this
}

/**
 * Reject entry
 */
journalEntrySchema.methods.reject = function(userId, userName, reason) {
  if (!['pending_review', 'pending_approval', 'reviewed'].includes(this.status)) {
    throw new Error('Entry cannot be rejected in current status')
  }

  this.status = 'rejected'
  this.rejectedBy = userId
  this.rejectedAt = new Date()
  this.rejectionReason = reason

  this.activities.push({
    action: 'rejected',
    description: `Entry rejected: ${reason}`,
    performedBy: userId,
    performedByName: userName
  })

  return this
}

/**
 * Create reversal entry
 */
journalEntrySchema.methods.createReversal = async function(userId, userName, reason) {
  if (this.status !== 'posted') {
    throw new Error('Can only reverse posted entries')
  }

  if (this.reversedBy) {
    throw new Error('Entry has already been reversed')
  }

  // Create reversal entry with swapped debits/credits
  const reversalLines = this.lines.map((line, index) => ({
    lineNumber: index + 1,
    account: line.account,
    accountCode: line.accountCode,
    accountName: line.accountName,
    description: `Reversal: ${line.description || ''}`,
    debit: line.credit,  // Swap
    credit: line.debit,  // Swap
    reference: line.reference,
    costCenter: line.costCenter,
    project: line.project
  }))

  const ReversalEntry = this.constructor

  const reversal = new ReversalEntry({
    company: this.company,
    entryDate: new Date(),
    entryType: 'reversing',
    description: `Reversal of ${this.entryId}: ${reason}`,
    reference: this.entryId,
    lines: reversalLines,
    createdBy: userId,
    reversalOf: this._id,
    reversalReason: reason,
    activities: [{
      action: 'created',
      description: `Reversal entry created for ${this.entryId}`,
      performedBy: userId,
      performedByName: userName
    }]
  })

  // Mark original as reversed
  this.reversedBy = reversal._id
  this.activities.push({
    action: 'reversed',
    description: `Entry reversed: ${reason}`,
    performedBy: userId,
    performedByName: userName
  })

  await this.save()

  return reversal
}

// Static method to get entries pending review/approval
journalEntrySchema.statics.getPendingEntries = async function(companyId, userId, status) {
  const filter = {
    company: companyId,
    status: status || { $in: ['pending_review', 'pending_approval'] }
  }

  // Exclude entries created by the user (for maker-checker)
  if (userId) {
    filter.createdBy = { $ne: userId }
  }

  return this.find(filter)
    .populate('createdBy', 'name email')
    .populate('lines.account', 'accountCode accountName')
    .sort({ createdAt: -1 })
}

// Static method to generate trial balance
journalEntrySchema.statics.generateTrialBalance = async function(companyId, asOfDate) {
  const match = {
    company: mongoose.Types.ObjectId(companyId),
    status: 'posted'
  }

  if (asOfDate) {
    match.entryDate = { $lte: new Date(asOfDate) }
  }

  return this.aggregate([
    { $match: match },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.account',
        accountCode: { $first: '$lines.accountCode' },
        accountName: { $first: '$lines.accountName' },
        totalDebit: { $sum: '$lines.debit' },
        totalCredit: { $sum: '$lines.credit' }
      }
    },
    {
      $project: {
        accountCode: 1,
        accountName: 1,
        totalDebit: { $round: ['$totalDebit', 2] },
        totalCredit: { $round: ['$totalCredit', 2] },
        balance: { $round: [{ $subtract: ['$totalDebit', '$totalCredit'] }, 2] }
      }
    },
    { $sort: { accountCode: 1 } }
  ])
}

// Indexes
journalEntrySchema.index({ company: 1, entryId: 1 }, { unique: true })
journalEntrySchema.index({ company: 1, status: 1 })
journalEntrySchema.index({ company: 1, entryDate: -1 })
journalEntrySchema.index({ company: 1, fiscalPeriod: 1 })
journalEntrySchema.index({ company: 1, entryType: 1 })
journalEntrySchema.index({ company: 1, createdBy: 1 })
journalEntrySchema.index({ company: 1, isNonStandard: 1 })
journalEntrySchema.index({ 'lines.account': 1 })

const JournalEntry = mongoose.model('JournalEntry', journalEntrySchema)

export default JournalEntry
