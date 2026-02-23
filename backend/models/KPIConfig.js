import mongoose from 'mongoose'

const kpiConfigSchema = new mongoose.Schema({
  configId: {
    type: String,
    unique: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
    // null for global defaults
  },

  // KPI Definition
  kpiCode: {
    type: String,
    required: true,
    index: true
    // e.g., 'lead_conversion_rate', 'avg_response_time'
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['sales', 'projects', 'customer', 'team', 'financial'],
    required: true
  },

  // Formula Configuration
  formula: {
    type: {
      type: String,
      enum: ['ratio', 'average', 'count', 'sum', 'percentage', 'duration'],
      required: true
    },
    numerator: {
      entity: String,        // 'leads', 'customers', 'projects'
      field: String,         // Field to aggregate
      filter: mongoose.Schema.Types.Mixed // MongoDB query filter
    },
    denominator: {
      entity: String,
      field: String,
      filter: mongoose.Schema.Types.Mixed
    },
    aggregation: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    }
  },

  // Thresholds for performance grading
  thresholds: {
    excellent: Number,
    good: Number,
    average: Number,
    poor: Number,
    critical: Number
  },

  // Target Settings
  targets: {
    global: Number,
    byRole: [{
      role: String,
      target: Number
    }],
    byVertical: [{
      vertical: String,
      target: Number
    }]
  },

  // Alert Configuration
  alertEnabled: {
    type: Boolean,
    default: false
  },
  alertThreshold: Number,
  alertSeverity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'warning'
  },

  // Display Settings
  displayFormat: {
    type: String,
    enum: ['number', 'percentage', 'currency', 'duration'],
    default: 'number'
  },
  unit: String,              // 'min', 'hrs', '%', 'INR'
  precision: {
    type: Number,
    default: 1
  },
  showTrend: {
    type: Boolean,
    default: true
  },

  // Visibility Settings
  visibleToRoles: [{
    type: String
  }],
  showOnDashboard: {
    type: Boolean,
    default: true
  },
  dashboardPosition: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Generate configId before save
kpiConfigSchema.pre('save', async function(next) {
  if (!this.configId) {
    const count = await mongoose.model('KPIConfig').countDocuments()
    this.configId = `KPI-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Unique constraint: one kpiCode per company (or global if company is null)
kpiConfigSchema.index({ kpiCode: 1, company: 1 }, { unique: true })
kpiConfigSchema.index({ category: 1, isActive: 1 })
kpiConfigSchema.index({ showOnDashboard: 1, dashboardPosition: 1 })

// Default KPI configurations
kpiConfigSchema.statics.getDefaultKPIs = function() {
  return [
    {
      kpiCode: 'lead_conversion_rate',
      name: 'Lead Conversion Rate',
      description: 'Percentage of leads that are converted to customers',
      category: 'sales',
      formula: {
        type: 'percentage',
        numerator: { entity: 'leads', field: 'status', filter: { status: 'won' } },
        denominator: { entity: 'leads', field: '_id', filter: {} }
      },
      thresholds: { excellent: 35, good: 25, average: 15, poor: 10, critical: 5 },
      targets: { global: 25 },
      displayFormat: 'percentage',
      unit: '%'
    },
    {
      kpiCode: 'avg_response_time',
      name: 'Average Response Time',
      description: 'Average time to first contact with new leads',
      category: 'sales',
      formula: {
        type: 'average',
        numerator: { entity: 'leads', field: 'firstResponseTime' }
      },
      thresholds: { excellent: 15, good: 30, average: 60, poor: 120, critical: 240 },
      targets: { global: 30 },
      displayFormat: 'duration',
      unit: 'min'
    },
    {
      kpiCode: 'lead_aging_avg',
      name: 'Average Lead Age',
      description: 'Average days leads remain unconverted',
      category: 'sales',
      formula: {
        type: 'average',
        numerator: { entity: 'leads', field: 'ageInDays', filter: { status: { $nin: ['won', 'lost'] } } }
      },
      thresholds: { excellent: 7, good: 14, average: 21, poor: 30, critical: 45 },
      displayFormat: 'number',
      unit: 'days'
    },
    {
      kpiCode: 'employee_utilization',
      name: 'Employee Utilization',
      description: 'Percentage of capacity used by employee',
      category: 'team',
      formula: {
        type: 'percentage',
        numerator: { entity: 'leads', field: 'activeCount' },
        denominator: { entity: 'users', field: 'capacity' }
      },
      thresholds: { excellent: 85, good: 70, average: 50, poor: 30, critical: 15 },
      targets: { global: 75 },
      displayFormat: 'percentage',
      unit: '%'
    },
    {
      kpiCode: 'revenue_achievement',
      name: 'Revenue Achievement',
      description: 'Percentage of revenue target achieved',
      category: 'financial',
      formula: {
        type: 'percentage',
        numerator: { entity: 'projects', field: 'revenue', filter: { status: 'completed' } },
        denominator: { entity: 'targets', field: 'revenueTarget' }
      },
      thresholds: { excellent: 110, good: 100, average: 85, poor: 70, critical: 50 },
      targets: { global: 100 },
      displayFormat: 'percentage',
      unit: '%'
    },
    {
      kpiCode: 'project_completion_rate',
      name: 'Project Completion Rate',
      description: 'Percentage of projects completed on time',
      category: 'projects',
      formula: {
        type: 'percentage',
        numerator: { entity: 'projects', field: 'status', filter: { status: 'completed', onTime: true } },
        denominator: { entity: 'projects', field: 'status', filter: { status: 'completed' } }
      },
      thresholds: { excellent: 95, good: 85, average: 75, poor: 60, critical: 40 },
      targets: { global: 85 },
      displayFormat: 'percentage',
      unit: '%'
    }
  ]
}

const KPIConfig = mongoose.model('KPIConfig', kpiConfigSchema)

export default KPIConfig
