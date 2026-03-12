import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Star,
  Award,
  Gift,
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

// CSS Animations
const animationStyles = `
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(197, 156, 130, 0.3); }
    50% { box-shadow: 0 0 40px rgba(197, 156, 130, 0.6), 0 0 60px rgba(197, 156, 130, 0.3); }
  }

  @keyframes bounce-in {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.1); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes float-up {
    0% { transform: translateY(0) scale(1); opacity: 1; }
    100% { transform: translateY(-80px) scale(1.5); opacity: 0; }
  }

  @keyframes confetti-fall {
    0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100px) rotate(720deg); opacity: 0; }
  }

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes sparkle {
    0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
    50% { transform: scale(1) rotate(180deg); opacity: 1; }
  }

  @keyframes number-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); color: #FFD700; }
    100% { transform: scale(1); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px) rotate(-5deg); }
    75% { transform: translateX(5px) rotate(5deg); }
  }

  @keyframes ripple {
    0% { transform: scale(0); opacity: 0.5; }
    100% { transform: scale(4); opacity: 0; }
  }

  .claim-btn:hover {
    animation: pulse-glow 1.5s ease-in-out infinite;
  }

  .points-animate {
    animation: number-pop 0.5s ease-out;
  }

  .claiming {
    animation: shake 0.5s ease-in-out;
  }
`

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  cardLight: '#242424',
  accent: '#C59C82',
  accentLight: '#DDC5B0',
  accentDark: '#A68B6A',
  textMuted: '#A1A1A1',
  textLight: '#E5E5E5',
  white: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.08)',
  danger: '#EF4444',
  success: '#22C55E',
}

const API_BASE = import.meta.env.DEV ? `http://${window.location.hostname}:5001/api` : 'https://hoh108.com/api'

