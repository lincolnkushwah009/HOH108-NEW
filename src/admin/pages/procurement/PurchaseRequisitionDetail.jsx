import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Building2,
  User,
  Calendar,
  FileText,
  Trash2,
} from 'lucide-react'
import { purchaseRequisitionsAPI } from '../../utils/api'
import { Button, Badge, Modal, Input } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'

const PurchaseRequisitionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const printRef = useRef()
  const { user } = useAuth()
  const [requisition, setRequisition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin'

  useEffect(() => {
    loadRequisition()
  }, [id])

  const loadRequisition = async () => {
    try {
      const response = await purchaseRequisitionsAPI.getOne(id)
      setRequisition(response.data)
    } catch (err) {
      console.error('Failed to load requisition:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await purchaseRequisitionsAPI.submit(id)
      loadRequisition()
    } catch (err) {
      console.error('Failed to submit:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await purchaseRequisitionsAPI.approve(id)
      loadRequisition()
    } catch (err) {
      console.error('Failed to approve:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (e) => {
    e.preventDefault()
    if (!rejectReason.trim()) return
    setSubmitting(true)
    try {
      await purchaseRequisitionsAPI.reject(id, rejectReason)
      setShowRejectModal(false)
      setRejectReason('')
      loadRequisition()
    } catch (err) {
      console.error('Failed to reject:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await purchaseRequisitionsAPI.delete(id)
      navigate('/admin/purchase-requisitions')
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete requisition')
    } finally {
      setSubmitting(false)
      setShowDeleteModal(false)
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Requisition ${requisition?.prNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 48px; color: #111; line-height: 1.5; }
            .pr { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
            .logo-section img { height: 80px; width: auto; }
            .pr-info { text-align: right; }
            .pr-number { font-size: 14px; color: #666; }
            .pr-number strong { font-size: 20px; color: #111; display: block; margin-top: 4px; }
            .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 40px; }
            .party-label { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
            .party-name { font-size: 16px; font-weight: 600; color: #111; margin-bottom: 4px; }
            .party-detail { font-size: 13px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
            th { text-align: left; padding: 12px 0; font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #111; }
            th:last-child { text-align: right; }
            td { padding: 16px 0; font-size: 14px; color: #333; border-bottom: 1px solid #eee; }
            td:last-child { text-align: right; font-weight: 500; }
            .item-desc { font-weight: 500; color: #111; }
            .item-code { font-size: 12px; color: #999; margin-top: 2px; }
            .summary { display: flex; justify-content: flex-end; }
            .summary-box { width: 280px; }
            .summary-total { display: flex; justify-content: space-between; padding: 16px 0; margin-top: 8px; border-top: 2px solid #111; font-size: 18px; font-weight: 700; color: #111; }
            @media print { body { padding: 24px; } }
          </style>
        </head>
        <body>
          <div class="pr">${printContent.innerHTML}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const statusConfig = {
    draft: { color: 'gray', label: 'Draft' },
    submitted: { color: 'blue', label: 'Submitted' },
    pending_approval: { color: 'yellow', label: 'Pending Approval' },
    approved: { color: 'green', label: 'Approved' },
    partially_approved: { color: 'yellow', label: 'Partially Approved' },
    rejected: { color: 'red', label: 'Rejected' },
    converted: { color: 'purple', label: 'Converted' },
    cancelled: { color: 'gray', label: 'Cancelled' },
  }

  const priorityConfig = {
    low: { color: 'gray', label: 'Low' },
    medium: { color: 'blue', label: 'Medium' },
    high: { color: 'orange', label: 'High' },
    urgent: { color: 'red', label: 'Urgent' },
  }

  if (loading) return <PageLoader />

  if (!requisition) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: '#666', marginBottom: 16 }}>Purchase requisition not found</p>
        <Button onClick={() => navigate('/admin/purchase-requisitions')}>Back to Requisitions</Button>
      </div>
    )
  }

  const status = statusConfig[requisition.status] || statusConfig.draft
  const priority = priorityConfig[requisition.priority] || priorityConfig.medium

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate('/admin/purchase-requisitions')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex' }}
              onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              <ArrowLeft size={20} color="#666" />
            </button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111', margin: 0 }}>{requisition.prNumber}</h1>
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{requisition.purpose}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#333' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#bbb'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#ddd'}
            >
              <Printer size={16} />
              Print
            </button>
            {requisition.status === 'draft' && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#111111', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'white' }}
              >
                <Send size={16} />
                Submit for Approval
              </button>
            )}
            {(requisition.status === 'submitted' || requisition.status === 'pending_approval') && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#16a34a', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'white' }}
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#dc2626', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'white' }}
                >
                  <XCircle size={16} />
                  Reject
                </button>
              </>
            )}
            {isSuperAdmin && requisition.status === 'draft' && (
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', border: '1px solid #dc2626', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#dc2626' }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
          {/* Main Content */}
          <div>
            {/* Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estimated Total</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>{formatCurrency(requisition.estimatedTotal)}</p>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>{requisition.lineItems?.length || 0}</p>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</p>
                <Badge color={priority.color}>{priority.label}</Badge>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                <Badge color={status.color}>{status.label}</Badge>
              </div>
            </div>

            {/* PR Card */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
              <div ref={printRef} style={{ padding: 40 }}>
                {/* Header */}
                <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                  <div className="logo-section">
                    <img src="/Logo.png" alt="Logo" style={{ height: 80, width: 'auto' }} />
                  </div>
                  <div className="pr-info" style={{ textAlign: 'right' }}>
                    <div className="pr-number" style={{ fontSize: 13, color: '#888' }}>
                      Purchase Requisition
                      <strong style={{ display: 'block', fontSize: 18, color: '#111', marginTop: 4 }}>{requisition.prNumber}</strong>
                    </div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                      {formatDate(requisition.requestDate)}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="parties" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 40 }}>
                  <div>
                    <div className="party-label" style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Requested By</div>
                    <div className="party-name" style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>{requisition.requestedBy?.name || '-'}</div>
                    <div className="party-detail" style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                      {requisition.requestedBy?.email && <div>{requisition.requestedBy.email}</div>}
                      {requisition.requestedBy?.department && <div>{requisition.requestedBy.department}</div>}
                    </div>
                  </div>
                  <div>
                    <div className="party-label" style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Details</div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span>Request Date</span>
                        <span style={{ color: '#111', fontWeight: 500 }}>{formatDate(requisition.requestDate)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span>Required Date</span>
                        <span style={{ color: '#111', fontWeight: 500 }}>{formatDate(requisition.requiredDate) || '-'}</span>
                      </div>
                      {requisition.project && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Project</span>
                          <span style={{ color: '#111', fontWeight: 500 }}>{requisition.project.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Purpose */}
                {requisition.purpose && (
                  <div style={{ marginBottom: 32, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Purpose</div>
                    <div style={{ fontSize: 14, color: '#333' }}>{requisition.purpose}</div>
                  </div>
                )}

                {/* Line Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111', width: 40 }}>#</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111' }}>Description</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111', width: 80 }}>Qty</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111', width: 60 }}>Unit</th>
                      <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111', width: 100 }}>Est. Price</th>
                      <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111', width: 120 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requisition.lineItems?.map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#666', borderBottom: '1px solid #eee' }}>{item.slNo || index + 1}</td>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#333', borderBottom: '1px solid #eee' }}>
                          <div className="item-desc" style={{ fontWeight: 500, color: '#111' }}>{item.description}</div>
                          {item.itemCode && (
                            <div className="item-code" style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                              Code: {item.itemCode}
                            </div>
                          )}
                          {item.specifications && (
                            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{item.specifications}</div>
                          )}
                        </td>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#666', borderBottom: '1px solid #eee', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#666', borderBottom: '1px solid #eee', textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#666', borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatCurrency(item.estimatedUnitPrice)}</td>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#111', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.estimatedTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="summary" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div className="summary-box" style={{ width: 280 }}>
                    <div className="summary-total" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', marginTop: 8, borderTop: '2px solid #111', fontSize: 18, fontWeight: 700, color: '#111' }}>
                      <span>Estimated Total</span>
                      <span>{formatCurrency(requisition.estimatedTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {requisition.internalNotes && (
                  <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #eee' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Internal Notes</div>
                    <div style={{ fontSize: 13, color: '#666' }}>{requisition.internalNotes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Project Info */}
            {requisition.project && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={16} />
                  Project
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Project Name</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>{requisition.project.title}</p>
                  </div>
                  {requisition.project.projectId && (
                    <div>
                      <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Project ID</p>
                      <p style={{ fontSize: 14, color: '#111', margin: 0 }}>{requisition.project.projectId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requester Info */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} />
                Requested By
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Name</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>{requisition.requestedBy?.name || '-'}</p>
                </div>
                {requisition.requestedBy?.email && (
                  <div>
                    <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Email</p>
                    <p style={{ fontSize: 14, color: '#111', margin: 0 }}>{requisition.requestedBy.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Approval Info */}
            {requisition.approvedBy && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={16} />
                  Approval
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Approved By</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>{requisition.approvedBy?.name || '-'}</p>
                  </div>
                  {requisition.approvedAt && (
                    <div>
                      <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Approved On</p>
                      <p style={{ fontSize: 14, color: '#111', margin: 0 }}>{formatDate(requisition.approvedAt)}</p>
                    </div>
                  )}
                  {requisition.approvalRemarks && (
                    <div>
                      <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Remarks</p>
                      <p style={{ fontSize: 14, color: '#111', margin: 0 }}>{requisition.approvalRemarks}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rejection Info */}
            {requisition.status === 'rejected' && requisition.rejectionReason && (
              <div style={{ background: '#fef2f2', borderRadius: 16, border: '1px solid #fecaca', padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={16} />
                  Rejection Reason
                </h3>
                <p style={{ fontSize: 14, color: '#7f1d1d', margin: 0 }}>{requisition.rejectionReason}</p>
              </div>
            )}

            {/* Activity */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={16} />
                Activity
              </h3>
              {requisition.activities?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {requisition.activities.slice().reverse().slice(0, 10).map((activity, index) => (
                    <div key={index} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ddd', marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, color: '#333', margin: 0 }}>{activity.description || activity.action}</p>
                        <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0 0' }}>
                          {activity.performedByName} &middot; {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Clock size={24} color="#ddd" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: '#888', margin: 0 }}>No activity</p>
                </div>
              )}
            </div>

            {/* Linked POs */}
            {requisition.linkedPurchaseOrders?.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} />
                  Linked Purchase Orders
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {requisition.linkedPurchaseOrders.map((po, index) => (
                    <div
                      key={index}
                      onClick={() => navigate(`/admin/purchase-orders/${po._id}`)}
                      style={{ padding: 12, background: '#f8fafc', borderRadius: 8, cursor: 'pointer' }}
                    >
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>{po.poNumber}</p>
                      <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0 0' }}>{po.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Purchase Requisition"
      >
        <form onSubmit={handleReject}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 8 }}>
              Rejection Reason <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              required
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button type="button" variant="outline" onClick={() => setShowRejectModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} style={{ flex: 1, background: '#dc2626' }}>
              Reject
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Purchase Requisition"
      >
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: '#666' }}>
            Are you sure you want to delete this purchase requisition? This action cannot be undone.
          </p>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#111', marginTop: 12 }}>
            {requisition.prNumber}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button onClick={handleDelete} loading={submitting} style={{ flex: 1, background: '#dc2626' }}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default PurchaseRequisitionDetail
