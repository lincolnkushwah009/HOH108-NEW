import express from 'express'
import Department from '../models/Department.js'
import User from '../models/User.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All routes protected
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get all departments
 * @route   GET /api/departments
 * @access  Private
 */
router.get('/',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const queryFilter = companyScopedQuery(req)

      const departments = await Department.find(queryFilter)
        .populate('head', 'name email avatar designation')
        .populate('parentDepartment', 'name code')
        .sort({ name: 1 })

      // Get employee counts
      const departmentsWithCounts = await Promise.all(
        departments.map(async (dept) => {
          const employeeCount = await User.countDocuments({
            company: dept.company,
            department: dept.code,
            isActive: true
          })

          return {
            ...dept.toObject(),
            employeeCount
          }
        })
      )

      res.json({
        success: true,
        data: departmentsWithCounts
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
 * @desc    Get single department
 * @route   GET /api/departments/:id
 * @access  Private
 */
router.get('/:id',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const department = await Department.findById(req.params.id)
        .populate('head', 'name email avatar designation')
        .populate('parentDepartment', 'name code')
        .populate('createdBy', 'name')

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        })
      }

      // Get employees in this department
      const employees = await User.find({
        company: department.company,
        department: department.code,
        isActive: true
      })
        .select('name email avatar designation role')
        .sort({ name: 1 })

      res.json({
        success: true,
        data: {
          ...department.toObject(),
          employees
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
 * @desc    Create department
 * @route   POST /api/departments
 * @access  Private (Admin)
 */
router.post('/',
  requirePermission(PERMISSIONS.COMPANY_MANAGE_SETTINGS),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      const departmentData = {
        ...req.body,
        company: companyId,
        createdBy: req.user._id
      }

      // Generate department ID
      const deptCount = await Department.countDocuments({ company: companyId })
      departmentData.departmentId = `${req.activeCompany.code}-D-${String(deptCount + 1).padStart(3, '0')}`

      const department = await Department.create(departmentData)

      res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully'
      })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Department code already exists in this company'
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
 * @desc    Update department
 * @route   PUT /api/departments/:id
 * @access  Private (Admin)
 */
router.put('/:id',
  requirePermission(PERMISSIONS.COMPANY_MANAGE_SETTINGS),
  async (req, res) => {
    try {
      const department = await Department.findById(req.params.id)

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        })
      }

      // Don't allow changing company
      const { company, ...updateData } = req.body

      Object.assign(department, updateData)
      await department.save()

      const updatedDept = await Department.findById(department._id)
        .populate('head', 'name email avatar')
        .populate('parentDepartment', 'name code')

      res.json({
        success: true,
        data: updatedDept,
        message: 'Department updated successfully'
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
 * @desc    Delete department
 * @route   DELETE /api/departments/:id
 * @access  Private (Admin)
 */
router.delete('/:id',
  requirePermission(PERMISSIONS.COMPANY_MANAGE_SETTINGS),
  async (req, res) => {
    try {
      const department = await Department.findById(req.params.id)

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        })
      }

      // Check if department has employees
      const employeeCount = await User.countDocuments({
        company: department.company,
        department: department.code
      })

      if (employeeCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete department with ${employeeCount} employees. Please reassign them first.`
        })
      }

      await department.deleteOne()

      res.json({
        success: true,
        message: 'Department deleted successfully'
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
 * @desc    Get department hierarchy
 * @route   GET /api/departments/structure/hierarchy
 * @access  Private
 */
router.get('/structure/hierarchy',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      const departments = await Department.find({
        company: companyId,
        isActive: true
      })
        .populate('head', 'name avatar')
        .lean()

      // Build hierarchy
      const buildHierarchy = (parentId = null) => {
        return departments
          .filter(d => {
            if (parentId === null) {
              return !d.parentDepartment
            }
            return d.parentDepartment?.toString() === parentId.toString()
          })
          .map(d => ({
            ...d,
            subDepartments: buildHierarchy(d._id)
          }))
      }

      const hierarchy = buildHierarchy()

      res.json({
        success: true,
        data: hierarchy
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

export default router
