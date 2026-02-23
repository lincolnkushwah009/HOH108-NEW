import express from 'express'
import CPDataBatch from '../models/CPDataBatch.js'
import ChannelPartner from '../models/ChannelPartner.js'
import Lead from '../models/Lead.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// GET / - List all batches (paginated, filterable)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      channelPartner,
      validationStatus,
      paymentStatus,
      dateFrom,
      dateTo,
      search
    } = req.query

    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    const query = companyScopedQuery(req)

    if (channelPartner) query.channelPartner = channelPartner
    if (validationStatus) query.validationStatus = validationStatus
    if (paymentStatus) query.paymentStatus = paymentStatus

    if (dateFrom || dateTo) {
      query.uploadedAt = {}
      if (dateFrom) query.uploadedAt.$gte = new Date(dateFrom)
      if (dateTo) query.uploadedAt.$lte = new Date(dateTo)
    }

    if (search) {
      query.$or = [
        { batchId: { $regex: search, $options: 'i' } },
        { channelPartnerName: { $regex: search, $options: 'i' } }
      ]
    }

    const [data, total] = await Promise.all([
      CPDataBatch.find(query)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('channelPartner', 'name partnerId email')
        .populate('spoc', 'name email')
        .lean(),
      CPDataBatch.countDocuments(query)
    ])

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    })
  } catch (error) {
    console.error('Error listing CP data batches:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch batches', error: error.message })
  }
})

// GET /tree - Hierarchical tree view grouped by channel partner
router.get('/tree', async (req, res) => {
  try {
    const baseQuery = companyScopedQuery(req)

    const tree = await CPDataBatch.aggregate([
      { $match: baseQuery },
      { $sort: { version: -1 } },
      {
        $group: {
          _id: '$channelPartner',
          channelPartnerName: { $first: '$channelPartnerName' },
          spoc: { $first: '$spoc' },
          spocName: { $first: '$spocName' },
          batchCount: { $sum: 1 },
          batches: {
            $push: {
              _id: '$_id',
              batchId: '$batchId',
              version: '$version',
              uploadType: '$uploadType',
              uploadedAt: '$uploadedAt',
              sourceDate: '$sourceDate',
              stats: '$stats',
              validationStatus: '$validationStatus',
              paymentStatus: '$paymentStatus'
            }
          }
        }
      },
      {
        $lookup: {
          from: 'channelpartners',
          localField: '_id',
          foreignField: '_id',
          as: 'cpInfo'
        }
      },
      { $unwind: { path: '$cpInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'spoc',
          foreignField: '_id',
          as: 'spocInfo'
        }
      },
      { $unwind: { path: '$spocInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$cpInfo.name', '$channelPartnerName'] },
          partnerId: '$cpInfo.partnerId',
          email: '$cpInfo.email',
          spocName: { $ifNull: ['$spocInfo.name', '$spocName'] },
          spoc: '$spoc',
          batchCount: 1,
          batches: 1
        }
      },
      { $sort: { name: 1 } }
    ])

    res.json({ success: true, data: tree })
  } catch (error) {
    console.error('Error fetching CP data tree:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch tree view', error: error.message })
  }
})

// GET /stats - Aggregate statistics
router.get('/stats', async (req, res) => {
  try {
    const baseQuery = companyScopedQuery(req)

    const [generalStats, paymentStats] = await Promise.all([
      CPDataBatch.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            totalBatches: { $sum: 1 },
            totalLeadsSourcing: { $sum: '$stats.leadsCreated' },
            totalDuplicates: { $sum: '$stats.duplicatesFound' }
          }
        }
      ]),
      CPDataBatch.aggregate([
        { $match: { ...baseQuery, paymentStatus: { $in: ['pending_approval', 'approved', 'paid'] } } },
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
            totalAmount: { $sum: '$paymentDetails.amount' }
          }
        }
      ])
    ])

    const general = generalStats[0] || { totalBatches: 0, totalLeadsSourcing: 0, totalDuplicates: 0 }

    const paymentMap = {}
    for (const p of paymentStats) {
      paymentMap[p._id] = { count: p.count, amount: p.totalAmount }
    }

    res.json({
      success: true,
      data: {
        totalBatches: general.totalBatches,
        totalLeadsSourced: general.totalLeadsSourcing,
        totalDuplicates: general.totalDuplicates,
        payments: {
          pending: paymentMap.pending_approval || { count: 0, amount: 0 },
          approved: paymentMap.approved || { count: 0, amount: 0 },
          paid: paymentMap.paid || { count: 0, amount: 0 }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching CP data stats:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message })
  }
})

// GET /:id - Single batch detail
router.get('/:id', async (req, res) => {
  try {
    const batch = await CPDataBatch.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })
      .populate('channelPartner', 'name partnerId email phone businessName incentive')
      .populate('spoc', 'name email phone')
      .populate({
        path: 'leads',
        select: 'name phone email status leadId assignedTo location.city createdAt',
        populate: {
          path: 'assignedTo',
          select: 'name'
        }
      })

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' })
    }

    res.json({ success: true, data: batch })
  } catch (error) {
    console.error('Error fetching batch detail:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch batch', error: error.message })
  }
})

// PUT /:id/payment - Update payment status
router.put('/:id/payment', requirePermission(PERMISSIONS.LEADS_EDIT), async (req, res) => {
  try {
    const { status, amount, transactionRef, notes } = req.body

    if (!status) {
      return res.status(400).json({ success: false, message: 'Payment status is required' })
    }

    const batch = await CPDataBatch.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' })
    }

    // Validate status transitions
    const validTransitions = {
      pending_approval: ['approved', 'rejected'],
      approved: ['paid']
    }

    const allowed = validTransitions[batch.paymentStatus]
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from '${batch.paymentStatus}' to '${status}'. Allowed: ${allowed ? allowed.join(', ') : 'none'}`
      })
    }

    const oldStatus = batch.paymentStatus

    // Update payment fields
    batch.paymentStatus = status

    if (amount !== undefined) batch.paymentDetails.amount = amount
    if (transactionRef) batch.paymentDetails.transactionRef = transactionRef
    if (notes) batch.paymentDetails.notes = notes

    if (status === 'approved') {
      batch.paymentDetails.approvedBy = req.user._id
      batch.paymentDetails.approvedByName = req.user.name
      batch.paymentDetails.approvedAt = new Date()
    }

    if (status === 'paid') {
      batch.paymentDetails.paidAt = new Date()
    }

    // Add activity log
    batch.activities.push({
      action: `payment_${status}`,
      description: `Payment status changed from '${oldStatus}' to '${status}'${notes ? ': ' + notes : ''}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      oldValue: oldStatus,
      newValue: status
    })

    await batch.save()

    res.json({ success: true, data: batch, message: `Payment status updated to '${status}'` })
  } catch (error) {
    console.error('Error updating payment status:', error)
    res.status(500).json({ success: false, message: 'Failed to update payment status', error: error.message })
  }
})

// POST /:id/recalculate - Recalculate incentive amount
router.post('/:id/recalculate', async (req, res) => {
  try {
    const batch = await CPDataBatch.findOne({
      _id: req.params.id,
      ...companyScopedQuery(req)
    })

    if (!batch) {
      return res.status(404).json({ success: false, message: 'Batch not found' })
    }

    const cp = await ChannelPartner.findById(batch.channelPartner).lean()
    if (!cp) {
      return res.status(404).json({ success: false, message: 'Channel partner not found' })
    }

    const incentive = cp.incentive || {}
    const model = incentive.model || 'flat'
    const flatFee = incentive.flatFee || 0
    const percentage = incentive.percentage || 0
    const leadsCreated = batch.stats.leadsCreated || 0

    let amount = 0

    if (model === 'flat') {
      amount = leadsCreated * flatFee
    } else if (model === 'percentage') {
      amount = leadsCreated * percentage
    } else if (model === 'hybrid') {
      amount = (leadsCreated * flatFee) + (leadsCreated * percentage)
    }

    const oldAmount = batch.paymentDetails.amount

    batch.paymentDetails.incentiveModel = model
    batch.paymentDetails.amount = amount

    // Add activity log
    batch.activities.push({
      action: 'incentive_recalculated',
      description: `Incentive recalculated using '${model}' model. ${leadsCreated} leads x config => ${amount}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      oldValue: oldAmount,
      newValue: amount
    })

    await batch.save()

    res.json({
      success: true,
      data: {
        incentiveModel: model,
        leadsCreated,
        flatFee,
        percentage,
        amount
      },
      message: `Incentive recalculated: ${amount}`
    })
  } catch (error) {
    console.error('Error recalculating incentive:', error)
    res.status(500).json({ success: false, message: 'Failed to recalculate incentive', error: error.message })
  }
})

export default router
