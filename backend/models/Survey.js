import mongoose from 'mongoose'

/**
 * Survey - CSAT/NPS survey management
 *
 * Supports multiple survey types (CSAT, NPS, custom) with configurable
 * questions, trigger conditions, and response tracking with analytics.
 */

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  questionType: {
    type: String,
    enum: ['rating', 'text', 'multiple_choice', 'nps_scale'],
    required: true
  },
  options: [{
    type: String
  }],
  required: {
    type: Boolean,
    default: true
  }
}, { _id: true })

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { _id: false })

const responseSchema = new mongoose.Schema({
  respondent: {
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  answers: [answerSchema],
  npsScore: {
    type: Number,
    min: 0,
    max: 10
  },
  csatScore: {
    type: Number,
    min: 1,
    max: 5
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true })

const surveySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  surveyId: {
    type: String,
    unique: true
  },

  surveyType: {
    type: String,
    enum: ['csat', 'nps', 'custom'],
    required: true
  },

  title: {
    type: String,
    required: true
  },

  questions: [questionSchema],

  isActive: {
    type: Boolean,
    default: true
  },

  trigger: {
    type: String,
    enum: ['project_completion', 'ticket_resolved', 'milestone_reached', 'manual'],
    default: 'manual'
  },

  responses: [responseSchema],

  averageNPS: {
    type: Number,
    default: 0
  },

  averageCSAT: {
    type: Number,
    default: 0
  },

  responseCount: {
    type: Number,
    default: 0
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
surveySchema.index({ company: 1, surveyType: 1 })
surveySchema.index({ company: 1, isActive: 1 })
surveySchema.index({ company: 1, trigger: 1 })
surveySchema.index({ 'responses.customer': 1 })
surveySchema.index({ 'responses.project': 1 })
surveySchema.index({ 'responses.submittedAt': -1 })

// Generate surveyId before save
surveySchema.pre('save', async function(next) {
  if (this.isNew && !this.surveyId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    this.surveyId = `SRV-${String(count + 1).padStart(4, '0')}`
  }

  // Recalculate averages and response count
  if (this.responses && this.responses.length > 0) {
    this.responseCount = this.responses.length

    // Calculate average NPS
    const npsResponses = this.responses.filter(r => r.npsScore != null)
    if (npsResponses.length > 0) {
      const promoters = npsResponses.filter(r => r.npsScore >= 9).length
      const detractors = npsResponses.filter(r => r.npsScore <= 6).length
      this.averageNPS = Math.round(((promoters - detractors) / npsResponses.length) * 100)
    }

    // Calculate average CSAT
    const csatResponses = this.responses.filter(r => r.csatScore != null)
    if (csatResponses.length > 0) {
      const totalCSAT = csatResponses.reduce((sum, r) => sum + r.csatScore, 0)
      this.averageCSAT = Math.round((totalCSAT / csatResponses.length) * 100) / 100
    }
  }

  next()
})

const Survey = mongoose.model('Survey', surveySchema)

export default Survey
