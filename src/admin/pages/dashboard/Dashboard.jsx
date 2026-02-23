import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  FolderKanban,
  IndianRupee,
  ArrowUpRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  FileText,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { dashboardAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { useCompany } from '../../context/CompanyContext'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatRelativeTime, formatCurrency } from '../../utils/helpers'

// Chart Bar Component with Tooltip
const ChartBar = ({ value, maxValue, month, index }) => {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: `${Math.max((value / maxValue) * 180, 4) + 40}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1e293b',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '2px' }}>{month}</div>
            <div>{value} leads</div>
          </div>
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #1e293b',
          }} />
        </div>
      )}
      <div
        style={{
          width: '100%',
          background: value > 0 ? (showTooltip ? '#A68B6A' : '#C59C82') : '#e2e8f0',
          borderRadius: '8px 8px 0 0',
          height: `${Math.max((value / maxValue) * 180, 4)}px`,
          transition: 'all 0.3s',
          cursor: 'pointer',
        }}
      />
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{month}</span>
    </div>
  )
}

const Dashboard = () => {
  const { user } = useAuth()
  const { activeCompany } = useCompany()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  useEffect(() => {
    loadDashboard()
  }, [activeCompany?._id, selectedYear]) // Reload when company or year changes

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const response = await dashboardAPI.getStats(selectedYear)
      setStats(response.data)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleYearChange = (e) => {
    const value = e.target.value
    setSelectedYear(value === 'thisYear' ? currentYear : currentYear - 1)
  }

  if (loading) {
    return <PageLoader />
  }

  const isPreSales = user?.role === 'pre_sales'

  // Use real data from API - backend returns stats object with totalLeads, totalUsers, totalProjects, etc.
  const dashboardStats = stats?.stats || {}
  const recentLeads = stats?.recentLeads?.slice(0, 5) || []
  const leadsByStatus = stats?.leadsByStatus || []

  // Calculate pipeline counts from leadsByStatus
  const getStatusCount = (status) => {
    const found = leadsByStatus.find(s => s._id === status)
    return found?.count || 0
  }

  const newLeadsCount = getStatusCount('new')
  const inProgressCount = getStatusCount('contacted') + getStatusCount('qualified') + getStatusCount('proposal-sent') + getStatusCount('negotiation')
  const completedCount = getStatusCount('won')

  // Monthly leads chart data
  const monthlyLeads = stats?.monthlyLeads || []
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Build chart data from monthly leads
  const chartData = months.map((month, index) => {
    const monthData = monthlyLeads.find(m => m._id?.month === index + 1)
    return monthData?.count || 0
  })
  const maxChartValue = Math.max(...chartData, 1)

  // Get recent projects from API or use empty array
  const recentProjectsData = stats?.recentProjects || []
  const activities = recentLeads.slice(0, 5).map((lead, i) => ({
    action: 'New lead added',
    detail: `${lead.name} - ${lead.service || 'Inquiry'}`,
    time: formatRelativeTime(lead.createdAt),
    color: ['#C59C82', '#DDC5B0', '#10b981', '#f59e0b', '#ec4899'][i % 5]
  }))
  const tasks = []

  // Styles
  const cardStyle = {
    background: 'white',
    borderRadius: '20px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    overflow: 'hidden',
  }

  const cardHeaderStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const cardTitleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  }

  const viewAllStyle = {
    fontSize: '14px',
    color: '#C59C82',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }

  const statCardStyle = {
    background: 'white',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  }

  const statusColors = {
    new: { bg: '#dbeafe', color: '#1d4ed8' },
    contacted: { bg: '#fef3c7', color: '#b45309' },
    qualified: { bg: '#d1fae5', color: '#047857' },
    proposal: { bg: '#F5EDE6', color: '#A68B6A' },
    in_progress: { bg: '#dbeafe', color: '#1d4ed8' },
    review: { bg: '#fef3c7', color: '#b45309' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0, marginTop: '6px' }}>
            Here's what's happening with your business today.
          </p>
        </div>
        {!isPreSales && (
          <Link
            to="/admin/leads?action=create"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 24px',
              background: '#C59C82',
              color: 'white',
              borderRadius: '14px',
              fontWeight: '600',
              fontSize: '15px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(197, 156, 130, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            <Plus style={{ width: '20px', height: '20px' }} />
            New Lead
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {[
          { icon: Users, label: 'Total Leads', value: dashboardStats.totalLeads || 0, change: `${dashboardStats.newLeads || 0} new`, color: '#C59C82', bg: '#FDF8F4' },
          { icon: UserCheck, label: 'Won Leads', value: dashboardStats.wonLeads || 0, change: `${dashboardStats.conversionRate || 0}%`, color: '#10b981', bg: '#d1fae5' },
          { icon: FolderKanban, label: 'Active Projects', value: dashboardStats.activeProjects || 0, change: 'Active', color: '#f59e0b', bg: '#fef3c7' },
          { icon: IndianRupee, label: 'Conversion Rate', value: `${dashboardStats.conversionRate || 0}%`, change: 'Won/Total', color: '#DDC5B0', bg: '#F5EDE6' },
        ].map((stat, i) => (
          <div key={i} style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: stat.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <stat.icon style={{ width: '26px', height: '26px', color: stat.color }} />
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#10b981',
              }}>
                <ArrowUpRight style={{ width: '16px', height: '16px' }} />
                {stat.change}
              </div>
            </div>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{stat.value}</p>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, marginTop: '4px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
          {/* Revenue Chart */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div>
                <h3 style={cardTitleStyle}>Revenue Overview</h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, marginTop: '4px' }}>Monthly revenue performance</p>
              </div>
              <select
                value={selectedYear === currentYear ? 'thisYear' : 'lastYear'}
                onChange={handleYearChange}
                style={{
                  padding: '10px 16px',
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#475569',
                  fontWeight: '500',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="thisYear">This Year ({currentYear})</option>
                <option value="lastYear">Last Year ({currentYear - 1})</option>
              </select>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Chart */}
              <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '16px' }}>
                {chartData.map((value, i) => (
                  <ChartBar
                    key={i}
                    value={value}
                    maxValue={maxChartValue}
                    month={months[i]}
                    index={i}
                  />
                ))}
              </div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Total Leads</p>
                  <p style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0, marginTop: '4px' }}>{dashboardStats.totalLeads || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>New Leads</p>
                  <p style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0, marginTop: '4px' }}>{dashboardStats.newLeads || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Won Leads</p>
                  <p style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0, marginTop: '4px' }}>{dashboardStats.wonLeads || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Projects */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Active Projects</h3>
              <Link to="/admin/projects" style={viewAllStyle}>
                View all <ChevronRight style={{ width: '18px', height: '18px' }} />
              </Link>
            </div>
            <div>
              {recentProjectsData.length > 0 ? recentProjectsData.map((project, i) => (
                <div
                  key={project._id || i}
                  style={{
                    padding: '20px 24px',
                    borderBottom: i < recentProjectsData.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{project.title}</h4>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0, marginTop: '4px' }}>Client: {project.customer?.name || 'N/A'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{formatCurrency(project.financials?.finalAmount || project.financials?.agreedAmount || 0)}</p>
                      <span style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: statusColors[project.stage]?.bg || '#dbeafe',
                        color: statusColors[project.stage]?.color || '#1d4ed8',
                      }}>
                        {project.stage?.replace(/_/g, ' ') || 'Active'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${project.completion?.completionPercentage || 0}%`,
                        height: '100%',
                        background: '#C59C82',
                        borderRadius: '4px',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569', width: '45px' }}>{project.completion?.completionPercentage || 0}%</span>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                  <FolderKanban style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No active projects</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Recent Activity */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>Recent Activity</h3>
              </div>
              <div style={{ padding: '12px 0' }}>
                {activities.length > 0 ? activities.map((activity, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 24px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: activity.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FileText style={{ width: '20px', height: '20px', color: 'white' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{activity.action}</p>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0, marginTop: '2px' }}>{activity.detail}</p>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{activity.time}</span>
                  </div>
                )) : (
                  <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                    <Clock style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>Upcoming Tasks</h3>
                <span style={{
                  padding: '6px 12px',
                  background: '#FDF8F4',
                  color: '#C59C82',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}>{tasks.length} pending</span>
              </div>
              <div style={{ padding: '8px 0' }}>
                {tasks.length > 0 ? tasks.map((task, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 24px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#cbd5e1',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#334155', margin: 0 }}>{task.task}</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, marginTop: '2px' }}>{task.due}</p>
                    </div>
                    <button style={{
                      padding: '8px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#94a3b8',
                      transition: 'all 0.2s',
                    }}>
                      <MoreHorizontal style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                )) : (
                  <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
                    <CheckCircle2 style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No pending tasks</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Leads */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={cardTitleStyle}>Recent Leads</h3>
              <Link to="/admin/leads" style={viewAllStyle}>
                View all <ChevronRight style={{ width: '18px', height: '18px' }} />
              </Link>
            </div>
            <div>
              {recentLeads.map((lead, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/admin/leads/${lead._id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 24px',
                    borderBottom: i < recentLeads.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #C59C82 0%, #DDC5B0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>{lead.name?.charAt(0)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{lead.name}</p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, marginTop: '2px' }}>{lead.service}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, marginTop: '2px' }}>{formatRelativeTime(lead.createdAt)}</p>
                  </div>
                  <span style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: statusColors[lead.status]?.bg,
                    color: statusColors[lead.status]?.color,
                  }}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={cardStyle}>
            <div style={{ ...cardHeaderStyle, borderBottom: 'none', paddingBottom: '12px' }}>
              <h3 style={cardTitleStyle}>Quick Actions</h3>
            </div>
            <div style={{ padding: '0 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                !isPreSales && { icon: Users, label: 'Add Lead', path: '/admin/leads?action=create', color: '#C59C82' },
                !isPreSales && { icon: FolderKanban, label: 'New Project', path: '/admin/projects', color: '#DDC5B0' },
                !isPreSales && { icon: FileText, label: 'Quotation', path: '/admin/quotations', color: '#10b981' },
                { icon: Calendar, label: 'Attendance', path: '/admin/attendance', color: '#f59e0b' },
                isPreSales && { icon: Users, label: 'My Leads', path: '/admin/leads', color: '#C59C82' },
                isPreSales && { icon: FileText, label: 'Call Activities', path: '/admin/crm/call-activities', color: '#10b981' },
              ].filter(Boolean).map((action, i) => (
                <Link
                  key={i}
                  to={action.path}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '20px 16px',
                    background: '#f8fafc',
                    borderRadius: '14px',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <action.icon style={{ width: '24px', height: '24px', color: 'white' }} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Pipeline Summary */}
          <div style={{
            background: 'linear-gradient(135deg, #C59C82 0%, #DDC5B0 100%)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(197, 156, 130, 0.3)',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0, marginBottom: '20px' }}>Pipeline Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'New Leads', count: newLeadsCount, icon: AlertCircle },
                { label: 'In Progress', count: inProgressCount, icon: Clock },
                { label: 'Won', count: completedCount, icon: CheckCircle2 },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <item.icon style={{ width: '20px', height: '20px', color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: '14px', color: 'white' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
