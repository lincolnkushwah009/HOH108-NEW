import express from 'express'
import {
  register,
  login,
  adminLogin,
  getMe,
  updateProfile,
  updatePassword,
  updatePhoneNumber,
  claimPoints,
  logout,
  getPasswordStatus,
  forceLogout
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.post('/register', register)
router.post('/login', login)
router.post('/admin/login', adminLogin)

// Protected routes
router.get('/me', protect, getMe)
router.put('/profile', protect, updateProfile)
router.put('/phone', protect, updatePhoneNumber)
router.put('/update-password', protect, updatePassword)
router.post('/claim-points', protect, claimPoints)

// SOX Control: ITGC-002 User Access Revocation
router.post('/logout', protect, logout)

// SOX Control: ITGC-004 Password Policy
router.get('/password-status', protect, getPasswordStatus)
router.put('/change-password', protect, updatePassword) // Alias for update-password

// Admin only - Force logout
router.post('/force-logout/:userId', protect, forceLogout)

export default router
