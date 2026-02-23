// Disposition Configuration - Source of Truth
// Pre-Sales & Sales disposition groups with sub-dispositions

const DISPOSITIONS = {
  pre_sales: {
    label: 'Pre-Sales',
    groups: {
      pending: {
        label: 'Pending',
        primaryStatusMapping: 'rnr',
        subDispositions: [
          { value: 'busy_tone', label: 'Busy tone' },
          { value: 'switched_off', label: 'Switched off' },
          { value: 'not_reachable', label: 'Not reachable' },
          { value: 'invalid_number', label: 'Invalid number', primaryStatusMapping: 'lost' },
          { value: 'out_of_service', label: 'Out of service' },
          { value: 'language_barrier', label: 'Language Barrier' },
          { value: 'whatsapp_msg_sent', label: 'WhatsApp msg sent' },
        ],
      },
      attempted: {
        label: 'Attempted',
        primaryStatusMapping: 'rnr',
        subDispositions: [
          { value: 'callback_requested', label: 'Callback requested' },
          { value: 'call_disconnected', label: 'Call disconnected' },
          { value: 'wrong_number', label: 'Wrong number', primaryStatusMapping: 'lost' },
          { value: 'rnr', label: 'RNR' },
          { value: 'looking_for_loose_furniture', label: 'Looking for loose furniture', primaryStatusMapping: 'lost' },
          { value: 'carpenter_work_less_than_50k', label: 'Carpenter work less than 50K', primaryStatusMapping: 'lost' },
          { value: 'contact_in_future', label: 'Contact in future', primaryStatusMapping: 'future_prospect' },
          { value: 'out_of_serviceable_location', label: 'Out of serviceable location', primaryStatusMapping: 'lost' },
        ],
      },
      lost: {
        label: 'Lost',
        primaryStatusMapping: 'lost',
        subDispositions: [
          { value: 'junk', label: 'Junk' },
          { value: 'whatsapp_msg_sent', label: 'WhatsApp msg sent' },
          { value: 'vendor', label: 'Vendor' },
          { value: 'looking_for_job', label: 'Looking for job' },
          { value: 'not_interested', label: 'Not interested' },
          { value: 'no_requirement', label: 'No requirement' },
          { value: 'busy_tone_above_10', label: 'Busy tone above 10 attempts', requiresMinAttempts: 10 },
          { value: 'not_reachable_above_10', label: 'Not reachable above 10 attempts', requiresMinAttempts: 10 },
          { value: 'invalid_number_above_10', label: 'Invalid number above 10 attempts', requiresMinAttempts: 10 },
          { value: 'out_of_service_above_10', label: 'Out of service above 10 attempts', requiresMinAttempts: 10 },
          { value: 'rnr_above_10', label: 'RNR above 10 attempts', requiresMinAttempts: 10 },
          { value: 'switched_off_above_10', label: 'Switched off above 10 attempts', requiresMinAttempts: 10 },
          { value: 'looking_for_loose_furniture', label: 'Looking for loose furniture' },
          { value: 'carpenter_work_less_than_50k', label: 'Carpenter work less than 50K' },
          { value: 'out_of_serviceable_location', label: 'Out of serviceable location' },
        ],
      },
      follow_up: {
        label: 'Follow up',
        primaryStatusMapping: 'future_prospect',
        subDispositions: [
          { value: 'less_than_1_month', label: '< 1 month' },
          { value: 'less_than_2_months', label: '< 2 months' },
          { value: 'less_than_3_months', label: '< 3 months' },
          { value: 'more_than_3_months', label: '> 3 months' },
          { value: 'interested_follow_up', label: 'Interested follow up' },
          { value: 'floor_follow_up', label: 'Floor follow up' },
          { value: 'language_barrier', label: 'Language Barrier' },
          { value: 'cx_looking_for_quote_only', label: 'Cx looking for quote only' },
        ],
      },
      qualified_to_sales: {
        label: 'Qualified to Sales',
        primaryStatusMapping: 'qualified',
        subDispositions: [
          { value: 'office_meeting_fixed', label: 'Office meeting fixed' },
          { value: 'site_visit_fixed', label: 'Site visit fixed' },
          { value: 'virtually_meeting_fixed', label: 'Virtually meeting fixed' },
        ],
      },
    },
  },
  sales: {
    label: 'Sales',
    groups: {
      qualified: {
        label: 'Qualified',
        primaryStatusMapping: 'qualified',
        subDispositions: [
          { value: 'requirement_vm_done', label: 'Requirement VM Done' },
          { value: 'site_inspection_done', label: 'Site Inspection done' },
          { value: 'office_visit_done', label: 'Office visit done' },
          { value: 'requirement_vm_done_below_budget', label: 'Requirement VM Done below budget' },
          { value: 'requirement_vm_done_above_budget', label: 'Requirement VM Done above budget' },
        ],
      },
      pending: {
        label: 'Pending',
        primaryStatusMapping: 'in_progress',
        subDispositions: [
          { value: 'rvm_done_dm_rescheduled', label: 'R VM Done DM rescheduled' },
          { value: 'rm_rescheduled', label: 'RM rescheduled' },
        ],
      },
      lost: {
        label: 'Lost',
        primaryStatusMapping: 'lost',
        subDispositions: [
          { value: 'budget_issue', label: 'Budget issue' },
          { value: 'finalized_with_carpenter', label: 'Finalized with carpenter' },
          { value: 'change_of_plan', label: 'Change of plan' },
          { value: 'na', label: 'NA' },
        ],
      },
      follow_up: {
        label: 'Follow up',
        primaryStatusMapping: 'future_prospect',
        subDispositions: [
          { value: '1st_meeting_done', label: '1st meeting done' },
          { value: '2nd_meeting_done', label: '2nd meeting done' },
          { value: 'onboarding_payment_pending', label: 'Onboarding payment pending' },
          { value: 'only_quote_shared', label: 'Only quote shared' },
        ],
      },
      won: {
        label: 'Won',
        primaryStatusMapping: null,
        subDispositions: [
          { value: '10_percent_payment_follow_up', label: '10% payment follow up' },
          { value: 'closed_10_percent_done', label: 'Closed 10% done' },
        ],
      },
    },
  },
}

