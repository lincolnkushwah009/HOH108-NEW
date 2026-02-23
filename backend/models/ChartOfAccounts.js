import mongoose from 'mongoose'

/**
 * Chart of Accounts Model
 * SOX Control: GL-001 - Chart of Accounts Maintenance
 *
 * Implements hierarchical account structure with proper controls
 * for account creation, modification, and deactivation.
 */

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
})

const chartOfAccountsSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Account code (e.g., 1000, 1100, 1110)
  accountCode: {
    type: String,
    required: [true, 'Account code is required'],
    trim: true
  },

  // Account name
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: [200, 'Account name cannot exceed 200 characters']
  },

  // Account type - follows standard accounting classification
  accountType: {
    type: String,
    enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
    required: [true, 'Account type is required']
  },

  // Sub-type for more detailed classification
  accountSubType: {
    type: String,
    enum: [
      // Assets
      'current_asset', 'fixed_asset', 'other_asset', 'bank', 'cash', 'accounts_receivable', 'inventory', 'prepaid_expense',
      // Liabilities
      'current_liability', 'long_term_liability', 'accounts_payable', 'accrued_expense', 'deferred_revenue',
      // Equity
      'owner_equity', 'retained_earnings', 'common_stock',
      // Revenue
      'operating_revenue', 'other_revenue', 'sales', 'service_revenue',
      // Expense
      'operating_expense', 'cost_of_goods_sold', 'administrative_expense', 'selling_expense', 'other_expense'
    ]
  },

  // Normal balance side
  normalBalance: {
    type: String,
    enum: ['debit', 'credit'],
    required: true
  },

  // Parent account for hierarchy
  parentAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChartOfAccounts'
  },

  // Level in hierarchy (1 = top level)
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },

  // Is this a control account (has sub-accounts)
  isControlAccount: {
    type: Boolean,
    default: false
  },

  // Is this account available for posting (only leaf accounts can have postings)
  isPostable: {
    type: Boolean,
    default: true
  },

  // Indian accounting group (Tally-compatible classification)
  indianGroup: {
    type: String,
    enum: [
      'bank_accounts', 'cash_in_hand', 'deposits', 'loans_advances_asset',
      'stock_in_hand', 'sundry_debtors', 'prepaid_expenses',
      'fixed_assets', 'accumulated_depreciation', 'investments', 'misc_expenses_asset',
      'capital_account', 'reserves_surplus',
      'duties_taxes', 'provisions', 'sundry_creditors', 'retention_money',
      'advance_from_customers', 'loans_liability',
      'branch_divisions', 'suspense_account', 'profit_loss_account',
      'direct_expenses', 'indirect_expenses', 'purchase_accounts',
      'direct_incomes', 'indirect_incomes', 'sales_accounts',
      'none'
    ],
    default: 'none'
  },

  // Entity-level ledger code (e.g., IP-1000, IP-2230)
  ledgerCode: {
    type: String,
    trim: true
  },

  // System-seeded account (cannot be deleted by users)
  isSystemAccount: {
    type: Boolean,
    default: false
  },

  // Account description
  description: String,

  // Current balance tracking
  balance: {
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    net: { type: Number, default: 0 } // Calculated based on normal balance
  },

  // Year-to-date balance
  ytdBalance: {
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    net: { type: Number, default: 0 }
  },

  // Opening balance for the fiscal year
  openingBalance: {
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    asOfDate: Date
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // SOX Control: GL-001 - Account creation requires CFO/Finance approval
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

  // GST/Tax related flags (for Indian accounting)
  gstApplicable: {
    type: Boolean,
    default: false
  },
  gstCategory: {
    type: String,
    enum: ['input_gst', 'output_gst', 'igst', 'cgst', 'sgst', 'none'],
    default: 'none'
  },

  // TDS applicability
  tdsApplicable: {
    type: Boolean,
    default: false
  },
  tdsSection: String, // e.g., '194C', '194J'

  // Cost center linkage
  costCenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CostCenter'
  },

  // Budget linkage
  budgetCategory: String,

  // Audit trail
  activities: [activitySchema],

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Pre-save hook
chartOfAccountsSchema.pre('save', async function(next) {
  // Set normal balance based on account type
  if (this.isNew || this.isModified('accountType')) {
    const debitNormalTypes = ['asset', 'expense']
    this.normalBalance = debitNormalTypes.includes(this.accountType) ? 'debit' : 'credit'
  }

  // Calculate level based on parent
  if (this.parentAccount) {
    const parent = await this.constructor.findById(this.parentAccount)
    if (parent) {
      this.level = parent.level + 1
      // Mark parent as control account
      if (!parent.isControlAccount) {
        parent.isControlAccount = true
        parent.isPostable = false // Control accounts cannot be posted to directly
        await parent.save()
      }
    }
  }

  // Calculate net balance
  if (this.normalBalance === 'debit') {
    this.balance.net = this.balance.debit - this.balance.credit
    this.ytdBalance.net = this.ytdBalance.debit - this.ytdBalance.credit
    this.openingBalance.net = this.openingBalance.debit - this.openingBalance.credit
  } else {
    this.balance.net = this.balance.credit - this.balance.debit
    this.ytdBalance.net = this.ytdBalance.credit - this.ytdBalance.debit
    this.openingBalance.net = this.openingBalance.credit - this.openingBalance.debit
  }

  next()
})

