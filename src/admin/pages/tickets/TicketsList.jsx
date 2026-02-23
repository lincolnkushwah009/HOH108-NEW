import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Ticket, Plus, Search, Clock, AlertTriangle, CheckCircle,
  XCircle, User, Calendar, ChevronRight, MoreVertical, RefreshCw,
  MessageSquare, Building2, Tag, Volume2, VolumeX, Trash2
} from 'lucide-react'
import { ticketsAPI, ticketCategoriesAPI } from '../../utils/api'
import { Card, Button, SearchInput, Badge, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/layout/PageHeader'
import { playNotificationSound, playUrgentSound } from '../../utils/notificationSound'
import { useAuth } from '../../context/AuthContext'

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#6B7280', bg: '#F3F4F6' },
  medium: { label: 'Medium', color: '#2563EB', bg: '#DBEAFE' },
  high: { label: 'High', color: '#EA580C', bg: '#FFEDD5' },
  critical: { label: 'Critical', color: '#DC2626', bg: '#FEE2E2' },
}

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: '#6B7280', bg: '#F3F4F6' },
  pending_approval: { label: 'Pending Approval', color: '#D97706', bg: '#FEF3C7' },
  open: { label: 'Open', color: '#2563EB', bg: '#DBEAFE' },
  in_progress: { label: 'In Progress', color: '#C59C82', bg: '#F5EDE6' },
  pending_info: { label: 'Pending Info', color: '#EA580C', bg: '#FFEDD5' },
  resolved: { label: 'Resolved', color: '#059669', bg: '#D1FAE5' },
  closed: { label: 'Closed', color: '#6B7280', bg: '#F3F4F6' },
  reopened: { label: 'Reopened', color: '#DC2626', bg: '#FEE2E2' },
}

