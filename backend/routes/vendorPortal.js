import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import Vendor from '../models/Vendor.js'
import PurchaseOrder from '../models/PurchaseOrder.js'
import RequestForQuotation from '../models/RequestForQuotation.js'

const router = express.Router()

// Generate JWT for vendor
const generateVendorToken = (vendorId) => {
  return jwt.sign({ vendorId, type: 'vendor' }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  })
}

// Vendor authentication middleware
export const protectVendor = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.type !== 'vendor') {
      return res.status(401).json({ success: false, message: 'Invalid token type' })
    }

    const vendor = await Vendor.findById(decoded.vendorId)

    if (!vendor) {
      return res.status(401).json({ success: false, message: 'Vendor not found' })
    }

    if (!vendor.portalAccess?.enabled) {
      return res.status(401).json({ success: false, message: 'Portal access disabled' })
    }

    if (vendor.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Vendor account is not active' })
    }

    req.vendor = vendor
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized' })
  }
}

// =====================
// PUBLIC ROUTES
// =====================

// Vendor Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }

    // Find vendor by email with password field
    const vendor = await Vendor.findOne({ email: email.toLowerCase() })
      .select('+portalAccess.password')

    // Debug logging
    console.log('Login attempt for:', email)
    console.log('Vendor found:', vendor ? 'Yes' : 'No')
    if (vendor) {
      console.log('Portal access enabled:', vendor.portalAccess?.enabled)
      console.log('Portal access object:', JSON.stringify(vendor.portalAccess, null, 2))
    }

    if (!vendor) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Check if portal access is enabled
    if (!vendor.portalAccess?.enabled) {
      return res.status(401).json({
        success: false,
        message: 'Portal access not enabled. Please contact admin.'
      })
    }

    // Check if vendor is active
    if (vendor.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account is not active. Please contact admin.'
      })
    }

    // Check if account is locked
    if (vendor.isLocked()) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
      })
    }

    // Verify password
    const isMatch = await vendor.matchPassword(password)

    if (!isMatch) {
      await vendor.incLoginAttempts()
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Reset login attempts on successful login
    vendor.portalAccess.loginAttempts = 0
    vendor.portalAccess.lockUntil = undefined
    vendor.portalAccess.lastLogin = new Date()
    await vendor.save()

    const token = generateVendorToken(vendor._id)

    res.json({
      success: true,
      token,
      vendor: {
        _id: vendor._id,
        vendorId: vendor.vendorId,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        company: vendor.company,
        status: vendor.status,
        category: vendor.category
      }
    })
  } catch (error) {
    console.error('Vendor login error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    const vendor = await Vendor.findOne({ email: email.toLowerCase() })

    if (!vendor) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If the email exists, a reset link will be sent' })
    }

    if (!vendor.portalAccess?.enabled) {
      return res.json({ success: true, message: 'If the email exists, a reset link will be sent' })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    vendor.portalAccess.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')
    vendor.portalAccess.passwordResetExpires = Date.now() + 3600000 // 1 hour

    await vendor.save()

    // TODO: Send email with reset link
    // For now, just return success
    console.log('Password reset token:', resetToken) // Remove in production

    res.json({ success: true, message: 'If the email exists, a reset link will be sent' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reset password with token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex')

    const vendor = await Vendor.findOne({
      'portalAccess.passwordResetToken': hashedToken,
      'portalAccess.passwordResetExpires': { $gt: Date.now() }
    })

    if (!vendor) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' })
    }

    const { password } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    vendor.portalAccess.password = password
    vendor.portalAccess.passwordResetToken = undefined
    vendor.portalAccess.passwordResetExpires = undefined
    vendor.portalAccess.loginAttempts = 0
    vendor.portalAccess.lockUntil = undefined

    await vendor.save()

    res.json({ success: true, message: 'Password reset successful' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =====================
// PROTECTED ROUTES
// =====================

// Get vendor profile
router.get('/profile', protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id)
      .populate('company', 'name')

    res.json({ success: true, data: vendor })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update vendor profile
router.put('/profile', protectVendor, async (req, res) => {
  try {
    const allowedUpdates = ['phone', 'alternatePhone', 'address', 'bankDetails']
    const updates = {}

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    const vendor = await Vendor.findByIdAndUpdate(
      req.vendor._id,
      {
        $set: updates,
        $push: {
          activities: {
            action: 'profile_updated',
            description: 'Profile updated via vendor portal',
            performedByName: req.vendor.name
          }
        }
      },
      { new: true }
    )

    res.json({ success: true, data: vendor })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Change password
router.put('/change-password', protectVendor, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      })
    }

    const vendor = await Vendor.findById(req.vendor._id).select('+portalAccess.password')

    const isMatch = await vendor.matchPassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    }

    vendor.portalAccess.password = newPassword
    await vendor.save()

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get purchase orders for vendor
router.get('/purchase-orders', protectVendor, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query

    const query = { vendor: req.vendor._id }
    if (status) query.status = status

    const total = await PurchaseOrder.countDocuments(query)
    const orders = await PurchaseOrder.find(query)
      .populate('company', 'name')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: orders,
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

// Get single purchase order
router.get('/purchase-orders/:id', protectVendor, async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({
      _id: req.params.id,
      vendor: req.vendor._id
    })
      .populate('company', 'name')
      .populate('project', 'name')
      .populate('items.material', 'name unit')

    if (!order) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' })
    }

    res.json({ success: true, data: order })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get vendor dashboard stats
router.get('/dashboard', protectVendor, async (req, res) => {
  try {
    const vendorId = req.vendor._id

    // Get order statistics
    const [orderStats, recentOrders] = await Promise.all([
      PurchaseOrder.aggregate([
        { $match: { vendor: vendorId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalValue: { $sum: '$totalAmount' },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            approvedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ]),
      PurchaseOrder.find({ vendor: vendorId })
        .populate('company', 'name')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ])

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalValue: 0,
      pendingOrders: 0,
      approvedOrders: 0,
      completedOrders: 0
    }

    res.json({
      success: true,
      data: {
        stats,
        recentOrders,
        vendor: {
          name: req.vendor.name,
          vendorId: req.vendor.vendorId,
          status: req.vendor.status,
          rating: req.vendor.rating
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get vendor documents
router.get('/documents', protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id).select('documents')
    res.json({ success: true, data: vendor.documents || [] })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =====================
// RFQ ROUTES
// =====================

// Get RFQs for vendor
router.get('/rfqs', protectVendor, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query

    const query = { invitedVendors: req.vendor._id }
    if (status) query.status = status

    const total = await RequestForQuotation.countDocuments(query)
    const rfqs = await RequestForQuotation.find(query)
      .populate('company', 'name')
      .populate('project', 'title projectId')
      .populate('lineItems.material', 'materialName unit')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Add vendor's quotation status to each RFQ
    const rfqsWithStatus = rfqs.map(rfq => {
      const rfqObj = rfq.toObject()
      const vendorQuotation = rfq.vendorQuotations?.find(
        vq => vq.vendor.toString() === req.vendor._id.toString()
      )
      rfqObj.myQuotationStatus = vendorQuotation?.status || 'pending'
      rfqObj.myQuotation = vendorQuotation || null
      return rfqObj
    })

    res.json({
      success: true,
      data: rfqsWithStatus,
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

// Get single RFQ
router.get('/rfqs/:id', protectVendor, async (req, res) => {
  try {
    const rfq = await RequestForQuotation.findOne({
      _id: req.params.id,
      invitedVendors: req.vendor._id
    })
      .populate('company', 'name')
      .populate('project', 'title projectId')
      .populate('lineItems.material', 'materialName unit skuCode')
      .populate('purchaseRequisition', 'prNumber purpose')

    if (!rfq) {
      return res.status(404).json({ success: false, message: 'RFQ not found' })
    }

    const rfqObj = rfq.toObject()
    const vendorQuotation = rfq.vendorQuotations?.find(
      vq => vq.vendor.toString() === req.vendor._id.toString()
    )
    rfqObj.myQuotationStatus = vendorQuotation?.status || 'pending'
    rfqObj.myQuotation = vendorQuotation || null

    res.json({ success: true, data: rfqObj })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Submit quotation for RFQ
router.post('/rfqs/:id/quote', protectVendor, async (req, res) => {
  try {
    const { quotedItems, validUntil, paymentTerms, deliveryTerms, notes } = req.body

    const rfq = await RequestForQuotation.findOne({
      _id: req.params.id,
      invitedVendors: req.vendor._id,
      status: { $in: ['sent', 'in_progress'] }
    })

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: 'RFQ not found or not open for quotation'
      })
    }

    // Check deadline
    if (new Date() > new Date(rfq.quotationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Quotation deadline has passed'
      })
    }

    // Calculate total
    let totalQuotedAmount = 0
    quotedItems.forEach(item => {
      totalQuotedAmount += item.totalPrice || (item.unitPrice * (rfq.lineItems[item.lineItemIndex]?.quantity || 1))
    })

    // Find existing quotation or create new
    const existingIndex = rfq.vendorQuotations.findIndex(
      vq => vq.vendor.toString() === req.vendor._id.toString()
    )

    const quotationData = {
      vendor: req.vendor._id,
      status: 'submitted',
      quotedItems,
      totalQuotedAmount,
      validUntil,
      paymentTerms,
      deliveryTerms,
      notes,
      submittedAt: new Date()
    }

    if (existingIndex >= 0) {
      rfq.vendorQuotations[existingIndex] = quotationData
    } else {
      rfq.vendorQuotations.push(quotationData)
    }

    // Update RFQ status to in_progress if it was sent
    if (rfq.status === 'sent') {
      rfq.status = 'in_progress'
    }

    // Add activity
    rfq.activities.push({
      action: 'quotation_submitted',
      description: `Quotation submitted by ${req.vendor.name}`,
      performedByName: req.vendor.name
    })

    await rfq.save()

    res.json({
      success: true,
      message: 'Quotation submitted successfully',
      data: quotationData
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =====================
// MATERIALS ROUTES (Vendor can manage their own pricelist)
// =====================

// Get vendor's materials
router.get('/materials', protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id).select('materials name vendorId')
    res.json({
      success: true,
      data: vendor.materials || [],
      vendor: { name: vendor.name, vendorId: vendor.vendorId }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add material (vendor submitted)
router.post('/materials', protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id)

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    const materialData = {
      ...req.body,
      submittedByVendor: true,
      submittedAt: new Date(),
      status: 'active', // Vendor-submitted materials are active by default, can be changed to 'pending' if approval needed
      createdAt: new Date(),
      updatedAt: new Date(),
      priceHistory: [{
        price: req.body.currentPrice,
        priceMax: req.body.currentPriceMax,
        changedAt: new Date(),
        changedBy: req.vendor.name,
        remarks: 'Initial price (submitted by vendor)'
      }]
    }

    if (!Array.isArray(vendor.materials)) {
      vendor.materials = []
    }

    vendor.materials.push(materialData)
    vendor.activities.push({
      action: 'material_added_by_vendor',
      description: `Material "${req.body.materialName}" added via vendor portal`,
      performedByName: req.vendor.name
    })

    await vendor.save()

    res.status(201).json({
      success: true,
      message: 'Material added successfully',
      data: vendor.materials[vendor.materials.length - 1]
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update material
router.put('/materials/:materialId', protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id)

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    const materialIndex = vendor.materials.findIndex(
      m => m._id.toString() === req.params.materialId
    )

    if (materialIndex === -1) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    const oldMaterial = vendor.materials[materialIndex]
    const priceChanged = oldMaterial.currentPrice !== req.body.currentPrice ||
                         oldMaterial.currentPriceMax !== req.body.currentPriceMax

    // Update material fields
    Object.assign(vendor.materials[materialIndex], {
      ...req.body,
      updatedAt: new Date()
    })

    // Add price history if price changed
    if (priceChanged) {
      if (!Array.isArray(vendor.materials[materialIndex].priceHistory)) {
        vendor.materials[materialIndex].priceHistory = []
      }
      vendor.materials[materialIndex].priceHistory.push({
        price: req.body.currentPrice,
        priceMax: req.body.currentPriceMax,
        changedAt: new Date(),
        changedBy: req.vendor.name,
        remarks: req.body.priceChangeRemarks || 'Price updated via vendor portal'
      })
    }

    vendor.activities.push({
      action: 'material_updated_by_vendor',
      description: `Material "${req.body.materialName}" updated via vendor portal${priceChanged ? ' (price changed)' : ''}`,
      performedByName: req.vendor.name
    })

    await vendor.save()

    res.json({
      success: true,
      message: 'Material updated successfully',
      data: vendor.materials[materialIndex]
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete material
router.delete('/materials/:materialId', protectVendor, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id)

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    const materialIndex = vendor.materials.findIndex(
      m => m._id.toString() === req.params.materialId
    )

    if (materialIndex === -1) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    const materialName = vendor.materials[materialIndex].materialName
    vendor.materials.splice(materialIndex, 1)

    vendor.activities.push({
      action: 'material_deleted_by_vendor',
      description: `Material "${materialName}" deleted via vendor portal`,
      performedByName: req.vendor.name
    })

    await vendor.save()

    res.json({ success: true, message: 'Material deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =====================
// GRN VISIBILITY ROUTES
// =====================

// GET /grns - List GRNs for this vendor's POs
router.get('/grns', protectVendor, async (req, res) => {
  try {
    const GoodsReceipt = (await import('../models/GoodsReceipt.js')).default

    const vendorId = req.vendor._id

    // Find all POs for this vendor
    const vendorPOs = await PurchaseOrder.find({ vendor: vendorId }).select('_id poNumber')
    const poIds = vendorPOs.map(po => po._id)

    // Find GRNs linked to those POs
    const grns = await GoodsReceipt.find({ purchaseOrder: { $in: poIds } })
      .select('grnNumber purchaseOrder status receiptDate lineItems totalReceivedQuantity totalAcceptedQuantity totalRejectedQuantity qualityInspection createdAt')
      .populate('purchaseOrder', 'poNumber')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: grns })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =====================
// INVOICE ROUTES
// =====================

// POST /invoices - Vendor submits an invoice
router.post('/invoices', protectVendor, async (req, res) => {
  try {
    const VendorInvoice = (await import('../models/VendorInvoice.js')).default

    const vendor = req.vendor
    const {
      purchaseOrder, vendorInvoiceNumber, invoiceDate, dueDate,
      lineItems, invoiceTotal, taxAmount, notes
    } = req.body

    if (!vendorInvoiceNumber || !invoiceDate || !lineItems || !invoiceTotal) {
      return res.status(400).json({
        success: false,
        message: 'vendorInvoiceNumber, invoiceDate, lineItems, and invoiceTotal are required'
      })
    }

    // Verify the PO belongs to this vendor if provided
    if (purchaseOrder) {
      const po = await PurchaseOrder.findOne({ _id: purchaseOrder, vendor: vendor._id })
      if (!po) {
        return res.status(404).json({ success: false, message: 'Purchase order not found or does not belong to you' })
      }
    }

    const invoice = new VendorInvoice({
      vendor: vendor._id,
      company: vendor.company,
      purchaseOrder: purchaseOrder || undefined,
      vendorInvoiceNumber,
      invoiceDate,
      dueDate,
      lineItems: lineItems || [],
      invoiceTotal,
      totalTax: taxAmount || 0,
      internalNotes: notes,
      status: 'pending_verification',
      threeWayMatchStatus: 'pending',
      dataEntrySource: 'manual',
      activities: [{
        action: 'invoice_submitted',
        description: 'Invoice submitted via vendor portal',
        performedByName: vendor.name,
        createdAt: new Date()
      }]
    })

    await invoice.save()

    res.status(201).json({
      success: true,
      message: 'Invoice submitted successfully',
      data: invoice
    })
  } catch (error) {
    // Handle duplicate invoice error
    if (error.code === 'DUPLICATE_INVOICE') {
      return res.status(409).json({ success: false, message: error.message })
    }
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /invoices - List vendor's invoices with payment status
router.get('/invoices', protectVendor, async (req, res) => {
  try {
    const VendorInvoice = (await import('../models/VendorInvoice.js')).default

    const vendorId = req.vendor._id
    const { status, page = 1, limit = 20 } = req.query

    const query = { vendor: vendorId }
    if (status) query.status = status

    const total = await VendorInvoice.countDocuments(query)
    const invoices = await VendorInvoice.find(query)
      .select('invoiceNumber vendorInvoiceNumber invoiceDate dueDate invoiceTotal paidAmount balanceAmount status paymentStatus threeWayMatchStatus payments createdAt')
      .populate('purchaseOrder', 'poNumber')
      .sort({ invoiceDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: invoices,
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

// GET /invoices/:id - Get invoice detail
router.get('/invoices/:id', protectVendor, async (req, res) => {
  try {
    const VendorInvoice = (await import('../models/VendorInvoice.js')).default

    const invoice = await VendorInvoice.findOne({
      _id: req.params.id,
      vendor: req.vendor._id
    }).populate('purchaseOrder', 'poNumber')

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' })
    }

    res.json({ success: true, data: invoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =====================
// PO ACCEPTANCE ROUTES
// =====================

// PUT /purchase-orders/:id/acknowledge - Vendor acknowledges/accepts PO
router.put('/purchase-orders/:id/acknowledge', protectVendor, async (req, res) => {
  try {
    const vendorId = req.vendor._id

    const po = await PurchaseOrder.findOne({
      _id: req.params.id,
      vendor: vendorId
    })

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' })
    }

    if (po.status === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Purchase order is already confirmed' })
    }

    po.status = 'confirmed'

    if (!Array.isArray(po.activities)) {
      po.activities = []
    }
    po.activities.push({
      action: 'po_acknowledged',
      description: `PO acknowledged by vendor ${req.vendor.name} via vendor portal`,
      performedByName: req.vendor.name,
      createdAt: new Date()
    })

    await po.save()

    // Try to trigger notification to procurement team
    try {
      const { notifyEvent } = await import('../utils/notifications.js')
      if (notifyEvent) {
        await notifyEvent('po_acknowledged', {
          purchaseOrder: po,
          vendor: req.vendor,
          company: po.company
        })
      }
    } catch (notifyErr) {
      // Notification failure should not block the response
      console.log('Notification not sent (non-critical):', notifyErr.message)
    }

    res.json({
      success: true,
      message: 'Purchase order acknowledged successfully',
      data: po
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =====================
// PAYMENT STATUS ROUTES
// =====================

// GET /payments - Get payment history for vendor
router.get('/payments', protectVendor, async (req, res) => {
  try {
    const VendorInvoice = (await import('../models/VendorInvoice.js')).default

    const vendorId = req.vendor._id

    const invoices = await VendorInvoice.find({ vendor: vendorId })
      .select('invoiceNumber vendorInvoiceNumber invoiceTotal paidAmount balanceAmount status paymentStatus payments invoiceDate dueDate')
      .populate('purchaseOrder', 'poNumber')
      .sort({ invoiceDate: -1 })

    // Extract all payments from all invoices
    const allPayments = []
    let totalInvoiced = 0
    let totalPaid = 0
    let totalPending = 0

    invoices.forEach(inv => {
      totalInvoiced += inv.invoiceTotal || 0
      totalPaid += inv.paidAmount || 0
      totalPending += inv.balanceAmount || 0

      if (inv.payments && inv.payments.length > 0) {
        inv.payments.forEach(payment => {
          allPayments.push({
            invoiceNumber: inv.invoiceNumber,
            vendorInvoiceNumber: inv.vendorInvoiceNumber,
            paymentDate: payment.paymentDate,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            referenceNumber: payment.referenceNumber,
            bankName: payment.bankName,
            chequeNumber: payment.chequeNumber,
            remarks: payment.remarks
          })
        })
      }
    })

    // Sort payments by date descending
    allPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))

    res.json({
      success: true,
      data: {
        summary: {
          totalInvoiced,
          totalPaid,
          totalPending
        },
        payments: allPayments,
        invoices
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =====================
// CREDIT/DEBIT NOTE ROUTES
// =====================

// GET /credit-notes - List credit/debit notes for vendor
router.get('/credit-notes', protectVendor, async (req, res) => {
  try {
    const CreditDebitNote = (await import('../models/CreditDebitNote.js')).default

    const vendorId = req.vendor._id
    const { noteType, status, page = 1, limit = 20 } = req.query

    const query = { vendor: vendorId }
    if (noteType) query.noteType = noteType
    if (status) query.status = status

    const total = await CreditDebitNote.countDocuments(query)
    const notes = await CreditDebitNote.find(query)
      .select('noteNumber noteType reason lineItems subTotal totalTax totalAmount status appliedToInvoice appliedAmount createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: notes,
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

// =====================
// ENHANCED DASHBOARD (with GRN, Invoice, Payment stats)
// =====================

// Update dashboard to include RFQ, GRN, Invoice, and Payment stats
router.get('/dashboard-enhanced', protectVendor, async (req, res) => {
  try {
    const GoodsReceipt = (await import('../models/GoodsReceipt.js')).default
    const VendorInvoice = (await import('../models/VendorInvoice.js')).default

    const vendorId = req.vendor._id

    // Get all PO IDs for GRN lookup
    const vendorPOs = await PurchaseOrder.find({ vendor: vendorId }).select('_id')
    const poIds = vendorPOs.map(po => po._id)

    // Get order, RFQ, GRN, and invoice statistics in parallel
    const [orderStats, rfqStats, grnStats, invoiceStats, recentOrders, recentRfqs] = await Promise.all([
      PurchaseOrder.aggregate([
        { $match: { vendor: vendorId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalValue: { $sum: '$totalAmount' },
            pendingOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            approvedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            completedOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ]),
      RequestForQuotation.aggregate([
        { $match: { invitedVendors: vendorId } },
        {
          $group: {
            _id: null,
            totalRfqs: { $sum: 1 },
            pendingRfqs: {
              $sum: { $cond: [{ $in: ['$status', ['sent', 'in_progress']] }, 1, 0] }
            },
            awardedRfqs: {
              $sum: { $cond: [{ $and: [{ $eq: ['$status', 'awarded'] }, { $eq: ['$awardedVendor', vendorId] }] }, 1, 0] }
            }
          }
        }
      ]),
      GoodsReceipt.aggregate([
        { $match: { purchaseOrder: { $in: poIds } } },
        {
          $group: {
            _id: null,
            totalGrns: { $sum: 1 },
            pendingInspection: {
              $sum: { $cond: [{ $in: ['$status', ['draft', 'received', 'inspection_pending']] }, 1, 0] }
            },
            accepted: {
              $sum: { $cond: [{ $in: ['$status', ['accepted', 'inspection_completed']] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            }
          }
        }
      ]),
      VendorInvoice.aggregate([
        { $match: { vendor: vendorId } },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            pendingInvoices: {
              $sum: { $cond: [{ $in: ['$status', ['draft', 'pending_verification', 'pending_approval']] }, 1, 0] }
            },
            approvedInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            paidInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
            },
            totalInvoiced: { $sum: '$invoiceTotal' },
            totalPaid: { $sum: '$paidAmount' },
            totalPending: { $sum: '$balanceAmount' }
          }
        }
      ]),
      PurchaseOrder.find({ vendor: vendorId })
        .populate('company', 'name')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      RequestForQuotation.find({ invitedVendors: vendorId })
        .populate('company', 'name')
        .populate('project', 'title')
        .sort({ createdAt: -1 })
        .limit(5)
    ])

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalValue: 0,
      pendingOrders: 0,
      approvedOrders: 0,
      completedOrders: 0
    }

    const rfqStatsData = rfqStats[0] || {
      totalRfqs: 0,
      pendingRfqs: 0,
      awardedRfqs: 0
    }

    const grnStatsData = grnStats[0] || {
      totalGrns: 0,
      pendingInspection: 0,
      accepted: 0,
      rejected: 0
    }

    const invoiceStatsData = invoiceStats[0] || {
      totalInvoices: 0,
      pendingInvoices: 0,
      approvedInvoices: 0,
      paidInvoices: 0,
      totalInvoiced: 0,
      totalPaid: 0,
      totalPending: 0
    }

    res.json({
      success: true,
      data: {
        stats: { ...stats, ...rfqStatsData },
        grnStats: grnStatsData,
        invoiceStats: invoiceStatsData,
        paymentSummary: {
          totalInvoiced: invoiceStatsData.totalInvoiced,
          totalPaid: invoiceStatsData.totalPaid,
          totalPending: invoiceStatsData.totalPending
        },
        recentOrders,
        recentRfqs,
        vendor: {
          name: req.vendor.name,
          vendorId: req.vendor.vendorId,
          status: req.vendor.status,
          rating: req.vendor.rating
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
