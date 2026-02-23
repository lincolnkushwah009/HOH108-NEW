import { useState, useEffect } from 'react'
import { Plus, Eye, FileText, CheckCircle, XCircle, Clock, Send, Download, MoreVertical, Printer, Edit } from 'lucide-react'
import { employeeLettersAPI, employeesAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Avatar, SearchInput, Pagination, Dropdown, Modal, Input, Select, Tabs, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'

const LETTER_TYPES = [
  { value: 'relieving_letter', label: 'Relieving Letter' },
  { value: 'experience_letter', label: 'Experience Letter' },
  { value: 'bonafide_certificate', label: 'Bonafide Certificate' },
  { value: 'salary_certificate', label: 'Salary Certificate' },
  { value: 'warning_letter', label: 'Warning Letter' },
  { value: 'termination_letter', label: 'Termination Letter' },
  { value: 'appreciation_letter', label: 'Appreciation Letter' },
  { value: 'promotion_letter', label: 'Promotion Letter' },
  { value: 'working_certificate', label: 'Working Certificate' },
  { value: 'noc_letter', label: 'No Objection Certificate' },
  { value: 'address_proof_letter', label: 'Address Proof Letter' },
  { value: 'custom', label: 'Custom Letter' }
]

const STATUS_COLORS = {
  draft: 'gray',
  pending_approval: 'yellow',
  approved: 'green',
  rejected: 'red',
  issued: 'blue',
  acknowledged: 'teal'
}

const STATUS_LABELS = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  issued: 'Issued',
  acknowledged: 'Acknowledged'
}

