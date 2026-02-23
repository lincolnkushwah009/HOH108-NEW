import express from 'express'
import mongoose from 'mongoose'
import { protect, setCompanyContext, authorize, requirePermission, PERMISSIONS } from '../middleware/rbac.js'
import Lead from '../models/Lead.js'
import Customer from '../models/Customer.js'
import Project from '../models/Project.js'
import User from '../models/User.js'
import Company from '../models/Company.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get Super Admin Dashboard Stats (Multi-company overview)
 * @route   GET /api/admin/dashboard/super
 * @access  Private (super_admin only)
 */
router.get('/super', authorize('super_admin'), async (req, res) => {
  try {
    const { period = '30d' } = req.query
    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Get all active companies
    const companies = await Company.find({ isActive: true })
    const companyIds = companies.map(c => c._id)

    // Aggregate stats across all companies
    const [leadStats, customerStats, projectStats, userStats] = await Promise.all([
      Lead.aggregate([
        { $match: { company: { $in: companyIds } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
            won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
            lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
            thisMonth: {
              $sum: {
                $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0]
              }
            }
          }
        }
      ]),
      Customer.aggregate([
        { $match: { company: { $in: companyIds } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            thisMonth: {
              $sum: {
                $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0]
              }
            }
          }
        }
      ]),
      Project.aggregate([
        { $match: { company: { $in: companyIds } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalValue: { $sum: { $ifNull: ['$financials.totalBudget', 0] } }
          }
        }
      ]),
      User.aggregate([
        { $match: { company: { $in: companyIds }, isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 }
          }
        }
      ])
    ])

    // Get company-wise breakdown
    const companyBreakdown = await Lead.aggregate([
      { $match: { company: { $in: companyIds } } },
      {
        $group: {
          _id: '$company',
          totalLeads: { $sum: 1 },
          wonLeads: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          lostLeads: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: '_id',
          as: 'companyInfo'
        }
      },
      { $unwind: '$companyInfo' },
      {
        $project: {
          companyId: '$_id',
          companyName: '$companyInfo.name',
          companyCode: '$companyInfo.code',
          totalLeads: 1,
          wonLeads: 1,
          lostLeads: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$totalLeads', 0] },
              { $multiply: [{ $divide: ['$wonLeads', '$totalLeads'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalLeads: -1 } }
    ])

    // Get lead funnel (global)
    const leadFunnel = await Lead.aggregate([
      { $match: { company: { $in: companyIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const funnelMap = leadFunnel.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        stats: {
          totalLeads: leadStats[0]?.total || 0,
          newLeads: leadStats[0]?.new || 0,
          wonLeads: leadStats[0]?.won || 0,
          lostLeads: leadStats[0]?.lost || 0,
          leadsThisMonth: leadStats[0]?.thisMonth || 0,
          totalCustomers: customerStats[0]?.total || 0,
          customersThisMonth: customerStats[0]?.thisMonth || 0,
          totalProjects: projectStats[0]?.total || 0,
          activeProjects: projectStats[0]?.active || 0,
          completedProjects: projectStats[0]?.completed || 0,
          totalProjectValue: projectStats[0]?.totalValue || 0,
          totalUsers: userStats[0]?.total || 0,
          conversionRate: leadStats[0]?.total > 0
            ? Math.round((leadStats[0]?.won / leadStats[0]?.total) * 100 * 10) / 10
            : 0
        },
        companies: companyBreakdown,
        funnel: {
          new: funnelMap['new'] || 0,
          contacted: funnelMap['contacted'] || 0,
          qualified: funnelMap['qualified'] || 0,
          'proposal-sent': funnelMap['proposal-sent'] || 0,
          negotiation: funnelMap['negotiation'] || 0,
          won: funnelMap['won'] || 0,
          lost: funnelMap['lost'] || 0
        },
        period: periodDays
      }
    })
  } catch (error) {
    console.error('Super admin dashboard error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get Company Performance Comparison (for super admin)
 * @route   GET /api/admin/dashboard/super/companies
 * @access  Private (super_admin only)
 */
router.get('/super/companies', authorize('super_admin'), async (req, res) => {
  try {
    const { period = '30d', sortBy = 'leads', order = 'desc' } = req.query
    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const companies = await Company.find({ isActive: true })

    const companyStats = await Promise.all(companies.map(async (company) => {
      const [leadStats, customerCount, projectStats, userCount] = await Promise.all([
        Lead.aggregate([
          { $match: { company: company._id, createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
              new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } }
            }
          }
        ]),
        Customer.countDocuments({ company: company._id }),
        Project.aggregate([
          { $match: { company: company._id } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
              revenue: { $sum: { $ifNull: ['$financials.collected', 0] } }
            }
          }
        ]),
        User.countDocuments({ company: company._id, isActive: true })
      ])

      const stats = leadStats[0] || { total: 0, won: 0, new: 0 }
      const projStats = projectStats[0] || { total: 0, active: 0, revenue: 0 }

      return {
        companyId: company._id,
        companyCode: company.code,
        companyName: company.name,
        companyType: company.type,
        leads: stats.total,
        newLeads: stats.new,
        wonLeads: stats.won,
        conversionRate: stats.total > 0 ? Math.round((stats.won / stats.total) * 100 * 10) / 10 : 0,
        customers: customerCount,
        projects: projStats.total,
        activeProjects: projStats.active,
        revenue: projStats.revenue,
        users: userCount
      }
    }))

    // Sort results
    const sortOrder = order === 'asc' ? 1 : -1
    companyStats.sort((a, b) => (a[sortBy] - b[sortBy]) * sortOrder)

    res.json({
      success: true,
      data: companyStats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get Company Dashboard Stats
 * @route   GET /api/admin/dashboard/company/:companyId
 * @access  Private (company_admin, super_admin)
 */
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params
    const { period = '30d' } = req.query
    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Verify access
    if (req.user.role !== 'super_admin' && !req.user.canAccessCompany(companyId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this company'
      })
    }

    const companyObjectId = new mongoose.Types.ObjectId(companyId)

    // Get company info
    const company = await Company.findById(companyId)
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      })
    }

    // Get stats
    const [leadStats, customerStats, projectStats, teamStats] = await Promise.all([
      Lead.aggregate([
        { $match: { company: companyObjectId } },
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
            lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
            thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] } }
          }
        }
      ]),
      Customer.aggregate([
        { $match: { company: companyObjectId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
          }
        }
      ]),
      Project.aggregate([
        { $match: { company: companyObjectId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalBudget: { $sum: { $ifNull: ['$financials.totalBudget', 0] } },
            collected: { $sum: { $ifNull: ['$financials.collected', 0] } }
          }
        }
      ]),
      User.aggregate([
        { $match: { company: companyObjectId, isActive: true } },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ])
    ])

    // Get top performers
    const topPerformers = await Lead.aggregate([
      {
        $match: {
          company: companyObjectId,
          status: 'won',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          conversions: { $sum: 1 }
        }
      },
      { $sort: { conversions: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          role: '$user.role',
          conversions: 1
        }
      }
    ])

    const leads = leadStats[0] || {}
    const customers = customerStats[0] || {}
    const projects = projectStats[0] || {}

    res.json({
      success: true,
      data: {
        company: {
          id: company._id,
          name: company.name,
          code: company.code,
          type: company.type
        },
        stats: {
          leads: {
            total: leads.total || 0,
            new: leads.new || 0,
            contacted: leads.contacted || 0,
            qualified: leads.qualified || 0,
            proposalSent: leads.proposalSent || 0,
            negotiation: leads.negotiation || 0,
            won: leads.won || 0,
            lost: leads.lost || 0,
            thisMonth: leads.thisMonth || 0,
            conversionRate: leads.total > 0
              ? Math.round((leads.won / leads.total) * 100 * 10) / 10
              : 0
          },
          customers: {
            total: customers.total || 0,
            active: customers.active || 0
          },
          projects: {
            total: projects.total || 0,
            active: projects.active || 0,
            completed: projects.completed || 0,
            totalBudget: projects.totalBudget || 0,
            collected: projects.collected || 0,
            pending: (projects.totalBudget || 0) - (projects.collected || 0)
          },
          team: teamStats.reduce((acc, item) => {
            acc[item._id] = item.count
            return acc
          }, {})
        },
        topPerformers,
        period: periodDays
      }
    })
  } catch (error) {
    console.error('Company dashboard error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get Sales Manager Dashboard
 * @route   GET /api/admin/dashboard/sales
 * @access  Private (sales_manager, company_admin, super_admin)
 */
router.get('/sales', authorize('super_admin', 'company_admin', 'sales_manager'), async (req, res) => {
  try {
    const companyId = req.activeCompany?._id || req.user.company._id
    const { period = '30d' } = req.query
    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Get team members (if sales manager, get their direct reports)
    let teamFilter = { company: companyId, isActive: true }
    if (req.user.role === 'sales_manager') {
      teamFilter.reportsTo = req.user._id
    }

    const teamMembers = await User.find(teamFilter)
      .select('_id name email role department')

    const teamMemberIds = teamMembers.map(m => m._id)

    // Get team lead stats
    const teamLeadStats = await Lead.aggregate([
      {
        $match: {
          company: companyId,
          assignedTo: { $in: teamMemberIds }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          inProgress: {
            $sum: {
              $cond: [
                { $in: ['$status', ['contacted', 'qualified', 'proposal-sent', 'negotiation']] },
                1, 0
              ]
            }
          },
          won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
          thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0] } }
        }
      }
    ])

    // Map stats to team members
    const statsMap = teamLeadStats.reduce((acc, item) => {
      acc[item._id.toString()] = item
      return acc
    }, {})

    const teamPerformance = teamMembers.map(member => {
      const stats = statsMap[member._id.toString()] || {
        total: 0, new: 0, inProgress: 0, won: 0, lost: 0, thisMonth: 0
      }
      return {
        userId: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department,
        leads: {
          total: stats.total,
          new: stats.new,
          inProgress: stats.inProgress,
          won: stats.won,
          lost: stats.lost,
          thisMonth: stats.thisMonth,
          conversionRate: stats.total > 0
            ? Math.round((stats.won / stats.total) * 100 * 10) / 10
            : 0
        }
      }
    })

    // Get follow-ups due today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const followUpsDue = await Lead.countDocuments({
      company: companyId,
      assignedTo: { $in: teamMemberIds },
      'nextFollowUp.date': { $gte: today, $lt: tomorrow },
      status: { $nin: ['won', 'lost'] }
    })

    // Get overdue follow-ups
    const overdueFollowUps = await Lead.countDocuments({
      company: companyId,
      assignedTo: { $in: teamMemberIds },
      'nextFollowUp.date': { $lt: today },
      status: { $nin: ['won', 'lost'] }
    })

    // Aggregate totals
    const totals = teamPerformance.reduce((acc, member) => {
      acc.total += member.leads.total
      acc.new += member.leads.new
      acc.inProgress += member.leads.inProgress
      acc.won += member.leads.won
      acc.lost += member.leads.lost
      return acc
    }, { total: 0, new: 0, inProgress: 0, won: 0, lost: 0 })

    res.json({
      success: true,
      data: {
        summary: {
          ...totals,
          conversionRate: totals.total > 0
            ? Math.round((totals.won / totals.total) * 100 * 10) / 10
            : 0,
          teamSize: teamMembers.length,
          followUpsDue,
          overdueFollowUps
        },
        team: teamPerformance.sort((a, b) => b.leads.won - a.leads.won),
        period: periodDays
      }
    })
  } catch (error) {
    console.error('Sales dashboard error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get Team Member Details (for sales manager)
 * @route   GET /api/admin/dashboard/sales/team/:userId
 * @access  Private (sales_manager, company_admin, super_admin)
 */
router.get('/sales/team/:userId', authorize('super_admin', 'company_admin', 'sales_manager'), async (req, res) => {
  try {
    const { userId } = req.params
    const { period = '30d' } = req.query
    const periodDays = parseInt(period) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    const user = await User.findById(userId)
      .select('-password')
      .populate('company', 'name code')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Get lead stats
    const leadStats = await Lead.aggregate([
      { $match: { assignedTo: user._id } },
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
    ])

    // Get recent leads
    const recentLeads = await Lead.find({ assignedTo: userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('name status service phone createdAt updatedAt')

    // Get activity summary (from lead activities)
    const activityStats = await Lead.aggregate([
      { $match: { assignedTo: user._id, 'activities.performedAt': { $gte: startDate } } },
      { $unwind: '$activities' },
      { $match: { 'activities.performedAt': { $gte: startDate } } },
      {
        $group: {
          _id: '$activities.action',
          count: { $sum: 1 }
        }
      }
    ])

    const stats = leadStats[0] || {}

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          company: user.company,
          metrics: user.metrics
        },
        leads: {
          total: stats.total || 0,
          new: stats.new || 0,
          contacted: stats.contacted || 0,
          qualified: stats.qualified || 0,
          proposalSent: stats.proposalSent || 0,
          negotiation: stats.negotiation || 0,
          won: stats.won || 0,
          lost: stats.lost || 0,
          conversionRate: stats.total > 0
            ? Math.round((stats.won / stats.total) * 100 * 10) / 10
            : 0
        },
        recentLeads,
        activities: activityStats.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {}),
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
