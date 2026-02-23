import mongoose from 'mongoose'

const assetSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  assetCode: {
    type: String
  },
  assetName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['furniture', 'equipment', 'vehicle', 'computer', 'machinery', 'building', 'land', 'other'],
    default: 'equipment'
  },
  description: String,
  serialNumber: String,
  purchaseDate: Date,
  purchasePrice: {
    type: Number,
    default: 0
  },
  currentValue: {
    type: Number,
    default: 0
  },
  depreciationMethod: {
    type: String,
    enum: ['straight_line', 'declining_balance', 'none'],
    default: 'straight_line'
  },
  usefulLife: {
    type: Number,
    default: 5 // years
  },
  salvageValue: {
    type: Number,
    default: 0
  },
  location: String,
  department: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'retired', 'disposed', 'lost'],
    default: 'active'
  },
  warranty: {
    provider: String,
    expiryDate: Date,
    terms: String
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  notes: String,
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  maintenanceHistory: [{
    date: Date,
    type: String,
    description: String,
    cost: Number,
    performedBy: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true })

assetSchema.index({ company: 1, assetCode: 1 }, { unique: true })
assetSchema.index({ company: 1, status: 1 })
assetSchema.index({ company: 1, category: 1 })

assetSchema.pre('save', async function(next) {
  if (!this.assetCode) {
    try {
      const Company = mongoose.model('Company')
      const company = await Company.findById(this.company)
      if (company) {
        this.assetCode = await company.generateId('asset')
      } else {
        const count = await this.constructor.countDocuments({ company: this.company })
        this.assetCode = `AST-${String(count + 1).padStart(5, '0')}`
      }
    } catch (err) {
      const count = await this.constructor.countDocuments({ company: this.company })
      this.assetCode = `AST-${String(count + 1).padStart(5, '0')}`
    }
  }
  next()
})

const Asset = mongoose.model('Asset', assetSchema)
export default Asset
