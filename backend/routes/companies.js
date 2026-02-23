import express from 'express'
import Company from '../models/Company.js'
import User from '../models/User.js'
import {
  protect,
  setCompanyContext,
  authorize,
  requirePermission,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All routes are protected
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get simple list of companies (for dropdowns)
 * @route   GET /api/companies/list
 * @access  Private
 */
router.get('/list', async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .select('_id name code type email phone gstin pan status')
      .populate('parentCompany', 'name code')
      .sort({ name: 1 })

    res.json({
      success: true,
      count: companies.length,
      data: companies
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get all companies (for super admin)
 * @route   GET /api/companies
 * @access  Private/SuperAdmin
 */
router.get('/', authorize('super_admin', 'superadmin'), async (req, res) => {
  try {
    const { type, isActive } = req.query

    const query = {}
    if (type) query.type = type
    if (isActive !== undefined) query.isActive = isActive === 'true'

    const companies = await Company.find(query)
      .populate('parentCompany', 'name code')
      .sort({ createdAt: -1 })

    // Get user counts for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const userCount = await User.countDocuments({ company: company._id, isActive: true })
        return {
          ...company.toObject(),
          stats: { userCount }
        }
      })
    )

    res.json({
      success: true,
      count: companiesWithStats.length,
      data: companiesWithStats
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get current user's company details
 * @route   GET /api/companies/me
 * @access  Private
 */
router.get('/me', async (req, res) => {
  try {
    const company = await Company.findById(req.activeCompany._id)
      .populate('parentCompany', 'name code')

    res.json({
      success: true,
      data: company
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get single company
 * @route   GET /api/companies/:id
 * @access  Private/SuperAdmin or CompanyAdmin
 */
router.get('/:id', async (req, res) => {
  try {
    // Verify access
    if (req.user.role !== 'super_admin' &&
        req.user.company._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this company'
      })
    }

    const company = await Company.findById(req.params.id)
      .populate('parentCompany', 'name code')

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      })
    }

    res.json({
      success: true,
      data: company
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Create new company (subsidiary)
 * @route   POST /api/companies
 * @access  Private/SuperAdmin
 */
router.post('/', authorize('super_admin'), async (req, res) => {
  try {
    const { code, name, type, parentCompany, ...rest } = req.body

    // Validate code uniqueness
    const existingCompany = await Company.findOne({ code: code.toUpperCase() })
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company code already exists'
      })
    }

    // Create company
    const company = await Company.create({
      code: code.toUpperCase(),
      name,
      type: type || 'subsidiary',
      parentCompany: parentCompany || null,
      ...rest
    })

    res.status(201).json({
      success: true,
      data: company
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Update company
 * @route   PUT /api/companies/:id
 * @access  Private/SuperAdmin or CompanyAdmin
 */
router.put('/:id',
  requirePermission(PERMISSIONS.COMPANY_EDIT),
  async (req, res) => {
    try {
      // Company admin can only edit their own company
      if (req.user.role !== 'super_admin' &&
          req.user.company._id.toString() !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this company'
        })
      }

      // Prevent code changes except by super admin
      if (req.body.code && req.user.role !== 'super_admin') {
        delete req.body.code
      }

      const company = await Company.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        })
      }

      res.json({
        success: true,
        data: company
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Update company lead statuses/pipeline
 * @route   PUT /api/companies/:id/lead-statuses
 * @access  Private/SuperAdmin or CompanyAdmin
 */
router.put('/:id/lead-statuses',
  requirePermission(PERMISSIONS.COMPANY_MANAGE_PIPELINES),
  async (req, res) => {
    try {
      const { leadStatuses } = req.body

      // Verify access
      if (req.user.role !== 'super_admin' &&
          req.user.company._id.toString() !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this company'
        })
      }

      const company = await Company.findByIdAndUpdate(
        req.params.id,
        { leadStatuses },
        { new: true }
      )

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        })
      }

      res.json({
        success: true,
        data: company.leadStatuses,
        message: 'Lead statuses updated successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Update company project stages
 * @route   PUT /api/companies/:id/project-stages
 * @access  Private/SuperAdmin or CompanyAdmin
 */
router.put('/:id/project-stages',
  requirePermission(PERMISSIONS.COMPANY_MANAGE_PIPELINES),
  async (req, res) => {
    try {
      const { projectStages } = req.body

      // Verify access
      if (req.user.role !== 'super_admin' &&
          req.user.company._id.toString() !== req.params.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this company'
        })
      }

      const company = await Company.findByIdAndUpdate(
        req.params.id,
        { projectStages },
        { new: true }
      )

      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        })
      }

      res.json({
        success: true,
        data: company.projectStages,
        message: 'Project stages updated successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get company statistics
 * @route   GET /api/companies/:id/stats
 * @access  Private/CompanyAdmin
 */
router.get('/:id/stats',
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  async (req, res) => {
    try {
      const Lead = (await import('../models/Lead.js')).default
      const Customer = (await import('../models/Customer.js')).default
      const Project = (await import('../models/Project.js')).default

      const companyId = req.params.id

      // Verify access
      if (req.user.role !== 'super_admin' &&
          req.user.company._id.toString() !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this company stats'
        })
      }

      const [
        totalLeads,
        newLeads,
        convertedLeads,
        totalCustomers,
        activeCustomers,
        totalProjects,
        activeProjects,
        completedProjects,
        totalUsers
      ] = await Promise.all([
        Lead.countDocuments({ company: companyId }),
        Lead.countDocuments({ company: companyId, status: 'new' }),
        Lead.countDocuments({ company: companyId, isConverted: true }),
        Customer.countDocuments({ company: companyId }),
        Customer.countDocuments({ company: companyId, status: 'active' }),
        Project.countDocuments({ company: companyId }),
        Project.countDocuments({ company: companyId, status: 'active' }),
        Project.countDocuments({ company: companyId, status: 'completed' }),
        User.countDocuments({ company: companyId, isActive: true })
      ])

      res.json({
        success: true,
        data: {
          leads: {
            total: totalLeads,
            new: newLeads,
            converted: convertedLeads,
            conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0
          },
          customers: {
            total: totalCustomers,
            active: activeCustomers
          },
          projects: {
            total: totalProjects,
            active: activeProjects,
            completed: completedProjects
          },
          users: {
            total: totalUsers
          }
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Deactivate company
 * @route   PUT /api/companies/:id/deactivate
 * @access  Private/SuperAdmin
 */
router.put('/:id/deactivate', authorize('super_admin'), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      })
    }

    // Deactivate all users in this company
    await User.updateMany(
      { company: req.params.id },
      { isActive: false }
    )

    res.json({
      success: true,
      message: 'Company and all its users have been deactivated',
      data: company
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router
