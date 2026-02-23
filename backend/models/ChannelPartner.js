import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  createdAt: { type: Date, default: Date.now }
})

const channelPartnerSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  partnerId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  contactPerson: {
    type: String
  },
  businessName: {
    type: String
  },
  gstin: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  spoc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  spocName: {
    type: String
  },
  incentive: {
    percentage: { type: Number },
    flatFee: { type: Number },
    model: {
      type: String,
      enum: ['percentage', 'flat', 'hybrid']
    },
    tier: { type: String }
  },

  // Portal Authentication
  portalAccess: {
    enabled: { type: Boolean, default: false },
    password: { type: String, select: false },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },

  // Performance Metrics
  metrics: {
    totalLeadsSubmitted: { type: Number, default: 0 },
    leadsAccepted: { type: Number, default: 0 },
    leadsDuplicate: { type: Number, default: 0 },
    leadsConverted: { type: Number, default: 0 },
    totalIncentivePaid: { type: Number, default: 0 }
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },

  activities: [activitySchema]
}, {
  timestamps: true
})

// Generate partner ID
channelPartnerSchema.pre('save', async function(next) {
  if (!this.partnerId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.partnerId = `CP-${String(count + 1).padStart(4, '0')}`
  }

  // Hash password if modified
  if (this.isModified('portalAccess.password') && this.portalAccess?.password) {
    const salt = await bcrypt.genSalt(10)
    this.portalAccess.password = await bcrypt.hash(this.portalAccess.password, salt)
  }
  next()
})

// Compare password method
channelPartnerSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.portalAccess?.password) return false
  return await bcrypt.compare(enteredPassword, this.portalAccess.password)
}

// Check if account is locked
channelPartnerSchema.methods.isLocked = function() {
  return this.portalAccess?.lockUntil && this.portalAccess.lockUntil > Date.now()
}

// Increment login attempts
channelPartnerSchema.methods.incLoginAttempts = async function() {
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

// Indexes
channelPartnerSchema.index({ company: 1, email: 1 }, { unique: true })
channelPartnerSchema.index({ company: 1, status: 1 })

const ChannelPartner = mongoose.model('ChannelPartner', channelPartnerSchema)

export default ChannelPartner
