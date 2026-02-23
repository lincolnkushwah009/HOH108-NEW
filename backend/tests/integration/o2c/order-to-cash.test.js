/**
 * O2C (Order to Cash) Integration Tests
 *
 * Tests the complete sales cycle:
 * 1. Lead Management & Conversion
 * 2. Customer Management
 * 3. Project Creation
 * 4. Sales Order Creation
 * 5. Customer Invoice Generation
 * 6. Payment Collection
 * 7. Revenue Recognition
 */

import mongoose from 'mongoose'
import Company from '../../../models/Company.js'
import User from '../../../models/User.js'
import Lead from '../../../models/Lead.js'
import Customer from '../../../models/Customer.js'
import Project from '../../../models/Project.js'
import SalesOrder from '../../../models/SalesOrder.js'
import CustomerInvoice from '../../../models/CustomerInvoice.js'
import Payment from '../../../models/Payment.js'
import { seedDatabase, createO2CScenario } from '../../fixtures/seed-data.js'
import { generateToken } from '../../helpers/auth-helper.js'
import {
  generateLead,
  generateCustomer,
  generateProject,
  generateSalesOrder
} from '../../helpers/mock-data.js'

// Helper to generate unique payment number for tests
let paymentCounter = 0
const generatePaymentNumber = () => {
  const date = new Date()
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  paymentCounter++
  return `PAY-${yy}${mm}-${String(paymentCounter).padStart(4, '0')}`
}

