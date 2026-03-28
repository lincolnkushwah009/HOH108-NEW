import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import XLSX from 'xlsx'
import mongoose from 'mongoose'
import { protect, setCompanyContext, authorize } from '../middleware/rbac.js'
import Lead from '../models/Lead.js'
import CallActivity from '../models/CallActivity.js'
import User from '../models/User.js'
import Company from '../models/Company.js'

const router = express.Router()

// =====================
// FILE UPLOAD CONFIG
// =====================

const uploadDir = 'uploads/data-migration'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const migrationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'migration-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const migrationFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel', // xls
    'text/csv'
  ]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only XLSX, XLS, and CSV files are allowed.'), false)
  }
}

const uploadMigration = multer({
  storage: migrationStorage,
  fileFilter: migrationFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1
  }
})

// =====================
// HELPERS
// =====================

/**
 * Normalize phone number - strip spaces, dashes, country code prefix
 */
function normalizePhone(phone) {
  if (!phone) return ''
  let cleaned = String(phone).replace(/[\s\-\(\)\.]/g, '')
  // Remove leading +91 or 91 for Indian numbers
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    cleaned = cleaned.slice(3)
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.slice(2)
  }
  return cleaned
}

/**
 * Map source string from spreadsheet to Lead source enum
 */
function mapLeadSource(sourceStr) {
  if (!sourceStr) return 'other'
  const s = sourceStr.toLowerCase().trim()

  const sourceMap = {
    'website': 'website',
    'web': 'website',
    'referral': 'referral',
    'reference': 'referral',
    'social media': 'social-media',
    'social-media': 'social-media',
    'social': 'social-media',
    'google ads': 'google-ads',
    'google-ads': 'google-ads',
    'google ad': 'google-ads',
    'facebook ads': 'facebook-ads',
    'facebook-ads': 'facebook-ads',
    'facebook ad': 'facebook-ads',
    'fb ads': 'facebook-ads',
    'instagram': 'instagram',
    'insta': 'instagram',
    'walk-in': 'walk-in',
    'walk in': 'walk-in',
    'walkin': 'walk-in',
    'cold-call': 'cold-call',
    'cold call': 'cold-call',
    'event': 'event',
    'partner': 'partner',
    'channel partner': 'partner',
    'google': 'google',
  }

  if (sourceMap[s]) return sourceMap[s]

  // If source contains "CP" or "channel partner", map to partner
  if (s.includes('cp') || s.includes('channel partner')) return 'partner'
  // If source contains "ref", map to referral
  if (s.includes('referral') || s.includes('reference') || s.includes('ref')) return 'referral'

  return 'other'
}

/**
 * Map lead status string from spreadsheet to primaryStatus enum
 */
function mapLeadStatus(statusStr) {
  if (!statusStr) return 'new'
  const s = statusStr.toLowerCase().trim()

  const statusMap = {
    'new': 'new',
    'in progress': 'in_progress',
    'in_progress': 'in_progress',
    'contacted': 'contacted',
    'qualified': 'qualified',
    'lost': 'lost',
    'rnr': 'rnr',
    'ring no response': 'rnr',
    'future prospect': 'future_prospect',
    'future_prospect': 'future_prospect',
    'future': 'future_prospect',
    'cold': 'cold',
    'warm': 'warm',
    'hot': 'hot',
    'won': 'won',
    'proposal': 'proposal',
    'negotiation': 'negotiation',
    'meeting': 'meeting_status',
    'meeting_status': 'meeting_status',
    'meeting status': 'meeting_status',
  }

  return statusMap[s] || 'new'
}

/**
 * Parse the Remarks column: pipe-separated dated entries
 * E.g. "Feb-12th-RNR|Feb-16th-No requirement|Mar-5th-Will call back"
 * Returns array of { date, text, outcome }
 */
