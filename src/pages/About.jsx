import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Paintbrush,
  Hammer,
  HardHat,
  ArrowRight,
  Eye,
  Target,
  Award,
  MapPin,
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { COLORS, API_BASE } from '../constants/colors'

// ============================================
// ANIMATED COUNTER HOOK
// ============================================
function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = Date.now()
          const numericTarget = parseInt(target)
          const step = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * numericTarget))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

// ============================================
// SECTION PILL COMPONENT
// ============================================
function SectionPill({ label }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '6px 20px',
      border: `1px solid ${COLORS.border}`,
      borderRadius: '50px',
      fontSize: '11px',
      fontFamily: 'Oswald, sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      color: COLORS.textMuted,
      marginBottom: '20px',
    }}>
      {label}
    </span>
  )
}

// ============================================
// HERO SECTION (Home Page Style — rounded box with gaps)
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
          minHeight: '500px',
        }}>
          {/* Background Image */}
          <img
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&h=1080&fit=crop"
            alt="About HOH108"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          {/* Overlays */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0.55)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,17,17,0.5) 0%, transparent 60%)' }} />

          {/* Content — Center Aligned */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            padding: 'clamp(48px, 8vw, 80px) clamp(32px, 6vw, 64px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            minHeight: '500px',
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.15)',
              marginBottom: '24px',
              fontFamily: "'Raleway', sans-serif",
            }}>
              About Us
            </span>

            <h1 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 300,
              color: '#ffffff',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              marginBottom: '24px',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}>
              Building Dreams.<br />
              <span style={{ color: COLORS.accent, fontWeight: 500 }}>Designing Lives.</span>
            </h1>

            <p style={{
              fontFamily: "'Raleway', sans-serif",
              color: 'rgba(255,255,255,0.65)',
              fontSize: 'clamp(14px, 1.5vw, 17px)',
              lineHeight: 1.8,
              maxWidth: '600px',
              marginBottom: '32px',
            }}>
              HOH108 is a full-service construction and interior design company. We build your home from the ground up and design every space inside it — one team, one vision, one company.
            </p>

            <Link
              to="/contact-us"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: COLORS.accent,
                color: '#ffffff',
                padding: '14px 32px',
                borderRadius: '9999px',
                fontWeight: 500,
                fontSize: '13px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                fontFamily: "'Raleway', sans-serif",
              }}
            >
              Get In Touch
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// OUR STORY SECTION (Bento Layout — heading + cards)
// ============================================
function OurStorySection() {
  const cards = [
    {
      icon: Building2,
      title: 'Construction + Interiors',
      desc: 'HOH108 does both — we build homes from the ground up and design every room inside. No separate contractors needed.',
      bg: COLORS.canvas,
      text: COLORS.textDark,
      descColor: COLORS.stone,
      iconBg: 'rgba(197,156,130,0.2)',
      iconColor: '#111',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
    },
    {
      icon: Award,
      title: 'Precision & Quality',
      desc: 'Every project we undertake is a reflection of our commitment to excellence, transparency, and the belief that great spaces transform lives.',
      bg: '#111111',
      text: '#fff',
      descColor: 'rgba(255,255,255,0.6)',
      iconBg: 'rgba(197,156,130,0.15)',
      iconColor: COLORS.accent,
    },
    {
      icon: MapPin,
      title: 'One Company, Complete Solutions',
      desc: 'Construction, interior design, and renovation — all handled by HOH108. Based in Bangalore & Mysore.',
      bg: COLORS.accent,
      text: '#111',
      descColor: 'rgba(17,17,17,0.7)',
      iconBg: 'rgba(17,17,17,0.12)',
      iconColor: '#111',
    },
  ]

  return (
    <section style={{
      backgroundColor: COLORS.white,
      padding: 'clamp(64px, 10vw, 120px) clamp(16px, 4vw, 80px)',
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Top Row — Heading left + Description right */}
        <div className="about-story-header" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(32px, 5vw, 64px)',
          alignItems: 'start',
          marginBottom: 'clamp(40px, 6vw, 56px)',
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
              color: COLORS.textDark,
              lineHeight: 1.15,
              fontWeight: 700,
            }}>
              A Legacy of{' '}
              <span style={{ color: COLORS.accent }}>Craftsmanship</span>
            </h2>
            <Link
              to="/contact-us"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '24px',
                padding: '12px 28px',
                borderRadius: '50px',
                border: `1px solid ${COLORS.border}`,
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: "'Raleway', sans-serif",
                color: COLORS.textDark,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Explore now
            </Link>
          </div>

          <p style={{
            fontFamily: "'Raleway', sans-serif",
            color: COLORS.stone,
            fontSize: '15px',
            lineHeight: 1.8,
            paddingTop: '8px',
          }}>
            HOH108 is both a construction company and an interior design firm.
            We handle everything — from laying the foundation of your home to
            designing the living room inside it. One company, complete control.
          </p>
        </div>

        {/* Scrolling Cards Marquee */}
        <div className="about-story-marquee-wrap" style={{ overflow: 'hidden', margin: '0 -clamp(16px, 4vw, 80px)' }}>
          <div
            className="about-story-marquee"
            style={{
              display: 'flex',
              gap: '20px',
              width: 'max-content',
              padding: '0 20px',
            }}
          >
            {/* Duplicate cards for seamless loop */}
            {[...cards, ...cards].map((card, i) => {
              const idx = i % cards.length
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: card.bg,
                    borderRadius: '24px',
                    padding: '36px 32px',
                    width: '380px',
                    minHeight: '320px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    overflow: 'hidden',
                    border: idx === 0 ? `1px solid ${COLORS.border}` : 'none',
                    transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s cubic-bezier(0.16,1,0.3,1)',
                    cursor: 'default',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 24px 56px rgba(0,0,0,0.15)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Watermark number */}
                  <div style={{
                    position: 'absolute',
                    top: '-16px',
                    right: '8px',
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '120px',
                    fontWeight: 700,
                    color: idx === 1 ? 'rgba(255,255,255,0.04)' : idx === 2 ? 'rgba(17,17,17,0.06)' : 'rgba(0,0,0,0.04)',
                    lineHeight: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  {/* Background image */}
                  {card.image && (
                    <img
                      src={card.image}
                      alt={card.title}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.12,
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: '52px',
                    height: '52px',
                    backgroundColor: card.iconBg,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    <card.icon size={22} color={card.iconColor} strokeWidth={1.5} />
                  </div>

                  <h3 style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    color: card.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '12px',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {card.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Raleway', sans-serif",
                    color: card.descColor,
                    fontSize: '14px',
                    lineHeight: 1.7,
                    margin: 0,
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    {card.desc}
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
// SERVICES & CAPABILITIES SECTION (Dark + Image Cards)
// ============================================
function ServicesSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const isPaused = useRef(false)
  const timerRef = useRef(null)
  const sectionRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

  const services = [
    {
      icon: Paintbrush,
      label: 'Interior Design',
      title: 'Interior Design',
      description: 'Expert material selection, modular kitchens, wardrobes, full-home interiors, and premium finishes tailored to your style.',
      image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=900&fit=crop',
      link: '/interior',
    },
    {
      icon: HardHat,
      label: 'Construction',
      title: 'Construction',
      description: 'Ground-up homes, structural works, and complete civil execution with precision engineering and quality materials.',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=900&fit=crop',
      link: '/construction',
    },
    {
      icon: Hammer,
      label: 'Renovation',
      title: 'Renovation',
      description: 'Upgrades, re-designs, home makeovers, and structural & aesthetic renovation that breathes new life into spaces.',
      image: 'https://images.unsplash.com/photo-1585128792020-803d29415281?w=800&h=900&fit=crop',
      link: '/renovation',
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target) } },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    const tick = () => {
      timerRef.current = setTimeout(() => {
        if (!isPaused.current) setActiveIndex((prev) => (prev + 1) % services.length)
        tick()
      }, 4000)
    }
    tick()
    return () => clearTimeout(timerRef.current)
  }, [isVisible, services.length])

  const handleMouseEnter = useCallback((i) => { isPaused.current = true; setActiveIndex(i) }, [])
  const handleMouseLeave = useCallback(() => { isPaused.current = false }, [])

  return (
    <section style={{ backgroundColor: COLORS.canvas, padding: 'clamp(64px, 10vw, 120px) 0', overflow: 'hidden' }}>
      <div ref={sectionRef} style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 56px)' }}>
          <SectionPill label="What We Do" />
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 700,
            color: COLORS.textDark,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            marginBottom: '16px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: `all 0.8s ${EASE}`,
          }}>
            Services & <span style={{ color: COLORS.accent }}>Capabilities</span>
          </h2>
          <p style={{
            fontFamily: "'Raleway', sans-serif",
            color: COLORS.stone,
            maxWidth: '600px',
            margin: '0 auto',
            fontSize: '15px',
            lineHeight: 1.7,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
            transition: `all 0.8s 0.1s ${EASE}`,
          }}>
            Expert material selection, in-house execution, on-time delivery, and transparent budgeting.
          </p>
        </div>

        {/* Bento Cards — same as home page */}
        <div
          className="services-bento-grid"
          style={{
            display: 'flex',
            gap: 'clamp(10px, 1.2vw, 16px)',
            height: 'clamp(400px, 42vw, 520px)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
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
                <img src={s.image} alt={s.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: isActive ? 'scale(1.05)' : 'scale(1)', transition: `transform 4s ${EASE}` }} />
                <div style={{ position: 'absolute', inset: 0, background: isActive ? 'linear-gradient(to top, rgba(17,17,17,0.85) 0%, rgba(17,17,17,0.3) 50%, rgba(17,17,17,0.1) 100%)' : 'rgba(17,17,17,0.5)', transition: `all 0.7s ${EASE}` }} />

                {/* Watermark */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: isActive ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0.8)', fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(60px, 10vw, 140px)', fontWeight: 700, color: 'rgba(255,255,255,0.06)', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '8px', pointerEvents: 'none', userSelect: 'none', opacity: isActive ? 1 : 0, transition: `opacity 0.7s ${EASE}, transform 0.7s ${EASE}` }}>
                  {s.label}
                </div>

                {/* Collapsed */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', opacity: isActive ? 0 : 1, pointerEvents: isActive ? 'none' : 'auto', transition: `opacity 0.5s ${EASE}` }}>
                  <div style={{ width: '48px', height: '48px', backgroundColor: 'rgba(17,17,17,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', flexShrink: 0 }}>
                    <Icon size={20} color="#fff" strokeWidth={1.5} />
                  </div>
                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '13px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '3px', writingMode: 'vertical-lr', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </div>

                {/* Expanded */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(24px, 3vw, 40px)', opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(24px)', pointerEvents: isActive ? 'auto' : 'none', transition: `opacity 0.6s 0.2s ${EASE}, transform 0.6s 0.2s ${EASE}` }}>
                  <div style={{ width: '52px', height: '52px', backgroundColor: 'rgba(17,17,17,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', marginBottom: '20px' }}>
                    <Icon size={22} color="#fff" strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                    {s.title}
                  </h3>
                  <p style={{ fontFamily: "'Raleway', sans-serif", color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(13px, 1.2vw, 15px)', lineHeight: 1.7, maxWidth: '520px', marginBottom: '24px' }}>
                    {s.description}
                  </p>
                  <Link to={s.link} onClick={(e) => e.stopPropagation()} className="services-cta-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', borderRadius: '50px', fontWeight: 700, fontFamily: "'Raleway', sans-serif", fontSize: '13px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(15,23,42,0.1)' }}>
                    Learn More
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
// STATS SECTION
// ============================================
function StatsSection() {
  const stats = [
    { value: '500', suffix: '+', label: 'Projects Completed' },
    { value: '15', suffix: '+', label: 'Years Experience' },
    { value: '98', suffix: '%', label: 'Client Satisfaction' },
    { value: '50', suffix: '+', label: 'Team Members' },
  ]

  return (
    <section style={{
      backgroundColor: COLORS.canvas,
      padding: `clamp(64px, 10vw, 100px) clamp(16px, 4vw, 80px)`,
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
        }}>
          {stats.map((stat, i) => {
            const { count, ref } = useCounter(stat.value)
            return (
              <div
                key={i}
                ref={ref}
                style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                }}
              >
                <div style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  fontWeight: 700,
                  color: COLORS.accent,
                  lineHeight: 1,
                  marginBottom: '12px',
                }}>
                  {count}{stat.suffix}
                </div>
                <div style={{
                  fontFamily: 'Raleway, sans-serif',
                  fontSize: '14px',
                  color: COLORS.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                }}>
                  {stat.label}
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
// MISSION & VISION SECTION
// ============================================
function MissionVisionSection() {
  const [hoveredCard, setHoveredCard] = useState(null)

  const cards = [
    {
      icon: Target,
      title: 'Our Mission',
      text: 'To be the single company homeowners trust for both building their home and designing its interiors — delivering end-to-end with meticulous craftsmanship, transparent pricing, and on-time delivery.',
    },
    {
      icon: Eye,
      title: 'Our Vision',
      text: 'To become India\'s most trusted construction and interior design company — where homeowners get their entire home built and designed by one expert team, with zero compromise on quality.',
    },
  ]

  return (
    <section style={{
      backgroundColor: COLORS.white,
      padding: `clamp(64px, 10vw, 120px) clamp(16px, 4vw, 80px)`,
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
          <SectionPill label="What Drives Us" />
          <h2 style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            color: COLORS.textDark,
            textTransform: 'uppercase',
            lineHeight: 1.2,
          }}>
            Mission & <span style={{ color: COLORS.accent }}>Vision</span>
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          gap: '24px',
        }}>
          {cards.map((card, i) => {
            const Icon = card.icon
            const isHovered = hoveredCard === i
            const isDark = i === 0
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: isDark ? '#111111' : COLORS.accent,
                  borderRadius: '20px',
                  padding: '48px 36px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isHovered
                    ? '0 24px 48px rgba(0,0,0,0.15)'
                    : '0 4px 16px rgba(0,0,0,0.06)',
                  transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'default',
                }}
              >
                {/* Large watermark number */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-10px',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 'clamp(100px, 12vw, 160px)',
                  fontWeight: 700,
                  color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(17,17,17,0.06)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}>
                  {i === 0 ? '01' : '02'}
                </div>

                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: isDark ? 'rgba(197,156,130,0.15)' : 'rgba(17,17,17,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '28px',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  <Icon size={26} color={isDark ? COLORS.accent : '#111'} strokeWidth={1.5} />
                </div>
                <h3 style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '24px',
                  color: isDark ? '#fff' : '#111',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {card.title}
                </h3>
                <p style={{
                  fontFamily: "'Raleway', sans-serif",
                  color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(17,17,17,0.7)',
                  fontSize: '15px',
                  lineHeight: 1.8,
                  position: 'relative',
                  zIndex: 1,
                }}>
                  {card.text}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ============================================
// CTA SECTION
// ============================================
function CTASection() {
  return (
    <section style={{ padding: 'clamp(32px, 5vw, 64px) 0' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 80px)' }}>
        <div style={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Background Image */}
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=800&fit=crop"
            alt="Start your project"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0.75)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,17,17,0.4) 0%, transparent 60%)' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(48px, 8vw, 80px) clamp(24px, 4vw, 60px)', maxWidth: '700px' }}>
            <span style={{
              display: 'inline-block',
              padding: '6px 20px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50px',
              fontSize: '11px',
              fontFamily: "'Raleway', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '28px',
            }}>
              Get Started
            </span>

            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              color: '#fff',
              textTransform: 'uppercase',
              lineHeight: 1.2,
              marginBottom: '20px',
              textShadow: '0 2px 16px rgba(0,0,0,0.4)',
            }}>
              Start Your <span style={{ color: COLORS.accent }}>Project</span>
            </h2>

            <p style={{
              fontFamily: "'Raleway', sans-serif",
              color: 'rgba(255,255,255,0.65)',
              fontSize: '16px',
              lineHeight: 1.8,
              marginBottom: '40px',
              maxWidth: '500px',
              margin: '0 auto 40px',
            }}>
              Whether you need construction, interior design, or renovation — HOH108 handles it all. Let's build your dream home together.
            </p>

            <Link to="/contact-us" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  backgroundColor: COLORS.accent,
                  color: '#fff',
                  padding: '16px 40px',
                  borderRadius: '50px',
                  border: 'none',
                  fontFamily: "'Raleway', sans-serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.accentDark
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(197,156,130,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.accent
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Get in Touch
                <ArrowRight size={16} />
              </button>
            </Link>
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
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.white }}>
      <Header />
      <main>
        <HeroSection />
        <OurStorySection />
        <ServicesSection />
        <StatsSection />
        <MissionVisionSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default About
