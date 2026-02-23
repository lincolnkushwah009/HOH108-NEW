import { useState, useEffect } from 'react'
import {
  Plus, Search, Filter, Eye, Trash2, CheckCircle, XCircle,
  ClipboardCheck, AlertTriangle, BarChart3, Calendar,
  ChevronDown, X, FileText, Camera, Clock, User,
  Shield, Activity, Download, RefreshCw
} from 'lucide-react'
import { qcMasterAPI, projectsAPI } from '../../utils/api'

// ── Status configuration ──
const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: '#FEF3C7', color: '#92400E', icon: Clock },
  in_progress: { label: 'In Progress', bg: '#DBEAFE', color: '#1E40AF', icon: Activity },
  passed: { label: 'Passed', bg: '#D1FAE5', color: '#065F46', icon: CheckCircle },
  failed: { label: 'Failed', bg: '#FEE2E2', color: '#991B1B', icon: XCircle },
  rework: { label: 'Rework', bg: '#FED7AA', color: '#9A3412', icon: RefreshCw },
  waived: { label: 'Waived', bg: '#E5E7EB', color: '#374151', icon: Shield },
}

const CATEGORY_CONFIG = {
  design_qc: { label: 'Design QC', bg: '#EDE9FE', color: '#5B21B6' },
  factory_qc: { label: 'Factory QC', bg: '#FCE7F3', color: '#9D174D' },
  site_qc: { label: 'Site QC', bg: '#CFFAFE', color: '#155E75' },
  material_qc: { label: 'Material QC', bg: '#FEF9C3', color: '#854D0E' },
  process_qc: { label: 'Process QC', bg: '#F3E8FF', color: '#6B21A8' },
}

const SOURCE_TYPE_CONFIG = {
  task_instance: { label: 'Project Task' },
  work_order: { label: 'Work Order' },
  goods_receipt: { label: 'Goods Receipt' },
  daily_progress: { label: 'Daily Progress' },
  p2p_tracker: { label: 'P2P Tracker' },
}

const SEVERITY_CONFIG = {
  minor: { label: 'Minor', bg: '#FEF3C7', color: '#92400E' },
  major: { label: 'Major', bg: '#FED7AA', color: '#9A3412' },
  critical: { label: 'Critical', bg: '#FEE2E2', color: '#991B1B' },
}

const DEFECT_STATUS_CONFIG = {
  open: { label: 'Open', bg: '#FEE2E2', color: '#991B1B' },
  in_progress: { label: 'In Progress', bg: '#DBEAFE', color: '#1E40AF' },
  resolved: { label: 'Resolved', bg: '#D1FAE5', color: '#065F46' },
}

// ── Helpers ──
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Badge Component ──
const Badge = ({ config, value }) => {
  const c = config[value]
  if (!c) return <span>{value || '-'}</span>
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600',
      backgroundColor: c.bg, color: c.color, whiteSpace: 'nowrap',
    }}>
      {c.label}
    </span>
  )
}

// ── Score Bar ──
const ScoreBar = ({ score }) => {
  if (score === null || score === undefined) return <span style={{ color: '#9CA3AF', fontSize: '13px' }}>-</span>
  const color = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height: '6px', backgroundColor: '#E5E7EB', borderRadius: '3px', minWidth: '60px' }}>
        <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: '600', color, minWidth: '32px' }}>{score}%</span>
    </div>
  )
}

// ── Stat Card ──
const StatCard = ({ label, value, color, icon: Icon, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB',
      cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}
    onMouseOver={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' } }}
    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>{label}</p>
        <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '700', color: color || '#111827' }}>{value}</p>
      </div>
      {Icon && (
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} style={{ color }} />
        </div>
      )}
    </div>
  </div>
)

