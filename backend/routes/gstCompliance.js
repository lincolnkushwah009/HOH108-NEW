import express from 'express'
import EInvoice from '../models/EInvoice.js'
import GSTReturn from '../models/GSTReturn.js'
import TDSConfig from '../models/TDSConfig.js'
import CreditDebitNote from '../models/CreditDebitNote.js'
import CustomerInvoice from '../models/CustomerInvoice.js'
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

// =============================================
// E-INVOICE
// =============================================

// Generate e-invoice JSON from CustomerInvoice ID
router.post('/e-invoices/generate', async (req, res) => {
  try {
    const { customerInvoiceId } = req.body

    if (!customerInvoiceId) {
      return res.status(400).json({ success: false, message: 'customerInvoiceId is required' })
    }

    const invoice = await CustomerInvoice.findOne({
      _id: customerInvoiceId,
      company: req.activeCompany._id
    })
      .populate('customer', 'name email phone address')

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Customer invoice not found' })
    }

    // Check if e-invoice already exists for this invoice
    const existing = await EInvoice.findOne({
      customerInvoice: customerInvoiceId,
      company: req.activeCompany._id,
      status: { $ne: 'cancelled' }
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'E-invoice already exists for this invoice',
        data: existing
      })
    }

    // Build e-invoice JSON payload (IRP-compatible structure placeholder)
    const eInvoiceJson = {
      Version: '1.1',
      TranDtls: {
        TaxSch: 'GST',
        SupTyp: 'B2B',
        RegRev: 'N'
      },
      DocDtls: {
        Typ: 'INV',
        No: invoice.invoiceNumber,
        Dt: new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        })
      },
      SellerDtls: {
        Gstin: req.activeCompany.gstNumber || 'PLACEHOLDER_GSTIN',
        LglNm: req.activeCompany.name || 'Company',
        Addr1: req.activeCompany.address?.street || '',
        Loc: req.activeCompany.address?.city || '',
        Pin: parseInt(req.activeCompany.address?.pincode) || 0,
        Stcd: req.activeCompany.address?.stateCode || '29'
      },
      BuyerDtls: {
        Gstin: invoice.billingAddress?.gstNumber || 'URP',
        LglNm: invoice.customer?.name || invoice.billingAddress?.name || '',
        Addr1: invoice.billingAddress?.street || '',
        Loc: invoice.billingAddress?.city || '',
        Pin: parseInt(invoice.billingAddress?.pincode) || 0,
        Stcd: invoice.billingAddress?.state || '29'
      },
      ItemList: invoice.lineItems.map((item, idx) => ({
        SlNo: String(idx + 1),
        PrdDesc: item.description,
        IsServc: item.sacCode ? 'Y' : 'N',
        HsnCd: item.hsnCode || item.sacCode || '0000',
        Qty: item.quantity,
        Unit: item.unit || 'NOS',
        UnitPrice: item.unitPrice,
        TotAmt: item.quantity * item.unitPrice,
        Discount: item.discount || 0,
        AssAmt: item.totalAmount - (item.cgst + item.sgst + item.igst),
        GstRt: item.taxRate,
        CgstAmt: item.cgst,
        SgstAmt: item.sgst,
        IgstAmt: item.igst,
        TotItemVal: item.totalAmount
      })),
      ValDtls: {
        AssVal: invoice.subTotal - invoice.totalDiscount,
        CgstVal: invoice.totalCGST,
        SgstVal: invoice.totalSGST,
        IgstVal: invoice.totalIGST,
        OthChrg: (invoice.shippingCharges || 0) + (invoice.otherCharges || 0),
        RndOffAmt: invoice.roundOff || 0,
        TotInvVal: invoice.invoiceTotal
      }
    }

    // Create EInvoice record with placeholder IRN
    const eInvoice = await EInvoice.create({
      company: req.activeCompany._id,
      customerInvoice: customerInvoiceId,
      irn: `IRN-PLACEHOLDER-${Date.now()}`,
      status: 'generated',
      eInvoiceJson,
      generatedAt: new Date(),
      generatedBy: req.user._id
    })

    res.status(201).json({ success: true, data: eInvoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List e-invoices (company scoped, paginated)
router.get('/e-invoices', async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status

    const total = await EInvoice.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const eInvoices = await EInvoice.find(queryFilter)
      .populate('customerInvoice', 'invoiceNumber invoiceDate invoiceTotal customer')
      .populate('generatedBy', 'name email')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: eInvoices,
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

// Cancel e-invoice
router.put('/e-invoices/:id/cancel', async (req, res) => {
  try {
    const eInvoice = await EInvoice.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!eInvoice) {
      return res.status(404).json({ success: false, message: 'E-invoice not found' })
    }

    if (eInvoice.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'E-invoice is already cancelled' })
    }

    eInvoice.status = 'cancelled'
    eInvoice.cancelReason = req.body.cancelReason || 'Cancelled by user'
    eInvoice.cancelledAt = new Date()

    await eInvoice.save()

    res.json({ success: true, data: eInvoice })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =============================================
// GSTR-1
// =============================================

// Prepare GSTR-1 from invoices for a period
router.post('/gstr1/prepare', async (req, res) => {
  try {
    const { month, year } = req.query

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'month and year query parameters are required' })
    }

    const periodMonth = parseInt(month)
    const periodYear = parseInt(year)

    // Check if a return already exists for this period
    const existingReturn = await GSTReturn.findOne({
      company: req.activeCompany._id,
      returnType: 'GSTR1',
      'period.month': periodMonth,
      'period.year': periodYear
    })

    if (existingReturn && existingReturn.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `GSTR-1 for ${periodMonth}/${periodYear} is already ${existingReturn.status}`,
        data: existingReturn
      })
    }

    // Get all invoices for the period
    const startDate = new Date(periodYear, periodMonth - 1, 1)
    const endDate = new Date(periodYear, periodMonth, 0, 23, 59, 59)

    const invoices = await CustomerInvoice.find({
      company: req.activeCompany._id,
      invoiceDate: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' },
      invoiceType: 'tax_invoice'
    }).populate('customer', 'name address')

    // Aggregate B2B invoices (customer has GSTIN)
    const b2bMap = {}
    const b2cMap = {}
    let totalTaxableValue = 0
    let totalCGST = 0
    let totalSGST = 0
    let totalIGST = 0
    const hsnMap = {}

    for (const inv of invoices) {
      const customerGSTIN = inv.billingAddress?.gstNumber

      const invoiceDetail = {
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        invoiceValue: inv.invoiceTotal,
        taxableValue: inv.subTotal - inv.totalDiscount,
        cgst: inv.totalCGST,
        sgst: inv.totalSGST,
        igst: inv.totalIGST
      }

      totalTaxableValue += invoiceDetail.taxableValue
      totalCGST += inv.totalCGST
      totalSGST += inv.totalSGST
      totalIGST += inv.totalIGST

      if (customerGSTIN && customerGSTIN !== 'URP') {
        // B2B
        if (!b2bMap[customerGSTIN]) {
          b2bMap[customerGSTIN] = { customerGSTIN, invoices: [] }
        }
        b2bMap[customerGSTIN].invoices.push(invoiceDetail)
      } else {
        // B2C - group by state
        const stateCode = inv.billingAddress?.state || '99'
        if (!b2cMap[stateCode]) {
          b2cMap[stateCode] = { stateCode, invoices: [] }
        }
        b2cMap[stateCode].invoices.push(invoiceDetail)
      }

      // Build HSN summary
      for (const item of inv.lineItems) {
        const hsn = item.hsnCode || item.sacCode || '0000'
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsnCode: hsn,
            description: item.description,
            quantity: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0
          }
        }
        hsnMap[hsn].quantity += item.quantity
        const taxable = (item.quantity * item.unitPrice) - (item.discount || 0)
        hsnMap[hsn].taxableValue += taxable
        hsnMap[hsn].cgst += item.cgst
        hsnMap[hsn].sgst += item.sgst
        hsnMap[hsn].igst += item.igst
      }
    }

    const returnData = {
      company: req.activeCompany._id,
      returnType: 'GSTR1',
      period: { month: periodMonth, year: periodYear },
      status: 'prepared',
      b2b: Object.values(b2bMap),
      b2c: Object.values(b2cMap),
      hsnSummary: Object.values(hsnMap),
      totalTaxableValue,
      totalCGST,
      totalSGST,
      totalIGST,
      preparedBy: req.user._id
    }

    let gstReturn
    if (existingReturn) {
      // Update existing draft
      Object.assign(existingReturn, returnData)
      await existingReturn.save()
      gstReturn = existingReturn
    } else {
      gstReturn = await GSTReturn.create(returnData)
    }

    res.status(201).json({
      success: true,
      data: gstReturn,
      meta: {
        invoicesProcessed: invoices.length,
        b2bRecipients: Object.keys(b2bMap).length,
        b2cStates: Object.keys(b2cMap).length
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List prepared GSTR-1 returns
router.get('/gstr1', async (req, res) => {
  try {
    const {
      status,
      year,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req, { returnType: 'GSTR1' })

    if (status) queryFilter.status = status
    if (year) queryFilter['period.year'] = parseInt(year)

    const total = await GSTReturn.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const returns = await GSTReturn.find(queryFilter)
      .populate('preparedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: returns,
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

// HSN-wise summary for a return
router.get('/gstr1/:id/hsn-summary', async (req, res) => {
  try {
    const gstReturn = await GSTReturn.findOne({
      _id: req.params.id,
      company: req.activeCompany._id,
      returnType: 'GSTR1'
    })

    if (!gstReturn) {
      return res.status(404).json({ success: false, message: 'GSTR-1 return not found' })
    }

    const summary = {
      period: gstReturn.period,
      status: gstReturn.status,
      hsnSummary: gstReturn.hsnSummary,
      totals: {
        taxableValue: gstReturn.totalTaxableValue,
        cgst: gstReturn.totalCGST,
        sgst: gstReturn.totalSGST,
        igst: gstReturn.totalIGST,
        totalTax: gstReturn.totalCGST + gstReturn.totalSGST + gstReturn.totalIGST
      }
    }

    res.json({ success: true, data: summary })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =============================================
// TDS CONFIG
// =============================================

// Create TDS config
router.post('/tds-configs', async (req, res) => {
  try {
    const tdsConfig = await TDSConfig.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id
    })

    res.status(201).json({ success: true, data: tdsConfig })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List TDS configs
router.get('/tds-configs', async (req, res) => {
  try {
    const {
      vendor,
      section,
      isActive,
      page = 1,
      limit = 20
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (vendor) queryFilter.vendor = vendor
    if (section) queryFilter.section = section
    if (isActive !== undefined) queryFilter.isActive = isActive === 'true'

    const total = await TDSConfig.countDocuments(queryFilter)

    const configs = await TDSConfig.find(queryFilter)
      .populate('vendor', 'name vendorId')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: configs,
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

// Update TDS config
router.put('/tds-configs/:id', async (req, res) => {
  try {
    const tdsConfig = await TDSConfig.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!tdsConfig) {
      return res.status(404).json({ success: false, message: 'TDS config not found' })
    }

    const { tdsRate, thresholdAmount, isActive, pan, tanNumber, validFrom, validTo, section } = req.body

    if (tdsRate !== undefined) tdsConfig.tdsRate = tdsRate
    if (thresholdAmount !== undefined) tdsConfig.thresholdAmount = thresholdAmount
    if (isActive !== undefined) tdsConfig.isActive = isActive
    if (pan) tdsConfig.pan = pan
    if (tanNumber) tdsConfig.tanNumber = tanNumber
    if (validFrom) tdsConfig.validFrom = validFrom
    if (validTo) tdsConfig.validTo = validTo
    if (section) tdsConfig.section = section

    await tdsConfig.save()

    res.json({ success: true, data: tdsConfig })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =============================================
// CREDIT / DEBIT NOTES
// =============================================

// Create credit/debit note
router.post('/credit-debit-notes', async (req, res) => {
  try {
    const note = await CreditDebitNote.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        performedBy: req.user._id,
        performedByName: req.user.name,
        details: `${req.body.noteType === 'credit_note' ? 'Credit' : 'Debit'} note created`
      }]
    })

    const populated = await CreditDebitNote.findById(note._id)
      .populate('customer', 'name customerId')
      .populate('vendor', 'name vendorId')

    res.status(201).json({ success: true, data: populated })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// List credit/debit notes
router.get('/credit-debit-notes', async (req, res) => {
  try {
    const {
      noteType,
      status,
      customer,
      vendor,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (noteType) queryFilter.noteType = noteType
    if (status) queryFilter.status = status
    if (customer) queryFilter.customer = customer
    if (vendor) queryFilter.vendor = vendor

    const total = await CreditDebitNote.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const notes = await CreditDebitNote.find(queryFilter)
      .populate('customer', 'name customerId')
      .populate('vendor', 'name vendorId')
      .populate('createdBy', 'name email')
      .sort(sortOptions)
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

// Update credit/debit note
router.put('/credit-debit-notes/:id', async (req, res) => {
  try {
    const note = await CreditDebitNote.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!note) {
      return res.status(404).json({ success: false, message: 'Credit/Debit note not found' })
    }

    if (!['draft'].includes(note.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update note in current status. Only draft notes can be edited.'
      })
    }

    const { lineItems, reason, gstTreatment, status } = req.body

    if (lineItems) note.lineItems = lineItems
    if (reason) note.reason = reason
    if (gstTreatment) note.gstTreatment = gstTreatment
    if (status) note.status = status

    note.activities.push({
      action: 'updated',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: 'Note updated'
    })

    await note.save()

    res.json({ success: true, data: note })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Apply CN/DN to invoice (update linked invoice balance)
router.put('/credit-debit-notes/:id/apply', async (req, res) => {
  try {
    const note = await CreditDebitNote.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!note) {
      return res.status(404).json({ success: false, message: 'Credit/Debit note not found' })
    }

    if (note.status === 'applied') {
      return res.status(400).json({ success: false, message: 'Note has already been applied' })
    }

    if (note.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot apply a cancelled note' })
    }

    const { invoiceId } = req.body

    if (!invoiceId) {
      return res.status(400).json({ success: false, message: 'invoiceId is required' })
    }

    // Find the target invoice
    const invoice = await CustomerInvoice.findOne({
      _id: invoiceId,
      company: req.activeCompany._id
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Target invoice not found' })
    }

    // Apply the note amount to the invoice balance
    if (note.noteType === 'credit_note') {
      // Credit note reduces the invoice balance
      invoice.paidAmount = (invoice.paidAmount || 0) + note.totalAmount
      invoice.balanceAmount = invoice.invoiceTotal - invoice.paidAmount

      if (invoice.balanceAmount <= 0) {
        invoice.paymentStatus = 'paid'
        if (invoice.status !== 'cancelled') invoice.status = 'paid'
      } else if (invoice.paidAmount > 0) {
        invoice.paymentStatus = 'partially_paid'
        if (invoice.status !== 'cancelled') invoice.status = 'partially_paid'
      }

      invoice.activities.push({
        action: 'credit_note_applied',
        description: `Credit note ${note.noteNumber} applied for ${note.totalAmount}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })
    } else {
      // Debit note increases the invoice total (additional charges)
      invoice.invoiceTotal = (invoice.invoiceTotal || 0) + note.totalAmount
      invoice.balanceAmount = invoice.invoiceTotal - (invoice.paidAmount || 0)

      if (invoice.balanceAmount > 0 && invoice.paidAmount > 0) {
        invoice.paymentStatus = 'partially_paid'
        if (invoice.status !== 'cancelled') invoice.status = 'partially_paid'
      } else if (invoice.balanceAmount > 0) {
        invoice.paymentStatus = 'unpaid'
      }

      invoice.activities.push({
        action: 'debit_note_applied',
        description: `Debit note ${note.noteNumber} applied for ${note.totalAmount}`,
        performedBy: req.user._id,
        performedByName: req.user.name
      })
    }

    await invoice.save()

    // Update the note status
    note.status = 'applied'
    note.appliedToInvoice = invoiceId
    note.appliedAmount = note.totalAmount
    note.activities.push({
      action: 'applied',
      performedBy: req.user._id,
      performedByName: req.user.name,
      details: `Applied to invoice ${invoice.invoiceNumber}`
    })

    await note.save()

    res.json({
      success: true,
      message: `${note.noteType === 'credit_note' ? 'Credit' : 'Debit'} note applied successfully`,
      data: {
        note,
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceTotal: invoice.invoiceTotal,
          paidAmount: invoice.paidAmount,
          balanceAmount: invoice.balanceAmount,
          paymentStatus: invoice.paymentStatus
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
