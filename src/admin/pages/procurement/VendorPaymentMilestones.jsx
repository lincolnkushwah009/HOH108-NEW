import { useState, useEffect, useCallback } from 'react'
import {
  Plus, MoreVertical, DollarSign, Clock, CheckCircle, AlertTriangle,
  CreditCard, Eye, Edit, Layers, Percent, Calendar, Banknote,
  FileText, Building2
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

const STATUS_BADGE_MAP = {
  pending: 'yellow',
  partially_paid: 'blue',
  paid: 'green',
  overdue: 'red',
  cancelled: 'gray',
}

const STATUS_LABELS = {
  pending: 'Pending',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

const TYPE_OPTIONS = [
  { value: 'advance', label: 'Advance' },
  { value: 'material_delivery', label: 'Material Delivery' },
  { value: 'installation_complete', label: 'Installation Complete' },
  { value: 'retention_release', label: 'Retention Release' },
  { value: 'final_payment', label: 'Final Payment' },
  { value: 'custom', label: 'Custom' },
]

const TYPE_LABELS = {
  advance: 'Advance',
  material_delivery: 'Material Delivery',
  installation_complete: 'Installation Complete',
  retention_release: 'Retention Release',
  final_payment: 'Final Payment',
  custom: 'Custom',
}

const TRIGGER_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'grn_received', label: 'GRN Received' },
  { value: 'date_based', label: 'Date Based' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
]

const emptyFormData = {
  vendor: '',
  purchaseOrder: '',
  project: '',
  name: '',
  type: 'advance',
  percentage: '',
  amount: '',
  gst: '',
  dueDate: '',
  triggerCondition: 'manual',
  notes: '',
}

const emptyPaymentData = {
  amount: '',
  paymentDate: '',
  paymentMethod: 'bank_transfer',
  referenceNumber: '',
  remarks: '',
}

const emptyDefaultsData = {
  vendor: '',
  purchaseOrder: '',
  project: '',
  totalAmount: '',
  gstRate: 18,
}

const VendorPaymentMilestones = () => {
  const toast = useToast()

  // Data state
  const [milestones, setMilestones] = useState([])
  const [vendors, setVendors] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Filter state
  const [filters, setFilters] = useState({ vendor: '', status: '', project: '' })
  const [pagination, setPagination] = useState({
    page: 1, limit: 10, total: 0, totalPages: 0,
  })

  // Modal state
  const [modal, setModal] = useState({ show: false, editing: null, data: { ...emptyFormData } })
  const [paymentModal, setPaymentModal] = useState({ show: false, milestone: null, data: { ...emptyPaymentData } })
  const [defaultsModal, setDefaultsModal] = useState({ show: false, data: { ...emptyDefaultsData } })

  // Load milestones
  const loadMilestones = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (filters.vendor) params.vendor = filters.vendor
      if (filters.status) params.status = filters.status
      if (filters.project) params.project = filters.project

      const res = await apiRequest('/vendor-payment-milestones?' + new URLSearchParams(params))
      setMilestones(res.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.pages || 1,
      }))
    } catch (err) {
      toast?.error?.(err.message || 'Failed to load milestones')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, filters.vendor, filters.status, filters.project])

  useEffect(() => {
    loadMilestones()
  }, [loadMilestones])

  // Load supporting data
  const loadSupportingData = async () => {
    try {
      const [vendorsRes, posRes, projectsRes] = await Promise.allSettled([
        apiRequest('/vendors?limit=500', { _suppressRedirect: true }),
        apiRequest('/purchase-orders?limit=500', { _suppressRedirect: true }),
        apiRequest('/projects?limit=500', { _suppressRedirect: true }),
      ])
      if (vendorsRes.status === 'fulfilled') setVendors(vendorsRes.value.data || [])
      if (posRes.status === 'fulfilled') setPurchaseOrders(posRes.value.data || [])
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data || [])
    } catch (err) {
      console.error('Failed to load supporting data:', err)
    }
  }

  useEffect(() => {
    loadSupportingData()
  }, [])

  // Computed stats
  const stats = {
    total: pagination.total || milestones.length,
    pendingAmount: milestones.reduce((sum, m) => {
      const total = (Number(m.amount) || 0) + (Number(m.gst) || 0)
      const paid = Number(m.paidAmount) || 0
      return sum + Math.max(0, total - paid)
    }, 0),
    paidAmount: milestones.reduce((sum, m) => sum + (Number(m.paidAmount) || 0), 0),
    overdue: milestones.filter(m => m.status === 'overdue').length,
  }

  // Filter purchase orders by selected vendor
  const filteredPOs = modal.data.vendor
    ? purchaseOrders.filter(po =>
        (po.vendor?._id || po.vendor) === modal.data.vendor
      )
    : purchaseOrders

  const defaultsFilteredPOs = defaultsModal.data.vendor
    ? purchaseOrders.filter(po =>
        (po.vendor?._id || po.vendor) === defaultsModal.data.vendor
      )
    : purchaseOrders

  // Open create modal
  const openCreateModal = () => {
    setModal({ show: true, editing: null, data: { ...emptyFormData } })
  }

  // Open edit modal
  const openEditModal = (milestone) => {
    setModal({
      show: true,
      editing: milestone._id,
      data: {
        vendor: milestone.vendor?._id || milestone.vendor || '',
        purchaseOrder: milestone.purchaseOrder?._id || milestone.purchaseOrder || '',
        project: milestone.project?._id || milestone.project || '',
        name: milestone.name || '',
        type: milestone.type || 'advance',
        percentage: milestone.percentage || '',
        amount: milestone.amount || '',
        gst: milestone.gst || '',
        dueDate: milestone.dueDate ? milestone.dueDate.split('T')[0] : '',
        triggerCondition: milestone.triggerCondition || 'manual',
        notes: milestone.notes || '',
      },
    })
  }

  // Update form data
  const updateFormData = (field, value) => {
    setModal(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
    }))
  }

  // Save milestone
  const saveMilestone = async () => {
    if (!modal.data.vendor) {
      toast?.error?.('Please select a vendor')
      return
    }
    if (!modal.data.name) {
      toast?.error?.('Please enter a milestone name')
      return
    }
    if (!modal.data.amount) {
      toast?.error?.('Please enter an amount')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...modal.data,
        amount: Number(modal.data.amount),
        gst: Number(modal.data.gst) || 0,
        percentage: Number(modal.data.percentage) || 0,
      }

      if (modal.editing) {
        await apiRequest(`/vendor-payment-milestones/${modal.editing}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        toast?.success?.('Milestone updated successfully')
      } else {
        await apiRequest('/vendor-payment-milestones', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        toast?.success?.('Milestone created successfully')
      }
      setModal({ show: false, editing: null, data: { ...emptyFormData } })
      loadMilestones()
    } catch (err) {
      toast?.error?.(err.message || 'Failed to save milestone')
    } finally {
      setSaving(false)
    }
  }

  // Open payment modal
  const openPaymentModal = (milestone) => {
    setPaymentModal({
      show: true,
      milestone,
      data: {
        ...emptyPaymentData,
        paymentDate: new Date().toISOString().split('T')[0],
      },
    })
  }

  // Record payment
  const recordPayment = async () => {
    const { milestone, data } = paymentModal
    if (!data.amount || Number(data.amount) <= 0) {
      toast?.error?.('Please enter a valid amount')
      return
    }
    if (!data.paymentDate) {
      toast?.error?.('Please enter a payment date')
      return
    }

    const totalDue = (Number(milestone.amount) || 0) + (Number(milestone.gst) || 0)
    const alreadyPaid = Number(milestone.paidAmount) || 0
    const pending = totalDue - alreadyPaid

    if (Number(data.amount) > pending) {
      toast?.error?.(`Amount cannot exceed pending amount of ${formatCurrency(pending)}`)
      return
    }

    setSaving(true)
    try {
      await apiRequest(`/vendor-payment-milestones/${milestone._id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          amount: Number(data.amount),
        }),
      })
      toast?.success?.('Payment recorded successfully')
      setPaymentModal({ show: false, milestone: null, data: { ...emptyPaymentData } })
      loadMilestones()
    } catch (err) {
      toast?.error?.(err.message || 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  // Open defaults modal
  const openDefaultsModal = () => {
    setDefaultsModal({ show: true, data: { ...emptyDefaultsData } })
  }

  // Create default set
  const createDefaultSet = async () => {
    const { data } = defaultsModal
    if (!data.vendor) {
      toast?.error?.('Please select a vendor')
      return
    }
    if (!data.totalAmount || Number(data.totalAmount) <= 0) {
      toast?.error?.('Please enter a valid total amount')
      return
    }

    setSaving(true)
    try {
      await apiRequest('/vendor-payment-milestones/create-defaults', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          totalAmount: Number(data.totalAmount),
          gstRate: Number(data.gstRate) || 18,
        }),
      })
      toast?.success?.('Default milestone set created successfully')
      setDefaultsModal({ show: false, data: { ...emptyDefaultsData } })
      loadMilestones()
    } catch (err) {
      toast?.error?.(err.message || 'Failed to create default set')
    } finally {
      setSaving(false)
    }
  }

  // Compute paid percentage for progress bar
  const getPaidPercent = (milestone) => {
    const total = (Number(milestone.amount) || 0) + (Number(milestone.gst) || 0)
    const paid = Number(milestone.paidAmount) || 0
    if (total === 0) return 0
    return Math.min(100, Math.round((paid / total) * 100))
  }

  const getPendingAmount = (milestone) => {
    const total = (Number(milestone.amount) || 0) + (Number(milestone.gst) || 0)
    const paid = Number(milestone.paidAmount) || 0
    return Math.max(0, total - paid)
  }

  return (
    <div>
      <PageHeader
        title="Vendor Payment Milestones"
        description="Track AP payment milestones per vendor / PO"
        actions={
          <>
            <Button variant="outline" icon={Layers} onClick={openDefaultsModal}>
              Create Default Set
            </Button>
            <Button icon={Plus} onClick={openCreateModal}>
              Create Milestone
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Milestones', value: stats.total, icon: FileText, color: '#C59C82', bg: '#FDF8F4', isCurrency: false },
          { label: 'Pending Amount', value: formatCurrency(stats.pendingAmount), icon: Clock, color: '#F59E0B', bg: '#FFFBEB', isCurrency: true },
          { label: 'Paid Amount', value: formatCurrency(stats.paidAmount), icon: CheckCircle, color: '#22C55E', bg: '#ECFDF5', isCurrency: true },
          { label: 'Overdue Count', value: stats.overdue, icon: AlertTriangle, color: '#EF4444', bg: '#FEF2F2', isCurrency: false },
        ].map(stat => (
          <Card key={stat.label} padding="md">
            <Card.Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: stat.isCurrency ? '20px' : '24px',
                  fontWeight: '700', color: '#1e293b',
                }}>
                  {stat.isCurrency ? stat.value : stat.value}
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
          <div style={{ width: '220px' }}>
            <Select
              options={vendors.map(v => ({ value: v._id, label: v.name || v.companyName || v._id }))}
              value={filters.vendor}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, vendor: e.target.value }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              placeholder="All Vendors"
            />
          </div>
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
          <div style={{ width: '220px' }}>
            <Select
              options={projects.map(p => ({ value: p._id, label: p.name || p.projectName || p._id }))}
              value={filters.project}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, project: e.target.value }))
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              placeholder="All Projects"
            />
          </div>
        </Card.Content>
      </Card>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : milestones.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No milestones found"
            description="Create payment milestones to track vendor payments."
            action={openCreateModal}
            actionLabel="Create Milestone"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>ID</Table.Head>
                  <Table.Head>Name</Table.Head>
                  <Table.Head>Vendor</Table.Head>
                  <Table.Head>PO #</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head style={{ textAlign: 'right' }}>Amount</Table.Head>
                  <Table.Head style={{ textAlign: 'right' }}>GST</Table.Head>
                  <Table.Head style={{ textAlign: 'right' }}>Total</Table.Head>
                  <Table.Head style={{ textAlign: 'right' }}>Paid</Table.Head>
                  <Table.Head style={{ textAlign: 'right' }}>Pending</Table.Head>
                  <Table.Head>Due Date</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head style={{ textAlign: 'right' }}>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {milestones.map(milestone => {
                  const total = (Number(milestone.amount) || 0) + (Number(milestone.gst) || 0)
                  const paidPercent = getPaidPercent(milestone)
                  const pendingAmt = getPendingAmount(milestone)

                  return (
                    <Table.Row key={milestone._id}>
                      <Table.Cell>
                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>
                          {milestone.milestoneId || milestone.number || milestone._id?.slice(-6)?.toUpperCase() || '-'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1e293b' }}>
                            {milestone.name || '-'}
                          </div>
                          {/* Progress bar */}
                          <div style={{
                            marginTop: '6px', width: '100px', height: '4px',
                            background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${paidPercent}%`, height: '100%',
                              background: '#22C55E', borderRadius: '2px',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {paidPercent}% paid
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: '#FDF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Building2 style={{ width: '16px', height: '16px', color: '#C59C82' }} />
                          </div>
                          <span style={{ fontSize: '13px' }}>
                            {milestone.vendor?.name || milestone.vendor?.companyName || milestone.vendorName || '-'}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ color: '#C59C82', fontWeight: '500', fontSize: '13px' }}>
                          {milestone.purchaseOrder?.poNumber || milestone.purchaseOrder?.number || milestone.poNumber || '-'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="purple" size="sm">
                          {TYPE_LABELS[milestone.type] || milestone.type || '-'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell style={{ textAlign: 'right', fontWeight: '500' }}>
                        {formatCurrency(milestone.amount || 0)}
                      </Table.Cell>
                      <Table.Cell style={{ textAlign: 'right', color: '#64748b', fontSize: '13px' }}>
                        {formatCurrency(milestone.gst || 0)}
                      </Table.Cell>
                      <Table.Cell style={{ textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                        {formatCurrency(total)}
                      </Table.Cell>
                      <Table.Cell style={{ textAlign: 'right', fontWeight: '500', color: '#22C55E' }}>
                        {formatCurrency(milestone.paidAmount || 0)}
                      </Table.Cell>
                      <Table.Cell style={{ textAlign: 'right', fontWeight: '500', color: pendingAmt > 0 ? '#F59E0B' : '#64748b' }}>
                        {formatCurrency(pendingAmt)}
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ fontSize: '13px' }}>
                          {formatDate(milestone.dueDate)}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={STATUS_BADGE_MAP[milestone.status] || 'gray'} dot>
                          {STATUS_LABELS[milestone.status] || milestone.status}
                        </Badge>
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
                          <Dropdown.Item icon={Eye} onClick={() => openEditModal(milestone)}>
                            View / Edit
                          </Dropdown.Item>
                          {milestone.status !== 'paid' && milestone.status !== 'cancelled' && (
                            <>
                              <Dropdown.Divider />
                              <Dropdown.Item icon={Banknote} onClick={() => openPaymentModal(milestone)}>
                                Record Payment
                              </Dropdown.Item>
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

      {/* Create / Edit Milestone Modal */}
      <Modal
        isOpen={modal.show}
        onClose={() => setModal({ show: false, editing: null, data: { ...emptyFormData } })}
        title={modal.editing ? 'Edit Milestone' : 'Create Milestone'}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Vendor"
              options={vendors.map(v => ({
                value: v._id,
                label: v.name || v.companyName || v._id,
              }))}
              value={modal.data.vendor}
              onChange={(e) => {
                updateFormData('vendor', e.target.value)
                updateFormData('purchaseOrder', '')
              }}
              placeholder="Select Vendor"
            />
            <Select
              label="Purchase Order"
              options={filteredPOs.map(po => ({
                value: po._id,
                label: po.poNumber || po.number || po._id,
              }))}
              value={modal.data.purchaseOrder}
              onChange={(e) => updateFormData('purchaseOrder', e.target.value)}
              placeholder="Select PO"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Project"
              options={projects.map(p => ({
                value: p._id,
                label: p.name || p.projectName || p._id,
              }))}
              value={modal.data.project}
              onChange={(e) => updateFormData('project', e.target.value)}
              placeholder="Select Project (optional)"
            />
            <Input
              label="Name"
              value={modal.data.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="e.g. Advance Payment"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Type"
              options={TYPE_OPTIONS}
              value={modal.data.type}
              onChange={(e) => updateFormData('type', e.target.value)}
            />
            <Select
              label="Trigger Condition"
              options={TRIGGER_OPTIONS}
              value={modal.data.triggerCondition}
              onChange={(e) => updateFormData('triggerCondition', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <Input
              label="Percentage (%)"
              type="number"
              min="0"
              max="100"
              value={modal.data.percentage}
              onChange={(e) => updateFormData('percentage', e.target.value)}
              placeholder="e.g. 10"
            />
            <Input
              label="Amount"
              type="number"
              min="0"
              value={modal.data.amount}
              onChange={(e) => updateFormData('amount', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="GST"
              type="number"
              min="0"
              value={modal.data.gst}
              onChange={(e) => updateFormData('gst', e.target.value)}
              placeholder="0.00"
            />
          </div>

          <Input
            label="Due Date"
            type="date"
            value={modal.data.dueDate}
            onChange={(e) => updateFormData('dueDate', e.target.value)}
          />

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
          <Button onClick={saveMilestone} loading={saving}>
            {modal.editing ? 'Update Milestone' : 'Create Milestone'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={paymentModal.show}
        onClose={() => setPaymentModal({ show: false, milestone: null, data: { ...emptyPaymentData } })}
        title="Record Payment"
        description={paymentModal.milestone ? `Payment for: ${paymentModal.milestone.name || '-'}` : ''}
        size="md"
      >
        {paymentModal.milestone && (() => {
          const ms = paymentModal.milestone
          const total = (Number(ms.amount) || 0) + (Number(ms.gst) || 0)
          const paid = Number(ms.paidAmount) || 0
          const pending = Math.max(0, total - paid)

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary strip */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px', padding: '14px 16px', background: '#f8fafc',
                borderRadius: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>
                    {formatCurrency(total)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Paid
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#22C55E', marginTop: '2px' }}>
                    {formatCurrency(paid)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pending
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#F59E0B', marginTop: '2px' }}>
                    {formatCurrency(pending)}
                  </div>
                </div>
              </div>

              <Input
                label="Amount"
                type="number"
                min="0"
                max={pending}
                value={paymentModal.data.amount}
                onChange={(e) => setPaymentModal(prev => ({
                  ...prev,
                  data: { ...prev.data, amount: e.target.value },
                }))}
                placeholder={`Max: ${formatCurrency(pending)}`}
                helper={`Maximum payable: ${formatCurrency(pending)}`}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  label="Payment Date"
                  type="date"
                  value={paymentModal.data.paymentDate}
                  onChange={(e) => setPaymentModal(prev => ({
                    ...prev,
                    data: { ...prev.data, paymentDate: e.target.value },
                  }))}
                />
                <Select
                  label="Payment Method"
                  options={PAYMENT_METHOD_OPTIONS}
                  value={paymentModal.data.paymentMethod}
                  onChange={(e) => setPaymentModal(prev => ({
                    ...prev,
                    data: { ...prev.data, paymentMethod: e.target.value },
                  }))}
                />
              </div>

              <Input
                label="Reference Number"
                value={paymentModal.data.referenceNumber}
                onChange={(e) => setPaymentModal(prev => ({
                  ...prev,
                  data: { ...prev.data, referenceNumber: e.target.value },
                }))}
                placeholder="Transaction / cheque reference"
              />

              <Textarea
                label="Remarks"
                value={paymentModal.data.remarks}
                onChange={(e) => setPaymentModal(prev => ({
                  ...prev,
                  data: { ...prev.data, remarks: e.target.value },
                }))}
                placeholder="Payment remarks..."
                rows={2}
              />
            </div>
          )
        })()}

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setPaymentModal({ show: false, milestone: null, data: { ...emptyPaymentData } })}
          >
            Cancel
          </Button>
          <Button variant="success" icon={Banknote} onClick={recordPayment} loading={saving}>
            Record Payment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Create Default Set Modal */}
      <Modal
        isOpen={defaultsModal.show}
        onClose={() => setDefaultsModal({ show: false, data: { ...emptyDefaultsData } })}
        title="Create Default Milestone Set"
        description="Creates 5 standard milestones: Advance 10%, Material Delivery 40%, Installation Complete 30%, Retention Release 10%, Final Payment 10%"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Vendor"
            options={vendors.map(v => ({
              value: v._id,
              label: v.name || v.companyName || v._id,
            }))}
            value={defaultsModal.data.vendor}
            onChange={(e) => setDefaultsModal(prev => ({
              ...prev,
              data: { ...prev.data, vendor: e.target.value, purchaseOrder: '' },
            }))}
            placeholder="Select Vendor"
          />

          <Select
            label="Purchase Order"
            options={defaultsFilteredPOs.map(po => ({
              value: po._id,
              label: po.poNumber || po.number || po._id,
            }))}
            value={defaultsModal.data.purchaseOrder}
            onChange={(e) => setDefaultsModal(prev => ({
              ...prev,
              data: { ...prev.data, purchaseOrder: e.target.value },
            }))}
            placeholder="Select PO (optional)"
          />

          <Select
            label="Project"
            options={projects.map(p => ({
              value: p._id,
              label: p.name || p.projectName || p._id,
            }))}
            value={defaultsModal.data.project}
            onChange={(e) => setDefaultsModal(prev => ({
              ...prev,
              data: { ...prev.data, project: e.target.value },
            }))}
            placeholder="Select Project (optional)"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Total Amount"
              type="number"
              min="0"
              value={defaultsModal.data.totalAmount}
              onChange={(e) => setDefaultsModal(prev => ({
                ...prev,
                data: { ...prev.data, totalAmount: e.target.value },
              }))}
              placeholder="0.00"
            />
            <Input
              label="GST Rate (%)"
              type="number"
              min="0"
              max="100"
              value={defaultsModal.data.gstRate}
              onChange={(e) => setDefaultsModal(prev => ({
                ...prev,
                data: { ...prev.data, gstRate: e.target.value },
              }))}
              placeholder="18"
            />
          </div>

          {/* Preview of milestones */}
          {defaultsModal.data.totalAmount > 0 && (
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#475569', marginBottom: '8px' }}>
                Preview
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                        Milestone
                      </th>
                      <th style={{ padding: '8px 14px', textAlign: 'center', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                        %
                      </th>
                      <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                        Amount
                      </th>
                      <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                        GST
                      </th>
                      <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '12px' }}>
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Advance', pct: 10 },
                      { name: 'Material Delivery', pct: 40 },
                      { name: 'Installation Complete', pct: 30 },
                      { name: 'Retention Release', pct: 10 },
                      { name: 'Final Payment', pct: 10 },
                    ].map(item => {
                      const amt = (Number(defaultsModal.data.totalAmount) * item.pct) / 100
                      const gstAmt = (amt * (Number(defaultsModal.data.gstRate) || 18)) / 100
                      return (
                        <tr key={item.name} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 14px', color: '#1e293b' }}>{item.name}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'center', color: '#C59C82', fontWeight: '600' }}>
                            {item.pct}%
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', color: '#475569' }}>
                            {formatCurrency(amt)}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', color: '#64748b' }}>
                            {formatCurrency(gstAmt)}
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                            {formatCurrency(amt + gstAmt)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDefaultsModal({ show: false, data: { ...emptyDefaultsData } })}
          >
            Cancel
          </Button>
          <Button icon={Layers} onClick={createDefaultSet} loading={saving}>
            Create Default Set
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default VendorPaymentMilestones
