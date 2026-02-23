import mongoose from 'mongoose'

const performanceMetricSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Subject (who/what this metric is about)
  subjectType: {
    type: String,
    enum: ['user', 'team', 'company', 'vertical'],
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'subjectType'
  },
  subjectName: String,

  // Time Period
  period: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      required: true
    },
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    },
    label: String           // "Dec 2024", "Week 52", "Q4 2024"
  },

  // Lead Metrics
  leads: {
    total: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    contacted: { type: Number, default: 0 },
    qualified: { type: Number, default: 0 },
    proposalSent: { type: Number, default: 0 },
    negotiation: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },  // in minutes
    avgDealCycleTime: { type: Number, default: 0 }, // in days
    bySource: [{
      source: String,
      count: Number,
      converted: Number
    }],
    byVertical: [{
      vertical: String,
      count: Number,
      converted: Number,
      value: Number
    }]
  },

  // Customer Metrics
  customers: {
    total: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    churned: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 },
    avgProjectValue: { type: Number, default: 0 },
    satisfaction: { type: Number, default: 0 }  // CSAT score (1-5)
  },

  // Project Metrics
  projects: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    onTrack: { type: Number, default: 0 },
    delayed: { type: Number, default: 0 },
    avgCompletionTime: { type: Number, default: 0 }, // in days
    totalValue: { type: Number, default: 0 },
    collectedValue: { type: Number, default: 0 },
    pendingValue: { type: Number, default: 0 }
  },

  // Financial Metrics
  revenue: {
    pipeline: { type: Number, default: 0 },
    booked: { type: Number, default: 0 },
    collected: { type: Number, default: 0 },
    target: { type: Number, default: 0 },
    achievement: { type: Number, default: 0 }  // percentage
  },

  // Activity Metrics
  activities: {
    calls: { type: Number, default: 0 },
    emails: { type: Number, default: 0 },
    meetings: { type: Number, default: 0 },
    siteVisits: { type: Number, default: 0 },
    proposals: { type: Number, default: 0 },
    followUps: { type: Number, default: 0 }
  },

  // Calculated Scores (0-100)
  scores: {
    overall: { type: Number, default: 0 },
    efficiency: { type: Number, default: 0 },
    productivity: { type: Number, default: 0 },
    quality: { type: Number, default: 0 }
  },

  // Trends (comparison with previous period, in percentage)
  trends: {
    leadsChange: { type: Number, default: 0 },
    conversionChange: { type: Number, default: 0 },
    revenueChange: { type: Number, default: 0 },
    projectsChange: { type: Number, default: 0 },
    activityChange: { type: Number, default: 0 }
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
performanceMetricSchema.index({ company: 1, 'period.start': -1 })
performanceMetricSchema.index({ subjectType: 1, subjectId: 1, 'period.start': -1 })
performanceMetricSchema.index({ 'period.type': 1, 'period.start': -1 })
performanceMetricSchema.index({ company: 1, subjectType: 1, 'period.start': -1 })

// Static method to calculate metrics for a period
performanceMetricSchema.statics.calculateForUser = async function(userId, periodStart, periodEnd) {
  const Lead = mongoose.model('Lead')
  const Customer = mongoose.model('Customer')
  const Project = mongoose.model('Project')

  const [leadStats, customerStats, projectStats] = await Promise.all([
    Lead.aggregate([
      {
        $match: {
          assignedTo: userId,
          createdAt: { $gte: periodStart, $lte: periodEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          contacted: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
          qualified: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
          proposalSent: { $sum: { $cond: [{ $eq: ['$status', 'proposal-sent'] }, 1, 0] } },
          negotiation: { $sum: { $cond: [{ $eq: ['$status', 'negotiation'] }, 1, 0] } },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } }
        }
      }
    ]),
    Customer.aggregate([
      {
        $match: {
          accountManager: userId,
          createdAt: { $gte: periodStart, $lte: periodEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: { $sum: 1 }
        }
      }
    ]),
    Project.aggregate([
      {
        $match: {
          $or: [
            { projectManager: userId },
            { 'teamMembers.user': userId }
          ],
          createdAt: { $gte: periodStart, $lte: periodEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ])
  ])

  const leads = leadStats[0] || { total: 0, new: 0, contacted: 0, qualified: 0, proposalSent: 0, negotiation: 0, won: 0, lost: 0 }
  const customers = customerStats[0] || { total: 0, new: 0 }
  const projects = projectStats[0] || { total: 0, active: 0, completed: 0 }

  leads.conversionRate = leads.total > 0 ? Math.round((leads.won / leads.total) * 100 * 10) / 10 : 0

  return { leads, customers, projects }
}

// Static method to get period label
performanceMetricSchema.statics.getPeriodLabel = function(type, date) {
  const d = new Date(date)
  switch (type) {
    case 'daily':
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    case 'weekly':
      const weekNum = Math.ceil(d.getDate() / 7)
      return `Week ${weekNum}, ${d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
    case 'monthly':
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    case 'quarterly':
      const quarter = Math.ceil((d.getMonth() + 1) / 3)
      return `Q${quarter} ${d.getFullYear()}`
    default:
      return d.toISOString()
  }
}

const PerformanceMetric = mongoose.model('PerformanceMetric', performanceMetricSchema)

export default PerformanceMetric
