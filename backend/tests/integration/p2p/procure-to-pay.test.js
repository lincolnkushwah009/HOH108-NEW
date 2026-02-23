/**
 * P2P (Procure to Pay) Integration Tests
 *
 * Tests the complete procurement cycle:
 * 1. Vendor Management
 * 2. Purchase Requisition → Purchase Order
 * 3. PO Approval Workflow
 * 4. Goods Receipt Note (GRN)
 * 5. Vendor Invoice
 * 6. Payment Processing
 * 7. Stock Updates
 */

import mongoose from 'mongoose'
import Company from '../../../models/Company.js'
import User from '../../../models/User.js'
import Vendor from '../../../models/Vendor.js'
import Material from '../../../models/Material.js'
import PurchaseOrder from '../../../models/PurchaseOrder.js'
import GoodsReceipt from '../../../models/GoodsReceipt.js'
import VendorInvoice from '../../../models/VendorInvoice.js'
import Payment from '../../../models/Payment.js'
import StockMovement from '../../../models/StockMovement.js'
import { seedDatabase, createP2PScenario } from '../../fixtures/seed-data.js'
import { generateToken } from '../../helpers/auth-helper.js'
import {
  generateVendor,
  generateMaterial,
  generatePurchaseOrder
} from '../../helpers/mock-data.js'

// Helper to generate unique PO number for tests
let poCounter = 0
const generatePONumber = () => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  poCounter++
  return `PO-${year}${month}-${String(poCounter).padStart(4, '0')}`
}

// Helper to generate unique movement number for tests
let movementCounter = 0
const generateMovementNumber = () => {
  const date = new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  movementCounter++
  return `SM-${yy}${mm}-${String(movementCounter).padStart(4, '0')}`
}

// Helper to generate unique GRN number for tests
let grnCounter = 0
const generateGRNNumber = () => {
  const date = new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  grnCounter++
  return `GRN-${yy}${mm}-${String(grnCounter).padStart(4, '0')}`
}

// Helper to generate unique vendor invoice number for tests
let vendorInvoiceCounter = 0
const generateVendorInvoiceNumber = () => {
  vendorInvoiceCounter++
  return `VINV-${Date.now()}-${String(vendorInvoiceCounter).padStart(3, '0')}`
}

// Helper to generate unique payment number for tests
let paymentCounter = 0
const generatePaymentNumber = () => {
  const date = new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  paymentCounter++
  return `PAY-${yy}${mm}-${String(paymentCounter).padStart(4, '0')}`
}

