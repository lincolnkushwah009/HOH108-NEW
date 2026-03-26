import { useState } from 'react'
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  Building2,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import FAQBlock from '../components/FAQBlock'
import { COLORS, API_BASE } from '../constants/colors'

// ============================================
// SHARED INPUT STYLE
// ============================================
const inputStyle = {
  width: '100%',
  backgroundColor: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '12px',
  padding: '14px 16px',
  color: COLORS.textDark,
  fontSize: '14px',
  fontFamily: 'Raleway, sans-serif',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
}

const inputFocusHandler = (e) => {
  e.currentTarget.style.borderColor = COLORS.accent
  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(197,156,130,0.15)`
}

const inputBlurHandler = (e) => {
  e.currentTarget.style.borderColor = COLORS.border
  e.currentTarget.style.boxShadow = 'none'
}

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
  return (
    <section style={{ padding: '80px 0 32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 80px)' }}>
        <div style={{
          position: 'relative',
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          minHeight: '440px',
        }}>
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=800&fit=crop"
            alt="Contact HOH108"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0.6)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,17,17,0.5) 0%, transparent 60%)' }} />

          <div style={{
            position: 'relative',
            zIndex: 2,
            padding: 'clamp(48px, 8vw, 80px) clamp(32px, 6vw, 64px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            minHeight: '440px',
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              marginBottom: '24px',
              fontFamily: "'Raleway', sans-serif",
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}>
              <MessageSquare size={16} />
              Get in Touch
            </span>

            <h1 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 300,
              color: '#ffffff',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              marginBottom: '24px',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}>
              Let's Build Your <span style={{ color: COLORS.accent, fontWeight: 500 }}>Dream</span> Together
            </h1>
            <p style={{
              fontFamily: "'Raleway', sans-serif",
              color: 'rgba(255,255,255,0.65)',
              fontSize: 'clamp(14px, 1.5vw, 17px)',
              lineHeight: 1.8,
              maxWidth: '600px',
            }}>
              Have questions about our services? Want to discuss your project? We're here to help you every step of the way.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// CONTACT INFO CARDS (white bg, light feel)
// ============================================
function ContactInfoSection() {
  const contactInfo = [
    {
      icon: Phone,
      title: 'Call Us',
      primary: '+91 8861888424',
      secondary: null,
      action: 'tel:+918861888424'
    },
    {
      icon: Mail,
      title: 'Email Us',
      primary: 'info@hoh108.com',
      secondary: 'support@hoh108.com',
      action: 'mailto:info@hoh108.com'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      primary: 'Mon - Sat: 9:00 AM - 7:00 PM',
      secondary: 'Sunday: By Appointment',
      action: null
    }
  ]

  return (
    <section style={{ backgroundColor: COLORS.canvas, padding: '60px 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 80px)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {contactInfo.map((info, i) => {
            const Icon = info.icon
            return (
              <a
                key={i}
                href={info.action || '#'}
                style={{
                  backgroundColor: COLORS.white,
                  borderRadius: '20px',
                  padding: '32px',
                  textDecoration: 'none',
                  border: `1px solid ${COLORS.border}`,
                  transition: 'all 0.3s ease',
                  cursor: info.action ? 'pointer' : 'default',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onMouseOver={(e) => {
                  if (info.action) {
                    e.currentTarget.style.borderColor = COLORS.accent
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(197,156,130,0.12)'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: COLORS.canvas,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <Icon size={24} color={COLORS.accent} />
                </div>
                <h3 style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: '20px',
                  color: COLORS.textDark,
                  marginBottom: '12px'
                }}>
                  {info.title}
                </h3>
                <p style={{ fontFamily: 'Raleway, sans-serif', color: COLORS.textDark, fontSize: '15px', marginBottom: info.secondary ? '4px' : 0 }}>
                  {info.primary}
                </p>
                {info.secondary && (
                  <p style={{ fontFamily: 'Raleway, sans-serif', color: COLORS.textMuted, fontSize: '14px' }}>
                    {info.secondary}
                  </p>
                )}
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// CONTACT FORM & LOCATIONS (2-column layout)
// ============================================
function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          service: 'consultation',
          source: 'website',
          websiteSource: 'HOH108',
          notes: [{ content: `Contact Form Inquiry\n\nMessage: ${formData.message}` }]
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to submit')

      setSuccess(true)
      setFormData({ name: '', email: '', phone: '', message: '' })
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const offices = [
    {
      city: 'Bengaluru',
      address: '123, 4th Floor, Brigade Road, Ashok Nagar, Bengaluru - 560025',
      phone: '+91 8861888424'
    },
    {
      city: 'Mysuru',
      address: '45, 2nd Main, Vijayanagar, Mysuru - 570017',
      phone: '+91 8861888424'
    },
  ]

  return (
    <section style={{ backgroundColor: COLORS.canvas, padding: '0 0 80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
          gap: '48px',
          alignItems: 'start'
        }}>
          {/* Contact Form - dark bg card */}
          <div style={{
            backgroundColor: COLORS.dark,
            borderRadius: '24px',
            padding: 'clamp(24px, 5vw, 40px)',
          }}>
            <h2 style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: 'clamp(24px, 3vw, 28px)',
              color: COLORS.white,
              marginBottom: '8px'
            }}>
              Send Us a Message
            </h2>
            <p style={{ fontFamily: 'Raleway, sans-serif', color: 'rgba(255,255,255,0.55)', fontSize: '14px', marginBottom: '32px' }}>
              Fill out the form below and we'll get back to you within 24 hours.
            </p>

            {success ? (
              <div style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <CheckCircle size={32} color="#22c55e" />
                </div>
                <h3 style={{ fontFamily: 'Oswald, sans-serif', color: COLORS.white, fontSize: '20px', marginBottom: '8px' }}>
                  Message Sent Successfully!
                </h3>
                <p style={{ fontFamily: 'Raleway, sans-serif', color: 'rgba(255,255,255,0.55)', fontSize: '14px' }}>
                  Our team will contact you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontFamily: 'Raleway, sans-serif', marginBottom: '8px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    style={{
                      ...inputStyle,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: COLORS.white,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = COLORS.accent
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(197,156,130,0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontFamily: 'Raleway, sans-serif', marginBottom: '8px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@email.com"
                    style={{
                      ...inputStyle,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: COLORS.white,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = COLORS.accent
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(197,156,130,0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontFamily: 'Raleway, sans-serif', marginBottom: '8px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 8861888424"
                    style={{
                      ...inputStyle,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: COLORS.white,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = COLORS.accent
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(197,156,130,0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Message */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: '13px', fontFamily: 'Raleway, sans-serif', marginBottom: '8px' }}>
                    Your Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your project..."
                    rows={4}
                    style={{
                      ...inputStyle,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: COLORS.white,
                      resize: 'vertical',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = COLORS.accent
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(197,156,130,0.2)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {error && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    fontFamily: 'Raleway, sans-serif',
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: loading ? 'rgba(197,156,130,0.5)' : COLORS.accent,
                    color: loading ? COLORS.white : COLORS.dark,
                    padding: '16px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '16px',
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = COLORS.accentDark
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(197,156,130,0.35)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = COLORS.accent
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  {loading ? 'Sending...' : (
                    <>
                      <Send size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Office Locations */}
          <div>
            <h2 style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: 'clamp(24px, 3vw, 28px)',
              color: COLORS.textDark,
              marginBottom: '24px'
            }}>
              Our Offices
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {offices.map((office, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: COLORS.white,
                    borderRadius: '20px',
                    padding: '28px',
                    border: `1px solid ${COLORS.border}`,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: COLORS.canvas,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Building2 size={20} color={COLORS.accent} />
                    </div>
                    <h3 style={{
                      fontFamily: 'Oswald, sans-serif',
                      fontSize: '22px',
                      color: COLORS.accent
                    }}>
                      {office.city}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                    <MapPin size={18} color={COLORS.textMuted} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ fontFamily: 'Raleway, sans-serif', color: COLORS.textMuted, fontSize: '14px', lineHeight: 1.6 }}>
                      {office.address}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Phone size={18} color={COLORS.textMuted} />
                    <a
                      href={`tel:${office.phone.replace(/\s/g, '')}`}
                      style={{ fontFamily: 'Raleway, sans-serif', color: COLORS.accent, fontSize: '14px', textDecoration: 'none' }}
                    >
                      {office.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Map */}
            <div style={{
              marginTop: '24px',
              backgroundColor: COLORS.white,
              borderRadius: '20px',
              overflow: 'hidden',
              border: `1px solid ${COLORS.border}`,
            }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d497699.9973874144!2d77.35074421903857!3d12.954517009617692!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44e6d%3A0xf8dfc3e8517e4fe0!2sBengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1703000000000!5m2!1sen!2sin"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="HOH108 Location"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// SOCIAL LINKS BAR
// ============================================
function SocialLinksBar() {
  const socials = [
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
  ]

  return (
    <section style={{ backgroundColor: COLORS.white, padding: '40px 0', borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Raleway, sans-serif', color: COLORS.textMuted, fontSize: '14px', marginBottom: '20px' }}>
          Follow us on social media
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          {socials.map((s, i) => {
            const Icon = s.icon
            return (
              <a
                key={i}
                href={s.href}
                aria-label={s.label}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: COLORS.canvas,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: COLORS.textMuted,
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  border: `1px solid ${COLORS.border}`,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.accent
                  e.currentTarget.style.color = COLORS.white
                  e.currentTarget.style.borderColor = COLORS.accent
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.canvas
                  e.currentTarget.style.color = COLORS.textMuted
                  e.currentTarget.style.borderColor = COLORS.border
                }}
              >
                <Icon size={20} />
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// FAQ SECTION (dark bg)
// ============================================
function FAQSection() {
  const faqs = [
    { question: 'How long does a typical interior design project take?', answer: 'Most residential projects take between 8-16 weeks from concept to completion, depending on the scope and complexity of the work involved.' },
    { question: 'Do you provide free consultations?', answer: 'Yes, we offer a complimentary 30-minute initial consultation to discuss your project requirements and provide a preliminary assessment.' },
    { question: 'What areas do you serve?', answer: 'We currently serve Bengaluru and Mysuru with plans to expand to more cities across India.' },
    { question: 'Can I see samples of your previous work?', answer: 'Absolutely! Visit our Projects page to browse our portfolio, or schedule a consultation and we can walk you through relevant case studies.' },
  ]
  return (
    <section style={{ padding: 'clamp(32px, 5vw, 48px) 0' }}>
      <FAQBlock faqs={faqs} />
    </section>
  )
}

// ============================================
// CTA SECTION
// ============================================
function CTASection() {
  return (
    <section style={{ backgroundColor: COLORS.canvas, padding: '80px 0' }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center',
        backgroundColor: COLORS.white,
        borderRadius: '24px',
        padding: 'clamp(32px, 5vw, 60px)',
        border: `1px solid ${COLORS.border}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
      }}>
        <h2 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: 'clamp(24px, 4vw, 36px)',
          color: COLORS.textDark,
          marginBottom: '16px',
          textTransform: 'uppercase',
        }}>
          Ready to Start Your Project?
        </h2>
        <p style={{
          fontFamily: 'Raleway, sans-serif',
          color: COLORS.textMuted,
          fontSize: '15px',
          lineHeight: 1.7,
          maxWidth: '500px',
          margin: '0 auto 32px',
        }}>
          Schedule a free consultation and let our experts help turn your vision into reality.
        </p>
        <a
          href="tel:+918861888424"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: COLORS.accent,
            color: COLORS.white,
            padding: '16px 36px',
            borderRadius: '12px',
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 600,
            fontSize: '16px',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.accentDark
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(197,156,130,0.35)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.accent
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Phone size={18} />
          Call Us Now
        </a>
      </div>
    </section>
  )
}

// ============================================
// MAIN CONTACT US PAGE
// ============================================
export default function ContactUs() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.canvas }}>
      <Header />
      <main>
        <HeroSection />
        <ContactInfoSection />
        <ContactFormSection />
        <SocialLinksBar />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
