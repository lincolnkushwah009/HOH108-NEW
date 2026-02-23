import mongoose from 'mongoose'

const processConfigurationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  code: {
    type: String,
    required: [true, 'Code is required']
  },

  name: {
    type: String,
    required: [true, 'Name is required']
  },

  description: {
    type: String,
    default: ''
  },

  level: {
    type: String,
    enum: ['module', 'phase', 'process', 'activity', 'task'],
    required: [true, 'Level is required']
  },

  parentNode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcessConfiguration',
    default: null
  },

  // Materialized path for subtree queries: '/rootId/phaseId/...'
  path: {
    type: String,
    default: ''
  },

  depth: {
    type: Number,
    default: 0,
    min: 0,
    max: 4
  },

  order: {
    type: Number,
    default: 0
  },

  departments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],

  kra: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KRA'
  },

  kpis: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KPIConfig'
  }],

  // Bridge to existing permission system
  legacyMapping: {
    permissionKeys: [{ type: String }],
    roleModuleName: { type: String },
    approvalActivity: { type: String },
    navigationId: { type: String }
  },

  icon: {
    type: String,
    default: ''
  },

  color: {
    type: String,
    default: ''
  },

  isActive: {
    type: Boolean,
    default: true
  },

  isSystem: {
    type: Boolean,
    default: false
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
processConfigurationSchema.index({ company: 1, code: 1 }, { unique: true })
processConfigurationSchema.index({ company: 1, parentNode: 1, order: 1 })
processConfigurationSchema.index({ company: 1, level: 1, isActive: 1 })
processConfigurationSchema.index({ company: 1, path: 1 })
processConfigurationSchema.index({ 'legacyMapping.permissionKeys': 1 })

// Pre-save: compute path and depth
processConfigurationSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('parentNode')) {
    if (this.parentNode) {
      const parent = await this.constructor.findById(this.parentNode)
      if (parent) {
        this.path = parent.path ? `${parent.path}/${parent._id}` : `/${parent._id}`
        this.depth = parent.depth + 1
      }
    } else {
      this.path = ''
      this.depth = 0
    }
  }
  next()
})

/**
 * Get full hierarchy tree for a company
 */
processConfigurationSchema.statics.getTree = async function(companyId) {
  const nodes = await this.find({ company: companyId, isActive: true })
    .sort({ depth: 1, order: 1 })
    .populate('departments', 'name')
    .populate('kra', 'name kraCode')
    .populate('kpis', 'name configId')
    .lean()

  // Build tree structure
  const nodeMap = {}
  const roots = []

  nodes.forEach(node => {
    node.children = []
    nodeMap[node._id.toString()] = node
  })

  nodes.forEach(node => {
    if (node.parentNode) {
      const parent = nodeMap[node.parentNode.toString()]
      if (parent) {
        parent.children.push(node)
      }
    } else {
      roots.push(node)
    }
  })

  return roots
}

/**
 * Get subtree from a specific node
 */
processConfigurationSchema.statics.getSubtree = async function(nodeId) {
  const node = await this.findById(nodeId).lean()
  if (!node) return null

  const pathPrefix = node.path ? `${node.path}/${node._id}` : `/${node._id}`
  const descendants = await this.find({
    company: node.company,
    isActive: true,
    $or: [
      { _id: nodeId },
      { path: new RegExp(`^${pathPrefix}`) }
    ]
  }).sort({ depth: 1, order: 1 }).lean()

  return descendants
}

/**
 * Get ancestors of a node (path to root)
 */
processConfigurationSchema.statics.getAncestors = async function(nodeId) {
  const node = await this.findById(nodeId).lean()
  if (!node || !node.path) return []

  const ancestorIds = node.path.split('/').filter(Boolean)
  if (ancestorIds.length === 0) return []

  const ancestors = await this.find({ _id: { $in: ancestorIds } })
    .sort({ depth: 1 })
    .lean()

  return ancestors
}

/**
 * Find node by legacy permission key
 */
processConfigurationSchema.statics.findByLegacyPermission = async function(companyId, key) {
  return this.findOne({
    company: companyId,
    'legacyMapping.permissionKeys': key,
    isActive: true
  })
}

/**
 * Create default hierarchy for a company
 */
processConfigurationSchema.statics.createDefaultHierarchy = async function(companyId, userId) {
  const existing = await this.countDocuments({ company: companyId })
  if (existing > 0) {
    throw new Error('Hierarchy already exists for this company. Delete existing nodes first.')
  }

  const hierarchy = getDefaultHierarchy()
  const created = []

  for (const mod of hierarchy) {
    const moduleNode = await this.create({
      company: companyId,
      code: mod.code,
      name: mod.name,
      description: mod.description || '',
      level: 'module',
      parentNode: null,
      order: mod.order,
      icon: mod.icon || '',
      color: mod.color || '',
      isSystem: true,
      isActive: true,
      legacyMapping: mod.legacyMapping || {},
      createdBy: userId
    })
    created.push(moduleNode)

    if (mod.phases) {
      for (let pi = 0; pi < mod.phases.length; pi++) {
        const phase = mod.phases[pi]
        const phaseNode = await this.create({
          company: companyId,
          code: `${mod.code}.${phase.code}`,
          name: phase.name,
          description: phase.description || '',
          level: 'phase',
          parentNode: moduleNode._id,
          order: pi,
          isSystem: true,
          isActive: true,
          legacyMapping: phase.legacyMapping || {},
          createdBy: userId
        })
        created.push(phaseNode)

        if (phase.processes) {
          for (let ri = 0; ri < phase.processes.length; ri++) {
            const proc = phase.processes[ri]
            const procNode = await this.create({
              company: companyId,
              code: `${mod.code}.${phase.code}.${proc.code}`,
              name: proc.name,
              description: proc.description || '',
              level: 'process',
              parentNode: phaseNode._id,
              order: ri,
              isSystem: true,
              isActive: true,
              legacyMapping: proc.legacyMapping || {},
              createdBy: userId
            })
            created.push(procNode)

            if (proc.activities) {
              for (let ai = 0; ai < proc.activities.length; ai++) {
                const act = proc.activities[ai]
                const actNode = await this.create({
                  company: companyId,
                  code: `${mod.code}.${phase.code}.${proc.code}.${act.code}`,
                  name: act.name,
                  description: act.description || '',
                  level: 'activity',
                  parentNode: procNode._id,
                  order: ai,
                  isSystem: true,
                  isActive: true,
                  legacyMapping: act.legacyMapping || {},
                  createdBy: userId
                })
                created.push(actNode)
              }
            }
          }
        }
      }
    }
  }

  return created
}

/**
 * Default hierarchy seed data
 */
