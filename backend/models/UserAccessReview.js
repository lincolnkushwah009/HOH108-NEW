import mongoose from 'mongoose'

/**
 * UserAccessReview - Periodic access review campaigns
 *
 * Tracks scheduled reviews of user access, permissions, and roles.
 * Supports quarterly, annual, and ad-hoc review cycles.
 */

const reviewEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentRole: {
    type: String,
    required: true
  },
  permissions: [{
    type: String
  }],
  lastLogin: {
    type: Date
  },
  reviewStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'revoked', 'modified'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  comments: {
    type: String
  }
}, { _id: true })

const userAccessReviewSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  reviewId: {
    type: String,
    unique: true
  },

  reviewPeriod: {
    from: {
      type: Date,
      required: true
    },
    to: {
      type: Date,
      required: true
    }
  },

  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'overdue'],
    default: 'scheduled'
  },

  reviewType: {
    type: String,
    enum: ['quarterly', 'annual', 'ad_hoc'],
    required: true
  },

  reviewEntries: [reviewEntrySchema],

  scheduledDate: {
    type: Date,
    required: true
  },

  completedDate: {
    type: Date
  },

  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes
userAccessReviewSchema.index({ company: 1, status: 1 })
userAccessReviewSchema.index({ company: 1, reviewType: 1 })
userAccessReviewSchema.index({ company: 1, scheduledDate: -1 })
userAccessReviewSchema.index({ 'reviewEntries.user': 1, 'reviewEntries.reviewStatus': 1 })
userAccessReviewSchema.index({ initiatedBy: 1 })

// Generate reviewId before save
userAccessReviewSchema.pre('save', async function(next) {
  if (this.isNew && !this.reviewId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.reviewId = `UAR-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

const UserAccessReview = mongoose.model('UserAccessReview', userAccessReviewSchema)

export default UserAccessReview
