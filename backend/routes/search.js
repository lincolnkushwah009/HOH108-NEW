import express from 'express'
import Lead from '../models/Lead.js'
import User from '../models/User.js'
import Customer from '../models/Customer.js'
import Project from '../models/Project.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

// All routes protected
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Global search across leads, customers, employees, projects
 * @route   GET /api/search
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { leads: [], customers: [], employees: [], projects: [] }
      })
    }

    const searchRegex = { $regex: q, $options: 'i' }
    const companyFilter = companyScopedQuery(req)
    const resultLimit = Math.min(parseInt(limit), 20)

    // Search in parallel
    const [leads, customers, employees, projects] = await Promise.all([
      // Search Leads
      Lead.find({
        ...companyFilter,
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { leadId: searchRegex }
        ]
      })
        .select('_id leadId name email phone primaryStatus')
        .limit(resultLimit)
        .lean(),

      // Search Customers
      Customer.find({
        ...companyFilter,
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { customerId: searchRegex }
        ]
      })
        .select('_id customerId name email phone')
        .limit(resultLimit)
        .lean(),

      // Search Employees
      User.find({
        ...companyFilter,
        isEmployee: { $ne: false },
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { employeeId: searchRegex }
        ]
      })
        .select('_id employeeId name email designation department')
        .limit(resultLimit)
        .lean(),

      // Search Projects
      Project.find({
        ...companyFilter,
        $or: [
          { name: searchRegex },
          { projectId: searchRegex },
          { clientName: searchRegex }
        ]
      })
        .select('_id projectId name clientName status')
        .limit(resultLimit)
        .lean()
    ])

    res.json({
      success: true,
      data: {
        leads: leads.map(l => ({
          _id: l._id,
          id: l.leadId || l._id,
          name: l.name,
          subtitle: l.phone || l.email,
          status: l.primaryStatus,
          type: 'lead',
          path: `/admin/leads/${l._id}`
        })),
        customers: customers.map(c => ({
          _id: c._id,
          id: c.customerId || c._id,
          name: c.name,
          subtitle: c.phone || c.email,
          type: 'customer',
          path: `/admin/customers/${c._id}`
        })),
        employees: employees.map(e => ({
          _id: e._id,
          id: e.employeeId || e._id,
          name: e.name,
          subtitle: e.designation || e.department,
          type: 'employee',
          path: `/admin/employees?id=${e._id}`
        })),
        projects: projects.map(p => ({
          _id: p._id,
          id: p.projectId || p._id,
          name: p.name,
          subtitle: p.clientName,
          status: p.status,
          type: 'project',
          path: `/admin/projects/${p._id}`
        }))
      },
      total: leads.length + customers.length + employees.length + projects.length
    })
  } catch (error) {
    console.error('Global search error:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router
