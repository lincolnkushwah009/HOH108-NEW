import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Ticket, ArrowLeft, Clock, User, Calendar, Building2, Tag,
  MessageSquare, Send, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, ArrowUpRight, Edit2, Trash2, MoreVertical,
  ThumbsUp, ThumbsDown, UserPlus, Play, Pause,
  Paperclip, Upload, FileText, Image, File, X, Download
} from 'lucide-react'
import { ticketsAPI, employeesAPI, usersAPI } from '../../utils/api'

const PRIORITY_CONFIG = {
  low: { label: 'Low', bg: '#F3F4F6', color: '#374151', icon: '○' },
  medium: { label: 'Medium', bg: '#DBEAFE', color: '#1D4ED8', icon: '●' },
  high: { label: 'High', bg: '#FFEDD5', color: '#C2410C', icon: '▲' },
  critical: { label: 'Critical', bg: '#FEE2E2', color: '#DC2626', icon: '⚠' },
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: '#F3F4F6', color: '#6B7280', icon: Clock },
  pending_approval: { label: 'Pending Approval', bg: '#FEF3C7', color: '#D97706', icon: Clock },
  open: { label: 'Open', bg: '#DBEAFE', color: '#1D4ED8', icon: Ticket },
  in_progress: { label: 'In Progress', bg: '#E9D5FF', color: '#C59C82', icon: RefreshCw },
  pending_info: { label: 'Pending Info', bg: '#FFEDD5', color: '#C2410C', icon: MessageSquare },
  resolved: { label: 'Resolved', bg: '#D1FAE5', color: '#059669', icon: CheckCircle },
  closed: { label: 'Closed', bg: '#F3F4F6', color: '#6B7280', icon: XCircle },
  reopened: { label: 'Reopened', bg: '#FEE2E2', color: '#DC2626', icon: RefreshCw },
}

const PriorityBadge = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium
  return (
    <span style={{
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: config.bg,
      color: config.color,
    }}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const Icon = config.icon
  return (
    <span style={{
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: config.bg,
      color: config.color,
    }}>
      <Icon size={14} />
      {config.label}
    </span>
  )
}

