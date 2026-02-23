import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, MoreVertical, Users, Eye, Edit, Trash2, CheckCircle, XCircle,
  Clock, DollarSign, TrendingUp
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { laborEntriesAPI, workOrdersAPI, employeesAPI } from '../../utils/api'

const LaborEntries = () => {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [workOrderFilter, setWorkOrderFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [workOrders, setWorkOrders] = useState([])
  const [employees, setEmployees] = useState([])
  const [formData, setFormData] = useState({
    workOrder: '',
    employee: '',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: '',
    overtimeHours: '',
    activity: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [selectedEntries, setSelectedEntries] = useState([])

  useEffect(() => {
    loadEntries()
  }, [pagination.page, search, statusFilter, workOrderFilter, dateFilter])

  useEffect(() => {
    loadWorkOrdersAndEmployees()
  }, [])

  const loadWorkOrdersAndEmployees = async () => {
    try {
      const [woRes, empRes] = await Promise.all([
        workOrdersAPI.getAll({ limit: 100, status: 'in_progress' }),
        employeesAPI.getAll({ limit: 200, status: 'active' })
      ])
      setWorkOrders(woRes.data || [])
      setEmployees(empRes.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const loadEntries = async () => {
    setLoading(true)
    try {
      const response = await laborEntriesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        workOrder: workOrderFilter,
        date: dateFilter
      })
      setEntries(response.data || [])
      setStats(response.stats || {})
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const employee = employees.find(emp => emp._id === formData.employee)
      await laborEntriesAPI.create({
        workOrder: formData.workOrder,
        employee: formData.employee,
        employeeName: employee?.name,
        employeeCode: employee?.employeeId,
        date: formData.date,
        hours: {
          regular: parseFloat(formData.hoursWorked) || 0,
          overtime: parseFloat(formData.overtimeHours) || 0
        },
        activity: formData.activity,
        notes: formData.notes
      })
      setShowCreateModal(false)
      setFormData({
        workOrder: '',
        employee: '',
        date: new Date().toISOString().split('T')[0],
        hoursWorked: '',
        overtimeHours: '',
        activity: '',
        notes: ''
      })
      loadEntries()
    } catch (err) {
      console.error('Failed to create entry:', err)
      alert('Failed to create labor entry: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await laborEntriesAPI.approve(id)
      loadEntries()
    } catch (err) {
      console.error('Failed to approve:', err)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedEntries.length === 0) return
    try {
      await laborEntriesAPI.bulkApprove(selectedEntries)
      setSelectedEntries([])
      loadEntries()
    } catch (err) {
      console.error('Failed to bulk approve:', err)
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await laborEntriesAPI.reject(id, reason)
      loadEntries()
    } catch (err) {
      console.error('Failed to reject:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this labor entry?')) return
    try {
      await laborEntriesAPI.delete(id)
      loadEntries()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const toggleSelection = (id) => {
    setSelectedEntries(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const pendingIds = entries.filter(e => e.status === 'pending').map(e => e._id)
    if (selectedEntries.length === pendingIds.length) {
      setSelectedEntries([])
    } else {
      setSelectedEntries(pendingIds)
    }
  }

  const statusColors = {
    pending: 'yellow',
    approved: 'green',
    rejected: 'red'
  }

  const getTotalHours = () => {
    return entries.reduce((sum, e) => sum + (e.hours?.regular || 0) + (e.hours?.overtime || 0), 0)
  }

  const getTotalCost = () => {
    return entries.reduce((sum, e) => sum + (e.totalCost || 0), 0)
  }

  return (
    <div>
      <PageHeader
        title="Labor Entries"
        description="Track labor hours and productivity"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'PPC', path: '/admin/ppc' },
          { label: 'Labor Entries' }
        ]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>Log Labor</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{getTotalHours().toFixed(1)}</p>
              <p className="text-xs text-gray-500">Total Hours</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(getTotalCost())}</p>
              <p className="text-xs text-gray-500">Total Cost</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {entries.filter(e => e.status === 'pending').length}
              </p>
              <p className="text-xs text-gray-500">Pending Approval</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {entries.reduce((sum, e) => sum + (e.hours?.overtime || 0), 0).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">Overtime Hours</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6" padding="sm">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search entries..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          />
          <Select
            options={[
              { value: '', label: 'All Work Orders' },
              ...workOrders.map(wo => ({ value: wo._id, label: `${wo.workOrderId}` }))
            ]}
            value={workOrderFilter}
            onChange={(e) => setWorkOrderFilter(e.target.value)}
            className="w-44"
          />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-40"
          />
          {selectedEntries.length > 0 && (
            <Button icon={CheckCircle} onClick={handleBulkApprove} size="sm">
              Approve ({selectedEntries.length})
            </Button>
          )}
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No labor entries found"
            description="Log labor hours for production"
            action={() => setShowCreateModal(true)}
            actionLabel="Log Labor"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedEntries.length > 0 && selectedEntries.length === entries.filter(e => e.status === 'pending').length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </Table.Head>
                  <Table.Head>Entry #</Table.Head>
                  <Table.Head>Employee</Table.Head>
                  <Table.Head>Work Order</Table.Head>
                  <Table.Head>Date</Table.Head>
                  <Table.Head>Regular Hrs</Table.Head>
                  <Table.Head>OT Hrs</Table.Head>
                  <Table.Head>Activity</Table.Head>
                  <Table.Head>Cost</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {entries.map((entry) => (
                  <Table.Row key={entry._id}>
                    <Table.Cell>
                      <input
                        type="checkbox"
                        checked={selectedEntries.includes(entry._id)}
                        onChange={() => toggleSelection(entry._id)}
                        disabled={entry.status !== 'pending'}
                        className="rounded border-gray-300"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <p className="font-medium text-gray-900">{entry.entryId}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{entry.employee?.name || entry.employeeName || '-'}</p>
                        <p className="text-xs text-gray-500">{entry.employee?.employeeId || entry.employeeCode || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{entry.workOrder?.workOrderId || '-'}</p>
                        <p className="text-xs text-gray-500">{entry.workOrder?.item?.name || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">{formatDate(entry.date)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">{entry.hours?.regular || 0}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`text-sm font-medium ${(entry.hours?.overtime || 0) > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {entry.hours?.overtime || 0}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">{entry.activity || '-'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(entry.totalCost || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[entry.status] || 'gray'}>
                        {entry.status?.charAt(0).toUpperCase() + entry.status?.slice(1) || 'Pending'}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/ppc/labor-entries/${entry._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {entry.status === 'pending' && (
                          <>
                            <Dropdown.Item icon={Edit} onClick={() => navigate(`/admin/ppc/labor-entries/${entry._id}/edit`)}>
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item icon={CheckCircle} onClick={() => handleApprove(entry._id)}>
                              Approve
                            </Dropdown.Item>
                            <Dropdown.Item icon={XCircle} onClick={() => handleReject(entry._id)}>
                              Reject
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item icon={Trash2} onClick={() => handleDelete(entry._id)} className="text-red-600">
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
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Log Labor Entry" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Work Order"
            options={[
              { value: '', label: 'Select Work Order' },
              ...workOrders.map(wo => ({
                value: wo._id,
                label: `${wo.workOrderId} - ${wo.item?.name || ''}`
              }))
            ]}
            value={formData.workOrder}
            onChange={(e) => setFormData({ ...formData, workOrder: e.target.value })}
            required
          />
          <Select
            label="Employee"
            options={[
              { value: '', label: 'Select Employee' },
              ...employees.map(emp => ({
                value: emp._id,
                label: `${emp.name} (${emp.employeeId || ''}) - ${emp.department?.name || ''}`
              }))
            ]}
            value={formData.employee}
            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
            required
          />
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Regular Hours"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={formData.hoursWorked}
              onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
              required
            />
            <Input
              label="Overtime Hours"
              type="number"
              min="0"
              max="12"
              step="0.5"
              value={formData.overtimeHours}
              onChange={(e) => setFormData({ ...formData, overtimeHours: e.target.value })}
            />
          </div>
          <Input
            label="Activity / Task"
            value={formData.activity}
            onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
            placeholder="e.g., Cutting, Assembly, Finishing"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Log Entry</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default LaborEntries
