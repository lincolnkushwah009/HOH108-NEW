import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Ticket, ArrowLeft, Tag, AlertCircle, FileText, Send, Save,
  ChevronDown, Info, Building2, User, FolderKanban, Users, Truck, Package, Link2,
  Paperclip, Upload, Image, File, X
} from 'lucide-react'
import { ticketsAPI, ticketCategoriesAPI, departmentsAPI, employeesAPI, projectsAPI, customersAPI, vendorsAPI, materialsAPI, apiRequest } from '../../utils/api'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', description: 'No urgency, can be addressed when convenient', color: '#6B7280', bg: '#F3F4F6', borderActive: '#9CA3AF' },
  { value: 'medium', label: 'Medium', description: 'Standard request, normal turnaround time', color: '#2563EB', bg: '#DBEAFE', borderActive: '#3B82F6' },
  { value: 'high', label: 'High', description: 'Important issue, needs prompt attention', color: '#EA580C', bg: '#FFEDD5', borderActive: '#F97316' },
  { value: 'critical', label: 'Critical', description: 'Urgent issue affecting work, immediate attention needed', color: '#DC2626', bg: '#FEE2E2', borderActive: '#EF4444' },
]

const TICKET_SOURCE_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'customer', label: 'Customer' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'project', label: 'Project' },
  { value: 'system', label: 'System Generated' },
]

const TICKET_NATURE_OPTIONS = [
  { value: 'complaint', label: 'Complaint' },
  { value: 'query', label: 'Query' },
  { value: 'request', label: 'Request' },
  { value: 'issue', label: 'Issue' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'escalation', label: 'Escalation' },
]

