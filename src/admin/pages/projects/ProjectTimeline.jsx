import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, MoreVertical, Calendar, Eye, Edit, Clock, CheckCircle, AlertTriangle, Play, Pause, ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select, Modal, Input } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { projectsAPI, projectWorkflowAPI } from '../../utils/api'

const ProjectTimeline = () => {
  const navigate = useNavigate()
  const { id: projectId } = useParams()
  const [timelines, setTimelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  // For single project timeline view
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [grouped, setGrouped] = useState({})
  const [showInitModal, setShowInitModal] = useState(false)
  const [initializing, setInitializing] = useState(false)

  useEffect(() => {
    if (projectId && projectId !== 'new') {
      loadProjectTimeline()
    } else {
      loadTimelines()
    }
  }, [projectId, pagination.page, search, statusFilter])

  const loadProjectTimeline = async () => {
    setLoading(true)
    try {
      const [projectRes, tasksRes] = await Promise.all([
        projectsAPI.getOne(projectId),
        projectWorkflowAPI.getProjectTasks(projectId)
      ])
      setProject(projectRes.data)
      setTasks(tasksRes.data?.tasks || [])
      setGrouped(tasksRes.data?.grouped || {})
    } catch (err) {
      console.error('Failed to load project timeline:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadTimelines = async () => {
    setLoading(true)
    try {
      const response = await projectsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter || undefined
      })

      // Transform projects into timeline format
      const projects = response.data || []
      const timelineData = projects.map(p => ({
        _id: p._id,
        project: { projectName: p.title, projectId: p.projectId },
        customer: { customerName: p.customer?.name || 'N/A' },
        startDate: p.startDate || p.timeline?.startDate,
        endDate: p.endDate || p.timeline?.endDate,
        totalDuration: calculateDuration(p.startDate || p.timeline?.startDate, p.endDate || p.timeline?.endDate),
        overallProgress: p.completion?.completionPercentage || 0,
        status: getTimelineStatus(p),
        daysRemaining: calculateDaysRemaining(p.endDate || p.timeline?.endDate),
        milestones: [],
        completedMilestones: 0,
        totalMilestones: 0
      }))

      setTimelines(timelineData)
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || timelineData.length,
        totalPages: response.pagination?.pages || 1
      }))
    } catch (err) {
      console.error('Failed to load timelines:', err)
      setTimelines([])
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate - startDate)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end - today
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  const getTimelineStatus = (project) => {
    const progress = project.completion?.completionPercentage || 0
    const endDate = project.endDate || project.timeline?.endDate
    const daysRemaining = calculateDaysRemaining(endDate)

    if (progress >= 100) return 'Completed'
    if (project.status === 'on_hold') return 'OnHold'
    if (daysRemaining <= 0 && progress < 100) return 'Delayed'
    if (daysRemaining <= 7) return 'AtRisk'
    return 'OnSchedule'
  }

  const handleInitializeTimeline = async () => {
    setInitializing(true)
    try {
      await projectWorkflowAPI.initializeProject(projectId)
      setShowInitModal(false)
      loadProjectTimeline()
    } catch (err) {
      console.error('Failed to initialize timeline:', err)
      alert(err.message || 'Failed to initialize timeline')
    } finally {
      setInitializing(false)
    }
  }

  const statusColors = {
    OnSchedule: 'green',
    AheadOfSchedule: 'blue',
    Delayed: 'red',
    OnHold: 'gray',
    Completed: 'green',
  }

  const statusLabels = {
    OnSchedule: 'On Schedule',
    AheadOfSchedule: 'Ahead',
    Delayed: 'Delayed',
    OnHold: 'On Hold',
    Completed: 'Completed',
  }

  const milestoneStatusColors = {
    Completed: 'green',
    InProgress: 'blue',
    Pending: 'gray',
    Delayed: 'red',
    AtRisk: 'yellow',
  }

  // Calculate stats
  const stats = {
    total: timelines.length,
    onSchedule: timelines.filter(t => t.status === 'OnSchedule').length,
    delayed: timelines.filter(t => t.status === 'Delayed').length,
    avgProgress: timelines.length > 0
      ? Math.round(timelines.reduce((sum, t) => sum + t.overallProgress, 0) / timelines.length)
      : 0,
  }

  const taskStatusColors = {
    not_started: 'gray',
    in_progress: 'blue',
    completed: 'green',
    blocked: 'red',
    on_hold: 'yellow',
  }

  const taskStatusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    blocked: 'Blocked',
    on_hold: 'On Hold',
  }

  // Single Project Timeline View
  if (projectId && projectId !== 'new') {
    if (loading) {
      return <div className="p-6"><PageLoader /></div>
    }

    return (
      <div>
        <PageHeader
          title={project?.title ? `${project.title} - Timeline` : 'Project Timeline'}
          description="View and manage project tasks and phases"
          breadcrumbs={[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Projects', path: '/admin/projects' },
            { label: project?.title || 'Timeline' }
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/admin/project-timeline')}>
                All Timelines
              </Button>
              {tasks.length === 0 && (
                <Button icon={Plus} onClick={() => setShowInitModal(true)}>
                  Initialize Timeline
                </Button>
              )}
            </div>
          }
        />

        {tasks.length === 0 ? (
          <Card>
            <EmptyState
              icon={Calendar}
              title="No timeline tasks"
              description="Initialize the project timeline to start tracking tasks and progress"
              action={() => setShowInitModal(true)}
              actionLabel="Initialize Timeline"
            />
          </Card>
        ) : (
          <>
            {/* Project Progress Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#111111]/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-[#111111]" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
                    <p className="text-sm text-gray-500">Total Tasks</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasks.filter(t => t.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Play className="h-5 w-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasks.filter(t => t.status === 'in_progress').length}
                    </p>
                    <p className="text-sm text-gray-500">In Progress</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#C59C82]/20 rounded-lg">
                    <Clock className="h-5 w-5 text-[#C59C82]" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {project?.completion?.completionPercentage || 0}%
                    </p>
                    <p className="text-sm text-gray-500">Overall Progress</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tasks by Phase */}
            {Object.entries(grouped).map(([phaseCode, phase]) => (
              <Card key={phaseCode} className="mb-4">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{phase.phaseName}</h3>
                  <p className="text-sm text-gray-500">Phase Code: {phase.phaseCode}</p>
                </div>

                {Object.entries(phase.activities).map(([activityCode, activity]) => (
                  <div key={activityCode} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-[#111111]" />
                      <h4 className="font-medium text-gray-700">{activity.activityName}</h4>
                    </div>

                    <Table>
                      <Table.Header>
                        <Table.Row>
                          <Table.Head>Task</Table.Head>
                          <Table.Head>Owner</Table.Head>
                          <Table.Head>Progress</Table.Head>
                          <Table.Head>Status</Table.Head>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {activity.tasks.map((task) => (
                          <Table.Row key={task._id}>
                            <Table.Cell>
                              <div>
                                <p className="font-medium text-gray-900">{task.taskName}</p>
                                <p className="text-xs text-gray-500">{task.taskCode}</p>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-sm text-gray-600">
                                {task.taskOwner?.employeeName || task.taskOwner?.vendorName || '-'}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="w-24">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>{task.completionPercentage || 0}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#111111] rounded-full"
                                    style={{ width: `${task.completionPercentage || 0}%` }}
                                  />
                                </div>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge color={taskStatusColors[task.status] || 'gray'} size="sm">
                                {taskStatusLabels[task.status] || task.status}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                ))}
              </Card>
            ))}
          </>
        )}

        {/* Initialize Timeline Modal */}
        <Modal isOpen={showInitModal} onClose={() => setShowInitModal(false)} title="Initialize Project Timeline">
          <div className="space-y-4">
            <p className="text-gray-600">
              This will create task instances from the standard project template. Once initialized,
              you can track progress for each phase and activity.
            </p>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This action cannot be undone. Make sure the project details are correct before proceeding.
              </p>
            </div>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowInitModal(false)}>Cancel</Button>
              <Button onClick={handleInitializeTimeline} loading={initializing}>
                Initialize Timeline
              </Button>
            </Modal.Footer>
          </div>
        </Modal>
      </div>
    )
  }

  // List View
  return (
    <div>
      <PageHeader
        title="Project Timelines"
        description="Track project schedules and milestones"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Projects' }, { label: 'Timelines' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <Calendar className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Active Projects</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.onSchedule}</p>
              <p className="text-sm text-gray-500">On Schedule</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.delayed}</p>
              <p className="text-sm text-gray-500">Delayed</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <Clock className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.avgProgress}%</p>
              <p className="text-sm text-gray-500">Avg. Progress</p>
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
            placeholder="Search project..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'OnSchedule', label: 'On Schedule' },
              { value: 'AheadOfSchedule', label: 'Ahead of Schedule' },
              { value: 'Delayed', label: 'Delayed' },
              { value: 'OnHold', label: 'On Hold' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : timelines.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No timelines found"
            description="Create your first project timeline"
            action={() => navigate('/admin/project-timeline/new')}
            actionLabel="New Timeline"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Duration</Table.Head>
                  <Table.Head>Progress</Table.Head>
                  <Table.Head>Milestones</Table.Head>
                  <Table.Head>Days Left</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {timelines.map((timeline) => (
                  <Table.Row key={timeline._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{timeline.project.projectName}</p>
                        <p className="text-xs text-gray-500">{timeline.customer.customerName}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{formatDate(timeline.startDate)} - {formatDate(timeline.endDate)}</p>
                        <p className="text-xs text-gray-500">{timeline.totalDuration} days total</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium">{timeline.overallProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#111111] rounded-full transition-all"
                            style={{ width: `${timeline.overallProgress}%` }}
                          />
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap gap-1">
                        {timeline.milestones.slice(0, 3).map((m, idx) => (
                          <Badge key={idx} color={milestoneStatusColors[m.status]} size="sm">
                            {m.name.length > 10 ? m.name.substring(0, 10) + '...' : m.name}
                          </Badge>
                        ))}
                        {timeline.milestones.length > 3 && (
                          <Badge color="gray" size="sm">+{timeline.milestones.length - 3}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {timeline.completedMilestones}/{timeline.totalMilestones} completed
                      </p>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${timeline.daysRemaining <= 7 ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${timeline.daysRemaining <= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                          {timeline.daysRemaining} days
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[timeline.status] || 'gray'}>
                        {statusLabels[timeline.status] || timeline.status}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/project-timeline/${timeline._id}`)}>
                          View Timeline
                        </Dropdown.Item>
                        <Dropdown.Item icon={Edit}>Edit</Dropdown.Item>
                        <Dropdown.Item icon={Plus}>Add Milestone</Dropdown.Item>
                        {timeline.status !== 'OnHold' ? (
                          <Dropdown.Item icon={Pause}>Put On Hold</Dropdown.Item>
                        ) : (
                          <Dropdown.Item icon={Play}>Resume</Dropdown.Item>
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
    </div>
  )
}

export default ProjectTimeline
