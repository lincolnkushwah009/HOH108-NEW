import mongoose from 'mongoose'

const tdsConfigSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor is required']
  },

  section: {
    type: String,
    required: [true, 'TDS section is required']
  },

  tdsRate: {
    type: Number,
    required: [true, 'TDS rate is required'],
    min: 0,
    max: 100
  },

  thresholdAmount: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  pan: {
    type: String
  },

  tanNumber: {
    type: String
  },

  validFrom: {
    type: Date
  },

  validTo: {
    type: Date
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
tdsConfigSchema.index({ company: 1, vendor: 1 })
tdsConfigSchema.index({ company: 1, section: 1 })
tdsConfigSchema.index({ company: 1, isActive: 1 })
tdsConfigSchema.index({ pan: 1 })

const TDSConfig = mongoose.model('TDSConfig', tdsConfigSchema)

export default TDSConfig