export default function NewTicket() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [projects, setProjects] = useState([])
  const [customers, setCustomers] = useState([])
  const [vendors, setVendors] = useState([])
  const [materials, setMaterials] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    priority: 'medium',
    department: '',
    requestedFor: '',
    relatedTo: {
      type: '',
      id: '',
    },
    // Entity mapping fields
    relatedProject: '',
    relatedCustomer: '',
    relatedVendor: '',
    relatedMaterial: '',
    relatedEmployee: '',
    ticketSource: '',
    ticketNature: '',
  })
  const [errors, setErrors] = useState({})
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  // Helper function to get file icon
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return Image
    if (fileType?.includes('pdf')) return FileText
    return File
  }

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const maxFiles = 5

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds 10MB limit`)
        return false
      }
      return true
    })

    // Limit to max files
    const newFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles)
    if (selectedFiles.length + validFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
    }

    setSelectedFiles(newFiles)
    e.target.value = '' // Reset input
  }

  // Remove a selected file
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (formData.category) {
      const selectedCategory = categories.find(c => c._id === formData.category)
      setSubCategories(selectedCategory?.subCategories || [])
      setFormData(prev => ({ ...prev, subCategory: '' }))
    }
  }, [formData.category, categories])

  const fetchInitialData = async () => {
    console.log('[NewTicket] Fetching initial data...')
    console.log('[NewTicket] Active company:', localStorage.getItem('hoh108_active_company'))
    console.log('[NewTicket] Token exists:', !!localStorage.getItem('hoh108_admin_token'))

    // Use _suppressRedirect to prevent batch API calls from redirecting to login
    // if one endpoint returns 401 (e.g. permission denied)
    const noRedirect = { _suppressRedirect: true }
    const results = await Promise.allSettled([
      apiRequest('/tickets/categories', noRedirect),
      apiRequest('/departments', noRedirect),
      apiRequest('/employees?limit=100', noRedirect),
      apiRequest('/projects?limit=100', noRedirect),
      apiRequest('/customers?limit=100', noRedirect),
      apiRequest('/vendors?limit=100', noRedirect),
      apiRequest('/materials?limit=100', noRedirect),
    ])

    const labels = ['categories', 'departments', 'employees', 'projects', 'customers', 'vendors', 'materials']
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[NewTicket] ${labels[i]} FAILED:`, r.reason?.message || r.reason)
      } else {
        console.log(`[NewTicket] ${labels[i]} OK:`, r.value?.data?.length ?? 'no data array')
      }
    })

    const getValue = (result) => result.status === 'fulfilled' ? result.value : null

    const [catResponse, deptResponse, empResponse, projResponse, custResponse, vendResponse, matResponse] = results.map(getValue)

    setCategories(catResponse?.data || [])
    setDepartments(deptResponse?.data || [])
    setEmployees(empResponse?.data || [])
    setProjects(projResponse?.data || [])
    setCustomers(custResponse?.data || [])
    setVendors(vendResponse?.data || [])
    setMaterials(matResponse?.data || [])
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Subject is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.category) newErrors.category = 'Category is required'
    if (!formData.priority) newErrors.priority = 'Priority is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (saveAsDraft = false) => {
    if (!saveAsDraft && !validateForm()) return

    setLoading(true)
    try {
      const payload = {
        ...formData,
        relatedTo: formData.relatedTo.type && formData.relatedTo.id ? formData.relatedTo : undefined,
        // Only include mapping fields if they have values
        relatedProject: formData.relatedProject || undefined,
        relatedCustomer: formData.relatedCustomer || undefined,
        relatedVendor: formData.relatedVendor || undefined,
        relatedMaterial: formData.relatedMaterial || undefined,
        relatedEmployee: formData.relatedEmployee || undefined,
        ticketSource: formData.ticketSource || undefined,
        ticketNature: formData.ticketNature || undefined,
      }

      // When saveAsDraft is true, send isDraft flag so backend creates as draft
      if (saveAsDraft) {
        payload.isDraft = true
      }

      const response = await ticketsAPI.create(payload)

      // Upload files if any are selected
      if (response.data?._id && selectedFiles.length > 0) {
        setUploading(true)
        try {
          const uploadFormData = new FormData()
          selectedFiles.forEach(file => {
            uploadFormData.append('files', file)
          })
          await ticketsAPI.uploadFiles(response.data._id, uploadFormData)
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError)
          // Continue even if file upload fails - ticket was created successfully
        } finally {
          setUploading(false)
        }
      }

      // No need to call submit separately - the create endpoint already
      // sets the correct status (open/pending_approval) when isDraft is false

      navigate('/admin/tickets')
    } catch (error) {
      console.error('Error creating ticket:', error)
      alert(error.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find(c => c._id === formData.category)

  // Styles
  const cardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #E5E7EB',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  }

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: '#FCA5A5',
  }

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '40px',
  }

  const errorTextStyle = {
    color: '#DC2626',
    fontSize: '13px',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }

  const helpTextStyle = {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '6px',
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/admin/tickets')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6B7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '16px',
            padding: 0,
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
        >
          <ArrowLeft size={18} />
          Back to Tickets
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#DBEAFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ticket size={28} style={{ color: '#2563EB' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
              Create New Ticket
            </h1>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
              Submit a support request to the relevant team
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
        {/* Main Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Basic Info Card */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: '0 0 20px 0' }}>
              Ticket Details
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Subject */}
              <div>
                <label style={labelStyle}>
                  Subject <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief summary of your request"
                  style={errors.title ? inputErrorStyle : inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.title ? '#FCA5A5' : '#E5E7EB'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                {errors.title && (
                  <p style={errorTextStyle}>
                    <AlertCircle size={14} />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>
                  Description <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide detailed information about your request. Include any relevant context, steps to reproduce (for issues), or specific requirements."
                  rows={5}
                  style={{
                    ...inputStyle,
                    ...(errors.description ? { borderColor: '#FCA5A5' } : {}),
                    resize: 'none',
                    minHeight: '140px',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3B82F6'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.description ? '#FCA5A5' : '#E5E7EB'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                {errors.description && (
                  <p style={errorTextStyle}>
                    <AlertCircle size={14} />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Category & Sub-Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>
                    Category <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{
                      ...selectStyle,
                      ...(errors.category ? { borderColor: '#FCA5A5' } : {}),
                    }}
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p style={errorTextStyle}>
                      <AlertCircle size={14} />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>Sub-Category</label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    disabled={!formData.category || subCategories.length === 0}
                    style={{
                      ...selectStyle,
                      ...((!formData.category || subCategories.length === 0) ? {
                        background: '#F9FAFB',
                        cursor: 'not-allowed',
                        color: '#9CA3AF',
                      } : {}),
                    }}
                  >
                    <option value="">Select sub-category...</option>
                    {subCategories.map((sub, idx) => (
                      <option key={idx} value={sub.code}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Department */}
              <div>
                <label style={labelStyle}>
                  Department <span style={{ color: '#9CA3AF', fontWeight: '400' }}>(Optional)</span>
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">Auto-assign based on category</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <p style={helpTextStyle}>
                  Leave empty to auto-assign to the default department for selected category
                </p>
              </div>

              {/* Requested For */}
              <div>
                <label style={labelStyle}>
                  Requested For <span style={{ color: '#9CA3AF', fontWeight: '400' }}>(Optional)</span>
                </label>
                <select
                  value={formData.requestedFor}
                  onChange={(e) => setFormData({ ...formData, requestedFor: e.target.value })}
                  style={selectStyle}
                >
                  <option value="">Myself</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp.user?._id}>
                      {emp.user?.name} - {emp.department?.name}
                    </option>
                  ))}
                </select>
                <p style={helpTextStyle}>
                  Submit ticket on behalf of another team member
                </p>
              </div>
            </div>
          </div>

          {/* Related Entity Mapping Card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Link2 size={20} style={{ color: '#2563EB' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                Related Entity Mapping
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
              Link this ticket to relevant projects, customers, vendors, materials, or employees for better tracking and cross-department visibility.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Ticket Source & Nature */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Ticket Source</label>
                  <select
                    value={formData.ticketSource}
                    onChange={(e) => setFormData({ ...formData, ticketSource: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">Select source...</option>
                    {TICKET_SOURCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Ticket Nature</label>
                  <select
                    value={formData.ticketNature}
                    onChange={(e) => setFormData({ ...formData, ticketNature: e.target.value })}
                    style={selectStyle}
                  >
                    <option value="">Select nature...</option>
                    {TICKET_NATURE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Show entity mapping fields only when ticket source is NOT internal */}
              {formData.ticketSource && formData.ticketSource !== 'internal' && (
                <>
                  {/* Related Project */}
                  <div>
                    <label style={labelStyle}>
                      <FolderKanban size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      Related Project
                    </label>
                    <select
                      value={formData.relatedProject}
                      onChange={(e) => setFormData({ ...formData, relatedProject: e.target.value })}
                      style={selectStyle}
                    >
                      <option value="">Select project...</option>
                      {projects.map((proj) => (
                        <option key={proj._id} value={proj._id}>
                          {proj.projectId} - {proj.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Related Customer & Vendor */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>
                        <Users size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        Related Customer
                      </label>
                      <select
                        value={formData.relatedCustomer}
                        onChange={(e) => setFormData({ ...formData, relatedCustomer: e.target.value })}
                        style={selectStyle}
                      >
                        <option value="">Select customer...</option>
                        {customers.map((cust) => (
                          <option key={cust._id} value={cust._id}>
                            {cust.customerId} - {cust.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>
                        <Truck size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        Related Vendor
                      </label>
                      <select
                        value={formData.relatedVendor}
                        onChange={(e) => setFormData({ ...formData, relatedVendor: e.target.value })}
                        style={selectStyle}
                      >
                        <option value="">Select vendor...</option>
                        {vendors.map((vend) => (
                          <option key={vend._id} value={vend._id}>
                            {vend.vendorId} - {vend.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Related Material & Employee */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>
                        <Package size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        Related Material
                      </label>
                      <select
                        value={formData.relatedMaterial}
                        onChange={(e) => setFormData({ ...formData, relatedMaterial: e.target.value })}
                        style={selectStyle}
                      >
                        <option value="">Select material...</option>
                        {materials.map((mat) => (
                          <option key={mat._id} value={mat._id}>
                            {mat.materialId} - {mat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>
                        <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        Related Employee
                      </label>
                      <select
                        value={formData.relatedEmployee}
                        onChange={(e) => setFormData({ ...formData, relatedEmployee: e.target.value })}
                        style={selectStyle}
                      >
                        <option value="">Select employee...</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.employeeId} - {emp.user?.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Attachments Card */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <Paperclip size={20} style={{ color: '#2563EB' }} />
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                Attachments
              </h2>
              <span style={{ fontSize: '12px', color: '#9CA3AF', marginLeft: 'auto' }}>
                {selectedFiles.length}/5 files
              </span>
            </div>

            {/* Upload Area */}
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 24px',
                border: '2px dashed #E5E7EB',
                borderRadius: '12px',
                background: '#F9FAFB',
                cursor: selectedFiles.length >= 5 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: selectedFiles.length >= 5 ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (selectedFiles.length < 5) {
                  e.currentTarget.style.borderColor = '#3B82F6'
                  e.currentTarget.style.background = '#EFF6FF'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB'
                e.currentTarget.style.background = '#F9FAFB'
              }}
            >
              <Upload size={32} style={{ color: '#9CA3AF', marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151', margin: 0 }}>
                {selectedFiles.length >= 5 ? 'Maximum files reached' : 'Click to upload or drag & drop'}
              </p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '6px 0 0 0' }}>
                Images, PDF, Word, Excel, TXT, CSV (max 10MB each)
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                disabled={selectedFiles.length >= 5}
                style={{ display: 'none' }}
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              />
            </label>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file.type)
                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: '#F9FAFB',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: file.type?.startsWith('image/') ? '#DBEAFE' : '#F3E8FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileIcon size={20} style={{ color: file.type?.startsWith('image/') ? '#2563EB' : '#C59C82' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#1F2937',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {file.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0 0' }}>
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        style={{
                          padding: '6px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <X size={18} style={{ color: '#DC2626' }} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Priority Selection */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: '0 0 16px 0' }}>
              Priority
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PRIORITY_OPTIONS.map((option) => {
                const isSelected = formData.priority === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: option.value })}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: isSelected ? `2px solid ${option.borderActive}` : '1px solid #E5E7EB',
                      background: isSelected ? option.bg : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#D1D5DB'
                        e.currentTarget.style.background = '#F9FAFB'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = '#E5E7EB'
                        e.currentTarget.style.background = '#ffffff'
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: option.color,
                        }}
                      />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                          {option.label}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Category Info */}
          {selectedCategory && (
            <div
              style={{
                background: '#EFF6FF',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #BFDBFE',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Info size={20} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1E40AF', margin: 0 }}>
                    {selectedCategory.name}
                  </h3>
                  {selectedCategory.description && (
                    <p style={{ fontSize: '13px', color: '#3B82F6', margin: '6px 0 0 0' }}>
                      {selectedCategory.description}
                    </p>
                  )}
                  {selectedCategory.slaHours && (
                    <div style={{ marginTop: '12px' }}>
                      <p style={{ fontSize: '12px', fontWeight: '500', color: '#1E40AF', margin: '0 0 6px 0' }}>
                        Expected Resolution Time (SLA):
                      </p>
                      {Object.entries(selectedCategory.slaHours).map(([priority, hours]) => (
                        <p key={priority} style={{ fontSize: '12px', color: '#3B82F6', margin: '2px 0' }}>
                          <span style={{ textTransform: 'capitalize' }}>{priority}:</span> {hours} hours
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Submitting...' : (
                  <>
                    <Send size={18} />
                    Submit Ticket
                  </>
                )}
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#F9FAFB'
                    e.currentTarget.style.borderColor = '#D1D5DB'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff'
                  e.currentTarget.style.borderColor = '#E5E7EB'
                }}
              >
                <Save size={18} />
                Save as Draft
              </button>
              <button
                onClick={() => navigate('/admin/tickets')}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'transparent',
                  color: '#6B7280',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#374151'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Help Text */}
          <div
            style={{
              background: '#F9FAFB',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #E5E7EB',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#374151', margin: '0 0 10px 0' }}>
              Need Help?
            </h3>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 12px 0', lineHeight: '1.5' }}>
              Make sure to provide as much detail as possible in your description.
              This helps the support team understand and resolve your issue faster.
            </p>
            <ul style={{ fontSize: '13px', color: '#6B7280', margin: 0, paddingLeft: '16px' }}>
              <li style={{ marginBottom: '4px' }}>Be specific about what you need</li>
              <li style={{ marginBottom: '4px' }}>Include any error messages</li>
              <li style={{ marginBottom: '4px' }}>Mention urgency if applicable</li>
              <li>Attach screenshots if helpful</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
