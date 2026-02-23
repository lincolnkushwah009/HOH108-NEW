import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, FileText, Eye, Edit, Send, Copy, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { quotationsAPI } from '../../utils/api'

const Quotations = () => {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ total: 0, totalValue: 0, accepted: 0, pending: 0, conversionRate: 0 })

  useEffect(() => {
    loadQuotations()
  }, [pagination.page, search, statusFilter])

  const loadQuotations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await quotationsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter
      })
      setQuotations(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
      // Calculate stats from response
      if (response.stats) {
        const statsMap = {}
        response.stats.forEach(s => { statsMap[s._id] = s })
        const total = response.pagination?.total || 0
        const accepted = statsMap['accepted']?.count || 0
        setStats({
          total,
          totalValue: Object.values(statsMap).reduce((sum, s) => sum + (s.total || 0), 0),
          accepted,
          pending: (statsMap['draft']?.count || 0) + (statsMap['sent']?.count || 0) + (statsMap['viewed']?.count || 0) + (statsMap['negotiating']?.count || 0),
          conversionRate: total > 0 ? Math.round((accepted / total) * 100) : 0
        })
      }
    } catch (err) {
      console.error('Failed to load quotations:', err)
      setError('Failed to load quotations')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (id) => {
    try {
      await quotationsAPI.send(id)
      loadQuotations()
    } catch (err) {
      console.error('Failed to send quotation:', err)
    }
  }

  const handleConvert = async (id) => {
    try {
      await quotationsAPI.convert(id)
      loadQuotations()
    } catch (err) {
      console.error('Failed to convert quotation:', err)
    }
  }

  const handleRevision = async (id) => {
    try {
      const response = await quotationsAPI.createRevision(id)
      navigate(`/admin/quotations/${response.data._id}/edit`)
    } catch (err) {
      console.error('Failed to create revision:', err)
    }
  }

  const statusColors = {
    draft: 'gray',
    sent: 'blue',
    viewed: 'purple',
    negotiating: 'yellow',
    accepted: 'green',
    rejected: 'red',
    expired: 'orange',
    converted: 'green',
  }

  const statusLabels = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    negotiating: 'Negotiating',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    converted: 'Converted',
  }

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Create and manage customer quotations"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Sales' }, { label: 'Quotations' }]}
        actions={<Button icon={Plus} onClick={() => navigate('/admin/quotations/new')}>New Quotation</Button>}
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
              <p className="text-sm text-gray-500">Total Quotes</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <FileText className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText className="h-5 w-5 text-amber-700" />
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
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.conversionRate}%</p>
              <p className="text-sm text-gray-500">Conversion Rate</p>
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
            placeholder="Search quotation, customer..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'viewed', label: 'Viewed' },
              { value: 'negotiating', label: 'Negotiating' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'rejected', label: 'Rejected' },
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
        ) : quotations.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No quotations found"
            description="Create your first quotation"
            action={() => navigate('/admin/quotations/new')}
            actionLabel="New Quotation"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Quotation #</Table.Head>
                  <Table.Head>Customer</Table.Head>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Date</Table.Head>
                  <Table.Head>Valid Until</Table.Head>
                  <Table.Head>Amount</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {quotations.map((quote) => (
                  <Table.Row key={quote._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{quote.quotationNumber}</p>
                        <p className="text-xs text-gray-500">Rev {quote.revision} • {quote.items?.length || 0} item(s)</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{quote.customer?.name || quote.lead?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{quote.customer?.customerId || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {quote.project ? (
                        <div>
                          <p className="text-sm text-gray-900">{quote.project?.title || ''}</p>
                          <p className="text-xs text-gray-500">{quote.project?.projectId || ''}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(quote.quotationDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`text-sm ${quote.status === 'expired' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {formatDate(quote.validUntil)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(quote.totalAmount)}</p>
                        {quote.discountAmount > 0 && (
                          <p className="text-xs text-green-600">-{formatCurrency(quote.discountAmount)} discount</p>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[quote.status] || 'gray'}>
                        {statusLabels[quote.status] || quote.status}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/quotations/${quote._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {quote.status === 'draft' && (
                          <>
                            <Dropdown.Item icon={Edit} onClick={() => navigate(`/admin/quotations/${quote._id}/edit`)}>Edit</Dropdown.Item>
                            <Dropdown.Item icon={Send} onClick={() => handleSend(quote._id)}>Send to Customer</Dropdown.Item>
                          </>
                        )}
                        <Dropdown.Item icon={Copy} onClick={() => handleRevision(quote._id)}>Create Revision</Dropdown.Item>
                        {quote.status === 'accepted' && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => handleConvert(quote._id)}>Convert to Order</Dropdown.Item>
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

export default Quotations
