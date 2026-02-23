import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Package, Eye, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatDateTime } from '../../utils/helpers'
import { goodsReceiptsAPI } from '../../utils/api'

const GoodsReceipt = () => {
  const navigate = useNavigate()
  const [grns, setGrns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ total: 0, pending: 0, passed: 0, failed: 0 })

  useEffect(() => {
    loadGRNs()
  }, [pagination.page, search, statusFilter])

  const loadGRNs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await goodsReceiptsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter
      })
      setGrns(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
      // Calculate stats
      if (response.stats) {
        const statsMap = {}
        response.stats.forEach(s => { statsMap[s._id] = s })
        setStats({
          total: response.pagination?.total || 0,
          pending: (statsMap['draft']?.count || 0) + (statsMap['pending_inspection']?.count || 0),
          passed: statsMap['accepted']?.count || 0,
          failed: statsMap['rejected']?.count || 0
        })
      }
    } catch (err) {
      console.error('Failed to load GRNs:', err)
      setError('Failed to load goods receipts')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id) => {
    try {
      await goodsReceiptsAPI.accept(id)
      loadGRNs()
    } catch (err) {
      console.error('Failed to accept GRN:', err)
    }
  }

  const statusColors = {
    draft: 'gray',
    pending_inspection: 'yellow',
    inspected: 'blue',
    accepted: 'green',
    rejected: 'red',
    partial: 'orange',
  }

  const statusLabels = {
    draft: 'Draft',
    pending_inspection: 'Pending QC',
    inspected: 'Inspected',
    accepted: 'Accepted',
    rejected: 'Rejected',
    partial: 'Partial',
  }

  return (
    <div>
      <PageHeader
        title="Goods Receipt (GRN)"
        description="Receive and inspect delivered materials"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Procurement' }, { label: 'GRN' }]}
        actions={<Button icon={Plus} onClick={() => navigate('/admin/grn/new')}>New GRN</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <Package className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total GRNs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending QC</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.passed}</p>
              <p className="text-sm text-gray-500">QC Passed</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.failed}</p>
              <p className="text-sm text-gray-500">QC Failed</p>
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
            placeholder="Search GRN number, PO..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'pending_inspection', label: 'Pending QC' },
              { value: 'inspected', label: 'Inspected' },
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
        ) : grns.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No GRNs found"
            description="Create a GRN when goods are received"
            action={() => navigate('/admin/grn/new')}
            actionLabel="New GRN"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>GRN Number</Table.Head>
                  <Table.Head>PO / Vendor</Table.Head>
                  <Table.Head>Receipt Date</Table.Head>
                  <Table.Head>Items</Table.Head>
                  <Table.Head>Quality</Table.Head>
                  <Table.Head>Storage</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {grns.map((grn) => (
                  <Table.Row key={grn._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{grn.grnNumber}</p>
                        <p className="text-xs text-gray-500">By {grn.receivedBy?.name || 'Unknown'}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{grn.purchaseOrder?.poNumber || '-'}</p>
                        <p className="text-xs text-gray-500">{grn.vendor?.name || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{formatDate(grn.receiptDate)}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <span className="text-sm text-gray-600">{grn.lineItems?.length || 0} item(s)</span>
                        {grn.lineItems?.some(l => l.rejectedQuantity > 0) && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs text-yellow-600">Has rejections</span>
                          </div>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={grn.inspectionStatus === 'passed' ? 'green' : grn.inspectionStatus === 'failed' ? 'red' : 'yellow'}>
                        {grn.inspectionStatus || 'pending'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{grn.storageLocation || '-'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[grn.status] || 'gray'}>
                        {statusLabels[grn.status] || grn.status}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/goods-receipt/${grn._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {grn.status === 'inspected' && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => handleAccept(grn._id)}>Accept & Update Stock</Dropdown.Item>
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

export default GoodsReceipt
