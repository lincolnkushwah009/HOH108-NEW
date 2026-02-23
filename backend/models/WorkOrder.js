import mongoose from 'mongoose'

/**
 * Work Order - Primary production instruction document
 * FR-PPC-001: Create and Manage Work Orders from Approved Designs
 */

const workOrderActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'created', 'updated', 'initiated', 'planned', 'started',
      'progress_updated', 'material_issued', 'labor_assigned',
      'completed', 'quality_checked', 'on_hold', 'cancelled',
      'resumed', 'rescheduled'
    ],
    required: true
  },
  description: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedByName: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const workOrderSchema = new mongoose.Schema({
  // System generated ID: WO-YYYY-MM-XXXXX
  workOrderId: {
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
    required: true,
    index: true
  },

  projectName: String,

  // Design Iteration Reference (source of BOM)
  designIteration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DesignIteration'
  },

  // BOM Reference
  bomId: String,
  bomVersion: {
    type: Number,
    default: 1
  },

  // Item Details
  item: {
    itemId: String,
    name: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      enum: ['furniture', 'modular', 'civil', 'electrical', 'plumbing', 'painting', 'flooring', 'ceiling', 'other'],
      default: 'furniture'
    },
    specifications: mongoose.Schema.Types.Mixed
  },

  // Quantities
  quantity: {
    ordered: {
      type: Number,
      required: true,
      min: 0
    },
    completed: {
      type: Number,
      default: 0,
      min: 0
    },
    scrap: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      enum: ['pcs', 'nos', 'set', 'sqft', 'sqm', 'rft', 'mtr', 'kg', 'ltr'],
      default: 'pcs'
    }
  },

  // Production Type
  productionType: {
    type: String,
    enum: ['factory', 'site', 'hybrid'],
    default: 'factory'
  },

  productionLocation: {
    name: String,
    code: String,
    address: String
  },

  // Scheduling
  schedule: {
    plannedStartDate: Date,
    plannedEndDate: Date,
    actualStartDate: Date,
    actualEndDate: Date,
    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks'],
        default: 'days'
      }
    },
    setupTime: {
      type: Number,
      default: 0 // hours
    },
    bufferTime: {
      type: Number,
      default: 0 // hours
    }
  },

  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  prioritySequence: {
    type: Number,
    default: 999
  },

  isCriticalPath: {
    type: Boolean,
    default: false
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedToName: String,

  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  supervisorName: String,

  laborTeam: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    skillType: String,
    assignedAt: Date
  }],

  // Status & Workflow
  status: {
    type: String,
    enum: ['draft', 'initiated', 'planned', 'in_progress', 'completed', 'on_hold', 'cancelled'],
    default: 'draft',
    index: true
  },

  qualityStatus: {
    type: String,
    enum: ['pending_qc', 'approved', 'rejected', 'rework'],
    default: 'pending_qc'
  },

  // Progress Tracking
  progress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastUpdatedAt: Date,
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Material Requirements Summary
  materialRequirements: {
    totalItems: {
      type: Number,
      default: 0
    },
    availableItems: {
      type: Number,
      default: 0
    },
    shortageItems: {
      type: Number,
      default: 0
    },
    allMaterialsAvailable: {
      type: Boolean,
      default: false
    }
  },

  // Cost Tracking
  estimatedCost: {
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
    }
  },

  actualCost: {
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
    }
  },

  costVariance: {
    type: Number,
    default: 0 // actual - estimated
  },

  // Quality Control
  qualityCheck: {
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checkedByName: String,
    checkedAt: Date,
    result: {
      type: String,
      enum: ['pass', 'fail', 'partial']
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    remarks: String,
    defects: [{
      description: String,
      severity: {
        type: String,
        enum: ['minor', 'major', 'critical']
      },
      status: {
        type: String,
        enum: ['open', 'resolved'],
        default: 'open'
      }
    }]
  },

  // Notes & Remarks
  notes: String,
  specialInstructions: String,

  // Attachments
  attachments: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['drawing', 'specification', 'photo', 'report', 'other']
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

  // Activity Log
  activities: [workOrderActivitySchema],

  // Approvals
  approvals: {
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    initiatedAt: Date,
    plannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    plannedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date
  },

  // Hold/Cancel Reason
  holdReason: String,
  cancelReason: String,

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

// Generate Work Order ID
workOrderSchema.pre('save', async function(next) {
  if (!this.workOrderId) {
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

    this.workOrderId = `WO-${year}-${month}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

// Calculate cost variance
workOrderSchema.pre('save', function(next) {
  this.costVariance = this.actualCost.total - this.estimatedCost.total
  next()
})

// Method to update progress
workOrderSchema.methods.updateProgress = function(percentage, userId, userName) {
  const oldProgress = this.progress.percentage
  this.progress.percentage = percentage
  this.progress.lastUpdatedAt = new Date()
  this.progress.lastUpdatedBy = userId

  // Auto-update status based on progress
  if (percentage === 100 && this.status === 'in_progress') {
    this.status = 'completed'
    this.schedule.actualEndDate = new Date()
  }

  this.activities.push({
    action: 'progress_updated',
    description: `Progress updated from ${oldProgress}% to ${percentage}%`,
    performedBy: userId,
    performedByName: userName,
    oldValue: oldProgress,
    newValue: percentage
  })

  return this.save()
}

// Method to start production
workOrderSchema.methods.startProduction = function(userId, userName) {
  if (this.status !== 'planned') {
    throw new Error('Work order must be in "planned" status to start')
  }

  this.status = 'in_progress'
  this.schedule.actualStartDate = new Date()

  this.activities.push({
    action: 'started',
    description: 'Production started',
    performedBy: userId,
    performedByName: userName
  })

  return this.save()
}

// Method to complete work order
workOrderSchema.methods.complete = function(quantityCompleted, scrapQuantity, userId, userName) {
  this.status = 'completed'
  this.quantity.completed = quantityCompleted
  this.quantity.scrap = scrapQuantity || 0
  this.schedule.actualEndDate = new Date()
  this.progress.percentage = 100

  this.approvals.completedBy = userId
  this.approvals.completedAt = new Date()

  this.activities.push({
    action: 'completed',
    description: `Work order completed. Qty: ${quantityCompleted}, Scrap: ${scrapQuantity || 0}`,
    performedBy: userId,
    performedByName: userName,
    metadata: { quantityCompleted, scrapQuantity }
  })

  return this.save()
}

// Indexes
workOrderSchema.index({ company: 1, status: 1 })
workOrderSchema.index({ company: 1, project: 1 })
workOrderSchema.index({ company: 1, 'schedule.plannedStartDate': 1 })
workOrderSchema.index({ company: 1, assignedTo: 1 })
workOrderSchema.index({ company: 1, createdAt: -1 })

export default mongoose.model('WorkOrder', workOrderSchema)
