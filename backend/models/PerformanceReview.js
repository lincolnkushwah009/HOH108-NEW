import mongoose from 'mongoose'

/**
 * ===========================================
 * SOX Control: HTR-008 Performance Review with KRA Integration
 * ===========================================
 */

// KRA Rating sub-schema with detailed scoring
const kraRatingSchema = new mongoose.Schema({
  kra: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KRA'
  },
  kraCode: String,
  kraName: String,
  kraCategory: String,
  weight: { type: Number, min: 0, max: 100, default: 10 },

  // Self Assessment
  selfRating: { type: Number, min: 1, max: 5 },
  selfComments: String,
  selfEvidences: [String], // Links to supporting documents/achievements

  // Manager Assessment
  managerRating: { type: Number, min: 1, max: 5 },
  managerComments: String,

  // Calibrated Rating (after HR/leadership calibration)
  calibratedRating: { type: Number, min: 1, max: 5 },
  calibrationComments: String,

  // Calculated weighted scores
  selfWeightedScore: { type: Number, default: 0 },
  managerWeightedScore: { type: Number, default: 0 },
  finalWeightedScore: { type: Number, default: 0 },

  // Linked KPIs for objective measurement
  linkedKPIs: [{
    kpiName: String,
    target: Number,
    actual: Number,
    achievement: Number, // percentage
    unit: String
  }]
}, { _id: true })

// Goal sub-schema linked to KRAs
const goalSchema = new mongoose.Schema({
  goal: { type: String, required: true },
  description: String,
  linkedKRA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KRA'
  },
  kraName: String,
  targetDate: Date,
  completedDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'deferred', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  managerAssessment: {
    rating: { type: Number, min: 1, max: 5 },
    comments: String
  },
  evidences: [String]
}, { _id: true })

const performanceReviewSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  reviewId: {
    type: String,
    unique: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewCycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewCycle'
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  secondaryReviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewPeriod: {
    startDate: Date,
    endDate: Date
  },

  // ===========================================
  // KRA-based Ratings
  // ===========================================
  ratings: [kraRatingSchema],

  // Weighted Score Calculations
  scores: {
    selfTotalWeightedScore: { type: Number, default: 0 },
    managerTotalWeightedScore: { type: Number, default: 0 },
    calibratedTotalWeightedScore: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 },
    ratingBand: {
      type: String,
      enum: ['exceptional', 'exceeds_expectations', 'meets_expectations', 'needs_improvement', 'unsatisfactory']
    }
  },

  // Legacy: overall rating (for backward compatibility)
  overallRating: {
    type: Number,
    min: 1,
    max: 5
  },

  // ===========================================
  // Goals linked to KRAs
  // ===========================================
  goals: [goalSchema],
  goalsSummary: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    inProgress: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }
  },

  // Competency Assessment (soft skills)
  competencies: [{
    name: String,
    category: {
      type: String,
      enum: ['leadership', 'teamwork', 'communication', 'problem_solving', 'technical', 'customer_focus', 'innovation']
    },
    selfRating: { type: Number, min: 1, max: 5 },
    managerRating: { type: Number, min: 1, max: 5 },
    comments: String
  }],

  // Qualitative Feedback
  strengths: [String],
  areasForImprovement: [String],
  developmentPlan: [{
    area: String,
    action: String,
    timeline: String,
    support: String
  }],

  // Comments
  selfAssessment: String,
  managerComments: String,
  employeeComments: String,
  calibrationNotes: String,

  // ===========================================
  // Workflow Status
  // ===========================================
  status: {
    type: String,
    enum: ['draft', 'self_review', 'manager_review', 'calibration', 'hr_review', 'completed', 'acknowledged', 'disputed'],
    default: 'draft'
  },

  // Workflow Timestamps
  submittedAt: Date, // Employee submitted self-review
  managerReviewedAt: Date,
  calibratedAt: Date,
  completedAt: Date,
  acknowledgedAt: Date,
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Calibration tracking (for SOX compliance)
  calibration: {
    isCalibrated: { type: Boolean, default: false },
    calibratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    calibratedAt: Date,
    originalManagerScore: Number,
    adjustmentReason: String
  },

  // Promotion/Increment Recommendation
  recommendation: {
    promotionRecommended: { type: Boolean, default: false },
    incrementRecommended: { type: Boolean, default: false },
    incrementPercentage: Number,
    comments: String,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },

  // ===========================================
  // SOX Audit Trail
  // ===========================================
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'self_submitted', 'manager_reviewed', 'calibrated', 'completed', 'acknowledged',
             'rating_changed', 'goal_updated', 'disputed', 'reopened']
    },
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    changedAt: { type: Date, default: Date.now },
    reason: String,
    ipAddress: String
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Sales Performance & Incentive Data
  targetData: {
    role: String,
    targets: mongoose.Schema.Types.Mixed,       // { revenue, conversionRate, totalCalls, etc. }
    actuals: mongoose.Schema.Types.Mixed,        // Actual achievement values
    achievementPercent: Number,                  // Overall target achievement %
    incentiveEligible: Boolean,
    incentiveAmount: { type: Number, default: 0 },
    incentiveStatus: {
      type: String,
      enum: ['not_eligible', 'pending', 'approved', 'paid'],
      default: 'not_eligible'
    }
  }
}, { timestamps: true })

