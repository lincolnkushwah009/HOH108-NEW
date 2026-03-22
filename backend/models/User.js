import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// ============================================
// MODULE PERMISSION DEFINITIONS
// Maps Excel column indices to function slugs
// ============================================
export const MODULE_PERMISSION_MAP = {
  // Column index → { module, key }
  16: { module: 'Sales & CRM', key: 'crm_dashboard' },
  17: { module: 'Sales & CRM', key: 'leads' },
  18: { module: 'Sales & CRM', key: 'call_activities' },
  19: { module: 'Sales & CRM', key: 'customers' },
  20: { module: 'Sales & CRM', key: 'sales_orders' },
  21: { module: 'Sales & CRM', key: 'quotations' },
  22: { module: 'Sales & CRM', key: 'boq_generator' },
  23: { module: 'Sales & CRM', key: 'dispatches' },
  24: { module: 'Sales & CRM', key: 'lead_scoring' },
  25: { module: 'Sales & CRM', key: 'surveys' },
  26: { module: 'Sales & CRM', key: 'sales_approvals' },
  27: { module: 'Sales & CRM', key: 'design_iterations' },
  28: { module: 'Sales & CRM', key: 'channel_partners' },
  29: { module: 'Procurement', key: 'vendors' },
  30: { module: 'Procurement', key: 'purchase_requisitions' },
  31: { module: 'Procurement', key: 'purchase_orders' },
  32: { module: 'Procurement', key: 'goods_receipt_grn' },
  33: { module: 'Procurement', key: 'vendor_invoices' },
  34: { module: 'Procurement', key: 'vendor_milestones' },
  35: { module: 'Procurement', key: 'rfq' },
  36: { module: 'Procurement', key: 'vendor_performance' },
  37: { module: 'Inventory', key: 'materials' },
  38: { module: 'Inventory', key: 'stock_management' },
  39: { module: 'Inventory', key: 'stock_movements' },
  40: { module: 'Projects', key: 'all_projects' },
  41: { module: 'Projects', key: 'gantt_chart' },
  42: { module: 'Projects', key: 'budget_costing' },
  43: { module: 'Projects', key: 'timeline' },
  44: { module: 'Projects', key: 'p2p_tracker' },
  45: { module: 'Projects', key: 'qc_master' },
  46: { module: 'Projects', key: 'change_orders' },
  47: { module: 'Projects', key: 'risk_register' },
  48: { module: 'Projects', key: 'stock_takes' },
  49: { module: 'Production (PPC)', key: 'ppc_dashboard' },
  50: { module: 'Production (PPC)', key: 'work_orders' },
  51: { module: 'Production (PPC)', key: 'bill_of_materials' },
  52: { module: 'Production (PPC)', key: 'mrp' },
  53: { module: 'Production (PPC)', key: 'material_issues' },
  54: { module: 'Production (PPC)', key: 'labor_tracking' },
  55: { module: 'Production (PPC)', key: 'daily_progress' },
  56: { module: 'Production (PPC)', key: 'production_costs' },
  57: { module: 'HR Management', key: 'employees_module' },
  58: { module: 'HR Management', key: 'departments_module' },
  59: { module: 'HR Management', key: 'attendance' },
  60: { module: 'HR Management', key: 'leaves' },
  61: { module: 'HR Management', key: 'reimbursements' },
  62: { module: 'HR Management', key: 'advance_requests' },
  63: { module: 'HR Management', key: 'salary_management' },
  64: { module: 'HR Management', key: 'payroll' },
  65: { module: 'HR Management', key: 'employee_letters' },
  66: { module: 'HR Management', key: 'asset_management' },
  67: { module: 'HR Management', key: 'skill_matrix' },
  68: { module: 'HR Management', key: 'exit_management' },
  69: { module: 'Performance', key: 'kra_master' },
  70: { module: 'Performance', key: 'kpi_master' },
  71: { module: 'Performance', key: 'role_templates' },
  72: { module: 'Performance', key: 'reviews' },
  73: { module: 'Performance', key: 'review_cycles' },
  74: { module: 'Finance', key: 'customer_invoices' },
  75: { module: 'Finance', key: 'payments' },
  76: { module: 'Finance', key: 'accounts_receivable' },
  77: { module: 'Finance', key: 'accounts_payable' },
  78: { module: 'Finance', key: 'bank_reconciliation' },
  79: { module: 'Finance', key: 'budget_forecast' },
  80: { module: 'Finance', key: 'credit_debit_notes' },
  81: { module: 'Finance', key: 'ledger_master' },
  82: { module: 'Finance', key: 'ledger_mapping' },
  83: { module: 'Finance', key: 'aging_dashboard' },
  84: { module: 'Analytics', key: 'analytics_overview' },
  85: { module: 'Analytics', key: 'sales_analytics' },
  86: { module: 'Analytics', key: 'finance_analytics' },
  87: { module: 'Analytics', key: 'project_analytics' },
  88: { module: 'Analytics', key: 'hr_analytics' },
  89: { module: 'Compliance', key: 'compliance_dashboard' },
  90: { module: 'Compliance', key: 'consent_dpdp' },
  91: { module: 'Compliance', key: 'data_requests' },
  92: { module: 'Compliance', key: 'e_invoicing' },
  93: { module: 'Compliance', key: 'gst_returns' },
  94: { module: 'Compliance', key: 'sod_review' },
  95: { module: 'Compliance', key: 'access_reviews' },
  96: { module: 'Notifications', key: 'notifications_module' },
  97: { module: 'Approvals', key: 'approvals_module' },
  98: { module: 'Support Tickets', key: 'all_tickets' },
  99: { module: 'Support Tickets', key: 'my_tickets' },
  100: { module: 'Support Tickets', key: 'assigned_to_me' },
  101: { module: 'Support Tickets', key: 'create_ticket' },
  102: { module: 'Marketing', key: 'mail_templates' },
  103: { module: 'Marketing', key: 'game_entries' }
}

// All module permission keys (for iteration)
export const ALL_MODULE_PERMISSION_KEYS = Object.values(MODULE_PERMISSION_MAP).map(v => v.key)

