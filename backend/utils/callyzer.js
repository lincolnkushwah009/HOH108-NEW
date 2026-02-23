/**
 * Callyzer Integration Utility
 *
 * API v2.1 Documentation: https://developers.callyzer.co/
 *
 * Features:
 * - Sync call logs from Callyzer to CRM
 * - Fetch call recordings
 * - Real-time webhook handling
 */

// Default to production; override with CALLYZER_API_URL env var or pass apiUrl to constructor
const CALLYZER_API_BASE = process.env.CALLYZER_API_URL || 'https://sandbox.api.callyzer.co/api/v2.1'

class CallyzerService {
  constructor(apiToken, apiUrl) {
    this.apiToken = apiToken
    this.apiBase = apiUrl || CALLYZER_API_BASE
    this.headers = {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }

    // Rate limiting: 1 request per 2 seconds
    this.lastRequestTime = 0
    this.minRequestInterval = 2000
  }

  /**
   * Rate limit helper - ensures we don't exceed 1 request per 2 seconds
   */
  async waitForRateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()
  }

  /**
   * Make API request with rate limiting using native fetch
   * Note: All v2.1 endpoints use POST method
   */
  async request(endpoint, data = {}) {
    await this.waitForRateLimit()

    try {
      const url = `${this.apiBase}${endpoint}`

      const options = {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data)
      }

      const response = await fetch(url, options)
      const responseData = await response.json().catch(() => ({}))

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || `HTTP ${response.status}`,
          status: response.status
        }
      }

      return { success: true, data: responseData }
    } catch (error) {
      console.error(`Callyzer API Error [${endpoint}]:`, error.message)
      return {
        success: false,
        error: error.message,
        status: null
      }
    }
  }

  // ==================== CALL LOG APIs ====================

  /**
   * Get call log summary for date range
   * @param {Object} options - { startDate, endDate, empNumbers, callTypes }
   */
  async getCallLogSummary(options = {}) {
    const body = {
      call_from: options.startDate ? this.toUnixTimestamp(options.startDate) : this.getDefaultStartTimestamp(),
      call_to: options.endDate ? this.toEndOfDayTimestamp(options.endDate) : this.getDefaultEndTimestamp()
    }

    if (options.empNumbers) body.emp_numbers = options.empNumbers
    if (options.callTypes) body.call_types = options.callTypes

    return this.request('/call-log/summary', body)
  }

  /**
   * Get employee-wise call summary
   */
  async getEmployeeSummary(options = {}) {
    const body = {
      call_from: options.startDate ? this.toUnixTimestamp(options.startDate) : this.getDefaultStartTimestamp(),
      call_to: options.endDate ? this.toEndOfDayTimestamp(options.endDate) : this.getDefaultEndTimestamp(),
      page_no: options.page || 1,
      page_size: options.pageSize || 100
    }

    if (options.empNumbers) body.emp_numbers = options.empNumbers

    return this.request('/call-log/employee-summary', body)
  }

  /**
   * Get call analysis (top performers, averages)
   */
  async getCallAnalysis(options = {}) {
    const body = {
      call_from: options.startDate ? this.toUnixTimestamp(options.startDate) : this.getDefaultStartTimestamp(),
      call_to: options.endDate ? this.toEndOfDayTimestamp(options.endDate) : this.getDefaultEndTimestamp()
    }

    if (options.empNumbers) body.emp_numbers = options.empNumbers

    return this.request('/call-log/analysis', body)
  }

  /**
   * Get call history with detailed records
   */
  async getCallHistory(options = {}) {
    const body = {
      call_from: options.startDate ? this.toUnixTimestamp(options.startDate) : this.getDefaultStartTimestamp(),
      call_to: options.endDate ? this.toEndOfDayTimestamp(options.endDate) : this.getDefaultEndTimestamp(),
      page_no: options.page || 1,
      page_size: options.pageSize || 50
    }

    if (options.empNumbers) body.emp_numbers = options.empNumbers
    if (options.callTypes) body.call_types = options.callTypes
    if (options.minDuration) body.duration_grt_than = options.minDuration
    if (options.maxDuration) body.duration_les_than = options.maxDuration

    return this.request('/call-log/history', body)
  }

  /**
   * Get missed/never attended calls
   */
  async getNeverAttendedCalls(options = {}) {
    const body = {
      call_from: options.startDate ? this.toUnixTimestamp(options.startDate) : this.getDefaultStartTimestamp(),
      call_to: options.endDate ? this.toEndOfDayTimestamp(options.endDate) : this.getDefaultEndTimestamp()
    }

    return this.request('/call-log/never-attended', body)
  }

  /**
   * Get unique clients contacted
   */
  async getUniqueClients(options = {}) {
    const body = {
      call_from: options.startDate ? this.toUnixTimestamp(options.startDate) : this.getDefaultStartTimestamp(),
      call_to: options.endDate ? this.toEndOfDayTimestamp(options.endDate) : this.getDefaultEndTimestamp()
    }

    if (options.empNumbers) body.emp_numbers = options.empNumbers

    return this.request('/call-log/unique-clients', body)
  }

  /**
   * Get calls not picked up by client
   */
  async getNotPickupByClient(options = {}) {
    const body = {
      call_from: options.startDate ? this.toUnixTimestamp(options.startDate) : this.getDefaultStartTimestamp(),
      call_to: options.endDate ? this.toEndOfDayTimestamp(options.endDate) : this.getDefaultEndTimestamp()
    }

    return this.request('/call-log/not-pickup-by-client', body)
  }

  /**
   * Get hourly analytics
   */
  async getHourlyAnalytics(options = {}) {
    const body = {
      call_from: options.startDate ? this.toUnixTimestamp(options.startDate) : this.getDefaultStartTimestamp(),
      call_to: options.endDate ? this.toEndOfDayTimestamp(options.endDate) : this.getDefaultEndTimestamp()
    }

    if (options.empNumbers) body.emp_numbers = options.empNumbers

    return this.request('/call-log/hourly-analytics', body)
  }

  /**
   * Get day-wise analytics
   */
  async getDaywiseAnalytics(options = {}) {
    const body = {
      call_from: options.startDate ? this.toUnixTimestamp(options.startDate) : this.getDefaultStartTimestamp(),
      call_to: options.endDate ? this.toEndOfDayTimestamp(options.endDate) : this.getDefaultEndTimestamp()
    }

    if (options.empNumbers) body.emp_numbers = options.empNumbers

    return this.request('/call-log/daywise-analytics', body)
  }

  /**
   * Get specific calls by IDs (max 20)
   */
  async getCallsByIds(callIds = []) {
    return this.request('/call-log/get', { call_ids: callIds.slice(0, 20) })
  }

  // ==================== EMPLOYEE APIs ====================

  /**
   * Get employee details
   */
  async getEmployeeDetails() {
    return this.request('/employee/details', {})
  }

  // ==================== HELPER METHODS ====================

  /**
   * Convert date string (YYYY-MM-DD) to UNIX timestamp (seconds, UTC start of day)
   */
  toUnixTimestamp(dateStr) {
    const date = new Date(dateStr + 'T00:00:00Z')
    return Math.floor(date.getTime() / 1000)
  }

  /**
   * Convert date string (YYYY-MM-DD) to UNIX timestamp (seconds, UTC end of day 23:59:59)
   */
  toEndOfDayTimestamp(dateStr) {
    const date = new Date(dateStr + 'T23:59:59Z')
    return Math.floor(date.getTime() / 1000)
  }

  getDefaultStartTimestamp() {
    const date = new Date()
    date.setUTCHours(0, 0, 0, 0)
    return Math.floor(date.getTime() / 1000)
  }

  getDefaultEndTimestamp() {
    const date = new Date()
    date.setUTCHours(23, 59, 59, 0)
    return Math.floor(date.getTime() / 1000)
  }

  /**
   * Map Callyzer call type to CRM call type
   */
  static mapCallType(callyzerType) {
    const mapping = {
      'Incoming': 'inbound',
      'incoming': 'inbound',
      'Outgoing': 'outbound',
      'outgoing': 'outbound',
      'Missed': 'inbound',
      'missed': 'inbound',
      'Rejected': 'inbound',
      'rejected': 'inbound'
    }
    return mapping[callyzerType] || 'outbound'
  }

  /**
   * Map Callyzer call status to CRM status
   */
  static mapCallStatus(callyzerStatus, duration) {
    if (callyzerStatus === 'Missed' || callyzerStatus === 'missed' ||
        callyzerStatus === 'Rejected' || callyzerStatus === 'rejected') {
      return 'no_answer'
    }
    if (duration > 0) {
      return 'completed'
    }
    return 'no_answer'
  }

  /**
   * Format phone number for Callyzer (Indian format)
   */
  static formatPhoneNumber(phone) {
    if (!phone) return null

    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '')

    // Remove leading 0 or 91
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(2)
    }
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }

    // Return 10-digit number
    return cleaned.length === 10 ? cleaned : null
  }
}

export default CallyzerService
