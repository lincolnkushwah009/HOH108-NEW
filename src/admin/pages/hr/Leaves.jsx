import { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, Check, X } from 'lucide-react'
import { leavesAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Avatar, Tabs, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { LEAVE_TYPES, LEAVE_STATUSES } from '../../utils/constants'

const Leaves = () => {
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false,
    halfDayType: 'first_half',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Calculate duration between dates (excluding Sundays)
  const calculateDuration = (start, end, isHalfDay) => {
    if (!start || !end) return 0
    if (isHalfDay) return 0.5

    const startDate = new Date(start)
    const endDate = new Date(end)
    let days = 0
    const current = new Date(startDate)

    while (current <= endDate) {
      if (current.getDay() !== 0) days++ // Skip Sundays
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  const duration = calculateDuration(formData.startDate, formData.endDate, formData.isHalfDay)

  useEffect(() => {
    loadLeaves()
  }, [statusFilter])

  const loadLeaves = async () => {
    setLoading(true)
    try {
      const response = await leavesAPI.getAll({ status: statusFilter })
      setLeaves(response.data || [])
    } catch (err) {
      console.error('Failed to load leaves:', err)
      setLeaves([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await leavesAPI.approve(id, 'Approved')
      loadLeaves()
    } catch (err) {
      console.error('Failed to approve leave:', err)
      alert(err.message || 'Failed to approve leave')
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Please enter rejection reason:')
    if (!reason) return
    try {
      await leavesAPI.reject(id, reason)
      loadLeaves()
    } catch (err) {
      console.error('Failed to reject leave:', err)
      alert(err.message || 'Failed to reject leave')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await leavesAPI.create({
        ...formData,
        // If half day, set endDate same as startDate
        endDate: formData.isHalfDay ? formData.startDate : formData.endDate,
      })
      setShowCreateModal(false)
      setFormData({ leaveType: 'casual', startDate: '', endDate: '', reason: '', isHalfDay: false, halfDayType: 'first_half' })
      loadLeaves()
    } catch (err) {
      console.error('Failed to create leave:', err)
      setError(err.message || 'Failed to submit leave request')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ]

  const leaveTypeOptions = Object.entries(LEAVE_TYPES).map(([value, { label }]) => ({ value, label }))

  const pendingCount = Array.isArray(leaves) ? leaves.filter(l => l?.status === 'pending').length : 0
  const approvedCount = Array.isArray(leaves) ? leaves.filter(l => l?.status === 'approved').length : 0
  const rejectedCount = Array.isArray(leaves) ? leaves.filter(l => l?.status === 'rejected').length : 0

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Manage employee leave requests"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Leaves' }]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>Apply Leave</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{approvedCount}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{rejectedCount}</p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{Array.isArray(leaves) ? leaves.length : 0}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs tabs={tabs} defaultTab="pending" onChange={setStatusFilter} className="mb-6" />

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : !Array.isArray(leaves) || leaves.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No leave requests"
            description={`No ${statusFilter} leave requests found`}
          />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Employee</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head>Duration</Table.Head>
                <Table.Head>Reason</Table.Head>
                <Table.Head>Status</Table.Head>
                {statusFilter === 'pending' && <Table.Head>Actions</Table.Head>}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {leaves.map((leave) => (
                <Table.Row key={leave._id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <Avatar name={leave.employee?.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{leave.employee?.name}</p>
                        <p className="text-xs text-gray-500">{leave.leaveId}</p>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={LEAVE_TYPES[leave.leaveType]?.color || 'gray'}>
                      {LEAVE_TYPES[leave.leaveType]?.label || leave.leaveType}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      <p className="text-sm text-gray-900">
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </p>
                      <p className="text-xs text-gray-500">{leave.duration?.days || leave.duration || 0} day(s)</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <p className="text-sm text-gray-600 max-w-[200px] truncate">{leave.reason || '-'}</p>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={LEAVE_STATUSES[leave.status]?.color || 'gray'}>
                      {LEAVE_STATUSES[leave.status]?.label || leave.status}
                    </Badge>
                  </Table.Cell>
                  {statusFilter === 'pending' && (
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="success" onClick={() => handleApprove(leave._id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(leave._id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Table.Cell>
                  )}
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Apply Leave">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <Select label="Leave Type" options={leaveTypeOptions} value={formData.leaveType} onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })} />

          {/* Half Day Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isHalfDay"
              checked={formData.isHalfDay}
              onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
              className="h-4 w-4 text-amber-700 rounded border-gray-300 focus:ring-amber-600"
            />
            <label htmlFor="isHalfDay" className="text-sm font-medium text-gray-700">Half Day Leave</label>
          </div>

          {formData.isHalfDay && (
            <Select
              label="Half Day Type"
              options={[
                { value: 'first_half', label: 'First Half (Morning)' },
                { value: 'second_half', label: 'Second Half (Afternoon)' },
              ]}
              value={formData.halfDayType}
              onChange={(e) => setFormData({ ...formData, halfDayType: e.target.value })}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
            {!formData.isHalfDay && (
              <Input label="End Date" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required min={formData.startDate} />
            )}
          </div>

          {/* Duration Display */}
          {duration > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
              <p className="text-sm text-amber-800">
                <span className="font-medium">Duration:</span> {duration} day(s)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              required
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default Leaves
