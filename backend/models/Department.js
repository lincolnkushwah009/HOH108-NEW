import mongoose from 'mongoose'

const departmentSchema = new mongoose.Schema({
  // Department ID (e.g., IP-D-001)
  departmentId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Basic Info
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },

  code: {
    type: String,
    required: [true, 'Department code is required'],
    uppercase: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  // Company Association
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // ============================================
  // LOCATION HIERARCHY (City -> Showroom -> Department)
  // ============================================

  // City Level
  city: {
    type: String,
    trim: true,
    index: true
  },

  // Showroom/Branch Level
  showroom: {
    code: { type: String, trim: true },
    name: { type: String, trim: true },
    address: { type: String },
    phone: { type: String },
    email: { type: String }
  },

  // Region (optional grouping)
  region: {
    type: String,
    trim: true
  },

  // Zone (optional higher grouping)
  zone: {
    type: String,
    enum: ['north', 'south', 'east', 'west', 'central'],
    trim: true
  },

  // Location Type
  locationType: {
    type: String,
    enum: ['headquarters', 'regional_office', 'showroom', 'warehouse', 'factory', 'site_office', 'remote'],
    default: 'showroom'
  },

  // ============================================

  // Department Head
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // City Head (for city-level management)
  cityHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Showroom Manager
  showroomManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Parent Department (for hierarchy)
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  // Department Settings
  settings: {
    allowOvertime: { type: Boolean, default: true },
    maxOvertimeHours: { type: Number, default: 4 },
    workingDays: {
      type: [String],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' }
    },
    lunchBreak: {
      start: { type: String, default: '13:00' },
      end: { type: String, default: '14:00' }
    }
  },

  // Leave Quotas (annual allocation)
  leaveQuotas: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 12 },
    earned: { type: Number, default: 15 },
    maternity: { type: Number, default: 180 },
    paternity: { type: Number, default: 15 },
    unpaid: { type: Number, default: 30 }
  },

  // Implementation SPOC
  implementationSPOC: {
    type: String,
    trim: true
  },

  // Cost Center
  costCenter: {
    type: String
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Statistics (cached)
  stats: {
    totalEmployees: { type: Number, default: 0 },
    activeEmployees: { type: Number, default: 0 }
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Compound index for unique department code per company
departmentSchema.index({ company: 1, code: 1 }, { unique: true })
departmentSchema.index({ company: 1, isActive: 1 })
departmentSchema.index({ company: 1, city: 1 })
departmentSchema.index({ company: 1, 'showroom.code': 1 })
departmentSchema.index({ company: 1, city: 1, 'showroom.code': 1 })

// Update stats method
departmentSchema.methods.updateStats = async function() {
  const User = mongoose.model('User')

  const [total, active] = await Promise.all([
    User.countDocuments({ department: this._id }),
    User.countDocuments({ department: this._id, isActive: true })
  ])

  this.stats = {
    totalEmployees: total,
    activeEmployees: active
  }

  return this.save()
}

export default mongoose.model('Department', departmentSchema)
