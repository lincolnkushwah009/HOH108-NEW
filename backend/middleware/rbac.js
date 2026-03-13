import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User, { PERMISSIONS, ROLE_PERMISSIONS, MODULE_PERMISSION_MAP, ALL_MODULE_PERMISSION_KEYS, MODULE_GROUPS } from '../models/User.js'
import Company from '../models/Company.js'
import TokenBlacklist from '../models/TokenBlacklist.js'

/**
 * RBAC (Role-Based Access Control) Middleware
 *
 * This middleware provides:
 * - Authentication with JWT
 * - Company context management
 * - Permission-based authorization
 * - Company-scoped data access
 */

// Re-export PERMISSIONS and MODULE constants for use in routes
export { PERMISSIONS, MODULE_PERMISSION_MAP, ALL_MODULE_PERMISSION_KEYS, MODULE_GROUPS } from '../models/User.js'

// Helper to safely extract ID string from populated or unpopulated Mongoose field
const toId = (field) => (field?._id || field)?.toString()

/**
 * Protect routes - Authentication middleware
 * Verifies JWT token and attaches user to request
 *
 * SOX Controls Implemented:
 * - ITGC-002: Token blacklist checking (User Access Revocation)
 * - ITGC-004: Account lockout and password expiry checks
 */
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

    // SOX Control: ITGC-002 - Check if token is blacklisted
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const isBlacklisted = await TokenBlacklist.isBlacklisted(tokenHash)
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated. Please log in again.',
        code: 'TOKEN_BLACKLISTED'
      })
    }

    // Get user with company information (include canViewLeadsFrom for cross-company lead visibility)
    req.user = await User.findById(decoded.id)
      .populate('company', 'code name type parentCompany isActive leadStatuses projectStages canViewLeadsFrom')
      .populate('additionalCompanies.company', 'code name type')

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

    // SOX Control: ITGC-004 - Check if account is locked
    if (req.user.isLocked && req.user.isLocked()) {
      const remainingMinutes = req.user.getLockoutRemainingMinutes()
      return res.status(401).json({
        success: false,
        message: `Account is locked due to too many failed login attempts. Try again in ${remainingMinutes} minutes.`,
        code: 'ACCOUNT_LOCKED',
        lockoutRemainingMinutes: remainingMinutes
      })
    }

    // SOX Control: ITGC-004 - Check if password was changed after token was issued
    if (req.user.changedPasswordAfter && decoded.iat) {
      if (req.user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: 'Password has been changed. Please log in again.',
          code: 'PASSWORD_CHANGED'
        })
      }
    }

    // SOX Control: ITGC-004 - Check password expiry (allow password change endpoints)
    const passwordExemptPaths = ['/api/auth/change-password', '/api/auth/logout', '/api/auth/password-status']
    if (req.user.isPasswordExpired && req.user.isPasswordExpired() && !passwordExemptPaths.includes(req.originalUrl)) {
      return res.status(403).json({
        success: false,
        message: 'Your password has expired. Please change your password to continue.',
        code: 'PASSWORD_EXPIRED',
        passwordExpired: true
      })
    }

    // Check must change password flag (for admin-reset passwords)
    if (req.user.mustChangePassword && !passwordExemptPaths.includes(req.originalUrl)) {
      return res.status(403).json({
        success: false,
        message: 'You must change your password before continuing.',
        code: 'MUST_CHANGE_PASSWORD',
        mustChangePassword: true
      })
    }

    // Only block if user HAS a company but it's deactivated
    // Users without a company assigned will get a default in setCompanyContext
    if (req.user.company && !req.user.company.isActive) {
      console.log(`[RBAC/Protect] BLOCKED - Company deactivated | User: ${req.user.email} | Company: ${req.user.company?.name}`)
      return res.status(401).json({
        success: false,
        message: 'Company account is deactivated'
      })
    }

    // Store token info for potential blacklisting on logout
    req.tokenInfo = {
      token,
      tokenHash,
      decoded,
      expiresAt: new Date(decoded.exp * 1000)
    }

    // Update last active timestamp
    req.user.lastActiveAt = new Date()
    await req.user.save({ validateBeforeSave: false })

    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      })
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    })
  }
}

