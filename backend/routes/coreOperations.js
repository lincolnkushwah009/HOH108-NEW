import express from 'express'
import mongoose from 'mongoose'
import LeadScore from '../models/LeadScore.js'
import Survey from '../models/Survey.js'
import RiskRegister from '../models/RiskRegister.js'
import ChangeOrder from '../models/ChangeOrder.js'
import StockTake from '../models/StockTake.js'
import TrainingSkillMatrix from '../models/TrainingSkillMatrix.js'
import ExitManagement from '../models/ExitManagement.js'
import Lead from '../models/Lead.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All routes require authentication and company context
router.use(protect)
router.use(setCompanyContext)

// ============================================
// LEAD SCORING
// ============================================

/**
 * @desc    Calculate lead score for a single lead
 * @route   POST /api/core-operations/lead-scoring/calculate/:leadId
 * @access  Private
 */
router.post('/lead-scoring/calculate/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params
    const companyId = req.activeCompany._id

    const lead = await Lead.findOne({
      _id: leadId,
      company: companyId
    })

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      })
    }

    // Calculate score breakdown
    const demographic = { score: 0, factors: [] }
    const behavioral = { score: 0, factors: [] }
    const engagement = { score: 0, factors: [] }
    const firmographic = { score: 0, factors: [] }

    // Demographic scoring
    if (lead.budget?.max) {
      const budgetScore = lead.budget.max >= 5000000 ? 25 : lead.budget.max >= 2500000 ? 20 : lead.budget.max >= 1000000 ? 15 : 10
      demographic.factors.push({ factor: 'budget', value: String(lead.budget.max), points: budgetScore })
      demographic.score += budgetScore
    }

    if (lead.location?.city) {
      const locationScore = ['Bengaluru', 'Hyderabad', 'Mysuru'].includes(lead.location.city) ? 10 : 5
      demographic.factors.push({ factor: 'location', value: lead.location.city, points: locationScore })
      demographic.score += locationScore
    }

    if (lead.area?.value) {
      const areaScore = lead.area.value >= 2000 ? 15 : lead.area.value >= 1000 ? 10 : 5
      demographic.factors.push({ factor: 'area', value: String(lead.area.value), points: areaScore })
      demographic.score += areaScore
    }

    // Behavioral scoring
    if (lead.callSummary?.totalAttempts > 0) {
      const callScore = Math.min(lead.callSummary.successfulCalls * 5, 20)
      behavioral.factors.push({ factor: 'successful_calls', value: String(lead.callSummary.successfulCalls), points: callScore })
      behavioral.score += callScore
    }

    if (lead.callSummary?.meetingsCompleted > 0) {
      const meetingScore = Math.min(lead.callSummary.meetingsCompleted * 10, 20)
      behavioral.factors.push({ factor: 'meetings_completed', value: String(lead.callSummary.meetingsCompleted), points: meetingScore })
      behavioral.score += meetingScore
    }

    // Engagement scoring
    if (lead.communications?.length > 0) {
      const commScore = Math.min(lead.communications.length * 3, 15)
      engagement.factors.push({ factor: 'communications', value: String(lead.communications.length), points: commScore })
      engagement.score += commScore
    }

    if (lead.notes?.length > 0) {
      const noteScore = Math.min(lead.notes.length * 2, 10)
      engagement.factors.push({ factor: 'notes', value: String(lead.notes.length), points: noteScore })
      engagement.score += noteScore
    }

    if (lead.primaryStatus === 'qualified') {
      engagement.factors.push({ factor: 'qualified', value: 'true', points: 15 })
      engagement.score += 15
    }

    // Firmographic scoring
    if (lead.propertyType) {
      const propertyScore = lead.propertyType === 'Villa' ? 15 : lead.propertyType === 'Penthouse' ? 15 : 10
      firmographic.factors.push({ factor: 'property_type', value: lead.propertyType, points: propertyScore })
      firmographic.score += propertyScore
    }

    if (lead.source) {
      const sourceScore = lead.source === 'referral' ? 15 : ['google-ads', 'facebook-ads'].includes(lead.source) ? 10 : 5
      firmographic.factors.push({ factor: 'source', value: lead.source, points: sourceScore })
      firmographic.score += sourceScore
    }

    // Create or update the lead score
    const scoreData = {
      company: companyId,
      lead: lead._id,
      scoreBreakdown: {
        demographic,
        behavioral,
        engagement,
        firmographic
      }
    }

    let leadScore = await LeadScore.findOne({ company: companyId, lead: lead._id })

    if (leadScore) {
      leadScore.scoreBreakdown = scoreData.scoreBreakdown
      // Push to history before saving (pre-save hook recalculates totalScore and grade)
      leadScore.history.push({
        score: leadScore.totalScore,
        grade: leadScore.grade,
        calculatedAt: new Date()
      })
      // Keep only last 50 history entries
      if (leadScore.history.length > 50) {
        leadScore.history = leadScore.history.slice(-50)
      }
      await leadScore.save()
    } else {
      leadScore = await LeadScore.create(scoreData)
    }

    res.json({
      success: true,
      data: leadScore
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Bulk calculate lead scores for all active leads in company
 * @route   POST /api/core-operations/lead-scoring/bulk-calculate
 * @access  Private
 */
router.post('/lead-scoring/bulk-calculate', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    // Get all active leads (not converted, not lost)
    const leads = await Lead.find({
      company: companyId,
      isConverted: false,
      primaryStatus: { $nin: ['lost'] }
    }).select('_id')

    let calculated = 0
    let errors = 0

    for (const lead of leads) {
      try {
        // Trigger the single calculate endpoint logic inline
        const fullLead = await Lead.findById(lead._id)
        if (!fullLead) continue

        const demographic = { score: 0, factors: [] }
        const behavioral = { score: 0, factors: [] }
        const engagement = { score: 0, factors: [] }
        const firmographic = { score: 0, factors: [] }

        // Demographic
        if (fullLead.budget?.max) {
          const budgetScore = fullLead.budget.max >= 5000000 ? 25 : fullLead.budget.max >= 2500000 ? 20 : fullLead.budget.max >= 1000000 ? 15 : 10
          demographic.factors.push({ factor: 'budget', value: String(fullLead.budget.max), points: budgetScore })
          demographic.score += budgetScore
        }
        if (fullLead.location?.city) {
          const locationScore = ['Bengaluru', 'Hyderabad', 'Mysuru'].includes(fullLead.location.city) ? 10 : 5
          demographic.factors.push({ factor: 'location', value: fullLead.location.city, points: locationScore })
          demographic.score += locationScore
        }

        // Behavioral
        if (fullLead.callSummary?.successfulCalls > 0) {
          const callScore = Math.min(fullLead.callSummary.successfulCalls * 5, 20)
          behavioral.factors.push({ factor: 'successful_calls', value: String(fullLead.callSummary.successfulCalls), points: callScore })
          behavioral.score += callScore
        }
        if (fullLead.callSummary?.meetingsCompleted > 0) {
          const meetingScore = Math.min(fullLead.callSummary.meetingsCompleted * 10, 20)
          behavioral.factors.push({ factor: 'meetings_completed', value: String(fullLead.callSummary.meetingsCompleted), points: meetingScore })
          behavioral.score += meetingScore
        }

        // Engagement
        if (fullLead.communications?.length > 0) {
          engagement.factors.push({ factor: 'communications', value: String(fullLead.communications.length), points: Math.min(fullLead.communications.length * 3, 15) })
          engagement.score += Math.min(fullLead.communications.length * 3, 15)
        }
        if (fullLead.primaryStatus === 'qualified') {
          engagement.factors.push({ factor: 'qualified', value: 'true', points: 15 })
          engagement.score += 15
        }

        // Firmographic
        if (fullLead.source) {
          const sourceScore = fullLead.source === 'referral' ? 15 : ['google-ads', 'facebook-ads'].includes(fullLead.source) ? 10 : 5
          firmographic.factors.push({ factor: 'source', value: fullLead.source, points: sourceScore })
          firmographic.score += sourceScore
        }

        let leadScore = await LeadScore.findOne({ company: companyId, lead: fullLead._id })
        if (leadScore) {
          leadScore.scoreBreakdown = { demographic, behavioral, engagement, firmographic }
          await leadScore.save()
        } else {
          await LeadScore.create({
            company: companyId,
            lead: fullLead._id,
            scoreBreakdown: { demographic, behavioral, engagement, firmographic }
          })
        }

        calculated++
      } catch (err) {
        errors++
      }
    }

    res.json({
      success: true,
      data: {
        totalLeads: leads.length,
        calculated,
        errors
      },
      message: `Bulk scoring complete: ${calculated} calculated, ${errors} errors`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    List lead scores (company scoped, sorted by totalScore desc)
 * @route   GET /api/core-operations/lead-scoring
 * @access  Private
 */
router.get('/lead-scoring', async (req, res) => {
  try {
    const { grade, page = 1, limit = 20 } = req.query
    const queryFilter = companyScopedQuery(req)

    if (grade) {
      queryFilter.grade = grade
    }

    const total = await LeadScore.countDocuments(queryFilter)

    const scores = await LeadScore.find(queryFilter)
      .populate('lead', 'name email phone primaryStatus leadId qualifiedLeadId source assignedTo')
      .populate({ path: 'lead', populate: { path: 'assignedTo', select: 'name' } })
      .sort({ totalScore: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: scores,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
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

// ============================================
// SURVEYS
// ============================================

/**
 * @desc    Create a survey
 * @route   POST /api/core-operations/surveys
 * @access  Private
 */
router.post('/surveys', async (req, res) => {
  try {
    const { surveyType, title, questions, trigger } = req.body

    if (!surveyType || !title || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'surveyType, title, and at least one question are required'
      })
    }

    const survey = await Survey.create({
      company: req.activeCompany._id,
      surveyType,
      title,
      questions,
      trigger: trigger || 'manual',
      createdBy: req.user._id
    })

    res.status(201).json({
      success: true,
      data: survey,
      message: 'Survey created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    List surveys
 * @route   GET /api/core-operations/surveys
 * @access  Private
 */
router.get('/surveys', async (req, res) => {
  try {
    const { surveyType, isActive, page = 1, limit = 20 } = req.query
    const queryFilter = companyScopedQuery(req)

    if (surveyType) queryFilter.surveyType = surveyType
    if (isActive !== undefined) queryFilter.isActive = isActive === 'true'

    const total = await Survey.countDocuments(queryFilter)

    const surveys = await Survey.find(queryFilter)
      .populate('createdBy', 'name email')
      .select('-responses')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: surveys,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
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
 * @desc    Get a single survey with responses
 * @route   GET /api/core-operations/surveys/:id
 * @access  Private
 */
router.get('/surveys/:id', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('responses.customer', 'name email')
      .populate('responses.project', 'title projectId')

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      })
    }

    // Company access check
    if (
      req.user.role !== 'super_admin' &&
      survey.company.toString() !== req.activeCompany._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      })
    }

    res.json({
      success: true,
      data: survey
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Submit a survey response
 * @route   POST /api/core-operations/surveys/:id/respond
 * @access  Private
 */
router.post('/surveys/:id/respond', async (req, res) => {
  try {
    const { respondent, customer, project, answers, npsScore, csatScore } = req.body

    const survey = await Survey.findById(req.params.id)

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found'
      })
    }

    if (!survey.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This survey is no longer accepting responses'
      })
    }

    // Validate required questions are answered
    const requiredQuestions = survey.questions.filter(q => q.required)
    for (const rq of requiredQuestions) {
      const questionIndex = survey.questions.indexOf(rq)
      const answer = answers?.find(a => a.questionIndex === questionIndex)
      if (!answer) {
        return res.status(400).json({
          success: false,
          message: `Question "${rq.questionText}" is required`
        })
      }
    }

    survey.responses.push({
      respondent,
      customer,
      project,
      answers: answers || [],
      npsScore,
      csatScore,
      submittedAt: new Date()
    })

    // Pre-save hook recalculates averages and responseCount
    await survey.save()

    res.status(201).json({
      success: true,
      data: {
        responseCount: survey.responseCount,
        averageNPS: survey.averageNPS,
        averageCSAT: survey.averageCSAT
      },
      message: 'Survey response submitted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// ============================================
// RISK REGISTER
// ============================================

/**
 * @desc    Create a risk
 * @route   POST /api/core-operations/risks
 * @access  Private
 */
router.post('/risks', async (req, res) => {
  try {
    const {
      project, title, description, category,
      probability, impact, owner,
      mitigationPlan, contingencyPlan, triggerConditions, reviewDate
    } = req.body

    if (!project || !title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'project, title, description, and category are required'
      })
    }

    const risk = await RiskRegister.create({
      company: req.activeCompany._id,
      project,
      title,
      description,
      category,
      probability: probability || 'medium',
      impact: impact || 'moderate',
      owner: owner || req.user._id,
      mitigationPlan,
      contingencyPlan,
      triggerConditions,
      reviewDate,
      activities: [{
        action: 'Risk identified',
        performedBy: req.user._id,
        details: `Risk "${title}" created`
      }],
      createdBy: req.user._id
    })

    await risk.populate('project', 'title projectId')
    await risk.populate('owner', 'name email')

    res.status(201).json({
      success: true,
      data: risk,
      message: 'Risk created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    List risks (filter by projectId and severity)
 * @route   GET /api/core-operations/risks
 * @access  Private
 */
router.get('/risks', async (req, res) => {
  try {
    const { projectId, severity, status, page = 1, limit = 20 } = req.query
    const queryFilter = companyScopedQuery(req)

    if (projectId) queryFilter.project = projectId
    if (severity) queryFilter.impact = severity
    if (status) queryFilter.status = status

    const total = await RiskRegister.countDocuments(queryFilter)

    const risks = await RiskRegister.find(queryFilter)
      .populate('project', 'title projectId')
      .populate('owner', 'name email')
      .sort({ riskScore: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: risks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
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
 * @desc    Update a risk
 * @route   PUT /api/core-operations/risks/:id
 * @access  Private
 */
router.put('/risks/:id', async (req, res) => {
  try {
    const risk = await RiskRegister.findById(req.params.id)

    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      })
    }

    if (
      req.user.role !== 'super_admin' &&
      risk.company.toString() !== req.activeCompany._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      })
    }

    const allowedFields = [
      'title', 'description', 'category', 'probability', 'impact',
      'status', 'owner', 'mitigationPlan', 'contingencyPlan',
      'triggerConditions', 'reviewDate'
    ]

    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }

    // Track activity
    risk.activities.push({
      action: 'Risk updated',
      performedBy: req.user._id,
      details: `Fields updated: ${Object.keys(updates).join(', ')}`
    })

    Object.assign(risk, updates)
    await risk.save()

    await risk.populate('project', 'title projectId')
    await risk.populate('owner', 'name email')

    res.json({
      success: true,
      data: risk,
      message: 'Risk updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Risk dashboard - count by severity, top risks by score
 * @route   GET /api/core-operations/risks/dashboard
 * @access  Private
 */
router.get('/risks/dashboard', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    // Count by impact severity
    const bySeverity = await RiskRegister.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(companyId), status: { $ne: 'closed' } } },
      {
        $group: {
          _id: '$impact',
          count: { $sum: 1 }
        }
      }
    ])

    // Count by status
    const byStatus = await RiskRegister.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(companyId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    // Top 10 risks by risk score (probability * impact)
    const topRisks = await RiskRegister.find({
      company: companyId,
      status: { $ne: 'closed' }
    })
      .populate('project', 'title projectId')
      .populate('owner', 'name')
      .sort({ riskScore: -1 })
      .limit(10)

    const totalOpen = await RiskRegister.countDocuments({
      company: companyId,
      status: { $ne: 'closed' }
    })

    res.json({
      success: true,
      data: {
        totalOpen,
        bySeverity,
        byStatus,
        topRisks
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// ============================================
// CHANGE ORDERS
// ============================================

/**
 * @desc    Create a change order
 * @route   POST /api/core-operations/change-orders
 * @access  Private
 */
router.post('/change-orders', async (req, res) => {
  try {
    const { project, title, description, changeType, impact, attachments } = req.body

    if (!project || !title || !description || !changeType) {
      return res.status(400).json({
        success: false,
        message: 'project, title, description, and changeType are required'
      })
    }

    const changeOrder = await ChangeOrder.create({
      company: req.activeCompany._id,
      project,
      title,
      description,
      requestedBy: req.user._id,
      changeType,
      impact: impact || {},
      attachments: attachments || [],
      activities: [{
        action: 'Change order created',
        performedBy: req.user._id,
        details: `Change order "${title}" created`
      }],
      createdBy: req.user._id
    })

    await changeOrder.populate('project', 'title projectId')
    await changeOrder.populate('requestedBy', 'name email')

    res.status(201).json({
      success: true,
      data: changeOrder,
      message: 'Change order created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    List change orders (filter by projectId and status)
 * @route   GET /api/core-operations/change-orders
 * @access  Private
 */
router.get('/change-orders', async (req, res) => {
  try {
    const { projectId, status, changeType, page = 1, limit = 20 } = req.query
    const queryFilter = companyScopedQuery(req)

    if (projectId) queryFilter.project = projectId
    if (status) queryFilter.status = status
    if (changeType) queryFilter.changeType = changeType

    const total = await ChangeOrder.countDocuments(queryFilter)

    const changeOrders = await ChangeOrder.find(queryFilter)
      .populate('project', 'title projectId')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: changeOrders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
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
 * @desc    Update a change order
 * @route   PUT /api/core-operations/change-orders/:id
 * @access  Private
 */
router.put('/change-orders/:id', async (req, res) => {
  try {
    const changeOrder = await ChangeOrder.findById(req.params.id)

    if (!changeOrder) {
      return res.status(404).json({
        success: false,
        message: 'Change order not found'
      })
    }

    if (
      req.user.role !== 'super_admin' &&
      changeOrder.company.toString() !== req.activeCompany._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      })
    }

    if (['approved', 'implemented'].includes(changeOrder.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot modify a change order that is ${changeOrder.status}`
      })
    }

    const allowedFields = ['title', 'description', 'changeType', 'impact', 'status', 'attachments']
    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }

    changeOrder.activities.push({
      action: 'Change order updated',
      performedBy: req.user._id,
      details: `Fields updated: ${Object.keys(updates).join(', ')}`
    })

    Object.assign(changeOrder, updates)
    await changeOrder.save()

    await changeOrder.populate('project', 'title projectId')
    await changeOrder.populate('requestedBy', 'name email')

    res.json({
      success: true,
      data: changeOrder,
      message: 'Change order updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Approve a change order
 * @route   PUT /api/core-operations/change-orders/:id/approve
 * @access  Private
 */
router.put('/change-orders/:id/approve', async (req, res) => {
  try {
    const { status, remarks } = req.body
    const changeOrder = await ChangeOrder.findById(req.params.id)

    if (!changeOrder) {
      return res.status(404).json({
        success: false,
        message: 'Change order not found'
      })
    }

    if (
      req.user.role !== 'super_admin' &&
      changeOrder.company.toString() !== req.activeCompany._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      })
    }

    if (!['requested', 'under_review'].includes(changeOrder.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a change order with status: ${changeOrder.status}`
      })
    }

    const approvalStatus = status === 'rejected' ? 'rejected' : 'approved'

    changeOrder.status = approvalStatus
    changeOrder.approvedBy = req.user._id
    changeOrder.approvedAt = new Date()

    changeOrder.activities.push({
      action: `Change order ${approvalStatus}`,
      performedBy: req.user._id,
      details: remarks || `Change order ${approvalStatus} by ${req.user.name}`
    })

    await changeOrder.save()

    await changeOrder.populate('project', 'title projectId')
    await changeOrder.populate('requestedBy', 'name email')
    await changeOrder.populate('approvedBy', 'name email')

    res.json({
      success: true,
      data: changeOrder,
      message: `Change order ${approvalStatus}`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// ============================================
// STOCK TAKES
// ============================================

/**
 * @desc    Create a stock take
 * @route   POST /api/core-operations/stock-takes
 * @access  Private
 */
router.post('/stock-takes', async (req, res) => {
  try {
    const { type, scheduledDate, warehouse, entries } = req.body

    if (!type || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'type and scheduledDate are required'
      })
    }

    const stockTake = await StockTake.create({
      company: req.activeCompany._id,
      type,
      scheduledDate: new Date(scheduledDate),
      warehouse: warehouse || 'Main Warehouse',
      entries: entries || [],
      conductedBy: req.user._id,
      createdBy: req.user._id
    })

    res.status(201).json({
      success: true,
      data: stockTake,
      message: 'Stock take created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    List stock takes
 * @route   GET /api/core-operations/stock-takes
 * @access  Private
 */
router.get('/stock-takes', async (req, res) => {
  try {
    const { status, type, warehouse, page = 1, limit = 20 } = req.query
    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (type) queryFilter.type = type
    if (warehouse) queryFilter.warehouse = warehouse

    const total = await StockTake.countDocuments(queryFilter)

    const stockTakes = await StockTake.find(queryFilter)
      .populate('conductedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ scheduledDate: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: stockTakes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
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
 * @desc    Update a stock take (add/update entries with systemQty vs physicalQty)
 * @route   PUT /api/core-operations/stock-takes/:id
 * @access  Private
 */
router.put('/stock-takes/:id', async (req, res) => {
  try {
    const stockTake = await StockTake.findById(req.params.id)

    if (!stockTake) {
      return res.status(404).json({
        success: false,
        message: 'Stock take not found'
      })
    }

    if (
      req.user.role !== 'super_admin' &&
      stockTake.company.toString() !== req.activeCompany._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      })
    }

    if (stockTake.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify an approved stock take'
      })
    }

    const { entries, status, warehouse, completedDate } = req.body

    if (entries) stockTake.entries = entries
    if (status && ['planned', 'in_progress', 'completed'].includes(status)) {
      stockTake.status = status
    }
    if (warehouse) stockTake.warehouse = warehouse
    if (completedDate) stockTake.completedDate = new Date(completedDate)

    // Pre-save hook will calculate variances
    await stockTake.save()

    await stockTake.populate('entries.material', 'materialName skuCode unit')
    await stockTake.populate('conductedBy', 'name email')

    res.json({
      success: true,
      data: stockTake,
      message: 'Stock take updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Approve a stock take
 * @route   PUT /api/core-operations/stock-takes/:id/approve
 * @access  Private
 */
router.put('/stock-takes/:id/approve', async (req, res) => {
  try {
    const stockTake = await StockTake.findById(req.params.id)

    if (!stockTake) {
      return res.status(404).json({
        success: false,
        message: 'Stock take not found'
      })
    }

    if (
      req.user.role !== 'super_admin' &&
      stockTake.company.toString() !== req.activeCompany._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      })
    }

    if (stockTake.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Stock take must be completed before approval'
      })
    }

    stockTake.status = 'approved'
    stockTake.approvedBy = req.user._id
    await stockTake.save()

    await stockTake.populate('conductedBy', 'name email')
    await stockTake.populate('approvedBy', 'name email')

    res.json({
      success: true,
      data: stockTake,
      message: 'Stock take approved'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// ============================================
// SKILL MATRIX
// ============================================

/**
 * @desc    Create or update a skill matrix entry for an employee
 * @route   POST /api/core-operations/skills
 * @access  Private
 */
router.post('/skills', async (req, res) => {
  try {
    const { employee, skills, trainings, nextReviewDate } = req.body

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'employee is required'
      })
    }

    // Upsert: create or update
    let matrix = await TrainingSkillMatrix.findOne({
      company: req.activeCompany._id,
      employee
    })

    if (matrix) {
      // Update existing
      if (skills) matrix.skills = skills
      if (trainings) matrix.trainings = trainings
      if (nextReviewDate) matrix.nextReviewDate = new Date(nextReviewDate)
      matrix.lastReviewedAt = new Date()
      await matrix.save()
    } else {
      // Create new
      matrix = await TrainingSkillMatrix.create({
        company: req.activeCompany._id,
        employee,
        skills: skills || [],
        trainings: trainings || [],
        nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : undefined,
        lastReviewedAt: new Date()
      })
    }

    await matrix.populate('employee', 'name email designation department')

    res.status(201).json({
      success: true,
      data: matrix,
      message: 'Skill matrix entry saved successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    List skill matrices (filter by userId)
 * @route   GET /api/core-operations/skills
 * @access  Private
 */
router.get('/skills', async (req, res) => {
  try {
    const { userId, category, page = 1, limit = 20 } = req.query
    const queryFilter = companyScopedQuery(req)

    if (userId) queryFilter.employee = userId
    if (category) queryFilter['skills.category'] = category

    const total = await TrainingSkillMatrix.countDocuments(queryFilter)

    const matrices = await TrainingSkillMatrix.find(queryFilter)
      .populate('employee', 'name email designation department avatar')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: matrices,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
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
 * @desc    Update a skill matrix entry
 * @route   PUT /api/core-operations/skills/:id
 * @access  Private
 */
router.put('/skills/:id', async (req, res) => {
  try {
    const matrix = await TrainingSkillMatrix.findById(req.params.id)

    if (!matrix) {
      return res.status(404).json({
        success: false,
        message: 'Skill matrix entry not found'
      })
    }

    if (
      req.user.role !== 'super_admin' &&
      matrix.company.toString() !== req.activeCompany._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      })
    }

    const { skills, trainings, nextReviewDate } = req.body

    if (skills) matrix.skills = skills
    if (trainings) matrix.trainings = trainings
    if (nextReviewDate) matrix.nextReviewDate = new Date(nextReviewDate)
    matrix.lastReviewedAt = new Date()

    await matrix.save()

    await matrix.populate('employee', 'name email designation department')

    res.json({
      success: true,
      data: matrix,
      message: 'Skill matrix updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// ============================================
// EXIT MANAGEMENT
// ============================================

/**
 * @desc    Initiate an employee exit
 * @route   POST /api/core-operations/exit
 * @access  Private
 */
router.post('/exit', async (req, res) => {
  try {
    const {
      employee, exitType, resignationDate,
      lastWorkingDate, noticePeriodDays, noticePeriodWaived,
      checklist
    } = req.body

    if (!employee || !exitType || !resignationDate) {
      return res.status(400).json({
        success: false,
        message: 'employee, exitType, and resignationDate are required'
      })
    }

    const exit = await ExitManagement.create({
      company: req.activeCompany._id,
      employee,
      exitType,
      resignationDate: new Date(resignationDate),
      lastWorkingDate: lastWorkingDate ? new Date(lastWorkingDate) : undefined,
      noticePeriodDays: noticePeriodDays || 30,
      noticePeriodWaived: noticePeriodWaived || false,
      checklist: checklist || [],
      createdBy: req.user._id
    })

    await exit.populate('employee', 'name email designation department')

    res.status(201).json({
      success: true,
      data: exit,
      message: 'Exit process initiated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    List exit records
 * @route   GET /api/core-operations/exit
 * @access  Private
 */
router.get('/exit', async (req, res) => {
  try {
    const { status, exitType, page = 1, limit = 20 } = req.query
    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (exitType) queryFilter.exitType = exitType

    const total = await ExitManagement.countDocuments(queryFilter)

    const exits = await ExitManagement.find(queryFilter)
      .populate('employee', 'name email designation department avatar')
      .populate('createdBy', 'name email')
      .populate('fnf.approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: exits,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
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
 * @desc    Update exit process (status, checklist, exit interview, etc.)
 * @route   PUT /api/core-operations/exit/:id
 * @access  Private
 */
router.put('/exit/:id', async (req, res) => {
  try {
    const exit = await ExitManagement.findById(req.params.id)

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: 'Exit record not found'
      })
    }

    if (
      req.user.role !== 'super_admin' &&
      exit.company.toString() !== req.activeCompany._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      })
    }

    if (exit.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a completed exit process'
      })
    }

    const allowedFields = [
      'status', 'lastWorkingDate', 'noticePeriodDays', 'noticePeriodWaived',
      'exitInterviewCompleted', 'exitInterviewNotes', 'checklist'
    ]

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'lastWorkingDate') {
          exit[field] = new Date(req.body[field])
        } else {
          exit[field] = req.body[field]
        }
      }
    }

    await exit.save()

    await exit.populate('employee', 'name email designation department')

    res.json({
      success: true,
      data: exit,
      message: 'Exit process updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Update final settlement (F&F)
 * @route   PUT /api/core-operations/exit/:id/fnf
 * @access  Private
 */
router.put('/exit/:id/fnf', async (req, res) => {
  try {
    const exit = await ExitManagement.findById(req.params.id)

    if (!exit) {
      return res.status(404).json({
        success: false,
        message: 'Exit record not found'
      })
    }

    if (
      req.user.role !== 'super_admin' &&
      exit.company.toString() !== req.activeCompany._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      })
    }

    const { basicPay, leavePayout, bonus, gratuity, deductions, status } = req.body

    if (basicPay !== undefined) exit.fnf.basicPay = basicPay
    if (leavePayout !== undefined) exit.fnf.leavePayout = leavePayout
    if (bonus !== undefined) exit.fnf.bonus = bonus
    if (gratuity !== undefined) exit.fnf.gratuity = gratuity
    if (deductions !== undefined) exit.fnf.deductions = deductions

    if (status) {
      exit.fnf.status = status
      if (status === 'approved') {
        exit.fnf.approvedBy = req.user._id
      }
      if (status === 'paid') {
        exit.fnf.paidAt = new Date()
        // If F&F is paid, move exit to completed
        exit.status = 'completed'
      }
    }

    // Pre-save hook calculates netPayable
    await exit.save()

    await exit.populate('employee', 'name email designation department')
    await exit.populate('fnf.approvedBy', 'name email')

    res.json({
      success: true,
      data: exit,
      message: 'Final settlement updated successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router
