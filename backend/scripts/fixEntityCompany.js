import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
import User from '../models/User.js'

await mongoose.connect(process.env.MONGODB_URI)
console.log('Connected to MongoDB')

const IP_ID = '6967b34f1496c6c6e553fd1e'
const HOH_ID = '696bd861e4b0494d3f259c02'

// Fix employees based on entity field:
// entity=IP → company=IP, no additionalCompanies
// entity=HOH → company=HOH, no additionalCompanies
// entity=Both → company=IP, additionalCompanies=[HOH]

const users = await User.find({ empId: { $exists: true } }).select('empId name entity company additionalCompanies role')

let fixed = 0
for (const u of users) {
  const update = {}

  if (u.entity === 'IP') {
    if (u.company.toString() !== IP_ID) {
      update.company = IP_ID
    }
  } else if (u.entity === 'HOH') {
    if (u.company.toString() !== HOH_ID) {
      update.company = HOH_ID
    }
  } else if (u.entity === 'Both') {
    // Primary = IP, additional = HOH (so they appear in both)
    if (u.company.toString() !== IP_ID) {
      update.company = IP_ID
    }
    // Ensure additionalCompanies has HOH
    const hasHOH = u.additionalCompanies && u.additionalCompanies.some(
      ac => ac.company && ac.company.toString() === HOH_ID
    )
    if (!hasHOH) {
      update.additionalCompanies = [
        ...(u.additionalCompanies || []),
        { company: HOH_ID, role: u.role || 'viewer' }
      ]
    }
  }

  if (Object.keys(update).length > 0) {
    await User.updateOne({ _id: u._id }, { $set: update })
    fixed++
    console.log(`  FIX: ${u.empId} ${u.name} entity=${u.entity} → ${JSON.stringify(update).substring(0, 100)}`)
  }
}

console.log(`\nFixed ${fixed} employees`)

// Verify
const ipCount = await User.countDocuments({ company: IP_ID, empId: { $exists: true } })
const hohCount = await User.countDocuments({ company: HOH_ID, empId: { $exists: true } })
const bothCount = await User.countDocuments({ entity: 'Both', empId: { $exists: true } })
const withAdditional = await User.countDocuments({ 'additionalCompanies.0': { $exists: true }, empId: { $exists: true } })

console.log(`\nVerification:`)
console.log(`  IP company: ${ipCount} employees`)
console.log(`  HOH company: ${hohCount} employees`)
console.log(`  Entity=Both: ${bothCount} employees`)
console.log(`  With additionalCompanies: ${withAdditional} employees`)

process.exit(0)
