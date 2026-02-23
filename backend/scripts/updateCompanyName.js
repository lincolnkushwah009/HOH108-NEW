import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Company from '../models/Company.js'

dotenv.config()

const updateCompanyName = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Find and update the company name
    const result = await Company.findOneAndUpdate(
      { name: 'House of Homes' },
      { $set: { name: 'House of Hancet 108' } },
      { new: true }
    )

    if (result) {
      console.log('Company updated:', result.name)
    } else {
      console.log('Company "House of Homes" not found')

      // List all companies to see what exists
      const companies = await Company.find({}, 'name code')
      console.log('All companies:', companies)
    }

    await mongoose.disconnect()
    console.log('Done')
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

updateCompanyName()
