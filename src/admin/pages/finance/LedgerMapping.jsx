import { useState, useEffect } from 'react'
import { Plus, Database, Edit2, Trash2, PlusCircle, MinusCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Select, Modal, Input } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { apiRequest } from '../../utils/api'

const MODULE_OPTIONS = [
  { value: 'accounts_payable', label: 'Accounts Payable' },
  { value: 'accounts_receivable', label: 'Accounts Receivable' },
  { value: 'payments', label: 'Payments' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'bank', label: 'Bank' },
  { value: 'gst', label: 'GST' },
  { value: 'tds', label: 'TDS' },
]

const MODULE_EVENT_MAP = {
  accounts_payable: [
    { value: 'vendor_invoice_approved', label: 'Vendor Invoice Approved' },
    { value: 'vendor_invoice_cancelled', label: 'Vendor Invoice Cancelled' },
    { value: 'advance_payment_vendor', label: 'Advance Payment to Vendor' },
  ],
  accounts_receivable: [
    { value: 'customer_invoice_created', label: 'Customer Invoice Created' },
    { value: 'customer_invoice_cancelled', label: 'Customer Invoice Cancelled' },
    { value: 'advance_receipt_customer', label: 'Advance Receipt from Customer' },
    { value: 'credit_note_issued', label: 'Credit Note Issued' },
    { value: 'debit_note_issued', label: 'Debit Note Issued' },
  ],
  payments: [
    { value: 'payment_outgoing_completed', label: 'Payment Outgoing Completed' },
    { value: 'payment_incoming_completed', label: 'Payment Incoming Completed' },
  ],
  payroll: [
    { value: 'payroll_processed', label: 'Payroll Processed' },
  ],
  inventory: [
    { value: 'material_consumed', label: 'Material Consumed' },
    { value: 'material_received', label: 'Material Received' },
  ],
  bank: [],
  gst: [
    { value: 'gst_adjustment', label: 'GST Adjustment' },
  ],
  tds: [
    { value: 'tds_deduction', label: 'TDS Deduction' },
  ],
}

const emptyLine = { accountCode: '', accountName: '', debitFormula: '', creditFormula: '', description: '' }

