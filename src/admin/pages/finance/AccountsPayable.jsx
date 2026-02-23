import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, IndianRupee, Eye, Send, CheckCircle, AlertTriangle, TrendingDown, Clock, Building2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { vendorInvoicesAPI } from '../../utils/api'

const AccountsPayable = () => {
  const navigate = useNavigate()
  const [payables, setPayables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [agingFilter, setAgingFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ totalPayable: 0, currentDue: 0, overdue: 0, urgent: 0 })

  useEffect(() => {
    loadPayables()
  }, [pagination.page, search, agingFilter])

  const loadPayables = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      }
      if (agingFilter === 'overdue') {
        params.paymentStatus = 'overdue'
      } else if (agingFilter) {
        params.paymentStatus = agingFilter
      }

      const response = await vendorInvoicesAPI.getAll(params)
      // Filter to only show invoices with outstanding balance
      const invoicesWithBalance = (response.data || []).filter(inv => (inv.balanceAmount || 0) > 0)
      setPayables(invoicesWithBalance)
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
          totalPayable: Object.values(statsMap).reduce((sum, s) => sum + (s.balance || 0), 0),
          currentDue: statsMap['unpaid']?.balance || 0,
          overdue: statsMap['overdue']?.balance || 0,
          urgent: statsMap['overdue']?.count || 0
        })
      }
    } catch (err) {
      console.error('Failed to load payables:', err)
      setError('Failed to load accounts payable')
    } finally {
      setLoading(false)
    }
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
        title="Accounts Payable"
        description="Track and manage vendor payments"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Finance' }, { label: 'Accounts Payable' }]}
        actions={<Button icon={Send} onClick={() => navigate('/admin/payments')}>Schedule Payments</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <IndianRupee className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalPayable)}</p>
              <p className="text-sm text-gray-500">Total Payable</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-green-600" />
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
              <p className="text-2xl font-semibold text-gray-900">{stats.urgent}</p>
              <p className="text-sm text-gray-500">Urgent/Disputed</p>
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
            placeholder="Search vendor..."
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
        ) : payables.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No payables found"
            description="All vendor accounts are settled"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Invoice #</Table.Head>
                  <Table.Head>Vendor</Table.Head>
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
                {payables.map((invoice) => (
                  <Table.Row key={invoice._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">{invoice.vendorInvoiceNumber || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{invoice.vendor?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{invoice.vendor?.vendorId || ''}</p>
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
                        {formatCurrency(invoice.grandTotal || 0)}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/vendor-invoices/${invoice._id}`)}>
                          View Invoice
                        </Dropdown.Item>
                        <Dropdown.Item icon={Building2} onClick={() => navigate(`/admin/vendors/${invoice.vendor?._id}`)}>View Vendor</Dropdown.Item>
                        <Dropdown.Item icon={Send} onClick={() => navigate(`/admin/payments/new?invoice=${invoice._id}`)}>Process Payment</Dropdown.Item>
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

export default AccountsPayable
