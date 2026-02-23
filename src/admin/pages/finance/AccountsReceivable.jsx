import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, IndianRupee, Eye, Send, Phone, Mail, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { customerInvoicesAPI } from '../../utils/api'

const AccountsReceivable = () => {
  const navigate = useNavigate()
  const [receivables, setReceivables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [agingFilter, setAgingFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ totalOutstanding: 0, currentDue: 0, overdue: 0, critical: 0 })
  const [sendingReminders, setSendingReminders] = useState(false)
  const [sendingReminderId, setSendingReminderId] = useState(null)

  useEffect(() => {
    loadReceivables()
  }, [pagination.page, search, agingFilter])

  const loadReceivables = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use customer invoices API to get unpaid/overdue invoices
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      }
      // Filter for unpaid invoices
      if (agingFilter === 'overdue') {
        params.paymentStatus = 'overdue'
      } else if (agingFilter) {
        params.paymentStatus = agingFilter
      }

      const response = await customerInvoicesAPI.getAll(params)
      // Filter to only show invoices with outstanding balance
      const invoicesWithBalance = (response.data || []).filter(inv => (inv.balanceAmount || 0) > 0)
      setReceivables(invoicesWithBalance)
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))

      // Calculate stats from response
      if (response.stats) {
        const statsMap = {}
        response.stats.forEach(s => { statsMap[s._id] = s })
        setStats({
          totalOutstanding: Object.values(statsMap).reduce((sum, s) => sum + (s.balance || 0), 0),
          currentDue: statsMap['unpaid']?.balance || 0,
          overdue: statsMap['overdue']?.balance || 0,
          critical: statsMap['overdue']?.count || 0
        })
      }
    } catch (err) {
      console.error('Failed to load receivables:', err)
      setError('Failed to load accounts receivable')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReminder = async (invoiceId) => {
    setSendingReminderId(invoiceId)
    try {
      const res = await customerInvoicesAPI.sendReminder(invoiceId)
      if (res.success) {
        alert(res.message || 'Reminder sent successfully')
        loadReceivables()
      }
    } catch (err) {
      console.error('Failed to send reminder:', err)
      alert(err.message || 'Failed to send reminder')
    } finally {
      setSendingReminderId(null)
    }
  }

  const handleSendAllReminders = async () => {
    const overdueInvoices = receivables.filter(inv =>
      inv.paymentStatus === 'overdue' || inv.paymentStatus === 'unpaid'
    )
    if (overdueInvoices.length === 0) {
      alert('No outstanding invoices to send reminders for')
      return
    }
    if (!confirm(`Send payment reminders for ${overdueInvoices.length} outstanding invoice(s)?`)) return
    setSendingReminders(true)
    let sent = 0
    for (const inv of overdueInvoices) {
      try {
        await customerInvoicesAPI.sendReminder(inv._id)
        sent++
      } catch (err) {
        console.error(`Failed to send reminder for ${inv.invoiceNumber}:`, err)
      }
    }
    alert(`Reminders sent for ${sent} of ${overdueInvoices.length} invoices`)
    setSendingReminders(false)
    loadReceivables()
  }

  const statusColors = {
    unpaid: 'yellow',
    partially_paid: 'blue',
    paid: 'green',
    overdue: 'red',
  }

  const statusLabels = {
    unpaid: 'Unpaid',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    overdue: 'Overdue',
  }

  return (
    <div>
      <PageHeader
        title="Accounts Receivable"
        description="Track and manage customer outstanding payments"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Finance' }, { label: 'Accounts Receivable' }]}
        actions={<Button icon={Send} onClick={handleSendAllReminders} disabled={sendingReminders}>{sendingReminders ? 'Sending...' : 'Send Reminders'}</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <IndianRupee className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalOutstanding)}</p>
              <p className="text-sm text-gray-500">Total Outstanding</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.currentDue)}</p>
              <p className="text-sm text-gray-500">Current</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.overdue)}</p>
              <p className="text-sm text-gray-500">Overdue</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.critical}</p>
              <p className="text-sm text-gray-500">Critical Accounts</p>
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
            placeholder="Search customer..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'partially_paid', label: 'Partially Paid' },
              { value: 'overdue', label: 'Overdue' },
            ]}
            value={agingFilter}
            onChange={(e) => setAgingFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : receivables.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No receivables found"
            description="All customer accounts are settled"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Invoice #</Table.Head>
                  <Table.Head>Customer</Table.Head>
                  <Table.Head>Invoice Date</Table.Head>
                  <Table.Head>Due Date</Table.Head>
                  <Table.Head>Total</Table.Head>
                  <Table.Head>Paid</Table.Head>
                  <Table.Head>Balance</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {receivables.map((invoice) => (
                  <Table.Row key={invoice._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{invoice.customer?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{invoice.customer?.customerId || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(invoice.invoiceDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`text-sm ${invoice.paymentStatus === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {formatDate(invoice.dueDate)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.invoiceTotal || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-green-600">
                        {formatCurrency(invoice.paidAmount || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-semibold text-orange-600">
                        {formatCurrency(invoice.balanceAmount || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[invoice.paymentStatus] || 'gray'}>
                        {statusLabels[invoice.paymentStatus] || invoice.paymentStatus}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/customer-invoices/${invoice._id}`)}>
                          View Invoice
                        </Dropdown.Item>
                        <Dropdown.Item icon={Mail} onClick={() => handleSendReminder(invoice._id)} disabled={sendingReminderId === invoice._id}>
                          {sendingReminderId === invoice._id ? 'Sending...' : 'Send Reminder'}
                        </Dropdown.Item>
                        <Dropdown.Item icon={CheckCircle} onClick={() => navigate(`/admin/customer-invoices/${invoice._id}/payment`)}>Record Payment</Dropdown.Item>
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
    </div>
  )
}

export default AccountsReceivable
