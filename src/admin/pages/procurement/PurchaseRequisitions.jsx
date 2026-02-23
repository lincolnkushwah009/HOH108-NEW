import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, ClipboardList, Eye, Edit, Trash2, CheckCircle, XCircle, Send } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { purchaseRequisitionsAPI, projectsAPI, materialsAPI, vendorsAPI } from '../../utils/api'

const PurchaseRequisitions = () => {
  const navigate = useNavigate()
  const [requisitions, setRequisitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    items: [],
    priority: 'medium',
    requiredDate: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState([])
  const [materials, setMaterials] = useState([])
  const [vendors, setVendors] = useState([])

  useEffect(() => {
    loadRequisitions()
  }, [pagination.page, search, statusFilter, cityFilter, categoryFilter])

  useEffect(() => {
    loadProjectsAndMaterials()
  }, [])

  const loadProjectsAndMaterials = async () => {
    try {
      const [projectsRes, materialsRes, vendorsRes] = await Promise.all([
        projectsAPI.getAll({ limit: 100 }),
        materialsAPI.getAll({ limit: 100 }),
        vendorsAPI.getAll({ limit: 100, status: 'active' })
      ])
      setProjects(projectsRes.data || [])
      setMaterials(materialsRes.data || [])
      setVendors(vendorsRes.data || [])
    } catch (err) {
      console.error('Failed to load projects/materials/vendors:', err)
    }
  }

  const loadRequisitions = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter
      }
      if (cityFilter) params.city = cityFilter
      if (categoryFilter) params.category = categoryFilter
      const response = await purchaseRequisitionsAPI.getAll(params)
      setRequisitions(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load requisitions:', err)
      setError('Failed to load requisitions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Find the selected material to get its name
      const selectedMaterial = materials.find(m => m._id === formData.material)

      // Transform form data to match backend model
      const payload = {
        project: formData.project,
        targetVendor: formData.vendor, // Selected vendor who will receive RFQ on approval
        purpose: formData.requisitionReason || `Purchase requisition for ${selectedMaterial?.materialName || 'material'}`,
        requiredDate: formData.requiredByDate,
        lineItems: [{
          material: formData.material, // Include material reference for vendor lookup
          description: selectedMaterial?.materialName || 'Material',
          itemCode: selectedMaterial?.skuCode || '',
          unit: selectedMaterial?.unit || 'kg',
          quantity: parseInt(formData.quantity) || 1,
          estimatedUnitPrice: parseFloat(formData.estimatedUnitPrice) || 0,
          remarks: formData.deliveryLocation ? `Delivery: ${formData.deliveryLocation}` : ''
        }]
      }

      await purchaseRequisitionsAPI.create(payload)
      setShowCreateModal(false)
      setFormData({
        title: '',
        description: '',
        items: [],
        priority: 'medium',
        requiredDate: '',
        notes: '',
        vendor: '',
        project: '',
        material: '',
        quantity: '',
        estimatedUnitPrice: '',
        deliveryLocation: '',
        requiredByDate: '',
        requisitionReason: ''
      })
      loadRequisitions()
    } catch (err) {
      console.error('Failed to create requisition:', err)
      alert('Failed to create requisition')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (id) => {
    try {
      await purchaseRequisitionsAPI.submit(id)
      loadRequisitions()
    } catch (err) {
      console.error('Failed to submit:', err)
    }
  }

  const handleApprove = async (id) => {
    try {
      await purchaseRequisitionsAPI.approve(id)
      loadRequisitions()
    } catch (err) {
      console.error('Failed to approve:', err)
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await purchaseRequisitionsAPI.reject(id, reason)
      loadRequisitions()
    } catch (err) {
      console.error('Failed to reject:', err)
    }
  }

  const statusColors = {
    draft: 'gray',
    submitted: 'blue',
    approved: 'green',
    rejected: 'red',
    partially_ordered: 'yellow',
    fully_ordered: 'purple',
    cancelled: 'gray',
  }

  const statusLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
    partially_ordered: 'Partially Ordered',
    fully_ordered: 'Fully Ordered',
    cancelled: 'Cancelled',
  }

  return (
    <div>
      <PageHeader
        title="Purchase Requisitions"
        description="Create and manage purchase requests"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Procurement' }, { label: 'Purchase Requisitions' }]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>New Requisition</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {['draft', 'submitted', 'approved', 'rejected', 'fully_ordered'].map((status) => (
          <Card key={status}>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {requisitions.filter(r => r.status === status).length}
              </p>
              <p className="text-sm text-gray-500">{statusLabels[status] || status}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-6" padding="sm">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search requisitions..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'fully_ordered', label: 'Ordered' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          />
          <Select
            options={[
              { value: '', label: 'All Cities' },
              { value: 'Hyderabad', label: 'Hyderabad' },
              { value: 'Mysore', label: 'Mysore' },
              { value: 'Bangalore', label: 'Bangalore' },
            ]}
            value={cityFilter}
            onChange={(e) => { setCityFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}
            className="w-40"
          />
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'interior', label: 'Interior' },
              { value: 'construction', label: 'Construction' },
            ]}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : requisitions.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No requisitions found"
            description="Create your first purchase requisition"
            action={() => setShowCreateModal(true)}
            actionLabel="New Requisition"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Requisition #</Table.Head>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>City</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Material</Table.Head>
                  <Table.Head>Qty</Table.Head>
                  <Table.Head>Est. Value</Table.Head>
                  <Table.Head>Required By</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {requisitions.map((req) => (
                  <Table.Row key={req._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{req.prNumber}</p>
                        <p className="text-xs text-gray-500">By {req.requestedBy?.name || 'Unknown'}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{req.project?.title || '-'}</p>
                        <p className="text-xs text-gray-500">{req.project?.projectId || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-700">{req.project?.location?.city || '-'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-700 capitalize">{req.project?.category || '-'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{req.lineItems?.[0]?.description || req.purpose || '-'}</p>
                        <p className="text-xs text-gray-500">{req.lineItems?.length || 0} item(s)</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm">{req.lineItems?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(req.estimatedTotal || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(req.requiredDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[req.status] || 'gray'}>
                        {statusLabels[req.status] || req.status}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/purchase-requisitions/${req._id}`)}>View Details</Dropdown.Item>
                        {req.status === 'draft' && (
                          <>
                            <Dropdown.Item icon={Edit} onClick={() => navigate(`/admin/purchase-requisitions/${req._id}/edit`)}>Edit</Dropdown.Item>
                            <Dropdown.Item icon={Send} onClick={() => handleSubmit(req._id)}>
                              Submit for Approval
                            </Dropdown.Item>
                          </>
                        )}
                        {(req.status === 'submitted' || req.status === 'pending_approval') && (
                          <>
                            <Dropdown.Item icon={CheckCircle} onClick={() => handleApprove(req._id)}>
                              Approve
                            </Dropdown.Item>
                            <Dropdown.Item icon={XCircle} onClick={() => handleReject(req._id)}>
                              Reject
                            </Dropdown.Item>
                          </>
                        )}
                        {req.linkedPurchaseOrders?.length > 0 && (
                          <Dropdown.Item icon={Eye}>
                            View PO(s)
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

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Purchase Requisition" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Vendor"
            options={[
              { value: '', label: 'Select Vendor' },
              ...vendors.map(v => ({ value: v._id, label: `${v.name} (${v.vendorId || ''})` }))
            ]}
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            required
          />
          <Select
            label="Project"
            options={[
              { value: '', label: 'Select Project' },
              ...projects.map(p => ({ value: p._id, label: `${p.title || p.name} (${p.projectId || ''})` }))
            ]}
            value={formData.project}
            onChange={(e) => setFormData({ ...formData, project: e.target.value })}
            required
          />
          <Select
            label="Material"
            options={[
              { value: '', label: 'Select Material' },
              ...materials.map(m => ({ value: m._id, label: `${m.materialName || m.name} (${m.unit || ''})` }))
            ]}
            value={formData.material}
            onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
            <Input
              label="Estimated Unit Price (INR)"
              type="number"
              value={formData.estimatedUnitPrice}
              onChange={(e) => setFormData({ ...formData, estimatedUnitPrice: e.target.value })}
              required
            />
          </div>
          <Input
            label="Delivery Location"
            value={formData.deliveryLocation}
            onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
            required
          />
          <Input
            label="Required By Date"
            type="date"
            value={formData.requiredByDate}
            onChange={(e) => setFormData({ ...formData, requiredByDate: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason/Notes</label>
            <textarea
              value={formData.requisitionReason}
              onChange={(e) => setFormData({ ...formData, requisitionReason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Requisition</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default PurchaseRequisitions
