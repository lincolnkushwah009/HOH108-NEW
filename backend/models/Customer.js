import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const customerSchema = new mongoose.Schema({
  // Auto-generated Customer ID (e.g., IP-C-2024-00001)
  customerId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Company Association (Required)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  // Customer Type
  type: {
    type: String,
    enum: ['individual', 'business'],
    default: 'individual'
  },

  // Individual Customer Details
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },

  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },

  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },

  alternatePhone: {
    type: String
  },

  dateOfBirth: {
    type: Date
  },

  anniversary: {
    type: Date
  },

  // Business Customer Details
  businessName: {
    type: String
  },

  gstin: {
    type: String
  },

  contactPerson: {
    name: String,
    designation: String,
    email: String,
    phone: String
  },

  // Addresses
  addresses: [{
    type: {
      type: String,
      enum: ['billing', 'site', 'correspondence'],
      default: 'correspondence'
    },
    label: String, // Home, Office, etc.
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    isDefault: {
      type: Boolean,
      default: false
    }
  }],

  // Customer Value Metrics
  metrics: {
    totalProjects: {
      type: Number,
      default: 0
    },
    activeProjects: {
      type: Number,
      default: 0
    },
    completedProjects: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    outstandingAmount: {
      type: Number,
      default: 0
    },
    averageProjectValue: {
      type: Number,
      default: 0
    }
  },

  // ===========================================
  // SOX Control: OTC-007 Credit Management
  // ===========================================
  creditLimit: { type: Number, default: 0 },
  creditUtilization: { type: Number, default: 0 },
  creditStatus: {
    type: String,
    enum: ['available', 'at_limit', 'exceeded', 'blocked'],
    default: 'available'
  },
  paymentTermsDays: { type: Number, default: 30 },

  // AR Summary (updated by batch job or on invoice changes)
  arSummary: {
    totalOutstanding: { type: Number, default: 0 },
    current: { type: Number, default: 0 },
    overdue1to30: { type: Number, default: 0 },
    overdue31to60: { type: Number, default: 0 },
    overdue61to90: { type: Number, default: 0 },
    overdue90Plus: { type: Number, default: 0 },
    oldestOverdueDays: { type: Number, default: 0 },
    lastUpdated: Date
  },

  // Credit hold flags
  creditHold: {
    isOnHold: { type: Boolean, default: false },
    holdReason: String,
    holdDate: Date,
    heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    releaseDate: Date,
    releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // Relationship Management
  accountManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      default: 'team_member'
    },
    since: {
      type: Date,
      default: Date.now
    }
  }],

  // Segmentation
  segment: {
    type: String,
    enum: ['platinum', 'gold', 'silver', 'bronze', 'new'],
    default: 'new'
  },

  category: {
    type: String // Business category for B2B
  },

  tags: [{
    type: String
  }],

  // Lead Conversion Source
  originalLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },

  convertedAt: {
    type: Date
  },

  convertedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Communication Preferences
  preferredContact: {
    type: String,
    enum: ['email', 'phone', 'whatsapp', 'sms'],
    default: 'phone'
  },

  marketingConsent: {
    type: Boolean,
    default: false
  },

  preferredLanguage: {
    type: String,
    default: 'en'
  },

  // Notes
  notes: [{
    content: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedByName: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  }],

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['id_proof', 'address_proof', 'contract', 'agreement', 'other']
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Activity Timeline
  activities: [{
    action: {
      type: String,
      required: true
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: String,
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ============================================
  // KYC VERIFICATION (Indian Compliance)
  // ============================================
  kyc: {
    status: {
      type: String,
      enum: ['not_started', 'pending', 'documents_submitted', 'verified', 'rejected'],
      default: 'not_started'
    },
    // Aadhar
    aadhar: {
      number: String, // Last 4 digits stored, full number hashed
      numberHash: { type: String, select: false },
      name: String,
      isVerified: { type: Boolean, default: false },
      verifiedAt: Date,
      documentUrl: String,
    },
    // PAN
    pan: {
      number: String, // e.g., ABCDE1234F
      name: String,
      isVerified: { type: Boolean, default: false },
      verifiedAt: Date,
      documentUrl: String,
    },
    // GST (for business customers)
    gst: {
      number: String,
      isVerified: { type: Boolean, default: false },
      documentUrl: String,
    },
    // Address Proof
    addressProof: {
      type: { type: String, enum: ['aadhar', 'passport', 'voter_id', 'driving_license', 'utility_bill'] },
      documentUrl: String,
      isVerified: { type: Boolean, default: false },
    },
    // Verification metadata
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    rejectionReason: String,
    remarks: String,
    consentGiven: { type: Boolean, default: false },
    consentDate: Date,
    consentIP: String,
  },

  // ============================================
  // PAYMENT GATEWAY (PhonePe Merchant)
  // ============================================
  paymentGateway: {
    phonePeCustomerId: String, // PhonePe customer reference
    preferredPaymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'emi'],
      default: 'upi'
    },
    savedInstruments: [{
      type: { type: String, enum: ['upi', 'card'] },
      identifier: String, // UPI VPA or masked card number
      isDefault: { type: Boolean, default: false }
    }],
  },

  // ============================================
  // PORTAL ACCESS
  // ============================================
  portalAccess: {
    enabled: { type: Boolean, default: false },
    password: { type: String, select: false },
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    passwordResetToken: String,
    passwordResetExpires: Date
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'churned'],
    default: 'active'
  },

  lastActivityAt: {
    type: Date,
    default: Date.now
  },

  // Source Website
  websiteSource: {
    type: String,
    default: 'HOH108'
  }
}, {
  timestamps: true
})

