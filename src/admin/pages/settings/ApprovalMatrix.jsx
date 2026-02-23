import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, GitBranch, Eye, Edit, Trash2, CheckCircle, Users, Shield, Settings, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select, Modal, Input } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { approvalMatrixAPI } from '../../utils/api'

const ApprovalMatrix = () => {
  const navigate = useNavigate()
  const [matrices, setMatrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showModal, setShowModal] = useState(false)
  const [stats, setStats] = useState({ total: 0, active: 0, modules: 0, totalLevels: 0 })
  const [saving, setSaving] = useState(false)
  const [editingMatrix, setEditingMatrix] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    module: 'all',
    activity: 'all',
    levels: [{ level: 1, levelName: 'maker', approverType: 'reporting_manager' }]
  })

  const moduleOptions = [
    { value: 'procurement', label: 'Procurement' },
    { value: 'hr', label: 'HR' },
    { value: 'finance', label: 'Finance' },
    { value: 'projects', label: 'Projects' },
    { value: 'sales', label: 'Sales' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'crm', label: 'CRM' },
    { value: 'all', label: 'All (Default)' },
  ]

  const activityOptions = {
    procurement: [
      { value: 'purchase_requisition', label: 'Purchase Requisition' },
      { value: 'purchase_order', label: 'Purchase Order' },
      { value: 'goods_receipt', label: 'Goods Receipt' },
      { value: 'vendor_invoice', label: 'Vendor Invoice' },
      { value: 'vendor_payment', label: 'Vendor Payment' },
    ],
    hr: [
      { value: 'leave_request', label: 'Leave Request' },
      { value: 'reimbursement', label: 'Reimbursement' },
      { value: 'attendance_regularization', label: 'Attendance Regularization' },
      { value: 'salary_revision', label: 'Salary Revision' },
    ],
    finance: [
      { value: 'customer_invoice', label: 'Customer Invoice' },
      { value: 'payment_collection', label: 'Payment Collection' },
      { value: 'expense_approval', label: 'Expense Approval' },
      { value: 'budget_allocation', label: 'Budget Allocation' },
    ],
    projects: [
      { value: 'project_creation', label: 'Project Creation' },
      { value: 'project_assignment', label: 'Project Assignment' },
      { value: 'task_completion', label: 'Task Completion' },
      { value: 'design_approval', label: 'Design Approval' },
      { value: 'milestone_approval', label: 'Milestone Approval' },
      { value: 'material_requisition', label: 'Material Requisition' },
      { value: 'vendor_assignment', label: 'Vendor Assignment' },
      { value: 'project_handover', label: 'Project Handover' },
    ],
    inventory: [
      { value: 'stock_adjustment', label: 'Stock Adjustment' },
      { value: 'material_request', label: 'Material Request' },
      { value: 'inter_warehouse_transfer', label: 'Inter Warehouse Transfer' },
    ],
    sales: [
      { value: 'quotation', label: 'Quotation' },
      { value: 'sales_order', label: 'Sales Order' },
      { value: 'discount_approval', label: 'Discount Approval' },
    ],
    crm: [
      { value: 'lead_conversion', label: 'Lead Conversion' },
      { value: 'customer_onboarding', label: 'Customer Onboarding' },
    ],
    vendor: [
      { value: 'vendor_onboarding', label: 'Vendor Onboarding' },
      { value: 'vendor_rate_approval', label: 'Vendor Rate Approval' },
    ],
    all: [{ value: 'all', label: 'All Activities' }],
  }

  const levelNameOptions = [
    { value: 'maker', label: 'Maker' },
    { value: 'checker', label: 'Checker' },
    { value: 'approver', label: 'Approver' },
    { value: 'final_approver', label: 'Final Approver' },
    { value: 'super_approver', label: 'Super Approver' },
  ]

  const approverTypeOptions = [
    { value: 'specific_user', label: 'Specific User(s)' },
    { value: 'role', label: 'Role Based' },
    { value: 'department_head', label: 'Department Head' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'reporting_manager', label: 'Reporting Manager' },
    { value: 'department_manager', label: 'Department Manager' },
    { value: 'module_owner', label: 'Module Owner' },
    { value: 'activity_owner', label: 'Activity Owner' },
  ]

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'team_lead', label: 'Team Lead' },
    { value: 'finance_head', label: 'Finance Head' },
    { value: 'hr_head', label: 'HR Head' },
    { value: 'procurement_head', label: 'Procurement Head' },
    { value: 'operations_head', label: 'Operations Head' },
    { value: 'director', label: 'Director' },
    { value: 'ceo', label: 'CEO' },
  ]

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      module: 'all',
      activity: 'all',
      levels: [{ level: 1, levelName: 'maker', approverType: 'reporting_manager' }]
    })
    setEditingMatrix(null)
  }

  const handleOpenEdit = (matrix) => {
    setEditingMatrix(matrix)
    setFormData({
      name: matrix.name || '',
      description: matrix.description || '',
      module: matrix.module || 'all',
      activity: matrix.activity || 'all',
      levels: matrix.levels?.map((l, i) => ({
        level: l.level || i + 1,
        levelName: l.levelName || 'maker',
        approverType: l.approverType || 'reporting_manager',
        requiredRole: l.requiredRole || ''
      })) || [{ level: 1, levelName: 'maker', approverType: 'reporting_manager' }]
    })
    setShowModal(true)
  }

  const handleSaveMatrix = async () => {
    if (!formData.name) {
      alert('Please enter a matrix name')
      return
    }
    if (formData.levels.length === 0) {
      alert('Please add at least one approval level')
      return
    }

    setSaving(true)
    try {
      if (editingMatrix) {
        await approvalMatrixAPI.update(editingMatrix._id, formData)
      } else {
        await approvalMatrixAPI.create(formData)
      }
      setShowModal(false)
      resetForm()
      loadMatrices()
    } catch (err) {
      console.error('Failed to save matrix:', err)
      alert(err.message || 'Failed to save matrix')
    } finally {
      setSaving(false)
    }
  }

  const addLevel = () => {
    const nextLevel = formData.levels.length + 1
    if (nextLevel > 5) {
      alert('Maximum 5 approval levels allowed')
      return
    }
    setFormData(prev => ({
      ...prev,
      levels: [...prev.levels, {
        level: nextLevel,
        levelName: nextLevel === 2 ? 'checker' : nextLevel === 3 ? 'approver' : 'final_approver',
        approverType: 'department_head'
      }]
    }))
  }

  const removeLevel = (index) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== index).map((l, i) => ({ ...l, level: i + 1 }))
    }))
  }

  const updateLevel = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.map((l, i) => i === index ? { ...l, [field]: value } : l)
    }))
  }

  useEffect(() => {
    loadMatrices()
  }, [pagination.page, search, moduleFilter])

  const loadMatrices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await approvalMatrixAPI.getAll()
      let data = response.data || []

      // Filter by search
      if (search) {
        data = data.filter(m =>
          m.name?.toLowerCase().includes(search.toLowerCase()) ||
          m.module?.toLowerCase().includes(search.toLowerCase())
        )
      }

      // Filter by module
      if (moduleFilter) {
        data = data.filter(m => m.module === moduleFilter)
      }

      setMatrices(data)
      setPagination(prev => ({
        ...prev,
        total: data.length,
        totalPages: Math.ceil(data.length / prev.limit) || 1
      }))

      // Calculate stats
      setStats({
        total: data.length,
        active: data.filter(m => m.isActive).length,
        modules: [...new Set(data.map(m => m.module))].length,
        totalLevels: data.reduce((sum, m) => sum + (m.levels?.length || 0), 0)
      })
    } catch (err) {
      console.error('Failed to load matrices:', err)
      setError('Failed to load approval matrices')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    try {
      await approvalMatrixAPI.seedDefaults()
      loadMatrices()
    } catch (err) {
      console.error('Failed to seed defaults:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this matrix?')) return
    try {
      await approvalMatrixAPI.delete(id)
      loadMatrices()
    } catch (err) {
      console.error('Failed to delete matrix:', err)
      alert(err.message || 'Failed to delete matrix')
    }
  }

  const handleToggleActive = async (matrix) => {
    try {
      await approvalMatrixAPI.update(matrix._id, { isActive: !matrix.isActive })
      loadMatrices()
    } catch (err) {
      console.error('Failed to toggle matrix status:', err)
    }
  }

  const statusColors = {
    true: 'green',
    false: 'gray',
  }

  const moduleColors = {
    procurement: 'blue',
    hr: 'purple',
    finance: 'green',
    projects: 'orange',
    sales: 'cyan',
    inventory: 'pink',
    vendor: 'indigo',
    crm: 'yellow',
    all: 'gray',
  }

  return (
    <div>
      <PageHeader
        title="Approval Matrix"
        description="Configure approval workflows and hierarchies"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Settings' }, { label: 'Approval Matrix' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={handleSeedDefaults}>Seed Defaults</Button>
            <Button icon={Plus} onClick={() => setShowModal(true)}>New Matrix</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <GitBranch className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Matrices</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <Settings className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.modules}</p>
              <p className="text-sm text-gray-500">Modules</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Users className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalLevels}</p>
              <p className="text-sm text-gray-500">Approval Levels</p>
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
            placeholder="Search matrix..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Modules' },
              { value: 'procurement', label: 'Procurement' },
              { value: 'hr', label: 'HR' },
              { value: 'finance', label: 'Finance' },
              { value: 'projects', label: 'Projects' },
              { value: 'sales', label: 'Sales' },
              { value: 'inventory', label: 'Inventory' },
              { value: 'vendor', label: 'Vendor' },
              { value: 'crm', label: 'CRM' },
              { value: 'all', label: 'All (Default)' },
            ]}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : matrices.length === 0 ? (
          <EmptyState
            icon={GitBranch}
            title="No approval matrices found"
            description="Create your first approval matrix"
            action={() => setShowModal(true)}
            actionLabel="New Matrix"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Matrix Name</Table.Head>
                  <Table.Head>Module</Table.Head>
                  <Table.Head>Document Type</Table.Head>
                  <Table.Head>Approval Levels</Table.Head>
                  <Table.Head>Escalation</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {matrices.map((matrix) => (
                  <Table.Row key={matrix._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{matrix.name}</p>
                        <p className="text-xs text-gray-500">{matrix.description}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={moduleColors[matrix.module] || 'gray'}>
                        {matrix.module}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">{matrix.activity}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        {(matrix.levels || []).map((level, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">L{level.level}</span>
                            <span className="text-xs text-gray-600">{level.levelName}</span>
                          </div>
                        ))}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">{matrix.levels?.[0]?.escalateAfterHours || 48}h</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[matrix.isActive] || 'gray'}>
                        {matrix.isActive ? 'Active' : 'Inactive'}
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
                        <Dropdown.Item icon={Eye} onClick={() => handleOpenEdit(matrix)}>
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item icon={Edit} onClick={() => handleOpenEdit(matrix)}>
                          Edit Matrix
                        </Dropdown.Item>
                        <Dropdown.Item icon={CheckCircle} onClick={() => handleToggleActive(matrix)}>
                          {matrix.isActive ? 'Deactivate' : 'Activate'}
                        </Dropdown.Item>
                        <Dropdown.Item icon={Trash2} className="text-red-600" onClick={() => handleDelete(matrix._id)}>
                          Delete
                        </Dropdown.Item>
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

      {/* Create/Edit Matrix Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm() }}
        title={editingMatrix ? 'Edit Approval Matrix' : 'Create New Approval Matrix'}
        size="lg"
      >
        <div className="space-y-5">
          {/* Row 1: Name & Description */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Matrix Name <span className="text-red-500">*</span></label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Purchase Order Approval"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Module</label>
              <Select
                options={moduleOptions}
                value={formData.module}
                onChange={(e) => setFormData(prev => ({ ...prev, module: e.target.value, activity: 'all' }))}
              />
            </div>
          </div>

          {/* Row 2: Activity & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Activity</label>
              <Select
                options={[{ value: 'all', label: 'All Activities' }, ...(activityOptions[formData.module] || [])]}
                value={formData.activity}
                onChange={(e) => setFormData(prev => ({ ...prev, activity: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Approval Levels Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Approval Levels</h4>
              <p className="text-xs text-gray-500 mt-0.5">Define the approval hierarchy (max 5 levels)</p>
            </div>
            <button
              onClick={addLevel}
              disabled={formData.levels.length >= 5}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#111111] bg-[#C59C82]/10 hover:bg-[#C59C82]/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add Level
            </button>
          </div>

          {/* Levels Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Level Name</div>
              <div className="col-span-4">Approver Type</div>
              <div className="col-span-3">Role (if applicable)</div>
              <div className="col-span-1"></div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
              {formData.levels.map((level, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-gray-50/50">
                  <div className="col-span-1">
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-[#111111] text-white text-xs font-semibold rounded-md">
                      {level.level}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <Select
                      options={levelNameOptions}
                      value={level.levelName}
                      onChange={(e) => updateLevel(index, 'levelName', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4">
                    <Select
                      options={approverTypeOptions}
                      value={level.approverType}
                      onChange={(e) => updateLevel(index, 'approverType', e.target.value)}
                    />
                  </div>
                  <div className="col-span-3">
                    {level.approverType === 'role' ? (
                      <Select
                        options={roleOptions}
                        value={level.requiredRole || ''}
                        onChange={(e) => updateLevel(index, 'requiredRole', e.target.value)}
                      />
                    ) : (
                      <span className="text-xs text-gray-400 italic">N/A</span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {formData.levels.length > 1 && (
                      <button
                        onClick={() => removeLevel(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {formData.levels.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">No levels added. Click "Add Level" to start.</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { setShowModal(false); resetForm() }}>
              Cancel
            </Button>
            <Button onClick={handleSaveMatrix} disabled={saving || !formData.name || formData.levels.length === 0}>
              {saving ? 'Saving...' : (editingMatrix ? 'Update Matrix' : 'Create Matrix')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ApprovalMatrix
