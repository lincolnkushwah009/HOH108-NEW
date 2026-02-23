import express from 'express'
import { sendTemplateMessage, sendFreeFormMessage } from '../utils/whatsappService.js'
import {
  protect,
  setCompanyContext,
  requirePermission,
  companyScopedQuery,
  PERMISSIONS
} from '../middleware/rbac.js'

const router = express.Router()

// =============================================
// DELIVERY WEBHOOK (no auth - must be before auth middleware)
// =============================================

// WhatsApp delivery status webhook
router.post('/webhook', (req, res) => {
  try {
    const payload = req.body

    // Log the delivery status for debugging / future persistence
    console.log('[WhatsApp Webhook] Delivery status received:', JSON.stringify(payload, null, 2))

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ success: true, message: 'Webhook received' })
  } catch (error) {
    // Still return 200 so the provider does not retry endlessly
    console.error('[WhatsApp Webhook] Error processing webhook:', error.message)
    res.status(200).json({ success: true, message: 'Webhook received' })
  }
})

// =============================================
// AUTHENTICATED ROUTES
// =============================================

router.use(protect)
router.use(setCompanyContext)

// Send template message
router.post('/send-template', async (req, res) => {
  try {
    const { to, templateName, params } = req.body

    if (!to || !templateName) {
      return res.status(400).json({
        success: false,
        message: 'to (phone number) and templateName are required'
      })
    }

    const result = await sendTemplateMessage(to, templateName, params || {})

    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: result.error || 'Failed to send WhatsApp template message'
      })
    }

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        to,
        templateName,
        sentBy: req.user._id,
        sentAt: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// Send freeform message
router.post('/send-message', async (req, res) => {
  try {
    const { to, message } = req.body

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        message: 'to (phone number) and message are required'
      })
    }

    const result = await sendFreeFormMessage(to, message)

    if (!result.success) {
      return res.status(502).json({
        success: false,
        message: result.error || 'Failed to send WhatsApp message'
      })
    }

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        to,
        sentBy: req.user._id,
        sentAt: new Date()
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