describe('O2C (Order to Cash) Integration Tests', () => {
  let seedResult
  let o2cScenario
  let adminToken

  beforeEach(async () => {
    seedResult = await seedDatabase()
    o2cScenario = await createO2CScenario(seedResult)
    adminToken = generateToken(seedResult.users[0]._id)
  })

  describe('Lead Management', () => {
    it('should create a new lead', async () => {
      const leadData = generateLead(
        seedResult.company._id,
        seedResult.users[0]._id
      )

      const lead = await Lead.create(leadData)

      expect(lead).toBeDefined()
      expect(lead.name).toBe(leadData.name)
      expect(lead.status).toBe('new')
      expect(lead.company.toString()).toBe(seedResult.company._id.toString())
    })

    it('should update lead status through pipeline', async () => {
      const lead = o2cScenario.lead

      // Progress through pipeline
      const statuses = ['contacted', 'qualified', 'proposal_sent', 'negotiation']

      for (const status of statuses) {
        lead.status = status
        lead.activities = lead.activities || []
        lead.activities.push({
          action: 'status_changed',
          description: `Status changed to ${status}`,
          performedBy: seedResult.users[0]._id
        })
        await lead.save()

        const updatedLead = await Lead.findById(lead._id)
        expect(updatedLead.status).toBe(status)
      }
    })

    it('should track lead activities', async () => {
      const lead = o2cScenario.lead

      // Add call activity
      lead.activities = lead.activities || []
      lead.activities.push({
        action: 'call_made',
        description: 'Initial discovery call',
        performedBy: seedResult.users[0]._id,
        metadata: { outcome: 'Interested in services' }
      })

      // Add meeting activity
      lead.activities.push({
        action: 'meeting_scheduled',
        description: 'Site visit scheduled',
        performedBy: seedResult.users[0]._id,
        metadata: { outcome: 'Requirements gathered' }
      })

      await lead.save()

      const updatedLead = await Lead.findById(lead._id)
      expect(updatedLead.activities.length).toBeGreaterThanOrEqual(2)
    })

    it('should convert lead to customer', async () => {
      const lead = o2cScenario.lead

      // Mark lead as won
      lead.status = 'won'
      lead.isConverted = true
      lead.convertedAt = new Date()
      await lead.save()

      // Create customer from lead (Customer uses 'originalLead' not 'convertedFromLead')
      const customer = await Customer.create({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        originalLead: lead._id,
        type: 'individual',
        segment: 'new',
        status: 'active',
        convertedAt: new Date(),
        convertedBy: seedResult.users[0]._id
      })

      // Update lead with customer reference
      lead.customer = customer._id
      await lead.save()

      expect(customer).toBeDefined()
      expect(customer.originalLead.toString()).toBe(lead._id.toString())

      const updatedLead = await Lead.findById(lead._id)
      expect(updatedLead.status).toBe('won')
      expect(updatedLead.customer.toString()).toBe(customer._id.toString())
    })

    it('should mark lead as lost with reason', async () => {
      const lead = o2cScenario.lead

      // Lead model uses activities with metadata for reason, not lostReason field
      lead.status = 'lost'
      lead.primaryStatus = 'lost'
      lead.activities = lead.activities || []
      lead.activities.push({
        action: 'status_changed',
        description: 'Marked as Lost. Reason: Budget constraints',
        performedBy: seedResult.users[0]._id,
        performedByName: 'Admin',
        oldValue: 'new',
        newValue: 'lost',
        metadata: { reason: 'Budget constraints' }
      })
      await lead.save()

      const lostLead = await Lead.findById(lead._id)
      expect(lostLead.status).toBe('lost')
      expect(lostLead.primaryStatus).toBe('lost')
      // Verify reason is in the last activity metadata
      const lastActivity = lostLead.activities[lostLead.activities.length - 1]
      expect(lastActivity.metadata.reason).toBe('Budget constraints')
    })
  })

  describe('Customer Management', () => {
    it('should create a new customer', async () => {
      const customerData = generateCustomer(seedResult.company._id)

      const customer = await Customer.create({
        ...customerData,
        createdBy: seedResult.users[0]._id
      })

      expect(customer).toBeDefined()
      expect(customer.name).toBe(customerData.name)
      expect(customer.status).toBe('active')
    })

    it('should update customer segment based on lifetime value', async () => {
      const customer = seedResult.customers[0]

      // Update lifetime value
      customer.totalRevenue = 3000000 // 30 lakhs
      await customer.save()

      // Determine segment
      let segment = 'bronze'
      if (customer.totalRevenue >= 5000000) segment = 'platinum'
      else if (customer.totalRevenue >= 2500000) segment = 'gold'
      else if (customer.totalRevenue >= 1000000) segment = 'silver'

      customer.segment = segment
      await customer.save()

      const updatedCustomer = await Customer.findById(customer._id)
      expect(updatedCustomer.segment).toBe('gold')
    })

    it('should track customer notes and activities', async () => {
      const customer = seedResult.customers[0]

      // Customer model uses 'notes' and 'activities' arrays, not 'communicationHistory'
      customer.notes = customer.notes || []
      customer.notes.push({
        content: 'Sent project proposal via email',
        addedBy: seedResult.users[0]._id,
        addedByName: 'Admin User',
        addedAt: new Date()
      })

      customer.activities = customer.activities || []
      customer.activities.push({
        action: 'proposal_sent',
        description: 'Project proposal sent via email',
        performedBy: seedResult.users[0]._id,
        performedByName: 'Admin User'
      })

      await customer.save()

      const updatedCustomer = await Customer.findById(customer._id)
      expect(updatedCustomer.notes.length).toBeGreaterThan(0)
      expect(updatedCustomer.activities.length).toBeGreaterThan(0)
    })
  })

  describe('Project Management', () => {
    it('should create project linked to customer', async () => {
      const { company, admin, customer } = o2cScenario

      const projectData = generateProject(
        company._id,
        customer._id,
        admin._id
      )

      const project = await Project.create(projectData)

      expect(project).toBeDefined()
      expect(project.customer.toString()).toBe(customer._id.toString())
      expect(project.status).toBe('active')
      expect(project.stage).toBe('initiation')
    })

    it('should progress project through stages', async () => {
      const project = o2cScenario.project
      const stages = ['design', 'approval', 'procurement', 'execution', 'qc_snag', 'handover']

      for (const stage of stages) {
        project.stage = stage
        project.activities = project.activities || []
        project.activities.push({
          action: 'stage_changed',
          description: `Project moved to ${stage} stage`,
          performedBy: seedResult.users[0]._id
        })
        await project.save()

        const updatedProject = await Project.findById(project._id)
        expect(updatedProject.stage).toBe(stage)
      }
    })

    it('should track project milestones', async () => {
      const project = o2cScenario.project

      project.milestones = [
        {
          name: 'Design Approval',
          targetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: 'pending'
        },
        {
          name: 'Material Procurement',
          targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending'
        },
        {
          name: 'Installation Complete',
          targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: 'pending'
        }
      ]
      await project.save()

      const updatedProject = await Project.findById(project._id)
      expect(updatedProject.milestones.length).toBe(3)
    })

    it('should complete project and update status', async () => {
      const project = o2cScenario.project

      project.stage = 'closure'
      project.status = 'completed'
      project.timeline = project.timeline || {}
      project.timeline.actualEndDate = new Date()
      project.activities = project.activities || []
      // Valid actions: created, stage_changed, assigned, milestone_added, milestone_completed,
      // payment_received, note_added, document_uploaded, team_updated, specification_changed, status_changed, field_updated
      project.activities.push({
        action: 'status_changed',
        description: 'Project completed successfully',
        performedBy: seedResult.users[0]._id,
        performedByName: 'Admin',
        oldValue: 'active',
        newValue: 'completed'
      })
      await project.save()

      const completedProject = await Project.findById(project._id)
      expect(completedProject.status).toBe('completed')
      expect(completedProject.stage).toBe('closure')
    })
  })

  describe('Sales Order Management', () => {
    it('should create sales order for project', async () => {
      const { company, admin, customer, project, lead } = o2cScenario

      const salesOrder = await SalesOrder.create({
        company: company._id,
        lead: lead._id,
        customer: customer._id,
        project: project._id,
        salesPerson: admin._id,
        title: 'Complete Interior Design Package',
        category: 'interior',
        createdBy: admin._id,
        status: 'draft',
        boq: [
          {
            description: 'Living Room Complete Interior',
            quantity: 1,
            unitRate: 500000,
            unit: 'sqft'
          },
          {
            description: 'Modular Kitchen',
            quantity: 1,
            unitRate: 300000,
            unit: 'sqft'
          }
        ]
      })

      expect(salesOrder).toBeDefined()
      expect(salesOrder.project.toString()).toBe(project._id.toString())
      expect(salesOrder.boq.length).toBe(2)
    })

    it('should approve sales order', async () => {
      const { company, admin, customer, project, lead } = o2cScenario

      const salesOrder = await SalesOrder.create({
        company: company._id,
        lead: lead._id,
        customer: customer._id,
        project: project._id,
        salesPerson: admin._id,
        title: 'Full Interior Package',
        category: 'interior',
        createdBy: admin._id,
        status: 'pending_review',
        boq: [
          {
            description: 'Full Interior Package',
            quantity: 1,
            unitRate: 1000000,
            unit: 'lot'
          }
        ]
      })

      // Approve
      salesOrder.status = 'approved'
      salesOrder.costEstimation = salesOrder.costEstimation || {}
      salesOrder.costEstimation.isApproved = true
      salesOrder.costEstimation.approvedBy = admin._id
      salesOrder.costEstimation.approvedAt = new Date()
      await salesOrder.save()

      const approvedSO = await SalesOrder.findById(salesOrder._id)
      expect(approvedSO.status).toBe('approved')
    })

    it('should track sales order line item details', async () => {
      const { company, admin, customer, project, lead } = o2cScenario

      const salesOrder = await SalesOrder.create({
        company: company._id,
        lead: lead._id,
        customer: customer._id,
        project: project._id,
        salesPerson: admin._id,
        title: 'Bedroom Interior Package',
        category: 'interior',
        createdBy: admin._id,
        status: 'draft',
        boq: [
          {
            description: 'Bedroom Furniture Set',
            quantity: 2,
            unitRate: 150000,
            unit: 'set'
          },
          {
            description: 'Wardrobe Custom',
            quantity: 3,
            unitRate: 80000,
            unit: 'nos'
          }
        ]
      })

      // Calculate totals from boq
      const subtotal = salesOrder.boq.reduce((sum, item) => {
        return sum + (item.quantity * item.unitRate)
      }, 0)

      expect(subtotal).toBe(540000) // 2*150000 + 3*80000
    })
  })

  describe('Customer Invoice Management', () => {
    let salesOrder

    beforeEach(async () => {
      const { company, admin, customer, project, lead } = o2cScenario

      salesOrder = await SalesOrder.create({
        company: company._id,
        lead: lead._id,
        customer: customer._id,
        project: project._id,
        salesPerson: admin._id,
        title: 'Interior Package',
        category: 'interior',
        createdBy: admin._id,
        status: 'approved',
        boq: [
          {
            description: 'Interior Package',
            quantity: 1,
            unitRate: 500000,
            unit: 'lot'
          }
        ]
      })
    })

    it('should create customer invoice from sales order', async () => {
      const { company, admin, customer, project } = o2cScenario

      const invoice = await CustomerInvoice.create({
        company: company._id,
        customer: customer._id,
        project: project._id,
        salesOrder: salesOrder._id,
        createdBy: admin._id,
        invoiceType: 'tax_invoice',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'draft',
        lineItems: salesOrder.boq.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitRate,
          unit: item.unit
        }))
      })

      expect(invoice).toBeDefined()
      expect(invoice.salesOrder.toString()).toBe(salesOrder._id.toString())
    })

    it('should create advance invoice (proforma)', async () => {
      const { company, admin, customer, project } = o2cScenario

      const invoice = await CustomerInvoice.create({
        company: company._id,
        customer: customer._id,
        project: project._id,
        createdBy: admin._id,
        invoiceType: 'proforma',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'draft',
        lineItems: [
          {
            description: 'Advance Payment - 30% of Project Value',
            quantity: 1,
            unitPrice: 150000,
            unit: 'payment'
          }
        ]
      })

      expect(invoice).toBeDefined()
      expect(invoice.invoiceType).toBe('proforma')
    })

    it('should send invoice to customer', async () => {
      const { company, admin, customer, project } = o2cScenario

      const invoice = await CustomerInvoice.create({
        company: company._id,
        customer: customer._id,
        project: project._id,
        createdBy: admin._id,
        invoiceType: 'tax_invoice',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'draft',
        lineItems: [
          {
            description: 'Service Charge',
            quantity: 1,
            unitPrice: 100000,
            unit: 'lumpsum'
          }
        ]
      })

      // Send invoice
      invoice.status = 'sent'
      invoice.sentAt = new Date()
      invoice.activities = invoice.activities || []
      invoice.activities.push({
        action: 'sent',
        description: 'Invoice sent to customer',
        performedBy: admin._id,
        performedByName: admin.name
      })
      await invoice.save()

      const sentInvoice = await CustomerInvoice.findById(invoice._id)
      expect(sentInvoice.status).toBe('sent')
      expect(sentInvoice.sentAt).toBeDefined()
    })

    it('should track invoice aging', async () => {
      const { company, admin, customer, project } = o2cScenario

      // Create overdue invoice (pre-save hook will recalculate paymentStatus based on dueDate)
      const overdueInvoice = await CustomerInvoice.create({
        company: company._id,
        customer: customer._id,
        project: project._id,
        createdBy: admin._id,
        invoiceType: 'tax_invoice',
        invoiceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days overdue
        status: 'sent',
        lineItems: [
          {
            description: 'Overdue Payment',
            quantity: 1,
            unitPrice: 200000,
            unit: 'lumpsum'
          }
        ]
      })

      // Verify the overdue invoice was created with correct overdue status
      expect(overdueInvoice).toBeDefined()
      // Pre-save hook sets paymentStatus to 'overdue' if dueDate < now and paidAmount = 0
      expect(['unpaid', 'overdue']).toContain(overdueInvoice.paymentStatus)

      // Check overdue invoices
      const overdueInvoices = await CustomerInvoice.find({
        company: company._id,
        paymentStatus: { $in: ['unpaid', 'partially_paid', 'overdue'] },
        dueDate: { $lt: new Date() }
      })

      expect(overdueInvoices.length).toBeGreaterThan(0)
      expect(overdueInvoices.some(i => i._id.equals(overdueInvoice._id))).toBe(true)
    })
  })

  describe('Payment Collection', () => {
    let customerInvoice

    beforeEach(async () => {
      const { company, admin, customer, project } = o2cScenario

      customerInvoice = await CustomerInvoice.create({
        company: company._id,
        customer: customer._id,
        project: project._id,
        createdBy: admin._id,
        invoiceType: 'tax_invoice',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'sent',
        paymentStatus: 'unpaid',
        lineItems: [
          {
            description: 'Interior Work - Phase 1',
            quantity: 1,
            unitPrice: 200000,
            unit: 'lumpsum'
          }
        ]
      })
    })

    it('should record customer payment', async () => {
      const { company, admin, customer, project } = o2cScenario

      const payment = await Payment.create({
        company: company._id,
        paymentNumber: generatePaymentNumber(),
        paymentType: 'incoming',
        customer: customer._id,
        customerInvoice: customerInvoice._id,
        project: project._id,
        paymentDate: new Date(),
        amount: 200000,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'NEFT-123456',
        status: 'completed',
        createdBy: admin._id,
        processedBy: admin._id,
        processedAt: new Date()
      })

      expect(payment).toBeDefined()
      expect(payment.paymentType).toBe('incoming')
      expect(payment.amount).toBe(200000)
    })

    it('should handle partial payment', async () => {
      const { company, admin, customer, project } = o2cScenario

      // First partial payment in separate Payment collection
      await Payment.create({
        company: company._id,
        paymentNumber: generatePaymentNumber(),
        paymentType: 'incoming',
        customer: customer._id,
        customerInvoice: customerInvoice._id,
        project: project._id,
        paymentDate: new Date(),
        amount: 100000,
        paymentMethod: 'cheque',
        status: 'completed',
        createdBy: admin._id
      })

      // Add payment to invoice's embedded payments array (which triggers pre-save hook to calculate paidAmount)
      customerInvoice.payments.push({
        paymentDate: new Date(),
        amount: 100000,
        paymentMethod: 'cheque',
        referenceNumber: 'CHQ-001',
        recordedBy: admin._id
      })
      await customerInvoice.save()

      const partialInvoice = await CustomerInvoice.findById(customerInvoice._id)
      expect(partialInvoice.paymentStatus).toBe('partially_paid')
      expect(partialInvoice.paidAmount).toBe(100000)
    })

    it('should mark invoice as paid after full payment', async () => {
      const { company, admin, customer, project } = o2cScenario

      // Full payment
      await Payment.create({
        company: company._id,
        paymentNumber: generatePaymentNumber(),
        paymentType: 'incoming',
        customer: customer._id,
        customerInvoice: customerInvoice._id,
        project: project._id,
        paymentDate: new Date(),
        amount: 200000,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        createdBy: admin._id
      })

      // Update invoice
      customerInvoice.paymentStatus = 'paid'
      customerInvoice.paidAmount = 200000
      customerInvoice.activities = customerInvoice.activities || []
      customerInvoice.activities.push({
        action: 'payment_recorded',
        description: 'Full payment received',
        performedBy: admin._id
      })
      await customerInvoice.save()

      const paidInvoice = await CustomerInvoice.findById(customerInvoice._id)
      expect(paidInvoice.paymentStatus).toBe('paid')
    })

    it('should support multiple payment methods', async () => {
      const { company, admin, customer, project } = o2cScenario
      const paymentMethods = ['cash', 'cheque', 'bank_transfer', 'upi', 'card']

      for (const method of paymentMethods) {
        const payment = await Payment.create({
          company: company._id,
          paymentNumber: generatePaymentNumber(),
          paymentType: 'incoming',
          customer: customer._id,
          project: project._id,
          paymentDate: new Date(),
          amount: 10000,
          paymentMethod: method,
          status: 'completed',
          createdBy: admin._id
        })

        expect(payment.paymentMethod).toBe(method)
      }

      const allPayments = await Payment.find({
        company: company._id,
        customer: customer._id
      })

      expect(allPayments.length).toBe(paymentMethods.length)
    })
  })

  describe('Revenue & Customer Analytics', () => {
    it('should calculate total revenue from customer', async () => {
      const { company, customer } = o2cScenario

      // Create multiple paid invoices with embedded payments
      // Set taxRate: 0 so invoiceTotal = unitPrice, and payment covers full amount
      for (let i = 0; i < 3; i++) {
        await CustomerInvoice.create({
          company: company._id,
          customer: customer._id,
          createdBy: seedResult.users[0]._id,
          invoiceType: 'tax_invoice',
          invoiceDate: new Date(),
          dueDate: new Date(),
          status: 'sent',
          lineItems: [
            {
              description: `Service ${i + 1}`,
              quantity: 1,
              unitPrice: 100000,
              unit: 'lumpsum',
              taxRate: 0 // No tax so payment covers full invoice total
            }
          ],
          // Add embedded payment matching the invoice total
          payments: [
            {
              paymentDate: new Date(),
              amount: 100000,
              paymentMethod: 'bank_transfer',
              referenceNumber: `REF-${i + 1}`
            }
          ]
        })
      }

      // Aggregate revenue
      const revenueData = await CustomerInvoice.aggregate([
        {
          $match: {
            company: company._id,
            customer: customer._id,
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: '$customer',
            totalRevenue: { $sum: '$paidAmount' },
            invoiceCount: { $sum: 1 }
          }
        }
      ])

      expect(revenueData.length).toBe(1)
      expect(revenueData[0].totalRevenue).toBe(300000)
      expect(revenueData[0].invoiceCount).toBe(3)
    })

    it('should track customer lifetime value', async () => {
      const customer = seedResult.customers[0]

      // Calculate CLV from payments
      const payments = await Payment.aggregate([
        {
          $match: {
            company: seedResult.company._id,
            customer: customer._id,
            paymentType: 'incoming',
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$customer',
            lifetimeValue: { $sum: '$amount' }
          }
        }
      ])

      // Update customer record
      if (payments.length > 0) {
        customer.totalRevenue = payments[0].lifetimeValue
        await customer.save()
      }
    })
  })

  describe('Complete O2C Cycle', () => {
    it('should execute full O2C cycle from Lead to Payment', async () => {
      const { company } = o2cScenario
      const admin = seedResult.users[0]

      // Step 1: Create Lead
      const lead = await Lead.create({
        name: 'Full Cycle Customer',
        email: 'fullcycle@example.com',
        phone: '+91 98765 99999',
        company: company._id,
        status: 'new',
        source: 'website',
        assignedTo: admin._id,
        createdBy: admin._id,
        estimatedValue: 800000,
        projectType: 'residential'
      })
      expect(lead.status).toBe('new')

      // Step 2: Progress Lead
      lead.status = 'qualified'
      await lead.save()

      lead.status = 'proposal_sent'
      await lead.save()

      lead.status = 'won'
      lead.conversionDate = new Date()
      await lead.save()

      // Step 3: Convert to Customer (Customer uses 'originalLead' not 'convertedFromLead')
      const customer = await Customer.create({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: company._id,
        originalLead: lead._id,
        type: 'individual',
        segment: 'new',
        status: 'active',
        convertedAt: new Date(),
        convertedBy: admin._id
      })

      lead.customer = customer._id
      lead.isConverted = true
      lead.convertedAt = new Date()
      await lead.save()
      expect(customer).toBeDefined()

      // Step 4: Create Project
      const project = await Project.create({
        title: 'Complete Home Interior',
        company: company._id,
        customer: customer._id,
        category: 'interior',
        subCategory: 'residential',
        status: 'active',
        stage: 'initiation',
        projectManager: admin._id,
        createdBy: admin._id,
        timeline: {
          estimatedStartDate: new Date(),
          estimatedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        },
        financials: {
          quotedAmount: 800000
        }
      })
      expect(project.status).toBe('active')

      // Step 5: Create Sales Order
      const salesOrder = await SalesOrder.create({
        company: company._id,
        lead: lead._id,
        customer: customer._id,
        project: project._id,
        salesPerson: admin._id,
        title: 'Complete Interior Package',
        category: 'interior',
        createdBy: admin._id,
        status: 'draft',
        boq: [
          {
            description: 'Complete Interior Package',
            quantity: 1,
            unitRate: 800000,
            unit: 'lot'
          }
        ]
      })

      // Approve Sales Order
      salesOrder.status = 'approved'
      salesOrder.costEstimation = salesOrder.costEstimation || {}
      salesOrder.costEstimation.isApproved = true
      salesOrder.costEstimation.approvedBy = admin._id
      salesOrder.costEstimation.approvedAt = new Date()
      await salesOrder.save()
      expect(salesOrder.status).toBe('approved')

      // Step 6: Create Invoice
      const invoice = await CustomerInvoice.create({
        company: company._id,
        customer: customer._id,
        project: project._id,
        salesOrder: salesOrder._id,
        createdBy: admin._id,
        invoiceType: 'tax_invoice',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'draft',
        lineItems: [
          {
            description: 'Complete Interior Package',
            quantity: 1,
            unitPrice: 800000,
            unit: 'package'
          }
        ]
      })

      // Send Invoice
      invoice.status = 'sent'
      invoice.sentAt = new Date()
      await invoice.save()
      expect(invoice.status).toBe('sent')

      // Step 7: Record Payment
      const payment = await Payment.create({
        company: company._id,
        paymentNumber: generatePaymentNumber(),
        paymentType: 'incoming',
        customer: customer._id,
        customerInvoice: invoice._id,
        project: project._id,
        paymentDate: new Date(),
        amount: 800000,
        paymentMethod: 'bank_transfer',
        status: 'completed',
        createdBy: admin._id
      })
      expect(payment.status).toBe('completed')

      // Step 8: Update Invoice Payment Status
      invoice.paymentStatus = 'paid'
      invoice.paidAmount = 800000
      await invoice.save()

      // Step 9: Complete Project
      project.stage = 'closure'
      project.status = 'completed'
      project.actualEndDate = new Date()
      await project.save()

      // Verify final states
      const finalLead = await Lead.findById(lead._id)
      const finalCustomer = await Customer.findById(customer._id)
      const finalProject = await Project.findById(project._id)
      const finalInvoice = await CustomerInvoice.findById(invoice._id)

      expect(finalLead.status).toBe('won')
      expect(finalLead.customer.toString()).toBe(customer._id.toString())
      expect(finalCustomer.status).toBe('active')
      expect(finalProject.status).toBe('completed')
      expect(finalInvoice.paymentStatus).toBe('paid')
    })
  })
})
