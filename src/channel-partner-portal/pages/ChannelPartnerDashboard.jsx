import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  CheckCircle,
  Copy,
  TrendingUp,
  DollarSign,
  ArrowRight,
  AlertCircle,
  FileText,
  Calendar
} from 'lucide-react'
import { useChannelPartnerAuth } from '../context/ChannelPartnerAuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
const PRIMARY_COLOR = '#C59C82'

const ChannelPartnerDashboard = () => {
  const { partner } = useChannelPartnerAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('channel_partner_token')
      const response = await fetch(`${API_BASE}/channel-partner-portal/dashboard`, {
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    const colors = {
      new: { bg: '#dbeafe', text: '#2563eb' },
      contacted: { bg: '#e0e7ff', text: '#4f46e5' },
      qualified: { bg: '#fef3c7', text: '#d97706' },
      converted: { bg: '#dcfce7', text: '#16a34a' },
      rejected: { bg: '#fee2e2', text: '#dc2626' },
      duplicate: { bg: '#f3f4f6', text: '#6b7280' },
      pending: { bg: '#fef3c7', text: '#d97706' },
      accepted: { bg: '#dbeafe', text: '#2563eb' },
    }
    return colors[status] || colors.new
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: PRIMARY_COLOR,
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
  const recentLeads = dashboardData?.recentLeads || []
  const incentiveConfig = dashboardData?.incentiveConfig || null

  return (
    <div>
      {/* Welcome Section */}
      <div style={{
        background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #a8825e 100%)`,
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', margin: '0 0 8px 0' }}>
              Welcome back, {partner?.name || 'Partner'}!
            </h1>
            <p style={{ opacity: 0.9, margin: 0 }}>
              Partner ID: {partner?.partnerId || 'N/A'} | Status: {partner?.status?.toUpperCase() || 'N/A'}
            </p>
          </div>
          <Link
            to="/channel-partner-portal/submit-leads"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255,255,255,0.2)',
              padding: '12px 20px',
              borderRadius: '12px',
              color: 'white',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            Submit New Lead <ArrowRight size={16} />
          </Link>
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
          icon={<Users size={24} />}
          label="Total Leads Submitted"
          value={stats.totalLeads || 0}
          color="#6366f1"
        />
        <StatCard
          icon={<CheckCircle size={24} />}
          label="Leads Accepted"
          value={stats.acceptedLeads || 0}
          color="#10b981"
        />
        <StatCard
          icon={<Copy size={24} />}
          label="Duplicates"
          value={stats.duplicateLeads || 0}
          color="#f59e0b"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="Leads Converted"
          value={stats.convertedLeads || 0}
          color={PRIMARY_COLOR}
        />
      </div>

      {/* Incentive Summary + Recent Leads */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Incentive Summary Card */}
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
            alignItems: 'center',
            gap: '12px'
          }}>
            <DollarSign size={20} color={PRIMARY_COLOR} />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Incentive Summary
            </h2>
          </div>
          <div style={{ padding: '24px' }}>
            {incentiveConfig ? (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>Model</span>
                  <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px', textTransform: 'capitalize' }}>
                    {incentiveConfig.model || 'N/A'}
                  </span>
                </div>
                {incentiveConfig.percentage != null && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Percentage</span>
                    <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                      {incentiveConfig.percentage}%
                    </span>
                  </div>
                )}
                {incentiveConfig.flatFee != null && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Flat Fee</span>
                    <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '14px' }}>
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(incentiveConfig.flatFee)}
                    </span>
                  </div>
                )}
                {incentiveConfig.tier && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0'
                  }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Tier</span>
                    <span style={{
                      fontWeight: '500',
                      fontSize: '13px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: `${PRIMARY_COLOR}15`,
                      color: PRIMARY_COLOR,
                      textTransform: 'capitalize'
                    }}>
                      {incentiveConfig.tier}
                    </span>
                  </div>
                )}
                <div style={{ marginTop: '16px' }}>
                  <Link
                    to="/channel-partner-portal/incentives"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: PRIMARY_COLOR,
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    View Details <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280' }}>
                <DollarSign size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No incentive configuration available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Leads Table */}
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
              Recent Leads
            </h2>
            <Link
              to="/channel-partner-portal/leads"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: PRIMARY_COLOR,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
              <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No leads submitted yet</p>
              <Link
                to="/channel-partner-portal/submit-leads"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '12px',
                  color: PRIMARY_COLOR,
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                Submit your first lead <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>City</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.slice(0, 10).map((lead) => {
                    const statusStyle = getStatusColor(lead.status)
                    return (
                      <tr key={lead._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: '500', color: '#1f2937' }}>{lead.name}</span>
                        </td>
                        <td style={tdStyle}>{lead.phone}</td>
                        <td style={tdStyle}>{lead.city || '-'}</td>
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
                            {lead.status}
                          </span>
                        </td>
                        <td style={tdStyle}>{formatDate(lead.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

const StatCard = ({ icon, label, value, color }) => (
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
    <p style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
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

export default ChannelPartnerDashboard
