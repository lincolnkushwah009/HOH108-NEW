import mongoose from 'mongoose'

/**
 * Payment Milestone Model
 * Industry-standard payment milestones linked to project phases/tasks
 * Tracks payment schedules, invoices, and collections
 */

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'neft', 'rtgs', 'imps', 'other'],
    default: 'bank_transfer'
  },
  reference: String, // Transaction ID, cheque number, etc.
  remarks: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recordedByName: String,
  receipt: {
    url: String,
    uploadedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'bounced', 'refunded'],
    default: 'pending'
  }
})

const paymentMilestoneSchema = new mongoose.Schema({
  // Auto-generated Milestone ID (e.g., IP-PM-2024-00001)
  milestoneId: {
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

  // Project Reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },

  // Customer Reference
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },

  // Milestone Details
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: String,

  // Milestone Type (Industry Standard)
  type: {
    type: String,
    enum: [
      'booking_advance',        // Initial booking amount
      'design_approval',        // After design sign-off
      'material_order',         // Before ordering materials
      'production_start',       // Factory production begins
      'production_50',          // 50% production complete
      'production_complete',    // Production completed
      'dispatch',               // Before dispatch
      'installation_start',     // Installation begins
      'installation_50',        // 50% installation
      'installation_complete',  // Installation done
      'handover',               // Final handover
      'retention',              // Retention amount
      'custom'                  // Custom milestone
    ],
    default: 'custom'
  },

  // Order in payment schedule
  order: {
    type: Number,
    default: 0
  },

  // ============================================
  // FINANCIAL DETAILS
  // ============================================

  // Percentage of total project value
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },

  // Calculated amount based on percentage
  amount: {
    type: Number,
    required: true
  },

  // GST/Tax details
  taxable: {
    type: Boolean,
    default: true
  },
  gstPercentage: {
    type: Number,
    default: 18
  },
  gstAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },

  // Amount collected so far
  collectedAmount: {
    type: Number,
    default: 0
  },

  // Pending amount
  pendingAmount: {
    type: Number,
    default: 0
  },

  // ============================================
  // TIMELINE & TRIGGERS
  // ============================================

  // Due date for this milestone
  dueDate: Date,

  // Linked to task completion (optional)
  linkedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTaskInstance'
  },
  linkedTaskName: String,

  // Linked to phase completion (optional)
  linkedPhase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectPhase'
  },
  linkedPhaseName: String,

  // Trigger condition
  triggerCondition: {
    type: String,
    enum: ['manual', 'task_complete', 'phase_complete', 'percentage_complete', 'date_based'],
    default: 'manual'
  },
  triggerPercentage: Number, // If percentage-based

  // ============================================
  // STATUS & WORKFLOW
  // ============================================

  status: {
    type: String,
    enum: ['upcoming', 'due', 'overdue', 'partially_paid', 'paid', 'waived', 'cancelled'],
    default: 'upcoming',
    index: true
  },

  // Invoice Details
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoiceNumber: String,
  invoiceDate: Date,
  invoiceUrl: String,

  // ============================================
  // PAYMENTS RECEIVED
  // ============================================

  payments: [paymentSchema],

  // ============================================
  // REMINDERS & FOLLOW-UPS
  // ============================================

  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'call', 'whatsapp']
    },
    sentAt: Date,
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentByName: String,
    response: String
  }],

  lastReminderAt: Date,
  nextReminderAt: Date,

  // ============================================
  // NOTES & ATTACHMENTS
  // ============================================

  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedByName: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // ============================================
  // ACTIVITY LOG
  // ============================================

  activities: [{
    action: String,
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
paymentMilestoneSchema.index({ company: 1, project: 1, order: 1 })
paymentMilestoneSchema.index({ company: 1, customer: 1, status: 1 })
paymentMilestoneSchema.index({ company: 1, status: 1, dueDate: 1 })
paymentMilestoneSchema.index({ company: 1, dueDate: 1 })

// Pre-save: Calculate amounts
paymentMilestoneSchema.pre('save', function(next) {
  // Calculate GST if taxable
  if (this.taxable) {
    this.gstAmount = Math.round(this.amount * (this.gstPercentage / 100))
    this.totalAmount = this.amount + this.gstAmount
  } else {
    this.gstAmount = 0
    this.totalAmount = this.amount
  }

  // Calculate pending amount
  this.pendingAmount = this.totalAmount - this.collectedAmount

  // Update status based on payments and due date
  if (this.collectedAmount >= this.totalAmount) {
    this.status = 'paid'
  } else if (this.collectedAmount > 0) {
    this.status = 'partially_paid'
  } else if (this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue'
  } else if (this.dueDate && new Date() >= new Date(this.dueDate - 7 * 24 * 60 * 60 * 1000)) {
    this.status = 'due'
  }

  next()
})

// Method to add payment
paymentMilestoneSchema.methods.addPayment = async function(paymentData, userId, userName) {
  this.payments.push({
    ...paymentData,
    recordedBy: userId,
    recordedByName: userName
  })

  // Update collected amount
  this.collectedAmount = this.payments
    .filter(p => p.status === 'confirmed' || p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)

  this.activities.push({
    action: 'payment_received',
    description: `Payment of ₹${paymentData.amount} received via ${paymentData.method}`,
    performedBy: userId,
    performedByName: userName,
    newValue: paymentData.amount
  })

  return this.save()
}

// Method to generate invoice
paymentMilestoneSchema.methods.generateInvoice = async function(invoiceNumber, userId, userName) {
  this.invoiceGenerated = true
  this.invoiceNumber = invoiceNumber
  this.invoiceDate = new Date()

  this.activities.push({
    action: 'invoice_generated',
    description: `Invoice ${invoiceNumber} generated`,
    performedBy: userId,
    performedByName: userName
  })

  return this.save()
}

// Static: Get payment summary for project
paymentMilestoneSchema.statics.getProjectPaymentSummary = async function(projectId) {
  const milestones = await this.find({ project: projectId }).sort({ order: 1 })

  const summary = {
    totalMilestones: milestones.length,
    totalAmount: 0,
    totalGST: 0,
    grandTotal: 0,
    collected: 0,
    pending: 0,
    upcomingCount: 0,
    dueCount: 0,
    overdueCount: 0,
    paidCount: 0,
    milestones: milestones
  }

  milestones.forEach(m => {
    summary.totalAmount += m.amount
    summary.totalGST += m.gstAmount
    summary.grandTotal += m.totalAmount
    summary.collected += m.collectedAmount
    summary.pending += m.pendingAmount

    if (m.status === 'upcoming') summary.upcomingCount++
    else if (m.status === 'due') summary.dueCount++
    else if (m.status === 'overdue') summary.overdueCount++
    else if (m.status === 'paid') summary.paidCount++
  })

  summary.collectionPercentage = summary.grandTotal > 0
    ? Math.round((summary.collected / summary.grandTotal) * 100)
    : 0

  return summary
}

// Static: Create default milestones for interior project
paymentMilestoneSchema.statics.createDefaultMilestones = async function(projectId, customerId, companyId, totalAmount, userId) {
  const defaultMilestones = [
    { name: 'Booking Advance', type: 'booking_advance', percentage: 10, order: 1 },
    { name: 'Design Approval', type: 'design_approval', percentage: 15, order: 2 },
    { name: 'Material Order', type: 'material_order', percentage: 25, order: 3 },
    { name: 'Production Start', type: 'production_start', percentage: 15, order: 4 },
    { name: 'Dispatch', type: 'dispatch', percentage: 15, order: 5 },
    { name: 'Installation Complete', type: 'installation_complete', percentage: 15, order: 6 },
    { name: 'Handover', type: 'handover', percentage: 5, order: 7 }
  ]

  const GST_PERCENTAGE = 18

  const milestones = defaultMilestones.map(m => {
    const baseAmount = Math.round(totalAmount * (m.percentage / 100))
    const gstAmount = Math.round(baseAmount * (GST_PERCENTAGE / 100))
    const milestoneTotal = baseAmount + gstAmount

    return {
      company: companyId,
      project: projectId,
      customer: customerId,
      name: m.name,
      type: m.type,
      percentage: m.percentage,
      amount: baseAmount,
      gstPercentage: GST_PERCENTAGE,
      gstAmount: gstAmount,
      totalAmount: milestoneTotal,
      pendingAmount: milestoneTotal,
      collectedAmount: 0,
      order: m.order,
      triggerCondition: 'manual',
      status: m.order === 1 ? 'due' : 'upcoming',
      createdBy: userId
    }
  })

  return this.insertMany(milestones)
}

export default mongoose.model('PaymentMilestone', paymentMilestoneSchema)
