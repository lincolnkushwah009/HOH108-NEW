import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
import User from '../models/User.js'

await mongoose.connect(process.env.MONGODB_URI)

const ipId = '6967b34f1496c6c6e553fd1e'
const hohId = '696bd861e4b0494d3f259c02'

const users = await User.find({ empId: { $exists: true } }).select('empId entity company additionalCompanies')
const byEntity = {}
for (const u of users) {
  const ent = u.entity || 'none'
  if (!byEntity[ent]) byEntity[ent] = { count: 0, inIP: 0, inHOH: 0, hasAdd: 0 }
  byEntity[ent].count++
  if (u.company.toString() === ipId) byEntity[ent].inIP++
  if (u.company.toString() === hohId) byEntity[ent].inHOH++
  if (u.additionalCompanies && u.additionalCompanies.length > 0) byEntity[ent].hasAdd++
}
for (const [e, d] of Object.entries(byEntity)) {
  console.log(e + ': count=' + d.count + ' inIP=' + d.inIP + ' inHOH=' + d.inHOH + ' hasAdditional=' + d.hasAdd)
}
process.exit(0)
