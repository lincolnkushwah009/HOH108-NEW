import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Receipt, Eye, CheckCircle, AlertTriangle, IndianRupee } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { vendorInvoicesAPI } from '../../utils/api'

const VendorInvoices = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [stats, setStats] = useState({ total: 0, totalValue: 0, pending: 0, overdue: 0 })
  const [paymentModal, setPaymentModal] = useState({ open: false, invoice: null })
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentMethod: 'bank_transfer', referenceNumber: '', paymentDate: new Date().toISOString().split('T')[0] })
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [detailModal, setDetailModal] = useState({ open: false, invoice: null })

  useEffect(() => {
    loadInvoices()
  }, [pagination.page, search, statusFilter, paymentStatusFilter])

  const loadInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await vendorInvoicesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        paymentStatus: paymentStatusFilter
      })
      setInvoices(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 1
      }))
      // Calculate stats from response
      if (response.stats) {
        const statsMap = {}
        response.stats.forEach(s => { statsMap[s._id] = s })
        setStats({
          total: response.pagination?.total || 0,
          totalValue: Object.values(statsMap).reduce((sum, s) => sum + (s.total || 0), 0),
          pending: statsMap['unpaid']?.total || 0,
          overdue: statsMap['overdue']?.total || 0
        })
      }
    } catch (err) {
      console.error('Failed to load invoices:', err)
      setError('Failed to load vendor invoices')
    } finally {
      setLoading(false)
    }
  }

  const paymentStatusColors = {
    unpaid: 'yellow',
    partially_paid: 'blue',
    paid: 'green',
    overdue: 'red',
  }

  const paymentStatusLabels = {
    unpaid: 'Unpaid',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    overdue: 'Overdue',
  }

  const statusColors = {
    draft: 'gray',
    pending_verification: 'yellow',
    verified: 'blue',
    approved: 'green',
    rejected: 'red',
    cancelled: 'gray',
  }

  const statusLabels = {
    draft: 'Draft',
    pending_verification: 'Pending Verification',
    verified: 'Verified',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  }

  const openPaymentModal = (invoice) => {
    setPaymentForm({
      amount: (invoice.grandTotal - (invoice.paidAmount || 0)).toString(),
      paymentMethod: 'bank_transfer',
      referenceNumber: '',
      paymentDate: new Date().toISOString().split('T')[0]
    })
    setPaymentModal({ open: true, invoice })
  }

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || !paymentForm.referenceNumber) {
      alert('Please fill all required fields')
      return
    }
    setPaymentLoading(true)
    try {
      await vendorInvoicesAPI.recordPayment(paymentModal.invoice._id, {
        paymentDate: paymentForm.paymentDate,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber
      })
      setPaymentModal({ open: false, invoice: null })
      loadInvoices()
    } catch (err) {
      console.error('Failed to record payment:', err)
      alert('Failed to record payment')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await vendorInvoicesAPI.approve(id)
      loadInvoices()
    } catch (err) {
      console.error('Failed to approve invoice:', err)
    }
  }

  return (
    <div>
      <PageHeader
        title="Vendor Invoices"
        description="Manage vendor invoices and 3-way matching"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Procurement' }, { label: 'Vendor Invoices' }]}
        actions={<Button icon={Plus} onClick={() => navigate('/admin/vendor-invoices/new')}>Add Invoice</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <Receipt className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Invoices</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <IndianRupee className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Receipt className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.pending)}</p>
              <p className="text-sm text-gray-500">Pending Payment</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.overdue)}</p>
              <p className="text-sm text-gray-500">Overdue</p>
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
            placeholder="Search invoice, vendor..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'pending_verification', label: 'Pending Verification' },
              { value: 'verified', label: 'Verified' },
              { value: 'approved', label: 'Approved' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
          <Select
            options={[
              { value: '', label: 'All Payment Status' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'partially_paid', label: 'Partially Paid' },
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue' },
            ]}
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No invoices found"
            description="Add vendor invoices for payment processing"
            action={() => navigate('/admin/vendor-invoices/new')}
            actionLabel="Add Invoice"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Invoice #</Table.Head>
                  <Table.Head>Vendor</Table.Head>
                  <Table.Head>PO Ref</Table.Head>
                  <Table.Head>Invoice Date</Table.Head>
                  <Table.Head>Due Date</Table.Head>
                  <Table.Head>Amount</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Payment</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {invoices.map((invoice) => (
                  <Table.Row key={invoice._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">{invoice.vendorInvoiceNumber || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm text-gray-900">{invoice.vendor?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{invoice.vendor?.vendorId || ''}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <p className="text-sm text-gray-900">{invoice.purchaseOrder?.poNumber || '-'}</p>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(invoice.invoiceDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className={`text-sm ${invoice.paymentStatus === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {formatDate(invoice.dueDate)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(invoice.grandTotal)}</p>
                        <p className="text-xs text-gray-500">Tax: {formatCurrency(invoice.totalTax || 0)}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[invoice.status] || 'gray'}>
                        {statusLabels[invoice.status] || invoice.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Badge color={paymentStatusColors[invoice.paymentStatus] || 'gray'}>
                          {paymentStatusLabels[invoice.paymentStatus] || invoice.paymentStatus}
                        </Badge>
                        {invoice.status === 'approved' && invoice.paymentStatus !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => openPaymentModal(invoice)}
                          >
                            Pay
                          </Button>
                        )}
                      </div>
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
                        <Dropdown.Item icon={Eye} onClick={() => setDetailModal({ open: true, invoice })}>
                          View Details
                        </Dropdown.Item>
                        {invoice.status === 'verified' && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => handleApprove(invoice._id)}>Approve</Dropdown.Item>
                        )}
                        {invoice.status === 'approved' && invoice.paymentStatus !== 'paid' && (
                          <Dropdown.Item icon={IndianRupee} onClick={() => openPaymentModal(invoice)}>Record Payment</Dropdown.Item>
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

      {/* Payment Modal */}
      <Modal
        isOpen={paymentModal.open}
        onClose={() => setPaymentModal({ open: false, invoice: null })}
        title="Record Payment"
        size="md"
      >
        {paymentModal.invoice && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Invoice Number</p>
                  <p className="font-medium">{paymentModal.invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vendor</p>
                  <p className="font-medium">{paymentModal.invoice.vendor.vendorName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Invoice Amount</p>
                  <p className="font-medium">{formatCurrency(paymentModal.invoice.netAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Balance Due</p>
                  <p className="font-medium text-orange-600">{formatCurrency(paymentModal.invoice.netAmount - paymentModal.invoice.paidAmount)}</p>
                </div>
              </div>
            </div>

            <Input
              label="Payment Amount *"
              type="number"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              placeholder="Enter payment amount"
            />

            <Select
              label="Payment Method *"
              options={[
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'cash', label: 'Cash' },
                { value: 'upi', label: 'UPI' },
                { value: 'card', label: 'Card' },
              ]}
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
            />

            <Input
              label="Reference Number *"
              value={paymentForm.referenceNumber}
              onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
              placeholder="Enter transaction reference"
            />

            <Input
              label="Payment Date *"
              type="date"
              value={paymentForm.paymentDate}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setPaymentModal({ open: false, invoice: null })}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} loading={paymentLoading}>
                Record Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, invoice: null })}
        title="Invoice Details"
        size="lg"
      >
        {detailModal.invoice && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{detailModal.invoice.invoiceNumber}</h3>
                <p className="text-sm text-gray-500">Invoice Date: {formatDate(detailModal.invoice.invoiceDate)}</p>
              </div>
              <div className="flex gap-2">
                <Badge color={matchingStatusColors[detailModal.invoice.matchingStatus] || 'gray'}>
                  {detailModal.invoice.matchingStatus}
                </Badge>
                <Badge color={paymentStatusColors[detailModal.invoice.paymentStatus] || 'gray'}>
                  {detailModal.invoice.paymentStatus}
                </Badge>
              </div>
            </div>

            {/* Vendor Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Vendor Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Vendor Name</p>
                  <p className="font-medium">{detailModal.invoice.vendor.vendorName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vendor Code</p>
                  <p className="font-medium">{detailModal.invoice.vendor.vendorCode}</p>
                </div>
              </div>
            </div>

            {/* Reference Documents */}
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Reference Documents</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Purchase Order</p>
                  <p className="font-medium text-amber-700">{detailModal.invoice.purchaseOrder.poNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Goods Receipt Note</p>
                  <p className="font-medium text-amber-700">{detailModal.invoice.grn.grnNumber}</p>
                </div>
              </div>
            </div>

            {/* Amount Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Amount Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Amount</span>
                  <span className="font-medium">{formatCurrency(detailModal.invoice.invoiceAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax Amount</span>
                  <span className="font-medium">{formatCurrency(detailModal.invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-700 font-medium">Net Amount</span>
                  <span className="font-semibold text-lg">{formatCurrency(detailModal.invoice.netAmount)}</span>
                </div>
                {detailModal.invoice.paidAmount > 0 && (
                  <>
                    <div className="flex justify-between text-green-600">
                      <span>Paid Amount</span>
                      <span className="font-medium">{formatCurrency(detailModal.invoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>Balance Due</span>
                      <span className="font-medium">{formatCurrency(detailModal.invoice.netAmount - detailModal.invoice.paidAmount)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Variance Info */}
            {detailModal.invoice.matchingVariance > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-red-700 mb-3">Variance Details</h4>
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Variance Amount</span>
                    <span className="font-medium text-red-600">{formatCurrency(detailModal.invoice.matchingVariance)}</span>
                  </div>
                  {detailModal.invoice.varianceReason && (
                    <div>
                      <span className="text-gray-500">Reason: </span>
                      <span className="text-gray-700">{detailModal.invoice.varianceReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Info */}
            {detailModal.invoice.paymentStatus === 'FullyPaid' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-700 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Payment Date</p>
                    <p className="font-medium">{formatDate(detailModal.invoice.paymentDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment Mode</p>
                    <p className="font-medium">{detailModal.invoice.paymentMode}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Reference</p>
                    <p className="font-medium">{detailModal.invoice.paymentReference}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Due Date */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Due Date</span>
              <span className={`font-medium ${detailModal.invoice.paymentStatus === 'Overdue' ? 'text-red-600' : 'text-gray-700'}`}>
                {formatDate(detailModal.invoice.dueDate)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setDetailModal({ open: false, invoice: null })}>
                Close
              </Button>
              {detailModal.invoice.matchingStatus === 'Matched' && detailModal.invoice.paymentStatus !== 'FullyPaid' && (
                <Button onClick={() => {
                  setDetailModal({ open: false, invoice: null })
                  openPaymentModal(detailModal.invoice)
                }}>
                  Record Payment
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default VendorInvoices
