import mongoose from 'mongoose'
import { generateQualifiedLeadId } from '../utils/qualifiedLeadIdGenerator.js'

// Activity history sub-schema for tracking all changes
const activitySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: [
      'created',
      'status_changed',
      'assigned',
      'unassigned',
      'priority_changed',
      'note_added',
      'note_deleted',
      'follow_up_set',
      'follow_up_removed',
      'contacted',
      'email_sent',
      'call_made',
      'meeting_scheduled',
      'site_visit',
      'proposal_sent',
      'converted',
      'field_updated',
      'viewed',
      'document_added',
      'communication_logged',
      'disposition_changed',
      'sales_order_created',
      'sales_order_cancelled',
      'call_initiated',
      'call_completed',
      'call_failed',
      'call_missed'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  performedByName: {
    type: String,
    default: 'System'
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  fieldChanged: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Communication log sub-schema
const communicationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['call', 'email', 'sms', 'whatsapp', 'meeting', 'site_visit'],
    required: true
  },
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    default: 'outbound'
  },
  summary: String,
  outcome: String,
  duration: Number, // For calls (minutes)
  scheduledAt: Date,
  completedAt: Date,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recordedByName: String,
  recordedAt: {
    type: Date,
    default: Date.now
  }
})

const leadSchema = new mongoose.Schema({
  // Auto-generated Lead ID (e.g., IP-L-2024-00001)
  leadId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Qualified Lead ID (e.g., HYD-HG-IP-00001) - Generated when lead status changes to "qualified"
  qualifiedLeadId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  // Company Association (Required for multi-company CRM)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required'],
    index: true
  },

  // Contact Information
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  alternatePhone: {
    type: String
  },

  // Location Details
  location: {
    city: {
      type: String,
      enum: ['Bengaluru', 'Mysuru', 'Hyderabad', '']
    },
    state: String,
    pincode: String,
    address: String,
    // Legacy support - string location
    legacy: String
  },

  // Lead Details
  service: {
    type: String,
    default: 'Other'
  },

  // Service Department (interior, modular, civil, furniture, electrical)
  serviceDepartment: {
    type: String
  },

  budget: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    // Legacy support - string budget
    legacy: {
      type: String,
      enum: ['under-5L', '5L-10L', '10L-25L', '25L-50L', '50L-1Cr', 'above-1Cr', 'not-specified']
    }
  },

  propertyType: {
    type: String,
    default: 'Apartment'
  },

  area: {
    value: Number,
    unit: {
      type: String,
      enum: ['sqft', 'sqm'],
      default: 'sqft'
    },
    // Legacy support
    legacy: String
  },

  // Property & Project Details (Mandatory Fields)
  propertyName: {
    type: String
  },
  propertyLocation: {
    type: String
  },
  floorPlan: {
    type: String
  },
  interiorStartDate: {
    type: Date
  },
  moveInDate: {
    type: Date
  },
  requestedMeetingDateTime: {
    type: Date
  },
  whatsappGroupCreated: {
    type: Boolean,
    default: false
  },

  requirements: {
    type: String // Detailed requirements
  },

  message: {
    type: String // Initial inquiry message
  },

  // Lead Source & Attribution
  source: {
    type: String,
    enum: ['website', 'referral', 'social-media', 'google-ads', 'facebook-ads', 'instagram', 'walk-in', 'cold-call', 'event', 'partner', 'google', 'other'],
    default: 'website'
  },

  sourceDetails: {
    type: String // Campaign name, referrer name, event name, etc.
  },

  // Channel Partner reference (when source is 'partner')
  channelPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChannelPartner'
  },

  // CP Data Batch reference (links lead to its source batch)
  cpDataBatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CPDataBatch'
  },

  utmParams: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  },

  websiteSource: {
    type: String,
    default: 'HOH108'
  },

  // Lead Type
  leadType: {
    type: String,
    enum: ['lead', 'career', 'vendor', 'franchise'],
    default: 'lead'
  },

  // ============================================
  // DEPARTMENT ASSIGNMENTS (CRM Workflow)
  // ============================================
  departmentAssignments: {
    // Pre-Sales Department
    preSales: {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      employeeName: String,
      assignedAt: Date,
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      assignedByName: String,
      isActive: {
        type: Boolean,
        default: true
      }
    },
    // CRM Department
    crm: {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      employeeName: String,
      assignedAt: Date,
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      assignedByName: String,
      isActive: {
        type: Boolean,
        default: true
      }
    },
    // Sales Department
    sales: {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      employeeName: String,
      assignedAt: Date,
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      assignedByName: String,
      isActive: {
        type: Boolean,
        default: true
      },
      isExclusive: {
        type: Boolean,
        default: false
      } // True after qualification - only Sales can edit
    },
    // ACM - Assistant Client Manager (from Design team, assigned by Sales Head)
    acm: {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      employeeName: String,
      assignedAt: Date,
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      assignedByName: String,
      isActive: {
        type: Boolean,
        default: true
      }
    },
    // Design Department (assigned by ACM)
    design: {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      employeeName: String,
      assignedAt: Date,
      assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      assignedByName: String,
      isActive: {
        type: Boolean,
        default: true
      }
    }
  },

  // ============================================
  // PRIMARY STATUS (CRM Workflow)
  // ============================================
  primaryStatus: {
    type: String,
    enum: ['new', 'in_progress', 'qualified', 'lost', 'rnr', 'future_prospect', 'meeting_status', 'cold', 'warm', 'hot', 'won', 'contacted', 'proposal', 'negotiation'],
    default: 'new'
  },

  // Secondary Status (legacy — cold/warm/hot are now primaryStatus columns)
  secondaryStatus: {
    type: String,
    enum: ['hot', 'warm', 'cold', 'future', '', null],
    default: null
  },

  // ============================================
  // DISPOSITION TRACKING
  // ============================================
  disposition: {
    category: {
      type: String,
      enum: ['pre_sales', 'sales']
    },
    group: String,
    subDisposition: String,
    groupLabel: String,
    subDispositionLabel: String,
    remarks: String,
    setAt: Date,
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    setByName: String
  },

  dispositionHistory: [{
    category: String,
    group: String,
    subDisposition: String,
    groupLabel: String,
    subDispositionLabel: String,
    remarks: String,
    callAttemptNumber: Number,
    setAt: {
      type: Date,
      default: Date.now
    },
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    setByName: String
  }],

  // Pre-Sales Lock (after qualification)
  preSalesLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: Date,
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // ============================================
  // SCHEDULED MEETING (triggers move to meeting_status)
  // ============================================
  scheduledMeeting: {
    date: Date,
    time: String,
    salesPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    salesPersonName: String,
    designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    designerName: String,
    meetingType: {
      type: String,
      enum: ['office', 'site_visit', 'video_call', 'phone'],
      default: 'office'
    },
    location: String,
    notes: String,
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show'],
      default: 'scheduled'
    },
    scheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scheduledByName: String,
    scheduledAt: Date,
    completedAt: Date,
    outcome: String
  },

  // ============================================
  // DATE TRACKING (CRM Workflow)
  // ============================================
  dateTracking: {
    leadGeneratedDate: Date,
    qualifiedDate: Date,
    transferredToSalesDate: Date,
    firstSalesMeetingDate: Date,
    designMeetingDate: Date
  },

  // ============================================
  // REVISED BUDGET (Sales bucket - role-restricted)
  // ============================================
  revisedBudget: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    revisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    revisedByName: String,
    revisedAt: Date,
    notes: String
  },

  // ============================================
  // REQUIREMENT MEETING (Sales bucket)
  // ============================================
  requirementMeeting: {
    meetingType: {
      type: String,
      enum: ['virtual', 'showroom_visit', 'site_visit']
    },
    scheduledDate: Date,
    completedDate: Date,
    location: String,
    requirements: String,
    roomDetails: [{
      room: String,
      requirements: String
    }],
    attendees: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      role: String
    }],
    notes: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recordedByName: String,
    recordedAt: Date
  },

  // ============================================
  // CALL ACTIVITY SUMMARY
  // ============================================
  callSummary: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    successfulCalls: {
      type: Number,
      default: 0
    },
    lastCallDate: Date,
    lastCallOutcome: String,
    meetingsScheduled: {
      type: Number,
      default: 0
    },
    meetingsCompleted: {
      type: Number,
      default: 0
    }
  },

  // ============================================
  // RNR TRACKING
  // ============================================
  rnrTracking: {
    rnrCount: {
      type: Number,
      default: 0
    },
    lastRnrDate: Date,
    maxRnrReached: {
      type: Boolean,
      default: false
    },
    reactivatedFrom: {
      type: String,
      enum: ['rnr', 'future_prospect', 'lost'],
      default: null
    },
    reactivatedAt: Date,
    reactivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reactivatedByName: String
  },

  // ============================================
  // SALES ORDER REFERENCE
  // ============================================
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder'
  },

  // ============================================
  // LEGACY STATUS (for backward compatibility)
  // ============================================
  // Status & Pipeline (uses company's custom statuses)
  status: {
    type: String,
    default: 'new'
  },

  subStatus: {
    type: String // More granular status
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'collaborator', 'viewer'],
      default: 'collaborator'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Follow-up
  nextFollowUp: {
    date: Date,
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'site-visit', 'proposal']
    },
    notes: String
  },

  followUpDate: {
    type: Date // Legacy support
  },

  // Communication Log
  communications: [communicationSchema],

  // Notes
  notes: [{
    content: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedByName: String,
    addedAt: {
      type: Date,
      default: Date.now
    },
    isPinned: {
      type: Boolean,
      default: false
    }
  }],

  // Conversion
  isConverted: {
    type: Boolean,
    default: false
  },

  convertedAt: {
    type: Date
  },

  convertedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },

  convertedToProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  // Tags
  tags: [{
    type: String
  }],

  // Activity Timeline
  activities: [activitySchema],

  // Timestamps
  lastActivityAt: {
    type: Date,
    default: Date.now
  },

  lastContactedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Method to add activity
