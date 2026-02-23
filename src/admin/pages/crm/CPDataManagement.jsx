import { useState, useEffect, useCallback } from 'react'
import {
  FolderTree, Search, ChevronDown, ChevronRight, FileSpreadsheet,
  Users, AlertTriangle, CheckCircle, XCircle, Clock, DollarSign,
  RefreshCw, Eye, Building2, UserCheck, Calendar, Hash, Filter
} from 'lucide-react'
import { apiRequest } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Modal, Input, Select, SearchInput } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYMENT_STATUS = {
  not_applicable: { label: 'N/A', bg: '#f1f5f9', color: '#475569' },
  pending_approval: { label: 'Pending Approval', bg: '#fffbeb', color: '#d97706' },
  approved: { label: 'Approved', bg: '#eff6ff', color: '#2563eb' },
  paid: { label: 'Paid', bg: '#ecfdf5', color: '#059669' },
  rejected: { label: 'Rejected', bg: '#fef2f2', color: '#dc2626' },
}

const VALIDATION_STATUS = {
  processing: { label: 'Processing', bg: '#fffbeb', color: '#d97706' },
  completed: { label: 'Completed', bg: '#ecfdf5', color: '#059669' },
  failed: { label: 'Failed', bg: '#fef2f2', color: '#dc2626' },
}

const LEAD_STATUS_COLORS = {
  new: 'blue',
  contacted: 'teal',
  qualified: 'green',
  unqualified: 'orange',
  proposal: 'purple',
  negotiation: 'indigo',
  won: 'emerald',
  lost: 'red',
  follow_up: 'yellow',
  site_visit: 'cyan',
}

// ─── Helper: Format Date ─────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

// ─── Sub-component: Status Dot ───────────────────────────────────────────────

const StatusDot = ({ color }) => (
  <span style={{
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: color,
    display: 'inline-block',
    flexShrink: 0,
  }} />
)

// ─── Sub-component: Inline Badge ─────────────────────────────────────────────

const InlineBadge = ({ label, bg, color, size = 'sm' }) => {
  const paddings = { xs: '2px 6px', sm: '3px 8px', md: '4px 10px', lg: '5px 14px' }
  const fontSizes = { xs: '9px', sm: '10px', md: '11px', lg: '12px' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: paddings[size],
      borderRadius: '6px',
      fontSize: fontSizes[size],
      fontWeight: '600',
      background: bg,
      color: color,
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>
      {label}
    </span>
  )
}

// ─── Sub-component: Stat Mini Card ───────────────────────────────────────────

const StatMiniCard = ({ icon: Icon, label, value, iconColor, iconBg }) => (
  <div style={{
    flex: 1,
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '14px',
    border: '1px solid #f3f4f6',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }}>
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      background: iconBg || '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon style={{ width: '18px', height: '18px', color: iconColor || '#64748b' }} />
    </div>
    <div>
      <p style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '2px 0 0 0' }}>
        {value}
      </p>
    </div>
  </div>
)

// ─── Sub-component: Top Stat Card ────────────────────────────────────────────

const TopStatCard = ({ icon: Icon, label, value, iconColor, iconBg }) => (
  <div style={{
    flex: 1,
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      background: iconBg || '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon style={{ width: '22px', height: '22px', color: iconColor || '#64748b' }} />
    </div>
    <div>
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ fontSize: '22px', fontWeight: '700', color: '#111827', margin: '2px 0 0 0' }}>
        {value}
      </p>
    </div>
  </div>
)

// ─── Main Component ──────────────────────────────────────────────────────────