const LedgerMapping = () => {
  const toast = useToast()
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [modal, setModal] = useState({ show: false, editing: null, data: null })
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    loadMappings()
  }, [filter])

  const loadMappings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.append('module', filter)
      const res = await apiRequest(`/ledger-mappings${params.toString() ? `?${params}` : ''}`)
      setMappings(res.data || [])
    } catch (err) {
      console.error('Failed to load ledger mappings:', err)
      toast.error('Failed to load ledger mappings')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    if (!window.confirm('This will seed default ledger mappings. Existing mappings with the same code will be skipped. Continue?')) return
    setSeeding(true)
    try {
      await apiRequest('/ledger-mappings/seed', { method: 'POST' })
      toast.success('Default mappings seeded successfully')
      loadMappings()
    } catch (err) {
      toast.error(err.message || 'Failed to seed defaults')
    } finally {
      setSeeding(false)
    }
  }

  const openAddModal = () => {
    setModal({
      show: true,
      editing: null,
      data: {
        code: '',
        name: '',
        module: '',
        triggerEvent: '',
        journalLines: [{ ...emptyLine }],
      },
    })
  }

  const openEditModal = (mapping) => {
    setModal({
      show: true,
      editing: mapping._id,
      data: {
        code: mapping.code || '',
        name: mapping.name || '',
        module: mapping.module || '',
        triggerEvent: mapping.triggerEvent || '',
        journalLines: (mapping.journalLines && mapping.journalLines.length > 0)
          ? mapping.journalLines.map(l => ({
              accountCode: l.accountCode || '',
              accountName: l.accountName || '',
              debitFormula: l.debitFormula || '',
              creditFormula: l.creditFormula || '',
              description: l.description || '',
            }))
          : [{ ...emptyLine }],
      },
    })
  }

  const closeModal = () => {
    setModal({ show: false, editing: null, data: null })
  }

  const updateFormField = (field, value) => {
    setModal(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
        ...(field === 'module' ? { triggerEvent: '' } : {}),
      },
    }))
  }

  const updateJournalLine = (index, field, value) => {
    setModal(prev => {
      const lines = [...prev.data.journalLines]
      lines[index] = { ...lines[index], [field]: value }
      return { ...prev, data: { ...prev.data, journalLines: lines } }
    })
  }

  const addJournalLine = () => {
    setModal(prev => ({
      ...prev,
      data: {
        ...prev.data,
        journalLines: [...prev.data.journalLines, { ...emptyLine }],
      },
    }))
  }

  const removeJournalLine = (index) => {
    setModal(prev => {
      const lines = prev.data.journalLines.filter((_, i) => i !== index)
      return { ...prev, data: { ...prev.data, journalLines: lines.length > 0 ? lines : [{ ...emptyLine }] } }
    })
  }

  const handleSave = async () => {
    const { data, editing } = modal
    if (!data.code || !data.name || !data.module || !data.triggerEvent) {
      toast.error('Please fill in all required fields')
      return
    }

    const hasValidLine = data.journalLines.some(l => l.accountCode && (l.debitFormula || l.creditFormula))
    if (!hasValidLine) {
      toast.error('At least one journal line with an account code and a debit or credit formula is required')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await apiRequest(`/ledger-mappings/${editing}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })
        toast.success('Mapping updated successfully')
      } else {
        await apiRequest('/ledger-mappings', {
          method: 'POST',
          body: JSON.stringify(data),
        })
        toast.success('Mapping created successfully')
      }
      closeModal()
      loadMappings()
    } catch (err) {
      toast.error(err.message || 'Failed to save mapping')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ledger mapping? This action cannot be undone.')) return
    try {
      await apiRequest(`/ledger-mappings/${id}`, { method: 'DELETE' })
      toast.success('Mapping deleted')
      loadMappings()
    } catch (err) {
      toast.error(err.message || 'Failed to delete mapping')
    }
  }

  const handleToggleActive = async (id) => {
    try {
      await apiRequest(`/ledger-mappings/${id}/toggle`, { method: 'POST' })
      setMappings(prev => prev.map(m => m._id === id ? { ...m, isActive: !m.isActive } : m))
    } catch (err) {
      toast.error(err.message || 'Failed to toggle active status')
    }
  }

  const getModuleLabel = (value) => {
    const found = MODULE_OPTIONS.find(o => o.value === value)
    return found ? found.label : value
  }

  const getEventLabel = (module, event) => {
    const events = MODULE_EVENT_MAP[module] || []
    const found = events.find(e => e.value === event)
    return found ? found.label : event
  }

  const moduleColors = {
    accounts_payable: 'orange',
    accounts_receivable: 'green',
    payments: 'blue',
    payroll: 'purple',
    inventory: 'teal',
    bank: 'cyan',
    gst: 'yellow',
    tds: 'red',
  }

  const triggerEventOptions = modal.data?.module ? (MODULE_EVENT_MAP[modal.data.module] || []) : []

  return (
    <div>
      <PageHeader
        title="Ledger Activity Mapping"
        description="Configure which accounting entries auto-post when module events occur"
        breadcrumbs={[
          { label: 'Finance', path: '/admin/finance' },
          { label: 'Ledger Mapping' },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              icon={Database}
              onClick={handleSeedDefaults}
              loading={seeding}
            >
              Seed Defaults
            </Button>
            <Button
              icon={Plus}
              onClick={openAddModal}
            >
              Add Mapping
            </Button>
          </>
        }
      />

      {/* Module Filter */}
      <div style={{ marginBottom: '24px', maxWidth: '280px' }}>
        <Select
          placeholder="All Modules"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={MODULE_OPTIONS}
        />
      </div>

      {/* Mappings Table */}
      {loading ? (
        <PageLoader />
      ) : mappings.length === 0 ? (
        <Card>
          <EmptyState
            title="No ledger mappings found"
            description={filter ? 'No mappings match the selected module filter.' : 'Get started by seeding defaults or adding a new mapping.'}
            icon={Database}
          />
        </Card>
      ) : (
        <Card padding="none">
          <Table>
            <Table.Header>
              <Table.Row hover={false}>
                <Table.Head>Code</Table.Head>
                <Table.Head>Name</Table.Head>
                <Table.Head>Module</Table.Head>
                <Table.Head>Trigger Event</Table.Head>
                <Table.Head style={{ textAlign: 'center' }}># Lines</Table.Head>
                <Table.Head style={{ textAlign: 'center' }}>Active</Table.Head>
                <Table.Head style={{ textAlign: 'right' }}>Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {mappings.map(mapping => (
                <Table.Row key={mapping._id}>
                  <Table.Cell>
                    <span style={{ fontFamily: 'monospace', fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>
                      {mapping.code}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span style={{ fontWeight: '500', color: '#1e293b' }}>{mapping.name}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={moduleColors[mapping.module] || 'gray'} size="sm">
                      {getModuleLabel(mapping.module)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {getEventLabel(mapping.module, mapping.triggerEvent)}
                    </span>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: '#FDF8F4',
                      color: '#C59C82',
                      fontWeight: '600',
                      fontSize: '13px',
                    }}>
                      {mapping.journalLines?.length || 0}
                    </span>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleActive(mapping._id)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.3s',
                        background: mapping.isActive ? '#C59C82' : '#e2e8f0',
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '3px',
                        left: mapping.isActive ? '23px' : '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'white',
                        transition: 'all 0.3s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }} />
                    </button>
                  </Table.Cell>
                  <Table.Cell style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(mapping)}
                        style={{
                          padding: '8px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#f1f5f9',
                          cursor: 'pointer',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#FDF8F4'
                          e.currentTarget.style.color = '#C59C82'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f1f5f9'
                          e.currentTarget.style.color = '#64748b'
                        }}
                      >
                        <Edit2 style={{ width: '15px', height: '15px' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(mapping._id)}
                        style={{
                          padding: '8px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#f1f5f9',
                          cursor: 'pointer',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fef2f2'
                          e.currentTarget.style.color = '#dc2626'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f1f5f9'
                          e.currentTarget.style.color = '#64748b'
                        }}
                      >
                        <Trash2 style={{ width: '15px', height: '15px' }} />
                      </button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modal.show}
        onClose={closeModal}
        title={modal.editing ? 'Edit Ledger Mapping' : 'Add Ledger Mapping'}
        description="Define which journal entries are auto-posted for module events"
        size="xl"
      >
        {modal.data && (
          <div>
            {/* Top fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <Input
                label="Mapping Code"
                placeholder="e.g., AP_INV_APPROVE"
                value={modal.data.code}
                onChange={(e) => updateFormField('code', e.target.value)}
              />
              <Input
                label="Name"
                placeholder="e.g., Vendor Invoice Approval"
                value={modal.data.name}
                onChange={(e) => updateFormField('name', e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <Select
                label="Module"
                placeholder="Select module..."
                value={modal.data.module}
                onChange={(e) => updateFormField('module', e.target.value)}
                options={MODULE_OPTIONS}
              />
              <Select
                label="Trigger Event"
                placeholder={modal.data.module ? 'Select event...' : 'Select a module first'}
                value={modal.data.triggerEvent}
                onChange={(e) => updateFormField('triggerEvent', e.target.value)}
                options={triggerEventOptions}
                disabled={!modal.data.module}
              />
            </div>

            {/* Journal Template Lines */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  Journal Template Lines
                </label>
                <button
                  onClick={addJournalLine}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    border: '1px dashed #C59C82',
                    background: '#FDF8F4',
                    color: '#C59C82',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#C59C82'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FDF8F4'
                    e.currentTarget.style.color = '#C59C82'
                  }}
                >
                  <PlusCircle style={{ width: '14px', height: '14px' }} />
                  Add Line
                </button>
              </div>

              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                overflow: 'hidden',
              }}>
                {/* Lines header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr 1fr 1fr 1fr 40px',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Acct Code
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Acct Name
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Debit Formula
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Credit Formula
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Description
                  </span>
                  <span />
                </div>

                {/* Lines rows */}
                {modal.data.journalLines.map((line, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr 1fr 1fr 1fr 40px',
                      gap: '8px',
                      padding: '10px 14px',
                      borderBottom: index < modal.data.journalLines.length - 1 ? '1px solid #f1f5f9' : 'none',
                      background: index % 2 === 0 ? 'white' : '#fafbfc',
                    }}
                  >
                    <input
                      type="text"
                      placeholder="2100"
                      value={line.accountCode}
                      onChange={(e) => updateJournalLine(index, 'accountCode', e.target.value)}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        outline: 'none',
                        fontFamily: 'monospace',
                        background: '#f8fafc',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#C59C82'
                        e.target.style.background = 'white'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0'
                        e.target.style.background = '#f8fafc'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Account Name"
                      value={line.accountName}
                      onChange={(e) => updateJournalLine(index, 'accountName', e.target.value)}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#f8fafc',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#C59C82'
                        e.target.style.background = 'white'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0'
                        e.target.style.background = '#f8fafc'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="sourceDoc.subTotal"
                      value={line.debitFormula}
                      onChange={(e) => updateJournalLine(index, 'debitFormula', e.target.value)}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        outline: 'none',
                        fontFamily: 'monospace',
                        background: '#f8fafc',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#C59C82'
                        e.target.style.background = 'white'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0'
                        e.target.style.background = '#f8fafc'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="sourceDoc.total"
                      value={line.creditFormula}
                      onChange={(e) => updateJournalLine(index, 'creditFormula', e.target.value)}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        outline: 'none',
                        fontFamily: 'monospace',
                        background: '#f8fafc',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#C59C82'
                        e.target.style.background = 'white'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0'
                        e.target.style.background = '#f8fafc'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={line.description}
                      onChange={(e) => updateJournalLine(index, 'description', e.target.value)}
                      style={{
                        padding: '8px 10px',
                        fontSize: '13px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        outline: 'none',
                        background: '#f8fafc',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#C59C82'
                        e.target.style.background = 'white'
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0'
                        e.target.style.background = '#f8fafc'
                      }}
                    />
                    <button
                      onClick={() => removeJournalLine(index)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '6px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#dc2626'
                        e.currentTarget.style.background = '#fef2f2'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#94a3b8'
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <MinusCircle style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Modal.Footer>
              <Button variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {modal.editing ? 'Update Mapping' : 'Create Mapping'}
              </Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default LedgerMapping
