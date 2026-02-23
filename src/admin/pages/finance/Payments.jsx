import { useState, useEffect } from 'react'
import { Plus, MoreVertical, CreditCard, Eye, ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select, Tabs, Modal, Input, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { paymentsAPI, vendorsAPI, customersAPI } from '../../utils/api'

const Payments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ totalReceived: 0, totalMade: 0, netFlow: 0, pendingPayments: 0 })
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vendors, setVendors] = useState([])
  const [customers, setCustomers] = useState([])
  const [formData, setFormData] = useState({
    paymentType: 'incoming',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    purpose: 'invoice_payment',
    referenceNumber: '',
    transactionId: '',
    description: '',
    vendor: '',
    customer: '',
    status: 'completed',
  })

  useEffect(() => {
    loadPayments()
  }, [pagination.page, search, typeFilter, activeTab])

  useEffect(() => {
    loadParties()
  }, [])

  const loadParties = async () => {
    try {
      const [vendorRes, customerRes] = await Promise.all([
        vendorsAPI.getAll({ limit: 200 }),
        customersAPI.getAll({ limit: 200 }),
      ])
      setVendors(vendorRes.data || [])
      setCustomers(customerRes.data || [])
    } catch (err) {
      console.error('Failed to load parties:', err)
    }
  }

  const openRecordModal = () => {
    setFormData({
      paymentType: 'incoming',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      purpose: 'invoice_payment',
      referenceNumber: '',
      transactionId: '',
      description: '',
      vendor: '',
      customer: '',
      status: 'completed',
    })
    setShowRecordModal(true)
  }

  const handleRecordPayment = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    if (formData.paymentType === 'outgoing' && !formData.vendor) {
      alert('Please select a vendor for outgoing payment')
      return
    }
    if (formData.paymentType === 'incoming' && !formData.customer) {
      alert('Please select a customer for incoming payment')
      return
    }
    setSaving(true)
    try {
      const payload = {
        paymentType: formData.paymentType,
        amount: Number(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        purpose: formData.purpose,
        referenceNumber: formData.referenceNumber || undefined,
        transactionId: formData.transactionId || undefined,
        description: formData.description || undefined,
        status: formData.status,
      }
      if (formData.paymentType === 'outgoing' && formData.vendor) {
        payload.vendor = formData.vendor
      }
      if (formData.paymentType === 'incoming' && formData.customer) {
        payload.customer = formData.customer
      }
      await paymentsAPI.create(payload)
      setShowRecordModal(false)
      loadPayments()
    } catch (err) {
      console.error('Failed to record payment:', err)
      alert(err.message || 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  const loadPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search,
        paymentMethod: typeFilter
      }

      // Filter based on tab
      if (activeTab === 'received') {
        params.paymentType = 'incoming'
      } else if (activeTab === 'made') {
        params.paymentType = 'outgoing'
      }

      const response = await paymentsAPI.getAll(params)
      setPayments(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))

      // Set stats from response
      if (response.stats) {
        setStats({
          totalReceived: response.stats.incoming?.total || 0,
          totalMade: response.stats.outgoing?.total || 0,
          netFlow: (response.stats.incoming?.total || 0) - (response.stats.outgoing?.total || 0),
          pendingPayments: response.stats.pending?.count || 0
        })
      }
    } catch (err) {
      console.error('Failed to load payments:', err)
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const paymentMethodLabels = {
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    upi: 'UPI',
    cash: 'Cash',
    card: 'Card',
  }

  const statusColors = {
    pending: 'yellow',
    completed: 'green',
    failed: 'red',
    cancelled: 'gray',
  }

  const statusLabels = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  }

  const tabs = [
    { id: 'all', label: 'All Payments' },
    { id: 'received', label: 'Received' },
    { id: 'made', label: 'Made' },
  ]

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Track all incoming and outgoing payments"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Finance' }, { label: 'Payments' }]}
        actions={<Button icon={Plus} onClick={openRecordModal}>Record Payment</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowDownLeft className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalReceived)}</p>
              <p className="text-sm text-gray-500">Total Received</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalMade)}</p>
              <p className="text-sm text-gray-500">Total Paid</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <Wallet className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.netFlow)}</p>
              <p className="text-sm text-gray-500">Net Cash Flow</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingPayments}</p>
              <p className="text-sm text-gray-500">Pending</p>
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
            placeholder="Search payment, party..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Methods' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'cheque', label: 'Cheque' },
              { value: 'upi', label: 'UPI' },
              { value: 'cash', label: 'Cash' },
              { value: 'card', label: 'Card' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments found"
            description="Record your first payment"
            actionLabel="Record Payment"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Payment #</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Party</Table.Head>
                  <Table.Head>Reference</Table.Head>
                  <Table.Head>Date</Table.Head>
                  <Table.Head>Method</Table.Head>
                  <Table.Head>Amount</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {payments.map((payment) => (
                  <Table.Row key={payment._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{payment.paymentNumber}</p>
                        <p className="text-xs text-gray-500">{payment.transactionId || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${payment.paymentType === 'incoming' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {payment.paymentType === 'incoming' ? (
                            <ArrowDownLeft className={`h-4 w-4 text-green-600`} />
                          ) : (
                            <ArrowUpRight className={`h-4 w-4 text-red-600`} />
                          )}
                        </div>
                        <Badge color={payment.paymentType === 'incoming' ? 'green' : 'red'}>
                          {payment.paymentType === 'incoming' ? 'Received' : 'Paid'}
                        </Badge>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{payment.vendor?.name || payment.customer?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{payment.vendor?.vendorId || payment.customer?.customerId || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{payment.referenceNumber || '-'}</p>
                        <p className="text-xs text-gray-500">{payment.vendorInvoice?.invoiceNumber || payment.customerInvoice?.invoiceNumber || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(payment.paymentDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-600">
                        {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`text-sm font-medium ${payment.paymentType === 'incoming' ? 'text-green-600' : 'text-red-600'}`}>
                        {payment.paymentType === 'incoming' ? '+' : '-'}{formatCurrency(payment.amount)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[payment.status] || 'gray'}>
                        {statusLabels[payment.status] || payment.status}
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record Payment"
        description="Record an incoming or outgoing payment"
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <Select
              label="Payment Type"
              value={formData.paymentType}
              onChange={(e) => setFormData({ ...formData, paymentType: e.target.value, vendor: '', customer: '' })}
              options={[
                { value: 'incoming', label: 'Incoming (Received)' },
                { value: 'outgoing', label: 'Outgoing (Paid)' },
              ]}
            />
          </div>
          <div>
            <Input
              label="Amount (INR)"
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Payment Date"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
            />
          </div>
          <div>
            <Select
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              options={[
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'upi', label: 'UPI' },
                { value: 'cash', label: 'Cash' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'card', label: 'Card' },
                { value: 'dd', label: 'Demand Draft' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
          <div>
            {formData.paymentType === 'incoming' ? (
              <Select
                label="Customer"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                options={[
                  { value: '', label: 'Select Customer...' },
                  ...customers.map(c => ({ value: c._id, label: c.name || c.customerId }))
                ]}
              />
            ) : (
              <Select
                label="Vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                options={[
                  { value: '', label: 'Select Vendor...' },
                  ...vendors.map(v => ({ value: v._id, label: v.name || v.vendorId }))
                ]}
              />
            )}
          </div>
          <div>
            <Select
              label="Purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              options={[
                { value: 'invoice_payment', label: 'Invoice Payment' },
                { value: 'advance', label: 'Advance' },
                { value: 'refund', label: 'Refund' },
                { value: 'deposit', label: 'Deposit' },
                { value: 'expense', label: 'Expense' },
                { value: 'salary', label: 'Salary' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </div>
          <div>
            <Input
              label="Reference Number"
              placeholder="e.g. INV-001"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Transaction ID"
              placeholder="e.g. UTR number"
              value={formData.transactionId}
              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea
              label="Description"
              placeholder="Payment notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'completed', label: 'Completed' },
                { value: 'pending', label: 'Pending' },
                { value: 'processing', label: 'Processing' },
              ]}
            />
          </div>
        </div>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRecordModal(false)}>Cancel</Button>
          <Button onClick={handleRecordPayment} disabled={saving}>
            {saving ? 'Saving...' : 'Record Payment'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Payments
