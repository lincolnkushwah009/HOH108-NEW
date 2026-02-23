import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Menu, ChevronDown, PanelLeftClose, PanelLeft, Building2, Globe, User, Briefcase, Users, FolderKanban, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCompany, ALL_COMPANIES } from '../../context/CompanyContext'
import Dropdown from '../ui/Dropdown'
import { apiRequest } from '../../utils/api'
import NotificationBell from './NotificationBell'

const Header = ({ onMenuClick, onCollapseToggle, collapsed }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { companies, activeCompany, switchCompany, isSuperAdmin, isViewingAllCompanies } = useCompany()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (searchQuery.length < 2) {
      setSearchResults(null)
      setShowResults(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await apiRequest(`/search?q=${encodeURIComponent(searchQuery)}`)
        if (data.success) {
          setSearchResults(data.data)
          setShowResults(true)
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchQuery])

  const handleResultClick = (path) => {
    navigate(path)
    setSearchQuery('')
    setShowResults(false)
    setSearchResults(null)
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'lead': return <User style={{ width: 14, height: 14 }} />
      case 'customer': return <Users style={{ width: 14, height: 14 }} />
      case 'employee': return <Briefcase style={{ width: 14, height: 14 }} />
      case 'project': return <FolderKanban style={{ width: 14, height: 14 }} />
      default: return null
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'lead': return '#3B82F6'
      case 'customer': return '#10B981'
      case 'employee': return '#8B5CF6'
      case 'project': return '#F59E0B'
      default: return '#64748b'
    }
  }

  const allResults = searchResults ? [
    ...searchResults.leads,
    ...searchResults.customers,
    ...searchResults.employees,
    ...searchResults.projects
  ] : []

  const headerStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    padding: '20px 24px',
  }

  const headerContainerStyle = {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #f1f5f9',
  }

  const headerInnerStyle = {
    height: '64px',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
  }

  const iconButtonStyle = {
    padding: '12px',
    color: '#94a3b8',
    background: 'none',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const searchContainerStyle = {
    flex: 1,
    maxWidth: '480px',
    display: 'flex',
    alignItems: 'center',
    background: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '14px',
    padding: '0 16px',
    height: '48px',
    transition: 'all 0.2s',
  }

  const searchInputStyle = {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: '#334155',
    marginLeft: '12px',
  }

  const avatarStyle = {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    overflow: 'hidden',
    border: '2px solid #f1f5f9',
    cursor: 'pointer',
  }

  const avatarInnerStyle = {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return (
    <header style={headerStyle}>
      <div style={headerContainerStyle}>
        <div style={headerInnerStyle}>
          {/* Left Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile Menu Toggle */}
            <button
              onClick={onMenuClick}
              style={iconButtonStyle}
              className="lg:hidden"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#C59C82'
                e.currentTarget.style.background = '#FDF8F4'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8'
                e.currentTarget.style.background = 'none'
              }}
            >
              <Menu style={{ width: '22px', height: '22px' }} />
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={onCollapseToggle}
              style={iconButtonStyle}
              className="hidden lg:flex"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#C59C82'
                e.currentTarget.style.background = '#FDF8F4'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8'
                e.currentTarget.style.background = 'none'
              }}
            >
              {collapsed ? (
                <PanelLeft style={{ width: '22px', height: '22px' }} />
              ) : (
                <PanelLeftClose style={{ width: '22px', height: '22px' }} />
              )}
            </button>

            {/* Page Title */}
            <div className="hidden sm:block" style={{ marginLeft: '8px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Primary
              </p>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0, marginTop: '-2px' }}>
                Dashboard
              </h1>
            </div>
          </div>

          {/* Center - Search Bar */}
          <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }} ref={searchRef}>
            <div style={searchContainerStyle}>
              <Search style={{ width: '20px', height: '20px', color: '#94a3b8', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search leads, customers, employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults && setShowResults(true)}
                style={searchInputStyle}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setShowResults(false); setSearchResults(null); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <X style={{ width: 16, height: 16, color: '#94a3b8' }} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 8,
                background: 'white',
                borderRadius: 12,
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                maxHeight: 400,
                overflowY: 'auto',
                zIndex: 100
              }}>
                {searching ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                    Searching...
                  </div>
                ) : allResults.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  <div style={{ padding: 8 }}>
                    {allResults.map((item, idx) => (
                      <div
                        key={`${item.type}-${item._id}`}
                        onClick={() => handleResultClick(item.path)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${getTypeColor(item.type)}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: getTypeColor(item.type)
                        }}>
                          {getTypeIcon(item.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.id} {item.subtitle && `• ${item.subtitle}`}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: getTypeColor(item.type),
                          background: `${getTypeColor(item.type)}15`,
                          padding: '2px 8px',
                          borderRadius: 4,
                          textTransform: 'capitalize'
                        }}>
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Notification Bell */}
            <NotificationBell />

            {/* Company Switcher */}
            {(companies.length > 0 || isSuperAdmin) && (
              <Dropdown
                align="right"
                trigger={
                  <button
                    className="hidden md:flex"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 14px',
                      background: isViewingAllCompanies ? 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)' : 'none',
                      border: isViewingAllCompanies ? 'none' : '2px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isViewingAllCompanies) e.currentTarget.style.borderColor = '#DDC5B0'
                    }}
                    onMouseLeave={(e) => {
                      if (!isViewingAllCompanies) e.currentTarget.style.borderColor = '#e2e8f0'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      background: isViewingAllCompanies ? 'rgba(255,255,255,0.2)' : '#1e293b',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isViewingAllCompanies ? (
                        <Globe style={{ width: '14px', height: '14px', color: 'white' }} />
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'white' }}>
                          {activeCompany?.name?.charAt(0)?.toUpperCase() || 'H'}
                        </span>
                      )}
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isViewingAllCompanies ? 'white' : '#334155',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {activeCompany?.name || 'Company'}
                    </span>
                    <ChevronDown style={{ width: '16px', height: '16px', color: isViewingAllCompanies ? 'rgba(255,255,255,0.8)' : '#94a3b8' }} />
                  </button>
                }
              >
                <div style={{ padding: '4px 0' }}>
                  {/* All Companies option for super admin */}
                  {isSuperAdmin && (
                    <>
                      <Dropdown.Item
                        onClick={() => switchCompany('all')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: isViewingAllCompanies ? 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)' : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Globe style={{ width: '12px', height: '12px', color: isViewingAllCompanies ? 'white' : '#64748b' }} />
                          </div>
                          <div>
                            <span style={{ fontWeight: isViewingAllCompanies ? '600' : '500', color: isViewingAllCompanies ? '#C59C82' : '#334155' }}>
                              All Companies
                            </span>
                            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>View data across all companies</p>
                          </div>
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Divider />
                    </>
                  )}
                  {companies.map((company) => (
                    <Dropdown.Item
                      key={company._id}
                      onClick={() => switchCompany(company._id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: activeCompany?._id === company._id && !isViewingAllCompanies ? '#1e293b' : '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: activeCompany?._id === company._id && !isViewingAllCompanies ? 'white' : '#64748b'
                          }}>
                            {company.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span style={{
                            fontWeight: activeCompany?._id === company._id && !isViewingAllCompanies ? '600' : '500',
                            color: activeCompany?._id === company._id && !isViewingAllCompanies ? '#C59C82' : '#334155'
                          }}>
                            {company.name}
                          </span>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{company.code}</p>
                        </div>
                      </div>
                    </Dropdown.Item>
                  ))}
                </div>
              </Dropdown>
            )}

            {/* User Avatar */}
            <Dropdown
              align="right"
              trigger={
                <button style={{ ...avatarStyle, background: 'none', border: '2px solid #f1f5f9', padding: 0 }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={avatarInnerStyle}>
                      <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                        {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    </div>
                  )}
                </button>
              }
            >
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                background: 'linear-gradient(135deg, #FDF8F4 0%, #faf5ff 100%)',
              }}>
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                  {user?.name || 'Super Admin'}
                </p>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, marginTop: '2px' }}>
                  {user?.email || 'admin@example.com'}
                </p>
              </div>
              <Dropdown.Item onClick={() => window.location.href = '/admin/profile'}>
                Profile Settings
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={logout} danger>
                Sign Out
              </Dropdown.Item>
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