/**
 * Get the disposition category for a user based on their role/subDepartment
 */
function getDispositionCategory(user) {
  if (!user) return null
  const role = user.role
  const subDept = user.subDepartment

  // Admin users can see both
  if (['super_admin', 'company_admin'].includes(role)) return 'both'

  // Sales-related roles
  if (['sales_manager', 'sales_executive'].includes(role)) return 'sales'
  if (subDept === 'sales_closure') return 'sales'

  // Pre-sales roles
  if (subDept === 'pre_sales' || subDept === 'crm') return 'pre_sales'
  if (role === 'team_lead' || role === 'employee') return 'pre_sales'

  return 'pre_sales'
}

/**
 * Validate a disposition against the config
 */
function validateDisposition(category, group, subDisposition) {
  const categoryConfig = DISPOSITIONS[category]
  if (!categoryConfig) {
    return { valid: false, error: `Invalid disposition category: ${category}` }
  }

  const groupConfig = categoryConfig.groups[group]
  if (!groupConfig) {
    return { valid: false, error: `Invalid disposition group: ${group} for category ${category}` }
  }

  const subDisp = groupConfig.subDispositions.find(sd => sd.value === subDisposition)
  if (!subDisp) {
    return { valid: false, error: `Invalid sub-disposition: ${subDisposition} for group ${group}` }
  }

  return {
    valid: true,
    groupLabel: groupConfig.label,
    subDispositionLabel: subDisp.label,
    primaryStatusMapping: subDisp.primaryStatusMapping || groupConfig.primaryStatusMapping,
    requiresMinAttempts: subDisp.requiresMinAttempts || null,
  }
}

/**
 * Get the disposition tree for a given category
 */
function getDispositionTree(category) {
  const categoryConfig = DISPOSITIONS[category]
  if (!categoryConfig) return null

  return {
    category,
    label: categoryConfig.label,
    groups: Object.entries(categoryConfig.groups).map(([key, group]) => ({
      value: key,
      label: group.label,
      primaryStatusMapping: group.primaryStatusMapping,
      subDispositions: group.subDispositions,
    })),
  }
}

export { DISPOSITIONS, getDispositionCategory, validateDisposition, getDispositionTree }
