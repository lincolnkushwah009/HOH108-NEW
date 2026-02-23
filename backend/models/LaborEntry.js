import mongoose from 'mongoose'

/**
 * Labor Entry - Track labor hours and productivity
 * FR-PPC-005: Track Labor Hours, Skills, and Productivity
 */

const laborEntrySchema = new mongoose.Schema({
  // System generated ID: LAB-YYYY-MM-XXXXX
  entryId: {
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

  // Work Order Reference
  workOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder',
    required: true,
    index: true
  },

  workOrderId: String,

  // Project Reference
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },

  // Employee Details
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  employeeDetails: {
    userId: String,
    name: String,
    designation: String,
    department: String,
    skillType: {
      type: String,
      enum: ['carpenter', 'electrician', 'plumber', 'painter', 'mason', 'welder', 'fabricator', 'supervisor', 'helper', 'other'],
      default: 'other'
    },
    skillLevel: {
      type: String,
      enum: ['unskilled', 'semi_skilled', 'skilled', 'highly_skilled', 'expert'],
      default: 'skilled'
    }
  },

  // Date & Time
  entryDate: {
    type: Date,
    required: true,
    index: true
  },

  timeIn: Date,
  timeOut: Date,

  // Hours
  hours: {
    regular: {
      type: Number,
      default: 0,
      min: 0
    },
    overtime: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Break time in minutes
  breakTime: {
    type: Number,
    default: 0,
    min: 0
  },

  // Rates
  rates: {
    regularRate: {
      type: Number,
      default: 0,
      min: 0
    },
    overtimeRate: {
      type: Number,
      default: 0,
      min: 0
    },
    rateType: {
      type: String,
      enum: ['hourly', 'daily', 'monthly'],
      default: 'daily'
    }
  },

  // Cost Calculation
  cost: {
    regularCost: {
      type: Number,
      default: 0
    },
    overtimeCost: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    }
  },

  // Activity Details
  activity: {
    name: String,
    description: String,
    category: {
      type: String,
      enum: ['production', 'assembly', 'installation', 'finishing', 'quality_check', 'maintenance', 'other'],
      default: 'production'
    }
  },

  // Location
  location: {
    type: {
      type: String,
      enum: ['factory', 'site', 'warehouse', 'office'],
      default: 'factory'
    },
    name: String,
    code: String
  },

  // Productivity Metrics
  productivity: {
    unitsProduced: {
      type: Number,
      default: 0
    },
    targetUnits: {
      type: Number,
      default: 0
    },
    efficiency: {
      type: Number,
      default: 0, // (unitsProduced / targetUnits) * 100
      min: 0
    },
    qualityScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },

  // Attendance
  attendance: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'leave', 'holiday'],
    default: 'present'
  },

  // Labor Type
  laborType: {
    type: String,
    enum: ['permanent', 'contract', 'daily_wage', 'vendor'],
    default: 'permanent'
  },

  // Vendor/Contractor (if external labor)
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },

  vendorName: String,

  // Approval
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  approvedByName: String,
  approvedAt: Date,
  rejectionReason: String,

  // Recorded By
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  recordedByName: String,

  // Notes
  notes: String,
  supervisorRemarks: String,

  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'paid'],
    default: 'draft',
    index: true
  },

  // Linked to payroll
  payrollLinked: {
    type: Boolean,
    default: false
  },

  payrollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payroll'
  }
}, {
  timestamps: true
})

// Generate Entry ID
laborEntrySchema.pre('save', async function(next) {
  if (!this.entryId) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')

    const count = await this.constructor.countDocuments({
      company: this.company,
      createdAt: {
        $gte: new Date(year, now.getMonth(), 1),
        $lt: new Date(year, now.getMonth() + 1, 1)
      }
    })

    this.entryId = `LAB-${year}-${month}-${String(count + 1).padStart(5, '0')}`
  }
  next()
})

// Calculate hours and costs
laborEntrySchema.pre('save', function(next) {
  // Calculate total hours
  this.hours.total = this.hours.regular + this.hours.overtime

  // Calculate costs based on rate type
  if (this.rates.rateType === 'hourly') {
    this.cost.regularCost = this.hours.regular * this.rates.regularRate
    this.cost.overtimeCost = this.hours.overtime * this.rates.overtimeRate
  } else if (this.rates.rateType === 'daily') {
    // Assume 8 hours = 1 day
    this.cost.regularCost = (this.hours.regular / 8) * this.rates.regularRate
    this.cost.overtimeCost = this.hours.overtime * (this.rates.overtimeRate || this.rates.regularRate * 1.5 / 8)
  }

  this.cost.totalCost = this.cost.regularCost + this.cost.overtimeCost

  // Calculate productivity efficiency
  if (this.productivity.targetUnits > 0) {
    this.productivity.efficiency = (this.productivity.unitsProduced / this.productivity.targetUnits) * 100
  }

  next()
})

// Static method to get labor summary by work order
laborEntrySchema.statics.getWorkOrderSummary = async function(workOrderId) {
  const summary = await this.aggregate([
    { $match: { workOrder: new mongoose.Types.ObjectId(workOrderId), status: { $ne: 'rejected' } } },
    {
      $group: {
        _id: '$employee',
        employeeName: { $first: '$employeeDetails.name' },
        skillType: { $first: '$employeeDetails.skillType' },
        totalRegularHours: { $sum: '$hours.regular' },
        totalOvertimeHours: { $sum: '$hours.overtime' },
        totalHours: { $sum: '$hours.total' },
        totalCost: { $sum: '$cost.totalCost' },
        daysWorked: { $sum: 1 },
        avgEfficiency: { $avg: '$productivity.efficiency' }
      }
    },
    { $sort: { totalCost: -1 } }
  ])

  const totals = await this.aggregate([
    { $match: { workOrder: new mongoose.Types.ObjectId(workOrderId), status: { $ne: 'rejected' } } },
    {
      $group: {
        _id: null,
        totalRegularHours: { $sum: '$hours.regular' },
        totalOvertimeHours: { $sum: '$hours.overtime' },
        totalHours: { $sum: '$hours.total' },
        totalRegularCost: { $sum: '$cost.regularCost' },
        totalOvertimeCost: { $sum: '$cost.overtimeCost' },
        totalCost: { $sum: '$cost.totalCost' },
        uniqueWorkers: { $addToSet: '$employee' },
        avgEfficiency: { $avg: '$productivity.efficiency' }
      }
    },
    {
      $project: {
        totalRegularHours: 1,
        totalOvertimeHours: 1,
        totalHours: 1,
        totalRegularCost: 1,
        totalOvertimeCost: 1,
        totalCost: 1,
        workerCount: { $size: '$uniqueWorkers' },
        avgEfficiency: 1
      }
    }
  ])

  const bySkillType = await this.aggregate([
    { $match: { workOrder: new mongoose.Types.ObjectId(workOrderId), status: { $ne: 'rejected' } } },
    {
      $group: {
        _id: '$employeeDetails.skillType',
        totalHours: { $sum: '$hours.total' },
        totalCost: { $sum: '$cost.totalCost' },
        workerCount: { $addToSet: '$employee' }
      }
    },
    {
      $project: {
        skillType: '$_id',
        totalHours: 1,
        totalCost: 1,
        workerCount: { $size: '$workerCount' }
      }
    }
  ])

  return {
    byEmployee: summary,
    bySkillType,
    totals: totals[0] || {
      totalRegularHours: 0,
      totalOvertimeHours: 0,
      totalHours: 0,
      totalCost: 0,
      workerCount: 0,
      avgEfficiency: 0
    }
  }
}

// Static method to get daily labor report
laborEntrySchema.statics.getDailyReport = async function(companyId, date, projectId = null) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const match = {
    company: new mongoose.Types.ObjectId(companyId),
    entryDate: { $gte: startOfDay, $lte: endOfDay }
  }

  if (projectId) {
    match.project = new mongoose.Types.ObjectId(projectId)
  }

  const report = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          project: '$project',
          workOrder: '$workOrder'
        },
        workers: { $addToSet: '$employee' },
        totalHours: { $sum: '$hours.total' },
        totalCost: { $sum: '$cost.totalCost' },
        entries: { $push: '$$ROOT' }
      }
    },
    {
      $lookup: {
        from: 'projects',
        localField: '_id.project',
        foreignField: '_id',
        as: 'projectInfo'
      }
    },
    {
      $lookup: {
        from: 'workorders',
        localField: '_id.workOrder',
        foreignField: '_id',
        as: 'workOrderInfo'
      }
    },
    {
      $project: {
        project: { $arrayElemAt: ['$projectInfo', 0] },
        workOrder: { $arrayElemAt: ['$workOrderInfo', 0] },
        workerCount: { $size: '$workers' },
        totalHours: 1,
        totalCost: 1,
        entries: 1
      }
    }
  ])

  return report
}

// Indexes
laborEntrySchema.index({ company: 1, entryDate: -1 })
laborEntrySchema.index({ company: 1, employee: 1, entryDate: -1 })
laborEntrySchema.index({ company: 1, workOrder: 1 })
laborEntrySchema.index({ company: 1, project: 1 })
laborEntrySchema.index({ employee: 1, entryDate: -1 })

export default mongoose.model('LaborEntry', laborEntrySchema)
