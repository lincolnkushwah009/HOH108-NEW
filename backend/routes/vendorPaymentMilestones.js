import express from 'express'
import VendorPaymentMilestone from '../models/VendorPaymentMilestone.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('vendor_milestones', 'view'))

/**
 * @route   GET /api/vendor-payment-milestones
 * @desc    List all vendor payment milestones
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { vendor, purchaseOrder, project, status, page = 1, limit = 20 } = req.query

    const queryFilter = companyScopedQuery(req)

    if (vendor) queryFilter.vendor = vendor
    if (purchaseOrder) queryFilter.purchaseOrder = purchaseOrder
    if (project) queryFilter.project = project
    if (status) queryFilter.status = status

    const total = await VendorPaymentMilestone.countDocuments(queryFilter)

    const milestones = await VendorPaymentMilestone.find(queryFilter)
      .populate('vendor', 'name vendorId')
      .populate('purchaseOrder', 'poNumber poTotal')
      .populate('project', 'title projectId')
      .populate('createdBy', 'name')
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: milestones,
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

/**
 * @route   GET /api/vendor-payment-milestones/:id
 * @desc    Get single milestone with payments
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const milestone = await VendorPaymentMilestone.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('vendor', 'name vendorId email phone address bankDetails')
      .populate('purchaseOrder', 'poNumber poTotal orderDate')
      .populate('project', 'title projectId')
      .populate('payments.recordedBy', 'name')
      .populate('createdBy', 'name')

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' })
    }

    res.json({ success: true, data: milestone })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/vendor-payment-milestones
 * @desc    Create a new payment milestone
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const milestone = await VendorPaymentMilestone.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id
    })

    const populated = await VendorPaymentMilestone.findById(milestone._id)
      .populate('vendor', 'name vendorId')
      .populate('purchaseOrder', 'poNumber')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   PUT /api/vendor-payment-milestones/:id
 * @desc    Update a payment milestone
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const milestone = await VendorPaymentMilestone.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' })
    }

    Object.assign(milestone, req.body)
    await milestone.save()

    res.json({ success: true, data: milestone })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/vendor-payment-milestones/:id/payments
 * @desc    Record a payment on a milestone
 * @access  Private
 */
router.post('/:id/payments', async (req, res) => {
  try {
    const milestone = await VendorPaymentMilestone.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' })
    }

    if (milestone.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Milestone is already fully paid'
      })
    }

    if (milestone.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record payment on a cancelled milestone'
      })
    }

    const payment = {
      ...req.body,
      recordedBy: req.user._id,
      recordedAt: new Date()
    }

    milestone.payments.push(payment)
    await milestone.save()

    res.json({ success: true, data: milestone })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/vendor-payment-milestones/create-defaults
 * @desc    Create default milestones for a purchase order
 * @access  Private
 */
router.post('/create-defaults', async (req, res) => {
  try {
    const { vendor, purchaseOrder, project, totalAmount, gstRate = 18 } = req.body

    if (!vendor || !purchaseOrder || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'vendor, purchaseOrder, and totalAmount are required'
      })
    }

    // Check if milestones already exist for this PO
    const existingCount = await VendorPaymentMilestone.countDocuments({
      company: req.activeCompany._id,
      purchaseOrder
    })

    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `${existingCount} milestones already exist for this purchase order`
      })
    }

    const defaultMilestones = [
      { name: 'Advance Payment', type: 'advance', percentage: 10, order: 1 },
      { name: 'Material Delivery', type: 'material_delivery', percentage: 40, order: 2 },
      { name: 'Installation Complete', type: 'installation_complete', percentage: 30, order: 3 },
      { name: 'Retention Release', type: 'retention_release', percentage: 10, order: 4 },
      { name: 'Final Payment', type: 'final_payment', percentage: 10, order: 5 }
    ]

    const milestoneDocs = defaultMilestones.map(m => {
      const amount = (totalAmount * m.percentage) / 100
      const gst = (amount * gstRate) / 100

      return {
        company: req.activeCompany._id,
        vendor,
        purchaseOrder,
        project: project || undefined,
        name: m.name,
        type: m.type,
        percentage: m.percentage,
        amount,
        gst,
        totalWithGst: amount + gst,
        pendingAmount: amount + gst,
        order: m.order,
        status: 'pending',
        createdBy: req.user._id
      }
    })

    const created = await VendorPaymentMilestone.insertMany(milestoneDocs)

    const populated = await VendorPaymentMilestone.find({
      _id: { $in: created.map(m => m._id) }
    })
      .populate('vendor', 'name vendorId')
      .populate('purchaseOrder', 'poNumber')
      .sort({ order: 1 })

    res.status(201).json({
      success: true,
      message: `${created.length} default milestones created`,
      data: populated
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
