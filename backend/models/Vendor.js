import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

/**
 * ===========================================
 * SOX Control: SCM-004 Vendor Performance & Contract Controls
 * ===========================================
 */

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  createdAt: { type: Date, default: Date.now }
})

// Performance Evaluation sub-schema
const performanceEvaluationSchema = new mongoose.Schema({
  evaluationId: String,
  evaluationPeriod: {
    startDate: Date,
    endDate: Date
  },

  // Scoring categories (1-5 scale)
  scores: {
    quality: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 30 },
      comments: String,
      defectRate: Number, // Percentage of defective items
      returnRate: Number
    },
    delivery: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 25 },
      comments: String,
      onTimeDeliveryRate: Number, // Percentage
      avgLeadTimeVariance: Number // Days +/-
    },
    pricing: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 20 },
      comments: String,
      priceCompetitiveness: String // 'below_market', 'at_market', 'above_market'
    },
    responsiveness: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 15 },
      comments: String,
      avgResponseTime: Number // Hours
    },
    compliance: {
      score: { type: Number, min: 1, max: 5 },
      weight: { type: Number, default: 10 },
      comments: String,
      documentationComplete: Boolean,
      certificationsCurrent: Boolean
    }
  },

  // Overall calculated score
  overallScore: { type: Number, min: 1, max: 5 },
  weightedScore: { type: Number },

  // Performance band
  performanceBand: {
    type: String,
    enum: ['preferred', 'approved', 'conditional', 'probation', 'suspended'],
    default: 'approved'
  },

  // Transaction metrics
  metrics: {
    totalPOs: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    completedPOs: { type: Number, default: 0 },
    onTimeDeliveries: { type: Number, default: 0 },
    qualityIssues: { type: Number, default: 0 },
    disputes: { type: Number, default: 0 }
  },

  // Evaluation metadata
  evaluatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  evaluatedByName: String,
  evaluatedAt: { type: Date, default: Date.now },
  nextEvaluationDue: Date,

  // Approval if score drops vendor to conditional/probation
  requiresApproval: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  actionPlan: String
})

// Contract sub-schema
const contractSchema = new mongoose.Schema({
  contractNumber: String,
  title: String,
  type: {
    type: String,
    enum: ['master_agreement', 'rate_contract', 'blanket_po', 'service_agreement', 'nda', 'other'],
    default: 'rate_contract'
  },

  // Contract dates
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  autoRenewal: { type: Boolean, default: false },
  renewalNoticeDays: { type: Number, default: 30 },

  // Financial terms
  contractValue: Number,
  currency: { type: String, default: 'INR' },
  paymentTerms: String,
  creditLimit: Number,

  // Terms and conditions
  terms: {
    warrantyPeriod: Number, // Days
    liabilityLimit: Number,
    penaltyClause: String,
    terminationClause: String,
    specialConditions: [String]
  },

  // Document
  documentUrl: String,
  documentName: String,

  // Status tracking
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'active', 'expiring_soon', 'expired', 'terminated', 'renewed'],
    default: 'draft'
  },

  // Approvals
  approvalWorkflow: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalWorkflow' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,

  // Renewal tracking
  renewalHistory: [{
    previousContractNumber: String,
    renewedAt: Date,
    renewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changes: String
  }],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
})

// Compliance Document sub-schema
const complianceDocSchema = new mongoose.Schema({
  docType: {
    type: String,
    enum: ['gst_certificate', 'pan_card', 'msme_certificate', 'iso_certification',
           'insurance', 'license', 'bank_mandate', 'cancelled_cheque', 'other'],
    required: true
  },
  docName: String,
  docNumber: String,
  issueDate: Date,
  expiryDate: Date,
  documentUrl: String,

  // Verification
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,

  // Status
  status: {
    type: String,
    enum: ['valid', 'expiring_soon', 'expired', 'pending_verification'],
    default: 'pending_verification'
  },

  reminderSent: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now }
})

const vendorSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  vendorId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String,
    designation: String
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: String,
  alternatePhone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  gstNumber: String,
  panNumber: String,
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  },
  category: {
    type: String,
    enum: ['material_supplier', 'contractor', 'service_provider', 'equipment_rental', 'consultant', 'other', 'factory', 'labour', 'material', 'both'],
    default: 'material_supplier'
  },
  // SCM Mastersheet Fields
  vendorType: {
    type: String,
    enum: ['supplier', 'contractor', 'service_provider', 'consultant', 'interiors', 'construction', 'other'],
    default: 'supplier'
  },
  subCategory: String, // e.g., 'Modular, Job Work', 'Civil Labour Contract', 'Hardware'
  scopeOfWork: String, // Detailed scope description
  spoc: String, // Single Point of Contact name
  areaOfService: String, // Geographic area covered
  teamSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
  },
  rates: {
    type: Number, // Rate per unit (sqft, hour, etc.)
  },
  rateRemarks: String, // e.g., '38rs psqft with packing'
  specialization: [String], // e.g., ['electrical', 'plumbing', 'carpentry']
  paymentTerms: {
    type: String,
    enum: ['advance', 'cod', 'net_7', 'net_15', 'net_30', 'net_45', 'net_60', 'custom'],
    default: 'net_30'
  },
  customPaymentTerms: String,
  creditLimit: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted', 'pending_verification'],
    default: 'pending_verification'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  documents: [{
    name: { type: String },
    docType: { type: String },  // Renamed from 'type' to avoid Mongoose reserved keyword conflict
    url: { type: String },
    originalName: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Material Pricelist - Products/Services offered by vendor with prices
  materials: [{
    materialName: { type: String, required: true },
    materialType: {
      type: String,
      enum: ['cement', 'steel', 'blocks', 'aggregate', 'rmc', 'plywood', 'hardware', 'tiles', 'sanitaryware', 'electrical', 'plumbing', 'paint', 'glass', 'aluminium', 'labour', 'service', 'other'],
      default: 'other'
    },
    category: String, // e.g., 'Cement', 'Steel', 'Blocks'
    subCategory: String, // e.g., 'OPC', 'PPC', 'TMT'
    brand: String,
    specification: String, // e.g., '53 Grade', '4" Block'
    unit: {
      type: String,
      enum: ['unit', 'kg', 'ton', 'bag', 'sqft', 'sqm', 'cft', 'm3', 'ltr', 'bundle', 'box', 'set', 'hour', 'day', 'month', 'job'],
      default: 'unit'
    },
    currentPrice: { type: Number },
    currentPriceMax: { type: Number }, // For price range
    priceType: {
      type: String,
      enum: ['fixed', 'range', 'negotiable'],
      default: 'fixed'
    },
    minOrderQty: { type: Number },
    leadTimeDays: { type: Number },
    gstRate: { type: Number, default: 18 },
    remarks: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'out_of_stock'],
      default: 'active'
    },
    submittedByVendor: { type: Boolean, default: false }, // Track if vendor submitted this
    submittedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    priceHistory: [{
      price: Number,
      priceMax: Number,
      changedAt: { type: Date, default: Date.now },
      changedBy: String,
      remarks: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }],
  notes: String,
  activities: [activitySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // ===========================================
  // SCM-004: Performance Management
  // ===========================================

  // Current performance status
  performanceStatus: {
    currentBand: {
      type: String,
      enum: ['preferred', 'approved', 'conditional', 'probation', 'suspended'],
      default: 'approved'
    },
    currentScore: { type: Number, min: 1, max: 5 },
    lastEvaluationDate: Date,
    nextEvaluationDue: Date,
    evaluationFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'semi_annual', 'annual'],
      default: 'quarterly'
    },
    consecutiveLowScores: { type: Number, default: 0 },
    isOnWatch: { type: Boolean, default: false },
    watchReason: String
  },

  // Performance evaluation history
  performanceEvaluations: [performanceEvaluationSchema],

  // Aggregate metrics (auto-calculated)
  aggregateMetrics: {
    totalPOsAllTime: { type: Number, default: 0 },
    totalValueAllTime: { type: Number, default: 0 },
    avgQualityScore: { type: Number, default: 0 },
    avgDeliveryScore: { type: Number, default: 0 },
    onTimeDeliveryRate: { type: Number, default: 0 },
    defectRate: { type: Number, default: 0 },
    lastUpdated: Date
  },

  // ===========================================
  // SCM-004: Contract Management
  // ===========================================

  contracts: [contractSchema],

  activeContract: {
    contractId: { type: mongoose.Schema.Types.ObjectId },
    contractNumber: String,
    expiryDate: Date,
    daysUntilExpiry: Number,
    status: String
  },

  // ===========================================
  // SCM-004: Compliance Documents
  // ===========================================

  complianceDocuments: [complianceDocSchema],

  complianceStatus: {
    isCompliant: { type: Boolean, default: false },
    missingDocuments: [String],
    expiringDocuments: [String],
    lastVerifiedDate: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // ===========================================
  // SCM-004: SOX Audit Trail
  // ===========================================

  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'status_changed', 'performance_evaluated', 'band_changed',
             'contract_created', 'contract_approved', 'contract_expired', 'contract_renewed',
             'compliance_verified', 'document_uploaded', 'put_on_watch', 'blacklisted']
    },
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    changedAt: { type: Date, default: Date.now },
    reason: String,
    ipAddress: String
  }],

  // Vendor Portal Authentication
  portalAccess: {
    enabled: { type: Boolean, default: false },
    password: { type: String, select: false },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  }
}, {
  timestamps: true
})

