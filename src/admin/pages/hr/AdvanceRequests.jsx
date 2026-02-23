import { useState, useEffect } from 'react'
import { Plus, Eye, CheckCircle, XCircle, Clock, DollarSign, Users, Wallet, AlertTriangle, MoreVertical, Send, RefreshCw, UserPlus } from 'lucide-react'
import { advanceRequestsAPI, employeesAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Avatar, SearchInput, Pagination, Dropdown, Modal, Input, Select, Tabs, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'

const ADVANCE_TYPES = [
  { value: 'salary_advance', label: 'Salary Advance' },
  { value: 'travel_advance', label: 'Travel Advance' },
  { value: 'project_advance', label: 'Project Advance' },
  { value: 'emergency_advance', label: 'Emergency Advance' },
  { value: 'other', label: 'Other' }
]

const RECOVERY_MODES = [
  { value: 'single_deduction', label: 'Single Deduction' },
  { value: 'emi', label: 'Monthly EMI' },
  { value: 'project_completion', label: 'On Project Completion' }
]

const STATUS_COLORS = {
  draft: 'gray',
  pending_manager: 'yellow',
  pending_hr: 'blue',
  pending_final: 'purple',
  approved: 'green',
  rejected: 'red',
  disbursed: 'teal',
  recovering: 'orange',
  closed: 'gray'
}

const STATUS_LABELS = {
  draft: 'Draft',
  pending_manager: 'Pending Manager',
  pending_hr: 'Pending HR',
  pending_final: 'Pending Final',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Disbursed',
  recovering: 'Recovering',
  closed: 'Closed'
}

const AdvanceRequests = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [activeTab, setActiveTab] = useState('all')
  const [stats, setStats] = useState(null)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showDisbursementModal, setShowDisbursementModal] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [showTagHRModal, setShowTagHRModal] = useState(false)

  const [selectedRequest, setSelectedRequest] = useState(null)
  const [formData, setFormData] = useState({
    employee: '',
    advanceType: 'salary_advance',
    requestedAmount: '',
    purpose: '',
    repaymentPlan: 'single_deduction',
    emiMonths: 1,
    deductionStartMonth: ''
  })
  const [approvalData, setApprovalData] = useState({ comment: '', approvedAmount: '' })
  const [disbursementData, setDisbursementData] = useState({
    paymentMethod: 'bank_transfer',
    transactionReference: '',
    notes: ''
  })
  const [recoveryData, setRecoveryData] = useState({
    amount: '',
    recoveryDate: new Date().toISOString().split('T')[0],
    payrollMonth: '',
    notes: ''
  })
  const [tagHRData, setTagHRData] = useState({ userId: '', notes: '' })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRequests()
    loadStats()
    loadEmployees()
  }, [pagination.page, search, statusFilter, activeTab])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit, search }
      if (statusFilter) params.status = statusFilter
      if (activeTab === 'my-approvals') params.approvalLevel = 'pending'

      const response = await advanceRequestsAPI.getAll(params)
      setRequests(response.data || [])
      setPagination(prev => ({ ...prev, total: response.total || 0, totalPages: response.totalPages || 0 }))
    } catch (err) {
      console.error('Failed to load advance requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await advanceRequestsAPI.getStats()
      setStats(response.data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.getAll({ limit: 100 })
      setEmployees(response.data || [])
    } catch (err) {
      console.error('Failed to load employees:', err)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await advanceRequestsAPI.create(formData)
      setShowCreateModal(false)
      setFormData({
        employee: '',
        advanceType: 'salary_advance',
        requestedAmount: '',
        purpose: '',
        repaymentPlan: 'single_deduction',
        emiMonths: 1,
        deductionStartMonth: ''
      })
      loadRequests()
      loadStats()
    } catch (err) {
      console.error('Failed to create advance request:', err)
      setError(err.message || 'Failed to create request')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (id) => {
    try {
      await advanceRequestsAPI.submit(id)
      loadRequests()
      loadStats()
    } catch (err) {
      console.error('Failed to submit request:', err)
      alert(err.message || 'Failed to submit request')
    }
  }

  const handleApprove = async (level) => {
    setSaving(true)
    setError('')
    try {
      const data = {
        comment: approvalData.comment,
        ...(approvalData.approvedAmount && { approvedAmount: parseFloat(approvalData.approvedAmount) })
      }

      if (level === 'manager') {
        await advanceRequestsAPI.managerApprove(selectedRequest._id, data)
      } else if (level === 'hr') {
        await advanceRequestsAPI.hrApprove(selectedRequest._id, data)
      } else if (level === 'final') {
        await advanceRequestsAPI.finalApprove(selectedRequest._id, data)
      }

      setShowApprovalModal(false)
      setSelectedRequest(null)
      loadRequests()
      loadStats()
    } catch (err) {
      console.error('Failed to approve request:', err)
      setError(err.message || 'Failed to approve request')
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async (level) => {
    if (!approvalData.comment) {
      setError('Please provide a reason for rejection')
      return
    }
    setSaving(true)
    setError('')
    try {
      const data = { comment: approvalData.comment, status: 'rejected' }

      if (level === 'manager') {
        await advanceRequestsAPI.managerApprove(selectedRequest._id, data)
      } else if (level === 'hr') {
        await advanceRequestsAPI.hrApprove(selectedRequest._id, data)
      } else if (level === 'final') {
        await advanceRequestsAPI.finalApprove(selectedRequest._id, data)
      }

      setShowApprovalModal(false)
      setSelectedRequest(null)
      loadRequests()
      loadStats()
    } catch (err) {
      console.error('Failed to reject request:', err)
      setError(err.message || 'Failed to reject request')
    } finally {
      setSaving(false)
    }
  }

  const handleDisburse = async () => {
    setSaving(true)
    setError('')
    try {
      await advanceRequestsAPI.disburse(selectedRequest._id, disbursementData)
      setShowDisbursementModal(false)
      setSelectedRequest(null)
      loadRequests()
      loadStats()
    } catch (err) {
      console.error('Failed to disburse:', err)
      setError(err.message || 'Failed to disburse')
    } finally {
      setSaving(false)
    }
  }

  const handleRecovery = async () => {
    if (!recoveryData.amount || !recoveryData.payrollMonth) {
      setError('Please fill in all required fields')
      return
    }
    setSaving(true)
    setError('')
    try {
      await advanceRequestsAPI.recordRecovery(selectedRequest._id, {
        ...recoveryData,
        amount: parseFloat(recoveryData.amount)
      })
      setShowRecoveryModal(false)
      setSelectedRequest(null)
      loadRequests()
      loadStats()
    } catch (err) {
      console.error('Failed to record recovery:', err)
      setError(err.message || 'Failed to record recovery')
    } finally {
      setSaving(false)
    }
  }

  const handleTagHR = async () => {
    if (!tagHRData.userId) {
      setError('Please select an HR team member')
      return
    }
    setSaving(true)
    setError('')
    try {
      await advanceRequestsAPI.tagHR(selectedRequest._id, { userId: tagHRData.userId })
      setShowTagHRModal(false)
      setSelectedRequest(null)
      loadRequests()
    } catch (err) {
      console.error('Failed to tag HR:', err)
      setError(err.message || 'Failed to tag HR')
    } finally {
      setSaving(false)
    }
  }

  const handleView = async (id) => {
    try {
      const response = await advanceRequestsAPI.getOne(id)
      setSelectedRequest(response.data)
      setShowViewModal(true)
    } catch (err) {
      console.error('Failed to load request:', err)
    }
  }

  const openApprovalModal = (request, level) => {
    setSelectedRequest(request)
    setApprovalData({ comment: '', approvedAmount: request.approvedAmount || request.requestedAmount })
    setShowApprovalModal(true)
    setSelectedRequest({ ...request, approvalLevel: level })
  }

  const openDisbursementModal = (request) => {
    setSelectedRequest(request)
    setDisbursementData({ paymentMethod: 'bank_transfer', transactionReference: '', notes: '' })
    setShowDisbursementModal(true)
  }

  const openRecoveryModal = (request) => {
    setSelectedRequest(request)
    const suggestedAmount = request.recovery?.balanceRemaining || request.approvedAmount || request.requestedAmount
    const installmentAmount = request.emiMonths > 1
      ? Math.ceil(suggestedAmount / (request.emiMonths - (request.recovery?.recoveryEntries?.length || 0)))
      : suggestedAmount
    setRecoveryData({
      amount: installmentAmount.toString(),
      recoveryDate: new Date().toISOString().split('T')[0],
      payrollMonth: '',
      notes: ''
    })
    setShowRecoveryModal(true)
  }

  const openTagHRModal = (request) => {
    setSelectedRequest(request)
    setTagHRData({ userId: '', notes: '' })
    setShowTagHRModal(true)
  }

  const getApprovalLevel = (request) => {
    if (request.status === 'pending_manager') return 'manager'
    if (request.status === 'pending_hr') return 'hr'
    if (request.status === 'pending_final') return 'final'
    return null
  }

  const canApprove = (request, level) => {
    // Add role-based logic here
    if (level === 'manager' && user?.role === 'manager') return true
    if (level === 'hr' && (user?.role === 'hr' || user?.role === 'admin')) return true
    if (level === 'final' && (user?.role === 'super_admin' || user?.role === 'admin')) return true
    return user?.role === 'super_admin' || user?.role === 'admin'
  }

  const tabs = [
    { id: 'all', label: 'All Requests' },
    { id: 'my-approvals', label: 'My Approvals', count: stats?.pendingApprovals || 0 },
  ]

  const hrEmployees = employees.filter(e => e.role === 'hr' || e.role === 'admin' || e.role === 'super_admin')

  return (
    <div>
      <PageHeader
        title="Advance Requests"
        description="Manage salary and travel advance requests"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Advance Requests' }]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>New Request</Button>}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending || 0}</p>
                <p className="text-sm text-gray-500">Pending Approval</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.approved || 0}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Wallet className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalDisbursed || 0)}</p>
                <p className="text-sm text-gray-500">Total Disbursed</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <RefreshCw className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingRecovery || 0)}</p>
                <p className="text-sm text-gray-500">Pending Recovery</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Tabs tabs={tabs} defaultTab="all" onChange={setActiveTab} className="mb-6" />

      <Card className="mb-6" padding="sm">
        <div className="p-4 flex gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search requests..." className="flex-1 max-w-md" />
          <Select
            options={[{ value: '', label: 'All Status' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : requests.length === 0 ? (
          <EmptyState title="No advance requests found" description="Create your first advance request" action={() => setShowCreateModal(true)} actionLabel="New Request" />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Request ID</Table.Head>
                  <Table.Head>Employee</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Amount</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Recovery</Table.Head>
                  <Table.Head>Date</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {requests.map((req) => (
                  <Table.Row key={req._id}>
                    <Table.Cell>
                      <span className="font-mono text-sm text-gray-900">{req.requestId}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Avatar name={req.employee?.name} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{req.employee?.name}</p>
                          <p className="text-xs text-gray-500">{req.employee?.department?.name}</p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-600">
                        {ADVANCE_TYPES.find(t => t.value === req.advanceType)?.label || req.advanceType}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(req.requestedAmount)}</p>
                        {req.approvedAmount && req.approvedAmount !== req.requestedAmount && (
                          <p className="text-xs text-green-600">Approved: {formatCurrency(req.approvedAmount)}</p>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={STATUS_COLORS[req.status]} size="sm">
                        {STATUS_LABELS[req.status]}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {req.recovery ? (
                        <div className="text-sm">
                          <p className="text-gray-600">{formatCurrency(req.recovery.totalRecovered)} / {formatCurrency(req.approvedAmount || req.requestedAmount)}</p>
                          <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${Math.min(100, (req.recovery.totalRecovered / (req.approvedAmount || req.requestedAmount)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(req.createdAt)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown align="right" trigger={<button className="p-1 hover:bg-gray-100 rounded"><MoreVertical className="h-4 w-4 text-gray-400" /></button>}>
                        <Dropdown.Item icon={Eye} onClick={() => handleView(req._id)}>View Details</Dropdown.Item>
                        {req.status === 'draft' && (
                          <Dropdown.Item icon={Send} onClick={() => handleSubmit(req._id)}>Submit for Approval</Dropdown.Item>
                        )}
                        {getApprovalLevel(req) && canApprove(req, getApprovalLevel(req)) && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => openApprovalModal(req, getApprovalLevel(req))}>Approve/Reject</Dropdown.Item>
                        )}
                        {req.status === 'approved' && (
                          <Dropdown.Item icon={DollarSign} onClick={() => openDisbursementModal(req)}>Disburse</Dropdown.Item>
                        )}
                        {(req.status === 'disbursed' || req.status === 'recovering') && (
                          <Dropdown.Item icon={RefreshCw} onClick={() => openRecoveryModal(req)}>Record Recovery</Dropdown.Item>
                        )}
                        {['pending_manager', 'pending_hr', 'pending_final'].includes(req.status) && (
                          <Dropdown.Item icon={UserPlus} onClick={() => openTagHRModal(req)}>Tag HR Team</Dropdown.Item>
                        )}
                      </Dropdown>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} />
          </>
        )}
      </Card>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Advance Request" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <Select
            label="Employee"
            options={[{ value: '', label: 'Select Employee' }, ...employees.map(e => ({ value: e._id, label: `${e.name} (${e.userId || e.employeeId || ''})` }))]}
            value={formData.employee}
            onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Advance Type"
              options={ADVANCE_TYPES}
              value={formData.advanceType}
              onChange={(e) => setFormData({ ...formData, advanceType: e.target.value })}
            />
            <Input
              label="Amount"
              type="number"
              value={formData.requestedAmount}
              onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
              placeholder="Enter amount"
              required
            />
          </div>
          <Textarea
            label="Purpose"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            placeholder="Explain the purpose for advance..."
            rows={3}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Repayment Plan"
              options={RECOVERY_MODES}
              value={formData.repaymentPlan}
              onChange={(e) => setFormData({ ...formData, repaymentPlan: e.target.value })}
            />
            {formData.repaymentPlan === 'emi' && (
              <Input
                label="Number of EMI Months"
                type="number"
                min="1"
                max="12"
                value={formData.emiMonths}
                onChange={(e) => setFormData({ ...formData, emiMonths: parseInt(e.target.value) })}
              />
            )}
          </div>
          <Input
            label="Deduction Start Month"
            type="month"
            value={formData.deductionStartMonth}
            onChange={(e) => setFormData({ ...formData, deductionStartMonth: e.target.value })}
          />
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Request</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedRequest(null) }} title="Advance Request Details" size="lg">
        {selectedRequest && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar name={selectedRequest.employee?.name} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900">{selectedRequest.employee?.name}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.requestId}</p>
                </div>
              </div>
              <Badge color={STATUS_COLORS[selectedRequest.status]} size="lg">
                {STATUS_LABELS[selectedRequest.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <p className="font-medium text-gray-900">
                  {ADVANCE_TYPES.find(t => t.value === selectedRequest.advanceType)?.label}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Requested Amount</p>
                <p className="font-medium text-gray-900">{formatCurrency(selectedRequest.requestedAmount)}</p>
              </div>
              {selectedRequest.approvedAmount && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 uppercase">Approved Amount</p>
                  <p className="font-medium text-green-700">{formatCurrency(selectedRequest.approvedAmount)}</p>
                </div>
              )}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Repayment Plan</p>
                <p className="font-medium text-gray-900">
                  {selectedRequest.repaymentPlan === 'emi'
                    ? `${selectedRequest.emiMonths || 1} Monthly EMIs`
                    : selectedRequest.repaymentPlan === 'project_completion'
                    ? 'On Project Completion'
                    : 'Single Deduction'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase mb-1">Purpose</p>
              <p className="text-gray-700">{selectedRequest.purpose}</p>
            </div>

            {/* Approval Timeline */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Approval Workflow</h4>
              <div className="space-y-3">
                {['managerApproval', 'hrApproval', 'finalApproval'].map((level, idx) => {
                  const approval = selectedRequest[level]
                  const levelLabels = { managerApproval: 'Manager', hrApproval: 'HR', finalApproval: 'Final' }
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        approval?.status === 'approved' ? 'bg-green-100' :
                        approval?.status === 'rejected' ? 'bg-red-100' :
                        approval?.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {approval?.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {approval?.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                        {approval?.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                        {!approval?.status && <span className="text-gray-400 text-sm">{idx + 1}</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{levelLabels[level]} Approval</p>
                        {approval?.approver && (
                          <p className="text-sm text-gray-500">
                            {approval.approver.name} - {formatDate(approval.actionAt)}
                          </p>
                        )}
                        {approval?.comment && (
                          <p className="text-sm text-gray-600 italic">"{approval.comment}"</p>
                        )}
                      </div>
                      <Badge color={
                        approval?.status === 'approved' ? 'green' :
                        approval?.status === 'rejected' ? 'red' :
                        approval?.status === 'pending' ? 'yellow' : 'gray'
                      } size="sm">
                        {approval?.status || 'Waiting'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recovery Progress */}
            {selectedRequest.recovery && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recovery Progress</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Recovered</span>
                    <span className="font-medium">{formatCurrency(selectedRequest.recovery.totalRecovered)} / {formatCurrency(selectedRequest.approvedAmount)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min(100, (selectedRequest.recovery.totalRecovered / selectedRequest.approvedAmount) * 100)}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Balance: {formatCurrency(selectedRequest.recovery.balanceRemaining)}
                  </p>
                  {selectedRequest.recovery.recoveryEntries?.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Recovery Entries</p>
                      {selectedRequest.recovery.recoveryEntries.map((entry, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <span className="text-gray-600">{entry.payrollMonth}</span>
                          <span className="font-medium">{formatCurrency(entry.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowViewModal(false); setSelectedRequest(null) }}>Close</Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal isOpen={showApprovalModal} onClose={() => { setShowApprovalModal(false); setSelectedRequest(null); setError('') }} title="Approve/Reject Request">
        {selectedRequest && (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Request from</p>
              <p className="font-medium text-gray-900">{selectedRequest.employee?.name}</p>
              <p className="text-lg font-bold text-gray-900 mt-2">{formatCurrency(selectedRequest.requestedAmount)}</p>
              <p className="text-sm text-gray-600">{selectedRequest.purpose}</p>
            </div>
            <Input
              label="Approved Amount (optional - leave empty to approve full amount)"
              type="number"
              value={approvalData.approvedAmount}
              onChange={(e) => setApprovalData({ ...approvalData, approvedAmount: e.target.value })}
              placeholder={selectedRequest.requestedAmount?.toString()}
            />
            <Textarea
              label="Comments"
              value={approvalData.comment}
              onChange={(e) => setApprovalData({ ...approvalData, comment: e.target.value })}
              placeholder="Add your comments..."
              rows={3}
            />
            <Modal.Footer>
              <Button variant="danger" onClick={() => handleReject(selectedRequest.approvalLevel)} loading={saving}>
                Reject
              </Button>
              <Button onClick={() => handleApprove(selectedRequest.approvalLevel)} loading={saving}>
                Approve
              </Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>

      {/* Disbursement Modal */}
      <Modal isOpen={showDisbursementModal} onClose={() => { setShowDisbursementModal(false); setSelectedRequest(null); setError('') }} title="Disburse Advance">
        {selectedRequest && (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Amount to Disburse</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(selectedRequest.approvedAmount || selectedRequest.requestedAmount)}</p>
              <p className="text-sm text-green-600 mt-1">To: {selectedRequest.employee?.name}</p>
            </div>
            <Select
              label="Payment Method"
              options={[
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'cash', label: 'Cash' }
              ]}
              value={disbursementData.paymentMethod}
              onChange={(e) => setDisbursementData({ ...disbursementData, paymentMethod: e.target.value })}
            />
            <Input
              label="Transaction Reference"
              value={disbursementData.transactionReference}
              onChange={(e) => setDisbursementData({ ...disbursementData, transactionReference: e.target.value })}
              placeholder="UTR / Cheque No / Reference"
            />
            <Textarea
              label="Notes"
              value={disbursementData.notes}
              onChange={(e) => setDisbursementData({ ...disbursementData, notes: e.target.value })}
              rows={2}
            />
            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowDisbursementModal(false); setSelectedRequest(null) }}>Cancel</Button>
              <Button onClick={handleDisburse} loading={saving}>Confirm Disbursement</Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>

      {/* Recovery Modal */}
      <Modal isOpen={showRecoveryModal} onClose={() => { setShowRecoveryModal(false); setSelectedRequest(null); setError('') }} title="Record Recovery">
        {selectedRequest && (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-700">Balance Remaining</p>
              <p className="text-2xl font-bold text-amber-800">
                {formatCurrency(selectedRequest.recovery?.balanceRemaining || selectedRequest.approvedAmount)}
              </p>
            </div>
            <Input
              label="Recovery Amount"
              type="number"
              value={recoveryData.amount}
              onChange={(e) => setRecoveryData({ ...recoveryData, amount: e.target.value })}
              required
            />
            <Input
              label="Payroll Month"
              type="month"
              value={recoveryData.payrollMonth}
              onChange={(e) => setRecoveryData({ ...recoveryData, payrollMonth: e.target.value })}
              required
            />
            <Input
              label="Recovery Date"
              type="date"
              value={recoveryData.recoveryDate}
              onChange={(e) => setRecoveryData({ ...recoveryData, recoveryDate: e.target.value })}
            />
            <Textarea
              label="Notes"
              value={recoveryData.notes}
              onChange={(e) => setRecoveryData({ ...recoveryData, notes: e.target.value })}
              rows={2}
            />
            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowRecoveryModal(false); setSelectedRequest(null) }}>Cancel</Button>
              <Button onClick={handleRecovery} loading={saving}>Record Recovery</Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>

      {/* Tag HR Modal */}
      <Modal isOpen={showTagHRModal} onClose={() => { setShowTagHRModal(false); setSelectedRequest(null); setError('') }} title="Tag HR Team Member">
        {selectedRequest && (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <Select
              label="Select HR Team Member"
              options={[{ value: '', label: 'Select...' }, ...hrEmployees.map(e => ({ value: e._id, label: e.name }))]}
              value={tagHRData.userId}
              onChange={(e) => setTagHRData({ ...tagHRData, userId: e.target.value })}
            />
            {selectedRequest.hrTeamTagged?.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Already tagged:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.hrTeamTagged.map((tag, idx) => (
                    <Badge key={idx} color="blue" size="sm">{tag.user?.name || 'HR Member'}</Badge>
                  ))}
                </div>
              </div>
            )}
            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowTagHRModal(false); setSelectedRequest(null) }}>Cancel</Button>
              <Button onClick={handleTagHR} loading={saving}>Tag HR</Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdvanceRequests
