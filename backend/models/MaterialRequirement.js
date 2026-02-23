import mongoose from 'mongoose'

/**
 * Material Requirement Planning (MRP)
 * FR-PPC-003: Automatic Material Requirement Planning from Work Orders
 */

const materialRequirementSchema = new mongoose.Schema({
  // System generated ID: MRP-YYYY-MM-XXXXX
  mrpId: {
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

  // BOM Item Reference
  bomItemId: String,

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
    unit: String,
    hsnCode: String
  },

  // Quantities
  quantities: {
    required: {
      type: Number,
      required: true,
      min: 0
    },
    stockOnHand: {
      type: Number,
      default: 0,
      min: 0
    },
    inTransit: {
      type: Number,
      default: 0,
      min: 0
    },
    reserved: {
      type: Number,
      default: 0,
      min: 0
    },
    available: {
      type: Number,
      default: 0,
      min: 0
    },
    shortfall: {
      type: Number,
      default: 0,
      min: 0
    },
    toPurchase: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      default: 'pcs'
    }
  },

  // Timing
  requiredByDate: {
    type: Date,
    required: true
  },

  leadTimeDays: {
    type: Number,
    default: 7
  },

  orderByDate: Date, // requiredByDate - leadTimeDays

  // Cost Estimates
  estimatedCost: {
    unitPrice: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    }
  },

  // Purchase Requisition Link
  purchaseRequisition: {
    generated: {
      type: Boolean,
      default: false
    },
    prId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseRequisition'
    },
    prNumber: String,
    generatedAt: Date
  },

  // Purchase Order Link
  purchaseOrder: {
    linked: {
      type: Boolean,
      default: false
    },
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder'
    },
    poNumber: String
  },

  // Vendor Information
  preferredVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },

  vendorName: String,

  // Status
  status: {
    type: String,
    enum: ['open', 'partially_filled', 'filled', 'cancelled'],
    default: 'open',
    index: true
  },

  fulfillmentStatus: {
    type: String,
    enum: ['pending', 'pr_generated', 'po_placed', 'in_transit', 'received', 'issued'],
    default: 'pending'
  },

  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  isCritical: {
    type: Boolean,
    default: false
  },

  // Notes
  notes: String,

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  lastCalculatedAt: Date
}, {
  timestamps: true
})

// Generate MRP ID
materialRequirementSchema.pre('save', async function(next) {
  if (!this.mrpId) {
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

    this.mrpId = `MRP-${year}-${month}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

// Calculate derived fields
materialRequirementSchema.pre('save', function(next) {
  // Calculate available quantity
  this.quantities.available = this.quantities.stockOnHand + this.quantities.inTransit - this.quantities.reserved

  // Calculate shortfall
  this.quantities.shortfall = Math.max(0, this.quantities.required - this.quantities.available)

  // Calculate to purchase (same as shortfall for now)
  this.quantities.toPurchase = this.quantities.shortfall

  // Calculate order by date
  if (this.requiredByDate && this.leadTimeDays) {
    const orderDate = new Date(this.requiredByDate)
    orderDate.setDate(orderDate.getDate() - this.leadTimeDays)
    this.orderByDate = orderDate
  }

  // Calculate total cost
  this.estimatedCost.totalCost = this.quantities.required * this.estimatedCost.unitPrice

  // Update status
  if (this.quantities.shortfall === 0) {
    this.status = 'filled'
  } else if (this.quantities.available > 0 && this.quantities.shortfall > 0) {
    this.status = 'partially_filled'
  }

  // Mark as critical if order by date is past or within 3 days
  const today = new Date()
  if (this.orderByDate && this.orderByDate <= new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)) {
    this.isCritical = true
    this.priority = 'critical'
  }

  next()
})

// Static method to run MRP for a work order
materialRequirementSchema.statics.runMRP = async function(workOrderId, bomItems, userId) {
  const WorkOrder = mongoose.model('WorkOrder')
  const Material = mongoose.model('Material')
  const Stock = mongoose.model('Stock')

  const workOrder = await WorkOrder.findById(workOrderId)
  if (!workOrder) throw new Error('Work order not found')

  const requirements = []

  for (const bomItem of bomItems) {
    // Get material details
    const material = await Material.findById(bomItem.materialId)
    if (!material) continue

    // Get current stock
    const stock = await Stock.findOne({
      company: workOrder.company,
      material: bomItem.materialId,
      isActive: true
    })

    const stockOnHand = stock?.quantity || 0

    // Create requirement record
    const requirement = await this.create({
      company: workOrder.company,
      workOrder: workOrderId,
      workOrderId: workOrder.workOrderId,
      project: workOrder.project,
      bomItemId: bomItem.bomItemId,
      material: bomItem.materialId,
      materialDetails: {
        skuCode: material.skuCode,
        name: material.materialName,
        description: material.description,
        category: material.category,
        unit: material.unit,
        hsnCode: material.hsnCode
      },
      quantities: {
        required: bomItem.quantity * workOrder.quantity.ordered,
        stockOnHand: stockOnHand,
        inTransit: 0, // TODO: Calculate from open POs
        reserved: 0,
        unit: material.unit
      },
      requiredByDate: workOrder.schedule.plannedStartDate,
      leadTimeDays: material.leadTime || 7,
      estimatedCost: {
        unitPrice: material.unitPrice || 0
      },
      preferredVendor: material.preferredVendors?.[0],
      createdBy: userId,
      lastCalculatedAt: new Date()
    })

    requirements.push(requirement)
  }

  // Update work order material requirements summary
  const totalItems = requirements.length
  const availableItems = requirements.filter(r => r.status === 'filled').length
  const shortageItems = requirements.filter(r => r.quantities.shortfall > 0).length

  await WorkOrder.findByIdAndUpdate(workOrderId, {
    materialRequirements: {
      totalItems,
      availableItems,
      shortageItems,
      allMaterialsAvailable: shortageItems === 0
    }
  })

  return requirements
}

// Indexes
materialRequirementSchema.index({ company: 1, workOrder: 1 })
materialRequirementSchema.index({ company: 1, project: 1 })
materialRequirementSchema.index({ company: 1, status: 1 })
materialRequirementSchema.index({ company: 1, requiredByDate: 1 })
materialRequirementSchema.index({ company: 1, isCritical: 1 })
materialRequirementSchema.index({ material: 1 })

export default mongoose.model('MaterialRequirement', materialRequirementSchema)
