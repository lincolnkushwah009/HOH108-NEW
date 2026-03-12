import { useState, useRef, useEffect } from 'react'
import {
  X,
  Gift,
  Sparkles,
  Check,
  ArrowRight,
  Award,
  Percent,
  Palette,
  MessageSquare,
  Wallet,
  Package,
  Clock,
  Timer,
} from 'lucide-react'

// Color constants matching HOH108 brand
const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  cardLight: '#242424',
  accent: '#C59C82',
  accentLight: '#DDC5B0',
  accentDark: '#A68B6A',
  gold: '#D4AF37',
  bronze: '#CD7F32',
  textMuted: '#A1A1A1',
  textLight: '#E5E5E5',
  white: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.9)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderAccent: 'rgba(197, 156, 130, 0.3)',
}

// Wheel segments with Karma Points rewards
const WHEEL_SEGMENTS = [
  {
    id: 1,
    points: 500,
    shortLabel: '500',
    color: COLORS.accent,
  },
  {
    id: 2,
    points: 100,
    shortLabel: '100',
    color: COLORS.cardLight,
  },
  {
    id: 3,
    points: 250,
    shortLabel: '250',
    color: COLORS.accentDark,
  },
  {
    id: 4,
    points: 1000,
    shortLabel: '1000',
    color: COLORS.cardLight,
  },
  {
    id: 5,
    points: 150,
    shortLabel: '150',
    color: COLORS.accent,
  },
  {
    id: 6,
    points: 750,
    shortLabel: '750',
    color: COLORS.cardLight,
  },
]

// Floating Trigger Button Component
export function SpinWheelTrigger({ onClick }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 1000,
        width: isHovered ? 'auto' : '56px',
        height: '56px',
        padding: isHovered ? '0 20px 0 16px' : '0',
        backgroundColor: COLORS.accent,
        border: 'none',
        borderRadius: '28px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        boxShadow: `0 4px 20px ${COLORS.accent}40`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <Gift size={24} color={COLORS.dark} style={{
        animation: 'pulse 2s ease-in-out infinite',
      }} />
      {isHovered && (
        <span style={{
          color: COLORS.dark,
          fontSize: '14px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}>
          Spin & Win
        </span>
      )}
    </button>
  )
}

const API_BASE = import.meta.env.DEV ? `http://${window.location.hostname}:5001/api` : 'https://hoh108.com/api'

