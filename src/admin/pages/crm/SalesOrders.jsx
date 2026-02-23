import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText, Plus, Search, MoreVertical, Eye, Edit,
  CheckCircle, XCircle, Clock, IndianRupee, User, Calendar,
  Package, Send, Award, X
} from 'lucide-react'
import { salesOrdersAPI, leadsAPI } from '../../utils/api'

const STATUS_CONFIG = {
  draft: { label: 'Draft', bg: '#F3F4F6', color: '#374151', icon: FileText },
  pending_review: { label: 'Pending Review', bg: '#FEF3C7', color: '#92400E', icon: Clock },
  submitted: { label: 'Submitted', bg: '#DBEAFE', color: '#1E40AF', icon: Send },
  approved: { label: 'Approved', bg: '#D1FAE5', color: '#065F46', icon: CheckCircle },
  project_created: { label: 'Project Created', bg: '#F5EDE6', color: '#8B7355', icon: Award },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', icon: XCircle },
}

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  const Icon = config.icon

  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: config.bg,
      color: config.color,
    }}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

const SalesOrderCard = ({ order, onView, onEdit, onSubmit, onCancel }) => {
  const [showActions, setShowActions] = useState(false)

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #F3F4F6',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '4px' }}>{order.salesOrderId}</p>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
              {order.title || 'Untitled Order'}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={order.status} />
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowActions(!showActions)}
                style={{
                  padding: '6px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <MoreVertical size={16} style={{ color: '#9CA3AF' }} />
              </button>
              {showActions && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '32px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                  border: '1px solid #E5E7EB',
                  padding: '6px 0',
                  zIndex: 10,
                  minWidth: '160px',
                }}>
                  <button
                    onClick={() => { onView(order); setShowActions(false) }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      textAlign: 'left',
                      fontSize: '14px',
                      color: '#374151',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Eye size={14} /> View Details
                  </button>
                  {order.status === 'draft' && (
                    <>
                      <button
                        onClick={() => { onEdit(order); setShowActions(false) }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontSize: '14px',
                          color: '#374151',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => { onSubmit(order); setShowActions(false) }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          textAlign: 'left',
                          fontSize: '14px',
                          color: '#2563EB',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Send size={14} /> Submit for Review
                      </button>
                    </>
                  )}
                  {!['project_created', 'cancelled'].includes(order.status) && (
                    <button
                      onClick={() => { onCancel(order); setShowActions(false) }}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: '14px',
                        color: '#DC2626',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Lead/Customer Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '12px' }}>
          <User size={14} style={{ color: '#9CA3AF' }} />
          <Link
            to={`/admin/leads/${order.lead?._id}`}
            style={{ color: '#374151', textDecoration: 'none' }}
            onMouseOver={(e) => e.currentTarget.style.color = '#2563EB'}
            onMouseOut={(e) => e.currentTarget.style.color = '#374151'}
          >
            {order.lead?.name || 'Unknown'}
          </Link>
          <span style={{ color: '#D1D5DB' }}>•</span>
          <span style={{ color: '#6B7280' }}>{order.lead?.phone}</span>
        </div>

        {/* Amount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <IndianRupee size={14} style={{ color: '#9CA3AF' }} />
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#1F2937' }}>
            {formatCurrency(order.costEstimation?.finalAmount)}
          </span>
          {order.costEstimation?.isTentative && (
            <span style={{
              fontSize: '11px',
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              padding: '2px 8px',
              borderRadius: '4px',
            }}>
              Tentative
            </span>
          )}
        </div>

        {/* BOQ/BOM Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6B7280', marginBottom: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Package size={14} />
            {order.boq?.length || 0} BOQ Items
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Package size={14} />
            {order.bom?.length || 0} BOM Items
          </span>
        </div>

        {/* Sales Person */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280' }}>
          <Calendar size={14} />
          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          <span style={{ color: '#D1D5DB' }}>•</span>
          <span>{order.salesPersonName || 'Unknown'}</span>
        </div>
      </div>

      {/* Footer */}
      {order.project && (
        <div style={{
          backgroundColor: '#FDF8F4',
          padding: '12px 16px',
          borderTop: '1px solid #F5EDE6',
        }}>
          <Link
            to={`/admin/projects/${order.project._id}`}
            style={{
              fontSize: '13px',
              color: '#8B7355',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Award size={14} />
            Project: {order.project.projectId}
          </Link>
        </div>
      )}
    </div>
  )
}

const CreateOrderModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [leads, setLeads] = useState([])
  const [selectedLead, setSelectedLead] = useState(null)
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    projectScope: {
      description: '',
      areas: [],
      estimatedDuration: '',
    },
  })

  // Load qualified leads when modal opens
  useEffect(() => {
    if (isOpen) {
      loadQualifiedLeads()
    }
  }, [isOpen])

  const loadQualifiedLeads = async () => {
    setLoadingLeads(true)
    try {
      const response = await leadsAPI.getAll({
        status: 'qualified',
        limit: 20,
      })
      setLeads(response.data || [])
    } catch (error) {
      console.error('Error loading qualified leads:', error)
    } finally {
      setLoadingLeads(false)
    }
  }

  const searchLeads = async () => {
    if (!searchQuery.trim()) {
      loadQualifiedLeads()
      return
    }
    setLoadingLeads(true)
    try {
      const response = await leadsAPI.getAll({
        search: searchQuery,
        status: 'qualified',
        limit: 10,
      })
      setLeads(response.data || [])
    } catch (error) {
      console.error('Error searching leads:', error)
    } finally {
      setLoadingLeads(false)
    }
  }

  const handleCreate = async () => {
    if (!selectedLead) return
    setLoading(true)
    try {
      await salesOrdersAPI.create({
        leadId: selectedLead._id,
        title: formData.title || `Sales Order - ${selectedLead.name}`,
        projectScope: formData.projectScope,
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating sales order:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

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
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          color: '#FFFFFF',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={24} />
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Create Sales Order</h2>
                <p style={{ fontSize: '14px', color: '#FED7AA', margin: '4px 0 0 0' }}>
                  {step === 1 ? 'Select a qualified lead' : 'Enter order details'}
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
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} style={{ color: '#FFFFFF' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
          {step === 1 && (
            <div>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                }} />
                <input
                  type="text"
                  placeholder="Search qualified leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLeads()}
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    paddingRight: '16px',
                    paddingTop: '14px',
                    paddingBottom: '14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                onClick={searchLeads}
                disabled={loadingLeads}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  marginBottom: '16px',
                }}
              >
                {loadingLeads ? 'Searching...' : 'Search'}
              </button>

              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {leads.map((lead) => (
                  <button
                    key={lead._id}
                    onClick={() => setSelectedLead(lead)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      textAlign: 'left',
                      border: selectedLead?._id === lead._id ? '2px solid #F97316' : '1px solid #E5E7EB',
                      borderRadius: '12px',
                      backgroundColor: selectedLead?._id === lead._id ? '#FFF7ED' : '#FFFFFF',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontWeight: '600', color: '#1F2937', margin: 0 }}>{lead.name}</p>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>
                          {lead.phone} • {lead.leadId}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: '#D1FAE5',
                        color: '#065F46',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                      }}>
                        Qualified
                      </span>
                    </div>
                  </button>
                ))}
                {leads.length === 0 && searchQuery && !loadingLeads && (
                  <p style={{ textAlign: 'center', color: '#6B7280', padding: '32px 0' }}>
                    No qualified leads found. Only qualified leads can have sales orders.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              {/* Selected Lead */}
              <div style={{
                backgroundColor: '#FFF7ED',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <p style={{ fontSize: '13px', color: '#EA580C', margin: '0 0 4px 0' }}>Selected Lead</p>
                <p style={{ fontWeight: '600', color: '#1F2937', margin: 0 }}>{selectedLead?.name}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>{selectedLead?.phone}</p>
              </div>

              {/* Order Title */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Order Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={`Sales Order - ${selectedLead?.name}`}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Project Scope */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Project Scope
                </label>
                <textarea
                  value={formData.projectScope.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    projectScope: { ...formData.projectScope, description: e.target.value }
                  })}
                  placeholder="Describe the project scope..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Estimated Duration */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Estimated Duration
                </label>
                <input
                  type="text"
                  value={formData.projectScope.estimatedDuration}
                  onChange={(e) => setFormData({
                    ...formData,
                    projectScope: { ...formData.projectScope, estimatedDuration: e.target.value }
                  })}
                  placeholder="e.g., 3 months"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #E5E7EB',
          padding: '16px 24px',
          display: 'flex',
          gap: '12px',
        }}>
          <button
            onClick={() => {
              if (step === 2) setStep(1)
              else onClose()
            }}
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
            {step === 2 ? 'Back' : 'Cancel'}
          </button>
          {step === 1 && selectedLead && (
            <button
              onClick={() => setStep(2)}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                backgroundColor: '#F97316',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Continue
            </button>
          )}
          {step === 2 && (
            <button
              onClick={handleCreate}
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                backgroundColor: loading ? '#FDBA74' : '#F97316',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const OrderDetailModal = ({ isOpen, onClose, order, onRefresh, initialEditMode = false }) => {
  const [activeTab, setActiveTab] = useState('details')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(initialEditMode)
  const [editData, setEditData] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    if (order && initialEditMode) {
      setIsEditing(true)
      setEditData({
        title: order.title || '',
        projectScope: {
          description: order.projectScope?.description || '',
          areas: order.projectScope?.areas || [],
          estimatedDuration: order.projectScope?.estimatedDuration || '',
        },
        costEstimation: {
          materialCost: order.costEstimation?.materialCost || 0,
          laborCost: order.costEstimation?.laborCost || 0,
          profitMargin: order.costEstimation?.profitMargin || 0,
        },
        terms: order.terms || '',
        specialConditions: order.specialConditions || '',
        discountApplied: order.discountApplied || 0,
      })
    } else {
      setIsEditing(false)
    }
  }, [order, initialEditMode])

  if (!isOpen || !order) return null

  const handleStartEdit = () => {
    setEditData({
      title: order.title || '',
      projectScope: {
        description: order.projectScope?.description || '',
        areas: order.projectScope?.areas || [],
        estimatedDuration: order.projectScope?.estimatedDuration || '',
      },
      costEstimation: {
        materialCost: order.costEstimation?.materialCost || 0,
        laborCost: order.costEstimation?.laborCost || 0,
        profitMargin: order.costEstimation?.profitMargin || 0,
      },
      terms: order.terms || '',
      specialConditions: order.specialConditions || '',
      discountApplied: order.discountApplied || 0,
    })
    setIsEditing(true)
    setActiveTab('details')
  }

  const handleSaveEdit = async () => {
    setLoading(true)
    try {
      await salesOrdersAPI.update(order._id, editData)
      setIsEditing(false)
      onRefresh?.()
      onClose()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleSubmit = async () => {
    if (!confirm('Submit this order for review?')) return
    setLoading(true)
    try {
      await salesOrdersAPI.submit(order._id)
      onRefresh?.()
      onClose()
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseAsWon = async () => {
    if (!confirm('Close this order as won? This will create a project.')) return
    setLoading(true)
    try {
      const response = await salesOrdersAPI.closeAsWon(order._id, {
        projectTitle: order.title,
      })
      alert('Project created successfully!')
      navigate(`/admin/projects/${response.data.project._id}`)
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const tabs = ['details', 'boq', 'bom', 'negotiations']

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
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          color: '#FFFFFF',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#FED7AA', margin: 0 }}>{order.salesOrderId}</p>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '4px 0 0 0' }}>
                {order.title || 'Sales Order'}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StatusBadge status={order.status} />
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} style={{ color: '#FFFFFF' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
          <div style={{ display: 'flex', padding: '0 24px' }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '16px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === tab ? '#F97316' : '#6B7280',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #F97316' : '2px solid transparent',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 280px)' }}>
          {activeTab === 'details' && (
            <div>
              {/* Order Title (edit mode) */}
              {isEditing && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Order Title
                  </label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Lead Info */}
              <div style={{
                backgroundColor: '#F9FAFB',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}>
                <h3 style={{ fontWeight: '600', color: '#1F2937', margin: '0 0 16px 0' }}>Lead Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Name</p>
                    <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>{order.lead?.name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Phone</p>
                    <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>{order.lead?.phone}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Lead ID</p>
                    <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>{order.lead?.leadId}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Sales Person</p>
                    <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>{order.salesPersonName}</p>
                  </div>
                </div>
              </div>

              {/* Cost Estimation */}
              <div style={{
                backgroundColor: isEditing ? '#FFFBEB' : '#F0FDF4',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}>
                <h3 style={{ fontWeight: '600', color: '#1F2937', margin: '0 0 16px 0' }}>Cost Estimation</h3>
                {isEditing ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Material Cost</label>
                      <input
                        type="number"
                        value={editData.costEstimation?.materialCost || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          costEstimation: { ...editData.costEstimation, materialCost: Number(e.target.value) }
                        })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Labor Cost</label>
                      <input
                        type="number"
                        value={editData.costEstimation?.laborCost || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          costEstimation: { ...editData.costEstimation, laborCost: Number(e.target.value) }
                        })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Profit Margin (%)</label>
                      <input
                        type="number"
                        value={editData.costEstimation?.profitMargin || ''}
                        onChange={(e) => setEditData({
                          ...editData,
                          costEstimation: { ...editData.costEstimation, profitMargin: Number(e.target.value) }
                        })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Discount (%)</label>
                      <input
                        type="number"
                        value={editData.discountApplied || ''}
                        onChange={(e) => setEditData({ ...editData, discountApplied: Number(e.target.value) })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Material Cost</p>
                    <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>
                      {formatCurrency(order.costEstimation?.materialCost)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Labor Cost</p>
                    <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>
                      {formatCurrency(order.costEstimation?.laborCost)}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Profit Margin</p>
                    <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>
                      {order.costEstimation?.profitMargin || 0}%
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>GST</p>
                    <p style={{ fontWeight: '500', color: '#1F2937', margin: '4px 0 0 0' }}>
                      {formatCurrency(order.costEstimation?.gstAmount)}
                    </p>
                  </div>
                  <div style={{ gridColumn: 'span 2', paddingTop: '16px', borderTop: '1px solid #BBF7D0' }}>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Final Amount</p>
                    <p style={{ fontSize: '28px', fontWeight: '700', color: '#059669', margin: '4px 0 0 0' }}>
                      {formatCurrency(order.costEstimation?.finalAmount)}
                    </p>
                    {order.costEstimation?.isTentative && (
                      <p style={{ fontSize: '12px', color: '#D97706', margin: '8px 0 0 0' }}>
                        * This is a tentative estimate
                      </p>
                    )}
                  </div>
                </div>
                )}
              </div>

              {/* Project Scope */}
              {isEditing ? (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontWeight: '600', color: '#1F2937', margin: '0 0 12px 0' }}>Project Scope</h3>
                  <textarea
                    value={editData.projectScope?.description || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      projectScope: { ...editData.projectScope, description: e.target.value }
                    })}
                    placeholder="Describe the project scope..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      marginBottom: '12px',
                    }}
                  />
                  <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Estimated Duration</label>
                  <input
                    type="text"
                    value={editData.projectScope?.estimatedDuration || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      projectScope: { ...editData.projectScope, estimatedDuration: e.target.value }
                    })}
                    placeholder="e.g., 3 months"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: '12px',
                    }}
                  />
                  <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Terms & Conditions</label>
                  <textarea
                    value={editData.terms || ''}
                    onChange={(e) => setEditData({ ...editData, terms: e.target.value })}
                    placeholder="Enter terms and conditions..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      marginBottom: '12px',
                    }}
                  />
                  <label style={{ display: 'block', fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>Special Conditions</label>
                  <textarea
                    value={editData.specialConditions || ''}
                    onChange={(e) => setEditData({ ...editData, specialConditions: e.target.value })}
                    placeholder="Enter special conditions..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              ) : order.projectScope?.description ? (
                <div>
                  <h3 style={{ fontWeight: '600', color: '#1F2937', margin: '0 0 12px 0' }}>Project Scope</h3>
                  <p style={{ color: '#4B5563', margin: 0, lineHeight: '1.6' }}>{order.projectScope.description}</p>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'boq' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: '600', color: '#1F2937', margin: 0 }}>Bill of Quantities</h3>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{order.boq?.length || 0} items</span>
              </div>
              {order.boq?.length > 0 ? (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#4B5563' }}>Item</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#4B5563' }}>Qty</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#4B5563' }}>Unit</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#4B5563' }}>Rate</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#4B5563' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.boq.map((item, index) => (
                        <tr key={index} style={{ borderTop: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <p style={{ fontWeight: '500', margin: 0 }}>{item.description}</p>
                            <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>{item.itemCode}</p>
                          </td>
                          <td style={{ padding: '12px 16px' }}>{item.quantity}</td>
                          <td style={{ padding: '12px 16px' }}>{item.unit}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(item.unitRate)}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500' }}>{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#6B7280', padding: '48px 0' }}>No BOQ items added yet</p>
              )}
            </div>
          )}

          {activeTab === 'bom' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: '600', color: '#1F2937', margin: 0 }}>Bill of Materials</h3>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>{order.bom?.length || 0} items</span>
              </div>
              {order.bom?.length > 0 ? (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F9FAFB' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#4B5563' }}>Material</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#4B5563' }}>Category</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#4B5563' }}>Qty</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '500', color: '#4B5563' }}>Vendor</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '500', color: '#4B5563' }}>Est. Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.bom.map((item, index) => (
                        <tr key={index} style={{ borderTop: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <p style={{ fontWeight: '500', margin: 0 }}>{item.description}</p>
                            <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>{item.materialCode}</p>
                          </td>
                          <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{item.category}</td>
                          <td style={{ padding: '12px 16px' }}>{item.quantity} {item.unit}</td>
                          <td style={{ padding: '12px 16px' }}>{item.vendor || '-'}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(item.estimatedRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#6B7280', padding: '48px 0' }}>No BOM items added yet</p>
              )}
            </div>
          )}

          {activeTab === 'negotiations' && (
            <div>
              <h3 style={{ fontWeight: '600', color: '#1F2937', margin: '0 0 16px 0' }}>Negotiation History</h3>
              {order.negotiations?.length > 0 ? (
                <div>
                  {order.negotiations.map((neg, index) => (
                    <div key={index} style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>Round {neg.round}</span>
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                          {new Date(neg.negotiatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#4B5563', margin: 0 }}>{neg.clientRequests}</p>
                      {neg.revisedAmount && (
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#059669', margin: '12px 0 0 0' }}>
                          Revised: {formatCurrency(neg.revisedAmount)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#6B7280', padding: '48px 0' }}>No negotiations recorded yet</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #E5E7EB',
          padding: '16px 24px',
          display: 'flex',
          gap: '12px',
        }}>
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
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
                onClick={handleSaveEdit}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  border: 'none',
                  backgroundColor: loading ? '#FDBA74' : '#F97316',
                  color: '#FFFFFF',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
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
                Close
              </button>
              {order.status === 'draft' && (
                <>
                  <button
                    onClick={handleStartEdit}
                    style={{
                      flex: 1,
                      padding: '14px',
                      border: 'none',
                      backgroundColor: '#F97316',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Edit Order
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '14px',
                      border: 'none',
                      backgroundColor: loading ? '#93C5FD' : '#3B82F6',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </>
              )}
              {order.status === 'submitted' && (
                <button
                  onClick={handleCloseAsWon}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: 'none',
                    backgroundColor: loading ? '#86EFAC' : '#22C55E',
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Processing...' : 'Close as Won'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SalesOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  })
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    totalValue: 0,
  })

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [filters])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = { ...filters, limit: 50 }
      Object.keys(params).forEach(key => !params[key] && delete params[key])
      const response = await salesOrdersAPI.getAll(params)
      setOrders(response.data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await salesOrdersAPI.getStats()
      setStats(response.data || {})
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleView = async (order) => {
    try {
      const response = await salesOrdersAPI.getOne(order._id)
      setSelectedOrder(response.data)
      setEditMode(false)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Error fetching order details:', error)
    }
  }

  const handleEdit = async (order) => {
    try {
      const response = await salesOrdersAPI.getOne(order._id)
      setSelectedOrder(response.data)
      setEditMode(true)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Error fetching order details:', error)
    }
  }

  const handleSubmit = async (order) => {
    if (!confirm('Submit this order for review?')) return
    try {
      await salesOrdersAPI.submit(order._id)
      fetchOrders()
      fetchStats()
    } catch (error) {
      alert(error.message)
    }
  }

  const handleCancel = async (order) => {
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return
    try {
      await salesOrdersAPI.cancel(order._id, reason)
      fetchOrders()
      fetchStats()
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: 0 }}>Sales Orders</h1>
          <p style={{ color: '#6B7280', margin: '8px 0 0 0' }}>Manage BOQ/BOM and sales orders</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 20px',
            backgroundColor: '#F97316',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
          }}
        >
          <Plus size={18} />
          New Order
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#FFF7ED',
              borderRadius: '12px',
            }}>
              <FileText size={22} style={{ color: '#F97316' }} />
            </div>
            <div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                {stats.totalOrders || 0}
              </p>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>Total Orders</p>
            </div>
          </div>
        </div>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#F3F4F6',
              borderRadius: '12px',
            }}>
              <Clock size={22} style={{ color: '#6B7280' }} />
            </div>
            <div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                {stats.byStatus?.find(s => s._id === 'draft')?.count || 0}
              </p>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>Drafts</p>
            </div>
          </div>
        </div>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#DBEAFE',
              borderRadius: '12px',
            }}>
              <Send size={22} style={{ color: '#2563EB' }} />
            </div>
            <div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                {stats.byStatus?.find(s => s._id === 'submitted')?.count || 0}
              </p>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>Submitted</p>
            </div>
          </div>
        </div>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#D1FAE5',
              borderRadius: '12px',
            }}>
              <IndianRupee size={22} style={{ color: '#059669' }} />
            </div>
            <div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
                {formatCurrency(stats.totalValue)}
              </p>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>Total Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #E5E7EB',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
            }} />
            <input
              type="text"
              placeholder="Search orders..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{
                width: '100%',
                paddingLeft: '44px',
                paddingRight: '16px',
                paddingTop: '12px',
                paddingBottom: '12px',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
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
              minWidth: '150px',
            }}
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '256px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #FED7AA',
            borderTopColor: '#F97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : orders.length === 0 ? (
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
            <FileText size={36} style={{ color: '#D1D5DB' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
            No sales orders yet
          </h3>
          <p style={{ color: '#6B7280', margin: '0 0 24px 0' }}>
            Create your first sales order from a qualified lead
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#F97316',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Create First Order
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {orders.map((order) => (
            <SalesOrderCard
              key={order._id}
              order={order}
              onView={handleView}
              onEdit={handleEdit}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {/* Responsive Grid Styles */}
      <style>{`
        @media (max-width: 1200px) {
          div[style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="gridTemplateColumns: 'repeat(4, 1fr)'"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>

      {/* Modals */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchOrders()
          fetchStats()
        }}
      />

      <OrderDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedOrder(null)
          setEditMode(false)
        }}
        order={selectedOrder}
        initialEditMode={editMode}
        onRefresh={() => {
          fetchOrders()
          fetchStats()
        }}
      />
    </div>
  )
}
