import { useState, useEffect } from 'react'
import {
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Plus,
  IndianRupee,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

const VendorInvoices = () => {
  const [invoices, setInvoices] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({ status: '' })
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [formData, setFormData] = useState({
    purchaseOrder: '',
    invoiceNumber: '',
    invoiceDate: '',
    amount: '',
    file: null
  })

  useEffect(() => {
    fetchInvoices()
  }, [pagination.page, filters.status])

  useEffect(() => {
    if (showUploadForm && purchaseOrders.length === 0) {
      fetchPurchaseOrders()
    }
  }, [showUploadForm])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('vendor_portal_token')
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(filters.status && { status: filters.status })
      })

      const response = await fetch(`${API_BASE}/vendor-portal/invoices?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch invoices')

      const data = await response.json()
      setInvoices(data.data || [])
      if (data.pagination) setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchaseOrders = async () => {
    try {
      const token = localStorage.getItem('vendor_portal_token')
      const response = await fetch(`${API_BASE}/vendor-portal/purchase-orders?limit=100&status=approved,sent,acknowledged,completed`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch purchase orders')

      const data = await response.json()
      setPurchaseOrders(data.data || [])
    } catch (err) {
      console.error('Failed to fetch POs:', err)
    }
  }

  const handleUploadInvoice = async (e) => {
    e.preventDefault()
    setUploading(true)
    setUploadError(null)

    try {
      const token = localStorage.getItem('vendor_portal_token')
      const submitData = new FormData()
      submitData.append('purchaseOrder', formData.purchaseOrder)
      submitData.append('invoiceNumber', formData.invoiceNumber)
      submitData.append('invoiceDate', formData.invoiceDate)
      submitData.append('amount', formData.amount)
      if (formData.file) {
        submitData.append('invoice', formData.file)
      }

      const response = await fetch(`${API_BASE}/vendor-portal/invoices`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || 'Failed to upload invoice')
      }

      setShowUploadForm(false)
      setFormData({ purchaseOrder: '', invoiceNumber: '', invoiceDate: '', amount: '', file: null })
      fetchInvoices()
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
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

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fef3c7', text: '#d97706' },
      verified: { bg: '#dbeafe', text: '#2563eb' },
      approved: { bg: '#dcfce7', text: '#16a34a' },
      paid: { bg: '#dcfce7', text: '#16a34a' },
      disputed: { bg: '#fee2e2', text: '#dc2626' },
      rejected: { bg: '#fee2e2', text: '#dc2626' },
      partially_paid: { bg: '#e0e7ff', text: '#4338ca' }
    }
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' }
  }

  const getPaymentStatusColor = (status) => {
    const colors = {
      unpaid: { bg: '#fee2e2', text: '#dc2626' },
      partially_paid: { bg: '#fef3c7', text: '#d97706' },
      paid: { bg: '#dcfce7', text: '#16a34a' }
    }
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' }
  }

  const getMatchStatusIcon = (matchStatus) => {
    if (matchStatus === 'matched' || matchStatus === true) {
      return <ShieldCheck size={16} style={{ color: '#16a34a' }} />
    }
    if (matchStatus === 'mismatch' || matchStatus === false) {
      return <ShieldAlert size={16} style={{ color: '#dc2626' }} />
    }
    return <Clock size={16} style={{ color: '#d97706' }} />
  }

  const getMatchLabel = (matchStatus) => {
    if (matchStatus === 'matched' || matchStatus === true) return 'Matched'
    if (matchStatus === 'mismatch' || matchStatus === false) return 'Mismatch'
    return 'Pending'
  }

  const formatStatusLabel = (status) => {
    if (!status) return '-'
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Calculate summary from loaded invoices
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || inv.totalAmount || 0), 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || inv.amountPaid || 0), 0)
  const totalPending = totalInvoiced - totalPaid

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
          <p style={{ color: '#6b7280' }}>Loading invoices...</p>
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
          Invoices
        </h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value })
              setPagination({ ...pagination, page: 1 })
            }}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="disputed">Disputed</option>
          </select>
          <button
            onClick={() => setShowUploadForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#0d9488',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Plus size={18} /> Upload Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <SummaryCard
          icon={<FileText size={22} />}
          label="Total Invoiced"
          value={formatCurrency(totalInvoiced)}
          color="#6366f1"
        />
        <SummaryCard
          icon={<CheckCircle2 size={22} />}
          label="Total Paid"
          value={formatCurrency(totalPaid)}
          color="#16a34a"
        />
        <SummaryCard
          icon={<Clock size={22} />}
          label="Total Pending"
          value={formatCurrency(totalPending)}
          color="#d97706"
        />
      </div>

      {/* Upload Invoice Modal */}
      {showUploadForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Upload Invoice
              </h2>
              <button
                onClick={() => { setShowUploadForm(false); setUploadError(null) }}
                style={{
                  padding: '6px',
                  border: 'none',
                  background: '#f3f4f6',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} color="#6b7280" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUploadInvoice} style={{ padding: '24px' }}>
              {uploadError && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  {uploadError}
                </div>
              )}

              {/* Select PO */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Purchase Order *
                </label>
                <select
                  value={formData.purchaseOrder}
                  onChange={(e) => setFormData({ ...formData, purchaseOrder: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select a Purchase Order</option>
                  {purchaseOrders.map(po => (
                    <option key={po._id} value={po._id}>
                      {po.poNumber} - {formatCurrency(po.totalAmount)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Number */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Invoice Number *
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  required
                  placeholder="e.g. INV-2024-001"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Invoice Date */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Amount */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Invoice Amount *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* File Upload */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Invoice File (PDF/Image)
                </label>
                <div style={{
                  border: '2px dashed #e5e7eb',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#f9fafb'
                }}
                  onClick={() => document.getElementById('invoice-file-input').click()}
                >
                  <Upload size={24} style={{ margin: '0 auto 8px', color: '#9ca3af' }} />
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                    {formData.file ? formData.file.name : 'Click to select file'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
                    PDF, JPG, or PNG up to 10MB
                  </p>
                </div>
                <input
                  id="invoice-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] || null })}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowUploadForm(false); setUploadError(null) }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: uploading ? '#9ca3af' : '#0d9488',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploading ? 'Uploading...' : 'Submit Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {invoices.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', marginBottom: '4px' }}>No invoices found</p>
            <p style={{ fontSize: '14px' }}>Upload an invoice to get started.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={thStyle}>Invoice No.</th>
                    <th style={thStyle}>PO Number</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Paid</th>
                    <th style={thStyle}>Balance</th>
                    <th style={thStyle}>3-Way Match</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const statusStyle = getStatusColor(invoice.status)
                    const invoiceAmount = invoice.amount || invoice.totalAmount || 0
                    const paidAmount = invoice.paidAmount || invoice.amountPaid || 0
                    const balance = invoiceAmount - paidAmount
                    const paymentStatus = paidAmount >= invoiceAmount ? 'paid'
                      : paidAmount > 0 ? 'partially_paid'
                      : 'unpaid'
                    const paymentStyle = getPaymentStatusColor(paymentStatus)

                    return (
                      <tr key={invoice._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500', color: '#1f2937' }}>
                            {invoice.invoiceNumber || '-'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ color: '#0d9488', fontWeight: '500' }}>
                            {invoice.purchaseOrder?.poNumber || invoice.poNumber || '-'}
                          </span>
                        </td>
                        <td style={tdStyle}>{formatDate(invoice.invoiceDate || invoice.date || invoice.createdAt)}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500' }}>{formatCurrency(invoiceAmount)}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500', color: '#16a34a' }}>{formatCurrency(paidAmount)}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500', color: balance > 0 ? '#d97706' : '#16a34a' }}>
                            {formatCurrency(balance)}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {getMatchStatusIcon(invoice.threeWayMatch || invoice.matchStatus)}
                            <span style={{ fontSize: '13px', color: '#6b7280' }}>
                              {getMatchLabel(invoice.threeWayMatch || invoice.matchStatus)}
                            </span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: statusStyle.bg,
                            color: statusStyle.text,
                            textTransform: 'capitalize'
                          }}>
                            {formatStatusLabel(invoice.status)}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: paymentStyle.bg,
                            color: paymentStyle.text,
                            textTransform: 'capitalize'
                          }}>
                            {formatStatusLabel(paymentStatus)}
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
                  Showing {invoices.length} of {pagination.total} invoices
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

const SummaryCard = ({ icon, label, value, color }) => (
  <div style={{
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #e5e7eb'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}>
        {icon}
      </div>
    </div>
    <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>{label}</p>
    <p style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937', margin: 0 }}>{value}</p>
  </div>
)

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

export default VendorInvoices
