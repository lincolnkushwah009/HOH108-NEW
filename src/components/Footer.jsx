import { Link } from 'react-router-dom'
import {
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { FaInstagram, FaLinkedinIn, FaFacebookF } from 'react-icons/fa'
import { COLORS } from '../constants/colors'

function Footer() {
  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Team', path: '/team' },
    { name: 'Contact Us', path: '/contact-us' },
  ]

  const serviceLinks = [
    { name: 'Interior Design', path: '/interior' },
    { name: 'Construction', path: '/construction' },
    { name: 'Renovation', path: '/renovation' },
    { name: 'Our Team', path: '/team' },
    { name: '3D Visualizer', path: '/floor-map-3d' },
  ]

  const locations = [
    'HSR Layout, Bengaluru',
    'JP Nagar, Bengaluru',
    'Mysuru',
  ]

  const socialLinks = [
    { icon: FaInstagram, href: '#', label: 'Instagram' },
    { icon: FaLinkedinIn, href: '#', label: 'LinkedIn' },
    { icon: FaFacebookF, href: '#', label: 'Facebook' },
  ]

  return (
    <footer style={{ backgroundColor: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
      {/* Main Content */}
      <div style={{ padding: 'clamp(48px, 8vw, 80px) clamp(16px, 4vw, 80px) clamp(32px, 6vw, 48px)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Top: Logo + Tagline */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            marginBottom: '48px',
            paddingBottom: '48px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>
            <div>
              <Link to="/" style={{ display: 'inline-block', marginBottom: '16px' }}>
                <img
                  src="/Logo.png"
                  alt="House of Hancet 108"
                  className="footer-logo-img"
                  style={{ height: '56px', width: 'auto', filter: 'brightness(0) invert(1)' }}
                />
              </Link>
              <p style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 'var(--text-small)',
                lineHeight: 1.7,
                maxWidth: '320px',
              }}>
                From construction to interiors, HOH108 delivers full-spectrum home solutions
                with precision, quality, and passion for every space.
              </p>
            </div>
            {/* Social */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  aria-label={social.label}
                  style={{
                    width: '42px',
                    height: '42px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.accent
                    e.currentTarget.style.borderColor = COLORS.accent
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                  }}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '40px',
          }}>
            {/* Quick Links */}
            <div>
              <h5 style={{
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: "'Oswald', sans-serif",
              }}>Quick Links</h5>
              {quickLinks.map(link => (
                <Link
                  key={link.name}
                  to={link.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '14px',
                    marginBottom: '12px',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = COLORS.accent}
                  onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  <ChevronRight size={14} />
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Services */}
            <div>
              <h5 style={{
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: "'Oswald', sans-serif",
              }}>Services</h5>
              {serviceLinks.map(s => (
                <Link
                  key={s.name}
                  to={s.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '14px',
                    marginBottom: '12px',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = COLORS.accent}
                  onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  <ChevronRight size={14} />
                  {s.name}
                </Link>
              ))}
            </div>

            {/* Locations */}
            <div>
              <h5 style={{
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: "'Oswald', sans-serif",
              }}>Locations</h5>
              {locations.map(loc => (
                <div key={loc} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <MapPin size={14} color={COLORS.accent} style={{ flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{loc}</span>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h5 style={{
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: "'Oswald', sans-serif",
              }}>Contact</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <a href="tel:+918861888424" style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  color: 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none',
                  transition: 'color 0.3s ease',
                }}
                  onMouseOver={(e) => e.currentTarget.style.color = COLORS.accent}
                  onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  <Phone size={14} color={COLORS.accent} />
                  +91 8861888424
                </a>
                <a href="mailto:info@hoh108.com" style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  color: 'rgba(255,255,255,0.5)', fontSize: '14px', textDecoration: 'none',
                  transition: 'color 0.3s ease',
                }}
                  onMouseOver={(e) => e.currentTarget.style.color = COLORS.accent}
                  onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                >
                  <Mail size={14} color={COLORS.accent} />
                  info@hoh108.com
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={14} color={COLORS.accent} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Mon-Sat, 9AM-7PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '20px clamp(16px, 4vw, 80px)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
            &copy; {new Date().getFullYear()} <span style={{ color: COLORS.accent }}>HOH108</span>. All Rights Reserved.
          </p>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[
              { name: 'Privacy Policy', path: '/privacy-policy' },
              { name: 'Terms', path: '/terms-and-conditions' },
              { name: 'Refund', path: '/refund-policy' },
            ].map(link => (
              <Link
                key={link.name}
                to={link.path}
                style={{
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: '13px',
                  textDecoration: 'none',
                  transition: 'color 0.3s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
