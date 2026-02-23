import mongoose from 'mongoose'

// Activity log sub-schema
const activitySchema = new mongoose.Schema({
  action: {
    type: String,
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
  fieldChanged: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// BOQ Item Schema (Bill of Quantities)
const boqItemSchema = new mongoose.Schema({
  itemCode: String,
  slNo: Number,
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['civil', 'electrical', 'plumbing', 'carpentry', 'painting', 'flooring', 'false_ceiling', 'furniture', 'hardware', 'glass', 'other']
  },
  subCategory: String,
  unit: {
    type: String,
    enum: ['sqft', 'sqm', 'rft', 'nos', 'kg', 'ltr', 'set', 'lot', 'ls', 'cum', 'cft'],
    default: 'sqft'
  },
  quantity: {
    type: Number,
    default: 0
  },
  unitRate: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    default: 0
  },
  specifications: String,
  remarks: String,
  isTentative: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  }
})

// BOM Item Schema (Bill of Materials)
const bomItemSchema = new mongoose.Schema({
  materialCode: String,
  slNo: Number,
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['raw_material', 'hardware', 'electrical', 'plumbing', 'paint', 'adhesive', 'finishing', 'furniture', 'fixtures', 'other']
  },
  brand: String,
  specifications: String,
  unit: {
    type: String,
    enum: ['sqft', 'sqm', 'rft', 'nos', 'kg', 'ltr', 'set', 'lot', 'sheets', 'rolls', 'boxes'],
    default: 'nos'
  },
  quantity: {
    type: Number,
    default: 0
  },
  estimatedRate: {
    type: Number,
    default: 0
  },
  estimatedAmount: {
    type: Number,
    default: 0
  },
  vendor: String,
  vendorContact: String,
  leadTime: String, // e.g., "7-10 days"
  remarks: String,
  isTentative: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  }
})

const salesOrderSchema = new mongoose.Schema({
  // Auto-generated Sales Order ID (e.g., IP-SO-2024-00001)
  salesOrderId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Company Association
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Lead Reference (required for initial orders, optional for subsequent)
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    index: true
  },

  // Subsequent order flag (for orders created from existing customer, not a new lead)
  isSubsequent: {
    type: Boolean,
    default: false
  },

  // Parent sales order reference (for subsequent orders)
  parentSalesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },

  // Customer Reference (created when order is confirmed)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },

  // Project Reference (created after order approval)
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  // Sales Information
  salesPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  salesPersonName: String,
  salesTeam: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['primary', 'support', 'coordinator']
    },
    contribution: Number // Percentage
  }],

  // Order Details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,

  // Service Category
  category: {
    type: String,
    enum: ['interior', 'construction', 'renovation', 'education', 'ods', 'other'],
    required: true
  },
  subCategory: String,

  // Client Information (snapshot from lead)
  clientInfo: {
    name: String,
    email: String,
    phone: String,
    alternatePhone: String,
    address: String,
    city: String,
    state: String,
    pincode: String
  },

  // Site/Project Location
  siteLocation: {
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

  // Property Details
  propertyDetails: {
    type: {
      type: String,
      enum: ['apartment', 'villa', 'independent_house', 'commercial', 'office', 'retail', 'plot', 'other']
    },
    area: {
      value: Number,
      unit: {
        type: String,
        enum: ['sqft', 'sqm'],
        default: 'sqft'
      }
    },
    floors: Number,
    rooms: Number,
    bathrooms: Number
  },

  // Bill of Quantities (BOQ)
  boq: [boqItemSchema],
  boqSummary: {
    totalItems: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    lastUpdated: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // Bill of Materials (BOM)
  bom: [bomItemSchema],
  bomSummary: {
    totalItems: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    lastUpdated: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // Cost Estimation
  costEstimation: {
    // Direct Costs
    materialCost: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    equipmentCost: { type: Number, default: 0 },
    transportCost: { type: Number, default: 0 },

    // Indirect Costs
    overheadCost: { type: Number, default: 0 },
    contingency: { type: Number, default: 0 },
    adminCost: { type: Number, default: 0 },

    // Profit & Margin
    profitMargin: { type: Number, default: 0 }, // Percentage
    profitAmount: { type: Number, default: 0 },

    // Taxes
    gstPercentage: { type: Number, default: 18 },
    gstAmount: { type: Number, default: 0 },
    otherTaxes: { type: Number, default: 0 },

    // Totals
    subTotal: { type: Number, default: 0 },
    totalEstimate: { type: Number, default: 0 },

    // Quotation
    quotedAmount: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },

    // Payment Terms
    advancePercentage: { type: Number, default: 30 },
    advanceAmount: { type: Number, default: 0 },

    // Flags
    isTentative: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },

  // Timeline
  timeline: {
    estimatedStartDate: Date,
    estimatedEndDate: Date,
    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'weeks'
      }
    },
    clientRequestedDate: Date,
    notes: String
  },

  // Scope of Work
  scopeOfWork: [{
    phase: String,
    description: String,
    items: [String],
    estimatedDuration: String,
    dependencies: [String]
  }],

  // Terms & Conditions
  terms: {
    paymentTerms: String,
    warranty: String,
    validity: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'days'
      }
    },
    specialConditions: [String]
  },

  // Documents
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['quotation', 'proposal', 'boq', 'bom', 'floor_plan', 'design', 'agreement', 'other']
    },
    url: String,
    version: { type: Number, default: 1 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedByName: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'submitted', 'negotiation', 'revised', 'approved', 'rejected', 'project_created', 'cancelled'],
    default: 'draft'
  },

  // Status History
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    changedAt: { type: Date, default: Date.now },
    remarks: String
  }],

  // Negotiation History
  negotiations: [{
    round: Number,
    originalAmount: Number,
    requestedAmount: Number,
    finalAmount: Number,
    clientRemarks: String,
    ourResponse: String,
    negotiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    negotiatedByName: String,
    negotiatedAt: Date
  }],

  // Closure Details
  closure: {
    closedDate: Date,
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedByName: String,
    closureRemarks: String,
    wonReason: String,
    lostReason: String
  },

  // Notes
  notes: [{
    content: String,
    type: {
      type: String,
      enum: ['general', 'internal', 'client_feedback', 'negotiation'],
      default: 'general'
    },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedByName: String,
    addedAt: { type: Date, default: Date.now },
    isPinned: { type: Boolean, default: false }
  }],

  // Activity Log
  activities: [activitySchema],

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByName: String,

  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedByName: String
}, {
  timestamps: true
})

