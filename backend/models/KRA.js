import mongoose from 'mongoose'

const kraSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  kraCode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['sales', 'operations', 'finance', 'hr', 'customer', 'technical', 'leadership', 'other'],
    default: 'other'
  },
  weight: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  applicableTo: {
    type: String,
    enum: ['all', 'department', 'role', 'individual'],
    default: 'all'
  },
  departments: [{
    type: String
  }],
  roles: [{
    type: String
  }],
  kpis: [{
    kpi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KPIConfig'
    },
    kpiName: String,
    weight: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true })

kraSchema.index({ company: 1, kraCode: 1 }, { unique: true })
kraSchema.index({ company: 1, isActive: 1 })
kraSchema.index({ company: 1, category: 1 })

kraSchema.pre('save', async function(next) {
  if (!this.kraCode) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const prefix = this.category?.substring(0, 3).toUpperCase() || 'KRA'
    this.kraCode = `${prefix}-${String(count + 1).padStart(3, '0')}`
  }
  next()
})

const KRA = mongoose.model('KRA', kraSchema)
export default KRA
