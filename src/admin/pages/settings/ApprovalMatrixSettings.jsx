import { useState, useEffect } from 'react'
import {
  Plus, Edit2, Trash2, ChevronDown, ChevronRight, Users, Shield,
  CheckCircle2, Clock, AlertTriangle, Settings, Layers, RefreshCw
} from 'lucide-react'
import { approvalMatrixAPI, departmentsAPI } from '../../utils/api'

const MODULE_OPTIONS = [
  { value: 'all', label: 'All Modules (Default)' },
  { value: 'procurement', label: 'Procurement' },
  { value: 'hr', label: 'HR' },
  { value: 'finance', label: 'Finance' },
  { value: 'projects', label: 'Projects' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'sales', label: 'Sales' },
  { value: 'crm', label: 'CRM' },
  { value: 'vendor', label: 'Vendor Management' }
]

const ACTIVITY_OPTIONS = {
  all: [{ value: 'all', label: 'All Activities' }],
  procurement: [
    { value: 'all', label: 'All Procurement' },
    { value: 'purchase_requisition', label: 'Purchase Requisition' },
    { value: 'purchase_order', label: 'Purchase Order' },
    { value: 'goods_receipt', label: 'Goods Receipt (GRN)' },
    { value: 'vendor_invoice', label: 'Vendor Invoice' },
    { value: 'vendor_payment', label: 'Vendor Payment' }
  ],
  hr: [
    { value: 'all', label: 'All HR' },
    { value: 'leave_request', label: 'Leave Request' },
    { value: 'reimbursement', label: 'Reimbursement' },
    { value: 'attendance_regularization', label: 'Attendance Regularization' },
    { value: 'salary_revision', label: 'Salary Revision' }
  ],
  finance: [
    { value: 'all', label: 'All Finance' },
    { value: 'customer_invoice', label: 'Customer Invoice' },
    { value: 'payment_collection', label: 'Payment Collection' },
    { value: 'expense_approval', label: 'Expense Approval' },
    { value: 'budget_allocation', label: 'Budget Allocation' }
  ],
  projects: [
    { value: 'all', label: 'All Projects' },
    { value: 'project_creation', label: 'Project Creation' },
    { value: 'project_assignment', label: 'Project Assignment' },
    { value: 'task_completion', label: 'Task Completion' },
    { value: 'design_approval', label: 'Design Approval' },
    { value: 'milestone_approval', label: 'Milestone Approval' },
    { value: 'material_requisition', label: 'Material Requisition' },
    { value: 'vendor_assignment', label: 'Vendor Assignment' },
    { value: 'project_handover', label: 'Project Handover' }
  ],
  inventory: [
    { value: 'all', label: 'All Inventory' },
    { value: 'stock_adjustment', label: 'Stock Adjustment' },
    { value: 'material_request', label: 'Material Request' },
    { value: 'inter_warehouse_transfer', label: 'Inter-Warehouse Transfer' }
  ],
  sales: [
    { value: 'all', label: 'All Sales' },
    { value: 'quotation', label: 'Quotation' },
    { value: 'sales_order', label: 'Sales Order' },
    { value: 'discount_approval', label: 'Discount Approval' }
  ],
  crm: [
    { value: 'all', label: 'All CRM' },
    { value: 'lead_conversion', label: 'Lead Conversion' },
    { value: 'customer_onboarding', label: 'Customer Onboarding' }
  ],
  vendor: [
    { value: 'all', label: 'All Vendor' },
    { value: 'vendor_onboarding', label: 'Vendor Onboarding' },
    { value: 'vendor_rate_approval', label: 'Vendor Rate Approval' }
  ]
}

const APPROVER_TYPE_OPTIONS = [
  { value: 'specific_user', label: 'Specific User(s)' },
  { value: 'role', label: 'Anyone with Role' },
  { value: 'department_head', label: 'Department Head' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'reporting_manager', label: 'Reporting Manager' },
  { value: 'department_manager', label: 'Department Manager' },
  { value: 'module_owner', label: 'Module Owner' },
  { value: 'activity_owner', label: 'Activity Owner' }
]

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'finance_head', label: 'Finance Head' },
  { value: 'hr_head', label: 'HR Head' },
  { value: 'procurement_head', label: 'Procurement Head' },
  { value: 'operations_head', label: 'Operations Head' },
  { value: 'director', label: 'Director' },
  { value: 'ceo', label: 'CEO' }
]

const LEVEL_NAME_OPTIONS = [
  { value: 'maker', label: 'Maker (L1)' },
  { value: 'checker', label: 'Checker (L2)' },
  { value: 'approver', label: 'Approver (L3)' },
  { value: 'final_approver', label: 'Final Approver (L4)' },
  { value: 'super_approver', label: 'Super Approver (L5)' }
]

