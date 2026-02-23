import mongoose from 'mongoose'

// Sub-schema for checklist items
const checklistItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['pending', 'passed', 'failed', 'na'], default: 'pending' },
  remarks: String,
  checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkedByName: String,
  checkedAt: Date,
  photos: [String]
})

// Sub-schema for defects/snags
const defectSchema = new mongoose.Schema({
  description: { type: String, required: true },
  severity: { type: String, enum: ['minor', 'major', 'critical'], default: 'minor' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToName: String,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedByName: String,
  resolvedAt: Date,
  photos: [String],
  remarks: String
})

// Sub-schema for activity log
const qcActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'updated', 'inspected', 'approved', 'rejected', 'defect_added', 'defect_resolved', 'rework', 'status_changed'],
  },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  oldValue: String,
  newValue: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
})

const qcMasterSchema = new mongoose.Schema({
  // Auto-generated QC ID (e.g., IP-QC-2026-00001)
  qcId: { type: String, unique: true, sparse: true },

  // Company & Project
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  projectName: String,

  // Polymorphic source reference
  sourceType: {
    type: String,
    enum: ['task_instance', 'work_order', 'goods_receipt', 'daily_progress', 'p2p_tracker'],
  },
  sourceId: { type: mongoose.Schema.Types.ObjectId },
  sourceName: String,

  // QC Details
  title: { type: String, required: true, trim: true },
  description: String,
  category: {
    type: String,
    enum: ['design_qc', 'factory_qc', 'site_qc', 'material_qc', 'process_qc'],
    default: 'site_qc'
  },
  phase: String,
  activity: String,

  // Inspection
  inspectionDate: Date,
  inspector: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inspectorName: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'passed', 'failed', 'rework', 'waived'],
    default: 'pending'
  },
  result: {
    type: String,
    enum: ['pass', 'fail', 'partial', 'na'],
  },
  score: { type: Number, min: 0, max: 100 },

  // Checklist
  checklistItems: [checklistItemSchema],

  // Defects/Snags
  defects: [defectSchema],

  // Approval
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedByName: String,
  approvedAt: Date,
  approvalRemarks: String,

  // Additional Info
  remarks: String,
  attachments: [{
    name: String,
    url: String,
    type: { type: String, enum: ['photo', 'document', 'report', 'other'], default: 'document' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedByName: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Activity log
  activities: [qcActivitySchema],

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdByName: String,
  lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModifiedByName: String
}, { timestamps: true })

// Pre-save: Generate QC ID (IP-QC-YYYY-XXXXX)
qcMasterSchema.pre('save', async function (next) {
  if (!this.qcId) {
    const now = new Date()
    const year = now.getFullYear()
    const count = await this.constructor.countDocuments({
      company: this.company,
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    })
    this.qcId = `IP-QC-${year}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

// Instance method: Add activity
qcMasterSchema.methods.addActivity = function (action, description, userId, userName, oldValue, newValue, metadata) {
  this.activities.push({
    action,
    description,
    performedBy: userId,
    performedByName: userName,
    oldValue,
    newValue,
    metadata
  })
}

// Indexes
qcMasterSchema.index({ company: 1, status: 1 })
qcMasterSchema.index({ company: 1, project: 1 })
qcMasterSchema.index({ company: 1, category: 1 })
qcMasterSchema.index({ company: 1, sourceType: 1 })
qcMasterSchema.index({ company: 1, inspector: 1 })
qcMasterSchema.index({ company: 1, createdAt: -1 })
qcMasterSchema.index({ sourceType: 1, sourceId: 1 })

export default mongoose.model('QCMaster', qcMasterSchema)
