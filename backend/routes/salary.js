import express from 'express'
import User from '../models/User.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  requireModulePermission,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All routes protected
router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('salary_management', 'view'))

/**
 * @desc    Get employee salary details
 * @route   GET /api/salary/:employeeId
 * @access  Private (HR/Admin)
 */
router.get('/:employeeId',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.employeeId)
        .select('name email designation department salary')
        .populate('department', 'name')

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      res.json({
        success: true,
        data: employee
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
 * @desc    Update employee salary structure
 * @route   PUT /api/salary/:employeeId
 * @access  Private (HR/Admin)
 */
router.put('/:employeeId',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.employeeId)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      const {
        basicSalary,
        hra,
        otherAllowances,
        deductions,
        employerContributions,
        config,
        reason
      } = req.body

      // Calculate derived values
      const grossSalary = (basicSalary || 0) + (hra || 0) + (otherAllowances || 0)

      // Employee deductions
      const epfoEmployee = config?.epfoApplicable ? Math.round(basicSalary * 0.12) : 0
      const esicEmployee = config?.esicApplicable && grossSalary <= 21000 ? Math.round(grossSalary * 0.0075) : 0
      const professionalTax = deductions?.professionalTax || 200 // Default PT
      const incomeTax = deductions?.incomeTax || 0
      const otherDeductions = deductions?.otherDeductions || 0

      const totalDeductions = epfoEmployee + esicEmployee + professionalTax + incomeTax + otherDeductions
      const netSalaryBeforeIT = grossSalary - (epfoEmployee + esicEmployee + professionalTax + otherDeductions)
      const netSalary = grossSalary - totalDeductions

      // Employer contributions
      const epfoEmployer = config?.epfoApplicable ? Math.round(basicSalary * 0.12) : 0
      const esicEmployer = config?.esicApplicable && grossSalary <= 21000 ? Math.round(grossSalary * 0.0325) : 0
      const gratuity = employerContributions?.gratuity || Math.round(basicSalary * 0.0481) // 4.81% of basic
      const otherContributions = employerContributions?.otherContributions || 0

      const totalEmployerContribution = epfoEmployer + esicEmployer + gratuity + otherContributions
      const ctc = grossSalary + totalEmployerContribution

      // Store previous salary in history if salary exists
      if (employee.salary && employee.salary.basicSalary > 0) {
        if (!employee.salary.history) {
          employee.salary.history = []
        }
        employee.salary.history.push({
          effectiveFrom: employee.salary.lastUpdated || new Date(),
          effectiveTo: new Date(),
          basicSalary: employee.salary.basicSalary,
          grossSalary: employee.salary.grossSalary,
          ctc: employee.salary.ctc,
          reason: reason || 'Salary revision',
          approvedBy: req.user._id,
          createdAt: new Date()
        })
      }

      // Update salary structure
      employee.salary = {
        basicSalary,
        hra,
        otherAllowances,
        grossSalary,
        deductions: {
          epfoEmployee,
          esicEmployee,
          professionalTax,
          incomeTax,
          otherDeductions
        },
        netSalaryBeforeIT,
        netSalary,
        employerContributions: {
          epfoEmployer,
          esicEmployer,
          gratuity,
          otherContributions
        },
        ctc,
        config: {
          epfoApplicable: config?.epfoApplicable ?? true,
          esicApplicable: config?.esicApplicable ?? false,
          ptState: config?.ptState || 'Maharashtra',
          pfAccountNumber: config?.pfAccountNumber,
          uanNumber: config?.uanNumber,
          esicNumber: config?.esicNumber,
          panNumber: config?.panNumber,
          bankAccountNumber: config?.bankAccountNumber,
          bankName: config?.bankName,
          ifscCode: config?.ifscCode
        },
        history: employee.salary?.history || [],
        lastUpdated: new Date()
      }

      await employee.save()

      res.json({
        success: true,
        data: employee.salary,
        message: 'Salary updated successfully'
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
 * @desc    Get salary slip for an employee
 * @route   GET /api/salary/:employeeId/slip
 * @access  Private
 */
router.get('/:employeeId/slip',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const { month, year } = req.query

      const targetMonth = parseInt(month) || new Date().getMonth()
      const targetYear = parseInt(year) || new Date().getFullYear()

      const employee = await User.findById(req.params.employeeId)
        .select('name email designation department employeeId salary dateOfJoining')
        .populate('department', 'name')
        .populate('company', 'name address')

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      if (!employee.salary || !employee.salary.basicSalary) {
        return res.status(400).json({
          success: false,
          message: 'Salary not configured for this employee'
        })
      }

      // Generate salary slip data
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

      const slipData = {
        employee: {
          name: employee.name,
          employeeId: employee.employeeId,
          designation: employee.designation,
          department: employee.department?.name || 'N/A',
          dateOfJoining: employee.dateOfJoining,
          panNumber: employee.salary.config?.panNumber,
          uanNumber: employee.salary.config?.uanNumber,
          bankAccount: employee.salary.config?.bankAccountNumber,
          bankName: employee.salary.config?.bankName
        },
        company: employee.company,
        period: {
          month: monthNames[targetMonth],
          year: targetYear,
          daysInMonth: new Date(targetYear, targetMonth + 1, 0).getDate(),
          workingDays: 26 // Can be calculated based on attendance
        },
        earnings: {
          basicSalary: employee.salary.basicSalary,
          hra: employee.salary.hra,
          otherAllowances: employee.salary.otherAllowances,
          grossSalary: employee.salary.grossSalary
        },
        deductions: {
          epfoEmployee: employee.salary.deductions?.epfoEmployee || 0,
          esicEmployee: employee.salary.deductions?.esicEmployee || 0,
          professionalTax: employee.salary.deductions?.professionalTax || 0,
          incomeTax: employee.salary.deductions?.incomeTax || 0,
          otherDeductions: employee.salary.deductions?.otherDeductions || 0,
          totalDeductions: (employee.salary.deductions?.epfoEmployee || 0) +
            (employee.salary.deductions?.esicEmployee || 0) +
            (employee.salary.deductions?.professionalTax || 0) +
            (employee.salary.deductions?.incomeTax || 0) +
            (employee.salary.deductions?.otherDeductions || 0)
        },
        netSalary: employee.salary.netSalary,
        employerContributions: {
          epfoEmployer: employee.salary.employerContributions?.epfoEmployer || 0,
          esicEmployer: employee.salary.employerContributions?.esicEmployer || 0,
          gratuity: employee.salary.employerContributions?.gratuity || 0
        },
        ctc: employee.salary.ctc,
        generatedAt: new Date()
      }

      res.json({
        success: true,
        data: slipData
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
 * @desc    Get all employees with salary for payroll
 * @route   GET /api/salary
 * @access  Private (HR/Admin)
 */
router.get('/',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const { department, search, page = 1, limit = 20 } = req.query

      const query = {
        company: req.activeCompany._id,
        isActive: true,
        isEmployee: true // Only show employees in salary management
      }

      if (department) query.department = department

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
        ]
      }

      const total = await User.countDocuments(query)

      const employees = await User.find(query)
        .select('name email employeeId designation department salary isActive')
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

      res.json({
        success: true,
        data: employees,
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
 * @desc    Get salary history for an employee
 * @route   GET /api/salary/:employeeId/history
 * @access  Private
 */
router.get('/:employeeId/history',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.employeeId)
        .select('name salary.history')
        .populate('salary.history.approvedBy', 'name')

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      res.json({
        success: true,
        data: employee.salary?.history || []
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
// SALARY DEDUCTIONS MANAGEMENT
// ============================================

/**
 * @desc    Add/Update custom deduction for employee
 * @route   PUT /api/salary/:employeeId/deductions
 * @access  Private (HR/Admin)
 */
router.put('/:employeeId/deductions',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const {
        deductionType,
        amount,
        description,
        effectiveFrom,
        effectiveTo,
        isRecurring,
        frequency,
        maxInstallments,
        reason
      } = req.body

      const employee = await User.findById(req.params.employeeId)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      // Initialize salary if not exists
      if (!employee.salary) {
        employee.salary = { deductions: {} }
      }

      if (!employee.salary.customDeductions) {
        employee.salary.customDeductions = []
      }

      // Add custom deduction
      const deduction = {
        deductionType, // loan_recovery, advance_recovery, salary_advance, insurance, union_fees, other
        amount: parseFloat(amount),
        description,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        isRecurring: isRecurring || false,
        frequency: frequency || 'monthly', // monthly, one_time
        maxInstallments: maxInstallments || null,
        currentInstallment: 0,
        totalDeducted: 0,
        reason,
        isActive: true,
        createdBy: req.user._id,
        createdAt: new Date()
      }

      employee.salary.customDeductions.push(deduction)
      await employee.save()

      res.json({
        success: true,
        data: deduction,
        message: 'Deduction added successfully'
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
 * @desc    Get all deductions for an employee
 * @route   GET /api/salary/:employeeId/deductions
 * @access  Private
 */
router.get('/:employeeId/deductions',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.employeeId)
        .select('name salary.deductions salary.customDeductions')
        .populate('salary.customDeductions.createdBy', 'name')

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      // Standard deductions
      const standardDeductions = {
        epfoEmployee: employee.salary?.deductions?.epfoEmployee || 0,
        esicEmployee: employee.salary?.deductions?.esicEmployee || 0,
        professionalTax: employee.salary?.deductions?.professionalTax || 0,
        incomeTax: employee.salary?.deductions?.incomeTax || 0,
        otherDeductions: employee.salary?.deductions?.otherDeductions || 0
      }

      // Custom deductions
      const customDeductions = employee.salary?.customDeductions || []

      // Calculate totals
      const standardTotal = Object.values(standardDeductions).reduce((sum, val) => sum + (val || 0), 0)
      const customTotal = customDeductions
        .filter(d => d.isActive)
        .reduce((sum, d) => sum + (d.amount || 0), 0)

      res.json({
        success: true,
        data: {
          standardDeductions,
          customDeductions,
          summary: {
            standardTotal,
            customTotal,
            totalDeductions: standardTotal + customTotal
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
 * @desc    Update custom deduction
 * @route   PUT /api/salary/:employeeId/deductions/:deductionId
 * @access  Private (HR/Admin)
 */
router.put('/:employeeId/deductions/:deductionId',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { amount, description, effectiveTo, isActive, reason } = req.body

      const employee = await User.findById(req.params.employeeId)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      const deduction = employee.salary?.customDeductions?.find(
        d => d._id.toString() === req.params.deductionId
      )

      if (!deduction) {
        return res.status(404).json({
          success: false,
          message: 'Deduction not found'
        })
      }

      // Update fields
      if (amount !== undefined) deduction.amount = parseFloat(amount)
      if (description !== undefined) deduction.description = description
      if (effectiveTo !== undefined) deduction.effectiveTo = effectiveTo ? new Date(effectiveTo) : null
      if (isActive !== undefined) deduction.isActive = isActive
      if (reason !== undefined) deduction.reason = reason

      deduction.updatedBy = req.user._id
      deduction.updatedAt = new Date()

      await employee.save()

      res.json({
        success: true,
        data: deduction,
        message: 'Deduction updated successfully'
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
 * @desc    Delete/Deactivate custom deduction
 * @route   DELETE /api/salary/:employeeId/deductions/:deductionId
 * @access  Private (HR/Admin)
 */
router.delete('/:employeeId/deductions/:deductionId',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const employee = await User.findById(req.params.employeeId)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      const deductionIndex = employee.salary?.customDeductions?.findIndex(
        d => d._id.toString() === req.params.deductionId
      )

      if (deductionIndex === -1 || deductionIndex === undefined) {
        return res.status(404).json({
          success: false,
          message: 'Deduction not found'
        })
      }

      // Soft delete - mark as inactive
      employee.salary.customDeductions[deductionIndex].isActive = false
      employee.salary.customDeductions[deductionIndex].deactivatedBy = req.user._id
      employee.salary.customDeductions[deductionIndex].deactivatedAt = new Date()

      await employee.save()

      res.json({
        success: true,
        message: 'Deduction deactivated successfully'
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
 * @desc    Record deduction applied in payroll
 * @route   POST /api/salary/:employeeId/deductions/:deductionId/record
 * @access  Private (HR/Admin)
 */
router.post('/:employeeId/deductions/:deductionId/record',
  requirePermission(PERMISSIONS.USERS_EDIT),
  async (req, res) => {
    try {
      const { payrollMonth, amountDeducted, remarks } = req.body

      const employee = await User.findById(req.params.employeeId)

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      const deduction = employee.salary?.customDeductions?.find(
        d => d._id.toString() === req.params.deductionId
      )

      if (!deduction) {
        return res.status(404).json({
          success: false,
          message: 'Deduction not found'
        })
      }

      // Update deduction record
      deduction.currentInstallment = (deduction.currentInstallment || 0) + 1
      deduction.totalDeducted = (deduction.totalDeducted || 0) + parseFloat(amountDeducted)

      // Add to history
      if (!deduction.history) {
        deduction.history = []
      }

      deduction.history.push({
        payrollMonth,
        amountDeducted: parseFloat(amountDeducted),
        installmentNumber: deduction.currentInstallment,
        recordedBy: req.user._id,
        recordedAt: new Date(),
        remarks
      })

      // Check if deduction is complete
      if (deduction.maxInstallments && deduction.currentInstallment >= deduction.maxInstallments) {
        deduction.isActive = false
        deduction.completedAt = new Date()
      }

      await employee.save()

      res.json({
        success: true,
        data: deduction,
        message: `Deduction of ₹${amountDeducted} recorded for ${payrollMonth}`
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
 * @desc    Get salary slip with all deductions
 * @route   GET /api/salary/:employeeId/slip-detailed
 * @access  Private
 */
router.get('/:employeeId/slip-detailed',
  requirePermission(PERMISSIONS.USERS_VIEW),
  async (req, res) => {
    try {
      const { month, year } = req.query

      const targetMonth = parseInt(month) || new Date().getMonth()
      const targetYear = parseInt(year) || new Date().getFullYear()

      const employee = await User.findById(req.params.employeeId)
        .select('name email designation department employeeId salary hrDetails')
        .populate('company', 'name address')

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        })
      }

      if (!employee.salary || !employee.salary.basicSalary) {
        return res.status(400).json({
          success: false,
          message: 'Salary not configured for this employee'
        })
      }

      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']

      // Standard deductions
      const standardDeductions = [
        { name: 'PF (Employee)', amount: employee.salary.deductions?.epfoEmployee || 0 },
        { name: 'ESI (Employee)', amount: employee.salary.deductions?.esicEmployee || 0 },
        { name: 'Professional Tax', amount: employee.salary.deductions?.professionalTax || 0 },
        { name: 'Income Tax (TDS)', amount: employee.salary.deductions?.incomeTax || 0 }
      ]

      // Custom deductions (active ones)
      const customDeductions = (employee.salary.customDeductions || [])
        .filter(d => d.isActive)
        .map(d => ({
          name: d.description || d.deductionType,
          amount: d.amount,
          type: d.deductionType
        }))

      const allDeductions = [...standardDeductions, ...customDeductions]
      const totalDeductions = allDeductions.reduce((sum, d) => sum + (d.amount || 0), 0)

      const slipData = {
        employee: {
          name: employee.name,
          employeeId: employee.employeeId,
          designation: employee.designation,
          department: employee.department,
          dateOfJoining: employee.hrDetails?.dateOfJoining,
          panNumber: employee.salary.config?.panNumber,
          uanNumber: employee.salary.config?.uanNumber,
          bankAccount: employee.salary.config?.bankAccountNumber,
          bankName: employee.salary.config?.bankName
        },
        company: employee.company,
        period: {
          month: monthNames[targetMonth],
          year: targetYear,
          daysInMonth: new Date(targetYear, targetMonth + 1, 0).getDate()
        },
        earnings: {
          basicSalary: employee.salary.basicSalary,
          hra: employee.salary.hra,
          otherAllowances: employee.salary.otherAllowances,
          grossSalary: employee.salary.grossSalary
        },
        deductions: {
          standard: standardDeductions,
          custom: customDeductions,
          all: allDeductions,
          totalDeductions
        },
        netSalary: employee.salary.grossSalary - totalDeductions,
        employerContributions: {
          epfoEmployer: employee.salary.employerContributions?.epfoEmployer || 0,
          esicEmployer: employee.salary.employerContributions?.esicEmployer || 0,
          gratuity: employee.salary.employerContributions?.gratuity || 0
        },
        ctc: employee.salary.ctc,
        generatedAt: new Date()
      }

      res.json({
        success: true,
        data: slipData
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
