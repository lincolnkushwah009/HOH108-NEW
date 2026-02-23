// Format date to readable string
export function formatDate(date, options = {}) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

// Format date with time
export function formatDateTime(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date) {
  if (!date) return '-'
  const d = new Date(date)
  const now = new Date()
  const diffMs = now - d
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(date)
}

// Format currency (INR)
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Clean phone number (strip leading 0 and +91 prefix to get 10-digit number)
export function cleanPhone(phone) {
  if (!phone) return ''
  let digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  if (digits.length === 13 && digits.startsWith('091')) digits = digits.slice(3)
  return digits
}

// Format phone number for display
export function formatPhone(phone) {
  if (!phone) return '-'
  const digits = cleanPhone(phone)
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return phone
}

// Format phone number for tel: links (adds +91 for Indian numbers)
export function telHref(phone) {
  if (!phone) return '#'
  let digits = phone.replace(/\D/g, '')
  // Strip leading 0 (old STD format: 09876543210 → 9876543210)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 10) return `tel:+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `tel:+${digits}`
  if (digits.length === 13 && digits.startsWith('091')) return `tel:+91${digits.slice(3)}`
  return `tel:+91${digits}`
}

// Format phone for display - respects server-side masking
export function formatMaskedPhone(phone) {
  if (!phone) return '-'
  // If already masked (contains X), just return as-is
  if (phone.includes('X')) return phone
  return formatPhone(phone)
}

// Get initials from name
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Capitalize first letter
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Truncate text
export function truncate(str, length = 50) {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Generate random color from string (for avatars)
export function stringToColor(str) {
  if (!str) return '#6B7280'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  ]
  return colors[Math.abs(hash) % colors.length]
}

// Debounce function
export function debounce(fn, delay = 300) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

// Build query string from object
export function buildQueryString(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  })
  return query.toString()
}

// Parse error message from API response
export function getErrorMessage(error) {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.error) return error.error
  return 'Something went wrong'
}

// Check if user has permission
export function hasPermission(user, permission) {
  if (!user || !user.role) return false
  if (user.role === 'super_admin') return true
  // Add more permission logic as needed
  return true
}

// Download file from blob
export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
