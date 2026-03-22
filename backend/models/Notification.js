import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },

  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Content
  type: {
    type: String,
    enum: ['alert', 'reminder', 'info', 'success', 'warning', 'error'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['lead', 'customer', 'project', 'system', 'performance', 'approval', 'assignment', 'escalation'],
    default: 'system'
  },

  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },

  // Related Entity
  entityType: {
    type: String,
    enum: ['lead', 'customer', 'project', 'user', 'alert', 'report']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  actionUrl: String,

  // Source (what generated this notification)
  sourceAlert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  },
  sourceAutomation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AutomationRule'
  },

  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,

  // Delivery Channels
  channels: {
    inApp: {
      sent: { type: Boolean, default: true },
      sentAt: { type: Date, default: Date.now }
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: Boolean,
      openedAt: Date
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: Boolean,
      clickedAt: Date
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: Boolean
    }
  },

  // Metadata
  metadata: mongoose.Schema.Types.Mixed,

  // Timing
  expiresAt: Date
}, {
  timestamps: true
})

// Generate notificationId before save
notificationSchema.pre('save', async function(next) {
  if (!this.notificationId) {
    const count = await mongoose.model('Notification').countDocuments()
    this.notificationId = `NTF-${Date.now()}-${String(count + 1).padStart(6, '0')}`
  }
  next()
})

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, category: 1, createdAt: -1 })
notificationSchema.index({ company: 1, createdAt: -1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  })
}

// Static method to mark all as read
notificationSchema.statics.markAllRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  )
}

// Static method to create notification
notificationSchema.statics.createNotification = async function({
  company,
  recipient,
  type = 'info',
  category = 'system',
  title,
  message,
  entityType,
  entityId,
  actionUrl,
  sourceAlert,
  sourceAutomation,
  metadata,
  expiresInDays = 30
}) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const doc = await this.create({
    company,
    recipient,
    type,
    category,
    title,
    message,
    entityType,
    entityId,
    actionUrl: actionUrl || (entityType && entityId ? `/admin/${entityType}s/${entityId}` : null),
    sourceAlert,
    sourceAutomation,
    metadata,
    expiresAt
  })

  // Push real-time via Socket.IO
  try {
    const { emitToUser } = await import('../utils/socketService.js')
    emitToUser(recipient.toString(), 'notification', doc.toObject())
  } catch (e) {
    // Socket not available
  }

  return doc
}

// Static method to notify multiple users
notificationSchema.statics.notifyUsers = async function(userIds, notificationData) {
  const now = Date.now()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const notifications = userIds.map((userId, i) => ({
    ...notificationData,
    recipient: userId,
    notificationId: `NTF-${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    expiresAt
  }))

  const docs = await this.insertMany(notifications)

  // Push real-time via Socket.IO
  try {
    const { emitToUser } = await import('../utils/socketService.js')
    for (const doc of docs) {
      emitToUser(doc.recipient.toString(), 'notification', doc.toObject())
    }
  } catch (e) {
    // Socket not available — notifications still saved in DB
  }

  return docs
}

// Instance method to mark as read
notificationSchema.methods.markRead = async function() {
  this.isRead = true
  this.readAt = new Date()
  return this.save()
}

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
