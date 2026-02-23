import { useState } from 'react'
import {
  Package,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  MapPin,
  Calendar,
  Phone,
  Box,
} from 'lucide-react'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textMuted: 'rgba(255,255,255,0.6)',
}

const Orders = () => {
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const orders = [
    {
      id: 'ORD-2026-001',
      projectName: '3BHK Interior - Whitefield',
      items: [
        { name: 'Italian Marble Flooring (800 sq ft)', quantity: 1, price: '85,000', status: 'Shipped' },
        { name: 'Vitrified Tiles - Bathroom', quantity: 4, price: '24,000', status: 'Shipped' },
      ],
      totalAmount: '1,09,000',
      orderDate: '2 Jan 2026',
      status: 'Shipped',
      expectedDelivery: '8 Jan 2026',
      trackingId: 'TRK123456789',
      vendor: 'Bangalore Marble Works',
      vendorPhone: '+91 98765 43210',
      deliveryAddress: 'Site: Whitefield Main Road, Near Phoenix Mall, Bangalore - 560066',
      timeline: [
        { status: 'Order Placed', date: '2 Jan 2026, 10:30 AM', completed: true },
        { status: 'Confirmed by Vendor', date: '2 Jan 2026, 2:15 PM', completed: true },
        { status: 'Processing', date: '3 Jan 2026, 9:00 AM', completed: true },
        { status: 'Shipped', date: '4 Jan 2026, 11:45 AM', completed: true },
        { status: 'Out for Delivery', date: 'Expected: 8 Jan 2026', completed: false },
        { status: 'Delivered', date: 'Pending', completed: false },
      ],
    },
    {
      id: 'ORD-2026-002',
      projectName: '3BHK Interior - Whitefield',
      items: [
        { name: 'Modular Kitchen Set - L-Shape', quantity: 1, price: '2,45,000', status: 'Processing' },
        { name: 'Chimney - Auto Clean 90cm', quantity: 1, price: '28,000', status: 'Processing' },
        { name: 'Built-in Hob - 4 Burner', quantity: 1, price: '18,000', status: 'Processing' },
      ],
      totalAmount: '2,91,000',
      orderDate: '1 Jan 2026',
      status: 'Processing',
      expectedDelivery: '20 Jan 2026',
      trackingId: 'TRK123456790',
      vendor: 'Kitchen Studio Pro',
      vendorPhone: '+91 98765 43211',
      deliveryAddress: 'Site: Whitefield Main Road, Near Phoenix Mall, Bangalore - 560066',
      timeline: [
        { status: 'Order Placed', date: '1 Jan 2026, 3:00 PM', completed: true },
        { status: 'Confirmed by Vendor', date: '1 Jan 2026, 5:30 PM', completed: true },
        { status: 'Manufacturing', date: '3 Jan 2026, 10:00 AM', completed: true },
        { status: 'Quality Check', date: 'Expected: 15 Jan 2026', completed: false },
        { status: 'Shipped', date: 'Expected: 18 Jan 2026', completed: false },
        { status: 'Delivered', date: 'Expected: 20 Jan 2026', completed: false },
      ],
    },
    {
      id: 'ORD-2025-098',
      projectName: '3BHK Interior - Whitefield',
      items: [
        { name: 'Living Room Sofa Set - 3+2+1', quantity: 1, price: '1,20,000', status: 'Delivered' },
        { name: 'Center Table - Marble Top', quantity: 1, price: '25,000', status: 'Delivered' },
      ],
      totalAmount: '1,45,000',
      orderDate: '20 Dec 2025',
      status: 'Delivered',
      expectedDelivery: '28 Dec 2025',
      deliveredDate: '27 Dec 2025',
      trackingId: 'TRK123456788',
      vendor: 'Urban Living Furniture',
      vendorPhone: '+91 98765 43212',
      deliveryAddress: 'Site: Whitefield Main Road, Near Phoenix Mall, Bangalore - 560066',
      timeline: [
        { status: 'Order Placed', date: '20 Dec 2025, 11:00 AM', completed: true },
        { status: 'Confirmed by Vendor', date: '20 Dec 2025, 2:00 PM', completed: true },
        { status: 'Processing', date: '21 Dec 2025, 9:00 AM', completed: true },
        { status: 'Shipped', date: '24 Dec 2025, 10:30 AM', completed: true },
        { status: 'Out for Delivery', date: '27 Dec 2025, 9:00 AM', completed: true },
        { status: 'Delivered', date: '27 Dec 2025, 11:30 AM', completed: true },
      ],
    },
    {
      id: 'ORD-2026-003',
      projectName: 'Villa Renovation - HSR Layout',
      items: [
        { name: 'Premium Wall Paint - Asian Paints Royale', quantity: 50, price: '45,000', status: 'Pending' },
        { name: 'Primer - 20L Cans', quantity: 10, price: '15,000', status: 'Pending' },
      ],
      totalAmount: '60,000',
      orderDate: '3 Jan 2026',
      status: 'Pending',
      expectedDelivery: 'TBD',
      trackingId: '-',
      vendor: 'Pending Assignment',
      vendorPhone: '-',
      deliveryAddress: 'Site: HSR Layout Sector 2, Bangalore - 560102',
      timeline: [
        { status: 'Order Placed', date: '3 Jan 2026, 4:00 PM', completed: true },
        { status: 'Awaiting Approval', date: 'Pending', completed: false },
        { status: 'Vendor Assignment', date: 'Pending', completed: false },
        { status: 'Processing', date: 'Pending', completed: false },
        { status: 'Shipped', date: 'Pending', completed: false },
        { status: 'Delivered', date: 'Pending', completed: false },
      ],
    },
  ]

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '#10b981'
      case 'shipped': return '#3b82f6'
      case 'processing': return '#f59e0b'
      case 'pending': return '#6b7280'
      case 'manufacturing': return '#8b5cf6'
      default: return COLORS.accent
    }
  }

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return CheckCircle2
      case 'shipped': return Truck
      case 'processing': return Clock
      case 'pending': return AlertCircle
      default: return Package
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status.toLowerCase() !== filterStatus) return false
    if (searchQuery && !order.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !order.projectName.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const stats = [
    { label: 'Total Orders', value: orders.length, color: COLORS.accent },
    { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, color: '#6b7280' },
    { label: 'Processing', value: orders.filter(o => o.status === 'Processing').length, color: '#f59e0b' },
    { label: 'Shipped', value: orders.filter(o => o.status === 'Shipped').length, color: '#3b82f6' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, color: '#10b981' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
          Order Tracking (ODS)
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: '15px' }}>
          Track all your material orders, deliveries, and shipments in real-time.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '8px',
      }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            onClick={() => setFilterStatus(stat.label === 'Total Orders' ? 'all' : stat.label.toLowerCase())}
            style={{
              background: filterStatus === (stat.label === 'Total Orders' ? 'all' : stat.label.toLowerCase())
                ? `${stat.color}20` : COLORS.card,
              borderRadius: '12px',
              padding: '16px 24px',
              border: `1px solid ${filterStatus === (stat.label === 'Total Orders' ? 'all' : stat.label.toLowerCase())
                ? stat.color : 'rgba(255,255,255,0.05)'}`,
              cursor: 'pointer',
              minWidth: '140px',
              transition: 'all 0.2s ease',
            }}
          >
            <p style={{ color: stat.color, fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>{stat.value}</p>
            <p style={{ color: COLORS.textMuted, fontSize: '13px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '24px' }}>
        <Search style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '18px',
          height: '18px',
          color: 'rgba(255,255,255,0.4)',
        }} />
        <input
          type="text"
          placeholder="Search by Order ID or Project..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 44px',
            background: COLORS.card,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredOrders.map((order) => {
          const StatusIcon = getStatusIcon(order.status)
          const isExpanded = expandedOrder === order.id

          return (
            <div
              key={order.id}
              style={{
                background: COLORS.card,
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
              }}
            >
              {/* Order Header */}
              <div
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                style={{
                  padding: '20px 24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${getStatusColor(order.status)}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <StatusIcon style={{ width: '24px', height: '24px', color: getStatusColor(order.status) }} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>{order.id}</h3>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '500',
                      background: `${getStatusColor(order.status)}20`,
                      color: getStatusColor(order.status),
                    }}>
                      {order.status}
                    </span>
                  </div>
                  <p style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                    {order.projectName} | {order.items.length} item(s) | Rs. {order.totalAmount}
                  </p>
                </div>

                <div style={{ textAlign: 'right', marginRight: '16px' }}>
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '2px' }}>
                    {order.status === 'Delivered' ? 'Delivered' : 'Expected'}
                  </p>
                  <p style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                    {order.status === 'Delivered' ? order.deliveredDate : order.expectedDelivery}
                  </p>
                </div>

                <ChevronDown style={{
                  width: '20px',
                  height: '20px',
                  color: COLORS.textMuted,
                  transition: 'transform 0.2s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                }} />
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  padding: '24px',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Left - Items & Details */}
                    <div>
                      <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Order Items</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                        {order.items.map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              background: 'rgba(255,255,255,0.03)',
                              borderRadius: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <Box style={{ width: '18px', height: '18px', color: COLORS.accent }} />
                              <div>
                                <p style={{ color: 'white', fontSize: '14px' }}>{item.name}</p>
                                <p style={{ color: COLORS.textMuted, fontSize: '12px' }}>Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <p style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>Rs. {item.price}</p>
                          </div>
                        ))}
                      </div>

                      {/* Vendor & Delivery Info */}
                      <div style={{
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                      }}>
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '4px' }}>Vendor</p>
                          <p style={{ color: 'white', fontSize: '14px' }}>{order.vendor}</p>
                          {order.vendorPhone !== '-' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <Phone style={{ width: '12px', height: '12px', color: COLORS.accent }} />
                              <span style={{ color: COLORS.accent, fontSize: '13px' }}>{order.vendorPhone}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '4px' }}>Delivery Address</p>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <MapPin style={{ width: '14px', height: '14px', color: COLORS.accent, marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ color: 'white', fontSize: '14px', lineHeight: 1.5 }}>{order.deliveryAddress}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right - Timeline */}
                    <div>
                      <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>Order Timeline</h4>
                      <div style={{ position: 'relative' }}>
                        {order.timeline.map((step, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              gap: '16px',
                              paddingBottom: idx < order.timeline.length - 1 ? '24px' : 0,
                              position: 'relative',
                            }}
                          >
                            {/* Line */}
                            {idx < order.timeline.length - 1 && (
                              <div style={{
                                position: 'absolute',
                                left: '11px',
                                top: '24px',
                                width: '2px',
                                height: 'calc(100% - 12px)',
                                background: step.completed ? COLORS.accent : 'rgba(255,255,255,0.1)',
                              }} />
                            )}

                            {/* Dot */}
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: step.completed ? COLORS.accent : 'rgba(255,255,255,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              zIndex: 1,
                            }}>
                              {step.completed && (
                                <CheckCircle2 style={{ width: '14px', height: '14px', color: COLORS.dark }} />
                              )}
                            </div>

                            {/* Content */}
                            <div>
                              <p style={{
                                color: step.completed ? 'white' : COLORS.textMuted,
                                fontSize: '14px',
                                fontWeight: step.completed ? '500' : '400',
                              }}>
                                {step.status}
                              </p>
                              <p style={{ color: COLORS.textMuted, fontSize: '12px', marginTop: '2px' }}>{step.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: COLORS.card,
          borderRadius: '16px',
        }}>
          <Package style={{ width: '48px', height: '48px', color: COLORS.textMuted, margin: '0 auto 16px' }} />
          <p style={{ color: 'white', fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No orders found</p>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  )
}

export default Orders
