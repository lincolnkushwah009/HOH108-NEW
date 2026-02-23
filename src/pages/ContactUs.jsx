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
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { COLORS, API_BASE } from '../constants/colors'

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
  return (
    <section style={{
      backgroundColor: COLORS.dark,
      paddingTop: '140px',
      paddingBottom: '80px',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 50% 0%, rgba(197,156,130,0.15) 0%, transparent 50%)`,
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(197,156,130,0.15)',
          color: COLORS.accent,
          padding: '10px 20px',
          borderRadius: '50px',
          fontSize: '14px',
          fontWeight: 500,
          marginBottom: '24px',
          border: '1px solid rgba(197,156,130,0.3)'
        }}>
          <MessageSquare size={18} />
          Get in Touch
        </div>

        <h1 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: 'clamp(36px, 6vw, 48px)',
          color: 'white',
          marginBottom: '24px',
          lineHeight: 1.2
        }}>
          Let's Build Your <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Dream</span> Together
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: '16px', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
          Have questions about our services? Want to discuss your project? We're here to help you every step of the way.
        </p>
      </div>
    </section>
  )
}

// ============================================
// CONTACT INFO CARDS
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
    <section style={{ backgroundColor: COLORS.dark, padding: '0 24px 60px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
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
                  backgroundColor: COLORS.card,
                  borderRadius: '20px',
                  padding: '32px',
                  textDecoration: 'none',
                  border: '1px solid rgba(197,156,130,0.1)',
                  transition: 'all 0.3s ease',
                  cursor: info.action ? 'pointer' : 'default'
                }}
                onMouseOver={(e) => {
                  if (info.action) {
                    e.currentTarget.style.borderColor = COLORS.accent
                    e.currentTarget.style.transform = 'translateY(-4px)'
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(197,156,130,0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(197,156,130,0.1)',
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
                  color: 'white',
                  marginBottom: '12px'
                }}>
                  {info.title}
                </h3>
                <p style={{ color: COLORS.textLight, fontSize: '15px', marginBottom: info.secondary ? '4px' : 0 }}>
                  {info.primary}
                </p>
                {info.secondary && (
                  <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
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
// CONTACT FORM & LOCATIONS
// ============================================
function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    service: '',
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
          city: formData.city,
          service: formData.service || 'consultation',
          source: 'website',
          websiteSource: 'HOH108',
          notes: [{ content: `Contact Form Inquiry\n\nCity: ${formData.city || 'Not specified'}\nService Interest: ${formData.service || 'Not specified'}\nMessage: ${formData.message}` }]
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to submit')

      setSuccess(true)
      setFormData({ name: '', email: '', phone: '', city: '', service: '', message: '' })
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
    {
      city: 'Hyderabad',
      address: 'Plot 42, Jubilee Hills, Hyderabad - 500033',
      phone: '+91 8861888424'
    }
  ]

  return (
    <section style={{ backgroundColor: COLORS.dark, padding: '0 24px 100px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="grid-responsive-2" style={{ gap: '48px', alignItems: 'start' }}>
          {/* Contact Form */}
          <div style={{
            backgroundColor: COLORS.card,
            borderRadius: '24px',
            padding: 'clamp(24px, 5vw, 40px)',
            border: '1px solid rgba(197,156,130,0.1)'
          }}>
            <h2 style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '28px',
              color: 'white',
              marginBottom: '8px'
            }}>
              Send Us a Message
            </h2>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', marginBottom: '32px' }}>
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
                <h3 style={{ color: 'white', fontSize: '20px', marginBottom: '8px' }}>
                  Message Sent Successfully!
                </h3>
                <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
                  Our team will contact you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.dark,
                        border: '1px solid rgba(197,156,130,0.2)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 8861888424"
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.dark,
                        border: '1px solid rgba(197,156,130,0.2)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@email.com"
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.dark,
                        border: '1px solid rgba(197,156,130,0.2)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                      Location *
                    </label>
                    <select
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.dark,
                        border: '1px solid rgba(197,156,130,0.2)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: formData.city ? 'white' : COLORS.textMuted,
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select your city</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Mysuru">Mysuru</option>
                      <option value="Hyderabad">Hyderabad</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                      Service Interested In
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.dark,
                        border: '1px solid rgba(197,156,130,0.2)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: formData.service ? 'white' : COLORS.textMuted,
                        fontSize: '14px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select a service</option>
                      <option value="interior">Interior Design</option>
                      <option value="construction">Construction</option>
                      <option value="renovation">Renovation</option>
                      <option value="consultation">General Consultation</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                    Your Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your project..."
                    rows={4}
                    style={{
                      width: '100%',
                      backgroundColor: COLORS.dark,
                      border: '1px solid rgba(197,156,130,0.2)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical'
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
                    fontSize: '14px'
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
                    color: COLORS.dark,
                    padding: '16px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease'
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
              fontSize: '28px',
              color: 'white',
              marginBottom: '24px'
            }}>
              Our Offices
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {offices.map((office, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: COLORS.card,
                    borderRadius: '20px',
                    padding: '28px',
                    border: '1px solid rgba(197,156,130,0.1)'
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
                      backgroundColor: 'rgba(197,156,130,0.1)',
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
                    <p style={{ color: COLORS.textLight, fontSize: '14px', lineHeight: 1.6 }}>
                      {office.address}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Phone size={18} color={COLORS.textMuted} />
                    <a
                      href={`tel:${office.phone.replace(/\s/g, '')}`}
                      style={{ color: COLORS.accent, fontSize: '14px', textDecoration: 'none' }}
                    >
                      {office.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Placeholder */}
            <div style={{
              marginTop: '24px',
              backgroundColor: COLORS.card,
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(197,156,130,0.1)'
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
// MAIN CONTACT US PAGE
// ============================================
export default function ContactUs() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark }}>
      <Header />
      <main>
        <HeroSection />
        <ContactInfoSection />
        <ContactFormSection />
      </main>
      <Footer />
    </div>
  )
}
