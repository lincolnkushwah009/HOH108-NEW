import { useState, useEffect } from 'react'
import { Plus, MoreVertical, Package, Edit, Trash2, Eye, AlertCircle, TrendingUp, TrendingDown, Building2, Link2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../utils/helpers'
import { materialPricelistAPI, vendorsAPI } from '../../utils/api'
import { useCompany } from '../../context/CompanyContext'

const MaterialPricelist = () => {
  const { isViewingAllCompanies } = useCompany()
  const [materials, setMaterials] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [materialTypeFilter, setMaterialTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [formData, setFormData] = useState({
    materialType: '',
    brand: '',
    category: '',
    subCategory: '',
    unit: 'unit',
    currentPrice: '',
    currentPriceMax: '',
    priceType: 'fixed',
    status: 'active'
  })
  const [vendorFormData, setVendorFormData] = useState({
    vendor: '',
    vendorPrice: '',
    remarks: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMaterials()
    loadVendors()
  }, [pagination.page, search, materialTypeFilter, categoryFilter])

  const loadMaterials = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await materialPricelistAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        materialType: materialTypeFilter,
        category: categoryFilter
      })
      setMaterials(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load materials:', err)
      setError('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const loadVendors = async () => {
    try {
      const response = await vendorsAPI.getAll({ limit: 1000, status: 'active' })
      setVendors(response.data || [])
    } catch (err) {
      console.error('Failed to load vendors:', err)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await materialPricelistAPI.create(formData)
      setShowEditModal(false)
      resetForm()
      loadMaterials()
    } catch (err) {
      console.error('Failed to create material:', err)
      alert('Failed to create material: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedMaterial) return
    setSaving(true)
    try {
      await materialPricelistAPI.update(selectedMaterial._id, formData)
      setShowEditModal(false)
      setSelectedMaterial(null)
      resetForm()
      loadMaterials()
    } catch (err) {
      console.error('Failed to update material:', err)
      alert('Failed to update material: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this material?')) return
    try {
      await materialPricelistAPI.delete(id)
      loadMaterials()
    } catch (err) {
      console.error('Failed to delete material:', err)
      alert('Failed to delete material')
    }
  }

  const handleAddVendor = async (e) => {
    e.preventDefault()
    if (!selectedMaterial) return
    setSaving(true)
    try {
      await materialPricelistAPI.addVendor(selectedMaterial._id, vendorFormData)
      setShowVendorModal(false)
      setVendorFormData({ vendor: '', vendorPrice: '', remarks: '' })
      loadMaterials()
      // Refresh detail if open
      if (showDetailModal) {
        const updated = await materialPricelistAPI.getOne(selectedMaterial._id)
        setSelectedMaterial(updated.data)
      }
    } catch (err) {
      console.error('Failed to add vendor:', err)
      alert('Failed to add vendor: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveVendor = async (materialId, vendorEntryId) => {
    if (!confirm('Remove this vendor from material?')) return
    try {
      await materialPricelistAPI.removeVendor(materialId, vendorEntryId)
      loadMaterials()
      if (showDetailModal && selectedMaterial) {
        const updated = await materialPricelistAPI.getOne(materialId)
        setSelectedMaterial(updated.data)
      }
    } catch (err) {
      console.error('Failed to remove vendor:', err)
      alert('Failed to remove vendor')
    }
  }

  const resetForm = () => {
    setFormData({
      materialType: '',
      brand: '',
      category: '',
      subCategory: '',
      unit: 'unit',
      currentPrice: '',
      currentPriceMax: '',
      priceType: 'fixed',
      status: 'active'
    })
  }

  const handleEdit = (material) => {
    setSelectedMaterial(material)
    setFormData({
      materialType: material.materialType || '',
      brand: material.brand || '',
      category: material.category || '',
      subCategory: material.subCategory || '',
      unit: material.unit || 'unit',
      currentPrice: material.currentPrice || '',
      currentPriceMax: material.currentPriceMax || '',
      priceType: material.priceType || 'fixed',
      status: material.status || 'active'
    })
    setShowEditModal(true)
  }

  const handleViewDetails = async (material) => {
    try {
      const response = await materialPricelistAPI.getOne(material._id)
      setSelectedMaterial(response.data)
      setShowDetailModal(true)
    } catch (err) {
      console.error('Failed to load material details:', err)
      alert('Failed to load material details')
    }
  }

  const openAddVendorModal = (material) => {
    setSelectedMaterial(material)
    setVendorFormData({ vendor: '', vendorPrice: '', remarks: '' })
    setShowVendorModal(true)
  }

  const materialTypeColors = {
    cement: 'blue',
    steel: 'gray',
    blocks: 'orange',
    aggregate: 'yellow',
    rmc: 'purple',
    plywood: 'brown',
    hardware: 'green',
    tiles: 'pink',
    sanitaryware: 'cyan',
    electrical: 'red',
    plumbing: 'indigo',
    other: 'gray'
  }

  const materialTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'cement', label: 'Cement' },
    { value: 'steel', label: 'Steel' },
    { value: 'blocks', label: 'Blocks' },
    { value: 'aggregate', label: 'Aggregate' },
    { value: 'rmc', label: 'RMC' },
    { value: 'plywood', label: 'Plywood' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'tiles', label: 'Tiles' },
    { value: 'sanitaryware', label: 'Sanitaryware' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'other', label: 'Other' }
  ]

  const unitOptions = [
    { value: 'unit', label: 'Unit' },
    { value: 'bag', label: 'Bag' },
    { value: 'ton', label: 'Ton' },
    { value: 'kg', label: 'Kg' },
    { value: 'cft', label: 'CFT' },
    { value: 'm3', label: 'M3' },
    { value: 'sqft', label: 'Sq.Ft' },
    { value: 'sqm', label: 'Sq.M' },
    { value: 'ltr', label: 'Litre' },
    { value: 'nos', label: 'Nos' }
  ]

  const renderPrice = (material) => {
    if (material.priceType === 'range' && material.currentPriceMax) {
      return `${formatCurrency(material.currentPrice)} - ${formatCurrency(material.currentPriceMax)}`
    }
    return formatCurrency(material.currentPrice)
  }

  return (
    <div>
      <PageHeader
        title="Material Pricelist"
        description="Manage material prices and vendor mappings"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Procurement' }, { label: 'Material Pricelist' }]}
        actions={
          <div className="relative group">
            <Button
              icon={Plus}
              onClick={() => {
                resetForm()
                setSelectedMaterial(null)
                setShowEditModal(true)
              }}
              disabled={isViewingAllCompanies}
            >
              Add Material
            </Button>
            {isViewingAllCompanies && (
              <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span>Select a specific company to add materials</span>
                </div>
              </div>
            )}
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-6" padding="sm">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by brand, category..."
            className="flex-1 max-w-md"
          />
          <Select
            options={materialTypeOptions}
            value={materialTypeFilter}
            onChange={(e) => setMaterialTypeFilter(e.target.value)}
            className="w-40"
          />
          <Input
            placeholder="Filter by category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
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
            description={isViewingAllCompanies ? "Select a specific company to add materials" : "Add your first material to get started"}
            action={isViewingAllCompanies ? null : () => {
              resetForm()
              setSelectedMaterial(null)
              setShowEditModal(true)
            }}
            actionLabel={isViewingAllCompanies ? null : "Add Material"}
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Brand / Item</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Category</Table.Head>
                  <Table.Head>Unit</Table.Head>
                  <Table.Head>Price</Table.Head>
                  <Table.Head>Vendors</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {materials.map((material) => (
                  <Table.Row key={material._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{material.brand}</p>
                        {material.specification && (
                          <p className="text-xs text-gray-500">{material.specification}</p>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={materialTypeColors[material.materialType] || 'gray'}>
                        {material.materialType?.charAt(0).toUpperCase() + material.materialType?.slice(1)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{material.category}</p>
                        {material.subCategory && (
                          <p className="text-xs text-gray-500">{material.subCategory}</p>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-600">per {material.unit}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900">
                          {renderPrice(material)}
                        </span>
                        {material.priceType === 'range' && (
                          <TrendingUp className="h-3 w-3 text-amber-600" />
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {material.preferredVendors?.length || 0}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={material.status === 'active' ? 'green' : 'gray'}>
                        {material.status?.charAt(0).toUpperCase() + material.status?.slice(1)}
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
                        <Dropdown.Item icon={Eye} onClick={() => handleViewDetails(material)}>
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item icon={Edit} onClick={() => handleEdit(material)}>Edit</Dropdown.Item>
                        <Dropdown.Item icon={Link2} onClick={() => openAddVendorModal(material)}>
                          Link Vendor
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item icon={Trash2} danger onClick={() => handleDelete(material._id)}>
                          Delete
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedMaterial(null); resetForm() }}
        title={selectedMaterial ? `Edit Material - ${selectedMaterial.brand}` : 'Add Material'}
        size="lg"
      >
        <form onSubmit={selectedMaterial ? handleUpdate : handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Brand / Item Name"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              required
            />
            <Select
              label="Material Type"
              options={materialTypeOptions.filter(o => o.value !== '')}
              value={formData.materialType}
              onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Cement, Steel, Blocks"
            />
            <Input
              label="Sub Category"
              value={formData.subCategory}
              onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
              placeholder="e.g., OPC, PPC, TMT"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Unit"
              options={unitOptions}
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
            <Input
              label="Min Price"
              type="number"
              value={formData.currentPrice}
              onChange={(e) => setFormData({ ...formData, currentPrice: e.target.value })}
              required
            />
            <Input
              label="Max Price (optional)"
              type="number"
              value={formData.currentPriceMax}
              onChange={(e) => setFormData({ ...formData, currentPriceMax: e.target.value, priceType: e.target.value ? 'range' : 'fixed' })}
              placeholder="For price range"
            />
          </div>
          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedMaterial(null); resetForm() }}>Cancel</Button>
            <Button type="submit" loading={saving}>
              {selectedMaterial ? 'Update Material' : 'Create Material'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedMaterial(null) }}
        title={selectedMaterial ? `${selectedMaterial.brand} - Details` : 'Material Details'}
        size="lg"
      >
        {selectedMaterial && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Brand</label>
                <p className="text-gray-900 font-medium">{selectedMaterial.brand}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Type</label>
                <p>
                  <Badge color={materialTypeColors[selectedMaterial.materialType] || 'gray'}>
                    {selectedMaterial.materialType}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Category</label>
                <p className="text-gray-900">{selectedMaterial.category || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Sub Category</label>
                <p className="text-gray-900">{selectedMaterial.subCategory || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Unit</label>
                <p className="text-gray-900">per {selectedMaterial.unit}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Current Price</label>
                <p className="text-gray-900 font-semibold text-lg">{renderPrice(selectedMaterial)}</p>
              </div>
            </div>

            {/* Preferred Vendors */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Linked Vendors</h4>
                <Button size="sm" variant="secondary" icon={Plus} onClick={() => openAddVendorModal(selectedMaterial)}>
                  Add Vendor
                </Button>
              </div>
              {selectedMaterial.preferredVendors?.length > 0 ? (
                <div className="space-y-2">
                  {selectedMaterial.preferredVendors.map((pv) => (
                    <div key={pv._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{pv.vendor?.name || 'Unknown Vendor'}</p>
                          <p className="text-xs text-gray-500">{pv.vendor?.vendorId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {pv.vendorPrice && (
                          <span className="text-sm font-medium text-green-600">{formatCurrency(pv.vendorPrice)}</span>
                        )}
                        <button
                          onClick={() => handleRemoveVendor(selectedMaterial._id, pv._id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No vendors linked yet</p>
                </div>
              )}
            </div>

            {/* Price History */}
            {selectedMaterial.priceHistory?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Price History</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedMaterial.priceHistory.map((ph, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-600">
                        {new Date(ph.effectiveDate).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(ph.price)}
                        {ph.priceMax && ` - ${formatCurrency(ph.priceMax)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showVendorModal}
        onClose={() => { setShowVendorModal(false) }}
        title="Link Vendor to Material"
        size="md"
      >
        <form onSubmit={handleAddVendor} className="space-y-4">
          <Select
            label="Select Vendor"
            options={[
              { value: '', label: 'Choose a vendor...' },
              ...vendors.map(v => ({ value: v._id, label: `${v.name} (${v.vendorId || 'N/A'})` }))
            ]}
            value={vendorFormData.vendor}
            onChange={(e) => setVendorFormData({ ...vendorFormData, vendor: e.target.value })}
            required
          />
          <Input
            label="Vendor Price (Optional)"
            type="number"
            value={vendorFormData.vendorPrice}
            onChange={(e) => setVendorFormData({ ...vendorFormData, vendorPrice: e.target.value })}
            placeholder="Vendor's quoted price"
          />
          <Input
            label="Remarks (Optional)"
            value={vendorFormData.remarks}
            onChange={(e) => setVendorFormData({ ...vendorFormData, remarks: e.target.value })}
            placeholder="Any notes about this vendor"
          />
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowVendorModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Link Vendor</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default MaterialPricelist
