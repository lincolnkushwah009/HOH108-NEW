import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env vars from backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray()

    console.log('\n========================================')
    console.log('WARNING: This will delete ALL data!')
    console.log('========================================\n')
    console.log(`Found ${collections.length} collections:`)
    collections.forEach(c => console.log(`  - ${c.name}`))

    console.log('\nDeleting all collections...\n')

    // Drop each collection
    for (const collection of collections) {
      try {
        await mongoose.connection.db.dropCollection(collection.name)
        console.log(`✓ Deleted: ${collection.name}`)
      } catch (err) {
        console.log(`✗ Error deleting ${collection.name}: ${err.message}`)
      }
    }

    console.log('\n========================================')
    console.log('Database cleared successfully!')
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

clearDatabase()
