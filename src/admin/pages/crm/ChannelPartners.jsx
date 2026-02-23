import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, Edit, Eye, Shield, DollarSign,
  Building, Phone, Mail, User, MapPin, Hash,
  CheckCircle, XCircle, AlertTriangle, TrendingUp,
  ExternalLink, Lock, Percent, Layers
} from 'lucide-react'
import { channelPartnersAPI, usersAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

// ── Status config ──────────────────────────────────────────────
const STATUS_CONFIG = {
  active: { label: 'Active', bg: '#ecfdf5', color: '#059669' },
  inactive: { label: 'Inactive', bg: '#f1f5f9', color: '#475569' },
  suspended: { label: 'Suspended', bg: '#fef2f2', color: '#dc2626' },
}

const PORTAL_STATUS_CONFIG = {
  enabled: { label: 'Enabled', bg: '#ecfdf5', color: '#059669' },
  disabled: { label: 'Disabled', bg: '#f1f5f9', color: '#475569' },
}

const INCENTIVE_MODELS = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'flat', label: 'Flat Fee' },
  { value: 'hybrid', label: 'Hybrid' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

const TIER_OPTIONS = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
]

// ── Badge components ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive
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
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: config.color,
      }} />
      {config.label}
    </span>
  )
}

const PortalBadge = ({ enabled }) => {
  const config = enabled ? PORTAL_STATUS_CONFIG.enabled : PORTAL_STATUS_CONFIG.disabled
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
      {enabled ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {config.label}
    </span>
  )
}

// ── Empty form data ────────────────────────────────────────────
const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  contactPerson: '',
  businessName: '',
  gstin: '',
  address: {
    street: '',
    city: '',
    state: '',
    pincode: '',
  },
  spoc: '',
  status: 'active',
}

