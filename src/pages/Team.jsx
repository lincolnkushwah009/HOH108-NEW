import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import {
  Linkedin,
  ArrowRight,
  Users,
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
import SiddhantPhoto from '../assets/Team/Siddhant(7).png'
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
    socials: {
      linkedin: "#",
    }
  },
  {
    id: 2,
    name: "Sandeep Selvam",
    role: "Director",
    image: SandeepPhoto,
    bio: "Sandeep Selvam is a seasoned business leader with strong experience in the interior design and construction industry. As Director at Interior Plus, he plays a key role in driving strategic growth, operational excellence, and client-focused delivery. With a background in business development and regional leadership, he has successfully led teams and scaled operations across competitive markets. His career reflects a balance of strategic vision and hands-on execution, ensuring quality-driven outcomes. Based in Bengaluru, he continues to contribute to the evolving interiors and real estate ecosystem with a results-oriented and people-first approach.",
    socials: {
      linkedin: "https://www.linkedin.com/in/sandeep-selvam-121252121",
    }
  },
  {
    id: 3,
    name: "Abhijit Honnati",
    role: "CEO",
    image: AbhijitPhoto,
    bio: "As the CEO of House of Hancet 108, Abhijit Honnatti brings over 15 years of experience across interiors and construction. His leadership combines strategic foresight with a strong belief in team-driven execution. He is focused on transforming House of Hancet 108 into a category-leading brand built on innovation, operational excellence, and long-term value creation for clients and investors.",
    socials: {
      linkedin: "https://www.linkedin.com/in/abhijit-honnatti-43062b1aa/",
    }
  },
  {
    id: 4,
    name: "Kasthuri N",
    role: "COO",
    image: KasthuriPhoto,
    bio: "I bring seasoned leadership in operations and organizational development to House of Hancet—building teams that thrive and systems that actually work. With deep roots in construction and development, I bring invaluable industry insight alongside experience in the realty services industry, transforming Kumon Education Pvt Ltd through strategic team development, and leading marketing initiatives across diverse sectors. I'm passionate about empowering people, untangling complexity, and turning ambitious visions into everyday reality. At House of Hancet, I create the infrastructure that lets us scale without the chaos—connecting teams, and keeping things running beautifully.",
    socials: {
      linkedin: "https://www.linkedin.com/in/kasthuri-nandakumar-113153390",
    }
  },
  {
    id: 5,
    name: "Raghavendra",
    role: "CTO",
    image: RaghavendraPhoto,
    bio: "As the Chief Technology Officer at House of Hancet 108, Raghavendra leads the technology strategy and digital transformation initiatives. With extensive experience in technology leadership, he drives innovation and ensures the seamless integration of cutting-edge solutions across all business verticals.",
    socials: {
      linkedin: "https://www.linkedin.com/in/raghavendra-krishnaprasad-3160871a/",
    }
  },
  {
    id: 6,
    name: "Eklavya Jain",
    role: "CFO",
    image: EklavyaPhoto,
    bio: "With deep roots in construction and development, I bring invaluable industry insight alongside experience in the realty services industry, transforming Kumon Education Pvt Ltd through strategic team development, and leading marketing initiatives across diverse sectors. I'm passionate about empowering people, untangling complexity, and turning ambitious visions into everyday reality.",
    socials: {
      linkedin: "https://linkedin.com/in/cseklavyajain",
    }
  },
  {
    id: 7,
    name: "Sandarsh Goyal",
    role: "CBO",
    image: SandarshPhoto,
    bio: "At House of Hancet, I create the infrastructure that lets us scale without the chaos—connecting teams, and keeping things running beautifully.",
    socials: {
      linkedin: "https://www.linkedin.com/in/sandarsh-goyal-5035b0a7/",
    }
  },
  {
    id: 8,
    name: "Siddhant Jain",
    role: "CMO",
    image: SiddhantPhoto,
    bio: "As the CMO at House of Hancet, Siddhant brings over 12 years of cross-functional experience across marketing, sales, and business development, with a strong focus on growth through strategic resource optimisation. He has led impactful brand initiatives, trade programs, partnerships, and exhibitions that drive market presence and profitability. Known for his results-first approach and strong business communication, Siddhant consistently delivers scalable, long-term outcomes. He was previously with AB InBev as RTMM (East) and is also a Director at Three Fourth Solutions, a leading marketing agency in India.",
    socials: {
      linkedin: "https://www.linkedin.com/in/siddhantjain0990",
    }
  }
]

