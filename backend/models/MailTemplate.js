import mongoose from 'mongoose'

const mailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    unique: true,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true
  },
  body: {
    type: String,
    required: [true, 'Email body is required']
  },
  category: {
    type: String,
    enum: ['lead', 'welcome', 'follow-up', 'proposal', 'notification', 'marketing', 'other'],
    default: 'other'
  },
  variables: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Extract variables from body before saving
mailTemplateSchema.pre('save', function(next) {
  const variableRegex = /\{\{(\w+)\}\}/g
  const matches = this.body.match(variableRegex) || []
  const subjectMatches = this.subject.match(variableRegex) || []

  const allMatches = [...new Set([...matches, ...subjectMatches])]
  this.variables = allMatches.map(match => match.replace(/\{\{|\}\}/g, ''))

  next()
})

export default mongoose.model('MailTemplate', mailTemplateSchema)
