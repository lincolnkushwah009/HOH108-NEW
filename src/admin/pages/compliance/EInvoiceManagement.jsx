import { useState, useEffect } from 'react'
import { FileText, Plus, XCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const EInvoiceManagement = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [invoiceId, setInvoiceId] = useState('')

  useEffect(() => {
    loadInvoices()
  }, [pagination.page, search])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      })
      if (search) params.set('search', search)

      const response = await apiRequest(`/gst/e-invoices?${params.toString()}`)
      setInvoices(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || response.total || 0,
        totalPages: response.pagination?.pages || response.totalPages || 1,
      }))
    } catch (err) {
      console.error('Failed to load e-invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!invoiceId.trim()) return
    setSaving(true)
    try {
      await apiRequest('/gst/e-invoices/generate', {
        method: 'POST',
        body: JSON.stringify({ invoiceId: invoiceId.trim() }),
      })
      setShowGenerateModal(false)
      setInvoiceId('')
      loadInvoices()
    } catch (err) {
      console.error('Failed to generate e-invoice:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this e-invoice?')) return
    try {
      await apiRequest(`/gst/e-invoices/${id}/cancel`, { method: 'PUT' })
      loadInvoices()
    } catch (err) {
      console.error('Failed to cancel e-invoice:', err)
    }
  }

  const statusColors = {
    generated: 'green',
    cancelled: 'red',
    pending: 'yellow',
    failed: 'red',
  }

  return (
    <div>
      <PageHeader
        title="E-Invoice Management"
        description="GST E-Invoice generation and management"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Compliance', path: '/admin/compliance' },
          { label: 'E-Invoices' },
        ]}
        actions={
          <Button icon={Plus} onClick={() => setShowGenerateModal(true)}>
            Generate E-Invoice
          </Button>
        }
      />

      {/* Search */}
      <Card style={{ marginBottom: '24px' }}>
        <Card.Content style={{ padding: 16 }}>
          <div style={{ maxWidth: '400px' }}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by invoice number, customer, or IRN..."
            />
          </div>
        </Card.Content>
      </Card>

      {/* E-Invoices Table */}
      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No e-invoices found"
            description="Generate your first e-invoice to get started"
            action={() => setShowGenerateModal(true)}
            actionLabel="Generate E-Invoice"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>Invoice No</Table.Head>
                  <Table.Head>Customer</Table.Head>
                  <Table.Head>Amount</Table.Head>
                  <Table.Head>IRN</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Generated Date</Table.Head>
                  <Table.Head style={{ width: '120px' }}>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {invoices.map((inv) => (
                  <Table.Row key={inv._id}>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#C59C82' }}>
                        {inv.invoiceNumber || inv.invoiceNo || 'N/A'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p style={{ margin: 0, fontWeight: '500', color: '#1e293b', fontSize: '14px' }}>
                          {inv.customerName || inv.customer?.name || 'N/A'}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                          {inv.customerGSTIN || inv.customer?.gstin || ''}
                        </p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                        {formatCurrency(inv.totalAmount || inv.amount || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{
                        fontSize: '12px',
                        color: '#64748b',
                        fontFamily: 'monospace',
                        display: 'inline-block',
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {inv.irn || 'Pending'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[inv.status] || 'gray'}>
                        {inv.status?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', color: '#475569' }}>
                        {formatDate(inv.generatedAt || inv.createdAt)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {inv.status === 'generated' && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleCancel(inv._id)}
                          style={{ color: '#ef4444', borderColor: '#fecaca' }}
                        >
                          Cancel
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

      {/* Generate E-Invoice Modal */}
      <Modal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate E-Invoice">
        <form onSubmit={handleGenerate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              Enter the Customer Invoice ID to generate an e-invoice via the GST portal.
            </p>
            <Input
              label="Customer Invoice ID"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="e.g., INV-2024-0042"
              required
            />
            <div style={{
              padding: '12px',
              backgroundColor: '#FEF3C7',
              borderRadius: '8px',
              border: '1px solid #FDE68A',
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#92400E' }}>
                This will generate an IRN (Invoice Reference Number) and QR code for the invoice through the GST e-invoice portal. Make sure the invoice details are correct before proceeding.
              </p>
            </div>
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Generate</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default EInvoiceManagement
