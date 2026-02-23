import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Send } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button } from '../../components/ui'
import { quotationsAPI, customersAPI, projectsAPI } from '../../utils/api'

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  fontSize: 14,
  color: '#1F2937',
  outline: 'none',
  fontFamily: 'inherit',
  background: '#fff',
}

const selectStyle = { ...inputStyle, cursor: 'pointer' }

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 80,
}

const cardStyle = {
  background: '#fff',
  borderRadius: 16,
  border: '1px solid #E5E7EB',
  padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  marginBottom: 24,
}

const NewQuotation = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState([])
  const [projects, setProjects] = useState([])

  const getDefaultValidUntil = () => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    customer: '',
    project: '',
    title: '',
    description: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: getDefaultValidUntil(),
    lineItems: [
      { description: '', itemCode: '', category: '', unit: 'nos', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0, specifications: '', remarks: '', isOptional: false }
    ],
    otherCharges: 0,
    termsAndConditions: '',
    paymentTerms: '',
    deliveryTerms: '',
    warranty: '',
    notes: '',
    internalNotes: ''
  })

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (isEditing) loadQuotation() }, [id])

  const loadData = async () => {
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

  const loadQuotation = async () => {
    try {
      const response = await quotationsAPI.getOne(id)
      const q = response.data
      setFormData({
        customer: q.customer?._id || '',
        project: q.project?._id || '',
        title: q.title || '',
        description: q.description || '',
        quotationDate: q.quotationDate ? new Date(q.quotationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        validUntil: q.validUntil ? new Date(q.validUntil).toISOString().split('T')[0] : getDefaultValidUntil(),
        lineItems: q.lineItems?.length > 0 ? q.lineItems.map(item => ({
          description: item.description || '', itemCode: item.itemCode || '', category: item.category || '',
          unit: item.unit || 'nos', quantity: item.quantity || 1, unitPrice: item.unitPrice || 0,
          taxRate: item.taxRate || 18, discount: item.discount || 0, specifications: item.specifications || '',
          remarks: item.remarks || '', isOptional: item.isOptional || false
        })) : [{ description: '', itemCode: '', category: '', unit: 'nos', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0, specifications: '', remarks: '', isOptional: false }],
        otherCharges: q.otherCharges || 0,
        termsAndConditions: q.termsAndConditions || '',
        paymentTerms: q.paymentTerms || '',
        deliveryTerms: q.deliveryTerms || '',
        warranty: q.warranty || '',
        notes: q.notes || '',
        internalNotes: q.internalNotes || ''
      })
    } catch (err) {
      console.error('Failed to load quotation:', err)
      setError('Failed to load quotation')
    }
  }

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', itemCode: '', category: '', unit: 'nos', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0, specifications: '', remarks: '', isOptional: false }]
    })
  }

  const removeLineItem = (index) => {
    if (formData.lineItems.length === 1) return
    setFormData({ ...formData, lineItems: formData.lineItems.filter((_, i) => i !== index) })
  }

  const updateLineItem = (index, field, value) => {
    const updatedItems = [...formData.lineItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setFormData({ ...formData, lineItems: updatedItems })
  }

  const calculateTotals = () => {
    let subTotal = 0, totalDiscount = 0, totalTax = 0
    formData.lineItems.forEach(item => {
      if (item.isOptional) return
      const lineTotal = (item.quantity || 0) * (item.unitPrice || 0)
      const discountAmount = (lineTotal * (item.discount || 0)) / 100
      const taxableAmount = lineTotal - discountAmount
      const taxAmount = (taxableAmount * (item.taxRate || 0)) / 100
      subTotal += lineTotal
      totalDiscount += discountAmount
      totalTax += taxAmount
    })
    return { subTotal, totalDiscount, totalTax, quotationTotal: subTotal - totalDiscount + totalTax + (formData.otherCharges || 0) }
  }

  const totals = calculateTotals()

  const handleSubmit = async (e, sendAfterSave = false) => {
    e.preventDefault()
    setError('')
    if (!formData.customer) return setError('Please select a customer')
    if (!formData.title) return setError('Please enter a quotation title')
    if (!formData.validUntil) return setError('Please set a valid until date')
    if (!formData.lineItems.some(item => item.description && item.unitPrice > 0)) return setError('Please add at least one line item with description and price')

    setSaving(true)
    try {
      let response
      if (isEditing) { response = await quotationsAPI.update(id, formData) }
      else { response = await quotationsAPI.create(formData) }
      if (sendAfterSave && response.data?._id) await quotationsAPI.send(response.data._id)
      navigate('/admin/quotations')
    } catch (err) {
      console.error('Failed to save quotation:', err)
      setError(err.message || 'Failed to save quotation')
    } finally {
      setSaving(false)
    }
  }

  const fmt = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0)

  const unitOptions = [
    { value: 'sqft', label: 'Sq.ft' }, { value: 'sqm', label: 'Sq.m' }, { value: 'rft', label: 'Rft' },
    { value: 'nos', label: 'Nos' }, { value: 'kg', label: 'Kg' }, { value: 'ltr', label: 'Ltr' },
    { value: 'set', label: 'Set' }, { value: 'lot', label: 'Lot' }, { value: 'ls', label: 'L.S.' },
    { value: 'hours', label: 'Hours' }, { value: 'days', label: 'Days' }
  ]

  const taxRateOptions = [
    { value: 0, label: '0%' }, { value: 5, label: '5%' }, { value: 12, label: '12%' },
    { value: 18, label: '18%' }, { value: 28, label: '28%' }
  ]

  const smallInput = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    fontSize: 13,
    color: '#1F2937',
    outline: 'none',
    background: '#fff',
    fontFamily: 'inherit',
  }

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Quotation' : 'New Quotation'}
        description={isEditing ? 'Update quotation details' : 'Create a new quotation for a customer'}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Sales' },
          { label: 'Quotations', path: '/admin/quotations' },
          { label: isEditing ? 'Edit' : 'New Quotation' }
        ]}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/admin/quotations')}>
            Back
          </Button>
        }
      />

      <form onSubmit={(e) => handleSubmit(e, false)}>
        {error && (
          <div style={{ marginBottom: 16, padding: 14, background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 10, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* Quotation Details */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: '0 0 20px' }}>Quotation Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <label style={labelStyle}>Customer *</label>
              <select style={selectStyle} value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} required>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.customerId})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Project (Optional)</label>
              <select style={selectStyle} value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.title} ({p.projectId})</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Quotation Date</label>
              <input type="date" style={inputStyle} value={formData.quotationDate} onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Interior Design - Living Room" required />
            </div>
            <div>
              <label style={labelStyle}>Valid Until *</label>
              <input type="date" style={inputStyle} value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} min={formData.quotationDate} required />
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <label style={labelStyle}>Description</label>
              <textarea style={textareaStyle} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description of the quotation scope..." rows={2} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: '0 0 16px' }}>Line Items</h3>

          {/* Header Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1.5fr 1fr 1fr 1.5fr 40px', gap: 8, paddingBottom: 10, borderBottom: '1px solid #E5E7EB', marginBottom: 12 }}>
            {['Description', 'Qty', 'Unit', 'Rate', 'Disc%', 'Tax', 'Amount', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: i >= 3 && i < 7 ? 'center' : 'left' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {formData.lineItems.map((item, index) => {
            const lineTotal = (item.quantity || 0) * (item.unitPrice || 0)
            const discountAmount = (lineTotal * (item.discount || 0)) / 100
            const taxableAmount = lineTotal - discountAmount
            const taxAmount = (taxableAmount * (item.taxRate || 0)) / 100
            const totalAmount = taxableAmount + taxAmount

            return (
              <div key={index} style={{ padding: 12, borderRadius: 10, border: `1px solid ${item.isOptional ? '#FDE68A' : '#E5E7EB'}`, background: item.isOptional ? '#FFFBEB' : '#F9FAFB', marginBottom: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1.5fr 1fr 1fr 1.5fr 40px', gap: 8, alignItems: 'center' }}>
                  <input style={smallInput} type="text" value={item.description} onChange={(e) => updateLineItem(index, 'description', e.target.value)} placeholder="Item description" />
                  <input style={{ ...smallInput, textAlign: 'center' }} type="number" value={item.quantity} onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)} min="0" step="0.01" />
                  <select style={{ ...smallInput, cursor: 'pointer' }} value={item.unit} onChange={(e) => updateLineItem(index, 'unit', e.target.value)}>
                    {unitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <input style={{ ...smallInput, textAlign: 'right' }} type="number" value={item.unitPrice} onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} min="0" step="0.01" placeholder="0" />
                  <input style={{ ...smallInput, textAlign: 'center' }} type="number" value={item.discount} onChange={(e) => updateLineItem(index, 'discount', parseFloat(e.target.value) || 0)} min="0" max="100" />
                  <select style={{ ...smallInput, cursor: 'pointer' }} value={item.taxRate} onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value))}>
                    {taxRateOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'right', color: item.isOptional ? '#92400E' : '#1F2937' }}>
                    {fmt(totalAmount)}
                  </div>
                  <button type="button" onClick={() => removeLineItem(index)} disabled={formData.lineItems.length === 1} style={{ background: 'none', border: 'none', cursor: formData.lineItems.length === 1 ? 'not-allowed' : 'pointer', padding: 4, color: '#9CA3AF', opacity: formData.lineItems.length === 1 ? 0.3 : 1 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#6B7280' }}>
                    <input type="checkbox" checked={item.isOptional} onChange={(e) => updateLineItem(index, 'isOptional', e.target.checked)} />
                    Optional item (excluded from total)
                  </label>
                </div>
              </div>
            )
          })}

          <button type="button" onClick={addLineItem} style={{
            width: '100%', marginTop: 8, padding: '12px 16px', border: '2px dashed #D1D5DB', borderRadius: 10,
            background: 'transparent', color: '#6B7280', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Plus size={16} /> Add Line Item
          </button>
        </div>

        {/* Notes & Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Notes & Charges */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: '0 0 16px' }}>Notes & Charges</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Other Charges</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 14 }}>₹</span>
                  <input type="number" style={{ ...inputStyle, paddingLeft: 28 }} value={formData.otherCharges} onChange={(e) => setFormData({ ...formData, otherCharges: parseFloat(e.target.value) || 0 })} min="0" placeholder="0" />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Notes for Customer</label>
                <textarea style={textareaStyle} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any notes visible to the customer..." />
              </div>
              <div>
                <label style={labelStyle}>Internal Notes</label>
                <textarea style={textareaStyle} value={formData.internalNotes} onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })} placeholder="Internal notes (not visible to customer)..." />
              </div>
            </div>
          </div>

          {/* Quote Summary */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: '0 0 16px' }}>Quote Summary</h3>
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: 20, border: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#6B7280' }}>Subtotal</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{fmt(totals.subTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#6B7280' }}>Discount</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#EF4444' }}>-{fmt(totals.totalDiscount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#6B7280' }}>Tax (GST)</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{fmt(totals.totalTax)}</span>
                </div>
                {formData.otherCharges > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, color: '#6B7280' }}>Other Charges</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{fmt(formData.otherCharges)}</span>
                  </div>
                )}
                <div style={{ borderTop: '2px solid #E5E7EB', paddingTop: 14, marginTop: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#1F2937' }}>Grand Total</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#C59C82' }}>{fmt(totals.quotationTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 12, textAlign: 'center' }}>
              Optional items are excluded from the total
            </p>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1F2937', margin: '0 0 16px' }}>Terms & Conditions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Payment Terms</label>
              <textarea style={textareaStyle} value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} placeholder="e.g., 50% advance, 50% on completion" />
            </div>
            <div>
              <label style={labelStyle}>Delivery Terms</label>
              <textarea style={textareaStyle} value={formData.deliveryTerms} onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })} placeholder="e.g., Delivery within 4-6 weeks from order confirmation" />
            </div>
            <div>
              <label style={labelStyle}>Warranty</label>
              <textarea style={textareaStyle} value={formData.warranty} onChange={(e) => setFormData({ ...formData, warranty: e.target.value })} placeholder="e.g., 1 year warranty on materials and workmanship" />
            </div>
            <div>
              <label style={labelStyle}>General Terms</label>
              <textarea style={textareaStyle} value={formData.termsAndConditions} onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })} placeholder="Additional terms and conditions..." />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingBottom: 32 }}>
          <button type="button" onClick={() => navigate('/admin/quotations')} style={{
            padding: '10px 20px', background: '#fff', color: '#6B7280', border: '1px solid #D1D5DB',
            borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button type="submit" disabled={saving} style={{
            padding: '10px 20px', background: '#374151', color: '#fff', border: 'none',
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.6 : 1,
          }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          {!isEditing && (
            <button type="button" disabled={saving} onClick={(e) => handleSubmit(e, true)} style={{
              padding: '10px 20px', background: 'linear-gradient(135deg, #C59C82 0%, #A67B5B 100%)', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, opacity: saving ? 0.6 : 1,
            }}>
              <Send size={16} /> {saving ? 'Sending...' : 'Save & Send'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default NewQuotation
