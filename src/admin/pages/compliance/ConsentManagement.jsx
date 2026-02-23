import { useState, useEffect } from 'react'
import { Shield, Plus, XCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const ConsentManagement = () => {
  const [consents, setConsents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectEmail: '',
    type: 'marketing',
    consentText: '',
  })

  useEffect(() => {
    loadConsents()
  }, [pagination.page, search, statusFilter])

  const loadConsents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const response = await apiRequest(`/privacy/consents?${params.toString()}`)
      setConsents(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || response.total || 0,
        totalPages: response.pagination?.pages || response.totalPages || 1,
      }))
    } catch (err) {
      console.error('Failed to load consents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest('/privacy/consents', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setShowCreateModal(false)
      setFormData({ subjectName: '', subjectEmail: '', type: 'marketing', consentText: '' })
      loadConsents()
    } catch (err) {
      console.error('Failed to record consent:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleWithdraw = async (id) => {
    if (!confirm('Are you sure you want to withdraw this consent?')) return
    try {
      await apiRequest(`/privacy/consents/${id}/withdraw`, { method: 'PUT' })
      loadConsents()
    } catch (err) {
      console.error('Failed to withdraw consent:', err)
    }
  }

  const statusColors = {
    active: 'green',
    withdrawn: 'red',
    expired: 'gray',
    pending: 'yellow',
  }

  return (
    <div>
      <PageHeader
        title="Consent Management"
        description="DPDP Act - Manage data processing consents"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Compliance', path: '/admin/compliance' },
          { label: 'Consents' },
        ]}
        actions={
          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            Record Consent
          </Button>
        }
      />

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Card.Content style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', maxWidth: '400px' }}>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by name or email..."
              />
            </div>
            <Select
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'withdrawn', label: 'Withdrawn' },
                { value: 'expired', label: 'Expired' },
                { value: 'pending', label: 'Pending' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Consents Table */}
      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : consents.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="No consents found"
            description="Start by recording your first consent"
            action={() => setShowCreateModal(true)}
            actionLabel="Record Consent"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>Subject</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Collected Date</Table.Head>
                  <Table.Head>Expiry</Table.Head>
                  <Table.Head style={{ width: '120px' }}>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {consents.map((consent) => (
                  <Table.Row key={consent._id}>
                    <Table.Cell>
                      <div>
                        <p style={{ margin: 0, fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>
                          {consent.subjectName}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                          {consent.subjectEmail}
                        </p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="blue">
                        {consent.type?.replace('_', ' ')?.toUpperCase() || 'N/A'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[consent.status] || 'gray'}>
                        {consent.status?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', color: '#475569' }}>
                        {formatDate(consent.collectedAt || consent.createdAt)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', color: '#475569' }}>
                        {consent.expiryDate ? formatDate(consent.expiryDate) : 'No expiry'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {consent.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleWithdraw(consent._id)}
                          style={{ color: '#ef4444', borderColor: '#fecaca' }}
                        >
                          Withdraw
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
          </>
        )}
      </Card>

      {/* Record Consent Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Record Consent">
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Subject Name"
              value={formData.subjectName}
              onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              placeholder="Enter data subject's name"
              required
            />
            <Input
              label="Subject Email"
              type="email"
              value={formData.subjectEmail}
              onChange={(e) => setFormData({ ...formData, subjectEmail: e.target.value })}
              placeholder="Enter data subject's email"
              required
            />
            <Select
              label="Consent Type"
              options={[
                { value: 'marketing', label: 'Marketing' },
                { value: 'data_processing', label: 'Data Processing' },
                { value: 'sharing', label: 'Data Sharing' },
                { value: 'analytics', label: 'Analytics' },
              ]}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
            <Textarea
              label="Consent Text"
              value={formData.consentText}
              onChange={(e) => setFormData({ ...formData, consentText: e.target.value })}
              placeholder="Describe what the subject is consenting to..."
              rows={4}
              required
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Record Consent</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default ConsentManagement
