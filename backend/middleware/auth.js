/**
 * Authentication Middleware
 * This file maintains backward compatibility while integrating with the new RBAC system
 */

import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Protect routes
export const protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user with company information for new RBAC system
    req.user = await User.findById(decoded.id)
      .populate('company', 'code name type parentCompany isActive leadStatuses projectStages')

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      })
    }

    // For new users with company association, check company status
    if (req.user.company && !req.user.company.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Company account is deactivated'
      })
    }

    // Set active company context (for routes that haven't migrated to RBAC)
    req.activeCompany = req.user.company
    req.activeRole = req.user.role

    next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    })
  }
}

// Grant access to specific roles (backward compatible)
// Maps legacy roles to new roles
const legacyRoleMapping = {
  'superadmin': ['super_admin', 'company_admin'],
  'admin': ['company_admin', 'sales_manager', 'project_manager'],
  'user': ['sales_executive', 'designer', 'site_engineer', 'operations', 'finance', 'viewer']
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role

    // Check direct role match
    if (roles.includes(userRole)) {
      return next()
    }

    // Check legacy role mapping for backward compatibility
    const legacyRole = req.user.legacyRole
    if (legacyRole && legacyRoleMapping[legacyRole]) {
      const mappedRoles = legacyRoleMapping[legacyRole]
      if (roles.some(r => mappedRoles.includes(r)) ||
          roles.includes(legacyRole)) {
        return next()
      }
    }

    // Special handling: 'admin' role should include super_admin and company_admin
    if (roles.includes('admin') &&
        ['super_admin', 'company_admin'].includes(userRole)) {
      return next()
    }

    // Special handling: 'superadmin' role should match super_admin
    if (roles.includes('superadmin') && userRole === 'super_admin') {
      return next()
    }

    return res.status(403).json({
      success: false,
      message: `User role '${userRole}' is not authorized to access this route`
    })
  }
}

// Generate JWT Token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  })
}

// Export new RBAC middleware for gradual migration
export {
  protect as protectRoute,
  authorize as authorizeRoles
} from './rbac.js'
