import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Linkedin,
  ArrowRight,
  ChevronRight,
  X,
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { COLORS } from '../constants/colors'

// Import team photos
import AbhijitPhoto from '../assets/Team/Abhijith(4).jpeg'
import ChandanPhoto from '../assets/Team/Chandan-Sharma(1).jpeg'
import EklavyaPhoto from '../assets/Team/Eklavyas(6).jpeg'
import KasthuriPhoto from '../assets/Team/Kasthuri(3).jpeg'
import SandarshPhoto from '../assets/Team/sandarsh(5).jpg'
import SiddhantPhoto from '../assets/Team/Siddhant-new.jpeg'
import SandeepPhoto from '../assets/Team/Sandeep(2).jpeg'
import RaghavendraPhoto from '../assets/Team/Raghavendra.jpeg'

// Team member data
const teamMembers = [
  {
    id: 1,
    name: "Chandan Sharma",
    role: "Director",
    image: ChandanPhoto,
    bio: "A visionary leader driving excellence in construction and interior design with a focus on quality and client satisfaction.",
    socials: { linkedin: "#" },
    isLeadership: true,
  },
  {
    id: 2,
    name: "Sandeep Selvam",
    role: "Group CEO",
    image: SandeepPhoto,
    bio: "As Group CEO, Sandeep brings extensive leadership experience across the interior design and construction industry. He oversees strategic growth, operational excellence, and client-focused delivery across all HOH108 verticals. With a strong background in business development and regional leadership, he has successfully scaled teams and operations across competitive markets. His approach balances strategic vision with hands-on execution — ensuring quality-driven outcomes at every level of the organization.",
    socials: { linkedin: "https://www.linkedin.com/in/sandeep-selvam-121252121" },
    isLeadership: true,
  },
  {
    id: 3,
    name: "Abhijit Honnati",
    role: "CEO",
    image: AbhijitPhoto,
    bio: "With over 15 years across interiors and construction, Abhijit leads HOH108 with a clear mandate — build a company where operational discipline meets creative ambition. His focus is on scaling the brand through innovation, client-centric delivery, and long-term value creation. Under his leadership, HOH108 has grown into a vertically integrated design-build practice serving clients across Karnataka.",
    socials: { linkedin: "https://www.linkedin.com/in/abhijit-honnatti-43062b1aa/" },
    isLeadership: false,
  },
  {
    id: 4,
    name: "Kasthuri N",
    role: "COO",
    image: KasthuriPhoto,
    bio: "Kasthuri brings deep expertise in operations, organizational development, and cross-functional team leadership. With a background spanning construction, real estate services, and education, she architects the internal systems that allow HOH108 to scale — connecting teams, streamlining workflows, and ensuring every project runs on time and on standard. She is the operational backbone that turns ambitious plans into consistent, repeatable outcomes.",
    socials: { linkedin: "https://www.linkedin.com/in/kasthuri-nandakumar-113153390" },
    isLeadership: false,
  },
  {
    id: 5,
    name: "Raghavendra",
    role: "CTO",
    image: RaghavendraPhoto,
    bio: "Raghavendra leads technology strategy and digital transformation at HOH108. With extensive experience in enterprise technology leadership, he oversees the development of proprietary tools — from AI-powered 3D visualization to real-time project tracking dashboards. His mandate is clear: use technology to eliminate friction, increase transparency, and give clients a digital-first experience from first consultation to final handover.",
    socials: { linkedin: "https://www.linkedin.com/in/raghavendra-krishnaprasad-3160871a/" },
    isLeadership: false,
  },
  {
    id: 6,
    name: "Eklavya Jain",
    role: "CFO",
    image: EklavyaPhoto,
    bio: "A Chartered Secretary by qualification with deep roots in the construction and development sector, Eklavya oversees all financial operations, compliance, and strategic resource allocation at HOH108. His disciplined approach to budgeting and cost management ensures that every project maintains its financial integrity — enabling transparent, open-book pricing that clients can trust at every stage.",
    socials: { linkedin: "https://linkedin.com/in/cseklavyajain" },
    isLeadership: false,
  },
  {
    id: 7,
    name: "Sandarsh Goyal",
    role: "CBO",
    image: SandarshPhoto,
    bio: "Sandarsh drives business development and strategic partnerships at HOH108. He is responsible for identifying growth opportunities, building client relationships, and expanding the company's footprint across new markets. His ability to connect commercial strategy with on-ground execution makes him instrumental in scaling operations while maintaining the service quality that defines the HOH108 brand.",
    socials: { linkedin: "https://www.linkedin.com/in/sandarsh-goyal-5035b0a7/" },
    isLeadership: false,
  },
  {
    id: 8,
    name: "Siddhant Jain",
    role: "CMO",
    image: SiddhantPhoto,
    bio: "Siddhant brings over 12 years of cross-functional experience across marketing, sales, and business development. Previously with AB InBev as Regional Trade Marketing Manager and currently a Director at Three Fourth Solutions — a leading integrated marketing agency — he leads HOH108's brand strategy, market positioning, and growth campaigns. His results-first approach and strong commercial acumen consistently deliver scalable, long-term outcomes.",
    socials: { linkedin: "https://www.linkedin.com/in/siddhantjain0990" },
    isLeadership: false,
  },
]

