// Lead statuses with colors
export const LEAD_STATUSES = {
  // Pre-Sales columns
  new: { label: 'New', color: 'blue' },
  rnr: { label: 'RNR', color: 'orange' },
  qualified: { label: 'Qualified', color: 'purple' },
  future_prospect: { label: 'Future Prospect', color: 'teal' },
  lost: { label: 'Lost', color: 'red' },
  // Sales columns
  meeting_status: { label: 'Meeting Status', color: 'yellow' },
  cold: { label: 'Cold', color: 'cyan' },
  warm: { label: 'Warm', color: 'amber' },
  hot: { label: 'Hot', color: 'crimson' },
  won: { label: 'Won', color: 'green' },
}

export const PRE_SALES_STATUSES = ['new', 'rnr', 'qualified', 'future_prospect', 'lost']
export const SALES_STATUSES = ['meeting_status', 'cold', 'warm', 'hot', 'won', 'lost']

// Lead priorities (legacy — kept for backward compat)
export const LEAD_PRIORITIES = {
  low: { label: 'Low', color: 'gray' },
  medium: { label: 'Medium', color: 'yellow' },
  high: { label: 'High', color: 'red' },
}

// Lead temperature (Hot/Warm/Cold) — used in leads list
export const LEAD_TEMPERATURES = {
  hot: { label: 'Hot', color: 'red', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  warm: { label: 'Warm', color: 'yellow', bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  cold: { label: 'Cold', color: 'blue', bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  future: { label: 'Future', color: 'purple', bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
}

// Project statuses
export const PROJECT_STATUSES = {
  planning: { label: 'Planning', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'yellow' },
  on_hold: { label: 'On Hold', color: 'orange' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
}

// Leave types
export const LEAVE_TYPES = {
  casual: { label: 'Casual Leave', color: 'blue' },
  sick: { label: 'Sick Leave', color: 'red' },
  earned: { label: 'Earned Leave', color: 'green' },
  maternity: { label: 'Maternity Leave', color: 'pink' },
  paternity: { label: 'Paternity Leave', color: 'purple' },
  unpaid: { label: 'Unpaid Leave', color: 'gray' },
}

// Leave statuses
export const LEAVE_STATUSES = {
  pending: { label: 'Pending', color: 'yellow' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
}

// Attendance statuses
export const ATTENDANCE_STATUSES = {
  present: { label: 'Present', color: 'green' },
  absent: { label: 'Absent', color: 'red' },
  'half-day': { label: 'Half Day', color: 'yellow' },
  late: { label: 'Late', color: 'orange' },
  'on-leave': { label: 'On Leave', color: 'purple' },
  holiday: { label: 'Holiday', color: 'blue' },
  weekend: { label: 'Weekend', color: 'gray' },
  wfh: { label: 'Work From Home', color: 'teal' },
}

// User roles
export const USER_ROLES = {
  super_admin: { label: 'Super Admin', color: 'purple' },
  company_admin: { label: 'Company Admin', color: 'blue' },
  sales_manager: { label: 'Sales Manager', color: 'green' },
  sales_executive: { label: 'Sales Executive', color: 'teal' },
  pre_sales: { label: 'Pre Sales', color: 'cyan' },
  project_manager: { label: 'Project Manager', color: 'orange' },
  designer: { label: 'Designer', color: 'pink' },
  site_engineer: { label: 'Site Engineer', color: 'yellow' },
  operations: { label: 'Operations', color: 'indigo' },
  finance: { label: 'Finance', color: 'emerald' },
  viewer: { label: 'Viewer', color: 'gray' },
}

// CRM Cities
export const CRM_CITIES = ['Bengaluru', 'Mysuru', 'Hyderabad']

// Service types
export const SERVICE_TYPES = [
  'Interior Design',
  'Construction',
  'Renovation',
  'Modular Kitchen',
  'False Ceiling',
  'Flooring',
  'Painting',
  'Electrical',
  'Plumbing',
  '2d-to-3d',
  'Other',
]

// Property types
export const PROPERTY_TYPES = [
  'Apartment',
  'Villa',
  'Independent House',
  'Penthouse',
  'Studio',
  'Office',
  'Showroom',
  'Restaurant',
  'Other',
]

// Budget ranges
export const BUDGET_RANGES = [
  'Under 5 Lakhs',
  '5-10 Lakhs',
  '10-20 Lakhs',
  '20-50 Lakhs',
  '50 Lakhs - 1 Crore',
  'Above 1 Crore',
]

// Reimbursement categories
export const REIMBURSEMENT_CATEGORIES = {
  travel: { label: 'Travel', color: 'blue' },
  food: { label: 'Food & Meals', color: 'orange' },
  accommodation: { label: 'Accommodation', color: 'purple' },
  transport: { label: 'Local Transport', color: 'teal' },
  communication: { label: 'Communication', color: 'indigo' },
  medical: { label: 'Medical', color: 'red' },
  training: { label: 'Training & Development', color: 'green' },
  equipment: { label: 'Equipment', color: 'gray' },
  office_supplies: { label: 'Office Supplies', color: 'yellow' },
  client_entertainment: { label: 'Client Entertainment', color: 'pink' },
  miscellaneous: { label: 'Miscellaneous', color: 'gray' },
}

// Reimbursement statuses
export const REIMBURSEMENT_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  pending: { label: 'Pending', color: 'yellow' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  paid: { label: 'Paid', color: 'blue' },
  cancelled: { label: 'Cancelled', color: 'gray' },
}

// Payment methods
export const PAYMENT_METHODS = {
  bank_transfer: { label: 'Bank Transfer', color: 'blue' },
  cash: { label: 'Cash', color: 'green' },
  cheque: { label: 'Cheque', color: 'purple' },
  payroll: { label: 'Added to Payroll', color: 'indigo' },
  expense_card: { label: 'Expense Card', color: 'orange' },
}
