import express from 'express'
import {
  getMailTemplates,
  getMailTemplate,
  createMailTemplate,
  updateMailTemplate,
  deleteMailTemplate,
  toggleMailTemplate,
  previewMailTemplate
} from '../controllers/mailTemplateController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// All routes are protected
router.use(protect)
router.use(authorize('admin', 'superadmin'))

router.route('/')
  .get(getMailTemplates)
  .post(createMailTemplate)

router.route('/:id')
  .get(getMailTemplate)
  .put(updateMailTemplate)
  .delete(deleteMailTemplate)

router.put('/:id/toggle', toggleMailTemplate)
router.post('/:id/preview', previewMailTemplate)

export default router
