import Project from '../models/Project.js'
import Company from '../models/Company.js'
import PurchaseOrder from '../models/PurchaseOrder.js'
import GoodsReceipt from '../models/GoodsReceipt.js'
import CustomerInvoice from '../models/CustomerInvoice.js'
import Payment from '../models/Payment.js'
import WorkOrder from '../models/WorkOrder.js'
import PurchaseRequisition from '../models/PurchaseRequisition.js'
import PaymentMilestone from '../models/PaymentMilestone.js'

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public (filtered) / Private (all)
export const getProjects = async (req, res) => {
  try {
    const { category, status, isFeatured, page = 1, limit = 12, search } = req.query

    const query = {}

    // If user is authenticated and has company context, filter by company
    if (req.user && req.activeCompany) {
      query.company = req.activeCompany._id
      if (status) query.status = status
    } else if (!req.user || !['admin', 'superadmin', 'super_admin', 'company_admin'].includes(req.user?.role)) {
      // Public access only sees published projects
      query['portfolio.isPublished'] = true
    } else if (status) {
      query.status = status
    }

    if (category) query.category = category
    if (isFeatured) query['portfolio.isFeatured'] = isFeatured === 'true'

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { projectId: { $regex: search, $options: 'i' } },
        { 'portfolio.tags': { $in: [new RegExp(search, 'i')] } }
      ]
    }

    const total = await Project.countDocuments(query)
    const projects = await Project.find(query)
      .populate('customer', 'name customerId')
      .populate('projectManager', 'name email')
      .sort({ 'portfolio.isFeatured': -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('customer', 'name customerId email phone')
      .populate('projectManager', 'name email avatar')
      .populate('createdBy', 'name')
      .populate('teamMembers.user', 'name email avatar')

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    // Increment views
    project.views += 1
    await project.save()

    res.json({
      success: true,
      data: project
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Create project
// @route   POST /api/projects
// @access  Private/Admin
export const createProject = async (req, res) => {
  try {
    const companyId = req.activeCompany?._id

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company context is required'
      })
    }

    // Get company for ID generation
    const company = await Company.findById(companyId)
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'Company not found'
      })
    }

    // Generate project ID
    const projectId = await company.generateId('project')

    // Build project data
    const projectData = {
      ...req.body,
      projectId,
      company: companyId,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: `Project created by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    }

    // Handle financials if budget is provided
    if (req.body.budget) {
      projectData.financials = {
        quotedAmount: parseFloat(req.body.budget) || 0,
        agreedAmount: parseFloat(req.body.budget) || 0
      }
    }

    const project = await Project.create(projectData)

    // Populate for response
    await project.populate('customer', 'name customerId')

    res.status(201).json({
      success: true,
      data: project
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private/Admin
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    res.json({
      success: true,
      data: project
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id)

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Toggle featured status
// @route   PUT /api/projects/:id/featured
// @access  Private/Admin
export const toggleFeatured = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    project.isFeatured = !project.isFeatured
    await project.save()

    res.json({
      success: true,
      data: project
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Get project kanban detail with all ERP records
// @route   GET /api/projects/:id/kanban-detail
// @access  Private
export const getProjectKanbanDetail = async (req, res) => {
  try {
    const { id } = req.params

    // Run project fetch + 7 ERP queries in parallel
    const [project, purchaseOrders, goodsReceipts, invoices, payments, workOrders, purchaseRequisitions, paymentMilestones] = await Promise.all([
      Project.findById(id)
        .populate('customer', 'name customerId email phone company')
        .populate('projectManager', 'name email avatar employeeId department')
        .populate('createdBy', 'name')
        .populate('teamMembers.user', 'name email avatar employeeId department'),
      PurchaseOrder.find({ project: id })
        .populate('vendor', 'name vendorId')
        .select('poNumber vendor orderDate expectedDeliveryDate status poTotal lineItems paymentTerms approvalStatus')
        .sort({ createdAt: -1 })
        .lean(),
      GoodsReceipt.find({ project: id })
        .populate('vendor', 'name vendorId')
        .populate('purchaseOrder', 'poNumber')
        .select('grnNumber purchaseOrder vendor receiptDate status totalReceivedQuantity totalAcceptedQuantity totalRejectedQuantity qualityInspection lineItems')
        .sort({ createdAt: -1 })
        .lean(),
      CustomerInvoice.find({ project: id })
        .populate('customer', 'name customerId')
        .select('invoiceNumber invoiceType invoiceDate dueDate status paymentStatus invoiceTotal paidAmount balanceAmount lineItems')
        .sort({ createdAt: -1 })
        .lean(),
      Payment.find({ project: id })
        .populate('vendor', 'name vendorId')
        .populate('customer', 'name customerId')
        .select('paymentNumber paymentType paymentDate amount paymentMethod status purpose referenceNumber vendor customer')
        .sort({ createdAt: -1 })
        .lean(),
      WorkOrder.find({ project: id })
        .select('workOrderId item quantity schedule status progress priority assignedToName supervisorName laborTeam estimatedCost actualCost qualityStatus')
        .sort({ createdAt: -1 })
        .lean(),
      PurchaseRequisition.find({ project: id })
        .populate('requestedBy', 'name employeeId')
        .select('prNumber requestDate requiredDate status priority estimatedTotal lineItems requestedBy linkedPurchaseOrders')
        .sort({ createdAt: -1 })
        .lean(),
      PaymentMilestone.find({ project: id })
        .select('milestoneId name description type order percentage amount totalAmount collectedAmount pendingAmount gstAmount gstPercentage dueDate status invoiceGenerated invoiceNumber payments triggerCondition')
        .sort({ order: 1 })
        .lean(),
    ])

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      })
    }

    res.json({
      success: true,
      data: {
        project,
        purchaseOrders,
        goodsReceipts,
        invoices,
        payments,
        workOrders,
        purchaseRequisitions,
        paymentMilestones,
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
