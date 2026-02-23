import mongoose from 'mongoose'

/**
 * ExitManagement - Offboarding and Final Settlement (F&F)
 *
 * Manages the complete employee exit lifecycle including notice period,
 * handover, exit interview, checklist tracking, and final settlement processing.
 */

const checklistItemSchema = new mongoose.Schema({
  item: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedAt: {
    type: Date
  },
  remarks: {
    type: String
  }
}, { _id: true })

const exitManagementSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  exitId: {
    type: String,
    unique: true
  },

  exitType: {
    type: String,
    enum: ['resignation', 'termination', 'retirement', 'end_of_contract'],
    required: true
  },

  status: {
    type: String,
    enum: ['initiated', 'notice_period', 'handover', 'exit_interview', 'fnf_processing', 'completed'],
    default: 'initiated'
  },

  resignationDate: {
    type: Date,
    required: true
  },

  lastWorkingDate: {
    type: Date
  },

  noticePeriodDays: {
    type: Number,
    default: 30
  },

  noticePeriodWaived: {
    type: Boolean,
    default: false
  },

  exitInterviewCompleted: {
    type: Boolean,
    default: false
  },

  exitInterviewNotes: {
    type: String
  },

  checklist: [checklistItemSchema],

  fnf: {
    basicPay: {
      type: Number,
      default: 0
    },
    leavePayout: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    gratuity: {
      type: Number,
      default: 0
    },
    deductions: {
      type: Number,
      default: 0
    },
    netPayable: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'calculated', 'approved', 'paid'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paidAt: {
      type: Date
    }
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
exitManagementSchema.index({ company: 1, employee: 1 })
exitManagementSchema.index({ company: 1, status: 1 })
exitManagementSchema.index({ company: 1, exitType: 1 })
exitManagementSchema.index({ company: 1, lastWorkingDate: -1 })
exitManagementSchema.index({ 'fnf.status': 1 })
exitManagementSchema.index({ resignationDate: -1 })

// Generate exitId and calculate netPayable before save
exitManagementSchema.pre('save', async function(next) {
  if (this.isNew && !this.exitId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.exitId = `EXIT-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate F&F net payable
  if (this.fnf) {
    this.fnf.netPayable =
      (this.fnf.basicPay || 0) +
      (this.fnf.leavePayout || 0) +
      (this.fnf.bonus || 0) +
      (this.fnf.gratuity || 0) -
      (this.fnf.deductions || 0)
  }

  // Calculate last working date from resignation date + notice period
  if (this.resignationDate && this.noticePeriodDays && !this.lastWorkingDate) {
    if (this.noticePeriodWaived) {
      this.lastWorkingDate = this.resignationDate
    } else {
      const lwd = new Date(this.resignationDate)
      lwd.setDate(lwd.getDate() + this.noticePeriodDays)
      this.lastWorkingDate = lwd
    }
  }

  next()
})

const ExitManagement = mongoose.model('ExitManagement', exitManagementSchema)

export default ExitManagement