// Pre-save: Generate Sales Order ID
salesOrderSchema.pre('save', async function(next) {
  if (!this.salesOrderId && this.company) {
    try {
      const Company = mongoose.model('Company')
      const company = await Company.findById(this.company)
      if (company) {
        if (!company.sequences.salesOrder) {
          company.sequences.salesOrder = 0
        }
        company.sequences.salesOrder += 1
        await company.save()

        const year = new Date().getFullYear()
        const paddedSeq = String(company.sequences.salesOrder).padStart(5, '0')
        this.salesOrderId = `${company.code}-SO-${year}-${paddedSeq}`
      }
    } catch (err) {
      console.error('Error generating sales order ID:', err)
    }
  }
  next()
})

// Pre-save: Calculate BOQ & BOM summaries
salesOrderSchema.pre('save', function(next) {
  // BOQ Summary
  if (this.boq && this.boq.length > 0) {
    this.boqSummary.totalItems = this.boq.length
    this.boqSummary.totalAmount = this.boq.reduce((sum, item) => {
      item.amount = (item.quantity || 0) * (item.unitRate || 0)
      return sum + item.amount
    }, 0)
  }

  // BOM Summary
  if (this.bom && this.bom.length > 0) {
    this.bomSummary.totalItems = this.bom.length
    this.bomSummary.totalAmount = this.bom.reduce((sum, item) => {
      item.estimatedAmount = (item.quantity || 0) * (item.estimatedRate || 0)
      return sum + item.estimatedAmount
    }, 0)
  }

  // Cost Estimation Calculations
  if (this.costEstimation) {
    const ce = this.costEstimation

    // Sub-total (before profit and taxes)
    ce.subTotal = (ce.materialCost || 0) + (ce.laborCost || 0) + (ce.equipmentCost || 0) +
      (ce.transportCost || 0) + (ce.overheadCost || 0) + (ce.contingency || 0) + (ce.adminCost || 0)

    // Profit
    ce.profitAmount = (ce.subTotal * (ce.profitMargin || 0)) / 100

    // Before tax total
    const beforeTax = ce.subTotal + ce.profitAmount

    // GST
    ce.gstAmount = (beforeTax * (ce.gstPercentage || 0)) / 100

    // Total Estimate
    ce.totalEstimate = beforeTax + ce.gstAmount + (ce.otherTaxes || 0)

    // If quoted amount not set, use total estimate
    if (!ce.quotedAmount) {
      ce.quotedAmount = ce.totalEstimate
    }

    // Discount
    ce.discountAmount = (ce.quotedAmount * (ce.discountPercentage || 0)) / 100

    // Final Amount
    ce.finalAmount = ce.quotedAmount - ce.discountAmount

    // Advance Amount
    ce.advanceAmount = (ce.finalAmount * (ce.advancePercentage || 0)) / 100
  }

  next()
})

// Method: Update Status
salesOrderSchema.methods.updateStatus = function(newStatus, userId, userName, remarks) {
  const oldStatus = this.status
  this.status = newStatus

  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedByName: userName,
    remarks
  })

  this.activities.push({
    action: 'status_changed',
    description: `Status changed from ${oldStatus} to ${newStatus}`,
    performedBy: userId,
    performedByName: userName,
    oldValue: oldStatus,
    newValue: newStatus
  })

  return this.save()
}

// Method: Add BOQ Item
salesOrderSchema.methods.addBOQItem = function(item, userId, userName) {
  item.slNo = this.boq.length + 1
  item.amount = (item.quantity || 0) * (item.unitRate || 0)
  this.boq.push(item)

  this.boqSummary.lastUpdated = new Date()
  this.boqSummary.updatedBy = userId

  this.activities.push({
    action: 'boq_item_added',
    description: `BOQ item added: ${item.description}`,
    performedBy: userId,
    performedByName: userName,
    newValue: item
  })

  return this.save()
}

