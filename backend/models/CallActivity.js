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
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const callActivitySchema = new mongoose.Schema({
  // Auto-generated Activity ID (e.g., IP-CA-2024-00001)
  activityId: {
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

  // Lead Reference
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
    index: true
  },

  // Call Details
  callType: {
    type: String,
    enum: ['outbound', 'inbound', 'follow_up', 'scheduled', 'cold_call'],
    default: 'outbound'
  },

  // Call Attempt Tracking
  attemptNumber: {
    type: Number,
    default: 1
  },

  // Caller Information
  calledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  calledByName: String,
  calledByDepartment: {
    type: String,
    enum: ['pre_sales', 'crm', 'sales'],
    required: true
  },

  // Contact Details (for reference)
  contactPhone: String,
  contactName: String,

  // Call Timing
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: {
    type: Number,
    default: 0
  }, // in seconds

  // Call Status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'cancelled', 'failed'],
    default: 'scheduled'
  },

  // Call Outcome
  outcome: {
    type: String,
    enum: [
      'interested',
      'not_interested',
      'callback_requested',
      'meeting_scheduled',
      'information_shared',
      'wrong_number',
      'rnr', // Ring No Response
      'future_prospect',
      'qualified',
      'lost',
      'follow_up_required',
      'voicemail_left',
      'busy_call_back'
    ]
  },

  // Call Recording
  recording: {
    url: String,
    duration: Number,
    fileSize: Number,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transcription: String // Optional: AI transcription
  },

  // Call Notes
  notes: String,
  summary: String,

  // Next Action
  nextAction: {
    type: {
      type: String,
      enum: ['call', 'meeting', 'email', 'site_visit', 'proposal', 'none']
    },
    scheduledAt: Date,
    notes: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Meeting Details (if meeting is scheduled from this call)
  meetingScheduled: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting'
    },
    scheduledDate: Date,
    scheduledTime: String,
    location: String,
    meetingType: {
      type: String,
      enum: ['in_person', 'video_call', 'phone', 'site_visit']
    },
    attendees: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      role: String
    }],
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show'],
      default: 'scheduled'
    },
    completedAt: Date,
    meetingOutcome: String,
    meetingNotes: String
  },

  // Lead Status Update (if status changed due to this call)
  leadStatusUpdate: {
    updated: {
      type: Boolean,
      default: false
    },
    previousStatus: String,
    newStatus: String,
    updatedAt: Date
  },

  // Tags
  tags: [String],

  // Callyzer Integration Data
  callyzerData: {
    callId: String, // Unique call ID from Callyzer
    employeeNumber: String,
    callType: String, // Original Callyzer call type
    syncedAt: Date
  },

  // Activity Log
  activities: [activitySchema]
}, {
  timestamps: true
})

// Pre-save: Generate activity ID
callActivitySchema.pre('save', async function(next) {
  if (!this.activityId && this.company) {
    try {
      const Company = mongoose.model('Company')
      const company = await Company.findById(this.company)
      if (company) {
        // Custom sequence for call activities
        if (!company.sequences.callActivity) {
          company.sequences.callActivity = 0
        }
        company.sequences.callActivity += 1
        await company.save()

        const year = new Date().getFullYear()
        const paddedSeq = String(company.sequences.callActivity).padStart(5, '0')
        this.activityId = `${company.code}-CA-${year}-${paddedSeq}`
      }
    } catch (err) {
      console.error('Error generating call activity ID:', err)
    }
  }
  next()
})

// Method to complete the call
callActivitySchema.methods.completeCall = function(data, userId, userName) {
  // Support both object and positional args
  const outcome = typeof data === 'object' ? data.outcome : data
  const notes = typeof data === 'object' ? data.notes : userId
  const duration = typeof data === 'object' ? data.duration : userName
  const nextAction = typeof data === 'object' ? data.nextAction : undefined
  const nextActionDate = typeof data === 'object' ? data.nextActionDate : undefined
  const callerId = typeof data === 'object' ? userId : undefined
  const callerName = typeof data === 'object' ? userName : undefined

  this.status = 'completed'
  this.endedAt = new Date()
  this.outcome = outcome
  if (notes) this.notes = notes
  this.duration = duration || Math.floor((this.endedAt - this.startedAt) / 1000)
  if (nextAction) this.nextAction = nextAction
  if (nextActionDate) this.nextActionDate = nextActionDate

  this.activities.push({
    action: 'call_completed',
    description: `Call completed with outcome: ${outcome}`,
    performedBy: this.calledBy,
    performedByName: this.calledByName,
    newValue: { outcome, duration: this.duration }
  })

  return this.save()
}

