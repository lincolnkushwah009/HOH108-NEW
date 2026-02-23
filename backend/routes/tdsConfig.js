import express from 'express'
import TDSConfig from '../models/TDSConfig.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all TDS configs
router.get('/', async (req, res) => {
    try {
        const { vendor, section, isActive, page = 1, limit = 50 } = req.query
        const filter = { company: req.user.company }
        if (vendor) filter.vendor = vendor
        if (section) filter.section = section
        if (isActive !== undefined) filter.isActive = isActive === 'true'

        const configs = await TDSConfig.find(filter)
            .populate('vendor', 'name vendorId pan')
            .populate('createdBy', 'name')
            .sort({ section: 1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))

        const total = await TDSConfig.countDocuments(filter)
        res.json({
            success: true,
            count: configs.length,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
            data: configs
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get single config
router.get('/:id', async (req, res) => {
    try {
        const config = await TDSConfig.findOne({ _id: req.params.id, company: req.user.company })
            .populate('vendor', 'name vendorId pan')
            .populate('createdBy', 'name')
        if (!config) return res.status(404).json({ success: false, message: 'TDS config not found' })
        res.json({ success: true, data: config })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Create TDS config
router.post('/', async (req, res) => {
    try {
        const config = await TDSConfig.create({ ...req.body, company: req.user.company, createdBy: req.user._id })
        res.status(201).json({ success: true, data: config })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update TDS config
router.put('/:id', async (req, res) => {
    try {
        const config = await TDSConfig.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company },
            req.body,
            { new: true, runValidators: true }
        )
        if (!config) return res.status(404).json({ success: false, message: 'TDS config not found' })
        res.json({ success: true, data: config })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Delete TDS config
router.delete('/:id', async (req, res) => {
    try {
        const config = await TDSConfig.findOneAndDelete({ _id: req.params.id, company: req.user.company })
        if (!config) return res.status(404).json({ success: false, message: 'TDS config not found' })
        res.json({ success: true, message: 'TDS config deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
