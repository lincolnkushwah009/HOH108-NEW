import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  description: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  createdAt: { type: Date, default: Date.now }
})

const lineItemSchema = new mongoose.Schema({
  slNo: Number,
  description: { type: String, required: true },
  itemCode: String,
  category: String,
  unit: {
    type: String,
    enum: ['sqft', 'sqm', 'rft', 'nos', 'kg', 'ltr', 'set', 'lot', 'sheets', 'rolls', 'boxes', 'pcs'],
    default: 'nos'
  },
  quantity: { type: Number, required: true, default: 0 },
  unitPrice: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 }, // GST percentage
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  deliveredQuantity: { type: Number, default: 0 },
  pendingQuantity: { type: Number, default: 0 },
  remarks: String
})

const purchaseOrderSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  poNumber: {
    type: String
    // Auto-generated in pre-save hook
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  purchaseRequisition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseRequisition'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  lineItems: [lineItemSchema],
  subTotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  shippingCharges: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  poTotal: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  paymentTerms: {
    type: String,
    enum: ['advance', 'cod', 'net_7', 'net_15', 'net_30', 'net_45', 'net_60', 'custom'],
    default: 'net_30'
  },
  customPaymentTerms: String,
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'sent', 'confirmed', 'partially_delivered', 'fully_delivered', 'invoiced', 'paid', 'cancelled', 'closed'],
    default: 'draft'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalRemarks: String,
  termsAndConditions: String,
  internalNotes: String,
  vendorNotes: String,
  attachments: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  activities: [activitySchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Calculate totals before save
purchaseOrderSchema.pre('save', async function(next) {
  // Generate PO number
  if (!this.poNumber) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    this.poNumber = `PO-${year}${month}-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate line item totals
  let subTotal = 0
  let totalTax = 0
  let totalDiscount = 0

  this.lineItems.forEach((item, index) => {
    item.slNo = index + 1
    const lineTotal = item.quantity * item.unitPrice
    const discountAmount = (lineTotal * item.discount) / 100
    const taxableAmount = lineTotal - discountAmount
    item.taxAmount = (taxableAmount * item.taxRate) / 100
    item.totalAmount = taxableAmount + item.taxAmount
    item.pendingQuantity = item.quantity - item.deliveredQuantity

    subTotal += lineTotal
    totalDiscount += discountAmount
    totalTax += item.taxAmount
  })

  this.subTotal = subTotal
  this.totalDiscount = totalDiscount
  this.totalTax = totalTax
  this.poTotal = subTotal - totalDiscount + totalTax + (this.shippingCharges || 0) + (this.otherCharges || 0)

  next()
})

// Update delivery status based on line items
purchaseOrderSchema.methods.updateDeliveryStatus = function() {
  const totalQuantity = this.lineItems.reduce((sum, item) => sum + item.quantity, 0)
  const deliveredQuantity = this.lineItems.reduce((sum, item) => sum + item.deliveredQuantity, 0)

  if (deliveredQuantity === 0) {
    return this.status // Keep current status
  } else if (deliveredQuantity < totalQuantity) {
    return 'partially_delivered'
  } else {
    return 'fully_delivered'
  }
}

// Indexes
purchaseOrderSchema.index({ company: 1, poNumber: 1 }, { unique: true })
purchaseOrderSchema.index({ company: 1, vendor: 1 })
purchaseOrderSchema.index({ company: 1, project: 1 })
purchaseOrderSchema.index({ company: 1, status: 1 })
purchaseOrderSchema.index({ company: 1, orderDate: -1 })

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema)

export default PurchaseOrder
