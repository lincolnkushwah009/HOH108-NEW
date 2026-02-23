import express from 'express'
import Material from '../models/Material.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

router.use(protect)

// Get all materials
router.get('/', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50, isActive } = req.query

    const filter = { company: req.user.company }
    if (category) filter.category = category
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    let query = Material.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    if (search) {
      query = query.where({
        $or: [
          { materialName: new RegExp(search, 'i') },
          { skuCode: new RegExp(search, 'i') }
        ]
      })
    }

    const materials = await query
    const total = await Material.countDocuments(filter)

    // Stats by category
    const stats = await Material.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])

    res.json({
      success: true,
      count: materials.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats,
      data: materials
    })
  } catch (error) {
    console.error('Error fetching materials:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single material
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findOne({
      _id: req.params.id,
      company: req.user.company
    }).populate('preferredVendors', 'name vendorId')

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    res.json({ success: true, data: material })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create material
router.post('/', async (req, res) => {
  try {
    const material = await Material.create({
      ...req.body,
      company: req.user.company,
      createdBy: req.user._id
    })

    res.status(201).json({ success: true, data: material })
  } catch (error) {
    console.error('Error creating material:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update material
router.put('/:id', async (req, res) => {
  try {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true, runValidators: true }
    )

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    res.json({ success: true, data: material })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete material
router.delete('/:id', async (req, res) => {
  try {
    const material = await Material.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    })

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    res.json({ success: true, message: 'Material deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = ['raw_material', 'hardware', 'fabric', 'wood', 'glass', 'metal', 'electrical', 'plumbing', 'paint', 'adhesive', 'other']
    res.json({ success: true, data: categories })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
