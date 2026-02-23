import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, MoreVertical, Package, Eye, Edit, Trash2, AlertTriangle, Save } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/helpers'
import { materialsAPI } from '../../utils/api'

const MaterialsList = () => {
  const navigate = useNavigate()
  const { id: urlId } = useParams()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    skuCode: '',
    materialName: '',
    description: '',
    category: 'other',
    unit: 'pcs',
    unitPrice: '',
    gstRate: 18,
    hsnCode: '',
    defaultReorderLevel: '',
    defaultMaxStock: '',
    leadTime: 7,
  })
  const [saving, setSaving] = useState(false)

  // Detail/Edit state
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [editData, setEditData] = useState({})
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    loadMaterials()
  }, [pagination.page, search, categoryFilter, statusFilter])

  const loadMaterials = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      if (statusFilter) params.isActive = statusFilter === 'Active'

      const response = await materialsAPI.getAll(params)
      setMaterials(response.data || [])
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.pages
        }))
      }
    } catch (err) {
      console.error('Failed to load materials:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await materialsAPI.create({
        ...formData,
        unitPrice: parseFloat(formData.unitPrice) || 0,
        gstRate: parseFloat(formData.gstRate) || 18,
        defaultReorderLevel: parseInt(formData.defaultReorderLevel) || 0,
        defaultMaxStock: parseInt(formData.defaultMaxStock) || 0,
        leadTime: parseInt(formData.leadTime) || 7,
      })
      setShowCreateModal(false)
      setFormData({
        skuCode: '',
        materialName: '',
        description: '',
        category: 'other',
        unit: 'pcs',
        unitPrice: '',
        gstRate: 18,
        hsnCode: '',
        defaultReorderLevel: '',
        defaultMaxStock: '',
        leadTime: 7,
      })
      loadMaterials()
    } catch (err) {
      console.error('Failed to create material:', err)
      alert(err.message || 'Failed to create material')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    try {
      await materialsAPI.delete(id)
      loadMaterials()
    } catch (err) {
      console.error('Failed to delete material:', err)
      alert(err.message || 'Failed to delete material')
    }
  }

  // Open detail/edit modal
  const openDetail = async (materialId, editMode = false) => {
    setDetailLoading(true)
    setShowDetailModal(true)
    setIsEditing(editMode)
    try {
      const response = await materialsAPI.getOne(materialId)
      const mat = response.data
      setSelectedMaterial(mat)
      setEditData({
        skuCode: mat.skuCode || '',
        materialName: mat.materialName || '',
        description: mat.description || '',
        category: mat.category || 'other',
        subCategory: mat.subCategory || '',
        unit: mat.unit || 'pcs',
        unitPrice: mat.unitPrice || 0,
        hsnCode: mat.hsnCode || '',
        gstRate: mat.gstRate || 18,
        defaultReorderLevel: mat.defaultReorderLevel || 10,
        defaultMaxStock: mat.defaultMaxStock || 1000,
        leadTime: mat.leadTime || 7,
        isActive: mat.isActive !== false,
        brand: mat.specifications?.brand || '',
        model: mat.specifications?.model || '',
        size: mat.specifications?.size || '',
        color: mat.specifications?.color || '',
        weight: mat.specifications?.weight || '',
        dimensions: mat.specifications?.dimensions || '',
      })
    } catch (err) {
      console.error('Failed to load material:', err)
      alert(err.message || 'Failed to load material')
      setShowDetailModal(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setShowDetailModal(false)
    setSelectedMaterial(null)
    setIsEditing(false)
    if (urlId) navigate('/admin/materials')
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setEditSaving(true)
    try {
      await materialsAPI.update(selectedMaterial._id, {
        ...editData,
        specifications: {
          brand: editData.brand,
          model: editData.model,
          size: editData.size,
          color: editData.color,
          weight: editData.weight ? parseFloat(editData.weight) : undefined,
          dimensions: editData.dimensions,
        },
        unitPrice: parseFloat(editData.unitPrice) || 0,
        defaultReorderLevel: parseInt(editData.defaultReorderLevel) || 0,
        defaultMaxStock: parseInt(editData.defaultMaxStock) || 0,
        leadTime: parseInt(editData.leadTime) || 7,
        gstRate: parseFloat(editData.gstRate) || 18,
      })
      setIsEditing(false)
      loadMaterials()
      // Re-fetch the updated material
      const response = await materialsAPI.getOne(selectedMaterial._id)
      setSelectedMaterial(response.data)
    } catch (err) {
      console.error('Failed to update material:', err)
      alert(err.message || 'Failed to update material')
    } finally {
      setEditSaving(false)
    }
  }

  // Auto-open modal when URL has :id
  useEffect(() => {
    if (urlId) {
      openDetail(urlId)
    }
  }, [urlId])

  const categoryColors = {
    raw_material: 'blue',
    hardware: 'orange',
    fabric: 'purple',
    wood: 'yellow',
    glass: 'cyan',
    metal: 'gray',
    electrical: 'yellow',
    plumbing: 'cyan',
    paint: 'green',
    adhesive: 'orange',
    other: 'gray',
  }

  const categoryLabels = {
    raw_material: 'Raw Material',
    hardware: 'Hardware',
    fabric: 'Fabric',
    wood: 'Wood',
    glass: 'Glass',
    metal: 'Metal',
    electrical: 'Electrical',
    plumbing: 'Plumbing',
    paint: 'Paint',
    adhesive: 'Adhesive',
    other: 'Other',
  }

  // Calculate stats
  const stats = {
    total: materials.length,
    active: materials.filter(m => m.isActive !== false).length,
    inactive: materials.filter(m => m.isActive === false).length,
    totalValue: materials.reduce((sum, m) => sum + ((m.unitPrice || 0) * (m.defaultReorderLevel || 0)), 0),
  }

  return (
    <div>
      <PageHeader
        title="Materials"
        description="Manage material master data and inventory"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Inventory' }, { label: 'Materials' }]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>Add Material</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <Package className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Materials</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.inactive}</p>
              <p className="text-sm text-gray-500">Inactive</p>
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
            placeholder="Search SKU, name..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Categories' },
              { value: 'raw_material', label: 'Raw Material' },
              { value: 'hardware', label: 'Hardware' },
              { value: 'fabric', label: 'Fabric' },
              { value: 'wood', label: 'Wood' },
              { value: 'glass', label: 'Glass' },
              { value: 'metal', label: 'Metal' },
              { value: 'electrical', label: 'Electrical' },
              { value: 'plumbing', label: 'Plumbing' },
              { value: 'paint', label: 'Paint' },
              { value: 'adhesive', label: 'Adhesive' },
              { value: 'other', label: 'Other' },
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-40"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
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
        ) : materials.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No materials found"
            description="Add your first material to get started"
            action={() => setShowCreateModal(true)}
            actionLabel="Add Material"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Material</Table.Head>
                  <Table.Head>Category</Table.Head>
                  <Table.Head>Unit</Table.Head>
                  <Table.Head>Unit Price</Table.Head>
                  <Table.Head>GST</Table.Head>
                  <Table.Head>Reorder Level</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {materials.map((material) => (
                    <Table.Row key={material._id}>
                      <Table.Cell>
                        <div>
                          <p className="font-medium text-gray-900">{material.materialName}</p>
                          <p className="text-xs text-gray-500">{material.skuCode}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={categoryColors[material.category] || 'gray'}>
                          {categoryLabels[material.category] || material.category}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-gray-900">{material.unit}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(material.unitPrice)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-gray-500">{material.gstRate || 18}%</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-gray-500">
                          {material.defaultReorderLevel || 0} {material.unit}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={material.isActive !== false ? 'green' : 'red'}>
                          {material.isActive !== false ? 'Active' : 'Inactive'}
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
                          <Dropdown.Item icon={Eye} onClick={() => openDetail(material._id, false)}>
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Item icon={Edit} onClick={() => openDetail(material._id, true)}>Edit</Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item icon={Trash2} danger onClick={() => handleDelete(material._id)}>Delete</Dropdown.Item>
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
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Material" size="lg">
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Input
              label="SKU Code"
              value={formData.skuCode}
              onChange={(e) => setFormData({ ...formData, skuCode: e.target.value })}
              placeholder="Auto-generated if empty"
            />
            <Input
              label="Material Name *"
              value={formData.materialName}
              onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Material description..."
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Select
              label="Category *"
              options={[
                { value: 'raw_material', label: 'Raw Material' },
                { value: 'hardware', label: 'Hardware' },
                { value: 'fabric', label: 'Fabric' },
                { value: 'wood', label: 'Wood' },
                { value: 'glass', label: 'Glass' },
                { value: 'metal', label: 'Metal' },
                { value: 'electrical', label: 'Electrical' },
                { value: 'plumbing', label: 'Plumbing' },
                { value: 'paint', label: 'Paint' },
                { value: 'adhesive', label: 'Adhesive' },
                { value: 'other', label: 'Other' },
              ]}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
            <Select
              label="Unit *"
              options={[
                { value: 'pcs', label: 'Pieces (pcs)' },
                { value: 'kg', label: 'Kilograms (kg)' },
                { value: 'g', label: 'Grams (g)' },
                { value: 'ltr', label: 'Liters (ltr)' },
                { value: 'ml', label: 'Milliliters (ml)' },
                { value: 'sqft', label: 'Square Feet (sqft)' },
                { value: 'sqm', label: 'Square Meters (sqm)' },
                { value: 'rft', label: 'Running Feet (rft)' },
                { value: 'mtr', label: 'Meters (mtr)' },
                { value: 'nos', label: 'Numbers (nos)' },
                { value: 'set', label: 'Set' },
                { value: 'box', label: 'Box' },
                { value: 'roll', label: 'Roll' },
                { value: 'sheet', label: 'Sheet' },
              ]}
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />
            <Input
              label="HSN Code"
              value={formData.hsnCode}
              onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Input
              label="Unit Price (INR) *"
              type="number"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              required
            />
            <Select
              label="GST Rate"
              options={[
                { value: 0, label: '0%' },
                { value: 5, label: '5%' },
                { value: 12, label: '12%' },
                { value: 18, label: '18%' },
                { value: 28, label: '28%' },
              ]}
              value={formData.gstRate}
              onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
            />
            <Input
              label="Lead Time (days)"
              type="number"
              value={formData.leadTime}
              onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Input
              label="Reorder Level"
              type="number"
              value={formData.defaultReorderLevel}
              onChange={(e) => setFormData({ ...formData, defaultReorderLevel: e.target.value })}
            />
            <Input
              label="Max Stock"
              type="number"
              value={formData.defaultMaxStock}
              onChange={(e) => setFormData({ ...formData, defaultMaxStock: e.target.value })}
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Material</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Detail / Edit Modal */}
      <Modal isOpen={showDetailModal} onClose={closeDetail} title={isEditing ? 'Edit Material' : 'Material Details'} size="lg">
        {detailLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <PageLoader />
          </div>
        ) : selectedMaterial && !isEditing ? (
          /* View Mode */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedMaterial.materialName}</h3>
                <p className="text-sm text-gray-500">{selectedMaterial.skuCode}</p>
              </div>
              <Badge color={selectedMaterial.isActive !== false ? 'green' : 'red'}>
                {selectedMaterial.isActive !== false ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 12 }}>
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <p className="text-sm font-medium text-gray-900" style={{ textTransform: 'capitalize' }}>{(selectedMaterial.category || '').replace('_', ' ')}</p>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 12 }}>
                <p className="text-xs text-gray-500 mb-1">Unit</p>
                <p className="text-sm font-medium text-gray-900">{selectedMaterial.unit}</p>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 12 }}>
                <p className="text-xs text-gray-500 mb-1">Unit Price</p>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(selectedMaterial.unitPrice)}</p>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 12 }}>
                <p className="text-xs text-gray-500 mb-1">GST Rate</p>
                <p className="text-sm font-medium text-gray-900">{selectedMaterial.gstRate || 18}%</p>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 12 }}>
                <p className="text-xs text-gray-500 mb-1">HSN Code</p>
                <p className="text-sm font-medium text-gray-900">{selectedMaterial.hsnCode || '-'}</p>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 12 }}>
                <p className="text-xs text-gray-500 mb-1">Lead Time</p>
                <p className="text-sm font-medium text-gray-900">{selectedMaterial.leadTime || 7} days</p>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 12 }}>
                <p className="text-xs text-gray-500 mb-1">Reorder Level</p>
                <p className="text-sm font-medium text-gray-900">{selectedMaterial.defaultReorderLevel || 0} {selectedMaterial.unit}</p>
              </div>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 12 }}>
                <p className="text-xs text-gray-500 mb-1">Max Stock</p>
                <p className="text-sm font-medium text-gray-900">{selectedMaterial.defaultMaxStock || 0} {selectedMaterial.unit}</p>
              </div>
            </div>

            {selectedMaterial.description && (
              <div style={{ marginBottom: 20 }}>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{selectedMaterial.description}</p>
              </div>
            )}

            {/* Specifications */}
            {selectedMaterial.specifications && Object.values(selectedMaterial.specifications).some(v => v) && (
              <div style={{ marginBottom: 20 }}>
                <p className="text-sm font-semibold text-gray-900 mb-3">Specifications</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {selectedMaterial.specifications.brand && (
                    <div style={{ padding: 10, background: '#f8fafc', borderRadius: 10 }}>
                      <p className="text-xs text-gray-500">Brand</p>
                      <p className="text-sm font-medium text-gray-900">{selectedMaterial.specifications.brand}</p>
                    </div>
                  )}
                  {selectedMaterial.specifications.model && (
                    <div style={{ padding: 10, background: '#f8fafc', borderRadius: 10 }}>
                      <p className="text-xs text-gray-500">Model</p>
                      <p className="text-sm font-medium text-gray-900">{selectedMaterial.specifications.model}</p>
                    </div>
                  )}
                  {selectedMaterial.specifications.size && (
                    <div style={{ padding: 10, background: '#f8fafc', borderRadius: 10 }}>
                      <p className="text-xs text-gray-500">Size</p>
                      <p className="text-sm font-medium text-gray-900">{selectedMaterial.specifications.size}</p>
                    </div>
                  )}
                  {selectedMaterial.specifications.color && (
                    <div style={{ padding: 10, background: '#f8fafc', borderRadius: 10 }}>
                      <p className="text-xs text-gray-500">Color</p>
                      <p className="text-sm font-medium text-gray-900">{selectedMaterial.specifications.color}</p>
                    </div>
                  )}
                  {selectedMaterial.specifications.weight && (
                    <div style={{ padding: 10, background: '#f8fafc', borderRadius: 10 }}>
                      <p className="text-xs text-gray-500">Weight</p>
                      <p className="text-sm font-medium text-gray-900">{selectedMaterial.specifications.weight}</p>
                    </div>
                  )}
                  {selectedMaterial.specifications.dimensions && (
                    <div style={{ padding: 10, background: '#f8fafc', borderRadius: 10 }}>
                      <p className="text-xs text-gray-500">Dimensions</p>
                      <p className="text-sm font-medium text-gray-900">{selectedMaterial.specifications.dimensions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Modal.Footer>
              <Button variant="secondary" onClick={closeDetail}>Close</Button>
              <Button icon={Edit} onClick={() => setIsEditing(true)}>Edit Material</Button>
            </Modal.Footer>
          </div>
        ) : selectedMaterial && isEditing ? (
          /* Edit Mode */
          <form onSubmit={handleUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Input
                label="SKU Code"
                value={editData.skuCode}
                onChange={(e) => setEditData({ ...editData, skuCode: e.target.value })}
                required
              />
              <Input
                label="Material Name"
                value={editData.materialName}
                onChange={(e) => setEditData({ ...editData, materialName: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Input
                label="Description"
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Material description..."
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Select
                label="Category"
                options={[
                  { value: 'raw_material', label: 'Raw Material' },
                  { value: 'hardware', label: 'Hardware' },
                  { value: 'fabric', label: 'Fabric' },
                  { value: 'wood', label: 'Wood' },
                  { value: 'glass', label: 'Glass' },
                  { value: 'metal', label: 'Metal' },
                  { value: 'electrical', label: 'Electrical' },
                  { value: 'plumbing', label: 'Plumbing' },
                  { value: 'paint', label: 'Paint' },
                  { value: 'adhesive', label: 'Adhesive' },
                  { value: 'other', label: 'Other' },
                ]}
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              />
              <Input
                label="Sub Category"
                value={editData.subCategory}
                onChange={(e) => setEditData({ ...editData, subCategory: e.target.value })}
              />
              <Select
                label="Unit"
                options={[
                  { value: 'pcs', label: 'Pieces (pcs)' },
                  { value: 'kg', label: 'Kilograms (kg)' },
                  { value: 'g', label: 'Grams (g)' },
                  { value: 'ltr', label: 'Liters (ltr)' },
                  { value: 'ml', label: 'Milliliters (ml)' },
                  { value: 'sqft', label: 'Square Feet (sqft)' },
                  { value: 'sqm', label: 'Square Meters (sqm)' },
                  { value: 'rft', label: 'Running Feet (rft)' },
                  { value: 'mtr', label: 'Meters (mtr)' },
                  { value: 'nos', label: 'Numbers (nos)' },
                  { value: 'set', label: 'Set' },
                  { value: 'box', label: 'Box' },
                  { value: 'roll', label: 'Roll' },
                  { value: 'sheet', label: 'Sheet' },
                ]}
                value={editData.unit}
                onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Input
                label="Unit Price (INR)"
                type="number"
                value={editData.unitPrice}
                onChange={(e) => setEditData({ ...editData, unitPrice: e.target.value })}
              />
              <Input
                label="HSN Code"
                value={editData.hsnCode}
                onChange={(e) => setEditData({ ...editData, hsnCode: e.target.value })}
              />
              <Select
                label="GST Rate"
                options={[
                  { value: 0, label: '0%' },
                  { value: 5, label: '5%' },
                  { value: 12, label: '12%' },
                  { value: 18, label: '18%' },
                  { value: 28, label: '28%' },
                ]}
                value={editData.gstRate}
                onChange={(e) => setEditData({ ...editData, gstRate: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Input
                label="Reorder Level"
                type="number"
                value={editData.defaultReorderLevel}
                onChange={(e) => setEditData({ ...editData, defaultReorderLevel: e.target.value })}
              />
              <Input
                label="Max Stock"
                type="number"
                value={editData.defaultMaxStock}
                onChange={(e) => setEditData({ ...editData, defaultMaxStock: e.target.value })}
              />
              <Input
                label="Lead Time (days)"
                type="number"
                value={editData.leadTime}
                onChange={(e) => setEditData({ ...editData, leadTime: e.target.value })}
              />
            </div>

            <p className="text-sm font-semibold text-gray-900 mb-3">Specifications</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Input
                label="Brand"
                value={editData.brand}
                onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
              />
              <Input
                label="Model"
                value={editData.model}
                onChange={(e) => setEditData({ ...editData, model: e.target.value })}
              />
              <Input
                label="Size"
                value={editData.size}
                onChange={(e) => setEditData({ ...editData, size: e.target.value })}
              />
              <Input
                label="Color"
                value={editData.color}
                onChange={(e) => setEditData({ ...editData, color: e.target.value })}
              />
              <Input
                label="Weight"
                value={editData.weight}
                onChange={(e) => setEditData({ ...editData, weight: e.target.value })}
              />
              <Input
                label="Dimensions"
                value={editData.dimensions}
                onChange={(e) => setEditData({ ...editData, dimensions: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editData.isActive}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: '#C59C82' }}
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>

            <Modal.Footer>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" icon={Save} loading={editSaving}>Save Changes</Button>
            </Modal.Footer>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}

export default MaterialsList
