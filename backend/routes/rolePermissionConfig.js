import express from 'express'
import RolePermissionConfig from '../models/RolePermissionConfig.js'
import ProcessConfiguration from '../models/ProcessConfiguration.js'
import { protect, setCompanyContext, companyScopedQuery, requirePermission, PERMISSIONS } from '../middleware/rbac.js'

const router = express.Router()

// All routes require auth + company context
router.use(protect, setCompanyContext)

// ─── Seed defaults from existing Role model ─────────────────────────────────
// POST /seed-defaults  (must be before /:id to avoid param conflict)
router.post('/seed-defaults', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const userId = req.user._id

    const result = await RolePermissionConfig.seedFromRoles(companyId, userId)

    res.status(201).json({
      success: true,
      message: `Migrated ${result.created} permission entries from existing roles`,
      data: result
    })
  } catch (error) {
    console.error('Error seeding role permission config:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Bulk set permissions for a role ────────────────────────────────────────
// POST /bulk
router.post('/bulk', async (req, res) => {
  try {
    const { roleId, items } = req.body
    const companyId = req.activeCompany._id
    const userId = req.user._id

    if (!roleId) {
      return res.status(400).json({ success: false, message: 'roleId is required' })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items array is required and must not be empty' })
    }

    const result = await RolePermissionConfig.bulkSetPermissions(companyId, roleId, items, userId)

    res.json({
      success: true,
      message: `Processed ${items.length} permission entries`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount
      }
    })
  } catch (error) {
    console.error('Error bulk setting permissions:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Get full permission matrix for a role ──────────────────────────────────
// GET /matrix/:roleId
router.get('/matrix/:roleId', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const entries = await RolePermissionConfig.getPermissionMatrix(companyId, req.params.roleId)

    res.json({
      success: true,
      count: entries.length,
      data: entries
    })
  } catch (error) {
    console.error('Error fetching permission matrix:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Get effective (resolved) permissions for a role at a node ──────────────
// GET /effective/:roleId/:nodeId
router.get('/effective/:roleId/:nodeId', async (req, res) => {
  try {
    const companyId = req.activeCompany._id
    const { roleId, nodeId } = req.params

    const permissions = await RolePermissionConfig.getEffectivePermissions(companyId, roleId, nodeId)

    // Also fetch the node info for context
    const node = await ProcessConfiguration.findById(nodeId).select('code name level depth').lean()

    res.json({
      success: true,
      data: {
        roleId,
        nodeId,
        node: node || null,
        permissions
      }
    })
  } catch (error) {
    console.error('Error fetching effective permissions:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Get all roles' permissions for a specific node ─────────────────────────
// GET /by-node/:nodeId
router.get('/by-node/:nodeId', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    const entries = await RolePermissionConfig.find({
      company: companyId,
      processNode: req.params.nodeId,
      isActive: true
    })
      .populate('role', 'roleCode roleName isSystem isActive')
      .populate('processNode', 'code name level')
      .lean()

    res.json({
      success: true,
      count: entries.length,
      data: entries
    })
  } catch (error) {
    console.error('Error fetching permissions by node:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Create / set a permission entry ────────────────────────────────────────
// POST /
router.post('/', async (req, res) => {
  try {
    const { role, processNode, permissions, inheritFromParent } = req.body
    const companyId = req.activeCompany._id

    if (!role || !processNode) {
      return res.status(400).json({ success: false, message: 'role and processNode are required' })
    }

    // Validate the process node exists and belongs to the same company
    const node = await ProcessConfiguration.findOne({
      _id: processNode,
      company: companyId
    })

    if (!node) {
      return res.status(404).json({ success: false, message: 'Process node not found' })
    }

    // Upsert: create or update the entry for this role+node combination
    const entry = await RolePermissionConfig.findOneAndUpdate(
      {
        company: companyId,
        role,
        processNode
      },
      {
        $set: {
          permissions: permissions || { create: false, read: false, update: false, delete: false, approve: false, export: false },
          inheritFromParent: inheritFromParent !== undefined ? inheritFromParent : true,
          isActive: true,
          createdBy: req.user._id
        },
        $setOnInsert: {
          company: companyId,
          role,
          processNode
        }
      },
      { new: true, upsert: true, runValidators: true }
    )

    res.status(201).json({
      success: true,
      data: entry
    })
  } catch (error) {
    console.error('Error creating permission entry:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Update a permission entry ──────────────────────────────────────────────
// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const entry = await RolePermissionConfig.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Permission entry not found' })
    }

    const { permissions, inheritFromParent, isActive } = req.body

    if (permissions !== undefined) entry.permissions = permissions
    if (inheritFromParent !== undefined) entry.inheritFromParent = inheritFromParent
    if (isActive !== undefined) entry.isActive = isActive

    await entry.save()

    res.json({
      success: true,
      data: entry
    })
  } catch (error) {
    console.error('Error updating permission entry:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ─── Delete a permission entry (revert to inheritance) ──────────────────────
// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const entry = await RolePermissionConfig.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Permission entry not found' })
    }

    await entry.deleteOne()

    res.json({
      success: true,
      message: 'Permission entry removed. Node will now inherit permissions from parent.'
    })
  } catch (error) {
    console.error('Error deleting permission entry:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
