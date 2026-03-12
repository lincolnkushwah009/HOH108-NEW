import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react'
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

const API_BASE = import.meta.env.DEV ? `http://${window.location.hostname}:5001/api` : 'https://hoh108.com/api'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      // Save token and user data
      localStorage.setItem('hoh108_token', data.token)
      localStorage.setItem('hoh108_user', JSON.stringify(data.user))

      // Redirect to home or dashboard
      navigate('/')
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
          backgroundImage: `radial-gradient(circle at 30% 20%, ${COLORS.accent}10 0%, transparent 50%)`,
        }} />

        <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link to="/" style={{ display: 'inline-block' }}>
            <img src="/Logo.png" alt="HOH108" style={{ height: '60px', marginBottom: '24px', display: 'block', margin: '0 auto 24px' }} />
          </Link>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '32px',
            color: COLORS.white,
            marginBottom: '8px',
          }}>
            Welcome Back
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '15px' }}>
            Sign in to access your account
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          backgroundColor: COLORS.card,
          borderRadius: '24px',
          padding: '40px 32px',
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
              marginBottom: '24px',
              border: `1px solid ${COLORS.danger}30`,
            }}>
              <AlertCircle size={18} color={COLORS.danger} />
              <p style={{ color: COLORS.danger, fontSize: '14px' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: COLORS.textLight,
                fontSize: '14px',
                marginBottom: '10px',
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
                padding: '16px',
                border: `1px solid ${COLORS.border}`,
                transition: 'border-color 0.2s',
              }}>
                <Mail size={20} color={COLORS.textMuted} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

            {/* Password Field */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                color: COLORS.textLight,
                fontSize: '14px',
                marginBottom: '10px',
                fontWeight: 500,
              }}>
                Password
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                backgroundColor: COLORS.cardLight,
                borderRadius: '12px',
                padding: '16px',
                border: `1px solid ${COLORS.border}`,
              }}>
                <Lock size={20} color={COLORS.textMuted} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: COLORS.textMuted,
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            margin: '28px 0',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.border }} />
            <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: COLORS.border }} />
          </div>

          {/* Sign Up Link */}
          <p style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: '14px' }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: COLORS.accent,
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Sign up for free
            </Link>
          </p>
        </div>

        {/* Terms */}
        <p style={{
          textAlign: 'center',
          color: COLORS.textMuted,
          fontSize: '12px',
          marginTop: '32px',
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
      </div>

      <Footer />
    </div>
  )
}

export default Login
