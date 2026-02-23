import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
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
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { useUser } from '../../context/UserContext'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textMuted: 'rgba(255,255,255,0.6)',
}

const navigation = [
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

const UserLayout = () => {
  const { user, logout } = useUser()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const sidebarStyle = {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: '280px',
    background: `linear-gradient(180deg, ${COLORS.dark} 0%, ${COLORS.card} 100%)`,
    borderRight: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 40,
    transition: 'transform 0.3s ease',
  }

  const logoContainerStyle = {
    padding: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  }

  const navStyle = {
    flex: 1,
    padding: '16px 12px',
    overflowY: 'auto',
  }

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    color: isActive ? COLORS.accent : 'rgba(255,255,255,0.7)',
    background: isActive ? `${COLORS.accent}15` : 'transparent',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive ? '500' : '400',
    marginBottom: '4px',
    transition: 'all 0.2s ease',
  })

  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: '280px',
    right: 0,
    height: '72px',
    background: 'rgba(17,17,17,0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    zIndex: 30,
  }

  const mainStyle = {
    marginLeft: '280px',
    marginTop: '72px',
    minHeight: 'calc(100vh - 72px)',
    background: COLORS.dark,
    padding: '32px',
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.dark }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 35,
          }}
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          ...sidebarStyle,
          transform: sidebarOpen ? 'translateX(0)' : undefined,
        }}
        className="sidebar-desktop"
      >
        {/* Logo */}
        <div style={logoContainerStyle}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: COLORS.accent,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles style={{ width: '24px', height: '24px', color: COLORS.dark }} />
            </div>
            <div>
              <h1 style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 }}>HOH108</h1>
              <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>Client Portal</p>
            </div>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav style={navStyle}>
          {navigation.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/dashboard'}
              style={({ isActive }) => navItemStyle(isActive)}
              onClick={() => setSidebarOpen(false)}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains('active')) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <item.icon style={{ width: '20px', height: '20px' }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Card */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </p>
              <p style={{ color: COLORS.accent, fontSize: '12px', margin: 0 }}>
                {user?.karmaPoints || 0} Karma Points
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444'
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                e.currentTarget.style.background = 'none'
              }}
              title="Logout"
            >
              <LogOut style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>
      </aside>

      {/* Header */}
      <header style={headerStyle} className="header-desktop">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            padding: '8px',
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'none',
          }}
          className="mobile-menu-btn"
        >
          <Menu style={{ width: '24px', height: '24px' }} />
        </button>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search projects, orders, documents..."
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.accent
              e.target.style.background = 'rgba(255,255,255,0.08)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255,255,255,0.1)'
              e.target.style.background = 'rgba(255,255,255,0.05)'
            }}
          />
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Notifications */}
          <button
            style={{
              position: 'relative',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '10px',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
            }}
          >
            <Bell style={{ width: '20px', height: '20px' }} />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              background: '#ef4444',
              borderRadius: '50%',
            }} />
          </button>

          {/* Profile Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px 6px 6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.accent
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span style={{ fontSize: '14px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <ChevronDown style={{ width: '16px', height: '16px', opacity: 0.6 }} />
            </button>

            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                width: '200px',
                background: COLORS.card,
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                zIndex: 50,
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: 0 }}>{user?.name}</p>
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>{user?.email}</p>
                </div>
                <NavLink
                  to="/dashboard/settings"
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    color: 'rgba(255,255,255,0.8)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = COLORS.accent
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                  }}
                >
                  <Settings style={{ width: '16px', height: '16px' }} />
                  Settings
                </NavLink>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <LogOut style={{ width: '16px', height: '16px' }} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={mainStyle} className="main-content-desktop">
        <Outlet />
      </main>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 1024px) {
          .sidebar-desktop {
            transform: translateX(-100%);
          }
          .sidebar-desktop.open {
            transform: translateX(0);
          }
          .header-desktop {
            left: 0 !important;
          }
          .main-content-desktop {
            margin-left: 0 !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}

export default UserLayout