const EmployeeLetters = () => {
  const { user } = useAuth()
  const [letters, setLetters] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [activeTab, setActiveTab] = useState('all')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)

  const [selectedLetter, setSelectedLetter] = useState(null)
  const [letterTemplate, setLetterTemplate] = useState('')
  const [formData, setFormData] = useState({
    employee: '',
    letterType: 'experience_letter',
    subject: '',
    content: '',
    templateFields: {},
    requiresApproval: true
  })
  const [approvalComment, setApprovalComment] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  useEffect(() => {
    loadLetters()
    loadEmployees()
  }, [pagination.page, search, statusFilter, typeFilter, activeTab])

  const loadLetters = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit, search }
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.letterType = typeFilter
      if (activeTab === 'pending') params.status = 'pending_approval'

      const response = await employeeLettersAPI.getAll(params)
      setLetters(response.data || [])
      setPagination(prev => ({ ...prev, total: response.total || 0, totalPages: response.totalPages || 0 }))
    } catch (err) {
      console.error('Failed to load letters:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.getAll({ limit: 100 })
      setEmployees(response.data || [])
    } catch (err) {
      console.error('Failed to load employees:', err)
    }
  }

  const loadTemplate = async (letterType) => {
    setLoadingTemplate(true)
    try {
      const response = await employeeLettersAPI.getTemplate(letterType)
      setLetterTemplate(response.data?.template || '')
      // Set default template fields
      const defaultFields = {}
      const fieldMatches = response.data?.template?.match(/\{\{(\w+)\}\}/g) || []
      fieldMatches.forEach(match => {
        const field = match.replace(/\{\{|\}\}/g, '')
        defaultFields[field] = ''
      })
      setFormData(prev => ({ ...prev, templateFields: defaultFields, content: response.data?.template || '' }))
    } catch (err) {
      console.error('Failed to load template:', err)
    } finally {
      setLoadingTemplate(false)
    }
  }

  const handleLetterTypeChange = (type) => {
    setFormData(prev => ({ ...prev, letterType: type }))
    if (type !== 'custom') {
      loadTemplate(type)
    } else {
      setLetterTemplate('')
      setFormData(prev => ({ ...prev, content: '', templateFields: {} }))
    }
  }

  const handleEmployeeChange = async (employeeId) => {
    setFormData(prev => ({ ...prev, employee: employeeId }))
    // Auto-fill template fields with employee data
    const emp = employees.find(e => e._id === employeeId)
    if (emp && formData.letterType !== 'custom') {
      const filledFields = { ...formData.templateFields }
      if (filledFields.hasOwnProperty('employeeName')) filledFields.employeeName = emp.name
      if (filledFields.hasOwnProperty('employeeId')) filledFields.employeeId = emp.employeeId
      if (filledFields.hasOwnProperty('designation')) filledFields.designation = emp.designation
      if (filledFields.hasOwnProperty('department')) filledFields.department = emp.department?.name
      if (filledFields.hasOwnProperty('dateOfJoining')) filledFields.dateOfJoining = emp.hrDetails?.dateOfJoining ? formatDate(emp.hrDetails.dateOfJoining) : ''
      setFormData(prev => ({ ...prev, templateFields: filledFields }))
    }
  }

  const generatePreview = () => {
    let preview = formData.content
    Object.entries(formData.templateFields).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || `[${key}]`)
    })
    return preview
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const data = {
        ...formData,
        content: generatePreview() // Submit with filled content
      }
      await employeeLettersAPI.create(data)
      setShowCreateModal(false)
      setFormData({
        employee: '',
        letterType: 'experience_letter',
        subject: '',
        content: '',
        templateFields: {},
        requiresApproval: true
      })
      loadLetters()
    } catch (err) {
      console.error('Failed to create letter:', err)
      setError(err.message || 'Failed to create letter')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (id) => {
    try {
      await employeeLettersAPI.submit(id)
      loadLetters()
    } catch (err) {
      console.error('Failed to submit letter:', err)
      alert(err.message || 'Failed to submit letter')
    }
  }

  const handleApprove = async () => {
    setSaving(true)
    setError('')
    try {
      await employeeLettersAPI.approve(selectedLetter._id, { comment: approvalComment })
      setShowApprovalModal(false)
      setSelectedLetter(null)
      loadLetters()
    } catch (err) {
      console.error('Failed to approve letter:', err)
      setError(err.message || 'Failed to approve letter')
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async () => {
    if (!approvalComment) {
      setError('Please provide a reason for rejection')
      return
    }
    setSaving(true)
    setError('')
    try {
      await employeeLettersAPI.reject(selectedLetter._id, { reason: approvalComment })
      setShowApprovalModal(false)
      setSelectedLetter(null)
      loadLetters()
    } catch (err) {
      console.error('Failed to reject letter:', err)
      setError(err.message || 'Failed to reject letter')
    } finally {
      setSaving(false)
    }
  }

  const handleIssue = async (id) => {
    try {
      await employeeLettersAPI.issue(id)
      loadLetters()
    } catch (err) {
      console.error('Failed to issue letter:', err)
      alert(err.message || 'Failed to issue letter')
    }
  }

  const handleView = async (id) => {
    try {
      const response = await employeeLettersAPI.getOne(id)
      setSelectedLetter(response.data)
      setShowViewModal(true)
    } catch (err) {
      console.error('Failed to load letter:', err)
    }
  }

  const handlePreview = async (letter) => {
    setSelectedLetter(letter)
    setShowPreviewModal(true)
  }

  const openApprovalModal = (letter) => {
    setSelectedLetter(letter)
    setApprovalComment('')
    setShowApprovalModal(true)
  }

  const handlePrint = (letter) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${letter.subject || LETTER_TYPES.find(t => t.value === letter.letterType)?.label}</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .letterhead { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .content { line-height: 1.8; text-align: justify; }
          .date { text-align: right; margin-bottom: 30px; }
          .signature { margin-top: 50px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="letterhead">
          <h2>Interior Plus</h2>
          <p>Company Address Line 1<br>City, State - PIN</p>
        </div>
        <div class="date">Date: ${formatDate(letter.issuedAt || new Date())}</div>
        <div class="content">${letter.content?.replace(/\n/g, '<br>') || ''}</div>
        <div class="signature">
          <p>Authorized Signatory</p>
          <p>HR Department</p>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const canApprove = () => {
    return user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'hr'
  }

  const tabs = [
    { id: 'all', label: 'All Letters' },
    { id: 'pending', label: 'Pending Approval' },
  ]

  return (
    <div>
      <PageHeader
        title="Employee Letters"
        description="Generate and manage HR letters and certificates"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Employee Letters' }]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>New Letter</Button>}
      />

      <Tabs tabs={tabs} defaultTab="all" onChange={setActiveTab} className="mb-6" />

      <Card className="mb-6" padding="sm">
        <div className="p-4 flex gap-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search letters..." className="flex-1 max-w-md" />
          <Select
            options={[{ value: '', label: 'All Types' }, ...LETTER_TYPES]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-48"
          />
          <Select
            options={[{ value: '', label: 'All Status' }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : letters.length === 0 ? (
          <EmptyState title="No letters found" description="Create your first letter" action={() => setShowCreateModal(true)} actionLabel="New Letter" />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Letter ID</Table.Head>
                  <Table.Head>Employee</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Subject</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Created</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {letters.map((letter) => (
                  <Table.Row key={letter._id}>
                    <Table.Cell>
                      <span className="font-mono text-sm text-gray-900">{letter.letterId}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Avatar name={letter.employee?.name} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{letter.employee?.name}</p>
                          <p className="text-xs text-gray-500">{letter.employee?.employeeId}</p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {LETTER_TYPES.find(t => t.value === letter.letterType)?.label || letter.letterType}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-600 truncate max-w-[200px] block">
                        {letter.subject || '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={STATUS_COLORS[letter.status]} size="sm">
                        {STATUS_LABELS[letter.status]}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(letter.createdAt)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown align="right" trigger={<button className="p-1 hover:bg-gray-100 rounded"><MoreVertical className="h-4 w-4 text-gray-400" /></button>}>
                        <Dropdown.Item icon={Eye} onClick={() => handleView(letter._id)}>View Details</Dropdown.Item>
                        <Dropdown.Item icon={FileText} onClick={() => handlePreview(letter)}>Preview Letter</Dropdown.Item>
                        {letter.status === 'draft' && (
                          <Dropdown.Item icon={Send} onClick={() => handleSubmit(letter._id)}>Submit for Approval</Dropdown.Item>
                        )}
                        {letter.status === 'pending_approval' && canApprove() && (
                          <Dropdown.Item icon={CheckCircle} onClick={() => openApprovalModal(letter)}>Approve/Reject</Dropdown.Item>
                        )}
                        {letter.status === 'approved' && (
                          <Dropdown.Item icon={Send} onClick={() => handleIssue(letter._id)}>Issue Letter</Dropdown.Item>
                        )}
                        {letter.status === 'issued' && (
                          <Dropdown.Item icon={Printer} onClick={() => handlePrint(letter)}>Print Letter</Dropdown.Item>
                        )}
                      </Dropdown>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} />
          </>
        )}
      </Card>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Letter" size="xl">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Employee"
              options={[{ value: '', label: 'Select Employee' }, ...employees.map(e => ({ value: e._id, label: `${e.name} (${e.employeeId})` }))]}
              value={formData.employee}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              required
            />
            <Select
              label="Letter Type"
              options={LETTER_TYPES}
              value={formData.letterType}
              onChange={(e) => handleLetterTypeChange(e.target.value)}
            />
          </div>

          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Letter subject (optional)"
          />

          {loadingTemplate ? (
            <div className="p-4 text-center text-gray-500">Loading template...</div>
          ) : formData.letterType !== 'custom' && Object.keys(formData.templateFields).length > 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Template Fields</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(formData.templateFields).map(([key, value]) => (
                  <Input
                    key={key}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    value={value}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      templateFields: { ...prev.templateFields, [key]: e.target.value }
                    }))}
                    placeholder={`Enter ${key}`}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {formData.letterType === 'custom' && (
            <Textarea
              label="Letter Content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              placeholder="Write your custom letter content here..."
              required
            />
          )}

          {formData.letterType !== 'custom' && letterTemplate && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Preview</label>
                <Button type="button" size="sm" variant="ghost" onClick={() => handlePreview({ content: generatePreview() })}>
                  <Eye className="h-4 w-4 mr-1" /> Full Preview
                </Button>
              </div>
              <div className="p-4 bg-white border rounded-lg max-h-64 overflow-y-auto">
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: generatePreview().replace(/\n/g, '<br>') }} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requiresApproval"
              checked={formData.requiresApproval}
              onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="requiresApproval" className="text-sm text-gray-700">Requires Approval</label>
          </div>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Letter</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedLetter(null) }} title="Letter Details" size="lg">
        {selectedLetter && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar name={selectedLetter.employee?.name} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900">{selectedLetter.employee?.name}</p>
                  <p className="text-sm text-gray-500">{selectedLetter.letterId}</p>
                </div>
              </div>
              <Badge color={STATUS_COLORS[selectedLetter.status]} size="lg">
                {STATUS_LABELS[selectedLetter.status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Letter Type</p>
                <p className="font-medium text-gray-900">
                  {LETTER_TYPES.find(t => t.value === selectedLetter.letterType)?.label}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Subject</p>
                <p className="font-medium text-gray-900">{selectedLetter.subject || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Created By</p>
                <p className="font-medium text-gray-900">{selectedLetter.createdBy?.name}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Created On</p>
                <p className="font-medium text-gray-900">{formatDate(selectedLetter.createdAt)}</p>
              </div>
            </div>

            {/* Approval Info */}
            {selectedLetter.approval && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Approval Status</h4>
                <div className="flex items-center gap-3">
                  {selectedLetter.approval.approvedBy ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-900">Approved by {selectedLetter.approval.approvedBy?.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(selectedLetter.approval.approvedAt)}</p>
                      </div>
                    </>
                  ) : selectedLetter.approval.rejectedBy ? (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-900">Rejected by {selectedLetter.approval.rejectedBy?.name}</p>
                        <p className="text-xs text-gray-500">{selectedLetter.approval.rejectionReason}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <p className="text-sm text-gray-900">Pending approval</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Issue Info */}
            {selectedLetter.issuedAt && (
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700">
                  Issued on {formatDate(selectedLetter.issuedAt)} by {selectedLetter.issuedBy?.name}
                </p>
              </div>
            )}

            {/* Acknowledgment */}
            {selectedLetter.acknowledgment?.acknowledged && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">
                  Acknowledged by employee on {formatDate(selectedLetter.acknowledgment.acknowledgedAt)}
                </p>
              </div>
            )}

            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowViewModal(false); setSelectedLetter(null) }}>Close</Button>
              <Button variant="secondary" onClick={() => handlePreview(selectedLetter)}>Preview</Button>
              {selectedLetter.status === 'issued' && (
                <Button onClick={() => handlePrint(selectedLetter)}>Print</Button>
              )}
            </Modal.Footer>
          </div>
        )}
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => { setShowPreviewModal(false); setSelectedLetter(null) }} title="Letter Preview" size="lg">
        {selectedLetter && (
          <div className="space-y-4">
            <div className="p-8 bg-white border rounded-lg">
              {/* Letterhead */}
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Interior Plus</h2>
                <p className="text-sm text-gray-600">Company Address Line 1</p>
                <p className="text-sm text-gray-600">City, State - PIN Code</p>
              </div>

              {/* Date */}
              <div className="text-right mb-6">
                <p className="text-sm text-gray-600">Date: {formatDate(selectedLetter.issuedAt || new Date())}</p>
              </div>

              {/* Content */}
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedLetter.content?.replace(/\n/g, '<br>') }} />

              {/* Signature */}
              <div className="mt-12 pt-8">
                <p className="text-gray-900">Authorized Signatory</p>
                <p className="text-sm text-gray-600">HR Department</p>
              </div>
            </div>

            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowPreviewModal(false); setSelectedLetter(null) }}>Close</Button>
              {selectedLetter.status === 'issued' && (
                <Button onClick={() => handlePrint(selectedLetter)}>
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
              )}
            </Modal.Footer>
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal isOpen={showApprovalModal} onClose={() => { setShowApprovalModal(false); setSelectedLetter(null); setError('') }} title="Approve/Reject Letter">
        {selectedLetter && (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Letter for</p>
              <p className="font-medium text-gray-900">{selectedLetter.employee?.name}</p>
              <p className="text-sm text-gray-600 mt-1">
                {LETTER_TYPES.find(t => t.value === selectedLetter.letterType)?.label}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => handlePreview(selectedLetter)} className="w-full">
              <Eye className="h-4 w-4 mr-2" /> Preview Letter Content
            </Button>
            <Textarea
              label="Comments (required for rejection)"
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="Add your comments..."
              rows={3}
            />
            <Modal.Footer>
              <Button variant="danger" onClick={handleReject} loading={saving}>
                Reject
              </Button>
              <Button onClick={handleApprove} loading={saving}>
                Approve
              </Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default EmployeeLetters
