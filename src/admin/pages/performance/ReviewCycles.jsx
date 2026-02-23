import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Calendar, Eye, Edit, Play, Pause, CheckCircle, Users, Clock, BarChart3 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { reviewCyclesAPI } from '../../utils/api'

const ReviewCycles = () => {
  const navigate = useNavigate()
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  useEffect(() => {
    loadCycles()
  }, [pagination.page, search, statusFilter])

  const loadCycles = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (statusFilter) params.status = statusFilter.toLowerCase()

      const response = await reviewCyclesAPI.getAll(params)
      setCycles(response.data || [])
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.pages
        }))
      }
    } catch (err) {
      console.error('Failed to load cycles:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    Draft: 'gray',
    Scheduled: 'blue',
    Active: 'green',
    Paused: 'yellow',
    Completed: 'purple',
    Cancelled: 'red',
  }

  const cycleTypeColors = {
    Quarterly: 'blue',
    'Semi-Annual': 'purple',
    Annual: 'orange',
    Probation: 'cyan',
    AdHoc: 'gray',
  }

  // Calculate stats
  const stats = {
    total: cycles.length,
    active: cycles.filter(c => c.status === 'Active').length,
    completed: cycles.filter(c => c.status === 'Completed').length,
    pendingReviews: cycles.reduce((sum, c) => sum + c.pendingReviews, 0),
  }

  const getProgressPercentage = (completed, total) => {
    if (total === 0) return 0
    return Math.round((completed / total) * 100)
  }

  return (
    <div>
      <PageHeader
        title="Review Cycles"
        description="Manage performance review cycles and timelines"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Performance' }, { label: 'Review Cycles' }]}
        actions={<Button icon={Plus} onClick={() => navigate('/admin/review-cycles/new')}>New Cycle</Button>}
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
              <p className="text-sm text-gray-500">Total Cycles</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active Cycles</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <Clock className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingReviews}</p>
              <p className="text-sm text-gray-500">Pending Reviews</p>
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
            placeholder="Search cycle..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'Active', label: 'Active' },
              { value: 'Scheduled', label: 'Scheduled' },
              { value: 'Completed', label: 'Completed' },
              { value: 'Paused', label: 'Paused' },
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
        ) : cycles.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No review cycles found"
            description="Create your first review cycle"
            action={() => navigate('/admin/review-cycles/new')}
            actionLabel="New Cycle"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Cycle Name</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Period</Table.Head>
                  <Table.Head>Progress</Table.Head>
                  <Table.Head>Current Stage</Table.Head>
                  <Table.Head>Avg. Rating</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {cycles.map((cycle) => {
                  const progressPct = getProgressPercentage(cycle.completedReviews, cycle.eligibleEmployees)
                  return (
                    <Table.Row key={cycle._id}>
                      <Table.Cell>
                        <div>
                          <p className="font-medium text-gray-900">{cycle.cycleName}</p>
                          <p className="text-xs text-gray-500">
                            Review: {formatDate(cycle.reviewPeriod.start)} - {formatDate(cycle.reviewPeriod.end)}
                          </p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={cycleTypeColors[cycle.cycleType] || 'gray'}>
                          {cycle.cycleType}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-gray-900">
                          {formatDate(cycle.period.start)} - {formatDate(cycle.period.end)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{cycle.completedReviews}/{cycle.eligibleEmployees}</span>
                            <span className="font-medium">{progressPct}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#111111] rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-gray-900">{cycle.currentStage}</span>
                      </Table.Cell>
                      <Table.Cell>
                        {cycle.avgRating ? (
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-4 w-4 text-[#C59C82]" />
                            <span className="text-sm font-medium text-gray-900">{cycle.avgRating}/5</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={statusColors[cycle.status] || 'gray'}>
                          {cycle.status}
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
                          <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/review-cycles/${cycle._id}`)}>
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Item icon={BarChart3}>View Reports</Dropdown.Item>
                          {cycle.status === 'Active' && (
                            <Dropdown.Item icon={Pause}>Pause Cycle</Dropdown.Item>
                          )}
                          {cycle.status === 'Paused' && (
                            <Dropdown.Item icon={Play}>Resume Cycle</Dropdown.Item>
                          )}
                          {cycle.status === 'Scheduled' && (
                            <>
                              <Dropdown.Item icon={Edit}>Edit</Dropdown.Item>
                              <Dropdown.Item icon={Play}>Start Now</Dropdown.Item>
                            </>
                          )}
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
    </div>
  )
}

export default ReviewCycles
