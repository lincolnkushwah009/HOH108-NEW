import express from 'express'
import VendorPerformance from '../models/VendorPerformance.js'
import Vendor from '../models/Vendor.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// Get all vendor performance reviews
router.get('/', async (req, res) => {
  try {
    const {
      vendor,
      performanceStatus,
      year,
      quarter,
      page = 1,
      limit = 20,
      sortBy = 'reviewDate',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (vendor) queryFilter.vendor = vendor
    if (performanceStatus) queryFilter.performanceStatus = performanceStatus
    if (year) queryFilter['reviewPeriod.year'] = parseInt(year)
    if (quarter) queryFilter['reviewPeriod.quarter'] = quarter

    const total = await VendorPerformance.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const reviews = await VendorPerformance.find(queryFilter)
      .populate('vendor', 'name vendorId category vendorType')
      .populate('reviewedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get performance summary by status
router.get('/summary', async (req, res) => {
  try {
    const queryFilter = companyScopedQuery(req)

    const summary = await VendorPerformance.aggregate([
      { $match: queryFilter },
      {
        $group: {
          _id: '$performanceStatus',
          count: { $sum: 1 },
          avgRating: { $avg: '$averageRating' }
        }
      },
      { $sort: { avgRating: -1 } }
    ])

    // Get top and bottom performers
    const topPerformers = await VendorPerformance.find({
      ...queryFilter,
      performanceStatus: 'preferred'
    })
      .populate('vendor', 'name vendorId')
      .sort({ averageRating: -1 })
      .limit(5)

    const needsAttention = await VendorPerformance.find({
      ...queryFilter,
      performanceStatus: { $in: ['monitor', 'hold', 'remove'] }
    })
      .populate('vendor', 'name vendorId')
      .sort({ averageRating: 1 })
      .limit(5)

    res.json({
      success: true,
      data: {
        summary,
        topPerformers,
        needsAttention
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get performance history for a specific vendor
router.get('/vendor/:vendorId', async (req, res) => {
  try {
    const queryFilter = companyScopedQuery(req)
    queryFilter.vendor = req.params.vendorId

    const reviews = await VendorPerformance.find(queryFilter)
      .populate('reviewedBy', 'name')
      .sort({ reviewDate: -1 })

    // Calculate trend
    const avgRatings = reviews.map(r => r.averageRating)
    const trend = avgRatings.length >= 2
      ? avgRatings[0] > avgRatings[1] ? 'improving' : avgRatings[0] < avgRatings[1] ? 'declining' : 'stable'
      : 'insufficient_data'

    res.json({
      success: true,
      data: {
        reviews,
        trend,
        latestRating: reviews[0]?.averageRating,
        latestStatus: reviews[0]?.performanceStatus
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single performance review
router.get('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id }
    if (req.activeCompany?._id) {
      query.company = req.activeCompany._id
    }

    const review = await VendorPerformance.findOne(query)
      .populate('vendor', 'name vendorId category vendorType phone email')
      .populate('reviewedBy', 'name')
      .populate('createdBy', 'name')
      .populate('relatedProjects', 'projectName projectNumber')
      .populate('relatedPOs', 'poNumber')

    if (!review) {
      return res.status(404).json({ success: false, message: 'Performance review not found' })
    }

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create performance review
router.post('/', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to create a performance review'
      })
    }

    // Verify vendor exists
    const vendor = await Vendor.findOne({
      _id: req.body.vendor,
      company: req.activeCompany._id
    })

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    const review = await VendorPerformance.create({
      ...req.body,
      company: req.activeCompany._id,
      reviewedBy: req.user._id,
      createdBy: req.user._id
    })

    // Update vendor's overall rating
    await updateVendorRating(req.body.vendor, req.activeCompany._id)

    const populatedReview = await VendorPerformance.findById(review._id)
      .populate('vendor', 'name vendorId')
      .populate('reviewedBy', 'name')

    res.status(201).json({ success: true, data: populatedReview })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update performance review
router.put('/:id', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company'
      })
    }

    const review = await VendorPerformance.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!review) {
      return res.status(404).json({ success: false, message: 'Performance review not found' })
    }

    Object.assign(review, req.body)
    await review.save()

    // Update vendor's overall rating
    await updateVendorRating(review.vendor, req.activeCompany._id)

    const populatedReview = await VendorPerformance.findById(review._id)
      .populate('vendor', 'name vendorId')
      .populate('reviewedBy', 'name')

    res.json({ success: true, data: populatedReview })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete performance review
router.delete('/:id', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company'
      })
    }

    const review = await VendorPerformance.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!review) {
      return res.status(404).json({ success: false, message: 'Performance review not found' })
    }

    // Update vendor's overall rating after deletion
    await updateVendorRating(review.vendor, req.activeCompany._id)

    res.json({ success: true, message: 'Performance review deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Helper function to update vendor's overall rating
async function updateVendorRating(vendorId, companyId) {
  try {
    const reviews = await VendorPerformance.find({
      vendor: vendorId,
      company: companyId
    }).sort({ reviewDate: -1 })

    if (reviews.length === 0) {
      await Vendor.findByIdAndUpdate(vendorId, { rating: null })
      return
    }

    // Calculate weighted average (more recent reviews have higher weight)
    let totalWeight = 0
    let weightedSum = 0

    reviews.forEach((review, index) => {
      const weight = 1 / (index + 1) // Most recent has weight 1, second has 0.5, etc.
      weightedSum += review.averageRating * weight
      totalWeight += weight
    })

    const overallRating = Math.round((weightedSum / totalWeight) * 10) / 10

    await Vendor.findByIdAndUpdate(vendorId, { rating: overallRating })
  } catch (error) {
    console.error('Error updating vendor rating:', error)
  }
}

export default router
