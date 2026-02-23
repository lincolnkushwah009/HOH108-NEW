import Lead from '../models/Lead.js'
import User from '../models/User.js'

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

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private/Admin
export const getLeads = async (req, res) => {
  try {
    const { status, service, priority, websiteSource, leadType, page = 1, limit = 20, search } = req.query

    const query = {}
    const andConditions = []

    if (status) query.status = status
    if (service) query.service = service
    if (priority) query.priority = priority
    if (websiteSource) query.websiteSource = websiteSource

    // Filter by leadType - if specified, only show that exact type
    // If leadType is 'lead', also include leads without leadType field (old data)
    if (leadType) {
      if (leadType === 'lead') {
        andConditions.push({
          $or: [
            { leadType: 'lead' },
            { leadType: { $exists: false } }
          ]
        })
      } else {
        query.leadType = leadType
      }
    }

    // Search filter
    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      })
    }

    // Combine all $and conditions if any
    if (andConditions.length > 0) {
      query.$and = andConditions
    }

    const total = await Lead.countDocuments(query)
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('teamMembers.user', 'name email')
      .populate('company', 'name code')
      .sort({ lastActivityAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: leads,
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

// @desc    Get single lead with full journey
// @route   GET /api/leads/:id
// @access  Private/Admin
export const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('notes.addedBy', 'name avatar')
      .populate('activities.performedBy', 'name avatar')
      .populate('teamMembers.user', 'name email avatar')
      .populate('convertedToProject', 'title')

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      })
    }

    // Add view activity if user is logged in
    if (req.user) {
      const userName = await getUserName(req.user.id)
      lead.activities.push({
        action: 'viewed',
        description: `${userName} viewed this lead`,
        performedBy: req.user.id,
        performedByName: userName
      })
      lead.lastActivityAt = new Date()
      await lead.save()
    }

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

// @desc    Get lead journey/timeline
// @route   GET /api/leads/:id/journey
// @access  Private/Admin
export const getLeadJourney = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .select('activities teamMembers name email createdAt')
      .populate('activities.performedBy', 'name email avatar')
      .populate('teamMembers.user', 'name email avatar')

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      })
    }

    // Sort activities by date (newest first)
    const timeline = lead.activities.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    )

    res.json({
      success: true,
      data: {
        leadId: lead._id,
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

// @desc    Create lead (from website form)
// @route   POST /api/leads
// @access  Public
export const createLead = async (req, res) => {
  try {
    // Get websiteSource from request body (sent by frontend)
    // This identifies which website the lead came from (e.g., 'HOH108', 'InteriorPlus')
    const websiteSource = req.body.websiteSource || 'HOH108'

    // Create lead with initial activity
    const leadData = {
      ...req.body,
      websiteSource,
      activities: [{
        action: 'created',
        description: `Lead created from ${websiteSource}`,
        performedByName: 'System',
        metadata: {
          source: req.body.source,
          service: req.body.service,
          websiteSource: websiteSource
        }
      }],
      lastActivityAt: new Date()
    }

    const lead = await Lead.create(leadData)

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
}

// @desc    Update lead with activity tracking
// @route   PUT /api/leads/:id
// @access  Private/Admin
export const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      })
    }

    const userName = req.user ? await getUserName(req.user.id) : 'System'
    const activities = []

    // Track all field changes
    const trackableFields = [
      'name', 'email', 'phone', 'location', 'service', 'budget',
      'propertyType', 'area', 'message', 'status', 'priority', 'followUpDate'
    ]

    for (const field of trackableFields) {
      if (req.body[field] !== undefined && req.body[field] !== lead[field]) {
        let action = 'field_updated'
        let description = `${userName} changed ${formatFieldName(field)}`

        // Special handling for specific fields
        if (field === 'status') {
          action = 'status_changed'
          description = `${userName} changed status from "${lead.status}" to "${req.body.status}"`
        } else if (field === 'priority') {
          action = 'priority_changed'
          description = `${userName} changed priority from "${lead.priority}" to "${req.body.priority}"`
        } else if (field === 'followUpDate') {
          action = req.body.followUpDate ? 'follow_up_set' : 'follow_up_removed'
          description = req.body.followUpDate
            ? `${userName} set follow-up for ${new Date(req.body.followUpDate).toLocaleDateString()}`
            : `${userName} removed follow-up date`
        } else {
          description = `${userName} changed ${formatFieldName(field)} from "${lead[field] || 'empty'}" to "${req.body[field]}"`
        }

        activities.push({
          action,
          description,
          performedBy: req.user?.id,
          performedByName: userName,
          fieldChanged: field,
          oldValue: lead[field],
          newValue: req.body[field]
        })
      }
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
            performedBy: req.user?.id,
            performedByName: userName,
            fieldChanged: 'assignedTo',
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
              role: 'owner'
            })
          }
        } else {
          const oldAssigneeName = await getUserName(oldAssignee)
          activities.push({
            action: 'unassigned',
            description: `${userName} unassigned ${oldAssigneeName} from this lead`,
            performedBy: req.user?.id,
            performedByName: userName,
            fieldChanged: 'assignedTo',
            oldValue: oldAssignee,
            newValue: null
          })
        }
      }
    }

    // Apply updates
    Object.keys(req.body).forEach(key => {
      if (key !== 'activities' && key !== 'teamMembers') {
        lead[key] = req.body[key]
      }
    })

    // Add all activities
    if (activities.length > 0) {
      lead.activities.push(...activities)
      lead.lastActivityAt = new Date()
    }

    // Add current user to team members if not already
    if (req.user) {
      const isTeamMember = lead.teamMembers.some(
        tm => String(tm.user) === String(req.user.id)
      )
      if (!isTeamMember) {
        lead.teamMembers.push({
          user: req.user.id,
          role: 'collaborator'
        })
      }
    }

    await lead.save()

    // Populate and return
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

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private/Admin
export const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id)

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      })
    }

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

// @desc    Add note to lead
// @route   POST /api/leads/:id/notes
// @access  Private/Admin
export const addNote = async (req, res) => {
  try {
    const { content } = req.body

    const lead = await Lead.findById(req.params.id)

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      })
    }

    const userName = await getUserName(req.user.id)

    // Add note
    lead.notes.push({
      content,
      addedBy: req.user.id
    })

    // Add activity
    lead.activities.push({
      action: 'note_added',
      description: `${userName} added a note`,
      performedBy: req.user.id,
      performedByName: userName,
      metadata: { notePreview: content.substring(0, 100) }
    })

    lead.lastActivityAt = new Date()

    // Add user to team if not present
    const isTeamMember = lead.teamMembers.some(
      tm => String(tm.user) === String(req.user.id)
    )
    if (!isTeamMember) {
      lead.teamMembers.push({
        user: req.user.id,
        role: 'collaborator'
      })
    }

    await lead.save()
    await lead.populate('notes.addedBy', 'name avatar')

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

// @desc    Update lead status
// @route   PUT /api/leads/:id/status
// @access  Private/Admin
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body

    const lead = await Lead.findById(req.params.id)

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      })
    }

    const userName = await getUserName(req.user.id)
    const oldStatus = lead.status

    // Add activity
    lead.activities.push({
      action: 'status_changed',
      description: `${userName} changed status from "${oldStatus}" to "${status}"`,
      performedBy: req.user.id,
      performedByName: userName,
      fieldChanged: 'status',
      oldValue: oldStatus,
      newValue: status
    })

    lead.status = status
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

// @desc    Add activity to lead (for manual activities like calls, emails, meetings)
// @route   POST /api/leads/:id/activities
// @access  Private/Admin
export const addActivity = async (req, res) => {
  try {
    const { action, description, metadata } = req.body

    const lead = await Lead.findById(req.params.id)

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      })
    }

    const userName = await getUserName(req.user.id)

    // Add activity
    lead.activities.push({
      action,
      description: description || `${userName} logged: ${action.replace(/_/g, ' ')}`,
      performedBy: req.user.id,
      performedByName: userName,
      metadata
    })

    lead.lastActivityAt = new Date()

    // Add user to team if not present
    const isTeamMember = lead.teamMembers.some(
      tm => String(tm.user) === String(req.user.id)
    )
    if (!isTeamMember) {
      lead.teamMembers.push({
        user: req.user.id,
        role: 'collaborator'
      })
    }

    await lead.save()

    res.json({
      success: true,
      data: lead,
      message: 'Activity added successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Bulk upload leads
// @route   POST /api/leads/bulk
// @access  Private/Admin
export const bulkUploadLeads = async (req, res) => {
  try {
    const { leads } = req.body

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of leads'
      })
    }

    const userName = req.user ? await getUserName(req.user.id) : 'System'
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
        const newLead = await Lead.create({
          name: leadData.name,
          email: leadData.email || '',
          phone: leadData.phone,
          location: leadData.location || '',
          service: leadData.service || 'consultation',
          budget: leadData.budget || '',
          propertyType: leadData.propertyType || '',
          area: leadData.area || '',
          message: leadData.message || '',
          source: leadData.source || 'bulk-upload',
          websiteSource: leadData.websiteSource || 'HOH108',
          status: leadData.status || 'new',
          priority: leadData.priority || 'medium',
          activities: [{
            action: 'created',
            description: `Lead created via bulk upload by ${userName}`,
            performedBy: req.user?.id,
            performedByName: userName,
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

// @desc    Get team members who worked on lead
// @route   GET /api/leads/:id/team
// @access  Private/Admin
export const getLeadTeam = async (req, res) => {
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
