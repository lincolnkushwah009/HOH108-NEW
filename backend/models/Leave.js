import mongoose from 'mongoose'

const leaveSchema = new mongoose.Schema({
  // Leave ID (e.g., IP-LV-2024-00001)
  leaveId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Employee
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Company
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Leave Type
  leaveType: {
    type: String,
    enum: ['casual', 'sick', 'earned', 'maternity', 'paternity', 'unpaid', 'compensatory', 'bereavement', 'marriage'],
    required: true
  },

  // Leave Dates
  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  // Duration
  duration: {
    days: { type: Number, required: true },
    isHalfDay: { type: Boolean, default: false },
    halfDayType: {
      type: String,
      enum: ['first-half', 'second-half', 'first_half', 'second_half']
    }
  },

  // Reason
  reason: {
    type: String,
    required: [true, 'Please provide a reason for leave'],
    trim: true
  },

  // Supporting Documents
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Emergency Contact (while on leave)
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'revoked'],
    default: 'pending'
  },

  // Approval Chain
  approvers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comment: String,
    actionAt: Date,
    level: Number // 1 = first approver, 2 = second, etc.
  }],

  // Current Approver Level
  currentApproverLevel: {
    type: Number,
    default: 1
  },

  // Final Approver
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvedAt: Date,

  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  rejectedAt: Date,
  rejectionReason: String,

  // Cancellation
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  cancelledAt: Date,
  cancellationReason: String,

  // Leave Balance at time of request
  balanceAtRequest: {
    type: Number
  },

  // Notes
  notes: String,

  // Manager Comments
  managerComments: String,

  // Handover Details
  handover: {
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tasks: String,
    acknowledged: { type: Boolean, default: false }
  },

  // Activity Log
  activities: [{
    action: {
      type: String,
      enum: ['created', 'approved', 'rejected', 'cancelled', 'modified', 'comment_added']
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: String,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
})

// Indexes (leaveId already indexed via unique: true)
leaveSchema.index({ company: 1, employee: 1 })
leaveSchema.index({ company: 1, status: 1 })
leaveSchema.index({ company: 1, startDate: 1, endDate: 1 })
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 })

// Calculate duration before save
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const start = new Date(this.startDate)
    const end = new Date(this.endDate)

    // Calculate business days
    let days = 0
    const current = new Date(start)

    while (current <= end) {
      const dayOfWeek = current.getDay()
      // Count all days except Sunday (0)
      if (dayOfWeek !== 0) {
        days++
      }
      current.setDate(current.getDate() + 1)
    }

    // Half day adjustment
    if (this.duration.isHalfDay) {
      days = 0.5
    }

    this.duration.days = days
  }
  next()
})

// Static method to get leave balance
leaveSchema.statics.getBalance = async function(employeeId, companyId, year) {
  const User = mongoose.model('User')
  const Department = mongoose.model('Department')

  const user = await User.findById(employeeId).populate('department')

  // Get department leave quotas or use defaults
  let quotas = {
    casual: 12,
    sick: 12,
    earned: 15,
    maternity: 180,
    paternity: 15,
    unpaid: 30
  }

  if (user.department) {
    const dept = await Department.findOne({
      company: companyId,
      code: user.department
    })
    if (dept?.leaveQuotas) {
      quotas = { ...quotas, ...dept.leaveQuotas }
    }
  }

  // Get leaves taken
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31)

  const leavesTaken = await this.aggregate([
    {
      $match: {
        employee: employeeId,
        company: companyId,
        status: { $in: ['approved', 'pending'] },
        startDate: { $gte: startOfYear, $lte: endOfYear }
      }
    },
    {
      $group: {
        _id: '$leaveType',
        totalDays: { $sum: '$duration.days' }
      }
    }
  ])

  // Calculate balance
  const balance = {}
  Object.keys(quotas).forEach(type => {
    const taken = leavesTaken.find(l => l._id === type)?.totalDays || 0
    balance[type] = {
      total: quotas[type],
      taken: taken,
      pending: 0, // Can be calculated separately
      available: quotas[type] - taken
    }
  })

  return balance
}

// Static method to check for overlapping leaves
leaveSchema.statics.checkOverlap = async function(employeeId, startDate, endDate, excludeId = null) {
  const query = {
    employee: employeeId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  }

  if (excludeId) {
    query._id = { $ne: excludeId }
  }

  const overlapping = await this.findOne(query)
  return !!overlapping
}

export default mongoose.model('Leave', leaveSchema)
