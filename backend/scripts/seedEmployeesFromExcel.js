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

// Excel date conversion (Excel dates are days since 1900-01-01)
function excelDateToJS(excelDate) {
  if (!excelDate || typeof excelDate !== 'number') return null
  return new Date((excelDate - 25569) * 86400 * 1000)
}

// Generate email from name
function generateEmail(name, empId) {
  const cleanName = name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (cleanName.length === 0) {
    return `${empId.toLowerCase()}@hoh108.com`
  }

  const firstName = cleanName[0]
  const lastName = cleanName.length > 1 ? cleanName[cleanName.length - 1] : ''

  if (lastName) {
    return `${firstName}.${lastName}@hoh108.com`
  }
  return `${firstName}@hoh108.com`
}

// ============================================
// Permission Role name → Role code mapping
// ============================================
const PERMISSION_ROLE_TO_CODE = {
  'company admin': 'ADMIN',
  'pre sales executive': 'PRE_SALES_EXECUTIVE',
  'sales manager': 'SALES_MANAGER',
  'associate sales manager': 'SALES_MANAGER',
  'sales head': 'SALES_HEAD',
  'agm - sales': 'AGM_SALES',
  'agm - business': 'AGM_BUSINESS',
  'agm - operations': 'AGM_OPERATIONS',
  'community manager': 'COMMUNITY_MANAGER',
  'associate community manager': 'ASSOC_COMMUNITY_MANAGER',
  'principal designer': 'PRINCIPAL_DESIGNER',
  'design relationship manager': 'DESIGN_RELATIONSHIP_MANAGER',
  'associate design relationship manager': 'ASSOC_DESIGN_REL_MANAGER',
  'junior designer': 'JUNIOR_DESIGNER',
  'project manager': 'PROJECT_MANAGER',
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
}

// ============================================
// System Role → base role mapping
// ============================================
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
  return null
}

// Fallback: designation-based mapping
function mapDesignationToRole(designation) {
  const d = (designation || '').toLowerCase()
  if (d.includes('ceo') || d.includes('director')) return 'super_admin'
  if (d.includes('cbo') || d.includes('coo') || d.includes('cfo') || d.includes('cmo') || d.includes('cto')) return 'company_admin'
  if (d.includes('head of') || d.includes('agm') || (d.includes('manager') && !d.includes('associate'))) return 'sales_manager'
  if (d.includes('project manager')) return 'project_manager'
  if (d.includes('site') || d.includes('engineer') || d.includes('supervisor')) return 'site_engineer'
  if (d.includes('design') || d.includes('drm') || d.includes('architect') || d.includes('visualizer')) return 'designer'
  if (d.includes('presales') || d.includes('sales')) return 'sales_executive'
  if (d.includes('finance') || d.includes('account')) return 'finance'
  if (d.includes('hr') || d.includes('recruiter') || d.includes('operations')) return 'operations'
  return 'viewer'
}

