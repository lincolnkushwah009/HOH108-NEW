import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, IndianRupee, Eye, Edit, TrendingUp, TrendingDown, AlertTriangle, PieChart, X } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select, Modal, Input, useToast } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'

// Edit Budget Form Component with controlled inputs
const EditBudgetForm = ({ budget, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    budgetedAmount: budget.budgetedAmount,
    actualSpent: budget.actualSpent,
    committed: budget.committed,
    status: budget.status
  })

  const handleSave = () => {
    const budgetedAmount = parseFloat(formData.budgetedAmount) || 0
    const actualSpent = parseFloat(formData.actualSpent) || 0
    const committed = parseFloat(formData.committed) || 0
    const available = budgetedAmount - actualSpent - committed
    const variance = budgetedAmount > 0 ? Math.round(((actualSpent - budgetedAmount) / budgetedAmount) * 100) : 0

    const updatedBudget = {
      ...budget,
      budgetedAmount,
      actualSpent,
      committed,
      available,
      variance,
      status: formData.status,
      lastUpdated: new Date().toISOString()
    }
    onSave(updatedBudget)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
        <Input value={budget.project.projectName} disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
        <Input value={budget.customer.customerName} disabled />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Budgeted Amount</label>
        <Input
          type="number"
          value={formData.budgetedAmount}
          onChange={(e) => setFormData({ ...formData, budgetedAmount: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Actual Spent</label>
          <Input
            type="number"
            value={formData.actualSpent}
            onChange={(e) => setFormData({ ...formData, actualSpent: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Committed</label>
          <Input
            type="number"
            value={formData.committed}
            onChange={(e) => setFormData({ ...formData, committed: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <Select
          options={[
            { value: 'OnTrack', label: 'On Track' },
            { value: 'UnderBudget', label: 'Under Budget' },
            { value: 'AtRisk', label: 'At Risk' },
            { value: 'OverBudget', label: 'Over Budget' },
          ]}
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}

const ProjectBudget = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [detailModal, setDetailModal] = useState({ open: false, budget: null })
  const [editModal, setEditModal] = useState({ open: false, budget: null })
  const [breakdownModal, setBreakdownModal] = useState({ open: false, budget: null })
  const [createModal, setCreateModal] = useState(false)
  const [newBudget, setNewBudget] = useState({
    projectName: '',
    projectCode: '',
    customerName: '',
    budgetedAmount: '',
    categories: [
      { name: 'Materials', budgeted: '' },
      { name: 'Labor', budgeted: '' },
      { name: 'Design', budgeted: '' },
      { name: 'Miscellaneous', budgeted: '' },
    ]
  })

  useEffect(() => {
    loadBudgets()
  }, [pagination.page, search, statusFilter])

  const loadBudgets = async () => {
    setLoading(true)
    try {
      // TODO: Add API call to fetch project budgets
      // Example: const response = await fetch('/api/project-budgets')
      // const data = await response.json()
      const mockData = []
      setBudgets([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
    } catch (err) {
      console.error('Failed to load budgets:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    OnTrack: 'green',
    UnderBudget: 'blue',
    AtRisk: 'yellow',
    OverBudget: 'red',
  }

  const statusLabels = {
    OnTrack: 'On Track',
    UnderBudget: 'Under Budget',
    AtRisk: 'At Risk',
    OverBudget: 'Over Budget',
  }

  // Calculate stats
  const stats = {
    totalBudgeted: budgets.reduce((sum, b) => sum + b.budgetedAmount, 0),
    totalSpent: budgets.reduce((sum, b) => sum + b.actualSpent, 0),
    totalCommitted: budgets.reduce((sum, b) => sum + b.committed, 0),
    overBudget: budgets.filter(b => b.status === 'OverBudget').length,
  }

  const getVarianceIcon = (variance) => {
    if (variance > 5) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (variance < -5) return <TrendingDown className="h-4 w-4 text-green-500" />
    return null
  }

  const getProgressColor = (spent, budgeted) => {
    const percentage = (spent / budgeted) * 100
    if (percentage > 100) return '#ef4444'
    if (percentage > 90) return '#f59e0b'
    return '#22c55e'
  }

  return (
    <div>
      <PageHeader
        title="Project Budgets"
        description="Track and manage project budgets and expenses"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Projects' }, { label: 'Budgets' }]}
        actions={<Button icon={Plus} onClick={() => setCreateModal(true)}>New Budget</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <IndianRupee className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalBudgeted)}</p>
              <p className="text-sm text-gray-500">Total Budgeted</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <IndianRupee className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
              <p className="text-sm text-gray-500">Total Spent</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <PieChart className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalCommitted)}</p>
              <p className="text-sm text-gray-500">Committed</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.overBudget}</p>
              <p className="text-sm text-gray-500">Over Budget</p>
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
              { value: 'OnTrack', label: 'On Track' },
              { value: 'UnderBudget', label: 'Under Budget' },
              { value: 'AtRisk', label: 'At Risk' },
              { value: 'OverBudget', label: 'Over Budget' },
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
        ) : budgets.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No budgets found"
            description="Create your first project budget"
            action={() => setCreateModal(true)}
            actionLabel="New Budget"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Customer</Table.Head>
                  <Table.Head>Budgeted</Table.Head>
                  <Table.Head>Spent</Table.Head>
                  <Table.Head>Progress</Table.Head>
                  <Table.Head>Variance</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {budgets.map((budget) => {
                  const spentPercentage = Math.min((budget.actualSpent / budget.budgetedAmount) * 100, 100)
                  return (
                    <Table.Row key={budget._id}>
                      <Table.Cell>
                        <div>
                          <p className="font-medium text-gray-900">{budget.project.projectName}</p>
                          <p className="text-xs text-gray-500">{budget.project.projectCode}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-gray-900">{budget.customer.customerName}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(budget.budgetedAmount)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(budget.actualSpent)}</p>
                          <p className="text-xs text-gray-500">+{formatCurrency(budget.committed)} committed</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{Math.round(spentPercentage)}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${spentPercentage}%`,
                                backgroundColor: getProgressColor(budget.actualSpent, budget.budgetedAmount)
                              }}
                            />
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-1">
                          {getVarianceIcon(budget.variance)}
                          <span className={`text-sm font-medium ${budget.variance > 0 ? 'text-red-600' : budget.variance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            {budget.variance > 0 ? '+' : ''}{budget.variance}%
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={statusColors[budget.status] || 'gray'}>
                          {statusLabels[budget.status] || budget.status}
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
                          <Dropdown.Item icon={Eye} onClick={() => setDetailModal({ open: true, budget })}>
                            View Details
                          </Dropdown.Item>
                          <Dropdown.Item icon={Edit} onClick={() => setEditModal({ open: true, budget })}>
                            Edit Budget
                          </Dropdown.Item>
                          <Dropdown.Item icon={PieChart} onClick={() => setBreakdownModal({ open: true, budget })}>
                            View Breakdown
                          </Dropdown.Item>
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

      {/* View Details Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, budget: null })}
        title="Budget Details"
        size="lg"
      >
        {detailModal.budget && (
          <div className="space-y-6">
            {/* Project Info */}
            <div className="bg-gradient-to-r from-[#111111] to-[#8B7355] rounded-xl p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{detailModal.budget.project.projectName}</h3>
                  <p className="text-white/60 text-sm mt-1">{detailModal.budget.project.projectCode}</p>
                  <p className="text-white/80 mt-2">{detailModal.budget.customer.customerName}</p>
                </div>
                <Badge color={statusColors[detailModal.budget.status] || 'gray'}>
                  {statusLabels[detailModal.budget.status]}
                </Badge>
              </div>
            </div>

            {/* Budget Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">Budgeted</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(detailModal.budget.budgetedAmount)}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">Spent</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(detailModal.budget.actualSpent)}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">Committed</p>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(detailModal.budget.committed)}</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${detailModal.budget.available >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className="text-sm text-gray-500">Available</p>
                <p className={`text-lg font-bold ${detailModal.budget.available >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(detailModal.budget.available)}
                </p>
              </div>
            </div>

            {/* Variance */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <span className="text-gray-700 font-medium">Budget Variance</span>
              <div className="flex items-center gap-2">
                {getVarianceIcon(detailModal.budget.variance)}
                <span className={`text-lg font-bold ${detailModal.budget.variance > 0 ? 'text-red-600' : detailModal.budget.variance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {detailModal.budget.variance > 0 ? '+' : ''}{detailModal.budget.variance}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Budget Utilization</span>
                <span className="font-medium">{Math.round((detailModal.budget.actualSpent / detailModal.budget.budgetedAmount) * 100)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((detailModal.budget.actualSpent / detailModal.budget.budgetedAmount) * 100, 100)}%`,
                    backgroundColor: getProgressColor(detailModal.budget.actualSpent, detailModal.budget.budgetedAmount)
                  }}
                />
              </div>
            </div>

            {/* Last Updated */}
            <p className="text-sm text-gray-400 text-center">
              Last updated: {formatDate(detailModal.budget.lastUpdated)}
            </p>
          </div>
        )}
      </Modal>

      {/* Edit Budget Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, budget: null })}
        title="Edit Budget"
        size="md"
      >
        {editModal.budget && (
          <EditBudgetForm
            budget={editModal.budget}
            onSave={(updatedBudget) => {
              // Update budget in local state
              const updatedBudgets = budgets.map(b =>
                b._id === updatedBudget._id ? updatedBudget : b
              )
              setBudgets(updatedBudgets)
              toast.success('Budget updated successfully')
              setEditModal({ open: false, budget: null })
              // TODO: Add API call when backend is ready
              // await fetch(`/api/project-budgets/${updatedBudget._id}`, { method: 'PUT', body: JSON.stringify(updatedBudget) })
            }}
            onCancel={() => setEditModal({ open: false, budget: null })}
          />
        )}
      </Modal>

      {/* View Breakdown Modal */}
      <Modal
        isOpen={breakdownModal.open}
        onClose={() => setBreakdownModal({ open: false, budget: null })}
        title="Budget Breakdown"
        size="lg"
      >
        {breakdownModal.budget && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900">{breakdownModal.budget.project.projectName}</h3>
              <p className="text-sm text-gray-500">{breakdownModal.budget.project.projectCode}</p>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Category Breakdown</h4>
              {breakdownModal.budget.categories.map((category, index) => {
                const percentage = (category.actual / category.budgeted) * 100
                const isOverBudget = percentage > 100
                return (
                  <div key={index} className="border rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Budgeted: {formatCurrency(category.budgeted)}</span>
                      <span>Actual: {formatCurrency(category.actual)}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-[#111111] to-[#8B7355] rounded-xl p-5 text-white">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-white/60 text-sm">Total Budgeted</p>
                  <p className="text-xl font-bold">{formatCurrency(breakdownModal.budget.budgetedAmount)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Total Spent</p>
                  <p className="text-xl font-bold text-[#C59C82]">{formatCurrency(breakdownModal.budget.actualSpent)}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Remaining</p>
                  <p className={`text-xl font-bold ${breakdownModal.budget.available >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(breakdownModal.budget.available)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create New Budget Modal */}
      <Modal
        isOpen={createModal}
        onClose={() => {
          setCreateModal(false)
          setNewBudget({
            projectName: '',
            projectCode: '',
            customerName: '',
            budgetedAmount: '',
            categories: [
              { name: 'Materials', budgeted: '' },
              { name: 'Labor', budgeted: '' },
              { name: 'Design', budgeted: '' },
              { name: 'Miscellaneous', budgeted: '' },
            ]
          })
        }}
        title="Create New Budget"
        size="md"
      >
        <div className="space-y-5">
          {/* Project Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter project name"
                  value={newBudget.projectName}
                  onChange={(e) => setNewBudget({ ...newBudget, projectName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Code</label>
                <Input
                  placeholder="Auto-generated if empty"
                  value={newBudget.projectCode}
                  onChange={(e) => setNewBudget({ ...newBudget, projectCode: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter customer name"
                value={newBudget.customerName}
                onChange={(e) => setNewBudget({ ...newBudget, customerName: e.target.value })}
              />
            </div>
          </div>

          {/* Budget Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Total Budget Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <Input
                type="number"
                placeholder="0.00"
                className="pl-8"
                value={newBudget.budgetedAmount}
                onChange={(e) => setNewBudget({ ...newBudget, budgetedAmount: e.target.value })}
              />
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Category Breakdown <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {newBudget.categories.map((cat, index) => (
                <div key={index}>
                  <label className="block text-xs text-gray-500 mb-1">{cat.name}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-7 text-sm"
                      value={cat.budgeted}
                      onChange={(e) => {
                        const updated = [...newBudget.categories]
                        updated[index].budgeted = e.target.value
                        setNewBudget({ ...newBudget, categories: updated })
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setCreateModal(false)
                setNewBudget({
                  projectName: '',
                  projectCode: '',
                  customerName: '',
                  budgetedAmount: '',
                  categories: [
                    { name: 'Materials', budgeted: '' },
                    { name: 'Labor', budgeted: '' },
                    { name: 'Design', budgeted: '' },
                    { name: 'Miscellaneous', budgeted: '' },
                  ]
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Create budget logic - for now mock add to list
                if (newBudget.projectName && newBudget.customerName && newBudget.budgetedAmount) {
                  const newEntry = {
                    _id: Date.now().toString(),
                    project: {
                      projectName: newBudget.projectName,
                      projectCode: newBudget.projectCode || `PRJ-${new Date().getFullYear()}-${String(budgets.length + 1).padStart(4, '0')}`
                    },
                    customer: { customerName: newBudget.customerName },
                    budgetedAmount: parseFloat(newBudget.budgetedAmount),
                    actualSpent: 0,
                    committed: 0,
                    available: parseFloat(newBudget.budgetedAmount),
                    categories: newBudget.categories
                      .filter(c => c.budgeted)
                      .map(c => ({ name: c.name, budgeted: parseFloat(c.budgeted), actual: 0 })),
                    variance: 0,
                    status: 'OnTrack',
                    lastUpdated: new Date().toISOString(),
                  }
                  setBudgets([newEntry, ...budgets])
                  toast.success('Budget created successfully')
                  // TODO: Add API call when backend is ready
                  // await fetch('/api/project-budgets', { method: 'POST', body: JSON.stringify(newEntry) })
                  setCreateModal(false)
                  setNewBudget({
                    projectName: '',
                    projectCode: '',
                    customerName: '',
                    budgetedAmount: '',
                    categories: [
                      { name: 'Materials', budgeted: '' },
                      { name: 'Labor', budgeted: '' },
                      { name: 'Design', budgeted: '' },
                      { name: 'Miscellaneous', budgeted: '' },
                    ]
                  })
                }
              }}
              disabled={!newBudget.projectName || !newBudget.customerName || !newBudget.budgetedAmount}
            >
              Create Budget
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProjectBudget
