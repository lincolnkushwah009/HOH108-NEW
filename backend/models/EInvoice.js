import mongoose from 'mongoose'

const eInvoiceSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },

  customerInvoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerInvoice',
    required: [true, 'Customer invoice is required']
  },

  irn: {
    type: String
  },

  ackNumber: {
    type: String
  },

  ackDate: {
    type: Date
  },

  signedInvoice: {
    type: String
  },

  qrCode: {
    type: String
  },

  status: {
    type: String,
    enum: ['pending', 'generated', 'cancelled', 'error'],
    default: 'pending'
  },

  eInvoiceJson: {
    type: mongoose.Schema.Types.Mixed
  },

  errorDetails: {
    type: String
  },

  cancelReason: {
    type: String
  },

  cancelledAt: {
    type: Date
  },

  generatedAt: {
    type: Date
  },

  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
eInvoiceSchema.index({ company: 1, status: 1 })
eInvoiceSchema.index({ company: 1, customerInvoice: 1 })
eInvoiceSchema.index({ irn: 1 })
eInvoiceSchema.index({ ackNumber: 1 })
eInvoiceSchema.index({ company: 1, createdAt: -1 })

const EInvoice = mongoose.model('EInvoice', eInvoiceSchema)

export default EInvoice
