import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Building2, Phone, Mail, Star, Edit, Trash2, Eye, AlertCircle, CheckCircle, XCircle, Upload, FileText, X, KeyRound, Copy, ExternalLink, Package, IndianRupee } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { vendorsAPI } from '../../utils/api'
import { useCompany } from '../../context/CompanyContext'
import { useAuth } from '../../context/AuthContext'

const VendorsList = () => {
  const navigate = useNavigate()
  const { isViewingAllCompanies } = useCompany()
  const { user } = useAuth()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    vendorType: 'supplier',
    contactPerson: '',
    phone: '',
    email: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' },
    gstNumber: '',
    panNumber: '',
  })
  const [saving, setSaving] = useState(false)
  const [pendingFiles, setPendingFiles] = useState([])
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [showPortalModal, setShowPortalModal] = useState(false)
  const [portalVendor, setPortalVendor] = useState(null)
  const [portalPassword, setPortalPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [portalCredentials, setPortalCredentials] = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [resetPasswordCredentials, setResetPasswordCredentials] = useState(null)
  // Materials state
  const [showMaterialsModal, setShowMaterialsModal] = useState(false)
  const [materialsVendor, setMaterialsVendor] = useState(null)
  const [materials, setMaterials] = useState([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [materialFormData, setMaterialFormData] = useState({
    materialName: '',
    materialType: 'other',
    category: '',
    subCategory: '',
    brand: '',
    specification: '',
    unit: 'unit',
    currentPrice: '',
    currentPriceMax: '',
    priceType: 'fixed',
    minOrderQty: '',
    leadTimeDays: '',
    gstRate: 18,
    remarks: '',
    status: 'active'
  })
  const [savingMaterial, setSavingMaterial] = useState(false)

  useEffect(() => {
    loadVendors()
  }, [pagination.page, search, statusFilter, typeFilter])

  const loadVendors = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await vendorsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        vendorType: typeFilter
      })
      setVendors(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load vendors:', err)
      setError('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only images and PDFs are allowed.`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Max 10MB allowed.`)
        return false
      }
      return true
    })
    setPendingFiles(prev => [...prev, ...validFiles])
    e.target.value = '' // Reset input
  }

  const removeFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await vendorsAPI.create(formData)
      const newVendor = response.data

      // Upload pending documents if any
      if (pendingFiles.length > 0 && newVendor?._id) {
        setUploadingDocs(true)
        try {
          await vendorsAPI.uploadDocuments(newVendor._id, pendingFiles, 'identity')
        } catch (uploadErr) {
          console.error('Failed to upload documents:', uploadErr)
          alert('Vendor created but document upload failed: ' + (uploadErr.message || 'Unknown error'))
        }
        setUploadingDocs(false)
      }

      setShowCreateModal(false)
      setFormData({
        name: '',
        vendorType: 'supplier',
        contactPerson: '',
        phone: '',
        email: '',
        address: { street: '', city: '', state: '', pincode: '', country: 'India' },
        gstNumber: '',
        panNumber: '',
      })
      setPendingFiles([])
      loadVendors()
    } catch (err) {
      console.error('Failed to create vendor:', err)
      alert('Failed to create vendor: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this vendor?')) return
    try {
      await vendorsAPI.delete(id)
      loadVendors()
    } catch (err) {
      console.error('Failed to delete vendor:', err)
      alert('Failed to delete vendor')
    }
  }

  const statusColors = {
    active: 'green',
    inactive: 'gray',
    blacklisted: 'red',
    pending_verification: 'yellow',
  }

  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    blacklisted: 'Blacklisted',
    pending_verification: 'Pending Approval',
  }

  const handleApprove = async (id) => {
    if (!confirm('Approve this vendor?')) return
    try {
      await vendorsAPI.approve(id)
      loadVendors()
    } catch (err) {
      console.error('Failed to approve vendor:', err)
      alert('Failed to approve vendor: ' + (err.message || 'Unknown error'))
    }
  }

  const handleReject = async (id) => {
    if (!confirm('Reject this vendor?')) return
    try {
      await vendorsAPI.reject(id)
      loadVendors()
    } catch (err) {
      console.error('Failed to reject vendor:', err)
      alert('Failed to reject vendor: ' + (err.message || 'Unknown error'))
    }
  }

  const handleEdit = (vendor) => {
    setSelectedVendor(vendor)
    // Handle contactPerson which can be an object or string
    const contactPersonName = typeof vendor.contactPerson === 'object'
      ? vendor.contactPerson?.name || ''
      : vendor.contactPerson || ''

    setFormData({
      name: vendor.name || '',
      vendorType: vendor.vendorType || vendor.category || 'supplier',
      contactPerson: contactPersonName,
      phone: vendor.phone || vendor.contactPerson?.phone || '',
      email: vendor.email || vendor.contactPerson?.email || '',
      address: vendor.address || { street: '', city: '', state: '', pincode: '', country: 'India' },
      gstNumber: vendor.gstNumber || '',
      panNumber: vendor.panNumber || '',
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!selectedVendor) return
    setSaving(true)
    try {
      await vendorsAPI.update(selectedVendor._id, formData)
      setShowEditModal(false)
      setSelectedVendor(null)
      setFormData({
        name: '',
        vendorType: 'supplier',
        contactPerson: '',
        phone: '',
        email: '',
        address: { street: '', city: '', state: '', pincode: '', country: 'India' },
        gstNumber: '',
        panNumber: '',
      })
      loadVendors()
    } catch (err) {
      console.error('Failed to update vendor:', err)
      alert('Failed to update vendor: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleViewDetails = (vendor) => {
    handleEdit(vendor) // Reuse the same logic to populate form data
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleOpenPortalModal = (vendor) => {
    if (!vendor.email) {
      alert('Vendor must have an email address to enable portal access. Please add an email first.')
      return
    }
    setPortalVendor(vendor)
    setPortalPassword(generatePassword())
    setShowPassword(false)
    setPortalCredentials(null)
    setShowPortalModal(true)
  }

  const handleEnablePortalAccess = async () => {
    if (!portalVendor || !portalPassword) return
    if (portalPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    setPortalLoading(true)
    try {
      await vendorsAPI.enablePortalAccess(portalVendor._id, {
        enabled: true,
        password: portalPassword
      })

      setPortalCredentials({
        email: portalVendor.email,
        password: portalPassword,
        portalUrl: `${window.location.origin}/vendor-portal/login`
      })
      loadVendors()
    } catch (err) {
      console.error('Failed to enable portal access:', err)
      alert('Failed to enable portal access: ' + (err.message || 'Unknown error'))
    } finally {
      setPortalLoading(false)
    }
  }

  const handleDisablePortalAccess = async (vendor) => {
    if (!confirm(`Disable portal access for ${vendor.name}?`)) return
    try {
      await vendorsAPI.enablePortalAccess(vendor._id, { enabled: false })
      loadVendors()
      alert('Portal access disabled')
    } catch (err) {
      console.error('Failed to disable portal access:', err)
      alert('Failed to disable portal access: ' + (err.message || 'Unknown error'))
    }
  }

  const handleResetPortalPassword = async (vendor) => {
    const newPassword = generatePassword()
    if (!confirm(`Reset portal password for ${vendor.name}?`)) return
    try {
      await vendorsAPI.resetPortalPassword(vendor._id, newPassword)
      setResetPasswordCredentials({
        vendorName: vendor.name,
        email: vendor.email,
        password: newPassword,
        portalUrl: `${window.location.origin}/vendor-portal/login`
      })
      setShowResetPasswordModal(true)
      loadVendors()
    } catch (err) {
      console.error('Failed to reset password:', err)
      alert('Failed to reset password: ' + (err.message || 'Unknown error'))
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  // Materials management functions
  const handleOpenMaterials = async (vendor) => {
    setMaterialsVendor(vendor)
    setShowMaterialsModal(true)
    setMaterialsLoading(true)
    try {
      const response = await vendorsAPI.getMaterials(vendor._id)
      setMaterials(response.data || [])
    } catch (err) {
      console.error('Failed to load materials:', err)
      setMaterials([])
    } finally {
      setMaterialsLoading(false)
    }
  }

  const handleCloseMaterialsModal = () => {
    setShowMaterialsModal(false)
    setMaterialsVendor(null)
    setMaterials([])
  }

  const resetMaterialForm = () => {
    setMaterialFormData({
      materialName: '',
      materialType: 'other',
      category: '',
      subCategory: '',
      brand: '',
      specification: '',
      unit: 'unit',
      currentPrice: '',
      currentPriceMax: '',
      priceType: 'fixed',
      minOrderQty: '',
      leadTimeDays: '',
      gstRate: 18,
      remarks: '',
      status: 'active'
    })
    setEditingMaterial(null)
  }

  const handleAddMaterial = () => {
    resetMaterialForm()
    setShowAddMaterialModal(true)
  }

  const handleEditMaterial = (material) => {
    setEditingMaterial(material)
    setMaterialFormData({
      materialName: material.materialName || '',
      materialType: material.materialType || 'other',
      category: material.category || '',
      subCategory: material.subCategory || '',
      brand: material.brand || '',
      specification: material.specification || '',
      unit: material.unit || 'unit',
      currentPrice: material.currentPrice || '',
      currentPriceMax: material.currentPriceMax || '',
      priceType: material.priceType || 'fixed',
      minOrderQty: material.minOrderQty || '',
      leadTimeDays: material.leadTimeDays || '',
      gstRate: material.gstRate ?? 18,
      remarks: material.remarks || '',
      status: material.status || 'active'
    })
    setShowAddMaterialModal(true)
  }

  const handleSaveMaterial = async (e) => {
    e.preventDefault()
    if (!materialsVendor) return

    setSavingMaterial(true)
    try {
      const dataToSend = {
        ...materialFormData,
        currentPrice: materialFormData.currentPrice ? Number(materialFormData.currentPrice) : undefined,
        currentPriceMax: materialFormData.currentPriceMax ? Number(materialFormData.currentPriceMax) : undefined,
        minOrderQty: materialFormData.minOrderQty ? Number(materialFormData.minOrderQty) : undefined,
        leadTimeDays: materialFormData.leadTimeDays ? Number(materialFormData.leadTimeDays) : undefined,
        gstRate: Number(materialFormData.gstRate)
      }

      if (editingMaterial) {
        await vendorsAPI.updateMaterial(materialsVendor._id, editingMaterial._id, dataToSend)
      } else {
        await vendorsAPI.addMaterial(materialsVendor._id, dataToSend)
      }

      // Reload materials
      const response = await vendorsAPI.getMaterials(materialsVendor._id)
      setMaterials(response.data || [])
      setShowAddMaterialModal(false)
      resetMaterialForm()
    } catch (err) {
      console.error('Failed to save material:', err)
      alert('Failed to save material: ' + (err.message || 'Unknown error'))
    } finally {
      setSavingMaterial(false)
    }
  }

  const handleDeleteMaterial = async (materialId) => {
    if (!materialsVendor) return
    if (!confirm('Delete this material?')) return

    try {
      await vendorsAPI.deleteMaterial(materialsVendor._id, materialId)
      const response = await vendorsAPI.getMaterials(materialsVendor._id)
      setMaterials(response.data || [])
    } catch (err) {
      console.error('Failed to delete material:', err)
      alert('Failed to delete material: ' + (err.message || 'Unknown error'))
    }
  }

  const materialTypeLabels = {
    cement: 'Cement',
    steel: 'Steel',
    blocks: 'Blocks',
    aggregate: 'Aggregate',
    rmc: 'RMC',
    plywood: 'Plywood',
    hardware: 'Hardware',
    tiles: 'Tiles',
    sanitaryware: 'Sanitaryware',
    electrical: 'Electrical',
    plumbing: 'Plumbing',
    paint: 'Paint',
    glass: 'Glass',
    aluminium: 'Aluminium',
    labour: 'Labour',
    service: 'Service',
    other: 'Other'
  }

  const unitLabels = {
    unit: 'Unit',
    kg: 'Kg',
    ton: 'Ton',
    bag: 'Bag',
    sqft: 'Sq.ft',
    sqm: 'Sq.m',
    cft: 'CFT',
    m3: 'M³',
    ltr: 'Ltr',
    bundle: 'Bundle',
    box: 'Box',
    set: 'Set',
    hour: 'Hour',
    day: 'Day',
    month: 'Month',
    job: 'Job'
  }

  const typeColors = {
    supplier: 'blue',
    contractor: 'purple',
    service_provider: 'orange',
    consultant: 'green',
  }

  const typeLabels = {
    supplier: 'Supplier',
    contractor: 'Contractor',
    service_provider: 'Service Provider',
    consultant: 'Consultant',
  }

  const renderRating = (rating) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        <span className="text-sm font-medium">{rating?.toFixed(1) || '-'}</span>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Manage vendors, suppliers and contractors"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Procurement' }, { label: 'Vendors' }]}
        actions={
          <div className="relative group">
            <Button
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
              disabled={isViewingAllCompanies}
            >
              Add Vendor
            </Button>
            {isViewingAllCompanies && (
              <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span>Select a specific company to add vendors</span>
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
            placeholder="Search vendors..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'supplier', label: 'Supplier' },
              { value: 'contractor', label: 'Contractor' },
              { value: 'service_provider', label: 'Service Provider' },
              { value: 'consultant', label: 'Consultant' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-40"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending_verification', label: 'Pending Approval' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'blacklisted', label: 'Blacklisted' },
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
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No vendors found"
            description={isViewingAllCompanies ? "Select a specific company to add vendors" : "Add your first vendor to get started"}
            action={isViewingAllCompanies ? null : () => setShowCreateModal(true)}
            actionLabel={isViewingAllCompanies ? null : "Add Vendor"}
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Vendor</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Contact</Table.Head>
                  <Table.Head>Outstanding</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {vendors.map((vendor) => (
                  <Table.Row key={vendor._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{vendor.name}</p>
                        <p className="text-sm text-gray-500">{vendor.vendorId}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={typeColors[vendor.vendorType] || 'gray'}>
                        {typeLabels[vendor.vendorType] || vendor.vendorType}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{vendor.contactPerson || '-'}</p>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{vendor.phone || '-'}</span>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(vendor.totalOutstanding || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[vendor.status] || 'gray'}>
                        {statusLabels[vendor.status] || vendor.status}
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
                        <Dropdown.Item icon={Eye} onClick={() => handleViewDetails(vendor)}>
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item icon={Edit} onClick={() => handleEdit(vendor)}>Edit</Dropdown.Item>
                        <Dropdown.Item icon={Package} onClick={() => handleOpenMaterials(vendor)}>
                          View Materials
                        </Dropdown.Item>
                        {vendor.status === 'pending_verification' && (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item icon={CheckCircle} onClick={() => handleApprove(vendor._id)}>
                              Approve Vendor
                            </Dropdown.Item>
                            <Dropdown.Item icon={XCircle} danger onClick={() => handleReject(vendor._id)}>
                              Reject Vendor
                            </Dropdown.Item>
                          </>
                        )}
                        <Dropdown.Divider />
                        {vendor.portalAccess?.enabled ? (
                          <>
                            <Dropdown.Item icon={KeyRound} onClick={() => handleResetPortalPassword(vendor)}>
                              Reset Portal Password
                            </Dropdown.Item>
                            <Dropdown.Item icon={XCircle} danger onClick={() => handleDisablePortalAccess(vendor)}>
                              Disable Portal Access
                            </Dropdown.Item>
                          </>
                        ) : (
                          <Dropdown.Item icon={KeyRound} onClick={() => handleOpenPortalModal(vendor)}>
                            Enable Portal Access
                          </Dropdown.Item>
                        )}
                        {user?.role === 'super_admin' && (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item icon={Trash2} danger onClick={() => handleDelete(vendor._id)}>
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

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Vendor" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Vendor Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Vendor Type"
            options={[
              { value: 'supplier', label: 'Supplier' },
              { value: 'contractor', label: 'Contractor' },
              { value: 'service_provider', label: 'Service Provider' },
              { value: 'consultant', label: 'Consultant' },
            ]}
            value={formData.vendorType}
            onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Address"
            value={formData.address.street}
            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.address.city}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
            />
            <Input
              label="State"
              value={formData.address.state}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
            />
            <Input
              label="Pincode"
              value={formData.address.pincode}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="GSTIN"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
            <Input
              label="PAN"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
            />
          </div>

          {/* Identity Documents Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Identity Documents <span className="font-normal text-gray-500">(Optional)</span>
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#111111] hover:bg-gray-50 transition-all cursor-pointer group">
              <input
                type="file"
                id="vendor-docs"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.pdf,.webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="vendor-docs" className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-[#111111]/10 rounded-full flex items-center justify-center mb-3 transition-colors">
                  <Upload className="h-5 w-5 text-gray-400 group-hover:text-[#111111]" />
                </div>
                <p className="text-sm font-medium text-gray-700 group-hover:text-[#111111]">
                  Click to upload documents
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Aadhaar, PAN Card, GST Certificate, etc. (PNG, JPG, PDF up to 10MB)
                </p>
              </label>
            </div>

            {/* Selected Files Preview */}
            {pendingFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{pendingFiles.length} file(s) selected</p>
                {pendingFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); setPendingFiles([]) }}>Cancel</Button>
            <Button type="submit" loading={saving || uploadingDocs}>
              {uploadingDocs ? 'Uploading Documents...' : 'Create Vendor'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedVendor(null) }} title={selectedVendor ? `Edit Vendor - ${selectedVendor.name}` : 'Edit Vendor'} size="lg">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Vendor Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Vendor Type"
            options={[
              { value: 'supplier', label: 'Supplier' },
              { value: 'contractor', label: 'Contractor' },
              { value: 'service_provider', label: 'Service Provider' },
              { value: 'consultant', label: 'Consultant' },
            ]}
            value={formData.vendorType}
            onChange={(e) => setFormData({ ...formData, vendorType: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Address"
            value={formData.address?.street || ''}
            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={formData.address?.city || ''}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
            />
            <Input
              label="State"
              value={formData.address?.state || ''}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
            />
            <Input
              label="Pincode"
              value={formData.address?.pincode || ''}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="GSTIN"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            />
            <Input
              label="PAN"
              value={formData.panNumber}
              onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
            />
          </div>

          {/* Uploaded Documents */}
          {selectedVendor?.documents && selectedVendor.documents.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Uploaded Documents
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedVendor.documents.map((doc, idx) => {
                  const backendBase = import.meta.env.PROD ? 'https://hoh108.com' : `http://${window.location.hostname}:5001`
                  const docUrl = doc.url?.startsWith('http') ? doc.url : `${backendBase}${doc.url}`
                  const isImage = doc.url?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB' }}>
                      {isImage ? (
                        <img src={docUrl} alt={doc.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #E5E7EB' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, background: '#FEF3C7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#D97706' }}>
                          {doc.url?.split('.').pop()?.toUpperCase() || 'FILE'}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name || `Document ${idx + 1}`}</p>
                        <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{doc.docType || 'Document'}</p>
                      </div>
                      <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#C59C82', fontWeight: 600, textDecoration: 'none' }}>View</a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedVendor(null) }}>Cancel</Button>
            <Button type="submit" loading={saving}>Update Vendor</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Portal Access Modal */}
      <Modal
        isOpen={showPortalModal}
        onClose={() => { setShowPortalModal(false); setPortalVendor(null); setPortalCredentials(null) }}
        title={portalCredentials ? "Portal Access Enabled" : "Enable Portal Access"}
        size="md"
      >
        {portalCredentials ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Success Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '1px solid #6ee7b7',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle size={18} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '14px', color: '#065f46', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  Portal Access Enabled Successfully!
                </p>
                <p style={{ fontSize: '13px', color: '#059669', margin: 0 }}>
                  Share these credentials with the vendor so they can login to their portal.
                </p>
              </div>
            </div>

            {/* Credentials Card */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Portal URL */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px'
                }}>
                  Portal URL
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    flex: 1,
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#374151',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {portalCredentials.portalUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(portalCredentials.portalUrl)}
                    style={{
                      padding: '10px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Copy URL"
                  >
                    <Copy size={16} />
                  </button>
                  <a
                    href={portalCredentials.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '10px',
                      background: 'linear-gradient(135deg, #C59C82 0%, #C59C82 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none'
                    }}
                    title="Open Portal"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px'
                }}>
                  Email / Username
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    flex: 1,
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#374151',
                    fontFamily: 'monospace'
                  }}>
                    {portalCredentials.email}
                  </div>
                  <button
                    onClick={() => copyToClipboard(portalCredentials.email)}
                    style={{
                      padding: '10px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Copy Email"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px'
                }}>
                  Password
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    flex: 1,
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#374151',
                    fontFamily: 'monospace',
                    fontWeight: '500'
                  }}>
                    {portalCredentials.password}
                  </div>
                  <button
                    onClick={() => copyToClipboard(portalCredentials.password)}
                    style={{
                      padding: '10px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Copy Password"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Warning Note */}
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1px solid #fcd34d',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                <strong>Note:</strong> Share these credentials securely. The vendor should change their password after first login.
              </p>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '8px',
              borderTop: '1px solid #e5e7eb',
              marginTop: '4px'
            }}>
              <Button
                onClick={() => {
                  const text = `Vendor Portal Access\n\nURL: ${portalCredentials.portalUrl}\nEmail: ${portalCredentials.email}\nPassword: ${portalCredentials.password}`
                  copyToClipboard(text)
                }}
                variant="secondary"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <Button onClick={() => { setShowPortalModal(false); setPortalVendor(null); setPortalCredentials(null) }}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Info Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '1px solid #93c5fd',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <KeyRound size={18} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500', margin: 0, marginBottom: '4px' }}>
                  Enable Portal Access
                </p>
                <p style={{ fontSize: '13px', color: '#3b82f6', margin: 0 }}>
                  Enable portal access for <strong style={{ color: '#1e3a8a' }}>{portalVendor?.name}</strong> so they can view their purchase orders and manage their profile.
                </p>
              </div>
            </div>

            {/* Email Field */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Vendor Email (Login Username)
              </label>
              <div style={{
                background: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '15px',
                color: '#374151',
                fontWeight: '500'
              }}>
                {portalVendor?.email || 'No email set'}
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, marginTop: '8px' }}>
                This email will be used as the login username for the vendor portal
              </p>
            </div>

            {/* Password Field */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px'
              }}>
                Initial Password
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                <div style={{
                  flex: 1,
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: '15px',
                  color: '#374151',
                  fontFamily: showPassword ? 'monospace' : 'inherit',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {showPassword ? portalPassword : '••••••••••••'}
                </div>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                  style={{
                    padding: '0 16px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '70px'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => setPortalPassword(generatePassword())}
                  type="button"
                  style={{
                    padding: '0 16px',
                    background: 'linear-gradient(135deg, #C59C82 0%, #C59C82 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    minWidth: '90px'
                  }}
                >
                  Generate
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, marginTop: '8px' }}>
                Minimum 6 characters. Click "Generate" for a secure random password.
              </p>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '8px',
              borderTop: '1px solid #e5e7eb',
              marginTop: '4px'
            }}>
              <Button variant="secondary" onClick={() => { setShowPortalModal(false); setPortalVendor(null) }}>
                Cancel
              </Button>
              <Button
                onClick={handleEnablePortalAccess}
                loading={portalLoading}
                disabled={!portalPassword || portalPassword.length < 6}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Enable Portal Access
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => { setShowResetPasswordModal(false); setResetPasswordCredentials(null) }}
        title="Password Reset Successful"
        size="md"
      >
        {resetPasswordCredentials && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Success Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '1px solid #6ee7b7',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircle size={18} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '14px', color: '#065f46', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                  Password Reset Successfully!
                </p>
                <p style={{ fontSize: '13px', color: '#059669', margin: 0 }}>
                  New credentials for <strong style={{ color: '#065f46' }}>{resetPasswordCredentials.vendorName}</strong>. Share these with the vendor.
                </p>
              </div>
            </div>

            {/* Credentials Card */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Portal URL */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px'
                }}>
                  Portal URL
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    flex: 1,
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#374151',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {resetPasswordCredentials.portalUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(resetPasswordCredentials.portalUrl)}
                    style={{
                      padding: '10px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Copy URL"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px'
                }}>
                  Email / Username
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    flex: 1,
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#374151',
                    fontFamily: 'monospace'
                  }}>
                    {resetPasswordCredentials.email}
                  </div>
                  <button
                    onClick={() => copyToClipboard(resetPasswordCredentials.email)}
                    style={{
                      padding: '10px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Copy Email"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px'
                }}>
                  New Password
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    flex: 1,
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: '#374151',
                    fontFamily: 'monospace',
                    fontWeight: '500'
                  }}>
                    {resetPasswordCredentials.password}
                  </div>
                  <button
                    onClick={() => copyToClipboard(resetPasswordCredentials.password)}
                    style={{
                      padding: '10px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Copy Password"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Warning Note */}
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1px solid #fcd34d',
              borderRadius: '10px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '13px', color: '#92400e', margin: 0 }}>
                <strong>Note:</strong> Share these credentials securely with the vendor.
              </p>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '8px',
              borderTop: '1px solid #e5e7eb',
              marginTop: '4px'
            }}>
              <Button
                onClick={() => {
                  const text = `Vendor Portal Access\n\nURL: ${resetPasswordCredentials.portalUrl}\nEmail: ${resetPasswordCredentials.email}\nPassword: ${resetPasswordCredentials.password}`
                  copyToClipboard(text)
                }}
                variant="secondary"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <Button onClick={() => { setShowResetPasswordModal(false); setResetPasswordCredentials(null) }}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Materials Modal */}
      <Modal
        isOpen={showMaterialsModal}
        onClose={handleCloseMaterialsModal}
        title={`Materials - ${materialsVendor?.name || ''}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Header with Add button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {materials.length} material(s) from this vendor
            </p>
            <Button icon={Plus} size="sm" onClick={handleAddMaterial}>
              Add Material
            </Button>
          </div>

          {/* Materials List */}
          {materialsLoading ? (
            <div className="py-12 text-center text-gray-500">Loading materials...</div>
          ) : materials.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No materials added yet</p>
              <p className="text-sm text-gray-400">Click "Add Material" to add materials for this vendor</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Material</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">GST</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {materials.map((material) => (
                    <tr key={material._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{material.materialName}</p>
                          {(material.brand || material.specification) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {[material.brand, material.specification].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="blue">{materialTypeLabels[material.materialType] || material.materialType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">
                        {unitLabels[material.unit] || material.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          ₹{material.currentPrice?.toLocaleString() || '0'}
                          {material.priceType === 'range' && material.currentPriceMax && (
                            <span className="font-normal text-gray-500"> - ₹{material.currentPriceMax.toLocaleString()}</span>
                          )}
                        </span>
                        {material.priceType !== 'fixed' && (
                          <p className="text-xs text-gray-400 capitalize">{material.priceType}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{material.gstRate || 0}%</td>
                      <td className="px-4 py-3 text-center">
                        <Badge color={material.status === 'active' ? 'green' : material.status === 'out_of_stock' ? 'yellow' : 'gray'}>
                          {material.status === 'active' ? 'Active' : material.status === 'out_of_stock' ? 'Out of Stock' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleEditMaterial(material)}
                            className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(material._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseMaterialsModal}>Close</Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Add/Edit Material Modal */}
      <Modal
        isOpen={showAddMaterialModal}
        onClose={() => { setShowAddMaterialModal(false); resetMaterialForm() }}
        title={editingMaterial ? 'Edit Material' : 'Add Material'}
        size="lg"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          <Input
            label="Material Name"
            value={materialFormData.materialName}
            onChange={(e) => setMaterialFormData({ ...materialFormData, materialName: e.target.value })}
            required
            placeholder="e.g., PPC Cement 53 Grade"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Material Type"
              options={[
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
                { value: 'paint', label: 'Paint' },
                { value: 'glass', label: 'Glass' },
                { value: 'aluminium', label: 'Aluminium' },
                { value: 'labour', label: 'Labour' },
                { value: 'service', label: 'Service' },
                { value: 'other', label: 'Other' },
              ]}
              value={materialFormData.materialType}
              onChange={(e) => setMaterialFormData({ ...materialFormData, materialType: e.target.value })}
            />
            <Select
              label="Unit"
              options={[
                { value: 'unit', label: 'Unit' },
                { value: 'kg', label: 'Kg' },
                { value: 'ton', label: 'Ton' },
                { value: 'bag', label: 'Bag' },
                { value: 'sqft', label: 'Sq.ft' },
                { value: 'sqm', label: 'Sq.m' },
                { value: 'cft', label: 'CFT' },
                { value: 'm3', label: 'M³' },
                { value: 'ltr', label: 'Ltr' },
                { value: 'bundle', label: 'Bundle' },
                { value: 'box', label: 'Box' },
                { value: 'set', label: 'Set' },
                { value: 'hour', label: 'Hour' },
                { value: 'day', label: 'Day' },
                { value: 'month', label: 'Month' },
                { value: 'job', label: 'Job' },
              ]}
              value={materialFormData.unit}
              onChange={(e) => setMaterialFormData({ ...materialFormData, unit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              value={materialFormData.category}
              onChange={(e) => setMaterialFormData({ ...materialFormData, category: e.target.value })}
              placeholder="e.g., Cement"
            />
            <Input
              label="Sub-Category"
              value={materialFormData.subCategory}
              onChange={(e) => setMaterialFormData({ ...materialFormData, subCategory: e.target.value })}
              placeholder="e.g., PPC"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Brand"
              value={materialFormData.brand}
              onChange={(e) => setMaterialFormData({ ...materialFormData, brand: e.target.value })}
              placeholder="e.g., UltraTech"
            />
            <Input
              label="Specification"
              value={materialFormData.specification}
              onChange={(e) => setMaterialFormData({ ...materialFormData, specification: e.target.value })}
              placeholder="e.g., 53 Grade"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Price Type"
              options={[
                { value: 'fixed', label: 'Fixed' },
                { value: 'range', label: 'Range' },
                { value: 'negotiable', label: 'Negotiable' },
              ]}
              value={materialFormData.priceType}
              onChange={(e) => setMaterialFormData({ ...materialFormData, priceType: e.target.value })}
            />
            <Input
              label={materialFormData.priceType === 'range' ? 'Min Price (₹)' : 'Price (₹)'}
              type="number"
              value={materialFormData.currentPrice}
              onChange={(e) => setMaterialFormData({ ...materialFormData, currentPrice: e.target.value })}
              placeholder="0"
            />
            {materialFormData.priceType === 'range' && (
              <Input
                label="Max Price (₹)"
                type="number"
                value={materialFormData.currentPriceMax}
                onChange={(e) => setMaterialFormData({ ...materialFormData, currentPriceMax: e.target.value })}
                placeholder="0"
              />
            )}
            {materialFormData.priceType !== 'range' && (
              <Input
                label="GST Rate (%)"
                type="number"
                value={materialFormData.gstRate}
                onChange={(e) => setMaterialFormData({ ...materialFormData, gstRate: e.target.value })}
                placeholder="18"
              />
            )}
          </div>

          {materialFormData.priceType === 'range' && (
            <Input
              label="GST Rate (%)"
              type="number"
              value={materialFormData.gstRate}
              onChange={(e) => setMaterialFormData({ ...materialFormData, gstRate: e.target.value })}
              placeholder="18"
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Order Qty"
              type="number"
              value={materialFormData.minOrderQty}
              onChange={(e) => setMaterialFormData({ ...materialFormData, minOrderQty: e.target.value })}
              placeholder="0"
            />
            <Input
              label="Lead Time (Days)"
              type="number"
              value={materialFormData.leadTimeDays}
              onChange={(e) => setMaterialFormData({ ...materialFormData, leadTimeDays: e.target.value })}
              placeholder="0"
            />
          </div>

          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'out_of_stock', label: 'Out of Stock' },
            ]}
            value={materialFormData.status}
            onChange={(e) => setMaterialFormData({ ...materialFormData, status: e.target.value })}
          />

          <Input
            label="Remarks"
            value={materialFormData.remarks}
            onChange={(e) => setMaterialFormData({ ...materialFormData, remarks: e.target.value })}
            placeholder="Any additional notes..."
          />

          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowAddMaterialModal(false); resetMaterialForm() }}>
              Cancel
            </Button>
            <Button type="submit" loading={savingMaterial}>
              {editingMaterial ? 'Update Material' : 'Add Material'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default VendorsList
