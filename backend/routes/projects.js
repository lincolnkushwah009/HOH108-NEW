import express from 'express'
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  toggleFeatured,
  getProjectKanbanDetail
} from '../controllers/projectController.js'
import { protect, setCompanyContext, authorize, requireModulePermission } from '../middleware/rbac.js'
import { uploadSiteMedia } from '../middleware/upload.js'
import Project from '../models/Project.js'

const router = express.Router()

// All routes require auth + company context
router.use(protect)
router.use(setCompanyContext)

// Read routes - require module view permission
router.get('/', requireModulePermission('all_projects', 'view'), getProjects)
router.get('/:id/kanban-detail', requireModulePermission('all_projects', 'view'), getProjectKanbanDetail)
router.get('/:id', requireModulePermission('all_projects', 'view'), getProject)

// Write routes - require module edit permission + elevated roles
router.post('/', authorize('super_admin', 'company_admin', 'project_manager', 'operations', 'sales_manager'), requireModulePermission('all_projects', 'edit'), createProject)
router.put('/:id', authorize('super_admin', 'company_admin', 'project_manager', 'operations', 'sales_manager', 'site_engineer'), requireModulePermission('all_projects', 'edit'), updateProject)
router.delete('/:id', authorize('super_admin', 'company_admin'), deleteProject)
router.put('/:id/featured', authorize('super_admin', 'company_admin'), toggleFeatured)

// Upload site media (photos/videos) to a project
router.post('/:id/site-media',
  requireModulePermission('all_projects', 'edit'),
  uploadSiteMedia.array('files', 20),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id)
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' })
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' })
      }

      const category = req.body.category || 'during'
      const caption = req.body.caption || ''

      const newMedia = req.files.map(file => {
        const isVideo = file.mimetype.startsWith('video/')
        return {
          url: `/uploads/site-media/${file.filename}`,
          caption: caption || file.originalname,
          type: category,
          isMain: false,
          uploadedBy: req.user._id,
          uploadedByName: req.user.name,
          uploadedAt: new Date(),
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          mediaType: isVideo ? 'video' : 'image'
        }
      })

      project.images.push(...newMedia)

      // Log activity
      project.activities = project.activities || []
      project.activities.push({
        action: 'media_uploaded',
        description: `${req.files.length} file(s) uploaded by ${req.user.name}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        createdAt: new Date()
      })

      await project.save()

      res.json({
        success: true,
        message: `${req.files.length} file(s) uploaded successfully`,
        data: newMedia
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Get site media for a project
router.get('/:id/site-media',
  requireModulePermission('all_projects', 'view'),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id).select('images projectId title')
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' })
      }

      res.json({
        success: true,
        data: project.images || [],
        project: { projectId: project.projectId, title: project.title }
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// Delete a site media file
router.delete('/:id/site-media/:mediaId',
  requireModulePermission('all_projects', 'edit'),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id)
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' })
      }

      const mediaIndex = project.images.findIndex(img => img._id.toString() === req.params.mediaId)
      if (mediaIndex === -1) {
        return res.status(404).json({ success: false, message: 'Media not found' })
      }

      project.images.splice(mediaIndex, 1)
      await project.save()

      res.json({ success: true, message: 'Media deleted successfully' })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

export default router