// Method: Add BOM Item
salesOrderSchema.methods.addBOMItem = function(item, userId, userName) {
  item.slNo = this.bom.length + 1
  item.estimatedAmount = (item.quantity || 0) * (item.estimatedRate || 0)
  this.bom.push(item)

  this.bomSummary.lastUpdated = new Date()
  this.bomSummary.updatedBy = userId

  this.activities.push({
    action: 'bom_item_added',
    description: `BOM item added: ${item.description}`,
    performedBy: userId,
    performedByName: userName,
    newValue: item
  })

  return this.save()
}

// Method: Add Negotiation Round
salesOrderSchema.methods.addNegotiation = function(negotiation, userId, userName) {
  negotiation.round = this.negotiations.length + 1
  negotiation.negotiatedBy = userId
  negotiation.negotiatedByName = userName
  negotiation.negotiatedAt = new Date()
  this.negotiations.push(negotiation)

  this.activities.push({
    action: 'negotiation_added',
    description: `Negotiation round ${negotiation.round} recorded`,
    performedBy: userId,
    performedByName: userName,
    newValue: negotiation
  })

  return this.save()
}

// Method: Close Order (Won)
salesOrderSchema.methods.closeAsWon = async function(userId, userName, remarks, projectData) {
  this.status = 'approved'
  this.closure = {
    closedDate: new Date(),
    closedBy: userId,
    closedByName: userName,
    closureRemarks: remarks,
    wonReason: projectData?.wonReason
  }

  this.activities.push({
    action: 'order_won',
    description: 'Sales order closed as won',
    performedBy: userId,
    performedByName: userName
  })

  // Update lead status
  const Lead = mongoose.model('Lead')
  await Lead.findByIdAndUpdate(this.lead, {
    status: 'won',
    isConverted: true,
    convertedAt: new Date(),
    convertedBy: userId,
    salesOrder: this._id
  })

  return this.save()
}

// Method: Create Project from Order
salesOrderSchema.methods.createProject = async function(userId, userName) {
  if (this.status !== 'approved') {
    throw new Error('Sales order must be approved before creating project')
  }

  if (this.project) {
    throw new Error('Project already created for this order')
  }

  const Project = mongoose.model('Project')
  const Customer = mongoose.model('Customer')
  const Company = mongoose.model('Company')

  // Get or create customer
  let customer = this.customer
  if (!customer) {
    const company = await Company.findById(this.company)
    const customerId = await company.generateId('customer')

    const newCustomer = await Customer.create({
      customerId,
      company: this.company,
      name: this.clientInfo.name,
      email: this.clientInfo.email,
      phone: this.clientInfo.phone,
      alternatePhone: this.clientInfo.alternatePhone,
      addresses: [{
        type: 'site',
        street: this.siteLocation.address,
        city: this.siteLocation.city,
        state: this.siteLocation.state,
        pincode: this.siteLocation.pincode
      }],
      originalLead: this.lead,
      convertedAt: new Date(),
      convertedBy: userId
    })
    customer = newCustomer._id
    this.customer = customer
  }

  // Get company for project ID
  const company = await Company.findById(this.company)
  const projectId = await company.generateId('project')

  // Create project
  const project = await Project.create({
    projectId,
    company: this.company,
    customer,
    originalLead: this.lead,
    salesOrder: this._id,
    title: this.title,
    description: this.description,
    category: this.category,
    subCategory: this.subCategory,
    location: this.siteLocation,
    specifications: {
      area: this.propertyDetails.area,
      propertyType: this.propertyDetails.type,
      floors: this.propertyDetails.floors,
      rooms: this.propertyDetails.rooms,
      bathrooms: this.propertyDetails.bathrooms
    },
    timeline: {
      estimatedStartDate: this.timeline.estimatedStartDate,
      estimatedEndDate: this.timeline.estimatedEndDate,
      estimatedDuration: this.timeline.estimatedDuration
    },
    financials: {
      quotedAmount: this.costEstimation.quotedAmount,
      agreedAmount: this.costEstimation.finalAmount,
      discount: this.costEstimation.discountAmount
    },
    stage: 'initiation',
    status: 'active',
    createdBy: userId,
    activities: [{
      action: 'created',
      description: `Project created from Sales Order ${this.salesOrderId}`,
      performedBy: userId,
      performedByName: userName
    }]
  })

  this.project = project._id
  this.status = 'project_created'

  this.activities.push({
    action: 'project_created',
    description: `Project ${project.projectId} created`,
    performedBy: userId,
    performedByName: userName,
    newValue: project._id
  })

  await this.save()

  return project
}

// Indexes
salesOrderSchema.index({ company: 1, status: 1 })
salesOrderSchema.index({ company: 1, lead: 1 })
salesOrderSchema.index({ company: 1, salesPerson: 1 })
salesOrderSchema.index({ company: 1, createdAt: -1 })
salesOrderSchema.index({ company: 1, 'closure.closedDate': -1 })

export default mongoose.model('SalesOrder', salesOrderSchema)
