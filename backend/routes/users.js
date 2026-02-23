import express from 'express'
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  addKarmaPoints
} from '../controllers/userController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)
router.use(authorize('admin', 'superadmin'))

router.get('/', getUsers)
router.get('/:id', getUser)
router.post('/', authorize('superadmin'), createUser)
router.put('/:id', updateUser)
router.delete('/:id', authorize('superadmin'), deleteUser)
router.post('/:id/karma', addKarmaPoints)

export default router
