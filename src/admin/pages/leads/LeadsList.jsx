import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Eye,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  GripVertical,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { leadsAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/layout/PageHeader'
import {
  Button,
  Card,
  Table,
  Badge,
  Avatar,
  SearchInput,
  Pagination,
  Dropdown,
  Modal,
  Input,
  Select,
} from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatPhone, telHref } from '../../utils/helpers'
import { LEAD_STATUSES, PRE_SALES_STATUSES, SALES_STATUSES, LEAD_PRIORITIES, LEAD_TEMPERATURES, SERVICE_TYPES, CRM_CITIES } from '../../utils/constants'

// Color configurations for statuses
const STATUS_COLORS = {
  blue: {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    light: '#eff6ff',
    medium: '#dbeafe',
    text: '#1e40af',
    border: '#93c5fd',
    glow: 'rgba(59, 130, 246, 0.3)',
  },
  yellow: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    light: '#fffbeb',
    medium: '#fef3c7',
    text: '#92400e',
    border: '#fcd34d',
    glow: 'rgba(245, 158, 11, 0.3)',
  },
  purple: {
    gradient: 'linear-gradient(135deg, #DDC5B0 0%, #C59C82 100%)',
    light: '#FDF8F4',
    medium: '#F5EDE6',
    text: '#8B7355',
    border: '#D4B49A',
    glow: 'rgba(197, 156, 130, 0.3)',
  },
  orange: {
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    light: '#fff7ed',
    medium: '#fed7aa',
    text: '#9a3412',
    border: '#fdba74',
    glow: 'rgba(249, 115, 22, 0.3)',
  },
  pink: {
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    light: '#fdf2f8',
    medium: '#fce7f3',
    text: '#9d174d',
    border: '#f9a8d4',
    glow: 'rgba(236, 72, 153, 0.3)',
  },
  green: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    light: '#ecfdf5',
    medium: '#d1fae5',
    text: '#065f46',
    border: '#6ee7b7',
    glow: 'rgba(16, 185, 129, 0.3)',
  },
  red: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    light: '#fef2f2',
    medium: '#fee2e2',
    text: '#991b1b',
    border: '#fca5a5',
    glow: 'rgba(239, 68, 68, 0.3)',
  },
  teal: {
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    light: '#f0fdfa',
    medium: '#ccfbf1',
    text: '#115e59',
    border: '#5eead4',
    glow: 'rgba(20, 184, 166, 0.3)',
  },
  indigo: {
    gradient: 'linear-gradient(135deg, #C59C82 0%, #C59C82 100%)',
    light: '#FDF8F4',
    medium: '#e0e7ff',
    text: '#3730a3',
    border: '#a5b4fc',
    glow: 'rgba(197, 156, 130, 0.3)',
  },
  cyan: {
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    light: '#ecfeff',
    medium: '#cffafe',
    text: '#155e75',
    border: '#67e8f9',
    glow: 'rgba(6, 182, 212, 0.3)',
  },
  amber: {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    light: '#fffbeb',
    medium: '#fef3c7',
    text: '#92400e',
    border: '#fcd34d',
    glow: 'rgba(245, 158, 11, 0.3)',
  },
  crimson: {
    gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
    light: '#fef2f2',
    medium: '#fee2e2',
    text: '#991b1b',
    border: '#fca5a5',
    glow: 'rgba(239, 68, 68, 0.3)',
  },
}

