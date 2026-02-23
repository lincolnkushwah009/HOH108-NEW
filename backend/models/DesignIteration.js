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
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  feedbackBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  feedbackByName: String,
  feedbackByRole: String,
  isClient: {
    type: Boolean,
    default: false
  },
  isInternal: {
    type: Boolean,
    default: true
  },

  // Feedback Content
  type: {
    type: String,
    enum: ['approval', 'revision', 'comment', 'question', 'issue'],
    default: 'comment'
  },
  comments: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },

  // For image/file annotations
  annotations: [{
    fileIndex: Number, // Which file this annotation is on
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    comment: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    isResolved: {
      type: Boolean,
      default: false
    },
    resolvedAt: Date,
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // Attachments in feedback
  attachments: [{
    name: String,
    url: String,
    type: String
  }],

  givenAt: {
    type: Date,
    default: Date.now
  },

  // Response to feedback
  response: {
    content: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedByName: String,
    respondedAt: Date
  }
})

// Design File Schema
const designFileSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      '2d_plan', '3d_render', 'elevation', 'section', 'detail',
      'material_board', 'color_scheme', 'furniture_layout',
      'electrical_layout', 'plumbing_layout', 'ceiling_plan',
      'working_drawing', 'presentation', 'other'
    ],
    required: true
  },

  name: {
    type: String,
    required: true
  },
  description: String,

  // File Details
  url: {
    type: String,
    required: true
  },
  thumbnail: String,
  format: String, // pdf, dwg, skp, max, jpg, png, etc.
  fileSize: Number,

  // For multi-page files
  pages: Number,

  // Room/Area this design is for
  area: String, // e.g., "Living Room", "Master Bedroom"

  // Version within iteration
  fileVersion: {
    type: Number,
    default: 1
  },

  // Upload info
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedByName: String,

  // Approval status for this specific file
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'revision_needed'],
    default: 'draft'
  },

  // Notes
  notes: String
})

const designIterationSchema = new mongoose.Schema({
  // Auto-generated Iteration ID (e.g., IP-DI-2024-00001)
  iterationId: {
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

  // Project Reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },

  // Customer Reference
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },

  // Iteration Info
  version: {
    type: Number,
    required: true,
    default: 1
  },
  title: String,
  description: String,

  // Design Phase
  phase: {
    type: String,
    enum: ['concept', 'schematic', 'design_development', 'construction_documents', 'final'],
    default: 'concept'
  },

  // Design Team
  designer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  designerName: String,

  designTeam: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    role: {
      type: String,
      enum: ['lead_designer', 'designer', '3d_artist', 'drafter', 'coordinator'],
      default: 'designer'
    },
    assignedAt: Date
  }],

  // Design Lead/Head (for approval)
  designLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  designLeadName: String,

  // Design Files
  files: [designFileSchema],

  // Scope of this iteration
  scope: {
    areas: [String], // e.g., ["Living Room", "Kitchen", "Master Bedroom"]
    description: String,
    clientRequirements: String,
    designBrief: String
  },

  // Material/Finish Selections
  materials: [{
    category: {
      type: String,
      enum: ['flooring', 'wall_finish', 'ceiling', 'furniture', 'lighting', 'hardware', 'fabric', 'paint', 'other']
    },
    item: String,
    brand: String,
    model: String,
    finish: String,
    color: String,
    image: String,
    estimatedCost: Number,
    area: String, // Which room/area
    status: {
      type: String,
      enum: ['proposed', 'client_approved', 'client_rejected', 'alternate_needed'],
      default: 'proposed'
    }
  }],

  // Client Feedback
  feedback: [feedbackSchema],

  // Status
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'superseded'],
    default: 'in_progress'
  },

  // Internal Review
  internalReview: {
    isReviewed: { type: Boolean, default: false },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedByName: String,
    reviewedAt: Date,
    reviewComments: String,
    reviewStatus: {
      type: String,
      enum: ['pending', 'approved', 'needs_revision'],
      default: 'pending'
    }
  },

  // Client Approval
  clientApproval: {
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedByName: String,
    approvedAt: Date,
    approvalMethod: {
      type: String,
      enum: ['email', 'signature', 'verbal', 'meeting'],
      default: 'meeting'
    },
    signatureUrl: String,
    approvalRemarks: String
  },

  // Design Head Approval
  designHeadApproval: {
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedByName: String,
    approvedAt: Date,
    remarks: String
  },

  // Timeline
  timeline: {
    startedAt: Date,
    targetCompletionDate: Date,
    submittedAt: Date,
    reviewedAt: Date,
    completedAt: Date,
    estimatedHours: Number,
    actualHours: Number
  },

  // Revision History
  revisionNotes: [{
    fromVersion: Number,
    changes: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    changedAt: Date
  }],

  // Tags
  tags: [String],

  // Activity Log
  activities: [activitySchema],

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByName: String
}, {
  timestamps: true
})

