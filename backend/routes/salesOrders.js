import express from 'express'
import SalesOrder from '../models/SalesOrder.js'
import Lead from '../models/Lead.js'
import Customer from '../models/Customer.js'
import Project from '../models/Project.js'
import Company from '../models/Company.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  requireModulePermission,
  canAccessLead,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'
import { notifyEvent } from '../utils/notificationService.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all sales orders (company-scoped)
 * @route   GET /api/sales-orders
 * @access  Private
 */
router.get('/',
  requireModulePermission('sales_orders', 'view'),
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const {
        status,
        salesPerson,
        dateFrom,
        dateTo,
        minValue,
        maxValue,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = req.query

      const queryFilter = companyScopedQuery(req)

      if (status) queryFilter.status = status
      if (salesPerson) queryFilter.salesPerson = salesPerson

      // Date range filter
      if (dateFrom || dateTo) {
        queryFilter.createdAt = {}
        if (dateFrom) queryFilter.createdAt.$gte = new Date(dateFrom)
        if (dateTo) queryFilter.createdAt.$lte = new Date(dateTo)
      }

      // Value range filter
      if (minValue || maxValue) {
        queryFilter['costEstimation.finalAmount'] = {}
        if (minValue) queryFilter['costEstimation.finalAmount'].$gte = parseFloat(minValue)
        if (maxValue) queryFilter['costEstimation.finalAmount'].$lte = parseFloat(maxValue)
      }

      // Search filter
      if (search) {
        queryFilter.$or = [
          { salesOrderId: { $regex: search, $options: 'i' } },
          { title: { $regex: search, $options: 'i' } }
        ]
      }

      const total = await SalesOrder.countDocuments(queryFilter)

      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

      const orders = await SalesOrder.find(queryFilter)
        .populate('lead', 'name phone leadId primaryStatus')
        .populate('customer', 'name customerId')
        .populate('project', 'title projectId')
        .populate('salesPerson', 'name email avatar')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      res.json({
        success: true,
        data: orders,
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
 * @desc    Get single sales order
 * @route   GET /api/sales-orders/:id
 * @access  Private
 */
router.get('/:id',
  requireModulePermission('sales_orders', 'view'),
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const order = await SalesOrder.findById(req.params.id)
        .populate('lead', 'name phone email leadId primaryStatus secondaryStatus')
        .populate('customer', 'name customerId email phone')
        .populate('project', 'title projectId status')
        .populate('salesPerson', 'name email avatar')
        .populate('salesTeam.user', 'name email')
        .populate('activities.performedBy', 'name avatar')

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        })
      }

      // Check company access
      if (req.user.role !== 'super_admin' &&
          order.company.toString() !== req.activeCompany._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      res.json({
        success: true,
        data: order
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
 * @desc    Create sales order from lead
 * @route   POST /api/sales-orders
 * @access  Private
 */
router.post('/',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { leadId, title, category, projectScope, boq, bom, costEstimation, timeline, terms } = req.body

      const lead = await Lead.findById(leadId)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Check if lead is qualified
      if (lead.primaryStatus !== 'qualified') {
        return res.status(400).json({
          success: false,
          message: 'Lead must be qualified before creating a sales order'
        })
      }

      // Check if sales order already exists
      if (lead.salesOrder) {
        return res.status(400).json({
          success: false,
          message: 'Sales order already exists for this lead'
        })
      }

      // Get company for ID generation
      const company = await Company.findById(req.activeCompany._id)
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        })
      }

      // Generate sales order ID
      const salesOrderId = await company.generateId('salesOrder')

      const salesOrder = await SalesOrder.create({
        salesOrderId,
        company: req.activeCompany._id,
        lead: leadId,
        customer: lead.customer,
        title: title || `Sales Order - ${lead.name}`,
        category: category || 'interior',
        projectScope,
        salesPerson: req.user._id,
        salesPersonName: req.user.name,
        boq: boq || [],
        bom: bom || [],
        costEstimation: costEstimation || {
          isTentative: true
        },
        timeline,
        terms,
        status: 'draft',
        activities: [{
          action: 'created',
          description: `Sales order created by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        }],
        createdBy: req.user._id,
        createdByName: req.user.name
      })

      // Update lead with sales order reference
      lead.salesOrder = salesOrder._id
      lead.activities.push({
        action: 'sales_order_created',
        description: `Sales order ${salesOrderId} created`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })
      lead.lastActivityAt = new Date()
      await lead.save()

      await salesOrder.populate('salesPerson', 'name email avatar')

      res.status(201).json({
        success: true,
        data: salesOrder,
        message: 'Sales order created successfully'
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
 * @desc    Update sales order
 * @route   PUT /api/sales-orders/:id
 * @access  Private
 */
router.put('/:id',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const order = await SalesOrder.findById(req.params.id)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        })
      }

      // Check if order can be edited
      if (['approved', 'project_created', 'cancelled'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit sales order in current status'
        })
      }

      // Check company access
      if (req.user.role !== 'super_admin' &&
          order.company.toString() !== req.activeCompany._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      const allowedFields = [
        'title', 'projectScope', 'boq', 'bom', 'costEstimation',
        'timeline', 'terms', 'discountApplied', 'specialConditions'
      ]

      const updates = {}
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field]
        }
      }

      // Track changes
      order.activities.push({
        action: 'updated',
        description: `Sales order updated by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata: { fields: Object.keys(updates) }
      })

      Object.assign(order, updates)
      await order.save()

      await order.populate('salesPerson', 'name email avatar')

      res.json({
        success: true,
        data: order,
        message: 'Sales order updated successfully'
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
 * @desc    Add BOQ item to sales order
 * @route   POST /api/sales-orders/:id/boq
 * @access  Private
 */
router.post('/:id/boq',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const order = await SalesOrder.findById(req.params.id)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        })
      }

      if (['approved', 'project_created'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify BOQ after approval'
        })
      }

      await order.addBOQItem(req.body, req.user._id, req.user.name)

      res.json({
        success: true,
        data: order,
        message: 'BOQ item added successfully'
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
 * @desc    Add BOM item to sales order
 * @route   POST /api/sales-orders/:id/bom
 * @access  Private
 */
router.post('/:id/bom',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const order = await SalesOrder.findById(req.params.id)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        })
      }

      if (['approved', 'project_created'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify BOM after approval'
        })
      }

      await order.addBOMItem(req.body, req.user._id, req.user.name)

      res.json({
        success: true,
        data: order,
        message: 'BOM item added successfully'
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
 * @desc    Submit sales order for review
 * @route   PUT /api/sales-orders/:id/submit
 * @access  Private
 */
router.put('/:id/submit',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const order = await SalesOrder.findById(req.params.id)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        })
      }

      if (order.status !== 'draft') {
        return res.status(400).json({
          success: false,
          message: 'Only draft orders can be submitted'
        })
      }

      // Validate required fields
      if (!order.boq || order.boq.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'BOQ is required to submit sales order'
        })
      }

      await order.updateStatus('submitted', req.user._id, req.user.name, 'Submitted for review')

      // Notify sales person's managers
      const submitRecipients = []
      if (order.salesPerson) submitRecipients.push(order.salesPerson.toString())
      notifyEvent({
        companyId: order.company,
        event: 'sales_order_submitted',
        entityType: 'sales_order',
        entityId: order._id,
        title: 'Sales Order Submitted for Review',
        message: `Sales order ${order.salesOrderId} "${order.title}" has been submitted for review by ${req.user.name}.`,
        recipientUserIds: submitRecipients,
        performedBy: req.user._id,
        metadata: { entityLabel: order.salesOrderId, status: 'submitted' }
      })

      res.json({
        success: true,
        data: order,
        message: 'Sales order submitted for review'
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
 * @desc    Add negotiation round
 * @route   POST /api/sales-orders/:id/negotiate
 * @access  Private
 */
router.post('/:id/negotiate',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const {
        clientRequests,
        proposedChanges,
        revisedAmount,
        negotiatedBy,
        meetingNotes
      } = req.body

      const order = await SalesOrder.findById(req.params.id)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        })
      }

      if (['approved', 'project_created', 'cancelled'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot negotiate in current status'
        })
      }

      await order.addNegotiation({
        clientRequests,
        proposedChanges,
        revisedAmount,
        negotiatedBy: negotiatedBy || req.user._id,
        meetingNotes
      }, req.user._id, req.user.name)

      res.json({
        success: true,
        data: order,
        message: 'Negotiation round recorded'
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
 * @desc    Approve sales order
 * @route   PUT /api/sales-orders/:id/approve
 * @access  Private (Manager+)
 */
router.put('/:id/approve',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_CONVERT),
  async (req, res) => {
    try {
      const { remarks } = req.body
      const order = await SalesOrder.findById(req.params.id)

      if (!order) {
        return res.status(404).json({ success: false, message: 'Sales order not found' })
      }

      if (order.status !== 'submitted' && order.status !== 'revised') {
        return res.status(400).json({
          success: false,
          message: 'Only submitted or revised orders can be approved'
        })
      }

      await order.updateStatus('approved', req.user._id, req.user.name, remarks || 'Approved')

      notifyEvent({
        companyId: order.company,
        event: 'sales_order_approved',
        entityType: 'sales_order',
        entityId: order._id,
        title: 'Sales Order Approved',
        message: `Sales order ${order.salesOrderId} "${order.title}" has been approved by ${req.user.name}.`,
        recipientUserIds: order.salesPerson ? [order.salesPerson.toString()] : [],
        performedBy: req.user._id,
        metadata: { entityLabel: order.salesOrderId, status: 'approved' }
      })

      res.json({ success: true, data: order, message: 'Sales order approved successfully' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

/**
 * @desc    Reject sales order
 * @route   PUT /api/sales-orders/:id/reject
 * @access  Private (Manager+)
 */
router.put('/:id/reject',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_CONVERT),
  async (req, res) => {
    try {
      const { reason } = req.body

      if (!reason) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required' })
      }

      const order = await SalesOrder.findById(req.params.id)

      if (!order) {
        return res.status(404).json({ success: false, message: 'Sales order not found' })
      }

      if (order.status !== 'submitted' && order.status !== 'revised') {
        return res.status(400).json({
          success: false,
          message: 'Only submitted or revised orders can be rejected'
        })
      }

      await order.updateStatus('rejected', req.user._id, req.user.name, reason)

      notifyEvent({
        companyId: order.company,
        event: 'sales_order_rejected',
        entityType: 'sales_order',
        entityId: order._id,
        title: 'Sales Order Rejected',
        message: `Sales order ${order.salesOrderId} "${order.title}" has been rejected by ${req.user.name}. Reason: ${reason}`,
        recipientUserIds: order.salesPerson ? [order.salesPerson.toString()] : [],
        performedBy: req.user._id,
        metadata: { entityLabel: order.salesOrderId, status: 'rejected' }
      })

      res.json({ success: true, data: order, message: 'Sales order rejected' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

/**
 * @desc    Close sales order as won (create project)
 * @route   POST /api/sales-orders/:id/close-won
 * @access  Private
 */
router.post('/:id/close-won',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_CONVERT),
  async (req, res) => {
    try {
      const { projectTitle, projectType, deliverables } = req.body

      const order = await SalesOrder.findById(req.params.id)
        .populate('lead')
        .populate('customer')

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        })
      }

      if (order.status !== 'submitted' && order.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Sales order must be submitted or approved to close as won'
        })
      }

      // Close the order and create project
      const result = await order.closeAsWon(
        {
          projectTitle: projectTitle || `Project - ${order.lead?.name || 'Customer'}`,
          projectType,
          deliverables
        },
        req.user._id,
        req.user.name
      )

      // Update lead
      const lead = await Lead.findById(order.lead)
      if (lead) {
        lead.activities.push({
          action: 'sales_order_won',
          description: `Sales order ${order.salesOrderId} closed as won. Project created.`,
          performedBy: req.user._id,
          performedByName: req.user.name
        })
        lead.lastActivityAt = new Date()
        await lead.save()
      }

      await order.populate('project', 'title projectId')

      // Notify sales person, customer, and operations
      const wonRecipients = []
      if (order.salesPerson) wonRecipients.push(order.salesPerson.toString())
      notifyEvent({
        companyId: order.company,
        event: 'sales_order_won',
        entityType: 'sales_order',
        entityId: order._id,
        title: 'Sales Order Won - Project Created',
        message: `Sales order ${order.salesOrderId} "${order.title}" has been closed as won by ${req.user.name}. A new project has been created.`,
        recipientUserIds: wonRecipients,
        recipientCustomerIds: order.customer ? [order.customer.toString()] : [],
        performedBy: req.user._id,
        metadata: { entityLabel: order.salesOrderId, status: 'won' }
      })

      res.json({
        success: true,
        data: {
          salesOrder: order,
          project: result.project
        },
        message: 'Sales order closed as won. Project created successfully.'
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
 * @desc    Cancel sales order
 * @route   PUT /api/sales-orders/:id/cancel
 * @access  Private
 */
router.put('/:id/cancel',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { reason } = req.body

      const order = await SalesOrder.findById(req.params.id)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        })
      }

      if (order.status === 'project_created') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel sales order after project is created'
        })
      }

      await order.updateStatus('cancelled', req.user._id, req.user.name, reason || 'Cancelled')

      // Update lead
      const lead = await Lead.findById(order.lead)
      if (lead) {
        lead.salesOrder = null
        lead.activities.push({
          action: 'sales_order_cancelled',
          description: `Sales order ${order.salesOrderId} cancelled: ${reason || 'No reason provided'}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        })
        await lead.save()
      }

      // Notify sales person and customer
      const cancelRecipients = []
      if (order.salesPerson) cancelRecipients.push(order.salesPerson.toString())
      notifyEvent({
        companyId: order.company,
        event: 'sales_order_cancelled',
        entityType: 'sales_order',
        entityId: order._id,
        title: 'Sales Order Cancelled',
        message: `Sales order ${order.salesOrderId} "${order.title}" has been cancelled by ${req.user.name}. Reason: ${reason || 'No reason provided'}`,
        recipientUserIds: cancelRecipients,
        recipientCustomerIds: order.customer ? [order.customer.toString()] : [],
        performedBy: req.user._id,
        metadata: { entityLabel: order.salesOrderId, status: 'cancelled' }
      })

      res.json({
        success: true,
        data: order,
        message: 'Sales order cancelled'
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
 * @desc    Get sales order statistics
 * @route   GET /api/sales-orders/stats/summary
 * @access  Private
 */
router.get('/stats/summary',
  requireModulePermission('sales_orders', 'view'),
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query
      const queryFilter = companyScopedQuery(req)

      if (startDate || endDate) {
        queryFilter.createdAt = {}
        if (startDate) queryFilter.createdAt.$gte = new Date(startDate)
        if (endDate) queryFilter.createdAt.$lte = new Date(endDate)
      }

      const stats = await SalesOrder.aggregate([
        { $match: queryFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$costEstimation.finalAmount' }
          }
        }
      ])

      const totalOrders = await SalesOrder.countDocuments(queryFilter)
      const totalValue = await SalesOrder.aggregate([
        { $match: queryFilter },
        { $group: { _id: null, total: { $sum: '$costEstimation.finalAmount' } } }
      ])

      res.json({
        success: true,
        data: {
          totalOrders,
          totalValue: totalValue[0]?.total || 0,
          byStatus: stats
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
 * @desc    Create subsequent sales order from existing customer
 * @route   POST /api/sales-orders/subsequent
 * @access  Private
 */
router.post('/subsequent',
  requireModulePermission('sales_orders', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const {
        customerId,
        parentSalesOrderId,
        title,
        category,
        costEstimation,
        timeline,
        terms,
        boq,
        bom,
        siteLocation,
        propertyDetails
      } = req.body

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'Customer ID is required for subsequent orders'
        })
      }

      const customer = await Customer.findById(customerId)
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        })
      }

      // Verify company access
      if (req.user.role !== 'super_admin' &&
          customer.company.toString() !== req.activeCompany._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      // Get parent sales order if provided
      let parentOrder = null
      if (parentSalesOrderId) {
        parentOrder = await SalesOrder.findById(parentSalesOrderId)
      }

      const company = await Company.findById(req.activeCompany._id)
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        })
      }

      const salesOrderId = await company.generateId('salesOrder')

      const salesOrder = await SalesOrder.create({
        salesOrderId,
        company: req.activeCompany._id,
        lead: customer.originalLead || null,
        customer: customerId,
        isSubsequent: true,
        parentSalesOrder: parentSalesOrderId || null,
        title: title || `Subsequent Order - ${customer.name}`,
        category: category || 'interior',
        salesPerson: req.user._id,
        salesPersonName: req.user.name,
        clientInfo: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          alternatePhone: customer.alternatePhone,
          address: customer.addresses?.[0]?.street,
          city: customer.addresses?.[0]?.city,
          state: customer.addresses?.[0]?.state,
          pincode: customer.addresses?.[0]?.pincode
        },
        siteLocation: siteLocation || {},
        propertyDetails: propertyDetails || {},
        boq: boq || [],
        bom: bom || [],
        costEstimation: costEstimation || { isTentative: true },
        timeline,
        terms,
        status: 'draft',
        activities: [{
          action: 'created',
          description: `Subsequent sales order created by ${req.user.name} for existing customer ${customer.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        }],
        createdBy: req.user._id,
        createdByName: req.user.name
      })

      await salesOrder.populate('customer', 'name customerId email phone')
      await salesOrder.populate('salesPerson', 'name email avatar')

      res.status(201).json({
        success: true,
        data: salesOrder,
        message: 'Subsequent sales order created successfully'
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
