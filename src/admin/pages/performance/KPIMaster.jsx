import { useState, useEffect } from 'react'
import { Plus, MoreVertical, TrendingUp, Edit, Trash2, Eye, Zap, Target, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { kpiAPI } from '../../utils/api'

const KPIMaster = () => {
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingKpi, setEditingKpi] = useState(null)
  const [viewingKpi, setViewingKpi] = useState(null)
  const [saving, setSaving] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ total: 0, active: 0, autoTracked: 0, manualEntry: 0 })

  const [formData, setFormData] = useState({
    kpiCode: '',
    name: '',
    description: '',
    category: '',
    displayFormat: 'number',
    unit: '',
    targetValue: '',
    frequency: 'monthly',
    isActive: true
  })

  useEffect(() => {
    loadKPIs()
  }, [pagination.page, search, categoryFilter])

  const loadKPIs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (categoryFilter) params.category = categoryFilter

      const response = await kpiAPI.getConfigs(params)
      let data = response.data || []

      // Client-side search filter
      if (search) {
        data = data.filter(k =>
          k.name?.toLowerCase().includes(search.toLowerCase()) ||
          k.kpiCode?.toLowerCase().includes(search.toLowerCase())
        )
      }

      setKpis(data)
      setPagination(prev => ({
        ...prev,
        total: data.length,
        totalPages: Math.ceil(data.length / prev.limit) || 1
      }))

      // Calculate stats
      setStats({
        total: data.length,
        active: data.filter(k => k.isActive).length,
        autoTracked: data.filter(k => k.calculationType === 'auto').length,
        manualEntry: data.filter(k => k.calculationType === 'manual').length
      })
    } catch (err) {
      console.error('Failed to load KPIs:', err)
      setError('Failed to load KPIs')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingKpi) {
        await kpiAPI.updateConfig(editingKpi._id, formData)
      } else {
        await kpiAPI.createConfig(formData)
      }
      setShowModal(false)
      resetForm()
      loadKPIs()
    } catch (err) {
      console.error('Failed to save KPI:', err)
      alert(err.message || 'Failed to save KPI')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this KPI?')) return
    try {
      await kpiAPI.deleteConfig(id)
      loadKPIs()
    } catch (err) {
      console.error('Failed to delete KPI:', err)
      alert(err.message || 'Failed to delete KPI')
    }
  }

  const handleInitDefaults = async () => {
    try {
      await kpiAPI.initDefaults()
      loadKPIs()
    } catch (err) {
      console.error('Failed to init defaults:', err)
      alert(err.message || 'KPIs may already be initialized')
    }
  }

  const resetForm = () => {
    setFormData({
      kpiCode: '',
      name: '',
      description: '',
      category: '',
      displayFormat: 'number',
      unit: '',
      targetValue: '',
      frequency: 'monthly',
      isActive: true
    })
    setEditingKpi(null)
  }

  const openEditModal = (kpi) => {
    setEditingKpi(kpi)
    setFormData({
      kpiCode: kpi.kpiCode,
      name: kpi.name,
      description: kpi.description || '',
      category: kpi.category || '',
      displayFormat: kpi.displayFormat || 'number',
      unit: kpi.unit || '',
      targetValue: kpi.targets?.global || '',
      frequency: kpi.frequency || 'monthly',
      isActive: kpi.isActive !== false
    })
    setShowModal(true)
  }

  const measurementColors = {
    Percentage: 'blue',
    Count: 'green',
    Number: 'purple',
    Rating: 'orange',
    Duration: 'cyan',
    Currency: 'yellow',
  }

  const frequencyColors = {
    Daily: 'red',
    Weekly: 'orange',
    Monthly: 'blue',
    Quarterly: 'green',
    Yearly: 'purple',
  }

  const statusColors = {
    true: 'green',
    false: 'gray',
  }

  return (
    <div>
      <PageHeader
        title="KPI Master"
        description="Define Key Performance Indicators linked to KRAs"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Performance' }, { label: 'KPI Master' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={handleInitDefaults}>Init Defaults</Button>
            <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>
              Add KPI
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total KPIs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active KPIs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <Zap className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.autoTracked}</p>
              <p className="text-sm text-gray-500">Auto-Tracked</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Target className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.manualEntry}</p>
              <p className="text-sm text-gray-500">Manual Entry</p>
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
            placeholder="Search KPI..."
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
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : kpis.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No KPIs found"
            description="Create your first Key Performance Indicator"
            action={() => { resetForm(); setShowModal(true); }}
            actionLabel="Add KPI"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>KPI Code</Table.Head>
                  <Table.Head>Name</Table.Head>
                  <Table.Head>Linked KRA</Table.Head>
                  <Table.Head>Measurement</Table.Head>
                  <Table.Head>Target</Table.Head>
                  <Table.Head>Frequency</Table.Head>
                  <Table.Head>Data Source</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {kpis.map((kpi) => (
                  <Table.Row key={kpi._id}>
                    <Table.Cell>
                      <span className="font-medium text-gray-900">{kpi.kpiCode}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{kpi.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{kpi.description}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="blue">
                        {kpi.category || 'general'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={measurementColors[kpi.displayFormat] || 'gray'}>
                        {kpi.displayFormat || 'number'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {kpi.targets?.global || '-'}{kpi.unit || ''}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={frequencyColors[kpi.frequency] || 'gray'}>
                        {kpi.frequency || 'monthly'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        {kpi.calculationType === 'auto' ? (
                          <Zap className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Target className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-600">{kpi.calculationType || 'manual'}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[kpi.isActive] || 'gray'}>
                        {kpi.isActive ? 'Active' : 'Inactive'}
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
                        <Dropdown.Item icon={Eye} onClick={() => setViewingKpi(kpi)}>View Details</Dropdown.Item>
                        <Dropdown.Item icon={Edit} onClick={() => openEditModal(kpi)}>Edit</Dropdown.Item>
                        <Dropdown.Item icon={Trash2} className="text-red-600" onClick={() => handleDelete(kpi._id)}>Delete</Dropdown.Item>
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
        title={editingKpi ? 'Edit KPI' : 'Add New KPI'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="KPI Code"
              value={formData.kpiCode}
              onChange={(e) => setFormData({ ...formData, kpiCode: e.target.value })}
              placeholder="lead_conversion_rate"
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
              ]}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>
          <Input
            label="KPI Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter KPI name"
            required
          />
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the KPI measurement"
            rows={2}
          />
          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Display Format"
              options={[
                { value: 'number', label: 'Number' },
                { value: 'percentage', label: 'Percentage' },
                { value: 'currency', label: 'Currency' },
                { value: 'duration', label: 'Duration' },
              ]}
              value={formData.displayFormat}
              onChange={(e) => setFormData({ ...formData, displayFormat: e.target.value })}
              required
            />
            <Input
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="%, hrs, etc"
            />
            <Input
              label="Target Value"
              type="number"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              placeholder="Target"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Frequency"
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              required
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingKpi ? 'Update KPI' : 'Create KPI'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewingKpi}
        onClose={() => setViewingKpi(null)}
        title="KPI Details"
        size="lg"
      >
        {viewingKpi && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{viewingKpi.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{viewingKpi.description || 'No description'}</p>
              </div>
              <Badge color={viewingKpi.isActive ? 'green' : 'gray'}>
                {viewingKpi.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">KPI Code</p>
                <p className="text-sm font-medium text-gray-900">{viewingKpi.kpiCode}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Config ID</p>
                <p className="text-sm font-medium text-gray-900">{viewingKpi.configId || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <Badge color="blue">{viewingKpi.category || 'general'}</Badge>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Display Format</p>
                <Badge color={measurementColors[viewingKpi.displayFormat] || 'gray'}>
                  {viewingKpi.displayFormat || 'number'}
                </Badge>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Target</p>
                <p className="text-sm font-medium text-gray-900">
                  {viewingKpi.targets?.global ?? '-'}{viewingKpi.unit || ''}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Frequency</p>
                <Badge color={frequencyColors[viewingKpi.frequency] || 'gray'}>
                  {viewingKpi.frequency || 'monthly'}
                </Badge>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Data Source</p>
                <div className="flex items-center gap-1">
                  {viewingKpi.calculationType === 'auto' ? (
                    <Zap className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <Target className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{viewingKpi.calculationType || 'manual'}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Unit</p>
                <p className="text-sm font-medium text-gray-900">{viewingKpi.unit || '-'}</p>
              </div>
            </div>

            {/* Thresholds */}
            {viewingKpi.thresholds && Object.keys(viewingKpi.thresholds).some(k => viewingKpi.thresholds[k] != null) && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Performance Thresholds</p>
                <div className="flex flex-wrap gap-2">
                  {viewingKpi.thresholds.excellent != null && (
                    <Badge color="green">Excellent: {viewingKpi.thresholds.excellent}{viewingKpi.unit || ''}</Badge>
                  )}
                  {viewingKpi.thresholds.good != null && (
                    <Badge color="blue">Good: {viewingKpi.thresholds.good}{viewingKpi.unit || ''}</Badge>
                  )}
                  {viewingKpi.thresholds.average != null && (
                    <Badge color="yellow">Average: {viewingKpi.thresholds.average}{viewingKpi.unit || ''}</Badge>
                  )}
                  {viewingKpi.thresholds.poor != null && (
                    <Badge color="orange">Poor: {viewingKpi.thresholds.poor}{viewingKpi.unit || ''}</Badge>
                  )}
                  {viewingKpi.thresholds.critical != null && (
                    <Badge color="red">Critical: {viewingKpi.thresholds.critical}{viewingKpi.unit || ''}</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Formula */}
            {viewingKpi.formula?.type && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Formula</p>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <p><span className="font-medium">Type:</span> {viewingKpi.formula.type}</p>
                  {viewingKpi.formula.numerator?.entity && (
                    <p><span className="font-medium">Source:</span> {viewingKpi.formula.numerator.entity}.{viewingKpi.formula.numerator.field}</p>
                  )}
                  {viewingKpi.formula.denominator?.entity && (
                    <p><span className="font-medium">Denominator:</span> {viewingKpi.formula.denominator.entity}.{viewingKpi.formula.denominator.field}</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setViewingKpi(null)}>Close</Button>
              <Button onClick={() => { openEditModal(viewingKpi); setViewingKpi(null); }}>Edit KPI</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default KPIMaster
