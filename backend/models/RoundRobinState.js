import mongoose from 'mongoose'

const roundRobinStateSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  city: {
    type: String,
    required: true,
    enum: ['Bengaluru', 'Mysuru', 'Hyderabad', 'All']
  },
  department: {
    type: String,
    required: true,
    enum: ['pre_sales', 'sales_closure', 'crm', 'design', 'operations']
  },
  // Optional showroom/branch (Experience Center) for branch-level round-robin
  showroom: {
    type: String,
    default: null
  },
  // Ordered list of eligible user IDs for this city+department
  roster: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Index of the LAST assigned user in roster
  lastAssignedIndex: {
    type: Number,
    default: -1
  },
  // Timestamp of last roster rebuild
  rosterUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Compound unique index: one state per company + city + department + showroom
roundRobinStateSchema.index({ company: 1, city: 1, department: 1, showroom: 1 }, { unique: true })

export default mongoose.model('RoundRobinState', roundRobinStateSchema)
