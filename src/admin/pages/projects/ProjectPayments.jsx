import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, IndianRupee, Calendar, CheckCircle2, Clock, AlertTriangle,
  Plus, FileText, Send, CreditCard, Building2, Receipt, Download
} from 'lucide-react'
import { projectWorkflowAPI, projectsAPI } from '../../utils/api'

const ProjectPayments = () => {
  const { id: projectId } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [paymentData, setPaymentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'bank_transfer',
    reference: '',
    remarks: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectRes, paymentRes] = await Promise.all([
        projectsAPI.getOne(projectId),
        projectWorkflowAPI.getPaymentMilestones(projectId)
      ])
      setProject(projectRes.data)
      setPaymentData(paymentRes.data)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const createDefaultMilestones = async () => {
    try {
      await projectWorkflowAPI.createDefaultMilestones(projectId)
      loadData()
    } catch (err) {
      console.error('Failed to create milestones:', err)
      alert(err.message || 'Failed to create milestones')
    }
  }

  const handleAddPayment = async () => {
    if (!selectedMilestone) return
    setSaving(true)
    try {
      const res = await projectWorkflowAPI.addPayment(selectedMilestone._id, {
        ...paymentForm,
        status: 'confirmed'
      })
      if (res.receiptNumber) {
        alert(`Collection recorded successfully!\nReceipt No: ${res.receiptNumber}`)
      }
      setShowPaymentModal(false)
      setSelectedMilestone(null)
      setPaymentForm({ amount: 0, method: 'bank_transfer', reference: '', remarks: '' })
      loadData()
    } catch (err) {
      console.error('Failed to add payment:', err)
      alert(err.message || 'Failed to add payment')
    } finally {
      setSaving(false)
    }
  }

  const openPaymentModal = (milestone) => {
    setSelectedMilestone(milestone)
    setPaymentForm({
      amount: milestone.pendingAmount || 0,
      method: 'bank_transfer',
      reference: '',
      remarks: ''
    })
    setShowPaymentModal(true)
  }

  const downloadReceipt = async (milestoneId) => {
    try {
      const token = localStorage.getItem('hoh108_admin_token')
      const companyId = localStorage.getItem('hoh108_active_company')
      const response = await fetch(`/api/project-workflow/payment-milestones/${milestoneId}/receipt`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(companyId && { 'X-Company-Id': companyId })
        }
      })
      if (!response.ok) throw new Error('Failed to download receipt')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Receipt-${milestoneId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Receipt download failed:', err)
      alert(err.message || 'Failed to download receipt')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
      case 'partially_paid': return <Clock size={18} style={{ color: '#3b82f6' }} />
      case 'overdue': return <AlertTriangle size={18} style={{ color: '#ef4444' }} />
      case 'due': return <Clock size={18} style={{ color: '#f59e0b' }} />
      default: return <Clock size={18} style={{ color: '#94a3b8' }} />
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'paid': return { bg: '#dcfce7', text: '#166534' }
      case 'partially_paid': return { bg: '#dbeafe', text: '#1d4ed8' }
      case 'overdue': return { bg: '#fee2e2', text: '#991b1b' }
      case 'due': return { bg: '#fef3c7', text: '#92400e' }
      default: return { bg: '#f1f5f9', text: '#475569' }
    }
  }

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Upcoming'
  }

  // Styles
  const containerStyle = { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }
  const backButtonStyle = { display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#C59C82', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '16px', background: 'none', border: 'none' }
  const titleStyle = { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }
  const cardStyle = { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }

  const summaryGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '24px' }
  const summaryCardStyle = (color) => ({ backgroundColor: color + '10', borderRadius: '16px', padding: '20px', border: `1px solid ${color}30` })

  const milestoneCardStyle = { padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 120px', alignItems: 'center', gap: '16px' }

  const buttonStyle = (variant) => ({ padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '500', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', backgroundColor: variant === 'primary' ? '#C59C82' : variant === 'success' ? '#22c55e' : '#f1f5f9', color: variant === 'primary' || variant === 'success' ? 'white' : '#475569' })

  const modalOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }
  const modalStyle = { backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }
  const modalHeaderStyle = { padding: '24px', borderBottom: '1px solid #e2e8f0' }
  const modalBodyStyle = { padding: '24px' }
  const modalFooterStyle = { padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }

  const inputStyle = { width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }
  const formGroupStyle = { marginBottom: '20px' }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading...</div>
      </div>
    )
  }

  // No milestones yet
  if (!paymentData?.milestones?.length) {
    return (
      <div style={containerStyle}>
        <button style={backButtonStyle} onClick={() => navigate(`/admin/projects/${projectId}`)}>
          <ArrowLeft size={18} /> Back to Project
        </button>
        <div style={cardStyle}>
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <IndianRupee size={36} style={{ color: '#94a3b8' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>No Payment Milestones</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Create payment milestones to track collections for this project.</p>
            <button style={{ ...buttonStyle('primary'), padding: '14px 28px', fontSize: '15px' }} onClick={createDefaultMilestones}>
              <Plus size={18} /> Create Default Milestones
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button style={backButtonStyle} onClick={() => navigate(`/admin/projects/${projectId}`)}>
          <ArrowLeft size={18} /> Back to Project
        </button>
        <h1 style={titleStyle}>{project?.title} - Payment Milestones</h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Track payment schedule and collections</p>
      </div>

      {/* Summary Cards */}
      <div style={cardStyle}>
        <div style={summaryGridStyle}>
          <div style={summaryCardStyle('#C59C82')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <IndianRupee size={24} style={{ color: '#C59C82' }} />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#C59C82' }}>Total Amount</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>{formatCurrency(paymentData.grandTotal)}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Incl. GST {formatCurrency(paymentData.totalGST)}</div>
          </div>

          <div style={summaryCardStyle('#22c55e')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <CheckCircle2 size={24} style={{ color: '#22c55e' }} />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#22c55e' }}>Collected</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>{formatCurrency(paymentData.collected)}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{paymentData.collectionPercentage}% collected</div>
          </div>

          <div style={summaryCardStyle('#f59e0b')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Clock size={24} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#f59e0b' }}>Pending</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>{formatCurrency(paymentData.pending)}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>{paymentData.dueCount + paymentData.overdueCount} milestones due</div>
          </div>

          <div style={summaryCardStyle('#ef4444')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#ef4444' }}>Overdue</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b' }}>{paymentData.overdueCount}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>milestones overdue</div>
          </div>
        </div>
      </div>

      {/* Collection Progress */}
      <div style={cardStyle}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Collection Progress</span>
            <span style={{ fontSize: '16px', fontWeight: '700', color: '#C59C82' }}>{paymentData.collectionPercentage}%</span>
          </div>
          <div style={{ width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${paymentData.collectionPercentage}%`, height: '100%', backgroundColor: '#22c55e', borderRadius: '6px', transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
            <span>Collected: {formatCurrency(paymentData.collected)}</span>
            <span>Total: {formatCurrency(paymentData.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Milestones List */}
      <div style={cardStyle}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Payment Schedule</h3>
        </div>

        {/* Header */}
        <div style={{ ...milestoneCardStyle, backgroundColor: '#f8fafc', padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
          <div>Milestone</div>
          <div>Amount</div>
          <div>Collected</div>
          <div>Pending</div>
          <div>Status</div>
          <div></div>
        </div>

        {/* Milestones */}
        {paymentData.milestones.map((milestone, index) => {
          const statusStyle = getStatusStyle(milestone.status)
          return (
            <div key={milestone._id} style={milestoneCardStyle}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: milestone.status === 'paid' ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', color: milestone.status === 'paid' ? '#22c55e' : '#64748b' }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{milestone.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{milestone.percentage}% • Due: {formatDate(milestone.dueDate)}</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#1e293b' }}>{formatCurrency(milestone.totalAmount)}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Base: {formatCurrency(milestone.amount)}</div>
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#22c55e' }}>{formatCurrency(milestone.collectedAmount)}</div>
              </div>
              <div>
                <div style={{ fontWeight: '600', color: milestone.pendingAmount > 0 ? '#f59e0b' : '#22c55e' }}>{formatCurrency(milestone.pendingAmount)}</div>
              </div>
              <div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', backgroundColor: statusStyle.bg, color: statusStyle.text }}>
                  {getStatusIcon(milestone.status)}
                  {formatStatus(milestone.status)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {milestone.status === 'paid' ? (
                  <button onClick={() => downloadReceipt(milestone._id)} style={{ ...buttonStyle('primary'), padding: '8px 16px', fontSize: '13px' }}>
                    <Download size={14} /> Receipt
                  </button>
                ) : (
                  <button onClick={() => openPaymentModal(milestone)} style={{ ...buttonStyle('success'), padding: '8px 16px', fontSize: '13px' }}>
                    <Receipt size={14} /> Record Collection
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Payment Modal */}
      {showPaymentModal && selectedMilestone && (
        <div style={modalOverlayStyle} onClick={() => setShowPaymentModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Record Collection</h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{selectedMilestone.name}</p>
            </div>
            <div style={modalBodyStyle}>
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Total Amount</span>
                  <span style={{ fontWeight: '600' }}>{formatCurrency(selectedMilestone.totalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Already Collected</span>
                  <span style={{ fontWeight: '600', color: '#22c55e' }}>{formatCurrency(selectedMilestone.collectedAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: '600' }}>Pending Amount</span>
                  <span style={{ fontWeight: '700', color: '#f59e0b' }}>{formatCurrency(selectedMilestone.pendingAmount)}</span>
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Payment Amount *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Payment Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  style={inputStyle}
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="neft">NEFT</option>
                  <option value="rtgs">RTGS</option>
                  <option value="imps">IMPS</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Reference/Transaction ID</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="Enter transaction reference"
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Remarks</label>
                <textarea
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  placeholder="Add any remarks..."
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button onClick={() => setShowPaymentModal(false)} style={buttonStyle('default')}>Cancel</button>
              <button onClick={handleAddPayment} disabled={saving || paymentForm.amount <= 0} style={{ ...buttonStyle('success'), opacity: saving || paymentForm.amount <= 0 ? 0.6 : 1 }}>
                {saving ? 'Recording...' : 'Record Collection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectPayments
