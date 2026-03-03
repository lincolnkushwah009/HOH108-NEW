import mongoose from 'mongoose'

/**
 * Role - Custom roles in addition to system roles
 *
 * System roles are defined in User.js (super_admin, company_admin, etc.)
 * This model allows companies to create custom roles with specific permissions
 */

const roleSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Role identifier (e.g., 'PROCUREMENT_CLERK', 'SITE_SUPERVISOR')
  roleCode: {
    type: String,
    required: [true, 'Role code is required'],
    uppercase: true
  },

  // Display name
  roleName: {
    type: String,
    required: [true, 'Role name is required']
  },

  description: {
    type: String,
    default: ''
  },

  // Whether this is a system-defined role (cannot be edited/deleted)
  isSystem: {
    type: Boolean,
    default: false
  },

  // Department this role belongs to
  department: {
    type: String,
    default: ''
  },

  // Base role to inherit permissions from
  baseRole: {
    type: String,
    enum: ['super_admin', 'company_admin', 'sales_manager', 'sales_executive',
           'pre_sales', 'project_manager', 'site_engineer', 'designer', 'operations',
           'finance', 'viewer', 'custom'],
    default: 'custom'
  },

  // Fine-grained permission keys (e.g., 'leads:view', 'customers:create')
  granularPermissions: [{
    type: String
  }],

  // Module-based permissions
  permissions: {
    Dashboard: {
      type: [String],
      default: ['view'],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    },
    Sales: {
      type: [String],
      default: [],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    },
    Procurement: {
      type: [String],
      default: [],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    },
    Inventory: {
      type: [String],
      default: [],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    },
    HR: {
      type: [String],
      default: [],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    },
    Finance: {
      type: [String],
      default: [],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    },
    Projects: {
      type: [String],
      default: [],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    },
    Customers: {
      type: [String],
      default: [],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    },
    Leads: {
      type: [String],
      default: [],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    },
    Settings: {
      type: [String],
      default: [],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    },
    Reports: {
      type: [String],
      default: ['view'],
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export']
    }
  },

  // Number of users assigned to this role
  userCount: {
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

// Compound unique index for roleCode per company
roleSchema.index({ company: 1, roleCode: 1 }, { unique: true })
roleSchema.index({ company: 1, isActive: 1 })
roleSchema.index({ company: 1, isSystem: 1 })

// Static method to create default system roles for a company
roleSchema.statics.createDefaultRoles = async function(companyId, userId) {
  const ALL = ['view', 'create', 'edit', 'delete', 'approve', 'export']
  const defaultRoles = [
    // ======================== MANAGEMENT ========================
    {
      company: companyId, roleCode: 'OWNER', roleName: 'Owner',
      description: 'Business owner with full system access',
      isSystem: true, baseRole: 'super_admin', department: 'Management',
      permissions: { Dashboard: ALL, Sales: ALL, Procurement: ALL, Inventory: ALL, HR: ALL, Finance: ALL, Projects: ALL, Customers: ALL, Leads: ALL, Settings: ALL, Reports: ALL },
      granularPermissions: [
        'leads:view','leads:view_all','leads:view_assigned','leads:create','leads:edit','leads:delete','leads:assign','leads:convert','leads:export','leads:import',
        'customers:view','customers:view_all','customers:view_assigned','customers:create','customers:edit','customers:delete','customers:export',
        'projects:view','projects:view_all','projects:view_assigned','projects:create','projects:edit','projects:delete','projects:manage_team','projects:manage_financials','projects:export',
        'users:view','users:create','users:edit','users:delete','users:manage_roles',
        'company:view','company:edit','company:manage_settings',
        'reports:view','reports:export','analytics:view','dashboard:view',
        'kpi:view','kpi:manage','performance:view','performance:view_all',
        'automation:view','automation:manage'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'ADMIN', roleName: 'Admin',
      description: 'System administrator with full access',
      isSystem: true, baseRole: 'company_admin', department: 'Management',
      permissions: { Dashboard: ALL, Sales: ALL, Procurement: ALL, Inventory: ALL, HR: ALL, Finance: ALL, Projects: ALL, Customers: ALL, Leads: ALL, Settings: ALL, Reports: ALL },
      granularPermissions: [
        'leads:view','leads:view_all','leads:view_assigned','leads:create','leads:edit','leads:delete','leads:assign','leads:convert','leads:export','leads:import',
        'customers:view','customers:view_all','customers:view_assigned','customers:create','customers:edit','customers:delete','customers:export',
        'projects:view','projects:view_all','projects:view_assigned','projects:create','projects:edit','projects:delete','projects:manage_team','projects:manage_financials','projects:export',
        'users:view','users:create','users:edit','users:delete','users:manage_roles',
        'company:view','company:edit','company:manage_settings',
        'reports:view','reports:export','analytics:view','dashboard:view',
        'kpi:view','kpi:manage','performance:view','performance:view_all',
        'automation:view','automation:manage'
      ],
      createdBy: userId
    },

    // ======================== PRE SALES DEPARTMENT ========================
    {
      company: companyId, roleCode: 'PRE_SALES_EXECUTIVE', roleName: 'Pre Sales Executive',
      description: 'Pre-sales team handling initial client interactions',
      isSystem: true, baseRole: 'pre_sales', department: 'Pre Sales',
      permissions: { Dashboard: ['view'], Sales: ['view', 'create', 'edit'], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: [], Customers: ['view'], Leads: ['view', 'create', 'edit'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view_assigned',
        'customers:view_all','customers:view_assigned',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },

    // ======================== SALES DEPARTMENT ========================
    {
      company: companyId, roleCode: 'ASSOCIATE_SALES_MANAGER', roleName: 'Associate Sales Manager',
      description: 'Associate-level sales manager',
      isSystem: true, baseRole: 'sales_executive', department: 'Sales',
      permissions: { Dashboard: ['view'], Sales: ['view', 'create', 'edit'], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: ['view', 'create', 'edit'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view','leads:view_assigned','leads:create','leads:convert',
        'customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'SALES_MANAGER', roleName: 'Sales Manager',
      description: 'Sales team manager',
      isSystem: true, baseRole: 'sales_manager', department: 'Sales',
      permissions: { Dashboard: ['view'], Sales: ['view', 'create', 'edit'], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'create', 'edit'], Customers: ['view', 'create'], Leads: ['view', 'create', 'edit'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view','leads:view_assigned','leads:create','leads:edit','leads:convert',
        'customers:view_all','customers:view_assigned','customers:create',
        'projects:view','projects:view_all','projects:create','projects:edit','projects:manage_team','projects:manage_financials',
        'kpi:view','kpi:manage','performance:view','performance:view_all'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'SALES_HEAD', roleName: 'Sales Head',
      description: 'Head of sales department',
      isSystem: true, baseRole: 'sales_manager', department: 'Sales',
      permissions: { Dashboard: ['view'], Sales: ['view', 'create', 'edit', 'delete', 'approve', 'export'], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'create', 'edit'], Customers: ['view', 'create'], Leads: ['view', 'create', 'edit', 'approve'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view','leads:view_all','leads:view_assigned','leads:create','leads:edit','leads:assign','leads:convert',
        'customers:view','customers:view_all','customers:view_assigned','customers:create',
        'projects:view','projects:view_all','projects:create','projects:edit','projects:manage_team','projects:manage_financials',
        'kpi:view','kpi:manage','performance:view','performance:view_all'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'AGM_SALES', roleName: 'AGM - Sales',
      description: 'Assistant General Manager - Sales',
      isSystem: true, baseRole: 'sales_manager', department: 'Sales',
      permissions: { Dashboard: ['view'], Sales: ['view', 'create', 'edit', 'delete', 'approve', 'export'], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: ['view', 'create', 'edit', 'approve'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view','leads:view_all','leads:view_assigned','leads:create','leads:edit','leads:assign','leads:convert',
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team','projects:manage_financials',
        'kpi:view','kpi:manage','performance:view','performance:view_all'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'AGM_BUSINESS', roleName: 'AGM - Business',
      description: 'Assistant General Manager - Business',
      isSystem: true, baseRole: 'company_admin', department: 'Sales',
      permissions: { Dashboard: ['view'], Sales: ['view', 'create', 'edit', 'approve'], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'create', 'edit'], Customers: ['view', 'create'], Leads: ['view', 'create', 'edit', 'approve'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view','leads:view_assigned','leads:create','leads:edit','leads:assign','leads:convert',
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:create','projects:edit','projects:manage_team','projects:manage_financials',
        'kpi:view','kpi:manage','performance:view','performance:view_all'
      ],
      createdBy: userId
    },

    // ======================== DESIGN DEPARTMENT ========================
    {
      company: companyId, roleCode: 'DESIGN_HEAD', roleName: 'Design Head',
      description: 'Head of design department',
      isSystem: true, baseRole: 'designer', department: 'Design',
      permissions: { Dashboard: ['view'], Sales: ['view'], Procurement: ['view'], Inventory: ['view'], HR: [], Finance: [], Projects: ['view', 'create', 'edit'], Customers: ['view'], Leads: ['view'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view_assigned',
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:create','projects:edit','projects:manage_team',
        'kpi:view','kpi:manage','performance:view','performance:view_all'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'COMMUNITY_MANAGER', roleName: 'Community Manager',
      description: 'Community manager in design department',
      isSystem: true, baseRole: 'designer', department: 'Design',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: ['view'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view_assigned',
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team',
        'kpi:manage','performance:view','performance:view_all'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'ASSOC_COMMUNITY_MANAGER', roleName: 'Associate Community Manager',
      description: 'Associate community manager in design department',
      isSystem: true, baseRole: 'designer', department: 'Design',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: ['view'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view_assigned',
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'PRINCIPAL_DESIGNER', roleName: 'Principal Designer',
      description: 'Principal designer',
      isSystem: true, baseRole: 'designer', department: 'Design',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: ['view'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view_assigned',
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'DESIGN_RELATIONSHIP_MANAGER', roleName: 'Design Relationship Manager',
      description: 'Design relationship manager',
      isSystem: true, baseRole: 'designer', department: 'Design',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: ['view'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view_assigned',
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'ASSOC_DESIGN_REL_MANAGER', roleName: 'Associate Design Relationship Manager',
      description: 'Associate design relationship manager',
      isSystem: true, baseRole: 'designer', department: 'Design',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: ['view'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view_assigned',
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'JUNIOR_DESIGNER', roleName: 'Junior Designer',
      description: 'Junior designer',
      isSystem: true, baseRole: 'designer', department: 'Design',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: ['view'], Settings: [], Reports: [] },
      granularPermissions: [
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team','projects:manage_financials',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },

    // ======================== OPERATION DEPARTMENT ========================
    {
      company: companyId, roleCode: 'AGM_OPERATIONS', roleName: 'AGM - Operations',
      description: 'Assistant General Manager - Operations',
      isSystem: true, baseRole: 'project_manager', department: 'Operations',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: ['view'], Inventory: ['view'], HR: [], Finance: ['view'], Projects: ['view', 'create', 'edit', 'approve'], Customers: ['view'], Leads: [], Settings: [], Reports: [] },
      granularPermissions: [
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team',
        'kpi:view','kpi:manage','performance:view','performance:view_all'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'PROJECT_MANAGER', roleName: 'Project Manager',
      description: 'Project manager in operations',
      isSystem: true, baseRole: 'project_manager', department: 'Operations',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: ['view'], Inventory: ['view'], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: [], Settings: [], Reports: [] },
      granularPermissions: [
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'SITE_ENGINEER', roleName: 'Site Engineer',
      description: 'Site engineer in operations',
      isSystem: true, baseRole: 'site_engineer', department: 'Operations',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: [], Settings: [], Reports: [] },
      granularPermissions: [
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'SITE_EXECUTIVE', roleName: 'Site Executive',
      description: 'Site executive in operations',
      isSystem: true, baseRole: 'site_engineer', department: 'Operations',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: [], Settings: [], Reports: [] },
      granularPermissions: [
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'MMT_TECHNICIAN', roleName: 'MMT Technician',
      description: 'MMT Technician in operations',
      isSystem: true, baseRole: 'operations', department: 'Operations',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: [], Settings: [], Reports: [] },
      granularPermissions: [
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit','projects:manage_team',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'QC_QA', roleName: 'QC/QA',
      description: 'Quality Control / Quality Assurance',
      isSystem: true, baseRole: 'operations', department: 'Operations',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: ['view', 'edit'], HR: [], Finance: ['view'], Projects: ['view', 'edit'], Customers: ['view'], Leads: [], Settings: [], Reports: [] },
      granularPermissions: [
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit',
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },

    // ======================== FINANCE DEPARTMENT ========================
    {
      company: companyId, roleCode: 'FINANCE_CONTROLLER', roleName: 'Finance Controller',
      description: 'Finance controller',
      isSystem: true, baseRole: 'finance', department: 'Finance',
      permissions: { Dashboard: ['view'], Sales: ['view'], Procurement: ['view', 'approve'], Inventory: ['view'], HR: [], Finance: ['view', 'create', 'edit', 'delete', 'approve', 'export'], Projects: ['view'], Customers: ['view'], Leads: [], Settings: [], Reports: ['view', 'export'] },
      granularPermissions: [
        'customers:view','customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:manage_financials',
        'kpi:view','kpi:manage','performance:view','performance:view_all'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'FINANCE_EXECUTIVE', roleName: 'Finance Executive',
      description: 'Finance executive',
      isSystem: true, baseRole: 'finance', department: 'Finance',
      permissions: { Dashboard: ['view'], Sales: ['view'], Procurement: ['view'], Inventory: [], HR: [], Finance: ['view', 'create', 'edit', 'export'], Projects: ['view'], Customers: ['view'], Leads: [], Settings: [], Reports: ['view'] },
      granularPermissions: [
        'customers:view_all','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:manage_financials',
        'kpi:view','kpi:manage','performance:view'
      ],
      createdBy: userId
    },

    // ======================== HR DEPARTMENT ========================
    {
      company: companyId, roleCode: 'HR_HEAD', roleName: 'HR Head',
      description: 'Head of Human Resources',
      isSystem: true, baseRole: 'operations', department: 'HR',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: ['view', 'create', 'edit', 'delete', 'approve', 'export'], Finance: [], Projects: [], Customers: [], Leads: [], Settings: ['view'], Reports: ['view'] },
      granularPermissions: [
        'kpi:view','kpi:manage','performance:view','performance:view_all'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'HR_EXECUTIVE', roleName: 'HR Executive',
      description: 'HR Executive',
      isSystem: true, baseRole: 'operations', department: 'HR',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: ['view', 'create', 'edit'], Finance: [], Projects: [], Customers: [], Leads: [], Settings: [], Reports: [] },
      granularPermissions: [
        'kpi:manage','performance:view'
      ],
      createdBy: userId
    },

    // ======================== QUALITY CONTROL / MISC DEPARTMENTS ========================
    {
      company: companyId, roleCode: 'TWO_D', roleName: '2D',
      description: '2D quality control specialist',
      isSystem: true, baseRole: 'operations', department: 'Quality Control',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: [], Settings: [], Reports: [] },
      granularPermissions: [
        'customers:view','customers:view_assigned',
        'projects:view','projects:view_assigned','projects:edit',
        'dashboard:view','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'ARCHITECT', roleName: 'Architect',
      description: 'Architect in design department',
      isSystem: true, baseRole: 'designer', department: 'Design',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: ['view'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view_assigned',
        'customers:view','customers:view_assigned',
        'projects:view','projects:view_assigned','projects:edit',
        'dashboard:view','kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'ADMIN_EXEC', roleName: 'Admin',
      description: 'Administration executive',
      isSystem: true, baseRole: 'operations', department: 'Administration',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: ['view'], Finance: [], Projects: [], Customers: [], Leads: [], Settings: ['view'], Reports: [] },
      granularPermissions: [
        'dashboard:view','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'BUSINESS_OPS_LEAD', roleName: 'Business Operations Lead',
      description: 'Business operations lead managing procurement and inventory',
      isSystem: true, baseRole: 'operations', department: 'Operations',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: ['view', 'create', 'edit'], Inventory: ['view', 'create', 'edit'], HR: [], Finance: [], Projects: ['view', 'edit'], Customers: ['view'], Leads: [], Settings: [], Reports: [] },
      granularPermissions: [
        'customers:view','customers:view_assigned',
        'projects:view','projects:view_all','projects:view_assigned','projects:edit',
        'dashboard:view','kpi:manage','performance:view'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'MANAGER_CHANNEL_PARTNER', roleName: 'Manager - Channel Partner',
      description: 'Manager for channel partner sales',
      isSystem: true, baseRole: 'sales_manager', department: 'Channel Sales',
      permissions: { Dashboard: ['view'], Sales: ['view', 'create', 'edit', 'approve'], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view'], Customers: ['view', 'create'], Leads: ['view', 'create', 'edit'], Settings: [], Reports: [] },
      granularPermissions: [
        'leads:view','leads:view_all','leads:view_assigned','leads:create','leads:edit','leads:assign','leads:convert',
        'customers:view','customers:view_all','customers:view_assigned','customers:create',
        'projects:view','projects:view_all',
        'dashboard:view','kpi:view','kpi:manage','performance:view','performance:view_all'
      ],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'INFORMATION_TECHNOLOGY', roleName: 'Information Technology',
      description: 'IT department member',
      isSystem: true, baseRole: 'operations', department: 'IT',
      permissions: { Dashboard: ['view'], Sales: [], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: [], Customers: [], Leads: [], Settings: ['view'], Reports: ['view'] },
      granularPermissions: [
        'dashboard:view','performance:view'
      ],
      createdBy: userId
    },

    // ======================== LEGACY ROLES (backward compat) ========================
    {
      company: companyId, roleCode: 'MARKETING', roleName: 'Marketing',
      description: 'Marketing team member',
      isSystem: true, baseRole: 'sales_executive', department: 'Marketing',
      permissions: { Dashboard: ['view'], Sales: ['view'], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view'], Customers: ['view', 'create', 'edit', 'export'], Leads: ['view', 'create', 'edit', 'export'], Settings: [], Reports: ['view', 'export'] },
      granularPermissions: ['leads:view','leads:view_assigned','leads:create','leads:edit','customers:view','customers:view_assigned','customers:create','customers:edit','customers:export','dashboard:view','performance:view'],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'CRM', roleName: 'CRM',
      description: 'CRM team managing customer relationships',
      isSystem: true, baseRole: 'sales_executive', department: 'Sales',
      permissions: { Dashboard: ['view'], Sales: ['view', 'create', 'edit'], Procurement: [], Inventory: [], HR: [], Finance: [], Projects: ['view'], Customers: ['view', 'create', 'edit', 'delete', 'export'], Leads: ['view', 'create', 'edit', 'delete', 'export'], Settings: [], Reports: ['view', 'export'] },
      granularPermissions: ['leads:view','leads:view_all','leads:view_assigned','leads:create','leads:edit','leads:delete','leads:assign','leads:convert','leads:export','customers:view','customers:view_all','customers:view_assigned','customers:create','customers:edit','customers:delete','customers:export','dashboard:view','performance:view'],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'PROCUREMENT', roleName: 'Procurement',
      description: 'Procurement team member',
      isSystem: true, baseRole: 'operations', department: 'Procurement',
      permissions: { Dashboard: ['view'], Sales: ['view'], Procurement: ['view', 'create', 'edit', 'export'], Inventory: ['view', 'create', 'edit'], HR: [], Finance: ['view'], Projects: ['view'], Customers: [], Leads: [], Settings: [], Reports: ['view', 'export'] },
      granularPermissions: ['projects:view','projects:view_all','customers:view','dashboard:view','performance:view'],
      createdBy: userId
    },
    {
      company: companyId, roleCode: 'VIEWER', roleName: 'Viewer',
      description: 'Read-only access',
      isSystem: true, baseRole: 'viewer', department: '',
      permissions: { Dashboard: ['view'], Sales: ['view'], Procurement: ['view'], Inventory: ['view'], HR: [], Finance: [], Projects: ['view'], Customers: ['view'], Leads: ['view'], Settings: [], Reports: ['view'] },
      granularPermissions: ['leads:view','leads:view_assigned','customers:view','customers:view_assigned','projects:view','projects:view_assigned','dashboard:view'],
      createdBy: userId
    }
  ]

  const created = []
  for (const role of defaultRoles) {
    try {
      const existing = await this.findOne({
        company: companyId,
        roleCode: role.roleCode
      })

      if (!existing) {
        const newRole = await this.create(role)
        created.push(newRole)
      }
    } catch (err) {
      console.error(`Error creating role ${role.roleCode}:`, err.message)
    }
  }

  return created
}

// Method to check if a role has a specific permission
roleSchema.methods.hasPermission = function(module, action) {
  const modulePermissions = this.permissions[module]
  return modulePermissions && modulePermissions.includes(action)
}

// Method to check if a role has any of the given permissions
roleSchema.methods.hasAnyPermission = function(module, actions) {
  const modulePermissions = this.permissions[module]
  return modulePermissions && actions.some(action => modulePermissions.includes(action))
}

const Role = mongoose.model('Role', roleSchema)

export default Role
