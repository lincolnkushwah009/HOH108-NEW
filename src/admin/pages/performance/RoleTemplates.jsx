import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Briefcase, Eye, Edit, Copy, Trash2, Users, Target, CheckSquare } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select, Modal, Input, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { roleTemplatesAPI } from '../../utils/api'

const RoleTemplates = () => {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    level: 'junior',
    description: ''
  })

  useEffect(() => {
    loadTemplates()
  }, [pagination.page, search, departmentFilter])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (search) params.search = search
      if (departmentFilter) params.department = departmentFilter.toLowerCase()

      const response = await roleTemplatesAPI.getAll(params)
      setTemplates(response.data || [])
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.pages
        }))
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    Active: 'green',
    Draft: 'gray',
    Archived: 'orange',
  }

  const levelColors = {
    entry: 'gray',
    junior: 'blue',
    mid: 'purple',
    senior: 'orange',
    lead: 'red',
    manager: 'red',
    director: 'pink',
    executive: 'emerald',
  }

  const handleCreateTemplate = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.department) {
      alert('Please fill in Role Name and Department')
      return
    }
    setSaving(true)
    try {
      const response = await roleTemplatesAPI.create({
        ...formData,
        kras: [],
        competencies: [],
        isActive: false
      })
      setShowModal(false)
      setFormData({ name: '', department: '', level: 'junior', description: '' })
      // Navigate to the new template detail page for editing
      if (response.data?._id) {
        navigate(`/admin/performance/role-templates/${response.data._id}`)
      } else {
        loadTemplates()
      }
    } catch (err) {
      console.error('Failed to create template:', err)
      alert(err.message || 'Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  // Calculate stats
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    totalAssigned: templates.reduce((sum, t) => sum + (t.assignedEmployees || 0), 0),
    departments: [...new Set(templates.map(t => t.department))].length,
  }

  return (
    <div>
      <PageHeader
        title="Role Templates"
        description="Define KRAs, KPIs, and competencies for each role"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Performance' }, { label: 'Role Templates' }]}
        actions={<Button icon={Plus} onClick={() => setShowModal(true)}>New Template</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <Briefcase className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Roles</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active Templates</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <Users className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAssigned}</p>
              <p className="text-sm text-gray-500">Employees Assigned</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Target className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.departments}</p>
              <p className="text-sm text-gray-500">Departments</p>
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
            placeholder="Search role..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Departments' },
              { value: 'sales', label: 'Sales' },
              { value: 'operations', label: 'Operations' },
              { value: 'design', label: 'Design' },
              { value: 'production', label: 'Production' },
              { value: 'finance', label: 'Finance' },
              { value: 'hr', label: 'HR' },
              { value: 'management', label: 'Management' },
            ]}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-44"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : templates.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No role templates found"
            description="Create your first role template"
            action={() => setShowModal(true)}
            actionLabel="New Template"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Role Name</Table.Head>
                  <Table.Head>Department</Table.Head>
                  <Table.Head>Level</Table.Head>
                  <Table.Head>KRAs</Table.Head>
                  <Table.Head>Competencies</Table.Head>
                  <Table.Head>Assigned</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {templates.map((template) => (
                  <Table.Row key={template._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{template.name}</p>
                        <p className="text-xs text-gray-500">Updated {formatDate(template.updatedAt)}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900 capitalize">{template.department}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={levelColors[template.level] || 'gray'}>
                        <span className="capitalize">{template.level}</span>
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap gap-1">
                        {(template.kras || []).slice(0, 2).map((kra, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {kra.kraName || kra.name} ({kra.weight}%)
                          </span>
                        ))}
                        {(template.kras || []).length > 2 && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            +{template.kras.length - 2} more
                          </span>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">{template.competencies?.length || 0} Competencies</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{template.assignedEmployees || 0}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={template.isActive ? 'green' : 'gray'}>
                        {template.isActive ? 'Active' : 'Inactive'}
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
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/role-templates/${template._id}`)}>
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item icon={Edit}>Edit Template</Dropdown.Item>
                        <Dropdown.Item icon={Copy}>Duplicate</Dropdown.Item>
                        <Dropdown.Item icon={Trash2} className="text-red-600">Archive</Dropdown.Item>
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

      {/* New Template Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Role Template" size="md">
        <form onSubmit={handleCreateTemplate}>
          <div className="space-y-4">
            <Input
              label="Role Name"
              placeholder="e.g., Senior Interior Designer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Select
              label="Department"
              options={[
                { value: '', label: 'Select Department' },
                { value: 'sales', label: 'Sales' },
                { value: 'operations', label: 'Operations' },
                { value: 'design', label: 'Design' },
                { value: 'production', label: 'Production' },
                { value: 'finance', label: 'Finance' },
                { value: 'hr', label: 'HR' },
                { value: 'management', label: 'Management' },
              ]}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
            />
            <Select
              label="Level"
              options={[
                { value: 'entry', label: 'Entry Level' },
                { value: 'junior', label: 'Junior' },
                { value: 'mid', label: 'Mid-Level' },
                { value: 'senior', label: 'Senior' },
                { value: 'lead', label: 'Lead' },
                { value: 'manager', label: 'Manager' },
                { value: 'director', label: 'Director' },
                { value: 'executive', label: 'Executive' },
              ]}
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            />
            <Textarea
              label="Description"
              placeholder="Brief description of this role..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create Template
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default RoleTemplates
