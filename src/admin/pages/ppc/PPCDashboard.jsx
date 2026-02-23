import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Factory, ClipboardList, Package, Users, FileText, TrendingUp,
  AlertTriangle, CheckCircle, Clock, DollarSign, BarChart3, Activity,
  ArrowUpRight, ArrowDownRight, ChevronRight, Zap, Eye, Calendar,
  Layers, Hammer
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { ppcDashboardAPI, projectsAPI } from '../../utils/api'

const PPCDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [overview, setOverview] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [mrpSummary, setMrpSummary] = useState(null)
  const [laborSummary, setLaborSummary] = useState(null)
  const [costSummary, setCostSummary] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getAll({ limit: 100, status: 'active' })
      setProjects(response.data || [])
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const loadDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = selectedProject ? { project: selectedProject } : {}

      const results = await Promise.allSettled([
        ppcDashboardAPI.getOverview(params),
        ppcDashboardAPI.getSchedule(params),
        ppcDashboardAPI.getMRPSummary(params),
        ppcDashboardAPI.getLaborSummary(params),
        ppcDashboardAPI.getCostSummary(params),
        ppcDashboardAPI.getKPIs(params)
      ])

      setOverview(results[0].status === 'fulfilled' ? results[0].value.data : null)
      setSchedule(results[1].status === 'fulfilled' ? results[1].value.data : null)
      setMrpSummary(results[2].status === 'fulfilled' ? results[2].value.data : null)
      setLaborSummary(results[3].status === 'fulfilled' ? results[3].value.data : null)
      setCostSummary(results[4].status === 'fulfilled' ? results[4].value.data : null)
      setKpis(results[5].status === 'fulfilled' ? results[5].value.data : null)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    draft: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
    released: { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
    in_progress: { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
    completed: { bg: '#d1fae5', text: '#047857', dot: '#10b981' },
    on_hold: { bg: '#ffedd5', text: '#c2410c', dot: '#f97316' },
    cancelled: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' }
  }

  if (loading) {
    return <PageLoader />
  }

  const totalWorkOrders = Object.values(overview?.workOrders?.byStatus || {}).reduce((a, b) => a + b, 0)

  return (
    <div style={{ paddingBottom: '40px' }}>
      <PageHeader
        title="Production Planning & Control"
        description="Monitor production operations, material requirements, and costs"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'PPC Dashboard' }]}
        actions={
          <Select
            options={[
              { value: '', label: 'All Projects' },
              ...projects.map(p => ({ value: p._id, label: p.title || p.name }))
            ]}
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-48"
          />
        }
      />

      {/* Quick Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          {
            label: 'Work Orders',
            value: totalWorkOrders,
            icon: Factory,
            gradient: 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)',
            iconBg: 'rgba(255,255,255,0.2)',
            path: '/admin/ppc/work-orders',
            light: false
          },
          {
            label: 'In Progress',
            value: overview?.workOrders?.active || 0,
            icon: Activity,
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            iconBg: 'rgba(255,255,255,0.2)',
            path: '/admin/ppc/work-orders?status=in_progress',
            light: false
          },
          {
            label: 'Material Shortfalls',
            value: overview?.materialShortfall?.count || 0,
            icon: AlertTriangle,
            gradient: '#fff',
            iconBg: '#fef2f2',
            iconColor: '#ef4444',
            textColor: '#ef4444',
            path: '/admin/ppc/material-requirements?hasShortfall=true',
            light: true,
            border: '1px solid #fecaca'
          },
          {
            label: 'Labor Hours Today',
            value: overview?.todayLabor?.totalHours?.toFixed(0) || 0,
            icon: Users,
            gradient: '#fff',
            iconBg: '#F5EDE6',
            iconColor: '#A68B6A',
            textColor: '#111827',
            path: '/admin/ppc/labor-entries',
            light: true,
            border: '1px solid #e5e7eb'
          },
          {
            label: 'Issues Today',
            value: overview?.todayMaterialIssues?.issueCount || 0,
            icon: FileText,
            gradient: '#fff',
            iconBg: '#ecfdf5',
            iconColor: '#059669',
            textColor: '#111827',
            path: '/admin/ppc/daily-progress-reports',
            light: true,
            border: '1px solid #e5e7eb'
          },
          {
            label: 'Total COGS',
            value: formatCurrency(overview?.costSummary?.totalCOGS || 0),
            icon: DollarSign,
            gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            iconBg: 'rgba(255,255,255,0.2)',
            path: '/admin/ppc/production-costs',
            light: false
          }
        ].map((stat, i) => (
          <button
            key={i}
            onClick={() => navigate(stat.path)}
            style={{
              background: stat.gradient,
              borderRadius: '18px',
              padding: '22px 20px',
              border: stat.border || 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              boxShadow: stat.light ? '0 1px 3px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.12)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = stat.light ? '0 4px 12px rgba(0,0,0,0.08)' : '0 8px 24px rgba(0,0,0,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = stat.light ? '0 1px 3px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.12)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: stat.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <stat.icon style={{ width: '22px', height: '22px', color: stat.light ? (stat.iconColor || '#6b7280') : '#fff' }} />
              </div>
              <ArrowUpRight style={{ width: '16px', height: '16px', color: stat.light ? '#d1d5db' : 'rgba(255,255,255,0.4)' }} />
            </div>
            <p style={{
              fontSize: '26px',
              fontWeight: '800',
              color: stat.light ? (stat.textColor || '#111827') : '#fff',
              margin: '0 0 4px 0',
              lineHeight: '1.1',
            }}>
              {stat.value}
            </p>
            <p style={{
              fontSize: '13px',
              fontWeight: '500',
              color: stat.light ? '#6b7280' : 'rgba(255,255,255,0.8)',
              margin: 0,
            }}>
              {stat.label}
            </p>
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          {
            label: 'On-Time Delivery',
            value: kpis?.onTimeDelivery?.toFixed(1) || 0,
            color: '#C59C82',
            bgLight: '#FDF8F4',
            icon: Clock,
          },
          {
            label: 'Material Utilization',
            value: kpis?.materialUtilization?.toFixed(1) || 100,
            color: '#059669',
            bgLight: '#ecfdf5',
            icon: Package,
          },
          {
            label: 'Labor Efficiency',
            value: kpis?.laborEfficiency?.toFixed(1) || 0,
            color: '#d97706',
            bgLight: '#fffbeb',
            icon: Users,
          },
          {
            label: 'Cost Variance',
            value: Math.abs(kpis?.costVariance || 0).toFixed(1),
            color: (kpis?.costVariance || 0) > 0 ? '#ef4444' : '#059669',
            bgLight: (kpis?.costVariance || 0) > 0 ? '#fef2f2' : '#ecfdf5',
            icon: TrendingUp,
            prefix: (kpis?.costVariance || 0) > 0 ? '+' : (kpis?.costVariance || 0) < 0 ? '-' : '',
          }
        ].map((kpi, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              borderRadius: '18px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: kpi.bgLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <kpi.icon style={{ width: '20px', height: '20px', color: kpi.color }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI</span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: '800', color: kpi.color, margin: '0 0 4px 0', lineHeight: '1' }}>
              {kpi.prefix || ''}{kpi.value}%
            </p>
            <p style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', margin: '0 0 16px 0' }}>{kpi.label}</p>
            {/* Progress bar */}
            <div style={{ height: '6px', borderRadius: '3px', background: '#f3f4f6', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: '3px',
                background: `linear-gradient(90deg, ${kpi.color}, ${kpi.color}cc)`,
                width: `${Math.min(parseFloat(kpi.value) || 0, 100)}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Middle Row: Work Order Status + Material Requirements */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Work Order Status */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            padding: '22px 24px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#F5EDE6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Factory style={{ width: '18px', height: '18px', color: '#A68B6A' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>Work Order Status</h3>
            </div>
            <button
              onClick={() => navigate('/admin/ppc/work-orders')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: '#6b7280',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#C59C82' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280' }}
            >
              View All <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {overview?.workOrders?.byStatus && Object.keys(overview.workOrders.byStatus).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(overview.workOrders.byStatus).map(([status, count]) => {
                  const sc = statusColors[status] || statusColors.draft
                  const pct = totalWorkOrders > 0 ? (count / totalWorkOrders * 100) : 0
                  return (
                    <div key={status} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: '#fafbfc',
                      transition: 'background 0.15s',
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: sc.dot,
                        flexShrink: 0,
                      }} />
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        flex: 1,
                        textTransform: 'capitalize',
                      }}>
                        {status?.replace(/_/g, ' ')}
                      </span>
                      <div style={{ width: '80px', height: '6px', borderRadius: '3px', background: '#e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', borderRadius: '3px', background: sc.dot, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#111827',
                        minWidth: '28px',
                        textAlign: 'right',
                      }}>
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <Factory style={{ width: '40px', height: '40px', color: '#d1d5db', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>No work orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Material Requirements */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            padding: '22px 24px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#F5EDE6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Package style={{ width: '18px', height: '18px', color: '#A68B6A' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>Material Requirements</h3>
            </div>
            <button
              onClick={() => navigate('/admin/ppc/material-requirements')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: '#6b7280',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#C59C82' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280' }}
            >
              View MRP <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                label: 'Total Requirements',
                value: mrpSummary?.byStatus?.reduce((sum, s) => sum + s.count, 0) || 0,
                icon: Layers,
                bg: '#f9fafb',
                iconBg: '#f3f4f6',
                iconColor: '#6b7280',
                valueColor: '#111827',
              },
              {
                label: 'With Shortfall',
                value: mrpSummary?.byStatus?.reduce((sum, s) => sum + (s.totalShortfall || 0), 0) || 0,
                icon: AlertTriangle,
                bg: '#fef2f2',
                iconBg: '#fee2e2',
                iconColor: '#ef4444',
                valueColor: '#b91c1c',
              },
              {
                label: 'Critical (7 days)',
                value: mrpSummary?.criticalShortfalls?.length || 0,
                icon: Clock,
                bg: '#fffbeb',
                iconBg: '#fef3c7',
                iconColor: '#d97706',
                valueColor: '#92400e',
              },
              {
                label: 'Fulfilled',
                value: mrpSummary?.byStatus?.find(s => s._id === 'fulfilled')?.count || 0,
                icon: CheckCircle,
                bg: '#ecfdf5',
                iconBg: '#d1fae5',
                iconColor: '#059669',
                valueColor: '#047857',
              }
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: item.bg,
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: item.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <item.icon style={{ width: '18px', height: '18px', color: item.iconColor }} />
                </div>
                <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#374151' }}>{item.label}</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: item.valueColor }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming Deadlines + Cost Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Upcoming Deadlines */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            padding: '22px 24px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#F5EDE6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Calendar style={{ width: '18px', height: '18px', color: '#A68B6A' }} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>Upcoming Deadlines</h3>
          </div>
          <div style={{ padding: '16px 24px' }}>
            {schedule?.workOrders?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {schedule.workOrders.slice(0, 5).map((wo) => {
                  const sc = statusColors[wo.status] || statusColors.draft
                  return (
                    <button
                      key={wo._id}
                      onClick={() => navigate(`/admin/ppc/work-orders/${wo._id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: '#fafbfc',
                        border: '1px solid transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.borderColor = 'transparent' }}
                    >
                      <div style={{
                        width: '6px',
                        height: '40px',
                        borderRadius: '3px',
                        background: sc.dot,
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {wo.workOrderId}
                        </p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {wo.item?.name || 'No item'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: 0 }}>
                          {formatDate(wo.schedule?.plannedEndDate)}
                        </p>
                        <span style={{
                          display: 'inline-block',
                          marginTop: '4px',
                          padding: '2px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: sc.bg,
                          color: sc.text,
                          textTransform: 'capitalize',
                        }}>
                          {wo.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <Calendar style={{ width: '40px', height: '40px', color: '#d1d5db', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>No upcoming deadlines</p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Summary */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            padding: '22px 24px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#F5EDE6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <DollarSign style={{ width: '18px', height: '18px', color: '#A68B6A' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>Cost Summary (Month)</h3>
            </div>
            <button
              onClick={() => navigate('/admin/ppc/production-costs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                color: '#6b7280',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#C59C82' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280' }}
            >
              Details <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Material Cost', value: costSummary?.currentMonthBreakdown?.materialCost || 0, color: '#C59C82', bg: '#FDF8F4', icon: Package },
                { label: 'Labor Cost', value: costSummary?.currentMonthBreakdown?.laborCost || 0, color: '#d97706', bg: '#fffbeb', icon: Users },
                { label: 'Overhead', value: costSummary?.currentMonthBreakdown?.overheadCost || 0, color: '#6366f1', bg: '#eef2ff', icon: BarChart3 },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: item.bg,
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${item.color}1a`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <item.icon style={{ width: '16px', height: '16px', color: item.color }} />
                  </div>
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: '#374151' }}>{item.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
            {/* Total */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)',
              boxShadow: '0 4px 12px rgba(197,156,130,0.3)',
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.85)' }}>Total Cost</span>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>
                {formatCurrency(costSummary?.currentMonthBreakdown?.totalCost || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          padding: '22px 24px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#F5EDE6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Zap style={{ width: '18px', height: '18px', color: '#A68B6A' }} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>Quick Actions</h3>
        </div>
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
          {[
            { label: 'New Work Order', icon: Factory, color: '#C59C82', bg: '#F5EDE6', path: '/admin/ppc/work-orders/new' },
            { label: 'Create BOM', icon: ClipboardList, color: '#059669', bg: '#ecfdf5', path: '/admin/ppc/bom/new' },
            { label: 'Issue Material', icon: Package, color: '#d97706', bg: '#fffbeb', path: '/admin/ppc/material-issues/new' },
            { label: 'Log Labor', icon: Users, color: '#6366f1', bg: '#eef2ff', path: '/admin/ppc/labor-entries/new' },
            { label: 'Submit DPR', icon: FileText, color: '#0891b2', bg: '#ecfeff', path: '/admin/ppc/daily-progress-reports/new' },
            { label: 'View Costs', icon: BarChart3, color: '#7c3aed', bg: '#f5f3ff', path: '/admin/ppc/production-costs' },
          ].map((action, i) => (
            <button
              key={i}
              onClick={() => navigate(action.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '24px 16px',
                borderRadius: '16px',
                border: '1px solid #f3f4f6',
                background: '#fafbfc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = action.bg
                e.currentTarget.style.borderColor = `${action.color}33`
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 6px 16px ${action.color}1a`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#fafbfc'
                e.currentTarget.style.borderColor = '#f3f4f6'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: action.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <action.icon style={{ width: '24px', height: '24px', color: action.color }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PPCDashboard
