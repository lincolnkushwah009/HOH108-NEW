import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User, Phone, AlertCircle, Check } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  cardLight: '#242424',
  accent: '#C59C82',
  accentLight: '#DDC5B0',
  textMuted: '#A1A1A1',
  textLight: '#E5E5E5',
  white: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.08)',
  danger: '#EF4444',
  success: '#22C55E',
}

const API_BASE = 'https://hoh108.com/api'

function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          websiteSource: 'HOH108'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Save token and user data
      localStorage.setItem('hoh108_token', data.token)
      localStorage.setItem('hoh108_user', JSON.stringify(data.user))

      setSuccess(true)

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark, display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        paddingTop: '100px',
        position: 'relative',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 70% 80%, ${COLORS.accent}10 0%, transparent 50%)`,
        }} />

        <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ display: 'inline-block' }}>
            <img src="/Logo.png" alt="HOH108" style={{ height: '50px', display: 'block', margin: '0 auto 20px' }} />
          </Link>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '32px',
            color: COLORS.white,
            marginBottom: '8px',
          }}>
            Create Account
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '15px' }}>
            Join us and start earning Karma Points
          </p>
        </div>

        {/* Success Message */}
        {success ? (
          <div style={{
            backgroundColor: COLORS.card,
            borderRadius: '24px',
            padding: '48px 32px',
            border: `1px solid ${COLORS.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: `${COLORS.success}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Check size={40} color={COLORS.success} />
            </div>
            <h2 style={{ color: COLORS.white, fontSize: '24px', marginBottom: '12px' }}>
              Welcome to HOH108!
            </h2>
            <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
              Your account has been created successfully. Redirecting...
            </p>
          </div>
        ) : (
          /* Signup Card */
          <div style={{
            backgroundColor: COLORS.card,
            borderRadius: '24px',
            padding: '36px 32px',
            border: `1px solid ${COLORS.border}`,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}>
            {/* Error Message */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 16px',
                backgroundColor: `${COLORS.danger}15`,
                borderRadius: '12px',
                marginBottom: '20px',
                border: `1px solid ${COLORS.danger}30`,
              }}>
                <AlertCircle size={18} color={COLORS.danger} />
                <p style={{ color: COLORS.danger, fontSize: '14px' }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Name Field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  color: COLORS.textLight,
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}>
                  Full Name
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: COLORS.cardLight,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <User size={20} color={COLORS.textMuted} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      color: COLORS.white,
                      fontSize: '15px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  color: COLORS.textLight,
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}>
                  Email Address
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: COLORS.cardLight,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <Mail size={20} color={COLORS.textMuted} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      color: COLORS.white,
                      fontSize: '15px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  color: COLORS.textLight,
                  fontSize: '14px',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}>
                  Phone Number
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: COLORS.cardLight,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: `1px solid ${COLORS.border}`,
                }}>
                  <Phone size={20} color={COLORS.textMuted} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      color: COLORS.white,
                      fontSize: '15px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: COLORS.textLight,
                    fontSize: '14px',
                    marginBottom: '8px',
                    fontWeight: 500,
                  }}>
                    Password
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: COLORS.cardLight,
                    borderRadius: '12px',
                    padding: '14px 12px',
                    border: `1px solid ${COLORS.border}`,
                  }}>
                    <Lock size={18} color={COLORS.textMuted} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••"
                      required
                      style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        color: COLORS.white,
                        fontSize: '14px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: COLORS.textLight,
                    fontSize: '14px',
                    marginBottom: '8px',
                    fontWeight: 500,
                  }}>
                    Confirm
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: COLORS.cardLight,
                    borderRadius: '12px',
                    padding: '14px 12px',
                    border: `1px solid ${COLORS.border}`,
                  }}>
                    <Lock size={18} color={COLORS.textMuted} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••"
                      required
                      style={{
                        flex: 1,
                        background: 'none',
                        border: 'none',
                        color: COLORS.white,
                        fontSize: '14px',
                        outline: 'none',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Show Password Toggle */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: COLORS.textMuted,
                fontSize: '13px',
                marginBottom: '24px',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  style={{ accentColor: COLORS.accent }}
                />
                Show passwords
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '18px',
                  backgroundColor: loading ? COLORS.cardLight : COLORS.accent,
                  color: loading ? COLORS.textMuted : COLORS.dark,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#A68B6A'
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Sign In Link */}
            <p style={{
              textAlign: 'center',
              color: COLORS.textMuted,
              fontSize: '14px',
              marginTop: '24px',
            }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: COLORS.accent,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Benefits */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '32px',
          flexWrap: 'wrap',
        }}>
          {['Earn Karma Points', 'Track Projects', 'Exclusive Offers'].map((benefit, i) => (
            <span
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: COLORS.textMuted,
                fontSize: '12px',
              }}
            >
              <Check size={14} color={COLORS.accent} />
              {benefit}
            </span>
          ))}
        </div>
      </div>
      </div>

      <Footer />
    </div>
  )
}

export default Signup
