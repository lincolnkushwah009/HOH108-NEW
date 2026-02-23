import { useState, useEffect } from 'react'
import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const SoDReview = () => {
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedConflict, setSelectedConflict] = useState(null)
  const [saving, setSaving] = useState(false)
  const [resolutionData, setResolutionData] = useState({
    action: 'mitigate',
    justification: '',
  })

  useEffect(() => {
    loadConflicts()
  }, [pagination.page, search])

  const loadConflicts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      })
      if (search) params.set('search', search)

      const response = await apiRequest(`/sox/sod/conflicts?${params.toString()}`)
      setConflicts(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || response.total || 0,
        totalPages: response.pagination?.pages || response.totalPages || 1,
      }))
    } catch (err) {
      console.error('Failed to load SoD conflicts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async () => {
    setScanning(true)
    try {
      await apiRequest('/sox/sod/scan', { method: 'POST' })
      loadConflicts()
    } catch (err) {
      console.error('Failed to run SoD scan:', err)
    } finally {
      setScanning(false)
    }
  }

  const openDetailModal = (conflict) => {
    setSelectedConflict(conflict)
    setResolutionData({
      action: 'mitigate',
      justification: conflict.justification || '',
    })
    setShowDetailModal(true)
  }

  const handleResolve = async (e) => {
    e.preventDefault()
    if (!selectedConflict) return
    setSaving(true)
    try {
      await apiRequest(`/sox/sod/conflicts/${selectedConflict._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: resolutionData.action === 'accept' ? 'accepted' : 'mitigated',
          mitigationControl: resolutionData.justification,
          justification: resolutionData.justification,
        }),
      })
      setShowDetailModal(false)
      setSelectedConflict(null)
      setResolutionData({ action: 'mitigate', justification: '' })
      loadConflicts()
    } catch (err) {
      console.error('Failed to resolve conflict:', err)
    } finally {
      setSaving(false)
    }
  }

  const riskColors = {
    high: 'red',
    medium: 'yellow',
    low: 'green',
    critical: 'red',
  }

  const statusColors = {
    open: 'red',
    mitigated: 'blue',
    accepted: 'yellow',
    resolved: 'green',
  }

  return (
    <div>
      <PageHeader
        title="Segregation of Duties Review"
        description="SOX Compliance - Detect and resolve SoD conflicts"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Compliance', path: '/admin/compliance' },
          { label: 'SoD Review' },
        ]}
        actions={
          <Button icon={RefreshCw} onClick={handleScan} loading={scanning}>
            Run SoD Scan
          </Button>
        }
      />

      {/* Search */}
      <Card style={{ marginBottom: '24px' }}>
        <Card.Content style={{ padding: 16 }}>
          <div style={{ maxWidth: '400px' }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by user, role, or permission..."
            />
          </div>
        </Card.Content>
      </Card>

      {/* Conflicts Table */}
      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : conflicts.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No SoD conflicts found"
            description="Run a scan to detect segregation of duties conflicts"
            action={handleScan}
            actionLabel="Run SoD Scan"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>User</Table.Head>
                  <Table.Head>Conflicting Roles / Permissions</Table.Head>
                  <Table.Head>Risk Level</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Detected Date</Table.Head>
                  <Table.Head style={{ width: '100px' }}>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {conflicts.map((conflict) => (
                  <Table.Row key={conflict._id}>
                    <Table.Cell>
                      <div>
                        <p style={{ margin: 0, fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>
                          {conflict.userName || conflict.user?.name || 'Unknown User'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                          {conflict.userEmail || conflict.user?.email || ''}
                        </p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {(conflict.conflictingRoles || conflict.roles || []).map((role, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              backgroundColor: '#f1f5f9',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#475569',
                              marginRight: '4px',
                            }}
                          >
                            {role}
                          </span>
                        ))}
                        {(conflict.conflictingPermissions || conflict.permissions || []).map((perm, idx) => (
                          <span
                            key={`perm-${idx}`}
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              backgroundColor: '#FEF3C7',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#92400E',
                              marginRight: '4px',
                            }}
                          >
                            {perm}
                          </span>
                        ))}
                        {conflict.description && (
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                            {conflict.description}
                          </p>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={riskColors[conflict.riskLevel] || 'gray'}>
                        {conflict.riskLevel?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[conflict.status] || 'gray'}>
                        {conflict.status?.toUpperCase() || 'OPEN'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', color: '#475569' }}>
                        {formatDate(conflict.detectedAt || conflict.createdAt)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={AlertTriangle}
                        onClick={() => openDetailModal(conflict)}
                      >
                        Review
                      </Button>
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

      {/* Conflict Detail / Resolution Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedConflict(null) }}
        title="SoD Conflict Resolution"
        size="lg"
      >
        {selectedConflict && (
          <form onSubmit={handleResolve}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Conflict Details */}
              <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>User</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                      {selectedConflict.userName || selectedConflict.user?.name}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Risk Level</p>
                    <Badge color={riskColors[selectedConflict.riskLevel] || 'gray'}>
                      {selectedConflict.riskLevel?.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Detected</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                      {formatDate(selectedConflict.detectedAt || selectedConflict.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Current Status</p>
                    <Badge color={statusColors[selectedConflict.status] || 'gray'}>
                      {selectedConflict.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Conflicting Roles/Permissions</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(selectedConflict.conflictingRoles || selectedConflict.roles || []).map((role, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#FEE2E2',
                          borderRadius: '4px',
                          fontSize: '13px',
                          color: '#DC2626',
                          fontWeight: '500',
                        }}
                      >
                        {role}
                      </span>
                    ))}
                    {(selectedConflict.conflictingPermissions || selectedConflict.permissions || []).map((perm, idx) => (
                      <span
                        key={`perm-${idx}`}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#FEF3C7',
                          borderRadius: '4px',
                          fontSize: '13px',
                          color: '#92400E',
                          fontWeight: '500',
                        }}
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedConflict.description && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Description</p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>{selectedConflict.description}</p>
                  </div>
                )}
              </div>

              {/* Resolution Form */}
              <Select
                label="Resolution Action"
                options={[
                  { value: 'mitigate', label: 'Mitigate - Add compensating controls' },
                  { value: 'accept', label: 'Accept Risk - Document justification' },
                ]}
                value={resolutionData.action}
                onChange={(e) => setResolutionData({ ...resolutionData, action: e.target.value })}
              />
              <Textarea
                label="Justification / Notes"
                value={resolutionData.justification}
                onChange={(e) => setResolutionData({ ...resolutionData, justification: e.target.value })}
                placeholder={resolutionData.action === 'mitigate'
                  ? 'Describe the compensating controls being implemented...'
                  : 'Provide business justification for accepting this risk...'
                }
                rows={4}
                required
              />

              {resolutionData.action === 'accept' && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#FEF3C7',
                  borderRadius: '8px',
                  border: '1px solid #FDE68A',
                }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#92400E' }}>
                    Accepting a SoD conflict requires documented business justification and will be recorded in the audit trail. This decision should be reviewed periodically.
                  </p>
                </div>
              )}
            </div>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowDetailModal(false); setSelectedConflict(null) }}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>Submit Resolution</Button>
            </Modal.Footer>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default SoDReview