// ============================================
// ONBOARDING CHECKLIST TEMPLATE (Indian Compliance)
// ============================================
export const ONBOARDING_CHECKLIST_TEMPLATE = [
  // --- IDENTITY (KYC) ---
  { category: 'identity', name: 'Aadhar Card', documentType: 'aadhar_card', isMandatory: true },
  { category: 'identity', name: 'PAN Card', documentType: 'pan_card', isMandatory: true },
  { category: 'identity', name: 'Passport Size Photo', documentType: 'photo', isMandatory: true },
  { category: 'identity', name: 'Passport', documentType: 'passport', isMandatory: false },

  // --- EMPLOYMENT ---
  { category: 'employment', name: 'Resume / CV', documentType: 'resume', isMandatory: true },
  { category: 'employment', name: 'Signed Offer Letter', documentType: 'offer_letter', isMandatory: true },
  { category: 'employment', name: 'Relieving Letter (Previous)', documentType: 'relieving_letter_prev', isMandatory: true },
  { category: 'employment', name: 'Experience Letter (Previous)', documentType: 'experience_letter_prev', isMandatory: true },
  { category: 'employment', name: 'Last 3 Months Salary Slips', documentType: 'salary_slip_prev', isMandatory: true },
  { category: 'employment', name: 'NDA Signed', documentType: 'nda_signed', isMandatory: true },
  { category: 'employment', name: 'Code of Conduct Signed', documentType: 'code_of_conduct_signed', isMandatory: true },

  // --- EDUCATION ---
  { category: 'education', name: '10th Marksheet', documentType: 'education_certificate_10th', isMandatory: true },
  { category: 'education', name: '12th Marksheet', documentType: 'education_certificate_12th', isMandatory: true },
  { category: 'education', name: 'Graduation Certificate', documentType: 'education_certificate_graduation', isMandatory: true },
  { category: 'education', name: 'Post-Graduation (if applicable)', documentType: 'education_certificate_post_graduation', isMandatory: false },

  // --- BANKING ---
  { category: 'banking', name: 'Bank Passbook (First Page)', documentType: 'bank_passbook', isMandatory: true },
  { category: 'banking', name: 'Cancelled Cheque', documentType: 'cancelled_cheque', isMandatory: true },

  // --- STATUTORY (PF / ESI / Gratuity) ---
  { category: 'statutory', name: 'EPF Form 11 (New Member)', documentType: 'form_11', isMandatory: true },
  { category: 'statutory', name: 'EPF Form 2 (Nomination)', documentType: 'form_2_nomination', isMandatory: true },
  { category: 'statutory', name: 'Gratuity Form F (Nomination)', documentType: 'gratuity_nomination', isMandatory: true },
  { category: 'statutory', name: 'PF Transfer Form 13 (if applicable)', documentType: 'pf_transfer_form_13', isMandatory: false },
  { category: 'statutory', name: 'UAN Card (if existing)', documentType: 'uan_card', isMandatory: false },
  { category: 'statutory', name: 'ESIC Form (if applicable)', documentType: 'esic_form', isMandatory: false },

  // --- TAX (IT Declaration) ---
  { category: 'tax', name: 'Form 12BB (Investment Declaration)', documentType: 'form_12bb', isMandatory: true },
  { category: 'tax', name: 'Tax Regime Declaration (Old/New)', documentType: 'tax_regime_declaration', isMandatory: true },
  { category: 'tax', name: 'Form 16 from Previous Employer', documentType: 'form_16', isMandatory: false },
  { category: 'tax', name: 'Address Proof (Current)', documentType: 'address_proof', isMandatory: true },

  // --- BACKGROUND VERIFICATION ---
  { category: 'bgv', name: 'Background Verification Report', documentType: 'background_verification', isMandatory: true },
  { category: 'bgv', name: 'Medical Fitness Certificate', documentType: 'medical_certificate', isMandatory: true },
  { category: 'bgv', name: 'Police Verification (if applicable)', documentType: 'police_verification', isMandatory: false },
]

// ============================================
// IT RETURNS DOCUMENT CHECKLIST (per Financial Year)
// ============================================
export const IT_RETURNS_CHECKLIST = [
  // Employer must issue/collect these
  { name: 'Form 12BB - Investment Declaration', documentType: 'form_12bb', isMandatory: true, deadline: 'April (start of FY)', issuedBy: 'employee' },
  { name: 'Tax Regime Declaration', documentType: 'tax_regime_declaration', isMandatory: true, deadline: 'April (start of FY)', issuedBy: 'employee' },
  { name: 'IT Declaration (Provisional)', documentType: 'it_declaration', isMandatory: true, deadline: 'April', issuedBy: 'employee' },
  { name: 'IT Declaration (Revised)', documentType: 'it_declaration_revised', isMandatory: false, deadline: 'October', issuedBy: 'employee' },
  { name: 'Investment Proofs Submission', documentType: 'it_declaration_final', isMandatory: true, deadline: 'January 31', issuedBy: 'employee' },

  // Section 80C Proofs
  { name: 'LIC Premium Receipt', documentType: 'proof_80c_lic', isMandatory: false, section: '80C', maxLimit: 150000 },
  { name: 'PPF Passbook/Receipt', documentType: 'proof_80c_ppf', isMandatory: false, section: '80C', maxLimit: 150000 },
  { name: 'ELSS Fund Statement', documentType: 'proof_80c_elss', isMandatory: false, section: '80C', maxLimit: 150000 },
  { name: 'NPS Statement', documentType: 'proof_80c_nps', isMandatory: false, section: '80CCD(1B)', maxLimit: 50000 },
  { name: 'Children Tuition Fee Receipt', documentType: 'proof_80c_tuition_fees', isMandatory: false, section: '80C', maxLimit: 150000 },
  { name: 'Home Loan Principal Certificate', documentType: 'proof_80c_home_loan_principal', isMandatory: false, section: '80C', maxLimit: 150000 },

  // Section 80D
  { name: 'Health Insurance Premium (Self)', documentType: 'proof_80d_health_insurance', isMandatory: false, section: '80D', maxLimit: 25000 },
  { name: 'Health Insurance Premium (Parents)', documentType: 'proof_80d_parents_health', isMandatory: false, section: '80D', maxLimit: 50000 },

  // Section 24(b)
  { name: 'Home Loan Interest Certificate', documentType: 'proof_24b_home_loan_interest', isMandatory: false, section: '24(b)', maxLimit: 200000 },
  { name: 'Home Loan Sanction Letter', documentType: 'proof_home_loan_sanction', isMandatory: false, section: '24(b)' },

  // HRA
  { name: 'Rent Receipts (Monthly)', documentType: 'proof_hra_rent_receipt', isMandatory: false, section: '10(13A)' },
  { name: 'Rental Agreement', documentType: 'proof_hra_rental_agreement', isMandatory: false, section: '10(13A)' },
  { name: 'Landlord PAN (if rent > 1L/year)', documentType: 'proof_hra_landlord_pan', isMandatory: false, section: '10(13A)' },

  // Employer-issued
  { name: 'Form 16 (TDS Certificate)', documentType: 'form_16_generated', isMandatory: true, deadline: 'June 15', issuedBy: 'employer' },
  { name: 'Form 16 Part A (from TRACES)', documentType: 'form_16_part_a', isMandatory: true, deadline: 'June 15', issuedBy: 'employer' },
  { name: 'Form 16 Part B (Annexure)', documentType: 'form_16_part_b', isMandatory: true, deadline: 'June 15', issuedBy: 'employer' },
  { name: 'Form 12BA (Perquisites)', documentType: 'form_12ba', isMandatory: false, deadline: 'June 15', issuedBy: 'employer' },
  { name: 'Form 26AS / AIS Download', documentType: 'form_26as', isMandatory: true, deadline: 'Before ITR filing', issuedBy: 'IT Department' },

  // Employee ITR
  { name: 'ITR Acknowledgment', documentType: 'itr_acknowledgment', isMandatory: true, deadline: 'July 31', issuedBy: 'employee' },
]

