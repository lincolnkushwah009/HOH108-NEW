import { useState, useEffect, useCallback } from 'react'
import {
  X, Save, RefreshCw, ChevronRight, ExternalLink,
  User, Users, Calendar, MapPin, IndianRupee, FileText,
  Package, Truck, Receipt, CreditCard, Wrench, ClipboardList,
  CheckCircle2, Clock, AlertCircle, Flag, BarChart3,
  Milestone, MessageSquare, Plus, Edit3, Eye, Hash,
  Building2, Briefcase, TrendingUp, TrendingDown, Target,
  ShieldCheck, CircleDot, Layers, ArrowUpRight
} from 'lucide-react'
import { projectsAPI } from '../../utils/api'

// ── Helpers ──
const fmt = (n) => {
  if (n == null || isNaN(n)) return '-'
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

const fmtCurrency = (n) => {
  if (n == null || isNaN(n)) return '-'
  const num = Number(n)
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`
  if (num >= 100000) return `${(num / 100000).toFixed(2)} L`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString('en-IN')
}

const fmtDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtDateTime = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_COLORS = {
  draft: { bg: '#F3F4F6', color: '#374151' },
  active: { bg: '#D1FAE5', color: '#065F46' },
  on_hold: { bg: '#FEF3C7', color: '#92400E' },
  completed: { bg: '#DBEAFE', color: '#1E40AF' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B' },
  pending: { bg: '#FEF3C7', color: '#92400E' },
  approved: { bg: '#D1FAE5', color: '#065F46' },
  rejected: { bg: '#FEE2E2', color: '#991B1B' },
  sent: { bg: '#E0E7FF', color: '#3730A3' },
  confirmed: { bg: '#D1FAE5', color: '#065F46' },
  partially_delivered: { bg: '#FEF3C7', color: '#92400E' },
  fully_delivered: { bg: '#D1FAE5', color: '#065F46' },
  invoiced: { bg: '#E0E7FF', color: '#3730A3' },
  paid: { bg: '#D1FAE5', color: '#065F46' },
  closed: { bg: '#F3F4F6', color: '#374151' },
  received: { bg: '#D1FAE5', color: '#065F46' },
  inspection_pending: { bg: '#FEF3C7', color: '#92400E' },
  inspection_completed: { bg: '#DBEAFE', color: '#1E40AF' },
  partially_accepted: { bg: '#FEF3C7', color: '#92400E' },
  accepted: { bg: '#D1FAE5', color: '#065F46' },
  overdue: { bg: '#FEE2E2', color: '#991B1B' },
  partially_paid: { bg: '#FEF3C7', color: '#92400E' },
  unpaid: { bg: '#FEE2E2', color: '#991B1B' },
  processing: { bg: '#E0E7FF', color: '#3730A3' },
  failed: { bg: '#FEE2E2', color: '#991B1B' },
  reversed: { bg: '#FEE2E2', color: '#991B1B' },
  submitted: { bg: '#E0E7FF', color: '#3730A3' },
  pending_approval: { bg: '#FEF3C7', color: '#92400E' },
  partially_approved: { bg: '#FEF3C7', color: '#92400E' },
  converted: { bg: '#D1FAE5', color: '#065F46' },
  in_progress: { bg: '#DBEAFE', color: '#1E40AF' },
  initiated: { bg: '#E0E7FF', color: '#3730A3' },
  planned: { bg: '#EDE9FE', color: '#5B21B6' },
  pending_qc: { bg: '#FEF3C7', color: '#92400E' },
  rework: { bg: '#FEE2E2', color: '#991B1B' },
  viewed: { bg: '#E0E7FF', color: '#3730A3' },
}

const getStatusStyle = (status) => STATUS_COLORS[status] || { bg: '#F3F4F6', color: '#374151' }

const StatusBadge = ({ status, label }) => {
  const s = getStatusStyle(status)
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '6px',
      fontSize: '11px', fontWeight: '600', backgroundColor: s.bg, color: s.color,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
    }}>
      {label || (status || '').replace(/_/g, ' ')}
    </span>
  )
}

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#6B7280' },
  medium: { label: 'Medium', color: '#D97706' },
  high: { label: 'High', color: '#DC2626' },
  urgent: { label: 'Urgent', color: '#7C2D12' },
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: Eye },
  { key: 'erp', label: 'ERP Records', icon: FileText },
  { key: 'milestones', label: 'Milestones', icon: Milestone },
  { key: 'team', label: 'Team & Effort', icon: Users },
  { key: 'activity', label: 'Activity', icon: MessageSquare },
]

// ══════════════════════════════════════════════════════════════
// MAIN MODAL
// ══════════════════════════════════════════════════════════════
const ProjectKanbanDetailModal = ({ projectId, onClose, onSave }) => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Data
  const [project, setProject] = useState(null)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [goodsReceipts, setGoodsReceipts] = useState([])
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [purchaseRequisitions, setPurchaseRequisitions] = useState([])
  const [paymentMilestones, setPaymentMilestones] = useState([])

  // Edit state
  const [editFields, setEditFields] = useState({})
  const [hasChanges, setHasChanges] = useState(false)

  // Activity note
  const [newNote, setNewNote] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await projectsAPI.getKanbanDetail(projectId)
      const d = res.data
      setProject(d.project)
      setPurchaseOrders(d.purchaseOrders || [])
      setGoodsReceipts(d.goodsReceipts || [])
      setInvoices(d.invoices || [])
      setPayments(d.payments || [])
      setWorkOrders(d.workOrders || [])
      setPurchaseRequisitions(d.purchaseRequisitions || [])
      setPaymentMilestones(d.paymentMilestones || [])

      // Initialize edit fields from project
      setEditFields({
        title: d.project.title || '',
        description: d.project.description || '',
        status: d.project.status || 'active',
        priority: d.project.priority || 'medium',
        stage: d.project.stage || 'initiation',
        category: d.project.category || '',
        completionPercentage: d.project.completion?.completionPercentage || 0,
      })
      setHasChanges(false)
    } catch (err) {
      setError(err.message || 'Failed to load project details')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchData() }, [fetchData])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleFieldChange = (field, value) => {
    setEditFields(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const updateData = {
        title: editFields.title,
        description: editFields.description,
        status: editFields.status,
        priority: editFields.priority,
        stage: editFields.stage,
        category: editFields.category,
        completion: { completionPercentage: Number(editFields.completionPercentage) },
      }
      await projectsAPI.update(projectId, updateData)
      setHasChanges(false)
      onSave?.()
      fetchData()
    } catch (err) {
      alert('Failed to save: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      await projectsAPI.update(projectId, {
        $push: {
          activities: {
            action: 'note_added',
            description: newNote.trim(),
          }
        }
      })
      setNewNote('')
      fetchData()
    } catch (err) {
      alert('Failed to add note: ' + (err.message || 'Unknown error'))
    }
  }

  // Computed values
  const paymentsIn = payments.filter(p => p.paymentType === 'incoming')
  const paymentsOut = payments.filter(p => p.paymentType === 'outgoing')

  const totalPOAmount = purchaseOrders.reduce((s, po) => s + (po.poTotal || 0), 0)
  const totalInvoiced = invoices.reduce((s, inv) => s + (inv.invoiceTotal || 0), 0)
  const totalPaid = invoices.reduce((s, inv) => s + (inv.paidAmount || 0), 0)
  const totalBalance = invoices.reduce((s, inv) => s + (inv.balanceAmount || 0), 0)
  const totalPaymentsIn = paymentsIn.reduce((s, p) => s + (p.amount || 0), 0)
  const totalPaymentsOut = paymentsOut.reduce((s, p) => s + (p.amount || 0), 0)

  const totalLaborCost = workOrders.reduce((s, wo) => s + (wo.actualCost?.labor || wo.estimatedCost?.labor || 0), 0)
  const totalMaterialCost = workOrders.reduce((s, wo) => s + (wo.actualCost?.material || wo.estimatedCost?.material || 0), 0)
  const totalWOCost = workOrders.reduce((s, wo) => {
    const ac = wo.actualCost || wo.estimatedCost || {}
    return s + (ac.material || 0) + (ac.labor || 0) + (ac.overhead || 0)
  }, 0)

  // ── Render ──
  if (!projectId) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .kbd-table { width: 100%; border-collapse: separate; border-spacing: 0; }
        .kbd-table th { position: sticky; top: 0; background: #F9FAFB; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #E5E7EB; }
        .kbd-table td { padding: 10px 12px; font-size: 13px; color: #374151; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
        .kbd-table tr:hover td { background: #F9FAFB; }
        .kbd-section { margin-bottom: 28px; }
        .kbd-section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 15px; font-weight: 700; color: #111827; }
        .kbd-field { margin-bottom: 16px; }
        .kbd-field-label { display: block; font-size: 12px; font-weight: 600; color: #6B7280; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.03em; }
        .kbd-field-value { font-size: 14px; color: #111827; font-weight: 500; }
        .kbd-input { width: 100%; padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; outline: none; box-sizing: border-box; transition: border-color 0.15s; }
        .kbd-input:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .kbd-select { padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; outline: none; background: #fff; cursor: pointer; }
        .kbd-select:focus { border-color: #3B82F6; }
        .kbd-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; }
        .kbd-stat { text-align: center; padding: 12px; }
        .kbd-stat-value { font-size: 20px; font-weight: 800; color: #111827; }
        .kbd-stat-label { font-size: 11px; color: #6B7280; font-weight: 600; margin-top: 2px; }
        .kbd-empty { text-align: center; padding: 40px 20px; color: #9CA3AF; }
        .kbd-empty-icon { margin-bottom: 8px; opacity: 0.4; }
        .kbd-scrollable::-webkit-scrollbar { width: 6px; }
        .kbd-scrollable::-webkit-scrollbar-track { background: transparent; }
        .kbd-scrollable::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 3px; }
        .kbd-scrollable::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
      `}</style>

      <div style={{
        width: '95vw', maxWidth: '1200px', height: '92vh',
        backgroundColor: '#fff', borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideUp 0.25s ease-out',
      }}>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid #E5E7EB',
          background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Layers size={20} color="#fff" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 style={{
                margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {project?.title || 'Loading...'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6B7280' }}>
                {project?.projectId || ''}
                {project?.customer?.name ? ` • ${project.customer.name}` : ''}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasChanges && (
              <button onClick={handleSave} disabled={saving} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', backgroundColor: '#3B82F6', color: '#fff',
                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
              }}>
                {saving ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            <button onClick={onClose} style={{
              width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#F3F4F6', border: 'none', borderRadius: '8px', cursor: 'pointer',
            }}>
              <X size={18} color="#6B7280" />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: '2px', padding: '0 24px',
          borderBottom: '1px solid #E5E7EB', background: '#FAFBFC',
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            let badge = null
            if (tab.key === 'erp') {
              const total = purchaseOrders.length + goodsReceipts.length + invoices.length + payments.length + workOrders.length + purchaseRequisitions.length
              if (total > 0) badge = total
            }
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '12px 16px', backgroundColor: 'transparent',
                border: 'none', borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                color: isActive ? '#3B82F6' : '#6B7280',
                fontSize: '13px', fontWeight: isActive ? '700' : '500',
                cursor: 'pointer', transition: 'all 0.15s', marginBottom: '-1px',
              }}>
                <Icon size={15} />
                {tab.label}
                {badge != null && (
                  <span style={{
                    padding: '1px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: '700',
                    backgroundColor: isActive ? '#3B82F6' : '#E5E7EB',
                    color: isActive ? '#fff' : '#6B7280',
                  }}>{badge}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Content ── */}
        <div className="kbd-scrollable" style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '12px', color: '#9CA3AF' }}>
              <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Loading project details...</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '12px', color: '#DC2626' }}>
              <AlertCircle size={32} />
              <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
              <button onClick={fetchData} style={{ padding: '8px 16px', backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Retry</button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab project={project} editFields={editFields} onChange={handleFieldChange} />}
              {activeTab === 'erp' && (
                <ERPRecordsTab
                  purchaseRequisitions={purchaseRequisitions}
                  purchaseOrders={purchaseOrders}
                  goodsReceipts={goodsReceipts}
                  invoices={invoices}
                  paymentsIn={paymentsIn}
                  paymentsOut={paymentsOut}
                  workOrders={workOrders}
                />
              )}
              {activeTab === 'milestones' && (
                <MilestonesTab
                  project={project}
                  purchaseOrders={purchaseOrders}
                  invoices={invoices}
                  payments={payments}
                  paymentMilestones={paymentMilestones}
                />
              )}
              {activeTab === 'team' && (
                <TeamTab
                  project={project}
                  workOrders={workOrders}
                  totalPOAmount={totalPOAmount}
                  totalLaborCost={totalLaborCost}
                  totalMaterialCost={totalMaterialCost}
                  totalWOCost={totalWOCost}
                  totalPaymentsIn={totalPaymentsIn}
                  totalPaymentsOut={totalPaymentsOut}
                  totalInvoiced={totalInvoiced}
                  totalPaid={totalPaid}
                  totalBalance={totalBalance}
                />
              )}
              {activeTab === 'activity' && (
                <ActivityTab project={project} newNote={newNote} setNewNote={setNewNote} onAddNote={handleAddNote} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB 1: OVERVIEW
// ══════════════════════════════════════════════════════════════
const OverviewTab = ({ project, editFields, onChange }) => {
  if (!project) return null
  const p = project
  const fin = p.financials || {}

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Left Column */}
      <div>
        {/* Project Info */}
        <div className="kbd-section">
          <div className="kbd-section-title"><Edit3 size={16} color="#3B82F6" /> Project Information</div>
          <div className="kbd-card">
            <div className="kbd-field">
              <label className="kbd-field-label">Title</label>
              <input className="kbd-input" value={editFields.title} onChange={e => onChange('title', e.target.value)} />
            </div>
            <div className="kbd-field">
              <label className="kbd-field-label">Description</label>
              <textarea className="kbd-input" rows={3} value={editFields.description} onChange={e => onChange('description', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="kbd-field">
                <label className="kbd-field-label">Status</label>
                <select className="kbd-select" style={{ width: '100%' }} value={editFields.status} onChange={e => onChange('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="kbd-field">
                <label className="kbd-field-label">Priority</label>
                <select className="kbd-select" style={{ width: '100%' }} value={editFields.priority} onChange={e => onChange('priority', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="kbd-field">
                <label className="kbd-field-label">Category</label>
                <input className="kbd-input" value={editFields.category} onChange={e => onChange('category', e.target.value)} />
              </div>
              <div className="kbd-field">
                <label className="kbd-field-label">Completion %</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="range" min="0" max="100" value={editFields.completionPercentage}
                    onChange={e => onChange('completionPercentage', e.target.value)}
                    style={{ flex: 1, accentColor: '#3B82F6' }} />
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#3B82F6', minWidth: '36px', textAlign: 'right' }}>
                    {editFields.completionPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Location */}
        <div className="kbd-section">
          <div className="kbd-section-title"><User size={16} color="#8B5CF6" /> Customer & Location</div>
          <div className="kbd-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="kbd-field">
                <label className="kbd-field-label">Customer</label>
                <div className="kbd-field-value">
                  {p.customer?.name || '-'}
                  {p.customer?.customerId && <span style={{ color: '#9CA3AF', fontSize: '12px', marginLeft: '6px' }}>({p.customer.customerId})</span>}
                </div>
              </div>
              <div className="kbd-field">
                <label className="kbd-field-label">Customer Email</label>
                <div className="kbd-field-value" style={{ fontSize: '13px' }}>{p.customer?.email || '-'}</div>
              </div>
            </div>
            {p.location && (
              <div className="kbd-field">
                <label className="kbd-field-label">Location</label>
                <div className="kbd-field-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#9CA3AF" />
                  {[p.location.address, p.location.city, p.location.state].filter(Boolean).join(', ') || '-'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div>
        {/* Project Manager & Timeline */}
        <div className="kbd-section">
          <div className="kbd-section-title"><Calendar size={16} color="#059669" /> Manager & Timeline</div>
          <div className="kbd-card">
            <div className="kbd-field">
              <label className="kbd-field-label">Project Manager</label>
              <div className="kbd-field-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: '700', color: '#3730A3',
                }}>
                  {(p.projectManager?.name || '?')[0].toUpperCase()}
                </div>
                {p.projectManager?.name || 'Not assigned'}
                {p.projectManager?.email && <span style={{ color: '#9CA3AF', fontSize: '12px' }}>({p.projectManager.email})</span>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="kbd-field">
                <label className="kbd-field-label">Start Date</label>
                <div className="kbd-field-value">{fmtDate(p.timeline?.estimatedStartDate)}</div>
              </div>
              <div className="kbd-field">
                <label className="kbd-field-label">End Date</label>
                <div className="kbd-field-value">{fmtDate(p.timeline?.estimatedEndDate)}</div>
              </div>
              <div className="kbd-field">
                <label className="kbd-field-label">Actual Start</label>
                <div className="kbd-field-value">{fmtDate(p.timeline?.actualStartDate)}</div>
              </div>
              <div className="kbd-field">
                <label className="kbd-field-label">Actual End</label>
                <div className="kbd-field-value">{fmtDate(p.timeline?.actualEndDate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="kbd-section">
          <div className="kbd-section-title"><IndianRupee size={16} color="#059669" /> Financial Summary</div>
          <div className="kbd-card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div className="kbd-stat" style={{ background: '#F0FDF4', borderRadius: '10px' }}>
                <div className="kbd-stat-value" style={{ color: '#059669' }}>{fmtCurrency(fin.quotedAmount)}</div>
                <div className="kbd-stat-label">Quoted</div>
              </div>
              <div className="kbd-stat" style={{ background: '#EFF6FF', borderRadius: '10px' }}>
                <div className="kbd-stat-value" style={{ color: '#2563EB' }}>{fmtCurrency(fin.agreedAmount)}</div>
                <div className="kbd-stat-label">Agreed</div>
              </div>
              <div className="kbd-stat" style={{ background: '#FEF3C7', borderRadius: '10px' }}>
                <div className="kbd-stat-value" style={{ color: '#D97706' }}>{fmtCurrency(fin.finalAmount)}</div>
                <div className="kbd-stat-label">Final</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="kbd-stat" style={{ background: '#D1FAE5', borderRadius: '10px' }}>
                <div className="kbd-stat-value" style={{ color: '#065F46', fontSize: '16px' }}>{fmtCurrency(fin.totalPaid)}</div>
                <div className="kbd-stat-label">Total Paid</div>
              </div>
              <div className="kbd-stat" style={{ background: '#FEE2E2', borderRadius: '10px' }}>
                <div className="kbd-stat-value" style={{ color: '#991B1B', fontSize: '16px' }}>{fmtCurrency(fin.pendingAmount)}</div>
                <div className="kbd-stat-label">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Approval Statuses */}
        <div className="kbd-section">
          <div className="kbd-section-title"><ShieldCheck size={16} color="#14B8A6" /> Approvals</div>
          <div className="kbd-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Material Quotation', key: 'materialQuotation' },
                { label: 'Material Spend', key: 'materialSpend' },
                { label: 'Payment Schedule', key: 'paymentSchedule' },
                { label: 'Schedule of Work', key: 'scheduleOfWork' },
              ].map(item => {
                const val = p.approvalStatus?.[item.key]
                return (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F9FAFB', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>{item.label}</span>
                    <StatusBadge status={val || 'pending'} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB 2: ERP RECORDS
// ══════════════════════════════════════════════════════════════
const ERPRecordsTab = ({ purchaseRequisitions, purchaseOrders, goodsReceipts, invoices, paymentsIn, paymentsOut, workOrders }) => {
  return (
    <div>
      {/* Purchase Requisitions */}
      <ERPSection
        icon={<ClipboardList size={16} color="#8B5CF6" />}
        title="Purchase Requisitions"
        count={purchaseRequisitions.length}
        emptyText="No purchase requisitions"
      >
        {purchaseRequisitions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="kbd-table">
              <thead>
                <tr>
                  <th>PR #</th>
                  <th>Date</th>
                  <th>Required By</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th style={{ textAlign: 'right' }}>Est. Total</th>
                </tr>
              </thead>
              <tbody>
                {purchaseRequisitions.map(pr => (
                  <tr key={pr._id}>
                    <td style={{ fontWeight: '600', color: '#3B82F6' }}>{pr.prNumber || '-'}</td>
                    <td>{fmtDate(pr.requestDate)}</td>
                    <td>{fmtDate(pr.requiredDate)}</td>
                    <td><StatusBadge status={pr.status} /></td>
                    <td>{pr.requestedBy?.name || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{fmtCurrency(pr.estimatedTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ERPSection>

      {/* Purchase Orders */}
      <ERPSection
        icon={<Package size={16} color="#EC4899" />}
        title="Purchase Orders"
        count={purchaseOrders.length}
        emptyText="No purchase orders"
      >
        {purchaseOrders.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="kbd-table">
              <thead>
                <tr>
                  <th>PO #</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Received %</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map(po => {
                  const totalQty = (po.lineItems || []).reduce((s, li) => s + (li.quantity || 0), 0)
                  const deliveredQty = (po.lineItems || []).reduce((s, li) => s + (li.deliveredQuantity || 0), 0)
                  const recPct = totalQty > 0 ? Math.round((deliveredQty / totalQty) * 100) : 0
                  return (
                    <tr key={po._id}>
                      <td style={{ fontWeight: '600', color: '#3B82F6' }}>{po.poNumber || '-'}</td>
                      <td>{po.vendor?.name || '-'}</td>
                      <td>{fmtDate(po.orderDate)}</td>
                      <td><StatusBadge status={po.status} /></td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{fmtCurrency(po.poTotal)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '50px', height: '5px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${recPct}%`, height: '100%', background: recPct >= 100 ? '#059669' : '#3B82F6', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>{recPct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ERPSection>

      {/* Goods Receipts */}
      <ERPSection
        icon={<Truck size={16} color="#14B8A6" />}
        title="Goods Receipts (GRN)"
        count={goodsReceipts.length}
        emptyText="No goods receipts"
      >
        {goodsReceipts.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="kbd-table">
              <thead>
                <tr>
                  <th>GRN #</th>
                  <th>PO Ref</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Quality Status</th>
                  <th>Accepted / Rejected</th>
                </tr>
              </thead>
              <tbody>
                {goodsReceipts.map(gr => (
                  <tr key={gr._id}>
                    <td style={{ fontWeight: '600', color: '#3B82F6' }}>{gr.grnNumber || '-'}</td>
                    <td>{gr.purchaseOrder?.poNumber || '-'}</td>
                    <td>{gr.vendor?.name || '-'}</td>
                    <td>{fmtDate(gr.receiptDate)}</td>
                    <td><StatusBadge status={gr.qualityInspection?.overallStatus || gr.status} /></td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: '600' }}>{gr.totalAcceptedQuantity || 0}</span>
                      <span style={{ color: '#9CA3AF' }}> / </span>
                      <span style={{ color: '#DC2626', fontWeight: '600' }}>{gr.totalRejectedQuantity || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ERPSection>

      {/* Customer Invoices */}
      <ERPSection
        icon={<Receipt size={16} color="#D97706" />}
        title="Customer Invoices"
        count={invoices.length}
        emptyText="No invoices"
      >
        {invoices.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="kbd-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Paid</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: '600', color: '#3B82F6' }}>{inv.invoiceNumber || '-'}</td>
                    <td>{fmtDate(inv.invoiceDate)}</td>
                    <td>{fmtDate(inv.dueDate)}</td>
                    <td><StatusBadge status={inv.paymentStatus || inv.status} /></td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{fmtCurrency(inv.invoiceTotal)}</td>
                    <td style={{ textAlign: 'right', color: '#059669', fontWeight: '600' }}>{fmtCurrency(inv.paidAmount)}</td>
                    <td style={{ textAlign: 'right', color: '#DC2626', fontWeight: '600' }}>{fmtCurrency(inv.balanceAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ERPSection>

      {/* Payments In */}
      <ERPSection
        icon={<TrendingUp size={16} color="#059669" />}
        title="Payments (Incoming)"
        count={paymentsIn.length}
        emptyText="No incoming payments"
      >
        {paymentsIn.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="kbd-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentsIn.map(pay => (
                  <tr key={pay._id}>
                    <td style={{ fontWeight: '600', color: '#059669' }}>{pay.paymentNumber || '-'}</td>
                    <td>{fmtDate(pay.paymentDate)}</td>
                    <td>{pay.customer?.name || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#059669' }}>{fmtCurrency(pay.amount)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{(pay.paymentMethod || '').replace(/_/g, ' ')}</td>
                    <td><StatusBadge status={pay.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ERPSection>

      {/* Payments Out */}
      <ERPSection
        icon={<TrendingDown size={16} color="#DC2626" />}
        title="Payments (Outgoing)"
        count={paymentsOut.length}
        emptyText="No outgoing payments"
      >
        {paymentsOut.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="kbd-table">
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentsOut.map(pay => (
                  <tr key={pay._id}>
                    <td style={{ fontWeight: '600', color: '#DC2626' }}>{pay.paymentNumber || '-'}</td>
                    <td>{fmtDate(pay.paymentDate)}</td>
                    <td>{pay.vendor?.name || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#DC2626' }}>{fmtCurrency(pay.amount)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{(pay.paymentMethod || '').replace(/_/g, ' ')}</td>
                    <td><StatusBadge status={pay.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ERPSection>

      {/* Work Orders */}
      <ERPSection
        icon={<Wrench size={16} color="#6366F1" />}
        title="Work Orders"
        count={workOrders.length}
        emptyText="No work orders"
      >
        {workOrders.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="kbd-table">
              <thead>
                <tr>
                  <th>WO #</th>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Assigned To</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map(wo => {
                  const pct = wo.progress?.percentage || 0
                  return (
                    <tr key={wo._id}>
                      <td style={{ fontWeight: '600', color: '#3B82F6' }}>{wo.workOrderId || '-'}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {wo.item?.name || '-'}
                      </td>
                      <td><StatusBadge status={wo.status} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '50px', height: '5px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#059669' : '#6366F1', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600' }}>{pct}%</span>
                        </div>
                      </td>
                      <td>{wo.assignedToName || '-'}</td>
                      <td>
                        <span style={{ color: PRIORITY_CONFIG[wo.priority]?.color || '#6B7280', fontWeight: '600', fontSize: '12px', textTransform: 'capitalize' }}>
                          {wo.priority || '-'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ERPSection>
    </div>
  )
}

const ERPSection = ({ icon, title, count, emptyText, children }) => (
  <div className="kbd-section">
    <div className="kbd-section-title">
      {icon} {title}
      <span style={{
        padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700',
        backgroundColor: count > 0 ? '#EFF6FF' : '#F3F4F6',
        color: count > 0 ? '#2563EB' : '#9CA3AF',
      }}>{count}</span>
    </div>
    {count === 0 ? (
      <div className="kbd-empty">
        <div className="kbd-empty-icon">{icon}</div>
        <p style={{ margin: 0, fontSize: '13px' }}>{emptyText}</p>
      </div>
    ) : children}
  </div>
)

// ══════════════════════════════════════════════════════════════
// TAB 3: MILESTONES
// ══════════════════════════════════════════════════════════════
const MilestonesTab = ({ project, purchaseOrders, invoices, payments, paymentMilestones }) => {
  const embeddedMilestones = project?.milestones || []
  const paymentSchedule = project?.paymentSchedule || []
  // Use paymentMilestones from the separate collection as the primary source
  const pmList = paymentMilestones || []
  // For the timeline bar, prefer paymentMilestones, then embedded milestones
  const timelineItems = pmList.length > 0 ? pmList : embeddedMilestones

  // Payment milestones summary
  const pmTotalAmount = pmList.reduce((s, pm) => s + (pm.totalAmount || 0), 0)
  const pmCollected = pmList.reduce((s, pm) => s + (pm.collectedAmount || 0), 0)
  const pmPending = pmList.reduce((s, pm) => s + (pm.pendingAmount || 0), 0)
  const pmPaidCount = pmList.filter(pm => pm.status === 'paid').length
  const pmOverdueCount = pmList.filter(pm => pm.status === 'overdue').length

  return (
    <div>
      {/* Payment Milestones (Primary - from separate collection) */}
      <div className="kbd-section">
        <div className="kbd-section-title"><CreditCard size={16} color="#8B5CF6" /> Payment Milestones</div>
        {pmList.length === 0 ? (
          <div className="kbd-empty">
            <CreditCard size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '13px' }}>No payment milestones defined</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
              <div className="kbd-stat" style={{ background: '#EFF6FF', borderRadius: '10px' }}>
                <div className="kbd-stat-value" style={{ color: '#2563EB', fontSize: '16px' }}>{pmList.length}</div>
                <div className="kbd-stat-label">Total</div>
              </div>
              <div className="kbd-stat" style={{ background: '#D1FAE5', borderRadius: '10px' }}>
                <div className="kbd-stat-value" style={{ color: '#059669', fontSize: '16px' }}>{pmPaidCount}</div>
                <div className="kbd-stat-label">Paid</div>
              </div>
              <div className="kbd-stat" style={{ background: '#FEE2E2', borderRadius: '10px' }}>
                <div className="kbd-stat-value" style={{ color: '#DC2626', fontSize: '16px' }}>{pmOverdueCount}</div>
                <div className="kbd-stat-label">Overdue</div>
              </div>
              <div className="kbd-stat" style={{ background: '#F0FDF4', borderRadius: '10px' }}>
                <div className="kbd-stat-value" style={{ color: '#059669', fontSize: '14px' }}>{fmtCurrency(pmCollected)}</div>
                <div className="kbd-stat-label">Collected</div>
              </div>
              <div className="kbd-stat" style={{ background: '#FEF3C7', borderRadius: '10px' }}>
                <div className="kbd-stat-value" style={{ color: '#D97706', fontSize: '14px' }}>{fmtCurrency(pmPending)}</div>
                <div className="kbd-stat-label">Pending</div>
              </div>
            </div>

            {/* Milestones List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pmList.map((pm, idx) => {
                const isPaid = pm.status === 'paid'
                const isOverdue = pm.status === 'overdue'
                const isPartial = pm.status === 'partially_paid'
                const isDue = pm.status === 'due'
                const bgColor = isPaid ? '#F0FDF4' : isOverdue ? '#FEF2F2' : isDue ? '#FFF7ED' : isPartial ? '#FFFBEB' : '#F9FAFB'
                const borderColor = isPaid ? '#BBF7D0' : isOverdue ? '#FECACA' : isDue ? '#FDBA74' : isPartial ? '#FDE68A' : '#E5E7EB'
                const dotColor = isPaid ? '#059669' : isOverdue ? '#DC2626' : isDue ? '#EA580C' : isPartial ? '#D97706' : '#D1D5DB'
                const collPct = pm.totalAmount > 0 ? Math.round((pm.collectedAmount / pm.totalAmount) * 100) : 0

                return (
                  <div key={pm._id || idx} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '14px 18px', background: bgColor,
                    borderRadius: '10px', border: `1px solid ${borderColor}`,
                  }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: dotColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isPaid ? <CheckCircle2 size={16} color="#fff" /> : <CircleDot size={16} color="#fff" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{pm.name || `Milestone ${idx + 1}`}</span>
                        {pm.milestoneId && <span style={{ fontSize: '10px', color: '#9CA3AF' }}>({pm.milestoneId})</span>}
                        {pm.type && pm.type !== 'custom' && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', background: '#E0E7FF', color: '#3730A3', borderRadius: '4px', textTransform: 'capitalize' }}>
                            {pm.type.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: '#6B7280', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '600' }}>{pm.percentage}%</span>
                        <span>Amount: <strong style={{ color: '#111827' }}>{fmtCurrency(pm.totalAmount)}</strong></span>
                        {pm.gstAmount > 0 && <span style={{ color: '#9CA3AF' }}>GST: {fmtCurrency(pm.gstAmount)}</span>}
                        {pm.dueDate && <span>Due: {fmtDate(pm.dueDate)}</span>}
                        {pm.invoiceGenerated && pm.invoiceNumber && (
                          <span style={{ color: '#3B82F6' }}>Inv: {pm.invoiceNumber}</span>
                        )}
                      </div>
                      {/* Collection progress bar */}
                      {pm.totalAmount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <div style={{ flex: 1, height: '5px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${collPct}%`, height: '100%',
                              background: isPaid ? '#059669' : isPartial ? '#D97706' : '#3B82F6',
                              borderRadius: '3px', transition: 'width 0.3s',
                            }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: dotColor, minWidth: '32px', textAlign: 'right' }}>{collPct}%</span>
                        </div>
                      )}
                    </div>
                    <StatusBadge status={pm.status} />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Embedded Project Milestones (if any) */}
      {embeddedMilestones.length > 0 && (
        <div className="kbd-section">
          <div className="kbd-section-title"><Milestone size={16} color="#6366F1" /> Project Phase Milestones</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {embeddedMilestones.map((ms, idx) => {
              const isComplete = ms.status === 'completed'
              const isOverdue = ms.status === 'overdue' || (ms.dueDate && new Date(ms.dueDate) < new Date() && !isComplete)
              return (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '14px 18px', background: isComplete ? '#F0FDF4' : isOverdue ? '#FEF2F2' : '#F9FAFB',
                  borderRadius: '10px', border: `1px solid ${isComplete ? '#BBF7D0' : isOverdue ? '#FECACA' : '#E5E7EB'}`,
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: isComplete ? '#059669' : isOverdue ? '#DC2626' : '#D1D5DB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isComplete ? <CheckCircle2 size={16} color="#fff" /> : <CircleDot size={16} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{ms.name || ms.title || `Milestone ${idx + 1}`}</div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                      {ms.completionPercentage != null && <span>Completion: {ms.completionPercentage}%</span>}
                      {ms.dueDate && <span style={{ marginLeft: '12px' }}>Due: {fmtDate(ms.dueDate)}</span>}
                      {ms.completedDate && <span style={{ marginLeft: '12px' }}>Completed: {fmtDate(ms.completedDate)}</span>}
                    </div>
                  </div>
                  <StatusBadge status={isComplete ? 'completed' : isOverdue ? 'overdue' : ms.status || 'pending'} />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Embedded Payment Schedule (if any) */}
      {paymentSchedule.length > 0 && (
        <div className="kbd-section">
          <div className="kbd-section-title"><CreditCard size={16} color="#D97706" /> Payment Schedule (Embedded)</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="kbd-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Milestone</th>
                  <th>Percentage</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentSchedule.map((ps, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>{idx + 1}</td>
                    <td>{ps.name || ps.milestone || ps.description || '-'}</td>
                    <td>{ps.percentage != null ? `${ps.percentage}%` : '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{fmtCurrency(ps.amount)}</td>
                    <td>{fmtDate(ps.dueDate)}</td>
                    <td><StatusBadge status={ps.isPaid ? 'paid' : ps.status || 'pending'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline Bar */}
      <div className="kbd-section">
        <div className="kbd-section-title"><BarChart3 size={16} color="#3B82F6" /> Milestone Timeline</div>
        {timelineItems.length === 0 ? (
          <div className="kbd-empty">
            <p style={{ margin: 0, fontSize: '13px' }}>No milestones to display</p>
          </div>
        ) : (
          <div className="kbd-card">
            <div style={{ display: 'flex', gap: '2px', height: '32px', borderRadius: '8px', overflow: 'hidden' }}>
              {timelineItems.map((ms, idx) => {
                const pct = ms.percentage || (100 / timelineItems.length)
                const isPaid = ms.status === 'paid' || ms.status === 'completed'
                const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6', '#6366F1', '#84CC16', '#22C55E']
                const bg = isPaid ? colors[idx % colors.length] : '#E5E7EB'
                return (
                  <div key={idx} style={{
                    width: `${pct}%`, minWidth: '20px', background: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }} title={`${ms.name || `Milestone ${idx + 1}`}: ${pct}% — ${(ms.status || 'pending').replace(/_/g, ' ')}`}>
                    <span style={{ fontSize: '9px', fontWeight: '700', color: isPaid ? '#fff' : '#9CA3AF' }}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '2px', marginTop: '6px' }}>
              {timelineItems.map((ms, idx) => (
                <div key={idx} style={{ width: `${ms.percentage || (100 / timelineItems.length)}%`, minWidth: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9px', color: '#6B7280', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ms.name || `M${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ERP Mapping Summary */}
      <div className="kbd-section">
        <div className="kbd-section-title"><ArrowUpRight size={16} color="#059669" /> ERP Records Linked</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Purchase Orders', count: purchaseOrders.length, icon: <Package size={18} />, color: '#EC4899' },
            { label: 'Invoices', count: invoices.length, icon: <Receipt size={18} />, color: '#D97706' },
            { label: 'Payments', count: payments.length, icon: <CreditCard size={18} />, color: '#059669' },
          ].map(item => (
            <div key={item.label} className="kbd-card" style={{ textAlign: 'center', padding: '14px' }}>
              <div style={{ color: item.color, marginBottom: '6px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#111827' }}>{item.count}</div>
              <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB 4: TEAM & EFFORT
// ══════════════════════════════════════════════════════════════
const TeamTab = ({ project, workOrders, totalPOAmount, totalLaborCost, totalMaterialCost, totalWOCost, totalPaymentsIn, totalPaymentsOut, totalInvoiced, totalPaid, totalBalance }) => {
  if (!project) return null

  const teamMembers = project.teamMembers || []
  const designTeam = project.departmentAssignments?.design || []
  const opsTeam = project.departmentAssignments?.operations || []

  // Aggregate effort by employee from work order laborTeam
  const effortMap = {}
  workOrders.forEach(wo => {
    const laborTeam = wo.laborTeam || []
    laborTeam.forEach(lt => {
      const empId = lt.employee?.toString() || lt.employeeName || 'Unknown'
      const name = lt.employeeName || lt.name || empId
      if (!effortMap[empId]) {
        effortMap[empId] = { name, role: lt.skillType || lt.role || '-', hours: 0, cost: 0, woCount: 0 }
      }
      effortMap[empId].hours += lt.hoursWorked || lt.hours || 0
      effortMap[empId].cost += lt.cost || 0
      effortMap[empId].woCount += 1
    })
  })
  const effortEntries = Object.entries(effortMap).map(([id, data]) => ({ id, ...data }))

  const quotedAmt = project.financials?.quotedAmount || 0
  const agreedAmt = project.financials?.agreedAmount || 0
  const finalAmt = project.financials?.finalAmount || 0

  return (
    <div>
      {/* Project Manager */}
      <div className="kbd-section">
        <div className="kbd-section-title"><User size={16} color="#3B82F6" /> Project Manager</div>
        <div className="kbd-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: '700', color: '#fff',
          }}>
            {(project.projectManager?.name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>{project.projectManager?.name || 'Not assigned'}</div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>{project.projectManager?.email || ''}</div>
            {project.projectManager?.employeeId && (
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>
                <Hash size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {project.projectManager.employeeId}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="kbd-section">
        <div className="kbd-section-title"><Users size={16} color="#8B5CF6" /> Team Members <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', backgroundColor: '#EFF6FF', color: '#2563EB' }}>{teamMembers.length}</span></div>
        {teamMembers.length === 0 ? (
          <div className="kbd-empty">
            <Users size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '13px' }}>No team members assigned</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="kbd-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Assigned Date</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((tm, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '26px', height: '26px', borderRadius: '50%', background: '#E0E7FF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '700', color: '#3730A3',
                        }}>
                          {(tm.user?.name || '?')[0].toUpperCase()}
                        </div>
                        {tm.user?.name || '-'}
                      </div>
                    </td>
                    <td style={{ color: '#6B7280' }}>{tm.user?.employeeId || '-'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{tm.role || '-'}</td>
                    <td>{tm.user?.department || '-'}</td>
                    <td>{fmtDate(tm.assignedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Department Assignments */}
      {(designTeam.length > 0 || opsTeam.length > 0) && (
        <div className="kbd-section">
          <div className="kbd-section-title"><Building2 size={16} color="#14B8A6" /> Department Assignments</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {designTeam.length > 0 && (
              <div className="kbd-card">
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#8B5CF6', marginBottom: '10px' }}>Design Team</div>
                {designTeam.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: '13px' }}>
                    <span>{d.name || d.user?.name || '-'}</span>
                    <span style={{ color: '#6B7280', textTransform: 'capitalize' }}>{d.role || '-'}</span>
                  </div>
                ))}
              </div>
            )}
            {opsTeam.length > 0 && (
              <div className="kbd-card">
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#6366F1', marginBottom: '10px' }}>Operations Team</div>
                {opsTeam.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: '13px' }}>
                    <span>{d.name || d.user?.name || '-'}</span>
                    <span style={{ color: '#6B7280', textTransform: 'capitalize' }}>{d.role || '-'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OPEX / Cost Summary */}
      <div className="kbd-section">
        <div className="kbd-section-title"><IndianRupee size={16} color="#059669" /> OPEX / Cost Summary</div>
        <div className="kbd-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            <div className="kbd-stat" style={{ background: '#EFF6FF', borderRadius: '10px' }}>
              <div className="kbd-stat-value" style={{ color: '#2563EB', fontSize: '16px' }}>{fmtCurrency(totalLaborCost)}</div>
              <div className="kbd-stat-label">Labor Cost</div>
            </div>
            <div className="kbd-stat" style={{ background: '#FDF4FF', borderRadius: '10px' }}>
              <div className="kbd-stat-value" style={{ color: '#9333EA', fontSize: '16px' }}>{fmtCurrency(totalMaterialCost)}</div>
              <div className="kbd-stat-label">Material Cost (WO)</div>
            </div>
            <div className="kbd-stat" style={{ background: '#FEF3C7', borderRadius: '10px' }}>
              <div className="kbd-stat-value" style={{ color: '#D97706', fontSize: '16px' }}>{fmtCurrency(totalPOAmount)}</div>
              <div className="kbd-stat-label">PO Total</div>
            </div>
            <div className="kbd-stat" style={{ background: '#F0FDF4', borderRadius: '10px' }}>
              <div className="kbd-stat-value" style={{ color: '#059669', fontSize: '16px' }}>{fmtCurrency(totalWOCost)}</div>
              <div className="kbd-stat-label">Total WO Cost</div>
            </div>
          </div>

          {/* Budget vs Actual */}
          {(quotedAmt > 0 || finalAmt > 0) && (
            <div style={{ padding: '12px', background: '#F9FAFB', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '8px' }}>Budget vs Actual</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Budget (Quoted)</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>{fmtCurrency(quotedAmt)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Total Spend (PO+WO)</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: totalPOAmount + totalWOCost > quotedAmt ? '#DC2626' : '#059669' }}>
                    {fmtCurrency(totalPOAmount + totalWOCost)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Variance</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: quotedAmt - (totalPOAmount + totalWOCost) >= 0 ? '#059669' : '#DC2626' }}>
                    {fmtCurrency(Math.abs(quotedAmt - (totalPOAmount + totalWOCost)))}
                    <span style={{ fontSize: '11px', marginLeft: '4px' }}>
                      {quotedAmt - (totalPOAmount + totalWOCost) >= 0 ? 'under' : 'over'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Effort Burn by Employee */}
      <div className="kbd-section">
        <div className="kbd-section-title"><Briefcase size={16} color="#D97706" /> Effort Burn by Employee</div>
        {effortEntries.length === 0 ? (
          <div className="kbd-empty">
            <Briefcase size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '13px' }}>No labor data from work orders</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="kbd-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role / Skill</th>
                  <th>Work Orders</th>
                  <th style={{ textAlign: 'right' }}>Hours Logged</th>
                  <th style={{ textAlign: 'right' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {effortEntries.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: '600' }}>{entry.name}</td>
                    <td style={{ textTransform: 'capitalize' }}>{entry.role}</td>
                    <td>{entry.woCount}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{entry.hours > 0 ? entry.hours.toFixed(1) : '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{entry.cost > 0 ? fmtCurrency(entry.cost) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="kbd-section">
        <div className="kbd-section-title"><Target size={16} color="#3B82F6" /> Financial Summary</div>
        <div className="kbd-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            <div className="kbd-stat" style={{ background: '#F0FDF4', borderRadius: '10px' }}>
              <div className="kbd-stat-value" style={{ color: '#059669', fontSize: '15px' }}>{fmtCurrency(quotedAmt)}</div>
              <div className="kbd-stat-label">Quoted</div>
            </div>
            <div className="kbd-stat" style={{ background: '#EFF6FF', borderRadius: '10px' }}>
              <div className="kbd-stat-value" style={{ color: '#2563EB', fontSize: '15px' }}>{fmtCurrency(agreedAmt)}</div>
              <div className="kbd-stat-label">Agreed</div>
            </div>
            <div className="kbd-stat" style={{ background: '#DBEAFE', borderRadius: '10px' }}>
              <div className="kbd-stat-value" style={{ color: '#1E40AF', fontSize: '15px' }}>{fmtCurrency(totalInvoiced)}</div>
              <div className="kbd-stat-label">Invoiced</div>
            </div>
            <div className="kbd-stat" style={{ background: '#D1FAE5', borderRadius: '10px' }}>
              <div className="kbd-stat-value" style={{ color: '#065F46', fontSize: '15px' }}>{fmtCurrency(totalPaid)}</div>
              <div className="kbd-stat-label">Paid</div>
            </div>
            <div className="kbd-stat" style={{ background: '#FEE2E2', borderRadius: '10px' }}>
              <div className="kbd-stat-value" style={{ color: '#991B1B', fontSize: '15px' }}>{fmtCurrency(totalBalance)}</div>
              <div className="kbd-stat-label">Pending</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// TAB 5: ACTIVITY
// ══════════════════════════════════════════════════════════════
const ActivityTab = ({ project, newNote, setNewNote, onAddNote }) => {
  const activities = [...(project?.activities || [])].reverse()

  const ACTION_ICONS = {
    created: <Plus size={14} />,
    updated: <Edit3 size={14} />,
    stage_changed: <ChevronRight size={14} />,
    status_changed: <Flag size={14} />,
    note_added: <MessageSquare size={14} />,
    milestone_completed: <CheckCircle2 size={14} />,
    payment_received: <CreditCard size={14} />,
    team_member_added: <Users size={14} />,
    team_member_removed: <Users size={14} />,
  }

  const ACTION_COLORS = {
    created: '#3B82F6',
    updated: '#8B5CF6',
    stage_changed: '#F59E0B',
    status_changed: '#6366F1',
    note_added: '#14B8A6',
    milestone_completed: '#059669',
    payment_received: '#059669',
    team_member_added: '#3B82F6',
    team_member_removed: '#DC2626',
  }

  return (
    <div>
      {/* Add Note */}
      <div className="kbd-section">
        <div className="kbd-section-title"><MessageSquare size={16} color="#14B8A6" /> Add Activity Note</div>
        <div className="kbd-card" style={{ display: 'flex', gap: '10px' }}>
          <textarea
            className="kbd-input"
            rows={2}
            placeholder="Add a note or update..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            style={{ flex: 1, resize: 'vertical' }}
          />
          <button onClick={onAddNote} disabled={!newNote.trim()} style={{
            padding: '8px 18px', backgroundColor: newNote.trim() ? '#14B8A6' : '#E5E7EB',
            color: newNote.trim() ? '#fff' : '#9CA3AF',
            border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
            cursor: newNote.trim() ? 'pointer' : 'default', alignSelf: 'flex-end',
          }}>
            <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Add Note
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="kbd-section">
        <div className="kbd-section-title"><Clock size={16} color="#6B7280" /> Activity Log <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', backgroundColor: '#F3F4F6', color: '#6B7280' }}>{activities.length}</span></div>
        {activities.length === 0 ? (
          <div className="kbd-empty">
            <Clock size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '13px' }}>No activities recorded</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Timeline line */}
            <div style={{ position: 'absolute', left: '15px', top: '0', bottom: '0', width: '2px', background: '#E5E7EB' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {activities.map((act, idx) => {
                const actionColor = ACTION_COLORS[act.action] || '#6B7280'
                const actionIcon = ACTION_ICONS[act.action] || <CircleDot size={14} />
                return (
                  <div key={idx} style={{ display: 'flex', gap: '16px', padding: '10px 0', position: 'relative' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                      background: `${actionColor}15`, border: `2px solid ${actionColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: actionColor, zIndex: 1, backgroundColor: '#fff',
                    }}>
                      {actionIcon}
                    </div>
                    <div style={{ flex: 1, paddingTop: '4px' }}>
                      <div style={{ fontSize: '13px', color: '#111827' }}>
                        <span style={{ fontWeight: '600' }}>{(act.action || '').replace(/_/g, ' ')}</span>
                        {act.performedByName && <span style={{ color: '#6B7280' }}> by {act.performedByName}</span>}
                      </div>
                      {act.description && (
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>{act.description}</p>
                      )}
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                        {fmtDateTime(act.timestamp || act.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectKanbanDetailModal
