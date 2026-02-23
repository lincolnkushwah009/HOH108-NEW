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
import Department from '../models/Department.js'
import Company from '../models/Company.js'

// Excel date conversion (Excel dates are days since 1900-01-01)
function excelDateToJS(excelDate) {
  if (!excelDate || typeof excelDate !== 'number') return null
  const date = new Date((excelDate - 25569) * 86400 * 1000)
  return date
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

// Map designation to role
function mapDesignationToRole(designation) {
  const d = designation?.toLowerCase() || ''

  if (d.includes('ceo') || d.includes('group ceo') || d.includes('director')) {
    return 'super_admin'
  }
  if (d.includes('cbo') || d.includes('coo') || d.includes('cfo') || d.includes('cmo') || d.includes('cto')) {
    return 'company_admin'
  }
  if (d.includes('head of') || d.includes('agm') || d.includes('manager') && !d.includes('associate')) {
    return 'sales_manager'
  }
  if (d.includes('project manager') || d.includes('junior project manager')) {
    return 'project_manager'
  }
  if (d.includes('site') || d.includes('engineer') || d.includes('supervisor')) {
    return 'site_engineer'
  }
  if (d.includes('design') || d.includes('drm') || d.includes('adrm') || d.includes('architect') || d.includes('visualizer')) {
    return 'designer'
  }
  if (d.includes('presales') || d.includes('sales') || d.includes('associate sales')) {
    return 'sales_executive'
  }
  if (d.includes('finance') || d.includes('executive')) {
    return 'finance'
  }
  if (d.includes('hr') || d.includes('recruiter')) {
    return 'operations'
  }

  return 'viewer'
}

// Map department name to code
function getDepartmentCode(deptName) {
  const codeMap = {
    'Sales & Design': 'SALES_DESIGN',
    'Operations & Procurement': 'OPS_PROC',
    'HR & Admin': 'HR_ADMIN',
    'Finance': 'FIN',
    'Marketing': 'MKT',
    'Infromation Technology': 'IT',
    'Information Technology': 'IT',
    'Sales': 'SALES',
    'Design': 'DESIGN',
    'Project Execution': 'PROJ_EXEC',
    'Quality Control': 'QC',
    'Planning': 'PLANNING',
    'Planning ': 'PLANNING',
    'Presales': 'PRESALES',
    'House Keeping': 'HOUSEKEEP',
    'Human Resources': 'HR',
    'Digital Marketing': 'DIGI_MKT',
    'Channel Sales': 'CH_SALES',
    'Business Intelligence': 'BI',
    'Business Development': 'BD',
    'IT': 'IT',
    'IT ': 'IT',
    'HR': 'HR'
  }
  return codeMap[deptName] || deptName?.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10) || 'GENERAL'
}

