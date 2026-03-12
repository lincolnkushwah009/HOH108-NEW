import mongoose from 'mongoose'
import XLSX from 'xlsx'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env') })

// Import models
import User from '../models/User.js'
import Company from '../models/Company.js'
import Role from '../models/Role.js'
import Department from '../models/Department.js'

// ============================================
// CONSTANTS
// ============================================
const IP_COMPANY_ID = '6967b34f1496c6c6e553fd1e'
const HOH_COMPANY_ID = '696bd861e4b0494d3f259c02'

// Excel column index (1-based) → modulePermission key mapping
const COL_TO_PERM_KEY = {
  16: 'crm_dashboard',
  17: 'leads',
  18: 'call_activities',
  19: 'customers',
  20: 'sales_orders',
  21: 'quotations',
  22: 'boq_generator',
  23: 'dispatches',
  24: 'lead_scoring',
  25: 'surveys',
  26: 'sales_approvals',
  27: 'design_iterations',
  28: 'channel_partners',
  29: 'vendors',
  30: 'purchase_requisitions',
  31: 'purchase_orders',
  32: 'goods_receipt_grn',
  33: 'vendor_invoices',
  34: 'vendor_milestones',
  35: 'rfq',
  36: 'vendor_performance',
  37: 'materials',
  38: 'stock_management',
  39: 'stock_movements',
  40: 'all_projects',
  41: 'gantt_chart',
  42: 'budget_costing',
  43: 'timeline',
  44: 'p2p_tracker',
  45: 'qc_master',
  46: 'change_orders',
  47: 'risk_register',
  48: 'stock_takes',
  49: 'ppc_dashboard',
  50: 'work_orders',
  51: 'bill_of_materials',
  52: 'mrp',
  53: 'material_issues',
  54: 'labor_tracking',
  55: 'daily_progress',
  56: 'production_costs',
  57: 'employees_module',
  58: 'departments_module',
  59: 'attendance',
  60: 'leaves',
  61: 'reimbursements',
  62: 'advance_requests',
  63: 'salary_management',
  64: 'payroll',
  65: 'employee_letters',
  66: 'asset_management',
  67: 'skill_matrix',
  68: 'exit_management',
  69: 'kra_master',
  70: 'kpi_master',
  71: 'role_templates',
  72: 'reviews',
  73: 'review_cycles',
  74: 'customer_invoices',
  75: 'payments',
  76: 'accounts_receivable',
  77: 'accounts_payable',
  78: 'bank_reconciliation',
  79: 'budget_forecast',
  80: 'credit_debit_notes',
  81: 'ledger_master',
  82: 'ledger_mapping',
  83: 'aging_dashboard',
  84: 'analytics_overview',
  85: 'sales_analytics',
  86: 'finance_analytics',
  87: 'project_analytics',
  88: 'hr_analytics',
  89: 'compliance_dashboard',
  90: 'consent_dpdp',
  91: 'data_requests',
  92: 'e_invoicing',
  93: 'gst_returns',
  94: 'sod_review',
  95: 'access_reviews',
  96: 'notifications_module',
  97: 'approvals_module',
  98: 'all_tickets',
  99: 'my_tickets',
  100: 'assigned_to_me',
  101: 'create_ticket',
  102: 'mail_templates',
  103: 'game_entries'
}