// Module grouping for UI display
export const MODULE_GROUPS = {
  'Sales & CRM': ['crm_dashboard', 'leads', 'call_activities', 'customers', 'sales_orders', 'quotations', 'boq_generator', 'dispatches', 'lead_scoring', 'surveys', 'sales_approvals', 'design_iterations', 'channel_partners'],
  'Procurement': ['vendors', 'purchase_requisitions', 'purchase_orders', 'goods_receipt_grn', 'vendor_invoices', 'vendor_milestones', 'rfq', 'vendor_performance'],
  'Inventory': ['materials', 'stock_management', 'stock_movements'],
  'Projects': ['all_projects', 'gantt_chart', 'budget_costing', 'timeline', 'p2p_tracker', 'qc_master', 'change_orders', 'risk_register', 'stock_takes'],
  'Production (PPC)': ['ppc_dashboard', 'work_orders', 'bill_of_materials', 'mrp', 'material_issues', 'labor_tracking', 'daily_progress', 'production_costs'],
  'HR Management': ['employees_module', 'departments_module', 'attendance', 'leaves', 'reimbursements', 'advance_requests', 'salary_management', 'payroll', 'employee_letters', 'asset_management', 'skill_matrix', 'exit_management'],
  'Performance': ['kra_master', 'kpi_master', 'role_templates', 'reviews', 'review_cycles'],
  'Finance': ['customer_invoices', 'payments', 'accounts_receivable', 'accounts_payable', 'bank_reconciliation', 'budget_forecast', 'credit_debit_notes', 'ledger_master', 'ledger_mapping', 'aging_dashboard'],
  'Analytics': ['analytics_overview', 'sales_analytics', 'finance_analytics', 'project_analytics', 'hr_analytics'],
  'Compliance': ['compliance_dashboard', 'consent_dpdp', 'data_requests', 'e_invoicing', 'gst_returns', 'sod_review', 'access_reviews'],
  'Notifications': ['notifications_module'],
  'Approvals': ['approvals_module'],
  'Support Tickets': ['all_tickets', 'my_tickets', 'assigned_to_me', 'create_ticket'],
  'Marketing': ['mail_templates', 'game_entries']
}

// Permission definitions for RBAC
export const PERMISSIONS = {
  // Lead permissions
  LEADS_VIEW: 'leads:view',
  LEADS_VIEW_ALL: 'leads:view_all',
  LEADS_VIEW_ASSIGNED: 'leads:view_assigned',
  LEADS_CREATE: 'leads:create',
  LEADS_EDIT: 'leads:edit',
  LEADS_DELETE: 'leads:delete',
  LEADS_ASSIGN: 'leads:assign',
  LEADS_CONVERT: 'leads:convert',
  LEADS_EXPORT: 'leads:export',
  LEADS_IMPORT: 'leads:import',

  // Customer permissions
  CUSTOMERS_VIEW: 'customers:view',
  CUSTOMERS_VIEW_ALL: 'customers:view_all',
  CUSTOMERS_VIEW_ASSIGNED: 'customers:view_assigned',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_EDIT: 'customers:edit',
  CUSTOMERS_DELETE: 'customers:delete',
  CUSTOMERS_EXPORT: 'customers:export',

  // Project permissions
  PROJECTS_VIEW: 'projects:view',
  PROJECTS_VIEW_ALL: 'projects:view_all',
  PROJECTS_VIEW_ASSIGNED: 'projects:view_assigned',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_EDIT: 'projects:edit',
  PROJECTS_DELETE: 'projects:delete',
  PROJECTS_MANAGE_TEAM: 'projects:manage_team',
  PROJECTS_MANAGE_FINANCIALS: 'projects:manage_financials',
  PROJECTS_EXPORT: 'projects:export',

  // User management permissions
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE_ROLES: 'users:manage_roles',

  // Company permissions
  COMPANY_VIEW: 'company:view',
  COMPANY_EDIT: 'company:edit',
  COMPANY_MANAGE_SETTINGS: 'company:manage_settings',
  COMPANY_MANAGE_PIPELINES: 'company:manage_pipelines',

  // Reports & Analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_VIEW: 'analytics:view',
  DASHBOARD_VIEW: 'dashboard:view',

  // Cross-company access (for mother company)
  CROSS_COMPANY_VIEW: 'cross_company:view',
  CROSS_COMPANY_MANAGE: 'cross_company:manage',

  // Alerts & Notifications
  ALERTS_VIEW: 'alerts:view',
  ALERTS_MANAGE: 'alerts:manage',
  NOTIFICATIONS_VIEW: 'notifications:view',

  // KPI & Performance
  KPI_VIEW: 'kpi:view',
  KPI_MANAGE: 'kpi:manage',
  PERFORMANCE_VIEW: 'performance:view',
  PERFORMANCE_VIEW_ALL: 'performance:view_all',

  // Automation
  AUTOMATION_VIEW: 'automation:view',
  AUTOMATION_MANAGE: 'automation:manage'
}