const ApprovalMatrixSettings = () => {
  const [matrices, setMatrices] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMatrix, setEditingMatrix] = useState(null)
  const [expandedMatrices, setExpandedMatrices] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    module: 'all',
    activity: 'all',
    department: '',
    description: '',
    levels: [{ level: 1, levelName: 'maker', approverType: 'reporting_manager' }],
    settings: {
      stopOnFirstRejection: true,
      allowParallelApprovals: false,
      allowSelfApproval: false,
      notifyOnEachLevel: true,
      requireRejectionComments: true
    },
    priority: 0,
    isActive: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [matricesRes, deptRes] = await Promise.all([
        approvalMatrixAPI.getAll(),
        departmentsAPI.getAll({ limit: 100 })
      ])
      setMatrices(matricesRes.data || [])
      setDepartments(deptRes.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    try {
      await approvalMatrixAPI.seedDefaults()
      loadData()
    } catch (err) {
      console.error('Failed to seed defaults:', err)
    }
  }

  const openCreateModal = () => {
    setEditingMatrix(null)
    setFormData({
      name: '',
      module: 'all',
      activity: 'all',
      department: '',
      description: '',
      levels: [{ level: 1, levelName: 'maker', approverType: 'reporting_manager' }],
      settings: {
        stopOnFirstRejection: true,
        allowParallelApprovals: false,
        allowSelfApproval: false,
        notifyOnEachLevel: true,
        requireRejectionComments: true
      },
      priority: 0,
      isActive: true
    })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (matrix) => {
    setEditingMatrix(matrix)
    setFormData({
      name: matrix.name,
      module: matrix.module,
      activity: matrix.activity,
      department: matrix.department?._id || '',
      description: matrix.description || '',
      levels: matrix.levels || [],
      settings: matrix.settings || {},
      priority: matrix.priority || 0,
      isActive: matrix.isActive
    })
    setError('')
    setShowModal(true)
  }

  const addLevel = () => {
    const nextLevel = formData.levels.length + 1
    setFormData({
      ...formData,
      levels: [
        ...formData.levels,
        { level: nextLevel, levelName: LEVEL_NAME_OPTIONS[nextLevel - 1]?.value || 'approver', approverType: 'department_head' }
      ]
    })
  }

  const removeLevel = (index) => {
    const newLevels = formData.levels.filter((_, i) => i !== index)
    // Re-number levels
    setFormData({
      ...formData,
      levels: newLevels.map((l, i) => ({ ...l, level: i + 1 }))
    })
  }

  const updateLevel = (index, field, value) => {
    const newLevels = [...formData.levels]
    newLevels[index] = { ...newLevels[index], [field]: value }
    setFormData({ ...formData, levels: newLevels })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const data = {
        ...formData,
        department: formData.department || null
      }

      if (editingMatrix) {
        await approvalMatrixAPI.update(editingMatrix._id, data)
      } else {
        await approvalMatrixAPI.create(data)
      }

      setShowModal(false)
      loadData()
    } catch (err) {
      setError(err.message || 'Failed to save matrix')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this approval matrix?')) return

    try {
      await approvalMatrixAPI.delete(id)
      loadData()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const toggleExpand = (id) => {
    setExpandedMatrices(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Inline styles
  const styles = {
    container: { padding: '24px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '24px', fontWeight: '600', color: '#111827' },
    subtitle: { fontSize: '14px', color: '#6b7280', marginTop: '4px' },
    buttonGroup: { display: 'flex', gap: '12px' },
    button: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: 'none' },
    primaryBtn: { backgroundColor: '#3b82f6', color: 'white' },
    secondaryBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
    matrixCard: { backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '16px', overflow: 'hidden' },
    matrixHeader: { display: 'flex', alignItems: 'center', padding: '16px', cursor: 'pointer', backgroundColor: '#f9fafb' },
    matrixTitle: { flex: 1, display: 'flex', alignItems: 'center', gap: '12px' },
    matrixName: { fontSize: '16px', fontWeight: '600', color: '#111827' },
    matrixModule: { fontSize: '12px', color: '#6b7280', backgroundColor: '#e5e7eb', padding: '4px 8px', borderRadius: '4px' },
    matrixBody: { padding: '16px', borderTop: '1px solid #e5e7eb' },
    levelRow: { display: 'flex', alignItems: 'center', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '8px' },
    levelNumber: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px', marginRight: '12px' },
    levelInfo: { flex: 1 },
    levelName: { fontWeight: '500', color: '#111827', textTransform: 'capitalize' },
    levelType: { fontSize: '12px', color: '#6b7280' },
    badge: { fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' },
    activeBadge: { backgroundColor: '#dcfce7', color: '#166534' },
    inactiveBadge: { backgroundColor: '#fee2e2', color: '#991b1b' },
    modal: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
    modalContent: { backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' },
    modalHeader: { padding: '20px 24px', borderBottom: '1px solid #e5e7eb' },
    modalTitle: { fontSize: '18px', fontWeight: '600', color: '#111827' },
    modalBody: { padding: '24px' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' },
    select: { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: 'white' },
    checkbox: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
    modalFooter: { padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
    sectionTitle: { fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px', marginTop: '16px' },
    levelConfig: { backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '12px' },
    levelConfigHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    removeBtn: { color: '#ef4444', cursor: 'pointer', padding: '4px' },
    emptyState: { textAlign: 'center', padding: '48px', color: '#6b7280' }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '48px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Approval Matrix Configuration</h1>
          <p style={styles.subtitle}>Configure Maker-Checker-Approver workflows for different modules and activities</p>
        </div>
        <div style={styles.buttonGroup}>
          <button style={{ ...styles.button, ...styles.secondaryBtn }} onClick={handleSeedDefaults}>
            <RefreshCw size={16} /> Seed Defaults
          </button>
          <button style={{ ...styles.button, ...styles.primaryBtn }} onClick={openCreateModal}>
            <Plus size={16} /> Create Matrix
          </button>
        </div>
      </div>

      {/* Matrix List */}
      {matrices.length === 0 ? (
        <div style={styles.emptyState}>
          <Layers size={48} style={{ margin: '0 auto 16px', color: '#d1d5db' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No Approval Matrices</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>Create your first approval matrix or seed defaults to get started</p>
          <button style={{ ...styles.button, ...styles.primaryBtn }} onClick={handleSeedDefaults}>
            <RefreshCw size={16} /> Seed Default Matrices
          </button>
        </div>
      ) : (
        matrices.map(matrix => (
          <div key={matrix._id} style={styles.matrixCard}>
            <div style={styles.matrixHeader} onClick={() => toggleExpand(matrix._id)}>
              {expandedMatrices[matrix._id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <div style={styles.matrixTitle}>
                <div>
                  <span style={styles.matrixName}>{matrix.name}</span>
                  <span style={styles.matrixModule}>{matrix.module} / {matrix.activity}</span>
                </div>
              </div>
              <span style={{ ...styles.badge, ...(matrix.isActive ? styles.activeBadge : styles.inactiveBadge) }}>
                {matrix.isActive ? 'Active' : 'Inactive'}
              </span>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                <button onClick={(e) => { e.stopPropagation(); openEditModal(matrix); }} style={{ padding: '8px', cursor: 'pointer', border: 'none', backgroundColor: 'transparent' }}>
                  <Edit2 size={16} color="#6b7280" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(matrix._id); }} style={{ padding: '8px', cursor: 'pointer', border: 'none', backgroundColor: 'transparent' }}>
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            </div>

            {expandedMatrices[matrix._id] && (
              <div style={styles.matrixBody}>
                {matrix.description && (
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>{matrix.description}</p>
                )}

                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Approval Levels</h4>
                {matrix.levels.map(level => (
                  <div key={level._id} style={styles.levelRow}>
                    <div style={styles.levelNumber}>{level.level}</div>
                    <div style={styles.levelInfo}>
                      <div style={styles.levelName}>{level.levelName.replace(/_/g, ' ')}</div>
                      <div style={styles.levelType}>
                        {level.approverType.replace(/_/g, ' ')}
                        {level.requiredRole && ` - ${level.requiredRole.replace(/_/g, ' ')}`}
                        {level.amountThreshold?.min > 0 && ` (₹${level.amountThreshold.min.toLocaleString()}+)`}
                      </div>
                    </div>
                    {level.escalateAfterHours && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        <Clock size={12} style={{ marginRight: '4px' }} />
                        Escalate after {level.escalateAfterHours}h
                      </span>
                    )}
                  </div>
                ))}

                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontSize: '12px', color: '#6b7280' }}>
                  <strong>Settings:</strong>
                  {matrix.settings?.stopOnFirstRejection && ' • Stop on rejection'}
                  {matrix.settings?.requireRejectionComments && ' • Require rejection comments'}
                  {matrix.settings?.notifyOnEachLevel && ' • Notify on each level'}
                  {matrix.settings?.allowDelegation && ' • Allow delegation'}
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingMatrix ? 'Edit Approval Matrix' : 'Create Approval Matrix'}</h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.modalBody}>
                {error && (
                  <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                    {error}
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Matrix Name *</label>
                  <input
                    style={styles.input}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Purchase Order Approval"
                    required
                  />
                </div>

                <div style={styles.grid2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Module *</label>
                    <select
                      style={styles.select}
                      value={formData.module}
                      onChange={e => setFormData({ ...formData, module: e.target.value, activity: 'all' })}
                    >
                      {MODULE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Activity *</label>
                    <select
                      style={styles.select}
                      value={formData.activity}
                      onChange={e => setFormData({ ...formData, activity: e.target.value })}
                    >
                      {(ACTIVITY_OPTIONS[formData.module] || ACTIVITY_OPTIONS.all).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={styles.grid2}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Department (Optional)</label>
                    <select
                      style={styles.select}
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Priority</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                    <small style={{ fontSize: '12px', color: '#6b7280' }}>Higher priority matrices take precedence</small>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <input
                    style={styles.input}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this approval workflow"
                  />
                </div>

                {/* Approval Levels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Approval Levels</h3>
                  <button type="button" style={{ ...styles.button, ...styles.secondaryBtn, padding: '6px 12px' }} onClick={addLevel}>
                    <Plus size={14} /> Add Level
                  </button>
                </div>

                {formData.levels.map((level, index) => (
                  <div key={index} style={styles.levelConfig}>
                    <div style={styles.levelConfigHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ ...styles.levelNumber, width: '28px', height: '28px', fontSize: '12px' }}>{index + 1}</div>
                        <select
                          style={{ ...styles.select, width: 'auto' }}
                          value={level.levelName}
                          onChange={e => updateLevel(index, 'levelName', e.target.value)}
                        >
                          {LEVEL_NAME_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      {formData.levels.length > 1 && (
                        <button type="button" style={styles.removeBtn} onClick={() => removeLevel(index)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div style={styles.grid2}>
                      <div>
                        <label style={{ ...styles.label, fontSize: '12px' }}>Approver Type</label>
                        <select
                          style={styles.select}
                          value={level.approverType}
                          onChange={e => updateLevel(index, 'approverType', e.target.value)}
                        >
                          {APPROVER_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {level.approverType === 'role' && (
                        <div>
                          <label style={{ ...styles.label, fontSize: '12px' }}>Required Role</label>
                          <select
                            style={styles.select}
                            value={level.requiredRole || ''}
                            onChange={e => updateLevel(index, 'requiredRole', e.target.value)}
                          >
                            <option value="">Select Role</option>
                            {ROLE_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div style={{ ...styles.grid2, marginTop: '12px' }}>
                      <div>
                        <label style={{ ...styles.label, fontSize: '12px' }}>Min Amount (₹)</label>
                        <input
                          type="number"
                          style={styles.input}
                          value={level.amountThreshold?.min || 0}
                          onChange={e => updateLevel(index, 'amountThreshold', { ...level.amountThreshold, min: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label style={{ ...styles.label, fontSize: '12px' }}>Escalate After (hours)</label>
                        <input
                          type="number"
                          style={styles.input}
                          value={level.escalateAfterHours || 48}
                          onChange={e => updateLevel(index, 'escalateAfterHours', parseInt(e.target.value) || 48)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Settings */}
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '12px' }}>Settings</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <label style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.settings.stopOnFirstRejection}
                      onChange={e => setFormData({ ...formData, settings: { ...formData.settings, stopOnFirstRejection: e.target.checked } })}
                    />
                    <span style={{ fontSize: '14px' }}>Stop on first rejection</span>
                  </label>
                  <label style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.settings.requireRejectionComments}
                      onChange={e => setFormData({ ...formData, settings: { ...formData.settings, requireRejectionComments: e.target.checked } })}
                    />
                    <span style={{ fontSize: '14px' }}>Require rejection comments</span>
                  </label>
                  <label style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.settings.notifyOnEachLevel}
                      onChange={e => setFormData({ ...formData, settings: { ...formData.settings, notifyOnEachLevel: e.target.checked } })}
                    />
                    <span style={{ fontSize: '14px' }}>Notify on each level</span>
                  </label>
                  <label style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.settings.allowDelegation}
                      onChange={e => setFormData({ ...formData, settings: { ...formData.settings, allowDelegation: e.target.checked } })}
                    />
                    <span style={{ fontSize: '14px' }}>Allow delegation</span>
                  </label>
                  <label style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.settings.allowSelfApproval}
                      onChange={e => setFormData({ ...formData, settings: { ...formData.settings, allowSelfApproval: e.target.checked } })}
                    />
                    <span style={{ fontSize: '14px' }}>Allow self-approval</span>
                  </label>
                  <label style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span style={{ fontSize: '14px' }}>Active</span>
                  </label>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={{ ...styles.button, ...styles.secondaryBtn }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={{ ...styles.button, ...styles.primaryBtn }} disabled={saving}>
                  {saving ? 'Saving...' : editingMatrix ? 'Update Matrix' : 'Create Matrix'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalMatrixSettings
