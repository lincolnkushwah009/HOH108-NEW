import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Input, Select, Modal } from '../../components/ui'
import { purchaseOrdersAPI, vendorsAPI, materialsAPI, purchaseRequisitionsAPI } from '../../utils/api'
import { formatCurrency } from '../../utils/helpers'

const NewPurchaseOrder = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState([])
  const [materials, setMaterials] = useState([])
  const [requisitions, setRequisitions] = useState([])
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
    loadVendors()
    loadMaterials()
    loadRequisitions()
  }, [])

  const loadVendors = async () => {
    try {
      const response = await vendorsAPI.getAll({ limit: 100, status: 'active' })
      setVendors(response.data || [])
    } catch (err) {
      console.error('Failed to load vendors:', err)
    }
  }

  const loadMaterials = async () => {
    try {
      const response = await materialsAPI.getAll({ limit: 500 })
      setMaterials(response.data || [])
    } catch (err) {
      console.error('Failed to load materials:', err)
    }
  }

  const loadRequisitions = async () => {
    try {
      const response = await purchaseRequisitionsAPI.getAll({ status: 'approved', limit: 100 })
      setRequisitions(response.data || [])
    } catch (err) {
      console.error('Failed to load requisitions:', err)
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
        newItems[index].description = mat.description || mat.name
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

    if (formData.items.some(item => !item.material || !item.quantity || item.unitPrice <= 0)) {
      setError('Please fill all item details with valid quantities and prices')
      return
    }

    setLoading(true)
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

      await purchaseOrdersAPI.create(payload)
      navigate('/admin/purchase-orders')
    } catch (err) {
      console.error('Failed to create PO:', err)
      setError(err.message || 'Failed to create purchase order')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div>
      <PageHeader
        title="Create Purchase Order"
        description="Create a new purchase order for vendor"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Procurement' },
          { label: 'Purchase Orders', path: '/admin/purchase-orders' },
          { label: 'New' }
        ]}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/admin/purchase-orders')}>
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
            <Select
              label="From Purchase Requisition"
              options={[
                { value: '', label: 'Select PR (Optional)' },
                ...requisitions.map(pr => ({ value: pr._id, label: `${pr.prNumber} - ${pr.purpose || 'No Purpose'}` }))
              ]}
              value={formData.purchaseRequisition}
              onChange={(e) => handleChange('purchaseRequisition', e.target.value)}
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
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>Order Items</h3>
            <Button type="button" size="sm" icon={Plus} onClick={addItem}>
              Add Item
            </Button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['Material', 'Description', 'Qty', 'Unit', 'Unit Price', 'Tax %', 'Total', ''].map((h, i) => (
                    <th key={h || i} style={{
                      padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#6B7280',
                      textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i === 6 ? 'right' : 'left',
                      borderBottom: '2px solid #E5E7EB', background: '#F9FAFB',
                      whiteSpace: 'nowrap',
                      ...(i === 2 ? { width: 90 } : i === 3 ? { width: 100 } : i === 4 ? { width: 120 } : i === 5 ? { width: 100 } : i === 6 ? { width: 110 } : i === 7 ? { width: 44 } : {}),
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => {
                  const lineTotal = item.quantity * item.unitPrice * (1 + item.tax / 100)
                  const inputStyle = {
                    width: '100%', padding: '9px 12px', fontSize: 13, color: '#111827',
                    border: '1px solid #E5E7EB', borderRadius: 8, outline: 'none',
                    background: '#fff', boxSizing: 'border-box',
                  }
                  const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'auto' }
                  return (
                    <tr key={index} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '8px 8px 8px 12px' }}>
                        <select value={item.material} onChange={(e) => handleItemChange(index, 'material', e.target.value)} style={selectStyle}>
                          <option value="">Select Material</option>
                          {materials.map(m => (
                            <option key={m._id} value={m._id}>{m.materialName} ({m.skuCode})</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="text" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} placeholder="Description" style={inputStyle} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} style={inputStyle} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)} style={selectStyle}>
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
                      <td style={{ padding: '8px' }}>
                        <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} style={inputStyle} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <select value={item.tax} onChange={(e) => handleItemChange(index, 'tax', e.target.value)} style={selectStyle}>
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 12px 8px 8px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                        {formatCurrency(lineTotal)}
                      </td>
                      <td style={{ padding: '8px 12px 8px 0', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          style={{
                            padding: 6, border: 'none', borderRadius: 6, cursor: formData.items.length === 1 ? 'not-allowed' : 'pointer',
                            background: 'transparent', color: formData.items.length === 1 ? '#D1D5DB' : '#EF4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <div style={{ width: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
                <span style={{ color: '#6B7280' }}>Subtotal</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
                <span style={{ color: '#6B7280' }}>Total Tax</span>
                <span style={{ fontWeight: 600, color: '#374151' }}>{formatCurrency(totals.totalTax)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: 18, borderTop: '2px solid #E5E7EB', marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>Grand Total</span>
                <span style={{ fontWeight: 800, color: '#C59C82' }}>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Additional Notes</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            placeholder="Any special instructions or notes..."
            style={{
              width: '100%', padding: '12px 14px', fontSize: 14, color: '#111827',
              border: '1px solid #E5E7EB', borderRadius: 10, outline: 'none',
              resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#C59C82'; e.target.style.boxShadow = '0 0 0 3px rgba(197,156,130,0.12)' }}
            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
          />
        </Card>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/purchase-orders')}>
            Cancel
          </Button>
          <Button type="submit" icon={Save} loading={loading}>
            Create Purchase Order
          </Button>
        </div>
      </form>
    </div>
  )
}

export default NewPurchaseOrder
