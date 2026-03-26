import nodemailer from 'nodemailer'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import Customer from '../models/Customer.js'
import Vendor from '../models/Vendor.js'

// ---- Email transporter (singleton) ----
let transporter = null

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }
  return transporter
}

/**
 * Send email (fire-and-forget, logs errors but never throws)
 */
async function sendEmail(to, subject, html) {
  try {
    const transport = getTransporter()
    if (!transport) {
      console.log('SMTP not configured, skipping email to:', to)
      return false
    }
    await transport.sendMail({
      from: process.env.SMTP_FROM || 'HOH108 CRM <noreply@hoh108.com>',
      to,
      subject,
      html
    })
    return true
  } catch (err) {
    console.error('Email send error:', err.message)
    return false
  }
}

/**
 * Walk the reportsTo chain from a user for up to `levels` hops.
 * Returns array of manager user IDs (deduplicated).
 */
export async function resolveHierarchy(userId, levels = 3) {
  const recipients = []
  let currentId = userId

  for (let i = 0; i < levels; i++) {
    const user = await User.findById(currentId).select('reportsTo').lean()
    if (!user || !user.reportsTo) break

    const managerId = user.reportsTo.toString()
    if (recipients.includes(managerId)) break // cycle guard
    recipients.push(managerId)
    currentId = managerId
  }

  return recipients
}

/**
 * Collect all notification recipients for a lead event.
 * Returns deduplicated array of user ID strings.
 */
export async function collectRecipients({ assignedOwner, previousOwner, lead }) {
  const recipientSet = new Set()

  // 1. Current assigned owner + their 3-level hierarchy
  if (assignedOwner) {
    recipientSet.add(assignedOwner.toString())
    const hierarchy = await resolveHierarchy(assignedOwner)
    hierarchy.forEach(id => recipientSet.add(id))
  }

  // 2. Previous owner + their manager (1 level)
  if (previousOwner && previousOwner.toString() !== assignedOwner?.toString()) {
    recipientSet.add(previousOwner.toString())
    const hierarchy = await resolveHierarchy(previousOwner, 1)
    hierarchy.forEach(id => recipientSet.add(id))
  }

  // 3. Department assignment owners on the lead + their direct manager
  if (lead?.departmentAssignments) {
    for (const dept of ['preSales', 'crm', 'sales', 'communityManager']) {
      const emp = lead.departmentAssignments[dept]?.employee
      if (emp) {
        const empId = emp.toString()
        recipientSet.add(empId)
        const mgr = await resolveHierarchy(empId, 1)
        mgr.forEach(id => recipientSet.add(id))
      }
    }
  }

  return [...recipientSet]
}

/**
 * Main notification dispatch - sends in-app + email notifications.
 * Never throws - notifications should not break the main workflow.
 */
