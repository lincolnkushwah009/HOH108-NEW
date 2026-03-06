import cron from 'node-cron'
import logger from './logger.js'

const jobs = []

async function escalateOverdueApprovals() {
  try {
    const ApprovalWorkflow = (await import('../models/ApprovalWorkflow.js')).default
    const Notification = (await import('../models/Notification.js')).default
    const { emitToUser } = await import('./socketService.js')

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const overdue = await ApprovalWorkflow.find({
      status: 'pending',
      createdAt: { $lt: threeDaysAgo }
    }).populate('currentApprover', 'name reportsTo')

    for (const workflow of overdue) {
      if (workflow.currentApprover?.reportsTo) {
        const notification = await Notification.create({
          company: workflow.company,
          recipient: workflow.currentApprover.reportsTo,
          type: 'warning',
          category: 'escalation',
          title: 'Overdue Approval Escalation',
          message: `Approval for ${workflow.module} has been pending for 3+ days`,
          actionUrl: `/admin/approvals`,
          metadata: { workflowId: workflow._id }
        })
        emitToUser(workflow.currentApprover.reportsTo.toString(), 'notification', notification)
      }
    }
    if (overdue.length > 0) logger.info(`Escalated ${overdue.length} overdue approvals`)
  } catch (err) {
    logger.error('Escalation job failed', { error: err.message })
  }
}

/**
 * Automated Dunning/Collections - Staged reminders at 7/15/30/45/60 days
 * Level 1: 7 days overdue - Gentle reminder
 * Level 2: 15 days overdue - Second reminder
 * Level 3: 30 days overdue - Escalation notice
 * Level 4: 45 days overdue - Final notice
 * Level 5: 60 days overdue - Collections warning
 */
const DUNNING_LEVELS = [
  { level: 1, days: 7, title: 'Payment Reminder', severity: 'info', message: 'Gentle reminder: your payment is overdue' },
  { level: 2, days: 15, title: 'Second Payment Reminder', severity: 'warning', message: 'Your payment is now 15 days overdue' },
  { level: 3, days: 30, title: 'Payment Escalation', severity: 'warning', message: 'Urgent: your payment is 30 days overdue' },
  { level: 4, days: 45, title: 'Final Payment Notice', severity: 'error', message: 'Final notice: payment is 45 days overdue' },
  { level: 5, days: 60, title: 'Collections Warning', severity: 'error', message: 'Account may be sent to collections - 60 days overdue' }
]

