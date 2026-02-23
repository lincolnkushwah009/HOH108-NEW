import { useState, useEffect } from 'react'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  FileText,
  Filter,
  X
} from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
const PRIMARY_COLOR = '#C59C82'

const ChannelPartnerLeads = () => {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchLeads()
  }, [page, statusFilter])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('channel_partner_token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await fetch(`${API_BASE}/channel-partner-portal/leads?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch leads')

      const data = await response.json()
      setLeads(data.data?.leads || data.data || [])
      setTotalPages(data.data?.totalPages || Math.ceil((data.data?.total || 0) / limit) || 1)
      setTotalLeads(data.data?.total || data.data?.leads?.length || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchLeads()
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
      in_progress: { bg: '#e0e7ff', text: '#4f46e5' },
    }
    return colors[status] || colors.new
  }

  const statuses = ['new', 'pending', 'accepted', 'contacted', 'qualified', 'converted', 'rejected', 'duplicate']

  const inputStyle = {
    padding: '10px 16px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
        My Leads
      </h1>

      {/* Search & Filter Bar */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        padding: '16px 20px',
        marginBottom: '16px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              ...inputStyle,
              width: '100%',
              paddingLeft: '40px'
            }}
            onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} color="#6b7280" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            style={{
              ...inputStyle,
              background: 'white',
              cursor: 'pointer',
              appearance: 'auto',
              minWidth: '150px'
            }}
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
          {(statusFilter || search) && (
            <button
              onClick={() => { setStatusFilter(''); setSearch(''); setPage(1) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                background: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '16px',
          marginBottom: '16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#fee2e2',
          color: '#dc2626'
        }}>
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e5e7eb',
                borderTopColor: PRIMARY_COLOR,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px'
              }} />
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Loading leads...</p>
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: '#6b7280' }}>
            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 4px 0' }}>No leads found</p>
            <p style={{ fontSize: '14px', margin: 0 }}>
              {statusFilter || search ? 'Try adjusting your filters' : 'Submit your first lead to get started'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={thStyle}>Lead ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>City</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Submitted Date</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const statusStyle = getStatusColor(lead.status)
                    return (
                      <tr key={lead._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={tdStyle}>
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#6b7280' }}>
                            {lead.leadId || lead._id?.slice(-8) || '-'}
                          </span>
                        </td>
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
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap'
                          }}>
                            {lead.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={tdStyle}>{formatDate(lead.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalLeads)} of {totalLeads} leads
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    color: page === 1 ? '#d1d5db' : '#374151',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span style={{ fontSize: '14px', color: '#6b7280', padding: '0 8px' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    color: page === totalPages ? '#d1d5db' : '#374151',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
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

export default ChannelPartnerLeads