// Permission Role name → Role code mapping
const PERMISSION_ROLE_TO_CODE = {
  'company admin': 'ADMIN',
  'owner': 'OWNER',
  'pre sales executive': 'PRE_SALES_EXECUTIVE',
  'sales manager': 'SALES_MANAGER',
  'associate sales manager': 'ASSOCIATE_SALES_MANAGER',
  'sales head': 'SALES_HEAD',
  'agm - sales': 'AGM_SALES',
  'agm - business': 'AGM_BUSINESS',
  'agm - operations': 'AGM_OPERATIONS',
  'community manager': 'COMMUNITY_MANAGER',
  'associate community manager': 'ASSOC_COMMUNITY_MANAGER',
  'principal designer': 'PRINCIPAL_DESIGNER',
  'design head': 'DESIGN_HEAD',
  'design relationship manager': 'DESIGN_RELATIONSHIP_MANAGER',
  'associate design relationship manager': 'ASSOC_DESIGN_REL_MANAGER',
  'junior designer': 'JUNIOR_DESIGNER',
  'project manager': 'PROJECT_MANAGER',
  'site engineer': 'SITE_ENGINEER',
  'site executive': 'SITE_EXECUTIVE',
  'mmt technician': 'MMT_TECHNICIAN',
  'quality controller': 'QC_QA',
  'finance controller': 'FINANCE_CONTROLLER',
  'finance executive': 'FINANCE_EXECUTIVE',
  'hr head': 'HR_HEAD',
  'hr executive': 'HR_EXECUTIVE',
  'procurement': 'PROCUREMENT',
  '2d': 'TWO_D',
  'architect': 'ARCHITECT',
  'admin': 'ADMIN_EXEC',
  'business operations lead': 'BUSINESS_OPS_LEAD',
  'manager - channel partner': 'MANAGER_CHANNEL_PARTNER',
  'information technology': 'INFORMATION_TECHNOLOGY',
  'marketing': 'MARKETING',
  'crm': 'CRM',
  'viewer': 'VIEWER',
}

// System Role → base role mapping
function mapSystemRoleToBaseRole(systemRole, permissionRole) {
  const s = (systemRole || '').replace(/\s+/g, ' ').toLowerCase().trim()
  const p = (permissionRole || '').replace(/\s+/g, ' ').toLowerCase().trim()

  if (['group ceo', 'director'].includes(s)) return 'super_admin'
  if (['ceo', 'cbo', 'coo', 'cfo', 'cmo', 'cto'].includes(s)) return 'company_admin'
  if (s === 'associate general manager') {
    if (p.includes('sales')) return 'sales_manager'
    if (p.includes('operations')) return 'project_manager'
    if (p.includes('business')) return 'company_admin'
    return 'sales_manager'
  }
  if (['head of sales', 'sales manager'].includes(s)) return 'sales_manager'
  if (s === 'associate sales manager') return 'sales_executive'
  if (['presales executive', 'senior presales executive', 'business development manager'].includes(s)) return 'pre_sales'
  if (['community manager', 'associate community manager', 'principal designer',
       'design relationship manager', 'associate design relationship manager',
       'junior designer', 'visualizer', 'senior architectural interior designer', 'architect'].includes(s)) return 'designer'
  if (['project manager', 'junior project manager'].includes(s)) return 'project_manager'
  if (s === 'site supervisor') return 'site_engineer'
  if (s === 'mmt') return 'operations'
  if (['quality controller', 'subject matter expert', 'assistant subject matter expert'].includes(s)) return 'operations'
  if (['hr manager', 'senior executive (hr)'].includes(s)) return 'operations'
  if (s === 'senior executive') {
    if (p.includes('finance')) return 'finance'
    if (p.includes('hr')) return 'operations'
    return 'operations'
  }
  if (['financial controller', 'senior executive (finance)'].includes(s)) return 'finance'
  if (['csr & planner', 'business operations lead'].includes(s)) return 'operations'
  if (s === 'manager - channel sales') return 'sales_manager'
  if (['technical head', 'head of product engineering', 'junior programme manager', 'senior motion graphic designer'].includes(s)) return 'operations'
  return 'viewer'
}

// Department name mapping
const DEPT_NAME_TO_CODE = {
  'management': 'MNG',
  'sales & design': 'SALES',
  'operations': 'EXECUTION',
  'human resources & admin': 'HR',
  'finance & accounts': 'FINANCE',
  'finance': 'FINANCE',
  'marketing': 'MARKETING',
  'information technology': 'IT',
  'sales': 'SALES',
  'design': 'DESIGN',
  'project execution': 'EXECUTION',
  'quality control': 'QC',
  'planning': 'EXECUTION',
  'presales': 'PRE_SALES',
  'human resources': 'HR',
  'hr': 'HR',
  'digital marketing': 'MARKETING',
  'channel sales': 'CHANNEL_SALES',
  'business intelligence': 'BI',
  'business development': 'BD',
  'it': 'IT',
  'administration': 'ADMIN',
  'procurement': 'PROCUREMENT',
}

