import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config()

/**
 * Script to mark specific users as non-employees
 * These users will not appear in the employee list but can still login
 *
 * Usage: node scripts/markNonEmployees.js
 *
 * To mark a user as non-employee, add their email or name to the list below
 */

const markNonEmployees = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Users to mark as non-employees (by email or name)
    // Add emails or names of users who should NOT appear in employee list
    const nonEmployeeIdentifiers = [
      // Add user emails here, e.g.:
      // 'vendor@example.com',
      // 'customer@example.com',

      // Or add names (partial match):
      'Mohamed Habeebulla',
      'Raghu'
    ]

    // Find and update users
    let updatedCount = 0
    for (const identifier of nonEmployeeIdentifiers) {
      // Try to match by email (exact) or name (case-insensitive)
      const result = await User.updateMany(
        {
          $or: [
            { email: identifier.toLowerCase() },
            { name: { $regex: identifier, $options: 'i' } }
          ]
        },
        { $set: { isEmployee: false } }
      )

      if (result.modifiedCount > 0) {
        console.log(`Marked ${result.modifiedCount} user(s) matching "${identifier}" as non-employee`)
        updatedCount += result.modifiedCount
      }
    }

    if (updatedCount === 0) {
      console.log('No users matched the identifiers. Listing all users with viewer role:')
      const viewers = await User.find({ role: 'viewer' }, 'name email role isEmployee')
      console.log(viewers)
    } else {
      console.log(`\nTotal users marked as non-employees: ${updatedCount}`)
    }

    // Show current employee status
    console.log('\n--- Current user breakdown ---')
    const employeeCount = await User.countDocuments({ isEmployee: { $ne: false } })
    const nonEmployeeCount = await User.countDocuments({ isEmployee: false })
    console.log(`Employees: ${employeeCount}`)
    console.log(`Non-employees: ${nonEmployeeCount}`)

    await mongoose.disconnect()
    console.log('\nDone')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

markNonEmployees()
