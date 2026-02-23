import mongoose from 'mongoose'

const karmaTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'bonus', 'referral', 'expired', 'adjustment'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  source: {
    type: String,
    enum: ['spin-wheel', 'referral', 'project-completion', 'review', 'signup-bonus', 'admin-bonus', 'redemption', 'other'],
    required: true
  },
  description: {
    type: String
  },
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  expiresAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

export default mongoose.model('KarmaTransaction', karmaTransactionSchema)
