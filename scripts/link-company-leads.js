/**
 * Script to link HOH108 leads visibility to Interior Plus
 *
 * Run this on the production server:
 * cd /var/www/backend && node scripts/link-company-leads.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') })

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

const linkCompanyLeads = async () => {
  await connectDB()

  const Company = mongoose.connection.collection('companies')

  // Find HOH108 company
  const hoh108 = await Company.findOne({ code: 'HOH108' })
  if (!hoh108) {
    console.log('Looking for company with code containing "HOH"...')
    const hohCompanies = await Company.find({ code: { $regex: /HOH/i } }).toArray()
    console.log('Found companies:', hohCompanies.map(c => ({ code: c.code, name: c.name, _id: c._id })))
  } else {
    console.log('HOH108 Company:', { code: hoh108.code, name: hoh108.name, _id: hoh108._id })
  }

  // Find Interior Plus company
  const interiorPlus = await Company.findOne({ code: 'IP' })
  if (!interiorPlus) {
    console.log('Looking for company with name containing "Interior"...')
    const ipCompanies = await Company.find({
      $or: [
        { name: { $regex: /interior/i } },
        { code: { $regex: /IP/i } }
      ]
    }).toArray()
    console.log('Found companies:', ipCompanies.map(c => ({ code: c.code, name: c.name, _id: c._id })))
  } else {
    console.log('Interior Plus Company:', { code: interiorPlus.code, name: interiorPlus.name, _id: interiorPlus._id })
  }

  // List all companies for reference
  console.log('\n=== All Companies ===')
  const allCompanies = await Company.find({}).toArray()
  allCompanies.forEach(c => {
    console.log(`- ${c.code}: ${c.name} (${c._id})`)
    if (c.canViewLeadsFrom && c.canViewLeadsFrom.length > 0) {
      console.log(`  Can view leads from: ${c.canViewLeadsFrom}`)
    }
  })

  // If both companies exist, link them
  if (hoh108 && interiorPlus) {
    console.log('\n=== Linking Companies ===')

    // Add HOH108 to Interior Plus's canViewLeadsFrom
    const result = await Company.updateOne(
      { _id: interiorPlus._id },
      { $addToSet: { canViewLeadsFrom: hoh108._id } }
    )

    if (result.modifiedCount > 0) {
      console.log(`✅ Successfully linked: Interior Plus can now view leads from HOH108`)
    } else if (result.matchedCount > 0) {
      console.log(`ℹ️  Link already exists or no change needed`)
    } else {
      console.log(`❌ Failed to update Interior Plus company`)
    }

    // Verify the update
    const updated = await Company.findOne({ _id: interiorPlus._id })
    console.log('Updated canViewLeadsFrom:', updated.canViewLeadsFrom)
  }

  await mongoose.connection.close()
  console.log('\nDone!')
}

linkCompanyLeads().catch(console.error)
