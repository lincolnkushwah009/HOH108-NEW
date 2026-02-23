import express from 'express'
import ProcessConfiguration from '../models/ProcessConfiguration.js'
import { protect, setCompanyContext, companyScopedQuery, requirePermission, PERMISSIONS } from '../middleware/rbac.js'

const router = express.Router()

// All routes require auth + company context
router.use(protect, setCompanyContext)

// ─── Seed default hierarchy ─────────────────────────────────────────────────
// POST /seed-defaults  (must be before /:id to avoid param conflict)
router.post('/seed-defaults', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const userId = req.user._id

    const created = await ProcessConfiguration.createDefaultHierarchy(companyId, userId)

    res.status(201).json({
      success: true,
      message: `Seeded ${created.length} process configuration nodes`,
      data: created
    })
  } catch (error) {
    console.error('Error seeding default hierarchy:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Get full hierarchy tree ────────────────────────────────────────────────
// GET /tree
router.get('/tree', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const tree = await ProcessConfiguration.getTree(companyId)

    res.json({
      success: true,
      count: tree.length,
      data: tree
    })
  } catch (error) {
    console.error('Error fetching process tree:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Get subtree from a node ────────────────────────────────────────────────
// GET /tree/:nodeId
router.get('/tree/:nodeId', async (req, res) => {
  try {
    const subtree = await ProcessConfiguration.getSubtree(req.params.nodeId)

    if (!subtree) {
      return res.status(404).json({ success: false, message: 'Node not found' })
    }

    res.json({
      success: true,
      count: subtree.length,
      data: subtree
    })
  } catch (error) {
    console.error('Error fetching subtree:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Get KRA/KPI mapping for a node ────────────────────────────────────────
// GET /:id/kra-kpi  (must be before generic /:id)
router.get('/:id/kra-kpi', async (req, res) => {
  try {
    const node = await ProcessConfiguration.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })
      .populate('kra', 'name kraCode category weight description')
      .populate('kpis', 'name configId unit targetValue')

    if (!node) {
      return res.status(404).json({ success: false, message: 'Node not found' })
    }

    res.json({
      success: true,
      data: {
        _id: node._id,
        code: node.code,
        name: node.name,
        level: node.level,
        kra: node.kra || null,
        kpis: node.kpis || []
      }
    })
  } catch (error) {
    console.error('Error fetching KRA/KPI mapping:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Update KRA/KPI mapping for a node ─────────────────────────────────────
// PUT /:id/kra-kpi
router.put('/:id/kra-kpi', async (req, res) => {
  try {
    const { kra, kpis } = req.body

    const node = await ProcessConfiguration.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!node) {
      return res.status(404).json({ success: false, message: 'Node not found' })
    }

    if (kra !== undefined) node.kra = kra
    if (kpis !== undefined) node.kpis = kpis

    await node.save()

    // Re-fetch with populated fields
    const updated = await ProcessConfiguration.findById(node._id)
      .populate('kra', 'name kraCode category weight description')
      .populate('kpis', 'name configId unit targetValue')

    res.json({
      success: true,
      data: {
        _id: updated._id,
        code: updated.code,
        name: updated.name,
        level: updated.level,
        kra: updated.kra || null,
        kpis: updated.kpis || []
      }
    })
  } catch (error) {
    console.error('Error updating KRA/KPI mapping:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Reorder a node ─────────────────────────────────────────────────────────
// PUT /:id/reorder
router.put('/:id/reorder', async (req, res) => {
  try {
    const { order } = req.body

    if (order === undefined || order === null) {
      return res.status(400).json({ success: false, message: 'Order value is required' })
    }

    const node = await ProcessConfiguration.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!node) {
      return res.status(404).json({ success: false, message: 'Node not found' })
    }

    node.order = order
    await node.save()

    res.json({
      success: true,
      data: node
    })
  } catch (error) {
    console.error('Error reordering node:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Move node to a different parent ────────────────────────────────────────
// PUT /:id/move
router.put('/:id/move', async (req, res) => {
  try {
    const { parentNode, order } = req.body
    const companyId = req.activeCompany._id

    const node = await ProcessConfiguration.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!node) {
      return res.status(404).json({ success: false, message: 'Node not found' })
    }

    // Validate new parent exists and belongs to same company (if not moving to root)
    if (parentNode) {
      const parent = await ProcessConfiguration.findOne({
        _id: parentNode,
        company: companyId
      })

      if (!parent) {
        return res.status(404).json({ success: false, message: 'Target parent node not found' })
      }

      // Prevent moving a node under itself or its own descendant
      const nodePathPrefix = node.path ? `${node.path}/${node._id}` : `/${node._id}`
      if (parent.path && parent.path.startsWith(nodePathPrefix)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot move a node under its own descendant'
        })
      }

      if (parent._id.toString() === node._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot move a node under itself'
        })
      }
    }

    // Update parentNode (path and depth are recalculated by pre-save hook)
    node.parentNode = parentNode || null
    if (order !== undefined) node.order = order

    await node.save()

    // Also update all descendants' paths
    const oldPathPrefix = node.path ? `${node.path}/${node._id}` : `/${node._id}`
    const descendants = await ProcessConfiguration.find({
      company: companyId,
      path: new RegExp(`^${oldPathPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
    })

    for (const desc of descendants) {
      // Re-save each descendant to trigger path recalculation
      desc.parentNode = desc.parentNode // Mark as modified
      desc.markModified('parentNode')
      await desc.save()
    }

    res.json({
      success: true,
      message: 'Node moved successfully',
      data: node
    })
  } catch (error) {
    console.error('Error moving node:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Get single node ────────────────────────────────────────────────────────
// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const node = await ProcessConfiguration.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })
      .populate('departments', 'name')
      .populate('kra', 'name kraCode')
      .populate('kpis', 'name configId')
      .populate('createdBy', 'name')

    if (!node) {
      return res.status(404).json({ success: false, message: 'Node not found' })
    }

    // Get ancestors (breadcrumb path)
    const ancestors = await ProcessConfiguration.getAncestors(node._id)

    // Get direct children
    const children = await ProcessConfiguration.find({
      company: req.activeCompany._id,
      parentNode: node._id,
      isActive: true
    }).sort({ order: 1 }).lean()

    res.json({
      success: true,
      data: {
        ...node.toObject(),
        ancestors,
        children
      }
    })
  } catch (error) {
    console.error('Error fetching node:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Create node ────────────────────────────────────────────────────────────
// POST /
router.post('/', async (req, res) => {
  try {
    const { code, name, description, level, parentNode, order, departments, icon, color, legacyMapping } = req.body
    const companyId = req.activeCompany._id

    // Validate parent exists if provided
    if (parentNode) {
      const parent = await ProcessConfiguration.findOne({
        _id: parentNode,
        company: companyId
      })

      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent node not found' })
      }
    }

    // Check for duplicate code within the company
    const existing = await ProcessConfiguration.findOne({
      company: companyId,
      code
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A node with code "${code}" already exists`
      })
    }

    const node = await ProcessConfiguration.create({
      company: companyId,
      code,
      name,
      description: description || '',
      level,
      parentNode: parentNode || null,
      order: order || 0,
      departments: departments || [],
      icon: icon || '',
      color: color || '',
      legacyMapping: legacyMapping || {},
      isSystem: false,
      isActive: true,
      createdBy: req.user._id
    })

    res.status(201).json({
      success: true,
      data: node
    })
  } catch (error) {
    console.error('Error creating node:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Update node ────────────────────────────────────────────────────────────
// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const node = await ProcessConfiguration.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!node) {
      return res.status(404).json({ success: false, message: 'Node not found' })
    }

    const { code, name, description, level, order, departments, icon, color, legacyMapping, isActive } = req.body

    // Check for duplicate code if code is being changed
    if (code && code !== node.code) {
      const existing = await ProcessConfiguration.findOne({
        company: req.activeCompany._id,
        code,
        _id: { $ne: node._id }
      })

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `A node with code "${code}" already exists`
        })
      }
      node.code = code
    }

    if (name !== undefined) node.name = name
    if (description !== undefined) node.description = description
    if (level !== undefined) node.level = level
    if (order !== undefined) node.order = order
    if (departments !== undefined) node.departments = departments
    if (icon !== undefined) node.icon = icon
    if (color !== undefined) node.color = color
    if (legacyMapping !== undefined) node.legacyMapping = legacyMapping
    if (isActive !== undefined) node.isActive = isActive

    await node.save()

    res.json({
      success: true,
      data: node
    })
  } catch (error) {
    console.error('Error updating node:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Delete node ────────────────────────────────────────────────────────────
// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const node = await ProcessConfiguration.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!node) {
      return res.status(404).json({ success: false, message: 'Node not found' })
    }

    // Check for children - prevent deletion if node has children
    const childCount = await ProcessConfiguration.countDocuments({
      company: req.activeCompany._id,
      parentNode: node._id
    })

    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete node. It has ${childCount} child node(s). Delete or move children first.`
      })
    }

    await node.deleteOne()

    res.json({
      success: true,
      message: 'Node deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting node:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
