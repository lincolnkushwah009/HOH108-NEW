import mongoose from 'mongoose'

const advanceRequestSchema = new mongoose.Schema({
  // Advance Request ID (e.g., IP-ADV-2024-00001)
  advanceId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Employee requesting advance
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

  // Advance Type
  advanceType: {
    type: String,
    enum: ['salary_advance', 'travel_advance', 'project_advance', 'emergency_advance', 'other'],
    required: true
  },

  // Amount Details
  requestedAmount: {
    type: Number,
    required: [true, 'Please provide the advance amount'],
    min: [100, 'Minimum advance amount is 100']
  },

  approvedAmount: {
    type: Number,
    default: 0
  },

  currency: {
    type: String,
    default: 'INR'
  },

  // Purpose/Reason
  purpose: {
    type: String,
    required: [true, 'Please provide the purpose for advance'],
    trim: true,
    maxlength: 500
  },

  // Related entities (optional)
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  // Repayment Details
  repaymentPlan: {
    type: String,
    enum: ['single_deduction', 'emi', 'project_completion'],
    default: 'single_deduction'
  },

  emiMonths: {
    type: Number,
    min: 1,
    max: 12
  },

  deductionStartMonth: {
    type: Date
  },

  // Status tracking
  status: {
    type: String,
    enum: [
      'draft',
      'pending_hr',           // Submitted, awaiting HR approval
      'hr_approved',          // HR approved, pending finance
      'hr_rejected',          // HR rejected
      'pending_finance',      // Transferred to finance
      'finance_approved',     // Finance approved
      'finance_rejected',     // Finance rejected
      'disbursed',            // Money disbursed
      'partially_recovered',  // Partial amount recovered
      'fully_recovered',      // Full amount recovered
      'cancelled',            // Cancelled
      'written_off'           // Written off (bad debt)
    ],
    default: 'pending_hr'
  },

  // ============================================
  // 3-LEVEL APPROVAL WORKFLOW
  // ============================================

  // Level 1: Manager Approval
  managerApproval: {
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: String,
    actionAt: Date
  },

  // Level 2: HR Approval (Abhiji/Sandarsh)
  hrApproval: {
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: String,
    actionAt: Date
  },

  // Level 3: Final Approval (Sandeep - Super Admin)
  finalApproval: {
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: String,
    approvedAmount: Number,
    actionAt: Date
  },

  // HR Team tagging - All tagged HR members will be notified
  hrTeamTagged: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    taggedAt: { type: Date, default: Date.now },
    taggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Current approval level
  currentApprovalLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  },

  // Finance Processing
  financeProcessing: {
    receivedAt: Date,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: Date,
    remarks: String
  },

  // Disbursement Details
  disbursement: {
    disbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: Date,
    disbursementMode: {
      type: String,
      enum: ['bank_transfer', 'cash', 'cheque', 'upi']
    },
    transactionReference: String,
    bankDetails: {
      accountNumber: String,
      bankName: String,
      ifscCode: String
    },
    remarks: String
  },

  // Recovery Tracking
  recovery: {
    totalRecovered: { type: Number, default: 0 },
    balanceRemaining: { type: Number, default: 0 },
    recoveryEntries: [{
      amount: Number,
      recoveryDate: Date,
      recoveryMode: {
        type: String,
        enum: ['salary_deduction', 'cash', 'bank_transfer', 'cheque']
      },
      payrollMonth: String, // e.g., "2024-01"
      reference: String,
      recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      recordedAt: { type: Date, default: Date.now }
    }]
  },

  // Supporting Documents
  supportingDocuments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Activity Log
  activities: [{
    action: {
      type: String,
      enum: [
        'created', 'submitted',
        'manager_approved', 'manager_rejected',
        'hr_approved', 'hr_rejected',
        'final_approved', 'final_rejected',
        'transferred_to_finance', 'finance_processed',
        'disbursed', 'recovery_recorded',
        'cancelled', 'written_off',
        'hr_tagged', 'comment_added'
      ]
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByName: String,
    comment: String,
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now }
  }],

  // Notes
  notes: String,

  // Urgency
  isUrgent: {
    type: Boolean,
    default: false
  },

  urgencyReason: String

}, {
  timestamps: true
})

// Indexes
advanceRequestSchema.index({ company: 1, employee: 1 })
advanceRequestSchema.index({ company: 1, status: 1 })
advanceRequestSchema.index({ company: 1, advanceType: 1 })
advanceRequestSchema.index({ 'managerApproval.approver': 1, 'managerApproval.status': 1 })
advanceRequestSchema.index({ 'hrApproval.approver': 1, 'hrApproval.status': 1 })
advanceRequestSchema.index({ 'finalApproval.approver': 1, 'finalApproval.status': 1 })

// Virtual for formatted amount
advanceRequestSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency || 'INR'
  }).format(this.requestedAmount)
})

// Static method to get pending approvals for a user based on their role
advanceRequestSchema.statics.getPendingForApprover = async function(userId, companyId, approvalLevel) {
  const query = { company: companyId }

  if (approvalLevel === 1) {
    query['managerApproval.approver'] = userId
    query['managerApproval.status'] = 'pending'
    query.currentApprovalLevel = 1
  } else if (approvalLevel === 2) {
    query['hrApproval.status'] = 'pending'
    query.currentApprovalLevel = 2
  } else if (approvalLevel === 3) {
    query['finalApproval.status'] = 'pending'
    query.currentApprovalLevel = 3
  }

  return this.find(query)
    .populate('employee', 'name email avatar designation department')
    .sort({ createdAt: -1 })
}

// Method to add activity log
advanceRequestSchema.methods.addActivity = function(action, userId, userName, comment, metadata) {
  this.activities.push({
    action,
    performedBy: userId,
    performedByName: userName,
    comment,
    metadata,
    createdAt: new Date()
  })
}

// Pre-save hook to update balance
advanceRequestSchema.pre('save', function(next) {
  if (this.isModified('recovery.recoveryEntries') || this.isModified('approvedAmount')) {
    const totalRecovered = this.recovery?.recoveryEntries?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0
    this.recovery.totalRecovered = totalRecovered
    this.recovery.balanceRemaining = (this.approvedAmount || 0) - totalRecovered

    // Update status based on recovery
    if (this.status === 'disbursed' || this.status === 'partially_recovered') {
      if (totalRecovered >= this.approvedAmount) {
        this.status = 'fully_recovered'
      } else if (totalRecovered > 0) {
        this.status = 'partially_recovered'
      }
    }
  }
  next()
})

export default mongoose.model('AdvanceRequest', advanceRequestSchema)