/**
 * Set company context from header or use user's primary company
 * Use header: X-Company-Id or x-company-id
 * Special value 'all' allows super admins to view data across all companies
 */
export const setCompanyContext = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.headers['X-Company-Id']

    // Check if super admin is requesting "all companies" view
    if (companyId === 'all') {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Only super admins can view all companies'
        })
      }
      // Set special flag for viewing all companies
      req.activeCompany = null
      req.viewingAllCompanies = true
      req.viewingBothCompanies = false
      req.activeRole = req.user.role
      return next()
    }

    // Handle "both" - show employees with entity=Both
    if (companyId === 'both') {
      req.activeCompany = null
      req.viewingAllCompanies = false
      req.viewingBothCompanies = true
      req.activeRole = req.user.role
      return next()
    }

    if (companyId) {
      // Verify user has access to this company
      if (!req.user.canAccessCompany(companyId)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this company'
        })
      }

      // Set the active company context (populate canViewLeadsFrom for cross-company lead visibility)
      req.activeCompany = await Company.findById(companyId)
        .populate('canViewLeadsFrom', '_id code name')
      if (!req.activeCompany) {
        return res.status(404).json({
          success: false,
          message: 'Company not found'
        })
      }

      // Get role for this specific company
      req.activeRole = req.user.getRoleForCompany(companyId)
      req.viewingAllCompanies = false
    } else {
      // Use user's primary company
      req.activeCompany = req.user.company
      req.activeRole = req.user.role
      req.viewingAllCompanies = false

      // If user has no company assigned, try to find one
      if (!req.activeCompany) {
        // For super_admin, allow access without company
        if (req.user.role === 'super_admin') {
          req.activeCompany = null
          return next()
        }

        // Try to find any active company and assign it
        const defaultCompany = await Company.findOne({ isActive: true })
        if (defaultCompany) {
          req.activeCompany = defaultCompany
        } else {
          // Still proceed but without company context - some routes may work
          req.activeCompany = null
        }
      }
    }

    next()
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error setting company context'
    })
  }
}

/**
 * Authorize based on roles
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.activeRole || req.user.role

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Role '${userRole}' is not authorized to access this route`
      })
    }
    next()
  }
}

/**
 * Check for specific permission(s)
 * @param {...string} permissions - Required permissions (any match allows access)
 */
export const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user.hasAnyPermission(permissions)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      })
    }
    next()
  }
}

/**
 * Check for ALL specified permissions
 * @param {...string} permissions - All permissions required
 */
export const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user.hasAllPermissions(permissions)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have all required permissions'
      })
    }
    next()
  }
}

/**
 * Check for module-level permission (view/edit) on a specific function
 * Uses the new granular modulePermissions on the User model
 * @param {string} functionKey - e.g., 'leads', 'vendors', 'all_projects'
 * @param {string} accessType - 'view' or 'edit'
 */
export const requireModulePermission = (functionKey, accessType = 'view') => {
  return async (req, res, next) => {
    // Super admins and company admins bypass module permission checks
    if (['super_admin', 'company_admin'].includes(req.user.role)) {
      return next()
    }

    const user = await User.findById(req.user._id).select('modulePermissions')
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    const perm = user.modulePermissions?.[functionKey]
    const hasAccess = perm ? !!(accessType === 'edit' ? perm.edit : perm.view) : false

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `You do not have ${accessType} access to ${functionKey.replace(/_/g, ' ')}`
      })
    }
    next()
  }
}

/**
 * Company-scoped query filter
 * Adds company filter to queries based on user's access
 */
