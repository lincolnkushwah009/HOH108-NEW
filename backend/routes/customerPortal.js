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
import PaymentMilestone from '../models/PaymentMilestone.js'
import DailyProgressReport from '../models/DailyProgressReport.js'
import ProjectTaskInstance from '../models/ProjectTaskInstance.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { initiatePayment, checkPaymentStatus, verifyChecksum } from '../utils/phonePeService.js'
import { uploadSiteMedia } from '../middleware/upload.js'

const router = express.Router()

// Customer auth middleware - verifies customer portal JWT tokens
const protectCustomer = async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.type === 'customer') {
      const customer = await Customer.findById(decoded.id)
      if (!customer || !customer.portalAccess?.enabled) {
        return res.status(401).json({ success: false, message: 'Customer account not found or disabled' })
      }
      req.customer = customer
      req.activeCompany = { _id: decoded.companyId || customer.company }
      return next()
    }
    // Fall through to standard user auth if not a customer token
    return protect(req, res, next)
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

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

router.use(protectCustomer)

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
      .select('projectId title stage status category priority description financials budget timeline specifications location teamMembers departmentAssignments createdAt')
      .populate('projectManager', 'name phone designation avatar')
      .populate('teamMembers.user', 'name phone designation avatar')
      .populate('departmentAssignments.design.lead', 'name phone designation')
      .populate('departmentAssignments.design.team', 'name phone designation')
      .populate('departmentAssignments.operations.lead', 'name phone designation')
      .populate('departmentAssignments.operations.team', 'name phone designation')
      .sort({ createdAt: -1 })

    // Get design iterations
    const designIterations = await DesignIteration.find({ customer: customerId })
      .select('iterationId version phase status files.name files.type files.url timeline createdAt')
      .sort({ createdAt: -1 })

    // Get invoices
    const invoices = await CustomerInvoice.find({ customer: customerId })
      .select('invoiceNumber invoiceDate dueDate invoiceTotal paidAmount balanceAmount status paymentStatus')
      .sort({ invoiceDate: -1 })

    // Get payment milestones for all customer projects
    const projectIds = projects.map(p => p._id)
    const paymentMilestones = projectIds.length > 0
      ? await PaymentMilestone.find({ project: { $in: projectIds } })
          .select('name description amount collectedAmount status percentage dueDate project payments order')
          .sort({ order: 1, percentage: 1 })
      : []

    // Get daily progress reports (approved/submitted) with site photos
    const progressReports = projectIds.length > 0
      ? await DailyProgressReport.find({
          project: { $in: projectIds },
          status: { $in: ['submitted', 'reviewed', 'approved'] }
        })
          .select('reportDate overallProgress activities photos attachments weather issues manpower status project')
          .populate('submittedBy', 'name designation')
          .sort({ reportDate: -1 })
          .limit(30)
      : []

    // Get project milestones from project model
    const projectMilestones = projects.reduce((acc, p) => {
      if (p.milestones && p.milestones.length > 0) {
        acc.push(...p.milestones.map(m => ({ ...m.toObject ? m.toObject() : m, projectId: p.projectId, projectTitle: p.title })))
      }
      return acc
    }, [])

    // Get project images (before/during/after)
    const projectImages = projects.reduce((acc, p) => {
      if (p.images && p.images.length > 0) {
        acc.push(...p.images.map(img => ({ ...img.toObject ? img.toObject() : img, projectId: p.projectId, projectTitle: p.title })))
      }
      return acc
    }, [])

    // Collect all site photos from DPRs
    const sitePhotos = progressReports.reduce((acc, dpr) => {
      if (dpr.photos && dpr.photos.length > 0) {
        acc.push(...dpr.photos.map(photo => ({
          url: photo.url,
          caption: photo.caption,
          category: photo.category,
          uploadedAt: photo.uploadedAt || dpr.reportDate,
          reportDate: dpr.reportDate,
          submittedBy: dpr.submittedBy?.name || 'Site Team'
        })))
      }
      return acc
    }, [])

    // Build progress summary per project
    const progressSummary = projects.map(p => {
      const pReports = progressReports.filter(r => String(r.project) === String(p._id))
      const latestReport = pReports[0]
      return {
        projectId: p.projectId,
        projectTitle: p.title,
        stage: p.stage,
        status: p.status,
        completionPercentage: latestReport?.overallProgress?.actual || p.completion?.completionPercentage || 0,
        plannedProgress: latestReport?.overallProgress?.planned || 0,
        progressStatus: latestReport?.overallProgress?.status || 'on_track',
        variance: latestReport?.overallProgress?.variance || 0,
        totalReports: pReports.length,
        lastReportDate: latestReport?.reportDate,
        photoCount: sitePhotos.filter(ph => pReports.some(r => r.reportDate === ph.reportDate)).length
      }
    })

    res.json({
      success: true,
      data: {
        customer,
        lead,
        salesOrders,
        projects,
        designIterations,
        invoices,
        paymentMilestones,
        progressReports,
        progressSummary,
        sitePhotos,
        projectImages,
        projectMilestones,
        timeline: buildJourneyTimeline(lead, salesOrders, projects, designIterations, invoices, progressReports)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Helper to build timeline
function buildJourneyTimeline(lead, salesOrders, projects, designIterations, invoices, progressReports = []) {
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

  progressReports.forEach(dpr => {
    const progress = dpr.overallProgress?.actual || 0
    const photoCount = dpr.photos?.length || 0
    events.push({
      date: dpr.reportDate,
      type: 'progress_report',
      title: `Progress Update: ${progress}% complete`,
      description: `${dpr.activities?.length || 0} activities${photoCount > 0 ? `, ${photoCount} photos` : ''}`,
      photos: photoCount
    })
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

// ============================================
// KYC VERIFICATION ENDPOINTS
// ============================================

// Submit KYC documents
router.post('/kyc/submit', uploadSiteMedia.fields([
  { name: 'aadhar_doc', maxCount: 1 },
  { name: 'pan_doc', maxCount: 1 },
  { name: 'address_doc', maxCount: 1 }
]), async (req, res) => {
  try {
    const customerId = req.customer?._id || req.body.customerId
    const customer = await Customer.findById(customerId)
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    const { aadharNumber, panNumber, gstNumber, addressProofType, consent } = req.body

    if (!consent || consent !== 'true') {
      return res.status(400).json({ success: false, message: 'KYC consent is required as per Indian regulations' })
    }

    // Validate Aadhar (12 digits)
    if (aadharNumber && !/^\d{12}$/.test(aadharNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid Aadhar number. Must be 12 digits.' })
    }

    // Validate PAN (AAAAA9999A format)
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid PAN number. Format: ABCDE1234F' })
    }

    // Initialize KYC
    if (!customer.kyc) customer.kyc = {}

    // Aadhar
    if (aadharNumber) {
      const clean = aadharNumber.replace(/\s/g, '')
      customer.kyc.aadhar = {
        number: 'XXXX-XXXX-' + clean.slice(-4), // Store masked
        numberHash: crypto.createHash('sha256').update(clean).digest('hex'),
        name: customer.name,
        isVerified: false,
        documentUrl: req.files?.aadhar_doc?.[0] ? `/uploads/site-media/${req.files.aadhar_doc[0].filename}` : customer.kyc.aadhar?.documentUrl
      }
    }

    // PAN
    if (panNumber) {
      customer.kyc.pan = {
        number: panNumber.toUpperCase(),
        name: customer.name,
        isVerified: false,
        documentUrl: req.files?.pan_doc?.[0] ? `/uploads/site-media/${req.files.pan_doc[0].filename}` : customer.kyc.pan?.documentUrl
      }
    }

    // GST
    if (gstNumber) {
      customer.kyc.gst = { number: gstNumber.toUpperCase(), isVerified: false }
    }

    // Address Proof
    if (addressProofType) {
      customer.kyc.addressProof = {
        type: addressProofType,
        documentUrl: req.files?.address_doc?.[0] ? `/uploads/site-media/${req.files.address_doc[0].filename}` : customer.kyc.addressProof?.documentUrl,
        isVerified: false
      }
    }

    customer.kyc.status = 'documents_submitted'
    customer.kyc.consentGiven = true
    customer.kyc.consentDate = new Date()
    customer.kyc.consentIP = req.ip

    await customer.save()

    res.json({
      success: true,
      message: 'KYC documents submitted successfully. Verification in progress.',
      data: {
        status: customer.kyc.status,
        aadhar: customer.kyc.aadhar?.number ? { number: customer.kyc.aadhar.number, isVerified: false } : null,
        pan: customer.kyc.pan?.number ? { number: customer.kyc.pan.number, isVerified: false } : null,
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get KYC status
router.get('/kyc/status', async (req, res) => {
  try {
    const customerId = req.customer?._id || req.query.customerId
    const customer = await Customer.findById(customerId).select('kyc name email')
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    const kyc = customer.kyc || {}
    const isComplete = kyc.aadhar?.isVerified && kyc.pan?.isVerified

    res.json({
      success: true,
      data: {
        status: kyc.status || 'not_started',
        isComplete,
        canMakePayments: isComplete || kyc.status === 'verified',
        aadhar: kyc.aadhar ? { number: kyc.aadhar.number, isVerified: kyc.aadhar.isVerified } : null,
        pan: kyc.pan ? { number: kyc.pan.number, isVerified: kyc.pan.isVerified } : null,
        gst: kyc.gst ? { number: kyc.gst.number, isVerified: kyc.gst.isVerified } : null,
        addressProof: kyc.addressProof ? { type: kyc.addressProof.type, isVerified: kyc.addressProof.isVerified } : null,
        consentGiven: kyc.consentGiven,
        consentDate: kyc.consentDate
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// PHONEPE PAYMENT ENDPOINTS
// ============================================

// Initiate milestone payment via PhonePe
router.post('/payment/initiate', async (req, res) => {
  try {
    const customerId = req.customer?._id || req.body.customerId
    const { milestoneId } = req.body

    const customer = await Customer.findById(customerId)
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    // Check KYC
    const kycStatus = customer.kyc?.status
    const kycVerified = customer.kyc?.aadhar?.isVerified || customer.kyc?.pan?.isVerified || kycStatus === 'verified'
    if (!kycVerified && kycStatus !== 'documents_submitted') {
      return res.status(403).json({
        success: false,
        message: 'KYC verification required before making payments. Please submit your Aadhar/PAN documents.',
        kycRequired: true
      })
    }

    // Get milestone
    const milestone = await PaymentMilestone.findById(milestoneId)
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Payment milestone not found' })
    }

    if (milestone.status === 'paid') {
      return res.status(400).json({ success: false, message: 'This milestone is already paid' })
    }

    const payableAmount = (milestone.totalAmount || milestone.amount) - (milestone.collectedAmount || 0)
    if (payableAmount <= 0) {
      return res.status(400).json({ success: false, message: 'No balance amount to pay' })
    }

    // Generate unique transaction ID
    const txnId = `HOH-${milestone.project?.toString().slice(-6)}-${milestone._id.toString().slice(-6)}-${Date.now()}`

    // Initiate PhonePe payment
    const paymentResult = await initiatePayment({
      merchantTransactionId: txnId,
      amount: payableAmount,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      purpose: `${milestone.name} - Project Payment`
    })

    // Store transaction reference on milestone
    if (!milestone.pendingTransactions) milestone.pendingTransactions = []
    milestone.pendingTransactions = milestone.pendingTransactions || []
    milestone.markModified('pendingTransactions')
    // Store in activities instead since pendingTransactions may not be in schema
    milestone.activities = milestone.activities || []
    milestone.activities.push({
      action: 'payment_initiated',
      description: `PhonePe payment initiated: ${txnId} for ₹${payableAmount.toLocaleString('en-IN')}`,
      performedByName: customer.name,
      createdAt: new Date()
    })
    await milestone.save()

    res.json({
      success: true,
      data: {
        merchantTransactionId: txnId,
        amount: payableAmount,
        milestone: milestone.name,
        paymentUrl: paymentResult.paymentUrl,
        gatewayConfigured: !!paymentResult.paymentUrl,
        message: paymentResult.paymentUrl
          ? 'Redirecting to PhonePe for payment...'
          : 'PhonePe gateway pending configuration. Payment recorded for manual processing.'
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PhonePe payment callback (server-to-server)
router.post('/payment/callback', async (req, res) => {
  try {
    const { response: responseBase64 } = req.body
    const checksum = req.headers['x-verify']

    // Verify checksum
    if (checksum && !verifyChecksum(responseBase64, checksum)) {
      return res.status(400).json({ success: false, message: 'Invalid checksum' })
    }

    // Decode response
    const decodedResponse = JSON.parse(Buffer.from(responseBase64 || '', 'base64').toString())
    const { merchantTransactionId, transactionId, amount, state, responseCode } = decodedResponse?.data || {}

    if (state === 'COMPLETED' && responseCode === 'SUCCESS') {
      // Parse milestone from transaction ID: HOH-{projectSuffix}-{milestoneSuffix}-{timestamp}
      // Find milestone by matching transaction in activities
      const milestones = await PaymentMilestone.find({
        'activities.description': { $regex: merchantTransactionId }
      })

      for (const milestone of milestones) {
        const amountInRupees = amount / 100
        await milestone.addPayment({
          amount: amountInRupees,
          method: 'phonepe',
          referenceNumber: transactionId,
          remarks: `PhonePe payment: ${merchantTransactionId}`
        }, null, 'PhonePe Gateway')
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('PhonePe callback error:', error.message)
    res.json({ success: true }) // Always return success to PhonePe
  }
})

// Check payment status
router.get('/payment/status/:transactionId', async (req, res) => {
  try {
    const status = await checkPaymentStatus(req.params.transactionId)
    res.json({ success: true, data: status })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get payment-ready milestones for customer
router.get('/payment/milestones', async (req, res) => {
  try {
    const customerId = req.customer?._id || req.query.customerId
    const customer = await Customer.findById(customerId).select('kyc')

    const kycVerified = customer?.kyc?.status === 'verified' ||
      customer?.kyc?.aadhar?.isVerified || customer?.kyc?.pan?.isVerified ||
      customer?.kyc?.status === 'documents_submitted'

    // Get all projects for this customer
    const projects = await Project.find({ customer: customerId }).select('_id projectId title')
    const projectIds = projects.map(p => p._id)

    const milestones = await PaymentMilestone.find({
      project: { $in: projectIds },
      status: { $nin: ['paid', 'waived', 'cancelled'] }
    })
      .select('name amount totalAmount collectedAmount pendingAmount status percentage dueDate project order')
      .sort({ order: 1 })

    res.json({
      success: true,
      data: {
        kycVerified,
        kycStatus: customer?.kyc?.status || 'not_started',
        milestones: milestones.map(m => {
          const proj = projects.find(p => p._id.toString() === m.project?.toString())
          return {
            _id: m._id,
            name: m.name,
            projectId: proj?.projectId,
            projectTitle: proj?.title,
            amount: m.totalAmount || m.amount,
            collected: m.collectedAmount || 0,
            pending: (m.totalAmount || m.amount) - (m.collectedAmount || 0),
            status: m.status,
            percentage: m.percentage,
            dueDate: m.dueDate,
            canPay: kycVerified && m.status !== 'paid'
          }
        })
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