async function sendOverdueInvoiceReminders() {
  try {
    const CustomerInvoice = (await import('../models/CustomerInvoice.js')).default
    const Notification = (await import('../models/Notification.js')).default
    const { emitToUser } = await import('./socketService.js')

    const overdue = await CustomerInvoice.find({
      status: { $in: ['sent', 'viewed', 'overdue', 'partially_paid'] },
      dueDate: { $lt: new Date() },
      balanceAmount: { $gt: 0 }
    }).populate('createdBy')

    let dunned = 0
    for (const invoice of overdue) {
      if (!invoice.createdBy) continue

      const daysOverdue = Math.floor((Date.now() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
      const currentLevel = invoice.dunningLevel || 0

      // Find the next dunning level this invoice qualifies for
      const nextLevel = DUNNING_LEVELS.find(d => d.days <= daysOverdue && d.level > currentLevel)
      if (!nextLevel) continue

      // Update invoice dunning tracking
      invoice.dunningLevel = nextLevel.level
      invoice.lastDunningAt = new Date()
      if (!invoice.dunningHistory) invoice.dunningHistory = []
      invoice.dunningHistory.push({ level: nextLevel.level, sentAt: new Date(), method: 'notification' })
      if (invoice.status === 'sent' || invoice.status === 'viewed') invoice.status = 'overdue'

      invoice.activities.push({
        action: 'dunning_sent',
        description: `Dunning Level ${nextLevel.level}: ${nextLevel.title} (${daysOverdue} days overdue)`,
        performedByName: 'System (Auto Dunning)'
      })
      await invoice.save()

      // Create notification for the invoice owner
      const notification = await Notification.create({
        company: invoice.company,
        recipient: invoice.createdBy._id,
        type: nextLevel.severity === 'error' ? 'error' : 'warning',
        category: 'finance',
        title: `${nextLevel.title} - ${invoice.invoiceNumber}`,
        message: `${nextLevel.message}. Invoice ${invoice.invoiceNumber}, Balance: ₹${invoice.balanceAmount?.toLocaleString()}`,
        actionUrl: `/admin/customer-invoices/${invoice._id}`,
        metadata: { dunningLevel: nextLevel.level, daysOverdue, invoiceId: invoice._id }
      })

      emitToUser(invoice.createdBy._id.toString(), 'notification', notification)
      dunned++
    }
    if (dunned > 0) logger.info(`Dunning: sent ${dunned} staged reminders`)
  } catch (err) {
    logger.error('Dunning job failed', { error: err.message })
  }
}

async function detectStaleLeads() {
  try {
    const Lead = (await import('../models/Lead.js')).default
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const stale = await Lead.updateMany(
      { status: { $in: ['new', 'contacted'] }, lastActivityAt: { $lt: sevenDaysAgo }, isConverted: false, tags: { $ne: 'stale' } },
      { $addToSet: { tags: 'stale' } }
    )
    if (stale.modifiedCount > 0) logger.info(`Marked ${stale.modifiedCount} stale leads`)
  } catch (err) {
    logger.error('Stale lead detection failed', { error: err.message })
  }
}

async function cleanupExpiredTokens() {
  try {
    const TokenBlacklist = (await import('../models/TokenBlacklist.js')).default
    const result = await TokenBlacklist.deleteMany({ expiresAt: { $lt: new Date() } })
    if (result.deletedCount > 0) logger.info(`Cleaned ${result.deletedCount} expired tokens`)
  } catch (err) {
    logger.error('Token cleanup failed', { error: err.message })
  }
}

async function syncCallyzerCalls() {
  try {
    const Company = (await import('../models/Company.js')).default
    const CallyzerService = (await import('./callyzer.js')).default
    const CallActivity = (await import('../models/CallActivity.js')).default
    const Lead = (await import('../models/Lead.js')).default
    const User = (await import('../models/User.js')).default

    // Find all companies with Callyzer enabled + autoSync
    const companies = await Company.find({
      'integrations.callyzer.isEnabled': true,
      'integrations.callyzer.autoSyncCalls': true,
      'integrations.callyzer.apiToken': { $exists: true, $ne: '' }
    })

    for (const company of companies) {
      try {
        const config = company.integrations.callyzer
        const token = config.apiToken || process.env.CALLYZER_API_TOKEN
        const callyzer = new CallyzerService(token)

        // Sync last 24 hours
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const result = await callyzer.getCallHistory({ startDate, endDate, pageSize: 100 })
        if (!result.success) {
          logger.warn(`Callyzer sync failed for company ${company._id}: ${result.error}`)
          await Company.findByIdAndUpdate(company._id, {
            $set: { 'integrations.callyzer.syncStatus': 'failed' }
          })
          continue
        }

        const calls = result.data?.result || []
        // Build employee map
        const users = await User.find({
          company: company._id,
          callyzerEmployeeNumber: { $exists: true, $ne: null }
        }).select('name callyzerEmployeeNumber subDepartment')
        const employeeMap = new Map()
        users.forEach(u => employeeMap.set(u.callyzerEmployeeNumber, u))

        let synced = 0
        for (const call of calls) {
          const phoneNumber = CallyzerService.formatPhoneNumber(call.client_number)
          if (!phoneNumber) continue

          // Skip if already synced
          const existing = await CallActivity.findOne({
            company: company._id,
            'callyzerData.callId': call.id
          })
          if (existing) continue

          // Find lead
          const lead = await Lead.findOne({
            company: company._id,
            $or: [
              { phone: { $regex: phoneNumber } },
              { 'location.phone': { $regex: phoneNumber } }
            ]
          })
          if (!lead) continue

          const empNumber = call.emp_number || call.employee_number
          const empName = call.emp_name || call.employee_name || 'Unknown'
          const crmUser = employeeMap.get(empNumber) || null

          let startedAt = null
          if (call.call_date && call.call_time) {
            startedAt = new Date(`${call.call_date}T${call.call_time}`)
          }
          let endedAt = null
          if (startedAt && call.duration > 0) {
            endedAt = new Date(startedAt.getTime() + call.duration * 1000)
          }

          await CallActivity.create({
            company: company._id,
            lead: lead._id,
            callType: CallyzerService.mapCallType(call.call_type),
            calledBy: crmUser?._id,
            calledByName: crmUser?.name || empName,
            calledByDepartment: crmUser?.subDepartment || 'sales',
            contactPhone: call.client_number,
            contactName: call.client_name === 'Unknown' ? lead.name : (call.client_name || lead.name),
            startedAt,
            endedAt,
            duration: call.duration || 0,
            status: CallyzerService.mapCallStatus(call.call_type, call.duration),
            outcome: call.duration > 0 ? 'information_shared' : 'rnr',
            recording: call.call_recording_url ? { url: call.call_recording_url, duration: call.duration } : undefined,
            callyzerData: {
              callId: call.id,
              employeeNumber: empNumber,
              callType: call.call_type,
              syncedAt: new Date()
            },
            activities: [{
              action: 'call_synced',
              description: 'Auto-synced from Callyzer',
              performedByName: 'System (Auto Sync)'
            }]
          })

          // Update lead contact timestamp
          if (startedAt) lead.lastContactedAt = startedAt
          lead.lastActivityAt = new Date()
          await lead.save()
          synced++
        }

        await Company.findByIdAndUpdate(company._id, {
          $set: {
            'integrations.callyzer.lastSyncAt': new Date(),
            'integrations.callyzer.syncStatus': 'success'
          }
        })

        if (synced > 0) logger.info(`Callyzer auto-sync: ${synced} calls synced for company ${company._id}`)
      } catch (companyErr) {
        logger.error(`Callyzer sync error for company ${company._id}`, { error: companyErr.message })
      }
    }
  } catch (err) {
    logger.error('Callyzer auto-sync job failed', { error: err.message })
  }
}

async function checkDelegationExpiry() {
  try {
    const ApprovalDelegation = (await import('../models/ApprovalDelegation.js')).default
    await ApprovalDelegation.updateMany(
      { status: 'active', endDate: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    )
  } catch {
    // Model may not exist yet
  }
}

export function startScheduler() {
  // Every day at 9 AM — escalate overdue approvals
  jobs.push(cron.schedule('0 9 * * *', escalateOverdueApprovals))

  // Every day at 10 AM — overdue invoice reminders
  jobs.push(cron.schedule('0 10 * * *', sendOverdueInvoiceReminders))

  // Every day at 6 AM — detect stale leads
  jobs.push(cron.schedule('0 6 * * *', detectStaleLeads))

  // Every hour — cleanup expired tokens
  jobs.push(cron.schedule('0 * * * *', cleanupExpiredTokens))

  // Every hour — check delegation expiry
  jobs.push(cron.schedule('30 * * * *', checkDelegationExpiry))

  // Every 30 minutes — auto-sync Callyzer calls
  jobs.push(cron.schedule('*/30 * * * *', syncCallyzerCalls))

  logger.info('Scheduler started with 6 cron jobs')
}

export function stopScheduler() {
  jobs.forEach(job => job.stop())
  logger.info('Scheduler stopped')
}
