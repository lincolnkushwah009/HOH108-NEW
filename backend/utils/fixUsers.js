import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  // Get default company using raw collection
  const companiesCollection = mongoose.connection.collection('companies')
  let company = await companiesCollection.findOne({ isActive: true })

  if (!company) {
    // Create default company if none exists
    const result = await companiesCollection.insertOne({
      code: 'HG',
      name: 'Hancet Globe',
      type: 'mother',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    company = await companiesCollection.findOne({ _id: result.insertedId })
    console.log('Created default company:', company.name)
  }

  // Fix users with invalid roles using raw collection
  const usersCollection = mongoose.connection.collection('users')

  const usersToFix = await usersCollection.find({
    $or: [
      { role: { $in: ['user', 'admin'] } },
      { company: { $exists: false } },
      { company: null }
    ]
  }).toArray()

  console.log('Found', usersToFix.length, 'users to fix')

  for (const user of usersToFix) {
    const roleMap = { 'user': 'viewer', 'admin': 'company_admin' }
    const newRole = roleMap[user.role] || user.role || 'viewer'

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          role: newRole,
          company: user.company || company._id,
          department: user.department || 'sales'
        }
      }
    )
    console.log('Fixed user:', user.email, '-> role:', newRole)
  }

  console.log('Done!')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
