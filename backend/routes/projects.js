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

export default router