// Update metrics from projects
customerSchema.methods.updateMetrics = async function() {
  const Project = mongoose.model('Project')

  const projects = await Project.find({ customer: this._id })

  let totalValue = 0
  let totalPaid = 0
  let activeCount = 0
  let completedCount = 0

  projects.forEach(project => {
    if (project.financials) {
      totalValue += project.financials.agreedAmount || project.financials.quotedAmount || 0
      totalPaid += project.financials.totalPaid || 0
    }

    if (project.status === 'active') activeCount++
    if (project.status === 'completed') completedCount++
  })

  this.metrics = {
    totalProjects: projects.length,
    activeProjects: activeCount,
    completedProjects: completedCount,
    totalValue,
    totalPaid,
    outstandingAmount: totalValue - totalPaid,
    averageProjectValue: projects.length > 0 ? totalValue / projects.length : 0
  }

  // Update segment based on total value
  if (totalValue >= 5000000) this.segment = 'platinum'
  else if (totalValue >= 2500000) this.segment = 'gold'
  else if (totalValue >= 1000000) this.segment = 'silver'
  else if (totalValue > 0) this.segment = 'bronze'
  else this.segment = 'new'

  return this.save()
}

// Add activity to timeline
customerSchema.methods.addActivity = function(activity) {
  this.activities.push(activity)
  this.lastActivityAt = new Date()
  return this.save()
}

// ===========================================
// SOX Control: OTC-007 Credit Management Methods
// ===========================================

/**
 * Check if credit is available for a new order/invoice
 */
customerSchema.methods.checkCreditAvailable = function(amount) {
  // If credit limit is 0 or not set, credit is unlimited
  if (!this.creditLimit || this.creditLimit <= 0) {
    return {
      canProceed: true,
      unlimited: true,
      available: Infinity,
      requested: amount,
      shortfall: 0
    }
  }

  // Check if customer is on credit hold
  if (this.creditHold?.isOnHold) {
    return {
      canProceed: false,
      onHold: true,
      holdReason: this.creditHold.holdReason,
      available: 0,
      requested: amount,
      shortfall: amount
    }
  }

  const available = this.creditLimit - (this.arSummary?.totalOutstanding || 0)
  return {
    canProceed: amount <= available,
    available: Math.max(0, available),
    requested: amount,
    shortfall: Math.max(0, amount - available),
    creditLimit: this.creditLimit,
    currentUtilization: this.arSummary?.totalOutstanding || 0,
    utilizationPercent: this.creditLimit > 0 ?
      Math.round(((this.arSummary?.totalOutstanding || 0) / this.creditLimit) * 100) : 0
  }
}

/**
 * Update AR summary from invoices
 */
customerSchema.methods.updateARSummary = async function() {
  const CustomerInvoice = mongoose.model('CustomerInvoice')

  const invoices = await CustomerInvoice.find({
    customer: this._id,
    status: { $nin: ['cancelled', 'paid'] },
    balanceAmount: { $gt: 0 }
  })

  let current = 0
  let overdue1to30 = 0
  let overdue31to60 = 0
  let overdue61to90 = 0
  let overdue90Plus = 0
  let oldestOverdueDays = 0

  invoices.forEach(inv => {
    const balance = inv.balanceAmount || 0
    switch (inv.agingBucket) {
      case 'current':
        current += balance
        break
      case '1-30':
        overdue1to30 += balance
        break
      case '31-60':
        overdue31to60 += balance
        break
      case '61-90':
        overdue61to90 += balance
        break
      case '90+':
        overdue90Plus += balance
        break
    }
    if (inv.daysOverdue > oldestOverdueDays) {
      oldestOverdueDays = inv.daysOverdue
    }
  })

  const totalOutstanding = current + overdue1to30 + overdue31to60 + overdue61to90 + overdue90Plus

  this.arSummary = {
    totalOutstanding,
    current,
    overdue1to30,
    overdue31to60,
    overdue61to90,
    overdue90Plus,
    oldestOverdueDays,
    lastUpdated: new Date()
  }

  // Update credit utilization and status
  if (this.creditLimit > 0) {
    this.creditUtilization = Math.round((totalOutstanding / this.creditLimit) * 100)
    if (totalOutstanding === 0) {
      this.creditStatus = 'available'
    } else if (totalOutstanding >= this.creditLimit) {
      this.creditStatus = 'exceeded'
    } else if (totalOutstanding >= this.creditLimit * 0.9) {
      this.creditStatus = 'at_limit'
    } else {
      this.creditStatus = 'available'
    }
  }

  return this.save()
}

// Indexes (customerId already indexed via unique: true)
customerSchema.index({ company: 1, status: 1 })
customerSchema.index({ company: 1, accountManager: 1 })
customerSchema.index({ company: 1, segment: 1 })
customerSchema.index({ company: 1, createdAt: -1 })
customerSchema.index({ phone: 1 })
customerSchema.index({ email: 1 })

customerSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.portalAccess?.password) return false
  return await bcrypt.compare(enteredPassword, this.portalAccess.password)
}

export default mongoose.model('Customer', customerSchema)