// Main Spin Wheel Lightbox Component
function SpinWheelLightbox({ isOpen, onClose }) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [hasSpun, setHasSpun] = useState(false)
  const [canSpin, setCanSpin] = useState(true)
  const [rotation, setRotation] = useState(0)
  const [winner, setWinner] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [nextSpinTime, setNextSpinTime] = useState(null)
  const wheelRef = useRef(null)

  // 24 hours in milliseconds
  const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000

  // Check if user has already spun and calculate countdown
  useEffect(() => {
    const checkSpinStatus = () => {
      const lastSpinTime = localStorage.getItem('hoh108_spin_timestamp')
      const savedPoints = localStorage.getItem('hoh108_karma_points')

      if (lastSpinTime) {
        const lastSpin = parseInt(lastSpinTime)
        const now = Date.now()
        const timePassed = now - lastSpin
        const timeRemaining = COOLDOWN_PERIOD - timePassed

        if (timeRemaining > 0) {
          // Still in cooldown
          setHasSpun(true)
          setCanSpin(false)
          setNextSpinTime(lastSpin + COOLDOWN_PERIOD)

          if (savedPoints) {
            setWinner({ points: parseInt(savedPoints) })
          }
        } else {
          // Cooldown expired, can spin again
          setHasSpun(false)
          setCanSpin(true)
          setWinner(null)
          setNextSpinTime(null)
          // Clear old data
          localStorage.removeItem('hoh108_spin_timestamp')
          localStorage.removeItem('hoh108_karma_points')
          localStorage.removeItem('hoh108_points_claimed')
          setClaimSuccess(false)
        }
      } else {
        setCanSpin(true)
        setHasSpun(false)
      }
    }

    checkSpinStatus()
  }, [])

  // Countdown timer effect
  useEffect(() => {
    if (!nextSpinTime) return

    const updateCountdown = () => {
      const now = Date.now()
      const timeRemaining = nextSpinTime - now

      if (timeRemaining <= 0) {
        // Cooldown expired
        setCanSpin(true)
        setHasSpun(false)
        setWinner(null)
        setNextSpinTime(null)
        setCountdown({ hours: 0, minutes: 0, seconds: 0 })
        localStorage.removeItem('hoh108_spin_timestamp')
        localStorage.removeItem('hoh108_karma_points')
        localStorage.removeItem('hoh108_points_claimed')
        setClaimSuccess(false)
        return
      }

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000)

      setCountdown({ hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [nextSpinTime])

  // Handle spin
  const handleSpin = () => {
    if (isSpinning || hasSpun || !canSpin) return

    setIsSpinning(true)

    // Random winner (weighted can be added)
    const winnerIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length)
    const winningSegment = WHEEL_SEGMENTS[winnerIndex]

    // Calculate rotation
    // Each segment is 60 degrees (360/6)
    const segmentAngle = 360 / WHEEL_SEGMENTS.length
    const targetAngle = 360 - (winnerIndex * segmentAngle) - (segmentAngle / 2)
    const spins = 5 // Number of full rotations
    const finalRotation = rotation + (spins * 360) + targetAngle + (Math.random() * 20 - 10)

    setRotation(finalRotation)

    // Set winner after animation
    setTimeout(() => {
      setIsSpinning(false)
      setHasSpun(true)
      setCanSpin(false)
      setWinner(winningSegment)
      setShowConfetti(true)

      // Save timestamp and points to localStorage
      const now = Date.now()
      localStorage.setItem('hoh108_spin_timestamp', now.toString())
      localStorage.setItem('hoh108_karma_points', winningSegment.points.toString())
      setNextSpinTime(now + COOLDOWN_PERIOD)

      // Hide confetti after delay
      setTimeout(() => setShowConfetti(false), 3000)
    }, 5000)
  }

  // Reset for demo (remove in production)
  const handleReset = () => {
    localStorage.removeItem('hoh108_spin_timestamp')
    localStorage.removeItem('hoh108_karma_points')
    localStorage.removeItem('hoh108_points_claimed')
    setHasSpun(false)
    setCanSpin(true)
    setWinner(null)
    setRotation(0)
    setClaimSuccess(false)
    setClaimError('')
    setNextSpinTime(null)
    setCountdown({ hours: 0, minutes: 0, seconds: 0 })
  }

  // Handle claim points
  const handleClaimPoints = async () => {
    if (isClaiming || claimSuccess || !winner) return

    // Check if already claimed
    const alreadyClaimed = localStorage.getItem('hoh108_points_claimed')
    if (alreadyClaimed) {
      setClaimSuccess(true)
      return
    }

    setIsClaiming(true)
    setClaimError('')

    const token = localStorage.getItem('hoh108_token')
    const pointsToClaim = winner.points

    try {
      // If user is logged in, save to backend
      if (token) {
        const response = await fetch(`${API_BASE}/auth/claim-points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ points: pointsToClaim }),
        })

        if (response.ok) {
          const data = await response.json()
          // Update local user data
          const storedUser = localStorage.getItem('hoh108_user')
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            userData.karmaPoints = data.karmaPoints
            localStorage.setItem('hoh108_user', JSON.stringify(userData))
          }
        }
      }

      // Mark as claimed
      localStorage.setItem('hoh108_points_claimed', 'true')
      setClaimSuccess(true)
      setShowConfetti(true)

      // Hide confetti after delay
      setTimeout(() => setShowConfetti(false), 3000)

    } catch (error) {
      console.error('Claim error:', error)
      // Still mark as claimed locally
      localStorage.setItem('hoh108_points_claimed', 'true')
      setClaimSuccess(true)
    } finally {
      setIsClaiming(false)
    }
  }

  // Check if already claimed on mount
  useEffect(() => {
    const alreadyClaimed = localStorage.getItem('hoh108_points_claimed')
    if (alreadyClaimed) {
      setClaimSuccess(true)
    }
  }, [])

  if (!isOpen) return null

  const segmentAngle = 360 / WHEEL_SEGMENTS.length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: COLORS.overlay,
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.3s ease-out',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Fixed Close Button - Always Visible */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          border: `2px solid ${COLORS.accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 10001,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.accent
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        <X size={22} color={COLORS.white} />
      </button>

      {/* Confetti Effect */}
      {showConfetti && (
        <div style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: i % 3 === 0 ? COLORS.accent : i % 3 === 1 ? COLORS.accentLight : COLORS.gold,
                borderRadius: i % 2 === 0 ? '50%' : '2px',
                left: `${Math.random() * 100}%`,
                top: '-20px',
                opacity: 0.8,
                animation: `confettiFall ${2 + Math.random() * 2}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Modal Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          backgroundColor: COLORS.card,
          borderRadius: '20px',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.6)',
          animation: 'scaleIn 0.4s ease-out',
          position: 'relative',
          marginTop: '40px',
          marginBottom: '40px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div style={{ padding: '32px 24px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: `${COLORS.accent}15`,
              padding: '8px 16px',
              borderRadius: '20px',
              marginBottom: '16px',
            }}>
              <Sparkles size={16} color={COLORS.accent} />
              <span style={{ fontSize: '12px', color: COLORS.accent, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Karma Points
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '32px',
              color: COLORS.white,
              marginBottom: '12px',
              lineHeight: 1.2,
            }}>
              Spin & Win <span style={{ color: COLORS.accent }}>Karma Points</span>
            </h2>
            <p style={{
              fontSize: '15px',
              color: COLORS.textMuted,
              maxWidth: '420px',
              margin: '0 auto',
            }}>
              Earn Karma Points and add them to your wallet. Redeem points on future projects!
            </p>
          </div>

          {/* Wheel Section */}
          {!winner ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}>
              {/* Wheel Container */}
              <div style={{
                position: 'relative',
                width: 'min(280px, 80vw)',
                height: 'min(280px, 80vw)',
              }}>
                {/* Outer Glow */}
                <div style={{
                  position: 'absolute',
                  inset: '-20px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${COLORS.accent}20 0%, transparent 70%)`,
                  animation: 'pulseGlow 2s ease-in-out infinite',
                }} />

                {/* Wheel Border */}
                <div style={{
                  position: 'absolute',
                  inset: '-8px',
                  borderRadius: '50%',
                  border: `3px solid ${COLORS.accent}`,
                  boxShadow: `0 0 30px ${COLORS.accent}30, inset 0 0 30px ${COLORS.accent}10`,
                }} />

                {/* Pointer/Indicator */}
                <div style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '0',
                  height: '0',
                  borderLeft: '15px solid transparent',
                  borderRight: '15px solid transparent',
                  borderTop: `25px solid ${COLORS.accent}`,
                  filter: `drop-shadow(0 4px 8px ${COLORS.accent}50)`,
                  zIndex: 10,
                }} />

                {/* Spinning Wheel */}
                <div
                  ref={wheelRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    position: 'relative',
                    overflow: 'hidden',
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* SVG Wheel */}
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 200 200"
                    style={{ position: 'absolute', inset: 0 }}
                  >
                    {WHEEL_SEGMENTS.map((segment, index) => {
                      const startAngle = index * segmentAngle - 90
                      const endAngle = startAngle + segmentAngle
                      const startRad = (startAngle * Math.PI) / 180
                      const endRad = (endAngle * Math.PI) / 180
                      const x1 = 100 + 100 * Math.cos(startRad)
                      const y1 = 100 + 100 * Math.sin(startRad)
                      const x2 = 100 + 100 * Math.cos(endRad)
                      const y2 = 100 + 100 * Math.sin(endRad)
                      const largeArc = segmentAngle > 180 ? 1 : 0

                      const textAngle = startAngle + segmentAngle / 2
                      const textRad = (textAngle * Math.PI) / 180
                      const textX = 100 + 55 * Math.cos(textRad)
                      const textY = 100 + 55 * Math.sin(textRad)

                      return (
                        <g key={segment.id}>
                          <path
                            d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={segment.color}
                            stroke={COLORS.dark}
                            strokeWidth="1"
                          />
                          <text
                            x={textX}
                            y={textY}
                            fill={segment.color === COLORS.cardLight ? COLORS.textLight : COLORS.dark}
                            fontSize="8"
                            fontWeight="600"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                            style={{ fontFamily: "'Raleway', sans-serif" }}
                          >
                            {segment.shortLabel}
                          </text>
                        </g>
                      )
                    })}
                  </svg>

                  {/* Center Circle */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: COLORS.dark,
                    border: `3px solid ${COLORS.accent}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  }}>
                    <Gift size={24} color={COLORS.accent} />
                  </div>
                </div>
              </div>

              {/* Spin Button */}
              <button
                onClick={handleSpin}
                disabled={isSpinning || hasSpun}
                style={{
                  padding: '18px 48px',
                  backgroundColor: isSpinning || hasSpun ? COLORS.cardLight : COLORS.accent,
                  color: isSpinning || hasSpun ? COLORS.textMuted : COLORS.dark,
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: isSpinning || hasSpun ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: isSpinning || hasSpun ? 'none' : `0 8px 24px ${COLORS.accent}40`,
                }}
                onMouseOver={(e) => {
                  if (!isSpinning && !hasSpun) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 12px 32px ${COLORS.accent}50`
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = isSpinning || hasSpun ? 'none' : `0 8px 24px ${COLORS.accent}40`
                }}
              >
                {isSpinning ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: `2px solid ${COLORS.textMuted}`,
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Spinning...
                  </>
                ) : hasSpun ? (
                  'Already Spun'
                ) : (
                  <>
                    <Sparkles size={20} />
                    Spin Now
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Winner Result - Karma Points */
            <div style={{
              animation: 'fadeInUp 0.5s ease-out',
              textAlign: 'center',
            }}>
              {/* Winner Card */}
              <div style={{
                backgroundColor: COLORS.dark,
                borderRadius: '20px',
                padding: '40px 32px',
                border: `1px solid ${COLORS.borderAccent}`,
                position: 'relative',
                overflow: 'hidden',
                maxWidth: '400px',
                margin: '0 auto',
              }}>
                {/* Glow Effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: `radial-gradient(circle at center, ${COLORS.accent}15 0%, transparent 50%)`,
                  pointerEvents: 'none',
                }} />

                {/* Karma Points Badge */}
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  backgroundColor: `${COLORS.accent}20`,
                  border: `4px solid ${COLORS.accent}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  position: 'relative',
                  boxShadow: `0 0 50px ${COLORS.accent}40`,
                }}>
                  <span style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: '48px',
                    color: COLORS.accent,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}>
                    {winner.points}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: COLORS.accentLight,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    marginTop: '4px',
                  }}>
                    Points
                  </span>
                </div>

                {/* Congrats Text */}
                <p style={{
                  fontSize: '14px',
                  color: COLORS.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}>
                  Congratulations!
                </p>

                {/* Points Title */}
                <h3 style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '28px',
                  color: COLORS.white,
                  marginBottom: '12px',
                }}>
                  You Won <span style={{ color: COLORS.accent }}>{winner.points}</span> Karma Points!
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '14px',
                  color: COLORS.textMuted,
                  lineHeight: 1.6,
                  marginBottom: '28px',
                }}>
                  Points have been added to your wallet. Sign up or log in to claim and redeem on your next project.
                </p>

                {/* Claim Button */}
                <button
                  onClick={handleClaimPoints}
                  disabled={isClaiming || claimSuccess}
                  style={{
                    padding: '16px 40px',
                    backgroundColor: claimSuccess ? COLORS.gold : COLORS.accent,
                    color: COLORS.dark,
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: claimSuccess ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    transform: claimSuccess ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: claimSuccess ? `0 8px 30px ${COLORS.gold}50` : 'none',
                    animation: isClaiming ? 'pulse 1s infinite' : 'none',
                  }}
                  onMouseOver={(e) => {
                    if (!claimSuccess) {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                      e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.accent}40`
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!claimSuccess) {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  {isClaiming ? (
                    <>
                      <Sparkles size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Claiming...
                    </>
                  ) : claimSuccess ? (
                    <>
                      <Check size={18} />
                      Points Claimed!
                    </>
                  ) : (
                    <>
                      <Wallet size={18} />
                      Claim Points
                    </>
                  )}
                </button>

                {/* Info Badge */}
                <div style={{
                  marginTop: '20px',
                  padding: '12px 16px',
                  backgroundColor: claimSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  display: 'inline-block',
                  border: claimSuccess ? '1px solid rgba(34, 197, 94, 0.3)' : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  <p style={{
                    fontSize: '12px',
                    color: claimSuccess ? '#22C55E' : COLORS.textMuted,
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {claimSuccess ? (
                      <>
                        <Check size={14} />
                        Points added to your account!
                      </>
                    ) : (
                      'Create an account to save your points'
                    )}
                  </p>
                </div>

                {/* Countdown Timer */}
                {nextSpinTime && (
                  <div style={{
                    marginTop: '24px',
                    padding: '20px',
                    backgroundColor: 'rgba(197, 156, 130, 0.08)',
                    borderRadius: '16px',
                    border: `1px solid ${COLORS.borderAccent}`,
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                    }}>
                      <Timer size={18} color={COLORS.accent} />
                      <span style={{
                        fontSize: '13px',
                        color: COLORS.accent,
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}>
                        Next Spin Available In
                      </span>
                    </div>

                    {/* Timer Display */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: '12px',
                    }}>
                      {/* Hours */}
                      <div style={{
                        backgroundColor: COLORS.dark,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        minWidth: '70px',
                        textAlign: 'center',
                        border: `1px solid ${COLORS.border}`,
                      }}>
                        <span style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '32px',
                          color: COLORS.white,
                          fontWeight: 500,
                          display: 'block',
                          lineHeight: 1,
                        }}>
                          {String(countdown.hours).padStart(2, '0')}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          color: COLORS.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}>
                          Hours
                        </span>
                      </div>

                      {/* Separator */}
                      <span style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: '28px',
                        color: COLORS.accent,
                        alignSelf: 'center',
                        paddingBottom: '16px',
                      }}>:</span>

                      {/* Minutes */}
                      <div style={{
                        backgroundColor: COLORS.dark,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        minWidth: '70px',
                        textAlign: 'center',
                        border: `1px solid ${COLORS.border}`,
                      }}>
                        <span style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '32px',
                          color: COLORS.white,
                          fontWeight: 500,
                          display: 'block',
                          lineHeight: 1,
                        }}>
                          {String(countdown.minutes).padStart(2, '0')}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          color: COLORS.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}>
                          Mins
                        </span>
                      </div>

                      {/* Separator */}
                      <span style={{
                        fontFamily: "'Oswald', sans-serif",
                        fontSize: '28px',
                        color: COLORS.accent,
                        alignSelf: 'center',
                        paddingBottom: '16px',
                      }}>:</span>

                      {/* Seconds */}
                      <div style={{
                        backgroundColor: COLORS.dark,
                        borderRadius: '12px',
                        padding: '12px 16px',
                        minWidth: '70px',
                        textAlign: 'center',
                        border: `1px solid ${COLORS.border}`,
                      }}>
                        <span style={{
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '32px',
                          color: COLORS.accent,
                          fontWeight: 500,
                          display: 'block',
                          lineHeight: 1,
                          animation: 'pulse 1s ease-in-out infinite',
                        }}>
                          {String(countdown.seconds).padStart(2, '0')}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          color: COLORS.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}>
                          Secs
                        </span>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '12px',
                      color: COLORS.textMuted,
                      textAlign: 'center',
                      marginTop: '12px',
                    }}>
                      Come back tomorrow for another chance to win!
                    </p>
                  </div>
                )}
              </div>

              {/* Reset for Demo */}
              <button
                onClick={handleReset}
                style={{
                  marginTop: '20px',
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: COLORS.textMuted,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Reset (Demo Only)
              </button>
            </div>
          )}

          {/* Trust Badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginTop: '32px',
            flexWrap: 'wrap',
          }}>
            {[
              'Spin every 24 hours',
              'Points never expire',
              'Redeem anytime',
            ].map((text, i) => (
              <span
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: COLORS.textMuted,
                }}
              >
                <Check size={14} color={COLORS.accent} />
                {text}
              </span>
            ))}
          </div>

          {/* Disclaimer */}
          <p style={{
            fontSize: '11px',
            color: COLORS.textMuted,
            textAlign: 'center',
            marginTop: '16px',
            opacity: 0.6,
          }}>
            Karma Points can be redeemed on future projects. Create an account to save your points.
          </p>

          {/* Reset Button - Always visible when hasSpun but no winner shown */}
          {hasSpun && !winner && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={handleReset}
                style={{
                  padding: '12px 24px',
                  backgroundColor: COLORS.accent,
                  color: COLORS.dark,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reset & Spin Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default SpinWheelLightbox
