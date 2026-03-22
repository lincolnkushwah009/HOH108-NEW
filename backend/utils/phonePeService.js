import crypto from 'crypto'

/**
 * PhonePe Payment Gateway Integration - PG v2 API
 * Uses Client ID + Client Secret + Client Version (new format)
 * Docs: https://developer.phonepe.com/v1/reference/pay-api-1
 */

// Returns config at call time (after dotenv.config() in server.js)
function cfg() {
  return {
    clientId: process.env.PHONEPE_CLIENT_ID || '',
    clientSecret: process.env.PHONEPE_CLIENT_SECRET || '',
    clientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
    baseUrl: process.env.PHONEPE_ENV === 'production'
      ? 'https://api.phonepe.com/apis/hermes'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox',
    callbackUrl: process.env.PHONEPE_CALLBACK_URL || 'https://hoh108.com/api/customer-portal/payment/callback',
    redirectUrl: process.env.PHONEPE_REDIRECT_URL || 'https://hoh108.com/login',
  }
}
// Alias for export
const PHONEPE_CONFIG = { get: cfg }

/**
 * Generate X-VERIFY header for PhonePe PG v2
 * Format: SHA256(base64Payload + endpoint + clientSecret) + ### + clientVersion
 */
function generateChecksum(base64Payload, endpoint) {
  const string = base64Payload + endpoint + cfg().clientSecret
  const sha256 = crypto.createHash('sha256').update(string).digest('hex')
  return sha256 + '###' + cfg().clientVersion
}

/**
 * Generate checksum for status check (GET)
 * Format: SHA256(endpoint + clientSecret) + ### + clientVersion
 */
function generateStatusChecksum(endpoint) {
  const string = endpoint + cfg().clientSecret
  const sha256 = crypto.createHash('sha256').update(string).digest('hex')
  return sha256 + '###' + cfg().clientVersion
}

/**
 * Verify callback checksum from PhonePe
 */
export function verifyChecksum(responseBase64, receivedChecksum) {
  const string = responseBase64 + '/pg/v1/status' + cfg().clientSecret
  const sha256 = crypto.createHash('sha256').update(string).digest('hex')
  const expected = sha256 + '###' + cfg().clientVersion
  return expected === receivedChecksum
}

/**
 * Initiate a payment via PhonePe Standard Checkout (PG v2)
 */
export async function initiatePayment(opts) {
  try {
    if (!cfg().clientId || !cfg().clientSecret) {
      console.warn('PhonePe not configured. Set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in .env')
      return {
        success: false,
        message: 'Payment gateway not configured. Contact admin.',
        testMode: true,
        paymentUrl: null
      }
    }

    const {
      merchantTransactionId,
      amount,
      customerName,
      customerPhone,
      customerEmail,
      purpose
    } = opts

    const payload = {
      merchantId: cfg().clientId,
      merchantTransactionId,
      merchantUserId: `CUST_${customerPhone}`,
      amount: Math.round(amount * 100), // Rupees to Paise
      redirectUrl: `${cfg().redirectUrl}?txnId=${merchantTransactionId}&status=success`,
      redirectMode: 'REDIRECT',
      callbackUrl: cfg().callbackUrl,
      mobileNumber: customerPhone,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    }

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64')
    const endpoint = '/pg/v1/pay'
    const checksum = generateChecksum(base64Payload, endpoint)

    const response = await fetch(`${cfg().baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': cfg().clientId
      },
      body: JSON.stringify({ request: base64Payload })
    })

    const data = await response.json()
    console.log('PhonePe API response:', JSON.stringify({ success: data.success, code: data.code, message: data.message }).slice(0, 200))

    if (data.success && data.data?.instrumentResponse?.redirectInfo?.url) {
      return {
        success: true,
        paymentUrl: data.data.instrumentResponse.redirectInfo.url,
        merchantTransactionId,
        phonePeTransactionId: data.data.transactionId
      }
    }

    return {
      success: false,
      message: data.message || 'Failed to initiate payment',
      code: data.code
    }
  } catch (error) {
    console.error('PhonePe initiatePayment error:', error.message)
    return { success: false, message: error.message }
  }
}

/**
 * Check payment status (PG v2)
 */
export async function checkPaymentStatus(merchantTransactionId) {
  try {
    if (!cfg().clientId || !cfg().clientSecret) {
      return { success: false, message: 'Payment gateway not configured' }
    }

    const endpoint = `/pg/v1/status/${cfg().clientId}/${merchantTransactionId}`
    const checksum = generateStatusChecksum(endpoint)

    const response = await fetch(`${cfg().baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': cfg().clientId
      }
    })

    const data = await response.json()

    return {
      success: data.success,
      code: data.code,
      state: data.data?.state, // COMPLETED, PENDING, FAILED
      amount: data.data?.amount ? data.data.amount / 100 : 0,
      transactionId: data.data?.transactionId,
      merchantTransactionId: data.data?.merchantTransactionId,
      paymentInstrument: data.data?.paymentInstrument,
      responseCode: data.data?.responseCode
    }
  } catch (error) {
    console.error('PhonePe checkStatus error:', error.message)
    return { success: false, message: error.message }
  }
}

/**
 * Initiate refund (PG v2)
 */
export async function initiateRefund(opts) {
  try {
    if (!cfg().clientId || !cfg().clientSecret) {
      return { success: false, message: 'Payment gateway not configured' }
    }

    const { originalTransactionId, refundTransactionId, amount } = opts

    const payload = {
      merchantId: cfg().clientId,
      merchantUserId: 'SYSTEM',
      originalTransactionId,
      merchantTransactionId: refundTransactionId,
      amount: Math.round(amount * 100),
      callbackUrl: cfg().callbackUrl
    }

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64')
    const endpoint = '/pg/v1/refund'
    const checksum = generateChecksum(base64Payload, endpoint)

    const response = await fetch(`${cfg().baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      body: JSON.stringify({ request: base64Payload })
    })

    return await response.json()
  } catch (error) {
    return { success: false, message: error.message }
  }
}

export default {
  initiatePayment,
  checkPaymentStatus,
  verifyChecksum,
  initiateRefund,
  PHONEPE_CONFIG
}
