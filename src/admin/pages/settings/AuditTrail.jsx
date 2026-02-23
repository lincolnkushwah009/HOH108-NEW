import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MoreVertical, History, Eye, Download, Filter, User, Clock, FileText, Edit, Trash2, Plus, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { auditLogsAPI } from '../../utils/api'

const AuditTrail = () => {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ total: 0, creates: 0, updates: 0, deletes: 0 })

  useEffect(() => {
    loadLogs()
  }, [pagination.page, search, moduleFilter, actionFilter, dateFilter])

  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
      }
      if (moduleFilter) params.module = moduleFilter
      if (actionFilter) params.action = actionFilter
      if (dateFilter) params.dateFilter = dateFilter

      const response = await auditLogsAPI.getAll(params)
      setLogs(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
      // Set stats from response
      if (response.stats) {
        setStats({
          total: response.stats.total || 0,
          creates: response.stats.byAction?.CREATE || 0,
          updates: response.stats.byAction?.UPDATE || 0,
          deletes: response.stats.byAction?.DELETE || 0
        })
      }
    } catch (err) {
      console.error('Failed to load logs:', err)
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      // Open export in new window
      const params = new URLSearchParams()
      if (moduleFilter) params.set('module', moduleFilter)
      if (actionFilter) params.set('action', actionFilter)
      if (dateFilter) params.set('dateFilter', dateFilter)
      window.open(`/api/audit-logs/export/csv?${params.toString()}`, '_blank')
    } catch (err) {
      console.error('Failed to export logs:', err)
    }
  }

  const actionColors = {
    CREATE: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
    APPROVE: 'purple',
    REJECT: 'orange',
    LOGIN: 'cyan',
    LOGOUT: 'gray',
    EXPORT: 'yellow',
  }

  const actionIcons = {
    CREATE: Plus,
    UPDATE: Edit,
    DELETE: Trash2,
    APPROVE: CheckCircle,
    LOGIN: User,
  }

  const moduleColors = {
    Projects: 'orange',
    Sales: 'cyan',
    Inventory: 'purple',
    Settings: 'gray',
    Finance: 'green',
    Procurement: 'blue',
    Auth: 'yellow',
    Customers: 'pink',
    HR: 'indigo',
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return formatDate(timestamp)
  }

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Track all system activities and changes"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Settings' }, { label: 'Audit Trail' }]}
        actions={<Button variant="outline" icon={Download} onClick={handleExport}>Export Logs</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <History className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Logs</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.creates}</p>
              <p className="text-sm text-gray-500">Creates</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Edit className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.updates}</p>
              <p className="text-sm text-gray-500">Updates</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.deletes}</p>
              <p className="text-sm text-gray-500">Deletes</p>
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
            placeholder="Search user, entity..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Modules' },
              { value: 'Projects', label: 'Projects' },
              { value: 'Sales', label: 'Sales' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Procurement', label: 'Procurement' },
              { value: 'Inventory', label: 'Inventory' },
              { value: 'HR', label: 'HR' },
              { value: 'Settings', label: 'Settings' },
            ]}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-36"
          />
          <Select
            options={[
              { value: '', label: 'All Actions' },
              { value: 'CREATE', label: 'Create' },
              { value: 'UPDATE', label: 'Update' },
              { value: 'DELETE', label: 'Delete' },
              { value: 'APPROVE', label: 'Approve' },
              { value: 'LOGIN', label: 'Login' },
            ]}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-36"
          />
          <Select
            options={[
              { value: '', label: 'All Time' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
            ]}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-36"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit logs found"
            description="Activity logs will appear here"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Timestamp</Table.Head>
                  <Table.Head>User</Table.Head>
                  <Table.Head>Action</Table.Head>
                  <Table.Head>Module</Table.Head>
                  <Table.Head>Entity</Table.Head>
                  <Table.Head>Changes</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {logs.map((log) => {
                  const ActionIcon = actionIcons[log.action] || FileText
                  return (
                    <Table.Row key={log._id}>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">{formatTimestamp(log.timestamp)}</p>
                            <p className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="font-medium text-gray-900">{log.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{log.user?.role || ''}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={actionColors[log.action] || 'gray'}>
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {log.action}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={moduleColors[log.module] || 'gray'} size="sm">
                          {log.module}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="text-sm text-gray-900">{log.entityName}</p>
                          <p className="text-xs text-gray-500">{log.entity} • {log.entityId}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {log.changes ? (
                          <div className="max-w-xs">
                            {log.changes.slice(0, 2).map((change, idx) => (
                              <p key={idx} className="text-xs text-gray-600 truncate">
                                <span className="font-medium">{change.field}:</span>{' '}
                                <span className="text-red-500 line-through">{change.oldValue || 'null'}</span>{' → '}
                                <span className="text-green-600">{change.newValue}</span>
                              </p>
                            ))}
                            {log.changes.length > 2 && (
                              <p className="text-xs text-gray-400">+{log.changes.length - 2} more changes</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
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
                          <Dropdown.Item icon={Eye}>View Full Details</Dropdown.Item>
                          <Dropdown.Item icon={User}>View User Activity</Dropdown.Item>
                          <Dropdown.Item icon={FileText}>View Entity</Dropdown.Item>
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

export default AuditTrail
