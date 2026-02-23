import express from 'express'
import Package from '../models/Package.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all packages
router.get('/', async (req, res) => {
    try {
        const { isActive, page = 1, limit = 50 } = req.query
        const filter = { company: req.user.company }
        if (isActive !== undefined) filter.isActive = isActive === 'true'

        const packages = await Package.find(filter)
            .populate('createdBy', 'name')
            .sort({ sortOrder: 1, createdAt: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))

        const total = await Package.countDocuments(filter)
        res.json({
            success: true,
            count: packages.length,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
            data: packages
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get single package
router.get('/:id', async (req, res) => {
    try {
        const pkg = await Package.findOne({ _id: req.params.id, company: req.user.company }).populate('createdBy', 'name')
        if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' })
        res.json({ success: true, data: pkg })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Create package
router.post('/', async (req, res) => {
    try {
        const pkg = await Package.create({ ...req.body, company: req.user.company, createdBy: req.user._id })
        res.status(201).json({ success: true, data: pkg })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update package
router.put('/:id', async (req, res) => {
    try {
        const pkg = await Package.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company },
            req.body,
            { new: true, runValidators: true }
        )
        if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' })
        res.json({ success: true, data: pkg })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Delete package
router.delete('/:id', async (req, res) => {
    try {
        const pkg = await Package.findOneAndDelete({ _id: req.params.id, company: req.user.company })
        if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' })
        res.json({ success: true, message: 'Package deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
