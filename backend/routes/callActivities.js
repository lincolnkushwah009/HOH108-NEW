import express from 'express'
import CallActivity from '../models/CallActivity.js'
import Lead from '../models/Lead.js'
import User from '../models/User.js'
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

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all call activities (company-scoped)
 * @route   GET /api/call-activities
 * @access  Private
 */
router.get('/',
  requireModulePermission('call_activities', 'view'),
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const {
        lead,
        calledBy,
        status,
        outcome,
        department,
        dateFrom,
        dateTo,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query

      const queryFilter = companyScopedQuery(req)

      // Pre-sales users can only see their own call activities
      if (req.user.subDepartment === 'pre_sales' || req.user.role === 'pre_sales') {
        queryFilter.calledBy = req.user._id
      } else if (calledBy) {
        queryFilter.calledBy = calledBy
      }
      if (lead) queryFilter.lead = lead
      if (status) queryFilter.status = status
      if (outcome) queryFilter.outcome = outcome
      if (department) queryFilter.calledByDepartment = department

      // Date range filter
      if (dateFrom || dateTo) {
        queryFilter.createdAt = {}
        if (dateFrom) queryFilter.createdAt.$gte = new Date(dateFrom)
        if (dateTo) queryFilter.createdAt.$lte = new Date(dateTo)
      }

      const total = await CallActivity.countDocuments(queryFilter)

      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

      const activities = await CallActivity.find(queryFilter)
        .populate('lead', 'name phone leadId primaryStatus')
        .populate('calledBy', 'name email avatar')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      res.json({
        success: true,
        data: activities,
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
 * @desc    Get call activities for a lead
 * @route   GET /api/call-activities/lead/:leadId
 * @access  Private
 */
router.get('/lead/:leadId',
  requireModulePermission('call_activities', 'view'),
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.leadId)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Check access
      if (!await canAccessLead(req, lead)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this lead'
        })
      }

      const activities = await CallActivity.getLeadCallHistory(req.params.leadId)
      const stats = await CallActivity.getLeadCallStats(req.params.leadId)

      res.json({
        success: true,
        data: {
          activities,
          stats,
          lead: {
            _id: lead._id,
            name: lead.name,
            phone: lead.phone,
            leadId: lead.leadId,
            callSummary: lead.callSummary
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
 * @desc    Get single call activity
 * @route   GET /api/call-activities/:id
 * @access  Private
 */
router.get('/:id',
  requireModulePermission('call_activities', 'view'),
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const activity = await CallActivity.findById(req.params.id)
        .populate('lead', 'name phone email leadId primaryStatus')
        .populate('calledBy', 'name email avatar')
        .populate('meetingScheduled.attendees', 'name email')

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Call activity not found'
        })
      }

      // Verify company access
      const lead = await Lead.findById(activity.lead)
      if (lead && !await canAccessLead(req, lead)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      res.json({
        success: true,
        data: activity
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
 * @desc    Create/Log a call activity
 * @route   POST /api/call-activities
 * @access  Private
 */
router.post('/',
  requireModulePermission('call_activities', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { leadId, callType, notes } = req.body

      const lead = await Lead.findById(leadId)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Check edit access
      if (!await canAccessLead(req, lead)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to log calls for this lead'
        })
      }

      // Check if pre-sales is locked and user is not from sales
      if (lead.preSalesLocked && req.user.subDepartment !== 'sales_closure') {
        return res.status(403).json({
          success: false,
          message: 'Pre-sales data is locked. Only Sales team can modify this lead.'
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

      // Generate activity ID
      const activityId = await company.generateId('callActivity')

      // Get attempt number
      const previousCalls = await CallActivity.countDocuments({ lead: leadId })

      const activity = await CallActivity.create({
        activityId,
        company: req.activeCompany._id,
        lead: leadId,
        customer: lead.customer,
        callType: callType || 'outbound',
        attemptNumber: previousCalls + 1,
        calledBy: req.user._id,
        calledByName: req.user.name,
        calledByDepartment: req.user.subDepartment || 'pre_sales',
        status: 'in_progress',
        callStartTime: new Date(),
        notes,
        activities: [{
          action: 'call_started',
          description: `Call initiated by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        }]
      })

      // Add activity to lead
      lead.activities.push({
        action: 'call_initiated',
        description: `Call attempt #${previousCalls + 1} by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })
      lead.lastActivityAt = new Date()
      lead.lastContactedAt = new Date()
      await lead.save()

      await activity.populate('calledBy', 'name email avatar')

      res.status(201).json({
        success: true,
        data: activity,
        message: 'Call activity started'
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
 * @desc    Complete a call activity
 * @route   PUT /api/call-activities/:id/complete
 * @access  Private
 */
router.put('/:id/complete',
  requireModulePermission('call_activities', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const {
        outcome,
        duration,
        notes,
        nextAction,
        nextActionDate,
        recordingUrl,
        recordingDuration
      } = req.body

      const activity = await CallActivity.findById(req.params.id)

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Call activity not found'
        })
      }

      // Verify ownership
      if (activity.calledBy.toString() !== req.user._id.toString() &&
          !['super_admin', 'company_admin', 'sales_manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only the caller can complete this activity'
        })
      }

      // Complete the call
      await activity.completeCall({
        outcome,
        duration,
        notes,
        nextAction,
        nextActionDate
      }, req.user._id, req.user.name)

      // Add recording if provided
      if (recordingUrl) {
        await activity.addRecording({
          url: recordingUrl,
          duration: recordingDuration
        }, req.user._id, req.user.name)
      }

      // Update lead's call summary
      const lead = await Lead.findById(activity.lead)
      if (lead) {
        await lead.updateCallSummary({ outcome, duration, status: 'completed' })

        // Handle RNR tracking
        if (outcome === 'rnr') {
          const rnrCount = (lead.rnrTracking?.rnrCount || 0) + 1
          lead.rnrTracking = {
            rnrCount,
            lastRnrDate: new Date(),
            maxRnrReached: rnrCount >= 5
          }

          // Auto mark as RNR after 5 attempts
          if (rnrCount >= 5 && lead.primaryStatus !== 'rnr') {
            await lead.markAsRNR(req.user._id, req.user.name, 'Maximum RNR attempts reached')
          }
        }

        // Handle qualification outcomes
        if (outcome === 'qualified') {
          await lead.qualify(req.user._id, req.user.name, 'Qualified via call')
        } else if (outcome === 'not_interested' || outcome === 'lost') {
          await lead.markAsLost(req.user._id, req.user.name, 'Lost via call - Not interested')
        } else if (outcome === 'future_prospect') {
          await lead.markAsFutureProspect(req.user._id, req.user.name, 'Marked as future prospect via call')
        }

        await lead.save()
      }

      await activity.populate('calledBy', 'name email avatar')

      res.json({
        success: true,
        data: activity,
        message: 'Call completed successfully'
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
 * @desc    Schedule a meeting from call
 * @route   POST /api/call-activities/:id/schedule-meeting
 * @access  Private
 */
router.post('/:id/schedule-meeting',
  requireModulePermission('call_activities', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const {
        scheduledDate,
        location,
        locationType,
        meetingType,
        agenda,
        attendees
      } = req.body

      const activity = await CallActivity.findById(req.params.id)

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Call activity not found'
        })
      }

      // Verify the call resulted in a meeting being scheduled
      await activity.scheduleMeeting({
        scheduledDate,
        location,
        locationType,
        meetingType,
        agenda,
        attendees,
        scheduledBy: req.user._id,
        scheduledByName: req.user.name
      }, req.user._id, req.user.name)

      // Update lead
      const lead = await Lead.findById(activity.lead)
      if (lead) {
        lead.activities.push({
          action: 'meeting_scheduled',
          description: `Meeting scheduled for ${new Date(scheduledDate).toLocaleDateString()} by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name,
          metadata: {
            meetingDate: scheduledDate,
            location,
            meetingType
          }
        })

        // Update call summary
        lead.callSummary.meetingsScheduled = (lead.callSummary.meetingsScheduled || 0) + 1
        lead.lastActivityAt = new Date()
        await lead.save()
      }

      await activity.populate('meetingScheduled.attendees', 'name email')

      res.json({
        success: true,
        data: activity,
        message: 'Meeting scheduled successfully'
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
 * @desc    Update meeting status
 * @route   PUT /api/call-activities/:id/meeting-status
 * @access  Private
 */
router.put('/:id/meeting-status',
  requireModulePermission('call_activities', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { status, meetingOutcome, meetingNotes } = req.body

      const activity = await CallActivity.findById(req.params.id)

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Call activity not found'
        })
      }

      if (!activity.meetingScheduled?.isScheduled) {
        return res.status(400).json({
          success: false,
          message: 'No meeting scheduled for this activity'
        })
      }

      await activity.updateMeetingStatus({
        status,
        meetingOutcome,
        meetingNotes
      }, req.user._id, req.user.name)

      // Update lead
      const lead = await Lead.findById(activity.lead)
      if (lead) {
        if (status === 'completed') {
          lead.callSummary.meetingsCompleted = (lead.callSummary.meetingsCompleted || 0) + 1
        }

        lead.activities.push({
          action: `meeting_${status}`,
          description: `Meeting ${status}: ${meetingOutcome || 'No outcome specified'}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        })
        lead.lastActivityAt = new Date()
        await lead.save()
      }

      res.json({
        success: true,
        data: activity,
        message: `Meeting marked as ${status}`
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
 * @desc    Add call recording
 * @route   POST /api/call-activities/:id/recording
 * @access  Private
 */
router.post('/:id/recording',
  requireModulePermission('call_activities', 'edit'),
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { url, duration, transcription } = req.body

      const activity = await CallActivity.findById(req.params.id)

      if (!activity) {
        return res.status(404).json({
          success: false,
          message: 'Call activity not found'
        })
      }

      await activity.addRecording({
        url,
        duration,
        transcription
      }, req.user._id, req.user.name)

      res.json({
        success: true,
        data: activity,
        message: 'Recording added successfully'
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
 * @desc    Get user's call statistics
 * @route   GET /api/call-activities/stats/user/:userId
 * @access  Private
 */
router.get('/stats/user/:userId',
  requireModulePermission('call_activities', 'view'),
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query

      // Verify access
      if (req.params.userId !== req.user._id.toString() &&
          !['super_admin', 'company_admin', 'sales_manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view other user stats'
        })
      }

      const stats = await CallActivity.getUserCallStats(
        req.params.userId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      )

      res.json({
        success: true,
        data: stats
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
 * @desc    Get my call statistics
 * @route   GET /api/call-activities/stats/me
 * @access  Private
 */
router.get('/stats/me',
  requireModulePermission('call_activities', 'view'),
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const userId = req.user._id
      const companyQuery = companyScopedQuery(req)

      // Today's date range
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Build user filter (admins see all, others see own)
      const userFilter = ['super_admin', 'company_admin', 'sales_manager'].includes(req.user.role)
        ? companyQuery
        : { ...companyQuery, calledBy: userId }

      // Count calls made today (completed calls)
      const todayCalls = await CallActivity.countDocuments({
        ...userFilter,
        status: { $in: ['completed', 'no_answer', 'busy', 'voicemail', 'wrong_number'] },
        createdAt: { $gte: today, $lt: tomorrow }
      })

      // Count scheduled meetings (future meetings from call activities)
      const scheduledMeetings = await CallActivity.countDocuments({
        ...userFilter,
        'meetingScheduled.isScheduled': true,
        'meetingScheduled.scheduledDate': { $gte: today }
      })

      // Also get outcome breakdown for additional stats
      const outcomeStats = await CallActivity.aggregate([
        { $match: { ...userFilter, createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: '$outcome', count: { $sum: 1 } } }
      ])

      res.json({
        success: true,
        data: {
          todayCalls,
          scheduledMeetings,
          outcomeBreakdown: outcomeStats
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
 * @desc    Get today's scheduled calls
 * @route   GET /api/call-activities/scheduled/today
 * @access  Private
 */
router.get('/scheduled/today',
  requireModulePermission('call_activities', 'view'),
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const queryFilter = companyScopedQuery(req, {
        status: 'scheduled',
        'scheduledFor': {
          $gte: today,
          $lt: tomorrow
        }
      })

      // Filter by user if not admin
      if (!['super_admin', 'company_admin', 'sales_manager'].includes(req.user.role)) {
        queryFilter.calledBy = req.user._id
      }

      const scheduledCalls = await CallActivity.find(queryFilter)
        .populate('lead', 'name phone leadId')
        .populate('calledBy', 'name')
        .sort({ scheduledFor: 1 })

      res.json({
        success: true,
        data: scheduledCalls,
        count: scheduledCalls.length
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
