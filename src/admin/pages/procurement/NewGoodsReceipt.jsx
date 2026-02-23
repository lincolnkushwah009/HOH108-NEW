import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Save, Package } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Input, Select } from '../../components/ui'
import { goodsReceiptsAPI, purchaseOrdersAPI, vendorsAPI } from '../../utils/api'
import { formatCurrency, formatDate } from '../../utils/helpers'

const NewGoodsReceipt = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const poId = searchParams.get('po')

  const [loading, setLoading] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [selectedPO, setSelectedPO] = useState(null)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    purchaseOrder: poId || '',
    receiptDate: new Date().toISOString().split('T')[0],
    deliveryNoteNumber: '',
    vehicleNumber: '',
    storageLocation: '',
    notes: '',
    items: []
  })

  useEffect(() => {
    loadPurchaseOrders()
  }, [])

  useEffect(() => {
    if (poId) {
      loadPODetails(poId)
    }
  }, [poId])

  const loadPurchaseOrders = async () => {
    try {
      const response = await purchaseOrdersAPI.getAll({
        limit: 100,
        status: 'approved,sent,partially_delivered'
      })
      setPurchaseOrders(response.data || [])
    } catch (err) {
      console.error('Failed to load purchase orders:', err)
    }
  }

  const loadPODetails = async (id) => {
    try {
      const response = await purchaseOrdersAPI.getOne(id)
      const po = response.data
      setSelectedPO(po)

      // Pre-populate items from PO - use lineItems (backend field name)
      const items = (po.lineItems || po.items || []).map(item => ({
        poItem: item._id,
        material: item.itemCode || item.material?._id || item.material,
        materialName: item.material?.name || item.description || 'Item',
        description: item.description || item.material?.name || item.material?.description || 'Item',
        orderedQuantity: item.quantity,
        receivedQuantity: item.quantity, // Default to full quantity
        acceptedQuantity: item.quantity,
        rejectedQuantity: 0,
        unit: item.unit,
        unitPrice: item.unitPrice,
        rejectionReason: ''
      }))

      setFormData(prev => ({
        ...prev,
        purchaseOrder: id,
        items
      }))
    } catch (err) {
      console.error('Failed to load PO details:', err)
      setError('Failed to load purchase order details')
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (field === 'purchaseOrder' && value) {
      loadPODetails(value)
    }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value

    // Auto-calculate accepted quantity
    if (field === 'receivedQuantity' || field === 'rejectedQuantity') {
      const received = parseFloat(newItems[index].receivedQuantity) || 0
      const rejected = parseFloat(newItems[index].rejectedQuantity) || 0
      newItems[index].acceptedQuantity = Math.max(0, received - rejected)
    }

    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.purchaseOrder) {
      setError('Please select a purchase order')
      return
    }

    if (formData.items.length === 0) {
      setError('No items to receive')
      return
    }

    if (formData.items.some(item => item.receivedQuantity <= 0)) {
      setError('Received quantity must be greater than 0')
      return
    }

    setLoading(true)
    try {
      const payload = {
        purchaseOrder: formData.purchaseOrder,
        receiptDate: formData.receiptDate,
        deliveryNoteNumber: formData.deliveryNoteNumber,
        vehicleNumber: formData.vehicleNumber,
        storageLocation: formData.storageLocation,
        remarks: formData.notes,
        status: 'received',
        lineItems: formData.items.map(item => ({
          poLineItem: item.poItem,
          itemCode: item.material,
          description: item.description,
          orderedQuantity: parseFloat(item.orderedQuantity) || 0,
          receivedQuantity: parseFloat(item.receivedQuantity) || 0,
          acceptedQuantity: parseFloat(item.acceptedQuantity) || 0,
          rejectedQuantity: parseFloat(item.rejectedQuantity) || 0,
          unit: item.unit,
          rejectionReason: item.rejectionReason || ''
        }))
      }

      await goodsReceiptsAPI.create(payload)
      navigate('/admin/goods-receipt')
    } catch (err) {
      console.error('Failed to create GRN:', err)
      setError(err.message || 'Failed to create goods receipt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="New Goods Receipt (GRN)"
        description="Record receipt of goods from vendor"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Procurement' },
          { label: 'Goods Receipt', path: '/admin/goods-receipt' },
          { label: 'New' }
        ]}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/admin/goods-receipt')}>
            Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receipt Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Purchase Order *"
              options={[
                { value: '', label: 'Select Purchase Order' },
                ...purchaseOrders.map(po => ({
                  value: po._id,
                  label: `${po.poNumber} - ${po.vendor?.name || po.vendorName || 'Vendor N/A'}`
                }))
              ]}
              value={formData.purchaseOrder}
              onChange={(e) => handleChange('purchaseOrder', e.target.value)}
            />
            <Input
              label="Receipt Date *"
              type="date"
              value={formData.receiptDate}
              onChange={(e) => handleChange('receiptDate', e.target.value)}
            />
            <Input
              label="Delivery Note Number"
              value={formData.deliveryNoteNumber}
              onChange={(e) => handleChange('deliveryNoteNumber', e.target.value)}
              placeholder="Vendor's delivery note #"
            />
            <Input
              label="Vehicle Number"
              value={formData.vehicleNumber}
              onChange={(e) => handleChange('vehicleNumber', e.target.value)}
              placeholder="e.g., KA01AB1234"
            />
            <Input
              label="Storage Location"
              value={formData.storageLocation}
              onChange={(e) => handleChange('storageLocation', e.target.value)}
              placeholder="e.g., Warehouse A, Rack 5"
            />
          </div>
        </Card>

        {/* PO Info */}
        {selectedPO && (
          <Card className="mb-6 bg-amber-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Purchase Order Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">PO Number</p>
                <p className="font-medium">{selectedPO.poNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Vendor</p>
                <p className="font-medium">{selectedPO.vendor?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">PO Date</p>
                <p className="font-medium">{formatDate(selectedPO.poDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Amount</p>
                <p className="font-medium">{formatCurrency(selectedPO.grandTotal)}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Items */}
        {formData.items.length > 0 && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items to Receive</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Material</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700 w-24">Ordered</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700 w-28">Received *</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700 w-24">Rejected</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700 w-24">Accepted</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Rejection Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.materialName}</p>
                          <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-medium">{item.orderedQuantity} {item.unit}</span>
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          max={item.orderedQuantity}
                          value={item.receivedQuantity}
                          onChange={(e) => handleItemChange(index, 'receivedQuantity', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          min="0"
                          max={item.receivedQuantity}
                          value={item.rejectedQuantity}
                          onChange={(e) => handleItemChange(index, 'rejectedQuantity', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-medium ${item.acceptedQuantity < item.orderedQuantity ? 'text-orange-600' : 'text-green-600'}`}>
                          {item.acceptedQuantity} {item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {item.rejectedQuantity > 0 && (
                          <input
                            type="text"
                            value={item.rejectionReason}
                            onChange={(e) => handleItemChange(index, 'rejectionReason', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="Reason for rejection"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Notes */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="Any observations or notes about the delivery..."
          />
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/goods-receipt')}>
            Cancel
          </Button>
          <Button type="submit" icon={Save} loading={loading} disabled={formData.items.length === 0}>
            Create GRN
          </Button>
        </div>
      </form>
    </div>
  )
}

export default NewGoodsReceipt
