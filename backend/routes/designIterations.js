import express from 'express'
import DesignIteration from '../models/DesignIteration.js'
import Project from '../models/Project.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  canAccessProject,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'
import { notifyEvent } from '../utils/notificationService.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all design iterations (company-scoped)
 * @route   GET /api/design-iterations
 * @access  Private
 */
router.get('/',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const {
        project,
        designer,
        status,
        phase,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query

      const queryFilter = companyScopedQuery(req)

      if (project) queryFilter.project = project
      if (designer) queryFilter.designer = designer
      if (status) queryFilter.status = status
      if (phase) queryFilter.phase = phase

      const total = await DesignIteration.countDocuments(queryFilter)

      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

      const iterations = await DesignIteration.find(queryFilter)
        .populate('project', 'title projectId')
        .populate('customer', 'name customerId')
        .populate('designer', 'name email avatar')
        .populate('designLead', 'name email')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

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
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get iterations for a project
 * @route   GET /api/design-iterations/project/:projectId
 * @access  Private
 */
router.get('/project/:projectId',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.projectId)

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      if (!await canAccessProject(req, project)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      const iterations = await DesignIteration.getProjectIterations(req.params.projectId)

      const latestIteration = iterations.length > 0 ? iterations[0] : null

      res.json({
        success: true,
        data: {
          iterations,
          latestVersion: latestIteration?.version || 0,
          currentIteration: latestIteration,
          totalIterations: iterations.length
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
 * @desc    Get single design iteration
 * @route   GET /api/design-iterations/:id
 * @access  Private
 */
router.get('/:id',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const iteration = await DesignIteration.findById(req.params.id)
        .populate('project', 'title projectId status')
        .populate('customer', 'name customerId email')
        .populate('designer', 'name email avatar')
        .populate('designTeam.user', 'name email avatar')
        .populate('designLead', 'name email')
        .populate('feedback.feedbackBy', 'name avatar')
        .populate('activities.performedBy', 'name avatar')
        .populate('internalReview.reviewedBy', 'name')
        .populate('clientApproval.approvedBy', 'name')
        .populate('designHeadApproval.approvedBy', 'name')

      if (!iteration) {
        return res.status(404).json({
          success: false,
          message: 'Design iteration not found'
        })
      }

      // Check company access
      if (req.user.role !== 'super_admin' &&
          iteration.company.toString() !== req.activeCompany._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      res.json({
        success: true,
        data: iteration
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
 * @desc    Create design iteration for project
 * @route   POST /api/design-iterations
 * @access  Private
 */
router.post('/',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const {
        projectId,
        title,
        description,
        phase,
        designerId,
        designLeadId,
        scope,
        targetCompletionDate
      } = req.body

      const project = await Project.findById(projectId)
        .populate('customer')

      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        })
      }

      // Get current version
      const latestIteration = await DesignIteration.getLatestForProject(projectId)
      const newVersion = (latestIteration?.version || 0) + 1

      // Get designer
      const designer = designerId
        ? await User.findById(designerId)
        : req.user

      const iteration = await DesignIteration.create({
        company: req.activeCompany._id,
        project: projectId,
        customer: project.customer?._id,
        version: newVersion,
        title: title || `Design Iteration v${newVersion}`,
        description,
        phase: phase || 'concept',
        designer: designer._id,
        designerName: designer.name,
        designLead: designLeadId,
        designLeadName: designLeadId ? (await User.findById(designLeadId))?.name : null,
        scope,
        status: 'in_progress',
        timeline: {
          startedAt: new Date(),
          targetCompletionDate
        },
        activities: [{
          action: 'created',
          description: `Design iteration v${newVersion} created by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        }],
        createdBy: req.user._id,
        createdByName: req.user.name
      })

      // Update project
      project.designIterations.push(iteration._id)
      project.currentDesignVersion = newVersion
      project.activities.push({
        action: 'design_iteration_created',
        description: `Design iteration v${newVersion} started`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })
      await project.save()

      await iteration.populate('designer', 'name email avatar')

      res.status(201).json({
        success: true,
        data: iteration,
        message: 'Design iteration created successfully'
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
 * @desc    Update design iteration
 * @route   PUT /api/design-iterations/:id
 * @access  Private
 */
router.put('/:id',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const iteration = await DesignIteration.findById(req.params.id)

      if (!iteration) {
        return res.status(404).json({
          success: false,
          message: 'Design iteration not found'
        })
      }

      if (['approved', 'superseded'].includes(iteration.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit iteration in current status'
        })
      }

      const allowedFields = [
        'title', 'description', 'phase', 'scope', 'materials'
      ]

      const updates = {}
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field]
        }
      }

      iteration.activities.push({
        action: 'updated',
        description: `Iteration updated by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata: { fields: Object.keys(updates) }
      })

      Object.assign(iteration, updates)
      await iteration.save()

      res.json({
        success: true,
        data: iteration,
        message: 'Design iteration updated'
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
 * @desc    Add design file to iteration
 * @route   POST /api/design-iterations/:id/files
 * @access  Private
 */
router.post('/:id/files',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { type, name, description, url, thumbnail, format, fileSize, area } = req.body

      const iteration = await DesignIteration.findById(req.params.id)

      if (!iteration) {
        return res.status(404).json({
          success: false,
          message: 'Design iteration not found'
        })
      }

      if (['approved', 'superseded'].includes(iteration.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add files to approved/superseded iteration'
        })
      }

      await iteration.addFile({
        type,
        name,
        description,
        url,
        thumbnail,
        format,
        fileSize,
        area
      }, req.user._id, req.user.name)

      res.json({
        success: true,
        data: iteration,
        message: 'File added successfully'
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
 * @desc    Submit iteration for review
 * @route   PUT /api/design-iterations/:id/submit
 * @access  Private
 */
router.put('/:id/submit',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const iteration = await DesignIteration.findById(req.params.id)

      if (!iteration) {
        return res.status(404).json({
          success: false,
          message: 'Design iteration not found'
        })
      }

      if (iteration.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: 'Only in-progress iterations can be submitted'
        })
      }

      await iteration.submitForReview(req.user._id, req.user.name)

      // Notify design lead, designer, and customer
      const recipients = []
      if (iteration.designLead) recipients.push(iteration.designLead.toString())
      if (iteration.designer && iteration.designer.toString() !== req.user._id.toString()) {
        recipients.push(iteration.designer.toString())
      }
      notifyEvent({
        companyId: iteration.company,
        event: 'design_submitted',
        entityType: 'design_iteration',
        entityId: iteration._id,
        title: 'Design Iteration Submitted for Review',
        message: `Design iteration v${iteration.version} for "${iteration.title || 'Untitled'}" has been submitted for review by ${req.user.name}.`,
        recipientUserIds: recipients,
        recipientCustomerIds: iteration.customer ? [iteration.customer.toString()] : [],
        performedBy: req.user._id,
        metadata: { entityLabel: iteration.title, status: 'submitted' }
      })

      res.json({
        success: true,
        data: iteration,
        message: 'Iteration submitted for review'
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
 * @desc    Add internal review
 * @route   PUT /api/design-iterations/:id/internal-review
 * @access  Private
 */
router.put('/:id/internal-review',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { status, comments } = req.body

      if (!['approved', 'needs_revision'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be approved or needs_revision'
        })
      }

      const iteration = await DesignIteration.findById(req.params.id)

      if (!iteration) {
        return res.status(404).json({
          success: false,
          message: 'Design iteration not found'
        })
      }

      if (iteration.status !== 'submitted') {
        return res.status(400).json({
          success: false,
          message: 'Iteration must be submitted before review'
        })
      }

      await iteration.addInternalReview({
        status,
        comments
      }, req.user._id, req.user.name)

      // Notify designer, design lead, and customer on approval
      const reviewRecipients = []
      if (iteration.designer) reviewRecipients.push(iteration.designer.toString())
      if (iteration.designLead) reviewRecipients.push(iteration.designLead.toString())
      const statusLabel = status === 'approved' ? 'Approved' : 'Needs Revision'
      notifyEvent({
        companyId: iteration.company,
        event: status === 'approved' ? 'design_approved' : 'design_revision_requested',
        entityType: 'design_iteration',
        entityId: iteration._id,
        title: `Design Review: ${statusLabel}`,
        message: `Design iteration v${iteration.version} for "${iteration.title || 'Untitled'}" has been ${statusLabel.toLowerCase()} by ${req.user.name}.${comments ? ` Comments: ${comments}` : ''}`,
        recipientUserIds: reviewRecipients,
        recipientCustomerIds: status === 'approved' && iteration.customer ? [iteration.customer.toString()] : [],
        performedBy: req.user._id,
        metadata: { entityLabel: iteration.title, status: statusLabel }
      })

      res.json({
        success: true,
        data: iteration,
        message: `Internal review: ${status}`
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
 * @desc    Add client feedback
 * @route   POST /api/design-iterations/:id/feedback
 * @access  Private
 */
router.post('/:id/feedback',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const { type, comments, rating, annotations, attachments, isClient } = req.body

      const iteration = await DesignIteration.findById(req.params.id)

      if (!iteration) {
        return res.status(404).json({
          success: false,
          message: 'Design iteration not found'
        })
      }

      await iteration.addClientFeedback({
        type: type || 'comment',
        comments,
        rating,
        annotations,
        attachments
      }, req.user._id, req.user.name, isClient || false)

      res.json({
        success: true,
        data: iteration,
        message: 'Feedback added successfully'
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
 * @desc    Client approval
 * @route   PUT /api/design-iterations/:id/client-approve
 * @access  Private
 */
router.put('/:id/client-approve',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { method, signatureUrl, remarks } = req.body

      const iteration = await DesignIteration.findById(req.params.id)

      if (!iteration) {
        return res.status(404).json({
          success: false,
          message: 'Design iteration not found'
        })
      }

      if (!['under_review', 'submitted'].includes(iteration.status)) {
        return res.status(400).json({
          success: false,
          message: 'Iteration must be under review for client approval'
        })
      }

      await iteration.approveByClient({
        method: method || 'meeting',
        signatureUrl,
        remarks
      }, req.user._id, req.user.name)

      // Update project
      const project = await Project.findById(iteration.project)
      if (project) {
        project.activities.push({
          action: 'design_client_approved',
          description: `Design iteration v${iteration.version} approved by client`,
          performedBy: req.user._id,
          performedByName: req.user.name
        })
        await project.save()
      }

      res.json({
        success: true,
        data: iteration,
        message: 'Client approval recorded'
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
 * @desc    Design head approval
 * @route   PUT /api/design-iterations/:id/design-head-approve
 * @access  Private
 */
router.put('/:id/design-head-approve',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { remarks } = req.body

      const iteration = await DesignIteration.findById(req.params.id)

      if (!iteration) {
        return res.status(404).json({
          success: false,
          message: 'Design iteration not found'
        })
      }

      // Verify user is design head
      const isDesignHead = req.user.approvalAuthority?.approverRole === 'design_head'
      if (!isDesignHead && !['super_admin', 'company_admin'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Only Design Head can approve'
        })
      }

      await iteration.approveByDesignHead(remarks, req.user._id, req.user.name)

      // Update project
      const project = await Project.findById(iteration.project)
      if (project) {
        project.activities.push({
          action: 'design_head_approved',
          description: `Design iteration v${iteration.version} approved by Design Head`,
          performedBy: req.user._id,
          performedByName: req.user.name
        })
        await project.save()
      }

      res.json({
        success: true,
        data: iteration,
        message: 'Design Head approval recorded'
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
 * @desc    Request revisions (create new version)
 * @route   POST /api/design-iterations/:id/request-revision
 * @access  Private
 */
router.post('/:id/request-revision',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { revisionNotes } = req.body

      const iteration = await DesignIteration.findById(req.params.id)

      if (!iteration) {
        return res.status(404).json({
          success: false,
          message: 'Design iteration not found'
        })
      }

      if (['approved', 'superseded'].includes(iteration.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot request revision for this iteration'
        })
      }

      const newIteration = await iteration.createNewVersion(
        req.user._id,
        req.user.name,
        revisionNotes
      )

      await newIteration.populate('designer', 'name email avatar')

      res.json({
        success: true,
        data: {
          oldIteration: iteration,
          newIteration
        },
        message: `New iteration v${newIteration.version} created`
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
 * @desc    Update material status
 * @route   PUT /api/design-iterations/:id/materials/:materialId
 * @access  Private
 */
router.put('/:id/materials/:materialId',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { status } = req.body

      const iteration = await DesignIteration.findById(req.params.id)

      if (!iteration) {
        return res.status(404).json({
          success: false,
          message: 'Design iteration not found'
        })
      }

      const material = iteration.materials.id(req.params.materialId)
      if (!material) {
        return res.status(404).json({
          success: false,
          message: 'Material not found'
        })
      }

      material.status = status

      iteration.activities.push({
        action: 'material_status_updated',
        description: `Material "${material.item}" status changed to ${status}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })

      await iteration.save()

      res.json({
        success: true,
        data: iteration,
        message: 'Material status updated'
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
 * @desc    Get my design iterations (as designer)
 * @route   GET /api/design-iterations/my/assigned
 * @access  Private
 */
router.get('/my/assigned',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const { status } = req.query

      const queryFilter = {
        company: req.activeCompany._id,
        $or: [
          { designer: req.user._id },
          { 'designTeam.user': req.user._id }
        ]
      }

      if (status) queryFilter.status = status

      const iterations = await DesignIteration.find(queryFilter)
        .populate('project', 'title projectId')
        .populate('customer', 'name')
        .sort({ updatedAt: -1 })

      res.json({
        success: true,
        data: iterations,
        count: iterations.length
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
 * @desc    Auto-generate BOM from approved design iteration materials
 * @route   POST /api/design-iterations/:id/generate-bom
 * @access  Private
 */
router.post('/:id/generate-bom',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const iteration = await DesignIteration.findById(req.params.id)
        .populate('project', 'title projectId')

      if (!iteration) {
        return res.status(404).json({ success: false, message: 'Design iteration not found' })
      }

      if (iteration.status !== 'approved') {
        return res.status(400).json({ success: false, message: 'Only approved design iterations can generate BOMs' })
      }

      // Check if there are materials in the design
      const approvedMaterials = iteration.materials.filter(m => m.status === 'client_approved' || m.status === 'proposed')
      if (approvedMaterials.length === 0) {
        return res.status(400).json({ success: false, message: 'No materials found in design iteration to generate BOM' })
      }

      const BillOfMaterials = (await import('../models/BillOfMaterials.js')).default
      const Material = (await import('../models/Material.js')).default

      // Map design material categories to BOM item types
      const categoryToItemType = {
        flooring: 'raw_material',
        wall_finish: 'finish',
        ceiling: 'raw_material',
        furniture: 'component',
        lighting: 'hardware',
        hardware: 'hardware',
        fabric: 'raw_material',
        paint: 'consumable',
        other: 'raw_material'
      }

      // Build BOM items from design materials
      const bomItems = []
      for (let i = 0; i < approvedMaterials.length; i++) {
        const mat = approvedMaterials[i]

        // Try to find matching material in inventory by name/brand
        let materialRef = null
        if (mat.item) {
          materialRef = await Material.findOne({
            company: iteration.company,
            $or: [
              { materialName: { $regex: mat.item, $options: 'i' } },
              { skuCode: { $regex: mat.item, $options: 'i' } }
            ]
          })
        }

        bomItems.push({
          itemNumber: i + 1,
          material: materialRef?._id || undefined,
          materialDetails: {
            name: mat.item || 'Unknown',
            description: `${mat.brand || ''} ${mat.model || ''} ${mat.finish || ''} ${mat.color || ''}`.trim(),
            category: mat.category || 'other',
            unit: 'pcs'
          },
          quantity: 1,
          unit: 'pcs',
          unitCost: mat.estimatedCost || 0,
          totalCost: mat.estimatedCost || 0,
          itemType: categoryToItemType[mat.category] || 'raw_material',
          specifications: `Area: ${mat.area || 'N/A'}`,
          notes: `Auto-generated from design iteration v${iteration.version}`
        })
      }

      // Filter out items without material reference (they need material ref which is required)
      // For items without a material match, we'll create them without the required material field
      // We need to handle this - let's make items without material ref skip the material field
      const validItems = bomItems.filter(item => item.material)
      const skippedItems = bomItems.filter(item => !item.material)

      // Create the BOM
      const bom = new BillOfMaterials({
        company: iteration.company,
        project: iteration.project,
        projectName: iteration.project?.title || '',
        designIteration: iteration._id,
        name: `BOM from Design v${iteration.version} - ${iteration.title || 'Untitled'}`,
        description: `Auto-generated from approved design iteration v${iteration.version}`,
        product: {
          name: iteration.title || `Design v${iteration.version}`,
          category: 'other'
        },
        bomType: 'custom',
        items: validItems,
        status: 'draft',
        notes: skippedItems.length > 0
          ? `${skippedItems.length} materials skipped (no matching inventory item found): ${skippedItems.map(i => i.materialDetails.name).join(', ')}`
          : 'All design materials mapped to inventory',
        createdBy: req.user._id
      })

      await bom.save()

      // Log activity on the design iteration
      iteration.activities.push({
        action: 'bom_generated',
        description: `BOM auto-generated: ${bom.bomId} with ${validItems.length} items`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        metadata: { bomId: bom._id, itemCount: validItems.length, skippedCount: skippedItems.length }
      })
      await iteration.save()

      res.status(201).json({
        success: true,
        data: bom,
        message: `BOM generated with ${validItems.length} items${skippedItems.length > 0 ? `, ${skippedItems.length} skipped (no inventory match)` : ''}`,
        skippedMaterials: skippedItems.map(i => i.materialDetails.name)
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

export default router
