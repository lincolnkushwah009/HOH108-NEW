import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, FileText, Eye, Edit, Trash2, CheckCircle, XCircle, Truck } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { purchaseOrdersAPI } from '../../utils/api'

const PurchaseOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ total: 0, totalValue: 0, pending: 0, delivered: 0 })

  useEffect(() => {
    loadOrders()
  }, [pagination.page, search, statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await purchaseOrdersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter
      })
      setOrders(response.data || [])
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
          totalValue: Object.values(statsMap).reduce((sum, s) => sum + (s.total || 0), 0),
          pending: (statsMap['draft']?.count || 0) + (statsMap['submitted']?.count || 0) + (statsMap['approved']?.count || 0),
          delivered: statsMap['fully_delivered']?.count || 0
        })
      }
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await purchaseOrdersAPI.approve(id)
      loadOrders()
    } catch (err) {
      console.error('Failed to approve PO:', err)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this purchase order?')) return
    try {
      await purchaseOrdersAPI.cancel(id, { reason: 'Cancelled by user' })
      loadOrders()
    } catch (err) {
      console.error('Failed to cancel PO:', err)
    }
  }

  const statusColors = {
    draft: 'gray',
    submitted: 'blue',
    approved: 'green',
    rejected: 'red',
    sent: 'purple',
    partially_delivered: 'yellow',
    fully_delivered: 'green',
    cancelled: 'red',
  }

  const statusLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    sent: 'Sent',
    partially_delivered: 'Partial Delivery',
    fully_delivered: 'Fully Delivered',
    cancelled: 'Cancelled',
  }

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders to vendors"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Procurement' }, { label: 'Purchase Orders' }]}
        actions={<Button icon={Plus} onClick={() => navigate('/admin/purchase-orders/new')}>Create PO</Button>}
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
              <p className="text-sm text-gray-500">Total POs</p>
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
              <Truck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.delivered}</p>
              <p className="text-sm text-gray-500">Delivered</p>
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
            placeholder="Search PO number, vendor..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'approved', label: 'Approved' },
              { value: 'sent', label: 'Sent' },
              { value: 'partially_delivered', label: 'Partial Delivery' },
              { value: 'fully_delivered', label: 'Fully Delivered' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No purchase orders found"
            description="Create your first purchase order"
            action={() => navigate('/admin/purchase-orders/new')}
            actionLabel="Create PO"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>PO Number</Table.Head>
                  <Table.Head>Vendor</Table.Head>
                  <Table.Head>Items</Table.Head>
                  <Table.Head>PO Date</Table.Head>
                  <Table.Head>Delivery Date</Table.Head>
                  <Table.Head>Total</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.map((order) => (
                  <Table.Row key={order._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{order.poNumber}</p>
                        <p className="text-xs text-gray-500">By {order.createdBy?.name || 'Unknown'}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{order.vendor?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{order.vendor?.vendorId || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-600">{order.lineItems?.length || 0} item(s)</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(order.orderDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(order.expectedDeliveryDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.poTotal)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[order.status] || 'gray'}>
                        {statusLabels[order.status] || order.status}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/purchase-orders/${order._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {order.status === 'draft' && (
                          <>
                            <Dropdown.Item icon={Edit} onClick={() => navigate(`/admin/purchase-orders/${order._id}/edit`)}>Edit</Dropdown.Item>
                          </>
                        )}
                        {order.status === 'submitted' && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => handleApprove(order._id)}>Approve PO</Dropdown.Item>
                        )}
                        {['approved', 'sent'].includes(order.status) && (
                          <Dropdown.Item icon={Truck} onClick={() => navigate('/admin/goods-receipts/new?po=' + order._id)}>
                            Create GRN
                          </Dropdown.Item>
                        )}
                        {['draft', 'submitted'].includes(order.status) && (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item icon={XCircle} danger onClick={() => handleCancel(order._id)}>Cancel PO</Dropdown.Item>
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
    </div>
  )
}

export default PurchaseOrders
