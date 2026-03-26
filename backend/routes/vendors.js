import express from 'express'
import Vendor from '../models/Vendor.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  requireModulePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'
import { uploadVendorDocs } from '../middleware/upload.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)
router.use(requireModulePermission('vendors', 'view'))

// Get all vendors
router.get('/', async (req, res) => {
  try {
    const {
      status,
      category,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const queryFilter = companyScopedQuery(req)

    if (status) queryFilter.status = status
    if (category) queryFilter.category = category
    if (search) {
      queryFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { vendorId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'contactPerson.name': { $regex: search, $options: 'i' } }
      ]
    }

    const total = await Vendor.countDocuments(queryFilter)
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 }

    const vendors = await Vendor.find(queryFilter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: vendors,
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

// Get single vendor
router.get('/:id', async (req, res) => {
  try {
    const query = { _id: req.params.id }
    // Only filter by company if viewing a specific company
    if (req.activeCompany?._id) {
      query.company = req.activeCompany._id
    }
    const vendor = await Vendor.findOne(query)

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    res.json({ success: true, data: vendor })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Create vendor
router.post('/', async (req, res) => {
  try {
    // Require specific company context for creating vendors
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to create a vendor'
      })
    }

    const vendor = await Vendor.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id,
      activities: [{
        action: 'created',
        description: 'Vendor created',
        performedBy: req.user._id,
        performedByName: req.user.name
      }]
    })

    res.status(201).json({ success: true, data: vendor })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Update vendor
router.put('/:id', async (req, res) => {
  try {
    // Require specific company context for updating vendors
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to update a vendor'
      })
    }

    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, company: req.activeCompany._id },
      {
        ...req.body,
        $push: {
          activities: {
            action: 'updated',
            description: 'Vendor updated',
            performedBy: req.user._id,
            performedByName: req.user.name
          }
        }
      },
      { new: true }
    )

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    res.json({ success: true, data: vendor })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Approve vendor
router.put('/:id/approve', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to approve a vendor'
      })
    }

    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, company: req.activeCompany._id, status: 'pending_verification' },
      {
        status: 'active',
        approvedBy: req.user._id,
        approvedAt: new Date(),
        $push: {
          activities: {
            action: 'approved',
            description: `Vendor approved by ${req.user.name}`,
            performedBy: req.user._id,
            performedByName: req.user.name
          }
        }
      },
      { new: true }
    )

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found or already approved' })
    }

    res.json({ success: true, data: vendor, message: 'Vendor approved successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reject vendor (set back to inactive)
router.put('/:id/reject', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to reject a vendor'
      })
    }

    const { reason } = req.body

    const vendor = await Vendor.findOneAndUpdate(
      { _id: req.params.id, company: req.activeCompany._id },
      {
        status: 'inactive',
        $push: {
          activities: {
            action: 'rejected',
            description: `Vendor rejected by ${req.user.name}${reason ? `: ${reason}` : ''}`,
            performedBy: req.user._id,
            performedByName: req.user.name
          }
        }
      },
      { new: true }
    )

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    res.json({ success: true, data: vendor, message: 'Vendor rejected' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Upload vendor documents
router.post('/:id/documents', uploadVendorDocs.array('documents', 10), async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to upload documents'
      })
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' })
    }

    const documentType = req.body.documentType || 'other'
    const newDocuments = req.files.map(file => ({
      name: req.body.documentName || file.originalname,
      docType: documentType,
      url: `/uploads/vendors/${file.filename}`,
      originalName: file.originalname,
      uploadedAt: new Date()
    }))

    // Ensure documents is an array before pushing
    if (!Array.isArray(vendor.documents)) {
      vendor.documents = []
    }
    vendor.documents.push(...newDocuments)
    vendor.activities.push({
      action: 'documents_uploaded',
      description: `${newDocuments.length} document(s) uploaded`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await vendor.save()

    res.json({
      success: true,
      data: vendor,
      message: `${newDocuments.length} document(s) uploaded successfully`
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete vendor document
router.delete('/:id/documents/:documentId', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to delete documents'
      })
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    const docIndex = vendor.documents.findIndex(
      doc => doc._id.toString() === req.params.documentId
    )

    if (docIndex === -1) {
      return res.status(404).json({ success: false, message: 'Document not found' })
    }

    vendor.documents.splice(docIndex, 1)
    vendor.activities.push({
      action: 'document_deleted',
      description: 'Document deleted',
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await vendor.save()

    res.json({ success: true, message: 'Document deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Enable/Disable portal access for vendor
router.put('/:id/portal-access', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to manage vendor portal access'
      })
    }

    const { enabled, password } = req.body
    const vendor = await Vendor.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    if (!vendor.email) {
      return res.status(400).json({
        success: false,
        message: 'Vendor must have an email address to enable portal access'
      })
    }

    // Initialize portalAccess if it doesn't exist
    if (!vendor.portalAccess) {
      vendor.portalAccess = {}
    }

    vendor.portalAccess.enabled = enabled

    // If enabling and password provided, set the password
    if (enabled && password) {
      vendor.portalAccess.password = password
      // Mark the nested field as modified so the pre-save hook runs to hash the password
      vendor.markModified('portalAccess.password')
    }

    vendor.activities.push({
      action: enabled ? 'portal_enabled' : 'portal_disabled',
      description: `Portal access ${enabled ? 'enabled' : 'disabled'} by ${req.user.name}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await vendor.save()

    res.json({
      success: true,
      message: `Portal access ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        portalAccess: { enabled: vendor.portalAccess.enabled }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Reset vendor portal password
router.put('/:id/reset-portal-password', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company'
      })
    }

    const { password } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    if (!vendor.portalAccess) {
      vendor.portalAccess = {}
    }

    vendor.portalAccess.password = password
    vendor.portalAccess.enabled = true  // Ensure portal access stays enabled
    vendor.portalAccess.loginAttempts = 0
    vendor.portalAccess.lockUntil = undefined
    // Mark the nested field as modified so the pre-save hook runs to hash the password
    vendor.markModified('portalAccess.password')

    vendor.activities.push({
      action: 'password_reset',
      description: `Portal password reset by ${req.user.name}`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await vendor.save()

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Delete vendor (super_admin only)
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super admin can delete vendors' })
    }
    // Require specific company context for deleting vendors
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to delete a vendor'
      })
    }

    const vendor = await Vendor.findOneAndDelete({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    res.json({ success: true, message: 'Vendor deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// =====================
// VENDOR MATERIALS ROUTES
// =====================

// Get vendor materials
router.get('/:id/materials', async (req, res) => {
  try {
    const query = { _id: req.params.id }
    if (req.activeCompany?._id) {
      query.company = req.activeCompany._id
    }

    const vendor = await Vendor.findOne(query).select('materials name vendorId')

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    res.json({ success: true, data: vendor.materials || [], vendor: { name: vendor.name, vendorId: vendor.vendorId } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Add material to vendor
router.post('/:id/materials', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to add materials'
      })
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    const materialData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
      priceHistory: [{
        price: req.body.currentPrice,
        priceMax: req.body.currentPriceMax,
        changedAt: new Date(),
        changedBy: req.user.name,
        remarks: 'Initial price'
      }]
    }

    if (!Array.isArray(vendor.materials)) {
      vendor.materials = []
    }

    vendor.materials.push(materialData)
    vendor.activities.push({
      action: 'material_added',
      description: `Material "${req.body.materialName}" added`,
      performedBy: req.user._id,
      performedByName: req.user.name
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

// Update vendor material
router.put('/:id/materials/:materialId', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to update materials'
      })
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

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
        changedBy: req.user.name,
        remarks: req.body.priceChangeRemarks || 'Price updated'
      })
    }

    vendor.activities.push({
      action: 'material_updated',
      description: `Material "${req.body.materialName}" updated${priceChanged ? ' (price changed)' : ''}`,
      performedBy: req.user._id,
      performedByName: req.user.name
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

// Delete vendor material
router.delete('/:id/materials/:materialId', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company to delete materials'
      })
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

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
      action: 'material_deleted',
      description: `Material "${materialName}" deleted`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await vendor.save()

    res.json({ success: true, message: 'Material deleted successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Get all materials across all vendors (for comparison/pricelist view)
router.get('/all-materials', async (req, res) => {
  try {
    const queryFilter = companyScopedQuery(req)
    queryFilter.status = 'active'
    queryFilter['materials.0'] = { $exists: true } // Only vendors with materials

    const { materialType, category, search, page = 1, limit = 50 } = req.query

    const vendors = await Vendor.find(queryFilter)
      .select('name vendorId category materials phone email')

    // Flatten materials with vendor info
    let allMaterials = []
    vendors.forEach(vendor => {
      (vendor.materials || []).forEach(material => {
        if (material.status === 'active') {
          allMaterials.push({
            ...material.toObject(),
            vendorId: vendor._id,
            vendorName: vendor.name,
            vendorCode: vendor.vendorId,
            vendorCategory: vendor.category,
            vendorPhone: vendor.phone,
            vendorEmail: vendor.email
          })
        }
      })
    })

    // Apply filters
    if (materialType) {
      allMaterials = allMaterials.filter(m => m.materialType === materialType)
    }
    if (category) {
      allMaterials = allMaterials.filter(m => m.category?.toLowerCase().includes(category.toLowerCase()))
    }
    if (search) {
      const searchLower = search.toLowerCase()
      allMaterials = allMaterials.filter(m =>
        m.materialName?.toLowerCase().includes(searchLower) ||
        m.brand?.toLowerCase().includes(searchLower) ||
        m.category?.toLowerCase().includes(searchLower) ||
        m.vendorName?.toLowerCase().includes(searchLower)
      )
    }

    // Pagination
    const total = allMaterials.length
    const startIndex = (page - 1) * limit
    const paginatedMaterials = allMaterials.slice(startIndex, startIndex + parseInt(limit))

    res.json({
      success: true,
      data: paginatedMaterials,
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

// Approve vendor-submitted material
router.put('/:id/materials/:materialId/approve', async (req, res) => {
  try {
    if (!req.activeCompany?._id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a specific company'
      })
    }

    const vendor = await Vendor.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' })
    }

    const materialIndex = vendor.materials.findIndex(
      m => m._id.toString() === req.params.materialId
    )

    if (materialIndex === -1) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    vendor.materials[materialIndex].status = 'active'
    vendor.materials[materialIndex].approvedBy = req.user._id
    vendor.materials[materialIndex].approvedAt = new Date()
    vendor.materials[materialIndex].updatedAt = new Date()

    vendor.activities.push({
      action: 'material_approved',
      description: `Material "${vendor.materials[materialIndex].materialName}" approved`,
      performedBy: req.user._id,
      performedByName: req.user.name
    })

    await vendor.save()

    res.json({
      success: true,
      message: 'Material approved successfully',
      data: vendor.materials[materialIndex]
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