// Department name mapping (Excel department → department code)
const DEPT_NAME_TO_CODE = {
  'management': 'MNG',
  'sales & design': 'SALES',
  'operations': 'EXECUTION',
  'operations & procurement': 'PROCUREMENT',
  'human resources & admin': 'HR',
  'hr & admin': 'HR',
  'finance & accounts': 'FINANCE',
  'finance': 'FINANCE',
  'marketing': 'MARKETING',
  'infromation technology': 'IT',
  'information technology': 'IT',
  'sales': 'SALES',
  'design': 'DESIGN',
  'project execution': 'EXECUTION',
  'quality control': 'QC',
  'planning': 'EXECUTION',
  'presales': 'PRE_SALES',
  'house keeping': 'ADMIN',
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

// Management designations → MNG department
const MANAGEMENT_DESIGNATIONS = ['group ceo', 'director', 'ceo', 'cbo', 'coo', 'cfo', 'cmo', 'cto']

async function seedEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // ============================================
    // Find the Excel file
    // ============================================
    const excelPath = process.argv[2]
    if (!excelPath) {
      console.error('Usage: node backend/scripts/seedEmployeesFromExcel.js <path-to-excel-file>')
      console.error('Example: node backend/scripts/seedEmployeesFromExcel.js "/path/to/Employee Master.xlsx"')
      process.exit(1)
    }

    console.log(`Reading Excel file: ${excelPath}`)
    const workbook = XLSX.readFile(excelPath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet)

    console.log(`Sheet: "${sheetName}", Total rows: ${data.length}`)
    if (data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]).join(', '))
    }

    // Filter valid rows (must have EMP ID and Name)
    const validData = data.filter(r => {
      const empId = r['EMP ID'] || r['Emp ID'] || r['Emp Id'] || r['emp id']
      const name = r['Name'] || r['name'] || r['Employee Name']
      return empId && name
    })
    console.log(`Valid employees: ${validData.length}`)

    if (validData.length === 0) {
      console.error('No valid employee rows found. Check column headers (need "EMP ID" and "Name").')
      process.exit(1)
    }

    // ============================================
    // STEP 0: Look up companies
    // ============================================
    let ipCompany = await Company.findById(IP_COMPANY_ID)
    let hohCompany = await Company.findById(HOH_COMPANY_ID)

    // Fallback lookup by code if IDs don't match
    if (!ipCompany) ipCompany = await Company.findOne({ code: 'IP' })
    if (!hohCompany) hohCompany = await Company.findOne({ code: 'HOH' })

    if (!ipCompany && !hohCompany) {
      // Try any company
      ipCompany = await Company.findOne({})
      console.warn('WARNING: Could not find IP or HOH companies by ID/code. Using first available company.')
    }

    const defaultCompany = ipCompany || hohCompany
    console.log(`IP Company: ${ipCompany ? `${ipCompany.name} (${ipCompany._id})` : 'NOT FOUND'}`)
    console.log(`HOH Company: ${hohCompany ? `${hohCompany.name} (${hohCompany._id})` : 'NOT FOUND'}`)

    // ============================================
    // STEP 1: Ensure default roles exist for both companies
    // ============================================
    console.log('\n--- Ensuring Default Roles ---')
    if (ipCompany) {
      const ipRoles = await Role.createDefaultRoles(ipCompany._id)
      console.log(`IP: Created ${ipRoles.length} new roles`)
    }
    if (hohCompany) {
      const hohRoles = await Role.createDefaultRoles(hohCompany._id)
      console.log(`HOH: Created ${hohRoles.length} new roles`)
    }

    // Build role lookup maps (by company)
    const ipRolesByCode = {}
    const hohRolesByCode = {}
    if (ipCompany) {
      const ipRoles = await Role.find({ company: ipCompany._id, isActive: true })
      for (const r of ipRoles) ipRolesByCode[r.roleCode] = r
    }
    if (hohCompany) {
      const hohRoles = await Role.find({ company: hohCompany._id, isActive: true })
      for (const r of hohRoles) hohRolesByCode[r.roleCode] = r
    }

    // ============================================
    // STEP 2: Hash default password
    // ============================================
    const salt = await bcrypt.genSalt(10)
    const defaultPassword = await bcrypt.hash('Welcome@123', salt)

    // ============================================
    // STEP 3: Process each employee
    // ============================================
    console.log('\n--- Processing Employees ---')

    let created = 0, skipped = 0, failed = 0
    const errors = []
    const employeeMap = new Map()
    const managerNameMap = new Map()

    // Helper to get cell value by trying multiple header variations
    function getCell(row, ...keys) {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k]
      }
      return null
    }

    for (const row of validData) {
      const empId = getCell(row, 'EMP ID', 'Emp ID', 'Emp Id', 'emp id')
      const name = getCell(row, 'Name', 'name', 'Employee Name')
      const department = getCell(row, 'Department', 'department', 'Dept')
      const systemRole = getCell(row, 'System Role', 'system role', 'Designation', 'designation')
      const permissionRole = getCell(row, 'Permission Role', 'permission role', 'Role')
      const entity = getCell(row, 'Entity', 'entity')
      const email = getCell(row, 'Email', 'email', 'Email Address')
      const phone = getCell(row, 'Phone', 'phone', 'Mobile', 'Phone Number')
      const doj = getCell(row, 'DOJ', 'doj', 'Date of Joining', 'Joining Date')
      const city = getCell(row, 'City', 'city', 'Branch', 'branch')
      const gender = getCell(row, 'Gender', 'gender')
      const empType = getCell(row, 'Employment Type', 'employment type', 'Emp Type')
      const state = getCell(row, 'State', 'state')
      const reportingManager = getCell(row, 'Reporting Manager Name', 'Reporting Manager', 'reporting manager')

      if (!empId || !name) {
        skipped++
        continue
      }

      // Generate email if not provided
      const finalEmail = email || generateEmail(name.trim(), empId)

      // Check if email already exists
      const existingUser = await User.findOne({ email: finalEmail.toLowerCase() })
      if (existingUser) {
        console.log(`  SKIP: ${empId} ${name} - email exists (${finalEmail})`)
        skipped++
        // Still store in map for manager resolution
        employeeMap.set(empId, existingUser)
        managerNameMap.set(name.trim().toLowerCase(), existingUser)
        continue
      }

      // Map System Role → base role
      let role = mapSystemRoleToBaseRole(systemRole, permissionRole)
      if (!role) {
        role = mapDesignationToRole(systemRole || '')
      }

      // Map Permission Role → userRole (Role ObjectId)
      let userRoleId = undefined
      if (permissionRole) {
        const roleCode = PERMISSION_ROLE_TO_CODE[permissionRole.replace(/\s+/g, ' ').toLowerCase().trim()]
        if (roleCode) {
          // Look up in the correct company's roles
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

      // Handle Entity → company assignment
      let assignedCompany = defaultCompany._id
      let additionalCompanies = undefined
      const entityUpper = (entity || '').toUpperCase().trim()

      if (entityUpper === 'IP' && ipCompany) {
        assignedCompany = ipCompany._id
      } else if (entityUpper === 'HOH' && hohCompany) {
        assignedCompany = hohCompany._id
      } else if (entityUpper === 'BOTH') {
        assignedCompany = hohCompany ? hohCompany._id : defaultCompany._id
        if (ipCompany) {
          additionalCompanies = [{ company: ipCompany._id, role }]
        }
      } else if (ipCompany) {
        assignedCompany = ipCompany._id
      }

      // Map department
      let deptCode = department || ''
      const deptLower = (department || '').replace(/\s+/g, ' ').toLowerCase().trim()
      if (DEPT_NAME_TO_CODE[deptLower]) {
        deptCode = DEPT_NAME_TO_CODE[deptLower]
      }
      // Override for top management
      if (MANAGEMENT_DESIGNATIONS.includes((systemRole || '').toLowerCase().trim())) {
        deptCode = 'MNG'
      }

      // Employment type
      let employmentType = 'permanent'
      if (empType) {
        const et = empType.toLowerCase().trim()
        if (['probation', 'permanent', 'contract', 'intern', 'consultant'].includes(et)) {
          employmentType = et
        }
      }

      // Gender
      let genderVal = undefined
      if (gender) {
        const g = gender.toLowerCase().trim()
        if (['male', 'female', 'other'].includes(g)) genderVal = g
      }

      // Date of joining
      let dateOfJoining = undefined
      if (doj) {
        if (typeof doj === 'number') {
          dateOfJoining = excelDateToJS(doj)
        } else {
          const parsed = new Date(doj)
          if (!isNaN(parsed.getTime())) dateOfJoining = parsed
        }
      }

      try {
        const employeeData = {
          userId: empId,
          name: name.trim(),
          email: finalEmail.toLowerCase(),
          phone: phone ? String(phone) : '',
          password: defaultPassword,
          company: assignedCompany,
          role,
          userRole: userRoleId,
          department: deptCode,
          designation: systemRole || '',
          isActive: true,
          isEmployee: true,
          hrDetails: {
            employmentType,
            dateOfJoining,
            city: city || '',
            showroom: city || '',
            branchCode: city ? city.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) : '',
            gender: genderVal,
            permanentAddress: {
              state: state || '',
              country: 'India'
            },
            currentAddress: {
              city: city || '',
              state: state || '',
              country: 'India'
            }
          }
        }

        if (additionalCompanies) {
          employeeData.additionalCompanies = additionalCompanies
        }

        const user = await User.create(employeeData)
        created++
        employeeMap.set(empId, user)
        managerNameMap.set(name.trim().toLowerCase(), user)

        // Store name variations for manager lookup
        const nameParts = name.trim().split(/\s+/)
        if (nameParts.length > 1) {
          managerNameMap.set(nameParts[0].toLowerCase(), user)
        }

        const entityLabel = entityUpper || 'IP(default)'
        const roleLabel = permissionRole ? `${role} / ${permissionRole}` : role
        console.log(`  OK: ${empId} ${name} → ${entityLabel}, ${roleLabel}`)
      } catch (err) {
        failed++
        errors.push({ empId, name, error: err.message })
        console.error(`  FAIL: ${empId} ${name} → ${err.message}`)
      }
    }

    // ============================================
    // STEP 4: Set Reporting Managers (second pass)
    // ============================================
    console.log('\n--- Setting Reporting Managers ---')

    let managersSet = 0, managersNotFound = 0
    const notFoundManagers = new Set()

    for (const row of validData) {
      const empId = getCell(row, 'EMP ID', 'Emp ID', 'Emp Id', 'emp id')
      const managerName = getCell(row, 'Reporting Manager Name', 'Reporting Manager', 'reporting manager')

      if (!empId || !managerName) continue

      const user = employeeMap.get(empId)
      if (!user) continue

      const normalizedManagerName = managerName.trim().toLowerCase()
      let manager = managerNameMap.get(normalizedManagerName)

      // Try variations
      if (!manager) {
        const cleanName = normalizedManagerName.replace(/\s+/g, ' ')
        manager = managerNameMap.get(cleanName)
      }
      if (!manager) {
        const firstName = normalizedManagerName.split(/\s+/)[0]
        manager = managerNameMap.get(firstName)
      }
      if (!manager) {
        manager = await User.findOne({
          name: { $regex: new RegExp(managerName.split(/\s+/)[0], 'i') }
        })
      }

      if (manager && manager._id.toString() !== user._id.toString()) {
        await User.updateOne(
          { _id: user._id },
          { $set: { reportsTo: manager._id } }
        )
        managersSet++
      } else if (!manager) {
        notFoundManagers.add(managerName)
        managersNotFound++
      }
    }

    console.log(`Managers set: ${managersSet}, Not found: ${managersNotFound}`)
    if (notFoundManagers.size > 0) {
      console.log('Managers not found:')
      for (const n of notFoundManagers) console.log(`  - ${n}`)
    }

    // ============================================
    // STEP 5: Update Department Statistics
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
    console.log(`Total valid records in Excel: ${validData.length}`)
    console.log(`Employees created: ${created}`)
    console.log(`Employees skipped (existing): ${skipped}`)
    console.log(`Employees failed: ${failed}`)
    console.log(`Reporting managers set: ${managersSet}`)
    if (errors.length > 0) {
      console.log('\nErrors:')
      for (const e of errors) {
        console.log(`  ${e.empId} ${e.name}: ${e.error}`)
      }
    }
    console.log('========================================')
    console.log('Default password for all new employees: Welcome@123')
    console.log('========================================')

    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seedEmployees()
