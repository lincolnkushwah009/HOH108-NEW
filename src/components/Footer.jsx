import { Link } from 'react-router-dom'
import {
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
} from 'lucide-react'
import { COLORS } from '../constants/colors'

function Footer() {
  return (
    <footer style={{ backgroundColor: COLORS.card, position: 'relative', overflow: 'hidden' }}>
      {/* Top Accent Bar */}
      <div style={{
        height: '4px',
        background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentLight}, ${COLORS.accent})`
      }} />

      {/* Main Footer Content */}
      <div style={{ padding: '64px 24px 48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Top Section - Logo & Social */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '48px',
            marginBottom: '48px',
            paddingBottom: '48px',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            {/* Logo & Description */}
            <div>
              <Link to="/" style={{ display: 'inline-block', marginBottom: '20px' }}>
                <img
                  src="/Logo.png"
                  alt="House of Hancet 108"
                  style={{ height: '60px', width: 'auto' }}
                />
              </Link>
              <p style={{ color: COLORS.textMuted, fontSize: '14px', lineHeight: 1.7, marginBottom: '24px', maxWidth: '300px' }}>
                Transforming spaces into masterpieces. From construction to interiors, we bring your dream home to life with precision and quality.
              </p>
              {/* Social Icons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { icon: Facebook, href: '#' },
                  { icon: Instagram, href: '#' },
                  { icon: Twitter, href: '#' },
                  { icon: Linkedin, href: '#' },
                  { icon: Youtube, href: '#' }
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = COLORS.accent
                      e.currentTarget.style.borderColor = COLORS.accent
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    }}
                  >
                    <social.icon size={18} color="white" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '32px',
            marginBottom: '48px'
          }}>
            {/* Quick Links */}
            <div>
              <h5 style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Quick Links</h5>
              {[
                { name: 'Home', path: '/' },
                { name: 'About Us', path: '/about' },
                { name: 'Team', path: '/team' }
              ].map(link => (
                <Link
                  key={link.name}
                  to={link.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: COLORS.textMuted,
                    fontSize: '14px',
                    marginBottom: '14px',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = COLORS.accent}
                  onMouseOut={(e) => e.currentTarget.style.color = COLORS.textMuted}
                >
                  <ChevronRight size={14} />
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Services */}
            <div>
              <h5 style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Services</h5>
              {[
                { name: 'Interior Design', path: '/interior' },
                { name: 'Construction', path: '/construction' },
                { name: 'Renovation', path: '/renovation' },
                { name: '3D Visualizer', path: '/floor-map-3d' }
              ].map(s => (
                <Link
                  key={s.name}
                  to={s.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: COLORS.textMuted,
                    fontSize: '14px',
                    marginBottom: '14px',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = COLORS.accent}
                  onMouseOut={(e) => e.currentTarget.style.color = COLORS.textMuted}
                >
                  <ChevronRight size={14} />
                  {s.name}
                </Link>
              ))}
            </div>

            {/* Support */}
            <div>
              <h5 style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Support</h5>
              {[
                { name: 'Privacy Policy', path: '/privacy-policy' },
                { name: 'Terms & Conditions', path: '/terms-and-conditions' },
                { name: 'Refund & Cancellation', path: '/refund-policy' },
              ].map(s => (
                <Link
                  key={s.name}
                  to={s.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: COLORS.textMuted,
                    fontSize: '14px',
                    marginBottom: '14px',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = COLORS.accent}
                  onMouseOut={(e) => e.currentTarget.style.color = COLORS.textMuted}
                >
                  <ChevronRight size={14} />
                  {s.name}
                </Link>
              ))}
            </div>

            {/* Contact Info */}
            <div>
              <h5 style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>Contact Us</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'rgba(197,156,130,0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Phone size={16} color={COLORS.accent} />
                  </div>
                  <div>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '2px' }}>Call Us</p>
                    <p style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>+91 8861888424</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'rgba(197,156,130,0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Mail size={16} color={COLORS.accent} />
                  </div>
                  <div>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '2px' }}>Email Us</p>
                    <p style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>support@HOH108.com</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'rgba(197,156,130,0.15)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <MapPin size={16} color={COLORS.accent} />
                  </div>
                  <div>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '2px' }}>Locations</p>
                    <p style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>Bengaluru & Mysuru</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: '20px 24px'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <p style={{ color: COLORS.textMuted, fontSize: '13px' }}>
            &copy; 2025 <span style={{ color: COLORS.accent }}>HOH108</span>. All Rights Reserved.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link
              to="/terms-and-conditions"
              style={{
                color: COLORS.textMuted,
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = COLORS.textMuted}
            >
              Terms
            </Link>
            <Link
              to="/privacy-policy"
              style={{
                color: COLORS.textMuted,
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = COLORS.textMuted}
            >
              Privacy
            </Link>
            <Link
              to="/refund-policy"
              style={{
                color: COLORS.textMuted,
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'white'}
              onMouseOut={(e) => e.currentTarget.style.color = COLORS.textMuted}
            >
              Refund
            </Link>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div style={{
        position: 'absolute',
        bottom: '60px',
        right: '-50px',
        fontSize: '200px',
        fontWeight: 900,
        color: 'rgba(255,255,255,0.015)',
        pointerEvents: 'none',
        fontFamily: "'Oswald', sans-serif"
      }}>
        108
      </div>
    </footer>
  )
}

export default Footer
