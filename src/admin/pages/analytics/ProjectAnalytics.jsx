import { useState, useEffect } from 'react'
import {
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import { Card, Badge } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const ProjectAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [portfolioData, setPortfolioData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProjectData()
  }, [])

  const loadProjectData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest('/analytics/project-portfolio')
      if (data.success) {
        setPortfolioData(data.data)
      }
    } catch (err) {
      console.error('Failed to load project analytics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader />

  if (error && !portfolioData) {
    return (
      <div>
        <PageHeader
          title="Project Analytics"
          description="Portfolio health, stage distribution, and budget analysis"
          breadcrumbs={[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Analytics', path: '/admin/analytics' },
            { label: 'Projects' },
          ]}
        />
        <EmptyState
          icon={FolderKanban}
          title="Unable to load project data"
          description={error}
        />
      </div>
    )
  }

  // Portfolio health metrics
  const totalProjects = portfolioData?.totalProjects || 0
  const activeProjects = portfolioData?.activeProjects || 0
  const completedProjects = portfolioData?.completedProjects || 0
  const onTrack = portfolioData?.onTrack || 0
  const atRisk = portfolioData?.atRisk || 0
  const delayed = portfolioData?.delayed || 0

  // Projects by stage
  const projectStages = portfolioData?.stages || portfolioData?.byStage || []

  const stageColors = {
    'New': '#3B82F6',
    'Planning': '#8B5CF6',
    'Design': '#EC4899',
    'In Progress': '#C59C82',
    'Execution': '#F59E0B',
    'Review': '#06B6D4',
    'On Hold': '#d97706',
    'Completed': '#059669',
    'Cancelled': '#dc2626',
  }

  const getStageColor = (stageName) => {
    return stageColors[stageName] || '#64748b'
  }

  const getStageIcon = (stageName) => {
    if (stageName === 'Completed') return CheckCircle2
    if (stageName === 'On Hold' || stageName === 'Cancelled') return AlertCircle
    return Clock
  }

  // Budget data
  const budgetData = portfolioData?.budgetVariance || portfolioData?.projects || []
  const maxBudget = budgetData.length > 0
    ? Math.max(...budgetData.map((p) => Math.max(p.budget || 0, p.spent || p.actualCost || 0)))
    : 0

  return (
    <div>
      <PageHeader
        title="Project Analytics"
        description="Portfolio health, stage distribution, and budget analysis"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Analytics', path: '/admin/analytics' },
          { label: 'Projects' },
        ]}
      />

      {/* Portfolio Health Overview */}
      <Card style={{ marginBottom: '24px' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Card.Title>Portfolio Health Overview</Card.Title>
              <Card.Description>High-level project portfolio metrics</Card.Description>
            </div>
            <FolderKanban style={{ width: 20, height: 20, color: '#94a3b8' }} />
          </div>
        </Card.Header>
        <Card.Content style={{ padding: '0' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
          }}>
            <div style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '14px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{totalProjects}</p>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: '500' }}>Total Projects</p>
            </div>
            <div style={{
              padding: '20px',
              background: '#eff6ff',
              borderRadius: '14px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#3B82F6', margin: 0 }}>{activeProjects}</p>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: '500' }}>Active</p>
            </div>
            <div style={{
              padding: '20px',
              background: '#ecfdf5',
              borderRadius: '14px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#059669', margin: 0 }}>{completedProjects}</p>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: '500' }}>Completed</p>
            </div>
            <div style={{
              padding: '20px',
              background: '#ecfdf5',
              borderRadius: '14px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#059669', margin: 0 }}>{onTrack}</p>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: '500' }}>On Track</p>
            </div>
            <div style={{
              padding: '20px',
              background: '#fffbeb',
              borderRadius: '14px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#d97706', margin: 0 }}>{atRisk}</p>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: '500' }}>At Risk</p>
            </div>
            <div style={{
              padding: '20px',
              background: '#fef2f2',
              borderRadius: '14px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626', margin: 0 }}>{delayed}</p>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: '500' }}>Delayed</p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Projects by Stage */}
      <Card style={{ marginBottom: '24px' }}>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Card.Title>Projects by Stage</Card.Title>
              <Card.Description>Distribution of projects across pipeline stages</Card.Description>
            </div>
            <BarChart3 style={{ width: 20, height: 20, color: '#94a3b8' }} />
          </div>
        </Card.Header>
        <Card.Content style={{ padding: '0' }}>
          {projectStages.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
            }}>
              {projectStages.map((stage) => {
                const stageName = stage.name || stage.stage || stage._id
                const stageCount = stage.count || stage.value || 0
                const color = getStageColor(stageName)
                const StageIcon = getStageIcon(stageName)

                return (
                  <div
                    key={stageName}
                    style={{
                      padding: '20px',
                      background: `${color}10`,
                      borderRadius: '16px',
                      borderLeft: `4px solid ${color}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: `${color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <StageIcon style={{ width: 18, height: 18, color }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{stageName}</span>
                    </div>
                    <p style={{ fontSize: '28px', fontWeight: '700', color, margin: 0 }}>
                      {stageCount}
                    </p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>
                      {stageCount === 1 ? 'project' : 'projects'}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No stage data"
              description="Project stage distribution will appear here once projects are created."
            />
          )}
        </Card.Content>
      </Card>

      {/* Budget Variance */}
      <Card>
        <Card.Header>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Card.Title>Budget Variance</Card.Title>
              <Card.Description>Budgeted vs actual spend per project</Card.Description>
            </div>
            <TrendingUp style={{ width: 20, height: 20, color: '#94a3b8' }} />
          </div>
        </Card.Header>
        <Card.Content style={{ padding: '0' }}>
          {budgetData.length > 0 ? (
            <div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#C59C82' }} />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Budget</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3B82F6' }} />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Spent</span>
                </div>
              </div>

              {budgetData.slice(0, 10).map((project, index) => {
                const name = project.name || project.projectName || `Project ${index + 1}`
                const budget = project.budget || 0
                const spent = project.spent || project.actualCost || 0
                const budgetWidth = maxBudget > 0 ? (budget / maxBudget) * 100 : 0
                const spentWidth = maxBudget > 0 ? (spent / maxBudget) * 100 : 0
                const overBudget = spent > budget
                const variance = budget > 0 ? (((spent - budget) / budget) * 100).toFixed(1) : 0

                return (
                  <div key={project._id || index} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{name}</span>
                      <Badge
                        color={overBudget ? 'red' : 'green'}
                        size="sm"
                      >
                        {overBudget ? `+${Math.abs(variance)}%` : `${Math.abs(variance)}% under`}
                      </Badge>
                    </div>
                    {/* Budget bar */}
                    <div style={{ marginBottom: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Budget</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatCurrency(budget)}</span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: '#f1f5f9',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${budgetWidth}%`,
                          background: '#C59C82',
                          borderRadius: '4px',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                    {/* Spent bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Spent</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{formatCurrency(spent)}</span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: '#f1f5f9',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${spentWidth}%`,
                          background: overBudget ? '#dc2626' : '#3B82F6',
                          borderRadius: '4px',
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No budget data"
              description="Budget variance data will appear here once project budgets are set."
            />
          )}
        </Card.Content>
      </Card>
    </div>
  )
}

export default ProjectAnalytics