// Generate vendor ID
vendorSchema.pre('save', async function(next) {
  if (!this.vendorId) {
    const last = await this.constructor.findOne({ company: this.company }, { vendorId: 1 }).sort({ vendorId: -1 }).lean()
    const lastNum = last?.vendorId ? parseInt(last.vendorId.replace('VEN-', '')) || 0 : 0
    this.vendorId = `VEN-${String(lastNum + 1).padStart(4, '0')}`
  }

  // Hash password if modified
  if (this.isModified('portalAccess.password') && this.portalAccess?.password) {
    const salt = await bcrypt.genSalt(10)
    this.portalAccess.password = await bcrypt.hash(this.portalAccess.password, salt)
  }
  next()
})

// Compare password method
vendorSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.portalAccess?.password) return false
  return await bcrypt.compare(enteredPassword, this.portalAccess.password)
}

// Check if account is locked
vendorSchema.methods.isLocked = function() {
  return this.portalAccess?.lockUntil && this.portalAccess.lockUntil > Date.now()
}

// Increment login attempts
vendorSchema.methods.incLoginAttempts = async function() {
  const MAX_LOGIN_ATTEMPTS = 5
  const LOCK_TIME = 2 * 60 * 60 * 1000 // 2 hours

  if (this.portalAccess?.lockUntil && this.portalAccess.lockUntil < Date.now()) {
    // Reset if lock has expired
    this.portalAccess.loginAttempts = 1
    this.portalAccess.lockUntil = undefined
  } else {
    this.portalAccess.loginAttempts = (this.portalAccess?.loginAttempts || 0) + 1
    if (this.portalAccess.loginAttempts >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
      this.portalAccess.lockUntil = Date.now() + LOCK_TIME
    }
  }
  return this.save()
}

// ===========================================
// SCM-004: Performance & Contract Methods
// ===========================================