export const companyScopedQuery = (req, baseQuery = {}) => {
  // If super admin is viewing all companies, don't filter by company
  if (req.viewingAllCompanies && req.user.role === 'super_admin') {
    return baseQuery
  }

  // If viewing "Both" entity, filter by entity=Both
  if (req.viewingBothCompanies) {
    return {
      ...baseQuery,
      entity: 'Both'
    }
  }

  const companyId = req.activeCompany?._id || req.user.company?._id

  // Super admin can see all if no company context set
  if (req.user.role === 'super_admin' && !companyId) {
    return baseQuery
  }

  // If no company ID available, return empty filter
  if (!companyId) {
    return baseQuery
  }

  // Include employees whose primary company matches OR who have this company in additionalCompanies
  return {
    ...baseQuery,
    $or: [
      { company: companyId },
      { 'additionalCompanies.company': companyId }
    ]
  }
}

/**
 * Company-scoped query filter for leads (includes linked companies)
 * This allows companies to view leads from other linked companies
 */
export const companyLeadScopedQuery = (req, baseQuery = {}) => {
  // If super admin is viewing all companies, don't filter by company
  if (req.viewingAllCompanies && req.user.role === 'super_admin') {
    return baseQuery
  }

  const companyId = req.activeCompany?._id || req.user.company?._id
  // Handle both populated (objects with _id) and unpopulated (ObjectIds) canViewLeadsFrom
  const rawLinkedCompanies = req.activeCompany?.canViewLeadsFrom || req.user.company?.canViewLeadsFrom || []
  const linkedCompanies = rawLinkedCompanies.map(c => c._id || c)

  // Super admin can see all if no company context set
  if (req.user.role === 'super_admin' && !companyId) {
    return baseQuery
  }

  // If no company ID available, return empty filter
  if (!companyId) {
    return baseQuery
  }

  // If there are linked companies, include their leads too
  if (linkedCompanies && linkedCompanies.length > 0) {
    const allCompanyIds = [companyId, ...linkedCompanies]
    return {
      ...baseQuery,
      company: { $in: allCompanyIds }
    }
  }

  return {
    ...baseQuery,
    company: companyId
  }
}

/**
 * Check if user can access specific lead
 */
export const canAccessLead = async (req, lead) => {
  // Super admin can access all leads regardless of company
  if (req.user.role === 'super_admin') {
    return true
  }

  // Company admin and sales manager can access all leads in their accessible companies
  if (['company_admin', 'sales_manager'].includes(req.user.role)) {
    // If lead has no company, allow access
    if (!lead.company) return true
    return req.user.canAccessCompany(toId(lead.company))
  }

  // For other roles, lead must have a company and match user's company
  if (!lead.company || !req.user.company) {
    return false
  }

  // Check if lead is in user's company (handle populated fields)
  if (toId(lead.company) !== toId(req.user.company)) {
    return false
  }

  // Check view_all permission
  if (req.user.hasPermission(PERMISSIONS.LEADS_VIEW_ALL)) {
    return true
  }

  // Check if user is assigned to this lead (handle populated fields)
  if (req.user.hasPermission(PERMISSIONS.LEADS_VIEW_ASSIGNED)) {
    const isAssigned = toId(lead.assignedTo) === req.user._id.toString()
    const isTeamMember = lead.teamMembers?.some(tm => toId(tm.user) === req.user._id.toString())
    return isAssigned || isTeamMember
  }

  return false
}

/**
 * Check if user can access specific customer
 */
