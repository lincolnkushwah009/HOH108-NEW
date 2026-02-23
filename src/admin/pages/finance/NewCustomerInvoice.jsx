import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, IndianRupee } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Input, Select } from '../../components/ui'
import { customerInvoicesAPI, customersAPI, projectsAPI } from '../../utils/api'

const NewCustomerInvoice = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState([])
  const [projects, setProjects] = useState([])

  const [formData, setFormData] = useState({
    customer: '',
    project: '',
    invoiceType: 'tax_invoice',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    billingAddress: {
      name: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      gstNumber: ''
    },
    lineItems: [
      { description: '', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0 }
    ],
    shippingCharges: 0,
    otherCharges: 0,
    notes: '',
    termsAndConditions: ''
  })

  useEffect(() => {
    loadCustomersAndProjects()
  }, [])

  const loadCustomersAndProjects = async () => {
    setLoading(true)
    try {
      const [customersRes, projectsRes] = await Promise.all([
        customersAPI.getAll({ limit: 100 }),
        projectsAPI.getAll({ limit: 100 })
      ])
      setCustomers(customersRes.data || [])
      setProjects(projectsRes.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c._id === customerId)
    if (customer) {
      setFormData({
        ...formData,
        customer: customerId,
        billingAddress: {
          name: customer.name || '',
          street: customer.address?.street || '',
          city: customer.address?.city || '',
          state: customer.address?.state || '',
          pincode: customer.address?.pincode || '',
          gstNumber: customer.gstNumber || ''
        }
      })
    } else {
      setFormData({ ...formData, customer: customerId })
    }
  }

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [
        ...formData.lineItems,
        { description: '', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0 }
      ]
    })
  }

  const removeLineItem = (index) => {
    if (formData.lineItems.length === 1) return
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index)
    })
  }

  const updateLineItem = (index, field, value) => {
    const updatedItems = [...formData.lineItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setFormData({ ...formData, lineItems: updatedItems })
  }

  // Calculate totals
  const calculateTotals = () => {
    let subTotal = 0
    let totalDiscount = 0
    let totalTax = 0

    formData.lineItems.forEach(item => {
      const lineTotal = (item.quantity || 0) * (item.unitPrice || 0)
      const discountAmount = (lineTotal * (item.discount || 0)) / 100
      const taxableAmount = lineTotal - discountAmount
      const taxAmount = (taxableAmount * (item.taxRate || 0)) / 100

      subTotal += lineTotal
      totalDiscount += discountAmount
      totalTax += taxAmount
    })

    const invoiceTotal = subTotal - totalDiscount + totalTax + (formData.shippingCharges || 0) + (formData.otherCharges || 0)

    return { subTotal, totalDiscount, totalTax, invoiceTotal }
  }

  const totals = calculateTotals()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.customer) {
      setError('Please select a customer')
      return
    }

    if (!formData.lineItems.some(item => item.description && item.unitPrice > 0)) {
      setError('Please add at least one line item with description and price')
      return
    }

    setSaving(true)
    try {
      // Clean data before sending — remove empty strings for ObjectId/Date fields
      const payload = {
        ...formData,
        lineItems: formData.lineItems.filter(item => item.description && item.unitPrice > 0),
      }
      if (!payload.project) delete payload.project
      if (!payload.dueDate) delete payload.dueDate

      await customerInvoicesAPI.create(payload)
      navigate('/admin/customer-invoices')
    } catch (err) {
      console.error('Failed to create invoice:', err)
      setError(err.message || 'Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount || 0)
  }

  const customerOptions = [
    { value: '', label: 'Select Customer' },
    ...customers.map(c => ({ value: c._id, label: `${c.name} (${c.customerId})` }))
  ]

  const projectOptions = [
    { value: '', label: 'Select Project (Optional)' },
    ...projects.map(p => ({ value: p._id, label: `${p.title} (${p.projectId})` }))
  ]

  const invoiceTypeOptions = [
    { value: 'proforma', label: 'Proforma Invoice' },
    { value: 'tax_invoice', label: 'Tax Invoice' },
    { value: 'credit_note', label: 'Credit Note' },
    { value: 'debit_note', label: 'Debit Note' }
  ]

  const taxRateOptions = [
    { value: 0, label: '0%' },
    { value: 5, label: '5%' },
    { value: 12, label: '12%' },
    { value: 18, label: '18%' },
    { value: 28, label: '28%' }
  ]

  return (
    <div>
      <PageHeader
        title="New Customer Invoice"
        description="Create a new invoice for a customer"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Finance' },
          { label: 'Customer Invoices', path: '/admin/customer-invoices' },
          { label: 'New Invoice' }
        ]}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/admin/customer-invoices')}>
            Back to Invoices
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Customer & Invoice Details */}
        <div style={{ marginBottom: 24 }}>
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Customer *"
                options={customerOptions}
                value={formData.customer}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
              />
              <Select
                label="Project"
                options={projectOptions}
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              />
              <Select
                label="Invoice Type"
                options={invoiceTypeOptions}
                value={formData.invoiceType}
                onChange={(e) => setFormData({ ...formData, invoiceType: e.target.value })}
              />
              <Input
                label="Invoice Date *"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                min={formData.invoiceDate}
              />
            </div>
          </Card>
        </div>

        {/* Billing Address */}
        <div style={{ marginBottom: 24 }}>
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Name"
                value={formData.billingAddress.name}
                onChange={(e) => setFormData({
                  ...formData,
                  billingAddress: { ...formData.billingAddress, name: e.target.value }
                })}
              />
              <div className="md:col-span-2">
                <Input
                  label="Street Address"
                  value={formData.billingAddress.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, street: e.target.value }
                  })}
                />
              </div>
              <Input
                label="City"
                value={formData.billingAddress.city}
                onChange={(e) => setFormData({
                  ...formData,
                  billingAddress: { ...formData.billingAddress, city: e.target.value }
                })}
              />
              <Input
                label="State"
                value={formData.billingAddress.state}
                onChange={(e) => setFormData({
                  ...formData,
                  billingAddress: { ...formData.billingAddress, state: e.target.value }
                })}
              />
              <Input
                label="Pincode"
                value={formData.billingAddress.pincode}
                onChange={(e) => setFormData({
                  ...formData,
                  billingAddress: { ...formData.billingAddress, pincode: e.target.value }
                })}
              />
              <Input
                label="GST Number"
                value={formData.billingAddress.gstNumber}
                onChange={(e) => setFormData({
                  ...formData,
                  billingAddress: { ...formData.billingAddress, gstNumber: e.target.value }
                })}
              />
            </div>
          </Card>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: 24 }}>
          <Card>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
              <Button variant="secondary" type="button" onClick={addLineItem} icon={Plus}>
                Add Item
              </Button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-0 bg-gray-50 border-b border-gray-200">
                <div className="col-span-4 px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</div>
                <div className="col-span-1 px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Qty</div>
                <div className="col-span-2 px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Price</div>
                <div className="col-span-1 px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Disc%</div>
                <div className="col-span-2 px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tax</div>
                <div className="col-span-2 px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</div>
              </div>

              {/* Rows */}
              {formData.lineItems.map((item, index) => {
                const lineTotal = (item.quantity || 0) * (item.unitPrice || 0)
                const discountAmount = (lineTotal * (item.discount || 0)) / 100
                const taxableAmount = lineTotal - discountAmount
                const taxAmount = (taxableAmount * (item.taxRate || 0)) / 100
                const totalAmount = taxableAmount + taxAmount

                return (
                  <div key={index} className={`grid grid-cols-12 gap-0 items-center ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                    <div className="col-span-4 px-4 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C59C82]/30 focus:border-[#C59C82] transition-shadow"
                      />
                    </div>
                    <div className="col-span-1 px-3 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="1"
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#C59C82]/30 focus:border-[#C59C82] transition-shadow"
                      />
                    </div>
                    <div className="col-span-2 px-3 py-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C59C82]/30 focus:border-[#C59C82] transition-shadow"
                        />
                      </div>
                    </div>
                    <div className="col-span-1 px-3 py-3">
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#C59C82]/30 focus:border-[#C59C82] transition-shadow"
                      />
                    </div>
                    <div className="col-span-2 px-3 py-3">
                      <select
                        value={item.taxRate}
                        onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C59C82]/30 focus:border-[#C59C82] bg-white transition-shadow cursor-pointer"
                      >
                        {taxRateOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 px-4 py-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(totalAmount)}</span>
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-20 disabled:hover:text-gray-300 disabled:hover:bg-transparent transition-colors"
                        disabled={formData.lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              onClick={addLineItem}
              className="w-full mt-4 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-[#C59C82] hover:text-[#C59C82] text-sm font-medium transition-colors"
            >
              + Add Line Item
            </button>
          </Card>
        </div>

        {/* Additional Charges + Invoice Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Left: Charges & Notes */}
          <div>
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <Input
                  label="Shipping Charges"
                  type="number"
                  value={formData.shippingCharges}
                  onChange={(e) => setFormData({ ...formData, shippingCharges: parseFloat(e.target.value) || 0 })}
                  icon={IndianRupee}
                />
                <Input
                  label="Other Charges"
                  type="number"
                  value={formData.otherCharges}
                  onChange={(e) => setFormData({ ...formData, otherCharges: parseFloat(e.target.value) || 0 })}
                  icon={IndianRupee}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C59C82]/30 focus:border-[#C59C82] resize-none transition-shadow"
                  placeholder="Notes for customer..."
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="block text-sm font-medium text-gray-600 mb-2">Terms & Conditions</label>
                <textarea
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C59C82]/30 focus:border-[#C59C82] resize-none transition-shadow"
                  placeholder="Terms and conditions..."
                />
              </div>
            </Card>
          </div>

          {/* Right: Invoice Summary */}
          <div>
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm text-gray-900 font-medium">{formatCurrency(totals.subTotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Discount</span>
                  <span className="text-sm text-red-500 font-medium">-{formatCurrency(totals.totalDiscount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tax (GST)</span>
                  <span className="text-sm text-gray-900 font-medium">{formatCurrency(totals.totalTax)}</span>
                </div>
                {formData.shippingCharges > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Shipping</span>
                    <span className="text-sm text-gray-900 font-medium">{formatCurrency(formData.shippingCharges)}</span>
                  </div>
                )}
                {formData.otherCharges > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Other Charges</span>
                    <span className="text-sm text-gray-900 font-medium">{formatCurrency(formData.otherCharges)}</span>
                  </div>
                )}
                <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: 16, marginTop: 8 }} className="flex justify-between items-center">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-[#C59C82]">{formatCurrency(totals.invoiceTotal)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginBottom: 24 }}>
          <Card>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => navigate('/admin/customer-invoices')}>
                Cancel
              </Button>
              <Button type="submit" icon={Save} disabled={saving}>
                {saving ? 'Creating...' : 'Create Invoice'}
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}

export default NewCustomerInvoice
