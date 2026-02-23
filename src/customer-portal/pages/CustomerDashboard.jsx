import { useState, useEffect } from 'react'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { Calendar, CheckCircle, FileText, Palette, FolderKanban, CreditCard } from 'lucide-react'

const API_BASE_URL = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

const apiRequest = async (endpoint) => {
  const token = localStorage.getItem('customer_portal_token')
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request failed')
  return data
}

const typeIcons = {
  lead_created: Calendar,
  lead_qualified: CheckCircle,
  meeting: Calendar,
  design: Palette,
  sales_order: FileText,
  design_iteration: Palette,
  project: FolderKanban,
  invoice: CreditCard,
}

const typeColors = {
  lead_created: '#3B82F6',
  lead_qualified: '#10B981',
  meeting: '#F59E0B',
  design: '#8B5CF6',
  sales_order: '#C59C82',
  design_iteration: '#8B5CF6',
  project: '#06B6D4',
  invoice: '#EF4444',
}

export default function CustomerDashboard() {
  const { customer } = useCustomerAuth()
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customer?._id) {
      apiRequest(`/customer-portal/journey?customerId=${customer._id}`)
        .then(res => setJourney(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [customer])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading your journey...</div>

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F2937', margin: '0 0 24px' }}>Your Journey</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Sales Orders', value: journey?.salesOrders?.length || 0, color: '#C59C82' },
          { label: 'Design Iterations', value: journey?.designIterations?.length || 0, color: '#8B5CF6' },
          { label: 'Projects', value: journey?.projects?.length || 0, color: '#06B6D4' },
          { label: 'Invoices', value: journey?.invoices?.length || 0, color: '#EF4444' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: stat.color, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', margin: '0 0 20px' }}>Engagement Timeline</h2>
        {journey?.timeline?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {journey.timeline.map((event, i) => {
              const Icon = typeIcons[event.type] || Calendar
              const color = typeColors[event.type] || '#6B7280'
              return (
                <div key={i} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: `${color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={16} style={{ color }} />
                    </div>
                    {i < journey.timeline.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: '#E5E7EB', minHeight: 24 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: 24 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', margin: '0 0 2px' }}>{event.title}</p>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px' }}>{event.description}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                      {event.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#9CA3AF', padding: 20 }}>No activity yet</p>
        )}
      </div>
    </div>
  )
}