// Kanban Column Component
const KanbanColumn = ({ status, statusInfo, leads, onDrop, onDragOver, onDragLeave, isDragOver, onLeadClick, onDelete }) => {
  const colors = STATUS_COLORS[statusInfo.color] || STATUS_COLORS.blue

  const columnStyle = {
    flex: '0 0 300px',
    display: 'flex',
    flexDirection: 'column',
    background: isDragOver ? colors.light : '#ffffff',
    borderRadius: '16px',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 340px)',
    border: isDragOver ? `2px dashed ${colors.border}` : '1px solid #e2e8f0',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isDragOver
      ? `0 0 20px ${colors.glow}`
      : '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  }

  const headerStyle = {
    background: colors.gradient,
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const countBadgeStyle = {
    background: 'rgba(255,255,255,0.25)',
    backdropFilter: 'blur(10px)',
    color: '#ffffff',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    minWidth: '28px',
    textAlign: 'center',
  }

  const contentStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: isDragOver ? colors.light : '#fafbfc',
  }

  return (
    <div
      style={columnStyle}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div style={headerStyle}>
        <span style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px', letterSpacing: '0.02em' }}>
          {statusInfo.label}
        </span>
        <span style={countBadgeStyle}>{leads.length}</span>
      </div>
      <div style={contentStyle}>
        {leads.length === 0 ? (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '13px',
            background: `linear-gradient(180deg, ${colors.light} 0%, transparent 100%)`,
            borderRadius: '12px',
            border: `1px dashed ${colors.border}`,
          }}>
            <div style={{ marginBottom: '8px', fontSize: '24px', opacity: 0.5 }}>📋</div>
            No leads here
          </div>
        ) : (
          leads.map((lead) => (
            <KanbanCard
              key={lead._id}
              lead={lead}
              statusColor={statusInfo.color}
              onClick={() => onLeadClick(lead._id)}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Kanban Card Component
const KanbanCard = ({ lead, statusColor, onClick, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const colors = STATUS_COLORS[statusColor] || STATUS_COLORS.blue

  const tempConfig = LEAD_TEMPERATURES[lead.secondaryStatus] || LEAD_TEMPERATURES.warm

  const handleDragStart = (e) => {
    setIsDragging(true)
    e.dataTransfer.setData('leadId', lead._id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '14px',
        cursor: 'pointer',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
        border: `1px solid ${isHovered ? colors.border : '#e2e8f0'}`,
        transition: 'all 0.2s ease',
        transform: isDragging ? 'rotate(3deg) scale(1.02)' : isHovered ? 'translateY(-2px)' : 'none',
        opacity: isDragging ? 0.8 : 1,
      }}
    >
      {/* Header with avatar and name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: colors.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: '600',
          fontSize: '14px',
          flexShrink: 0,
        }}>
          {lead.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: '600',
            color: '#1e293b',
            margin: 0,
            fontSize: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {lead.name}
          </p>
          {lead.leadId && (
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0 0' }}>
              {lead.leadId}
            </p>
          )}
        </div>
        <GripVertical style={{ width: '14px', height: '14px', color: '#cbd5e1', flexShrink: 0 }} />
      </div>

      {/* Contact Info */}
      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#64748b' }}>
        {lead.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Phone style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
            <span>{formatPhone(lead.phone)}</span>
          </div>
        )}
        {lead.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lead.email}
            </span>
          </div>
        )}
      </div>

      {/* Footer - Source, Service, Temperature, Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {(lead.websiteSource || lead.company?.name) && (
          <span style={{
            background: lead.websiteSource === 'InteriorPlus' ? '#fef3c7' : '#dbeafe',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '600',
            color: lead.websiteSource === 'InteriorPlus' ? '#92400e' : '#1e40af',
          }}>
            {lead.websiteSource || lead.company?.name}
          </span>
        )}
        {lead.service && (
          <span style={{
            background: '#f1f5f9',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '500',
            color: '#475569',
          }}>
            {lead.service}
          </span>
        )}
        {!['cold', 'warm', 'hot'].includes(lead.status) && (
          <span style={{
            background: tempConfig.bg,
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '600',
            color: tempConfig.text,
            textTransform: 'uppercase',
          }}>
            {tempConfig.label}
          </span>
        )}
        <span style={{
          marginLeft: 'auto',
          fontSize: '10px',
          color: '#94a3b8',
        }}>
          {formatDate(lead.createdAt)}
        </span>
      </div>
    </div>
  )
}

const LeadsList = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isPreSales = user?.role === 'pre_sales'
  const isSalesEmployee = ['sales_manager', 'sales_executive'].includes(user?.role)
  const [searchParams, setSearchParams] = useSearchParams()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  // Initialize filters from URL params if present
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [serviceFilter, setServiceFilter] = useState(searchParams.get('service') || '')
  const [tempFilter, setTempFilter] = useState(searchParams.get('temperature') || '')
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '')
  // Show table view when any filter is present from URL
  const hasUrlFilters = searchParams.get('status') || searchParams.get('service') || searchParams.get('temperature') || searchParams.get('city')
  const [viewMode, setViewMode] = useState(hasUrlFilters ? 'table' : 'kanban')
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [formData, setFormData] = useState({
    leadId: '',
    name: '',
    email: '',
    phone: '',
    service: '',
    budget: '',
    status: 'new',
    secondaryStatus: 'warm',
  })
  const [saving, setSaving] = useState(false)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkUploadFile, setBulkUploadFile] = useState(null)
  const [bulkUploadPreview, setBulkUploadPreview] = useState([])
  const [bulkUploadResult, setBulkUploadResult] = useState(null)
  const [bulkUploadTotalCount, setBulkUploadTotalCount] = useState(0)
  const [isDragOverUpload, setIsDragOverUpload] = useState(false)
  const fileInputRef = useRef(null)

  // Auto-open create modal when navigated with ?action=create
  useEffect(() => {
    if (searchParams.get('action') === 'create' && !isPreSales) {
      setShowCreateModal(true)
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('action')
      setSearchParams(newParams, { replace: true })
    }
  }, [])

  // Sync URL params when filters change
  useEffect(() => {
    const newParams = new URLSearchParams()
    if (statusFilter) newParams.set('status', statusFilter)
    if (serviceFilter) newParams.set('service', serviceFilter)
    if (tempFilter) newParams.set('temperature', tempFilter)
    if (cityFilter) newParams.set('city', cityFilter)
    if (search) newParams.set('search', search)
    setSearchParams(newParams, { replace: true })
  }, [statusFilter, serviceFilter, tempFilter, cityFilter, search, setSearchParams])

  useEffect(() => {
    loadLeads()
  }, [pagination.page, search, statusFilter, serviceFilter, tempFilter, cityFilter, viewMode])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const params = {
        search,
        status: statusFilter,
        service: serviceFilter,
        secondaryStatus: tempFilter,
        city: cityFilter,
      }
      // For kanban view, load all leads; for table view, use pagination
      if (viewMode === 'table') {
        params.page = pagination.page
        params.limit = pagination.limit
      } else {
        params.limit = 500 // Load more for kanban view
      }
      const response = await leadsAPI.getAll(params)
      console.log('[Leads] API response:', response.success, 'count:', response.data?.length, 'total:', response.pagination?.total)
      setLeads(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 0,
      }))
    } catch (err) {
      console.error('[Leads] Failed to load leads:', err)
    } finally {
      setLoading(false)
    }
  }

  // Kanban drag and drop handlers
  const handleDragOver = (e, status) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = (e) => {
    // Only set to null if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    const leadId = e.dataTransfer.getData('leadId')
    if (!leadId) return

    const lead = leads.find(l => l._id === leadId)
    if (!lead || lead.status === newStatus) return

    // Role-based drag restrictions
    if (isPreSales && SALES_STATUSES.includes(newStatus) && newStatus !== 'qualified') {
      alert('Pre-sales cannot move leads to sales columns')
      return
    }
    if (isSalesEmployee && PRE_SALES_STATUSES.includes(newStatus) && newStatus !== 'lost') {
      alert('Sales team cannot move leads to pre-sales columns')
      return
    }
    // Won only from hot
    if (newStatus === 'won' && lead.status !== 'hot') {
      alert('Leads can only be moved to Won from Hot status')
      return
    }
    // Meeting status only from qualified (via Schedule Meeting form)
    if (newStatus === 'meeting_status' && lead.status !== 'qualified') {
      alert('Use the "Schedule Meeting" button on the lead detail page to move qualified leads to Meeting Status')
      return
    }

    // Optimistically update UI
    setLeads(prev => prev.map(l =>
      l._id === leadId ? { ...l, status: newStatus } : l
    ))

    try {
      await leadsAPI.updateStatus(leadId, newStatus)
    } catch (err) {
      console.error('Failed to update lead status:', err)
      alert(err.message || 'Failed to update status')
      loadLeads()
    }
  }

  // Group leads by status for kanban view (server already filters, but we group by status here)
  const getLeadsByStatus = () => {
    const grouped = {}
    let allowedStatuses
    if (isPreSales) {
      allowedStatuses = PRE_SALES_STATUSES
    } else if (isSalesEmployee) {
      allowedStatuses = SALES_STATUSES
    } else {
      // Admin sees all columns: pre-sales then sales (deduplicate qualified which is in both)
      allowedStatuses = [...new Set([...PRE_SALES_STATUSES, ...SALES_STATUSES])]
    }
    allowedStatuses.forEach(status => {
      if (statusFilter && statusFilter !== status) {
        grouped[status] = []
      } else {
        grouped[status] = leads.filter(lead => lead.status === status)
      }
    })
    return grouped
  }

  const handleCreateLead = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await leadsAPI.create(formData)
      setShowCreateModal(false)
      setFormData({
        leadId: '',
        name: '',
        email: '',
        phone: '',
        service: '',
        budget: '',
        status: 'new',
        secondaryStatus: 'warm',
      })
      loadLeads()
    } catch (err) {
      console.error('Failed to create lead:', err)
      alert(err.message || 'Failed to create lead')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    try {
      await leadsAPI.delete(id)
      loadLeads()
    } catch (err) {
      console.error('Failed to delete lead:', err)
    }
  }

  const handleEditClick = (lead) => {
    setEditingLead(lead)
    setFormData({
      leadId: lead.leadId || '',
      name: lead.name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      service: lead.service || '',
      budget: typeof lead.budget === 'object' ? (lead.budget?.amount || lead.budget?.legacy || '') : (lead.budget || ''),
      status: lead.status || 'new',
      secondaryStatus: lead.secondaryStatus || 'warm',
    })
    setShowEditModal(true)
  }

  const handleUpdateLead = async (e) => {
    e.preventDefault()
    if (!editingLead) return
    setSaving(true)
    try {
      await leadsAPI.update(editingLead._id, formData)
      setShowEditModal(false)
      setEditingLead(null)
      setFormData({
        leadId: '',
        name: '',
        email: '',
        phone: '',
        service: '',
        budget: '',
        status: 'new',
        secondaryStatus: 'warm',
      })
      loadLeads()
    } catch (err) {
      console.error('Failed to update lead:', err)
      alert(err.message || 'Failed to update lead')
    } finally {
      setSaving(false)
    }
  }

  const canEditLead = (lead) => {
    // Pre-sales can edit only until qualified
    if (isPreSales) {
      return !['qualified', 'proposal', 'negotiation', 'won', 'lost'].includes(lead.status)
    }
    return true
  }

  // Bulk Upload Functions
  const downloadTemplate = () => {
    const headers = ['name', 'email', 'phone', 'alternatePhone', 'city', 'propertyName', 'propertyType', 'area', 'service', 'serviceDepartment', 'budget', 'source', 'status', 'temperature', 'notes']
    const sampleData = [
      ['Rahul Sharma', 'rahul@example.com', '9876543210', '9876543200', 'Bengaluru', 'Prestige Lakeside Habitat', 'Apartment', '1200', 'Interior Design', 'interior', '1500000', 'website', 'new', 'warm', '3BHK full interior required'],
      ['Priya Reddy', 'priya@example.com', '9876543211', '', 'Hyderabad', 'My Home Bhooja', 'Villa', '2500', 'Modular Kitchen', 'modular', '800000', 'referral', 'new', 'hot', 'Kitchen and wardrobes only'],
      ['Anil Kumar', '', '9876543212', '9876543213', 'Mysuru', 'Royal Orchid', 'Apartment', '950', 'Renovation', 'civil', '500000', 'walk-in', 'new', 'cold', 'Bathroom renovation']
    ]

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Parse a CSV line handling quoted fields with commas
  const parseCSVLine = (line) => {
    const values = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  }

  const processFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) return
    setBulkUploadFile(file)
    setBulkUploadResult(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result.replace(/^\uFEFF/, '')
      const lines = text.split('\n').filter(line => line.trim())
      const rawHeaders = parseCSVLine(lines[0])
      const headers = rawHeaders.map(h => normalizeHeader(h))

      const allRows = lines.slice(1).map(line => {
        const values = parseCSVLine(line)
        const row = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })

      const validRows = allRows.filter(row => row.name && row.phone)
      setBulkUploadTotalCount(validRows.length)
      setBulkUploadPreview(validRows.slice(0, 5))
    }
    reader.readAsText(file)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOverUpload(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleDragOverUpload = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOverUpload(true)
  }

  const handleDragLeaveUpload = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOverUpload(false)
  }

  // Map common CSV header variations to standard field names
  const normalizeHeader = (header) => {
    const h = header.toLowerCase().replace(/[^a-z0-9]/g, '')
    const map = {
      name: 'name', clientname: 'name', fullname: 'name', leadname: 'name', customername: 'name', customer: 'name',
      phone: 'phone', phonenumber: 'phone', mobile: 'phone', mobilenumber: 'phone', contact: 'phone', contactnumber: 'phone', cell: 'phone', telephone: 'phone',
      alternatephone: 'alternatePhone', altphone: 'alternatePhone', secondaryphone: 'alternatePhone', alternatenumber: 'alternatePhone',
      email: 'email', emailaddress: 'email', emailid: 'email', mail: 'email',
      city: 'city', location: 'city',
      propertyname: 'propertyName', project: 'propertyName', projectname: 'propertyName', property: 'propertyName',
      propertytype: 'propertyType', type: 'propertyType',
      area: 'area', sqft: 'area', squarefeet: 'area', size: 'area',
      service: 'service', servicetype: 'service', services: 'service',
      servicedepartment: 'serviceDepartment', department: 'serviceDepartment', dept: 'serviceDepartment',
      budget: 'budget', amount: 'budget',
      source: 'source', leadsource: 'source',
      status: 'status', leadstatus: 'status',
      temperature: 'secondaryStatus', priority: 'secondaryStatus', leadpriority: 'secondaryStatus',
      notes: 'notes', note: 'notes', remarks: 'notes', comment: 'notes', comments: 'notes', message: 'notes',
    }
    return map[h] || header.toLowerCase()
  }

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) return

    setBulkUploading(true)
    setBulkUploadResult(null)

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const text = event.target.result.replace(/^\uFEFF/, '') // strip BOM
        const lines = text.split('\n').filter(line => line.trim())
        const rawHeaders = parseCSVLine(lines[0])
        const headers = rawHeaders.map(h => normalizeHeader(h))

        const leads = lines.slice(1).map(line => {
          const values = parseCSVLine(line)
          const lead = {}
          headers.forEach((header, index) => {
            if (values[index]) {
              lead[header] = values[index]
            }
          })
          // Map city to location object
          if (lead.city) {
            lead.location = { city: lead.city }
            delete lead.city
          }
          // Map notes to message field
          if (lead.notes) {
            lead.message = lead.notes
            delete lead.notes
          }
          return lead
        }).filter(lead => lead.name && lead.phone) // Must have name and phone

        if (leads.length === 0) {
          setBulkUploadResult({
            success: false,
            message: 'No valid leads found. Each lead must have at least name and phone.',
            created: 0,
            failed: 0
          })
          setBulkUploading(false)
          return
        }

        try {
          const response = await leadsAPI.bulkUpload({ leads })
          const result = response.data || response
          setBulkUploadResult({
            success: true,
            message: `Successfully uploaded ${result.successful || leads.length} leads`,
            created: result.successful || leads.length,
            failed: result.failed || 0,
            errors: result.errors || []
          })
          loadLeads()
        } catch (err) {
          setBulkUploadResult({
            success: false,
            message: err.message || 'Failed to upload leads',
            created: 0,
            failed: leads.length
          })
        }
        setBulkUploading(false)
      }
      reader.readAsText(bulkUploadFile)
    } catch (err) {
      setBulkUploadResult({
        success: false,
        message: 'Failed to read file',
        created: 0,
        failed: 0
      })
      setBulkUploading(false)
    }
  }

  const resetBulkUpload = () => {
    setBulkUploadFile(null)
    setBulkUploadPreview([])
    setBulkUploadResult(null)
    setBulkUploadTotalCount(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const statusOptions = Object.entries(LEAD_STATUSES)
    .filter(([value]) => {
      if (isPreSales) return PRE_SALES_STATUSES.includes(value)
      if (isSalesEmployee) return SALES_STATUSES.includes(value)
      return true
    })
    .map(([value, { label }]) => ({
      value,
      label,
    }))

  const temperatureOptions = Object.entries(LEAD_TEMPERATURES).map(([value, { label }]) => ({
    value,
    label,
  }))

  const serviceOptions = SERVICE_TYPES.map(service => ({
    value: service,
    label: service,
  }))

  const viewToggleStyle = {
    display: 'flex',
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    borderRadius: '12px',
    padding: '5px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
  }

  const viewButtonStyle = (isActive) => ({
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    background: isActive
      ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
      : 'transparent',
    color: isActive ? '#1e293b' : '#64748b',
    boxShadow: isActive
      ? '0 2px 8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)'
      : 'none',
    transform: isActive ? 'scale(1)' : 'scale(0.98)',
  })

  const leadsByStatus = getLeadsByStatus()

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Manage your sales leads and prospects"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Leads' },
        ]}
        actions={
          !isPreSales && (
            <div className="flex items-center gap-3">
              <Button variant="outline" icon={Upload} onClick={() => setShowBulkUploadModal(true)}>
                Bulk Upload
              </Button>
              <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
                Add Lead
              </Button>
            </div>
          )
        }
      />

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search leads..."
              />
            </div>
            <div style={{ width: '160px' }}>
              <Select
                options={[{ value: '', label: 'All Statuses' }, ...statusOptions]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
            <div style={{ width: '160px' }}>
              <Select
                options={[{ value: '', label: 'All Services' }, ...serviceOptions]}
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              />
            </div>
            <div style={{ width: '140px' }}>
              <Select
                options={[{ value: '', label: 'All Temperatures' }, ...temperatureOptions]}
                value={tempFilter}
                onChange={(e) => setTempFilter(e.target.value)}
              />
            </div>
            <div style={{ width: '150px' }}>
              <Select
                options={[{ value: '', label: 'All Cities' }, ...CRM_CITIES.map(c => ({ value: c, label: c }))]}
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
            {(statusFilter || serviceFilter || tempFilter || cityFilter || search) && (
              <button
                onClick={() => {
                  setStatusFilter('')
                  setServiceFilter('')
                  setTempFilter('')
                  setCityFilter('')
                  setSearch('')
                }}
                style={{
                  padding: '8px 12px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <XCircle style={{ width: '14px', height: '14px' }} />
                Clear
              </button>
            )}
          </div>
          <div style={viewToggleStyle}>
            <button
              style={viewButtonStyle(viewMode === 'kanban')}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid style={{ width: '16px', height: '16px' }} />
              Kanban
            </button>
            <button
              style={viewButtonStyle(viewMode === 'table')}
              onClick={() => setViewMode('table')}
            >
              <List style={{ width: '16px', height: '16px' }} />
              Table
            </button>
          </div>
        </div>
      </Card>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
          border: '1px solid #e2e8f0',
          maxHeight: 'calc(100vh - 280px)',
          overflow: 'auto',
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              background: '#ffffff',
              borderRadius: '16px',
            }}>
              <PageLoader />
            </div>
          ) : leads.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '48px',
            }}>
              <EmptyState
                title="No leads found"
                description={isPreSales ? "No leads assigned to you yet" : "Get started by adding your first lead"}
                action={isPreSales ? undefined : () => setShowCreateModal(true)}
                actionLabel={isPreSales ? undefined : "Add Lead"}
              />
            </div>
          ) : (
            <div style={{
              display: 'flex',
              gap: '20px',
              overflowX: 'auto',
              overflowY: 'hidden',
              paddingBottom: '8px',
            }}>
              {Object.entries(leadsByStatus).map(([status, statusLeads]) => {
                const statusInfo = LEAD_STATUSES[status]
                if (!statusInfo) return null
                return (
                  <KanbanColumn
                    key={status}
                    status={status}
                    statusInfo={statusInfo}
                    leads={statusLeads}
                    isDragOver={dragOverColumn === status}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status)}
                    onLeadClick={(id) => navigate(`/admin/leads/${id}`)}
                    onDelete={handleDelete}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card padding="none">
          {loading ? (
            <PageLoader />
          ) : leads.length === 0 ? (
            <EmptyState
              title="No leads found"
              description={isPreSales ? "No leads assigned to you yet" : "Get started by adding your first lead"}
              action={isPreSales ? undefined : () => setShowCreateModal(true)}
              actionLabel={isPreSales ? undefined : "Add Lead"}
            />
          ) : (
            <>
              <Table>
                <Table.Header>
                  <Table.Row hover={false}>
                    <Table.Head>Lead</Table.Head>
                    <Table.Head>Contact</Table.Head>
                    <Table.Head>Source</Table.Head>
                    <Table.Head>City</Table.Head>
                    <Table.Head>Service</Table.Head>
                    <Table.Head>Status</Table.Head>
                    <Table.Head>Temperature</Table.Head>
                    <Table.Head>Created</Table.Head>
                    <Table.Head style={{ width: '48px' }}></Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {leads.map((lead) => (
                    <Table.Row
                      key={lead._id}
                      onClick={() => navigate(`/admin/leads/${lead._id}`)}
                    >
                      <Table.Cell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar name={lead.name} size="sm" />
                          <div>
                            <p style={{ fontWeight: '500', color: '#1e293b', margin: 0 }}>{lead.name}</p>
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{lead.leadId}</p>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569' }}>
                            <Phone style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
                            <span style={{ fontSize: '14px' }}>{formatPhone(lead.phone)}</span>
                          </div>
                          {lead.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                              <Mail style={{ width: '14px', height: '14px', color: '#94a3b8' }} />
                              <span style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{lead.email}</span>
                            </div>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: lead.websiteSource === 'InteriorPlus' ? '#fef3c7' : '#dbeafe',
                          color: lead.websiteSource === 'InteriorPlus' ? '#92400e' : '#1e40af',
                        }}>
                          {lead.websiteSource || lead.company?.name || '-'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: '14px', color: '#475569' }}>
                          {lead.location?.city || '-'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: '14px', color: '#475569' }}>{lead.service || '-'}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={LEAD_STATUSES[lead.status]?.color || 'gray'}>
                          {LEAD_STATUSES[lead.status]?.label || lead.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={LEAD_TEMPERATURES[lead.secondaryStatus]?.color || 'yellow'} size="sm">
                          {LEAD_TEMPERATURES[lead.secondaryStatus]?.label || 'Warm'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>{formatDate(lead.createdAt)}</span>
                      </Table.Cell>
                      <Table.Cell onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          align="right"
                          trigger={
                            <button
                              style={{
                                padding: '8px',
                                background: 'none',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f1f5f9'
                                e.currentTarget.style.color = '#475569'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'none'
                                e.currentTarget.style.color = '#94a3b8'
                              }}
                            >
                              <MoreVertical style={{ width: '16px', height: '16px' }} />
                            </button>
                          }
                        >
                          <Dropdown.Item
                            icon={Eye}
                            onClick={() => navigate(`/admin/leads/${lead._id}`)}
                          >
                            View Details
                          </Dropdown.Item>
                          {canEditLead(lead) && (
                            <Dropdown.Item
                              icon={Edit}
                              onClick={() => handleEditClick(lead)}
                            >
                              Edit Lead
                            </Dropdown.Item>
                          )}
                          <Dropdown.Divider />
                          <Dropdown.Item
                            icon={Trash2}
                            danger
                            onClick={() => handleDelete(lead._id)}
                          >
                            Delete
                          </Dropdown.Item>
                        </Dropdown>
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
      )}

      {/* Create Lead Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Lead"
        size="md"
      >
        <form onSubmit={handleCreateLead}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Lead ID"
              value={formData.leadId}
              onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
              placeholder="e.g., LEAD-001"
              required
            />
            <Input
              label="Client Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <Select
              label="Service"
              options={serviceOptions}
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
              <Select
                label="Temperature"
                options={temperatureOptions}
                value={formData.secondaryStatus}
                onChange={(e) => setFormData({ ...formData, secondaryStatus: e.target.value })}
              />
            </div>
            <Input
              label="Budget"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create Lead
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingLead(null)
        }}
        title={`Edit Lead${editingLead?.name ? ` — ${editingLead.name}` : ''}`}
        size="md"
      >
        <form onSubmit={handleUpdateLead}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Lead ID"
              value={formData.leadId}
              onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
              placeholder="e.g., LEAD-001"
            />
            <Input
              label="Client Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <Select
              label="Service"
              options={serviceOptions}
              value={formData.service}
              onChange={(e) => setFormData({ ...formData, service: e.target.value })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
              <Select
                label="Temperature"
                options={temperatureOptions}
                value={formData.secondaryStatus}
                onChange={(e) => setFormData({ ...formData, secondaryStatus: e.target.value })}
              />
            </div>
            <Input
              label="Budget"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingLead(null) }}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Update Lead
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal
        isOpen={showBulkUploadModal}
        onClose={() => {
          setShowBulkUploadModal(false)
          resetBulkUpload()
        }}
        title="Bulk Upload Leads"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleFileDrop}
            onDragOver={handleDragOverUpload}
            onDragLeave={handleDragLeaveUpload}
            style={{
              border: `2px dashed ${isDragOverUpload ? '#C59C82' : bulkUploadFile ? '#10b981' : '#d1d5db'}`,
              borderRadius: '16px',
              padding: bulkUploadFile ? '24px' : '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: isDragOverUpload
                ? 'linear-gradient(135deg, #FDF8F4 0%, #F5EDE6 100%)'
                : bulkUploadFile
                  ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                  : '#fafbfc',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {bulkUploadFile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ height: '48px', width: '48px', borderRadius: '12px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileSpreadsheet style={{ height: '24px', width: '24px', color: '#059669' }} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontWeight: '600', color: '#111827', margin: 0, fontSize: '15px' }}>{bulkUploadFile.name}</p>
                  <p style={{ fontSize: '13px', color: '#059669', margin: '4px 0 0 0', fontWeight: '500' }}>
                    {bulkUploadTotalCount} leads ready to upload
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); resetBulkUpload() }}
                  style={{ height: '36px', width: '36px', borderRadius: '10px', border: '1px solid #fecaca', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  title="Remove file"
                >
                  <XCircle style={{ height: '18px', width: '18px', color: '#ef4444' }} />
                </button>
              </div>
            ) : (
              <>
                <div style={{ height: '56px', width: '56px', borderRadius: '16px', background: isDragOverUpload ? 'linear-gradient(135deg, #DDC5B0 0%, #C59C82 100%)' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Upload style={{ height: '24px', width: '24px', color: isDragOverUpload ? '#fff' : '#94a3b8' }} />
                </div>
                <p style={{ fontWeight: '600', color: '#374151', margin: '0 0 6px 0', fontSize: '15px' }}>
                  {isDragOverUpload ? 'Drop your file here' : 'Drag & drop your CSV file here'}
                </p>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                  or <span style={{ color: '#C59C82', fontWeight: '600' }}>browse</span> to choose a file
                </p>
              </>
            )}
          </div>

          {/* Template Download */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet style={{ height: '18px', width: '18px', color: '#6b7280' }} />
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Need the correct format?</span>
            </div>
            <button
              onClick={downloadTemplate}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#C59C82', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Download style={{ height: '14px', width: '14px' }} />
              Download Template
            </button>
          </div>

          {/* Preview Table */}
          {bulkUploadPreview.length > 0 && !bulkUploadResult && (
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>Preview (first 5 rows)</p>
              <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Name</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Phone</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Service</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkUploadPreview.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < bulkUploadPreview.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                        <td style={{ padding: '10px 14px', color: '#111827', fontWeight: '500' }}>{row.name || '-'}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280' }}>{row.phone || '-'}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.email || '-'}</td>
                        <td style={{ padding: '10px 14px', color: '#6b7280' }}>{row.service || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {bulkUploadResult && (
            <div style={{
              borderRadius: '12px',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px',
              background: bulkUploadResult.success ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: `1px solid ${bulkUploadResult.success ? '#a7f3d0' : '#fecaca'}`,
            }}>
              <div style={{ height: '40px', width: '40px', borderRadius: '10px', background: bulkUploadResult.success ? '#d1fae5' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {bulkUploadResult.success
                  ? <CheckCircle style={{ height: '20px', width: '20px', color: '#059669' }} />
                  : <XCircle style={{ height: '20px', width: '20px', color: '#dc2626' }} />
                }
              </div>
              <div>
                <p style={{ fontWeight: '600', color: bulkUploadResult.success ? '#065f46' : '#991b1b', margin: 0, fontSize: '14px' }}>
                  {bulkUploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                </p>
                <p style={{ fontSize: '13px', color: bulkUploadResult.success ? '#059669' : '#dc2626', margin: '4px 0 0 0' }}>
                  {bulkUploadResult.message}
                </p>
                {bulkUploadResult.created > 0 && (
                  <p style={{ fontSize: '13px', color: '#059669', margin: '4px 0 0 0', fontWeight: '500' }}>
                    {bulkUploadResult.created} leads created
                  </p>
                )}
                {bulkUploadResult.failed > 0 && (
                  <p style={{ fontSize: '13px', color: '#dc2626', margin: '4px 0 0 0', fontWeight: '500' }}>
                    {bulkUploadResult.failed} leads failed
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowBulkUploadModal(false)
              resetBulkUpload()
            }}
          >
            {bulkUploadResult?.success ? 'Close' : 'Cancel'}
          </Button>
          {!bulkUploadResult?.success && (
            <Button
              onClick={handleBulkUpload}
              disabled={!bulkUploadFile || bulkUploading}
              loading={bulkUploading}
            >
              {bulkUploading ? 'Uploading...' : 'Upload Leads'}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default LeadsList
