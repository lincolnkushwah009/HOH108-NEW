import nodemailer from 'nodemailer'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import Customer from '../models/Customer.js'

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
    for (const dept of ['preSales', 'crm', 'sales', 'acm']) {
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