performanceReviewSchema.index({ company: 1, employee: 1 })
performanceReviewSchema.index({ company: 1, reviewCycle: 1 })
performanceReviewSchema.index({ company: 1, status: 1 })
performanceReviewSchema.index({ company: 1, reviewer: 1, status: 1 })
performanceReviewSchema.index({ company: 1, 'scores.ratingBand': 1 })

// Generate review ID and calculate scores
performanceReviewSchema.pre('save', async function(next) {
  // Generate review ID
  if (!this.reviewId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const yy = String(date.getFullYear()).slice(-2)
    this.reviewId = `REV-${yy}-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate weighted scores for each KRA rating
  if (this.ratings && this.ratings.length > 0) {
    let selfTotal = 0
    let managerTotal = 0
    let calibratedTotal = 0
    let totalWeight = 0

    this.ratings.forEach(rating => {
      const weight = rating.weight || 0
      totalWeight += weight

      if (rating.selfRating) {
        rating.selfWeightedScore = (rating.selfRating * weight) / 100
        selfTotal += rating.selfWeightedScore
      }

      if (rating.managerRating) {
        rating.managerWeightedScore = (rating.managerRating * weight) / 100
        managerTotal += rating.managerWeightedScore
      }

      const finalRating = rating.calibratedRating || rating.managerRating || rating.selfRating
      if (finalRating) {
        rating.finalWeightedScore = (finalRating * weight) / 100
        calibratedTotal += rating.finalWeightedScore
      }
    })

    // Normalize scores if weights don't add up to 100
    const normalizer = totalWeight > 0 ? 100 / totalWeight : 1

    this.scores = {
      selfTotalWeightedScore: Math.round(selfTotal * normalizer * 100) / 100,
      managerTotalWeightedScore: Math.round(managerTotal * normalizer * 100) / 100,
      calibratedTotalWeightedScore: Math.round(calibratedTotal * normalizer * 100) / 100,
      finalScore: Math.round(calibratedTotal * normalizer * 100) / 100,
      ratingBand: this.getRatingBand(calibratedTotal * normalizer)
    }

    // Set overall rating for backward compatibility
    this.overallRating = Math.round(this.scores.finalScore)
  }

  // Calculate goals summary
  if (this.goals && this.goals.length > 0) {
    const total = this.goals.length
    const completed = this.goals.filter(g => g.status === 'completed').length
    const inProgress = this.goals.filter(g => g.status === 'in_progress').length
    const pending = this.goals.filter(g => g.status === 'pending').length

    this.goalsSummary = {
      total,
      completed,
      inProgress,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }

  next()
})

// Method to get rating band from score
performanceReviewSchema.methods.getRatingBand = function(score) {
  if (score >= 4.5) return 'exceptional'
  if (score >= 3.5) return 'exceeds_expectations'
  if (score >= 2.5) return 'meets_expectations'
  if (score >= 1.5) return 'needs_improvement'
  return 'unsatisfactory'
}

// Also make it available as a schema method for pre-save
performanceReviewSchema.methods.getRatingBand = function(score) {
  if (score >= 4.5) return 'exceptional'
  if (score >= 3.5) return 'exceeds_expectations'
  if (score >= 2.5) return 'meets_expectations'
  if (score >= 1.5) return 'needs_improvement'
  return 'unsatisfactory'
}

// Helper function for pre-save (can't use this.methods in pre-save)
function getRatingBand(score) {
  if (score >= 4.5) return 'exceptional'
  if (score >= 3.5) return 'exceeds_expectations'
  if (score >= 2.5) return 'meets_expectations'
  if (score >= 1.5) return 'needs_improvement'
  return 'unsatisfactory'
}

// Override the pre-save to use the helper
performanceReviewSchema.pre('save', async function(next) {
  // Update the scores.ratingBand using the helper
  if (this.scores && this.scores.finalScore) {
    this.scores.ratingBand = getRatingBand(this.scores.finalScore)
  }
  next()
})

// Method to add audit entry
performanceReviewSchema.methods.addAuditEntry = function(action, field, oldValue, newValue, userId, userName, reason, ipAddress) {
  this.auditTrail.push({
    action,
    field,
    oldValue,
    newValue,
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date(),
    reason,
    ipAddress
  })
}

// Method to submit self-review
performanceReviewSchema.methods.submitSelfReview = function(userId, userName) {
  this.status = 'manager_review'
  this.submittedAt = new Date()
  this.addAuditEntry('self_submitted', 'status', 'self_review', 'manager_review', userId, userName)
  return this
}

// Method to complete manager review
performanceReviewSchema.methods.completeManagerReview = function(userId, userName) {
  this.status = 'calibration'
  this.managerReviewedAt = new Date()
  this.addAuditEntry('manager_reviewed', 'status', 'manager_review', 'calibration', userId, userName)
  return this
}

// Method to apply calibration
performanceReviewSchema.methods.applyCalibration = function(calibratedRatings, userId, userName, reason) {
  const originalScore = this.scores.managerTotalWeightedScore

  // Apply calibrated ratings
  calibratedRatings.forEach(cr => {
    const rating = this.ratings.find(r => r._id.toString() === cr.ratingId || r.kraCode === cr.kraCode)
    if (rating) {
      rating.calibratedRating = cr.calibratedRating
      rating.calibrationComments = cr.comments
    }
  })

  this.calibration = {
    isCalibrated: true,
    calibratedBy: userId,
    calibratedAt: new Date(),
    originalManagerScore: originalScore,
    adjustmentReason: reason
  }

  this.status = 'hr_review'
  this.calibratedAt = new Date()
  this.addAuditEntry('calibrated', 'scores', originalScore, null, userId, userName, reason)

  return this
}

// Method to finalize review
performanceReviewSchema.methods.finalize = function(userId, userName) {
  this.status = 'completed'
  this.completedAt = new Date()
  this.addAuditEntry('completed', 'status', this.status, 'completed', userId, userName)
  return this
}

// Static method to get review statistics by department
performanceReviewSchema.statics.getStatsByDepartment = async function(companyId, reviewCycleId) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        reviewCycle: mongoose.Types.ObjectId(reviewCycleId)
      }
    },
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
        _id: '$employeeData.department',
        count: { $sum: 1 },
        avgScore: { $avg: '$scores.finalScore' },
        exceptional: { $sum: { $cond: [{ $eq: ['$scores.ratingBand', 'exceptional'] }, 1, 0] } },
        exceedsExpectations: { $sum: { $cond: [{ $eq: ['$scores.ratingBand', 'exceeds_expectations'] }, 1, 0] } },
        meetsExpectations: { $sum: { $cond: [{ $eq: ['$scores.ratingBand', 'meets_expectations'] }, 1, 0] } },
        needsImprovement: { $sum: { $cond: [{ $eq: ['$scores.ratingBand', 'needs_improvement'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $ne: ['$status', 'completed'] }, 1, 0] } }
      }
    }
  ])
}

const PerformanceReview = mongoose.model('PerformanceReview', performanceReviewSchema)
export default PerformanceReview
