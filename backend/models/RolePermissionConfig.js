import mongoose from 'mongoose'

const rolePermissionConfigSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'Role is required']
  },

  processNode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcessConfiguration',
    required: [true, 'Process node is required']
  },

  permissions: {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    export: { type: Boolean, default: false }
  },

  inheritFromParent: {
    type: Boolean,
    default: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
rolePermissionConfigSchema.index({ company: 1, role: 1, processNode: 1 }, { unique: true })
rolePermissionConfigSchema.index({ company: 1, role: 1, isActive: 1 })
rolePermissionConfigSchema.index({ processNode: 1 })

/**
 * Get effective permissions for a role at a specific node.
 * Resolution algorithm:
 * 1. Look for entry at (role, processNode)
 * 2. If found with inheritFromParent=false → return directly
 * 3. If found with inheritFromParent=true → get parent's effective, overlay explicit trues
 * 4. If not found → walk up to parent recursively
 * 5. If at root with nothing → all false
 */
rolePermissionConfigSchema.statics.getEffectivePermissions = async function(companyId, roleId, nodeId) {
  const ProcessConfiguration = mongoose.model('ProcessConfiguration')

  const resolve = async (currentNodeId) => {
    if (!currentNodeId) {
      return { create: false, read: false, update: false, delete: false, approve: false, export: false }
    }

    const entry = await this.findOne({
      company: companyId,
      role: roleId,
      processNode: currentNodeId,
      isActive: true
    })

    if (entry && !entry.inheritFromParent) {
      return entry.permissions
    }

    // Get parent node
    const node = await ProcessConfiguration.findById(currentNodeId)
    if (!node) {
      return { create: false, read: false, update: false, delete: false, approve: false, export: false }
    }

    const parentPerms = await resolve(node.parentNode)

    if (entry) {
      // Overlay: explicit trues from this entry override parent
      return {
        create: entry.permissions.create || parentPerms.create,
        read: entry.permissions.read || parentPerms.read,
        update: entry.permissions.update || parentPerms.update,
        delete: entry.permissions.delete || parentPerms.delete,
        approve: entry.permissions.approve || parentPerms.approve,
        export: entry.permissions.export || parentPerms.export
      }
    }

    return parentPerms
  }

  return resolve(nodeId)
}

/**
 * Get full permission matrix for a role across all nodes
 */
rolePermissionConfigSchema.statics.getPermissionMatrix = async function(companyId, roleId) {
  const entries = await this.find({
    company: companyId,
    role: roleId,
    isActive: true
  }).populate('processNode', 'code name level depth parentNode').lean()

  return entries
}

/**
 * Bulk set permissions for a role
 * @param {Array} items - [{ processNode, permissions, inheritFromParent }]
 */
rolePermissionConfigSchema.statics.bulkSetPermissions = async function(companyId, roleId, items, userId) {
  const operations = items.map(item => ({
    updateOne: {
      filter: {
        company: companyId,
        role: roleId,
        processNode: item.processNode
      },
      update: {
        $set: {
          permissions: item.permissions,
          inheritFromParent: item.inheritFromParent !== undefined ? item.inheritFromParent : true,
          isActive: true,
          createdBy: userId
        },
        $setOnInsert: {
          company: companyId,
          role: roleId,
          processNode: item.processNode
        }
      },
      upsert: true
    }
  }))

  return this.bulkWrite(operations)
}

/**
 * Seed default permissions from existing Role model
 */
rolePermissionConfigSchema.statics.seedFromRoles = async function(companyId, userId) {
  const Role = mongoose.model('Role')
  const ProcessConfiguration = mongoose.model('ProcessConfiguration')

  const roles = await Role.find({ company: companyId })
  const modules = await ProcessConfiguration.find({
    company: companyId,
    level: 'module',
    isActive: true
  })

  // Map Role model module names to ProcessConfiguration codes
  const moduleNameToCode = {
    'Dashboard': 'ANALYTICS',
    'Sales': 'SALES',
    'Procurement': 'PROCUREMENT',
    'Inventory': 'INVENTORY',
    'HR': 'HR',
    'Finance': 'FINANCE',
    'Projects': 'PROJECTS',
    'Customers': 'SALES',
    'Leads': 'SALES',
    'Settings': 'SETTINGS',
    'Analytics': 'ANALYTICS'
  }

  // Map Role permission actions to RolePermissionConfig fields
  const actionMap = {
    'view': 'read',
    'create': 'create',
    'edit': 'update',
    'delete': 'delete',
    'approve': 'approve',
    'export': 'export'
  }

  const moduleMap = {}
  modules.forEach(m => { moduleMap[m.code] = m })

  let created = 0
  for (const role of roles) {
    if (!role.permissions) continue

    for (const [moduleName, actions] of Object.entries(role.permissions.toObject ? role.permissions.toObject() : role.permissions)) {
      const code = moduleNameToCode[moduleName]
      if (!code || !moduleMap[code]) continue

      const perms = { create: false, read: false, update: false, delete: false, approve: false, export: false }
      if (Array.isArray(actions)) {
        actions.forEach(action => {
          const mapped = actionMap[action]
          if (mapped) perms[mapped] = true
        })
      }

      // Only create if at least one permission is true
      const hasAny = Object.values(perms).some(v => v)
      if (!hasAny) continue

      await this.updateOne(
        { company: companyId, role: role._id, processNode: moduleMap[code]._id },
        {
          $set: {
            permissions: perms,
            inheritFromParent: false,
            isActive: true,
            createdBy: userId
          },
          $setOnInsert: {
            company: companyId,
            role: role._id,
            processNode: moduleMap[code]._id
          }
        },
        { upsert: true }
      )
      created++
    }
  }

  return { created }
}

const RolePermissionConfig = mongoose.model('RolePermissionConfig', rolePermissionConfigSchema)

export default RolePermissionConfig
