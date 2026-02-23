import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// Permission definitions for RBAC
export const PERMISSIONS = {
  // Lead permissions
  LEADS_VIEW: 'leads:view',
  LEADS_VIEW_ALL: 'leads:view_all',
  LEADS_VIEW_ASSIGNED: 'leads:view_assigned',
  LEADS_CREATE: 'leads:create',
  LEADS_EDIT: 'leads:edit',
  LEADS_DELETE: 'leads:delete',
  LEADS_ASSIGN: 'leads:assign',
  LEADS_CONVERT: 'leads:convert',
  LEADS_EXPORT: 'leads:export',
  LEADS_IMPORT: 'leads:import',

  // Customer permissions
  CUSTOMERS_VIEW: 'customers:view',
  CUSTOMERS_VIEW_ALL: 'customers:view_all',
  CUSTOMERS_VIEW_ASSIGNED: 'customers:view_assigned',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_EDIT: 'customers:edit',
  CUSTOMERS_DELETE: 'customers:delete',
  CUSTOMERS_EXPORT: 'customers:export',

  // Project permissions
  PROJECTS_VIEW: 'projects:view',
  PROJECTS_VIEW_ALL: 'projects:view_all',
  PROJECTS_VIEW_ASSIGNED: 'projects:view_assigned',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_EDIT: 'projects:edit',
  PROJECTS_DELETE: 'projects:delete',
  PROJECTS_MANAGE_TEAM: 'projects:manage_team',
  PROJECTS_MANAGE_FINANCIALS: 'projects:manage_financials',
  PROJECTS_EXPORT: 'projects:export',

  // User management permissions
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',

  // Company permissions
  COMPANY_VIEW: 'company:view',
  COMPANY_EDIT: 'company:edit',
  COMPANY_MANAGE_SETTINGS: 'company:manage_settings',
  COMPANY_MANAGE_PIPELINES: 'company:manage_pipelines',

  // Reports & Analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_VIEW: 'analytics:view',
  DASHBOARD_VIEW: 'dashboard:view',

  // Cross-company access (for mother company)
  CROSS_COMPANY_VIEW: 'cross_company:view',
  CROSS_COMPANY_MANAGE: 'cross_company:manage',

  // Alerts & Notifications
  ALERTS_VIEW: 'alerts:view',
  ALERTS_MANAGE: 'alerts:manage',
  NOTIFICATIONS_VIEW: 'notifications:view',

  // KPI & Performance
  KPI_VIEW: 'kpi:view',
  KPI_MANAGE: 'kpi:manage',
  PERFORMANCE_VIEW: 'performance:view',
  PERFORMANCE_VIEW_ALL: 'performance:view_all',

  // Automation
  AUTOMATION_VIEW: 'automation:view',
  AUTOMATION_MANAGE: 'automation:manage'
}

