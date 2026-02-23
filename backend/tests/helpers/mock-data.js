import { faker } from '@faker-js/faker'
import mongoose from 'mongoose'

/**
 * Generate a valid MongoDB ObjectId
 */
export const generateObjectId = () => new mongoose.Types.ObjectId()

/**
 * Generate mock company data
 */
export const generateCompany = (overrides = {}) => ({
  code: faker.string.alphanumeric(3).toUpperCase(),
  name: faker.company.name(),
  type: 'mother',
  email: faker.internet.email(),
  phone: faker.phone.number(),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    pincode: faker.location.zipCode(),
    country: 'India'
  },
  services: ['Interior Design', 'Construction'],
  defaultCurrency: 'INR',
  isActive: true,
  ...overrides
})

/**
 * Generate mock user data
 */
export const generateUser = (companyId, overrides = {}) => ({
  email: faker.internet.email(),
  password: 'Test@123456',
  name: faker.person.fullName(),
  phone: faker.phone.number(),
  role: 'company_admin',
  company: companyId,
  companies: [{ company: companyId, role: 'company_admin', isDefault: true }],
  isActive: true,
  isEmailVerified: true,
  ...overrides
})

/**
 * Generate mock customer data
 */
export const generateCustomer = (companyId, overrides = {}) => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  company: companyId,
  type: 'individual',
  segment: 'new',
  status: 'active',
  source: 'referral',
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    pincode: faker.location.zipCode(),
    country: 'India'
  },
  ...overrides
})

/**
 * Generate mock vendor data
 */
export const generateVendor = (companyId, overrides = {}) => ({
  name: faker.company.name(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  company: companyId,
  vendorId: `VEN-${faker.string.alphanumeric(4).toUpperCase()}`,
  contactPerson: {
    name: faker.person.fullName(),
    designation: 'Sales Manager'
  },
  category: 'material_supplier',
  specialization: ['materials'],
  status: 'active',
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    pincode: faker.location.zipCode(),
    country: 'India'
  },
  paymentTerms: 'net_30',
  ...overrides
})

/**
 * Generate mock lead data
 */
export const generateLead = (companyId, userId, overrides = {}) => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  phone: faker.phone.number(),
  company: companyId,
  status: 'new',
  source: 'website',
  assignedTo: userId,
  createdBy: userId,
  estimatedValue: faker.number.int({ min: 100000, max: 1000000 }),
  projectType: 'residential',
  address: {
    city: faker.location.city(),
    state: faker.location.state()
  },
  ...overrides
})

/**
 * Generate mock project data
 */
export const generateProject = (companyId, customerId, userId, overrides = {}) => ({
  title: faker.commerce.productName() + ' Interior Project',
  company: companyId,
  customer: customerId,
  status: 'active',
  stage: 'initiation',
  category: 'interior',
  subCategory: 'residential',
  projectManager: userId,
  createdBy: userId,
  timeline: {
    estimatedStartDate: new Date(),
    estimatedEndDate: faker.date.future()
  },
  financials: {
    quotedAmount: faker.number.int({ min: 500000, max: 5000000 })
  },
  description: faker.lorem.paragraph(),
  location: {
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    pincode: faker.location.zipCode()
  },
  ...overrides
})

/**
 * Generate mock material data
 */
export const generateMaterial = (companyId, overrides = {}) => ({
  materialName: faker.commerce.productName(),
  company: companyId,
  skuCode: faker.string.alphanumeric(8).toUpperCase(),
  category: 'hardware',
  unit: 'pcs',
  unitPrice: faker.number.int({ min: 100, max: 10000 }),
  defaultReorderLevel: 10,
  isActive: true,
  ...overrides
})

/**
 * Generate mock purchase order data
 */
export const generatePurchaseOrder = (companyId, vendorId, userId, lineItems = [], overrides = {}) => ({
  company: companyId,
  vendor: vendorId,
  createdBy: userId,
  status: 'draft',
  // poNumber will be auto-generated in pre-save hook
  lineItems: lineItems.length > 0 ? lineItems : [
    {
      description: faker.commerce.productName(),
      quantity: faker.number.int({ min: 1, max: 100 }),
      unitPrice: faker.number.int({ min: 100, max: 5000 }),
      unit: 'pcs'
    }
  ],
  expectedDeliveryDate: faker.date.future(),
  paymentTerms: 'net_30',
  internalNotes: faker.lorem.sentence(),
  ...overrides
})

/**
 * Generate mock sales order data
 */
export const generateSalesOrder = (companyId, customerId, projectId, userId, overrides = {}) => ({
  company: companyId,
  customer: customerId,
  project: projectId,
  createdBy: userId,
  status: 'draft',
  orderDate: new Date(),
  items: [
    {
      description: faker.commerce.productName(),
      quantity: faker.number.int({ min: 1, max: 10 }),
      unitPrice: faker.number.int({ min: 1000, max: 50000 }),
      unit: 'pcs'
    }
  ],
  ...overrides
})

/**
 * Generate mock vendor invoice data
 */
