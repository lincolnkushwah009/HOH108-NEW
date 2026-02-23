import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, MoreVertical, Package, Eye, CheckCircle, RotateCcw, FileText
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { materialIssuesAPI, workOrdersAPI, materialsAPI, stockAPI } from '../../utils/api'

const MaterialIssues = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [workOrderFilter, setWorkOrderFilter] = useState(searchParams.get('workOrder') || '')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [stats, setStats] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showConsumptionModal, setShowConsumptionModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [workOrders, setWorkOrders] = useState([])
  const [materials, setMaterials] = useState([])
  const [stocks, setStocks] = useState([])
  const [formData, setFormData] = useState({
    workOrder: '',
    material: '',
    quantityIssued: '',
    sourceWarehouse: '',
    notes: ''
  })
  const [consumptionData, setConsumptionData] = useState({
    quantityConsumed: '',
    scrapQuantity: '',
    notes: ''
  })
  const [returnData, setReturnData] = useState({
    quantityReturned: '',
    reason: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadIssues()
  }, [pagination.page, search, statusFilter, workOrderFilter])

  useEffect(() => {
    loadWorkOrdersAndMaterials()
  }, [])

  const loadWorkOrdersAndMaterials = async () => {
    try {
      const [woRes, matRes] = await Promise.all([
        workOrdersAPI.getAll({ limit: 100, status: 'released,in_progress' }),
        materialsAPI.getAll({ limit: 200 })
      ])
      setWorkOrders(woRes.data || [])
      setMaterials(matRes.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const loadStocks = async (materialId) => {
    if (!materialId) {
      setStocks([])
      return
    }
    try {
      const response = await stockAPI.getByMaterial(materialId)
      setStocks(response.data || [])
    } catch (err) {
      console.error('Failed to load stocks:', err)
      setStocks([])
    }
  }

  const loadIssues = async () => {
    setLoading(true)
    try {
      const response = await materialIssuesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        workOrder: workOrderFilter
      })
      setIssues(response.data || [])
      setStats(response.stats || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load issues:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const stock = stocks.find(s => s._id === formData.sourceWarehouse)
      await materialIssuesAPI.create({
        workOrder: formData.workOrder,
        material: formData.material,
        quantityIssued: parseFloat(formData.quantityIssued),
        sourceWarehouse: {
          warehouse: stock?.warehouse?._id || stock?.warehouse,
          name: stock?.warehouse?.name || 'Main Warehouse'
        },
        notes: formData.notes
      })
      setShowCreateModal(false)
      setFormData({
        workOrder: '',
        material: '',
        quantityIssued: '',
        sourceWarehouse: '',
        notes: ''
      })
      loadIssues()
    } catch (err) {
      console.error('Failed to create issue:', err)
      alert('Failed to issue material: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleConsumption = async (e) => {
    e.preventDefault()
    if (!selectedIssue) return
    setSaving(true)
    try {
      await materialIssuesAPI.recordConsumption(selectedIssue._id, {
        quantityConsumed: parseFloat(consumptionData.quantityConsumed),
        scrapQuantity: parseFloat(consumptionData.scrapQuantity) || 0,
        notes: consumptionData.notes
      })
      setShowConsumptionModal(false)
      setConsumptionData({ quantityConsumed: '', scrapQuantity: '', notes: '' })
      setSelectedIssue(null)
      loadIssues()
    } catch (err) {
      console.error('Failed to record consumption:', err)
      alert('Failed to record consumption: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleReturn = async (e) => {
    e.preventDefault()
    if (!selectedIssue) return
    setSaving(true)
    try {
      await materialIssuesAPI.returnMaterial(selectedIssue._id, {
        quantityReturned: parseFloat(returnData.quantityReturned),
        reason: returnData.reason
      })
      setShowReturnModal(false)
      setReturnData({ quantityReturned: '', reason: '' })
      setSelectedIssue(null)
      loadIssues()
    } catch (err) {
      console.error('Failed to return material:', err)
      alert('Failed to return material: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await materialIssuesAPI.approve(id)
      loadIssues()
    } catch (err) {
      console.error('Failed to approve:', err)
    }
  }

  const getAvailableForConsumption = (issue) => {
    const issued = issue.quantityIssued || 0
    const consumed = issue.consumption?.totalConsumed || 0
    const scrap = issue.consumption?.totalScrap || 0
    const returned = issue.quantityReturned || 0
    return issued - consumed - scrap - returned
  }

  const statusColors = {
    pending_approval: 'yellow',
    issued: 'blue',
    partially_consumed: 'orange',
    fully_consumed: 'green',
    returned: 'purple',
    cancelled: 'gray'
  }

  return (
    <div>
      <PageHeader
        title="Material Issues"
        description="Track material issuance and consumption"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'PPC', path: '/admin/ppc' },
          { label: 'Material Issues' }
        ]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>Issue Material</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {['pending_approval', 'issued', 'partially_consumed', 'fully_consumed', 'returned'].map((status) => {
          const stat = stats.find(s => s._id === status) || { count: 0, totalValue: 0 }
          return (
            <Card
              key={status}
              className={`cursor-pointer ${statusFilter === status ? 'ring-2 ring-amber-600' : ''}`}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            >
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{stat.count}</p>
                <p className="text-xs text-gray-500 capitalize">{status.replace(/_/g, ' ')}</p>
                <p className="text-xs text-gray-400 mt-1">{formatCurrency(stat.totalValue || 0)}</p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card className="mb-6" padding="sm">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search issues..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending_approval', label: 'Pending Approval' },
              { value: 'issued', label: 'Issued' },
              { value: 'partially_consumed', label: 'Partially Consumed' },
              { value: 'fully_consumed', label: 'Fully Consumed' },
              { value: 'returned', label: 'Returned' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44"
          />
          <Select
            options={[
              { value: '', label: 'All Work Orders' },
              ...workOrders.map(wo => ({ value: wo._id, label: `${wo.workOrderId} - ${wo.item?.name || ''}` }))
            ]}
            value={workOrderFilter}
            onChange={(e) => setWorkOrderFilter(e.target.value)}
            className="w-56"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : issues.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No material issues found"
            description="Issue materials to production"
            action={() => setShowCreateModal(true)}
            actionLabel="Issue Material"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Issue #</Table.Head>
                  <Table.Head>Material</Table.Head>
                  <Table.Head>Work Order</Table.Head>
                  <Table.Head>Issued</Table.Head>
                  <Table.Head>Consumed</Table.Head>
                  <Table.Head>Scrap</Table.Head>
                  <Table.Head>Returned</Table.Head>
                  <Table.Head>Value</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {issues.map((issue) => (
                  <Table.Row key={issue._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{issue.issueId}</p>
                        <p className="text-xs text-gray-500">{formatDate(issue.issueDate)}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{issue.material?.materialName || issue.materialDetails?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{issue.material?.skuCode || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{issue.workOrder?.workOrderId || '-'}</p>
                        <p className="text-xs text-gray-500">{issue.workOrder?.item?.name || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {issue.quantityIssued || 0} {issue.materialDetails?.unit || ''}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">{issue.consumption?.totalConsumed || 0}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`text-sm ${(issue.consumption?.totalScrap || 0) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {issue.consumption?.totalScrap || 0}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-amber-700">{issue.quantityReturned || 0}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(issue.totalCost || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[issue.status] || 'gray'}>
                        {issue.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Issued'}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/ppc/material-issues/${issue._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {issue.status === 'pending_approval' && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => handleApprove(issue._id)}>
                            Approve
                          </Dropdown.Item>
                        )}
                        {['issued', 'partially_consumed'].includes(issue.status) && getAvailableForConsumption(issue) > 0 && (
                          <>
                            <Dropdown.Item
                              icon={Package}
                              onClick={() => {
                                setSelectedIssue(issue)
                                setShowConsumptionModal(true)
                              }}
                            >
                              Record Consumption
                            </Dropdown.Item>
                            <Dropdown.Item
                              icon={RotateCcw}
                              onClick={() => {
                                setSelectedIssue(issue)
                                setShowReturnModal(true)
                              }}
                            >
                              Return Material
                            </Dropdown.Item>
                          </>
                        )}
                        <Dropdown.Item icon={FileText} onClick={() => navigate(`/admin/ppc/work-orders/${issue.workOrder?._id}`)}>
                          View Work Order
                        </Dropdown.Item>
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

      {/* Issue Material Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Issue Material" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Work Order"
            options={[
              { value: '', label: 'Select Work Order' },
              ...workOrders.map(wo => ({
                value: wo._id,
                label: `${wo.workOrderId} - ${wo.item?.name || ''}`
              }))
            ]}
            value={formData.workOrder}
            onChange={(e) => setFormData({ ...formData, workOrder: e.target.value })}
            required
          />
          <Select
            label="Material"
            options={[
              { value: '', label: 'Select Material' },
              ...materials.map(m => ({
                value: m._id,
                label: `${m.materialName || m.name} (${m.skuCode || ''}) - ${m.unit || ''}`
              }))
            ]}
            value={formData.material}
            onChange={(e) => {
              setFormData({ ...formData, material: e.target.value, sourceWarehouse: '' })
              loadStocks(e.target.value)
            }}
            required
          />
          {stocks.length > 0 && (
            <Select
              label="Source Warehouse"
              options={[
                { value: '', label: 'Select Warehouse' },
                ...stocks.map(s => ({
                  value: s._id,
                  label: `${s.warehouse?.name || 'Main'} - Qty: ${s.quantity || 0}`
                }))
              ]}
              value={formData.sourceWarehouse}
              onChange={(e) => setFormData({ ...formData, sourceWarehouse: e.target.value })}
              required
            />
          )}
          <Input
            label="Quantity to Issue"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.quantityIssued}
            onChange={(e) => setFormData({ ...formData, quantityIssued: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Issue Material</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Record Consumption Modal */}
      <Modal isOpen={showConsumptionModal} onClose={() => setShowConsumptionModal(false)} title="Record Consumption" size="md">
        <form onSubmit={handleConsumption} className="space-y-4">
          {selectedIssue && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                <strong>Issue:</strong> {selectedIssue.issueId}<br />
                <strong>Material:</strong> {selectedIssue.material?.materialName || selectedIssue.materialDetails?.name}<br />
                <strong>Available:</strong> {getAvailableForConsumption(selectedIssue)} {selectedIssue.materialDetails?.unit || ''}
              </p>
            </div>
          )}
          <Input
            label="Quantity Consumed"
            type="number"
            min="0.01"
            step="0.01"
            max={selectedIssue ? getAvailableForConsumption(selectedIssue) : undefined}
            value={consumptionData.quantityConsumed}
            onChange={(e) => setConsumptionData({ ...consumptionData, quantityConsumed: e.target.value })}
            required
          />
          <Input
            label="Scrap Quantity (if any)"
            type="number"
            min="0"
            step="0.01"
            value={consumptionData.scrapQuantity}
            onChange={(e) => setConsumptionData({ ...consumptionData, scrapQuantity: e.target.value })}
          />
          <Input
            label="Notes"
            value={consumptionData.notes}
            onChange={(e) => setConsumptionData({ ...consumptionData, notes: e.target.value })}
          />
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConsumptionModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Record Consumption</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Return Material Modal */}
      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Return Material" size="md">
        <form onSubmit={handleReturn} className="space-y-4">
          {selectedIssue && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                <strong>Issue:</strong> {selectedIssue.issueId}<br />
                <strong>Material:</strong> {selectedIssue.material?.materialName || selectedIssue.materialDetails?.name}<br />
                <strong>Available to Return:</strong> {getAvailableForConsumption(selectedIssue)} {selectedIssue.materialDetails?.unit || ''}
              </p>
            </div>
          )}
          <Input
            label="Quantity to Return"
            type="number"
            min="0.01"
            step="0.01"
            max={selectedIssue ? getAvailableForConsumption(selectedIssue) : undefined}
            value={returnData.quantityReturned}
            onChange={(e) => setReturnData({ ...returnData, quantityReturned: e.target.value })}
            required
          />
          <Input
            label="Reason for Return"
            value={returnData.reason}
            onChange={(e) => setReturnData({ ...returnData, reason: e.target.value })}
            required
          />
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReturnModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Return Material</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default MaterialIssues
