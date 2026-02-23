import express from 'express'
import MaterialPricelist from '../models/MaterialPricelist.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// Get all materials with filtering
router.get('/', async (req, res) => {
  try {
    const {
      materialType,
      category,
      brand,
      status,
      search,
      page = 1,
      limit = 50,
      sortBy = 'materialType',
      sortOrder = 'asc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (materialType) queryFilter.materialType = materialType
    if (category) queryFilter.category = { $regex: category, $options: 'i' }
    if (brand) queryFilter.brand = { $regex: brand, $options: 'i' }
    if (status) queryFilter.status = status
    if (search) {
      queryFilter.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { subCategory: { $regex: search, $options: 'i' } },
        { specification: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await MaterialPricelist.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const materials = await MaterialPricelist.find(queryFilter)
      .populate('preferredVendors.vendor', 'name vendorId')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: materials,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get material types summary (for dashboard/filters)
router.get('/summary', async (req, res) => {
  try {
    const queryFilter = companyScopedQuery(req)

    const summary = await MaterialPricelist.aggregate([
      { $match: queryFilter },
      {
        $group: {
          _id: '$materialType',
          count: { $sum: 1 },
          avgPrice: { $avg: '$currentPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({ success: true, data: summary })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single material
router.get('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id }
    if (req.activeCompany?._id) {
      query.company = req.activeCompany._id
    }

    const material = await MaterialPricelist.findOne(query)
      .populate('preferredVendors.vendor', 'name vendorId phone email')
      .populate('createdBy', 'name')
      .populate('lastUpdatedBy', 'name')

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
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to create a material'
      })
    }

    const material = await MaterialPricelist.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id
    })

    res.status(201).json({ success: true, data: material })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update material (and track price history)
router.put('/:id', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to update a material'
      })
    }

    const material = await MaterialPricelist.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    // Update fields
    Object.assign(material, req.body)
    material.lastUpdatedBy = req.user._id
    await material.save()

    res.json({ success: true, data: material })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update price only (with history tracking)
router.put('/:id/price', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company'
      })
    }

    const { currentPrice, currentPriceMax, remarks } = req.body

    if (!currentPrice) {
      return res.status(400).json({
        success: false,
        message: 'Current price is required'
      })
    }

    const material = await MaterialPricelist.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    // Add to price history before updating
    material.priceHistory.push({
      price: material.currentPrice,
      priceMax: material.currentPriceMax,
      effectiveDate: material.updatedAt,
      updatedBy: material.lastUpdatedBy,
      remarks: 'Previous price'
    })

    material.currentPrice = currentPrice
    material.currentPriceMax = currentPriceMax
    material.priceType = currentPriceMax ? 'range' : 'fixed'
    material.lastUpdatedBy = req.user._id
    material.remarks = remarks || material.remarks

    await material.save()

    res.json({ success: true, data: material, message: 'Price updated successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add preferred vendor to material
router.post('/:id/vendors', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company'
      })
    }

    const { vendor, vendorPrice, remarks } = req.body

    const material = await MaterialPricelist.findOneAndUpdate(
      { _id: req.params.id, company: req.activeCompany._id },
      {
        $push: {
          preferredVendors: { vendor, vendorPrice, remarks }
        },
        lastUpdatedBy: req.user._id
      },
      { new: true }
    ).populate('preferredVendors.vendor', 'name vendorId')

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    res.json({ success: true, data: material })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Remove preferred vendor from material
router.delete('/:id/vendors/:vendorEntryId', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company'
      })
    }

    const material = await MaterialPricelist.findOneAndUpdate(
      { _id: req.params.id, company: req.activeCompany._id },
      {
        $pull: {
          preferredVendors: { _id: req.params.vendorEntryId }
        },
        lastUpdatedBy: req.user._id
      },
      { new: true }
    )

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    res.json({ success: true, message: 'Vendor removed from material' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete material
router.delete('/:id', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to delete a material'
      })
    }

    const material = await MaterialPricelist.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    res.json({ success: true, message: 'Material deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
