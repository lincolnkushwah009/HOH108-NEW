import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Handshake } from 'lucide-react'
import { useChannelPartnerAuth } from '../context/ChannelPartnerAuthContext'

const PRIMARY_COLOR = '#C59C82'
const PRIMARY_DARK = '#a8825e'

const ChannelPartnerLogin = () => {
  const navigate = useNavigate()
  const { login } = useChannelPartnerAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      navigate('/channel-partner-portal', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    height: '56px',
    padding: '0 20px',
    fontSize: '16px',
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '16px',
    color: '#1e293b',
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '15px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '12px',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 50%, #8b6d4f 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
    }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '80px',
          width: '288px',
          height: '288px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          filter: 'blur(48px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '80px',
          width: '384px',
          height: '384px',
          background: 'rgba(197,156,130,0.3)',
          borderRadius: '50%',
          filter: 'blur(48px)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '460px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            borderRadius: '28px',
            marginBottom: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}>
            <Handshake size={56} color="white" strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: '40px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>Channel Partner Portal</h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)' }}>Sign in to manage your leads</p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'white',
          borderRadius: '32px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          padding: '48px 40px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>Welcome back</h2>
            <p style={{ fontSize: '16px', color: '#64748b' }}>Sign in to your partner account</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                marginBottom: '24px',
                padding: '16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '16px',
              }}>
                <p style={{ fontSize: '14px', color: '#dc2626', textAlign: 'center', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                placeholder="partner@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = PRIMARY_COLOR
                  e.target.style.backgroundColor = 'white'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.backgroundColor = '#f8fafc'
                }}
                required
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ ...inputStyle, paddingRight: '56px' }}
                  onFocus={(e) => {
                    e.target.style.borderColor = PRIMARY_COLOR
                    e.target.style.backgroundColor = 'white'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.backgroundColor = '#f8fafc'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: '#94a3b8',
                  }}
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginBottom: '32px',
            }}>
              <Link
                to="/channel-partner-portal/forgot-password"
                style={{ fontSize: '15px', color: PRIMARY_COLOR, fontWeight: '600', textDecoration: 'none' }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '56px',
                background: PRIMARY_COLOR,
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontSize: '17px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: `0 10px 40px -10px rgba(197,156,130,0.5)`,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = PRIMARY_DARK)}
              onMouseOut={(e) => !loading && (e.target.style.background = PRIMARY_COLOR)}
            >
              {loading ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: '24px', height: '24px' }} viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Help Link */}
          <div style={{
            marginTop: '40px',
            paddingTop: '32px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
              Need help?{' '}
              <a href="mailto:partners@hoh108.com" style={{ color: PRIMARY_COLOR, fontWeight: '600', textDecoration: 'none' }}>
                Contact Partner Support
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '14px', marginTop: '40px' }}>
          &copy; {new Date().getFullYear()} HOH108. All rights reserved.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ChannelPartnerLogin
