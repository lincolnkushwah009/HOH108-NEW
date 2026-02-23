import Company from '../../models/Company.js'
import User from '../../models/User.js'
import Customer from '../../models/Customer.js'
import Vendor from '../../models/Vendor.js'
import Lead from '../../models/Lead.js'
import Project from '../../models/Project.js'
import Material from '../../models/Material.js'
import Department from '../../models/Department.js'
import Leave from '../../models/Leave.js'
import Attendance from '../../models/Attendance.js'
import { hashPassword } from '../helpers/auth-helper.js'

/**
 * Base seed data for testing
 */
export const seedData = {
  company: {
    code: 'TST',
    name: 'Test Company Pvt Ltd',
    type: 'mother',
    email: 'admin@testcompany.com',
    phone: '+91 98765 43210',
    address: {
      street: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India'
    },
    services: ['Interior Design', 'Construction', 'Consultation'],
    defaultCurrency: 'INR',
    isActive: true
  },

  users: [
    {
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'Test@123456',
      role: 'company_admin',
      phone: '+91 98765 00001'
    },
    {
      name: 'Manager User',
      email: 'manager@test.com',
      password: 'Test@123456',
      role: 'sales_manager',
      phone: '+91 98765 00002'
    },
    {
      name: 'Sales User',
      email: 'sales@test.com',
      password: 'Test@123456',
      role: 'sales_executive',
      phone: '+91 98765 00003'
    },
    {
      name: 'HR User',
      email: 'hr@test.com',
      password: 'Test@123456',
      role: 'operations',
      phone: '+91 98765 00004'
    },
    {
      name: 'Finance User',
      email: 'finance@test.com',
      password: 'Test@123456',
      role: 'finance',
      phone: '+91 98765 00005'
    }
  ],

  customers: [
    {
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      phone: '+91 98765 11111',
      type: 'individual',
      segment: 'gold',
      status: 'active',
      source: 'referral'
    },
    {
      name: 'Priya Sharma Interiors',
      email: 'priya.sharma@company.com',
      phone: '+91 98765 22222',
      type: 'business',
      segment: 'platinum',
      status: 'active',
      source: 'website'
    },
    {
      name: 'ABC Corporation',
      email: 'contact@abccorp.com',
      phone: '+91 98765 33333',
      type: 'business',
      segment: 'platinum',
      status: 'active',
      source: 'direct'
    }
  ],

  vendors: [
    {
      name: 'Supreme Materials Pvt Ltd',
      email: 'sales@supremematerials.com',
      phone: '+91 98765 44444',
      contactPerson: { name: 'Amit Patel', designation: 'Sales Manager' },
      category: 'material_supplier',
      specialization: ['materials', 'hardware'],
      status: 'active',
      paymentTerms: 'net_30'
    },
    {
      name: 'Quality Furnishings',
      email: 'orders@qualityfurnish.com',
      phone: '+91 98765 55555',
      contactPerson: { name: 'Sunil Shah', designation: 'Owner' },
      category: 'material_supplier',
      specialization: ['furniture', 'fixtures'],
      status: 'active',
      paymentTerms: 'net_15'
    },
    {
      name: 'Elite Contractors',
      email: 'info@elitecontractors.com',
      phone: '+91 98765 66666',
      contactPerson: { name: 'Ravi Menon', designation: 'Director' },
      category: 'contractor',
      specialization: ['civil', 'electrical'],
      status: 'active',
      paymentTerms: 'custom',
      customPaymentTerms: 'Milestone based'
    }
  ],

  materials: [
    {
      materialName: 'Premium Plywood 18mm',
      skuCode: 'PLY-18-PREM',
      category: 'wood',
      unit: 'sheet',
      unitPrice: 1500,
      defaultReorderLevel: 20,
      isActive: true
    },
    {
      materialName: 'Stainless Steel Screws 2inch',
      skuCode: 'SCR-SS-2IN',
      category: 'hardware',
      unit: 'pcs',
      unitPrice: 5,
      defaultReorderLevel: 1000,
      isActive: true
    },
    {
      materialName: 'Premium Laminate Sheet',
      skuCode: 'LAM-PREM-01',
      category: 'other',
      unit: 'sheet',
      unitPrice: 800,
      defaultReorderLevel: 50,
      isActive: true
    },
    {
      materialName: 'Soft Close Hinge',
      skuCode: 'HNG-SC-01',
      category: 'hardware',
      unit: 'pcs',
      unitPrice: 150,
      defaultReorderLevel: 50,
      isActive: true
    },
    {
      materialName: 'LED Strip Light 5m',
      skuCode: 'LED-STRP-5M',
      category: 'electrical',
      unit: 'pcs',
      unitPrice: 500,
      defaultReorderLevel: 10,
      isActive: true
    }
  ],

  departments: [
    {
      name: 'Design',
      code: 'DES',
      description: 'Interior Design Team'
    },
    {
      name: 'Sales',
      code: 'SAL',
      description: 'Sales and Business Development'
    },
    {
      name: 'Operations',
      code: 'OPS',
      description: 'Project Operations and Execution'
    },
    {
      name: 'Finance',
      code: 'FIN',
      description: 'Finance and Accounts'
    },
    {
      name: 'HR',
      code: 'HRD',
      description: 'Human Resources'
    }
  ]
}