async function importData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Read Excel file
    const workbook = XLSX.readFile('/Users/lincolnkushwah/Downloads/Reporting Structure.xlsx')
    const sheet = workbook.Sheets['Sheet1']
    const data = XLSX.utils.sheet_to_json(sheet)

    // Filter valid rows only
    const validData = data.filter(r => r['EMP ID'] && r['Name'])
    console.log(`Found ${validData.length} valid employees in Excel`)

    // Get the company (HOH108)
    let company = await Company.findOne({ name: { $regex: /interior/i } })
    if (!company) {
      company = await Company.findOne({ name: { $regex: /hoh/i } })
    }
    if (!company) {
      company = await Company.findOne({})
    }
    if (!company) {
      console.error('No company found! Please create a company first.')
      process.exit(1)
    }
    console.log(`Using company: ${company.name} (${company._id})`)

    // ============================================
    // STEP 0: Delete old employees (except superadmin)
    // ============================================
    console.log('\n--- Deleting Old Employees ---')
    const deleteResult = await User.deleteMany({
      company: company._id,
      userId: { $regex: /^HOHIP/ },
      email: { $ne: 'superadmin@hoh108.com' }
    })
    console.log(`Deleted ${deleteResult.deletedCount} old employees`)

    // Default password (hashed)
    const salt = await bcrypt.genSalt(10)
    const defaultPassword = await bcrypt.hash('Welcome@123', salt)

    // ============================================
    // STEP 1: Map Excel departments to correct codes
    // ============================================
    console.log('\n--- Department Mapping ---')

    // Map Excel department names to correct department codes
    const excelToDeptCode = {
      'Sales & Design': 'SALES',
      'Operations & Procurement': 'PROCUREMENT',
      'HR & Admin': 'HR',
      'Finance': 'FINANCE',
      'Marketing': 'MARKETING',
      'Infromation Technology': 'IT',
      'Information Technology': 'IT',
      'Sales': 'SALES',
      'Design': 'DESIGN',
      'Project Execution': 'EXECUTION',
      'Quality Control': 'QC',
      'Planning': 'EXECUTION',
      'Planning ': 'EXECUTION',
      'Presales': 'PRE_SALES',
      'House Keeping': 'ADMIN',
      'Human Resources': 'HR',
      'HR': 'HR',
      'Digital Marketing': 'MARKETING',
      'Channel Sales': 'CHANNEL_SALES',
      'Business Intelligence': 'BI',
      'Business Development': 'BD',
      'IT': 'IT',
      'IT ': 'IT'
    }

    // Get unique departments from Excel
    const uniqueExcelDepts = [...new Set(validData.map(r => r.Department).filter(Boolean))]
    console.log('Excel departments found:', uniqueExcelDepts.length)
    uniqueExcelDepts.forEach(d => console.log(`  ${d} -> ${excelToDeptCode[d] || 'UNKNOWN'}`))

    // ============================================
    // STEP 2: First Pass - Create All Employees
    // ============================================
    console.log('\n--- Creating Employees ---')

    const employeeMap = new Map() // empId -> User document
    const managerNameMap = new Map() // name -> User document
    let created = 0, skipped = 0

    // Management designations that should be in MNG department
    const managementDesignations = ['Group CEO', 'Director', 'CEO', 'CBO', 'COO', 'CFO', 'CMO', 'CTO']

    for (const row of validData) {
      const empId = row['EMP ID']
      const name = row['Name']

      if (!empId || !name) {
        skipped++
        continue
      }

      const email = generateEmail(name, empId)
      const designation = row['Designation'] || ''
      const excelDept = row['Department'] || ''
      const branch = row['Branch'] || ''
      const state = row['State'] || ''
      const doj = excelDateToJS(row['DOJ'])

      // Map to correct department code
      let deptCode = excelToDeptCode[excelDept] || 'SALES'

      // Override to MNG for top management
      if (managementDesignations.includes(designation)) {
        deptCode = 'MNG'
      }

      const userData = {
        userId: empId,
        name: name.trim(),
        email: email,
        phone: '',
        company: company._id,
        role: mapDesignationToRole(designation),
        department: deptCode,
        designation: designation,
        isActive: true,
        isEmployee: true,
        hrDetails: {
          dateOfJoining: doj,
          city: branch,
          showroom: branch,
          branchCode: branch ? branch.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) : '',
          employmentType: 'permanent',
          permanentAddress: {
            state: state,
            country: 'India'
          },
          currentAddress: {
            city: branch,
            state: state,
            country: 'India'
          }
        }
      }

      // Create new user
      userData.password = defaultPassword
      const user = await User.create(userData)
      created++

      employeeMap.set(empId, user)

      // Store by name for manager mapping
      const normalizedName = name.trim().toLowerCase()
      managerNameMap.set(normalizedName, user)

      // Also store variations of the name
      const nameParts = name.trim().split(/\s+/)
      if (nameParts.length > 1) {
        // First name + first letter of last name
        managerNameMap.set(`${nameParts[0].toLowerCase()} ${nameParts[1][0].toLowerCase()}`, user)
        // Just first name
        managerNameMap.set(nameParts[0].toLowerCase(), user)
      }
    }

    console.log(`Created: ${created}, Skipped: ${skipped}`)

    // ============================================
    // STEP 3: Second Pass - Set Reporting Managers
    // ============================================
    console.log('\n--- Setting Reporting Managers ---')

    let managersSet = 0, managersNotFound = 0
    const notFoundManagers = new Set()

    for (const row of validData) {
      const empId = row['EMP ID']
      const managerName = row['Reporting Manager Name']

      if (!empId || !managerName) continue

      const user = employeeMap.get(empId)
      if (!user) continue

      // Find manager by name
      const normalizedManagerName = managerName.trim().toLowerCase()
      let manager = managerNameMap.get(normalizedManagerName)

      // Try variations if not found
      if (!manager) {
        // Try with different spacing
        const cleanName = normalizedManagerName.replace(/\s+/g, ' ')
        manager = managerNameMap.get(cleanName)
      }

      if (!manager) {
        // Try first name only
        const firstName = normalizedManagerName.split(/\s+/)[0]
        manager = managerNameMap.get(firstName)
      }

      if (!manager) {
        // Try database lookup
        manager = await User.findOne({
          company: company._id,
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
      console.log('\nManagers not found:')
      for (const name of notFoundManagers) {
        console.log(`  - ${name}`)
      }
    }

    // ============================================
    // STEP 4: Update Department Statistics
    // ============================================
    console.log('\n--- Updating Department Statistics ---')

    const allDepts = await Department.find({ company: company._id })
    for (const dept of allDepts) {
      const count = await User.countDocuments({
        company: company._id,
        department: dept.code,
        isActive: true
      })

      await Department.updateOne(
        { _id: dept._id },
        { $set: { 'stats.totalEmployees': count, 'stats.activeEmployees': count } }
      )
      if (count > 0) {
        console.log(`${dept.code} (${dept.name}): ${count} employees`)
      }
    }

    // ============================================
    // Summary
    // ============================================
    console.log('\n========================================')
    console.log('IMPORT SUMMARY')
    console.log('========================================')
    console.log(`Total valid records in Excel: ${validData.length}`)
    console.log(`Employees created: ${created}`)
    console.log(`Employees skipped: ${skipped}`)
    console.log(`Reporting managers set: ${managersSet}`)
    console.log('========================================')
    console.log('\nDefault password for all new employees: Welcome@123')
    console.log('========================================')

    process.exit(0)
  } catch (error) {
    console.error('Import error:', error)
    process.exit(1)
  }
}

importData()
