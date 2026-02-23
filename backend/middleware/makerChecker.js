import ApprovalWorkflow from '../models/ApprovalWorkflow.js'
import ApprovalMatrix from '../models/ApprovalMatrix.js'

/**
 * Maker-Checker Middleware
 * SOX Controls:
 * - GL-002: Journal Entry Authorization
 * - PTP-007: Payment Authorization
 * - HTR-007: Compensation Changes Authorization
 * - MDM-004: Bank Account Master Changes
 *
 * Implements segregation of duties by:
 * 1. Preventing self-approval
 * 2. Requiring multi-level approval based on amount/type
 * 3. Creating approval workflows for critical actions
 */

/**
 * Check if an action requires approval based on ApprovalMatrix
 * @param {Object} options - Options for the check
 * @param {string} options.module - Module name (finance, hr, procurement, etc.)
 * @param {string} options.activity - Activity type (create, update, delete, approve)
 * @param {number} options.amount - Transaction amount (optional)
 * @param {ObjectId} options.companyId - Company ID
 * @returns {Promise<{required: boolean, matrix: ApprovalMatrix|null}>}
 */
export const checkApprovalRequired = async ({ module, activity, amount, companyId }) => {
  try {
    const matrix = await ApprovalMatrix.findApplicableMatrix({
      company: companyId,
      module,
      activity,
      amount
    })

    if (!matrix || !matrix.isActive) {
      return { required: false, matrix: null }
    }

    return { required: true, matrix }
  } catch (error) {
    console.error('[MakerChecker] Error checking approval requirement:', error)
    return { required: false, matrix: null }
  }
}

/**
 * Middleware to prevent self-approval
 * Use on approval endpoints
 */
export const preventSelfApproval = (creatorField = 'createdBy') => {
  return async (req, res, next) => {
    try {
      // Get the document being approved
      const Model = req.approvalModel
      const documentId = req.params.id || req.body.documentId

      if (!Model || !documentId) {
        return next() // Skip if no model context
      }

      const document = await Model.findById(documentId)
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        })
      }

      // Check if the approver is the creator
      const creatorId = document[creatorField]?.toString()
      const approverId = req.user._id.toString()

      if (creatorId === approverId) {
        return res.status(403).json({
          success: false,
          message: 'SOX Compliance: You cannot approve your own submission',
          code: 'SELF_APPROVAL_BLOCKED',
          soxControl: 'Maker-Checker'
        })
      }

      req.approvalDocument = document
      next()
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}

/**
 * Middleware to require approval for specified actions
 * Creates an ApprovalWorkflow instead of executing the action directly
 *
 * @param {Object} options
 * @param {string} options.module - Module name
 * @param {string} options.activity - Activity type
 * @param {function} options.getAmount - Function to extract amount from request (req) => number
 * @param {function} options.getDescription - Function to get workflow description
 * @param {string} options.entityType - Entity type for the workflow
 */
