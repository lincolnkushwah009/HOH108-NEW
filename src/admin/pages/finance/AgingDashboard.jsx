import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, IndianRupee, Clock, Users, Briefcase, ChevronRight, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { apiRequest } from '../../utils/api'

const formatCurrency = (n) => '\u20B9' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

const BUCKET_ORDER = ['current', '1-30', '31-60', '61-90', '90+']

const bucketColors = {
  current: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  '1-30': { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  '31-60': { bg: '#FFF7ED', text: '#EA580C', border: '#FDBA74' },
  '61-90': { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' },
  '90+': { bg: '#FEF2F2', text: '#991B1B', border: '#F87171' },
}

const bucketLabels = {
  current: 'Current',
  '1-30': '1-30 Days',
  '31-60': '31-60 Days',
  '61-90': '61-90 Days',
  '90+': '90+ Days',
}

const AgingDashboard = () => {
  const toast = useToast()
  const [arData, setArData] = useState(null)
  const [apData, setApData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeSection, setActiveSection] = useState('receivable')
  const [activeBucket, setActiveBucket] = useState(null)
  const [drillView, setDrillView] = useState('customer')
  const [expandedEntity, setExpandedEntity] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const [arRes, apRes] = await Promise.all([
        apiRequest('/aging/receivable'),
        apiRequest('/aging/payable'),
      ])
      setArData(arRes.data || null)
      setApData(apRes.data || null)
    } catch (err) {
      console.error('Failed to load aging data:', err)
      toast.error('Failed to load aging data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => loadData(true)

  const handleBucketClick = (bucket) => {
    setActiveBucket(prev => prev === bucket ? null : bucket)
    setExpandedEntity(null)
  }

  const handleSectionChange = (section) => {
    setActiveSection(section)
    setActiveBucket(null)
    setExpandedEntity(null)
  }

  const handleDrillViewChange = (view) => {
    setDrillView(view)
    setExpandedEntity(null)
  }

  const currentData = activeSection === 'receivable' ? arData : apData
  const metricLabel = activeSection === 'receivable' ? 'DSO' : 'DPO'
  const metricValue = currentData?.dso ?? currentData?.dpo ?? '-'
  const entityLabel = activeSection === 'receivable'
    ? (drillView === 'customer' ? 'Customer' : 'Project')
    : (drillView === 'customer' ? 'Vendor' : 'Project')

  const getBucketAmount = (bucketId) => {
    if (!currentData?.buckets) return 0
    const bucket = currentData.buckets.find(b => b._id === bucketId)
    return bucket?.totalAmount || 0
  }

  const getBucketCount = (bucketId) => {
    if (!currentData?.buckets) return 0
    const bucket = currentData.buckets.find(b => b._id === bucketId)
    return bucket?.count || 0
  }

  const getFilteredInvoices = () => {
    if (!currentData?.invoices) return []
    if (!activeBucket) return currentData.invoices
    return currentData.invoices.filter(inv => inv.agingBucket === activeBucket)
  }

  const getGroupedData = () => {
    const invoices = getFilteredInvoices()
    const grouped = {}

    invoices.forEach(inv => {
      const key = drillView === 'customer'
        ? (inv.customerName || inv.vendorName || 'Unknown')
        : (inv.projectName || 'Unassigned')

      if (!grouped[key]) {
        grouped[key] = {
          name: key,
          totalOutstanding: 0,
          count: 0,
          invoices: [],
        }
      }
      grouped[key].totalOutstanding += (inv.balanceAmount || inv.amount || 0)
      grouped[key].count += 1
      grouped[key].invoices.push(inv)
    })

    return Object.values(grouped).sort((a, b) => b.totalOutstanding - a.totalOutstanding)
  }

  if (loading) return <PageLoader />

  const groupedData = getGroupedData()

  return (
    <div>
      <PageHeader
        title="Aging Dashboard"
        description="Accounts Receivable and Payable aging analysis with drill-down"
        breadcrumbs={[
          { label: 'Finance', path: '/admin/finance' },
          { label: 'Aging Dashboard' },
        ]}
        actions={
          <Button
            variant="outline"
            icon={RefreshCw}
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh
          </Button>
        }
      />

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: '#f1f5f9', borderRadius: '14px', padding: '4px', width: 'fit-content' }}>
        <button
          onClick={() => handleSectionChange('receivable')}
          style={{
            padding: '10px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeSection === 'receivable' ? '#C59C82' : 'transparent',
            color: activeSection === 'receivable' ? 'white' : '#64748b',
            boxShadow: activeSection === 'receivable' ? '0 2px 8px rgba(197, 156, 130, 0.3)' : 'none',
          }}
        >
          Accounts Receivable
        </button>
        <button
          onClick={() => handleSectionChange('payable')}
          style={{
            padding: '10px 24px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: activeSection === 'payable' ? '#C59C82' : 'transparent',
            color: activeSection === 'payable' ? 'white' : '#64748b',
            boxShadow: activeSection === 'payable' ? '0 2px 8px rgba(197, 156, 130, 0.3)' : 'none',
          }}
        >
          Accounts Payable
        </button>
      </div>

      {/* Total Outstanding + DSO/DPO */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <Card style={{ flex: 1, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', border: 'none' }}>
          <Card.Content style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IndianRupee style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Total Outstanding</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                {formatCurrency(currentData?.totalOutstanding || 0)}
              </div>
            </div>
          </Card.Content>
        </Card>
        <Card style={{ width: '200px', background: 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)', border: 'none' }}>
          <Card.Content style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>{metricLabel}</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                {metricValue} <span style={{ fontSize: '14px', fontWeight: '400' }}>days</span>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Bucket Cards */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '28px' }}>
        {BUCKET_ORDER.map(bucket => {
          const colors = bucketColors[bucket]
          const isActive = activeBucket === bucket
          return (
            <div
              key={bucket}
              onClick={() => handleBucketClick(bucket)}
              style={{
                flex: 1,
                padding: '18px',
                borderRadius: '16px',
                border: `2px solid ${isActive ? colors.text : colors.border}`,
                background: colors.bg,
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: isActive ? 'translateY(-2px)' : 'none',
                boxShadow: isActive ? `0 8px 20px ${colors.border}80` : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 4px 12px ${colors.border}60`
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: '600', color: colors.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                {bucketLabels[bucket]}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>
                {formatCurrency(getBucketAmount(bucket))}
              </div>
              <div style={{ fontSize: '12px', color: colors.text, opacity: 0.8 }}>
                {getBucketCount(bucket)} invoice{getBucketCount(bucket) !== 1 ? 's' : ''}
              </div>
            </div>
          )
        })}
      </div>

      {/* Drill-down View Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
            {activeBucket ? `${bucketLabels[activeBucket]} Invoices` : 'All Invoices'}
          </h3>
          {activeBucket && (
            <button
              onClick={() => { setActiveBucket(null); setExpandedEntity(null) }}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              Clear filter
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
          <button
            onClick={() => handleDrillViewChange('customer')}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: drillView === 'customer' ? 'white' : 'transparent',
              color: drillView === 'customer' ? '#1e293b' : '#64748b',
              boxShadow: drillView === 'customer' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Users style={{ width: '14px', height: '14px' }} />
            By {activeSection === 'receivable' ? 'Customer' : 'Vendor'}
          </button>
          <button
            onClick={() => handleDrillViewChange('project')}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: drillView === 'project' ? 'white' : 'transparent',
              color: drillView === 'project' ? '#1e293b' : '#64748b',
              boxShadow: drillView === 'project' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Briefcase style={{ width: '14px', height: '14px' }} />
            By Project
          </button>
        </div>
      </div>

      {/* Grouped Data Table */}
      {groupedData.length === 0 ? (
        <Card>
          <EmptyState
            title="No aging data available"
            description={activeBucket ? `No invoices found in the ${bucketLabels[activeBucket]} bucket.` : 'No outstanding invoices to display.'}
            icon={IndianRupee}
          />
        </Card>
      ) : (
        <Card padding="none">
          <Table>
            <Table.Header>
              <Table.Row hover={false}>
                <Table.Head style={{ width: '40px' }} />
                <Table.Head>{entityLabel}</Table.Head>
                <Table.Head style={{ textAlign: 'center' }}>Invoices</Table.Head>
                <Table.Head style={{ textAlign: 'right' }}>Outstanding</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {groupedData.map(entity => (
                <EntityRow
                  key={entity.name}
                  entity={entity}
                  isExpanded={expandedEntity === entity.name}
                  onToggle={() => setExpandedEntity(prev => prev === entity.name ? null : entity.name)}
                  activeSection={activeSection}
                />
              ))}
            </Table.Body>
          </Table>
        </Card>
      )}
    </div>
  )
}

const EntityRow = ({ entity, isExpanded, onToggle, activeSection }) => {
  const badgeColor = {
    current: 'green',
    '1-30': 'yellow',
    '31-60': 'orange',
    '61-90': 'red',
    '90+': 'red',
  }

  return (
    <>
      <Table.Row onClick={onToggle}>
        <Table.Cell style={{ width: '40px', padding: '12px 8px 12px 20px' }}>
          <ChevronRight style={{
            width: '16px',
            height: '16px',
            color: '#94a3b8',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }} />
        </Table.Cell>
        <Table.Cell>
          <span style={{ fontWeight: '600', color: '#1e293b' }}>{entity.name}</span>
        </Table.Cell>
        <Table.Cell style={{ textAlign: 'center' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '28px',
            height: '28px',
            borderRadius: '8px',
            background: '#FDF8F4',
            color: '#C59C82',
            fontWeight: '600',
            fontSize: '13px',
            padding: '0 8px',
          }}>
            {entity.count}
          </span>
        </Table.Cell>
        <Table.Cell style={{ textAlign: 'right' }}>
          <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
            {formatCurrency(entity.totalOutstanding)}
          </span>
        </Table.Cell>
      </Table.Row>

      {/* Expanded invoice rows */}
      {isExpanded && entity.invoices.map((inv, idx) => (
        <Table.Row key={inv._id || idx} hover={false}>
          <Table.Cell style={{ width: '40px', padding: '10px 8px 10px 20px' }} />
          <Table.Cell>
            <div style={{ paddingLeft: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: '#64748b', fontFamily: 'monospace' }}>
                  {inv.invoiceNumber || inv.referenceNumber || '-'}
                </span>
                {inv.agingBucket && (
                  <Badge color={badgeColor[inv.agingBucket] || 'gray'} size="sm">
                    {inv.agingBucket}
                  </Badge>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                {inv.dueDate ? ` | Due: ${new Date(inv.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
              </div>
            </div>
          </Table.Cell>
          <Table.Cell style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {inv.daysOverdue != null ? `${inv.daysOverdue}d` : '-'}
            </span>
          </Table.Cell>
          <Table.Cell style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              {formatCurrency(inv.balanceAmount || inv.amount || 0)}
            </span>
          </Table.Cell>
        </Table.Row>
      ))}
    </>
  )
}

export default AgingDashboard