const TicketCard = ({ ticket, onClick, onDelete, isSuperAdmin }) => {
  // Don't show SLA breach for resolved/closed tickets
  const isClosedOrResolved = ['resolved', 'closed'].includes(ticket.status)
  const isOverdue = !isClosedOrResolved && (ticket.slaBreached || (ticket.slaDueDate && new Date(ticket.slaDueDate) < new Date()))
  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.draft
  const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium

  const cardStyle = {
    background: '#ffffff',
    borderRadius: '16px',
    border: isOverdue ? '2px solid #FCA5A5' : '1px solid #E5E7EB',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    position: 'relative',
  }

  const handleMouseEnter = (e) => {
    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'
    e.currentTarget.style.transform = 'translateY(-2px)'
  }

  const handleMouseLeave = (e) => {
    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
    e.currentTarget.style.transform = 'translateY(0)'
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete ticket "${ticket.ticketId}"? This action cannot be undone.`)) {
      onDelete(ticket._id)
    }
  }

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Delete Button for Super Admin */}
      {isSuperAdmin && (
        <button
          onClick={handleDelete}
          title="Delete ticket"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FEE2E2',
            color: '#DC2626',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#DC2626'
            e.currentTarget.style.color = '#FFFFFF'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FEE2E2'
            e.currentTarget.style.color = '#DC2626'
          }}
        >
          <Trash2 size={16} />
        </button>
      )}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: isOverdue ? '#FEE2E2' : statusConfig.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Ticket size={20} style={{ color: isOverdue ? '#DC2626' : statusConfig.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#9CA3AF' }}>
              {ticket.ticketId}
            </span>
            {isOverdue && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  fontSize: '11px',
                  fontWeight: '500',
                  borderRadius: '4px',
                }}
              >
                <AlertTriangle size={10} />
                SLA Breached
              </span>
            )}
          </div>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: '#1F2937',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {ticket.title}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '13px',
          color: '#6B7280',
          margin: '0 0 16px 0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {ticket.description}
      </p>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            background: statusConfig.bg,
            color: statusConfig.color,
            fontSize: '12px',
            fontWeight: '500',
            borderRadius: '6px',
          }}
        >
          {statusConfig.label}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            background: priorityConfig.bg,
            color: priorityConfig.color,
            fontSize: '12px',
            fontWeight: '500',
            borderRadius: '6px',
          }}
        >
          {priorityConfig.label}
        </span>
        {ticket.categoryName && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              background: '#F3F4F6',
              color: '#6B7280',
              fontSize: '12px',
              fontWeight: '500',
              borderRadius: '6px',
            }}
          >
            <Tag size={10} />
            {ticket.categoryName}
          </span>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          borderTop: '1px solid #F3F4F6',
          fontSize: '12px',
          color: '#9CA3AF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} />
            {ticket.requestedByName || 'Unknown'}
          </span>
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} />
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Assigned To */}
      {ticket.assignedToName && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#6B7280' }}>
          <span style={{ color: '#9CA3AF' }}>Assigned to: </span>
          <span style={{ fontWeight: '500' }}>{ticket.assignedToName}</span>
        </div>
      )}
    </div>
  )
}

export default function TicketsList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    pendingApproval: 0,
    resolved: 0,
    slaBreached: 0,
  })
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    category: searchParams.get('category') || '',
    search: '',
  })
  const [viewMode, setViewMode] = useState(() => {
    const view = searchParams.get('view')
    if (view === 'my') return 'my'
    if (view === 'assigned') return 'assigned'
    return 'all'
  })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('ticketSoundEnabled')
    return saved !== 'false' // Default to true
  })
  const previousAssignedCountRef = useRef(null)
  const isFirstLoadRef = useRef(true)

  // Update viewMode when URL changes
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'my') setViewMode('my')
    else if (view === 'assigned') setViewMode('assigned')
    else if (!view) setViewMode('all')
  }, [searchParams])

  useEffect(() => {
    fetchCategories()
    seedCategoriesIfEmpty()
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [filters, viewMode, pagination.page])

  // Poll for new assigned tickets every 30 seconds
  useEffect(() => {
    const checkForNewTickets = async () => {
      try {
        const response = await ticketsAPI.getAssigned({ page: 1, limit: 1 })
        const newCount = response.pagination?.total || 0

        // Only play sound if not first load and count increased
        if (!isFirstLoadRef.current && previousAssignedCountRef.current !== null) {
          if (newCount > previousAssignedCountRef.current && soundEnabled) {
            // Check if there's a critical/high priority ticket
            const assignedResponse = await ticketsAPI.getAssigned({ page: 1, limit: 5 })
            const newTickets = assignedResponse.data || []
            const hasCritical = newTickets.some(t => t.priority === 'critical' || t.priority === 'high')

            if (hasCritical) {
              playUrgentSound()
            } else {
              playNotificationSound()
            }

            // Show browser notification if permitted
            if (Notification.permission === 'granted') {
              new Notification('New Ticket Assigned', {
                body: `You have ${newCount - previousAssignedCountRef.current} new ticket(s) assigned to you`,
                icon: '/favicon.png'
              })
            }
          }
        }

        previousAssignedCountRef.current = newCount
        isFirstLoadRef.current = false
      } catch (error) {
        console.error('Error checking for new tickets:', error)
      }
    }

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Initial check
    checkForNewTickets()

    // Set up polling interval
    const interval = setInterval(checkForNewTickets, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [soundEnabled])

  // Toggle sound function
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev
      localStorage.setItem('ticketSoundEnabled', String(newValue))
      // Play a test sound when enabling
      if (newValue) {
        playNotificationSound()
      }
      return newValue
    })
  }, [])

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin'

  // Handle delete ticket (super admin only)
  const handleDeleteTicket = async (ticketId) => {
    try {
      await ticketsAPI.delete(ticketId)
      fetchTickets() // Refresh the list
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('Failed to delete ticket: ' + (error.message || 'Unknown error'))
    }
  }

  const seedCategoriesIfEmpty = async () => {
    try {
      const response = await ticketCategoriesAPI.getAll()
      if (!response.data || response.data.length === 0) {
        await ticketCategoriesAPI.seed()
        fetchCategories()
      }
    } catch (error) {
      console.error('Error seeding categories:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await ticketCategoriesAPI.getAll()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      }
      Object.keys(params).forEach(key => !params[key] && delete params[key])

      let response
      switch (viewMode) {
        case 'my':
          response = await ticketsAPI.getMy(params)
          break
        case 'assigned':
          response = await ticketsAPI.getAssigned(params)
          break
        case 'pending_approval':
          response = await ticketsAPI.getPendingApproval(params)
          break
        default:
          response = await ticketsAPI.getAll(params)
      }

      setTickets(response.data || [])
      setPagination(prev => ({ ...prev, total: response.pagination?.total || 0 }))

      const statsResponse = await ticketsAPI.getStats()
      // Backend returns stats in data.overview
      setStats(statsResponse.data?.overview || statsResponse.data || {})
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
    if (value) {
      searchParams.set(key, value)
    } else {
      searchParams.delete(key)
    }
    setSearchParams(searchParams)
  }

  const STATS_DATA = [
    { key: 'total', label: 'Total', icon: Ticket, bg: '#DBEAFE', color: '#2563EB' },
    { key: 'open', label: 'Open', icon: RefreshCw, bg: '#F5EDE6', color: '#C59C82' },
    { key: 'pendingApproval', label: 'Pending', icon: Clock, bg: '#FEF3C7', color: '#D97706' },
    { key: 'resolved', label: 'Resolved', icon: CheckCircle, bg: '#D1FAE5', color: '#059669' },
    { key: 'slaBreached', label: 'SLA Breached', icon: AlertTriangle, bg: '#FEE2E2', color: '#DC2626' },
  ]

  const TABS = [
    { id: 'all', label: 'All Tickets' },
    { id: 'my', label: 'My Tickets' },
    { id: 'assigned', label: 'Assigned to Me' },
    { id: 'pending_approval', label: 'Pending Approval' },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1F2937', margin: 0 }}>
            Support Tickets
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
            Manage and track internal support requests
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Disable notification sound' : 'Enable notification sound'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: soundEnabled ? '#D1FAE5' : '#F3F4F6',
              color: soundEnabled ? '#059669' : '#6B7280',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button
            onClick={() => navigate('/admin/tickets/new')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Plus size={18} />
            New Ticket
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {STATS_DATA.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.key}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: stat.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} style={{ color: stat.color }} />
                </div>
                <div>
                  <p style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: 0, lineHeight: 1 }}>
                    {stats[stat.key] || 0}
                  </p>
                  <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs and Filters */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          marginBottom: '24px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setViewMode(tab.id)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              style={{
                padding: '16px 24px',
                fontSize: '14px',
                fontWeight: '500',
                color: viewMode === tab.id ? '#2563EB' : '#6B7280',
                background: viewMode === tab.id ? '#EFF6FF' : 'transparent',
                border: 'none',
                borderBottom: viewMode === tab.id ? '2px solid #2563EB' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-1px',
              }}
              onMouseEnter={(e) => {
                if (viewMode !== tab.id) {
                  e.currentTarget.style.background = '#F9FAFB'
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== tab.id) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ padding: '16px 20px', background: '#F9FAFB' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9CA3AF',
                }}
              />
              <input
                type="text"
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  background: '#ffffff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3B82F6'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{
                padding: '10px 14px',
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '140px',
              }}
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              style={{
                padding: '10px 14px',
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '140px',
              }}
            >
              <option value="">All Priority</option>
              {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              style={{
                padding: '10px 14px',
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer',
                outline: 'none',
                minWidth: '160px',
              }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #E5E7EB',
              borderTopColor: '#3B82F6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : tickets.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '60px 40px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Ticket size={36} style={{ color: '#9CA3AF' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1F2937', margin: '0 0 8px 0' }}>
            No tickets found
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            {viewMode === 'my'
              ? "You haven't created any tickets yet."
              : viewMode === 'assigned'
                ? "No tickets are assigned to you."
                : viewMode === 'pending_approval'
                  ? "No tickets pending your approval."
                  : "No tickets match your filters."
            }
          </p>
          <button
            onClick={() => navigate('/admin/tickets/new')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Plus size={18} />
            Create New Ticket
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '20px',
            }}
          >
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket._id}
                ticket={ticket}
                onClick={() => navigate(`/admin/tickets/${ticket._id}`)}
                onDelete={handleDeleteTicket}
                isSuperAdmin={isSuperAdmin}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                padding: '16px 20px',
                marginTop: '24px',
              }}
            >
              <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    background: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: pagination.page === 1 ? '#D1D5DB' : '#374151',
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous
                </button>
                <span
                  style={{
                    padding: '8px 14px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  {pagination.page}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page * pagination.limit >= pagination.total}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    background: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: pagination.page * pagination.limit >= pagination.total ? '#D1D5DB' : '#374151',
                    cursor: pagination.page * pagination.limit >= pagination.total ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
