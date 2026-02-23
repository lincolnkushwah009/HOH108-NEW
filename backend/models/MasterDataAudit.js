import mongoose from 'mongoose'

// Master Data Audit - Comprehensive audit trail for all master data changes
// Tracks every create, update, delete, merge, and governance action
// across the entire MDM system

const masterDataAuditSchema = new mongoose.Schema({
  // Company Scope
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // What was changed
  entityCode: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  },

  sourceModel: String,
  sourceId: mongoose.Schema.Types.ObjectId,
  sourceHumanId: String,
  recordName: String, // Display name of the affected record

  // Master Record Reference (if applicable)
  masterRecord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterRecord'
  },

  // Action
  action: {
    type: String,
    enum: [
      'create', 'update', 'delete', 'archive',
      'merge', 'split', 'link', 'unlink',
      'approve', 'reject', 'review',
      'sync', 'resync', 'quality_check',
      'duplicate_detected', 'duplicate_resolved',
      'bulk_import', 'bulk_update', 'bulk_delete',
      'field_update', 'status_change',
      'golden_record_created', 'golden_record_updated'
    ],
    required: true
  },

  // Action Details
  description: String,

  // Changes (for update actions)
  changes: [{
    fieldName: String,
    fieldLabel: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    module: String // Which module triggered this change
  }],

  // Merge Details (for merge actions)
  mergeDetails: {
    survivingRecord: mongoose.Schema.Types.ObjectId,
    mergedRecords: [mongoose.Schema.Types.ObjectId],
    conflictResolutions: [{
      fieldName: String,
      values: [mongoose.Schema.Types.Mixed],
      selectedValue: mongoose.Schema.Types.Mixed,
      resolution: { type: String, enum: ['auto', 'manual'] }
    }]
  },

  // Quality Check Details
  qualityDetails: {
    previousScore: Number,
    newScore: Number,
    issuesFound: Number,
    issuesResolved: Number
  },

  // Source of Change
  changeSource: {
    type: String,
    enum: ['manual', 'api', 'sync', 'automation', 'import', 'system', 'merge'],
    default: 'manual'
  },

  module: {
    type: String,
    enum: ['o2c', 'p2p', 'h2r', 'inventory', 'ppc', 'project', 'finance', 'crm', 'core', 'mdm']
  },

  // Who made the change
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  performedByName: String,
  performedByRole: String,

  // IP/Session tracking
  ipAddress: String,
  userAgent: String,

  // Result
  status: {
    type: String,
    enum: ['success', 'failed', 'partial'],
    default: 'success'
  },
  errorMessage: String,

  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  // TTL: Auto-delete audit logs older than 2 years (optional)
  // expireAfterSeconds: 63072000
})

// Indexes for efficient querying
masterDataAuditSchema.index({ company: 1, createdAt: -1 })
masterDataAuditSchema.index({ company: 1, entityCode: 1, createdAt: -1 })
masterDataAuditSchema.index({ company: 1, action: 1 })
masterDataAuditSchema.index({ company: 1, performedBy: 1 })
masterDataAuditSchema.index({ company: 1, sourceModel: 1, sourceId: 1 })
masterDataAuditSchema.index({ company: 1, masterRecord: 1 })

export default mongoose.model('MasterDataAudit', masterDataAuditSchema)
