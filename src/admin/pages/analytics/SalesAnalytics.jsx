import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Download,
  Filter,
  BarChart3,
  Target,
} from 'lucide-react'
import { Card, Table, Badge, Button } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const FunnelBar = ({ label, value, maxValue, index, totalSteps }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
  // Funnel narrows from top to bottom
  const widthPercent = 100 - (index / totalSteps) * 40

  const colors = ['#3B82F6', '#6366F1', '#8B5CF6', '#C59C82', '#059669', '#F59E0B']
  const color = colors[index % colors.length]

  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: `${widthPercent}%`,
          margin: '0 auto',
          background: `${color}20`,
          borderRadius: '8px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${percentage}%`,
            background: `${color}30`,
            borderRadius: '8px',
            transition: 'width 0.6s ease',
          }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', position: 'relative', zIndex: 1 }}>
            {label}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '700', color, position: 'relative', zIndex: 1 }}>
            {value}
          </span>
        </div>
      </div>
    </div>
  )
}

const HorizontalBar = ({ label, value, maxValue, color = '#C59C82', displayValue }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{displayValue || value}</span>
      </div>
      <div style={{
        height: '10px',
        background: '#f1f5f9',
        borderRadius: '5px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          borderRadius: '5px',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

const SalesAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [pipelineData, setPipelineData] = useState(null)
  const [leadPerformance, setLeadPerformance] = useState(null)
  const [forecastData, setForecastData] = useState(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [pipelineResult, performanceResult, forecastResult] = await Promise.allSettled([
        apiRequest('/analytics/sales-pipeline'),
        apiRequest('/analytics/lead-performance'),
        apiRequest('/analytics/sales-forecast'),
      ])

      if (pipelineResult.status === 'fulfilled' && pipelineResult.value.success) {
        setPipelineData(pipelineResult.value.data)
      }
      if (performanceResult.status === 'fulfilled' && performanceResult.value.success) {
        setLeadPerformance(performanceResult.value.data)
      }
      if (forecastResult.status === 'fulfilled' && forecastResult.value.success) {
        setForecastData(forecastResult.value.data)
      }
    } catch (err) {
      console.error('Failed to load sales analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const data = await apiRequest('/analytics/export?type=sales-pipeline&format=json')

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-pipeline-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <PageLoader />

  // Funnel stages
  const funnelStages = pipelineData?.stages || pipelineData?.pipeline || pipelineData?.funnel || []
  const maxFunnelValue = funnelStages.length > 0
    ? Math.max(...funnelStages.map((s) => s.count || s.value || 0))
    : 0

  // Lead sources
  const leadSources = leadPerformance?.sources || leadPerformance?.bySource || []

  // Pipeline value by stage
  const pipelineValues = pipelineData?.stageValues || pipelineData?.stages || []
  const maxPipelineValue = pipelineValues.length > 0
    ? Math.max(...pipelineValues.map((s) => s.totalValue || s.value || 0))
    : 0

  return (
    <div>
      <PageHeader
        title="Sales Analytics"
        description="Conversion funnel, lead performance, and pipeline insights"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Analytics', path: '/admin/analytics' },
          { label: 'Sales' },
        ]}
        actions={
          <Button
            onClick={handleExport}
            disabled={exporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#C59C82',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <Download style={{ width: 16, height: 16 }} />
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
        }
      />

      {/* Lead Conversion Funnel */}
      <Card style={{ marginBottom: '24px' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Card.Title>Lead Conversion Funnel</Card.Title>
              <Card.Description>Lead progression through pipeline stages</Card.Description>
            </div>
            <Target style={{ width: 20, height: 20, color: '#94a3b8' }} />
          </div>
        </Card.Header>
        <Card.Content style={{ padding: '0' }}>
          {funnelStages.length > 0 ? (
            <div style={{ padding: '8px 0' }}>
              {funnelStages.map((stage, index) => (
                <FunnelBar
                  key={stage.name || stage.stage || stage._id}
                  label={stage.name || stage.stage || stage._id}
                  value={stage.count || stage.value || 0}
                  maxValue={maxFunnelValue}
                  index={index}
                  totalSteps={funnelStages.length}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="No funnel data"
              description="Lead funnel data will appear here once leads are tracked."
            />
          )}
        </Card.Content>
      </Card>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {/* Lead Source ROI */}
        <Card>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Card.Title>Lead Source ROI</Card.Title>
                <Card.Description>Performance breakdown by lead source</Card.Description>
              </div>
              <TrendingUp style={{ width: 20, height: 20, color: '#94a3b8' }} />
            </div>
          </Card.Header>
          <Card.Content style={{ padding: '0' }}>
            {leadSources.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Count</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversions</th>
                      <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadSources.map((source, index) => {
                      const count = source.count || source.total || 0
                      const conversions = source.conversions || source.converted || 0
                      const rate = count > 0 ? ((conversions / count) * 100).toFixed(1) : '0.0'

                      return (
                        <tr
                          key={source.name || source.source || source._id || index}
                          style={{ borderBottom: '1px solid #f8fafc' }}
                        >
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                            {source.name || source.source || source._id}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>
                            {count}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569', textAlign: 'center' }}>
                            {conversions}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <Badge
                              color={parseFloat(rate) >= 30 ? 'green' : parseFloat(rate) >= 15 ? 'yellow' : 'red'}
                              size="sm"
                            >
                              {rate}%
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
                No lead source data available
              </p>
            )}
          </Card.Content>
        </Card>

        {/* Pipeline Value by Stage */}
        <Card>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Card.Title>Pipeline Value by Stage</Card.Title>
                <Card.Description>Estimated deal value at each stage</Card.Description>
              </div>
              <BarChart3 style={{ width: 20, height: 20, color: '#94a3b8' }} />
            </div>
          </Card.Header>
          <Card.Content style={{ padding: '0 4px' }}>
            {pipelineValues.length > 0 ? (
              pipelineValues.map((stage) => {
                const stageName = stage.name || stage.stage || stage._id
                const stageValue = stage.totalValue || stage.value || 0

                return (
                  <HorizontalBar
                    key={stageName}
                    label={stageName}
                    value={stageValue}
                    maxValue={maxPipelineValue}
                    displayValue={formatCurrency(stageValue)}
                    color="#C59C82"
                  />
                )
              })
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
                No pipeline value data available
              </p>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Sales Forecast */}
      {forecastData && (
        <Card>
          <Card.Header>
            <div>
              <Card.Title>Sales Forecast</Card.Title>
              <Card.Description>Projected sales based on current pipeline</Card.Description>
            </div>
          </Card.Header>
          <Card.Content style={{ padding: '0' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}>
              <div style={{
                padding: '20px',
                background: '#ecfdf5',
                borderRadius: '14px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '500' }}>Best Case</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#059669', margin: '4px 0 0' }}>
                  {formatCurrency(forecastData.bestCase || forecastData.optimistic || 0)}
                </p>
              </div>
              <div style={{
                padding: '20px',
                background: '#FDF8F4',
                borderRadius: '14px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '500' }}>Most Likely</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#C59C82', margin: '4px 0 0' }}>
                  {formatCurrency(forecastData.mostLikely || forecastData.expected || 0)}
                </p>
              </div>
              <div style={{
                padding: '20px',
                background: '#fef2f2',
                borderRadius: '14px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0, fontWeight: '500' }}>Worst Case</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#dc2626', margin: '4px 0 0' }}>
                  {formatCurrency(forecastData.worstCase || forecastData.pessimistic || 0)}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  )
}

export default SalesAnalytics