// Role definitions with their permissions
export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS), // All permissions

  company_admin: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_DELETE, PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.LEADS_CONVERT, PERMISSIONS.LEADS_EXPORT, PERMISSIONS.LEADS_IMPORT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL, PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_EDIT, PERMISSIONS.CUSTOMERS_DELETE, PERMISSIONS.CUSTOMERS_EXPORT,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT, PERMISSIONS.PROJECTS_DELETE, PERMISSIONS.PROJECTS_MANAGE_TEAM,
    PERMISSIONS.PROJECTS_MANAGE_FINANCIALS, PERMISSIONS.PROJECTS_EXPORT,
    PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE, PERMISSIONS.USERS_MANAGE_ROLES,
    PERMISSIONS.COMPANY_VIEW, PERMISSIONS.COMPANY_EDIT, PERMISSIONS.COMPANY_MANAGE_SETTINGS,
    PERMISSIONS.COMPANY_MANAGE_PIPELINES,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT, PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    // Admin permissions for alerts, KPI, performance, automation
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.ALERTS_MANAGE, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.KPI_MANAGE,
    PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL,
    PERMISSIONS.AUTOMATION_VIEW, PERMISSIONS.AUTOMATION_MANAGE
  ],

  sales_manager: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN, PERMISSIONS.LEADS_CONVERT,
    PERMISSIONS.LEADS_EXPORT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL, PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    // Manager permissions for alerts and performance
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL
  ],

  sales_executive: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN, PERMISSIONS.LEADS_CONVERT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  pre_sales: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  project_manager: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT, PERMISSIONS.PROJECTS_MANAGE_TEAM, PERMISSIONS.PROJECTS_MANAGE_FINANCIALS,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL
  ],

  site_engineer: [
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  designer: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  operations: [
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  finance: [
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_MANAGE_FINANCIALS,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT, PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  viewer: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW
  ]
}

const userSchema = new mongoose.Schema({
  // Auto-generated User ID (e.g., IP-U-2024-00001)
  userId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Basic Info
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },

  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },

  phone: {
    type: String,
    maxlength: [15, 'Phone number cannot be longer than 15 characters']
  },

  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },

  // ===========================================
  // SOX Control: ITGC-004 Password Policy
  // ===========================================
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  passwordExpiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
  },
  passwordHistory: [{
    hash: { type: String, select: false },
    changedAt: { type: Date, default: Date.now }
  }],
  mustChangePassword: {
    type: Boolean,
    default: false
  },

  // ===========================================
  // SOX Control: ITGC-004 Account Lockout
  // ===========================================
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date
  },
  lastFailedLoginAt: {
    type: Date
  },
  lastFailedLoginIP: {
    type: String
  },

  avatar: {
    type: String,
    default: ''
  },

  // Company Association
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required'],
    index: true
  },

  // Multi-company access (for super_admin or cross-company users)
  additionalCompanies: [{
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    role: {
      type: String,
      enum: ['viewer', 'company_admin', 'sales_manager', 'project_manager'],
      default: 'viewer'
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Enhanced Role System
  role: {
    type: String,
    enum: [
      'super_admin',      // Full system access (Hancet Globe level)
      'company_admin',    // Full access within their company
      'sales_manager',    // Manages sales team, full lead access
      'sales_executive',  // Works on assigned leads
      'pre_sales',        // Pre-sales team member
      'project_manager',  // Manages projects and teams
      'site_engineer',    // On-site project execution
      'designer',         // Design team member
      'operations',       // Operations team
      'finance',          // Finance team
      'viewer'            // Read-only access
    ],
    default: 'viewer'
  },

  // Reference to custom Role (for permissions)
  userRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },

  // Legacy role support
  legacyRole: {
    type: String,
    enum: ['user', 'admin', 'superadmin']
  },

  // Department/Team
  department: {
    type: String,
    default: 'sales'
  },

  // Sub-Department (for CRM workflow)
  subDepartment: {
    type: String,
    enum: ['pre_sales', 'crm', 'sales_closure', 'design', 'operations', 'finance', 'management', 'approval']
  },

  designation: {
    type: String // Job title
  },

  // Callyzer Integration
  callyzerEmployeeNumber: {
    type: String // Employee number in Callyzer app for call tracking sync
  },

  // Phone number change history (for pre-sales spam number changes)
  previousNumbers: [{
    number: String,
    changedAt: { type: Date, default: Date.now },
    reason: String
  }],

  // ============================================
  // APPROVAL AUTHORITY (for Master Agreement)
  // ============================================
  approvalAuthority: {
    isApprover: {
      type: Boolean,
      default: false
    },
    approverRole: {
      type: String,
      enum: ['cbo', 'ceo', 'design_head', 'operations_head', 'finance_head']
    },
    canApprove: [{
      type: String,
      enum: ['material_quotation', 'material_spend', 'payment_schedule', 'schedule_of_work']
    }],
    approvalLimit: Number, // Max amount they can approve (optional)
    autoNotify: {
      type: Boolean,
      default: true
    }
  },

  // Lead Assignment Capacity
  leadCapacity: {
    maxActive: {
      type: Number,
      default: 50
    },
    currentActive: {
      type: Number,
      default: 0
    }
  },

  // Manager/Reporting structure
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Permission Overrides (for special cases)
  permissionOverrides: {
    granted: [{
      type: String // Additional permissions granted
    }],
    revoked: [{
      type: String // Permissions revoked from role
    }]
  },

  // Work Assignment
  assignedLeads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  }],

  assignedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],

  assignedCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],

  // Performance Metrics
  metrics: {
    leadsAssigned: { type: Number, default: 0 },
    leadsConverted: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },
    activeProjects: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },

  // Karma/Gamification (preserved from original)
  karmaPoints: {
    type: Number,
    default: 0
  },

  // Notification Preferences
  notifications: {
    email: {
      leadAssigned: { type: Boolean, default: true },
      leadUpdated: { type: Boolean, default: true },
      projectUpdated: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: false }
    },
    push: {
      enabled: { type: Boolean, default: true }
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Flag to distinguish employees from other system users
  isEmployee: {
    type: Boolean,
    default: true
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // Session Info
  lastLogin: {
    type: Date
  },

  lastActiveAt: {
    type: Date
  },

  loginHistory: [{
    timestamp: Date,
    ip: String,
    userAgent: String
  }],

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Invitation (for new users invited by admin)
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  invitedAt: Date,

  inviteToken: String,
  inviteTokenExpire: Date,

  // Source Website
  websiteSource: {
    type: String,
    default: 'HOH108'
  },

  // ============================================
  // HR DETAILS & EMPLOYEE LIFECYCLE
  // ============================================
  hrDetails: {
    // Personal Information
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    nationality: { type: String, default: 'Indian' },

    // Address
    permanentAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    currentAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },

    // Emergency Contact
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      address: String
    },

    // Employment Details
    dateOfJoining: { type: Date },
    probationEndDate: { type: Date },
    confirmationDate: { type: Date },
    employmentType: {
      type: String,
      enum: ['probation', 'permanent', 'contract', 'intern', 'consultant'],
      default: 'probation'
    },

    // Location/Assignment
    city: { type: String },
    showroom: { type: String },
    branchCode: { type: String },

    // Experience
    previousExperience: { type: Number, default: 0 }, // in months
    totalExperience: { type: Number, default: 0 }, // in months

    // Exit Details
    dateOfExit: { type: Date },
    exitReason: { type: String },
    lastWorkingDay: { type: Date },
    isRehired: { type: Boolean, default: false }
  },

  // ===========================================
  // SOX Control: HTR-009 Offboarding Reference
  // ===========================================
  offboarding: {
    checklist: { type: mongoose.Schema.Types.ObjectId, ref: 'OffboardingChecklist' },
    clearanceStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'in_progress', 'cleared'],
      default: 'not_applicable'
    },
    accessRevocationStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'partial', 'complete'],
      default: 'not_applicable'
    },
    exitDate: Date
  },

  // ============================================
  // EMPLOYEE DOCUMENTS (T-2 and others)
  // ============================================
  documents: [{
    documentType: {
      type: String,
      enum: [
        // T-2 Onboarding Documents
        'aadhar_card',
        'pan_card',
        'passport',
        'voter_id',
        'driving_license',
        'photo',
        'resume',
        'offer_letter',
        'appointment_letter',
        'joining_letter',
        'relieving_letter_prev',
        'experience_letter_prev',
        'salary_slip_prev',
        'education_certificate_10th',
        'education_certificate_12th',
        'education_certificate_graduation',
        'education_certificate_post_graduation',
        'education_certificate_other',
        'bank_passbook',
        'cancelled_cheque',
        'address_proof',
        'background_verification',
        'medical_certificate',
        'pf_form',
        'esic_form',
        'form_11',
        'form_2_nomination',
        'gratuity_nomination',
        // Generated Documents
        'relieving_letter',
        'experience_letter',
        'bonafide_certificate',
        'salary_certificate',
        'noc_letter',
        'appraisal_letter',
        'warning_letter',
        'termination_letter',
        // Other
        'other'
      ],
      required: true
    },
    documentName: { type: String, required: true },
    documentNumber: String, // For ID proofs
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    issuedDate: Date,
    expiryDate: Date,
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: String
  }],

  // Document Verification Status
  documentVerificationStatus: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'complete', 'rejected'],
      default: 'pending'
    },
    requiredDocuments: [{
      documentType: String,
      isSubmitted: { type: Boolean, default: false },
      isVerified: { type: Boolean, default: false }
    }],
    lastUpdated: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // ============================================
  // SALARY STRUCTURE (Indian Payroll)
  // ============================================
  salary: {
    // Basic Components
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 }, // House Rent Allowance
    otherAllowances: { type: Number, default: 0 },

    // Calculated - Gross Salary = Basic + HRA + Other Allowances
    grossSalary: { type: Number, default: 0 },

    // Employee Deductions
    deductions: {
      epfoEmployee: { type: Number, default: 0 }, // 12% of Basic
      esicEmployee: { type: Number, default: 0 }, // 0.75% of Gross (if applicable)
      professionalTax: { type: Number, default: 0 }, // State-wise PT
      incomeTax: { type: Number, default: 0 }, // TDS
      otherDeductions: { type: Number, default: 0 }
    },

    // Net Salary = Gross - All Deductions
    netSalaryBeforeIT: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },

    // Employer Contributions
    employerContributions: {
      epfoEmployer: { type: Number, default: 0 }, // 12% of Basic (3.67% EPF + 8.33% EPS)
      esicEmployer: { type: Number, default: 0 }, // 3.25% of Gross (if applicable)
      gratuity: { type: Number, default: 0 }, // Optional
      otherContributions: { type: Number, default: 0 }
    },

    // Cost to Company = Gross + Employer Contributions
    ctc: { type: Number, default: 0 },

    // Configuration
    config: {
      epfoApplicable: { type: Boolean, default: true },
      esicApplicable: { type: Boolean, default: false }, // Applicable if Gross <= 21000
      ptState: { type: String, default: 'Maharashtra' }, // For PT calculation
      pfAccountNumber: String,
      uanNumber: String,
      esicNumber: String,
      panNumber: String,
      bankAccountNumber: String,
      bankName: String,
      ifscCode: String
    },

    // Salary History
    history: [{
      effectiveFrom: { type: Date },
      effectiveTo: { type: Date },
      basicSalary: Number,
      grossSalary: Number,
      ctc: Number,
      reason: String, // 'joining', 'increment', 'promotion', 'revision'
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }],

    lastUpdated: { type: Date }
  }
}, {
  timestamps: true
})

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next()
  }

  // SOX Control: ITGC-004 - Store old password in history before hashing new one
  if (this.password && !this.isNew) {
    // Get the current hashed password before it's changed
    const currentUser = await this.constructor.findById(this._id).select('+password')
    if (currentUser && currentUser.password) {
      // Keep last 5 passwords in history
      if (!this.passwordHistory) this.passwordHistory = []
      this.passwordHistory.push({
        hash: currentUser.password,
        changedAt: currentUser.passwordChangedAt || new Date()
      })
      // Keep only last 5
      if (this.passwordHistory.length > 5) {
        this.passwordHistory = this.passwordHistory.slice(-5)
      }
    }
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)

  // Update password timestamps
  this.passwordChangedAt = new Date()
  this.passwordExpiresAt = new Date(Date.now() + (parseInt(process.env.PASSWORD_EXPIRY_DAYS) || 90) * 24 * 60 * 60 * 1000)
  this.mustChangePassword = false
  this.failedLoginAttempts = 0
  this.lockoutUntil = null

  next()
})

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// ===========================================
// SOX Control: ITGC-004 Account Lockout Methods
// ===========================================