const CPDataManagement = () => {
  // State
  const [treeData, setTreeData] = useState([])
  const [stats, setStats] = useState({})
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [batchDetail, setBatchDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [expandedCPs, setExpandedCPs] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('leads')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAction, setPaymentAction] = useState(null) // 'approve', 'reject', 'pay'
  const [paymentForm, setPaymentForm] = useState({ status: '', amount: 0, transactionRef: '', notes: '' })
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // ─── Data Loading ────────────────────────────────────────────────────────

  const loadTree = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await apiRequest('/cp-data/tree')
      setTreeData(data.data || data.tree || data || [])
    } catch (err) {
      console.error('Failed to load CP data tree:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const data = await apiRequest('/cp-data/stats')
      setStats(data.data || data.stats || data || {})
    } catch (err) {
      console.error('Failed to load CP data stats:', err)
    }
  }, [])

  const loadBatchDetail = useCallback(async (id) => {
    setDetailLoading(true)
    try {
      const data = await apiRequest(`/cp-data/${id}`)
      setBatchDetail(data.data || data.batch || data || null)
    } catch (err) {
      console.error('Failed to load batch detail:', err)
      setBatchDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  // Load on mount
  useEffect(() => {
    loadTree()
    loadStats()
  }, [loadTree, loadStats])

  // ─── Handlers ──────────────────────────────────────────────────────────

  const toggleCP = (cpId) => {
    setExpandedCPs(prev => {
      const next = new Set(prev)
      if (next.has(cpId)) next.delete(cpId)
      else next.add(cpId)
      return next
    })
  }

  const selectBatch = (batch) => {
    setSelectedBatch(batch)
    setActiveTab('leads')
    loadBatchDetail(batch._id)
  }

  const handleRefresh = async () => {
    await Promise.all([loadTree(true), loadStats()])
    if (selectedBatch?._id) {
      loadBatchDetail(selectedBatch._id)
    }
  }

  const handleRecalculate = async () => {
    if (!batchDetail?._id) return
    try {
      const data = await apiRequest(`/cp-data/${batchDetail._id}/recalculate`, { method: 'POST' })
      setBatchDetail(prev => ({ ...prev, ...(data.data || data.batch || data || {}) }))
    } catch (err) {
      console.error('Failed to recalculate incentive:', err)
    }
  }

  const openPaymentAction = (action) => {
    setPaymentAction(action)
    setPaymentForm({
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'paid',
      amount: batchDetail?.payment?.calculatedAmount || 0,
      transactionRef: '',
      notes: '',
    })
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = async () => {
    if (!batchDetail?._id) return
    setPaymentLoading(true)
    try {
      const payload = {
        status: paymentForm.status,
        notes: paymentForm.notes,
      }
      if (paymentAction === 'pay') {
        payload.transactionRef = paymentForm.transactionRef
        payload.amount = paymentForm.amount
      }
      const data = await apiRequest(`/cp-data/${batchDetail._id}/payment`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setBatchDetail(prev => ({ ...prev, ...(data.data || data.batch || data || {}) }))
      setShowPaymentModal(false)
      setPaymentAction(null)
      // Refresh stats after payment action
      loadStats()
    } catch (err) {
      console.error('Failed to update payment:', err)
    } finally {
      setPaymentLoading(false)
    }
  }

  // ─── Computed ──────────────────────────────────────────────────────────

  const filteredTree = searchQuery
    ? treeData.filter(cp => {
        const name = (cp.cp?.name || cp.cpName || '').toLowerCase()
        const code = (cp.cp?.partnerCode || cp.partnerCode || '').toLowerCase()
        return name.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase())
      })
    : treeData

  const getValidationDotColor = (status) => {
    if (status === 'completed') return '#059669'
    if (status === 'processing') return '#d97706'
    if (status === 'failed') return '#dc2626'
    return '#9ca3af'
  }

  const getPaymentDotColor = (status) => {
    if (status === 'paid') return '#059669'
    if (status === 'pending_approval') return '#d97706'
    if (status === 'approved') return '#2563eb'
    if (status === 'rejected') return '#dc2626'
    return '#d1d5db' // not_applicable
  }

  const modalTitle = paymentAction === 'approve'
    ? 'Approve Payment'
    : paymentAction === 'reject'
      ? 'Reject Payment'
      : 'Mark as Paid'

  // ─── Render ────────────────────────────────────────────────────────────

  if (loading && treeData.length === 0) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="CP Data Management"
        description="Manage channel partner data batches, lead imports, and payment tracking"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'CRM', path: '/admin/crm' },
          { label: 'CP Data Management' },
        ]}
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={handleRefresh}
            loading={refreshing}
            size="sm"
          >
            Refresh
          </Button>
        }
      />

      {/* ─── Top Stats Bar ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <TopStatCard
          icon={FolderTree}
          label="Total Batches"
          value={stats.totalBatches || 0}
          iconColor="#C59C82"
          iconBg="#FDF8F4"
        />
        <TopStatCard
          icon={Users}
          label="Total Leads Sourced"
          value={stats.totalLeads || 0}
          iconColor="#2563eb"
          iconBg="#eff6ff"
        />
        <TopStatCard
          icon={Clock}
          label="Pending Payments"
          value={stats.pendingPayments || 0}
          iconColor="#d97706"
          iconBg="#fffbeb"
        />
        <TopStatCard
          icon={DollarSign}
          label="Total Paid"
          value={formatCurrency(stats.totalPaid || 0)}
          iconColor="#059669"
          iconBg="#ecfdf5"
        />
      </div>

      {/* ─── Split Panel Layout ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '24px', paddingBottom: '32px', minHeight: 'calc(100vh - 320px)' }}>

        {/* ─── Left Panel: Tree ─────────────────────────────────────────── */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            position: 'sticky',
            top: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 340px)',
          }}>
            {/* Panel Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FolderTree style={{ width: '18px', height: '18px', color: '#C59C82' }} />
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>Channel Partners</span>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: '16px',
                  width: '16px',
                  color: '#9ca3af',
                }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search CP name or code..."
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '14px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    fontSize: '13px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                    outline: 'none',
                    color: '#111827',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#C59C82'
                    e.target.style.boxShadow = '0 0 0 3px rgba(197,156,130,0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>
                  {filteredTree.length} partner{filteredTree.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Tree Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredTree.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <FolderTree style={{ height: '40px', width: '40px', color: '#d1d5db', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 4px 0' }}>No data batches found</p>
                  <p style={{ fontSize: '12px', color: '#d1d5db', margin: 0 }}>CP data will appear here once uploaded</p>
                </div>
              ) : (
                filteredTree.map(cpNode => {
                  const cpId = cpNode.cp?._id || cpNode._id || cpNode.cpId
                  const cpName = cpNode.cp?.name || cpNode.cpName || 'Unknown CP'
                  const cpCode = cpNode.cp?.partnerCode || cpNode.partnerCode || ''
                  const spocName = cpNode.cp?.spoc?.name || cpNode.spocName || ''
                  const batches = cpNode.batches || []
                  const isExpanded = expandedCPs.has(cpId)

                  return (
                    <div key={cpId}>
                      {/* CP Level Row */}
                      <button
                        onClick={() => toggleCP(cpId)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '12px 14px',
                          textAlign: 'left',
                          border: 'none',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          background: '#fff',
                          outline: 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fafbfc' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
                      >
                        {/* Chevron */}
                        <span style={{
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: '#94a3b8',
                        }}>
                          {isExpanded
                            ? <ChevronDown style={{ width: '14px', height: '14px' }} />
                            : <ChevronRight style={{ width: '14px', height: '14px' }} />
                          }
                        </span>

                        {/* Folder icon */}
                        <Building2 style={{ width: '15px', height: '15px', color: '#C59C82', flexShrink: 0 }} />

                        {/* Name + code */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#111827',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {cpName}
                          </span>
                          {cpCode && (
                            <span style={{ fontSize: '10px', color: '#9ca3af', fontFamily: 'monospace' }}>
                              {cpCode}
                            </span>
                          )}
                        </div>

                        {/* SPOC badge */}
                        {spocName && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '600',
                            color: '#6b7280',
                            background: '#f3f4f6',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}>
                            {spocName}
                          </span>
                        )}

                        {/* Batch count */}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          color: '#C59C82',
                          background: '#FDF8F4',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}>
                          {batches.length}
                        </span>
                      </button>

                      {/* Batch Level Rows */}
                      {isExpanded && batches.map(batch => {
                        const batchId = batch._id
                        const isSelected = selectedBatch?._id === batchId
                        const version = batch.version || batch.versionNumber || '?'
                        const uploadType = batch.uploadType || 'bulk'
                        const leadCount = batch.summary?.totalRows || batch.totalRows || batch.leadCount || 0
                        const uploadDate = batch.createdAt || batch.uploadDate
                        const validationStatus = batch.validationStatus || batch.status || 'completed'
                        const paymentStatus = batch.payment?.status || batch.paymentStatus || 'not_applicable'

                        return (
                          <button
                            key={batchId}
                            onClick={() => selectBatch(batch)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '10px 14px 10px 38px',
                              textAlign: 'left',
                              border: 'none',
                              borderBottom: '1px solid #f8fafc',
                              cursor: 'pointer',
                              background: isSelected ? '#FDF8F4' : '#fff',
                              borderLeft: isSelected ? '3px solid #C59C82' : '3px solid transparent',
                              outline: 'none',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = '#fafbfc'
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = '#fff'
                            }}
                          >
                            {/* File icon */}
                            <FileSpreadsheet style={{
                              width: '14px',
                              height: '14px',
                              color: isSelected ? '#C59C82' : '#94a3b8',
                              flexShrink: 0,
                            }} />

                            {/* Version + type + count */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: isSelected ? '600' : '500',
                                color: isSelected ? '#111827' : '#374151',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                              }}>
                                v{version} - {uploadType === 'single' ? 'Single' : 'Bulk'} - {leadCount} lead{leadCount !== 1 ? 's' : ''}
                              </span>
                              <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                {formatDate(uploadDate)}
                              </span>
                            </div>

                            {/* Status dots */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <StatusDot color={getValidationDotColor(validationStatus)} />
                              <span style={{
                                fontSize: '9px',
                                color: '#6b7280',
                                marginRight: '4px',
                              }}>
                                {validationStatus === 'completed' ? '' : validationStatus === 'processing' ? '' : ''}
                              </span>
                              <DollarSign style={{
                                width: '10px',
                                height: '10px',
                                color: getPaymentDotColor(paymentStatus),
                              }} />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* ─── Right Panel ──────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!selectedBatch ? (
            /* Empty state */
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              padding: '80px 32px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <EmptyState
                icon={FolderTree}
                title="Select a data batch"
                description="Select a data batch from the left panel to view details, leads, duplicates, errors, and payment information"
              />
            </div>
          ) : detailLoading ? (
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              padding: '80px 32px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              textAlign: 'center',
            }}>
              <RefreshCw size={28} style={{ color: '#C59C82', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              <p style={{ color: '#9ca3af', marginTop: '16px', fontSize: '14px' }}>Loading batch details...</p>
            </div>
          ) : batchDetail ? (
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              {/* ─── Header Card ──────────────────────────────────────── */}
              <div style={{
                padding: '24px 32px',
                background: 'linear-gradient(135deg, #FEFCFA 0%, #FDF8F4 100%)',
                borderBottom: '1px solid #F5EDE6',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    {/* Icon */}
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: '#FDF8F4',
                      border: '2px solid #C59C82',
                    }}>
                      <FileSpreadsheet style={{ width: '24px', height: '24px', color: '#C59C82' }} />
                    </div>

                    <div>
                      {/* Batch ID + Version */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
                          {batchDetail.batchId || batchDetail._id?.slice(-6) || 'Batch'}
                        </h2>
                        <InlineBadge
                          label={`v${batchDetail.version || batchDetail.versionNumber || '?'}`}
                          bg="#FDF8F4"
                          color="#C59C82"
                          size="md"
                        />
                        <InlineBadge
                          label={batchDetail.uploadType === 'single' ? 'Single' : 'Bulk'}
                          bg={batchDetail.uploadType === 'single' ? '#f0fdfa' : '#eff6ff'}
                          color={batchDetail.uploadType === 'single' ? '#0d9488' : '#2563eb'}
                          size="sm"
                        />
                      </div>

                      {/* CP Name + Partner ID */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Building2 style={{ width: '13px', height: '13px', color: '#6b7280' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                            {batchDetail.channelPartner?.name || batchDetail.cpName || '-'}
                          </span>
                          {(batchDetail.channelPartner?.partnerCode || batchDetail.partnerId) && (
                            <span style={{
                              fontSize: '10px',
                              color: '#9ca3af',
                              fontFamily: 'monospace',
                              background: '#f3f4f6',
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}>
                              {batchDetail.channelPartner?.partnerCode || batchDetail.partnerId}
                            </span>
                          )}
                        </div>
                        {(batchDetail.spoc?.name || batchDetail.spocName) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <UserCheck style={{ width: '13px', height: '13px', color: '#6b7280' }} />
                            <span style={{ fontSize: '13px', color: '#6b7280' }}>
                              {batchDetail.spoc?.name || batchDetail.spocName}
                            </span>
                            {(batchDetail.spoc?.email || batchDetail.spocEmail) && (
                              <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                ({batchDetail.spoc?.email || batchDetail.spocEmail})
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dates + Validation status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Calendar style={{ width: '12px', height: '12px', color: '#9ca3af' }} />
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                            Uploaded: {formatDate(batchDetail.createdAt || batchDetail.uploadDate)}
                          </span>
                        </div>
                        {batchDetail.sourceDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar style={{ width: '12px', height: '12px', color: '#9ca3af' }} />
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                              Source: {formatDate(batchDetail.sourceDate)}
                            </span>
                          </div>
                        )}
                        {(() => {
                          const vs = batchDetail.validationStatus || batchDetail.status || 'completed'
                          const cfg = VALIDATION_STATUS[vs] || VALIDATION_STATUS.completed
                          return (
                            <InlineBadge label={cfg.label} bg={cfg.bg} color={cfg.color} size="sm" />
                          )
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Refresh batch button */}
                  <button
                    onClick={() => loadBatchDetail(batchDetail._id)}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                    }}
                    title="Refresh batch details"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#C59C82'
                      e.currentTarget.style.color = '#C59C82'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.color = '#6b7280'
                    }}
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {/* ─── Stats Row ────────────────────────────────────────── */}
              <div style={{ display: 'flex', gap: '12px', padding: '20px 32px', borderBottom: '1px solid #f3f4f6' }}>
                <StatMiniCard
                  icon={Hash}
                  label="Total Rows"
                  value={batchDetail.summary?.totalRows || batchDetail.totalRows || 0}
                  iconColor="#6b7280"
                  iconBg="#f3f4f6"
                />
                <StatMiniCard
                  icon={CheckCircle}
                  label="Leads Created"
                  value={batchDetail.summary?.leadsCreated || batchDetail.leadsCreated || 0}
                  iconColor="#059669"
                  iconBg="#ecfdf5"
                />
                <StatMiniCard
                  icon={AlertTriangle}
                  label="Duplicates"
                  value={batchDetail.summary?.duplicatesRemoved || batchDetail.duplicatesRemoved || 0}
                  iconColor="#d97706"
                  iconBg="#fffbeb"
                />
                <StatMiniCard
                  icon={XCircle}
                  label="Errors"
                  value={batchDetail.stats?.errorsFound || batchDetail.rowErrors?.length || 0}
                  iconColor="#dc2626"
                  iconBg="#fef2f2"
                />
              </div>

              {/* ─── Tab Bar ──────────────────────────────────────────── */}
              <div style={{ borderBottom: '1px solid #e5e7eb', padding: '0 32px' }}>
                <nav style={{ display: 'flex', gap: '0' }}>
                  {[
                    { id: 'leads', label: 'Leads', icon: Users },
                    { id: 'duplicates', label: 'Duplicates', icon: AlertTriangle },
                    { id: 'errors', label: 'Errors', icon: XCircle },
                    { id: 'payment', label: 'Payment', icon: DollarSign },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        background: 'none',
                        border: 'none',
                        borderBottom: '2px solid transparent',
                        borderBottomColor: activeTab === tab.id ? '#C59C82' : 'transparent',
                        color: activeTab === tab.id ? '#C59C82' : '#6b7280',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== tab.id) e.currentTarget.style.color = '#374151'
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== tab.id) e.currentTarget.style.color = '#6b7280'
                      }}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                      {/* Count badges */}
                      {tab.id === 'leads' && (batchDetail.summary?.leadsCreated || batchDetail.leads?.length) ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          background: activeTab === tab.id ? '#FDF8F4' : '#f1f5f9',
                          color: activeTab === tab.id ? '#C59C82' : '#6b7280',
                        }}>
                          {batchDetail.summary?.leadsCreated || batchDetail.leads?.length || 0}
                        </span>
                      ) : null}
                      {tab.id === 'duplicates' && (batchDetail.summary?.duplicatesRemoved || batchDetail.duplicates?.length) ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          background: activeTab === tab.id ? '#fffbeb' : '#f1f5f9',
                          color: activeTab === tab.id ? '#d97706' : '#6b7280',
                        }}>
                          {batchDetail.summary?.duplicatesRemoved || batchDetail.duplicates?.length || 0}
                        </span>
                      ) : null}
                      {tab.id === 'errors' && (batchDetail.stats?.errorsFound || batchDetail.rowErrors?.length) ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          background: activeTab === tab.id ? '#fef2f2' : '#f1f5f9',
                          color: activeTab === tab.id ? '#dc2626' : '#6b7280',
                        }}>
                          {batchDetail.stats?.errorsFound || batchDetail.rowErrors?.length || 0}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </nav>
              </div>

              {/* ─── Tab: Leads ────────────────────────────────────────── */}
              {activeTab === 'leads' && (
                <div style={{ padding: '24px 32px' }}>
                  {(batchDetail.leads && batchDetail.leads.length > 0) ? (
                    <Table>
                      <Table.Header>
                        <Table.Row hover={false}>
                          <Table.Head>Lead ID</Table.Head>
                          <Table.Head>Name</Table.Head>
                          <Table.Head>Phone</Table.Head>
                          <Table.Head>City</Table.Head>
                          <Table.Head>Status</Table.Head>
                          <Table.Head>Assigned To</Table.Head>
                          <Table.Head>Created</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {batchDetail.leads.map((lead, idx) => {
                          const leadId = lead.leadId || lead._id?.slice(-8) || `#${idx + 1}`
                          const name = lead.name || lead.firstName
                            ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.name
                            : '-'
                          const phone = lead.phone || lead.mobile || '-'
                          const city = lead.city || lead.location || '-'
                          const status = lead.status || 'new'
                          const statusColor = LEAD_STATUS_COLORS[status] || 'gray'
                          const assignedTo = lead.assignedTo?.name || lead.assignedToName || '-'
                          const createdAt = lead.createdAt

                          return (
                            <Table.Row key={lead._id || idx}>
                              <Table.Cell style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>
                                {leadId}
                              </Table.Cell>
                              <Table.Cell style={{ fontWeight: '600', color: '#111827' }}>
                                {name}
                              </Table.Cell>
                              <Table.Cell>{phone}</Table.Cell>
                              <Table.Cell>{city}</Table.Cell>
                              <Table.Cell>
                                <Badge color={statusColor} size="sm" dot>
                                  {status.replace(/_/g, ' ')}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell>{assignedTo}</Table.Cell>
                              <Table.Cell style={{ fontSize: '12px', color: '#9ca3af' }}>
                                {formatDate(createdAt)}
                              </Table.Cell>
                            </Table.Row>
                          )
                        })}
                      </Table.Body>
                    </Table>
                  ) : (
                    <EmptyState
                      icon={Users}
                      title="No leads"
                      description="No leads have been created from this batch yet"
                    />
                  )}
                </div>
              )}

              {/* ─── Tab: Duplicates ───────────────────────────────────── */}
              {activeTab === 'duplicates' && (
                <div style={{ padding: '24px 32px' }}>
                  {(batchDetail.duplicates && batchDetail.duplicates.length > 0) ? (
                    <Table>
                      <Table.Header>
                        <Table.Row hover={false}>
                          <Table.Head>Phone</Table.Head>
                          <Table.Head>Name</Table.Head>
                          <Table.Head>Reason</Table.Head>
                          <Table.Head>Existing Lead</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {batchDetail.duplicates.map((dup, idx) => (
                          <Table.Row key={idx}>
                            <Table.Cell style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                              {dup.phone || dup.mobile || '-'}
                            </Table.Cell>
                            <Table.Cell style={{ fontWeight: '500', color: '#111827' }}>
                              {dup.name || '-'}
                            </Table.Cell>
                            <Table.Cell>
                              <span style={{
                                fontSize: '12px',
                                color: '#d97706',
                                background: '#fffbeb',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontWeight: '500',
                              }}>
                                {dup.reason || 'Duplicate phone number'}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              {dup.existingLeadId ? (
                                <button
                                  onClick={() => {
                                    // Could navigate or show in modal
                                    window.open(`/admin/crm/leads/${dup.existingLeadId}`, '_blank')
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#2563eb',
                                    background: '#eff6ff',
                                    border: '1px solid #dbeafe',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#dbeafe'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#eff6ff'
                                  }}
                                >
                                  <Eye style={{ width: '12px', height: '12px' }} />
                                  View Lead
                                </button>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>-</span>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  ) : (
                    <EmptyState
                      icon={CheckCircle}
                      title="No duplicates found"
                      description="All data was unique - no duplicate records were detected in this batch"
                    />
                  )}
                </div>
              )}

              {/* ─── Tab: Errors ───────────────────────────────────────── */}
              {activeTab === 'errors' && (
                <div style={{ padding: '24px 32px' }}>
                  {(batchDetail.rowErrors && batchDetail.rowErrors.length > 0) ? (
                    <Table>
                      <Table.Header>
                        <Table.Row hover={false}>
                          <Table.Head style={{ width: '80px' }}>Row #</Table.Head>
                          <Table.Head>Field</Table.Head>
                          <Table.Head>Error Message</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {batchDetail.rowErrors.map((err, idx) => (
                          <Table.Row key={idx}>
                            <Table.Cell style={{ fontFamily: 'monospace', fontWeight: '600', color: '#dc2626' }}>
                              {err.row || err.rowNumber || idx + 1}
                            </Table.Cell>
                            <Table.Cell>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#475569',
                                background: '#f1f5f9',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                              }}>
                                {err.field || err.column || '-'}
                              </span>
                            </Table.Cell>
                            <Table.Cell style={{ color: '#dc2626', fontSize: '13px' }}>
                              {err.message || err.error || 'Unknown error'}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  ) : (
                    <EmptyState
                      icon={CheckCircle}
                      title="No errors"
                      description="All rows processed successfully - no errors were encountered in this batch"
                    />
                  )}
                </div>
              )}

              {/* ─── Tab: Payment ──────────────────────────────────────── */}
              {activeTab === 'payment' && (
                <div style={{ padding: '24px 32px' }}>
                  {(() => {
                    const payment = batchDetail.payment || {}
                    const pStatus = payment.status || 'not_applicable'
                    const pConfig = PAYMENT_STATUS[pStatus] || PAYMENT_STATUS.not_applicable
                    const incentive = payment.incentiveModel || batchDetail.incentiveModel || {}
                    const calculatedAmount = payment.calculatedAmount || 0

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Payment Status Card */}
                        <div style={{
                          padding: '24px',
                          borderRadius: '16px',
                          border: '1px solid #e5e7eb',
                          background: '#f9fafb',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <DollarSign style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                              <span style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>Payment Details</span>
                            </div>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 16px',
                              borderRadius: '10px',
                              fontSize: '13px',
                              fontWeight: '700',
                              background: pConfig.bg,
                              color: pConfig.color,
                            }}>
                              <StatusDot color={pConfig.color} />
                              {pConfig.label}
                            </span>
                          </div>

                          {/* Incentive Model */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                            marginBottom: '20px',
                          }}>
                            <div style={{
                              padding: '16px',
                              background: '#fff',
                              borderRadius: '12px',
                              border: '1px solid #f3f4f6',
                            }}>
                              <label style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                display: 'block',
                                marginBottom: '6px',
                              }}>
                                Incentive Model
                              </label>
                              <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>
                                {incentive.type === 'percentage'
                                  ? `Percentage: ${incentive.percentage || incentive.value || 0}%`
                                  : incentive.type === 'flat'
                                    ? `Flat: ${formatCurrency(incentive.flatAmount || incentive.value || 0)} per lead`
                                    : incentive.type === 'hybrid'
                                      ? 'Hybrid'
                                      : incentive.type || 'Not configured'
                                }
                              </p>
                            </div>

                            <div style={{
                              padding: '16px',
                              background: '#fff',
                              borderRadius: '12px',
                              border: '1px solid #f3f4f6',
                            }}>
                              <label style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                display: 'block',
                                marginBottom: '6px',
                              }}>
                                Calculated Amount
                              </label>
                              <p style={{ fontSize: '22px', fontWeight: '700', color: '#059669', margin: 0 }}>
                                {formatCurrency(calculatedAmount)}
                              </p>
                            </div>
                          </div>

                          {/* Paid details (read-only when paid) */}
                          {pStatus === 'paid' && (
                            <div style={{
                              padding: '16px',
                              background: '#ecfdf5',
                              borderRadius: '12px',
                              border: '1px solid #a7f3d0',
                              marginBottom: '16px',
                            }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <div>
                                  <label style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    color: '#059669',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    display: 'block',
                                    marginBottom: '4px',
                                  }}>
                                    Paid At
                                  </label>
                                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#065f46' }}>
                                    {formatDate(payment.paidAt)}
                                  </span>
                                </div>
                                <div>
                                  <label style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    color: '#059669',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    display: 'block',
                                    marginBottom: '4px',
                                  }}>
                                    Transaction Ref
                                  </label>
                                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#065f46', fontFamily: 'monospace' }}>
                                    {payment.transactionRef || '-'}
                                  </span>
                                </div>
                                <div>
                                  <label style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    color: '#059669',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    display: 'block',
                                    marginBottom: '4px',
                                  }}>
                                    Approved By
                                  </label>
                                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#065f46' }}>
                                    {payment.approvedBy?.name || payment.approvedByName || '-'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {(payment.notes || pStatus !== 'paid') && (
                            <div style={{
                              padding: '16px',
                              background: '#fff',
                              borderRadius: '12px',
                              border: '1px solid #f3f4f6',
                              marginBottom: '16px',
                            }}>
                              <label style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#9ca3af',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                display: 'block',
                                marginBottom: '6px',
                              }}>
                                Notes
                              </label>
                              <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.6' }}>
                                {payment.notes || 'No notes added'}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {pStatus === 'pending_approval' && (
                              <>
                                <Button
                                  variant="success"
                                  size="sm"
                                  icon={CheckCircle}
                                  onClick={() => openPaymentAction('approve')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={XCircle}
                                  onClick={() => openPaymentAction('reject')}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {pStatus === 'approved' && (
                              <Button
                                size="sm"
                                icon={DollarSign}
                                onClick={() => openPaymentAction('pay')}
                              >
                                Mark as Paid
                              </Button>
                            )}
                            {pStatus !== 'paid' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={RefreshCw}
                                onClick={handleRecalculate}
                              >
                                Recalculate Incentive
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          ) : (
            /* batchDetail is null after load */
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              padding: '80px 32px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <EmptyState
                icon={AlertTriangle}
                title="Failed to load batch"
                description="Could not load the batch details. Please try selecting it again."
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Payment Action Modal ───────────────────────────────────────── */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentAction(null) }}
        title={modalTitle}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Amount display */}
          <div style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #f3f4f6',
          }}>
            <label style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              display: 'block',
              marginBottom: '6px',
            }}>
              Payment Amount
            </label>
            <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {formatCurrency(paymentForm.amount)}
            </p>
          </div>

          {/* Transaction Ref (only for pay action) */}
          {paymentAction === 'pay' && (
            <Input
              label="Transaction Reference"
              value={paymentForm.transactionRef}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionRef: e.target.value }))}
              placeholder="e.g., TXN-20260215-001, UTR number, etc."
            />
          )}

          {/* Notes */}
          <div style={{ width: '100%' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#475569',
              marginBottom: '8px',
            }}>
              Notes
            </label>
            <textarea
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={
                paymentAction === 'approve'
                  ? 'Approval notes (optional)...'
                  : paymentAction === 'reject'
                    ? 'Reason for rejection...'
                    : 'Payment notes (optional)...'
              }
              rows={3}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                background: '#f8fafc',
                color: '#1e293b',
                border: '2px solid #e2e8f0',
                borderRadius: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#C59C82'
                e.target.style.background = 'white'
                e.target.style.boxShadow = '0 0 0 3px rgba(197, 156, 130, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.background = '#f8fafc'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Action confirmation info */}
          {paymentAction === 'reject' && (
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#991b1b' }}>
                This will reject the payment request. The CP will be notified.
              </span>
            </div>
          )}
        </div>

        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            onClick={() => { setShowPaymentModal(false); setPaymentAction(null) }}
          >
            Cancel
          </Button>
          <Button
            variant={paymentAction === 'reject' ? 'danger' : paymentAction === 'approve' ? 'success' : 'primary'}
            onClick={handlePaymentSubmit}
            loading={paymentLoading}
            icon={paymentAction === 'approve' ? CheckCircle : paymentAction === 'reject' ? XCircle : DollarSign}
          >
            {paymentAction === 'approve'
              ? 'Approve Payment'
              : paymentAction === 'reject'
                ? 'Reject Payment'
                : 'Confirm Payment'
            }
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default CPDataManagement
