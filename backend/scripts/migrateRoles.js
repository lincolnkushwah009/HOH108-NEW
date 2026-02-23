import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

await mongoose.connect(process.env.MONGODB_URI)
const Role = (await import('../models/Role.js')).default
const User = (await import('../models/User.js')).default
const companyId = '6967b34f1496c6c6e553fd1e'

// Migration map: old roleCode -> new roleCode for user reassignment
const migrationMap = {
  'DESIGN_TEAM': 'JUNIOR_DESIGNER',
  'EXECUTION': 'SITE_ENGINEER',
  'EXECUTION_HEAD': 'AGM_OPERATIONS',
  'FINANCE': 'FINANCE_CONTROLLER',
  'HR': 'HR_HEAD',
  'MNG': 'ADMIN',
  'PRE_SALES': 'PRE_SALES_EXECUTIVE',
  'QC': 'QC_QA',
  'SALES': 'ASSOCIATE_SALES_MANAGER'
}

const oldCodesToDelete = Object.keys(migrationMap).filter(c => c !== 'MNG')

// Step 1: Seed new default roles (skips existing roleCodes)
console.log('=== STEP 1: Seed new default roles ===')
const created = await Role.createDefaultRoles(companyId, null)
console.log('Created', created.length, 'new roles:')
created.forEach(r => console.log('  +', r.roleCode, '-', r.roleName))

// Step 2: Migrate users from old roles to new roles
console.log('\n=== STEP 2: Migrate users ===')
for (const [oldCode, newCode] of Object.entries(migrationMap)) {
  const oldRole = await Role.findOne({ company: companyId, roleCode: oldCode })
  const newRole = await Role.findOne({ company: companyId, roleCode: newCode })

  if (!oldRole) { console.log('  Skip', oldCode, '- not found'); continue }
  if (!newRole) { console.log('  ERROR:', newCode, 'not found!'); continue }

  const cnt = await User.countDocuments({ userRole: oldRole._id })
  if (cnt > 0) {
    const result = await User.updateMany(
      { userRole: oldRole._id },
      { userRole: newRole._id }
    )
    console.log('  Migrated', result.modifiedCount, 'users from', oldCode, '->', newCode)
  } else {
    console.log('  No users on', oldCode)
  }
}

// Step 3: Update existing roles that match new codes with department + granularPermissions
console.log('\n=== STEP 3: Update existing roles ===')

