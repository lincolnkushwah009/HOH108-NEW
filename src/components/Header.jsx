import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User, LogOut } from 'lucide-react'
import { COLORS } from '../constants/colors'

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Team', path: '/team' },
    { name: 'Construction', path: '/construction' },
    { name: 'Interior', path: '/interior' },
    { name: '3D Visualizer', path: '/floor-map-3d' },
  ]

  useEffect(() => {
    // Check for logged in user
    const storedUser = localStorage.getItem('hoh108_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('hoh108_token')
    localStorage.removeItem('hoh108_user')
    setUser(null)
    setShowDropdown(false)
    navigate('/')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: 'rgba(17,17,17,0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src="/Logo.png"
              alt="House of Hancet 108"
              style={{ height: '56px', width: 'auto' }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="desktop-nav">
            {navLinks.map(link => (
              link.external ? (
                <a
                  key={link.name}
                  href={link.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'white',
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  style={{
                    color: isActive(link.path) ? COLORS.accent : 'white',
                    fontSize: '14px',
                    textDecoration: 'none'
                  }}
                >
                  {link.name}
                </Link>
              )
            ))}
          </nav>

          {/* Auth & CTA */}
          <div className="desktop-cta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              /* Logged In User Menu */
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '50px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'
                    e.currentTarget.style.borderColor = COLORS.accent
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  <User size={18} />
                  <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name?.split(' ')[0] || 'User'}
                  </span>
                </button>
                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: '180px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <p style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>{user.name}</p>
                      <p style={{ color: COLORS.textMuted, fontSize: '12px' }}>{user.email}</p>
                      {user.karmaPoints !== undefined && (
                        <p style={{ color: COLORS.accent, fontSize: '12px', marginTop: '4px' }}>
                          {user.karmaPoints} Karma Points
                        </p>
                      )}
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowDropdown(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        color: COLORS.textLight,
                        fontSize: '14px',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.color = COLORS.accent
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = COLORS.textLight
                      }}
                    >
                      <User size={16} />
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 16px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        fontSize: '14px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Login/Signup Buttons */
              <>
                <Link
                  to="/login"
                  style={{
                    color: 'white',
                    fontSize: '14px',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: '50px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = COLORS.accent
                    e.currentTarget.style.color = COLORS.accent
                    e.currentTarget.style.backgroundColor = 'rgba(197,156,130,0.1)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  style={{
                    backgroundColor: COLORS.accent,
                    color: COLORS.dark,
                    padding: '10px 20px',
                    borderRadius: '50px',
                    fontSize: '14px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    transform: 'scale(1)',
                    display: 'inline-block'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.accentLight
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(197,156,130,0.4)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.accent
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
