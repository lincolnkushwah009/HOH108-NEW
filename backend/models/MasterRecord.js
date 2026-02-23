import mongoose from 'mongoose'

// Golden Master Record - The single source of truth for each master data record
// Aggregates data from multiple modules into one canonical record
// Tracks versions, data quality, and provides a unified view

const fieldValueSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  value: mongoose.Schema.Types.Mixed,
  source: String, // Which module/system provided this value
  confidence: { type: Number, min: 0, max: 100, default: 100 },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false })

const versionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  changes: [{
    fieldName: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    reason: String
  }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: String
}, { _id: true })

const qualityIssueSchema = new mongoose.Schema({
  ruleType: { type: String, enum: ['completeness', 'uniqueness', 'validity', 'consistency', 'timeliness'] },
  fieldName: String,
  description: String,
  severity: { type: String, enum: ['error', 'warning', 'info'], default: 'warning' },
  status: { type: String, enum: ['open', 'resolved', 'ignored'], default: 'open' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date
}, { _id: true })

const masterRecordSchema = new mongoose.Schema({
  // Company Scope
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Entity Reference
  entityCode: {
    type: String,
    required: true,
    uppercase: true,
    index: true
  }, // e.g., 'CUSTOMER', 'VENDOR'

  // Source Record Reference
  sourceModel: {
    type: String,
    required: true
  }, // Mongoose model name

  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  }, // ObjectId in source collection

  sourceHumanId: String, // Human-readable ID (e.g., 'IP-C-2026-00001')

  // Golden Record Data
  goldenRecord: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }, // Key-value pairs of canonical field values

  // Detailed Field Values with Provenance
  fieldValues: [fieldValueSchema],

  // Display Fields (denormalized for search/listing)
  displayName: { type: String, index: true }, // Primary display name
  displayId: String, // Primary display ID
  displayEmail: String,
  displayPhone: String,
  displayCategory: String,

  // Data Quality
  qualityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  completeness: { type: Number, default: 0, min: 0, max: 100 },
  qualityIssues: [qualityIssueSchema],

  // Cross-References (IDs in other modules)
  crossReferences: [{
    module: String,        // e.g., 'o2c', 'p2p'
    entityCode: String,    // e.g., 'SALES_ORDER', 'PURCHASE_ORDER'
    referenceId: mongoose.Schema.Types.ObjectId,
    referenceHumanId: String,
    relationship: String   // e.g., 'has_orders', 'is_vendor_for'
  }],

  // Duplicate Detection
  isDuplicate: { type: Boolean, default: false },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterRecord' },
  duplicateScore: Number, // Similarity score 0-100
  potentialDuplicates: [{
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterRecord' },
    score: Number,
    matchedFields: [String]
  }],

  // Versioning
  currentVersion: { type: Number, default: 1 },
  versions: [versionSchema],

  // Governance
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_review', 'merged', 'archived'],
    default: 'active'
  },

  approvalStatus: {
    type: String,
    enum: ['approved', 'pending', 'rejected', 'not_required'],
    default: 'not_required'
  },

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,

  // Tags and Classification
  tags: [String],
  segment: String,

  // Sync Status
  lastSyncAt: { type: Date, default: Date.now },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error', 'stale'],
    default: 'synced'
  },

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: String,
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedByName: String
}, { timestamps: true })

// Compound indexes for performance
masterRecordSchema.index({ company: 1, entityCode: 1 })
masterRecordSchema.index({ company: 1, entityCode: 1, status: 1 })
masterRecordSchema.index({ company: 1, displayName: 'text', displayId: 'text', sourceHumanId: 'text' })
masterRecordSchema.index({ sourceModel: 1, sourceId: 1 }, { unique: true })
masterRecordSchema.index({ company: 1, qualityScore: 1 })
masterRecordSchema.index({ company: 1, syncStatus: 1 })
masterRecordSchema.index({ company: 1, isDuplicate: 1 })

export default mongoose.model('MasterRecord', masterRecordSchema)
