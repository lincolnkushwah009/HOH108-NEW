import mongoose from 'mongoose'
import { generateProjectId as generateProjectIdFromQualifiedLead } from '../utils/qualifiedLeadIdGenerator.js'

/**
 * ===========================================
 * SOX Control: PM-008 Project Budget & Milestone Controls
 * ===========================================
 */

// Milestone sub-schema for project timeline (enhanced with gate controls)
const milestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  dueDate: Date,
  completedDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'delayed', 'blocked'],
    default: 'pending'
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  order: {
    type: Number,
    default: 0
  },

  // PM-008: Milestone Dependencies & Gates
  dependencies: [{
    milestone: { type: mongoose.Schema.Types.ObjectId },
    type: {
      type: String,
      enum: ['finish_to_start', 'start_to_start', 'finish_to_finish'],
      default: 'finish_to_start'
    }
  }],

  // Gate control - milestone cannot complete without approval
  isGate: { type: Boolean, default: false },
  gateApproval: {
    required: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    approvalNotes: String
  },

  // Budget allocation for milestone
  budget: {
    estimated: { type: Number, default: 0 },
    actual: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
    variancePercent: { type: Number, default: 0 }
  },

  // Deliverables checklist
  deliverables: [{
    item: String,
    isCompleted: { type: Boolean, default: false },
    completedAt: Date,
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Risk indicator
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  riskNotes: String
})

// Change Order sub-schema for scope changes
const changeOrderSchema = new mongoose.Schema({
  changeOrderNumber: String,
  title: { type: String, required: true },
  description: String,
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestedByName: String,
  requestedAt: { type: Date, default: Date.now },

  // Impact assessment
  impact: {
    budgetImpact: { type: Number, default: 0 },
    scheduleImpact: { type: Number, default: 0 }, // days
    scopeDescription: String
  },

  // Approval workflow
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'rejected', 'implemented'],
    default: 'draft'
  },
  approvalWorkflow: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalWorkflow' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectionReason: String,

  // Implementation tracking
  implementedAt: Date,
  implementedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  implementationNotes: String
})

// Budget Line Item sub-schema
const budgetLineItemSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['labor', 'material', 'equipment', 'subcontractor', 'overhead', 'contingency', 'other'],
    required: true
  },
  description: String,
  milestone: { type: mongoose.Schema.Types.ObjectId }, // Link to milestone
  estimatedAmount: { type: Number, default: 0 },
  actualAmount: { type: Number, default: 0 },
  committedAmount: { type: Number, default: 0 }, // POs issued but not yet spent
  variance: { type: Number, default: 0 },
  variancePercent: { type: Number, default: 0 },
  notes: String,
  lastUpdated: Date,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})

// Payment sub-schema for financial tracking
const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'],
    default: 'bank_transfer'
  },
  reference: String, // Transaction ID, cheque number, etc.
  description: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recordedByName: String,
  receipt: {
    url: String,
    uploadedAt: Date
  }
})

