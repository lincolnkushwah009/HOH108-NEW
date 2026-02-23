import mongoose from 'mongoose'

/**
 * Material Issue - Track material movement from warehouse to production
 * FR-PPC-004: Track Material Issue and Consumption in Production/Site
 */

const materialIssueSchema = new mongoose.Schema({
  // System generated ID: MI-YYYY-MM-XXXXX
  issueId: {
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

  // Issue Details
  issueDate: {
    type: Date,
    default: Date.now,
    required: true
  },

  quantityIssued: {
    type: Number,
    required: true,
    min: 0
  },

  unit: {
    type: String,
    default: 'pcs'
  },

  // Batch/Serial Tracking
  batch: {
    batchNumber: String,
    serialNumbers: [String],
    expiryDate: Date,
    manufacturingDate: Date
  },

  // Costing (FIFO/LIFO/Specific)
  costingMethod: {
    type: String,
    enum: ['fifo', 'lifo', 'specific', 'average'],
    default: 'fifo'
  },

  costPerUnit: {
    type: Number,
    required: true,
    min: 0
  },

  totalIssueCost: {
    type: Number,
    default: 0
  },

  // Source Warehouse
  sourceWarehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse'
  },

  warehouseName: String,
  warehouseLocation: String,

  // Issue Location (where material is being sent)
  issueToLocation: {
    type: {
      type: String,
      enum: ['factory', 'site', 'production_floor', 'assembly_area'],
      default: 'production_floor'
    },
    name: String,
    code: String,
    address: String
  },

  // Personnel
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  issuedByName: String,

  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  receivedByName: String,
  receivedAt: Date,

  // Consumption Tracking
  consumption: {
    quantityConsumed: {
      type: Number,
      default: 0,
      min: 0
    },
    quantityScrap: {
      type: Number,
      default: 0,
      min: 0
    },
    quantityReturned: {
      type: Number,
      default: 0,
      min: 0
    },
    quantityBalance: {
      type: Number,
      default: 0 // issued - consumed - scrap - returned
    },
    consumptionCost: {
      type: Number,
      default: 0
    },
    scrapCost: {
      type: Number,
      default: 0
    }
  },

  // Status
  status: {
    type: String,
    enum: ['issued', 'partially_consumed', 'fully_consumed', 'returned', 'adjusted'],
    default: 'issued',
    index: true
  },

  // Notes
  notes: String,
  issueSlipNumber: String,

  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Stock Movement Reference
  stockMovement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockMovement'
  },

  // MRP Reference
  materialRequirement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaterialRequirement'
  }
}, {
  timestamps: true
})