leadSchema.methods.addActivity = function(activity) {
  this.activities.push(activity)
  this.lastActivityAt = new Date()
  return this.save()
}

// Method to get activity timeline
leadSchema.methods.getTimeline = function() {
  return this.activities.sort((a, b) => b.createdAt - a.createdAt)
}

// ============================================
// CRM WORKFLOW METHODS
// ============================================

// Method: Assign to Department
leadSchema.methods.assignToDepartment = function(department, employeeId, employeeName, assignedBy, assignedByName) {
  const validDepartments = ['preSales', 'crm', 'sales']
  if (!validDepartments.includes(department)) {
    throw new Error(`Invalid department: ${department}`)
  }

  this.departmentAssignments[department] = {
    employee: employeeId,
    employeeName,
    assignedAt: new Date(),
    assignedBy,
    assignedByName,
    isActive: true,
    ...(department === 'sales' ? { isExclusive: false } : {})
  }

  this.activities.push({
    action: 'assigned',
    description: `Assigned to ${department} department: ${employeeName}`,
    performedBy: assignedBy,
    performedByName: assignedByName,
    newValue: { department, employee: employeeId, employeeName }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method: Assign to All 3 Departments
leadSchema.methods.assignToAllDepartments = function(assignments, assignedBy, assignedByName) {
  const { preSales, crm, sales } = assignments

  if (preSales) {
    this.departmentAssignments.preSales = {
      employee: preSales.employeeId,
      employeeName: preSales.employeeName,
      assignedAt: new Date(),
      assignedBy,
      assignedByName,
      isActive: true
    }
  }

  if (crm) {
    this.departmentAssignments.crm = {
      employee: crm.employeeId,
      employeeName: crm.employeeName,
      assignedAt: new Date(),
      assignedBy,
      assignedByName,
      isActive: true
    }
  }

  if (sales) {
    this.departmentAssignments.sales = {
      employee: sales.employeeId,
      employeeName: sales.employeeName,
      assignedAt: new Date(),
      assignedBy,
      assignedByName,
      isActive: true,
      isExclusive: false
    }
  }

  this.activities.push({
    action: 'assigned',
    description: 'Assigned to departments',
    performedBy: assignedBy,
    performedByName: assignedByName,
    newValue: { preSales, crm, sales }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method: Update Primary Status
leadSchema.methods.updatePrimaryStatus = async function(newStatus, userId, userName, remarks, entityCode = 'IP') {
  const validTransitions = {
    new: ['in_progress', 'qualified', 'lost', 'rnr', 'future_prospect'],
    in_progress: ['qualified', 'lost', 'rnr', 'future_prospect'],
    qualified: ['meeting_status', 'lost'],
    lost: ['in_progress', 'new', 'rnr', 'qualified', 'future_prospect'],
    rnr: ['in_progress', 'lost', 'qualified', 'future_prospect'],
    future_prospect: ['in_progress', 'qualified', 'lost', 'rnr'],
    meeting_status: ['cold', 'warm', 'hot', 'lost'],
    cold: ['warm', 'hot', 'lost', 'meeting_status'],
    warm: ['cold', 'hot', 'lost', 'meeting_status'],
    hot: ['cold', 'warm', 'won', 'lost', 'meeting_status'],
    won: [],
    // Legacy statuses — allow transitioning out
    contacted: ['in_progress', 'new', 'qualified', 'lost', 'rnr'],
    proposal: ['qualified', 'meeting_status', 'warm', 'lost'],
    negotiation: ['meeting_status', 'hot', 'lost', 'won'],
  }

  const currentStatus = this.primaryStatus
  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`)
  }

  const oldStatus = this.primaryStatus
  this.primaryStatus = newStatus
  this.status = newStatus // Keep legacy status in sync

  // Generate Qualified Lead ID if status changes to 'qualified'
  if (newStatus === 'qualified' && !this.qualifiedLeadId) {
    try {
      const city = this.location?.city || 'Hyderabad'
      this.qualifiedLeadId = await generateQualifiedLeadId({
        city,
        entityCode,
        companyId: this.company
      })

      // Lock pre-sales access after qualification
      this.preSalesLocked = true
      this.lockedAt = new Date()
      this.lockedBy = userId

      // Mark sales assignment as exclusive if exists
      if (this.departmentAssignments?.sales?.employee) {
        this.departmentAssignments.sales.isExclusive = true
      }
    } catch (err) {
      console.error('Failed to generate qualified lead ID:', err)
    }
  }

  this.activities.push({
    action: 'status_changed',
    description: `Primary status changed from ${oldStatus} to ${newStatus}${remarks ? ': ' + remarks : ''}${this.qualifiedLeadId && newStatus === 'qualified' ? `. Qualified ID: ${this.qualifiedLeadId}` : ''}`,
    performedBy: userId,
    performedByName: userName,
    oldValue: oldStatus,
    newValue: newStatus,
    metadata: { remarks, qualifiedLeadId: this.qualifiedLeadId }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method: Qualify Lead
leadSchema.methods.qualify = async function(userId, userName, notes, entityCode = 'IP') {
  // Set status to qualified
  this.primaryStatus = 'qualified'
  this.status = 'qualified'

  // Generate Qualified Lead ID if not already set
  if (!this.qualifiedLeadId) {
    try {
      const city = this.location?.city || 'Hyderabad' // Default to Hyderabad if no city
      this.qualifiedLeadId = await generateQualifiedLeadId({
        city,
        entityCode, // IP, EP, CP, RP, OP
        companyId: this.company
      })
    } catch (err) {
      console.error('Failed to generate qualified lead ID:', err)
      // Continue without failing the qualification
    }
  }

  // Default secondary status to 'warm' if not set
  if (!this.secondaryStatus) {
    this.secondaryStatus = 'warm'
  }

  // Lock pre-sales access after qualification
  this.preSalesLocked = true
  this.lockedAt = new Date()
  this.lockedBy = userId

  // Set date tracking
  if (!this.dateTracking) this.dateTracking = {}
  this.dateTracking.qualifiedDate = new Date()

  // Mark sales assignment as exclusive if exists
  if (this.departmentAssignments.sales.employee) {
    this.departmentAssignments.sales.isExclusive = true
  }

  this.activities.push({
    action: 'status_changed',
    description: notes || `Lead qualified by ${userName}. Pre-sales locked.${this.qualifiedLeadId ? ` Qualified ID: ${this.qualifiedLeadId}` : ''}`,
    performedBy: userId,
    performedByName: userName,
    newValue: {
      primaryStatus: 'qualified',
      status: 'qualified',
      preSalesLocked: true,
      qualifiedLeadId: this.qualifiedLeadId
    }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method: Schedule Meeting and Transfer to Sales
leadSchema.methods.scheduleMeetingAndTransfer = async function(meetingData, userId, userName) {
  const { date, time, salesPersonId, salesPersonName, designerId, designerName, meetingType, location, notes } = meetingData

  if (this.primaryStatus !== 'qualified') {
    throw new Error('Lead must be qualified before scheduling a meeting')
  }

  // Set meeting details
  this.scheduledMeeting = {
    date: new Date(date),
    time: time || '',
    salesPerson: salesPersonId,
    salesPersonName,
    designer: designerId || null,
    designerName: designerName || null,
    meetingType: meetingType || 'office',
    location: location || '',
    notes: notes || '',
    status: 'scheduled',
    scheduledBy: userId,
    scheduledByName: userName,
    scheduledAt: new Date()
  }

  // Move to meeting_status
  this.primaryStatus = 'meeting_status'
  this.status = 'meeting_status'

  // Set date tracking
  if (!this.dateTracking) this.dateTracking = {}
  this.dateTracking.firstSalesMeetingDate = new Date()

  // Assign sales person to sales department
  this.departmentAssignments.sales = {
    employee: salesPersonId,
    employeeName: salesPersonName,
    assignedAt: new Date(),
    assignedBy: userId,
    assignedByName: userName,
    isActive: true,
    isExclusive: true
  }

  // Lock pre-sales
  this.preSalesLocked = true
  this.lockedAt = new Date()
  this.lockedBy = userId

  // Update primary assignedTo
  this.assignedTo = salesPersonId

  // Add sales person and designer to team members
  const addTeamMember = (memberId, role) => {
    if (!memberId) return
    const exists = this.teamMembers?.some(tm => tm.user?.toString() === memberId.toString())
    if (!exists) {
      if (!this.teamMembers) this.teamMembers = []
      this.teamMembers.push({ user: memberId, role, assignedBy: userId })
    }
  }
  addTeamMember(salesPersonId, 'owner')
  if (designerId) addTeamMember(designerId, 'collaborator')

  // Downgrade pre-sales member to viewer
  const preSalesEmp = this.departmentAssignments.preSales?.employee
  if (preSalesEmp && this.teamMembers) {
    const preSalesMember = this.teamMembers.find(
      tm => tm.user?.toString() === preSalesEmp.toString()
    )
    if (preSalesMember) preSalesMember.role = 'viewer'
  }

  this.activities.push({
    action: 'meeting_scheduled',
    description: `Meeting scheduled for ${new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}${time ? ' at ' + time : ''}. Sales: ${salesPersonName}${designerName ? ', Designer: ' + designerName : ''}. Lead moved to Meeting Status.`,
    performedBy: userId,
    performedByName: userName,
    newValue: {
      primaryStatus: 'meeting_status',
      preSalesLocked: true
    }
  })

  this.lastActivityAt = new Date()
  this.callSummary.meetingsScheduled = (this.callSummary.meetingsScheduled || 0) + 1

  return this.save()
}

// Method: Mark as RNR (Ring No Response)
leadSchema.methods.markAsRNR = function(userId, userName) {
  const MAX_RNR_ATTEMPTS = 5

  this.rnrTracking.rnrCount += 1
  this.rnrTracking.lastRnrDate = new Date()

  if (this.rnrTracking.rnrCount >= MAX_RNR_ATTEMPTS) {
    // Auto-mark as Lost after max attempts
    this.primaryStatus = 'lost'
    this.status = 'lost'
    this.rnrTracking.maxRnrReached = true

    this.activities.push({
      action: 'status_changed',
      description: `Auto-marked as Lost after ${MAX_RNR_ATTEMPTS} RNR attempts`,
      performedBy: userId,
      performedByName: userName,
      metadata: { reason: 'max_rnr_attempts', rnrCount: this.rnrTracking.rnrCount }
    })
  } else {
    this.primaryStatus = 'rnr'
    this.status = 'rnr'

    // Schedule next follow-up after 7 days
    const RNR_COOLDOWN_DAYS = 7
    this.nextFollowUp = {
      date: new Date(Date.now() + RNR_COOLDOWN_DAYS * 24 * 60 * 60 * 1000),
      type: 'call',
      notes: `RNR attempt ${this.rnrTracking.rnrCount}. Auto-scheduled follow-up.`
    }

    this.activities.push({
      action: 'status_changed',
      description: `Marked as RNR (attempt ${this.rnrTracking.rnrCount})`,
      performedBy: userId,
      performedByName: userName,
      metadata: { rnrCount: this.rnrTracking.rnrCount }
    })
  }

  this.lastActivityAt = new Date()
  return this.save()
}

// Method: Mark as Future Prospect
leadSchema.methods.markAsFutureProspect = function(followUpDate, reason, userId, userName) {
  this.primaryStatus = 'future_prospect'
  this.status = 'future_prospect'

  const FUTURE_PROSPECT_DAYS = 30
  this.nextFollowUp = {
    date: followUpDate || new Date(Date.now() + FUTURE_PROSPECT_DAYS * 24 * 60 * 60 * 1000),
    type: 'call',
    notes: reason || 'Future prospect follow-up'
  }

  this.activities.push({
    action: 'status_changed',
    description: `Marked as Future Prospect. Reason: ${reason || 'Not specified'}`,
    performedBy: userId,
    performedByName: userName,
    metadata: { reason, followUpDate: this.nextFollowUp.date }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method: Mark as Lost
leadSchema.methods.markAsLost = function(reason, userId, userName) {
  this.primaryStatus = 'lost'
  this.status = 'lost'

  this.activities.push({
    action: 'status_changed',
    description: `Marked as Lost. Reason: ${reason || 'Not specified'}`,
    performedBy: userId,
    performedByName: userName,
    metadata: { reason }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method: Reactivate Lead
leadSchema.methods.reactivate = function(userId, userName) {
  const reactivatableStatuses = ['lost', 'rnr', 'future_prospect']
  if (!reactivatableStatuses.includes(this.primaryStatus)) {
    throw new Error(`Cannot reactivate lead with status: ${this.primaryStatus}`)
  }

  const fromStatus = this.primaryStatus

  this.rnrTracking.reactivatedFrom = fromStatus
  this.rnrTracking.reactivatedAt = new Date()
  this.rnrTracking.reactivatedBy = userId
  this.rnrTracking.reactivatedByName = userName

  // Reset RNR count if reactivating from RNR
  if (fromStatus === 'rnr') {
    this.rnrTracking.rnrCount = 0
    this.rnrTracking.maxRnrReached = false
  }

  this.primaryStatus = 'in_progress'
  this.status = 'in_progress'

  this.activities.push({
    action: 'status_changed',
    description: `Lead reactivated from ${fromStatus}`,
    performedBy: userId,
    performedByName: userName,
    oldValue: fromStatus,
    newValue: 'in_progress'
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method: Update Call Summary
leadSchema.methods.updateCallSummary = function(callData) {
  this.callSummary.totalAttempts += 1
  this.callSummary.lastCallDate = new Date()
  this.callSummary.lastCallOutcome = callData.outcome

  if (callData.status === 'completed') {
    this.callSummary.successfulCalls += 1
  }

  if (callData.meetingScheduled) {
    this.callSummary.meetingsScheduled += 1
  }

  if (callData.meetingCompleted) {
    this.callSummary.meetingsCompleted += 1
  }

  this.lastContactedAt = new Date()
  return this.save()
}

// Method: Set Disposition
leadSchema.methods.setDisposition = async function(dispositionData, userId, userName, entityCode = 'IP') {
  const { category, group, subDisposition, groupLabel, subDispositionLabel, remarks, primaryStatusMapping } = dispositionData

  // Set current disposition
  this.disposition = {
    category,
    group,
    subDisposition,
    groupLabel,
    subDispositionLabel,
    remarks: remarks || '',
    setAt: new Date(),
    setBy: userId,
    setByName: userName
  }

  // Push to disposition history
  const callAttemptNumber = this.callSummary?.totalAttempts || 0
  this.dispositionHistory.push({
    category,
    group,
    subDisposition,
    groupLabel,
    subDispositionLabel,
    remarks: remarks || '',
    callAttemptNumber,
    setAt: new Date(),
    setBy: userId,
    setByName: userName
  })

  // Auto-update primaryStatus if mapping exists
  if (primaryStatusMapping && this.primaryStatus !== primaryStatusMapping) {
    const oldStatus = this.primaryStatus
    this.primaryStatus = primaryStatusMapping
    this.status = primaryStatusMapping

    // Generate Qualified Lead ID if status changes to 'qualified'
    if (primaryStatusMapping === 'qualified' && !this.qualifiedLeadId) {
      try {
        const city = this.location?.city || 'Hyderabad'
        this.qualifiedLeadId = await generateQualifiedLeadId({
          city,
          entityCode,
          companyId: this.company
        })

        // Lock pre-sales access after qualification
        this.preSalesLocked = true
        this.lockedAt = new Date()
        this.lockedBy = userId

        // Mark sales assignment as exclusive if exists
        if (this.departmentAssignments?.sales?.employee) {
          this.departmentAssignments.sales.isExclusive = true
        }
      } catch (err) {
        console.error('Failed to generate qualified lead ID:', err)
      }
    }

    this.activities.push({
      action: 'status_changed',
      description: `Status auto-changed from ${oldStatus} to ${primaryStatusMapping} via disposition: ${groupLabel} > ${subDispositionLabel}${this.qualifiedLeadId ? `. Qualified ID: ${this.qualifiedLeadId}` : ''}`,
      performedBy: userId,
      performedByName: userName,
      oldValue: oldStatus,
      newValue: primaryStatusMapping,
      metadata: { triggeredByDisposition: true, qualifiedLeadId: this.qualifiedLeadId }
    })
  }

  // Log disposition_changed activity
  this.activities.push({
    action: 'disposition_changed',
    description: `Disposition set to: ${groupLabel} > ${subDispositionLabel}${remarks ? ' — ' + remarks : ''}`,
    performedBy: userId,
    performedByName: userName,
    newValue: { category, group, subDisposition, groupLabel, subDispositionLabel },
    metadata: {
      category,
      group,
      subDisposition,
      remarks,
      callAttemptNumber
    }
  })

  this.lastActivityAt = new Date()
  return this.save()
}

// Method: Check if user can edit (Pre-Sales lock check)
leadSchema.methods.canUserEdit = function(userId, userDepartment) {
  // If Pre-Sales is locked, only Sales can edit
  if (this.preSalesLocked) {
    if (userDepartment === 'pre_sales' || userDepartment === 'crm') {
      return {
        canEdit: false,
        reason: 'Lead is locked. Only Sales can edit after qualification.'
      }
    }
  }

  // If Sales is exclusive, only the assigned sales person can edit
  if (this.departmentAssignments.sales.isExclusive) {
    const salesEmployee = this.departmentAssignments.sales.employee
    if (salesEmployee && !salesEmployee.equals(userId) && userDepartment === 'sales') {
      return {
        canEdit: false,
        reason: 'Lead is exclusively assigned to another sales person.'
      }
    }
  }

  return { canEdit: true }
}

// Method to convert to customer
leadSchema.methods.convertToCustomer = async function(userId, userName) {
  // Only hot leads can be converted to customer
  if (this.primaryStatus !== 'hot') {
    throw new Error('Lead must be in "Hot" status to convert to customer. Current status: ' + this.primaryStatus)
  }

  const Customer = mongoose.model('Customer')
  const Company = mongoose.model('Company')

  // Get company for ID generation
  const company = await Company.findById(this.company)
  if (!company) throw new Error('Company not found')

  // Generate customer ID
  const customerId = await company.generateId('customer')

  // Create customer from lead data
  const customer = new Customer({
    customerId,
    company: this.company,
    type: 'individual',
    name: this.name,
    email: this.email,
    phone: this.phone,
    alternatePhone: this.alternatePhone,
    addresses: this.location?.city ? [{
      type: 'site',
      city: this.location.city,
      state: this.location.state,
      pincode: this.location.pincode,
      street: this.location.address
    }] : [],
    accountManager: this.assignedTo,
    originalLead: this._id,
    convertedAt: new Date(),
    convertedBy: userId,
    websiteSource: this.websiteSource,
    tags: this.tags
  })

  await customer.save()

  // Update lead
  this.isConverted = true
  this.convertedAt = new Date()
  this.convertedBy = userId
  this.customer = customer._id
  this.primaryStatus = 'won'
  this.status = 'won'

  // Add conversion activity
  this.activities.push({
    action: 'converted',
    description: `Lead converted to customer by ${userName}`,
    performedBy: userId,
    performedByName: userName,
    newValue: customer._id
  })

  await this.save()

  return customer
}

// Pre-save: auto-set dateTracking.leadGeneratedDate
leadSchema.pre('save', function(next) {
  if (this.isNew) {
    if (!this.dateTracking) this.dateTracking = {}
    this.dateTracking.leadGeneratedDate = this.createdAt || new Date()
  }
  next()
})

// Indexes for performance (leadId already indexed via unique: true)
leadSchema.index({ company: 1, status: 1 })
leadSchema.index({ company: 1, assignedTo: 1 })
leadSchema.index({ company: 1, createdAt: -1 })
leadSchema.index({ company: 1, 'nextFollowUp.date': 1 })
leadSchema.index({ company: 1, priority: 1 })
leadSchema.index({ company: 1, source: 1 })
leadSchema.index({ company: 1, isConverted: 1 })
leadSchema.index({ phone: 1 })
leadSchema.index({ email: 1 })

// CRM Workflow Indexes
leadSchema.index({ company: 1, primaryStatus: 1 })
leadSchema.index({ company: 1, secondaryStatus: 1 })
leadSchema.index({ company: 1, 'departmentAssignments.preSales.employee': 1 })
leadSchema.index({ company: 1, 'departmentAssignments.crm.employee': 1 })
leadSchema.index({ company: 1, 'departmentAssignments.sales.employee': 1 })
leadSchema.index({ company: 1, preSalesLocked: 1 })
leadSchema.index({ company: 1, 'location.city': 1, primaryStatus: 1 })

// Disposition Indexes
leadSchema.index({ company: 1, 'disposition.group': 1 })
leadSchema.index({ company: 1, 'disposition.category': 1, 'disposition.group': 1 })

export default mongoose.model('Lead', leadSchema)
