import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, FileText, Eye, Send, IndianRupee, Printer, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { customerInvoicesAPI } from '../../utils/api'

const CustomerInvoices = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ total: 0, totalAmount: 0, outstanding: 0, overdue: 0 })

  useEffect(() => {
    loadInvoices()
  }, [pagination.page, search, statusFilter])

  const loadInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await customerInvoicesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        paymentStatus: statusFilter
      })
      setInvoices(response.data || [])
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
          total: response.pagination?.total || 0,
          totalAmount: Object.values(statsMap).reduce((sum, s) => sum + (s.total || 0), 0),
          outstanding: Object.values(statsMap).reduce((sum, s) => sum + (s.balance || 0), 0),
          overdue: statsMap['overdue']?.balance || 0
        })
      }
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setError('Failed to load customer invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (id) => {
    try {
      await customerInvoicesAPI.send(id)
      loadInvoices()
    } catch (err) {
      console.error('Failed to send invoice:', err)
    }
  }

  const statusColors = {
    draft: 'gray',
    sent: 'blue',
    partially_paid: 'yellow',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray',
  }

  const statusLabels = {
    draft: 'Draft',
    sent: 'Sent',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    overdue: 'Overdue',
    cancelled: 'Cancelled',
  }

  return (
    <div>
      <PageHeader
        title="Customer Invoices"
        description="Manage customer invoices and billing"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Finance' }, { label: 'Customer Invoices' }]}
        actions={<Button icon={Plus} onClick={() => navigate('/admin/customer-invoices/new')}>New Invoice</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <FileText className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Invoices</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <IndianRupee className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-sm text-gray-500">Total Billed</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <IndianRupee className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.outstanding)}</p>
              <p className="text-sm text-gray-500">Outstanding</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <IndianRupee className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.overdue)}</p>
              <p className="text-sm text-gray-500">Overdue</p>
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
            placeholder="Search invoice, customer..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'partially_paid', label: 'Partially Paid' },
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices found"
            description="Create your first customer invoice"
            action={() => navigate('/admin/customer-invoices/new')}
            actionLabel="New Invoice"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Invoice #</Table.Head>
                  <Table.Head>Customer</Table.Head>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Invoice Date</Table.Head>
                  <Table.Head>Due Date</Table.Head>
                  <Table.Head>Total</Table.Head>
                  <Table.Head>Balance</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {invoices.map((invoice) => (
                  <Table.Row key={invoice._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        {invoice.salesOrder && (
                          <p className="text-xs text-gray-500">SO: {invoice.salesOrder?.orderNumber || ''}</p>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{invoice.customer?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{invoice.customer?.customerId || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {invoice.project ? (
                        <div>
                          <p className="text-sm text-gray-900">{invoice.project?.title || ''}</p>
                          <p className="text-xs text-gray-500">{invoice.project?.projectId || ''}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
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
                        {formatCurrency(invoice.invoiceTotal)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`text-sm font-medium ${invoice.balanceAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
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
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item icon={Printer} onClick={() => navigate(`/admin/customer-invoices/${invoice._id}`)}>
                          Print Invoice
                        </Dropdown.Item>
                        {invoice.status === 'draft' && (
                          <Dropdown.Item icon={Send} onClick={() => handleSend(invoice._id)}>Send to Customer</Dropdown.Item>
                        )}
                        {['unpaid', 'partially_paid', 'overdue'].includes(invoice.paymentStatus) && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => navigate(`/admin/customer-invoices/${invoice._id}`)}>Record Payment</Dropdown.Item>
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
    </div>
  )
}

export default CustomerInvoices
