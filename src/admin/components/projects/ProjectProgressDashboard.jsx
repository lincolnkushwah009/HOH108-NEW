import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, IndianRupee, CheckCircle, Clock, AlertTriangle, ListTodo } from 'lucide-react'
import { projectWorkflowAPI } from '../../utils/api'
import { formatCurrency } from '../../utils/helpers'

const ProjectProgressDashboard = ({ projectId }) => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [projectId])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await projectWorkflowAPI.getProjectDashboard(projectId)
      setDashboardData(response.data)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: '120px', background: '#f3f4f6', borderRadius: '16px' }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ height: '300px', background: '#f3f4f6', borderRadius: '16px' }} />
          <div style={{ height: '300px', background: '#f3f4f6', borderRadius: '16px' }} />
        </div>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
        <AlertTriangle style={{ height: '48px', width: '48px', margin: '0 auto 16px', color: '#eab308' }} />
        <p style={{ fontSize: '14px', marginBottom: '16px' }}>Failed to load progress dashboard</p>
        <button
          onClick={loadDashboard}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            color: '#2563eb',
            background: '#eff6ff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Try again
        </button>
      </div>
    )
  }

  const { progress, tasks, budget, charts } = dashboardData

  const COLORS = ['#9CA3AF', '#3B82F6', '#22C55E', '#EF4444']

  // Card styles
  const cardStyle = {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  }

  const cardHeaderStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid #f3f4f6',
    background: '#fafafa'
  }

  const cardContentStyle = {
    padding: '24px'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {/* Overall Progress */}
        <div style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#2563eb', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Overall Progress
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#1d4ed8', lineHeight: 1 }}>
                {progress.overallCompletion}%
              </p>
            </div>
            <div style={{
              height: '48px',
              width: '48px',
              background: '#3b82f6',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp style={{ height: '24px', width: '24px', color: 'white' }} />
            </div>
          </div>
          <div style={{ width: '100%', background: '#bfdbfe', borderRadius: '8px', height: '8px' }}>
            <div
              style={{
                background: '#2563eb',
                height: '8px',
                borderRadius: '8px',
                transition: 'all 0.3s',
                width: `${progress.overallCompletion}%`
              }}
            />
          </div>
        </div>

        {/* Tasks Completed */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#16a34a', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Tasks Done
              </p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#15803d', lineHeight: 1 }}>
                {tasks.completed}/{tasks.total}
              </p>
            </div>
            <div style={{
              height: '48px',
              width: '48px',
              background: '#22c55e',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle style={{ height: '24px', width: '24px', color: 'white' }} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>
            {tasks.inProgress} in progress, {tasks.notStarted} pending
          </p>
        </div>

        {/* Budget Status */}
        <div style={{
          background: budget.variance >= 0
            ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
            : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: budget.variance >= 0 ? '1px solid #a7f3d0' : '1px solid #fecaca'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p style={{
                fontSize: '11px',
                color: budget.variance >= 0 ? '#059669' : '#dc2626',
                textTransform: 'uppercase',
                fontWeight: '600',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Budget Status
              </p>
              <p style={{
                fontSize: '24px',
                fontWeight: '700',
                color: budget.variance >= 0 ? '#047857' : '#b91c1c',
                lineHeight: 1
              }}>
                {budget.variance >= 0 ? 'Under' : 'Over'} Budget
              </p>
            </div>
            <div style={{
              height: '48px',
              width: '48px',
              background: budget.variance >= 0 ? '#10b981' : '#ef4444',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {budget.variance >= 0 ? (
                <TrendingDown style={{ height: '24px', width: '24px', color: 'white' }} />
              ) : (
                <TrendingUp style={{ height: '24px', width: '24px', color: 'white' }} />
              )}
            </div>
          </div>
          <p style={{
            fontSize: '12px',
            color: budget.variance >= 0 ? '#059669' : '#dc2626',
            fontWeight: '500'
          }}>
            {formatCurrency(Math.abs(budget.variance))} {budget.variance >= 0 ? 'saved' : 'exceeded'}
          </p>
        </div>

        {/* Payment Status */}
        <div style={{
          background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e9d5ff'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#DDC5B0', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Payments
              </p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#7e22ce', lineHeight: 1 }}>
                {formatCurrency(budget.paid)}
              </p>
            </div>
            <div style={{
              height: '48px',
              width: '48px',
              background: '#a855f7',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IndianRupee style={{ height: '24px', width: '24px', color: 'white' }} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#DDC5B0', fontWeight: '500' }}>
            {formatCurrency(budget.pending)} pending
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Task Status Pie Chart */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <ListTodo style={{ height: '18px', width: '18px', color: '#6b7280' }} />
              Task Status Distribution
            </h3>
          </div>
          <div style={cardContentStyle}>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.taskStatus.filter(t => t.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {charts.taskStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ fontSize: '13px', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
              {charts.taskStatus.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
                  <span style={{ color: '#4b5563', fontWeight: '500' }}>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase Progress Bar Chart */}
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <TrendingUp style={{ height: '18px', width: '18px', color: '#6b7280' }} />
              Phase-wise Completion
            </h3>
          </div>
          <div style={cardContentStyle}>
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.phaseProgress} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Completion']}
                    contentStyle={{ fontSize: '13px', borderRadius: '8px' }}
                  />
                  <Bar
                    dataKey="completion"
                    fill="#3B82F6"
                    radius={[0, 6, 6, 0]}
                    background={{ fill: '#E5E7EB', radius: [0, 6, 6, 0] }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Breakdown */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <IndianRupee style={{ height: '18px', width: '18px', color: '#6b7280' }} />
            Budget vs Actual by Phase
          </h3>
        </div>
        <div style={cardContentStyle}>
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.budgetByPhase}>
                <XAxis dataKey="name" fontSize={11} />
                <YAxis
                  tickFormatter={(v) => v >= 100000 ? `${(v/100000).toFixed(0)}L` : `${(v/1000).toFixed(0)}K`}
                  fontSize={11}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value)]}
                  contentStyle={{ fontSize: '13px', borderRadius: '8px' }}
                />
                <Legend fontSize={11} />
                <Bar dataKey="estimated" name="Estimated" fill="#93C5FD" radius={[6, 6, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Phase Details Table */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Phase Details
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actual</th>
                <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {charts.phaseProgress.map((phase, index) => {
                const budgetPhase = charts.budgetByPhase.find(b => b.name === phase.name) || {}
                const variance = (budgetPhase.estimated || 0) - (budgetPhase.actual || 0)
                return (
                  <tr key={index} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>{phase.name}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <div style={{ width: '80px', background: '#e5e7eb', borderRadius: '8px', height: '8px' }}>
                          <div
                            style={{
                              background: '#3b82f6',
                              height: '8px',
                              borderRadius: '8px',
                              width: `${phase.completion}%`
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '13px', color: '#4b5563', fontWeight: '500' }}>{phase.completion}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', color: '#4b5563' }}>
                      {phase.completed}/{phase.tasks}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', color: '#4b5563' }}>
                      {formatCurrency(budgetPhase.estimated || 0)}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', color: '#4b5563' }}>
                      {formatCurrency(budgetPhase.actual || 0)}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      textAlign: 'right',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: variance >= 0 ? '#16a34a' : '#dc2626'
                    }}>
                      {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProjectProgressDashboard
