import express from 'express'
import LaborEntry from '../models/LaborEntry.js'
import WorkOrder from '../models/WorkOrder.js'
import User from '../models/User.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'
import mongoose from 'mongoose'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('labor_tracking', 'view'))

// Get all labor entries
router.get('/', async (req, res) => {
  try {
    const {
      status,
      workOrder,
      project,
      employee,
      entryDate,
      startDate,
      endDate,
      skillType,
      laborType,
      search,
      page = 1,
      limit = 20,
      sortBy = 'entryDate',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (workOrder) queryFilter.workOrder = workOrder
    if (project) queryFilter.project = project
    if (employee) queryFilter.employee = employee
    if (skillType) queryFilter['employeeDetails.skillType'] = skillType
    if (laborType) queryFilter.laborType = laborType
    if (entryDate) {
      const date = new Date(entryDate)
      queryFilter.entryDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    }
    if (startDate || endDate) {
      queryFilter.entryDate = queryFilter.entryDate || {}
      if (startDate) queryFilter.entryDate.$gte = new Date(startDate)
      if (endDate) queryFilter.entryDate.$lte = new Date(endDate)
    }
    if (search) {
      queryFilter.$or = [
        { entryId: { $regex: search, $options: 'i' } },
        { 'employeeDetails.name': { $regex: search, $options: 'i' } }
      ]
    }

    const total = await LaborEntry.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const entries = await LaborEntry.find(queryFilter)
      .populate('employee', 'name email')
      .populate('workOrder', 'workOrderId item.name')
      .populate('project', 'title projectId')
      .populate('recordedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await LaborEntry.aggregate([
      { $match: { company: req.activeCompany._id, ...queryFilter } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalHours: { $sum: '$hours.total' },
          totalRegularHours: { $sum: '$hours.regular' },
          totalOvertimeHours: { $sum: '$hours.overtime' },
          totalCost: { $sum: '$cost.totalCost' }
        }
      }
    ])

    res.json({
      success: true,
      data: entries,
      stats: stats[0] || { totalEntries: 0, totalHours: 0, totalCost: 0 },
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get single labor entry
router.get('/:id', async (req, res) => {
  try {
    const entry = await LaborEntry.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('employee', 'name email phone department designation')
      .populate('workOrder', 'workOrderId item.name schedule')
      .populate('project', 'title projectId')
      .populate('vendor', 'name vendorId')
      .populate('recordedBy', 'name')
      .populate('approvedBy', 'name')

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Labor entry not found' })
    }

    res.json({ success: true, data: entry })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create labor entry
router.post('/', async (req, res) => {
  try {
    const {
      workOrder: workOrderId,
      employee: employeeId,
      ...entryData
    } = req.body

    // Get work order
    const workOrder = await WorkOrder.findOne({
      _id: workOrderId,
      company: req.activeCompany._id
    })

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    // Get employee details
    const employee = await User.findById(employeeId)
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' })
    }

    const entry = new LaborEntry({
      ...entryData,
      company: req.activeCompany._id,
      workOrder: workOrderId,
      project: workOrder.project,
      employee: employeeId,
      employeeDetails: {
        userId: employee.employeeId || employee._id.toString(),
        name: employee.name,
        designation: employee.designation,
        department: employee.department,
        skillType: entryData.skillType || 'other',
        skillLevel: entryData.skillLevel || 'skilled'
      },
      recordedBy: req.user._id,
      recordedByName: req.user.name,
      status: 'submitted'
    })

    await entry.save()

    const populatedEntry = await LaborEntry.findById(entry._id)
      .populate('employee', 'name')
      .populate('workOrder', 'workOrderId item.name')

    res.status(201).json({ success: true, data: populatedEntry })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Bulk create labor entries
router.post('/bulk', async (req, res) => {
  try {
    const { workOrder: workOrderId, entries } = req.body

    const workOrder = await WorkOrder.findOne({
      _id: workOrderId,
      company: req.activeCompany._id
    })

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' })
    }

    const createdEntries = []
    const errors = []

    for (const entryData of entries) {
      try {
        const employee = await User.findById(entryData.employee)
        if (!employee) {
          errors.push({ employee: entryData.employee, error: 'Employee not found' })
          continue
        }

        const entry = new LaborEntry({
          ...entryData,
          company: req.activeCompany._id,
          workOrder: workOrderId,
          project: workOrder.project,
          employeeDetails: {
            userId: employee.employeeId || employee._id.toString(),
            name: employee.name,
            designation: employee.designation,
            department: employee.department,
            skillType: entryData.skillType || 'other',
            skillLevel: entryData.skillLevel || 'skilled'
          },
          recordedBy: req.user._id,
          recordedByName: req.user.name,
          status: 'submitted'
        })

        await entry.save()
        createdEntries.push(entry)
      } catch (err) {
        errors.push({ employee: entryData.employee, error: err.message })
      }
    }

    res.json({
      success: true,
      data: {
        created: createdEntries,
        errors
      },
      message: `Created ${createdEntries.length} entries, ${errors.length} errors`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update labor entry
router.put('/:id', async (req, res) => {
  try {
    const entry = await LaborEntry.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Labor entry not found' })
    }

    // Only allow updates to draft and submitted entries
    if (!['draft', 'submitted'].includes(entry.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update entry in current status'
      })
    }

    Object.assign(entry, req.body)
    await entry.save()

    res.json({ success: true, data: entry })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve labor entry
router.put('/:id/approve', async (req, res) => {
  try {
    const entry = await LaborEntry.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'submitted'
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Labor entry not found or not submitted' })
    }

    entry.status = 'approved'
    entry.approvalStatus = 'approved'
    entry.approvedBy = req.user._id
    entry.approvedByName = req.user.name
    entry.approvedAt = new Date()

    await entry.save()

    res.json({ success: true, data: entry })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Bulk approve
router.post('/bulk-approve', async (req, res) => {
  try {
    const { entryIds } = req.body

    const result = await LaborEntry.updateMany(
      {
        _id: { $in: entryIds },
        company: req.activeCompany._id,
        status: 'submitted'
      },
      {
        $set: {
          status: 'approved',
          approvalStatus: 'approved',
          approvedBy: req.user._id,
          approvedByName: req.user.name,
          approvedAt: new Date()
        }
      }
    )

    res.json({
      success: true,
      message: `Approved ${result.modifiedCount} entries`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reject labor entry
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' })
    }

    const entry = await LaborEntry.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'submitted'
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Labor entry not found or not submitted' })
    }

    entry.status = 'rejected'
    entry.approvalStatus = 'rejected'
    entry.rejectionReason = reason
    entry.approvedBy = req.user._id
    entry.approvedAt = new Date()

    await entry.save()

    res.json({ success: true, data: entry })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get entries by work order
router.get('/work-order/:workOrderId', async (req, res) => {
  try {
    const summary = await LaborEntry.getWorkOrderSummary(req.params.workOrderId)
    res.json({ success: true, data: summary })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get daily report
router.get('/reports/daily', async (req, res) => {
  try {
    const { date, project } = req.query

    const targetDate = date || new Date().toISOString().split('T')[0]

    const report = await LaborEntry.getDailyReport(
      req.activeCompany._id,
      targetDate,
      project
    )

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get productivity report
router.get('/reports/productivity', async (req, res) => {
  try {
    const { startDate, endDate, workOrder, project, groupBy = 'employee' } = req.query

    const match = {
      company: req.activeCompany._id,
      status: { $ne: 'rejected' }
    }

    if (workOrder) match.workOrder = new mongoose.Types.ObjectId(workOrder)
    if (project) match.project = new mongoose.Types.ObjectId(project)
    if (startDate || endDate) {
      match.entryDate = {}
      if (startDate) match.entryDate.$gte = new Date(startDate)
      if (endDate) match.entryDate.$lte = new Date(endDate)
    }

    let groupByField
    switch (groupBy) {
      case 'skillType':
        groupByField = '$employeeDetails.skillType'
        break
      case 'activity':
        groupByField = '$activity.category'
        break
      case 'workOrder':
        groupByField = '$workOrder'
        break
      default:
        groupByField = '$employee'
    }

    const report = await LaborEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupByField,
          name: { $first: groupBy === 'employee' ? '$employeeDetails.name' : '$_id' },
          totalHours: { $sum: '$hours.total' },
          totalRegularHours: { $sum: '$hours.regular' },
          totalOvertimeHours: { $sum: '$hours.overtime' },
          totalCost: { $sum: '$cost.totalCost' },
          totalUnitsProduced: { $sum: '$productivity.unitsProduced' },
          avgEfficiency: { $avg: '$productivity.efficiency' },
          avgQualityScore: { $avg: '$productivity.qualityScore' },
          daysWorked: { $sum: 1 }
        }
      },
      {
        $addFields: {
          costPerHour: {
            $cond: [
              { $eq: ['$totalHours', 0] },
              0,
              { $divide: ['$totalCost', '$totalHours'] }
            ]
          },
          unitsPerHour: {
            $cond: [
              { $eq: ['$totalHours', 0] },
              0,
              { $divide: ['$totalUnitsProduced', '$totalHours'] }
            ]
          }
        }
      },
      { $sort: { totalCost: -1 } }
    ])

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get overtime report
router.get('/reports/overtime', async (req, res) => {
  try {
    const { startDate, endDate, project } = req.query

    const match = {
      company: req.activeCompany._id,
      'hours.overtime': { $gt: 0 },
      status: { $ne: 'rejected' }
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)
    if (startDate || endDate) {
      match.entryDate = {}
      if (startDate) match.entryDate.$gte = new Date(startDate)
      if (endDate) match.entryDate.$lte = new Date(endDate)
    }

    const report = await LaborEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$employee',
          employeeName: { $first: '$employeeDetails.name' },
          totalOvertimeHours: { $sum: '$hours.overtime' },
          totalOvertimeCost: { $sum: '$cost.overtimeCost' },
          overtimeDays: { $sum: 1 }
        }
      },
      { $sort: { totalOvertimeHours: -1 } }
    ])

    const totals = await LaborEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOvertimeHours: { $sum: '$hours.overtime' },
          totalOvertimeCost: { $sum: '$cost.overtimeCost' },
          uniqueEmployees: { $addToSet: '$employee' }
        }
      },
      {
        $project: {
          totalOvertimeHours: 1,
          totalOvertimeCost: 1,
          employeeCount: { $size: '$uniqueEmployees' }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        byEmployee: report,
        totals: totals[0] || { totalOvertimeHours: 0, totalOvertimeCost: 0, employeeCount: 0 }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete labor entry (only drafts)
router.delete('/:id', async (req, res) => {
  try {
    const entry = await LaborEntry.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Labor entry not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Labor entry deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
