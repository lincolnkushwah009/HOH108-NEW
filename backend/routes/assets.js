import express from 'express'
import Asset from '../models/Asset.js'
import { protect, setCompanyContext, requireModulePermission } from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('asset_management', 'view'))

// Get all assets
router.get('/', async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 50 } = req.query

    const filter = { company: req.user.company }
    if (category) filter.category = category
    if (status) filter.status = status

    let query = Asset.find(filter)
      .populate('assignedTo', 'name email')
      .populate('vendor', 'name vendorId')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))

    if (search) {
      query = query.where({
        $or: [
          { assetName: new RegExp(search, 'i') },
          { assetCode: new RegExp(search, 'i') },
          { serialNumber: new RegExp(search, 'i') }
        ]
      })
    }

    const assets = await query
    const total = await Asset.countDocuments(filter)

    // Stats
    const stats = await Asset.aggregate([
      { $match: { company: req.user.company._id || req.user.company } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalValue: { $sum: '$currentValue' },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } }
        }
      }
    ])

    res.json({
      success: true,
      count: assets.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      stats: stats[0] || { total: 0, totalValue: 0, active: 0, maintenance: 0 },
      data: assets
    })
  } catch (error) {
    console.error('Error fetching assets:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single asset
router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findOne({
      _id: req.params.id,
      company: req.user.company
    })
      .populate('assignedTo', 'name email')
      .populate('vendor', 'name vendorId')
      .populate('createdBy', 'name')

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' })
    }

    res.json({ success: true, data: asset })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create asset
router.post('/', async (req, res) => {
  try {
    const { assetCode, ...body } = req.body
    const asset = await Asset.create({
      ...body,
      company: req.user.company,
      createdBy: req.user._id
    })

    res.status(201).json({ success: true, data: asset })
  } catch (error) {
    console.error('Error creating asset:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update asset
router.put('/:id', async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      req.body,
      { new: true, runValidators: true }
    )

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' })
    }

    res.json({ success: true, data: asset })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete asset
router.delete('/:id', async (req, res) => {
  try {
    const asset = await Asset.findOneAndDelete({
      _id: req.params.id,
      company: req.user.company
    })

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' })
    }

    res.json({ success: true, message: 'Asset deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add maintenance record
router.post('/:id/maintenance', async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company },
      { $push: { maintenanceHistory: { ...req.body, date: new Date() } } },
      { new: true }
    )

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' })
    }

    res.json({ success: true, data: asset })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Bulk upload assets
router.post('/bulk-upload', async (req, res) => {
  try {
    const { assets: assetRows } = req.body

    if (!assetRows || !Array.isArray(assetRows) || assetRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No assets data provided' })
    }

    if (assetRows.length > 500) {
      return res.status(400).json({ success: false, message: 'Maximum 500 assets per upload' })
    }

    const results = { successful: 0, failed: 0, errors: [] }
    const createdAssets = []

    // Column name mapping (lowercase CSV header → model field)
    const columnMap = {
      assetname: 'assetName', asset_name: 'assetName', 'asset name': 'assetName', name: 'assetName',
      assetcode: 'assetCode', asset_code: 'assetCode', 'asset code': 'assetCode', code: 'assetCode',
      category: 'category',
      description: 'description',
      serialnumber: 'serialNumber', serial_number: 'serialNumber', 'serial number': 'serialNumber', serial: 'serialNumber',
      purchasedate: 'purchaseDate', purchase_date: 'purchaseDate', 'purchase date': 'purchaseDate',
      purchaseprice: 'purchasePrice', purchase_price: 'purchasePrice', 'purchase price': 'purchasePrice', price: 'purchasePrice', cost: 'purchasePrice',
      currentvalue: 'currentValue', current_value: 'currentValue', 'current value': 'currentValue',
      depreciationmethod: 'depreciationMethod', depreciation_method: 'depreciationMethod', depreciation: 'depreciationMethod',
      usefullife: 'usefulLife', useful_life: 'usefulLife', 'useful life': 'usefulLife',
      salvagevalue: 'salvageValue', salvage_value: 'salvageValue', 'salvage value': 'salvageValue',
      location: 'location',
      department: 'department',
      status: 'status',
      warrantyProvider: 'warranty.provider', warranty_provider: 'warranty.provider', 'warranty provider': 'warranty.provider',
      warrantyexpiry: 'warranty.expiryDate', warranty_expiry: 'warranty.expiryDate', 'warranty expiry': 'warranty.expiryDate',
      warrantyterms: 'warranty.terms', warranty_terms: 'warranty.terms', 'warranty terms': 'warranty.terms',
      notes: 'notes',
      brand: 'brand',
      model: 'model',
      condition: 'condition',
    }

    // Valid enums
    const validCategories = ['furniture', 'equipment', 'vehicle', 'computer', 'machinery', 'building', 'land', 'other']
    const validStatuses = ['active', 'maintenance', 'retired', 'disposed', 'lost']
    const validDepreciation = ['straight_line', 'declining_balance', 'none']

    for (let i = 0; i < assetRows.length; i++) {
      const row = assetRows[i]

      // Normalize column names
      const normalized = {}
      for (const [key, value] of Object.entries(row)) {
        const mappedKey = columnMap[key.toLowerCase().trim()] || key
        if (mappedKey.includes('.')) {
          const [parent, child] = mappedKey.split('.')
          if (!normalized[parent]) normalized[parent] = {}
          normalized[parent][child] = value
        } else {
          normalized[mappedKey] = value
        }
      }

      // Validate required fields
      if (!normalized.assetName) {
        results.failed++
        results.errors.push({ row: i + 1, data: row, error: 'Asset Name is required' })
        continue
      }

      try {
        // Normalize category
        let category = (normalized.category || 'equipment').toLowerCase().trim()
        if (!validCategories.includes(category)) {
          // Try mapping common names
          const catMap = { laptop: 'computer', desktop: 'computer', mobile: 'computer', tablet: 'computer', phone: 'computer', printer: 'equipment', monitor: 'equipment' }
          category = catMap[category] || 'other'
        }

        // Normalize status
        let status = (normalized.status || 'active').toLowerCase().trim()
        if (!validStatuses.includes(status)) {
          const statusMap = { available: 'active', assigned: 'active', 'under maintenance': 'maintenance' }
          status = statusMap[status] || 'active'
        }

        // Normalize depreciation
        let depMethod = (normalized.depreciationMethod || 'straight_line').toLowerCase().trim().replace(/ /g, '_')
        if (!validDepreciation.includes(depMethod)) depMethod = 'straight_line'

        const assetData = {
          company: req.user.company,
          assetName: normalized.assetName,
          category,
          description: normalized.description || '',
          serialNumber: normalized.serialNumber || '',
          purchaseDate: normalized.purchaseDate ? new Date(normalized.purchaseDate) : undefined,
          purchasePrice: parseFloat(normalized.purchasePrice) || 0,
          currentValue: parseFloat(normalized.currentValue) || parseFloat(normalized.purchasePrice) || 0,
          depreciationMethod: depMethod,
          usefulLife: parseInt(normalized.usefulLife) || 5,
          salvageValue: parseFloat(normalized.salvageValue) || 0,
          location: normalized.location || '',
          department: normalized.department || '',
          status,
          notes: normalized.notes || '',
          createdBy: req.user._id,
        }

        // Asset code is always auto-generated from company name

        // Warranty
        if (normalized.warranty && typeof normalized.warranty === 'object') {
          assetData.warranty = {
            provider: normalized.warranty.provider || '',
            expiryDate: normalized.warranty.expiryDate ? new Date(normalized.warranty.expiryDate) : undefined,
            terms: normalized.warranty.terms || '',
          }
        }

        const newAsset = await Asset.create(assetData)
        createdAssets.push(newAsset)
        results.successful++
      } catch (error) {
        results.failed++
        results.errors.push({ row: i + 1, data: row, error: error.message })
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk upload completed: ${results.successful} assets created, ${results.failed} failed`,
      data: {
        total: assetRows.length,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
        createdAssets,
      }
    })
  } catch (error) {
    console.error('Error in asset bulk upload:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
