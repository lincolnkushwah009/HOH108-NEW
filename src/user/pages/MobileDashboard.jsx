import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  Package,
  Truck,
  Gift,
  ChevronRight,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Bell,
  Sparkles,
  TrendingUp,
  FileText,
  Palette,
  Star,
  Home,
  Hammer,
  PaintBucket,
  Sofa,
  Wrench,
  Building2,
} from 'lucide-react'
import { useUser } from '../context/UserContext'

const COLORS = {
  dark: '#111111',
  darker: '#0A0A0A',
  card: '#1A1A1A',
  cardElevated: '#222222',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  accentLight: '#D4B59A',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.08)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}

// Mock data
const activeProjects = [
  {
    id: 1,
    name: 'Living Room Renovation',
    progress: 65,
    status: 'in_progress',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400',
    nextMilestone: 'Furniture Installation',
    daysLeft: 12,
  },
  {
    id: 2,
    name: 'Master Bedroom',
    progress: 30,
    status: 'design',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400',
    nextMilestone: 'Design Approval',
    daysLeft: 5,
  },
]

const recentOrders = [
  {
    id: 'ORD-001',
    item: 'Custom Sofa Set',
    status: 'shipped',
    date: 'Arriving Jan 20',
  },
  {
    id: 'ORD-002',
    item: 'Dining Table',
    status: 'processing',
    date: 'Est. Jan 25',
  },
]

const upcomingDeliveries = [
  {
    id: 1,
    item: 'Sofa Set (3+2)',
    time: 'Today, 2:00 PM',
    status: 'on_the_way',
  },
  {
    id: 2,
    item: 'Center Table',
    time: 'Tomorrow, 10:00 AM',
    status: 'scheduled',
  },
]

const quickActions = [
  { id: 'projects', label: 'Projects', icon: FolderKanban, color: '#8b5cf6', path: '/dashboard/projects' },
  { id: 'orders', label: 'Orders', icon: Package, color: '#3b82f6', path: '/dashboard/orders' },
  { id: 'deliveries', label: 'Deliveries', icon: Truck, color: '#10b981', path: '/dashboard/deliveries' },
  { id: 'quotes', label: 'Quotes', icon: FileText, color: '#f59e0b', path: '/dashboard/quotes' },
  { id: 'consultations', label: 'Book', icon: Calendar, color: '#ec4899', path: '/dashboard/consultations' },
  { id: 'designs', label: 'Designs', icon: Palette, color: '#06b6d4', path: '/dashboard/designs' },
]

const onDemandServices = [
  {
    id: 'interior',
    name: 'Interior Design',
    description: 'Transform your space with expert design',
    icon: Sofa,
    color: '#C59C82',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400',
  },
  {
    id: 'renovation',
    name: 'Renovation',
    description: 'Complete home renovation services',
    icon: Hammer,
    color: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Build your dream from ground up',
    icon: Building2,
    color: '#3b82f6',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400',
  },
  {
    id: 'painting',
    name: 'Painting',
    description: 'Professional painting services',
    icon: PaintBucket,
    color: '#10b981',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400',
  },
  {
    id: 'repair',
    name: 'Repairs',
    description: 'Quick fixes and maintenance',
    icon: Wrench,
    color: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
  },
]

