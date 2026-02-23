import mongoose from 'mongoose'

const reimbursementSchema = new mongoose.Schema({
  // Reimbursement ID (e.g., IP-RB-2024-00001)
  reimbursementId: {
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

  // Expense Category
  category: {
    type: String,
    enum: [
      'travel',
      'food',
      'accommodation',
      'transport',
      'communication',
      'medical',
      'training',
      'equipment',
      'office_supplies',
      'client_entertainment',
      'miscellaneous'
    ],
    required: true
  },

  // Title/Description
  title: {
    type: String,
    required: [true, 'Please provide a title for the reimbursement'],
    trim: true,
    maxlength: 200
  },

  // Detailed Description
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Amount
  amount: {
    type: Number,
    required: [true, 'Please provide the reimbursement amount'],
    min: [0, 'Amount cannot be negative']
  },

  // Currency
  currency: {
    type: String,
    default: 'INR'
  },

  // Expense Date
  expenseDate: {
    type: Date,
    required: [true, 'Please provide the expense date']
  },

  // Receipt/Invoice details
  receipts: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Related Project (optional)
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  // Related Client/Customer (optional)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },

  // Vendor/Merchant Details
  vendor: {
    name: String,
    gstin: String,
    invoiceNumber: String
  },

  // Status
  status: {
    type: String,
    enum: [
      'draft',
      'pending_manager',      // Level 1: Manager approval
      'pending_hr',           // Level 2: HR (Abhiji/Sandarsh) approval
      'pending_final',        // Level 3: Final (Sandeep/Superadmin) approval
      'approved',             // All approvals complete
      'rejected',
      'pending_payment',      // Approved, waiting for payment
      'partially_paid',       // Partial payment made
      'paid',                 // Fully paid
      'cancelled'
    ],
    default: 'pending_manager'
  },

  // ============================================
  // 3-LEVEL APPROVAL WORKFLOW
  // ============================================

  // Level 1: Manager Approval (Employee's direct manager)
  managerApproval: {
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: String,
    actionAt: Date,
    approvedAmount: Number
  },

  // Level 2: HR Approval (Abhiji/Sandarsh)
  hrApproval: {
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: String,
    actionAt: Date,
    approvedAmount: Number
  },

  // Level 3: Final Approval (Sandeep - Super Admin)
  finalApproval: {
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: String,
    actionAt: Date,
    approvedAmount: Number
  },

  // HR Team Tagged (All HR members will receive notifications)
  hrTeamTagged: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    taggedAt: { type: Date, default: Date.now },
    taggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hasViewed: { type: Boolean, default: false },
    viewedAt: Date
  }],

  // Current Approver Level (1 = Manager, 2 = HR, 3 = Final)
  currentApprovalLevel: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  },

  // Legacy Approval Chain (kept for backward compatibility)
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
    level: Number
  }],

  // Final Approver
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvedAmount: Number,

  // Rejection
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,

  // ============================================
  // SEPARATE PAYMENT ENTRIES
  // ============================================
  payments: [{
    paymentId: String, // e.g., IP-PAY-2024-00001
    amount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'cash', 'cheque', 'payroll', 'upi', 'expense_card']
    },
    transactionReference: String,
    bankDetails: {
      accountNumber: String,
      bankName: String,
      ifscCode: String
    },
    chequeDetails: {
      chequeNumber: String,
      chequeDate: Date,
      bankName: String
    },
    upiDetails: {
      upiId: String,
      transactionId: String
    },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedByName: String,
    remarks: String,
    attachmentUrl: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // Total Paid Amount (calculated)
  totalPaidAmount: {
    type: Number,
    default: 0
  },

  // Balance Amount (calculated)
  balanceAmount: {
    type: Number,
    default: 0
  },

  // Legacy Payment Details (kept for backward compatibility)
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidAt: Date,
  paymentReference: String,
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque', 'payroll', 'expense_card', 'upi']
  },

  // Cancellation
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date,
  cancellationReason: String,

  // Notes
  notes: String,

  // Manager Comments
  managerComments: String,

  // Activity Log
  activities: [{
    action: {
      type: String,
      enum: ['created', 'submitted', 'approved', 'rejected', 'paid', 'cancelled', 'modified', 'comment_added']
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

// Indexes
reimbursementSchema.index({ company: 1, employee: 1 })
reimbursementSchema.index({ company: 1, status: 1 })
reimbursementSchema.index({ company: 1, category: 1 })
reimbursementSchema.index({ company: 1, expenseDate: 1 })
reimbursementSchema.index({ employee: 1, expenseDate: 1 })

// Virtual for formatted amount
reimbursementSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency || 'INR'
  }).format(this.amount)
})

// Static method to get employee reimbursement summary
reimbursementSchema.statics.getEmployeeSummary = async function(employeeId, companyId, year) {
  const startOfYear = new Date(year, 0, 1)
  const endOfYear = new Date(year, 11, 31)

  const summary = await this.aggregate([
    {
      $match: {
        employee: employeeId,
        company: companyId,
        expenseDate: { $gte: startOfYear, $lte: endOfYear }
      }
    },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ])

  const categoryWise = await this.aggregate([
    {
      $match: {
        employee: employeeId,
        company: companyId,
        expenseDate: { $gte: startOfYear, $lte: endOfYear },
        status: { $in: ['approved', 'paid'] }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ])

  return { summary, categoryWise, year }
}

// Static method to get pending approvals for a manager
reimbursementSchema.statics.getPendingApprovals = async function(managerId, companyId) {
  return this.find({
    company: companyId,
    status: 'pending',
    'approvers.user': managerId,
    'approvers.status': 'pending'
  })
    .populate('employee', 'name email avatar designation department')
    .sort({ createdAt: -1 })
}

// Static method to get pending approvals by level
reimbursementSchema.statics.getPendingByLevel = async function(companyId, level, approverId = null) {
  const statusMap = {
    1: 'pending_manager',
    2: 'pending_hr',
    3: 'pending_final'
  }

  const query = {
    company: companyId,
    status: statusMap[level] || 'pending_manager'
  }

  // For level 1, filter by manager
  if (level === 1 && approverId) {
    query['managerApproval.approver'] = approverId
  }

  return this.find(query)
    .populate('employee', 'name email avatar designation department')
    .populate('managerApproval.approver', 'name')
    .populate('hrApproval.approver', 'name')
    .populate('finalApproval.approver', 'name')
    .sort({ createdAt: -1 })
}

// Pre-save hook to calculate payment totals
reimbursementSchema.pre('save', function(next) {
  if (this.isModified('payments') || this.isModified('approvedAmount')) {
    const totalPaid = this.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0
    this.totalPaidAmount = totalPaid
    this.balanceAmount = (this.approvedAmount || this.amount || 0) - totalPaid

    // Update status based on payments
    if (this.status === 'approved' || this.status === 'pending_payment' || this.status === 'partially_paid') {
      if (totalPaid >= (this.approvedAmount || this.amount)) {
        this.status = 'paid'
        this.paidAt = new Date()
      } else if (totalPaid > 0) {
        this.status = 'partially_paid'
      } else if (this.status === 'approved') {
        this.status = 'pending_payment'
      }
    }
  }
  next()
})

export default mongoose.model('Reimbursement', reimbursementSchema)
