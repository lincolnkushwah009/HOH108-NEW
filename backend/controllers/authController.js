import User from '../models/User.js'
import Company from '../models/Company.js'
import TokenBlacklist from '../models/TokenBlacklist.js'
import { generateToken } from '../middleware/auth.js'
import { validatePasswordStrength } from '../utils/encryption.js'
import crypto from 'crypto'

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, websiteSource } = req.body

    // Check if user exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      })
    }

    // Get default company for new registrations
    const defaultCompany = await Company.findOne({ isActive: true })

    // Create user with websiteSource to track which website they registered from
    const user = await User.create({
      name,
      email,
      phone,
      password,
      websiteSource: websiteSource || 'HOH108',
      role: 'viewer',
      company: defaultCompany?._id,
      department: 'sales'
    })

    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        karmaPoints: user.karmaPoints
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// SOX Control: ITGC-004 - Account Lockout Implementation
export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const ipAddress = req.ip || req.connection?.remoteAddress

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      })
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // SOX Control: ITGC-004 - Check if account is locked
    if (user.isLocked && user.isLocked()) {
      const remainingMinutes = user.getLockoutRemainingMinutes()
      return res.status(401).json({
        success: false,
        message: `Account is locked due to too many failed login attempts. Try again in ${remainingMinutes} minutes.`,
        code: 'ACCOUNT_LOCKED',
        lockoutRemainingMinutes: remainingMinutes
      })
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      // SOX Control: ITGC-004 - Increment failed login attempts
      await user.incrementFailedLogins(ipAddress)

      const attemptsRemaining = 5 - user.failedLoginAttempts
      return res.status(401).json({
        success: false,
        message: attemptsRemaining > 0
          ? `Invalid credentials. ${attemptsRemaining} attempt(s) remaining before account lockout.`
          : 'Invalid credentials. Account is now locked for 30 minutes.',
        code: attemptsRemaining > 0 ? 'INVALID_CREDENTIALS' : 'ACCOUNT_LOCKED',
        attemptsRemaining: Math.max(0, attemptsRemaining)
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      })
    }

    // Reset failed login attempts on successful login
    await user.resetFailedLogins()

    // Update last login
    user.lastLogin = new Date()
    user.loginHistory = user.loginHistory || []
    user.loginHistory.push({
      timestamp: new Date(),
      ip: ipAddress,
      userAgent: req.get('user-agent')
    })
    // Keep only last 10 login records
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10)
    }
    await user.save({ validateBeforeSave: false })

    const token = generateToken(user._id)

    // Check password expiry status
    const passwordExpired = user.isPasswordExpired ? user.isPasswordExpired() : false
    const mustChangePassword = user.mustChangePassword || false

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        karmaPoints: user.karmaPoints,
        avatar: user.avatar
      },
      // SOX Control: Notify client about password status
      passwordStatus: {
        expired: passwordExpired,
        mustChange: mustChangePassword,
        expiresAt: user.passwordExpiresAt
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Admin Login
// @route   POST /api/auth/admin/login
// @access  Public
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      })
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check if user has a valid role to access admin panel
    const allowedRoles = [
      'admin', 'superadmin', 'super_admin', 'company_admin',
      'manager', 'sales_manager', 'sales_executive', 'pre_sales',
      'project_manager', 'designer', 'site_engineer',
      'operations', 'finance', 'hr', 'viewer', 'employee'
    ]
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access admin panel'
      })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      })
    }

    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    const token = generateToken(user._id)

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        company: user.company
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department,
        subDepartment: user.subDepartment,
        callyzerEmployeeNumber: user.callyzerEmployeeNumber,
        karmaPoints: user.karmaPoints,
        avatar: user.avatar,
        createdAt: user.createdAt,
        company: user.company
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const emailExists = await User.findOne({ email })
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        })
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, address },
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        karmaPoints: user.karmaPoints,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Update phone number (self-service for pre-sales)
// @route   PUT /api/auth/phone
// @access  Private (pre_sales only)
export const updatePhoneNumber = async (req, res) => {
  try {
    const { newNumber, reason } = req.body

    if (!newNumber || !reason) {
      return res.status(400).json({
        success: false,
        message: 'New number and reason are required'
      })
    }

    // Validate 10-digit Indian number
    const cleaned = newNumber.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number'
      })
    }

    const user = await User.findById(req.user.id)

    // Check department is pre_sales
    if (user.subDepartment !== 'pre_sales') {
      return res.status(403).json({
        success: false,
        message: 'Only pre-sales employees can use this feature'
      })
    }

    const oldNumber = user.phone || ''

    // Store old number in history
    if (oldNumber) {
      user.previousNumbers.push({
        number: oldNumber,
        changedAt: new Date(),
        reason
      })
    }

    // Update phone and Callyzer employee number
    user.phone = cleaned
    user.callyzerEmployeeNumber = cleaned
    await user.save()

    // Notify admins about the change
    try {
      const Notification = (await import('../models/Notification.js')).default
      const adminUsers = await User.find({
        company: user.company,
        role: { $in: ['super_admin', 'company_admin'] }
      }).select('_id')

      for (const admin of adminUsers) {
        await Notification.create({
          company: user.company,
          recipient: admin._id,
          type: 'info',
          category: 'system',
          title: 'Employee Phone Number Changed',
          message: `${user.name} (Pre-Sales) changed their number from ${oldNumber || 'N/A'} to ${cleaned}. Reason: ${reason}`,
          actionUrl: '/admin/hr/employees'
        })
      }
    } catch (notifErr) {
      console.error('Failed to send admin notification:', notifErr.message)
    }

    res.json({
      success: true,
      message: 'Phone number updated successfully',
      data: {
        phone: user.phone,
        callyzerEmployeeNumber: user.callyzerEmployeeNumber,
        previousNumbers: user.previousNumbers
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Claim daily karma points
// @route   POST /api/auth/claim-points
// @access  Private
export const claimPoints = async (req, res) => {
  try {
    const { points } = req.body
    const pointsToAdd = Math.min(points || 10, 100) // Cap at 100 points max

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Add points to user's karma
    user.karmaPoints = (user.karmaPoints || 0) + pointsToAdd
    await user.save({ validateBeforeSave: false })

    res.json({
      success: true,
      message: `Successfully claimed ${pointsToAdd} karma points!`,
      karmaPoints: user.karmaPoints,
      pointsClaimed: pointsToAdd
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
// SOX Control: ITGC-004 - Password Policy Enforcement
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      })
    }

    // SOX Control: ITGC-004 - Validate password strength
    const strengthCheck = validatePasswordStrength(newPassword)
    if (!strengthCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        code: 'WEAK_PASSWORD',
        errors: strengthCheck.errors,
        strength: strengthCheck.strength
      })
    }

    const user = await User.findById(req.user.id).select('+password +passwordHistory')

    const isMatch = await user.matchPassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      })
    }

    // SOX Control: ITGC-004 - Check password history (prevent reuse of last 5 passwords)
    const isInHistory = await user.isPasswordInHistory(newPassword)
    if (isInHistory) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reuse any of your last 5 passwords',
        code: 'PASSWORD_REUSE'
      })
    }

    // Update password (pre-save hook handles history)
    user.password = newPassword
    await user.save()

    // Blacklist old token - SOX Control: ITGC-002
    if (req.tokenInfo) {
      await TokenBlacklist.blacklistToken({
        tokenId: req.tokenInfo.decoded.id + '_' + Date.now(),
        tokenHash: req.tokenInfo.tokenHash,
        userId: user._id,
        reason: 'password_change',
        blacklistedBy: user._id,
        tokenExpiresAt: req.tokenInfo.expiresAt,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })
    }

    // Generate new token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'Password updated successfully. All other sessions have been logged out.',
      token
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Logout user (blacklist token)
// @route   POST /api/auth/logout
// @access  Private
// SOX Control: ITGC-002 - User Access Revocation
export const logout = async (req, res) => {
  try {
    if (req.tokenInfo) {
      await TokenBlacklist.blacklistToken({
        tokenId: req.tokenInfo.decoded.id + '_' + Date.now(),
        tokenHash: req.tokenInfo.tokenHash,
        userId: req.user._id,
        reason: 'logout',
        blacklistedBy: req.user._id,
        tokenExpiresAt: req.tokenInfo.expiresAt,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Get password status (expiry, must change)
// @route   GET /api/auth/password-status
// @access  Private
// SOX Control: ITGC-004 - Password Policy
export const getPasswordStatus = async (req, res) => {
  try {
    const user = req.user

    const expired = user.isPasswordExpired ? user.isPasswordExpired() : false
    const daysUntilExpiry = user.passwordExpiresAt
      ? Math.ceil((new Date(user.passwordExpiresAt) - new Date()) / (1000 * 60 * 60 * 24))
      : null

    res.json({
      success: true,
      data: {
        expired,
        mustChange: user.mustChangePassword || false,
        expiresAt: user.passwordExpiresAt,
        daysUntilExpiry: Math.max(0, daysUntilExpiry),
        lastChanged: user.passwordChangedAt,
        warningThreshold: daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry > 0
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Force logout all sessions for a user (admin only)
// @route   POST /api/auth/force-logout/:userId
// @access  Private (Admin)
// SOX Control: ITGC-002 - User Access Revocation
export const forceLogout = async (req, res) => {
  try {
    const { userId } = req.params

    // Check if admin
    if (!['super_admin', 'company_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to force logout users'
      })
    }

    const targetUser = await User.findById(userId)
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Create bulk invalidation entry
    await TokenBlacklist.blacklistAllUserTokens(
      userId,
      'forced_logout',
      req.user._id
    )

    res.json({
      success: true,
      message: `All sessions for user ${targetUser.email} have been terminated`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
