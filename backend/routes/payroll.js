import express from 'express'
import Payroll from '../models/Payroll.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all payroll records
router.get('/', async (req, res) => {
  try {
    const { search, month, year, status, page = 1, limit = 50 } = req.query

    const filter = { company: req.user.company }
    if (month) filter['period.month'] = parseInt(month)
    if (year) filter['period.year'] = parseInt(year)
    if (status) filter.status = status

    let query = Payroll.find(filter)
      .populate('employee', 'name employeeId department designation')
      .populate('processedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    const payrolls = await query
    const total = await Payroll.countDocuments(filter)

    // Stats
    const stats = await Payroll.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalGross: { $sum: '$grossEarnings' },
          totalDeductions: { $sum: '$totalDeductions' },
          totalNet: { $sum: '$netSalary' },
          paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
        }
      }
    ])

    res.json({
      success: true,
      count: payrolls.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || { totalRecords: 0, totalGross: 0, totalDeductions: 0, totalNet: 0, paid: 0, pending: 0 },
      data: payrolls
    })
  } catch (error) {
    console.error('Error fetching payroll:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single payroll
router.get('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .populate('employee', 'name employeeId department designation')
      .populate('processedBy', 'name')
      .populate('approvedBy', 'name')

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' })
    }

    res.json({ success: true, data: payroll })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create payroll
router.post('/', async (req, res) => {
  try {
    const payroll = await Payroll.create({
      ...req.body,
      company: req.user.company,
      createdBy: req.user._id
    })

    res.status(201).json({ success: true, data: payroll })
  } catch (error) {
    console.error('Error creating payroll:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update payroll
router.put('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true, runValidators: true }
    )

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' })
    }

    res.json({ success: true, data: payroll })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete payroll
router.delete('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    })

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' })
    }

    res.json({ success: true, message: 'Payroll deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Bulk generate payroll
router.post('/generate', async (req, res) => {
  try {
    const { month, year, employees } = req.body
    // This would typically pull employee data and create payroll records
    // For now, return success
    res.json({ success: true, message: 'Payroll generation initiated' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Process payroll (mark as paid)
router.put('/:id/process', async (req, res) => {
  try {
    const payroll = await Payroll.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      {
        status: 'paid',
        paymentDate: new Date(),
        processedBy: req.user._id
      },
      { new: true }
    )

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' })
    }

    res.json({ success: true, data: payroll })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
