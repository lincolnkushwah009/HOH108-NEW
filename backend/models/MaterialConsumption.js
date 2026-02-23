import mongoose from 'mongoose'

/**
 * Material Consumption - Track actual usage of materials in production activities
 * FR-PPC-004: Track Material Issue and Consumption in Production/Site
 */

const materialConsumptionSchema = new mongoose.Schema({
  // System generated ID: MC-YYYY-MM-XXXXX
  consumptionId: {
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

  // Material Issue Reference
  materialIssue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaterialIssue',
    required: true
  },

  materialIssueId: String,

  // Work Order Reference
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true,
    index: true
  },

  // Project Reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },

  // Activity Reference (if applicable)
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionActivity'
  },

  activityName: String,

  // Material Details
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: true
  },

  materialDetails: {
    skuCode: String,
    name: String,
    description: String,
    category: String,
    unit: String
  },

  // Consumption Details
  consumptionDate: {
    type: Date,
    default: Date.now,
    required: true
  },

  quantityConsumed: {
    type: Number,
    required: true,
    min: 0
  },

  quantityScrap: {
    type: Number,
    default: 0,
    min: 0
  },

  unit: {
    type: String,
    default: 'pcs'
  },

  // Scrap Details
  scrapReason: {
    type: String,
    enum: ['defective_material', 'normal_waste', 'cutting_waste', 'damage', 'design_error', 'other'],
    default: 'normal_waste'
  },

  scrapDescription: String,

  // Costing
  unitCost: {
    type: Number,
    required: true,
    min: 0
  },

  consumptionCost: {
    type: Number,
    default: 0
  },

  scrapCost: {
    type: Number,
    default: 0
  },

  totalCost: {
    type: Number,
    default: 0
  },

  // Location
  consumptionLocation: {
    type: {
      type: String,
      enum: ['factory', 'site', 'production_floor', 'assembly_area'],
      default: 'production_floor'
    },
    name: String,
    code: String
  },

  // Personnel
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  recordedByName: String,

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvedByName: String,
  approvedAt: Date,

  // Status
  status: {
    type: String,
    enum: ['recorded', 'approved', 'finalized', 'adjusted'],
    default: 'recorded',
    index: true
  },

  // Notes
  notes: String,

  // Attachments (photos of usage, scrap, etc.)
  attachments: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['photo', 'document', 'other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// Generate Consumption ID
materialConsumptionSchema.pre('save', async function(next) {
  if (!this.consumptionId) {
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

    this.consumptionId = `MC-${year}-${month}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

// Calculate costs
materialConsumptionSchema.pre('save', function(next) {
  this.consumptionCost = this.quantityConsumed * this.unitCost
  this.scrapCost = this.quantityScrap * this.unitCost
  this.totalCost = this.consumptionCost + this.scrapCost
  next()
})

// Static method to get consumption summary by work order
materialConsumptionSchema.statics.getWorkOrderSummary = async function(workOrderId) {
  const summary = await this.aggregate([
    { $match: { workOrder: new mongoose.Types.ObjectId(workOrderId) } },
    {
      $group: {
        _id: '$material',
        materialName: { $first: '$materialDetails.name' },
        totalConsumed: { $sum: '$quantityConsumed' },
        totalScrap: { $sum: '$quantityScrap' },
        totalConsumptionCost: { $sum: '$consumptionCost' },
        totalScrapCost: { $sum: '$scrapCost' },
        unit: { $first: '$unit' }
      }
    },
    {
      $project: {
        material: '$_id',
        materialName: 1,
        totalConsumed: 1,
        totalScrap: 1,
        totalConsumptionCost: 1,
        totalScrapCost: 1,
        totalCost: { $add: ['$totalConsumptionCost', '$totalScrapCost'] },
        scrapPercentage: {
          $multiply: [
            { $divide: ['$totalScrap', { $add: ['$totalConsumed', '$totalScrap'] }] },
            100
          ]
        },
        unit: 1
      }
    }
  ])

  const totals = await this.aggregate([
    { $match: { workOrder: new mongoose.Types.ObjectId(workOrderId) } },
    {
      $group: {
        _id: null,
        totalConsumptionCost: { $sum: '$consumptionCost' },
        totalScrapCost: { $sum: '$scrapCost' },
        recordCount: { $sum: 1 }
      }
    }
  ])

  return {
    byMaterial: summary,
    totals: totals[0] || { totalConsumptionCost: 0, totalScrapCost: 0, recordCount: 0 }
  }
}

// Static method to get scrap analysis
materialConsumptionSchema.statics.getScrapAnalysis = async function(companyId, startDate, endDate) {
  const match = {
    company: new mongoose.Types.ObjectId(companyId),
    quantityScrap: { $gt: 0 }
  }

  if (startDate || endDate) {
    match.consumptionDate = {}
    if (startDate) match.consumptionDate.$gte = new Date(startDate)
    if (endDate) match.consumptionDate.$lte = new Date(endDate)
  }

  const byReason = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$scrapReason',
        totalScrapQuantity: { $sum: '$quantityScrap' },
        totalScrapCost: { $sum: '$scrapCost' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalScrapCost: -1 } }
  ])

  const byMaterial = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$material',
        materialName: { $first: '$materialDetails.name' },
        totalScrapQuantity: { $sum: '$quantityScrap' },
        totalScrapCost: { $sum: '$scrapCost' },
        unit: { $first: '$unit' }
      }
    },
    { $sort: { totalScrapCost: -1 } },
    { $limit: 10 }
  ])

  return { byReason, byMaterial }
}

// Indexes
materialConsumptionSchema.index({ company: 1, workOrder: 1 })
materialConsumptionSchema.index({ company: 1, project: 1 })
materialConsumptionSchema.index({ company: 1, consumptionDate: -1 })
materialConsumptionSchema.index({ materialIssue: 1 })
materialConsumptionSchema.index({ material: 1 })

export default mongoose.model('MaterialConsumption', materialConsumptionSchema)
