import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Package,
  Search,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  AlertCircle
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const VendorPurchaseOrders = () => {
  const { id } = useParams()
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  })

  useEffect(() => {
    if (id) {
      fetchOrderDetail(id)
    } else {
      fetchOrders()
    }
  }, [id, pagination.page, filters.status])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('vendor_portal_token')
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(filters.status && { status: filters.status })
      })

      const response = await fetch(`${API_BASE}/vendor-portal/purchase-orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch orders')

      const data = await response.json()
      setOrders(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetail = async (orderId) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('vendor_portal_token')
      const response = await fetch(`${API_BASE}/vendor-portal/purchase-orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch order details')

      const data = await response.json()
      setSelectedOrder(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      draft: { bg: '#f3f4f6', text: '#6b7280' },
      pending: { bg: '#fef3c7', text: '#d97706' },
      approved: { bg: '#dbeafe', text: '#2563eb' },
      sent: { bg: '#e0e7ff', text: '#4338ca' },
      acknowledged: { bg: '#d1fae5', text: '#059669' },
      completed: { bg: '#dcfce7', text: '#16a34a' },
      rejected: { bg: '#fee2e2', text: '#dc2626' },
      cancelled: { bg: '#f3f4f6', text: '#6b7280' }
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
          <p style={{ color: '#6b7280' }}>Loading...</p>
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

  // Order Detail View
  if (id && selectedOrder) {
    return (
      <div>
        <Link
          to="/vendor-portal/purchase-orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#0d9488',
            textDecoration: 'none',
            marginBottom: '24px',
            fontSize: '14px'
          }}
        >
          <ChevronLeft size={18} /> Back to Orders
        </Link>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                {selectedOrder.poNumber}
              </h1>
              <p style={{ color: '#6b7280' }}>
                {selectedOrder.company?.name} | {selectedOrder.project?.name || 'No Project'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                ...getStatusColor(selectedOrder.status),
                textTransform: 'capitalize'
              }}>
                {selectedOrder.status}
              </span>
            </div>
          </div>

          {/* Order Info */}
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Order Date</p>
                <p style={{ fontWeight: '500', color: '#1f2937' }}>{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Expected Delivery</p>
                <p style={{ fontWeight: '500', color: '#1f2937' }}>
                  {selectedOrder.expectedDeliveryDate ? formatDate(selectedOrder.expectedDeliveryDate) : '-'}
                </p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Payment Terms</p>
                <p style={{ fontWeight: '500', color: '#1f2937' }}>{selectedOrder.paymentTerms || '-'}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Amount</p>
                <p style={{ fontWeight: '700', color: '#0d9488', fontSize: '20px' }}>
                  {formatCurrency(selectedOrder.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              Order Items
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Item</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Qty</th>
                    <th style={thStyle}>Unit Price</th>
                    <th style={thStyle}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={tdStyle}>{item.material?.name || item.name || '-'}</td>
                      <td style={tdStyle}>{item.description || '-'}</td>
                      <td style={tdStyle}>{item.quantity} {item.unit || ''}</td>
                      <td style={tdStyle}>{formatCurrency(item.unitPrice)}</td>
                      <td style={tdStyle}>{formatCurrency(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f9fafb' }}>
                    <td colSpan="5" style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>
                      Subtotal:
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '600' }}>{formatCurrency(selectedOrder.subtotal)}</td>
                  </tr>
                  {selectedOrder.taxAmount > 0 && (
                    <tr style={{ background: '#f9fafb' }}>
                      <td colSpan="5" style={{ ...tdStyle, textAlign: 'right', fontWeight: '600' }}>
                        Tax ({selectedOrder.taxRate}%):
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>{formatCurrency(selectedOrder.taxAmount)}</td>
                    </tr>
                  )}
                  <tr style={{ background: '#0d948810' }}>
                    <td colSpan="5" style={{ ...tdStyle, textAlign: 'right', fontWeight: '700', color: '#0d9488' }}>
                      Total:
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '700', color: '#0d9488' }}>
                      {formatCurrency(selectedOrder.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {selectedOrder.notes && (
            <div style={{ padding: '0 24px 24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                Notes
              </h3>
              <p style={{ color: '#6b7280', background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                {selectedOrder.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Orders List View
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
          Purchase Orders
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {orders.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No purchase orders found</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={thStyle}>PO Number</th>
                    <th style={thStyle}>Company</th>
                    <th style={thStyle}>Project</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Expected Delivery</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const statusStyle = getStatusColor(order.status)
                    return (
                      <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500', color: '#1f2937' }}>{order.poNumber}</span>
                        </td>
                        <td style={tdStyle}>{order.company?.name || '-'}</td>
                        <td style={tdStyle}>{order.project?.name || '-'}</td>
                        <td style={tdStyle}>{formatCurrency(order.totalAmount)}</td>
                        <td style={tdStyle}>{formatDate(order.createdAt)}</td>
                        <td style={tdStyle}>
                          {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '-'}
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
                            {order.status}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <Link
                            to={`/vendor-portal/purchase-orders/${order._id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              background: '#0d948810',
                              color: '#0d9488',
                              borderRadius: '6px',
                              fontSize: '13px',
                              textDecoration: 'none'
                            }}
                          >
                            <Eye size={14} /> View
                          </Link>
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
                  Showing {orders.length} of {pagination.total} orders
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
  letterSpacing: '0.05em'
}

const tdStyle = {
  padding: '16px',
  fontSize: '14px',
  color: '#374151'
}

export default VendorPurchaseOrders