export const canAccessCustomer = async (req, customer) => {
  // Super admin and company admin can access all customers
  if (['super_admin', 'company_admin'].includes(req.user.role)) {
    return req.user.canAccessCompany(toId(customer.company))
  }

  // Check if customer is in user's company (handle populated fields)
  if (toId(customer.company) !== toId(req.user.company)) {
    return false
  }

  // Check view_all permission
  if (req.user.hasPermission(PERMISSIONS.CUSTOMERS_VIEW_ALL)) {
    return true
  }

  // Check if user is account manager or team member (handle populated fields)
  if (req.user.hasPermission(PERMISSIONS.CUSTOMERS_VIEW_ASSIGNED)) {
    const isAccountManager = toId(customer.accountManager) === req.user._id.toString()
    const isTeamMember = customer.teamMembers?.some(tm => toId(tm.user) === req.user._id.toString())
    return isAccountManager || isTeamMember
  }

  return false
}

/**
 * Check if user can access specific project
 */
export const canAccessProject = async (req, project) => {
  // Super admin and company admin can access all projects
  if (['super_admin', 'company_admin'].includes(req.user.role)) {
    return req.user.canAccessCompany(toId(project.company))
  }

  // Check if project is in user's company (handle populated fields)
  if (toId(project.company) !== toId(req.user.company)) {
    return false
  }

  // Check view_all permission
  if (req.user.hasPermission(PERMISSIONS.PROJECTS_VIEW_ALL)) {
    return true
  }

  // Check if user is project manager or team member (handle populated fields)
  if (req.user.hasPermission(PERMISSIONS.PROJECTS_VIEW_ASSIGNED)) {
    const isProjectManager = toId(project.projectManager) === req.user._id.toString()
    const isTeamMember = project.teamMembers?.some(tm => toId(tm.user) === req.user._id.toString())
    return isProjectManager || isTeamMember
  }

  return false
}

/**
 * Build query filter for leads based on user's permissions
 * Uses companyLeadScopedQuery to include leads from linked companies
 */
export const getLeadQueryFilter = (req, additionalFilters = {}) => {
  const baseFilter = companyLeadScopedQuery(req, additionalFilters)

  // Super admin, company admin, sales manager see all
  if (['super_admin', 'company_admin', 'sales_manager'].includes(req.user.role)) {
    return baseFilter
  }

  // If user can view all leads in company
  if (req.user.hasPermission(PERMISSIONS.LEADS_VIEW_ALL)) {
    return baseFilter
  }

  // Otherwise, show leads that are either:
  // 1. In the user's company AND assigned to them, OR
  // 2. Assigned to them in ANY company (cross-company assignment)
  const assignedConditions = [
    { assignedTo: req.user._id },
    { 'teamMembers.user': req.user._id },
    { 'departmentAssignments.preSales.employee': req.user._id },
    { 'departmentAssignments.crm.employee': req.user._id },
    { 'departmentAssignments.sales.employee': req.user._id },
    { 'departmentAssignments.design.employee': req.user._id },
    { 'departmentAssignments.operations.employee': req.user._id },
    { 'departmentAssignments.finance.employee': req.user._id },
    { createdBy: req.user._id }
  ]

  return {
    ...additionalFilters,
    $or: assignedConditions
  }
}

/**
 * Build query filter for customers based on user's permissions
 */
export const getCustomerQueryFilter = (req, additionalFilters = {}) => {
  const baseFilter = companyScopedQuery(req, additionalFilters)

  // Super admin, company admin see all
  if (['super_admin', 'company_admin'].includes(req.user.role)) {
    return baseFilter
  }

  // If user can view all customers in company
  if (req.user.hasPermission(PERMISSIONS.CUSTOMERS_VIEW_ALL)) {
    return baseFilter
  }

  // Otherwise, only assigned customers
  return {
    ...baseFilter,
    $or: [
      { accountManager: req.user._id },
      { 'teamMembers.user': req.user._id }
    ]
  }
}

/**
 * Build query filter for projects based on user's permissions
 */
