import express from 'express'
import Document from '../models/Document.js'
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

// Upload document (create v1)
router.post('/upload', async (req, res) => {
  try {
    const { title, entityType, entityId, fileUrl, fileType, fileSize, tags, accessLevel } = req.body

    if (!title || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Title and fileUrl are required' })
    }

    const document = await Document.create({
      company: req.activeCompany._id,
      title,
      entityType: entityType || 'general',
      entityId: entityId || undefined,
      tags: tags || [],
      accessLevel: accessLevel || 'internal',
      currentVersion: 1,
      versions: [{
        versionNumber: 1,
        filePath: fileUrl,
        fileName: title,
        fileSize: fileSize || 0,
        mimeType: fileType || 'application/octet-stream',
        uploadedBy: req.user._id,
        uploadedAt: new Date()
      }],
      createdBy: req.user._id
    })

    const populated = await Document.findById(document._id)
      .populate('createdBy', 'name email')
      .populate('versions.uploadedBy', 'name email')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Upload new version
router.post('/:id/versions', async (req, res) => {
  try {
    const { fileUrl, fileSize, changeNotes } = req.body

    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'fileUrl is required' })
    }

    const document = await Document.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'active'
    })

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }

    await document.addVersion({
      filePath: fileUrl,
      fileName: document.title,
      fileSize: fileSize || 0,
      mimeType: document.versions[0]?.mimeType || 'application/octet-stream',
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      changeNotes: changeNotes || ''
    })

    const populated = await Document.findById(document._id)
      .populate('createdBy', 'name email')
      .populate('versions.uploadedBy', 'name email')

    res.json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List documents (company scoped, filter by entityType, entityId, tags)
router.get('/', async (req, res) => {
  try {
    const {
      entityType,
      entityId,
      tags,
      accessLevel,
      search,
      page = 1,
      limit = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req, { status: 'active' })

    if (entityType) queryFilter.entityType = entityType
    if (entityId) queryFilter.entityId = entityId
    if (accessLevel) queryFilter.accessLevel = accessLevel
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())
      queryFilter.tags = { $in: tagArray }
    }
    if (search) {
      queryFilter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { documentId: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await Document.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const documents = await Document.find(queryFilter)
      .populate('createdBy', 'name email')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-versions')

    res.json({
      success: true,
      data: documents,
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

// Get document detail with versions
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('createdBy', 'name email')
      .populate('versions.uploadedBy', 'name email')
      .populate('lastAccessedBy', 'name email')

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }

    // Record access
    await document.recordAccess(req.user._id)

    res.json({ success: true, data: document })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get specific version info
router.get('/:id/versions/:versionNumber', async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('versions.uploadedBy', 'name email')

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }

    const version = document.versions.find(
      v => v.versionNumber === parseInt(req.params.versionNumber)
    )

    if (!version) {
      return res.status(404).json({ success: false, message: 'Version not found' })
    }

    // Record access
    await document.recordAccess(req.user._id)

    res.json({ success: true, data: version })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get document audit trail (access log)
router.get('/:id/audit-trail', async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('lastAccessedBy', 'name email')
      .populate('createdBy', 'name email')

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }

    // Build an access log from the available data
    // The Document model tracks lastAccessedAt/lastAccessedBy and version uploads
    const accessLog = []

    // Add creation entry
    accessLog.push({
      user: document.createdBy,
      action: 'created',
      timestamp: document.createdAt
    })

    // Add version upload entries
    document.versions.forEach(v => {
      accessLog.push({
        user: v.uploadedBy,
        action: v.versionNumber === 1 ? 'uploaded' : 'new_version_uploaded',
        versionNumber: v.versionNumber,
        timestamp: v.uploadedAt,
        changeNotes: v.changeNotes || null
      })
    })

    // Add last access entry if available
    if (document.lastAccessedAt && document.lastAccessedBy) {
      accessLog.push({
        user: document.lastAccessedBy,
        action: 'viewed',
        timestamp: document.lastAccessedAt
      })
    }

    // Sort by timestamp descending
    accessLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    res.json({ success: true, data: accessLog })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update tags
router.put('/:id/tags', async (req, res) => {
  try {
    const { tags } = req.body

    if (!Array.isArray(tags)) {
      return res.status(400).json({ success: false, message: 'Tags must be an array' })
    }

    const document = await Document.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'active'
    })

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }

    document.tags = tags
    await document.save()

    res.json({ success: true, data: document })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Soft delete (set isArchived / status to archived)
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }

    document.status = 'archived'
    await document.save()

    res.json({ success: true, message: 'Document archived successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
