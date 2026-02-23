import mongoose from 'mongoose'

const historySchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedAt: { type: Date, default: Date.now },
  reason: String
}, { _id: false })

const consentSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },

  consentType: {
    type: String,
    enum: ['marketing_email', 'marketing_sms', 'marketing_whatsapp', 'data_processing', 'data_sharing', 'cookie_tracking', 'profiling'],
    required: [true, 'Consent type is required']
  },

  status: {
    type: String,
    enum: ['given', 'withdrawn', 'expired'],
    default: 'given'
  },

  consentGivenAt: {
    type: Date,
    default: Date.now
  },

  consentWithdrawnAt: {
    type: Date
  },

  expiresAt: {
    type: Date
  },

  source: {
    type: String,
    enum: ['web_form', 'app', 'manual', 'api', 'import'],
    default: 'manual'
  },

  sourceDetails: {
    type: String
  },

  ipAddress: {
    type: String
  },

  legalBasis: {
    type: String,
    enum: ['consent', 'contract', 'legal_obligation', 'legitimate_interest'],
    default: 'consent'
  },

  version: {
    type: String
  },

  consentText: {
    type: String
  },

  history: [historySchema]
}, {
  timestamps: true
})

// Indexes
consentSchema.index({ company: 1, user: 1, consentType: 1 })
consentSchema.index({ company: 1, lead: 1 })
consentSchema.index({ company: 1, customer: 1 })
consentSchema.index({ company: 1, status: 1 })
consentSchema.index({ expiresAt: 1 })

const Consent = mongoose.model('Consent', consentSchema)

export default Consent