// ============================================
// SECTION PILL COMPONENT
// ============================================
function SectionPill({ label, light }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '6px 20px',
      border: `1px solid ${light ? 'rgba(255,255,255,0.15)' : COLORS.border}`,
      borderRadius: '50px',
      fontSize: '11px',
      fontFamily: 'Oswald, sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      color: light ? COLORS.accent : COLORS.textMuted,
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
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=1080&fit=crop"
            alt="Our Team"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
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
              Our People
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
              Meet Our <span style={{ color: COLORS.accent, fontWeight: 500 }}>Team</span>
            </h1>

            <p style={{
              fontFamily: "'Raleway', sans-serif",
              color: 'rgba(255,255,255,0.65)',
              fontSize: 'clamp(14px, 1.5vw, 17px)',
              lineHeight: 1.8,
              maxWidth: '600px',
              marginBottom: '32px',
            }}>
              Passionate professionals dedicated to transforming your vision into
              architectural masterpieces. Meet the experts behind every project.
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
              Join Our Team
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// TEAM CARD COMPONENT
// ============================================
function TeamCard({ member, onClick, large }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        backgroundColor: COLORS.white,
        borderRadius: '20px',
        overflow: 'hidden',
        border: `1px solid ${isHovered ? COLORS.borderHover : COLORS.border}`,
        boxShadow: isHovered
          ? '0 20px 40px rgba(0,0,0,0.1)'
          : '0 2px 8px rgba(0,0,0,0.03)',
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
      }}
    >
      {/* Image */}
      <div style={{
        width: '100%',
        aspectRatio: large ? '3/4' : '1/1',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <img
          src={member.image}
          alt={member.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            transition: 'transform 0.5s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.05))',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Content */}
      <div style={{ padding: large ? '28px 24px' : '20px 20px' }}>
        <h3 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: large ? '22px' : '18px',
          fontWeight: 600,
          color: COLORS.textDark,
          marginBottom: '4px',
          textTransform: 'uppercase',
        }}>
          {member.name}
        </h3>

        <p style={{
          fontFamily: 'Raleway, sans-serif',
          fontSize: '12px',
          color: COLORS.accent,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          marginBottom: '12px',
        }}>
          {member.role}
        </p>

        <p style={{
          fontFamily: 'Raleway, sans-serif',
          fontSize: '13px',
          color: COLORS.textMuted,
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: large ? 4 : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginBottom: '16px',
        }}>
          {member.bio}
        </p>

        {/* LinkedIn + View */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {member.socials.linkedin && member.socials.linkedin !== '#' ? (
            <a
              href={member.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: COLORS.textMuted,
                fontSize: '12px',
                fontFamily: 'Raleway, sans-serif',
                textDecoration: 'none',
                transition: 'color 0.3s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.accent }}
              onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.textMuted }}
            >
              <Linkedin size={14} />
              LinkedIn
            </a>
          ) : (
            <span />
          )}

          <span style={{
            fontSize: '12px',
            fontFamily: 'Raleway, sans-serif',
            color: isHovered ? COLORS.accent : COLORS.textMuted,
            fontWeight: 500,
            transition: 'color 0.3s ease',
          }}>
            View Profile
          </span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TEAM MEMBER MODAL
