import { useState, useEffect } from 'react'
import { Plus, MoreVertical, ClipboardCheck, Eye, Edit, Star, Users, Calendar, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select, Tabs } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { performanceReviewsAPI } from '../../utils/api'

const PerformanceReviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cycleFilter, setCycleFilter] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  useEffect(() => {
    loadReviews()
  }, [pagination.page, search, cycleFilter, activeTab])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (search) params.search = search
      if (cycleFilter) params.reviewCycle = cycleFilter
      if (activeTab === 'pending') params.status = 'self_review,manager_review,draft'
      else if (activeTab === 'completed') params.status = 'completed'

      const response = await performanceReviewsAPI.getAll(params)
      setReviews(response.data || [])
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.pages
        }))
      }
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    SelfReviewPending: { color: 'yellow', label: 'Self Review Pending' },
    ManagerReviewPending: { color: 'blue', label: 'Manager Review Pending' },
    UnderReview: { color: 'purple', label: 'Under Review' },
    Completed: { color: 'green', label: 'Completed' },
    Cancelled: { color: 'gray', label: 'Cancelled' },
  }

  const reviewTypeColors = {
    Monthly: 'cyan',
    Quarterly: 'blue',
    HalfYearly: 'purple',
    Annual: 'orange',
    Probation: 'yellow',
  }

  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-400">-</span>
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
      </div>
    )
  }

  // Calculate stats
  const stats = {
    total: 5,
    pending: 2,
    completed: 3,
    avgRating: 4.2,
  }

  const tabs = [
    { id: 'pending', label: `Pending (${stats.pending})` },
    { id: 'completed', label: `Completed (${stats.completed})` },
    { id: 'all', label: 'All Reviews' },
  ]

  return (
    <div>
      <PageHeader
        title="Performance Reviews"
        description="Track and manage employee performance evaluations"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Performance' }, { label: 'Reviews' }]}
        actions={<Button icon={Plus}>Create Review</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <ClipboardCheck className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Reviews</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending Reviews</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClipboardCheck className="h-5 w-5 text-green-600" />
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
              <Star className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.avgRating}</p>
              <p className="text-sm text-gray-500">Avg. Rating</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Filters */}
      <Card className="mb-6" padding="sm">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employee..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Cycles' },
              { value: 'CYC-2024-Q4', label: 'Q4 2024 Review' },
              { value: 'CYC-2024-Q3', label: 'Q3 2024 Review' },
              { value: 'CYC-2024-ANN', label: 'Annual 2024' },
            ]}
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No reviews found"
            description={activeTab === 'pending' ? 'No pending reviews' : 'No reviews available'}
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Review ID</Table.Head>
                  <Table.Head>Employee</Table.Head>
                  <Table.Head>Review Cycle</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Self Rating</Table.Head>
                  <Table.Head>Manager Rating</Table.Head>
                  <Table.Head>Final Rating</Table.Head>
                  <Table.Head>Due Date</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {reviews.map((review) => {
                  const status = statusConfig[review.status] || {}
                  return (
                    <Table.Row key={review._id}>
                      <Table.Cell>
                        <span className="font-medium text-gray-900">{review.reviewId}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="text-sm text-gray-900">
                            {review.employee.firstName} {review.employee.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{review.employee.employeeCode} - {review.employee.department}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="text-sm text-gray-900">{review.reviewCycle.cycleName}</p>
                          <p className="text-xs text-gray-500">{review.reviewCycle.cycleCode}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={reviewTypeColors[review.reviewType] || 'gray'}>
                          {review.reviewType}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{renderStars(review.selfRating)}</Table.Cell>
                      <Table.Cell>{renderStars(review.managerRating)}</Table.Cell>
                      <Table.Cell>
                        {review.finalRating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-green-500 text-green-500" />
                            <span className="text-sm font-semibold text-green-600">{review.finalRating.toFixed(1)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <span className={`text-sm ${new Date(review.dueDate) < new Date() && review.status !== 'Completed' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {formatDate(review.dueDate)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={status.color || 'gray'}>
                          {status.label || review.status}
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
                          <Dropdown.Item icon={Eye}>View Details</Dropdown.Item>
                          {review.status !== 'Completed' && (
                            <Dropdown.Item icon={Edit}>Complete Review</Dropdown.Item>
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

export default PerformanceReviews
