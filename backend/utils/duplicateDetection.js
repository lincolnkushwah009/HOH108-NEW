/**
 * Duplicate Detection Utility
 * SOX Control: PTP-006 - Invoice Processing Controls
 *
 * Implements duplicate detection for:
 * - Vendor invoices
 * - Payment reference numbers
 * - Customer invoices
 */

import mongoose from 'mongoose'

/**
 * Detection rule configurations
 */
const DETECTION_RULES = {
  vendorInvoice: {
    // Exact match rules
    exactMatch: [
      { fields: ['vendor', 'vendorInvoiceNumber'], weight: 100 },
      { fields: ['vendor', 'invoiceTotal', 'invoiceDate'], weight: 95 }
    ],
    // Fuzzy match rules
    fuzzyMatch: [
      { field: 'vendorInvoiceNumber', threshold: 0.85, weight: 70 },
      { fields: ['vendor', 'invoiceTotal'], dateRange: 7, weight: 60 }
    ],
    // Minimum similarity score to flag
    flagThreshold: 60
  },

  payment: {
    exactMatch: [
      { fields: ['referenceNumber'], weight: 100 },
      { fields: ['vendor', 'amount', 'paymentDate'], weight: 90 }
    ],
    fuzzyMatch: [
      { fields: ['vendor', 'amount'], dateRange: 3, weight: 50 }
    ],
    flagThreshold: 50
  },

  customerInvoice: {
    exactMatch: [
      { fields: ['customer', 'invoiceNumber'], weight: 100 }
    ],
    fuzzyMatch: [
      { fields: ['customer', 'invoiceTotal'], dateRange: 7, weight: 60 }
    ],
    flagThreshold: 60
  }
}

/**
 * Check for duplicate vendor invoice
 * @param {Object} invoice - Invoice data to check
 * @param {ObjectId} companyId - Company ID
 * @returns {Promise<{isDuplicate: boolean, matches: Array, highestScore: number}>}
 */