// Method to add performance evaluation
vendorSchema.methods.addPerformanceEvaluation = function(evaluationData, userId, userName) {
  const count = (this.performanceEvaluations?.length || 0) + 1
  const date = new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')

  // Calculate weighted score
  const scores = evaluationData.scores
  let totalWeightedScore = 0
  let totalWeight = 0

  Object.keys(scores).forEach(category => {
    const s = scores[category]
    if (s.score && s.weight) {
      totalWeightedScore += s.score * s.weight
      totalWeight += s.weight
    }
  })

  const weightedScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 : 0
  const overallScore = Math.round(weightedScore * 10) / 10

  // Determine performance band
  let performanceBand = 'approved'
  if (overallScore >= 4.5) performanceBand = 'preferred'
  else if (overallScore >= 3.5) performanceBand = 'approved'
  else if (overallScore >= 2.5) performanceBand = 'conditional'
  else if (overallScore >= 1.5) performanceBand = 'probation'
  else performanceBand = 'suspended'

  // Calculate next evaluation date based on frequency
  const frequencyDays = {
    'monthly': 30,
    'quarterly': 90,
    'semi_annual': 180,
    'annual': 365
  }
  const nextDue = new Date()
  nextDue.setDate(nextDue.getDate() + (frequencyDays[this.performanceStatus?.evaluationFrequency] || 90))

  const evaluation = {
    evaluationId: `EVAL-${this.vendorId}-${yy}${mm}-${String(count).padStart(3, '0')}`,
    ...evaluationData,
    overallScore,
    weightedScore,
    performanceBand,
    evaluatedBy: userId,
    evaluatedByName: userName,
    evaluatedAt: new Date(),
    nextEvaluationDue: nextDue,
    requiresApproval: performanceBand === 'conditional' || performanceBand === 'probation' || performanceBand === 'suspended'
  }

  this.performanceEvaluations.push(evaluation)

  // Update current performance status
  const oldBand = this.performanceStatus?.currentBand
  this.performanceStatus = {
    ...this.performanceStatus,
    currentBand: performanceBand,
    currentScore: overallScore,
    lastEvaluationDate: new Date(),
    nextEvaluationDue: nextDue,
    consecutiveLowScores: overallScore < 3 ?
      (this.performanceStatus?.consecutiveLowScores || 0) + 1 : 0,
    isOnWatch: performanceBand === 'conditional' || performanceBand === 'probation'
  }

  // Add audit entry
  this.auditTrail.push({
    action: 'performance_evaluated',
    field: 'performanceStatus',
    oldValue: { band: oldBand, score: this.performanceStatus?.currentScore },
    newValue: { band: performanceBand, score: overallScore },
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date()
  })

  // If band changed, add separate entry
  if (oldBand && oldBand !== performanceBand) {
    this.auditTrail.push({
      action: 'band_changed',
      field: 'performanceStatus.currentBand',
      oldValue: oldBand,
      newValue: performanceBand,
      changedBy: userId,
      changedByName: userName,
      changedAt: new Date(),
      reason: `Score: ${overallScore}`
    })
  }

  return evaluation
}

// Method to add contract
vendorSchema.methods.addContract = function(contractData, userId, userName) {
  const count = (this.contracts?.length || 0) + 1
  const date = new Date()
  const yy = String(date.getFullYear()).slice(-2)

  const contract = {
    contractNumber: `CON-${this.vendorId}-${yy}-${String(count).padStart(3, '0')}`,
    ...contractData,
    status: 'draft',
    createdBy: userId,
    createdAt: new Date()
  }

  this.contracts.push(contract)

  this.auditTrail.push({
    action: 'contract_created',
    field: 'contracts',
    newValue: contract.contractNumber,
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date()
  })

  return contract
}

// Method to activate contract
vendorSchema.methods.activateContract = function(contractId, userId, userName) {
  const contract = this.contracts.id(contractId)
  if (!contract) throw new Error('Contract not found')

  contract.status = 'active'
  contract.approvedBy = userId
  contract.approvedAt = new Date()

  // Update active contract reference
  this.activeContract = {
    contractId: contract._id,
    contractNumber: contract.contractNumber,
    expiryDate: contract.endDate,
    daysUntilExpiry: Math.ceil((contract.endDate - new Date()) / (1000 * 60 * 60 * 24)),
    status: 'active'
  }

  this.auditTrail.push({
    action: 'contract_approved',
    field: 'contracts',
    oldValue: 'pending_approval',
    newValue: 'active',
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date()
  })

  return contract
}

