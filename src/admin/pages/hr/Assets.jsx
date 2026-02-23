import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Monitor, Laptop, Smartphone, Car, Printer, Eye, Edit, Trash2, UserPlus, UserMinus, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { assetsAPI, usersAPI } from '../../utils/api'

const Assets = () => {
  const navigate = useNavigate()
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [assetModal, setAssetModal] = useState({ open: false, mode: 'add', asset: null })
  const [assignModal, setAssignModal] = useState({ open: false, asset: null })
  const [detailModal, setDetailModal] = useState({ open: false, asset: null })
  const [formData, setFormData] = useState({
    assetCode: '',
    assetName: '',
    category: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    vendor: '',
    warrantyExpiry: '',
    condition: 'Good',
    location: '',
    notes: ''
  })
  const [assignForm, setAssignForm] = useState({ employeeId: '', assignDate: new Date().toISOString().split('T')[0], notes: '' })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [bulkModal, setBulkModal] = useState({ open: false })
  const [bulkData, setBulkData] = useState({ rows: [], fileName: '', parsing: false })
  const [bulkResult, setBulkResult] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadAssets()
  }, [pagination.page, search, categoryFilter, statusFilter])

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await usersAPI.getAll({ limit: 500 })
        setEmployees(response.data || [])
      } catch (err) {
        console.error('Failed to load employees:', err)
      }
    }
    loadEmployees()
  }, [])

  const loadAssets = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter.toLowerCase()
      if (statusFilter) params.status = statusFilter.toLowerCase()

      const response = await assetsAPI.getAll(params)
      setAssets(response.data || [])
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.pages
        }))
      }
    } catch (err) {
      console.error('Failed to load assets:', err)
    } finally {
      setLoading(false)
    }
  }

  const categoryIcons = {
    Laptop: Laptop,
    Monitor: Monitor,
    Mobile: Smartphone,
    Vehicle: Car,
    Printer: Printer,
  }

  const statusColors = {
    Available: 'green',
    Assigned: 'blue',
    'Under Maintenance': 'yellow',
    Retired: 'gray',
  }

  const conditionColors = {
    Excellent: 'green',
    Good: 'blue',
    Fair: 'yellow',
    Poor: 'red',
  }

  const categories = ['Laptop', 'Desktop', 'Monitor', 'Mobile', 'Tablet', 'Printer', 'Vehicle', 'Furniture', 'Other']

  // Calculate stats
  const stats = {
    total: assets.length,
    totalValue: assets.reduce((sum, a) => sum + a.purchasePrice, 0),
    assigned: assets.filter(a => a.status === 'Assigned').length,
    available: assets.filter(a => a.status === 'Available').length,
  }

  const openAddModal = () => {
    setFormData({
      assetCode: '',
      assetName: '',
      category: '',
      brand: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      purchasePrice: '',
      vendor: '',
      warrantyExpiry: '',
      condition: 'Good',
      location: '',
      notes: ''
    })
    setAssetModal({ open: true, mode: 'add', asset: null })
  }

  const openEditModal = (asset) => {
    setFormData({
      assetCode: asset.assetCode,
      assetName: asset.assetName,
      category: asset.category,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate,
      purchasePrice: asset.purchasePrice.toString(),
      vendor: asset.vendor,
      warrantyExpiry: asset.warrantyExpiry,
      condition: asset.condition,
      location: asset.location,
      notes: asset.notes || ''
    })
    setAssetModal({ open: true, mode: 'edit', asset })
  }

  const handleSubmit = async () => {
    if (!formData.assetName || !formData.category || !formData.serialNumber) {
      alert('Please fill all required fields')
      return
    }
    setSubmitLoading(true)
    try {
      const assetData = {
        ...formData,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
      }
      if (assetModal.mode === 'add') {
        await assetsAPI.create(assetData)
      } else {
        await assetsAPI.update(assetModal.asset._id, assetData)
      }
      setAssetModal({ open: false, mode: 'add', asset: null })
      loadAssets()
    } catch (err) {
      console.error('Failed to save asset:', err)
      alert(err.message || 'Failed to save asset')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!assignForm.employeeId) {
      alert('Please select an employee')
      return
    }
    setSubmitLoading(true)
    try {
      await assetsAPI.update(assignModal.asset._id, {
        assignedTo: assignForm.employeeId,
        status: 'active',
      })
      setAssignModal({ open: false, asset: null })
      loadAssets()
    } catch (err) {
      console.error('Failed to assign asset:', err)
      alert(err.message || 'Failed to assign asset')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUnassign = async (asset) => {
    if (!confirm(`Are you sure you want to unassign this asset from ${asset.assignedTo?.name}?`)) return
    try {
      await assetsAPI.update(asset._id, {
        assignedTo: null,
        status: 'active',
      })
      loadAssets()
    } catch (err) {
      console.error('Failed to unassign asset:', err)
      alert(err.message || 'Failed to unassign asset')
    }
  }

  const handleDelete = async (asset) => {
    if (!confirm(`Are you sure you want to delete ${asset.assetName}?`)) return
    try {
      await assetsAPI.delete(asset._id)
      loadAssets()
    } catch (err) {
      console.error('Failed to delete asset:', err)
      alert(err.message || 'Failed to delete asset')
    }
  }

  const exportCSV = async () => {
    try {
      // Fetch all assets (no pagination limit)
      const response = await assetsAPI.getAll({ limit: 10000 })
      const allAssets = response.data || []
      if (allAssets.length === 0) {
        alert('No assets to export')
        return
      }

      const headers = [
        'Asset Code', 'Asset Name', 'Category', 'Description', 'Serial Number',
        'Purchase Date', 'Purchase Price', 'Current Value', 'Location', 'Department',
        'Status', 'Assigned To', 'Assigned To Email', 'Assigned To Employee ID',
        'Warranty Provider', 'Warranty Expiry', 'Notes'
      ]

      const rows = allAssets.map(a => [
        a.assetCode || '',
        a.assetName || '',
        a.category || '',
        a.description || '',
        a.serialNumber || '',
        a.purchaseDate ? new Date(a.purchaseDate).toISOString().split('T')[0] : '',
        a.purchasePrice || 0,
        a.currentValue || 0,
        a.location || '',
        a.department || '',
        a.status || '',
        a.assignedTo?.name || '',
        a.assignedTo?.email || '',
        a.assignedTo?.employeeId || '',
        a.warranty?.provider || '',
        a.warranty?.expiryDate ? new Date(a.warranty.expiryDate).toISOString().split('T')[0] : '',
        a.notes || '',
      ])

      const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `assets_export_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export assets:', err)
      alert('Failed to export assets')
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'Asset Name', 'Category', 'Description', 'Serial Number',
      'Purchase Date', 'Purchase Price', 'Current Value', 'Depreciation Method',
      'Useful Life', 'Salvage Value', 'Location', 'Department', 'Status',
      'Warranty Provider', 'Warranty Expiry', 'Warranty Terms', 'Notes'
    ]
    const sampleRows = [
      ['Dell Latitude 5520', 'computer', 'Employee laptop', 'DL-SN-2025-001', '2025-01-15', '85000', '75000', 'straight_line', '5', '5000', 'Head Office', 'IT', 'active', 'Dell India', '2028-01-15', '3 Year On-Site', 'Assigned to IT dept'],
      ['Office Desk - Executive', 'furniture', 'Wooden executive desk', 'FRN-2025-001', '2025-02-01', '25000', '22000', 'straight_line', '10', '2000', 'Bengaluru Office', 'Admin', 'active', '', '', '', ''],
      ['Toyota Innova Crysta', 'vehicle', 'Company vehicle', 'VEH-KA01-5678', '2024-06-10', '2200000', '1800000', 'declining_balance', '8', '500000', 'Bengaluru', 'Operations', 'active', 'Toyota', '2027-06-10', '3 Year Warranty', 'Company fleet'],
    ]
    const csvContent = [headers.join(','), ...sampleRows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'asset_bulk_upload_template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const parseCSV = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const values = []
      let current = ''
      let inQuotes = false
      for (const char of lines[i]) {
        if (char === '"') { inQuotes = !inQuotes; continue }
        if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
        current += char
      }
      values.push(current.trim())
      const row = {}
      headers.forEach((h, idx) => { if (values[idx]) row[h] = values[idx] })
      if (Object.keys(row).length > 0) rows.push(row)
    }
    return rows
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }
    setBulkData(prev => ({ ...prev, fileName: file.name, parsing: true }))
    const reader = new FileReader()
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result)
      setBulkData({ rows, fileName: file.name, parsing: false })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleBulkUpload = async () => {
    if (bulkData.rows.length === 0) return
    setUploading(true)
    setBulkResult(null)
    try {
      const response = await assetsAPI.bulkUpload(bulkData.rows)
      setBulkResult(response.data || response)
      if (response.data?.successful > 0 || response.successful > 0) {
        loadAssets()
      }
    } catch (err) {
      console.error('Bulk upload failed:', err)
      setBulkResult({ successful: 0, failed: bulkData.rows.length, errors: [{ row: 0, error: err.message || 'Upload failed' }] })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Asset Management"
        description="Track and manage company assets assigned to employees"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'HR Management' }, { label: 'Asset Management' }]}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" icon={Download} onClick={exportCSV}>
              Export CSV
            </Button>
            <Button variant="outline" icon={Upload} onClick={() => { setBulkModal({ open: true }); setBulkData({ rows: [], fileName: '', parsing: false }); setBulkResult(null) }}>
              Bulk Upload
            </Button>
            <Button icon={Plus} onClick={openAddModal}>Add Asset</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <Monitor className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Assets</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <Monitor className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <UserPlus className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.assigned}</p>
              <p className="text-sm text-gray-500">Assigned</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Monitor className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.available}</p>
              <p className="text-sm text-gray-500">Available</p>
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
            placeholder="Search asset, serial number..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(c => ({ value: c, label: c }))
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-40"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'Available', label: 'Available' },
              { value: 'Assigned', label: 'Assigned' },
              { value: 'Under Maintenance', label: 'Under Maintenance' },
              { value: 'Retired', label: 'Retired' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : assets.length === 0 ? (
          <EmptyState
            icon={Monitor}
            title="No assets found"
            description="Add company assets to track and manage them"
            action={openAddModal}
            actionLabel="Add Asset"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Asset</Table.Head>
                  <Table.Head>Category</Table.Head>
                  <Table.Head>Serial Number</Table.Head>
                  <Table.Head>Purchase Info</Table.Head>
                  <Table.Head>Assigned To</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {assets.map((asset) => {
                  const CategoryIcon = categoryIcons[asset.category] || Monitor
                  return (
                    <Table.Row key={asset._id}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <CategoryIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{asset.assetName}</p>
                            <p className="text-xs text-gray-500">{asset.assetCode}</p>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-gray-600">{asset.category}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm font-mono text-gray-600">{asset.serialNumber}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(asset.purchasePrice)}</p>
                          <p className="text-xs text-gray-500">{formatDate(asset.purchaseDate)}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {asset.assignedTo ? (
                          <div>
                            <p className="text-sm text-gray-900">{asset.assignedTo.name}</p>
                            <p className="text-xs text-gray-500">{asset.assignedTo.department}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={statusColors[asset.status] || 'gray'}>
                          {asset.status}
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
                          <Dropdown.Item icon={Eye} onClick={() => setDetailModal({ open: true, asset })}>
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Item icon={Edit} onClick={() => openEditModal(asset)}>
                            Edit
                          </Dropdown.Item>
                          {!asset.assignedTo && (
                            <Dropdown.Item icon={UserPlus} onClick={() => {
                              setAssignForm({ employeeId: '', assignDate: new Date().toISOString().split('T')[0], notes: '' })
                              setAssignModal({ open: true, asset })
                            }}>
                              Assign to Employee
                            </Dropdown.Item>
                          )}
                          {asset.assignedTo && (
                            <Dropdown.Item icon={UserMinus} onClick={() => handleUnassign(asset)}>
                              Unassign
                            </Dropdown.Item>
                          )}
                          <Dropdown.Item icon={Trash2} onClick={() => handleDelete(asset)} className="text-red-600">
                            Delete
                          </Dropdown.Item>
                        </Dropdown>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
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

      {/* Add/Edit Asset Modal */}
      <Modal
        isOpen={assetModal.open}
        onClose={() => setAssetModal({ open: false, mode: 'add', asset: null })}
        title={assetModal.mode === 'add' ? 'Add New Asset' : 'Edit Asset'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {assetModal.mode === 'edit' ? (
              <Input
                label="Asset Code"
                value={formData.assetCode}
                disabled
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Asset Code</label>
                <div style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '8px', fontSize: '14px', color: '#64748b', border: '1px solid #e2e8f0' }}>
                  Auto-generated from company name
                </div>
              </div>
            )}
            <Select
              label="Category *"
              options={[
                { value: '', label: 'Select Category' },
                ...categories.map(c => ({ value: c, label: c }))
              ]}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <Input
            label="Asset Name *"
            value={formData.assetName}
            onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
            placeholder="e.g., Dell Laptop Latitude 5520"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g., Dell, Apple, HP"
            />
            <Input
              label="Model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g., Latitude 5520"
            />
          </div>

          <Input
            label="Serial Number *"
            value={formData.serialNumber}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
            placeholder="Enter serial number"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Purchase Date"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
            <Input
              label="Purchase Price"
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              placeholder="Enter amount"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vendor"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              placeholder="Vendor name"
            />
            <Input
              label="Warranty Expiry"
              type="date"
              value={formData.warrantyExpiry}
              onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Condition"
              options={[
                { value: 'Excellent', label: 'Excellent' },
                { value: 'Good', label: 'Good' },
                { value: 'Fair', label: 'Fair' },
                { value: 'Poor', label: 'Poor' },
              ]}
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            />
            <Input
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Head Office, IT Store"
            />
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setAssetModal({ open: false, mode: 'add', asset: null })}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitLoading}>
              {assetModal.mode === 'add' ? 'Add Asset' : 'Update Asset'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Asset Modal */}
      <Modal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, asset: null })}
        title="Assign Asset to Employee"
        size="md"
      >
        {assignModal.asset && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '14px 16px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Asset</p>
              <p style={{ margin: '4px 0 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{assignModal.asset.assetName}</p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{assignModal.asset.assetCode}</p>
            </div>

            <Select
              label="Select Employee *"
              options={[
                { value: '', label: 'Select Employee' },
                ...employees.map(emp => ({
                  value: emp._id,
                  label: `${emp.name}${emp.employeeId ? ` (${emp.employeeId})` : ''}${emp.department?.name ? ` - ${emp.department.name}` : ''}`
                }))
              ]}
              value={assignForm.employeeId}
              onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
            />

            <Input
              label="Assignment Date"
              type="date"
              value={assignForm.assignDate}
              onChange={(e) => setAssignForm({ ...assignForm, assignDate: e.target.value })}
            />

            <Textarea
              label="Notes"
              value={assignForm.notes}
              onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
              placeholder="Assignment notes..."
              rows={2}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
              <Button variant="outline" onClick={() => setAssignModal({ open: false, asset: null })}>
                Cancel
              </Button>
              <Button onClick={handleAssign} loading={submitLoading}>
                Assign Asset
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Asset Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, asset: null })}
        title="Asset Details"
        size="lg"
      >
        {detailModal.asset && (() => {
          const a = detailModal.asset
          const CategoryIcon = categoryIcons[a.category] || Monitor
          const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }
          const lastRowStyle = { ...rowStyle, borderBottom: 'none' }
          const labelStyle = { fontSize: '13px', color: '#64748b', margin: 0 }
          const valueStyle = { fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: 0, textAlign: 'right' }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #111111 0%, #C59C82 100%)', borderRadius: '12px', padding: '20px', color: '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CategoryIcon style={{ width: '24px', height: '24px', color: '#fff' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#fff' }}>{a.assetName}</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{a.assetCode}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <Badge color={statusColors[a.status] || 'gray'}>{a.status}</Badge>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Asset Info */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset Information</p>
                  <div style={rowStyle}>
                    <p style={labelStyle}>Category</p>
                    <p style={{ ...valueStyle, textTransform: 'capitalize' }}>{a.category || '-'}</p>
                  </div>
                  <div style={rowStyle}>
                    <p style={labelStyle}>Serial Number</p>
                    <p style={{ ...valueStyle, fontFamily: 'monospace', fontSize: '12px' }}>{a.serialNumber || '-'}</p>
                  </div>
                  <div style={rowStyle}>
                    <p style={labelStyle}>Location</p>
                    <p style={valueStyle}>{a.location || '-'}</p>
                  </div>
                  <div style={lastRowStyle}>
                    <p style={labelStyle}>Department</p>
                    <p style={valueStyle}>{a.department || '-'}</p>
                  </div>
                </div>

                {/* Purchase & Warranty */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purchase & Warranty</p>
                  <div style={rowStyle}>
                    <p style={labelStyle}>Purchase Date</p>
                    <p style={valueStyle}>{formatDate(a.purchaseDate)}</p>
                  </div>
                  <div style={rowStyle}>
                    <p style={labelStyle}>Purchase Price</p>
                    <p style={{ ...valueStyle, color: '#059669' }}>{formatCurrency(a.purchasePrice)}</p>
                  </div>
                  <div style={rowStyle}>
                    <p style={labelStyle}>Vendor</p>
                    <p style={valueStyle}>{typeof a.vendor === 'object' ? a.vendor?.name || '-' : a.vendor || '-'}</p>
                  </div>
                  <div style={lastRowStyle}>
                    <p style={labelStyle}>Warranty Expiry</p>
                    <p style={valueStyle}>{a.warranty?.expiryDate ? formatDate(a.warranty.expiryDate) : a.warrantyExpiry ? formatDate(a.warrantyExpiry) : '-'}</p>
                  </div>
                </div>
              </div>

              {/* Assigned To */}
              {a.assignedTo && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Currently Assigned</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                        {a.assignedTo.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{a.assignedTo.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{a.assignedTo.email || ''}</p>
                      </div>
                    </div>
                    {a.assignedDate && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Assigned on</p>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: '500', color: '#475569' }}>{formatDate(a.assignedDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {a.notes && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{a.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <Button variant="outline" onClick={() => setDetailModal({ open: false, asset: null })}>
                  Close
                </Button>
                <Button onClick={() => {
                  setDetailModal({ open: false, asset: null })
                  openEditModal(a)
                }}>
                  Edit Asset
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={bulkModal.open}
        onClose={() => setBulkModal({ open: false })}
        title="Bulk Upload Assets"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Step 1: Download Template */}
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#C59C82', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>1</div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Download CSV Template</h4>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              Download the template, fill in your asset data, and upload. The template includes sample rows to guide you.
            </p>
            <Button variant="outline" icon={Download} onClick={downloadTemplate} size="sm">
              Download Template
            </Button>
          </div>

          {/* Step 2: Upload CSV */}
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#C59C82', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>2</div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Upload Filled CSV</h4>
            </div>

            {bulkData.rows.length === 0 && !bulkResult ? (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '32px 20px', border: '2px dashed #cbd5e1', borderRadius: '12px',
                cursor: 'pointer', transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#C59C82'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <FileSpreadsheet style={{ width: '40px', height: '40px', color: '#94a3b8', marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#475569' }}>Click to select CSV file</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Maximum 500 assets per upload</p>
                <input type="file" accept=".csv" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
            ) : bulkData.rows.length > 0 && !bulkResult ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#ecfdf5', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle style={{ width: '18px', height: '18px', color: '#059669' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}>
                      {bulkData.fileName} — {bulkData.rows.length} asset{bulkData.rows.length > 1 ? 's' : ''} found
                    </span>
                  </div>
                  <button
                    onClick={() => setBulkData({ rows: [], fileName: '', parsing: false })}
                    style={{ fontSize: '13px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Remove
                  </button>
                </div>

                {/* Preview table */}
                <div style={{ maxHeight: '200px', overflow: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#475569', position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>#</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#475569', position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>Asset Name</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#475569', position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>Category</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#475569', position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>Serial No.</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#475569', position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkData.rows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 12px', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 12px', color: '#1e293b', fontWeight: '500' }}>{row['Asset Name'] || row.assetName || row.name || '-'}</td>
                          <td style={{ padding: '6px 12px', color: '#64748b' }}>{row['Category'] || row.category || '-'}</td>
                          <td style={{ padding: '6px 12px', color: '#64748b', fontFamily: 'monospace' }}>{row['Serial Number'] || row.serialNumber || row.serial || '-'}</td>
                          <td style={{ padding: '6px 12px', color: '#64748b' }}>{row['Purchase Price'] || row.purchasePrice || row.price || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkData.rows.length > 10 && (
                    <div style={{ padding: '8px 12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                      ...and {bulkData.rows.length - 10} more rows
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Upload Result */}
          {bulkResult && (
            <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid', borderColor: bulkResult.failed > 0 ? '#fde68a' : '#bbf7d0', backgroundColor: bulkResult.failed > 0 ? '#fffbeb' : '#f0fdf4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {bulkResult.successful > 0 ? (
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                ) : (
                  <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                )}
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Upload Complete</h4>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: bulkResult.errors?.length > 0 ? '12px' : 0 }}>
                <span style={{ fontSize: '13px', color: '#059669', fontWeight: '500' }}>{bulkResult.successful} successful</span>
                {bulkResult.failed > 0 && (
                  <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '500' }}>{bulkResult.failed} failed</span>
                )}
              </div>
              {bulkResult.errors?.length > 0 && (
                <div style={{ maxHeight: '120px', overflow: 'auto', fontSize: '12px' }}>
                  {bulkResult.errors.map((err, idx) => (
                    <div key={idx} style={{ padding: '4px 0', color: '#dc2626' }}>
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template Info */}
          <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
              <strong>Asset Code is auto-generated</strong> based on company name (e.g. IP-AST-2026-00001).<br />
              <strong>Template columns:</strong> Asset Name*, Category (furniture/equipment/vehicle/computer/machinery/building/land/other),
              Description, Serial Number, Purchase Date (YYYY-MM-DD), Purchase Price, Current Value, Depreciation Method (straight_line/declining_balance/none),
              Useful Life (years), Salvage Value, Location, Department, Status (active/maintenance/retired/disposed/lost),
              Warranty Provider, Warranty Expiry, Warranty Terms, Notes
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '4px' }}>
            <Button variant="outline" onClick={() => setBulkModal({ open: false })}>
              {bulkResult ? 'Close' : 'Cancel'}
            </Button>
            {!bulkResult && bulkData.rows.length > 0 && (
              <Button onClick={handleBulkUpload} loading={uploading} icon={Upload}>
                Upload {bulkData.rows.length} Asset{bulkData.rows.length > 1 ? 's' : ''}
              </Button>
            )}
            {bulkResult && bulkResult.successful > 0 && (
              <Button onClick={() => { setBulkModal({ open: false }); setBulkResult(null) }}>
                Done
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Assets
