import express from 'express'
import DesignP2PTracker from '../models/DesignP2PTracker.js'
import Project from '../models/Project.js'
import Customer from '../models/Customer.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All routes require authentication
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all P2P trackers (company-scoped)
 * @route   GET /api/design-p2p-tracker
 * @access  Private
 */
router.get('/',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const {
        status,
        designer,
        stage,
        showroom,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query

      const queryFilter = companyScopedQuery(req)

      if (status) queryFilter.status = status
      if (designer) queryFilter.designer = designer
      if (stage) queryFilter.currentStage = parseInt(stage)
      if (showroom) queryFilter.showroom = showroom

      if (search) {
        queryFilter.$or = [
          { trackerId: { $regex: search, $options: 'i' } },
          { property: { $regex: search, $options: 'i' } },
          { designerName: { $regex: search, $options: 'i' } },
          { salesPersonName: { $regex: search, $options: 'i' } },
          { showroom: { $regex: search, $options: 'i' } }
        ]
      }

      const total = await DesignP2PTracker.countDocuments(queryFilter)

      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

      const trackers = await DesignP2PTracker.find(queryFilter)
        .populate('project', 'title projectId')
        .populate('customer', 'name customerId')
        .populate('designer', 'name email')
        .populate('salesPerson', 'name email')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      res.json({
        success: true,
        data: trackers,
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
 * @desc    Get dashboard summary stats
 * @route   GET /api/design-p2p-tracker/dashboard/summary
 * @access  Private
 */
router.get('/dashboard/summary',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const summary = await DesignP2PTracker.getDashboardSummary(req.activeCompany._id)

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
 * @desc    Export trackers to JSON (for Excel conversion on client)
 * @route   GET /api/design-p2p-tracker/export
 * @access  Private
 */
router.get('/export',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const { status, designer, stage, showroom } = req.query
      const queryFilter = companyScopedQuery(req)

      if (status) queryFilter.status = status
      if (designer) queryFilter.designer = designer
      if (stage) queryFilter.currentStage = parseInt(stage)
      if (showroom) queryFilter.showroom = showroom

      const trackers = await DesignP2PTracker.find(queryFilter)
        .populate('project', 'title projectId')
        .populate('customer', 'name customerId')
        .populate('designer', 'name email')
        .populate('salesPerson', 'name email')
        .sort({ createdAt: -1 })
        .lean()

      res.json({
        success: true,
        data: trackers
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
 * @desc    Get tracker for a specific project
 * @route   GET /api/design-p2p-tracker/project/:projectId
 * @access  Private
 */
router.get('/project/:projectId',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const tracker = await DesignP2PTracker.findOne({
        project: req.params.projectId,
        company: req.activeCompany._id
      })
        .populate('project', 'title projectId status')
        .populate('customer', 'name customerId email phone')
        .populate('designer', 'name email avatar')
        .populate('salesPerson', 'name email')
        .populate('dailyLogs.designer', 'name')
        .populate('comments.commentBy', 'name avatar')

      if (!tracker) {
        return res.status(404).json({
          success: false,
          message: 'P2P tracker not found for this project'
        })
      }

      res.json({
        success: true,
        data: tracker
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
 * @desc    Get single P2P tracker
 * @route   GET /api/design-p2p-tracker/:id
 * @access  Private
 */
router.get('/:id',
  requirePermission(PERMISSIONS.PROJECTS_VIEW),
  async (req, res) => {
    try {
      const tracker = await DesignP2PTracker.findById(req.params.id)
        .populate('project', 'title projectId status')
        .populate('customer', 'name customerId email phone')
        .populate('designer', 'name email avatar')
        .populate('salesPerson', 'name email')
        .populate('dailyLogs.designer', 'name')
        .populate('comments.commentBy', 'name avatar')

      if (!tracker) {
        return res.status(404).json({
          success: false,
          message: 'P2P tracker not found'
        })
      }

      // Check company access
      if (req.user.role !== 'super_admin' &&
          tracker.company.toString() !== req.activeCompany._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      res.json({
        success: true,
        data: tracker
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
 * @desc    Create P2P tracker
 * @route   POST /api/design-p2p-tracker
 * @access  Private
 */
router.post('/',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const {
        projectId, property, bookingDate, showroom, expectedMovPossession,
        salesPersonId, designerId,
        obvInLacs, fqvInLacs, upsellValue
      } = req.body

      // Look up project and customer
      let project = null
      let customer = null
      if (projectId) {
        project = await Project.findById(projectId).populate('customer')
        if (!project) {
          return res.status(404).json({
            success: false,
            message: 'Project not found'
          })
        }
        customer = project.customer
      }

      // Check for existing tracker on this project
      if (projectId) {
        const existing = await DesignP2PTracker.findOne({
          project: projectId,
          company: req.activeCompany._id
        })
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'A P2P tracker already exists for this project'
          })
        }
      }

      const trackerData = {
        company: req.activeCompany._id,
        project: projectId || undefined,
        customer: customer?._id || req.body.customerId,
        property: property || project?.title,
        bookingDate,
        showroom,
        expectedMovPossession,
        salesPerson: salesPersonId,
        designer: designerId,
        obvInLacs: obvInLacs || 0,
        fqvInLacs: fqvInLacs || 0,
        upsellValue: upsellValue || 0,
        status: 'new',
        activities: [{
          action: 'created',
          description: `P2P tracker created by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name
        }],
        createdBy: req.user._id,
        createdByName: req.user.name
      }

      // Set name fields if user IDs provided
      if (salesPersonId) {
        const User = (await import('../models/User.js')).default
        const sp = await User.findById(salesPersonId)
        if (sp) trackerData.salesPersonName = sp.name
      }
      if (designerId) {
        const User = (await import('../models/User.js')).default
        const d = await User.findById(designerId)
        if (d) trackerData.designerName = d.name
      }

      const tracker = await DesignP2PTracker.create(trackerData)

      await tracker.populate('project', 'title projectId')
      await tracker.populate('customer', 'name customerId')
      await tracker.populate('designer', 'name email')

      res.status(201).json({
        success: true,
        data: tracker,
        message: 'P2P tracker created successfully'
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
 * @desc    Update P2P tracker (any fields)
 * @route   PUT /api/design-p2p-tracker/:id
 * @access  Private
 */
router.put('/:id',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const tracker = await DesignP2PTracker.findById(req.params.id)

      if (!tracker) {
        return res.status(404).json({
          success: false,
          message: 'P2P tracker not found'
        })
      }

      // Check company access
      if (req.user.role !== 'super_admin' &&
          tracker.company.toString() !== req.activeCompany._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      // Track changed fields
      const changedFields = []
      const updates = req.body

      // Apply all allowed fields
      const allowedTopLevel = [
        'property', 'bookingDate', 'showroom', 'expectedMovPossession',
        'salesPerson', 'salesPersonName', 'designer', 'designerName',
        'obvInLacs', 'fqvInLacs', 'upsellValue', 'orderBooked', 'p2pValue', 'descopeReasons',
        'tenPercentPayment', 'tenPercentAmount', 'quoteRequirementsReceived',
        'mmtBooked', 'skpShellReceived',
        'designDiscussion', 'designDiscussionNotes', 'colourSelection', 'designFinalized',
        'validationDwgStarted', 'validationDwgCompleted', 'siteValidation',
        'p2pDwgStarted', 'p2pDwgCompleted',
        'qcStarted', 'qcCompleted', 'qcInputs', 'qcDwgsReady', 'qcDate', 'sodApproval', 'sodDate',
        'sixtyPercentPayment', 'p2pDate', 'dispatchDate', 'handoverDate', 'gfcDate',
        'status', 'designDependency', 'wipStatus',
        'latestUpdates'
      ]

      for (const field of allowedTopLevel) {
        if (updates[field] !== undefined) {
          changedFields.push(field)
          tracker[field] = updates[field]
        }
      }

      // Handle nested objects
      if (updates.preClosure) {
        tracker.preClosure = { ...tracker.preClosure?.toObject?.() || {}, ...updates.preClosure }
        changedFields.push('preClosure')
      }
      if (updates.readiness) {
        tracker.readiness = { ...tracker.readiness?.toObject?.() || {}, ...updates.readiness }
        changedFields.push('readiness')
      }
      if (updates.projection) {
        tracker.projection = { ...tracker.projection?.toObject?.() || {}, ...updates.projection }
        changedFields.push('projection')
      }
      if (updates.actual) {
        tracker.actual = { ...tracker.actual?.toObject?.() || {}, ...updates.actual }
        changedFields.push('actual')
      }
      if (updates.tenPercentTracking) {
        tracker.tenPercentTracking = { ...tracker.tenPercentTracking?.toObject?.() || {}, ...updates.tenPercentTracking }
        changedFields.push('tenPercentTracking')
      }

      // Add activity
      if (changedFields.length > 0) {
        tracker.activities.push({
          action: 'updated',
          description: `Tracker updated by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name,
          metadata: { fields: changedFields }
        })
      }

      await tracker.save()

      await tracker.populate('project', 'title projectId')
      await tracker.populate('customer', 'name customerId')
      await tracker.populate('designer', 'name email')

      res.json({
        success: true,
        data: tracker,
        message: 'P2P tracker updated'
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
 * @desc    Update specific stage fields
 * @route   PUT /api/design-p2p-tracker/:id/stage/:stageNum
 * @access  Private
 */
router.put('/:id/stage/:stageNum',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const tracker = await DesignP2PTracker.findById(req.params.id)

      if (!tracker) {
        return res.status(404).json({
          success: false,
          message: 'P2P tracker not found'
        })
      }

      const stageNum = parseInt(req.params.stageNum)
      const updates = req.body

      const stageFields = {
        1: ['tenPercentPayment', 'tenPercentAmount', 'quoteRequirementsReceived'],
        2: ['mmtBooked', 'skpShellReceived'],
        3: ['designDiscussion', 'designDiscussionNotes', 'colourSelection', 'designFinalized'],
        4: ['validationDwgStarted', 'validationDwgCompleted', 'siteValidation', 'p2pDwgStarted', 'p2pDwgCompleted'],
        5: ['qcStarted', 'qcCompleted', 'qcInputs', 'qcDwgsReady', 'qcDate', 'sodApproval', 'sodDate'],
        6: ['sixtyPercentPayment', 'p2pDate', 'dispatchDate', 'handoverDate', 'gfcDate']
      }

      const allowedFields = stageFields[stageNum]
      if (!allowedFields) {
        return res.status(400).json({
          success: false,
          message: 'Invalid stage number (1-6)'
        })
      }

      const changedFields = []
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          tracker[field] = updates[field]
          changedFields.push(field)
        }
      }

      if (changedFields.length > 0) {
        tracker.activities.push({
          action: 'stage_updated',
          description: `Stage ${stageNum} updated by ${req.user.name}`,
          performedBy: req.user._id,
          performedByName: req.user.name,
          metadata: { stage: stageNum, fields: changedFields }
        })
      }

      await tracker.save()

      res.json({
        success: true,
        data: tracker,
        message: `Stage ${stageNum} updated`
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
 * @desc    Add daily log (AOD/EOD)
 * @route   POST /api/design-p2p-tracker/:id/daily-log
 * @access  Private
 */
router.post('/:id/daily-log',
  requirePermission(PERMISSIONS.PROJECTS_EDIT),
  async (req, res) => {
    try {
      const { date, aod, eod, remarks, designerId } = req.body

      const tracker = await DesignP2PTracker.findById(req.params.id)

      if (!tracker) {
        return res.status(404).json({
          success: false,
          message: 'P2P tracker not found'
        })
      }

      tracker.dailyLogs.push({
        date: date || new Date(),
        designer: designerId || req.user._id,
        designerName: req.user.name,
        aod,
        eod,
        remarks
      })

      tracker.activities.push({
        action: 'daily_log_added',
        description: `Daily log added by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })

      await tracker.save()

      res.json({
        success: true,
        data: tracker,
        message: 'Daily log added'
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
 * @desc    Delete P2P tracker
 * @route   DELETE /api/design-p2p-tracker/:id
 * @access  Private
 */
router.delete('/:id',
  requirePermission(PERMISSIONS.PROJECTS_DELETE),
  async (req, res) => {
    try {
      const tracker = await DesignP2PTracker.findById(req.params.id)

      if (!tracker) {
        return res.status(404).json({
          success: false,
          message: 'P2P tracker not found'
        })
      }

      if (req.user.role !== 'super_admin' &&
          tracker.company.toString() !== req.activeCompany._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        })
      }

      await DesignP2PTracker.findByIdAndDelete(req.params.id)

      res.json({
        success: true,
        message: 'P2P tracker deleted'
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
