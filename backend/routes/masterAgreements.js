import express from 'express'
import MasterAgreement from '../models/MasterAgreement.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all master agreements
router.get('/', async (req, res) => {
    try {
        const { search, status, project, page = 1, limit = 50 } = req.query
        const filter = { company: req.user.company }
        if (status) filter.status = status
        if (project) filter.project = project

        let query = MasterAgreement.find(filter)
            .populate('project', 'name projectId')
            .populate('customer', 'name customerId')
            .populate('createdBy', 'name')
            .select('-activities -notifications -approvalItems.approvals.emailToken')
            .sort({ createdAt: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))

        if (search) {
            query = query.where({
                $or: [
                    { agreementId: new RegExp(search, 'i') },
                    { title: new RegExp(search, 'i') }
                ]
            })
        }

        const agreements = await query
        const total = await MasterAgreement.countDocuments(filter)

        res.json({
            success: true,
            count: agreements.length,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
            data: agreements
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get pending approvals for current user
router.get('/pending-approvals', async (req, res) => {
    try {
        const agreements = await MasterAgreement.getPendingApprovalsForUser(req.user._id)
        res.json({ success: true, data: agreements })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get single agreement
router.get('/:id', async (req, res) => {
    try {
        const agreement = await MasterAgreement.findOne({ _id: req.params.id, company: req.user.company })
            .populate('project', 'name projectId')
            .populate('customer', 'name customerId')
            .populate('salesOrder', 'salesOrderId')
            .populate('createdBy', 'name')
            .populate('approvers.user', 'name email')
            .populate('approvalItems.approvals.approver', 'name email')
            .populate('handover.handedOverBy', 'name')
            .populate('handover.handedOverTo', 'name')
            .populate('handover.projectManager', 'name')
            .populate('activities.performedBy', 'name')

        if (!agreement) return res.status(404).json({ success: false, message: 'Agreement not found' })
        res.json({ success: true, data: agreement })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Create agreement
router.post('/', async (req, res) => {
    try {
        const agreement = await MasterAgreement.create({
            ...req.body,
            company: req.user.company,
            createdBy: req.user._id,
            createdByName: req.user.name
        })
        res.status(201).json({ success: true, data: agreement })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update agreement
router.put('/:id', async (req, res) => {
    try {
        const agreement = await MasterAgreement.findOne({ _id: req.params.id, company: req.user.company })
        if (!agreement) return res.status(404).json({ success: false, message: 'Agreement not found' })

        Object.assign(agreement, req.body)
        agreement.lastModifiedBy = req.user._id
        agreement.lastModifiedByName = req.user.name
        await agreement.save()

        res.json({ success: true, data: agreement })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Submit for approval
router.post('/:id/submit', async (req, res) => {
    try {
        const agreement = await MasterAgreement.findOne({ _id: req.params.id, company: req.user.company })
        if (!agreement) return res.status(404).json({ success: false, message: 'Agreement not found' })

        await agreement.submitForApproval(req.user._id, req.user.name)
        res.json({ success: true, data: agreement })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
})

// Process approval
router.post('/:id/approve', async (req, res) => {
    try {
        const agreement = await MasterAgreement.findOne({ _id: req.params.id, company: req.user.company })
        if (!agreement) return res.status(404).json({ success: false, message: 'Agreement not found' })

        const { itemType, action, remarks } = req.body
        await agreement.processApproval(itemType, req.user._id, action, remarks, {
            via: 'dashboard',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        })

        res.json({ success: true, data: agreement })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
})

// Complete handover
router.post('/:id/handover', async (req, res) => {
    try {
        const agreement = await MasterAgreement.findOne({ _id: req.params.id, company: req.user.company })
        if (!agreement) return res.status(404).json({ success: false, message: 'Agreement not found' })

        await agreement.completeHandover(req.body, req.user._id, req.user.name)
        res.json({ success: true, data: agreement })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
})

// Delete agreement
router.delete('/:id', async (req, res) => {
    try {
        const agreement = await MasterAgreement.findOneAndDelete({ _id: req.params.id, company: req.user.company })
        if (!agreement) return res.status(404).json({ success: false, message: 'Agreement not found' })
        res.json({ success: true, message: 'Agreement deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
