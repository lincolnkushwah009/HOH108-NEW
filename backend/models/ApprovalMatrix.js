import mongoose from 'mongoose'

/**
 * ApprovalMatrix - Defines Maker-Checker-Approver workflow rules
 *
 * This model defines WHO can approve WHAT at each level.
 * Can be configured at:
 * - Company level (default for all)
 * - Department level (overrides company default)
 * - Module level (specific to a module like Procurement, HR, Projects)
 * - Activity level (specific activity within a module)
 */

const approvalLevelSchema = new mongoose.Schema({
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  levelName: {
    type: String,
    enum: ['maker', 'checker', 'approver', 'final_approver', 'super_approver'],
    required: true
  },
  // Who can act at this level
  approverType: {
    type: String,
    enum: [
      'specific_user',      // Specific user(s)
      'role',               // Anyone with specific role
      'department_head',    // Head of the initiator's department
      'project_manager',    // Project manager of the related project
      'reporting_manager',  // Direct reporting manager of initiator
      'department_manager', // Manager of specific department
      'module_owner',       // Owner of the module
      'activity_owner'      // Owner assigned to specific activity
    ],
    required: true
  },
  // Specific users (if approverType is 'specific_user')
  specificUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Role required (if approverType is 'role')
  requiredRole: {
    type: String,
    enum: ['admin', 'manager', 'team_lead', 'finance_head', 'hr_head', 'procurement_head', 'operations_head', 'director', 'ceo']
  },
  // Department (if approverType is 'department_manager')
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  // Amount threshold - this level required only if amount exceeds
  amountThreshold: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: Infinity }
  },
  // Can this level be skipped if previous approver has higher authority?
  canBeSkipped: {
    type: Boolean,
    default: false
  },
  // Auto-approve if no action within X hours
  autoApproveAfterHours: {
    type: Number,
    default: null // null means no auto-approve
  },
  // Escalate to next level if no action within X hours
  escalateAfterHours: {
    type: Number,
    default: 48
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true })

const approvalMatrixSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // What this matrix applies to
  module: {
    type: String,
    enum: [
      'procurement',      // PO, GRN, Vendor Invoice
      'hr',               // Leave, Reimbursement, Attendance
      'finance',          // Payment, Collection, Invoice
      'projects',         // Project activities, Design approvals
      'inventory',        // Material requests, Stock adjustments
      'sales',            // Quotation, Sales Order
      'crm',              // Lead conversion, Customer onboarding
      'vendor',           // Vendor onboarding, Vendor payments
      'all'               // Default for all modules
    ],
    required: true
  },

  // Specific activity within the module
  activity: {
    type: String,
    enum: [
      // Procurement
      'purchase_requisition', 'purchase_order', 'goods_receipt', 'vendor_invoice', 'vendor_payment',
      // HR
      'leave_request', 'reimbursement', 'attendance_regularization', 'salary_revision',
      // Finance
      'customer_invoice', 'payment_collection', 'expense_approval', 'budget_allocation',
      // Projects
      'project_creation', 'project_assignment', 'task_completion', 'design_approval', 'milestone_approval',
      'material_requisition', 'vendor_assignment', 'project_handover',
      // Inventory
      'stock_adjustment', 'material_request', 'inter_warehouse_transfer',
      // Sales
      'quotation', 'sales_order', 'discount_approval',
      // CRM
      'lead_conversion', 'customer_onboarding',
      // Vendor
      'vendor_onboarding', 'vendor_rate_approval',
      // General
      'all'
    ],
    required: true
  },

  // Optional: Restrict to specific department
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },

  // Matrix name for easy identification
  name: {
    type: String,
    required: true
  },

  description: String,

  // Approval levels (ordered)
  levels: [approvalLevelSchema],

  // Settings
  settings: {
    // Require all levels or stop at first rejection
    stopOnFirstRejection: {
      type: Boolean,
      default: true
    },
    // Allow parallel approvals (multiple approvers at same level)
    allowParallelApprovals: {
      type: Boolean,
      default: false
    },
    // Minimum approvers required at each level (for parallel)
    minApproversRequired: {
      type: Number,
      default: 1
    },
    // Allow self-approval if user has authority
    allowSelfApproval: {
      type: Boolean,
      default: false
    },
    // Notify initiator on each level completion
    notifyOnEachLevel: {
      type: Boolean,
      default: true
    },
    // Notify all stakeholders on completion
    notifyAllOnCompletion: {
      type: Boolean,
      default: true
    },
    // Allow delegation
    allowDelegation: {
      type: Boolean,
      default: true
    },
    // Require comments on rejection
    requireRejectionComments: {
      type: Boolean,
      default: true
    }
  },

  // Priority (higher priority matrix takes precedence)
  priority: {
    type: Number,
    default: 0
  },

  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
