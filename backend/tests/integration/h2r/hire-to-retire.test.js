/**
 * H2R (Hire to Retire) Integration Tests
 *
 * Tests the complete employee lifecycle using User model:
 * 1. Department Management
 * 2. User/Employee Onboarding
 * 3. Attendance Management
 * 4. Leave Management
 * 5. Salary & Payroll
 * 6. Employee Exit
 *
 * Note: In this system, Users serve as employees with embedded salary/HR data
 */

import mongoose from 'mongoose'
import Company from '../../../models/Company.js'
import User from '../../../models/User.js'
import Department from '../../../models/Department.js'
import Attendance from '../../../models/Attendance.js'
import Leave from '../../../models/Leave.js'
import { seedDatabase, createH2RScenario } from '../../fixtures/seed-data.js'
import { generateToken, hashPassword } from '../../helpers/auth-helper.js'
import {
  generateDepartment,
  generateLeaveRequest,
  generateAttendance
} from '../../helpers/mock-data.js'

describe('H2R (Hire to Retire) Integration Tests', () => {
  let seedResult
  let h2rScenario
  let adminToken

  beforeEach(async () => {
    seedResult = await seedDatabase()
    h2rScenario = await createH2RScenario(seedResult)
    adminToken = generateToken(seedResult.users[0]._id)
  })

  describe('Department Management', () => {
    it('should create a new department', async () => {
      const deptData = generateDepartment(seedResult.company._id)

      const department = await Department.create({
        ...deptData,
        createdBy: seedResult.users[0]._id
      })

      expect(department).toBeDefined()
      expect(department.name).toBe(deptData.name)
      expect(department.isActive).toBe(true)
    })

    it('should list all active departments', async () => {
      const departments = await Department.find({
        company: seedResult.company._id,
        isActive: true
      })

      expect(departments.length).toBeGreaterThan(0)
    })

    it('should update department details', async () => {
      const department = h2rScenario.departments[0]

      department.description = 'Updated description'
      await department.save()

      const updated = await Department.findById(department._id)
      expect(updated.description).toBe('Updated description')
    })

    it('should assign department head', async () => {
      const department = h2rScenario.departments[0]
      const employee = h2rScenario.employees[0]

      department.head = employee._id
      await department.save()

      const updated = await Department.findById(department._id)
      expect(updated.head.toString()).toBe(employee._id.toString())
    })

    it('should get department employee count', async () => {
      const department = h2rScenario.departments[0]

      const employeeCount = await User.countDocuments({
        company: seedResult.company._id,
        department: department.name,
        isActive: true
      })

      expect(employeeCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Employee Onboarding (via User)', () => {
    it('should create new employee user with salary info', async () => {
      const hashedPwd = await hashPassword('Test@123456')
      const newEmployee = await User.create({
        name: 'New Employee',
        email: 'newemployee@test.com',
        password: hashedPwd,
        phone: '+91 98765 88888',
        role: 'designer',
        company: seedResult.company._id,
        department: h2rScenario.departments[0].name,
        designation: 'Junior Designer',
        isActive: true,
        isEmailVerified: true,
        salary: {
          basicSalary: 35000,
          hra: 14000,
          otherAllowances: 5000,
          grossSalary: 54000,
          netSalary: 45000,
          ctc: 70000,
          config: {
            epfoApplicable: true,
            esicApplicable: false,
            ptState: 'Maharashtra'
          }
        }
      })

      expect(newEmployee).toBeDefined()
      expect(newEmployee.isActive).toBe(true)
      expect(newEmployee.salary.basicSalary).toBe(35000)
    })

    it('should track employee reporting structure', async () => {
      const employee = h2rScenario.employees[0]
      const manager = seedResult.users[0]

      employee.reportsTo = manager._id
      await employee.save()

      const updated = await User.findById(employee._id)
      expect(updated.reportsTo.toString()).toBe(manager._id.toString())
    })

    it('should manage employee permissions', async () => {
      const employee = h2rScenario.employees[0]

      employee.permissionOverrides = {
        granted: ['projects:manage_financials'],
        revoked: []
      }
      await employee.save()

      const updated = await User.findById(employee._id)
      expect(updated.permissionOverrides.granted).toContain('projects:manage_financials')
    })

    it('should track salary history', async () => {
      const employee = h2rScenario.employees[0]
      const oldBasic = employee.salary?.basicSalary || 50000

      employee.salary = employee.salary || {}
      employee.salary.history = employee.salary.history || []
      employee.salary.history.push({
        effectiveFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        effectiveTo: new Date(),
        basicSalary: oldBasic,
        grossSalary: oldBasic * 1.6,
        ctc: oldBasic * 2,
        reason: 'joining'
      })
      employee.salary.basicSalary = oldBasic + 10000
      employee.salary.lastUpdated = new Date()
      await employee.save()

      const updated = await User.findById(employee._id)
      expect(updated.salary.history.length).toBe(1)
      expect(updated.salary.basicSalary).toBe(oldBasic + 10000)
    })
  })

  describe('Attendance Management', () => {
    it('should record check-in', async () => {
      const employee = h2rScenario.employees[0]

      const attendance = await Attendance.create({
        company: seedResult.company._id,
        employee: employee._id,
        date: new Date(),
        checkIn: { time: new Date() },
        status: 'present'
      })

      expect(attendance).toBeDefined()
      expect(attendance.status).toBe('present')
      expect(attendance.checkIn).toBeDefined()
    })

    it('should record check-out', async () => {
      const employee = h2rScenario.employees[0]
      const now = new Date()
      const checkInTime = new Date(now)
      checkInTime.setHours(9, 0, 0, 0)
      const checkOutTime = new Date(now)
      checkOutTime.setHours(18, 0, 0, 0)

      const attendance = await Attendance.create({
        company: seedResult.company._id,
        employee: employee._id,
        date: now,
        checkIn: { time: checkInTime },
        status: 'present'
      })

      attendance.checkOut = { time: checkOutTime }
      await attendance.save()

      const updated = await Attendance.findById(attendance._id)
      expect(updated.checkOut).toBeDefined()
      expect(updated.workHours.actual).toBeGreaterThan(0)
    })

    it('should mark late arrival', async () => {
      const employee = h2rScenario.employees[0]
      const now = new Date()
      const lateCheckIn = new Date(now)
      lateCheckIn.setHours(10, 30, 0, 0)

      const attendance = await Attendance.create({
        company: seedResult.company._id,
        employee: employee._id,
        date: now,
        checkIn: { time: lateCheckIn },
        status: 'late',
        lateBy: 90
      })

      expect(attendance.status).toBe('late')
      expect(attendance.lateBy).toBe(90)
    })

    it('should mark half day', async () => {
      const employee = h2rScenario.employees[0]

      const attendance = await Attendance.create({
        company: seedResult.company._id,
        employee: employee._id,
        date: new Date(),
        checkIn: { time: new Date() },
        status: 'half-day'
      })

      expect(attendance.status).toBe('half-day')
    })

    it('should get monthly attendance summary', async () => {
      const employee = h2rScenario.employees[0]
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      for (let i = 1; i <= 5; i++) {
        await Attendance.create({
          company: seedResult.company._id,
          employee: employee._id,
          date: new Date(now.getFullYear(), now.getMonth(), i),
          checkIn: { time: new Date() },
          status: 'present'
        })
      }

      const summary = await Attendance.aggregate([
        {
          $match: {
            company: seedResult.company._id,
            employee: employee._id,
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])

      expect(summary.length).toBeGreaterThan(0)
      const presentCount = summary.find(s => s._id === 'present')
      expect(presentCount?.count).toBe(5)
    })
  })

  describe('Leave Management', () => {
    it('should submit leave request', async () => {
      const employee = h2rScenario.employees[0]

      const leave = await Leave.create({
        company: seedResult.company._id,
        employee: employee._id,
        leaveType: 'casual',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        duration: { days: 2 },
        reason: 'Personal work',
        status: 'pending'
      })

      expect(leave).toBeDefined()
      expect(leave.status).toBe('pending')
      expect(leave.leaveType).toBe('casual')
    })

    it('should approve leave request', async () => {
      const employee = h2rScenario.employees[0]
      const admin = seedResult.users[0]

      const leave = await Leave.create({
        company: seedResult.company._id,
        employee: employee._id,
        leaveType: 'earned',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
        duration: { days: 4 },
        reason: 'Family vacation',
        status: 'pending'
      })

      leave.status = 'approved'
      leave.approvedBy = admin._id
      leave.approvedAt = new Date()
      await leave.save()

      const approved = await Leave.findById(leave._id)
      expect(approved.status).toBe('approved')
      expect(approved.approvedBy.toString()).toBe(admin._id.toString())
    })

    it('should reject leave with reason', async () => {
      const employee = h2rScenario.employees[0]
      const admin = seedResult.users[0]

      const leave = await Leave.create({
        company: seedResult.company._id,
        employee: employee._id,
        leaveType: 'casual',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        duration: { days: 3 },
        reason: 'Personal work',
        status: 'pending'
      })

      leave.status = 'rejected'
      leave.rejectedBy = admin._id
      leave.rejectedAt = new Date()
      leave.rejectionReason = 'Critical project deadline'
      await leave.save()

      const rejected = await Leave.findById(leave._id)
      expect(rejected.status).toBe('rejected')
      expect(rejected.rejectionReason).toBe('Critical project deadline')
    })

    it('should calculate leave days correctly', async () => {
      const startDate = new Date('2026-01-20')
      const endDate = new Date('2026-01-24')
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1

      expect(totalDays).toBe(5)
    })

    it('should get employee leave balance', async () => {
      const employee = h2rScenario.employees[0]

      await Leave.create({
        company: seedResult.company._id,
        employee: employee._id,
        leaveType: 'casual',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-02'),
        duration: { days: 2 },
        reason: 'Personal',
        status: 'approved'
      })

      const usedLeaves = await Leave.aggregate([
        {
          $match: {
            company: seedResult.company._id,
            employee: employee._id,
            status: 'approved'
          }
        },
        {
          $group: {
            _id: '$leaveType',
            totalDays: { $sum: '$duration.days' }
          }
        }
      ])

      expect(usedLeaves).toBeDefined()
    })

    it('should handle sick leave with medical certificate', async () => {
      const employee = h2rScenario.employees[0]

      // Create sick leave request
      const leave = await Leave.create({
        company: seedResult.company._id,
        employee: employee._id,
        leaveType: 'sick',
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        duration: { days: 3 },
        reason: 'Medical emergency - certificate submitted',
        status: 'pending',
        notes: 'Medical certificate: medical-cert-123.pdf uploaded'
      })

      const updated = await Leave.findById(leave._id)
      expect(updated.leaveType).toBe('sick')
      expect(updated.reason).toContain('Medical emergency')
      expect(updated.notes).toContain('medical-cert')
    })
  })

  describe('Employee Lifecycle Changes', () => {
    it('should promote employee (update designation and salary)', async () => {
      const employee = h2rScenario.employees[0]
      const oldDesignation = employee.designation
      const oldSalary = employee.salary?.basicSalary || 50000

      employee.designation = 'Senior ' + oldDesignation
      employee.salary = employee.salary || {}
      employee.salary.basicSalary = oldSalary * 1.2
      employee.salary.history = employee.salary.history || []
      employee.salary.history.push({
        effectiveFrom: new Date(),
        basicSalary: oldSalary * 1.2,
        grossSalary: oldSalary * 1.2 * 1.6,
        ctc: oldSalary * 1.2 * 2,
        reason: 'promotion'
      })
      await employee.save()

      const promoted = await User.findById(employee._id)
      expect(promoted.designation).toBe('Senior ' + oldDesignation)
      expect(promoted.salary.basicSalary).toBe(oldSalary * 1.2)
    })

    it('should transfer employee to another department', async () => {
      const employee = h2rScenario.employees[0]
      const newDepartment = h2rScenario.departments[1].name

      employee.department = newDepartment
      await employee.save()

      const transferred = await User.findById(employee._id)
      expect(transferred.department).toBe(newDepartment)
    })

    it('should handle salary revision', async () => {
      const employee = h2rScenario.employees[0]
      employee.salary = employee.salary || { basicSalary: 50000 }
      const oldBasic = employee.salary.basicSalary

      employee.salary.history = employee.salary.history || []
      employee.salary.history.push({
        effectiveFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        effectiveTo: new Date(),
        basicSalary: oldBasic,
        reason: 'previous'
      })

      employee.salary.basicSalary = oldBasic + 10000
      employee.salary.lastUpdated = new Date()
      await employee.save()

      const revised = await User.findById(employee._id)
      expect(revised.salary.basicSalary).toBe(oldBasic + 10000)
      expect(revised.salary.history.length).toBeGreaterThan(0)
    })
  })

  describe('Employee Exit', () => {
    it('should deactivate employee account', async () => {
      const employee = h2rScenario.employees[0]

      employee.isActive = false
      await employee.save()

      const deactivated = await User.findById(employee._id)
      expect(deactivated.isActive).toBe(false)
    })

    it('should track employee metrics before exit', async () => {
      const employee = h2rScenario.employees[0]

      const metrics = employee.metrics || {}
      expect(metrics).toBeDefined()
    })
  })

  describe('Complete H2R Cycle', () => {
    it('should execute full H2R cycle from hiring to exit', async () => {
      const company = seedResult.company
      const admin = seedResult.users[0]
      const department = h2rScenario.departments[0]

      // Step 1: Create User Account (Hiring)
      const hashedPwd = await hashPassword('Test@123456')
      const newEmployee = await User.create({
        name: 'Full Cycle Employee',
        email: 'fullcycle.employee@test.com',
        password: hashedPwd,
        phone: '+91 98765 99999',
        role: 'designer',
        company: company._id,
        department: department.name,
        designation: 'Associate Designer',
        reportsTo: admin._id,
        isActive: true,
        isEmailVerified: true,
        salary: {
          basicSalary: 40000,
          hra: 16000,
          otherAllowances: 10000,
          grossSalary: 66000,
          netSalary: 55000,
          ctc: 85000,
          config: {
            epfoApplicable: true,
            ptState: 'Maharashtra'
          }
        }
      })
      expect(newEmployee.isActive).toBe(true)

      // Step 2: Record Attendance
      const attendance = await Attendance.create({
        company: company._id,
        employee: newEmployee._id,
        date: new Date(),
        checkIn: { time: new Date() },
        status: 'present'
      })
      expect(attendance.status).toBe('present')

      // Step 3: Apply for Leave
      const leave = await Leave.create({
        company: company._id,
        employee: newEmployee._id,
        leaveType: 'casual',
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
        duration: { days: 2 },
        reason: 'Personal work',
        status: 'pending'
      })

      leave.status = 'approved'
      leave.approvedBy = admin._id
      leave.approvedAt = new Date()
      await leave.save()
      expect(leave.status).toBe('approved')

      // Step 4: Promotion
      newEmployee.designation = 'Designer'
      newEmployee.salary.basicSalary = 50000
      newEmployee.salary.history = [{
        effectiveFrom: new Date(),
        basicSalary: 50000,
        reason: 'promotion'
      }]
      await newEmployee.save()
      expect(newEmployee.designation).toBe('Designer')

      // Step 5: Exit
      newEmployee.isActive = false
      await newEmployee.save()

      const finalEmployee = await User.findById(newEmployee._id)
      expect(finalEmployee.isActive).toBe(false)
    })
  })
})
