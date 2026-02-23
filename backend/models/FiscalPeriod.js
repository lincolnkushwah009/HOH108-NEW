import mongoose from 'mongoose'

/**
 * Fiscal Period Model
 * SOX Control: GL-006 - Period-End Close Procedures
 *
 * Manages fiscal periods (months/years) with proper controls
 * for opening, closing, and preventing unauthorized postings.
 */

const closingChecklistSchema = new mongoose.Schema({
  item: { type: String, required: true },
  description: String,
  isRequired: { type: Boolean, default: true },
  isCompleted: { type: Boolean, default: false },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: Date,
  remarks: String
})

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  createdAt: { type: Date, default: Date.now }
})

const fiscalPeriodSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Period identification
  fiscalYear: {
    type: Number,
    required: true
  },
  periodNumber: {
    type: Number, // 1-12 for monthly, 1-4 for quarterly
    required: true,
    min: 1,
    max: 12
  },
  periodType: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    default: 'monthly'
  },

  // Period name (e.g., "April 2024", "Q1 FY2024")
  periodName: {
    type: String,
    required: true
  },

  // Date range
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },

  // Status workflow: open → soft_close → closed → locked
  status: {
    type: String,
    enum: ['future', 'open', 'soft_close', 'closed', 'locked'],
    default: 'future'
  },

  // Status descriptions:
  // future: Not yet open for transactions
  // open: Normal operations, all transactions allowed
  // soft_close: Limited to adjusting entries, regular entries blocked
  // closed: No new entries, can be reopened by authorized users
  // locked: Permanently closed, cannot be reopened (audit finalized)

  // Period open tracking
  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  openedAt: Date,

  // Soft close tracking
  softClosedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  softClosedAt: Date,
  softCloseReason: String,

  // Period close tracking
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closedAt: Date,
  closeReason: String,

  // Lock tracking (permanent close)
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lockedAt: Date,
  lockReason: String,

  // Reopen tracking
  lastReopenedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastReopenedAt: Date,
  reopenReason: String,
  reopenCount: {
    type: Number,
    default: 0
  },

  // Period-end closing checklist
  closingChecklist: {
    type: [closingChecklistSchema],
    default: function() {
      return [
        { item: 'bank_reconciliation', description: 'Complete bank reconciliation for all accounts', isRequired: true },
        { item: 'accounts_receivable', description: 'Review and age accounts receivable', isRequired: true },
        { item: 'accounts_payable', description: 'Review and age accounts payable', isRequired: true },
        { item: 'inventory_valuation', description: 'Verify inventory valuation', isRequired: false },
        { item: 'depreciation', description: 'Record depreciation entries', isRequired: true },
        { item: 'accruals', description: 'Record all accrual entries', isRequired: true },
        { item: 'intercompany', description: 'Reconcile intercompany transactions', isRequired: false },
        { item: 'revenue_recognition', description: 'Verify revenue recognition compliance', isRequired: true },
        { item: 'expense_review', description: 'Review and approve all expenses', isRequired: true },
        { item: 'trial_balance', description: 'Review trial balance - debits equal credits', isRequired: true },
        { item: 'manager_review', description: 'Manager review and sign-off', isRequired: true },
        { item: 'audit_adjustments', description: 'Post any audit adjustments', isRequired: false }
      ]
    }
  },

  // Summary statistics
  statistics: {
    totalJournalEntries: { type: Number, default: 0 },
    totalDebitAmount: { type: Number, default: 0 },
    totalCreditAmount: { type: Number, default: 0 },
    standardEntries: { type: Number, default: 0 },
    adjustingEntries: { type: Number, default: 0 },
    reversingEntries: { type: Number, default: 0 }
  },

  // Audit trail
  activities: [activitySchema],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Generate period name
fiscalPeriodSchema.pre('save', function(next) {
  if (!this.periodName || this.isModified('fiscalYear') || this.isModified('periodNumber')) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December']

    if (this.periodType === 'monthly') {
      this.periodName = `${months[this.periodNumber - 1]} ${this.fiscalYear}`
    } else if (this.periodType === 'quarterly') {
      this.periodName = `Q${this.periodNumber} FY${this.fiscalYear}`
    } else {
      this.periodName = `FY${this.fiscalYear}`
    }
  }
  next()
})

/**
 * Check if period allows posting
 */
fiscalPeriodSchema.methods.canPost = function(entryType = 'standard') {
  if (this.status === 'open') {
    return { allowed: true }
  }

  if (this.status === 'soft_close' && ['adjusting', 'reversing'].includes(entryType)) {
    return { allowed: true }
  }

  if (['closed', 'locked', 'future'].includes(this.status)) {
    return {
      allowed: false,
      reason: `Period is ${this.status}. No postings allowed.`
    }
  }

  return {
    allowed: false,
    reason: `Period status '${this.status}' does not allow ${entryType} entries.`
  }
}

/**
 * Open the period
 */