// Role definitions with their permissions
export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS), // All permissions

  company_admin: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_DELETE, PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.LEADS_CONVERT, PERMISSIONS.LEADS_EXPORT, PERMISSIONS.LEADS_IMPORT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL, PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_EDIT, PERMISSIONS.CUSTOMERS_DELETE, PERMISSIONS.CUSTOMERS_EXPORT,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT, PERMISSIONS.PROJECTS_DELETE, PERMISSIONS.PROJECTS_MANAGE_TEAM,
    PERMISSIONS.PROJECTS_MANAGE_FINANCIALS, PERMISSIONS.PROJECTS_EXPORT,
    PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE, PERMISSIONS.USERS_MANAGE_ROLES,
    PERMISSIONS.COMPANY_VIEW, PERMISSIONS.COMPANY_EDIT, PERMISSIONS.COMPANY_MANAGE_SETTINGS,
    PERMISSIONS.COMPANY_MANAGE_PIPELINES,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT, PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    // Admin permissions for alerts, KPI, performance, automation
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.ALERTS_MANAGE, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.KPI_MANAGE,
    PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL,
    PERMISSIONS.AUTOMATION_VIEW, PERMISSIONS.AUTOMATION_MANAGE
  ],

  sales_manager: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN, PERMISSIONS.LEADS_CONVERT,
    PERMISSIONS.LEADS_EXPORT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL, PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    // Manager permissions for alerts and performance
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL
  ],

  sales_executive: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN, PERMISSIONS.LEADS_CONVERT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  pre_sales: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  project_manager: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT, PERMISSIONS.PROJECTS_MANAGE_TEAM, PERMISSIONS.PROJECTS_MANAGE_FINANCIALS,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL
  ],

  site_engineer: [
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  designer: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  operations: [
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  finance: [
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_MANAGE_FINANCIALS,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.REPORTS_EXPORT, PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  viewer: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW
  ],

  // --- New roles from Roles & Permission matrix ---

  hr: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.PERFORMANCE_VIEW
  ],

  hr_head: [
    PERMISSIONS.USERS_VIEW, PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_EDIT,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.KPI_MANAGE,
    PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL
  ],

  manager: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL
  ],

  architect: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  agm_business: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN, PERMISSIONS.LEADS_CONVERT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL, PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT, PERMISSIONS.PROJECTS_MANAGE_TEAM,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL
  ],

  agm_operations: [
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT, PERMISSIONS.PROJECTS_MANAGE_TEAM, PERMISSIONS.PROJECTS_MANAGE_FINANCIALS,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL
  ],

  agm_sales: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN, PERMISSIONS.LEADS_CONVERT,
    PERMISSIONS.LEADS_EXPORT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL, PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL
  ],

  community_manager: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED, PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  assoc_community_manager: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  drm: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  assoc_drm: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  business_ops_lead: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_EDIT, PERMISSIONS.PROJECTS_MANAGE_TEAM,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW, PERMISSIONS.PERFORMANCE_VIEW_ALL
  ],

  it_admin: [
    ...Object.values(PERMISSIONS) // IT/CTO gets full system access
  ],

  mmt_technician: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW
  ],

  channel_partner_manager: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT, PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  procurement_manager: [
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.KPI_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ],

  quality_controller: [
    PERMISSIONS.PROJECTS_VIEW, PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.CUSTOMERS_VIEW, PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ALERTS_VIEW, PERMISSIONS.NOTIFICATIONS_VIEW, PERMISSIONS.PERFORMANCE_VIEW
  ]
}

