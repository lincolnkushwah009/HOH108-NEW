import mongoose from 'mongoose'

/**
 * Production Cost - COGS calculation and cost tracking
 * FR-PPC-007: Cost Accumulation & COGS Calculation
 */

const costBreakdownSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  description: String,
  quantity: Number,
  unit: String,
  unitCost: Number,
  totalCost: {
    type: Number,
    default: 0
  },
  reference: {
    type: String,
    enum: ['material_consumption', 'labor_entry', 'overhead', 'direct_expense', 'vendor_invoice'],
  },
  referenceId: mongoose.Schema.Types.ObjectId,
  referenceNumber: String
})

const productionCostSchema = new mongoose.Schema({
  // System generated ID: COST-YYYY-MM-XXXXX
  costId: {
    type: String,
    unique: true,
    sparse: true
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Work Order Reference
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true,
    index: true
  },

  workOrderId: String,

  // Project Reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },

  projectName: String,

  // Cost Period
  period: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'total'],
      default: 'total'
    },
    startDate: Date,
    endDate: Date
  },

  // Estimated Costs (from BOM & Planning)
  estimatedCosts: {
    material: {
      type: Number,
      default: 0
    },
    labor: {
      type: Number,
      default: 0
    },
    overhead: {
      type: Number,
      default: 0
    },
    directExpenses: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },

  // Actual Costs (from consumption & entries)
  actualCosts: {
    material: {
      type: Number,
      default: 0
    },
    labor: {
      type: Number,
      default: 0
    },
    overhead: {
      type: Number,
      default: 0
    },
    directExpenses: {
      type: Number,
      default: 0
    },
    scrap: {
      type: Number,
      default: 0
    },
    rework: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },

  // Cost Variance
  variance: {
    material: {
      type: Number,
      default: 0
    },
    labor: {
      type: Number,
      default: 0
    },
    overhead: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },

  // COGS Calculation
  cogs: {
    directMaterial: {
      type: Number,
      default: 0
    },
    directLabor: {
      type: Number,
      default: 0
    },
    manufacturingOverhead: {
      type: Number,
      default: 0
    },
    totalCOGS: {
      type: Number,
      default: 0
    },
    cogsPerUnit: {
      type: Number,
      default: 0
    },
    unitsProduced: {
      type: Number,
      default: 0
    }
  },

  // Detailed Breakdowns
  materialBreakdown: [costBreakdownSchema],
  laborBreakdown: [costBreakdownSchema],
  overheadBreakdown: [costBreakdownSchema],
  directExpenseBreakdown: [costBreakdownSchema],

  // Overhead Allocation
  overheadAllocation: {
    method: {
      type: String,
      enum: ['direct_labor_hours', 'direct_labor_cost', 'machine_hours', 'material_cost', 'units_produced', 'fixed_percentage'],
      default: 'direct_labor_cost'
    },
    rate: {
      type: Number,
      default: 0
    },
    base: {
      type: Number,
      default: 0
    },
    allocatedAmount: {
      type: Number,
      default: 0
    }
  },

  // Profitability
  profitability: {
    sellingPrice: {
      type: Number,
      default: 0
    },
    grossProfit: {
      type: Number,
      default: 0
    },
    grossMargin: {
      type: Number,
      default: 0
    },
    contributionMargin: {
      type: Number,
      default: 0
    }
  },

  // Cost Metrics
  metrics: {
    materialCostPerUnit: {
      type: Number,
      default: 0
    },
    laborCostPerUnit: {
      type: Number,
      default: 0
    },
    overheadCostPerUnit: {
      type: Number,
      default: 0
    },
    scrapRate: {
      type: Number,
      default: 0
    },
    laborEfficiency: {
      type: Number,
      default: 0
    },
    materialUtilization: {
      type: Number,
      default: 0
    }
  },

  // Status
  status: {
    type: String,
    enum: ['accumulating', 'calculated', 'verified', 'finalized', 'posted'],
    default: 'accumulating',
    index: true
  },

  // Finalization
  finalized: {
    isFinalized: {
      type: Boolean,
      default: false
    },
    finalizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    finalizedByName: String,
    finalizedAt: Date
  },

  // Finance Integration
  finance: {
    postedToGL: {
      type: Boolean,
      default: false
    },
    glPostingDate: Date,
    journalEntryId: String,
    costCenter: String,
    profitCenter: String
  },

  // Notes
  notes: String,
  varianceExplanation: String,

  // Audit
  calculatedAt: Date,
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastRecalculatedAt: Date
}, {
  timestamps: true
})

// Generate Cost ID
productionCostSchema.pre('save', async function(next) {
  if (!this.costId) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    const count = await this.constructor.countDocuments({
      company: this.company,
      createdAt: {
        $gte: new Date(year, now.getMonth(), 1),
        $lt: new Date(year, now.getMonth() + 1, 1)
      }
    })

    this.costId = `COST-${year}-${month}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

// Calculate totals and variances
productionCostSchema.pre('save', function(next) {
  // Calculate estimated total
  this.estimatedCosts.total = this.estimatedCosts.material +
    this.estimatedCosts.labor +
    this.estimatedCosts.overhead +
    this.estimatedCosts.directExpenses

  // Calculate actual total
  this.actualCosts.total = this.actualCosts.material +
    this.actualCosts.labor +
    this.actualCosts.overhead +
    this.actualCosts.directExpenses +
    this.actualCosts.scrap +
    this.actualCosts.rework

  // Calculate variances
  this.variance.material = this.actualCosts.material - this.estimatedCosts.material
  this.variance.labor = this.actualCosts.labor - this.estimatedCosts.labor
  this.variance.overhead = this.actualCosts.overhead - this.estimatedCosts.overhead
  this.variance.total = this.actualCosts.total - this.estimatedCosts.total

  if (this.estimatedCosts.total > 0) {
    this.variance.percentage = (this.variance.total / this.estimatedCosts.total) * 100
  }

  // Calculate COGS
  this.cogs.directMaterial = this.actualCosts.material
  this.cogs.directLabor = this.actualCosts.labor
  this.cogs.manufacturingOverhead = this.actualCosts.overhead
  this.cogs.totalCOGS = this.cogs.directMaterial + this.cogs.directLabor + this.cogs.manufacturingOverhead

  if (this.cogs.unitsProduced > 0) {
    this.cogs.cogsPerUnit = this.cogs.totalCOGS / this.cogs.unitsProduced
  }

  // Calculate per unit metrics
  if (this.cogs.unitsProduced > 0) {
    this.metrics.materialCostPerUnit = this.actualCosts.material / this.cogs.unitsProduced
    this.metrics.laborCostPerUnit = this.actualCosts.labor / this.cogs.unitsProduced
    this.metrics.overheadCostPerUnit = this.actualCosts.overhead / this.cogs.unitsProduced
  }

  // Calculate scrap rate
  const totalMaterialCost = this.actualCosts.material + this.actualCosts.scrap
  if (totalMaterialCost > 0) {
    this.metrics.scrapRate = (this.actualCosts.scrap / totalMaterialCost) * 100
  }

  // Calculate profitability
  if (this.profitability.sellingPrice > 0) {
    this.profitability.grossProfit = this.profitability.sellingPrice - this.cogs.totalCOGS
    this.profitability.grossMargin = (this.profitability.grossProfit / this.profitability.sellingPrice) * 100
  }

  next()
})

// Static method to calculate costs for a work order
productionCostSchema.statics.calculateForWorkOrder = async function(workOrderId, userId) {
  const WorkOrder = mongoose.model('WorkOrder')
  const MaterialConsumption = mongoose.model('MaterialConsumption')
  const LaborEntry = mongoose.model('LaborEntry')

  const workOrder = await WorkOrder.findById(workOrderId).populate('project')
  if (!workOrder) throw new Error('Work order not found')

  // Get or create cost record
  let costRecord = await this.findOne({ workOrder: workOrderId, 'period.type': 'total' })

  if (!costRecord) {
    costRecord = new this({
      company: workOrder.company,
      workOrder: workOrderId,
      workOrderId: workOrder.workOrderId,
      project: workOrder.project._id,
      projectName: workOrder.project.title,
      period: { type: 'total' },
      estimatedCosts: workOrder.estimatedCost
    })
  }

  // Get material consumption summary
  const materialSummary = await MaterialConsumption.getWorkOrderSummary(workOrderId)

  // Get labor summary
  const laborSummary = await LaborEntry.getWorkOrderSummary(workOrderId)

  // Update actual costs
  costRecord.actualCosts.material = materialSummary.totals.totalConsumptionCost || 0
  costRecord.actualCosts.scrap = materialSummary.totals.totalScrapCost || 0
  costRecord.actualCosts.labor = laborSummary.totals.totalCost || 0

  // Build material breakdown
  costRecord.materialBreakdown = materialSummary.byMaterial.map(m => ({
    category: 'material',
    description: m.materialName,
    quantity: m.totalConsumed,
    unit: m.unit,
    totalCost: m.totalConsumptionCost,
    reference: 'material_consumption'
  }))

  // Build labor breakdown
  costRecord.laborBreakdown = laborSummary.byEmployee.map(e => ({
    category: 'labor',
    description: e.employeeName,
    quantity: e.totalHours,
    unit: 'hours',
    totalCost: e.totalCost,
    reference: 'labor_entry'
  }))

  // Update units produced
  costRecord.cogs.unitsProduced = workOrder.quantity.completed || 0

  // Calculate overhead (example: 15% of labor cost)
  costRecord.overheadAllocation.method = 'direct_labor_cost'
  costRecord.overheadAllocation.rate = 15
  costRecord.overheadAllocation.base = costRecord.actualCosts.labor
  costRecord.overheadAllocation.allocatedAmount = costRecord.actualCosts.labor * 0.15
  costRecord.actualCosts.overhead = costRecord.overheadAllocation.allocatedAmount

  // Update selling price from project
  if (workOrder.project.financials) {
    const projectValue = workOrder.project.financials.finalAmount || workOrder.project.financials.agreedAmount || 0
    // Allocate based on work order's share (simplified)
    costRecord.profitability.sellingPrice = projectValue
  }

  // Update metrics
  if (laborSummary.totals.totalHours > 0 && workOrder.schedule.estimatedDuration) {
    const estimatedHours = workOrder.schedule.estimatedDuration.value *
      (workOrder.schedule.estimatedDuration.unit === 'days' ? 8 : workOrder.schedule.estimatedDuration.unit === 'weeks' ? 40 : 1)
    costRecord.metrics.laborEfficiency = (estimatedHours / laborSummary.totals.totalHours) * 100
  }

  costRecord.status = 'calculated'
  costRecord.calculatedAt = new Date()
  costRecord.calculatedBy = userId
  costRecord.lastRecalculatedAt = new Date()

  await costRecord.save()

  // Update work order with actual costs
  await WorkOrder.findByIdAndUpdate(workOrderId, {
    actualCost: {
      material: costRecord.actualCosts.material,
      labor: costRecord.actualCosts.labor,
      overhead: costRecord.actualCosts.overhead,
      total: costRecord.actualCosts.total
    },
    costVariance: costRecord.variance.total
  })

  return costRecord
}

// Static method to get project cost summary
productionCostSchema.statics.getProjectSummary = async function(projectId) {
  const summary = await this.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: null,
        totalEstimatedMaterial: { $sum: '$estimatedCosts.material' },
        totalEstimatedLabor: { $sum: '$estimatedCosts.labor' },
        totalEstimatedOverhead: { $sum: '$estimatedCosts.overhead' },
        totalEstimated: { $sum: '$estimatedCosts.total' },
        totalActualMaterial: { $sum: '$actualCosts.material' },
        totalActualLabor: { $sum: '$actualCosts.labor' },
        totalActualOverhead: { $sum: '$actualCosts.overhead' },
        totalActualScrap: { $sum: '$actualCosts.scrap' },
        totalActual: { $sum: '$actualCosts.total' },
        totalCOGS: { $sum: '$cogs.totalCOGS' },
        totalUnits: { $sum: '$cogs.unitsProduced' },
        workOrderCount: { $sum: 1 }
      }
    },
    {
      $project: {
        estimated: {
          material: '$totalEstimatedMaterial',
          labor: '$totalEstimatedLabor',
          overhead: '$totalEstimatedOverhead',
          total: '$totalEstimated'
        },
        actual: {
          material: '$totalActualMaterial',
          labor: '$totalActualLabor',
          overhead: '$totalActualOverhead',
          scrap: '$totalActualScrap',
          total: '$totalActual'
        },
        variance: { $subtract: ['$totalActual', '$totalEstimated'] },
        variancePercentage: {
          $cond: [
            { $eq: ['$totalEstimated', 0] },
            0,
            { $multiply: [{ $divide: [{ $subtract: ['$totalActual', '$totalEstimated'] }, '$totalEstimated'] }, 100] }
          ]
        },
        totalCOGS: 1,
        avgCOGSPerUnit: {
          $cond: [
            { $eq: ['$totalUnits', 0] },
            0,
            { $divide: ['$totalCOGS', '$totalUnits'] }
          ]
        },
        workOrderCount: 1
      }
    }
  ])

  return summary[0] || {
    estimated: { material: 0, labor: 0, overhead: 0, total: 0 },
    actual: { material: 0, labor: 0, overhead: 0, scrap: 0, total: 0 },
    variance: 0,
    variancePercentage: 0,
    totalCOGS: 0,
    avgCOGSPerUnit: 0,
    workOrderCount: 0
  }
}

// Indexes
productionCostSchema.index({ company: 1, workOrder: 1 })
productionCostSchema.index({ company: 1, project: 1 })
productionCostSchema.index({ company: 1, status: 1 })
productionCostSchema.index({ company: 1, 'period.startDate': -1 })

export default mongoose.model('ProductionCost', productionCostSchema)
