import { useState, useEffect } from 'react'
import { Plus, MoreVertical, Target, Edit, Trash2, Eye, Users } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { krasAPI } from '../../utils/api'

const KRAMaster = () => {
  const [kras, setKras] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingKra, setEditingKra] = useState(null)
  const [viewingKra, setViewingKra] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [formData, setFormData] = useState({
    kraCode: '',
    kraName: '',
    description: '',
    category: '',
    weightage: '',
    applicableRoles: [],
    status: 'Active'
  })

  useEffect(() => {
    loadKRAs()
  }, [pagination.page, search, categoryFilter])

  const loadKRAs = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter.toLowerCase()

      const response = await krasAPI.getAll(params)
      setKras(response.data || [])
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.pages
        }))
      }
    } catch (err) {
      console.error('Failed to load KRAs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const kraData = {
        ...formData,
        name: formData.kraName,
        weight: parseInt(formData.weightage) || 0,
        isActive: formData.status === 'Active'
      }
      if (editingKra) {
        await krasAPI.update(editingKra._id, kraData)
      } else {
        await krasAPI.create(kraData)
      }
      setShowModal(false)
      resetForm()
      loadKRAs()
    } catch (err) {
      console.error('Failed to save KRA:', err)
      alert(err.message || 'Failed to save KRA')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this KRA?')) return
    try {
      await krasAPI.delete(id)
      loadKRAs()
    } catch (err) {
      console.error('Failed to delete KRA:', err)
      alert(err.message || 'Failed to delete KRA')
    }
  }

  const resetForm = () => {
    setFormData({
      kraCode: '',
      kraName: '',
      description: '',
      category: '',
      weightage: '',
      applicableRoles: [],
      status: 'Active'
    })
    setEditingKra(null)
  }

  const openEditModal = (kra) => {
    setEditingKra(kra)
    setFormData({
      kraCode: kra.kraCode,
      kraName: kra.name,
      description: kra.description,
      category: kra.category,
      weightage: kra.weight,
      applicableRoles: kra.roles || [],
      status: kra.isActive ? 'Active' : 'Inactive'
    })
    setShowModal(true)
  }

  const categoryColors = {
    delivery: 'blue',
    customer: 'green',
    financial: 'purple',
    finance: 'purple',
    operations: 'orange',
    technical: 'cyan',
    leadership: 'red',
    sales: 'emerald',
    hr: 'pink',
    other: 'gray',
  }

  // Calculate stats
  const stats = {
    total: kras.length,
    active: kras.filter(k => k.isActive).length,
    totalKPIs: kras.reduce((sum, k) => sum + (k.kpis?.length || 0), 0),
    categories: [...new Set(kras.map(k => k.category))].length,
  }

  return (
    <div>
      <PageHeader
        title="KRA Master"
        description="Define Key Result Areas for performance evaluation"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Performance' }, { label: 'KRA Master' }]}
        actions={
          <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>
            Add KRA
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <Target className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total KRAs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active KRAs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <Target className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalKPIs}</p>
              <p className="text-sm text-gray-500">Linked KPIs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Users className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.categories}</p>
              <p className="text-sm text-gray-500">Categories</p>
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
            placeholder="Search KRA..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Categories' },
              { value: 'sales', label: 'Sales' },
              { value: 'operations', label: 'Operations' },
              { value: 'finance', label: 'Finance' },
              { value: 'hr', label: 'HR' },
              { value: 'customer', label: 'Customer' },
              { value: 'technical', label: 'Technical' },
              { value: 'leadership', label: 'Leadership' },
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : kras.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No KRAs found"
            description="Create your first Key Result Area"
            action={() => { resetForm(); setShowModal(true); }}
            actionLabel="Add KRA"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>KRA Code</Table.Head>
                  <Table.Head>Name</Table.Head>
                  <Table.Head>Category</Table.Head>
                  <Table.Head>Weightage</Table.Head>
                  <Table.Head>Applicable Roles</Table.Head>
                  <Table.Head>Linked KPIs</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {kras.map((kra) => (
                  <Table.Row key={kra._id}>
                    <Table.Cell>
                      <span className="font-medium text-gray-900">{kra.kraCode}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{kra.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{kra.description}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={categoryColors[kra.category] || 'gray'}>
                        {kra.category}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">{kra.weight}%</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap gap-1">
                        {(kra.roles || []).slice(0, 2).map((role, idx) => (
                          <Badge key={idx} color="gray" size="sm">{role}</Badge>
                        ))}
                        {(kra.roles || []).length > 2 && (
                          <Badge color="gray" size="sm">+{kra.roles.length - 2}</Badge>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-600">{kra.kpis?.length || 0} KPIs</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={kra.isActive ? 'green' : 'gray'}>
                        {kra.isActive ? 'Active' : 'Inactive'}
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
                        <Dropdown.Item icon={Eye} onClick={() => setViewingKra(kra)}>View Details</Dropdown.Item>
                        <Dropdown.Item icon={Edit} onClick={() => openEditModal(kra)}>Edit</Dropdown.Item>
                        <Dropdown.Item icon={Trash2} className="text-red-600" onClick={() => handleDelete(kra._id)}>Delete</Dropdown.Item>
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingKra ? 'Edit KRA' : 'Add New KRA'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="KRA Code"
              value={formData.kraCode}
              onChange={(e) => setFormData({ ...formData, kraCode: e.target.value })}
              placeholder="KRA-XXX"
              required
            />
            <Select
              label="Category"
              options={[
                { value: '', label: 'Select Category' },
                { value: 'sales', label: 'Sales' },
                { value: 'operations', label: 'Operations' },
                { value: 'finance', label: 'Finance' },
                { value: 'hr', label: 'HR' },
                { value: 'customer', label: 'Customer' },
                { value: 'technical', label: 'Technical' },
                { value: 'leadership', label: 'Leadership' },
              ]}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>
          <Input
            label="KRA Name"
            value={formData.kraName}
            onChange={(e) => setFormData({ ...formData, kraName: e.target.value })}
            placeholder="Enter KRA name"
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the Key Result Area"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Weightage (%)"
              type="number"
              min="0"
              max="100"
              value={formData.weightage}
              onChange={(e) => setFormData({ ...formData, weightage: e.target.value })}
              placeholder="0-100"
              required
            />
            <Select
              label="Status"
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              {editingKra ? 'Update KRA' : 'Create KRA'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewingKra}
        onClose={() => setViewingKra(null)}
        title="KRA Details"
        size="lg"
      >
        {viewingKra && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{viewingKra.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{viewingKra.description || 'No description'}</p>
              </div>
              <Badge color={viewingKra.isActive ? 'green' : 'gray'}>
                {viewingKra.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">KRA Code</p>
                <p className="text-sm font-medium text-gray-900">{viewingKra.kraCode}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <Badge color={categoryColors[viewingKra.category] || 'gray'}>
                  {viewingKra.category}
                </Badge>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Weightage</p>
                <p className="text-sm font-medium text-gray-900">{viewingKra.weight}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Linked KPIs</p>
                <p className="text-sm font-medium text-gray-900">{viewingKra.kpis?.length || 0} KPIs</p>
              </div>
            </div>

            {/* Applicable Roles */}
            {viewingKra.roles?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Applicable Roles</p>
                <div className="flex flex-wrap gap-2">
                  {viewingKra.roles.map((role, idx) => (
                    <Badge key={idx} color="gray">{role}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Linked KPIs List */}
            {viewingKra.kpis?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Linked KPIs</p>
                <div className="space-y-2">
                  {viewingKra.kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{kpi.name || kpi.kpiCode || kpi}</p>
                        {kpi.kpiCode && <p className="text-xs text-gray-500">{kpi.kpiCode}</p>}
                      </div>
                      {kpi.weight != null && (
                        <Badge color="blue">{kpi.weight}%</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setViewingKra(null)}>Close</Button>
              <Button onClick={() => { openEditModal(viewingKra); setViewingKra(null); }}>Edit KRA</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default KRAMaster
