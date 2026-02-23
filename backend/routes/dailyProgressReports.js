import express from 'express'
import DailyProgressReport from '../models/DailyProgressReport.js'
import WorkOrder from '../models/WorkOrder.js'
import Project from '../models/Project.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery
} from '../middleware/rbac.js'
import mongoose from 'mongoose'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// Get all daily progress reports
router.get('/', async (req, res) => {
  try {
    const {
      status,
      project,
      workOrder,
      reportDate,
      startDate,
      endDate,
      progressStatus,
      search,
      page = 1,
      limit = 20,
      sortBy = 'reportDate',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (project) queryFilter.project = project
    if (workOrder) queryFilter.workOrder = workOrder
    if (progressStatus) queryFilter['overallProgress.status'] = progressStatus
    if (reportDate) {
      const date = new Date(reportDate)
      queryFilter.reportDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    }
    if (startDate || endDate) {
      queryFilter.reportDate = queryFilter.reportDate || {}
      if (startDate) queryFilter.reportDate.$gte = new Date(startDate)
      if (endDate) queryFilter.reportDate.$lte = new Date(endDate)
    }
    if (search) {
      queryFilter.$or = [
        { dprId: { $regex: search, $options: 'i' } },
        { projectName: { $regex: search, $options: 'i' } },
        { 'site.name': { $regex: search, $options: 'i' } }
      ]
    }

    const total = await DailyProgressReport.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const reports = await DailyProgressReport.find(queryFilter)
      .populate('project', 'title projectId')
      .populate('workOrder', 'workOrderId item.name')
      .populate('submittedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await DailyProgressReport.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      data: reports,
      stats,
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

// Get single DPR
router.get('/:id', async (req, res) => {
  try {
    const report = await DailyProgressReport.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('project', 'title projectId client')
      .populate('workOrder', 'workOrderId item.name schedule')
      .populate('site.siteIncharge', 'name email phone')
      .populate('submittedBy', 'name')
      .populate('reviewedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('createdBy', 'name')

    if (!report) {
      return res.status(404).json({ success: false, message: 'Daily progress report not found' })
    }

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create DPR
router.post('/', async (req, res) => {
  try {
    const report = new DailyProgressReport({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id
    })

    // Get project name if project provided
    if (req.body.project) {
      const project = await Project.findById(req.body.project)
      if (project) {
        report.projectName = project.title
      }
    }

    await report.save()

    const populatedReport = await DailyProgressReport.findById(report._id)
      .populate('project', 'title projectId')
      .populate('workOrder', 'workOrderId item.name')

    res.status(201).json({ success: true, data: populatedReport })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update DPR
router.put('/:id', async (req, res) => {
  try {
    const report = await DailyProgressReport.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!report) {
      return res.status(404).json({ success: false, message: 'Daily progress report not found' })
    }

    // Only allow updates to draft and submitted reports
    if (!['draft', 'submitted'].includes(report.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update report in current status'
      })
    }

    Object.assign(report, req.body)
    report.lastModifiedBy = req.user._id

    await report.save()

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Submit DPR
router.put('/:id/submit', async (req, res) => {
  try {
    const report = await DailyProgressReport.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found or not in draft status' })
    }

    report.status = 'submitted'
    report.submittedBy = req.user._id
    report.submittedByName = req.user.name
    report.submittedAt = new Date()

    await report.save()

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Review DPR
router.put('/:id/review', async (req, res) => {
  try {
    const { comments } = req.body

    const report = await DailyProgressReport.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'submitted'
    })

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found or not submitted' })
    }

    report.status = 'reviewed'
    report.reviewedBy = req.user._id
    report.reviewedByName = req.user.name
    report.reviewedAt = new Date()
    report.reviewComments = comments

    await report.save()

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve DPR
router.put('/:id/approve', async (req, res) => {
  try {
    const report = await DailyProgressReport.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: { $in: ['submitted', 'reviewed'] }
    })

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found or not ready for approval' })
    }

    report.status = 'approved'
    report.approvedBy = req.user._id
    report.approvedByName = req.user.name
    report.approvedAt = new Date()

    await report.save()

    // Update work order progress if linked
    if (report.workOrder) {
      const workOrder = await WorkOrder.findById(report.workOrder)
      if (workOrder && report.overallProgress.actual > 0) {
        workOrder.progress.percentage = report.overallProgress.actual
        workOrder.progress.lastUpdated = new Date()
        await workOrder.save()
      }
    }

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reject DPR
router.put('/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' })
    }

    const report = await DailyProgressReport.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: { $in: ['submitted', 'reviewed'] }
    })

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }

    report.status = 'rejected'
    report.reviewComments = reason

    await report.save()

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add activity to DPR
router.post('/:id/activities', async (req, res) => {
  try {
    const report = await DailyProgressReport.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }

    if (!['draft', 'submitted'].includes(report.status)) {
      return res.status(400).json({ success: false, message: 'Cannot modify report in current status' })
    }

    report.activities.push(req.body)
    await report.save()

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add issue to DPR
router.post('/:id/issues', async (req, res) => {
  try {
    const report = await DailyProgressReport.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }

    report.issues.push(req.body)
    await report.save()

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add photo to DPR
router.post('/:id/photos', async (req, res) => {
  try {
    const report = await DailyProgressReport.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }

    report.photos.push({
      ...req.body,
      uploadedAt: new Date()
    })
    await report.save()

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get project summary
router.get('/project/:projectId/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const summary = await DailyProgressReport.getProjectSummary(
      req.params.projectId,
      startDate,
      endDate
    )

    res.json({ success: true, data: summary })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get manpower report
router.get('/reports/manpower', async (req, res) => {
  try {
    const { startDate, endDate, project } = req.query

    const match = {
      company: req.activeCompany._id,
      status: { $in: ['submitted', 'reviewed', 'approved'] }
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)
    if (startDate || endDate) {
      match.reportDate = {}
      if (startDate) match.reportDate.$gte = new Date(startDate)
      if (endDate) match.reportDate.$lte = new Date(endDate)
    }

    const report = await DailyProgressReport.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$reportDate' } },
          totalManpower: { $sum: '$manpower.total' },
          totalManHours: { $sum: '$manpower.totalManHours' },
          safeManHours: { $sum: '$safety.safeManHours' },
          skilled: { $sum: '$manpower.direct.skilled' },
          semiSkilled: { $sum: '$manpower.direct.semiSkilled' },
          unskilled: { $sum: '$manpower.direct.unskilled' },
          supervisors: { $sum: '$manpower.indirect.supervisors' },
          contractors: { $sum: '$manpower.contractor.count' },
          reportCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const totals = await DailyProgressReport.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalManHours: { $sum: '$manpower.totalManHours' },
          totalSafeManHours: { $sum: '$safety.safeManHours' },
          avgManpower: { $avg: '$manpower.total' },
          totalReports: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        daily: report,
        totals: totals[0] || { totalManHours: 0, totalSafeManHours: 0, avgManpower: 0, totalReports: 0 }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get safety report
router.get('/reports/safety', async (req, res) => {
  try {
    const { startDate, endDate, project } = req.query

    const match = {
      company: req.activeCompany._id,
      status: { $in: ['submitted', 'reviewed', 'approved'] }
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)
    if (startDate || endDate) {
      match.reportDate = {}
      if (startDate) match.reportDate.$gte = new Date(startDate)
      if (endDate) match.reportDate.$lte = new Date(endDate)
    }

    // Get incident summary
    const incidents = await DailyProgressReport.aggregate([
      { $match: match },
      { $unwind: { path: '$safety.incidents', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$safety.incidents.type',
          count: { $sum: { $cond: [{ $ifNull: ['$safety.incidents.type', false] }, 1, 0] } }
        }
      }
    ])

    // Get safety metrics
    const metrics = await DailyProgressReport.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalManHours: { $sum: '$manpower.totalManHours' },
          safeManHours: { $sum: '$safety.safeManHours' },
          toolboxTalks: { $sum: { $cond: ['$safety.toolboxTalkConducted', 1, 0] } },
          avgPPECompliance: { $avg: '$safety.ppeCompliance' },
          totalIncidents: { $sum: { $size: { $ifNull: ['$safety.incidents', []] } } },
          reportCount: { $sum: 1 }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        incidents: incidents.filter(i => i._id),
        metrics: metrics[0] || {
          totalManHours: 0,
          safeManHours: 0,
          toolboxTalks: 0,
          avgPPECompliance: 0,
          totalIncidents: 0
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get progress trend
router.get('/reports/progress-trend', async (req, res) => {
  try {
    const { project, days = 30 } = req.query

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))

    const match = {
      company: req.activeCompany._id,
      reportDate: { $gte: startDate },
      status: { $in: ['submitted', 'reviewed', 'approved'] }
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)

    const trend = await DailyProgressReport.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$reportDate' } },
          avgPlanned: { $avg: '$overallProgress.planned' },
          avgActual: { $avg: '$overallProgress.actual' },
          avgVariance: { $avg: '$overallProgress.variance' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({ success: true, data: trend })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get issues report
router.get('/reports/issues', async (req, res) => {
  try {
    const { startDate, endDate, project, issueType, status } = req.query

    const match = {
      company: req.activeCompany._id,
      'issues.0': { $exists: true }
    }

    if (project) match.project = new mongoose.Types.ObjectId(project)
    if (startDate || endDate) {
      match.reportDate = {}
      if (startDate) match.reportDate.$gte = new Date(startDate)
      if (endDate) match.reportDate.$lte = new Date(endDate)
    }

    const pipeline = [
      { $match: match },
      { $unwind: '$issues' }
    ]

    if (issueType) {
      pipeline.push({ $match: { 'issues.type': issueType } })
    }
    if (status) {
      pipeline.push({ $match: { 'issues.status': status } })
    }

    pipeline.push(
      {
        $group: {
          _id: '$issues.type',
          count: { $sum: 1 },
          openCount: { $sum: { $cond: [{ $eq: ['$issues.status', 'open'] }, 1, 0] } },
          resolvedCount: { $sum: { $cond: [{ $eq: ['$issues.status', 'resolved'] }, 1, 0] } },
          highImpact: { $sum: { $cond: [{ $in: ['$issues.impact', ['high', 'critical']] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    )

    const report = await DailyProgressReport.aggregate(pipeline)

    res.json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete DPR (only drafts)
router.delete('/:id', async (req, res) => {
  try {
    const report = await DailyProgressReport.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Daily progress report deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
