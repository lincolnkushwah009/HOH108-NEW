import {
  LayoutDashboard,
  Users,
  UserCircle,
  Briefcase,
  Building2,
  CalendarDays,
  CalendarOff,
  Mail,
  Gamepad2,
  Settings,
  Bell,
  ShoppingCart,
  Package,
  Boxes,
  FileText,
  Receipt,
  TrendingUp,
  ClipboardList,
  Truck,
  IndianRupee,
  CreditCard,
  Target,
  Award,
  ClipboardCheck,
  Shield,
  ShieldCheck,
  FileSpreadsheet,
  Megaphone,
  Monitor,
  Phone,
  Palette,
  Ticket,
  HeadphonesIcon,
  Wallet,
  FileSignature,
  Factory,
  Database,
  UserMinus,
  BarChart3,
  PieChart,
  Scale,
  AlertTriangle,
  FolderOpen,
  KeyRound,
  BookOpen,
  Timer,
  Landmark,
} from 'lucide-react'

// Define which roles can access which menu items
// 'all' means accessible by everyone, otherwise specify roles
const ADMIN_ROLES = ['superadmin', 'super_admin', 'admin', 'company_admin']
const MANAGER_ROLES = [...ADMIN_ROLES, 'manager', 'project_manager', 'sales_manager']
const HR_ROLES = [...ADMIN_ROLES, 'hr', 'manager']
const FINANCE_ROLES = [...ADMIN_ROLES, 'finance', 'manager']
const SALES_ROLES = [...MANAGER_ROLES, 'sales_executive', 'designer']
const OPERATIONS_ROLES = [...MANAGER_ROLES, 'operations', 'site_engineer']
const PRODUCTION_OPS_ROLES = [...ADMIN_ROLES, 'manager', 'project_manager', 'operations', 'site_engineer']
// Pre-Sales only sees CRM Dashboard, Leads, and Call Activities
const PRE_SALES_RESTRICTED_ROLES = ['pre_sales']

