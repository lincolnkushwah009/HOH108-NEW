import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft, RefreshCw, ArrowRightLeft, Package } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Card, Table, Badge, SearchInput, Pagination, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatDateTime, formatCurrency } from '../../utils/helpers'
import { stockMovementsAPI } from '../../utils/api'

const StockMovements = () => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  useEffect(() => {
    loadMovements()
  }, [pagination.page, search, typeFilter])

  const loadMovements = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (search) params.search = search
      if (typeFilter) params.movementType = typeFilter.toLowerCase()

      const response = await stockMovementsAPI.getAll(params)
      setMovements(response.data || [])
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.pages
        }))
      }
    } catch (err) {
      console.error('Failed to load movements:', err)
    } finally {
      setLoading(false)
    }
  }

  const movementTypeConfig = {
    Inbound: { color: 'green', icon: ArrowDownLeft, label: 'Inbound' },
    Outbound: { color: 'red', icon: ArrowUpRight, label: 'Outbound' },
    Transfer: { color: 'blue', icon: ArrowRightLeft, label: 'Transfer' },
    Adjustment: { color: 'yellow', icon: RefreshCw, label: 'Adjustment' },
  }

  const statusColors = {
    Pending: 'yellow',
    Completed: 'green',
    Reversed: 'red',
  }

  // Calculate stats
  const stats = {
    inbound: movements.filter(m => m.movementType === 'Inbound').length,
    outbound: movements.filter(m => m.movementType === 'Outbound').length,
    transfers: movements.filter(m => m.movementType === 'Transfer').length,
    adjustments: movements.filter(m => m.movementType === 'Adjustment').length,
  }

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        description="Track all inventory movements and transactions"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Inventory' }, { label: 'Stock Movements' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowDownLeft className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.inbound}</p>
              <p className="text-sm text-gray-500">Inbound</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.outbound}</p>
              <p className="text-sm text-gray-500">Outbound</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ArrowRightLeft className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.transfers}</p>
              <p className="text-sm text-gray-500">Transfers</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <RefreshCw className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.adjustments}</p>
              <p className="text-sm text-gray-500">Adjustments</p>
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
            placeholder="Search movement, material..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'Inbound', label: 'Inbound' },
              { value: 'Outbound', label: 'Outbound' },
              { value: 'Transfer', label: 'Transfer' },
              { value: 'Adjustment', label: 'Adjustment' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : movements.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No movements found"
            description="Stock movements will appear here"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Movement #</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Material</Table.Head>
                  <Table.Head>From / To</Table.Head>
                  <Table.Head>Quantity</Table.Head>
                  <Table.Head>Reference</Table.Head>
                  <Table.Head>Date</Table.Head>
                  <Table.Head>Status</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {movements.map((movement) => {
                  const typeConfig = movementTypeConfig[movement.movementType]
                  const TypeIcon = typeConfig.icon
                  return (
                    <Table.Row key={movement._id}>
                      <Table.Cell>
                        <div>
                          <p className="font-medium text-gray-900">{movement.movementNumber}</p>
                          <p className="text-xs text-gray-500">By {movement.createdBy.firstName}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded bg-${typeConfig.color}-100`}>
                            <TypeIcon className={`h-4 w-4 text-${typeConfig.color}-600`} />
                          </div>
                          <Badge color={typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="text-sm text-gray-900">{movement.material.materialName}</p>
                          <p className="text-xs text-gray-500">{movement.material.skuCode}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="text-sm">
                          {movement.fromWarehouse && (
                            <p className="text-gray-500">From: {movement.fromWarehouse}</p>
                          )}
                          {movement.toWarehouse && (
                            <p className="text-gray-900">To: {movement.toWarehouse}</p>
                          )}
                          {movement.reason && (
                            <p className="text-xs text-yellow-600">{movement.reason}</p>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <span className={`text-sm font-medium ${movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.quantity >= 0 ? '+' : ''}{movement.quantity} {movement.material.unit}
                          </span>
                          <p className="text-xs text-gray-500">
                            {movement.initialQuantity} → {movement.finalQuantity}
                          </p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="text-sm text-gray-900">{movement.reference}</p>
                          <p className="text-xs text-gray-500">{movement.referenceType}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-gray-500">{formatDateTime(movement.movementDate)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={statusColors[movement.status] || 'gray'}>
                          {movement.status}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
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

export default StockMovements