/**
 * Check if account is currently locked
 */
userSchema.methods.isLocked = function() {
  return this.lockoutUntil && this.lockoutUntil > new Date()
}

/**
 * Check if password is expired
 */
userSchema.methods.isPasswordExpired = function() {
  if (!this.passwordExpiresAt) return false
  return new Date() > this.passwordExpiresAt
}

/**
 * Get remaining lockout time in minutes
 */
userSchema.methods.getLockoutRemainingMinutes = function() {
  if (!this.isLocked()) return 0
  return Math.ceil((this.lockoutUntil - new Date()) / (60 * 1000))
}

/**
 * Increment failed login attempts
 * Locks account after 5 failed attempts for 30 minutes
 */
userSchema.methods.incrementFailedLogins = async function(ipAddress) {
  const MAX_FAILED_ATTEMPTS = 5
  const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes

  // Reset if lockout has expired
  if (this.lockoutUntil && this.lockoutUntil < new Date()) {
    this.failedLoginAttempts = 0
    this.lockoutUntil = null
  }

  this.failedLoginAttempts += 1
  this.lastFailedLoginAt = new Date()
  this.lastFailedLoginIP = ipAddress

  // Lock account if max attempts reached
  if (this.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    this.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION)
  }

  return this.save({ validateBeforeSave: false })
}

