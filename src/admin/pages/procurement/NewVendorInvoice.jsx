import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Input, Select } from '../../components/ui'
import { vendorInvoicesAPI, purchaseOrdersAPI, goodsReceiptsAPI, vendorsAPI } from '../../utils/api'
import { formatCurrency, formatDate } from '../../utils/helpers'

const NewVendorInvoice = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState([])
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [goodsReceipts, setGoodsReceipts] = useState([])
  const [selectedPO, setSelectedPO] = useState(null)
  const [selectedGRN, setSelectedGRN] = useState(null)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    vendor: '',
    vendorInvoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    purchaseOrder: '',
    goodsReceipt: '',
    invoiceAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
    notes: ''
  })

  useEffect(() => {
    loadVendors()
  }, [])

  useEffect(() => {
    if (formData.vendor) {
      loadPurchaseOrders(formData.vendor)
    }
  }, [formData.vendor])

  useEffect(() => {
    if (formData.purchaseOrder) {
      loadGoodsReceipts(formData.purchaseOrder)
      loadPODetails(formData.purchaseOrder)
    }
  }, [formData.purchaseOrder])

  const loadVendors = async () => {
    try {
      const response = await vendorsAPI.getAll({ limit: 100, status: 'active' })
      setVendors(response.data || [])
    } catch (err) {
      console.error('Failed to load vendors:', err)
    }
  }

  const loadPurchaseOrders = async (vendorId) => {
    try {
      const response = await purchaseOrdersAPI.getAll({
        vendor: vendorId,
        limit: 100,
        status: 'approved,sent,partially_delivered,fully_delivered'
      })
      setPurchaseOrders(response.data || [])
    } catch (err) {
      console.error('Failed to load purchase orders:', err)
    }
  }

  const loadGoodsReceipts = async (poId) => {
    try {
      const response = await goodsReceiptsAPI.getAll({
        purchaseOrder: poId,
        limit: 100,
        status: 'accepted'
      })
      setGoodsReceipts(response.data || [])
    } catch (err) {
      console.error('Failed to load goods receipts:', err)
    }
  }

  const loadPODetails = async (poId) => {
    try {
      const response = await purchaseOrdersAPI.getById(poId)
      setSelectedPO(response.data)

      // Auto-fill amounts from PO
      const po = response.data
      setFormData(prev => ({
        ...prev,
        invoiceAmount: po.subtotal || 0,
        taxAmount: po.totalTax || 0,
        grandTotal: po.grandTotal || 0
      }))
    } catch (err) {
      console.error('Failed to load PO details:', err)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Reset dependent fields
    if (field === 'vendor') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        purchaseOrder: '',
        goodsReceipt: ''
      }))
      setPurchaseOrders([])
      setGoodsReceipts([])
      setSelectedPO(null)
    }

    if (field === 'purchaseOrder') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        goodsReceipt: ''
      }))
      setGoodsReceipts([])
    }

    // Calculate grand total
    if (field === 'invoiceAmount' || field === 'taxAmount') {
      const invoiceAmount = field === 'invoiceAmount' ? parseFloat(value) || 0 : parseFloat(formData.invoiceAmount) || 0
      const taxAmount = field === 'taxAmount' ? parseFloat(value) || 0 : parseFloat(formData.taxAmount) || 0
      setFormData(prev => ({
        ...prev,
        [field]: value,
        grandTotal: invoiceAmount + taxAmount
      }))
    }
  }

  const handleGRNSelect = async (grnId) => {
    handleChange('goodsReceipt', grnId)
    if (grnId) {
      try {
        const response = await goodsReceiptsAPI.getById(grnId)
        setSelectedGRN(response.data)
      } catch (err) {
        console.error('Failed to load GRN details:', err)
      }
    } else {
      setSelectedGRN(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.vendor) {
      setError('Please select a vendor')
      return
    }

    if (!formData.vendorInvoiceNumber) {
      setError('Please enter vendor invoice number')
      return
    }

    if (!formData.dueDate) {
      setError('Please enter due date')
      return
    }

    if (formData.grandTotal <= 0) {
      setError('Invoice amount must be greater than 0')
      return
    }

    setLoading(true)
    try {
      const payload = {
        vendor: formData.vendor,
        vendorInvoiceNumber: formData.vendorInvoiceNumber,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        purchaseOrder: formData.purchaseOrder || undefined,
        goodsReceipt: formData.goodsReceipt || undefined,
        subtotal: parseFloat(formData.invoiceAmount),
        totalTax: parseFloat(formData.taxAmount),
        grandTotal: parseFloat(formData.grandTotal),
        notes: formData.notes
      }

      await vendorInvoicesAPI.create(payload)
      navigate('/admin/vendor-invoices')
    } catch (err) {
      console.error('Failed to create invoice:', err)
      setError(err.message || 'Failed to create vendor invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Vendor Invoice"
        description="Record a new vendor invoice for payment processing"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Procurement' },
          { label: 'Vendor Invoices', path: '/admin/vendor-invoices' },
          { label: 'New' }
        ]}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/admin/vendor-invoices')}>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
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
              label="Vendor Invoice Number *"
              value={formData.vendorInvoiceNumber}
              onChange={(e) => handleChange('vendorInvoiceNumber', e.target.value)}
              placeholder="Enter vendor's invoice number"
            />
            <Input
              label="Invoice Date *"
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => handleChange('invoiceDate', e.target.value)}
            />
            <Input
              label="Due Date *"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
            />
            <Select
              label="Purchase Order (for 3-way matching)"
              options={[
                { value: '', label: 'Select PO (Optional)' },
                ...purchaseOrders.map(po => ({
                  value: po._id,
                  label: `${po.poNumber} - ${formatCurrency(po.grandTotal)}`
                }))
              ]}
              value={formData.purchaseOrder}
              onChange={(e) => handleChange('purchaseOrder', e.target.value)}
              disabled={!formData.vendor}
            />
            <Select
              label="Goods Receipt (GRN)"
              options={[
                { value: '', label: 'Select GRN (Optional)' },
                ...goodsReceipts.map(grn => ({
                  value: grn._id,
                  label: `${grn.grnNumber} - ${formatDate(grn.receiptDate)}`
                }))
              ]}
              value={formData.goodsReceipt}
              onChange={(e) => handleGRNSelect(e.target.value)}
              disabled={!formData.purchaseOrder}
            />
          </div>
        </Card>

        {/* PO Reference Info */}
        {selectedPO && (
          <Card className="mb-6 bg-amber-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Purchase Order Reference</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">PO Number</p>
                <p className="font-medium">{selectedPO.poNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">PO Date</p>
                <p className="font-medium">{formatDate(selectedPO.poDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">PO Amount</p>
                <p className="font-medium">{formatCurrency(selectedPO.grandTotal)}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedPO.status?.replace('_', ' ')}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Amount Details */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Invoice Amount (Before Tax) *"
              type="number"
              min="0"
              step="0.01"
              value={formData.invoiceAmount}
              onChange={(e) => handleChange('invoiceAmount', e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="Tax Amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.taxAmount}
              onChange={(e) => handleChange('taxAmount', e.target.value)}
              placeholder="0.00"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grand Total</label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
                <span className="text-xl font-bold text-amber-600">{formatCurrency(formData.grandTotal)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="Any notes or remarks about this invoice..."
          />
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/vendor-invoices')}>
            Cancel
          </Button>
          <Button type="submit" icon={Save} loading={loading}>
            Create Invoice
          </Button>
        </div>
      </form>
    </div>
  )
}

export default NewVendorInvoice
