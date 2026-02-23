import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2, ArrowRightLeft } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const CreditDebitNotes = () => {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  // New note modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    type: 'credit',
    linkedInvoice: '',
    reason: '',
    lineItems: [{ description: '', hsnCode: '', quantity: 1, rate: 0, gstRate: 18 }],
  })

  useEffect(() => {
    loadNotes()
  }, [pagination.page, search, typeFilter])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
      })
      const res = await apiRequest(`/gst/credit-debit-notes?${params}`)
      setNotes(res.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.pages || 1,
      }))
    } catch (err) {
      console.error('Failed to load notes:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'credit',
      linkedInvoice: '',
      reason: '',
      lineItems: [{ description: '', hsnCode: '', quantity: 1, rate: 0, gstRate: 18 }],
    })
  }

  const handleCreateNote = async () => {
    if (!formData.linkedInvoice) {
      alert('Please enter the linked invoice ID')
      return
    }
    const validItems = formData.lineItems.filter(item => item.description && item.rate > 0)
    if (validItems.length === 0) {
      alert('Please add at least one valid line item')
      return
    }
    setSaving(true)
    try {
      await apiRequest('/gst/credit-debit-notes', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          lineItems: validItems.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            rate: Number(item.rate),
            gstRate: Number(item.gstRate),
          })),
        }),
      })
      setShowNewModal(false)
      resetForm()
      loadNotes()
    } catch (err) {
      alert(err.message || 'Failed to create note')
    } finally {
      setSaving(false)
    }
  }

  const handleApplyToInvoice = async (noteId) => {
    if (!window.confirm('Apply this note to the linked invoice?')) return
    try {
      await apiRequest(`/gst/credit-debit-notes/${noteId}/apply`, {
        method: 'POST',
      })
      loadNotes()
    } catch (err) {
      alert(err.message || 'Failed to apply note to invoice')
    }
  }

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', hsnCode: '', quantity: 1, rate: 0, gstRate: 18 }],
    }))
  }

  const removeLineItem = (index) => {
    if (formData.lineItems.length <= 1) return
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }))
  }

  const updateLineItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }))
  }

  const calcLineTotal = (item) => {
    const base = (Number(item.quantity) || 0) * (Number(item.rate) || 0)
    const gst = base * ((Number(item.gstRate) || 0) / 100)
    return base + gst
  }

  const calcGrandTotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + calcLineTotal(item), 0)
  }

  const statusColors = {
    draft: 'gray',
    issued: 'blue',
    applied: 'green',
    cancelled: 'red',
  }

  const noteAmount = (note) => {
    if (note.totalAmount) return note.totalAmount
    if (!note.lineItems) return 0
    return note.lineItems.reduce((sum, item) => {
      const base = (item.quantity || 0) * (item.rate || 0)
      return sum + base + base * ((item.gstRate || 0) / 100)
    }, 0)
  }

  return (
    <div>
      <PageHeader
        title="Credit & Debit Notes"
        description="Manage credit and debit notes linked to invoices"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Finance' }, { label: 'Credit/Debit Notes' }]}
        actions={<Button icon={Plus} onClick={() => { resetForm(); setShowNewModal(true) }}>New Note</Button>}
      />

      <Card style={{ marginBottom: 16 }} padding="sm">
        <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search notes..."
            style={{ flex: 1, maxWidth: 320 }}
          />
          <Select
            options={[
              { value: '', label: 'All Types' },
              { value: 'credit', label: 'Credit Note' },
              { value: 'debit', label: 'Debit Note' },
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : notes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No notes found"
            description="Create your first credit or debit note"
            actionLabel="New Note"
            onAction={() => { resetForm(); setShowNewModal(true) }}
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Note No.</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Customer / Vendor</Table.Head>
                  <Table.Head>Amount</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Date</Table.Head>
                  <Table.Head>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {notes.map((note) => (
                  <Table.Row key={note._id}>
                    <Table.Cell>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                        {note.noteNumber || note._id?.slice(-8)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={note.type === 'credit' ? 'green' : 'red'}>
                        {note.type === 'credit' ? 'Credit Note' : 'Debit Note'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p style={{ fontSize: 14, color: '#111827' }}>{note.customer?.name || note.vendor?.name || '-'}</p>
                        <p style={{ fontSize: 12, color: '#6B7280' }}>Inv: {note.linkedInvoice?.invoiceNumber || note.linkedInvoice || '-'}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, fontWeight: 500, color: note.type === 'credit' ? '#16A34A' : '#DC2626' }}>
                        {formatCurrency(noteAmount(note))}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[note.status] || 'gray'}>
                        {(note.status || 'draft').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: '#6B7280' }}>{formatDate(note.createdAt)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      {note.status !== 'applied' && note.status !== 'cancelled' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={ArrowRightLeft}
                          onClick={() => handleApplyToInvoice(note._id)}
                        >
                          Apply to Invoice
                        </Button>
                      )}
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

      {/* New Note Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Credit / Debit Note"
        description="Create a note to adjust an existing invoice"
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Select
              label="Note Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'credit', label: 'Credit Note' },
                { value: 'debit', label: 'Debit Note' },
              ]}
            />
          </div>
          <div>
            <Input
              label="Linked Invoice ID"
              placeholder="Invoice ID or number"
              value={formData.linkedInvoice}
              onChange={(e) => setFormData({ ...formData, linkedInvoice: e.target.value })}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Reason"
              placeholder="Reason for the note"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Line Items</label>
            <Button variant="secondary" size="sm" icon={Plus} onClick={addLineItem}>Add Item</Button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {formData.lineItems.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.7fr 1fr 0.7fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                <Input
                  label={index === 0 ? 'Description' : undefined}
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                />
                <Input
                  label={index === 0 ? 'HSN Code' : undefined}
                  placeholder="HSN"
                  value={item.hsnCode}
                  onChange={(e) => updateLineItem(index, 'hsnCode', e.target.value)}
                />
                <Input
                  label={index === 0 ? 'Qty' : undefined}
                  type="number"
                  placeholder="1"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                />
                <Input
                  label={index === 0 ? 'Rate' : undefined}
                  type="number"
                  placeholder="0"
                  value={item.rate}
                  onChange={(e) => updateLineItem(index, 'rate', e.target.value)}
                />
                <Select
                  label={index === 0 ? 'GST %' : undefined}
                  value={item.gstRate}
                  onChange={(e) => updateLineItem(index, 'gstRate', e.target.value)}
                  options={[
                    { value: 0, label: '0%' },
                    { value: 5, label: '5%' },
                    { value: 12, label: '12%' },
                    { value: 18, label: '18%' },
                    { value: 28, label: '28%' },
                  ]}
                />
                <button
                  onClick={() => removeLineItem(index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: formData.lineItems.length <= 1 ? 'not-allowed' : 'pointer',
                    padding: 8,
                    opacity: formData.lineItems.length <= 1 ? 0.3 : 1,
                  }}
                  disabled={formData.lineItems.length <= 1}
                >
                  <Trash2 size={16} color="#EF4444" />
                </button>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Total (incl. GST): {formatCurrency(calcGrandTotal())}
            </span>
          </div>
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleCreateNote} disabled={saving}>
            {saving ? 'Creating...' : 'Create Note'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default CreditDebitNotes