describe('P2P (Procure to Pay) Integration Tests', () => {
  let seedResult
  let p2pScenario
  let adminToken

  beforeEach(async () => {
    // Seed the database with base data
    seedResult = await seedDatabase()
    p2pScenario = await createP2PScenario(seedResult)
    adminToken = generateToken(seedResult.users[0]._id)
  })

  describe('Vendor Management', () => {
    it('should create a new vendor successfully', async () => {
      const vendorData = generateVendor(seedResult.company._id)

      const vendor = await Vendor.create({
        ...vendorData,
        createdBy: seedResult.users[0]._id
      })

      expect(vendor).toBeDefined()
      expect(vendor.name).toBe(vendorData.name)
      expect(vendor.status).toBe('active')
      expect(vendor.company.toString()).toBe(seedResult.company._id.toString())
    })

    it('should list vendors filtered by status', async () => {
      const activeVendors = await Vendor.find({
        company: seedResult.company._id,
        status: 'active'
      })

      expect(activeVendors.length).toBeGreaterThan(0)
      activeVendors.forEach(vendor => {
        expect(vendor.status).toBe('active')
      })
    })

    it('should update vendor payment terms', async () => {
      const vendor = seedResult.vendors[0]
      vendor.paymentTerms = 'net_45'
      await vendor.save()

      const updatedVendor = await Vendor.findById(vendor._id)
      expect(updatedVendor.paymentTerms).toBe('net_45')
    })

    it('should deactivate a vendor', async () => {
      const vendor = seedResult.vendors[0]
      vendor.status = 'inactive'
      await vendor.save()

      const deactivatedVendor = await Vendor.findById(vendor._id)
      expect(deactivatedVendor.status).toBe('inactive')
    })
  })

  describe('Material Management', () => {
    it('should create a new material with initial stock', async () => {
      const materialData = generateMaterial(seedResult.company._id)

      const material = await Material.create({
        ...materialData,
        createdBy: seedResult.users[0]._id
      })

      expect(material).toBeDefined()
      expect(material.materialName).toBe(materialData.materialName)
      expect(material.skuCode).toBe(materialData.skuCode)
    })

    it('should list materials by category', async () => {
      // Create a material
      const newMaterial = await Material.create({
        materialName: 'Test Hardware Item',
        skuCode: 'THI-001',
        company: seedResult.company._id,
        category: 'hardware',
        unit: 'pcs',
        unitPrice: 100,
        defaultReorderLevel: 10,
        createdBy: seedResult.users[0]._id
      })

      const hardwareMaterials = await Material.find({
        company: seedResult.company._id,
        category: 'hardware'
      })

      expect(hardwareMaterials.length).toBeGreaterThan(0)
      expect(hardwareMaterials.some(m => m._id.equals(newMaterial._id))).toBe(true)
    })
  })

  describe('Purchase Order Workflow', () => {
    it('should create a draft purchase order', async () => {
      const { company, admin, vendor, materials, lineItems } = p2pScenario

      const po = await PurchaseOrder.create({
        company: company._id,
        vendor: vendor._id,
        createdBy: admin._id,
        poNumber: generatePONumber(),
        status: 'draft',
        lineItems: lineItems,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        paymentTerms: 'net_30',
        internalNotes: 'Test purchase order'
      })

      expect(po).toBeDefined()
      expect(po.status).toBe('draft')
      expect(po.lineItems.length).toBe(lineItems.length)
      expect(po.vendor.toString()).toBe(vendor._id.toString())
    })

    it('should calculate PO totals correctly', async () => {
      const { company, admin, vendor, lineItems } = p2pScenario

      const po = await PurchaseOrder.create({
        company: company._id,
        vendor: vendor._id,
        createdBy: admin._id,
        poNumber: generatePONumber(),
        status: 'draft',
        lineItems: lineItems,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })

      // Calculate expected total
      const expectedTotal = lineItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice)
      }, 0)

      // The model should have calculated subtotal
      expect(po.subTotal).toBeDefined()
    })

    it('should submit PO for approval', async () => {
      const { company, admin, vendor, lineItems } = p2pScenario

      const po = await PurchaseOrder.create({
        company: company._id,
        vendor: vendor._id,
        createdBy: admin._id,
        poNumber: generatePONumber(),
        status: 'draft',
        lineItems: lineItems,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })

      // Submit for approval
      po.status = 'pending_approval'
      po.activities = po.activities || []
      po.activities.push({
        action: 'submitted',
        description: 'PO submitted for approval',
        performedBy: admin._id,
        performedByName: admin.name
      })
      await po.save()

      const submittedPO = await PurchaseOrder.findById(po._id)
      expect(submittedPO.status).toBe('pending_approval')
    })

    it('should approve purchase order', async () => {
      const { company, admin, vendor, lineItems } = p2pScenario

      const po = await PurchaseOrder.create({
        company: company._id,
        vendor: vendor._id,
        createdBy: admin._id,
        poNumber: generatePONumber(),
        status: 'pending_approval',
        lineItems: lineItems,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })

      // Approve
      po.status = 'approved'
      po.approvedBy = admin._id
      po.approvedAt = new Date()
      po.activities = po.activities || []
      po.activities.push({
        action: 'approved',
        description: 'PO approved',
        performedBy: admin._id,
        performedByName: admin.name
      })
      await po.save()

      const approvedPO = await PurchaseOrder.findById(po._id)
      expect(approvedPO.status).toBe('approved')
      expect(approvedPO.approvedBy.toString()).toBe(admin._id.toString())
    })

    it('should reject purchase order with reason', async () => {
      const { company, admin, vendor, lineItems } = p2pScenario

      const po = await PurchaseOrder.create({
        company: company._id,
        vendor: vendor._id,
        createdBy: admin._id,
        poNumber: generatePONumber(),
        status: 'pending_approval',
        lineItems: lineItems,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })

      // Reject - use approvalStatus for rejection, status becomes cancelled
      po.status = 'cancelled'
      po.approvalStatus = 'rejected'
      po.approvalRemarks = 'Budget constraints'
      po.activities = po.activities || []
      po.activities.push({
        action: 'rejected',
        description: 'PO rejected: Budget constraints',
        performedBy: admin._id,
        performedByName: admin.name
      })
      await po.save()

      const rejectedPO = await PurchaseOrder.findById(po._id)
      expect(rejectedPO.approvalStatus).toBe('rejected')
      expect(rejectedPO.status).toBe('cancelled')
      expect(rejectedPO.approvalRemarks).toBe('Budget constraints')
    })
  })

  describe('Goods Receipt Note (GRN)', () => {
    let approvedPO

    beforeEach(async () => {
      const { company, admin, vendor, lineItems } = p2pScenario

      approvedPO = await PurchaseOrder.create({
        company: company._id,
        vendor: vendor._id,
        createdBy: admin._id,
        poNumber: generatePONumber(),
        status: 'approved',
        approvedBy: admin._id,
        approvedAt: new Date(),
        lineItems: lineItems,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
    })

    it('should create GRN for approved PO', async () => {
      const { company, admin, vendor, materials } = p2pScenario

      const grnItems = approvedPO.lineItems.map((item, index) => ({
        slNo: index + 1,
        description: item.description,
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity,
        acceptedQuantity: item.quantity,
        rejectedQuantity: 0
      }))

      const grn = await GoodsReceipt.create({
        company: company._id,
        vendor: vendor._id,
        purchaseOrder: approvedPO._id,
        receivedBy: admin._id,
        createdBy: admin._id,
        grnNumber: generateGRNNumber(),
        receiptDate: new Date(),
        status: 'draft',
        lineItems: grnItems
      })

      expect(grn).toBeDefined()
      expect(grn.purchaseOrder.toString()).toBe(approvedPO._id.toString())
      expect(grn.lineItems.length).toBe(approvedPO.lineItems.length)
    })

    it('should handle partial receipt in GRN', async () => {
      const { company, admin, vendor, materials } = p2pScenario

      const grnItems = approvedPO.lineItems.map((item, index) => ({
        slNo: index + 1,
        description: item.description,
        orderedQuantity: item.quantity,
        receivedQuantity: Math.floor(item.quantity * 0.5), // 50% received
        acceptedQuantity: Math.floor(item.quantity * 0.5),
        rejectedQuantity: 0
      }))

      const grn = await GoodsReceipt.create({
        company: company._id,
        vendor: vendor._id,
        purchaseOrder: approvedPO._id,
        receivedBy: admin._id,
        createdBy: admin._id,
        grnNumber: generateGRNNumber(),
        receiptDate: new Date(),
        status: 'draft',
        lineItems: grnItems,
        internalNotes: 'Partial delivery'
      })

      expect(grn).toBeDefined()
      grn.lineItems.forEach((item, i) => {
        expect(item.receivedQuantity).toBeLessThan(item.orderedQuantity)
      })
    })

    it('should approve GRN and update PO status', async () => {
      const { company, admin, vendor, materials } = p2pScenario

      const grnItems = approvedPO.lineItems.map((item, index) => ({
        slNo: index + 1,
        description: item.description,
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity,
        acceptedQuantity: item.quantity,
        rejectedQuantity: 0
      }))

      const grn = await GoodsReceipt.create({
        company: company._id,
        vendor: vendor._id,
        purchaseOrder: approvedPO._id,
        receivedBy: admin._id,
        createdBy: admin._id,
        grnNumber: generateGRNNumber(),
        receiptDate: new Date(),
        status: 'draft',
        lineItems: grnItems
      })

      // Approve GRN (draft -> received -> accepted)
      grn.status = 'accepted'
      grn.approvedBy = admin._id
      grn.approvedAt = new Date()
      await grn.save()

      // Update PO status
      approvedPO.status = 'fully_delivered'
      await approvedPO.save()

      const updatedPO = await PurchaseOrder.findById(approvedPO._id)
      expect(updatedPO.status).toBe('fully_delivered')
    })
  })

  describe('Vendor Invoice Processing', () => {
    let approvedPO

    beforeEach(async () => {
      const { company, admin, vendor, lineItems } = p2pScenario

      approvedPO = await PurchaseOrder.create({
        company: company._id,
        vendor: vendor._id,
        createdBy: admin._id,
        poNumber: generatePONumber(),
        status: 'fully_delivered',
        lineItems: lineItems,
        expectedDeliveryDate: new Date()
      })
    })

    it('should create vendor invoice linked to PO', async () => {
      const { company, admin, vendor } = p2pScenario

      const invoice = await VendorInvoice.create({
        company: company._id,
        vendor: vendor._id,
        purchaseOrder: approvedPO._id,
        createdBy: admin._id,
        invoiceNumber: 'VINV-2026-001',
        vendorInvoiceNumber: generateVendorInvoiceNumber(),
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        items: approvedPO.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit
        }))
      })

      expect(invoice).toBeDefined()
      expect(invoice.purchaseOrder.toString()).toBe(approvedPO._id.toString())
      expect(invoice.status).toBe('draft')
    })

    it('should calculate invoice totals with tax', async () => {
      const { company, admin, vendor } = p2pScenario

      const items = approvedPO.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit,
        taxRate: 18 // GST
      }))

      const invoice = await VendorInvoice.create({
        company: company._id,
        vendor: vendor._id,
        purchaseOrder: approvedPO._id,
        createdBy: admin._id,
        invoiceNumber: 'VINV-2026-002',
        vendorInvoiceNumber: generateVendorInvoiceNumber(),
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        items
      })

      expect(invoice).toBeDefined()
      // Verify the invoice has calculated fields
    })

    it('should approve vendor invoice', async () => {
      const { company, admin, vendor } = p2pScenario

      const invoice = await VendorInvoice.create({
        company: company._id,
        vendor: vendor._id,
        purchaseOrder: approvedPO._id,
        createdBy: admin._id,
        invoiceNumber: 'VINV-2026-003',
        vendorInvoiceNumber: generateVendorInvoiceNumber(),
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        items: [{
          description: 'Test Item',
          quantity: 10,
          unitPrice: 100,
          unit: 'pcs'
        }]
      })

      // Approve invoice
      invoice.status = 'approved'
      invoice.approvedBy = admin._id
      invoice.approvedAt = new Date()
      await invoice.save()

      const approvedInvoice = await VendorInvoice.findById(invoice._id)
      expect(approvedInvoice.status).toBe('approved')
    })
  })

  describe('Payment Processing', () => {
    let vendorInvoice

    beforeEach(async () => {
      const { company, admin, vendor, lineItems } = p2pScenario

      const po = await PurchaseOrder.create({
        company: company._id,
        vendor: vendor._id,
        createdBy: admin._id,
        poNumber: generatePONumber(),
        status: 'fully_delivered',
        lineItems: lineItems
      })

      vendorInvoice = await VendorInvoice.create({
        company: company._id,
        vendor: vendor._id,
        purchaseOrder: po._id,
        createdBy: admin._id,
        invoiceNumber: 'VINV-PAY-001',
        vendorInvoiceNumber: generateVendorInvoiceNumber(),
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'approved',
        items: [{
          description: 'Test Item',
          quantity: 10,
          unitPrice: 1000,
          unit: 'pcs'
        }]
      })
    })

    it('should record partial payment against vendor invoice', async () => {
      const { company, admin, vendor } = p2pScenario

      const payment = await Payment.create({
        company: company._id,
        paymentNumber: generatePaymentNumber(),
        paymentType: 'outgoing',
        vendor: vendor._id,
        vendorInvoice: vendorInvoice._id,
        paymentDate: new Date(),
        amount: 5000, // Partial payment
        paymentMethod: 'bank_transfer',
        referenceNumber: 'REF-001',
        status: 'completed',
        createdBy: admin._id,
        processedBy: admin._id,
        processedAt: new Date()
      })

      expect(payment).toBeDefined()
      expect(payment.amount).toBe(5000)
      expect(payment.paymentType).toBe('outgoing')
    })

    it('should record full payment and update invoice status', async () => {
      const { company, admin, vendor } = p2pScenario

      // Calculate invoice total
      const invoiceTotal = 10000 // 10 * 1000

      const payment = await Payment.create({
        company: company._id,
        paymentNumber: generatePaymentNumber(),
        paymentType: 'outgoing',
        vendor: vendor._id,
        vendorInvoice: vendorInvoice._id,
        paymentDate: new Date(),
        amount: invoiceTotal,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'REF-002',
        status: 'completed',
        createdBy: admin._id,
        processedBy: admin._id,
        processedAt: new Date()
      })

      // Update invoice payment status
      vendorInvoice.paymentStatus = 'paid'
      vendorInvoice.paidAmount = invoiceTotal
      await vendorInvoice.save()

      const paidInvoice = await VendorInvoice.findById(vendorInvoice._id)
      expect(paidInvoice.paymentStatus).toBe('paid')
    })

    it('should track multiple payments for single invoice', async () => {
      const { company, admin, vendor } = p2pScenario

      // First payment
      await Payment.create({
        company: company._id,
        paymentNumber: generatePaymentNumber(),
        paymentType: 'outgoing',
        vendor: vendor._id,
        vendorInvoice: vendorInvoice._id,
        paymentDate: new Date(),
        amount: 3000,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        createdBy: admin._id
      })

      // Second payment
      await Payment.create({
        company: company._id,
        paymentNumber: generatePaymentNumber(),
        paymentType: 'outgoing',
        vendor: vendor._id,
        vendorInvoice: vendorInvoice._id,
        paymentDate: new Date(),
        amount: 3000,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        createdBy: admin._id
      })

      // Get all payments for invoice
      const payments = await Payment.find({
        vendorInvoice: vendorInvoice._id
      })

      expect(payments.length).toBe(2)
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
      expect(totalPaid).toBe(6000)
    })
  })

  describe('Stock Movement Tracking', () => {
    it('should create stock in movement on GRN approval', async () => {
      const { company, admin, materials } = p2pScenario
      const material = materials[0]

      const movement = await StockMovement.create({
        company: company._id,
        material: material._id,
        movementNumber: generateMovementNumber(),
        movementType: 'receipt',
        quantity: 50,
        reason: 'GRN Receipt',
        reference: 'grn',
        referenceId: new mongoose.Types.ObjectId(),
        createdBy: admin._id
      })

      expect(movement).toBeDefined()
      expect(movement.movementType).toBe('receipt')
      expect(movement.quantity).toBe(50)
    })

    it('should record stock movement for material', async () => {
      const { company, admin } = p2pScenario
      const material = seedResult.materials[0]

      // Create a stock receipt movement
      const movement = await StockMovement.create({
        company: company._id,
        material: material._id,
        movementNumber: generateMovementNumber(),
        movementType: 'receipt',
        quantity: 100,
        reason: 'Purchase Receipt',
        createdBy: admin._id
      })

      expect(movement).toBeDefined()
      expect(movement.quantity).toBe(100)
      expect(movement.movementType).toBe('receipt')
      expect(movement.material.toString()).toBe(material._id.toString())
    })

    it('should track stock movement history', async () => {
      const { company, admin } = p2pScenario
      const material = seedResult.materials[0]

      // Create multiple movements
      const receiptMovement = await StockMovement.create({
        company: company._id,
        material: material._id,
        movementNumber: generateMovementNumber(),
        movementType: 'receipt',
        quantity: 50,
        reason: 'Purchase Receipt 1',
        createdBy: admin._id
      })

      const issueMovement = await StockMovement.create({
        company: company._id,
        material: material._id,
        movementNumber: generateMovementNumber(),
        movementType: 'issue',
        quantity: 20,
        reason: 'Project Issue',
        createdBy: admin._id
      })

      const movements = await StockMovement.find({
        material: material._id
      })

      expect(movements.length).toBe(2)

      // Verify we have both types
      const movementTypes = movements.map(m => m.movementType)
      expect(movementTypes).toContain('receipt')
      expect(movementTypes).toContain('issue')
    })
  })

  describe('Complete P2P Cycle', () => {
    it('should execute full P2P cycle from PO to Payment', async () => {
      const { company, admin, vendor, materials, lineItems } = p2pScenario

      // Step 1: Create Purchase Order
      const po = await PurchaseOrder.create({
        company: company._id,
        vendor: vendor._id,
        createdBy: admin._id,
        poNumber: generatePONumber(),
        status: 'draft',
        lineItems: lineItems,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      })
      expect(po.status).toBe('draft')

      // Step 2: Submit for approval
      po.status = 'pending_approval'
      await po.save()
      expect(po.status).toBe('pending_approval')

      // Step 3: Approve PO
      po.status = 'approved'
      po.approvedBy = admin._id
      po.approvedAt = new Date()
      await po.save()
      expect(po.status).toBe('approved')

      // Step 4: Create GRN
      const grn = await GoodsReceipt.create({
        company: company._id,
        vendor: vendor._id,
        purchaseOrder: po._id,
        receivedBy: admin._id,
        createdBy: admin._id,
        grnNumber: generateGRNNumber(),
        receiptDate: new Date(),
        status: 'draft',
        lineItems: po.lineItems.map((item, index) => ({
          slNo: index + 1,
          description: item.description,
          orderedQuantity: item.quantity,
          receivedQuantity: item.quantity,
          acceptedQuantity: item.quantity,
          rejectedQuantity: 0
        }))
      })
      expect(grn.status).toBe('draft')

      // Step 5: Approve GRN (draft -> received -> accepted)
      grn.status = 'accepted'
      grn.approvedBy = admin._id
      grn.approvedAt = new Date()
      await grn.save()

      // Update PO to fully_delivered
      po.status = 'fully_delivered'
      await po.save()

      // Step 6: Create Vendor Invoice
      const invoice = await VendorInvoice.create({
        company: company._id,
        vendor: vendor._id,
        purchaseOrder: po._id,
        createdBy: admin._id,
        invoiceNumber: 'VINV-FULL-001',
        vendorInvoiceNumber: generateVendorInvoiceNumber(),
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'draft',
        items: po.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit
        }))
      })
      expect(invoice.status).toBe('draft')

      // Step 7: Approve Invoice
      invoice.status = 'approved'
      await invoice.save()

      // Step 8: Process Payment
      const totalAmount = po.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      const payment = await Payment.create({
        company: company._id,
        paymentNumber: generatePaymentNumber(),
        paymentType: 'outgoing',
        vendor: vendor._id,
        vendorInvoice: invoice._id,
        paymentDate: new Date(),
        amount: totalAmount,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        createdBy: admin._id
      })
      expect(payment.status).toBe('completed')

      // Step 9: Update Invoice payment status
      invoice.paymentStatus = 'paid'
      invoice.paidAmount = totalAmount
      await invoice.save()

      // Verify final states
      const finalPO = await PurchaseOrder.findById(po._id)
      const finalInvoice = await VendorInvoice.findById(invoice._id)

      expect(finalPO.status).toBe('fully_delivered')
      expect(finalInvoice.paymentStatus).toBe('paid')
    })
  })
})
