import mongoose from 'mongoose'

const sodConflictSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  conflictId: {
    type: String,
    unique: true,
    sparse: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },

  conflictType: {
    type: String,
    enum: ['role_conflict', 'permission_conflict', 'transaction_conflict'],
    required: [true, 'Conflict type is required']
  },

  conflictingRoles: [{
    type: String
  }],

  conflictingPermissions: [{
    type: String
  }],

  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Risk level is required']
  },

  status: {
    type: String,
    enum: ['detected', 'acknowledged', 'mitigated', 'accepted', 'resolved'],
    default: 'detected'
  },

  mitigationControl: {
    type: String
  },

  detectedAt: {
    type: Date,
    default: Date.now
  },

  resolvedAt: {
    type: Date
  },

  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  reviewPeriod: {
    from: Date,
    to: Date
  }
}, {
  timestamps: true
})

// Pre-save: auto-generate conflictId
sodConflictSchema.pre('save', async function(next) {
  if (!this.conflictId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.conflictId = `SOD-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Indexes
sodConflictSchema.index({ company: 1, user: 1 })
sodConflictSchema.index({ company: 1, status: 1 })
sodConflictSchema.index({ company: 1, riskLevel: 1 })
sodConflictSchema.index({ company: 1, conflictType: 1 })
// conflictId already has unique:true which creates an index
sodConflictSchema.index({ company: 1, createdAt: -1 })

const SoDConflict = mongoose.model('SoDConflict', sodConflictSchema)

export default SoDConflict
