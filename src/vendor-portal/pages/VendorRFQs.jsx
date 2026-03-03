import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Package,
  Send,
  ArrowLeft,
  Eye
} from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

const VendorRFQs = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rfqs, setRfqs] = useState([])
  const [selectedRfq, setSelectedRfq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quoteForm, setQuoteForm] = useState({
    quotedItems: [],
    validUntil: '',
    paymentTerms: '',
    deliveryTerms: '',
    notes: ''
  })

  useEffect(() => {
    if (id) {
      fetchRfqDetail(id)
    } else {
      fetchRfqs()
    }
  }, [id])

  const fetchRfqs = async () => {
    try {
      const token = localStorage.getItem('vendor_portal_token')
      const response = await fetch(`${API_BASE}/vendor-portal/rfqs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch RFQs')
      const data = await response.json()
      setRfqs(data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchRfqDetail = async (rfqId) => {
    try {
      const token = localStorage.getItem('vendor_portal_token')
      const response = await fetch(`${API_BASE}/vendor-portal/rfqs/${rfqId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch RFQ details')
      const data = await response.json()
      setSelectedRfq(data.data)

      // Initialize quote form with line items
      if (data.data?.lineItems) {
        setQuoteForm(prev => ({
          ...prev,
          quotedItems: data.data.lineItems.map((item, idx) => ({
            lineItemIndex: idx,
            unitPrice: item.estimatedUnitPrice || 0,
            totalPrice: (item.estimatedUnitPrice || 0) * item.quantity,
            deliveryDays: 7,
            remarks: ''
          }))
        }))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuote = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const token = localStorage.getItem('vendor_portal_token')
      const response = await fetch(`${API_BASE}/vendor-portal/rfqs/${selectedRfq._id}/quote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quoteForm)
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.message || 'Failed to submit quotation')
      }

      alert('Quotation submitted successfully!')
      setShowQuoteModal(false)
      fetchRfqDetail(selectedRfq._id)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const updateQuotedItem = (index, field, value) => {
    setQuoteForm(prev => {
      const newItems = [...prev.quotedItems]
      newItems[index] = { ...newItems[index], [field]: value }

      // Auto-calculate total if unit price changes
      if (field === 'unitPrice' && selectedRfq?.lineItems?.[index]) {
        newItems[index].totalPrice = value * selectedRfq.lineItems[index].quantity
      }

      return { ...prev, quotedItems: newItems }
    })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fef3c7', text: '#d97706' },
      submitted: { bg: '#dbeafe', text: '#2563eb' },
      sent: { bg: '#e0f2fe', text: '#0284c7' },
      in_progress: { bg: '#fef3c7', text: '#d97706' },
      accepted: { bg: '#dcfce7', text: '#16a34a' },
      awarded: { bg: '#dcfce7', text: '#16a34a' },
      rejected: { bg: '#fee2e2', text: '#dc2626' },
      closed: { bg: '#f3f4f6', text: '#6b7280' },
      expired: { bg: '#f3f4f6', text: '#6b7280' }
    }
    return colors[status] || colors.pending
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
          <p style={{ color: '#6b7280' }}>Loading RFQs...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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

  // Detail view
  if (id && selectedRfq) {
    const isDeadlinePassed = new Date() > new Date(selectedRfq.quotationDeadline)
    const canSubmitQuote = ['sent', 'in_progress'].includes(selectedRfq.status) &&
                          !isDeadlinePassed &&
                          selectedRfq.myQuotationStatus !== 'submitted'

    return (
      <div>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/vendor-portal/rfqs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#6b7280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          >
            <ArrowLeft size={18} />
            Back to RFQs
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                {selectedRfq.rfqNumber}
              </h1>
              <p style={{ color: '#6b7280' }}>{selectedRfq.title}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                background: getStatusColor(selectedRfq.status).bg,
                color: getStatusColor(selectedRfq.status).text,
                textTransform: 'capitalize'
              }}>
                {selectedRfq.status.replace('_', ' ')}
              </span>

              {canSubmitQuote && (
                <button
                  onClick={() => setShowQuoteModal(true)}
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
                  <Send size={18} />
                  Submit Quotation
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <InfoCard
            icon={<Calendar size={20} />}
            label="Deadline"
            value={formatDate(selectedRfq.quotationDeadline)}
            highlight={isDeadlinePassed}
          />
          <InfoCard
            icon={<Package size={20} />}
            label="Project"
            value={selectedRfq.project?.title || '-'}
          />
          <InfoCard
            icon={<FileText size={20} />}
            label="My Quote Status"
            value={selectedRfq.myQuotationStatus?.replace('_', ' ') || 'Pending'}
            status={selectedRfq.myQuotationStatus}
          />
          {selectedRfq.myQuotation?.totalQuotedAmount && (
            <InfoCard
              icon={<CheckCircle size={20} />}
              label="Quoted Amount"
              value={formatCurrency(selectedRfq.myQuotation.totalQuotedAmount)}
            />
          )}
        </div>

        {/* Line Items */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Items Requested
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Material</th>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Unit</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Required Date</th>
                </tr>
              </thead>
              <tbody>
                {selectedRfq.lineItems?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}>{item.material?.materialName || item.itemCode || '-'}</td>
                    <td style={tdStyle}>{item.description}</td>
                    <td style={tdStyle}>{item.unit}</td>
                    <td style={tdStyle}>{item.quantity}</td>
                    <td style={tdStyle}>{item.requiredDate ? formatDate(item.requiredDate) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submitted Quotation Details */}
        {selectedRfq.myQuotation && selectedRfq.myQuotationStatus === 'submitted' && (
          <div style={{
            background: '#f0fdf4',
            borderRadius: '16px',
            border: '1px solid #bbf7d0',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#166534', marginBottom: '16px' }}>
              Your Submitted Quotation
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Total Amount</p>
                <p style={{ fontWeight: '600', color: '#1f2937' }}>{formatCurrency(selectedRfq.myQuotation.totalQuotedAmount)}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Submitted On</p>
                <p style={{ fontWeight: '600', color: '#1f2937' }}>{formatDate(selectedRfq.myQuotation.submittedAt)}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Payment Terms</p>
                <p style={{ fontWeight: '600', color: '#1f2937' }}>{selectedRfq.myQuotation.paymentTerms || '-'}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Valid Until</p>
                <p style={{ fontWeight: '600', color: '#1f2937' }}>{selectedRfq.myQuotation.validUntil ? formatDate(selectedRfq.myQuotation.validUntil) : '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quote Modal */}
        {showQuoteModal && (
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
              maxWidth: '700px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  Submit Quotation
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                  {selectedRfq.rfqNumber} - {selectedRfq.title}
                </p>
              </div>

              <form onSubmit={handleSubmitQuote} style={{ padding: '24px' }}>
                {/* Line Items Pricing */}
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                    Item Pricing
                  </h3>
                  {selectedRfq.lineItems?.map((item, idx) => (
                    <div key={idx} style={{
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <p style={{ fontWeight: '500', marginBottom: '8px' }}>
                        {idx + 1}. {item.description} ({item.quantity} {item.unit})
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>Unit Price (INR)</label>
                          <input
                            type="number"
                            value={quoteForm.quotedItems[idx]?.unitPrice || ''}
                            onChange={(e) => updateQuotedItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            style={inputStyle}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>Total Price</label>
                          <input
                            type="number"
                            value={quoteForm.quotedItems[idx]?.totalPrice || ''}
                            style={{ ...inputStyle, background: '#e5e7eb', color: '#1f2937' }}
                            readOnly
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', color: '#6b7280' }}>Delivery Days</label>
                          <input
                            type="number"
                            value={quoteForm.quotedItems[idx]?.deliveryDays || ''}
                            onChange={(e) => updateQuotedItem(idx, 'deliveryDays', parseInt(e.target.value) || 0)}
                            style={inputStyle}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quote Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Valid Until</label>
                    <input
                      type="date"
                      value={quoteForm.validUntil}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, validUntil: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Payment Terms</label>
                    <input
                      type="text"
                      value={quoteForm.paymentTerms}
                      onChange={(e) => setQuoteForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                      placeholder="e.g., 50% advance, 50% on delivery"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Delivery Terms</label>
                  <input
                    type="text"
                    value={quoteForm.deliveryTerms}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, deliveryTerms: e.target.value }))}
                    placeholder="e.g., Ex-factory, FOB, etc."
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Notes</label>
                  <textarea
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Any additional notes or conditions"
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Total */}
                <div style={{
                  padding: '16px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '600', color: '#166534' }}>Total Quoted Amount</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#166534' }}>
                    {formatCurrency(quoteForm.quotedItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0))}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '8px',
                      background: submitting ? '#9ca3af' : '#0d9488',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Send size={18} />
                    {submitting ? 'Submitting...' : 'Submit Quotation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // List view
  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
          Request for Quotations
        </h1>
        <p style={{ color: '#6b7280' }}>
          View and respond to quotation requests from buyers
        </p>
      </div>

      {rfqs.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <FileText size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
          <p style={{ color: '#6b7280', marginBottom: '8px' }}>No RFQs found</p>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            You will see quotation requests here when buyers send them to you
          </p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={thStyle}>RFQ Number</th>
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Project</th>
                  <th style={thStyle}>Deadline</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>My Quote</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((rfq) => {
                  const statusStyle = getStatusColor(rfq.status)
                  const quoteStatusStyle = getStatusColor(rfq.myQuotationStatus)
                  const isDeadlinePassed = new Date() > new Date(rfq.quotationDeadline)

                  return (
                    <tr key={rfq._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '500', color: '#0d9488' }}>
                          {rfq.rfqNumber}
                        </span>
                      </td>
                      <td style={tdStyle}>{rfq.title}</td>
                      <td style={tdStyle}>{rfq.project?.title || '-'}</td>
                      <td style={tdStyle}>
                        <span style={{ color: isDeadlinePassed ? '#dc2626' : '#374151' }}>
                          {formatDate(rfq.quotationDeadline)}
                          {isDeadlinePassed && (
                            <span style={{ fontSize: '10px', marginLeft: '4px' }}>(Passed)</span>
                          )}
                        </span>
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
                          {rfq.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: quoteStatusStyle.bg,
                          color: quoteStatusStyle.text,
                          textTransform: 'capitalize'
                        }}>
                          {rfq.myQuotationStatus || 'Pending'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <Link
                          to={`/vendor-portal/rfqs/${rfq._id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: '#f3f4f6',
                            borderRadius: '6px',
                            color: '#374151',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

const InfoCard = ({ icon, label, value, highlight, status }) => {
  const getStatusBg = () => {
    if (highlight) return '#fef2f2'
    if (status === 'submitted') return '#f0fdf4'
    if (status === 'accepted' || status === 'awarded') return '#f0fdf4'
    return 'white'
  }

  return (
    <div style={{
      background: getStatusBg(),
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ color: highlight ? '#dc2626' : '#6b7280', marginBottom: '8px' }}>
        {icon}
      </div>
      <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
      <p style={{
        fontWeight: '600',
        color: highlight ? '#dc2626' : '#1f2937',
        textTransform: 'capitalize'
      }}>
        {value}
      </p>
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
  letterSpacing: '0.05em'
}

const tdStyle = {
  padding: '16px',
  fontSize: '14px',
  color: '#374151'
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '14px',
  marginTop: '4px',
  color: '#1f2937',
  background: 'white'
}

export default VendorRFQs
