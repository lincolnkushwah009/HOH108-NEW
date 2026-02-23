import { useState, useEffect } from 'react'
import { Building2, Upload, Wand2, CheckCircle, Eye, Plus } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const BankReconciliation = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  // New session modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    sessionName: '',
    bankName: '',
    accountNumber: '',
    period: '',
    statementDate: new Date().toISOString().split('T')[0],
  })

  // View session entries
  const [selectedSession, setSelectedSession] = useState(null)
  const [entries, setEntries] = useState([])
  const [entriesLoading, setEntriesLoading] = useState(false)

  // Import statement modal
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState('')

  // Manual match modal
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [matchEntry, setMatchEntry] = useState(null)
  const [matchReference, setMatchReference] = useState('')

  useEffect(() => {
    loadSessions()
  }, [pagination.page, search, statusFilter])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })
      const res = await apiRequest(`/bank-reconciliation?${params}`)
      setSessions(res.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.pages || 1,
      }))
    } catch (err) {
      console.error('Failed to load reconciliation sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async () => {
    if (!formData.bankName || !formData.accountNumber) {
      alert('Please fill in bank name and account number')
      return
    }
    setSaving(true)
    try {
      await apiRequest('/bank-reconciliation', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setShowNewModal(false)
      setFormData({ sessionName: '', bankName: '', accountNumber: '', period: '', statementDate: new Date().toISOString().split('T')[0] })
      loadSessions()
    } catch (err) {
      alert(err.message || 'Failed to create session')
    } finally {
      setSaving(false)
    }
  }

  const viewSession = async (session) => {
    setSelectedSession(session)
    setEntriesLoading(true)
    try {
      const res = await apiRequest(`/bank-reconciliation/${session._id}/entries`)
      setEntries(res.data || [])
    } catch (err) {
      console.error('Failed to load entries:', err)
    } finally {
      setEntriesLoading(false)
    }
  }

  const handleImportStatement = async () => {
    if (!selectedSession || !importData.trim()) return
    setSaving(true)
    try {
      const parsed = JSON.parse(importData)
      await apiRequest(`/bank-reconciliation/${selectedSession._id}/import`, {
        method: 'POST',
        body: JSON.stringify({ entries: Array.isArray(parsed) ? parsed : [parsed] }),
      })
      setShowImportModal(false)
      setImportData('')
      viewSession(selectedSession)
    } catch (err) {
      alert(err.message || 'Failed to import statement. Ensure valid JSON array of entries.')
    } finally {
      setSaving(false)
    }
  }

  const handleAutoMatch = async () => {
    if (!selectedSession) return
    setSaving(true)
    try {
      await apiRequest(`/bank-reconciliation/${selectedSession._id}/auto-match`, {
        method: 'POST',
      })
      viewSession(selectedSession)
    } catch (err) {
      alert(err.message || 'Auto-match failed')
    } finally {
      setSaving(false)
    }
  }

  const handleManualMatch = async () => {
    if (!matchEntry || !matchReference) return
    setSaving(true)
    try {
      await apiRequest(`/bank-reconciliation/${selectedSession._id}/entries/${matchEntry._id}/match`, {
        method: 'POST',
        body: JSON.stringify({ reference: matchReference }),
      })
      setShowMatchModal(false)
      setMatchEntry(null)
      setMatchReference('')
      viewSession(selectedSession)
    } catch (err) {
      alert(err.message || 'Manual match failed')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (sessionId) => {
    if (!window.confirm('Approve this reconciliation session?')) return
    try {
      await apiRequest(`/bank-reconciliation/${sessionId}/approve`, {
        method: 'PUT',
      })
      if (selectedSession && selectedSession._id === sessionId) {
        setSelectedSession(null)
      }
      loadSessions()
    } catch (err) {
      alert(err.message || 'Failed to approve session')
    }
  }

  const openManualMatch = (entry) => {
    setMatchEntry(entry)
    setMatchReference('')
    setShowMatchModal(true)
  }

  const statusColors = {
    draft: 'gray',
    in_progress: 'blue',
    completed: 'green',
    approved: 'green',
  }

  const matchStatusColors = {
    matched: 'green',
    unmatched: 'red',
    partial: 'yellow',
  }

  // Session entries view
  if (selectedSession) {
    return (
      <div>
        <PageHeader
          title={selectedSession.sessionName || 'Reconciliation Session'}
          description={`${selectedSession.bankName} - ${selectedSession.accountNumber}`}
          breadcrumbs={[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Finance' },
            { label: 'Bank Reconciliation', path: '#', onClick: () => setSelectedSession(null) },
            { label: selectedSession.sessionName || 'Session' },
          ]}
          actions={
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" icon={Upload} onClick={() => setShowImportModal(true)}>Import Statement</Button>
              <Button variant="secondary" icon={Wand2} onClick={handleAutoMatch} disabled={saving}>Auto Match</Button>
              {selectedSession.status === 'completed' && (
                <Button icon={CheckCircle} onClick={() => handleApprove(selectedSession._id)}>Approve</Button>
              )}
            </div>
          }
        />

        <Card padding="none">
          {entriesLoading ? (
            <PageLoader />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No statement entries"
              description="Import a bank statement to begin reconciliation"
              actionLabel="Import Statement"
              onAction={() => setShowImportModal(true)}
            />
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Date</Table.Head>
                  <Table.Head>Description</Table.Head>
                  <Table.Head>Debit</Table.Head>
                  <Table.Head>Credit</Table.Head>
                  <Table.Head>Match Status</Table.Head>
                  <Table.Head>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {entries.map((entry) => (
                  <Table.Row key={entry._id}>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: '#374151' }}>{formatDate(entry.date)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{entry.description}</p>
                        {entry.reference && <p style={{ fontSize: 12, color: '#6B7280' }}>Ref: {entry.reference}</p>}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: entry.debit ? '#DC2626' : '#9CA3AF' }}>
                        {entry.debit ? formatCurrency(entry.debit) : '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: entry.credit ? '#16A34A' : '#9CA3AF' }}>
                        {entry.credit ? formatCurrency(entry.credit) : '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={matchStatusColors[entry.matchStatus] || 'gray'}>
                        {entry.matchStatus || 'Unmatched'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      {entry.matchStatus !== 'matched' && (
                        <Button variant="secondary" size="sm" onClick={() => openManualMatch(entry)}>
                          Match
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card>

        {/* Import Statement Modal */}
        <Modal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title="Import Bank Statement"
          description="Paste statement entries as a JSON array"
          size="lg"
        >
          <div style={{ padding: '16px 0' }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Statement Entries (JSON)
            </label>
            <textarea
              style={{
                width: '100%',
                minHeight: 200,
                padding: 12,
                border: '1px solid #D1D5DB',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: 'monospace',
                resize: 'vertical',
              }}
              placeholder={`[{"date": "2025-01-15", "description": "Payment received", "credit": 50000}, ...]`}
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowImportModal(false)}>Cancel</Button>
            <Button onClick={handleImportStatement} disabled={saving}>
              {saving ? 'Importing...' : 'Import'}
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Manual Match Modal */}
        <Modal
          isOpen={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          title="Manual Match"
          description={matchEntry ? `Match entry: ${matchEntry.description}` : ''}
        >
          <div style={{ padding: '16px 0' }}>
            {matchEntry && (
              <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: '#374151' }}>
                  <strong>Date:</strong> {formatDate(matchEntry.date)}
                </p>
                <p style={{ fontSize: 14, color: '#374151' }}>
                  <strong>Amount:</strong> {matchEntry.debit ? `Debit ${formatCurrency(matchEntry.debit)}` : `Credit ${formatCurrency(matchEntry.credit)}`}
                </p>
              </div>
            )}
            <Input
              label="Transaction Reference / Invoice Number"
              placeholder="e.g. INV-001 or TXN-12345"
              value={matchReference}
              onChange={(e) => setMatchReference(e.target.value)}
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMatchModal(false)}>Cancel</Button>
            <Button onClick={handleManualMatch} disabled={saving}>
              {saving ? 'Matching...' : 'Match Entry'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }

  // Session list view
  return (
    <div>
      <PageHeader
        title="Bank Reconciliation"
        description="Reconcile bank statements with accounting records"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Finance' }, { label: 'Bank Reconciliation' }]}
        actions={<Button icon={Plus} onClick={() => setShowNewModal(true)}>New Session</Button>}
      />

      <Card style={{ marginBottom: 16 }} padding="sm">
        <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search sessions..."
            style={{ flex: 1, maxWidth: 320 }}
          />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'approved', label: 'Approved' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No reconciliation sessions"
            description="Create your first bank reconciliation session"
            actionLabel="New Session"
            onAction={() => setShowNewModal(true)}
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Session Name</Table.Head>
                  <Table.Head>Bank</Table.Head>
                  <Table.Head>Period</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Matched %</Table.Head>
                  <Table.Head>Created</Table.Head>
                  <Table.Head>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {sessions.map((session) => {
                  const matchPct = session.totalEntries > 0
                    ? Math.round((session.matchedEntries / session.totalEntries) * 100)
                    : 0
                  return (
                    <Table.Row key={session._id}>
                      <Table.Cell>
                        <button
                          onClick={() => viewSession(session)}
                          style={{ fontSize: 14, fontWeight: 500, color: '#C59C82', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {session.sessionName || `Session ${session._id?.slice(-6)}`}
                        </button>
                      </Table.Cell>
                      <Table.Cell>
                        <div>
                          <p style={{ fontSize: 14, color: '#111827' }}>{session.bankName}</p>
                          <p style={{ fontSize: 12, color: '#6B7280' }}>{session.accountNumber}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: 14, color: '#6B7280' }}>{session.period || '-'}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={statusColors[session.status] || 'gray'}>
                          {(session.status || 'draft').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 3, maxWidth: 80 }}>
                            <div style={{
                              width: `${matchPct}%`,
                              height: '100%',
                              background: matchPct === 100 ? '#16A34A' : '#C59C82',
                              borderRadius: 3,
                            }} />
                          </div>
                          <span style={{ fontSize: 13, color: '#374151' }}>{matchPct}%</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: 14, color: '#6B7280' }}>{formatDate(session.createdAt)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button variant="secondary" size="sm" icon={Eye} onClick={() => viewSession(session)}>View</Button>
                          {session.status === 'completed' && (
                            <Button size="sm" icon={CheckCircle} onClick={() => handleApprove(session._id)}>Approve</Button>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
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

      {/* New Session Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Reconciliation Session"
        description="Create a new bank reconciliation session"
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Session Name"
              placeholder="e.g. Jan 2025 - HDFC Current"
              value={formData.sessionName}
              onChange={(e) => setFormData({ ...formData, sessionName: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Bank Name"
              placeholder="e.g. HDFC Bank"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Account Number"
              placeholder="e.g. 50200012345678"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Period (Month)"
              type="month"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Statement Date"
              type="date"
              value={formData.statementDate}
              onChange={(e) => setFormData({ ...formData, statementDate: e.target.value })}
            />
          </div>
        </div>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleCreateSession} disabled={saving}>
            {saving ? 'Creating...' : 'Create Session'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default BankReconciliation
