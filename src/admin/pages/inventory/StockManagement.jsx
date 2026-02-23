import { useState, useEffect } from 'react'
import { Warehouse, Package, TrendingUp, TrendingDown, AlertTriangle, Search } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/helpers'
import { stockAPI } from '../../utils/api'

const StockManagement = () => {
  const [stockData, setStockData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [stats, setStats] = useState({
    totalSKUs: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0
  })
  const [warehouseStats, setWarehouseStats] = useState([])

  useEffect(() => {
    loadStockData()
  }, [search, warehouseFilter, stockFilter])

  const loadStockData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { search }
      if (warehouseFilter) params.warehouse = warehouseFilter
      if (stockFilter) params.status = stockFilter

      const response = await stockAPI.getAll(params)
      setStockData(response.data || [])

      if (response.stats) {
        setStats(response.stats)
      }
      if (response.warehouseStats) {
        setWarehouseStats(response.warehouseStats)
      }
    } catch (err) {
      console.error('Failed to load stock data:', err)
      setError('Failed to load stock data')
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (stock) => {
    if (stock.currentStock === 0) return { color: 'red', label: 'Out of Stock', icon: AlertTriangle }
    if (stock.currentStock <= stock.reorderLevel) return { color: 'yellow', label: 'Low Stock', icon: TrendingDown }
    return { color: 'green', label: 'Healthy', icon: TrendingUp }
  }

  // Get warehouse value by name
  const getWarehouseValue = (name) => {
    const ws = warehouseStats.find(w => w._id === name)
    return ws?.totalValue || 0
  }

  return (
    <div>
      <PageHeader
        title="Stock Management"
        description="Real-time inventory levels and stock alerts"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Inventory' }, { label: 'Stock Management' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <Package className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalSKUs}</p>
              <p className="text-sm text-gray-500">Total SKUs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <Warehouse className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              <p className="text-sm text-gray-500">Total Stock Value</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.lowStock}</p>
              <p className="text-sm text-gray-500">Low Stock Items</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.outOfStock}</p>
              <p className="text-sm text-gray-500">Out of Stock</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Warehouse Summary */}
      {warehouseStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {warehouseStats.slice(0, 3).map((ws, idx) => {
            const colors = ['blue', 'green', 'purple']
            const color = colors[idx % colors.length]
            return (
              <Card key={ws._id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{ws._id}</p>
                    <p className="text-xl font-semibold text-gray-900">{formatCurrency(ws.totalValue)}</p>
                    <p className="text-xs text-gray-400">{ws.itemCount} items</p>
                  </div>
                  <div className={`p-2 bg-${color}-100 rounded-lg`}>
                    <Warehouse className={`h-5 w-5 text-${color}-600`} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6" padding="sm">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search material..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Warehouses' },
              { value: 'Warehouse A', label: 'Warehouse A' },
              { value: 'Warehouse B', label: 'Warehouse B' },
              { value: 'Warehouse C', label: 'Warehouse C' },
            ]}
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="w-40"
          />
          <Select
            options={[
              { value: '', label: 'All Stock Levels' },
              { value: 'low', label: 'Low Stock' },
              { value: 'out', label: 'Out of Stock' },
              { value: 'healthy', label: 'Healthy' },
            ]}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : stockData.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No stock data found"
            description="Stock entries will appear here when materials are added to inventory"
          />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Material</Table.Head>
                <Table.Head>Warehouse / Location</Table.Head>
                <Table.Head>Current Stock</Table.Head>
                <Table.Head>Reserved</Table.Head>
                <Table.Head>Available</Table.Head>
                <Table.Head>Reorder Level</Table.Head>
                <Table.Head>Stock Value</Table.Head>
                <Table.Head>Status</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {stockData.map((stock) => {
                const status = getStockStatus(stock)
                const StatusIcon = status.icon
                return (
                  <Table.Row key={stock._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{stock.material.materialName}</p>
                        <p className="text-xs text-gray-500">{stock.material.skuCode}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{stock.warehouse}</p>
                        <p className="text-xs text-gray-500">{stock.location}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {stock.currentStock} {stock.material.unit}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">
                        {stock.reservedStock} {stock.material.unit}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`text-sm font-medium ${stock.availableStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stock.availableStock} {stock.material.unit}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">
                        {stock.reorderLevel} {stock.material.unit}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(stock.stockValue)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Badge color={status.color}>
                          {status.label}
                        </Badge>
                        <StatusIcon className={`h-4 w-4 text-${status.color}-500`} />
                      </div>
                    </Table.Cell>
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

export default StockManagement