// ============================================
function TeamMemberModal({ member, onClose }) {
  if (!member) return null

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: COLORS.white,
          borderRadius: '24px',
          padding: '48px 40px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 32px 64px rgba(0,0,0,0.15)',
          animation: 'scaleIn 0.3s ease',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: COLORS.canvas,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: COLORS.textMuted,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.accent
            e.currentTarget.style.color = COLORS.white
            e.currentTarget.style.borderColor = COLORS.accent
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.canvas
            e.currentTarget.style.color = COLORS.textMuted
            e.currentTarget.style.borderColor = COLORS.border
          }}
        >
          <X size={18} />
        </button>

        {/* Profile Image */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '28px',
        }}>
          <div style={{
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `3px solid ${COLORS.accent}`,
          }}>
            <img
              src={member.image}
              alt={member.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
              }}
            />
          </div>
        </div>

        {/* Name */}
        <h3 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '28px',
          fontWeight: 600,
          color: COLORS.textDark,
          textAlign: 'center',
          marginBottom: '6px',
          textTransform: 'uppercase',
        }}>
          {member.name}
        </h3>

        {/* Role */}
        <p style={{
          fontFamily: 'Raleway, sans-serif',
          fontSize: '13px',
          color: COLORS.accent,
          textAlign: 'center',
          fontWeight: 600,
          marginBottom: '24px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          {member.role}
        </p>

        {/* Divider */}
        <div style={{
          width: '48px',
          height: '2px',
          backgroundColor: COLORS.accent,
          margin: '0 auto 24px',
        }} />

        {/* Full Bio */}
        <p style={{
          fontFamily: 'Raleway, sans-serif',
          fontSize: '15px',
          color: COLORS.textMuted,
          lineHeight: 1.8,
          marginBottom: '28px',
          textAlign: 'center',
        }}>
          {member.bio}
        </p>

        {/* LinkedIn */}
        {member.socials.linkedin && member.socials.linkedin !== '#' && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <a
              href={member.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 32px',
                backgroundColor: COLORS.accent,
                borderRadius: '50px',
                color: COLORS.white,
                fontFamily: 'Oswald, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accentDark
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.accent
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Linkedin size={16} />
              Connect on LinkedIn
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// ============================================
// ============================================
// TEAM SHOWCASE — Reference exact layout
// Left: counter + vertical text + stair-step thumbnails
// Center: tall narrow portrait
// Right: name + role + bio + next button
// ============================================
function TeamShowcase({ members, sectionLabel, title, titleAccent, subtitle, bg = COLORS.white }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const isPaused = useRef(false)
  const timerRef = useRef(null)

  // Fluid spring for the grow/shrink — the hero animation
  const cardSpring = { type: 'spring', stiffness: 180, damping: 26, mass: 0.8 }
  const textFade = { duration: 0.45, ease: [0.16, 1, 0.3, 1] }

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % members.length)
  }, [members.length])

  // Auto-cycle
  useEffect(() => {
    const tick = () => {
      timerRef.current = setTimeout(() => {
        if (!isPaused.current) goNext()
        tick()
      }, 5000)
    }
    tick()
    return () => clearTimeout(timerRef.current)
  }, [goNext])

  // Strip: hero on left (offset 0) → thumbnails stair-step right (offset +1,+2,+3)
  // When activeIndex increments, hero exits left, new card enters from right → scrolls RIGHT
  const getStrip = () => {
    const items = []
    for (let offset = 0; offset <= 3; offset++) {
      const idx = (activeIndex + offset + members.length) % members.length
      items.push({ member: members[idx], offset, idx })
    }
    return items
  }
  const strip = getStrip()
  const active = members[activeIndex]

  // Hero is tallest on left, thumbnails shrink going right
  const getDims = (offset) => {
    if (offset === 0) return { w: 220, h: 500, r: 12 }        // Hero — tall (left)
    if (offset === 1) return { w: 150, h: 260, r: 10 }        // Closest right
    if (offset === 2) return { w: 130, h: 190, r: 10 }        // Mid right
    if (offset === 3) return { w: 80, h: 130, r: 8 }          // Far right (smallest)
    return { w: 80, h: 120, r: 8 }
  }

  return (
    <section
      style={{ backgroundColor: bg, padding: 'clamp(64px, 10vw, 120px) 0', overflow: 'hidden' }}
      onMouseEnter={() => { isPaused.current = true }}
      onMouseLeave={() => { isPaused.current = false }}
    >
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 80px)', textAlign: 'center', marginBottom: 'clamp(48px, 7vw, 72px)' }}>
        <SectionPill label={sectionLabel} />
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: COLORS.textDark, textTransform: 'uppercase', lineHeight: 1.2, marginBottom: '16px' }}>
          {title} <span style={{ color: COLORS.accent }}>{titleAccent}</span>
        </h2>
        <p style={{ fontFamily: "'Raleway', sans-serif", color: COLORS.textMuted, fontSize: '15px', maxWidth: '550px', margin: '0 auto', lineHeight: 1.7 }}>
          {subtitle}
        </p>
      </div>

      {/*
        REFERENCE LAYOUT:
        ┌──────────────────────────────────────────────────────┐
        │  counter    │                        │  Name         │
        │  vertical   │                        │  Role         │
        │  text       │     HERO CARD          │  "Bio..."     │
        │             │     (tall)             │               │
        │  [t1][t2][t3]                        │               │
        └──────────────────────────────────────────────────────┘
                          [ > button ]
      */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 60px)' }}>
        <div className="team-showcase-wrap" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 240px 1fr',
          gap: '32px',
          minHeight: '540px',
        }}>

          {/* LEFT COLUMN: counter + vertical label (top) + thumbnails (bottom) */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '520px' }}>
            {/* Top: counter + vertical text */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '13px', color: COLORS.textMuted, letterSpacing: '2px', whiteSpace: 'nowrap' }}>
                {String(activeIndex + 1).padStart(2, '0')} / {String(members.length).padStart(2, '0')}
              </span>
              <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: '14px', fontWeight: 600, color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: '3px', writingMode: 'vertical-lr' }}>
                {sectionLabel}
              </span>
            </div>

            {/* Bottom: thumbnail row — bottom-aligned, stair-stepped */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              {strip.filter(s => s.offset > 0).reverse().map(({ member, offset, idx }) => {
                const thumbH = { 1: 160, 2: 130, 3: 100 }[offset] || 100
                return (
                  <motion.div
                    key={`thumb-${member.id}`}
                    layout
                    animate={{ height: thumbH, opacity: offset >= 3 ? 0.5 : 1 }}
                    transition={cardSpring}
                    onClick={() => setActiveIndex(idx)}
                    style={{
                      width: '110px',
                      flexShrink: 0,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      filter: `grayscale(${offset * 0.1})`,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    }}
                  >
                    <img src={member.image} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* CENTER COLUMN: Hero card — tall, bottom-aligned with thumbnails */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={cardSpring}
                style={{
                  width: '100%',
                  height: '520px',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
                }}
              >
                <img src={active.image} alt={active.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
                {/* Name bar at bottom */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
                }}>
                  <div style={{ width: '40px', height: '3px', backgroundColor: COLORS.accent, marginBottom: '8px', borderRadius: '2px' }} />
                  <p style={{ fontFamily: "'Oswald', sans-serif", fontSize: '14px', color: '#fff', fontWeight: 600, letterSpacing: '0.5px' }}>
                    {active.name}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN: Bio text — vertically centered */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ minHeight: '260px' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={textFade}
                >
                  <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '22px', fontWeight: 700, color: COLORS.textDark, marginBottom: '4px', textTransform: 'uppercase' }}>
                    {active.name}
                  </h3>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: '12px', color: COLORS.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px' }}>
                    {active.role}
                  </p>
                  <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: '15px', color: COLORS.textDark, lineHeight: 1.8, fontWeight: 500 }}>
                    "{active.bio}"
                  </p>
                  {active.socials?.linkedin && active.socials.linkedin !== '#' && (
                    <a href={active.socials.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', color: COLORS.accent, fontSize: '12px', fontWeight: 600, fontFamily: "'Raleway', sans-serif", textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <Linkedin size={14} /> LinkedIn
                    </a>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Next button — completely outside the grid, always fixed */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
          <motion.button
            onClick={goNext}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: COLORS.accent,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(197,156,130,0.4)',
            }}
          >
            <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .team-showcase-wrap {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </section>
  )
}

// ============================================
// LEADERSHIP SECTION (Directors)
// ============================================
// Combined — All team members in one showcase
function AllTeamSection() {
  return (
    <TeamShowcase
      members={teamMembers}
      sectionLabel="Our Team"
      title="The Experts Behind Every"
      titleAccent="Build"
      subtitle="Directors, engineers, designers, and strategists — our diverse team brings together decades of experience under one roof."
      bg={COLORS.white}
    />
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
          minHeight: '320px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=600&fit=crop" alt="Join our team" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0.7)' }} />

          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: 'clamp(40px, 6vw, 60px) clamp(24px, 4vw, 48px)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 20px', borderRadius: '9999px', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '20px', fontFamily: "'Raleway', sans-serif" }}>
              Careers
            </span>

            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 300, color: '#fff', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '16px', textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}>
              Join Our <span style={{ color: COLORS.accent, fontWeight: 500 }}>Growing Team</span>
            </h2>

            <p style={{ fontFamily: "'Raleway', sans-serif", color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 28px' }}>
              We're always looking for talented individuals who share our passion for excellence in construction and design.
            </p>

            <Link to="/contact-us" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              backgroundColor: COLORS.accent, color: '#fff',
              padding: '14px 32px', borderRadius: '9999px',
              fontWeight: 500, fontSize: '13px', letterSpacing: '0.04em',
              textTransform: 'uppercase', textDecoration: 'none',
              fontFamily: "'Raleway', sans-serif",
            }}>
              View Open Positions
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// MAIN TEAM PAGE
// ============================================
function Team() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.white }}>
      <Header />
      <main>
        <HeroSection />
        <AllTeamSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default Team
