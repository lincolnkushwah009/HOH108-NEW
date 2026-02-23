import express from 'express'
import TrainingSkillMatrix from '../models/TrainingSkillMatrix.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all skill matrices
router.get('/', async (req, res) => {
    try {
        const { search, skillCategory, proficiency, page = 1, limit = 50 } = req.query

        const filter = { company: req.user.company }
        if (skillCategory) filter['skills.category'] = skillCategory
        if (proficiency) filter['skills.proficiencyLevel'] = proficiency

        let query = TrainingSkillMatrix.find(filter)
            .populate('employee', 'name email employeeId department')
            .sort({ updatedAt: -1 })
            .skip((page - 1) * parseInt(limit))
            .limit(parseInt(limit))

        const matrices = await query
        const total = await TrainingSkillMatrix.countDocuments(filter)

        const stats = await TrainingSkillMatrix.aggregate([
            { $match: { company: req.user.company._id || req.user.company } },
            {
                $group: {
                    _id: null,
                    totalEmployees: { $sum: 1 },
                    totalSkills: { $sum: { $size: '$skills' } },
                    totalTrainings: { $sum: { $size: '$trainings' } },
                    completedTrainings: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$trainings',
                                    as: 't',
                                    cond: { $eq: ['$$t.status', 'completed'] }
                                }
                            }
                        }
                    }
                }
            }
        ])

        res.json({
            success: true,
            count: matrices.length,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            stats: stats[0] || { totalEmployees: 0, totalSkills: 0, totalTrainings: 0, completedTrainings: 0 },
            data: matrices
        })
    } catch (error) {
        console.error('Error fetching skill matrices:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get skill matrix for specific employee
router.get('/employee/:employeeId', async (req, res) => {
    try {
        const matrix = await TrainingSkillMatrix.findOne({
            employee: req.params.employeeId,
            company: req.user.company
        }).populate('employee', 'name email employeeId department')
            .populate('skills.assessedBy', 'name')

        if (!matrix) {
            return res.status(404).json({ success: false, message: 'Skill matrix not found for this employee' })
        }

        res.json({ success: true, data: matrix })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Get single skill matrix by ID
router.get('/:id', async (req, res) => {
    try {
        const matrix = await TrainingSkillMatrix.findOne({
            _id: req.params.id,
            company: req.user.company
        }).populate('employee', 'name email employeeId department')
            .populate('skills.assessedBy', 'name')

        if (!matrix) {
            return res.status(404).json({ success: false, message: 'Skill matrix not found' })
        }

        res.json({ success: true, data: matrix })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Create or update skill matrix for employee
router.post('/', async (req, res) => {
    try {
        const { employee, ...data } = req.body

        let matrix = await TrainingSkillMatrix.findOne({
            employee,
            company: req.user.company
        })

        if (matrix) {
            Object.assign(matrix, data)
            await matrix.save()
        } else {
            matrix = await TrainingSkillMatrix.create({
                ...data,
                employee,
                company: req.user.company
            })
        }

        res.status(201).json({ success: true, data: matrix })
    } catch (error) {
        console.error('Error creating/updating skill matrix:', error)
        res.status(500).json({ success: false, message: error.message })
    }
})

// Add skill to employee matrix
router.post('/:id/skills', async (req, res) => {
    try {
        const matrix = await TrainingSkillMatrix.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company },
            {
                $push: {
                    skills: {
                        ...req.body,
                        assessedBy: req.user._id,
                        assessedAt: new Date()
                    }
                }
            },
            { new: true }
        )

        if (!matrix) {
            return res.status(404).json({ success: false, message: 'Skill matrix not found' })
        }

        res.json({ success: true, data: matrix })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Add training to employee matrix
router.post('/:id/trainings', async (req, res) => {
    try {
        const matrix = await TrainingSkillMatrix.findOneAndUpdate(
            { _id: req.params.id, company: req.user.company },
            { $push: { trainings: req.body } },
            { new: true }
        )

        if (!matrix) {
            return res.status(404).json({ success: false, message: 'Skill matrix not found' })
        }

        res.json({ success: true, data: matrix })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update specific skill
router.put('/:id/skills/:skillId', async (req, res) => {
    try {
        const matrix = await TrainingSkillMatrix.findOne({
            _id: req.params.id,
            company: req.user.company
        })

        if (!matrix) {
            return res.status(404).json({ success: false, message: 'Skill matrix not found' })
        }

        const skill = matrix.skills.id(req.params.skillId)
        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' })
        }

        Object.assign(skill, req.body)
        skill.assessedBy = req.user._id
        skill.assessedAt = new Date()
        await matrix.save()

        res.json({ success: true, data: matrix })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Update specific training
router.put('/:id/trainings/:trainingId', async (req, res) => {
    try {
        const matrix = await TrainingSkillMatrix.findOne({
            _id: req.params.id,
            company: req.user.company
        })

        if (!matrix) {
            return res.status(404).json({ success: false, message: 'Skill matrix not found' })
        }

        const training = matrix.trainings.id(req.params.trainingId)
        if (!training) {
            return res.status(404).json({ success: false, message: 'Training not found' })
        }

        Object.assign(training, req.body)
        await matrix.save()

        res.json({ success: true, data: matrix })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

// Delete skill matrix
router.delete('/:id', async (req, res) => {
    try {
        const matrix = await TrainingSkillMatrix.findOneAndDelete({
            _id: req.params.id,
            company: req.user.company
        })

        if (!matrix) {
            return res.status(404).json({ success: false, message: 'Skill matrix not found' })
        }

        res.json({ success: true, message: 'Skill matrix deleted' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
})

export default router