function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })

  // Claim Points State
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [pointsAnimating, setPointsAnimating] = useState(false)
  const [confetti, setConfetti] = useState([])
  const [floatingPoints, setFloatingPoints] = useState([])
  const [canClaim, setCanClaim] = useState(true)
  const [nextClaimTime, setNextClaimTime] = useState(null)
  const karmaCardRef = useRef(null)

  useEffect(() => {
    const storedUser = localStorage.getItem('hoh108_user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || ''
      })
    } else {
      navigate('/login')
    }
  }, [navigate])

  // Check if user can claim daily points
  useEffect(() => {
    const lastClaim = localStorage.getItem('hoh108_last_claim')
    if (lastClaim) {
      const lastClaimDate = new Date(lastClaim)
      const now = new Date()
      const hoursSinceLastClaim = (now - lastClaimDate) / (1000 * 60 * 60)

      if (hoursSinceLastClaim < 24) {
        setCanClaim(false)
        const nextClaim = new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000)
        setNextClaimTime(nextClaim)
      }
    }
  }, [])

  // Generate confetti particles
  const createConfetti = () => {
    const colors = ['#C59C82', '#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#A855F7', '#22C55E']
    const particles = []
    for (let i = 0; i < 30; i++) {
      particles.push({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 0.5
      })
    }
    return particles
  }

  // Handle claim points
  const handleClaimPoints = async () => {
    if (!canClaim || isClaiming) return

    setIsClaiming(true)
    const pointsToAdd = Math.floor(Math.random() * 50) + 10 // Random 10-60 points

    // Create confetti
    setConfetti(createConfetti())

    // Create floating points animation
    setFloatingPoints([{ id: Date.now(), value: pointsToAdd }])

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const token = localStorage.getItem('hoh108_token')

      // Call API to update karma points
      const response = await fetch(`${API_BASE}/auth/claim-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ points: pointsToAdd }),
      })

      let newKarmaPoints = (user.karmaPoints || 0) + pointsToAdd

      if (response.ok) {
        const data = await response.json()
        newKarmaPoints = data.karmaPoints || newKarmaPoints
      }

      // Update user state and localStorage
      const updatedUser = { ...user, karmaPoints: newKarmaPoints }
      setUser(updatedUser)
      localStorage.setItem('hoh108_user', JSON.stringify(updatedUser))

      // Save claim time
      localStorage.setItem('hoh108_last_claim', new Date().toISOString())

      // Trigger points animation
      setPointsAnimating(true)
      setTimeout(() => setPointsAnimating(false), 500)

      setClaimSuccess(true)
      setCanClaim(false)
      setNextClaimTime(new Date(Date.now() + 24 * 60 * 60 * 1000))

      // Clear success after delay
      setTimeout(() => {
        setClaimSuccess(false)
        setConfetti([])
        setFloatingPoints([])
      }, 3000)

    } catch (err) {
      console.error('Claim error:', err)
      // Still update locally even if API fails
      const newKarmaPoints = (user.karmaPoints || 0) + pointsToAdd
      const updatedUser = { ...user, karmaPoints: newKarmaPoints }
      setUser(updatedUser)
      localStorage.setItem('hoh108_user', JSON.stringify(updatedUser))
      localStorage.setItem('hoh108_last_claim', new Date().toISOString())
      setPointsAnimating(true)
      setTimeout(() => setPointsAnimating(false), 500)
      setClaimSuccess(true)
      setCanClaim(false)
      setNextClaimTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
      setTimeout(() => {
        setClaimSuccess(false)
        setConfetti([])
        setFloatingPoints([])
      }, 3000)
    } finally {
      setIsClaiming(false)
    }
  }

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!nextClaimTime) return ''
    const now = new Date()
    const diff = nextClaimTime - now
    if (diff <= 0) {
      setCanClaim(true)
      return 'Ready!'
    }
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('hoh108_token')
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile')
      }

      // Update local storage
      const updatedUser = { ...user, ...formData }
      localStorage.setItem('hoh108_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setIsEditing(false)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || ''
    })
    setIsEditing(false)
    setError('')
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: COLORS.dark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: COLORS.textMuted }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark, display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{
        flex: 1,
        paddingTop: '100px',
        paddingBottom: '60px'
      }}>
        {/* Inject CSS Animations */}
        <style>{animationStyles}</style>

        {/* Background Pattern */}
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 80%, ${COLORS.accent}08 0%, transparent 50%)`,
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          {/* Page Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '36px',
            color: COLORS.white,
            marginBottom: '8px'
          }}>
            My <span style={{ color: COLORS.accent }}>Profile</span>
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '15px' }}>
            Manage your account settings and preferences
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 16px',
            backgroundColor: `${COLORS.success}15`,
            borderRadius: '12px',
            marginBottom: '24px',
            border: `1px solid ${COLORS.success}30`,
          }}>
            <CheckCircle size={18} color={COLORS.success} />
            <p style={{ color: COLORS.success, fontSize: '14px' }}>{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 16px',
            backgroundColor: `${COLORS.danger}15`,
            borderRadius: '12px',
            marginBottom: '24px',
            border: `1px solid ${COLORS.danger}30`,
          }}>
            <AlertCircle size={18} color={COLORS.danger} />
            <p style={{ color: COLORS.danger, fontSize: '14px' }}>{error}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Profile Card */}
          <div style={{
            backgroundColor: COLORS.card,
            borderRadius: '24px',
            padding: '32px',
            border: `1px solid ${COLORS.border}`,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: COLORS.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 600,
                  color: COLORS.dark
                }}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 style={{ color: COLORS.white, fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>
                    {user.name}
                  </h2>
                  <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
                    Member since {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.textLight,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.accent
                    e.currentTarget.style.color = COLORS.dark
                    e.currentTarget.style.borderColor = COLORS.accent
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = COLORS.textLight
                    e.currentTarget.style.borderColor = COLORS.border
                  }}
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleCancel}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '8px',
                      color: COLORS.textMuted,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 12px',
                      backgroundColor: COLORS.accent,
                      border: 'none',
                      borderRadius: '8px',
                      color: COLORS.dark,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    <Save size={14} />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: COLORS.border, margin: '24px 0' }} />

            {/* Profile Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                  <User size={14} />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: COLORS.cardLight,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '10px',
                      color: COLORS.white,
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <p style={{ color: COLORS.white, fontSize: '15px' }}>{user.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                  <Mail size={14} />
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: COLORS.cardLight,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '10px',
                      color: COLORS.white,
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <p style={{ color: COLORS.white, fontSize: '15px' }}>{user.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                  <Phone size={14} />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Add phone number"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: COLORS.cardLight,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '10px',
                      color: COLORS.white,
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <p style={{ color: user.phone ? COLORS.white : COLORS.textMuted, fontSize: '15px' }}>
                    {user.phone || 'Not added'}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                  <MapPin size={14} />
                  Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Add your address"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: COLORS.cardLight,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '10px',
                      color: COLORS.white,
                      fontSize: '15px',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <p style={{ color: user.address ? COLORS.white : COLORS.textMuted, fontSize: '15px' }}>
                    {user.address || 'Not added'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats & Rewards Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Karma Points Card */}
            <div
              ref={karmaCardRef}
              style={{
                backgroundColor: COLORS.card,
                borderRadius: '24px',
                padding: '28px',
                border: `1px solid ${COLORS.border}`,
                background: `linear-gradient(135deg, ${COLORS.card} 0%, ${COLORS.cardLight} 100%)`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Confetti Container */}
              {confetti.length > 0 && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  overflow: 'hidden'
                }}>
                  {confetti.map((particle) => (
                    <div
                      key={particle.id}
                      style={{
                        position: 'absolute',
                        left: `${particle.left}%`,
                        top: '-10px',
                        width: '8px',
                        height: '8px',
                        backgroundColor: particle.color,
                        borderRadius: '2px',
                        animation: `confetti-fall ${particle.duration}s ease-out ${particle.delay}s forwards`
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Floating Points Animation */}
              {floatingPoints.map((fp) => (
                <div
                  key={fp.id}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '40%',
                    transform: 'translateX(-50%)',
                    fontSize: '32px',
                    fontWeight: 700,
                    color: '#FFD700',
                    textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                    animation: 'float-up 1.5s ease-out forwards',
                    pointerEvents: 'none',
                    zIndex: 10
                  }}
                >
                  +{fp.value}
                </div>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ color: COLORS.white, fontSize: '16px', fontWeight: 600 }}>Karma Points</h3>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: `${COLORS.accent}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: claimSuccess ? 'bounce-in 0.5s ease-out' : 'none'
                }}>
                  <Star size={20} color={COLORS.accent} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                <span
                  className={pointsAnimating ? 'points-animate' : ''}
                  style={{
                    fontSize: '48px',
                    fontWeight: 700,
                    color: COLORS.accent,
                    fontFamily: "'Oswald', sans-serif",
                    transition: 'all 0.3s ease'
                  }}
                >
                  {user.karmaPoints || 0}
                </span>
                <span style={{ color: COLORS.textMuted, fontSize: '14px' }}>points</span>
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: '13px', lineHeight: 1.5, marginBottom: '12px' }}>
                Earn points on every project and redeem them for exclusive discounts!
              </p>

              {/* Reset cooldown link (for testing) */}
              {!canClaim && (
                <button
                  onClick={() => {
                    localStorage.removeItem('hoh108_last_claim')
                    setCanClaim(true)
                    setNextClaimTime(null)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: COLORS.accent,
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    textDecoration: 'underline',
                    opacity: 0.7
                  }}
                >
                  Reset cooldown (testing)
                </button>
              )}

              {/* Claim Points Button */}
              <button
                className={`claim-btn ${isClaiming ? 'claiming' : ''}`}
                onClick={handleClaimPoints}
                disabled={!canClaim || isClaiming}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: canClaim
                    ? `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`
                    : COLORS.cardLight,
                  border: 'none',
                  borderRadius: '12px',
                  color: canClaim ? COLORS.dark : COLORS.textMuted,
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: canClaim ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  transform: claimSuccess ? 'scale(1.02)' : 'scale(1)'
                }}
                onMouseOver={(e) => {
                  if (canClaim) {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(197, 156, 130, 0.4)'
                  }
                }}
                onMouseOut={(e) => {
                  if (canClaim && !claimSuccess) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {/* Shimmer effect */}
                {canClaim && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    pointerEvents: 'none'
                  }} />
                )}

                <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isClaiming ? (
                    <>
                      <Zap size={18} style={{ animation: 'bounce-in 0.3s ease-out' }} />
                      <span>Claiming...</span>
                    </>
                  ) : claimSuccess ? (
                    <>
                      <CheckCircle size={18} />
                      <span>Points Claimed!</span>
                    </>
                  ) : canClaim ? (
                    <>
                      <Sparkles size={18} />
                      <span>Claim Daily Points</span>
                    </>
                  ) : (
                    <>
                      <Calendar size={16} />
                      <span>Next claim in {formatTimeRemaining()}</span>
                    </>
                  )}
                </span>
              </button>

              {/* Claim Success Sparkles */}
              {claimSuccess && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center'
                }}>
                  {[...Array(6)].map((_, i) => (
                    <Sparkles
                      key={i}
                      size={16}
                      color="#FFD700"
                      style={{
                        position: 'absolute',
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 2) * 30}%`,
                        animation: `sparkle 1s ease-out ${i * 0.1}s infinite`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div style={{
              backgroundColor: COLORS.card,
              borderRadius: '24px',
              padding: '24px',
              border: `1px solid ${COLORS.border}`,
            }}>
              <h3 style={{ color: COLORS.white, fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Quick Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Award size={18} color="#22C55E" />
                  </div>
                  <div>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px' }}>Member Status</p>
                    <p style={{ color: COLORS.white, fontSize: '14px', fontWeight: 500 }}>
                      {(user.karmaPoints || 0) >= 1000 ? 'Gold' : (user.karmaPoints || 0) >= 500 ? 'Silver' : 'Bronze'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Gift size={18} color="#3B82F6" />
                  </div>
                  <div>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px' }}>Rewards Available</p>
                    <p style={{ color: COLORS.white, fontSize: '14px', fontWeight: 500 }}>
                      {Math.floor((user.karmaPoints || 0) / 100)} rewards
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(168, 85, 247, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Calendar size={18} color="#A855F7" />
                  </div>
                  <div>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px' }}>Account Created</p>
                    <p style={{ color: COLORS.white, fontSize: '14px', fontWeight: 500 }}>
                      {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div style={{
              backgroundColor: COLORS.card,
              borderRadius: '24px',
              padding: '24px',
              border: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Shield size={20} color={COLORS.accent} />
                <h3 style={{ color: COLORS.white, fontSize: '16px', fontWeight: 600 }}>Account Security</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: COLORS.textMuted, fontSize: '13px', marginBottom: '4px' }}>Password</p>
                  <p style={{ color: COLORS.white, fontSize: '14px' }}>Last changed: Never</p>
                </div>
                <button
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    color: COLORS.accent,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = `${COLORS.accent}15`
                    e.currentTarget.style.borderColor = COLORS.accent
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = COLORS.border
                  }}
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  )
}

export default Profile
