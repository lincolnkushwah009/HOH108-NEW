import { useState, useEffect } from 'react'
import { FileText, Plus, Play } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const DataSubjectRequests = () => {
  const [dsrs, setDsrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [selectedDSR, setSelectedDSR] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectEmail: '',
    requestType: 'access',
    description: '',
  })
  const [processData, setProcessData] = useState({
    status: 'in_progress',
    resolutionNotes: '',
  })

  useEffect(() => {
    loadDSRs()
  }, [pagination.page, search, statusFilter])

  const loadDSRs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const response = await apiRequest(`/privacy/dsr?${params.toString()}`)
      setDsrs(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || response.total || 0,
        totalPages: response.pagination?.pages || response.totalPages || 1,
      }))
    } catch (err) {
      console.error('Failed to load DSRs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest('/privacy/dsr', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setShowCreateModal(false)
      setFormData({ subjectName: '', subjectEmail: '', requestType: 'access', description: '' })
      loadDSRs()
    } catch (err) {
      console.error('Failed to create DSR:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleProcess = async (e) => {
    e.preventDefault()
    if (!selectedDSR) return
    setSaving(true)
    try {
      await apiRequest(`/privacy/dsr/${selectedDSR._id}/process`, {
        method: 'PUT',
        body: JSON.stringify(processData),
      })
      setShowProcessModal(false)
      setSelectedDSR(null)
      setProcessData({ status: 'in_progress', resolutionNotes: '' })
      loadDSRs()
    } catch (err) {
      console.error('Failed to process DSR:', err)
    } finally {
      setSaving(false)
    }
  }

  const openProcessModal = (dsr) => {
    setSelectedDSR(dsr)
    setProcessData({
      status: dsr.status === 'pending' ? 'in_progress' : 'completed',
      resolutionNotes: dsr.resolutionNotes || '',
    })
    setShowProcessModal(true)
  }

  const statusColors = {
    pending: 'yellow',
    in_progress: 'blue',
    completed: 'green',
    rejected: 'red',
  }

  const statusLabels = {
    pending: 'PENDING',
    in_progress: 'IN PROGRESS',
    completed: 'COMPLETED',
    rejected: 'REJECTED',
  }

  const typeColors = {
    access: 'blue',
    correction: 'purple',
    erasure: 'red',
    portability: 'cyan',
  }

  const calculateSLADays = (createdAt, slaDeadline) => {
    if (slaDeadline) {
      const diff = new Date(slaDeadline) - new Date()
      return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }
    // Default 30-day SLA
    const created = new Date(createdAt)
    const deadline = new Date(created.getTime() + 30 * 24 * 60 * 60 * 1000)
    const diff = deadline - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div>
      <PageHeader
        title="Data Subject Requests"
        description="DPDP Act - Track and manage data subject rights requests"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Compliance', path: '/admin/compliance' },
          { label: 'DSR' },
        ]}
        actions={
          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            New DSR
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
                placeholder="Search by name, email, or request ID..."
              />
            </div>
            <Select
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'rejected', label: 'Rejected' },
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

      {/* DSR Table */}
      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : dsrs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No data subject requests found"
            description="Create a new DSR to get started"
            action={() => setShowCreateModal(true)}
            actionLabel="New DSR"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>Request ID</Table.Head>
                  <Table.Head>Subject</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Created</Table.Head>
                  <Table.Head>SLA Days Left</Table.Head>
                  <Table.Head style={{ width: '120px' }}>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {dsrs.map((dsr) => {
                  const slaDays = calculateSLADays(dsr.createdAt, dsr.slaDeadline)
                  const isOverdue = slaDays < 0 && dsr.status !== 'completed' && dsr.status !== 'rejected'
                  return (
                    <Table.Row key={dsr._id}>
                      <Table.Cell>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#C59C82' }}>
                          {dsr.requestId || dsr._id?.slice(-8)?.toUpperCase()}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p style={{ margin: 0, fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>
                            {dsr.subjectName}
                          </p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                            {dsr.subjectEmail}
                          </p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={typeColors[dsr.requestType] || 'gray'}>
                          {dsr.requestType?.toUpperCase()}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={statusColors[dsr.status] || 'gray'}>
                          {statusLabels[dsr.status] || dsr.status?.toUpperCase()}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: '14px', color: '#475569' }}>
                          {formatDate(dsr.createdAt)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {dsr.status === 'completed' || dsr.status === 'rejected' ? (
                          <span style={{ fontSize: '14px', color: '#94a3b8' }}>--</span>
                        ) : (
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: isOverdue ? '#ef4444' : slaDays <= 5 ? '#f59e0b' : '#16a34a',
                          }}>
                            {isOverdue ? `${Math.abs(slaDays)} days overdue` : `${slaDays} days`}
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {(dsr.status === 'pending' || dsr.status === 'in_progress') && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={Play}
                            onClick={() => openProcessModal(dsr)}
                          >
                            Process
                          </Button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
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

      {/* New DSR Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Data Subject Request">
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
              label="Request Type"
              options={[
                { value: 'access', label: 'Access - Right to access personal data' },
                { value: 'correction', label: 'Correction - Right to correct data' },
                { value: 'erasure', label: 'Erasure - Right to delete data' },
                { value: 'portability', label: 'Portability - Right to data portability' },
              ]}
              value={formData.requestType}
              onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
            />
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the data subject's request in detail..."
              rows={4}
              required
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit DSR</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Process DSR Modal */}
      <Modal
        isOpen={showProcessModal}
        onClose={() => { setShowProcessModal(false); setSelectedDSR(null) }}
        title={`Process DSR - ${selectedDSR?.requestId || selectedDSR?._id?.slice(-8)?.toUpperCase() || ''}`}
      >
        <form onSubmit={handleProcess}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selectedDSR && (
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '4px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>Subject</p>
                <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                  {selectedDSR.subjectName} ({selectedDSR.subjectEmail})
                </p>
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>Request Type</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                  {selectedDSR.requestType?.toUpperCase()}
                </p>
              </div>
            )}
            <Select
              label="Update Status"
              options={[
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              value={processData.status}
              onChange={(e) => setProcessData({ ...processData, status: e.target.value })}
            />
            <Textarea
              label="Resolution Notes"
              value={processData.resolutionNotes}
              onChange={(e) => setProcessData({ ...processData, resolutionNotes: e.target.value })}
              placeholder="Add notes about how this request was handled..."
              rows={4}
              required
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowProcessModal(false); setSelectedDSR(null) }}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>Update DSR</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default DataSubjectRequests
