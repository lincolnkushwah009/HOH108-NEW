import mongoose from 'mongoose';

const gameEntrySchema = new mongoose.Schema({
  // Participant Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },

  // Game Details
  gameName: {
    type: String,
    default: 'GOD IS KIND Spin & Win'
  },
  spinsUsed: {
    type: Number,
    default: 1,
    min: 1,
    max: 3
  },
  prize: {
    type: String,
    default: 'Free T-Shirt'
  },

  // Review/Feedback
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },

  // Prize Status
  prizeStatus: {
    type: String,
    enum: ['pending', 'claimed', 'delivered', 'cancelled'],
    default: 'pending'
  },
  claimedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },

  // Notes from admin
  adminNotes: {
    type: String,
    trim: true
  },

  // Campaign/Location tracking
  campaign: {
    type: String,
    default: 'Street Marketing'
  },
  location: {
    type: String,
    trim: true
  },

  // Device info (for analytics)
  deviceInfo: {
    userAgent: String,
    platform: String,
    screenSize: String
  },

  // Company reference (for multi-tenant)
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }
}, {
  timestamps: true
});

// Index for quick lookups
gameEntrySchema.index({ phone: 1 });
gameEntrySchema.index({ createdAt: -1 });
gameEntrySchema.index({ prizeStatus: 1 });
gameEntrySchema.index({ company: 1 });

// Virtual for formatted date
gameEntrySchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Static method to get stats
gameEntrySchema.statics.getStats = async function(companyId = null) {
  const matchStage = companyId ? { company: companyId } : {};

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        pendingPrizes: {
          $sum: { $cond: [{ $eq: ['$prizeStatus', 'pending'] }, 1, 0] }
        },
        claimedPrizes: {
          $sum: { $cond: [{ $eq: ['$prizeStatus', 'claimed'] }, 1, 0] }
        },
        deliveredPrizes: {
          $sum: { $cond: [{ $eq: ['$prizeStatus', 'delivered'] }, 1, 0] }
        },
        avgRating: { $avg: '$rating' },
        avgSpins: { $avg: '$spinsUsed' }
      }
    }
  ]);

  return stats[0] || {
    totalEntries: 0,
    pendingPrizes: 0,
    claimedPrizes: 0,
    deliveredPrizes: 0,
    avgRating: 0,
    avgSpins: 0
  };
};

// Instance method to claim prize
gameEntrySchema.methods.claimPrize = function() {
  this.prizeStatus = 'claimed';
  this.claimedAt = new Date();
  return this.save();
};

// Instance method to mark as delivered
gameEntrySchema.methods.markDelivered = function() {
  this.prizeStatus = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

export default mongoose.model('GameEntry', gameEntrySchema);
