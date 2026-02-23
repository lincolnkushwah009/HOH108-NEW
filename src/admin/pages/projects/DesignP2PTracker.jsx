import { useState, useEffect } from 'react'
import {
  Plus, Download, Eye, Edit, Trash2,
  Clock, CheckCircle, Layers
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import {
  Button, Card, Table, Badge, SearchInput, Pagination,
  Modal, Input, Select
} from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { designP2PTrackerAPI, projectsAPI } from '../../utils/api'

const STAGE_LABELS = {
  1: 'Booking',
  2: 'Measurement',
  3: 'Design',
  4: 'Validation & P2P Dwg',
  5: 'QC',
  6: 'Completion'
}

const STAGE_COLORS = {
  1: 'blue',
  2: 'indigo',
  3: 'purple',
  4: 'yellow',
  5: 'orange',
  6: 'green'
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'on_track', label: 'On Track' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'descoped', label: 'Descoped' }
]

const STATUS_COLORS = {
  new: 'gray',
  in_progress: 'blue',
  on_hold: 'yellow',
  delayed: 'red',
  at_risk: 'orange',
  on_track: 'green',
  completed: 'green',
  cancelled: 'gray',
  descoped: 'red'
}

const READINESS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'na', label: 'N/A' }
]

const DesignP2PTracker = () => {
  const [trackers, setTrackers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [showroomFilter, setShowroomFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [summary, setSummary] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedTracker, setSelectedTracker] = useState(null)
  const [detailTab, setDetailTab] = useState('overview')
  const [projects, setProjects] = useState([])
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({})

  const [createForm, setCreateForm] = useState({
    projectId: '',
    property: '',
    bookingDate: '',
    showroom: '',
    expectedMovPossession: '',
    salesPersonId: '',
    designerId: '',
    obvInLacs: '',
    fqvInLacs: '',
    upsellValue: ''
  })

  const [dailyLogForm, setDailyLogForm] = useState({
    aod: '',
    eod: '',
    remarks: ''
  })

  useEffect(() => {
    loadTrackers()
    loadSummary()
  }, [pagination.page, search, statusFilter, stageFilter, showroomFilter])

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getAll({ limit: 200, status: 'active' })
      setProjects(response.data || [])
    } catch (err) {
      console.error('Failed to load projects:', err)
    }
  }

  const loadTrackers = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (stageFilter) params.stage = stageFilter
      if (showroomFilter) params.showroom = showroomFilter

      const response = await designP2PTrackerAPI.getAll(params)
      setTrackers(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load trackers:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSummary = async () => {
    try {
      const response = await designP2PTrackerAPI.getSummary()
      setSummary(response.data)
    } catch (err) {
      console.error('Failed to load summary:', err)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await designP2PTrackerAPI.create({
        ...createForm,
        obvInLacs: parseFloat(createForm.obvInLacs) || 0,
        fqvInLacs: parseFloat(createForm.fqvInLacs) || 0,
        upsellValue: parseFloat(createForm.upsellValue) || 0
      })
      setShowCreateModal(false)
      setCreateForm({
        projectId: '', property: '', bookingDate: '', showroom: '',
        expectedMovPossession: '', salesPersonId: '', designerId: '',
        obvInLacs: '', fqvInLacs: '', upsellValue: ''
      })
      loadTrackers()
      loadSummary()
    } catch (err) {
      console.error('Failed to create tracker:', err)
      alert('Failed to create tracker: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleViewDetail = async (tracker) => {
    try {
      const response = await designP2PTrackerAPI.getOne(tracker._id)
      setSelectedTracker(response.data)
      setEditData({})
      setEditMode(false)
      setDetailTab('overview')
      setShowDetailModal(true)
    } catch (err) {
      console.error('Failed to load tracker details:', err)
    }
  }

  const handleUpdate = async () => {
    if (!selectedTracker || Object.keys(editData).length === 0) return
    setSaving(true)
    try {
      const response = await designP2PTrackerAPI.update(selectedTracker._id, editData)
      setSelectedTracker(response.data)
      setEditData({})
      setEditMode(false)
      loadTrackers()
      loadSummary()
    } catch (err) {
      console.error('Failed to update tracker:', err)
      alert('Failed to update: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddDailyLog = async () => {
    if (!selectedTracker || !dailyLogForm.aod) return
    setSaving(true)
    try {
      const response = await designP2PTrackerAPI.addDailyLog(selectedTracker._id, {
        ...dailyLogForm,
        date: new Date().toISOString()
      })
      setSelectedTracker(response.data)
      setDailyLogForm({ aod: '', eod: '', remarks: '' })
    } catch (err) {
      console.error('Failed to add daily log:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this P2P tracker?')) return
    try {
      await designP2PTrackerAPI.delete(id)
      loadTrackers()
      loadSummary()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleExport = async () => {
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (stageFilter) params.stage = stageFilter
      if (showroomFilter) params.showroom = showroomFilter

      const response = await designP2PTrackerAPI.export(params)
      const data = response.data || []

      // Convert to CSV
      const headers = [
        'Tracker ID', 'Property', 'Showroom', 'Booking Date', 'Designer', 'Sales Person',
        'OBV (Lacs)', 'FQV (Lacs)', 'Upsell', 'Stage', 'Status',
        '10% Payment', 'MMT Booked', 'Design Discussion', 'Validation Started',
        'QC Started', 'P2P Date', 'TAT', 'Latest Updates'
      ]

      const rows = data.map(t => [
        t.trackerId || '',
        t.property || '',
        t.showroom || '',
        t.bookingDate ? formatDate(t.bookingDate) : '',
        t.designer?.name || t.designerName || '',
        t.salesPerson?.name || t.salesPersonName || '',
        t.obvInLacs || 0,
        t.fqvInLacs || 0,
        t.upsellValue || 0,
        STAGE_LABELS[t.currentStage] || t.currentStage,
        t.status || '',
        t.tenPercentPayment ? formatDate(t.tenPercentPayment) : '',
        t.mmtBooked ? formatDate(t.mmtBooked) : '',
        t.designDiscussion ? formatDate(t.designDiscussion) : '',
        t.validationDwgStarted ? formatDate(t.validationDwgStarted) : '',
        t.qcStarted ? formatDate(t.qcStarted) : '',
        t.p2pDate ? formatDate(t.p2pDate) : '',
        t.tat || 0,
        t.latestUpdates || ''
      ])

      const csv = [headers, ...rows].map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `p2p-tracker-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed')
    }
  }

  const setEditField = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const getFieldValue = (field) => {
    if (editData[field] !== undefined) return editData[field]
    return selectedTracker?.[field] || ''
  }

  const getNestedFieldValue = (parent, field) => {
    if (editData[parent]?.[field] !== undefined) return editData[parent][field]
    return selectedTracker?.[parent]?.[field] || ''
  }

  const setNestedEditField = (parent, field, value) => {
    setEditData(prev => ({
      ...prev,
      [parent]: { ...(prev[parent] || {}), [field]: value }
    }))
  }

  // --- RENDER ---

  if (loading && trackers.length === 0) {
    return <PageLoader />
  }

  const columns = [
    {
      key: 'trackerId',
      label: 'ID',
      render: (_, row) => (
        <span className="font-mono text-xs text-indigo-600 cursor-pointer hover:underline"
          onClick={() => handleViewDetail(row)}>
          {row.trackerId || '---'}
        </span>
      )
    },
    {
      key: 'property',
      label: 'CX / Property',
      render: (_, row) => (
        <div>
          <div className="font-medium text-sm">{row.customer?.name || '---'}</div>
          <div className="text-xs text-gray-500">{row.property || row.project?.title || '---'}</div>
        </div>
      )
    },
    {
      key: 'bookingDate',
      label: 'Booking Date',
      render: (val) => val ? formatDate(val) : '---'
    },
    {
      key: 'showroom',
      label: 'Showroom',
      render: (val) => val || '---'
    },
    {
      key: 'designer',
      label: 'Designer',
      render: (_, row) => row.designer?.name || row.designerName || '---'
    },
    {
      key: 'obvInLacs',
      label: 'OBV (L)',
      render: (val) => val ? `${val}L` : '---'
    },
    {
      key: 'fqvInLacs',
      label: 'FQV (L)',
      render: (val) => val ? `${val}L` : '---'
    },
    {
      key: 'currentStage',
      label: 'Stage',
      render: (val) => (
        <Badge color={STAGE_COLORS[val] || 'gray'}>
          {val} - {STAGE_LABELS[val] || 'Unknown'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge color={STATUS_COLORS[val] || 'gray'}>
          {(val || 'new').replace(/_/g, ' ')}
        </Badge>
      )
    },
    {
      key: 'tat',
      label: 'TAT',
      render: (val) => val ? `${val}d` : '---'
    },
    {
      key: 'latestUpdates',
      label: 'Updates',
      render: (val) => (
        <div className="max-w-[150px] truncate text-xs text-gray-600" title={val || ''}>
          {val || '---'}
        </div>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleViewDetail(row)}
            className="p-1 text-gray-500 hover:text-indigo-600 rounded">
            <Eye size={16} />
          </button>
          <button onClick={() => handleDelete(row._id)}
            className="p-1 text-gray-500 hover:text-red-600 rounded">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  const detailTabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stages', label: 'Stages' },
    { id: 'readiness', label: 'Readiness' },
    { id: 'projection', label: 'Projection vs Actual' },
    { id: 'preclosure', label: 'Pre-Closure' },
    { id: 'dailylog', label: 'Daily Log' },
    { id: 'comments', label: 'Comments' }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="P2P Tracker"
        subtitle="Design Phase - Push to Production Tracking"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download size={16} className="mr-1" /> Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus size={16} className="mr-1" /> Add Tracker
            </Button>
          </div>
        }
      />

      {/* Stats Row */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[1, 2, 3, 4, 5, 6].map(stage => (
            <Card key={stage} className="p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">Stage {stage}</div>
              <div className="text-lg font-bold text-gray-900">{summary.stages?.[`stage${stage}`] || 0}</div>
              <div className="text-xs text-gray-400">{STAGE_LABELS[stage]}</div>
            </Card>
          ))}
          <Card className="p-3 text-center bg-indigo-50">
            <div className="text-xs text-gray-500 mb-1">Avg TAT</div>
            <div className="text-lg font-bold text-indigo-600">{summary.avgTat || 0}</div>
            <div className="text-xs text-gray-400">days</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, property, designer..."
            />
          </div>
          <Select
            placeholder="All Stages"
            options={Object.entries(STAGE_LABELS).map(([k, v]) => ({ value: k, label: `${k} - ${v}` }))}
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
          />
          <Select
            placeholder="All Statuses"
            options={STATUS_OPTIONS.filter(o => o.value).map(o => ({ value: o.value, label: o.label }))}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
          />
          <Input
            value={showroomFilter}
            onChange={(e) => { setShowroomFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
            placeholder="Showroom"
            className="w-36"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {trackers.length === 0 && !loading ? (
          <EmptyState
            icon={Layers}
            title="No P2P Trackers"
            description="Create a tracker to start monitoring design-to-production progress."
            action={() => setShowCreateModal(true)}
            actionLabel="Create Tracker"
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={trackers}
              loading={loading}
            />
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                  total={pagination.total}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create P2P Tracker"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Project"
              placeholder="Select Project"
              options={projects.map(p => ({ value: p._id, label: `${p.projectId} - ${p.title}` }))}
              value={createForm.projectId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, projectId: e.target.value }))}
            />
            <Input
              label="Property"
              value={createForm.property}
              onChange={(e) => setCreateForm(prev => ({ ...prev, property: e.target.value }))}
              placeholder="Property name"
            />
            <Input
              label="Booking Date"
              type="date"
              value={createForm.bookingDate}
              onChange={(e) => setCreateForm(prev => ({ ...prev, bookingDate: e.target.value }))}
            />
            <Input
              label="Showroom"
              value={createForm.showroom}
              onChange={(e) => setCreateForm(prev => ({ ...prev, showroom: e.target.value }))}
              placeholder="Showroom location"
            />
            <Input
              label="Expected Move/Possession"
              type="date"
              value={createForm.expectedMovPossession}
              onChange={(e) => setCreateForm(prev => ({ ...prev, expectedMovPossession: e.target.value }))}
            />
            <Input
              label="OBV (in Lacs)"
              type="number"
              step="0.01"
              value={createForm.obvInLacs}
              onChange={(e) => setCreateForm(prev => ({ ...prev, obvInLacs: e.target.value }))}
            />
            <Input
              label="FQV (in Lacs)"
              type="number"
              step="0.01"
              value={createForm.fqvInLacs}
              onChange={(e) => setCreateForm(prev => ({ ...prev, fqvInLacs: e.target.value }))}
            />
            <Input
              label="Upsell Value"
              type="number"
              step="0.01"
              value={createForm.upsellValue}
              onChange={(e) => setCreateForm(prev => ({ ...prev, upsellValue: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create Tracker'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedTracker(null); setEditMode(false); setEditData({}) }}
        title={`P2P Tracker - ${selectedTracker?.trackerId || ''}`}
        size="xl"
      >
        {selectedTracker && (
          <div className="space-y-4">
            {/* Header Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge color={STAGE_COLORS[selectedTracker.currentStage] || 'gray'} className="text-sm">
                  Stage {selectedTracker.currentStage} - {STAGE_LABELS[selectedTracker.currentStage]}
                </Badge>
                <Badge color={STATUS_COLORS[selectedTracker.status] || 'gray'}>
                  {(selectedTracker.status || 'new').replace(/_/g, ' ')}
                </Badge>
                {selectedTracker.tat > 0 && (
                  <span className="text-sm text-gray-500">TAT: {selectedTracker.tat} days</span>
                )}
              </div>
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setEditMode(false); setEditData({}) }}>Cancel</Button>
                    <Button size="sm" onClick={handleUpdate} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    <Edit size={14} className="mr-1" /> Edit
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b">
              <div className="flex gap-1 overflow-x-auto">
                {detailTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                      detailTab === tab.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-h-[60vh] overflow-y-auto">
              {detailTab === 'overview' && (
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup title="CX Details">
                    <DetailField label="Customer" value={selectedTracker.customer?.name} />
                    <DetailField label="Property" value={selectedTracker.property}
                      editable={editMode} onChange={v => setEditField('property', v)} editValue={editData.property} />
                    <DetailField label="Booking Date" value={formatDate(selectedTracker.bookingDate)} type="date"
                      editable={editMode} onChange={v => setEditField('bookingDate', v)} editValue={editData.bookingDate}
                      rawValue={selectedTracker.bookingDate?.split?.('T')?.[0] || ''} />
                    <DetailField label="Showroom" value={selectedTracker.showroom}
                      editable={editMode} onChange={v => setEditField('showroom', v)} editValue={editData.showroom} />
                  </FieldGroup>

                  <FieldGroup title="Team">
                    <DetailField label="Sales Person" value={selectedTracker.salesPerson?.name || selectedTracker.salesPersonName} />
                    <DetailField label="Designer" value={selectedTracker.designer?.name || selectedTracker.designerName} />
                  </FieldGroup>

                  <FieldGroup title="Order Value">
                    <DetailField label="OBV (Lacs)" value={selectedTracker.obvInLacs}
                      editable={editMode} onChange={v => setEditField('obvInLacs', parseFloat(v) || 0)} editValue={editData.obvInLacs} type="number" />
                    <DetailField label="FQV (Lacs)" value={selectedTracker.fqvInLacs}
                      editable={editMode} onChange={v => setEditField('fqvInLacs', parseFloat(v) || 0)} editValue={editData.fqvInLacs} type="number" />
                    <DetailField label="Upsell Value" value={selectedTracker.upsellValue}
                      editable={editMode} onChange={v => setEditField('upsellValue', parseFloat(v) || 0)} editValue={editData.upsellValue} type="number" />
                    <DetailField label="P2P Value" value={selectedTracker.p2pValue}
                      editable={editMode} onChange={v => setEditField('p2pValue', parseFloat(v) || 0)} editValue={editData.p2pValue} type="number" />
                    <DetailField label="Descope Reasons" value={selectedTracker.descopeReasons}
                      editable={editMode} onChange={v => setEditField('descopeReasons', v)} editValue={editData.descopeReasons} />
                  </FieldGroup>

                  <FieldGroup title="Status">
                    {editMode ? (
                      <div className="mb-2">
                        <Select
                          label="Status"
                          placeholder="Select Status"
                          options={STATUS_OPTIONS.filter(o => o.value).map(o => ({ value: o.value, label: o.label }))}
                          value={editData.status ?? selectedTracker.status}
                          onChange={e => setEditField('status', e.target.value)}
                        />
                      </div>
                    ) : (
                      <DetailField label="Status" value={selectedTracker.status?.replace(/_/g, ' ')} />
                    )}
                    <DetailField label="Design Dependency" value={selectedTracker.designDependency}
                      editable={editMode} onChange={v => setEditField('designDependency', v)} editValue={editData.designDependency} />
                    <DetailField label="WIP Status" value={selectedTracker.wipStatus}
                      editable={editMode} onChange={v => setEditField('wipStatus', v)} editValue={editData.wipStatus} />
                    <DetailField label="Latest Updates" value={selectedTracker.latestUpdates}
                      editable={editMode} onChange={v => setEditField('latestUpdates', v)} editValue={editData.latestUpdates} />
                  </FieldGroup>
                </div>
              )}

              {detailTab === 'stages' && (
                <div className="space-y-4">
                  <StageSection title="Stage 1 - Booking" stageNum={1} current={selectedTracker.currentStage} editMode={editMode}>
                    <DetailField label="10% Payment" value={formatDate(selectedTracker.tenPercentPayment)} type="date"
                      editable={editMode} onChange={v => setEditField('tenPercentPayment', v)} editValue={editData.tenPercentPayment}
                      rawValue={selectedTracker.tenPercentPayment?.split?.('T')?.[0] || ''} />
                    <DetailField label="10% Amount" value={selectedTracker.tenPercentAmount} type="number"
                      editable={editMode} onChange={v => setEditField('tenPercentAmount', parseFloat(v) || 0)} editValue={editData.tenPercentAmount} />
                    <DetailField label="Quote Requirements Received" value={formatDate(selectedTracker.quoteRequirementsReceived)} type="date"
                      editable={editMode} onChange={v => setEditField('quoteRequirementsReceived', v)} editValue={editData.quoteRequirementsReceived}
                      rawValue={selectedTracker.quoteRequirementsReceived?.split?.('T')?.[0] || ''} />
                  </StageSection>

                  <StageSection title="Stage 2 - Measurement" stageNum={2} current={selectedTracker.currentStage} editMode={editMode}>
                    <DetailField label="MMT Booked" value={formatDate(selectedTracker.mmtBooked)} type="date"
                      editable={editMode} onChange={v => setEditField('mmtBooked', v)} editValue={editData.mmtBooked}
                      rawValue={selectedTracker.mmtBooked?.split?.('T')?.[0] || ''} />
                    <DetailField label="SKP Shell Received" value={formatDate(selectedTracker.skpShellReceived)} type="date"
                      editable={editMode} onChange={v => setEditField('skpShellReceived', v)} editValue={editData.skpShellReceived}
                      rawValue={selectedTracker.skpShellReceived?.split?.('T')?.[0] || ''} />
                  </StageSection>

                  <StageSection title="Stage 3 - Design" stageNum={3} current={selectedTracker.currentStage} editMode={editMode}>
                    <DetailField label="Design Discussion" value={formatDate(selectedTracker.designDiscussion)} type="date"
                      editable={editMode} onChange={v => setEditField('designDiscussion', v)} editValue={editData.designDiscussion}
                      rawValue={selectedTracker.designDiscussion?.split?.('T')?.[0] || ''} />
                    <DetailField label="Discussion Notes" value={selectedTracker.designDiscussionNotes}
                      editable={editMode} onChange={v => setEditField('designDiscussionNotes', v)} editValue={editData.designDiscussionNotes} />
                    <DetailField label="Colour Selection" value={formatDate(selectedTracker.colourSelection)} type="date"
                      editable={editMode} onChange={v => setEditField('colourSelection', v)} editValue={editData.colourSelection}
                      rawValue={selectedTracker.colourSelection?.split?.('T')?.[0] || ''} />
                    <DetailField label="Design Finalized" value={formatDate(selectedTracker.designFinalized)} type="date"
                      editable={editMode} onChange={v => setEditField('designFinalized', v)} editValue={editData.designFinalized}
                      rawValue={selectedTracker.designFinalized?.split?.('T')?.[0] || ''} />
                  </StageSection>

                  <StageSection title="Stage 4 - Validation & P2P Drawings" stageNum={4} current={selectedTracker.currentStage} editMode={editMode}>
                    <DetailField label="Validation Dwg Started" value={formatDate(selectedTracker.validationDwgStarted)} type="date"
                      editable={editMode} onChange={v => setEditField('validationDwgStarted', v)} editValue={editData.validationDwgStarted}
                      rawValue={selectedTracker.validationDwgStarted?.split?.('T')?.[0] || ''} />
                    <DetailField label="Validation Dwg Completed" value={formatDate(selectedTracker.validationDwgCompleted)} type="date"
                      editable={editMode} onChange={v => setEditField('validationDwgCompleted', v)} editValue={editData.validationDwgCompleted}
                      rawValue={selectedTracker.validationDwgCompleted?.split?.('T')?.[0] || ''} />
                    <DetailField label="Site Validation" value={formatDate(selectedTracker.siteValidation)} type="date"
                      editable={editMode} onChange={v => setEditField('siteValidation', v)} editValue={editData.siteValidation}
                      rawValue={selectedTracker.siteValidation?.split?.('T')?.[0] || ''} />
                    <DetailField label="P2P Dwg Started" value={formatDate(selectedTracker.p2pDwgStarted)} type="date"
                      editable={editMode} onChange={v => setEditField('p2pDwgStarted', v)} editValue={editData.p2pDwgStarted}
                      rawValue={selectedTracker.p2pDwgStarted?.split?.('T')?.[0] || ''} />
                    <DetailField label="P2P Dwg Completed" value={formatDate(selectedTracker.p2pDwgCompleted)} type="date"
                      editable={editMode} onChange={v => setEditField('p2pDwgCompleted', v)} editValue={editData.p2pDwgCompleted}
                      rawValue={selectedTracker.p2pDwgCompleted?.split?.('T')?.[0] || ''} />
                  </StageSection>

                  <StageSection title="Stage 5 - QC" stageNum={5} current={selectedTracker.currentStage} editMode={editMode}>
                    <DetailField label="QC Started" value={formatDate(selectedTracker.qcStarted)} type="date"
                      editable={editMode} onChange={v => setEditField('qcStarted', v)} editValue={editData.qcStarted}
                      rawValue={selectedTracker.qcStarted?.split?.('T')?.[0] || ''} />
                    <DetailField label="QC Completed" value={formatDate(selectedTracker.qcCompleted)} type="date"
                      editable={editMode} onChange={v => setEditField('qcCompleted', v)} editValue={editData.qcCompleted}
                      rawValue={selectedTracker.qcCompleted?.split?.('T')?.[0] || ''} />
                    <DetailField label="QC Inputs" value={selectedTracker.qcInputs}
                      editable={editMode} onChange={v => setEditField('qcInputs', v)} editValue={editData.qcInputs} />
                    <DetailField label="QC Drawings Ready" value={formatDate(selectedTracker.qcDwgsReady)} type="date"
                      editable={editMode} onChange={v => setEditField('qcDwgsReady', v)} editValue={editData.qcDwgsReady}
                      rawValue={selectedTracker.qcDwgsReady?.split?.('T')?.[0] || ''} />
                    <DetailField label="QC Date" value={formatDate(selectedTracker.qcDate)} type="date"
                      editable={editMode} onChange={v => setEditField('qcDate', v)} editValue={editData.qcDate}
                      rawValue={selectedTracker.qcDate?.split?.('T')?.[0] || ''} />
                    <DetailField label="SOD Approval" value={formatDate(selectedTracker.sodApproval)} type="date"
                      editable={editMode} onChange={v => setEditField('sodApproval', v)} editValue={editData.sodApproval}
                      rawValue={selectedTracker.sodApproval?.split?.('T')?.[0] || ''} />
                    <DetailField label="SOD Date" value={formatDate(selectedTracker.sodDate)} type="date"
                      editable={editMode} onChange={v => setEditField('sodDate', v)} editValue={editData.sodDate}
                      rawValue={selectedTracker.sodDate?.split?.('T')?.[0] || ''} />
                  </StageSection>

                  <StageSection title="Stage 6 - Completion" stageNum={6} current={selectedTracker.currentStage} editMode={editMode}>
                    <DetailField label="60% Payment" value={formatDate(selectedTracker.sixtyPercentPayment)} type="date"
                      editable={editMode} onChange={v => setEditField('sixtyPercentPayment', v)} editValue={editData.sixtyPercentPayment}
                      rawValue={selectedTracker.sixtyPercentPayment?.split?.('T')?.[0] || ''} />
                    <DetailField label="P2P Date" value={formatDate(selectedTracker.p2pDate)} type="date"
                      editable={editMode} onChange={v => setEditField('p2pDate', v)} editValue={editData.p2pDate}
                      rawValue={selectedTracker.p2pDate?.split?.('T')?.[0] || ''} />
                    <DetailField label="Dispatch Date" value={formatDate(selectedTracker.dispatchDate)} type="date"
                      editable={editMode} onChange={v => setEditField('dispatchDate', v)} editValue={editData.dispatchDate}
                      rawValue={selectedTracker.dispatchDate?.split?.('T')?.[0] || ''} />
                    <DetailField label="Handover Date" value={formatDate(selectedTracker.handoverDate)} type="date"
                      editable={editMode} onChange={v => setEditField('handoverDate', v)} editValue={editData.handoverDate}
                      rawValue={selectedTracker.handoverDate?.split?.('T')?.[0] || ''} />
                    <DetailField label="GFC Date" value={formatDate(selectedTracker.gfcDate)} type="date"
                      editable={editMode} onChange={v => setEditField('gfcDate', v)} editValue={editData.gfcDate}
                      rawValue={selectedTracker.gfcDate?.split?.('T')?.[0] || ''} />
                    <DetailField label="TAT (days)" value={selectedTracker.tat} />
                  </StageSection>
                </div>
              )}

              {detailTab === 'readiness' && (
                <div className="space-y-4">
                  <FieldGroup title="60% and P2P Readiness">
                    {['mmtStatus', 'designStatus', 'validationStatus', 'paymentStatus', 'qcStatus', 'sodStatus'].map(field => (
                      <div key={field} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm text-gray-600 capitalize">{field.replace('Status', ' Status')}</span>
                        {editMode ? (
                          <select
                            className="px-2 py-1 border rounded text-sm"
                            value={editData.readiness?.[field] ?? selectedTracker.readiness?.[field] ?? 'pending'}
                            onChange={e => setNestedEditField('readiness', field, e.target.value)}
                          >
                            {READINESS_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <Badge color={
                            selectedTracker.readiness?.[field] === 'completed' ? 'green' :
                            selectedTracker.readiness?.[field] === 'in_progress' ? 'blue' :
                            selectedTracker.readiness?.[field] === 'na' ? 'gray' : 'yellow'
                          }>
                            {(selectedTracker.readiness?.[field] || 'pending').replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </FieldGroup>

                  <FieldGroup title="10% Tracking">
                    <DetailField label="Designed" value={selectedTracker.tenPercentTracking?.designed ? 'Yes' : 'No'} />
                    <DetailField label="Meetings Taken" value={selectedTracker.tenPercentTracking?.meetingsTaken} />
                    <DetailField label="Projects Closed" value={selectedTracker.tenPercentTracking?.projectsClosed} />
                    <DetailField label="WIP List" value={selectedTracker.tenPercentTracking?.wipList} />
                  </FieldGroup>
                </div>
              )}

              {detailTab === 'projection' && (
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup title="Projection">
                    <DetailField label="OBV" value={selectedTracker.projection?.obv}
                      editable={editMode} type="number"
                      onChange={v => setNestedEditField('projection', 'obv', parseFloat(v) || 0)}
                      editValue={editData.projection?.obv} />
                    <DetailField label="FQV" value={selectedTracker.projection?.fqv}
                      editable={editMode} type="number"
                      onChange={v => setNestedEditField('projection', 'fqv', parseFloat(v) || 0)}
                      editValue={editData.projection?.fqv} />
                    <DetailField label="UV" value={selectedTracker.projection?.uv}
                      editable={editMode} type="number"
                      onChange={v => setNestedEditField('projection', 'uv', parseFloat(v) || 0)}
                      editValue={editData.projection?.uv} />
                    <DetailField label="P2P Date" value={formatDate(selectedTracker.projection?.p2pDate)} type="date"
                      editable={editMode}
                      onChange={v => setNestedEditField('projection', 'p2pDate', v)}
                      editValue={editData.projection?.p2pDate}
                      rawValue={selectedTracker.projection?.p2pDate?.split?.('T')?.[0] || ''} />
                    <DetailField label="Validation" value={formatDate(selectedTracker.projection?.validation)} type="date"
                      editable={editMode}
                      onChange={v => setNestedEditField('projection', 'validation', v)}
                      editValue={editData.projection?.validation}
                      rawValue={selectedTracker.projection?.validation?.split?.('T')?.[0] || ''} />
                    <DetailField label="QC" value={formatDate(selectedTracker.projection?.qc)} type="date"
                      editable={editMode}
                      onChange={v => setNestedEditField('projection', 'qc', v)}
                      editValue={editData.projection?.qc}
                      rawValue={selectedTracker.projection?.qc?.split?.('T')?.[0] || ''} />
                    <DetailField label="Project Handover" value={formatDate(selectedTracker.projection?.projectHandover)} type="date"
                      editable={editMode}
                      onChange={v => setNestedEditField('projection', 'projectHandover', v)}
                      editValue={editData.projection?.projectHandover}
                      rawValue={selectedTracker.projection?.projectHandover?.split?.('T')?.[0] || ''} />
                  </FieldGroup>

                  <FieldGroup title="Actual">
                    <DetailField label="OBV" value={selectedTracker.actual?.obv}
                      editable={editMode} type="number"
                      onChange={v => setNestedEditField('actual', 'obv', parseFloat(v) || 0)}
                      editValue={editData.actual?.obv} />
                    <DetailField label="FQV" value={selectedTracker.actual?.fqv}
                      editable={editMode} type="number"
                      onChange={v => setNestedEditField('actual', 'fqv', parseFloat(v) || 0)}
                      editValue={editData.actual?.fqv} />
                    <DetailField label="UV" value={selectedTracker.actual?.uv}
                      editable={editMode} type="number"
                      onChange={v => setNestedEditField('actual', 'uv', parseFloat(v) || 0)}
                      editValue={editData.actual?.uv} />
                    <DetailField label="P2P Date" value={formatDate(selectedTracker.actual?.p2pDate)} type="date"
                      editable={editMode}
                      onChange={v => setNestedEditField('actual', 'p2pDate', v)}
                      editValue={editData.actual?.p2pDate}
                      rawValue={selectedTracker.actual?.p2pDate?.split?.('T')?.[0] || ''} />
                  </FieldGroup>
                </div>
              )}

              {detailTab === 'preclosure' && (
                <FieldGroup title="Pre-Closure Tracking">
                  <DetailField label="Meeting Date" value={formatDate(selectedTracker.preClosure?.meetingDate)} type="date"
                    editable={editMode}
                    onChange={v => setNestedEditField('preClosure', 'meetingDate', v)}
                    editValue={editData.preClosure?.meetingDate}
                    rawValue={selectedTracker.preClosure?.meetingDate?.split?.('T')?.[0] || ''} />
                  <DetailField label="Details Received Date" value={formatDate(selectedTracker.preClosure?.detailsReceivedDate)} type="date"
                    editable={editMode}
                    onChange={v => setNestedEditField('preClosure', 'detailsReceivedDate', v)}
                    editValue={editData.preClosure?.detailsReceivedDate}
                    rawValue={selectedTracker.preClosure?.detailsReceivedDate?.split?.('T')?.[0] || ''} />
                  <DetailField label="Property Details" value={selectedTracker.preClosure?.propertyDetails}
                    editable={editMode}
                    onChange={v => setNestedEditField('preClosure', 'propertyDetails', v)}
                    editValue={editData.preClosure?.propertyDetails} />
                  <DetailField label="Design Completed" value={formatDate(selectedTracker.preClosure?.designCompleted)} type="date"
                    editable={editMode}
                    onChange={v => setNestedEditField('preClosure', 'designCompleted', v)}
                    editValue={editData.preClosure?.designCompleted}
                    rawValue={selectedTracker.preClosure?.designCompleted?.split?.('T')?.[0] || ''} />
                  <DetailField label="Quote Completed" value={formatDate(selectedTracker.preClosure?.quoteCompleted)} type="date"
                    editable={editMode}
                    onChange={v => setNestedEditField('preClosure', 'quoteCompleted', v)}
                    editValue={editData.preClosure?.quoteCompleted}
                    rawValue={selectedTracker.preClosure?.quoteCompleted?.split?.('T')?.[0] || ''} />
                  <DetailField label="Quote Value" value={selectedTracker.preClosure?.quoteValue} type="number"
                    editable={editMode}
                    onChange={v => setNestedEditField('preClosure', 'quoteValue', parseFloat(v) || 0)}
                    editValue={editData.preClosure?.quoteValue} />
                  {['p1', 'p2', 'p3', 'p4', 'p5'].map(p => (
                    <DetailField key={p} label={p.toUpperCase()} value={formatDate(selectedTracker.preClosure?.[p])} type="date"
                      editable={editMode}
                      onChange={v => setNestedEditField('preClosure', p, v)}
                      editValue={editData.preClosure?.[p]}
                      rawValue={selectedTracker.preClosure?.[p]?.split?.('T')?.[0] || ''} />
                  ))}
                  <DetailField label="CX Status" value={selectedTracker.preClosure?.cxStatus}
                    editable={editMode}
                    onChange={v => setNestedEditField('preClosure', 'cxStatus', v)}
                    editValue={editData.preClosure?.cxStatus} />
                  <DetailField label="Remarks" value={selectedTracker.preClosure?.remarks}
                    editable={editMode}
                    onChange={v => setNestedEditField('preClosure', 'remarks', v)}
                    editValue={editData.preClosure?.remarks} />
                </FieldGroup>
              )}

              {detailTab === 'dailylog' && (
                <div className="space-y-4">
                  {/* Add Daily Log Form */}
                  <Card className="p-4 bg-gray-50">
                    <h4 className="text-sm font-medium mb-3">Add Daily Log</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">AOD (Activity of the Day)</label>
                        <textarea
                          className="w-full mt-1 px-2 py-1.5 border rounded text-sm resize-none"
                          rows={2}
                          value={dailyLogForm.aod}
                          onChange={e => setDailyLogForm(p => ({ ...p, aod: e.target.value }))}
                          placeholder="Morning plan..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">EOD (End of Day)</label>
                        <textarea
                          className="w-full mt-1 px-2 py-1.5 border rounded text-sm resize-none"
                          rows={2}
                          value={dailyLogForm.eod}
                          onChange={e => setDailyLogForm(p => ({ ...p, eod: e.target.value }))}
                          placeholder="End of day summary..."
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Remarks</label>
                        <textarea
                          className="w-full mt-1 px-2 py-1.5 border rounded text-sm resize-none"
                          rows={2}
                          value={dailyLogForm.remarks}
                          onChange={e => setDailyLogForm(p => ({ ...p, remarks: e.target.value }))}
                          placeholder="Additional notes..."
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={handleAddDailyLog} disabled={saving || !dailyLogForm.aod}>
                        {saving ? 'Adding...' : 'Add Log'}
                      </Button>
                    </div>
                  </Card>

                  {/* Daily Log Entries */}
                  <div className="space-y-2">
                    {(selectedTracker.dailyLogs || []).length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No daily logs yet</p>
                    ) : (
                      [...(selectedTracker.dailyLogs || [])].reverse().map((log, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700">
                              {formatDate(log.date)} - {log.designerName || 'Unknown'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">AOD:</span>
                              <p className="text-gray-700 mt-0.5">{log.aod || '---'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">EOD:</span>
                              <p className="text-gray-700 mt-0.5">{log.eod || '---'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Remarks:</span>
                              <p className="text-gray-700 mt-0.5">{log.remarks || '---'}</p>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {detailTab === 'comments' && (
                <div className="space-y-3">
                  {(selectedTracker.comments || []).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                  ) : (
                    [...(selectedTracker.comments || [])].reverse().map((comment, idx) => (
                      <Card key={idx} className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{comment.commentByName || 'Unknown'}</span>
                          <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{comment.text}</p>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// --- Helper Components ---

const FieldGroup = ({ title, children }) => (
  <div className="border rounded-lg p-3">
    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h4>
    <div className="space-y-2">
      {children}
    </div>
  </div>
)

const DetailField = ({ label, value, editable, onChange, editValue, type = 'text', rawValue }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-sm text-gray-500">{label}</span>
    {editable && onChange ? (
      <input
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
        className="px-2 py-1 border rounded text-sm w-40 text-right"
        value={editValue ?? rawValue ?? value ?? ''}
        onChange={e => onChange(e.target.value)}
        step={type === 'number' ? '0.01' : undefined}
      />
    ) : (
      <span className="text-sm font-medium text-gray-900">{value || '---'}</span>
    )}
  </div>
)

const StageSection = ({ title, stageNum, current, editMode, children }) => {
  const isActive = current === stageNum
  const isCompleted = current > stageNum

  return (
    <div className={`border rounded-lg overflow-hidden ${isActive ? 'border-indigo-300 ring-1 ring-indigo-100' : ''}`}>
      <div className={`px-4 py-2 flex items-center gap-2 ${
        isCompleted ? 'bg-green-50' : isActive ? 'bg-indigo-50' : 'bg-gray-50'
      }`}>
        {isCompleted ? (
          <CheckCircle size={16} className="text-green-600" />
        ) : isActive ? (
          <Clock size={16} className="text-indigo-600" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
        )}
        <span className={`text-sm font-medium ${
          isCompleted ? 'text-green-700' : isActive ? 'text-indigo-700' : 'text-gray-600'
        }`}>
          {title}
        </span>
        {isActive && <Badge color="indigo" className="text-xs ml-auto">Current</Badge>}
        {isCompleted && <Badge color="green" className="text-xs ml-auto">Done</Badge>}
      </div>
      <div className="p-4 space-y-2">
        {children}
      </div>
    </div>
  )
}

export default DesignP2PTracker
