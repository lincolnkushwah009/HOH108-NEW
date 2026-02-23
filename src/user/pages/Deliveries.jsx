import { useState } from 'react'
import {
  Truck,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Package,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
} from 'lucide-react'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textMuted: 'rgba(255,255,255,0.6)',
}

const Deliveries = () => {
  const [activeTab, setActiveTab] = useState('upcoming')

  const deliveries = {
    upcoming: [
      {
        id: 'DEL-001',
        orderId: 'ORD-2026-001',
        item: 'Italian Marble Flooring (800 sq ft)',
        project: '3BHK Interior - Whitefield',
        scheduledDate: '8 Jan 2026',
        timeSlot: '10:00 AM - 12:00 PM',
        status: 'On the way',
        driver: 'Rajesh Kumar',
        driverPhone: '+91 98765 12345',
        vehicle: 'KA-01-AB-1234',
        location: 'Whitefield Main Road, Near Phoenix Mall',
        estimatedArrival: '11:30 AM',
        items: 45,
        weight: '2,500 kg',
      },
      {
        id: 'DEL-002',
        orderId: 'ORD-2026-001',
        item: 'Vitrified Tiles - Bathroom',
        project: '3BHK Interior - Whitefield',
        scheduledDate: '8 Jan 2026',
        timeSlot: '2:00 PM - 4:00 PM',
        status: 'Scheduled',
        driver: 'Pending Assignment',
        driverPhone: '-',
        vehicle: '-',
        location: 'Whitefield Main Road, Near Phoenix Mall',
        estimatedArrival: '3:00 PM',
        items: 120,
        weight: '800 kg',
      },
      {
        id: 'DEL-003',
        orderId: 'ORD-2026-002',
        item: 'Modular Kitchen Set - L-Shape',
        project: '3BHK Interior - Whitefield',
        scheduledDate: '20 Jan 2026',
        timeSlot: '9:00 AM - 1:00 PM',
        status: 'Scheduled',
        driver: 'Pending Assignment',
        driverPhone: '-',
        vehicle: '-',
        location: 'Whitefield Main Road, Near Phoenix Mall',
        estimatedArrival: '10:00 AM',
        items: 28,
        weight: '450 kg',
      },
    ],
    completed: [
      {
        id: 'DEL-004',
        orderId: 'ORD-2025-098',
        item: 'Living Room Sofa Set - 3+2+1',
        project: '3BHK Interior - Whitefield',
        scheduledDate: '27 Dec 2025',
        timeSlot: '10:00 AM - 12:00 PM',
        status: 'Delivered',
        deliveredAt: '11:30 AM',
        driver: 'Suresh M',
        driverPhone: '+91 98765 67890',
        vehicle: 'KA-01-CD-5678',
        location: 'Whitefield Main Road, Near Phoenix Mall',
        receivedBy: 'Site Supervisor - Ravi',
        items: 6,
        weight: '280 kg',
      },
      {
        id: 'DEL-005',
        orderId: 'ORD-2025-098',
        item: 'Center Table - Marble Top',
        project: '3BHK Interior - Whitefield',
        scheduledDate: '27 Dec 2025',
        timeSlot: '10:00 AM - 12:00 PM',
        status: 'Delivered',
        deliveredAt: '11:30 AM',
        driver: 'Suresh M',
        driverPhone: '+91 98765 67890',
        vehicle: 'KA-01-CD-5678',
        location: 'Whitefield Main Road, Near Phoenix Mall',
        receivedBy: 'Site Supervisor - Ravi',
        items: 1,
        weight: '85 kg',
      },
    ],
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'on the way': return '#10b981'
      case 'scheduled': return '#3b82f6'
      case 'delivered': return '#6b7280'
      case 'delayed': return '#ef4444'
      default: return COLORS.accent
    }
  }

  const currentDeliveries = activeTab === 'upcoming' ? deliveries.upcoming : deliveries.completed

  // Calendar View Data
  const calendarDates = [
    { date: '5', day: 'Sun', deliveries: 0, isToday: false },
    { date: '6', day: 'Mon', deliveries: 0, isToday: false },
    { date: '7', day: 'Tue', deliveries: 0, isToday: false },
    { date: '8', day: 'Wed', deliveries: 2, isToday: true },
    { date: '9', day: 'Thu', deliveries: 0, isToday: false },
    { date: '10', day: 'Fri', deliveries: 0, isToday: false },
    { date: '11', day: 'Sat', deliveries: 0, isToday: false },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
          Deliveries
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: '15px' }}>
          Track all your upcoming and past deliveries.
        </p>
      </div>

      {/* Week Calendar Strip */}
      <div style={{
        background: COLORS.card,
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        border: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>January 2026</h3>
          <Calendar style={{ width: '20px', height: '20px', color: COLORS.accent }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {calendarDates.map((item) => (
            <div
              key={item.date}
              style={{
                flex: 1,
                padding: '12px 8px',
                borderRadius: '12px',
                textAlign: 'center',
                background: item.isToday ? `${COLORS.accent}20` : 'rgba(255,255,255,0.02)',
                border: item.isToday ? `2px solid ${COLORS.accent}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <p style={{ color: COLORS.textMuted, fontSize: '11px', marginBottom: '4px' }}>{item.day}</p>
              <p style={{ color: item.isToday ? COLORS.accent : 'white', fontSize: '18px', fontWeight: '600' }}>{item.date}</p>
              {item.deliveries > 0 && (
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: COLORS.accent,
                  color: COLORS.dark,
                  fontSize: '11px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '6px auto 0',
                }}>
                  {item.deliveries}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }} className="delivery-stats">
        {[
          { label: "Today's Deliveries", value: 2, icon: Truck, color: '#10b981' },
          { label: 'This Week', value: 3, icon: Calendar, color: '#3b82f6' },
          { label: 'Pending', value: 5, icon: Clock, color: '#f59e0b' },
          { label: 'Completed', value: deliveries.completed.length, icon: CheckCircle2, color: '#6b7280' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: COLORS.card,
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <stat.icon style={{ width: '20px', height: '20px', color: stat.color }} />
              </div>
            </div>
            <p style={{ color: 'white', fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>{stat.value}</p>
            <p style={{ color: COLORS.textMuted, fontSize: '13px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: COLORS.card,
        padding: '6px',
        borderRadius: '12px',
        width: 'fit-content',
      }}>
        {['upcoming', 'completed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab ? COLORS.accent : 'transparent',
              color: activeTab === tab ? COLORS.dark : COLORS.textMuted,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease',
            }}
          >
            {tab} ({tab === 'upcoming' ? deliveries.upcoming.length : deliveries.completed.length})
          </button>
        ))}
      </div>

      {/* Deliveries List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {currentDeliveries.map((delivery) => (
          <div
            key={delivery.id}
            style={{
              background: COLORS.card,
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${COLORS.accent}30`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              {/* Icon */}
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: `${getStatusColor(delivery.status)}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Truck style={{ width: '28px', height: '28px', color: getStatusColor(delivery.status) }} />
              </div>

              {/* Main Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>{delivery.item}</h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: `${getStatusColor(delivery.status)}20`,
                    color: getStatusColor(delivery.status),
                  }}>
                    {delivery.status}
                  </span>
                </div>

                <p style={{ color: COLORS.textMuted, fontSize: '14px', marginBottom: '16px' }}>
                  {delivery.project} | Order: {delivery.orderId}
                </p>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Calendar style={{ width: '14px', height: '14px', color: COLORS.accent }} />
                      <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>Date</span>
                    </div>
                    <p style={{ color: 'white', fontSize: '14px' }}>{delivery.scheduledDate}</p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Clock style={{ width: '14px', height: '14px', color: COLORS.accent }} />
                      <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>Time Slot</span>
                    </div>
                    <p style={{ color: 'white', fontSize: '14px' }}>{delivery.timeSlot}</p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Package style={{ width: '14px', height: '14px', color: COLORS.accent }} />
                      <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>Items</span>
                    </div>
                    <p style={{ color: 'white', fontSize: '14px' }}>{delivery.items} pcs | {delivery.weight}</p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <MapPin style={{ width: '14px', height: '14px', color: COLORS.accent }} />
                      <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>Location</span>
                    </div>
                    <p style={{ color: 'white', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {delivery.location}
                    </p>
                  </div>
                </div>

                {/* Driver Info (for on the way) */}
                {delivery.status === 'On the way' && (
                  <div style={{
                    marginTop: '16px',
                    padding: '14px 16px',
                    background: `${COLORS.accent}10`,
                    borderRadius: '10px',
                    border: `1px solid ${COLORS.accent}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '4px' }}>Driver</p>
                      <p style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{delivery.driver}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: '12px' }}>Vehicle: {delivery.vehicle}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '4px' }}>ETA</p>
                      <p style={{ color: '#10b981', fontSize: '18px', fontWeight: '600' }}>{delivery.estimatedArrival}</p>
                    </div>
                    <a
                      href={`tel:${delivery.driverPhone}`}
                      style={{
                        padding: '10px 16px',
                        background: COLORS.accent,
                        borderRadius: '10px',
                        color: COLORS.dark,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      <Phone style={{ width: '16px', height: '16px' }} />
                      Call Driver
                    </a>
                  </div>
                )}

                {/* Delivered Info */}
                {delivery.status === 'Delivered' && (
                  <div style={{
                    marginTop: '16px',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}>
                    <CheckCircle2 style={{ width: '20px', height: '20px', color: '#10b981' }} />
                    <div>
                      <p style={{ color: 'white', fontSize: '14px' }}>
                        Delivered at {delivery.deliveredAt} | Received by: {delivery.receivedBy}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {currentDeliveries.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: COLORS.card,
          borderRadius: '16px',
        }}>
          <Truck style={{ width: '48px', height: '48px', color: COLORS.textMuted, margin: '0 auto 16px' }} />
          <p style={{ color: 'white', fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No deliveries found</p>
          <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
            {activeTab === 'upcoming' ? 'No upcoming deliveries scheduled.' : 'No completed deliveries yet.'}
          </p>
        </div>
      )}

      {/* Responsive Styles */}
      <style>{`
        .delivery-stats {
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 1024px) {
          .delivery-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .delivery-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Deliveries
