import express from 'express'
import GoodsReceipt from '../models/GoodsReceipt.js'
import PurchaseOrder from '../models/PurchaseOrder.js'
import VendorPerformance from '../models/VendorPerformance.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('goods_receipt_grn', 'view'))

// Get all goods receipts
router.get('/', async (req, res) => {
  try {
    const {
      status,
      vendor,
      purchaseOrder,
      project,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (vendor) queryFilter.vendor = vendor
    if (purchaseOrder) queryFilter.purchaseOrder = purchaseOrder
    if (project) queryFilter.project = project
    if (search) {
      queryFilter.$or = [
        { grnNumber: { $regex: search, $options: 'i' } },
        { deliveryNoteNumber: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await GoodsReceipt.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const receipts = await GoodsReceipt.find(queryFilter)
      .populate('vendor', 'name vendorId')
      .populate('purchaseOrder', 'poNumber')
      .populate('project', 'title projectId')
      .populate('receivedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: receipts,
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

// Get single goods receipt
router.get('/:id', async (req, res) => {
  try {
    const receipt = await GoodsReceipt.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('vendor', 'name vendorId email phone')
      .populate('purchaseOrder', 'poNumber orderDate lineItems')
      .populate('project', 'title projectId')
      .populate('receivedBy', 'name')
      .populate('qualityInspection.inspectedBy', 'name')

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Goods receipt not found' })
    }

    res.json({ success: true, data: receipt })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create goods receipt
router.post('/', async (req, res) => {
  try {
    const { purchaseOrder: poId, ...restData } = req.body

    // Get PO details
    const po = await PurchaseOrder.findOne({
      _id: poId,
      company: req.activeCompany._id
    })

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' })
    }

    // Use new + save to trigger pre-save hook for grnNumber generation
    const receipt = new GoodsReceipt({
      ...restData,
      purchaseOrder: poId,
      vendor: po.vendor,
      project: po.project,
      company: req.activeCompany._id,
      receivedBy: req.user._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'Goods receipt created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })
    await receipt.save()

    // Update PO delivery status
    if (receipt.status === 'received' || receipt.status === 'accepted') {
      // Update PO line items delivered quantities
      for (const grnItem of receipt.lineItems) {
        const poItem = po.lineItems.find(item =>
          item._id.toString() === grnItem.poLineItem?.toString()
        )
        if (poItem) {
          poItem.deliveredQuantity = (poItem.deliveredQuantity || 0) + grnItem.acceptedQuantity
          poItem.pendingQuantity = poItem.quantity - poItem.deliveredQuantity
        }
      }
      po.status = po.updateDeliveryStatus()
      await po.save()
    }

    const populatedReceipt = await GoodsReceipt.findById(receipt._id)
      .populate('vendor', 'name vendorId')
      .populate('purchaseOrder', 'poNumber')

    res.status(201).json({ success: true, data: populatedReceipt })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update goods receipt
router.put('/:id', async (req, res) => {
  try {
    const receipt = await GoodsReceipt.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Goods receipt not found' })
    }

    if (!['draft', 'received', 'inspection_pending'].includes(receipt.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update receipt in current status'
      })
    }

    Object.assign(receipt, req.body)
    receipt.activities.push({
      action: 'updated',
      description: 'Goods receipt updated',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await receipt.save()

    res.json({ success: true, data: receipt })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Complete quality inspection
router.put('/:id/inspection', async (req, res) => {
  try {
    const { lineItems, remarks, overallStatus } = req.body

    const receipt = await GoodsReceipt.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Goods receipt not found' })
    }

    // Update line items with inspection results
    if (lineItems) {
      lineItems.forEach(inspectedItem => {
        const item = receipt.lineItems.id(inspectedItem._id)
        if (item) {
          item.acceptedQuantity = inspectedItem.acceptedQuantity
          item.rejectedQuantity = inspectedItem.rejectedQuantity
          item.rejectionReason = inspectedItem.rejectionReason
          item.qualityStatus = inspectedItem.qualityStatus
        }
      })
    }

    receipt.qualityInspection = {
      inspectedBy: req.user._id,
      inspectedAt: new Date(),
      overallStatus: overallStatus || 'passed',
      remarks
    }

    receipt.status = 'inspection_completed'
    receipt.activities.push({
      action: 'inspection_completed',
      description: `Quality inspection completed: ${overallStatus || 'passed'}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await receipt.save()

    res.json({ success: true, data: receipt })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Accept goods receipt
router.put('/:id/accept', async (req, res) => {
  try {
    const receipt = await GoodsReceipt.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Goods receipt not found' })
    }

    receipt.status = receipt.totalRejectedQuantity > 0 ? 'partially_accepted' : 'accepted'
    receipt.activities.push({
      action: 'accepted',
      description: 'Goods receipt accepted',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await receipt.save()

    // Update PO status
    const po = await PurchaseOrder.findById(receipt.purchaseOrder)
    if (po) {
      for (const grnItem of receipt.lineItems) {
        const poItem = po.lineItems.find(item =>
          item._id.toString() === grnItem.poLineItem?.toString()
        )
        if (poItem) {
          poItem.deliveredQuantity = (poItem.deliveredQuantity || 0) + grnItem.acceptedQuantity
        }
      }
      po.status = po.updateDeliveryStatus()
      await po.save()
    }

    // Auto-update Vendor Performance from GRN data
    try {
      if (receipt.vendor) {
        const totalItems = receipt.lineItems.length
        const acceptedItems = receipt.lineItems.filter(i => (i.acceptedQuantity || 0) > 0).length
        const rejectedItems = receipt.lineItems.filter(i => (i.rejectedQuantity || 0) > 0).length
        const qualityScore = totalItems > 0 ? Math.round((acceptedItems / totalItems) * 5) : 3

        // Calculate timeliness score based on PO expected date vs actual receipt
        let timelinessScore = 3 // default neutral
        if (po?.expectedDeliveryDate) {
          const expectedDate = new Date(po.expectedDeliveryDate)
          const actualDate = new Date(receipt.receivedDate || receipt.createdAt)
          const daysDiff = Math.floor((actualDate - expectedDate) / (1000 * 60 * 60 * 24))
          if (daysDiff <= 0) timelinessScore = 5       // On time or early
          else if (daysDiff <= 3) timelinessScore = 4   // Slightly late
          else if (daysDiff <= 7) timelinessScore = 3   // Moderately late
          else if (daysDiff <= 14) timelinessScore = 2  // Late
          else timelinessScore = 1                       // Very late
        }

        // Check for existing performance record this quarter
        const now = new Date()
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0)

        let perf = await VendorPerformance.findOne({
          company: receipt.company,
          vendor: receipt.vendor,
          'reviewPeriod.startDate': { $gte: quarterStart },
          'reviewPeriod.endDate': { $lte: quarterEnd }
        })

        if (perf) {
          // Average with existing scores
          if (perf.ratings.quality?.score) {
            perf.ratings.quality.score = Math.round((perf.ratings.quality.score + qualityScore) / 2)
          } else {
            perf.ratings.quality = { score: qualityScore, notes: `Auto-updated from GRN ${receipt.grnNumber}` }
          }
          if (perf.ratings.timeliness?.score) {
            perf.ratings.timeliness.score = Math.round((perf.ratings.timeliness.score + timelinessScore) / 2)
          } else {
            perf.ratings.timeliness = { score: timelinessScore, notes: `Auto-updated from GRN ${receipt.grnNumber}` }
          }
          if (!perf.relatedPOs) perf.relatedPOs = []
          if (po && !perf.relatedPOs.includes(po._id)) perf.relatedPOs.push(po._id)
          await perf.save()
        } else {
          // Create new quarterly performance record
          const quarterLabel = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`
          await VendorPerformance.create({
            company: receipt.company,
            vendor: receipt.vendor,
            reviewPeriod: { startDate: quarterStart, endDate: quarterEnd, quarter: quarterLabel, year: now.getFullYear() },
            ratings: {
              quality: { score: qualityScore, notes: `Auto-generated from GRN ${receipt.grnNumber}` },
              timeliness: { score: timelinessScore, notes: `Auto-generated from GRN ${receipt.grnNumber}` }
            },
            relatedPOs: po ? [po._id] : [],
            relatedProjects: receipt.project ? [receipt.project] : [],
            reviewedBy: req.user._id,
            createdBy: req.user._id
          })
        }
      }
    } catch (perfErr) {
      console.error('Failed to auto-update vendor performance:', perfErr.message)
      // Don't fail the main request
    }

    res.json({ success: true, data: receipt })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete goods receipt (Super Admin only)
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admin can delete' })
    }

    const receipt = await GoodsReceipt.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: 'draft'
    })

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Goods receipt not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Goods receipt deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