// ============================================
// FLOATING PARTICLES BACKGROUND
// ============================================
function FloatingParticles() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }))

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            backgroundColor: COLORS.accent,
            opacity: 0.15,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <section style={{
      position: 'relative',
      backgroundColor: COLORS.dark,
      paddingTop: '140px',
      paddingBottom: '80px',
      overflow: 'hidden',
    }}>
      <FloatingParticles />

      <motion.div
        style={{ y, opacity }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
        }}>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: 'clamp(36px, 7vw, 56px)',
              fontWeight: 700,
              marginBottom: '24px',
              lineHeight: 1.2,
              color: 'white',
            }}
          >
            Meet Our <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Team</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              color: COLORS.textMuted,
              fontSize: '16px',
              lineHeight: 1.7,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Passionate professionals dedicated to transforming your vision into
            architectural masterpieces. Meet the experts behind every project.
          </motion.p>
        </div>
      </motion.div>
    </section>
  )
}

// ============================================
// TEAM CARD COMPONENT
// ============================================
function TeamCard({ member, index, onClick }) {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        position: 'relative',
        backgroundColor: COLORS.card,
        borderRadius: '20px',
        padding: '32px 24px',
        cursor: 'pointer',
        overflow: 'hidden',
        border: `1px solid ${isHovered ? COLORS.accent + '40' : 'rgba(255,255,255,0.05)'}`,
        boxShadow: isHovered ? `0 25px 50px rgba(0,0,0,0.4)` : '0 4px 20px rgba(0,0,0,0.2)',
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '320px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Profile Image */}
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        marginBottom: '20px',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute',
          inset: '-3px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark || '#8B7355'})`,
          opacity: isHovered ? 1 : 0.4,
          transition: 'opacity 0.4s ease',
        }} />
        <img
          src={member.image}
          alt={member.name}
          loading="lazy"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            objectPosition: 'top center',
            border: `3px solid ${COLORS.card}`,
          }}
        />
      </div>

      {/* Name */}
      <h3 style={{
        fontFamily: 'Oswald, sans-serif',
        fontSize: '22px',
        fontWeight: 600,
        color: COLORS.white,
        textAlign: 'center',
        marginBottom: '6px',
      }}>
        {member.name}
      </h3>

      {/* Role */}
      <p style={{
        fontSize: '13px',
        color: COLORS.accent,
        textAlign: 'center',
        fontWeight: 600,
        marginBottom: '16px',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
      }}>
        {member.role}
      </p>

      {/* Short Bio Preview */}
      <p style={{
        fontSize: '13px',
        color: COLORS.textMuted,
        textAlign: 'center',
        lineHeight: 1.6,
        flex: 1,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
      }}>
        {member.bio}
      </p>

      {/* View More Indicator */}
      <div style={{
        marginTop: '16px',
        fontSize: '12px',
        color: isHovered ? COLORS.accent : COLORS.textMuted,
        fontWeight: 500,
        transition: 'color 0.3s ease',
      }}>
        Click to view full profile
      </div>
    </motion.div>
  )
}

