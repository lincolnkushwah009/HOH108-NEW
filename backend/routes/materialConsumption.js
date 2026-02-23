import express from 'express'
import MaterialConsumption from '../models/MaterialConsumption.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all consumption records
router.get('/', async (req, res) => {
    try {
        const { search, status, workOrder, project, page = 1, limit = 50 } = req.query
        const filter = { company: req.user.company }
        if (status) filter.status = status
        if (workOrder) filter.workOrder = workOrder
        if (project) filter.project = project

        let query = MaterialConsumption.find(filter)
            .populate('material', 'name materialCode unit')
            .populate('workOrder', 'workOrderId title')
            .populate('project', 'name projectId')
            .populate('recordedBy', 'name')
            .populate('approvedBy', 'name')
            .sort({ consumptionDate: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))

        if (search) {
            query = query.where({
                $or: [
                    { consumptionId: new RegExp(search, 'i') },
                    { 'materialDetails.name': new RegExp(search, 'i') }
                ]
            })
        }

        const records = await query
        const total = await MaterialConsumption.countDocuments(filter)

        const stats = await MaterialConsumption.aggregate([
            { $match: { company: req.user.company._id || req.user.company } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    totalConsumptionCost: { $sum: '$consumptionCost' },
                    totalScrapCost: { $sum: '$scrapCost' },
                    totalCost: { $sum: '$totalCost' }
                }
            }
        ])

        res.json({
            success: true,
            count: records.length,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
            stats: stats[0] || { total: 0, totalConsumptionCost: 0, totalScrapCost: 0, totalCost: 0 },
            data: records
        })
    } catch (error) {
        console.error('Error fetching consumption records:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get work order consumption summary
router.get('/work-order/:workOrderId/summary', async (req, res) => {
    try {
        const summary = await MaterialConsumption.getWorkOrderSummary(req.params.workOrderId)
        res.json({ success: true, data: summary })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get scrap analysis
router.get('/scrap-analysis', async (req, res) => {
    try {
        const { startDate, endDate } = req.query
        const analysis = await MaterialConsumption.getScrapAnalysis(req.user.company, startDate, endDate)
        res.json({ success: true, data: analysis })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get single consumption record
router.get('/:id', async (req, res) => {
    try {
        const record = await MaterialConsumption.findOne({ _id: req.params.id, company: req.user.company })
            .populate('material', 'name materialCode unit')
            .populate('workOrder', 'workOrderId title')
            .populate('project', 'name projectId')
            .populate('materialIssue', 'issueId')
            .populate('recordedBy', 'name')
            .populate('approvedBy', 'name')

        if (!record) return res.status(404).json({ success: false, message: 'Consumption record not found' })
        res.json({ success: true, data: record })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Create consumption record
router.post('/', async (req, res) => {
    try {
        const record = await MaterialConsumption.create({
            ...req.body,
            company: req.user.company,
            recordedBy: req.user._id,
            recordedByName: req.user.name
        })
        res.status(201).json({ success: true, data: record })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update consumption record
router.put('/:id', async (req, res) => {
    try {
        const record = await MaterialConsumption.findOne({ _id: req.params.id, company: req.user.company })
        if (!record) return res.status(404).json({ success: false, message: 'Consumption record not found' })
        Object.assign(record, req.body)
        await record.save()
        res.json({ success: true, data: record })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Approve consumption record
router.put('/:id/approve', async (req, res) => {
    try {
        const record = await MaterialConsumption.findOne({ _id: req.params.id, company: req.user.company })
        if (!record) return res.status(404).json({ success: false, message: 'Consumption record not found' })
        record.status = 'approved'
        record.approvedBy = req.user._id
        record.approvedByName = req.user.name
        record.approvedAt = new Date()
        await record.save()
        res.json({ success: true, data: record })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Delete consumption record
router.delete('/:id', async (req, res) => {
    try {
        const record = await MaterialConsumption.findOneAndDelete({ _id: req.params.id, company: req.user.company })
        if (!record) return res.status(404).json({ success: false, message: 'Consumption record not found' })
        res.json({ success: true, message: 'Consumption record deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
