import mongoose from 'mongoose'

const companySchema = new mongoose.Schema({
  // Unique identifier code (e.g., 'HG', 'IP', 'CP', 'EP', 'RP', 'OP')
  code: {
    type: String,
    required: [true, 'Please add a company code'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [5, 'Code cannot be more than 5 characters']
  },

  name: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },

  type: {
    type: String,
    enum: ['mother', 'subsidiary'],
    required: true
  },

  parentCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null // null for mother company
  },

  // Companies whose leads this company can also view (for cross-company visibility)
  canViewLeadsFrom: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],

  // Company Details
  logo: {
    type: String,
    default: ''
  },

  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },

  phone: {
    type: String
  },

  website: {
    type: String
  },

  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },

  // Business Settings
  services: [{
    type: String
  }],

  defaultCurrency: {
    type: String,
    default: 'INR'
  },

  fiscalYearStart: {
    type: Number,
    min: 1,
    max: 12,
    default: 4 // April
  },

  // Customizable Lead Status Pipeline
  leadStatuses: [{
    code: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#6B7280'
    },
    order: {
      type: Number,
      default: 0
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    isFinal: {
      type: Boolean,
      default: false // Won/Lost statuses
    }
  }],

  // Customizable Project Stages Pipeline
  projectStages: [{
    code: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#6B7280'
    },
    order: {
      type: Number,
      default: 0
    },
    isFinal: {
      type: Boolean,
      default: false
    }
  }],

  // Customer Segments Configuration
  customerSegments: [{
    code: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    minValue: Number, // Minimum lifetime value for this segment
    maxValue: Number,
    color: {
      type: String,
      default: '#6B7280'
    }
  }],

  // ID Sequence Counters (for auto-generating IDs)
  sequences: {
    lead: { type: Number, default: 0 },
    customer: { type: Number, default: 0 },
    project: { type: Number, default: 0 },
    user: { type: Number, default: 0 },
    leave: { type: Number, default: 0 },
    department: { type: Number, default: 0 },
    // CRM Workflow Sequences
    callActivity: { type: Number, default: 0 },
    salesOrder: { type: Number, default: 0 },
    masterAgreement: { type: Number, default: 0 },
    designIteration: { type: Number, default: 0 },
    // HR/Finance
    reimbursement: { type: Number, default: 0 },
    asset: { type: Number, default: 0 },
    // Accounting
    vendorPaymentMilestone: { type: Number, default: 0 },
    salesDispatch: { type: Number, default: 0 }
  },

  // Entity Registration Details (Indian Compliance)
  gstRegistration: {
    gstin: String,
    gstState: String,
    gstStateCode: String,
    registrationType: {
      type: String,
      enum: ['regular', 'composition', 'unregistered', 'input_service_distributor', 'casual_taxable', 'sez'],
      default: 'regular'
    }
  },
  panNumber: String,
  tanNumber: String,
  cinNumber: String,

  // External Integrations
  integrations: {
    // Callyzer Call Tracking Integration
    callyzer: {
      apiToken: String,
      isEnabled: { type: Boolean, default: false },
      autoSyncCalls: { type: Boolean, default: false },
      syncIntervalMinutes: { type: Number, default: 30 },
      lastSyncAt: Date,
      syncStatus: {
        type: String,
        enum: ['never', 'success', 'failed', 'in_progress'],
        default: 'never'
      },
      configuredAt: Date,
      configuredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Generate next sequence number for an entity type
companySchema.methods.getNextSequence = async function(entityType) {
  const validTypes = ['lead', 'customer', 'project', 'user', 'leave', 'department', 'callActivity', 'salesOrder', 'masterAgreement', 'designIteration', 'ticket', 'reimbursement', 'asset', 'vendorPaymentMilestone', 'salesDispatch']
  if (!validTypes.includes(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`)
  }

  // Initialize if not exists
  if (this.sequences[entityType] === undefined) {
    this.sequences[entityType] = 0
  }

  this.sequences[entityType] += 1
  // Use findByIdAndUpdate to avoid full document validation
  // This prevents validation errors for legacy documents missing required fields
  await mongoose.model('Company').findByIdAndUpdate(
    this._id,
    { $set: { [`sequences.${entityType}`]: this.sequences[entityType] } }
  )
  return this.sequences[entityType]
}

// Generate formatted ID (e.g., IP-L-2024-00001) with collision detection
companySchema.methods.generateId = async function(entityType, retryCount = 0) {
  const prefixMap = {
    lead: 'L',
    customer: 'C',
    project: 'P',
    user: 'U',
    leave: 'LV',
    department: 'D',
    // CRM Workflow prefixes
    callActivity: 'CA',
    salesOrder: 'SO',
    masterAgreement: 'MA',
    designIteration: 'DI',
    // Support Tickets
    ticket: 'TKT',
    // HR/Finance
    reimbursement: 'RB',
    asset: 'AST',
    // Accounting
    vendorPaymentMilestone: 'VPM',
    salesDispatch: 'DSP'
  }

  // Map entity types to their model names and ID field names
  const modelMap = {
    lead: { model: 'Lead', idField: 'leadId' },
    customer: { model: 'Customer', idField: 'customerId' },
    project: { model: 'Project', idField: 'projectId' },
    user: { model: 'User', idField: 'employeeId' },
    leave: { model: 'Leave', idField: 'leaveId' },
    department: { model: 'Department', idField: 'departmentId' },
    callActivity: { model: 'CallActivity', idField: 'callActivityId' },
    salesOrder: { model: 'SalesOrder', idField: 'salesOrderId' },
    masterAgreement: { model: 'MasterAgreement', idField: 'masterAgreementId' },
    designIteration: { model: 'DesignIteration', idField: 'designIterationId' },
    ticket: { model: 'Ticket', idField: 'ticketId' },
    reimbursement: { model: 'Reimbursement', idField: 'reimbursementId' },
    asset: { model: 'Asset', idField: 'assetCode' },
    vendorPaymentMilestone: { model: 'VendorPaymentMilestone', idField: 'milestoneId' },
    salesDispatch: { model: 'SalesDispatch', idField: 'dispatchNumber' }
  }

  const year = new Date().getFullYear()
  const prefix = prefixMap[entityType]
  const idPattern = `${this.code}-${prefix}-${year}-`

  // On first call or retry, sync sequence with actual database records
  if (retryCount === 0 || retryCount > 0) {
    try {
      const modelInfo = modelMap[entityType]
      if (modelInfo) {
        const Model = mongoose.model(modelInfo.model)
        // Find the highest existing sequence number for this year and company
        const latestRecord = await Model.findOne({
          company: this._id,
          [modelInfo.idField]: { $regex: `^${idPattern}` }
        })
          .sort({ [modelInfo.idField]: -1 })
          .select(modelInfo.idField)
          .lean()

        if (latestRecord && latestRecord[modelInfo.idField]) {
          // Extract sequence number from ID (e.g., "IP-TKT-2026-00005" -> 5)
          const parts = latestRecord[modelInfo.idField].split('-')
          const existingSeq = parseInt(parts[parts.length - 1], 10) || 0

          // Update company sequence if database has higher records
          const currentSeq = this.sequences[entityType] || 0
          if (existingSeq >= currentSeq) {
            this.sequences[entityType] = existingSeq
            await mongoose.model('Company').findByIdAndUpdate(
              this._id,
              { $set: { [`sequences.${entityType}`]: existingSeq } }
            )
          }
        }
      }
    } catch (syncError) {
      // Model might not exist yet, continue with normal sequence
      console.log(`Sync warning for ${entityType}:`, syncError.message)
    }
  }

  const seq = await this.getNextSequence(entityType)
  const paddedSeq = String(seq).padStart(5, '0')
  const generatedId = `${this.code}-${prefix}-${year}-${paddedSeq}`

  // Verify the ID doesn't already exist (double-check)
  try {
    const modelInfo = modelMap[entityType]
    if (modelInfo) {
      const Model = mongoose.model(modelInfo.model)
      const existing = await Model.findOne({
        company: this._id,
        [modelInfo.idField]: generatedId
      }).lean()

      if (existing) {
        // ID collision detected, retry with incremented sequence
        if (retryCount < 10) {
          console.log(`ID collision detected for ${generatedId}, retrying...`)
          return this.generateId(entityType, retryCount + 1)
        } else {
          throw new Error(`Unable to generate unique ID after ${retryCount} attempts`)
        }
      }
    }
  } catch (checkError) {
    if (checkError.message.includes('Unable to generate')) {
      throw checkError
    }
    // Model might not exist, continue with generated ID
  }

  return generatedId
}

/**
 * Generate Lead ID with new naming convention
 * Format: {Company}-{Location}-{Source}-{DDMMYY}-{Seq}
 * Example: HOH108-BLR-DM-050225-001
 *
 * @param {Object} leadData - Lead data containing location.city and source
 * @returns {String} - Generated Lead ID
 */
companySchema.methods.generateLeadId = async function(leadData = {}) {
  // 1. Company code
  const companyCode = this.code || 'XXX'

  // 2. Location code mapping
  const locationMap = {
    'Bengaluru': 'BLR',
    'Bangalore': 'BLR',
    'bengaluru': 'BLR',
    'bangalore': 'BLR',
    'Hyderabad': 'HYD',
    'hyderabad': 'HYD',
    'Mysuru': 'MYS',
    'Mysore': 'MYS',
    'mysuru': 'MYS',
    'mysore': 'MYS'
  }
  const city = leadData.location?.city || leadData.city || ''
  const locationCode = locationMap[city] || 'OTH'

  // 3. Source code mapping
  // DM = Digital Marketing (website, google-ads, facebook-ads, instagram, google, social-media)
  // CP = Channel Partner (referral, partner)
  // OT = Other (walk-in, cold-call, event, other)
  const sourceMap = {
    'website': 'DM',
    'google-ads': 'DM',
    'facebook-ads': 'DM',
    'instagram': 'DM',
    'google': 'DM',
    'social-media': 'DM',
    'referral': 'CP',
    'partner': 'CP',
    'walk-in': 'OT',
    'cold-call': 'OT',
    'event': 'OT',
    'other': 'OT'
  }
  const source = leadData.source || 'website'
  const sourceCode = sourceMap[source] || 'DM'

  // 4. Date in DDMMYY format
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  const dateCode = `${day}${month}${year}`

  // 5. Build prefix for sequence counting
  const prefix = `${companyCode}-${locationCode}-${sourceCode}-${dateCode}`

  // 6. Get sequence number by counting existing leads with same prefix today
  const Lead = mongoose.model('Lead')
  const existingCount = await Lead.countDocuments({
    company: this._id,
    leadId: { $regex: `^${prefix}-` }
  })

  const sequence = String(existingCount + 1).padStart(3, '0')
  const generatedId = `${prefix}-${sequence}`

  // 7. Verify uniqueness (in case of race condition)
  const existing = await Lead.findOne({
    company: this._id,
    leadId: generatedId
  }).lean()

  if (existing) {
    // Retry with incremented sequence
    const newSequence = String(existingCount + 2).padStart(3, '0')
    return `${prefix}-${newSequence}`
  }

  return generatedId
}

// Pre-save: Set default pipelines for new companies
companySchema.pre('save', function(next) {
  if (this.isNew) {
    // Set default lead statuses if not provided
    if (!this.leadStatuses || this.leadStatuses.length === 0) {
      this.leadStatuses = [
        { code: 'new', label: 'New', color: '#3B82F6', order: 1, isDefault: true },
        { code: 'contacted', label: 'Contacted', color: '#8B5CF6', order: 2 },
        { code: 'qualified', label: 'Qualified', color: '#F59E0B', order: 3 },
        { code: 'proposal_sent', label: 'Proposal Sent', color: '#EC4899', order: 4 },
        { code: 'negotiation', label: 'Negotiation', color: '#6366F1', order: 5 },
        { code: 'won', label: 'Won', color: '#22C55E', order: 6, isFinal: true },
        { code: 'lost', label: 'Lost', color: '#EF4444', order: 7, isFinal: true }
      ]
    }

    // Set default project stages if not provided
    if (!this.projectStages || this.projectStages.length === 0) {
      this.projectStages = [
        { code: 'initiation', label: 'Initiation', color: '#3B82F6', order: 1 },
        { code: 'design', label: 'Design', color: '#8B5CF6', order: 2 },
        { code: 'approval', label: 'Approval', color: '#F59E0B', order: 3 },
        { code: 'procurement', label: 'Procurement', color: '#EC4899', order: 4 },
        { code: 'execution', label: 'Execution', color: '#6366F1', order: 5 },
        { code: 'qc_snag', label: 'QC & Snag', color: '#14B8A6', order: 6 },
        { code: 'handover', label: 'Handover', color: '#84CC16', order: 7 },
        { code: 'closure', label: 'Closure', color: '#22C55E', order: 8, isFinal: true }
      ]
    }

    // Set default customer segments if not provided
    if (!this.customerSegments || this.customerSegments.length === 0) {
      this.customerSegments = [
        { code: 'platinum', label: 'Platinum', minValue: 5000000, color: '#A855F7' },
        { code: 'gold', label: 'Gold', minValue: 2500000, maxValue: 4999999, color: '#F59E0B' },
        { code: 'silver', label: 'Silver', minValue: 1000000, maxValue: 2499999, color: '#9CA3AF' },
        { code: 'bronze', label: 'Bronze', minValue: 0, maxValue: 999999, color: '#CD7F32' },
        { code: 'new', label: 'New', color: '#3B82F6' }
      ]
    }
  }
  next()
})

// Index for faster queries (code already indexed via unique: true)
companySchema.index({ parentCompany: 1 })
companySchema.index({ isActive: 1 })

export default mongoose.model('Company', companySchema)
