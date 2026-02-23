import express from 'express'
import {
  protect,
  setCompanyContext,
  authorize,
  companyScopedQuery
} from '../middleware/rbac.js'
import { seedIndianCoA } from '../seeders/indianCoASeeder.js'
import ChartOfAccounts from '../models/ChartOfAccounts.js'
import Company from '../models/Company.js'
import JournalEntry from '../models/JournalEntry.js'
import {
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
} from '../controllers/glController.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// ============================================
// CHART OF ACCOUNTS ROUTES
// ============================================

/**
 * @route   GET /api/general-ledger/accounts/tree
 * @desc    Get chart of accounts in tree structure
 * @access  Private
 */
router.get('/accounts/tree', getAccountTree)

/**
 * @route   GET /api/general-ledger/accounts
 * @desc    Get all accounts (flat list with pagination)
 * @access  Private
 */
router.get('/accounts', getAccounts)

/**
 * @route   GET /api/general-ledger/accounts/:id
 * @desc    Get single account
 * @access  Private
 */
router.get('/accounts/:id', getAccount)

/**
 * @route   POST /api/general-ledger/accounts
 * @desc    Create new account (pending approval)
 * @access  Private (Finance, Admin)
 * @sox     GL-001
 */
router.post('/accounts', authorize('super_admin', 'company_admin', 'finance'), createAccount)

/**
 * @route   POST /api/general-ledger/accounts/:id/approve
 * @desc    Approve account for use
 * @access  Private (Finance Manager, Admin)
 * @sox     GL-001
 */
router.post('/accounts/:id/approve', authorize('super_admin', 'company_admin'), approveAccount)

// ============================================
// JOURNAL ENTRY ROUTES
// ============================================

/**
 * @route   GET /api/general-ledger/journal-entries
 * @desc    Get all journal entries
 * @access  Private
 */
router.get('/journal-entries', getJournalEntries)

/**
 * @route   GET /api/general-ledger/journal-entries/pending
 * @desc    Get entries pending review/approval (excludes user's own entries)
 * @access  Private
 * @sox     GL-002
 */
router.get('/journal-entries/pending', getPendingEntries)

/**
 * @route   GET /api/general-ledger/journal-entries/:id
 * @desc    Get single journal entry
 * @access  Private
 */
router.get('/journal-entries/:id', getJournalEntry)

/**
 * @route   POST /api/general-ledger/journal-entries
 * @desc    Create journal entry (Maker)
 * @access  Private (Finance)
 * @sox     GL-002
 */
router.post('/journal-entries', authorize('super_admin', 'company_admin', 'finance'), createJournalEntry)

/**
 * @route   POST /api/general-ledger/journal-entries/:id/submit
 * @desc    Submit entry for review
 * @access  Private (Creator)
 * @sox     GL-002
 */
router.post('/journal-entries/:id/submit', submitForReview)

/**
 * @route   POST /api/general-ledger/journal-entries/:id/review
 * @desc    Review entry (Checker)
 * @access  Private (Finance)
 * @sox     GL-002
 */
router.post('/journal-entries/:id/review', authorize('super_admin', 'company_admin', 'finance'), reviewEntry)

/**
 * @route   POST /api/general-ledger/journal-entries/:id/approve
 * @desc    Approve and post entry (Approver)
 * @access  Private (Finance Manager, Admin)
 * @sox     GL-002
 */
router.post('/journal-entries/:id/approve', authorize('super_admin', 'company_admin'), approveEntry)

/**
 * @route   POST /api/general-ledger/journal-entries/:id/reject
 * @desc    Reject entry
 * @access  Private (Finance)
 * @sox     GL-002
 */
router.post('/journal-entries/:id/reject', authorize('super_admin', 'company_admin', 'finance'), rejectEntry)

/**
 * @route   POST /api/general-ledger/journal-entries/:id/reverse
 * @desc    Create reversal entry
 * @access  Private (Finance)
 * @sox     GL-002
 */
router.post('/journal-entries/:id/reverse', authorize('super_admin', 'company_admin', 'finance'), reverseEntry)

// ============================================
// TRIAL BALANCE ROUTES
// ============================================

/**
 * @route   GET /api/general-ledger/trial-balance
 * @desc    Generate trial balance
 * @access  Private
 * @sox     GL-010
 */
router.get('/trial-balance', getTrialBalance)

// ============================================
// FISCAL PERIOD ROUTES
// ============================================

/**
 * @route   GET /api/general-ledger/fiscal-periods
 * @desc    Get all fiscal periods
 * @access  Private
 */
router.get('/fiscal-periods', getFiscalPeriods)

/**
 * @route   GET /api/general-ledger/fiscal-periods/current
 * @desc    Get current open fiscal period
 * @access  Private
 */
router.get('/fiscal-periods/current', getCurrentPeriod)