const userSchema = new mongoose.Schema({
  // Auto-generated User ID (e.g., IP-U-2024-00001)
  userId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Basic Info
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },

  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },

  phone: {
    type: String,
    maxlength: [15, 'Phone number cannot be longer than 15 characters']
  },

  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },

  // ===========================================
  // SOX Control: ITGC-004 Password Policy
  // ===========================================
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  passwordExpiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
  },
  passwordHistory: [{
    hash: { type: String, select: false },
    changedAt: { type: Date, default: Date.now }
  }],
  mustChangePassword: {
    type: Boolean,
    default: false
  },

  // ===========================================
  // SOX Control: ITGC-004 Account Lockout
  // ===========================================
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockoutUntil: {
    type: Date
  },
  lastFailedLoginAt: {
    type: Date
  },
  lastFailedLoginIP: {
    type: String
  },

  avatar: {
    type: String,
    default: ''
  },

  // Company Association
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required'],
    index: true
  },

  // Multi-company access (for super_admin or cross-company users)
  additionalCompanies: [{
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    role: {
      type: String,
      enum: [
        'viewer', 'company_admin', 'sales_manager', 'sales_executive', 'pre_sales',
        'project_manager', 'site_engineer', 'designer', 'operations', 'finance',
        'super_admin', 'hr', 'hr_head', 'manager', 'architect', 'agm_business',
        'agm_operations', 'agm_sales', 'community_manager', 'assoc_community_manager',
        'drm', 'assoc_drm', 'business_ops_lead', 'it_admin', 'mmt_technician',
        'channel_partner_manager', 'procurement_manager', 'quality_controller'
      ],
      default: 'viewer'
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Enhanced Role System
  role: {
    type: String,
    enum: [
      'super_admin',          // Full system access (Hancet Globe level)
      'company_admin',        // Full access within their company
      'sales_manager',        // Manages sales team, full lead access
      'sales_executive',      // Works on assigned leads
      'pre_sales',            // Pre-sales team member
      'project_manager',      // Manages projects and teams
      'site_engineer',        // On-site project execution
      'designer',             // Design team member
      'operations',           // Operations team
      'finance',              // Finance team
      'viewer',               // Read-only access
      // --- New roles from Roles & Permission matrix ---
      'hr',                   // HR Executive
      'hr_head',              // HR Head / Manager
      'manager',              // General Manager / AGM
      'architect',            // Architect
      'agm_business',         // Associate General Manager - Business
      'agm_operations',       // Associate General Manager - Operations
      'agm_sales',            // Associate General Manager - Sales
      'community_manager',    // Community Manager
      'assoc_community_manager', // Associate Community Manager
      'drm',                  // Design Relationship Manager
      'assoc_drm',            // Associate Design Relationship Manager
      'business_ops_lead',    // Business Operations Lead
      'it_admin',             // Information Technology / CTO
      'mmt_technician',       // MMT (Measurement) Technician
      'channel_partner_manager', // Manager - Channel Partner
      'procurement_manager',  // Procurement Manager / Executive
      'quality_controller'    // Quality Controller
    ],
    default: 'viewer'
  },

  // Reference to custom Role (for permissions)
  userRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  },

  // Legacy role support
  legacyRole: {
    type: String,
    enum: ['user', 'admin', 'superadmin']
  },

  // Department/Team
  department: {
    type: String,
    default: 'sales'
  },

  // Sub-Department (for CRM workflow)
  subDepartment: {
    type: String,
    enum: ['pre_sales', 'crm', 'sales_closure', 'design', 'operations', 'finance', 'management', 'approval']
  },

  designation: {
    type: String // Job title
  },

  // Callyzer Integration
  callyzerEmployeeNumber: {
    type: String // Employee number in Callyzer app for call tracking sync
  },

  // Phone number change history (for pre-sales spam number changes)
  previousNumbers: [{
    number: String,
    changedAt: { type: Date, default: Date.now },
    reason: String
  }],

  // ============================================
  // APPROVAL AUTHORITY (for Master Agreement)
  // ============================================
  approvalAuthority: {
    isApprover: {
      type: Boolean,
      default: false
    },
    approverRole: {
      type: String,
      enum: ['cbo', 'ceo', 'design_head', 'operations_head', 'finance_head']
    },
    canApprove: [{
      type: String,
      enum: ['material_quotation', 'material_spend', 'payment_schedule', 'schedule_of_work']
    }],
    approvalLimit: Number, // Max amount they can approve (optional)
    autoNotify: {
      type: Boolean,
      default: true
    }
  },

  // Lead Assignment Capacity
  leadCapacity: {
    maxActive: {
      type: Number,
      default: 50
    },
    currentActive: {
      type: Number,
      default: 0
    }
  },

  // Manager/Reporting structure
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Permission Overrides (for special cases)
  permissionOverrides: {
    granted: [{
      type: String // Additional permissions granted
    }],
    revoked: [{
      type: String // Permissions revoked from role
    }]
  },

  // Work Assignment
  assignedLeads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  }],

  assignedProjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  }],

  assignedCustomers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }],

  // Performance Metrics
  metrics: {
    leadsAssigned: { type: Number, default: 0 },
    leadsConverted: { type: Number, default: 0 },
    projectsCompleted: { type: Number, default: 0 },
    activeProjects: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },

  // Karma/Gamification (preserved from original)
  karmaPoints: {
    type: Number,
    default: 0
  },

  // Notification Preferences
  notifications: {
    email: {
      leadAssigned: { type: Boolean, default: true },
      leadUpdated: { type: Boolean, default: true },
      projectUpdated: { type: Boolean, default: true },
      paymentReceived: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: false }
    },
    push: {
      enabled: { type: Boolean, default: true }
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Flag to distinguish employees from other system users
  isEmployee: {
    type: Boolean,
    default: true
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  // Session Info
  lastLogin: {
    type: Date
  },

  lastActiveAt: {
    type: Date
  },

  loginHistory: [{
    timestamp: Date,
    ip: String,
    userAgent: String
  }],

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Invitation (for new users invited by admin)
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  invitedAt: Date,

  inviteToken: String,
  inviteTokenExpire: Date,

  // Source Website
  websiteSource: {
    type: String,
    default: 'HOH108'
  },

  // ============================================
  // EMPLOYEE MASTER FIELDS (from Roles & Permission sheet)
  // ============================================
  empId: {
    type: String, // e.g., HOHIP001
    sparse: true,
    index: true
  },

  systemRole: {
    type: String // e.g., "Group CEO", "Director", "Associate Sales Manager"
  },

  entity: {
    type: String,
    enum: ['IP', 'HOH', 'Both', 'None'],
    default: 'IP'
  },

  branch: {
    type: String // e.g., "HSR", "Horamavu", "Hyderabad", "Mysore"
  },

  region: {
    type: String // e.g., "Karnataka", "Telangana"
  },

  // ============================================
  // GRANULAR MODULE PERMISSIONS (View/Edit per function)
  // Populated from Roles & Permission Excel sheet
  // Each key is a function slug, value is { view: Boolean, edit: Boolean }
  // ============================================
  modulePermissions: {
    // ---- Sales & CRM ----
    crm_dashboard:      { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    leads:              { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    call_activities:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    customers:          { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    sales_orders:       { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    quotations:         { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    boq_generator:      { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    dispatches:         { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    lead_scoring:       { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    surveys:            { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    sales_approvals:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    design_iterations:  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    channel_partners:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Procurement ----
    vendors:              { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    purchase_requisitions:{ view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    purchase_orders:      { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    goods_receipt_grn:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    vendor_invoices:      { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    vendor_milestones:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    rfq:                  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    vendor_performance:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Inventory ----
    materials:        { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    stock_management: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    stock_movements:  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Projects ----
    all_projects:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    gantt_chart:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    budget_costing: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    timeline:       { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    p2p_tracker:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    qc_master:      { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    change_orders:  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    risk_register:  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    stock_takes:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Production (PPC) ----
    ppc_dashboard:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    work_orders:      { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    bill_of_materials:{ view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    mrp:              { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    material_issues:  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    labor_tracking:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    daily_progress:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    production_costs: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- HR Management ----
    employees_module:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    departments_module: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    attendance:         { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    leaves:             { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    reimbursements:     { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    advance_requests:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    salary_management:  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    payroll:            { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    employee_letters:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    asset_management:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    skill_matrix:       { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    exit_management:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Performance ----
    kra_master:     { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    kpi_master:     { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    role_templates: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    reviews:        { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    review_cycles:  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Finance ----
    customer_invoices:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    payments:             { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    accounts_receivable:  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    accounts_payable:     { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    bank_reconciliation:  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    budget_forecast:      { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    credit_debit_notes:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    ledger_master:        { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    ledger_mapping:       { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    aging_dashboard:      { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Analytics ----
    analytics_overview:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    sales_analytics:      { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    finance_analytics:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    project_analytics:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    hr_analytics:         { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Compliance ----
    compliance_dashboard: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    consent_dpdp:         { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    data_requests:        { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    e_invoicing:          { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    gst_returns:          { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    sod_review:           { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    access_reviews:       { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Notifications ----
    notifications_module: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Approvals ----
    approvals_module:     { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Support Tickets ----
    all_tickets:    { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    my_tickets:     { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    assigned_to_me: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    create_ticket:  { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },

    // ---- Marketing ----
    mail_templates: { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } },
    game_entries:   { view: { type: Boolean, default: false }, edit: { type: Boolean, default: false } }
  },

  // ============================================
  // HR DETAILS & EMPLOYEE LIFECYCLE
  // ============================================
  hrDetails: {
    // Personal Information
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: { type: String },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    nationality: { type: String, default: 'Indian' },

    // Address
    permanentAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    currentAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },

    // Emergency Contact
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      address: String
    },

    // Employment Details
    dateOfJoining: { type: Date },
    probationEndDate: { type: Date },
    confirmationDate: { type: Date },
    employmentType: {
      type: String,
      enum: ['probation', 'permanent', 'contract', 'intern', 'consultant'],
      default: 'probation'
    },

    // Location/Assignment
    city: { type: String },
    showroom: { type: String },
    branchCode: { type: String },

    // Experience
    previousExperience: { type: Number, default: 0 }, // in months
    totalExperience: { type: Number, default: 0 }, // in months

    // Exit Details
    dateOfExit: { type: Date },
    exitReason: { type: String },
    lastWorkingDay: { type: Date },
    isRehired: { type: Boolean, default: false }
  },

  // ===========================================
  // SOX Control: HTR-009 Offboarding Reference
  // ===========================================
  offboarding: {
    checklist: { type: mongoose.Schema.Types.ObjectId, ref: 'OffboardingChecklist' },
    clearanceStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'in_progress', 'cleared'],
      default: 'not_applicable'
    },
    accessRevocationStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'partial', 'complete'],
      default: 'not_applicable'
    },
    exitDate: Date
  },

  // ============================================
  // EMPLOYEE DOCUMENTS (T-2 and others)
  // ============================================
  documents: [{
    documentType: {
      type: String,
      enum: [
        // ============================================
        // MANDATORY ONBOARDING DOCUMENTS (Indian Compliance)
        // ============================================

        // --- Identity Proof (KYC) ---
        'aadhar_card',                     // Aadhar Card (UID) - MANDATORY for PF/ESI
        'pan_card',                        // PAN Card - MANDATORY for TDS
        'passport',                        // Passport (if available)
        'voter_id',                        // Voter ID
        'driving_license',                 // Driving License

        // --- Photographs ---
        'photo',                           // Passport-size photograph
        'photo_with_family',               // Family photo (for records)

        // --- Employment Documents ---
        'resume',                          // Resume / CV
        'offer_letter',                    // Offer Letter (company issued)
        'appointment_letter',              // Appointment Letter (company issued)
        'joining_letter',                  // Joining Report
        'relieving_letter_prev',           // Relieving Letter from previous employer - MANDATORY
        'experience_letter_prev',          // Experience Letter from previous employer
        'salary_slip_prev',               // Last 3 months salary slips - MANDATORY for BGV
        'nda_signed',                      // Non-Disclosure Agreement
        'code_of_conduct_signed',          // Company Code of Conduct acknowledgment

        // --- Education Certificates ---
        'education_certificate_10th',      // 10th Marksheet - MANDATORY
        'education_certificate_12th',      // 12th Marksheet - MANDATORY
        'education_certificate_graduation', // Degree Certificate - MANDATORY
        'education_certificate_post_graduation', // PG Degree (if applicable)
        'education_certificate_other',     // Diploma / Professional certification

        // --- Address Proof ---
        'address_proof',                   // Current address proof
        'address_proof_permanent',         // Permanent address proof

        // --- Banking ---
        'bank_passbook',                   // Bank Passbook first page - MANDATORY for salary
        'cancelled_cheque',                // Cancelled cheque - MANDATORY for salary

        // --- Background Verification (BGV) ---
        'background_verification',         // BGV Report
        'police_verification',             // Police Verification Certificate
        'reference_check',                 // Reference check report
        'medical_certificate',             // Medical fitness certificate
        'drug_test_report',                // Drug test (if required)

        // --- Statutory Forms (PF / ESI / Gratuity) ---
        'pf_form',                         // EPF Form (Composite Declaration)
        'esic_form',                       // ESIC Form 1 (IP details)
        'form_11',                         // EPF Form 11 (New member declaration) - MANDATORY
        'form_2_nomination',               // EPF Form 2 (Nomination) - MANDATORY
        'gratuity_nomination',             // Form F (Gratuity Nomination) - MANDATORY
        'form_f_gratuity',                 // Gratuity Form F
        'pf_transfer_form_13',             // Form 13 (PF Transfer from previous employer)
        'uan_card',                        // Universal Account Number card

        // ============================================
        // INCOME TAX & TDS DOCUMENTS (Indian Compliance)
        // ============================================

        // --- IT Declaration ---
        'form_12bb',                       // Form 12BB - Investment Declaration - MANDATORY for TDS
        'it_declaration',                  // Annual IT Declaration (start of FY)
        'it_declaration_revised',          // Revised IT Declaration (mid-year)
        'it_declaration_final',            // Final IT Proofs (Jan-Feb)

        // --- Section 80C Investment Proofs ---
        'proof_80c_lic',                   // LIC Premium receipts
        'proof_80c_ppf',                   // PPF Passbook / receipts
        'proof_80c_elss',                  // ELSS Mutual Fund statement
        'proof_80c_nps',                   // NPS Contribution (80CCD)
        'proof_80c_tuition_fees',          // Children tuition fees receipts
        'proof_80c_home_loan_principal',   // Home loan principal repayment
        'proof_80c_sukanya',               // Sukanya Samriddhi Account
        'proof_80c_fixed_deposit',         // 5-year Tax Saving FD receipt
        'proof_80c_nsc',                   // National Savings Certificate

        // --- Section 80D Medical Insurance ---
        'proof_80d_health_insurance',      // Mediclaim / Health Insurance premium receipt
        'proof_80d_parents_health',        // Parents health insurance
        'proof_80d_preventive_checkup',    // Preventive health checkup bills

        // --- Section 24(b) Home Loan Interest ---
        'proof_24b_home_loan_interest',    // Home loan interest certificate
        'proof_24b_home_loan_certificate', // Lender certificate (provisional/actual)
        'proof_home_possession',           // Property possession letter
        'proof_home_loan_sanction',        // Home loan sanction letter

        // --- HRA Exemption (Section 10(13A)) ---
        'proof_hra_rent_receipt',          // Monthly rent receipts
        'proof_hra_rental_agreement',      // Rental agreement
        'proof_hra_landlord_pan',          // Landlord PAN (if rent > 1L/year)

        // --- Other IT Sections ---
        'proof_80e_education_loan',        // Education loan interest certificate
        'proof_80g_donations',             // Donation receipts (80G)
        'proof_80tta_savings_interest',    // Savings account interest certificate
        'proof_80ee_first_home',           // First-time home buyer extra deduction
        'proof_80dd_disabled_dependent',   // Disability certificate for dependent
        'proof_80ddb_medical_treatment',   // Medical treatment bills (specified diseases)
        'proof_80u_own_disability',        // Own disability certificate

        // --- Form 16 & IT Returns ---
        'form_16',                         // Form 16 (TDS Certificate) - MANDATORY to issue
        'form_16_part_a',                  // Form 16 Part A (TRACES)
        'form_16_part_b',                  // Form 16 Part B (Annexure)
        'form_12ba',                       // Statement of Perquisites (if applicable)
        'itr_acknowledgment',              // ITR filing acknowledgment
        'itr_form',                        // ITR Form (ITR-1/ITR-2)
        'form_26as',                       // Tax Credit Statement (26AS / AIS)
        'ais_tis',                         // Annual Information Statement / TIS

        // --- TDS Related ---
        'form_15g',                        // Form 15G (no TDS on interest - below threshold)
        'form_15h',                        // Form 15H (no TDS - senior citizen)
        'tds_challan',                     // TDS Challan (26QB/26QC)
        'tax_regime_declaration',          // Old vs New Tax Regime declaration

        // ============================================
        // COMPANY GENERATED DOCUMENTS
        // ============================================
        'relieving_letter',
        'experience_letter',
        'bonafide_certificate',
        'salary_certificate',
        'noc_letter',
        'appraisal_letter',
        'increment_letter',
        'warning_letter',
        'show_cause_notice',
        'termination_letter',
        'full_and_final_statement',
        'form_16_generated',              // Company-generated Form 16

        // Other
        'other'
      ],
      required: true
    },
    documentName: { type: String, required: true },
    documentNumber: String, // For ID proofs
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    issuedDate: Date,
    expiryDate: Date,
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: String
  }],

  // Document Verification Status
  documentVerificationStatus: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'complete', 'rejected'],
      default: 'pending'
    },
    requiredDocuments: [{
      documentType: String,
      isSubmitted: { type: Boolean, default: false },
      isVerified: { type: Boolean, default: false }
    }],
    lastUpdated: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // ============================================
  // SALARY STRUCTURE (Indian Payroll)
  // ============================================
  salary: {
    // Basic Components
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 }, // House Rent Allowance
    otherAllowances: { type: Number, default: 0 },

    // Calculated - Gross Salary = Basic + HRA + Other Allowances
    grossSalary: { type: Number, default: 0 },

    // Employee Deductions
    deductions: {
      epfoEmployee: { type: Number, default: 0 }, // 12% of Basic
      esicEmployee: { type: Number, default: 0 }, // 0.75% of Gross (if applicable)
      professionalTax: { type: Number, default: 0 }, // State-wise PT
      incomeTax: { type: Number, default: 0 }, // TDS
      otherDeductions: { type: Number, default: 0 }
    },

    // Net Salary = Gross - All Deductions
    netSalaryBeforeIT: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },

    // Employer Contributions
    employerContributions: {
      epfoEmployer: { type: Number, default: 0 }, // 12% of Basic (3.67% EPF + 8.33% EPS)
      esicEmployer: { type: Number, default: 0 }, // 3.25% of Gross (if applicable)
      gratuity: { type: Number, default: 0 }, // Optional
      otherContributions: { type: Number, default: 0 }
    },

    // Cost to Company = Gross + Employer Contributions
    ctc: { type: Number, default: 0 },

    // Configuration
    config: {
      epfoApplicable: { type: Boolean, default: true },
      esicApplicable: { type: Boolean, default: false }, // Applicable if Gross <= 21000
      ptState: { type: String, default: 'Maharashtra' }, // For PT calculation
      pfAccountNumber: String,
      uanNumber: String,
      esicNumber: String,
      panNumber: String,
      bankAccountNumber: String,
      bankName: String,
      ifscCode: String
    },

    // Salary History
    history: [{
      effectiveFrom: { type: Date },
      effectiveTo: { type: Date },
      basicSalary: Number,
      grossSalary: Number,
      ctc: Number,
      reason: String, // 'joining', 'increment', 'promotion', 'revision'
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }],

    lastUpdated: { type: Date }
  },

  // ============================================
  // INCOME TAX & TDS COMPLIANCE (Indian)
  // ============================================
  taxDeclaration: {
    // Financial Year
    financialYear: { type: String, default: '2025-26' },
    assessmentYear: { type: String, default: '2026-27' },

    // Tax Regime Selection
    taxRegime: {
      type: String,
      enum: ['old', 'new'],
      default: 'new'  // New regime is default from FY 2023-24
    },
    regimeLocked: { type: Boolean, default: false }, // Once locked, cannot change in same FY

    // Section 80C (Max 1,50,000)
    section80C: {
      lic: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      ppf: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      elss: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      nps: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      tuitionFees: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      homeLoanPrincipal: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      sukanyaSamriddhi: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      taxSaverFD: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      nsc: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      epfContribution: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      total: { type: Number, default: 0 }, // Max 1,50,000
    },

    // Section 80CCD(1B) - Additional NPS (Max 50,000)
    section80CCD1B: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },

    // Section 80D - Medical Insurance
    section80D: {
      selfAndFamily: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } }, // Max 25,000 (50,000 if senior)
      parents: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } }, // Max 25,000 (50,000 if senior)
      preventiveCheckup: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } }, // Max 5,000 (included in above)
    },

    // Section 24(b) - Home Loan Interest (Max 2,00,000 for self-occupied)
    section24b: {
      homeLoanInterest: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } },
      lenderName: String,
      lenderPAN: String,
      propertyAddress: String,
      loanAccountNumber: String,
      isSelfOccupied: { type: Boolean, default: true },
    },

    // HRA Exemption (Section 10(13A))
    hraExemption: {
      monthlyRent: { type: Number, default: 0 },
      landlordName: String,
      landlordPAN: String, // Mandatory if annual rent > 1,00,000
      rentalAddress: String,
      rentReceiptsSubmitted: { type: Boolean, default: false },
    },

    // Other Sections
    section80E: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } }, // Education loan interest
    section80G: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } }, // Donations
    section80TTA: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } }, // Savings interest (Max 10,000)
    section80DD: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } }, // Disabled dependent
    section80DDB: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } }, // Medical treatment
    section80U: { declared: { type: Number, default: 0 }, actual: { type: Number, default: 0 }, proofSubmitted: { type: Boolean, default: false } }, // Own disability

    // Income from Other Sources (for TDS calculation)
    otherIncome: {
      previousEmployerIncome: { type: Number, default: 0 }, // Salary from previous employer in same FY
      letOutPropertyIncome: { type: Number, default: 0 },    // Rental income
      fixedDepositInterest: { type: Number, default: 0 },    // FD interest
      otherIncome: { type: Number, default: 0 },             // Any other taxable income
    },

    // TDS Computation
    tdsComputation: {
      totalIncome: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      taxableIncome: { type: Number, default: 0 },
      taxPayable: { type: Number, default: 0 },
      surcharge: { type: Number, default: 0 },
      educationCess: { type: Number, default: 0 },  // 4% Health & Education Cess
      totalTax: { type: Number, default: 0 },
      monthlyTDS: { type: Number, default: 0 },
      tdsPaidYTD: { type: Number, default: 0 },      // Year-to-date TDS deducted
      tdsBalance: { type: Number, default: 0 },       // Remaining TDS for the year
      lastComputedAt: Date,
    },

    // Declaration Status
    status: {
      type: String,
      enum: ['not_started', 'draft', 'submitted', 'approved', 'proofs_pending', 'proofs_submitted', 'verified', 'finalized'],
      default: 'not_started'
    },
    submittedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    proofsDeadline: Date,
    remarks: String,
  },

  // ============================================
  // ONBOARDING CHECKLIST STATUS
  // ============================================
  onboardingChecklist: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    completedPercentage: { type: Number, default: 0 },
    items: [{
      category: {
        type: String,
        enum: ['identity', 'employment', 'education', 'banking', 'statutory', 'tax', 'bgv', 'it_setup', 'policy']
      },
      name: String,
      documentType: String, // links to documents[].documentType
      isMandatory: { type: Boolean, default: true },
      isCompleted: { type: Boolean, default: false },
      completedAt: Date,
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      remarks: String
    }],
    startedAt: Date,
    completedAt: Date
  }
}, {
  timestamps: true
})

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next()
  }

  // SOX Control: ITGC-004 - Store old password in history before hashing new one
  if (this.password && !this.isNew) {
    // Get the current hashed password before it's changed
    const currentUser = await this.constructor.findById(this._id).select('+password')
    if (currentUser && currentUser.password) {
      // Keep last 5 passwords in history
      if (!this.passwordHistory) this.passwordHistory = []
      this.passwordHistory.push({
        hash: currentUser.password,
        changedAt: currentUser.passwordChangedAt || new Date()
      })
      // Keep only last 5
      if (this.passwordHistory.length > 5) {
        this.passwordHistory = this.passwordHistory.slice(-5)
      }
    }
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)

  // Update password timestamps
  this.passwordChangedAt = new Date()
  this.passwordExpiresAt = new Date(Date.now() + (parseInt(process.env.PASSWORD_EXPIRY_DAYS) || 90) * 24 * 60 * 60 * 1000)
  this.mustChangePassword = false
  this.failedLoginAttempts = 0
  this.lockoutUntil = null

  next()
})

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// ===========================================
// SOX Control: ITGC-004 Account Lockout Methods
// ===========================================

/**
 * Check if account is currently locked
 */
userSchema.methods.isLocked = function() {
  return this.lockoutUntil && this.lockoutUntil > new Date()
}

/**
 * Check if password is expired
 */
userSchema.methods.isPasswordExpired = function() {
  if (!this.passwordExpiresAt) return false
  return new Date() > this.passwordExpiresAt
}

/**
 * Get remaining lockout time in minutes
 */
userSchema.methods.getLockoutRemainingMinutes = function() {
  if (!this.isLocked()) return 0
  return Math.ceil((this.lockoutUntil - new Date()) / (60 * 1000))
}

/**
 * Increment failed login attempts
 * Locks account after 5 failed attempts for 30 minutes
 */
userSchema.methods.incrementFailedLogins = async function(ipAddress) {
  const MAX_FAILED_ATTEMPTS = 5
  const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes

  // Reset if lockout has expired
  if (this.lockoutUntil && this.lockoutUntil < new Date()) {
    this.failedLoginAttempts = 0
    this.lockoutUntil = null
  }

  this.failedLoginAttempts += 1
  this.lastFailedLoginAt = new Date()
  this.lastFailedLoginIP = ipAddress

  // Lock account if max attempts reached
  if (this.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    this.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION)
  }

  return this.save({ validateBeforeSave: false })
}

/**
 * Reset failed login attempts on successful login
 */
userSchema.methods.resetFailedLogins = async function() {
  if (this.failedLoginAttempts > 0 || this.lockoutUntil) {
    this.failedLoginAttempts = 0
    this.lockoutUntil = null
    return this.save({ validateBeforeSave: false })
  }
  return this
}

/**
 * Check if password was changed after token was issued
 * Used for token invalidation on password change
 */
userSchema.methods.changedPasswordAfter = function(tokenIssuedAt) {
  if (!this.passwordChangedAt) return false

  const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
  return tokenIssuedAt < changedTimestamp
}

/**
 * Check if new password is in history
 */
userSchema.methods.isPasswordInHistory = async function(newPassword) {
  if (!this.passwordHistory || this.passwordHistory.length === 0) return false

  for (const entry of this.passwordHistory) {
    if (entry.hash) {
      const matches = await bcrypt.compare(newPassword, entry.hash)
      if (matches) return true
    }
  }

  // Also check against current password
  const currentPassword = await this.constructor.findById(this._id).select('+password')
  if (currentPassword?.password) {
    const matchesCurrent = await bcrypt.compare(newPassword, currentPassword.password)
    if (matchesCurrent) return true
  }

  return false
}

// Get all permissions for this user (role + overrides)
userSchema.methods.getPermissions = function() {
  const rolePermissions = ROLE_PERMISSIONS[this.role] || []
  const granted = this.permissionOverrides?.granted || []
  const revoked = this.permissionOverrides?.revoked || []

  // Combine role permissions with granted, then remove revoked
  const allPermissions = [...new Set([...rolePermissions, ...granted])]
  return allPermissions.filter(p => !revoked.includes(p))
}

// Check if user has a specific permission
userSchema.methods.hasPermission = function(permission) {
  const permissions = this.getPermissions()
  return permissions.includes(permission)
}

// Check if user has any of the given permissions
userSchema.methods.hasAnyPermission = function(permissionList) {
  const permissions = this.getPermissions()
  return permissionList.some(p => permissions.includes(p))
}

// Check if user has all of the given permissions
userSchema.methods.hasAllPermissions = function(permissionList) {
  const permissions = this.getPermissions()
  return permissionList.every(p => permissions.includes(p))
}

// Check if user has module-level permission (view or edit) for a function
userSchema.methods.hasModulePermission = function(functionKey, accessType = 'view') {
  if (!this.modulePermissions) return false
  const perm = this.modulePermissions[functionKey]
  if (!perm) return false
  return accessType === 'edit' ? !!perm.edit : !!perm.view
}

// Get all granted module permissions as a structured object
userSchema.methods.getModulePermissions = function() {
  if (!this.modulePermissions) return {}
  const result = {}
  const mp = this.modulePermissions.toObject ? this.modulePermissions.toObject() : this.modulePermissions
  for (const [key, val] of Object.entries(mp)) {
    if (val && (val.view || val.edit)) {
      result[key] = { view: !!val.view, edit: !!val.edit }
    }
  }
  return result
}

// Check if user can access a specific company
userSchema.methods.canAccessCompany = function(companyId) {
  const companyIdStr = (companyId?._id || companyId)?.toString()

  // Super admin can access all companies
  if (this.role === 'super_admin') return true

  // Check primary company (handle both populated and unpopulated)
  const primaryId = this.company?._id || this.company
  if (primaryId?.toString() === companyIdStr) return true

  // Check additional companies (handle both populated and unpopulated)
  if (this.additionalCompanies && this.additionalCompanies.length > 0) {
    return this.additionalCompanies.some(ac => {
      const acId = ac.company?._id || ac.company
      return acId?.toString() === companyIdStr
    })
  }

  return false
}

// Get role for a specific company
userSchema.methods.getRoleForCompany = function(companyId) {
  const companyIdStr = (companyId?._id || companyId)?.toString()

  if (this.role === 'super_admin') return 'super_admin'

  // Handle both populated and unpopulated company field
  const primaryId = this.company?._id || this.company
  if (primaryId?.toString() === companyIdStr) return this.role

  const additionalCompany = this.additionalCompanies?.find(ac => {
    const acId = ac.company?._id || ac.company
    return acId?.toString() === companyIdStr
  })

  return additionalCompany ? additionalCompany.role : null
}

// Update user metrics
userSchema.methods.updateMetrics = async function() {
  const Lead = mongoose.model('Lead')
  const Project = mongoose.model('Project')

  const [assignedLeads, convertedLeads, activeProjects, completedProjects] = await Promise.all([
    Lead.countDocuments({ assignedTo: this._id }),
    Lead.countDocuments({ assignedTo: this._id, isConverted: true }),
    Project.countDocuments({ $or: [{ projectManager: this._id }, { 'teamMembers.user': this._id }], status: 'active' }),
    Project.countDocuments({ $or: [{ projectManager: this._id }, { 'teamMembers.user': this._id }], status: 'completed' })
  ])

  this.metrics = {
    leadsAssigned: assignedLeads,
    leadsConverted: convertedLeads,
    projectsCompleted: completedProjects,
    activeProjects: activeProjects,
    conversionRate: assignedLeads > 0 ? Math.round((convertedLeads / assignedLeads) * 100) : 0
  }

  return this.save()
}

// Indexes (email and userId already indexed via unique: true)
userSchema.index({ company: 1, role: 1 })
userSchema.index({ company: 1, department: 1 })
userSchema.index({ company: 1, isActive: 1 })
userSchema.index({ reportsTo: 1 })

export default mongoose.model('User', userSchema)
