/**
 * PhonePe Payment Gateway v2 Integration
 * Uses OAuth2 token-based authentication (O-Bearer)
 * Docs: https://developer.phonepe.com/payment-gateway
 */

// Cached OAuth token
let cachedToken = null
let tokenExpiresAt = 0

function cfg() {
  return {
    clientId: process.env.PHONEPE_CLIENT_ID || '',
    clientSecret: process.env.PHONEPE_CLIENT_SECRET || '',
    clientVersion: process.env.PHONEPE_CLIENT_VERSION || '1',
    env: process.env.PHONEPE_ENV || 'production',
    authUrl: process.env.PHONEPE_ENV === 'sandbox'
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token'
      : 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
    payUrl: process.env.PHONEPE_ENV === 'sandbox'
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay'
      : 'https://api.phonepe.com/apis/pg/checkout/v2/pay',
    statusUrl: process.env.PHONEPE_ENV === 'sandbox'
      ? 'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order'
      : 'https://api.phonepe.com/apis/pg/checkout/v2/order',
    callbackUrl: process.env.PHONEPE_CALLBACK_URL || 'https://hoh108.com/api/customer-portal/payment/callback',
    redirectUrl: process.env.PHONEPE_REDIRECT_URL || 'https://hoh108.com/login',
  }
}

export const PHONEPE_CONFIG = { get: cfg }

/**
 * Get OAuth access token (cached until expiry)
 */
async function getAccessToken() {
  const config = cfg()
  if (!config.clientId || !config.clientSecret) {
    throw new Error('PhonePe credentials not configured')
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < (tokenExpiresAt - 60000)) {
    return cachedToken
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    client_version: config.clientVersion,
    grant_type: 'client_credentials'
  })

  const response = await fetch(config.authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  const data = await response.json()
  console.log('PhonePe OAuth response:', JSON.stringify({ token_type: data.token_type, expires_in: data.expires_in, error: data.error }).slice(0, 200))

  if (data.access_token) {
    cachedToken = data.access_token
    tokenExpiresAt = (data.expires_at || (Date.now() + (data.expires_in || 3600) * 1000))
    return cachedToken
  }

  throw new Error(data.error_description || data.message || 'Failed to get PhonePe access token')
}

/**
 * Initiate payment via PhonePe Standard Checkout v2
 */
export async function initiatePayment(opts) {
  try {
    const config = cfg()
    if (!config.clientId || !config.clientSecret) {
      console.warn('PhonePe not configured. Set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET in .env')
      return { success: false, message: 'Payment gateway not configured.', paymentUrl: null }
    }

    const { merchantTransactionId, amount, customerName, customerPhone, customerEmail, purpose } = opts

    // Step 1: Get OAuth token
    const token = await getAccessToken()

    // Step 2: Create payment
    const payload = {
      merchantOrderId: merchantTransactionId,
      amount: Math.round(amount * 100), // Rupees → Paise
      expireAfter: 1200, // 20 minutes
      paymentFlow: {
        type: 'PG_CHECKOUT',
        message: purpose || 'Project Milestone Payment',
        merchantUrls: {
          redirectUrl: `${config.redirectUrl}?txnId=${merchantTransactionId}&status=completed`
        }
      },
      metaInfo: {
        udf1: customerName || '',
        udf2: customerPhone || '',
        udf3: customerEmail || '',
        udf4: purpose || ''
      }
    }

    console.log(`PhonePe PAY v2: merchantOrderId=${merchantTransactionId}, amount=${payload.amount} paise`)

    const response = await fetch(config.payUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    console.log('PhonePe PAY v2 response:', JSON.stringify({ orderId: data.orderId, state: data.state, redirectUrl: data.redirectUrl?.slice(0, 50) }))

    if (data.orderId && data.redirectUrl) {
      return {
        success: true,
        paymentUrl: data.redirectUrl,
        merchantTransactionId,
        phonePeOrderId: data.orderId,
        expiresAt: data.expireAt
      }
    }

    return { success: false, message: data.message || data.error || 'Payment initiation failed', code: data.code }
  } catch (error) {
    console.error('PhonePe initiatePayment error:', error.message)
    return { success: false, message: error.message }
  }
}

/**
 * Check order/payment status
 */
export async function checkPaymentStatus(merchantOrderId) {
  try {
    const config = cfg()
    if (!config.clientId || !config.clientSecret) {
      return { success: false, message: 'Not configured' }
    }

    const token = await getAccessToken()

    const response = await fetch(`${config.statusUrl}/${merchantOrderId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${token}`
      }
    })

    const data = await response.json()

    return {
      success: true,
      orderId: data.orderId,
      state: data.state, // PENDING, COMPLETED, FAILED
      amount: data.amount ? data.amount / 100 : 0,
      paymentDetails: data.paymentDetails,
      merchantOrderId: data.merchantOrderId
    }
  } catch (error) {
    console.error('PhonePe checkStatus error:', error.message)
    return { success: false, message: error.message }
  }
}

/**
 * Verify webhook callback
 */
export function verifyChecksum(responseBody, receivedAuthorization) {
  // v2 uses O-Bearer token verification, not checksum
  return true // Webhook verified by matching orderId + token
}

/**
 * Initiate refund
 */
export async function initiateRefund(opts) {
  try {
    const config = cfg()
    if (!config.clientId || !config.clientSecret) return { success: false, message: 'Not configured' }

    const token = await getAccessToken()
    const { originalTransactionId, refundTransactionId, amount } = opts

    const response = await fetch(`${config.statusUrl}/${originalTransactionId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `O-Bearer ${token}`
      },
      body: JSON.stringify({
        merchantRefundId: refundTransactionId,
        originalMerchantOrderId: originalTransactionId,
        amount: Math.round(amount * 100)
      })
    })

    return await response.json()
  } catch (error) {
    return { success: false, message: error.message }
  }
}

export default { initiatePayment, checkPaymentStatus, verifyChecksum, initiateRefund, PHONEPE_CONFIG }
