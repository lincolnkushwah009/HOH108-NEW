import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Phone, FileText, CheckCircle, Palette, Users, TrendingUp,
  Clock, AlertCircle, ArrowRight, Calendar, Target, Activity
} from 'lucide-react'
import { callActivitiesAPI, salesOrdersAPI, approvalsAPI, leadWorkflowAPI, dashboardAPI, leadsAPI, projectsAPI, designIterationsAPI } from '../../utils/api'

const StatCard = ({ title, value, subtitle, icon: Icon, gradient, link }) => {
  const content = (
    <div style={{
      background: gradient,
      borderRadius: '14px',
      padding: '20px',
      color: '#ffffff',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      transition: 'all 0.3s',
      cursor: link ? 'pointer' : 'default',
      minWidth: '160px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: '500', opacity: 0.9, margin: 0 }}>{title}</p>
          <p style={{ fontSize: '32px', fontWeight: '700', margin: '8px 0 0 0' }}>{value}</p>
          {subtitle && <p style={{ fontSize: '11px', opacity: 0.8, margin: '4px 0 0 0' }}>{subtitle}</p>}
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '10px',
          padding: '10px',
        }}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )

  if (link) {
    return <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link>
  }
  return content
}

const RecentActivityItem = ({ activity }) => {
  const iconMap = {
    call: Phone,
    meeting: Calendar,
    sales_order: FileText,
    approval: CheckCircle,
    design: Palette,
  }
  const Icon = iconMap[activity.type] || Activity

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '14px 0',
      borderBottom: '1px solid #F3F4F6',
    }}>
      <div style={{
        padding: '10px',
        background: '#F3F4F6',
        borderRadius: '10px',
      }}>
        <Icon size={16} style={{ color: '#6B7280' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', color: '#1F2937', margin: 0 }}>{activity.description}</p>
        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>{activity.time}</p>
      </div>
    </div>
  )
}