export async function notifyLeadEvent({
  companyId,
  lead,
  event,
  title,
  message,
  assignedOwner,
  previousOwner,
  performedBy
}) {
  try {
    const recipientIds = await collectRecipients({ assignedOwner, previousOwner, lead })

    // Remove the performer from notifications (don't notify yourself)
    const filteredIds = recipientIds.filter(id => id !== performedBy?.toString())

    if (filteredIds.length === 0) return

    // 1. In-app notifications
    await Notification.notifyUsers(filteredIds, {
      company: companyId,
      type: event.includes('escalat') ? 'warning' : 'info',
      category: event.includes('assign') || event.includes('transfer') ? 'assignment' : 'lead',
      title,
      message,
      entityType: 'lead',
      entityId: lead._id,
      actionUrl: `/admin/leads/${lead._id}`,
      metadata: { event, leadId: lead.leadId }
    })

    // 2. Email notifications
    const recipients = await User.find({
      _id: { $in: filteredIds },
      isActive: true
    }).select('email name').lean()

    const leadCity = lead.location?.city || 'N/A'
    const leadName = lead.name || 'Unknown'
    const leadIdDisplay = lead.leadId || ''

    for (const user of recipients) {
      if (!user.email) continue
      sendEmail(
        user.email,
        title,
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #A68B6A; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">${title}</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">${message}</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                <td style="padding: 8px; color: #6b7280; font-size: 13px;">Lead:</td>
                <td style="padding: 8px; font-weight: 600;">${leadName} ${leadIdDisplay ? `(${leadIdDisplay})` : ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px; color: #6b7280; font-size: 13px;">City:</td>
                <td style="padding: 8px; font-weight: 600;">${leadCity}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">This is an automated notification from HOH108 CRM</p>
          </div>
        </div>`
      )
    }
  } catch (err) {
    console.error('Notification dispatch error:', err.message)
    // Never throw -- notifications should not break the main flow
  }
}

/**
 * Generalized event notification - works across all entity types.
 * Sends in-app notifications to employees + email to all parties.
 * Fire-and-forget: logs errors, never throws.
 *
 * @param {Object} opts
 * @param {string} opts.companyId - Company ObjectId
 * @param {string} opts.event - Event identifier (e.g. 'design_submitted', 'approval_status_changed')
 * @param {string} opts.entityType - Entity type ('lead','sales_order','design_iteration','approval','project')
 * @param {string} opts.entityId - Entity ObjectId
 * @param {string} opts.title - Notification title
 * @param {string} opts.message - Notification message body
 * @param {string[]} [opts.recipientUserIds] - Employee user IDs to notify
 * @param {string[]} [opts.recipientCustomerIds] - Customer IDs to email
 * @param {string[]} [opts.recipientPartnerIds] - Channel Partner IDs to email
 * @param {string} [opts.performedBy] - User ID who triggered the action (excluded from notifications)
 * @param {Object} [opts.metadata] - Extra metadata for the notification
 */
export async function notifyEvent({
  companyId,
  event,
  entityType,
  entityId,
  title,
  message,
  recipientUserIds = [],
  recipientCustomerIds = [],
  recipientPartnerIds = [],
  performedBy,
  metadata = {}
}) {
  try {
    // Remove performer from employee recipients
    const filteredUserIds = recipientUserIds
      .map(id => id.toString())
      .filter(id => id !== performedBy?.toString())

    // 1. In-app notifications for employees
    if (filteredUserIds.length > 0) {
      const actionUrlMap = {
        lead: `/admin/leads/${entityId}`,
        sales_order: `/admin/crm/sales-orders/${entityId}`,
        design_iteration: `/admin/crm/design-iterations/${entityId}`,
        approval: `/admin/crm/approvals/${entityId}`,
        project: `/admin/projects/${entityId}`,
        rfq: `/admin/procurement/rfq/${entityId}`,
        purchase_order: `/admin/procurement/purchase-orders/${entityId}`,
        grn: `/admin/procurement/grn/${entityId}`,
        vendor_invoice: `/admin/procurement/invoices/${entityId}`
      }

      await Notification.notifyUsers(filteredUserIds, {
        company: companyId,
        type: event.includes('reject') || event.includes('cancel') ? 'warning' : 'info',
        category: event.includes('assign') || event.includes('transfer') ? 'assignment' : entityType,
        title,
        message,
        entityType,
        entityId,
        actionUrl: actionUrlMap[entityType] || `/admin/${entityType}s/${entityId}`,
        metadata: { event, ...metadata }
      })
    }

    // 2. Email to employees
    if (filteredUserIds.length > 0) {
      const users = await User.find({
        _id: { $in: filteredUserIds },
        isActive: true
      }).select('email name').lean()

      for (const user of users) {
        if (!user.email) continue
        sendEmail(user.email, title, buildEmailHtml(title, message, metadata))
      }
    }

    // 3. Email to customers
    if (recipientCustomerIds.length > 0) {
      const customers = await Customer.find({
        _id: { $in: recipientCustomerIds }
      }).select('email name').lean()

      for (const cust of customers) {
        if (!cust.email) continue
        sendEmail(cust.email, title, buildEmailHtml(title, message, metadata))
      }
    }

    // 4. Email to channel partners
    if (recipientPartnerIds.length > 0) {
      try {
        const ChannelPartner = (await import('../models/ChannelPartner.js')).default
        const partners = await ChannelPartner.find({
          _id: { $in: recipientPartnerIds },
          status: 'active'
        }).select('email name').lean()

        for (const partner of partners) {
          if (!partner.email) continue
          sendEmail(partner.email, title, buildEmailHtml(title, message, metadata))
        }
      } catch (e) {
        // ChannelPartner model may not exist yet, skip
      }
    }
  } catch (err) {
    console.error('notifyEvent error:', err.message)
  }
}

/**
 * Procurement workflow notification - in-app only (no emails).
 * Creates Notification documents for procurement events like RFQ, PO, GRN, etc.
 * Fire-and-forget: logs errors, never throws.
 *
 * @param {string} event - One of: rfq_sent, quotation_received, po_acknowledged,
 *                         grn_created, grn_accepted, invoice_received, payment_processed
 * @param {Object} opts
 * @param {Object} opts.company - Company object (needs _id)
 * @param {Object} [opts.rfq] - RFQ document (for rfq_sent, quotation_received)
 * @param {Object} [opts.purchaseOrder] - PO document (for po_acknowledged, grn_created, etc.)
 * @param {Object} [opts.vendor] - Vendor document (needs _id, name)
 * @param {Object} [opts.grn] - GRN document (for grn_created, grn_accepted)
 * @param {Object} [opts.invoice] - Invoice document (for invoice_received)
 * @param {Object} [opts.payment] - Payment document (for payment_processed)
 * @param {string} [opts.performedBy] - User ID who triggered the action
 * @param {string[]} [opts.recipientUserIds] - Explicit recipient IDs (overrides auto-detection)
 */
export async function notifyProcurementEvent(event, opts = {}) {
  try {
    const {
      company,
      rfq,
      purchaseOrder,
      vendor,
      grn,
      invoice,
      payment,
      performedBy,
      recipientUserIds
    } = opts

    const companyId = company?._id || company
    if (!companyId) {
      console.error('notifyProcurementEvent: missing company')
      return
    }

    // Build event-specific title, message, entityType, entityId, actionUrl
    let title, message, entityType, entityId, actionUrl

    const vendorName = vendor?.name || 'Vendor'
    const rfqNumber = rfq?.rfqNumber || ''
    const poNumber = purchaseOrder?.poNumber || ''

    switch (event) {
      case 'rfq_sent':
        title = `RFQ Sent: ${rfqNumber}`
        message = `Request for Quotation ${rfqNumber} has been sent to ${vendorName}. Please submit your quotation before the deadline.`
        entityType = 'rfq'
        entityId = rfq?._id
        actionUrl = `/admin/procurement/rfq/${rfq?._id}`
        break

      case 'quotation_received':
        title = `Quotation Received: ${rfqNumber}`
        message = `${vendorName} has submitted a quotation for RFQ ${rfqNumber}. Review and compare vendor quotes.`
        entityType = 'rfq'
        entityId = rfq?._id
        actionUrl = `/admin/procurement/rfq/${rfq?._id}`
        break

      case 'po_acknowledged':
        title = `PO Acknowledged: ${poNumber}`
        message = `${vendorName} has acknowledged Purchase Order ${poNumber}.`
        entityType = 'purchase_order'
        entityId = purchaseOrder?._id
        actionUrl = `/admin/procurement/purchase-orders/${purchaseOrder?._id}`
        break

      case 'grn_created':
        title = `GRN Created: ${poNumber}`
        message = `A Goods Receipt Note has been created for Purchase Order ${poNumber}. Goods are pending inspection.`
        entityType = 'grn'
        entityId = grn?._id || purchaseOrder?._id
        actionUrl = `/admin/procurement/grn/${grn?._id || purchaseOrder?._id}`
        break

      case 'grn_accepted':
        title = `GRN Accepted: ${poNumber}`
        message = `Goods for Purchase Order ${poNumber} have passed inspection and been accepted.`
        entityType = 'grn'
        entityId = grn?._id || purchaseOrder?._id
        actionUrl = `/admin/procurement/grn/${grn?._id || purchaseOrder?._id}`
        break

      case 'invoice_received':
        title = `Invoice Received: ${poNumber}`
        message = `${vendorName} has submitted an invoice for Purchase Order ${poNumber}. Review and process for payment.`
        entityType = 'vendor_invoice'
        entityId = invoice?._id || purchaseOrder?._id
        actionUrl = `/admin/procurement/invoices/${invoice?._id || purchaseOrder?._id}`
        break

      case 'payment_processed':
        title = `Payment Processed: ${poNumber}`
        message = `Payment has been recorded for Purchase Order ${poNumber}. Amount processed for ${vendorName}.`
        entityType = 'purchase_order'
        entityId = purchaseOrder?._id
        actionUrl = `/admin/procurement/purchase-orders/${purchaseOrder?._id}`
        break

      default:
        console.warn(`notifyProcurementEvent: unknown event "${event}"`)
        return
    }

    // Determine recipients
    let finalRecipientIds = []

    if (recipientUserIds && recipientUserIds.length > 0) {
      finalRecipientIds = recipientUserIds.map(id => id.toString())
    } else {
      // Auto-detect: find users with procurement module access in this company
      const procurementUsers = await User.find({
        company: companyId,
        isActive: true,
        $or: [
          { role: { $in: ['super_admin', 'company_admin', 'procurement_manager'] } },
          { 'modulePermissions.purchase_orders.view': true },
          { 'modulePermissions.rfq.view': true }
        ]
      }).select('_id').lean()

      finalRecipientIds = procurementUsers.map(u => u._id.toString())
    }

    // Remove the performer from notifications
    if (performedBy) {
      finalRecipientIds = finalRecipientIds.filter(id => id !== performedBy.toString())
    }

    if (finalRecipientIds.length === 0) {
      console.log(`notifyProcurementEvent(${event}): no recipients found`)
      return
    }

    // Create in-app notifications
    await Notification.notifyUsers(finalRecipientIds, {
      company: companyId,
      type: event.includes('received') || event.includes('created') ? 'info' : 'success',
      category: 'procurement',
      title,
      message,
      entityType,
      entityId,
      actionUrl,
      metadata: { event, vendorName, rfqNumber, poNumber }
    })

    console.log(`notifyProcurementEvent(${event}): notified ${finalRecipientIds.length} user(s)`)
  } catch (err) {
    console.error(`notifyProcurementEvent(${event}) error:`, err.message)
    // Never throw - notifications should not break the main workflow
  }
}

/**
 * Build a branded HTML email template.
 */
function buildEmailHtml(title, message, metadata = {}) {
  let detailRows = ''
  if (metadata.entityLabel) {
    detailRows += `<tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Reference:</td><td style="padding: 8px; font-weight: 600;">${metadata.entityLabel}</td></tr>`
  }
  if (metadata.status) {
    detailRows += `<tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Status:</td><td style="padding: 8px; font-weight: 600;">${metadata.status}</td></tr>`
  }
  if (metadata.assignedTo) {
    detailRows += `<tr><td style="padding: 8px; color: #6b7280; font-size: 13px;">Assigned To:</td><td style="padding: 8px; font-weight: 600;">${metadata.assignedTo}</td></tr>`
  }

  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #C59C82; padding: 20px; border-radius: 8px 8px 0 0;">
      <h2 style="color: white; margin: 0;">${title}</h2>
    </div>
    <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
      <p style="color: #374151; font-size: 14px; line-height: 1.6;">${message}</p>
      ${detailRows ? `<table style="width: 100%; border-collapse: collapse; margin-top: 16px;">${detailRows}</table>` : ''}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">This is an automated notification from HOH108 CRM. Please do not reply to this email.</p>
    </div>
  </div>`
}

// ============================================
// UNIVERSAL ACTIVITY NOTIFICATION ENGINE
// Sends in-app + email to all relevant personas
// ============================================

/**
 * Activity event definitions - maps every ERP activity to notification config.
 * Each entry defines: who gets notified (by role/module), email subject template, message template.
 */
const ACTIVITY_EVENTS = {
  // ---- LEAD / PRE-SALES ----
  lead_created:            { departments: ['pre_sales', 'sales'], customer: false, vendor: false, subject: 'New Lead: {{ref}}', msg: 'A new lead {{ref}} has been created from {{source}}.', category: 'crm' },
  lead_assigned:           { departments: ['pre_sales'], customer: false, vendor: false, subject: 'Lead Assigned: {{ref}}', msg: 'Lead {{ref}} has been assigned to {{assignee}}.', category: 'crm' },
  lead_qualified:          { departments: ['pre_sales', 'sales'], customer: false, vendor: false, subject: 'Lead Qualified: {{ref}}', msg: 'Lead {{ref}} has been qualified. Ready for sales pipeline.', category: 'crm' },
  lead_transferred:        { departments: ['sales'], customer: false, vendor: false, subject: 'Lead Transferred to Sales: {{ref}}', msg: 'Lead {{ref}} has been transferred to sales team. Assigned to {{assignee}}.', category: 'crm' },
  lead_converted:          { departments: ['sales', 'design', 'operations', 'finance'], customer: true, vendor: false, subject: 'Lead Converted to Customer: {{ref}}', msg: 'Lead {{ref}} has been converted to customer. Project onboarding can begin.', category: 'crm' },
  meeting_scheduled:       { departments: ['sales', 'design'], customer: true, vendor: false, subject: 'Meeting Scheduled: {{ref}}', msg: 'A meeting has been scheduled for {{ref}} on {{date}}.', category: 'crm' },

  // ---- SALES ----
  quotation_created:       { departments: ['sales', 'finance'], customer: true, vendor: false, subject: 'Quotation Created: {{ref}}', msg: 'Quotation {{ref}} has been created for {{customer}}. Amount: {{amount}}.', category: 'sales' },
  quotation_sent:          { departments: ['sales'], customer: true, vendor: false, subject: 'Quotation Sent: {{ref}}', msg: 'Quotation {{ref}} has been sent to the customer for review.', category: 'sales' },
  quotation_accepted:      { departments: ['sales', 'design', 'operations', 'finance'], customer: true, vendor: false, subject: 'Quotation Accepted: {{ref}}', msg: 'Quotation {{ref}} has been accepted by the customer. Proceed with sales order.', category: 'sales' },
  sales_order_created:     { departments: ['sales', 'finance', 'design'], customer: true, vendor: false, subject: 'Sales Order: {{ref}}', msg: 'Sales Order {{ref}} created. Amount: {{amount}}.', category: 'sales' },
  sales_order_approved:    { departments: ['sales', 'finance', 'operations'], customer: true, vendor: false, subject: 'Sales Order Approved: {{ref}}', msg: 'Sales Order {{ref}} has been approved. Project initiation can begin.', category: 'sales' },

  // ---- DESIGN ----
  design_submitted:        { departments: ['design', 'sales'], customer: true, vendor: false, subject: 'Design Submitted: {{ref}}', msg: 'Design iteration v{{version}} for {{project}} has been submitted for review.', category: 'design' },
  design_approved:         { departments: ['design', 'sales', 'operations'], customer: true, vendor: false, subject: 'Design Approved: {{ref}}', msg: 'Design for {{project}} has been approved. Ready for execution.', category: 'design' },
  design_revision:         { departments: ['design'], customer: true, vendor: false, subject: 'Design Revision Requested: {{ref}}', msg: 'Client has requested changes to design v{{version}} for {{project}}.', category: 'design' },

  // ---- PROJECT MANAGEMENT ----
  project_created:         { departments: ['operations', 'design', 'finance'], customer: true, vendor: false, subject: 'Project Created: {{ref}}', msg: 'Project {{ref}} has been created. Team assignment in progress.', category: 'project' },
  project_stage_changed:   { departments: ['operations', 'sales', 'finance'], customer: true, vendor: false, subject: 'Project Stage Update: {{ref}}', msg: 'Project {{ref}} has moved to {{stage}} stage.', category: 'project' },
  project_completed:       { departments: ['operations', 'sales', 'finance', 'management'], customer: true, vendor: false, subject: 'Project Completed: {{ref}}', msg: 'Project {{ref}} has been completed. Handover process initiated.', category: 'project' },
  task_completed:          { departments: ['operations'], customer: false, vendor: false, subject: 'Task Completed: {{ref}}', msg: 'Task "{{taskName}}" for {{project}} has been completed.', category: 'project' },
  milestone_reached:       { departments: ['operations', 'finance'], customer: true, vendor: false, subject: 'Milestone Reached: {{ref}}', msg: 'Milestone "{{milestone}}" for {{project}} has been completed.', category: 'project' },
  progress_report:         { departments: ['operations', 'management'], customer: true, vendor: false, subject: 'Daily Progress: {{ref}}', msg: 'Daily progress report for {{project}}: {{progress}}% complete.', category: 'project' },
  site_photos_uploaded:    { departments: ['operations'], customer: true, vendor: false, subject: 'Site Photos Uploaded: {{ref}}', msg: '{{count}} new photos uploaded for project {{project}}.', category: 'project' },

  // ---- PROCUREMENT ----
  rfq_sent:                { departments: ['procurement'], customer: false, vendor: true, subject: 'RFQ Sent: {{ref}}', msg: 'Request for Quotation {{ref}} has been sent to vendors.', category: 'procurement' },
  quotation_received_vendor: { departments: ['procurement'], customer: false, vendor: false, subject: 'Vendor Quote Received: {{ref}}', msg: '{{vendor}} has submitted a quotation for RFQ {{ref}}.', category: 'procurement' },
  po_created:              { departments: ['procurement', 'finance'], customer: false, vendor: true, subject: 'Purchase Order: {{ref}}', msg: 'Purchase Order {{ref}} has been created for {{vendor}}. Amount: {{amount}}.', category: 'procurement' },
  po_approved:             { departments: ['procurement', 'finance'], customer: false, vendor: true, subject: 'PO Approved: {{ref}}', msg: 'Purchase Order {{ref}} has been approved. Vendor can proceed with delivery.', category: 'procurement' },
  po_acknowledged:         { departments: ['procurement'], customer: false, vendor: false, subject: 'PO Acknowledged: {{ref}}', msg: '{{vendor}} has acknowledged Purchase Order {{ref}}.', category: 'procurement' },
  grn_created:             { departments: ['procurement', 'operations'], customer: false, vendor: true, subject: 'GRN Created: {{ref}}', msg: 'Goods Receipt Note created for PO {{ref}}. Inspection pending.', category: 'procurement' },
  grn_accepted:            { departments: ['procurement', 'finance'], customer: false, vendor: true, subject: 'GRN Accepted: {{ref}}', msg: 'Goods for PO {{ref}} have been inspected and accepted.', category: 'procurement' },
  grn_rejected:            { departments: ['procurement'], customer: false, vendor: true, subject: 'GRN Rejected: {{ref}}', msg: 'Goods for PO {{ref}} have been rejected during inspection. Action required.', category: 'procurement' },
  vendor_invoice_submitted: { departments: ['procurement', 'finance'], customer: false, vendor: false, subject: 'Vendor Invoice: {{ref}}', msg: '{{vendor}} has submitted invoice {{ref}}. Review and approve for payment.', category: 'procurement' },
  vendor_invoice_approved: { departments: ['finance'], customer: false, vendor: true, subject: 'Invoice Approved: {{ref}}', msg: 'Invoice {{ref}} has been approved for payment processing.', category: 'procurement' },

  // ---- FINANCE ----
  customer_payment_received: { departments: ['finance', 'sales', 'operations'], customer: true, vendor: false, subject: 'Payment Received: {{ref}}', msg: 'Payment of {{amount}} received for {{project}}. Milestone: {{milestone}}.', category: 'finance' },
  vendor_payment_made:     { departments: ['finance', 'procurement'], customer: false, vendor: true, subject: 'Payment Processed: {{ref}}', msg: 'Payment of {{amount}} processed to {{vendor}} for PO {{ref}}.', category: 'finance' },
  invoice_generated:       { departments: ['finance'], customer: true, vendor: false, subject: 'Invoice Generated: {{ref}}', msg: 'Invoice {{ref}} generated for {{customer}}. Amount: {{amount}}. Due: {{dueDate}}.', category: 'finance' },
  invoice_overdue:         { departments: ['finance', 'sales'], customer: true, vendor: false, subject: 'Invoice Overdue: {{ref}}', msg: 'Invoice {{ref}} is overdue. Amount pending: {{amount}}. Please make payment at the earliest.', category: 'finance' },

  // ---- HR ----
  employee_onboarded:      { departments: ['hr', 'management'], customer: false, vendor: false, subject: 'New Employee Onboarded: {{ref}}', msg: '{{employee}} has joined as {{designation}} in {{department}} department.', category: 'hr' },
  leave_applied:           { departments: ['hr'], customer: false, vendor: false, subject: 'Leave Application: {{ref}}', msg: '{{employee}} has applied for {{leaveType}} from {{startDate}} to {{endDate}}.', category: 'hr' },
  leave_approved:          { departments: [], customer: false, vendor: false, subject: 'Leave Approved: {{ref}}', msg: 'Your {{leaveType}} from {{startDate}} to {{endDate}} has been approved.', category: 'hr', notifyEmployee: true },
  leave_rejected:          { departments: [], customer: false, vendor: false, subject: 'Leave Rejected: {{ref}}', msg: 'Your {{leaveType}} from {{startDate}} to {{endDate}} has been rejected. Reason: {{reason}}.', category: 'hr', notifyEmployee: true },
  reimbursement_submitted: { departments: ['hr', 'finance'], customer: false, vendor: false, subject: 'Reimbursement Claim: {{ref}}', msg: '{{employee}} has submitted a reimbursement claim of {{amount}}.', category: 'hr' },
  reimbursement_approved:  { departments: ['finance'], customer: false, vendor: false, subject: 'Reimbursement Approved: {{ref}}', msg: 'Reimbursement of {{amount}} has been approved for {{employee}}.', category: 'hr', notifyEmployee: true },
  performance_review:      { departments: ['hr', 'management'], customer: false, vendor: false, subject: 'Performance Review: {{ref}}', msg: 'Performance review for {{employee}} is {{status}}. Score: {{score}}.', category: 'hr', notifyEmployee: true },
  salary_revised:          { departments: ['hr', 'finance'], customer: false, vendor: false, subject: 'Salary Revision: {{ref}}', msg: 'Salary revised for {{employee}}. New CTC: {{amount}}.', category: 'hr', notifyEmployee: true },
  it_declaration_submitted: { departments: ['hr', 'finance'], customer: false, vendor: false, subject: 'IT Declaration: {{ref}}', msg: '{{employee}} has submitted IT declaration for FY {{financialYear}}.', category: 'hr' },

  // ---- APPROVALS ----
  approval_pending:        { departments: [], customer: false, vendor: false, subject: 'Approval Required: {{ref}}', msg: '{{entityType}} {{ref}} requires your approval. Submitted by {{submitter}}.', category: 'approval', notifyApprover: true },
  approval_granted:        { departments: [], customer: false, vendor: false, subject: 'Approved: {{ref}}', msg: '{{entityType}} {{ref}} has been approved by {{approver}}.', category: 'approval', notifySubmitter: true },
  approval_rejected:       { departments: [], customer: false, vendor: false, subject: 'Rejected: {{ref}}', msg: '{{entityType}} {{ref}} has been rejected by {{approver}}. Reason: {{reason}}.', category: 'approval', notifySubmitter: true },

  // ---- SUPPORT ----
  ticket_created:          { departments: ['operations'], customer: true, vendor: false, subject: 'Support Ticket: {{ref}}', msg: 'Support ticket {{ref}} has been created. Subject: {{ticketSubject}}.', category: 'support' },
  ticket_resolved:         { departments: [], customer: true, vendor: false, subject: 'Ticket Resolved: {{ref}}', msg: 'Support ticket {{ref}} has been resolved. Please verify.', category: 'support' },
}

// Department to module permission mapping
const DEPT_MODULE_MAP = {
  pre_sales: ['leads', 'call_activities'],
  sales: ['leads', 'customers', 'sales_orders', 'quotations'],
  design: ['design_iterations', 'all_projects'],
  operations: ['all_projects', 'work_orders', 'qc_master'],
  procurement: ['purchase_orders', 'rfq', 'vendors', 'goods_receipt_grn'],
  finance: ['customer_invoices', 'payments', 'salary_management', 'accounts_receivable'],
  hr: ['employees_module', 'leaves', 'salary_management', 'attendance'],
  management: [], // super_admin/company_admin roles
}

/**
 * Universal activity notification - sends in-app + email to all relevant personas.
 *
 * @param {string} event - Event key from ACTIVITY_EVENTS
 * @param {object} opts - Event-specific data
 * @param {string} opts.companyId - Company ID
 * @param {string} opts.performedBy - User ID who triggered the event
 * @param {string} opts.performedByName - Name of the performer
 * @param {object} opts.data - Template variables: { ref, customer, vendor, amount, project, etc. }
 * @param {string[]} [opts.employeeIds] - Specific employee user IDs to notify
 * @param {string} [opts.customerId] - Customer ID to notify (email only)
 * @param {string} [opts.vendorId] - Vendor ID to notify (email only)
 * @param {string} [opts.employeeId] - Single employee to notify (for leave/HR events)
 * @param {string} [opts.approverId] - Approver user ID
 * @param {string} [opts.submitterId] - Original submitter user ID
 */
export async function notifyActivity(event, opts = {}) {
  try {
    const eventConfig = ACTIVITY_EVENTS[event]
    if (!eventConfig) {
      console.warn(`notifyActivity: unknown event "${event}"`)
      return
    }

    const { companyId, performedBy, performedByName, data = {}, employeeIds, customerId, vendorId, employeeId, approverId, submitterId } = opts

    if (!companyId) {
      console.error('notifyActivity: missing companyId')
      return
    }

    // --- Build subject and message from templates ---
    let subject = eventConfig.subject || event
    let msg = eventConfig.msg || ''

    // Replace {{placeholders}} with actual data
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      subject = subject.replace(regex, value || '')
      msg = msg.replace(regex, value || '')
    })

    // --- COLLECT RECIPIENTS ---
    const recipientEmails = new Set()
    const recipientUserIds = new Set()

    // 1. Department-based recipients (employees with module access)
    if (eventConfig.departments?.length > 0) {
      const moduleQueries = eventConfig.departments.flatMap(dept => {
        if (dept === 'management') return [{ role: { $in: ['super_admin', 'company_admin'] } }]
        const modules = DEPT_MODULE_MAP[dept] || []
        return modules.map(mod => ({ [`modulePermissions.${mod}.view`]: true }))
      })

      if (moduleQueries.length > 0) {
        const deptUsers = await User.find({
          company: companyId,
          isActive: true,
          $or: moduleQueries
        }).select('_id email name').lean()

        deptUsers.forEach(u => {
          if (u._id.toString() !== performedBy?.toString()) {
            recipientUserIds.add(u._id.toString())
            if (u.email) recipientEmails.add(u.email)
          }
        })
      }
    }

    // 2. Explicit employee IDs
    if (employeeIds?.length > 0) {
      const users = await User.find({ _id: { $in: employeeIds }, isActive: true }).select('_id email').lean()
      users.forEach(u => {
        recipientUserIds.add(u._id.toString())
        if (u.email) recipientEmails.add(u.email)
      })
    }

    // 3. Single employee (HR events like leave approval)
    if (eventConfig.notifyEmployee && employeeId) {
      const emp = await User.findById(employeeId).select('_id email').lean()
      if (emp) {
        recipientUserIds.add(emp._id.toString())
        if (emp.email) recipientEmails.add(emp.email)
      }
    }

    // 4. Approver
    if (eventConfig.notifyApprover && approverId) {
      const approver = await User.findById(approverId).select('_id email').lean()
      if (approver) {
        recipientUserIds.add(approver._id.toString())
        if (approver.email) recipientEmails.add(approver.email)
      }
    }

    // 5. Submitter (for approval results)
    if (eventConfig.notifySubmitter && submitterId) {
      const sub = await User.findById(submitterId).select('_id email').lean()
      if (sub) {
        recipientUserIds.add(sub._id.toString())
        if (sub.email) recipientEmails.add(sub.email)
      }
    }

    // 6. Customer (email only)
    if (eventConfig.customer && customerId) {
      try {
        const customer = await Customer.findById(customerId).select('email name').lean()
        if (customer?.email) recipientEmails.add(customer.email)
      } catch (e) {}
    }

    // 7. Vendor (email only)
    if (eventConfig.vendor && vendorId) {
      try {
        const vendor = await Vendor.findById(vendorId).select('email name contactPerson').lean()
        if (vendor?.email) recipientEmails.add(vendor.email)
      } catch (e) {}
    }

    // Remove performer from recipients
    if (performedBy) {
      recipientUserIds.delete(performedBy.toString())
    }

    // --- CREATE IN-APP NOTIFICATIONS ---
    const userIdArray = [...recipientUserIds]
    if (userIdArray.length > 0) {
      try {
        await Notification.notifyUsers(userIdArray, {
          company: companyId,
          type: event.includes('rejected') || event.includes('overdue') ? 'warning' : event.includes('approved') || event.includes('completed') ? 'success' : 'info',
          category: eventConfig.category,
          title: subject,
          message: msg,
          entityType: eventConfig.category,
          metadata: { event, performedBy: performedByName, ...data }
        })
      } catch (e) {
        console.error('In-app notification error:', e.message)
      }
    }

    // --- SEND EMAILS ---
    const emailArray = [...recipientEmails]
    if (emailArray.length > 0) {
      const html = buildEmailHtml(subject, msg, {
        entityLabel: data.ref || '',
        status: data.status || event.replace(/_/g, ' '),
        assignedTo: data.assignee || data.assignedTo || ''
      })

      // Send to all recipients (fire-and-forget, parallel)
      await Promise.allSettled(
        emailArray.map(email => sendEmail(email, `[HOH108] ${subject}`, html))
      )
    }

    console.log(`notifyActivity(${event}): ${userIdArray.length} in-app, ${emailArray.length} emails`)
  } catch (err) {
    console.error(`notifyActivity(${event}) error:`, err.message)
    // Never throw
  }
}
