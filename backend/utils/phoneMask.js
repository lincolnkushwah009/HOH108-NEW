/**
 * Mask a phone number showing only first 2 and last 2 digits.
 * e.g. "9876543210" => "98XXXXXX10"
 *      "+919876543210" => "+9198XXXXXX10"
 */
export function maskPhone(phone) {
  if (!phone) return ''

  // Strip non-digit chars for processing
  const digits = phone.replace(/\D/g, '')

  if (digits.length < 5) return phone // Too short to mask

  // Indian mobile: 10 digits
  if (digits.length === 10) {
    return digits.slice(0, 2) + 'X'.repeat(digits.length - 4) + digits.slice(-2)
  }

  // With country code: +91XXXXXXXXXX (12 digits)
  if (digits.length === 12 && digits.startsWith('91')) {
    return '+91 ' + digits.slice(2, 4) + 'X'.repeat(6) + digits.slice(-2)
  }

  // Generic: show first 2 and last 2
  return digits.slice(0, 2) + 'X'.repeat(digits.length - 4) + digits.slice(-2)
}

/**
 * Determine if a user should see masked phone numbers for a lead.
 * Returns true if the user is pre_sales/crm AND the lead is preSalesLocked.
 * Admins are never masked.
 */
export function shouldMaskPhone(user, lead) {
  if (!lead.preSalesLocked) return false

  // Admins always see full numbers
  if (['super_admin', 'company_admin'].includes(user.role)) return false

  // Pre-sales and CRM staff see masked numbers after qualification
  if (['pre_sales', 'crm'].includes(user.subDepartment)) {
    return true
  }

  return false
}
