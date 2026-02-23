import ChartOfAccounts from '../models/ChartOfAccounts.js'
import JournalEntry from '../models/JournalEntry.js'
import FiscalPeriod from '../models/FiscalPeriod.js'

/**
 * General Ledger Controller
 * SOX Controls:
 * - GL-001: Chart of Accounts Maintenance
 * - GL-002: Journal Entry Authorization
 * - GL-003: Standard vs Non-Standard JE Review
 * - GL-006: Period-End Close Procedures
 * - GL-010: Trial Balance Review
 */

// ============================================
// CHART OF ACCOUNTS OPERATIONS
// ============================================

/**
 * Get all accounts (tree structure)
 */
export const getAccountTree = async (req, res) => {
  try {
    const { accountType } = req.query
    const tree = await ChartOfAccounts.getAccountTree(req.activeCompany._id, accountType)

    res.json({
      success: true,
      data: tree
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Get all accounts (flat list)
 */
export const getAccounts = async (req, res) => {
  try {
    const {
      accountType,
      isActive = 'true',
      isPostable,
      search,
      page = 1,
      limit = 50
    } = req.query

    const filter = { company: req.activeCompany._id }

    if (accountType) filter.accountType = accountType
    if (isActive !== 'all') filter.isActive = isActive === 'true'
    if (isPostable !== undefined) filter.isPostable = isPostable === 'true'
    if (search) {
      filter.$or = [
        { accountCode: { $regex: search, $options: 'i' } },
        { accountName: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await ChartOfAccounts.countDocuments(filter)
    const accounts = await ChartOfAccounts.find(filter)
      .populate('parentAccount', 'accountCode accountName')
      .sort('accountCode')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: accounts,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Get single account
 */
export const getAccount = async (req, res) => {
  try {
    const account = await ChartOfAccounts.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
    .populate('parentAccount', 'accountCode accountName')
    .populate('approvedBy', 'name')
    .populate('createdBy', 'name')
    .populate('activities.performedBy', 'name')

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' })
    }

    // Get children
    const children = await account.getChildren()
    const accountPath = await account.getAccountPath()

    res.json({
      success: true,
      data: {
        ...account.toObject(),
        children,
        accountPath
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Create account - SOX Control: GL-001
 */
export const createAccount = async (req, res) => {
  try {
    const account = new ChartOfAccounts({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      approvalStatus: 'pending', // Requires approval
      activities: [{
        action: 'created',
        description: 'Account created, pending approval',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    await account.save()

    res.status(201).json({
      success: true,
      message: 'Account created and pending approval',
      data: account
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Account code already exists' })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Approve account - SOX Control: GL-001 (CFO/Finance approval)
 */
export const approveAccount = async (req, res) => {
  try {
    const { remarks } = req.body

    const account = await ChartOfAccounts.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' })
    }

    // SOX Control: Creator cannot approve
    if (account.createdBy.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'SOX Compliance: Account creator cannot approve their own account'
      })
    }

    account.approvalStatus = 'approved'
    account.approvedBy = req.user._id
    account.approvedAt = new Date()
    account.approvalRemarks = remarks

    account.activities.push({
      action: 'approved',
      description: remarks || 'Account approved for use',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await account.save()

    res.json({
      success: true,
      message: 'Account approved',
      data: account
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ============================================
// JOURNAL ENTRY OPERATIONS
// ============================================

/**
 * Get all journal entries
 */
export const getJournalEntries = async (req, res) => {
  try {
    const {
      status,
      entryType,
      fiscalPeriod,
      startDate,
      endDate,
      isNonStandard,
      search,
      page = 1,
      limit = 20
    } = req.query

    const filter = { company: req.activeCompany._id }

    if (status) filter.status = status
    if (entryType) filter.entryType = entryType
    if (fiscalPeriod) filter.fiscalPeriod = fiscalPeriod
    if (isNonStandard !== undefined) filter.isNonStandard = isNonStandard === 'true'
    if (startDate || endDate) {
      filter.entryDate = {}
      if (startDate) filter.entryDate.$gte = new Date(startDate)
      if (endDate) filter.entryDate.$lte = new Date(endDate)
    }
    if (search) {
      filter.$or = [
        { entryId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await JournalEntry.countDocuments(filter)
    const entries = await JournalEntry.find(filter)
      .populate('createdBy', 'name')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('lines.account', 'accountCode accountName')
      .sort({ entryDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get summary stats
    const stats = await JournalEntry.aggregate([
      { $match: { company: req.activeCompany._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    res.json({
      success: true,
      data: entries,
      stats,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Get single journal entry
 */
export const getJournalEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
    .populate('createdBy', 'name email')
    .populate('reviewedBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .populate('fiscalPeriod', 'periodName status')
    .populate('lines.account', 'accountCode accountName accountType')
    .populate('activities.performedBy', 'name')
    .populate('reversalOf', 'entryId description')
    .populate('reversedBy', 'entryId')

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' })
    }

    res.json({ success: true, data: entry })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Create journal entry - SOX Control: GL-002
 */
export const createJournalEntry = async (req, res) => {
  try {
    const { entryDate, entryType, description, reference, lines } = req.body

    // Validate period is open
    const period = await FiscalPeriod.findByDate(req.activeCompany._id, entryDate)
    if (!period) {
      return res.status(400).json({
        success: false,
        message: 'No fiscal period found for the entry date'
      })
    }

    const canPost = period.canPost(entryType)
    if (!canPost.allowed) {
      return res.status(400).json({
        success: false,
        message: canPost.reason,
        soxControl: 'GL-006'
      })
    }

    // Validate accounts are postable and approved
    for (const line of lines) {
      const account = await ChartOfAccounts.findById(line.account)
      if (!account) {
        return res.status(400).json({
          success: false,
          message: `Account not found: ${line.account}`
        })
      }
      if (!account.isPostable) {
        return res.status(400).json({
          success: false,
          message: `Account ${account.accountCode} is a control account and cannot be posted to directly`
        })
      }
      if (account.approvalStatus !== 'approved') {
        return res.status(400).json({
          success: false,
          message: `Account ${account.accountCode} is not approved for use`
        })
      }

      // Add account details to line
      line.accountCode = account.accountCode
      line.accountName = account.accountName
    }

    const entry = new JournalEntry({
      company: req.activeCompany._id,
      entryDate,
      entryType: entryType || 'standard',
      description,
      reference,
      lines,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'Journal entry created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    await entry.save()

    const populatedEntry = await JournalEntry.findById(entry._id)
      .populate('lines.account', 'accountCode accountName')

    res.status(201).json({
      success: true,
      data: populatedEntry
    })
  } catch (error) {
    if (error.code === 'UNBALANCED_ENTRY') {
      return res.status(400).json({
        success: false,
        message: error.message,
        soxControl: 'GL-002'
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Submit entry for review - SOX Control: GL-002 (Maker → Checker)
 */
export const submitForReview = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' })
    }

    entry.submitForReview(req.user._id, req.user.name)
    await entry.save()

    res.json({
      success: true,
      message: 'Entry submitted for review',
      data: entry
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * Review entry - SOX Control: GL-002 (Checker)
 */
export const reviewEntry = async (req, res) => {
  try {
    const { remarks } = req.body

    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' })
    }

    entry.review(req.user._id, req.user.name, remarks)
    await entry.save()

    res.json({
      success: true,
      message: 'Entry reviewed and forwarded for approval',
      data: entry
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * Approve and post entry - SOX Control: GL-002 (Approver)
 */
export const approveEntry = async (req, res) => {
  try {
    const { remarks } = req.body

    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' })
    }

    await entry.approve(req.user._id, req.user.name, remarks)
    await entry.save()

    res.json({
      success: true,
      message: 'Entry approved and posted to General Ledger',
      data: entry
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * Reject entry
 */
export const rejectEntry = async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' })
    }

    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' })
    }

    entry.reject(req.user._id, req.user.name, reason)
    await entry.save()

    res.json({
      success: true,
      message: 'Entry rejected',
      data: entry
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * Reverse entry
 */
export const reverseEntry = async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reversal reason is required' })
    }

    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Journal entry not found' })
    }

    const reversal = await entry.createReversal(req.user._id, req.user.name, reason)
    await reversal.save()

    res.json({
      success: true,
      message: 'Reversal entry created',
      data: {
        original: entry,
        reversal
      }
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * Get pending entries for review/approval
 */
export const getPendingEntries = async (req, res) => {
  try {
    const { status } = req.query

    const entries = await JournalEntry.getPendingEntries(
      req.activeCompany._id,
      req.user._id,
      status
    )

    res.json({
      success: true,
      data: entries,
      count: entries.length
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ============================================
// TRIAL BALANCE - SOX Control: GL-010
// ============================================

/**
 * Generate trial balance
 */
export const getTrialBalance = async (req, res) => {
  try {
    const { asOfDate, fiscalPeriod } = req.query

    let trialBalance

    if (asOfDate) {
      trialBalance = await JournalEntry.generateTrialBalance(req.activeCompany._id, asOfDate)
    } else {
      // Get from Chart of Accounts balances
      trialBalance = await ChartOfAccounts.getTrialBalanceAccounts(req.activeCompany._id)
    }

    // Calculate totals
    let totalDebits = 0
    let totalCredits = 0

    trialBalance.forEach(account => {
      totalDebits += account.totalDebit || account.balance?.debit || 0
      totalCredits += account.totalCredit || account.balance?.credit || 0
    })

    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

    res.json({
      success: true,
      data: {
        accounts: trialBalance,
        totals: {
          debits: Math.round(totalDebits * 100) / 100,
          credits: Math.round(totalCredits * 100) / 100,
          difference: Math.round((totalDebits - totalCredits) * 100) / 100
        },
        isBalanced,
        asOfDate: asOfDate || new Date(),
        soxControl: 'GL-010'
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ============================================
// FISCAL PERIOD OPERATIONS - SOX Control: GL-006
// ============================================

/**
 * Get all fiscal periods
 */
export const getFiscalPeriods = async (req, res) => {
  try {
    const { fiscalYear, status } = req.query

    const filter = { company: req.activeCompany._id }
    if (fiscalYear) filter.fiscalYear = parseInt(fiscalYear)
    if (status) filter.status = status

    const periods = await FiscalPeriod.find(filter)
      .populate('openedBy', 'name')
      .populate('closedBy', 'name')
      .populate('lockedBy', 'name')
      .sort({ startDate: -1 })

    res.json({ success: true, data: periods })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Get current open period
 */
export const getCurrentPeriod = async (req, res) => {
  try {
    const period = await FiscalPeriod.getCurrentOpenPeriod(req.activeCompany._id)

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'No open fiscal period found'
      })
    }

    res.json({ success: true, data: period })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/**
 * Open fiscal period
 */
export const openPeriod = async (req, res) => {
  try {
    const period = await FiscalPeriod.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!period) {
      return res.status(404).json({ success: false, message: 'Period not found' })
    }

    period.openPeriod(req.user._id, req.user.name)
    await period.save()

    res.json({
      success: true,
      message: `Period ${period.periodName} opened`,
      data: period
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * Soft close period
 */
export const softClosePeriod = async (req, res) => {
  try {
    const { reason } = req.body

    const period = await FiscalPeriod.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!period) {
      return res.status(404).json({ success: false, message: 'Period not found' })
    }

    period.softClosePeriod(req.user._id, req.user.name, reason)
    await period.save()

    res.json({
      success: true,
      message: `Period ${period.periodName} soft-closed. Only adjusting entries allowed.`,
      data: period
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * Close period
 */
export const closePeriod = async (req, res) => {
  try {
    const { reason } = req.body

    const period = await FiscalPeriod.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!period) {
      return res.status(404).json({ success: false, message: 'Period not found' })
    }

    period.closePeriod(req.user._id, req.user.name, reason)
    await period.save()

    res.json({
      success: true,
      message: `Period ${period.periodName} closed`,
      data: period
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * Lock period (permanent)
 */
export const lockPeriod = async (req, res) => {
  try {
    const { reason } = req.body

    const period = await FiscalPeriod.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!period) {
      return res.status(404).json({ success: false, message: 'Period not found' })
    }

    period.lockPeriod(req.user._id, req.user.name, reason)
    await period.save()

    res.json({
      success: true,
      message: `Period ${period.periodName} permanently locked`,
      data: period
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * Update closing checklist item
 */
export const updateChecklistItem = async (req, res) => {
  try {
    const { item, completed, remarks } = req.body

    const period = await FiscalPeriod.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!period) {
      return res.status(404).json({ success: false, message: 'Period not found' })
    }

    period.updateChecklistItem(item, completed, req.user._id, remarks)
    await period.save()

    res.json({
      success: true,
      message: `Checklist item '${item}' updated`,
      data: period.closingChecklist
    })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

/**
 * Generate fiscal periods for a year
 */
export const generatePeriods = async (req, res) => {
  try {
    const { fiscalYear, startMonth = 4 } = req.body // Indian FY starts April

    // Check if periods already exist
    const existing = await FiscalPeriod.countDocuments({
      company: req.activeCompany._id,
      fiscalYear
    })

    if (existing > 0) {
      return res.status(400).json({
        success: false,
        message: `Periods for FY${fiscalYear} already exist`
      })
    }

    const periods = await FiscalPeriod.generatePeriodsForYear(
      req.activeCompany._id,
      fiscalYear,
      startMonth,
      req.user._id
    )

    res.status(201).json({
      success: true,
      message: `Generated ${periods.length} periods for FY${fiscalYear}`,
      data: periods
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

export default {
  // Chart of Accounts
  getAccountTree,
  getAccounts,
  getAccount,
  createAccount,
  approveAccount,

  // Journal Entries
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  submitForReview,
  reviewEntry,
  approveEntry,
  rejectEntry,
  reverseEntry,
  getPendingEntries,

  // Trial Balance
  getTrialBalance,

  // Fiscal Periods
  getFiscalPeriods,
  getCurrentPeriod,
  openPeriod,
  softClosePeriod,
  closePeriod,
  lockPeriod,
  updateChecklistItem,
  generatePeriods
}