// Activity sub-schema for project timeline
const projectActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'created',
      'stage_changed',
      'assigned',
      'milestone_added',
      'milestone_completed',
      'payment_received',
      'note_added',
      'document_uploaded',
      'team_updated',
      'specification_changed',
      'status_changed',
      'field_updated'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedByName: {
    type: String,
    default: 'System'
  },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  fieldChanged: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const projectSchema = new mongoose.Schema({
  // Auto-generated Project ID (e.g., IP-P-2024-00001 or HYD-HG-IP-00001-HIP)
  projectId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Qualified Lead ID Reference (e.g., HYD-HG-IP-00001)
  // This is inherited from the qualified lead
  qualifiedLeadId: {
    type: String,
    index: true
  },

  // Execution/Production Type - determines project ID suffix
  // 'factory' or 'inhouse' = HIP (Factory for Interiors - in-house production)
  // 'vendor' or 'outsourced' = GIK (Outsourced to Vendors)
  executionType: {
    type: String,
    enum: ['factory', 'inhouse', 'vendor', 'outsourced'],
    default: 'factory'
  },

  // Company Association (Required for multi-company CRM)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required'],
    index: true
  },

  // Customer Linkage
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required'],
    index: true
  },

  // Original Lead (for tracking conversion source)
  originalLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },

  // ============================================
  // CRM WORKFLOW REFERENCES
  // ============================================

  // Sales Order Reference
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },

  // Master Agreement Reference
  masterAgreement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterAgreement'
  },

  // Design Iterations
  designIterations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DesignIteration'
  }],
  currentDesignVersion: {
    type: Number,
    default: 0
  },

  // ============================================
  // DEPARTMENT ASSIGNMENTS (Persistent across workflow)
  // ============================================
  departmentAssignments: {
    // Design Team
    design: {
      lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      leadName: String,
      team: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        name: String,
        role: {
          type: String,
          enum: ['lead_designer', 'designer', '3d_artist', 'drafter', 'coordinator']
        },
        assignedAt: Date,
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }],
      assignedAt: Date
    },
    // Operations Team
    operations: {
      lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      leadName: String,
      team: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        name: String,
        role: {
          type: String,
          enum: ['operations_manager', 'site_engineer', 'supervisor', 'coordinator', 'qc_engineer']
        },
        assignedAt: Date,
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }],
      assignedAt: Date
    }
  },

  // ============================================
  // HANDOVER TRACKING
  // ============================================
  handovers: [{
    from: {
      department: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String
    },
    to: {
      department: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: String
    },
    handoverDate: {
      type: Date,
      default: Date.now
    },
    notes: String,
    documents: [{
      name: String,
      url: String
    }],
    checklist: [{
      item: String,
      isCompleted: {
        type: Boolean,
        default: false
      },
      completedAt: Date
    }]
  }],

  // ============================================
  // APPROVAL STATUS
  // ============================================
  approvalStatus: {
    materialQuotation: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    materialSpend: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    paymentSchedule: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    scheduleOfWork: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    allApproved: {
      type: Boolean,
      default: false
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // ============================================
  // END CRM WORKFLOW FIELDS
  // ============================================

  // Basic Project Info
  title: {
    type: String,
    required: [true, 'Please add a project title'],
    trim: true
  },

  slug: {
    type: String,
    unique: true,
    sparse: true
  },

  description: {
    type: String
  },

  shortDescription: {
    type: String,
    maxlength: 200
  },

  // Project Classification
  category: {
    type: String,
    enum: ['interior', 'construction', 'renovation', 'education', 'ods', 'other'],
    required: true
  },

  subCategory: {
    type: String,
    enum: ['residential', 'commercial', 'hospitality', 'institutional', 'retail', 'office', 'other'],
    default: 'residential'
  },

  serviceType: {
    type: String // Specific service being provided
  },

  // Project Stage (uses company's custom stages)
  stage: {
    type: String,
    default: 'initiation'
  },

  // Overall Project Status
  status: {
    type: String,
    enum: ['active', 'on_hold', 'completed', 'cancelled', 'draft'],
    default: 'active'
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  // Location Details
  location: {
    type: {
      type: String,
      enum: ['site', 'client_provided'],
      default: 'site'
    },
    address: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // Project Specifications
  specifications: {
    area: {
      value: Number,
      unit: {
        type: String,
        enum: ['sqft', 'sqm'],
        default: 'sqft'
      },
      // Legacy support
      legacy: String
    },
    floors: Number,
    rooms: Number,
    bathrooms: Number,
    propertyType: {
      type: String,
      enum: ['apartment', 'villa', 'independent_house', 'commercial', 'office', 'retail', 'plot', 'other']
    },
    style: String, // Design style: Modern, Contemporary, Traditional, etc.
    specialRequirements: [String]
  },

  // Timeline
  timeline: {
    estimatedStartDate: Date,
    actualStartDate: Date,
    estimatedEndDate: Date,
    actualEndDate: Date,
    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'weeks'
      }
    },
    // Legacy support
    legacy: String
  },

  milestones: [milestoneSchema],

  // Financial Tracking
  financials: {
    currency: {
      type: String,
      default: 'INR'
    },
    quotedAmount: {
      type: Number,
      default: 0
    },
    agreedAmount: {
      type: Number,
      default: 0
    },
    additionalCharges: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      default: 0
    },
    totalPaid: {
      type: Number,
      default: 0
    },
    pendingAmount: {
      type: Number,
      default: 0
    },
    // Legacy support
    legacy: String
  },

  payments: [paymentSchema],

  paymentSchedule: [{
    name: String, // "Advance", "50% Completion", "Final Payment"
    percentage: Number,
    amount: Number,
    dueDate: Date,
    isPaid: {
      type: Boolean,
      default: false
    },
    paidDate: Date,
    paymentRef: {
      type: mongoose.Schema.Types.ObjectId // Reference to payments array
    }
  }],

  // ===========================================
  // PM-008: PROJECT BUDGET CONTROLS
  // ===========================================

  // Detailed Budget Tracking
  budget: {
    // Budget amounts
    originalBudget: { type: Number, default: 0 },
    revisedBudget: { type: Number, default: 0 },
    currentBudget: { type: Number, default: 0 }, // After change orders

    // Actual costs
    actualCost: { type: Number, default: 0 },
    committedCost: { type: Number, default: 0 }, // POs issued, not yet invoiced
    forecastAtCompletion: { type: Number, default: 0 },

    // Variance tracking
    variance: { type: Number, default: 0 }, // Budget - Actual
    variancePercent: { type: Number, default: 0 },
    costPerformanceIndex: { type: Number, default: 1 }, // CPI = EV/AC

    // Thresholds (for alerts)
    varianceThresholdPercent: { type: Number, default: 10 },
    requiresApprovalAt: { type: Number, default: 15 }, // % overrun requiring approval

    // Budget status
    status: {
      type: String,
      enum: ['on_track', 'at_risk', 'over_budget', 'under_budget', 'pending_approval'],
      default: 'on_track'
    },

    // Approval for budget overrun
    overrunApproval: {
      isRequired: { type: Boolean, default: false },
      requestedAt: Date,
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvalWorkflow: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalWorkflow' },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      approvedAmount: Number,
      reason: String
    },

    // Contingency
    contingencyAmount: { type: Number, default: 0 },
    contingencyUsed: { type: Number, default: 0 },
    contingencyRemaining: { type: Number, default: 0 },

    lastUpdated: Date,
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // Budget line items by category
  budgetLineItems: [budgetLineItemSchema],

  // Change Orders
  changeOrders: [changeOrderSchema],

  // Change Order Summary
  changeOrderSummary: {
    totalCount: { type: Number, default: 0 },
    approvedCount: { type: Number, default: 0 },
    pendingCount: { type: Number, default: 0 },
    totalBudgetImpact: { type: Number, default: 0 },
    totalScheduleImpact: { type: Number, default: 0 } // days
  },

  // ===========================================
  // PM-008: PROJECT AUDIT TRAIL
  // ===========================================
  budgetAuditTrail: [{
    action: {
      type: String,
      enum: ['budget_created', 'budget_revised', 'cost_updated', 'variance_alert',
             'change_order_submitted', 'change_order_approved', 'change_order_rejected',
             'overrun_approval_requested', 'overrun_approved', 'milestone_budget_updated']
    },
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    changedAt: { type: Date, default: Date.now },
    reason: String,
    ipAddress: String
  }],

  // Team Assignment
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['lead', 'designer', 'site_engineer', 'supervisor', 'coordinator', 'vendor_manager', 'viewer'],
      default: 'coordinator'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Vendors/Contractors
  vendors: [{
    name: String,
    type: {
      type: String,
      enum: ['contractor', 'supplier', 'consultant', 'labor', 'other']
    },
    phone: String,
    email: String,
    service: String,
    quotedAmount: Number,
    agreedAmount: Number,
    status: {
      type: String,
      enum: ['active', 'completed', 'pending', 'cancelled'],
      default: 'pending'
    }
  }],

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['contract', 'proposal', 'design', 'floor_plan', 'quotation', '3d_render', 'invoice', 'receipt', 'approval', 'handover', 'other']
    },
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedByName: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    }
  }],

  // Images (for portfolio)
  images: [{
    url: String,
    caption: String,
    type: {
      type: String,
      enum: ['before', 'during', 'after', 'design', 'render'],
      default: 'after'
    },
    isMain: {
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Notes
  notes: [{
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['general', 'client_feedback', 'issue', 'resolution', 'internal'],
      default: 'general'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedByName: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  }],

  // Activity Timeline
  activities: [projectActivitySchema],

  // Portfolio/Marketing
  portfolio: {
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedAt: Date,
    features: [String],
    tags: [String],
    isFeatured: {
      type: Boolean,
      default: false
    },
    views: {
      type: Number,
      default: 0
    },
    clientTestimonial: {
      content: String,
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      approvedForPublic: {
        type: Boolean,
        default: false
      }
    }
  },

  // Completion & Handover
  completion: {
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100
    },
    snagList: [{
      description: String,
      status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved'],
        default: 'open'
      },
      reportedAt: Date,
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    handoverDate: Date,
    warrantyEndDate: Date,
    handoverNotes: String,
    customerSignoff: {
      signed: {
        type: Boolean,
        default: false
      },
      signedAt: Date,
      signatureUrl: String
    }
  },

  // Tracking
  lastActivityAt: {
    type: Date,
    default: Date.now
  },

  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Source Website
  websiteSource: {
    type: String,
    default: 'HOH108'
  }
}, {
  timestamps: true
})

// Create slug from title
projectSchema.pre('save', function(next) {
  if (this.isModified('title') && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }
  next()
})

// Calculate financial amounts
projectSchema.pre('save', function(next) {
  if (this.financials) {
    // Calculate final amount
    const base = this.financials.agreedAmount || this.financials.quotedAmount || 0
    const additional = this.financials.additionalCharges || 0
    const discount = this.financials.discount || 0
    this.financials.finalAmount = base + additional - discount

    // Calculate pending amount
    this.financials.pendingAmount = this.financials.finalAmount - (this.financials.totalPaid || 0)
  }
  next()
})

// Method to add payment
projectSchema.methods.addPayment = async function(payment, userId, userName) {
  this.payments.push({
    ...payment,
    recordedBy: userId,
    recordedByName: userName
  })

  // Update total paid
  this.financials.totalPaid = this.payments.reduce((sum, p) => sum + p.amount, 0)
  this.financials.pendingAmount = this.financials.finalAmount - this.financials.totalPaid

  // Add activity
  this.activities.push({
    action: 'payment_received',
    description: `Payment of ${payment.amount} received`,
    performedBy: userId,
    performedByName: userName,
    newValue: payment.amount,
    metadata: { paymentMethod: payment.method }
  })

  this.lastActivityAt = new Date()

  // Update customer metrics
  const Customer = mongoose.model('Customer')
  const customer = await Customer.findById(this.customer)
  if (customer) {
    await customer.updateMetrics()
  }

  return this.save()
}

// Method to update stage
projectSchema.methods.updateStage = function(newStage, userId, userName) {
  const oldStage = this.stage
  this.stage = newStage

  this.activities.push({
    action: 'stage_changed',
    description: `Project stage changed from ${oldStage} to ${newStage}`,
    performedBy: userId,
    performedByName: userName,
    oldValue: oldStage,
    newValue: newStage
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method to add activity
projectSchema.methods.addActivity = function(activity) {
  this.activities.push(activity)
  this.lastActivityAt = new Date()
  return this.save()
}

// Method to complete milestone
projectSchema.methods.completeMilestone = function(milestoneId, userId, userName) {
  const milestone = this.milestones.id(milestoneId)
  if (!milestone) throw new Error('Milestone not found')

  milestone.status = 'completed'
  milestone.completedDate = new Date()
  milestone.completionPercentage = 100

  // Recalculate overall completion
  const completedMilestones = this.milestones.filter(m => m.status === 'completed').length
  this.completion.completionPercentage = Math.round((completedMilestones / this.milestones.length) * 100)

  this.activities.push({
    action: 'milestone_completed',
    description: `Milestone "${milestone.name}" marked as completed`,
    performedBy: userId,
    performedByName: userName,
    metadata: { milestoneId, milestoneName: milestone.name }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method to get project timeline
projectSchema.methods.getTimeline = function() {
  return this.activities.sort((a, b) => b.createdAt - a.createdAt)
}

// Static method to get projects by customer
projectSchema.statics.getByCustomer = function(customerId) {
  return this.find({ customer: customerId }).sort({ createdAt: -1 })
}

// ===========================================
// PM-008: Budget Management Methods
// ===========================================

// Method to initialize budget
projectSchema.methods.initializeBudget = function(budgetData, userId, userName) {
  this.budget = {
    originalBudget: budgetData.originalBudget || 0,
    revisedBudget: budgetData.originalBudget || 0,
    currentBudget: budgetData.originalBudget || 0,
    contingencyAmount: budgetData.contingencyAmount || 0,
    contingencyRemaining: budgetData.contingencyAmount || 0,
    varianceThresholdPercent: budgetData.varianceThresholdPercent || 10,
    requiresApprovalAt: budgetData.requiresApprovalAt || 15,
    lastUpdated: new Date(),
    lastUpdatedBy: userId
  }

  this.budgetAuditTrail.push({
    action: 'budget_created',
    newValue: this.budget.originalBudget,
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date()
  })

  return this
}

// Method to update actual costs
projectSchema.methods.updateActualCost = function(amount, category, description, userId, userName) {
  const oldActual = this.budget.actualCost || 0
  this.budget.actualCost = oldActual + amount

  // Update budget line item if category specified
  if (category) {
    let lineItem = this.budgetLineItems.find(li => li.category === category)
    if (!lineItem) {
      this.budgetLineItems.push({
        category,
        description: description || category,
        actualAmount: amount,
        lastUpdated: new Date(),
        updatedBy: userId
      })
    } else {
      lineItem.actualAmount = (lineItem.actualAmount || 0) + amount
      lineItem.variance = lineItem.estimatedAmount - lineItem.actualAmount
      lineItem.variancePercent = lineItem.estimatedAmount > 0 ?
        Math.round((lineItem.variance / lineItem.estimatedAmount) * 100) : 0
      lineItem.lastUpdated = new Date()
      lineItem.updatedBy = userId
    }
  }

  // Recalculate variance
  this.calculateBudgetVariance()

  this.budgetAuditTrail.push({
    action: 'cost_updated',
    field: 'actualCost',
    oldValue: oldActual,
    newValue: this.budget.actualCost,
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date(),
    reason: `${category}: ${description}`
  })

  return this
}

// Method to calculate budget variance and status
projectSchema.methods.calculateBudgetVariance = function() {
  const budget = this.budget
  if (!budget.currentBudget) return this

  budget.variance = budget.currentBudget - budget.actualCost
  budget.variancePercent = budget.currentBudget > 0 ?
    Math.round((budget.variance / budget.currentBudget) * 100 * -1) : 0

  // Calculate CPI (Cost Performance Index)
  if (budget.actualCost > 0 && this.completion.completionPercentage > 0) {
    const earnedValue = budget.currentBudget * (this.completion.completionPercentage / 100)
    budget.costPerformanceIndex = Math.round((earnedValue / budget.actualCost) * 100) / 100
  }

  // Forecast at completion
  if (budget.costPerformanceIndex > 0) {
    budget.forecastAtCompletion = Math.round(budget.currentBudget / budget.costPerformanceIndex)
  }

  // Update contingency remaining
  budget.contingencyRemaining = budget.contingencyAmount - budget.contingencyUsed

  // Determine status
  const overrunPercent = budget.variancePercent
  if (overrunPercent <= 0) {
    budget.status = 'under_budget'
  } else if (overrunPercent < budget.varianceThresholdPercent) {
    budget.status = 'on_track'
  } else if (overrunPercent < budget.requiresApprovalAt) {
    budget.status = 'at_risk'
  } else if (!budget.overrunApproval?.approvedAt) {
    budget.status = 'pending_approval'
    budget.overrunApproval = budget.overrunApproval || {}
    budget.overrunApproval.isRequired = true
  } else {
    budget.status = 'over_budget'
  }

  budget.lastUpdated = new Date()
  return this
}

// Method to add change order
projectSchema.methods.addChangeOrder = function(changeOrderData, userId, userName) {
  const count = (this.changeOrders?.length || 0) + 1
  const date = new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')

  const changeOrder = {
    changeOrderNumber: `CO-${this.projectId || 'P'}-${yy}${mm}-${String(count).padStart(3, '0')}`,
    ...changeOrderData,
    requestedBy: userId,
    requestedByName: userName,
    requestedAt: new Date(),
    status: 'draft'
  }

  this.changeOrders.push(changeOrder)
  this.updateChangeOrderSummary()

  this.budgetAuditTrail.push({
    action: 'change_order_submitted',
    newValue: changeOrder,
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date()
  })

  return changeOrder
}

// Method to approve change order
projectSchema.methods.approveChangeOrder = function(changeOrderId, userId, userName) {
  const co = this.changeOrders.id(changeOrderId)
  if (!co) throw new Error('Change order not found')

  co.status = 'approved'
  co.approvedBy = userId
  co.approvedAt = new Date()

  // Apply budget impact
  if (co.impact.budgetImpact) {
    this.budget.currentBudget = (this.budget.currentBudget || this.budget.originalBudget) + co.impact.budgetImpact
  }

  this.updateChangeOrderSummary()
  this.calculateBudgetVariance()

  this.budgetAuditTrail.push({
    action: 'change_order_approved',
    field: 'changeOrders',
    oldValue: co.status,
    newValue: 'approved',
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date(),
    reason: `CO ${co.changeOrderNumber}: Budget impact ${co.impact.budgetImpact}`
  })

  return this
}

// Method to update change order summary
projectSchema.methods.updateChangeOrderSummary = function() {
  const cos = this.changeOrders || []
  this.changeOrderSummary = {
    totalCount: cos.length,
    approvedCount: cos.filter(c => c.status === 'approved').length,
    pendingCount: cos.filter(c => c.status === 'pending_approval').length,
    totalBudgetImpact: cos.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.impact?.budgetImpact || 0), 0),
    totalScheduleImpact: cos.filter(c => c.status === 'approved').reduce((sum, c) => sum + (c.impact?.scheduleImpact || 0), 0)
  }
  return this
}

// Method to check milestone dependencies
projectSchema.methods.canStartMilestone = function(milestoneId) {
  const milestone = this.milestones.id(milestoneId)
  if (!milestone) return { canStart: false, reason: 'Milestone not found' }

  if (!milestone.dependencies || milestone.dependencies.length === 0) {
    return { canStart: true }
  }

  const blockers = []
  milestone.dependencies.forEach(dep => {
    const depMilestone = this.milestones.id(dep.milestone)
    if (depMilestone) {
      if (dep.type === 'finish_to_start' && depMilestone.status !== 'completed') {
        blockers.push(`${depMilestone.name} must be completed first`)
      } else if (dep.type === 'start_to_start' && depMilestone.status === 'pending') {
        blockers.push(`${depMilestone.name} must be started first`)
      }
    }
  })

  if (blockers.length > 0) {
    return { canStart: false, reason: blockers.join('; ') }
  }

  return { canStart: true }
}

// Method to complete gate milestone with approval
projectSchema.methods.completeGateMilestone = function(milestoneId, userId, userName, approvalNotes) {
  const milestone = this.milestones.id(milestoneId)
  if (!milestone) throw new Error('Milestone not found')

  if (milestone.isGate && milestone.gateApproval?.required) {
    milestone.gateApproval.approvedBy = userId
    milestone.gateApproval.approvedAt = new Date()
    milestone.gateApproval.approvalNotes = approvalNotes
  }

  return this.completeMilestone(milestoneId, userId, userName)
}

// Method to add budget audit entry
projectSchema.methods.addBudgetAuditEntry = function(action, field, oldValue, newValue, userId, userName, reason) {
  this.budgetAuditTrail.push({
    action,
    field,
    oldValue,
    newValue,
    changedBy: userId,
    changedByName: userName,
    changedAt: new Date(),
    reason
  })
  return this
}

// Method to generate project ID from qualified lead ID
// Format: QUALIFIED_LEAD_ID-EXECUTION_CODE (e.g., HYD-HG-IP-00001-HIP)
projectSchema.methods.generateProjectIdFromLead = async function(qualifiedLeadId, executionType) {
  if (!qualifiedLeadId) {
    throw new Error('Qualified Lead ID is required to generate Project ID')
  }

  this.qualifiedLeadId = qualifiedLeadId
  this.executionType = executionType || this.executionType || 'factory'

  // Generate project ID with execution suffix
  this.projectId = await generateProjectIdFromQualifiedLead({
    qualifiedLeadId,
    executionType: this.executionType
  })

  return this.projectId
}

// Pre-save hook to auto-generate project ID if qualifiedLeadId is set but projectId is not
projectSchema.pre('save', async function(next) {
  // If we have a qualified lead ID but no project ID, generate one
  if (this.qualifiedLeadId && !this.projectId) {
    try {
      this.projectId = await generateProjectIdFromQualifiedLead({
        qualifiedLeadId: this.qualifiedLeadId,
        executionType: this.executionType || 'factory'
      })
    } catch (err) {
      console.error('Failed to generate project ID from qualified lead:', err)
      // Continue without failing - project ID can be generated manually
    }
  }
  next()
})

// Indexes for performance (projectId and slug already indexed via unique: true)
projectSchema.index({ company: 1, status: 1 })
projectSchema.index({ company: 1, stage: 1 })
projectSchema.index({ company: 1, customer: 1 })
projectSchema.index({ company: 1, projectManager: 1 })
projectSchema.index({ company: 1, createdAt: -1 })
projectSchema.index({ company: 1, 'timeline.estimatedEndDate': 1 })
projectSchema.index({ customer: 1, status: 1 })
projectSchema.index({ 'portfolio.isPublished': 1, 'portfolio.isFeatured': 1 })
projectSchema.index({ company: 1, qualifiedLeadId: 1 })
projectSchema.index({ company: 1, executionType: 1 })

export default mongoose.model('Project', projectSchema)
