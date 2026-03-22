import express from 'express'
import StockTake from '../models/StockTake.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('stock_takes', 'view'))

// Get all stock takes
router.get('/', async (req, res) => {
    try {
        const { search, status, type, warehouse, page = 1, limit = 50 } = req.query

        const filter = { company: req.user.company }
        if (status) filter.status = status
        if (type) filter.type = type
        if (warehouse) filter.warehouse = warehouse

        let query = StockTake.find(filter)
            .populate('conductedBy', 'name email')
            .populate('approvedBy', 'name')
            .populate('createdBy', 'name')
            .sort({ scheduledDate: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))

        if (search) {
            query = query.where({
                $or: [
                    { stockTakeId: new RegExp(search, 'i') },
                    { warehouse: new RegExp(search, 'i') }
                ]
            })
        }

        const stockTakes = await query
        const total = await StockTake.countDocuments(filter)

        const stats = await StockTake.aggregate([
            { $match: { company: req.user.company._id || req.user.company } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    planned: { $sum: { $cond: [{ $eq: ['$status', 'planned'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                    totalVariance: { $sum: '$totalVarianceValue' }
                }
            }
        ])

        res.json({
            success: true,
            count: stockTakes.length,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            stats: stats[0] || { total: 0, planned: 0, inProgress: 0, completed: 0, approved: 0, totalVariance: 0 },
            data: stockTakes
        })
    } catch (error) {
        console.error('Error fetching stock takes:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get single stock take
router.get('/:id', async (req, res) => {
    try {
        const stockTake = await StockTake.findOne({
            _id: req.params.id,
            company: req.user.company
        })
            .populate('conductedBy', 'name email')
            .populate('approvedBy', 'name')
            .populate('createdBy', 'name')
            .populate('entries.material', 'name materialCode unit')
            .populate('entries.stock', 'quantity')

        if (!stockTake) {
            return res.status(404).json({ success: false, message: 'Stock take not found' })
        }

        res.json({ success: true, data: stockTake })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Create stock take
router.post('/', async (req, res) => {
    try {
        const stockTake = await StockTake.create({
            ...req.body,
            company: req.user.company,
            createdBy: req.user._id
        })

        res.status(201).json({ success: true, data: stockTake })
    } catch (error) {
        console.error('Error creating stock take:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update stock take
router.put('/:id', async (req, res) => {
    try {
        const stockTake = await StockTake.findOne({
            _id: req.params.id,
            company: req.user.company
        })

        if (!stockTake) {
            return res.status(404).json({ success: false, message: 'Stock take not found' })
        }

        Object.assign(stockTake, req.body)
        await stockTake.save()

        res.json({ success: true, data: stockTake })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Approve stock take
router.put('/:id/approve', async (req, res) => {
    try {
        const stockTake = await StockTake.findOne({
            _id: req.params.id,
            company: req.user.company
        })

        if (!stockTake) {
            return res.status(404).json({ success: false, message: 'Stock take not found' })
        }

        stockTake.status = 'approved'
        stockTake.approvedBy = req.user._id
        await stockTake.save()

        res.json({ success: true, data: stockTake })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Delete stock take
router.delete('/:id', async (req, res) => {
    try {
        const stockTake = await StockTake.findOneAndDelete({
            _id: req.params.id,
            company: req.user.company
        })

        if (!stockTake) {
            return res.status(404).json({ success: false, message: 'Stock take not found' })
        }

        res.json({ success: true, message: 'Stock take deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
