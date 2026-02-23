/**
 * ===========================================
 * SOX Control: Aging Calculator Utility
 * Common functions for AR/AP aging calculations
 * ===========================================
 */

/**
 * Calculate days overdue from due date
 * @param {Date} dueDate - The due date
 * @param {Date} asOfDate - The date to calculate from (defaults to today)
 * @returns {number} Days overdue (0 if not overdue)
 */
export function calculateDaysOverdue(dueDate, asOfDate = new Date()) {
  if (!dueDate) return 0
  const due = new Date(dueDate)
  const asOf = new Date(asOfDate)
  const diffTime = asOf - due
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * Get aging bucket for a given number of days overdue
 * @param {number} daysOverdue - Days past due
 * @returns {string} Aging bucket ('current', '1-30', '31-60', '61-90', '90+')
 */
export function getAgingBucket(daysOverdue) {
  if (daysOverdue <= 0) return 'current'
  if (daysOverdue <= 30) return '1-30'
  if (daysOverdue <= 60) return '31-60'
  if (daysOverdue <= 90) return '61-90'
  return '90+'
}

/**
 * Calculate aging for an invoice/document
 * @param {Object} document - Document with dueDate and balanceAmount
 * @param {Date} asOfDate - Date to calculate aging as of
 * @returns {Object} Aging details
 */
export function calculateAging(document, asOfDate = new Date()) {
  const dueDate = document.dueDate || document.invoiceDate
  const daysOverdue = calculateDaysOverdue(dueDate, asOfDate)
  const agingBucket = getAgingBucket(daysOverdue)

  return {
    daysOverdue,
    agingBucket,
    isOverdue: daysOverdue > 0,
    isCritical: daysOverdue > 90,
    balance: document.balanceAmount || 0
  }
}

/**
 * Aggregate aging buckets from a list of documents
 * @param {Array} documents - List of documents with dueDate and balanceAmount
 * @param {Date} asOfDate - Date to calculate aging as of
 * @returns {Object} Aggregated aging summary
 */
export function aggregateAging(documents, asOfDate = new Date()) {
  const buckets = {
    current: { count: 0, amount: 0 },
    '1-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '61-90': { count: 0, amount: 0 },
    '90+': { count: 0, amount: 0 }
  }

  documents.forEach(doc => {
    const aging = calculateAging(doc, asOfDate)
    if (buckets[aging.agingBucket]) {
      buckets[aging.agingBucket].count++
      buckets[aging.agingBucket].amount += aging.balance
    }
  })

  const totalOutstanding = Object.values(buckets).reduce((sum, b) => sum + b.amount, 0)
  const totalCount = Object.values(buckets).reduce((sum, b) => sum + b.count, 0)
  const overdueAmount = totalOutstanding - buckets.current.amount

  return {
    buckets,
    summary: {
      totalOutstanding,
      totalCount,
      overdueAmount,
      overduePercentage: totalOutstanding > 0 ?
        Math.round((overdueAmount / totalOutstanding) * 100) : 0
    }
  }
}

/**
 * Calculate collection/payment priority score
 * Higher score = higher priority
 * @param {Object} document - Document with aging info
 * @returns {number} Priority score
 */
export function calculatePriorityScore(document) {
  const aging = calculateAging(document)
  let score = 0

  // Base score on days overdue
  score += Math.min(100, aging.daysOverdue)

  // Add weight for amount
  const amount = document.balanceAmount || 0
  if (amount > 1000000) score += 50
  else if (amount > 500000) score += 40
  else if (amount > 100000) score += 30
  else if (amount > 50000) score += 20
  else if (amount > 10000) score += 10

  // Add weight for critical aging
  if (aging.isCritical) score += 25

  return score
}

/**
 * Get aging trend by comparing two periods
 * @param {Object} currentAging - Current period aging buckets
 * @param {Object} previousAging - Previous period aging buckets
 * @returns {Object} Trend analysis
 */
export function getAgingTrend(currentAging, previousAging) {
  const trend = {}

  Object.keys(currentAging.buckets).forEach(bucket => {
    const current = currentAging.buckets[bucket].amount
    const previous = previousAging.buckets[bucket]?.amount || 0

    trend[bucket] = {
      current,
      previous,
      change: current - previous,
      changePercent: previous > 0 ?
        Math.round(((current - previous) / previous) * 100) : (current > 0 ? 100 : 0),
      direction: current > previous ? 'increasing' : current < previous ? 'decreasing' : 'stable'
    }
  })

  return {
    trend,
    overallTrend: currentAging.summary.overdueAmount > previousAging.summary.overdueAmount ?
      'worsening' : currentAging.summary.overdueAmount < previousAging.summary.overdueAmount ?
      'improving' : 'stable'
  }
}

/**
 * Calculate DSO (Days Sales Outstanding) or DPO (Days Payable Outstanding)
 * @param {number} receivablesOrPayables - Total AR or AP amount
 * @param {number} revenueOrPurchases - Total revenue (for DSO) or purchases (for DPO)
 * @param {number} days - Number of days in period (default 365)
 * @returns {number} DSO or DPO in days
 */
export function calculateDSO_DPO(receivablesOrPayables, revenueOrPurchases, days = 365) {
  if (!revenueOrPurchases || revenueOrPurchases === 0) return 0
  return Math.round((receivablesOrPayables / revenueOrPurchases) * days)
}

export default {
  calculateDaysOverdue,
  getAgingBucket,
  calculateAging,
  aggregateAging,
  calculatePriorityScore,
  getAgingTrend,
  calculateDSO_DPO
}
