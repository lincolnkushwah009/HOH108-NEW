import { useState, useEffect } from 'react'
import { CheckSquare, CheckCircle, XCircle, Clock, AlertCircle, FileText, ClipboardList, Receipt, Calendar } from 'lucide-react'
import { approvalsAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Tabs } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatDateTime, formatCurrency } from '../../utils/helpers'

const ApprovalsList = () => {
  const [approvals, setApprovals] = useState([])
  const [allApprovals, setAllApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    loadApprovals()
  }, [activeTab])

  const loadApprovals = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch pending approvals from API
      const response = await approvalsAPI.getPending()
      const data = response.data || []
      setAllApprovals(data)

      // Filter based on tab
      let filtered = data
      if (activeTab === 'pending') {
        filtered = data.filter(a => a.status === 'pending' || a.status === 'Pending' || a.status === 'pending_approval')
      } else if (activeTab === 'approved') {
        filtered = data.filter(a => a.status === 'approved' || a.status === 'Approved')
      } else if (activeTab === 'rejected') {
        filtered = data.filter(a => a.status === 'rejected' || a.status === 'Rejected')
      }

      setApprovals(filtered)
    } catch (err) {
      console.error('Failed to load approvals:', err)
      setError(err.message || 'Failed to load approvals')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (agreementId, itemId) => {
    try {
      await approvalsAPI.approveItem(agreementId, itemId, { status: 'approved', comment: 'Approved' })
      loadApprovals()
    } catch (err) {
      console.error('Failed to approve:', err)
      alert(err.message || 'Failed to approve')
    }
  }

  const handleReject = async (agreementId, itemId) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await approvalsAPI.approveItem(agreementId, itemId, { status: 'rejected', comment: reason })
      loadApprovals()
    } catch (err) {
      console.error('Failed to reject:', err)
      alert(err.message || 'Failed to reject')
    }
  }

  const transactionTypeConfig = {
    PurchaseRequisition: { icon: ClipboardList, label: 'Purchase Requisition', color: 'blue' },
    PurchaseOrder: { icon: FileText, label: 'Purchase Order', color: 'purple' },
    VendorInvoice: { icon: Receipt, label: 'Vendor Invoice', color: 'orange' },
    LeaveRequest: { icon: Calendar, label: 'Leave Request', color: 'green' },
    SalesOrder: { icon: FileText, label: 'Sales Order', color: 'cyan' },
    ExpenseReimbursement: { icon: Receipt, label: 'Expense', color: 'yellow' },
  }

  const statusColors = {
    Pending: 'yellow',
    Approved: 'green',
    Rejected: 'red',
    Escalated: 'orange',
    Cancelled: 'gray',
  }

  // Calculate stats from actual data
  const stats = {
    pending: allApprovals.filter(a => a.status === 'pending' || a.status === 'Pending' || a.status === 'pending_approval').length,
    approved: allApprovals.filter(a => a.status === 'approved' || a.status === 'Approved').length,
    rejected: allApprovals.filter(a => a.status === 'rejected' || a.status === 'Rejected').length,
    escalated: allApprovals.filter(a => a.status === 'escalated' || a.status === 'Escalated').length,
  }

  const tabs = [
    { id: 'pending', label: `Pending (${stats.pending})` },
    { id: 'approved', label: `Approved (${stats.approved})` },
    { id: 'rejected', label: `Rejected (${stats.rejected})` },
    { id: 'all', label: 'All' },
  ]

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Review and approve pending requests"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Approvals' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
              <p className="text-sm text-gray-500">Approved Today</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
              <p className="text-sm text-gray-500">Rejected Today</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.escalated}</p>
              <p className="text-sm text-gray-500">Escalated</p>
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : approvals.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={`No ${activeTab} approvals`}
            description={activeTab === 'pending' ? 'All caught up! No pending approvals.' : `No ${activeTab} approvals found.`}
          />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Request</Table.Head>
                <Table.Head>Type</Table.Head>
                <Table.Head>Requested By</Table.Head>
                <Table.Head>Amount</Table.Head>
                <Table.Head>Request Date</Table.Head>
                <Table.Head>Level</Table.Head>
                <Table.Head>Status</Table.Head>
                {activeTab === 'pending' && <Table.Head>Actions</Table.Head>}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {approvals.map((approval) => {
                const typeConfig = transactionTypeConfig[approval.transactionType] || {}
                const TypeIcon = typeConfig.icon || FileText
                return (
                  <Table.Row key={approval._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{approval.transactionRef}</p>
                        <p className="text-sm text-gray-500">{approval.description}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded bg-${typeConfig.color}-100`}>
                          <TypeIcon className={`h-4 w-4 text-${typeConfig.color}-600`} />
                        </div>
                        <Badge color={typeConfig.color || 'gray'}>
                          {typeConfig.label || approval.transactionType}
                        </Badge>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">
                          {approval.requestedBy.firstName} {approval.requestedBy.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{approval.requestedBy.department}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {approval.amount ? (
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(approval.amount)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(approval.requestDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-600">Level {approval.currentLevel}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[approval.status] || 'gray'}>
                        {approval.status}
                      </Badge>
                    </Table.Cell>
                    {activeTab === 'pending' && (
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            icon={CheckCircle}
                            onClick={() => handleApprove(approval._id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={XCircle}
                            onClick={() => handleReject(approval._id)}
                          >
                            Reject
                          </Button>
                        </div>
                      </Table.Cell>
                    )}
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        )}
      </Card>
    </div>
  )
}

export default ApprovalsList
