import crypto from 'crypto'

/**
 * PhonePe Payment Gateway Integration
 * Uses PhonePe Standard Checkout (PG) APIs
 * Docs: https://developer.phonepe.com/v1/reference/pay-api
 */

const PHONEPE_CONFIG = {
  merchantId: process.env.PHONEPE_MERCHANT_ID || '',
  saltKey: process.env.PHONEPE_SALT_KEY || '',
  saltIndex: process.env.PHONEPE_SALT_INDEX || '1',
  // Use UAT for testing, production URL for live
  baseUrl: process.env.PHONEPE_ENV === 'production'
    ? 'https://api.phonepe.com/apis/hermes'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  callbackUrl: process.env.PHONEPE_CALLBACK_URL || 'https://hoh108.com/api/customer-portal/payment/callback',
  redirectUrl: process.env.PHONEPE_REDIRECT_URL || 'https://hoh108.com/login',
}

/**
 * Generate SHA256 checksum for PhonePe API
 */
function generateChecksum(payload, endpoint) {
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64')
  const string = base64Payload + endpoint + PHONEPE_CONFIG.saltKey
  const sha256 = crypto.createHash('sha256').update(string).digest('hex')
  return {
    base64Payload,
    checksum: sha256 + '###' + PHONEPE_CONFIG.saltIndex
  }
}

/**
 * Verify callback checksum from PhonePe
 */
export function verifyChecksum(responseBase64, receivedChecksum) {
  const string = responseBase64 + PHONEPE_CONFIG.saltKey
  const sha256 = crypto.createHash('sha256').update(string).digest('hex')
  const expectedChecksum = sha256 + '###' + PHONEPE_CONFIG.saltIndex
  return expectedChecksum === receivedChecksum
}

/**
 * Initiate a payment via PhonePe Standard Checkout
 * @param {object} opts
 * @param {string} opts.merchantTransactionId - Unique transaction ID (e.g., PM-projectId-milestoneId-timestamp)
 * @param {number} opts.amount - Amount in RUPEES (will be converted to paise)
 * @param {string} opts.customerName - Customer name
 * @param {string} opts.customerPhone - Customer mobile number
 * @param {string} opts.customerEmail - Customer email
 * @param {string} opts.purpose - Payment purpose description
 * @returns {object} { success, paymentUrl, merchantTransactionId }
 */
export async function initiatePayment(opts) {
  try {
    if (!PHONEPE_CONFIG.merchantId || !PHONEPE_CONFIG.saltKey) {
      console.warn('PhonePe not configured. Set PHONEPE_MERCHANT_ID and PHONEPE_SALT_KEY in .env')
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
      merchantId: PHONEPE_CONFIG.merchantId,
      merchantTransactionId,
      merchantUserId: `CUST_${customerPhone}`,
      amount: Math.round(amount * 100), // Convert to paise
      redirectUrl: `${PHONEPE_CONFIG.redirectUrl}?txnId=${merchantTransactionId}&status=success`,
      redirectMode: 'REDIRECT',
      callbackUrl: PHONEPE_CONFIG.callbackUrl,
      mobileNumber: customerPhone,
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    }

    const endpoint = '/pg/v1/pay'
    const { base64Payload, checksum } = generateChecksum(payload, endpoint)

    const response = await fetch(`${PHONEPE_CONFIG.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_CONFIG.merchantId
      },
      body: JSON.stringify({ request: base64Payload })
    })

    const data = await response.json()

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
 * Check payment status
 * @param {string} merchantTransactionId
 * @returns {object} Payment status details
 */
export async function checkPaymentStatus(merchantTransactionId) {
  try {
    if (!PHONEPE_CONFIG.merchantId || !PHONEPE_CONFIG.saltKey) {
      return { success: false, message: 'Payment gateway not configured' }
    }

    const endpoint = `/pg/v1/status/${PHONEPE_CONFIG.merchantId}/${merchantTransactionId}`
    const string = endpoint + PHONEPE_CONFIG.saltKey
    const sha256 = crypto.createHash('sha256').update(string).digest('hex')
    const checksum = sha256 + '###' + PHONEPE_CONFIG.saltIndex

    const response = await fetch(`${PHONEPE_CONFIG.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': PHONEPE_CONFIG.merchantId
      }
    })

    const data = await response.json()

    return {
      success: data.success,
      code: data.code,
      state: data.data?.state, // COMPLETED, PENDING, FAILED
      amount: data.data?.amount ? data.data.amount / 100 : 0, // Paise to rupees
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
 * Process refund
 */
export async function initiateRefund(opts) {
  try {
    if (!PHONEPE_CONFIG.merchantId || !PHONEPE_CONFIG.saltKey) {
      return { success: false, message: 'Payment gateway not configured' }
    }

    const { originalTransactionId, refundTransactionId, amount } = opts

    const payload = {
      merchantId: PHONEPE_CONFIG.merchantId,
      merchantUserId: 'SYSTEM',
      originalTransactionId,
      merchantTransactionId: refundTransactionId,
      amount: Math.round(amount * 100),
      callbackUrl: PHONEPE_CONFIG.callbackUrl
    }

    const endpoint = '/pg/v1/refund'
    const { base64Payload, checksum } = generateChecksum(payload, endpoint)

    const response = await fetch(`${PHONEPE_CONFIG.baseUrl}${endpoint}`, {
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
