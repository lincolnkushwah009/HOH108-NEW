import express from 'express'
import mongoose from 'mongoose'
import { protect, setCompanyContext, requirePermission, PERMISSIONS } from '../middleware/rbac.js'
import Lead from '../models/Lead.js'
import Customer from '../models/Customer.js'
import Project from '../models/Project.js'
import User from '../models/User.js'
import PerformanceMetric from '../models/PerformanceMetric.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get lead funnel analysis
 * @route   GET /api/performance/leads/funnel
 * @access  Private
 */
router.get('/leads/funnel', requirePermission(PERMISSIONS.PERFORMANCE_VIEW), async (req, res) => {
  try {
    const {
      company,
      vertical,
      source,
      assignee,
      period = '30d'
    } = req.query

    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Build match query
    const match = {
      createdAt: { $gte: startDate }
    }

    // Company filter
    if (company) {
      match.company = new mongoose.Types.ObjectId(company)
    } else if (req.user.role !== 'super_admin') {
      match.company = req.activeCompany?._id || req.user.company._id
    }

    if (vertical) {
      match.service = vertical
    }

    if (source) {
      match.source = source
    }

    if (assignee) {
      match.assignedTo = new mongoose.Types.ObjectId(assignee)
    }

    // Get funnel stages
    const funnelData = await Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const funnel = {
      new: 0,
      contacted: 0,
      qualified: 0,
      'proposal-sent': 0,
      negotiation: 0,
      won: 0,
      lost: 0
    }

    funnelData.forEach(item => {
      if (funnel.hasOwnProperty(item._id)) {
        funnel[item._id] = item.count
      }
    })

    const total = Object.values(funnel).reduce((a, b) => a + b, 0) - funnel.lost

    // Calculate conversion rates between stages
    const conversionRates = {
      newToContacted: funnel.new > 0 ? Math.round((funnel.contacted / funnel.new) * 100) : 0,
      contactedToQualified: funnel.contacted > 0 ? Math.round((funnel.qualified / funnel.contacted) * 100) : 0,
      qualifiedToProposal: funnel.qualified > 0 ? Math.round((funnel['proposal-sent'] / funnel.qualified) * 100) : 0,
      proposalToNegotiation: funnel['proposal-sent'] > 0 ? Math.round((funnel.negotiation / funnel['proposal-sent']) * 100) : 0,
      negotiationToWon: funnel.negotiation > 0 ? Math.round((funnel.won / funnel.negotiation) * 100) : 0,
      overall: total > 0 ? Math.round((funnel.won / total) * 100 * 10) / 10 : 0
    }

    // Get breakdown by vertical
    const byVertical = await Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: { service: '$service', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ])

    const verticalBreakdown = {}
    byVertical.forEach(item => {
      const vertical = item._id.service || 'unknown'
      if (!verticalBreakdown[vertical]) {
        verticalBreakdown[vertical] = { total: 0, won: 0, lost: 0 }
      }
      verticalBreakdown[vertical].total += item.count
      if (item._id.status === 'won') {
        verticalBreakdown[vertical].won += item.count
      }
      if (item._id.status === 'lost') {
        verticalBreakdown[vertical].lost += item.count
      }
    })

    // Calculate conversion rate per vertical
    Object.keys(verticalBreakdown).forEach(v => {
      const data = verticalBreakdown[v]
      data.conversionRate = data.total > 0
        ? Math.round((data.won / data.total) * 100 * 10) / 10
        : 0
    })

    // Get breakdown by source
    const bySource = await Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: { source: '$source', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ])

    const sourceBreakdown = {}
    bySource.forEach(item => {
      const source = item._id.source || 'unknown'
      if (!sourceBreakdown[source]) {
        sourceBreakdown[source] = { total: 0, won: 0 }
      }
      sourceBreakdown[source].total += item.count
      if (item._id.status === 'won') {
        sourceBreakdown[source].won += item.count
      }
    })

    Object.keys(sourceBreakdown).forEach(s => {
      const data = sourceBreakdown[s]
      data.conversionRate = data.total > 0
        ? Math.round((data.won / data.total) * 100 * 10) / 10
        : 0
    })

    res.json({
      success: true,
      data: {
        funnel,
        total,
        conversionRates,
        byVertical: verticalBreakdown,
        bySource: sourceBreakdown,
        period: periodDays
      }
    })
  } catch (error) {
    console.error('Lead funnel error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get lead aging analysis
 * @route   GET /api/performance/leads/aging
 * @access  Private
 */
router.get('/leads/aging', requirePermission(PERMISSIONS.PERFORMANCE_VIEW), async (req, res) => {
  try {
    const { company } = req.query
    const now = new Date()

    const match = {
      status: { $nin: ['won', 'lost'] }
    }

    if (company) {
      match.company = new mongoose.Types.ObjectId(company)
    } else if (req.user.role !== 'super_admin') {
      match.company = req.activeCompany?._id || req.user.company._id
    }

    const agingData = await Lead.aggregate([
      { $match: match },
      {
        $project: {
          name: 1,
          status: 1,
          assignedTo: 1,
          service: 1,
          createdAt: 1,
          ageDays: {
            $divide: [
              { $subtract: [now, '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $addFields: {
          ageBucket: {
            $switch: {
              branches: [
                { case: { $lt: ['$ageDays', 7] }, then: '0-7 days' },
                { case: { $lt: ['$ageDays', 14] }, then: '7-14 days' },
                { case: { $lt: ['$ageDays', 30] }, then: '14-30 days' },
                { case: { $lt: ['$ageDays', 60] }, then: '30-60 days' }
              ],
              default: '60+ days'
            }
          }
        }
      },
      {
        $group: {
          _id: '$ageBucket',
          count: { $sum: 1 },
          avgAge: { $avg: '$ageDays' },
          leads: {
            $push: {
              id: '$_id',
              name: '$name',
              status: '$status',
              service: '$service',
              ageDays: { $round: ['$ageDays', 0] }
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Get stale leads (older than 14 days without activity)
    const staleLeads = await Lead.find({
      ...match,
      updatedAt: { $lt: new Date(now - 14 * 24 * 60 * 60 * 1000) }
    })
      .select('name status service phone assignedTo createdAt updatedAt')
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: 1 })
      .limit(20)

    // Summary
    const summary = {
      total: agingData.reduce((acc, item) => acc + item.count, 0),
      avgAge: 0,
      staleCount: staleLeads.length
    }

    if (summary.total > 0) {
      const totalAge = agingData.reduce((acc, item) => acc + (item.avgAge * item.count), 0)
      summary.avgAge = Math.round(totalAge / summary.total)
    }

    res.json({
      success: true,
      data: {
        buckets: agingData.map(item => ({
          bucket: item._id,
          count: item.count,
          avgAge: Math.round(item.avgAge),
          leads: item.leads.slice(0, 5) // Limit leads per bucket
        })),
        staleLeads,
        summary
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get lead conversion rates
 * @route   GET /api/performance/leads/conversion
 * @access  Private
 */
router.get('/leads/conversion', requirePermission(PERMISSIONS.PERFORMANCE_VIEW), async (req, res) => {
  try {
    const { company, groupBy = 'user', period = '30d' } = req.query
    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const match = {
      createdAt: { $gte: startDate }
    }

    if (company) {
      match.company = new mongoose.Types.ObjectId(company)
    } else if (req.user.role !== 'super_admin') {
      match.company = req.activeCompany?._id || req.user.company._id
    }

    let groupField
    let lookupConfig

    switch (groupBy) {
      case 'vertical':
        groupField = '$service'
        break
      case 'source':
        groupField = '$source'
        break
      case 'user':
      default:
        groupField = '$assignedTo'
        lookupConfig = {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: groupField,
          total: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
          inProgress: {
            $sum: {
              $cond: [
                { $in: ['$status', ['new', 'contacted', 'qualified', 'proposal-sent', 'negotiation']] },
                1, 0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          total: 1,
          won: 1,
          lost: 1,
          inProgress: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$total', 0] },
              { $multiply: [{ $divide: ['$won', '$total'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { conversionRate: -1 } }
    ]

    if (lookupConfig) {
      pipeline.push(
        { $lookup: lookupConfig },
        { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ['$userInfo.name', 'Unassigned'] },
            email: '$userInfo.email',
            total: 1,
            won: 1,
            lost: 1,
            inProgress: 1,
            conversionRate: { $round: ['$conversionRate', 1] }
          }
        }
      )
    } else {
      pipeline.push({
        $project: {
          name: { $ifNull: ['$_id', 'Unknown'] },
          total: 1,
          won: 1,
          lost: 1,
          inProgress: 1,
          conversionRate: { $round: ['$conversionRate', 1] }
        }
      })
    }

    const data = await Lead.aggregate(pipeline)

    res.json({
      success: true,
      data: {
        groupBy,
        items: data,
        period: periodDays
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get user performance metrics
 * @route   GET /api/performance/user/:userId
 * @access  Private
 */
router.get('/user/:userId', requirePermission(PERMISSIONS.PERFORMANCE_VIEW), async (req, res) => {
  try {
    const { userId } = req.params
    const { period = '30d' } = req.query
    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check access
    if (req.user.role !== 'super_admin' &&
        req.user.role !== 'company_admin' &&
        !req.user.hasPermission(PERMISSIONS.PERFORMANCE_VIEW_ALL) &&
        userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user\'s performance'
      })
    }

    // Get lead stats
    const [leadStats, customerStats, projectStats, activityStats] = await Promise.all([
      Lead.aggregate([
        { $match: { assignedTo: user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
            won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
            lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
            thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] } },
            wonThisMonth: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$status', 'won'] }, { $gte: ['$updatedAt', startDate] }] },
                  1, 0
                ]
              }
            }
          }
        }
      ]),
      Customer.aggregate([
        { $match: { accountManager: user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 }
          }
        }
      ]),
      Project.aggregate([
        {
          $match: {
            $or: [
              { projectManager: user._id },
              { 'teamMembers.user': user._id }
            ]
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
      ]),
      Lead.aggregate([
        {
          $match: {
            assignedTo: user._id,
            'activities.performedAt': { $gte: startDate }
          }
        },
        { $unwind: '$activities' },
        { $match: { 'activities.performedAt': { $gte: startDate } } },
        {
          $group: {
            _id: '$activities.action',
            count: { $sum: 1 }
          }
        }
      ])
    ])

    const leads = leadStats[0] || { total: 0, new: 0, won: 0, lost: 0, thisMonth: 0, wonThisMonth: 0 }
    const customers = customerStats[0] || { total: 0 }
    const projects = projectStats[0] || { total: 0, active: 0, completed: 0 }

    // Calculate scores
    const conversionRate = leads.total > 0 ? Math.round((leads.won / leads.total) * 100 * 10) / 10 : 0
    const efficiency = Math.min(100, Math.round((leads.won / Math.max(leads.thisMonth, 1)) * 100))

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        },
        metrics: {
          leads: {
            total: leads.total,
            new: leads.new,
            won: leads.won,
            lost: leads.lost,
            thisMonth: leads.thisMonth,
            wonThisMonth: leads.wonThisMonth,
            conversionRate
          },
          customers: customers,
          projects: projects,
          activities: activityStats.reduce((acc, item) => {
            acc[item._id] = item.count
            return acc
          }, {})
        },
        scores: {
          overall: Math.min(100, Math.round((conversionRate * 2) + (efficiency * 0.5))),
          efficiency,
          productivity: Math.min(100, leads.thisMonth * 5),
          quality: conversionRate
        },
        period: periodDays
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get all users performance comparison
 * @route   GET /api/performance/users
 * @access  Private
 */
router.get('/users', requirePermission(PERMISSIONS.PERFORMANCE_VIEW_ALL), async (req, res) => {
  try {
    const { role, department, company, period = '30d' } = req.query
    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Build user filter
    const userFilter = { isActive: true }

    if (company) {
      userFilter.company = new mongoose.Types.ObjectId(company)
    } else if (req.user.role !== 'super_admin') {
      userFilter.company = req.activeCompany?._id || req.user.company._id
    }

    if (role) {
      userFilter.role = role
    }

    if (department) {
      userFilter.department = department
    }

    const users = await User.find(userFilter)
      .select('_id name email role department')

    // Get performance for each user
    const performance = await Promise.all(users.map(async (user) => {
      const leadStats = await Lead.aggregate([
        { $match: { assignedTo: user._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
            thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] } }
          }
        }
      ])

      const stats = leadStats[0] || { total: 0, won: 0, thisMonth: 0 }

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        leads: {
          total: stats.total,
          won: stats.won,
          thisMonth: stats.thisMonth,
          conversionRate: stats.total > 0
            ? Math.round((stats.won / stats.total) * 100 * 10) / 10
            : 0
        },
        score: stats.total > 0
          ? Math.round((stats.won / stats.total) * 100)
          : 0
      }
    }))

    // Sort by score descending
    performance.sort((a, b) => b.score - a.score)

    res.json({
      success: true,
      data: {
        users: performance,
        period: periodDays
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get team performance
 * @route   GET /api/performance/team/:managerId
 * @access  Private
 */
router.get('/team/:managerId', requirePermission(PERMISSIONS.PERFORMANCE_VIEW), async (req, res) => {
  try {
    const { managerId } = req.params
    const { period = '30d' } = req.query
    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Get team members
    const teamMembers = await User.find({ reportsTo: managerId, isActive: true })
      .select('_id name email role department')

    if (teamMembers.length === 0) {
      return res.json({
        success: true,
        data: {
          manager: managerId,
          team: [],
          summary: { total: 0, won: 0, conversionRate: 0 },
          period: periodDays
        }
      })
    }

    const teamMemberIds = teamMembers.map(m => m._id)

    // Get team aggregate stats
    const teamStats = await Lead.aggregate([
      { $match: { assignedTo: { $in: teamMemberIds } } },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
          thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] } }
        }
      }
    ])

    const statsMap = teamStats.reduce((acc, item) => {
      acc[item._id.toString()] = item
      return acc
    }, {})

    const teamPerformance = teamMembers.map(member => {
      const stats = statsMap[member._id.toString()] || { total: 0, won: 0, lost: 0, thisMonth: 0 }
      return {
        userId: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department,
        leads: {
          total: stats.total,
          won: stats.won,
          lost: stats.lost,
          thisMonth: stats.thisMonth,
          conversionRate: stats.total > 0
            ? Math.round((stats.won / stats.total) * 100 * 10) / 10
            : 0
        }
      }
    }).sort((a, b) => b.leads.won - a.leads.won)

    // Calculate team summary
    const summary = teamPerformance.reduce((acc, member) => {
      acc.total += member.leads.total
      acc.won += member.leads.won
      acc.lost += member.leads.lost
      acc.thisMonth += member.leads.thisMonth
      return acc
    }, { total: 0, won: 0, lost: 0, thisMonth: 0 })

    summary.conversionRate = summary.total > 0
      ? Math.round((summary.won / summary.total) * 100 * 10) / 10
      : 0

    res.json({
      success: true,
      data: {
        manager: managerId,
        team: teamPerformance,
        summary,
        period: periodDays
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router
