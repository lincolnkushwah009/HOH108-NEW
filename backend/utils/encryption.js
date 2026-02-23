import crypto from 'crypto'

/**
 * SOX Control: ITGC-004 - Encryption Utilities
 *
 * AES-256-GCM encryption for sensitive data at rest
 * Used for: bank account numbers, PAN numbers, UAN numbers, ESIC numbers
 *
 * IMPORTANT: Set ENCRYPTION_KEY environment variable (32 bytes / 64 hex chars)
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 16

/**
 * Get encryption key from environment or generate a warning
 */
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    console.warn('[ENCRYPTION] WARNING: ENCRYPTION_KEY not set. Using default key - NOT SECURE FOR PRODUCTION!')
    // Default key for development only - 32 bytes
    return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex')
  }

  // Convert hex string to buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }

  // If key is not hex, hash it to get 32 bytes
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param {string} plaintext - The text to encrypt
 * @returns {string} - Encrypted string in format: iv:authTag:ciphertext (base64)
 */
export const encrypt = (plaintext) => {
  if (!plaintext || typeof plaintext !== 'string') {
    return plaintext
  }

  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(plaintext, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    const authTag = cipher.getAuthTag()

    // Return in format: iv:authTag:ciphertext
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
  } catch (error) {
    console.error('[ENCRYPTION] Encryption failed:', error.message)
    throw new Error('Encryption failed')
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param {string} ciphertext - Encrypted string in format: iv:authTag:ciphertext
 * @returns {string} - Decrypted plaintext
 */
export const decrypt = (ciphertext) => {
  if (!ciphertext || typeof ciphertext !== 'string') {
    return ciphertext
  }

  // Check if it's an encrypted string (has the format iv:authTag:data)
  const parts = ciphertext.split(':')
  if (parts.length !== 3) {
    // Not encrypted, return as-is (for backward compatibility)
    return ciphertext
  }

  try {
    const key = getEncryptionKey()
    const iv = Buffer.from(parts[0], 'base64')
    const authTag = Buffer.from(parts[1], 'base64')
    const encrypted = parts[2]

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('[ENCRYPTION] Decryption failed:', error.message)
    // Return original value if decryption fails (might not be encrypted)
    return ciphertext
  }
}

/**
 * Check if a string is encrypted
 * @param {string} value - The value to check
 * @returns {boolean}
 */
export const isEncrypted = (value) => {
  if (!value || typeof value !== 'string') return false
  const parts = value.split(':')
  return parts.length === 3 && parts[0].length === 24 && parts[1].length === 24
}

/**
 * Hash sensitive field for searchable encrypted data
 * Uses HMAC-SHA256 for consistent hashing
 * @param {string} value - The value to hash
 * @returns {string} - Hashed value (hex)
 */
export const hashSensitiveField = (value) => {
  if (!value || typeof value !== 'string') return null

  const key = getEncryptionKey()
  return crypto.createHmac('sha256', key)
    .update(value.toLowerCase().trim())
    .digest('hex')
}

/**
 * Mask sensitive data for display
 * @param {string} value - The value to mask
 * @param {number} visibleChars - Number of characters to show at end
 * @returns {string} - Masked value (e.g., ****1234)
 */
export const maskSensitiveData = (value, visibleChars = 4) => {
  if (!value || typeof value !== 'string') return value

  // Decrypt if encrypted
  const decrypted = isEncrypted(value) ? decrypt(value) : value

  if (decrypted.length <= visibleChars) {
    return '*'.repeat(decrypted.length)
  }

  const visible = decrypted.slice(-visibleChars)
  const masked = '*'.repeat(decrypted.length - visibleChars)
  return masked + visible
}

/**
 * Password strength validation
 * SOX Control: ITGC-004 - Password Policy
 *
 * Requirements:
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character
 * - Not commonly used password
 *
 * @param {string} password - Password to validate
 * @returns {{ isValid: boolean, errors: string[], strength: string }}
 */
export const validatePasswordStrength = (password) => {
  const errors = []
  let score = 0

  if (!password) {
    return { isValid: false, errors: ['Password is required'], strength: 'none' }
  }

  // Minimum length: 12 characters
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long')
  } else {
    score += 1
    if (password.length >= 16) score += 1
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }

  // Digit
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one digit')
  } else {
    score += 1
  }

  // Special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)')
  } else {
    score += 1
  }

  // Common passwords check
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'login',
    'password123', 'admin123', 'root', 'toor', 'pass',
    'test', 'guest', 'abc123', '111111', '123123'
  ]

  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password contains commonly used patterns')
    score = Math.max(0, score - 2)
  }

  // No sequential characters (e.g., 123, abc)
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters (e.g., aaa)')
  }

  // Determine strength
  let strength = 'weak'
  if (score >= 6) strength = 'strong'
  else if (score >= 4) strength = 'medium'

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  }
}

/**
 * Check if password was used recently (for password history check)
 * @param {string} newPassword - New password (plaintext)
 * @param {Array} passwordHistory - Array of { hash, changedAt }
 * @param {number} historyCount - Number of previous passwords to check (default: 5)
 * @returns {boolean} - True if password was used recently
 */
export const isPasswordInHistory = async (newPassword, passwordHistory = [], historyCount = 5) => {
  const bcrypt = await import('bcryptjs')

  // Check against last N passwords
  const recentPasswords = passwordHistory.slice(-historyCount)

  for (const entry of recentPasswords) {
    if (entry.hash) {
      const matches = await bcrypt.compare(newPassword, entry.hash)
      if (matches) return true
    }
  }

  return false
}

/**
 * Generate secure random password
 * @param {number} length - Password length (default: 16)
 * @returns {string} - Generated password
 */
export const generateSecurePassword = (length = 16) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const special = '!@#$%^&*()_+-='
  const all = uppercase + lowercase + digits + special

  let password = ''

  // Ensure at least one of each required type
  password += uppercase[crypto.randomInt(uppercase.length)]
  password += lowercase[crypto.randomInt(lowercase.length)]
  password += digits[crypto.randomInt(digits.length)]
  password += special[crypto.randomInt(special.length)]

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += all[crypto.randomInt(all.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('')
}

/**
 * Generate password reset token
 * @returns {{ token: string, hash: string, expires: Date }}
 */
export const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  return { token, hash, expires }
}

/**
 * Verify password reset token
 * @param {string} token - The token to verify
 * @param {string} storedHash - The stored hash
 * @param {Date} expires - Expiration date
 * @returns {boolean}
 */
export const verifyPasswordResetToken = (token, storedHash, expires) => {
  if (!token || !storedHash || !expires) return false

  if (new Date() > new Date(expires)) return false

  const hash = crypto.createHash('sha256').update(token).digest('hex')
  return hash === storedHash
}

export default {
  encrypt,
  decrypt,
  isEncrypted,
  hashSensitiveField,
  maskSensitiveData,
  validatePasswordStrength,
  isPasswordInHistory,
  generateSecurePassword,
  generatePasswordResetToken,
  verifyPasswordResetToken
}
