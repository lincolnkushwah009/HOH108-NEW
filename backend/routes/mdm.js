import express from 'express'
import mongoose from 'mongoose'
import MasterEntity from '../models/MasterEntity.js'
import MasterRecord from '../models/MasterRecord.js'
import IDMapping from '../models/IDMapping.js'
import MasterDataAudit from '../models/MasterDataAudit.js'
import { protect, setCompanyContext } from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// ============================================================
// ENTITY REGISTRY ENDPOINTS
// ============================================================

// GET /api/mdm/entities — List all registered master entities
router.get('/entities', async (req, res) => {
  try {
    const { category, module, active } = req.query
    const filter = {}
    if (category) filter.category = category
    if (module) filter.primaryModule = module
    if (active !== undefined) filter.isActive = active === 'true'

    const entities = await MasterEntity.find(filter).sort({ category: 1, entityName: 1 }).lean()
    res.json({ success: true, data: entities })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/mdm/entities/:code — Get single entity definition
router.get('/entities/:code', async (req, res) => {
  try {
    const entity = await MasterEntity.findOne({ entityCode: req.params.code.toUpperCase() }).lean()
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found' })
    res.json({ success: true, data: entity })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/mdm/entities — Register a new master entity
router.post('/entities', async (req, res) => {
  try {
    const entity = await MasterEntity.create({
      ...req.body,
      createdBy: req.user._id
    })
    res.status(201).json({ success: true, data: entity })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})

// PUT /api/mdm/entities/:code — Update entity definition
router.put('/entities/:code', async (req, res) => {
  try {
    const entity = await MasterEntity.findOneAndUpdate(
      { entityCode: req.params.code.toUpperCase() },
      { ...req.body, lastModifiedBy: req.user._id },
      { new: true, runValidators: true }
    )
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not found' })
    res.json({ success: true, data: entity })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})

// Default entity definitions - shared between seed and auto-seed in sync-all
const DEFAULT_ENTITIES = [
      // Party Masters
      {
        entityCode: 'CUSTOMER', entityName: 'Customer Master', category: 'party_master',
        primaryModule: 'o2c', secondaryModules: ['crm', 'finance', 'project'],
        mongoModel: 'Customer', idField: 'customerId', idPrefix: 'C', idPattern: '{CODE}-C-{YEAR}-{SEQ}',
        isCritical: true, description: 'Customer profiles, contacts, value metrics, and segmentation',
        fields: [
          { fieldName: 'name', displayLabel: 'Customer Name', fieldType: 'string', isRequired: true, isSearchable: true, isMasterField: true },
          { fieldName: 'email', displayLabel: 'Email', fieldType: 'email', isSearchable: true, isMasterField: true },
          { fieldName: 'phone', displayLabel: 'Phone', fieldType: 'phone', isSearchable: true, isMasterField: true },
          { fieldName: 'type', displayLabel: 'Type', fieldType: 'string', isMasterField: true },
          { fieldName: 'segment', displayLabel: 'Segment', fieldType: 'string', isMasterField: true },
          { fieldName: 'gstNumber', displayLabel: 'GST Number', fieldType: 'string', isUnique: true },
        ],
        crossReferences: [
          { relatedEntity: 'PROJECT', relationshipType: 'one_to_many', foreignKeyField: 'customer', description: 'Customer has projects' },
          { relatedEntity: 'SALES_ORDER', relationshipType: 'one_to_many', foreignKeyField: 'customer', description: 'Customer has sales orders' },
          { relatedEntity: 'LEAD', relationshipType: 'one_to_one', foreignKeyField: 'convertedFrom', description: 'Converted from lead' },
          { relatedEntity: 'CUSTOMER_INVOICE', relationshipType: 'one_to_many', foreignKeyField: 'customer', description: 'Customer invoices' },
        ],
        dataOwner: 'sales_manager', dataSteward: 'sales_executive'
      },
      {
        entityCode: 'VENDOR', entityName: 'Vendor Master', category: 'party_master',
        primaryModule: 'p2p', secondaryModules: ['inventory', 'ppc', 'finance'],
        mongoModel: 'Vendor', idField: 'vendorId', idPrefix: 'VEN', idPattern: 'VEN-{SEQ}',
        isCritical: true, description: 'Vendor profiles, pricelists, payment terms, and bank details',
        fields: [
          { fieldName: 'name', displayLabel: 'Vendor Name', fieldType: 'string', isRequired: true, isSearchable: true, isMasterField: true },
          { fieldName: 'email', displayLabel: 'Email', fieldType: 'email', isSearchable: true, isMasterField: true },
          { fieldName: 'phone', displayLabel: 'Phone', fieldType: 'phone', isSearchable: true, isMasterField: true },
          { fieldName: 'gstNumber', displayLabel: 'GST Number', fieldType: 'string', isUnique: true },
          { fieldName: 'category', displayLabel: 'Category', fieldType: 'string', isMasterField: true },
        ],
        crossReferences: [
          { relatedEntity: 'PURCHASE_ORDER', relationshipType: 'one_to_many', foreignKeyField: 'vendor', description: 'Vendor has purchase orders' },
          { relatedEntity: 'MATERIAL', relationshipType: 'many_to_many', foreignKeyField: 'preferredVendors', description: 'Vendor supplies materials' },
          { relatedEntity: 'GOODS_RECEIPT', relationshipType: 'one_to_many', foreignKeyField: 'vendor', description: 'Vendor goods receipts' },
        ],
        dataOwner: 'admin', dataSteward: 'operations'
      },
      {
        entityCode: 'LEAD', entityName: 'Lead Master', category: 'party_master',
        primaryModule: 'crm', secondaryModules: ['o2c'],
        mongoModel: 'Lead', idField: 'leadId', idPrefix: 'L', idPattern: '{CODE}-L-{YEAR}-{SEQ}',
        description: 'Sales leads, contact details, pipeline stage, and conversion tracking',
        fields: [
          { fieldName: 'name', displayLabel: 'Lead Name', fieldType: 'string', isRequired: true, isSearchable: true, isMasterField: true },
          { fieldName: 'email', displayLabel: 'Email', fieldType: 'email', isSearchable: true, isMasterField: true },
          { fieldName: 'phone', displayLabel: 'Phone', fieldType: 'phone', isRequired: true, isSearchable: true, isMasterField: true },
          { fieldName: 'status', displayLabel: 'Status', fieldType: 'string', isMasterField: true },
          { fieldName: 'source', displayLabel: 'Source', fieldType: 'string', isMasterField: true },
        ],
        crossReferences: [
          { relatedEntity: 'CUSTOMER', relationshipType: 'one_to_one', foreignKeyField: 'convertedTo', description: 'Lead converts to customer' },
          { relatedEntity: 'CALL_ACTIVITY', relationshipType: 'one_to_many', foreignKeyField: 'lead', description: 'Lead has call activities' },
        ],
        dataOwner: 'sales_manager', dataSteward: 'pre_sales'
      },

      // Item Masters
      {
        entityCode: 'MATERIAL', entityName: 'Material Master', category: 'item_master',
        primaryModule: 'inventory', secondaryModules: ['p2p', 'ppc', 'project'],
        mongoModel: 'Material', idField: 'skuCode', idPrefix: 'SKU', idPattern: '{CAT}-{SEQ}',
        isCritical: true, description: 'Material catalog, specifications, pricing, stock levels',
        fields: [
          { fieldName: 'name', displayLabel: 'Material Name', fieldType: 'string', isRequired: true, isSearchable: true, isMasterField: true },
          { fieldName: 'skuCode', displayLabel: 'SKU Code', fieldType: 'string', isUnique: true, isSearchable: true, isMasterField: true },
          { fieldName: 'category', displayLabel: 'Category', fieldType: 'string', isMasterField: true },
          { fieldName: 'unit', displayLabel: 'UOM', fieldType: 'string', isMasterField: true },
          { fieldName: 'price', displayLabel: 'Price', fieldType: 'currency', isMasterField: true },
          { fieldName: 'hsnCode', displayLabel: 'HSN Code', fieldType: 'string', isMasterField: true },
        ],
        crossReferences: [
          { relatedEntity: 'VENDOR', relationshipType: 'many_to_many', foreignKeyField: 'preferredVendors', description: 'Material has preferred vendors' },
          { relatedEntity: 'STOCK', relationshipType: 'one_to_one', foreignKeyField: 'material', description: 'Material has stock record' },
          { relatedEntity: 'BOM', relationshipType: 'one_to_many', foreignKeyField: 'items.material', description: 'Material used in BOMs' },
        ],
        dataOwner: 'admin', dataSteward: 'operations'
      },
      {
        entityCode: 'BOQ_ITEM', entityName: 'BOQ Item Master', category: 'item_master',
        primaryModule: 'o2c', secondaryModules: ['project'],
        mongoModel: 'BOQItem', idField: '_id', idPrefix: 'BOQ',
        description: 'Bill of Quantities item catalog for quotations and estimates',
        dataOwner: 'sales_manager', dataSteward: 'designer'
      },

      // Employee Master
      {
        entityCode: 'EMPLOYEE', entityName: 'Employee Master', category: 'employee_master',
        primaryModule: 'h2r', secondaryModules: ['project', 'ppc', 'finance', 'core'],
        mongoModel: 'User', idField: 'employeeId', idPrefix: 'U', idPattern: '{CODE}-U-{YEAR}-{SEQ}',
        isCritical: true, description: 'Employee profiles, roles, departments, salary, and performance',
        fields: [
          { fieldName: 'name', displayLabel: 'Employee Name', fieldType: 'string', isRequired: true, isSearchable: true, isMasterField: true },
          { fieldName: 'email', displayLabel: 'Email', fieldType: 'email', isRequired: true, isUnique: true, isSearchable: true, isMasterField: true },
          { fieldName: 'phone', displayLabel: 'Phone', fieldType: 'phone', isSearchable: true, isMasterField: true },
          { fieldName: 'role', displayLabel: 'Role', fieldType: 'string', isMasterField: true },
          { fieldName: 'department', displayLabel: 'Department', fieldType: 'reference', referenceEntity: 'DEPARTMENT', isMasterField: true },
          { fieldName: 'employeeId', displayLabel: 'Employee ID', fieldType: 'string', isUnique: true, isSearchable: true, isMasterField: true },
        ],
        crossReferences: [
          { relatedEntity: 'DEPARTMENT', relationshipType: 'many_to_one', foreignKeyField: 'department', description: 'Employee belongs to department' },
          { relatedEntity: 'PROJECT', relationshipType: 'one_to_many', foreignKeyField: 'team', description: 'Employee assigned to projects' },
          { relatedEntity: 'ATTENDANCE', relationshipType: 'one_to_many', foreignKeyField: 'user', description: 'Employee attendance records' },
        ],
        dataOwner: 'admin', dataSteward: 'hr'
      },

      // Location Masters
      {
        entityCode: 'COMPANY', entityName: 'Company Master', category: 'location_master',
        primaryModule: 'core', secondaryModules: ['o2c', 'p2p', 'h2r', 'finance'],
        mongoModel: 'Company', idField: 'code', idPrefix: '',
        isCritical: true, description: 'Company profiles, settings, sequences, and configuration',
        dataOwner: 'super_admin'
      },
      {
        entityCode: 'DEPARTMENT', entityName: 'Department Master', category: 'location_master',
        primaryModule: 'h2r', secondaryModules: ['core'],
        mongoModel: 'Department', idField: 'departmentId', idPrefix: 'D', idPattern: '{CODE}-D-{YEAR}-{SEQ}',
        description: 'Organizational departments, heads, and structure',
        dataOwner: 'admin', dataSteward: 'hr'
      },

      // Project Master
      {
        entityCode: 'PROJECT', entityName: 'Project Master', category: 'project_master',
        primaryModule: 'project', secondaryModules: ['o2c', 'p2p', 'ppc', 'finance'],
        mongoModel: 'Project', idField: 'projectId', idPrefix: 'P', idPattern: '{CODE}-P-{YEAR}-{SEQ}',
        isCritical: true, description: 'Project profiles, timeline, budget, team, and milestones',
        fields: [
          { fieldName: 'name', displayLabel: 'Project Name', fieldType: 'string', isRequired: true, isSearchable: true, isMasterField: true },
          { fieldName: 'projectId', displayLabel: 'Project ID', fieldType: 'string', isUnique: true, isSearchable: true, isMasterField: true },
          { fieldName: 'status', displayLabel: 'Status', fieldType: 'string', isMasterField: true },
          { fieldName: 'stage', displayLabel: 'Stage', fieldType: 'string', isMasterField: true },
          { fieldName: 'customer', displayLabel: 'Customer', fieldType: 'reference', referenceEntity: 'CUSTOMER', isMasterField: true },
        ],
        crossReferences: [
          { relatedEntity: 'CUSTOMER', relationshipType: 'many_to_one', foreignKeyField: 'customer', description: 'Project belongs to customer' },
          { relatedEntity: 'WORK_ORDER', relationshipType: 'one_to_many', foreignKeyField: 'project', description: 'Project has work orders' },
          { relatedEntity: 'PURCHASE_ORDER', relationshipType: 'one_to_many', foreignKeyField: 'project', description: 'Project has purchase orders' },
          { relatedEntity: 'CUSTOMER_INVOICE', relationshipType: 'one_to_many', foreignKeyField: 'project', description: 'Project has invoices' },
        ],
        dataOwner: 'project_manager', dataSteward: 'operations'
      },
      {
        entityCode: 'WORK_ORDER', entityName: 'Work Order Master', category: 'project_master',
        primaryModule: 'ppc', secondaryModules: ['project', 'inventory'],
        mongoModel: 'WorkOrder', idField: 'workOrderId', idPrefix: 'WO', idPattern: '{CODE}-WO-{YEAR}-{SEQ}',
        description: 'Production work orders, schedules, and quality status',
        dataOwner: 'project_manager', dataSteward: 'operations'
      },

      // Document Masters
      {
        entityCode: 'PURCHASE_ORDER', entityName: 'Purchase Order', category: 'document_master',
        primaryModule: 'p2p', secondaryModules: ['inventory', 'finance', 'project'],
        mongoModel: 'PurchaseOrder', idField: 'poNumber', idPrefix: 'PO', idPattern: '{CODE}-PO-{YEAR}-{SEQ}',
        description: 'Purchase orders, line items, delivery tracking',
        dataOwner: 'admin', dataSteward: 'operations'
      },
      {
        entityCode: 'PURCHASE_REQUISITION', entityName: 'Purchase Requisition', category: 'document_master',
        primaryModule: 'p2p', secondaryModules: ['project'],
        mongoModel: 'PurchaseRequisition', idField: 'prNumber', idPrefix: 'PR', idPattern: '{CODE}-PR-{YEAR}-{SEQ}',
        description: 'Purchase requisitions and approval workflow',
        dataOwner: 'project_manager', dataSteward: 'operations'
      },
      {
        entityCode: 'GOODS_RECEIPT', entityName: 'Goods Receipt', category: 'document_master',
        primaryModule: 'p2p', secondaryModules: ['inventory'],
        mongoModel: 'GoodsReceipt', idField: 'grnNumber', idPrefix: 'GRN', idPattern: '{CODE}-GRN-{YEAR}-{SEQ}',
        description: 'Goods receipt notes, quality inspection, stock intake',
        dataOwner: 'operations', dataSteward: 'site_engineer'
      },
      {
        entityCode: 'SALES_ORDER', entityName: 'Sales Order', category: 'document_master',
        primaryModule: 'o2c', secondaryModules: ['crm', 'finance', 'project'],
        mongoModel: 'SalesOrder', idField: 'salesOrderId', idPrefix: 'SO', idPattern: '{CODE}-SO-{YEAR}-{SEQ}',
        description: 'Sales orders, line items, delivery and billing',
        dataOwner: 'sales_manager', dataSteward: 'sales_executive'
      },
      {
        entityCode: 'QUOTATION', entityName: 'Quotation', category: 'document_master',
        primaryModule: 'o2c', secondaryModules: ['crm'],
        mongoModel: 'Quotation', idField: 'quotationNumber', idPrefix: 'QT',
        description: 'Customer quotations and estimates',
        dataOwner: 'sales_manager', dataSteward: 'designer'
      },
      {
        entityCode: 'CUSTOMER_INVOICE', entityName: 'Customer Invoice', category: 'document_master',
        primaryModule: 'finance', secondaryModules: ['o2c', 'project'],
        mongoModel: 'CustomerInvoice', idField: 'invoiceNumber', idPrefix: 'INV',
        description: 'Customer invoices, payment tracking',
        dataOwner: 'finance', dataSteward: 'finance'
      },
      {
        entityCode: 'VENDOR_INVOICE', entityName: 'Vendor Invoice', category: 'document_master',
        primaryModule: 'p2p', secondaryModules: ['finance'],
        mongoModel: 'VendorInvoice', idField: 'invoiceNumber', idPrefix: 'VI',
        description: 'Vendor invoices and payment processing',
        dataOwner: 'finance', dataSteward: 'operations'
      },

      // Financial Masters
      {
        entityCode: 'PAYMENT', entityName: 'Payment Master', category: 'financial_master',
        primaryModule: 'finance', secondaryModules: ['o2c', 'p2p'],
        mongoModel: 'Payment', idField: 'paymentId', idPrefix: 'PAY',
        description: 'Customer and vendor payments, receipts',
        dataOwner: 'finance'
      },

      // Configuration
      {
        entityCode: 'ROLE', entityName: 'Role & Permission', category: 'configuration',
        primaryModule: 'core',
        mongoModel: 'Role', idField: '_id', idPrefix: '',
        description: 'RBAC roles and permission matrices',
        dataOwner: 'super_admin'
      },
      {
        entityCode: 'APPROVAL_MATRIX', entityName: 'Approval Matrix', category: 'configuration',
        primaryModule: 'core', secondaryModules: ['p2p', 'h2r', 'finance'],
        mongoModel: 'ApprovalMatrix', idField: '_id', idPrefix: '',
        description: 'Multi-level approval workflows and delegation rules',
        dataOwner: 'admin'
      },

      // CRM
      {
        entityCode: 'CALL_ACTIVITY', entityName: 'Call Activity', category: 'document_master',
        primaryModule: 'crm', secondaryModules: ['o2c'],
        mongoModel: 'CallActivity', idField: 'callActivityId', idPrefix: 'CA', idPattern: '{CODE}-CA-{YEAR}-{SEQ}',
        description: 'CRM call activities and follow-ups',
        dataOwner: 'sales_manager', dataSteward: 'pre_sales'
      },
      {
        entityCode: 'DESIGN_ITERATION', entityName: 'Design Iteration', category: 'document_master',
        primaryModule: 'crm', secondaryModules: ['project'],
        mongoModel: 'DesignIteration', idField: 'designIterationId', idPrefix: 'DI',
        description: 'Design iterations and client approvals',
        dataOwner: 'sales_manager', dataSteward: 'designer'
      },

      // HR Documents
      {
        entityCode: 'ATTENDANCE', entityName: 'Attendance Record', category: 'document_master',
        primaryModule: 'h2r',
        mongoModel: 'Attendance', idField: '_id', idPrefix: '',
        description: 'Daily attendance records with check-in/out',
        dataOwner: 'hr'
      },
      {
        entityCode: 'LEAVE', entityName: 'Leave Record', category: 'document_master',
        primaryModule: 'h2r',
        mongoModel: 'Leave', idField: 'leaveId', idPrefix: 'LV', idPattern: '{CODE}-LV-{YEAR}-{SEQ}',
        description: 'Leave applications and approvals',
        dataOwner: 'hr'
      },
      {
        entityCode: 'PAYROLL', entityName: 'Payroll Record', category: 'financial_master',
        primaryModule: 'h2r', secondaryModules: ['finance'],
        mongoModel: 'Payroll', idField: 'payrollId', idPrefix: 'PRL',
        description: 'Monthly payroll processing and payslips',
        dataOwner: 'hr', dataSteward: 'finance'
      },

      // PPC
      {
        entityCode: 'BOM', entityName: 'Bill of Materials', category: 'item_master',
        primaryModule: 'ppc', secondaryModules: ['inventory', 'project'],
        mongoModel: 'BillOfMaterials', idField: 'bomId', idPrefix: 'BOM',
        description: 'Bill of Materials for production',
        dataOwner: 'project_manager', dataSteward: 'operations'
      },

      // Inventory
      {
        entityCode: 'STOCK', entityName: 'Stock Record', category: 'item_master',
        primaryModule: 'inventory', secondaryModules: ['p2p', 'ppc'],
        mongoModel: 'Stock', idField: '_id', idPrefix: '',
        description: 'Current stock levels and warehouse locations',
        dataOwner: 'operations'
      },

      // Ticketing
      {
        entityCode: 'TICKET', entityName: 'Support Ticket', category: 'document_master',
        primaryModule: 'core',
        mongoModel: 'Ticket', idField: 'ticketId', idPrefix: 'TKT', idPattern: '{CODE}-TKT-{YEAR}-{SEQ}',
        description: 'Internal support tickets and issue tracking',
        dataOwner: 'admin'
      },
]

// Helper: Seed entities if registry is empty
async function ensureEntitiesSeeded() {
  const existing = await MasterEntity.countDocuments()
  if (existing > 0) return existing
  const created = await MasterEntity.insertMany(DEFAULT_ENTITIES, { ordered: false }).catch(err => {
    if (err.insertedDocs) return err.insertedDocs
    throw err
  })
  return Array.isArray(created) ? created.length : 0
}

// POST /api/mdm/entities/seed — Seed default entity registry from existing models
router.post('/entities/seed', async (req, res) => {
  try {
    const existing = await MasterEntity.countDocuments()
    if (existing > 0 && !req.body.force) {
      return res.json({ success: true, message: 'Entity registry already seeded', count: existing })
    }

    if (req.body.force) {
      await MasterEntity.deleteMany({})
    }

    const created = await MasterEntity.insertMany(DEFAULT_ENTITIES, { ordered: false }).catch(err => {
      if (err.insertedDocs) return err.insertedDocs
      throw err
    })

    res.json({ success: true, message: `Seeded ${Array.isArray(created) ? created.length : 'N/A'} entities`, data: created })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})


// ============================================================
// DASHBOARD & ANALYTICS
// ============================================================

// GET /api/mdm/dashboard — MDM Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company context required' })
    }

    // Auto-seed entity registry if empty
    await ensureEntitiesSeeded()

    // Get all registered entities
    const entities = await MasterEntity.find({ isActive: true }).lean()

    // Get master record stats
    const [
      recordStats,
      qualityStats,
      syncStats,
      duplicateStats,
      recentAudits,
      entityCounts,
      mappingCount
    ] = await Promise.all([
      MasterRecord.aggregate([
        { $match: { company: companyId } },
        { $group: { _id: '$entityCode', count: { $sum: 1 }, avgQuality: { $avg: '$qualityScore' } } }
      ]),
      MasterRecord.aggregate([
        { $match: { company: companyId } },
        { $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgQuality: { $avg: '$qualityScore' },
          avgCompleteness: { $avg: '$completeness' },
          highQuality: { $sum: { $cond: [{ $gte: ['$qualityScore', 80] }, 1, 0] } },
          mediumQuality: { $sum: { $cond: [{ $and: [{ $gte: ['$qualityScore', 50] }, { $lt: ['$qualityScore', 80] }] }, 1, 0] } },
          lowQuality: { $sum: { $cond: [{ $lt: ['$qualityScore', 50] }, 1, 0] } }
        }}
      ]),
      MasterRecord.aggregate([
        { $match: { company: companyId } },
        { $group: { _id: '$syncStatus', count: { $sum: 1 } } }
      ]),
      MasterRecord.countDocuments({ company: companyId, isDuplicate: true }),
      MasterDataAudit.find({ company: companyId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      // Count actual records from source models
      Promise.all(entities.filter(e => e.mongoModel).map(async (entity) => {
        try {
          const Model = mongoose.model(entity.mongoModel)
          const count = await Model.countDocuments(
            Model.schema.paths.company ? { company: companyId } : {}
          )
          return { entityCode: entity.entityCode, entityName: entity.entityName, category: entity.category, count, isCritical: entity.isCritical }
        } catch {
          return { entityCode: entity.entityCode, entityName: entity.entityName, category: entity.category, count: 0, isCritical: entity.isCritical }
        }
      })),
      IDMapping.countDocuments({ company: companyId, isActive: true })
    ])

    const quality = qualityStats[0] || { totalRecords: 0, avgQuality: 0, avgCompleteness: 0, highQuality: 0, mediumQuality: 0, lowQuality: 0 }
    const syncMap = {}
    syncStats.forEach(s => { syncMap[s._id] = s.count })

    res.json({
      success: true,
      data: {
        totalEntities: entities.length,
        totalMasterRecords: quality.totalRecords,
        totalMappings: mappingCount,
        duplicateCount: duplicateStats,
        avgQualityScore: Math.round(quality.avgQuality || 0),
        avgCompleteness: Math.round(quality.avgCompleteness || 0),
        qualityDistribution: {
          high: quality.highQuality,
          medium: quality.mediumQuality,
          low: quality.lowQuality
        },
        syncStatus: syncMap,
        entityRecordCounts: recordStats,
        sourceEntityCounts: entityCounts,
        recentAudits,
        entities: entities.map(e => ({
          code: e.entityCode,
          name: e.entityName,
          category: e.category,
          module: e.primaryModule,
          isCritical: e.isCritical,
          model: e.mongoModel
        }))
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})


// ============================================================
// GOLDEN MASTER RECORDS
// ============================================================

// GET /api/mdm/records — List golden records with filters
router.get('/records', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) return res.status(400).json({ success: false, message: 'Company context required' })

    const { entityCode, status, qualityMin, qualityMax, search, syncStatus, page = 1, limit = 50 } = req.query
    const filter = { company: companyId }
    if (entityCode) filter.entityCode = entityCode.toUpperCase()
    if (status) filter.status = status
    if (syncStatus) filter.syncStatus = syncStatus
    if (qualityMin || qualityMax) {
      filter.qualityScore = {}
      if (qualityMin) filter.qualityScore.$gte = Number(qualityMin)
      if (qualityMax) filter.qualityScore.$lte = Number(qualityMax)
    }
    if (search) {
      filter.$or = [
        { displayName: { $regex: search, $options: 'i' } },
        { displayId: { $regex: search, $options: 'i' } },
        { sourceHumanId: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [records, total] = await Promise.all([
      MasterRecord.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      MasterRecord.countDocuments(filter)
    ])

    res.json({
      success: true,
      data: records,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/mdm/records/:id — Get single golden record with full details
router.get('/records/:id', async (req, res) => {
  try {
    const record = await MasterRecord.findById(req.params.id).lean()
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    // Get related mappings
    const mappings = await IDMapping.find({
      $or: [
        { sourceModel: record.sourceModel, sourceId: record.sourceId },
        { targetModel: record.sourceModel, targetId: record.sourceId }
      ],
      company: record.company
    }).lean()

    // Get audit trail
    const audits = await MasterDataAudit.find({
      masterRecord: record._id,
      company: record.company
    }).sort({ createdAt: -1 }).limit(50).lean()

    res.json({ success: true, data: { ...record, mappings, audits } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/mdm/records/sync — Sync/create golden records from source model
router.post('/records/sync', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) return res.status(400).json({ success: false, message: 'Company context required' })

    const { entityCode } = req.body
    if (!entityCode) return res.status(400).json({ success: false, message: 'entityCode is required' })

    const entity = await MasterEntity.findOne({ entityCode: entityCode.toUpperCase() }).lean()
    if (!entity) return res.status(404).json({ success: false, message: 'Entity not registered' })

    let Model
    try {
      Model = mongoose.model(entity.mongoModel)
    } catch {
      return res.status(400).json({ success: false, message: `Model ${entity.mongoModel} not found` })
    }

    // Fetch all source records
    const queryFilter = Model.schema.paths.company ? { company: companyId } : {}
    const sourceRecords = await Model.find(queryFilter).lean()

    let created = 0, updated = 0, errors = 0

    for (const source of sourceRecords) {
      try {
        const sourceHumanId = source[entity.idField] || ''
        const displayName = source.name || source.title || source.projectName || source.displayName ||
          `${source.firstName || ''} ${source.lastName || ''}`.trim() || sourceHumanId

        // Calculate quality score
        const masterFields = (entity.fields || []).filter(f => f.isMasterField)
        let filledCount = 0
        masterFields.forEach(f => {
          const val = source[f.fieldName]
          if (val !== undefined && val !== null && val !== '') filledCount++
        })
        const completeness = masterFields.length > 0 ? Math.round((filledCount / masterFields.length) * 100) : 100
        const qualityScore = completeness // Simplified: quality = completeness for now

        // Build golden record map
        const goldenRecord = new Map()
        ;(entity.fields || []).forEach(f => {
          if (source[f.fieldName] !== undefined) {
            goldenRecord.set(f.fieldName, source[f.fieldName])
          }
        })

        // Field values with provenance
        const fieldValues = (entity.fields || []).map(f => ({
          fieldName: f.fieldName,
          value: source[f.fieldName],
          source: entity.primaryModule,
          confidence: source[f.fieldName] !== undefined && source[f.fieldName] !== null ? 100 : 0,
          lastUpdated: source.updatedAt || source.createdAt || new Date()
        }))

        const existing = await MasterRecord.findOne({
          sourceModel: entity.mongoModel,
          sourceId: source._id
        })

        if (existing) {
          existing.displayName = displayName
          existing.displayId = sourceHumanId
          existing.displayEmail = source.email || source.contactEmail || ''
          existing.displayPhone = source.phone || source.contactPhone || source.mobile || ''
          existing.displayCategory = source.category || source.type || source.segment || ''
          existing.goldenRecord = goldenRecord
          existing.fieldValues = fieldValues
          existing.qualityScore = qualityScore
          existing.completeness = completeness
          existing.lastSyncAt = new Date()
          existing.syncStatus = 'synced'
          existing.currentVersion = (existing.currentVersion || 1)
          await existing.save()
          updated++
        } else {
          await MasterRecord.create({
            company: companyId,
            entityCode: entityCode.toUpperCase(),
            sourceModel: entity.mongoModel,
            sourceId: source._id,
            sourceHumanId: sourceHumanId,
            displayName,
            displayId: sourceHumanId,
            displayEmail: source.email || source.contactEmail || '',
            displayPhone: source.phone || source.contactPhone || source.mobile || '',
            displayCategory: source.category || source.type || source.segment || '',
            goldenRecord,
            fieldValues,
            qualityScore,
            completeness,
            lastSyncAt: new Date(),
            syncStatus: 'synced',
            status: source.isActive === false ? 'inactive' : 'active',
            createdBy: req.user._id,
            createdByName: req.user.name
          })
          created++
        }
      } catch (err) {
        errors++
        console.error(`MDM sync error for ${entity.mongoModel}:`, err.message)
      }
    }

    // Log the sync action
    await MasterDataAudit.create({
      company: companyId,
      entityCode: entityCode.toUpperCase(),
      sourceModel: entity.mongoModel,
      action: 'sync',
      description: `Synced ${entity.entityName}: ${created} created, ${updated} updated, ${errors} errors`,
      changeSource: 'system',
      module: 'mdm',
      performedBy: req.user._id,
      performedByName: req.user.name,
      metadata: { created, updated, errors, total: sourceRecords.length }
    })

    // Update entity stats
    await MasterEntity.findOneAndUpdate(
      { entityCode: entityCode.toUpperCase() },
      { $set: {
        'stats.totalRecords': sourceRecords.length,
        'stats.activeRecords': sourceRecords.filter(r => r.isActive !== false).length,
        'stats.lastSyncAt': new Date(),
        'stats.qualityScore': Math.round(
          sourceRecords.length > 0
            ? sourceRecords.reduce((sum) => sum + 80, 0) / sourceRecords.length
            : 0
        )
      }}
    )

    res.json({
      success: true,
      message: `Sync complete: ${created} created, ${updated} updated, ${errors} errors`,
      data: { created, updated, errors, total: sourceRecords.length }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/mdm/records/sync-all — Sync all entities (auto-seeds registry if empty)
router.post('/records/sync-all', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) return res.status(400).json({ success: false, message: 'Company context required' })

    // Auto-seed entity registry if empty
    await ensureEntitiesSeeded()

    const entities = await MasterEntity.find({ isActive: true }).lean()
    const results = []

    for (const entity of entities) {
      try {
        let Model
        try {
          Model = mongoose.model(entity.mongoModel)
        } catch {
          results.push({ entityCode: entity.entityCode, status: 'skipped', reason: 'Model not found' })
          continue
        }

        const queryFilter = Model.schema.paths.company ? { company: companyId } : {}
        const count = await Model.countDocuments(queryFilter)

        // Only sync entities with data
        if (count > 0) {
          const sourceRecords = await Model.find(queryFilter).lean()
          let created = 0, updated = 0

          for (const source of sourceRecords) {
            const sourceHumanId = source[entity.idField] || ''
            const displayName = source.name || source.title || source.projectName ||
              `${source.firstName || ''} ${source.lastName || ''}`.trim() || sourceHumanId

            const masterFields = (entity.fields || []).filter(f => f.isMasterField)
            let filledCount = 0
            masterFields.forEach(f => {
              if (source[f.fieldName] !== undefined && source[f.fieldName] !== null && source[f.fieldName] !== '') filledCount++
            })
            const completeness = masterFields.length > 0 ? Math.round((filledCount / masterFields.length) * 100) : 100

            const existing = await MasterRecord.findOne({ sourceModel: entity.mongoModel, sourceId: source._id })
            if (existing) {
              existing.displayName = displayName
              existing.displayId = sourceHumanId
              existing.qualityScore = completeness
              existing.completeness = completeness
              existing.lastSyncAt = new Date()
              existing.syncStatus = 'synced'
              await existing.save()
              updated++
            } else {
              await MasterRecord.create({
                company: companyId,
                entityCode: entity.entityCode,
                sourceModel: entity.mongoModel,
                sourceId: source._id,
                sourceHumanId,
                displayName,
                displayId: sourceHumanId,
                qualityScore: completeness,
                completeness,
                lastSyncAt: new Date(),
                syncStatus: 'synced',
                status: source.isActive === false ? 'inactive' : 'active',
                createdBy: req.user._id,
                createdByName: req.user.name
              })
              created++
            }
          }
          results.push({ entityCode: entity.entityCode, entityName: entity.entityName, status: 'synced', created, updated, total: count })
        } else {
          results.push({ entityCode: entity.entityCode, entityName: entity.entityName, status: 'empty', total: 0 })
        }

        // Update entity stats
        await MasterEntity.findOneAndUpdate(
          { entityCode: entity.entityCode },
          { $set: { 'stats.totalRecords': count, 'stats.lastSyncAt': new Date() } }
        )
      } catch (err) {
        results.push({ entityCode: entity.entityCode, status: 'error', message: err.message })
      }
    }

    // Log the sync-all action
    await MasterDataAudit.create({
      company: companyId,
      entityCode: 'ALL',
      action: 'sync',
      description: `Full MDM sync: ${results.filter(r => r.status === 'synced').length} entities synced`,
      changeSource: 'system',
      module: 'mdm',
      performedBy: req.user._id,
      performedByName: req.user.name,
      metadata: { results }
    })

    res.json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /api/mdm/records/:id — Update golden record
router.put('/records/:id', async (req, res) => {
  try {
    const record = await MasterRecord.findById(req.params.id)
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' })

    const changes = []
    const { displayName, displayCategory, tags, segment, status } = req.body

    if (displayName && displayName !== record.displayName) {
      changes.push({ fieldName: 'displayName', oldValue: record.displayName, newValue: displayName })
      record.displayName = displayName
    }
    if (displayCategory && displayCategory !== record.displayCategory) {
      changes.push({ fieldName: 'displayCategory', oldValue: record.displayCategory, newValue: displayCategory })
      record.displayCategory = displayCategory
    }
    if (tags) record.tags = tags
    if (segment) record.segment = segment
    if (status) record.status = status

    if (changes.length > 0) {
      record.currentVersion += 1
      record.versions.push({
        versionNumber: record.currentVersion,
        changes,
        createdBy: req.user._id,
        createdByName: req.user.name
      })
    }

    record.lastModifiedBy = req.user._id
    record.lastModifiedByName = req.user.name
    await record.save()

    // Audit
    if (changes.length > 0) {
      await MasterDataAudit.create({
        company: record.company,
        entityCode: record.entityCode,
        sourceModel: record.sourceModel,
        sourceId: record.sourceId,
        sourceHumanId: record.sourceHumanId,
        recordName: record.displayName,
        masterRecord: record._id,
        action: 'golden_record_updated',
        description: `Updated golden record: ${changes.map(c => c.fieldName).join(', ')}`,
        changes,
        changeSource: 'manual',
        module: 'mdm',
        performedBy: req.user._id,
        performedByName: req.user.name
      })
    }

    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})


// ============================================================
// ID MAPPING / XREF
// ============================================================

// GET /api/mdm/mappings — List all ID mappings
router.get('/mappings', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) return res.status(400).json({ success: false, message: 'Company context required' })

    const { sourceEntity, targetEntity, module, page = 1, limit = 50 } = req.query
    const filter = { company: companyId, isActive: true }
    if (sourceEntity) filter.sourceEntity = sourceEntity.toUpperCase()
    if (targetEntity) filter.targetEntity = targetEntity.toUpperCase()
    if (module) filter.module = module

    const skip = (Number(page) - 1) * Number(limit)
    const [mappings, total] = await Promise.all([
      IDMapping.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      IDMapping.countDocuments(filter)
    ])

    res.json({
      success: true,
      data: mappings,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/mdm/mappings/entity/:entityCode/:id — Get all mappings for a specific entity record
router.get('/mappings/entity/:entityCode/:id', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) return res.status(400).json({ success: false, message: 'Company context required' })

    const entityCode = req.params.entityCode.toUpperCase()
    const recordId = new mongoose.Types.ObjectId(req.params.id)

    const mappings = await IDMapping.find({
      company: companyId,
      isActive: true,
      $or: [
        { sourceEntity: entityCode, sourceId: recordId },
        { targetEntity: entityCode, targetId: recordId }
      ]
    }).lean()

    res.json({ success: true, data: mappings })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/mdm/mappings — Create a new ID mapping
router.post('/mappings', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) return res.status(400).json({ success: false, message: 'Company context required' })

    const mapping = await IDMapping.create({
      ...req.body,
      company: companyId,
      createdBy: req.user._id,
      createdByName: req.user.name
    })

    res.status(201).json({ success: true, data: mapping })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
})

// POST /api/mdm/mappings/auto-discover — Auto-discover relationships from existing data
router.post('/mappings/auto-discover', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) return res.status(400).json({ success: false, message: 'Company context required' })

    let discovered = 0

    // Discover Customer → Project mappings
    try {
      const Project = mongoose.model('Project')
      const projects = await Project.find({ company: companyId, customer: { $exists: true, $ne: null } })
        .select('projectId name customer')
        .populate('customer', 'customerId name')
        .lean()

      for (const proj of projects) {
        if (!proj.customer) continue
        const exists = await IDMapping.findOne({
          sourceModel: 'Customer', sourceId: proj.customer._id,
          targetModel: 'Project', targetId: proj._id
        })
        if (!exists) {
          await IDMapping.create({
            company: companyId,
            sourceEntity: 'CUSTOMER', sourceModel: 'Customer', sourceId: proj.customer._id,
            sourceHumanId: proj.customer.customerId, sourceDisplayName: proj.customer.name,
            targetEntity: 'PROJECT', targetModel: 'Project', targetId: proj._id,
            targetHumanId: proj.projectId, targetDisplayName: proj.name,
            module: 'project', relationship: 'customer_has_project', relationshipType: 'owns',
            createdBy: req.user._id, createdByName: req.user.name
          })
          discovered++
        }
      }
    } catch { /* model may not exist */ }

    // Discover Vendor → PurchaseOrder mappings
    try {
      const PO = mongoose.model('PurchaseOrder')
      const pos = await PO.find({ company: companyId, vendor: { $exists: true, $ne: null } })
        .select('poNumber vendor')
        .populate('vendor', 'vendorId name')
        .lean()

      for (const po of pos) {
        if (!po.vendor) continue
        const exists = await IDMapping.findOne({
          sourceModel: 'Vendor', sourceId: po.vendor._id,
          targetModel: 'PurchaseOrder', targetId: po._id
        })
        if (!exists) {
          await IDMapping.create({
            company: companyId,
            sourceEntity: 'VENDOR', sourceModel: 'Vendor', sourceId: po.vendor._id,
            sourceHumanId: po.vendor.vendorId, sourceDisplayName: po.vendor.name,
            targetEntity: 'PURCHASE_ORDER', targetModel: 'PurchaseOrder', targetId: po._id,
            targetHumanId: po.poNumber, targetDisplayName: po.poNumber,
            module: 'p2p', relationship: 'vendor_has_po', relationshipType: 'supplies',
            createdBy: req.user._id, createdByName: req.user.name
          })
          discovered++
        }
      }
    } catch { /* model may not exist */ }

    // Discover Project → WorkOrder mappings
    try {
      const WO = mongoose.model('WorkOrder')
      const wos = await WO.find({ company: companyId, project: { $exists: true, $ne: null } })
        .select('workOrderId title project')
        .populate('project', 'projectId name')
        .lean()

      for (const wo of wos) {
        if (!wo.project) continue
        const exists = await IDMapping.findOne({
          sourceModel: 'Project', sourceId: wo.project._id,
          targetModel: 'WorkOrder', targetId: wo._id
        })
        if (!exists) {
          await IDMapping.create({
            company: companyId,
            sourceEntity: 'PROJECT', sourceModel: 'Project', sourceId: wo.project._id,
            sourceHumanId: wo.project.projectId, sourceDisplayName: wo.project.name,
            targetEntity: 'WORK_ORDER', targetModel: 'WorkOrder', targetId: wo._id,
            targetHumanId: wo.workOrderId, targetDisplayName: wo.title || wo.workOrderId,
            module: 'ppc', relationship: 'project_has_work_order', relationshipType: 'creates',
            createdBy: req.user._id, createdByName: req.user.name
          })
          discovered++
        }
      }
    } catch { /* model may not exist */ }

    // Discover Project → CustomerInvoice mappings
    try {
      const Invoice = mongoose.model('CustomerInvoice')
      const invoices = await Invoice.find({ company: companyId, project: { $exists: true, $ne: null } })
        .select('invoiceNumber project')
        .populate('project', 'projectId name')
        .lean()

      for (const inv of invoices) {
        if (!inv.project) continue
        const exists = await IDMapping.findOne({
          sourceModel: 'Project', sourceId: inv.project._id,
          targetModel: 'CustomerInvoice', targetId: inv._id
        })
        if (!exists) {
          await IDMapping.create({
            company: companyId,
            sourceEntity: 'PROJECT', sourceModel: 'Project', sourceId: inv.project._id,
            sourceHumanId: inv.project.projectId, sourceDisplayName: inv.project.name,
            targetEntity: 'CUSTOMER_INVOICE', targetModel: 'CustomerInvoice', targetId: inv._id,
            targetHumanId: inv.invoiceNumber, targetDisplayName: inv.invoiceNumber,
            module: 'finance', relationship: 'project_has_invoice', relationshipType: 'creates',
            createdBy: req.user._id, createdByName: req.user.name
          })
          discovered++
        }
      }
    } catch { /* model may not exist */ }

    // Log the discovery
    await MasterDataAudit.create({
      company: companyId,
      entityCode: 'ALL',
      action: 'link',
      description: `Auto-discovered ${discovered} cross-references`,
      changeSource: 'system',
      module: 'mdm',
      performedBy: req.user._id,
      performedByName: req.user.name,
      metadata: { discovered }
    })

    res.json({ success: true, message: `Discovered ${discovered} new mappings`, data: { discovered } })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// DELETE /api/mdm/mappings/:id — Deactivate a mapping
router.delete('/mappings/:id', async (req, res) => {
  try {
    const mapping = await IDMapping.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    )
    if (!mapping) return res.status(404).json({ success: false, message: 'Mapping not found' })
    res.json({ success: true, data: mapping })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})


// ============================================================
// DATA QUALITY
// ============================================================

// GET /api/mdm/quality — Data quality report
router.get('/quality', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) return res.status(400).json({ success: false, message: 'Company context required' })

    const { entityCode } = req.query
    const filter = { company: companyId }
    if (entityCode) filter.entityCode = entityCode.toUpperCase()

    const [byEntity, overallQuality, issuesByType, lowQualityRecords] = await Promise.all([
      MasterRecord.aggregate([
        { $match: filter },
        { $group: {
          _id: '$entityCode',
          totalRecords: { $sum: 1 },
          avgQuality: { $avg: '$qualityScore' },
          avgCompleteness: { $avg: '$completeness' },
          duplicates: { $sum: { $cond: ['$isDuplicate', 1, 0] } },
          minQuality: { $min: '$qualityScore' },
          maxQuality: { $max: '$qualityScore' }
        }},
        { $sort: { avgQuality: 1 } }
      ]),
      MasterRecord.aggregate([
        { $match: filter },
        { $group: {
          _id: null,
          avgQuality: { $avg: '$qualityScore' },
          avgCompleteness: { $avg: '$completeness' },
          totalIssues: { $sum: { $size: { $ifNull: ['$qualityIssues', []] } } }
        }}
      ]),
      MasterRecord.aggregate([
        { $match: filter },
        { $unwind: '$qualityIssues' },
        { $match: { 'qualityIssues.status': 'open' } },
        { $group: { _id: '$qualityIssues.ruleType', count: { $sum: 1 } } }
      ]),
      MasterRecord.find({ ...filter, qualityScore: { $lt: 50 } })
        .select('entityCode displayName displayId qualityScore completeness')
        .sort({ qualityScore: 1 })
        .limit(20)
        .lean()
    ])

    res.json({
      success: true,
      data: {
        overall: overallQuality[0] || { avgQuality: 0, avgCompleteness: 0, totalIssues: 0 },
        byEntity,
        issuesByType,
        lowQualityRecords
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})


// ============================================================
// AUDIT TRAIL
// ============================================================

// GET /api/mdm/audit — MDM Audit trail
router.get('/audit', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) return res.status(400).json({ success: false, message: 'Company context required' })

    const { entityCode, action, performedBy, page = 1, limit = 50 } = req.query
    const filter = { company: companyId }
    if (entityCode) filter.entityCode = entityCode.toUpperCase()
    if (action) filter.action = action
    if (performedBy) filter.performedBy = performedBy

    const skip = (Number(page) - 1) * Number(limit)
    const [audits, total] = await Promise.all([
      MasterDataAudit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      MasterDataAudit.countDocuments(filter)
    ])

    res.json({
      success: true,
      data: audits,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})


// ============================================================
// ENTITY STATISTICS REFRESH
// ============================================================

// POST /api/mdm/refresh-stats — Refresh all entity statistics
router.post('/refresh-stats', async (req, res) => {
  try {
    const companyId = req.activeCompany?._id
    if (!companyId) return res.status(400).json({ success: false, message: 'Company context required' })

    const entities = await MasterEntity.find({ isActive: true }).lean()
    const stats = []

    for (const entity of entities) {
      try {
        const Model = mongoose.model(entity.mongoModel)
        const queryFilter = Model.schema.paths.company ? { company: companyId } : {}
        const total = await Model.countDocuments(queryFilter)

        // Count active (if model has isActive field)
        let active = total
        if (Model.schema.paths.isActive) {
          active = await Model.countDocuments({ ...queryFilter, isActive: true })
        }

        // Quality from master records
        const qualityAgg = await MasterRecord.aggregate([
          { $match: { company: companyId, entityCode: entity.entityCode } },
          { $group: { _id: null, avg: { $avg: '$qualityScore' }, dups: { $sum: { $cond: ['$isDuplicate', 1, 0] } }, incomplete: { $sum: { $cond: [{ $lt: ['$completeness', 80] }, 1, 0] } } } }
        ])
        const q = qualityAgg[0] || { avg: 0, dups: 0, incomplete: 0 }

        await MasterEntity.findOneAndUpdate(
          { entityCode: entity.entityCode },
          { $set: {
            'stats.totalRecords': total,
            'stats.activeRecords': active,
            'stats.lastSyncAt': new Date(),
            'stats.qualityScore': Math.round(q.avg || 0),
            'stats.duplicateCount': q.dups,
            'stats.incompleteCount': q.incomplete
          }}
        )

        stats.push({ entityCode: entity.entityCode, total, active, qualityScore: Math.round(q.avg || 0) })
      } catch {
        stats.push({ entityCode: entity.entityCode, total: 0, error: 'Model not found' })
      }
    }

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
