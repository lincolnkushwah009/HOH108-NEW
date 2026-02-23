import express from 'express'
import DataRetentionPolicy from '../models/DataRetentionPolicy.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all policies
router.get('/', async (req, res) => {
    try {
        const { entityType, isActive } = req.query
        const filter = { company: req.user.company }
        if (entityType) filter.entityType = entityType
        if (isActive !== undefined) filter.isActive = isActive === 'true'

        const policies = await DataRetentionPolicy.find(filter)
            .populate('createdBy', 'name')
            .sort({ entityType: 1 })

        res.json({ success: true, count: policies.length, data: policies })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get single policy
router.get('/:id', async (req, res) => {
    try {
        const policy = await DataRetentionPolicy.findOne({ _id: req.params.id, company: req.user.company })
            .populate('createdBy', 'name')
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' })
        res.json({ success: true, data: policy })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Create policy
router.post('/', async (req, res) => {
    try {
        const policy = await DataRetentionPolicy.create({ ...req.body, company: req.user.company, createdBy: req.user._id })
        res.status(201).json({ success: true, data: policy })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update policy
router.put('/:id', async (req, res) => {
    try {
        const policy = await DataRetentionPolicy.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company },
            req.body,
            { new: true, runValidators: true }
        )
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' })
        res.json({ success: true, data: policy })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Delete policy
router.delete('/:id', async (req, res) => {
    try {
        const policy = await DataRetentionPolicy.findOneAndDelete({ _id: req.params.id, company: req.user.company })
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' })
        res.json({ success: true, message: 'Policy deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
