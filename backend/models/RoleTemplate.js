import mongoose from 'mongoose'

const roleTemplateSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  templateCode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  department: {
    type: String,
    enum: ['sales', 'operations', 'finance', 'hr', 'design', 'production', 'management', 'other'],
    default: 'other'
  },
  level: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive'],
    default: 'mid'
  },
  kras: [{
    kra: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KRA'
    },
    kraName: String,
    weight: Number
  }],
  competencies: [{
    name: String,
    description: String,
    requiredLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  }],
  responsibilities: [String],
  qualifications: [String],
  salaryRange: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'INR' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  assignedEmployees: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true })

roleTemplateSchema.index({ company: 1, templateCode: 1 }, { unique: true })
roleTemplateSchema.index({ company: 1, department: 1 })
roleTemplateSchema.index({ company: 1, isActive: 1 })

roleTemplateSchema.pre('save', async function(next) {
  if (!this.templateCode) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const prefix = this.department?.substring(0, 3).toUpperCase() || 'ROL'
    this.templateCode = `${prefix}-${String(count + 1).padStart(3, '0')}`
  }
  next()
})

const RoleTemplate = mongoose.model('RoleTemplate', roleTemplateSchema)
export default RoleTemplate
