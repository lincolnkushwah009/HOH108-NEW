import { useState } from 'react'
import {
  Building2,
  ClipboardList,
  Wrench,
  CheckCircle,
  Users,
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
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
        <h1 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '48px',
          color: 'white',
          marginBottom: '24px',
          lineHeight: 1.2
        }}>
          Building Dreams. Designing Lives.
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: '16px', lineHeight: 1.7 }}>
          House of Hancet 108 delivers full-spectrum home solutions. From structural build to
          interior finishes, we craft spaces that reflect your vision and lifestyle.
        </p>
      </div>
    </section>
  )
}

// ============================================
// OUR STORY SECTION
// ============================================
function OurStorySection() {
  const highlights = [
    'Full-service residential construction + interiors + renovation.',
    'Based in Bangalore & Mysore, serving clients looking for seamless end-to-end solutions.'
  ]

  return (
    <section style={{ backgroundColor: COLORS.dark, padding: '0 24px 80px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="beige-container">
          <div className="grid-responsive-2" style={{ gap: '48px', alignItems: 'flex-start' }}>
            {/* Image */}
            <div style={{
              aspectRatio: '4/5',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <img
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=750&fit=crop"
                alt="HOH108 Story"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Content */}
            <div>
              <h2 style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '36px',
                color: COLORS.dark,
                marginBottom: '24px'
              }}>
                Our <span style={{ fontStyle: 'italic' }}>Story</span>
              </h2>

              <p style={{ color: 'rgba(17,17,17,0.7)', lineHeight: 1.7, marginBottom: '24px', fontSize: '14px' }}>
                We're a hybrid design-build firm with roots in robust residential construction
                and a fresh leap into luxury interiors and renovation. Our journey is defined
                by precision, quality, and passion for spaces that not only stand tall but feel
                like home.
              </p>

              <h3 style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '18px',
                color: COLORS.dark,
                marginBottom: '16px'
              }}>
                <span style={{ color: COLORS.accent }}>Key Points</span> to include:
              </h3>

              <p style={{ color: 'rgba(17,17,17,0.7)', lineHeight: 1.7, marginBottom: '32px', fontSize: '14px' }}>
                We're a hybrid design-build firm with roots in robust residential construction
                and a fresh leap into luxury interiors and renovation. Our journey is defined
                by precision, quality, and passion for spaces that not only stand tall but feel
                like home.
              </p>

              {/* Highlight Pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {highlights.map((text, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: `${COLORS.accent}20`,
                      padding: '16px 20px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      color: COLORS.dark,
                      lineHeight: 1.5,
                      borderLeft: `3px solid ${COLORS.accent}`
                    }}
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// SERVICES & CAPABILITIES SECTION
// ============================================
function ServicesCapabilitiesSection() {
  const services = [
    {
      title: 'Construction & Build:',
      desc: 'Ground-up homes, structural works, civil execution.',
      highlighted: true
    },
    {
      title: 'Interior Design & Fit-outs:',
      desc: 'Modular kitchens, wardrobes, full-home interiors, custom carpentry, finishes.'
    },
    {
      title: 'Renovation & Remodel:',
      desc: 'Upgrades, re-designs, home makeovers, structural & aesthetic renovation.'
    },
    {
      title: 'Quality Focus:',
      desc: 'Use of expert material selection, in-house execution (no outsourcing chaos), on-time delivery, transparent budgeting & estimate.'
    }
  ]

  return (
    <section className="section-padding" style={{ backgroundColor: COLORS.card }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 className="heading-xl" style={{
          fontFamily: 'Oswald, sans-serif',
          color: 'white',
          marginBottom: '48px'
        }}>
          Our <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Services & Capabilities</span>
        </h2>

        <div className="grid-responsive-2" style={{ gap: '48px', alignItems: 'center' }}>
          {/* Services List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {services.map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                padding: s.highlighted ? '16px 20px' : '8px 20px',
                borderRadius: '12px',
                backgroundColor: s.highlighted ? `${COLORS.accent}15` : 'transparent',
                borderLeft: s.highlighted ? `3px solid ${COLORS.accent}` : '3px solid transparent',
              }}>
                <div style={{ minWidth: '180px' }}>
                  <span style={{
                    color: s.highlighted ? COLORS.accent : COLORS.textLight,
                    fontSize: '14px',
                    fontWeight: s.highlighted ? 600 : 500
                  }}>
                    {s.title}
                  </span>
                </div>
                <p style={{ color: s.highlighted ? COLORS.textLight : COLORS.textMuted, fontSize: '14px', lineHeight: 1.6 }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Image */}
          <div style={{
            aspectRatio: '4/3',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop"
              alt="Services & Capabilities"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// HOW WE WORK SECTION
// ============================================
function HowWeWorkSection() {
  const steps = [
    {
      icon: Users,
      title: 'Pre-Design & Consultation',
      desc: 'we listen to your vision, preferences, lifestyle.'
    },
    {
      icon: Wrench,
      title: 'Construction / Interiors / Renovation Execution',
      desc: 'our team works end-to-end.'
    },
    {
      icon: ClipboardList,
      title: 'Design & Estimate',
      desc: 'detailed plan & transparent cost/time estimate.'
    },
    {
      icon: CheckCircle,
      title: 'Finishing & Handover',
      desc: 'final touches, quality check, delivering a ready-to-live space.'
    }
  ]

  return (
    <section style={{ backgroundColor: COLORS.dark, padding: '48px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: COLORS.accent,
          borderRadius: '24px',
          padding: '0 48px 48px',
          position: 'relative'
        }}>
          {/* Header with dark badge */}
          <div style={{
            display: 'flex',
            alignItems: 'stretch',
            marginBottom: '48px'
          }}>
            <div style={{
              backgroundColor: COLORS.dark,
              padding: '20px 32px',
              borderRadius: '0 0 16px 16px',
              display: 'inline-block'
            }}>
              <h2 style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '28px',
                color: 'white',
                margin: 0
              }}>
                How <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>We Work</span>
              </h2>
            </div>
          </div>

          {/* Steps Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '48px 64px'
          }}>
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}>
                    <Icon size={32} color={COLORS.dark} strokeWidth={1.5} />
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: COLORS.dark,
                    marginBottom: '8px'
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'rgba(17,17,17,0.6)' }}>
                    {step.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// PHILOSOPHY & VALUES SECTION
// ============================================
function PhilosophyValuesSection() {
  const values = [
    { title: 'Integrity & Transparency', highlighted: true },
    { title: 'Craftsmanship & Quality' },
    { title: 'Client-first Approach' },
    { title: 'Timely Delivery' },
    { title: 'Design + Build Harmony' },
  ]

  return (
    <section className="section-padding" style={{ backgroundColor: COLORS.card }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h2 className="heading-xl" style={{
          fontFamily: 'Oswald, sans-serif',
          color: 'white',
          marginBottom: '48px'
        }}>
          Our <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Philosophy & Values</span>
        </h2>

        <div className="grid-responsive-2" style={{ gap: '48px', alignItems: 'center' }}>
          {/* Values List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {values.map((v, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: v.highlighted ? COLORS.accent : 'rgba(255,255,255,0.08)',
                  padding: '20px 24px',
                  borderRadius: '12px',
                  color: v.highlighted ? COLORS.dark : COLORS.textLight,
                  fontSize: '15px',
                  fontWeight: 500,
                  maxWidth: '280px',
                  borderLeft: v.highlighted ? `3px solid ${COLORS.dark}` : `3px solid ${COLORS.accent}40`,
                }}
              >
                {v.title}
              </div>
            ))}
          </div>

          {/* Image */}
          <div style={{
            aspectRatio: '1/1',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            <img
              src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=600&fit=crop"
              alt="Our Philosophy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Quote */}
        <p style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '20px',
          color: COLORS.textLight,
          textAlign: 'center',
          marginTop: '64px',
          fontStyle: 'italic'
        }}>
          "To craft homes that stand strong, look beautiful, and feel uniquely yours."
        </p>
      </div>
    </section>
  )
}

// ============================================
// GET IN TOUCH SECTION
// ============================================
function GetInTouchSection() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

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
          notes: formData.message,
          source: 'website',
          service: 'consultation',
          websiteSource: 'HOH108'
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to submit')

      setSuccess(true)
      setFormData({ name: '', email: '', phone: '', message: '' })
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    padding: '12px 0',
    color: 'white',
    fontSize: '14px',
    outline: 'none'
  }

  return (
    <section className="section-padding" style={{ backgroundColor: COLORS.dark }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: COLORS.card,
          borderRadius: '24px',
          padding: '48px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '28px',
              color: 'white',
              marginBottom: '12px'
            }}>
              Get in <span style={{ fontStyle: 'italic' }}>Touch</span>
            </h2>
            <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
              Ready to build, renovate, or design your dream space? Connect<br />
              with us — let's start the journey.
            </p>
          </div>

          <div className="grid-responsive-2" style={{ gap: '48px', alignItems: 'center' }}>
            {/* Image Placeholder */}
            <div style={{
              backgroundColor: COLORS.dark,
              aspectRatio: '4/3',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Building2 size={60} color={COLORS.textMuted} style={{ opacity: 0.3 }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                style={inputStyle}
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                style={inputStyle}
              />
              <input
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                required
                style={inputStyle}
              />
              <textarea
                name="message"
                placeholder="Message"
                rows={3}
                value={formData.message}
                onChange={handleChange}
                style={{ ...inputStyle, resize: 'none' }}
              />

              {error && (
                <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{error}</p>
              )}
              {success && (
                <p style={{ color: '#22c55e', fontSize: '13px', margin: 0 }}>
                  Thank you! We'll get back to you soon.
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '16px',
                  alignSelf: 'flex-start',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Submitting...' : 'Get in Touch'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// MAIN ABOUT PAGE
// ============================================
function About() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark }}>
      <Header />
      <main>
        <HeroSection />
        <OurStorySection />
        <ServicesCapabilitiesSection />
        <HowWeWorkSection />
        <PhilosophyValuesSection />
        <GetInTouchSection />
      </main>
      <Footer />
    </div>
  )
}

export default About