approvalMatrixSchema.index({ company: 1, module: 1, activity: 1, isActive: 1 })
approvalMatrixSchema.index({ company: 1, department: 1, module: 1, activity: 1 })
approvalMatrixSchema.index({ company: 1, priority: -1 })

// Static method to find applicable matrix
approvalMatrixSchema.statics.findApplicableMatrix = async function(companyId, module, activity, departmentId = null, amount = 0) {
  // Priority order:
  // 1. Department + Module + Activity specific
  // 2. Department + Module + All activities
  // 3. Module + Activity specific
  // 4. Module + All activities
  // 5. All modules + All activities (company default)

  const queries = []

  if (departmentId) {
    // Department specific matrices
    queries.push({
      company: companyId,
      department: departmentId,
      module: module,
      activity: activity,
      isActive: true
    })
    queries.push({
      company: companyId,
      department: departmentId,
      module: module,
      activity: 'all',
      isActive: true
    })
  }

  // Module specific matrices
  queries.push({
    company: companyId,
    department: null,
    module: module,
    activity: activity,
    isActive: true
  })
  queries.push({
    company: companyId,
    department: null,
    module: module,
    activity: 'all',
    isActive: true
  })

  // Company default
  queries.push({
    company: companyId,
    department: null,
    module: 'all',
    activity: 'all',
    isActive: true
  })

  for (const query of queries) {
    const matrix = await this.findOne(query).sort({ priority: -1 })
    if (matrix) {
      // Filter levels based on amount threshold
      const applicableLevels = matrix.levels.filter(level => {
        const min = level.amountThreshold?.min || 0
        const max = level.amountThreshold?.max || Infinity
        return amount >= min && amount <= max && level.isActive
      })

      return {
        matrix,
        applicableLevels: applicableLevels.sort((a, b) => a.level - b.level)
      }
    }
  }

  return null
}

// Create default matrices for a company
approvalMatrixSchema.statics.createDefaultMatrices = async function(companyId, userId) {
  const defaultMatrices = [
    // Company-wide default (3-level)
    {
      company: companyId,
      module: 'all',
      activity: 'all',
      name: 'Default Approval Workflow',
      description: 'Default 3-level approval for all activities',
      levels: [
        { level: 1, levelName: 'maker', approverType: 'reporting_manager' },
        { level: 2, levelName: 'checker', approverType: 'department_head' },
        { level: 3, levelName: 'approver', approverType: 'role', requiredRole: 'manager' }
      ],
      priority: 0,
      createdBy: userId
    },
    // Procurement - Purchase Order
    {
      company: companyId,
      module: 'procurement',
      activity: 'purchase_order',
      name: 'Purchase Order Approval',
      description: 'Approval workflow for purchase orders',
      levels: [
        { level: 1, levelName: 'maker', approverType: 'department_head', amountThreshold: { min: 0, max: 50000 } },
        { level: 2, levelName: 'checker', approverType: 'role', requiredRole: 'procurement_head', amountThreshold: { min: 0, max: 200000 } },
        { level: 3, levelName: 'approver', approverType: 'role', requiredRole: 'finance_head', amountThreshold: { min: 50000 } },
        { level: 4, levelName: 'final_approver', approverType: 'role', requiredRole: 'director', amountThreshold: { min: 200000 } }
      ],
      priority: 10,
      createdBy: userId
    },
    // HR - Leave Request
    {
      company: companyId,
      module: 'hr',
      activity: 'leave_request',
      name: 'Leave Request Approval',
      description: 'Approval workflow for leave requests',
      levels: [
        { level: 1, levelName: 'maker', approverType: 'reporting_manager' },
        { level: 2, levelName: 'approver', approverType: 'department_head' }
      ],
      priority: 10,
      createdBy: userId
    },
    // HR - Reimbursement
    {
      company: companyId,
      module: 'hr',
      activity: 'reimbursement',
      name: 'Reimbursement Approval',
      description: 'Approval workflow for reimbursements',
      levels: [
        { level: 1, levelName: 'maker', approverType: 'reporting_manager', amountThreshold: { min: 0, max: 10000 } },
        { level: 2, levelName: 'checker', approverType: 'department_head', amountThreshold: { min: 0, max: 50000 } },
        { level: 3, levelName: 'approver', approverType: 'role', requiredRole: 'finance_head', amountThreshold: { min: 10000 } }
      ],
      priority: 10,
      createdBy: userId
    },
    // Projects - Design Approval
    {
      company: companyId,
      module: 'projects',
      activity: 'design_approval',
      name: 'Design Approval Workflow',
      description: 'Approval workflow for design iterations',
      levels: [
        { level: 1, levelName: 'maker', approverType: 'project_manager' },
        { level: 2, levelName: 'checker', approverType: 'role', requiredRole: 'operations_head' },
        { level: 3, levelName: 'approver', approverType: 'department_head' }
      ],
      priority: 10,
      createdBy: userId
    },
    // Projects - Task Completion
    {
      company: companyId,
      module: 'projects',
      activity: 'task_completion',
      name: 'Task Completion Approval',
      description: 'Approval workflow for task completion',
      levels: [
        { level: 1, levelName: 'maker', approverType: 'activity_owner' },
        { level: 2, levelName: 'approver', approverType: 'project_manager' }
      ],
      priority: 10,
      createdBy: userId
    },
    // Projects - Material Requisition
    {
      company: companyId,
      module: 'projects',
      activity: 'material_requisition',
      name: 'Material Requisition Approval',
      description: 'Approval for project material requests',
      levels: [
        { level: 1, levelName: 'maker', approverType: 'project_manager' },
        { level: 2, levelName: 'checker', approverType: 'role', requiredRole: 'procurement_head' },
        { level: 3, levelName: 'approver', approverType: 'role', requiredRole: 'finance_head' }
      ],
      priority: 10,
      createdBy: userId
    },
    // Vendor - Onboarding
    {
      company: companyId,
      module: 'vendor',
      activity: 'vendor_onboarding',
      name: 'Vendor Onboarding Approval',
      description: 'Approval workflow for new vendor registration',
      levels: [
        { level: 1, levelName: 'maker', approverType: 'role', requiredRole: 'procurement_head' },
        { level: 2, levelName: 'checker', approverType: 'role', requiredRole: 'finance_head' },
        { level: 3, levelName: 'approver', approverType: 'role', requiredRole: 'director' }
      ],
      priority: 10,
      createdBy: userId
    },
    // Finance - Payment Collection
    {
      company: companyId,
      module: 'finance',
      activity: 'payment_collection',
      name: 'Payment Collection Approval',
      description: 'Approval for recording customer payments',
      levels: [
        { level: 1, levelName: 'maker', approverType: 'project_manager' },
        { level: 2, levelName: 'approver', approverType: 'role', requiredRole: 'finance_head' }
      ],
      priority: 10,
      createdBy: userId
    },
    // Finance - Vendor Payment
    {
      company: companyId,
      module: 'procurement',
      activity: 'vendor_payment',
      name: 'Vendor Payment Approval',
      description: 'Approval workflow for vendor payments',
      levels: [
        { level: 1, levelName: 'maker', approverType: 'role', requiredRole: 'procurement_head' },
        { level: 2, levelName: 'checker', approverType: 'role', requiredRole: 'finance_head' },
        { level: 3, levelName: 'approver', approverType: 'role', requiredRole: 'director', amountThreshold: { min: 100000 } }
      ],
      priority: 10,
      createdBy: userId
    }
  ]

  const created = []
  for (const matrix of defaultMatrices) {
    try {
      const existing = await this.findOne({
        company: companyId,
        module: matrix.module,
        activity: matrix.activity,
        department: null
      })

      if (!existing) {
        const newMatrix = await this.create(matrix)
        created.push(newMatrix)
      }
    } catch (err) {
      console.error(`Error creating matrix ${matrix.name}:`, err.message)
    }
  }

  return created
}

const ApprovalMatrix = mongoose.model('ApprovalMatrix', approvalMatrixSchema)

export default ApprovalMatrix
