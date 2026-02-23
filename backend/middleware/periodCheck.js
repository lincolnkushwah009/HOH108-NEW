import FiscalPeriod from '../models/FiscalPeriod.js'

/**
 * Period Check Middleware
 * SOX Control: GL-006 - Period-End Close Procedures
 *
 * Prevents posting to closed fiscal periods.
 * Validates that transactions are recorded in the correct accounting period.
 */

/**
 * Middleware to require an open fiscal period
 * Blocks transactions if the period for the transaction date is closed
 *
 * @param {Object} options
 * @param {string} options.dateField - Field name containing the transaction date (default: 'date')
 * @param {string} options.entryType - Type of entry (standard, adjusting, reversing)
 * @param {boolean} options.allowSoftClose - Allow posting during soft close (for adjusting entries)
 */
export const requireOpenPeriod = (options = {}) => {
  const {
    dateField = 'date',
    entryType = 'standard',
    allowSoftClose = false
  } = options

  return async (req, res, next) => {
    try {
      // Get transaction date from request body
      const txnDate = req.body[dateField] ||
                      req.body.invoiceDate ||
                      req.body.entryDate ||
                      req.body.transactionDate ||
                      req.body.paymentDate

      if (!txnDate) {
        // If no date provided, use current date
        req.body[dateField] = new Date()
      }

      const transactionDate = new Date(txnDate || req.body[dateField])

      // Find the fiscal period for this date
      const period = await FiscalPeriod.findByDate(req.activeCompany._id, transactionDate)

      if (!period) {
        return res.status(400).json({
          success: false,
          message: `No fiscal period found for date ${transactionDate.toISOString().split('T')[0]}. Please ensure fiscal periods are set up.`,
          code: 'NO_FISCAL_PERIOD',
          soxControl: 'GL-006'
        })
      }

      // Check if posting is allowed
      const canPost = period.canPost(entryType)

      if (!canPost.allowed) {
        // Special handling for soft-close
        if (period.status === 'soft_close' && allowSoftClose && ['adjusting', 'reversing'].includes(entryType)) {
          // Allow the request to proceed
        } else {
          return res.status(403).json({
            success: false,
            message: canPost.reason,
            periodName: period.periodName,
            periodStatus: period.status,
            transactionDate: transactionDate.toISOString().split('T')[0],
            code: 'PERIOD_CLOSED',
            soxControl: 'GL-006'
          })
        }
      }

      // Attach period to request for use in controllers
      req.fiscalPeriod = period

      next()
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}

/**
 * Middleware to validate transaction date is within acceptable range
 * Prevents backdating or future-dating beyond allowed limits
 *
 * @param {Object} options
 * @param {number} options.maxBackdateDays - Maximum days in the past allowed (default: 30)
 * @param {number} options.maxFutureDays - Maximum days in the future allowed (default: 0)
 * @param {string} options.dateField - Field containing the date
 */
export const validateTransactionDate = (options = {}) => {
  const {
    maxBackdateDays = 30,
    maxFutureDays = 0,
    dateField = 'date'
  } = options

  return async (req, res, next) => {
    try {
      const txnDate = req.body[dateField] ||
                      req.body.invoiceDate ||
                      req.body.entryDate ||
                      req.body.transactionDate ||
                      req.body.paymentDate

      if (!txnDate) {
        return next() // No date to validate
      }

      const transactionDate = new Date(txnDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const minDate = new Date(today)
      minDate.setDate(minDate.getDate() - maxBackdateDays)

      const maxDate = new Date(today)
      maxDate.setDate(maxDate.getDate() + maxFutureDays)

      transactionDate.setHours(0, 0, 0, 0)

      if (transactionDate < minDate) {
        return res.status(400).json({
          success: false,
          message: `Transaction date cannot be more than ${maxBackdateDays} days in the past`,
          transactionDate: transactionDate.toISOString().split('T')[0],
          minAllowedDate: minDate.toISOString().split('T')[0],
          code: 'DATE_TOO_OLD',
          soxControl: 'GL-006'
        })
      }

      if (transactionDate > maxDate) {
        return res.status(400).json({
          success: false,
          message: maxFutureDays === 0
            ? 'Transaction date cannot be in the future'
            : `Transaction date cannot be more than ${maxFutureDays} days in the future`,
          transactionDate: transactionDate.toISOString().split('T')[0],
          maxAllowedDate: maxDate.toISOString().split('T')[0],
          code: 'DATE_TOO_FUTURE',
          soxControl: 'GL-006'
        })
      }

      next()
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}

/**
 * Middleware to check period close status for period-end operations
 * Use on routes that perform period-end activities
 */
export const requirePeriodEndAccess = () => {
  return async (req, res, next) => {
    try {
      const periodId = req.params.id || req.body.periodId

      if (!periodId) {
        return res.status(400).json({
          success: false,
          message: 'Period ID is required'
        })
      }

      const period = await FiscalPeriod.findOne({
        _id: periodId,
        company: req.activeCompany._id
      })

      if (!period) {
        return res.status(404).json({
          success: false,
          message: 'Fiscal period not found'
        })
      }

      // Check if period is already locked
      if (period.status === 'locked') {
        return res.status(403).json({
          success: false,
          message: `Period ${period.periodName} is permanently locked and cannot be modified`,
          code: 'PERIOD_LOCKED',
          soxControl: 'GL-006'
        })
      }

      req.fiscalPeriod = period
      next()
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}

/**
 * Middleware to ensure current period is set
 * Attaches the current open period to the request
 */
export const attachCurrentPeriod = async (req, res, next) => {
  try {
    const period = await FiscalPeriod.getCurrentOpenPeriod(req.activeCompany._id)

    if (period) {
      req.currentPeriod = period
    }

    next()
  } catch (error) {
    // Don't fail the request if period lookup fails
    console.error('[PeriodCheck] Error attaching current period:', error)
    next()
  }
}

/**
 * Get period status summary for a company
 * Useful for dashboard displays
 */
export const getPeriodStatusSummary = async (companyId) => {
  const periods = await FiscalPeriod.aggregate([
    { $match: { company: companyId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        periods: { $push: { id: '$_id', name: '$periodName', fiscalYear: '$fiscalYear' } }
      }
    }
  ])

  const summary = {
    open: [],
    soft_close: [],
    closed: [],
    locked: [],
    future: []
  }

  periods.forEach(p => {
    summary[p._id] = p.periods
  })

  return {
    summary,
    hasOpenPeriod: summary.open.length > 0,
    currentPeriod: summary.open[0] || summary.soft_close[0] || null
  }
}

/**
 * Predefined period check configurations for common transaction types
 */
export const PeriodCheckConfigs = {
  // Standard transactions
  standard: {
    dateField: 'date',
    entryType: 'standard',
    allowSoftClose: false
  },

  // Vendor invoices
  vendorInvoice: {
    dateField: 'invoiceDate',
    entryType: 'standard',
    allowSoftClose: false
  },

  // Customer invoices
  customerInvoice: {
    dateField: 'invoiceDate',
    entryType: 'standard',
    allowSoftClose: false
  },

  // Payments
  payment: {
    dateField: 'paymentDate',
    entryType: 'standard',
    allowSoftClose: false
  },

  // Journal entries
  journalEntry: {
    dateField: 'entryDate',
    entryType: 'standard',
    allowSoftClose: false
  },

  // Adjusting entries (allowed during soft close)
  adjustingEntry: {
    dateField: 'entryDate',
    entryType: 'adjusting',
    allowSoftClose: true
  },

  // Reversing entries
  reversingEntry: {
    dateField: 'entryDate',
    entryType: 'reversing',
    allowSoftClose: true
  }
}

export default {
  requireOpenPeriod,
  validateTransactionDate,
  requirePeriodEndAccess,
  attachCurrentPeriod,
  getPeriodStatusSummary,
  PeriodCheckConfigs
}
