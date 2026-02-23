import mongoose from 'mongoose'

const lineItemSchema = new mongoose.Schema({
  category: { type: String, required: true },
  description: String,
  budgetedAmount: { type: Number, default: 0 },
  actualAmount: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
  variancePercent: { type: Number, default: 0 }
})

const budgetForecastSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  forecastId: {
    type: String,
    unique: true,
    sparse: true
  },

  fiscalYear: {
    type: Number,
    required: [true, 'Fiscal year is required']
  },

  period: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    required: [true, 'Period is required']
  },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  lineItems: [lineItemSchema],

  totalBudgeted: {
    type: Number,
    default: 0
  },

  totalActual: {
    type: Number,
    default: 0
  },

  totalVariance: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'active', 'closed'],
    default: 'draft'
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Pre-save: auto-generate forecastId
budgetForecastSchema.pre('save', async function(next) {
  if (!this.forecastId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.forecastId = `BF-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

// Indexes
budgetForecastSchema.index({ company: 1, fiscalYear: 1 })
budgetForecastSchema.index({ company: 1, status: 1 })
budgetForecastSchema.index({ company: 1, department: 1 })
budgetForecastSchema.index({ company: 1, project: 1 })
// forecastId already has unique:true which creates an index
budgetForecastSchema.index({ company: 1, createdAt: -1 })

const BudgetForecast = mongoose.model('BudgetForecast', budgetForecastSchema)

export default BudgetForecast
