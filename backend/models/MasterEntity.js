import mongoose from 'mongoose'

// Master Entity Registry - Catalog of all master data entity types across the ERP
// Each entry defines a master entity (Customer, Vendor, Material, Employee, etc.)
// and maps it to the underlying MongoDB model, ID patterns, and module assignments

const fieldMappingSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  displayLabel: String,
  fieldType: { type: String, enum: ['string', 'number', 'date', 'boolean', 'reference', 'array', 'object', 'email', 'phone', 'currency'], default: 'string' },
  isRequired: { type: Boolean, default: false },
  isUnique: { type: Boolean, default: false },
  isSearchable: { type: Boolean, default: true },
  isMasterField: { type: Boolean, default: true }, // Part of golden record
  referenceEntity: String, // If type is 'reference', points to another master entity code
  validationRule: String, // Regex or rule name
  defaultValue: mongoose.Schema.Types.Mixed,
  module: String // Which module owns this field
}, { _id: false })

const crossReferenceSchema = new mongoose.Schema({
  relatedEntity: { type: String, required: true }, // Entity code (e.g., 'CUSTOMER', 'PROJECT')
  relationshipType: { type: String, enum: ['one_to_one', 'one_to_many', 'many_to_one', 'many_to_many'], default: 'one_to_many' },
  foreignKeyField: String, // Field in this entity that references the other
  description: String
}, { _id: false })

const masterEntitySchema = new mongoose.Schema({
  // Entity Identity
  entityCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  }, // e.g., 'CUSTOMER', 'VENDOR', 'MATERIAL', 'EMPLOYEE', 'PROJECT'

  entityName: {
    type: String,
    required: true,
    trim: true
  }, // e.g., 'Customer Master', 'Vendor Master'

  description: String,

  // Classification
  category: {
    type: String,
    enum: [
      'party_master',      // Customer, Vendor, Lead
      'item_master',       // Material, BOQ Item, Package
      'employee_master',   // User/Employee
      'financial_master',  // Payment Terms, Tax Config, Currency
      'location_master',   // Company, Department, Warehouse
      'project_master',    // Project, Work Order
      'document_master',   // PO, PR, Invoice, Quotation
      'configuration'      // Settings, Roles, Templates
    ],
    required: true
  },

  // Module Assignment
  primaryModule: {
    type: String,
    enum: ['o2c', 'p2p', 'h2r', 'inventory', 'ppc', 'project', 'finance', 'crm', 'core'],
    required: true
  },

  secondaryModules: [{
    type: String,
    enum: ['o2c', 'p2p', 'h2r', 'inventory', 'ppc', 'project', 'finance', 'crm', 'core']
  }],

  // Technical Mapping
  mongoModel: {
    type: String,
    required: true
  }, // Mongoose model name (e.g., 'Customer', 'Vendor', 'Material')

  mongoCollection: String, // Actual MongoDB collection name

  idField: {
    type: String,
    required: true
  }, // Field name for the human-readable ID (e.g., 'customerId', 'vendorId')

  idPattern: String, // ID format pattern (e.g., '{CODE}-C-{YEAR}-{SEQ}')

  idPrefix: String, // ID prefix (e.g., 'C', 'V', 'MAT')

  // Field Registry
  fields: [fieldMappingSchema],

  // Cross-References to other entities
  crossReferences: [crossReferenceSchema],

  // Governance
  dataOwner: String, // Role responsible for this master data
  dataSteward: String, // Role for day-to-day management
  approvalRequired: { type: Boolean, default: false },
  changeApprovalRoles: [String],

  // Data Quality
  qualityRules: [{
    ruleName: String,
    ruleType: { type: String, enum: ['completeness', 'uniqueness', 'validity', 'consistency', 'timeliness'] },
    description: String,
    field: String,
    condition: String, // JSON-encoded condition
    severity: { type: String, enum: ['error', 'warning', 'info'], default: 'warning' },
    isActive: { type: Boolean, default: true }
  }],

  // Statistics (auto-updated)
  stats: {
    totalRecords: { type: Number, default: 0 },
    activeRecords: { type: Number, default: 0 },
    lastSyncAt: Date,
    qualityScore: { type: Number, default: 0, min: 0, max: 100 },
    duplicateCount: { type: Number, default: 0 },
    incompleteCount: { type: Number, default: 0 }
  },

  // Status
  isActive: { type: Boolean, default: true },
  isCritical: { type: Boolean, default: false }, // Critical master data

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

masterEntitySchema.index({ category: 1 })
masterEntitySchema.index({ primaryModule: 1 })
masterEntitySchema.index({ mongoModel: 1 })

export default mongoose.model('MasterEntity', masterEntitySchema)
