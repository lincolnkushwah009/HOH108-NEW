import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle, XCircle, Clock, FileText, User, Calendar,
  Eye, MoreVertical, Send, Users, AlertCircle, Award,
  Building, IndianRupee, ClipboardList, Briefcase, ArrowRight
} from 'lucide-react'
import { approvalsAPI, usersAPI, projectsAPI } from '../../utils/api'

const STATUS_CONFIG = {
  draft: { label: 'Draft', bgColor: '#F3F4F6', textColor: '#6B7280', icon: FileText },
  pending_approval: { label: 'Pending Approval', bgColor: '#FEF3C7', textColor: '#D97706', icon: Clock },
  partially_approved: { label: 'Partially Approved', bgColor: '#DBEAFE', textColor: '#1D4ED8', icon: CheckCircle },
  approved: { label: 'Approved', bgColor: '#D1FAE5', textColor: '#059669', icon: CheckCircle },
  rejected: { label: 'Rejected', bgColor: '#FEE2E2', textColor: '#DC2626', icon: XCircle },
}

const APPROVAL_ITEMS = {
  material_quotation: { label: 'Material Quotation', icon: FileText, bgColor: '#DBEAFE', textColor: '#1D4ED8' },
  material_spend: { label: 'Material Spend', icon: IndianRupee, bgColor: '#D1FAE5', textColor: '#059669' },
  payment_schedule: { label: 'Payment Schedule', icon: Calendar, bgColor: '#F3E8FF', textColor: '#C59C82' },
  schedule_of_work: { label: 'Schedule of Work', icon: ClipboardList, bgColor: '#FFEDD5', textColor: '#EA580C' },
}

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const Icon = config.icon

  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      background: config.bgColor,
      color: config.textColor,
    }}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}

const ApprovalItemBadge = ({ type, status }) => {
  const config = APPROVAL_ITEMS[type]
  const Icon = config?.icon || FileText
  const statusStyles = {
    pending: { bg: '#F3F4F6', border: '#E5E7EB', color: '#6B7280' },
    approved: { bg: '#D1FAE5', border: '#A7F3D0', color: '#059669' },
    rejected: { bg: '#FEE2E2', border: '#FECACA', color: '#DC2626' },
    partially_approved: { bg: '#DBEAFE', border: '#BFDBFE', color: '#1D4ED8' },
  }
  const style = statusStyles[status] || statusStyles.pending

  return (
    <div style={{
      padding: '10px 12px',
      borderRadius: '10px',
      border: `1px solid ${style.border}`,
      background: style.bg,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: style.color }}>
        <Icon size={14} />
        <span style={{ fontSize: '12px', fontWeight: '500' }}>{config?.label || type}</span>
      </div>
      <p style={{ fontSize: '10px', marginTop: '4px', textTransform: 'capitalize', color: style.color }}>{status}</p>
    </div>
  )
}

