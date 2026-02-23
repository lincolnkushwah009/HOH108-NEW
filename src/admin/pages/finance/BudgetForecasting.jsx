import { useState, useEffect } from 'react'
import { TrendingUp, Plus, BarChart3, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const BudgetForecasting = () => {
  const [forecasts, setForecasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  // New forecast modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'department',
    department: '',
    fiscalYear: new Date().getFullYear().toString(),
    period: 'monthly',
    lineItems: [{ category: '', planned: '', notes: '' }],
  })

  // Variance report modal
  const [showVarianceModal, setShowVarianceModal] = useState(false)
  const [varianceData, setVarianceData] = useState([])
  const [varianceLoading, setVarianceLoading] = useState(false)

  useEffect(() => {
    loadForecasts()
  }, [pagination.page, search, typeFilter, statusFilter])

  const loadForecasts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      })
      const res = await apiRequest(`/budget-forecast?${params}`)
      setForecasts(res.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.pages || 1,
      }))
    } catch (err) {
      console.error('Failed to load forecasts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateForecast = async () => {
    if (!formData.name) {
      alert('Please enter a forecast name')
      return
    }
    const validItems = formData.lineItems.filter(item => item.category && item.planned)
    if (validItems.length === 0) {
      alert('Please add at least one line item with category and planned amount')
      return
    }
    setSaving(true)
    try {
      await apiRequest('/budget-forecast', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          lineItems: validItems.map(item => ({
            ...item,
            planned: Number(item.planned),
          })),
        }),
      })
      setShowNewModal(false)
      resetForm()
      loadForecasts()
    } catch (err) {
      alert(err.message || 'Failed to create forecast')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'department',
      department: '',
      fiscalYear: new Date().getFullYear().toString(),
      period: 'monthly',
      lineItems: [{ category: '', planned: '', notes: '' }],
    })
  }

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { category: '', planned: '', notes: '' }],
    }))
  }

  const removeLineItem = (index) => {
    if (formData.lineItems.length <= 1) return
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }))
  }

  const updateLineItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }))
  }

  const fetchVarianceReport = async () => {
    setShowVarianceModal(true)
    setVarianceLoading(true)
    try {
      const res = await apiRequest('/budget-forecast/variance-report')
      setVarianceData(res.data || [])
    } catch (err) {
      console.error('Failed to load variance report:', err)
    } finally {
      setVarianceLoading(false)
    }
  }

  const statusColors = {
    draft: 'gray',
    active: 'blue',
    approved: 'green',
    closed: 'gray',
    revision: 'yellow',
  }

  const typeLabels = {
    department: 'Department',
    project: 'Project',
    company: 'Company',
  }

  const totalPlanned = (forecast) => {
    if (!forecast.lineItems) return 0
    return forecast.lineItems.reduce((sum, item) => sum + (item.planned || 0), 0)
  }

  return (
    <div>
      <PageHeader
        title="Budget Forecasting"
        description="Create and manage budget forecasts across departments and projects"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Finance' }, { label: 'Budget Forecasting' }]}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={BarChart3} onClick={fetchVarianceReport}>Variance Report</Button>
            <Button icon={Plus} onClick={() => { resetForm(); setShowNewModal(true) }}>New Forecast</Button>
          </div>
        }
      />

      <Card style={{ marginBottom: 16 }} padding="sm">
        <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search forecasts..."
            style={{ flex: 1, maxWidth: 320 }}
          />
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'department', label: 'Department' },
              { value: 'project', label: 'Project' },
              { value: 'company', label: 'Company' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'active', label: 'Active' },
              { value: 'approved', label: 'Approved' },
              { value: 'closed', label: 'Closed' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : forecasts.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No forecasts found"
            description="Create your first budget forecast"
            actionLabel="New Forecast"
            onAction={() => { resetForm(); setShowNewModal(true) }}
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Name</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Department</Table.Head>
                  <Table.Head>Period</Table.Head>
                  <Table.Head>Amount</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Created</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {forecasts.map((forecast) => (
                  <Table.Row key={forecast._id}>
                    <Table.Cell>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{forecast.name}</p>
                        <p style={{ fontSize: 12, color: '#6B7280' }}>FY {forecast.fiscalYear}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="blue">{typeLabels[forecast.type] || forecast.type}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: '#374151' }}>{forecast.department || '-'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: '#6B7280', textTransform: 'capitalize' }}>{forecast.period || '-'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                        {formatCurrency(totalPlanned(forecast))}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[forecast.status] || 'gray'}>
                        {(forecast.status || 'draft').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: '#6B7280' }}>{formatDate(forecast.createdAt)}</span>
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

      {/* New Forecast Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Budget Forecast"
        description="Define a budget forecast with line items"
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Forecast Name"
              placeholder="e.g. Q1 2025 Marketing Budget"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'department', label: 'Department' },
                { value: 'project', label: 'Project' },
                { value: 'company', label: 'Company' },
              ]}
            />
          </div>
          <div>
            <Input
              label="Department"
              placeholder="e.g. Marketing"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Fiscal Year"
              type="number"
              value={formData.fiscalYear}
              onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
            />
          </div>
          <div>
            <Select
              label="Period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Line Items</label>
            <Button variant="secondary" size="sm" icon={Plus} onClick={addLineItem}>Add Item</Button>
          </div>
          {formData.lineItems.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <Input
                label={index === 0 ? 'Category' : undefined}
                placeholder="e.g. Salaries"
                value={item.category}
                onChange={(e) => updateLineItem(index, 'category', e.target.value)}
              />
              <Input
                label={index === 0 ? 'Planned (INR)' : undefined}
                type="number"
                placeholder="0"
                value={item.planned}
                onChange={(e) => updateLineItem(index, 'planned', e.target.value)}
              />
              <Input
                label={index === 0 ? 'Notes' : undefined}
                placeholder="Optional notes"
                value={item.notes}
                onChange={(e) => updateLineItem(index, 'notes', e.target.value)}
              />
              <button
                onClick={() => removeLineItem(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: formData.lineItems.length <= 1 ? 'not-allowed' : 'pointer',
                  padding: 8,
                  opacity: formData.lineItems.length <= 1 ? 0.3 : 1,
                }}
                disabled={formData.lineItems.length <= 1}
              >
                <Trash2 size={16} color="#EF4444" />
              </button>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Total: {formatCurrency(formData.lineItems.reduce((sum, item) => sum + (Number(item.planned) || 0), 0))}
            </span>
          </div>
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleCreateForecast} disabled={saving}>
            {saving ? 'Creating...' : 'Create Forecast'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Variance Report Modal */}
      <Modal
        isOpen={showVarianceModal}
        onClose={() => setShowVarianceModal(false)}
        title="Budget Variance Report"
        description="Comparison of planned vs actual spend"
        size="lg"
      >
        {varianceLoading ? (
          <div style={{ padding: 40 }}><PageLoader /></div>
        ) : varianceData.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
            No variance data available
          </div>
        ) : (
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Planned</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Actual</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Variance</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Variance %</th>
                </tr>
              </thead>
              <tbody>
                {varianceData.map((row, i) => {
                  const variance = (row.actual || 0) - (row.planned || 0)
                  const variancePct = row.planned ? ((variance / row.planned) * 100).toFixed(1) : 0
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: '#111827' }}>{row.category || row.name || '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: '#374151', textAlign: 'right' }}>{formatCurrency(row.planned || 0)}</td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: '#374151', textAlign: 'right' }}>{formatCurrency(row.actual || 0)}</td>
                      <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 500, textAlign: 'right', color: variance > 0 ? '#DC2626' : '#16A34A' }}>
                        {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 500, textAlign: 'right', color: variance > 0 ? '#DC2626' : '#16A34A' }}>
                        {variance > 0 ? '+' : ''}{variancePct}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVarianceModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default BudgetForecasting
