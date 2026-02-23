import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, FileText, Lock, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Badge } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { apiRequest } from '../../utils/api'
import { formatDate } from '../../utils/helpers'

const ComplianceDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dpdpStats, setDpdpStats] = useState({ totalConsents: 0, pendingDSRs: 0 })
  const [gstStats, setGstStats] = useState({ eInvoices: 0, returnsPrepared: 0 })
  const [soxStats, setSoxStats] = useState({ sodConflicts: 0, accessReviews: 0 })
  const [activities, setActivities] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [consentsRes, invoicesRes, soxRes] = await Promise.allSettled([
        apiRequest('/privacy/consents?limit=1'),
        apiRequest('/gst/e-invoices?limit=1'),
        apiRequest('/sox/dashboard'),
      ])

      if (consentsRes.status === 'fulfilled') {
        const data = consentsRes.value
        setDpdpStats({
          totalConsents: data.pagination?.total || data.total || 0,
          pendingDSRs: data.pendingDSRs || 0,
        })
      }

      if (invoicesRes.status === 'fulfilled') {
        const data = invoicesRes.value
        setGstStats({
          eInvoices: data.pagination?.total || data.total || 0,
          returnsPrepared: data.returnsPrepared || 0,
        })
      }

      if (soxRes.status === 'fulfilled') {
        const data = soxRes.value
        setSoxStats({
          sodConflicts: data.sodConflicts || 0,
          accessReviews: data.accessReviews || 0,
        })
        if (data.recentActivities) {
          setActivities(data.recentActivities)
        }
      }
    } catch (err) {
      console.error('Failed to load compliance dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const placeholderActivities = [
    { id: 1, type: 'consent', message: 'New marketing consent recorded', date: new Date().toISOString(), icon: CheckCircle },
    { id: 2, type: 'dsr', message: 'Data erasure request submitted', date: new Date(Date.now() - 3600000).toISOString(), icon: FileText },
    { id: 3, type: 'gst', message: 'E-Invoice generated for INV-2024-0042', date: new Date(Date.now() - 7200000).toISOString(), icon: FileText },
    { id: 4, type: 'sox', message: 'SoD conflict detected for user role assignment', date: new Date(Date.now() - 86400000).toISOString(), icon: AlertTriangle },
    { id: 5, type: 'review', message: 'Access review campaign completed', date: new Date(Date.now() - 172800000).toISOString(), icon: Lock },
  ]

  const timelineItems = activities.length > 0 ? activities : placeholderActivities

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Compliance Dashboard"
        description="DPDP, GST, and SOX compliance overview"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Compliance' },
        ]}
      />

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {/* DPDP Card */}
        <Card>
          <Card.Header title="DPDP Status" />
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#EDE9FE', borderRadius: '10px' }}>
                <Shield style={{ width: '24px', height: '24px', color: '#7C3AED' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{dpdpStats.totalConsents}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Total Consents</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#f59e0b' }}>{dpdpStats.pendingDSRs}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Pending DSRs</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/admin/compliance/consents')}
              >
                Manage
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* GST Card */}
        <Card>
          <Card.Header title="GST Status" />
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#DCFCE7', borderRadius: '10px' }}>
                <FileText style={{ width: '24px', height: '24px', color: '#16A34A' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{gstStats.eInvoices}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>E-Invoices Generated</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#3b82f6' }}>{gstStats.returnsPrepared}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Returns Prepared</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/admin/compliance/e-invoices')}
              >
                Manage
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* SOX Card */}
        <Card>
          <Card.Header title="SOX Status" />
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: '#FEF3C7', borderRadius: '10px' }}>
                <Lock style={{ width: '24px', height: '24px', color: '#D97706' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{soxStats.sodConflicts}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>SoD Conflicts</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#8b5cf6' }}>{soxStats.accessReviews}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Access Reviews</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/admin/compliance/sod-review')}
              >
                Manage
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <Card.Header title="Quick Actions" />
        <Card.Content style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Button variant="outline" icon={Shield} onClick={() => navigate('/admin/compliance/consents')}>
              Record Consent
            </Button>
            <Button variant="outline" icon={FileText} onClick={() => navigate('/admin/compliance/dsr')}>
              New DSR
            </Button>
            <Button variant="outline" icon={FileText} onClick={() => navigate('/admin/compliance/e-invoices')}>
              Generate E-Invoice
            </Button>
            <Button variant="outline" icon={FileText} onClick={() => navigate('/admin/compliance/gst-returns')}>
              Prepare GSTR-1
            </Button>
            <Button variant="outline" icon={AlertTriangle} onClick={() => navigate('/admin/compliance/sod-review')}>
              Run SoD Scan
            </Button>
            <Button variant="outline" icon={Lock} onClick={() => navigate('/admin/compliance/access-reviews')}>
              New Access Review
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <Card.Header title="Recent Compliance Activity" />
        <Card.Content style={{ padding: 20 }}>
          {timelineItems.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>No recent activity</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {timelineItems.map((item, index) => {
                const IconComponent = item.icon || Clock
                return (
                  <div
                    key={item.id || index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      padding: '14px 0',
                      borderBottom: index < timelineItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                  >
                    <div
                      style={{
                        padding: '8px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent style={{ width: '16px', height: '16px', color: '#C59C82' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                        {item.message}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                        {formatDate(item.date)}
                      </p>
                    </div>
                    <Badge color={
                      item.type === 'consent' ? 'green' :
                      item.type === 'dsr' ? 'blue' :
                      item.type === 'gst' ? 'purple' :
                      item.type === 'sox' ? 'red' :
                      'gray'
                    }>
                      {item.type?.toUpperCase()}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}

export default ComplianceDashboard
