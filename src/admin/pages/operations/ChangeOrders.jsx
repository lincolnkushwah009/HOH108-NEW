import { useState, useEffect } from 'react'
import { ClipboardList, Plus, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const ChangeOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  // New CO modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    project: '',
    type: 'scope',
    title: '',
    description: '',
    costImpact: '',
    scheduleImpact: '',
    requestedBy: '',
  })

  useEffect(() => {
    loadOrders()
  }, [pagination.page, search, statusFilter, projectFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(projectFilter && { projectId: projectFilter }),
      })
      const res = await apiRequest(`/core/change-orders?${params}`)
      setOrders(res.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.pages || 1,
      }))
    } catch (err) {
      console.error('Failed to load change orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      project: '',
      type: 'scope',
      title: '',
      description: '',
      costImpact: '',
      scheduleImpact: '',
      requestedBy: '',
    })
  }

  const handleCreate = async () => {
    if (!formData.project || !formData.title) {
      alert('Please fill in project and title')
      return
    }
    setSaving(true)
    try {
      await apiRequest('/core/change-orders', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          costImpact: formData.costImpact ? Number(formData.costImpact) : 0,
          scheduleImpact: formData.scheduleImpact ? Number(formData.scheduleImpact) : 0,
        }),
      })
      setShowNewModal(false)
      resetForm()
      loadOrders()
    } catch (err) {
      alert(err.message || 'Failed to create change order')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (orderId) => {
    if (!window.confirm('Approve this change order?')) return
    try {
      await apiRequest(`/core/change-orders/${orderId}/approve`, {
        method: 'PUT',
      })
      loadOrders()
    } catch (err) {
      alert(err.message || 'Failed to approve change order')
    }
  }

  const statusColors = {
    draft: 'gray',
    pending: 'yellow',
    approved: 'green',
    rejected: 'red',
    implemented: 'blue',
  }

  const typeColors = {
    scope: 'blue',
    design: 'purple',
    budget: 'yellow',
    schedule: 'gray',
  }

  const typeLabels = {
    scope: 'Scope',
    design: 'Design',
    budget: 'Budget',
    schedule: 'Schedule',
  }

  return (
    <div>
      <PageHeader
        title="Change Orders"
        description="Manage project change orders and their impact"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Operations' }, { label: 'Change Orders' }]}
        actions={<Button icon={Plus} onClick={() => { resetForm(); setShowNewModal(true) }}>New Change Order</Button>}
      />

      <Card style={{ marginBottom: 16 }} padding="sm">
        <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search change orders..."
            style={{ flex: 1, maxWidth: 320 }}
          />
          <Input
            placeholder="Filter by Project ID"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'implemented', label: 'Implemented' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No change orders found"
            description="Create your first change order"
            actionLabel="New Change Order"
            onAction={() => { resetForm(); setShowNewModal(true) }}
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>CO Number</Table.Head>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Description</Table.Head>
                  <Table.Head>Cost Impact</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Requested By</Table.Head>
                  <Table.Head>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.map((order) => (
                  <Table.Row key={order._id}>
                    <Table.Cell>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#C59C82' }}>
                        {order.coNumber || `CO-${order._id?.slice(-6)}`}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: '#111827' }}>
                        {order.project?.name || order.project || '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={typeColors[order.type] || 'gray'}>
                        {typeLabels[order.type] || order.type}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div style={{ maxWidth: 220 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{order.title}</p>
                        {order.description && (
                          <p style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {order.description}
                          </p>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: (order.costImpact || 0) > 0 ? '#DC2626' : (order.costImpact || 0) < 0 ? '#16A34A' : '#6B7280',
                      }}>
                        {(order.costImpact || 0) > 0 ? '+' : ''}{formatCurrency(order.costImpact || 0)}
                      </span>
                      {order.scheduleImpact ? (
                        <p style={{ fontSize: 12, color: '#6B7280' }}>
                          {order.scheduleImpact > 0 ? '+' : ''}{order.scheduleImpact} days
                        </p>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[order.status] || 'gray'}>
                        {(order.status || 'draft').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: '#374151' }}>
                        {order.requestedBy?.name || order.requestedBy || '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {(order.status === 'pending' || order.status === 'draft') && (
                        <Button size="sm" icon={CheckCircle} onClick={() => handleApprove(order._id)}>
                          Approve
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

      {/* New Change Order Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Change Order"
        description="Submit a change order request for a project"
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Input
              label="Project ID"
              placeholder="Enter project ID"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
            />
          </div>
          <div>
            <Select
              label="Change Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'scope', label: 'Scope Change' },
                { value: 'design', label: 'Design Change' },
                { value: 'budget', label: 'Budget Change' },
                { value: 'schedule', label: 'Schedule Change' },
              ]}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Title"
              placeholder="Brief title for the change"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea
              label="Description"
              placeholder="Detailed description of the change and its justification"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Input
              label="Cost Impact (INR)"
              type="number"
              placeholder="e.g. 50000 or -10000"
              value={formData.costImpact}
              onChange={(e) => setFormData({ ...formData, costImpact: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Schedule Impact (days)"
              type="number"
              placeholder="e.g. 7 or -3"
              value={formData.scheduleImpact}
              onChange={(e) => setFormData({ ...formData, scheduleImpact: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Requested By"
              placeholder="Name of requester"
              value={formData.requestedBy}
              onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
            />
          </div>
        </div>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create Change Order'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default ChangeOrders
