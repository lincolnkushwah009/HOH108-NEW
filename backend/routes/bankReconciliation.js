import express from 'express'
import BankReconciliation from '../models/BankReconciliation.js'
import Payment from '../models/Payment.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  requireModulePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('bank_reconciliation', 'view'))

// POST / - Create reconciliation session
router.post('/', async (req, res) => {
  try {
    const { bankName, accountNumber, statementDate, period } = req.body

    if (!bankName || !accountNumber || !statementDate || !period) {
      return res.status(400).json({
        success: false,
        message: 'bankName, accountNumber, statementDate, and period are required'
      })
    }

    const reconciliation = await BankReconciliation.create({
      company: req.activeCompany._id,
      bankAccount: {
        bankName,
        accountNumber
      },
      statementPeriod: {
        from: new Date(period.from || period.start),
        to: new Date(period.to || period.end)
      },
      status: 'draft',
      importedBy: req.user._id
    })

    res.status(201).json({ success: true, data: reconciliation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET / - List reconciliation sessions (company scoped, paginated)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, bankName } = req.query
    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (bankName) queryFilter['bankAccount.bankName'] = { $regex: bankName, $options: 'i' }

    const total = await BankReconciliation.countDocuments(queryFilter)

    const sessions = await BankReconciliation.find(queryFilter)
      .populate('importedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: sessions,
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

// GET /:id - Get session detail
router.get('/:id', async (req, res) => {
  try {
    const reconciliation = await BankReconciliation.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })
      .populate('importedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('statementEntries.matchedPayment', 'paymentNumber amount paymentDate')
      .populate('statementEntries.matchedBy', 'name')

    if (!reconciliation) {
      return res.status(404).json({ success: false, message: 'Reconciliation session not found' })
    }

    res.json({ success: true, data: reconciliation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /:id/import - Import statement entries
router.post('/:id/import', async (req, res) => {
  try {
    const { entries } = req.body

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'entries array is required and must not be empty'
      })
    }

    const reconciliation = await BankReconciliation.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!reconciliation) {
      return res.status(404).json({ success: false, message: 'Reconciliation session not found' })
    }

    if (reconciliation.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot import entries to an approved reconciliation'
      })
    }

    const formattedEntries = entries.map(entry => ({
      date: new Date(entry.date),
      description: entry.description,
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      balance: entry.balance || 0,
      reference: entry.reference || '',
      matchStatus: 'unmatched'
    }))

    reconciliation.statementEntries.push(...formattedEntries)
    reconciliation.status = 'in_progress'
    reconciliation.importedAt = new Date()
    reconciliation.importedBy = req.user._id

    // Recalculate unreconciled items
    reconciliation.unreconciledItems = reconciliation.statementEntries.filter(
      e => e.matchStatus === 'unmatched'
    ).length

    // Update balances from imported entries
    if (formattedEntries.length > 0) {
      reconciliation.openingBalance = formattedEntries[0].balance - formattedEntries[0].credit + formattedEntries[0].debit
      reconciliation.closingBalance = formattedEntries[formattedEntries.length - 1].balance
    }

    await reconciliation.save()

    res.json({
      success: true,
      data: reconciliation,
      message: `${formattedEntries.length} entries imported successfully`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /:id/auto-match - Auto-match entries against payments
router.post('/:id/auto-match', async (req, res) => {
  try {
    const reconciliation = await BankReconciliation.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!reconciliation) {
      return res.status(404).json({ success: false, message: 'Reconciliation session not found' })
    }

    if (reconciliation.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot auto-match an approved reconciliation'
      })
    }

    let matchedCount = 0
    const companyId = req.activeCompany._id

    for (const entry of reconciliation.statementEntries) {
      // Skip already matched entries
      if (entry.matchStatus !== 'unmatched') continue

      // Determine the amount to match (debit or credit)
      const amount = entry.debit > 0 ? entry.debit : entry.credit

      if (amount === 0) continue

      // Date range: entry date +/- 3 days
      const entryDate = new Date(entry.date)
      const dateFrom = new Date(entryDate)
      dateFrom.setDate(dateFrom.getDate() - 3)
      const dateTo = new Date(entryDate)
      dateTo.setDate(dateTo.getDate() + 3)

      // Find Payment with matching amount within 3-day range
      const matchingPayment = await Payment.findOne({
        company: companyId,
        amount: amount,
        paymentDate: { $gte: dateFrom, $lte: dateTo }
      })

      if (matchingPayment) {
        entry.matchStatus = 'auto_matched'
        entry.matchedPayment = matchingPayment._id
        entry.matchedAt = new Date()
        entry.matchedBy = req.user._id
        matchedCount++
      }
    }

    // Recalculate unreconciled items and reconciled balance
    reconciliation.unreconciledItems = reconciliation.statementEntries.filter(
      e => e.matchStatus === 'unmatched'
    ).length

    const matchedEntries = reconciliation.statementEntries.filter(
      e => e.matchStatus === 'auto_matched' || e.matchStatus === 'manual_matched'
    )
    reconciliation.reconciledBalance = matchedEntries.reduce(
      (sum, e) => sum + (e.credit - e.debit), 0
    )

    if (reconciliation.unreconciledItems === 0 && reconciliation.statementEntries.length > 0) {
      reconciliation.status = 'completed'
    }

    await reconciliation.save()

    res.json({
      success: true,
      data: reconciliation,
      message: `${matchedCount} entries auto-matched out of ${reconciliation.statementEntries.length} total entries`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /:id/entries/:entryId/match - Manual match
router.put('/:id/entries/:entryId/match', async (req, res) => {
  try {
    const { transactionId, transactionType } = req.body

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: 'transactionId is required'
      })
    }

    const reconciliation = await BankReconciliation.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!reconciliation) {
      return res.status(404).json({ success: false, message: 'Reconciliation session not found' })
    }

    if (reconciliation.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify an approved reconciliation'
      })
    }

    const entry = reconciliation.statementEntries.id(req.params.entryId)

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Statement entry not found' })
    }

    entry.matchStatus = 'manual_matched'
    entry.matchedPayment = transactionId
    entry.matchedAt = new Date()
    entry.matchedBy = req.user._id

    // Recalculate unreconciled items
    reconciliation.unreconciledItems = reconciliation.statementEntries.filter(
      e => e.matchStatus === 'unmatched'
    ).length

    const matchedEntries = reconciliation.statementEntries.filter(
      e => e.matchStatus === 'auto_matched' || e.matchStatus === 'manual_matched'
    )
    reconciliation.reconciledBalance = matchedEntries.reduce(
      (sum, e) => sum + (e.credit - e.debit), 0
    )

    if (reconciliation.unreconciledItems === 0 && reconciliation.statementEntries.length > 0) {
      reconciliation.status = 'completed'
    }

    await reconciliation.save()

    res.json({ success: true, data: reconciliation })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /:id/approve - Approve reconciliation
router.put('/:id/approve', async (req, res) => {
  try {
    const reconciliation = await BankReconciliation.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!reconciliation) {
      return res.status(404).json({ success: false, message: 'Reconciliation session not found' })
    }

    if (reconciliation.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Reconciliation is already approved'
      })
    }

    if (reconciliation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed reconciliations can be approved. Ensure all entries are matched.'
      })
    }

    reconciliation.status = 'approved'
    reconciliation.approvedBy = req.user._id
    reconciliation.approvedAt = new Date()

    await reconciliation.save()

    const populated = await BankReconciliation.findById(reconciliation._id)
      .populate('approvedBy', 'name')
      .populate('importedBy', 'name')

    res.json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
