import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String, default: 'System' },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
})

const cpDataBatchSchema = new mongoose.Schema({
  batchId: { type: String, unique: true, sparse: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  channelPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelPartner', required: true, index: true },
  channelPartnerName: { type: String },
  spoc: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  spocName: { type: String },
  version: { type: Number, required: true },
  uploadType: { type: String, enum: ['single', 'bulk'], required: true },
  fileName: { type: String },
  fileSize: { type: Number },
  sourceDate: { type: Date },
  uploadedAt: { type: Date, default: Date.now },

  stats: {
    totalRows: { type: Number, default: 0 },
    leadsCreated: { type: Number, default: 0 },
    duplicatesFound: { type: Number, default: 0 },
    errorsFound: { type: Number, default: 0 }
  },

  leads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],

  duplicates: [{
    phone: String,
    name: String,
    reason: String,
    existingLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }
  }],

  rowErrors: [{
    row: Number,
    field: String,
    error: String
  }],

  validationStatus: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },

  paymentStatus: {
    type: String,
    enum: ['not_applicable', 'pending_approval', 'approved', 'paid', 'rejected'],
    default: 'pending_approval'
  },

  paymentDetails: {
    incentiveModel: String,
    amount: { type: Number, default: 0 },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedByName: String,
    approvedAt: Date,
    paidAt: Date,
    transactionRef: String,
    notes: String
  },

  activities: [activitySchema]
}, { timestamps: true })

// Auto-generate batchId (CPB-XXXX pattern)
cpDataBatchSchema.pre('save', async function(next) {
  if (!this.batchId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.batchId = `CPB-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Get next version number for a channel partner
cpDataBatchSchema.statics.getNextVersion = async function(companyId, channelPartnerId) {
  const lastBatch = await this.findOne({ company: companyId, channelPartner: channelPartnerId })
    .sort({ version: -1 })
    .select('version')
    .lean()
  return (lastBatch?.version || 0) + 1
}

// Compound indexes
cpDataBatchSchema.index({ company: 1, channelPartner: 1, version: 1 }, { unique: true })
cpDataBatchSchema.index({ company: 1, uploadedAt: -1 })
cpDataBatchSchema.index({ company: 1, paymentStatus: 1 })

const CPDataBatch = mongoose.model('CPDataBatch', cpDataBatchSchema)

export default CPDataBatch