fiscalPeriodSchema.methods.openPeriod = function(userId, userName) {
  if (this.status === 'locked') {
    throw new Error('Cannot open a locked period')
  }

  if (this.status !== 'future' && this.status !== 'closed') {
    throw new Error(`Period is already ${this.status}`)
  }

  const wasReopened = this.status === 'closed'

  this.status = 'open'

  if (wasReopened) {
    this.lastReopenedBy = userId
    this.lastReopenedAt = new Date()
    this.reopenCount += 1
  } else {
    this.openedBy = userId
    this.openedAt = new Date()
  }

  this.activities.push({
    action: wasReopened ? 'period_reopened' : 'period_opened',
    description: wasReopened ? 'Period reopened for transactions' : 'Period opened for transactions',
    performedBy: userId,
    performedByName: userName
  })

  return this
}

/**
 * Soft close the period (allow only adjusting entries)
 */
fiscalPeriodSchema.methods.softClosePeriod = function(userId, userName, reason) {
  if (this.status !== 'open') {
    throw new Error('Can only soft-close an open period')
  }

  this.status = 'soft_close'
  this.softClosedBy = userId
  this.softClosedAt = new Date()
  this.softCloseReason = reason

  this.activities.push({
    action: 'period_soft_closed',
    description: `Period soft-closed: ${reason || 'Preparing for period-end close'}`,
    performedBy: userId,
    performedByName: userName
  })

  return this
}

/**
 * Close the period
 */
fiscalPeriodSchema.methods.closePeriod = function(userId, userName, reason) {
  if (!['open', 'soft_close'].includes(this.status)) {
    throw new Error(`Cannot close period with status '${this.status}'`)
  }

  // Check if required checklist items are completed
  const incompleteRequired = this.closingChecklist.filter(
    item => item.isRequired && !item.isCompleted
  )

  if (incompleteRequired.length > 0) {
    const items = incompleteRequired.map(i => i.item).join(', ')
    throw new Error(`Cannot close period. Required checklist items incomplete: ${items}`)
  }

  this.status = 'closed'
  this.closedBy = userId
  this.closedAt = new Date()
  this.closeReason = reason

  this.activities.push({
    action: 'period_closed',
    description: `Period closed: ${reason || 'Period-end close completed'}`,
    performedBy: userId,
    performedByName: userName
  })

  return this
}

/**
 * Lock the period (permanent - cannot be reopened)
 */
fiscalPeriodSchema.methods.lockPeriod = function(userId, userName, reason) {
  if (this.status !== 'closed') {
    throw new Error('Can only lock a closed period')
  }

  this.status = 'locked'
  this.lockedBy = userId
  this.lockedAt = new Date()
  this.lockReason = reason

  this.activities.push({
    action: 'period_locked',
    description: `Period permanently locked: ${reason || 'Audit finalized'}`,
    performedBy: userId,
    performedByName: userName
  })

  return this
}

/**
 * Update checklist item
 */
fiscalPeriodSchema.methods.updateChecklistItem = function(itemName, completed, userId, remarks) {
  const item = this.closingChecklist.find(i => i.item === itemName)
  if (!item) {
    throw new Error(`Checklist item '${itemName}' not found`)
  }

  item.isCompleted = completed
  item.completedBy = completed ? userId : null
  item.completedAt = completed ? new Date() : null
  item.remarks = remarks

  return this
}

// Static method to find period by date
fiscalPeriodSchema.statics.findByDate = async function(companyId, date) {
  const targetDate = new Date(date)

  return this.findOne({
    company: companyId,
    startDate: { $lte: targetDate },
    endDate: { $gte: targetDate }
  })
}

// Static method to get current open period
fiscalPeriodSchema.statics.getCurrentOpenPeriod = async function(companyId) {
  return this.findOne({
    company: companyId,
    status: { $in: ['open', 'soft_close'] }
  }).sort({ startDate: -1 })
}

// Static method to generate periods for a fiscal year
fiscalPeriodSchema.statics.generatePeriodsForYear = async function(companyId, fiscalYear, startMonth = 4, createdBy) {
  const periods = []

  for (let i = 0; i < 12; i++) {
    const month = ((startMonth - 1 + i) % 12) + 1
    const year = month < startMonth ? fiscalYear + 1 : fiscalYear

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0) // Last day of month

    const period = new this({
      company: companyId,
      fiscalYear,
      periodNumber: i + 1,
      periodType: 'monthly',
      startDate,
      endDate,
      status: 'future',
      createdBy
    })

    periods.push(period)
  }

  return this.insertMany(periods)
}

// Indexes
fiscalPeriodSchema.index({ company: 1, fiscalYear: 1, periodNumber: 1 }, { unique: true })
fiscalPeriodSchema.index({ company: 1, status: 1 })
fiscalPeriodSchema.index({ company: 1, startDate: 1, endDate: 1 })

const FiscalPeriod = mongoose.model('FiscalPeriod', fiscalPeriodSchema)

export default FiscalPeriod