// ============================================
// TEAM MEMBER MODAL
// ============================================
function TeamMemberModal({ member, onClose }) {
  if (!member) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: COLORS.card,
          borderRadius: '24px',
          padding: '40px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          border: `1px solid ${COLORS.accent}30`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: 'none',
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
            e.currentTarget.style.color = COLORS.dark
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.color = COLORS.textMuted
          }}
        >
          <X size={20} />
        </button>

        {/* Profile Image */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px',
        }}>
          <div style={{
            position: 'relative',
            width: '150px',
            height: '150px',
          }}>
            <div style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark || '#8B7355'})`,
            }} />
            <img
              src={member.image}
              alt={member.name}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `4px solid ${COLORS.card}`,
              }}
            />
          </div>
        </div>

        {/* Name */}
        <h3 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '32px',
          fontWeight: 600,
          color: COLORS.white,
          textAlign: 'center',
          marginBottom: '8px',
        }}>
          {member.name}
        </h3>

        {/* Role */}
        <p style={{
          fontSize: '14px',
          color: COLORS.accent,
          textAlign: 'center',
          fontWeight: 600,
          marginBottom: '24px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          {member.role}
        </p>

        {/* Full Bio */}
        <p style={{
          fontSize: '15px',
          color: COLORS.textLight,
          lineHeight: 1.8,
          marginBottom: '24px',
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
                padding: '14px 28px',
                backgroundColor: COLORS.accent,
                borderRadius: '50px',
                color: COLORS.dark,
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <Linkedin size={18} />
              Connect on LinkedIn
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ============================================
// TEAM SECTION
// ============================================
function TeamGrid() {
  const [selectedMember, setSelectedMember] = useState(null)

  return (
    <section style={{
      position: 'relative',
      backgroundColor: COLORS.dark,
      padding: '60px 24px 80px',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            textAlign: 'center',
            marginBottom: '60px',
          }}
        >
          <h2 style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 'clamp(28px, 5vw, 36px)',
            color: 'white',
            marginBottom: '16px',
          }}>
            The <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Experts</span> Behind Every Build
          </h2>
          <p style={{
            color: COLORS.textMuted,
            fontSize: '15px',
            maxWidth: '500px',
            margin: '0 auto',
            lineHeight: 1.7,
          }}>
            Our diverse team brings together decades of experience in construction,
            design, and project management.
          </p>
        </motion.div>

        {/* Team Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
        }} className="team-grid">
          {teamMembers.map((member, index) => (
            <TeamCard
              key={member.id}
              member={member}
              index={index}
              onClick={() => setSelectedMember(member)}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedMember && (
        <TeamMemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      <style>{`
        @media (max-width: 1024px) {
          .team-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .team-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}

// ============================================
// JOIN OUR TEAM CTA
// ============================================
function JoinTeamCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section style={{
      backgroundColor: COLORS.card,
      padding: '80px 24px',
    }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8 }}
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <div style={{
          backgroundColor: COLORS.accent,
          borderRadius: '24px',
          padding: '60px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }} />

          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              backgroundColor: COLORS.dark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <Users size={32} color={COLORS.accent} />
          </motion.div>

          <h2 style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 'clamp(28px, 5vw, 36px)',
            color: COLORS.dark,
            marginBottom: '16px',
          }}>
            Join Our Growing Team
          </h2>

          <p style={{
            color: 'rgba(17,17,17,0.7)',
            fontSize: '15px',
            lineHeight: 1.7,
            maxWidth: '500px',
            margin: '0 auto 32px',
          }}>
            We're always looking for talented individuals who share our passion for
            excellence in construction and design. Build your career with us.
          </p>

          <Link to="/contact-us" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              style={{
                backgroundColor: COLORS.dark,
                color: COLORS.white,
                padding: '14px 36px',
                borderRadius: '50px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              View Open Positions
              <ArrowRight size={16} />
            </motion.button>
          </Link>
        </div>
      </motion.div>
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
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark }}>
      <Header />
      <main>
        <HeroSection />
        <TeamGrid />
        <JoinTeamCTA />
      </main>
      <Footer />
    </div>
  )
}

export default Team
