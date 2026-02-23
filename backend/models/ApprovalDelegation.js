import mongoose from 'mongoose'

/**
 * ApprovalDelegation - Approval authority delegation
 *
 * Allows users to delegate their approval authority to another user
 * for a specific time period and set of modules (e.g., during leave).
 */

const approvalDelegationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  delegator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  delegate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  modules: [{
    type: String
  }],

  reason: {
    type: String
  },

  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes
approvalDelegationSchema.index({ company: 1, delegator: 1, status: 1 })
approvalDelegationSchema.index({ endDate: 1 })
approvalDelegationSchema.index({ company: 1, delegate: 1, status: 1 })
approvalDelegationSchema.index({ company: 1, status: 1 })

// Validate delegator !== delegate
approvalDelegationSchema.pre('save', function(next) {
  if (this.delegator && this.delegate && this.delegator.toString() === this.delegate.toString()) {
    return next(new Error('Delegator and delegate cannot be the same user'))
  }

  // Validate endDate > startDate
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'))
  }

  // Auto-expire if endDate has passed
  if (this.endDate && new Date() > this.endDate && this.status === 'active') {
    this.status = 'expired'
  }

  next()
})

// Static method: Find active delegation for a user in a module
approvalDelegationSchema.statics.findActiveDelegation = async function(companyId, delegatorId, module) {
  const now = new Date()
  return this.findOne({
    company: companyId,
    delegator: delegatorId,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { modules: { $size: 0 } },
      { modules: module }
    ]
  }).populate('delegate', 'name email')
}

// Static method: Expire all past-due delegations
approvalDelegationSchema.statics.expireOverdue = async function() {
  const now = new Date()
  return this.updateMany(
    { status: 'active', endDate: { $lt: now } },
    { $set: { status: 'expired' } }
  )
}

const ApprovalDelegation = mongoose.model('ApprovalDelegation', approvalDelegationSchema)

export default ApprovalDelegation