/**
 * Update account balance
 */
chartOfAccountsSchema.methods.updateBalance = async function(debitAmount, creditAmount) {
  this.balance.debit += debitAmount
  this.balance.credit += creditAmount

  // Calculate net based on normal balance
  if (this.normalBalance === 'debit') {
    this.balance.net = this.balance.debit - this.balance.credit
  } else {
    this.balance.net = this.balance.credit - this.balance.debit
  }

  // Also update parent accounts recursively
  if (this.parentAccount) {
    const parent = await this.constructor.findById(this.parentAccount)
    if (parent) {
      await parent.updateBalance(debitAmount, creditAmount)
    }
  }

  return this.save()
}

/**
 * Get all child accounts
 */
chartOfAccountsSchema.methods.getChildren = async function() {
  return this.constructor.find({
    company: this.company,
    parentAccount: this._id,
    isActive: true
  }).sort('accountCode')
}

/**
 * Get full account path (hierarchy)
 */
chartOfAccountsSchema.methods.getAccountPath = async function() {
  const path = [this.accountName]
  let current = this

  while (current.parentAccount) {
    const parent = await this.constructor.findById(current.parentAccount)
    if (parent) {
      path.unshift(parent.accountName)
      current = parent
    } else {
      break
    }
  }

  return path.join(' > ')
}

// Static method to get account tree
chartOfAccountsSchema.statics.getAccountTree = async function(companyId, accountType = null) {
  const filter = {
    company: companyId,
    isActive: true,
    parentAccount: null // Get root accounts
  }

  if (accountType) {
    filter.accountType = accountType
  }

  const rootAccounts = await this.find(filter).sort('accountCode')

  const buildTree = async (accounts) => {
    const result = []
    for (const account of accounts) {
      const children = await this.find({
        company: companyId,
        parentAccount: account._id,
        isActive: true
      }).sort('accountCode')

      result.push({
        ...account.toObject(),
        children: children.length > 0 ? await buildTree(children) : []
      })
    }
    return result
  }

  return buildTree(rootAccounts)
}

// Static method to get trial balance accounts
chartOfAccountsSchema.statics.getTrialBalanceAccounts = async function(companyId) {
  return this.find({
    company: companyId,
    isActive: true,
    isPostable: true,
    approvalStatus: 'approved',
    $or: [
      { 'balance.debit': { $ne: 0 } },
      { 'balance.credit': { $ne: 0 } }
    ]
  })
  .select('accountCode accountName accountType normalBalance balance')
  .sort('accountCode')
}

// Indexes
chartOfAccountsSchema.index({ company: 1, accountCode: 1 }, { unique: true })
chartOfAccountsSchema.index({ company: 1, accountType: 1 })
chartOfAccountsSchema.index({ company: 1, parentAccount: 1 })
chartOfAccountsSchema.index({ company: 1, isActive: 1, isPostable: 1 })
chartOfAccountsSchema.index({ company: 1, approvalStatus: 1 })
chartOfAccountsSchema.index({ company: 1, ledgerCode: 1 })
chartOfAccountsSchema.index({ company: 1, indianGroup: 1 })

const ChartOfAccounts = mongoose.model('ChartOfAccounts', chartOfAccountsSchema)

export default ChartOfAccounts