const MANAGEMENT_DESIGNATIONS = ['group ceo', 'director', 'ceo', 'cbo', 'coo', 'cfo', 'cmo', 'cto']

// ============================================
// EXCEL PARSING HELPERS (using openpyxl-style cell access via XLSX)
// ============================================

function getCellValue(sheet, row, col) {
  const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 })
  const cell = sheet[cellAddress]
  return cell ? cell.v : null
}

function isTrueValue(val) {
  if (val === true || val === 'True' || val === 'TRUE' || val === 'true' || val === 1) return true
  return false
}

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function seedRolesPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    const excelPath = process.argv[2] || '/Users/kevin/Downloads/Roles & Permission .xlsx'
    console.log(`Reading: ${excelPath}`)

    const workbook = XLSX.readFile(excelPath)
    const viewSheet = workbook.Sheets['View Access']
    const editSheet = workbook.Sheets['Edit Access']

    if (!viewSheet || !editSheet) {
      console.error('Excel must have "View Access" and "Edit Access" sheets')
      process.exit(1)
    }

    // Determine row count from View Access sheet
    const viewRange = XLSX.utils.decode_range(viewSheet['!ref'])
    const maxRow = viewRange.e.r + 1 // 1-based
    console.log(`View Access sheet: ${maxRow} rows`)

    // ============================================
    // STEP 0: Look up companies
    // ============================================
    let ipCompany = await Company.findById(IP_COMPANY_ID)
    let hohCompany = await Company.findById(HOH_COMPANY_ID)
    if (!ipCompany) ipCompany = await Company.findOne({ code: 'IP' })
    if (!hohCompany) hohCompany = await Company.findOne({ code: 'HOH' })

    const defaultCompany = ipCompany || hohCompany
    if (!defaultCompany) {
      console.error('No companies found. Please create IP and HOH companies first.')
      process.exit(1)
    }
    console.log(`IP Company: ${ipCompany ? `${ipCompany.name} (${ipCompany._id})` : 'NOT FOUND'}`)
    console.log(`HOH Company: ${hohCompany ? `${hohCompany.name} (${hohCompany._id})` : 'NOT FOUND'}`)

    // ============================================
    // STEP 1: Ensure default roles exist
    // ============================================
    console.log('\n--- Ensuring Default Roles ---')
    if (ipCompany) {
      const r = await Role.createDefaultRoles(ipCompany._id)
      console.log(`IP: ${r.length} new roles created`)
    }
    if (hohCompany) {
      const r = await Role.createDefaultRoles(hohCompany._id)
      console.log(`HOH: ${r.length} new roles created`)
    }

    // Build role lookup maps
    const ipRolesByCode = {}
    const hohRolesByCode = {}
    if (ipCompany) {
      const roles = await Role.find({ company: ipCompany._id, isActive: true })
      for (const r of roles) ipRolesByCode[r.roleCode] = r
    }
    if (hohCompany) {
      const roles = await Role.find({ company: hohCompany._id, isActive: true })
      for (const r of roles) hohRolesByCode[r.roleCode] = r
    }

    // ============================================
    // STEP 2: Hash default password
    // ============================================
    const salt = await bcrypt.genSalt(10)
    const defaultPassword = await bcrypt.hash('Welcome@123', salt)

    // ============================================
    // STEP 3: Process each employee row (starting from row 3)
    // ============================================
    console.log('\n--- Processing Employees ---')

    let created = 0, updated = 0, skipped = 0, failed = 0
    const errors = []

    for (let row = 3; row <= maxRow; row++) {
      const empId = getCellValue(viewSheet, row, 1)
      const name = getCellValue(viewSheet, row, 2)
      if (!empId || !name) continue

      const email = getCellValue(viewSheet, row, 3)
      const phone = getCellValue(viewSheet, row, 4)
      const designation = getCellValue(viewSheet, row, 5)
      const department = getCellValue(viewSheet, row, 6)
      const systemRole = getCellValue(viewSheet, row, 7)
      const permissionRole = getCellValue(viewSheet, row, 8)
      const entity = getCellValue(viewSheet, row, 9)
      const empType = getCellValue(viewSheet, row, 10)
      const doj = getCellValue(viewSheet, row, 11)
      const branch = getCellValue(viewSheet, row, 12)
      const region = getCellValue(viewSheet, row, 13)
      const gender = getCellValue(viewSheet, row, 14)

      // ---- Build module permissions from both sheets ----
      const modulePermissions = {}
      for (const [colStr, key] of Object.entries(COL_TO_PERM_KEY)) {
        const col = parseInt(colStr)
        const viewVal = getCellValue(viewSheet, row, col)
        const editVal = getCellValue(editSheet, row, col)
        modulePermissions[key] = {
          view: isTrueValue(viewVal),
          edit: isTrueValue(editVal)
        }
      }

      // ---- Resolve role ----
      const role = mapSystemRoleToBaseRole(systemRole, permissionRole)

      // ---- Resolve userRole (custom Role ObjectId) ----
      let userRoleId = undefined
      if (permissionRole) {
        const roleCode = PERMISSION_ROLE_TO_CODE[permissionRole.replace(/\s+/g, ' ').toLowerCase().trim()]
        if (roleCode) {
          const entityUpper = (entity || '').toUpperCase().trim()
          if (entityUpper === 'HOH' && hohRolesByCode[roleCode]) {
            userRoleId = hohRolesByCode[roleCode]._id
          } else if (ipRolesByCode[roleCode]) {
            userRoleId = ipRolesByCode[roleCode]._id
          } else if (hohRolesByCode[roleCode]) {
            userRoleId = hohRolesByCode[roleCode]._id
          }
        }
      }

      // ---- Entity → company assignment ----
      let assignedCompany = defaultCompany._id
      let additionalCompanies = undefined
      const entityUpper = (entity || '').toUpperCase().trim()

      if (entityUpper === 'IP' && ipCompany) {
        assignedCompany = ipCompany._id
      } else if (entityUpper === 'HOH' && hohCompany) {
        assignedCompany = hohCompany._id
      } else if (entityUpper === 'BOTH') {
        // Primary = HOH, additional = IP
        assignedCompany = hohCompany ? hohCompany._id : defaultCompany._id
        if (ipCompany) {
          additionalCompanies = [{ company: ipCompany._id, role }]
        }
      } else if (entityUpper === 'NONE') {
        assignedCompany = defaultCompany._id
      } else if (ipCompany) {
        assignedCompany = ipCompany._id
      }

      // ---- Department code ----
      let deptCode = department || ''
      const deptLower = (department || '').replace(/\s+/g, ' ').toLowerCase().trim()
      if (DEPT_NAME_TO_CODE[deptLower]) {
        deptCode = DEPT_NAME_TO_CODE[deptLower]
      }
      if (MANAGEMENT_DESIGNATIONS.includes((systemRole || '').toLowerCase().trim())) {
        deptCode = 'MNG'
      }

      // ---- Employment type ----
      let employmentType = 'permanent'
      if (empType) {
        const et = empType.toLowerCase().trim()
        if (['probation', 'permanent', 'contract', 'intern', 'consultant'].includes(et)) {
          employmentType = et
        }
      }

      // ---- Gender ----
      let genderVal = undefined
      if (gender) {
        const g = gender.toLowerCase().trim()
        if (['male', 'female', 'other'].includes(g)) genderVal = g
      }

      // ---- Date of joining ----
      let dateOfJoining = undefined
      if (doj) {
        if (typeof doj === 'number') {
          dateOfJoining = new Date((doj - 25569) * 86400 * 1000)
        } else {
          const parsed = new Date(doj)
          if (!isNaN(parsed.getTime())) dateOfJoining = parsed
        }
      }

      // ---- Clean email & phone ----
      let finalEmail = email ? email.toString().trim().toLowerCase() : null
      if (!finalEmail) {
        const cleanName = name.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).filter(Boolean)
        if (cleanName.length > 1) {
          finalEmail = `${cleanName[0]}.${cleanName[cleanName.length - 1]}@hoh108.com`
        } else if (cleanName.length === 1) {
          finalEmail = `${cleanName[0]}@hoh108.com`
        } else {
          finalEmail = `${empId.toLowerCase()}@hoh108.com`
        }
      }

      const phoneStr = phone ? String(Math.floor(Number(phone))) : ''

      try {
        // Check if employee already exists (by empId or email)
        let existingUser = await User.findOne({ empId })
        if (!existingUser) {
          existingUser = await User.findOne({ email: finalEmail })
        }
        if (!existingUser) {
          existingUser = await User.findOne({ userId: empId })
        }

        if (existingUser) {
          // UPDATE existing employee with new fields and permissions
          const updateData = {
            empId,
            systemRole: systemRole || existingUser.systemRole,
            entity: entityUpper === 'BOTH' ? 'Both' : (entityUpper === 'NONE' ? 'None' : (entityUpper || existingUser.entity)),
            branch: branch || existingUser.branch,
            region: region || existingUser.region,
            modulePermissions,
            designation: designation || existingUser.designation,
            department: deptCode || existingUser.department,
          }

          if (userRoleId) updateData.userRole = userRoleId
          if (role) updateData.role = role

          // Update HR details
          updateData['hrDetails.employmentType'] = employmentType
          if (dateOfJoining) updateData['hrDetails.dateOfJoining'] = dateOfJoining
          if (branch) updateData['hrDetails.city'] = branch
          if (genderVal) updateData['hrDetails.gender'] = genderVal

          await User.updateOne({ _id: existingUser._id }, { $set: updateData })
          updated++
          console.log(`  UPD: ${empId} ${name} → permissions updated`)
        } else {
          // CREATE new employee
          const employeeData = {
            userId: empId,
            empId,
            name: name.trim(),
            email: finalEmail,
            phone: phoneStr,
            password: defaultPassword,
            company: assignedCompany,
            role,
            userRole: userRoleId,
            department: deptCode,
            designation: designation || systemRole || '',
            systemRole: systemRole || '',
            entity: entityUpper === 'BOTH' ? 'Both' : (entityUpper === 'NONE' ? 'None' : (entityUpper || 'IP')),
            branch: branch || '',
            region: region || '',
            isActive: true,
            isEmployee: true,
            modulePermissions,
            hrDetails: {
              employmentType,
              dateOfJoining,
              city: branch || '',
              showroom: branch || '',
              branchCode: branch ? branch.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) : '',
              gender: genderVal,
              permanentAddress: { state: region || '', country: 'India' },
              currentAddress: { city: branch || '', state: region || '', country: 'India' }
            }
          }

          if (additionalCompanies) {
            employeeData.additionalCompanies = additionalCompanies
          }

          await User.create(employeeData)
          created++
          const entityLabel = entityUpper || 'IP'
          console.log(`  NEW: ${empId} ${name} → ${entityLabel}, ${permissionRole || role}`)
        }
      } catch (err) {
        failed++
        errors.push({ empId, name, error: err.message })
        console.error(`  FAIL: ${empId} ${name} → ${err.message}`)
      }
    }

    // ============================================
    // STEP 4: Update Department Statistics
    // ============================================
    console.log('\n--- Updating Department Statistics ---')
    const companies = [ipCompany, hohCompany].filter(Boolean)
    for (const comp of companies) {
      const allDepts = await Department.find({ company: comp._id })
      for (const dept of allDepts) {
        const count = await User.countDocuments({
          company: comp._id,
          department: dept.code,
          isActive: true
        })
        await Department.updateOne(
          { _id: dept._id },
          { $set: { 'stats.totalEmployees': count, 'stats.activeEmployees': count } }
        )
        if (count > 0) {
          console.log(`  ${comp.code || comp.name} / ${dept.code}: ${count} employees`)
        }
      }
    }

    // ============================================
    // Summary
    // ============================================
    console.log('\n========================================')
    console.log('SEED SUMMARY')
    console.log('========================================')
    console.log(`Employees created: ${created}`)
    console.log(`Employees updated: ${updated}`)
    console.log(`Employees skipped: ${skipped}`)
    console.log(`Employees failed: ${failed}`)
    if (errors.length > 0) {
      console.log('\nErrors:')
      for (const e of errors) {
        console.log(`  ${e.empId} ${e.name}: ${e.error}`)
      }
    }
    console.log('========================================')
    console.log('Default password for new employees: Welcome@123')
    console.log('========================================')

    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seedRolesPermissions()
