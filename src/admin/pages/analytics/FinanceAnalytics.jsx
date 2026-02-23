import { useState, useEffect } from 'react'
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Wallet,
} from 'lucide-react'
import { Card, Badge } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const FinanceAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [financeData, setFinanceData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadFinanceData()
  }, [])

  const loadFinanceData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest('/analytics/finance-summary')
      if (data.success) {
        setFinanceData(data.data)
      }
    } catch (err) {
      console.error('Failed to load finance analytics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader />

  if (error && !financeData) {
    return (
      <div>
        <PageHeader
          title="Finance Analytics"
          description="Profit & Loss, AR/AP aging, and cash flow analysis"
          breadcrumbs={[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Analytics', path: '/admin/analytics' },
            { label: 'Finance' },
          ]}
        />
        <EmptyState
          icon={IndianRupee}
          title="Unable to load finance data"
          description={error}
        />
      </div>
    )
  }

  const revenue = financeData?.totalRevenue || financeData?.revenue || 0
  const expenses = financeData?.totalExpenses || financeData?.expenses || 0
  const netProfit = revenue - expenses
  const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0

  // AR/AP aging data (use from API or placeholder)
  const arAging = financeData?.arAging || financeData?.accountsReceivable || {
    current: 0,
    '30days': 0,
    '60days': 0,
    '90days': 0,
    total: 0,
  }

  const apAging = financeData?.apAging || financeData?.accountsPayable || {
    current: 0,
    '30days': 0,
    '60days': 0,
    '90days': 0,
    total: 0,
  }

  // Cash flow monthly data (use from API or placeholder)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const cashFlowData = financeData?.cashFlow || financeData?.monthlyTrend || months.map((m, i) => ({
    month: m,
    inflow: 0,
    outflow: 0,
  }))

  const maxCashFlow = Math.max(
    ...cashFlowData.map((d) => Math.max(d.inflow || 0, d.outflow || 0, 1))
  )

  // AR/AP aging buckets for rendering
  const agingBuckets = [
    { label: 'Current', key: 'current' },
    { label: '1-30 Days', key: '30days' },
    { label: '31-60 Days', key: '60days' },
    { label: '90+ Days', key: '90days' },
  ]

  return (
    <div>
      <PageHeader
        title="Finance Analytics"
        description="Profit & Loss, AR/AP aging, and cash flow analysis"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Analytics', path: '/admin/analytics' },
          { label: 'Finance' },
        ]}
      />

      {/* P&L Summary */}
      <Card style={{ marginBottom: '24px' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Card.Title>Profit & Loss Summary</Card.Title>
              <Card.Description>Revenue, expenses, and net profit overview</Card.Description>
            </div>
            <IndianRupee style={{ width: 20, height: 20, color: '#94a3b8' }} />
          </div>
        </Card.Header>
        <Card.Content style={{ padding: '0' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
          }}>
            {/* Revenue */}
            <div style={{
              padding: '24px',
              background: '#ecfdf5',
              borderRadius: '16px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <ArrowUpRight style={{ width: 22, height: 22, color: 'white' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>Total Revenue</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: '#059669', margin: '4px 0 0' }}>
                {formatCurrency(revenue)}
              </p>
            </div>

            {/* Expenses */}
            <div style={{
              padding: '24px',
              background: '#fef2f2',
              borderRadius: '16px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <ArrowDownRight style={{ width: 22, height: 22, color: 'white' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>Total Expenses</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: '#dc2626', margin: '4px 0 0' }}>
                {formatCurrency(expenses)}
              </p>
            </div>

            {/* Net Profit */}
            <div style={{
              padding: '24px',
              background: netProfit >= 0 ? '#FDF8F4' : '#fef2f2',
              borderRadius: '16px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: netProfit >= 0 ? '#C59C82' : '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Wallet style={{ width: 22, height: 22, color: 'white' }} />
              </div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>Net Profit</p>
              <p style={{
                fontSize: '26px',
                fontWeight: '700',
                color: netProfit >= 0 ? '#C59C82' : '#dc2626',
                margin: '4px 0 0',
              }}>
                {formatCurrency(netProfit)}
              </p>
              <Badge
                color={parseFloat(profitMargin) >= 20 ? 'green' : parseFloat(profitMargin) >= 0 ? 'yellow' : 'red'}
                size="sm"
              >
                {profitMargin}% margin
              </Badge>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* AR/AP Aging */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {/* Accounts Receivable Aging */}
        <Card>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Card.Title>Accounts Receivable Aging</Card.Title>
                <Card.Description>Outstanding amounts owed by clients</Card.Description>
              </div>
              <TrendingUp style={{ width: 20, height: 20, color: '#059669' }} />
            </div>
          </Card.Header>
          <Card.Content style={{ padding: '0' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                padding: '16px',
                background: '#ecfdf5',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Total AR</span>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#059669', margin: '4px 0 0' }}>
                  {formatCurrency(arAging.total || Object.values(arAging).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0))}
                </p>
              </div>
              {agingBuckets.map((bucket) => {
                const val = arAging[bucket.key] || 0
                const total = arAging.total || 1

                return (
                  <div key={bucket.key} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>{bucket.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{formatCurrency(val)}</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: '#f1f5f9',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${total > 0 ? (val / total) * 100 : 0}%`,
                        background: bucket.key === 'current' ? '#059669' : bucket.key === '30days' ? '#d97706' : bucket.key === '60days' ? '#ea580c' : '#dc2626',
                        borderRadius: '4px',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card.Content>
        </Card>

        {/* Accounts Payable Aging */}
        <Card>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Card.Title>Accounts Payable Aging</Card.Title>
                <Card.Description>Outstanding amounts owed to vendors</Card.Description>
              </div>
              <TrendingDown style={{ width: 20, height: 20, color: '#dc2626' }} />
            </div>
          </Card.Header>
          <Card.Content style={{ padding: '0' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                padding: '16px',
                background: '#fef2f2',
                borderRadius: '12px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Total AP</span>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#dc2626', margin: '4px 0 0' }}>
                  {formatCurrency(apAging.total || Object.values(apAging).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0))}
                </p>
              </div>
              {agingBuckets.map((bucket) => {
                const val = apAging[bucket.key] || 0
                const total = apAging.total || 1

                return (
                  <div key={bucket.key} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>{bucket.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{formatCurrency(val)}</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: '#f1f5f9',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${total > 0 ? (val / total) * 100 : 0}%`,
                        background: bucket.key === 'current' ? '#3B82F6' : bucket.key === '30days' ? '#d97706' : bucket.key === '60days' ? '#ea580c' : '#dc2626',
                        borderRadius: '4px',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Cash Flow Trend */}
      <Card>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Card.Title>Cash Flow Trend</Card.Title>
              <Card.Description>Monthly inflow vs outflow comparison</Card.Description>
            </div>
            <Clock style={{ width: 20, height: 20, color: '#94a3b8' }} />
          </div>
        </Card.Header>
        <Card.Content style={{ padding: '0' }}>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#059669' }} />
              <span style={{ fontSize: '13px', color: '#64748b' }}>Inflow</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#dc2626' }} />
              <span style={{ fontSize: '13px', color: '#64748b' }}>Outflow</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            height: '200px',
            padding: '0 4px',
          }}>
            {cashFlowData.map((item, index) => {
              const monthLabel = item.month || months[index] || `M${index + 1}`
              const inflow = item.inflow || 0
              const outflow = item.outflow || 0
              const inflowHeight = maxCashFlow > 0 ? (inflow / maxCashFlow) * 160 : 4
              const outflowHeight = maxCashFlow > 0 ? (outflow / maxCashFlow) * 160 : 4

              return (
                <div key={monthLabel} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '160px' }}>
                    <div style={{
                      width: '14px',
                      background: '#059669',
                      borderRadius: '4px 4px 0 0',
                      height: `${Math.max(inflowHeight, 4)}px`,
                      transition: 'height 0.4s ease',
                    }} />
                    <div style={{
                      width: '14px',
                      background: '#dc2626',
                      borderRadius: '4px 4px 0 0',
                      height: `${Math.max(outflowHeight, 4)}px`,
                      transition: 'height 0.4s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{monthLabel}</span>
                </div>
              )
            })}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}

export default FinanceAnalytics
