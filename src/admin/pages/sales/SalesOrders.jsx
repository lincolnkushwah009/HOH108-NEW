import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, ShoppingCart, Eye, Edit, Truck, Receipt, CheckCircle } from 'lucide-react'
import { salesOrdersAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'

const SalesOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  useEffect(() => {
    loadOrders()
  }, [pagination.page, search, statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter

      const response = await salesOrdersAPI.getAll(params)
      setOrders(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load orders:', err)
      setError(err.message || 'Failed to load sales orders')
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    Draft: 'gray',
    Confirmed: 'blue',
    Processing: 'yellow',
    Picked: 'orange',
    Packed: 'purple',
    Shipped: 'cyan',
    Delivered: 'green',
    Invoiced: 'green',
    Paid: 'green',
    Completed: 'green',
  }

  const orderTypeColors = {
    SalesOrder: 'blue',
    ServiceOrder: 'purple',
    MaterialOrder: 'orange',
  }

  // Calculate stats
  const stats = {
    total: orders.length,
    totalValue: orders.reduce((sum, o) => sum + (o.orderTotal || 0), 0),
    pending: orders.filter(o => ['Draft', 'Confirmed', 'Processing'].includes(o.orderStatus)).length,
    delivered: orders.filter(o => ['Delivered', 'Invoiced', 'Paid', 'Completed'].includes(o.orderStatus)).length,
  }

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description="Manage customer orders and fulfillment"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Sales' }, { label: 'Sales Orders' }]}
        actions={<Button icon={Plus} onClick={() => navigate('/admin/sales-orders/new')}>New Order</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-yellow-600" />
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
            placeholder="Search order, customer..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Confirmed', label: 'Confirmed' },
              { value: 'Processing', label: 'Processing' },
              { value: 'Shipped', label: 'Shipped' },
              { value: 'Delivered', label: 'Delivered' },
              { value: 'Invoiced', label: 'Invoiced' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description="Create your first sales order"
            action={() => navigate('/admin/sales-orders/new')}
            actionLabel="New Order"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Order #</Table.Head>
                  <Table.Head>Customer</Table.Head>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Order Date</Table.Head>
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
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.lineItems.length} item(s)</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{order.customer.customerName}</p>
                        <p className="text-xs text-gray-500">{order.customer.customerCode}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {order.project ? (
                        <div>
                          <p className="text-sm text-gray-900">{order.project.projectName}</p>
                          <p className="text-xs text-gray-500">{order.project.projectCode}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={orderTypeColors[order.orderType] || 'gray'}>
                        {order.orderType.replace('Order', '')}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(order.orderDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(order.deliveryDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.orderTotal)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[order.orderStatus] || 'gray'}>
                        {order.orderStatus}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/sales-orders/${order._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {order.orderStatus === 'Draft' && (
                          <>
                            <Dropdown.Item icon={Edit}>Edit</Dropdown.Item>
                            <Dropdown.Item icon={CheckCircle}>Confirm Order</Dropdown.Item>
                          </>
                        )}
                        {order.orderStatus === 'Delivered' && (
                          <Dropdown.Item icon={Receipt}>Generate Invoice</Dropdown.Item>
                        )}
                        {['Confirmed', 'Processing'].includes(order.orderStatus) && (
                          <Dropdown.Item icon={Truck}>Update Fulfillment</Dropdown.Item>
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

export default SalesOrders
