import express from 'express'
import ProjectPhase from '../models/ProjectPhase.js'
import ProjectActivity from '../models/ProjectActivity.js'
import ProjectTask from '../models/ProjectTask.js'
import ProjectTaskInstance from '../models/ProjectTaskInstance.js'
import PaymentMilestone from '../models/PaymentMilestone.js'
import Payment from '../models/Payment.js'
import Project from '../models/Project.js'
import PDFDocument from 'pdfkit'
import { seedProjectTemplates, deleteProjectTemplates } from '../seeders/projectTemplateSeeder.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All routes protected
router.use(protect)
router.use(setCompanyContext)

// ============================================
// PROJECT PHASES (Templates)
// ============================================

/**
 * @desc    Get all project phases (templates)
 * @route   GET /api/project-workflow/phases
 * @access  Private
 */
router.get('/phases',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const { entityType = 'interior_plus' } = req.query

      const phases = await ProjectPhase.find({
        company: req.activeCompany._id,
        entityType,
        isTemplate: true,
        isActive: true
      }).sort({ order: 1 })

      res.json({
        success: true,
        data: phases
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
 * @desc    Get phase with activities and tasks
 * @route   GET /api/project-workflow/phases/:id/full
 * @access  Private
 */
router.get('/phases/:id/full',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const phase = await ProjectPhase.findById(req.params.id)

      if (!phase) {
        return res.status(404).json({
          success: false,
          message: 'Phase not found'
        })
      }

      const activities = await ProjectActivity.find({
        phase: phase._id,
        isTemplate: true,
        isActive: true
      }).sort({ order: 1 })

      // Get tasks for each activity
      const activitiesWithTasks = await Promise.all(
        activities.map(async (activity) => {
          const tasks = await ProjectTask.find({
            activity: activity._id,
            isTemplate: true,
            isActive: true
          }).sort({ order: 1 })

          return {
            ...activity.toObject(),
            tasks
          }
        })
      )

      res.json({
        success: true,
        data: {
          ...phase.toObject(),
          activities: activitiesWithTasks
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

// ============================================
// PROJECT ACTIVITIES (Templates)
// ============================================

/**
 * @desc    Get activities for a phase
 * @route   GET /api/project-workflow/phases/:phaseId/activities
 * @access  Private
 */
router.get('/phases/:phaseId/activities',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const activities = await ProjectActivity.find({
        phase: req.params.phaseId,
        isTemplate: true,
        isActive: true
      }).sort({ order: 1 })

      res.json({
        success: true,
        data: activities
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ============================================
// PROJECT TASKS (Templates)
// ============================================

/**
 * @desc    Get tasks for an activity
 * @route   GET /api/project-workflow/activities/:activityId/tasks
 * @access  Private
 */
router.get('/activities/:activityId/tasks',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const tasks = await ProjectTask.find({
        activity: req.params.activityId,
        isTemplate: true,
        isActive: true
      }).sort({ order: 1 })

      res.json({
        success: true,
        data: tasks
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ============================================
// FULL TEMPLATE HIERARCHY
// ============================================

/**
 * @desc    Get complete project template hierarchy
 * @route   GET /api/project-workflow/template
 * @access  Private
 */
router.get('/template',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const { entityType = 'interior_plus' } = req.query

      const phases = await ProjectPhase.find({
        company: req.activeCompany._id,
        entityType,
        isTemplate: true,
        isActive: true
      }).sort({ order: 1 })

      const fullTemplate = await Promise.all(
        phases.map(async (phase) => {
          const activities = await ProjectActivity.find({
            phase: phase._id,
            isTemplate: true,
            isActive: true
          }).sort({ order: 1 })

          const activitiesWithTasks = await Promise.all(
            activities.map(async (activity) => {
              const tasks = await ProjectTask.find({
                activity: activity._id,
                isTemplate: true,
                isActive: true
              }).sort({ order: 1 })

              return {
                ...activity.toObject(),
                tasks
              }
            })
          )

          return {
            ...phase.toObject(),
            activities: activitiesWithTasks
          }
        })
      )

      res.json({
        success: true,
        data: fullTemplate
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
 * @desc    Seed project templates
 * @route   POST /api/project-workflow/seed
 * @access  Private (Admin)
 */
router.post('/seed',
  requirePermission(PERMISSIONS.SETTINGS_EDIT),
  async (req, res) => {
    try {
      const result = await seedProjectTemplates(req.activeCompany._id, req.user._id)

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

// ============================================
// PROJECT TASK INSTANCES (Actual Project Tasks)
// ============================================

/**
 * @desc    Initialize tasks for a project from template
 * @route   POST /api/project-workflow/projects/:projectId/initialize
 * @access  Private
 */
router.post('/projects/:projectId/initialize',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { entityType = 'interior_plus' } = req.body

      const project = await Project.findById(req.params.projectId)
        .populate('customer')

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      // Check if tasks already exist
      const existingTasks = await ProjectTaskInstance.countDocuments({
        project: project._id
      })

      if (existingTasks > 0) {
        return res.status(400).json({
          success: false,
          message: 'Project tasks already initialized'
        })
      }

      // Get all template phases, activities, tasks
      const phases = await ProjectPhase.find({
        company: req.activeCompany._id,
        entityType,
        isTemplate: true,
        isActive: true
      }).sort({ order: 1 })

      let taskOrder = 0
      const createdTasks = []

      for (const phase of phases) {
        const activities = await ProjectActivity.find({
          phase: phase._id,
          isTemplate: true,
          isActive: true
        }).sort({ order: 1 })

        for (const activity of activities) {
          const tasks = await ProjectTask.find({
            activity: activity._id,
            isTemplate: true,
            isActive: true
          }).sort({ order: 1 })

          for (const task of tasks) {
            const taskInstance = await ProjectTaskInstance.create({
              company: req.activeCompany._id,
              project: project._id,
              customer: project.customer._id,
              phaseTemplate: phase._id,
              activityTemplate: activity._id,
              taskTemplate: task._id,
              entityType,
              phaseName: phase.name,
              phaseCode: phase.code,
              activityName: activity.name,
              activityCode: activity.code,
              taskName: task.name,
              taskCode: task.code,
              projectOwner: project.projectManager,
              projectOwnerName: project.projectManager?.name,
              weightage: task.defaultWeightage * (activity.defaultWeightage / 100) * (phase.defaultWeightage / 100),
              estimatedDuration: task.estimatedDuration,
              isQCRequired: task.isQCCheckpoint,
              order: taskOrder++,
              status: 'not_started',
              completionPercentage: 0
            })
            createdTasks.push(taskInstance)
          }
        }
      }

      // Update project completion fields
      project.completion = project.completion || {}
      project.completion.completionPercentage = 0
      await project.save()

      res.json({
        success: true,
        message: `Created ${createdTasks.length} task instances`,
        data: {
          tasksCreated: createdTasks.length,
          project: project._id
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
 * @desc    Get all task instances for a project
 * @route   GET /api/project-workflow/projects/:projectId/tasks
 * @access  Private
 */
router.get('/projects/:projectId/tasks',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const { status, phaseId, activityId } = req.query

      const query = { project: req.params.projectId }

      if (status) query.status = status
      if (phaseId) query.phaseTemplate = phaseId
      if (activityId) query.activityTemplate = activityId

      const tasks = await ProjectTaskInstance.find(query)
        .populate('taskOwner.employee', 'name email')
        .populate('taskOwner.vendor', 'name')
        .populate('assignedVendor', 'name')
        .sort({ order: 1 })

      // Group by phase and activity
      const grouped = {}
      tasks.forEach(task => {
        const phaseKey = task.phaseCode
        const activityKey = task.activityCode

        if (!grouped[phaseKey]) {
          grouped[phaseKey] = {
            phaseName: task.phaseName,
            phaseCode: task.phaseCode,
            activities: {}
          }
        }

        if (!grouped[phaseKey].activities[activityKey]) {
          grouped[phaseKey].activities[activityKey] = {
            activityName: task.activityName,
            activityCode: task.activityCode,
            tasks: []
          }
        }

        grouped[phaseKey].activities[activityKey].tasks.push(task)
      })

      res.json({
        success: true,
        data: {
          tasks,
          grouped,
          summary: {
            total: tasks.length,
            notStarted: tasks.filter(t => t.status === 'not_started').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            blocked: tasks.filter(t => t.status === 'blocked').length
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
 * @desc    Get project completion summary
 * @route   GET /api/project-workflow/projects/:projectId/completion
 * @access  Private
 */
router.get('/projects/:projectId/completion',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const projectId = req.params.projectId

      // Overall completion
      const overallCompletion = await ProjectTaskInstance.calculateProjectCompletion(projectId)

      // Phase-wise completion
      const phaseCompletion = await ProjectTaskInstance.getPhaseCompletion(projectId)

      res.json({
        success: true,
        data: {
          overallCompletion,
          phaseCompletion
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
 * @desc    Update task instance progress
 * @route   PUT /api/project-workflow/task-instances/:id/progress
 * @access  Private
 */
router.put('/task-instances/:id/progress',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { percentage, notes, attachments } = req.body

      const task = await ProjectTaskInstance.findById(req.params.id)

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        })
      }

      await task.updateProgress(
        percentage,
        notes,
        req.user._id,
        req.user.name,
        attachments
      )

      // Update project overall completion
      const projectCompletion = await ProjectTaskInstance.calculateProjectCompletion(task.project)
      await Project.findByIdAndUpdate(task.project, {
        'completion.completionPercentage': projectCompletion
      })

      res.json({
        success: true,
        data: task,
        projectCompletion
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
 * @desc    Assign task owner (supports multiple owners)
 * @route   PUT /api/project-workflow/task-instances/:id/assign
 * @access  Private
 */
router.put('/task-instances/:id/assign',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { ownerType, ownerId, ownerName } = req.body

      const task = await ProjectTaskInstance.findById(req.params.id)

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        })
      }

      // Use addOwner to support multiple assignees
      await task.addOwner(
        ownerType,
        ownerId,
        ownerName,
        req.user._id,
        req.user.name
      )

      res.json({
        success: true,
        data: task
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
 * @desc    Remove task owner
 * @route   DELETE /api/project-workflow/task-instances/:id/owners/:ownerType/:ownerId
 * @access  Private
 */
router.delete('/task-instances/:id/owners/:ownerType/:ownerId',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { ownerType, ownerId } = req.params

      const task = await ProjectTaskInstance.findById(req.params.id)

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        })
      }

      await task.removeOwner(
        ownerType,
        ownerId,
        req.user._id,
        req.user.name
      )

      res.json({
        success: true,
        data: task
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ============================================
// PAYMENT MILESTONES
// ============================================

/**
 * @desc    Get payment milestones for a project
 * @route   GET /api/project-workflow/projects/:projectId/payment-milestones
 * @access  Private
 */
router.get('/projects/:projectId/payment-milestones',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const summary = await PaymentMilestone.getProjectPaymentSummary(req.params.projectId)

      res.json({
        success: true,
        data: summary
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
 * @desc    Create default payment milestones for a project
 * @route   POST /api/project-workflow/projects/:projectId/payment-milestones/default
 * @access  Private
 */
router.post('/projects/:projectId/payment-milestones/default',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      const totalAmount = project.financials?.finalAmount || project.financials?.agreedAmount || 0

      if (totalAmount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Project amount not set'
        })
      }

      // Use project's company instead of activeCompany (handles "All Companies" view)
      const companyId = project.company || req.activeCompany?._id

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Project has no company assigned'
        })
      }

      const milestones = await PaymentMilestone.createDefaultMilestones(
        project._id,
        project.customer,
        companyId,
        totalAmount,
        req.user._id
      )

      res.json({
        success: true,
        data: milestones,
        message: `Created ${milestones.length} payment milestones`
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
 * @desc    Add payment to milestone
 * @route   POST /api/project-workflow/payment-milestones/:id/payments
 * @access  Private
 */
router.post('/payment-milestones/:id/payments',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const milestone = await PaymentMilestone.findById(req.params.id)

      if (!milestone) {
        return res.status(404).json({
          success: false,
          message: 'Milestone not found'
        })
      }

      await milestone.addPayment(req.body, req.user._id, req.user.name)

      // Create receipt in finance module
      const receipt = await Payment.create({
        company: milestone.company,
        paymentType: 'incoming',
        paymentDate: new Date(),
        amount: req.body.amount,
        paymentMethod: req.body.method || 'bank_transfer',
        referenceNumber: req.body.reference || '',
        description: `Collection for milestone: ${milestone.name}`,
        purpose: 'invoice_payment',
        status: 'completed',
        approvalStatus: 'approved',
        project: milestone.project,
        customer: milestone.customer,
        createdBy: req.user._id,
        activities: [{
          action: 'collection_recorded',
          description: `Collection of ₹${req.body.amount} recorded for milestone ${milestone.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        }]
      })

      res.json({
        success: true,
        data: milestone,
        receiptNumber: receipt.paymentNumber
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
 * @desc    Download receipt PDF for a paid milestone
 * @route   GET /api/project-workflow/payment-milestones/:id/receipt
 * @access  Private
 */
router.get('/payment-milestones/:id/receipt',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const milestone = await PaymentMilestone.findById(req.params.id)
        .populate('project', 'title projectId')
        .populate('customer', 'name phone email')
        .populate('company', 'name entityCode')

      if (!milestone) {
        return res.status(404).json({ success: false, message: 'Milestone not found' })
      }

      // Get the latest confirmed payment from finance module
      const receipt = await Payment.findOne({
        project: milestone.project._id,
        customer: milestone.customer._id,
        paymentType: 'incoming',
        description: { $regex: milestone.name, $options: 'i' }
      }).sort({ createdAt: -1 })

      const receiptNo = receipt?.paymentNumber || milestone.milestoneId || 'N/A'
      const companyName = milestone.company?.name || 'Interior Plus'

      // Build PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4' })
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=Receipt-${receiptNo}.pdf`)
      doc.pipe(res)

      // Header
      doc.fontSize(22).font('Helvetica-Bold').text(companyName, { align: 'center' })
      doc.moveDown(0.3)
      doc.fontSize(14).font('Helvetica').fillColor('#C59C82').text('COLLECTION RECEIPT', { align: 'center' })
      doc.fillColor('#000000')
      doc.moveDown(0.5)
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#C59C82').lineWidth(2).stroke()
      doc.moveDown(1)

      // Receipt details
      const leftX = 50
      const rightX = 300
      const labelFont = 'Helvetica-Bold'
      const valueFont = 'Helvetica'

      doc.fontSize(11).font(labelFont).text('Receipt No:', leftX, doc.y)
      doc.font(valueFont).text(receiptNo, rightX, doc.y - 13)
      doc.moveDown(0.6)

      doc.font(labelFont).text('Date:', leftX, doc.y)
      const payDate = receipt?.paymentDate || milestone.updatedAt || new Date()
      doc.font(valueFont).text(new Date(payDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), rightX, doc.y - 13)
      doc.moveDown(1)

      // Customer & Project
      doc.fontSize(13).font(labelFont).text('Customer Details', leftX)
      doc.moveDown(0.3)
      doc.fontSize(11).font(labelFont).text('Name:', leftX)
      doc.font(valueFont).text(milestone.customer?.name || '-', rightX, doc.y - 13)
      doc.moveDown(0.5)
      doc.font(labelFont).text('Phone:', leftX)
      doc.font(valueFont).text(milestone.customer?.phone || '-', rightX, doc.y - 13)
      doc.moveDown(0.5)
      doc.font(labelFont).text('Project:', leftX)
      doc.font(valueFont).text(milestone.project?.title || '-', rightX, doc.y - 13)
      doc.moveDown(0.5)
      doc.font(labelFont).text('Project ID:', leftX)
      doc.font(valueFont).text(milestone.project?.projectId || '-', rightX, doc.y - 13)
      doc.moveDown(1)

      // Separator
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke()
      doc.moveDown(1)

      // Payment details table
      doc.fontSize(13).font(labelFont).text('Payment Details', leftX)
      doc.moveDown(0.5)

      const formatINR = (amt) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0)

      doc.fontSize(11).font(labelFont).text('Milestone:', leftX)
      doc.font(valueFont).text(milestone.name, rightX, doc.y - 13)
      doc.moveDown(0.5)

      doc.font(labelFont).text('Milestone Amount:', leftX)
      doc.font(valueFont).text(formatINR(milestone.totalAmount), rightX, doc.y - 13)
      doc.moveDown(0.5)

      doc.font(labelFont).text('Base Amount:', leftX)
      doc.font(valueFont).text(formatINR(milestone.amount), rightX, doc.y - 13)
      doc.moveDown(0.5)

      doc.font(labelFont).text('GST:', leftX)
      doc.font(valueFont).text(formatINR(milestone.gstAmount), rightX, doc.y - 13)
      doc.moveDown(0.5)

      doc.font(labelFont).text('Amount Collected:', leftX)
      doc.font(valueFont).text(formatINR(milestone.collectedAmount), rightX, doc.y - 13)
      doc.moveDown(0.5)

      if (receipt?.paymentMethod) {
        doc.font(labelFont).text('Payment Method:', leftX)
        doc.font(valueFont).text(receipt.paymentMethod.replace(/_/g, ' ').toUpperCase(), rightX, doc.y - 13)
        doc.moveDown(0.5)
      }

      if (receipt?.referenceNumber) {
        doc.font(labelFont).text('Reference No:', leftX)
        doc.font(valueFont).text(receipt.referenceNumber, rightX, doc.y - 13)
        doc.moveDown(0.5)
      }

      doc.moveDown(1)

      // Total box
      doc.rect(50, doc.y, 495, 50).fillAndStroke('#f0fdf4', '#22c55e')
      doc.fillColor('#166534').fontSize(16).font(labelFont)
        .text(`Total Collected: ${formatINR(milestone.collectedAmount)}`, 60, doc.y - 38, { width: 475, align: 'center' })
      doc.fillColor('#000000')
      doc.moveDown(3)

      // Footer
      doc.fontSize(9).font(valueFont).fillColor('#94a3b8')
        .text('This is a computer-generated receipt and does not require a signature.', 50, doc.y, { align: 'center' })
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, { align: 'center' })

      doc.end()
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// ============================================
// BUDGET TRACKING
// ============================================

/**
 * @desc    Get budget vs actual tracking data for a project
 * @route   GET /api/project-workflow/projects/:projectId/budget
 * @access  Private
 */
router.get('/projects/:projectId/budget',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const projectId = req.params.projectId

      // Get project financials
      const project = await Project.findById(projectId).select('financials title projectId')
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      // Get all task instances with cost data
      const tasks = await ProjectTaskInstance.find({ project: projectId })

      // Calculate phase-wise budget
      const phaseData = {}
      let totalEstimatedMaterials = 0
      let totalEstimatedLabor = 0
      let totalActualMaterials = 0
      let totalActualLabor = 0

      tasks.forEach(task => {
        const phaseKey = task.phaseCode
        if (!phaseData[phaseKey]) {
          phaseData[phaseKey] = {
            phaseName: task.phaseName,
            phaseCode: task.phaseCode,
            estimatedMaterials: 0,
            estimatedLabor: 0,
            estimatedTotal: 0,
            actualMaterials: 0,
            actualLabor: 0,
            actualTotal: 0
          }
        }

        const estMat = task.estimatedCost?.materials || 0
        const estLab = task.estimatedCost?.labor || 0
        const actMat = task.actualCost?.materials || 0
        const actLab = task.actualCost?.labor || 0

        phaseData[phaseKey].estimatedMaterials += estMat
        phaseData[phaseKey].estimatedLabor += estLab
        phaseData[phaseKey].estimatedTotal += estMat + estLab
        phaseData[phaseKey].actualMaterials += actMat
        phaseData[phaseKey].actualLabor += actLab
        phaseData[phaseKey].actualTotal += actMat + actLab

        totalEstimatedMaterials += estMat
        totalEstimatedLabor += estLab
        totalActualMaterials += actMat
        totalActualLabor += actLab
      })

      const phases = Object.values(phaseData)

      // Calculate variance
      const totalEstimated = totalEstimatedMaterials + totalEstimatedLabor
      const totalActual = totalActualMaterials + totalActualLabor
      const variance = totalEstimated - totalActual
      const variancePercentage = totalEstimated > 0 ? ((variance / totalEstimated) * 100).toFixed(1) : 0

      res.json({
        success: true,
        data: {
          project: {
            title: project.title,
            projectId: project.projectId,
            quotedAmount: project.financials?.quotedAmount || 0,
            agreedAmount: project.financials?.agreedAmount || 0,
            finalAmount: project.financials?.finalAmount || 0,
            totalPaid: project.financials?.totalPaid || 0,
            pendingAmount: project.financials?.pendingAmount || 0
          },
          budget: {
            estimated: {
              materials: totalEstimatedMaterials,
              labor: totalEstimatedLabor,
              total: totalEstimated
            },
            actual: {
              materials: totalActualMaterials,
              labor: totalActualLabor,
              total: totalActual
            },
            variance: {
              amount: variance,
              percentage: parseFloat(variancePercentage),
              status: variance >= 0 ? 'under_budget' : 'over_budget'
            }
          },
          phases,
          chartData: phases.map(p => ({
            name: p.phaseName,
            estimated: p.estimatedTotal,
            actual: p.actualTotal
          }))
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
 * @desc    Get full progress dashboard data
 * @route   GET /api/project-workflow/projects/:projectId/dashboard
 * @access  Private
 */
router.get('/projects/:projectId/dashboard',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const projectId = req.params.projectId

      // Get project details
      const project = await Project.findById(projectId)
        .populate('customer', 'name')
        .populate('projectManager', 'name')

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      // Get all task instances
      const tasks = await ProjectTaskInstance.find({ project: projectId })

      // Task status distribution
      const taskStats = {
        total: tasks.length,
        notStarted: tasks.filter(t => t.status === 'not_started').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        blocked: tasks.filter(t => t.status === 'blocked').length
      }

      // Overall completion
      const overallCompletion = await ProjectTaskInstance.calculateProjectCompletion(projectId)

      // Phase-wise completion
      const phaseCompletion = await ProjectTaskInstance.getPhaseCompletion(projectId)

      // Budget summary
      let totalEstimated = 0
      let totalActual = 0
      const phasesCostData = []

      const phaseGroups = {}
      tasks.forEach(task => {
        if (!phaseGroups[task.phaseCode]) {
          phaseGroups[task.phaseCode] = {
            phaseName: task.phaseName,
            phaseCode: task.phaseCode,
            estimated: 0,
            actual: 0
          }
        }
        const est = (task.estimatedCost?.materials || 0) + (task.estimatedCost?.labor || 0)
        const act = (task.actualCost?.materials || 0) + (task.actualCost?.labor || 0)
        phaseGroups[task.phaseCode].estimated += est
        phaseGroups[task.phaseCode].actual += act
        totalEstimated += est
        totalActual += act
      })

      Object.values(phaseGroups).forEach(p => phasesCostData.push(p))

      res.json({
        success: true,
        data: {
          project: {
            _id: project._id,
            title: project.title,
            projectId: project.projectId,
            status: project.status,
            customer: project.customer?.name,
            projectManager: project.projectManager?.name,
            startDate: project.timeline?.estimatedStartDate,
            endDate: project.timeline?.estimatedEndDate
          },
          progress: {
            overallCompletion,
            completionPercentage: overallCompletion,
            phaseCompletion
          },
          tasks: {
            ...taskStats,
            completionPercentage: overallCompletion
          },
          budget: {
            agreed: project.financials?.agreedAmount || 0,
            estimated: totalEstimated,
            actual: totalActual,
            variance: totalEstimated - totalActual,
            paid: project.financials?.totalPaid || 0,
            pending: project.financials?.pendingAmount || 0,
            phases: phasesCostData
          },
          // Chart-ready data
          charts: {
            taskStatus: [
              { name: 'Not Started', value: taskStats.notStarted, color: '#9CA3AF' },
              { name: 'In Progress', value: taskStats.inProgress, color: '#3B82F6' },
              { name: 'Completed', value: taskStats.completed, color: '#22C55E' },
              { name: 'Blocked', value: taskStats.blocked, color: '#EF4444' }
            ],
            phaseProgress: phaseCompletion.map(p => ({
              name: p.phaseName,
              completion: Math.round(p.avgCompletion),
              tasks: p.totalTasks,
              completed: p.completedTasks
            })),
            budgetByPhase: phasesCostData.map(p => ({
              name: p.phaseName,
              estimated: p.estimated,
              actual: p.actual
            }))
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

// ============================================
// GANTT CHART DATA
// ============================================

/**
 * @desc    Get Gantt chart data for a project
 * @route   GET /api/project-workflow/projects/:projectId/gantt
 * @access  Private
 */
router.get('/projects/:projectId/gantt',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const tasks = await ProjectTaskInstance.find({
        project: req.params.projectId
      }).sort({ order: 1 })

      // Format for Gantt chart
      const ganttData = tasks.map(task => ({
        id: task._id,
        name: task.taskName,
        phase: task.phaseName,
        activity: task.activityName,
        start: task.plannedStartDate || task.actualStartDate,
        end: task.plannedEndDate || task.actualEndDate,
        progress: task.completionPercentage,
        status: task.status,
        dependencies: task.dependsOn?.map(d => d.task),
        owner: task.taskOwner?.employeeName || task.taskOwner?.vendorName,
        ownerType: task.taskOwner?.ownerType
      }))

      res.json({
        success: true,
        data: ganttData
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