export const getProjectQueryFilter = (req, additionalFilters = {}) => {
  const baseFilter = companyScopedQuery(req, additionalFilters)

  // Super admin, company admin see all
  if (['super_admin', 'company_admin', 'project_manager'].includes(req.user.role)) {
    return baseFilter
  }

  // If user can view all projects in company
  if (req.user.hasPermission(PERMISSIONS.PROJECTS_VIEW_ALL)) {
    return baseFilter
  }

  // Otherwise, only assigned projects
  return {
    ...baseFilter,
    $or: [
      { projectManager: req.user._id },
      { 'teamMembers.user': req.user._id }
    ]
  }
}

/**
 * Check if user can modify a resource (lead/customer/project)
 * For edit/delete operations
 */
export const canModifyResource = (req, resource, resourceType) => {
  // Super admin can modify anything
  if (req.user.role === 'super_admin') return true

  // Handle missing company
  const resourceCompanyId = resource.company?._id || resource.company
  if (!resourceCompanyId || !req.user.company) {
    // Allow company_admin to modify resources without company
    return req.user.role === 'company_admin'
  }

  // Check if user has access to resource's company (primary or additional)
  const userCompanyId = req.user.company._id.toString()
  const userAdditionalCompanies = (req.user.additionalCompanies || []).map(ac => (ac.company?._id || ac.company)?.toString()).filter(Boolean)
  const userAllCompanies = [userCompanyId, ...userAdditionalCompanies]
  const resCompanyStr = resourceCompanyId.toString()

  // If user is assigned to the resource, allow regardless of company
  const userId = req.user._id.toString()
  if (resourceType === 'lead') {
    if (toId(resource.assignedTo) === userId || resource.teamMembers?.some(tm => toId(tm.user) === userId)) {
      // User is assigned — allow modification
      if (req.user.hasPermission(PERMISSIONS.LEADS_EDIT)) return true
    }
  }

  if (!userAllCompanies.includes(resCompanyStr)) {
    return false
  }

  // Company admin can modify all in their company
  if (req.user.role === 'company_admin') return true

  // Check specific permission
  const editPermissionMap = {
    lead: PERMISSIONS.LEADS_EDIT,
    customer: PERMISSIONS.CUSTOMERS_EDIT,
    project: PERMISSIONS.PROJECTS_EDIT
  }

  if (!req.user.hasPermission(editPermissionMap[resourceType])) {
    return false
  }

  // Check ownership/assignment based on role (handle populated fields)
  switch (resourceType) {
    case 'lead':
      // Managers with view-all access can modify any lead in their company
      if (req.user.hasPermission && req.user.hasPermission(PERMISSIONS.LEADS_VIEW_ALL)) return true
      return toId(resource.assignedTo) === userId ||
             resource.teamMembers?.some(tm => toId(tm.user) === userId)
    case 'customer':
      return toId(resource.accountManager) === userId ||
             resource.teamMembers?.some(tm => toId(tm.user) === userId)
    case 'project':
      return toId(resource.projectManager) === userId ||
             resource.teamMembers?.some(tm =>
               toId(tm.user) === userId &&
               ['lead', 'designer', 'site_engineer'].includes(tm.role)
             )
    default:
      return false
  }
}

/**
 * Generate JWT Token with company context
 */
export const generateToken = (userId, companyId = null) => {
  const payload = { id: userId }
  if (companyId) {
    payload.company = companyId
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  })
}

/**
 * Middleware to log access for audit trail
 */
export const auditLog = (action) => {
  return async (req, res, next) => {
    // Store original send
    const originalSend = res.send

    res.send = function(data) {
      // Log after response (non-blocking)
      setImmediate(async () => {
        try {
          // You can implement audit logging to database here
          console.log({
            action,
            userId: req.user?._id,
            userName: req.user?.name,
            companyId: req.activeCompany?._id || req.user?.company?._id,
            method: req.method,
            path: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: new Date(),
            statusCode: res.statusCode
          })
        } catch (err) {
          console.error('Audit log error:', err)
        }
      })

      originalSend.call(this, data)
    }

    next()
  }
}

/**
 * Rate limiting by company (for API abuse prevention)
 * Simple in-memory implementation - use Redis for production
 */
const companyRateLimits = new Map()

export const companyRateLimit = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    const companyId = req.user?.company?._id?.toString() || 'anonymous'
    const now = Date.now()

    if (!companyRateLimits.has(companyId)) {
      companyRateLimits.set(companyId, { count: 1, resetAt: now + windowMs })
      return next()
    }

    const limit = companyRateLimits.get(companyId)

    if (now > limit.resetAt) {
      limit.count = 1
      limit.resetAt = now + windowMs
      return next()
    }

    if (limit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      })
    }

    limit.count++
    next()
  }
}

/**
 * Configuration-based permission check (new hierarchical system)
 * Falls back to existing requirePermission() on error or missing config.
 *
 * Maps permission key suffixes to CRUD actions:
 *   view/view_all/view_assigned → read
 *   create/import → create
 *   edit/assign → update
 *   delete → delete
 *   convert/approve → approve
 *   export → export
 *
 * Uses 5-minute in-memory cache per (company, role, node).
 */
const configPermCache = new Map()
const CONFIG_PERM_CACHE_TTL = 5 * 60 * 1000

function mapKeyToAction(key) {
  const suffix = key.split(':').pop()
  const mapping = {
    view: 'read', view_all: 'read', view_assigned: 'read',
    create: 'create', import: 'create',
    edit: 'update', assign: 'update',
    delete: 'delete',
    convert: 'approve', approve: 'approve',
    export: 'export',
    manage: 'update', manage_roles: 'update', manage_team: 'update',
    manage_settings: 'update', manage_financials: 'update', manage_pipelines: 'update'
  }
  return mapping[suffix] || 'read'
}

export const requireConfiguredPermission = (...permissionKeys) => {
  return async (req, res, next) => {
    try {
      // Lazy-load models to avoid circular dependency
      const ProcessConfiguration = (await import('../models/ProcessConfiguration.js')).default
      const RolePermissionConfig = (await import('../models/RolePermissionConfig.js')).default

      const companyId = req.activeCompany?._id || req.user?.company?._id
      const userRoleId = req.user?.userRole

      if (!companyId || !userRoleId) {
        // No config context — fall back to legacy
        return requirePermission(...permissionKeys)(req, res, next)
      }

      // Check each permission key against new system
      for (const key of permissionKeys) {
        const cacheKey = `${companyId}:${userRoleId}:${key}`
        const cached = configPermCache.get(cacheKey)

        if (cached && Date.now() - cached.ts < CONFIG_PERM_CACHE_TTL) {
          if (cached.allowed) return next()
          continue
        }

        const node = await ProcessConfiguration.findByLegacyPermission(companyId, key)
        if (!node) {
          configPermCache.set(cacheKey, { allowed: false, ts: Date.now() })
          continue
        }

        const effective = await RolePermissionConfig.getEffectivePermissions(companyId, userRoleId, node._id)
        const action = mapKeyToAction(key)
        const allowed = !!effective[action]

        configPermCache.set(cacheKey, { allowed, ts: Date.now() })

        if (allowed) return next()
      }

      // New system denied or had no config — fall back to legacy
      return requirePermission(...permissionKeys)(req, res, next)
    } catch (err) {
      // On any error, fall back to legacy system
      return requirePermission(...permissionKeys)(req, res, next)
    }
  }
}

// Export all middleware functions
export default {
  protect,
  setCompanyContext,
  authorize,
  requirePermission,
  requireAllPermissions,
  requireConfiguredPermission,
  companyScopedQuery,
  companyLeadScopedQuery,
  canAccessLead,
  canAccessCustomer,
  canAccessProject,
  getLeadQueryFilter,
  getCustomerQueryFilter,
  getProjectQueryFilter,
  canModifyResource,
  generateToken,
  auditLog,
  companyRateLimit,
  PERMISSIONS
}
