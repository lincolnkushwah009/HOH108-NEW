import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CostCalculator from './components/CostCalculator'
import AIDesignLightbox from './components/AIDesignLightbox'
import SpinWheelLightbox, { SpinWheelTrigger } from './components/SpinWheelLightbox'
import Header from './components/Header'
import Footer from './components/Footer'
import { COLORS, API_BASE } from './constants/colors'
import {
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
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
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ArrowRight,
  Sofa,
  Sparkles,
  User,
  LogOut,
} from 'lucide-react'

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
function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, isRevealed] = useScrollReveal()

  useEffect(() => {
    if (!isRevealed) return

    let startTime
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [isRevealed, end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

// ============================================
// FLOATING PARTICLES COMPONENT
// ============================================
function FloatingParticles({ count = 20 }) {
  return (
    <div className="particles-container">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${60 + Math.random() * 40}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${8 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// MAGNETIC BUTTON COMPONENT
// ============================================
function MagneticButton({ children, onClick, style, className = '' }) {
  const buttonRef = useRef(null)

  const handleMouseMove = (e) => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`
  }

  const handleMouseLeave = () => {
    if (buttonRef.current) {
      buttonRef.current.style.transform = 'translate(0, 0)'
    }
  }

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`magnetic-btn ${className}`}
      style={{
        transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
        ...style
      }}
    >
      {children}
    </button>
  )
}

// ============================================
// TILT CARD COMPONENT
// ============================================
function TiltCard({ children, style, className = '' }) {
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    const rotateX = (y - 0.5) * -20
    const rotateY = (x - 0.5) * 20
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
  }

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)'
    }
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transition: 'transform 0.3s ease',
        transformStyle: 'preserve-3d',
        ...style
      }}
    >
      {children}
    </div>
  )
}

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', location: '' })
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
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="morph-bg" style={{
      minHeight: '100vh',
      backgroundColor: COLORS.dark,
      display: 'flex',
      alignItems: 'center',
      paddingTop: '80px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Image with Parallax */}
      <div className="zoom-in-out" style={{
        position: 'absolute',
        inset: '-10%',
        backgroundImage: 'url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        animationDuration: '20s'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(17, 17, 17, 0.95), rgba(17, 17, 17, 0.7))'
        }} />
      </div>

      {/* Floating Particles */}
      <FloatingParticles count={15} />

      {/* Animated Geometric Lines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '1px',
              height: '100px',
              background: `linear-gradient(to bottom, transparent, ${COLORS.accent}40, transparent)`,
              left: `${20 + i * 15}%`,
              top: '-100px',
              animation: `particleFloat ${6 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 24px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div className="grid-responsive-2" style={{ gap: '48px', alignItems: 'center' }}>
          {/* Left Content */}
          <div>
            <h1 className="blur-in" style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(36px, 6vw, 56px)',
              color: 'white',
              marginBottom: '24px',
              lineHeight: 1.1
            }}>
              <span className="hero-text-animate" style={{ display: 'block' }}>Transform Your Space Into</span>
              <span className="hero-text-animate glow-text" style={{ display: 'block', color: COLORS.accent, fontStyle: 'italic', animationDelay: '0.3s' }}>A Masterpiece</span>
            </h1>
            <p style={{
              color: COLORS.textMuted,
              fontSize: '16px',
              lineHeight: 1.7,
              marginBottom: '32px',
              maxWidth: '500px'
            }}>
              Transform your space with our Expert consultations. Starting from <span style={{ color: COLORS.accent, fontWeight: '700' }}>₹650 per sq. ft.</span>
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                style={{
                  backgroundColor: COLORS.accent,
                  color: COLORS.dark,
                  padding: '14px 32px',
                  borderRadius: '50px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.accentLight
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(197,156,130,0.3)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.accent
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/floor-map-3d')}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  padding: '14px 32px',
                  borderRadius: '50px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  transform: 'scale(1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = COLORS.accent
                  e.currentTarget.style.color = COLORS.accent
                  e.currentTarget.style.backgroundColor = 'rgba(197,156,130,0.1)'
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
                  e.currentTarget.style.color = 'white'
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Sparkles size={16} />
                Try AI Design
              </button>
            </div>
          </div>
          {/* Form Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            marginLeft: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: COLORS.dark, marginBottom: '8px' }}>
              Get Your <span style={{ color: COLORS.accentDark }}>FREE</span> Consultation
            </h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
              Expert Consultation + Detailed Pricing Guide<br />
              <span style={{ color: COLORS.accentDark, fontWeight: 500 }}>Zero Hidden Charges</span>
            </p>

            {success && (
              <div style={{
                backgroundColor: '#22C55E20',
                border: '1px solid #22C55E',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#22C55E',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                Thank you! We'll contact you soon.
              </div>
            )}
            {error && (
              <div style={{
                backgroundColor: '#EF444420',
                border: '1px solid #EF4444',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#EF4444',
                fontSize: '14px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Full Name"
                  className="consultation-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder="Contact Number"
                  className="consultation-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                className="consultation-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Your Location"
                className="consultation-input"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#999' : COLORS.accent,
                  color: COLORS.dark,
                  padding: '16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  width: '100%',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = COLORS.accentDark
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(197,156,130,0.4)'
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
                {loading ? 'Submitting...' : 'Book Free Consultation'}
              </button>
            </form>

            <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '16px' }}>
              Enter Your Details And Get A Free<br />Consultation + Cost Estimates
            </p>
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
  const [imageRef, imageRevealed] = useScrollReveal()
  const [contentRef, contentRevealed] = useScrollReveal()

  return (
    <section className="section-padding" style={{ backgroundColor: COLORS.dark, position: 'relative', overflow: 'hidden' }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        border: `1px dashed ${COLORS.accent}20`,
        animation: 'rotateSlow 40s linear infinite'
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="grid-responsive-2" style={{ gap: '48px', alignItems: 'center' }}>
          {/* Image with reveal animation */}
          <div
            ref={imageRef}
            className={`scroll-reveal-left ${imageRevealed ? 'revealed' : ''}`}
          >
            <TiltCard style={{
              aspectRatio: '4/3',
              borderRadius: '20px 20px 20px 100px',
              overflow: 'hidden'
            }}>
              <div className="image-reveal" style={{ width: '100%', height: '100%' }}>
                <img
                  src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop"
                  alt="Modern luxury interior"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </TiltCard>
          </div>

          {/* Content with reveal animation */}
          <div
            ref={contentRef}
            className={`scroll-reveal-right ${contentRevealed ? 'revealed' : ''}`}
          >
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '48px', color: 'white', marginBottom: '8px' }}>
              Who <span className="underline-reveal" style={{ color: COLORS.accent, fontStyle: 'italic' }}>We Are</span>
            </h2>
            <div className="gradient-border-animated" style={{ width: '64px', height: '4px', marginBottom: '32px' }}></div>
            <p style={{ color: COLORS.textMuted, lineHeight: 1.7, marginBottom: '24px' }}>
              House of Hancet 108 (HOH108) is a multi-vertical design & build company based in
              Bangalore and Mysore. We specialize in construction, interiors and
              renovations for residential, commercial, hospitality and institutional establishments.
            </p>
            <p style={{ color: COLORS.textMuted, lineHeight: 1.7, marginBottom: '32px' }}>
              With our merger with Interior Plus, we now combine engineering strength
              with creative interior expertise, offering clients end-to-end solutions under one roof.
            </p>
            <Link to="/about" style={{ textDecoration: 'none' }}>
              <MagneticButton
                style={{
                  backgroundColor: COLORS.accent,
                  color: COLORS.dark,
                  padding: '14px 32px',
                  borderRadius: '50px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                className="neon-pulse"
              >
                Read More <ChevronRight size={18} />
              </MagneticButton>
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
    <section style={{ backgroundColor: COLORS.card, position: 'relative', overflow: 'hidden', padding: '80px 16px' }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 10,
        right: 10,
        pointerEvents: 'none',
        opacity: 0.15
      }}>
        <img
          src="/images/HOH108_WaterMArk.png"
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Mobile Layout */}
        <div className="verticals-mobile-layout">
          {/* Header */}
          <div className="verticals-header" style={{ marginBottom: '32px' }}>
            <h2 className="heading-xl" style={{ fontFamily: 'Oswald, sans-serif', color: 'white', marginBottom: '16px' }}>
              Our <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Verticals</span>
            </h2>
            <p style={{ color: COLORS.textMuted, maxWidth: '400px' }}>
              <span style={{ color: 'white', fontWeight: 500 }}>One brand. Multiple capabilities.</span><br />
              From ground-up construction to luxury interiors and complete renovations.
            </p>
          </div>

          {/* Mobile Grid */}
          <div className="verticals-mobile-grid">
            {verticals.map((v) => {
              const cardContent = (
                <div key={v.name} className="verticals-mobile-card" style={{
                  backgroundColor: COLORS.dark,
                  borderRadius: '16px',
                  border: '2px solid rgba(201,168,141,0.3)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <img
                    src={v.logo}
                    alt={v.name}
                    style={{
                      width: '160px',
                      height: '160px',
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto'
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
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '86px', color: 'white', marginBottom: '28px', lineHeight: 1.1 }}>
              Our <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Verticals</span>
            </h2>
            <p style={{ color: COLORS.textMuted, maxWidth: '600px', marginBottom: '48px', fontSize: '22px', lineHeight: 1.7 }}>
              <span style={{ color: 'white', fontWeight: 500, fontSize: '30px' }}>One brand. Multiple capabilities.</span><br />
              From ground-up construction to luxury interiors and complete renovations.
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
                fontSize: '20px'
              }}
            >
              Explore Our Services <ArrowRight size={22} />
            </a>
          </div>

          {/* Right - Radial Layout */}
          <div className="verticals-radial-wrapper" style={{ transform: 'scale(1.25)', transformOrigin: 'center center' }}>
            {/* Center Logo - Static */}
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
              padding: '18px'
            }}>
              <img
                src="/Logo.png"
                alt="HOH108"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'brightness(0) saturate(100%)'
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
              border: '1px solid rgba(201,168,141,0.1)',
              borderRadius: '50%'
            }}></div>

            {/* Orbiting Container - rotates the nodes around center */}
            <div className="verticals-orbit-container">
              {/* Dashed Circle - rotates with container */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '420px',
                height: '420px',
                border: '1px dashed rgba(201,168,141,0.3)',
                borderRadius: '50%'
              }}></div>

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
                    border: '2px solid rgba(201,168,141,0.3)',
                    cursor: 'pointer'
                  }}>
                    {/* Counter-rotating content to keep text upright */}
                    <div className="verticals-node-content">
                      <img
                        src={v.logo}
                        alt={v.name}
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'contain',
                          display: 'block',
                          margin: '0 auto'
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
// OUR SERVICES SECTION
// ============================================
function ServicesSection() {
  const [active, setActive] = useState(1)
  const [sectionRef, sectionRevealed] = useScrollReveal()
  const services = [
    { title: 'Interior Design', icon: Paintbrush, desc: 'Transform your space with expert interior design', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=800&fit=crop' },
    { title: 'Construction', icon: HardHat, desc: 'Quality construction for residential and commercial', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=800&fit=crop' },
    { title: 'Renovation', icon: Hammer, desc: 'Breathe new life into existing spaces', image: 'https://images.unsplash.com/photo-1585128792020-803d29415281?w=600&h=800&fit=crop' },
  ]

  return (
    <section className="section-padding" style={{ backgroundColor: COLORS.card, position: 'relative', overflow: 'hidden' }}>
      {/* Animated background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        backgroundImage: `radial-gradient(${COLORS.accent} 1px, transparent 1px)`,
        backgroundSize: '30px 30px',
        animation: 'gridMove 30s linear infinite'
      }} />

      <div ref={sectionRef} style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <h2
          className={`heading-xl scroll-reveal ${sectionRevealed ? 'revealed' : ''}`}
          style={{ fontFamily: 'Oswald, sans-serif', color: 'white', textAlign: 'center', marginBottom: '48px' }}
        >
          Our <span className="glow-text" style={{ color: COLORS.accent, fontStyle: 'italic' }}>Services</span>
        </h2>

        <div className="grid-responsive-3 stagger-children">
          {services.map((s, i) => {
            const isActive = i === active
            return (
              <div
                key={s.title}
                onClick={() => setActive(i)}
                style={{
                  borderRadius: '24px',
                  height: isActive ? '420px' : '380px',
                  padding: '24px',
                  cursor: 'pointer',
                  opacity: isActive ? 1 : 0.7,
                  transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <img
                  src={s.image}
                  alt={s.title}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(17,17,17,0.9) 0%, rgba(17,17,17,0.3) 50%, rgba(17,17,17,0.1) 100%)'
                }} />
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '32px',
                    height: '32px',
                    backgroundColor: COLORS.accent,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2
                  }}>
                    <ChevronRight size={18} color={COLORS.dark} />
                  </div>
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: 'white', marginBottom: '8px' }}>{s.title}</h3>
                  {isActive && <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>{s.desc}</p>}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: i === active ? '32px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: i === active ? COLORS.accent : 'rgba(255,255,255,0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: 'scale(1)'
              }}
              onMouseOver={(e) => {
                if (i !== active) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)'
                  e.currentTarget.style.transform = 'scale(1.2)'
                }
              }}
              onMouseOut={(e) => {
                if (i !== active) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'
                  e.currentTarget.style.transform = 'scale(1)'
                }
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================
// COST ESTIMATOR SECTION
// ============================================
function CostEstimatorSection() {
  const [calcType, setCalcType] = useState('interior')
  const [workType, setWorkType] = useState('full')

  return (
    <section style={{ backgroundColor: COLORS.dark, padding: '48px 16px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Beige Container */}
        <div className="beige-container">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '36px', color: COLORS.dark, marginBottom: '12px' }}>
              Get Instant Cost Estimates
            </h2>
            <p style={{ color: 'rgba(17,17,17,0.7)', fontSize: '14px' }}>
              Calculate the approximate cost for your interior design or construction project
            </p>
          </div>

          {/* Feature Pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {['No Hidden Costs', 'Accurate Estimates', 'Instant Results'].map(f => (
              <span key={f} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(17,17,17,0.1)',
                color: COLORS.dark,
                padding: '8px 16px',
                borderRadius: '50px',
                fontSize: '13px'
              }}>
                <Check size={14} /> {f}
              </span>
            ))}
          </div>

          {/* Toggle Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <div className="calc-toggle-container">
              <button
                onClick={() => setCalcType('interior')}
                className={calcType === 'interior' ? 'calc-toggle-btn calc-toggle-btn-active' : 'calc-toggle-btn calc-toggle-btn-inactive'}
              >
                Interior Cost Calculator
              </button>
              <button
                onClick={() => setCalcType('construction')}
                className={calcType === 'construction' ? 'calc-toggle-btn calc-toggle-btn-active' : 'calc-toggle-btn calc-toggle-btn-inactive'}
              >
                Construction Cost Calculator
              </button>
            </div>
          </div>

          {/* White Card */}
          <div className="white-card">
            <h3 style={{ color: COLORS.dark, fontWeight: 500, marginBottom: '24px' }}>Select Work Type</h3>
            <div className="grid-responsive-2" style={{ gap: '16px' }}>
              {[
                { id: 'full', name: 'Full Home Interiors', desc: 'Complete interior design for your entire home', icon: Home },
                { id: 'specific', name: 'Specific Rooms Only', desc: 'Select specific spaces you want to design', icon: Sofa }
              ].map(type => {
                const Icon = type.icon
                const selected = workType === type.id
                return (
                  <button
                    key={type.id}
                    onClick={() => setWorkType(type.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      padding: '24px',
                      borderRadius: '16px',
                      border: `2px solid ${selected ? COLORS.accent : '#e5e5e5'}`,
                      backgroundColor: selected ? 'rgba(201,168,141,0.05)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: selected ? COLORS.accent : '#f5f5f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={24} color={selected ? COLORS.dark : '#666'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: selected ? COLORS.accentDark : COLORS.dark, fontWeight: 500, marginBottom: '4px' }}>{type.name}</h4>
                      <p style={{ color: '#666', fontSize: '13px' }}>{type.desc}</p>
                    </div>
                    {selected && (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: COLORS.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={14} color={COLORS.dark} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// WHY CHOOSE US SECTION
// ============================================
function WhyChooseUsSection() {
  const [sectionRef, sectionRevealed] = useScrollReveal()
  const features = [
    { title: 'Turnkey Project Delivery', icon: Home },
    { title: 'Premium Finish Quality', icon: Award },
    { title: 'Design + Execution Under One Roof', icon: Building2 },
    { title: 'On-Time Completion', icon: Clock },
    { title: 'Skilled Architects & Designers', icon: Users },
    { title: 'Transparent Pricing & Workflow', icon: DollarSign },
  ]

  const stats = [
    { number: 500, suffix: '+', label: 'Projects Completed' },
    { number: 15, suffix: '+', label: 'Years Experience' },
    { number: 98, suffix: '%', label: 'Client Satisfaction' },
    { number: 50, suffix: '+', label: 'Expert Team Members' },
  ]

  return (
    <section className="section-padding" style={{ backgroundColor: COLORS.dark, position: 'relative', overflow: 'hidden' }}>
      {/* Animated background circles */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '-100px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        border: `1px solid ${COLORS.accent}10`,
        animation: 'rotateSlow 50s linear infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-150px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        border: `1px dashed ${COLORS.accent}15`,
        animation: 'rotateSlow 40s linear infinite reverse'
      }} />

      <div ref={sectionRef} style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <h2
          className={`heading-xl scroll-reveal ${sectionRevealed ? 'revealed' : ''}`}
          style={{ fontFamily: 'Oswald, sans-serif', color: 'white', textAlign: 'center', marginBottom: '48px' }}
        >
          Why <span className="underline-reveal" style={{ color: COLORS.accent, fontStyle: 'italic' }}>Choose Us</span>
        </h2>

        {/* Animated Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
          marginBottom: '60px',
          textAlign: 'center'
        }} className="grid-responsive-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="gradient-border-animated hover-lift"
              style={{
                padding: '32px 20px',
                animationDelay: `${i * 0.1}s`
              }}
            >
              <div style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: '48px',
                fontWeight: 700,
                color: COLORS.accent,
                marginBottom: '8px'
              }}>
                <AnimatedCounter end={stat.number} suffix={stat.suffix} />
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid-responsive-6 stagger-children">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="feature-card-animated"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)'
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.borderColor = `${COLORS.accent}30`
                  e.currentTarget.style.boxShadow = `0 15px 30px rgba(0,0,0,0.3), 0 0 20px ${COLORS.accent}20`
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div className="breathing" style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 16px',
                  backgroundColor: `${COLORS.accent}15`,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <Icon size={28} color={COLORS.accent} strokeWidth={1.5} />
                </div>
                <p style={{ color: 'white', fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>{f.title}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// PORTFOLIO SECTION
// ============================================
function PortfolioSection() {
  const [activeSlide, setActiveSlide] = useState(0)

  const portfolioSlides = [
    {
      left: { label: 'Interior Design', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=500&fit=crop' },
      right: { label: 'Construction', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=500&fit=crop' }
    },
    {
      left: { label: 'Living Room', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=500&fit=crop' },
      right: { label: 'Villa Exterior', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=500&fit=crop' }
    },
    {
      left: { label: 'Kitchen Design', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=500&fit=crop' },
      right: { label: 'Modern Home', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=500&fit=crop' }
    },
    {
      left: { label: 'Bedroom', image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=500&fit=crop' },
      right: { label: 'Commercial', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=500&fit=crop' }
    },
    {
      left: { label: 'Renovation', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=500&fit=crop' },
      right: { label: 'Luxury Home', image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=500&fit=crop' }
    }
  ]

  const currentSlide = portfolioSlides[activeSlide]

  return (
    <section style={{ backgroundColor: COLORS.dark, padding: '48px 16px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Beige Container */}
        <div className="beige-container">
          {/* Header */}
          <h2 className="heading-xl" style={{ fontFamily: 'Oswald, sans-serif', color: COLORS.dark, fontStyle: 'italic', marginBottom: '32px' }}>
            Portfolio
          </h2>

          {/* Images Grid */}
          <div className="grid-responsive-2" style={{ gap: '24px' }}>
            {/* Left Image */}
            <div style={{ transition: 'opacity 0.3s ease' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: 'white',
                  color: COLORS.dark,
                  padding: '8px 24px',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {currentSlide.left.label}
                </span>
              </div>
              <div style={{
                aspectRatio: '6/5',
                borderRadius: '20px 100px 20px 100px',
                overflow: 'hidden'
              }}>
                <img
                  src={currentSlide.left.image}
                  alt={currentSlide.left.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                />
              </div>
            </div>

            {/* Right Image */}
            <div style={{ transition: 'opacity 0.3s ease' }}>
              <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: 'white',
                  color: COLORS.dark,
                  padding: '8px 24px',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  {currentSlide.right.label}
                </span>
              </div>
              <div style={{
                aspectRatio: '6/5',
                borderRadius: '100px 20px 100px 20px',
                overflow: 'hidden'
              }}>
                <img
                  src={currentSlide.right.image}
                  alt={currentSlide.right.label}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '32px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {portfolioSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={i === activeSlide ? 'nav-dot nav-dot-active' : 'nav-dot nav-dot-inactive'}
                />
              ))}
            </div>
            <Link to="/construction" style={{ textDecoration: 'none' }}>
              <button className="view-all-btn">
                View All Projects <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// TESTIMONIALS SECTION
// ============================================
function TestimonialsSection() {
  const [videoRef, videoRevealed] = useScrollReveal()
  const [cardsRef, cardsRevealed] = useScrollReveal()

  const testimonials = [
    { name: 'Rahul Sharma', role: 'Homeowner', text: 'HOH108 transformed our 3BHK into a stunning modern home. Their attention to detail and quality of work exceeded our expectations. Highly recommend!', rating: 5 },
    { name: 'Prathima Mysore', role: 'Business Owner', text: 'Professional team that delivered our office interior on time and within budget. The design perfectly reflects our brand identity. Excellent service!', rating: 5 },
  ]

  return (
    <section className="section-padding morph-bg" style={{ backgroundColor: COLORS.dark }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '48px' }}>
          <p className="blur-in" style={{ color: COLORS.accent, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Client Testimonials</p>
          <h2 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '28px', color: 'white' }}>
            What Our Clients Say About<br />
            <span className="glow-text" style={{ color: COLORS.accent, fontStyle: 'italic' }}>Working with Us</span>
          </h2>
        </div>

        <div className="grid-responsive-2" style={{ gap: '32px' }}>
          {/* Video */}
          <div
            ref={videoRef}
            className={`scroll-reveal-scale ${videoRevealed ? 'revealed' : ''}`}
            style={{ position: 'relative' }}
          >
            <TiltCard style={{
              aspectRatio: '16/9',
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <img
                src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=450&fit=crop"
                alt="Client testimonial"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div
                  className="breathing neon-pulse"
                  style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: COLORS.accent,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    transform: 'scale(1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)'
                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(197,156,130,0.5)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Play size={32} color={COLORS.dark} fill={COLORS.dark} />
                </div>
              </div>
            </TiltCard>
            {/* Rating Badge */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.dark }}>4.9</span>
                <div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} color="#fbbf24" fill="#fbbf24" />)}
                  </div>
                  <span style={{ fontSize: '11px', color: '#666' }}>Average Rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div
            ref={cardsRef}
            className={`scroll-reveal-right ${cardsRevealed ? 'revealed' : ''} stagger-children`}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            {testimonials.map((t, i) => (
              <TiltCard
                key={i}
                className="hover-lift"
                style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px' }}
              >
                <p style={{ color: '#666', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="breathing" style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: 'rgba(201,168,141,0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: COLORS.accent, fontWeight: 500 }}>{t.name[0]}</span>
                    </div>
                    <div>
                      <p style={{ color: COLORS.dark, fontWeight: 500, fontSize: '14px' }}>{t.name}</p>
                      <p style={{ color: '#666', fontSize: '12px' }}>{t.role}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(t.rating)].map((_, idx) => (
                      <Star
                        key={idx}
                        size={14}
                        color="#fbbf24"
                        fill="#fbbf24"
                        className="wave-animation"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// CTA SECTION
// ============================================
function CTASection() {
  const [sectionRef, sectionRevealed] = useScrollReveal()

  return (
    <section style={{ backgroundColor: COLORS.dark, padding: '48px 16px', position: 'relative', overflow: 'hidden' }}>
      {/* Floating decorative elements */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '5%',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        border: `1px solid ${COLORS.accent}20`,
        animation: 'rotateSlow 20s linear infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '8%',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: `${COLORS.accent}10`,
        animation: 'breathing 4s ease-in-out infinite'
      }} />

      <div ref={sectionRef} style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <TiltCard
          className={`beige-container scroll-reveal-scale ${sectionRevealed ? 'revealed' : ''}`}
          style={{ textAlign: 'center' }}
        >
          <h2 className="heading-xl" style={{ fontFamily: 'Oswald, sans-serif', color: COLORS.dark, marginBottom: '16px' }}>
            Let's Build Your <span style={{ fontStyle: 'italic' }}>Dream Space</span>
          </h2>
          <p style={{ color: 'rgba(17,17,17,0.7)', marginBottom: '32px' }}>
            From concept to completion, we create meaningful spaces.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/about" style={{ textDecoration: 'none' }}>
              <MagneticButton
                className="elastic-scale"
                style={{
                  border: `2px solid ${COLORS.dark}`,
                  backgroundColor: 'transparent',
                  color: COLORS.dark,
                  padding: '14px 32px',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View Services
              </MagneticButton>
            </Link>
            <Link to="/contact-us" style={{ textDecoration: 'none' }}>
              <MagneticButton
                className="elastic-scale"
                style={{
                  backgroundColor: COLORS.dark,
                  color: 'white',
                  padding: '14px 32px',
                  borderRadius: '50px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                Book Consultation
              </MagneticButton>
            </Link>
          </div>
        </TiltCard>
      </div>
    </section>
  )
}


// ============================================
// SPLASH SCREEN
// ============================================
function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState(1) // 1: Logo reveal, 2: Animation, 3: Exit
  const onCompleteRef = useRef(onComplete)

  // Keep the ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 40)

    // Phase transitions
    const phase2Timer = setTimeout(() => setPhase(2), 800)
    const phase3Timer = setTimeout(() => setPhase(3), 2800)
    const completeTimer = setTimeout(() => {
      onCompleteRef.current?.()
    }, 3500)

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
      backgroundColor: COLORS.dark,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      opacity: phase === 3 ? 0 : 1,
      transition: 'opacity 0.7s ease-out'
    }}>
      {/* Animated Background Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        backgroundImage: `
          linear-gradient(${COLORS.accent} 1px, transparent 1px),
          linear-gradient(90deg, ${COLORS.accent} 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite'
      }} />

      {/* Floating Blueprint Lines */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${150 + i * 50}px`,
            height: '2px',
            background: `linear-gradient(90deg, transparent, ${COLORS.accent}40, transparent)`,
            top: `${10 + i * 12}%`,
            left: '-200px',
            animation: `blueprintLine ${3 + i * 0.3}s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
            opacity: 0.6
          }}
        />
      ))}

      {/* Rotating Design Elements */}
      <div style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        border: `1px dashed ${COLORS.accent}20`,
        borderRadius: '50%',
        animation: 'rotateSlow 30s linear infinite'
      }} />
      <div style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        border: `1px solid ${COLORS.accent}15`,
        borderRadius: '50%',
        animation: 'rotateSlow 25s linear infinite reverse'
      }} />
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        border: `1px dashed ${COLORS.accent}10`,
        borderRadius: '50%',
        animation: 'rotateSlow 35s linear infinite'
      }} />

      {/* Corner Design Elements */}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner, i) => (
        <div
          key={corner}
          style={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            [corner.includes('top') ? 'top' : 'bottom']: '40px',
            [corner.includes('left') ? 'left' : 'right']: '40px',
            borderTop: corner.includes('top') ? `2px solid ${COLORS.accent}40` : 'none',
            borderBottom: corner.includes('bottom') ? `2px solid ${COLORS.accent}40` : 'none',
            borderLeft: corner.includes('left') ? `2px solid ${COLORS.accent}40` : 'none',
            borderRight: corner.includes('right') ? `2px solid ${COLORS.accent}40` : 'none',
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'scale(1)' : 'scale(0.5)',
            transition: 'all 0.6s ease-out',
            transitionDelay: `${i * 0.1}s`
          }}
        />
      ))}

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        zIndex: 10
      }}>
        {/* Logo Container with Glow */}
        <div style={{
          position: 'relative',
          transform: phase >= 1 ? 'scale(1)' : 'scale(0.8)',
          opacity: phase >= 1 ? 1 : 0,
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          {/* Glow Effect */}
          <div style={{
            position: 'absolute',
            inset: '-40px',
            background: `radial-gradient(circle, ${COLORS.accent}30 0%, transparent 70%)`,
            animation: 'pulseGlow 2s ease-in-out infinite',
            borderRadius: '50%'
          }} />

          {/* Logo */}
          <div style={{
            width: '180px',
            height: '180px',
            backgroundColor: COLORS.accent,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '30px',
            boxShadow: `0 0 60px ${COLORS.accent}50`,
            animation: 'logoFloat 3s ease-in-out infinite'
          }}>
            <img
              src="/Logo.png"
              alt="HOH108"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'brightness(0) saturate(100%)'
              }}
            />
          </div>

          {/* Orbiting Icons */}
          {[Paintbrush, HardHat, Hammer, Sofa, Building2].map((Icon, i) => {
            const angle = (i * 72 - 90) * (Math.PI / 180)
            const radius = 140
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  transform: 'translate(-50%, -50%)',
                  width: '45px',
                  height: '45px',
                  backgroundColor: COLORS.card,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${COLORS.accent}50`,
                  opacity: phase >= 2 ? 1 : 0,
                  animation: phase >= 2 ? `iconPop 0.5s ease-out forwards` : 'none',
                  animationDelay: `${i * 0.1}s`
                }}
              >
                <Icon size={20} color={COLORS.accent} />
              </div>
            )
          })}
        </div>

        {/* Brand Text */}
        <div style={{
          textAlign: 'center',
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out',
          transitionDelay: '0.3s'
        }}>
          <h1 style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: '42px',
            color: 'white',
            marginBottom: '8px',
            letterSpacing: '4px'
          }}>
            HOUSE OF HANCET
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px'
          }}>
            <div style={{ width: '60px', height: '1px', backgroundColor: COLORS.accent }} />
            <span style={{
              color: COLORS.accent,
              fontSize: '18px',
              letterSpacing: '6px',
              fontWeight: 300
            }}>
              108
            </span>
            <div style={{ width: '60px', height: '1px', backgroundColor: COLORS.accent }} />
          </div>
          <p style={{
            color: COLORS.textMuted,
            fontSize: '14px',
            marginTop: '16px',
            letterSpacing: '3px',
            textTransform: 'uppercase'
          }}>
            Where Vision Meets Home
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '200px',
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
          transitionDelay: '0.5s'
        }}>
          <div style={{
            height: '3px',
            backgroundColor: `${COLORS.accent}20`,
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: COLORS.accent,
              borderRadius: '10px',
              transition: 'width 0.1s ease-out',
              boxShadow: `0 0 10px ${COLORS.accent}`
            }} />
          </div>
          <p style={{
            color: COLORS.textMuted,
            fontSize: '12px',
            textAlign: 'center',
            marginTop: '12px'
          }}>
            {progress < 100 ? 'Crafting your experience...' : 'Welcome'}
          </p>
        </div>
      </div>

      {/* Splash Screen Animations */}
      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes blueprintLine {
          0% { left: -200px; opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { left: 110%; opacity: 0; }
        }
        @keyframes rotateSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes iconPop {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ============================================
// MAIN APP
// ============================================
function App() {
  const [isAILightboxOpen, setIsAILightboxOpen] = useState(false)
  const [isSpinWheelOpen, setIsSpinWheelOpen] = useState(false)
  // Initialize showSplash based on sessionStorage - only show if NOT already shown
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown')
  })

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('splashShown', 'true')
    setShowSplash(false)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark }}>
      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Header />
      <main>
        <HeroSection />
        <WhoWeAreSection />
        <VerticalsSection />
        <ServicesSection />
        <CostCalculator />
        <WhyChooseUsSection />
        <PortfolioSection />
        <TestimonialsSection />
        <CTASection />
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
