import express from 'express'
import Ticket from '../models/Ticket.js'
import TicketCategory from '../models/TicketCategory.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  requireModulePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'
import { uploadTicketDocs } from '../middleware/upload.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('all_tickets', 'view'))

// Debug logger for ticket routes
router.use((req, res, next) => {
  console.log(`[Tickets] ${req.method} ${req.path} | User: ${req.user?.email} (${req.user?.role}) | Company: ${req.activeCompany?.name || 'NONE'} (${req.activeCompany?._id || 'N/A'}) | Header X-Company-Id: ${req.headers['x-company-id'] || 'not set'}`)
  next()
})

// ==================== TICKET CATEGORIES ====================

/**
 * @desc    Get all ticket categories
 * @route   GET /api/tickets/categories
 * @access  Private
 */
router.get('/categories', async (req, res) => {
  try {
    if (!req.activeCompany) {
      return res.json({ success: true, data: [] })
    }

    const categories = await TicketCategory.find({
      company: req.activeCompany._id,
      isActive: true
    })
      .sort({ sortOrder: 1 })
      .populate('defaultAssignee', 'name email')

    res.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('[Tickets/Categories] Error:', error.message, '| User:', req.user?.email, '| Company:', req.activeCompany?._id)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Initialize default categories for company
 * @route   POST /api/tickets/categories/init
 * @access  Private (Admin)
 */
router.post('/categories/init',
  requirePermission(PERMISSIONS.COMPANY_MANAGE_SETTINGS),
  async (req, res) => {
    try {
      // Check if categories already exist
      const existingCount = await TicketCategory.countDocuments({
        company: req.activeCompany._id
      })

      if (existingCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Categories already initialized for this company'
        })
      }

      // Get default categories
      const defaultCategories = TicketCategory.getDefaultCategories()

      // Create categories for this company
      const categories = await TicketCategory.insertMany(
        defaultCategories.map(cat => ({
          ...cat,
          company: req.activeCompany._id
        }))
      )

      res.status(201).json({
        success: true,
        data: categories,
        message: `${categories.length} categories initialized`
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
 * @desc    Create ticket category
 * @route   POST /api/tickets/categories
 * @access  Private (Admin)
 */
router.post('/categories',
  requirePermission(PERMISSIONS.COMPANY_MANAGE_SETTINGS),
  async (req, res) => {
    try {
      const category = await TicketCategory.create({
        ...req.body,
        company: req.activeCompany._id
      })

      res.status(201).json({
        success: true,
        data: category
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
 * @desc    Update ticket category
 * @route   PUT /api/tickets/categories/:id
 * @access  Private (Admin)
 */
router.put('/categories/:id',
  requirePermission(PERMISSIONS.COMPANY_MANAGE_SETTINGS),
  async (req, res) => {
    try {
      const category = await TicketCategory.findOneAndUpdate(
        { _id: req.params.id, company: req.activeCompany._id },
        req.body,
        { new: true }
      )

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        })
      }

      res.json({
        success: true,
        data: category
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ==================== TICKET STATISTICS ====================

/**
 * @desc    Get ticket statistics
 * @route   GET /api/tickets/stats
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    const { dateFrom, dateTo, department } = req.query

    const stats = await Ticket.getStats(req.activeCompany._id, {
      dateFrom,
      dateTo,
      department
    })

    const byCategory = await Ticket.getStatsByCategory(req.activeCompany._id)
    const byDepartment = await Ticket.getStatsByDepartment(req.activeCompany._id)

    res.json({
      success: true,
      data: {
        overview: stats,
        byCategory,
        byDepartment
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
 * @desc    Get my ticket statistics
 * @route   GET /api/tickets/stats/me
 * @access  Private
 */
router.get('/stats/me', async (req, res) => {
  try {
    const myTickets = await Ticket.aggregate([
      {
        $match: {
          company: req.activeCompany._id,
          requestedBy: req.user._id
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const pendingApproval = await Ticket.countDocuments({
      company: req.activeCompany._id,
      approver: req.user._id,
      status: 'pending_approval'
    })

    const assignedToMe = await Ticket.countDocuments({
      company: req.activeCompany._id,
      assignedTo: req.user._id,
      status: { $in: ['open', 'in_progress', 'pending_info'] }
    })

    res.json({
      success: true,
      data: {
        myTickets: myTickets.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        pendingApproval,
        assignedToMe
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// ==================== TICKET CRUD ====================

/**
 * @desc    Get all tickets
 * @route   GET /api/tickets
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      subCategory,
      supportDepartment,
      requestedBy,
      assignedTo,
      approver,
      filter, // my | assigned | approval | all
      search,
      slaBreached,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    let queryFilter = companyScopedQuery(req)

    // Apply filters based on user role and filter type
    if (filter === 'my') {
      queryFilter.requestedBy = req.user._id
    } else if (filter === 'assigned') {
      queryFilter.assignedTo = req.user._id
    } else if (filter === 'approval') {
      queryFilter.approver = req.user._id
      queryFilter.status = 'pending_approval'
    } else if (filter !== 'all') {
      // Default: show user's own tickets + assigned tickets for non-admins
      if (!['super_admin', 'company_admin'].includes(req.user.role)) {
        queryFilter.$or = [
          { requestedBy: req.user._id },
          { assignedTo: req.user._id },
          { approver: req.user._id },
          { watchers: req.user._id }
        ]
      }
    }

    // Additional filters
    if (status) {
      if (status.includes(',')) {
        queryFilter.status = { $in: status.split(',') }
      } else {
        queryFilter.status = status
      }
    }
    if (priority) queryFilter.priority = priority
    if (category) queryFilter.category = category
    if (subCategory) queryFilter.subCategory = subCategory
    if (supportDepartment) queryFilter.supportDepartment = supportDepartment
    if (requestedBy) queryFilter.requestedBy = requestedBy
    if (assignedTo) queryFilter.assignedTo = assignedTo
    if (approver) queryFilter.approver = approver
    if (slaBreached === 'true') queryFilter.slaBreached = true

    // Date range
    if (dateFrom || dateTo) {
      queryFilter.createdAt = {}
      if (dateFrom) queryFilter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) queryFilter.createdAt.$lte = new Date(dateTo)
    }

    // Search
    if (search) {
      queryFilter.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { requestedByName: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await Ticket.countDocuments(queryFilter)

    const sortOptions = {}
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

    const tickets = await Ticket.find(queryFilter)
      .populate('requestedBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('approver', 'name email')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-comments -activities')

    res.json({
      success: true,
      data: tickets,
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
})

/**
 * @desc    Get my tickets
 * @route   GET /api/tickets/my
 * @access  Private
 */
router.get('/my', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query

    const queryFilter = {
      company: req.activeCompany._id,
      requestedBy: req.user._id
    }

    if (status) queryFilter.status = status

    const total = await Ticket.countDocuments(queryFilter)

    const tickets = await Ticket.find(queryFilter)
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-comments -activities')

    res.json({
      success: true,
      data: tickets,
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
})

/**
 * @desc    Get tickets pending my approval
 * @route   GET /api/tickets/pending-approval
 * @access  Private
 */
router.get('/pending-approval', async (req, res) => {
  try {
    const tickets = await Ticket.find({
      company: req.activeCompany._id,
      approver: req.user._id,
      status: 'pending_approval'
    })
      .populate('requestedBy', 'name email avatar department')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: tickets,
      count: tickets.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get tickets assigned to me
 * @route   GET /api/tickets/assigned
 * @access  Private
 */
router.get('/assigned', async (req, res) => {
  try {
    const { status } = req.query

    const queryFilter = {
      company: req.activeCompany._id,
      assignedTo: req.user._id
    }

    if (status) {
      queryFilter.status = status
    } else {
      queryFilter.status = { $in: ['open', 'in_progress', 'pending_info'] }
    }

    const tickets = await Ticket.find(queryFilter)
      .populate('requestedBy', 'name email avatar department')
      .sort({ priority: 1, slaDueDate: 1 })

    res.json({
      success: true,
      data: tickets,
      count: tickets.length
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get single ticket
 * @route   GET /api/tickets/:id
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('requestedBy', 'name email avatar department phone')
      .populate('assignedTo', 'name email avatar department')
      .populate('approver', 'name email avatar')
      .populate('escalatedTo', 'name email')
      .populate('relatedProject', 'title projectId')
      .populate('comments.commentBy', 'name email avatar')
      .populate('activities.performedBy', 'name')
      .populate('watchers', 'name email')

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Check access
    const hasAccess =
      ['super_admin', 'company_admin'].includes(req.user.role) ||
      ticket.requestedBy._id.toString() === req.user._id.toString() ||
      ticket.assignedTo?._id.toString() === req.user._id.toString() ||
      ticket.approver?._id.toString() === req.user._id.toString() ||
      ticket.watchers?.some(w => w._id.toString() === req.user._id.toString())

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this ticket'
      })
    }

    res.json({
      success: true,
      data: ticket
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Create ticket
 * @route   POST /api/tickets
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subCategory,
      priority = 'medium',
      relatedProject,
      relatedAsset,
      attachments,
      isDraft = false
    } = req.body

    // Get category details - lookup by _id or code
    const categoryDoc = await TicketCategory.findOne({
      company: req.activeCompany._id,
      $or: [
        { _id: category },
        { code: category }
      ],
      isActive: true
    })

    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      })
    }

    // Get sub-category details
    let subCategoryDoc = null
    let slaHours = 24 // default
    if (subCategory) {
      subCategoryDoc = categoryDoc.subCategories.find(sc => sc.code === subCategory)
      if (subCategoryDoc) {
        slaHours = subCategoryDoc.slaHours[priority] || 24
      }
    }

    // Get company for ID generation
    const company = await Company.findById(req.activeCompany._id)
    const ticketId = await company.generateId('ticket')

    // Determine if approval is required
    const requiresApproval = categoryDoc.requiresApproval

    // Get manager for approval if required
    let approver = null
    let approverName = null
    if (requiresApproval) {
      // Get user's manager (reportsTo field in User schema)
      const requestor = await User.findById(req.user._id).populate('reportsTo', 'name email')
      if (requestor.reportsTo) {
        approver = requestor.reportsTo._id
        approverName = requestor.reportsTo.name
      }
    }

    const ticket = await Ticket.create({
      ticketId,
      company: req.activeCompany._id,
      title,
      description,
      category: categoryDoc.code, // Store the code, not the _id
      categoryName: categoryDoc.name,
      subCategory,
      subCategoryName: subCategoryDoc?.name,
      priority,
      slaHours,
      supportDepartment: categoryDoc.supportDepartment,
      requestedBy: req.user._id,
      requestedByName: req.user.name,
      requestedByEmail: req.user.email,
      requestedByDepartment: req.user.department || req.user.subDepartment,
      requestedByPhone: req.user.phone,
      requiresApproval,
      approvalStatus: requiresApproval ? 'pending' : 'not_required',
      approver,
      approverName,
      relatedProject,
      relatedAsset,
      attachments,
      status: isDraft ? 'draft' : (requiresApproval ? 'pending_approval' : 'open'),
      submittedAt: isDraft ? null : new Date(),
      approvalRequestedAt: requiresApproval && !isDraft ? new Date() : null,
      slaDueDate: !isDraft ? new Date(Date.now() + slaHours * 60 * 60 * 1000) : null,
      activities: [{
        action: isDraft ? 'created_draft' : 'created',
        description: `Ticket ${isDraft ? 'drafted' : 'created'} by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    // Auto-assign if default assignee exists and no approval required
    if (!requiresApproval && categoryDoc.defaultAssignee) {
      const defaultAssignee = await User.findById(categoryDoc.defaultAssignee)
      if (defaultAssignee) {
        ticket.assignedTo = defaultAssignee._id
        ticket.assignedToName = defaultAssignee.name
        ticket.assignedToDepartment = defaultAssignee.department
        ticket.assignedDate = new Date()
        ticket.status = 'in_progress'
        ticket.addActivity('auto_assigned', `Auto-assigned to ${defaultAssignee.name}`, req.user)
        await ticket.save()
      }
    }

    await ticket.populate([
      { path: 'requestedBy', select: 'name email avatar' },
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'approver', select: 'name email' }
    ])

    res.status(201).json({
      success: true,
      data: ticket,
      message: isDraft ? 'Ticket saved as draft' : 'Ticket created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Update ticket
 * @route   PUT /api/tickets/:id
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Only allow editing draft tickets or by admins
    if (ticket.status !== 'draft' &&
        ticket.requestedBy.toString() !== req.user._id.toString() &&
        !['super_admin', 'company_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit this ticket'
      })
    }

    const { title, description, priority, attachments } = req.body

    if (title) ticket.title = title
    if (description) ticket.description = description
    if (priority && ticket.status === 'draft') ticket.priority = priority
    if (attachments) ticket.attachments = attachments

    ticket.addActivity('updated', `Ticket updated by ${req.user.name}`, req.user)

    await ticket.save()

    res.json({
      success: true,
      data: ticket
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Delete ticket (draft only for regular users, any ticket for super_admin)
 * @route   DELETE /api/tickets/:id
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    // Handle various role name formats (super_admin, superadmin, Super Admin, etc.)
    const userRole = (req.user.role || '').toLowerCase().replace(/[\s_-]/g, '')
    const isSuperAdmin = userRole === 'superadmin' || userRole === 'companyadmin'

    let ticket
    if (isSuperAdmin) {
      // Super admin can delete any ticket
      ticket = await Ticket.findOne({
        _id: req.params.id,
        company: req.activeCompany._id
      })
    } else {
      // Regular users can only delete their own draft tickets
      ticket = await Ticket.findOne({
        _id: req.params.id,
        company: req.activeCompany._id,
        status: 'draft',
        requestedBy: req.user._id
      })
    }

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: isSuperAdmin ? 'Ticket not found' : 'Draft ticket not found or cannot be deleted'
      })
    }

    await ticket.deleteOne()

    res.json({
      success: true,
      message: 'Ticket deleted'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// ==================== TICKET WORKFLOW ACTIONS ====================

/**
 * @desc    Submit ticket
 * @route   POST /api/tickets/:id/submit
 * @access  Private
 */
router.post('/:id/submit', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      requestedBy: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    await ticket.submit(req.user)

    res.json({
      success: true,
      data: ticket,
      message: ticket.requiresApproval ? 'Ticket submitted for approval' : 'Ticket submitted'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Approve ticket
 * @route   PUT /api/tickets/:id/approve
 * @access  Private
 */
router.put('/:id/approve', async (req, res) => {
  try {
    const { remarks } = req.body

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      approver: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or you are not the approver'
      })
    }

    await ticket.approve(req.user, remarks)

    // Auto-assign if category has default assignee
    const category = await TicketCategory.findOne({
      company: req.activeCompany._id,
      $or: [
        { _id: ticket.category },
        { code: ticket.category }
      ]
    })

    if (category?.defaultAssignee) {
      const defaultAssignee = await User.findById(category.defaultAssignee)
      if (defaultAssignee) {
        await ticket.assign(defaultAssignee, req.user)
      }
    }

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket approved'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Reject ticket
 * @route   PUT /api/tickets/:id/reject
 * @access  Private
 */
router.put('/:id/reject', async (req, res) => {
  try {
    const { remarks } = req.body

    if (!remarks) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      })
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      approver: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or you are not the approver'
      })
    }

    await ticket.reject(req.user, remarks)

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket rejected'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Assign ticket
 * @route   PUT /api/tickets/:id/assign
 * @access  Private
 */
router.put('/:id/assign', async (req, res) => {
  try {
    const { assigneeId } = req.body

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Check if user can assign
    const canAssign =
      ['super_admin', 'company_admin', 'manager'].includes(req.user.role) ||
      ticket.assignedTo?.toString() === req.user._id.toString()

    if (!canAssign) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to assign this ticket'
      })
    }

    const assignee = await User.findById(assigneeId)
    if (!assignee) {
      return res.status(404).json({
        success: false,
        message: 'Assignee not found'
      })
    }

    await ticket.assign(assignee, req.user)

    await ticket.populate('assignedTo', 'name email avatar')

    res.json({
      success: true,
      data: ticket,
      message: `Ticket assigned to ${assignee.name}`
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Start working on ticket
 * @route   PUT /api/tickets/:id/start
 * @access  Private
 */
router.put('/:id/start', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      assignedTo: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or not assigned to you'
      })
    }

    await ticket.startWork(req.user)

    res.json({
      success: true,
      data: ticket,
      message: 'Work started on ticket'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Request more information
 * @route   PUT /api/tickets/:id/request-info
 * @access  Private
 */
router.put('/:id/request-info', async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      })
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      assignedTo: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or not assigned to you'
      })
    }

    await ticket.requestInfo(req.user, message)

    res.json({
      success: true,
      data: ticket,
      message: 'Information requested'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Provide requested information
 * @route   PUT /api/tickets/:id/provide-info
 * @access  Private
 */
router.put('/:id/provide-info', async (req, res) => {
  try {
    const { message, attachments } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      })
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      requestedBy: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    await ticket.provideInfo(req.user, message, attachments)

    res.json({
      success: true,
      data: ticket,
      message: 'Information provided'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Put ticket on hold
 * @route   PUT /api/tickets/:id/hold
 * @access  Private
 */
router.put('/:id/hold', async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      })
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      assignedTo: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or not assigned to you'
      })
    }

    await ticket.putOnHold(req.user, reason)

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket put on hold'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Resume ticket from hold
 * @route   PUT /api/tickets/:id/resume
 * @access  Private
 */
router.put('/:id/resume', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      assignedTo: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or not assigned to you'
      })
    }

    await ticket.resume(req.user)

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket resumed'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Resolve ticket
 * @route   PUT /api/tickets/:id/resolve
 * @access  Private
 */
router.put('/:id/resolve', async (req, res) => {
  try {
    const { resolution, resolutionType = 'resolved' } = req.body

    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'Resolution is required'
      })
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Check if user can resolve - assignee or admin
    const canResolve =
      ['super_admin', 'company_admin', 'manager'].includes(req.user.role) ||
      ticket.assignedTo?.toString() === req.user._id.toString()

    if (!canResolve) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to resolve this ticket'
      })
    }

    await ticket.resolve(req.user, resolution, resolutionType)

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket resolved'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Close ticket
 * @route   PUT /api/tickets/:id/close
 * @access  Private
 */
router.put('/:id/close', async (req, res) => {
  try {
    const { remarks } = req.body

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Only requestor or admin can close
    if (ticket.requestedBy.toString() !== req.user._id.toString() &&
        !['super_admin', 'company_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to close this ticket'
      })
    }

    await ticket.close(req.user, remarks)

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket closed'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Reopen ticket
 * @route   PUT /api/tickets/:id/reopen
 * @access  Private
 */
router.put('/:id/reopen', async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      })
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      requestedBy: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    await ticket.reopen(req.user, reason)

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket reopened'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Cancel ticket
 * @route   PUT /api/tickets/:id/cancel
 * @access  Private
 */
router.put('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required'
      })
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      requestedBy: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    await ticket.cancel(req.user, reason)

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket cancelled'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Escalate ticket
 * @route   PUT /api/tickets/:id/escalate
 * @access  Private
 */
router.put('/:id/escalate', async (req, res) => {
  try {
    const { escalateToId, reason } = req.body

    if (!escalateToId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Escalation target and reason are required'
      })
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    const escalateTo = await User.findById(escalateToId)
    if (!escalateTo) {
      return res.status(404).json({
        success: false,
        message: 'Escalation target not found'
      })
    }

    await ticket.escalate(req.user, escalateTo, reason)

    res.json({
      success: true,
      data: ticket,
      message: `Ticket escalated to ${escalateTo.name}`
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

// ==================== COMMENTS & ATTACHMENTS ====================

/**
 * @desc    Add comment to ticket
 * @route   POST /api/tickets/:id/comments
 * @access  Private
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { comment, isInternal = false, attachments } = req.body

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      })
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    // Check access
    const hasAccess =
      ['super_admin', 'company_admin'].includes(req.user.role) ||
      ticket.requestedBy.toString() === req.user._id.toString() ||
      ticket.assignedTo?.toString() === req.user._id.toString()

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this ticket'
      })
    }

    // Only support staff can add internal notes
    const canAddInternal =
      ['super_admin', 'company_admin'].includes(req.user.role) ||
      ticket.assignedTo?.toString() === req.user._id.toString()

    ticket.addComment(comment, req.user, isInternal && canAddInternal, attachments)
    await ticket.save()

    res.json({
      success: true,
      data: ticket.comments[ticket.comments.length - 1],
      message: 'Comment added'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Add attachment to ticket
 * @route   POST /api/tickets/:id/attachments
 * @access  Private
 */
router.post('/:id/attachments', async (req, res) => {
  try {
    const { fileName, fileUrl, fileType, fileSize } = req.body

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    ticket.attachments.push({
      fileName,
      fileUrl,
      fileType,
      fileSize,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name
    })

    ticket.addActivity('attachment_added', `Attachment "${fileName}" added by ${req.user.name}`, req.user)

    await ticket.save()

    res.json({
      success: true,
      data: ticket.attachments[ticket.attachments.length - 1],
      message: 'Attachment added'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Upload attachments to ticket (file upload)
 * @route   POST /api/tickets/:id/upload
 * @access  Private
 */
router.post('/:id/upload', uploadTicketDocs.array('files', 5), async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      })
    }

    const uploadedFiles = []

    for (const file of req.files) {
      const attachment = {
        fileName: file.originalname,
        fileUrl: `/uploads/tickets/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: req.user._id,
        uploadedByName: req.user.name
      }

      ticket.attachments.push(attachment)
      uploadedFiles.push(attachment)
    }

    ticket.addActivity(
      'attachment_added',
      `${uploadedFiles.length} file(s) uploaded by ${req.user.name}`,
      req.user
    )

    await ticket.save()

    res.json({
      success: true,
      data: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Delete attachment from ticket
 * @route   DELETE /api/tickets/:id/attachments/:attachmentId
 * @access  Private
 */
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    const attachmentIndex = ticket.attachments.findIndex(
      att => att._id.toString() === req.params.attachmentId
    )

    if (attachmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      })
    }

    const removedAttachment = ticket.attachments[attachmentIndex]
    ticket.attachments.splice(attachmentIndex, 1)

    ticket.addActivity(
      'attachment_removed',
      `Attachment "${removedAttachment.fileName}" removed by ${req.user.name}`,
      req.user
    )

    await ticket.save()

    res.json({
      success: true,
      message: 'Attachment deleted'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Rate ticket
 * @route   POST /api/tickets/:id/rate
 * @access  Private
 */
router.post('/:id/rate', async (req, res) => {
  try {
    const { rating, feedback } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      })
    }

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      requestedBy: req.user._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    await ticket.rate(req.user, rating, feedback)

    res.json({
      success: true,
      data: ticket,
      message: 'Thank you for your feedback'
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Add watcher to ticket
 * @route   POST /api/tickets/:id/watchers
 * @access  Private
 */
router.post('/:id/watchers', async (req, res) => {
  try {
    const { userId } = req.body

    const ticket = await Ticket.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      })
    }

    if (!ticket.watchers.includes(userId)) {
      ticket.watchers.push(userId)
      const user = await User.findById(userId)
      ticket.addActivity('watcher_added', `${user?.name || 'User'} added as watcher`, req.user)
      await ticket.save()
    }

    res.json({
      success: true,
      message: 'Watcher added'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router
