import mongoose from 'mongoose'

/**
 * Token Blacklist Model
 * SOX Control: ITGC-002 - User Access Revocation
 *
 * Stores invalidated JWT tokens for:
 * - User logout
 * - Forced session termination
 * - Password change (invalidate all sessions)
 * - Account deactivation
 *
 * Uses TTL index for automatic cleanup
 */

const tokenBlacklistSchema = new mongoose.Schema({
  // The token's unique identifier (jti claim) or the token hash
  tokenId: {
    type: String,
    required: true,
    index: true
  },

  // Full token (hashed for security)
  tokenHash: {
    type: String,
    required: true
  },

  // User who owned this token
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Reason for blacklisting
  reason: {
    type: String,
    enum: [
      'logout',              // User logged out
      'password_change',     // Password was changed
      'forced_logout',       // Admin forced logout
      'account_deactivated', // Account was deactivated
      'security_concern',    // Security-related revocation
      'session_timeout',     // Session expired/timed out
      'token_refresh'        // Token was refreshed
    ],
    required: true
  },

  // Who blacklisted this token
  blacklistedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // When the original token expires (for TTL cleanup)
  tokenExpiresAt: {
    type: Date,
    required: true
  },

  // IP address of the request that caused blacklisting
  ipAddress: String,

  // User agent of the request
  userAgent: String,

  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
})

// TTL index - automatically delete documents after token expires
// Add 1 day buffer to ensure token is definitely expired
tokenBlacklistSchema.index(
  { tokenExpiresAt: 1 },
  { expireAfterSeconds: 86400 } // 24 hours after token expiry
)

// Compound index for efficient lookup
tokenBlacklistSchema.index({ tokenHash: 1, user: 1 })

/**
 * Check if a token is blacklisted
 * @param {string} tokenHash - The hash of the token to check
 * @returns {Promise<boolean>}
 */
tokenBlacklistSchema.statics.isBlacklisted = async function(tokenHash) {
  const entry = await this.findOne({ tokenHash })
  return !!entry
}

/**
 * Blacklist a token
 * @param {Object} params - Token details
 * @returns {Promise<TokenBlacklist>}
 */
tokenBlacklistSchema.statics.blacklistToken = async function({
  tokenId,
  tokenHash,
  userId,
  reason,
  blacklistedBy,
  tokenExpiresAt,
  ipAddress,
  userAgent,
  metadata
}) {
  return this.create({
    tokenId,
    tokenHash,
    user: userId,
    reason,
    blacklistedBy: blacklistedBy || userId,
    tokenExpiresAt,
    ipAddress,
    userAgent,
    metadata
  })
}

/**
 * Blacklist all tokens for a user (e.g., on password change)
 * This doesn't actually blacklist specific tokens, but creates a marker
 * The auth middleware checks if password was changed after token issue
 * @param {ObjectId} userId - User ID
 * @param {string} reason - Reason for blacklisting
 * @param {ObjectId} blacklistedBy - Who initiated the action
 */
tokenBlacklistSchema.statics.blacklistAllUserTokens = async function(userId, reason, blacklistedBy) {
  // Create a special entry that marks all tokens before this time as invalid
  return this.create({
    tokenId: `all_${userId}_${Date.now()}`,
    tokenHash: `all_tokens_${userId}`,
    user: userId,
    reason,
    blacklistedBy,
    tokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    metadata: {
      type: 'bulk_invalidation',
      invalidatedAt: new Date()
    }
  })
}

/**
 * Get blacklist entries for a user
 * @param {ObjectId} userId - User ID
 * @param {number} limit - Number of entries to return
 */
tokenBlacklistSchema.statics.getUserBlacklistHistory = async function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('reason createdAt ipAddress userAgent')
}

/**
 * Cleanup expired entries (called by scheduled job)
 * This is a backup to TTL index
 */
tokenBlacklistSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    tokenExpiresAt: { $lt: new Date() }
  })
  return result.deletedCount
}

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema)

export default TokenBlacklist
