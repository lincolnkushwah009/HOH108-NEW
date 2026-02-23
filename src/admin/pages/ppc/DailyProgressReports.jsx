import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, MoreVertical, FileText, Eye, Edit, Trash2, CheckCircle, XCircle,
  Send, AlertTriangle, Users, Image, Clock
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { dailyProgressReportsAPI, projectsAPI, workOrdersAPI } from '../../utils/api'

const DailyProgressReports = () => {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projects, setProjects] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [formData, setFormData] = useState({
    project: '',
    workOrder: '',
    date: new Date().toISOString().split('T')[0],
    weather: 'sunny',
    siteCondition: 'good',
    manpowerPresent: '',
    supervisorPresent: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadReports()
  }, [pagination.page, search, statusFilter, projectFilter, dateFilter])

  useEffect(() => {
    loadProjectsAndWorkOrders()
  }, [])

  const loadProjectsAndWorkOrders = async () => {
    try {
      const [projRes, woRes] = await Promise.all([
        projectsAPI.getAll({ limit: 100, status: 'active' }),
        workOrdersAPI.getAll({ limit: 100, status: 'in_progress' })
      ])
      setProjects(projRes.data || [])
      setWorkOrders(woRes.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    }
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      const response = await dailyProgressReportsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        project: projectFilter,
        date: dateFilter
      })
      setReports(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const project = projects.find(p => p._id === formData.project)
      await dailyProgressReportsAPI.create({
        project: formData.project,
        projectName: project?.title || project?.name,
        workOrder: formData.workOrder || undefined,
        date: formData.date,
        weather: {
          condition: formData.weather
        },
        siteConditions: {
          status: formData.siteCondition
        },
        manpower: {
          present: parseInt(formData.manpowerPresent) || 0,
          supervisors: parseInt(formData.supervisorPresent) || 0
        },
        notes: formData.notes
      })
      setShowCreateModal(false)
      setFormData({
        project: '',
        workOrder: '',
        date: new Date().toISOString().split('T')[0],
        weather: 'sunny',
        siteCondition: 'good',
        manpowerPresent: '',
        supervisorPresent: '',
        notes: ''
      })
      loadReports()
    } catch (err) {
      console.error('Failed to create report:', err)
      alert('Failed to create DPR: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (id) => {
    try {
      await dailyProgressReportsAPI.submit(id)
      loadReports()
    } catch (err) {
      console.error('Failed to submit:', err)
      alert('Failed to submit: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleApprove = async (id) => {
    try {
      await dailyProgressReportsAPI.approve(id)
      loadReports()
    } catch (err) {
      console.error('Failed to approve:', err)
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      await dailyProgressReportsAPI.reject(id, reason)
      loadReports()
    } catch (err) {
      console.error('Failed to reject:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this report?')) return
    try {
      await dailyProgressReportsAPI.delete(id)
      loadReports()
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const statusColors = {
    draft: 'gray',
    submitted: 'blue',
    under_review: 'yellow',
    approved: 'green',
    rejected: 'red'
  }

  const weatherIcons = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    stormy: '⛈️',
    hot: '🔥',
    cold: '❄️'
  }

  const getIssueCount = (report) => {
    return (report.issues?.length || 0)
  }

  const getSafetyIncidents = (report) => {
    return report.safety?.incidents?.length || 0
  }

  return (
    <div>
      <PageHeader
        title="Daily Progress Reports"
        description="Site execution tracking and reporting"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'PPC', path: '/admin/ppc' },
          { label: 'Daily Progress Reports' }
        ]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>New DPR</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {['draft', 'submitted', 'under_review', 'approved', 'rejected'].map((status) => (
          <Card
            key={status}
            className={`cursor-pointer ${statusFilter === status ? 'ring-2 ring-amber-600' : ''}`}
            onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
          >
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {reports.filter(r => r.status === status).length}
              </p>
              <p className="text-xs text-gray-500 capitalize">{status.replace(/_/g, ' ')}</p>
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
            placeholder="Search reports..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Submitted' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' }
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
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports found"
            description="Create your first Daily Progress Report"
            action={() => setShowCreateModal(true)}
            actionLabel="New DPR"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Report #</Table.Head>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Date</Table.Head>
                  <Table.Head>Weather</Table.Head>
                  <Table.Head>Manpower</Table.Head>
                  <Table.Head>Activities</Table.Head>
                  <Table.Head>Issues</Table.Head>
                  <Table.Head>Progress</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {reports.map((report) => (
                  <Table.Row key={report._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{report.dprId}</p>
                        <p className="text-xs text-gray-500">By {report.submittedBy?.name || 'Unknown'}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{report.project?.title || report.projectName || '-'}</p>
                        {report.workOrder && (
                          <p className="text-xs text-gray-500">WO: {report.workOrder?.workOrderId}</p>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">{formatDate(report.date)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        <span>{weatherIcons[report.weather?.condition] || '☀️'}</span>
                        <span className="text-sm text-gray-900 capitalize">{report.weather?.condition || '-'}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{report.manpower?.present || 0}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-medium text-gray-900">
                        {report.activities?.length || 0}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        {getIssueCount(report) > 0 ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-sm text-orange-600">{getIssueCount(report)}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                        {getSafetyIncidents(report) > 0 && (
                          <Badge color="red" size="sm">Safety</Badge>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="w-20">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{report.overallProgress?.percentage || 0}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-600 rounded-full"
                            style={{ width: `${report.overallProgress?.percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[report.status] || 'gray'}>
                        {report.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Draft'}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/ppc/daily-progress-reports/${report._id}`)}>
                          View Details
                        </Dropdown.Item>
                        {report.status === 'draft' && (
                          <>
                            <Dropdown.Item icon={Edit} onClick={() => navigate(`/admin/ppc/daily-progress-reports/${report._id}/edit`)}>
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item icon={Send} onClick={() => handleSubmit(report._id)}>
                              Submit
                            </Dropdown.Item>
                          </>
                        )}
                        {(report.status === 'submitted' || report.status === 'under_review') && (
                          <>
                            <Dropdown.Item icon={CheckCircle} onClick={() => handleApprove(report._id)}>
                              Approve
                            </Dropdown.Item>
                            <Dropdown.Item icon={XCircle} onClick={() => handleReject(report._id)}>
                              Reject
                            </Dropdown.Item>
                          </>
                        )}
                        {report.photos?.length > 0 && (
                          <Dropdown.Item icon={Image}>
                            View Photos ({report.photos.length})
                          </Dropdown.Item>
                        )}
                        {report.status === 'draft' && (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item icon={Trash2} onClick={() => handleDelete(report._id)} className="text-red-600">
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
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Daily Progress Report" size="lg">
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
          <Select
            label="Work Order (Optional)"
            options={[
              { value: '', label: 'Select Work Order (Optional)' },
              ...workOrders
                .filter(wo => !formData.project || wo.project?._id === formData.project)
                .map(wo => ({ value: wo._id, label: `${wo.workOrderId} - ${wo.item?.name || ''}` }))
            ]}
            value={formData.workOrder}
            onChange={(e) => setFormData({ ...formData, workOrder: e.target.value })}
          />
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Weather"
              options={[
                { value: 'sunny', label: '☀️ Sunny' },
                { value: 'cloudy', label: '☁️ Cloudy' },
                { value: 'rainy', label: '🌧️ Rainy' },
                { value: 'stormy', label: '⛈️ Stormy' },
                { value: 'hot', label: '🔥 Hot' },
                { value: 'cold', label: '❄️ Cold' }
              ]}
              value={formData.weather}
              onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
            />
            <Select
              label="Site Condition"
              options={[
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
                { value: 'poor', label: 'Poor' },
                { value: 'restricted', label: 'Restricted Access' }
              ]}
              value={formData.siteCondition}
              onChange={(e) => setFormData({ ...formData, siteCondition: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Workers Present"
              type="number"
              min="0"
              value={formData.manpowerPresent}
              onChange={(e) => setFormData({ ...formData, manpowerPresent: e.target.value })}
              required
            />
            <Input
              label="Supervisors Present"
              type="number"
              min="0"
              value={formData.supervisorPresent}
              onChange={(e) => setFormData({ ...formData, supervisorPresent: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
              placeholder="General notes about the day's progress..."
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create DPR</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default DailyProgressReports
