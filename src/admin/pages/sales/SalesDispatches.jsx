import { useState, useEffect, useCallback } from 'react'
import {
  Plus, MoreVertical, Truck, Eye, Edit, CheckCircle, Package,
  FileText, Send, Clock, XCircle, Hash
} from 'lucide-react'
import { apiRequest } from '../../utils/api'
import { formatDate, formatCurrency } from '../../utils/helpers'
import PageHeader from '../../components/layout/PageHeader'
import {
  Button, Card, Table, Badge, SearchInput, Pagination,
  Dropdown, Modal, Input, Select, Textarea, useToast
} from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

const STATUS_COLORS = {
  draft: '#9CA3AF',
  dispatched: '#3B82F6',
  in_transit: '#F59E0B',
  delivered: '#22C55E',
  cancelled: '#EF4444',
}

const STATUS_BADGE_MAP = {
  draft: 'gray',
  dispatched: 'blue',
  in_transit: 'yellow',
  delivered: 'green',
  cancelled: 'red',
}

const STATUS_LABELS = {
  draft: 'Draft',
  dispatched: 'Dispatched',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const emptyFormData = {
  salesOrder: '',
  customer: '',
  dispatchDate: '',
  expectedDeliveryDate: '',
  docketNumber: '',
  vehicleNumber: '',
  transporterName: '',
  lineItems: [],
  notes: '',
}

const SalesDispatches = () => {
  const toast = useToast()

  // Data state
  const [dispatches, setDispatches] = useState([])
  const [salesOrders, setSalesOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Filter state
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [pagination, setPagination] = useState({
    page: 1, limit: 10, total: 0, totalPages: 0,
  })

  // Modal state
  const [modal, setModal] = useState({ show: false, editing: null, data: { ...emptyFormData } })
  const [viewModal, setViewModal] = useState({ show: false, data: null })
  const [deliveryModal, setDeliveryModal] = useState({ show: false, dispatch: null, items: [] })

  // Load dispatches
  const loadDispatches = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (filters.status) params.status = filters.status
      if (filters.search) params.search = filters.search

      const res = await apiRequest('/sales-dispatches?' + new URLSearchParams(params))
      setDispatches(res.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.pages || 1,
      }))
    } catch (err) {
      toast?.error?.(err.message || 'Failed to load dispatches')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, filters.status, filters.search])

  useEffect(() => {
    loadDispatches()
  }, [loadDispatches])

  // Load sales orders for the dropdown
  const loadSalesOrders = async () => {
    try {
      const res = await apiRequest('/sales-orders?limit=200')
      setSalesOrders(res.data || [])
    } catch (err) {
      console.error('Failed to load sales orders:', err)
    }
  }

  // Stats
  const stats = {
    total: pagination.total || dispatches.length,
    draft: dispatches.filter(d => d.status === 'draft').length,
    dispatched: dispatches.filter(d => d.status === 'dispatched').length,
    in_transit: dispatches.filter(d => d.status === 'in_transit').length,
    delivered: dispatches.filter(d => d.status === 'delivered').length,
  }

  // Open create modal
  const openCreateModal = () => {
    loadSalesOrders()
    setModal({ show: true, editing: null, data: { ...emptyFormData } })
  }

  // Open edit modal
  const openEditModal = (dispatch) => {
    loadSalesOrders()
    setModal({
      show: true,
      editing: dispatch._id,
      data: {
        salesOrder: dispatch.salesOrder?._id || dispatch.salesOrder || '',
        customer: dispatch.customer?.name || dispatch.customerName || '',
        dispatchDate: dispatch.dispatchDate ? dispatch.dispatchDate.split('T')[0] : '',
        expectedDeliveryDate: dispatch.expectedDeliveryDate ? dispatch.expectedDeliveryDate.split('T')[0] : '',
        docketNumber: dispatch.docketNumber || '',
        vehicleNumber: dispatch.vehicleNumber || '',
        transporterName: dispatch.transporterName || '',
        lineItems: dispatch.lineItems || [],
        notes: dispatch.notes || '',
      },
    })
  }

  // Handle sales order change - auto-fill customer and line items
  const handleSalesOrderChange = (soId) => {
    const so = salesOrders.find(o => o._id === soId)
    if (so) {
      setModal(prev => ({
        ...prev,
        data: {
          ...prev.data,
          salesOrder: soId,
          customer: so.customer?.name || so.customerName || '',
          lineItems: (so.items || so.lineItems || []).map(item => ({
            description: item.description || item.name || '',
            itemCode: item.itemCode || item.code || '',
            orderedQty: item.quantity || item.orderedQty || 0,
            dispatchedQty: item.quantity || item.orderedQty || 0,
          })),
        },
      }))
    }
  }

  // Update form data
  const updateFormData = (field, value) => {
    setModal(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
    }))
  }

  // Update line item
  const updateLineItem = (index, field, value) => {
    setModal(prev => {
      const items = [...prev.data.lineItems]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, data: { ...prev.data, lineItems: items } }
    })
  }

  // Save dispatch (create or update)
  const saveDispatch = async () => {
    if (!modal.data.salesOrder) {
      toast?.error?.('Please select a Sales Order')
      return
    }
    if (!modal.data.dispatchDate) {
      toast?.error?.('Please enter a Dispatch Date')
      return
    }

    setSaving(true)
    try {
      if (modal.editing) {
        await apiRequest(`/sales-dispatches/${modal.editing}`, {
          method: 'PUT',
          body: JSON.stringify(modal.data),
        })
        toast?.success?.('Dispatch updated successfully')
      } else {
        await apiRequest('/sales-dispatches', {
          method: 'POST',
          body: JSON.stringify(modal.data),
        })
        toast?.success?.('Dispatch created successfully')
      }
      setModal({ show: false, editing: null, data: { ...emptyFormData } })
      loadDispatches()
    } catch (err) {
      toast?.error?.(err.message || 'Failed to save dispatch')
    } finally {
      setSaving(false)
    }
  }

  // Mark as dispatched
  const markDispatched = async (id) => {
    try {
      await apiRequest(`/sales-dispatches/${id}/dispatch`, { method: 'POST' })
      toast?.success?.('Dispatch marked as dispatched')
      loadDispatches()
    } catch (err) {
      toast?.error?.(err.message || 'Failed to update status')
    }
  }

  // Open delivery confirmation modal
  const openDeliveryModal = (dispatch) => {
    setDeliveryModal({
      show: true,
      dispatch,
      items: (dispatch.lineItems || []).map(item => ({
        ...item,
        receivedQty: item.dispatchedQty || item.quantity || 0,
      })),
    })
  }

  // Confirm delivery
  const confirmDelivery = async () => {
    if (!deliveryModal.dispatch) return
    setSaving(true)
    try {
      await apiRequest(`/sales-dispatches/${deliveryModal.dispatch._id}/confirm-delivery`, {
        method: 'POST',
        body: JSON.stringify({ items: deliveryModal.items }),
      })
      toast?.success?.('Delivery confirmed successfully')
      setDeliveryModal({ show: false, dispatch: null, items: [] })
      loadDispatches()
    } catch (err) {
      toast?.error?.(err.message || 'Failed to confirm delivery')
    } finally {
      setSaving(false)
    }
  }

  // View detail
  const openViewModal = (dispatch) => {
    setViewModal({ show: true, data: dispatch })
  }

  return (
    <div>
      <PageHeader
        title="Sales Dispatches"
        description="Manage outbound dispatches for AR-side 3-way match"
        actions={
          <Button icon={Plus} onClick={openCreateModal}>
            Create Dispatch
          </Button>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Dispatches', value: stats.total, icon: Package, color: '#C59C82', bg: '#FDF8F4' },
          { label: 'Draft', value: stats.draft, icon: FileText, color: '#9CA3AF', bg: '#F9FAFB' },
          { label: 'Dispatched', value: stats.dispatched, icon: Send, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'In Transit', value: stats.in_transit, icon: Truck, color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: '#22C55E', bg: '#ECFDF5' },
        ].map(stat => (
          <Card key={stat.label} padding="md">
            <Card.Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>
                  {stat.value}
                </div>
              </div>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card padding="md" style={{ marginBottom: '24px' }}>
        <Card.Content style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '200px' }}>
            <Select
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, status: e.target.value }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              placeholder="All Statuses"
            />
          </div>
          <SearchInput
            value={filters.search}
            onChange={(val) => {
              setFilters(prev => ({ ...prev, search: val }))
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            placeholder="Search dispatches..."
            style={{ flex: 1 }}
          />
        </Card.Content>
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : dispatches.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No dispatches found"
            description="Create your first dispatch to start tracking outbound deliveries."
            action={openCreateModal}
            actionLabel="Create Dispatch"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>Dispatch #</Table.Head>
                  <Table.Head>Sales Order</Table.Head>
                  <Table.Head>Customer</Table.Head>
                  <Table.Head>Dispatch Date</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Items</Table.Head>
                  <Table.Head style={{ textAlign: 'right' }}>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {dispatches.map(dispatch => (
                  <Table.Row key={dispatch._id}>
                    <Table.Cell>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>
                        {dispatch.dispatchNumber || dispatch.number || '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ color: '#C59C82', fontWeight: '500' }}>
                        {dispatch.salesOrder?.orderNumber || dispatch.salesOrderNumber || '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {dispatch.customer?.name || dispatch.customerName || '-'}
                    </Table.Cell>
                    <Table.Cell>
                      {formatDate(dispatch.dispatchDate)}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={STATUS_BADGE_MAP[dispatch.status] || 'gray'} dot>
                        {STATUS_LABELS[dispatch.status] || dispatch.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', background: '#f8fafc', borderRadius: '8px',
                        fontSize: '13px', fontWeight: '500', color: '#475569',
                      }}>
                        <Package style={{ width: '14px', height: '14px' }} />
                        {dispatch.lineItems?.length || 0}
                      </span>
                    </Table.Cell>
                    <Table.Cell style={{ textAlign: 'right' }}>
                      <Dropdown
                        align="right"
                        trigger={
                          <button style={{
                            padding: '8px', background: 'none', border: 'none',
                            borderRadius: '10px', cursor: 'pointer', color: '#64748b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <MoreVertical style={{ width: '18px', height: '18px' }} />
                          </button>
                        }
                      >
                        <Dropdown.Item icon={Eye} onClick={() => openViewModal(dispatch)}>
                          View Detail
                        </Dropdown.Item>
                        {dispatch.status === 'draft' && (
                          <>
                            <Dropdown.Item icon={Edit} onClick={() => openEditModal(dispatch)}>
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item icon={Send} onClick={() => markDispatched(dispatch._id)}>
                              Mark as Dispatched
                            </Dropdown.Item>
                          </>
                        )}
                        {(dispatch.status === 'dispatched' || dispatch.status === 'in_transit') && (
                          <>
                            <Dropdown.Divider />
                            <Dropdown.Item icon={CheckCircle} onClick={() => openDeliveryModal(dispatch)}>
                              Confirm Delivery
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modal.show}
        onClose={() => setModal({ show: false, editing: null, data: { ...emptyFormData } })}
        title={modal.editing ? 'Edit Dispatch' : 'Create Dispatch'}
        size="xl"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Sales Order"
              options={salesOrders.map(so => ({
                value: so._id,
                label: so.orderNumber || so.number || so._id,
              }))}
              value={modal.data.salesOrder}
              onChange={(e) => handleSalesOrderChange(e.target.value)}
              placeholder="Select Sales Order"
            />
            <Input
              label="Customer"
              value={modal.data.customer}
              readOnly
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              placeholder="Auto-filled from SO"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Dispatch Date"
              type="date"
              value={modal.data.dispatchDate}
              onChange={(e) => updateFormData('dispatchDate', e.target.value)}
            />
            <Input
              label="Expected Delivery Date"
              type="date"
              value={modal.data.expectedDeliveryDate}
              onChange={(e) => updateFormData('expectedDeliveryDate', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Input
              label="Docket Number"
              value={modal.data.docketNumber}
              onChange={(e) => updateFormData('docketNumber', e.target.value)}
              placeholder="Enter docket number"
            />
            <Input
              label="Vehicle Number"
              value={modal.data.vehicleNumber}
              onChange={(e) => updateFormData('vehicleNumber', e.target.value)}
              placeholder="Enter vehicle number"
            />
            <Input
              label="Transporter Name"
              value={modal.data.transporterName}
              onChange={(e) => updateFormData('transporterName', e.target.value)}
              placeholder="Enter transporter name"
            />
          </div>

          {/* Line Items */}
          {modal.data.lineItems.length > 0 && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                Line Items
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                        Description
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                        Item Code
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                        Ordered Qty
                      </th>
                      <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                        Dispatched Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {modal.data.lineItems.map((item, idx) => (
                      <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', color: '#1e293b' }}>
                          {item.description}
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>
                          {item.itemCode || '-'}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: '#475569' }}>
                          {item.orderedQty}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max={item.orderedQty}
                            value={item.dispatchedQty}
                            onChange={(e) => updateLineItem(idx, 'dispatchedQty', Number(e.target.value))}
                            style={{
                              width: '80px', padding: '6px 10px', fontSize: '13px',
                              border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center',
                              outline: 'none',
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Textarea
            label="Notes"
            value={modal.data.notes}
            onChange={(e) => updateFormData('notes', e.target.value)}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setModal({ show: false, editing: null, data: { ...emptyFormData } })}
          >
            Cancel
          </Button>
          <Button onClick={saveDispatch} loading={saving}>
            {modal.editing ? 'Update Dispatch' : 'Create Dispatch'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={viewModal.show}
        onClose={() => setViewModal({ show: false, data: null })}
        title="Dispatch Details"
        size="lg"
      >
        {viewModal.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <DetailItem label="Dispatch #" value={viewModal.data.dispatchNumber || viewModal.data.number || '-'} />
              <DetailItem label="Status">
                <Badge color={STATUS_BADGE_MAP[viewModal.data.status] || 'gray'} dot>
                  {STATUS_LABELS[viewModal.data.status] || viewModal.data.status}
                </Badge>
              </DetailItem>
              <DetailItem
                label="Sales Order"
                value={viewModal.data.salesOrder?.orderNumber || viewModal.data.salesOrderNumber || '-'}
              />
              <DetailItem
                label="Customer"
                value={viewModal.data.customer?.name || viewModal.data.customerName || '-'}
              />
              <DetailItem label="Dispatch Date" value={formatDate(viewModal.data.dispatchDate)} />
              <DetailItem label="Expected Delivery" value={formatDate(viewModal.data.expectedDeliveryDate)} />
              <DetailItem label="Docket Number" value={viewModal.data.docketNumber || '-'} />
              <DetailItem label="Vehicle Number" value={viewModal.data.vehicleNumber || '-'} />
              <DetailItem label="Transporter" value={viewModal.data.transporterName || '-'} />
            </div>

            {viewModal.data.lineItems?.length > 0 && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  Line Items
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                          Description
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                          Item Code
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                          Ordered
                        </th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                          Dispatched
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewModal.data.lineItems.map((item, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 14px', color: '#1e293b' }}>{item.description}</td>
                          <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.itemCode || '-'}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>{item.orderedQty}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', color: '#C59C82' }}>
                            {item.dispatchedQty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {viewModal.data.notes && (
              <DetailItem label="Notes" value={viewModal.data.notes} />
            )}
          </div>
        )}

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewModal({ show: false, data: null })}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirm Delivery Modal */}
      <Modal
        isOpen={deliveryModal.show}
        onClose={() => setDeliveryModal({ show: false, dispatch: null, items: [] })}
        title="Confirm Delivery"
        description="Enter received quantities for each item"
        size="lg"
      >
        {deliveryModal.dispatch && (
          <div>
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#FDF8F4', borderRadius: '12px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Dispatch: </span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#C59C82' }}>
                {deliveryModal.dispatch.dispatchNumber || deliveryModal.dispatch.number || '-'}
              </span>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                      Description
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                      Dispatched
                    </th>
                    <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                      Received Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryModal.items.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', color: '#1e293b' }}>{item.description}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', color: '#475569' }}>
                        {item.dispatchedQty}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max={item.dispatchedQty}
                          value={item.receivedQty}
                          onChange={(e) => {
                            const items = [...deliveryModal.items]
                            items[idx] = { ...items[idx], receivedQty: Number(e.target.value) }
                            setDeliveryModal(prev => ({ ...prev, items }))
                          }}
                          style={{
                            width: '80px', padding: '6px 10px', fontSize: '13px',
                            border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center',
                            outline: 'none',
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeliveryModal({ show: false, dispatch: null, items: [] })}
          >
            Cancel
          </Button>
          <Button variant="success" icon={CheckCircle} onClick={confirmDelivery} loading={saving}>
            Confirm Delivery
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

// Helper component for detail view
const DetailItem = ({ label, value, children }) => (
  <div>
    <div style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
      {label}
    </div>
    <div style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
      {children || value || '-'}
    </div>
  </div>
)

export default SalesDispatches