function getDefaultHierarchy() {
  return [
    {
      code: 'SALES',
      name: 'Sales & CRM',
      order: 0,
      icon: 'TrendingUp',
      color: '#3B82F6',
      legacyMapping: { roleModuleName: 'Sales', navigationId: 'sales' },
      phases: [
        {
          code: 'LEAD_MGMT',
          name: 'Lead Management',
          processes: [
            {
              code: 'CAPTURE',
              name: 'Lead Capture',
              legacyMapping: { permissionKeys: ['leads:create', 'leads:import'] },
              activities: [
                { code: 'MANUAL_ENTRY', name: 'Manual Entry', legacyMapping: { permissionKeys: ['leads:create'] } },
                { code: 'IMPORT', name: 'Bulk Import', legacyMapping: { permissionKeys: ['leads:import'] } }
              ]
            },
            {
              code: 'QUALIFICATION',
              name: 'Lead Qualification',
              legacyMapping: { permissionKeys: ['leads:view', 'leads:edit', 'leads:assign'] },
              activities: [
                { code: 'VIEW', name: 'View Leads', legacyMapping: { permissionKeys: ['leads:view', 'leads:view_all', 'leads:view_assigned'] } },
                { code: 'EDIT', name: 'Edit Leads', legacyMapping: { permissionKeys: ['leads:edit'] } },
                { code: 'ASSIGN', name: 'Assign Leads', legacyMapping: { permissionKeys: ['leads:assign'] } }
              ]
            },
            {
              code: 'CONVERSION',
              name: 'Lead Conversion',
              legacyMapping: { permissionKeys: ['leads:convert', 'leads:export'], approvalActivity: 'lead_conversion' },
              activities: [
                { code: 'CONVERT', name: 'Convert to Customer', legacyMapping: { permissionKeys: ['leads:convert'] } },
                { code: 'EXPORT', name: 'Export Leads', legacyMapping: { permissionKeys: ['leads:export'] } }
              ]
            }
          ]
        },
        {
          code: 'ORDER_PROC',
          name: 'Order Processing',
          legacyMapping: { approvalActivity: 'quotation,sales_order,discount_approval' },
          processes: [
            { code: 'QUOTATION', name: 'Quotation Management', legacyMapping: { approvalActivity: 'quotation' } },
            { code: 'SALES_ORDER', name: 'Sales Order Processing', legacyMapping: { approvalActivity: 'sales_order' } },
            { code: 'DISCOUNT', name: 'Discount Approval', legacyMapping: { approvalActivity: 'discount_approval' } }
          ]
        },
        {
          code: 'CUST_MGMT',
          name: 'Customer Management',
          processes: [
            {
              code: 'MANAGE',
              name: 'Customer Operations',
              legacyMapping: { permissionKeys: ['customers:view', 'customers:create', 'customers:edit', 'customers:delete', 'customers:export'] },
              activities: [
                { code: 'VIEW', name: 'View Customers', legacyMapping: { permissionKeys: ['customers:view', 'customers:view_all', 'customers:view_assigned'] } },
                { code: 'CREATE', name: 'Create Customer', legacyMapping: { permissionKeys: ['customers:create'] } },
                { code: 'EDIT', name: 'Edit Customer', legacyMapping: { permissionKeys: ['customers:edit'] } },
                { code: 'DELETE', name: 'Delete Customer', legacyMapping: { permissionKeys: ['customers:delete'] } }
              ]
            }
          ]
        }
      ]
    },
    {
      code: 'PROCUREMENT',
      name: 'Procurement',
      order: 1,
      icon: 'ShoppingCart',
      color: '#F59E0B',
      legacyMapping: { roleModuleName: 'Procurement', navigationId: 'procurement' },
      phases: [
        {
          code: 'VENDOR_MGMT',
          name: 'Vendor Management',
          processes: [
            { code: 'ONBOARDING', name: 'Vendor Onboarding', legacyMapping: { approvalActivity: 'vendor_onboarding' } },
            { code: 'RATE_APPROVAL', name: 'Vendor Rate Approval', legacyMapping: { approvalActivity: 'vendor_rate_approval' } }
          ]
        },
        {
          code: 'PURCHASE',
          name: 'Purchase Cycle',
          processes: [
            { code: 'PR', name: 'Purchase Requisition', legacyMapping: { approvalActivity: 'purchase_requisition' } },
            { code: 'PO', name: 'Purchase Order', legacyMapping: { approvalActivity: 'purchase_order' } },
            { code: 'GRN', name: 'Goods Receipt', legacyMapping: { approvalActivity: 'goods_receipt' } },
            { code: 'VENDOR_INV', name: 'Vendor Invoice', legacyMapping: { approvalActivity: 'vendor_invoice' } },
            { code: 'PAYMENT', name: 'Vendor Payment', legacyMapping: { approvalActivity: 'payment_release' } }
          ]
        }
      ]
    },
    {
      code: 'INVENTORY',
      name: 'Inventory',
      order: 2,
      icon: 'Boxes',
      color: '#8B5CF6',
      legacyMapping: { roleModuleName: 'Inventory', navigationId: 'inventory' },
      phases: [
        {
          code: 'STOCK_MGMT',
          name: 'Stock Management',
          processes: [
            { code: 'ADJUSTMENT', name: 'Stock Adjustment', legacyMapping: { approvalActivity: 'stock_adjustment' } },
            { code: 'TRANSFER', name: 'Stock Transfer' },
            { code: 'MATERIAL_REQ', name: 'Material Request', legacyMapping: { approvalActivity: 'material_request' } }
          ]
        },
        {
          code: 'MATERIAL_MGMT',
          name: 'Material Management',
          processes: [
            { code: 'CATALOG', name: 'Material Catalog' },
            { code: 'PRICING', name: 'Material Pricing' }
          ]
        }
      ]
    },
    {
      code: 'PROJECTS',
      name: 'Projects',
      order: 3,
      icon: 'Briefcase',
      color: '#10B981',
      legacyMapping: { roleModuleName: 'Projects', navigationId: 'projects' },
      phases: [
        {
          code: 'INITIATION',
          name: 'Project Initiation',
          processes: [
            { code: 'CREATION', name: 'Project Creation', legacyMapping: { permissionKeys: ['projects:create'], approvalActivity: 'project_creation' } },
            { code: 'ASSIGNMENT', name: 'Team Assignment', legacyMapping: { permissionKeys: ['projects:manage_team'] } }
          ]
        },
        {
          code: 'DESIGN',
          name: 'Design Phase',
          processes: [
            { code: 'APPROVAL', name: 'Design Approval', legacyMapping: { approvalActivity: 'design_approval' } }
          ]
        },
        {
          code: 'EXECUTION',
          name: 'Execution Phase',
          processes: [
            { code: 'TASK_MGMT', name: 'Task Management' },
            { code: 'MATERIAL_REQ', name: 'Material Requisition' },
            { code: 'VENDOR_ASSIGN', name: 'Vendor Assignment' }
          ]
        },
        {
          code: 'QC_SNAG',
          name: 'QC & Snag',
          processes: [
            { code: 'QC_CHECK', name: 'Quality Checks' },
            { code: 'SNAG_LIST', name: 'Snag Management' }
          ]
        },
        {
          code: 'HANDOVER',
          name: 'Handover',
          processes: [
            { code: 'HANDOVER', name: 'Project Handover', legacyMapping: { approvalActivity: 'project_handover' } },
            { code: 'MILESTONE', name: 'Milestone Approval', legacyMapping: { approvalActivity: 'milestone_approval' } }
          ]
        }
      ]
    },
    {
      code: 'HR',
      name: 'HR Management',
      order: 4,
      icon: 'UserCircle',
      color: '#EC4899',
      legacyMapping: { roleModuleName: 'HR', navigationId: 'hr' },
      phases: [
        {
          code: 'EMP_LIFECYCLE',
          name: 'Employee Lifecycle',
          processes: [
            { code: 'ATTENDANCE', name: 'Attendance Management' },
            { code: 'LEAVES', name: 'Leave Management', legacyMapping: { approvalActivity: 'leave_approval' } },
            { code: 'REIMBURSEMENT', name: 'Reimbursements', legacyMapping: { approvalActivity: 'reimbursement' } }
          ]
        },
        {
          code: 'COMPENSATION',
          name: 'Compensation',
          processes: [
            { code: 'SALARY', name: 'Salary Management', legacyMapping: { approvalActivity: 'salary_revision' } },
            { code: 'PAYROLL', name: 'Payroll Processing', legacyMapping: { approvalActivity: 'payroll' } }
          ]
        },
        {
          code: 'HR_COMPLIANCE',
          name: 'HR Compliance',
          processes: [
            { code: 'DOCUMENTS', name: 'Document Management' },
            { code: 'EXIT', name: 'Exit Management', legacyMapping: { approvalActivity: 'exit_management' } }
          ]
        }
      ]
    },
    {
      code: 'FINANCE',
      name: 'Finance',
      order: 5,
      icon: 'IndianRupee',
      color: '#F97316',
      legacyMapping: { roleModuleName: 'Finance', navigationId: 'finance' },
      phases: [
        {
          code: 'RECEIVABLES',
          name: 'Receivables',
          processes: [
            { code: 'INVOICE', name: 'Customer Invoicing' },
            { code: 'COLLECTION', name: 'Payment Collection' }
          ]
        },
        {
          code: 'PAYABLES',
          name: 'Payables',
          processes: [
            { code: 'EXPENSE', name: 'Expense Approval', legacyMapping: { approvalActivity: 'expense_approval' } },
            { code: 'BUDGET', name: 'Budget Allocation', legacyMapping: { approvalActivity: 'budget_allocation' } }
          ]
        },
        {
          code: 'FIN_COMPLIANCE',
          name: 'Financial Compliance',
          processes: [
            { code: 'GST', name: 'GST Compliance' },
            { code: 'E_INVOICE', name: 'E-Invoicing' },
            { code: 'BANK_RECON', name: 'Bank Reconciliation' }
          ]
        }
      ]
    },
    {
      code: 'PRODUCTION',
      name: 'Production (PPC)',
      order: 6,
      icon: 'Factory',
      color: '#6366F1',
      legacyMapping: { navigationId: 'ppc' },
      phases: [
        {
          code: 'PLANNING',
          name: 'Production Planning',
          processes: [
            { code: 'WORK_ORDER', name: 'Work Orders' },
            { code: 'BOM', name: 'Bill of Materials' },
            { code: 'MRP', name: 'Material Requirements' }
          ]
        },
        {
          code: 'PROD_EXEC',
          name: 'Production Execution',
          processes: [
            { code: 'MAT_ISSUE', name: 'Material Issues' },
            { code: 'LABOR', name: 'Labor Tracking' },
            { code: 'PROGRESS', name: 'Daily Progress' }
          ]
        }
      ]
    },
    {
      code: 'SETTINGS',
      name: 'Settings & Admin',
      order: 7,
      icon: 'Settings',
      color: '#6B7280',
      legacyMapping: {
        roleModuleName: 'Settings',
        navigationId: 'settings',
        permissionKeys: ['users:view', 'users:create', 'users:edit', 'users:delete', 'users:manage_roles', 'company:view', 'company:edit', 'company:manage_settings']
      },
      phases: [
        {
          code: 'USER_MGMT',
          name: 'User Management',
          processes: [
            { code: 'USERS', name: 'User Operations', legacyMapping: { permissionKeys: ['users:view', 'users:create', 'users:edit', 'users:delete'] } },
            { code: 'ROLES', name: 'Role Management', legacyMapping: { permissionKeys: ['users:manage_roles'] } }
          ]
        },
        {
          code: 'COMPANY_MGMT',
          name: 'Company Settings',
          processes: [
            { code: 'SETTINGS', name: 'Company Configuration', legacyMapping: { permissionKeys: ['company:view', 'company:edit', 'company:manage_settings'] } }
          ]
        }
      ]
    },
    {
      code: 'ANALYTICS',
      name: 'Analytics & Reports',
      order: 8,
      icon: 'PieChart',
      color: '#14B8A6',
      legacyMapping: {
        navigationId: 'analytics',
        permissionKeys: ['analytics:view', 'reports:view', 'reports:export']
      },
      phases: [
        {
          code: 'DASHBOARDS',
          name: 'Dashboards',
          processes: [
            { code: 'SALES_ANALYTICS', name: 'Sales Analytics', legacyMapping: { permissionKeys: ['analytics:view'] } },
            { code: 'FINANCE_ANALYTICS', name: 'Finance Analytics', legacyMapping: { permissionKeys: ['analytics:view'] } },
            { code: 'PROJECT_ANALYTICS', name: 'Project Analytics', legacyMapping: { permissionKeys: ['analytics:view'] } },
            { code: 'HR_ANALYTICS', name: 'HR Analytics', legacyMapping: { permissionKeys: ['analytics:view'] } }
          ]
        },
        {
          code: 'REPORTS',
          name: 'Reports',
          processes: [
            { code: 'GENERATE', name: 'Report Generation', legacyMapping: { permissionKeys: ['reports:view'] } },
            { code: 'EXPORT', name: 'Report Export', legacyMapping: { permissionKeys: ['reports:export'] } }
          ]
        }
      ]
    }
  ]
}

const ProcessConfiguration = mongoose.model('ProcessConfiguration', processConfigurationSchema)

export default ProcessConfiguration
