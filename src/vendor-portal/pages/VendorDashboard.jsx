import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Clock,
  CheckCircle,
  DollarSign,
  FileText,
  TrendingUp,
  Calendar,
  ArrowRight,
  AlertCircle,
  Star
} from 'lucide-react'
import { useVendorAuth } from '../context/VendorAuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const VendorDashboard = () => {
  const { vendor } = useVendorAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('vendor_portal_token')
      const response = await fetch(`${API_BASE}/vendor-portal/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch dashboard data')

      const data = await response.json()
      setDashboardData(data.data)
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
      pending: { bg: '#fef3c7', text: '#d97706' },
      approved: { bg: '#dbeafe', text: '#2563eb' },
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
          <p style={{ color: '#6b7280' }}>Loading dashboard...</p>
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

  const stats = dashboardData?.stats || {}
  const recentOrders = dashboardData?.recentOrders || []

  return (
    <div>
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
              Welcome back, {vendor?.name || 'Vendor'}!
            </h1>
            <p style={{ opacity: 0.9 }}>
              Vendor ID: {vendor?.vendorId || 'N/A'} | Status: {vendor?.status?.toUpperCase() || 'N/A'}
            </p>
          </div>
          {vendor?.rating && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.2)',
              padding: '12px 20px',
              borderRadius: '12px'
            }}>
              <Star size={24} fill="gold" color="gold" />
              <span style={{ fontSize: '20px', fontWeight: '600' }}>{vendor.rating}/5</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatCard
          icon={<Package size={24} />}
          label="Total Orders"
          value={stats.totalOrders || 0}
          color="#6366f1"
        />
        <StatCard
          icon={<Clock size={24} />}
          label="Pending Orders"
          value={stats.pendingOrders || 0}
          color="#f59e0b"
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          label="Completed Orders"
          value={stats.completedOrders || 0}
          color="#10b981"
        />
        <StatCard
          icon={<DollarSign size={24} />}
          label="Total Value"
          value={formatCurrency(stats.totalValue)}
          color="#0d9488"
          isValue
        />
      </div>

      {/* Recent Orders */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Recent Purchase Orders
          </h2>
          <Link
            to="/vendor-portal/purchase-orders"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0d9488',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No purchase orders yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={thStyle}>PO Number</th>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>Project</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const statusStyle = getStatusColor(order.status)
                  return (
                    <tr key={order._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>
                        <Link
                          to={`/vendor-portal/purchase-orders/${order._id}`}
                          style={{ color: '#0d9488', textDecoration: 'none', fontWeight: '500' }}
                        >
                          {order.poNumber}
                        </Link>
                      </td>
                      <td style={tdStyle}>{order.company?.name || '-'}</td>
                      <td style={tdStyle}>{order.project?.name || '-'}</td>
                      <td style={tdStyle}>{formatCurrency(order.totalAmount)}</td>
                      <td style={tdStyle}>{formatDate(order.createdAt)}</td>
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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

const StatCard = ({ icon, label, value, color, isValue }) => (
  <div style={{
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e5e7eb'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '12px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
      }}>
        {icon}
      </div>
    </div>
    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>{label}</p>
    <p style={{ fontSize: isValue ? '20px' : '28px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
      {value}
    </p>
  </div>
)

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

export default VendorDashboard
