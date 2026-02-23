import express from 'express'
import Role from '../models/Role.js'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(protect)

// Seed default roles - MUST be before /:id route
router.post('/seed-defaults', async (req, res) => {
  try {
    const created = await Role.createDefaultRoles(req.user.company, req.user._id)
    res.json({
      success: true,
      message: `Created ${created.length} default roles`,
      data: created
    })
  } catch (error) {
    console.error('Error seeding roles:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get available permissions - MUST be before /:id route
router.get('/meta/permissions', async (req, res) => {
  try {
    const modules = ['Dashboard', 'Sales', 'Procurement', 'Inventory', 'HR', 'Finance', 'Projects', 'Customers', 'Leads', 'Settings', 'Reports']
    const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export']

    res.json({
      success: true,
      data: {
        modules,
        actions
      }
    })
  } catch (error) {
    console.error('Error fetching permissions meta:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get all roles for company
router.get('/', async (req, res) => {
  try {
    const { search, isActive } = req.query

    const filter = { company: req.user.company }
    if (isActive !== undefined) filter.isActive = isActive === 'true'

    let query = Role.find(filter)
      .populate('createdBy', 'name')
      .sort({ isSystem: -1, roleName: 1 })

    if (search) {
      query = query.where({
        $or: [
          { roleCode: new RegExp(search, 'i') },
          { roleName: new RegExp(search, 'i') }
        ]
      })
    }

    const roles = await query

    // Update user counts using the userRole reference
    for (const role of roles) {
      const userCount = await User.countDocuments({
        company: req.user.company,
        userRole: role._id,
        isActive: true
      })
      role.userCount = userCount
    }

    // Calculate stats
    const stats = {
      total: roles.length,
      active: roles.filter(r => r.isActive).length,
      inactive: roles.filter(r => !r.isActive).length,
      system: roles.filter(r => r.isSystem).length,
      custom: roles.filter(r => !r.isSystem).length
    }

    res.json({
      success: true,
      count: roles.length,
      stats,
      data: roles
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single role
router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      company: req.user.company
    }).populate('createdBy', 'name')

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' })
    }

    // Get users with this role using userRole reference
    const users = await User.find({
      company: req.user.company,
      userRole: role._id,
      isActive: true
    }).select('name email department')

    res.json({
      success: true,
      data: {
        ...role.toObject(),
        users
      }
    })
  } catch (error) {
    console.error('Error fetching role:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create new role
router.post('/', async (req, res) => {
  try {
    const { roleCode, roleName, description, permissions, isActive } = req.body

    // Check if roleCode already exists
    const existing = await Role.findOne({
      company: req.user.company,
      roleCode: roleCode.toUpperCase()
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A role with this code already exists'
      })
    }

    const role = await Role.create({
      company: req.user.company,
      roleCode: roleCode.toUpperCase(),
      roleName,
      description,
      permissions,
      isActive: isActive !== false,
      isSystem: false,
      baseRole: 'custom',
      createdBy: req.user._id
    })

    res.status(201).json({
      success: true,
      data: role
    })
  } catch (error) {
    console.error('Error creating role:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update role
router.put('/:id', async (req, res) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' })
    }

    // Prevent editing system roles (except isActive and permissions)
    if (role.isSystem) {
      const { permissions, isActive } = req.body
      role.permissions = permissions || role.permissions
      role.isActive = isActive !== undefined ? isActive : role.isActive
      role.updatedBy = req.user._id
      await role.save()
    } else {
      // Allow full edit for custom roles
      const { roleCode, roleName, description, permissions, isActive } = req.body

      // Check if new roleCode conflicts with existing
      if (roleCode && roleCode.toUpperCase() !== role.roleCode) {
        const existing = await Role.findOne({
          company: req.user.company,
          roleCode: roleCode.toUpperCase(),
          _id: { $ne: role._id }
        })

        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'A role with this code already exists'
          })
        }
        role.roleCode = roleCode.toUpperCase()
      }

      if (roleName) role.roleName = roleName
      if (description !== undefined) role.description = description
      if (permissions) role.permissions = permissions
      if (isActive !== undefined) role.isActive = isActive
      role.updatedBy = req.user._id

      await role.save()
    }

    res.json({ success: true, data: role })
  } catch (error) {
    console.error('Error updating role:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete role
router.delete('/:id', async (req, res) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      company: req.user.company
    })

    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' })
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system roles'
      })
    }

    // Check if any users have this role using userRole reference
    const usersWithRole = await User.countDocuments({
      company: req.user.company,
      userRole: role._id
    })

    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.`
      })
    }

    await role.deleteOne()

    res.json({ success: true, message: 'Role deleted successfully' })
  } catch (error) {
    console.error('Error deleting role:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