/**
 * Reset failed login attempts on successful login
 */
userSchema.methods.resetFailedLogins = async function() {
  if (this.failedLoginAttempts > 0 || this.lockoutUntil) {
    this.failedLoginAttempts = 0
    this.lockoutUntil = null
    return this.save({ validateBeforeSave: false })
  }
  return this
}

/**
 * Check if password was changed after token was issued
 * Used for token invalidation on password change
 */
userSchema.methods.changedPasswordAfter = function(tokenIssuedAt) {
  if (!this.passwordChangedAt) return false

  const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
  return tokenIssuedAt < changedTimestamp
}

/**
 * Check if new password is in history
 */
userSchema.methods.isPasswordInHistory = async function(newPassword) {
  if (!this.passwordHistory || this.passwordHistory.length === 0) return false

  for (const entry of this.passwordHistory) {
    if (entry.hash) {
      const matches = await bcrypt.compare(newPassword, entry.hash)
      if (matches) return true
    }
  }

  // Also check against current password
  const currentPassword = await this.constructor.findById(this._id).select('+password')
  if (currentPassword?.password) {
    const matchesCurrent = await bcrypt.compare(newPassword, currentPassword.password)
    if (matchesCurrent) return true
  }

  return false
}

// Get all permissions for this user (role + overrides)
userSchema.methods.getPermissions = function() {
  const rolePermissions = ROLE_PERMISSIONS[this.role] || []
  const granted = this.permissionOverrides?.granted || []
  const revoked = this.permissionOverrides?.revoked || []

  // Combine role permissions with granted, then remove revoked
  const allPermissions = [...new Set([...rolePermissions, ...granted])]
  return allPermissions.filter(p => !revoked.includes(p))
}