function parseRemarks(remarksStr, referenceYear) {
  if (!remarksStr || typeof remarksStr !== 'string') return []

  const entries = remarksStr.split('|').map(e => e.trim()).filter(Boolean)
  const parsed = []

  const monthMap = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
  }

  for (const entry of entries) {
    // Try to parse: "Feb-12th-RNR" or "Mar-5th-No requirement" or "Feb-12-RNR"
    const match = entry.match(/^([A-Za-z]+)[- ](\d{1,2})(?:st|nd|rd|th)?[- ](.+)$/i)

    if (match) {
      const monthStr = match[1].toLowerCase().slice(0, 3)
      const day = parseInt(match[2])
      const text = match[3].trim()

      const monthIndex = monthMap[monthStr]
      if (monthIndex !== undefined && day >= 1 && day <= 31) {
        const year = referenceYear || new Date().getFullYear()
        const date = new Date(year, monthIndex, day)

        // Determine outcome from text
        const outcome = mapRemarkToOutcome(text)

        parsed.push({
          date,
          text,
          outcome
        })
      } else {
        // Could not parse date, store as plain text
        parsed.push({ date: null, text: entry, outcome: 'follow_up_required' })
      }
    } else {
      // No date pattern found, store as plain text
      parsed.push({ date: null, text: entry, outcome: 'follow_up_required' })
    }
  }

  return parsed
}

/**
 * Map remark text to CallActivity outcome enum
 */
function mapRemarkToOutcome(text) {
  if (!text) return 'follow_up_required'
  const t = text.toLowerCase()

  if (t.includes('rnr') || t.includes('ring no response') || t.includes('not reachable')) return 'rnr'
  if (t.includes('not interested') || t.includes('no requirement') || t.includes('not required')) return 'not_interested'
  if (t.includes('interested') || t.includes('requirement')) return 'interested'
  if (t.includes('callback') || t.includes('call back') || t.includes('will call')) return 'callback_requested'
  if (t.includes('meeting') || t.includes('visit')) return 'meeting_scheduled'
  if (t.includes('busy')) return 'busy_call_back'
  if (t.includes('wrong number') || t.includes('wrong no')) return 'wrong_number'
  if (t.includes('future') || t.includes('later') || t.includes('next year')) return 'future_prospect'
  if (t.includes('qualified') || t.includes('confirm')) return 'qualified'
  if (t.includes('lost') || t.includes('closed') || t.includes('done elsewhere')) return 'lost'
  if (t.includes('info') || t.includes('shared') || t.includes('sent')) return 'information_shared'
  if (t.includes('voicemail') || t.includes('vm')) return 'voicemail_left'
  if (t.includes('follow up') || t.includes('followup') || t.includes('f/u')) return 'follow_up_required'

  return 'follow_up_required'
}

/**
 * Map call status string to CallActivity status enum
 */
function mapCallStatus(statusStr) {
  if (!statusStr) return 'completed'
  const s = statusStr.toLowerCase().trim()

  if (s.includes('no answer') || s.includes('rnr') || s.includes('not reachable')) return 'no_answer'
  if (s.includes('busy')) return 'busy'
  if (s.includes('wrong')) return 'wrong_number'
  if (s.includes('voicemail') || s.includes('vm')) return 'voicemail'
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('fail')) return 'failed'

  return 'completed'
}

/**
 * Parse an Excel date - handles both serial numbers and strings
 */
function parseExcelDate(value) {
  if (!value) return null

  // Excel serial date number
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(excelEpoch.getTime() + value * 86400000)
    return isNaN(date.getTime()) ? null : date
  }

  // String date
  const date = new Date(value)
  return isNaN(date.getTime()) ? null : date
}


// =====================
// ROUTES
// =====================

/**
 * GET /api/data-migration/template
 * Download the presales migration Excel template
 */
router.get('/template',
  protect,
  async (req, res) => {
    try {
      const headers = [
        'Client Name', 'Phone Number', 'Alt Num', 'Apartment Name',
        'Lead Source', 'Final Lead Source', 'Lead Assigned Date',
        'Call Status', 'Followup Date', 'Remarks', 'Lead Status',
        'Other Remarks'
      ]

      const sampleRow = {
        'Client Name': 'John Doe',
        'Phone Number': '9876543210',
        'Alt Num': '9123456789',
        'Apartment Name': 'Prestige Lakeside',
        'Lead Source': 'Google Ads',
        'Final Lead Source': 'Google',
        'Lead Assigned Date': '2026-03-15',
        'Call Status': 'Completed',
        'Followup Date': '2026-04-01',
        'Remarks': 'Mar-15th-Interested in 2BHK|Mar-20th-Will call back',
        'Lead Status': 'lost',
        'Other Remarks': ''
      }

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers })
      ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 2, 20) }))
      XLSX.utils.book_append_sheet(wb, ws, 'Leads')

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename=presales_migration_template.xlsx')
      res.send(buffer)
    } catch (error) {
      console.error('Template download error:', error)
      res.status(500).json({ success: false, message: 'Failed to generate template' })
    }
  }
)