const ActivityItem = ({ activity }) => {
  const getActivityIcon = (action) => {
    switch (action) {
      case 'created': return Ticket
      case 'submitted': return Send
      case 'approved': return ThumbsUp
      case 'rejected': return ThumbsDown
      case 'assigned': return UserPlus
      case 'resolved': return CheckCircle
      case 'closed': return XCircle
      case 'reopened': return RefreshCw
      case 'escalated': return ArrowUpRight
      case 'comment_added': return MessageSquare
      default: return Clock
    }
  }

  const Icon = getActivityIcon(activity.action)

  return (
    <div style={{ display: 'flex', gap: '12px', padding: '12px 0' }}>
      <div style={{
        padding: '8px',
        background: '#F3F4F6',
        borderRadius: '8px',
        height: 'fit-content',
      }}>
        <Icon size={14} style={{ color: '#6B7280' }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', color: '#1F2937', margin: 0 }}>
          <span style={{ fontWeight: '500' }}>{activity.performedBy?.name || 'System'}</span>
          {' '}{activity.description}
        </p>
        {activity.metadata?.comment && (
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginTop: '4px',
            background: '#F9FAFB',
            padding: '8px',
            borderRadius: '8px',
          }}>
            "{activity.metadata.comment}"
          </p>
        )}
        <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
          {new Date(activity.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  )
}

const CommentItem = ({ comment }) => {
  const isInternal = comment.isInternal
  return (
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      background: isInternal ? '#FEF9C3' : '#F9FAFB',
      border: isInternal ? '1px solid #FDE68A' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: '#DBEAFE',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <User size={14} style={{ color: '#2563EB' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '500', color: '#1F2937' }}>
              {comment.commentByName || comment.commentBy?.name || 'Unknown'}
            </span>
            {isInternal && (
              <span style={{
                padding: '2px 6px',
                background: '#FDE68A',
                color: '#92400E',
                fontSize: '11px',
                borderRadius: '4px',
              }}>Internal</span>
            )}
          </div>
          <p style={{
            fontSize: '14px',
            color: '#4B5563',
            marginTop: '4px',
            whiteSpace: 'pre-wrap',
          }}>{comment.comment}</p>
          <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
            {new Date(comment.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

// Action Modal Component
const ActionModal = ({ isOpen, onClose, title, children, onSubmit, submitLabel, loading, submitColor = 'blue' }) => {
  if (!isOpen) return null

  const colorStyles = {
    blue: { bg: '#3B82F6', hover: '#2563EB' },
    green: { bg: '#22C55E', hover: '#16A34A' },
    red: { bg: '#EF4444', hover: '#DC2626' },
    yellow: { bg: '#F59E0B', hover: '#D97706' },
  }

  const color = colorStyles[submitColor] || colorStyles.blue

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
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F3F4F6',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>{title}</h2>
        </div>
        <div style={{ padding: '24px' }}>
          {children}
        </div>
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #F3F4F6',
          display: 'flex',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #E5E7EB',
              background: '#ffffff',
              color: '#374151',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: loading ? '#9CA3AF' : color.bg,
              color: '#ffffff',
              borderRadius: '12px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// Styles
const cardStyle = {
  background: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #E5E7EB',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '8px',
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #E5E7EB',
  borderRadius: '10px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'none',
  fontFamily: 'inherit',
}

const buttonPrimaryStyle = {
  padding: '10px 20px',
  background: '#3B82F6',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
}

const buttonSecondaryStyle = {
  padding: '10px 20px',
  background: '#ffffff',
  color: '#374151',
  border: '1px solid #E5E7EB',
  borderRadius: '10px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [showEscalateModal, setShowEscalateModal] = useState(false)

  // Modal form data
  const [approveComments, setApproveComments] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [assignNotes, setAssignNotes] = useState('')
  const [resolution, setResolution] = useState('')
  const [closeRating, setCloseRating] = useState(5)
  const [closeFeedback, setCloseFeedback] = useState('')
  const [reopenReason, setReopenReason] = useState('')
  const [escalateReason, setEscalateReason] = useState('')
  const [escalateTo, setEscalateTo] = useState('')

  // File upload states
  const [uploading, setUploading] = useState(false)
  const [fileInputRef] = useState({ current: null })

  useEffect(() => {
    fetchTicket()
    fetchUsers()
  }, [id])

  const fetchTicket = async () => {
    setLoading(true)
    try {
      const response = await ticketsAPI.getOne(id)
      setTicket(response.data)
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll({ limit: 100 })
      setUsers(response.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      await ticketsAPI.addComment(id, {
        comment: newComment,
        isInternal: isInternalComment,
      })
      setNewComment('')
      setIsInternalComment(false)
      fetchTicket()
    } catch (error) {
      console.error('Error adding comment:', error)
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      await ticketsAPI.uploadFiles(id, formData)
      fetchTicket()
      e.target.value = '' // Reset file input
    } catch (error) {
      console.error('Error uploading files:', error)
      alert(error.message || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return

    try {
      await ticketsAPI.deleteAttachment(id, attachmentId)
      fetchTicket()
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert(error.message || 'Failed to delete attachment')
    }
  }

  const getFileIcon = (fileType) => {
    if (!fileType) return File
    if (fileType.startsWith('image/')) return Image
    if (fileType === 'application/pdf' || fileType.includes('document') || fileType.includes('text')) return FileText
    return File
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await ticketsAPI.approve(id, approveComments)
      setShowApproveModal(false)
      setApproveComments('')
      fetchTicket()
    } catch (error) {
      console.error('Error approving ticket:', error)
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    setSubmitting(true)
    try {
      await ticketsAPI.reject(id, rejectReason)
      setShowRejectModal(false)
      setRejectReason('')
      fetchTicket()
    } catch (error) {
      console.error('Error rejecting ticket:', error)
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssign = async () => {
    if (!assignTo) {
      alert('Please select someone to assign')
      return
    }
    setSubmitting(true)
    try {
      await ticketsAPI.assign(id, { assigneeId: assignTo, notes: assignNotes })
      setShowAssignModal(false)
      setAssignTo('')
      setAssignNotes('')
      fetchTicket()
    } catch (error) {
      console.error('Error assigning ticket:', error)
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async () => {
    if (!resolution.trim()) {
      alert('Please provide resolution details')
      return
    }
    setSubmitting(true)
    try {
      await ticketsAPI.resolve(id, resolution)
      setShowResolveModal(false)
      setResolution('')
      fetchTicket()
    } catch (error) {
      console.error('Error resolving ticket:', error)
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async () => {
    setSubmitting(true)
    try {
      await ticketsAPI.close(id, { rating: closeRating, feedback: closeFeedback })
      setShowCloseModal(false)
      setCloseRating(5)
      setCloseFeedback('')
      fetchTicket()
    } catch (error) {
      console.error('Error closing ticket:', error)
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      alert('Please provide a reason for reopening')
      return
    }
    setSubmitting(true)
    try {
      await ticketsAPI.reopen(id, reopenReason)
      setShowReopenModal(false)
      setReopenReason('')
      fetchTicket()
    } catch (error) {
      console.error('Error reopening ticket:', error)
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEscalate = async () => {
    if (!escalateReason.trim()) {
      alert('Please provide a reason for escalation')
      return
    }
    setSubmitting(true)
    try {
      await ticketsAPI.escalate(id, { reason: escalateReason, escalateTo })
      setShowEscalateModal(false)
      setEscalateReason('')
      setEscalateTo('')
      fetchTicket()
    } catch (error) {
      console.error('Error escalating ticket:', error)
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}>
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

  if (!ticket) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Ticket size={48} style={{ color: '#D1D5DB', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#374151', margin: '0 0 16px' }}>
          Ticket not found
        </h2>
        <button
          onClick={() => navigate('/admin/tickets')}
          style={buttonPrimaryStyle}
        >
          Back to Tickets
        </button>
      </div>
    )
  }

  // Don't show SLA breach for resolved/closed tickets
  const isClosedOrResolved = ['resolved', 'closed'].includes(ticket.status)
  const isOverdue = !isClosedOrResolved && (ticket.slaBreached || (ticket.slaDueDate && new Date(ticket.slaDueDate) < new Date()))

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/admin/tickets')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6B7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '16px',
            padding: 0,
            fontSize: '14px',
          }}
        >
          <ArrowLeft size={18} />
          Back to Tickets
        </button>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#9CA3AF',
              }}>{ticket.ticketId}</span>
              {isOverdue && (
                <span style={{
                  padding: '4px 8px',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  fontSize: '12px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <AlertTriangle size={12} />
                  SLA Breached
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
              {ticket.title}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
      }}>
        {/* Main Content Area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: '24px',
        }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Description */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: '0 0 16px' }}>
                Description
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#4B5563',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6',
                margin: 0,
              }}>{ticket.description}</p>
            </div>

            {/* Comments Section */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: '0 0 16px' }}>
                Comments ({ticket.comments?.length || 0})
              </h2>

              {/* Existing Comments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {ticket.comments?.length > 0 ? (
                  ticket.comments.map((comment, idx) => (
                    <CommentItem key={idx} comment={comment} />
                  ))
                ) : (
                  <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '16px 0' }}>No comments yet</p>
                )}
              </div>

              {/* Add Comment */}
              {ticket.status !== 'closed' && (
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        style={{ borderRadius: '4px' }}
                      />
                      <span style={{ color: '#6B7280' }}>Internal note (not visible to requester)</span>
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      style={textareaStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      onClick={handleAddComment}
                      disabled={submitting || !newComment.trim()}
                      style={{
                        ...buttonPrimaryStyle,
                        opacity: (submitting || !newComment.trim()) ? 0.5 : 1,
                        cursor: (submitting || !newComment.trim()) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Send size={16} />
                      {submitting ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Paperclip size={18} />
                  Attachments ({ticket.attachments?.length || 0})
                </h2>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#3B82F6',
                  color: '#ffffff',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: uploading ? 0.6 : 1,
                }}>
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Upload Files'}
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  />
                </label>
              </div>

              {ticket.attachments?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ticket.attachments.map((attachment) => {
                    const FileIcon = getFileIcon(attachment.fileType)
                    const apiBaseUrl = import.meta.env.PROD ? 'https://hoh108.com' : `http://${window.location.hostname}:5001`
                    return (
                      <div
                        key={attachment._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: '#F9FAFB',
                          borderRadius: '8px',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#EEF2FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <FileIcon size={20} style={{ color: '#6366F1' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#1F2937',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}>
                              {attachment.fileName}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6B7280' }}>
                              {formatFileSize(attachment.fileSize)} • Uploaded by {attachment.uploadedByName || 'Unknown'}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <a
                            href={`${apiBaseUrl}${attachment.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              background: '#E5E7EB',
                              color: '#374151',
                              textDecoration: 'none',
                            }}
                            title="Download"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            onClick={() => handleDeleteAttachment(attachment._id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px dashed #E5E7EB',
                }}>
                  <Paperclip size={32} style={{ color: '#9CA3AF', marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                    No attachments yet. Upload files using the button above.
                  </p>
                </div>
              )}
            </div>

            {/* Activity Timeline */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: '0 0 16px' }}>
                Activity
              </h2>
              <div>
                {ticket.activities?.map((activity, idx) => (
                  <div key={idx} style={{ borderBottom: idx < ticket.activities.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <ActivityItem activity={activity} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Actions */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: '0 0 16px' }}>
                Actions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Pending Approval Actions */}
                {ticket.status === 'pending_approval' && (
                  <>
                    <button
                      onClick={() => setShowApproveModal(true)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: '#22C55E',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px',
                      }}
                    >
                      <ThumbsUp size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: '#EF4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px',
                      }}
                    >
                      <ThumbsDown size={16} />
                      Reject
                    </button>
                  </>
                )}

                {/* Open/In Progress Actions */}
                {['open', 'in_progress', 'pending_info', 'reopened'].includes(ticket.status) && (
                  <>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: '#3B82F6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px',
                      }}
                    >
                      <UserPlus size={16} />
                      {ticket.assignedTo ? 'Reassign' : 'Assign'}
                    </button>
                    <button
                      onClick={() => setShowResolveModal(true)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: '#22C55E',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px',
                      }}
                    >
                      <CheckCircle size={16} />
                      Resolve
                    </button>
                    <button
                      onClick={() => setShowEscalateModal(true)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: '#ffffff',
                        color: '#F59E0B',
                        border: '1px solid #F59E0B',
                        borderRadius: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px',
                      }}
                    >
                      <ArrowUpRight size={16} />
                      Escalate
                    </button>
                  </>
                )}

                {/* Resolved Actions */}
                {ticket.status === 'resolved' && (
                  <>
                    <button
                      onClick={() => setShowCloseModal(true)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: '#4B5563',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px',
                      }}
                    >
                      <XCircle size={16} />
                      Close Ticket
                    </button>
                    <button
                      onClick={() => setShowReopenModal(true)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: '#ffffff',
                        color: '#EF4444',
                        border: '1px solid #EF4444',
                        borderRadius: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontSize: '14px',
                      }}
                    >
                      <RefreshCw size={16} />
                      Reopen
                    </button>
                  </>
                )}

                {/* Closed Actions */}
                {ticket.status === 'closed' && (
                  <button
                    onClick={() => setShowReopenModal(true)}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: '#ffffff',
                      color: '#EF4444',
                      border: '1px solid #EF4444',
                      borderRadius: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <RefreshCw size={16} />
                    Reopen
                  </button>
                )}
              </div>
            </div>

            {/* Details */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: '0 0 16px' }}>
                Details
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <User size={18} style={{ color: '#9CA3AF', marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 2px' }}>Requester</p>
                    <p style={{ fontWeight: '500', color: '#1F2937', margin: 0 }}>
                      {ticket.requestedByName || ticket.requestedBy?.name || 'Unknown'}
                    </p>
                  </div>
                </div>

                {ticket.requestedFor && ticket.requestedFor._id !== ticket.requestedBy?._id && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <User size={18} style={{ color: '#9CA3AF', marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 2px' }}>Requested For</p>
                      <p style={{ fontWeight: '500', color: '#1F2937', margin: 0 }}>
                        {ticket.requestedFor.name}
                      </p>
                    </div>
                  </div>
                )}

                {ticket.assignedTo && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <UserPlus size={18} style={{ color: '#9CA3AF', marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 2px' }}>Assigned To</p>
                      <p style={{ fontWeight: '500', color: '#1F2937', margin: 0 }}>
                        {ticket.assignedTo.name}
                      </p>
                    </div>
                  </div>
                )}

                {ticket.department && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Building2 size={18} style={{ color: '#9CA3AF', marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 2px' }}>Department</p>
                      <p style={{ fontWeight: '500', color: '#1F2937', margin: 0 }}>
                        {ticket.department.name}
                      </p>
                    </div>
                  </div>
                )}

                {ticket.category && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Tag size={18} style={{ color: '#9CA3AF', marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 2px' }}>Category</p>
                      <p style={{ fontWeight: '500', color: '#1F2937', margin: 0 }}>
                        {ticket.category.name}
                      </p>
                      {ticket.subCategory && (
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
                          {ticket.subCategory}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Calendar size={18} style={{ color: '#9CA3AF', marginTop: '2px' }} />
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 2px' }}>Created</p>
                    <p style={{ fontWeight: '500', color: '#1F2937', margin: 0 }}>
                      {new Date(ticket.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {ticket.slaDueDate && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Clock size={18} style={{ color: isOverdue ? '#EF4444' : '#9CA3AF', marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 2px' }}>SLA Due</p>
                      <p style={{
                        fontWeight: '500',
                        color: isOverdue ? '#EF4444' : '#1F2937',
                        margin: 0,
                      }}>
                        {new Date(ticket.slaDueDate).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {ticket.satisfactionRating && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <ThumbsUp size={18} style={{ color: '#9CA3AF', marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 2px' }}>Satisfaction</p>
                      <p style={{ fontWeight: '500', color: '#1F2937', margin: 0 }}>
                        {ticket.satisfactionRating}/5
                      </p>
                      {ticket.satisfactionFeedback && (
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>
                          {ticket.satisfactionFeedback}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resolution (if resolved/closed) */}
            {ticket.resolution && (
              <div style={{
                background: '#ECFDF5',
                borderRadius: '16px',
                border: '1px solid #A7F3D0',
                padding: '24px',
              }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#065F46', margin: '0 0 8px' }}>
                  Resolution
                </h2>
                <p style={{
                  color: '#047857',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                  margin: 0,
                }}>{ticket.resolution}</p>
                {ticket.resolvedDate && (
                  <p style={{ fontSize: '13px', color: '#10B981', marginTop: '8px' }}>
                    Resolved on {new Date(ticket.resolvedDate).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ActionModal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Ticket"
        onSubmit={handleApprove}
        submitLabel="Approve"
        loading={submitting}
        submitColor="green"
      >
        <div>
          <label style={labelStyle}>Comments (Optional)</label>
          <textarea
            value={approveComments}
            onChange={(e) => setApproveComments(e.target.value)}
            placeholder="Add any comments..."
            rows={3}
            style={textareaStyle}
          />
        </div>
      </ActionModal>

      <ActionModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Ticket"
        onSubmit={handleReject}
        submitLabel="Reject"
        loading={submitting}
        submitColor="red"
      >
        <div>
          <label style={labelStyle}>Reason for Rejection *</label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason..."
            rows={3}
            style={textareaStyle}
          />
        </div>
      </ActionModal>

      <ActionModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Ticket"
        onSubmit={handleAssign}
        submitLabel="Assign"
        loading={submitting}
        submitColor="blue"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Assign To *</label>
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              style={inputStyle}
            >
              <option value="">Select user...</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notes (Optional)</label>
            <textarea
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Add assignment notes..."
              rows={2}
              style={textareaStyle}
            />
          </div>
        </div>
      </ActionModal>

      <ActionModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title="Resolve Ticket"
        onSubmit={handleResolve}
        submitLabel="Resolve"
        loading={submitting}
        submitColor="green"
      >
        <div>
          <label style={labelStyle}>Resolution Details *</label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Describe how the issue was resolved..."
            rows={4}
            style={textareaStyle}
          />
        </div>
      </ActionModal>

      <ActionModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close Ticket"
        onSubmit={handleClose}
        submitLabel="Close Ticket"
        loading={submitting}
        submitColor="blue"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Satisfaction Rating</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setCloseRating(rating)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    background: closeRating >= rating ? '#FBBF24' : '#F3F4F6',
                    color: closeRating >= rating ? '#ffffff' : '#9CA3AF',
                  }}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Feedback (Optional)</label>
            <textarea
              value={closeFeedback}
              onChange={(e) => setCloseFeedback(e.target.value)}
              placeholder="Any feedback on the resolution?"
              rows={3}
              style={textareaStyle}
            />
          </div>
        </div>
      </ActionModal>

      <ActionModal
        isOpen={showReopenModal}
        onClose={() => setShowReopenModal(false)}
        title="Reopen Ticket"
        onSubmit={handleReopen}
        submitLabel="Reopen"
        loading={submitting}
        submitColor="red"
      >
        <div>
          <label style={labelStyle}>Reason for Reopening *</label>
          <textarea
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="Why does this ticket need to be reopened?"
            rows={3}
            style={textareaStyle}
          />
        </div>
      </ActionModal>

      <ActionModal
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        title="Escalate Ticket"
        onSubmit={handleEscalate}
        submitLabel="Escalate"
        loading={submitting}
        submitColor="yellow"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Escalate To (Optional)</label>
            <select
              value={escalateTo}
              onChange={(e) => setEscalateTo(e.target.value)}
              style={inputStyle}
            >
              <option value="">Auto-select (Manager)</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Reason for Escalation *</label>
            <textarea
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              placeholder="Why does this ticket need escalation?"
              rows={3}
              style={textareaStyle}
            />
          </div>
        </div>
      </ActionModal>
    </div>
  )
}
