import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Truck,
  FileText,
  Calendar,
  Gift,
  Palette,
  HeadphonesIcon,
  FileBox,
  Bell,
  Search,
  User,
  Menu,
  X,
  ChevronRight,
  Settings,
  LogOut,
  Home,
  Sparkles,
} from 'lucide-react'
import { useUser } from '../../context/UserContext'

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

// Bottom Navigation Items (5 main items as per Material Design guidelines)
const bottomNavItems = [
  { id: 'dashboard', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, path: '/dashboard/projects' },
  { id: 'orders', label: 'Orders', icon: Package, path: '/dashboard/orders' },
  { id: 'rewards', label: 'Rewards', icon: Gift, path: '/dashboard/rewards' },
  { id: 'menu', label: 'More', icon: Menu, path: null }, // Opens drawer
]

// Full Navigation for Drawer
const drawerNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'projects', label: 'My Projects', icon: FolderKanban, path: '/dashboard/projects' },
  { id: 'orders', label: 'Order Tracking', icon: Package, path: '/dashboard/orders' },
  { id: 'deliveries', label: 'Deliveries', icon: Truck, path: '/dashboard/deliveries' },
  { id: 'quotes', label: 'Quotes & Estimates', icon: FileText, path: '/dashboard/quotes' },
  { id: 'consultations', label: 'Consultations', icon: Calendar, path: '/dashboard/consultations' },
  { id: 'rewards', label: 'Rewards', icon: Gift, path: '/dashboard/rewards' },
  { id: 'designs', label: 'Saved Designs', icon: Palette, path: '/dashboard/designs' },
  { id: 'support', label: 'Support', icon: HeadphonesIcon, path: '/dashboard/support' },
  { id: 'documents', label: 'Documents', icon: FileBox, path: '/dashboard/documents' },
]

const MobileLayout = () => {
  const { user, logout } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [drawerOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleBottomNavClick = (item) => {
    if (item.path) {
      navigate(item.path)
    } else if (item.id === 'menu') {
      setDrawerOpen(true)
    }
  }

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    return location.pathname.startsWith(path)
  }

  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Dashboard'
    if (path.includes('projects')) return 'My Projects'
    if (path.includes('orders')) return 'Order Tracking'
    if (path.includes('deliveries')) return 'Deliveries'
    if (path.includes('quotes')) return 'Quotes'
    if (path.includes('consultations')) return 'Consultations'
    if (path.includes('rewards')) return 'Rewards'
    if (path.includes('designs')) return 'Saved Designs'
    if (path.includes('support')) return 'Support'
    if (path.includes('documents')) return 'Documents'
    return 'HOH108'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.dark,
      paddingBottom: '80px', // Space for bottom nav
    }}>
      {/* Status Bar Spacer (for notch/dynamic island) */}
      <div style={{
        height: 'env(safe-area-inset-top, 0px)',
        background: COLORS.darker,
      }} />

      {/* App Bar / Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: COLORS.darker,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: '0 16px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Left - Logo/Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles style={{ width: '20px', height: '20px', color: COLORS.dark }} />
          </div>
          <span style={{
            color: COLORS.textPrimary,
            fontSize: '18px',
            fontWeight: '600',
          }}>
            {getPageTitle()}
          </span>
        </div>

        {/* Right - Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Search Button */}
          <button
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'transparent',
              border: 'none',
              color: COLORS.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Search style={{ width: '22px', height: '22px' }} />
          </button>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'transparent',
              border: 'none',
              color: COLORS.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Bell style={{ width: '22px', height: '22px' }} />
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '8px',
              height: '8px',
              background: COLORS.error,
              borderRadius: '50%',
              border: `2px solid ${COLORS.darker}`,
            }} />
          </button>

          {/* Profile Avatar */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{ color: COLORS.textPrimary, fontWeight: '600', fontSize: '14px' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        minHeight: 'calc(100vh - 56px - 80px)',
        padding: '16px',
        paddingBottom: '24px',
      }}>
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: COLORS.darker,
        borderTop: `1px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        paddingTop: '8px',
        zIndex: 100,
      }}>
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const active = item.path ? isActive(item.path) : false

          return (
            <button
              key={item.id}
              onClick={() => handleBottomNavClick(item)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                border: 'none',
                padding: '8px 0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: '48px',
                height: '32px',
                borderRadius: '16px',
                background: active ? `${COLORS.accent}25` : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}>
                <Icon style={{
                  width: '24px',
                  height: '24px',
                  color: active ? COLORS.accent : COLORS.textMuted,
                  transition: 'color 0.2s ease',
                }} />
              </div>
              <span style={{
                fontSize: '12px',
                fontWeight: active ? '600' : '400',
                color: active ? COLORS.accent : COLORS.textMuted,
                transition: 'all 0.2s ease',
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 200,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Navigation Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '85%',
        maxWidth: '320px',
        background: COLORS.card,
        zIndex: 300,
        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        {/* Drawer Header */}
        <div style={{
          padding: '20px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: '18px' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p style={{ color: COLORS.textPrimary, fontSize: '16px', fontWeight: '600', margin: 0 }}>
                {user?.name || 'User'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <Gift style={{ width: '12px', height: '12px', color: COLORS.accent }} />
                <span style={{ color: COLORS.accent, fontSize: '13px', fontWeight: '500' }}>
                  {user?.karmaPoints || 0} Karma
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              color: COLORS.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Drawer Navigation */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
        }}>
          {drawerNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <NavLink
                key={item.id}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: active ? `${COLORS.accent}15` : 'transparent',
                  textDecoration: 'none',
                  marginBottom: '4px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon style={{
                  width: '22px',
                  height: '22px',
                  color: active ? COLORS.accent : COLORS.textSecondary,
                }} />
                <span style={{
                  fontSize: '15px',
                  fontWeight: active ? '600' : '400',
                  color: active ? COLORS.accent : COLORS.textPrimary,
                }}>
                  {item.label}
                </span>
                {active && (
                  <ChevronRight style={{
                    width: '18px',
                    height: '18px',
                    color: COLORS.accent,
                    marginLeft: 'auto',
                  }} />
                )}
              </NavLink>
            )
          })}
        </div>

        {/* Drawer Footer */}
        <div style={{
          padding: '16px',
          borderTop: `1px solid ${COLORS.border}`,
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}>
          <button
            onClick={() => navigate('/dashboard/settings')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: 'none',
              marginBottom: '8px',
              cursor: 'pointer',
            }}
          >
            <Settings style={{ width: '22px', height: '22px', color: COLORS.textSecondary }} />
            <span style={{ fontSize: '15px', color: COLORS.textPrimary }}>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <LogOut style={{ width: '22px', height: '22px', color: COLORS.error }} />
            <span style={{ fontSize: '15px', color: COLORS.error }}>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileLayout
