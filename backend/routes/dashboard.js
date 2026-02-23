import express from 'express'
import { getDashboardStats, getActivityFeed } from '../controllers/dashboardController.js'
import { protect, setCompanyContext } from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

router.get('/stats', getDashboardStats)
router.get('/activity', getActivityFeed)

export default router
