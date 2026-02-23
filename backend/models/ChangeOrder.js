import mongoose from 'mongoose'

/**
 * ChangeOrder - Project change management
 *
 * Tracks change requests for projects including cost, timeline,
 * and scope impacts with full approval workflow and audit trail.
 */

const changeActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedAt: {
    type: Date,
    default: Date.now
  },
  details: {
    type: String
  }
}, { _id: true })

const attachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true })

const changeOrderSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  changeOrderId: {
    type: String,
    unique: true
  },

  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  changeType: {
    type: String,
    enum: ['scope', 'design', 'material', 'timeline', 'budget'],
    required: true
  },

  impact: {
    cost: {
      original: { type: Number, default: 0 },
      revised: { type: Number, default: 0 },
      variance: { type: Number, default: 0 }
    },
    timeline: {
      originalDays: { type: Number, default: 0 },
      revisedDays: { type: Number, default: 0 },
      varianceDays: { type: Number, default: 0 }
    },
    scope: {
      type: String
    }
  },

  status: {
    type: String,
    enum: ['requested', 'under_review', 'approved', 'rejected', 'implemented'],
    default: 'requested'
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvedAt: {
    type: Date
  },

  implementedAt: {
    type: Date
  },

  attachments: [attachmentSchema],

  activities: [changeActivitySchema],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes
changeOrderSchema.index({ company: 1, project: 1 })
changeOrderSchema.index({ company: 1, status: 1 })
changeOrderSchema.index({ company: 1, changeType: 1 })
changeOrderSchema.index({ requestedBy: 1, status: 1 })
changeOrderSchema.index({ approvedBy: 1 })

// Generate changeOrderId and calculate variances before save
changeOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.changeOrderId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.changeOrderId = `CO-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate cost variance
  if (this.impact && this.impact.cost) {
    this.impact.cost.variance = this.impact.cost.revised - this.impact.cost.original
  }

  // Calculate timeline variance
  if (this.impact && this.impact.timeline) {
    this.impact.timeline.varianceDays = this.impact.timeline.revisedDays - this.impact.timeline.originalDays
  }

  next()
})

const ChangeOrder = mongoose.model('ChangeOrder', changeOrderSchema)

export default ChangeOrder