const AgreementCard = ({ agreement, onView, onApprove }) => {
  const [showActions, setShowActions] = useState(false)

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{agreement.agreementId}</p>
            <Link
              to={`/admin/projects/${agreement.project?._id}`}
              style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#1F2937',
                textDecoration: 'none',
                marginTop: '4px',
                display: 'block',
              }}
            >
              {agreement.project?.title || 'Unknown Project'}
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={agreement.status} />
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowActions(!showActions)}
                style={{
                  padding: '6px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                <MoreVertical size={16} style={{ color: '#9CA3AF' }} />
              </button>
              {showActions && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '32px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  border: '1px solid #E5E7EB',
                  padding: '4px',
                  zIndex: 10,
                  minWidth: '150px',
                }}>
                  <button
                    onClick={() => { onView(agreement); setShowActions(false) }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: '13px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '6px',
                      color: '#374151',
                    }}
                  >
                    <Eye size={14} /> View Details
                  </button>
                  {agreement.status === 'pending_approval' && (
                    <button
                      onClick={() => { onApprove(agreement); setShowActions(false) }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '13px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '6px',
                        color: '#059669',
                      }}
                    >
                      <CheckCircle size={14} /> Review & Approve
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Customer Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6B7280' }}>
          <User size={14} />
          <span>{agreement.customer?.name || 'Unknown Customer'}</span>
        </div>

        {/* Approval Items Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {agreement.approvalItems?.map((item) => (
            <ApprovalItemBadge key={item._id} type={item.type} status={item.overallStatus} />
          ))}
        </div>

        {/* Approvers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#9CA3AF' }}>
          <Users size={14} />
          <span>{agreement.approvers?.length || 0} Approvers</span>
        </div>

        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#9CA3AF' }}>
          <Calendar size={12} />
          <span>{new Date(agreement.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Footer - Handover Status */}
      {agreement.status === 'approved' && (
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${agreement.handover?.isCompleted ? '#A7F3D0' : '#FDE68A'}`,
          background: agreement.handover?.isCompleted ? '#ECFDF5' : '#FFFBEB',
        }}>
          {agreement.handover?.isCompleted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#059669' }}>
              <Award size={14} />
              <span>Handed over to {agreement.handover.projectManagerName}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#D97706' }}>
              <AlertCircle size={14} />
              <span>Pending handover to Operations</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const PendingApprovalItem = ({ item, onApprove, onReject }) => {
  const config = APPROVAL_ITEMS[item.itemType]
  const Icon = config?.icon || FileText

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          background: config?.bgColor || '#F3F4F6',
        }}>
          <Icon size={22} style={{ color: config?.textColor || '#6B7280' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
            {config?.label || item.itemType}
          </h4>
          <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0 0' }}>{item.agreementNumber}</p>
          <Link
            to={`/admin/projects/${item.project?._id}`}
            style={{ fontSize: '13px', color: '#3B82F6', textDecoration: 'none', marginTop: '4px', display: 'block' }}
          >
            {item.project?.title}
          </Link>
          {item.documentName && (
            <a
              href={item.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px', display: 'inline-block' }}
            >
              View Document: {item.documentName}
            </a>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onApprove(item)}
            style={{
              padding: '10px 16px',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle size={14} />
            Approve
          </button>
          <button
            onClick={() => onReject(item)}
            style={{
              padding: '10px 16px',
              background: '#FEE2E2',
              color: '#DC2626',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <XCircle size={14} />
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

const AgreementDetailModal = ({ isOpen, onClose, agreement, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('items')
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [approvalRemarks, setApprovalRemarks] = useState('')

  if (!isOpen || !agreement) return null

  const handleApproveItem = async (item, status) => {
    if (!approvalRemarks && status === 'rejected') {
      alert('Please provide remarks for rejection')
      return
    }
    setLoading(true)
    try {
      await approvalsAPI.approveItem(agreement._id, item._id, {
        status,
        remarks: approvalRemarks,
      })
      setApprovalRemarks('')
      setSelectedItem(null)
      onRefresh?.()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const tabs = ['items', 'approvers', 'handover']

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
          color: '#ffffff',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>{agreement.agreementId}</p>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '4px 0 0 0' }}>Master Agreement</h2>
              <p style={{ fontSize: '13px', opacity: 0.8, margin: '4px 0 0 0' }}>
                {agreement.project?.title} • {agreement.customer?.name}
              </p>
            </div>
            <StatusBadge status={agreement.status} />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #E5E7EB', display: 'flex' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '14px 24px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #EC4899' : '2px solid transparent',
                color: activeTab === tab ? '#EC4899' : '#6B7280',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'items' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>Approval Items</h3>
              {agreement.approvalItems?.map((item) => {
                const config = APPROVAL_ITEMS[item.type]
                const Icon = config?.icon || FileText
                const statusBg = item.overallStatus === 'approved' ? '#ECFDF5' :
                                item.overallStatus === 'rejected' ? '#FEF2F2' : '#ffffff'
                const statusBorder = item.overallStatus === 'approved' ? '#A7F3D0' :
                                    item.overallStatus === 'rejected' ? '#FECACA' : '#E5E7EB'

                return (
                  <div
                    key={item._id}
                    style={{
                      border: `1px solid ${statusBorder}`,
                      borderRadius: '14px',
                      padding: '16px',
                      background: statusBg,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{
                          padding: '10px',
                          borderRadius: '10px',
                          background: config?.bgColor || '#F3F4F6',
                        }}>
                          <Icon size={18} style={{ color: config?.textColor || '#6B7280' }} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', margin: 0 }}>{config?.label}</h4>
                          {item.document?.name && (
                            <a
                              href={item.document.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '13px', color: '#3B82F6', textDecoration: 'none' }}
                            >
                              {item.document.name}
                            </a>
                          )}
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0', textTransform: 'capitalize' }}>
                            Status: {item.overallStatus}
                          </p>
                        </div>
                      </div>

                      {item.overallStatus === 'pending' && (
                        <button
                          onClick={() => setSelectedItem(item)}
                          style={{
                            padding: '8px 14px',
                            background: '#3B82F6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          Review
                        </button>
                      )}
                    </div>

                    {/* Approval History */}
                    {item.approvals?.length > 0 && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                        <p style={{ fontSize: '12px', fontWeight: '500', color: '#9CA3AF', margin: '0 0 8px 0' }}>Approval History</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {item.approvals.map((approval, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                              {approval.status === 'approved' ? (
                                <CheckCircle size={14} style={{ color: '#059669' }} />
                              ) : (
                                <XCircle size={14} style={{ color: '#DC2626' }} />
                              )}
                              <span style={{ color: '#374151' }}>{approval.approverName}</span>
                              <span style={{ color: '#D1D5DB' }}>•</span>
                              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
                                {new Date(approval.actionTakenAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Approval Form */}
                    {selectedItem?._id === item._id && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                        <textarea
                          value={approvalRemarks}
                          onChange={(e) => setApprovalRemarks(e.target.value)}
                          placeholder="Add remarks (required for rejection)..."
                          rows={2}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '10px',
                            fontSize: '14px',
                            resize: 'none',
                            outline: 'none',
                          }}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                          <button
                            onClick={() => handleApproveItem(item, 'approved')}
                            disabled={loading}
                            style={{
                              padding: '10px 16px',
                              background: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              opacity: loading ? 0.5 : 1,
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveItem(item, 'rejected')}
                            disabled={loading}
                            style={{
                              padding: '10px 16px',
                              background: '#DC2626',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              opacity: loading ? 0.5 : 1,
                            }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => { setSelectedItem(null); setApprovalRemarks('') }}
                            style={{
                              padding: '10px 16px',
                              background: 'transparent',
                              color: '#6B7280',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'approvers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>Approvers</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {agreement.approvers?.map((approver, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      background: '#FCE7F3',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <User size={20} style={{ color: '#EC4899' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>
                        {approver.user?.name || 'Unknown'}
                      </p>
                      <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '2px 0 0 0', textTransform: 'capitalize' }}>
                        {approver.role}
                      </p>
                      {approver.isMandatory && (
                        <span style={{
                          fontSize: '11px',
                          background: '#FEF3C7',
                          color: '#D97706',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          marginTop: '6px',
                          display: 'inline-block',
                        }}>
                          Mandatory
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'handover' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>Operations Handover</h3>
              {agreement.handover?.isCompleted ? (
                <div style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '14px',
                  padding: '24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <CheckCircle size={24} style={{ color: '#059669' }} />
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#065F46', margin: 0 }}>Handover Completed</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', fontSize: '14px' }}>
                    <div>
                      <p style={{ color: '#9CA3AF', margin: 0 }}>Project Manager</p>
                      <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>{agreement.handover.projectManagerName}</p>
                    </div>
                    <div>
                      <p style={{ color: '#9CA3AF', margin: 0 }}>Handed Over By</p>
                      <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>{agreement.handover.handedOverByName}</p>
                    </div>
                    <div>
                      <p style={{ color: '#9CA3AF', margin: 0 }}>Date</p>
                      <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>
                        {new Date(agreement.handover.handedOverAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {agreement.handover.notes && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #A7F3D0' }}>
                      <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>Notes</p>
                      <p style={{ fontSize: '14px', color: '#374151', margin: '4px 0 0 0' }}>{agreement.handover.notes}</p>
                    </div>
                  )}
                </div>
              ) : agreement.status === 'approved' ? (
                <div style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '14px',
                  padding: '24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <AlertCircle size={24} style={{ color: '#D97706' }} />
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#92400E', margin: 0 }}>Pending Handover</h4>
                  </div>
                  <p style={{ fontSize: '14px', color: '#B45309', margin: 0 }}>
                    This agreement is fully approved and ready for handover to Operations.
                    The CBO needs to complete the handover process.
                  </p>
                </div>
              ) : (
                <div style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '14px',
                  padding: '24px',
                  textAlign: 'center',
                }}>
                  <p style={{ color: '#9CA3AF', margin: 0 }}>
                    Handover will be available after all items are approved.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              border: '1px solid #E5E7EB',
              background: '#ffffff',
              color: '#374151',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Approvals() {
  const [agreements, setAgreements] = useState([])
  const [pendingItems, setPendingItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedAgreement, setSelectedAgreement] = useState(null)
  const [activeView, setActiveView] = useState('pending')
  const [filters, setFilters] = useState({ status: '' })
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    pendingHandover: 0,
  })

  useEffect(() => {
    fetchData()
  }, [filters])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [agreementsRes, pendingRes, statsRes] = await Promise.all([
        approvalsAPI.getAll(filters),
        approvalsAPI.getPending(),
        approvalsAPI.getStats(),
      ])
      setAgreements(agreementsRes.data || [])
      setPendingItems(pendingRes.data || [])
      setStats(statsRes.data || {})
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (agreement) => {
    try {
      const response = await approvalsAPI.getOne(agreement._id)
      setSelectedAgreement(response.data)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Error fetching agreement:', error)
    }
  }

  const handleApproveFromList = async (item) => {
    const remarks = prompt('Enter approval remarks (optional):')
    try {
      await approvalsAPI.approveItem(item.agreementId, item.itemId, {
        status: 'approved',
        remarks: remarks || 'Approved',
      })
      fetchData()
    } catch (error) {
      alert(error.message)
    }
  }

  const handleRejectFromList = async (item) => {
    const remarks = prompt('Enter rejection reason:')
    if (!remarks) {
      alert('Rejection reason is required')
      return
    }
    try {
      await approvalsAPI.approveItem(item.agreementId, item.itemId, {
        status: 'rejected',
        remarks,
      })
      fetchData()
    } catch (error) {
      alert(error.message)
    }
  }

  const statCards = [
    { label: 'Total Agreements', value: stats.total || 0, icon: FileText, bgColor: '#FCE7F3', iconColor: '#EC4899' },
    { label: 'Pending Approval', value: stats.byStatus?.find(s => s._id === 'pending_approval')?.count || 0, icon: Clock, bgColor: '#FEF3C7', iconColor: '#D97706' },
    { label: 'Approved', value: stats.byStatus?.find(s => s._id === 'approved')?.count || 0, icon: CheckCircle, bgColor: '#D1FAE5', iconColor: '#059669' },
    { label: 'Pending Handover', value: stats.pendingHandover || 0, icon: Briefcase, bgColor: '#FFEDD5', iconColor: '#EA580C' },
  ]

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', margin: 0 }}>Approvals</h1>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>Review and approve master agreements</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {statCards.map((stat, index) => (
          <div key={index} style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                padding: '12px',
                background: stat.bgColor,
                borderRadius: '12px',
              }}>
                <stat.icon size={22} style={{ color: stat.iconColor }} />
              </div>
              <div>
                <p style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveView('pending')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '500',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            background: activeView === 'pending' ? '#EC4899' : '#F3F4F6',
            color: activeView === 'pending' ? '#ffffff' : '#6B7280',
          }}
        >
          My Pending ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveView('all')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '500',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            background: activeView === 'all' ? '#EC4899' : '#F3F4F6',
            color: activeView === 'all' ? '#ffffff' : '#6B7280',
          }}
        >
          All Agreements
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #FCE7F3',
            borderTopColor: '#EC4899',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : activeView === 'pending' ? (
        pendingItems.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            border: '1px solid #E5E7EB',
          }}>
            <CheckCircle size={56} style={{ color: '#A7F3D0', margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: 0 }}>All caught up!</h3>
            <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '8px 0 0 0' }}>You have no pending approval items</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingItems.map((item) => (
              <PendingApprovalItem
                key={`${item.agreementId}-${item.itemId}`}
                item={item}
                onApprove={handleApproveFromList}
                onReject={handleRejectFromList}
              />
            ))}
          </div>
        )
      ) : agreements.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '48px',
          textAlign: 'center',
          border: '1px solid #E5E7EB',
        }}>
          <FileText size={56} style={{ color: '#D1D5DB', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: 0 }}>No agreements yet</h3>
          <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '8px 0 0 0' }}>Master agreements will appear here once created</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {agreements.map((agreement) => (
            <AgreementCard
              key={agreement._id}
              agreement={agreement}
              onView={handleView}
              onApprove={handleView}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AgreementDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedAgreement(null)
        }}
        agreement={selectedAgreement}
        onRefresh={fetchData}
      />
    </div>
  )
}
