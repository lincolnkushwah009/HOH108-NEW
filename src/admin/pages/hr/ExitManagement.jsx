import { useState, useEffect } from 'react'
import { UserMinus, Plus, CheckSquare, Eye } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { exitManagementAPI } from '../../utils/api'

const CHECKLIST_ITEMS = [
  { key: 'handover', label: 'Work Handover', description: 'Complete handover of ongoing work and documentation' },
  { key: 'itAssets', label: 'IT Assets Return', description: 'Return laptop, phone, access cards, and peripherals' },
  { key: 'accessRevocation', label: 'Access Revocation', description: 'Revoke email, VPN, system, and building access' },
  { key: 'knowledgeTransfer', label: 'Knowledge Transfer', description: 'Complete knowledge transfer sessions with team' },
  { key: 'exitInterview', label: 'Exit Interview', description: 'Conduct exit interview with HR' },
  { key: 'noDues', label: 'No Dues Clearance', description: 'Obtain no-dues certificate from all departments' },
]

const ExitManagement = () => {
  const [exits, setExits] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  // Initiate exit modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    employee: '',
    resignationDate: '',
    lastWorkingDay: '',
    reason: '',
    exitType: 'resignation',
  })

  // View detail modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedExit, setSelectedExit] = useState(null)
  const [checklistState, setChecklistState] = useState({})

  useEffect(() => {
    loadExits()
  }, [pagination.page, search, statusFilter])

  const loadExits = async () => {
    setLoading(true)
    try {
      const res = await exitManagementAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })
      setExits(res.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.pages || 1,
      }))
    } catch (err) {
      console.error('Failed to load exits:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      employee: '',
      resignationDate: '',
      lastWorkingDay: '',
      reason: '',
      exitType: 'resignation',
    })
  }

  const handleCreate = async () => {
    if (!formData.employee || !formData.resignationDate || !formData.lastWorkingDay) {
      alert('Please fill in employee ID, resignation date, and last working day')
      return
    }
    setSaving(true)
    try {
      await exitManagementAPI.create(formData)
      setShowNewModal(false)
      resetForm()
      loadExits()
    } catch (err) {
      alert(err.message || 'Failed to initiate exit')
    } finally {
      setSaving(false)
    }
  }

  const viewDetail = (exit) => {
    setSelectedExit(exit)
    // Initialize checklist state from exit data
    const state = {}
    CHECKLIST_ITEMS.forEach(item => {
      state[item.key] = exit.checklist?.[item.key] || false
    })
    setChecklistState(state)
    setShowDetailModal(true)
  }

  const toggleChecklist = async (key) => {
    if (!selectedExit) return
    const newState = { ...checklistState, [key]: !checklistState[key] }
    setChecklistState(newState)
    try {
      await exitManagementAPI.updateChecklist(selectedExit._id, { checklist: newState })
    } catch (err) {
      console.error('Failed to update checklist:', err)
      // Revert on failure
      setChecklistState(prev => ({ ...prev, [key]: !prev[key] }))
    }
  }

  const handleSettlement = async () => {
    if (!selectedExit) return
    if (!window.confirm('Process final settlement for this employee?')) return
    try {
      await exitManagementAPI.updateFnF(selectedExit._id, {})
      loadExits()
      setShowDetailModal(false)
    } catch (err) {
      alert(err.message || 'Failed to process settlement')
    }
  }

  const statusColors = {
    initiated: 'blue',
    in_progress: 'yellow',
    checklist_pending: 'yellow',
    settlement_pending: 'yellow',
    completed: 'green',
    cancelled: 'gray',
  }

  const ffStatusColors = {
    pending: 'yellow',
    processing: 'blue',
    completed: 'green',
    paid: 'green',
  }

  const exitTypeLabels = {
    resignation: 'Resignation',
    termination: 'Termination',
    retirement: 'Retirement',
    mutual: 'Mutual Separation',
  }

  const completedCount = Object.values(checklistState).filter(Boolean).length

  return (
    <div>
      <PageHeader
        title="Exit Management"
        description="Offboarding process and final settlement management"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'HR' }, { label: 'Exit Management' }]}
        actions={<Button icon={Plus} onClick={() => { resetForm(); setShowNewModal(true) }}>Initiate Exit</Button>}
      />

      <Card style={{ marginBottom: 16 }} padding="sm">
        <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employees..."
            style={{ flex: 1, maxWidth: 320 }}
          />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'initiated', label: 'Initiated' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'settlement_pending', label: 'Settlement Pending' },
              { value: 'completed', label: 'Completed' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : exits.length === 0 ? (
          <EmptyState
            icon={UserMinus}
            title="No exit records"
            description="Initiate an exit process for an employee"
            actionLabel="Initiate Exit"
            onAction={() => { resetForm(); setShowNewModal(true) }}
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Employee</Table.Head>
                  <Table.Head>Department</Table.Head>
                  <Table.Head>Resignation Date</Table.Head>
                  <Table.Head>Last Working Day</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>F&F Status</Table.Head>
                  <Table.Head>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {exits.map((exit) => (
                  <Table.Row key={exit._id}>
                    <Table.Cell>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                          {exit.employee?.name || exit.employee || '-'}
                        </p>
                        <p style={{ fontSize: 12, color: '#6B7280' }}>
                          {exitTypeLabels[exit.exitType] || exit.exitType}
                        </p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: '#374151' }}>
                        {exit.employee?.department?.name || exit.department || '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: '#6B7280' }}>{formatDate(exit.resignationDate)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: 14, color: '#6B7280' }}>{formatDate(exit.lastWorkingDay)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[exit.status] || 'gray'}>
                        {(exit.status || 'initiated').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={ffStatusColors[exit.ffStatus || exit.settlementStatus] || 'yellow'}>
                        {((exit.ffStatus || exit.settlementStatus || 'pending').replace('_', ' ')).replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Button variant="secondary" size="sm" icon={Eye} onClick={() => viewDetail(exit)}>
                        View
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

      {/* Initiate Exit Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Initiate Exit Process"
        description="Start the offboarding process for an employee"
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Input
              label="Employee ID"
              placeholder="Enter employee ID"
              value={formData.employee}
              onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
            />
          </div>
          <div>
            <Select
              label="Exit Type"
              value={formData.exitType}
              onChange={(e) => setFormData({ ...formData, exitType: e.target.value })}
              options={[
                { value: 'resignation', label: 'Resignation' },
                { value: 'termination', label: 'Termination' },
                { value: 'retirement', label: 'Retirement' },
                { value: 'mutual', label: 'Mutual Separation' },
              ]}
            />
          </div>
          <div>
            <Input
              label="Resignation Date"
              type="date"
              value={formData.resignationDate}
              onChange={(e) => setFormData({ ...formData, resignationDate: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Last Working Day"
              type="date"
              value={formData.lastWorkingDay}
              onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea
              label="Reason"
              placeholder="Reason for exit"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Processing...' : 'Initiate Exit'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Exit Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedExit(null) }}
        title={selectedExit ? `Exit: ${selectedExit.employee?.name || selectedExit.employee}` : 'Exit Details'}
        size="lg"
      >
        {selectedExit && (
          <div>
            {/* Employee Info */}
            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>Employee</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{selectedExit.employee?.name || selectedExit.employee}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>Exit Type</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{exitTypeLabels[selectedExit.exitType] || selectedExit.exitType}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>Last Working Day</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{formatDate(selectedExit.lastWorkingDay)}</p>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Offboarding Checklist</h3>
                <span style={{ fontSize: 13, color: '#6B7280' }}>
                  {completedCount} / {CHECKLIST_ITEMS.length} completed
                </span>
              </div>
              <div style={{
                width: '100%',
                height: 6,
                background: '#E5E7EB',
                borderRadius: 3,
                marginBottom: 16,
              }}>
                <div style={{
                  width: `${(completedCount / CHECKLIST_ITEMS.length) * 100}%`,
                  height: '100%',
                  background: completedCount === CHECKLIST_ITEMS.length ? '#16A34A' : '#C59C82',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              {CHECKLIST_ITEMS.map((item) => (
                <div
                  key={item.key}
                  onClick={() => toggleChecklist(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #E5E7EB',
                    marginBottom: 8,
                    cursor: 'pointer',
                    background: checklistState[item.key] ? '#F0FDF4' : '#FFFFFF',
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    border: checklistState[item.key] ? '2px solid #16A34A' : '2px solid #D1D5DB',
                    background: checklistState[item.key] ? '#16A34A' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {checklistState[item.key] && (
                      <CheckSquare size={14} color="#FFFFFF" />
                    )}
                  </div>
                  <div>
                    <p style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: checklistState[item.key] ? '#16A34A' : '#111827',
                      textDecoration: checklistState[item.key] ? 'line-through' : 'none',
                    }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 12, color: '#6B7280' }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* F&F Settlement */}
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Full & Final Settlement</h3>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                {/* Earnings */}
                <div style={{ padding: 16, borderBottom: '1px solid #E5E7EB' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', marginBottom: 8, textTransform: 'uppercase' }}>Earnings</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                    <span style={{ fontSize: 14, color: '#374151' }}>Pending Salary</span>
                    <span style={{ fontSize: 14, color: '#111827', textAlign: 'right' }}>
                      {formatCurrency(selectedExit.settlement?.pendingSalary || 0)}
                    </span>
                    <span style={{ fontSize: 14, color: '#374151' }}>Leave Encashment</span>
                    <span style={{ fontSize: 14, color: '#111827', textAlign: 'right' }}>
                      {formatCurrency(selectedExit.settlement?.leaveEncashment || 0)}
                    </span>
                    <span style={{ fontSize: 14, color: '#374151' }}>Bonus / Gratuity</span>
                    <span style={{ fontSize: 14, color: '#111827', textAlign: 'right' }}>
                      {formatCurrency(selectedExit.settlement?.bonus || 0)}
                    </span>
                    <span style={{ fontSize: 14, color: '#374151' }}>Reimbursements</span>
                    <span style={{ fontSize: 14, color: '#111827', textAlign: 'right' }}>
                      {formatCurrency(selectedExit.settlement?.reimbursements || 0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#16A34A' }}>Total Earnings</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#16A34A' }}>
                      {formatCurrency(
                        (selectedExit.settlement?.pendingSalary || 0) +
                        (selectedExit.settlement?.leaveEncashment || 0) +
                        (selectedExit.settlement?.bonus || 0) +
                        (selectedExit.settlement?.reimbursements || 0)
                      )}
                    </span>
                  </div>
                </div>

                {/* Deductions */}
                <div style={{ padding: 16, borderBottom: '1px solid #E5E7EB' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', marginBottom: 8, textTransform: 'uppercase' }}>Deductions</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                    <span style={{ fontSize: 14, color: '#374151' }}>Notice Period Recovery</span>
                    <span style={{ fontSize: 14, color: '#111827', textAlign: 'right' }}>
                      {formatCurrency(selectedExit.settlement?.noticePeriodRecovery || 0)}
                    </span>
                    <span style={{ fontSize: 14, color: '#374151' }}>Loan Recovery</span>
                    <span style={{ fontSize: 14, color: '#111827', textAlign: 'right' }}>
                      {formatCurrency(selectedExit.settlement?.loanRecovery || 0)}
                    </span>
                    <span style={{ fontSize: 14, color: '#374151' }}>Other Deductions</span>
                    <span style={{ fontSize: 14, color: '#111827', textAlign: 'right' }}>
                      {formatCurrency(selectedExit.settlement?.otherDeductions || 0)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>Total Deductions</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>
                      {formatCurrency(
                        (selectedExit.settlement?.noticePeriodRecovery || 0) +
                        (selectedExit.settlement?.loanRecovery || 0) +
                        (selectedExit.settlement?.otherDeductions || 0)
                      )}
                    </span>
                  </div>
                </div>

                {/* Net Payable */}
                <div style={{ padding: 16, background: '#F9FAFB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Net Payable</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#C59C82' }}>
                      {formatCurrency(
                        ((selectedExit.settlement?.pendingSalary || 0) +
                        (selectedExit.settlement?.leaveEncashment || 0) +
                        (selectedExit.settlement?.bonus || 0) +
                        (selectedExit.settlement?.reimbursements || 0)) -
                        ((selectedExit.settlement?.noticePeriodRecovery || 0) +
                        (selectedExit.settlement?.loanRecovery || 0) +
                        (selectedExit.settlement?.otherDeductions || 0))
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowDetailModal(false); setSelectedExit(null) }}>Close</Button>
          {selectedExit && selectedExit.status !== 'completed' && (
            <Button onClick={handleSettlement}>Process Settlement</Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default ExitManagement
