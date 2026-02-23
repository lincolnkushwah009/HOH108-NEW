import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const createSuperAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB\n')

    // 1. Create Company first
    const companyData = {
      name: 'Interior Plus',
      code: 'IP',
      email: 'admin@interiorplus.in',
      phone: '+91 9876543210',
      address: {
        street: 'Business Park',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        pincode: '560001'
      },
      gstin: '29ABCDE1234F1Z5',
      settings: {
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Asia/Kolkata'
      },
      isActive: true
    }

    const Company = mongoose.model('Company', new mongoose.Schema({
      name: String,
      code: String,
      email: String,
      phone: String,
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        pincode: String
      },
      gstin: String,
      settings: {
        currency: String,
        dateFormat: String,
        timezone: String
      },
      isActive: Boolean
    }, { timestamps: true }))

    const company = await Company.create(companyData)
    console.log('✓ Company created:', company.name)
    console.log('  Company ID:', company._id)

    // 2. Create Super Admin User
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('Admin@123', salt)

    const userData = {
      name: 'Super Admin',
      email: 'admin@interiorplus.in',
      password: hashedPassword,
      phone: '+91 9876543210',
      role: 'super_admin',
      company: company._id,
      status: 'active',
      isEmailVerified: true,
      permissions: {
        leads: { view: true, create: true, edit: true, delete: true },
        customers: { view: true, create: true, edit: true, delete: true },
        projects: { view: true, create: true, edit: true, delete: true },
        employees: { view: true, create: true, edit: true, delete: true },
        finance: { view: true, create: true, edit: true, delete: true },
        settings: { view: true, create: true, edit: true, delete: true },
        reports: { view: true, create: true, edit: true, delete: true }
      }
    }

    const User = mongoose.model('User', new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      phone: String,
      role: String,
      company: mongoose.Schema.Types.ObjectId,
      status: String,
      isEmailVerified: Boolean,
      permissions: mongoose.Schema.Types.Mixed
    }, { timestamps: true }))

    const user = await User.create(userData)
    console.log('\n✓ Super Admin created:')
    console.log('  Name:', user.name)
    console.log('  Email:', user.email)
    console.log('  Role:', user.role)

    console.log('\n========================================')
    console.log('LOGIN CREDENTIALS')
    console.log('========================================')
    console.log('Email:    admin@interiorplus.in')
    console.log('Password: Admin@123')
    console.log('========================================\n')

    await mongoose.disconnect()
    console.log('Done!')
    process.exit(0)

  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

createSuperAdmin()