// Method to check compliance
vendorSchema.methods.checkCompliance = function() {
  const requiredDocs = ['gst_certificate', 'pan_card', 'bank_mandate']
  const now = new Date()
  const warningDays = 30

  const missingDocuments = []
  const expiringDocuments = []

  requiredDocs.forEach(docType => {
    const doc = this.complianceDocuments?.find(d => d.docType === docType && d.status !== 'expired')
    if (!doc) {
      missingDocuments.push(docType)
    }
  })

  this.complianceDocuments?.forEach(doc => {
    if (doc.expiryDate) {
      const daysUntilExpiry = Math.ceil((doc.expiryDate - now) / (1000 * 60 * 60 * 24))
      if (daysUntilExpiry <= 0) {
        doc.status = 'expired'
      } else if (daysUntilExpiry <= warningDays) {
        doc.status = 'expiring_soon'
        expiringDocuments.push(doc.docType)
      }
    }
  })

  this.complianceStatus = {
    isCompliant: missingDocuments.length === 0,
    missingDocuments,
    expiringDocuments,
    lastVerifiedDate: new Date()
  }

  return this.complianceStatus
}

// Method to update aggregate metrics
vendorSchema.methods.updateAggregateMetrics = async function() {
  const PurchaseOrder = mongoose.model('PurchaseOrder')

  const metrics = await PurchaseOrder.aggregate([
    { $match: { vendor: this._id } },
    {
      $group: {
        _id: null,
        totalPOs: { $sum: 1 },
        totalValue: { $sum: '$totalAmount' },
        completedPOs: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ])

  if (metrics.length > 0) {
    this.aggregateMetrics = {
      totalPOsAllTime: metrics[0].totalPOs,
      totalValueAllTime: metrics[0].totalValue,
      lastUpdated: new Date()
    }

    // Calculate average scores from evaluations
    if (this.performanceEvaluations?.length > 0) {
      const recentEvals = this.performanceEvaluations.slice(-4) // Last 4 evaluations
      this.aggregateMetrics.avgQualityScore = recentEvals.reduce((sum, e) =>
        sum + (e.scores?.quality?.score || 0), 0) / recentEvals.length
      this.aggregateMetrics.avgDeliveryScore = recentEvals.reduce((sum, e) =>
        sum + (e.scores?.delivery?.score || 0), 0) / recentEvals.length
    }
  }

  return this
}

// Method to add audit entry
vendorSchema.methods.addAuditEntry = function(action, field, oldValue, newValue, userId, userName, reason) {
  this.auditTrail.push({
    action,
    field,
    oldValue,
    newValue,
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date(),
    reason
  })
  return this
}

// Static method to get vendors due for evaluation
vendorSchema.statics.getVendorsDueForEvaluation = function(companyId) {
  const today = new Date()
  return this.find({
    company: companyId,
    status: 'active',
    $or: [
      { 'performanceStatus.nextEvaluationDue': { $lte: today } },
      { 'performanceStatus.nextEvaluationDue': { $exists: false } }
    ]
  }).select('vendorId name category performanceStatus')
}

// Static method to get vendors with expiring contracts
vendorSchema.statics.getVendorsWithExpiringContracts = function(companyId, withinDays = 30) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + withinDays)

  return this.find({
    company: companyId,
    status: 'active',
    'activeContract.expiryDate': { $lte: futureDate, $gte: new Date() }
  }).select('vendorId name activeContract')
}

// Indexes
vendorSchema.index({ company: 1, name: 1 })
vendorSchema.index({ company: 1, status: 1 })
vendorSchema.index({ company: 1, category: 1 })
vendorSchema.index({ company: 1, vendorType: 1 })
vendorSchema.index({ company: 1, subCategory: 1 })
vendorSchema.index({ company: 1, 'performanceStatus.currentBand': 1 })
vendorSchema.index({ company: 1, 'performanceStatus.nextEvaluationDue': 1 })
vendorSchema.index({ company: 1, 'activeContract.expiryDate': 1 })

const Vendor = mongoose.model('Vendor', vendorSchema)

export default Vendor
