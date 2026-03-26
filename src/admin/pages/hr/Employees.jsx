import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Plus, Phone, Mail, MoreVertical, Eye, Edit, Trash2, Key, Upload, FileText, CheckCircle, XCircle, Clock, AlertTriangle, UserCheck, Calendar, Building2, MapPin, File, Image, Download, ExternalLink, FileSpreadsheet, AlertCircle } from 'lucide-react'
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
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'viewer', userRole: '', department: '', designation: '', company: '',
    empId: '', entity: 'IP', branch: '', region: '', subDepartment: '',
    dateOfJoining: '', employmentType: 'probation', probationEndDate: '',
    dateOfBirth: '', gender: '', bloodGroup: '', nationality: 'Indian',
    personalEmail: '', alternatePhone: '',
    city: '', showroom: '',
    permanentAddress: { street: '', city: '', state: '', pincode: '' },
    currentAddress: { street: '', city: '', state: '', pincode: '' },
    emergencyContact: { name: '', relationship: '', phone: '' },
    bankDetails: { bankName: '', accountNumber: '', ifscCode: '', branch: '' },
    basicSalary: '', hra: '', otherAllowances: '', grossSalary: '', ctc: '',
    aadharNumber: '', panNumber: '', uanNumber: '', pfAccountNumber: '',
  })
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

  // Bulk upload
  const [bulkModal, setBulkModal] = useState({ open: false })
  const [bulkData, setBulkData] = useState({ rows: [], fileName: '', parsing: false })
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkUploading, setBulkUploading] = useState(false)

  // Probation data
  const [probationDue, setProbationDue] = useState([])

  // Load departments, companies, roles once on mount
  useEffect(() => {
    loadDepartments()
    loadCompanies()
    loadRoles()
  }, [])

  // Debounced search: wait 400ms after user stops typing before firing API call
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimerRef = useRef(null)

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(searchTimerRef.current)
  }, [search])

  // Reset to page 1 when search or tab changes, then load
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [debouncedSearch, activeTab])

  // Load employees when page changes (including the reset above)
  useEffect(() => {
    loadEmployees()
  }, [pagination.page, debouncedSearch, activeTab])

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
      const params = { page: pagination.page, limit: pagination.limit }
      if (debouncedSearch) params.search = debouncedSearch
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

      // Build HR details and salary from form
      if (formData.dateOfJoining || formData.city || formData.employmentType) {
        cleanedData.hrDetails = {
          dateOfJoining: formData.dateOfJoining || undefined,
          employmentType: formData.employmentType || 'probation',
          probationEndDate: formData.probationEndDate || undefined,
          dateOfBirth: formData.dateOfBirth || undefined,
          gender: formData.gender || undefined,
          bloodGroup: formData.bloodGroup || undefined,
          nationality: formData.nationality || 'Indian',
          personalEmail: formData.personalEmail || undefined,
          alternatePhone: formData.alternatePhone || undefined,
          city: formData.city || undefined,
          showroom: formData.showroom || undefined,
          permanentAddress: formData.permanentAddress?.street ? formData.permanentAddress : undefined,
          currentAddress: formData.currentAddress?.street ? formData.currentAddress : undefined,
          emergencyContact: formData.emergencyContact?.name ? formData.emergencyContact : undefined,
          bankDetails: formData.bankDetails?.accountNumber ? formData.bankDetails : undefined,
          aadharNumber: formData.aadharNumber || undefined,
          panNumber: formData.panNumber || undefined,
          uanNumber: formData.uanNumber || undefined,
          pfAccountNumber: formData.pfAccountNumber || undefined,
        }
      }
      if (formData.basicSalary) {
        const basic = parseFloat(formData.basicSalary) || 0
        const hra = parseFloat(formData.hra) || 0
        const other = parseFloat(formData.otherAllowances) || 0
        const gross = parseFloat(formData.grossSalary) || (basic + hra + other)
        cleanedData.salary = {
          basicSalary: basic, hra, otherAllowances: other, grossSalary: gross,
          ctc: parseFloat(formData.ctc) || gross,
        }
      }
      cleanedData.empId = formData.empId || undefined
      cleanedData.entity = formData.entity || 'IP'
      cleanedData.branch = formData.branch || undefined
      cleanedData.region = formData.region || undefined
      cleanedData.subDepartment = formData.subDepartment || undefined

      await employeesAPI.create(cleanedData)
      setShowCreateModal(false)
      setFormData({
        name: '', email: '', phone: '', password: '', role: 'viewer', userRole: '', department: '', designation: '', company: '',
        empId: '', entity: 'IP', branch: '', region: '', subDepartment: '',
        dateOfJoining: '', employmentType: 'probation', probationEndDate: '',
        dateOfBirth: '', gender: '', bloodGroup: '', nationality: 'Indian',
        personalEmail: '', alternatePhone: '',
        city: '', showroom: '',
        permanentAddress: { street: '', city: '', state: '', pincode: '' },
        currentAddress: { street: '', city: '', state: '', pincode: '' },
        emergencyContact: { name: '', relationship: '', phone: '' },
        bankDetails: { bankName: '', accountNumber: '', ifscCode: '', branch: '' },
        basicSalary: '', hra: '', otherAllowances: '', grossSalary: '', ctc: '',
        aadharNumber: '', panNumber: '', uanNumber: '', pfAccountNumber: '',
      })
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
      company: employee.entity === 'Both' ? 'both' : (employee.company?._id || employee.company || ''),
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

  // Bulk upload functions
  const downloadEmployeeTemplate = () => {
    const headers = ['Name', 'Email', 'Phone', 'Designation', 'Department', 'Role', 'Employment Type', 'Date of Joining', 'City', 'Gender']
    const sampleRows = [
      ['John Doe', 'john.doe@company.com', '9876543210', 'Sales Executive', 'SALES', 'sales_executive', 'probation', '2026-03-01', 'Bengaluru', 'male'],
      ['Jane Smith', 'jane.smith@company.com', '9876543211', 'Designer', 'DESIGN', 'designer', 'permanent', '2026-02-15', 'Mumbai', 'female'],
    ]
    const csvContent = [headers.join(','), ...sampleRows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'employee_bulk_upload_template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const parseBulkCSV = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const values = []
      let current = ''
      let inQuotes = false
      for (const char of lines[i]) {
        if (char === '"') { inQuotes = !inQuotes; continue }
        if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
        current += char
      }
      values.push(current.trim())
      const row = {}
      headers.forEach((h, idx) => { if (values[idx]) row[h] = values[idx] })
      if (Object.keys(row).length > 0) rows.push(row)
    }
    return rows
  }

  const handleBulkFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }
    setBulkData(prev => ({ ...prev, fileName: file.name, parsing: true }))
    const reader = new FileReader()
    reader.onload = (ev) => {
      const rows = parseBulkCSV(ev.target.result)
      setBulkData({ rows, fileName: file.name, parsing: false })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleBulkUpload = async () => {
    if (bulkData.rows.length === 0) return
    setBulkUploading(true)
    setBulkResult(null)
    try {
      const response = await employeesAPI.bulkUpload(bulkData.rows)
      setBulkResult(response.data || response)
      if ((response.data?.successful || response.successful) > 0) {
        loadEmployees()
      }
    } catch (err) {
      console.error('Bulk upload failed:', err)
      setBulkResult({ successful: 0, failed: bulkData.rows.length, errors: [{ row: 0, error: err.message || 'Upload failed' }] })
    } finally {
      setBulkUploading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Manage your team members"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Employees' }]}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" icon={Upload} onClick={() => { setBulkModal({ open: true }); setBulkData({ rows: [], fileName: '', parsing: false }); setBulkResult(null) }}>
              Bulk Upload
            </Button>
            <Button icon={Plus} onClick={() => setShowCreateModal(true)}>Add Employee</Button>
          </div>
        }
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

      {/* Create Employee Modal - Comprehensive Onboarding Form */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Employee - Onboarding" size="lg">
        <form onSubmit={handleCreate}>
          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Section: Basic Info */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '2px solid #C59C82', paddingBottom: 6 }}>Basic Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Full Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input label="Employee ID" value={formData.empId} onChange={(e) => setFormData({ ...formData, empId: e.target.value })} placeholder="e.g., HOHIP001" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <Input label="Official Email *" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              <Input label="Phone *" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Default: Welcome@123" />
              <Input label="Designation *" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} placeholder="e.g., Sales Executive" />
            </div>
          </div>

          {/* Section: Role & Department */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '2px solid #C59C82', paddingBottom: 6 }}>Role & Department</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="System Role *" options={roleOptions} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
              <Select label="Permission Role" options={[{ value: '', label: 'Select Role' }, ...roles.filter(r => r.isActive).map(r => ({ value: r._id, label: r.roleName }))]} value={formData.userRole} onChange={(e) => setFormData({ ...formData, userRole: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <Select label="Department *" options={[{ value: '', label: 'Select Department' }, ...departments.map(d => ({ value: d.code, label: d.name }))]} value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
              <Select label="Sub-Department" options={[
                { value: '', label: 'Select Sub-Dept' },
                { value: 'pre_sales', label: 'Pre Sales' },
                { value: 'crm', label: 'CRM' },
                { value: 'sales_closure', label: 'Sales Closure' },
                { value: 'design', label: 'Design' },
                { value: 'operations', label: 'Operations' },
                { value: 'finance', label: 'Finance' },
                { value: 'management', label: 'Management' },
              ]} value={formData.subDepartment} onChange={(e) => setFormData({ ...formData, subDepartment: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <Select label="Company" options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c._id, label: c.name })), { value: 'both', label: 'HOH108+IP(Both)' }]} value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
              <Select label="Entity" options={[
                { value: 'IP', label: 'Interior Plus (IP)' },
                { value: 'HOH', label: 'HOH108' },
                { value: 'Both', label: 'Both' },
              ]} value={formData.entity} onChange={(e) => setFormData({ ...formData, entity: e.target.value })} />
            </div>
          </div>

          {/* Section: Location Assignment (Critical for Round-Robin) */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '2px solid #C59C82', paddingBottom: 6 }}>Location Assignment (for Lead Round-Robin)</h4>
            <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, color: '#92400e', fontSize: 12, marginBottom: 12 }}>
              City and Branch determine which leads get auto-assigned to this employee via round-robin.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Select label="City *" options={[
                { value: '', label: 'Select City' },
                { value: 'Bengaluru', label: 'Bengaluru' },
                { value: 'Mysuru', label: 'Mysuru' },
                { value: 'Hyderabad', label: 'Hyderabad' },
              ]} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              <Select label="Branch" options={[
                { value: '', label: 'Select Branch' },
                { value: 'HSR', label: 'HSR Layout' },
                { value: 'Horamavu', label: 'Horamavu' },
                { value: 'Whitefield', label: 'Whitefield' },
                { value: 'Koramangala', label: 'Koramangala' },
                { value: 'Jayanagar', label: 'Jayanagar' },
                { value: 'Mysore', label: 'Mysore' },
                { value: 'Hyderabad', label: 'Hyderabad' },
              ]} value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} />
              <Select label="Region" options={[
                { value: '', label: 'Select Region' },
                { value: 'Karnataka', label: 'Karnataka' },
                { value: 'Telangana', label: 'Telangana' },
              ]} value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 12 }}>
              <Input label="Showroom / Experience Center" value={formData.showroom} onChange={(e) => setFormData({ ...formData, showroom: e.target.value })} placeholder="e.g., HSR Experience Center" />
            </div>
          </div>

          {/* Section: Employment Details */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '2px solid #C59C82', paddingBottom: 6 }}>Employment Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Input label="Date of Joining *" type="date" value={formData.dateOfJoining} onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })} />
              <Select label="Employment Type" options={[
                { value: 'probation', label: 'Probation' },
                { value: 'permanent', label: 'Permanent' },
                { value: 'contract', label: 'Contract' },
                { value: 'intern', label: 'Intern' },
                { value: 'consultant', label: 'Consultant' },
              ]} value={formData.employmentType} onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })} />
              <Input label="Probation End Date" type="date" value={formData.probationEndDate} onChange={(e) => setFormData({ ...formData, probationEndDate: e.target.value })} />
            </div>
          </div>

          {/* Section: Personal Details */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '2px solid #C59C82', paddingBottom: 6 }}>Personal Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <Input label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
              <Select label="Gender" options={[{ value: '', label: 'Select' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} />
              <Select label="Blood Group" options={[{ value: '', label: 'Select' }, { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' }, { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' }, { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' }]} value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} />
              <Input label="Nationality" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <Input label="Personal Email" type="email" value={formData.personalEmail} onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })} />
              <Input label="Alternate Phone" value={formData.alternatePhone} onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })} />
            </div>
          </div>

          {/* Section: Emergency Contact */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '2px solid #C59C82', paddingBottom: 6 }}>Emergency Contact</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Input label="Contact Name" value={formData.emergencyContact.name} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} />
              <Input label="Relationship" value={formData.emergencyContact.relationship} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })} placeholder="e.g., Father, Spouse" />
              <Input label="Phone" value={formData.emergencyContact.phone} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} />
            </div>
          </div>

          {/* Section: Address */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '2px solid #C59C82', paddingBottom: 6 }}>Current Address</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
              <Input label="Street" value={formData.currentAddress.street} onChange={(e) => setFormData({ ...formData, currentAddress: { ...formData.currentAddress, street: e.target.value } })} />
              <Input label="City" value={formData.currentAddress.city} onChange={(e) => setFormData({ ...formData, currentAddress: { ...formData.currentAddress, city: e.target.value } })} />
              <Input label="Pincode" value={formData.currentAddress.pincode} onChange={(e) => setFormData({ ...formData, currentAddress: { ...formData.currentAddress, pincode: e.target.value } })} />
            </div>
          </div>

          {/* Section: Statutory (KYC) */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '2px solid #C59C82', paddingBottom: 6 }}>Statutory & KYC</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Aadhar Number" value={formData.aadharNumber} onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value })} placeholder="12-digit Aadhar" />
              <Input label="PAN Number" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })} placeholder="e.g., ABCDE1234F" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <Input label="UAN Number" value={formData.uanNumber} onChange={(e) => setFormData({ ...formData, uanNumber: e.target.value })} placeholder="Universal Account Number (PF)" />
              <Input label="PF Account Number" value={formData.pfAccountNumber} onChange={(e) => setFormData({ ...formData, pfAccountNumber: e.target.value })} />
            </div>
          </div>

          {/* Section: Bank Details */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '2px solid #C59C82', paddingBottom: 6 }}>Bank Details (for Salary)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Bank Name" value={formData.bankDetails.bankName} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })} />
              <Input label="Account Number" value={formData.bankDetails.accountNumber} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value } })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <Input label="IFSC Code" value={formData.bankDetails.ifscCode} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, ifscCode: e.target.value } })} />
              <Input label="Branch" value={formData.bankDetails.branch} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, branch: e.target.value } })} />
            </div>
          </div>

          {/* Section: Salary */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '2px solid #C59C82', paddingBottom: 6 }}>Salary Structure</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12 }}>
              <Input label="Basic" type="number" value={formData.basicSalary} onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })} placeholder="Monthly" />
              <Input label="HRA" type="number" value={formData.hra} onChange={(e) => setFormData({ ...formData, hra: e.target.value })} />
              <Input label="Other Allowances" type="number" value={formData.otherAllowances} onChange={(e) => setFormData({ ...formData, otherAllowances: e.target.value })} />
              <Input label="Gross Salary" type="number" value={formData.grossSalary} onChange={(e) => setFormData({ ...formData, grossSalary: e.target.value })} />
              <Input label="CTC (Annual)" type="number" value={formData.ctc} onChange={(e) => setFormData({ ...formData, ctc: e.target.value })} />
            </div>
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
              options={[{ value: '', label: 'Select Company' }, ...companies.map(c => ({ value: c._id, label: c.name })), { value: 'both', label: 'HOH108+IP(Both)' }]}
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

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={bulkModal.open}
        onClose={() => setBulkModal({ open: false })}
        title="Bulk Upload Employees"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Step 1: Download Template */}
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#C59C82', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>1</div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Download CSV Template</h4>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              Download the template, fill in your employee data, and upload. The template includes sample rows to guide you.
            </p>
            <Button variant="outline" icon={Download} onClick={downloadEmployeeTemplate} size="sm">
              Download Template
            </Button>
          </div>

          {/* Step 2: Upload CSV */}
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#C59C82', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>2</div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Upload Filled CSV</h4>
            </div>

            {bulkData.rows.length === 0 && !bulkResult ? (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '32px 20px', border: '2px dashed #cbd5e1', borderRadius: '12px',
                cursor: 'pointer', transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#C59C82'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <FileSpreadsheet style={{ width: '40px', height: '40px', color: '#94a3b8', marginBottom: '12px' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#475569' }}>Click to select CSV file</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Maximum 200 employees per upload</p>
                <input type="file" accept=".csv" onChange={handleBulkFileSelect} style={{ display: 'none' }} />
              </label>
            ) : bulkData.rows.length > 0 && !bulkResult ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#ecfdf5', borderRadius: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle style={{ width: '18px', height: '18px', color: '#059669' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}>
                      {bulkData.fileName} — {bulkData.rows.length} employee{bulkData.rows.length > 1 ? 's' : ''} found
                    </span>
                  </div>
                  <button
                    onClick={() => setBulkData({ rows: [], fileName: '', parsing: false })}
                    style={{ fontSize: '13px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                  >
                    Remove
                  </button>
                </div>

                {/* Preview table */}
                <div style={{ maxHeight: '200px', overflow: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#475569', position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>#</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#475569', position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>Name</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#475569', position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>Email</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#475569', position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>Designation</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600', color: '#475569', position: 'sticky', top: 0, backgroundColor: '#f1f5f9' }}>Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkData.rows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 12px', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 12px', color: '#1e293b', fontWeight: '500' }}>{row['Name'] || row.name || '-'}</td>
                          <td style={{ padding: '6px 12px', color: '#64748b' }}>{row['Email'] || row.email || '-'}</td>
                          <td style={{ padding: '6px 12px', color: '#64748b' }}>{row['Designation'] || row.designation || '-'}</td>
                          <td style={{ padding: '6px 12px', color: '#64748b' }}>{row['Department'] || row.department || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkData.rows.length > 10 && (
                    <div style={{ padding: '8px 12px', fontSize: '12px', color: '#94a3b8', textAlign: 'center', backgroundColor: '#f8fafc' }}>
                      ...and {bulkData.rows.length - 10} more rows
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Upload Result */}
          {bulkResult && (
            <div style={{ padding: '16px', borderRadius: '12px', border: '1px solid', borderColor: bulkResult.failed > 0 ? '#fde68a' : '#bbf7d0', backgroundColor: bulkResult.failed > 0 ? '#fffbeb' : '#f0fdf4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {bulkResult.successful > 0 ? (
                  <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
                ) : (
                  <AlertCircle style={{ width: '20px', height: '20px', color: '#dc2626' }} />
                )}
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Upload Complete</h4>
              </div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: bulkResult.errors?.length > 0 ? '12px' : 0 }}>
                <span style={{ fontSize: '13px', color: '#059669', fontWeight: '500' }}>{bulkResult.successful} successful</span>
                {bulkResult.failed > 0 && (
                  <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: '500' }}>{bulkResult.failed} failed</span>
                )}
              </div>
              {bulkResult.errors?.length > 0 && (
                <div style={{ maxHeight: '120px', overflow: 'auto', fontSize: '12px' }}>
                  {bulkResult.errors.map((err, idx) => (
                    <div key={idx} style={{ padding: '4px 0', color: '#dc2626' }}>
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template Info */}
          <div style={{ padding: '12px 16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#1e40af', lineHeight: '1.6' }}>
              <strong>Employee ID is auto-generated.</strong> Default password: <strong>Welcome@123</strong><br />
              <strong>Required columns:</strong> Name*, Email*<br />
              <strong>Optional columns:</strong> Phone, Designation, Department (code), Role (viewer/sales_executive/designer/etc.),
              Employment Type (probation/permanent/contract/intern), Date of Joining (YYYY-MM-DD), City, Gender (male/female/other)
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '4px' }}>
            <Button variant="secondary" onClick={() => setBulkModal({ open: false })}>
              {bulkResult ? 'Close' : 'Cancel'}
            </Button>
            {!bulkResult && bulkData.rows.length > 0 && (
              <Button onClick={handleBulkUpload} loading={bulkUploading} icon={Upload}>
                Upload {bulkData.rows.length} Employee{bulkData.rows.length > 1 ? 's' : ''}
              </Button>
            )}
            {bulkResult && bulkResult.successful > 0 && (
              <Button onClick={() => { setBulkModal({ open: false }); setBulkResult(null) }}>
                Done
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Employees
