import mongoose from 'mongoose'

const vendorPerformanceSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  // Review period
  reviewPeriod: {
    startDate: Date,
    endDate: Date,
    quarter: String, // e.g., 'Q1 2025'
    year: Number
  },

  // 7 Rating Criteria (1-5 scale each)
  ratings: {
    // 1. Quality of Work / Material
    quality: {
      score: { type: Number, min: 1, max: 5 },
      notes: String
    },
    // 2. Timeliness / Delivery Adherence
    timeliness: {
      score: { type: Number, min: 1, max: 5 },
      notes: String
    },
    // 3. Cost Competitiveness
    costCompetitiveness: {
      score: { type: Number, min: 1, max: 5 },
      notes: String
    },
    // 4. Communication & Coordination
    communication: {
      score: { type: Number, min: 1, max: 5 },
      notes: String
    },
    // 5. Safety / Compliance (for on-site)
    safetyCompliance: {
      score: { type: Number, min: 1, max: 5 },
      notes: String
    },
    // 6. Reliability / Consistency
    reliability: {
      score: { type: Number, min: 1, max: 5 },
      notes: String
    },
    // 7. Documentation & Payment Discipline
    documentation: {
      score: { type: Number, min: 1, max: 5 },
      notes: String
    }
  },

  // Calculated fields
  averageRating: {
    type: Number,
    min: 1,
    max: 5
  },

  // Status based on average score
  // 4.5-5.0: Preferred/Core Vendor
  // 3.5-4.4: Continue/Retain
  // 2.5-3.4: Monitor/Improve
  // 1.5-2.4: Put On Hold/Review
  // <1.5: Remove/Blacklist
  performanceStatus: {
    type: String,
    enum: ['preferred', 'retain', 'monitor', 'hold', 'remove'],
    default: 'retain'
  },

  // Feedback
  keyIssues: String,
  improvementActions: String,
  strengths: String,

  // Review info
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: {
    type: Date,
    default: Date.now
  },
  nextReviewDate: Date,

  // Linked projects for reference
  relatedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],
  relatedPOs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder'
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Calculate average rating and determine status before saving
vendorPerformanceSchema.pre('save', function(next) {
  const r = this.ratings
  const scores = []

  if (r.quality?.score) scores.push(r.quality.score)
  if (r.timeliness?.score) scores.push(r.timeliness.score)
  if (r.costCompetitiveness?.score) scores.push(r.costCompetitiveness.score)
  if (r.communication?.score) scores.push(r.communication.score)
  if (r.safetyCompliance?.score) scores.push(r.safetyCompliance.score)
  if (r.reliability?.score) scores.push(r.reliability.score)
  if (r.documentation?.score) scores.push(r.documentation.score)

  if (scores.length > 0) {
    this.averageRating = scores.reduce((a, b) => a + b, 0) / scores.length

    // Determine status based on average
    if (this.averageRating >= 4.5) {
      this.performanceStatus = 'preferred'
    } else if (this.averageRating >= 3.5) {
      this.performanceStatus = 'retain'
    } else if (this.averageRating >= 2.5) {
      this.performanceStatus = 'monitor'
    } else if (this.averageRating >= 1.5) {
      this.performanceStatus = 'hold'
    } else {
      this.performanceStatus = 'remove'
    }
  }

  next()
})

// Indexes
vendorPerformanceSchema.index({ company: 1, vendor: 1 })
vendorPerformanceSchema.index({ company: 1, performanceStatus: 1 })
vendorPerformanceSchema.index({ company: 1, reviewDate: -1 })
vendorPerformanceSchema.index({ vendor: 1, reviewDate: -1 })

const VendorPerformance = mongoose.model('VendorPerformance', vendorPerformanceSchema)

export default VendorPerformance
