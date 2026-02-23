import mongoose from 'mongoose'

const employeeLetterSchema = new mongoose.Schema({
  // Letter ID (e.g., IP-LTR-2024-00001)
  letterId: {
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

  // Letter Type
  letterType: {
    type: String,
    enum: [
      'relieving_letter',
      'experience_letter',
      'bonafide_certificate',
      'salary_certificate',
      'employment_certificate',
      'noc_letter',
      'address_proof_letter',
      'recommendation_letter',
      'appraisal_letter',
      'promotion_letter',
      'increment_letter',
      'warning_letter',
      'show_cause_notice',
      'termination_letter',
      'confirmation_letter',
      'probation_extension_letter',
      'transfer_letter',
      'deputation_letter',
      'offer_letter',
      'appointment_letter',
      'joining_letter',
      'grievance_acknowledgment',
      'grievance_resolution',
      'working_certificate',
      'internship_certificate',
      'training_certificate',
      'other'
    ],
    required: true
  },

  // Letter Title
  title: {
    type: String,
    required: [true, 'Letter title is required'],
    trim: true
  },

  // Letter Reference Number
  referenceNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  // Letter Date
  letterDate: {
    type: Date,
    default: Date.now
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'issued', 'rejected', 'cancelled'],
    default: 'draft'
  },

  // Letter Content (HTML/Rich Text)
  content: {
    type: String,
    required: [true, 'Letter content is required']
  },

  // Template Used (if any)
  templateUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LetterTemplate'
  },

  // Dynamic Fields used in template
  templateFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Effective Dates (for confirmation, promotion, etc.)
  effectiveFrom: Date,
  effectiveTo: Date,

  // For Relieving Letter
  relievingDetails: {
    lastWorkingDay: Date,
    resignationDate: Date,
    noticePeriodWaived: { type: Boolean, default: false },
    noticePeriodDays: Number,
    clearanceStatus: {
      type: String,
      enum: ['pending', 'partial', 'complete'],
      default: 'pending'
    }
  },

  // For Salary Certificate
  salaryDetails: {
    salary: Number,
    grossSalary: Number,
    ctc: Number,
    asOfDate: Date
  },

  // For Warning/Show Cause
  disciplinaryDetails: {
    incidentDate: Date,
    incidentDescription: String,
    previousWarnings: Number,
    responseDeadline: Date,
    meetingDate: Date
  },

  // For Promotion/Increment
  promotionDetails: {
    previousDesignation: String,
    newDesignation: String,
    previousSalary: Number,
    newSalary: Number,
    incrementPercentage: Number
  },

  // For Transfer
  transferDetails: {
    fromLocation: String,
    toLocation: String,
    fromDepartment: String,
    toDepartment: String,
    relocationAllowance: Number
  },

  // For Grievance
  grievanceDetails: {
    grievanceId: String,
    grievanceType: String,
    grievanceDescription: String,
    resolution: String,
    resolutionDate: Date
  },

  // Approval Workflow
  approval: {
    requiredApprover: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    approvalComment: String,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    rejectionReason: String
  },

  // Issued Details
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  issuedAt: Date,

  // Signatory Details
  signatory: {
    name: String,
    designation: String,
    department: String,
    signatureUrl: String
  },

  // Generated PDF URL
  pdfUrl: String,

  // Delivery Details
  delivery: {
    method: {
      type: String,
      enum: ['email', 'hand_delivery', 'courier', 'not_delivered'],
      default: 'not_delivered'
    },
    deliveredAt: Date,
    receivedBy: String,
    courierDetails: {
      provider: String,
      trackingNumber: String
    },
    emailSentTo: String,
    emailSentAt: Date
  },

  // Employee Acknowledgment
  acknowledgment: {
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: Date,
    signatureUrl: String,
    comments: String
  },

  // Copies Issued
  copiesIssued: [{
    issuedTo: String,
    issuedAt: Date,
    purpose: String,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Request Details (if employee requested)
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  requestedAt: Date,

  requestPurpose: String,

  // Notes
  notes: String,

  // Created/Updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Activity Log
  activities: [{
    action: {
      type: String,
      enum: [
        'created', 'updated', 'submitted_for_approval',
        'approved', 'rejected', 'issued',
        'delivered', 'acknowledged', 'cancelled',
        'pdf_generated', 'copy_issued'
      ]
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByName: String,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
})

// Indexes
employeeLetterSchema.index({ company: 1, employee: 1 })
employeeLetterSchema.index({ company: 1, letterType: 1 })
employeeLetterSchema.index({ company: 1, status: 1 })
employeeLetterSchema.index({ letterDate: -1 })

// Generate reference number pre-save
employeeLetterSchema.pre('save', async function(next) {
  if (!this.referenceNumber && this.status !== 'draft') {
    const Company = mongoose.model('Company')
    const company = await Company.findById(this.company)
    const year = new Date().getFullYear()

    const count = await this.constructor.countDocuments({
      company: this.company,
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    })

    const typeCode = {
      'relieving_letter': 'REL',
      'experience_letter': 'EXP',
      'bonafide_certificate': 'BON',
      'salary_certificate': 'SAL',
      'warning_letter': 'WRN',
      'termination_letter': 'TRM',
      'confirmation_letter': 'CNF',
      'promotion_letter': 'PRM',
      'offer_letter': 'OFR',
      'appointment_letter': 'APT',
      'grievance_acknowledgment': 'GRV',
      'grievance_resolution': 'GRS',
      'working_certificate': 'WRK'
    }[this.letterType] || 'LTR'

    this.referenceNumber = `${company?.code || 'IP'}/${typeCode}/${year}/${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Static: Get letters for an employee
employeeLetterSchema.statics.getEmployeeLetters = function(employeeId, companyId, letterType) {
  const query = { employee: employeeId, company: companyId }
  if (letterType) query.letterType = letterType

  return this.find(query)
    .populate('createdBy', 'name')
    .populate('issuedBy', 'name')
    .sort({ createdAt: -1 })
}

// Static: Get pending approvals
employeeLetterSchema.statics.getPendingApprovals = function(approverId, companyId) {
  return this.find({
    company: companyId,
    status: 'pending_approval',
    'approval.requiredApprover': approverId
  })
    .populate('employee', 'name email designation department')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
}

export default mongoose.model('EmployeeLetter', employeeLetterSchema)