/**
 * @route   POST /api/general-ledger/fiscal-periods/generate
 * @desc    Generate periods for a fiscal year
 * @access  Private (Admin)
 * @sox     GL-006
 */
router.post('/fiscal-periods/generate', authorize('super_admin', 'company_admin'), generatePeriods)

/**
 * @route   POST /api/general-ledger/fiscal-periods/:id/open
 * @desc    Open a fiscal period
 * @access  Private (Finance Manager, Admin)
 * @sox     GL-006
 */
router.post('/fiscal-periods/:id/open', authorize('super_admin', 'company_admin', 'finance'), openPeriod)

/**
 * @route   POST /api/general-ledger/fiscal-periods/:id/soft-close
 * @desc    Soft-close period (adjusting entries only)
 * @access  Private (Finance Manager, Admin)
 * @sox     GL-006
 */
router.post('/fiscal-periods/:id/soft-close', authorize('super_admin', 'company_admin', 'finance'), softClosePeriod)

/**
 * @route   POST /api/general-ledger/fiscal-periods/:id/close
 * @desc    Close fiscal period
 * @access  Private (Finance Manager, Admin)
 * @sox     GL-006
 */
router.post('/fiscal-periods/:id/close', authorize('super_admin', 'company_admin'), closePeriod)

/**
 * @route   POST /api/general-ledger/fiscal-periods/:id/lock
 * @desc    Permanently lock period (cannot be reopened)
 * @access  Private (Admin only)
 * @sox     GL-006
 */
router.post('/fiscal-periods/:id/lock', authorize('super_admin', 'company_admin'), lockPeriod)

/**
 * @route   PUT /api/general-ledger/fiscal-periods/:id/checklist
 * @desc    Update period-end closing checklist item
 * @access  Private (Finance)
 * @sox     GL-006
 */
router.put('/fiscal-periods/:id/checklist', authorize('super_admin', 'company_admin', 'finance'), updateChecklistItem)

// ============================================
// INDIAN COA SEEDER ROUTES
// ============================================

/**
 * @route   POST /api/general-ledger/accounts/seed-indian-coa
 * @desc    Seed Indian standard Chart of Accounts for a company
 * @access  Private (Admin)
 */
router.post('/accounts/seed-indian-coa', authorize('super_admin', 'company_admin'), async (req, res) => {
  try {
    const companyId = req.body.companyId || req.activeCompany._id
    const company = await Company.findById(companyId)
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' })
    }

    const result = await seedIndianCoA(companyId, company.code)
    res.status(201).json({ success: true, ...result })
  } catch (error) {
    console.error('Error seeding Indian CoA:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// LEDGER MASTER ROUTES
// ============================================

/**
 * @route   GET /api/general-ledger/ledger-master
 * @desc    Get all accounts as a flat ledger master list with search and filters
 * @access  Private
 */
router.get('/ledger-master', async (req, res) => {
  try {
    const { search, accountType, indianGroup, isPostable, page = 1, limit = 100 } = req.query
    const filter = { company: req.activeCompany._id, isActive: true }

    if (accountType) filter.accountType = accountType
    if (indianGroup) filter.indianGroup = indianGroup
    if (isPostable !== undefined) filter.isPostable = isPostable === 'true'

    if (search) {
      filter.$or = [
        { accountCode: { $regex: search, $options: 'i' } },
        { accountName: { $regex: search, $options: 'i' } },
        { ledgerCode: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await ChartOfAccounts.countDocuments(filter)
    const accounts = await ChartOfAccounts.find(filter)
      .sort({ accountCode: 1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: accounts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   GET /api/general-ledger/ledger-master/:id/transactions
 * @desc    Get transactions for a specific ledger account
 * @access  Private
 */
router.get('/ledger-master/:id/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query
    const account = await ChartOfAccounts.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' })
    }

    const jeFilter = {
      company: req.activeCompany._id,
      'lines.accountCode': account.accountCode,
      status: 'posted'
    }

    if (startDate || endDate) {
      jeFilter.entryDate = {}
      if (startDate) jeFilter.entryDate.$gte = new Date(startDate)
      if (endDate) jeFilter.entryDate.$lte = new Date(endDate)
    }

    const total = await JournalEntry.countDocuments(jeFilter)
    const entries = await JournalEntry.find(jeFilter)
      .sort({ entryDate: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('entryNumber entryDate description lines entryType sourceModule')

    // Extract relevant lines for this account
    const transactions = entries.map(entry => {
      const relevantLines = entry.lines.filter(l => l.accountCode === account.accountCode)
      return {
        entryNumber: entry.entryNumber,
        entryDate: entry.entryDate,
        description: entry.description,
        entryType: entry.entryType,
        sourceModule: entry.sourceModule,
        lines: relevantLines
      }
    })

    res.json({
      success: true,
      account: { _id: account._id, accountCode: account.accountCode, accountName: account.accountName, ledgerCode: account.ledgerCode },
      data: transactions,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
