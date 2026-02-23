import mongoose from 'mongoose'

/**
 * Bill of Materials (BOM) - Product structure and material requirements
 * Links designs to materials for production planning
 */

const bomItemSchema = new mongoose.Schema({
  itemNumber: {
    type: Number,
    required: true
  },

  // Material Reference
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

  // Quantity & Costing
  quantity: {
    type: Number,
    required: true,
    min: 0
  },

  unit: {
    type: String,
    default: 'pcs'
  },

  wastagePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  grossQuantity: {
    type: Number,
    default: 0 // quantity + (quantity * wastagePercentage / 100)
  },

  unitCost: {
    type: Number,
    default: 0
  },

  totalCost: {
    type: Number,
    default: 0
  },

  // Item Classification
  itemType: {
    type: String,
    enum: ['raw_material', 'component', 'hardware', 'finish', 'consumable'],
    default: 'raw_material'
  },

  isCritical: {
    type: Boolean,
    default: false
  },

  // Vendor Info
  preferredVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },

  vendorName: String,
  leadTimeDays: Number,

  // Notes
  specifications: String,
  notes: String,

  // Assembly Information
  assemblySequence: Number,
  parentItem: Number, // For hierarchical BOM

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
})

const billOfMaterialsSchema = new mongoose.Schema({
  // System generated ID: BOM-YYYY-XXXXX
  bomId: {
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

  // Project Reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },

  projectName: String,

  // Design Iteration Reference
  designIteration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DesignIteration'
  },

  // BOM Header Info
  name: {
    type: String,
    required: true
  },

  description: String,

  // Product/Assembly Info
  product: {
    name: String,
    code: String,
    category: {
      type: String,
      enum: ['furniture', 'modular_kitchen', 'wardrobe', 'tv_unit', 'bed', 'sofa', 'dining', 'office', 'other'],
      default: 'furniture'
    },
    specifications: mongoose.Schema.Types.Mixed
  },

  // Version Control
  version: {
    type: Number,
    default: 1
  },

  revision: {
    type: String,
    default: 'A'
  },

  effectiveDate: Date,
  expiryDate: Date,

  // BOM Type
  bomType: {
    type: String,
    enum: ['standard', 'custom', 'template', 'prototype'],
    default: 'standard'
  },

  // Quantity Info
  baseQuantity: {
    type: Number,
    default: 1
  },

  unit: {
    type: String,
    default: 'pcs'
  },

  // Items
  items: [bomItemSchema],

  // Cost Summary
  costSummary: {
    materialCost: {
      type: Number,
      default: 0
    },
    laborCost: {
      type: Number,
      default: 0
    },
    overheadCost: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    costPerUnit: {
      type: Number,
      default: 0
    }
  },

  // Labor Estimates
  laborEstimates: {
    totalHours: {
      type: Number,
      default: 0
    },
    breakdown: [{
      skillType: String,
      hours: Number,
      rate: Number,
      cost: Number
    }]
  },

  // Status & Workflow
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'active', 'obsolete'],
    default: 'draft',
    index: true
  },

  // Approval
  approval: {
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedByName: String,
    approvedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: Date,
    rejectionReason: String
  },

  // Usage Tracking
  usage: {
    workOrdersCreated: {
      type: Number,
      default: 0
    },
    lastUsedAt: Date
  },

  // Change History
  changeHistory: [{
    version: Number,
    revision: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedByName: String,
    changedAt: Date,
    changeDescription: String,
    itemsChanged: [{
      action: {
        type: String,
        enum: ['added', 'modified', 'removed']
      },
      itemNumber: Number,
      materialName: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }]
  }],

  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['drawing', 'specification', 'image', 'document', 'other']
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Notes
  notes: String,
  internalNotes: String,

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Generate BOM ID
billOfMaterialsSchema.pre('save', async function(next) {
  if (!this.bomId) {
    const now = new Date()
    const year = now.getFullYear()

    const count = await this.constructor.countDocuments({
      company: this.company,
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    })

    this.bomId = `BOM-${year}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

// Calculate item costs and summary
billOfMaterialsSchema.pre('save', function(next) {
  let totalMaterialCost = 0

  // Calculate each item's costs
  this.items.forEach(item => {
    // Calculate gross quantity with wastage
    item.grossQuantity = item.quantity * (1 + (item.wastagePercentage || 0) / 100)

    // Calculate total cost
    item.totalCost = item.grossQuantity * (item.unitCost || 0)

    totalMaterialCost += item.totalCost
  })

  // Update cost summary
  this.costSummary.materialCost = totalMaterialCost

  // Calculate labor cost from estimates
  if (this.laborEstimates.breakdown && this.laborEstimates.breakdown.length > 0) {
    this.laborEstimates.totalHours = this.laborEstimates.breakdown.reduce((sum, b) => sum + (b.hours || 0), 0)
    this.costSummary.laborCost = this.laborEstimates.breakdown.reduce((sum, b) => sum + (b.cost || 0), 0)
  }

  // Calculate total and per unit cost
  this.costSummary.totalCost = this.costSummary.materialCost +
    this.costSummary.laborCost +
    this.costSummary.overheadCost

  if (this.baseQuantity > 0) {
    this.costSummary.costPerUnit = this.costSummary.totalCost / this.baseQuantity
  }

  next()
})

// Method to create a new version
billOfMaterialsSchema.methods.createNewVersion = async function(userId, userName, changeDescription) {
  // Save current state to change history
  this.changeHistory.push({
    version: this.version,
    revision: this.revision,
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date(),
    changeDescription
  })

  // Increment version
  this.version += 1
  this.lastModifiedBy = userId

  return this.save()
}

// Method to approve BOM
billOfMaterialsSchema.methods.approve = function(userId, userName) {
  if (this.status !== 'pending_approval') {
    throw new Error('BOM must be pending approval')
  }

  this.status = 'approved'
  this.approval.approvedBy = userId
  this.approval.approvedByName = userName
  this.approval.approvedAt = new Date()

  return this.save()
}

// Static method to get BOM for work order creation
billOfMaterialsSchema.statics.getForProduction = async function(bomId) {
  const bom = await this.findById(bomId)
    .populate('items.material', 'skuCode materialName unit unitPrice leadTime preferredVendors')
    .populate('items.preferredVendor', 'name vendorId')

  if (!bom) throw new Error('BOM not found')
  if (bom.status !== 'approved' && bom.status !== 'active') {
    throw new Error('BOM must be approved before use in production')
  }

  return bom
}

// Static method to copy BOM
billOfMaterialsSchema.statics.copyBOM = async function(sourceBomId, newProject, userId) {
  const sourceBom = await this.findById(sourceBomId)
  if (!sourceBom) throw new Error('Source BOM not found')

  const newBom = new this({
    company: sourceBom.company,
    project: newProject,
    name: `${sourceBom.name} (Copy)`,
    description: sourceBom.description,
    product: sourceBom.product,
    bomType: 'custom',
    baseQuantity: sourceBom.baseQuantity,
    unit: sourceBom.unit,
    items: sourceBom.items.map(item => ({
      ...item.toObject(),
      _id: undefined
    })),
    laborEstimates: sourceBom.laborEstimates,
    status: 'draft',
    createdBy: userId
  })

  return newBom.save()
}

// Indexes
billOfMaterialsSchema.index({ company: 1, project: 1 })
billOfMaterialsSchema.index({ company: 1, status: 1 })
billOfMaterialsSchema.index({ company: 1, 'product.category': 1 })
billOfMaterialsSchema.index({ designIteration: 1 })

export default mongoose.model('BillOfMaterials', billOfMaterialsSchema)
