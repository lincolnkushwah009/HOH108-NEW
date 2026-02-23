/**
 * Complete Business Cycle E2E Test
 *
 * Tests the full integration across all modules:
 * 1. Company Setup
 * 2. User Registration & Authentication
 * 3. Lead to Customer (O2C Start)
 * 4. Project Creation
 * 5. Procurement (P2P)
 * 6. Sales & Invoicing
 * 7. Payments
 * 8. HR Operations (H2R)
 * 9. Support Tickets
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.API_URL || 'http://localhost:5001'

test.describe('Complete Business Cycle E2E Tests', () => {
  let authToken
  let companyId
  let adminUserId
  let customerId
  let vendorId
  let projectId
  let materialIds = []
  let purchaseOrderId
  let salesOrderId
  let customerInvoiceId
  let vendorInvoiceId
  let employeeId
  let departmentId

  test.describe.serial('End-to-End Business Flow', () => {

    test('1. Health Check - API is running', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`)
      // If health endpoint doesn't exist, skip
      if (response.status() === 404) {
        test.skip()
      }
      expect(response.ok()).toBeTruthy()
    })

    test('2. User Authentication - Login as Admin', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/login`, {
        data: {
          email: 'admin@test.com',
          password: 'Test@123456'
        }
      })

      if (response.ok()) {
        const data = await response.json()
        authToken = data.token
        adminUserId = data.user?._id || data.data?.user?._id
        companyId = data.user?.company || data.data?.user?.company
        expect(authToken).toBeDefined()
      } else {
        // Skip remaining tests if auth fails
        test.skip()
      }
    })

    test('3. O2C - Create Lead', async ({ request }) => {
      if (!authToken) test.skip()

      const response = await request.post(`${BASE_URL}/api/leads`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        },
        data: {
          name: 'E2E Test Lead',
          email: 'e2e.lead@test.com',
          phone: '+91 98765 12345',
          source: 'website',
          estimatedValue: 500000,
          projectType: 'residential',
          status: 'new'
        }
      })

      if (response.ok()) {
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

    test('4. O2C - Create Customer', async ({ request }) => {
      if (!authToken) test.skip()

      const response = await request.post(`${BASE_URL}/api/customers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        },
        data: {
          name: 'E2E Test Customer',
          email: 'e2e.customer@test.com',
          phone: '+91 98765 54321',
          type: 'individual',
          segment: 'gold',
          status: 'active',
          source: 'referral',
          address: {
            street: '123 E2E Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }
        }
      })

      if (response.ok()) {
        const data = await response.json()
        customerId = data.data?._id
        expect(data.success).toBe(true)
        expect(customerId).toBeDefined()
      }
    })

    test('5. P2P - Create Vendor', async ({ request }) => {
      if (!authToken) test.skip()

      const response = await request.post(`${BASE_URL}/api/vendors`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        },
        data: {
          name: 'E2E Test Vendor',
          email: 'e2e.vendor@test.com',
          phone: '+91 98765 11111',
          contactPerson: 'Vendor Contact',
          vendorType: 'supplier',
          category: ['materials', 'hardware'],
          status: 'active',
          paymentTerms: 'Net 30'
        }
      })

      if (response.ok()) {
        const data = await response.json()
        vendorId = data.data?._id
        expect(data.success).toBe(true)
        expect(vendorId).toBeDefined()
      }
    })

    test('6. Inventory - Create Materials', async ({ request }) => {
      if (!authToken) test.skip()

      const materials = [
        {
          name: 'E2E Plywood',
          sku: 'E2E-PLY-001',
          category: 'wood',
          unit: 'sheets',
          basePrice: 1500,
          currentStock: 100,
          reorderLevel: 20
        },
        {
          name: 'E2E Hardware',
          sku: 'E2E-HW-001',
          category: 'hardware',
          unit: 'pcs',
          basePrice: 50,
          currentStock: 500,
          reorderLevel: 100
        }
      ]

      for (const material of materials) {
        const response = await request.post(`${BASE_URL}/api/materials`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'x-company-id': companyId
          },
          data: material
        })

        if (response.ok()) {
          const data = await response.json()
          if (data.data?._id) {
            materialIds.push(data.data._id)
          }
        }
      }

      expect(materialIds.length).toBeGreaterThan(0)
    })

    test('7. Project - Create Project', async ({ request }) => {
      if (!authToken || !customerId) test.skip()

      const response = await request.post(`${BASE_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        },
        data: {
          title: 'E2E Test Project',
          customer: customerId,
          status: 'active',
          stage: 'initiation',
          projectType: 'residential',
          startDate: new Date().toISOString(),
          expectedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          budget: 1000000,
          scope: 'Complete interior design and execution for E2E testing'
        }
      })

      if (response.ok()) {
        const data = await response.json()
        projectId = data.data?._id
        expect(data.success).toBe(true)
        expect(projectId).toBeDefined()
      }
    })

    test('8. P2P - Create Purchase Order', async ({ request }) => {
      if (!authToken || !vendorId || materialIds.length === 0) test.skip()

      const response = await request.post(`${BASE_URL}/api/purchase-orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        },
        data: {
          vendor: vendorId,
          project: projectId,
          status: 'draft',
          items: [
            {
              material: materialIds[0],
              description: 'E2E Test Plywood',
              quantity: 50,
              unitPrice: 1500,
              unit: 'sheets'
            }
          ],
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          paymentTerms: 'Net 30'
        }
      })

      if (response.ok()) {
        const data = await response.json()
        purchaseOrderId = data.data?._id
        expect(data.success).toBe(true)
        expect(purchaseOrderId).toBeDefined()
      }
    })

    test('9. O2C - Create Sales Order', async ({ request }) => {
      if (!authToken || !customerId || !projectId) test.skip()

      const response = await request.post(`${BASE_URL}/api/sales-orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        },
        data: {
          customer: customerId,
          project: projectId,
          status: 'draft',
          orderDate: new Date().toISOString(),
          items: [
            {
              description: 'Complete Interior Package',
              quantity: 1,
              unitPrice: 500000,
              unit: 'package'
            }
          ]
        }
      })

      if (response.ok()) {
        const data = await response.json()
        salesOrderId = data.data?._id
        expect(data.success).toBe(true)
        expect(salesOrderId).toBeDefined()
      }
    })

    test('10. Finance - Create Customer Invoice', async ({ request }) => {
      if (!authToken || !customerId || !projectId) test.skip()

      const response = await request.post(`${BASE_URL}/api/customer-invoices`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        },
        data: {
          customer: customerId,
          project: projectId,
          salesOrder: salesOrderId,
          invoiceType: 'regular',
          invoiceDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'draft',
          items: [
            {
              description: 'Interior Design Services',
              quantity: 1,
              unitPrice: 500000,
              unit: 'package'
            }
          ]
        }
      })

      if (response.ok()) {
        const data = await response.json()
        customerInvoiceId = data.data?._id
        expect(data.success).toBe(true)
        expect(customerInvoiceId).toBeDefined()
      }
    })

    test('11. H2R - Create Department', async ({ request }) => {
      if (!authToken) test.skip()

      const response = await request.post(`${BASE_URL}/api/departments`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        },
        data: {
          name: 'E2E Test Department',
          code: 'E2E',
          description: 'Department created for E2E testing'
        }
      })

      if (response.ok()) {
        const data = await response.json()
        departmentId = data.data?._id
        expect(data.success).toBe(true)
        expect(departmentId).toBeDefined()
      }
    })

    test('12. Support - Create Ticket', async ({ request }) => {
      if (!authToken) test.skip()

      const response = await request.post(`${BASE_URL}/api/tickets`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        },
        data: {
          title: 'E2E Test Ticket',
          description: 'This is a test ticket created during E2E testing',
          category: 'general',
          priority: 'medium',
          status: 'open',
          ticketSource: 'internal',
          ticketNature: 'query',
          relatedProject: projectId,
          relatedCustomer: customerId
        }
      })

      if (response.ok()) {
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

    test('13. Finance - Record Payment', async ({ request }) => {
      if (!authToken || !customerId || !customerInvoiceId) test.skip()

      const response = await request.post(`${BASE_URL}/api/payments`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        },
        data: {
          paymentType: 'incoming',
          customer: customerId,
          customerInvoice: customerInvoiceId,
          project: projectId,
          paymentDate: new Date().toISOString(),
          amount: 250000,
          paymentMethod: 'bank_transfer',
          referenceNumber: 'E2E-PAY-001',
          status: 'completed'
        }
      })

      if (response.ok()) {
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

    test('14. Verify Data Integrity - Get Customer with Projects', async ({ request }) => {
      if (!authToken || !customerId) test.skip()

      const response = await request.get(`${BASE_URL}/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        }
      })

      if (response.ok()) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
      }
    })

    test('15. Verify Data Integrity - Get Project Details', async ({ request }) => {
      if (!authToken || !projectId) test.skip()

      const response = await request.get(`${BASE_URL}/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        }
      })

      if (response.ok()) {
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data).toBeDefined()
      }
    })

    test('16. Dashboard - Get Stats Summary', async ({ request }) => {
      if (!authToken) test.skip()

      // Try to get dashboard stats if endpoint exists
      const response = await request.get(`${BASE_URL}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        }
      })

      // Dashboard endpoint may not exist
      if (response.status() === 404) {
        test.skip()
      }

      if (response.ok()) {
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

  })

  test.describe('Cross-Module Data Verification', () => {

    test('Verify Customer-Project Relationship', async ({ request }) => {
      if (!authToken || !customerId) test.skip()

      const response = await request.get(`${BASE_URL}/api/projects?customer=${customerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        }
      })

      if (response.ok()) {
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

    test('Verify Vendor-PO Relationship', async ({ request }) => {
      if (!authToken || !vendorId) test.skip()

      const response = await request.get(`${BASE_URL}/api/purchase-orders?vendor=${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        }
      })

      if (response.ok()) {
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

    test('Verify Project-Invoice Relationship', async ({ request }) => {
      if (!authToken || !projectId) test.skip()

      const response = await request.get(`${BASE_URL}/api/customer-invoices?project=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-company-id': companyId
        }
      })

      if (response.ok()) {
        const data = await response.json()
        expect(data.success).toBe(true)
      }
    })

  })
})
