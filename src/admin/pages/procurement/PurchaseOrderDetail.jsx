import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle,
  XCircle,
  Edit,
  Truck,
  Clock,
  FileText,
} from 'lucide-react'
import { purchaseOrdersAPI } from '../../utils/api'
import { Button, Badge, Modal } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'

const PurchaseOrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin'

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await purchaseOrdersAPI.getOne(id)
      setOrder(response.data)
    } catch (err) {
      console.error('Failed to load order:', err)
      setError('Failed to load purchase order')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await purchaseOrdersAPI.submit(id)
      loadOrder()
    } catch (err) {
      console.error('Failed to submit:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await purchaseOrdersAPI.approve(id)
      loadOrder()
    } catch (err) {
      console.error('Failed to approve:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (e) => {
    e.preventDefault()
    if (!rejectReason.trim()) return
    setSubmitting(true)
    try {
      await purchaseOrdersAPI.reject(id, rejectReason)
      setShowRejectModal(false)
      setRejectReason('')
      loadOrder()
    } catch (err) {
      console.error('Failed to reject:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await purchaseOrdersAPI.cancel(id, cancelReason)
      setShowCancelModal(false)
      setCancelReason('')
      loadOrder()
    } catch (err) {
      console.error('Failed to cancel:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendToVendor = async () => {
    setSubmitting(true)
    try {
      await purchaseOrdersAPI.send(id)
      loadOrder()
    } catch (err) {
      console.error('Failed to send:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const statusConfig = {
    draft: { color: 'gray', label: 'Draft' },
    pending_approval: { color: 'yellow', label: 'Pending Approval' },
    approved: { color: 'green', label: 'Approved' },
    rejected: { color: 'red', label: 'Rejected' },
    sent: { color: 'purple', label: 'Sent to Vendor' },
    confirmed: { color: 'blue', label: 'Confirmed' },
    partially_delivered: { color: 'orange', label: 'Partially Delivered' },
    fully_delivered: { color: 'green', label: 'Fully Delivered' },
    cancelled: { color: 'red', label: 'Cancelled' },
  }

  const getStatusConfig = (status) => statusConfig[status] || statusConfig.draft

  if (loading) return <PageLoader />

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error || 'Purchase order not found'}
          </h3>
          <p className="text-gray-500 mb-4">The requested purchase order could not be loaded.</p>
          <Button variant="secondary" onClick={() => navigate('/admin/purchase-orders')}>
            Back to Purchase Orders
          </Button>
        </div>
      </div>
    )
  }

  const status = getStatusConfig(order.status)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 print:hidden">
        <button
          onClick={() => navigate('/admin/purchase-orders')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Purchase Orders
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.poNumber}</h1>
            <p className="text-gray-500 mt-1">
              Created on {formatDate(order.createdAt)} by {order.createdBy?.name || 'System'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
              Print
            </Button>
            {order.status === 'draft' && (
              <>
                <Button variant="secondary" size="sm" icon={Edit} onClick={() => navigate(`/admin/purchase-orders/${id}/edit`)}>
                  Edit
                </Button>
                <Button size="sm" icon={Send} onClick={handleSubmit} loading={submitting}>
                  Submit
                </Button>
              </>
            )}
            {order.status === 'pending_approval' && isSuperAdmin && (
              <>
                <Button variant="danger" size="sm" icon={XCircle} onClick={() => setShowRejectModal(true)}>
                  Reject
                </Button>
                <Button size="sm" icon={CheckCircle} onClick={handleApprove} loading={submitting}>
                  Approve
                </Button>
              </>
            )}
            {order.status === 'approved' && (
              <Button size="sm" icon={Send} onClick={handleSendToVendor} loading={submitting}>
                Send to Vendor
              </Button>
            )}
            {['approved', 'sent', 'confirmed'].includes(order.status) && (
              <Button size="sm" icon={Truck} onClick={() => navigate(`/admin/goods-receipt/new?po=${id}`)}>
                Create GRN
              </Button>
            )}
            {['draft', 'pending_approval'].includes(order.status) && (
              <Button variant="danger" size="sm" icon={XCircle} onClick={() => setShowCancelModal(true)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Document */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Document Header */}
        <div className="px-8 py-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Purchase Order</h2>
              <p className="text-3xl font-bold text-gray-900">{order.poNumber}</p>
            </div>
            <Badge color={status.color} size="lg">{status.label}</Badge>
          </div>
        </div>

        {/* Order Info Grid */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Order Date</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(order.orderDate)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Delivery Date</p>
              <p className="text-sm font-semibold text-gray-900">{formatDate(order.expectedDeliveryDate) || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Payment Terms</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{order.paymentTerms?.replace(/_/g, ' ') || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Delivery Mode</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{order.deliveryTerms || '-'}</p>
            </div>
          </div>
        </div>

        {/* Vendor & Delivery */}
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">Vendor</p>
              <p className="font-semibold text-gray-900">{order.vendor?.name || '-'}</p>
              {order.vendor?.contactPerson && (
                <p className="text-sm text-gray-600 mt-1">{order.vendor.contactPerson}</p>
              )}
              {order.vendor?.email && (
                <p className="text-sm text-gray-600">{order.vendor.email}</p>
              )}
              {order.vendor?.phone && (
                <p className="text-sm text-gray-600">{order.vendor.phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-3">Delivery Address</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {typeof order.deliveryAddress === 'string'
                  ? order.deliveryAddress
                  : order.deliveryAddress
                    ? `${order.deliveryAddress.street || ''}, ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.state || ''} ${order.deliveryAddress.pincode || ''}`.replace(/^,\s*/, '').trim() || '-'
                    : '-'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="px-8 py-6">
          <p className="text-xs font-medium text-gray-500 uppercase mb-4">Order Items</p>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-600 pb-3 w-12">#</th>
                <th className="text-left text-xs font-semibold text-gray-600 pb-3">Description</th>
                <th className="text-right text-xs font-semibold text-gray-600 pb-3 w-20">Qty</th>
                <th className="text-right text-xs font-semibold text-gray-600 pb-3 w-20">Unit</th>
                <th className="text-right text-xs font-semibold text-gray-600 pb-3 w-28">Rate</th>
                <th className="text-right text-xs font-semibold text-gray-600 pb-3 w-20">Tax %</th>
                <th className="text-right text-xs font-semibold text-gray-600 pb-3 w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.lineItems?.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-0">
                  <td className="py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="py-4">
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    {item.itemCode && (
                      <p className="text-xs text-gray-500 mt-0.5">Code: {item.itemCode}</p>
                    )}
                  </td>
                  <td className="py-4 text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="py-4 text-sm text-gray-600 text-right capitalize">{item.unit}</td>
                  <td className="py-4 text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-4 text-sm text-gray-600 text-right">{item.taxRate || 0}%</td>
                  <td className="py-4 text-sm font-semibold text-gray-900 text-right">
                    {formatCurrency(item.totalAmount || item.quantity * item.unitPrice * (1 + (item.taxRate || 0) / 100))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end">
            <div className="w-72">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.subTotal)}</span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">-{formatCurrency(order.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">Tax (GST)</span>
                <span className="font-medium text-gray-900">{formatCurrency(order.totalTax)}</span>
              </div>
              {order.shippingCharges > 0 && (
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">{formatCurrency(order.shippingCharges)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t border-gray-300 mt-2">
                <span className="font-bold text-gray-900">Grand Total</span>
                <span className="font-bold text-xl text-gray-900">{formatCurrency(order.poTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {(order.internalNotes || order.termsConditions) && (
          <div className="px-8 py-6 border-t border-gray-200">
            {order.internalNotes && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Internal Notes</p>
                <p className="text-sm text-gray-700">{order.internalNotes}</p>
              </div>
            )}
            {order.termsConditions && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Terms & Conditions</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.termsConditions}</p>
              </div>
            )}
          </div>
        )}

        {/* Approval Info */}
        {order.approvedBy && (
          <div className="px-8 py-4 bg-green-50 border-t border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">
                Approved by <span className="font-semibold">{order.approvedBy.name}</span> on {formatDate(order.approvedAt)}
              </p>
            </div>
          </div>
        )}

        {/* Activity Log */}
        {order.activities?.length > 0 && (
          <div className="px-8 py-6 border-t border-gray-200 print:hidden">
            <p className="text-xs font-medium text-gray-500 uppercase mb-4">Activity Log</p>
            <div className="space-y-3">
              {order.activities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gray-400" />
                  <div>
                    <p className="text-sm text-gray-700">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activity.performedByName} &middot; {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Purchase Order">
        <form onSubmit={handleReject}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Please provide the reason for rejection..."
              required
            />
          </div>
          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={submitting}>
              Reject PO
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Purchase Order">
        <form onSubmit={handleCancel}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Cancellation <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Optionally provide a reason for cancellation..."
            />
          </div>
          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={() => setShowCancelModal(false)}>
              Keep PO
            </Button>
            <Button type="submit" variant="danger" loading={submitting}>
              Cancel PO
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default PurchaseOrderDetail