/**
 * Seed the database with test data
 */
export const seedDatabase = async () => {
  const result = {
    company: null,
    users: [],
    customers: [],
    vendors: [],
    materials: [],
    departments: [],
    tokens: {}
  }

  // Create company
  result.company = await Company.create(seedData.company)

  // Create users
  for (const userData of seedData.users) {
    const hashedPwd = await hashPassword(userData.password)
    const user = await User.create({
      ...userData,
      password: hashedPwd,
      company: result.company._id,
      companies: [{
        company: result.company._id,
        role: userData.role,
        isDefault: true
      }],
      isActive: true,
      isVerified: true
    })
    result.users.push(user)
  }

  // Create customers
  for (const customerData of seedData.customers) {
    const customer = await Customer.create({
      ...customerData,
      company: result.company._id,
      createdBy: result.users[0]._id
    })
    result.customers.push(customer)
  }

  // Create vendors
  for (let i = 0; i < seedData.vendors.length; i++) {
    const vendorData = seedData.vendors[i]
    const vendor = await Vendor.create({
      ...vendorData,
      vendorId: `VEN-${String(i + 1).padStart(4, '0')}`,
      company: result.company._id,
      createdBy: result.users[0]._id
    })
    result.vendors.push(vendor)
  }

  // Create materials
  for (const materialData of seedData.materials) {
    const material = await Material.create({
      ...materialData,
      company: result.company._id,
      createdBy: result.users[0]._id
    })
    result.materials.push(material)
  }

  // Create departments
  for (const deptData of seedData.departments) {
    const department = await Department.create({
      ...deptData,
      company: result.company._id,
      createdBy: result.users[0]._id
    })
    result.departments.push(department)
  }

  return result
}

/**
 * Create a complete P2P test scenario
 */
export const createP2PScenario = async (seedResult) => {
  const { company, users, vendors, materials } = seedResult

  return {
    company,
    admin: users[0],
    vendor: vendors[0],
    materials: materials.slice(0, 3),
    // lineItems schema: { description (required), quantity (required), unitPrice (required), unit, itemCode, category }
    lineItems: materials.slice(0, 3).map((mat, i) => ({
      itemCode: mat.skuCode,
      description: mat.materialName,
      quantity: (i + 1) * 10,
      unitPrice: mat.unitPrice || 1000,
      unit: 'pcs'
    }))
  }
}

/**
 * Create a complete O2C test scenario
 */
export const createO2CScenario = async (seedResult) => {
  const { company, users, customers } = seedResult

  // Create a lead first
  const lead = await Lead.create({
    name: 'Test Lead for Conversion',
    email: 'testlead@example.com',
    phone: '+91 98765 77777',
    company: company._id,
    status: 'new',
    source: 'website',
    assignedTo: users[0]._id,
    createdBy: users[0]._id,
    estimatedValue: 500000,
    projectType: 'residential'
  })

  // Create a project
  const project = await Project.create({
    title: 'Test Interior Project',
    company: company._id,
    customer: customers[0]._id,
    status: 'active',
    stage: 'initiation',
    category: 'interior',
    subCategory: 'residential',
    projectManager: users[0]._id,
    createdBy: users[0]._id,
    timeline: {
      estimatedStartDate: new Date(),
      estimatedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    },
    financials: {
      quotedAmount: 1000000
    },
    description: 'Complete home interior design and execution'
  })

  return {
    company,
    admin: users[0],
    customer: customers[0],
    lead,
    project
  }
}

/**
 * Create a complete H2R test scenario
 * Note: In this system, Users serve as employees with embedded salary/HR data
 */
export const createH2RScenario = async (seedResult) => {
  const { company, users, departments } = seedResult

  // Update users with salary information (Users act as employees)
  const employees = []
  for (let i = 1; i < users.length; i++) {
    const user = users[i]
    user.department = departments[i % departments.length].name
    user.designation = ['Manager', 'Executive', 'Senior Associate', 'Associate'][i - 1]
    user.salary = {
      basicSalary: 50000 + i * 10000,
      hra: 20000 + i * 4000,
      otherAllowances: 10000 + i * 2000,
      grossSalary: 80000 + i * 16000,
      netSalary: 65000 + i * 13000,
      ctc: 100000 + i * 20000,
      config: {
        epfoApplicable: true,
        esicApplicable: false,
        ptState: 'Maharashtra'
      }
    }
    await user.save()
    employees.push(user)
  }

  return {
    company,
    admin: users[0],
    users: users.slice(1),
    employees,
    departments
  }
}

export default {
  seedData,
  seedDatabase,
  createP2PScenario,
  createO2CScenario,
  createH2RScenario
}