const MobileDashboard = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const scrollRef = useRef(null)

  const getStatusColor = (status) => {
    switch (status) {
      case 'shipped':
      case 'on_the_way':
        return COLORS.info
      case 'processing':
      case 'scheduled':
        return COLORS.warning
      case 'delivered':
        return COLORS.success
      default:
        return COLORS.textMuted
    }
  }

  const cardStyle = {
    background: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  }

  return (
    <div style={{ paddingBottom: '20px' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: COLORS.textSecondary, fontSize: '14px', margin: '0 0 4px 0' }}>
          Welcome back,
        </p>
        <h1 style={{ color: COLORS.textPrimary, fontSize: '24px', fontWeight: '700', margin: 0 }}>
          {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
      </div>

      {/* Karma Points Card */}
      <div style={{
        ...cardStyle,
        background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
        padding: '20px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles style={{ width: '18px', height: '18px', color: COLORS.dark }} />
            <span style={{ color: COLORS.dark, fontSize: '13px', fontWeight: '500', opacity: 0.8 }}>
              Karma Points
            </span>
          </div>
          <p style={{ color: COLORS.dark, fontSize: '32px', fontWeight: '800', margin: 0 }}>
            {(user?.karmaPoints || 1250).toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/rewards')}
          style={{
            padding: '10px 16px',
            background: 'rgba(0,0,0,0.15)',
            border: 'none',
            borderRadius: '10px',
            color: COLORS.dark,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Redeem
          <ChevronRight style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              style={{
                ...cardStyle,
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                border: 'none',
                background: COLORS.card,
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: `${action.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon style={{ width: '22px', height: '22px', color: action.color }} />
              </div>
              <span style={{ color: COLORS.textPrimary, fontSize: '12px', fontWeight: '500' }}>
                {action.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* On Demand Services Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}>
          <h2 style={{ color: COLORS.textPrimary, fontSize: '18px', fontWeight: '600', margin: 0 }}>
            On Demand Services
          </h2>
          <button
            onClick={() => navigate('/dashboard/services')}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.accent,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View All
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Horizontal Scrollable Service Cards */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            margin: '0 -16px',
            padding: '0 16px',
          }}
        >
          {onDemandServices.map((service) => {
            const Icon = service.icon
            return (
              <div
                key={service.id}
                onClick={() => navigate('/dashboard/services')}
                style={{
                  ...cardStyle,
                  minWidth: '160px',
                  scrollSnapAlign: 'start',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  height: '100px',
                  background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%), url(${service.image}) center/cover`,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '12px',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${service.color}30`,
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon style={{ width: '18px', height: '18px', color: service.color }} />
                  </div>
                </div>
                <div style={{ padding: '12px' }}>
                  <h3 style={{
                    color: COLORS.textPrimary,
                    fontSize: '14px',
                    fontWeight: '600',
                    margin: '0 0 4px 0'
                  }}>
                    {service.name}
                  </h3>
                  <p style={{
                    color: COLORS.textMuted,
                    fontSize: '11px',
                    margin: 0,
                    lineHeight: '1.4',
                  }}>
                    {service.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Projects Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}>
          <h2 style={{ color: COLORS.textPrimary, fontSize: '18px', fontWeight: '600', margin: 0 }}>
            Active Projects
          </h2>
          <button
            onClick={() => navigate('/dashboard/projects')}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.accent,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            See All
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Horizontal Scrollable Cards */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            margin: '0 -16px',
            padding: '0 16px',
          }}
        >
          {activeProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate('/dashboard/projects')}
              style={{
                ...cardStyle,
                minWidth: '280px',
                scrollSnapAlign: 'start',
                cursor: 'pointer',
              }}
            >
              <div style={{
                height: '120px',
                background: `url(${project.image}) center/cover`,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Clock style={{ width: '12px', height: '12px', color: COLORS.warning }} />
                  <span style={{ color: COLORS.textPrimary, fontSize: '11px', fontWeight: '500' }}>
                    {project.daysLeft} days left
                  </span>
                </div>
              </div>
              <div style={{ padding: '14px' }}>
                <h3 style={{ color: COLORS.textPrimary, fontSize: '15px', fontWeight: '600', margin: '0 0 10px 0' }}>
                  {project.name}
                </h3>
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>Progress</span>
                    <span style={{ color: COLORS.accent, fontSize: '12px', fontWeight: '600' }}>{project.progress}%</span>
                  </div>
                  <div style={{
                    height: '6px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${project.progress}%`,
                      background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accentLight} 100%)`,
                      borderRadius: '3px',
                    }} />
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                }}>
                  <ArrowRight style={{ width: '14px', height: '14px', color: COLORS.info }} />
                  <span style={{ color: COLORS.textSecondary, fontSize: '12px' }}>
                    Next: {project.nextMilestone}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}>
          <h2 style={{ color: COLORS.textPrimary, fontSize: '18px', fontWeight: '600', margin: 0 }}>
            Recent Orders
          </h2>
          <button
            onClick={() => navigate('/dashboard/orders')}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.accent,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            See All
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <div style={cardStyle}>
          {recentOrders.map((order, index) => (
            <div
              key={order.id}
              onClick={() => navigate('/dashboard/orders')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: index < recentOrders.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: `${getStatusColor(order.status)}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Package style={{ width: '22px', height: '22px', color: getStatusColor(order.status) }} />
                </div>
                <div>
                  <p style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '500', margin: 0 }}>
                    {order.item}
                  </p>
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '2px 0 0 0' }}>
                    {order.id}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: `${getStatusColor(order.status)}15`,
                  color: getStatusColor(order.status),
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  textTransform: 'capitalize',
                  marginBottom: '4px',
                }}>
                  {order.status}
                </span>
                <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: 0 }}>
                  {order.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Deliveries */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}>
          <h2 style={{ color: COLORS.textPrimary, fontSize: '18px', fontWeight: '600', margin: 0 }}>
            Upcoming Deliveries
          </h2>
          <button
            onClick={() => navigate('/dashboard/deliveries')}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.accent,
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            See All
            <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        <div style={cardStyle}>
          {upcomingDeliveries.map((delivery, index) => (
            <div
              key={delivery.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                borderBottom: index < upcomingDeliveries.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: delivery.status === 'on_the_way' ? `${COLORS.success}15` : `${COLORS.warning}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Truck style={{
                    width: '22px',
                    height: '22px',
                    color: delivery.status === 'on_the_way' ? COLORS.success : COLORS.warning,
                  }} />
                </div>
                <div>
                  <p style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '500', margin: 0 }}>
                    {delivery.item}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Clock style={{ width: '12px', height: '12px', color: COLORS.textMuted }} />
                    <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>
                      {delivery.time}
                    </span>
                  </div>
                </div>
              </div>
              {delivery.status === 'on_the_way' && (
                <div style={{
                  padding: '6px 12px',
                  background: `${COLORS.success}15`,
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: COLORS.success,
                    animation: 'pulse 2s infinite',
                  }} />
                  <span style={{ color: COLORS.success, fontSize: '12px', fontWeight: '500' }}>
                    Live
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Need Help Card */}
      <div style={{
        ...cardStyle,
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: `${COLORS.accent}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Star style={{ width: '24px', height: '24px', color: COLORS.accent }} />
          </div>
          <div>
            <p style={{ color: COLORS.textPrimary, fontSize: '15px', fontWeight: '600', margin: 0 }}>
              Need Assistance?
            </p>
            <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '2px 0 0 0' }}>
              Our team is here to help
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/support')}
          style={{
            padding: '10px 18px',
            background: COLORS.accent,
            border: 'none',
            borderRadius: '10px',
            color: COLORS.dark,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Contact
        </button>
      </div>

      {/* Pulse Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default MobileDashboard