export default function CRMDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    callsToday: 0,
    meetingsScheduled: 0,
    pendingOrders: 0,
    pendingApprovals: 0,
    activeDesigns: 0,
    qualifiedLeads: 0,
  })
  const [workflowCounts, setWorkflowCounts] = useState({
    preSales: 0,
    crm: 0,
    sales: 0,
    design: 0,
    operations: 0,
  })
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch multiple API calls in parallel
      const [callStats, salesStats, approvalStats, dashStats, designStats, projectStats] = await Promise.all([
        callActivitiesAPI.getMyStats().catch(() => ({ data: {} })),
        salesOrdersAPI.getStats().catch(() => ({ data: {} })),
        approvalsAPI.getStats().catch(() => ({ data: {} })),
        dashboardAPI.getStats().catch(() => ({ data: {} })),
        designIterationsAPI.getAll({ status: 'in_progress' }).catch(() => ({ data: [], pagination: { total: 0 } })),
        projectsAPI.getAll({ stage: 'execution' }).catch(() => ({ data: [], pagination: { total: 0 } })),
      ])

      // Extract lead counts by status from dashboard stats
      const leadsByStatus = dashStats.data?.leadsByStatus || []
      const newLeadsCount = leadsByStatus.find(s => s._id === 'new')?.count || 0
      const contactedLeadsCount = leadsByStatus.find(s => s._id === 'contacted')?.count || 0
      const qualifiedLeadsCount = leadsByStatus.find(s => s._id === 'qualified')?.count || 0
      const proposalLeadsCount = leadsByStatus.find(s => s._id === 'proposal-sent')?.count || 0
      const negotiationLeadsCount = leadsByStatus.find(s => s._id === 'negotiation')?.count || 0

      // Calculate counts for each workflow stage
      const preSalesCount = newLeadsCount + contactedLeadsCount // Leads being called
      const crmCount = qualifiedLeadsCount + proposalLeadsCount + negotiationLeadsCount // In qualification

      // Get sales orders count
      const salesOrdersCount = salesStats.data?.total ||
        (salesStats.data?.byStatus?.reduce((acc, s) => acc + (s.count || 0), 0) || 0)

      // Get design iterations count
      const designCount = designStats.pagination?.total || designStats.data?.length || 0

      // Get projects in execution
      const operationsCount = projectStats.pagination?.total || projectStats.data?.length || 0

      setStats({
        callsToday: callStats.data?.todayCalls || 0,
        meetingsScheduled: callStats.data?.scheduledMeetings || 0,
        pendingOrders: salesStats.data?.byStatus?.find(s => s._id === 'draft')?.count || 0,
        pendingApprovals: approvalStats.data?.byStatus?.find(s => s._id === 'pending_approval')?.count || 0,
        activeDesigns: designCount,
        qualifiedLeads: qualifiedLeadsCount,
      })

      setWorkflowCounts({
        preSales: preSalesCount,
        crm: crmCount,
        sales: salesOrdersCount,
        design: designCount,
        operations: operationsCount,
      })

      // Fetch recent activity
      try {
        const activityRes = await dashboardAPI.getActivity()
        if (activityRes.data) {
          const formattedActivities = activityRes.data.slice(0, 5).map(item => {
            let type = 'call'
            if (item.type === 'lead') type = 'call'
            else if (item.type === 'user') type = 'meeting'
            else if (item.type === 'karma') type = 'approval'

            return {
              type,
              description: item.message,
              time: formatRelativeTime(item.createdAt),
            }
          })
          setRecentActivities(formattedActivities)
        }
      } catch (err) {
        // Use default activities if fetch fails
        setRecentActivities([
          { type: 'call', description: 'No recent activity', time: '' },
        ])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format relative time
  const formatRelativeTime = (date) => {
    if (!date) return ''
    const now = new Date()
    const then = new Date(date)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return then.toLocaleDateString()
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #E5E7EB',
          borderTopColor: '#3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const pipelineStages = [
    {
      title: 'Pre-Sales',
      count: workflowCounts.preSales,
      subtitle: 'Leads in calling',
      icon: Phone,
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      textColor: '#1D4ED8',
      link: '/admin/crm/call-activities'
    },
    {
      title: 'CRM',
      count: workflowCounts.crm,
      subtitle: 'In qualification',
      icon: Users,
      bgColor: '#FDF8F4',
      borderColor: '#DDC5B0',
      textColor: '#C59C82',
      link: '/admin/leads?primaryStatus=in_progress'
    },
    {
      title: 'Sales',
      count: workflowCounts.sales,
      subtitle: 'Sales orders',
      icon: FileText,
      bgColor: '#FFF7ED',
      borderColor: '#FED7AA',
      textColor: '#EA580C',
      link: '/admin/crm/sales-orders'
    },
    {
      title: 'Design',
      count: workflowCounts.design,
      subtitle: 'In design phase',
      icon: Palette,
      bgColor: '#ECFEFF',
      borderColor: '#A5F3FC',
      textColor: '#0891B2',
      link: '/admin/crm/design-iterations'
    },
    {
      title: 'Operations',
      count: workflowCounts.operations,
      subtitle: 'In execution',
      icon: CheckCircle,
      bgColor: '#F0FDF4',
      borderColor: '#BBF7D0',
      textColor: '#16A34A',
      link: '/admin/projects?stage=execution'
    },
  ]

  const quickActions = [
    { title: 'Log Call', subtitle: 'Record a call activity', icon: Phone, link: '/admin/crm/call-activities', hoverColor: '#3B82F6' },
    { title: 'Create Order', subtitle: 'New sales order', icon: FileText, link: '/admin/crm/sales-orders', hoverColor: '#EA580C' },
    { title: 'Approvals', subtitle: 'Review pending items', icon: CheckCircle, link: '/admin/crm/approvals', hoverColor: '#EC4899' },
    { title: 'Design', subtitle: 'Manage iterations', icon: Palette, link: '/admin/crm/design-iterations', hoverColor: '#0891B2' },
  ]

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', margin: 0 }}>CRM Workflow</h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>Manage your complete sales pipeline</p>
        </div>
        <Link
          to="/admin/crm/call-activities"
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            color: '#ffffff',
            borderRadius: '10px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          }}
        >
          <Phone size={18} />
          Log Call
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px'
      }}>
        <StatCard
          title="Calls Today"
          value={stats.callsToday}
          icon={Phone}
          gradient="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
          link="/admin/crm/call-activities"
        />
        <StatCard
          title="Meetings Scheduled"
          value={stats.meetingsScheduled}
          icon={Calendar}
          gradient="linear-gradient(135deg, #B8926E 0%, #C59C82 100%)"
          link="/admin/crm/call-activities"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={FileText}
          gradient="linear-gradient(135deg, #F97316 0%, #EA580C 100%)"
          link="/admin/crm/sales-orders"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={CheckCircle}
          gradient="linear-gradient(135deg, #EC4899 0%, #DB2777 100%)"
          link="/admin/crm/approvals"
        />
        <StatCard
          title="Active Designs"
          value={stats.activeDesigns}
          icon={Palette}
          gradient="linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)"
          link="/admin/crm/design-iterations"
        />
        <StatCard
          title="Qualified Leads"
          value={stats.qualifiedLeads}
          icon={Target}
          gradient="linear-gradient(135deg, #22C55E 0%, #16A34A 100%)"
          link="/admin/leads?status=qualified"
        />
      </div>

      {/* Workflow Pipeline */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: '0 0 20px 0' }}>Workflow Pipeline</h2>
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
        }}>
          {pipelineStages.map((stage, index) => (
            <div key={stage.title} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                to={stage.link}
                style={{
                  background: stage.bgColor,
                  border: `2px solid ${stage.borderColor}`,
                  borderRadius: '14px',
                  padding: '16px 20px',
                  minWidth: '170px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <stage.icon size={18} style={{ color: stage.textColor }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: stage.textColor }}>{stage.title}</span>
                </div>
                <p style={{ fontSize: '28px', fontWeight: '700', color: stage.textColor, margin: '0 0 4px 0' }}>{stage.count}</p>
                <p style={{ fontSize: '12px', color: stage.textColor, opacity: 0.8, margin: '0 0 8px 0' }}>{stage.subtitle}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: stage.textColor, fontSize: '12px' }}>
                  View <ArrowRight size={12} />
                </div>
              </Link>
              {index < pipelineStages.length - 1 && (
                <ArrowRight size={24} style={{ color: '#D1D5DB', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {/* Recent Activity */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>Recent Activity</h2>
            <Link to="/admin/crm/call-activities" style={{ fontSize: '14px', color: '#3B82F6', textDecoration: 'none' }}>
              View all
            </Link>
          </div>
          <div>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <RecentActivityItem key={index} activity={activity} />
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0', margin: 0 }}>No recent activity</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: '0 0 16px 0' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.link}
                style={{
                  padding: '20px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '14px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <action.icon size={24} style={{ color: '#9CA3AF', marginBottom: '10px' }} />
                <p style={{ fontSize: '15px', fontWeight: '500', color: '#374151', margin: '0 0 4px 0' }}>{action.title}</p>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>{action.subtitle}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Items Alert */}
      {(stats.pendingApprovals > 0 || stats.pendingOrders > 0) && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '14px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <AlertCircle size={24} style={{ color: '#D97706' }} />
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#92400E', margin: 0 }}>Action Required</p>
            <p style={{ fontSize: '14px', color: '#B45309', margin: '4px 0 0 0' }}>
              You have {stats.pendingApprovals} pending approval(s) and {stats.pendingOrders} draft order(s) waiting for action.
            </p>
          </div>
          <Link
            to="/admin/crm/approvals"
            style={{
              padding: '10px 20px',
              background: '#F59E0B',
              color: '#ffffff',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Review Now
          </Link>
        </div>
      )}
    </div>
  )
}