export const requireApproval = (options) => {
  const { module, activity, getAmount, getDescription, entityType } = options

  return async (req, res, next) => {
    try {
      // Skip if explicitly bypassing (for system operations)
      if (req.bypassApproval) {
        return next()
      }

      const amount = getAmount ? getAmount(req) : 0
      const companyId = req.activeCompany?._id || req.user.company

      // Check if approval is required
      const { required, matrix } = await checkApprovalRequired({
        module,
        activity,
        amount,
        companyId
      })

      if (!required) {
        return next() // No approval required, proceed normally
      }

      // For amounts below auto-approve threshold, skip approval
      if (matrix.settings?.autoApproveBelow && amount < matrix.settings.autoApproveBelow) {
        return next()
      }

      // Create approval workflow
      const description = getDescription ? getDescription(req) : `${activity} action in ${module}`

      const workflow = await ApprovalWorkflow.createWorkflow({
        company: companyId,
        entityType: entityType || module,
        entityId: req.body.entityId || req.params.id,
        module,
        activity,
        description,
        amount,
        requestedBy: req.user._id,
        matrix
      })

      // Store workflow in request for further processing
      req.approvalWorkflow = workflow
      req.approvalRequired = true

      // Return response indicating approval is needed
      return res.status(202).json({
        success: true,
        message: 'Action submitted for approval',
        approvalRequired: true,
        workflow: {
          id: workflow._id,
          status: workflow.status,
          currentLevel: workflow.currentLevel,
          description
        },
        soxControl: 'Maker-Checker'
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}

/**
 * Middleware to check approval status before allowing action
 * Use on routes that should only proceed if approved
 */
export const requireApprovalStatus = (allowedStatuses = ['approved']) => {
  return async (req, res, next) => {
    try {
      const workflowId = req.body.approvalWorkflowId || req.query.approvalWorkflowId

      if (!workflowId) {
        return res.status(400).json({
          success: false,
          message: 'Approval workflow ID is required',
          soxControl: 'Maker-Checker'
        })
      }

      const workflow = await ApprovalWorkflow.findById(workflowId)

      if (!workflow) {
        return res.status(404).json({
          success: false,
          message: 'Approval workflow not found'
        })
      }

      if (!allowedStatuses.includes(workflow.status)) {
        return res.status(403).json({
          success: false,
          message: `Action requires approval status: ${allowedStatuses.join(' or ')}. Current status: ${workflow.status}`,
          workflowStatus: workflow.status,
          soxControl: 'Maker-Checker'
        })
      }

      req.approvalWorkflow = workflow
      next()
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}

/**
 * Middleware to enforce amount-based approval thresholds
 * @param {number} threshold - Amount threshold requiring additional approval
 * @param {string} amountField - Field containing the amount in request body
 */
export const requireAmountApproval = (threshold, amountField = 'amount') => {
  return async (req, res, next) => {
    try {
      const amount = req.body[amountField] || 0

      if (amount >= threshold) {
        // Check if user has high-value approval permission
        const hasHighValuePermission = ['super_admin', 'company_admin'].includes(req.user.role) ||
                                       req.user.approvalAuthority?.approvalLimit >= amount

        if (!hasHighValuePermission) {
          return res.status(403).json({
            success: false,
            message: `Amount ${amount} exceeds your approval limit. Additional approval required.`,
            threshold,
            amount,
            soxControl: 'Amount-Based Approval'
          })
        }
      }

      next()
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
}

/**
 * Middleware to log maker-checker actions for audit
 */
export const auditMakerChecker = (action, module) => {
  return async (req, res, next) => {
    const startTime = Date.now()

    // Store original send to capture response
    const originalSend = res.send

    res.send = function(body) {
      // Log the action asynchronously
      setImmediate(async () => {
        try {
          const AuditLog = (await import('../models/AuditLog.js')).default

          await AuditLog.create({
            company: req.activeCompany?._id || req.user.company,
            user: req.user._id,
            userName: req.user.name,
            action: `maker_checker_${action}`,
            module,
            entityType: req.approvalDocument?.constructor?.modelName,
            entityId: req.params.id || req.body.entityId,
            details: {
              method: req.method,
              path: req.originalUrl,
              statusCode: res.statusCode,
              duration: Date.now() - startTime,
              approvalRequired: req.approvalRequired,
              workflowId: req.approvalWorkflow?._id
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          })
        } catch (err) {
          console.error('[MakerChecker] Audit log error:', err)
        }
      })

      originalSend.call(this, body)
    }

    next()
  }
}

/**
 * Predefined configurations for common SOX controls
 */
export const MakerCheckerConfigs = {
  // GL-002: Journal Entry Authorization
  journalEntry: {
    module: 'finance',
    activity: 'journal_entry',
    getAmount: (req) => req.body.totalDebit || 0,
    getDescription: (req) => `Journal Entry: ${req.body.description || 'New entry'}`,
    entityType: 'JournalEntry'
  },

  // PTP-007: Payment Authorization
  payment: {
    module: 'finance',
    activity: 'payment',
    getAmount: (req) => req.body.amount || 0,
    getDescription: (req) => `Payment: ${req.body.amount} to ${req.body.vendorName || 'vendor'}`,
    entityType: 'Payment'
  },

  // HTR-007: Compensation Changes
  salaryChange: {
    module: 'hr',
    activity: 'salary_change',
    getAmount: (req) => req.body.newSalary || 0,
    getDescription: (req) => `Salary change for ${req.body.employeeName || 'employee'}`,
    entityType: 'User'
  },

  // MDM-004: Bank Account Master Changes
  bankDetailsChange: {
    module: 'vendor',
    activity: 'bank_details_change',
    getAmount: () => 0, // Not amount-based
    getDescription: (req) => `Bank details change for ${req.body.vendorName || 'vendor'}`,
    entityType: 'Vendor'
  },

  // Customer credit limit changes
  creditLimitChange: {
    module: 'sales',
    activity: 'credit_limit_change',
    getAmount: (req) => req.body.newCreditLimit || 0,
    getDescription: (req) => `Credit limit change for ${req.body.customerName || 'customer'}`,
    entityType: 'Customer'
  }
}

export default {
  checkApprovalRequired,
  preventSelfApproval,
  requireApproval,
  requireApprovalStatus,
  requireAmountApproval,
  auditMakerChecker,
  MakerCheckerConfigs
}
