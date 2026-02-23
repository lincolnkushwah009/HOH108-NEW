import mongoose from 'mongoose'

// Daily log sub-schema (AOD vs EOD)
const dailyLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  designer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  designerName: String,
  aod: String,
  eod: String,
  remarks: String
}, { _id: true })

// Comment sub-schema
const commentSchema = new mongoose.Schema({
  text: String,
  commentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  commentByName: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: true })

// Activity log sub-schema
const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
})

const designP2PTrackerSchema = new mongoose.Schema({
  // Auto-generated Tracker ID (e.g., IP-P2PT-2024-00001)
  trackerId: {
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

  // === CX Details (from P2P TAT Tracker) ===
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  property: String,
  bookingDate: Date,
  showroom: String,
  expectedMovPossession: Date,

  // === Team Details ===
  salesPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  salesPersonName: String,
  designer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  designerName: String,

  // === Order Value ===
  obvInLacs: { type: Number, default: 0 },
  fqvInLacs: { type: Number, default: 0 },
  upsellValue: { type: Number, default: 0 },
  orderBooked: { type: Boolean, default: false },
  p2pValue: { type: Number, default: 0 },
  descopeReasons: String,

  // === Stage 1 - Booking ===
  tenPercentPayment: Date,
  tenPercentAmount: { type: Number, default: 0 },
  quoteRequirementsReceived: Date,

  // === Stage 2 - Measurement ===
  mmtBooked: Date,
  skpShellReceived: Date,

  // === Stage 3 - Design ===
  designDiscussion: Date,
  designDiscussionNotes: String,
  colourSelection: Date,
  designFinalized: Date,

  // === Stage 4 - Validation & P2P Drawings ===
  validationDwgStarted: Date,
  validationDwgCompleted: Date,
  siteValidation: Date,
  p2pDwgStarted: Date,
  p2pDwgCompleted: Date,

  // === Stage 5 - QC ===
  qcStarted: Date,
  qcCompleted: Date,
  qcInputs: String,
  qcDwgsReady: Date,
  qcDate: Date,
  sodApproval: Date,
  sodDate: Date,

  // === Stage 6 - Completion ===
  sixtyPercentPayment: Date,
  p2pDate: Date,
  dispatchDate: Date,
  handoverDate: Date,
  gfcDate: Date,
  tat: { type: Number, default: 0 }, // in days

  // === Pre-Closure Tracking (from Pre Closure CX Tracker) ===
  preClosure: {
    meetingDate: Date,
    detailsReceivedDate: Date,
    propertyDetails: String,
    designCompleted: Date,
    quoteCompleted: Date,
    quoteValue: { type: Number, default: 0 },
    p1: Date,
    p2: Date,
    p3: Date,
    p4: Date,
    p5: Date,
    cxStatus: String,
    remarks: String
  },

  // === CX Status (from Stat Master CX STATUS) ===
  status: {
    type: String,
    enum: [
      'new', 'in_progress', 'on_hold', 'delayed', 'at_risk',
      'on_track', 'completed', 'cancelled', 'descoped'
    ],
    default: 'new'
  },
  designDependency: String,
  wipStatus: String,

  // === 60% and P2P Readiness (from Stat Master 60% and P2P Cx) ===
  readiness: {
    mmtStatus: { type: String, enum: ['pending', 'in_progress', 'completed', 'na'], default: 'pending' },
    designStatus: { type: String, enum: ['pending', 'in_progress', 'completed', 'na'], default: 'pending' },
    validationStatus: { type: String, enum: ['pending', 'in_progress', 'completed', 'na'], default: 'pending' },
    paymentStatus: { type: String, enum: ['pending', 'partial', 'completed', 'na'], default: 'pending' },
    qcStatus: { type: String, enum: ['pending', 'in_progress', 'completed', 'na'], default: 'pending' },
    sodStatus: { type: String, enum: ['pending', 'in_progress', 'completed', 'na'], default: 'pending' }
  },

  // === P2P Projection vs Actual (from PvA & monthly tabs) ===
  projection: {
    obv: { type: Number, default: 0 },
    fqv: { type: Number, default: 0 },
    uv: { type: Number, default: 0 },
    p2pDate: Date,
    validation: Date,
    qc: Date,
    projectHandover: Date
  },
  actual: {
    obv: { type: Number, default: 0 },
    fqv: { type: Number, default: 0 },
    uv: { type: Number, default: 0 },
    p2pDate: Date
  },

  // === 10% Tracking (from 10% tabs) ===
  tenPercentTracking: {
    designed: { type: Boolean, default: false },
    meetingsTaken: { type: Number, default: 0 },
    projectsClosed: { type: Number, default: 0 },
    wipList: String
  },

  // === AOD vs EOD (daily logs) ===
  dailyLogs: [dailyLogSchema],

  // === Comments ===
  latestUpdates: String,
  comments: [commentSchema],

  // === Current Stage (auto-calculated 1-6) ===
  currentStage: {
    type: Number,
    min: 1,
    max: 6,
    default: 1
  },

  // === Activity Log ===
  activities: [activitySchema],

  // === Audit ===
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdByName: String
}, {
  timestamps: true
})

// Pre-save: Generate Tracker ID
designP2PTrackerSchema.pre('save', async function(next) {
  if (!this.trackerId && this.company) {
    try {
      const Company = mongoose.model('Company')
      const company = await Company.findById(this.company)
      if (company) {
        if (!company.sequences) company.sequences = {}
        if (!company.sequences.designP2PTracker) {
          company.sequences.designP2PTracker = 0
        }
        company.sequences.designP2PTracker += 1
        await company.save()

        const year = new Date().getFullYear()
        const paddedSeq = String(company.sequences.designP2PTracker).padStart(5, '0')
        this.trackerId = `${company.code}-P2PT-${year}-${paddedSeq}`
      }
    } catch (err) {
      console.error('Error generating P2P tracker ID:', err)
    }
  }

  // Auto-calculate current stage
  this.currentStage = this.calculateStage()

  // Auto-calculate TAT
  if (this.bookingDate && this.p2pDate) {
    const diffTime = Math.abs(this.p2pDate - this.bookingDate)
    this.tat = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  next()
})

// Method: Calculate current stage based on filled dates
designP2PTrackerSchema.methods.calculateStage = function() {
  if (this.sixtyPercentPayment || this.p2pDate || this.handoverDate || this.gfcDate) return 6
  if (this.qcStarted || this.qcCompleted || this.sodApproval) return 5
  if (this.validationDwgStarted || this.p2pDwgStarted || this.p2pDwgCompleted) return 4
  if (this.designDiscussion || this.colourSelection || this.designFinalized) return 3
  if (this.mmtBooked || this.skpShellReceived) return 2
  return 1
}

// Static: Get dashboard summary
designP2PTrackerSchema.statics.getDashboardSummary = async function(companyId) {
  const [stageCounts, avgTat, statusCounts] = await Promise.all([
    this.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: '$currentStage', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    this.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(companyId), tat: { $gt: 0 } } },
      { $group: { _id: null, avgTat: { $avg: '$tat' } } }
    ]),
    this.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ])

  const stageMap = {}
  stageCounts.forEach(s => { stageMap[`stage${s._id}`] = s.count })

  const statusMap = {}
  statusCounts.forEach(s => { statusMap[s._id] = s.count })

  return {
    stages: {
      stage1: stageMap.stage1 || 0,
      stage2: stageMap.stage2 || 0,
      stage3: stageMap.stage3 || 0,
      stage4: stageMap.stage4 || 0,
      stage5: stageMap.stage5 || 0,
      stage6: stageMap.stage6 || 0
    },
    avgTat: avgTat[0]?.avgTat ? Math.round(avgTat[0].avgTat) : 0,
    statuses: statusMap,
    total: Object.values(stageMap).reduce((sum, v) => sum + v, 0)
  }
}

// Indexes
designP2PTrackerSchema.index({ company: 1, project: 1 })
designP2PTrackerSchema.index({ company: 1, designer: 1 })
designP2PTrackerSchema.index({ company: 1, status: 1 })
designP2PTrackerSchema.index({ company: 1, currentStage: 1 })
designP2PTrackerSchema.index({ company: 1, showroom: 1 })

export default mongoose.model('DesignP2PTracker', designP2PTrackerSchema)