// Pre-save: Generate Iteration ID
designIterationSchema.pre('save', async function(next) {
  if (!this.iterationId && this.company) {
    try {
      const Company = mongoose.model('Company')
      const company = await Company.findById(this.company)
      if (company) {
        if (!company.sequences.designIteration) {
          company.sequences.designIteration = 0
        }
        company.sequences.designIteration += 1
        await company.save()

        const year = new Date().getFullYear()
        const paddedSeq = String(company.sequences.designIteration).padStart(5, '0')
        this.iterationId = `${company.code}-DI-${year}-${paddedSeq}`
      }
    } catch (err) {
      console.error('Error generating design iteration ID:', err)
    }
  }
  next()
})

// Method: Submit for Review
designIterationSchema.methods.submitForReview = function(userId, userName) {
  if (this.files.length === 0) {
    throw new Error('Cannot submit iteration without design files')
  }

  this.status = 'submitted'
  this.timeline.submittedAt = new Date()

  // Update all draft files to submitted
  this.files.forEach(file => {
    if (file.status === 'draft') {
      file.status = 'submitted'
    }
  })

  this.activities.push({
    action: 'submitted_for_review',
    description: 'Design iteration submitted for review',
    performedBy: userId,
    performedByName: userName
  })

  return this.save()
}

// Method: Add Internal Review
designIterationSchema.methods.addInternalReview = function(reviewData, userId, userName) {
  this.internalReview = {
    isReviewed: true,
    reviewedBy: userId,
    reviewedByName: userName,
    reviewedAt: new Date(),
    reviewComments: reviewData.comments,
    reviewStatus: reviewData.status // 'approved' or 'needs_revision'
  }

  if (reviewData.status === 'approved') {
    this.status = 'under_review' // Ready for client review
  } else {
    this.status = 'changes_requested'
  }

  this.timeline.reviewedAt = new Date()

  this.activities.push({
    action: 'internal_review_completed',
    description: `Internal review: ${reviewData.status}`,
    performedBy: userId,
    performedByName: userName,
    metadata: { status: reviewData.status, comments: reviewData.comments }
  })

  return this.save()
}

// Method: Add Client Feedback
designIterationSchema.methods.addClientFeedback = function(feedbackData, userId, userName, isClient = false) {
  this.feedback.push({
    feedbackBy: userId,
    feedbackByName: userName,
    isClient,
    isInternal: !isClient,
    type: feedbackData.type || 'comment',
    comments: feedbackData.comments,
    rating: feedbackData.rating,
    annotations: feedbackData.annotations || [],
    attachments: feedbackData.attachments || [],
    givenAt: new Date()
  })

  if (feedbackData.type === 'revision') {
    this.status = 'changes_requested'
  }

  this.activities.push({
    action: 'feedback_added',
    description: `${isClient ? 'Client' : 'Internal'} feedback added`,
    performedBy: userId,
    performedByName: userName,
    metadata: { type: feedbackData.type, isClient }
  })

  return this.save()
}

