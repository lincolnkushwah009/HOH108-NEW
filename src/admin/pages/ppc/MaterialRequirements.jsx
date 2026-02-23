import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus, MoreVertical, Package, Eye, Trash2, AlertTriangle, CheckCircle,
  Clock, ShoppingCart, RefreshCw, FileText
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { materialRequirementsAPI, projectsAPI, workOrdersAPI } from '../../utils/api'

const MaterialRequirements = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [requirements, setRequirements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [hasShortfall, setHasShortfall] = useState(searchParams.get('hasShortfall') === 'true')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [shortfallSummary, setShortfallSummary] = useState([])
  const [projects, setProjects] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [showRunMrpModal, setShowRunMrpModal] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState('')
  const [selectedRequirements, setSelectedRequirements] = useState([])
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadRequirements()
  }, [pagination.page, search, statusFilter, projectFilter, hasShortfall])

  useEffect(() => {
    loadProjects()
    loadWorkOrders()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getAll({ limit: 100 })
      setProjects(response.data || [])
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const loadWorkOrders = async () => {
    try {
      const response = await workOrdersAPI.getAll({ limit: 100, status: 'draft,released,in_progress' })
      setWorkOrders(response.data || [])
    } catch (err) {
      console.error('Failed to load work orders:', err)
    }
  }

  const loadRequirements = async () => {
    setLoading(true)
    try {
      const response = await materialRequirementsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        project: projectFilter,
        hasShortfall: hasShortfall ? 'true' : undefined
      })
      setRequirements(response.data || [])
      setShortfallSummary(response.shortfallSummary || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load requirements:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRunMrp = async () => {
    if (!selectedWorkOrder) return
    setProcessing(true)
    try {
      const response = await materialRequirementsAPI.runMRP(selectedWorkOrder)
      alert(response.message || 'MRP run completed')
      setShowRunMrpModal(false)
      setSelectedWorkOrder('')
      loadRequirements()
    } catch (err) {
      console.error('Failed to run MRP:', err)
      alert('Failed to run MRP: ' + (err.response?.data?.message || err.message))
    } finally {
      setProcessing(false)
    }
  }

  const handleRefreshStock = async () => {
    setProcessing(true)
    try {
      const ids = selectedRequirements.length > 0 ? selectedRequirements : undefined
      const response = await materialRequirementsAPI.refreshStock(ids)
      alert(response.message || 'Stock levels refreshed')
      setSelectedRequirements([])
      loadRequirements()
    } catch (err) {
      console.error('Failed to refresh stock:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleCreatePR = async () => {
    if (selectedRequirements.length === 0) {
      alert('Please select requirements with shortfall to create PR')
      return
    }
    setProcessing(true)
    try {
      const response = await materialRequirementsAPI.createPR(selectedRequirements)
      alert(response.message || 'Purchase Requisition(s) created')
      setSelectedRequirements([])
      loadRequirements()
    } catch (err) {
      console.error('Failed to create PR:', err)
      alert('Failed to create PR: ' + (err.response?.data?.message || err.message))
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this material requirement?')) return
    try {
      await materialRequirementsAPI.delete(id)
      loadRequirements()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const toggleSelection = (id) => {
    setSelectedRequirements(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    const shortfallIds = requirements.filter(r => (r.quantity?.shortfall || 0) > 0).map(r => r._id)
    if (selectedRequirements.length === shortfallIds.length) {
      setSelectedRequirements([])
    } else {
      setSelectedRequirements(shortfallIds)
    }
  }

  const statusColors = {
    pending: 'yellow',
    partial: 'orange',
    pr_created: 'blue',
    po_created: 'purple',
    fulfilled: 'green',
    cancelled: 'gray'
  }

  const getTotalShortfallValue = () => {
    return requirements
      .filter(r => (r.quantity?.shortfall || 0) > 0)
      .reduce((sum, r) => sum + ((r.quantity?.shortfall || 0) * (r.unitPrice || 0)), 0)
  }

  return (
    <div>
      <PageHeader
        title="Material Requirements Planning"
        description="MRP - Track material requirements and shortfalls"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'PPC', path: '/admin/ppc' },
          { label: 'Material Requirements' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={handleRefreshStock} loading={processing}>
              Refresh Stock
            </Button>
            <Button icon={Plus} onClick={() => setShowRunMrpModal(true)}>Run MRP</Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className={`cursor-pointer ${!hasShortfall ? 'ring-2 ring-amber-600' : ''}`} onClick={() => setHasShortfall(false)}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Package className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
              <p className="text-xs text-gray-500">Total Requirements</p>
            </div>
          </div>
        </Card>

        <Card className={`cursor-pointer ${hasShortfall ? 'ring-2 ring-red-500' : ''}`} onClick={() => setHasShortfall(true)}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-red-600">
                {shortfallSummary.reduce((sum, s) => sum + (s.count || 0), 0)}
              </p>
              <p className="text-xs text-gray-500">With Shortfall</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {requirements.filter(r => r.status === 'pending').length}
              </p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">
                {requirements.filter(r => r.status === 'fulfilled').length}
              </p>
              <p className="text-xs text-gray-500">Fulfilled</p>
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
            placeholder="Search materials..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'partial', label: 'Partial' },
              { value: 'pr_created', label: 'PR Created' },
              { value: 'po_created', label: 'PO Created' },
              { value: 'fulfilled', label: 'Fulfilled' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
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
          {selectedRequirements.length > 0 && (
            <Button icon={ShoppingCart} onClick={handleCreatePR} loading={processing}>
              Create PR ({selectedRequirements.length})
            </Button>
          )}
        </div>
      </Card>

      {hasShortfall && getTotalShortfallValue() > 0 && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">
                Total Shortfall Value: {formatCurrency(getTotalShortfallValue())}
              </span>
            </div>
            <Button size="sm" onClick={handleCreatePR} disabled={selectedRequirements.length === 0}>
              Create PR for Selected
            </Button>
          </div>
        </Card>
      )}

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : requirements.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No material requirements found"
            description="Run MRP on a work order to generate requirements"
            action={() => setShowRunMrpModal(true)}
            actionLabel="Run MRP"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedRequirements.length > 0 && selectedRequirements.length === requirements.filter(r => (r.quantity?.shortfall || 0) > 0).length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </Table.Head>
                  <Table.Head>MRP #</Table.Head>
                  <Table.Head>Material</Table.Head>
                  <Table.Head>Work Order</Table.Head>
                  <Table.Head>Required</Table.Head>
                  <Table.Head>Available</Table.Head>
                  <Table.Head>Shortfall</Table.Head>
                  <Table.Head>Required By</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {requirements.map((req) => (
                  <Table.Row key={req._id} className={(req.quantity?.shortfall || 0) > 0 ? 'bg-red-50' : ''}>
                    <Table.Cell>
                      <input
                        type="checkbox"
                        checked={selectedRequirements.includes(req._id)}
                        onChange={() => toggleSelection(req._id)}
                        disabled={(req.quantity?.shortfall || 0) <= 0}
                        className="rounded border-gray-300"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <p className="font-medium text-gray-900">{req.mrpId}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{req.material?.materialName || req.materialDetails?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{req.material?.skuCode || req.materialDetails?.skuCode || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{req.workOrder?.workOrderId || '-'}</p>
                        <p className="text-xs text-gray-500">{req.workOrder?.item?.name || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {req.quantity?.required || 0} {req.materialDetails?.unit || ''}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{req.quantity?.available || 0}</p>
                        <p className="text-xs text-gray-500">
                          Stock: {req.quantity?.stockOnHand || 0}, Reserved: {req.quantity?.reserved || 0}
                        </p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {(req.quantity?.shortfall || 0) > 0 ? (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600">
                            {req.quantity?.shortfall || 0}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-green-600">-</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(req.requiredByDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[req.status] || 'gray'}>
                        {req.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Pending'}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/ppc/material-requirements/${req._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {req.purchaseRequisition && (
                          <Dropdown.Item icon={FileText} onClick={() => navigate(`/admin/purchase-requisitions/${req.purchaseRequisition._id}`)}>
                            View PR
                          </Dropdown.Item>
                        )}
                        {req.status === 'pending' && (
                          <Dropdown.Item icon={Trash2} onClick={() => handleDelete(req._id)} className="text-red-600">
                            Delete
                          </Dropdown.Item>
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

      {/* Run MRP Modal */}
      <Modal isOpen={showRunMrpModal} onClose={() => setShowRunMrpModal(false)} title="Run MRP" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a work order to run Material Requirements Planning. This will analyze the BOM and calculate material requirements based on current stock levels.
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
            <Button variant="secondary" onClick={() => setShowRunMrpModal(false)}>Cancel</Button>
            <Button onClick={handleRunMrp} loading={processing} disabled={!selectedWorkOrder}>
              Run MRP
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  )
}

export default MaterialRequirements
