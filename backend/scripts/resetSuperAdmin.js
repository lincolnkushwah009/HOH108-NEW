import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  const User = mongoose.connection.collection('users')
  const user = await User.findOne({ email: 'superadmin@hoh108.com' })

  if (!user) {
    console.log('User superadmin@hoh108.com not found')
    await mongoose.disconnect()
    return
  }

  console.log('Found user:', user.name, '| Role:', user.role)
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash('Admin@123', salt)
  await User.updateOne({ _id: user._id }, { $set: { password: hash } })
  console.log('Password reset to: Admin@123')
  await mongoose.disconnect()
}

run()
