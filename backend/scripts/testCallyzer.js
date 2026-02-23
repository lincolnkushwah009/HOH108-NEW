import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

await mongoose.connect(process.env.MONGODB_URI)
const Company = (await import('../models/Company.js')).default
const CallyzerService = (await import('../utils/callyzer.js')).default
const Lead = (await import('../models/Lead.js')).default

const company = await Company.findById('6967b34f1496c6c6e553fd1e')
const callyzer = new CallyzerService(company.integrations.callyzer.apiToken)

// Get call history for last 7 days
const endDate = new Date().toISOString().split('T')[0]
const startDate = '2026-02-07'
console.log('Fetching calls from', startDate, 'to', endDate)

const calls = await callyzer.getCallHistory({ startDate, endDate, pageSize: 100 })
if (calls.success) {
  const records = calls.data?.result || []
  console.log('Total calls:', calls.data?.total_records, 'Fetched:', records.length)

  // Unique employees
  const empSet = new Map()
  const clientNumbers = new Set()
  for (const c of records) {
    const num = c.emp_number || c.employee_number
    const name = c.emp_name || c.employee_name
    if (num) empSet.set(num, name)
    if (c.client_number) clientNumbers.add(c.client_number)
  }

  console.log('\nUnique employees:')
  empSet.forEach((name, num) => console.log('  ', num, '-', name))

  console.log('\nUnique client numbers:', clientNumbers.size)

  // Check if any client numbers match leads
  let matched = 0
  for (const clientNum of clientNumbers) {
    const cleaned = CallyzerService.formatPhoneNumber(clientNum)
    if (!cleaned) continue
    const lead = await Lead.findOne({
      company: '6967b34f1496c6c6e553fd1e',
      $or: [
        { phone: { $regex: cleaned } },
        { 'location.phone': { $regex: cleaned } }
      ]
    })
    if (lead) {
      console.log('  MATCH:', clientNum, '->', lead.name, '(' + lead.leadId + ')')
      matched++
    }
  }
  console.log('\nMatched leads:', matched, '/', clientNumbers.size)
} else {
  console.log('API Error:', calls.error)
}

await mongoose.disconnect()
