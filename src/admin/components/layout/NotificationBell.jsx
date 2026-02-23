import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Info, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { io } from 'socket.io-client'
import { apiRequest } from '../../utils/api'
import { formatRelativeTime } from '../../utils/helpers'
import Badge from '../ui/Badge'

const NotificationBell = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPanel, setShowPanel] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)
  const socketRef = useRef(null)

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Socket.IO connection for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem('hoh108_admin_token')
    if (!token) return

    const socketUrl = import.meta.env.PROD
      ? 'https://hoh108.com'
      : `http://${window.location.hostname}:5001`

    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 20))
      setUnreadCount((prev) => prev + 1)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/notifications?limit=10&read=false')
      if (data.success) {
        setNotifications(data.data || [])
        setUnreadCount(data.unreadCount || data.data?.length || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = async (notification) => {
    try {
      await apiRequest(`/notifications/${notification._id}/read`, {
        method: 'PUT',
      })
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, read: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }

    if (notification.link) {
      navigate(notification.link)
    }
    setShowPanel(false)
  }

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', {
        method: 'PUT',
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle style={{ width: 16, height: 16, color: '#d97706' }} />
      case 'success':
        return <CheckCircle style={{ width: 16, height: 16, color: '#059669' }} />
      case 'info':
      default:
        return <Info style={{ width: 16, height: 16, color: '#2563eb' }} />
    }
  }

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'warning': return 'yellow'
      case 'success': return 'green'
      case 'info':
      default: return 'blue'
    }
  }

  const bellContainerStyle = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  }

  const bellButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
    position: 'relative',
  }

  const badgeCountStyle = {
    position: 'absolute',
    top: '2px',
    right: '2px',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    background: '#dc2626',
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    lineHeight: 1,
    border: '2px solid white',
  }

  const panelStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    width: '360px',
    maxHeight: '400px',
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
    overflowY: 'auto',
    zIndex: 1000,
  }

  const panelHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    position: 'sticky',
    top: 0,
    background: 'white',
    borderRadius: '16px 16px 0 0',
    zIndex: 1,
  }

  const notificationItemStyle = (isRead) => ({
    display: 'flex',
    gap: '12px',
    padding: '14px 20px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    borderBottom: '1px solid #f8fafc',
    background: isRead ? 'white' : '#FDF8F4',
  })

  const markAllButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#C59C82',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'background 0.15s',
  }

  return (
    <div style={bellContainerStyle} ref={panelRef}>
      <button
        style={bellButtonStyle}
        onClick={() => setShowPanel(!showPanel)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f8fafc'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none'
        }}
      >
        <Bell style={{ width: 22, height: 22, color: '#64748b' }} />
        {unreadCount > 0 && (
          <span style={badgeCountStyle}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div style={panelStyle}>
          {/* Panel Header */}
          <div style={panelHeaderStyle}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
              Notifications
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  style={markAllButtonStyle}
                  onClick={handleMarkAllRead}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FDF8F4'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none'
                  }}
                >
                  Mark All Read
                </button>
              )}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onClick={() => setShowPanel(false)}
              >
                <X style={{ width: 16, height: 16, color: '#94a3b8' }} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Bell style={{ width: 32, height: 32, color: '#cbd5e1', margin: '0 auto 12px' }} />
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
                No new notifications
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                style={notificationItemStyle(notification.read)}
                onClick={() => handleNotificationClick(notification)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notification.read ? 'white' : '#FDF8F4'
                }}
              >
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  {getTypeIcon(notification.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: notification.read ? '500' : '700',
                      color: '#1e293b',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {notification.title}
                    </span>
                    <Badge color={getTypeBadgeColor(notification.type)} size="sm">
                      {notification.type || 'info'}
                    </Badge>
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: '1.4',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {notification.message}
                  </p>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
                {!notification.read && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#C59C82',
                    flexShrink: 0,
                    marginTop: '6px',
                  }} />
                )}
              </div>
            ))
          )}

          {/* View All Link */}
          <div
            style={{
              padding: '12px 20px',
              textAlign: 'center',
              borderTop: '1px solid #f1f5f9',
              position: 'sticky',
              bottom: 0,
              background: 'white',
              borderRadius: '0 0 16px 16px',
            }}
          >
            <button
              onClick={() => {
                navigate('/admin/notifications')
                setShowPanel(false)
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#C59C82',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FDF8F4'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
              }}
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
