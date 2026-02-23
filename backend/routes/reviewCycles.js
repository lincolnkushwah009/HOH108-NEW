import express from 'express'
import ReviewCycle from '../models/ReviewCycle.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all review cycles
router.get('/', async (req, res) => {
  try {
    const { status, cycleType, page = 1, limit = 50 } = req.query

    const filter = { company: req.user.company }
    if (status) filter.status = status
    if (cycleType) filter.cycleType = cycleType

    let query = ReviewCycle.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    const cycles = await query
    const total = await ReviewCycle.countDocuments(filter)

    // Stats
    const stats = await ReviewCycle.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } }
        }
      }
    ])

    res.json({
      success: true,
      count: cycles.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || { total: 0, active: 0, completed: 0, draft: 0 },
      data: cycles
    })
  } catch (error) {
    console.error('Error fetching review cycles:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single cycle
router.get('/:id', async (req, res) => {
  try {
    const cycle = await ReviewCycle.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .populate('createdBy', 'name')
      .populate('participants.employee', 'name employeeId')
      .populate('participants.reviewer', 'name')
      .populate('kras', 'name')

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Review cycle not found' })
    }

    res.json({ success: true, data: cycle })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create cycle
router.post('/', async (req, res) => {
  try {
    const cycle = await ReviewCycle.create({
      ...req.body,
      company: req.user.company,
      createdBy: req.user._id
    })

    res.status(201).json({ success: true, data: cycle })
  } catch (error) {
    console.error('Error creating review cycle:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update cycle
router.put('/:id', async (req, res) => {
  try {
    const cycle = await ReviewCycle.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true, runValidators: true }
    )

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Review cycle not found' })
    }

    res.json({ success: true, data: cycle })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete cycle
router.delete('/:id', async (req, res) => {
  try {
    const cycle = await ReviewCycle.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    })

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Review cycle not found' })
    }

    res.json({ success: true, message: 'Review cycle deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Launch cycle (activate)
router.put('/:id/launch', async (req, res) => {
  try {
    const cycle = await ReviewCycle.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      { status: 'active' },
      { new: true }
    )

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Review cycle not found' })
    }

    res.json({ success: true, data: cycle })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Complete cycle
router.put('/:id/complete', async (req, res) => {
  try {
    const cycle = await ReviewCycle.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      { status: 'completed' },
      { new: true }
    )

    if (!cycle) {
      return res.status(404).json({ success: false, message: 'Review cycle not found' })
    }

    res.json({ success: true, data: cycle })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
