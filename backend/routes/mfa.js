import express from 'express'
import * as OTPAuth from 'otpauth'
import QRCode from 'qrcode'
import crypto from 'crypto'
import User from '../models/User.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// All MFA routes require authentication
router.use(protect)
router.use(setCompanyContext)

/**
 * @desc    Get MFA status for the current user
 * @route   GET /api/mfa/status
 * @access  Private
 */
router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('mfaEnabled mfaSecret')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: {
        mfaEnabled: !!user.mfaEnabled,
        mfaConfigured: !!user.mfaSecret
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Setup MFA - Generate TOTP secret and QR code
 * @route   POST /api/mfa/setup
 * @access  Private
 */
router.post('/setup', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if MFA is already enabled
    if (user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is already enabled. Disable it first to reconfigure.'
      })
    }

    // Generate a new TOTP secret
    const totp = new OTPAuth.TOTP({
      issuer: 'HOH108CRM',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: new OTPAuth.Secret({ size: 20 })
    })

    const secret = totp.secret.base32

    // Generate QR code as data URL
    const otpauthUrl = totp.toString()
    const qrCode = await QRCode.toDataURL(otpauthUrl)

    // Save the secret to the user (but don't enable MFA yet)
    await User.findByIdAndUpdate(req.user._id, {
      $set: { mfaSecret: secret }
    })

    res.json({
      success: true,
      data: {
        secret,
        qrCode
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Verify TOTP code during setup (enables MFA)
 * @route   POST /api/mfa/verify
 * @access  Private
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.mfaSecret) {
      return res.status(400).json({
        success: false,
        message: 'MFA setup has not been initiated. Call /setup first.'
      })
    }

    if (user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is already enabled'
      })
    }

    // Validate the token against stored secret
    const totp = new OTPAuth.TOTP({
      issuer: 'HOH108CRM',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.mfaSecret)
    })

    const delta = totp.validate({ token, window: 1 })

    if (delta === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      })
    }

    // Enable MFA
    await User.findByIdAndUpdate(req.user._id, {
      $set: { mfaEnabled: true }
    })

    res.json({
      success: true,
      message: 'MFA has been successfully enabled'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Validate TOTP token on login
 * @route   POST /api/mfa/validate
 * @access  Public (called during login flow)
 */
router.post('/validate', async (req, res) => {
  try {
    const { userId, token } = req.body

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'userId and token are required'
      })
    }

    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({
        success: false,
        message: 'MFA is not enabled for this user'
      })
    }

    // Validate the TOTP token
    const totp = new OTPAuth.TOTP({
      issuer: 'HOH108CRM',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.mfaSecret)
    })

    const delta = totp.validate({ token, window: 1 })

    if (delta === null) {
      // Check if the token matches a recovery code
      if (user.mfaRecoveryCodes && user.mfaRecoveryCodes.length > 0) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
        const recoveryIndex = user.mfaRecoveryCodes.findIndex(code => code === hashedToken)

        if (recoveryIndex !== -1) {
          // Remove the used recovery code
          user.mfaRecoveryCodes.splice(recoveryIndex, 1)
          await user.save({ validateBeforeSave: false })

          return res.json({
            success: true,
            message: 'Validated with recovery code. Consider generating new recovery codes.',
            data: {
              usedRecoveryCode: true,
              remainingRecoveryCodes: user.mfaRecoveryCodes.length
            }
          })
        }
      }

      return res.json({
        success: false,
        message: 'Invalid MFA token'
      })
    }

    res.json({
      success: true,
      message: 'MFA validation successful'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Disable MFA
 * @route   DELETE /api/mfa/disable
 * @access  Private
 */
router.delete('/disable', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is not currently enabled'
      })
    }

    // Disable MFA and remove the secret and recovery codes
    await User.findByIdAndUpdate(req.user._id, {
      $set: { mfaEnabled: false },
      $unset: { mfaSecret: 1, mfaRecoveryCodes: 1 }
    })

    res.json({
      success: true,
      message: 'MFA has been disabled'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * @desc    Generate backup recovery codes
 * @route   POST /api/mfa/recovery-codes
 * @access  Private
 */
router.post('/recovery-codes', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA must be enabled before generating recovery codes'
      })
    }

    // Generate 10 random 8-character alphanumeric recovery codes
    const plainCodes = []
    const hashedCodes = []

    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex') // 8 hex chars
      plainCodes.push(code)
      hashedCodes.push(crypto.createHash('sha256').update(code).digest('hex'))
    }

    // Store hashed codes on user
    await User.findByIdAndUpdate(req.user._id, {
      $set: { mfaRecoveryCodes: hashedCodes }
    })

    res.json({
      success: true,
      data: {
        recoveryCodes: plainCodes
      },
      message: 'Store these codes safely. They will not be shown again.'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

export default router
