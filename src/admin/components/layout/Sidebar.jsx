import { useState, useEffect, useMemo } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogOut, ChevronDown } from 'lucide-react'
import { navigation, getFilteredNavigation } from '../../config/navigation'
import { useAuth } from '../../context/AuthContext'

const Sidebar = ({ collapsed = false, isMobile = false, onClose }) => {
  const location = useLocation()
  const { logout, user } = useAuth()
  const [openMenus, setOpenMenus] = useState([])

  // Get filtered navigation based on user role
  const filteredNavigation = useMemo(() => {
    return getFilteredNavigation(user?.role)
  }, [user?.role])

  const isActive = (path) => location.pathname === path
  const isGroupActive = (item) => item.children?.some(child => location.pathname.startsWith(child.path))

  useEffect(() => {
    filteredNavigation.forEach(item => {
      if (item.children && item.children.some(child => location.pathname.startsWith(child.path))) {
        if (!openMenus.includes(item.id)) {
          setOpenMenus(prev => [...prev, item.id])
        }
      }
    })
  }, [location.pathname, filteredNavigation])

  const toggleMenu = (id) => {
    setOpenMenus(prev =>
      prev.includes(id)
        ? prev.filter(menuId => menuId !== id)
        : [...prev, id]
    )
  }

  const sidebarStyle = {
    position: 'fixed',
    left: '16px',
    top: '16px',
    bottom: '16px',
    zIndex: 40,
    display: isMobile ? 'flex' : undefined,
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    width: collapsed ? '80px' : '264px',
  }

  const containerStyle = {
    height: '100%',
    background: 'linear-gradient(180deg, #1A1A1A 0%, #111111 50%, #0A0A0A 100%)',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const logoStyle = {
    padding: collapsed ? '24px 16px 20px' : '24px 20px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? '0' : '14px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    flexShrink: 0,
  }

  const logoIconStyle = {
    width: '48px',
    height: '48px',
    background: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  const navStyle = {
    flex: 1,
    padding: collapsed ? '8px' : '8px 12px',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  }

  const menuItemStyle = (isActive) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? '0' : '14px',
    padding: collapsed ? '14px 0' : '14px 16px',
    borderRadius: '14px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    border: 'none',
    textDecoration: 'none',
    justifyContent: 'center',
    background: isActive ? 'white' : 'transparent',
    color: isActive ? '#C59C82' : 'rgba(255,255,255,0.9)',
    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
    marginBottom: '4px',
  })

  const iconStyle = {
    width: '22px',
    height: '22px',
    flexShrink: 0,
  }

  const subMenuItemStyle = (isActive) => ({
    display: 'block',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    marginBottom: '4px',
    background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
    color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
    fontWeight: isActive ? '500' : '400',
  })

  const userSectionStyle = {
    padding: collapsed ? '16px 8px' : '16px',
    flexShrink: 0,
  }

  const userCardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: collapsed ? '10px' : '14px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    borderRadius: '16px',
    justifyContent: 'center',
  }

  const avatarStyle = {
    width: collapsed ? '40px' : '44px',
    height: collapsed ? '40px' : '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(197, 156, 130, 0.4)',
  }

  return (
    <aside style={sidebarStyle} className={isMobile ? '' : 'hidden lg:flex flex-col'}>
      <div style={containerStyle}>
        {/* Logo Area */}
        <div style={logoStyle}>
          <img
            src="/Logo.png"
            alt="HOH108 Logo"
            style={{
              width: collapsed ? '48px' : '56px',
              height: collapsed ? '48px' : '56px',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)',
            }}
          />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <h1 style={{ color: 'white', fontWeight: '700', fontSize: '20px', lineHeight: 1.2, margin: 0 }}>
                HOH108
              </h1>
              <p style={{ color: 'rgba(197, 156, 130, 0.7)', fontSize: '12px', marginTop: '2px', margin: 0 }}>
                ERP System
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={navStyle}>
          <style>{`
            nav::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div>
            {filteredNavigation.map((item) => {
              const hasChildren = item.children && item.children.length > 0
              const groupActive = isGroupActive(item)
              const itemActive = !hasChildren && isActive(item.path)
              const isOpen = openMenus.includes(item.id)
              const Icon = item.icon

              return (
                <div key={item.id}>
                  {hasChildren ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.id)}
                        style={menuItemStyle(groupActive)}
                        onMouseEnter={(e) => !groupActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                        onMouseLeave={(e) => !groupActive && (e.currentTarget.style.background = 'transparent')}
                      >
                        <Icon style={iconStyle} />
                        {!collapsed && (
                          <>
                            <span style={{ flex: 1, textAlign: 'left', fontSize: '15px', fontWeight: '500' }}>
                              {item.label}
                            </span>
                            <ChevronDown style={{
                              width: '18px',
                              height: '18px',
                              transition: 'transform 0.2s',
                              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                              opacity: 0.6,
                              flexShrink: 0,
                            }} />
                          </>
                        )}
                      </button>

                      {/* Submenu */}
                      {!collapsed && isOpen && (
                        <div style={{
                          marginTop: '4px',
                          marginLeft: '20px',
                          paddingLeft: '20px',
                          borderLeft: '2px solid rgba(255,255,255,0.2)',
                          marginBottom: '8px',
                        }}>
                          {item.children.map((child) => {
                            const childActive = isActive(child.path)
                            return (
                              <NavLink
                                key={child.id}
                                to={child.path}
                                style={subMenuItemStyle(childActive)}
                                onClick={isMobile ? onClose : undefined}
                                onMouseEnter={(e) => !childActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                                onMouseLeave={(e) => !childActive && (e.currentTarget.style.background = childActive ? 'rgba(255,255,255,0.2)' : 'transparent')}
                              >
                                {child.label}
                              </NavLink>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      style={menuItemStyle(itemActive)}
                      onClick={isMobile ? onClose : undefined}
                      onMouseEnter={(e) => !itemActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                      onMouseLeave={(e) => !itemActive && (e.currentTarget.style.background = itemActive ? 'white' : 'transparent')}
                    >
                      <Icon style={iconStyle} />
                      {!collapsed && (
                        <span style={{ flex: 1, textAlign: 'left', fontSize: '15px', fontWeight: '500' }}>{item.label}</span>
                      )}
                    </NavLink>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* User Section */}
        <div style={userSectionStyle}>
          <div style={userCardStyle}>
            <div style={avatarStyle}>
              <span style={{ color: 'white', fontWeight: '700', fontSize: collapsed ? '14px' : '16px' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </span>
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || 'Super Admin'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(197, 156, 130, 0.7)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.role || 'Administrator'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  style={{
                    padding: '10px',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                    e.currentTarget.style.background = 'none'
                  }}
                  title="Sign Out"
                >
                  <LogOut style={{ width: '20px', height: '20px' }} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