// Generate Issue ID
materialIssueSchema.pre('save', async function(next) {
  if (!this.issueId) {
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

    this.issueId = `MI-${year}-${month}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

// Calculate derived fields
materialIssueSchema.pre('save', function(next) {
  // Calculate total issue cost
  this.totalIssueCost = this.quantityIssued * this.costPerUnit

  // Calculate consumption balance
  this.consumption.quantityBalance = this.quantityIssued -
    this.consumption.quantityConsumed -
    this.consumption.quantityScrap -
    this.consumption.quantityReturned

  // Calculate consumption cost
  this.consumption.consumptionCost = this.consumption.quantityConsumed * this.costPerUnit
  this.consumption.scrapCost = this.consumption.quantityScrap * this.costPerUnit

  // Update status based on consumption
  if (this.consumption.quantityBalance === 0) {
    this.status = 'fully_consumed'
  } else if (this.consumption.quantityConsumed > 0 || this.consumption.quantityScrap > 0) {
    this.status = 'partially_consumed'
  }

  next()
})

// Method to record consumption
materialIssueSchema.methods.recordConsumption = async function(quantityConsumed, quantityScrap, scrapReason, userId, userName) {
  const MaterialConsumption = mongoose.model('MaterialConsumption')

  // Validate quantities
  const totalUsed = quantityConsumed + (quantityScrap || 0)
  if (totalUsed > this.consumption.quantityBalance) {
    throw new Error('Consumption quantity exceeds available balance')
  }

  // Create consumption record
  const consumption = await MaterialConsumption.create({
    company: this.company,
    materialIssue: this._id,
    materialIssueId: this.issueId,
    workOrder: this.workOrder,
    project: this.project,
    material: this.material,
    materialDetails: this.materialDetails,
    consumptionDate: new Date(),
    quantityConsumed,
    quantityScrap: quantityScrap || 0,
    scrapReason,
    unitCost: this.costPerUnit,
    consumptionCost: quantityConsumed * this.costPerUnit,
    scrapCost: (quantityScrap || 0) * this.costPerUnit,
    recordedBy: userId,
    recordedByName: userName
  })

  // Update this issue record
  this.consumption.quantityConsumed += quantityConsumed
  this.consumption.quantityScrap += (quantityScrap || 0)
  await this.save()

  return consumption
}

// Method to return material
materialIssueSchema.methods.returnMaterial = async function(quantityReturned, reason, userId, userName) {
  if (quantityReturned > this.consumption.quantityBalance) {
    throw new Error('Return quantity exceeds available balance')
  }

  this.consumption.quantityReturned += quantityReturned
  this.status = 'returned'

  // TODO: Create stock movement for return

  return this.save()
}

// Static method to issue material
materialIssueSchema.statics.issueMaterial = async function(data) {
  const Stock = mongoose.model('Stock')
  const StockMovement = mongoose.model('StockMovement')
  const Material = mongoose.model('Material')

  // Get material details
  const material = await Material.findById(data.materialId)
  if (!material) throw new Error('Material not found')

  // Check stock availability
  const stock = await Stock.findOne({
    company: data.company,
    material: data.materialId,
    warehouse: data.warehouseId,
    isActive: true
  })

  if (!stock || stock.quantity < data.quantity) {
    throw new Error(`Insufficient stock. Available: ${stock?.quantity || 0}`)
  }

  // Create material issue
  const issue = await this.create({
    company: data.company,
    workOrder: data.workOrderId,
    workOrderId: data.workOrderNumber,
    project: data.projectId,
    material: data.materialId,
    materialDetails: {
      skuCode: material.skuCode,
      name: material.materialName,
      description: material.description,
      category: material.category,
      unit: material.unit
    },
    issueDate: data.issueDate || new Date(),
    quantityIssued: data.quantity,
    unit: material.unit,
    batch: data.batch,
    costPerUnit: stock.averageCost || material.unitPrice,
    sourceWarehouse: data.warehouseId,
    warehouseName: data.warehouseName,
    issueToLocation: data.issueToLocation,
    issuedBy: data.issuedBy,
    issuedByName: data.issuedByName,
    notes: data.notes,
    materialRequirement: data.materialRequirementId
  })

  // Create stock movement (issue type)
  const movement = await StockMovement.create({
    company: data.company,
    material: data.materialId,
    warehouse: data.warehouseId,
    movementType: 'issue',
    movementDate: data.issueDate || new Date(),
    quantity: data.quantity,
    unitCost: stock.averageCost || material.unitPrice,
    totalCost: data.quantity * (stock.averageCost || material.unitPrice),
    reference: {
      type: 'work_order',
      id: data.workOrderId,
      number: data.workOrderNumber
    },
    balanceBefore: stock.quantity,
    balanceAfter: stock.quantity - data.quantity,
    performedBy: data.issuedBy,
    performedByName: data.issuedByName,
    notes: `Material issued for Work Order: ${data.workOrderNumber}`
  })

  // Update stock
  stock.quantity -= data.quantity
  await stock.save()

  // Update issue with movement reference
  issue.stockMovement = movement._id
  await issue.save()

  return issue
}

// Indexes
materialIssueSchema.index({ company: 1, workOrder: 1 })
materialIssueSchema.index({ company: 1, project: 1 })
materialIssueSchema.index({ company: 1, issueDate: -1 })
materialIssueSchema.index({ company: 1, status: 1 })
materialIssueSchema.index({ material: 1 })

export default mongoose.model('MaterialIssue', materialIssueSchema)
