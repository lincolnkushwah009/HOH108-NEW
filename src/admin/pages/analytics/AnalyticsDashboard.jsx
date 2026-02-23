import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IndianRupee,
  FolderKanban,
  TrendingUp,
  Users,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react'
import { Card } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const MetricCard = ({ icon: Icon, label, value, subtext, color, onClick }) => {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '20px',
        border: '1px solid #f1f5f9',
        boxShadow: hovered ? '0 10px 25px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
        padding: '24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon style={{ width: 24, height: 24, color }} />
        </div>
        {onClick && (
          <ArrowUpRight style={{ width: 18, height: 18, color: '#94a3b8' }} />
        )}
      </div>
      <div style={{ marginTop: '16px' }}>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>{label}</p>
        <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '4px 0 0' }}>{value}</h3>
        {subtext && (
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>{subtext}</p>
        )}
      </div>
    </div>
  )
}

const HorizontalBar = ({ label, value, maxValue, color = '#C59C82' }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{value}</span>
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

const AnalyticsDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState(null)
  const [financeData, setFinanceData] = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [hrData, setHrData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const [salesResult, financeResult, projectResult, hrResult] = await Promise.allSettled([
        apiRequest('/analytics/sales-pipeline'),
        apiRequest('/analytics/finance-summary'),
        apiRequest('/analytics/project-portfolio'),
        apiRequest('/analytics/hr-dashboard'),
      ])

      if (salesResult.status === 'fulfilled' && salesResult.value.success) {
        setSalesData(salesResult.value.data)
      }
      if (financeResult.status === 'fulfilled' && financeResult.value.success) {
        setFinanceData(financeResult.value.data)
      }
      if (projectResult.status === 'fulfilled' && projectResult.value.success) {
        setProjectData(projectResult.value.data)
      }
      if (hrResult.status === 'fulfilled' && hrResult.value.success) {
        setHrData(hrResult.value.data)
      }
    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader />

  // Derive metrics
  const totalRevenue = financeData?.totalRevenue || financeData?.revenue || 0
  const activeProjects = projectData?.activeProjects || projectData?.totalProjects || 0
  const conversionRate = salesData?.conversionRate || 0
  const employeeCount = hrData?.totalEmployees || hrData?.headcount || 0

  // Sales pipeline stages
  const pipelineStages = salesData?.stages || salesData?.pipeline || []
  const maxStageValue = pipelineStages.length > 0
    ? Math.max(...pipelineStages.map((s) => s.count || s.value || 0))
    : 0

  // Finance: Revenue vs Expenses
  const revenue = financeData?.totalRevenue || financeData?.revenue || 0
  const expenses = financeData?.totalExpenses || financeData?.expenses || 0
  const maxFinance = Math.max(revenue, expenses, 1)

  // Project health stages
  const projectStages = projectData?.stages || projectData?.byStage || []

  const stageColors = {
    'New': '#3B82F6',
    'In Progress': '#C59C82',
    'On Hold': '#d97706',
    'Completed': '#059669',
    'Cancelled': '#dc2626',
    'Planning': '#8B5CF6',
    'Design': '#EC4899',
    'Execution': '#F59E0B',
    'Review': '#06B6D4',
  }

  const getStageColor = (stageName) => {
    return stageColors[stageName] || '#64748b'
  }

  return (
    <div>
      <PageHeader
        title="Analytics Dashboard"
        description="Overview of key business metrics and performance indicators"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Analytics' },
        ]}
      />

      {/* Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <MetricCard
          icon={IndianRupee}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtext="All time revenue"
          color="#059669"
          onClick={() => navigate('/admin/analytics/finance')}
        />
        <MetricCard
          icon={FolderKanban}
          label="Active Projects"
          value={activeProjects}
          subtext="Currently in progress"
          color="#3B82F6"
          onClick={() => navigate('/admin/analytics/projects')}
        />
        <MetricCard
          icon={TrendingUp}
          label="Lead Conversion Rate"
          value={`${conversionRate}%`}
          subtext="Leads to customers"
          color="#C59C82"
          onClick={() => navigate('/admin/analytics/sales')}
        />
        <MetricCard
          icon={Users}
          label="Employee Count"
          value={employeeCount}
          subtext="Total headcount"
          color="#8B5CF6"
          onClick={() => navigate('/admin/analytics/hr')}
        />
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {/* Sales Pipeline */}
        <Card>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Card.Title>Sales Pipeline</Card.Title>
                <Card.Description>Leads by stage</Card.Description>
              </div>
              <BarChart3 style={{ width: 20, height: 20, color: '#94a3b8' }} />
            </div>
          </Card.Header>
          <Card.Content style={{ padding: '0 4px' }}>
            {pipelineStages.length > 0 ? (
              pipelineStages.map((stage) => (
                <HorizontalBar
                  key={stage.name || stage.stage || stage._id}
                  label={stage.name || stage.stage || stage._id}
                  value={stage.count || stage.value || 0}
                  maxValue={maxStageValue}
                  color={getStageColor(stage.name || stage.stage || stage._id)}
                />
              ))
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                No pipeline data available
              </p>
            )}
          </Card.Content>
        </Card>

        {/* Revenue vs Expenses */}
        <Card>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Card.Title>Finance Summary</Card.Title>
                <Card.Description>Revenue vs Expenses</Card.Description>
              </div>
              <IndianRupee style={{ width: 20, height: 20, color: '#94a3b8' }} />
            </div>
          </Card.Header>
          <Card.Content style={{ padding: '0 4px' }}>
            <HorizontalBar
              label="Revenue"
              value={formatCurrency(revenue)}
              maxValue={maxFinance}
              color="#059669"
            />
            <HorizontalBar
              label="Expenses"
              value={formatCurrency(expenses)}
              maxValue={maxFinance}
              color="#dc2626"
            />
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: revenue - expenses >= 0 ? '#ecfdf5' : '#fef2f2',
              borderRadius: '12px',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Net Profit</span>
              <p style={{
                fontSize: '24px',
                fontWeight: '700',
                color: revenue - expenses >= 0 ? '#059669' : '#dc2626',
                margin: '4px 0 0',
              }}>
                {formatCurrency(revenue - expenses)}
              </p>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Project Health */}
      <Card>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Card.Title>Project Health</Card.Title>
              <Card.Description>Projects by stage with color-coded status</Card.Description>
            </div>
            <FolderKanban style={{ width: 20, height: 20, color: '#94a3b8' }} />
          </div>
        </Card.Header>
        <Card.Content style={{ padding: '0' }}>
          {projectStages.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '16px',
            }}>
              {projectStages.map((stage) => {
                const stageName = stage.name || stage.stage || stage._id
                const stageCount = stage.count || stage.value || 0
                const color = getStageColor(stageName)

                return (
                  <div
                    key={stageName}
                    style={{
                      padding: '20px',
                      background: `${color}10`,
                      borderRadius: '14px',
                      borderLeft: `4px solid ${color}`,
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '28px', fontWeight: '700', color, margin: 0 }}>
                      {stageCount}
                    </p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: '500' }}>
                      {stageName}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
              No project data available
            </p>
          )}
        </Card.Content>
      </Card>
    </div>
  )
}

export default AnalyticsDashboard