const updates = [
  {
    roleCode: 'OWNER', department: 'Management',
    granularPermissions: [
      'leads:view','leads:view_all','leads:view_assigned','leads:create','leads:edit','leads:delete','leads:assign','leads:convert','leads:export','leads:import',
      'customers:view','customers:view_all','customers:view_assigned','customers:create','customers:edit','customers:delete','customers:export',
      'projects:view','projects:view_all','projects:view_assigned','projects:create','projects:edit','projects:delete','projects:manage_team','projects:manage_financials','projects:export',
      'users:view','users:create','users:edit','users:delete','users:manage_roles',
      'company:view','company:edit','company:manage_settings',
      'reports:view','reports:export','analytics:view','dashboard:view',
      'kpi:view','kpi:manage','performance:view','performance:view_all',
      'automation:view','automation:manage'
    ]
  },
  {
    roleCode: 'ADMIN', department: 'Management',
    granularPermissions: [
      'leads:view','leads:view_all','leads:create','leads:edit','leads:delete','leads:assign','leads:convert','leads:export','leads:import',
      'customers:view','customers:view_all','customers:create','customers:edit','customers:delete','customers:export',
      'projects:view','projects:view_all','projects:create','projects:edit','projects:delete','projects:manage_team','projects:manage_financials','projects:export',
      'users:view','users:create','users:edit','users:delete','users:manage_roles',
      'company:view','company:edit','company:manage_settings',
      'reports:view','reports:export','analytics:view','dashboard:view',
      'kpi:view','kpi:manage','performance:view','performance:view_all',
      'automation:view','automation:manage'
    ]
  },
  {
    roleCode: 'SALES_HEAD', department: 'Sales',
    granularPermissions: [
      'leads:view','leads:view_all','leads:view_assigned','leads:create','leads:edit','leads:assign','leads:convert',
      'customers:view','customers:view_all','customers:view_assigned','customers:create',
      'projects:view','projects:view_all','projects:create','projects:edit','projects:manage_team','projects:manage_financials',
      'kpi:view','kpi:manage','performance:view','performance:view_all'
    ]
  },
  {
    roleCode: 'DESIGN_HEAD', department: 'Design',
    granularPermissions: [
      'leads:view_assigned',
      'customers:view','customers:view_all','customers:view_assigned',
      'projects:view','projects:view_all','projects:view_assigned','projects:create','projects:edit','projects:manage_team',
      'kpi:view','kpi:manage','performance:view','performance:view_all'
    ]
  },
  {
    roleCode: 'CRM', department: 'Sales',
    granularPermissions: [
      'leads:view','leads:view_all','leads:view_assigned','leads:create','leads:edit','leads:delete','leads:assign','leads:convert','leads:export',
      'customers:view','customers:view_all','customers:view_assigned','customers:create','customers:edit','customers:delete','customers:export',
      'dashboard:view','performance:view'
    ]
  },
  {
    roleCode: 'MARKETING', department: 'Marketing',
    granularPermissions: [
      'leads:view','leads:view_assigned','leads:create','leads:edit',
      'customers:view','customers:view_assigned','customers:create','customers:edit','customers:export',
      'dashboard:view','performance:view'
    ]
  },
  {
    roleCode: 'PROCUREMENT', department: 'Procurement',
    granularPermissions: ['projects:view','projects:view_all','customers:view','dashboard:view','performance:view']
  },
  {
    roleCode: 'VIEWER', department: '',
    granularPermissions: ['leads:view','leads:view_assigned','customers:view','customers:view_assigned','projects:view','projects:view_assigned','dashboard:view']
  }
]

for (const upd of updates) {
  const result = await Role.updateOne(
    { company: companyId, roleCode: upd.roleCode },
    { $set: { department: upd.department, granularPermissions: upd.granularPermissions } }
  )
  if (result.modifiedCount > 0) {
    console.log('  Updated', upd.roleCode, 'with department + granularPermissions')
  } else {
    console.log('  ', upd.roleCode, '- already up to date or not found')
  }
}

// Step 4: Deactivate old roles that have been fully migrated
console.log('\n=== STEP 4: Deactivate old roles ===')
for (const oldCode of oldCodesToDelete) {
  const oldRole = await Role.findOne({ company: companyId, roleCode: oldCode })
  if (oldRole) {
    const remainingUsers = await User.countDocuments({ userRole: oldRole._id })
    if (remainingUsers === 0) {
      oldRole.isActive = false
      oldRole.isSystem = false
      await oldRole.save()
      console.log('  Deactivated', oldCode)
    } else {
      console.log('  WARNING:', oldCode, 'still has', remainingUsers, 'users - keeping active')
    }
  }
}

// Final summary
console.log('\n=== FINAL STATE ===')
const allRoles = await Role.find({ company: companyId, isActive: true }, 'roleCode roleName department baseRole granularPermissions').lean()
allRoles.sort((a, b) => (a.department || '').localeCompare(b.department || '') || a.roleCode.localeCompare(b.roleCode))
console.log('Active roles:', allRoles.length)
allRoles.forEach(r => {
  const permCount = (r.granularPermissions || []).length
  console.log(' ', (r.department || '-').padEnd(12), '|', r.roleCode.padEnd(35), '|', r.roleName.padEnd(35), '|', r.baseRole.padEnd(15), '|', permCount, 'perms')
})

await mongoose.disconnect()
console.log('\nMigration complete!')
