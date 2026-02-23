import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

await mongoose.connect(process.env.MONGODB_URI)
const Role = (await import('../models/Role.js')).default
const companyId = '6967b34f1496c6c6e553fd1e'

// Exact permissions from R&P.xlsx for each role
const fixes = {
  ADMIN: [
    'leads:view','leads:view_all','leads:view_assigned','leads:create','leads:edit','leads:delete','leads:assign','leads:convert','leads:export','leads:import',
    'customers:view','customers:view_all','customers:view_assigned','customers:create','customers:edit','customers:delete','customers:export',
    'projects:view','projects:view_all','projects:view_assigned','projects:create','projects:edit','projects:delete','projects:manage_team','projects:manage_financials','projects:export',
    'users:view','users:create','users:edit','users:delete','users:manage_roles',
    'company:view','company:edit','company:manage_settings',
    'reports:view','reports:export','analytics:view','dashboard:view',
    'kpi:view','kpi:manage','performance:view','performance:view_all',
    'automation:view','automation:manage'
  ],
  PRE_SALES_EXECUTIVE: [
    'leads:view_assigned',
    'customers:view_all','customers:view_assigned',
    'kpi:manage','performance:view'
  ],
  SALES_MANAGER: [
    'leads:view','leads:view_assigned','leads:create','leads:edit','leads:convert',
    'customers:view_all','customers:view_assigned','customers:create',
    'projects:view','projects:view_all','projects:create','projects:edit','projects:manage_team','projects:manage_financials',
    'kpi:view','kpi:manage','performance:view','performance:view_all'
  ],
  AGM_BUSINESS: [
    'leads:view','leads:view_assigned','leads:create','leads:edit','leads:assign','leads:convert',
    'customers:view','customers:view_all','customers:view_assigned',
    'projects:view','projects:view_all','projects:view_assigned','projects:create','projects:edit','projects:manage_team','projects:manage_financials',
    'kpi:view','kpi:manage','performance:view','performance:view_all'
  ],
  ASSOC_COMMUNITY_MANAGER: [
    'leads:view_assigned',
    'customers:view','customers:view_all','customers:view_assigned',
    'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team',
    'kpi:manage','performance:view'
  ],
  DESIGN_RELATIONSHIP_MANAGER: [
    'leads:view_assigned',
    'customers:view','customers:view_all','customers:view_assigned',
    'projects:view','projects:view_all','projects:view_assigned','projects:edit',
    'kpi:manage','performance:view'
  ],
  JUNIOR_DESIGNER: [
    'customers:view','customers:view_all','customers:view_assigned',
    'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team','projects:manage_financials',
    'kpi:manage','performance:view'
  ],
  QC_QA: [
    'customers:view','customers:view_all','customers:view_assigned',
    'projects:view','projects:view_all','projects:view_assigned','projects:edit',
    'kpi:manage','performance:view'
  ],
  FINANCE_CONTROLLER: [
    'customers:view','customers:view_all','customers:view_assigned',
    'projects:view','projects:view_all','projects:view_assigned','projects:manage_financials',
    'kpi:view','kpi:manage','performance:view','performance:view_all'
  ],
  FINANCE_EXECUTIVE: [
    'customers:view_all','customers:view_assigned',
    'projects:view','projects:view_all','projects:view_assigned','projects:manage_financials',
    'kpi:view','kpi:manage','performance:view'
  ]
}

console.log('=== Fixing granularPermissions to match R&P.xlsx exactly ===\n')

for (const [roleCode, perms] of Object.entries(fixes)) {
  const result = await Role.updateOne(
    { company: companyId, roleCode },
    { $set: { granularPermissions: perms } }
  )
  if (result.modifiedCount > 0) {
    console.log(`  Fixed ${roleCode} -> ${perms.length} perms`)
  } else if (result.matchedCount > 0) {
    console.log(`  ${roleCode} already correct`)
  } else {
    console.log(`  ${roleCode} NOT FOUND`)
  }
}

// Verify final state
console.log('\n=== VERIFICATION ===')
const allRoles = await Role.find({ company: companyId, isActive: true }, 'roleCode roleName department granularPermissions').lean()
allRoles.sort((a, b) => (a.department || '').localeCompare(b.department || '') || a.roleCode.localeCompare(b.roleCode))
for (const r of allRoles) {
  console.log(`  ${(r.department || '-').padEnd(12)} | ${r.roleCode.padEnd(35)} | ${(r.granularPermissions || []).length} perms`)
}

await mongoose.disconnect()
console.log('\nDone!')
