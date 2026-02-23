import mongoose from 'mongoose'

const payrollSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  payrollId: {
    type: String,
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  period: {
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    }
  },
  basicSalary: {
    type: Number,
    default: 0
  },
  earnings: {
    hra: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    special: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deductions: {
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    loanDeduction: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  grossEarnings: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  workingDays: {
    type: Number,
    default: 0
  },
  presentDays: {
    type: Number,
    default: 0
  },
  leaveDays: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'paid', 'cancelled'],
    default: 'draft'
  },
  paymentDate: Date,
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cheque', 'cash'],
    default: 'bank_transfer'
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String
  },
  notes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true })

payrollSchema.index({ company: 1, 'period.year': 1, 'period.month': 1 })
payrollSchema.index({ company: 1, employee: 1 })
payrollSchema.index({ company: 1, status: 1 })

payrollSchema.pre('save', async function(next) {
  if (!this.payrollId) {
    const count = await this.constructor.countDocuments({ company: this.company })
    const mm = String(this.period.month).padStart(2, '0')
    const yy = String(this.period.year).slice(-2)
    this.payrollId = `PAY-${yy}${mm}-${String(count + 1).padStart(4, '0')}`
  }

  // Calculate totals
  const earnings = this.earnings || {}
  const deductions = this.deductions || {}

  this.grossEarnings = this.basicSalary +
    (earnings.hra || 0) + (earnings.conveyance || 0) + (earnings.medical || 0) +
    (earnings.special || 0) + (earnings.overtime || 0) + (earnings.bonus || 0) + (earnings.other || 0)

  this.totalDeductions = (deductions.pf || 0) + (deductions.esi || 0) + (deductions.tax || 0) +
    (deductions.professionalTax || 0) + (deductions.loanDeduction || 0) + (deductions.other || 0)

  this.netSalary = this.grossEarnings - this.totalDeductions

  next()
})

const Payroll = mongoose.model('Payroll', payrollSchema)
export default Payroll