/**
 * GET /api/data-migration/employees
 * Returns list of presales employees for the company
 */
router.get('/employees',
  protect,
  setCompanyContext,
  authorize('super_admin', 'company_admin', 'it_admin'),
  async (req, res) => {
    try {
      const companyId = req.activeCompany._id

      // Find users in this company with pre_sales or related roles
      const employees = await User.find({
        company: companyId,
        isActive: true,
        role: { $in: ['pre_sales', 'sales_executive', 'drm', 'assoc_drm', 'community_manager', 'assoc_community_manager'] }
      }).select('_id name email role department')
        .sort({ name: 1 })

      res.json({
        success: true,
        data: employees
      })
    } catch (error) {
      console.error('Error fetching employees:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employees'
      })
    }
  }
)


/**
 * POST /api/data-migration/import-presales
 * Import presales data from Excel/CSV file
 */
router.post('/import-presales',
  protect,
  setCompanyContext,
  authorize('super_admin', 'company_admin', 'it_admin'),
  uploadMigration.single('file'),
  async (req, res) => {
    const filePath = req.file?.path

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        })
      }

      const { employeeId } = req.body
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID is required'
        })
      }

      const companyId = req.activeCompany._id

      // Validate employee exists
      const employee = await User.findOne({ _id: employeeId, company: companyId })
      if (!employee) {
        return res.status(400).json({
          success: false,
          message: 'Employee not found in this company'
        })
      }

      // Get company for lead ID generation
      const company = await Company.findById(companyId)
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'Company not found'
        })
      }

      // Parse the file
      const workbook = XLSX.readFile(filePath, { cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

      if (!rawData.length) {
        return res.status(400).json({
          success: false,
          message: 'File is empty or has no data rows'
        })
      }

      const results = {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        total: rawData.length
      }

      // Process each row
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i]
        const rowNum = i + 2 // Excel row (1-indexed + header)

        // Skip completely blank rows
        const hasAnyData = Object.values(row).some(v => v !== null && v !== undefined && v.toString().trim() !== '')
        if (!hasAnyData) { results.skipped++; continue }

        try {
          // Extract fields (flexible column name matching)
          const clientName = (row['Client Name'] || row['client name'] || row['Name'] || row['name'] || '').toString().trim()
          const phoneRaw = (row['Phone Number'] || row['Phone'] || row['phone number'] || row['phone'] || row['Mobile'] || row['mobile'] || '').toString().trim()

          // Skip rows with no name AND no phone
          if (!clientName && !phoneRaw) { results.skipped++; continue }
          const altNumRaw = (row['Alt Num'] || row['Alternate Number'] || row['alt num'] || row['Alt Phone'] || '').toString().trim()
          const apartmentName = (row['Apartment Name'] || row['apartment name'] || row['Apartment'] || row['Property'] || row['property'] || '').toString().trim()
          const assignedTo = (row['Assigned To'] || row['assigned to'] || row['Assigned'] || '').toString().trim()
          const leadSourceStr = (row['Lead Source'] || row['lead source'] || row['Source'] || row['source'] || '').toString().trim()
          const finalLeadSourceStr = (row['Final Lead Source'] || row['final lead source'] || '').toString().trim()
          const leadAssignedMonth = (row['Lead Assigned Month'] || row['lead assigned month'] || '').toString().trim()
          const leadAssignedDateRaw = row['Lead Assigned Date'] || row['lead assigned date'] || ''
          const callStatusStr = (row['Call Status'] || row['call status'] || '').toString().trim()
          const followupDateRaw = row['Followup Date'] || row['followup date'] || row['Follow Up Date'] || row['Follow-up Date'] || ''
          const remarksStr = (row['Remarks'] || row['remarks'] || '').toString().trim()
          const leadStatusStr = (row['Lead Status'] || row['lead status'] || row['Status'] || row['status'] || '').toString().trim()
          const leadErrorStatusStr = (row['Lead Error Status'] || row['lead error status'] || '').toString().trim()
          const pipelineStr = (row['Pipeline'] || row['pipeline'] || '').toString().trim()
          const otherRemarksStr = (row['Other Remarks'] || row['other remarks'] || '').toString().trim()

          // Validate required fields
          const phone = normalizePhone(phoneRaw)
          if (!phone) {
            results.errors.push({ row: rowNum, message: 'Missing phone number', clientName })
            results.skipped++
            continue
          }

          if (!clientName) {
            results.errors.push({ row: rowNum, message: 'Missing client name', phone })
            results.skipped++
            continue
          }

          // Check for existing lead by phone + company
          let lead = await Lead.findOne({
            company: companyId,
            $or: [
              { phone: phone },
              { phone: phoneRaw },
              { alternatePhone: phone }
            ]
          })

          const leadAssignedDate = parseExcelDate(leadAssignedDateRaw)
          const followupDate = parseExcelDate(followupDateRaw)
          const source = mapLeadSource(finalLeadSourceStr || leadSourceStr)
          const primaryStatus = mapLeadStatus(leadStatusStr)

          if (lead) {
            // UPDATE existing lead with missing data
            let updated = false

            if (!lead.alternatePhone && altNumRaw) {
              lead.alternatePhone = normalizePhone(altNumRaw)
              updated = true
            }
            if (!lead.propertyName && apartmentName) {
              lead.propertyName = apartmentName
              updated = true
            }
            if ((!lead.source || lead.source === 'other') && source !== 'other') {
              lead.source = source
              updated = true
            }
            if (finalLeadSourceStr && !lead.sourceDetails) {
              lead.sourceDetails = finalLeadSourceStr
              updated = true
            }
            // Set presales assignment if not already assigned
            if (!lead.departmentAssignments?.preSales?.employee) {
              lead.departmentAssignments = lead.departmentAssignments || {}
              lead.departmentAssignments.preSales = {
                employee: employee._id,
                employeeName: employee.name,
                assignedAt: leadAssignedDate || new Date(),
                assignedBy: req.user._id,
                assignedByName: req.user.name,
                isActive: true
              }
              updated = true
            }
            // Set assignedTo if not already assigned
            if (!lead.assignedTo) {
              lead.assignedTo = employee._id
              updated = true
            }
            // Add employee to teamMembers if not already present
            const isTeamMember = (lead.teamMembers || []).some(
              tm => tm.user?.toString() === employee._id.toString()
            )
            if (!isTeamMember) {
              lead.teamMembers = lead.teamMembers || []
              lead.teamMembers.push({
                user: employee._id,
                role: 'owner',
                assignedBy: req.user._id,
                assignedAt: leadAssignedDate || new Date()
              })
              updated = true
            }
            // Update status from sheet if provided
            if (primaryStatus && primaryStatus !== 'new' && lead.primaryStatus === 'new') {
              lead.primaryStatus = primaryStatus
              lead.status = primaryStatus
              updated = true
            }
            // Set follow-up date
            if (followupDate && !lead.followUpDate) {
              lead.followUpDate = followupDate
              updated = true
            }

            if (updated) {
              // Add migration activity
              lead.activityHistory = lead.activityHistory || []
              lead.activityHistory.push({
                action: 'field_updated',
                description: 'Lead updated via presales data migration',
                performedBy: req.user._id,
                performedByName: req.user.name,
                metadata: { source: 'data_migration', row: rowNum }
              })
              await lead.save()
              results.updated++
            } else {
              results.skipped++
            }
          } else {
            // CREATE new lead
            const leadId = await company.generateLeadId({
              location: { city: '' },
              source: source
            })

            lead = new Lead({
              leadId,
              company: companyId,
              name: clientName,
              phone: phone,
              alternatePhone: altNumRaw ? normalizePhone(altNumRaw) : undefined,
              propertyName: apartmentName || undefined,
              source: source,
              sourceDetails: finalLeadSourceStr || leadSourceStr || undefined,
              primaryStatus: primaryStatus,
              status: primaryStatus,
              leadType: 'lead',
              assignedTo: employee._id,
              createdBy: req.user._id,
              teamMembers: [{
                user: employee._id,
                role: 'owner',
                assignedBy: req.user._id,
                assignedAt: leadAssignedDate || new Date()
              }],
              departmentAssignments: {
                preSales: {
                  employee: employee._id,
                  employeeName: employee.name,
                  assignedAt: leadAssignedDate || new Date(),
                  assignedBy: req.user._id,
                  assignedByName: req.user.name,
                  isActive: true
                }
              },
              followUpDate: followupDate || undefined,
              dateTracking: {
                leadGeneratedDate: leadAssignedDate || new Date()
              },
              activityHistory: [{
                action: 'created',
                description: 'Lead created via presales data migration',
                performedBy: req.user._id,
                performedByName: req.user.name,
                metadata: {
                  source: 'data_migration',
                  row: rowNum,
                  originalLeadSource: leadSourceStr,
                  finalLeadSource: finalLeadSourceStr,
                  assignedMonth: leadAssignedMonth,
                  pipeline: pipelineStr,
                  leadErrorStatus: leadErrorStatusStr
                }
              }]
            })

            // Store extra info in notes/message if available
            const extraNotes = []
            if (otherRemarksStr) extraNotes.push(`Other Remarks: ${otherRemarksStr}`)
            if (pipelineStr) extraNotes.push(`Pipeline: ${pipelineStr}`)
            if (leadErrorStatusStr) extraNotes.push(`Error Status: ${leadErrorStatusStr}`)
            if (leadAssignedMonth) extraNotes.push(`Assigned Month: ${leadAssignedMonth}`)
            if (callStatusStr) extraNotes.push(`Call Status: ${callStatusStr}`)
            if (extraNotes.length) {
              lead.message = extraNotes.join(' | ')
            }

            await lead.save()
            results.imported++
          }

          // Parse Remarks into CallActivity records
          if (remarksStr) {
            const referenceYear = leadAssignedDate
              ? leadAssignedDate.getFullYear()
              : new Date().getFullYear()

            const parsedRemarks = parseRemarks(remarksStr, referenceYear)

            for (let j = 0; j < parsedRemarks.length; j++) {
              const remark = parsedRemarks[j]

              try {
                const callActivity = new CallActivity({
                  company: companyId,
                  lead: lead._id,
                  callType: 'outbound',
                  attemptNumber: j + 1,
                  calledBy: employee._id,
                  calledByName: employee.name,
                  calledByDepartment: 'pre_sales',
                  contactPhone: phone,
                  contactName: clientName,
                  startedAt: remark.date || leadAssignedDate || new Date(),
                  endedAt: remark.date || leadAssignedDate || new Date(),
                  status: remark.outcome === 'rnr' ? 'no_answer' : 'completed',
                  outcome: remark.outcome,
                  notes: remark.text,
                  summary: `[Migration] ${remark.text}`,
                  tags: ['data_migration'],
                  activities: [{
                    action: 'call_completed',
                    description: `Migrated call record: ${remark.text}`,
                    performedBy: req.user._id,
                    performedByName: req.user.name,
                    createdAt: remark.date || leadAssignedDate || new Date()
                  }]
                })

                await callActivity.save()
              } catch (actErr) {
                // Don't fail the whole row for a remark parse error
                console.error(`Row ${rowNum}, Remark ${j + 1}: ${actErr.message}`)
              }
            }
          }

        } catch (rowErr) {
          results.errors.push({
            row: rowNum,
            message: rowErr.message,
            clientName: row['Client Name'] || row['Name'] || ''
          })
          results.skipped++
        }
      }

      // Clean up uploaded file
      try {
        fs.unlinkSync(filePath)
      } catch (e) { /* ignore cleanup errors */ }

      res.json({
        success: true,
        message: `Migration complete: ${results.imported} imported, ${results.updated} updated, ${results.skipped} skipped`,
        data: results
      })

    } catch (error) {
      console.error('Data migration error:', error)

      // Clean up uploaded file on error
      if (filePath) {
        try { fs.unlinkSync(filePath) } catch (e) { /* ignore */ }
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Data migration failed'
      })
    }
  }
)


