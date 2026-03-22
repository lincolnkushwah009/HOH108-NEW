import express from 'express'
import PDFDocument from 'pdfkit'
import BOQQuote from '../models/BOQQuote.js'
import BOQItem from '../models/BOQItem.js'
import Package from '../models/Package.js'
import {
  protect,
  setCompanyContext,
  requireModulePermission,
  companyScopedQuery
} from '../middleware/rbac.js'

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// ==================== BOQ ITEMS ====================

// Get all BOQ items (master list)
router.get('/items', requireModulePermission('boq_generator', 'view'), async (req, res) => {
  try {
    const { category, search, active = 'true' } = req.query
    const queryFilter = companyScopedQuery(req)

    if (active === 'true') queryFilter.isActive = true
    if (category) queryFilter.category = category
    if (search) {
      queryFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ]
    }

    const items = await BOQItem.find(queryFilter)
      .sort({ sortOrder: 1, name: 1 })

    res.json({ success: true, data: items })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create BOQ item
router.post('/items', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const item = new BOQItem({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id
    })
    await item.save()
    res.status(201).json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update BOQ item
router.put('/items/:id', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const item = await BOQItem.findOneAndUpdate(
      { _id: req.params.id, company: req.activeCompany._id },
      { ...req.body, updatedBy: req.user._id },
      { new: true }
    )
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' })
    }
    res.json({ success: true, data: item })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete BOQ item
router.delete('/items/:id', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const item = await BOQItem.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id
    })
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' })
    }
    res.json({ success: true, message: 'Item deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Bulk create BOQ items (for initial setup)
router.post('/items/bulk', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const { items } = req.body
    const createdItems = await BOQItem.insertMany(
      items.map(item => ({
        ...item,
        company: req.activeCompany._id,
        createdBy: req.user._id
      }))
    )
    res.status(201).json({ success: true, data: createdItems, count: createdItems.length })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ==================== PACKAGES ====================

// Get all packages
router.get('/packages', requireModulePermission('boq_generator', 'view'), async (req, res) => {
  try {
    const queryFilter = companyScopedQuery(req)
    queryFilter.isActive = true

    const packages = await Package.find(queryFilter)
      .sort({ sortOrder: 1 })

    res.json({ success: true, data: packages })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create package
router.post('/packages', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const pkg = new Package({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id
    })
    await pkg.save()
    res.status(201).json({ success: true, data: pkg })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update package
router.put('/packages/:id', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const pkg = await Package.findOneAndUpdate(
      { _id: req.params.id, company: req.activeCompany._id },
      req.body,
      { new: true }
    )
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' })
    }
    res.json({ success: true, data: pkg })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete package
router.delete('/packages/:id', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const pkg = await Package.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id
    })
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' })
    }
    res.json({ success: true, message: 'Package deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Seed default packages
router.post('/packages/seed', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const existingCount = await Package.countDocuments({ company: req.activeCompany._id })
    if (existingCount > 0) {
      return res.json({ success: true, message: 'Packages already exist', skipped: true })
    }

    const defaultPackages = [
      { name: 'Basic', code: 'BASIC', description: 'Essential interior package', color: '#6b7280', sortOrder: 1 },
      { name: 'Standard', code: 'STANDARD', description: 'Standard interior package with quality materials', color: '#3b82f6', sortOrder: 2, isDefault: true },
      { name: 'Premium', code: 'PREMIUM', description: 'Premium quality materials and finishes', color: '#8b5cf6', sortOrder: 3 },
      { name: 'Luxury', code: 'LUXURY', description: 'Top-tier luxury interiors', color: '#edbc5c', sortOrder: 4 }
    ]

    const packages = await Package.insertMany(
      defaultPackages.map(pkg => ({
        ...pkg,
        company: req.activeCompany._id,
        createdBy: req.user._id
      }))
    )

    res.status(201).json({ success: true, data: packages })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ==================== BOQ QUOTES ====================

// Get all BOQ quotes
router.get('/', requireModulePermission('boq_generator', 'view'), async (req, res) => {
  try {
    const {
      status,
      createdBy,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (createdBy) queryFilter.createdByUser = createdBy
    if (dateFrom || dateTo) {
      queryFilter.createdAt = {}
      if (dateFrom) queryFilter.createdAt.$gte = new Date(dateFrom)
      if (dateTo) queryFilter.createdAt.$lte = new Date(dateTo)
    }
    if (search) {
      queryFilter.$or = [
        { quoteId: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { place: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await BOQQuote.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const quotes = await BOQQuote.find(queryFilter)
      .populate('createdByUser', 'name')
      .populate('lead', 'name email')
      .populate('customer', 'name customerId')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    // Get stats
    const stats = await BOQQuote.aggregate([
      { $match: { company: req.activeCompany._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$grandTotal' }
        }
      }
    ])

    res.json({
      success: true,
      data: quotes,
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

// Get single BOQ quote
router.get('/:id', requireModulePermission('boq_generator', 'view'), async (req, res) => {
  try {
    const quote = await BOQQuote.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })
      .populate('createdByUser', 'name email')
      .populate('lead', 'name email phone')
      .populate('customer', 'name customerId email phone')

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' })
    }

    res.json({ success: true, data: quote })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create BOQ quote
router.post('/', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const quote = new BOQQuote({
      ...req.body,
      company: req.activeCompany._id,
      createdByUser: req.user._id,
      creatorName: req.user.name
    })

    await quote.save()
    res.status(201).json({ success: true, data: quote })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update BOQ quote
router.put('/:id', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const quote = await BOQQuote.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' })
    }

    // Don't allow editing sent/accepted quotes
    if (['accepted', 'converted'].includes(quote.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit accepted/converted quotes' })
    }

    Object.assign(quote, req.body)
    await quote.save()

    res.json({ success: true, data: quote })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete BOQ quote
router.delete('/:id', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const quote = await BOQQuote.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id,
      status: { $in: ['draft'] } // Only delete drafts
    })

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found or cannot be deleted' })
    }

    res.json({ success: true, message: 'Quote deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get cost config for item + package combination
router.get('/cost-config/:itemId/:packageCode', requireModulePermission('boq_generator', 'view'), async (req, res) => {
  try {
    const { itemId, packageCode } = req.params

    const item = await BOQItem.findOne({
      _id: itemId,
      company: req.activeCompany._id
    })

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' })
    }

    const { rate, percent } = item.getRateForPackage(packageCode)

    res.json({
      success: true,
      data: {
        itemId: item._id,
        itemName: item.name,
        unit: item.unit,
        packageCode,
        rate,
        percent
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get all items with pricing for a specific package
router.get('/items-with-pricing/:packageCode', requireModulePermission('boq_generator', 'view'), async (req, res) => {
  try {
    const { packageCode } = req.params
    const queryFilter = companyScopedQuery(req)
    queryFilter.isActive = true

    const items = await BOQItem.find(queryFilter).sort({ sortOrder: 1, name: 1 })

    const itemsWithPricing = items.map(item => {
      const { rate, percent } = item.getRateForPackage(packageCode)
      return {
        _id: item._id,
        name: item.name,
        code: item.code,
        category: item.category,
        unit: item.unit,
        rate,
        percent
      }
    })

    res.json({ success: true, data: itemsWithPricing })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Seed sample BOQ items
router.post('/items/seed', requireModulePermission('boq_generator', 'edit'), async (req, res) => {
  try {
    const existingCount = await BOQItem.countDocuments({ company: req.activeCompany._id })
    if (existingCount > 0) {
      return res.json({ success: true, message: 'Items already exist', skipped: true })
    }

    const sampleItems = [
      {
        name: 'Modular Kitchen - Base',
        code: 'MK-BASE',
        category: 'modular_kitchen',
        unit: 'sqft',
        packagePricing: [
          { package: 'BASIC', rate: 850, percent: 100 },
          { package: 'STANDARD', rate: 1200, percent: 100 },
          { package: 'PREMIUM', rate: 1800, percent: 100 },
          { package: 'LUXURY', rate: 2500, percent: 100 }
        ],
        sortOrder: 1
      },
      {
        name: 'Modular Kitchen - Wall Units',
        code: 'MK-WALL',
        category: 'modular_kitchen',
        unit: 'sqft',
        packagePricing: [
          { package: 'BASIC', rate: 750, percent: 100 },
          { package: 'STANDARD', rate: 1100, percent: 100 },
          { package: 'PREMIUM', rate: 1600, percent: 100 },
          { package: 'LUXURY', rate: 2200, percent: 100 }
        ],
        sortOrder: 2
      },
      {
        name: 'Wardrobe - Sliding',
        code: 'WD-SLIDE',
        category: 'wardrobe',
        unit: 'sqft',
        packagePricing: [
          { package: 'BASIC', rate: 700, percent: 100 },
          { package: 'STANDARD', rate: 950, percent: 100 },
          { package: 'PREMIUM', rate: 1400, percent: 100 },
          { package: 'LUXURY', rate: 2000, percent: 100 }
        ],
        sortOrder: 3
      },
      {
        name: 'Wardrobe - Hinged',
        code: 'WD-HINGE',
        category: 'wardrobe',
        unit: 'sqft',
        packagePricing: [
          { package: 'BASIC', rate: 650, percent: 100 },
          { package: 'STANDARD', rate: 900, percent: 100 },
          { package: 'PREMIUM', rate: 1300, percent: 100 },
          { package: 'LUXURY', rate: 1850, percent: 100 }
        ],
        sortOrder: 4
      },
      {
        name: 'False Ceiling - Plain',
        code: 'FC-PLAIN',
        category: 'false_ceiling',
        unit: 'sqft',
        packagePricing: [
          { package: 'BASIC', rate: 85, percent: 100 },
          { package: 'STANDARD', rate: 110, percent: 100 },
          { package: 'PREMIUM', rate: 145, percent: 100 },
          { package: 'LUXURY', rate: 190, percent: 100 }
        ],
        sortOrder: 5
      },
      {
        name: 'False Ceiling - Designer',
        code: 'FC-DESIGN',
        category: 'false_ceiling',
        unit: 'sqft',
        packagePricing: [
          { package: 'BASIC', rate: 120, percent: 100 },
          { package: 'STANDARD', rate: 160, percent: 100 },
          { package: 'PREMIUM', rate: 220, percent: 100 },
          { package: 'LUXURY', rate: 300, percent: 100 }
        ],
        sortOrder: 6
      },
      {
        name: 'Wall Painting - Interior',
        code: 'PT-INT',
        category: 'painting',
        unit: 'sqft',
        packagePricing: [
          { package: 'BASIC', rate: 18, percent: 100 },
          { package: 'STANDARD', rate: 25, percent: 100 },
          { package: 'PREMIUM', rate: 35, percent: 100 },
          { package: 'LUXURY', rate: 50, percent: 100 }
        ],
        sortOrder: 7
      },
      {
        name: 'Flooring - Tiles',
        code: 'FL-TILE',
        category: 'flooring',
        unit: 'sqft',
        packagePricing: [
          { package: 'BASIC', rate: 65, percent: 100 },
          { package: 'STANDARD', rate: 95, percent: 100 },
          { package: 'PREMIUM', rate: 140, percent: 100 },
          { package: 'LUXURY', rate: 200, percent: 100 }
        ],
        sortOrder: 8
      },
      {
        name: 'Flooring - Wooden',
        code: 'FL-WOOD',
        category: 'flooring',
        unit: 'sqft',
        packagePricing: [
          { package: 'BASIC', rate: 120, percent: 100 },
          { package: 'STANDARD', rate: 180, percent: 100 },
          { package: 'PREMIUM', rate: 280, percent: 100 },
          { package: 'LUXURY', rate: 400, percent: 100 }
        ],
        sortOrder: 9
      },
      {
        name: 'TV Unit',
        code: 'FN-TV',
        category: 'furniture',
        unit: 'rft',
        packagePricing: [
          { package: 'BASIC', rate: 1200, percent: 100 },
          { package: 'STANDARD', rate: 1800, percent: 100 },
          { package: 'PREMIUM', rate: 2500, percent: 100 },
          { package: 'LUXURY', rate: 3500, percent: 100 }
        ],
        sortOrder: 10
      },
      {
        name: 'Study Table',
        code: 'FN-STUDY',
        category: 'furniture',
        unit: 'nos',
        packagePricing: [
          { package: 'BASIC', rate: 8000, percent: 100 },
          { package: 'STANDARD', rate: 12000, percent: 100 },
          { package: 'PREMIUM', rate: 18000, percent: 100 },
          { package: 'LUXURY', rate: 28000, percent: 100 }
        ],
        sortOrder: 11
      },
      {
        name: 'Electrical - Points',
        code: 'EL-POINT',
        category: 'electrical',
        unit: 'nos',
        packagePricing: [
          { package: 'BASIC', rate: 350, percent: 100 },
          { package: 'STANDARD', rate: 500, percent: 100 },
          { package: 'PREMIUM', rate: 750, percent: 100 },
          { package: 'LUXURY', rate: 1000, percent: 100 }
        ],
        sortOrder: 12
      },
      {
        name: 'Bathroom - Complete',
        code: 'BT-COMP',
        category: 'bathroom',
        unit: 'nos',
        packagePricing: [
          { package: 'BASIC', rate: 45000, percent: 100 },
          { package: 'STANDARD', rate: 75000, percent: 100 },
          { package: 'PREMIUM', rate: 120000, percent: 100 },
          { package: 'LUXURY', rate: 200000, percent: 100 }
        ],
        sortOrder: 13
      }
    ]

    const items = await BOQItem.insertMany(
      sampleItems.map(item => ({
        ...item,
        company: req.activeCompany._id,
        createdBy: req.user._id
      }))
    )

    res.status(201).json({ success: true, data: items, count: items.length })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ==================== PDF GENERATION ====================

// Generate PDF for quote (without saving to DB) - HOH108 Style
router.post('/generate-pdf', requireModulePermission('boq_generator', 'view'), async (req, res) => {
  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      place,
      projectType,
      floors,
      builtUpArea,
      package: packageCode,
      items,
      creatorName
    } = req.body

    // Get package details
    const pkg = await Package.findOne({
      company: req.activeCompany._id,
      code: packageCode
    })

    // Calculate totals
    const grandTotal = items.reduce((sum, item) => sum + (item.cost || 0), 0)

    // Generate Quote ID
    const now = new Date()
    const quoteId = `HOH-Q-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
    const quoteDate = now.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=HOH_Quote_${quoteId}.pdf`)

    // Pipe to response
    doc.pipe(res)

    // Colors
    const primaryColor = '#1e3a5f'
    const accentColor = '#c9a227'
    const grayColor = '#5a6a7a'
    const lightGray = '#f5f5f5'
    const tableHeaderBg = '#5a6a7a'

    // ==================== PAGE 1 ====================

    // Header line decoration
    doc.strokeColor(primaryColor).lineWidth(2)
       .moveTo(50, 30).lineTo(400, 30).stroke()
    doc.strokeColor(accentColor).lineWidth(2)
       .moveTo(400, 30).lineTo(545, 30).stroke()

    // Title Banner
    let yPos = 55
    doc.roundedRect(50, yPos, doc.page.width - 100, 45, 5).fill(primaryColor)
    doc.fillColor('white')
       .fontSize(22)
       .font('Helvetica-Bold')
       .text('Construction Quotation - HOH 108', 70, yPos + 13)

    yPos += 65

    // Quote Details Section
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
    doc.text(`Quote ID : ${quoteId}`, 50, yPos)
    doc.text(`Quote Date : ${quoteDate}`, 350, yPos)

    yPos += 18
    doc.font('Helvetica')
    doc.text(`Client Name : ${clientName || '-'}`, 50, yPos)
    yPos += 15
    doc.text(`Project Location : ${place || '-'}`, 50, yPos)
    yPos += 15
    doc.text(`Package : ${pkg?.name || packageCode || '-'}`, 50, yPos)
    yPos += 15
    doc.text(`Project Type : ${(projectType || 'Residential').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`, 50, yPos)
    yPos += 15
    doc.text(`Floors : ${floors === '1' ? 'G' : floors === '2' ? 'G + 1' : floors === '3' ? 'G + 2' : 'G + ' + (parseInt(floors) - 1)}`, 50, yPos)

    yPos += 30

    // Personalized Introduction
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica')
    doc.text(`Hi `, 50, yPos, { continued: true })
    doc.font('Helvetica-Bold').text(`${clientName || 'Valued Customer'}`, { continued: true })
    doc.font('Helvetica').text(`,`)

    yPos += 25
    doc.fontSize(10).fillColor(grayColor)
    doc.text(`Thank you for considering `, 50, yPos, { continued: true })
    doc.font('Helvetica-Bold').fillColor(primaryColor).text(`House of Hancet 108`, { continued: true })
    doc.font('Helvetica').fillColor(grayColor).text(` as your construction partner.`)

    yPos += 20
    const introText = `Based on our initial discussions and preliminary understanding of your requirements, please find below the indicative construction cost estimate for your proposed project. This estimate is shared for budgetary planning and feasibility purposes and will be further detailed and frozen upon finalization of drawings, specifications, and execution scope.`
    doc.text(introText, 50, yPos, { width: doc.page.width - 100, align: 'justify', lineGap: 3 })

    yPos += 70
    const companyDesc = `House of Hancet 108 is a full-service construction brand delivering end-to-end residential and commercial projects with assured cost control, quality standards, and on-time completion. We operate as a single cohesive ecosystem, integrating design, engineering, procurement, execution, and monitoring—so our clients experience a predictable, transparent, and stress-free construction journey.`
    doc.text(companyDesc, 50, yPos, { width: doc.page.width - 100, align: 'justify', lineGap: 3 })

    yPos += 80

    // What This Construction Cost Includes
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
    doc.text('What This Construction Cost Includes', 50, yPos)

    yPos += 20
    doc.fontSize(10).font('Helvetica').fillColor(grayColor)

    const includes = [
      'End-to-end construction execution as per defined scope',
      'Dedicated project manager & site supervision',
      '450+ Quality checks at every construction milestone',
      'Standardized materials and workmanship',
      'Daily / periodic progress updates with site photographs',
      'Centralized coordination of all vendors and trades'
    ]

    includes.forEach(item => {
      doc.fillColor('#2e7d32').text('✔', 50, yPos, { continued: true })
      doc.fillColor(grayColor).text(` ${item}`, 65, yPos)
      yPos += 16
    })

    yPos += 15

    // Exclusions
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
    doc.text('Exclusions', 50, yPos)

    yPos += 20
    doc.fontSize(10).font('Helvetica').fillColor(grayColor)

    const exclusions = [
      'Statutory approvals, government fees & authority charges',
      'Soil testing & land survey (unless specified)',
      'Furniture, appliances & loose fittings',
      'Electricity & water charges during construction',
      'Any item not explicitly mentioned in this quotation'
    ]

    exclusions.forEach(item => {
      doc.text(`●  ${item}`, 60, yPos)
      yPos += 16
    })

    // Footer line for page 1
    doc.strokeColor(primaryColor).lineWidth(1)
       .moveTo(50, doc.page.height - 50).lineTo(400, doc.page.height - 50).stroke()
    doc.strokeColor(accentColor).lineWidth(2)
       .moveTo(400, doc.page.height - 50).lineTo(545, doc.page.height - 50).stroke()

    // ==================== PAGE 2 - BOQ Table ====================
    doc.addPage()

    // Header line decoration
    doc.strokeColor(primaryColor).lineWidth(2)
       .moveTo(50, 30).lineTo(400, 30).stroke()
    doc.strokeColor(accentColor).lineWidth(2)
       .moveTo(400, 30).lineTo(545, 30).stroke()

    yPos = 70
    doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
    doc.text('Breakup of Total Cost', 50, yPos, { align: 'center', width: doc.page.width - 100 })

    yPos += 40

    // Table Header
    doc.rect(50, yPos, doc.page.width - 100, 28).fill(tableHeaderBg)
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
    doc.text('Sl No', 60, yPos + 8, { width: 40 })
    doc.text('BOQ Item', 110, yPos + 8, { width: 280 })
    doc.text('Unit', 400, yPos + 8, { width: 60, align: 'center' })
    doc.text('Cost', 460, yPos + 8, { width: 80, align: 'right' })

    yPos += 35

    // Table Rows
    doc.font('Helvetica').fontSize(10)
    items.forEach((item, index) => {
      // Check if we need a new page
      if (yPos > doc.page.height - 120) {
        doc.addPage()
        // Header line on new page
        doc.strokeColor(primaryColor).lineWidth(2)
           .moveTo(50, 30).lineTo(400, 30).stroke()
        doc.strokeColor(accentColor).lineWidth(2)
           .moveTo(400, 30).lineTo(545, 30).stroke()
        yPos = 70
      }

      // Row background
      if (index % 2 === 0) {
        doc.rect(50, yPos - 5, doc.page.width - 100, 25).fill(lightGray)
      }

      doc.fillColor(primaryColor)
      doc.text(String(index + 1), 60, yPos, { width: 40 })
      doc.text(item.itemName || '', 110, yPos, { width: 280 })
      doc.fillColor(grayColor)
      doc.text(item.unit || 'sqft', 400, yPos, { width: 60, align: 'center' })
      doc.fillColor(accentColor).font('Helvetica-Bold')
      doc.text(formatCurrency(item.cost), 460, yPos, { width: 80, align: 'right' })
      doc.font('Helvetica')

      yPos += 25
    })

    // Grand Total Row
    yPos += 10
    doc.rect(50, yPos, doc.page.width - 100, 30).fill(lightGray)
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
    doc.text('GRAND TOTAL', 110, yPos + 8, { width: 280 })
    doc.fillColor(accentColor).fontSize(12)
    doc.text(formatCurrency(grandTotal), 460, yPos + 8, { width: 80, align: 'right' })

    // Footer line for page 2
    doc.strokeColor(primaryColor).lineWidth(1)
       .moveTo(50, doc.page.height - 50).lineTo(400, doc.page.height - 50).stroke()
    doc.strokeColor(accentColor).lineWidth(2)
       .moveTo(400, doc.page.height - 50).lineTo(545, doc.page.height - 50).stroke()

    // ==================== PAGE 3 - Terms & Conditions ====================
    doc.addPage()

    // Header line decoration
    doc.strokeColor(primaryColor).lineWidth(2)
       .moveTo(50, 30).lineTo(400, 30).stroke()
    doc.strokeColor(accentColor).lineWidth(2)
       .moveTo(400, 30).lineTo(545, 30).stroke()

    yPos = 70

    // Our Assurance Section
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
    doc.text('OUR ASSURANCE TO CLIENTS', 50, yPos)

    yPos += 25
    doc.fontSize(10).font('Helvetica')

    const assurances = [
      { title: 'Cost Assurance', desc: 'Transparent pricing with controlled variations' },
      { title: 'Quality Assurance', desc: 'Standardized materials, workmanship checks & audits' },
      { title: 'Time Assurance', desc: 'Structured schedules with milestone-based tracking' },
      { title: 'Daily Project Tracking', desc: 'Regular updates, progress photos & reports' },
      { title: 'Single-Point Responsibility', desc: 'One team accountable from start to handover' }
    ]

    assurances.forEach(item => {
      doc.fillColor('#2e7d32').text('✔', 50, yPos, { continued: true })
      doc.fillColor(primaryColor).font('Helvetica-Bold').text(` ${item.title}`, { continued: true })
      doc.fillColor(grayColor).font('Helvetica').text(` – ${item.desc}`)
      yPos += 18
    })

    yPos += 20

    // Next Steps
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
    doc.text('Next Steps', 50, yPos)

    yPos += 20
    doc.fontSize(10).font('Helvetica').fillColor(grayColor)
    doc.text('Upon confirmation & Booking Agreement Payment, we will initiate:', 50, yPos)

    yPos += 18
    const nextSteps = [
      'Detailed drawings & specifications',
      'Final cost freeze',
      'Construction Main agreement',
      'Project schedule & tracking setup'
    ]

    nextSteps.forEach(item => {
      doc.text(`●  ${item}`, 60, yPos)
      yPos += 16
    })

    yPos += 20

    // Terms & Conditions
    doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
    doc.text('Terms & Conditions', 50, yPos)

    yPos += 20
    doc.fontSize(9).font('Helvetica').fillColor(grayColor)

    const terms = [
      'This quotation is an indicative estimate, not a final BOQ.',
      'Final cost shall be based on approved drawings, specifications, and quantities.',
      'Any scope change shall be treated as a variation order and charged separately.',
      'HOH provides structured cost, quality, and timeline control, subject to scope freeze and timely client inputs.',
      'Material brands and technical specifications will be finalized prior to execution.',
      'Prices are subject to market fluctuations in core construction materials.',
      'GST shall be applicable as per prevailing government regulations.',
      'Warranty on materials shall be as per manufacturer terms; workmanship warranty, if applicable, will be defined in the agreement.',
      'Confirmation of this quotation or advance payment shall be considered acceptance of the above terms.'
    ]

    terms.forEach((item, index) => {
      const termText = `${index + 1}. ${item}`
      doc.text(termText, 50, yPos, { width: doc.page.width - 100, lineGap: 2 })
      yPos += item.length > 80 ? 28 : 16
    })

    yPos += 25

    // Social Media & Website Footer
    doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
    doc.text('Our Social Media Handles', 50, yPos)
    doc.text('Visit Our Website At (www.hoh108.com)', 300, yPos)

    // Footer line
    doc.strokeColor(primaryColor).lineWidth(1)
       .moveTo(50, doc.page.height - 50).lineTo(400, doc.page.height - 50).stroke()
    doc.strokeColor(accentColor).lineWidth(2)
       .moveTo(400, doc.page.height - 50).lineTo(545, doc.page.height - 50).stroke()

    // Finalize PDF
    doc.end()

  } catch (error) {
    console.error('PDF Generation Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Generate PDF for saved quote
router.get('/:id/pdf', requireModulePermission('boq_generator', 'view'), async (req, res) => {
  try {
    const quote = await BOQQuote.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    }).populate('createdByUser', 'name')

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' })
    }

    // Get package details
    const pkg = await Package.findOne({
      company: req.activeCompany._id,
      code: quote.package
    })

    // Create PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${quote.quoteId}.pdf`)

    // Pipe to response
    doc.pipe(res)

    // Colors
    const primaryColor = '#0a1f3f'
    const accentColor = '#edbc5c'
    const grayColor = '#6b7280'

    // Header with company info
    doc.rect(0, 0, doc.page.width, 100).fill(primaryColor)

    doc.fillColor('white')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('HOH INTERIOR', 50, 30)

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Quote #: ${quote.quoteId}`, 50, 60)

    // Quote date on right
    doc.fontSize(10)
       .text(`Date: ${new Date(quote.createdAt).toLocaleDateString('en-IN')}`, doc.page.width - 150, 35, { width: 100, align: 'right' })

    // Reset position
    doc.fillColor(primaryColor)
    let yPos = 120

    // Client Details Section
    doc.rect(50, yPos, doc.page.width - 100, 25).fill(accentColor)
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('CLIENT DETAILS', 60, yPos + 7)

    yPos += 35

    doc.fontSize(10).font('Helvetica')

    const col1X = 60
    const col2X = 320

    doc.fillColor(grayColor).text('Client Name:', col1X, yPos)
    doc.fillColor(primaryColor).text(quote.clientName || '-', col1X + 80, yPos)

    doc.fillColor(grayColor).text('Phone:', col2X, yPos)
    doc.fillColor(primaryColor).text(quote.clientPhone || '-', col2X + 50, yPos)

    yPos += 18
    doc.fillColor(grayColor).text('Email:', col1X, yPos)
    doc.fillColor(primaryColor).text(quote.clientEmail || '-', col1X + 80, yPos)

    doc.fillColor(grayColor).text('Location:', col2X, yPos)
    doc.fillColor(primaryColor).text(quote.place || '-', col2X + 50, yPos)

    yPos += 30

    // Project Details
    doc.rect(50, yPos, doc.page.width - 100, 25).fill(accentColor)
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('PROJECT DETAILS', 60, yPos + 7)

    yPos += 35
    doc.fontSize(10).font('Helvetica')

    doc.fillColor(grayColor).text('Project Type:', col1X, yPos)
    doc.fillColor(primaryColor).text((quote.projectType || 'residential').replace('_', ' ').toUpperCase(), col1X + 80, yPos)

    doc.fillColor(grayColor).text('Floors:', col2X, yPos)
    doc.fillColor(primaryColor).text(quote.floors || '1', col2X + 50, yPos)

    yPos += 18
    doc.fillColor(grayColor).text('Built-up Area:', col1X, yPos)
    doc.fillColor(primaryColor).text(`${quote.builtUpArea} sqft`, col1X + 80, yPos)

    doc.fillColor(grayColor).text('Package:', col2X, yPos)
    doc.fillColor(primaryColor).text(pkg?.name || quote.package, col2X + 50, yPos)

    yPos += 35

    // BOQ Items Table
    doc.rect(50, yPos, doc.page.width - 100, 25).fill(accentColor)
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('BILL OF QUANTITIES', 60, yPos + 7)

    yPos += 35

    // Table Header
    doc.rect(50, yPos, doc.page.width - 100, 22).fill('#f3f4f6')
    doc.fillColor(primaryColor)
       .fontSize(9)
       .font('Helvetica-Bold')

    const tableColWidths = [30, 180, 50, 70, 60, 80]
    let xPos = 55

    doc.text('#', xPos, yPos + 6)
    xPos += tableColWidths[0]
    doc.text('DESCRIPTION', xPos, yPos + 6)
    xPos += tableColWidths[1]
    doc.text('UNIT', xPos, yPos + 6)
    xPos += tableColWidths[2]
    doc.text('RATE', xPos, yPos + 6, { width: tableColWidths[3], align: 'right' })
    xPos += tableColWidths[3]
    doc.text('QTY', xPos, yPos + 6, { width: tableColWidths[4], align: 'right' })
    xPos += tableColWidths[4]
    doc.text('AMOUNT', xPos, yPos + 6, { width: tableColWidths[5], align: 'right' })

    yPos += 25
    doc.font('Helvetica').fontSize(9)

    // Table rows
    quote.items.forEach((item, index) => {
      if (yPos > doc.page.height - 150) {
        doc.addPage()
        yPos = 50
      }

      if (index % 2 === 0) {
        doc.rect(50, yPos - 3, doc.page.width - 100, 20).fill('#fafafa')
      }

      xPos = 55
      doc.fillColor(primaryColor)

      doc.text(String(index + 1), xPos, yPos)
      xPos += tableColWidths[0]
      doc.text(item.itemName || '', xPos, yPos, { width: tableColWidths[1] - 10 })
      xPos += tableColWidths[1]
      doc.text(item.unit || 'sqft', xPos, yPos)
      xPos += tableColWidths[2]
      doc.text(formatCurrency(item.rate), xPos, yPos, { width: tableColWidths[3], align: 'right' })
      xPos += tableColWidths[3]
      doc.text(String(Math.round(item.quantity || 0)), xPos, yPos, { width: tableColWidths[4], align: 'right' })
      xPos += tableColWidths[4]
      doc.text(formatCurrency(item.cost), xPos, yPos, { width: tableColWidths[5], align: 'right' })

      yPos += 20
    })

    // Totals
    yPos += 10
    doc.strokeColor('#e5e7eb').lineWidth(1)
       .moveTo(50, yPos).lineTo(doc.page.width - 50, yPos).stroke()

    yPos += 15

    if (yPos > doc.page.height - 120) {
      doc.addPage()
      yPos = 50
    }

    const totalsX = doc.page.width - 200

    doc.fontSize(10)
    doc.fillColor(grayColor).text('Subtotal:', totalsX, yPos)
    doc.fillColor(primaryColor).text(formatCurrency(quote.subtotal), totalsX + 80, yPos, { width: 70, align: 'right' })

    yPos += 18
    doc.fillColor(grayColor).text('GST (18%):', totalsX, yPos)
    doc.fillColor(primaryColor).text(formatCurrency(quote.taxAmount), totalsX + 80, yPos, { width: 70, align: 'right' })

    yPos += 20
    doc.rect(totalsX - 10, yPos - 5, 170, 28).fill(primaryColor)
    doc.fillColor('white')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('GRAND TOTAL:', totalsX, yPos + 3)
    doc.fillColor(accentColor)
       .text(formatCurrency(quote.grandTotal), totalsX + 80, yPos + 3, { width: 70, align: 'right' })

    // Footer
    yPos = doc.page.height - 80

    doc.strokeColor('#e5e7eb').lineWidth(0.5)
       .moveTo(50, yPos).lineTo(doc.page.width - 50, yPos).stroke()

    yPos += 15
    doc.fillColor(grayColor)
       .fontSize(8)
       .font('Helvetica')
       .text('This is a computer generated quote. Prices are subject to change.', 50, yPos, { align: 'center', width: doc.page.width - 100 })

    yPos += 12
    doc.text(`Generated by: ${quote.creatorName || quote.createdByUser?.name || 'System'} | ${new Date().toLocaleString('en-IN')}`, 50, yPos, { align: 'center', width: doc.page.width - 100 })

    doc.end()

  } catch (error) {
    console.error('PDF Generation Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
