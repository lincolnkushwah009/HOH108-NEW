import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env vars from backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const clearExceptAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray()

    console.log('\n========================================')
    console.log('Clearing all data EXCEPT super admin')
    console.log('========================================\n')
    console.log(`Found ${collections.length} collections:`)
    collections.forEach(c => console.log(`  - ${c.name}`))

    // Collections to preserve (partially)
    const preserveCollections = ['users', 'companies']

    console.log('\nProcessing collections...\n')

    for (const collection of collections) {
      try {
        const collName = collection.name

        if (collName === 'users') {
          // Keep only superadmin user
          const result = await mongoose.connection.db.collection(collName).deleteMany({
            email: { $ne: 'superadmin@hoh108.com' }
          })
          console.log(`✓ users: Removed ${result.deletedCount} users (kept superadmin)`)
        } else if (collName === 'companies') {
          // Keep the company linked to superadmin
          // First get the superadmin's company ID
          const superadmin = await mongoose.connection.db.collection('users').findOne({
            email: 'superadmin@hoh108.com'
          })

          if (superadmin && superadmin.company) {
            const result = await mongoose.connection.db.collection(collName).deleteMany({
              _id: { $ne: superadmin.company }
            })
            console.log(`✓ companies: Removed ${result.deletedCount} companies (kept superadmin's company)`)
          } else {
            console.log(`⚠ companies: No superadmin company found, keeping all`)
          }
        } else {
          // Delete all documents in other collections
          const result = await mongoose.connection.db.collection(collName).deleteMany({})
          console.log(`✓ ${collName}: Removed ${result.deletedCount} documents`)
        }
      } catch (err) {
        console.log(`✗ Error processing ${collection.name}: ${err.message}`)
      }
    }

    console.log('\n========================================')
    console.log('Database cleared successfully!')
    console.log('Preserved: superadmin@hoh108.com')
    console.log('========================================\n')

    // Disconnect
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)

  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

clearExceptAdmin()
