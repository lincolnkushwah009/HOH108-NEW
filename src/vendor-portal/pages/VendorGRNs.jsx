import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

const VendorGRNs = () => {
  const [grns, setGrns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({ status: '' })

  useEffect(() => {
    fetchGRNs()
  }, [pagination.page, filters.status])

  const fetchGRNs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('vendor_portal_token')
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(filters.status && { status: filters.status })
      })

      const response = await fetch(`${API_BASE}/vendor-portal/grns?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch GRNs')

      const data = await response.json()
      setGrns(data.data || [])
      if (data.pagination) setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
      received: { bg: '#dbeafe', text: '#2563eb' },
      inspection_pending: { bg: '#fef3c7', text: '#d97706' },
      accepted: { bg: '#dcfce7', text: '#16a34a' },
      rejected: { bg: '#fee2e2', text: '#dc2626' },
      partial: { bg: '#e0e7ff', text: '#4338ca' }
    }
    return colors[status] || { bg: '#f3f4f6', text: '#6b7280' }
  }

  const getQualityColor = (result) => {
    const colors = {
      passed: { bg: '#dcfce7', text: '#16a34a' },
      failed: { bg: '#fee2e2', text: '#dc2626' },
      pending: { bg: '#fef3c7', text: '#d97706' },
      partial: { bg: '#e0e7ff', text: '#4338ca' }
    }
    return colors[result] || { bg: '#f3f4f6', text: '#6b7280' }
  }

  const formatStatusLabel = (status) => {
    if (!status) return '-'
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
          <p style={{ color: '#6b7280' }}>Loading GRNs...</p>
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
          Goods Received Notes
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
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
            <option value="received">Received</option>
            <option value="inspection_pending">Inspection Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <SummaryCard
          icon={<Package size={22} />}
          label="Total GRNs"
          value={pagination.total || grns.length}
          color="#6366f1"
        />
        <SummaryCard
          icon={<Clock size={22} />}
          label="Pending Inspection"
          value={grns.filter(g => g.status === 'inspection_pending').length}
          color="#d97706"
        />
        <SummaryCard
          icon={<CheckCircle2 size={22} />}
          label="Accepted"
          value={grns.filter(g => g.status === 'accepted').length}
          color="#16a34a"
        />
        <SummaryCard
          icon={<XCircle size={22} />}
          label="Rejected"
          value={grns.filter(g => g.status === 'rejected').length}
          color="#dc2626"
        />
      </div>

      {/* GRNs Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {grns.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
            <ClipboardCheck size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', marginBottom: '4px' }}>No GRNs found</p>
            <p style={{ fontSize: '14px' }}>Goods Received Notes will appear here once materials are delivered.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={thStyle}>GRN Number</th>
                    <th style={thStyle}>PO Number</th>
                    <th style={thStyle}>Received Date</th>
                    <th style={thStyle}>Ordered Qty</th>
                    <th style={thStyle}>Received Qty</th>
                    <th style={thStyle}>Accepted Qty</th>
                    <th style={thStyle}>Rejected Qty</th>
                    <th style={thStyle}>Quality Check</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {grns.map((grn) => {
                    const statusStyle = getStatusColor(grn.status)
                    const qualityStyle = getQualityColor(grn.qualityInspection || grn.qualityResult)
                    return (
                      <tr key={grn._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500', color: '#1f2937' }}>
                            {grn.grnNumber || grn.receiptNumber || '-'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <Link
                            to={`/vendor-portal/purchase-orders/${grn.purchaseOrder?._id || grn.purchaseOrder}`}
                            style={{ color: '#0d9488', textDecoration: 'none', fontWeight: '500' }}
                          >
                            {grn.purchaseOrder?.poNumber || grn.poNumber || '-'}
                          </Link>
                        </td>
                        <td style={tdStyle}>{formatDate(grn.receivedDate || grn.createdAt)}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500' }}>{grn.orderedQuantity ?? grn.totalOrdered ?? '-'}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500', color: '#2563eb' }}>
                            {grn.receivedQuantity ?? grn.totalReceived ?? '-'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500', color: '#16a34a' }}>
                            {grn.acceptedQuantity ?? grn.totalAccepted ?? '-'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500', color: grn.rejectedQuantity > 0 || grn.totalRejected > 0 ? '#dc2626' : '#374151' }}>
                            {grn.rejectedQuantity ?? grn.totalRejected ?? '-'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {(grn.qualityInspection || grn.qualityResult) ? (
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '500',
                              background: qualityStyle.bg,
                              color: qualityStyle.text,
                              textTransform: 'capitalize'
                            }}>
                              {formatStatusLabel(grn.qualityInspection || grn.qualityResult)}
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '13px' }}>N/A</span>
                          )}
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
                            {formatStatusLabel(grn.status)}
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
                  Showing {grns.length} of {pagination.total} GRNs
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
    <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>{value}</p>
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

export default VendorGRNs
