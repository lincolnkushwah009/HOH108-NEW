import { useState } from 'react'
import {
  Package,
  Search,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle,
  Truck,
  Box,
  MapPin,
  Phone,
  Calendar,
  IndianRupee,
  Filter,
  X,
} from 'lucide-react'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.08)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}

const STATUS_CONFIG = {
  pending: { color: COLORS.textMuted, label: 'Pending', icon: Clock },
  confirmed: { color: COLORS.info, label: 'Confirmed', icon: CheckCircle },
  processing: { color: COLORS.warning, label: 'Processing', icon: Box },
  shipped: { color: COLORS.info, label: 'Shipped', icon: Truck },
  delivered: { color: COLORS.success, label: 'Delivered', icon: CheckCircle },
}

const mockOrders = [
  {
    id: 'ORD-2024-001',
    status: 'shipped',
    totalAmount: 185000,
    orderDate: '2024-01-15',
    estimatedDelivery: '2024-01-20',
    items: [
      { name: 'Custom Sofa Set (3+2)', quantity: 1, price: 185000, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200' },
    ],
    timeline: [
      { status: 'Order Placed', date: 'Jan 15, 10:30 AM', completed: true },
      { status: 'Order Confirmed', date: 'Jan 15, 11:00 AM', completed: true },
      { status: 'Processing', date: 'Jan 16, 09:00 AM', completed: true },
      { status: 'Shipped', date: 'Jan 18, 02:00 PM', completed: true },
      { status: 'Out for Delivery', date: 'Expected Jan 20', completed: false },
      { status: 'Delivered', date: '-', completed: false },
    ],
    tracking: {
      carrier: 'BlueDart',
      trackingId: 'BD123456789',
      currentLocation: 'Bangalore Hub',
    },
  },
  {
    id: 'ORD-2024-002',
    status: 'processing',
    totalAmount: 78000,
    orderDate: '2024-01-17',
    estimatedDelivery: '2024-01-25',
    items: [
      { name: 'Dining Table (6 Seater)', quantity: 1, price: 65000, image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=200' },
      { name: 'Dining Chairs', quantity: 6, price: 13000, image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=200' },
    ],
    timeline: [
      { status: 'Order Placed', date: 'Jan 17, 03:45 PM', completed: true },
      { status: 'Order Confirmed', date: 'Jan 17, 04:00 PM', completed: true },
      { status: 'Processing', date: 'Jan 18, 10:00 AM', completed: true },
      { status: 'Shipped', date: 'Expected Jan 22', completed: false },
      { status: 'Delivered', date: '-', completed: false },
    ],
  },
  {
    id: 'ORD-2024-003',
    status: 'delivered',
    totalAmount: 45000,
    orderDate: '2024-01-10',
    estimatedDelivery: '2024-01-14',
    deliveredDate: '2024-01-14',
    items: [
      { name: 'Center Table - Marble Top', quantity: 1, price: 45000, image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=200' },
    ],
    timeline: [
      { status: 'Order Placed', date: 'Jan 10, 09:00 AM', completed: true },
      { status: 'Order Confirmed', date: 'Jan 10, 09:30 AM', completed: true },
      { status: 'Processing', date: 'Jan 11, 10:00 AM', completed: true },
      { status: 'Shipped', date: 'Jan 12, 02:00 PM', completed: true },
      { status: 'Delivered', date: 'Jan 14, 11:30 AM', completed: true },
    ],
  },
]

const MobileOrders = () => {
  const [orders] = useState(mockOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedOrder, setExpandedOrder] = useState(null)

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
  ]

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = activeFilter === 'all' || order.status === activeFilter
    return matchesSearch && matchesFilter
  })

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const cardStyle = {
    background: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  }

  return (
    <div>
      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '16px',
      }}>
        <Search style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '20px',
          height: '20px',
          color: COLORS.textMuted,
        }} />
        <input
          type="text"
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px 14px 48px',
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '14px',
            color: COLORS.textPrimary,
            fontSize: '15px',
            outline: 'none',
          }}
        />
      </div>

      {/* Filter Pills */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        margin: '0 -16px 20px -16px',
        padding: '0 16px',
      }}>
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            style={{
              padding: '10px 18px',
              background: activeFilter === filter.id ? COLORS.accent : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '20px',
              color: activeFilter === filter.id ? COLORS.dark : COLORS.textPrimary,
              fontSize: '14px',
              fontWeight: activeFilter === filter.id ? '600' : '400',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredOrders.map((order) => {
          const statusConfig = STATUS_CONFIG[order.status]
          const StatusIcon = statusConfig.icon
          const isExpanded = expandedOrder === order.id

          return (
            <div key={order.id} style={cardStyle}>
              {/* Order Header */}
              <button
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: COLORS.textPrimary, fontSize: '15px', fontWeight: '600' }}>
                        {order.id}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        background: `${statusConfig.color}15`,
                        color: statusConfig.color,
                        fontSize: '11px',
                        fontWeight: '600',
                        borderRadius: '6px',
                      }}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>
                      Ordered on {new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <ChevronDown style={{
                    width: '20px',
                    height: '20px',
                    color: COLORS.textMuted,
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }} />
                </div>

                {/* Items Preview */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', marginRight: '8px' }}>
                    {order.items.slice(0, 3).map((item, i) => (
                      <div
                        key={i}
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '10px',
                          background: `url(${item.image}) center/cover`,
                          border: `2px solid ${COLORS.card}`,
                          marginLeft: i > 0 ? '-12px' : 0,
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: COLORS.textPrimary, fontSize: '14px', margin: '0 0 2px 0' }}>
                      {order.items[0].name}
                      {order.items.length > 1 && ` +${order.items.length - 1} more`}
                    </p>
                    <p style={{ color: COLORS.accent, fontSize: '15px', fontWeight: '600', margin: 0 }}>
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  {/* Timeline */}
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '600', margin: '0 0 16px 0' }}>
                      Order Timeline
                    </h4>
                    <div style={{ position: 'relative' }}>
                      {order.timeline.map((step, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            gap: '14px',
                            paddingBottom: index < order.timeline.length - 1 ? '20px' : 0,
                            position: 'relative',
                          }}
                        >
                          {/* Line */}
                          {index < order.timeline.length - 1 && (
                            <div style={{
                              position: 'absolute',
                              left: '11px',
                              top: '24px',
                              bottom: 0,
                              width: '2px',
                              background: step.completed ? COLORS.accent : COLORS.border,
                            }} />
                          )}

                          {/* Dot */}
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: step.completed ? COLORS.accent : COLORS.border,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            zIndex: 1,
                          }}>
                            {step.completed && (
                              <CheckCircle style={{ width: '14px', height: '14px', color: COLORS.dark }} />
                            )}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, paddingTop: '2px' }}>
                            <p style={{
                              color: step.completed ? COLORS.textPrimary : COLORS.textMuted,
                              fontSize: '14px',
                              fontWeight: step.completed ? '500' : '400',
                              margin: '0 0 2px 0',
                            }}>
                              {step.status}
                            </p>
                            <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>
                              {step.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tracking Info (if shipped) */}
                  {order.tracking && (
                    <div style={{
                      margin: '0 16px 16px',
                      padding: '14px',
                      background: `${COLORS.info}10`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: `${COLORS.info}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Truck style={{ width: '20px', height: '20px', color: COLORS.info }} />
                        </div>
                        <div>
                          <p style={{ color: COLORS.textPrimary, fontSize: '13px', fontWeight: '500', margin: '0 0 2px 0' }}>
                            {order.tracking.carrier}
                          </p>
                          <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>
                            {order.tracking.currentLocation}
                          </p>
                        </div>
                      </div>
                      <button style={{
                        padding: '8px 14px',
                        background: COLORS.info,
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}>
                        Track
                      </button>
                    </div>
                  )}

                  {/* Order Items */}
                  <div style={{
                    padding: '16px',
                    borderTop: `1px solid ${COLORS.border}`,
                  }}>
                    <h4 style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
                      Order Items
                    </h4>
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '12px 0',
                          borderBottom: index < order.items.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                        }}
                      >
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '10px',
                          background: `url(${item.image}) center/cover`,
                        }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>
                            {item.name}
                          </p>
                          <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>
                            Qty: {item.quantity}
                          </p>
                          <p style={{ color: COLORS.accent, fontSize: '14px', fontWeight: '600', margin: 0 }}>
                            {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{
                    padding: '16px',
                    borderTop: `1px solid ${COLORS.border}`,
                    display: 'flex',
                    gap: '10px',
                  }}>
                    <button style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '10px',
                      color: COLORS.textPrimary,
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}>
                      Need Help
                    </button>
                    <button style={{
                      flex: 1,
                      padding: '12px',
                      background: COLORS.accent,
                      border: 'none',
                      borderRadius: '10px',
                      color: COLORS.dark,
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}>
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredOrders.length === 0 && (
          <div style={{
            ...cardStyle,
            padding: '48px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Package style={{ width: '28px', height: '28px', color: COLORS.textMuted }} />
            </div>
            <h3 style={{ color: COLORS.textPrimary, fontSize: '17px', fontWeight: '600', margin: '0 0 8px 0' }}>
              No orders found
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: 0 }}>
              Your orders will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileOrders
