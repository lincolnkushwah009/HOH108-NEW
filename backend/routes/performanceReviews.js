import express from 'express'
import mongoose from 'mongoose'
import PerformanceReview from '../models/PerformanceReview.js'
import KRA from '../models/KRA.js'
import User from '../models/User.js'
import { protect, setCompanyContext, authorize, requireModulePermission } from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('reviews', 'view'))

/**
 * ===========================================
 * SOX Control: HTR-008 Performance Review with KRA Integration
 * ===========================================
 */

// Get all performance reviews with enhanced filtering
router.get('/', async (req, res) => {
  try {
    const {
      search, status, reviewCycle, reviewer, ratingBand,
      department, page = 1, limit = 50
    } = req.query

    const filter = { company: req.user.company }
    if (status) filter.status = status
    if (reviewCycle) filter.reviewCycle = reviewCycle
    if (reviewer) filter.reviewer = reviewer
    if (ratingBand) filter['scores.ratingBand'] = ratingBand

    let query = PerformanceReview.find(filter)
      .populate('employee', 'name employeeId department designation')
      .populate('reviewer', 'name')
      .populate('secondaryReviewer', 'name')
      .populate('reviewCycle', 'name year')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    const reviews = await query
    const total = await PerformanceReview.countDocuments(filter)

    // Enhanced stats with rating band distribution
    const stats = await PerformanceReview.aggregate([
      { $match: { company: mongoose.Types.ObjectId(req.user.company._id || req.user.company) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          acknowledged: { $sum: { $cond: [{ $eq: ['$status', 'acknowledged'] }, 1, 0] } },
          inCalibration: { $sum: { $cond: [{ $eq: ['$status', 'calibration'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $in: ['$status', ['self_review', 'manager_review']] }, 1, 0] } },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          avgScore: { $avg: '$scores.finalScore' },
          exceptional: { $sum: { $cond: [{ $eq: ['$scores.ratingBand', 'exceptional'] }, 1, 0] } },
          exceedsExpectations: { $sum: { $cond: [{ $eq: ['$scores.ratingBand', 'exceeds_expectations'] }, 1, 0] } },
          meetsExpectations: { $sum: { $cond: [{ $eq: ['$scores.ratingBand', 'meets_expectations'] }, 1, 0] } },
          needsImprovement: { $sum: { $cond: [{ $eq: ['$scores.ratingBand', 'needs_improvement'] }, 1, 0] } },
          unsatisfactory: { $sum: { $cond: [{ $eq: ['$scores.ratingBand', 'unsatisfactory'] }, 1, 0] } }
        }
      }
    ])

    res.json({
      success: true,
      count: reviews.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || {
        total: 0, completed: 0, acknowledged: 0, inCalibration: 0,
        inProgress: 0, draft: 0, avgScore: 0,
        exceptional: 0, exceedsExpectations: 0, meetsExpectations: 0,
        needsImprovement: 0, unsatisfactory: 0
      },
      data: reviews
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get my pending reviews (as employee or reviewer)
router.get('/my-reviews', async (req, res) => {
  try {
    const { role = 'employee' } = req.query

    const filter = { company: req.user.company }
    if (role === 'employee') {
      filter.employee = req.user._id
    } else if (role === 'reviewer') {
      filter.$or = [
        { reviewer: req.user._id },
        { secondaryReviewer: req.user._id }
      ]
    }

    const reviews = await PerformanceReview.find(filter)
      .populate('employee', 'name employeeId department designation')
      .populate('reviewer', 'name')
      .populate('reviewCycle', 'name year')
      .sort({ createdAt: -1 })

    res.json({ success: true, count: reviews.length, data: reviews })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single review with full KRA details
router.get('/:id', async (req, res) => {
  try {
    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .populate('employee', 'name employeeId department designation email')
      .populate('reviewer', 'name email')
      .populate('secondaryReviewer', 'name email')
      .populate('reviewCycle', 'name year startDate endDate')
      .populate('ratings.kra', 'name description category')
      .populate('goals.linkedKRA', 'name')
      .populate('auditTrail.changedBy', 'name')
      .populate('calibration.calibratedBy', 'name')
      .populate('acknowledgedBy', 'name')

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' })
    }

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Initialize new review with KRAs based on employee role
router.post('/initialize', async (req, res) => {
  try {
    const { employeeId, reviewCycleId, reviewerId, reviewPeriod } = req.body

    // Get employee details
    const employee = await User.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' })
    }

    // Get applicable KRAs based on employee's department and role
    const kras = await KRA.find({
      company: req.user.company,
      isActive: true,
      $or: [
        { applicableTo: 'all' },
        { applicableTo: 'department', departments: employee.department },
        { applicableTo: 'role', roles: employee.designation }
      ]
    })

    // Build ratings array from KRAs
    const ratings = kras.map(kra => ({
      kra: kra._id,
      kraCode: kra.kraCode,
      kraName: kra.name,
      kraCategory: kra.category,
      weight: kra.weight,
      linkedKPIs: kra.kpis?.map(k => ({
        kpiName: k.kpiName,
        target: 0,
        actual: 0,
        achievement: 0
      })) || []
    }))

    // Create review
    const review = await PerformanceReview.create({
      company: req.user.company,
      employee: employeeId,
      reviewer: reviewerId,
      reviewCycle: reviewCycleId,
      reviewPeriod,
      ratings,
      status: 'draft',
      createdBy: req.user._id,
      auditTrail: [{
        action: 'created',
        changedBy: req.user._id,
        changedByName: req.user.name,
        changedAt: new Date()
      }]
    })

    await review.populate('employee', 'name employeeId department')
    await review.populate('reviewer', 'name')

    res.status(201).json({ success: true, data: review })
  } catch (error) {
    console.error('Error initializing review:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create review (basic - without KRA initialization)
router.post('/', async (req, res) => {
  try {
    const review = await PerformanceReview.create({
      ...req.body,
      company: req.user.company,
      createdBy: req.user._id,
      auditTrail: [{
        action: 'created',
        changedBy: req.user._id,
        changedByName: req.user.name,
        changedAt: new Date()
      }]
    })

    res.status(201).json({ success: true, data: review })
  } catch (error) {
    console.error('Error creating review:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update review (general)
router.put('/:id', async (req, res) => {
  try {
    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' })
    }

    // Track changes for audit
    const updates = req.body
    Object.keys(updates).forEach(key => {
      if (key !== 'auditTrail' && review[key] !== updates[key]) {
        review.auditTrail.push({
          action: 'rating_changed',
          field: key,
          oldValue: review[key],
          newValue: updates[key],
          changedBy: req.user._id,
          changedByName: req.user.name,
          changedAt: new Date()
        })
      }
    })

    Object.assign(review, updates)
    await review.save()

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ===========================================
// Self-Review Workflow
// ===========================================

// Save self-assessment (draft)
router.put('/:id/self-assessment/save', async (req, res) => {
  try {
    const { ratings, selfAssessment, goals, competencies, strengths } = req.body

    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company,
      employee: req.user._id,
      status: { $in: ['draft', 'self_review'] }
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not editable'
      })
    }

    // Update self-ratings
    if (ratings) {
      ratings.forEach(r => {
        const rating = review.ratings.find(
          rr => rr._id.toString() === r._id || rr.kraCode === r.kraCode
        )
        if (rating) {
          rating.selfRating = r.selfRating
          rating.selfComments = r.selfComments
          rating.selfEvidences = r.selfEvidences || []
        }
      })
    }

    if (selfAssessment) review.selfAssessment = selfAssessment
    if (goals) review.goals = goals
    if (competencies) review.competencies = competencies
    if (strengths) review.strengths = strengths

    review.status = 'self_review'
    await review.save()

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Submit self-assessment
router.put('/:id/self-assessment/submit', async (req, res) => {
  try {
    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company,
      employee: req.user._id,
      status: { $in: ['draft', 'self_review'] }
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or already submitted'
      })
    }

    // Validate all self-ratings are provided
    const missingRatings = review.ratings.filter(r => !r.selfRating)
    if (missingRatings.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please provide self-rating for: ${missingRatings.map(r => r.kraName).join(', ')}`
      })
    }

    // Use model method to submit
    review.submitSelfReview(req.user._id, req.user.name)
    await review.save()

    res.json({ success: true, data: review, message: 'Self-assessment submitted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ===========================================
// Manager Review Workflow
// ===========================================

// Save manager review (draft)
router.put('/:id/manager-review/save', async (req, res) => {
  try {
    const { ratings, managerComments, areasForImprovement, developmentPlan, recommendation } = req.body

    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company,
      $or: [{ reviewer: req.user._id }, { secondaryReviewer: req.user._id }],
      status: 'manager_review'
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not in manager review status'
      })
    }

    // Update manager ratings
    if (ratings) {
      ratings.forEach(r => {
        const rating = review.ratings.find(
          rr => rr._id.toString() === r._id || rr.kraCode === r.kraCode
        )
        if (rating) {
          rating.managerRating = r.managerRating
          rating.managerComments = r.managerComments
        }
      })
    }

    if (managerComments) review.managerComments = managerComments
    if (areasForImprovement) review.areasForImprovement = areasForImprovement
    if (developmentPlan) review.developmentPlan = developmentPlan
    if (recommendation) review.recommendation = recommendation

    // Assess goals
    if (req.body.goals) {
      req.body.goals.forEach(g => {
        const goal = review.goals.find(gg => gg._id.toString() === g._id)
        if (goal) {
          goal.managerAssessment = g.managerAssessment
          goal.status = g.status || goal.status
        }
      })
    }

    await review.save()

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Submit manager review
router.put('/:id/manager-review/submit', async (req, res) => {
  try {
    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company,
      $or: [{ reviewer: req.user._id }, { secondaryReviewer: req.user._id }],
      status: 'manager_review'
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not in manager review status'
      })
    }

    // Validate all manager ratings are provided
    const missingRatings = review.ratings.filter(r => !r.managerRating)
    if (missingRatings.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please provide manager rating for: ${missingRatings.map(r => r.kraName).join(', ')}`
      })
    }

    // Use model method to complete
    review.completeManagerReview(req.user._id, req.user.name)
    await review.save()

    res.json({ success: true, data: review, message: 'Manager review submitted for calibration' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ===========================================
// Calibration Workflow (HR/Leadership)
// ===========================================

// Get reviews pending calibration
router.get('/calibration/pending', authorize('admin', 'hr'), async (req, res) => {
  try {
    const { reviewCycle, department } = req.query

    const filter = {
      company: req.user.company,
      status: 'calibration'
    }
    if (reviewCycle) filter.reviewCycle = reviewCycle

    const reviews = await PerformanceReview.find(filter)
      .populate('employee', 'name employeeId department designation')
      .populate('reviewer', 'name')
      .populate('reviewCycle', 'name')
      .sort({ 'scores.managerTotalWeightedScore': -1 })

    // Group by department if requested
    let result = reviews
    if (department === 'group') {
      const grouped = {}
      reviews.forEach(r => {
        const dept = r.employee?.department || 'Unknown'
        if (!grouped[dept]) grouped[dept] = []
        grouped[dept].push(r)
      })
      result = grouped
    }

    res.json({ success: true, count: reviews.length, data: result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Apply calibration
router.put('/:id/calibrate', authorize('admin', 'hr'), async (req, res) => {
  try {
    const { calibratedRatings, reason, calibrationNotes } = req.body

    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company,
      status: 'calibration'
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not in calibration status'
      })
    }

    // Use model method to apply calibration
    review.applyCalibration(calibratedRatings, req.user._id, req.user.name, reason)
    if (calibrationNotes) review.calibrationNotes = calibrationNotes

    await review.save()

    res.json({ success: true, data: review, message: 'Calibration applied successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Skip calibration (no changes needed)
router.put('/:id/skip-calibration', authorize('admin', 'hr'), async (req, res) => {
  try {
    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company,
      status: 'calibration'
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not in calibration status'
      })
    }

    // Move directly to HR review without calibration changes
    review.status = 'hr_review'
    review.calibration.isCalibrated = false
    review.addAuditEntry('calibrated', 'status', 'calibration', 'hr_review',
      req.user._id, req.user.name, 'No calibration needed')

    await review.save()

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ===========================================
// Finalization Workflow
// ===========================================

// Finalize review (HR)
router.put('/:id/finalize', authorize('admin', 'hr'), async (req, res) => {
  try {
    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company,
      status: 'hr_review'
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not in HR review status'
      })
    }

    review.finalize(req.user._id, req.user.name)
    await review.save()

    res.json({ success: true, data: review, message: 'Review finalized' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Employee acknowledge
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { employeeComments } = req.body

    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company,
      employee: req.user._id,
      status: 'completed'
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or not ready for acknowledgement'
      })
    }

    review.status = 'acknowledged'
    review.acknowledgedAt = new Date()
    review.acknowledgedBy = req.user._id
    if (employeeComments) review.employeeComments = employeeComments

    review.addAuditEntry('acknowledged', 'status', 'completed', 'acknowledged',
      req.user._id, req.user.name)

    await review.save()

    res.json({ success: true, data: review, message: 'Review acknowledged' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Dispute review
router.put('/:id/dispute', async (req, res) => {
  try {
    const { disputeReason } = req.body

    if (!disputeReason) {
      return res.status(400).json({
        success: false,
        message: 'Dispute reason is required'
      })
    }

    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company,
      employee: req.user._id,
      status: 'completed'
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or cannot be disputed'
      })
    }

    review.status = 'disputed'
    review.employeeComments = disputeReason

    review.addAuditEntry('disputed', 'status', 'completed', 'disputed',
      req.user._id, req.user.name, disputeReason)

    await review.save()

    res.json({ success: true, data: review, message: 'Dispute submitted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ===========================================
// Goal Management
// ===========================================

// Add goal to review
router.post('/:id/goals', async (req, res) => {
  try {
    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' })
    }

    const newGoal = {
      goal: req.body.goal,
      description: req.body.description,
      linkedKRA: req.body.linkedKRA,
      kraName: req.body.kraName,
      targetDate: req.body.targetDate,
      priority: req.body.priority || 'medium'
    }

    review.goals.push(newGoal)
    review.addAuditEntry('goal_updated', 'goals', null, newGoal.goal,
      req.user._id, req.user.name, 'Goal added')

    await review.save()

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update goal
router.put('/:id/goals/:goalId', async (req, res) => {
  try {
    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' })
    }

    const goal = review.goals.id(req.params.goalId)
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' })
    }

    const oldStatus = goal.status
    Object.assign(goal, req.body)

    if (req.body.status === 'completed' && !goal.completedDate) {
      goal.completedDate = new Date()
    }

    review.addAuditEntry('goal_updated', 'goals', oldStatus, goal.status,
      req.user._id, req.user.name)

    await review.save()

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ===========================================
// Reports & Statistics
// ===========================================

// Get rating band distribution by department
router.get('/reports/distribution', authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { reviewCycle } = req.query

    const matchFilter = {
      company: mongoose.Types.ObjectId(req.user.company._id || req.user.company),
      status: { $in: ['completed', 'acknowledged'] }
    }
    if (reviewCycle) matchFilter.reviewCycle = mongoose.Types.ObjectId(reviewCycle)

    const distribution = await PerformanceReview.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      { $unwind: '$employeeData' },
      {
        $group: {
          _id: {
            department: '$employeeData.department',
            ratingBand: '$scores.ratingBand'
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$scores.finalScore' }
        }
      },
      {
        $group: {
          _id: '$_id.department',
          ratings: {
            $push: {
              band: '$_id.ratingBand',
              count: '$count',
              avgScore: '$avgScore'
            }
          },
          totalEmployees: { $sum: '$count' },
          overallAvgScore: { $avg: '$avgScore' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({ success: true, data: distribution })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get calibration impact report
router.get('/reports/calibration-impact', authorize('admin', 'hr'), async (req, res) => {
  try {
    const { reviewCycle } = req.query

    const matchFilter = {
      company: mongoose.Types.ObjectId(req.user.company._id || req.user.company),
      'calibration.isCalibrated': true
    }
    if (reviewCycle) matchFilter.reviewCycle = mongoose.Types.ObjectId(reviewCycle)

    const impact = await PerformanceReview.aggregate([
      { $match: matchFilter },
      {
        $project: {
          employee: 1,
          originalScore: '$calibration.originalManagerScore',
          calibratedScore: '$scores.calibratedTotalWeightedScore',
          adjustment: {
            $subtract: ['$scores.calibratedTotalWeightedScore', '$calibration.originalManagerScore']
          },
          adjustmentReason: '$calibration.adjustmentReason'
        }
      },
      {
        $group: {
          _id: null,
          totalCalibrated: { $sum: 1 },
          avgAdjustment: { $avg: '$adjustment' },
          positiveAdjustments: { $sum: { $cond: [{ $gt: ['$adjustment', 0] }, 1, 0] } },
          negativeAdjustments: { $sum: { $cond: [{ $lt: ['$adjustment', 0] }, 1, 0] } },
          noChange: { $sum: { $cond: [{ $eq: ['$adjustment', 0] }, 1, 0] } }
        }
      }
    ])

    res.json({ success: true, data: impact[0] || {} })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get audit trail for a review
router.get('/:id/audit-trail', async (req, res) => {
  try {
    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .select('auditTrail reviewId')
      .populate('auditTrail.changedBy', 'name')

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' })
    }

    res.json({
      success: true,
      reviewId: review.reviewId,
      data: review.auditTrail.sort((a, b) => b.changedAt - a.changedAt)
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete review
router.delete('/:id', authorize('admin', 'hr'), async (req, res) => {
  try {
    const review = await PerformanceReview.findOne({
      _id: req.params.id,
      company: req.user.company,
      status: 'draft' // Can only delete drafts
    })

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or cannot be deleted'
      })
    }

    await review.deleteOne()

    res.json({ success: true, message: 'Review deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Legacy endpoints for backward compatibility

// Submit self-assessment (legacy)
router.put('/:id/self-assess', async (req, res) => {
  try {
    const review = await PerformanceReview.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      {
        selfAssessment: req.body.selfAssessment,
        'ratings': req.body.ratings,
        status: 'manager_review',
        submittedAt: new Date()
      },
      { new: true }
    )

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' })
    }

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Complete manager review (legacy)
router.put('/:id/complete', async (req, res) => {
  try {
    const review = await PerformanceReview.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      {
        ...req.body,
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    )

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' })
    }

    res.json({ success: true, data: review })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
