import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  Award,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock
} from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`
const PRIMARY_COLOR = '#C59C82'

const ChannelPartnerIncentives = () => {
  const [incentiveData, setIncentiveData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchIncentives()
  }, [])

  const fetchIncentives = async () => {
    try {
      const token = localStorage.getItem('channel_partner_token')
      const response = await fetch(`${API_BASE}/channel-partner-portal/incentives`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch incentive data')

      const data = await response.json()
      setIncentiveData(data.data)
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

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: { bg: '#dcfce7', text: '#16a34a' },
      pending: { bg: '#fef3c7', text: '#d97706' },
      processing: { bg: '#dbeafe', text: '#2563eb' },
      cancelled: { bg: '#fee2e2', text: '#dc2626' },
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
            borderTopColor: PRIMARY_COLOR,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280' }}>Loading incentives...</p>
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

  const config = incentiveData?.config || null
  const records = incentiveData?.records || []
  const summary = incentiveData?.summary || {}

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
        Incentives
      </h1>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `${PRIMARY_COLOR}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: PRIMARY_COLOR,
            marginBottom: '12px'
          }}>
            <DollarSign size={24} />
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Total Earned</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            {formatCurrency(summary.totalEarned)}
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#10b98115',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            marginBottom: '12px'
          }}>
            <CheckCircle size={24} />
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Paid Out</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            {formatCurrency(summary.totalPaid)}
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#f59e0b15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b',
            marginBottom: '12px'
          }}>
            <Clock size={24} />
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Pending</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            {formatCurrency(summary.totalPending)}
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#6366f115',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366f1',
            marginBottom: '12px'
          }}>
            <TrendingUp size={24} />
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>Conversions</p>
          <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            {summary.totalConversions || 0}
          </p>
        </div>
      </div>

      {/* Current Incentive Configuration */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Award size={20} color={PRIMARY_COLOR} />
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Current Incentive Configuration
          </h2>
        </div>
        <div style={{ padding: '24px' }}>
          {config ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Incentive Model
                </p>
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0, textTransform: 'capitalize' }}>
                  {config.model || 'N/A'}
                </p>
              </div>
              {config.percentage != null && (
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Percentage
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    {config.percentage}%
                  </p>
                </div>
              )}
              {config.flatFee != null && (
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Flat Fee per Conversion
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    {formatCurrency(config.flatFee)}
                  </p>
                </div>
              )}
              {config.tier && (
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Current Tier
                  </p>
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    background: `${PRIMARY_COLOR}15`,
                    color: PRIMARY_COLOR,
                    textTransform: 'capitalize'
                  }}>
                    {config.tier}
                  </span>
                </div>
              )}
              {config.validFrom && (
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Valid From
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    {formatDate(config.validFrom)}
                  </p>
                </div>
              )}
              {config.validTo && (
                <div>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Valid Until
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    {formatDate(config.validTo)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
              <Award size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No incentive configuration available</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
                Contact your SPOC for incentive details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Incentive History Table */}
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
          <Calendar size={20} color={PRIMARY_COLOR} />
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            Incentive History
          </h2>
        </div>

        {records.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
            <DollarSign size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>No incentive records yet</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
              Incentive records will appear here as your leads get converted
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Lead</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const statusStyle = getPaymentStatusColor(record.paymentStatus || record.status)
                  return (
                    <tr key={record._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>{formatDate(record.date || record.createdAt)}</td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '500', color: '#1f2937' }}>
                          {record.leadName || record.lead?.name || '-'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ textTransform: 'capitalize' }}>
                          {record.type || record.incentiveType || '-'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>
                          {formatCurrency(record.amount)}
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
                          {record.paymentStatus || record.status}
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

export default ChannelPartnerIncentives
