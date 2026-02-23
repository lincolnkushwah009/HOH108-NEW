import { useState, useEffect, useRef } from 'react'
import { Plus, Receipt, Clock, Check, X, IndianRupee, CreditCard, FileText, Calendar, Eye, Upload, Trash2, Image, File, ExternalLink, Users, CheckCircle, XCircle, UserPlus, DollarSign, MoreVertical } from 'lucide-react'
import { reimbursementsAPI, reimbursementsEnhancedAPI, employeesAPI, projectsAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Avatar, Tabs, Modal, Input, Select, Textarea, Dropdown } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { REIMBURSEMENT_CATEGORIES, REIMBURSEMENT_STATUSES, PAYMENT_METHODS } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'

const API_BASE = import.meta.env.PROD ? 'https://hoh108.com' : `http://${window.location.hostname}:5001`

// Extended status for 3-level workflow
const WORKFLOW_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  pending_manager: { label: 'Pending Manager', color: 'yellow' },
  pending_hr: { label: 'Pending HR', color: 'blue' },
  pending_final: { label: 'Pending Final', color: 'purple' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  pending_payment: { label: 'Pending Payment', color: 'orange' },
  partially_paid: { label: 'Partially Paid', color: 'teal' },
  paid: { label: 'Paid', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'gray' },
  ...REIMBURSEMENT_STATUSES
}

