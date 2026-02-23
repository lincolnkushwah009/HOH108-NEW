import { useState, useEffect } from 'react'
import { Lock, Plus, Eye, CheckCircle, XCircle, Edit } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const AccessReviews = () => {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [entries, setEntries] = useState([])
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    scope: 'all_users',
    dueDate: '',
  })

  useEffect(() => {
    loadCampaigns()
  }, [pagination.page, search])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      })
      if (search) params.set('search', search)

      const response = await apiRequest(`/sox/access-reviews?${params.toString()}`)
      setCampaigns(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || response.total || 0,
        totalPages: response.pagination?.pages || response.totalPages || 1,
      }))
    } catch (err) {
      console.error('Failed to load access reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest('/sox/access-reviews', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setShowCreateModal(false)
      setFormData({ name: '', scope: 'all_users', dueDate: '' })
      loadCampaigns()
    } catch (err) {
      console.error('Failed to create access review campaign:', err)
    } finally {
      setSaving(false)
    }
  }

  const openDetailModal = async (campaign) => {
    setSelectedCampaign(campaign)
    setShowDetailModal(true)
    setEntriesLoading(true)
    setEntries([])
    try {
      const response = await apiRequest(`/sox/access-reviews/${campaign._id}/entries`)
      setEntries(response.data || response.entries || [])
    } catch (err) {
      console.error('Failed to load review entries:', err)
    } finally {
      setEntriesLoading(false)
    }
  }

  const handleEntryDecision = async (entryId, decision) => {
    try {
      await apiRequest(`/sox/access-reviews/${selectedCampaign._id}/entries/${entryId}/decide`, {
        method: 'PUT',
        body: JSON.stringify({ decision }),
      })
      // Refresh entries
      const response = await apiRequest(`/sox/access-reviews/${selectedCampaign._id}/entries`)
      setEntries(response.data || response.entries || [])
      loadCampaigns()
    } catch (err) {
      console.error('Failed to update entry decision:', err)
    }
  }

  const statusColors = {
    active: 'blue',
    completed: 'green',
    draft: 'yellow',
    cancelled: 'red',
    pending: 'yellow',
    overdue: 'red',
  }

  const decisionColors = {
    maintain: 'green',
    revoke: 'red',
    modify: 'blue',
    pending: 'yellow',
  }

  const calculateProgress = (campaign) => {
    if (campaign.progress !== undefined) return campaign.progress
    if (campaign.totalEntries && campaign.reviewedEntries) {
      return Math.round((campaign.reviewedEntries / campaign.totalEntries) * 100)
    }
    return 0
  }

  return (
    <div>
      <PageHeader
        title="User Access Reviews"
        description="SOX Compliance - Periodic user access review campaigns"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Compliance', path: '/admin/compliance' },
          { label: 'Access Reviews' },
        ]}
        actions={
          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            New Campaign
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
              placeholder="Search campaigns..."
            />
          </div>
        </Card.Content>
      </Card>

      {/* Campaigns Table */}
      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Lock}
            title="No access review campaigns found"
            description="Create a new campaign to start reviewing user access"
            action={() => setShowCreateModal(true)}
            actionLabel="New Campaign"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>Campaign Name</Table.Head>
                  <Table.Head>Scope</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Due Date</Table.Head>
                  <Table.Head>Progress</Table.Head>
                  <Table.Head style={{ width: '100px' }}>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {campaigns.map((campaign) => {
                  const progress = calculateProgress(campaign)
                  return (
                    <Table.Row key={campaign._id}>
                      <Table.Cell>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                          {campaign.name}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="purple">
                          {campaign.scope?.replace('_', ' ')?.toUpperCase() || 'ALL USERS'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={statusColors[campaign.status] || 'gray'}>
                          {campaign.status?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{
                          fontSize: '14px',
                          color: campaign.dueDate && new Date(campaign.dueDate) < new Date() && campaign.status !== 'completed'
                            ? '#ef4444'
                            : '#475569',
                          fontWeight: campaign.dueDate && new Date(campaign.dueDate) < new Date() && campaign.status !== 'completed'
                            ? '600'
                            : '400',
                        }}>
                          {campaign.dueDate ? formatDate(campaign.dueDate) : 'No deadline'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '140px' }}>
                          <div style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${progress}%`,
                              height: '100%',
                              backgroundColor: progress === 100 ? '#16a34a' : '#C59C82',
                              borderRadius: '4px',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569', minWidth: '36px' }}>
                            {progress}%
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Eye}
                          onClick={() => openDetailModal(campaign)}
                        >
                          View
                        </Button>
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

      {/* New Campaign Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Access Review Campaign">
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Campaign Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Q1 2025 User Access Review"
              required
            />
            <Select
              label="Scope"
              options={[
                { value: 'all_users', label: 'All Users' },
                { value: 'privileged_users', label: 'Privileged Users Only' },
                { value: 'admin_users', label: 'Admin Users Only' },
                { value: 'finance_users', label: 'Finance Users' },
                { value: 'custom', label: 'Custom Scope' },
              ]}
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Campaign</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Campaign Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedCampaign(null); setEntries([]) }}
        title={selectedCampaign ? `Review: ${selectedCampaign.name}` : 'Campaign Details'}
        size="lg"
      >
        {selectedCampaign && (
          <div>
            {/* Campaign Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              padding: '16px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Status</p>
                <Badge color={statusColors[selectedCampaign.status] || 'gray'}>
                  {selectedCampaign.status?.toUpperCase()}
                </Badge>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Due Date</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                  {selectedCampaign.dueDate ? formatDate(selectedCampaign.dueDate) : 'No deadline'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Progress</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#C59C82' }}>
                  {calculateProgress(selectedCampaign)}%
                </p>
              </div>
            </div>

            {/* Entries */}
            {entriesLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <PageLoader />
              </div>
            ) : entries.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <p>No review entries found for this campaign.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>User</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Current Role</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Decision</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Reviewer Notes</th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0', width: '200px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div>
                            <p style={{ margin: 0, fontWeight: '500', color: '#1e293b' }}>
                              {entry.userName || entry.user?.name || 'Unknown'}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                              {entry.userEmail || entry.user?.email || ''}
                            </p>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '2px 8px',
                            backgroundColor: '#EDE9FE',
                            borderRadius: '4px',
                            fontSize: '12px',
                            color: '#7C3AED',
                            fontWeight: '500',
                          }}>
                            {entry.currentRole || entry.role || 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {entry.decision ? (
                            <Badge color={decisionColors[entry.decision] || 'gray'}>
                              {entry.decision?.toUpperCase()}
                            </Badge>
                          ) : (
                            <Badge color="yellow">PENDING</Badge>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '13px', maxWidth: '200px' }}>
                          {entry.reviewerNotes || entry.notes || '--'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEntryDecision(entry._id, 'maintain')}
                              style={{
                                padding: '4px 10px',
                                border: '1px solid #BBF7D0',
                                borderRadius: '6px',
                                backgroundColor: entry.decision === 'maintain' ? '#DCFCE7' : '#fff',
                                color: '#16A34A',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Maintain access"
                            >
                              <CheckCircle style={{ width: '12px', height: '12px' }} />
                              Maintain
                            </button>
                            <button
                              onClick={() => handleEntryDecision(entry._id, 'revoke')}
                              style={{
                                padding: '4px 10px',
                                border: '1px solid #FECACA',
                                borderRadius: '6px',
                                backgroundColor: entry.decision === 'revoke' ? '#FEE2E2' : '#fff',
                                color: '#DC2626',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Revoke access"
                            >
                              <XCircle style={{ width: '12px', height: '12px' }} />
                              Revoke
                            </button>
                            <button
                              onClick={() => handleEntryDecision(entry._id, 'modify')}
                              style={{
                                padding: '4px 10px',
                                border: '1px solid #BFDBFE',
                                borderRadius: '6px',
                                backgroundColor: entry.decision === 'modify' ? '#DBEAFE' : '#fff',
                                color: '#2563EB',
                                fontSize: '12px',
                                cursor: 'pointer',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Modify access"
                            >
                              <Edit style={{ width: '12px', height: '12px' }} />
                              Modify
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowDetailModal(false); setSelectedCampaign(null); setEntries([]) }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AccessReviews
