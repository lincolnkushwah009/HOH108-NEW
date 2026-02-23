import { useState, useEffect } from 'react'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { Palette, Check, X, Eye } from 'lucide-react'

const API_BASE_URL = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('customer_portal_token')
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

export default function CustomerDesigns() {
  const { customer } = useCustomerAuth()
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customer?._id) {
      apiRequest(`/customer-portal/design-approvals?customerId=${customer._id}`)
        .then(res => setDesigns(res.data || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [customer])

  const handleAction = async (id, action, comments = '') => {
    try {
      await apiRequest(`/customer-portal/design-approvals/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ action, comments }),
      })
      // Reload
      const res = await apiRequest(`/customer-portal/design-approvals?customerId=${customer._id}`)
      setDesigns(res.data || [])
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading designs...</div>

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F2937', margin: '0 0 24px' }}>My Designs</h1>
      {designs.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', border: '1px solid #E5E7EB' }}>
          <Palette size={40} style={{ color: '#D1D5DB', marginBottom: 12 }} />
          <p style={{ color: '#6B7280', margin: 0 }}>No design iterations available for review</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {designs.map(design => (
            <div key={design._id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', margin: '0 0 4px' }}>
                    {design.iterationId} - Version {design.version}
                  </h3>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Phase: {design.phase} | Designer: {design.designerName || 'N/A'}</p>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: design.status === 'approved' ? '#D1FAE5' : design.status === 'changes_requested' ? '#FEE2E2' : '#FEF3C7',
                  color: design.status === 'approved' ? '#065F46' : design.status === 'changes_requested' ? '#991B1B' : '#92400E',
                }}>
                  {design.status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>
              {/* Files */}
              {design.files?.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {design.files.map((f, i) => (
                    <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#F3F4F6', borderRadius: 8, fontSize: 12, color: '#374151', textDecoration: 'none' }}
                    >
                      <Eye size={12} /> {f.name || f.type}
                    </a>
                  ))}
                </div>
              )}
              {/* Actions */}
              {['submitted', 'under_review'].includes(design.status) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleAction(design._id, 'approve')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={() => {
                    const comments = prompt('Enter your feedback for revision:')
                    if (comments) handleAction(design._id, 'reject', comments)
                  }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    <X size={14} /> Request Changes
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
