import mongoose from 'mongoose'

const dispatchLineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  itemCode: String,
  hsnCode: String,
  unit: String,
  orderedQty: { type: Number, default: 0 },
  dispatchedQty: { type: Number, default: 0 },
  receivedQty: { type: Number, default: 0 },
  unitPrice: { type: Number, default: 0 },
  remarks: String
})

const salesDispatchSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  dispatchNumber: {
    type: String,
    trim: true
  },
  salesOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesOrder',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  dispatchDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: Date,
  deliveredDate: Date,
  lineItems: [dispatchLineItemSchema],
  status: {
    type: String,
    enum: ['draft', 'dispatched', 'in_transit', 'delivered', 'cancelled'],
    default: 'draft'
  },
  docketNumber: String,
  vehicleNumber: String,
  transporterName: String,
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true })

salesDispatchSchema.index({ company: 1, dispatchNumber: 1 }, { unique: true, sparse: true })
salesDispatchSchema.index({ company: 1, salesOrder: 1 })
salesDispatchSchema.index({ company: 1, customer: 1 })
salesDispatchSchema.index({ company: 1, status: 1 })

salesDispatchSchema.pre('save', async function(next) {
  if (!this.dispatchNumber) {
    try {
      const Company = mongoose.model('Company')
      const company = await Company.findById(this.company)
      if (company) {
        this.dispatchNumber = await company.generateId('salesDispatch')
      }
    } catch (err) {
      // fallback
    }
  }
  next()
})

const SalesDispatch = mongoose.model('SalesDispatch', salesDispatchSchema)
export default SalesDispatch
