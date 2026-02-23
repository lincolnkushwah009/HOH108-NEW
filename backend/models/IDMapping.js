import mongoose from 'mongoose'

// ID Mapping / XREF Table - Cross-reference mapping between entities across modules
// Maps how a single real-world entity (e.g., a Customer) is referenced across
// different modules (O2C, P2P, Projects, Finance, etc.)

const idMappingSchema = new mongoose.Schema({
  // Company Scope
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Golden Record Reference
  masterRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterRecord',
    index: true
  },

  // Source Entity
  sourceEntity: {
    type: String,
    required: true,
    uppercase: true
  }, // e.g., 'CUSTOMER', 'VENDOR', 'MATERIAL'

  sourceModel: {
    type: String,
    required: true
  }, // Mongoose model name

  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  sourceHumanId: String, // e.g., 'IP-C-2026-00001'

  sourceDisplayName: String,

  // Target/Referenced Entity
  targetEntity: {
    type: String,
    required: true,
    uppercase: true
  }, // e.g., 'PROJECT', 'SALES_ORDER'

  targetModel: {
    type: String,
    required: true
  },

  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  targetHumanId: String, // e.g., 'IP-P-2026-00003'

  targetDisplayName: String,

  // Relationship Context
  module: {
    type: String,
    enum: ['o2c', 'p2p', 'h2r', 'inventory', 'ppc', 'project', 'finance', 'crm', 'core'],
    required: true
  },

  relationship: {
    type: String,
    required: true
  }, // e.g., 'customer_has_project', 'vendor_supplies_material', 'employee_manages_project'

  relationshipType: {
    type: String,
    enum: ['owns', 'references', 'creates', 'manages', 'supplies', 'consumes', 'approves', 'assigned_to'],
    default: 'references'
  },

  // Metadata
  context: String, // Additional context about this mapping
  priority: { type: Number, default: 0 }, // For ordering references

  // Status
  isActive: { type: Boolean, default: true },
  validFrom: Date,
  validTo: Date,

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: String
}, { timestamps: true })

// Compound indexes
idMappingSchema.index({ company: 1, sourceEntity: 1, sourceId: 1 })
idMappingSchema.index({ company: 1, targetEntity: 1, targetId: 1 })
idMappingSchema.index({ company: 1, sourceEntity: 1, targetEntity: 1 })
idMappingSchema.index({ company: 1, module: 1 })
idMappingSchema.index({ sourceModel: 1, sourceId: 1, targetModel: 1, targetId: 1 }, { unique: true })

export default mongoose.model('IDMapping', idMappingSchema)
