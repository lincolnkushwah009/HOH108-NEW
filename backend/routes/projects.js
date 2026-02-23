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
import { protect, authorize } from '../middleware/auth.js'
import { setCompanyContext } from '../middleware/rbac.js'

const router = express.Router()

// Public routes (also works with authenticated users for company context)
router.get('/', protect, setCompanyContext, getProjects)
router.get('/:id/kanban-detail', protect, setCompanyContext, getProjectKanbanDetail)
router.get('/:id', getProject)

// Protected routes
router.post('/', protect, setCompanyContext, authorize('admin', 'superadmin'), createProject)
router.put('/:id', protect, setCompanyContext, authorize('admin', 'superadmin'), updateProject)
router.delete('/:id', protect, setCompanyContext, authorize('admin', 'superadmin'), deleteProject)
router.put('/:id/featured', protect, setCompanyContext, authorize('admin', 'superadmin'), toggleFeatured)

export default router
