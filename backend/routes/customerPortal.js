import express from 'express'
import CustomerInvoice from '../models/CustomerInvoice.js'
import Project from '../models/Project.js'
import Survey from '../models/Survey.js'
import DesignIteration from '../models/DesignIteration.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

import Customer from '../models/Customer.js'
import Lead from '../models/Lead.js'
import SalesOrder from '../models/SalesOrder.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const router = express.Router()

// Customer Portal Login (public - no auth required)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    const customer = await Customer.findOne({ email }).select('+portalAccess.password')
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    if (!customer.portalAccess?.enabled) {
      return res.status(403).json({ success: false, message: 'Portal access is not enabled for this account' })
    }

    const isMatch = await bcrypt.compare(password, customer.portalAccess.password)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Update login stats
    customer.portalAccess.lastLogin = new Date()
    customer.portalAccess.loginCount = (customer.portalAccess.loginCount || 0) + 1
    await customer.save()

    const token = jwt.sign(
      { id: customer._id, type: 'customer', companyId: customer.company },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    )

    res.json({
      success: true,
      token,
      data: {
        _id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

router.use(protect)
router.use(setCompanyContext)

// List customer's invoices
router.get('/invoices', async (req, res) => {
  try {
    const {
      customerId,
      status,
      paymentStatus,
      page = 1,
      limit = 20,
      sortBy = 'invoiceDate',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    // Filter by customerId from query or fall back to req.user-linked customer
    if (customerId) {
      queryFilter.customer = customerId
    }

    if (status) queryFilter.status = status
    if (paymentStatus) queryFilter.paymentStatus = paymentStatus

    const total = await CustomerInvoice.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const invoices = await CustomerInvoice.find(queryFilter)
      .populate('customer', 'name customerId email')
      .populate('project', 'title projectId')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('invoiceNumber invoiceDate dueDate invoiceTotal paidAmount balanceAmount status paymentStatus customer project invoiceType')

    res.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Generate invoice PDF placeholder
router.get('/invoices/:id/pdf', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    res.json({
      success: true,
      pdfUrl: '/placeholder',
      message: 'PDF generation endpoint placeholder. Integrate PDF library for production.'
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Generate payment link placeholder
router.post('/invoices/:id/payment-link', async (req, res) => {
  try {
    const invoice = await CustomerInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    if (invoice.balanceAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already fully paid'
      })
    }

    res.json({
      success: true,
      paymentUrl: '/placeholder',
      message: 'Payment link generation endpoint placeholder. Integrate payment gateway for production.',
      data: {
        invoiceNumber: invoice.invoiceNumber,
        balanceAmount: invoice.balanceAmount,
        currency: invoice.currency
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List pending design approvals for customer
router.get('/design-approvals', async (req, res) => {
  try {
    const {
      customerId,
      projectId,
      status,
      page = 1,
      limit = 20
    } = req.query

    const queryFilter = companyScopedQuery(req)

    // Only show iterations that are submitted/under_review (pending customer action)
    if (status) {
      queryFilter.status = status
    } else {
      queryFilter.status = { $in: ['submitted', 'under_review'] }
    }

    if (customerId) queryFilter.customer = customerId
    if (projectId) queryFilter.project = projectId

    const total = await DesignIteration.countDocuments(queryFilter)

    const iterations = await DesignIteration.find(queryFilter)
      .populate('project', 'title projectId')
      .populate('customer', 'name customerId')
      .populate('designer', 'name email')
      .populate('designLead', 'name email')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('iterationId version title phase status clientApproval designHeadApproval timeline project customer designer designerName files.name files.type files.status')

    res.json({
      success: true,
      data: iterations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve/reject design
router.put('/design-approvals/:id', async (req, res) => {
  try {
    const { action, comments } = req.body

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be one of: approve, reject'
      })
    }

    const iteration = await DesignIteration.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: { $in: ['submitted', 'under_review'] }
    })

    if (!iteration) {
      return res.status(404).json({
        success: false,
        message: 'Design iteration not found or not available for review'
      })
    }

    if (action === 'approve') {
      iteration.clientApproval = {
        isApproved: true,
        approvedBy: req.user._id,
        approvedByName: req.user.name,
        approvedAt: new Date(),
        approvalMethod: 'email',
        approvalRemarks: comments || ''
      }

      // If design head approval is also done, mark as fully approved
      if (iteration.designHeadApproval && iteration.designHeadApproval.isApproved) {
        iteration.status = 'approved'
        iteration.timeline.completedAt = new Date()
      }

      iteration.activities.push({
        action: 'client_approved',
        description: 'Design approved by customer via portal',
        performedBy: req.user._id,
        performedByName: req.user.name
      })
    } else {
      // Reject - request changes
      iteration.status = 'changes_requested'

      iteration.feedback.push({
        feedbackBy: req.user._id,
        feedbackByName: req.user.name,
        isClient: true,
        isInternal: false,
        type: 'revision',
        comments: comments || 'Changes requested',
        givenAt: new Date()
      })

      iteration.activities.push({
        action: 'feedback_added',
        description: 'Design rejected by customer via portal - changes requested',
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata: { type: 'revision', isClient: true }
      })
    }

    await iteration.save()

    res.json({
      success: true,
      message: action === 'approve' ? 'Design approved successfully' : 'Revision requested successfully',
      data: {
        _id: iteration._id,
        iterationId: iteration.iterationId,
        version: iteration.version,
        status: iteration.status,
        clientApproval: iteration.clientApproval
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List pending surveys for customer
router.get('/surveys', async (req, res) => {
  try {
    const {
      customerId,
      surveyType,
      page = 1,
      limit = 20
    } = req.query

    const queryFilter = companyScopedQuery(req, { isActive: true })

    if (surveyType) queryFilter.surveyType = surveyType

    const total = await Survey.countDocuments(queryFilter)

    const surveys = await Survey.find(queryFilter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('surveyId surveyType title questions isActive trigger responseCount averageNPS averageCSAT createdAt')

    // If customerId provided, mark which surveys the customer has already responded to
    const surveysWithStatus = surveys.map(survey => {
      const surveyObj = survey.toObject()
      if (customerId) {
        // Check if customer already responded (responses are embedded, load separately if needed)
        surveyObj.hasResponded = false // Default; full check would require loading responses
      }
      return surveyObj
    })

    res.json({
      success: true,
      data: surveysWithStatus,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Submit survey response
router.post('/surveys/:id/respond', async (req, res) => {
  try {
    const { answers, respondent, customerId, projectId, npsScore, csatScore } = req.body

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Answers array is required'
      })
    }

    const survey = await Survey.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      isActive: true
    })

    if (!survey) {
      return res.status(404).json({ success: false, message: 'Survey not found or inactive' })
    }

    // Validate required questions have answers
    const missingRequired = survey.questions.filter((q, index) => {
      if (!q.required) return false
      const answer = answers.find(a => a.questionIndex === index)
      return !answer || answer.answer === undefined || answer.answer === null || answer.answer === ''
    })

    if (missingRequired.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required answers for questions: ${missingRequired.map(q => q.questionText).join(', ')}`
      })
    }

    // Build response object
    const response = {
      respondent: respondent || {
        name: req.user.name,
        email: req.user.email
      },
      customer: customerId || undefined,
      project: projectId || undefined,
      answers: answers.map(a => ({
        questionIndex: a.questionIndex,
        answer: a.answer
      })),
      submittedAt: new Date()
    }

    // Set NPS/CSAT scores if provided
    if (npsScore !== undefined && npsScore !== null) {
      response.npsScore = parseInt(npsScore)
    }
    if (csatScore !== undefined && csatScore !== null) {
      response.csatScore = parseInt(csatScore)
    }

    survey.responses.push(response)
    await survey.save() // Pre-save hook recalculates averages and responseCount

    res.json({
      success: true,
      message: 'Survey response submitted successfully',
      data: {
        surveyId: survey.surveyId,
        responseCount: survey.responseCount,
        averageNPS: survey.averageNPS,
        averageCSAT: survey.averageCSAT
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Customer journey timeline
router.get('/journey', async (req, res) => {
  try {
    const { customerId } = req.query
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required' })
    }

    const customer = await Customer.findById(customerId)
      .select('customerId name email phone status segment createdAt')
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    // Get the original lead
    const lead = await Lead.findOne({ customer: customerId })
      .select('leadId qualifiedLeadId primaryStatus dateTracking scheduledMeeting requirementMeeting createdAt')

    // Get sales orders
    const salesOrders = await SalesOrder.find({ customer: customerId })
      .select('salesOrderId title status costEstimation.finalAmount timeline createdAt')
      .sort({ createdAt: -1 })

    // Get projects
    const projects = await Project.find({ customer: customerId })
      .select('projectId title stage status timeline createdAt')
      .sort({ createdAt: -1 })

    // Get design iterations
    const designIterations = await DesignIteration.find({ customer: customerId })
      .select('iterationId version phase status files.name files.type files.url timeline createdAt')
      .sort({ createdAt: -1 })

    // Get invoices
    const invoices = await CustomerInvoice.find({ customer: customerId })
      .select('invoiceNumber invoiceDate dueDate invoiceTotal paidAmount balanceAmount status paymentStatus')
      .sort({ invoiceDate: -1 })

    res.json({
      success: true,
      data: {
        customer,
        lead,
        salesOrders,
        projects,
        designIterations,
        invoices,
        timeline: buildJourneyTimeline(lead, salesOrders, projects, designIterations, invoices)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Helper to build timeline
function buildJourneyTimeline(lead, salesOrders, projects, designIterations, invoices) {
  const events = []

  if (lead) {
    events.push({ date: lead.createdAt, type: 'lead_created', title: 'Inquiry Received', description: `Lead ${lead.leadId} created` })
    if (lead.dateTracking?.qualifiedDate) {
      events.push({ date: lead.dateTracking.qualifiedDate, type: 'lead_qualified', title: 'Lead Qualified', description: `Qualified as ${lead.qualifiedLeadId}` })
    }
    if (lead.dateTracking?.firstSalesMeetingDate) {
      events.push({ date: lead.dateTracking.firstSalesMeetingDate, type: 'meeting', title: 'First Sales Meeting', description: 'Sales meeting scheduled' })
    }
    if (lead.dateTracking?.designMeetingDate) {
      events.push({ date: lead.dateTracking.designMeetingDate, type: 'design', title: 'Design Team Assigned', description: 'Design process initiated' })
    }
  }

  salesOrders.forEach(so => {
    events.push({ date: so.createdAt, type: 'sales_order', title: `Sales Order: ${so.salesOrderId}`, description: so.title || so.status })
  })

  designIterations.forEach(di => {
    events.push({ date: di.createdAt, type: 'design_iteration', title: `Design v${di.version}`, description: `Phase: ${di.phase} - Status: ${di.status}` })
  })

  projects.forEach(p => {
    events.push({ date: p.createdAt, type: 'project', title: `Project: ${p.projectId}`, description: `Stage: ${p.stage}` })
  })

  invoices.forEach(inv => {
    events.push({ date: inv.invoiceDate, type: 'invoice', title: `Invoice: ${inv.invoiceNumber}`, description: `Amount: \u20b9${inv.invoiceTotal?.toLocaleString('en-IN')}` })
  })

  return events.sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Get customer profile
router.get('/profile', async (req, res) => {
  try {
    const { customerId } = req.query
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID is required' })
    }

    const customer = await Customer.findById(customerId)
      .select('-portalAccess.password -portalAccess.passwordResetToken')
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    res.json({ success: true, data: customer })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
