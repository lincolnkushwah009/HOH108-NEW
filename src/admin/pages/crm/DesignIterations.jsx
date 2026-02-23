import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Palette, Plus, ArrowLeft, Eye, MessageSquare, Check, X,
  Clock, FileImage, Download, Upload, AlertCircle,
  Send, History, File, Layers
} from 'lucide-react'
import { designIterationsAPI, salesOrdersAPI } from '../../utils/api'

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: '#F3F4F6', color: '#374151' },
  submitted: { label: 'Submitted', bg: '#DBEAFE', color: '#1E40AF' },
  under_review: { label: 'Under Review', bg: '#FEF3C7', color: '#92400E' },
  revision_requested: { label: 'Revision Requested', bg: '#FFEDD5', color: '#C2410C' },
  approved: { label: 'Approved', bg: '#D1FAE5', color: '#065F46' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', color: '#991B1B' },
}

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: config.bg,
      color: config.color,
    }}>
      {config.label}
    </span>
  )
}

const IterationCard = ({ iteration, onClick }) => {
  const latestVersion = iteration.versions?.[iteration.versions.length - 1]

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.3s, transform 0.3s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Preview Image */}
      <div style={{
        height: '160px',
        background: 'linear-gradient(135deg, #E0F2FE 0%, #F3E8FF 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {latestVersion?.files?.[0]?.url ? (
          <img
            src={latestVersion.files[0].url}
            alt={iteration.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Palette size={48} style={{ color: '#D1D5DB' }} />
        )}
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <StatusBadge status={iteration.status} />
        </div>
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: '#FFFFFF',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
        }}>
          v{iteration.currentVersion || 1}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <h3 style={{
          fontWeight: '600',
          color: '#1F2937',
          marginBottom: '4px',
          fontSize: '15px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {iteration.title}
        </h3>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
          {iteration.salesOrder?.orderNumber || 'No Order'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
            <Layers size={14} />
            <span>{iteration.versions?.length || 0} versions</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
            <MessageSquare size={14} />
            <span>{iteration.feedback?.length || 0}</span>
          </div>
        </div>

        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              backgroundColor: '#E0F2FE',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#0891B2' }}>
                {iteration.designer?.name?.charAt(0) || 'D'}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              {iteration.designer?.name || 'Unassigned'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

const CreateIterationModal = ({ isOpen, onClose, onSubmit, salesOrders }) => {
  const [formData, setFormData] = useState({
    title: '',
    salesOrderId: '',
    description: '',
    designType: 'interior',
    room: '',
  })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
    setFormData({ title: '', salesOrderId: '', description: '', designType: 'interior', room: '' })
    onClose()
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
          color: '#FFFFFF',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Palette size={24} />
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Create Design Iteration</h2>
                <p style={{ fontSize: '14px', color: '#A5F3FC', margin: '4px 0 0 0' }}>
                  Add a new design for client review
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={20} style={{ color: '#FFFFFF' }} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Sales Order *
            </label>
            <select
              value={formData.salesOrderId}
              onChange={(e) => setFormData({ ...formData, salesOrderId: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer', backgroundColor: '#FFFFFF' }}
              required
            >
              <option value="">Select a sales order...</option>
              {salesOrders.map(order => (
                <option key={order._id} value={order._id}>
                  {order.orderNumber} - {order.lead?.name || 'Unknown Client'}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Design Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={inputStyle}
              placeholder="e.g., Living Room Design - Modern Contemporary"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Design Type
              </label>
              <select
                value={formData.designType}
                onChange={(e) => setFormData({ ...formData, designType: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer', backgroundColor: '#FFFFFF' }}
              >
                <option value="interior">Interior Design</option>
                <option value="modular">Modular Kitchen</option>
                <option value="wardrobe">Wardrobe Design</option>
                <option value="bathroom">Bathroom Design</option>
                <option value="full_home">Full Home Design</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Room/Area
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Master Bedroom"
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              placeholder="Design requirements and client preferences..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                backgroundColor: '#06B6D4',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Create Design
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const IterationDetailModal = ({ isOpen, onClose, iteration, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('versions')
  const [newFeedback, setNewFeedback] = useState('')

  if (!isOpen || !iteration) return null

  const handleAddFeedback = async () => {
    if (!newFeedback.trim()) return
    try {
      await designIterationsAPI.addFeedback(iteration._id, {
        comment: newFeedback,
        type: 'comment'
      })
      setNewFeedback('')
      onUpdate()
    } catch (error) {
      console.error('Error adding feedback:', error)
    }
  }

  const handleStatusUpdate = async (action) => {
    try {
      if (action === 'submit') {
        await designIterationsAPI.submit(iteration._id)
      } else if (action === 'approve') {
        await designIterationsAPI.approve(iteration._id, { notes: 'Design approved' })
      } else if (action === 'request_revision') {
        await designIterationsAPI.requestRevision(iteration._id, { feedback: 'Please make revisions' })
      }
      onUpdate()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const latestVersion = iteration.versions?.[iteration.versions.length - 1]
  const tabs = [
    { id: 'versions', label: 'Versions', icon: Layers },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
          color: '#FFFFFF',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>{iteration.title}</h2>
              <p style={{ fontSize: '14px', color: '#A5F3FC', margin: '8px 0 0 0' }}>
                {iteration.salesOrder?.orderNumber} • v{iteration.currentVersion || 1}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StatusBadge status={iteration.status} />
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <X size={20} style={{ color: '#FFFFFF' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', padding: '0 24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === tab.id ? '#0891B2' : '#6B7280',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #06B6D4' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {activeTab === 'versions' && (
            <div>
              {/* Latest Version Preview */}
              <div style={{
                backgroundColor: '#F9FAFB',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
              }}>
                <h3 style={{ fontWeight: '600', color: '#1F2937', margin: '0 0 16px 0' }}>
                  Current Version (v{iteration.currentVersion || 1})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {latestVersion?.files?.length > 0 ? (
                    latestVersion.files.map((file, idx) => (
                      <div key={idx} style={{
                        aspectRatio: '16/9',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E5E7EB',
                        overflow: 'hidden',
                        position: 'relative',
                      }}>
                        {file.fileType?.startsWith('image/') ? (
                          <img src={file.url} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <File size={32} style={{ color: '#9CA3AF' }} />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '48px 0', color: '#6B7280' }}>
                      <FileImage size={48} style={{ margin: '0 auto 12px', color: '#D1D5DB' }} />
                      <p style={{ margin: 0 }}>No files uploaded yet</p>
                    </div>
                  )}
                </div>

                <button
                  style={{
                    marginTop: '16px',
                    width: '100%',
                    padding: '12px',
                    border: '2px dashed #D1D5DB',
                    backgroundColor: 'transparent',
                    borderRadius: '10px',
                    color: '#6B7280',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Upload size={18} />
                  Upload New Files
                </button>
              </div>

              {/* Version History */}
              {iteration.versions?.length > 1 && (
                <div>
                  <h3 style={{ fontWeight: '600', color: '#1F2937', margin: '0 0 16px 0' }}>Version History</h3>
                  {iteration.versions.slice().reverse().slice(1).map((version, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '10px',
                      marginBottom: '12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          backgroundColor: '#E5E7EB',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Palette size={20} style={{ color: '#6B7280' }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: '500', color: '#1F2937', margin: 0 }}>Version {version.versionNumber}</p>
                          <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
                            {new Date(version.createdAt).toLocaleDateString()} • {version.files?.length || 0} files
                          </p>
                        </div>
                      </div>
                      <button style={{
                        color: '#0891B2',
                        background: 'none',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}>
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              {/* Add Feedback */}
              <div style={{
                backgroundColor: '#F9FAFB',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}>
                <textarea
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Add feedback or comments..."
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    onClick={handleAddFeedback}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      backgroundColor: '#06B6D4',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={16} />
                    Send Feedback
                  </button>
                </div>
              </div>

              {/* Feedback List */}
              {iteration.feedback?.length > 0 ? (
                iteration.feedback.map((fb, idx) => (
                  <div key={idx} style={{
                    padding: '16px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#E0F2FE',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#0891B2' }}>
                          {fb.givenBy?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontWeight: '500', color: '#1F2937', margin: 0 }}>{fb.givenBy?.name || 'User'}</p>
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '14px', color: '#4B5563', margin: '8px 0 0 0' }}>{fb.comment}</p>
                        {fb.type === 'revision_request' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '8px',
                            padding: '4px 10px',
                            backgroundColor: '#FFEDD5',
                            color: '#C2410C',
                            borderRadius: '6px',
                            fontSize: '12px',
                          }}>
                            <AlertCircle size={12} />
                            Revision Requested
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280' }}>
                  <MessageSquare size={48} style={{ margin: '0 auto 12px', color: '#D1D5DB' }} />
                  <p style={{ margin: 0 }}>No feedback yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {iteration.statusHistory?.map((history, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '12px',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: '#E5E7EB',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Clock size={16} style={{ color: '#6B7280' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: '#1F2937', margin: 0 }}>
                      Status changed to <span style={{ fontWeight: '600' }}>{STATUS_CONFIG[history.status]?.label}</span>
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
                      {new Date(history.changedAt).toLocaleString()} • by {history.changedBy?.name || 'System'}
                    </p>
                    {history.notes && (
                      <p style={{ fontSize: '14px', color: '#4B5563', margin: '8px 0 0 0', fontStyle: 'italic' }}>
                        "{history.notes}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          display: 'flex',
          gap: '12px',
        }}>
          {iteration.status === 'draft' && (
            <button
              onClick={() => handleStatusUpdate('submit')}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Send size={18} />
              Submit for Review
            </button>
          )}
          {(iteration.status === 'submitted' || iteration.status === 'under_review') && (
            <>
              <button
                onClick={() => handleStatusUpdate('approve')}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Check size={18} />
                Approve Design
              </button>
              <button
                onClick={() => handleStatusUpdate('request_revision')}
                style={{
                  flex: 1,
                  padding: '14px',
                  backgroundColor: '#F97316',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={18} />
                Request Revision
              </button>
            </>
          )}
          {iteration.status === 'revision_requested' && (
            <button
              onClick={() => handleStatusUpdate('submit')}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Send size={18} />
              Resubmit for Review
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DesignIterations() {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [iterations, setIterations] = useState([])
  const [salesOrders, setSalesOrders] = useState([])
  const [selectedIteration, setSelectedIteration] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    designType: '',
  })

  useEffect(() => {
    fetchIterations()
    fetchSalesOrders()
  }, [filters])

  const fetchIterations = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.designType) params.designType = filters.designType

      const response = await designIterationsAPI.getAll(params)
      setIterations(response.data?.iterations || response.data || [])
    } catch (error) {
      console.error('Error fetching iterations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSalesOrders = async () => {
    try {
      const response = await salesOrdersAPI.getAll({ status: 'approved' })
      setSalesOrders(response.data?.orders || response.data || [])
    } catch (error) {
      console.error('Error fetching sales orders:', error)
    }
  }

  const handleCreateIteration = async (formData) => {
    try {
      await designIterationsAPI.create(formData)
      fetchIterations()
    } catch (error) {
      console.error('Error creating iteration:', error)
    }
  }

  const stats = {
    total: iterations.length,
    draft: iterations.filter(i => i.status === 'draft').length,
    inReview: iterations.filter(i => ['submitted', 'under_review'].includes(i.status)).length,
    approved: iterations.filter(i => i.status === 'approved').length,
    revisions: iterations.filter(i => i.status === 'revision_requested').length,
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '256px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #A5F3FC',
          borderTopColor: '#06B6D4',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/admin/crm"
            style={{
              padding: '10px',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#374151',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: 0 }}>Design Iterations</h1>
            <p style={{ color: '#6B7280', margin: '8px 0 0 0' }}>Manage design versions and client approvals</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 20px',
            backgroundColor: '#06B6D4',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
          }}
        >
          <Plus size={18} />
          New Design
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 8px 0' }}>Total Designs</p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#1F2937', margin: 0 }}>{stats.total}</p>
        </div>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 8px 0' }}>In Draft</p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#374151', margin: 0 }}>{stats.draft}</p>
        </div>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontSize: '14px', color: '#F59E0B', margin: '0 0 8px 0' }}>In Review</p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#F59E0B', margin: 0 }}>{stats.inReview}</p>
        </div>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontSize: '14px', color: '#22C55E', margin: '0 0 8px 0' }}>Approved</p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#22C55E', margin: 0 }}>{stats.approved}</p>
        </div>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontSize: '14px', color: '#F97316', margin: '0 0 8px 0' }}>Revisions</p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#F97316', margin: 0 }}>{stats.revisions}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        marginBottom: '24px',
      }}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={{
            padding: '12px 16px',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            minWidth: '160px',
          }}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="revision_requested">Revision Requested</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filters.designType}
          onChange={(e) => setFilters({ ...filters, designType: e.target.value })}
          style={{
            padding: '12px 16px',
            border: '1px solid #E5E7EB',
            borderRadius: '10px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            minWidth: '160px',
          }}
        >
          <option value="">All Types</option>
          <option value="interior">Interior Design</option>
          <option value="modular">Modular Kitchen</option>
          <option value="wardrobe">Wardrobe Design</option>
          <option value="bathroom">Bathroom Design</option>
          <option value="full_home">Full Home Design</option>
        </select>
      </div>

      {/* Iterations Grid */}
      {iterations.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}>
          {iterations.map(iteration => (
            <IterationCard
              key={iteration._id}
              iteration={iteration}
              onClick={() => setSelectedIteration(iteration)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '64px',
          textAlign: 'center',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#F9FAFB',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}>
            <Palette size={36} style={{ color: '#D1D5DB' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
            No Design Iterations
          </h3>
          <p style={{ color: '#6B7280', margin: '0 0 24px 0' }}>
            Create your first design iteration to get started
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#06B6D4',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Create Design
          </button>
        </div>
      )}

      {/* Responsive Grid Styles */}
      <style>{`
        @media (max-width: 1200px) {
          div[style*="gridTemplateColumns: 'repeat(4, 1fr)'"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          div[style*="gridTemplateColumns: 'repeat(5, 1fr)'"] {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 900px) {
          div[style*="gridTemplateColumns: 'repeat(4, 1fr)'"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          div[style*="gridTemplateColumns: 'repeat(5, 1fr)'"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          div[style*="gridTemplateColumns: 'repeat(4, 1fr)'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Modals */}
      <CreateIterationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateIteration}
        salesOrders={salesOrders}
      />

      <IterationDetailModal
        isOpen={!!selectedIteration}
        onClose={() => setSelectedIteration(null)}
        iteration={selectedIteration}
        onUpdate={() => {
          fetchIterations()
          setSelectedIteration(null)
        }}
      />
    </div>
  )
}
