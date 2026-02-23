import express from 'express'
import { protect, setCompanyContext, requirePermission, PERMISSIONS } from '../middleware/rbac.js'
import AutomationRule from '../models/AutomationRule.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all automation rules
 * @route   GET /api/automation/rules
 * @access  Private (Admin only)
 */
router.get('/rules', requirePermission(PERMISSIONS.AUTOMATION_VIEW), async (req, res) => {
  try {
    const { category, active } = req.query
    const companyId = req.activeCompany?._id || req.user.company._id

    const query = { company: companyId }

    if (category) {
      query.category = category
    }

    if (active !== undefined) {
      query.isActive = active === 'true'
    }

    const rules = await AutomationRule.find(query)
      .populate('createdBy', 'name email')
      .sort({ category: 1, createdAt: -1 })

    res.json({
      success: true,
      data: rules
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get single automation rule
 * @route   GET /api/automation/rules/:id
 * @access  Private (Admin only)
 */
router.get('/rules/:id', requirePermission(PERMISSIONS.AUTOMATION_VIEW), async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('actions.config.assignToUsers', 'name email')
      .populate('actions.config.notifyUsers', 'name email')
      .populate('actions.config.escalationUser', 'name email')

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found'
      })
    }

    res.json({
      success: true,
      data: rule
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Create automation rule
 * @route   POST /api/automation/rules
 * @access  Private (Admin only)
 */
router.post('/rules', requirePermission(PERMISSIONS.AUTOMATION_MANAGE), async (req, res) => {
  try {
    const companyId = req.activeCompany?._id || req.user.company._id

    const rule = await AutomationRule.create({
      ...req.body,
      company: companyId,
      createdBy: req.user._id
    })

    res.status(201).json({
      success: true,
      data: rule
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Update automation rule
 * @route   PUT /api/automation/rules/:id
 * @access  Private (Admin only)
 */
router.put('/rules/:id', requirePermission(PERMISSIONS.AUTOMATION_MANAGE), async (req, res) => {
  try {
    const rule = await AutomationRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found'
      })
    }

    res.json({
      success: true,
      data: rule
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Toggle automation rule active status
 * @route   PUT /api/automation/rules/:id/toggle
 * @access  Private (Admin only)
 */
router.put('/rules/:id/toggle', requirePermission(PERMISSIONS.AUTOMATION_MANAGE), async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id)

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found'
      })
    }

    rule.isActive = !rule.isActive
    await rule.save()

    res.json({
      success: true,
      data: rule,
      message: `Rule ${rule.isActive ? 'activated' : 'deactivated'}`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Delete automation rule
 * @route   DELETE /api/automation/rules/:id
 * @access  Private (Admin only)
 */
router.delete('/rules/:id', requirePermission(PERMISSIONS.AUTOMATION_MANAGE), async (req, res) => {
  try {
    const rule = await AutomationRule.findByIdAndDelete(req.params.id)

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found'
      })
    }

    res.json({
      success: true,
      message: 'Automation rule deleted'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Test automation rule (dry run)
 * @route   POST /api/automation/rules/:id/test
 * @access  Private (Admin only)
 */
router.post('/rules/:id/test', requirePermission(PERMISSIONS.AUTOMATION_MANAGE), async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id)

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found'
      })
    }

    // Simulate rule execution
    const testResult = {
      rule: rule.name,
      trigger: rule.trigger,
      actions: rule.actions.map(action => ({
        type: action.type,
        config: action.config,
        wouldExecute: true,
        simulatedResult: getSimulatedResult(action)
      })),
      wouldMatch: true,
      message: 'Dry run completed - no actual changes made'
    }

    res.json({
      success: true,
      data: testResult
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Get automation rule execution logs
 * @route   GET /api/automation/rules/:id/logs
 * @access  Private (Admin only)
 */
router.get('/rules/:id/logs', requirePermission(PERMISSIONS.AUTOMATION_VIEW), async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id)

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Automation rule not found'
      })
    }

    // Return stats as logs (in a real implementation, you'd have a separate logs collection)
    res.json({
      success: true,
      data: {
        ruleId: rule._id,
        stats: rule.stats,
        recentExecutions: [] // Would come from a logs collection
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
 * @desc    Get automation rule templates
 * @route   GET /api/automation/templates
 * @access  Private
 */
router.get('/templates', requirePermission(PERMISSIONS.AUTOMATION_VIEW), async (req, res) => {
  try {
    const templates = [
      {
        id: 'lead_assignment_round_robin',
        name: 'Lead Assignment - Round Robin',
        description: 'Automatically assign new leads to sales team in round-robin fashion',
        category: 'lead_assignment',
        trigger: {
          type: 'event',
          event: 'lead_created',
          conditions: []
        },
        actions: [
          {
            type: 'assign_lead',
            config: {
              assignmentStrategy: 'round_robin',
              assignToRole: 'sales_executive'
            }
          },
          {
            type: 'send_notification',
            config: {
              notifyAssignee: true,
              notificationTitle: 'New Lead Assigned',
              notificationMessage: 'A new lead has been assigned to you'
            }
          }
        ]
      },
      {
        id: 'follow_up_reminder',
        name: 'Follow-up Reminder',
        description: 'Send reminder when follow-up is due',
        category: 'follow_up',
        trigger: {
          type: 'event',
          event: 'follow_up_due',
          conditions: []
        },
        actions: [
          {
            type: 'send_notification',
            config: {
              notifyAssignee: true,
              notificationTitle: 'Follow-up Due',
              notificationMessage: 'You have a follow-up scheduled for today'
            }
          }
        ]
      },
      {
        id: 'stale_lead_escalation',
        name: 'Stale Lead Escalation',
        description: 'Escalate leads that have no activity for 7 days',
        category: 'escalation',
        trigger: {
          type: 'condition',
          conditions: [
            { field: 'status', operator: 'in', value: ['new', 'contacted'] },
            { field: 'updatedAt', operator: 'older_than_days', value: 7 }
          ]
        },
        actions: [
          {
            type: 'create_alert',
            config: {
              alertType: 'lead_aging',
              alertSeverity: 'warning',
              alertTitle: 'Stale Lead Alert',
              alertMessage: 'Lead has no activity for 7 days'
            }
          },
          {
            type: 'send_notification',
            config: {
              notifyManager: true,
              notificationTitle: 'Stale Lead',
              notificationMessage: 'A lead has been inactive for 7 days'
            }
          }
        ]
      },
      {
        id: 'sla_breach_alert',
        name: 'SLA Breach Alert',
        description: 'Alert when lead response time exceeds SLA',
        category: 'notification',
        trigger: {
          type: 'event',
          event: 'sla_breached',
          conditions: []
        },
        actions: [
          {
            type: 'create_alert',
            config: {
              alertType: 'sla_breach',
              alertSeverity: 'critical',
              alertTitle: 'SLA Breach',
              alertMessage: 'Response time SLA has been breached'
            }
          },
          {
            type: 'escalate',
            config: {
              escalateTo: 'manager',
              escalationLevel: 1
            }
          }
        ]
      }
    ]

    res.json({
      success: true,
      data: templates
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Create rule from template
 * @route   POST /api/automation/from-template/:templateId
 * @access  Private (Admin only)
 */
router.post('/from-template/:templateId', requirePermission(PERMISSIONS.AUTOMATION_MANAGE), async (req, res) => {
  try {
    const { templateId } = req.params
    const { name, customizations } = req.body
    const companyId = req.activeCompany?._id || req.user.company._id

    // Get templates (same as above)
    const templates = getTemplates()
    const template = templates.find(t => t.id === templateId)

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      })
    }

    // Create rule from template
    const rule = await AutomationRule.create({
      name: name || template.name,
      description: template.description,
      category: template.category,
      trigger: { ...template.trigger, ...customizations?.trigger },
      actions: template.actions.map((action, index) => ({
        ...action,
        ...customizations?.actions?.[index],
        order: index
      })),
      company: companyId,
      createdBy: req.user._id,
      isActive: false // Start inactive so user can review
    })

    res.status(201).json({
      success: true,
      data: rule,
      message: 'Rule created from template. Review and activate when ready.'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// Helper function to simulate action result
function getSimulatedResult(action) {
  switch (action.type) {
    case 'assign_lead':
      return { action: 'Would assign to next user in rotation' }
    case 'send_notification':
      return { action: 'Would send notification to specified users' }
    case 'send_email':
      return { action: 'Would send email using template' }
    case 'create_alert':
      return { action: 'Would create alert with specified settings' }
    case 'update_status':
      return { action: `Would update status to ${action.config.newStatus}` }
    case 'escalate':
      return { action: `Would escalate to ${action.config.escalateTo}` }
    default:
      return { action: 'Action would be executed' }
  }
}

// Helper function to get templates
function getTemplates() {
  return [
    {
      id: 'lead_assignment_round_robin',
      name: 'Lead Assignment - Round Robin',
      description: 'Automatically assign new leads to sales team in round-robin fashion',
      category: 'lead_assignment',
      trigger: { type: 'event', event: 'lead_created', conditions: [] },
      actions: [
        { type: 'assign_lead', config: { assignmentStrategy: 'round_robin', assignToRole: 'sales_executive' } },
        { type: 'send_notification', config: { notifyAssignee: true, notificationTitle: 'New Lead Assigned' } }
      ]
    }
  ]
}

export default router
