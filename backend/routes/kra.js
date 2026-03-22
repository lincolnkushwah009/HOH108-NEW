import express from 'express'
import KRA from '../models/KRA.js'
import { protect, setCompanyContext, requireModulePermission } from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('kra_master', 'view'))

// Get all KRAs
router.get('/', async (req, res) => {
  try {
    const { search, category, isActive, page = 1, limit = 50 } = req.query

    const filter = { company: req.user.company }
    if (category) filter.category = category
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    let query = KRA.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    if (search) {
      query = query.where({
        $or: [
          { name: new RegExp(search, 'i') },
          { kraCode: new RegExp(search, 'i') }
        ]
      })
    }

    const kras = await query
    const total = await KRA.countDocuments(filter)

    // Stats
    const stats = await KRA.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          totalWeight: { $sum: '$weight' }
        }
      }
    ])

    // Category breakdown
    const categoryStats = await KRA.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])

    res.json({
      success: true,
      count: kras.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || { total: 0, active: 0, totalWeight: 0 },
      categoryStats,
      data: kras
    })
  } catch (error) {
    console.error('Error fetching KRAs:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single KRA
router.get('/:id', async (req, res) => {
  try {
    const kra = await KRA.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .populate('createdBy', 'name')
      .populate('kpis.kpi', 'name kpiCode')

    if (!kra) {
      return res.status(404).json({ success: false, message: 'KRA not found' })
    }

    res.json({ success: true, data: kra })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create KRA
router.post('/', async (req, res) => {
  try {
    const kra = await KRA.create({
      ...req.body,
      company: req.user.company,
      createdBy: req.user._id
    })

    res.status(201).json({ success: true, data: kra })
  } catch (error) {
    console.error('Error creating KRA:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update KRA
router.put('/:id', async (req, res) => {
  try {
    const kra = await KRA.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true, runValidators: true }
    )

    if (!kra) {
      return res.status(404).json({ success: false, message: 'KRA not found' })
    }

    res.json({ success: true, data: kra })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete KRA
router.delete('/:id', async (req, res) => {
  try {
    const kra = await KRA.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    })

    if (!kra) {
      return res.status(404).json({ success: false, message: 'KRA not found' })
    }

    res.json({ success: true, message: 'KRA deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Seed default KRAs
router.post('/seed-defaults', async (req, res) => {
  try {
    const existingCount = await KRA.countDocuments({ company: req.user.company })
    if (existingCount > 0) {
      return res.status(400).json({ success: false, message: 'KRAs already exist' })
    }

    const defaults = [
      { kraCode: 'SAL-001', name: 'Revenue Generation', category: 'sales', weight: 20, description: 'Achievement of sales targets and revenue goals' },
      { kraCode: 'SAL-002', name: 'Customer Acquisition', category: 'sales', weight: 15, description: 'New customer acquisition and pipeline development' },
      { kraCode: 'OPS-001', name: 'Project Delivery', category: 'operations', weight: 20, description: 'On-time and on-budget project completion' },
      { kraCode: 'OPS-002', name: 'Quality Management', category: 'operations', weight: 15, description: 'Quality standards and defect management' },
      { kraCode: 'FIN-001', name: 'Cost Control', category: 'finance', weight: 10, description: 'Budget adherence and cost optimization' },
      { kraCode: 'HR-001', name: 'Team Development', category: 'hr', weight: 10, description: 'Team building and employee development' },
      { kraCode: 'CUS-001', name: 'Customer Satisfaction', category: 'customer', weight: 10, description: 'Customer satisfaction and retention' }
    ]

    const kras = await KRA.insertMany(
      defaults.map(d => ({
        ...d,
        company: req.user.company,
        createdBy: req.user._id,
        isSystem: true
      }))
    )

    res.json({ success: true, message: `Created ${kras.length} default KRAs`, data: kras })
  } catch (error) {
    console.error('Error seeding KRAs:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