// Method to schedule meeting from call
callActivitySchema.methods.scheduleMeeting = function(meetingDetails, userId, userName) {
  this.meetingScheduled = {
    isScheduled: true,
    scheduledDate: meetingDetails.date,
    scheduledTime: meetingDetails.time,
    location: meetingDetails.location,
    meetingType: meetingDetails.type || 'in_person',
    attendees: meetingDetails.attendees || [],
    status: 'scheduled'
  }

  this.outcome = 'meeting_scheduled'

  this.activities.push({
    action: 'meeting_scheduled',
    description: `Meeting scheduled for ${meetingDetails.date}`,
    performedBy: userId,
    performedByName: userName,
    newValue: this.meetingScheduled
  })

  return this.save()
}

// Method to update meeting status
callActivitySchema.methods.updateMeetingStatus = function(status, outcome, notes, userId, userName) {
  if (!this.meetingScheduled.isScheduled) {
    throw new Error('No meeting scheduled for this call')
  }

  const oldStatus = this.meetingScheduled.status
  this.meetingScheduled.status = status

  if (status === 'completed') {
    this.meetingScheduled.completedAt = new Date()
    this.meetingScheduled.meetingOutcome = outcome
    this.meetingScheduled.meetingNotes = notes
  }

  this.activities.push({
    action: 'meeting_status_updated',
    description: `Meeting status changed from ${oldStatus} to ${status}`,
    performedBy: userId,
    performedByName: userName,
    oldValue: oldStatus,
    newValue: status
  })

  return this.save()
}

// Method to add recording
callActivitySchema.methods.addRecording = function(recordingData, userId) {
  this.recording = {
    url: recordingData.url,
    duration: recordingData.duration,
    fileSize: recordingData.fileSize,
    uploadedAt: new Date(),
    uploadedBy: userId
  }

  this.activities.push({
    action: 'recording_added',
    description: 'Call recording uploaded',
    performedBy: userId
  })

  return this.save()
}

// Static: Get call history for a lead
callActivitySchema.statics.getLeadCallHistory = function(leadId, options = {}) {
  const query = { lead: leadId }

  if (options.status) query.status = options.status
  if (options.outcome) query.outcome = options.outcome
  if (options.department) query.calledByDepartment = options.department

  return this.find(query)
    .populate('calledBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
}

// Static: Get call stats for a lead
callActivitySchema.statics.getLeadCallStats = async function(leadId) {
  const stats = await this.aggregate([
    { $match: { lead: new mongoose.Types.ObjectId(leadId) } },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        completedCalls: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        noAnswerCalls: {
          $sum: { $cond: [{ $eq: ['$status', 'no_answer'] }, 1, 0] }
        },
        meetingsScheduled: {
          $sum: { $cond: ['$meetingScheduled.isScheduled', 1, 0] }
        },
        meetingsCompleted: {
          $sum: { $cond: [{ $eq: ['$meetingScheduled.status', 'completed'] }, 1, 0] }
        },
        totalDuration: { $sum: '$duration' },
        avgDuration: { $avg: '$duration' }
      }
    }
  ])

  return stats[0] || {
    totalCalls: 0,
    completedCalls: 0,
    noAnswerCalls: 0,
    meetingsScheduled: 0,
    meetingsCompleted: 0,
    totalDuration: 0,
    avgDuration: 0
  }
}

// Static: Get user call stats
callActivitySchema.statics.getUserCallStats = async function(userId, dateRange = {}) {
  const match = { calledBy: new mongoose.Types.ObjectId(userId) }

  if (dateRange.start) {
    match.createdAt = { $gte: new Date(dateRange.start) }
  }
  if (dateRange.end) {
    match.createdAt = { ...match.createdAt, $lte: new Date(dateRange.end) }
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$outcome',
        count: { $sum: 1 }
      }
    }
  ])

  return stats
}

// Indexes
callActivitySchema.index({ company: 1, lead: 1, createdAt: -1 })
callActivitySchema.index({ company: 1, calledBy: 1, createdAt: -1 })
callActivitySchema.index({ company: 1, status: 1 })
callActivitySchema.index({ company: 1, 'meetingScheduled.scheduledDate': 1 })
callActivitySchema.index({ lead: 1, attemptNumber: 1 })

export default mongoose.model('CallActivity', callActivitySchema)
