import { useState, useEffect } from 'react'
import { FileText, Plus, Eye } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const GSTReturns = () => {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showPrepareModal, setShowPrepareModal] = useState(false)
  const [showHSNModal, setShowHSNModal] = useState(false)
  const [hsnSummary, setHsnSummary] = useState([])
  const [hsnLoading, setHsnLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - i,
    label: String(currentYear - i),
  }))

  useEffect(() => {
    loadReturns()
  }, [pagination.page, search])

  const loadReturns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      })
      if (search) params.set('search', search)

      const response = await apiRequest(`/gst/gstr1?${params.toString()}`)
      setReturns(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || response.total || 0,
        totalPages: response.pagination?.pages || response.totalPages || 1,
      }))
    } catch (err) {
      console.error('Failed to load GST returns:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrepare = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await apiRequest('/gst/gstr1/prepare', {
        method: 'POST',
        body: JSON.stringify({
          month: Number(formData.month),
          year: Number(formData.year),
        }),
      })
      setShowPrepareModal(false)
      setFormData({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
      loadReturns()
    } catch (err) {
      console.error('Failed to prepare GSTR-1:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleViewHSN = async (returnId) => {
    setHsnLoading(true)
    setShowHSNModal(true)
    setHsnSummary([])
    try {
      const response = await apiRequest(`/gst/gstr1/${returnId}/hsn-summary`)
      setHsnSummary(response.data || response.hsnSummary || [])
    } catch (err) {
      console.error('Failed to load HSN summary:', err)
    } finally {
      setHsnLoading(false)
    }
  }

  const statusColors = {
    draft: 'yellow',
    filed: 'green',
    amended: 'blue',
    pending: 'yellow',
  }

  const formatPeriod = (item) => {
    if (item.period) return item.period
    const monthName = months.find(m => m.value === item.month)?.label || item.month
    return `${monthName} ${item.year}`
  }

  return (
    <div>
      <PageHeader
        title="GST Returns"
        description="GSTR-1 preparation and management"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Compliance', path: '/admin/compliance' },
          { label: 'GST Returns' },
        ]}
        actions={
          <Button icon={Plus} onClick={() => setShowPrepareModal(true)}>
            Prepare GSTR-1
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
              placeholder="Search returns..."
            />
          </div>
        </Card.Content>
      </Card>

      {/* Returns Table */}
      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : returns.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No GST returns found"
            description="Prepare your first GSTR-1 to get started"
            action={() => setShowPrepareModal(true)}
            actionLabel="Prepare GSTR-1"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>Period</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Total Taxable</Table.Head>
                  <Table.Head>Total Tax</Table.Head>
                  <Table.Head>Items</Table.Head>
                  <Table.Head style={{ width: '140px' }}>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {returns.map((ret) => (
                  <Table.Row key={ret._id}>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
                        {formatPeriod(ret)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="purple">
                        {ret.type || 'GSTR-1'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[ret.status] || 'gray'}>
                        {ret.status?.toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                        {formatCurrency(ret.totalTaxableValue || ret.totalTaxable || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        {formatCurrency(ret.totalTaxAmount || ret.totalTax || 0)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', color: '#475569' }}>
                        {ret.itemCount || ret.items?.length || 0}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewHSN(ret._id)}
                      >
                        HSN Summary
                      </Button>
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

      {/* Prepare GSTR-1 Modal */}
      <Modal isOpen={showPrepareModal} onClose={() => setShowPrepareModal(false)} title="Prepare GSTR-1">
        <form onSubmit={handlePrepare}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
              Select the period to prepare GSTR-1 return. This will aggregate all sales invoices for the selected month.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select
                label="Month"
                options={months.map(m => ({ value: m.value, label: m.label }))}
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              />
              <Select
                label="Year"
                options={years}
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: '#EFF6FF',
              borderRadius: '8px',
              border: '1px solid #BFDBFE',
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#1E40AF' }}>
                The system will compile all B2B and B2C invoices for the selected period, calculate HSN-wise summary, and prepare the return in GSTR-1 format.
              </p>
            </div>
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPrepareModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Prepare Return</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* HSN Summary Modal */}
      <Modal
        isOpen={showHSNModal}
        onClose={() => { setShowHSNModal(false); setHsnSummary([]) }}
        title="HSN Summary"
        size="lg"
      >
        {hsnLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <PageLoader />
          </div>
        ) : hsnSummary.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <p>No HSN data available for this return.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>HSN Code</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Description</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Quantity</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Taxable Value</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>CGST</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>SGST</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>IGST</th>
                </tr>
              </thead>
              <tbody>
                {hsnSummary.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '500', color: '#C59C82' }}>{item.hsnCode}</td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>{item.description || '-'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{item.quantity || 0}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '500', color: '#1e293b' }}>{formatCurrency(item.taxableValue || 0)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.cgst || 0)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.sgst || 0)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#475569' }}>{formatCurrency(item.igst || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowHSNModal(false); setHsnSummary([]) }}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default GSTReturns
