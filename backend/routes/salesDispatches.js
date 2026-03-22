import express from 'express'
import SalesDispatch from '../models/SalesDispatch.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

/**
 * @route   GET /api/sales-dispatches
 * @desc    List all sales dispatches
 * @access  Private
 */
router.get('/', requireModulePermission('dispatches', 'view'), async (req, res) => {
  try {
    const { salesOrder, customer, status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query

    const queryFilter = companyScopedQuery(req)

    if (salesOrder) queryFilter.salesOrder = salesOrder
    if (customer) queryFilter.customer = customer
    if (status) queryFilter.status = status

    const total = await SalesDispatch.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const dispatches = await SalesDispatch.find(queryFilter)
      .populate('salesOrder', 'salesOrderId title')
      .populate('customer', 'name customerId')
      .populate('project', 'title projectId')
      .populate('createdBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: dispatches,
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
 * @route   GET /api/sales-dispatches/:id
 * @desc    Get single dispatch
 * @access  Private
 */
router.get('/:id', requireModulePermission('dispatches', 'view'), async (req, res) => {
  try {
    const dispatch = await SalesDispatch.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('salesOrder', 'salesOrderId title costEstimation')
      .populate('customer', 'name customerId email phone')
      .populate('project', 'title projectId')
      .populate('createdBy', 'name')

    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch not found' })
    }

    res.json({ success: true, data: dispatch })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/sales-dispatches
 * @desc    Create a new sales dispatch
 * @access  Private
 */
router.post('/', requireModulePermission('dispatches', 'edit'), async (req, res) => {
  try {
    const dispatch = await SalesDispatch.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id
    })

    const populated = await SalesDispatch.findById(dispatch._id)
      .populate('salesOrder', 'salesOrderId title')
      .populate('customer', 'name customerId')
      .populate('project', 'title projectId')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   PUT /api/sales-dispatches/:id
 * @desc    Update a sales dispatch
 * @access  Private
 */
router.put('/:id', requireModulePermission('dispatches', 'edit'), async (req, res) => {
  try {
    const dispatch = await SalesDispatch.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch not found' })
    }

    if (['delivered', 'cancelled'].includes(dispatch.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update dispatch in current status'
      })
    }

    Object.assign(dispatch, req.body)
    await dispatch.save()

    res.json({ success: true, data: dispatch })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/sales-dispatches/:id/dispatch
 * @desc    Set dispatch status to 'dispatched'
 * @access  Private
 */
router.post('/:id/dispatch', requireModulePermission('dispatches', 'edit'), async (req, res) => {
  try {
    const dispatch = await SalesDispatch.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch not found' })
    }

    if (dispatch.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `Cannot dispatch from status '${dispatch.status}'. Must be in draft status.`
      })
    }

    dispatch.status = 'dispatched'
    dispatch.dispatchDate = new Date()

    if (req.body.docketNumber) dispatch.docketNumber = req.body.docketNumber
    if (req.body.vehicleNumber) dispatch.vehicleNumber = req.body.vehicleNumber
    if (req.body.transporterName) dispatch.transporterName = req.body.transporterName

    await dispatch.save()

    res.json({
      success: true,
      message: 'Dispatch marked as dispatched',
      data: dispatch
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/sales-dispatches/:id/confirm-delivery
 * @desc    Confirm delivery of dispatch
 * @access  Private
 */
router.post('/:id/confirm-delivery', requireModulePermission('dispatches', 'edit'), async (req, res) => {
  try {
    const dispatch = await SalesDispatch.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!dispatch) {
      return res.status(404).json({ success: false, message: 'Dispatch not found' })
    }

    if (!['dispatched', 'in_transit'].includes(dispatch.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm delivery from status '${dispatch.status}'. Must be dispatched or in transit.`
      })
    }

    dispatch.status = 'delivered'
    dispatch.deliveredDate = req.body.deliveredDate || new Date()

    // Update line items receivedQty from request body if provided
    if (req.body.lineItems && Array.isArray(req.body.lineItems)) {
      for (const update of req.body.lineItems) {
        const lineItem = dispatch.lineItems.id(update._id)
        if (lineItem) {
          lineItem.receivedQty = update.receivedQty !== undefined ? update.receivedQty : lineItem.dispatchedQty
          if (update.remarks) lineItem.remarks = update.remarks
        }
      }
    } else {
      // Default: set receivedQty = dispatchedQty for all line items
      dispatch.lineItems.forEach(item => {
        item.receivedQty = item.dispatchedQty
      })
    }

    await dispatch.save()

    res.json({
      success: true,
      message: 'Delivery confirmed',
      data: dispatch
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
