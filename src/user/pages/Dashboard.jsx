import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FolderKanban,
  Package,
  Truck,
  FileText,
  Calendar,
  Gift,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Star,
  Bell,
} from 'lucide-react'
import { useUser } from '../context/UserContext'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  accentLight: '#D4B59E',
  textMuted: 'rgba(255,255,255,0.6)',
}

const Dashboard = () => {
  const { user } = useUser()

  // Mock data - will be replaced with API calls
  const stats = [
    { label: 'Active Projects', value: 2, icon: FolderKanban, color: '#6366f1', trend: '+1 this month' },
    { label: 'Pending Orders', value: 5, icon: Package, color: '#f59e0b', trend: '3 arriving soon' },
    { label: 'Deliveries', value: 8, icon: Truck, color: '#10b981', trend: '2 this week' },
    { label: 'Karma Points', value: user?.karmaPoints || 1250, icon: Gift, color: COLORS.accent, trend: '+150 earned' },
  ]

  const activeProjects = [
    {
      id: 1,
      name: '3BHK Interior - Whitefield',
      status: 'In Progress',
      progress: 65,
      phase: 'Execution',
      nextMilestone: 'Kitchen Installation',
      dueDate: '15 Jan 2026',
      image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      name: 'Villa Renovation - HSR Layout',
      status: 'Design Phase',
      progress: 30,
      phase: 'Design Approval',
      nextMilestone: 'Final Design Review',
      dueDate: '20 Jan 2026',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
    },
  ]

  const recentOrders = [
    { id: 'ORD-001', item: 'Italian Marble Flooring', status: 'Shipped', date: '2 Jan 2026', amount: '85,000' },
    { id: 'ORD-002', item: 'Modular Kitchen Set', status: 'Processing', date: '1 Jan 2026', amount: '2,45,000' },
    { id: 'ORD-003', item: 'Living Room Sofa Set', status: 'Delivered', date: '28 Dec 2025', amount: '1,20,000' },
  ]

  const upcomingDeliveries = [
    { id: 1, item: 'Bedroom Wardrobe', date: '5 Jan 2026', time: '10:00 AM - 12:00 PM' },
    { id: 2, item: 'Dining Table Set', date: '7 Jan 2026', time: '2:00 PM - 4:00 PM' },
  ]

  const notifications = [
    { id: 1, title: 'Design approved!', message: 'Your living room design has been approved.', time: '2 hours ago', type: 'success' },
    { id: 2, title: 'Payment reminder', message: 'Invoice #INV-2024-001 is due in 3 days.', time: '5 hours ago', type: 'warning' },
    { id: 3, title: 'New milestone reached', message: 'Kitchen cabinets installation completed.', time: '1 day ago', type: 'info' },
  ]

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'shipped': return '#3b82f6'
      case 'processing': return '#f59e0b'
      case 'delivered': return '#10b981'
      case 'in progress': return '#6366f1'
      case 'design phase': return '#8b5cf6'
      default: return COLORS.accent
    }
  }

  return (
    <div>
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: '15px' }}>
          Here's what's happening with your projects and orders.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '32px',
      }} className="stats-grid">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            style={{
              background: COLORS.card,
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.3)`
              e.currentTarget.style.borderColor = `${stat.color}30`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <stat.icon style={{ width: '24px', height: '24px', color: stat.color }} />
              </div>
              <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981' }} />
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: '700', color: 'white', marginBottom: '4px' }}>
              {stat.value.toLocaleString()}
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', marginBottom: '8px' }}>{stat.label}</p>
            <p style={{ color: stat.color, fontSize: '12px' }}>{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '24px',
      }} className="main-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Projects */}
          <div style={{
            background: COLORS.card,
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>Active Projects</h2>
              <Link
                to="/dashboard/projects"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: COLORS.accent,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                View All <ChevronRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/dashboard/projects/${project.id}`}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = `${COLORS.accent}30`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                  }}
                >
                  <img
                    src={project.image}
                    alt={project.name}
                    style={{
                      width: '100px',
                      height: '80px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{project.name}</h3>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '500',
                        background: `${getStatusColor(project.status)}20`,
                        color: getStatusColor(project.status),
                      }}>
                        {project.status}
                      </span>
                    </div>
                    <p style={{ color: COLORS.textMuted, fontSize: '13px', marginBottom: '12px' }}>
                      Phase: {project.phase} | Next: {project.nextMilestone}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${project.progress}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentLight})`,
                          borderRadius: '3px',
                        }} />
                      </div>
                      <span style={{ color: COLORS.accent, fontSize: '13px', fontWeight: '600' }}>{project.progress}%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div style={{
            background: COLORS.card,
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>Recent Orders</h2>
              <Link
                to="/dashboard/orders"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: COLORS.accent,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                View All <ChevronRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: `${getStatusColor(order.status)}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Package style={{ width: '18px', height: '18px', color: getStatusColor(order.status) }} />
                    </div>
                    <div>
                      <p style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{order.item}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: '12px' }}>{order.id} | {order.date}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Rs. {order.amount}</p>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      background: `${getStatusColor(order.status)}20`,
                      color: getStatusColor(order.status),
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Upcoming Deliveries */}
          <div style={{
            background: COLORS.card,
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>Upcoming Deliveries</h2>
              <Truck style={{ width: '20px', height: '20px', color: COLORS.accent }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  style={{
                    padding: '16px',
                    background: `linear-gradient(135deg, ${COLORS.accent}10 0%, transparent 100%)`,
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.accent}20`,
                  }}
                >
                  <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>{delivery.item}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar style={{ width: '14px', height: '14px', color: COLORS.accent }} />
                      <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>{delivery.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock style={{ width: '14px', height: '14px', color: COLORS.accent }} />
                      <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>{delivery.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div style={{
            background: COLORS.card,
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>Notifications</h2>
              <Bell style={{ width: '20px', height: '20px', color: COLORS.accent }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: '14px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    borderLeft: `3px solid ${
                      notif.type === 'success' ? '#10b981' :
                      notif.type === 'warning' ? '#f59e0b' : '#3b82f6'
                    }`,
                  }}
                >
                  <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{notif.title}</p>
                  <p style={{ color: COLORS.textMuted, fontSize: '13px', marginBottom: '6px' }}>{notif.message}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{notif.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.accent}20 0%, ${COLORS.card} 100%)`,
            borderRadius: '20px',
            padding: '24px',
            border: `1px solid ${COLORS.accent}30`,
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '16px' }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Book Consultation', icon: Calendar, path: '/dashboard/consultations' },
                { label: 'View Documents', icon: FileText, path: '/dashboard/documents' },
                { label: 'Raise Support Ticket', icon: AlertCircle, path: '/dashboard/support' },
                { label: 'Spin & Win', icon: Gift, path: '/dashboard/rewards' },
              ].map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '10px',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <action.icon style={{ width: '18px', height: '18px', color: COLORS.accent }} />
                  {action.label}
                  <ArrowRight style={{ width: '16px', height: '16px', marginLeft: 'auto', opacity: 0.5 }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        .stats-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        .main-grid {
          grid-template-columns: 1fr 380px;
        }
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .main-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Dashboard
