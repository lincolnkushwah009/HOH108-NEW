import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema({
  // Employee
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Company
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },

  // Date
  date: {
    type: Date,
    required: true,
    index: true
  },

  // Status
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'late', 'on-leave', 'holiday', 'weekend', 'work-from-home'],
    default: 'present'
  },

  // Check-in/Check-out
  checkIn: {
    time: Date,
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    method: {
      type: String,
      enum: ['manual', 'biometric', 'geo-fence', 'qr-code', 'app'],
      default: 'manual'
    },
    deviceInfo: String,
    ipAddress: String
  },

  checkOut: {
    time: Date,
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    method: {
      type: String,
      enum: ['manual', 'biometric', 'geo-fence', 'qr-code', 'app'],
      default: 'manual'
    },
    deviceInfo: String,
    ipAddress: String
  },

  // Breaks
  breaks: [{
    startTime: Date,
    endTime: Date,
    type: {
      type: String,
      enum: ['lunch', 'tea', 'personal', 'other'],
      default: 'lunch'
    },
    duration: Number // minutes
  }],

  // Work Hours
  workHours: {
    scheduled: { type: Number, default: 9 }, // hours
    actual: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    undertime: { type: Number, default: 0 },
    breakTime: { type: Number, default: 0 }
  },

  // Late/Early
  lateBy: {
    type: Number, // minutes
    default: 0
  },

  earlyLeaveBy: {
    type: Number, // minutes
    default: 0
  },

  // Leave Reference (if on leave)
  leaveRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave'
  },

  // Regularization
  regularization: {
    isRegularized: { type: Boolean, default: false },
    reason: String,
    requestedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },

  // Notes
  notes: String,

  // Audit
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Compound index for unique attendance per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true })
attendanceSchema.index({ company: 1, date: 1 })
attendanceSchema.index({ company: 1, employee: 1, date: 1 })

// Calculate work hours before save
attendanceSchema.pre('save', function(next) {
  if (this.checkIn?.time && this.checkOut?.time) {
    const checkInTime = new Date(this.checkIn.time)
    const checkOutTime = new Date(this.checkOut.time)

    // Calculate total minutes
    let totalMinutes = (checkOutTime - checkInTime) / (1000 * 60)

    // Subtract break time
    let breakMinutes = 0
    if (this.breaks && this.breaks.length > 0) {
      breakMinutes = this.breaks.reduce((total, b) => {
        if (b.startTime && b.endTime) {
          return total + ((new Date(b.endTime) - new Date(b.startTime)) / (1000 * 60))
        }
        return total + (b.duration || 0)
      }, 0)
    }

    totalMinutes -= breakMinutes

    // Convert to hours
    const actualHours = Math.max(0, totalMinutes / 60)
    const scheduledHours = this.workHours.scheduled || 9

    this.workHours.actual = Math.round(actualHours * 100) / 100
    this.workHours.breakTime = Math.round(breakMinutes)
    this.workHours.overtime = actualHours > scheduledHours ? Math.round((actualHours - scheduledHours) * 100) / 100 : 0
    this.workHours.undertime = actualHours < scheduledHours ? Math.round((scheduledHours - actualHours) * 100) / 100 : 0
  }

  next()
})

// Static method to get attendance summary for a period
attendanceSchema.statics.getSummary = async function(employeeId, startDate, endDate) {
  const records = await this.find({
    employee: employeeId,
    date: { $gte: startDate, $lte: endDate }
  })

  const summary = {
    totalDays: records.length,
    present: 0,
    absent: 0,
    halfDay: 0,
    late: 0,
    onLeave: 0,
    workFromHome: 0,
    totalWorkHours: 0,
    totalOvertime: 0,
    averageWorkHours: 0
  }

  records.forEach(record => {
    switch (record.status) {
      case 'present': summary.present++; break
      case 'absent': summary.absent++; break
      case 'half-day': summary.halfDay++; break
      case 'late': summary.late++; summary.present++; break
      case 'on-leave': summary.onLeave++; break
      case 'work-from-home': summary.workFromHome++; summary.present++; break
    }
    summary.totalWorkHours += record.workHours?.actual || 0
    summary.totalOvertime += record.workHours?.overtime || 0
  })

  summary.averageWorkHours = summary.present > 0
    ? Math.round((summary.totalWorkHours / summary.present) * 100) / 100
    : 0

  return summary
}

export default mongoose.model('Attendance', attendanceSchema)
