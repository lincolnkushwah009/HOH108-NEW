import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import XLSX from 'xlsx'
import ChannelPartner from '../models/ChannelPartner.js'
import Lead from '../models/Lead.js'
import CPDataBatch from '../models/CPDataBatch.js'

const router = express.Router()

// =====================
// FILE UPLOAD CONFIG
// =====================

const uploadDir = 'uploads/channel-partner-leads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const bulkLeadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'cp-leads-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const bulkLeadFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel', // xls
    'text/csv'
  ]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only XLSX, XLS, and CSV files are allowed.'), false)
  }
}

const uploadBulkLeads = multer({
  storage: bulkLeadStorage,
  fileFilter: bulkLeadFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1
  }
})

// =====================
// TOKEN GENERATION
// =====================

const generatePartnerToken = (partnerId) => {
  return jwt.sign({ partnerId, type: 'channel_partner' }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  })
}

// =====================
// AUTH MIDDLEWARE
// =====================

export const protectChannelPartner = async (req, res, next) => {
  try {
    let token
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.type !== 'channel_partner') {
      return res.status(401).json({ success: false, message: 'Invalid token type' })
    }

    const partner = await ChannelPartner.findById(decoded.partnerId)

    if (!partner) {
      return res.status(401).json({ success: false, message: 'Channel partner not found' })
    }

    if (!partner.portalAccess?.enabled) {
      return res.status(401).json({ success: false, message: 'Portal access disabled' })
    }

    if (partner.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Channel partner account is not active' })
    }

    req.partner = partner
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized' })
  }
}

// =====================
// PUBLIC ROUTES
// =====================

// Channel Partner Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }

    // Find partner by email with password field
    const partner = await ChannelPartner.findOne({ email: email.toLowerCase() })
      .select('+portalAccess.password')

    if (!partner) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Check if portal access is enabled
    if (!partner.portalAccess?.enabled) {
      return res.status(401).json({
        success: false,
        message: 'Portal access not enabled. Please contact admin.'
      })
    }

    // Check if partner is active
    if (partner.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account is not active. Please contact admin.'
      })
    }

    // Check if account is locked
    if (partner.isLocked()) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
      })
    }

    // Verify password
    const isMatch = await partner.matchPassword(password)

    if (!isMatch) {
      await partner.incLoginAttempts()
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Reset login attempts on successful login
    partner.portalAccess.loginAttempts = 0
    partner.portalAccess.lockUntil = undefined
    partner.portalAccess.lastLogin = new Date()
    await partner.save()

    const token = generatePartnerToken(partner._id)

    res.json({
      success: true,
      token,
      partner: {
        _id: partner._id,
        partnerId: partner.partnerId,
        name: partner.name,
        email: partner.email,
        phone: partner.phone,
        company: partner.company,
        status: partner.status,
        businessName: partner.businessName
      }
    })
  } catch (error) {
    console.error('Channel partner login error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    const partner = await ChannelPartner.findOne({ email: email.toLowerCase() })

    if (!partner) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If the email exists, a reset link will be sent' })
    }

    if (!partner.portalAccess?.enabled) {
      return res.json({ success: true, message: 'If the email exists, a reset link will be sent' })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    partner.portalAccess.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')
    partner.portalAccess.passwordResetExpires = Date.now() + 3600000 // 1 hour

    await partner.save()

    // TODO: Send email with reset link
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

    const partner = await ChannelPartner.findOne({
      'portalAccess.passwordResetToken': hashedToken,
      'portalAccess.passwordResetExpires': { $gt: Date.now() }
    })

    if (!partner) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' })
    }

    const { password } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    partner.portalAccess.password = password
    partner.portalAccess.passwordResetToken = undefined
    partner.portalAccess.passwordResetExpires = undefined
    partner.portalAccess.loginAttempts = 0
    partner.portalAccess.lockUntil = undefined

    await partner.save()

    res.json({ success: true, message: 'Password reset successful' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =====================
// PROTECTED ROUTES
// =====================

// Get channel partner profile
router.get('/profile', protectChannelPartner, async (req, res) => {
  try {
    const partner = await ChannelPartner.findById(req.partner._id)
      .populate('company', 'name')
      .populate('spoc', 'name email phone')

    res.json({ success: true, data: partner })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update channel partner profile
router.put('/profile', protectChannelPartner, async (req, res) => {
  try {
    const allowedUpdates = ['phone', 'contactPerson', 'address']
    const updates = {}

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    const partner = await ChannelPartner.findByIdAndUpdate(
      req.partner._id,
      {
        $set: updates,
        $push: {
          activities: {
            action: 'profile_updated',
            description: 'Profile updated via channel partner portal',
            performedByName: req.partner.name
          }
        }
      },
      { new: true }
    )

    res.json({ success: true, data: partner })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Change password
router.put('/change-password', protectChannelPartner, async (req, res) => {
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

    const partner = await ChannelPartner.findById(req.partner._id).select('+portalAccess.password')

    const isMatch = await partner.matchPassword(currentPassword)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    }

    partner.portalAccess.password = newPassword
    await partner.save()

    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get dashboard summary
router.get('/dashboard', protectChannelPartner, async (req, res) => {
  try {
    const partnerId = req.partner._id

    // Get recent leads submitted by this partner
    const recentLeads = await Lead.find({
      channelPartner: partnerId,
      company: req.partner.company
    })
      .select('name phone email status source createdAt leadId')
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({
      success: true,
      data: {
        metrics: req.partner.metrics || {
          totalLeadsSubmitted: 0,
          leadsAccepted: 0,
          leadsDuplicate: 0,
          leadsConverted: 0,
          totalIncentivePaid: 0
        },
        recentLeads,
        partner: {
          name: req.partner.name,
          partnerId: req.partner.partnerId,
          status: req.partner.status,
          businessName: req.partner.businessName
        }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get leads submitted by this partner
router.get('/leads', protectChannelPartner, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query

    const query = {
      channelPartner: req.partner._id,
      company: req.partner.company
    }
    if (status) query.status = status

    const total = await Lead.countDocuments(query)
    const leads = await Lead.find(query)
      .select('name phone email status source createdAt leadId location priority')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: leads,
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

// Submit a single lead
router.post('/leads', protectChannelPartner, async (req, res) => {
  try {
    const { name, phone, email, ...rest } = req.body

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required'
      })
    }

    // Check duplicate by phone + company (FIFO rule)
    const existing = await Lead.findOne({
      phone: phone,
      company: req.partner.company
    })

    // Get next version for batch tracking
    const nextVersion = await CPDataBatch.getNextVersion(req.partner.company, req.partner._id)
    const partner = await ChannelPartner.findById(req.partner._id).populate('spoc', 'name')

    if (existing) {
      // Increment partner's leadsDuplicate counter
      await ChannelPartner.findByIdAndUpdate(req.partner._id, {
        $inc: { 'metrics.leadsDuplicate': 1 }
      })

      // Create batch record for the duplicate submission
      await CPDataBatch.create({
        company: req.partner.company,
        channelPartner: req.partner._id,
        channelPartnerName: req.partner.name,
        spoc: partner?.spoc?._id || null,
        spocName: partner?.spoc?.name || '',
        version: nextVersion,
        uploadType: 'single',
        sourceDate: req.body.sourceDate || new Date(),
        stats: { totalRows: 1, leadsCreated: 0, duplicatesFound: 1, errorsFound: 0 },
        duplicates: [{ phone, name, reason: 'Lead with this phone already exists', existingLeadId: existing._id }],
        validationStatus: 'completed',
        paymentStatus: 'not_applicable'
      })

      return res.status(409).json({
        success: false,
        message: 'Duplicate: Lead with this phone already exists',
        duplicatePhone: phone
      })
    }

    // Create lead with source: 'channel_partner', channelPartner reference
    const lead = await Lead.create({
      name,
      phone,
      email,
      ...rest,
      company: req.partner.company,
      source: 'partner',
      sourceDetails: `Channel Partner: ${req.partner.name} (${req.partner.partnerId})`,
      channelPartner: req.partner._id,
      activities: [{
        action: 'created',
        description: `Lead submitted via Channel Partner Portal by ${req.partner.name}`,
        performedByName: req.partner.name
      }]
    })

    // Create batch record
    const batch = await CPDataBatch.create({
      company: req.partner.company,
      channelPartner: req.partner._id,
      channelPartnerName: req.partner.name,
      spoc: partner?.spoc?._id || null,
      spocName: partner?.spoc?.name || '',
      version: nextVersion,
      uploadType: 'single',
      sourceDate: req.body.sourceDate || new Date(),
      stats: { totalRows: 1, leadsCreated: 1, duplicatesFound: 0, errorsFound: 0 },
      leads: [lead._id],
      validationStatus: 'completed',
      paymentStatus: 'pending_approval'
    })

    // Link batch to lead
    await Lead.findByIdAndUpdate(lead._id, { cpDataBatch: batch._id })

    // Increment metrics.totalLeadsSubmitted
    await ChannelPartner.findByIdAndUpdate(req.partner._id, {
      $inc: { 'metrics.totalLeadsSubmitted': 1 }
    })

    res.status(201).json({
      success: true,
      message: 'Lead submitted successfully',
      data: lead
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Bulk upload leads via Excel/CSV
router.post('/leads/bulk', protectChannelPartner, uploadBulkLeads.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an XLSX or CSV file' })
    }

    // Parse the uploaded file
    const workbook = XLSX.readFile(req.file.path)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet)

    if (!rows || rows.length === 0) {
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ success: false, message: 'No data found in the file' })
    }

    // Create batch record before processing
    const bulkPartner = await ChannelPartner.findById(req.partner._id).populate('spoc', 'name')
    const bulkVersion = await CPDataBatch.getNextVersion(req.partner.company, req.partner._id)

    const batch = await CPDataBatch.create({
      company: req.partner.company,
      channelPartner: req.partner._id,
      channelPartnerName: req.partner.name,
      spoc: bulkPartner?.spoc?._id || null,
      spocName: bulkPartner?.spoc?.name || '',
      version: bulkVersion,
      uploadType: 'bulk',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      sourceDate: req.body.sourceDate || new Date(),
      stats: { totalRows: rows.length, leadsCreated: 0, duplicatesFound: 0, errorsFound: 0 },
      validationStatus: 'processing'
    })

    const created = []
    const batchDuplicates = []
    const batchErrors = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowIndex = i + 2 // Account for header row (1-indexed)

      try {
        const name = row.name || row.Name || row.NAME
        const phone = String(row.phone || row.Phone || row.PHONE || row.mobile || row.Mobile || '').trim()
        const email = row.email || row.Email || row.EMAIL || ''

        if (!name || !phone) {
          batchErrors.push({ row: rowIndex, field: 'name/phone', error: 'Name and phone are required' })
          continue
        }

        // Check duplicate by phone + company
        const existing = await Lead.findOne({
          phone: phone,
          company: req.partner.company
        })

        if (existing) {
          batchDuplicates.push({ phone, name, reason: 'Lead with this phone already exists', existingLeadId: existing._id })
          await ChannelPartner.findByIdAndUpdate(req.partner._id, {
            $inc: { 'metrics.leadsDuplicate': 1 }
          })
          continue
        }

        // Create the lead
        const leadData = {
          name,
          phone,
          email: email || undefined,
          company: req.partner.company,
          source: 'partner',
          sourceDetails: `Channel Partner: ${req.partner.name} (${req.partner.partnerId}) - Bulk Upload`,
          channelPartner: req.partner._id,
          cpDataBatch: batch._id,
          activities: [{
            action: 'created',
            description: `Lead submitted via Channel Partner Portal bulk upload by ${req.partner.name}`,
            performedByName: req.partner.name
          }]
        }

        // Map optional fields from the spreadsheet
        if (row.city || row.City) {
          leadData.location = { city: row.city || row.City }
        }
        if (row.alternatePhone || row.AlternatePhone) {
          leadData.alternatePhone = String(row.alternatePhone || row.AlternatePhone)
        }

        const lead = await Lead.create(leadData)
        created.push(lead._id)

        // Increment totalLeadsSubmitted
        await ChannelPartner.findByIdAndUpdate(req.partner._id, {
          $inc: { 'metrics.totalLeadsSubmitted': 1 }
        })
      } catch (rowError) {
        batchErrors.push({ row: rowIndex, field: '', error: rowError.message })
      }
    }

    // Update batch with results
    batch.leads = created
    batch.duplicates = batchDuplicates
    batch.rowErrors = batchErrors
    batch.stats = {
      totalRows: rows.length,
      leadsCreated: created.length,
      duplicatesFound: batchDuplicates.length,
      errorsFound: batchErrors.length
    }
    batch.validationStatus = 'completed'
    batch.paymentStatus = created.length > 0 ? 'pending_approval' : 'not_applicable'
    await batch.save()

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path)

    res.json({
      success: true,
      data: {
        batchId: batch.batchId,
        version: batch.version,
        created: created.length,
        duplicates: batchDuplicates,
        errors: batchErrors
      }
    })
  } catch (error) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get incentive config and records
router.get('/incentives', protectChannelPartner, async (req, res) => {
  try {
    const partner = await ChannelPartner.findById(req.partner._id)
      .select('incentive metrics.totalIncentivePaid metrics.leadsConverted')

    res.json({
      success: true,
      data: {
        incentiveConfig: partner.incentive || {},
        totalIncentivePaid: partner.metrics?.totalIncentivePaid || 0,
        leadsConverted: partner.metrics?.leadsConverted || 0
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
