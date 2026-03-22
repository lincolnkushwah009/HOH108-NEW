import { useState, useEffect } from 'react'
import {
  CreditCard,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Banknote,
  ArrowDownRight,
  Calendar
} from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

const VendorPayments = () => {
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState({ totalInvoiced: 0, totalPaid: 0, totalPending: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

  useEffect(() => {
    fetchPayments()
  }, [pagination.page])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('vendor_portal_token')
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20
      })

      const response = await fetch(`${API_BASE}/vendor-portal/payments?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch payments')

      const data = await response.json()
      setPayments(data.data || [])
      if (data.pagination) setPagination(data.pagination)
      if (data.summary) {
        setSummary(data.summary)
      } else {
        // Compute from invoices if no summary endpoint
        const paymentList = data.data || []
        const totalPaid = paymentList.reduce((sum, p) => sum + (p.amount || 0), 0)
        setSummary(prev => ({ ...prev, totalPaid }))
      }

      // Also fetch invoice summary for totals
      fetchInvoiceSummary(token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoiceSummary = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/vendor-portal/invoices?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) return

      const data = await response.json()
      const invoices = data.data || []
      const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || inv.totalAmount || 0), 0)
      const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || inv.amountPaid || 0), 0)
      const totalPending = totalInvoiced - totalPaid

      setSummary(prev => ({
        totalInvoiced: totalInvoiced || prev.totalInvoiced,
        totalPaid: totalPaid || prev.totalPaid,
        totalPending: totalPending || prev.totalPending
      }))
    } catch (err) {
      // Silently fail - summary cards will show 0
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getMethodBadge = (method) => {
    const methods = {
      bank_transfer: { bg: '#dbeafe', text: '#2563eb', label: 'Bank Transfer' },
      neft: { bg: '#dbeafe', text: '#2563eb', label: 'NEFT' },
      rtgs: { bg: '#e0e7ff', text: '#4338ca', label: 'RTGS' },
      imps: { bg: '#d1fae5', text: '#059669', label: 'IMPS' },
      upi: { bg: '#dcfce7', text: '#16a34a', label: 'UPI' },
      cheque: { bg: '#fef3c7', text: '#d97706', label: 'Cheque' },
      cash: { bg: '#f3f4f6', text: '#6b7280', label: 'Cash' },
      online: { bg: '#dbeafe', text: '#2563eb', label: 'Online' }
    }
    const key = method?.toLowerCase()?.replace(/\s+/g, '_')
    return methods[key] || { bg: '#f3f4f6', text: '#6b7280', label: method || 'N/A' }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#0d9488',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280' }}>Loading payments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '24px',
        background: '#fef2f2',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#dc2626'
      }}>
        <AlertCircle size={24} />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
          Payments
        </h1>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IndianRupee size={22} />
            </div>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Total Invoiced</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
            {formatCurrency(summary.totalInvoiced)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={22} />
            </div>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Total Paid</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
            {formatCurrency(summary.totalPaid)}
          </p>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={22} />
            </div>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>Total Pending</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>
            {formatCurrency(summary.totalPending)}
          </p>
        </div>
      </div>

      {/* Payment History */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Payment History
          </h2>
        </div>

        {payments.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
            <CreditCard size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', marginBottom: '4px' }}>No payments recorded yet</p>
            <p style={{ fontSize: '14px' }}>Payment records will appear here once processed.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Invoice</th>
                    <th style={thStyle}>PO Number</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Method</th>
                    <th style={thStyle}>Reference No.</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const methodBadge = getMethodBadge(payment.method || payment.paymentMethod)
                    return (
                      <tr key={payment._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={14} color="#9ca3af" />
                            {formatDate(payment.paymentDate || payment.date || payment.createdAt)}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500', color: '#1f2937' }}>
                            {payment.invoice?.invoiceNumber || payment.invoiceNumber || '-'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: '#0d9488', fontWeight: '500' }}>
                            {payment.purchaseOrder?.poNumber || payment.poNumber || '-'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ArrowDownRight size={14} color="#16a34a" />
                            <span style={{ fontWeight: '600', color: '#16a34a' }}>
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: methodBadge.bg,
                            color: methodBadge.text
                          }}>
                            {methodBadge.label}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#6b7280' }}>
                            {payment.referenceNumber || payment.transactionId || payment.reference || '-'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  Showing {payments.length} of {pagination.total} payments
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                      opacity: pagination.page === 1 ? 0.5 : 1
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span style={{ padding: '8px 16px', color: '#6b7280' }}>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.pages}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: 'white',
                      cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer',
                      opacity: pagination.page === pagination.pages ? 0.5 : 1
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap'
}

const tdStyle = {
  padding: '16px',
  fontSize: '14px',
  color: '#374151'
}

export default VendorPayments
