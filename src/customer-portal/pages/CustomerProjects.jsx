import { useState, useEffect } from 'react'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { FolderKanban } from 'lucide-react'

const API_BASE_URL = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

export default function CustomerProjects() {
  const { customer } = useCustomerAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customer?._id) {
      const token = localStorage.getItem('customer_portal_token')
      fetch(`${API_BASE_URL}/customer-portal/journey?customerId=${customer._id}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
        .then(r => r.json())
        .then(res => setProjects(res.data?.projects || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [customer])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading projects...</div>

  const stageColors = {
    initiation: '#3B82F6', planning: '#F59E0B', design: '#8B5CF6',
    execution: '#C59C82', monitoring: '#06B6D4', closure: '#10B981', completed: '#10B981',
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F2937', margin: '0 0 24px' }}>My Projects</h1>
      {projects.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', border: '1px solid #E5E7EB' }}>
          <FolderKanban size={40} style={{ color: '#D1D5DB', marginBottom: 12 }} />
          <p style={{ color: '#6B7280', margin: 0 }}>No projects yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {projects.map(p => (
            <div key={p._id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', margin: '0 0 4px' }}>{p.title || p.projectId}</h3>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>{p.projectId}</p>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: `${stageColors[p.stage] || '#6B7280'}15`, color: stageColors[p.stage] || '#6B7280',
                }}>
                  {p.stage?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
