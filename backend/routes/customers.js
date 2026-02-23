import express from 'express'
import Customer from '../models/Customer.js'
import Lead from '../models/Lead.js'
import Company from '../models/Company.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  getCustomerQueryFilter,
  canAccessCustomer,
  canModifyResource,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All routes are protected
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all customers (company-scoped)
 * @route   GET /api/customers
 * @access  Private
 */
router.get('/',
  requirePermission(PERMISSIONS.CUSTOMERS_VIEW),
  async (req, res) => {
    try {
      const {
        status,
        segment,
        accountManager,
        page = 1,
        limit = 20,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query

      // Build query with company scope
      const queryFilter = getCustomerQueryFilter(req)

      if (status) queryFilter.status = status
      if (segment) queryFilter.segment = segment
      if (accountManager) queryFilter.accountManager = accountManager

      // Search filter
      if (search) {
        queryFilter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { customerId: { $regex: search, $options: 'i' } }
        ]
      }

      const total = await Customer.countDocuments(queryFilter)

      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

      const customers = await Customer.find(queryFilter)
        .populate('accountManager', 'name email avatar')
        .populate('company', 'name code')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      res.json({
        success: true,
        data: customers,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
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
 * @desc    Get single customer
 * @route   GET /api/customers/:id
 * @access  Private
 */
router.get('/:id',
  requirePermission(PERMISSIONS.CUSTOMERS_VIEW),
  async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id)
        .populate('accountManager', 'name email avatar')
        .populate('teamMembers.user', 'name email avatar')
        .populate('originalLead', 'leadId name source')
        .populate('company', 'name code')
        .populate('activities.performedBy', 'name avatar')

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        })
      }

      // Check access
      if (!await canAccessCustomer(req, customer)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this customer'
        })
      }

      res.json({
        success: true,
        data: customer
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
 * @desc    Create customer (direct creation, not from lead conversion)
 * @route   POST /api/customers
 * @access  Private
 */
router.post('/',
  requirePermission(PERMISSIONS.CUSTOMERS_CREATE),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      // Get company for ID generation
      const company = await Company.findById(companyId)
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        })
      }

      // Generate customer ID
      const customerId = await company.generateId('customer')

      const customer = await Customer.create({
        ...req.body,
        customerId,
        company: companyId,
        activities: [{
          action: 'created',
          description: `Customer created by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        }]
      })

      await customer.populate('accountManager', 'name email')

      res.status(201).json({
        success: true,
        data: customer
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
 * @desc    Update customer
 * @route   PUT /api/customers/:id
 * @access  Private
 */
router.put('/:id',
  requirePermission(PERMISSIONS.CUSTOMERS_EDIT),
  async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id)

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        })
      }

      // Check modify access
      if (!canModifyResource(req, customer, 'customer')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this customer'
        })
      }

      // Track changes for activity log
      const changes = []
      const trackFields = ['name', 'email', 'phone', 'status', 'segment', 'accountManager']

      for (const field of trackFields) {
        if (req.body[field] !== undefined &&
            String(req.body[field]) !== String(customer[field])) {
          changes.push({
            field,
            old: customer[field],
            new: req.body[field]
          })
        }
      }

      // Update fields
      Object.keys(req.body).forEach(key => {
        if (key !== 'activities' && key !== 'company' && key !== 'customerId') {
          customer[key] = req.body[key]
        }
      })

      // Add activity for changes
      if (changes.length > 0) {
        customer.activities.push({
          action: 'updated',
          description: `${req.user.name} updated: ${changes.map(c => c.field).join(', ')}`,
          performedBy: req.user._id,
          performedByName: req.user.name,
          metadata: { changes }
        })
        customer.lastActivityAt = new Date()
      }

      await customer.save()
      await customer.populate('accountManager', 'name email')

      res.json({
        success: true,
        data: customer
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
 * @desc    Delete customer
 * @route   DELETE /api/customers/:id
 * @access  Private/Admin
 */
router.delete('/:id',
  requirePermission(PERMISSIONS.CUSTOMERS_DELETE),
  async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id)

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        })
      }

      // Only super admin or company admin can delete
      if (!['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete customers'
        })
      }

      // Check company access
      if (req.user.role !== 'super_admin' &&
          customer.company.toString() !== req.user.company._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this customer'
        })
      }

      await customer.deleteOne()

      res.json({
        success: true,
        message: 'Customer deleted successfully'
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
 * @desc    Add note to customer
 * @route   POST /api/customers/:id/notes
 * @access  Private
 */
router.post('/:id/notes',
  requirePermission(PERMISSIONS.CUSTOMERS_VIEW),
  async (req, res) => {
    try {
      const { content, isPinned } = req.body

      const customer = await Customer.findById(req.params.id)

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        })
      }

      // Check access
      if (!await canAccessCustomer(req, customer)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to add notes to this customer'
        })
      }

      customer.notes.push({
        content,
        isPinned: isPinned || false,
        addedBy: req.user._id,
        addedByName: req.user.name
      })

      customer.activities.push({
        action: 'note_added',
        description: `${req.user.name} added a note`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })

      customer.lastActivityAt = new Date()
      await customer.save()

      res.json({
        success: true,
        data: customer.notes[customer.notes.length - 1],
        message: 'Note added successfully'
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
 * @desc    Get customer projects
 * @route   GET /api/customers/:id/projects
 * @access  Private
 */
router.get('/:id/projects',
  requirePermission(PERMISSIONS.CUSTOMERS_VIEW),
  async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id)

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        })
      }

      // Check access
      if (!await canAccessCustomer(req, customer)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this customer'
        })
      }

      const Project = (await import('../models/Project.js')).default
      const projects = await Project.find({ customer: req.params.id })
        .populate('projectManager', 'name email')
        .sort({ createdAt: -1 })

      res.json({
        success: true,
        count: projects.length,
        data: projects
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
 * @desc    Assign project to customer
 * @route   POST /api/customers/:id/projects
 * @access  Private
 */
router.post('/:id/projects',
  requirePermission(PERMISSIONS.CUSTOMERS_EDIT),
  async (req, res) => {
    try {
      const { projectId } = req.body

      const customer = await Customer.findById(req.params.id)

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        })
      }

      // Check access
      if (!await canAccessCustomer(req, customer)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this customer'
        })
      }

      const Project = (await import('../models/Project.js')).default
      const project = await Project.findById(projectId)

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      // Check if project is already assigned to this customer
      if (project.customer && project.customer.toString() === req.params.id) {
        return res.status(400).json({
          success: false,
          message: `Project "${project.title}" is already assigned to this customer`
        })
      }

      // Check if project is assigned to a different customer
      if (project.customer && project.customer.toString() !== req.params.id) {
        const existingCustomer = await Customer.findById(project.customer).select('name')
        return res.status(400).json({
          success: false,
          message: `Project "${project.title}" is already assigned to customer "${existingCustomer?.name || 'another customer'}"`
        })
      }

      // Update project with customer reference
      project.customer = req.params.id
      await project.save()

      // Add activity log
      customer.activities.push({
        action: 'project_assigned',
        description: `Project "${project.title}" assigned by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata: { projectId, projectTitle: project.title }
      })

      customer.lastActivityAt = new Date()
      await customer.save()

      // Update customer metrics
      if (customer.updateMetrics) {
        await customer.updateMetrics()
        await customer.save()
      }

      res.json({
        success: true,
        data: customer,
        message: `Project "${project.title}" assigned successfully`
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
 * @desc    Update customer metrics
 * @route   POST /api/customers/:id/update-metrics
 * @access  Private/Admin
 */
router.post('/:id/update-metrics',
  requirePermission(PERMISSIONS.CUSTOMERS_EDIT),
  async (req, res) => {
    try {
      const customer = await Customer.findById(req.params.id)

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        })
      }

      await customer.updateMetrics()

      res.json({
        success: true,
        data: customer.metrics,
        message: 'Customer metrics updated'
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
 * @desc    Get customer segments summary
 * @route   GET /api/customers/segments/summary
 * @access  Private
 */
router.get('/segments/summary',
  requirePermission(PERMISSIONS.ANALYTICS_VIEW),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      const segmentSummary = await Customer.aggregate([
        { $match: { company: companyId } },
        {
          $group: {
            _id: '$segment',
            count: { $sum: 1 },
            totalValue: { $sum: '$metrics.totalValue' }
          }
        },
        { $sort: { totalValue: -1 } }
      ])

      res.json({
        success: true,
        data: segmentSummary
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

export default router