export const navigation = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
    roles: [...ADMIN_ROLES, ...MANAGER_ROLES, ...HR_ROLES, ...FINANCE_ROLES, ...OPERATIONS_ROLES, 'sales_executive', 'designer'], // Pre-Sales cannot see main dashboard
    excludeRoles: ['pre_sales'], // Explicitly exclude pre_sales
  },
  {
    id: 'sales',
    label: 'Sales & CRM',
    icon: TrendingUp,
    roles: [...SALES_ROLES, 'pre_sales'],
    children: [
      { id: 'crm-dashboard', label: 'CRM Dashboard', path: '/admin/crm' },
      { id: 'leads', label: 'Leads', path: '/admin/leads' },
      { id: 'call-activities', label: 'Call Activities', path: '/admin/crm/call-activities' },
      { id: 'customers', label: 'Customers', path: '/admin/customers', roles: SALES_ROLES },
      { id: 'crm-sales-orders', label: 'Sales Orders', path: '/admin/crm/sales-orders', roles: SALES_ROLES },
      { id: 'quotations', label: 'Quotations', path: '/admin/quotations', roles: SALES_ROLES },
      { id: 'boq-generator', label: 'BOQ Generator', path: '/admin/boq-generator', roles: SALES_ROLES },
      { id: 'sales-dispatches', label: 'Dispatches', path: '/admin/sales-dispatches', roles: SALES_ROLES },
      { id: 'lead-scoring', label: 'Lead Scoring', path: '/admin/crm/lead-scoring', roles: MANAGER_ROLES },
      { id: 'surveys', label: 'Surveys', path: '/admin/crm/surveys', roles: MANAGER_ROLES },
      { id: 'crm-approvals', label: 'Approvals', path: '/admin/crm/approvals', roles: SALES_ROLES },
      { id: 'design-iterations', label: 'Design Iterations', path: '/admin/crm/design-iterations', roles: SALES_ROLES },
      { id: 'channel-partners', label: 'Channel Partners', path: '/admin/crm/channel-partners', roles: MANAGER_ROLES },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    icon: ShoppingCart,
    roles: PRODUCTION_OPS_ROLES,
    children: [
      { id: 'vendors', label: 'Vendors', path: '/admin/vendors' },
      { id: 'purchase-requisitions', label: 'Purchase Requisitions', path: '/admin/purchase-requisitions' },
      { id: 'purchase-orders', label: 'Purchase Orders', path: '/admin/purchase-orders' },
      { id: 'grn', label: 'Goods Receipt (GRN)', path: '/admin/goods-receipt' },
      { id: 'vendor-invoices', label: 'Vendor Invoices', path: '/admin/vendor-invoices' },
      { id: 'vendor-payment-milestones', label: 'Vendor Milestones', path: '/admin/vendor-payment-milestones' },
      { id: 'rfq', label: 'RFQ', path: '/admin/rfq' },
      { id: 'vendor-performance', label: 'Vendor Performance', path: '/admin/vendor-performance' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Boxes,
    roles: PRODUCTION_OPS_ROLES,
    children: [
      { id: 'materials', label: 'Materials', path: '/admin/materials' },
      { id: 'stock', label: 'Stock Management', path: '/admin/stock-management' },
      { id: 'stock-movements', label: 'Stock Movements', path: '/admin/stock-movements' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: Briefcase,
    roles: OPERATIONS_ROLES,
    children: [
      { id: 'project-list', label: 'All Projects', path: '/admin/projects' },
      { id: 'project-gantt', label: 'Gantt Chart', path: '/admin/project-gantt' },
      { id: 'project-budget', label: 'Budget & Costing', path: '/admin/project-budget' },
      { id: 'project-timeline', label: 'Timeline', path: '/admin/project-timeline' },
      { id: 'design-p2p-tracker', label: 'P2P Tracker', path: '/admin/design-p2p-tracker' },
      { id: 'qc-master', label: 'QC Master', path: '/admin/qc-master' },
      { id: 'change-orders', label: 'Change Orders', path: '/admin/change-orders' },
      { id: 'risk-register', label: 'Risk Register', path: '/admin/risk-register' },
      { id: 'stock-takes', label: 'Stock Takes', path: '/admin/stock-takes' },
    ],
  },
  {
    id: 'ppc',
    label: 'Production (PPC)',
    icon: Factory,
    roles: PRODUCTION_OPS_ROLES,
    children: [
      { id: 'ppc-dashboard', label: 'PPC Dashboard', path: '/admin/ppc' },
      { id: 'work-orders', label: 'Work Orders', path: '/admin/ppc/work-orders' },
      { id: 'bill-of-materials', label: 'Bill of Materials', path: '/admin/ppc/bom' },
      { id: 'material-requirements', label: 'MRP', path: '/admin/ppc/material-requirements' },
      { id: 'material-issues', label: 'Material Issues', path: '/admin/ppc/material-issues' },
      { id: 'labor-entries', label: 'Labor Tracking', path: '/admin/ppc/labor-entries' },
      { id: 'daily-progress-reports', label: 'Daily Progress', path: '/admin/ppc/daily-progress-reports' },
      { id: 'production-costs', label: 'Production Costs', path: '/admin/ppc/production-costs' },
    ],
  },
  {
    id: 'hr',
    label: 'HR Management',
    icon: UserCircle,
    roles: HR_ROLES,
    children: [
      { id: 'employees', label: 'Employees', path: '/admin/employees' },
      { id: 'departments', label: 'Departments', path: '/admin/departments' },
      { id: 'attendance', label: 'Attendance', path: '/admin/attendance' },
      { id: 'leaves', label: 'Leaves', path: '/admin/leaves' },
      { id: 'reimbursements', label: 'Reimbursements', path: '/admin/reimbursements' },
      { id: 'advance-requests', label: 'Advance Requests', path: '/admin/advance-requests' },
      { id: 'salary', label: 'Salary Management', path: '/admin/salary' },
      { id: 'payroll', label: 'Payroll', path: '/admin/payroll' },
      { id: 'employee-letters', label: 'Employee Letters', path: '/admin/employee-letters' },
      { id: 'assets', label: 'Asset Management', path: '/admin/assets' },
      { id: 'skill-matrix', label: 'Skill Matrix', path: '/admin/skill-matrix' },
      { id: 'exit-management', label: 'Exit Management', path: '/admin/exit-management' },
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Target,
    roles: HR_ROLES,
    children: [
      { id: 'kra-master', label: 'KRA Master', path: '/admin/kra-master' },
      { id: 'kpi-master', label: 'KPI Master', path: '/admin/kpi-master' },
      { id: 'role-templates', label: 'Role Templates', path: '/admin/role-templates' },
      { id: 'performance-reviews', label: 'Reviews', path: '/admin/performance-reviews' },
      { id: 'review-cycles', label: 'Review Cycles', path: '/admin/review-cycles' },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: IndianRupee,
    roles: FINANCE_ROLES,
    children: [
      { id: 'customer-invoices', label: 'Customer Invoices', path: '/admin/customer-invoices' },
      { id: 'payments', label: 'Payments', path: '/admin/payments' },
      { id: 'accounts-receivable', label: 'Accounts Receivable', path: '/admin/accounts-receivable' },
      { id: 'accounts-payable', label: 'Accounts Payable', path: '/admin/accounts-payable' },
      { id: 'bank-reconciliation', label: 'Bank Reconciliation', path: '/admin/bank-reconciliation' },
      { id: 'budget-forecasting', label: 'Budget & Forecast', path: '/admin/budget-forecasting' },
      { id: 'credit-debit-notes', label: 'Credit/Debit Notes', path: '/admin/credit-debit-notes' },
      { id: 'ledger-master', label: 'Ledger Master', path: '/admin/ledger-master' },
      { id: 'ledger-mapping', label: 'Ledger Mapping', path: '/admin/ledger-mapping' },
      { id: 'aging-dashboard', label: 'Aging Dashboard', path: '/admin/aging-dashboard' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: PieChart,
    roles: ADMIN_ROLES,
    children: [
      { id: 'analytics-dashboard', label: 'Overview', path: '/admin/analytics' },
      { id: 'sales-analytics', label: 'Sales Analytics', path: '/admin/analytics/sales' },
      { id: 'finance-analytics', label: 'Finance Analytics', path: '/admin/analytics/finance' },
      { id: 'project-analytics', label: 'Project Analytics', path: '/admin/analytics/projects' },
      { id: 'hr-analytics', label: 'HR Analytics', path: '/admin/analytics/hr' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: Scale,
    roles: ADMIN_ROLES,
    children: [
      { id: 'compliance-dashboard', label: 'Dashboard', path: '/admin/compliance' },
      { id: 'consent-management', label: 'Consent (DPDP)', path: '/admin/compliance/consents' },
      { id: 'data-subject-requests', label: 'Data Requests', path: '/admin/compliance/dsr' },
      { id: 'e-invoices', label: 'E-Invoicing', path: '/admin/compliance/e-invoices' },
      { id: 'gst-returns', label: 'GST Returns', path: '/admin/compliance/gst-returns' },
      { id: 'sod-review', label: 'SoD Review', path: '/admin/compliance/sod' },
      { id: 'access-reviews', label: 'Access Reviews', path: '/admin/compliance/access-reviews' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    path: '/admin/notifications',
    roles: 'all',
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: ClipboardCheck,
    path: '/admin/approvals',
    roles: MANAGER_ROLES,
  },
  {
    id: 'support',
    label: 'Support Tickets',
    icon: HeadphonesIcon,
    roles: 'all', // Everyone can access support tickets
    children: [
      { id: 'all-tickets', label: 'All Tickets', path: '/admin/tickets' },
      { id: 'my-tickets', label: 'My Tickets', path: '/admin/tickets?view=my' },
      { id: 'assigned-tickets', label: 'Assigned to Me', path: '/admin/tickets?view=assigned' },
      { id: 'new-ticket', label: 'Create Ticket', path: '/admin/tickets/new' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: Megaphone,
    roles: SALES_ROLES,
    children: [
      { id: 'mail-templates', label: 'Mail Templates', path: '/admin/mail-templates' },
      { id: 'game-entries', label: 'Game Entries', path: '/admin/game-entries' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    roles: ADMIN_ROLES,
    children: [
      { id: 'users', label: 'Users', path: '/admin/users' },
      { id: 'roles', label: 'Roles & Permissions', path: '/admin/roles-permissions' },
      { id: 'approval-matrix', label: 'Approval Matrix', path: '/admin/approval-matrix' },
      { id: 'profile', label: 'Profile', path: '/admin/profile', roles: 'all' }, // Everyone can access their own profile
      { id: 'audit-trail', label: 'Audit Trail', path: '/admin/audit-trail' },
      { id: 'mdm', label: 'Master Data (MDM)', path: '/admin/mdm' },
      { id: 'callyzer', label: 'Callyzer Integration', path: '/admin/callyzer' },
      { id: 'documents', label: 'Documents', path: '/admin/documents' },
      { id: 'mfa-setup', label: '2FA Setup', path: '/admin/mfa-setup', roles: 'all' },
      { id: 'configuration-master', label: 'Configuration Master', path: '/admin/configuration-master' },
      { id: 'company-master', label: 'Company Master', path: '/admin/company-master' },
    ],
  },
]

// Helper function to check if a user role has access to a menu item
export const hasRoleAccess = (userRole, allowedRoles, excludeRoles = []) => {
  if (!userRole) return false
  const role = userRole.toLowerCase()

  // Check if role is explicitly excluded
  if (Array.isArray(excludeRoles) && excludeRoles.includes(role)) {
    return false
  }

  if (allowedRoles === 'all') return true
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(role)
  }
  return false
}

// Check if user is Pre-Sales role (for dashboard redirect)
export const isPreSalesRole = (userRole) => {
  if (!userRole) return false
  return userRole.toLowerCase() === 'pre_sales'
}

// Get filtered navigation based on user role
export const getFilteredNavigation = (userRole) => {
  if (!userRole) return []

  return navigation.filter(item => {
    // Check if user has access to this menu item (including excludeRoles check)
    if (!hasRoleAccess(userRole, item.roles, item.excludeRoles)) {
      return false
    }
    return true
  }).map(item => {
    // If item has children, filter them too (for items with child-level roles)
    if (item.children) {
      const filteredChildren = item.children.filter(child => {
        // If child has specific roles, check them; otherwise inherit from parent
        if (child.roles) {
          return hasRoleAccess(userRole, child.roles, child.excludeRoles)
        }
        return true
      })
      return { ...item, children: filteredChildren }
    }
    return item
  })
}

// Get flat list of all routes for permission checking
export const getAllRoutes = () => {
  const routes = []
  navigation.forEach((item) => {
    if (item.path) {
      routes.push({ id: item.id, path: item.path, roles: item.roles })
    }
    if (item.children) {
      item.children.forEach((child) => {
        routes.push({ id: child.id, path: child.path, roles: child.roles || item.roles })
      })
    }
  })
  return routes
}
