import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CostCalculator from './components/CostCalculator'
import FAQBlock from './components/FAQBlock'
import AIDesignLightbox from './components/AIDesignLightbox'
import SpinWheelLightbox, { SpinWheelTrigger } from './components/SpinWheelLightbox'
import Header from './components/Header'
import Footer from './components/Footer'
import { COLORS, API_BASE } from './constants/colors'
import {
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ChevronDown,
  Play,
  Star,
  Check,
  Home,
  Building2,
  Warehouse,
  Paintbrush,
  HardHat,
  Hammer,
  Clock,
  Award,
  Users,
  DollarSign,
  ArrowRight,
  Sofa,
  Sparkles,
  Shield,
  Ruler,
} from 'lucide-react'

// ============================================
// DESIGN TOKENS
// ============================================
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

// ============================================
// SCROLL REVEAL HOOK
// ============================================
function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return [ref, isRevealed]
}

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================
function AnimatedCounter({ end, duration = 2000, suffix = '', trigger }) {
  const [count, setCount] = useState(0)
  const [ref, isRevealed] = useScrollReveal()
  const shouldAnimate = trigger !== undefined ? trigger : isRevealed

  useEffect(() => {
    if (!shouldAnimate) return

    let startTime
    let rafId
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      // Ease-out for smoother counting
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      }
    }
    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [shouldAnimate, end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

// ============================================
// SECTION PILL COMPONENT
// ============================================
function SectionPill({ children }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '6px 20px',
      borderRadius: '50px',
      border: `1px solid ${COLORS.border}`,
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '2px',
      color: COLORS.stone,
      fontFamily: "'Raleway', sans-serif",
      marginBottom: '16px',
    }}>
      {children}
    </span>
  )
}

