import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { purchaseOrdersAPI, vendorsAPI, materialsAPI } from '../../utils/api'
import { formatCurrency } from '../../utils/helpers'

const EditPurchaseOrder = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vendors, setVendors] = useState([])
  const [materials, setMaterials] = useState([])
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    vendor: '',
    purchaseRequisition: '',
    poDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    deliveryAddress: '',
    paymentTerms: 'net_30',
    notes: '',
    items: [{ material: '', description: '', quantity: 1, unit: 'nos', unitPrice: 0, tax: 18 }]
  })

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [orderRes, vendorsRes, materialsRes] = await Promise.all([
        purchaseOrdersAPI.getOne(id),
        vendorsAPI.getAll({ limit: 100, status: 'active' }),
        materialsAPI.getAll({ limit: 500 })
      ])

      setVendors(vendorsRes.data || [])
      setMaterials(materialsRes.data || [])

      const order = orderRes.data
      if (order) {
        setFormData({
          vendor: order.vendor?._id || '',
          purchaseRequisition: order.purchaseRequisition?._id || '',
          poDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : '',
          expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '',
          deliveryAddress: order.deliveryAddress?.street || '',
          paymentTerms: order.paymentTerms || 'net_30',
          notes: order.internalNotes || '',
          items: order.lineItems?.map(item => ({
            material: item.itemCode || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unit: item.unit || 'nos',
            unitPrice: item.unitPrice || 0,
            tax: item.taxRate || 18
          })) || [{ material: '', description: '', quantity: 1, unit: 'nos', unitPrice: 0, tax: 18 }]
        })
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load purchase order')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value

    // If material selected, auto-fill description and unit
    if (field === 'material' && value) {
      const mat = materials.find(m => m._id === value)
      if (mat) {
        newItems[index].description = mat.description || mat.materialName
        newItems[index].unit = mat.unit || 'nos'
        newItems[index].unitPrice = mat.lastPurchasePrice || 0
      }
    }

    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { material: '', description: '', quantity: 1, unit: 'nos', unitPrice: 0, tax: 18 }]
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalTax = 0

    formData.items.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice
      const lineTax = (lineTotal * item.tax) / 100
      subtotal += lineTotal
      totalTax += lineTax
    })

    return {
      subtotal,
      totalTax,
      grandTotal: subtotal + totalTax
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.vendor) {
      setError('Please select a vendor')
      return
    }

    if (!formData.expectedDeliveryDate) {
      setError('Please enter expected delivery date')
      return
    }

    if (formData.items.some(item => !item.description || !item.quantity || item.unitPrice <= 0)) {
      setError('Please fill all item details with valid quantities and prices')
      return
    }

    setSaving(true)
    try {
      const totals = calculateTotals()
      const payload = {
        vendor: formData.vendor,
        purchaseRequisition: formData.purchaseRequisition || undefined,
        orderDate: formData.poDate,
        expectedDeliveryDate: formData.expectedDeliveryDate,
        deliveryAddress: { street: formData.deliveryAddress },
        paymentTerms: formData.paymentTerms,
        internalNotes: formData.notes,
        lineItems: formData.items.map(item => ({
          description: item.description,
          itemCode: item.material,
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          unitPrice: parseFloat(item.unitPrice),
          taxRate: parseFloat(item.tax),
          taxAmount: (parseFloat(item.quantity) * parseFloat(item.unitPrice) * parseFloat(item.tax)) / 100,
          totalAmount: parseFloat(item.quantity) * parseFloat(item.unitPrice) * (1 + parseFloat(item.tax) / 100)
        })),
        subTotal: totals.subtotal,
        totalTax: totals.totalTax
      }

      await purchaseOrdersAPI.update(id, payload)
      navigate(`/admin/purchase-orders/${id}`)
    } catch (err) {
      console.error('Failed to update PO:', err)
      setError(err.message || 'Failed to update purchase order')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  const totals = calculateTotals()

  return (
    <div>
      <PageHeader
        title="Edit Purchase Order"
        description="Update purchase order details"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Procurement' },
          { label: 'Purchase Orders', path: '/admin/purchase-orders' },
          { label: 'Edit' }
        ]}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(`/admin/purchase-orders/${id}`)}>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Select
              label="Vendor *"
              options={[
                { value: '', label: 'Select Vendor' },
                ...vendors.map(v => ({ value: v._id, label: `${v.name} (${v.vendorId})` }))
              ]}
              value={formData.vendor}
              onChange={(e) => handleChange('vendor', e.target.value)}
            />
            <Input
              label="PO Date *"
              type="date"
              value={formData.poDate}
              onChange={(e) => handleChange('poDate', e.target.value)}
            />
            <Input
              label="Expected Delivery Date *"
              type="date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => handleChange('expectedDeliveryDate', e.target.value)}
            />
            <Select
              label="Payment Terms"
              options={[
                { value: 'immediate', label: 'Immediate' },
                { value: 'net_15', label: 'Net 15 Days' },
                { value: 'net_30', label: 'Net 30 Days' },
                { value: 'net_45', label: 'Net 45 Days' },
                { value: 'net_60', label: 'Net 60 Days' },
                { value: 'advance', label: '100% Advance' },
                { value: 'partial_advance', label: '50% Advance' },
              ]}
              value={formData.paymentTerms}
              onChange={(e) => handleChange('paymentTerms', e.target.value)}
            />
            <Input
              label="Delivery Address"
              value={formData.deliveryAddress}
              onChange={(e) => handleChange('deliveryAddress', e.target.value)}
              placeholder="Enter delivery address"
            />
          </div>
        </Card>

        {/* Items */}
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
            <Button type="button" size="sm" icon={Plus} onClick={addItem}>
              Add Item
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Material</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700">Description</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700 w-24">Qty</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700 w-24">Unit</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700 w-32">Unit Price</th>
                  <th className="text-left py-2 px-2 font-medium text-gray-700 w-24">Tax %</th>
                  <th className="text-right py-2 px-2 font-medium text-gray-700 w-32">Total</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => {
                  const lineTotal = item.quantity * item.unitPrice * (1 + item.tax / 100)
                  return (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-2">
                        <select
                          value={item.material}
                          onChange={(e) => handleItemChange(index, 'material', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                          <option value="">Select Material</option>
                          {materials.map(m => (
                            <option key={m._id} value={m._id}>{m.materialName} ({m.skuCode})</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Description"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                          <option value="nos">Nos</option>
                          <option value="kg">Kg</option>
                          <option value="ltr">Ltr</option>
                          <option value="m">Meter</option>
                          <option value="sqft">Sq.Ft</option>
                          <option value="sqm">Sq.M</option>
                          <option value="box">Box</option>
                          <option value="set">Set</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={item.tax}
                          onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        {formatCurrency(lineTotal)}
                      </td>
                      <td className="py-2 px-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          disabled={formData.items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Tax</span>
                <span className="font-medium">{formatCurrency(totals.totalTax)}</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-2">
                <span className="font-semibold">Grand Total</span>
                <span className="font-bold text-amber-600">{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="Any special instructions or notes..."
          />
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(`/admin/purchase-orders/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" icon={Save} loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EditPurchaseOrder
