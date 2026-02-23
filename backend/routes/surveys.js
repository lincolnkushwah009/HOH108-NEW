import express from 'express'
import Survey from '../models/Survey.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all surveys
router.get('/', async (req, res) => {
    try {
        const { search, surveyType, isActive, page = 1, limit = 50 } = req.query

        const filter = { company: req.user.company }
        if (surveyType) filter.surveyType = surveyType
        if (isActive !== undefined) filter.isActive = isActive === 'true'

        const surveys = await Survey.find(filter)
            .populate('createdBy', 'name')
            .select('-responses')
            .sort({ createdAt: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))

        const total = await Survey.countDocuments(filter)

        res.json({
            success: true,
            count: surveys.length,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
            data: surveys
        })
    } catch (error) {
        console.error('Error fetching surveys:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get single survey with responses
router.get('/:id', async (req, res) => {
    try {
        const survey = await Survey.findOne({ _id: req.params.id, company: req.user.company })
            .populate('createdBy', 'name')
            .populate('responses.customer', 'name')
            .populate('responses.project', 'name projectId')

        if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' })
        res.json({ success: true, data: survey })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Create survey
router.post('/', async (req, res) => {
    try {
        const survey = await Survey.create({ ...req.body, company: req.user.company, createdBy: req.user._id })
        res.status(201).json({ success: true, data: survey })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update survey
router.put('/:id', async (req, res) => {
    try {
        const survey = await Survey.findOne({ _id: req.params.id, company: req.user.company })
        if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' })
        Object.assign(survey, req.body)
        await survey.save()
        res.json({ success: true, data: survey })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Submit survey response
router.post('/:id/responses', async (req, res) => {
    try {
        const survey = await Survey.findOne({ _id: req.params.id, company: req.user.company })
        if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' })
        if (!survey.isActive) return res.status(400).json({ success: false, message: 'Survey is inactive' })
        survey.responses.push(req.body)
        await survey.save()
        res.status(201).json({ success: true, data: survey })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Delete survey
router.delete('/:id', async (req, res) => {
    try {
        const survey = await Survey.findOneAndDelete({ _id: req.params.id, company: req.user.company })
        if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' })
        res.json({ success: true, message: 'Survey deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
