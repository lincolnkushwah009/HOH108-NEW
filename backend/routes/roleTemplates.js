import express from 'express'
import RoleTemplate from '../models/RoleTemplate.js'
import { protect, setCompanyContext, requireModulePermission } from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('role_templates', 'view'))

// Get all role templates
router.get('/', async (req, res) => {
  try {
    const { search, department, level, isActive, page = 1, limit = 50 } = req.query

    const filter = { company: req.user.company }
    if (department) filter.department = department
    if (level) filter.level = level
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    let query = RoleTemplate.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    if (search) {
      query = query.where({
        $or: [
          { name: new RegExp(search, 'i') },
          { templateCode: new RegExp(search, 'i') }
        ]
      })
    }

    const templates = await query
    const total = await RoleTemplate.countDocuments(filter)

    // Stats
    const stats = await RoleTemplate.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
          totalAssigned: { $sum: '$assignedEmployees' }
        }
      }
    ])

    // Department breakdown
    const departmentStats = await RoleTemplate.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ])

    res.json({
      success: true,
      count: templates.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || { total: 0, active: 0, totalAssigned: 0 },
      departmentStats,
      data: templates
    })
  } catch (error) {
    console.error('Error fetching role templates:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single template
router.get('/:id', async (req, res) => {
  try {
    const template = await RoleTemplate.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .populate('createdBy', 'name')
      .populate('kras.kra', 'name kraCode')

    if (!template) {
      return res.status(404).json({ success: false, message: 'Role template not found' })
    }

    res.json({ success: true, data: template })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create template
router.post('/', async (req, res) => {
  try {
    const template = await RoleTemplate.create({
      ...req.body,
      company: req.user.company,
      createdBy: req.user._id
    })

    res.status(201).json({ success: true, data: template })
  } catch (error) {
    console.error('Error creating role template:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update template
router.put('/:id', async (req, res) => {
  try {
    const template = await RoleTemplate.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true, runValidators: true }
    )

    if (!template) {
      return res.status(404).json({ success: false, message: 'Role template not found' })
    }

    res.json({ success: true, data: template })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete template
router.delete('/:id', async (req, res) => {
  try {
    const template = await RoleTemplate.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    })

    if (!template) {
      return res.status(404).json({ success: false, message: 'Role template not found' })
    }

    res.json({ success: true, message: 'Role template deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Seed default templates
router.post('/seed-defaults', async (req, res) => {
  try {
    const existingCount = await RoleTemplate.countDocuments({ company: req.user.company })
    if (existingCount > 0) {
      return res.status(400).json({ success: false, message: 'Role templates already exist' })
    }

    const defaults = [
      { templateCode: 'SAL-001', name: 'Sales Executive', department: 'sales', level: 'junior', responsibilities: ['Lead generation', 'Client meetings', 'Proposal preparation'] },
      { templateCode: 'SAL-002', name: 'Sales Manager', department: 'sales', level: 'manager', responsibilities: ['Team management', 'Target setting', 'Key account management'] },
      { templateCode: 'OPS-001', name: 'Project Coordinator', department: 'operations', level: 'junior', responsibilities: ['Project scheduling', 'Resource coordination', 'Progress tracking'] },
      { templateCode: 'OPS-002', name: 'Project Manager', department: 'operations', level: 'manager', responsibilities: ['Project planning', 'Budget management', 'Stakeholder communication'] },
      { templateCode: 'DES-001', name: 'Interior Designer', department: 'design', level: 'mid', responsibilities: ['Design concepts', '3D modeling', 'Material selection'] },
      { templateCode: 'DES-002', name: 'Senior Designer', department: 'design', level: 'senior', responsibilities: ['Design direction', 'Client presentations', 'Team mentoring'] },
      { templateCode: 'PRD-001', name: 'Site Supervisor', department: 'production', level: 'mid', responsibilities: ['Site management', 'Quality control', 'Vendor coordination'] },
      { templateCode: 'FIN-001', name: 'Accountant', department: 'finance', level: 'mid', responsibilities: ['Financial records', 'Invoicing', 'Expense management'] }
    ]

    const templates = await RoleTemplate.insertMany(
      defaults.map(d => ({
        ...d,
        company: req.user.company,
        createdBy: req.user._id,
        isSystem: true
      }))
    )

    res.json({ success: true, message: `Created ${templates.length} default templates`, data: templates })
  } catch (error) {
    console.error('Error seeding role templates:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
