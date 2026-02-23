import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Building2,
  User,
  Calendar,
  FileText,
  Truck,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react'
import { goodsReceiptsAPI } from '../../utils/api'
import { Button, Badge, Modal, Card } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import PageHeader from '../../components/layout/PageHeader'
import { formatDate, formatDateTime } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'

const GoodsReceiptDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const printRef = useRef()
  const { user } = useAuth()
  const [grn, setGrn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [inspectionData, setInspectionData] = useState({ items: [], remarks: '', overallStatus: 'passed' })
  const [submitting, setSubmitting] = useState(false)

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin'

  useEffect(() => {
    loadGRN()
  }, [id])

  const loadGRN = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await goodsReceiptsAPI.getOne(id)
      setGrn(response.data)
      // Initialize inspection data from line items
      if (response.data?.lineItems) {
        setInspectionData({
          items: response.data.lineItems.map(item => ({
            _id: item._id,
            acceptedQuantity: item.acceptedQuantity || item.receivedQuantity,
            rejectedQuantity: item.rejectedQuantity || 0,
            rejectionReason: item.rejectionReason || '',
            qualityStatus: item.qualityStatus || 'pending_inspection'
          })),
          remarks: '',
          overallStatus: 'passed'
        })
      }
    } catch (err) {
      console.error('Failed to load GRN:', err)
      setError('Failed to load goods receipt')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setSubmitting(true)
    try {
      await goodsReceiptsAPI.accept(id)
      loadGRN()
    } catch (err) {
      console.error('Failed to accept GRN:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInspection = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await goodsReceiptsAPI.inspection(id, {
        lineItems: inspectionData.items,
        remarks: inspectionData.remarks,
        overallStatus: inspectionData.overallStatus
      })
      setShowInspectionModal(false)
      loadGRN()
    } catch (err) {
      console.error('Failed to complete inspection:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleInspectionItemChange = (index, field, value) => {
    const newItems = [...inspectionData.items]
    newItems[index][field] = value

    // Auto-update quality status based on quantities
    if (field === 'acceptedQuantity' || field === 'rejectedQuantity') {
      const item = grn.lineItems[index]
      const accepted = parseFloat(newItems[index].acceptedQuantity) || 0
      const rejected = parseFloat(newItems[index].rejectedQuantity) || 0
      const received = item.receivedQuantity

      if (rejected === 0) {
        newItems[index].qualityStatus = 'passed'
      } else if (accepted === 0) {
        newItems[index].qualityStatus = 'failed'
      } else {
        newItems[index].qualityStatus = 'partially_passed'
      }
    }

    setInspectionData({ ...inspectionData, items: newItems })
  }

  const handlePrint = () => {
    window.print()
  }

  const statusColors = {
    draft: 'gray',
    received: 'blue',
    inspection_pending: 'yellow',
    inspection_completed: 'purple',
    partially_accepted: 'orange',
    accepted: 'green',
    rejected: 'red',
    cancelled: 'red',
  }

  const statusLabels = {
    draft: 'Draft',
    received: 'Received',
    inspection_pending: 'Pending Inspection',
    inspection_completed: 'Inspection Completed',
    partially_accepted: 'Partially Accepted',
    accepted: 'Accepted',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
  }

  const qualityStatusColors = {
    pending_inspection: 'yellow',
    passed: 'green',
    failed: 'red',
    partially_passed: 'orange',
  }

  const qualityStatusLabels = {
    pending_inspection: 'Pending',
    passed: 'Passed',
    failed: 'Failed',
    partially_passed: 'Partial',
  }

  if (loading) return <PageLoader />

  if (error || !grn) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || 'Goods receipt not found'}
          </h3>
          <Button variant="secondary" onClick={() => navigate('/admin/goods-receipt')}>
            Back to Goods Receipts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="print:p-0">
      <PageHeader
        title={grn.grnNumber || 'Goods Receipt'}
        description={`Receipt for PO ${grn.purchaseOrder?.poNumber || 'Unknown'}`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Procurement' },
          { label: 'Goods Receipt', path: '/admin/goods-receipt' },
          { label: grn.grnNumber || 'Detail' }
        ]}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/admin/goods-receipt')}>
              Back
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>
              Print
            </Button>
            {['received', 'inspection_pending'].includes(grn.status) && (
              <Button icon={ClipboardCheck} onClick={() => setShowInspectionModal(true)}>
                Quality Inspection
              </Button>
            )}
            {grn.status === 'inspection_completed' && (
              <Button icon={CheckCircle} onClick={handleAccept} loading={submitting}>
                Accept & Update Stock
              </Button>
            )}
          </div>
        }
      />

      <div ref={printRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* GRN Header Card */}
          <Card className="p-0 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{grn.grnNumber}</h2>
                  <p className="text-sm text-gray-500 mt-1">Created on {formatDate(grn.createdAt)}</p>
                </div>
                <Badge color={statusColors[grn.status] || 'gray'} size="lg">
                  {statusLabels[grn.status] || grn.status}
                </Badge>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Receipt Date</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900">{formatDate(grn.receiptDate)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Delivery Note</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900">{grn.deliveryNoteNumber || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vehicle No.</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900">{grn.vehicleNumber || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Received By</p>
                  </div>
                  <p className="text-base font-semibold text-gray-900">{grn.receivedBy?.name || '-'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Vendor & PO Info Card */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                Vendor & PO Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Vendor Name</p>
                  <p className="text-base font-semibold text-gray-900">{grn.vendor?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Vendor ID</p>
                  <p className="text-base font-semibold text-gray-900">{grn.vendor?.vendorId || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">PO Number</p>
                  <p className="text-base font-semibold text-amber-600 cursor-pointer hover:underline"
                     onClick={() => navigate(`/admin/purchase-orders/${grn.purchaseOrder?._id}`)}>
                    {grn.purchaseOrder?.poNumber || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Email</p>
                  <p className="text-base font-medium text-gray-700">{grn.vendor?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Phone</p>
                  <p className="text-base font-medium text-gray-700">{grn.vendor?.phone || '-'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Line Items Card */}
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Package className="h-5 w-5 text-amber-700" />
                </div>
                Received Items
                <span className="ml-auto text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {grn.lineItems?.length || 0} item(s)
                </span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">#</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Ordered</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Received</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Accepted</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Rejected</th>
                    <th className="text-center py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wide">Quality</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {grn.lineItems?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-6 text-sm text-gray-500 font-medium">{item.slNo || index + 1}</td>
                      <td className="py-5 px-6">
                        <p className="text-sm font-semibold text-gray-900">{item.description}</p>
                        {item.itemCode && (
                          <p className="text-xs text-gray-500 mt-1">Code: {item.itemCode}</p>
                        )}
                      </td>
                      <td className="py-5 px-6 text-right text-sm text-gray-600">{item.orderedQuantity} {item.unit}</td>
                      <td className="py-5 px-6 text-right text-sm font-semibold text-gray-900">{item.receivedQuantity} {item.unit}</td>
                      <td className="py-5 px-6 text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-semibold">
                          {item.acceptedQuantity} {item.unit}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        {item.rejectedQuantity > 0 ? (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-sm font-semibold">
                              {item.rejectedQuantity} {item.unit}
                            </span>
                            {item.rejectionReason && (
                              <p className="text-xs text-gray-500 mt-1">{item.rejectionReason}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <Badge color={qualityStatusColors[item.qualityStatus] || 'gray'} size="sm">
                          {qualityStatusLabels[item.qualityStatus] || item.qualityStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between items-center py-2 px-4 bg-white rounded-lg">
                    <span className="text-sm text-gray-600">Total Received</span>
                    <span className="text-base font-bold text-gray-900">{grn.totalReceivedQuantity || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-4 bg-green-50 rounded-lg">
                    <span className="text-sm text-green-700">Total Accepted</span>
                    <span className="text-base font-bold text-green-700">{grn.totalAcceptedQuantity || 0}</span>
                  </div>
                  {grn.totalRejectedQuantity > 0 && (
                    <div className="flex justify-between items-center py-2 px-4 bg-red-50 rounded-lg">
                      <span className="text-sm text-red-700">Total Rejected</span>
                      <span className="text-base font-bold text-red-700">{grn.totalRejectedQuantity}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Notes Card */}
          {grn.internalNotes && (
            <Card className="p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-900">Internal Notes</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{grn.internalNotes}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 print:hidden">
          {/* Storage Location Card */}
          {grn.storageLocation && (
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gray-500" />
                  Storage Location
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-700 font-medium">{grn.storageLocation}</p>
              </div>
            </Card>
          )}

          {/* Quality Inspection Info Card */}
          {grn.qualityInspection?.inspectedBy && (
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-amber-50/50">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-amber-700" />
                  Quality Inspection
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Inspected By</p>
                  <p className="text-sm font-semibold text-gray-900">{grn.qualityInspection.inspectedBy.name}</p>
                </div>
                {grn.qualityInspection.inspectedAt && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Inspected On</p>
                    <p className="text-sm font-semibold text-gray-900">{formatDateTime(grn.qualityInspection.inspectedAt)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Overall Status</p>
                  <Badge color={qualityStatusColors[grn.qualityInspection.overallStatus] || 'gray'}>
                    {qualityStatusLabels[grn.qualityInspection.overallStatus] || grn.qualityInspection.overallStatus}
                  </Badge>
                </div>
                {grn.qualityInspection.remarks && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Remarks</p>
                    <p className="text-sm text-gray-700">{grn.qualityInspection.remarks}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Rejections Warning Card */}
          {grn.totalRejectedQuantity > 0 && (
            <Card className="p-0 overflow-hidden border-red-200 bg-red-50">
              <div className="px-5 py-4 border-b border-red-200 bg-red-100/50">
                <h3 className="text-base font-semibold text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Rejections
                </h3>
              </div>
              <div className="p-5">
                <p className="text-sm text-red-700">
                  <span className="font-bold">{grn.totalRejectedQuantity}</span> items were rejected during quality inspection.
                </p>
              </div>
            </Card>
          )}

          {/* Activity Timeline Card */}
          {grn.activities?.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  Activity
                </h3>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  {grn.activities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                        {index < Math.min(grn.activities.length - 1, 4) && (
                          <div className="w-0.5 h-full bg-gray-200 mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm text-gray-900 font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.performedByName} · {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Quality Inspection Modal */}
      <Modal
        isOpen={showInspectionModal}
        onClose={() => setShowInspectionModal(false)}
        title=""
        size="lg"
      >
        <form onSubmit={handleInspection}>
          {/* Header */}
          <div className="text-center pt-2 pb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl shadow-lg mb-4">
              <ClipboardCheck className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Quality Inspection</h2>
            <p className="text-sm text-gray-500 mt-2">Review and verify the quality of received items</p>
          </div>

          {/* Items Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">Items to Inspect</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                {grn.lineItems?.length || 0} item(s)
              </span>
            </div>

            <div className="space-y-5">
              {grn.lineItems?.map((item, index) => {
                const accepted = inspectionData.items[index]?.acceptedQuantity || 0
                const rejected = inspectionData.items[index]?.rejectedQuantity || 0
                const isFullyAccepted = Number(accepted) === item.receivedQuantity && Number(rejected) === 0
                const hasRejection = Number(rejected) > 0

                return (
                  <div
                    key={index}
                    className={`rounded-2xl border-2 transition-all ${
                      isFullyAccepted
                        ? 'border-green-300 bg-green-50'
                        : hasRejection
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Item Header */}
                    <div className="p-5 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{item.description}</h4>
                          {item.itemCode && (
                            <p className="text-sm text-gray-400 mt-1">Code: {item.itemCode}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200 whitespace-nowrap">
                            Received: <span className="font-bold text-gray-900">{item.receivedQuantity}</span> {item.unit}
                          </span>
                          {isFullyAccepted && (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Inputs */}
                    <div className="px-5 pb-5">
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Accepted Qty
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max={item.receivedQuantity}
                              value={inspectionData.items[index]?.acceptedQuantity || 0}
                              onChange={(e) => handleInspectionItemChange(index, 'acceptedQuantity', e.target.value)}
                              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-lg font-semibold text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                              {item.unit}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Rejected Qty
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max={item.receivedQuantity}
                              value={inspectionData.items[index]?.rejectedQuantity || 0}
                              onChange={(e) => handleInspectionItemChange(index, 'rejectedQuantity', e.target.value)}
                              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-lg font-semibold text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                              {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {hasRejection && (
                        <div className="mt-5">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Rejection Reason
                          </label>
                          <input
                            type="text"
                            value={inspectionData.items[index]?.rejectionReason || ''}
                            onChange={(e) => handleInspectionItemChange(index, 'rejectionReason', e.target.value)}
                            className="w-full border-2 border-amber-200 rounded-xl px-4 py-3.5 text-base text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-amber-50"
                            placeholder="Enter reason for rejection..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Overall Assessment Section */}
          <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 mb-8">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-800">Overall Assessment</h3>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Inspection Result
                </label>
                <select
                  value={inspectionData.overallStatus}
                  onChange={(e) => setInspectionData({ ...inspectionData, overallStatus: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                >
                  <option value="passed">Passed</option>
                  <option value="partially_passed">Partially Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Inspector Notes (Optional)
                </label>
                <textarea
                  value={inspectionData.remarks}
                  onChange={(e) => setInspectionData({ ...inspectionData, remarks: e.target.value })}
                  rows={4}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white resize-none"
                  placeholder="Add any observations or notes..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowInspectionModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={CheckCircle}
              loading={submitting}
            >
              Complete Inspection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default GoodsReceiptDetail
