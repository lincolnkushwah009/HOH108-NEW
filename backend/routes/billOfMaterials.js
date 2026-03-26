import express from 'express'
import BillOfMaterials from '../models/BillOfMaterials.js'
import Material from '../models/Material.js'
import Project from '../models/Project.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('bill_of_materials', 'view'))

// Get all BOMs
router.get('/', async (req, res) => {
  try {
    const {
      status,
      project,
      bomType,
      category,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) {
      if (status.includes(',')) {
        queryFilter.status = { $in: status.split(',') }
      } else {
        queryFilter.status = status
      }
    }
    if (project) queryFilter.project = project
    if (bomType) queryFilter.bomType = bomType
    if (category) queryFilter['product.category'] = category
    if (search) {
      queryFilter.$or = [
        { bomId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } }
      ]
    }

    const total = await BillOfMaterials.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const boms = await BillOfMaterials.find(queryFilter)
      .populate('project', 'title projectId')
      .populate('designIteration', 'iterationNumber')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await BillOfMaterials.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      data: boms,
      stats,
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

// Get single BOM
router.get('/:id', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('project', 'title projectId client')
      .populate('designIteration', 'iterationNumber designName')
      .populate('items.material', 'skuCode materialName unit unitPrice leadTime stockQuantity')
      .populate('items.preferredVendor', 'name vendorId')
      .populate('createdBy', 'name')
      .populate('approval.approvedBy', 'name')
      .populate('changeHistory.changedBy', 'name')

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' })
    }

    res.json({ success: true, data: bom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create BOM
router.post('/', async (req, res) => {
  try {
    const bom = new BillOfMaterials({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id
    })

    // If project is provided, get project name
    if (req.body.project) {
      const project = await Project.findById(req.body.project)
      if (project) {
        bom.projectName = project.title
      }
    }

    // Populate material details for each item
    if (req.body.items && req.body.items.length > 0) {
      for (let item of bom.items) {
        if (item.material) {
          const material = await Material.findById(item.material)
          if (material) {
            item.materialDetails = {
              skuCode: material.skuCode,
              name: material.materialName,
              description: material.description,
              category: material.category,
              unit: material.unit
            }
            item.unit = material.unit
            if (!item.unitCost) {
              item.unitCost = material.unitPrice || 0
            }
          }
        }
      }
    }

    await bom.save()

    const populatedBom = await BillOfMaterials.findById(bom._id)
      .populate('project', 'title projectId')
      .populate('items.material', 'skuCode materialName')

    res.status(201).json({ success: true, data: populatedBom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update BOM
router.put('/:id', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' })
    }

    // Only allow updates to draft and pending_approval BOMs
    if (!['draft', 'pending_approval'].includes(bom.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update BOM in current status. Create a new version instead.'
      })
    }

    // Update material details if items changed
    if (req.body.items && req.body.items.length > 0) {
      for (let item of req.body.items) {
        if (item.material) {
          const material = await Material.findById(item.material)
          if (material) {
            item.materialDetails = {
              skuCode: material.skuCode,
              name: material.materialName,
              description: material.description,
              category: material.category,
              unit: material.unit
            }
            item.unit = material.unit
            if (!item.unitCost) {
              item.unitCost = material.unitPrice || 0
            }
          }
        }
      }
    }

    Object.assign(bom, req.body)
    bom.lastModifiedBy = req.user._id

    await bom.save()

    res.json({ success: true, data: bom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Submit for approval
router.put('/:id/submit', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found or not in draft status' })
    }

    if (!bom.items || bom.items.length === 0) {
      return res.status(400).json({ success: false, message: 'BOM must have at least one item' })
    }

    bom.status = 'pending_approval'
    bom.approval.submittedBy = req.user._id
    bom.approval.submittedAt = new Date()

    await bom.save()

    res.json({ success: true, data: bom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve BOM
router.put('/:id/approve', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'pending_approval'
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found or not pending approval' })
    }

    await bom.approve(req.user._id, req.user.name)

    res.json({ success: true, data: bom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reject BOM
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' })
    }

    const bom = await BillOfMaterials.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'pending_approval'
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found or not pending approval' })
    }

    bom.status = 'draft'
    bom.approval.rejectedBy = req.user._id
    bom.approval.rejectedAt = new Date()
    bom.approval.rejectionReason = reason

    await bom.save()

    res.json({ success: true, data: bom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Activate BOM
router.put('/:id/activate', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'approved'
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found or not approved' })
    }

    bom.status = 'active'
    bom.effectiveDate = new Date()

    await bom.save()

    res.json({ success: true, data: bom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create new version
router.post('/:id/new-version', async (req, res) => {
  try {
    const { changeDescription } = req.body

    const bom = await BillOfMaterials.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' })
    }

    await bom.createNewVersion(req.user._id, req.user.name, changeDescription || 'New version created')

    res.json({ success: true, data: bom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Copy BOM
router.post('/:id/copy', async (req, res) => {
  try {
    const { project } = req.body

    const newBom = await BillOfMaterials.copyBOM(
      req.params.id,
      project,
      req.user._id
    )

    const populatedBom = await BillOfMaterials.findById(newBom._id)
      .populate('project', 'title projectId')

    res.status(201).json({ success: true, data: populatedBom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add item to BOM
router.post('/:id/items', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' })
    }

    if (!['draft', 'pending_approval'].includes(bom.status)) {
      return res.status(400).json({ success: false, message: 'Cannot modify BOM in current status' })
    }

    const newItem = req.body

    // Get material details
    if (newItem.material) {
      const material = await Material.findById(newItem.material)
      if (material) {
        newItem.materialDetails = {
          skuCode: material.skuCode,
          name: material.materialName,
          description: material.description,
          category: material.category,
          unit: material.unit
        }
        newItem.unit = material.unit
        if (!newItem.unitCost) {
          newItem.unitCost = material.unitPrice || 0
        }
      }
    }

    // Auto-assign item number
    newItem.itemNumber = (bom.items.length > 0)
      ? Math.max(...bom.items.map(i => i.itemNumber)) + 1
      : 1

    bom.items.push(newItem)
    bom.lastModifiedBy = req.user._id

    await bom.save()

    res.json({ success: true, data: bom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update item in BOM
router.put('/:id/items/:itemIndex', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' })
    }

    if (!['draft', 'pending_approval'].includes(bom.status)) {
      return res.status(400).json({ success: false, message: 'Cannot modify BOM in current status' })
    }

    const itemIndex = parseInt(req.params.itemIndex)
    if (itemIndex < 0 || itemIndex >= bom.items.length) {
      return res.status(404).json({ success: false, message: 'Item not found' })
    }

    Object.assign(bom.items[itemIndex], req.body)
    bom.lastModifiedBy = req.user._id

    await bom.save()

    res.json({ success: true, data: bom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Remove item from BOM
router.delete('/:id/items/:itemIndex', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found' })
    }

    if (!['draft', 'pending_approval'].includes(bom.status)) {
      return res.status(400).json({ success: false, message: 'Cannot modify BOM in current status' })
    }

    const itemIndex = parseInt(req.params.itemIndex)
    if (itemIndex < 0 || itemIndex >= bom.items.length) {
      return res.status(404).json({ success: false, message: 'Item not found' })
    }

    bom.items.splice(itemIndex, 1)
    bom.lastModifiedBy = req.user._id

    await bom.save()

    res.json({ success: true, data: bom })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get BOMs by project
router.get('/project/:projectId', async (req, res) => {
  try {
    const boms = await BillOfMaterials.find({
      project: req.params.projectId,
      company: req.activeCompany._id
    })
      .populate('items.material', 'skuCode materialName')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: boms })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get BOM templates
router.get('/templates/list', async (req, res) => {
  try {
    const templates = await BillOfMaterials.find({
      company: req.activeCompany._id,
      bomType: 'template',
      status: { $in: ['approved', 'active'] }
    })
      .select('bomId name product.category costSummary')
      .sort({ name: 1 })

    res.json({ success: true, data: templates })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete BOM (only drafts)
router.delete('/:id', async (req, res) => {
  try {
    const bom = await BillOfMaterials.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!bom) {
      return res.status(404).json({ success: false, message: 'BOM not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'BOM deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
