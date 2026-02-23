import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Plus, Grid, List, MoreVertical, Eye, Trash2, Star,
  FolderKanban, Search, Calendar, User, X, ChevronRight, Columns3
} from 'lucide-react'
import { projectsAPI, customersAPI } from '../../utils/api'
import { KanbanBoardFull } from './ProjectKanban'

const STATUS_CONFIG = {
  active: { label: 'Active', bg: '#D1FAE5', color: '#065F46' },
  draft: { label: 'Draft', bg: '#F3F4F6', color: '#374151' },
  on_hold: { label: 'On Hold', bg: '#FEF3C7', color: '#92400E' },
  completed: { label: 'Completed', bg: '#DBEAFE', color: '#1E40AF' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B' },
}

const CATEGORY_OPTIONS = [
  { value: 'interior', label: 'Interior Design' },
  { value: 'construction', label: 'Construction' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'education', label: 'Education' },
  { value: 'ods', label: 'ODS' },
  { value: 'other', label: 'Other' }
]

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: config.bg,
      color: config.color,
    }}>
      {config.label}
    </span>
  )
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const ProjectCard = ({ project, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.3s, transform 0.3s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.12)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Project Image */}
      <div style={{
        height: '140px',
        background: 'linear-gradient(135deg, #E0F2FE 0%, #F5EDE6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <FolderKanban size={48} style={{ color: '#D1D5DB' }} />
        )}
        {project.featured && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: '#FEF3C7',
            borderRadius: '8px',
            padding: '6px',
          }}>
            <Star size={16} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div>
            <h3 style={{
              fontWeight: '600',
              color: '#1F2937',
              fontSize: '15px',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '180px',
            }}>
              {project.title}
            </h3>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>{project.projectId}</p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <p style={{
          fontSize: '13px',
          color: '#6B7280',
          margin: '12px 0',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '40px',
        }}>
          {project.description || 'No description'}
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid #F3F4F6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280' }}>
            <User size={14} />
            <span>{project.customer?.name || '-'}</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>
            {formatCurrency(project.financials?.finalAmount || project.financials?.agreedAmount || project.financials?.quotedAmount || 0)}
          </span>
        </div>
      </div>
    </div>
  )
}

