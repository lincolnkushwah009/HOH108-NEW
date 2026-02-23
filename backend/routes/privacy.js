import express from 'express'
import Consent from '../models/Consent.js'
import DataSubjectRequest from '../models/DataSubjectRequest.js'
import DataRetentionPolicy from '../models/DataRetentionPolicy.js'
import BreachNotification from '../models/BreachNotification.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// =============================================
// CONSENT MANAGEMENT
// =============================================

// Create consent record
router.post('/consents', async (req, res) => {
  try {
    const consent = await Consent.create({
      ...req.body,
      company: req.activeCompany._id,
      history: [{
        action: 'consent_given',
        performedBy: req.user._id,
        reason: req.body.sourceDetails || 'Consent recorded'
      }]
    })

    res.status(201).json({ success: true, data: consent })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List consents (company scoped, paginated)
router.get('/consents', async (req, res) => {
  try {
    const {
      status,
      consentType,
      lead,
      customer,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (consentType) queryFilter.consentType = consentType
    if (lead) queryFilter.lead = lead
    if (customer) queryFilter.customer = customer

    const total = await Consent.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const consents = await Consent.find(queryFilter)
      .populate('user', 'name email')
      .populate('lead', 'name email')
      .populate('customer', 'name email')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: consents,
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

// Withdraw consent
router.put('/consents/:id/withdraw', async (req, res) => {
  try {
    const consent = await Consent.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent record not found' })
    }

    if (consent.status === 'withdrawn') {
      return res.status(400).json({ success: false, message: 'Consent is already withdrawn' })
    }

    consent.status = 'withdrawn'
    consent.consentWithdrawnAt = new Date()
    consent.history.push({
      action: 'consent_withdrawn',
      performedBy: req.user._id,
      reason: req.body.reason || 'Consent withdrawn'
    })

    await consent.save()

    res.json({ success: true, data: consent })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =============================================
// DATA SUBJECT REQUESTS (DSR)
// =============================================

// Create data subject request
router.post('/dsr', async (req, res) => {
  try {
    const dsr = await DataSubjectRequest.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      activities: [{
        action: 'request_created',
        performedBy: req.user._id,
        details: `DSR of type "${req.body.requestType}" created`
      }]
    })

    res.status(201).json({ success: true, data: dsr })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List DSRs (company scoped, paginated)
router.get('/dsr', async (req, res) => {
  try {
    const {
      status,
      requestType,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (requestType) queryFilter.requestType = requestType

    const total = await DataSubjectRequest.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const dsrs = await DataSubjectRequest.find(queryFilter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('relatedUser', 'name email')
      .populate('relatedLead', 'name email')
      .populate('relatedCustomer', 'name email')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: dsrs,
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

// Process DSR (update status, add resolution)
router.put('/dsr/:id/process', async (req, res) => {
  try {
    const dsr = await DataSubjectRequest.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!dsr) {
      return res.status(404).json({ success: false, message: 'Data subject request not found' })
    }

    if (dsr.status === 'completed') {
      return res.status(400).json({ success: false, message: 'DSR is already completed' })
    }

    const { status, responseDetails } = req.body

    if (status) dsr.status = status
    if (responseDetails) dsr.responseDetails = responseDetails

    if (status === 'completed') {
      dsr.completedAt = new Date()
    }

    dsr.activities.push({
      action: `status_changed_to_${status || dsr.status}`,
      performedBy: req.user._id,
      details: responseDetails || `DSR processed by ${req.user.name}`
    })

    await dsr.save()

    res.json({ success: true, data: dsr })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Export subject's data (placeholder - returns mock data package)
router.get('/dsr/:id/export', async (req, res) => {
  try {
    const dsr = await DataSubjectRequest.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('relatedUser', 'name email phone')
      .populate('relatedLead', 'name email phone')
      .populate('relatedCustomer', 'name email phone')

    if (!dsr) {
      return res.status(404).json({ success: false, message: 'Data subject request not found' })
    }

    // Placeholder data export package
    const dataPackage = {
      exportedAt: new Date(),
      requestId: dsr.requestId,
      dataSubject: dsr.dataSubject,
      relatedRecords: {
        user: dsr.relatedUser || null,
        lead: dsr.relatedLead || null,
        customer: dsr.relatedCustomer || null
      },
      consents: await Consent.find({
        company: req.activeCompany._id,
        $or: [
          ...(dsr.relatedUser ? [{ user: dsr.relatedUser._id }] : []),
          ...(dsr.relatedLead ? [{ lead: dsr.relatedLead._id }] : []),
          ...(dsr.relatedCustomer ? [{ customer: dsr.relatedCustomer._id }] : [])
        ]
      }),
      note: 'This is a placeholder data export. Integrate with actual data sources for a complete DPDP-compliant export.'
    }

    dsr.activities.push({
      action: 'data_exported',
      performedBy: req.user._id,
      details: 'Subject data exported'
    })
    await dsr.save()

    res.json({ success: true, data: dataPackage })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =============================================
// DATA RETENTION POLICIES
// =============================================

// Create retention policy
router.post('/retention-policies', async (req, res) => {
  try {
    const policy = await DataRetentionPolicy.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id
    })

    res.status(201).json({ success: true, data: policy })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List retention policies
router.get('/retention-policies', async (req, res) => {
  try {
    const { entityType, isActive, page = 1, limit = 20 } = req.query

    const queryFilter = companyScopedQuery(req)

    if (entityType) queryFilter.entityType = entityType
    if (isActive !== undefined) queryFilter.isActive = isActive === 'true'

    const total = await DataRetentionPolicy.countDocuments(queryFilter)

    const policies = await DataRetentionPolicy.find(queryFilter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: policies,
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

// Update retention policy
router.put('/retention-policies/:id', async (req, res) => {
  try {
    const policy = await DataRetentionPolicy.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Retention policy not found' })
    }

    const { retentionPeriodDays, action, isActive, nextScheduledAt } = req.body

    if (retentionPeriodDays !== undefined) policy.retentionPeriodDays = retentionPeriodDays
    if (action) policy.action = action
    if (isActive !== undefined) policy.isActive = isActive
    if (nextScheduledAt) policy.nextScheduledAt = nextScheduledAt

    await policy.save()

    res.json({ success: true, data: policy })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Execute retention cleanup (placeholder)
router.post('/retention-policies/execute', async (req, res) => {
  try {
    const policies = await DataRetentionPolicy.find({
      company: req.activeCompany._id,
      isActive: true
    })

    const results = policies.map(policy => ({
      entityType: policy.entityType,
      action: policy.action,
      retentionPeriodDays: policy.retentionPeriodDays,
      status: 'simulated',
      message: `Placeholder: would ${policy.action} ${policy.entityType} records older than ${policy.retentionPeriodDays} days`
    }))

    // Update lastExecutedAt for all active policies
    await DataRetentionPolicy.updateMany(
      { company: req.activeCompany._id, isActive: true },
      { $set: { lastExecutedAt: new Date() } }
    )

    res.json({
      success: true,
      message: 'Retention cleanup executed (placeholder)',
      data: results
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =============================================
// BREACH NOTIFICATIONS
// =============================================

// Create breach notification
router.post('/breach-notifications', async (req, res) => {
  try {
    const breach = await BreachNotification.create({
      ...req.body,
      company: req.activeCompany._id,
      reportedBy: req.user._id,
      timeline: [{
        action: 'breach_reported',
        performedBy: req.user._id,
        details: `Breach reported with severity: ${req.body.severity}`
      }]
    })

    res.status(201).json({ success: true, data: breach })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List breach notifications
router.get('/breach-notifications', async (req, res) => {
  try {
    const {
      status,
      severity,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (severity) queryFilter.severity = severity

    const total = await BreachNotification.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const breaches = await BreachNotification.find(queryFilter)
      .populate('reportedBy', 'name email')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: breaches,
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

// Update breach notification
router.put('/breach-notifications/:id', async (req, res) => {
  try {
    const breach = await BreachNotification.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!breach) {
      return res.status(404).json({ success: false, message: 'Breach notification not found' })
    }

    const {
      status,
      rootCause,
      containedAt,
      notifiedAuthority,
      notifiedSubjects,
      remediationSteps
    } = req.body

    if (status) breach.status = status
    if (rootCause) breach.rootCause = rootCause
    if (containedAt) breach.containedAt = containedAt
    if (notifiedAuthority) breach.notifiedAuthority = notifiedAuthority
    if (notifiedSubjects) breach.notifiedSubjects = notifiedSubjects
    if (remediationSteps) breach.remediationSteps = remediationSteps

    breach.timeline.push({
      action: `breach_updated_to_${status || breach.status}`,
      performedBy: req.user._id,
      details: req.body.updateNote || `Breach notification updated by ${req.user.name}`
    })

    await breach.save()

    res.json({ success: true, data: breach })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
