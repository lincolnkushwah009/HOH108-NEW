import mongoose from 'mongoose'

const attachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false })

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedAt: { type: Date, default: Date.now },
  details: String
}, { _id: false })

const dataSubjectRequestSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  requestId: {
    type: String,
    unique: true,
    sparse: true
  },

  requestType: {
    type: String,
    enum: ['access', 'correction', 'erasure', 'portability', 'objection', 'restriction'],
    required: [true, 'Request type is required']
  },

  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected', 'escalated'],
    default: 'pending'
  },

  dataSubject: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    identityVerified: { type: Boolean, default: false }
  },

  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  relatedLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },

  relatedCustomer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },

  description: {
    type: String
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  dueDate: {
    type: Date
  },

  completedAt: {
    type: Date
  },

  responseDetails: {
    type: String
  },

  attachments: [attachmentSchema],

  activities: [activitySchema],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Pre-save: auto-generate requestId and auto-set dueDate
dataSubjectRequestSchema.pre('save', async function(next) {
  // Auto-generate requestId
  if (!this.requestId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.requestId = `DSR-${String(count + 1).padStart(4, '0')}`
  }

  // Auto-set dueDate to 30 days from creation if not set
  if (!this.dueDate && this.isNew) {
    const due = new Date()
    due.setDate(due.getDate() + 30)
    this.dueDate = due
  }

  next()
})

// Indexes
dataSubjectRequestSchema.index({ company: 1, status: 1 })
dataSubjectRequestSchema.index({ company: 1, requestType: 1 })
dataSubjectRequestSchema.index({ company: 1, createdAt: -1 })
// requestId already has unique:true which creates an index
dataSubjectRequestSchema.index({ dueDate: 1 })

const DataSubjectRequest = mongoose.model('DataSubjectRequest', dataSubjectRequestSchema)

export default DataSubjectRequest