// ============================================
// HERO SECTION (Interiorplus Style)
// ============================================
function HeroSection() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', location: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState(null)

  // Animated stats
  const statsRef = useRef(null)
  const countRefs = [useRef(null), useRef(null), useRef(null)]
  const hasAnimatedRef = useRef(false)

  useEffect(() => {
    const targets = [500, 15, 45]
    const suffixes = ['+', '+', '']
    let rafId

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true
          const duration = 2500
          const startTime = performance.now()

          const animate = (now) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 4)
            for (let i = 0; i < targets.length; i++) {
              if (countRefs[i].current) {
                countRefs[i].current.textContent = Math.round(targets[i] * ease) + suffixes[i]
              }
            }
            if (progress < 1) {
              rafId = requestAnimationFrame(animate)
            }
          }
          rafId = requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )

    if (statsRef.current) observer.observe(statsRef.current)
    return () => {
      observer.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

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
          location: formData.location,
          source: 'website',
          service: 'consultation',
          websiteSource: 'HOH108'
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to submit')

      setSuccess(true)
      setFormData({ name: '', phone: '', email: '', location: '' })
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getInputStyle = (fieldName) => ({
    width: '100%',
    padding: '14px 0',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${focusedField === fieldName ? '#C59C82' : 'rgba(255, 255, 255, 0.15)'}`,
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: "'Raleway', sans-serif",
    outline: 'none',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box',
  })

  const stats = [
    { label: 'Happy Homes' },
    { label: 'Years Experience' },
    { label: 'Days Delivery' },
  ]

  return (
    <section id="consultation" style={{ padding: '80px 0 32px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 80px)' }}>
        <div style={{
          position: 'relative',
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          minHeight: '600px',
        }}>
          {/* Background Image */}
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop"
            alt="Dream home"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Dual gradient overlays */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(27,24,22,0.8), rgba(27,24,22,0.4), rgba(27,24,22,0.2))' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(27,24,22,0.7) 0%, rgba(27,24,22,0.1) 50%, transparent 100%)' }} />

          {/* Content Grid */}
          <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(32px, 6vw, 64px)', minHeight: '600px' }}>
            <style>{`
              @media (min-width: 768px) { .hero-ip-grid { grid-template-columns: 1fr 400px !important; } }
              @media (max-width: 767px) { .hero-ip-grid { gap: 32px !important; } }
            `}</style>
            <div className="hero-ip-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', alignItems: 'center', minHeight: '520px' }}>

              {/* Left Content */}
              <div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '8px 20px', borderRadius: '9999px',
                  fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '24px',
                }}>
                  Design. Build. Deliver.
                </span>

                <h1 style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 'clamp(2rem, 5.5vw, 4.5rem)',
                  fontWeight: 300,
                  color: '#ffffff',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase',
                  marginTop: '24px',
                  textShadow: '0 2px 20px rgba(0,0,0,0.5), 0 4px 40px rgba(0,0,0,0.3)',
                }}>
                  Where Architecture<br />Meets{' '}
                  <span style={{ color: '#C59C82', fontWeight: 500 }}>Interior Craft</span>
                </h1>

                <p style={{
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: '20px',
                  maxWidth: '480px',
                  lineHeight: 1.7,
                  textShadow: '0 1px 10px rgba(0,0,0,0.4)',
                }}>
                  <span className="desktop-only-text">One firm for construction, interiors, and renovation. We handle the entire journey — from structural foundation to the final finish.</span>
                  <span className="mobile-only-text">Construction. Interiors. Renovation. One company, complete solutions.</span>
                  {' '}Starting from <span style={{ color: '#C59C82', fontWeight: 600 }}>₹650/sq.ft</span>
                </p>

                {/* Stats */}
                <div ref={statsRef} style={{ display: 'flex', alignItems: 'baseline', gap: 'clamp(16px, 3vw, 40px)', marginTop: '40px', flexWrap: 'wrap' }}>
                  {stats.map((stat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span
                        ref={countRefs[i]}
                        style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                          fontWeight: 300,
                          color: '#ffffff',
                          lineHeight: 1,
                        }}
                      >
                        0
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Glass Form Card */}
              <div style={{
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                backgroundColor: 'rgba(27, 24, 22, 0.85)',
                borderRadius: '20px',
                padding: 'clamp(24px, 4vw, 32px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', padding: '6px 16px', borderRadius: '9999px',
                    fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    Free Consultation
                  </span>
                  <h2 style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '1.3rem',
                    fontWeight: 400,
                    color: '#ffffff',
                    marginTop: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}>
                    Get Free 3D Design
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '8px', fontSize: '13px' }}>
                    Expert Consultation + Detailed Pricing Guide<br />Zero Hidden Charges
                  </p>
                </div>

                {success ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      border: '1px solid #C59C82', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', margin: '0 auto 16px',
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C59C82" strokeWidth="1.5">
                        <polyline points="20,6 9,17 4,12" />
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: "'Oswald', sans-serif", color: '#ffffff', fontSize: '1.3rem', fontWeight: 300 }}>Thank You</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '8px' }}>Our design expert will contact you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {error && (
                      <div style={{
                        padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)',
                        borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '8px',
                      }}>
                        <p style={{ color: '#EF4444', fontSize: '13px', margin: 0 }}>{error}</p>
                      </div>
                    )}
                    {[
                      { name: 'name', type: 'text', placeholder: 'Your Name *', key: 'name' },
                      { name: 'phone', type: 'tel', placeholder: 'Mobile Number *', key: 'phone' },
                      { name: 'email', type: 'email', placeholder: 'Email Address *', key: 'email' },
                      { name: 'location', type: 'text', placeholder: 'Pincode / Location *', key: 'location' },
                    ].map((field) => (
                      <input
                        key={field.name}
                        type={field.type}
                        value={formData[field.key]}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        onFocus={() => setFocusedField(field.name)}
                        onBlur={() => setFocusedField(null)}
                        placeholder={field.placeholder}
                        required
                        disabled={loading}
                        style={getInputStyle(field.name)}
                      />
                    ))}
                    <button
                      type="submit"
                      disabled={loading}
                      className={loading ? '' : 'cta-beat'}
                      style={{
                        width: '100%',
                        marginTop: '20px',
                        backgroundColor: loading ? 'rgba(255,255,255,0.05)' : '#C59C82',
                        color: loading ? '#888' : '#ffffff',
                        padding: '14px',
                        borderRadius: '9999px',
                        fontWeight: 500,
                        fontSize: '13px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        fontFamily: "'Raleway', sans-serif",
                      }}
                    >
                      {loading ? 'Submitting...' : 'Get Free Quote'}
                    </button>
                  </form>
                )}
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: '16px' }}>
                  Enter Your Details And Get A Free<br />Consultation + Cost Estimates
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// WHO WE ARE SECTION
// ============================================
function WhoWeAreSection() {
  const [sectionRef, sectionRevealed] = useScrollReveal(0.15)
  const [hoveredImage, setHoveredImage] = useState(false)
  const [hoveredStat, setHoveredStat] = useState(null)

  // UI/UX Pro Max: Trust & Authority stats with icons
  const aboutStats = [
    { icon: Building2, value: '500+', label: 'Projects Delivered', delay: 0 },
    { icon: Award, value: '15+', label: 'Years of Excellence', delay: 40 },
    { icon: Users, value: '50+', label: 'Expert Team Members', delay: 80 },
  ]

  return (
    <section
      ref={sectionRef}
      style={{
        width: '100%',
        backgroundColor: COLORS.canvas,
        padding: 'clamp(80px, 12vw, 140px) clamp(16px, 4vw, 80px)',
        position: 'relative',
      }}
    >
      {/* Subtle noise texture overlay (UI/UX Pro Max: texture-overlay) */}
      <div className="noise-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <style>{`
          @media (min-width: 1024px) { .about-grid-v2 { grid-template-columns: 1.1fr 1fr !important; } }
          @media (max-width: 1023px) { .about-grid-v2 { gap: 40px !important; } }
          @media (max-width: 640px) { .about-stats-row { grid-template-columns: 1fr !important; } }
        `}</style>

        <div className="about-grid-v2" style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 'clamp(48px, 6vw, 80px)',
          alignItems: 'center',
        }}>

          {/* ─── Image Column ─── */}
          <div
            onMouseEnter={() => setHoveredImage(true)}
            onMouseLeave={() => setHoveredImage(false)}
            className="desktop-only"
            style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden',
              opacity: sectionRevealed ? 1 : 0,
              transform: sectionRevealed ? 'translateX(0)' : 'translateX(-40px)',
              transition: `all 0.7s ${EASE}`,
            }}
          >
            {/* Main image — 4:5 portrait ratio for premium feel */}
            <div style={{ aspectRatio: '4/5', position: 'relative', overflow: 'hidden' }}>
              <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=1000&fit=crop"
                alt="Premium interior design showcase by HOH108"
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: `transform 0.6s ${EASE}`,
                  transform: hoveredImage ? 'scale(1.04)' : 'scale(1)',
                }}
              />
              {/* Gradient overlay — appears on hover (UI/UX Pro Max: state-transition) */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.35) 0%, transparent 60%)',
                opacity: hoveredImage ? 1 : 0,
                transition: 'opacity 0.4s ease-out',
                pointerEvents: 'none',
              }} />
            </div>

            {/* Floating trust badge (UI/UX Pro Max: trust-authority + elevation-consistent) */}
            <div style={{
              position: 'absolute',
              bottom: '24px',
              left: '24px',
              right: '24px',
              display: 'flex',
              gap: '12px',
              opacity: hoveredImage ? 1 : 0,
              transform: hoveredImage ? 'translateY(0)' : 'translateY(12px)',
              transition: `all 0.35s ${EASE}`,
            }}>
              {['Construction', 'Interiors', 'Renovation'].map((tag) => (
                <span key={tag} style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: "'Raleway', sans-serif",
                  color: COLORS.dark,
                  letterSpacing: '0.02em',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* ─── Content Column ─── */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            opacity: sectionRevealed ? 1 : 0,
            transform: sectionRevealed ? 'translateX(0)' : 'translateX(30px)',
            transition: `all 0.7s ${EASE} 0.15s`,
          }}>

            {/* Pill label (UI/UX Pro Max: section-pill, color-semantic) */}
            <span style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: "'Raleway', sans-serif",
              color: COLORS.accent,
              border: `1px solid ${COLORS.accent}40`,
              backgroundColor: `${COLORS.accent}08`,
              marginBottom: '24px',
            }}>
              Who We Are
            </span>

            {/* Heading (UI/UX Pro Max: heading-hierarchy, weight-hierarchy 600-700) */}
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
              fontWeight: 700,
              textTransform: 'uppercase',
              lineHeight: 1.08,
              color: COLORS.textDark,
              marginBottom: '8px',
            }}>
              Crafting Timeless
            </h2>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(2.2rem, 4.5vw, 3.5rem)',
              fontWeight: 300,
              textTransform: 'uppercase',
              lineHeight: 1.08,
              color: COLORS.accent,
              marginBottom: '24px',
            }}>
              Spaces
            </h2>

            {/* Accent line (UI/UX Pro Max: visual-hierarchy via spacing + contrast) */}
            <div style={{
              width: '48px',
              height: '3px',
              backgroundColor: COLORS.accent,
              borderRadius: '2px',
              marginBottom: '24px',
            }} />

            {/* Body text (UI/UX Pro Max: line-height 1.5-1.75, line-length 65-75ch, readable-font-size 16px) */}
            <p style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: 'clamp(15px, 1.1vw, 17px)',
              color: COLORS.stone,
              lineHeight: 1.75,
              marginBottom: '16px',
              maxWidth: '520px',
            }}>
              <span className="desktop-only-text">HOH108 is a vertically integrated design and build practice. We bring together structural engineering, interior architecture, and renovation expertise under a single operational framework — eliminating the friction between separate contractors.</span>
              <span className="mobile-only-text">Construction, interiors, and renovation — one integrated team, one seamless process.</span>
            </p>
            <p style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: 'clamp(14px, 1vw, 16px)',
              color: COLORS.stone,
              lineHeight: 1.75,
              marginBottom: '40px',
              maxWidth: '520px',
              opacity: 0.85,
            }}>
              <span className="desktop-only-text">Based in Bangalore and Mysore, we serve clients who value precision, transparency, and spaces that are built to endure.</span>
            </p>

            {/* Stats Row (UI/UX Pro Max: trust-authority, 8dp spacing, stagger-sequence 30-50ms) */}
            <div
              className="about-stats-row"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '40px',
              }}
            >
              {aboutStats.map((stat, i) => {
                const Icon = stat.icon
                const isHovered = hoveredStat === i
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredStat(i)}
                    onMouseLeave={() => setHoveredStat(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      borderRadius: '16px',
                      backgroundColor: isHovered ? COLORS.white : 'transparent',
                      border: `1px solid ${isHovered ? COLORS.border : 'transparent'}`,
                      boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.04)' : 'none',
                      transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                      transition: `all 0.25s ease-out`,
                      cursor: 'default',
                    }}
                  >
                    {/* Icon container (UI/UX Pro Max: icon-style-consistent, 44px touch target) */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: `${COLORS.accent}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background-color 0.25s ease-out',
                      ...(isHovered && { backgroundColor: `${COLORS.accent}20` }),
                    }}>
                      <Icon size={20} color={COLORS.accent} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: 'clamp(22px, 2vw, 28px)',
                        fontWeight: 700,
                        color: COLORS.textDark,
                        lineHeight: 1,
                      }}>
                        {stat.value}
                      </div>
                      <div style={{
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: '12px',
                        color: COLORS.stone,
                        marginTop: '4px',
                        letterSpacing: '0.02em',
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA (UI/UX Pro Max: primary-action single CTA, cursor-pointer, min 44px, 150-300ms) */}
            <Link to="/about" style={{ textDecoration: 'none', alignSelf: 'flex-start' }}>
              <button
                aria-label="Learn more about HOH108"
                style={{
                  backgroundColor: COLORS.accent,
                  color: '#fff',
                  padding: '16px 40px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: "'Raleway', sans-serif",
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.25s ease-out',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  minHeight: '48px',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.accentDark
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(197,156,130,0.3)'
                  e.currentTarget.querySelector('svg').style.transform = 'translateX(4px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.accent
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.querySelector('svg').style.transform = 'translateX(0)'
                }}
              >
                Discover Our Story
                <ArrowRight size={18} style={{ transition: 'transform 0.25s ease-out' }} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// OUR VERTICALS SECTION
// ============================================
function VerticalsSection() {
  const verticals = [
    { name: 'Interior Plus', logo: '/images/verticals-Logos/Interior.png', link: '/interior' },
    { name: 'EDU Plus', logo: '/images/verticals-Logos/EDU.png', link: '/edu-plus' },
    { name: 'Exterior Plus', logo: '/images/verticals-Logos/Exterior.png', link: '/construction' },
    { name: 'Renovation Plus', logo: '/images/verticals-Logos/Renovation.png', link: '/renovation' },
    { name: 'ODS+ Plus', logo: '/images/verticals-Logos/ODS.png', link: '/contact-us' },
  ]

  return (
    <section style={{
      backgroundColor: COLORS.canvas,
      position: 'relative',
      overflow: 'hidden',
      padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 80px)',
    }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 10,
        right: 10,
        pointerEvents: 'none',
        opacity: 0.06,
      }}>
        <img
          src="/images/HOH108_WaterMArk.png"
          alt=""
          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
        />
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Mobile Layout */}
        <div className="verticals-mobile-layout">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <SectionPill>Our Verticals</SectionPill>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              color: COLORS.textDark,
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: '12px',
            }}>
              Our <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Verticals</span>
            </h2>
            <p style={{
              fontFamily: "'Raleway', sans-serif",
              color: COLORS.stone,
              maxWidth: '400px',
              margin: '0 auto',
              fontSize: '15px',
              lineHeight: 1.7,
            }}>
              <span style={{ color: COLORS.textDark, fontWeight: 600 }}>One brand. Multiple capabilities.</span><br />
              A unified practice. Multiple disciplines. Every vertical operates with shared quality standards and a single chain of command.
            </p>
          </div>

          <div className="verticals-mobile-grid">
            {verticals.map((v) => {
              const cardContent = (
                <div key={v.name} className="verticals-mobile-card" style={{
                  backgroundColor: COLORS.white,
                  borderRadius: '20px',
                  border: `1px solid ${COLORS.border}`,
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  transition: `all 0.4s ${EASE}`,
                }}>
                  <img
                    src={v.logo}
                    alt={v.name}
                    style={{
                      width: '160px',
                      height: '160px',
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                    }}
                    className="verticals-icon"
                  />
                </div>
              )
              if (v.link) {
                const isExternal = v.link.startsWith('http')
                return isExternal ? (
                  <a key={v.name} href={v.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    {cardContent}
                  </a>
                ) : (
                  <Link key={v.name} to={v.link} style={{ textDecoration: 'none' }}>
                    {cardContent}
                  </Link>
                )
              }
              return cardContent
            })}
          </div>
        </div>

        {/* Desktop Side-by-Side Layout */}
        <div className="verticals-desktop-layout">
          {/* Left - Header Text */}
          <div className="verticals-header" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <SectionPill>Our Verticals</SectionPill>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(3rem, 5vw, 5rem)',
              color: COLORS.textDark,
              marginBottom: '28px',
              lineHeight: 1.1,
              textTransform: 'uppercase',
              fontWeight: 700,
            }}>
              Our <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Verticals</span>
            </h2>
            <p style={{
              fontFamily: "'Raleway', sans-serif",
              color: COLORS.stone,
              maxWidth: '600px',
              marginBottom: '48px',
              fontSize: '18px',
              lineHeight: 1.7,
            }}>
              <span style={{ color: COLORS.textDark, fontWeight: 600, fontSize: '22px' }}>One brand. Multiple capabilities.</span><br />
              A unified practice. Multiple disciplines. Every vertical operates with shared quality standards and a single chain of command.
            </p>
            <a
              href="/about"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                color: COLORS.accent,
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '16px',
                fontFamily: "'Raleway', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: `color 0.3s ${EASE}`,
              }}
              onMouseOver={(e) => e.currentTarget.style.color = COLORS.accentDark}
              onMouseOut={(e) => e.currentTarget.style.color = COLORS.accent}
            >
              Explore Our Services <ArrowRight size={20} />
            </a>
          </div>

          {/* Right - Radial Layout */}
          <div className="verticals-radial-wrapper" style={{ transform: 'scale(1.25)', transformOrigin: 'center center' }}>
            {/* Center Logo */}
            <div className="verticals-center-logo" style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '150px',
              height: '150px',
              backgroundColor: COLORS.accent,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              padding: '18px',
              boxShadow: '0 8px 32px rgba(197,156,130,0.3)',
            }}>
              <img
                src="/Logo.png"
                alt="HOH108"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'brightness(0) saturate(100%)',
                }}
              />
            </div>

            {/* Static outer Circle */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '440px',
              height: '440px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '50%',
            }} />

            {/* Orbiting Container */}
            <div className="verticals-orbit-container">
              {/* Dashed Circle */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '420px',
                height: '420px',
                border: `1px dashed ${COLORS.borderHover}`,
                borderRadius: '50%',
              }} />

              {/* Orbiting Nodes */}
              {verticals.map((v, i) => {
                const angle = (i * 72 - 90) * (Math.PI / 180)
                const radius = 210
                const x = 210 + radius * Math.cos(angle)
                const y = 210 + radius * Math.sin(angle)
                const nodeContent = (
                  <div className="verticals-node" style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    transform: 'translate(-50%, -50%)',
                    width: '140px',
                    height: '140px',
                    backgroundColor: COLORS.dark,
                    borderRadius: '50%',
                    border: `1px solid rgba(197,156,130,0.2)`,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    transition: `all 0.4s ${EASE}`,
                  }}>
                    <div className="verticals-node-content">
                      <img
                        src={v.logo}
                        alt={v.name}
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'contain',
                          display: 'block',
                          margin: '0 auto',
                        }}
                        className="verticals-icon"
                      />
                    </div>
                  </div>
                )
                if (v.link) {
                  const isExternal = v.link.startsWith('http')
                  return isExternal ? (
                    <a key={v.name} href={v.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      {nodeContent}
                    </a>
                  ) : (
                    <Link key={v.name} to={v.link} style={{ textDecoration: 'none' }}>
                      {nodeContent}
                    </Link>
                  )
                }
                return <div key={v.name}>{nodeContent}</div>
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// OUR SERVICES SECTION (Advantage Bento Style)
// ============================================
function ServicesSection() {
  const [sectionRef, sectionRevealed] = useScrollReveal()
  const [activeIndex, setActiveIndex] = useState(0)
  const isPaused = useRef(false)
  const timerRef = useRef(null)
  const CYCLE_MS = 4000

  const services = [
    {
      icon: Paintbrush,
      label: 'Interior Design',
      title: 'Interior Design',
      description: 'Thoughtfully designed spaces that balance form and function. From material selection to final styling — every detail is intentional.',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=900&fit=crop',
      link: '/interior',
    },
    {
      icon: HardHat,
      label: 'Construction',
      title: 'Construction',
      description: 'Engineered for permanence. Residential and commercial builds executed with structural integrity, premium materials, and zero-defect standards.',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=900&fit=crop',
      link: '/construction',
    },
    {
      icon: Hammer,
      label: 'Renovation',
      title: 'Renovation',
      description: 'Strategic upgrades that respect existing character while delivering modern performance. Structural, aesthetic, and functional — handled end-to-end.',
      image: 'https://images.unsplash.com/photo-1585128792020-803d29415281?w=800&h=900&fit=crop',
      link: '/renovation',
    },
  ]

  // Auto-cycle: starts when section scrolls into view, pauses on hover
  useEffect(() => {
    if (!sectionRevealed) return
    const tick = () => {
      timerRef.current = setTimeout(() => {
        if (!isPaused.current) {
          setActiveIndex((prev) => (prev + 1) % services.length)
        }
        tick()
      }, CYCLE_MS)
    }
    tick()
    return () => clearTimeout(timerRef.current)
  }, [sectionRevealed, services.length])

  const handleMouseEnter = useCallback((i) => {
    isPaused.current = true
    setActiveIndex(i)
  }, [])

  const handleMouseLeave = useCallback(() => {
    isPaused.current = false
  }, [])

  return (
    <section style={{
      backgroundColor: COLORS.canvas,
      padding: 'clamp(64px, 10vw, 120px) 0',
      overflow: 'hidden',
    }}>
      <div ref={sectionRef} style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
          <SectionPill>What We Do</SectionPill>
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
            fontWeight: 700,
            color: COLORS.textDark,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            marginBottom: '16px',
            opacity: sectionRevealed ? 1 : 0,
            transform: sectionRevealed ? 'translateY(0)' : 'translateY(30px)',
            transition: `opacity 1s ${EASE}, transform 1s ${EASE}`,
          }}>
            The HOH108 <span style={{ color: COLORS.accent }}>Services</span>
          </h2>
          <p style={{
            fontFamily: "'Raleway', sans-serif",
            color: COLORS.stone,
            maxWidth: '600px',
            margin: '0 auto',
            fontSize: '15px',
            lineHeight: 1.7,
            opacity: sectionRevealed ? 1 : 0,
            transform: sectionRevealed ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 1s 0.15s ${EASE}, transform 1s 0.15s ${EASE}`,
          }}>
            Construction, interiors, and renovation — delivered by one integrated team with complete accountability.
          </p>
        </div>

        {/* Bento Cards */}
        <div
          className="services-bento-grid"
          style={{
            display: 'flex',
            gap: 'clamp(10px, 1.2vw, 16px)',
            height: 'clamp(420px, 45vw, 560px)',
            opacity: sectionRevealed ? 1 : 0,
            transform: sectionRevealed ? 'translateY(0)' : 'translateY(40px)',
            transition: `opacity 1s 0.3s ${EASE}, transform 1s 0.3s ${EASE}`,
          }}
        >
          {services.map((s, i) => {
            const Icon = s.icon
            const isActive = i === activeIndex

            return (
              <div
                key={s.title}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
                onClick={() => setActiveIndex(i)}
                style={{
                  position: 'relative',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  flex: isActive ? '4' : '1',
                  transition: `flex 0.7s ${EASE}`,
                  minWidth: 0,
                }}
              >
                {/* Background Image */}
                <img
                  src={s.image}
                  alt={s.title}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    transition: `transform 4s ${EASE}`,
                  }}
                />

                {/* Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: isActive
                    ? 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.3) 50%, rgba(15,23,42,0.1) 100%)'
                    : 'rgba(15,23,42,0.5)',
                  transition: `all 0.7s ${EASE}`,
                }} />

                {/* Watermark text */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: isActive ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.8)',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 'clamp(60px, 10vw, 140px)',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.06)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  letterSpacing: '8px',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  opacity: isActive ? 1 : 0,
                  transition: `opacity 0.7s ${EASE}, transform 0.7s ${EASE}`,
                }}>
                  {s.label}
                </div>

                {/* Collapsed state — icon + vertical text */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '24px',
                  opacity: isActive ? 0 : 1,
                  pointerEvents: isActive ? 'none' : 'auto',
                  transition: `opacity 0.5s ${EASE}`,
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: 'rgba(15,23,42,0.5)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                    flexShrink: 0,
                  }}>
                    <Icon size={20} color={COLORS.white} strokeWidth={1.5} />
                  </div>
                  <span style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    color: COLORS.white,
                    textTransform: 'uppercase',
                    letterSpacing: '3px',
                    writingMode: 'vertical-lr',
                    whiteSpace: 'nowrap',
                  }}>
                    {s.label}
                  </span>
                </div>

                {/* Expanded state — content */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 'clamp(24px, 3vw, 40px)',
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'translateY(0)' : 'translateY(24px)',
                  pointerEvents: isActive ? 'auto' : 'none',
                  transition: `opacity 0.6s 0.2s ${EASE}, transform 0.6s 0.2s ${EASE}`,
                }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    backgroundColor: 'rgba(15,23,42,0.5)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                    marginBottom: '20px',
                  }}>
                    <Icon size={22} color={COLORS.white} strokeWidth={1.5} />
                  </div>

                  <h3 style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                    fontWeight: 700,
                    color: COLORS.white,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '12px',
                  }}>
                    {s.title}
                  </h3>

                  <p style={{
                    fontFamily: "'Raleway', sans-serif",
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 'clamp(13px, 1.2vw, 15px)',
                    lineHeight: 1.7,
                    maxWidth: '520px',
                    marginBottom: '24px',
                  }}>
                    {s.description}
                  </p>

                  <Link
                    to={s.link}
                    onClick={(e) => e.stopPropagation()}
                    className="services-cta-btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 28px',
                      borderRadius: '50px',
                      fontWeight: 700,
                      fontFamily: "'Raleway', sans-serif",
                      fontSize: '13px',
                      textDecoration: 'none',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      border: '1px solid rgba(15,23,42,0.1)',
                    }}
                  >
                    Book Free Consultation
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// COST ESTIMATOR SECTION
// ============================================
function CostEstimatorSection() {
  const [sectionRef, sectionRevealed] = useScrollReveal()

  const trustPoints = [
    { icon: Check, text: 'Zero Hidden Charges' },
    { icon: Clock, text: 'Instant Results' },
    { icon: Shield, text: 'Expert-Verified Rates' },
  ]

  return (
    <section style={{ padding: 'clamp(32px, 5vw, 64px) 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 80px)' }}>
        <div style={{
          borderRadius: '24px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {/* Background image with overlay */}
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(197,156,130,0.92) 0%, rgba(166,139,106,0.95) 100%)' }} />

          {/* Decorative floating circles (hidden on mobile) */}
          <div className="desktop-only" style={{
            position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px',
            borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none',
            animation: 'float-slow 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px',
            borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none',
            animation: 'float-slow 10s ease-in-out infinite reverse',
          }} />
          <div style={{
            position: 'absolute', top: '30%', right: '10%', width: '120px', height: '120px',
            borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
            animation: 'float-slow 6s ease-in-out infinite',
          }} />

          {/* Content */}
          <div ref={sectionRef} style={{ position: 'relative', zIndex: 1 }}>
            {/* Header */}
            <div className="cost-estimator-header" style={{
              textAlign: 'center',
              padding: 'clamp(56px, 8vw, 88px) clamp(24px, 4vw, 60px) clamp(32px, 5vw, 48px)',
            }}>
              <span style={{
                display: 'inline-block',
                padding: '8px 24px',
                borderRadius: '50px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: '#fff',
                fontFamily: "'Raleway', sans-serif",
                marginBottom: '20px',
                opacity: sectionRevealed ? 1 : 0,
                transform: sectionRevealed ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
                transition: `all 0.6s ${EASE}`,
              }}>
                Cost Calculator
              </span>

              <h2 style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
                fontWeight: 700,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                marginBottom: '16px',
                textShadow: '0 2px 16px rgba(0,0,0,0.15)',
                opacity: sectionRevealed ? 1 : 0,
                transform: sectionRevealed ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.8s 0.1s ${EASE}, transform 0.8s 0.1s ${EASE}`,
              }}>
                Get Instant <span style={{ color: COLORS.dark }}>Cost Estimates</span>
              </h2>

              <p style={{
                fontFamily: "'Raleway', sans-serif",
                color: 'rgba(255,255,255,0.8)',
                fontSize: 'clamp(14px, 1.4vw, 16px)',
                lineHeight: 1.7,
                maxWidth: '540px',
                margin: '0 auto 32px',
                opacity: sectionRevealed ? 1 : 0,
                transform: sectionRevealed ? 'translateY(0)' : 'translateY(18px)',
                transition: `opacity 0.8s 0.2s ${EASE}, transform 0.8s 0.2s ${EASE}`,
              }}>
                Calculate accurate cost estimates for your dream project in just a few clicks.
              </p>

              {/* Trust Points — glass cards */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '10px',
                opacity: sectionRevealed ? 1 : 0,
                transform: sectionRevealed ? 'translateY(0)' : 'translateY(16px)',
                transition: `opacity 0.8s 0.3s ${EASE}, transform 0.8s 0.3s ${EASE}`,
              }}>
                {trustPoints.map((t, i) => {
                  const TIcon = t.icon
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '50px',
                      padding: '8px 18px',
                      transition: `all 0.3s ${EASE}`,
                    }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.22)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <TIcon size={14} color="#fff" strokeWidth={2} />
                      <span style={{
                        fontFamily: "'Raleway', sans-serif",
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#fff',
                        letterSpacing: '0.3px',
                      }}>
                        {t.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Calculator Card */}
            <div style={{
              padding: '0 clamp(16px, 3vw, 40px) clamp(24px, 4vw, 40px)',
              opacity: sectionRevealed ? 1 : 0,
              transform: sectionRevealed ? 'translateY(0)' : 'translateY(30px)',
              transition: `opacity 1s 0.4s ${EASE}, transform 1s 0.4s ${EASE}`,
            }}>
              <CostCalculator />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// SCROLL CARD REVEAL HOOK (per-card animation)
// ============================================
function useCardReveal() {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px 50px 0px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return [ref, isVisible]
}

// Bento feature card with scroll animation
function FeatureCard({ feature, index, style: gridStyle }) {
  const [cardRef, isVisible] = useCardReveal()
  const Icon = feature.icon

  // Card color themes — using HOH108 palette only (dark black, accent, canvas, white)
  const themes = [
    { bg: COLORS.canvas, text: COLORS.textDark, desc: COLORS.stone, iconBg: 'rgba(197,156,130,0.2)', iconColor: '#111', badgeBg: COLORS.accent, badgeColor: '#fff' },
    { bg: '#111111', text: '#fff', desc: 'rgba(255,255,255,0.6)', iconBg: 'rgba(197,156,130,0.15)', iconColor: COLORS.accent, badgeBg: COLORS.accent, badgeColor: '#111' },
    { bg: COLORS.accent, text: '#111', desc: 'rgba(17,17,17,0.7)', iconBg: 'rgba(17,17,17,0.12)', iconColor: '#111', badgeBg: '#111', badgeColor: COLORS.accent },
    { bg: COLORS.accentLight, text: '#111', desc: 'rgba(17,17,17,0.6)', iconBg: 'rgba(17,17,17,0.1)', iconColor: '#111', badgeBg: '#111', badgeColor: COLORS.accent },
    { bg: '#111111', text: '#fff', desc: 'rgba(255,255,255,0.6)', iconBg: 'rgba(197,156,130,0.15)', iconColor: COLORS.accent, badgeBg: COLORS.accent, badgeColor: '#111' },
    { bg: COLORS.canvas, text: COLORS.textDark, desc: COLORS.stone, iconBg: 'rgba(197,156,130,0.2)', iconColor: '#111', badgeBg: COLORS.accent, badgeColor: '#fff' },
  ]
  const t = themes[index] || themes[0]

  return (
    <div
      ref={cardRef}
      style={{
        ...gridStyle,
        position: 'relative',
        padding: 'clamp(28px, 3vw, 36px)',
        borderRadius: '20px',
        backgroundColor: t.bg,
        cursor: 'default',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
        transition: `opacity 0.8s ${EASE}, transform 0.7s ${EASE}, box-shadow 0.4s ${EASE}`,
        transitionDelay: `${index * 0.1}s`,
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'
        e.currentTarget.style.boxShadow = '0 24px 64px rgba(0,0,0,0.12)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Step Badge */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '38px',
        height: '38px',
        backgroundColor: t.badgeBg,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: t.badgeColor,
        fontWeight: 700,
        fontSize: '12px',
        fontFamily: "'Oswald', sans-serif",
        letterSpacing: '1px',
      }}>
        {feature.step}
      </div>

      {/* Icon */}
      <div style={{
        width: '50px',
        height: '50px',
        backgroundColor: t.iconBg,
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <Icon size={22} color={t.iconColor} strokeWidth={1.5} />
      </div>

      <h3 style={{
        fontFamily: "'Oswald', sans-serif",
        fontSize: 'clamp(1.1rem, 1.6vw, 1.3rem)',
        fontWeight: 700,
        color: t.text,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: '10px',
        lineHeight: 1.3,
      }}>
        {feature.title}
      </h3>
      <p className="desktop-only" style={{
        fontFamily: "'Raleway', sans-serif",
        color: t.desc,
        fontSize: '13px',
        lineHeight: 1.7,
        margin: 0,
      }}>
        {feature.desc}
      </p>
    </div>
  )
}

// ============================================
// WHY CHOOSE US SECTION (White + Scroll Cards)
// ============================================
function WhyChooseUsSection() {
  const [sectionRef, sectionRevealed] = useScrollReveal()

  const features = [
    { step: '01', title: 'Single-Point Accountability', desc: 'One team owns every phase — design, engineering, execution, and handover.', icon: Home },
    { step: '02', title: 'Material Integrity', desc: 'Curated materials verified for longevity. No substitutions, no compromises.', icon: Award },
    { step: '03', title: 'Integrated Design + Build', desc: 'Architecture and interiors developed in parallel — zero coordination gaps.', icon: Building2 },
    { step: '04', title: 'Milestone-Driven Timelines', desc: 'Every project phase tracked and reported. Delays are the exception, not the norm.', icon: Clock },
    { step: '05', title: '50+ Specialists', desc: 'Architects, structural engineers, interior designers, and project managers — in-house.', icon: Users },
    { step: '06', title: 'Open-Book Pricing', desc: 'Line-item cost breakdowns. Client approval at every stage. No hidden charges.', icon: DollarSign },
  ]

  const stats = [
    { number: 500, suffix: '+', label: 'Projects Delivered' },
    { number: 15, suffix: '+', label: 'Years of Trust' },
    { number: 98, suffix: '%', label: 'Happy Clients' },
    { number: 50, suffix: '+', label: 'Team Experts' },
  ]

  return (
    <section style={{ backgroundColor: COLORS.white, padding: 'clamp(80px, 12vw, 120px) 0' }}>
      <div ref={sectionRef} style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 56px)' }}>
          <SectionPill>The HOH108 Difference</SectionPill>
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(2rem, 4.5vw, 3rem)',
            fontWeight: 700,
            color: COLORS.textDark,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px',
            opacity: sectionRevealed ? 1 : 0,
            transform: sectionRevealed ? 'translateY(0)' : 'translateY(20px)',
            transition: `all 0.8s ${EASE}`,
          }}>
            Why Clients <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Trust Us</span>
          </h2>
          <p style={{
            fontFamily: "'Raleway', sans-serif",
            color: COLORS.stone,
            maxWidth: '672px',
            margin: '0 auto',
            fontSize: '15px',
            lineHeight: 1.7,
            opacity: sectionRevealed ? 1 : 0,
            transform: sectionRevealed ? 'translateY(0)' : 'translateY(15px)',
            transition: `all 0.8s 0.1s ${EASE}`,
          }}>
            15 years of consistent delivery. Every project backed by transparent timelines, verified pricing, and a team that stays accountable from start to finish.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid-responsive-4" style={{
          gap: '24px',
          marginBottom: 'clamp(48px, 6vw, 64px)',
        }}>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: COLORS.canvas,
                borderRadius: '16px',
                padding: 'clamp(24px, 3vw, 32px) 20px',
                textAlign: 'center',
                border: `1px solid ${COLORS.border}`,
                transition: `all 0.4s ${EASE}`,
                opacity: sectionRevealed ? 1 : 0,
                transform: sectionRevealed ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: `${0.15 + i * 0.08}s`,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)'
                e.currentTarget.style.borderColor = COLORS.accent
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = COLORS.border
              }}
            >
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 300,
                color: COLORS.accent,
                marginBottom: '4px',
                lineHeight: 1,
              }}>
                <AnimatedCounter end={stat.number} suffix={stat.suffix} trigger={sectionRevealed} />
              </div>
              <p style={{
                fontFamily: "'Raleway', sans-serif",
                color: COLORS.stone,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                margin: 0,
              }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Feature Cards — Bento Grid (complete square) */}
        <div className="why-bento-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: '260px 260px',
          gap: '16px',
          marginBottom: 'clamp(40px, 6vw, 56px)',
        }}>
          {features.map((f, i) => {
            /*  4-col grid, 2 rows — complete rectangle
                Row 1:  [01 small]  [02 wide -------]  [03 small]
                Row 2:  [04 small]  [05 small]  [06 wide -------]  */
            const gridStyles = [
              { gridColumn: '1 / 2', gridRow: '1 / 2' },       // 01
              { gridColumn: '2 / 4', gridRow: '1 / 2' },       // 02 wide
              { gridColumn: '4 / 5', gridRow: '1 / 2' },       // 03
              { gridColumn: '1 / 2', gridRow: '2 / 3' },       // 04
              { gridColumn: '2 / 3', gridRow: '2 / 3' },       // 05
              { gridColumn: '3 / 5', gridRow: '2 / 3' },       // 06 wide
            ][i]
            return <FeatureCard key={f.title} feature={f} index={i} style={gridStyles} />
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: 'center',
          opacity: sectionRevealed ? 1 : 0,
          transform: sectionRevealed ? 'translateY(0)' : 'translateY(20px)',
          transition: `all 0.8s 0.5s ${EASE}`,
        }}>
          <Link
            to="/contact-us"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: COLORS.accent,
              color: COLORS.white,
              padding: '16px 36px',
              borderRadius: '50px',
              fontWeight: 600,
              fontFamily: "'Raleway', sans-serif",
              fontSize: '14px',
              textDecoration: 'none',
              letterSpacing: '0.5px',
              transition: `all 0.3s ${EASE}`,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accentDark
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(197,156,130,0.35)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.accent
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Start Your Project Today
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================
// FAQ SECTION (Dark Background)
// ============================================
function FAQSection() {
  const homeFaqs = [
    {
      question: 'What services does HOH108 offer?',
      answer: 'HOH108 is a full-service construction and interior design company. We build homes from the ground up, design complete interiors, and handle renovations — for residential, commercial, hospitality, and institutional projects. One company, end-to-end.',
    },
    {
      question: 'How much does interior design cost per sq. ft.?',
      answer: 'Our interior design services start from Rs.650 per sq. ft. The final cost depends on the scope, materials, and finishes you choose. Use our cost calculator for a quick estimate, or book a free consultation for a detailed quote.',
    },
    {
      question: 'Do you handle both design and construction?',
      answer: 'Yes — that\'s what makes HOH108 different. We are both a construction company and an interior design firm. You get one team that builds your home and designs every room inside it. No separate contractors, no coordination headaches.',
    },
    {
      question: 'What areas do you serve?',
      answer: 'We are based in Bangalore and Mysore, serving clients across Karnataka. We take on projects across South India for larger engagements.',
    },
    {
      question: 'How long does a typical project take?',
      answer: 'Project timelines vary based on scope and complexity. A standard 2-3 BHK interior project typically takes 45-60 days. Construction projects depend on the scale. We pride ourselves on on-time delivery with transparent progress tracking.',
    },
    {
      question: 'Is the consultation really free?',
      answer: 'Yes, your initial consultation is completely free with zero hidden charges. We will discuss your requirements, provide design ideas, and give you a detailed pricing guide.',
    },
  ]

  return (
    <section style={{ padding: 'clamp(32px, 5vw, 64px) 0' }}>
      <FAQBlock faqs={homeFaqs} />
    </section>
  )
}

// ============================================
// SPLASH SCREEN
// ============================================
function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(1)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 40)

    const phase2Timer = setTimeout(() => setPhase(2), 600)
    const phase3Timer = setTimeout(() => setPhase(3), 2200)
    const completeTimer = setTimeout(() => {
      onCompleteRef.current?.()
    }, 2900)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(phase2Timer)
      clearTimeout(phase3Timer)
      clearTimeout(completeTimer)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: COLORS.canvas,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      opacity: phase === 3 ? 0 : 1,
      pointerEvents: phase === 3 ? 'none' : 'auto',
      transition: `opacity 0.7s ${EASE}`,
    }}>
      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          position: 'relative',
          transform: phase >= 1 ? 'scale(1)' : 'scale(0.8)',
          opacity: phase >= 1 ? 1 : 0,
          transition: `all 0.8s ${EASE}`,
        }}>
          <div style={{
            width: 'clamp(100px, 25vw, 160px)',
            height: 'clamp(100px, 25vw, 160px)',
            backgroundColor: COLORS.accent,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            boxShadow: '0 16px 48px rgba(197,156,130,0.3)',
          }}>
            <img
              src="/Logo.png"
              alt="HOH108"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'brightness(0) saturate(100%)',
              }}
            />
          </div>
        </div>

        {/* Brand Text */}
        <div style={{
          textAlign: 'center',
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
          transition: `all 0.6s ${EASE}`,
          transitionDelay: '0.3s',
        }}>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(24px, 6vw, 36px)',
            color: COLORS.textDark,
            marginBottom: '8px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}>
            HOUSE OF HANCET
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}>
            <div style={{ width: '60px', height: '1px', backgroundColor: COLORS.accent }} />
            <span style={{
              color: COLORS.accent,
              fontSize: '18px',
              letterSpacing: '6px',
              fontWeight: 300,
              fontFamily: "'Oswald', sans-serif",
            }}>
              108
            </span>
            <div style={{ width: '60px', height: '1px', backgroundColor: COLORS.accent }} />
          </div>
          <p style={{
            fontFamily: "'Raleway', sans-serif",
            color: COLORS.stone,
            fontSize: '13px',
            marginTop: '16px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}>
            Where Vision Meets Home
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '200px',
          opacity: phase >= 2 ? 1 : 0,
          transition: `opacity 0.5s ${EASE}`,
          transitionDelay: '0.5s',
        }}>
          <div style={{
            height: '2px',
            backgroundColor: COLORS.border,
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: COLORS.accent,
              borderRadius: '10px',
              transition: 'width 0.1s ease-out',
            }} />
          </div>
          <p style={{
            fontFamily: "'Raleway', sans-serif",
            color: COLORS.stone,
            fontSize: '11px',
            textAlign: 'center',
            marginTop: '12px',
            letterSpacing: '1px',
          }}>
            {progress < 100 ? 'Crafting your experience...' : 'Welcome'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN APP
// ============================================
function App() {
  const [isAILightboxOpen, setIsAILightboxOpen] = useState(false)
  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false)
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown')
  })

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('splashShown', 'true')
    setShowSplash(false)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.canvas }}>
      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Header />
      <main>
        <HeroSection />
        <WhoWeAreSection />
        <VerticalsSection />
        <ServicesSection />
        <CostEstimatorSection />
        <WhyChooseUsSection />
        <FAQSection />
      </main>
      <Footer />

      {/* Floating Spin & Win Trigger */}
      <SpinWheelTrigger onClick={() => setIsSpinWheelOpen(true)} />

      {/* Spin Wheel Lightbox */}
      <SpinWheelLightbox
        isOpen={isSpinWheelOpen}
        onClose={() => setIsSpinWheelOpen(false)}
      />

      {/* AI Design Lightbox */}
      <AIDesignLightbox
        isOpen={isAILightboxOpen}
        onClose={() => setIsAILightboxOpen(false)}
        onGenerate={(data) => {
          console.log('Generate 3D design with:', data)
        }}
      />
    </div>
  )
}

export default App
