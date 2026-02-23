import { useState, useEffect } from 'react'
import { Package, Plus, CheckCircle, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { stockTakesAPI } from '../../utils/api'

const StockTakes = () => {
  const [stockTakes, setStockTakes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  // New stock take modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    warehouse: '',
    reference: '',
    items: [{ materialId: '', systemQty: 0, physicalQty: 0 }],
  })

  useEffect(() => {
    loadStockTakes()
  }, [pagination.page, search, statusFilter])

  const loadStockTakes = async () => {
    setLoading(true)
    try {
      const res = await stockTakesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })
      setStockTakes(res.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.pages || 1,
      }))
    } catch (err) {
      console.error('Failed to load stock takes:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      warehouse: '',
      reference: '',
      items: [{ materialId: '', systemQty: 0, physicalQty: 0 }],
    })
  }

  const handleCreate = async () => {
    if (!formData.warehouse) {
      alert('Please enter the warehouse')
      return
    }
    const validItems = formData.items.filter(item => item.materialId)
    if (validItems.length === 0) {
      alert('Please add at least one item with a material ID')
      return
    }
    setSaving(true)
    try {
      await stockTakesAPI.create({
        ...formData,
        items: validItems.map(item => ({
          materialId: item.materialId,
          systemQty: Number(item.systemQty) || 0,
          physicalQty: Number(item.physicalQty) || 0,
        })),
      })
      setShowNewModal(false)
      resetForm()
      loadStockTakes()
    } catch (err) {
      alert(err.message || 'Failed to create stock take')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this stock take? This will update inventory quantities.')) return
    try {
      await stockTakesAPI.approve(id)
      loadStockTakes()
    } catch (err) {
      alert(err.message || 'Failed to approve stock take')
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { materialId: '', systemQty: 0, physicalQty: 0 }],
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length <= 1) return
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }))
  }

  const calcVariance = (systemQty, physicalQty) => {
    const sys = Number(systemQty) || 0
    const phys = Number(physicalQty) || 0
    return phys - sys
  }

  const calcVariancePct = (systemQty, physicalQty) => {
    const sys = Number(systemQty) || 0
    const phys = Number(physicalQty) || 0
    if (sys === 0) return phys === 0 ? 0 : 100
    return ((phys - sys) / sys) * 100
  }

  const getVarianceStyle = (variancePct) => {
    const abs = Math.abs(variancePct)
    if (abs === 0) return { color: '#16A34A', fontWeight: 500 }
    if (abs <= 5) return { color: '#F59E0B', fontWeight: 500 }
    return { color: '#DC2626', fontWeight: 600 }
  }

  const statusColors = {
    draft: 'gray',
    in_progress: 'blue',
    completed: 'yellow',
    approved: 'green',
    cancelled: 'red',
  }

  return (
    <div>
      <PageHeader
        title="Stock Takes"
        description="Cycle count and physical inventory verification"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Operations' }, { label: 'Stock Takes' }]}
        actions={<Button icon={Plus} onClick={() => { resetForm(); setShowNewModal(true) }}>New Stock Take</Button>}
      />

      <Card style={{ marginBottom: 16 }} padding="sm">
        <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search stock takes..."
            style={{ flex: 1, maxWidth: 320 }}
          />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'approved', label: 'Approved' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : stockTakes.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No stock takes found"
            description="Create a new stock take to verify inventory"
            actionLabel="New Stock Take"
            onAction={() => { resetForm(); setShowNewModal(true) }}
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Stock Take ID</Table.Head>
                  <Table.Head>Warehouse</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Items Count</Table.Head>
                  <Table.Head>Variance %</Table.Head>
                  <Table.Head>Date</Table.Head>
                  <Table.Head>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {stockTakes.map((st) => {
                  const itemCount = st.items?.length || 0
                  const avgVariance = itemCount > 0
                    ? st.items.reduce((sum, item) => {
                        return sum + Math.abs(calcVariancePct(item.systemQty, item.physicalQty))
                      }, 0) / itemCount
                    : 0
                  const varianceStyle = getVarianceStyle(avgVariance)

                  return (
                    <Table.Row key={st._id}>
                      <Table.Cell>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#C59C82' }}>
                          {st.stockTakeId || st.reference || `ST-${st._id?.slice(-6)}`}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: 14, color: '#111827' }}>{st.warehouse || '-'}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={statusColors[st.status] || 'gray'}>
                          {(st.status || 'draft').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: 14, color: '#374151' }}>{itemCount}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: 14, ...varianceStyle }}>
                          {avgVariance === 0 ? 'Match' : `${avgVariance.toFixed(1)}%`}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: 14, color: '#6B7280' }}>{formatDate(st.createdAt)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        {st.status === 'completed' && (
                          <Button size="sm" icon={CheckCircle} onClick={() => handleApprove(st._id)}>
                            Approve
                          </Button>
                        )}
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

      {/* New Stock Take Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Stock Take"
        description="Create a cycle count to verify physical inventory"
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Input
              label="Warehouse"
              placeholder="e.g. Main Warehouse"
              value={formData.warehouse}
              onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Reference"
              placeholder="e.g. CC-2025-01"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>
        </div>

        {/* Items */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Count Items</label>
            <Button variant="secondary" size="sm" icon={Plus} onClick={addItem}>Add Item</Button>
          </div>
          {formData.items.map((item, index) => {
            const variance = calcVariance(item.systemQty, item.physicalQty)
            const variancePct = calcVariancePct(item.systemQty, item.physicalQty)
            const vStyle = getVarianceStyle(variancePct)
            return (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                <Input
                  label={index === 0 ? 'Material ID' : undefined}
                  placeholder="Material ID"
                  value={item.materialId}
                  onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                />
                <Input
                  label={index === 0 ? 'System Qty' : undefined}
                  type="number"
                  placeholder="0"
                  value={item.systemQty}
                  onChange={(e) => updateItem(index, 'systemQty', e.target.value)}
                />
                <Input
                  label={index === 0 ? 'Physical Qty' : undefined}
                  type="number"
                  placeholder="0"
                  value={item.physicalQty}
                  onChange={(e) => updateItem(index, 'physicalQty', e.target.value)}
                />
                <div style={{ paddingBottom: 4 }}>
                  {index === 0 && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Variance</label>}
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: Math.abs(variancePct) > 5 ? '#FEE2E2' : Math.abs(variancePct) > 0 ? '#FEF3C7' : '#DCFCE7',
                    fontSize: 13,
                    ...vStyle,
                  }}>
                    {variance >= 0 ? '+' : ''}{variance} ({variancePct.toFixed(1)}%)
                  </div>
                </div>
                <button
                  onClick={() => removeItem(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: formData.items.length <= 1 ? 'not-allowed' : 'pointer',
                    padding: 8,
                    opacity: formData.items.length <= 1 ? 0.3 : 1,
                  }}
                  disabled={formData.items.length <= 1}
                >
                  <Trash2 size={16} color="#EF4444" />
                </button>
              </div>
            )
          })}
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create Stock Take'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default StockTakes
