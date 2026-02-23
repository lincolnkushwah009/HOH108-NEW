import User from '../models/User.js'
import Lead from '../models/Lead.js'
import Project from '../models/Project.js'
import KarmaTransaction from '../models/KarmaTransaction.js'
import Customer from '../models/Customer.js'
import { getLeadQueryFilter } from '../middleware/rbac.js'

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    // Get company filter from active company context
    const companyFilter = req.activeCompany ? { company: req.activeCompany._id } : {}

    // Get lead filter that respects user role (non-admins only see assigned leads)
    const leadFilter = getLeadQueryFilter(req)

    // Get year filter from query parameter
    const { year } = req.query
    const selectedYear = year ? parseInt(year) : new Date().getFullYear()

    // Create date range for the selected year
    const yearStart = new Date(selectedYear, 0, 1) // Jan 1 of selected year
    const yearEnd = new Date(selectedYear + 1, 0, 1) // Jan 1 of next year

    // Create year filter for createdAt
    const yearFilter = {
      createdAt: { $gte: yearStart, $lt: yearEnd }
    }

    // Build aggregate match filter that combines leadFilter + year range
    // leadFilter may contain company + $or (for non-admin roles)
    const leadAggregateMatch = {
      ...leadFilter,
      createdAt: { $gte: yearStart, $lt: yearEnd }
    }

    // Get counts - filtered by company, year, and user role
    const totalUsers = await User.countDocuments({ ...companyFilter, role: 'user' })
    const totalLeads = await Lead.countDocuments({ ...leadFilter, ...yearFilter })
    // Active projects should not be filtered by year - they may have been created in previous years
    const activeProjects = await Project.countDocuments({ ...companyFilter, status: 'active' })
    const totalProjects = await Project.countDocuments({ ...companyFilter, ...yearFilter })
    const totalCustomers = await Customer.countDocuments({ ...companyFilter, ...yearFilter })

    // Get leads by status - filtered by company, year, and user role
    const newLeads = await Lead.countDocuments({ ...leadFilter, ...yearFilter, status: 'new' })
    const wonLeads = await Lead.countDocuments({ ...leadFilter, ...yearFilter, status: 'won' })

    // Get recent leads - filtered by company, year, and user role
    const recentLeads = await Lead.find({ ...leadFilter, ...yearFilter })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email phone service status createdAt assignedTo')
      .populate('assignedTo', 'name')

    // Get recent users - filtered by company
    const recentUsers = await User.find({ ...companyFilter, role: 'user' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email karmaPoints createdAt')

    // Get recent active projects for the dashboard - filtered by company
    const recentProjects = await Project.find({ ...companyFilter, status: 'active' })
      .sort({ lastActivityAt: -1 })
      .limit(5)
      .populate('customer', 'name')
      .select('title status stage financials completion customer lastActivityAt')

    // Get leads by service type - filtered by company, year, and user role
    const leadsByService = await Lead.aggregate([
      {
        $match: leadAggregateMatch
      },
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 }
        }
      }
    ])

    // Get detailed vertical stats (service breakdown with status) - filtered by company, year, and user role
    const verticalStats = await Lead.aggregate([
      {
        $match: leadAggregateMatch
      },
      {
        $group: {
          _id: {
            service: '$service',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.service',
          total: { $sum: '$count' },
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      }
    ])

    // Transform vertical stats into a more usable format
    const verticals = {
      interior: { total: 0, new: 0, contacted: 0, qualified: 0, 'proposal-sent': 0, negotiation: 0, won: 0, lost: 0 },
      construction: { total: 0, new: 0, contacted: 0, qualified: 0, 'proposal-sent': 0, negotiation: 0, won: 0, lost: 0 },
      renovation: { total: 0, new: 0, contacted: 0, qualified: 0, 'proposal-sent': 0, negotiation: 0, won: 0, lost: 0 },
      '3d-design': { total: 0, new: 0, contacted: 0, qualified: 0, 'proposal-sent': 0, negotiation: 0, won: 0, lost: 0 },
      consultation: { total: 0, new: 0, contacted: 0, qualified: 0, 'proposal-sent': 0, negotiation: 0, won: 0, lost: 0 },
      other: { total: 0, new: 0, contacted: 0, qualified: 0, 'proposal-sent': 0, negotiation: 0, won: 0, lost: 0 }
    }

    verticalStats.forEach(v => {
      const service = v._id || 'other'
      if (verticals[service]) {
        verticals[service].total = v.total
        v.statuses.forEach(s => {
          if (verticals[service][s.status] !== undefined) {
            verticals[service][s.status] = s.count
          }
        })
      }
    })

    // Get leads by status - filtered by company, year, and user role
    const leadsByStatus = await Lead.aggregate([
      {
        $match: leadAggregateMatch
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    // Get monthly leads for selected year - filtered by company, year, and user role
    const monthlyLeads = await Lead.aggregate([
      {
        $match: leadAggregateMatch
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])

    // Total karma points in circulation
    const totalKarmaPoints = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$karmaPoints' }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalLeads,
          totalProjects,
          activeProjects,
          totalCustomers,
          newLeads,
          wonLeads,
          conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0,
          totalKarmaPoints: totalKarmaPoints[0]?.total || 0
        },
        recentLeads,
        recentUsers,
        recentProjects,
        leadsByService,
        leadsByStatus,
        monthlyLeads,
        verticals
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Get activity feed
// @route   GET /api/dashboard/activity
// @access  Private/Admin
export const getActivityFeed = async (req, res) => {
  try {
    const leads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name service status createdAt')

    const users = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt')

    const karmaTransactions = await KarmaTransaction.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .select('type points source createdAt')

    // Combine and sort by date
    const activities = [
      ...leads.map(l => ({
        type: 'lead',
        message: `New lead: ${l.name} - ${l.service}`,
        status: l.status,
        createdAt: l.createdAt
      })),
      ...users.map(u => ({
        type: 'user',
        message: `New user registered: ${u.name}`,
        createdAt: u.createdAt
      })),
      ...karmaTransactions.map(k => ({
        type: 'karma',
        message: `${k.user?.name || 'User'} ${k.type} ${k.points} karma points`,
        createdAt: k.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20)

    res.json({
      success: true,
      data: activities
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