export const checkDuplicateVendorInvoice = async (invoice, companyId) => {
  const VendorInvoice = mongoose.model('VendorInvoice')
  const matches = []

  // Rule 1: Exact match on vendor + vendor invoice number
  const exactMatch = await VendorInvoice.findOne({
    company: companyId,
    vendor: invoice.vendor,
    vendorInvoiceNumber: invoice.vendorInvoiceNumber,
    _id: { $ne: invoice._id }
  })

  if (exactMatch) {
    return {
      isDuplicate: true,
      matches: [{
        invoice: exactMatch._id,
        invoiceNumber: exactMatch.invoiceNumber,
        vendorInvoiceNumber: exactMatch.vendorInvoiceNumber,
        matchReason: 'exact_invoice_number',
        similarity: 100
      }],
      highestScore: 100
    }
  }

  // Rule 2: Same vendor + same amount + date within 7 days
  const dateWindow = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  const invoiceDate = new Date(invoice.invoiceDate)

  const amountMatches = await VendorInvoice.find({
    company: companyId,
    vendor: invoice.vendor,
    invoiceTotal: invoice.invoiceTotal,
    invoiceDate: {
      $gte: new Date(invoiceDate.getTime() - dateWindow),
      $lte: new Date(invoiceDate.getTime() + dateWindow)
    },
    _id: { $ne: invoice._id }
  }).limit(5)

  for (const match of amountMatches) {
    const daysDiff = Math.abs(invoiceDate - new Date(match.invoiceDate)) / (24 * 60 * 60 * 1000)
    const similarity = 95 - (daysDiff * 5) // Decrease score as date difference increases

    matches.push({
      invoice: match._id,
      invoiceNumber: match.invoiceNumber,
      vendorInvoiceNumber: match.vendorInvoiceNumber,
      matchReason: 'same_amount_similar_date',
      similarity: Math.round(similarity),
      daysDifference: Math.round(daysDiff)
    })
  }

  // Rule 3: Similar invoice numbers (Levenshtein distance)
  if (invoice.vendorInvoiceNumber) {
    const recentInvoices = await VendorInvoice.find({
      company: companyId,
      vendor: invoice.vendor,
      _id: { $ne: invoice._id }
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('vendorInvoiceNumber invoiceNumber invoiceTotal invoiceDate')

    for (const existing of recentInvoices) {
      if (!existing.vendorInvoiceNumber) continue

      const similarity = calculateStringSimilarity(
        invoice.vendorInvoiceNumber.toLowerCase(),
        existing.vendorInvoiceNumber.toLowerCase()
      )

      if (similarity >= 0.85 && similarity < 1) {
        // High similarity but not exact match
        matches.push({
          invoice: existing._id,
          invoiceNumber: existing.invoiceNumber,
          vendorInvoiceNumber: existing.vendorInvoiceNumber,
          matchReason: 'similar_invoice_number',
          similarity: Math.round(similarity * 100)
        })
      }
    }
  }

  // Remove duplicates and sort by similarity
  const uniqueMatches = removeDuplicateMatches(matches)
  const sortedMatches = uniqueMatches.sort((a, b) => b.similarity - a.similarity)
  const highestScore = sortedMatches.length > 0 ? sortedMatches[0].similarity : 0

  return {
    isDuplicate: highestScore >= DETECTION_RULES.vendorInvoice.flagThreshold,
    matches: sortedMatches.slice(0, 5), // Return top 5 matches
    highestScore
  }
}

/**
 * Check for duplicate payment
 * @param {Object} payment - Payment data to check
 * @param {ObjectId} companyId - Company ID
 * @returns {Promise<{isDuplicate: boolean, matches: Array, highestScore: number}>}
 */
export const checkDuplicatePayment = async (payment, companyId) => {
  const Payment = mongoose.model('Payment')
  const matches = []

  // Rule 1: Exact match on reference number
  if (payment.referenceNumber) {
    const exactMatch = await Payment.findOne({
      company: companyId,
      referenceNumber: payment.referenceNumber,
      _id: { $ne: payment._id }
    })

    if (exactMatch) {
      return {
        isDuplicate: true,
        matches: [{
          payment: exactMatch._id,
          referenceNumber: exactMatch.referenceNumber,
          matchReason: 'exact_reference_number',
          similarity: 100
        }],
        highestScore: 100
      }
    }
  }

  // Rule 2: Same vendor/payee + same amount + date within 3 days
  const dateWindow = 3 * 24 * 60 * 60 * 1000
  const paymentDate = new Date(payment.paymentDate || payment.date)

  const filter = {
    company: companyId,
    amount: payment.amount,
    paymentDate: {
      $gte: new Date(paymentDate.getTime() - dateWindow),
      $lte: new Date(paymentDate.getTime() + dateWindow)
    },
    _id: { $ne: payment._id }
  }

  // Add vendor filter if available
  if (payment.vendor) {
    filter.vendor = payment.vendor
  } else if (payment.vendorInvoice) {
    filter.vendorInvoice = payment.vendorInvoice
  }

  const amountMatches = await Payment.find(filter).limit(5)

  for (const match of amountMatches) {
    const daysDiff = Math.abs(paymentDate - new Date(match.paymentDate)) / (24 * 60 * 60 * 1000)
    const similarity = 90 - (daysDiff * 10)

    matches.push({
      payment: match._id,
      referenceNumber: match.referenceNumber,
      amount: match.amount,
      matchReason: 'same_amount_similar_date',
      similarity: Math.round(similarity),
      daysDifference: Math.round(daysDiff)
    })
  }

  const highestScore = matches.length > 0 ? Math.max(...matches.map(m => m.similarity)) : 0

  return {
    isDuplicate: highestScore >= DETECTION_RULES.payment.flagThreshold,
    matches: matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5),
    highestScore
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
export const calculateStringSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0
  if (str1 === str2) return 1

  const len1 = str1.length
  const len2 = str2.length
  const maxLen = Math.max(len1, len2)

  if (maxLen === 0) return 1

  const distance = levenshteinDistance(str1, str2)
  return (maxLen - distance) / maxLen
}

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1, str2) => {
  const m = str1.length
  const n = str2.length
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Remove duplicate matches (same invoice/payment appearing multiple times)
 */
const removeDuplicateMatches = (matches) => {
  const seen = new Set()
  return matches.filter(match => {
    const key = (match.invoice || match.payment).toString()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Bulk check for duplicates in a batch of invoices
 * Useful for import operations
 * @param {Array} invoices - Array of invoice objects
 * @param {ObjectId} companyId - Company ID
 * @returns {Promise<Array>} - Array of { invoice, duplicateCheck }
 */
export const bulkCheckDuplicates = async (invoices, companyId) => {
  const results = []

  for (const invoice of invoices) {
    const duplicateCheck = await checkDuplicateVendorInvoice(invoice, companyId)
    results.push({
      invoice,
      ...duplicateCheck
    })
  }

  return results
}

/**
 * Get duplicate detection statistics for a company
 */
export const getDuplicateDetectionStats = async (companyId, startDate, endDate) => {
  const VendorInvoice = mongoose.model('VendorInvoice')

  const matchFilter = { company: companyId }
  if (startDate || endDate) {
    matchFilter.createdAt = {}
    if (startDate) matchFilter.createdAt.$gte = new Date(startDate)
    if (endDate) matchFilter.createdAt.$lte = new Date(endDate)
  }

  const stats = await VendorInvoice.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$duplicateCheckStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$invoiceTotal' }
      }
    }
  ])

  const result = {
    pending: { count: 0, totalAmount: 0 },
    passed: { count: 0, totalAmount: 0 },
    potential_duplicate: { count: 0, totalAmount: 0 },
    confirmed_not_duplicate: { count: 0, totalAmount: 0 }
  }

  stats.forEach(s => {
    if (result[s._id]) {
      result[s._id] = { count: s.count, totalAmount: s.totalAmount }
    }
  })

  return {
    ...result,
    total: stats.reduce((sum, s) => sum + s.count, 0),
    flagRate: result.potential_duplicate.count > 0
      ? ((result.potential_duplicate.count / stats.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(2)
      : 0
  }
}

export default {
  checkDuplicateVendorInvoice,
  checkDuplicatePayment,
  calculateStringSimilarity,
  bulkCheckDuplicates,
  getDuplicateDetectionStats,
  DETECTION_RULES
}
