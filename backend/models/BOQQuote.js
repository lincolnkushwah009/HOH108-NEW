import mongoose from 'mongoose'

/**
 * BOQ Quote - Generated quotes using BOQ items
 * Formula: cost = builtUpArea × rate × (percent/100)
 */

const quoteItemSchema = new mongoose.Schema({
  boqItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BOQItem'
  },
  itemName: {
    type: String,
    required: true
  },
  itemCode: String,
  category: String,
  unit: {
    type: String,
    default: 'sqft'
  },
  rate: {
    type: Number,
    default: 0
  },
  percent: {
    type: Number,
    default: 100
  },
  quantity: {
    type: Number,
    default: 0 // This is calculated based on builtUpArea
  },
  cost: {
    type: Number,
    default: 0 // cost = quantity * rate * (percent/100)
  }
}, { _id: true })

const boqQuoteSchema = new mongoose.Schema({
  // System generated ID: BOQ-YYYY-XXXXX
  quoteId: {
    type: String,
    unique: true,
    sparse: true
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Client Info
  clientName: {
    type: String,
    required: true,
    trim: true
  },

  clientPhone: String,
  clientEmail: String,

  // Link to Lead/Customer if exists
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },

  // Quote Creator
  createdByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorName: String,

  // Project Details
  place: {
    type: String,
    trim: true
  },

  projectType: {
    type: String,
    enum: ['residential', 'commercial', 'villa', 'apartment', '1bhk', '2bhk', '3bhk', '4bhk', 'penthouse', 'office', 'showroom', 'retail', 'other'],
    default: 'residential'
  },

  floors: {
    type: String,
    default: '1'
  },

  builtUpArea: {
    type: Number,
    required: true,
    min: 1
  },

  // Package Selection
  package: {
    type: String,
    required: true
  },

  // Quote Items (Cart)
  items: [quoteItemSchema],

  // Totals
  subtotal: {
    type: Number,
    default: 0
  },

  discount: {
    type: Number,
    default: 0
  },

  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },

  discountAmount: {
    type: Number,
    default: 0
  },

  taxRate: {
    type: Number,
    default: 18 // GST
  },

  taxAmount: {
    type: Number,
    default: 0
  },

  grandTotal: {
    type: Number,
    default: 0
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'converted'],
    default: 'draft'
  },

  validUntil: Date,

  // Notes
  notes: String,
  internalNotes: String,
  termsAndConditions: String,

  // Conversion tracking
  convertedToQuotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  convertedAt: Date,

  // Audit
  sentAt: Date,
  viewedAt: Date,
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String
}, {
  timestamps: true
})

// Generate Quote ID
boqQuoteSchema.pre('save', async function(next) {
  if (!this.quoteId) {
    const now = new Date()
    const year = now.getFullYear()

    const count = await this.constructor.countDocuments({
      company: this.company,
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    })

    this.quoteId = `BOQ-${year}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

// Calculate totals before save
boqQuoteSchema.pre('save', function(next) {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + (item.cost || 0), 0)

  // Calculate discount
  if (this.discountType === 'percentage') {
    this.discountAmount = (this.subtotal * (this.discount || 0)) / 100
  } else {
    this.discountAmount = this.discount || 0
  }

  // Calculate tax
  const taxableAmount = this.subtotal - this.discountAmount
  this.taxAmount = (taxableAmount * (this.taxRate || 0)) / 100

  // Calculate grand total
  this.grandTotal = taxableAmount + this.taxAmount

  next()
})

// Indexes
boqQuoteSchema.index({ company: 1, status: 1 })
boqQuoteSchema.index({ company: 1, createdByUser: 1 })
boqQuoteSchema.index({ company: 1, createdAt: -1 })
boqQuoteSchema.index({ lead: 1 })
boqQuoteSchema.index({ customer: 1 })

export default mongoose.model('BOQQuote', boqQuoteSchema)
