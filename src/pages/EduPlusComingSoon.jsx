import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  ArrowLeft,
  Mail,
  Bell,
  Sparkles,
  Lightbulb,
  Target,
  Clock
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { COLORS } from '../constants/colors'

const EduPlusComingSoon = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  // Countdown to a launch date (set 90 days from now as placeholder)
  useEffect(() => {
    const launchDate = new Date()
    launchDate.setDate(launchDate.getDate() + 90)

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = launchDate.getTime() - now

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setEmail('')
    }
  }

  const features = [
    { icon: GraduationCap, title: 'Expert-Led Courses', desc: 'Learn from industry professionals' },
    { icon: BookOpen, title: 'Comprehensive Curriculum', desc: 'Interior design & architecture' },
    { icon: Users, title: 'Community Learning', desc: 'Connect with fellow learners' },
    { icon: Award, title: 'Certification', desc: 'Recognized industry credentials' }
  ]

  const upcomingCourses = [
    { name: 'Interior Design Fundamentals', duration: '12 weeks', level: 'Beginner' },
    { name: 'Advanced Space Planning', duration: '8 weeks', level: 'Intermediate' },
    { name: 'Material Science for Designers', duration: '6 weeks', level: 'All Levels' },
    { name: 'Business of Interior Design', duration: '10 weeks', level: 'Advanced' }
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark }}>
      <Header />

      {/* Hero Section */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '80px'
      }}>
        {/* Animated Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at top, ${COLORS.card} 0%, ${COLORS.dark} 70%)`
        }} />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              backgroundColor: COLORS.accent,
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.2 + Math.random() * 0.3,
              animation: `float ${5 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}

        {/* Rotating Circles */}
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          border: `1px dashed ${COLORS.accent}30`,
          borderRadius: '50%',
          animation: 'rotateSlow 40s linear infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          border: `1px solid ${COLORS.accent}20`,
          borderRadius: '50%',
          animation: 'rotateSlow 30s linear infinite reverse'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Back Link */}
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: COLORS.textMuted,
              textDecoration: 'none',
              fontSize: '14px',
              marginBottom: '32px',
              transition: 'color 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = COLORS.accent}
            onMouseOut={(e) => e.currentTarget.style.color = COLORS.textMuted}
          >
            <ArrowLeft size={18} /> Back to Home
          </Link>

          {/* Logo */}
          <div style={{
            width: '140px',
            height: '140px',
            margin: '0 auto 32px',
            backgroundColor: COLORS.accent,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 60px ${COLORS.accent}40`,
            animation: 'pulse 3s ease-in-out infinite'
          }}>
            <img
              src="/images/verticals-Logos/EDU.png"
              alt="EDU Plus"
              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
            />
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(36px, 7vw, 72px)',
            color: 'white',
            marginBottom: '16px',
            lineHeight: 1.1
          }}>
            EDU <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Plus</span>
          </h1>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: `${COLORS.accent}20`,
            padding: '12px 24px',
            borderRadius: '50px',
            marginBottom: '24px'
          }}>
            <Sparkles size={20} color={COLORS.accent} />
            <span style={{ color: COLORS.accent, fontWeight: 600, letterSpacing: '2px' }}>
              COMING SOON
            </span>
            <Sparkles size={20} color={COLORS.accent} />
          </div>

          <p style={{
            color: COLORS.textMuted,
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto 48px',
            lineHeight: 1.7
          }}>
            Your gateway to mastering interior design and architecture.
            Learn from industry experts and transform your passion into profession.
          </p>

          {/* Countdown Timer */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '48px',
            flexWrap: 'wrap'
          }}>
            {[
              { value: countdown.days, label: 'Days' },
              { value: countdown.hours, label: 'Hours' },
              { value: countdown.minutes, label: 'Minutes' },
              { value: countdown.seconds, label: 'Seconds' }
            ].map((item, i) => (
              <div key={i} style={{
                backgroundColor: COLORS.card,
                borderRadius: '16px',
                padding: '20px 28px',
                minWidth: '100px',
                border: `1px solid ${COLORS.accent}30`,
                boxShadow: `0 10px 30px rgba(0,0,0,0.3)`
              }}>
                <div style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '42px',
                  color: COLORS.accent,
                  fontWeight: 700
                }}>
                  {String(item.value).padStart(2, '0')}
                </div>
                <div style={{
                  color: COLORS.textMuted,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Email Signup */}
          <div style={{
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            {submitted ? (
              <div style={{
                backgroundColor: `rgba(34, 197, 94, 0.2)`,
                border: '1px solid #22C55E',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <Bell size={24} color="#22C55E" />
                <span style={{ color: '#22C55E', fontWeight: 500 }}>
                  You're on the list! We'll notify you when we launch.
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                <div style={{
                  flex: '1 1 300px',
                  position: 'relative'
                }}>
                  <Mail
                    size={20}
                    color={COLORS.textMuted}
                    style={{
                      position: 'absolute',
                      left: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Enter your email for updates"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '16px 16px 16px 48px',
                      borderRadius: '50px',
                      border: `1px solid ${COLORS.accent}30`,
                      backgroundColor: COLORS.card,
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => e.target.style.borderColor = COLORS.accent}
                    onBlur={(e) => e.target.style.borderColor = `${COLORS.accent}30`}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    backgroundColor: COLORS.accent,
                    color: COLORS.dark,
                    padding: '16px 32px',
                    borderRadius: '50px',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 10px 30px ${COLORS.accent}40`
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Bell size={18} />
                  Notify Me
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '80px 24px',
        backgroundColor: COLORS.card
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '36px',
            color: 'white',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            What to <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Expect</span>
          </h2>
          <p style={{
            color: COLORS.textMuted,
            textAlign: 'center',
            marginBottom: '48px',
            maxWidth: '500px',
            margin: '0 auto 48px'
          }}>
            EDU Plus brings world-class design education to your fingertips
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: COLORS.dark,
                    borderRadius: '20px',
                    padding: '32px',
                    textAlign: 'center',
                    border: `1px solid ${COLORS.accent}20`,
                    transition: 'all 0.3s ease',
                    cursor: 'default'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.borderColor = `${COLORS.accent}50`
                    e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.3)`
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.borderColor = `${COLORS.accent}20`
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    width: '70px',
                    height: '70px',
                    margin: '0 auto 20px',
                    backgroundColor: `${COLORS.accent}20`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={32} color={COLORS.accent} />
                  </div>
                  <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '8px'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
                    {feature.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Courses Preview */}
      <section style={{
        padding: '80px 24px',
        backgroundColor: COLORS.dark
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '36px',
            color: 'white',
            textAlign: 'center',
            marginBottom: '48px'
          }}>
            Upcoming <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Courses</span>
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {upcomingCourses.map((course, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: '16px',
                  padding: '24px 32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  border: `1px solid ${COLORS.accent}10`,
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = `${COLORS.accent}40`
                  e.currentTarget.style.transform = 'translateX(8px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = `${COLORS.accent}10`
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    backgroundColor: `${COLORS.accent}20`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Lightbulb size={24} color={COLORS.accent} />
                  </div>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                      {course.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{
                        color: COLORS.textMuted,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Clock size={14} /> {course.duration}
                      </span>
                      <span style={{
                        color: COLORS.textMuted,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Target size={14} /> {course.level}
                      </span>
                    </div>
                  </div>
                </div>
                <span style={{
                  backgroundColor: `${COLORS.accent}20`,
                  color: COLORS.accent,
                  padding: '8px 16px',
                  borderRadius: '50px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '80px 24px',
        backgroundColor: COLORS.card
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          backgroundColor: COLORS.accent,
          borderRadius: '24px',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: `radial-gradient(${COLORS.dark} 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '32px',
              color: COLORS.dark,
              marginBottom: '16px'
            }}>
              Be the First to Know
            </h2>
            <p style={{
              color: 'rgba(17,17,17,0.7)',
              marginBottom: '24px',
              maxWidth: '400px',
              margin: '0 auto 24px'
            }}>
              Join our waitlist and get exclusive early access when EDU Plus launches.
            </p>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: COLORS.dark,
                color: 'white',
                padding: '14px 32px',
                borderRadius: '50px',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <ArrowLeft size={18} />
              Return to Home
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 60px ${COLORS.accent}40; }
          50% { transform: scale(1.05); box-shadow: 0 0 80px ${COLORS.accent}60; }
        }
      `}</style>
    </div>
  )
}

export default EduPlusComingSoon
