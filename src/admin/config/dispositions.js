// Frontend Disposition Config - Colors & Labels

export const DISPOSITION_GROUPS = {
  pre_sales: {
    pending: {
      label: 'Pending',
      color: '#D97706',
      bg: '#FEF3C7',
      border: '#FDE68A',
    },
    attempted: {
      label: 'Attempted',
      color: '#2563EB',
      bg: '#DBEAFE',
      border: '#BFDBFE',
    },
    lost: {
      label: 'Lost',
      color: '#DC2626',
      bg: '#FEE2E2',
      border: '#FECACA',
    },
    follow_up: {
      label: 'Follow up',
      color: '#7C3AED',
      bg: '#EDE9FE',
      border: '#DDD6FE',
    },
    qualified_to_sales: {
      label: 'Qualified to Sales',
      color: '#059669',
      bg: '#D1FAE5',
      border: '#A7F3D0',
    },
  },
  sales: {
    qualified: {
      label: 'Qualified',
      color: '#059669',
      bg: '#D1FAE5',
      border: '#A7F3D0',
    },
    pending: {
      label: 'Pending',
      color: '#D97706',
      bg: '#FEF3C7',
      border: '#FDE68A',
    },
    lost: {
      label: 'Lost',
      color: '#DC2626',
      bg: '#FEE2E2',
      border: '#FECACA',
    },
    follow_up: {
      label: 'Follow up',
      color: '#7C3AED',
      bg: '#EDE9FE',
      border: '#DDD6FE',
    },
    won: {
      label: 'Won',
      color: '#047857',
      bg: '#ECFDF5',
      border: '#6EE7B7',
    },
  },
}

/**
 * Get the disposition category for the current user
 */
export function getUserDispositionCategory(user) {
  if (!user) return null
  const role = user.role
  const subDept = user.subDepartment

  if (['super_admin', 'company_admin'].includes(role)) return 'both'
  if (['sales_manager', 'sales_executive'].includes(role)) return 'sales'
  if (subDept === 'sales_closure') return 'sales'
  if (subDept === 'pre_sales' || subDept === 'crm') return 'pre_sales'
  if (role === 'team_lead' || role === 'employee') return 'pre_sales'

  return 'pre_sales'
}

/**
 * Get group styling for a given category and group
 */
export function getDispositionGroupStyle(category, group) {
  const categoryGroups = DISPOSITION_GROUPS[category]
  if (!categoryGroups) return { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', label: group }
  const groupStyle = categoryGroups[group]
  if (!groupStyle) return { color: '#6B7280', bg: '#F3F4F6', border: '#E5E7EB', label: group }
  return groupStyle
}
