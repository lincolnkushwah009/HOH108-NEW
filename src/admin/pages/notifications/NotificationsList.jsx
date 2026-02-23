import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Trash2,
  Eye,
  Filter,
} from 'lucide-react'
import { apiRequest } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Badge } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatRelativeTime, formatDateTime } from '../../utils/helpers'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'lead', label: 'Leads' },
  { key: 'assignment', label: 'Assignments' },
  { key: 'approval', label: 'Approvals' },
  { key: 'project', label: 'Projects' },
  { key: 'escalation', label: 'Escalations' },
  { key: 'system', label: 'System' },
]

const NotificationsList = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalUnread, setTotalUnread] = useState(0)

  useEffect(() => {
    fetchNotifications()
  }, [activeCategory, readFilter, page])

  useEffect(() => {
    fetchUnreadCount()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (activeCategory !== 'all') params.set('category', activeCategory)
      if (readFilter === 'unread') params.set('read', 'false')
      if (readFilter === 'read') params.set('read', 'true')

      const data = await apiRequest('/notifications?' + params.toString())
      if (data.success) {
        setNotifications(data.data || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotal(data.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
      setError(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const data = await apiRequest('/notifications/count')
      if (data.success) {
        setTotalUnread(data.data?.unread || 0)
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await apiRequest('/notifications/' + id + '/read', { method: 'PUT' })
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
      setTotalUnread((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setTotalUnread(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await apiRequest('/notifications/' + id, { method: 'DELETE' })
      setNotifications((prev) => prev.filter((n) => n._id !== id))
      setTotal((prev) => Math.max(0, prev - 1))
      fetchUnreadCount()
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const handleClearRead = async () => {
    try {
      await apiRequest('/notifications/clear-read', { method: 'DELETE' })
      fetchNotifications()
    } catch (err) {
      console.error('Failed to clear read notifications:', err)
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkRead(notification._id)
    }
    const url = notification.actionUrl
    if (url) {
      navigate(url)
      return
    }
    if (notification.entityType && notification.entityId) {
      const eid = notification.entityId
      const routes = {
        Lead: '/admin/leads/' + eid,
        Customer: '/admin/customers/' + eid,
        Project: '/admin/projects/' + eid,
        PurchaseRequisition: '/admin/purchase-requisitions/' + eid,
        PurchaseOrder: '/admin/purchase-orders/' + eid,
        SalesOrder: '/admin/crm/sales-orders/' + eid,
        Ticket: '/admin/tickets/' + eid,
      }
      if (routes[notification.entityType]) {
        navigate(routes[notification.entityType])
      }
    }
  }

  const getTypeIcon = (type) => {
    const s = { width: 18, height: 18 }
    if (type === 'warning') return <AlertTriangle style={{ ...s, color: '#d97706' }} />
    if (type === 'success') return <CheckCircle style={{ ...s, color: '#059669' }} />
    if (type === 'error') return <XCircle style={{ ...s, color: '#dc2626' }} />
    return <Info style={{ ...s, color: '#2563eb' }} />
  }

  const getTypeBadgeColor = (type) => {
    if (type === 'warning') return 'yellow'
    if (type === 'success') return 'green'
    if (type === 'error') return 'red'
    if (type === 'alert') return 'orange'
    return 'blue'
  }

  const getCategoryBadgeColor = (category) => {
    const map = {
      lead: 'blue', assignment: 'purple', approval: 'orange',
      project: 'green', escalation: 'red', system: 'gray', customer: 'teal',
    }
    return map[category] || 'gray'
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Stay updated with all your tasks, approvals, and activities"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Notifications' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            {totalUnread > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                Mark All Read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleClearRead}>
              Clear Read
            </Button>
          </div>
        }
      />

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveCategory(cat.key); setPage(1) }}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: isActive ? '2px solid #C59C82' : '1px solid #e2e8f0',
                background: isActive ? '#FDF8F4' : 'white',
                color: isActive ? '#C59C82' : '#64748b',
                fontWeight: isActive ? '600' : '500',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Read/Unread Filter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter style={{ width: 14, height: 14, color: '#94a3b8' }} />
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => { setReadFilter(f); setPage(1) }}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                background: readFilter === f ? '#1e293b' : 'transparent',
                color: readFilter === f ? 'white' : '#64748b',
                fontWeight: '500',
                fontSize: '13px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
          {total} notification{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '16px 20px',
          background: '#fef2f2',
          borderRadius: '12px',
          color: '#dc2626',
          fontSize: '14px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Notifications List */}
      {loading ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description={
            readFilter === 'unread'
              ? "You're all caught up! No unread notifications."
              : 'No notifications to show in this category.'
          }
        />
      ) : (
        <Card padding="none" style={{ overflow: 'hidden' }}>
          {notifications.map((notification, index) => (
            <div
              key={notification._id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'background 0.15s',
                borderBottom: index < notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
                background: notification.isRead ? 'white' : '#FEFBF8',
              }}
              onClick={() => handleNotificationClick(notification)}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = notification.isRead ? 'white' : '#FEFBF8' }}
            >
              {/* Unread indicator */}
              <div style={{
                width: '8px',
                minWidth: '8px',
                height: '8px',
                borderRadius: '50%',
                background: notification.isRead ? 'transparent' : '#C59C82',
                marginTop: '8px',
              }} />

              {/* Type Icon */}
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                {getTypeIcon(notification.type)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: notification.isRead ? '500' : '700',
                    color: '#1e293b',
                  }}>
                    {notification.title || 'Notification'}
                  </span>
                  {notification.category && (
                    <Badge color={getCategoryBadgeColor(notification.category)} size="sm">
                      {notification.category}
                    </Badge>
                  )}
                  {notification.type && (
                    <Badge color={getTypeBadgeColor(notification.type)} size="sm">
                      {notification.type}
                    </Badge>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 6px 0', lineHeight: '1.5' }}>
                  {notification.message || ''}
                </p>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {formatDateTime(notification.createdAt)}
                  {' \u00B7 '}
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {!notification.isRead && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkRead(notification._id) }}
                    title="Mark as read"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Eye style={{ width: 15, height: 15, color: '#94a3b8' }} />
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(e, notification._id)}
                  title="Delete"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Trash2 style={{ width: 15, height: 15, color: '#94a3b8' }} />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              padding: '16px 20px',
              borderTop: '1px solid #f1f5f9',
            }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: page <= 1 ? '#cbd5e1' : '#475569',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Previous
              </button>
              <span style={{ padding: '6px 12px', fontSize: '13px', color: '#64748b' }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  color: page >= totalPages ? '#cbd5e1' : '#475569',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Next
              </button>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default NotificationsList
