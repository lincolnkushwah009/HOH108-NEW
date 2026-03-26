import express from 'express'
import StockMovement from '../models/StockMovement.js'
import Stock from '../models/Stock.js'
import Material from '../models/Material.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('stock_movements', 'view'))

// Get all stock movements
router.get('/', async (req, res) => {
  try {
    const { search, movementType, startDate, endDate, page = 1, limit = 50 } = req.query

    const filter = { company: req.user.company }
    if (movementType) filter.movementType = movementType
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    let query = StockMovement.find(filter)
      .populate('material', 'materialName skuCode unit')
      .populate('createdBy', 'name')
      .populate('project', 'name projectId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    const movements = await query
    const total = await StockMovement.countDocuments(filter)

    // Stats
    const stats = await StockMovement.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      { $group: { _id: '$movementType', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } }
    ])

    res.json({
      success: true,
      count: movements.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats,
      data: movements
    })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single movement
router.get('/:id', async (req, res) => {
  try {
    const movement = await StockMovement.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .populate('material', 'materialName skuCode unit')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .populate('project', 'name projectId')

    if (!movement) {
      return res.status(404).json({ success: false, message: 'Movement not found' })
    }

    res.json({ success: true, data: movement })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create stock movement
router.post('/', async (req, res) => {
  try {
    const movement = await StockMovement.create({
      ...req.body,
      company: req.user.company,
      createdBy: req.user._id
    })

    // Update stock levels based on movement type
    if (movement.status === 'completed') {
      await updateStockLevels(movement)
    }

    res.status(201).json({ success: true, data: movement })
  } catch (error) {
    console.error('Error creating stock movement:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update stock movement
router.put('/:id', async (req, res) => {
  try {
    const movement = await StockMovement.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true, runValidators: true }
    )

    if (!movement) {
      return res.status(404).json({ success: false, message: 'Movement not found' })
    }

    res.json({ success: true, data: movement })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete stock movement
router.delete('/:id', async (req, res) => {
  try {
    const movement = await StockMovement.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    })

    if (!movement) {
      return res.status(404).json({ success: false, message: 'Movement not found' })
    }

    res.json({ success: true, message: 'Movement deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Helper function to update stock levels
async function updateStockLevels(movement) {
  const { material, movementType, quantity, fromWarehouse, toWarehouse } = movement

  if (movementType === 'receipt') {
    // Increase stock at toWarehouse
    await Stock.findOneAndUpdate(
      { material, warehouse: toWarehouse || 'Main' },
      { $inc: { currentStock: quantity } },
      { upsert: true }
    )
  } else if (movementType === 'issue') {
    // Decrease stock at fromWarehouse
    await Stock.findOneAndUpdate(
      { material, warehouse: fromWarehouse || 'Main' },
      { $inc: { currentStock: -quantity } }
    )
  } else if (movementType === 'transfer') {
    // Decrease from source, increase at destination
    await Stock.findOneAndUpdate(
      { material, warehouse: fromWarehouse },
      { $inc: { currentStock: -quantity } }
    )
    await Stock.findOneAndUpdate(
      { material, warehouse: toWarehouse },
      { $inc: { currentStock: quantity } },
      { upsert: true }
    )
  }
}

export default router
