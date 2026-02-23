import mongoose from 'mongoose'

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  description: String,
  slaHours: {
    critical: { type: Number, default: 4 },
    high: { type: Number, default: 8 },
    medium: { type: Number, default: 24 },
    low: { type: Number, default: 48 }
  },
  isActive: { type: Boolean, default: true }
})

const ticketCategorySchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true
  },
  description: String,
  icon: String,
  color: {
    type: String,
    default: 'blue'
  },
  supportDepartment: {
    type: String,
    required: true,
    enum: ['IT', 'HRMS', 'Finance', 'Operations', 'Design', 'Sales', 'Marketing', 'Management', 'Admin']
  },
  defaultAssignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  approvalThreshold: {
    type: Number,
    default: 0
  },
  subCategories: [subCategorySchema],
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Compound index for unique category code per company
ticketCategorySchema.index({ company: 1, code: 1 }, { unique: true })

// Static method to get default categories
ticketCategorySchema.statics.getDefaultCategories = function() {
  return [
    {
      name: 'IT Support',
      code: 'IT_SUPPORT',
      description: 'Technical support for hardware, software, network, and IT infrastructure',
      icon: 'Monitor',
      color: 'blue',
      supportDepartment: 'IT',
      requiresApproval: false,
      sortOrder: 1,
      subCategories: [
        { name: 'Hardware Issue', code: 'HARDWARE', description: 'Laptop, desktop, monitor issues', slaHours: { critical: 2, high: 4, medium: 8, low: 24 } },
        { name: 'Software Issue', code: 'SOFTWARE', description: 'Application errors, crashes, bugs', slaHours: { critical: 2, high: 4, medium: 8, low: 24 } },
        { name: 'Network/Connectivity', code: 'NETWORK', description: 'Internet, WiFi, LAN issues', slaHours: { critical: 1, high: 2, medium: 4, low: 8 } },
        { name: 'Email/Calendar', code: 'EMAIL', description: 'Email access, calendar sync issues', slaHours: { critical: 2, high: 4, medium: 8, low: 24 } },
        { name: 'Access Request', code: 'ACCESS', description: 'System access, permissions', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'New Equipment Request', code: 'NEW_EQUIPMENT', description: 'Request for new hardware', slaHours: { critical: 24, high: 48, medium: 72, low: 120 } },
        { name: 'VPN/Remote Access', code: 'VPN', description: 'VPN setup, remote access issues', slaHours: { critical: 2, high: 4, medium: 8, low: 24 } },
        { name: 'Printer Issue', code: 'PRINTER', description: 'Printer not working, paper jam', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Data Recovery', code: 'DATA_RECOVERY', description: 'Recover lost/deleted files', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Security Incident', code: 'SECURITY', description: 'Virus, phishing, security breach', slaHours: { critical: 1, high: 2, medium: 4, low: 8 } }
      ]
    },
    {
      name: 'HR Support',
      code: 'HR_SUPPORT',
      description: 'Human resources related queries and requests',
      icon: 'Users',
      color: 'purple',
      supportDepartment: 'HRMS',
      requiresApproval: false,
      sortOrder: 2,
      subCategories: [
        { name: 'Leave Query', code: 'LEAVE', description: 'Leave balance, policy questions', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Payroll Issue', code: 'PAYROLL', description: 'Salary discrepancy, deductions', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Benefits Inquiry', code: 'BENEFITS', description: 'Insurance, PF, gratuity queries', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Policy Clarification', code: 'POLICY', description: 'HR policy questions', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Document Request', code: 'DOCUMENTS', description: 'Employment letter, payslips', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Onboarding Support', code: 'ONBOARDING', description: 'New joiner assistance', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Offboarding', code: 'OFFBOARDING', description: 'Exit process, clearance', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Training Request', code: 'TRAINING', description: 'Training programs, certifications', slaHours: { critical: 24, high: 48, medium: 72, low: 120 } },
        { name: 'Grievance', code: 'GRIEVANCE', description: 'Workplace complaints', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Employee Verification', code: 'VERIFICATION', description: 'BGV, reference checks', slaHours: { critical: 24, high: 48, medium: 72, low: 120 } }
      ]
    },
    {
      name: 'Finance Support',
      code: 'FINANCE_SUPPORT',
      description: 'Finance and accounting related requests',
      icon: 'IndianRupee',
      color: 'green',
      supportDepartment: 'Finance',
      requiresApproval: true,
      approvalThreshold: 5000,
      sortOrder: 3,
      subCategories: [
        { name: 'Expense Reimbursement', code: 'REIMBURSEMENT', description: 'Submit expense claims', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Invoice Query', code: 'INVOICE', description: 'Invoice status, corrections', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Payment Status', code: 'PAYMENT_STATUS', description: 'Check payment status', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Budget Request', code: 'BUDGET', description: 'Budget allocation, increase', slaHours: { critical: 24, high: 48, medium: 72, low: 120 } },
        { name: 'Vendor Payment', code: 'VENDOR_PAYMENT', description: 'Vendor payment issues', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Tax Query', code: 'TAX', description: 'TDS, GST, tax documents', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Travel Advance', code: 'TRAVEL_ADVANCE', description: 'Travel advance request', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Petty Cash', code: 'PETTY_CASH', description: 'Petty cash requests', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Credit Card Issue', code: 'CREDIT_CARD', description: 'Corporate card issues', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Salary Advance', code: 'SALARY_ADVANCE', description: 'Salary advance request', slaHours: { critical: 24, high: 48, medium: 72, low: 120 } }
      ]
    },
    {
      name: 'Admin/Facilities',
      code: 'ADMIN_SUPPORT',
      description: 'Office administration and facilities management',
      icon: 'Building2',
      color: 'orange',
      supportDepartment: 'Admin',
      requiresApproval: false,
      sortOrder: 4,
      subCategories: [
        { name: 'Office Supplies', code: 'SUPPLIES', description: 'Stationery, supplies request', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Maintenance Request', code: 'MAINTENANCE', description: 'AC, electrical, plumbing', slaHours: { critical: 2, high: 4, medium: 8, low: 24 } },
        { name: 'Access Card Issue', code: 'ACCESS_CARD', description: 'ID card, access issues', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Parking', code: 'PARKING', description: 'Parking allocation, issues', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Housekeeping', code: 'HOUSEKEEPING', description: 'Cleaning, hygiene issues', slaHours: { critical: 2, high: 4, medium: 8, low: 24 } },
        { name: 'Meeting Room', code: 'MEETING_ROOM', description: 'Room booking, AV setup', slaHours: { critical: 1, high: 2, medium: 4, low: 8 } },
        { name: 'Cafeteria', code: 'CAFETERIA', description: 'Food, cafeteria issues', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Security', code: 'SECURITY', description: 'Security concerns, access', slaHours: { critical: 1, high: 2, medium: 4, low: 8 } },
        { name: 'Visitor Management', code: 'VISITOR', description: 'Visitor passes, arrangements', slaHours: { critical: 2, high: 4, medium: 8, low: 24 } },
        { name: 'Courier/Logistics', code: 'COURIER', description: 'Courier pickup, delivery', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } }
      ]
    },
    {
      name: 'Design Support',
      code: 'DESIGN_SUPPORT',
      description: 'Design team support and resources',
      icon: 'Palette',
      color: 'pink',
      supportDepartment: 'Design',
      requiresApproval: false,
      sortOrder: 5,
      subCategories: [
        { name: 'Design Tool Access', code: 'TOOL_ACCESS', description: 'Software license, access', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Asset Request', code: 'ASSET_REQUEST', description: 'Design assets, resources', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Brand Guidelines', code: 'BRAND', description: 'Brand assets, guidelines', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Template Request', code: 'TEMPLATE', description: 'Design templates', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Design Review', code: 'REVIEW', description: 'Design feedback, review', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Software License', code: 'LICENSE', description: 'Adobe, Figma licenses', slaHours: { critical: 24, high: 48, medium: 72, low: 120 } },
        { name: 'Training Request', code: 'TRAINING', description: 'Design tool training', slaHours: { critical: 24, high: 48, medium: 72, low: 120 } }
      ]
    },
    {
      name: 'Operations Support',
      code: 'OPS_SUPPORT',
      description: 'Operations and project execution support',
      icon: 'Settings',
      color: 'cyan',
      supportDepartment: 'Operations',
      requiresApproval: false,
      sortOrder: 6,
      subCategories: [
        { name: 'Project Support', code: 'PROJECT', description: 'Project execution help', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Vendor Query', code: 'VENDOR', description: 'Vendor coordination', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Material Request', code: 'MATERIAL', description: 'Material procurement', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Site Issue', code: 'SITE', description: 'Site-related problems', slaHours: { critical: 2, high: 4, medium: 8, low: 24 } },
        { name: 'Quality Issue', code: 'QUALITY', description: 'Quality concerns', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Delivery Issue', code: 'DELIVERY', description: 'Delivery delays, issues', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Inventory Query', code: 'INVENTORY', description: 'Stock availability', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } }
      ]
    },
    {
      name: 'Sales Support',
      code: 'SALES_SUPPORT',
      description: 'Sales team support and assistance',
      icon: 'TrendingUp',
      color: 'yellow',
      supportDepartment: 'Sales',
      requiresApproval: false,
      sortOrder: 7,
      subCategories: [
        { name: 'CRM Access', code: 'CRM_ACCESS', description: 'CRM system access', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Quote Assistance', code: 'QUOTE', description: 'Help with quotations', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Client Data Request', code: 'CLIENT_DATA', description: 'Client information', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Proposal Support', code: 'PROPOSAL', description: 'Proposal preparation', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Commission Query', code: 'COMMISSION', description: 'Sales commission issues', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Territory Issue', code: 'TERRITORY', description: 'Territory assignments', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } }
      ]
    },
    {
      name: 'Marketing Support',
      code: 'MARKETING_SUPPORT',
      description: 'Marketing team support and resources',
      icon: 'Megaphone',
      color: 'red',
      supportDepartment: 'Marketing',
      requiresApproval: false,
      sortOrder: 8,
      subCategories: [
        { name: 'Campaign Support', code: 'CAMPAIGN', description: 'Campaign execution help', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Content Request', code: 'CONTENT', description: 'Content creation', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Social Media', code: 'SOCIAL', description: 'Social media support', slaHours: { critical: 4, high: 8, medium: 24, low: 48 } },
        { name: 'Event Support', code: 'EVENT', description: 'Event coordination', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Collateral Request', code: 'COLLATERAL', description: 'Marketing materials', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Analytics Access', code: 'ANALYTICS', description: 'Analytics tools access', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } }
      ]
    },
    {
      name: 'Management Escalation',
      code: 'MGMT_ESCALATION',
      description: 'Escalations requiring management attention',
      icon: 'AlertTriangle',
      color: 'gray',
      supportDepartment: 'Management',
      requiresApproval: true,
      sortOrder: 9,
      subCategories: [
        { name: 'Policy Exception', code: 'POLICY_EXCEPTION', description: 'Exception to policies', slaHours: { critical: 8, high: 24, medium: 48, low: 72 } },
        { name: 'Budget Approval', code: 'BUDGET_APPROVAL', description: 'Budget approvals', slaHours: { critical: 24, high: 48, medium: 72, low: 120 } },
        { name: 'Vendor Approval', code: 'VENDOR_APPROVAL', description: 'New vendor approvals', slaHours: { critical: 24, high: 48, medium: 72, low: 120 } },
        { name: 'Contract Review', code: 'CONTRACT', description: 'Contract reviews', slaHours: { critical: 24, high: 48, medium: 72, low: 120 } },
        { name: 'Strategic Decision', code: 'STRATEGIC', description: 'Strategic decisions', slaHours: { critical: 48, high: 72, medium: 120, low: 168 } }
      ]
    }
  ]
}

const TicketCategory = mongoose.model('TicketCategory', ticketCategorySchema)

export default TicketCategory
