import express from 'express'
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  addKarmaPoints
} from '../controllers/userController.js'
import { protect, authorize, setCompanyContext } from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(authorize('super_admin', 'company_admin', 'it_admin', 'hr_head', 'manager'))

router.get('/', getUsers)
router.get('/:id', getUser)
router.post('/', authorize('super_admin', 'company_admin', 'it_admin'), createUser)
router.put('/:id', updateUser)
router.delete('/:id', authorize('super_admin', 'company_admin'), deleteUser)
router.post('/:id/karma', addKarmaPoints)

export default router
