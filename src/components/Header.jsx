import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User, LogOut, Menu, X } from 'lucide-react'
import { COLORS } from '../constants/colors'

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Construction', path: '/construction' },
    { name: 'Interior', path: '/interior' },
    { name: 'Team', path: '/team' },
    { name: '3D Visualizer', path: '/floor-map-3d' },
  ]

  useEffect(() => {
    const storedUser = localStorage.getItem('hoh108_user')
    if (storedUser) setUser(JSON.parse(storedUser))
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrolled(currentScrollY > 20)
      if (currentScrollY > 200) {
        setVisible(currentScrollY < lastScrollY.current)
      } else {
        setVisible(true)
      }
      lastScrollY.current = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleLogout = () => {
    localStorage.removeItem('hoh108_token')
    localStorage.removeItem('hoh108_user')
    setUser(null)
    setShowDropdown(false)
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease, box-shadow 0.3s ease',
        background: scrolled ? 'rgba(255,255,255,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(15, 23, 42, 0.06)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: scrolled ? '12px clamp(16px, 4vw, 80px)' : '20px clamp(16px, 4vw, 80px)',
          transition: 'padding 0.3s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setIsOpen(!isOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                color: COLORS.dark,
                zIndex: 1001,
              }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img
                src="/Logo.png"
                alt="House of Hancet 108"
                style={{
                  height: scrolled ? '44px' : '56px',
                  width: 'auto',
                  transition: 'height 0.3s ease',
                }}
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="desktop-nav" style={{ gap: '28px' }}>
              {navLinks.map(link => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="link-hover"
                  style={{
                    color: isActive(link.path) ? COLORS.accent : COLORS.dark,
                    fontSize: '14px',
                    fontWeight: isActive(link.path) ? 600 : 400,
                    textDecoration: 'none',
                    letterSpacing: '0.02em',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseOver={(e) => { if (!isActive(link.path)) e.currentTarget.style.color = COLORS.accent }}
                  onMouseOut={(e) => { if (!isActive(link.path)) e.currentTarget.style.color = COLORS.dark }}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Auth & CTA */}
            <div className="desktop-cta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'transparent',
                      color: COLORS.dark,
                      padding: '8px 16px',
                      borderRadius: '50px',
                      border: `1px solid ${COLORS.border}`,
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = COLORS.accent
                      e.currentTarget.style.color = COLORS.accent
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = COLORS.border
                      e.currentTarget.style.color = COLORS.dark
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
                      backgroundColor: '#fff',
                      borderRadius: '16px',
                      border: `1px solid ${COLORS.border}`,
                      minWidth: '200px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                    }}>
                      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
                        <p style={{ color: COLORS.dark, fontSize: '14px', fontWeight: 600 }}>{user.name}</p>
                        <p style={{ color: COLORS.stone, fontSize: '12px' }}>{user.email}</p>
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
                          color: COLORS.dark,
                          fontSize: '14px',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          borderBottom: `1px solid ${COLORS.border}`
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.canvas
                          e.currentTarget.style.color = COLORS.accent
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = COLORS.dark
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
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="link-hover"
                    style={{
                      color: COLORS.dark,
                      fontSize: '14px',
                      textDecoration: 'none',
                      padding: '8px 16px',
                    }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/contact-us"
                    className="cta-beat"
                    style={{
                      backgroundColor: COLORS.accent,
                      color: '#fff',
                      padding: '12px 28px',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.accentDark
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(197,156,130,0.4)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.accent
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    Get Free Consultation
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Full-screen mobile menu */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          backgroundColor: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.3s ease',
        }}>
          {navLinks.map((link, i) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              style={{
                color: isActive(link.path) ? COLORS.accent : COLORS.dark,
                fontSize: '24px',
                fontFamily: "'Oswald', sans-serif",
                fontWeight: isActive(link.path) ? 600 : 400,
                textDecoration: 'none',
                padding: '12px 24px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                opacity: 0,
                animation: `fadeUp 0.4s ease forwards`,
                animationDelay: `${i * 0.06}s`,
              }}
            >
              {link.name}
            </Link>
          ))}
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  style={{ color: COLORS.dark, fontSize: '16px', textDecoration: 'none' }}
                >
                  My Profile
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false) }}
                  style={{
                    color: '#EF4444', fontSize: '16px', background: 'none', border: 'none', cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  style={{ color: COLORS.dark, fontSize: '16px', textDecoration: 'none' }}
                >
                  Login
                </Link>
                <Link
                  to="/contact-us"
                  onClick={() => setIsOpen(false)}
                  style={{
                    backgroundColor: COLORS.accent,
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Get Consultation
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Header
