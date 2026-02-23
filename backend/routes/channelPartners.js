import express from 'express'
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

// Get all channel partners
router.get('/', async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (search) {
      queryFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { partnerId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await ChannelPartner.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const partners = await ChannelPartner.find(queryFilter)
      .populate('spoc', 'name email phone')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: partners,
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

// Get single channel partner
router.get('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id }
    if (req.activeCompany?._id) {
      query.company = req.activeCompany._id
    }

    const partner = await ChannelPartner.findOne(query)
      .populate('spoc', 'name email phone')
      .populate('company', 'name')

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Channel partner not found' })
    }

    res.json({ success: true, data: partner })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create channel partner
router.post('/', requirePermission(PERMISSIONS.LEADS_EDIT), async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to create a channel partner'
      })
    }

    const partner = await ChannelPartner.create({
      ...req.body,
      company: req.activeCompany._id,
      activities: [{
        action: 'created',
        description: 'Channel partner created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    res.status(201).json({ success: true, data: partner })
  } catch (error) {
    // Handle duplicate email within company
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A channel partner with this email already exists for this company'
      })
    }
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update channel partner
router.put('/:id', requirePermission(PERMISSIONS.LEADS_EDIT), async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to update a channel partner'
      })
    }

    const partner = await ChannelPartner.findOneAndUpdate(
      { _id: req.params.id, company: req.activeCompany._id },
      {
        ...req.body,
        $push: {
          activities: {
            action: 'updated',
            description: 'Channel partner updated',
            performedBy: req.user._id,
            performedByName: req.user.name
          }
        }
      },
      { new: true }
    )

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Channel partner not found' })
    }

    res.json({ success: true, data: partner })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Soft delete channel partner (set status to inactive)
router.delete('/:id', requirePermission(PERMISSIONS.LEADS_EDIT), async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to delete a channel partner'
      })
    }

    const partner = await ChannelPartner.findOneAndUpdate(
      { _id: req.params.id, company: req.activeCompany._id },
      {
        status: 'inactive',
        $push: {
          activities: {
            action: 'deactivated',
            description: `Channel partner deactivated by ${req.user.name}`,
            performedBy: req.user._id,
            performedByName: req.user.name
          }
        }
      },
      { new: true }
    )

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Channel partner not found' })
    }

    res.json({ success: true, data: partner, message: 'Channel partner deactivated' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Enable portal access + set initial password
router.post('/:id/enable-portal', requirePermission(PERMISSIONS.LEADS_EDIT), async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to manage portal access'
      })
    }

    const { password } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    const partner = await ChannelPartner.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Channel partner not found' })
    }

    if (!partner.email) {
      return res.status(400).json({
        success: false,
        message: 'Channel partner must have an email address to enable portal access'
      })
    }

    // Initialize portalAccess if it doesn't exist
    if (!partner.portalAccess) {
      partner.portalAccess = {}
    }

    partner.portalAccess.enabled = true
    partner.portalAccess.password = password
    partner.portalAccess.loginAttempts = 0
    partner.portalAccess.lockUntil = undefined
    partner.markModified('portalAccess.password')

    partner.activities.push({
      action: 'portal_enabled',
      description: `Portal access enabled by ${req.user.name}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await partner.save()

    res.json({
      success: true,
      message: 'Portal access enabled successfully',
      data: {
        _id: partner._id,
        name: partner.name,
        email: partner.email,
        portalAccess: { enabled: partner.portalAccess.enabled }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update incentive config
router.put('/:id/incentive', requirePermission(PERMISSIONS.LEADS_EDIT), async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to update incentive config'
      })
    }

    const { percentage, flatFee, model, tier } = req.body

    const partner = await ChannelPartner.findOneAndUpdate(
      { _id: req.params.id, company: req.activeCompany._id },
      {
        $set: {
          'incentive.percentage': percentage,
          'incentive.flatFee': flatFee,
          'incentive.model': model,
          'incentive.tier': tier
        },
        $push: {
          activities: {
            action: 'incentive_updated',
            description: `Incentive config updated by ${req.user.name} (model: ${model})`,
            performedBy: req.user._id,
            performedByName: req.user.name
          }
        }
      },
      { new: true }
    )

    if (!partner) {
      return res.status(404).json({ success: false, message: 'Channel partner not found' })
    }

    res.json({ success: true, data: partner })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get leads submitted by a specific channel partner
router.get('/:id/leads', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query

    const partnerQuery = { _id: req.params.id }
    if (req.activeCompany?._id) {
      partnerQuery.company = req.activeCompany._id
    }

    const partner = await ChannelPartner.findOne(partnerQuery)
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Channel partner not found' })
    }

    const query = {
      channelPartner: partner._id,
      company: partner.company
    }
    if (status) query.status = status

    const total = await Lead.countDocuments(query)
    const leads = await Lead.find(query)
      .select('name phone email status source createdAt leadId location priority assignedTo')
      .populate('assignedTo', 'name')
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

export default router
