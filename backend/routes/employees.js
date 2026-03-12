import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import User from '../models/User.js'
import Company from '../models/Company.js'
import Role from '../models/Role.js'
import Attendance from '../models/Attendance.js'
import Leave from '../models/Leave.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = `uploads/employees/${req.params.id || 'temp'}/documents`
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('Only images (jpeg, jpg, png) and documents (pdf, doc, docx) are allowed'))
  }
})

// All routes protected
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all employees (with HR details)
 * @route   GET /api/employees
 * @access  Private
 */
router.get('/',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    console.log('=== EMPLOYEES API HIT ===', req.query)
    try {
      const {
        department,
        role,
        status,
        search,
        employmentType,
        page = 1,
        limit = 20,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query

      // Build query with company scope
      const queryFilter = companyScopedQuery(req)

      // Only show employees (exclude non-employee system users)
      queryFilter.isEmployee = { $ne: false }

      if (department) {
        // Support case-insensitive department matching
        queryFilter.department = { $regex: new RegExp(`^${department}$`, 'i') }
        console.log('Department filter:', department, 'Query:', JSON.stringify(queryFilter))
      }
      if (role) queryFilter.role = role
      if (status === 'active') queryFilter.isActive = true
      if (status === 'inactive') queryFilter.isActive = false
      if (employmentType) queryFilter['hrDetails.employmentType'] = employmentType

      // Search
      if (search) {
        queryFilter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { designation: { $regex: search, $options: 'i' } },
          { empId: { $regex: search, $options: 'i' } },
          { userId: { $regex: search, $options: 'i' } },
          { systemRole: { $regex: search, $options: 'i' } },
          { branch: { $regex: search, $options: 'i' } }
        ]
      }

      const total = await User.countDocuments(queryFilter)

      const sortOptions = {}
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1

      const employees = await User.find(queryFilter)
        .select('-password -loginHistory -resetPasswordToken -inviteToken')
        .populate('company', 'name code')
        .populate('reportsTo', 'name email avatar designation')
        .populate('userRole', 'roleCode roleName')
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      // Get attendance summary for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const attendanceToday = await Attendance.find({
        employee: { $in: employees.map(e => e._id) },
        date: today
      }).select('employee status checkIn checkOut')

      // Attach attendance to employees
      const employeesWithAttendance = employees.map(emp => {
        const empObj = emp.toObject()
        const todayAttendance = attendanceToday.find(
          a => a.employee.toString() === emp._id.toString()
        )
        empObj.todayAttendance = todayAttendance || null
        return empObj
      })

      res.json({
        success: true,
        data: employeesWithAttendance,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Bulk upload employees from CSV
 * @route   POST /api/employees/bulk-upload
 * @access  Private (Admin)
 */
router.post('/bulk-upload',
  requirePermission(PERMISSIONS.USERS_CREATE),
  async (req, res) => {
    try {
      const { employees: employeeRows } = req.body
      const companyId = req.activeCompany._id

      if (!employeeRows || !Array.isArray(employeeRows) || employeeRows.length === 0) {
        return res.status(400).json({ success: false, message: 'No employee data provided' })
      }

      if (employeeRows.length > 200) {
        return res.status(400).json({ success: false, message: 'Maximum 200 employees per upload' })
      }

      const company = await Company.findById(companyId)
      if (!company) {
        return res.status(400).json({ success: false, message: 'Company not found' })
      }

      const results = { successful: 0, failed: 0, errors: [] }

      // Column name mapping (lowercase CSV header → model field)
      const columnMap = {
        name: 'name', 'employee name': 'name', 'full name': 'name', fullname: 'name',
        email: 'email', 'email address': 'email', emailaddress: 'email',
        phone: 'phone', 'phone number': 'phone', phonenumber: 'phone', mobile: 'phone',
        designation: 'designation', title: 'designation', 'job title': 'designation', jobtitle: 'designation',
        department: 'department', dept: 'department',
        role: 'role', 'system role': 'systemRole',
        'permission role': 'permissionRole',
        entity: 'entity',
        'emp id': 'empId',
        'employment type': 'employmentType', employmenttype: 'employmentType', 'emp type': 'employmentType',
        'date of joining': 'dateOfJoining', dateofjoining: 'dateOfJoining', doj: 'dateOfJoining', 'joining date': 'dateOfJoining',
        city: 'city', branch: 'city', location: 'city',
        gender: 'gender', sex: 'gender',
        region: 'region',
      }

      const validRoles = ['super_admin', 'company_admin', 'sales_manager', 'sales_executive', 'pre_sales', 'project_manager', 'site_engineer', 'designer', 'operations', 'finance', 'viewer']
      const validEmploymentTypes = ['probation', 'permanent', 'contract', 'intern', 'consultant']
      const validGenders = ['male', 'female', 'other']

      // Permission Role name → Role code mapping
      const permissionRoleToCode = {
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

      // System Role → base role mapping
      function mapSystemRoleToBaseRole(systemRole, permissionRole) {
        const s = (systemRole || '').replace(/\s+/g, ' ').toLowerCase().trim()
        const p = (permissionRole || '').replace(/\s+/g, ' ').toLowerCase().trim()

        if (['group ceo', 'director'].includes(s)) return 'super_admin'
        if (['ceo', 'cbo', 'coo', 'cfo', 'cmo', 'cto'].includes(s)) return 'company_admin'
        if (s === 'associate general manager') {
          // Depends on permission role
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
          // Disambiguate by permission role or department context
          if (p.includes('finance')) return 'finance'
          if (p.includes('hr')) return 'operations'
          return 'operations'
        }
        if (['financial controller', 'senior executive (finance)'].includes(s)) return 'finance'
        if (['csr & planner', 'business operations lead'].includes(s)) return 'operations'
        if (s === 'manager - channel sales') return 'sales_manager'
        if (['technical head', 'head of product engineering', 'junior programme manager', 'senior motion graphic designer'].includes(s)) return 'operations'
        return null // fallback handled below
      }

      // Legacy designation-based mapping as fallback
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

      // Department name → department code mapping
      const deptNameToCode = {
        'management': 'MNG',
        'sales & design': 'SALES',
        'operations': 'EXECUTION',
        'human resources & admin': 'HR',
        'finance & accounts': 'FINANCE',
        'marketing': 'MARKETING',
        'information technology': 'IT',
        'sales': 'SALES',
        'design': 'DESIGN',
        'project execution': 'EXECUTION',
        'quality control': 'QC',
        'planning': 'EXECUTION',
        'presales': 'PRE_SALES',
        'human resources': 'HR',
        'finance': 'FINANCE',
        'digital marketing': 'MARKETING',
        'channel sales': 'CHANNEL_SALES',
        'business intelligence': 'BI',
        'business development': 'BD',
        'administration': 'ADMIN',
        'hr': 'HR',
        'it': 'IT',
        'procurement': 'PROCUREMENT',
      }

      // Management designations that override to MNG department
      const managementDesignations = ['group ceo', 'director', 'ceo', 'cbo', 'coo', 'cfo', 'cmo', 'cto']

      const import_bcrypt = (await import('bcryptjs')).default
      const salt = await import_bcrypt.genSalt(10)
      const defaultPassword = await import_bcrypt.hash('Welcome@123', salt)

      // Pre-fetch all roles for the company for permission role lookup
      const allRoles = await Role.find({ company: companyId, isActive: true })
      const rolesByCode = {}
      for (const r of allRoles) {
        rolesByCode[r.roleCode] = r
      }

      // Look up both companies for entity handling
      const ipCompany = await Company.findOne({ code: 'IP' })
      const hohCompany = await Company.findOne({ code: 'HOH' })

      for (let i = 0; i < employeeRows.length; i++) {
        const row = employeeRows[i]

        // Normalize column names
        const normalized = {}
        for (const [key, value] of Object.entries(row)) {
          const mappedKey = columnMap[key.toLowerCase().trim()] || key.toLowerCase().trim()
          normalized[mappedKey] = typeof value === 'string' ? value.trim() : value
        }

        // Validate required fields
        if (!normalized.name) {
          results.failed++
          results.errors.push({ row: i + 1, error: 'Name is required' })
          continue
        }
        if (!normalized.email) {
          results.failed++
          results.errors.push({ row: i + 1, error: 'Email is required' })
          continue
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(normalized.email)) {
          results.failed++
          results.errors.push({ row: i + 1, error: `Invalid email: ${normalized.email}` })
          continue
        }

        try {
          // Check for duplicate email
          const existingUser = await User.findOne({ email: normalized.email.toLowerCase() })
          if (existingUser) {
            results.failed++
            results.errors.push({ row: i + 1, error: `Email already exists: ${normalized.email}` })
            continue
          }

          // Use EMP ID from sheet or generate one
          const employeeId = normalized.empId || await company.generateId('user')

          // Determine base role from System Role (Col G), with fallback to designation
          let role = 'viewer'
          if (normalized.systemRole) {
            const mappedRole = mapSystemRoleToBaseRole(normalized.systemRole, normalized.permissionRole)
            if (mappedRole) {
              role = mappedRole
            } else if (normalized.designation) {
              role = mapDesignationToRole(normalized.designation)
            }
          } else if (normalized.role && validRoles.includes(normalized.role.toLowerCase())) {
            role = normalized.role.toLowerCase()
          } else if (normalized.designation) {
            role = mapDesignationToRole(normalized.designation)
          }

          // Look up Permission Role → userRole (Role ObjectId)
          let userRoleId = undefined
          if (normalized.permissionRole) {
            const roleCode = permissionRoleToCode[normalized.permissionRole.replace(/\s+/g, ' ').toLowerCase().trim()]
            if (roleCode && rolesByCode[roleCode]) {
              userRoleId = rolesByCode[roleCode]._id
            }
          }

          // Handle Entity (Col I) → company assignment
          let assignedCompany = companyId
          let additionalCompanies = undefined
          const entity = (normalized.entity || '').toUpperCase().trim()

          if (entity === 'IP' && ipCompany) {
            assignedCompany = ipCompany._id
          } else if (entity === 'HOH' && hohCompany) {
            assignedCompany = hohCompany._id
          } else if (entity === 'BOTH') {
            // Primary = HOH (mother company), additional = IP
            if (hohCompany) assignedCompany = hohCompany._id
            if (ipCompany) {
              additionalCompanies = [{ company: ipCompany._id, role }]
            }
          } else if (!entity && ipCompany) {
            // Default to IP if no entity specified
            assignedCompany = ipCompany._id
          }

          // Normalize employment type
          let employmentType = 'probation'
          if (normalized.employmentType) {
            const et = normalized.employmentType.toLowerCase().trim()
            if (validEmploymentTypes.includes(et)) employmentType = et
          }

          // Normalize gender
          let gender = undefined
          if (normalized.gender) {
            const g = normalized.gender.toLowerCase().trim()
            if (validGenders.includes(g)) gender = g
          }

          // Map department name to code
          let deptCode = normalized.department || ''
          const deptLower = deptCode.toLowerCase().trim()
          if (deptNameToCode[deptLower]) {
            deptCode = deptNameToCode[deptLower]
          }
          // Override for top management
          if (normalized.systemRole && managementDesignations.includes(normalized.systemRole.toLowerCase().trim())) {
            deptCode = 'MNG'
          }

          const employeeData = {
            userId: employeeId,
            name: normalized.name,
            email: normalized.email.toLowerCase(),
            phone: normalized.phone || '',
            password: defaultPassword,
            company: assignedCompany,
            role,
            userRole: userRoleId,
            department: deptCode,
            designation: normalized.designation || normalized.systemRole || '',
            isActive: true,
            isEmployee: true,
            invitedBy: req.user._id,
            invitedAt: new Date(),
            hrDetails: {
              employmentType,
              dateOfJoining: normalized.dateOfJoining ? new Date(normalized.dateOfJoining) : undefined,
              city: normalized.city || '',
              gender,
              region: normalized.region || '',
            }
          }

          if (additionalCompanies) {
            employeeData.additionalCompanies = additionalCompanies
          }

          await User.create(employeeData)
          results.successful++
        } catch (err) {
          results.failed++
          results.errors.push({ row: i + 1, error: err.message })
        }
      }

      res.json({
        success: true,
        data: results,
        message: `${results.successful} employee(s) created successfully${results.failed > 0 ? `, ${results.failed} failed` : ''}`
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get single employee with full HR details
 * @route   GET /api/employees/:id
 * @access  Private
 */
router.get('/:id',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)
        .select('-password -loginHistory -resetPasswordToken -inviteToken')
        .populate('company', 'name code')
        .populate('reportsTo', 'name email avatar designation')
        .populate('additionalCompanies.company', 'name code')
        .populate('userRole', 'roleCode roleName permissions')

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      // Get leave balance
      const currentYear = new Date().getFullYear()
      const leaveBalance = await Leave.getBalance(
        employee._id,
        employee.company._id,
        currentYear
      )

      // Get attendance summary for current month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const attendanceSummary = await Attendance.getSummary(
        employee._id,
        startOfMonth,
        new Date()
      )

      // Get direct reports
      const directReports = await User.find({ reportsTo: employee._id })
        .select('name email avatar designation role isActive')

      // Get pending leaves
      const pendingLeaves = await Leave.find({
        employee: employee._id,
        status: 'pending'
      }).sort({ createdAt: -1 }).limit(5)

      res.json({
        success: true,
        data: {
          ...employee.toObject(),
          leaveBalance,
          attendanceSummary,
          directReports,
          pendingLeaves
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Create new employee
 * @route   POST /api/employees
 * @access  Private (Admin)
 */
router.post('/',
  requirePermission(PERMISSIONS.USERS_CREATE),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      // Get company for ID generation
      const company = await Company.findById(companyId)
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        })
      }

      // Generate employee ID
      const employeeId = await company.generateId('user')

      const employeeData = {
        ...req.body,
        userId: employeeId,
        company: companyId,
        invitedBy: req.user._id,
        invitedAt: new Date()
      }

      // Set default password if not provided
      if (!employeeData.password) {
        employeeData.password = 'Welcome@123' // Should be changed on first login
      }

      const employee = await User.create(employeeData)

      // Remove sensitive fields
      const employeeResponse = employee.toObject()
      delete employeeResponse.password

      res.status(201).json({
        success: true,
        data: employeeResponse,
        message: 'Employee created successfully'
      })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        })
      }
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Update employee
 * @route   PUT /api/employees/:id
 * @access  Private (Admin)
 */
router.put('/:id',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      // Don't allow updating password
      const { password, ...updateData } = req.body

      // Handle email update - check for duplicates
      if (updateData.email && updateData.email !== employee.email) {
        const existing = await User.findOne({ email: updateData.email, _id: { $ne: employee._id } })
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email already in use by another employee' })
        }
      }

      Object.assign(employee, updateData)
      await employee.save()

      const updatedEmployee = await User.findById(employee._id)
        .select('-password -loginHistory -resetPasswordToken -inviteToken')
        .populate('company', 'name code')
        .populate('reportsTo', 'name email avatar')
        .populate('userRole', 'roleCode roleName')

      res.json({
        success: true,
        data: updatedEmployee,
        message: 'Employee updated successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Update employee HR details
 * @route   PUT /api/employees/:id/hr
 * @access  Private (Admin)
 */
router.put('/:id/hr',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const {
        dateOfBirth,
        dateOfJoining,
        probationEndDate,
        confirmationDate,
        emergencyContact,
        bankDetails,
        documents,
        salary
      } = req.body

      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      // Update HR fields
      if (dateOfBirth) employee.hrDetails = { ...employee.hrDetails, dateOfBirth }
      if (dateOfJoining) employee.hrDetails = { ...employee.hrDetails, dateOfJoining }
      if (probationEndDate) employee.hrDetails = { ...employee.hrDetails, probationEndDate }
      if (confirmationDate) employee.hrDetails = { ...employee.hrDetails, confirmationDate }
      if (emergencyContact) employee.hrDetails = { ...employee.hrDetails, emergencyContact }
      if (bankDetails) employee.hrDetails = { ...employee.hrDetails, bankDetails }
      if (documents) employee.hrDetails = { ...employee.hrDetails, documents }
      if (salary) employee.hrDetails = { ...employee.hrDetails, salary }

      await employee.save()

      res.json({
        success: true,
        data: employee,
        message: 'HR details updated successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Delete employee
 * @route   DELETE /api/employees/:id
 * @access  Private (Admin)
 */
router.delete('/:id',
  requirePermission(PERMISSIONS.USERS_DELETE),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      // Prevent deleting yourself
      if (employee._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete yourself'
        })
      }

      // Prevent deleting super_admin
      if (employee.role === 'super_admin') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete super admin'
        })
      }

      await User.findByIdAndDelete(req.params.id)

      res.json({
        success: true,
        message: 'Employee deleted successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Toggle employee status (activate/deactivate)
 * @route   PUT /api/employees/:id/status
 * @access  Private (Admin)
 */
router.put('/:id/status',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      employee.isActive = !employee.isActive
      await employee.save()

      res.json({
        success: true,
        data: { isActive: employee.isActive },
        message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully`
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get employee attendance history
 * @route   GET /api/employees/:id/attendance
 * @access  Private
 */
router.get('/:id/attendance',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const { month, year } = req.query

      const targetYear = parseInt(year) || new Date().getFullYear()
      const targetMonth = parseInt(month) || new Date().getMonth()

      const startDate = new Date(targetYear, targetMonth, 1)
      const endDate = new Date(targetYear, targetMonth + 1, 0)

      const attendance = await Attendance.find({
        employee: req.params.id,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 })

      const summary = await Attendance.getSummary(req.params.id, startDate, endDate)

      res.json({
        success: true,
        data: {
          records: attendance,
          summary,
          period: {
            month: targetMonth,
            year: targetYear,
            startDate,
            endDate
          }
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get employee leave history
 * @route   GET /api/employees/:id/leaves
 * @access  Private
 */
router.get('/:id/leaves',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const { year, status } = req.query

      const targetYear = parseInt(year) || new Date().getFullYear()
      const startOfYear = new Date(targetYear, 0, 1)
      const endOfYear = new Date(targetYear, 11, 31)

      const query = {
        employee: req.params.id,
        startDate: { $gte: startOfYear, $lte: endOfYear }
      }

      if (status) query.status = status

      const leaves = await Leave.find(query)
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })

      const employee = await User.findById(req.params.id)
      const balance = await Leave.getBalance(
        req.params.id,
        employee.company,
        targetYear
      )

      res.json({
        success: true,
        data: {
          leaves,
          balance,
          year: targetYear
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get org chart / reporting structure
 * @route   GET /api/employees/org-chart
 * @access  Private
 */
router.get('/structure/org-chart',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      // Get all employees (exclude non-employees)
      const employees = await User.find({
        company: companyId,
        isActive: true,
        isEmployee: { $ne: false }
      })
        .select('name email avatar designation role department reportsTo')
        .lean()

      // Build hierarchy
      const buildHierarchy = (managerId = null) => {
        return employees
          .filter(e => {
            if (managerId === null) {
              return !e.reportsTo
            }
            return e.reportsTo?.toString() === managerId.toString()
          })
          .map(e => ({
            ...e,
            directReports: buildHierarchy(e._id)
          }))
      }

      const orgChart = buildHierarchy()

      res.json({
        success: true,
        data: orgChart
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get department wise employee count
 * @route   GET /api/employees/stats/by-department
 * @access  Private
 */
router.get('/stats/by-department',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      const stats = await User.aggregate([
        { $match: { company: companyId, isEmployee: { $ne: false } } },
        {
          $group: {
            _id: '$department',
            total: { $sum: 1 },
            active: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        },
        { $sort: { total: -1 } }
      ])

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Change employee password (Admin only)
 * @route   PUT /api/employees/:id/change-password
 * @access  Private (Admin)
 */
router.put('/:id/change-password',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { newPassword } = req.body

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password is required'
        })
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        })
      }

      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      // Update password (will be hashed by pre-save hook)
      employee.password = newPassword
      employee.passwordChangedAt = new Date()
      await employee.save()

      res.json({
        success: true,
        message: 'Password changed successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ============================================
// DOCUMENT UPLOAD & MANAGEMENT
// ============================================

/**
 * @desc    Upload employee document
 * @route   POST /api/employees/:id/documents
 * @access  Private (HR/Admin)
 */
router.post('/:id/documents',
  requirePermission(PERMISSIONS.USERS_EDIT),
  upload.single('document'),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a document'
        })
      }

      const {
        documentType,
        documentName,
        documentNumber,
        issuedDate,
        expiryDate,
        remarks
      } = req.body

      if (!documentType || !documentName) {
        return res.status(400).json({
          success: false,
          message: 'Document type and name are required'
        })
      }

      // Generate file URL
      const fileUrl = `/${req.file.path.replace(/\\/g, '/')}`

      const documentData = {
        documentType,
        documentName,
        documentNumber,
        fileName: req.file.filename,
        fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        issuedDate: issuedDate ? new Date(issuedDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
        remarks
      }

      if (!employee.documents) {
        employee.documents = []
      }

      employee.documents.push(documentData)
      await employee.save()

      res.status(201).json({
        success: true,
        data: documentData,
        message: 'Document uploaded successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get employee documents
 * @route   GET /api/employees/:id/documents
 * @access  Private
 */
router.get('/:id/documents',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)
        .select('documents documentVerificationStatus')
        .populate('documents.uploadedBy', 'name')
        .populate('documents.verifiedBy', 'name')

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      // Group documents by type
      const groupedDocuments = {}
      employee.documents?.forEach(doc => {
        if (!groupedDocuments[doc.documentType]) {
          groupedDocuments[doc.documentType] = []
        }
        groupedDocuments[doc.documentType].push(doc)
      })

      res.json({
        success: true,
        data: {
          documents: employee.documents || [],
          groupedDocuments,
          verificationStatus: employee.documentVerificationStatus
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Delete employee document
 * @route   DELETE /api/employees/:id/documents/:documentId
 * @access  Private (HR/Admin)
 */
router.delete('/:id/documents/:documentId',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      const documentIndex = employee.documents?.findIndex(
        doc => doc._id.toString() === req.params.documentId
      )

      if (documentIndex === -1 || documentIndex === undefined) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        })
      }

      // Remove file from filesystem
      const document = employee.documents[documentIndex]
      if (document.fileUrl) {
        const filePath = document.fileUrl.replace(/^\//, '')
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }

      employee.documents.splice(documentIndex, 1)
      await employee.save()

      res.json({
        success: true,
        message: 'Document deleted successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Verify employee document
 * @route   PUT /api/employees/:id/documents/:documentId/verify
 * @access  Private (HR/Admin)
 */
router.put('/:id/documents/:documentId/verify',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      const document = employee.documents?.find(
        doc => doc._id.toString() === req.params.documentId
      )

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        })
      }

      document.isVerified = true
      document.verifiedBy = req.user._id
      document.verifiedAt = new Date()

      // Update verification status
      const verifiedCount = employee.documents.filter(d => d.isVerified).length
      const totalDocs = employee.documents.length

      if (!employee.documentVerificationStatus) {
        employee.documentVerificationStatus = {}
      }

      if (verifiedCount === totalDocs) {
        employee.documentVerificationStatus.status = 'complete'
      } else if (verifiedCount > 0) {
        employee.documentVerificationStatus.status = 'partial'
      }
      employee.documentVerificationStatus.lastUpdated = new Date()
      employee.documentVerificationStatus.verifiedBy = req.user._id

      await employee.save()

      res.json({
        success: true,
        data: document,
        message: 'Document verified successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get T-2 document checklist for onboarding
 * @route   GET /api/employees/:id/documents/t2-checklist
 * @access  Private
 */
router.get('/:id/documents/t2-checklist',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)
        .select('documents documentVerificationStatus')

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      // T-2 Required Documents for Onboarding
      const t2RequiredDocs = [
        { type: 'aadhar_card', name: 'Aadhar Card', mandatory: true },
        { type: 'pan_card', name: 'PAN Card', mandatory: true },
        { type: 'photo', name: 'Passport Size Photo', mandatory: true },
        { type: 'resume', name: 'Resume/CV', mandatory: true },
        { type: 'education_certificate_10th', name: '10th Certificate', mandatory: true },
        { type: 'education_certificate_12th', name: '12th Certificate', mandatory: true },
        { type: 'education_certificate_graduation', name: 'Graduation Certificate', mandatory: false },
        { type: 'relieving_letter_prev', name: 'Previous Employer Relieving Letter', mandatory: false },
        { type: 'experience_letter_prev', name: 'Previous Experience Letters', mandatory: false },
        { type: 'salary_slip_prev', name: 'Last 3 Months Salary Slips', mandatory: false },
        { type: 'bank_passbook', name: 'Bank Passbook First Page', mandatory: true },
        { type: 'cancelled_cheque', name: 'Cancelled Cheque', mandatory: true },
        { type: 'address_proof', name: 'Address Proof', mandatory: true },
        { type: 'pf_form', name: 'PF Form', mandatory: false },
        { type: 'form_11', name: 'Form 11 (PF Declaration)', mandatory: false },
        { type: 'form_2_nomination', name: 'Form 2 (PF Nomination)', mandatory: false },
        { type: 'gratuity_nomination', name: 'Gratuity Nomination Form', mandatory: false }
      ]

      // Check which documents are submitted
      const checklist = t2RequiredDocs.map(reqDoc => {
        const submitted = employee.documents?.find(d => d.documentType === reqDoc.type)
        return {
          ...reqDoc,
          isSubmitted: !!submitted,
          isVerified: submitted?.isVerified || false,
          submittedDoc: submitted || null
        }
      })

      const stats = {
        total: t2RequiredDocs.length,
        mandatory: t2RequiredDocs.filter(d => d.mandatory).length,
        submitted: checklist.filter(d => d.isSubmitted).length,
        verified: checklist.filter(d => d.isVerified).length,
        mandatorySubmitted: checklist.filter(d => d.mandatory && d.isSubmitted).length,
        mandatoryVerified: checklist.filter(d => d.mandatory && d.isVerified).length,
        completionPercentage: Math.round((checklist.filter(d => d.mandatory && d.isSubmitted).length / t2RequiredDocs.filter(d => d.mandatory).length) * 100)
      }

      res.json({
        success: true,
        data: {
          checklist,
          stats
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ============================================
// PROBATION TO PERMANENT TRANSFORMATION
// ============================================

/**
 * @desc    Get employees due for confirmation (6 months probation)
 * @route   GET /api/employees/probation/due-for-confirmation
 * @access  Private (HR/Admin)
 */
router.get('/probation/due-for-confirmation',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id
      const today = new Date()

      // Find employees in probation whose 6 months are complete or will be complete in next 30 days
      const sixMonthsAgo = new Date(today)
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const thirtyDaysFromNow = new Date(today)
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const employees = await User.find({
        company: companyId,
        isActive: true,
        isEmployee: { $ne: false },
        'hrDetails.employmentType': 'probation',
        'hrDetails.dateOfJoining': { $lte: thirtyDaysFromNow }
      })
        .select('name email avatar designation department hrDetails')
        .sort({ 'hrDetails.dateOfJoining': 1 })

      // Calculate days in probation for each
      const employeesWithStatus = employees.map(emp => {
        const joiningDate = emp.hrDetails?.dateOfJoining
        const probationEndDate = emp.hrDetails?.probationEndDate ||
          (joiningDate ? new Date(new Date(joiningDate).setMonth(new Date(joiningDate).getMonth() + 6)) : null)

        const daysInProbation = joiningDate ?
          Math.floor((today - new Date(joiningDate)) / (1000 * 60 * 60 * 24)) : 0

        const daysUntilConfirmation = probationEndDate ?
          Math.floor((new Date(probationEndDate) - today) / (1000 * 60 * 60 * 24)) : null

        return {
          ...emp.toObject(),
          probationDetails: {
            joiningDate,
            probationEndDate,
            daysInProbation,
            daysUntilConfirmation,
            isOverdue: daysUntilConfirmation !== null && daysUntilConfirmation < 0,
            isDueSoon: daysUntilConfirmation !== null && daysUntilConfirmation >= 0 && daysUntilConfirmation <= 30
          }
        }
      })

      res.json({
        success: true,
        data: employeesWithStatus,
        summary: {
          total: employeesWithStatus.length,
          overdue: employeesWithStatus.filter(e => e.probationDetails.isOverdue).length,
          dueSoon: employeesWithStatus.filter(e => e.probationDetails.isDueSoon).length
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Confirm employee (Probation to Permanent)
 * @route   PUT /api/employees/:id/confirm
 * @access  Private (HR/Admin)
 */
router.put('/:id/confirm',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { confirmationDate, remarks, newSalary } = req.body

      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      if (employee.hrDetails?.employmentType === 'permanent') {
        return res.status(400).json({
          success: false,
          message: 'Employee is already confirmed as permanent'
        })
      }

      // Update employment status
      if (!employee.hrDetails) {
        employee.hrDetails = {}
      }

      employee.hrDetails.employmentType = 'permanent'
      employee.hrDetails.confirmationDate = confirmationDate ? new Date(confirmationDate) : new Date()

      // Update salary if provided
      if (newSalary && employee.salary) {
        // Store in history
        if (!employee.salary.history) {
          employee.salary.history = []
        }

        if (employee.salary.basicSalary > 0) {
          employee.salary.history.push({
            effectiveFrom: employee.salary.lastUpdated || new Date(),
            effectiveTo: new Date(),
            basicSalary: employee.salary.basicSalary,
            grossSalary: employee.salary.grossSalary,
            ctc: employee.salary.ctc,
            reason: 'confirmation',
            approvedBy: req.user._id,
            createdAt: new Date()
          })
        }

        // Update with new salary (basic component)
        employee.salary.basicSalary = newSalary.basicSalary || employee.salary.basicSalary
        employee.salary.hra = newSalary.hra || employee.salary.hra
        employee.salary.otherAllowances = newSalary.otherAllowances || employee.salary.otherAllowances
        employee.salary.lastUpdated = new Date()

        // Recalculate derived fields
        employee.salary.grossSalary =
          (employee.salary.basicSalary || 0) +
          (employee.salary.hra || 0) +
          (employee.salary.otherAllowances || 0)
      }

      await employee.save()

      res.json({
        success: true,
        data: employee,
        message: 'Employee confirmed as permanent successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Extend probation period
 * @route   PUT /api/employees/:id/extend-probation
 * @access  Private (HR/Admin)
 */
router.put('/:id/extend-probation',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { extensionMonths, newProbationEndDate, reason } = req.body

      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      if (!employee.hrDetails) {
        employee.hrDetails = {}
      }

      // Calculate new probation end date
      let newEndDate
      if (newProbationEndDate) {
        newEndDate = new Date(newProbationEndDate)
      } else if (extensionMonths) {
        const currentEndDate = employee.hrDetails.probationEndDate || new Date()
        newEndDate = new Date(currentEndDate)
        newEndDate.setMonth(newEndDate.getMonth() + parseInt(extensionMonths))
      } else {
        return res.status(400).json({
          success: false,
          message: 'Please provide extension months or new probation end date'
        })
      }

      employee.hrDetails.probationEndDate = newEndDate
      employee.hrDetails.probationExtensionReason = reason

      await employee.save()

      res.json({
        success: true,
        data: employee,
        message: `Probation extended until ${newEndDate.toLocaleDateString()}`
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Update employee HR details (including city/showroom assignment)
 * @route   PUT /api/employees/:id/hr-details
 * @access  Private (HR/Admin)
 */
router.put('/:id/hr-details',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      const {
        dateOfBirth,
        gender,
        bloodGroup,
        maritalStatus,
        nationality,
        permanentAddress,
        currentAddress,
        emergencyContact,
        dateOfJoining,
        probationEndDate,
        employmentType,
        city,
        showroom,
        branchCode,
        previousExperience
      } = req.body

      if (!employee.hrDetails) {
        employee.hrDetails = {}
      }

      // Update HR details
      if (dateOfBirth) employee.hrDetails.dateOfBirth = new Date(dateOfBirth)
      if (gender) employee.hrDetails.gender = gender
      if (bloodGroup) employee.hrDetails.bloodGroup = bloodGroup
      if (maritalStatus) employee.hrDetails.maritalStatus = maritalStatus
      if (nationality) employee.hrDetails.nationality = nationality
      if (permanentAddress) employee.hrDetails.permanentAddress = permanentAddress
      if (currentAddress) employee.hrDetails.currentAddress = currentAddress
      if (emergencyContact) employee.hrDetails.emergencyContact = emergencyContact
      if (dateOfJoining) employee.hrDetails.dateOfJoining = new Date(dateOfJoining)
      if (probationEndDate) employee.hrDetails.probationEndDate = new Date(probationEndDate)
      if (employmentType) employee.hrDetails.employmentType = employmentType
      if (city) employee.hrDetails.city = city
      if (showroom) employee.hrDetails.showroom = showroom
      if (branchCode) employee.hrDetails.branchCode = branchCode
      if (previousExperience !== undefined) employee.hrDetails.previousExperience = previousExperience

      await employee.save()

      res.json({
        success: true,
        data: employee.hrDetails,
        message: 'HR details updated successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get employees by city/showroom
 * @route   GET /api/employees/by-location
 * @access  Private
 */
router.get('/by-location',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const { city, showroom } = req.query
      const companyId = req.activeCompany._id

      const query = {
        company: companyId,
        isActive: true,
        isEmployee: { $ne: false }
      }

      if (city) query['hrDetails.city'] = city
      if (showroom) query['hrDetails.showroom'] = showroom

      const employees = await User.find(query)
        .select('name email avatar designation department hrDetails.city hrDetails.showroom')
        .sort({ name: 1 })

      // Group by city and showroom
      const byCity = {}
      const byShowroom = {}

      employees.forEach(emp => {
        const empCity = emp.hrDetails?.city || 'Unassigned'
        const empShowroom = emp.hrDetails?.showroom || 'Unassigned'

        if (!byCity[empCity]) byCity[empCity] = []
        byCity[empCity].push(emp)

        if (!byShowroom[empShowroom]) byShowroom[empShowroom] = []
        byShowroom[empShowroom].push(emp)
      })

      res.json({
        success: true,
        data: {
          employees,
          byCity,
          byShowroom,
          summary: {
            cities: Object.keys(byCity).length,
            showrooms: Object.keys(byShowroom).length,
            totalEmployees: employees.length
          }
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ============================================
// MODULE PERMISSIONS ROUTES
// ============================================

/**
 * @desc    Get module permissions for an employee
 * @route   GET /api/employees/:id/module-permissions
 * @access  Private
 */
router.get('/:id/module-permissions',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.id)
        .select('empId name email entity systemRole modulePermissions')

      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' })
      }

      // Group permissions by module
      const { MODULE_GROUPS } = await import('../models/User.js')
      const grouped = {}
      for (const [moduleName, keys] of Object.entries(MODULE_GROUPS)) {
        grouped[moduleName] = {}
        for (const key of keys) {
          const perm = employee.modulePermissions?.[key]
          grouped[moduleName][key] = {
            view: perm?.view || false,
            edit: perm?.edit || false
          }
        }
      }

      res.json({
        success: true,
        data: {
          employee: {
            _id: employee._id,
            empId: employee.empId,
            name: employee.name,
            email: employee.email,
            entity: employee.entity,
            systemRole: employee.systemRole
          },
          permissions: grouped,
          raw: employee.modulePermissions
        }
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

/**
 * @desc    Update module permissions for an employee
 * @route   PUT /api/employees/:id/module-permissions
 * @access  Private (Admin)
 */
router.put('/:id/module-permissions',
  requirePermission(PERMISSIONS.USERS_MANAGE_ROLES),
  async (req, res) => {
    try {
      const { permissions } = req.body

      if (!permissions || typeof permissions !== 'object') {
        return res.status(400).json({ success: false, message: 'permissions object required' })
      }

      const employee = await User.findById(req.params.id)
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' })
      }

      // Build update object for modulePermissions
      const updateData = {}
      for (const [key, val] of Object.entries(permissions)) {
        if (val && typeof val === 'object') {
          if (val.view !== undefined) updateData[`modulePermissions.${key}.view`] = !!val.view
          if (val.edit !== undefined) updateData[`modulePermissions.${key}.edit`] = !!val.edit
        }
      }

      await User.updateOne({ _id: employee._id }, { $set: updateData })

      res.json({
        success: true,
        message: `Module permissions updated for ${employee.name}`
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

/**
 * @desc    Check if current user has a specific module permission
 * @route   GET /api/employees/me/check-permission/:functionKey/:accessType
 * @access  Private
 */
router.get('/me/check-permission/:functionKey/:accessType',
  async (req, res) => {
    try {
      const { functionKey, accessType } = req.params
      const user = await User.findById(req.user._id).select('modulePermissions entity')

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }

      const perm = user.modulePermissions?.[functionKey]
      const hasAccess = perm ? !!(accessType === 'edit' ? perm.edit : perm.view) : false

      res.json({
        success: true,
        data: {
          functionKey,
          accessType,
          hasAccess,
          entity: user.entity
        }
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

/**
 * @desc    Get current user's full module permissions
 * @route   GET /api/employees/me/module-permissions
 * @access  Private
 */
router.get('/me/module-permissions',
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select('empId name entity modulePermissions')

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }

      const { MODULE_GROUPS } = await import('../models/User.js')
      const grouped = {}
      for (const [moduleName, keys] of Object.entries(MODULE_GROUPS)) {
        grouped[moduleName] = {}
        for (const key of keys) {
          const perm = user.modulePermissions?.[key]
          grouped[moduleName][key] = {
            view: perm?.view || false,
            edit: perm?.edit || false
          }
        }
      }

      res.json({
        success: true,
        data: {
          empId: user.empId,
          name: user.name,
          entity: user.entity,
          permissions: grouped
        }
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

export default router
