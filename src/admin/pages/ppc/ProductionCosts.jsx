import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MoreVertical, DollarSign, Eye, Calculator, CheckCircle, FileText,
  TrendingUp, TrendingDown, BarChart3, AlertTriangle, RefreshCw
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { productionCostsAPI, workOrdersAPI, projectsAPI } from '../../utils/api'

const ProductionCosts = () => {
  const navigate = useNavigate()
  const [costs, setCosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [summary, setSummary] = useState(null)
  const [showCalculateModal, setShowCalculateModal] = useState(false)
  const [showOverheadModal, setShowOverheadModal] = useState(false)
  const [selectedCost, setSelectedCost] = useState(null)
  const [projects, setProjects] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [selectedWorkOrder, setSelectedWorkOrder] = useState('')
  const [overheadData, setOverheadData] = useState({
    factoryOverhead: '',
    adminOverhead: '',
    otherOverhead: '',
    notes: ''
  })
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadCosts()
  }, [pagination.page, search, statusFilter, projectFilter])

  useEffect(() => {
    loadProjectsAndWorkOrders()
  }, [])

  const loadProjectsAndWorkOrders = async () => {
    try {
      const [projRes, woRes] = await Promise.all([
        projectsAPI.getAll({ limit: 100 }),
        workOrdersAPI.getAll({ limit: 100, status: 'in_progress,completed' })
      ])
      setProjects(projRes.data || [])
      setWorkOrders(woRes.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const loadCosts = async () => {
    setLoading(true)
    try {
      const response = await productionCostsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        project: projectFilter
      })
      setCosts(response.data || [])
      setSummary(response.summary || null)
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load costs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async () => {
    if (!selectedWorkOrder) return
    setProcessing(true)
    try {
      await productionCostsAPI.calculate(selectedWorkOrder)
      setShowCalculateModal(false)
      setSelectedWorkOrder('')
      loadCosts()
    } catch (err) {
      console.error('Failed to calculate:', err)
      alert('Failed to calculate costs: ' + (err.response?.data?.message || err.message))
    } finally {
      setProcessing(false)
    }
  }

  const handleRecalculate = async (id) => {
    setProcessing(true)
    try {
      await productionCostsAPI.recalculate(id)
      loadCosts()
    } catch (err) {
      console.error('Failed to recalculate:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleUpdateOverhead = async (e) => {
    e.preventDefault()
    if (!selectedCost) return
    setProcessing(true)
    try {
      await productionCostsAPI.updateOverhead(selectedCost._id, {
        factoryOverhead: parseFloat(overheadData.factoryOverhead) || 0,
        adminOverhead: parseFloat(overheadData.adminOverhead) || 0,
        otherOverhead: parseFloat(overheadData.otherOverhead) || 0,
        notes: overheadData.notes
      })
      setShowOverheadModal(false)
      setOverheadData({ factoryOverhead: '', adminOverhead: '', otherOverhead: '', notes: '' })
      setSelectedCost(null)
      loadCosts()
    } catch (err) {
      console.error('Failed to update overhead:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleVerify = async (id) => {
    try {
      await productionCostsAPI.verify(id)
      loadCosts()
    } catch (err) {
      console.error('Failed to verify:', err)
    }
  }

  const handleFinalize = async (id) => {
    if (!confirm('Finalize this cost record? This action cannot be undone.')) return
    try {
      await productionCostsAPI.finalize(id)
      loadCosts()
    } catch (err) {
      console.error('Failed to finalize:', err)
    }
  }

  const statusColors = {
    draft: 'gray',
    calculated: 'blue',
    verified: 'yellow',
    finalized: 'green',
    posted: 'purple'
  }

  const getVarianceColor = (variance) => {
    if (!variance) return 'text-gray-500'
    if (variance > 5) return 'text-red-600'
    if (variance > 0) return 'text-orange-600'
    if (variance < -5) return 'text-green-600'
    return 'text-gray-600'
  }

  const getTotalCOGS = () => {
    return costs.reduce((sum, c) => sum + (c.totalCOGS || 0), 0)
  }

  const getTotalMaterialCost = () => {
    return costs.reduce((sum, c) => sum + (c.directCosts?.material || 0), 0)
  }

  const getTotalLaborCost = () => {
    return costs.reduce((sum, c) => sum + (c.directCosts?.labor || 0), 0)
  }

  return (
    <div>
      <PageHeader
        title="Production Costs"
        description="COGS calculation and cost tracking"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'PPC', path: '/admin/ppc' },
          { label: 'Production Costs' }
        ]}
        actions={
          <Button icon={Calculator} onClick={() => setShowCalculateModal(true)}>
            Calculate Costs
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(getTotalCOGS())}</p>
              <p className="text-xs text-gray-500">Total COGS</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(getTotalMaterialCost())}</p>
              <p className="text-xs text-gray-500">Material Cost</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(getTotalLaborCost())}</p>
              <p className="text-xs text-gray-500">Labor Cost</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              {summary?.avgVariance > 0 ? (
                <TrendingUp className="h-5 w-5 text-red-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <p className={`text-xl font-semibold ${getVarianceColor(summary?.avgVariance)}`}>
                {summary?.avgVariance > 0 ? '+' : ''}{(summary?.avgVariance || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">Avg Variance</p>
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
            placeholder="Search costs..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'calculated', label: 'Calculated' },
              { value: 'verified', label: 'Verified' },
              { value: 'finalized', label: 'Finalized' },
              { value: 'posted', label: 'Posted' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          />
          <Select
            options={[
              { value: '', label: 'All Projects' },
              ...projects.map(p => ({ value: p._id, label: p.title || p.name }))
            ]}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : costs.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No cost records found"
            description="Calculate costs for completed work orders"
            action={() => setShowCalculateModal(true)}
            actionLabel="Calculate Costs"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Cost #</Table.Head>
                  <Table.Head>Work Order</Table.Head>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Material</Table.Head>
                  <Table.Head>Labor</Table.Head>
                  <Table.Head>Overhead</Table.Head>
                  <Table.Head>Total COGS</Table.Head>
                  <Table.Head>Variance</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {costs.map((cost) => (
                  <Table.Row key={cost._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{cost.costId}</p>
                        <p className="text-xs text-gray-500">{formatDate(cost.createdAt)}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{cost.workOrder?.workOrderId || '-'}</p>
                        <p className="text-xs text-gray-500">{cost.workOrder?.item?.name || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm text-gray-900">{cost.project?.title || cost.projectName || '-'}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(cost.directCosts?.material || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(cost.directCosts?.labor || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">
                        {formatCurrency(cost.overheadCosts?.total || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(cost.totalCOGS || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        {cost.variance?.percentage > 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        ) : cost.variance?.percentage < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-500" />
                        ) : null}
                        <span className={`text-sm font-medium ${getVarianceColor(cost.variance?.percentage)}`}>
                          {cost.variance?.percentage > 0 ? '+' : ''}{(cost.variance?.percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[cost.status] || 'gray'}>
                        {cost.status?.charAt(0).toUpperCase() + cost.status?.slice(1) || 'Draft'}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/ppc/production-costs/${cost._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {['draft', 'calculated'].includes(cost.status) && (
                          <>
                            <Dropdown.Item icon={RefreshCw} onClick={() => handleRecalculate(cost._id)}>
                              Recalculate
                            </Dropdown.Item>
                            <Dropdown.Item
                              icon={DollarSign}
                              onClick={() => {
                                setSelectedCost(cost)
                                setOverheadData({
                                  factoryOverhead: cost.overheadCosts?.factory || '',
                                  adminOverhead: cost.overheadCosts?.admin || '',
                                  otherOverhead: cost.overheadCosts?.other || '',
                                  notes: ''
                                })
                                setShowOverheadModal(true)
                              }}
                            >
                              Update Overhead
                            </Dropdown.Item>
                          </>
                        )}
                        {cost.status === 'calculated' && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => handleVerify(cost._id)}>
                            Verify
                          </Dropdown.Item>
                        )}
                        {cost.status === 'verified' && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => handleFinalize(cost._id)}>
                            Finalize
                          </Dropdown.Item>
                        )}
                        {cost.variance?.percentage > 5 && (
                          <Dropdown.Item icon={AlertTriangle} className="text-orange-600">
                            High Variance Alert
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item icon={FileText} onClick={() => navigate(`/admin/ppc/work-orders/${cost.workOrder?._id}`)}>
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

      {/* Calculate Costs Modal */}
      <Modal isOpen={showCalculateModal} onClose={() => setShowCalculateModal(false)} title="Calculate Production Costs" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a work order to calculate its production costs. This will aggregate material consumption, labor hours, and overhead costs.
          </p>
          <Select
            label="Work Order"
            options={[
              { value: '', label: 'Select Work Order' },
              ...workOrders.map(wo => ({
                value: wo._id,
                label: `${wo.workOrderId} - ${wo.item?.name || ''} (${wo.status})`
              }))
            ]}
            value={selectedWorkOrder}
            onChange={(e) => setSelectedWorkOrder(e.target.value)}
          />
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCalculateModal(false)}>Cancel</Button>
            <Button onClick={handleCalculate} loading={processing} disabled={!selectedWorkOrder}>
              Calculate
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Update Overhead Modal */}
      <Modal isOpen={showOverheadModal} onClose={() => setShowOverheadModal(false)} title="Update Overhead Costs" size="md">
        <form onSubmit={handleUpdateOverhead} className="space-y-4">
          {selectedCost && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-gray-600">
                <strong>Cost ID:</strong> {selectedCost.costId}<br />
                <strong>Work Order:</strong> {selectedCost.workOrder?.workOrderId}
              </p>
            </div>
          )}
          <Input
            label="Factory Overhead"
            type="number"
            min="0"
            step="0.01"
            value={overheadData.factoryOverhead}
            onChange={(e) => setOverheadData({ ...overheadData, factoryOverhead: e.target.value })}
          />
          <Input
            label="Admin Overhead"
            type="number"
            min="0"
            step="0.01"
            value={overheadData.adminOverhead}
            onChange={(e) => setOverheadData({ ...overheadData, adminOverhead: e.target.value })}
          />
          <Input
            label="Other Overhead"
            type="number"
            min="0"
            step="0.01"
            value={overheadData.otherOverhead}
            onChange={(e) => setOverheadData({ ...overheadData, otherOverhead: e.target.value })}
          />
          <Input
            label="Notes"
            value={overheadData.notes}
            onChange={(e) => setOverheadData({ ...overheadData, notes: e.target.value })}
          />
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowOverheadModal(false)}>Cancel</Button>
            <Button type="submit" loading={processing}>Update Overhead</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default ProductionCosts
