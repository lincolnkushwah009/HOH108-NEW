import mongoose from 'mongoose'

const reviewCycleSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  cycleCode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  cycleType: {
    type: String,
    enum: ['annual', 'semi_annual', 'quarterly', 'monthly', 'custom'],
    default: 'annual'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  selfReviewDeadline: Date,
  managerReviewDeadline: Date,
  calibrationDeadline: Date,
  status: {
    type: String,
    enum: ['draft', 'active', 'self_review', 'manager_review', 'calibration', 'completed', 'cancelled'],
    default: 'draft'
  },
  participants: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'self_review', 'manager_review', 'completed'],
      default: 'pending'
    }
  }],
  kras: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KRA'
  }],
  ratingScale: {
    type: Number,
    default: 5
  },
  settings: {
    allowSelfRating: { type: Boolean, default: true },
    requireComments: { type: Boolean, default: true },
    showPeerFeedback: { type: Boolean, default: false }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true })

reviewCycleSchema.index({ company: 1, cycleCode: 1 }, { unique: true })
reviewCycleSchema.index({ company: 1, status: 1 })

reviewCycleSchema.pre('save', async function(next) {
  if (!this.cycleCode) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const yy = String(date.getFullYear()).slice(-2)
    this.cycleCode = `RC-${yy}-${String(count + 1).padStart(3, '0')}`
  }
  next()
})

const ReviewCycle = mongoose.model('ReviewCycle', reviewCycleSchema)
export default ReviewCycle
