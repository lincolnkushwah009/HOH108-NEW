import express from 'express'
import Lead from '../models/Lead.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  getLeadQueryFilter,
  canAccessLead,
  canModifyResource,
  PERMISSIONS
} from '../middleware/rbac.js'
import { getNextAssignee } from '../utils/roundRobinService.js'
import { getDispositionCategory, validateDisposition, getDispositionTree } from '../config/dispositions.js'
import { notifyLeadEvent } from '../utils/notificationService.js'
import { maskPhone, shouldMaskPhone } from '../utils/phoneMask.js'
import { uploadFloorPlan } from '../middleware/upload.js'

const router = express.Router()

// Helper function to get user name
const getUserName = async (userId) => {
  if (!userId) return 'System'
  try {
    const user = await User.findById(userId).select('name')
    return user ? user.name : 'Unknown User'
  } catch {
    return 'Unknown User'
  }
}

// Helper function to format field names for display
const formatFieldName = (field) => {
  const fieldNames = {
    status: 'Status',
    priority: 'Priority',
    assignedTo: 'Assigned To',
    service: 'Service',
    budget: 'Budget',
    propertyType: 'Property Type',
    followUpDate: 'Follow-up Date',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    message: 'Message',
    area: 'Area'
  }
  return fieldNames[field] || field
}

/**
 * @desc    Create lead (from website form)
 * @route   POST /api/leads
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    // Get websiteSource from request body (sent by frontend)
    const websiteSource = req.body.websiteSource || 'HOH108'

    // All leads are mapped to Interior Plus (operational entity)
    // HOH108 is the holding company for strategic decisions only
    // websiteSource is preserved for tracking the lead origin
    let company = null
    const companyCode = 'IP'

    try {
      // Try to find by code first
      company = await Company.findOne({ code: companyCode })

      // If not found by code, try to find any active company as fallback
      if (!company) {
        console.log(`Company with code ${companyCode} not found, trying fallback...`)
        company = await Company.findOne({ isActive: true })
        if (company) {
          console.log('Using fallback company:', company.name)
        }
      }
    } catch (err) {
      console.error('Error finding company:', err)
    }

    // If still no company found, return a user-friendly error
    if (!company) {
      console.error('No company found for lead submission')
      return res.status(400).json({
        success: false,
        message: 'Unable to process your request. Please try again later or contact support.'
      })
    }

    // Extract city from request
    const city = req.body.location?.city || req.body.city || ''
    const validCities = ['Bengaluru', 'Mysuru', 'Hyderabad']

    // Create lead with initial activity
    const leadData = {
      ...req.body,
      websiteSource,
      company: company._id,
      location: {
        city: validCities.includes(city) ? city : '',
        state: req.body.location?.state || '',
        pincode: req.body.location?.pincode || '',
        address: req.body.location?.address || ''
      },
      activities: [{
        action: 'created',
        description: `Lead created from ${websiteSource}${city ? ` (${city})` : ''}`,
        performedByName: 'System',
        metadata: {
          source: req.body.source,
          service: req.body.service,
          websiteSource: websiteSource,
          city: city || undefined
        }
      }],
      lastActivityAt: new Date()
    }

    // Generate leadId with new naming convention
    // Format: {Company}-{Location}-{Source}-{DDMMYY}-{Seq}
    leadData.leadId = await company.generateLeadId({
      location: { city: city },
      source: req.body.source || 'website'
    })

    const lead = await Lead.create(leadData)

    // ---- CITY-BASED AUTO-ASSIGNMENT via Round Robin ----
    if (validCities.includes(city)) {
      try {
        const assignee = await getNextAssignee(company._id, city, 'pre_sales')

        if (assignee) {
          lead.departmentAssignments.preSales = {
            employee: assignee.userId,
            employeeName: assignee.userName,
            assignedAt: new Date(),
            assignedBy: null,
            assignedByName: 'System (Round-Robin)',
            isActive: true
          }
          lead.assignedTo = assignee.userId
          lead.primaryStatus = 'new'

          lead.activities.push({
            action: 'assigned',
            description: `Auto-assigned to Pre-Sales: ${assignee.userName} (${city} - Round Robin)`,
            performedByName: 'System',
            newValue: { department: 'preSales', employee: assignee.userId, employeeName: assignee.userName }
          })

          // Add to team members
          lead.teamMembers.push({
            user: assignee.userId,
            role: 'owner',
            assignedAt: new Date()
          })

          await lead.save()

          // Fire notification (non-blocking)
          notifyLeadEvent({
            companyId: company._id,
            lead,
            event: 'lead_assigned',
            title: `New Lead Assigned - ${city}`,
            message: `A new lead "${lead.name}" from ${city} has been assigned to you via round-robin.`,
            assignedOwner: assignee.userId,
            performedBy: null
          })
        }
      } catch (assignErr) {
        console.error('Auto-assignment error:', assignErr.message)
        // Lead is created even if assignment fails
      }
    }

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Thank you! We will contact you soon.'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// Protected routes below
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all leads (company-scoped)
 * @route   GET /api/leads
 * @access  Private
 */
router.get('/',
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const {
        status,
        primaryStatus,
        service,
        priority,
        secondaryStatus,
        websiteSource,
        leadType,
        assignedTo,
        city,
        page = 1,
        limit = 20,
        search,
        sortBy = 'lastActivityAt',
        sortOrder = 'desc'
      } = req.query

      // Build query with company scope and user access
      const queryFilter = getLeadQueryFilter(req)

      if (status) queryFilter.status = status
      if (primaryStatus) queryFilter.primaryStatus = primaryStatus
      if (service) queryFilter.service = service
      if (priority) queryFilter.priority = priority
      if (secondaryStatus) queryFilter.secondaryStatus = secondaryStatus
      if (websiteSource) queryFilter.websiteSource = websiteSource
      if (assignedTo) queryFilter.assignedTo = assignedTo
      if (city) queryFilter['location.city'] = city

      // Disposition filters
      if (req.query.dispositionGroup) queryFilter['disposition.group'] = req.query.dispositionGroup
      if (req.query.dispositionCategory) queryFilter['disposition.category'] = req.query.dispositionCategory

      // Filter by leadType
      if (leadType) {
        if (leadType === 'lead') {
          const leadTypeCondition = { $or: [{ leadType: 'lead' }, { leadType: { $exists: false } }] }
          if (queryFilter.$or) {
            // Preserve RBAC $or filter by combining with $and
            queryFilter.$and = queryFilter.$and || []
            queryFilter.$and.push({ $or: queryFilter.$or })
            queryFilter.$and.push(leadTypeCondition)
            delete queryFilter.$or
          } else {
            queryFilter.$or = leadTypeCondition.$or
          }
        } else {
          queryFilter.leadType = leadType
        }
      }

      // Search filter
      if (search) {
        const searchConditions = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { leadId: { $regex: search, $options: 'i' } }
        ]

        if (queryFilter.$or) {
          queryFilter.$and = queryFilter.$and || []
          queryFilter.$and.push({ $or: queryFilter.$or })
          queryFilter.$and.push({ $or: searchConditions })
          delete queryFilter.$or
        } else if (queryFilter.$and) {
          queryFilter.$and.push({ $or: searchConditions })
        } else {
          queryFilter.$or = searchConditions
        }
      }

      const total = await Lead.countDocuments(queryFilter)

      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

      const leads = await Lead.find(queryFilter)
        .populate('assignedTo', 'name email avatar')
        .populate('teamMembers.user', 'name email')
        .populate('company', 'name code')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      // Apply phone masking for pre-sales users on locked leads
      const leadsData = leads.map(lead => {
        const obj = lead.toObject()
        if (req.user && shouldMaskPhone(req.user, lead)) {
          obj.phone = maskPhone(obj.phone)
          if (obj.alternatePhone) obj.alternatePhone = maskPhone(obj.alternatePhone)
          obj._phoneMasked = true
        }
        return obj
      })

      res.json({
        success: true,
        data: leadsData,
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
 * @desc    Get disposition config for current user
 * @route   GET /api/leads/dispositions/config
 * @access  Private
 */
router.get('/dispositions/config',
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const userCategory = getDispositionCategory(req.user)

      const result = {}

      if (userCategory === 'both') {
        result.pre_sales = getDispositionTree('pre_sales')
        result.sales = getDispositionTree('sales')
        result.allDispositions = true
      } else if (userCategory === 'sales') {
        result.sales = getDispositionTree('sales')
      } else {
        result.pre_sales = getDispositionTree('pre_sales')
      }

      result.userCategory = userCategory

      res.json({
        success: true,
        data: result
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
 * @desc    Get single lead with full journey
 * @route   GET /api/leads/:id
 * @access  Private
 */
router.get('/:id',
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)
        .populate('assignedTo', 'name email avatar')
        .populate('notes.addedBy', 'name avatar')
        .populate('activities.performedBy', 'name avatar')
        .populate('teamMembers.user', 'name email avatar')
        .populate('convertedToProject', 'title projectId')
        .populate('customer', 'name customerId')
        .populate('company', 'name code leadStatuses')

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Check access
      const hasAccess = await canAccessLead(req, lead)
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this lead'
        })
      }

      // Add view activity (non-blocking — don't let save errors break the view)
      if (req.user) {
        Lead.updateOne(
          { _id: lead._id },
          {
            $push: { activities: { action: 'viewed', description: `${req.user.name} viewed this lead`, performedBy: req.user._id, performedByName: req.user.name, createdAt: new Date() } },
            $set: { lastActivityAt: new Date() }
          }
        ).catch(() => {})
      }

      // Apply phone masking for pre-sales users on locked leads
      const leadData = lead.toObject()
      if (req.user && shouldMaskPhone(req.user, lead)) {
        leadData.phone = maskPhone(leadData.phone)
        if (leadData.alternatePhone) leadData.alternatePhone = maskPhone(leadData.alternatePhone)
        leadData._phoneMasked = true
      }

      res.json({
        success: true,
        data: leadData
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
 * @desc    Get lead journey/timeline
 * @route   GET /api/leads/:id/journey
 * @access  Private
 */
router.get('/:id/journey',
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)
        .select('activities teamMembers name email leadId createdAt company assignedTo')
        .populate('activities.performedBy', 'name email avatar')
        .populate('teamMembers.user', 'name email avatar')

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

      // Sort activities by date (newest first)
      const timeline = lead.activities.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )

      res.json({
        success: true,
        data: {
          leadId: lead.leadId || lead._id,
          leadName: lead.name,
          leadEmail: lead.email,
          createdAt: lead.createdAt,
          teamMembers: lead.teamMembers,
          timeline,
          totalActivities: timeline.length
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
 * @desc    Create lead (admin created)
 * @route   POST /api/leads/admin
 * @access  Private
 */
router.post('/admin',
  requirePermission(PERMISSIONS.LEADS_CREATE),
  async (req, res) => {
    try {
      // Check if activeCompany is set
      if (!req.activeCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company context not set. Please select a company.'
        })
      }

      const companyId = req.activeCompany._id

      // Get company for ID generation
      const company = await Company.findById(companyId)
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        })
      }

      // Generate lead ID with new naming convention
      // Format: {Company}-{Location}-{Source}-{DDMMYY}-{Seq}
      const leadId = await company.generateLeadId({
        location: req.body.location,
        source: req.body.source || 'website'
      })

      const lead = await Lead.create({
        ...req.body,
        leadId,
        company: companyId,
        activities: [{
          action: 'created',
          description: `Lead created by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        }],
        lastActivityAt: new Date()
      })

      await lead.populate('assignedTo', 'name email')

      res.status(201).json({
        success: true,
        data: lead
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
 * @desc    Update lead with activity tracking
 * @route   PUT /api/leads/:id
 * @access  Private
 */
router.put('/:id',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Check modify access
      if (!canModifyResource(req, lead, 'lead')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this lead'
        })
      }

      const userName = req.user.name
      const activities = []

      // Track all field changes
      const trackableFields = [
        'name', 'email', 'phone', 'service', 'propertyType',
        'message', 'status', 'priority', 'requirements'
      ]

      for (const field of trackableFields) {
        if (req.body[field] !== undefined && req.body[field] !== lead[field]) {
          let action = 'field_updated'
          let description = `${userName} changed ${formatFieldName(field)}`

          if (field === 'status') {
            action = 'status_changed'
            description = `${userName} changed status from "${lead.status}" to "${req.body.status}"`
          } else if (field === 'priority') {
            action = 'priority_changed'
            description = `${userName} changed priority from "${lead.priority}" to "${req.body.priority}"`
          } else {
            description = `${userName} changed ${formatFieldName(field)} from "${lead[field] || 'empty'}" to "${req.body[field]}"`
          }

          activities.push({
            action,
            description,
            performedBy: req.user._id,
            performedByName: userName,
            fieldChanged: field,
            oldValue: lead[field],
            newValue: req.body[field]
          })
        }
      }

      // Track follow-up changes
      if (req.body.nextFollowUp?.date !== undefined) {
        const action = req.body.nextFollowUp.date ? 'follow_up_set' : 'follow_up_removed'
        const description = req.body.nextFollowUp.date
          ? `${userName} set follow-up for ${new Date(req.body.nextFollowUp.date).toLocaleDateString()}`
          : `${userName} removed follow-up date`

        activities.push({
          action,
          description,
          performedBy: req.user._id,
          performedByName: userName,
          oldValue: lead.nextFollowUp?.date,
          newValue: req.body.nextFollowUp?.date
        })
      }

      // Track assignment changes
      if (req.body.assignedTo !== undefined) {
        const oldAssignee = lead.assignedTo
        const newAssignee = req.body.assignedTo

        if (String(oldAssignee) !== String(newAssignee)) {
          if (newAssignee) {
            const newAssigneeName = await getUserName(newAssignee)
            activities.push({
              action: 'assigned',
              description: `${userName} assigned this lead to ${newAssigneeName}`,
              performedBy: req.user._id,
              performedByName: userName,
              oldValue: oldAssignee,
              newValue: newAssignee,
              metadata: { assigneeName: newAssigneeName }
            })

            // Add to team members if not already present
            const isTeamMember = lead.teamMembers.some(
              tm => String(tm.user) === String(newAssignee)
            )
            if (!isTeamMember) {
              lead.teamMembers.push({
                user: newAssignee,
                role: 'owner',
                assignedBy: req.user._id
              })
            }
          } else {
            const oldAssigneeName = await getUserName(oldAssignee)
            activities.push({
              action: 'unassigned',
              description: `${userName} unassigned ${oldAssigneeName} from this lead`,
              performedBy: req.user._id,
              performedByName: userName,
              oldValue: oldAssignee,
              newValue: null
            })
          }
        }
      }

      // Apply updates
      Object.keys(req.body).forEach(key => {
        if (key !== 'activities' && key !== 'teamMembers' && key !== 'company' && key !== 'leadId') {
          lead[key] = req.body[key]
        }
      })

      // Add all activities
      if (activities.length > 0) {
        lead.activities.push(...activities)
        lead.lastActivityAt = new Date()
      }

      // Add current user to team members if not already
      const isTeamMember = lead.teamMembers.some(
        tm => String(tm.user) === String(req.user._id)
      )
      if (!isTeamMember) {
        lead.teamMembers.push({
          user: req.user._id,
          role: 'collaborator',
          assignedBy: req.user._id
        })
      }

      await lead.save()
      await lead.populate('assignedTo', 'name email avatar')
      await lead.populate('teamMembers.user', 'name email avatar')

      res.json({
        success: true,
        data: lead,
        activitiesAdded: activities.length
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
 * @desc    Delete lead
 * @route   DELETE /api/leads/:id
 * @access  Private
 */
router.delete('/:id',
  requirePermission(PERMISSIONS.LEADS_DELETE),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Only super admin or company admin can delete
      if (!['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete leads'
        })
      }

      // Check company access
      if (req.user.role !== 'super_admin' &&
          lead.company?.toString() !== req.user.company._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this lead'
        })
      }

      await lead.deleteOne()

      res.json({
        success: true,
        message: 'Lead deleted successfully'
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
 * @desc    Add note to lead
 * @route   POST /api/leads/:id/notes
 * @access  Private
 */
router.post('/:id/notes',
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const { content, isPinned } = req.body

      const lead = await Lead.findById(req.params.id)

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
          message: 'Not authorized to add notes to this lead'
        })
      }

      // Add note
      lead.notes.push({
        content,
        isPinned: isPinned || false,
        addedBy: req.user._id,
        addedByName: req.user.name
      })

      // Add activity
      lead.activities.push({
        action: 'note_added',
        description: `${req.user.name} added a note`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata: { notePreview: content.substring(0, 100) }
      })

      lead.lastActivityAt = new Date()

      // Add user to team if not present
      const isTeamMember = lead.teamMembers.some(
        tm => String(tm.user) === String(req.user._id)
      )
      if (!isTeamMember) {
        lead.teamMembers.push({
          user: req.user._id,
          role: 'collaborator'
        })
      }

      await lead.save()
      await lead.populate('notes.addedBy', 'name avatar')

      res.json({
        success: true,
        data: lead.notes[lead.notes.length - 1],
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
 * @desc    Update lead status
 * @route   PUT /api/leads/:id/status
 * @access  Private
 */
router.put('/:id/status',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { status } = req.body

      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Check modify access
      if (!canModifyResource(req, lead, 'lead')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this lead'
        })
      }

      // Role-based drag restrictions
      const salesStatuses = ['meeting_status', 'cold', 'warm', 'hot', 'won']
      const preSalesStatuses = ['new', 'in_progress', 'rnr', 'qualified', 'future_prospect', 'lost']

      if (req.user.role === 'pre_sales' && salesStatuses.includes(status)) {
        return res.status(403).json({
          success: false,
          message: 'Pre-sales cannot move leads to sales columns'
        })
      }

      if (req.user.role === 'sales_executive' && preSalesStatuses.includes(status) && status !== 'lost') {
        return res.status(403).json({
          success: false,
          message: 'Sales team cannot move leads to pre-sales columns'
        })
      }

      // Won can only come from hot
      if (status === 'won' && lead.primaryStatus !== 'hot') {
        return res.status(400).json({
          success: false,
          message: 'Can only move to Won from Hot status'
        })
      }

      const oldStatus = lead.status

      // Add activity
      lead.activities.push({
        action: 'status_changed',
        description: `${req.user.name} changed status from "${oldStatus}" to "${status}"`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        fieldChanged: 'status',
        oldValue: oldStatus,
        newValue: status
      })

      lead.status = status
      lead.primaryStatus = status
      lead.lastActivityAt = new Date()

      await lead.save()

      res.json({
        success: true,
        data: lead
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
 * @desc    Add activity to lead
 * @route   POST /api/leads/:id/activities
 * @access  Private
 */
router.post('/:id/activities',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { action, description, metadata } = req.body

      const lead = await Lead.findById(req.params.id)

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
          message: 'Not authorized'
        })
      }

      // Add activity
      lead.activities.push({
        action,
        description: description || `${req.user.name} logged: ${action.replace(/_/g, ' ')}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata
      })

      lead.lastActivityAt = new Date()

      // Update lastContactedAt for contact actions
      if (['contacted', 'call_made', 'email_sent', 'meeting_scheduled'].includes(action)) {
        lead.lastContactedAt = new Date()
      }

      // Add user to team if not present
      const isTeamMember = lead.teamMembers.some(
        tm => String(tm.user) === String(req.user._id)
      )
      if (!isTeamMember) {
        lead.teamMembers.push({
          user: req.user._id,
          role: 'collaborator'
        })
      }

      await lead.save()

      res.json({
        success: true,
        data: lead.activities[lead.activities.length - 1],
        message: 'Activity added successfully'
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
 * @desc    Convert lead to customer
 * @route   POST /api/leads/:id/convert
 * @access  Private
 */
router.post('/:id/convert',
  requirePermission(PERMISSIONS.LEADS_CONVERT),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Check access
      if (!canModifyResource(req, lead, 'lead')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to convert this lead'
        })
      }

      if (lead.isConverted) {
        return res.status(400).json({
          success: false,
          message: 'Lead has already been converted'
        })
      }

      // Convert to customer using the model method
      const customer = await lead.convertToCustomer(req.user._id, req.user.name)

      await lead.populate('customer', 'name customerId')

      res.json({
        success: true,
        data: {
          lead,
          customer
        },
        message: 'Lead converted to customer successfully'
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
 * @desc    Assign lead to user
 * @route   PUT /api/leads/:id/assign
 * @access  Private
 */
router.put('/:id/assign',
  requirePermission(PERMISSIONS.LEADS_ASSIGN),
  async (req, res) => {
    try {
      const { userId } = req.body

      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Verify company access
      if (req.user.role !== 'super_admin' &&
          lead.company?.toString() !== req.user.company._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      // Verify assignee exists
      const assignee = await User.findById(userId)
      if (!assignee) {
        return res.status(400).json({ success: false, message: 'User not found' })
      }

      const oldAssignee = lead.assignedTo

      lead.assignedTo = userId
      lead.activities.push({
        action: 'assigned',
        description: `${req.user.name} assigned this lead to ${assignee.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        oldValue: oldAssignee,
        newValue: userId
      })

      // Add to team
      const isTeamMember = lead.teamMembers.some(tm => tm.user.toString() === userId)
      if (!isTeamMember) {
        lead.teamMembers.push({
          user: userId,
          role: 'owner',
          assignedBy: req.user._id
        })
      }

      lead.lastActivityAt = new Date()
      await lead.save()

      await lead.populate('assignedTo', 'name email avatar')

      // Notify old and new assignee + hierarchy
      notifyLeadEvent({
        companyId: lead.company,
        lead,
        event: 'ownership_changed',
        title: 'Lead Ownership Changed',
        message: `Lead "${lead.name}" has been assigned to ${assignee.name} by ${req.user.name}.`,
        assignedOwner: userId,
        previousOwner: oldAssignee,
        performedBy: req.user._id
      })

      res.json({
        success: true,
        data: lead,
        message: `Lead assigned to ${assignee.name}`
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
 * @desc    Bulk upload leads
 * @route   POST /api/leads/bulk
 * @access  Private
 */
router.post('/bulk',
  requirePermission(PERMISSIONS.LEADS_IMPORT),
  async (req, res) => {
    try {
      const { leads } = req.body

      if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide an array of leads'
        })
      }

      const companyId = req.activeCompany._id
      const company = await Company.findById(companyId)

      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        })
      }

      const results = {
        successful: 0,
        failed: 0,
        errors: []
      }

      const createdLeads = []

      for (let i = 0; i < leads.length; i++) {
        const leadData = leads[i]

        // Validate required fields
        if (!leadData.name || !leadData.phone) {
          results.failed++
          results.errors.push({
            row: i + 1,
            data: leadData,
            error: 'Name and phone are required'
          })
          continue
        }

        try {
          // Parse location for ID generation
          const leadLocation = typeof leadData.location === 'string'
            ? { legacy: leadData.location }
            : leadData.location

          // Generate lead ID with new naming convention
          const leadId = await company.generateLeadId({
            location: leadLocation,
            source: leadData.source || 'other'
          })

          const newLead = await Lead.create({
            leadId,
            company: companyId,
            name: leadData.name,
            email: leadData.email || '',
            phone: leadData.phone,
            alternatePhone: leadData.alternatePhone || '',
            location: leadLocation,
            service: leadData.service || 'consultation',
            serviceDepartment: leadData.serviceDepartment || '',
            budget: typeof leadData.budget === 'string'
              ? { legacy: leadData.budget }
              : leadData.budget,
            propertyType: leadData.propertyType || 'apartment',
            propertyName: leadData.propertyName || '',
            area: typeof leadData.area === 'string'
              ? { legacy: leadData.area }
              : leadData.area,
            message: leadData.message || '',
            source: leadData.source || 'bulk-upload',
            websiteSource: leadData.websiteSource || req.activeCompany.code || 'HOH108',
            status: leadData.status || 'new',
            priority: leadData.priority || 'medium',
            secondaryStatus: leadData.secondaryStatus || 'warm',
            activities: [{
              action: 'created',
              description: `Lead created via bulk upload by ${req.user.name}`,
              performedBy: req.user._id,
              performedByName: req.user.name,
              metadata: {
                source: 'bulk-upload',
                uploadedAt: new Date()
              }
            }],
            lastActivityAt: new Date()
          })

          createdLeads.push(newLead)
          results.successful++
        } catch (error) {
          results.failed++
          results.errors.push({
            row: i + 1,
            data: leadData,
            error: error.message
          })
        }
      }

      res.status(201).json({
        success: true,
        message: `Bulk upload completed: ${results.successful} leads created, ${results.failed} failed`,
        data: {
          total: leads.length,
          successful: results.successful,
          failed: results.failed,
          errors: results.errors,
          createdLeads
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
 * @desc    Get team members who worked on lead
 * @route   GET /api/leads/:id/team
 * @access  Private
 */
router.get('/:id/team',
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)
        .select('teamMembers activities name')
        .populate('teamMembers.user', 'name email avatar role')

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
          message: 'Not authorized'
        })
      }

      // Calculate activity count per team member
      const teamWithStats = lead.teamMembers.map(member => {
        const activityCount = lead.activities.filter(
          a => String(a.performedBy) === String(member.user._id)
        ).length

        const lastActivity = lead.activities
          .filter(a => String(a.performedBy) === String(member.user._id))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

        return {
          ...member.toObject(),
          activityCount,
          lastActivityAt: lastActivity?.createdAt
        }
      })

      res.json({
        success: true,
        data: {
          leadName: lead.name,
          team: teamWithStats,
          totalTeamMembers: teamWithStats.length
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
 * @desc    Set disposition on a lead
 * @route   PUT /api/leads/:id/disposition
 * @access  Private
 */
router.put('/:id/disposition',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { category, group, subDisposition, remarks } = req.body

      if (!category || !group || !subDisposition) {
        return res.status(400).json({
          success: false,
          message: 'Category, group, and subDisposition are required'
        })
      }

      const lead = await Lead.findById(req.params.id)
      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Check modify access
      if (!canModifyResource(req, lead, 'lead')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this lead'
        })
      }

      // Validate disposition against config
      const validation = validateDisposition(category, group, subDisposition)
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        })
      }

      // Enforce effort validation for "above 10 attempts" dispositions
      if (validation.requiresMinAttempts) {
        const totalAttempts = lead.callSummary?.totalAttempts || 0
        if (totalAttempts < validation.requiresMinAttempts) {
          return res.status(400).json({
            success: false,
            message: `This disposition requires at least ${validation.requiresMinAttempts} call attempts. Current attempts: ${totalAttempts}`
          })
        }
      }

      // Set disposition using model method
      await lead.setDisposition({
        category,
        group,
        subDisposition,
        groupLabel: validation.groupLabel,
        subDispositionLabel: validation.subDispositionLabel,
        remarks,
        primaryStatusMapping: validation.primaryStatusMapping
      }, req.user._id, req.user.name)

      // Notify for significant dispositions
      const significantGroups = ['lost', 'qualified_to_sales', 'won']
      if (significantGroups.includes(group)) {
        notifyLeadEvent({
          companyId: lead.company,
          lead,
          event: 'disposition_changed',
          title: `Lead Disposition: ${validation.groupLabel}`,
          message: `Lead "${lead.name}" dispositioned as ${validation.groupLabel} > ${validation.subDispositionLabel} by ${req.user.name}.`,
          assignedOwner: lead.assignedTo,
          performedBy: req.user._id
        })
      }

      res.json({
        success: true,
        data: lead,
        message: `Disposition set: ${validation.groupLabel} > ${validation.subDispositionLabel}`
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ==========================================
// CRM WORKFLOW ENDPOINTS
// ==========================================

/**
 * @desc    Assign lead to department(s)
 * @route   POST /api/leads/:id/assign-department
 * @access  Private
 */
router.post('/:id/assign-department',
  requirePermission(PERMISSIONS.LEADS_ASSIGN),
  async (req, res) => {
    try {
      const { department, employeeId, assignToAll } = req.body

      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Verify company access
      if (req.user.role !== 'super_admin' &&
          lead.company?.toString() !== req.user.company._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      // Check if this is an interest area assignment (no employeeId)
      const interestAreas = ['interior', 'construction']
      if (!employeeId && department && interestAreas.includes(department)) {
        // Interest area assignment
        const oldValue = lead.serviceDepartment
        lead.serviceDepartment = department

        lead.activities.push({
          action: 'field_updated',
          description: `${req.user.name} set interest area to ${department}`,
          performedBy: req.user._id,
          performedByName: req.user.name,
          fieldChanged: 'serviceDepartment',
          oldValue: oldValue,
          newValue: department
        })
        lead.lastActivityAt = new Date()

        await lead.save()

        return res.json({
          success: true,
          data: lead,
          message: `Lead interest area set to ${department}`
        })
      }

      // CRM workflow department assignment (requires employeeId)
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID required for CRM department assignment'
        })
      }

      // Get employee
      const employee = await User.findById(employeeId)
      if (!employee) {
        return res.status(400).json({
          success: false,
          message: 'Employee not found'
        })
      }

      if (assignToAll) {
        // Assign to all 3 departments (Pre-Sales, CRM, Sales)
        await lead.assignToAllDepartments(employeeId, employee.name, req.user._id, req.user.name)
      } else {
        // Assign to specific department
        if (!department || !['preSales', 'crm', 'sales'].includes(department)) {
          return res.status(400).json({
            success: false,
            message: 'Valid department required: preSales, crm, or sales'
          })
        }
        await lead.assignToDepartment(department, employeeId, employee.name, req.user._id, req.user.name)
      }

      await lead.populate('departmentAssignments.preSales.employee', 'name email')
      await lead.populate('departmentAssignments.crm.employee', 'name email')
      await lead.populate('departmentAssignments.sales.employee', 'name email')

      res.json({
        success: true,
        data: lead,
        message: assignToAll
          ? 'Lead assigned to all departments'
          : `Lead assigned to ${department} department`
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
 * @desc    Qualify lead (move to qualified status)
 * @route   PUT /api/leads/:id/qualify
 * @access  Private
 */
router.put('/:id/qualify',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { notes } = req.body

      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Check edit access
      if (!canModifyResource(req, lead, 'lead')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      await lead.qualify(req.user._id, req.user.name, notes)

      // Notify hierarchy
      notifyLeadEvent({
        companyId: lead.company,
        lead,
        event: 'lead_qualified',
        title: 'Lead Qualified',
        message: `Lead "${lead.name}" has been qualified by ${req.user.name}.`,
        assignedOwner: lead.departmentAssignments.preSales?.employee || lead.assignedTo,
        performedBy: req.user._id
      })

      res.json({
        success: true,
        data: lead,
        message: 'Lead qualified successfully'
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
 * @desc    Schedule meeting after qualification and move to meeting_status
 * @route   POST /api/leads/:id/schedule-meeting
 * @access  Private
 */
router.post('/:id/schedule-meeting',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { date, time, salesPersonId, designerId, meetingType, location, notes } = req.body

      if (!date || !salesPersonId) {
        return res.status(400).json({
          success: false,
          message: 'Meeting date and sales person are required'
        })
      }

      const lead = await Lead.findById(req.params.id)
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      if (lead.primaryStatus !== 'qualified') {
        return res.status(400).json({
          success: false,
          message: 'Only qualified leads can have meetings scheduled'
        })
      }

      // Look up sales person
      const salesPerson = await User.findById(salesPersonId)
      if (!salesPerson) {
        return res.status(400).json({ success: false, message: 'Sales person not found' })
      }

      // Look up designer if provided
      let designerName = null
      if (designerId) {
        const designer = await User.findById(designerId)
        if (!designer) {
          return res.status(400).json({ success: false, message: 'Designer not found' })
        }
        designerName = designer.name
      }

      await lead.scheduleMeetingAndTransfer({
        date, time,
        salesPersonId,
        salesPersonName: salesPerson.name,
        designerId: designerId || null,
        designerName,
        meetingType,
        location,
        notes
      }, req.user._id, req.user.name)

      res.json({
        success: true,
        data: lead,
        message: 'Meeting scheduled and lead moved to Meeting Status'
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

/**
 * @desc    Complete scheduled meeting
 * @route   PUT /api/leads/:id/meeting/complete
 * @access  Private
 */
router.put('/:id/meeting/complete',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { outcome, notes } = req.body

      const lead = await Lead.findById(req.params.id)
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      if (!lead.scheduledMeeting || !lead.scheduledMeeting.date) {
        return res.status(400).json({ success: false, message: 'No meeting scheduled for this lead' })
      }

      lead.scheduledMeeting.status = 'completed'
      lead.scheduledMeeting.completedAt = new Date()
      lead.scheduledMeeting.outcome = outcome || ''

      lead.activities.push({
        action: 'meeting_completed',
        description: `Scheduled meeting completed by ${req.user.name}${outcome ? `. Outcome: ${outcome}` : ''}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata: { outcome, notes }
      })

      if (!lead.dateTracking) lead.dateTracking = {}
      if (!lead.dateTracking.firstSalesMeetingDate) {
        lead.dateTracking.firstSalesMeetingDate = new Date()
      }

      lead.lastActivityAt = new Date()
      await lead.save()

      res.json({ success: true, data: lead, message: 'Meeting marked as completed' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

/**
 * @desc    Mark lead as RNR
 * @route   PUT /api/leads/:id/rnr
 * @access  Private
 */
router.put('/:id/rnr',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { notes } = req.body

      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      if (!canModifyResource(req, lead, 'lead')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      await lead.markAsRNR(req.user._id, req.user.name, notes)

      notifyLeadEvent({
        companyId: lead.company,
        lead,
        event: 'status_changed',
        title: 'Lead Marked as RNR',
        message: `Lead "${lead.name}" has been marked as RNR by ${req.user.name}.`,
        assignedOwner: lead.assignedTo,
        performedBy: req.user._id
      })

      res.json({
        success: true,
        data: lead,
        message: 'Lead marked as RNR'
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
 * @desc    Mark lead as Future Prospect
 * @route   PUT /api/leads/:id/future-prospect
 * @access  Private
 */
router.put('/:id/future-prospect',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { notes, followUpDate } = req.body

      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      if (!canModifyResource(req, lead, 'lead')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      await lead.markAsFutureProspect(req.user._id, req.user.name, notes)

      // Set follow-up date if provided
      if (followUpDate) {
        lead.nextFollowUp = {
          date: new Date(followUpDate),
          type: 'future_prospect_check',
          notes: 'Re-engage future prospect'
        }
        await lead.save()
      }

      notifyLeadEvent({
        companyId: lead.company,
        lead,
        event: 'status_changed',
        title: 'Lead Marked as Future Prospect',
        message: `Lead "${lead.name}" has been marked as Future Prospect by ${req.user.name}.`,
        assignedOwner: lead.assignedTo,
        performedBy: req.user._id
      })

      res.json({
        success: true,
        data: lead,
        message: 'Lead marked as Future Prospect'
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
 * @desc    Mark lead as Lost
 * @route   PUT /api/leads/:id/lost
 * @access  Private
 */
router.put('/:id/lost',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { reason } = req.body

      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      if (!canModifyResource(req, lead, 'lead')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      await lead.markAsLost(req.user._id, req.user.name, reason || 'No reason provided')

      notifyLeadEvent({
        companyId: lead.company,
        lead,
        event: 'status_changed',
        title: 'Lead Marked as Lost',
        message: `Lead "${lead.name}" has been marked as Lost by ${req.user.name}. Reason: ${reason || 'Not specified'}.`,
        assignedOwner: lead.assignedTo,
        performedBy: req.user._id
      })

      res.json({
        success: true,
        data: lead,
        message: 'Lead marked as Lost'
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
 * @desc    Reactivate a lost/RNR/future prospect lead
 * @route   PUT /api/leads/:id/reactivate
 * @access  Private
 */
router.put('/:id/reactivate',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { notes } = req.body

      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      if (!canModifyResource(req, lead, 'lead')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      if (!['lost', 'rnr', 'future_prospect'].includes(lead.primaryStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Only lost, RNR, or future prospect leads can be reactivated'
        })
      }

      await lead.reactivate(req.user._id, req.user.name, notes)

      notifyLeadEvent({
        companyId: lead.company,
        lead,
        event: 'status_changed',
        title: 'Lead Reactivated',
        message: `Lead "${lead.name}" has been reactivated by ${req.user.name}.`,
        assignedOwner: lead.assignedTo,
        performedBy: req.user._id
      })

      res.json({
        success: true,
        data: lead,
        message: 'Lead reactivated successfully'
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
 * @desc    Update lead's secondary status (Hot/Warm/Cold/Future)
 * @route   PUT /api/leads/:id/secondary-status
 * @access  Private
 */
router.put('/:id/secondary-status',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const { secondaryStatus } = req.body

      if (!['hot', 'warm', 'cold', 'future'].includes(secondaryStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid secondary status. Must be: hot, warm, cold, or future'
        })
      }

      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      if (!canModifyResource(req, lead, 'lead')) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      const oldStatus = lead.secondaryStatus

      lead.secondaryStatus = secondaryStatus
      lead.activities.push({
        action: 'secondary_status_changed',
        description: `Secondary status changed from ${oldStatus || 'none'} to ${secondaryStatus}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        oldValue: oldStatus,
        newValue: secondaryStatus
      })
      lead.lastActivityAt = new Date()

      await lead.save()

      res.json({
        success: true,
        data: lead,
        message: `Secondary status updated to ${secondaryStatus}`
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
 * @desc    Lock pre-sales data (after qualification)
 * @route   PUT /api/leads/:id/lock-presales
 * @access  Private (Sales team only)
 */
router.put('/:id/lock-presales',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      // Only sales department or admin can lock
      if (!['super_admin', 'company_admin', 'sales_manager'].includes(req.user.role) &&
          req.user.subDepartment !== 'sales_closure') {
        return res.status(403).json({
          success: false,
          message: 'Only Sales team can lock pre-sales data'
        })
      }

      if (lead.primaryStatus !== 'qualified') {
        return res.status(400).json({
          success: false,
          message: 'Lead must be qualified before locking pre-sales data'
        })
      }

      lead.preSalesLocked = true
      lead.activities.push({
        action: 'presales_locked',
        description: `Pre-sales data locked by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })
      lead.lastActivityAt = new Date()

      await lead.save()

      res.json({
        success: true,
        data: lead,
        message: 'Pre-sales data locked. Only Sales team can now edit this lead.'
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
 * @desc    Get leads by department
 * @route   GET /api/leads/department/:department
 * @access  Private
 */
router.get('/department/:department',
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const { department } = req.params
      const { status, page = 1, limit = 20 } = req.query

      if (!['preSales', 'crm', 'sales'].includes(department)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department. Must be: preSales, crm, or sales'
        })
      }

      const queryFilter = getLeadQueryFilter(req)
      queryFilter[`departmentAssignments.${department}.isActive`] = true

      if (status) queryFilter.primaryStatus = status

      const total = await Lead.countDocuments(queryFilter)

      const leads = await Lead.find(queryFilter)
        .populate(`departmentAssignments.${department}.employee`, 'name email avatar')
        .populate('assignedTo', 'name email')
        .sort({ lastActivityAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      res.json({
        success: true,
        data: leads,
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
 * @desc    Get lead workflow summary
 * @route   GET /api/leads/:id/workflow
 * @access  Private
 */
router.get('/:id/workflow',
  requirePermission(PERMISSIONS.LEADS_VIEW),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)
        .populate('departmentAssignments.preSales.employee', 'name email avatar')
        .populate('departmentAssignments.crm.employee', 'name email avatar')
        .populate('departmentAssignments.sales.employee', 'name email avatar')
        .populate('salesOrder', 'salesOrderId status costEstimation.finalAmount')
        .populate('customer', 'name customerId')

      if (!lead) {
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        })
      }

      if (!await canAccessLead(req, lead)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      // Get call activities count
      const CallActivity = (await import('../models/CallActivity.js')).default
      const callStats = await CallActivity.getLeadCallStats(lead._id)

      res.json({
        success: true,
        data: {
          lead: {
            _id: lead._id,
            leadId: lead.leadId,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            primaryStatus: lead.primaryStatus,
            secondaryStatus: lead.secondaryStatus,
            preSalesLocked: lead.preSalesLocked
          },
          departmentAssignments: lead.departmentAssignments,
          callSummary: lead.callSummary,
          callStats,
          rnrTracking: lead.rnrTracking,
          salesOrder: lead.salesOrder,
          customer: lead.customer,
          isConverted: lead.isConverted,
          convertedAt: lead.convertedAt
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

// ==========================================
// CITY-BASED TRANSFER WORKFLOW
// ==========================================

/**
 * @desc    Transfer qualified lead to Sales Manager (AGM) of the city
 * @route   POST /api/leads/:id/transfer-to-sales
 * @access  Private
 */
router.post('/:id/transfer-to-sales',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      if (!['qualified', 'meeting_status', 'cold', 'warm', 'hot'].includes(lead.primaryStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Only qualified or sales pipeline leads can be transferred to sales'
        })
      }

      const city = lead.location?.city
      if (!city) {
        return res.status(400).json({
          success: false,
          message: 'Lead has no city assigned. Cannot determine sales manager.'
        })
      }

      // Try round-robin assignment for sales team by city + showroom (Experience Center)
      const showroom = lead.location?.legacy || null // showroom from lead location if available
      let salesManager = null
      const roundRobinResult = await getNextAssignee(lead.company, city, 'sales_closure', showroom)
      if (roundRobinResult) {
        salesManager = await User.findById(roundRobinResult.userId).select('_id name')
      }

      // Fallback: find the sales_manager (AGM) for this city
      if (!salesManager) {
        salesManager = await User.findOne({
          company: lead.company,
          role: 'sales_manager',
          'hrDetails.city': city,
          isActive: true
        })
      }

      if (!salesManager) {
        return res.status(400).json({
          success: false,
          message: `No Sales team member found for ${city}. Please assign manually.`
        })
      }

      const previousPreSalesEmployee = lead.departmentAssignments.preSales?.employee

      // Lock pre-sales
      lead.preSalesLocked = true
      lead.lockedAt = new Date()
      lead.lockedBy = req.user._id

      // Set date tracking
      if (!lead.dateTracking) lead.dateTracking = {}
      lead.dateTracking.transferredToSalesDate = new Date()

      // Assign to sales department (sales_manager)
      lead.departmentAssignments.sales = {
        employee: salesManager._id,
        employeeName: salesManager.name,
        assignedAt: new Date(),
        assignedBy: req.user._id,
        assignedByName: req.user.name,
        isActive: true,
        isExclusive: true
      }

      // Update primary assignedTo
      lead.assignedTo = salesManager._id

      // Add sales manager to team
      const isMember = lead.teamMembers.some(tm => tm.user?.toString() === salesManager._id.toString())
      if (!isMember) {
        lead.teamMembers.push({ user: salesManager._id, role: 'owner', assignedBy: req.user._id })
      }

      // Change pre-sales team member role to 'viewer'
      if (previousPreSalesEmployee) {
        const preSalesMember = lead.teamMembers.find(
          tm => tm.user?.toString() === previousPreSalesEmployee.toString()
        )
        if (preSalesMember) {
          preSalesMember.role = 'viewer'
        }
      }

      lead.activities.push({
        action: 'assigned',
        description: `Lead transferred to Sales Manager: ${salesManager.name} (${city}). Pre-sales locked.`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        newValue: { department: 'sales', employee: salesManager._id, employeeName: salesManager.name, preSalesLocked: true }
      })
      lead.lastActivityAt = new Date()

      await lead.save()

      // Notify
      notifyLeadEvent({
        companyId: lead.company,
        lead,
        event: 'lead_transferred',
        title: `Qualified Lead Transferred - ${city}`,
        message: `Lead "${lead.name}" has been qualified and transferred to Sales Manager ${salesManager.name}.`,
        assignedOwner: salesManager._id,
        previousOwner: previousPreSalesEmployee,
        performedBy: req.user._id
      })

      res.json({
        success: true,
        data: lead,
        message: `Lead transferred to Sales Manager: ${salesManager.name}`
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

/**
 * @desc    Sales Manager assigns qualified lead to a sales executive
 * @route   POST /api/leads/:id/assign-sales-executive
 * @access  Private (sales_manager+ only)
 */
router.post('/:id/assign-sales-executive',
  requirePermission(PERMISSIONS.LEADS_ASSIGN),
  async (req, res) => {
    try {
      const { executiveId } = req.body

      // Only sales_manager or higher can do this
      if (!['super_admin', 'company_admin', 'sales_manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only Sales Manager can assign sales executives'
        })
      }

      const lead = await Lead.findById(req.params.id)
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      if (!['qualified', 'meeting_status', 'cold', 'warm', 'hot'].includes(lead.primaryStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Only leads in the sales pipeline can be assigned to sales executives'
        })
      }

      const executive = await User.findById(executiveId)
      if (!executive) {
        return res.status(400).json({ success: false, message: 'Sales executive not found' })
      }

      const previousAssignee = lead.assignedTo

      // Update the sales assignment to the executive
      lead.departmentAssignments.sales = {
        employee: executive._id,
        employeeName: executive.name,
        assignedAt: new Date(),
        assignedBy: req.user._id,
        assignedByName: req.user.name,
        isActive: true,
        isExclusive: true
      }
      lead.assignedTo = executive._id

      const isMember = lead.teamMembers.some(tm => tm.user?.toString() === executive._id.toString())
      if (!isMember) {
        lead.teamMembers.push({ user: executive._id, role: 'owner', assignedBy: req.user._id })
      }

      lead.activities.push({
        action: 'assigned',
        description: `Sales Manager ${req.user.name} assigned lead to Sales Executive: ${executive.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        newValue: { department: 'sales', employee: executive._id, employeeName: executive.name }
      })
      lead.lastActivityAt = new Date()

      await lead.save()

      // Notify
      notifyLeadEvent({
        companyId: lead.company,
        lead,
        event: 'lead_assigned',
        title: 'Lead Assigned to You',
        message: `Sales Manager ${req.user.name} assigned lead "${lead.name}" to you.`,
        assignedOwner: executive._id,
        previousOwner: previousAssignee,
        performedBy: req.user._id
      })

      res.json({
        success: true,
        data: lead,
        message: `Lead assigned to ${executive.name}`
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// ==========================================
// FLOOR PLAN UPLOAD
// ==========================================

/**
 * @desc    Upload floor plan for a lead
 * @route   POST /api/leads/:id/floor-plan
 * @access  Private
 */
router.post('/:id/floor-plan',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  uploadFloorPlan.single('floorPlan'),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' })
      }

      lead.floorPlan = `/uploads/floor-plans/${req.file.filename}`

      lead.activities.push({
        action: 'document_added',
        description: `Floor plan uploaded: ${req.file.originalname}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype
        }
      })
      lead.lastActivityAt = new Date()

      await lead.save()

      res.json({
        success: true,
        data: { floorPlan: lead.floorPlan },
        message: 'Floor plan uploaded successfully'
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// ==========================================
// REVISED BUDGET (Role-Restricted)
// ==========================================

/**
 * @desc    Update revised budget (only AGM/Sales Head/Design Head)
 * @route   PUT /api/leads/:id/revised-budget
 * @access  Private (sales_manager, design_head, admin only)
 */
router.put('/:id/revised-budget',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      // Role check: Only AGM (sales_manager), Design Head, or admin
      const isAuthorized =
        ['super_admin', 'company_admin', 'sales_manager'].includes(req.user.role) ||
        req.user.approvalAuthority?.approverRole === 'design_head'

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Only AGM, Sales Head, or Design Head can update revised budget'
        })
      }

      const lead = await Lead.findById(req.params.id)
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      // Lead must be in sales pipeline
      if (!['meeting_status', 'cold', 'warm', 'hot'].includes(lead.primaryStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Revised budget can only be set for leads in the sales pipeline'
        })
      }

      const { min, max, notes } = req.body

      const oldBudget = lead.revisedBudget ? { min: lead.revisedBudget.min, max: lead.revisedBudget.max } : null

      lead.revisedBudget = {
        min: min || 0,
        max: max || 0,
        currency: 'INR',
        revisedBy: req.user._id,
        revisedByName: req.user.name,
        revisedAt: new Date(),
        notes: notes || ''
      }

      lead.activities.push({
        action: 'field_updated',
        description: `Revised budget updated to ₹${(min || 0).toLocaleString('en-IN')} - ₹${(max || 0).toLocaleString('en-IN')}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        fieldChanged: 'revisedBudget',
        oldValue: oldBudget,
        newValue: { min, max }
      })
      lead.lastActivityAt = new Date()

      await lead.save()

      res.json({
        success: true,
        data: { revisedBudget: lead.revisedBudget },
        message: 'Revised budget updated successfully'
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// ==========================================
// REQUIREMENT MEETING
// ==========================================

/**
 * @desc    Create/update requirement meeting for a lead
 * @route   POST /api/leads/:id/requirement-meeting
 * @access  Private
 */
router.post('/:id/requirement-meeting',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      if (!['meeting_status', 'cold', 'warm', 'hot'].includes(lead.primaryStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Requirement meeting can only be created for leads in the sales pipeline'
        })
      }

      const { meetingType, scheduledDate, location, requirements, roomDetails, attendees, notes } = req.body

      if (!meetingType) {
        return res.status(400).json({
          success: false,
          message: 'Meeting type is required (virtual, showroom_visit, or site_visit)'
        })
      }

      const isUpdate = !!lead.requirementMeeting?.meetingType

      lead.requirementMeeting = {
        meetingType,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        location: location || '',
        requirements: requirements || '',
        roomDetails: roomDetails || [],
        attendees: attendees || [],
        notes: notes || '',
        status: 'scheduled',
        recordedBy: req.user._id,
        recordedByName: req.user.name,
        recordedAt: new Date()
      }

      const typeLabel = meetingType === 'virtual' ? 'Virtual' : meetingType === 'showroom_visit' ? 'Showroom Visit' : 'Site Visit'

      lead.activities.push({
        action: 'meeting_scheduled',
        description: `Requirement meeting ${isUpdate ? 'updated' : 'created'}: ${typeLabel}${scheduledDate ? ' on ' + new Date(scheduledDate).toLocaleDateString('en-IN') : ''}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata: { meetingType, scheduledDate }
      })
      lead.lastActivityAt = new Date()

      await lead.save()

      res.json({
        success: true,
        data: { requirementMeeting: lead.requirementMeeting },
        message: `Requirement meeting ${isUpdate ? 'updated' : 'created'} successfully`
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

/**
 * @desc    Update requirement meeting status
 * @route   PUT /api/leads/:id/requirement-meeting/status
 * @access  Private
 */
router.put('/:id/requirement-meeting/status',
  requirePermission(PERMISSIONS.LEADS_EDIT),
  async (req, res) => {
    try {
      const lead = await Lead.findById(req.params.id)
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      if (!lead.requirementMeeting?.meetingType) {
        return res.status(400).json({ success: false, message: 'No requirement meeting exists for this lead' })
      }

      const { status } = req.body
      if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' })
      }

      lead.requirementMeeting.status = status
      if (status === 'completed') {
        lead.requirementMeeting.completedDate = new Date()
      }

      lead.activities.push({
        action: 'status_changed',
        description: `Requirement meeting marked as ${status}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata: { meetingStatus: status }
      })
      lead.lastActivityAt = new Date()

      await lead.save()

      res.json({
        success: true,
        data: { requirementMeeting: lead.requirementMeeting },
        message: `Requirement meeting status updated to ${status}`
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// ==========================================
// DESIGN TEAM ASSIGNMENT (Design Head Only)
// ==========================================

/**
 * @desc    Assign designer to a lead (Design Head only)
 * @route   POST /api/leads/:id/assign-designer
 * @access  Private (design_head, admin only)
 */
router.post('/:id/assign-designer',
  requirePermission(PERMISSIONS.LEADS_ASSIGN),
  async (req, res) => {
    try {
      // Only Design Head or admin can assign
      const isDesignHead = req.user.approvalAuthority?.approverRole === 'design_head'
      const isAdmin = ['super_admin', 'company_admin'].includes(req.user.role)

      if (!isDesignHead && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only Design Head can assign design team members'
        })
      }

      const { designerId } = req.body
      if (!designerId) {
        return res.status(400).json({ success: false, message: 'Designer ID is required' })
      }

      const lead = await Lead.findById(req.params.id)
      if (!lead) {
        return res.status(404).json({ success: false, message: 'Lead not found' })
      }

      if (!['meeting_status', 'cold', 'warm', 'hot'].includes(lead.primaryStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Designer can only be assigned to leads in the sales pipeline'
        })
      }

      const designer = await User.findById(designerId)
      if (!designer) {
        return res.status(400).json({ success: false, message: 'Designer not found' })
      }

      lead.departmentAssignments.design = {
        employee: designer._id,
        employeeName: designer.name,
        assignedAt: new Date(),
        assignedBy: req.user._id,
        assignedByName: req.user.name,
        isActive: true
      }

      // Set date tracking
      if (!lead.dateTracking) lead.dateTracking = {}
      lead.dateTracking.designMeetingDate = new Date()

      // Add designer as collaborator in team members
      const isMember = lead.teamMembers.some(tm => tm.user?.toString() === designer._id.toString())
      if (!isMember) {
        lead.teamMembers.push({ user: designer._id, role: 'collaborator', assignedBy: req.user._id })
      }

      lead.activities.push({
        action: 'assigned',
        description: `Designer ${designer.name} assigned by Design Head ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        newValue: { department: 'design', employee: designer._id, employeeName: designer.name }
      })
      lead.lastActivityAt = new Date()

      await lead.save()

      // Notify designer
      notifyLeadEvent({
        companyId: lead.company,
        lead,
        event: 'lead_assigned',
        title: 'Design Assignment',
        message: `Design Head ${req.user.name} assigned lead "${lead.name}" to you for design work.`,
        assignedOwner: designer._id,
        performedBy: req.user._id
      })

      res.json({
        success: true,
        data: { design: lead.departmentAssignments.design },
        message: `Designer ${designer.name} assigned successfully`
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

export default router