// Check if user has a specific permission
userSchema.methods.hasPermission = function(permission) {
  const permissions = this.getPermissions()
  return permissions.includes(permission)
}

// Check if user has any of the given permissions
userSchema.methods.hasAnyPermission = function(permissionList) {
  const permissions = this.getPermissions()
  return permissionList.some(p => permissions.includes(p))
}

// Check if user has all of the given permissions
userSchema.methods.hasAllPermissions = function(permissionList) {
  const permissions = this.getPermissions()
  return permissionList.every(p => permissions.includes(p))
}

// Check if user can access a specific company
userSchema.methods.canAccessCompany = function(companyId) {
  const companyIdStr = (companyId?._id || companyId)?.toString()

  // Super admin can access all companies
  if (this.role === 'super_admin') return true

  // Check primary company (handle both populated and unpopulated)
  const primaryId = this.company?._id || this.company
  if (primaryId?.toString() === companyIdStr) return true

  // Check additional companies (handle both populated and unpopulated)
  if (this.additionalCompanies && this.additionalCompanies.length > 0) {
    return this.additionalCompanies.some(ac => {
      const acId = ac.company?._id || ac.company
      return acId?.toString() === companyIdStr
    })
  }

  return false
}

// Get role for a specific company
userSchema.methods.getRoleForCompany = function(companyId) {
  const companyIdStr = (companyId?._id || companyId)?.toString()

  if (this.role === 'super_admin') return 'super_admin'

  // Handle both populated and unpopulated company field
  const primaryId = this.company?._id || this.company
  if (primaryId?.toString() === companyIdStr) return this.role

  const additionalCompany = this.additionalCompanies?.find(ac => {
    const acId = ac.company?._id || ac.company
    return acId?.toString() === companyIdStr
  })

  return additionalCompany ? additionalCompany.role : null
}

// Update user metrics
userSchema.methods.updateMetrics = async function() {
  const Lead = mongoose.model('Lead')
  const Project = mongoose.model('Project')

  const [assignedLeads, convertedLeads, activeProjects, completedProjects] = await Promise.all([
    Lead.countDocuments({ assignedTo: this._id }),
    Lead.countDocuments({ assignedTo: this._id, isConverted: true }),
    Project.countDocuments({ $or: [{ projectManager: this._id }, { 'teamMembers.user': this._id }], status: 'active' }),
    Project.countDocuments({ $or: [{ projectManager: this._id }, { 'teamMembers.user': this._id }], status: 'completed' })
  ])

  this.metrics = {
    leadsAssigned: assignedLeads,
    leadsConverted: convertedLeads,
    projectsCompleted: completedProjects,
    activeProjects: activeProjects,
    conversionRate: assignedLeads > 0 ? Math.round((convertedLeads / assignedLeads) * 100) : 0
  }

  return this.save()
}

// Indexes (email and userId already indexed via unique: true)
userSchema.index({ company: 1, role: 1 })
userSchema.index({ company: 1, department: 1 })
userSchema.index({ company: 1, isActive: 1 })
userSchema.index({ reportsTo: 1 })

export default mongoose.model('User', userSchema)
