import express from 'express'
import mongoose from 'mongoose'
import CustomerInvoice from '../models/CustomerInvoice.js'
import VendorInvoice from '../models/VendorInvoice.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('aging_dashboard', 'view'))

// Helper: unpaid/partially-paid/overdue filter
const unpaidStatuses = ['unpaid', 'partially_paid', 'overdue']

/**
 * Helper: Build AP aging bucket using $cond aggregation from dueDate
 * VendorInvoice doesn't have an agingBucket field, so we compute it dynamically
 */
const apAgingBucketExpr = {
  $let: {
    vars: {
      daysDiff: {
        $divide: [
          { $subtract: [new Date(), '$dueDate'] },
          1000 * 60 * 60 * 24
        ]
      }
    },
    in: {
      $cond: [
        { $or: [{ $eq: ['$dueDate', null] }, { $lte: ['$$daysDiff', 0] }] },
        'current',
        {
          $cond: [
            { $lte: ['$$daysDiff', 30] },
            '1-30',
            {
              $cond: [
                { $lte: ['$$daysDiff', 60] },
                '31-60',
                {
                  $cond: [
                    { $lte: ['$$daysDiff', 90] },
                    '61-90',
                    '90+'
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
}

// ============================
// ACCOUNTS RECEIVABLE (AR) AGING
// ============================

/**
 * @route   GET /api/aging/receivable
 * @desc    AR aging summary — aggregate by agingBucket, return DSO
 * @access  Private
 */
router.get('/receivable', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    // Aging buckets aggregation
    const buckets = await CustomerInvoice.aggregate([
      {
        $match: {
          company: companyId,
          paymentStatus: { $in: unpaidStatuses }
        }
      },
      {
        $group: {
          _id: '$agingBucket',
          count: { $sum: 1 },
          totalAmount: { $sum: '$balanceAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Total AR
    const totalAR = buckets.reduce((sum, b) => sum + b.totalAmount, 0)
    const totalCount = buckets.reduce((sum, b) => sum + b.count, 0)

    // Calculate DSO: (Total AR / Total Revenue) * Days
    // Revenue = total invoiceTotal for last 365 days
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const revenueAgg = await CustomerInvoice.aggregate([
      {
        $match: {
          company: companyId,
          invoiceDate: { $gte: oneYearAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$invoiceTotal' }
        }
      }
    ])

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0
    const dso = totalRevenue > 0 ? Math.round((totalAR / totalRevenue) * 365) : 0

    res.json({
      success: true,
      data: {
        buckets,
        totalAR,
        totalCount,
        dso,
        asOfDate: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   GET /api/aging/receivable/by-project/:projectId
 * @desc    AR aging breakdown by project
 * @access  Private
 */
router.get('/receivable/by-project/:projectId', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const projectId = new mongoose.Types.ObjectId(req.params.projectId)

    const buckets = await CustomerInvoice.aggregate([
      {
        $match: {
          company: companyId,
          project: projectId,
          paymentStatus: { $in: unpaidStatuses }
        }
      },
      {
        $group: {
          _id: '$agingBucket',
          count: { $sum: 1 },
          totalAmount: { $sum: '$balanceAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const totalAR = buckets.reduce((sum, b) => sum + b.totalAmount, 0)

    res.json({
      success: true,
      data: {
        projectId: req.params.projectId,
        buckets,
        totalAR,
        asOfDate: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   GET /api/aging/receivable/by-customer/:customerId
 * @desc    AR aging for specific customer
 * @access  Private
 */
router.get('/receivable/by-customer/:customerId', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const customerId = new mongoose.Types.ObjectId(req.params.customerId)

    const buckets = await CustomerInvoice.aggregate([
      {
        $match: {
          company: companyId,
          customer: customerId,
          paymentStatus: { $in: unpaidStatuses }
        }
      },
      {
        $group: {
          _id: '$agingBucket',
          count: { $sum: 1 },
          totalAmount: { $sum: '$balanceAmount' },
          invoices: {
            $push: {
              _id: '$_id',
              invoiceNumber: '$invoiceNumber',
              invoiceTotal: '$invoiceTotal',
              balanceAmount: '$balanceAmount',
              dueDate: '$dueDate',
              daysOverdue: '$daysOverdue'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const totalAR = buckets.reduce((sum, b) => sum + b.totalAmount, 0)

    res.json({
      success: true,
      data: {
        customerId: req.params.customerId,
        buckets,
        totalAR,
        asOfDate: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================
// ACCOUNTS PAYABLE (AP) AGING
// ============================

/**
 * @route   GET /api/aging/payable
 * @desc    AP aging summary — dynamically compute bucket from dueDate, return DPO
 * @access  Private
 */
router.get('/payable', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    const buckets = await VendorInvoice.aggregate([
      {
        $match: {
          company: companyId,
          paymentStatus: { $in: unpaidStatuses }
        }
      },
      {
        $addFields: {
          agingBucket: apAgingBucketExpr
        }
      },
      {
        $group: {
          _id: '$agingBucket',
          count: { $sum: 1 },
          totalAmount: { $sum: '$balanceAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const totalAP = buckets.reduce((sum, b) => sum + b.totalAmount, 0)
    const totalCount = buckets.reduce((sum, b) => sum + b.count, 0)

    // Calculate DPO: (Total AP / Total COGS) * Days
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const cogsAgg = await VendorInvoice.aggregate([
      {
        $match: {
          company: companyId,
          invoiceDate: { $gte: oneYearAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalCOGS: { $sum: '$invoiceTotal' }
        }
      }
    ])

    const totalCOGS = cogsAgg[0]?.totalCOGS || 0
    const dpo = totalCOGS > 0 ? Math.round((totalAP / totalCOGS) * 365) : 0

    res.json({
      success: true,
      data: {
        buckets,
        totalAP,
        totalCount,
        dpo,
        asOfDate: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   GET /api/aging/payable/by-project/:projectId
 * @desc    AP aging by project
 * @access  Private
 */
router.get('/payable/by-project/:projectId', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const projectId = new mongoose.Types.ObjectId(req.params.projectId)

    const buckets = await VendorInvoice.aggregate([
      {
        $match: {
          company: companyId,
          project: projectId,
          paymentStatus: { $in: unpaidStatuses }
        }
      },
      {
        $addFields: {
          agingBucket: apAgingBucketExpr
        }
      },
      {
        $group: {
          _id: '$agingBucket',
          count: { $sum: 1 },
          totalAmount: { $sum: '$balanceAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const totalAP = buckets.reduce((sum, b) => sum + b.totalAmount, 0)

    res.json({
      success: true,
      data: {
        projectId: req.params.projectId,
        buckets,
        totalAP,
        asOfDate: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   GET /api/aging/payable/by-vendor/:vendorId
 * @desc    AP aging for specific vendor
 * @access  Private
 */
router.get('/payable/by-vendor/:vendorId', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const vendorId = new mongoose.Types.ObjectId(req.params.vendorId)

    const buckets = await VendorInvoice.aggregate([
      {
        $match: {
          company: companyId,
          vendor: vendorId,
          paymentStatus: { $in: unpaidStatuses }
        }
      },
      {
        $addFields: {
          agingBucket: apAgingBucketExpr
        }
      },
      {
        $group: {
          _id: '$agingBucket',
          count: { $sum: 1 },
          totalAmount: { $sum: '$balanceAmount' },
          invoices: {
            $push: {
              _id: '$_id',
              invoiceNumber: '$invoiceNumber',
              vendorInvoiceNumber: '$vendorInvoiceNumber',
              invoiceTotal: '$invoiceTotal',
              balanceAmount: '$balanceAmount',
              dueDate: '$dueDate'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const totalAP = buckets.reduce((sum, b) => sum + b.totalAmount, 0)

    res.json({
      success: true,
      data: {
        vendorId: req.params.vendorId,
        buckets,
        totalAP,
        asOfDate: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================
// COMBINED SUMMARY
// ============================

/**
 * @route   GET /api/aging/summary
 * @desc    Combined AR + AP summary with DSO, DPO, net position
 * @access  Private
 */
router.get('/summary', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    // AR aggregation
    const arBuckets = await CustomerInvoice.aggregate([
      {
        $match: {
          company: companyId,
          paymentStatus: { $in: unpaidStatuses }
        }
      },
      {
        $group: {
          _id: '$agingBucket',
          count: { $sum: 1 },
          totalAmount: { $sum: '$balanceAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // AP aggregation
    const apBuckets = await VendorInvoice.aggregate([
      {
        $match: {
          company: companyId,
          paymentStatus: { $in: unpaidStatuses }
        }
      },
      {
        $addFields: {
          agingBucket: apAgingBucketExpr
        }
      },
      {
        $group: {
          _id: '$agingBucket',
          count: { $sum: 1 },
          totalAmount: { $sum: '$balanceAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const totalAR = arBuckets.reduce((sum, b) => sum + b.totalAmount, 0)
    const totalAP = apBuckets.reduce((sum, b) => sum + b.totalAmount, 0)

    // Revenue for DSO
    const revenueAgg = await CustomerInvoice.aggregate([
      {
        $match: {
          company: companyId,
          invoiceDate: { $gte: oneYearAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$invoiceTotal' }
        }
      }
    ])

    // COGS for DPO
    const cogsAgg = await VendorInvoice.aggregate([
      {
        $match: {
          company: companyId,
          invoiceDate: { $gte: oneYearAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalCOGS: { $sum: '$invoiceTotal' }
        }
      }
    ])

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0
    const totalCOGS = cogsAgg[0]?.totalCOGS || 0

    const dso = totalRevenue > 0 ? Math.round((totalAR / totalRevenue) * 365) : 0
    const dpo = totalCOGS > 0 ? Math.round((totalAP / totalCOGS) * 365) : 0
    const netPosition = totalAR - totalAP

    res.json({
      success: true,
      data: {
        receivable: {
          buckets: arBuckets,
          totalAR,
          dso
        },
        payable: {
          buckets: apBuckets,
          totalAP,
          dpo
        },
        netPosition,
        cashConversionCycle: dso - dpo,
        asOfDate: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
