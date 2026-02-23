import mongoose from 'mongoose'

/**
 * Document - Centralized document management with versioning
 *
 * Provides a unified document store across all modules with
 * version control, access levels, tagging, and entity linking.
 */

const versionSchema = new mongoose.Schema({
  versionNumber: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true,
    default: 0
  },
  mimeType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  changeNotes: {
    type: String
  },
  checksum: {
    type: String
  }
}, { _id: true })

const documentSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  documentId: {
    type: String,
    unique: true
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String
  },

  entityType: {
    type: String,
    enum: ['lead', 'customer', 'project', 'vendor', 'employee', 'invoice', 'purchase_order', 'general'],
    required: true,
    default: 'general'
  },

  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },

  category: {
    type: String,
    enum: ['contract', 'proposal', 'invoice', 'receipt', 'design', 'specification', 'report', 'legal', 'other'],
    default: 'other'
  },

  currentVersion: {
    type: Number,
    default: 1
  },

  versions: [versionSchema],

  tags: [{
    type: String
  }],

  accessLevel: {
    type: String,
    enum: ['public', 'internal', 'confidential', 'restricted'],
    default: 'internal'
  },

  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },

  expiresAt: {
    type: Date
  },

  lastAccessedAt: {
    type: Date
  },

  lastAccessedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes
documentSchema.index({ company: 1, entityType: 1, entityId: 1 })
documentSchema.index({ company: 1, tags: 1 })
documentSchema.index({ company: 1, status: 1 })
documentSchema.index({ company: 1, category: 1 })
documentSchema.index({ company: 1, accessLevel: 1 })
documentSchema.index({ expiresAt: 1 })
documentSchema.index({ createdBy: 1 })

// Generate documentId and sync currentVersion before save
documentSchema.pre('save', async function(next) {
  if (this.isNew && !this.documentId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.documentId = `DOC-${String(count + 1).padStart(4, '0')}`
  }

  // Keep currentVersion in sync with latest version entry
  if (this.versions && this.versions.length > 0) {
    this.currentVersion = Math.max(...this.versions.map(v => v.versionNumber))
  }

  next()
})

// Instance method: Add a new version
documentSchema.methods.addVersion = async function(versionData) {
  const nextVersion = this.currentVersion + 1
  this.versions.push({
    versionNumber: nextVersion,
    ...versionData
  })
  this.currentVersion = nextVersion
  await this.save()
  return this
}

// Instance method: Record access
documentSchema.methods.recordAccess = async function(userId) {
  this.lastAccessedAt = new Date()
  this.lastAccessedBy = userId
  await this.save()
  return this
}

// Static method: Find documents by entity
documentSchema.statics.findByEntity = function(companyId, entityType, entityId) {
  return this.find({
    company: companyId,
    entityType,
    entityId,
    status: 'active'
  })
  .sort({ updatedAt: -1 })
  .populate('createdBy', 'name email')
  .populate('versions.uploadedBy', 'name email')
}

const Document = mongoose.model('Document', documentSchema)

export default Document