// ── Main component ─────────────────────────────────────────────
const ChannelPartners = () => {
  const navigate = useNavigate()

  // List state
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPortalModal, setShowPortalModal] = useState(false)
  const [showIncentiveModal, setShowIncentiveModal] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // Form state
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [portalPassword, setPortalPassword] = useState('')
  const [incentiveForm, setIncentiveForm] = useState({
    model: 'percentage',
    percentage: '',
    flatFee: '',
    tier: 'silver',
  })

  // SPOC users list
  const [spocUsers, setSpocUsers] = useState([])

  // ── Stats (aggregated from list) ───────────────────────────
  const stats = {
    total: pagination.total || partners.length,
    active: partners.filter(p => p.status === 'active').length,
    inactive: partners.filter(p => p.status === 'inactive').length,
    totalLeads: partners.reduce((sum, p) => sum + (p.leadsSubmitted || 0), 0),
  }

  // ── Load partners ──────────────────────────────────────────
  const loadPartners = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await channelPartnersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })
      const data = response.data || response.partners || []

      setPartners(data)
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || response.total || data.length,
        totalPages: response.pagination?.pages || response.totalPages || Math.ceil((response.pagination?.total || data.length) / prev.limit) || 1,
      }))
    } catch (err) {
      console.error('Failed to load channel partners:', err)
      setError(err.message || 'Failed to load channel partners')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, search, statusFilter])

  useEffect(() => {
    loadPartners()
  }, [loadPartners])

  // ── Load SPOC users ────────────────────────────────────────
  const loadSpocUsers = async () => {
    try {
      const response = await usersAPI.getAll({ role: 'employee', limit: 100 })
      const users = response.data || response.users || []
      setSpocUsers(users)
    } catch (err) {
      console.error('Failed to load SPOC users:', err)
    }
  }

  // ── Create partner ─────────────────────────────────────────
  const handleCreate = async () => {
    setFormError(null)
    if (!form.name || !form.phone) {
      setFormError('Name and phone are required')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.spoc) delete payload.spoc
      await channelPartnersAPI.create(payload)
      setShowCreateModal(false)
      setForm({ ...EMPTY_FORM })
      await loadPartners()
    } catch (err) {
      setFormError(err.message || 'Failed to create partner')
    } finally {
      setSaving(false)
    }
  }

  // ── Update partner ─────────────────────────────────────────
  const handleUpdate = async () => {
    setFormError(null)
    if (!form.name || !form.phone) {
      setFormError('Name and phone are required')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.spoc) delete payload.spoc
      await channelPartnersAPI.update(selectedPartner._id, payload)
      setShowEditModal(false)
      setSelectedPartner(null)
      setForm({ ...EMPTY_FORM })
      await loadPartners()
    } catch (err) {
      setFormError(err.message || 'Failed to update partner')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete partner (soft) ──────────────────────────────────
  const handleDelete = async (partner) => {
    if (!window.confirm(`Are you sure you want to delete "${partner.name}"? This action can be reversed.`)) return
    try {
      await channelPartnersAPI.delete(partner._id)
      await loadPartners()
    } catch (err) {
      console.error('Failed to delete partner:', err)
      setError(err.message || 'Failed to delete partner')
    }
  }

  // ── Enable portal ──────────────────────────────────────────
  const handleEnablePortal = async () => {
    setFormError(null)
    if (!portalPassword || portalPassword.length < 6) {
      setFormError('Password must be at least 6 characters')
      return
    }
    setSaving(true)
    try {
      await channelPartnersAPI.enablePortal(selectedPartner._id, { password: portalPassword })
      setShowPortalModal(false)
      setSelectedPartner(null)
      setPortalPassword('')
      await loadPartners()
    } catch (err) {
      setFormError(err.message || 'Failed to enable portal')
    } finally {
      setSaving(false)
    }
  }

  // ── Update incentive config ────────────────────────────────
  const handleUpdateIncentive = async () => {
    setFormError(null)
    setSaving(true)
    try {
      await channelPartnersAPI.updateIncentive(selectedPartner._id, incentiveForm)
      setShowIncentiveModal(false)
      setSelectedPartner(null)
      setIncentiveForm({ model: 'percentage', percentage: '', flatFee: '', tier: 'silver' })
      await loadPartners()
    } catch (err) {
      setFormError(err.message || 'Failed to update incentive config')
    } finally {
      setSaving(false)
    }
  }

  // ── Open edit modal ────────────────────────────────────────
  const openEditModal = (partner) => {
    setSelectedPartner(partner)
    setForm({
      name: partner.name || '',
      email: partner.email || '',
      phone: partner.phone || '',
      contactPerson: partner.contactPerson || '',
      businessName: partner.businessName || '',
      gstin: partner.gstin || '',
      address: {
        street: partner.address?.street || '',
        city: partner.address?.city || '',
        state: partner.address?.state || '',
        pincode: partner.address?.pincode || '',
      },
      spoc: partner.spoc?._id || partner.spoc || '',
      status: partner.status || 'active',
    })
    setFormError(null)
    setShowEditModal(true)
    loadSpocUsers()
  }

  // ── Open create modal ──────────────────────────────────────
  const openCreateModal = () => {
    setForm({ ...EMPTY_FORM })
    setFormError(null)
    setShowCreateModal(true)
    loadSpocUsers()
  }

  // ── Open portal modal ──────────────────────────────────────
  const openPortalModal = (partner) => {
    setSelectedPartner(partner)
    setPortalPassword('')
    setFormError(null)
    setShowPortalModal(true)
  }

  // ── Open incentive modal ───────────────────────────────────
  const openIncentiveModal = (partner) => {
    setSelectedPartner(partner)
    setIncentiveForm({
      model: partner.incentiveConfig?.model || partner.incentive?.model || 'percentage',
      percentage: partner.incentiveConfig?.percentage || partner.incentive?.percentage || '',
      flatFee: partner.incentiveConfig?.flatFee || partner.incentive?.flatFee || '',
      tier: partner.incentiveConfig?.tier || partner.incentive?.tier || 'silver',
    })
    setFormError(null)
    setShowIncentiveModal(true)
  }

  // ── Form field update helpers ──────────────────────────────
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const updateAddress = (field, value) => {
    setForm(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }))
  }

  // ── Search debounce ────────────────────────────────────────
  const handleSearchChange = (value) => {
    setSearch(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // ── Render ─────────────────────────────────────────────────
  if (loading && partners.length === 0) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Channel Partners"
        description="Manage channel partners, portal access, and incentive configurations"
        breadcrumbs={[
          { label: 'CRM', path: '/admin/crm' },
          { label: 'Channel Partners' },
        ]}
        actions={
          <Button icon={Plus} onClick={openCreateModal}>
            Add Partner
          </Button>
        }
      />

      {/* ── Stats Row ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#FDF8F4', borderRadius: '12px' }}>
                <Users style={{ width: '24px', height: '24px', color: '#C59C82' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Total Partners</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{stats.total}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#ecfdf5', borderRadius: '12px' }}>
                <CheckCircle style={{ width: '24px', height: '24px', color: '#059669' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Active</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#059669', margin: 0 }}>{stats.active}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
                <XCircle style={{ width: '24px', height: '24px', color: '#475569' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Inactive</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#475569', margin: 0 }}>{stats.inactive}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#eff6ff', borderRadius: '12px' }}>
                <TrendingUp style={{ width: '24px', height: '24px', color: '#2563eb' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Total Leads Submitted</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb', margin: 0 }}>{stats.totalLeads}</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* ── Filters & Table ───────────────────────────────── */}
      <Card padding="none">
        <Card.Content style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Search partners by name, email, phone..."
              style={{ flex: 1, minWidth: '240px' }}
            />
            <div style={{ minWidth: '180px' }}>
              <Select
                options={[
                  { value: '', label: 'All Statuses' },
                  ...STATUS_OPTIONS,
                ]}
                value={statusFilter}
                onChange={handleStatusFilterChange}
                placeholder="All Statuses"
              />
            </div>
          </div>
        </Card.Content>

        {error && (
          <div style={{ padding: '12px 20px', margin: '0 20px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {partners.length === 0 && !loading ? (
          <EmptyState
            icon={Users}
            title="No channel partners yet"
            description="Add your first channel partner to start managing referrals and incentives."
            action={openCreateModal}
            actionLabel="Add Partner"
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <Table>
                <Table.Header>
                  <Table.Row hover={false}>
                    <Table.Head>Partner ID</Table.Head>
                    <Table.Head>Name / Business</Table.Head>
                    <Table.Head>Contact Person</Table.Head>
                    <Table.Head>Phone / Email</Table.Head>
                    <Table.Head>SPOC</Table.Head>
                    <Table.Head>Leads</Table.Head>
                    <Table.Head>Incentive</Table.Head>
                    <Table.Head>Portal</Table.Head>
                    <Table.Head>Status</Table.Head>
                    <Table.Head style={{ textAlign: 'right' }}>Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {partners.map((partner) => (
                    <Table.Row key={partner._id}>
                      {/* Partner ID */}
                      <Table.Cell>
                        <span style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'monospace' }}>
                          {partner.partnerId || partner._id?.slice(-8)?.toUpperCase() || '-'}
                        </span>
                      </Table.Cell>

                      {/* Name / Business Name */}
                      <Table.Cell>
                        <div>
                          <span style={{ fontWeight: '600', color: '#1e293b', display: 'block' }}>
                            {partner.name || '-'}
                          </span>
                          {partner.businessName && (
                            <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Building size={11} />
                              {partner.businessName}
                            </span>
                          )}
                        </div>
                      </Table.Cell>

                      {/* Contact Person */}
                      <Table.Cell>
                        <span style={{ color: '#475569' }}>
                          {partner.contactPerson || '-'}
                        </span>
                      </Table.Cell>

                      {/* Phone / Email */}
                      <Table.Cell>
                        <div>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569', fontSize: '13px' }}>
                            <Phone size={12} style={{ color: '#94a3b8' }} />
                            {partner.phone || '-'}
                          </span>
                          {partner.email && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                              <Mail size={11} style={{ color: '#94a3b8' }} />
                              {partner.email}
                            </span>
                          )}
                        </div>
                      </Table.Cell>

                      {/* SPOC */}
                      <Table.Cell>
                        <span style={{ color: '#475569', fontSize: '13px' }}>
                          {partner.spoc?.name || '-'}
                        </span>
                      </Table.Cell>

                      {/* Leads Submitted / Converted */}
                      <Table.Cell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>
                            {partner.leadsSubmitted || 0}
                          </span>
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>/</span>
                          <span style={{ fontWeight: '500', color: '#059669', fontSize: '13px' }}>
                            {partner.leadsConverted || 0}
                          </span>
                        </div>
                      </Table.Cell>

                      {/* Incentive Model */}
                      <Table.Cell>
                        {(partner.incentiveConfig?.model || partner.incentive?.model) ? (
                          <Badge color="purple" size="sm">
                            {(partner.incentiveConfig?.model || partner.incentive?.model || '').toUpperCase()}
                          </Badge>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>Not set</span>
                        )}
                      </Table.Cell>

                      {/* Portal Status */}
                      <Table.Cell>
                        <PortalBadge enabled={partner.portalEnabled} />
                      </Table.Cell>

                      {/* Status */}
                      <Table.Cell>
                        <StatusBadge status={partner.status} />
                      </Table.Cell>

                      {/* Actions */}
                      <Table.Cell style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(partner)}
                            title="Edit"
                            style={{
                              padding: '8px',
                              background: 'none',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FDF8F4'
                              e.currentTarget.style.color = '#C59C82'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = '#64748b'
                            }}
                          >
                            <Edit size={15} />
                          </button>

                          {!partner.portalEnabled && (
                            <button
                              onClick={() => openPortalModal(partner)}
                              title="Enable Portal"
                              style={{
                                padding: '8px',
                                background: 'none',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#ecfdf5'
                                e.currentTarget.style.color = '#059669'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.color = '#64748b'
                              }}
                            >
                              <Shield size={15} />
                            </button>
                          )}

                          <button
                            onClick={() => openIncentiveModal(partner)}
                            title="Incentive Config"
                            style={{
                              padding: '8px',
                              background: 'none',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#eff6ff'
                              e.currentTarget.style.color = '#2563eb'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = '#64748b'
                            }}
                          >
                            <DollarSign size={15} />
                          </button>

                          <button
                            onClick={() => navigate(`/admin/crm/channel-partners/${partner._id}/leads`)}
                            title="View Leads"
                            style={{
                              padding: '8px',
                              background: 'none',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FDF8F4'
                              e.currentTarget.style.color = '#C59C82'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = '#64748b'
                            }}
                          >
                            <ExternalLink size={15} />
                          </button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>

            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              />
            )}
          </>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════════
          CREATE / EDIT MODAL
          ══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
          setSelectedPartner(null)
          setForm({ ...EMPTY_FORM })
          setFormError(null)
        }}
        title={showEditModal ? 'Edit Channel Partner' : 'Add Channel Partner'}
        description={showEditModal ? 'Update the channel partner details below.' : 'Fill in the details to register a new channel partner.'}
        size="lg"
      >
        {formError && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            {formError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Name *"
            placeholder="Partner / Company name"
            value={form.name}
            onChange={(e) => updateForm('name', e.target.value)}
          />
          <Input
            label="Business Name"
            placeholder="Legal business name"
            icon={Building}
            value={form.businessName}
            onChange={(e) => updateForm('businessName', e.target.value)}
          />
          <Input
            label="Contact Person"
            placeholder="Primary contact name"
            icon={User}
            value={form.contactPerson}
            onChange={(e) => updateForm('contactPerson', e.target.value)}
          />
          <Input
            label="Phone *"
            placeholder="Phone number"
            icon={Phone}
            value={form.phone}
            onChange={(e) => updateForm('phone', e.target.value)}
          />
          <Input
            label="Email"
            placeholder="Email address"
            icon={Mail}
            type="email"
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
          />
          <Input
            label="GSTIN"
            placeholder="GST identification number"
            icon={Hash}
            value={form.gstin}
            onChange={(e) => updateForm('gstin', e.target.value)}
          />
        </div>

        {/* Address fields */}
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={16} style={{ color: '#C59C82' }} />
            Address
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            <Input
              label="Street"
              placeholder="Street address"
              value={form.address.street}
              onChange={(e) => updateAddress('street', e.target.value)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <Input
                label="City"
                placeholder="City"
                value={form.address.city}
                onChange={(e) => updateAddress('city', e.target.value)}
              />
              <Input
                label="State"
                placeholder="State"
                value={form.address.state}
                onChange={(e) => updateAddress('state', e.target.value)}
              />
              <Input
                label="Pincode"
                placeholder="Pincode"
                value={form.address.pincode}
                onChange={(e) => updateAddress('pincode', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SPOC & Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
          <Select
            label="SPOC (Internal)"
            placeholder="Select SPOC..."
            value={form.spoc}
            onChange={(e) => updateForm('spoc', e.target.value)}
            options={spocUsers.map(u => ({ value: u._id, label: u.name || u.email }))}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => updateForm('status', e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowCreateModal(false)
              setShowEditModal(false)
              setSelectedPartner(null)
              setForm({ ...EMPTY_FORM })
              setFormError(null)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={showEditModal ? handleUpdate : handleCreate}
            loading={saving}
            disabled={saving}
          >
            {showEditModal ? 'Update Partner' : 'Create Partner'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          ENABLE PORTAL MODAL
          ══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showPortalModal}
        onClose={() => {
          setShowPortalModal(false)
          setSelectedPartner(null)
          setPortalPassword('')
          setFormError(null)
        }}
        title="Enable Partner Portal"
        description={`Enable portal access for ${selectedPartner?.name || 'this partner'}. They will be able to log in and submit leads.`}
        size="sm"
      >
        {formError && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            {formError}
          </div>
        )}

        <div style={{
          padding: '16px',
          backgroundColor: '#FDF8F4',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <Lock size={18} style={{ color: '#C59C82', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: 0 }}>
              Set an initial password
            </p>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              The partner can change this password after logging in for the first time.
            </p>
          </div>
        </div>

        <Input
          label="Initial Password"
          type="password"
          placeholder="Minimum 6 characters"
          icon={Lock}
          value={portalPassword}
          onChange={(e) => setPortalPassword(e.target.value)}
        />

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowPortalModal(false)
              setSelectedPartner(null)
              setPortalPassword('')
              setFormError(null)
            }}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleEnablePortal}
            loading={saving}
            disabled={saving}
            icon={Shield}
          >
            Enable Portal
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          INCENTIVE CONFIG MODAL
          ══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showIncentiveModal}
        onClose={() => {
          setShowIncentiveModal(false)
          setSelectedPartner(null)
          setIncentiveForm({ model: 'percentage', percentage: '', flatFee: '', tier: 'silver' })
          setFormError(null)
        }}
        title="Incentive Configuration"
        description={`Configure the incentive model for ${selectedPartner?.name || 'this partner'}.`}
        size="md"
      >
        {formError && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} />
            {formError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Incentive Model"
            value={incentiveForm.model}
            onChange={(e) => setIncentiveForm(prev => ({ ...prev, model: e.target.value }))}
            options={INCENTIVE_MODELS}
          />

          {(incentiveForm.model === 'percentage' || incentiveForm.model === 'hybrid') && (
            <Input
              label="Percentage (%)"
              type="number"
              placeholder="e.g. 5"
              icon={Percent}
              value={incentiveForm.percentage}
              onChange={(e) => setIncentiveForm(prev => ({ ...prev, percentage: e.target.value }))}
            />
          )}

          {(incentiveForm.model === 'flat' || incentiveForm.model === 'hybrid') && (
            <Input
              label="Flat Fee (INR)"
              type="number"
              placeholder="e.g. 10000"
              icon={DollarSign}
              value={incentiveForm.flatFee}
              onChange={(e) => setIncentiveForm(prev => ({ ...prev, flatFee: e.target.value }))}
            />
          )}

          <Select
            label="Tier"
            value={incentiveForm.tier}
            onChange={(e) => setIncentiveForm(prev => ({ ...prev, tier: e.target.value }))}
            options={TIER_OPTIONS}
          />
        </div>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowIncentiveModal(false)
              setSelectedPartner(null)
              setIncentiveForm({ model: 'percentage', percentage: '', flatFee: '', tier: 'silver' })
              setFormError(null)
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateIncentive}
            loading={saving}
            disabled={saving}
            icon={DollarSign}
          >
            Save Incentive Config
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default ChannelPartners
