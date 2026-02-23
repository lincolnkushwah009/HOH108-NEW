import express from 'express'
import ExitManagement from '../models/ExitManagement.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all exit records
router.get('/', async (req, res) => {
  try {
    const { search, status, exitType, page = 1, limit = 50 } = req.query

    const filter = { company: req.user.company }
    if (status) filter.status = status
    if (exitType) filter.exitType = exitType

    let query = ExitManagement.find(filter)
      .populate('employee', 'name email employeeId')
      .populate('createdBy', 'name')
      .populate('fnf.approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    if (search) {
      query = query.where({
        $or: [
          { exitId: new RegExp(search, 'i') }
        ]
      })
    }

    const exits = await query
    const total = await ExitManagement.countDocuments(filter)

    const stats = await ExitManagement.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          initiated: { $sum: { $cond: [{ $eq: ['$status', 'initiated'] }, 1, 0] } },
          noticePeriod: { $sum: { $cond: [{ $eq: ['$status', 'notice_period'] }, 1, 0] } },
          fnfProcessing: { $sum: { $cond: [{ $eq: ['$status', 'fnf_processing'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ])

    res.json({
      success: true,
      count: exits.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || { total: 0, initiated: 0, noticePeriod: 0, fnfProcessing: 0, completed: 0 },
      data: exits
    })
  } catch (error) {
    console.error('Error fetching exit records:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single exit record
router.get('/:id', async (req, res) => {
  try {
    const exit = await ExitManagement.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .populate('employee', 'name email employeeId department')
      .populate('createdBy', 'name')
      .populate('fnf.approvedBy', 'name')
      .populate('checklist.completedBy', 'name')

    if (!exit) {
      return res.status(404).json({ success: false, message: 'Exit record not found' })
    }

    res.json({ success: true, data: exit })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create exit record
router.post('/', async (req, res) => {
  try {
    const exit = await ExitManagement.create({
      ...req.body,
      company: req.user.company,
      createdBy: req.user._id
    })

    res.status(201).json({ success: true, data: exit })
  } catch (error) {
    console.error('Error creating exit record:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update exit record
router.put('/:id', async (req, res) => {
  try {
    const exit = await ExitManagement.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!exit) {
      return res.status(404).json({ success: false, message: 'Exit record not found' })
    }

    Object.assign(exit, req.body)
    await exit.save()

    res.json({ success: true, data: exit })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update checklist item
router.put('/:id/checklist/:itemId', async (req, res) => {
  try {
    const exit = await ExitManagement.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!exit) {
      return res.status(404).json({ success: false, message: 'Exit record not found' })
    }

    const item = exit.checklist.id(req.params.itemId)
    if (!item) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' })
    }

    item.status = req.body.status || item.status
    item.remarks = req.body.remarks || item.remarks
    if (req.body.status === 'completed') {
      item.completedBy = req.user._id
      item.completedAt = new Date()
    }

    await exit.save()
    res.json({ success: true, data: exit })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update F&F details
router.put('/:id/fnf', async (req, res) => {
  try {
    const exit = await ExitManagement.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!exit) {
      return res.status(404).json({ success: false, message: 'Exit record not found' })
    }

    exit.fnf = { ...exit.fnf, ...req.body }
    if (req.body.status === 'approved') {
      exit.fnf.approvedBy = req.user._id
    }
    if (req.body.status === 'paid') {
      exit.fnf.paidAt = new Date()
    }

    await exit.save()
    res.json({ success: true, data: exit })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete exit record
router.delete('/:id', async (req, res) => {
  try {
    const exit = await ExitManagement.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    })

    if (!exit) {
      return res.status(404).json({ success: false, message: 'Exit record not found' })
    }

    res.json({ success: true, message: 'Exit record deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
