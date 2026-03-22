import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, AlertCircle, FolderKanban, FileText, Palette, LogOut, CreditCard, Calendar, CheckCircle, Camera, TrendingUp, Image, Activity } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  cardLight: '#242424',
  accent: '#C59C82',
  accentLight: '#DDC5B0',
  textMuted: '#A1A1A1',
  textLight: '#E5E5E5',
  white: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.08)',
  danger: '#EF4444',
  success: '#22C55E',
}

const API_BASE = import.meta.env.DEV ? `http://${window.location.hostname}:5001/api` : 'https://hoh108.com/api'

const stageColors = {
  initiation: '#3B82F6', planning: '#F59E0B', design: '#8B5CF6',
  execution: '#C59C82', monitoring: '#06B6D4', closure: '#10B981', completed: '#10B981',
  active: '#C59C82', on_hold: '#F59E0B', cancelled: '#EF4444',
}

const typeIcons = {
  lead_created: Calendar, lead_qualified: CheckCircle, meeting: Calendar,
  design: Palette, sales_order: FileText, design_iteration: Palette,
  project: FolderKanban, invoice: CreditCard, progress_report: TrendingUp,
}

function CustomerDashboard({ customer, token, onLogout }) {
  const [activeTab, setActiveTab] = useState('projects')
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customer?._id) {
      fetch(`${API_BASE}/customer-portal/journey?customerId=${customer._id}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
        .then(r => r.json())
        .then(res => setJourney(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [customer, token])

  const projects = journey?.projects || []
  const invoices = journey?.invoices || []
  const designs = journey?.designIterations || []
  const timeline = journey?.timeline || []
  const milestones = journey?.paymentMilestones || []
  const progressReports = journey?.progressReports || []
  const sitePhotos = journey?.sitePhotos || []
  const projectImages = journey?.projectImages || []
  const progressSummary = journey?.progressSummary || []
  const allMedia = [...sitePhotos, ...projectImages].sort((a, b) => new Date(b.uploadedAt || b.createdAt || 0) - new Date(a.uploadedAt || a.createdAt || 0))

  const tabs = [
    { key: 'projects', label: 'My Projects', icon: FolderKanban, count: projects.length },
    { key: 'progress', label: 'Progress', icon: TrendingUp, count: progressReports.length },
    { key: 'site-updates', label: 'Site Updates', icon: Camera, count: allMedia.length },
    { key: 'payments', label: 'Payments', icon: CreditCard, count: milestones.length },
    { key: 'invoices', label: 'Invoices', icon: FileText, count: invoices.length },
    { key: 'designs', label: 'Designs', icon: Palette, count: designs.length },
    { key: 'timeline', label: 'Timeline', icon: Calendar, count: timeline.length },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark, display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ flex: 1, paddingTop: '90px', padding: '90px 24px 40px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Welcome Bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 32, flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 28, color: COLORS.white, margin: '0 0 4px' }}>
                Welcome, {customer?.name}
              </h1>
              <p style={{ color: COLORS.textMuted, fontSize: 14, margin: 0 }}>
                {customer?.customerId} &middot; {customer?.email}
              </p>
            </div>
            <button onClick={onLogout} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, color: '#EF4444', fontSize: 14, cursor: 'pointer', fontWeight: 500,
            }}>
              <LogOut size={16} /> Logout
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {tabs.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                    background: active ? COLORS.accent : COLORS.card,
                    color: active ? COLORS.dark : COLORS.textMuted,
                    border: `1px solid ${active ? COLORS.accent : COLORS.border}`,
                    borderRadius: 10, fontSize: 14, fontWeight: active ? 600 : 400,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <Icon size={16} /> {tab.label}
                  {tab.count > 0 && (
                    <span style={{
                      background: active ? 'rgba(0,0,0,0.2)' : 'rgba(197,156,130,0.2)',
                      color: active ? COLORS.dark : COLORS.accent,
                      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    }}>{tab.count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: COLORS.textMuted }}>Loading your data...</div>
          ) : (
            <>
              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {projects.length === 0 ? (
                    <div style={{ background: COLORS.card, borderRadius: 16, padding: 48, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
                      <FolderKanban size={40} style={{ color: COLORS.textMuted, marginBottom: 12 }} />
                      <p style={{ color: COLORS.textMuted, margin: 0 }}>No projects yet</p>
                    </div>
                  ) : projects.map(p => {
                    const projectMilestones = milestones.filter(m => (m.project?._id || m.project) === p._id || String(m.project) === String(p._id))
                    const fin = p.financials || {}
                    const milestoneTotal = projectMilestones.reduce((s, m) => s + (m.amount || 0), 0)
                    const milestoneCollected = projectMilestones.reduce((s, m) => s + (m.collectedAmount || 0), 0)
                    const totalAmount = milestoneTotal || fin.finalAmount || fin.agreedAmount || fin.quotedAmount || 0
                    const totalPaid = milestoneCollected || fin.totalPaid || 0
                    const pending = totalAmount - totalPaid
                    const paidPercent = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0
                    const paidMilestones = projectMilestones.filter(m => m.status === 'paid').length
                    const totalMilestones = projectMilestones.length

                    return (
                    <div key={p._id} style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.white, margin: '0 0 6px' }}>{p.title || p.projectId}</h3>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, color: COLORS.textMuted }}>{p.projectId}</span>
                            {p.category && (
                              <span style={{ padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(197,156,130,0.15)', color: COLORS.accent }}>
                                {p.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </span>
                            )}
                            {p.priority && (
                              <span style={{
                                padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                background: p.priority === 'high' ? 'rgba(239,68,68,0.15)' : p.priority === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(107,114,128,0.15)',
                                color: p.priority === 'high' ? '#EF4444' : p.priority === 'medium' ? '#F59E0B' : '#6B7280',
                              }}>
                                {p.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{
                          padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          background: `${stageColors[p.stage] || '#6B7280'}20`, color: stageColors[p.stage] || '#6B7280',
                        }}>
                          {(p.stage || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </div>

                      {/* Description */}
                      {p.description && (
                        <p style={{ fontSize: 14, color: COLORS.textMuted, margin: '0 0 16px', lineHeight: 1.5 }}>{p.description}</p>
                      )}

                      {/* Financial Summary */}
                      {totalAmount > 0 && (
                        <div style={{ background: COLORS.cardLight, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontSize: 13, color: COLORS.textMuted }}>Payment Progress</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent }}>{paidPercent}%</span>
                          </div>
                          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                            <div style={{ height: '100%', width: `${paidPercent}%`, background: paidPercent >= 100 ? '#10B981' : COLORS.accent, borderRadius: 3, transition: 'width 0.5s' }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: totalMilestones > 0 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 12 }}>
                            <div>
                              <span style={{ fontSize: 11, color: COLORS.textMuted, display: 'block' }}>Total Value</span>
                              <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.white }}>&#8377;{totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: 11, color: COLORS.textMuted, display: 'block' }}>Paid</span>
                              <span style={{ fontSize: 16, fontWeight: 700, color: '#10B981' }}>&#8377;{totalPaid.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: 11, color: COLORS.textMuted, display: 'block' }}>Pending</span>
                              <span style={{ fontSize: 16, fontWeight: 700, color: pending > 0 ? '#F59E0B' : '#10B981' }}>&#8377;{pending.toLocaleString('en-IN')}</span>
                            </div>
                            {totalMilestones > 0 && (
                              <div>
                                <span style={{ fontSize: 11, color: COLORS.textMuted, display: 'block' }}>Milestones</span>
                                <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.accent }}>{paidMilestones}/{totalMilestones}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Team Section */}
                      {(() => {
                        const team = []
                        if (p.projectManager?.name) team.push({ name: p.projectManager.name, role: 'Project Manager', phone: p.projectManager.phone, designation: p.projectManager.designation })
                        const da = p.departmentAssignments || {}
                        if (da.design?.lead?.name) team.push({ name: da.design.lead.name, role: 'Design Lead', phone: da.design.lead.phone, designation: da.design.lead.designation })
                        if (da.operations?.lead?.name) team.push({ name: da.operations.lead.name, role: 'Operations Lead', phone: da.operations.lead.phone, designation: da.operations.lead.designation })
                        ;(da.design?.team || []).forEach(t => { if (t?.name) team.push({ name: t.name, role: 'Designer', phone: t.phone, designation: t.designation }) })
                        ;(da.operations?.team || []).forEach(t => { if (t?.name) team.push({ name: t.name, role: 'Operations', phone: t.phone, designation: t.designation }) })
                        ;(p.teamMembers || []).forEach(tm => {
                          const u = tm.user || tm
                          if (u?.name && !team.some(t => t.name === u.name)) team.push({ name: u.name, role: tm.role || 'Team Member', phone: u.phone, designation: u.designation })
                        })

                        return team.length > 0 ? (
                          <div style={{ background: COLORS.cardLight, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Project Team</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                              {team.map((t, idx) => (
                                <div key={idx} style={{
                                  display: 'flex', alignItems: 'center', gap: 10, background: COLORS.card,
                                  borderRadius: 10, padding: '10px 14px', border: `1px solid ${COLORS.border}`, minWidth: 200,
                                }}>
                                  <div style={{
                                    width: 36, height: 36, borderRadius: '50%', background: `${COLORS.accent}25`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 700, color: COLORS.accent, flexShrink: 0,
                                  }}>
                                    {t.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.white, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</p>
                                    <p style={{ fontSize: 11, color: COLORS.accent, margin: '2px 0 0', fontWeight: 500 }}>{t.designation || t.role}</p>
                                    {t.phone && <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '2px 0 0' }}>{t.phone}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null
                      })()}

                      {/* Details row */}
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLORS.textMuted }}>
                          <Calendar size={14} />
                          <span>Started {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                        </div>
                        {p.specifications?.area?.value && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLORS.textMuted }}>
                            <span>{p.specifications.area.value} {p.specifications.area.unit}</span>
                          </div>
                        )}
                        {p.location?.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLORS.textMuted }}>
                            <span>{p.location.city}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}

              {/* Progress Tab */}
              {activeTab === 'progress' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {progressSummary.length === 0 && progressReports.length === 0 ? (
                    <div style={{ background: COLORS.card, borderRadius: 16, padding: 48, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
                      <TrendingUp size={40} style={{ color: COLORS.textMuted, marginBottom: 12 }} />
                      <p style={{ color: COLORS.textMuted, margin: 0 }}>No progress reports yet</p>
                      <p style={{ color: COLORS.textMuted, fontSize: 13, margin: '8px 0 0' }}>Progress updates will appear here once your project begins</p>
                    </div>
                  ) : (
                    <>
                      {/* Project Progress Cards */}
                      {progressSummary.map((ps, idx) => {
                        const pct = ps.completionPercentage || 0
                        const statusColor = ps.progressStatus === 'ahead' ? '#10B981' : ps.progressStatus === 'on_track' ? '#3B82F6' : ps.progressStatus === 'behind' ? '#F59E0B' : '#EF4444'
                        return (
                          <div key={idx} style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                              <div>
                                <h3 style={{ fontSize: 17, fontWeight: 600, color: COLORS.white, margin: '0 0 4px' }}>{ps.projectTitle}</h3>
                                <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>{ps.projectId} &middot; Stage: {(ps.stage || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.accent }}>{pct}%</span>
                                <p style={{ fontSize: 11, color: statusColor, fontWeight: 600, margin: '2px 0 0' }}>{(ps.progressStatus || 'on_track').replace(/_/g, ' ').toUpperCase()}</p>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 14 }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.accent}, ${statusColor})`, borderRadius: 4, transition: 'width 0.8s ease' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: COLORS.textMuted, flexWrap: 'wrap' }}>
                              <span>{ps.totalReports} progress reports</span>
                              <span>{ps.photoCount} site photos</span>
                              {ps.lastReportDate && <span>Last update: {new Date(ps.lastReportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                            </div>
                          </div>
                        )
                      })}

                      {/* Recent Progress Reports */}
                      {progressReports.length > 0 && (
                        <>
                          <h3 style={{ fontSize: 15, fontWeight: 600, color: COLORS.textMuted, margin: '8px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Updates</h3>
                          {progressReports.slice(0, 10).map((dpr, idx) => {
                            const pct = dpr.overallProgress?.actual || 0
                            const photoCount = dpr.photos?.length || 0
                            const activityCount = dpr.activities?.length || 0
                            const completedActivities = dpr.activities?.filter(a => a.status === 'completed').length || 0
                            return (
                              <div key={idx} style={{ background: COLORS.card, borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${COLORS.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Activity size={18} color={COLORS.accent} />
                                    </div>
                                    <div>
                                      <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.white, margin: 0 }}>
                                        {new Date(dpr.reportDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                      </p>
                                      <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '2px 0 0' }}>
                                        by {dpr.submittedBy?.name || 'Site Team'}
                                      </p>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.accent }}>{pct}%</span>
                                </div>

                                {/* Activities summary */}
                                {activityCount > 0 && (
                                  <div style={{ marginBottom: 12 }}>
                                    {dpr.activities.slice(0, 4).map((act, i) => (
                                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < Math.min(activityCount, 4) - 1 ? `1px solid ${COLORS.border}` : 'none' }}>
                                        <div style={{
                                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                          background: act.status === 'completed' ? '#10B981' : act.status === 'in_progress' ? '#3B82F6' : act.status === 'delayed' ? '#EF4444' : '#6B7280'
                                        }} />
                                        <span style={{ fontSize: 13, color: COLORS.textLight, flex: 1 }}>{act.activityName}</span>
                                        {act.percentage !== undefined && <span style={{ fontSize: 12, color: COLORS.textMuted }}>{act.percentage}%</span>}
                                      </div>
                                    ))}
                                    {activityCount > 4 && <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '6px 0 0' }}>+{activityCount - 4} more activities</p>}
                                  </div>
                                )}

                                {/* Photos preview */}
                                {photoCount > 0 && (
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {dpr.photos.slice(0, 4).map((photo, i) => (
                                      <div key={i} style={{
                                        width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}`, position: 'relative',
                                      }}>
                                        <img src={photo.url} alt={photo.caption || 'Site photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = COLORS.cardLight; e.target.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%"><span style="color:#666;font-size:10px">No preview</span></div>' }} />
                                        {i === 3 && photoCount > 4 && (
                                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700 }}>
                                            +{photoCount - 4}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: COLORS.textMuted }}>
                                  <span>{completedActivities}/{activityCount} activities done</span>
                                  {photoCount > 0 && <span>{photoCount} photos</span>}
                                  {dpr.weather?.condition && <span>Weather: {dpr.weather.condition}</span>}
                                </div>
                              </div>
                            )
                          })}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Site Updates / Photos Tab */}
              {activeTab === 'site-updates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {allMedia.length === 0 ? (
                    <div style={{ background: COLORS.card, borderRadius: 16, padding: 48, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
                      <Camera size={40} style={{ color: COLORS.textMuted, marginBottom: 12 }} />
                      <p style={{ color: COLORS.textMuted, margin: 0 }}>No site photos yet</p>
                      <p style={{ color: COLORS.textMuted, fontSize: 13, margin: '8px 0 0' }}>Photos and videos from your project site will appear here</p>
                    </div>
                  ) : (
                    <>
                      {/* Category filter */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {['all', 'progress', 'quality', 'before', 'during', 'after', 'design', 'safety', 'issue'].map(cat => {
                          const count = cat === 'all' ? allMedia.length : allMedia.filter(m => m.category === cat).length
                          if (cat !== 'all' && count === 0) return null
                          return (
                            <button key={cat} style={{
                              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: `1px solid ${COLORS.border}`,
                              background: COLORS.card, color: COLORS.textMuted, cursor: 'pointer', textTransform: 'capitalize',
                            }}>
                              {cat} ({count})
                            </button>
                          )
                        })}
                      </div>

                      {/* Photo grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                        {allMedia.map((media, idx) => (
                          <div key={idx} style={{
                            borderRadius: 12, overflow: 'hidden', border: `1px solid ${COLORS.border}`,
                            background: COLORS.card, position: 'relative',
                          }}>
                            <div style={{ width: '100%', paddingTop: '100%', position: 'relative', background: COLORS.cardLight }}>
                              <img src={media.url} alt={media.caption || 'Site photo'}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none' }} />
                              {media.category && (
                                <span style={{
                                  position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 6,
                                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                                  background: 'rgba(0,0,0,0.6)', color: '#fff',
                                }}>{media.category}</span>
                              )}
                            </div>
                            <div style={{ padding: '10px 12px' }}>
                              {media.caption && <p style={{ fontSize: 12, color: COLORS.textLight, margin: '0 0 4px', lineHeight: 1.3 }}>{media.caption}</p>}
                              <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>
                                {media.uploadedAt ? new Date(media.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                                {media.submittedBy ? ` · ${media.submittedBy}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {milestones.length === 0 ? (
                    <div style={{ background: COLORS.card, borderRadius: 16, padding: 48, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
                      <CreditCard size={40} style={{ color: COLORS.textMuted, marginBottom: 12 }} />
                      <p style={{ color: COLORS.textMuted, margin: 0 }}>No payment milestones yet</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary */}
                      <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 20 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
                          <div>
                            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Total</span>
                            <p style={{ fontSize: 20, fontWeight: 700, color: COLORS.white, margin: '4px 0 0' }}>
                              &#8377;{milestones.reduce((s, m) => s + (m.amount || 0), 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Collected</span>
                            <p style={{ fontSize: 20, fontWeight: 700, color: '#10B981', margin: '4px 0 0' }}>
                              &#8377;{milestones.reduce((s, m) => s + (m.collectedAmount || 0), 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Remaining</span>
                            <p style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B', margin: '4px 0 0' }}>
                              &#8377;{milestones.reduce((s, m) => s + Math.max(0, (m.amount || 0) - (m.collectedAmount || 0)), 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Milestone list */}
                      {milestones.map((m, i) => {
                        const isPaid = m.status === 'paid'
                        const isPartial = m.collectedAmount > 0 && m.collectedAmount < m.amount
                        const statusColor = isPaid ? '#10B981' : isPartial ? '#F59E0B' : '#6B7280'
                        const statusLabel = isPaid ? 'Paid' : isPartial ? 'Partial' : m.status === 'due' ? 'Due' : 'Upcoming'
                        return (
                          <div key={m._id || i} style={{
                            background: COLORS.card, borderRadius: 14, border: `1px solid ${COLORS.border}`,
                            padding: 20, display: 'flex', alignItems: 'center', gap: 16,
                          }}>
                            {/* Step circle */}
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                              background: isPaid ? '#10B98120' : `${COLORS.border}`,
                              border: `2px solid ${statusColor}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 700, color: statusColor,
                            }}>
                              {isPaid ? <CheckCircle size={18} /> : i + 1}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: 15, fontWeight: 600, color: COLORS.white, margin: '0 0 2px' }}>{m.name}</h4>
                              <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0 }}>
                                {m.percentage ? `${m.percentage}%` : ''}
                                {m.dueDate ? ` \u00b7 Due: ${new Date(m.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}
                              </p>
                            </div>

                            {/* Amount */}
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.white, margin: '0 0 4px' }}>
                                &#8377;{(m.amount || 0).toLocaleString('en-IN')}
                              </p>
                              {m.collectedAmount > 0 && (
                                <p style={{ fontSize: 12, color: '#10B981', margin: 0 }}>
                                  Collected: &#8377;{m.collectedAmount.toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>

                            {/* Status badge */}
                            <span style={{
                              padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              background: `${statusColor}20`, color: statusColor, whiteSpace: 'nowrap',
                            }}>
                              {statusLabel}
                            </span>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}

              {/* Invoices Tab */}
              {activeTab === 'invoices' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {invoices.length === 0 ? (
                    <div style={{ background: COLORS.card, borderRadius: 16, padding: 48, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
                      <FileText size={40} style={{ color: COLORS.textMuted, marginBottom: 12 }} />
                      <p style={{ color: COLORS.textMuted, margin: 0 }}>No invoices yet</p>
                    </div>
                  ) : invoices.map(inv => (
                    <div key={inv._id} style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.white, margin: '0 0 4px' }}>{inv.invoiceNumber}</h3>
                          <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : ''}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 17, fontWeight: 700, color: COLORS.white, margin: '0 0 4px' }}>&#8377;{(inv.invoiceTotal || 0).toLocaleString('en-IN')}</p>
                          <span style={{
                            padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: inv.status === 'paid' ? '#10B98120' : inv.status === 'overdue' ? '#EF444420' : '#F59E0B20',
                            color: inv.status === 'paid' ? '#10B981' : inv.status === 'overdue' ? '#EF4444' : '#F59E0B',
                          }}>
                            {(inv.status || 'pending').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Designs Tab */}
              {activeTab === 'designs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {designs.length === 0 ? (
                    <div style={{ background: COLORS.card, borderRadius: 16, padding: 48, textAlign: 'center', border: `1px solid ${COLORS.border}` }}>
                      <Palette size={40} style={{ color: COLORS.textMuted, marginBottom: 12 }} />
                      <p style={{ color: COLORS.textMuted, margin: 0 }}>No design iterations yet</p>
                    </div>
                  ) : designs.map(d => (
                    <div key={d._id} style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.white, margin: '0 0 4px' }}>{d.title || d.iterationNumber || 'Design'}</h3>
                          <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>{d.category || d.type || ''}</p>
                        </div>
                        <span style={{
                          padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                          background: `${stageColors[d.status] || '#6B7280'}20`, color: stageColors[d.status] || '#6B7280',
                        }}>
                          {(d.status || 'draft').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingLeft: 20 }}>
                  {timeline.length === 0 ? (
                    <div style={{ background: COLORS.card, borderRadius: 16, padding: 48, textAlign: 'center', border: `1px solid ${COLORS.border}`, marginLeft: -20 }}>
                      <Calendar size={40} style={{ color: COLORS.textMuted, marginBottom: 12 }} />
                      <p style={{ color: COLORS.textMuted, margin: 0 }}>No activity yet</p>
                    </div>
                  ) : timeline.map((event, i) => {
                    const Icon = typeIcons[event.type] || Calendar
                    const color = stageColors[event.type] || COLORS.accent
                    return (
                      <div key={i} style={{ display: 'flex', gap: 16, position: 'relative', paddingBottom: 24 }}>
                        {i < timeline.length - 1 && <div style={{ position: 'absolute', left: 11, top: 28, bottom: 0, width: 2, background: COLORS.border }} />}
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', background: `${color}20`, border: `2px solid ${color}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon size={12} color={color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: COLORS.white, margin: '0 0 2px' }}>{event.title}</p>
                          <p style={{ fontSize: 12, color: COLORS.textMuted, margin: 0 }}>
                            {event.date ? new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customer, setCustomer] = useState(null)
  const [token, setToken] = useState(null)

  // Check if already logged in
  useEffect(() => {
    const savedToken = localStorage.getItem('hoh108_customer_token')
    const savedCustomer = localStorage.getItem('hoh108_customer')
    if (savedToken && savedCustomer) {
      setToken(savedToken)
      setCustomer(JSON.parse(savedCustomer))
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/customer-portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      localStorage.setItem('hoh108_customer_token', data.token)
      localStorage.setItem('hoh108_customer', JSON.stringify(data.data))
      setToken(data.token)
      setCustomer(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('hoh108_customer_token')
    localStorage.removeItem('hoh108_customer')
    setToken(null)
    setCustomer(null)
  }

  // If logged in, show dashboard
  if (customer && token) {
    return <CustomerDashboard customer={customer} token={token} onLogout={handleLogout} />
  }

  // Login form
  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark, display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        paddingTop: '100px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 30% 20%, ${COLORS.accent}10 0%, transparent 50%)`,
        }} />

        <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link to="/" style={{ display: 'inline-block' }}>
            <img src="/Logo.png" alt="HOH108" style={{ height: '60px', marginBottom: '24px', display: 'block', margin: '0 auto 24px' }} />
          </Link>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '32px',
            color: COLORS.white,
            marginBottom: '8px',
          }}>
            Welcome Back
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '15px' }}>
            Sign in to access your account
          </p>
        </div>

        <div style={{
          backgroundColor: COLORS.card,
          borderRadius: '24px',
          padding: '40px 32px',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 16px',
              backgroundColor: `${COLORS.danger}15`,
              borderRadius: '12px',
              marginBottom: '24px',
              border: `1px solid ${COLORS.danger}30`,
            }}>
              <AlertCircle size={18} color={COLORS.danger} />
              <p style={{ color: COLORS.danger, fontSize: '14px' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', color: COLORS.textLight, fontSize: '14px',
                marginBottom: '10px', fontWeight: 500,
              }}>
                Email Address
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                backgroundColor: COLORS.cardLight, borderRadius: '12px',
                padding: '16px', border: `1px solid ${COLORS.border}`,
              }}>
                <Mail size={20} color={COLORS.textMuted} />
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  style={{ flex: 1, background: 'none', border: 'none', color: COLORS.white, fontSize: '15px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block', color: COLORS.textLight, fontSize: '14px',
                marginBottom: '10px', fontWeight: 500,
              }}>
                Password
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                backgroundColor: COLORS.cardLight, borderRadius: '12px',
                padding: '16px', border: `1px solid ${COLORS.border}`,
              }}>
                <Lock size={20} color={COLORS.textMuted} />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{ flex: 1, background: 'none', border: 'none', color: COLORS.white, fontSize: '15px', outline: 'none' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: '4px' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '18px',
                backgroundColor: loading ? COLORS.cardLight : COLORS.accent,
                color: loading ? COLORS.textMuted : COLORS.dark,
                border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = '#A68B6A'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(197,156,130,0.4)' } }}
              onMouseOut={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = COLORS.accent; e.currentTarget.style.boxShadow = 'none' } }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '28px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.border }} />
            <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.border }} />
          </div>

          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '14px' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: COLORS.accent, textDecoration: 'none', fontWeight: 500 }}>
              Sign up for free
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '12px', marginTop: '32px' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
      </div>

      <Footer />
    </div>
  )
}

export default Login
