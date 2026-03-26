import express from 'express'
import Stock from '../models/Stock.js'
import Material from '../models/Material.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission
} from '../middleware/rbac.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('stock_management', 'view'))

// Get all stock with filters
router.get('/', async (req, res) => {
  try {
    const { search, warehouse, status, page = 1, limit = 50 } = req.query

    const filter = { company: req.user.company }

    if (warehouse) filter.warehouse = warehouse
    if (status) {
      switch (status) {
        case 'low':
          filter.$expr = { $lte: ['$currentStock', '$reorderLevel'] }
          filter.currentStock = { $gt: 0 }
          break
        case 'out':
          filter.currentStock = 0
          break
        case 'healthy':
          filter.$expr = { $gt: ['$currentStock', '$reorderLevel'] }
          break
      }
    }

    let query = Stock.find(filter)
      .populate('material', 'skuCode materialName unit category unitPrice')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    let stocks = await query

    // Apply search filter on populated material
    if (search) {
      stocks = stocks.filter(s =>
        s.material?.materialName?.toLowerCase().includes(search.toLowerCase()) ||
        s.material?.skuCode?.toLowerCase().includes(search.toLowerCase())
      )
    }

    const total = await Stock.countDocuments(filter)

    // Calculate stats
    const allStocks = await Stock.find({ company: req.user.company })
    const stats = {
      totalSKUs: allStocks.length,
      totalValue: allStocks.reduce((sum, s) => sum + (s.stockValue || 0), 0),
      lowStock: allStocks.filter(s => s.currentStock > 0 && s.currentStock <= s.reorderLevel).length,
      outOfStock: allStocks.filter(s => s.currentStock === 0).length
    }

    // Get warehouse breakdown
    const warehouseStats = await Stock.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      {
        $group: {
          _id: '$warehouse',
          totalValue: { $sum: '$stockValue' },
          itemCount: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      count: stocks.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats,
      warehouseStats,
      data: stocks
    })
  } catch (error) {
    console.error('Error fetching stock:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single stock entry
router.get('/:id', async (req, res) => {
  try {
    const stock = await Stock.findOne({
      _id: req.params.id,
      company: req.user.company
    }).populate('material')

    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' })
    }

    res.json({ success: true, data: stock })
  } catch (error) {
    console.error('Error fetching stock:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create/update stock entry
router.post('/', async (req, res) => {
  try {
    const { material, warehouse, currentStock, reorderLevel, maxStock, unitPrice, location } = req.body

    // Check if stock entry already exists
    let stock = await Stock.findOne({
      company: req.user.company,
      material,
      warehouse: warehouse || 'Main Warehouse'
    })

    if (stock) {
      // Update existing
      stock.currentStock = currentStock ?? stock.currentStock
      stock.reorderLevel = reorderLevel ?? stock.reorderLevel
      stock.maxStock = maxStock ?? stock.maxStock
      stock.unitPrice = unitPrice ?? stock.unitPrice
      stock.location = location ?? stock.location
      await stock.save()
    } else {
      // Create new
      stock = await Stock.create({
        company: req.user.company,
        material,
        warehouse: warehouse || 'Main Warehouse',
        currentStock: currentStock || 0,
        reorderLevel: reorderLevel || 10,
        maxStock: maxStock || 1000,
        unitPrice: unitPrice || 0,
        location
      })
    }

    await stock.populate('material', 'skuCode materialName unit')

    res.status(201).json({
      success: true,
      data: stock
    })
  } catch (error) {
    console.error('Error creating stock:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Adjust stock quantity
router.put('/:id/adjust', async (req, res) => {
  try {
    const { adjustment, reason, reference } = req.body

    const stock = await Stock.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' })
    }

    const newQuantity = stock.currentStock + adjustment
    if (newQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' })
    }

    stock.currentStock = newQuantity

    if (adjustment > 0) {
      stock.lastReceived = {
        date: new Date(),
        quantity: adjustment,
        reference: reference || reason
      }
    } else {
      stock.lastIssued = {
        date: new Date(),
        quantity: Math.abs(adjustment),
        reference: reference || reason
      }
    }

    await stock.save()
    await stock.populate('material', 'skuCode materialName unit')

    res.json({ success: true, data: stock })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reserve stock
router.put('/:id/reserve', async (req, res) => {
  try {
    const { quantity, reference } = req.body

    const stock = await Stock.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' })
    }

    if (stock.availableStock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient available stock' })
    }

    stock.reservedStock += quantity
    await stock.save()

    res.json({ success: true, data: stock })
  } catch (error) {
    console.error('Error reserving stock:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Release reservation
router.put('/:id/release', async (req, res) => {
  try {
    const { quantity } = req.body

    const stock = await Stock.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' })
    }

    stock.reservedStock = Math.max(0, stock.reservedStock - quantity)
    await stock.save()

    res.json({ success: true, data: stock })
  } catch (error) {
    console.error('Error releasing reservation:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update stock settings
router.put('/:id', async (req, res) => {
  try {
    const { reorderLevel, maxStock, unitPrice, location, warehouse } = req.body

    const stock = await Stock.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      { reorderLevel, maxStock, unitPrice, location, warehouse },
      { new: true }
    ).populate('material', 'skuCode materialName unit')

    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' })
    }

    res.json({ success: true, data: stock })
  } catch (error) {
    console.error('Error updating stock:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete stock entry
router.delete('/:id', async (req, res) => {
  try {
    const stock = await Stock.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    })

    if (!stock) {
      return res.status(404).json({ success: false, message: 'Stock not found' })
    }

    res.json({ success: true, message: 'Stock entry deleted' })
  } catch (error) {
    console.error('Error deleting stock:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get warehouses list
router.get('/meta/warehouses', async (req, res) => {
  try {
    const warehouses = await Stock.distinct('warehouse', { company: req.user.company })
    res.json({
      success: true,
      data: warehouses.length > 0 ? warehouses : ['Main Warehouse', 'Warehouse A', 'Warehouse B']
    })
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