export const generateVendorInvoice = (companyId, vendorId, poId, userId, overrides = {}) => ({
  company: companyId,
  vendor: vendorId,
  purchaseOrder: poId,
  createdBy: userId,
  invoiceNumber: faker.string.alphanumeric(10).toUpperCase(),
  invoiceDate: new Date(),
  dueDate: faker.date.future(),
  status: 'pending',
  items: [
    {
      description: faker.commerce.productName(),
      quantity: faker.number.int({ min: 1, max: 100 }),
      unitPrice: faker.number.int({ min: 100, max: 5000 }),
      unit: 'pcs'
    }
  ],
  ...overrides
})

/**
 * Generate mock customer invoice data
 */
export const generateCustomerInvoice = (companyId, customerId, projectId, userId, overrides = {}) => ({
  company: companyId,
  customer: customerId,
  project: projectId,
  createdBy: userId,
  invoiceType: 'tax_invoice', // enum: ['proforma', 'tax_invoice', 'credit_note', 'debit_note']
  invoiceDate: new Date(),
  dueDate: faker.date.future(),
  status: 'draft',
  lineItems: [
    {
      description: faker.commerce.productName(),
      quantity: faker.number.int({ min: 1, max: 10 }),
      unitPrice: faker.number.int({ min: 1000, max: 50000 }),
      unit: 'pcs'
    }
  ],
  ...overrides
})

/**
 * Generate mock employee data
 */
export const generateEmployee = (companyId, userId, departmentId, overrides = {}) => ({
  company: companyId,
  user: userId,
  department: departmentId,
  employmentType: 'full-time',
  designation: faker.person.jobTitle(),
  dateOfJoining: faker.date.past(),
  status: 'active',
  salary: {
    basic: faker.number.int({ min: 30000, max: 100000 }),
    allowances: faker.number.int({ min: 5000, max: 20000 })
  },
  ...overrides
})

/**
 * Generate mock department data
 */
export const generateDepartment = (companyId, overrides = {}) => ({
  name: faker.commerce.department(),
  company: companyId,
  code: faker.string.alphanumeric(4).toUpperCase(),
  description: faker.lorem.sentence(),
  isActive: true,
  ...overrides
})

/**
 * Generate mock leave request data
 */
export const generateLeaveRequest = (companyId, userId, overrides = {}) => ({
  company: companyId,
  employee: userId,
  leaveType: 'casual',
  startDate: faker.date.future(),
  endDate: faker.date.future(),
  duration: { days: faker.number.int({ min: 1, max: 5 }) },
  reason: faker.lorem.sentence(),
  status: 'pending',
  ...overrides
})

/**
 * Generate mock attendance data
 */
export const generateAttendance = (companyId, userId, overrides = {}) => ({
  company: companyId,
  employee: userId,
  date: new Date(),
  checkIn: { time: new Date() },
  status: 'present',
  ...overrides
})

/**
 * Generate mock ticket data
 */
export const generateTicket = (companyId, userId, overrides = {}) => ({
  company: companyId,
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  category: 'general',
  priority: 'medium',
  status: 'open',
  reportedBy: userId,
  createdBy: userId,
  ticketSource: 'internal',
  ticketNature: 'issue',
  ...overrides
})

/**
 * Generate mock payment data
 */
export const generatePayment = (companyId, userId, overrides = {}) => ({
  company: companyId,
  paymentType: 'incoming',
  paymentDate: new Date(),
  amount: faker.number.int({ min: 10000, max: 500000 }),
  paymentMethod: 'bank_transfer',
  status: 'pending',
  createdBy: userId,
  ...overrides
})

/**
 * Generate mock GRN (Goods Receipt Note) data
 */
export const generateGRN = (companyId, vendorId, poId, userId, overrides = {}) => ({
  company: companyId,
  vendor: vendorId,
  purchaseOrder: poId,
  receivedBy: userId,
  createdBy: userId,
  receiptDate: new Date(),
  status: 'pending',
  items: [
    {
      material: generateObjectId(),
      orderedQuantity: 100,
      receivedQuantity: 100,
      acceptedQuantity: 100,
      rejectedQuantity: 0
    }
  ],
  ...overrides
})

/**
 * Generate mock stock movement data
 */
export const generateStockMovement = (companyId, materialId, userId, overrides = {}) => ({
  company: companyId,
  material: materialId,
  // movementNumber will be auto-generated in pre-save hook
  movementType: 'receipt', // enum: ['receipt', 'issue', 'transfer', 'adjustment', 'return']
  quantity: faker.number.int({ min: 1, max: 100 }),
  reason: 'Purchase receipt',
  reference: 'manual',
  createdBy: userId,
  ...overrides
})

export default {
  generateObjectId,
  generateCompany,
  generateUser,
  generateCustomer,
  generateVendor,
  generateLead,
  generateProject,
  generateMaterial,
  generatePurchaseOrder,
  generateSalesOrder,
  generateVendorInvoice,
  generateCustomerInvoice,
  generateEmployee,
  generateDepartment,
  generateLeaveRequest,
  generateAttendance,
  generateTicket,
  generatePayment,
  generateGRN,
  generateStockMovement
}