const Reimbursements = () => {
  const { user } = useAuth()
  const [reimbursements, setReimbursements] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [stats, setStats] = useState({})
  const [amounts, setAmounts] = useState({})
  const [activeTab, setActiveTab] = useState('pending')

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTagHRModal, setShowTagHRModal] = useState(false)
  const [selectedReimbursement, setSelectedReimbursement] = useState(null)
  const [approvalLevel, setApprovalLevel] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    category: 'travel',
    title: '',
    description: '',
    amount: '',
    expenseDate: '',
    project: '',
    vendor: { name: '', invoiceNumber: '' },
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([])
  const fileInputRef = useRef(null)

  // Dropdown data
  const [employees, setEmployees] = useState([])
  const [projects, setProjects] = useState([])

  // Action form states
  const [approvalData, setApprovalData] = useState({ comment: '', approvedAmount: '', status: 'approved' })
  const [paymentData, setPaymentData] = useState({ amount: '', paymentMethod: 'bank_transfer', transactionReference: '', notes: '' })
  const [tagHRData, setTagHRData] = useState({ userId: '' })

  useEffect(() => {
    loadReimbursements()
    loadDropdownData()
  }, [activeTab])

  const loadDropdownData = async () => {
    try {
      const [empRes, projRes] = await Promise.all([
        employeesAPI.getAll({ limit: 100 }),
        projectsAPI.getAll({ limit: 100 })
      ])
      setEmployees(empRes.data || [])
      setProjects(projRes.data || [])
    } catch (err) {
      console.error('Failed to load dropdown data:', err)
    }
  }

  const loadReimbursements = async () => {
    setLoading(true)
    try {
      let response
      if (activeTab === 'my-approvals') {
        // Load reimbursements pending current user's approval
        response = await reimbursementsEnhancedAPI.getApprovalsByLevel()
      } else {
        response = await reimbursementsAPI.getAll({ status: activeTab === 'pending' ? 'pending' : activeTab })
      }
      setReimbursements(response.data || [])
      setStats(response.stats || {})
      setAmounts(response.amounts || {})
    } catch (err) {
      console.error('Failed to load reimbursements:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await reimbursementsAPI.create(
        {
          ...formData,
          amount: parseFloat(formData.amount)
        },
        uploadedFiles
      )
      setShowCreateModal(false)
      resetForm()
      loadReimbursements()
    } catch (err) {
      console.error('Failed to create reimbursement:', err)
      setError(err.message || 'Failed to create reimbursement')
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
      const maxSize = 5 * 1024 * 1024 // 5MB
      return validTypes.includes(file.type) && file.size <= maxSize
    })

    if (validFiles.length + uploadedFiles.length > 5) {
      alert('Maximum 5 files allowed')
      return
    }

    setUploadedFiles(prev => [...prev, ...validFiles])
    e.target.value = ''
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/') || file.type?.includes('image')) {
      return <Image className="h-5 w-5 text-amber-600" />
    }
    return <File className="h-5 w-5 text-red-500" />
  }

  // 3-Level Approval Handlers
  const handleApproval = async () => {
    if (!selectedReimbursement) return
    setSaving(true)
    setError('')
    try {
      const data = {
        comment: approvalData.comment,
        ...(approvalData.approvedAmount && { approvedAmount: parseFloat(approvalData.approvedAmount) }),
        status: approvalData.status
      }

      if (approvalLevel === 'manager') {
        await reimbursementsEnhancedAPI.managerApprove(selectedReimbursement._id, data)
      } else if (approvalLevel === 'hr') {
        await reimbursementsEnhancedAPI.hrApprove(selectedReimbursement._id, data)
      } else if (approvalLevel === 'final') {
        await reimbursementsEnhancedAPI.finalApprove(selectedReimbursement._id, data)
      } else {
        // Fallback to old API
        if (approvalData.status === 'approved') {
          await reimbursementsAPI.approve(selectedReimbursement._id, data)
        } else {
          await reimbursementsAPI.reject(selectedReimbursement._id, approvalData.comment)
        }
      }

      setShowApprovalModal(false)
      setApprovalData({ comment: '', approvedAmount: '', status: 'approved' })
      setSelectedReimbursement(null)
      loadReimbursements()
    } catch (err) {
      console.error('Failed to process approval:', err)
      setError(err.message || 'Failed to process approval')
    } finally {
      setSaving(false)
    }
  }

  // Payment Entry Handler
  const handleAddPayment = async () => {
    if (!selectedReimbursement || !paymentData.amount) {
      setError('Please enter payment amount')
      return
    }
    setSaving(true)
    setError('')
    try {
      await reimbursementsEnhancedAPI.addPayment(selectedReimbursement._id, {
        ...paymentData,
        amount: parseFloat(paymentData.amount)
      })
      setShowPaymentModal(false)
      setPaymentData({ amount: '', paymentMethod: 'bank_transfer', transactionReference: '', notes: '' })
      setSelectedReimbursement(null)
      loadReimbursements()
    } catch (err) {
      console.error('Failed to add payment:', err)
      setError(err.message || 'Failed to add payment')
    } finally {
      setSaving(false)
    }
  }

  // Tag HR Handler
  const handleTagHR = async () => {
    if (!selectedReimbursement || !tagHRData.userId) {
      setError('Please select an HR team member')
      return
    }
    setSaving(true)
    setError('')
    try {
      await reimbursementsEnhancedAPI.tagHR(selectedReimbursement._id, { userId: tagHRData.userId })
      setShowTagHRModal(false)
      setTagHRData({ userId: '' })
      setSelectedReimbursement(null)
      loadReimbursements()
    } catch (err) {
      console.error('Failed to tag HR:', err)
      setError(err.message || 'Failed to tag HR')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      category: 'travel',
      title: '',
      description: '',
      amount: '',
      expenseDate: '',
      project: '',
      vendor: { name: '', invoiceNumber: '' },
      notes: '',
    })
    setUploadedFiles([])
    setError('')
  }

  const openApprovalModal = (r, level) => {
    setSelectedReimbursement(r)
    setApprovalLevel(level)
    setApprovalData({ comment: '', approvedAmount: r.amount?.toString() || '', status: 'approved' })
    setShowApprovalModal(true)
  }

  const openPaymentModal = (r) => {
    setSelectedReimbursement(r)
    const balance = (r.approvedAmount || r.amount) - (r.totalPaidAmount || 0)
    setPaymentData({ amount: balance.toString(), paymentMethod: 'bank_transfer', transactionReference: '', notes: '' })
    setShowPaymentModal(true)
  }

  const openTagHRModal = (r) => {
    setSelectedReimbursement(r)
    setTagHRData({ userId: '' })
    setShowTagHRModal(true)
  }

  const openDetailModal = async (r) => {
    try {
      const response = await reimbursementsAPI.getOne(r._id)
      setSelectedReimbursement(response.data)
      setShowDetailModal(true)
    } catch (err) {
      console.error('Failed to load reimbursement details:', err)
    }
  }

  const getApprovalLevel = (r) => {
    if (r.status === 'pending_manager' || r.status === 'pending') return 'manager'
    if (r.status === 'pending_hr') return 'hr'
    if (r.status === 'pending_final') return 'final'
    return null
  }

  const canApprove = (r) => {
    const level = getApprovalLevel(r)
    if (!level) return false
    // Role-based logic
    if (level === 'manager' && (user?.role === 'manager' || user?.role === 'admin' || user?.role === 'super_admin')) return true
    if (level === 'hr' && (user?.role === 'hr' || user?.role === 'admin' || user?.role === 'super_admin')) return true
    if (level === 'final' && (user?.role === 'admin' || user?.role === 'super_admin')) return true
    return user?.role === 'super_admin' || user?.role === 'admin'
  }

  const canPay = (r) => {
    return ['approved', 'pending_payment', 'partially_paid'].includes(r.status) &&
      (user?.role === 'finance' || user?.role === 'admin' || user?.role === 'super_admin')
  }

  const tabs = [
    { id: 'pending', label: 'Pending', count: stats.pending || 0 },
    { id: 'my-approvals', label: 'My Approvals' },
    { id: 'approved', label: 'Approved', count: stats.approved || 0 },
    { id: 'partially_paid', label: 'Partial Payment' },
    { id: 'paid', label: 'Paid', count: stats.paid || 0 },
    { id: 'rejected', label: 'Rejected', count: stats.rejected || 0 },
  ]

  const categoryOptions = Object.entries(REIMBURSEMENT_CATEGORIES).map(([value, { label }]) => ({ value, label }))
  const paymentMethodOptions = Object.entries(PAYMENT_METHODS).map(([value, { label }]) => ({ value, label }))
  const projectOptions = [{ value: '', label: 'No Project' }, ...projects.map(p => ({ value: p._id, label: p.name || p.projectId }))]
  const hrEmployees = employees.filter(e => e.role === 'hr' || e.role === 'admin' || e.role === 'super_admin')

  return (
    <div>
      <PageHeader
        title="Reimbursements"
        description="Manage employee expense reimbursements with 3-level approval"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'HR Management' }, { label: 'Reimbursements' }]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>New Claim</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(amounts.pending || 0)}</p>
              <p className="text-sm text-gray-500">Pending ({stats.pending || 0})</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(amounts.approved || 0)}</p>
              <p className="text-sm text-gray-500">Approved ({stats.approved || 0})</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(amounts.paid || 0)}</p>
              <p className="text-sm text-gray-500">Paid ({stats.paid || 0})</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(amounts.rejected || 0)}</p>
              <p className="text-sm text-gray-500">Rejected ({stats.rejected || 0})</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs tabs={tabs} defaultTab="pending" onChange={setActiveTab} className="mb-6" />

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : reimbursements.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No reimbursements"
            description={`No ${activeTab} reimbursement requests found`}
          />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Employee</Table.Head>
                <Table.Head>Category</Table.Head>
                <Table.Head>Details</Table.Head>
                <Table.Head>Amount</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Payment</Table.Head>
                <Table.Head>Date</Table.Head>
                <Table.Head className="w-12"></Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {reimbursements.map((r) => (
                <Table.Row key={r._id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.employee?.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{r.employee?.name}</p>
                        <p className="text-xs text-gray-500">{r.reimbursementId}</p>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={REIMBURSEMENT_CATEGORIES[r.category]?.color || 'gray'}>
                      {REIMBURSEMENT_CATEGORIES[r.category]?.label || r.category}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div>
                      <p className="font-medium text-gray-900 max-w-[200px] truncate">{r.title}</p>
                      {r.project && (
                        <p className="text-xs text-gray-500">Project: {r.project.name || r.project.projectId}</p>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <p className="font-semibold text-gray-900">{formatCurrency(r.amount)}</p>
                    {r.approvedAmount && r.approvedAmount !== r.amount && (
                      <p className="text-xs text-green-600">Approved: {formatCurrency(r.approvedAmount)}</p>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={WORKFLOW_STATUSES[r.status]?.color || 'gray'}>
                      {WORKFLOW_STATUSES[r.status]?.label || r.status}
                    </Badge>
                    {r.hrTeamTagged?.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3 text-amber-600" />
                        <span className="text-xs text-amber-600">{r.hrTeamTagged.length} HR tagged</span>
                      </div>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {r.payments?.length > 0 || r.totalPaidAmount > 0 ? (
                      <div>
                        <p className="text-sm font-medium text-green-600">
                          {formatCurrency(r.totalPaidAmount || 0)} / {formatCurrency(r.approvedAmount || r.amount)}
                        </p>
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${Math.min(100, ((r.totalPaidAmount || 0) / (r.approvedAmount || r.amount)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <p className="text-sm text-gray-600">{formatDate(r.expenseDate)}</p>
                  </Table.Cell>
                  <Table.Cell>
                    <Dropdown align="right" trigger={<button className="p-1 hover:bg-gray-100 rounded"><MoreVertical className="h-4 w-4 text-gray-400" /></button>}>
                      <Dropdown.Item icon={Eye} onClick={() => openDetailModal(r)}>View Details</Dropdown.Item>
                      {canApprove(r) && (
                        <Dropdown.Item icon={CheckCircle} onClick={() => openApprovalModal(r, getApprovalLevel(r))}>
                          Approve/Reject
                        </Dropdown.Item>
                      )}
                      {canPay(r) && (
                        <Dropdown.Item icon={DollarSign} onClick={() => openPaymentModal(r)}>
                          Add Payment
                        </Dropdown.Item>
                      )}
                      {['pending_manager', 'pending_hr', 'pending_final', 'pending'].includes(r.status) && (
                        <Dropdown.Item icon={UserPlus} onClick={() => openTagHRModal(r)}>
                          Tag HR Team
                        </Dropdown.Item>
                      )}
                    </Dropdown>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm() }} title="New Reimbursement Claim" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
            <Input
              label="Expense Date"
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Client meeting travel expenses"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Select
              label="Related Project (Optional)"
              options={projectOptions}
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
            />
          </div>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Provide details about the expense..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Vendor/Merchant Name"
              value={formData.vendor.name}
              onChange={(e) => setFormData({ ...formData, vendor: { ...formData.vendor, name: e.target.value } })}
              placeholder="e.g., Uber, Hotel Name"
            />
            <Input
              label="Invoice/Bill Number"
              value={formData.vendor.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, vendor: { ...formData.vendor, invoiceNumber: e.target.value } })}
            />
          </div>

          {/* Bill/Receipt Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bills / Receipts <span className="text-gray-400">(Max 5 files, 5MB each)</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf"
              multiple
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload bills or receipts</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP, PDF up to 5MB</p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetForm() }}>Cancel</Button>
            <Button type="submit" loading={saving}>Submit Claim</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Reimbursement Details" size="lg">
        {selectedReimbursement && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={selectedReimbursement.employee?.name} size="lg" />
                <div>
                  <p className="font-semibold text-gray-900">{selectedReimbursement.employee?.name}</p>
                  <p className="text-sm text-gray-500">{selectedReimbursement.employee?.designation}</p>
                </div>
              </div>
              <Badge color={WORKFLOW_STATUSES[selectedReimbursement.status]?.color || 'gray'} size="lg">
                {WORKFLOW_STATUSES[selectedReimbursement.status]?.label || selectedReimbursement.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase">Claim ID</p>
                <p className="font-medium">{selectedReimbursement.reimbursementId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Category</p>
                <Badge color={REIMBURSEMENT_CATEGORIES[selectedReimbursement.category]?.color || 'gray'}>
                  {REIMBURSEMENT_CATEGORIES[selectedReimbursement.category]?.label}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Amount Claimed</p>
                <p className="font-semibold text-lg">{formatCurrency(selectedReimbursement.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Expense Date</p>
                <p className="font-medium">{formatDate(selectedReimbursement.expenseDate)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Title</p>
              <p className="font-medium">{selectedReimbursement.title}</p>
            </div>

            {selectedReimbursement.description && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
                <p className="text-gray-700">{selectedReimbursement.description}</p>
              </div>
            )}

            {/* 3-Level Approval Timeline */}
            <div>
              <h4 className="text-xs text-gray-500 uppercase mb-3">Approval Workflow</h4>
              <div className="space-y-3">
                {['managerApproval', 'hrApproval', 'finalApproval'].map((level) => {
                  const approval = selectedReimbursement[level]
                  const levelLabels = { managerApproval: 'Manager', hrApproval: 'HR', finalApproval: 'Final' }
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        approval?.status === 'approved' ? 'bg-green-100' :
                        approval?.status === 'rejected' ? 'bg-red-100' :
                        approval?.status === 'pending' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {approval?.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {approval?.status === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                        {approval?.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{levelLabels[level]} Approval</p>
                        {approval?.approver && (
                          <p className="text-sm text-gray-500">{approval.approver.name} - {formatDate(approval.actionAt)}</p>
                        )}
                        {approval?.comment && (
                          <p className="text-sm text-gray-600 italic">"{approval.comment}"</p>
                        )}
                      </div>
                      <Badge color={
                        approval?.status === 'approved' ? 'green' :
                        approval?.status === 'rejected' ? 'red' :
                        approval?.status === 'pending' ? 'yellow' : 'gray'
                      } size="sm">
                        {approval?.status || 'Waiting'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Entries */}
            {selectedReimbursement.payments?.length > 0 && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase mb-3">Payment Entries</h4>
                <div className="space-y-2">
                  {selectedReimbursement.payments.map((payment, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-green-700">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-green-600">
                          {PAYMENT_METHODS[payment.paymentMethod]?.label} - {payment.transactionReference}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(payment.paidAt)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-semibold">{formatCurrency(selectedReimbursement.totalPaidAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(selectedReimbursement.balanceAmount || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Receipts/Bills Section */}
            {selectedReimbursement.receipts?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-3">Attached Bills/Receipts</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedReimbursement.receipts.map((receipt, idx) => (
                    <a
                      key={idx}
                      href={`${API_BASE}${receipt.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {receipt.type?.includes('image') ? (
                        <Image className="h-5 w-5 text-amber-600" />
                      ) : (
                        <File className="h-5 w-5 text-red-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{receipt.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(receipt.uploadedAt)}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* HR Team Tagged */}
            {selectedReimbursement.hrTeamTagged?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">HR Team Tagged</p>
                <div className="flex flex-wrap gap-2">
                  {selectedReimbursement.hrTeamTagged.map((tag, idx) => (
                    <Badge key={idx} color="blue" size="sm">{tag.user?.name || 'HR Member'}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>Close</Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal isOpen={showApprovalModal} onClose={() => { setShowApprovalModal(false); setError('') }} title={`${approvalLevel?.charAt(0).toUpperCase() + approvalLevel?.slice(1)} Approval`}>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Claim Amount</p>
            <p className="text-2xl font-semibold">{formatCurrency(selectedReimbursement?.amount || 0)}</p>
            <p className="text-sm text-gray-600 mt-1">{selectedReimbursement?.title}</p>
          </div>

          <Input
            label="Approved Amount (leave blank to approve full amount)"
            type="number"
            step="0.01"
            value={approvalData.approvedAmount}
            onChange={(e) => setApprovalData({ ...approvalData, approvedAmount: e.target.value })}
            placeholder={selectedReimbursement?.amount?.toString()}
          />

          <Textarea
            label="Comment"
            value={approvalData.comment}
            onChange={(e) => setApprovalData({ ...approvalData, comment: e.target.value })}
            rows={2}
            placeholder="Add your comments..."
          />

          <Modal.Footer>
            <Button
              variant="danger"
              onClick={() => { setApprovalData({ ...approvalData, status: 'rejected' }); handleApproval() }}
              loading={saving}
            >
              Reject
            </Button>
            <Button
              onClick={() => { setApprovalData({ ...approvalData, status: 'approved' }); handleApproval() }}
              loading={saving}
            >
              Approve
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => { setShowPaymentModal(false); setError('') }} title="Add Payment Entry">
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Balance to Pay</p>
            <p className="text-2xl font-semibold text-green-700">
              {formatCurrency((selectedReimbursement?.approvedAmount || selectedReimbursement?.amount || 0) - (selectedReimbursement?.totalPaidAmount || 0))}
            </p>
          </div>

          <Input
            label="Payment Amount"
            type="number"
            step="0.01"
            value={paymentData.amount}
            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            required
          />

          <Select
            label="Payment Method"
            options={paymentMethodOptions}
            value={paymentData.paymentMethod}
            onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
          />

          <Input
            label="Transaction Reference"
            value={paymentData.transactionReference}
            onChange={(e) => setPaymentData({ ...paymentData, transactionReference: e.target.value })}
            placeholder="UTR / Cheque No / Reference"
          />

          <Textarea
            label="Notes"
            value={paymentData.notes}
            onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
            rows={2}
          />

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button onClick={handleAddPayment} loading={saving}>Add Payment</Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Tag HR Modal */}
      <Modal isOpen={showTagHRModal} onClose={() => { setShowTagHRModal(false); setError('') }} title="Tag HR Team Member">
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          <Select
            label="Select HR Team Member"
            options={[{ value: '', label: 'Select...' }, ...hrEmployees.map(e => ({ value: e._id, label: e.name }))]}
            value={tagHRData.userId}
            onChange={(e) => setTagHRData({ ...tagHRData, userId: e.target.value })}
          />
          {selectedReimbursement?.hrTeamTagged?.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Already tagged:</p>
              <div className="flex flex-wrap gap-2">
                {selectedReimbursement.hrTeamTagged.map((tag, idx) => (
                  <Badge key={idx} color="blue" size="sm">{tag.user?.name || 'HR Member'}</Badge>
                ))}
              </div>
            </div>
          )}
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTagHRModal(false)}>Cancel</Button>
            <Button onClick={handleTagHR} loading={saving}>Tag HR</Button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  )
}

export default Reimbursements