/**
 * POST /api/data-migration/preview-presales
 * Preview parsed data before importing
 */
router.post('/preview-presales',
  protect,
  setCompanyContext,
  authorize('super_admin', 'company_admin', 'it_admin'),
  uploadMigration.single('file'),
  async (req, res) => {
    const filePath = req.file?.path

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        })
      }

      // Parse the file
      const workbook = XLSX.readFile(filePath, { cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

      if (!rawData.length) {
        return res.status(400).json({
          success: false,
          message: 'File is empty or has no data rows'
        })
      }

      const companyId = req.activeCompany._id

      // Parse and validate each row for preview
      const preview = []
      const columns = Object.keys(rawData[0])

      // First pass: collect all phones for batch lookup
      const allPhones = []
      const parsedRows = []

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i]

        const hasAnyData = Object.values(row).some(v => v !== null && v !== undefined && v.toString().trim() !== '')
        if (!hasAnyData) continue

        const clientName = (row['Client Name'] || row['client name'] || row['Name'] || row['name'] || '').toString().trim()
        const phoneRaw = (row['Phone Number'] || row['Phone'] || row['phone number'] || row['phone'] || row['Mobile'] || row['mobile'] || '').toString().trim()

        if (!clientName && !phoneRaw) continue
        const altNumRaw = (row['Alt Num'] || row['Alternate Number'] || row['alt num'] || row['Alt Phone'] || '').toString().trim()
        const apartmentName = (row['Apartment Name'] || row['apartment name'] || row['Apartment'] || row['Property'] || row['property'] || '').toString().trim()
        const leadSourceStr = (row['Lead Source'] || row['lead source'] || row['Source'] || row['source'] || '').toString().trim()
        const finalLeadSourceStr = (row['Final Lead Source'] || row['final lead source'] || '').toString().trim()
        const remarksStr = (row['Remarks'] || row['remarks'] || '').toString().trim()
        const leadStatusStr = (row['Lead Status'] || row['lead status'] || row['Status'] || row['status'] || '').toString().trim()
        const callStatusStr = (row['Call Status'] || row['call status'] || '').toString().trim()
        const followupDateRaw = row['Followup Date'] || row['followup date'] || row['Follow Up Date'] || ''

        const phone = normalizePhone(phoneRaw)
        if (phone) {
          allPhones.push(phone)
          if (phone !== phoneRaw) allPhones.push(phoneRaw)
        }

        parsedRows.push({
          rowNum: i + 2, clientName, phoneRaw, phone, altNumRaw, apartmentName,
          leadSourceStr, finalLeadSourceStr, remarksStr, leadStatusStr, callStatusStr, followupDateRaw
        })
      }

      // Batch lookup: find all existing leads by phone in one query
      const existingLeads = await Lead.find({
        company: companyId,
        $or: [
          { phone: { $in: allPhones } },
          { alternatePhone: { $in: allPhones } }
        ]
      }).select('_id leadId name phone alternatePhone primaryStatus').lean()

      // Build phone-to-lead lookup map
      const phoneToLead = {}
      for (const lead of existingLeads) {
        if (lead.phone) phoneToLead[lead.phone] = lead
        if (lead.alternatePhone) phoneToLead[lead.alternatePhone] = lead
      }

      // Second pass: build preview with lookup results
      for (const r of parsedRows) {
        const existingLead = r.phone ? (phoneToLead[r.phone] || phoneToLead[r.phoneRaw]) : null
        const remarksCount = r.remarksStr ? r.remarksStr.split('|').filter(Boolean).length : 0

        preview.push({
          row: r.rowNum,
          clientName: r.clientName,
          phone: r.phone || r.phoneRaw,
          altNum: r.altNumRaw,
          apartmentName: r.apartmentName,
          source: r.finalLeadSourceStr || r.leadSourceStr,
          mappedSource: mapLeadSource(r.finalLeadSourceStr || r.leadSourceStr),
          status: r.leadStatusStr,
          mappedStatus: mapLeadStatus(r.leadStatusStr),
          callStatus: r.callStatusStr,
          followupDate: r.followupDateRaw ? parseExcelDate(r.followupDateRaw) : null,
          remarksCount,
          remarks: r.remarksStr,
          existing: existingLead ? {
            id: existingLead._id,
            leadId: existingLead.leadId,
            name: existingLead.name,
            status: existingLead.primaryStatus
          } : null,
          valid: !!(r.phone && r.clientName),
          error: !r.phone ? 'Missing phone' : (!r.clientName ? 'Missing name' : null)
        })
      }

      // Clean up uploaded file
      try {
        fs.unlinkSync(filePath)
      } catch (e) { /* ignore cleanup errors */ }

      res.json({
        success: true,
        data: {
          columns,
          total: rawData.length,
          valid: preview.filter(p => p.valid).length,
          existing: preview.filter(p => p.existing).length,
          new: preview.filter(p => p.valid && !p.existing).length,
          invalid: preview.filter(p => !p.valid).length,
          rows: preview
        }
      })

    } catch (error) {
      console.error('Preview error:', error)

      if (filePath) {
        try { fs.unlinkSync(filePath) } catch (e) { /* ignore */ }
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to parse file'
      })
    }
  }
)

export default router
