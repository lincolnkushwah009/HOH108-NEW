import { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Phone, Mail, MoreVertical, Eye, Edit, Trash2, Key, Upload, FileText, CheckCircle, XCircle, Clock, AlertTriangle, UserCheck, Calendar, Building2, MapPin, File, Image, Download, ExternalLink } from 'lucide-react'
import { employeesAPI, departmentsAPI, companiesAPI, rolesAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Avatar, SearchInput, Pagination, Dropdown, Modal, Input, Select, Tabs, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatPhone } from '../../utils/helpers'
import { USER_ROLES } from '../../utils/constants'

const API_BASE = import.meta.env.PROD ? 'https://hoh108.com' : `http://${window.location.hostname}:5001`

// T-2 Document Types for onboarding
const T2_DOCUMENT_TYPES = [
  { type: 'aadhar_card', label: 'Aadhar Card', required: true },
  { type: 'pan_card', label: 'PAN Card', required: true },
  { type: 'resume', label: 'Resume/CV', required: true },
  { type: 'passport_photo', label: 'Passport Photo', required: true },
  { type: 'education_certificates', label: 'Education Certificates', required: true },
  { type: 'relieving_letter', label: 'Previous Employer Relieving Letter', required: false },
  { type: 'experience_letter', label: 'Experience Letter', required: false },
  { type: 'bank_details', label: 'Bank Passbook/Cancelled Cheque', required: true },
  { type: 'address_proof', label: 'Address Proof', required: true },
  { type: 'offer_letter_signed', label: 'Signed Offer Letter', required: true },
]

