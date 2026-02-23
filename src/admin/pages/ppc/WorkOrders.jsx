import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, MoreVertical, Factory, Eye, Edit, Trash2, Play, Pause, CheckCircle,
  XCircle, Send, AlertTriangle, Clock, Package
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { workOrdersAPI, projectsAPI, bomAPI } from '../../utils/api'

const WorkOrders = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [projectFilter, setProjectFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projects, setProjects] = useState([])
  const [boms, setBoms] = useState([])
  const [formData, setFormData] = useState({
    project: '',
    bom: '',
    quantity: 1,
    priority: 'medium',
    startDate: '',
    endDate: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadWorkOrders()
  }, [pagination.page, search, statusFilter, projectFilter])

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getAll({ limit: 100, status: 'active' })
      setProjects(response.data || [])
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const loadBoms = async (projectId) => {
    if (!projectId) {
      setBoms([])
      return
    }
    try {
      const response = await bomAPI.getByProject(projectId)
      setBoms(response.data || [])
    } catch (err) {
      console.error('Failed to load BOMs:', err)
    }
  }

  const loadWorkOrders = async () => {
    setLoading(true)
    try {
      const response = await workOrdersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        project: projectFilter
      })
      setWorkOrders(response.data || [])
      setStats(response.stats || {})
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load work orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await workOrdersAPI.createFromBOM(formData.bom, {
        quantity: parseInt(formData.quantity),
        priority: formData.priority,
        schedule: {
          startDate: formData.startDate,
          endDate: formData.endDate
        },
        notes: formData.notes
      })
      setShowCreateModal(false)
      setFormData({
        project: '',
        bom: '',
        quantity: 1,
        priority: 'medium',
        startDate: '',
        endDate: '',
        notes: ''
      })
      loadWorkOrders()
    } catch (err) {
      console.error('Failed to create work order:', err)
      alert('Failed to create work order: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleRelease = async (id) => {
    if (!confirm('Release this work order for production?')) return
    try {
      await workOrdersAPI.release(id)
      loadWorkOrders()
    } catch (err) {
      console.error('Failed to release:', err)
      alert('Failed to release: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleStart = async (id) => {
    try {
      await workOrdersAPI.start(id)
      loadWorkOrders()
    } catch (err) {
      console.error('Failed to start:', err)
    }
  }

  const handleHold = async (id) => {
    const reason = prompt('Enter hold reason:')
    if (!reason) return
    try {
      await workOrdersAPI.hold(id, reason)
      loadWorkOrders()
    } catch (err) {
      console.error('Failed to hold:', err)
    }
  }

  const handleResume = async (id) => {
    try {
      await workOrdersAPI.resume(id)
      loadWorkOrders()
    } catch (err) {
      console.error('Failed to resume:', err)
    }
  }

  const handleComplete = async (id) => {
    if (!confirm('Mark this work order as complete?')) return
    try {
      await workOrdersAPI.complete(id, { completedQuantity: 0 })
      loadWorkOrders()
    } catch (err) {
      console.error('Failed to complete:', err)
    }
  }

  const handleCancel = async (id) => {
    const reason = prompt('Enter cancellation reason:')
    if (!reason) return
    try {
      await workOrdersAPI.cancel(id, reason)
      loadWorkOrders()
    } catch (err) {
      console.error('Failed to cancel:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this work order?')) return
    try {
      await workOrdersAPI.delete(id)
      loadWorkOrders()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const statusColors = {
    draft: 'gray',
    released: 'blue',
    in_progress: 'yellow',
    completed: 'green',
    on_hold: 'orange',
    cancelled: 'red'
  }

  const priorityColors = {
    low: 'gray',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  }

  return (
    <div>
      <PageHeader
        title="Work Orders"
        description="Manage production work orders"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'PPC', path: '/admin/ppc' },
          { label: 'Work Orders' }
        ]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>New Work Order</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {[
          { key: 'draft', label: 'Draft', icon: Clock, color: 'gray' },
          { key: 'released', label: 'Released', icon: Send, color: 'blue' },
          { key: 'in_progress', label: 'In Progress', icon: Play, color: 'yellow' },
          { key: 'on_hold', label: 'On Hold', icon: Pause, color: 'orange' },
          { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'green' },
          { key: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'red' }
        ].map((item) => (
          <Card
            key={item.key}
            className={`cursor-pointer ${statusFilter === item.key ? 'ring-2 ring-amber-600' : ''}`}
            onClick={() => setStatusFilter(statusFilter === item.key ? '' : item.key)}
          >
            <div className="flex items-center gap-2">
              <item.icon className={`h-5 w-5 text-${item.color}-500`} />
              <div>
                <p className="text-xl font-semibold text-gray-900">
                  {stats[item.key] || workOrders.filter(w => w.status === item.key).length || 0}
                </p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6" padding="sm">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search work orders..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'released', label: 'Released' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'on_hold', label: 'On Hold' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          />
          <Select
            options={[
              { value: '', label: 'All Projects' },
              ...projects.map(p => ({ value: p._id, label: p.title || p.name }))
            ]}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : workOrders.length === 0 ? (
          <EmptyState
            icon={Factory}
            title="No work orders found"
            description="Create your first work order from a BOM"
            action={() => setShowCreateModal(true)}
            actionLabel="New Work Order"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Work Order #</Table.Head>
                  <Table.Head>Item</Table.Head>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Qty</Table.Head>
                  <Table.Head>Schedule</Table.Head>
                  <Table.Head>Progress</Table.Head>
                  <Table.Head>Priority</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {workOrders.map((wo) => (
                  <Table.Row key={wo._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{wo.workOrderId}</p>
                        <p className="text-xs text-gray-500">{formatDate(wo.createdAt)}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{wo.item?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{wo.item?.skuCode || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm text-gray-900">{wo.project?.title || '-'}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{wo.quantity?.ordered || 0}</p>
                        <p className="text-xs text-gray-500">
                          {wo.quantity?.completed || 0} done
                        </p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-xs">
                        <p className="text-gray-900">{formatDate(wo.schedule?.startDate)} -</p>
                        <p className="text-gray-500">{formatDate(wo.schedule?.endDate)}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{wo.progress?.percentage || 0}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              wo.progress?.percentage >= 100 ? 'bg-green-500' :
                              wo.progress?.percentage >= 50 ? 'bg-amber-600' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${wo.progress?.percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={priorityColors[wo.priority] || 'gray'} size="sm">
                        {wo.priority?.toUpperCase() || 'MEDIUM'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[wo.status] || 'gray'}>
                        {wo.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Draft'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown
                        align="right"
                        trigger={
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        }
                      >
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/ppc/work-orders/${wo._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {wo.status === 'draft' && (
                          <>
                            <Dropdown.Item icon={Edit} onClick={() => navigate(`/admin/ppc/work-orders/${wo._id}/edit`)}>
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item icon={Send} onClick={() => handleRelease(wo._id)}>
                              Release
                            </Dropdown.Item>
                          </>
                        )}
                        {wo.status === 'released' && (
                          <Dropdown.Item icon={Play} onClick={() => handleStart(wo._id)}>
                            Start Production
                          </Dropdown.Item>
                        )}
                        {wo.status === 'in_progress' && (
                          <>
                            <Dropdown.Item icon={Pause} onClick={() => handleHold(wo._id)}>
                              Put On Hold
                            </Dropdown.Item>
                            <Dropdown.Item icon={CheckCircle} onClick={() => handleComplete(wo._id)}>
                              Complete
                            </Dropdown.Item>
                          </>
                        )}
                        {wo.status === 'on_hold' && (
                          <Dropdown.Item icon={Play} onClick={() => handleResume(wo._id)}>
                            Resume
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item icon={Package} onClick={() => navigate(`/admin/ppc/material-issues?workOrder=${wo._id}`)}>
                          Material Issues
                        </Dropdown.Item>
                        {['draft', 'released'].includes(wo.status) && (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item icon={XCircle} onClick={() => handleCancel(wo._id)} className="text-orange-600">
                              Cancel
                            </Dropdown.Item>
                            <Dropdown.Item icon={Trash2} onClick={() => handleDelete(wo._id)} className="text-red-600">
                              Delete
                            </Dropdown.Item>
                          </>
                        )}
                      </Dropdown>
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

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Work Order" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Project"
            options={[
              { value: '', label: 'Select Project' },
              ...projects.map(p => ({ value: p._id, label: `${p.title || p.name} (${p.projectId || ''})` }))
            ]}
            value={formData.project}
            onChange={(e) => {
              setFormData({ ...formData, project: e.target.value, bom: '' })
              loadBoms(e.target.value)
            }}
            required
          />
          <Select
            label="Bill of Materials"
            options={[
              { value: '', label: 'Select BOM' },
              ...boms.map(b => ({ value: b._id, label: `${b.bomId} - ${b.item?.name || b.name}` }))
            ]}
            value={formData.bom}
            onChange={(e) => setFormData({ ...formData, bom: e.target.value })}
            required
            disabled={!formData.project}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
            <Select
              label="Priority"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' }
              ]}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Work Order</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default WorkOrders
