import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import Company from '../models/Company.js'

dotenv.config()

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Check if super admin exists
    const existingAdmin = await User.findOne({ email: 'admin@hoh108.com' })

    if (existingAdmin) {
      // Update existing admin to have correct role
      existingAdmin.role = 'super_admin'
      await existingAdmin.save({ validateBeforeSave: false })
      console.log('Super admin role updated:', existingAdmin.email)
      process.exit(0)
    }

    // Create or find mother company first
    let company = await Company.findOne({ code: 'HG' })
    if (!company) {
      company = await Company.create({
        code: 'HG',
        name: 'Hancet Globe',
        type: 'mother',
        email: 'admin@hancetglobe.com',
        isActive: true
      })
      console.log('Mother company created:', company.name)
    }

    // Create super admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'admin@hoh108.com',
      phone: '9876543210',
      password: 'Admin@123',
      role: 'super_admin',
      company: company._id,
      isActive: true
    })

    console.log('Super admin created successfully!')
    console.log('Email: admin@hoh108.com')
    console.log('Password: Admin@123')
    console.log('Please change the password after first login')

    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

seedSuperAdmin()
