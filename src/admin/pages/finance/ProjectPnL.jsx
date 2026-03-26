import { useState, useEffect } from 'react'
import { IndianRupee, TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Badge } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/helpers'
import { projectPnLAPI } from '../../utils/api'

const ProjectPnL = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedProject, setExpandedProject] = useState(null)
  const [projectDetail, setProjectDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sortField, setSortField] = useState('margin')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await projectPnLAPI.getDashboard()
      setData(response.data)
    } catch (err) {
      console.error('Failed to load P&L dashboard:', err)
      setError('Failed to load P&L dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleExpandProject = async (projectId) => {
    if (expandedProject === projectId) {
      setExpandedProject(null)
      setProjectDetail(null)
      return
    }
    setExpandedProject(projectId)
    setDetailLoading(true)
    try {
      const response = await projectPnLAPI.getProjectPnL(projectId)
      setProjectDetail(response.data)
    } catch (err) {
      console.error('Failed to load project P&L:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const getSortedProjects = () => {
    if (!data?.projects) return []
    return [...data.projects].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortField === 'title') return mul * a.title.localeCompare(b.title)
      return mul * ((a[sortField] || 0) - (b[sortField] || 0))
    })
  }

  const SortHeader = ({ field, label }) => (
    <th
      onClick={() => handleSort(field)}
      style={{ padding: '12px 16px', textAlign: field === 'title' ? 'left' : 'right', cursor: 'pointer', userSelect: 'none', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: field === 'title' ? 'flex-start' : 'flex-end' }}>
        {label}
        {sortField === field && (
          sortDir === 'asc' ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />
        )}
      </div>
    </th>
  )

  if (loading) return <PageLoader />

  if (error) {
    return (
      <div>
        <PageHeader
          title="Project P&L"
          description="Profit & Loss analysis across all projects"
          breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Finance' }, { label: 'Project P&L' }]}
        />
        <EmptyState title="Error" description={error} action={{ label: 'Retry', onClick: loadDashboard }} />
      </div>
    )
  }

  const summary = data?.summary || {}
  const projects = getSortedProjects()

  return (
    <div>
      <PageHeader
        title="Project P&L"
        description="Profit & Loss analysis across all projects"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Finance' }, { label: 'Project P&L' }]}
        actions={
          <Button variant="outline" icon={BarChart3} onClick={loadDashboard}>
            Refresh
          </Button>
        }
      />

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', backgroundColor: '#DCFCE7', borderRadius: '10px' }}>
              <IndianRupee style={{ width: 22, height: 22, color: '#16A34A' }} />
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>{formatCurrency(summary.totalRevenue)}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Total Revenue</p>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', backgroundColor: '#FEE2E2', borderRadius: '10px' }}>
              <TrendingDown style={{ width: 22, height: 22, color: '#DC2626' }} />
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>{formatCurrency(summary.totalCOGS)}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Total COGS</p>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', backgroundColor: summary.grossProfit >= 0 ? '#DCFCE7' : '#FEE2E2', borderRadius: '10px' }}>
              <TrendingUp style={{ width: 22, height: 22, color: summary.grossProfit >= 0 ? '#16A34A' : '#DC2626' }} />
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>{formatCurrency(summary.grossProfit)}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Gross Profit</p>
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', backgroundColor: summary.netMargin >= 0 ? '#DCFCE7' : '#FEE2E2', borderRadius: '10px' }}>
              {summary.netMargin >= 0
                ? <ArrowUpRight style={{ width: 22, height: 22, color: '#16A34A' }} />
                : <ArrowDownRight style={{ width: 22, height: 22, color: '#DC2626' }} />
              }
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>{summary.netMargin || 0}%</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Net Margin</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Project Count Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: 0 }}>{summary.projectCount || 0}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Total Projects</p>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#16A34A', margin: 0 }}>{summary.profitableCount || 0}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Profitable</p>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#DC2626', margin: 0 }}>{summary.lossCount || 0}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Loss-Making</p>
          </div>
        </Card>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: 0 }}>{formatCurrency(summary.netProfit)}</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Net Profit</p>
          </div>
        </Card>
      </div>

      {/* Top 5 Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <Card>
          <div style={{ padding: '4px 0 12px 0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>Top 5 Most Profitable</h3>
            {(data?.top5Profitable || []).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No profitable projects yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data?.top5Profitable || []).map((p, i) => (
                  <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', backgroundColor: '#DCFCE7', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>{p.title}</p>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{p.projectId}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#16A34A', margin: 0 }}>{formatCurrency(p.netProfit)}</p>
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{p.margin}% margin</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
        <Card>
          <div style={{ padding: '4px 0 12px 0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>Top 5 Least Profitable</h3>
            {(data?.top5Losses || []).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No data available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(data?.top5Losses || []).map((p, i) => (
                  <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: p.netProfit < 0 ? '#FEF2F2' : '#FFFBEB', borderRadius: '8px', border: `1px solid ${p.netProfit < 0 ? '#FECACA' : '#FDE68A'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: p.netProfit < 0 ? '#DC2626' : '#D97706', backgroundColor: p.netProfit < 0 ? '#FEE2E2' : '#FEF3C7', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>{p.title}</p>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{p.projectId}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: p.netProfit < 0 ? '#DC2626' : '#D97706', margin: 0 }}>{formatCurrency(p.netProfit)}</p>
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>{p.margin}% margin</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Revenue vs Cost Chart (simple bar representation) */}
      {(data?.revenueVsCost || []).length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ padding: '4px 0 12px 0' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Revenue vs Cost by Project</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(data?.revenueVsCost || []).map((p) => {
                const maxVal = Math.max(p.revenue, p.cost, 1)
                return (
                  <div key={p.projectId} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '120px', flexShrink: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.title}>{p.projectId}</p>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ height: '14px', width: `${Math.max((p.revenue / maxVal) * 100, 2)}%`, backgroundColor: '#22C55E', borderRadius: '3px', transition: 'width 0.3s' }} />
                        <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(p.revenue)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ height: '14px', width: `${Math.max((p.cost / maxVal) * 100, 2)}%`, backgroundColor: '#EF4444', borderRadius: '3px', transition: 'width 0.3s' }} />
                        <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatCurrency(p.cost)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#22C55E', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Revenue</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#EF4444', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>Cost</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Projects Table */}
      <Card>
        <div style={{ padding: '4px 0 0 0' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>All Projects P&L</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', borderBottom: '1px solid #e5e7eb', width: '40px' }} />
                <SortHeader field="projectId" label="Project ID" />
                <SortHeader field="title" label="Title" />
                <SortHeader field="revenue" label="Revenue" />
                <SortHeader field="cogs" label="Costs" />
                <SortHeader field="netProfit" label="Profit" />
                <SortHeader field="margin" label="Margin %" />
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 16px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                    No projects found
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <>
                    <tr
                      key={p._id}
                      onClick={() => handleExpandProject(p._id)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: expandedProject === p._id ? '#F3F4F6' : (p.profitable ? '#FAFFF9' : '#FFFAFA'),
                        borderBottom: expandedProject === p._id ? 'none' : '1px solid #f3f4f6',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => { if (expandedProject !== p._id) e.currentTarget.style.backgroundColor = '#F9FAFB' }}
                      onMouseLeave={(e) => { if (expandedProject !== p._id) e.currentTarget.style.backgroundColor = p.profitable ? '#FAFFF9' : '#FFFAFA' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        {expandedProject === p._id
                          ? <ChevronUp style={{ width: 16, height: 16, color: '#9ca3af' }} />
                          : <ChevronDown style={{ width: 16, height: 16, color: '#9ca3af' }} />
                        }
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#374151' }}>{p.projectId}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#111827', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#111827', textAlign: 'right' }}>{formatCurrency(p.revenue)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: '#111827', textAlign: 'right' }}>{formatCurrency(p.cogs)}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: p.netProfit >= 0 ? '#16A34A' : '#DC2626', textAlign: 'right' }}>{formatCurrency(p.netProfit)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                          backgroundColor: p.margin > 20 ? '#DCFCE7' : p.margin > 0 ? '#FEF3C7' : '#FEE2E2',
                          color: p.margin > 20 ? '#16A34A' : p.margin > 0 ? '#D97706' : '#DC2626'
                        }}>
                          {p.margin > 0 ? <ArrowUpRight style={{ width: 12, height: 12 }} /> : p.margin < 0 ? <ArrowDownRight style={{ width: 12, height: 12 }} /> : <Minus style={{ width: 12, height: 12 }} />}
                          {p.margin}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Badge color={p.profitable ? 'green' : 'red'}>{p.profitable ? 'Profitable' : 'Loss'}</Badge>
                      </td>
                    </tr>
                    {expandedProject === p._id && (
                      <tr key={`${p._id}-detail`}>
                        <td colSpan={8} style={{ padding: 0, backgroundColor: '#F9FAFB', borderBottom: '2px solid #e5e7eb' }}>
                          {detailLoading ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>Loading P&L breakdown...</div>
                          ) : projectDetail ? (
                            <ProjectDetailPanel detail={projectDetail} />
                          ) : (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>Failed to load details</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// Expanded detail panel for a single project
const ProjectDetailPanel = ({ detail }) => {
  const { pnl, budget, project } = detail

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: '16px' }}>
      <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#374151', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
      {children}
    </div>
  )

  const Line = ({ label, value, bold, color, indent }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', paddingLeft: indent ? '16px' : 0 }}>
      <span style={{ fontSize: '13px', color: bold ? '#111827' : '#6b7280', fontWeight: bold ? 600 : 400 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: bold ? 700 : 500, color: color || (bold ? '#111827' : '#374151'), fontFamily: 'monospace' }}>{typeof value === 'number' ? formatCurrency(value) : value}</span>
    </div>
  )

  const Divider = () => <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />

  return (
    <div style={{ padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
      {/* Left Column - P&L Statement */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>
          Profit & Loss Statement
        </h3>

        <Section title="Revenue">
          <Line label="Customer Milestone Payments" value={pnl.revenue.milestoneCollected} indent />
          <Line label="Customer Invoice Payments" value={pnl.revenue.invoicePaid} indent />
          <Divider />
          <Line label="Total Revenue" value={pnl.revenue.total} bold color="#16A34A" />
        </Section>

        <Section title="Cost of Goods Sold (COGS)">
          <Line label="Material Costs (POs)" value={pnl.cogs.materialCosts} indent />
          <Line label="Vendor Payments" value={pnl.cogs.vendorPayments} indent />
          <Line label="Labor Costs" value={pnl.cogs.laborCosts} indent />
          <Divider />
          <Line label="Total COGS" value={pnl.cogs.total} bold color="#DC2626" />
        </Section>

        <div style={{ backgroundColor: pnl.grossProfit >= 0 ? '#F0FDF4' : '#FEF2F2', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px' }}>
          <Line label="Gross Profit" value={pnl.grossProfit} bold color={pnl.grossProfit >= 0 ? '#16A34A' : '#DC2626'} />
          <Line label="Gross Margin" value={`${pnl.grossMargin}%`} />
        </div>

        <Section title="Operating Expenses">
          <Line label="Contingency Used" value={pnl.opex.contingencyUsed} indent />
          <Divider />
          <Line label="Total Operating Expenses" value={pnl.opex.total} bold />
        </Section>

        <div style={{ backgroundColor: pnl.netProfit >= 0 ? '#DCFCE7' : '#FEE2E2', padding: '12px 14px', borderRadius: '8px', border: `2px solid ${pnl.netProfit >= 0 ? '#86EFAC' : '#FECACA'}` }}>
          <Line label="NET PROFIT" value={pnl.netProfit} bold color={pnl.netProfit >= 0 ? '#16A34A' : '#DC2626'} />
          <Line label="Net Margin" value={`${pnl.netMargin}%`} color={pnl.netMargin >= 0 ? '#16A34A' : '#DC2626'} />
        </div>
      </div>

      {/* Right Column - Budget & Breakdowns */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>
          Budget Analysis
        </h3>

        <Section title="Budget">
          <Line label="Agreed Amount" value={project.agreedAmount} />
          <Line label="Budget Amount" value={budget.budgetAmount} />
          <Line label="Actual Cost" value={budget.actualCost} />
          <Divider />
          <Line label="Budget Variance" value={budget.variance} bold color={budget.variance >= 0 ? '#16A34A' : '#DC2626'} />
          <Line label="Budget Utilization" value={`${budget.utilization}%`} color={budget.utilization > 100 ? '#DC2626' : '#374151'} />
        </Section>

        <Section title="Contingency">
          <Line label="Total Contingency" value={budget.contingencyTotal} />
          <Line label="Contingency Used" value={budget.contingencyUsed} />
          <Line label="Contingency Remaining" value={budget.contingencyRemaining} color={budget.contingencyRemaining > 0 ? '#16A34A' : '#D97706'} />
        </Section>

        <Section title="Revenue Breakdown">
          <Line label="Total Milestone Value" value={pnl.revenue.totalMilestoneValue} />
          <Line label="Total Invoice Value" value={pnl.revenue.totalInvoiceValue} />
          <Line label="Outstanding" value={(pnl.revenue.totalMilestoneValue || pnl.revenue.totalInvoiceValue) - pnl.revenue.total} color="#D97706" />
        </Section>

        <Section title="Cost Breakdown">
          <Line label="Purchase Orders" value={`${(pnl.cogs.purchaseOrders || []).length} orders`} />
          <Line label="Vendor Milestones" value={`${(pnl.cogs.vendorMilestones || []).length} milestones`} />
          <Line label="Labor Entries" value={`${pnl.cogs.laborEntries || 0} entries`} />
        </Section>
      </div>
    </div>
  )
}

export default ProjectPnL
