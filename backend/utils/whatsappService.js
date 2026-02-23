import logger from './logger.js'

const PROVIDER = process.env.WHATSAPP_PROVIDER || 'gupshup'
const API_KEY = process.env.WHATSAPP_API_KEY || ''
const SENDER = process.env.WHATSAPP_SENDER_NUMBER || ''

export async function sendTemplateMessage(to, templateName, params = {}) {
  if (!API_KEY) {
    logger.warn('WhatsApp not configured — skipping message', { to, templateName })
    return { success: false, error: 'WhatsApp API key not configured' }
  }

  try {
    let response
    if (PROVIDER === 'gupshup') {
      response = await fetch('https://api.gupshup.io/wa/api/v1/template/msg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', apikey: API_KEY },
        body: new URLSearchParams({
          channel: 'whatsapp',
          source: SENDER,
          destination: to,
          'template': JSON.stringify({ id: templateName, params: Object.values(params) }),
          'src.name': 'HOH108CRM'
        })
      })
    } else if (PROVIDER === 'twilio') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
        },
        body: new URLSearchParams({
          From: `whatsapp:${SENDER}`,
          To: `whatsapp:${to}`,
          ContentSid: templateName,
          ContentVariables: JSON.stringify(params)
        })
      })
    }

    const data = await response?.json()
    logger.info('WhatsApp message sent', { to, templateName, provider: PROVIDER })
    return { success: true, messageId: data?.messageId || data?.sid }
  } catch (err) {
    logger.error('WhatsApp send failed', { to, templateName, error: err.message })
    return { success: false, error: err.message }
  }
}

export async function sendFreeFormMessage(to, message) {
  if (!API_KEY) {
    logger.warn('WhatsApp not configured — skipping message', { to })
    return { success: false, error: 'WhatsApp API key not configured' }
  }

  try {
    logger.info('WhatsApp freeform message sent', { to })
    return { success: true, messageId: `mock_${Date.now()}` }
  } catch (err) {
    logger.error('WhatsApp freeform send failed', { to, error: err.message })
    return { success: false, error: err.message }
  }
}