const CreateProjectModal = ({ isOpen, onClose, onSuccess, customers }) => {
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    status: 'active',
    category: 'interior',
    customer: '',
    budget: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.customer) {
      setError('Please select a customer')
      return
    }

    setLoading(true)
    try {
      // Transform budget to financials structure expected by backend
      const payload = {
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        category: formData.category,
        customer: formData.customer,
        financials: {
          quotedAmount: parseFloat(formData.budget) || 0,
          agreedAmount: parseFloat(formData.budget) || 0,
          finalAmount: parseFloat(formData.budget) || 0
        }
      }
      await projectsAPI.create(payload)
      onSuccess?.()
      onClose()
      setFormData({
        projectId: '',
        title: '',
        description: '',
        status: 'active',
        category: 'interior',
        customer: '',
        budget: ''
      })
    } catch (err) {
      setError(err.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #B8926E 0%, #C59C82 100%)',
          color: '#FFFFFF',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FolderKanban size={24} />
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Create New Project</h2>
                <p style={{ fontSize: '14px', color: '#DDC5B0', margin: '4px 0 0 0' }}>
                  Add a new project to your portfolio
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <X size={20} style={{ color: '#FFFFFF' }} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 180px)' }}>
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              fontSize: '14px',
              borderRadius: '10px',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Project ID *
            </label>
            <input
              type="text"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              placeholder="Enter project ID (e.g., PRJ-001)"
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Client Name *
            </label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              style={{ ...inputStyle, cursor: 'pointer', backgroundColor: '#FFFFFF' }}
              required
            >
              <option value="">Select a client</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.customerId})</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Project Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter project title"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the project"
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer', backgroundColor: '#FFFFFF' }}
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer', backgroundColor: '#FFFFFF' }}
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Project Value (INR)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="0"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                color: '#374151',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                backgroundColor: loading ? '#D4B49A' : '#B8926E',
                color: '#FFFFFF',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const ProjectsList = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [allProjects, setAllProjects] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [pagination.page, search, viewMode])

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadProjects = async () => {
    if (viewMode === 'kanban') {
      // KanbanBoardFull manages its own data fetching
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await projectsAPI.getAll({ page: pagination.page, limit: pagination.limit, search })
      setProjects(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.pages || 0
      }))
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll({ limit: 100 })
      setCustomers(response.data || [])
    } catch (err) {
      console.error('Failed to load customers:', err)
    }
  }

  const handleToggleFeatured = async (e, id) => {
    e.stopPropagation()
    try {
      await projectsAPI.toggleFeatured(id)
      loadProjects()
    } catch (err) {
      console.error('Failed to toggle featured:', err)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '8px' }}>
        <Link to="/admin" style={{ color: '#6B7280', textDecoration: 'none' }}>Dashboard</Link>
        <ChevronRight size={14} style={{ color: '#9CA3AF' }} />
        <span style={{ color: '#1F2937', fontWeight: '500' }}>Projects</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: 0 }}>Projects</h1>
          <p style={{ color: '#6B7280', margin: '8px 0 0 0' }}>Manage your ongoing and completed projects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 20px',
            backgroundColor: '#B8926E',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(197, 156, 130, 0.3)',
          }}
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {/* Toolbar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #E5E7EB',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF',
            }} />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '44px',
                paddingRight: '16px',
                paddingTop: '12px',
                paddingBottom: '12px',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'list' ? '#1F2937' : '#FFFFFF',
                color: viewMode === 'list' ? '#FFFFFF' : '#6B7280',
                borderRight: '1px solid #E5E7EB',
              }}
            >
              <List size={16} />
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'grid' ? '#1F2937' : '#FFFFFF',
                color: viewMode === 'grid' ? '#FFFFFF' : '#6B7280',
                borderRight: '1px solid #E5E7EB',
              }}
            >
              <Grid size={16} />
              Grid
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'kanban' ? '#1F2937' : '#FFFFFF',
                color: viewMode === 'kanban' ? '#FFFFFF' : '#6B7280',
              }}
            >
              <Columns3 size={16} />
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '256px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #DDC5B0',
            borderTopColor: '#B8926E',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoardFull />
      ) : projects.length === 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '64px',
          textAlign: 'center',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#F9FAFB',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}>
            <FolderKanban size={36} style={{ color: '#D1D5DB' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
            No projects found
          </h3>
          <p style={{ color: '#6B7280', margin: '0 0 24px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            Get started by creating your first project. Track progress, manage budgets, and collaborate with your team.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#B8926E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Create Project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}>
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onClick={() => navigate(`/admin/projects/${project._id}`)}
            />
          ))}
        </div>
      ) : (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Project</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Budget</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timeline</th>
                <th style={{ padding: '14px 20px', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project, index) => (
                <tr
                  key={project._id}
                  onClick={() => navigate(`/admin/projects/${project._id}`)}
                  style={{
                    borderTop: index > 0 ? '1px solid #F3F4F6' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {project.featured && (
                        <Star size={16} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                      )}
                      <div>
                        <p style={{ fontWeight: '600', color: '#1F2937', margin: 0 }}>{project.title}</p>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>{project.projectId}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: '#6B7280' }}>
                    {project.customer?.name || '-'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <StatusBadge status={project.status} />
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                    {formatCurrency(project.financials?.finalAmount || project.financials?.agreedAmount || project.financials?.quotedAmount || 0)}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: '#6B7280' }}>
                    {formatDate(project.startDate)}
                  </td>
                  <td style={{ padding: '16px 20px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleToggleFeatured(e, project._id)}
                      style={{
                        padding: '8px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      title={project.featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      <Star
                        size={16}
                        style={{
                          color: project.featured ? '#F59E0B' : '#9CA3AF',
                          fill: project.featured ? '#F59E0B' : 'none',
                        }}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderTop: '1px solid #F3F4F6',
            }}>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} projects
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    color: pagination.page === 1 ? '#D1D5DB' : '#374151',
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    color: pagination.page === pagination.totalPages ? '#D1D5DB' : '#374151',
                    cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Responsive Grid Styles */}
      <style>{`
        @media (max-width: 1200px) {
          div[style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 'repeat(3, 1fr)'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Create Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadProjects}
        customers={customers}
      />
    </div>
  )
}

export default ProjectsList