const Employees = () => {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [companies, setCompanies] = useState([])

  // Create a memoized department lookup map
  const departmentMap = useMemo(() => {
    const map = {}
    departments.forEach(d => {
      map[d.code] = d.name
    })
    return map
  }, [departments])

  // Helper to get department name from code
  const getDepartmentName = (deptCode) => {
    if (!deptCode) return '-'
    if (typeof deptCode === 'object') return deptCode.name || '-'
    const name = departmentMap[deptCode]
    // Return department name if found, otherwise show the code
    return name || deptCode || '-'
  }
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [activeTab, setActiveTab] = useState('all')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDocumentsModal, setShowDocumentsModal] = useState(false)
  const [showHRDetailsModal, setShowHRDetailsModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'employee', userRole: '', department: '', designation: '', company: '' })
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '', role: '', userRole: '', department: '', designation: '', company: '', isActive: true })
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' })
  const [hrDetailsData, setHRDetailsData] = useState({
    dateOfBirth: '',
    gender: '',
    employmentType: 'probation',
    city: '',
    showroom: '',
    dateOfJoining: '',
    probationEndDate: '',
    personalEmail: '',
    emergencyContact: { name: '', relationship: '', phone: '' },
    currentAddress: { street: '', city: '', state: '', pincode: '' },
    permanentAddress: { street: '', city: '', state: '', pincode: '' }
  })
  const [confirmData, setConfirmData] = useState({ confirmationDate: '', notes: '' })
  const [extendData, setExtendData] = useState({ newEndDate: '', reason: '' })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Document upload
  const [documents, setDocuments] = useState([])
  const [t2Checklist, setT2Checklist] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ documentType: '', documentName: '' })
  const fileInputRef = useRef(null)

  // Probation data
  const [probationDue, setProbationDue] = useState([])

  // Load departments, companies, roles once on mount
  useEffect(() => {
    loadDepartments()
    loadCompanies()
    loadRoles()
  }, [])

  // Load employees when pagination, search, activeTab change
  useEffect(() => {
    loadEmployees()
  }, [pagination.page, search, activeTab])

  useEffect(() => {
    if (activeTab === 'probation') {
      loadProbationDue()
    }
  }, [activeTab])

  const loadDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll()
      console.log('Departments loaded:', response.data?.length, response.data?.slice(0,2))
      setDepartments(response.data || [])
    } catch (err) {
      console.error('Failed to load departments:', err)
    }
  }

  const loadCompanies = async () => {
    try {
      const response = await companiesAPI.getAll()
      setCompanies(response.data || [])
    } catch (err) {
      console.error('Failed to load companies:', err)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await rolesAPI.getAll()
      setRoles(response.data || [])
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit, search }
      if (activeTab === 'probation') {
        params.employmentType = 'probation'
      }
      const response = await employeesAPI.getAll(params)
      setEmployees(response.data || [])
      // Handle both response formats (pagination object or flat)
      const paginationData = response.pagination || response
      setPagination(prev => ({
        ...prev,
        total: paginationData.total || response.total || 0,
        totalPages: paginationData.pages || paginationData.totalPages || response.totalPages || 0
      }))
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadProbationDue = async () => {
    try {
      const response = await employeesAPI.getDueForConfirmation()
      setProbationDue(response.data || [])
    } catch (err) {
      console.error('Failed to load probation due:', err)
    }
  }

  const loadDocuments = async (employeeId) => {
    try {
      const response = await employeesAPI.getDocuments(employeeId)
      setDocuments(response.data || [])
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }

  const loadT2Checklist = async (employeeId) => {
    try {
      const response = await employeesAPI.getT2Checklist(employeeId)
      setT2Checklist(response.data)
    } catch (err) {
      console.error('Failed to load T2 checklist:', err)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      // Clean up form data - remove empty string values for ObjectId fields
      const cleanedData = { ...formData }
      if (!cleanedData.userRole) delete cleanedData.userRole
      if (!cleanedData.company) delete cleanedData.company

      await employeesAPI.create(cleanedData)
      setShowCreateModal(false)
      setFormData({ name: '', email: '', phone: '', password: '', role: 'employee', userRole: '', department: '', designation: '', company: '' })
      loadEmployees()
    } catch (err) {
      console.error('Failed to create employee:', err)
      setError(err.message || 'Failed to create employee')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this employee?')) return
    try {
      await employeesAPI.delete(id)
      loadEmployees()
    } catch (err) {
      console.error('Failed to delete employee:', err)
      alert(err.message || 'Failed to delete employee')
    }
  }

  const handleViewProfile = (employee) => {
    setSelectedEmployee(employee)
    setShowViewModal(true)
  }

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee)
    setEditFormData({
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role || 'viewer',
      userRole: employee.userRole?._id || employee.userRole || '',
      department: employee.department?.code || employee.department || '',
      designation: employee.designation || '',
      company: employee.company?._id || employee.company || '',
      isActive: employee.isActive !== false
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      // Clean up form data - remove empty string values for ObjectId fields
      const cleanedData = { ...editFormData }
      if (!cleanedData.userRole) delete cleanedData.userRole
      if (!cleanedData.company) delete cleanedData.company

      await employeesAPI.update(selectedEmployee._id, cleanedData)
      setShowEditModal(false)
      setSelectedEmployee(null)
      loadEmployees()
    } catch (err) {
      console.error('Failed to update employee:', err)
      setError(err.message || 'Failed to update employee')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePasswordClick = (employee) => {
    setSelectedEmployee(employee)
    setPasswordData({ newPassword: '', confirmPassword: '' })
    setError('')
    setShowPasswordModal(true)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')

    if (!passwordData.newPassword) {
      setError('Please enter a new password')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      await employeesAPI.changePassword(selectedEmployee._id, passwordData.newPassword)
      setShowPasswordModal(false)
      setSelectedEmployee(null)
      setPasswordData({ newPassword: '', confirmPassword: '' })
      alert('Password changed successfully')
    } catch (err) {
      console.error('Failed to change password:', err)
      setError(err.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  // Document Management
  const handleOpenDocuments = async (employee) => {
    setSelectedEmployee(employee)
    await loadDocuments(employee._id)
    await loadT2Checklist(employee._id)
    setShowDocumentsModal(true)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!uploadForm.documentType) {
      alert('Please select a document type')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('documentType', uploadForm.documentType)
      formData.append('documentName', uploadForm.documentName || file.name)

      await employeesAPI.uploadDocument(selectedEmployee._id, formData)
      await loadDocuments(selectedEmployee._id)
      await loadT2Checklist(selectedEmployee._id)
      setUploadForm({ documentType: '', documentName: '' })
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error('Failed to upload document:', err)
      alert(err.message || 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await employeesAPI.deleteDocument(selectedEmployee._id, documentId)
      await loadDocuments(selectedEmployee._id)
      await loadT2Checklist(selectedEmployee._id)
    } catch (err) {
      console.error('Failed to delete document:', err)
      alert(err.message || 'Failed to delete document')
    }
  }

  const handleVerifyDocument = async (documentId) => {
    try {
      await employeesAPI.verifyDocument(selectedEmployee._id, documentId)
      await loadDocuments(selectedEmployee._id)
      await loadT2Checklist(selectedEmployee._id)
    } catch (err) {
      console.error('Failed to verify document:', err)
      alert(err.message || 'Failed to verify document')
    }
  }

  // HR Details
  const handleOpenHRDetails = (employee) => {
    setSelectedEmployee(employee)
    const hr = employee.hrDetails || {}
    setHRDetailsData({
      dateOfBirth: hr.dateOfBirth ? new Date(hr.dateOfBirth).toISOString().split('T')[0] : '',
      gender: hr.gender || '',
      employmentType: hr.employmentType || 'probation',
      city: hr.city || '',
      showroom: hr.showroom || '',
      dateOfJoining: hr.dateOfJoining ? new Date(hr.dateOfJoining).toISOString().split('T')[0] : '',
      probationEndDate: hr.probationEndDate ? new Date(hr.probationEndDate).toISOString().split('T')[0] : '',
      personalEmail: hr.personalEmail || '',
      emergencyContact: hr.emergencyContact || { name: '', relationship: '', phone: '' },
      currentAddress: hr.currentAddress || { street: '', city: '', state: '', pincode: '' },
      permanentAddress: hr.permanentAddress || { street: '', city: '', state: '', pincode: '' }
    })
    setShowHRDetailsModal(true)
  }

  const handleSaveHRDetails = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await employeesAPI.updateHRDetails(selectedEmployee._id, hrDetailsData)
      setShowHRDetailsModal(false)
      loadEmployees()
    } catch (err) {
      console.error('Failed to save HR details:', err)
      setError(err.message || 'Failed to save HR details')
    } finally {
      setSaving(false)
    }
  }

  // Probation Confirmation
  const handleConfirmEmployee = async () => {
    setSaving(true)
    setError('')
    try {
      await employeesAPI.confirmEmployee(selectedEmployee._id, confirmData)
      setShowConfirmModal(false)
      loadEmployees()
      if (activeTab === 'probation') loadProbationDue()
      alert('Employee confirmed successfully!')
    } catch (err) {
      console.error('Failed to confirm employee:', err)
      setError(err.message || 'Failed to confirm employee')
    } finally {
      setSaving(false)
    }
  }

  const handleExtendProbation = async () => {
    if (!extendData.newEndDate || !extendData.reason) {
      alert('Please provide new end date and reason')
      return
    }
    setSaving(true)
    try {
      await employeesAPI.extendProbation(selectedEmployee._id, extendData)
      setShowConfirmModal(false)
      loadEmployees()
      if (activeTab === 'probation') loadProbationDue()
      alert('Probation extended successfully!')
    } catch (err) {
      console.error('Failed to extend probation:', err)
      alert(err.message || 'Failed to extend probation')
    } finally {
      setSaving(false)
    }
  }

  const openConfirmModal = (employee) => {
    setSelectedEmployee(employee)
    setConfirmData({ confirmationDate: new Date().toISOString().split('T')[0], notes: '' })
    setExtendData({ newEndDate: '', reason: '' })
    setShowConfirmModal(true)
  }

  const roleOptions = Object.entries(USER_ROLES).map(([value, { label }]) => ({ value, label }))
  const documentTypeOptions = T2_DOCUMENT_TYPES.map(d => ({ value: d.type, label: d.label }))

  const tabs = [
    { id: 'all', label: 'All Employees' },
    { id: 'probation', label: 'Probation', count: probationDue.length },
  ]

  const getFileIcon = (doc) => {
    if (doc.fileUrl?.includes('.pdf') || doc.mimeType?.includes('pdf')) {
      return <File className="h-5 w-5 text-red-500" />
    }
    return <Image className="h-5 w-5 text-amber-600" />
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage your team members"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Employees' }]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>Add Employee</Button>}
      />

      <Tabs tabs={tabs} defaultTab="all" onChange={setActiveTab} className="mb-6" />

      <Card className="mb-6" padding="sm">
        <div className="p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="max-w-md" />
        </div>
      </Card>

      {activeTab === 'probation' && probationDue.length > 0 && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Probation Review Required</p>
              <p className="text-sm text-yellow-700">{probationDue.length} employee(s) are due for probation confirmation</p>
            </div>
          </div>
        </Card>
      )}

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : employees.length === 0 ? (
          <EmptyState title="No employees found" description="Add your first team member" action={() => setShowCreateModal(true)} actionLabel="Add Employee" />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Employee</Table.Head>
                  <Table.Head>Contact</Table.Head>
                  <Table.Head>Department</Table.Head>
                  <Table.Head>Role</Table.Head>
                  <Table.Head>Status</Table.Head>
                  {activeTab === 'probation' && <Table.Head>Probation End</Table.Head>}
                  <Table.Head>Joined</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {employees.map((emp) => (
                  <Table.Row key={emp._id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.name} src={emp.avatar} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.employeeId}</p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="text-sm">{formatPhone(emp.phone)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="text-sm truncate max-w-[150px]">{emp.email}</span>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-600">{getDepartmentName(emp.department)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={USER_ROLES[emp.role]?.color || 'gray'} size="sm">
                        {USER_ROLES[emp.role]?.label || emp.role}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-col gap-1">
                        <Badge color={emp.isActive ? 'green' : 'red'} dot>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {emp.hrDetails?.employmentType === 'probation' && (
                          <Badge color="yellow" size="sm">Probation</Badge>
                        )}
                      </div>
                    </Table.Cell>
                    {activeTab === 'probation' && (
                      <Table.Cell>
                        <span className="text-sm text-gray-500">
                          {emp.hrDetails?.probationEndDate ? formatDate(emp.hrDetails.probationEndDate) : '-'}
                        </span>
                      </Table.Cell>
                    )}
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDate(emp.createdAt)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown align="right" trigger={<button className="p-1 hover:bg-gray-100 rounded"><MoreVertical className="h-4 w-4 text-gray-400" /></button>}>
                        <Dropdown.Item icon={Eye} onClick={() => handleViewProfile(emp)}>View Profile</Dropdown.Item>
                        <Dropdown.Item icon={Edit} onClick={() => handleEditClick(emp)}>Edit</Dropdown.Item>
                        <Dropdown.Item icon={FileText} onClick={() => handleOpenDocuments(emp)}>Documents</Dropdown.Item>
                        <Dropdown.Item icon={Building2} onClick={() => handleOpenHRDetails(emp)}>HR Details</Dropdown.Item>
                        {emp.hrDetails?.employmentType === 'probation' && (
                          <Dropdown.Item icon={UserCheck} onClick={() => openConfirmModal(emp)}>Confirm Employee</Dropdown.Item>
                        )}
                        <Dropdown.Item icon={Key} onClick={() => handleChangePasswordClick(emp)}>Change Password</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item icon={Trash2} danger onClick={() => handleDelete(emp._id)}>Remove</Dropdown.Item>
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

      {/* Create Employee Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Employee">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
          </div>
          <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Leave empty for default (Welcome@123)" />
          <Input label="Designation" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g., Software Engineer" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="System Role" options={roleOptions} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
            <Select
              label="Permission Role"
              options={[{ value: '', label: 'Select Role' }, ...roles.filter(r => r.isActive).map(r => ({ value: r._id, label: r.roleName }))]}
              value={formData.userRole}
              onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d.code, label: d.name }))]}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
            <Select
              label="Company"
              options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c._id, label: c.name }))]}
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add Employee</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* View Profile Modal */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setSelectedEmployee(null) }} title="Employee Profile" size="lg">
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={selectedEmployee.name} src={selectedEmployee.avatar} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedEmployee.name}</h3>
                <p className="text-gray-500">{selectedEmployee.designation || 'No designation'}</p>
                <div className="flex gap-2 mt-2">
                  <Badge color={selectedEmployee.isActive ? 'green' : 'red'} size="sm">
                    {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {selectedEmployee.hrDetails?.employmentType === 'probation' && (
                    <Badge color="yellow" size="sm">On Probation</Badge>
                  )}
                  {selectedEmployee.hrDetails?.employmentType === 'permanent' && (
                    <Badge color="blue" size="sm">Permanent</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Employee ID</p>
                <p className="font-medium text-gray-900">{selectedEmployee.employeeId || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Role</p>
                <p className="font-medium text-gray-900">{USER_ROLES[selectedEmployee.role]?.label || selectedEmployee.role}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Email</p>
                <p className="font-medium text-gray-900">{selectedEmployee.email}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Phone</p>
                <p className="font-medium text-gray-900">{formatPhone(selectedEmployee.phone) || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Department</p>
                <p className="font-medium text-gray-900">{getDepartmentName(selectedEmployee.department)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Company</p>
                <p className="font-medium text-gray-900">{selectedEmployee.company?.name || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Joined</p>
                <p className="font-medium text-gray-900">{formatDate(selectedEmployee.createdAt)}</p>
              </div>
              {selectedEmployee.hrDetails?.city && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Location</p>
                  <p className="font-medium text-gray-900">{selectedEmployee.hrDetails.city}</p>
                </div>
              )}
            </div>

            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowViewModal(false); setSelectedEmployee(null) }}>Close</Button>
              <Button onClick={() => { setShowViewModal(false); handleOpenDocuments(selectedEmployee) }}>View Documents</Button>
              <Button onClick={() => { setShowViewModal(false); handleEditClick(selectedEmployee) }}>Edit Profile</Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedEmployee(null); setError('') }} title="Edit Employee">
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <Input label="Full Name" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} required />
            <Input label="Phone" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} />
          </div>
          <Input label="Designation" value={editFormData.designation} onChange={(e) => setEditFormData({ ...editFormData, designation: e.target.value })} placeholder="e.g., Software Engineer" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="System Role" options={roleOptions} value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })} />
            <Select
              label="Permission Role"
              options={[{ value: '', label: 'Select Role' }, ...roles.filter(r => r.isActive).map(r => ({ value: r._id, label: r.roleName }))]}
              value={editFormData.userRole}
              onChange={(e) => setEditFormData({ ...editFormData, userRole: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d.code, label: d.name }))]}
              value={editFormData.department}
              onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
            />
            <Select
              label="Company"
              options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c._id, label: c.name }))]}
              value={editFormData.company}
              onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={editFormData.isActive}
              onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active Employee</label>
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedEmployee(null); setError('') }}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Changes</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setSelectedEmployee(null); setError('') }} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {selectedEmployee && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Changing password for:</p>
              <p className="font-medium text-gray-900">{selectedEmployee.name}</p>
              <p className="text-xs text-gray-500">{selectedEmployee.email}</p>
            </div>
          )}
          <Input
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            placeholder="Enter new password"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            placeholder="Confirm new password"
            required
          />
          <p className="text-xs text-gray-500">Password must be at least 6 characters long.</p>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowPasswordModal(false); setSelectedEmployee(null); setError('') }}>Cancel</Button>
            <Button type="submit" loading={saving}>Change Password</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Documents Modal */}
      <Modal isOpen={showDocumentsModal} onClose={() => { setShowDocumentsModal(false); setSelectedEmployee(null); setDocuments([]) }} title="Employee Documents" size="xl">
        {selectedEmployee && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Avatar name={selectedEmployee.name} size="md" />
              <div>
                <p className="font-medium text-gray-900">{selectedEmployee.name}</p>
                <p className="text-sm text-gray-500">{selectedEmployee.employeeId}</p>
              </div>
            </div>

            {/* T-2 Checklist */}
            {t2Checklist && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">T-2 Document Checklist (Onboarding)</h4>
                  <Badge color={t2Checklist.isComplete ? 'green' : 'yellow'} size="sm">
                    {t2Checklist.submittedCount}/{t2Checklist.totalRequired} Submitted
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {t2Checklist.checklist?.map((item) => (
                    <div key={item.type} className="flex items-center gap-2 text-sm">
                      {item.uploaded ? (
                        item.verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-300" />
                      )}
                      <span className={item.uploaded ? 'text-gray-700' : 'text-gray-400'}>
                        {item.label}
                        {item.required && <span className="text-red-500">*</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Section */}
            <div className="p-4 border border-dashed border-gray-300 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Upload New Document</h4>
              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="Document Type"
                  options={[{ value: '', label: 'Select Type' }, ...documentTypeOptions]}
                  value={uploadForm.documentType}
                  onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                />
                <Input
                  label="Document Name (Optional)"
                  value={uploadForm.documentName}
                  onChange={(e) => setUploadForm({ ...uploadForm, documentName: e.target.value })}
                  placeholder="e.g., Aadhar Front"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    disabled={uploading || !uploadForm.documentType}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                  />
                </div>
              </div>
              {uploading && <p className="text-sm text-indigo-600 mt-2">Uploading...</p>}
            </div>

            {/* Documents List */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Uploaded Documents ({documents.length})</h4>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No documents uploaded yet</div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc)}
                        <div>
                          <p className="font-medium text-gray-900">{doc.documentName || doc.documentType}</p>
                          <p className="text-xs text-gray-500">
                            {T2_DOCUMENT_TYPES.find(t => t.type === doc.documentType)?.label || doc.documentType} | Uploaded {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.isVerified ? (
                          <Badge color="green" size="sm">Verified</Badge>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleVerifyDocument(doc._id)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Verify
                          </Button>
                        )}
                        <a
                          href={`${API_BASE}${doc.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowDocumentsModal(false); setSelectedEmployee(null); setDocuments([]) }}>Close</Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>

      {/* HR Details Modal */}
      <Modal isOpen={showHRDetailsModal} onClose={() => { setShowHRDetailsModal(false); setSelectedEmployee(null); setError('') }} title="HR Details" size="lg">
        <form onSubmit={handleSaveHRDetails} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={hrDetailsData.dateOfBirth}
              onChange={(e) => setHRDetailsData({ ...hrDetailsData, dateOfBirth: e.target.value })}
            />
            <Select
              label="Gender"
              options={[{ value: '', label: 'Select' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]}
              value={hrDetailsData.gender}
              onChange={(e) => setHRDetailsData({ ...hrDetailsData, gender: e.target.value })}
            />
            <Select
              label="Employment Type"
              options={[
                { value: 'probation', label: 'Probation' },
                { value: 'permanent', label: 'Permanent' },
                { value: 'contract', label: 'Contract' },
                { value: 'intern', label: 'Intern' },
                { value: 'consultant', label: 'Consultant' }
              ]}
              value={hrDetailsData.employmentType}
              onChange={(e) => setHRDetailsData({ ...hrDetailsData, employmentType: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Joining"
              type="date"
              value={hrDetailsData.dateOfJoining}
              onChange={(e) => setHRDetailsData({ ...hrDetailsData, dateOfJoining: e.target.value })}
            />
            <Input
              label="Probation End Date"
              type="date"
              value={hrDetailsData.probationEndDate}
              onChange={(e) => setHRDetailsData({ ...hrDetailsData, probationEndDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={hrDetailsData.city}
              onChange={(e) => setHRDetailsData({ ...hrDetailsData, city: e.target.value })}
              placeholder="e.g., Bangalore"
            />
            <Input
              label="Showroom/Branch"
              value={hrDetailsData.showroom}
              onChange={(e) => setHRDetailsData({ ...hrDetailsData, showroom: e.target.value })}
              placeholder="e.g., Koramangala"
            />
          </div>

          <Input
            label="Personal Email"
            type="email"
            value={hrDetailsData.personalEmail}
            onChange={(e) => setHRDetailsData({ ...hrDetailsData, personalEmail: e.target.value })}
          />

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Name"
                value={hrDetailsData.emergencyContact?.name || ''}
                onChange={(e) => setHRDetailsData({ ...hrDetailsData, emergencyContact: { ...hrDetailsData.emergencyContact, name: e.target.value } })}
              />
              <Input
                label="Relationship"
                value={hrDetailsData.emergencyContact?.relationship || ''}
                onChange={(e) => setHRDetailsData({ ...hrDetailsData, emergencyContact: { ...hrDetailsData.emergencyContact, relationship: e.target.value } })}
              />
              <Input
                label="Phone"
                value={hrDetailsData.emergencyContact?.phone || ''}
                onChange={(e) => setHRDetailsData({ ...hrDetailsData, emergencyContact: { ...hrDetailsData.emergencyContact, phone: e.target.value } })}
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Current Address</h4>
            <div className="space-y-3">
              <Input
                label="Street"
                value={hrDetailsData.currentAddress?.street || ''}
                onChange={(e) => setHRDetailsData({ ...hrDetailsData, currentAddress: { ...hrDetailsData.currentAddress, street: e.target.value } })}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="City"
                  value={hrDetailsData.currentAddress?.city || ''}
                  onChange={(e) => setHRDetailsData({ ...hrDetailsData, currentAddress: { ...hrDetailsData.currentAddress, city: e.target.value } })}
                />
                <Input
                  label="State"
                  value={hrDetailsData.currentAddress?.state || ''}
                  onChange={(e) => setHRDetailsData({ ...hrDetailsData, currentAddress: { ...hrDetailsData.currentAddress, state: e.target.value } })}
                />
                <Input
                  label="Pincode"
                  value={hrDetailsData.currentAddress?.pincode || ''}
                  onChange={(e) => setHRDetailsData({ ...hrDetailsData, currentAddress: { ...hrDetailsData.currentAddress, pincode: e.target.value } })}
                />
              </div>
            </div>
          </div>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowHRDetailsModal(false); setSelectedEmployee(null); setError('') }}>Cancel</Button>
            <Button type="submit" loading={saving}>Save HR Details</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Confirm/Extend Probation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => { setShowConfirmModal(false); setSelectedEmployee(null); setError('') }} title="Probation Confirmation" size="md">
        {selectedEmployee && (
          <div className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar name={selectedEmployee.name} size="md" />
                <div>
                  <p className="font-medium text-gray-900">{selectedEmployee.name}</p>
                  <p className="text-sm text-gray-500">{selectedEmployee.designation || 'Employee'}</p>
                  {selectedEmployee.hrDetails?.probationEndDate && (
                    <p className="text-xs text-gray-400">Probation ends: {formatDate(selectedEmployee.hrDetails.probationEndDate)}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-b pb-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                Confirm as Permanent Employee
              </h4>
              <div className="space-y-3">
                <Input
                  label="Confirmation Date"
                  type="date"
                  value={confirmData.confirmationDate}
                  onChange={(e) => setConfirmData({ ...confirmData, confirmationDate: e.target.value })}
                />
                <Textarea
                  label="Notes"
                  value={confirmData.notes}
                  onChange={(e) => setConfirmData({ ...confirmData, notes: e.target.value })}
                  placeholder="Performance notes, review comments..."
                  rows={2}
                />
                <Button onClick={handleConfirmEmployee} loading={saving} className="w-full">
                  Confirm Employee
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Extend Probation Period
              </h4>
              <div className="space-y-3">
                <Input
                  label="New Probation End Date"
                  type="date"
                  value={extendData.newEndDate}
                  onChange={(e) => setExtendData({ ...extendData, newEndDate: e.target.value })}
                />
                <Textarea
                  label="Reason for Extension"
                  value={extendData.reason}
                  onChange={(e) => setExtendData({ ...extendData, reason: e.target.value })}
                  placeholder="Reason for extending probation..."
                  rows={2}
                />
                <Button variant="secondary" onClick={handleExtendProbation} loading={saving} className="w-full">
                  Extend Probation
                </Button>
              </div>
            </div>

            <Modal.Footer>
              <Button variant="secondary" onClick={() => { setShowConfirmModal(false); setSelectedEmployee(null); setError('') }}>Cancel</Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Employees
