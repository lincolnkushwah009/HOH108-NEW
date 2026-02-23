import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, MoreVertical, ClipboardList, Eye, Edit, Trash2, Copy, CheckCircle,
  XCircle, Send, GitBranch, Package, FileText
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { bomAPI, projectsAPI, materialsAPI } from '../../utils/api'

const BillOfMaterials = () => {
  const navigate = useNavigate()
  const [boms, setBoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [selectedBom, setSelectedBom] = useState(null)
  const [projects, setProjects] = useState([])
  const [materials, setMaterials] = useState([])
  const [formData, setFormData] = useState({
    project: '',
    name: '',
    description: '',
    type: 'standard',
    outputQuantity: 1
  })
  const [itemFormData, setItemFormData] = useState({
    material: '',
    quantity: 1,
    wastagePercent: 0,
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBoms()
  }, [pagination.page, search, statusFilter, projectFilter])

  useEffect(() => {
    loadProjectsAndMaterials()
  }, [])

  const loadProjectsAndMaterials = async () => {
    try {
      const [projectsRes, materialsRes] = await Promise.all([
        projectsAPI.getAll({ limit: 100 }),
        materialsAPI.getAll({ limit: 200 })
      ])
      setProjects(projectsRes.data || [])
      setMaterials(materialsRes.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const loadBoms = async () => {
    setLoading(true)
    try {
      const response = await bomAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        project: projectFilter
      })
      setBoms(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load BOMs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const project = projects.find(p => p._id === formData.project)
      await bomAPI.create({
        ...formData,
        projectName: project?.title || project?.name
      })
      setShowCreateModal(false)
      setFormData({
        project: '',
        name: '',
        description: '',
        type: 'standard',
        outputQuantity: 1
      })
      loadBoms()
    } catch (err) {
      console.error('Failed to create BOM:', err)
      alert('Failed to create BOM: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (!selectedBom) return
    setSaving(true)
    try {
      const material = materials.find(m => m._id === itemFormData.material)
      await bomAPI.addItem(selectedBom._id, {
        material: itemFormData.material,
        materialName: material?.materialName || material?.name,
        skuCode: material?.skuCode,
        unit: material?.unit,
        quantity: parseFloat(itemFormData.quantity),
        unitCost: material?.unitPrice || 0,
        wastagePercent: parseFloat(itemFormData.wastagePercent) || 0,
        notes: itemFormData.notes
      })
      setShowItemModal(false)
      setItemFormData({
        material: '',
        quantity: 1,
        wastagePercent: 0,
        notes: ''
      })
      loadBoms()
    } catch (err) {
      console.error('Failed to add item:', err)
      alert('Failed to add item: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (id) => {
    try {
      await bomAPI.submit(id)
      loadBoms()
    } catch (err) {
      console.error('Failed to submit:', err)
      alert('Failed to submit: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleApprove = async (id) => {
    try {
      await bomAPI.approve(id)
      loadBoms()
    } catch (err) {
      console.error('Failed to approve:', err)
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await bomAPI.reject(id, reason)
      loadBoms()
    } catch (err) {
      console.error('Failed to reject:', err)
    }
  }

  const handleActivate = async (id) => {
    try {
      await bomAPI.activate(id)
      loadBoms()
    } catch (err) {
      console.error('Failed to activate:', err)
    }
  }

  const handleCopy = async (id) => {
    const newName = prompt('Enter name for the copied BOM:')
    if (!newName) return
    try {
      await bomAPI.copy(id, newName)
      loadBoms()
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleNewVersion = async (id) => {
    if (!confirm('Create a new version of this BOM?')) return
    try {
      await bomAPI.createNewVersion(id)
      loadBoms()
    } catch (err) {
      console.error('Failed to create new version:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this BOM?')) return
    try {
      await bomAPI.delete(id)
      loadBoms()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const statusColors = {
    draft: 'gray',
    pending_approval: 'yellow',
    approved: 'blue',
    active: 'green',
    inactive: 'gray',
    rejected: 'red'
  }

  const typeColors = {
    standard: 'blue',
    template: 'purple',
    custom: 'green'
  }

  return (
    <div>
      <PageHeader
        title="Bill of Materials"
        description="Manage BOMs for production"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'PPC', path: '/admin/ppc' },
          { label: 'Bill of Materials' }
        ]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>New BOM</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {['draft', 'pending_approval', 'approved', 'active', 'inactive'].map((status) => (
          <Card
            key={status}
            className={`cursor-pointer ${statusFilter === status ? 'ring-2 ring-amber-600' : ''}`}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
          >
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {boms.filter(b => b.status === status).length}
              </p>
              <p className="text-sm text-gray-500 capitalize">{status.replace(/_/g, ' ')}</p>
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
            placeholder="Search BOMs..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'pending_approval', label: 'Pending Approval' },
              { value: 'approved', label: 'Approved' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44"
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
        ) : boms.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No BOMs found"
            description="Create your first Bill of Materials"
            action={() => setShowCreateModal(true)}
            actionLabel="New BOM"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>BOM #</Table.Head>
                  <Table.Head>Item / Name</Table.Head>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Items</Table.Head>
                  <Table.Head>Total Cost</Table.Head>
                  <Table.Head>Version</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {boms.map((bom) => (
                  <Table.Row key={bom._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{bom.bomId}</p>
                        <p className="text-xs text-gray-500">{formatDate(bom.createdAt)}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{bom.item?.name || bom.name || '-'}</p>
                        <p className="text-xs text-gray-500">{bom.item?.skuCode || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm text-gray-900">{bom.project?.title || bom.projectName || '-'}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={typeColors[bom.type] || 'gray'} size="sm">
                        {bom.type?.toUpperCase() || 'STANDARD'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">{bom.items?.length || 0}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(bom.totalCost || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">v{bom.version || 1}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[bom.status] || 'gray'}>
                        {bom.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Draft'}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/ppc/bom/${bom._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {bom.status === 'draft' && (
                          <>
                            <Dropdown.Item icon={Edit} onClick={() => navigate(`/admin/ppc/bom/${bom._id}/edit`)}>
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item
                              icon={Package}
                              onClick={() => {
                                setSelectedBom(bom)
                                setShowItemModal(true)
                              }}
                            >
                              Add Item
                            </Dropdown.Item>
                            <Dropdown.Item icon={Send} onClick={() => handleSubmit(bom._id)}>
                              Submit for Approval
                            </Dropdown.Item>
                          </>
                        )}
                        {bom.status === 'pending_approval' && (
                          <>
                            <Dropdown.Item icon={CheckCircle} onClick={() => handleApprove(bom._id)}>
                              Approve
                            </Dropdown.Item>
                            <Dropdown.Item icon={XCircle} onClick={() => handleReject(bom._id)}>
                              Reject
                            </Dropdown.Item>
                          </>
                        )}
                        {bom.status === 'approved' && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => handleActivate(bom._id)}>
                            Activate
                          </Dropdown.Item>
                        )}
                        {bom.status === 'active' && (
                          <Dropdown.Item icon={GitBranch} onClick={() => handleNewVersion(bom._id)}>
                            New Version
                          </Dropdown.Item>
                        )}
                        <Dropdown.Item icon={Copy} onClick={() => handleCopy(bom._id)}>
                          Copy BOM
                        </Dropdown.Item>
                        {['draft', 'inactive'].includes(bom.status) && (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item icon={Trash2} onClick={() => handleDelete(bom._id)} className="text-red-600">
                              Delete
                            </Dropdown.Item>
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

      {/* Create BOM Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Bill of Materials" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
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
          <Input
            label="Item / Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Kitchen Cabinet Set, Master Bedroom Furniture"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="BOM Type"
              options={[
                { value: 'standard', label: 'Standard' },
                { value: 'template', label: 'Template' },
                { value: 'custom', label: 'Custom' }
              ]}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
            <Input
              label="Output Quantity"
              type="number"
              min="1"
              value={formData.outputQuantity}
              onChange={(e) => setFormData({ ...formData, outputQuantity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create BOM</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Add Item Modal */}
      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title="Add BOM Item" size="md">
        <form onSubmit={handleAddItem} className="space-y-4">
          <Select
            label="Material"
            options={[
              { value: '', label: 'Select Material' },
              ...materials.map(m => ({
                value: m._id,
                label: `${m.materialName || m.name} (${m.skuCode || ''}) - ${m.unit || ''}`
              }))
            ]}
            value={itemFormData.material}
            onChange={(e) => setItemFormData({ ...itemFormData, material: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min="0.01"
              step="0.01"
              value={itemFormData.quantity}
              onChange={(e) => setItemFormData({ ...itemFormData, quantity: e.target.value })}
              required
            />
            <Input
              label="Wastage %"
              type="number"
              min="0"
              max="100"
              value={itemFormData.wastagePercent}
              onChange={(e) => setItemFormData({ ...itemFormData, wastagePercent: e.target.value })}
            />
          </div>
          <Input
            label="Notes"
            value={itemFormData.notes}
            onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })}
          />
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowItemModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add Item</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default BillOfMaterials
