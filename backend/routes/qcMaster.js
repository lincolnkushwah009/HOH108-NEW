import express from 'express'
import QCMaster from '../models/QCMaster.js'
import { protect, setCompanyContext, requireModulePermission, companyScopedQuery } from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('qc_master', 'view'))

// GET /api/qc-master/dashboard — Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company context required' })
    }

    const matchFilter = { company: companyId }
    if (req.query.project) {
      matchFilter.project = new (await import('mongoose')).default.Types.ObjectId(req.query.project)
    }

    const [statusCounts, categoryCounts, projectCounts, scoreStats] = await Promise.all([
      QCMaster.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      QCMaster.aggregate([
        { $match: matchFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      QCMaster.aggregate([
        { $match: matchFilter },
        { $group: { _id: { project: '$project', projectName: '$projectName' }, count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      QCMaster.aggregate([
        { $match: { ...matchFilter, score: { $ne: null } } },
        { $group: { _id: null, avgScore: { $avg: '$score' }, minScore: { $min: '$score' }, maxScore: { $max: '$score' }, total: { $sum: 1 } } }
      ])
    ])

    const statusMap = {}
    statusCounts.forEach(s => { statusMap[s._id] = s.count })

    const categoryMap = {}
    categoryCounts.forEach(c => { categoryMap[c._id] = c.count })

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        total,
        pending: statusMap.pending || 0,
        inProgress: statusMap.in_progress || 0,
        passed: statusMap.passed || 0,
        failed: statusMap.failed || 0,
        rework: statusMap.rework || 0,
        waived: statusMap.waived || 0,
        byCategory: categoryMap,
        byProject: projectCounts.map(p => ({
          projectId: p._id.project,
          projectName: p._id.projectName,
          count: p.count,
          avgScore: Math.round(p.avgScore || 0)
        })),
        avgScore: Math.round(scoreStats[0]?.avgScore || 0),
        minScore: scoreStats[0]?.minScore || 0,
        maxScore: scoreStats[0]?.maxScore || 0
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/qc-master/project/:projectId — All QC records for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const queryFilter = companyScopedQuery(req, { project: req.params.projectId })
    const records = await QCMaster.find(queryFilter)
      .populate('project', 'title projectId')
      .populate('inspector', 'name')
      .populate('approvedBy', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/qc-master/export — Export QC data
router.get('/export', async (req, res) => {
  try {
    const queryFilter = companyScopedQuery(req)

    if (req.query.project) queryFilter.project = req.query.project
    if (req.query.status) queryFilter.status = req.query.status
    if (req.query.category) queryFilter.category = req.query.category

    const records = await QCMaster.find(queryFilter)
      .populate('project', 'title projectId')
      .populate('inspector', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/qc-master — List all QC records with filters
router.get('/', async (req, res) => {
  try {
    const {
      status, project, category, sourceType, inspector,
      startDate, endDate, search,
      page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) {
      if (status.includes(',')) {
        queryFilter.status = { $in: status.split(',') }
      } else {
        queryFilter.status = status
      }
    }
    if (project) queryFilter.project = project
    if (category) {
      if (category.includes(',')) {
        queryFilter.category = { $in: category.split(',') }
      } else {
        queryFilter.category = category
      }
    }
    if (sourceType) queryFilter.sourceType = sourceType
    if (inspector) queryFilter.inspector = inspector
    if (startDate || endDate) {
      queryFilter.createdAt = {}
      if (startDate) queryFilter.createdAt.$gte = new Date(startDate)
      if (endDate) queryFilter.createdAt.$lte = new Date(endDate)
    }
    if (search) {
      queryFilter.$or = [
        { qcId: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } },
        { sourceName: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await QCMaster.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const records = await QCMaster.find(queryFilter)
      .populate('project', 'title projectId')
      .populate('inspector', 'name')
      .populate('approvedBy', 'name')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: records,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/qc-master/:id — Single QC record
router.get('/:id', async (req, res) => {
  try {
    const record = await QCMaster.findById(req.params.id)
      .populate('project', 'title projectId')
      .populate('inspector', 'name email')
      .populate('approvedBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('defects.assignedTo', 'name')
      .populate('defects.resolvedBy', 'name')
      .populate('checklistItems.checkedBy', 'name')

    if (!record) {
      return res.status(404).json({ success: false, message: 'QC record not found' })
    }

    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/qc-master — Create QC record
router.post('/', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company context required' })
    }

    const recordData = {
      ...req.body,
      company: companyId,
      createdBy: req.user._id,
      createdByName: req.user.name
    }

    const record = new QCMaster(recordData)
    record.addActivity('created', 'QC record created', req.user._id, req.user.name)
    await record.save()

    const populated = await QCMaster.findById(record._id)
      .populate('project', 'title projectId')
      .populate('inspector', 'name')
      .populate('createdBy', 'name')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /api/qc-master/:id — Update QC record
router.put('/:id', async (req, res) => {
  try {
    const record = await QCMaster.findById(req.params.id)
    if (!record) {
      return res.status(404).json({ success: false, message: 'QC record not found' })
    }

    const oldStatus = record.status
    const updatableFields = [
      'title', 'description', 'category', 'phase', 'activity',
      'inspectionDate', 'inspector', 'inspectorName', 'status', 'result', 'score',
      'checklistItems', 'remarks', 'attachments',
      'sourceType', 'sourceId', 'sourceName', 'project', 'projectName'
    ]

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field]
      }
    })

    record.lastModifiedBy = req.user._id
    record.lastModifiedByName = req.user.name

    if (req.body.status && req.body.status !== oldStatus) {
      record.addActivity('status_changed', `Status changed from ${oldStatus} to ${req.body.status}`, req.user._id, req.user.name, oldStatus, req.body.status)
    } else {
      record.addActivity('updated', 'QC record updated', req.user._id, req.user.name)
    }

    await record.save()

    const populated = await QCMaster.findById(record._id)
      .populate('project', 'title projectId')
      .populate('inspector', 'name')
      .populate('createdBy', 'name')

    res.json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /api/qc-master/:id/inspect — Submit inspection result
router.put('/:id/inspect', async (req, res) => {
  try {
    const record = await QCMaster.findById(req.params.id)
    if (!record) {
      return res.status(404).json({ success: false, message: 'QC record not found' })
    }

    const { status, result, score, checklistItems, defects, remarks, inspectionDate } = req.body

    if (status) record.status = status
    if (result) record.result = result
    if (score !== undefined) record.score = score
    if (checklistItems) record.checklistItems = checklistItems
    if (defects) record.defects = defects
    if (remarks) record.remarks = remarks
    record.inspectionDate = inspectionDate || new Date()
    record.inspector = req.user._id
    record.inspectorName = req.user.name
    record.lastModifiedBy = req.user._id
    record.lastModifiedByName = req.user.name

    record.addActivity('inspected', `Inspection completed — Result: ${result || status}`, req.user._id, req.user.name, null, result || status)

    await record.save()

    const populated = await QCMaster.findById(record._id)
      .populate('project', 'title projectId')
      .populate('inspector', 'name')

    res.json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /api/qc-master/:id/approve — Approve/reject QC
router.put('/:id/approve', async (req, res) => {
  try {
    const record = await QCMaster.findById(req.params.id)
    if (!record) {
      return res.status(404).json({ success: false, message: 'QC record not found' })
    }

    const { approved, remarks } = req.body

    record.approvedBy = req.user._id
    record.approvedByName = req.user.name
    record.approvedAt = new Date()
    record.approvalRemarks = remarks || ''

    if (approved) {
      record.status = 'passed'
      record.addActivity('approved', 'QC approved', req.user._id, req.user.name)
    } else {
      record.status = 'failed'
      record.addActivity('rejected', 'QC rejected', req.user._id, req.user.name, null, null, { remarks })
    }

    record.lastModifiedBy = req.user._id
    record.lastModifiedByName = req.user.name

    await record.save()

    const populated = await QCMaster.findById(record._id)
      .populate('project', 'title projectId')
      .populate('inspector', 'name')
      .populate('approvedBy', 'name')

    res.json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/qc-master/:id/defects — Add defect
router.post('/:id/defects', async (req, res) => {
  try {
    const record = await QCMaster.findById(req.params.id)
    if (!record) {
      return res.status(404).json({ success: false, message: 'QC record not found' })
    }

    record.defects.push(req.body)
    record.lastModifiedBy = req.user._id
    record.lastModifiedByName = req.user.name
    record.addActivity('defect_added', `Defect added: ${req.body.description}`, req.user._id, req.user.name, null, null, { severity: req.body.severity })

    await record.save()

    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /api/qc-master/:id/defects/:defectId — Update defect status
router.put('/:id/defects/:defectId', async (req, res) => {
  try {
    const record = await QCMaster.findById(req.params.id)
    if (!record) {
      return res.status(404).json({ success: false, message: 'QC record not found' })
    }

    const defect = record.defects.id(req.params.defectId)
    if (!defect) {
      return res.status(404).json({ success: false, message: 'Defect not found' })
    }

    const oldStatus = defect.status

    if (req.body.status) defect.status = req.body.status
    if (req.body.remarks) defect.remarks = req.body.remarks
    if (req.body.assignedTo) {
      defect.assignedTo = req.body.assignedTo
      defect.assignedToName = req.body.assignedToName
    }

    if (req.body.status === 'resolved') {
      defect.resolvedBy = req.user._id
      defect.resolvedByName = req.user.name
      defect.resolvedAt = new Date()
      record.addActivity('defect_resolved', `Defect resolved: ${defect.description}`, req.user._id, req.user.name, oldStatus, 'resolved')
    } else {
      record.addActivity('updated', `Defect updated: ${defect.description}`, req.user._id, req.user.name, oldStatus, req.body.status)
    }

    record.lastModifiedBy = req.user._id
    record.lastModifiedByName = req.user.name

    await record.save()

    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// DELETE /api/qc-master/:id — Delete QC record
router.delete('/:id', async (req, res) => {
  try {
    const record = await QCMaster.findById(req.params.id)
    if (!record) {
      return res.status(404).json({ success: false, message: 'QC record not found' })
    }

    await QCMaster.findByIdAndDelete(req.params.id)

    res.json({ success: true, message: 'QC record deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