// Method: Approve by Client
designIterationSchema.methods.approveByClient = function(approvalData, userId, userName) {
  this.clientApproval = {
    isApproved: true,
    approvedBy: userId,
    approvedByName: userName,
    approvedAt: new Date(),
    approvalMethod: approvalData.method || 'meeting',
    signatureUrl: approvalData.signatureUrl,
    approvalRemarks: approvalData.remarks
  }

  // If design head approval is also done, mark as approved
  if (this.designHeadApproval.isApproved) {
    this.status = 'approved'
    this.timeline.completedAt = new Date()
  }

  this.activities.push({
    action: 'client_approved',
    description: 'Design iteration approved by client',
    performedBy: userId,
    performedByName: userName
  })

  return this.save()
}

// Method: Approve by Design Head
designIterationSchema.methods.approveByDesignHead = function(remarks, userId, userName) {
  this.designHeadApproval = {
    isApproved: true,
    approvedBy: userId,
    approvedByName: userName,
    approvedAt: new Date(),
    remarks
  }

  // If client approval is also done, mark as approved
  if (this.clientApproval.isApproved) {
    this.status = 'approved'
    this.timeline.completedAt = new Date()
  }

  this.activities.push({
    action: 'design_head_approved',
    description: 'Design iteration approved by Design Head',
    performedBy: userId,
    performedByName: userName
  })

  return this.save()
}

// Method: Create New Version
designIterationSchema.methods.createNewVersion = async function(userId, userName, revisionNotes) {
  // Mark current as superseded
  this.status = 'superseded'
  await this.save()

  // Create new iteration
  const DesignIteration = mongoose.model('DesignIteration')

  const newIteration = new DesignIteration({
    company: this.company,
    project: this.project,
    customer: this.customer,
    version: this.version + 1,
    title: this.title,
    description: this.description,
    phase: this.phase,
    designer: this.designer,
    designerName: this.designerName,
    designTeam: this.designTeam,
    designLead: this.designLead,
    designLeadName: this.designLeadName,
    scope: this.scope,
    materials: this.materials,
    status: 'in_progress',
    timeline: {
      startedAt: new Date()
    },
    revisionNotes: [{
      fromVersion: this.version,
      changes: revisionNotes,
      changedBy: userId,
      changedByName: userName,
      changedAt: new Date()
    }],
    createdBy: userId,
    createdByName: userName,
    activities: [{
      action: 'created',
      description: `Version ${this.version + 1} created from version ${this.version}`,
      performedBy: userId,
      performedByName: userName
    }]
  })

  await newIteration.save()

  // Update project with new iteration
  const Project = mongoose.model('Project')
  await Project.findByIdAndUpdate(this.project, {
    $push: { designIterations: newIteration._id },
    currentDesignVersion: this.version + 1
  })

  return newIteration
}

// Method: Add File
designIterationSchema.methods.addFile = function(fileData, userId, userName) {
  this.files.push({
    ...fileData,
    uploadedAt: new Date(),
    uploadedBy: userId,
    uploadedByName: userName,
    status: 'draft'
  })

  this.activities.push({
    action: 'file_added',
    description: `File added: ${fileData.name}`,
    performedBy: userId,
    performedByName: userName,
    metadata: { fileName: fileData.name, fileType: fileData.type }
  })

  return this.save()
}

// Static: Get Latest Iteration for Project
designIterationSchema.statics.getLatestForProject = function(projectId) {
  return this.findOne({ project: projectId })
    .sort({ version: -1 })
    .populate('designer', 'name email')
    .populate('designLead', 'name email')
}

// Static: Get All Iterations for Project
designIterationSchema.statics.getProjectIterations = function(projectId) {
  return this.find({ project: projectId })
    .sort({ version: -1 })
    .populate('designer', 'name email')
}

// Indexes
designIterationSchema.index({ company: 1, project: 1, version: -1 })
designIterationSchema.index({ company: 1, designer: 1 })
designIterationSchema.index({ company: 1, status: 1 })
designIterationSchema.index({ project: 1, version: -1 })

export default mongoose.model('DesignIteration', designIterationSchema)
