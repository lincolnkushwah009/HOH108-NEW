import express from 'express'
import RiskRegister from '../models/RiskRegister.js'
import { protect, setCompanyContext, requireModulePermission } from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('risk_register', 'view'))

// Get all risks
router.get('/', async (req, res) => {
    try {
        const { search, status, category, project, page = 1, limit = 50 } = req.query

        const filter = { company: req.user.company }
        if (status) filter.status = status
        if (category) filter.category = category
        if (project) filter.project = project

        let query = RiskRegister.find(filter)
            .populate('project', 'name projectId')
            .populate('owner', 'name email')
            .populate('createdBy', 'name')
            .sort({ riskScore: -1, createdAt: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))

        if (search) {
            query = query.where({
                $or: [
                    { title: new RegExp(search, 'i') },
                    { riskId: new RegExp(search, 'i') },
                    { description: new RegExp(search, 'i') }
                ]
            })
        }

        const risks = await query
        const total = await RiskRegister.countDocuments(filter)

        const stats = await RiskRegister.aggregate([
            { $match: { company: req.user.company._id || req.user.company } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    highRisk: { $sum: { $cond: [{ $gte: ['$riskScore', 15] }, 1, 0] } },
                    mediumRisk: { $sum: { $cond: [{ $and: [{ $gte: ['$riskScore', 8] }, { $lt: ['$riskScore', 15] }] }, 1, 0] } },
                    lowRisk: { $sum: { $cond: [{ $lt: ['$riskScore', 8] }, 1, 0] } },
                    open: { $sum: { $cond: [{ $ne: ['$status', 'closed'] }, 1, 0] } },
                    closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } }
                }
            }
        ])

        res.json({
            success: true,
            count: risks.length,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            stats: stats[0] || { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, open: 0, closed: 0 },
            data: risks
        })
    } catch (error) {
        console.error('Error fetching risks:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get single risk
router.get('/:id', async (req, res) => {
    try {
        const risk = await RiskRegister.findOne({
            _id: req.params.id,
            company: req.user.company
        })
            .populate('project', 'name projectId')
            .populate('owner', 'name email')
            .populate('createdBy', 'name')
            .populate('activities.performedBy', 'name')

        if (!risk) {
            return res.status(404).json({ success: false, message: 'Risk not found' })
        }

        res.json({ success: true, data: risk })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Create risk
router.post('/', async (req, res) => {
    try {
        const risk = await RiskRegister.create({
            ...req.body,
            company: req.user.company,
            createdBy: req.user._id
        })

        res.status(201).json({ success: true, data: risk })
    } catch (error) {
        console.error('Error creating risk:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update risk
router.put('/:id', async (req, res) => {
    try {
        const risk = await RiskRegister.findOne({
            _id: req.params.id,
            company: req.user.company
        })

        if (!risk) {
            return res.status(404).json({ success: false, message: 'Risk not found' })
        }

        Object.assign(risk, req.body)
        await risk.save()

        res.json({ success: true, data: risk })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Add activity to risk
router.post('/:id/activities', async (req, res) => {
    try {
        const risk = await RiskRegister.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company },
            {
                $push: {
                    activities: {
                        ...req.body,
                        performedBy: req.user._id,
                        performedAt: new Date()
                    }
                }
            },
            { new: true }
        )

        if (!risk) {
            return res.status(404).json({ success: false, message: 'Risk not found' })
        }

        res.json({ success: true, data: risk })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Delete risk
router.delete('/:id', async (req, res) => {
    try {
        const risk = await RiskRegister.findOneAndDelete({
            _id: req.params.id,
            company: req.user.company
        })

        if (!risk) {
            return res.status(404).json({ success: false, message: 'Risk not found' })
        }

        res.json({ success: true, message: 'Risk deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