// ══════════════════════════════════════════════════════════════════
// CREATE / EDIT MODAL
// ══════════════════════════════════════════════════════════════════
const CreateModal = ({ isOpen, onClose, onSuccess, projects, editData }) => {
  const [formData, setFormData] = useState({
    project: '', projectName: '', title: '', description: '',
    category: 'site_qc', phase: '', activity: '',
    sourceType: '', sourceId: '', sourceName: '',
    checklistItems: [],
    status: 'pending',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newCheckItem, setNewCheckItem] = useState('')

  useEffect(() => {
    if (editData) {
      setFormData({
        project: editData.project?._id || editData.project || '',
        projectName: editData.projectName || editData.project?.title || '',
        title: editData.title || '',
        description: editData.description || '',
        category: editData.category || 'site_qc',
        phase: editData.phase || '',
        activity: editData.activity || '',
        sourceType: editData.sourceType || '',
        sourceId: editData.sourceId || '',
        sourceName: editData.sourceName || '',
        checklistItems: editData.checklistItems || [],
        status: editData.status || 'pending',
      })
    } else {
      setFormData({
        project: '', projectName: '', title: '', description: '',
        category: 'site_qc', phase: '', activity: '',
        sourceType: '', sourceId: '', sourceName: '',
        checklistItems: [], status: 'pending',
      })
    }
    setError('')
  }, [editData, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.project) { setError('Please select a project'); return }
    if (!formData.title.trim()) { setError('Title is required'); return }
    setLoading(true)
    try {
      const payload = { ...formData }
      const selectedProject = projects.find(p => p._id === formData.project)
      if (selectedProject) payload.projectName = selectedProject.title

      if (editData) {
        await qcMasterAPI.update(editData._id, payload)
      } else {
        await qcMasterAPI.create(payload)
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return
    setFormData(prev => ({
      ...prev,
      checklistItems: [...prev.checklistItems, { name: newCheckItem.trim(), status: 'pending', remarks: '' }]
    }))
    setNewCheckItem('')
  }

  const removeChecklistItem = (index) => {
    setFormData(prev => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((_, i) => i !== index)
    }))
  }

  if (!isOpen) return null

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  }
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{editData ? 'Edit QC Record' : 'New QC Inspection'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && <div style={{ padding: '10px 14px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Project *</label>
              <select value={formData.project} onChange={e => setFormData(p => ({ ...p, project: e.target.value }))} style={inputStyle}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Title *</label>
            <input type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Factory QC - Assembly" style={inputStyle} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Description</label>
            <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="QC inspection details..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Phase</label>
              <select value={formData.phase} onChange={e => setFormData(p => ({ ...p, phase: e.target.value }))} style={inputStyle}>
                <option value="">Select Phase</option>
                <option value="Design">Design</option>
                <option value="P2P">P2P</option>
                <option value="Production">Production</option>
                <option value="Construction">Construction</option>
                <option value="Installation">Installation</option>
                <option value="Handover">Handover</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Activity</label>
              <input type="text" value={formData.activity} onChange={e => setFormData(p => ({ ...p, activity: e.target.value }))} placeholder="e.g. Factory Production" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Source Type</label>
              <select value={formData.sourceType} onChange={e => setFormData(p => ({ ...p, sourceType: e.target.value }))} style={inputStyle}>
                <option value="">None (Manual)</option>
                {Object.entries(SOURCE_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Source Name</label>
              <input type="text" value={formData.sourceName} onChange={e => setFormData(p => ({ ...p, sourceName: e.target.value }))} placeholder="Source reference" style={inputStyle} />
            </div>
          </div>

          {/* Checklist Builder */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Checklist Items</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text" value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
                placeholder="Add checklist item..." style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={addChecklistItem} style={{
                padding: '10px 16px', backgroundColor: '#3B82F6', color: '#fff', border: 'none',
                borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>Add</button>
            </div>
            {formData.checklistItems.length > 0 && (
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                {formData.checklistItems.map((item, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderBottom: i < formData.checklistItems.length - 1 ? '1px solid #E5E7EB' : 'none',
                    backgroundColor: i % 2 === 0 ? '#F9FAFB' : '#fff',
                  }}>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{item.name}</span>
                    <button type="button" onClick={() => removeChecklistItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '2px' }}><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none',
              borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              padding: '10px 20px', backgroundColor: '#3B82F6', color: '#fff', border: 'none',
              borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1,
            }}>{loading ? 'Saving...' : (editData ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// INSPECTION MODAL
// ══════════════════════════════════════════════════════════════════
const InspectionModal = ({ isOpen, onClose, onSuccess, record }) => {
  const [formData, setFormData] = useState({ status: 'passed', result: 'pass', score: 100, remarks: '', checklistItems: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (record) {
      setFormData({
        status: record.status === 'pending' ? 'in_progress' : record.status,
        result: record.result || 'pass',
        score: record.score ?? 100,
        remarks: record.remarks || '',
        checklistItems: (record.checklistItems || []).map(c => ({ ...c })),
      })
    }
    setError('')
  }, [record, isOpen])

  const updateCheckItem = (index, field, value) => {
    setFormData(prev => {
      const items = [...prev.checklistItems]
      items[index] = { ...items[index], [field]: value, ...(field === 'status' ? { checkedAt: new Date() } : {}) }
      return { ...prev, checklistItems: items }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await qcMasterAPI.inspect(record._id, formData)
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Inspection failed')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !record) return null

  const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '4px' }
  const checkStatusColors = { pending: '#9CA3AF', passed: '#059669', failed: '#DC2626', na: '#6B7280' }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Perform Inspection</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>{record.qcId} — {record.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && <div style={{ padding: '10px 14px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} style={inputStyle}>
                <option value="in_progress">In Progress</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="rework">Rework</option>
                <option value="waived">Waived</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Result</label>
              <select value={formData.result} onChange={e => setFormData(p => ({ ...p, result: e.target.value }))} style={inputStyle}>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="partial">Partial</option>
                <option value="na">N/A</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Score (0-100)</label>
              <input type="number" min="0" max="100" value={formData.score} onChange={e => setFormData(p => ({ ...p, score: parseInt(e.target.value) || 0 }))} style={inputStyle} />
            </div>
          </div>

          {/* Checklist Items */}
          {formData.checklistItems.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Checklist</label>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
                {formData.checklistItems.map((item, i) => (
                  <div key={i} style={{
                    padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                    borderBottom: i < formData.checklistItems.length - 1 ? '1px solid #E5E7EB' : 'none',
                    backgroundColor: i % 2 === 0 ? '#F9FAFB' : '#fff',
                  }}>
                    <span style={{ flex: 1, fontSize: '13px', color: '#374151', fontWeight: '500' }}>{item.name}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['passed', 'failed', 'na'].map(s => (
                        <button key={s} type="button" onClick={() => updateCheckItem(i, 'status', s)} style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                          border: item.status === s ? 'none' : '1px solid #D1D5DB',
                          backgroundColor: item.status === s ? checkStatusColors[s] : '#fff',
                          color: item.status === s ? '#fff' : '#6B7280',
                        }}>{s === 'na' ? 'N/A' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
                      ))}
                    </div>
                    <input
                      type="text" placeholder="Remarks" value={item.remarks || ''}
                      onChange={e => updateCheckItem(i, 'remarks', e.target.value)}
                      style={{ width: '120px', padding: '4px 8px', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Remarks</label>
            <textarea value={formData.remarks} onChange={e => setFormData(p => ({ ...p, remarks: e.target.value }))} rows={3} placeholder="Inspection remarks..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Submitting...' : 'Submit Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// DETAIL MODAL
// ══════════════════════════════════════════════════════════════════
const DetailModal = ({ isOpen, onClose, record, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [defectForm, setDefectForm] = useState({ description: '', severity: 'minor' })
  const [showDefectForm, setShowDefectForm] = useState(false)
  const [approvalRemarks, setApprovalRemarks] = useState('')

  if (!isOpen || !record) return null

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
    { id: 'defects', label: `Defects (${record.defects?.length || 0})`, icon: AlertTriangle },
    { id: 'activity', label: 'Activity', icon: Activity },
  ]

  const handleApprove = async (approved) => {
    setLoading(true)
    try {
      await qcMasterAPI.approve(record._id, { approved, remarks: approvalRemarks })
      onRefresh?.()
      onClose()
    } catch (err) {
      alert(err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDefect = async () => {
    if (!defectForm.description.trim()) return
    setLoading(true)
    try {
      await qcMasterAPI.addDefect(record._id, defectForm)
      setDefectForm({ description: '', severity: 'minor' })
      setShowDefectForm(false)
      onRefresh?.()
    } catch (err) {
      alert(err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResolveDefect = async (defectId) => {
    setLoading(true)
    try {
      await qcMasterAPI.updateDefect(record._id, defectId, { status: 'resolved' })
      onRefresh?.()
    } catch (err) {
      alert(err.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const checkStatusColors = { pending: '#9CA3AF', passed: '#059669', failed: '#DC2626', na: '#6B7280' }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{record.title}</h2>
                <Badge config={STATUS_CONFIG} value={record.status} />
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                {record.qcId} &middot; {record.projectName || record.project?.title} &middot; <Badge config={CATEGORY_CONFIG} value={record.category} />
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginTop: '20px' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                backgroundColor: activeTab === tab.id ? '#3B82F6' : '#F3F4F6',
                color: activeTab === tab.id ? '#fff' : '#6B7280',
                transition: 'all 0.15s',
              }}>
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px' }}>
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Score</p>
                  <ScoreBar score={record.score} />
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Result</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#111827' }}>{record.result ? record.result.charAt(0).toUpperCase() + record.result.slice(1) : '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Inspector</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>{record.inspectorName || record.inspector?.name || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Inspection Date</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>{formatDate(record.inspectionDate)}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Phase</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>{record.phase || '-'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Activity</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>{record.activity || '-'}</p>
                </div>
                {record.sourceType && (
                  <>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Source</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>{SOURCE_TYPE_CONFIG[record.sourceType]?.label || record.sourceType}</p>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Source Ref</p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>{record.sourceName || '-'}</p>
                    </div>
                  </>
                )}
              </div>

              {record.description && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Description</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>{record.description}</p>
                </div>
              )}

              {record.remarks && (
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' }}>Remarks</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>{record.remarks}</p>
                </div>
              )}

              {/* Approval Info */}
              {record.approvedBy && (
                <div style={{ padding: '16px', backgroundColor: '#F0FDF4', borderRadius: '10px', border: '1px solid #BBF7D0', marginBottom: '24px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#166534' }}>
                    <strong>Approved by:</strong> {record.approvedByName || record.approvedBy?.name} on {formatDateTime(record.approvedAt)}
                    {record.approvalRemarks && <><br /><strong>Remarks:</strong> {record.approvalRemarks}</>}
                  </p>
                </div>
              )}

              {/* Approval Actions (if inspected but not yet approved) */}
              {(record.status === 'in_progress' || record.result) && !record.approvedBy && (
                <div style={{ padding: '16px', backgroundColor: '#FFF7ED', borderRadius: '10px', border: '1px solid #FED7AA' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#9A3412' }}>Approval Decision</p>
                  <textarea
                    value={approvalRemarks} onChange={e => setApprovalRemarks(e.target.value)}
                    placeholder="Approval remarks (optional)..." rows={2}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box', resize: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleApprove(true)} disabled={loading} style={{
                      padding: '8px 20px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    }}>Approve</button>
                    <button onClick={() => handleApprove(false)} disabled={loading} style={{
                      padding: '8px 20px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    }}>Reject</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CHECKLIST TAB */}
          {activeTab === 'checklist' && (
            <div>
              {(!record.checklistItems || record.checklistItems.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                  <ClipboardCheck size={40} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No checklist items</p>
                </div>
              ) : (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
                  {record.checklistItems.map((item, i) => (
                    <div key={i} style={{
                      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                      borderBottom: i < record.checklistItems.length - 1 ? '1px solid #E5E7EB' : 'none',
                      backgroundColor: i % 2 === 0 ? '#F9FAFB' : '#fff',
                    }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: checkStatusColors[item.status] || '#9CA3AF',
                      }} />
                      <span style={{ flex: 1, fontSize: '14px', color: '#374151', fontWeight: '500' }}>{item.name}</span>
                      <Badge config={{
                        pending: { label: 'Pending', bg: '#F3F4F6', color: '#6B7280' },
                        passed: { label: 'Passed', bg: '#D1FAE5', color: '#065F46' },
                        failed: { label: 'Failed', bg: '#FEE2E2', color: '#991B1B' },
                        na: { label: 'N/A', bg: '#E5E7EB', color: '#374151' },
                      }} value={item.status} />
                      {item.remarks && <span style={{ fontSize: '12px', color: '#9CA3AF', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.remarks}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DEFECTS TAB */}
          {activeTab === 'defects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>Defects & Snags</p>
                <button onClick={() => setShowDefectForm(!showDefectForm)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
                  backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                }}>
                  <Plus size={14} /> Add Defect
                </button>
              </div>

              {showDefectForm && (
                <div style={{ padding: '16px', backgroundColor: '#FEF2F2', borderRadius: '10px', border: '1px solid #FECACA', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input type="text" value={defectForm.description} onChange={e => setDefectForm(p => ({ ...p, description: e.target.value }))} placeholder="Defect description..." style={{ flex: 1, padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px' }} />
                    <select value={defectForm.severity} onChange={e => setDefectForm(p => ({ ...p, severity: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px' }}>
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowDefectForm(false)} style={{ padding: '6px 14px', backgroundColor: '#fff', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleAddDefect} disabled={loading} style={{ padding: '6px 14px', backgroundColor: '#EF4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Save</button>
                  </div>
                </div>
              )}

              {(!record.defects || record.defects.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                  <CheckCircle size={40} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No defects recorded</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {record.defects.map((d, i) => (
                    <div key={d._id || i} style={{
                      padding: '14px 16px', borderRadius: '10px', border: '1px solid #E5E7EB',
                      backgroundColor: '#fff',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <p style={{ margin: 0, fontSize: '14px', color: '#111827', fontWeight: '500' }}>{d.description}</p>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Badge config={SEVERITY_CONFIG} value={d.severity} />
                          <Badge config={DEFECT_STATUS_CONFIG} value={d.status} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                          {d.resolvedBy ? `Resolved by ${d.resolvedByName || 'user'} on ${formatDate(d.resolvedAt)}` : (d.assignedToName ? `Assigned to ${d.assignedToName}` : '')}
                        </span>
                        {d.status !== 'resolved' && (
                          <button onClick={() => handleResolveDefect(d._id)} disabled={loading} style={{
                            padding: '4px 12px', backgroundColor: '#059669', color: '#fff', border: 'none',
                            borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                          }}>Resolve</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div>
              {(!record.activities || record.activities.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                  <Activity size={40} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No activity yet</p>
                </div>
              ) : (
                <div style={{ position: 'relative', paddingLeft: '24px' }}>
                  <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', backgroundColor: '#E5E7EB' }} />
                  {[...record.activities].reverse().map((a, i) => (
                    <div key={i} style={{ position: 'relative', marginBottom: '20px' }}>
                      <div style={{
                        position: 'absolute', left: '-20px', top: '4px', width: '12px', height: '12px',
                        borderRadius: '50%', backgroundColor: '#3B82F6', border: '2px solid #fff',
                      }} />
                      <p style={{ margin: 0, fontSize: '13px', color: '#111827', fontWeight: '500' }}>{a.description || a.action}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
                        {a.performedByName || 'System'} &middot; {formatDateTime(a.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN QC MASTER PAGE
// ══════════════════════════════════════════════════════════════════
const QCMaster = () => {
  const [records, setRecords] = useState([])
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSourceType, setFilterSourceType] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [editRecord, setEditRecord] = useState(null)
  const [detailRecord, setDetailRecord] = useState(null)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }
      if (search) params.search = search
      if (filterProject) params.project = filterProject
      if (filterCategory) params.category = filterCategory
      if (filterStatus) params.status = filterStatus
      if (filterSourceType) params.sourceType = filterSourceType

      const res = await qcMasterAPI.getAll(params)
      setRecords(res.data || [])
      setTotal(res.total || 0)
      setTotalPages(res.pages || 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboard = async () => {
    try {
      const res = await qcMasterAPI.getDashboard(filterProject ? { project: filterProject } : {})
      setStats(res.data)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.getAll({ limit: 500 })
      setProjects(res.data || [])
    } catch (err) {
      console.error('Projects fetch error:', err)
    }
  }

  useEffect(() => { fetchProjects() }, [])
  useEffect(() => { fetchRecords() }, [search, filterProject, filterCategory, filterStatus, filterSourceType, page])
  useEffect(() => { fetchDashboard() }, [filterProject])

  const handleViewDetail = async (record) => {
    try {
      const res = await qcMasterAPI.getOne(record._id)
      setDetailRecord(res.data)
      setShowDetailModal(true)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleRefreshDetail = async () => {
    if (detailRecord) {
      try {
        const res = await qcMasterAPI.getOne(detailRecord._id)
        setDetailRecord(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchRecords()
    fetchDashboard()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this QC record?')) return
    try {
      await qcMasterAPI.delete(id)
      fetchRecords()
      fetchDashboard()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSuccess = () => {
    fetchRecords()
    fetchDashboard()
  }

  const clearFilters = () => {
    setSearch('')
    setFilterProject('')
    setFilterCategory('')
    setFilterStatus('')
    setFilterSourceType('')
    setPage(1)
  }

  const hasFilters = search || filterProject || filterCategory || filterStatus || filterSourceType

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#111827' }}>QC Master</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6B7280' }}>
            Centralized quality control tracking across all modules
          </p>
        </div>
        <button
          onClick={() => { setEditRecord(null); setShowCreateModal(true) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => { e.currentTarget.style.backgroundColor = '#2563EB' }}
          onMouseOut={e => { e.currentTarget.style.backgroundColor = '#3B82F6' }}
        >
          <Plus size={18} />
          New Inspection
        </button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <StatCard label="Total Inspections" value={stats.total} color="#3B82F6" icon={ClipboardCheck} />
          <StatCard label="Pending" value={stats.pending} color="#D97706" icon={Clock} onClick={() => { setFilterStatus('pending'); setPage(1) }} />
          <StatCard label="Passed" value={stats.passed} color="#059669" icon={CheckCircle} onClick={() => { setFilterStatus('passed'); setPage(1) }} />
          <StatCard label="Failed" value={stats.failed} color="#DC2626" icon={XCircle} onClick={() => { setFilterStatus('failed'); setPage(1) }} />
          <StatCard label="Rework" value={stats.rework} color="#EA580C" icon={RefreshCw} onClick={() => { setFilterStatus('rework'); setPage(1) }} />
          <StatCard label="Avg Score" value={`${stats.avgScore}%`} color="#7C3AED" icon={BarChart3} />
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px',
        padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB',
        alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search QC ID, title, project..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #D1D5DB',
              borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              backgroundColor: '#fff',
            }}
          />
        </div>
        <select value={filterProject} onChange={e => { setFilterProject(e.target.value); setPage(1) }} style={{ padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff', minWidth: '160px' }}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
        <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1) }} style={{ padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff', minWidth: '140px' }}>
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} style={{ padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff', minWidth: '130px' }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterSourceType} onChange={e => { setFilterSourceType(e.target.value); setPage(1) }} style={{ padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff', minWidth: '140px' }}>
          <option value="">All Sources</option>
          {Object.entries(SOURCE_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '9px 14px',
            backgroundColor: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '8px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Results Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
          {total} record{total !== 1 ? 's' : ''} found
          {hasFilters && ' (filtered)'}
        </p>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px' }}>Loading...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#DC2626' }}>
          <AlertTriangle size={32} style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
          <button onClick={fetchRecords} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : records.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9CA3AF' }}>
          <ClipboardCheck size={56} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#6B7280' }}>No QC Records</p>
          <p style={{ margin: '8px 0 20px', fontSize: '14px' }}>
            {hasFilters ? 'No records match your filters.' : 'Create your first QC inspection to get started.'}
          </p>
          {!hasFilters && (
            <button onClick={() => { setEditRecord(null); setShowCreateModal(true) }} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
              backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            }}>
              <Plus size={16} /> Create First Inspection
            </button>
          )}
        </div>
      ) : (
        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  {['QC ID', 'Project', 'Title', 'Category', 'Source', 'Status', 'Score', 'Inspector', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr
                    key={r._id}
                    style={{ borderBottom: '1px solid #F3F4F6', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F9FAFB' }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#fff' }}
                    onClick={() => handleViewDetail(r)}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#3B82F6', whiteSpace: 'nowrap' }}>{r.qcId}</td>
                    <td style={{ padding: '12px 16px', color: '#374151', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.projectName || r.project?.title || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</td>
                    <td style={{ padding: '12px 16px' }}><Badge config={CATEGORY_CONFIG} value={r.category} /></td>
                    <td style={{ padding: '12px 16px', color: '#6B7280', whiteSpace: 'nowrap' }}>{r.sourceType ? (SOURCE_TYPE_CONFIG[r.sourceType]?.label || r.sourceType) : '-'}</td>
                    <td style={{ padding: '12px 16px' }}><Badge config={STATUS_CONFIG} value={r.status} /></td>
                    <td style={{ padding: '12px 16px', minWidth: '100px' }}><ScoreBar score={r.score} /></td>
                    <td style={{ padding: '12px 16px', color: '#6B7280', whiteSpace: 'nowrap' }}>{r.inspectorName || r.inspector?.name || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#6B7280', whiteSpace: 'nowrap' }}>{formatDate(r.inspectionDate || r.createdAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                        <button
                          title="Inspect"
                          onClick={() => { setSelectedRecord(r); setShowInspectionModal(true) }}
                          style={{ padding: '6px', backgroundColor: '#EFF6FF', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#3B82F6' }}
                        ><ClipboardCheck size={15} /></button>
                        <button
                          title="Edit"
                          onClick={() => { setEditRecord(r); setShowCreateModal(true) }}
                          style={{ padding: '6px', backgroundColor: '#F3F4F6', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#6B7280' }}
                        ><FileText size={15} /></button>
                        <button
                          title="Delete"
                          onClick={() => handleDelete(r._id)}
                          style={{ padding: '6px', backgroundColor: '#FEF2F2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#EF4444' }}
                        ><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', borderTop: '1px solid #E5E7EB' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ padding: '6px 14px', backgroundColor: '#F3F4F6', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
              >Previous</button>
              <span style={{ fontSize: '13px', color: '#6B7280' }}>Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                style={{ padding: '6px 14px', backgroundColor: '#F3F4F6', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
              >Next</button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditRecord(null) }}
        onSuccess={handleSuccess}
        projects={projects}
        editData={editRecord}
      />
      <InspectionModal
        isOpen={showInspectionModal}
        onClose={() => { setShowInspectionModal(false); setSelectedRecord(null) }}
        onSuccess={handleSuccess}
        record={selectedRecord}
      />
      <DetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setDetailRecord(null) }}
        record={detailRecord}
        onRefresh={handleRefreshDetail}
      />
    </div>
  )
}

export default QCMaster
