/**
 * Callyzer Integration Routes
 *
 * Endpoints for:
 * - Configuration (API token storage)
 * - Sync call logs from Callyzer to CRM
 * - Webhook for real-time call updates
 * - Call statistics and analytics
 */

import express from 'express'
import CallyzerService from '../utils/callyzer.js'
import CallActivity from '../models/CallActivity.js'
import Lead from '../models/Lead.js'
import User from '../models/User.js'
import Company from '../models/Company.js'
import {
  protect,
  setCompanyContext,
  authorize,
  PERMISSIONS
} from '../middleware/rbac.js'
import { emitToUser } from '../utils/socketService.js'

const router = express.Router()

// Helper: get Callyzer API token from DB config or fall back to env var
function getCallyzerToken(callyzerConfig) {
  return callyzerConfig?.apiToken || process.env.CALLYZER_API_TOKEN || null
}

// ==================== HELPER: Compute stats from raw Callyzer calls ====================
function computeFromCallHistory(rawCalls) {
  const total = rawCalls.length
  const connected = rawCalls.filter(c => (c.duration || 0) > 0).length
  const missed = rawCalls.filter(c => (c.call_type || '').toLowerCase() === 'missed').length
  const incoming = rawCalls.filter(c => (c.call_type || '').toLowerCase() === 'incoming').length
  const outgoing = rawCalls.filter(c => (c.call_type || '').toLowerCase() === 'outgoing').length
  const rejected = rawCalls.filter(c => (c.call_type || '').toLowerCase() === 'rejected').length
  const totalDuration = rawCalls.reduce((sum, c) => sum + (c.duration || 0), 0)

  // Employee breakdown
  const empMap = {}
  rawCalls.forEach(c => {
    const name = c.emp_name || c.employee_name || 'Unknown'
    const num = c.emp_number || c.employee_number || ''
    if (!empMap[name]) empMap[name] = { emp_name: name, emp_number: num, total_calls: 0, connected_calls: 0, missed_calls: 0, total_duration: 0, incoming_calls: 0, outgoing_calls: 0 }
    empMap[name].total_calls++
    if ((c.duration || 0) > 0) empMap[name].connected_calls++
    if ((c.call_type || '').toLowerCase() === 'missed') empMap[name].missed_calls++
    empMap[name].total_duration += (c.duration || 0)
    if ((c.call_type || '').toLowerCase() === 'incoming') empMap[name].incoming_calls++
    if ((c.call_type || '').toLowerCase() === 'outgoing') empMap[name].outgoing_calls++
  })
  const employees = Object.values(empMap).map(e => ({
    ...e,
    avg_duration: e.total_calls > 0 ? Math.round(e.total_duration / e.total_calls) : 0
  }))

  // Daily trend
  const dailyMap = {}
  rawCalls.forEach(c => {
    const d = c.call_date
    if (!d) return
    if (!dailyMap[d]) dailyMap[d] = { date: d, total_calls: 0, connected_calls: 0, missed_calls: 0, total_duration: 0, incoming: 0, outgoing: 0 }
    dailyMap[d].total_calls++
    if ((c.duration || 0) > 0) dailyMap[d].connected_calls++
    if ((c.call_type || '').toLowerCase() === 'missed') dailyMap[d].missed_calls++
    dailyMap[d].total_duration += (c.duration || 0)
    if ((c.call_type || '').toLowerCase() === 'incoming') dailyMap[d].incoming++
    if ((c.call_type || '').toLowerCase() === 'outgoing') dailyMap[d].outgoing++
  })

  // Hourly distribution
  const hourlyBuckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, total_calls: 0 }))
  rawCalls.forEach(c => {
    if (!c.call_time) return
    const hour = parseInt(c.call_time.split(':')[0])
    if (hour >= 0 && hour < 24) hourlyBuckets[hour].total_calls++
  })

  return {
    summary: {
      total_calls: total,
      total_connected_calls: connected,
      connected_calls: connected,
      total_missed_calls: missed,
      missed_calls: missed,
      total_outgoing_calls: outgoing,
      outgoing_calls: outgoing,
      total_incoming_calls: incoming,
      incoming_calls: incoming,
      total_duration: totalDuration,
      total_call_duration: totalDuration,
      avg_duration: total > 0 ? Math.round(totalDuration / total) : 0
    },
    employees,
    dailyTrend: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
    hourlyDistribution: hourlyBuckets,
    callTypeBreakdown: { incoming, outgoing, missed, rejected }
  }
}

// Fetch ALL pages from Callyzer call history
async function fetchAllCallyzerCalls(callyzer, opts) {
  const allCalls = []
  let page = 1
  const pageSize = 100
  while (true) {
    const res = await callyzer.getCallHistory({ ...opts, page, pageSize })
    if (!res.success) break
    const calls = res.data?.result || []
    allCalls.push(...calls)
    const totalRecords = res.data?.total_records || calls.length
    if (allCalls.length >= totalRecords || calls.length === 0) break
    page++
    if (page > 20) break // safety limit
  }
  return allCalls
}

// ==================== CONFIGURATION ====================

/**
 * @desc    Get Callyzer configuration status
 * @route   GET /api/callyzer/config
 * @access  Private (Admin)
 */
router.get('/config',
  protect,
  setCompanyContext,
  async (req, res) => {
    try {
      const company = await Company.findById(req.activeCompany._id)
        .select('integrations.callyzer')

      const config = company?.integrations?.callyzer || {}
      const hasToken = !!getCallyzerToken(config)
      console.log('[Callyzer Config] Company:', req.activeCompany._id, 'hasToken:', hasToken, 'isEnabled:', config.isEnabled)

      res.json({
        success: true,
        data: {
          isConfigured: hasToken,
          isEnabled: config.isEnabled || false,
          lastSyncAt: config.lastSyncAt,
          syncStatus: config.syncStatus || 'never',
          webhookUrl: `${process.env.API_URL || 'https://your-api.com'}/api/callyzer/webhook/${req.activeCompany._id}`,
          settings: {
            autoSyncCalls: config.autoSyncCalls || false,
            syncIntervalMinutes: config.syncIntervalMinutes || 30
          }
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Save Callyzer configuration
 * @route   POST /api/callyzer/config
 * @access  Private (Admin)
 */
router.post('/config',
  protect,
  setCompanyContext,
  authorize('super_admin', 'company_admin'),
  async (req, res) => {
    try {
      const {
        apiToken,
        isEnabled,
        autoSyncCalls,
        syncIntervalMinutes
      } = req.body

      // Validate API token by making a test request
      if (apiToken) {
        const callyzer = new CallyzerService(apiToken)
        const testResult = await callyzer.getCallLogSummary({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        })

        if (!testResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Invalid API token. Please check your Callyzer API token.'
          })
        }
      }

      const updateData = {
        'integrations.callyzer.apiToken': apiToken,
        'integrations.callyzer.isEnabled': isEnabled !== undefined ? isEnabled : true,
        'integrations.callyzer.autoSyncCalls': autoSyncCalls || false,
        'integrations.callyzer.syncIntervalMinutes': syncIntervalMinutes || 30,
        'integrations.callyzer.configuredAt': new Date(),
        'integrations.callyzer.configuredBy': req.user._id
      }

      await Company.findByIdAndUpdate(req.activeCompany._id, { $set: updateData })

      res.json({
        success: true,
        message: 'Callyzer configuration saved successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Test Callyzer connection
 * @route   POST /api/callyzer/test
 * @access  Private (Admin)
 */
router.post('/test',
  protect,
  setCompanyContext,
  authorize('super_admin', 'company_admin'),
  async (req, res) => {
    try {
      const { apiToken } = req.body
      console.log('[Callyzer Test] Request received, token length:', apiToken?.length || 0)

      if (!apiToken) {
        return res.status(400).json({
          success: false,
          message: 'API token is required'
        })
      }

      const callyzer = new CallyzerService(apiToken)
      const today = new Date().toISOString().split('T')[0]
      const result = await callyzer.getCallLogSummary({ startDate: today, endDate: today })
      console.log('[Callyzer Test] API result:', JSON.stringify(result).substring(0, 500))

      if (result.success) {
        const summary = result.data?.result || {}
        res.json({
          success: true,
          message: 'Connection successful',
          data: {
            totalCalls: summary.total_calls || 0
          }
        })
      } else {
        res.status(400).json({
          success: false,
          message: result.error || 'Connection failed. Check your API token.'
        })
      }
    } catch (error) {
      console.error('[Callyzer Test] Error:', error)
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ==================== SYNC CALL LOGS ====================

/**
 * @desc    Sync call logs from Callyzer
 * @route   POST /api/callyzer/sync/calls
 * @access  Private (Admin)
 */
router.post('/sync/calls',
  protect,
  setCompanyContext,
  authorize('super_admin', 'company_admin', 'sales_manager'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.body

      const company = await Company.findById(req.activeCompany._id)
      const callyzerConfig = company?.integrations?.callyzer

      const token = getCallyzerToken(callyzerConfig)
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Callyzer is not configured. Please add your API token first.'
        })
      }

      const callyzer = new CallyzerService(token)

      // Fetch call history from Callyzer API v2.1
      const callsResult = await callyzer.getCallHistory({
        startDate,
        endDate,
        pageSize: 100
      })

      if (!callsResult.success) {
        return res.status(400).json({
          success: false,
          message: callsResult.error || 'Failed to fetch calls from Callyzer'
        })
      }

      // v2.1 response: { result: [...calls], message, total_records, page_no, page_size }
      const calls = callsResult.data?.result || []
      console.log(`[Callyzer Sync] Fetched ${calls.length} calls from Callyzer`)
      let synced = 0
      let skipped = 0
      let errors = 0

      // Map Callyzer employees to CRM users
      const employeeMap = await buildEmployeeMap(req.activeCompany._id)

      for (const call of calls) {
        try {
          // Find lead by phone number
          const phoneNumber = CallyzerService.formatPhoneNumber(call.client_number)
          if (!phoneNumber) {
            skipped++
            continue
          }

          const lead = await Lead.findOne({
            company: req.activeCompany._id,
            $or: [
              { phone: { $regex: phoneNumber } },
              { 'location.phone': { $regex: phoneNumber } }
            ]
          })

          if (!lead) {
            skipped++
            continue
          }

          // Check if call already synced (by unique Callyzer call ID)
          const existingCall = await CallActivity.findOne({
            company: req.activeCompany._id,
            'callyzerData.callId': call.id
          })

          if (existingCall) {
            skipped++
            continue
          }

          // v2.1 field mappings
          const empNumber = call.emp_number || call.employee_number
          const empName = call.emp_name || call.employee_name || 'Unknown'
          const recordingUrl = call.call_recording_url || call.recording_url

          // Build start time from call_date + call_time (v2.1 format)
          let startedAt = null
          if (call.call_date && call.call_time) {
            startedAt = new Date(`${call.call_date}T${call.call_time}`)
          } else if (call.start_time) {
            startedAt = new Date(call.start_time)
          }

          // Calculate end time from start + duration
          let endedAt = null
          if (startedAt && call.duration > 0) {
            endedAt = new Date(startedAt.getTime() + call.duration * 1000)
          }

          // Find CRM user by employee number
          const crmUser = employeeMap.get(empNumber) || null

          // Create call activity
          await CallActivity.create({
            company: req.activeCompany._id,
            lead: lead._id,
            callType: CallyzerService.mapCallType(call.call_type),
            calledBy: crmUser?._id || req.user._id,
            calledByName: crmUser?.name || empName,
            calledByDepartment: crmUser?.subDepartment || 'sales',
            contactPhone: call.client_number,
            contactName: call.client_name === 'Unknown' ? lead.name : (call.client_name || lead.name),
            startedAt,
            endedAt,
            duration: call.duration || 0,
            status: CallyzerService.mapCallStatus(call.call_type, call.duration),
            outcome: call.duration > 0 ? 'information_shared' : 'rnr',
            recording: recordingUrl ? {
              url: recordingUrl,
              duration: call.duration
            } : undefined,
            callyzerData: {
              callId: call.id,
              employeeNumber: empNumber,
              callType: call.call_type,
              syncedAt: new Date()
            },
            activities: [{
              action: 'call_synced',
              description: `Call synced from Callyzer`,
              performedBy: req.user._id,
              performedByName: 'System (Callyzer Sync)'
            }]
          })

          // Update lead's last contact
          if (startedAt) {
            lead.lastContactedAt = startedAt
          }
          lead.lastActivityAt = new Date()
          await lead.updateCallSummary()
          await lead.save()

          synced++
        } catch (err) {
          console.error('Error syncing call:', err.message)
          errors++
        }
      }

      // Update sync status
      await Company.findByIdAndUpdate(req.activeCompany._id, {
        $set: {
          'integrations.callyzer.lastSyncAt': new Date(),
          'integrations.callyzer.syncStatus': 'success'
        }
      })

      res.json({
        success: true,
        message: `Sync completed: ${synced} calls synced, ${skipped} skipped, ${errors} errors`,
        data: {
          total: calls.length,
          synced,
          skipped,
          errors
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Get Callyzer call statistics
 * @route   GET /api/callyzer/stats
 * @access  Private
 */
router.get('/stats',
  protect,
  setCompanyContext,
  async (req, res) => {
    try {
      const { startDate, endDate, employeeNumber, callType } = req.query

      // Pre-sales users can only see their own stats
      let effectiveEmpNumber = employeeNumber
      if (req.user.subDepartment === 'pre_sales' || req.user.role === 'pre_sales') {
        if (!req.user.callyzerEmployeeNumber) {
          return res.json({ success: true, data: { summary: { total_calls: 0, connected_calls: 0, missed_calls: 0, total_duration: 0 }, analysis: null } })
        }
        effectiveEmpNumber = req.user.callyzerEmployeeNumber
      }

      const company = await Company.findById(req.activeCompany._id)
      const callyzerConfig = company?.integrations?.callyzer

      // Try Callyzer API first
      const token = getCallyzerToken(callyzerConfig)
      if (token) {
        try {
          const callyzer = new CallyzerService(token)
          console.log('[Callyzer Stats] Fetching for company:', req.activeCompany._id)

          // Use call history to compute stats (avoids rate limit issues with multiple API calls)
          const histOpts = { startDate, endDate }
          if (effectiveEmpNumber) histOpts.empNumbers = [effectiveEmpNumber]
          if (callType) histOpts.callTypes = [callType]
          const allCalls = await fetchAllCallyzerCalls(callyzer, histOpts)
          if (allCalls.length > 0) {
            console.log('[Callyzer Stats] Computed from call history:', allCalls.length, 'calls')
            const computed = computeFromCallHistory(allCalls)
            return res.json({ success: true, data: { summary: computed.summary, analysis: null } })
          }
        } catch (apiErr) {
          console.log('[Callyzer Stats] API failed, falling back to local DB:', apiErr.message)
        }
      }

      // Fallback: compute stats from local call activities
      const dateQuery = { company: req.activeCompany._id }
      if (startDate || endDate) {
        const dateFilter = {}
        if (startDate) dateFilter.$gte = new Date(startDate)
        if (endDate) dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999))
        dateQuery.$or = [
          { startedAt: dateFilter },
          { startedAt: { $exists: false }, createdAt: dateFilter },
          { startedAt: null, createdAt: dateFilter }
        ]
      }

      const localCalls = await CallActivity.find(dateQuery).lean()
      const totalCalls = localCalls.length
      const connected = localCalls.filter(c => c.status === 'completed' || c.duration > 0).length
      const missed = localCalls.filter(c => c.status === 'missed' || c.status === 'no_answer' || c.callType === 'missed').length
      const outgoing = localCalls.filter(c => c.callType === 'outbound' || c.callType === 'Outgoing').length
      const incoming = localCalls.filter(c => c.callType === 'inbound' || c.callType === 'Incoming').length
      const totalDuration = localCalls.reduce((sum, c) => sum + (c.duration || 0), 0)

      console.log('[Callyzer Stats] Using local DB, total:', totalCalls, 'connected:', connected, 'missed:', missed)

      res.json({
        success: true,
        data: {
          summary: {
            total_calls: totalCalls,
            total_connected_calls: connected,
            connected_calls: connected,
            total_missed_calls: missed,
            missed_calls: missed,
            total_outgoing_calls: outgoing,
            outgoing_calls: outgoing,
            total_incoming_calls: incoming,
            incoming_calls: incoming,
            total_duration: totalDuration,
            total_call_duration: totalDuration
          },
          analysis: null
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ==================== CALL HISTORY (Live from Callyzer) ====================

/**
 * @desc    Get call history directly from Callyzer API
 * @route   GET /api/callyzer/calls
 * @access  Private
 */
router.get('/calls',
  protect,
  setCompanyContext,
  async (req, res) => {
    try {
      const { startDate, endDate, page, callType, empNumber, minDuration, maxDuration } = req.query

      // Pre-sales users can only see their own calls
      let effectiveEmpNumber = empNumber
      if (req.user.subDepartment === 'pre_sales' || req.user.role === 'pre_sales') {
        if (!req.user.callyzerEmployeeNumber) {
          return res.json({ success: true, data: [], pagination: { total: 0, page: 1, pageSize: 50 } })
        }
        effectiveEmpNumber = req.user.callyzerEmployeeNumber
      }

      const company = await Company.findById(req.activeCompany._id)
      const callyzerConfig = company?.integrations?.callyzer

      // Try Callyzer API first, fall back to local DB if not configured or token invalid
      const token = getCallyzerToken(callyzerConfig)
      if (token) {
        try {
          const callyzer = new CallyzerService(token)

          const options = {
            startDate,
            endDate,
            page: parseInt(page) || 1,
            pageSize: 50
          }
          if (callType) options.callTypes = [callType]
          if (effectiveEmpNumber) options.empNumbers = [effectiveEmpNumber]
          if (minDuration) options.minDuration = parseInt(minDuration)
          if (maxDuration) options.maxDuration = parseInt(maxDuration)

          const result = await callyzer.getCallHistory(options)

          if (result.success) {
            const rawCalls = result.data?.result || []
            const totalRecords = result.data?.total_records || rawCalls.length
            console.log('[Callyzer Calls] Fetched', rawCalls.length, 'calls, total:', totalRecords)

            const calls = rawCalls.map(call => ({
              id: call.id,
              empNumber: call.emp_number || call.employee_number,
              empName: call.emp_name || call.employee_name || 'Unknown',
              clientNumber: call.client_number,
              clientName: call.client_name || 'Unknown',
              callType: call.call_type,
              duration: call.duration || 0,
              callDate: call.call_date,
              callTime: call.call_time,
              startedAt: call.call_date && call.call_time ? `${call.call_date}T${call.call_time}` : null,
              recordingUrl: call.call_recording_url || call.recording_url || null,
              status: CallyzerService.mapCallStatus(call.call_type, call.duration),
              crmCallType: CallyzerService.mapCallType(call.call_type),
              source: 'callyzer'
            }))

            return res.json({
              success: true,
              data: calls,
              pagination: {
                total: totalRecords,
                page: parseInt(page) || 1,
                pageSize: 50
              }
            })
          }
        } catch (apiErr) {
          console.log('[Callyzer Calls] API failed, falling back to local DB:', apiErr.message)
        }
      }

      // Fallback: serve call activities from local database
      console.log('[Callyzer Calls] Falling back to local DB, startDate:', startDate, 'endDate:', endDate)
      const query = { company: req.activeCompany._id }
      // Use $or to match either startedAt or createdAt (startedAt may be null for manually logged calls)
      if (startDate || endDate) {
        const dateFilter = {}
        if (startDate) dateFilter.$gte = new Date(startDate)
        if (endDate) dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999))
        query.$or = [
          { startedAt: dateFilter },
          { startedAt: { $exists: false }, createdAt: dateFilter },
          { startedAt: null, createdAt: dateFilter }
        ]
      }
      if (effectiveEmpNumber) query['callyzerData.employeeNumber'] = effectiveEmpNumber
      if (callType) query.callType = callType
      if (minDuration) query.duration = { ...query.duration, $gte: parseInt(minDuration) }
      if (maxDuration) query.duration = { ...query.duration, $lte: parseInt(maxDuration) }

      const pageNum = parseInt(page) || 1
      const pageSize = 50
      const total = await CallActivity.countDocuments(query)
      const localCalls = await CallActivity.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .populate('lead', 'name phone')
        .lean()

      const calls = localCalls.map(call => ({
        id: call._id,
        empNumber: call.callyzerData?.employeeNumber || '',
        empName: call.calledByName || 'Unknown',
        clientNumber: call.contactPhone || call.lead?.phone || '',
        clientName: call.contactName || call.lead?.name || 'Unknown',
        callType: call.callyzerData?.callType || call.callType || '',
        duration: call.duration || 0,
        callDate: call.startedAt ? new Date(call.startedAt).toISOString().split('T')[0] : '',
        callTime: call.startedAt ? new Date(call.startedAt).toISOString().split('T')[1]?.split('.')[0] : '',
        startedAt: call.startedAt || call.createdAt,
        recordingUrl: call.recording?.url || null,
        status: call.status || 'unknown',
        crmCallType: call.callType || '',
        source: 'local'
      }))

      res.json({
        success: true,
        data: calls,
        pagination: {
          total,
          page: pageNum,
          pageSize
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ==================== WEBHOOK ====================

/**
 * @desc    Webhook endpoint for Callyzer real-time updates
 * @route   POST /api/callyzer/webhook/:companyId
 * @access  Public (with signature verification)
 */
router.post('/webhook/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params
    const payload = req.body

    // Find company
    const company = await Company.findById(companyId)
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' })
    }

    const callyzerConfig = company.integrations?.callyzer
    if (!callyzerConfig?.isEnabled) {
      return res.status(400).json({ success: false, message: 'Callyzer not enabled' })
    }

    // Callyzer v2.1 webhook format: array of employee objects with nested call_logs
    const employees = Array.isArray(payload) ? payload : [payload]
    let processed = 0

    for (const emp of employees) {
      const callLogs = emp.call_logs || []
      for (const call of callLogs) {
        await handleCallWebhook(company._id, call, emp)
        processed++
      }
    }

    console.log(`[Callyzer Webhook] Processed ${processed} calls for company ${companyId}`)
    res.json({ success: true, message: `Webhook processed: ${processed} calls` })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ==================== EMPLOYEE MAPPING ====================

/**
 * @desc    Get employee mapping (CRM users to Callyzer employees)
 * @route   GET /api/callyzer/employees
 * @access  Private (Admin)
 */
router.get('/employees',
  protect,
  setCompanyContext,
  authorize('super_admin', 'company_admin'),
  async (req, res) => {
    try {
      const company = await Company.findById(req.activeCompany._id)
      const callyzerConfig = company?.integrations?.callyzer

      const token = getCallyzerToken(callyzerConfig)
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Callyzer is not configured'
        })
      }

      const callyzer = new CallyzerService(token)
      const result = await callyzer.getEmployeeDetails()

      // Get CRM users with Callyzer mapping
      const crmUsers = await User.find({
        company: req.activeCompany._id,
        isActive: true,
        subDepartment: { $in: ['pre_sales', 'sales', 'crm', 'sales_closure'] }
      }).select('name email phone callyzerEmployeeNumber')

      const empList = result.data?.data || result.data?.employees || []

      res.json({
        success: true,
        data: {
          callyzerEmployees: empList,
          crmUsers: crmUsers
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

/**
 * @desc    Map CRM user to Callyzer employee
 * @route   PUT /api/callyzer/employees/map
 * @access  Private (Admin)
 */
router.put('/employees/map',
  protect,
  setCompanyContext,
  authorize('super_admin', 'company_admin'),
  async (req, res) => {
    try {
      const { userId, callyzerEmployeeNumber } = req.body

      await User.findByIdAndUpdate(userId, {
        $set: { callyzerEmployeeNumber }
      })

      res.json({
        success: true,
        message: 'Employee mapping updated'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ==================== DASHBOARD (Infographics) ====================

/**
 * @desc    Get Callyzer dashboard data for infographics
 * @route   GET /api/callyzer/dashboard
 * @access  Private (superadmin sees all, pre_sales sees own data)
 */
router.get('/dashboard',
  protect,
  setCompanyContext,
  async (req, res) => {
    try {
      const { startDate, endDate, empNumber, callType } = req.query
      console.log('[Callyzer Dashboard] Fetching dashboard for dates:', startDate, '-', endDate, 'empNumber:', empNumber || 'all', 'callType:', callType || 'all', 'user:', req.user.email || req.user._id)
      const userRole = req.user.role || req.user.subDepartment
      const isPreSales = userRole === 'pre_sales' || req.user.subDepartment === 'pre_sales'

      // Pre-sales can only see their own data
      let empFilter = null
      if (isPreSales) {
        if (!req.user.callyzerEmployeeNumber) {
          return res.json({
            success: true,
            data: {
              summary: { total_calls: 0, connected_calls: 0, missed_calls: 0, total_duration: 0, avg_duration: 0 },
              employees: [],
              dailyTrend: [],
              hourlyDistribution: [],
              callTypeBreakdown: { incoming: 0, outgoing: 0, missed: 0, rejected: 0 },
              outcomeDistribution: []
            }
          })
        }
        empFilter = [req.user.callyzerEmployeeNumber]
      } else if (empNumber) {
        empFilter = [empNumber]
      }

      const company = await Company.findById(req.activeCompany._id)
      const callyzerConfig = company?.integrations?.callyzer

      // Try Callyzer API first
      const token = getCallyzerToken(callyzerConfig)
      if (token) {
        try {
          const callyzer = new CallyzerService(token)
          const apiOpts = { startDate, endDate, empNumbers: empFilter || undefined }

          // Compute dashboard from call history (avoids rate limit issues with multiple API calls)
          const histOpts = { startDate, endDate, empNumbers: empFilter || undefined }
          if (callType) histOpts.callTypes = [callType]
          const allCalls = await fetchAllCallyzerCalls(callyzer, histOpts)

          if (allCalls.length > 0) {
            console.log('[Callyzer Dashboard] Computed from call history:', allCalls.length, 'calls')
            const computed = computeFromCallHistory(allCalls)

            // Fetch outcome distribution from local CRM data
            const outcomeQuery = { company: req.activeCompany._id }
            if (isPreSales) outcomeQuery.calledBy = req.user._id
            if (startDate || endDate) {
              const df = {}
              if (startDate) df.$gte = new Date(startDate)
              if (endDate) df.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999))
              outcomeQuery.$or = [
                { startedAt: df },
                { startedAt: { $exists: false }, createdAt: df },
                { startedAt: null, createdAt: df }
              ]
            }
            const localOutcomes = await CallActivity.aggregate([
              { $match: outcomeQuery },
              { $group: { _id: '$outcome', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ])
            const outcomeDistribution = localOutcomes.filter(o => o._id).map(o => ({ outcome: o._id, count: o.count }))

            return res.json({
              success: true,
              data: {
                ...computed,
                outcomeDistribution,
                isPreSales
              }
            })
          }
        } catch (apiErr) {
          console.log('[Callyzer Dashboard] API failed, falling back to local DB:', apiErr.message)
        }
      }

      // Fallback: aggregate from local CallActivity collection
      const dateQuery = { company: req.activeCompany._id }
      if (isPreSales) {
        dateQuery.calledBy = req.user._id
      }
      if (startDate || endDate) {
        const dateFilter = {}
        if (startDate) dateFilter.$gte = new Date(startDate)
        if (endDate) dateFilter.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999))
        dateQuery.$or = [
          { startedAt: dateFilter },
          { startedAt: { $exists: false }, createdAt: dateFilter },
          { startedAt: null, createdAt: dateFilter }
        ]
      }

      const localCalls = await CallActivity.find(dateQuery).lean()

      const total = localCalls.length
      const connected = localCalls.filter(c => c.status === 'completed' || c.duration > 0).length
      const missed = localCalls.filter(c => c.status === 'no_answer' || c.callType === 'missed').length
      const totalDuration = localCalls.reduce((sum, c) => sum + (c.duration || 0), 0)

      // Employee-wise aggregation (only for non-presales)
      const employeeMap = {}
      if (!isPreSales) {
        localCalls.forEach(c => {
          const name = c.calledByName || 'Unknown'
          if (!employeeMap[name]) {
            employeeMap[name] = { emp_name: name, total_calls: 0, connected_calls: 0, missed_calls: 0, total_duration: 0, incoming_calls: 0, outgoing_calls: 0 }
          }
          employeeMap[name].total_calls++
          if (c.status === 'completed' || c.duration > 0) employeeMap[name].connected_calls++
          if (c.status === 'no_answer') employeeMap[name].missed_calls++
          employeeMap[name].total_duration += (c.duration || 0)
          if (c.callType === 'inbound') employeeMap[name].incoming_calls++
          if (c.callType === 'outbound') employeeMap[name].outgoing_calls++
        })
        // Add avg_duration per employee
        Object.values(employeeMap).forEach(e => {
          e.avg_duration = e.total_calls > 0 ? Math.round(e.total_duration / e.total_calls) : 0
        })
      }

      // Daily trend
      const dailyMap = {}
      localCalls.forEach(c => {
        const date = (c.startedAt || c.createdAt)
        if (!date) return
        const dayKey = new Date(date).toISOString().split('T')[0]
        if (!dailyMap[dayKey]) dailyMap[dayKey] = { date: dayKey, total_calls: 0, connected_calls: 0, missed_calls: 0, total_duration: 0, incoming: 0, outgoing: 0 }
        dailyMap[dayKey].total_calls++
        if (c.status === 'completed' || c.duration > 0) dailyMap[dayKey].connected_calls++
        if (c.status === 'no_answer') dailyMap[dayKey].missed_calls++
        dailyMap[dayKey].total_duration += (c.duration || 0)
        if (c.callType === 'inbound') dailyMap[dayKey].incoming++
        if (c.callType === 'outbound') dailyMap[dayKey].outgoing++
      })

      // Hourly distribution
      const hourlyMap = {}
      localCalls.forEach(c => {
        const date = (c.startedAt || c.createdAt)
        if (!date) return
        const hour = new Date(date).getHours()
        if (!hourlyMap[hour]) hourlyMap[hour] = { hour, total_calls: 0 }
        hourlyMap[hour].total_calls++
      })

      // Call type breakdown
      const incoming = localCalls.filter(c => c.callType === 'inbound').length
      const outgoing = localCalls.filter(c => c.callType === 'outbound').length

      // Outcome distribution from local CRM data
      const outcomeMap = {}
      localCalls.forEach(c => {
        if (c.outcome) {
          outcomeMap[c.outcome] = (outcomeMap[c.outcome] || 0) + 1
        }
      })
      const outcomeDistribution = Object.entries(outcomeMap)
        .map(([outcome, count]) => ({ outcome, count }))
        .sort((a, b) => b.count - a.count)

      res.json({
        success: true,
        data: {
          summary: {
            total_calls: total,
            connected_calls: connected,
            missed_calls: missed,
            total_duration: totalDuration,
            avg_duration: total > 0 ? Math.round(totalDuration / total) : 0
          },
          employees: Object.values(employeeMap),
          dailyTrend: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
          hourlyDistribution: Array.from({ length: 24 }, (_, i) => hourlyMap[i] || { hour: i, total_calls: 0 }),
          callTypeBreakdown: {
            incoming,
            outgoing,
            missed,
            rejected: 0
          },
          outcomeDistribution,
          isPreSales
        }
      })
    } catch (error) {
      console.error('[Callyzer Dashboard] Error:', error)
      res.status(500).json({
        success: false,
        message: error.message
      })
    }
  }
)

// ==================== POLL CALL STATUS ====================

/**
 * @desc    Check if a recent call to a phone number has ended (poll Callyzer API + local DB)
 * @route   GET /api/callyzer/poll-call-status
 * @access  Private
 */
router.get('/poll-call-status',
  protect,
  setCompanyContext,
  async (req, res) => {
    try {
      const { phone, since } = req.query
      if (!phone) return res.status(400).json({ success: false, message: 'Phone required' })

      const sinceDate = since ? new Date(since) : new Date(Date.now() - 5 * 60 * 1000)

      // Clean phone to 10 digits for matching
      let cleanedPhone = phone.replace(/\D/g, '')
      if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) cleanedPhone = cleanedPhone.slice(2)
      if (cleanedPhone.length === 11 && cleanedPhone.startsWith('0')) cleanedPhone = cleanedPhone.slice(1)

      // 1. Check local DB for call activities created after the call started
      const localCall = await CallActivity.findOne({
        company: req.activeCompany._id,
        contactPhone: { $regex: cleanedPhone },
        createdAt: { $gte: sinceDate },
        status: { $in: ['completed', 'no_answer'] },
      }).sort({ createdAt: -1 }).lean()

      if (localCall) {
        return res.json({
          success: true,
          callEnded: true,
          data: {
            duration: localCall.duration || 0,
            status: localCall.status,
            callType: localCall.callType,
            callActivityId: localCall._id,
          }
        })
      }

      // 2. Try Callyzer API for recent calls
      const company = await Company.findById(req.activeCompany._id)
      const callyzerConfig = company?.integrations?.callyzer
      const token = getCallyzerToken(callyzerConfig)
      if (token) {
        const callyzer = new CallyzerService(token)
        const nowTs = Math.floor(Date.now() / 1000)
        const sinceTs = Math.floor(sinceDate.getTime() / 1000)
        const result = await callyzer.getCallHistory({
          startDate: new Date(sinceDate).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          pageSize: 10,
        })

        if (result.success && result.data?.result) {
          const matchingCall = result.data.result.find(c => {
            const clientNum = CallyzerService.formatPhoneNumber(c.client_number)
            return clientNum === cleanedPhone
          })
          if (matchingCall) {
            return res.json({
              success: true,
              callEnded: true,
              data: {
                duration: matchingCall.duration || 0,
                status: matchingCall.duration > 0 ? 'completed' : 'no_answer',
                callType: CallyzerService.mapCallType(matchingCall.call_type),
              }
            })
          }
        }
      }

      // No completed call found yet
      res.json({ success: true, callEnded: false })
    } catch (error) {
      console.error('Poll call status error:', error.message)
      res.json({ success: true, callEnded: false })
    }
  }
)

// ==================== HELPER FUNCTIONS ====================

async function buildEmployeeMap(companyId) {
  const users = await User.find({
    company: companyId,
    callyzerEmployeeNumber: { $exists: true, $ne: null }
  }).select('name callyzerEmployeeNumber')

  const map = new Map()
  users.forEach(user => {
    map.set(user.callyzerEmployeeNumber, user)
  })
  return map
}

async function handleCallWebhook(companyId, call, emp = {}) {
  try {
    // v2.1 field mappings
    const empNumber = emp.emp_number || call.emp_number || call.employee_number
    const empName = emp.emp_name || call.emp_name || call.employee_name || 'Unknown'
    const recordingUrl = call.call_recording_url || call.recording_url

    // Find lead by phone
    const phoneNumber = CallyzerService.formatPhoneNumber(call.client_number)
    if (!phoneNumber) return

    const lead = await Lead.findOne({
      company: companyId,
      $or: [
        { phone: { $regex: phoneNumber } },
        { 'location.phone': { $regex: phoneNumber } }
      ]
    })

    if (!lead) return

    // Find user by employee number
    const user = await User.findOne({
      company: companyId,
      callyzerEmployeeNumber: empNumber
    })

    // Check if call already exists
    let callActivity = await CallActivity.findOne({
      company: companyId,
      'callyzerData.callId': call.id
    })

    // Build start time from call_date + call_time (v2.1)
    let startedAt = null
    if (call.call_date && call.call_time) {
      startedAt = new Date(`${call.call_date}T${call.call_time}`)
    } else if (call.start_time) {
      startedAt = new Date(call.start_time)
    }

    let endedAt = null
    if (startedAt && call.duration > 0) {
      endedAt = new Date(startedAt.getTime() + call.duration * 1000)
    }

    if (!callActivity) {
      callActivity = new CallActivity({
        company: companyId,
        lead: lead._id,
        callType: CallyzerService.mapCallType(call.call_type),
        calledBy: user?._id,
        calledByName: user?.name || empName,
        calledByDepartment: user?.subDepartment || 'sales',
        contactPhone: call.client_number,
        contactName: call.client_name === 'Unknown' ? lead.name : (call.client_name || lead.name),
        callyzerData: {
          callId: call.id,
          employeeNumber: empNumber,
          callType: call.call_type,
          syncedAt: new Date()
        }
      })
    }

    callActivity.startedAt = startedAt
    callActivity.endedAt = endedAt
    callActivity.duration = call.duration || 0
    callActivity.status = CallyzerService.mapCallStatus(call.call_type, call.duration)
    callActivity.outcome = call.duration > 0 ? 'information_shared' : 'rnr'

    if (recordingUrl) {
      callActivity.recording = {
        url: recordingUrl,
        duration: call.duration
      }
    }

    await callActivity.save()

    // Update lead
    if (startedAt) {
      lead.lastContactedAt = startedAt
    }
    lead.lastActivityAt = new Date()
    await lead.updateCallSummary()
    await lead.save()

    // Emit real-time call:ended event to the CRM user via Socket.IO
    if (user?._id) {
      emitToUser(user._id.toString(), 'call:ended', {
        leadId: lead._id.toString(),
        leadName: lead.name,
        phone: call.client_number,
        callType: CallyzerService.mapCallType(call.call_type),
        duration: call.duration || 0,
        status: callActivity.status,
        callActivityId: callActivity._id.toString(),
      })
    }

    console.log(`[Callyzer Webhook] Call processed for lead ${lead.leadId}`)
  } catch (error) {
    console.error('[Callyzer Webhook] Error:', error.message)
  }
}

export default router
