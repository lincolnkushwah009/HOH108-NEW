import mongoose from 'mongoose'

/**
 * Daily Progress Report (DPR) - Site execution tracking
 * FR-PPC-006: Site Daily Progress Reporting
 */

const activityProgressSchema = new mongoose.Schema({
  activityName: {
    type: String,
    required: true
  },
  description: String,
  plannedQuantity: {
    type: Number,
    default: 0
  },
  achievedQuantity: {
    type: Number,
    default: 0
  },
  unit: String,
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'delayed', 'on_hold'],
    default: 'in_progress'
  },
  remarks: String
})

const weatherConditionSchema = new mongoose.Schema({
  condition: {
    type: String,
    enum: ['sunny', 'cloudy', 'rainy', 'stormy', 'foggy', 'hot', 'cold'],
    default: 'sunny'
  },
  temperature: Number,
  humidity: Number,
  workAffected: {
    type: Boolean,
    default: false
  },
  affectedHours: {
    type: Number,
    default: 0
  }
})

const safetyIncidentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['near_miss', 'first_aid', 'medical_treatment', 'lost_time', 'fatality'],
    required: true
  },
  description: String,
  personnel: String,
  actionTaken: String,
  reportedAt: Date
})

const dailyProgressReportSchema = new mongoose.Schema({
  // System generated ID: DPR-YYYY-MM-DD-XXXXX
  dprId: {
    type: String,
    unique: true,
    sparse: true
  },

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

  projectName: String,

  // Work Order Reference (optional - can be overall project DPR)
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder'
  },

  // Report Date
  reportDate: {
    type: Date,
    required: true,
    index: true
  },

  // Site Details
  site: {
    name: String,
    code: String,
    address: String,
    siteIncharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    siteInchargeName: String
  },

  // Weather Conditions
  weather: weatherConditionSchema,

  // Shift Information
  shift: {
    type: {
      type: String,
      enum: ['day', 'night', 'full_day'],
      default: 'day'
    },
    startTime: String,
    endTime: String,
    totalHours: {
      type: Number,
      default: 8
    }
  },

  // Manpower Summary
  manpower: {
    direct: {
      skilled: {
        type: Number,
        default: 0
      },
      semiSkilled: {
        type: Number,
        default: 0
      },
      unskilled: {
        type: Number,
        default: 0
      }
    },
    indirect: {
      supervisors: {
        type: Number,
        default: 0
      },
      engineers: {
        type: Number,
        default: 0
      },
      safety: {
        type: Number,
        default: 0
      },
      admin: {
        type: Number,
        default: 0
      }
    },
    contractor: {
      count: {
        type: Number,
        default: 0
      },
      names: [String]
    },
    total: {
      type: Number,
      default: 0
    },
    totalManHours: {
      type: Number,
      default: 0
    }
  },

  // Activity Progress
  activities: [activityProgressSchema],

  // Overall Progress
  overallProgress: {
    planned: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    actual: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    variance: {
      type: Number,
      default: 0 // actual - planned
    },
    status: {
      type: String,
      enum: ['ahead', 'on_track', 'behind', 'critical'],
      default: 'on_track'
    }
  },

  // Material Received Today
  materialsReceived: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    materialName: String,
    quantity: Number,
    unit: String,
    grnNumber: String,
    vendor: String
  }],

  // Material Consumed Today
  materialsConsumed: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    materialName: String,
    quantity: Number,
    unit: String,
    activity: String
  }],

  // Equipment & Machinery
  equipment: [{
    name: String,
    quantity: Number,
    hours: Number,
    status: {
      type: String,
      enum: ['working', 'idle', 'breakdown', 'maintenance'],
      default: 'working'
    },
    remarks: String
  }],

  // Issues & Delays
  issues: [{
    type: {
      type: String,
      enum: ['material_shortage', 'manpower_shortage', 'weather', 'design_issue', 'approval_pending', 'equipment_breakdown', 'quality_issue', 'safety_issue', 'other'],
      required: true
    },
    description: String,
    impact: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    actionTaken: String,
    responsible: String,
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open'
    }
  }],

  // Safety
  safety: {
    toolboxTalkConducted: {
      type: Boolean,
      default: false
    },
    toolboxTalkTopic: String,
    ppeCompliance: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    incidents: [safetyIncidentSchema],
    safeManHours: {
      type: Number,
      default: 0
    }
  },

  // Quality
  quality: {
    inspectionsConducted: {
      type: Number,
      default: 0
    },
    ncrsRaised: {
      type: Number,
      default: 0
    },
    ncrsResolved: {
      type: Number,
      default: 0
    },
    remarks: String
  },

  // Visitors & Meetings
  visitors: [{
    name: String,
    organization: String,
    purpose: String,
    timeIn: String,
    timeOut: String
  }],

  meetings: [{
    type: {
      type: String,
      enum: ['daily_standup', 'safety_meeting', 'client_meeting', 'review_meeting', 'other']
    },
    topic: String,
    attendees: Number,
    keyDecisions: String
  }],

  // Photos/Attachments
  photos: [{
    url: String,
    caption: String,
    category: {
      type: String,
      enum: ['progress', 'safety', 'quality', 'issue', 'other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Plan for Tomorrow
  tomorrowPlan: {
    activities: [String],
    manpowerRequired: {
      type: Number,
      default: 0
    },
    materialsRequired: [String],
    specialInstructions: String
  },

  // Remarks & Notes
  remarks: String,
  siteEngineerNotes: String,
  projectManagerNotes: String,

  // Approval
  status: {
    type: String,
    enum: ['draft', 'submitted', 'reviewed', 'approved', 'rejected'],
    default: 'draft',
    index: true
  },

  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submittedByName: String,
  submittedAt: Date,

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedByName: String,
  reviewedAt: Date,
  reviewComments: String,

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedByName: String,
  approvedAt: Date,

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Generate DPR ID
dailyProgressReportSchema.pre('save', async function(next) {
  if (!this.dprId) {
    const date = this.reportDate || new Date()
    const dateStr = date.toISOString().split('T')[0]

    const count = await this.constructor.countDocuments({
      company: this.company,
      reportDate: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    })

    this.dprId = `DPR-${dateStr}-${String(count + 1).padStart(3, '0')}`
  }
  next()
})

// Calculate totals
dailyProgressReportSchema.pre('save', function(next) {
  // Calculate total manpower
  const direct = (this.manpower.direct.skilled || 0) +
    (this.manpower.direct.semiSkilled || 0) +
    (this.manpower.direct.unskilled || 0)

  const indirect = (this.manpower.indirect.supervisors || 0) +
    (this.manpower.indirect.engineers || 0) +
    (this.manpower.indirect.safety || 0) +
    (this.manpower.indirect.admin || 0)

  this.manpower.total = direct + indirect + (this.manpower.contractor.count || 0)
  this.manpower.totalManHours = this.manpower.total * (this.shift.totalHours || 8)

  // Calculate progress variance
  this.overallProgress.variance = this.overallProgress.actual - this.overallProgress.planned

  // Determine progress status
  if (this.overallProgress.variance >= 5) {
    this.overallProgress.status = 'ahead'
  } else if (this.overallProgress.variance >= -2) {
    this.overallProgress.status = 'on_track'
  } else if (this.overallProgress.variance >= -10) {
    this.overallProgress.status = 'behind'
  } else {
    this.overallProgress.status = 'critical'
  }

  // Calculate safe man hours
  const hasIncidents = this.safety.incidents && this.safety.incidents.some(
    i => ['medical_treatment', 'lost_time', 'fatality'].includes(i.type)
  )
  this.safety.safeManHours = hasIncidents ? 0 : this.manpower.totalManHours

  next()
})

// Static method to get project progress summary
dailyProgressReportSchema.statics.getProjectSummary = async function(projectId, startDate, endDate) {
  const match = {
    project: new mongoose.Types.ObjectId(projectId)
  }

  if (startDate || endDate) {
    match.reportDate = {}
    if (startDate) match.reportDate.$gte = new Date(startDate)
    if (endDate) match.reportDate.$lte = new Date(endDate)
  }

  const summary = await this.aggregate([
    { $match: match },
    { $sort: { reportDate: 1 } },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        totalManHours: { $sum: '$manpower.totalManHours' },
        totalSafeManHours: { $sum: '$safety.safeManHours' },
        avgProgress: { $avg: '$overallProgress.actual' },
        latestProgress: { $last: '$overallProgress.actual' },
        progressHistory: {
          $push: {
            date: '$reportDate',
            planned: '$overallProgress.planned',
            actual: '$overallProgress.actual'
          }
        },
        totalIssues: { $sum: { $size: { $ifNull: ['$issues', []] } } },
        totalIncidents: { $sum: { $size: { $ifNull: ['$safety.incidents', []] } } }
      }
    }
  ])

  return summary[0] || {
    totalReports: 0,
    totalManHours: 0,
    totalSafeManHours: 0,
    avgProgress: 0,
    latestProgress: 0,
    progressHistory: [],
    totalIssues: 0,
    totalIncidents: 0
  }
}

// Indexes
dailyProgressReportSchema.index({ company: 1, project: 1, reportDate: -1 })
dailyProgressReportSchema.index({ company: 1, reportDate: -1 })
dailyProgressReportSchema.index({ project: 1, reportDate: -1 })
dailyProgressReportSchema.index({ workOrder: 1, reportDate: -1 })

export default mongoose.model('DailyProgressReport', dailyProgressReportSchema)
