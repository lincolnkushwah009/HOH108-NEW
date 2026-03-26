import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { COLORS, API_BASE } from '../constants/colors'

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

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

      localStorage.setItem('hoh108_token', data.token)
      localStorage.setItem('hoh108_user', JSON.stringify(data.user))

      setSuccess(true)

      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    backgroundColor: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '15px 16px',
    color: COLORS.textDark,
    fontSize: '15px',
    fontFamily: 'Raleway, sans-serif',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  }

  const focusHandler = (e) => {
    e.currentTarget.style.borderColor = COLORS.accent
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(197,156,130,0.15)'
  }

  const blurHandler = (e) => {
    e.currentTarget.style.borderColor = COLORS.border
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.canvas, display: 'flex', flexDirection: 'column' }}>
      <Header />

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        paddingTop: '120px',
        paddingBottom: '60px',
      }}>
        <div style={{ width: '100%', maxWidth: '860px' }}>
          {/* Success State */}
          {success ? (
            <div style={{
              backgroundColor: COLORS.white,
              borderRadius: '24px',
              padding: '56px 32px',
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              textAlign: 'center',
              maxWidth: '480px',
              margin: '0 auto',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34,197,94,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <Check size={40} color="#22C55E" />
              </div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif",
                color: COLORS.textDark,
                fontSize: '28px',
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}>
                Welcome to HOH108!
              </h2>
              <p style={{
                fontFamily: 'Raleway, sans-serif',
                color: COLORS.textMuted,
                fontSize: '15px',
              }}>
                Your account has been created successfully. Redirecting...
              </p>
            </div>
          ) : (
            /* Signup Card */
            <div style={{
              backgroundColor: COLORS.white,
              borderRadius: '24px',
              padding: 'clamp(32px, 5vw, 56px)',
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              maxWidth: '480px',
              margin: '0 auto',
            }}>
              {/* Heading */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Link to="/" style={{ display: 'inline-block' }}>
                  <img
                    src="/Logo.png"
                    alt="HOH108"
                    style={{ height: '50px', display: 'block', margin: '0 auto 20px' }}
                  />
                </Link>
                <h1 style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 'clamp(28px, 4vw, 36px)',
                  color: COLORS.textDark,
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Create Your Account
                </h1>
                <p style={{
                  fontFamily: 'Raleway, sans-serif',
                  color: COLORS.textMuted,
                  fontSize: '15px',
                }}>
                  Join us and start your design journey
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 16px',
                  backgroundColor: 'rgba(239,68,68,0.06)',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid rgba(239,68,68,0.15)',
                }}>
                  <AlertCircle size={18} color="#EF4444" />
                  <p style={{ fontFamily: 'Raleway, sans-serif', color: '#EF4444', fontSize: '14px' }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Raleway, sans-serif',
                    color: COLORS.textDark,
                    fontSize: '14px',
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    style={inputStyle}
                    onFocus={focusHandler}
                    onBlur={blurHandler}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Raleway, sans-serif',
                    color: COLORS.textDark,
                    fontSize: '14px',
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    style={inputStyle}
                    onFocus={focusHandler}
                    onBlur={blurHandler}
                  />
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontFamily: 'Raleway, sans-serif',
                    color: COLORS.textDark,
                    fontSize: '14px',
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    style={inputStyle}
                    onFocus={focusHandler}
                    onBlur={blurHandler}
                  />
                </div>

                {/* Password Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: 'Raleway, sans-serif',
                      color: COLORS.textDark,
                      fontSize: '14px',
                      marginBottom: '8px',
                      fontWeight: 600,
                    }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 chars"
                        required
                        style={{ ...inputStyle, paddingRight: '44px' }}
                        onFocus={focusHandler}
                        onBlur={blurHandler}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: COLORS.textMuted,
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontFamily: 'Raleway, sans-serif',
                      color: COLORS.textDark,
                      fontSize: '14px',
                      marginBottom: '8px',
                      fontWeight: 600,
                    }}>
                      Confirm
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm"
                      required
                      style={inputStyle}
                      onFocus={focusHandler}
                      onBlur={blurHandler}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: loading ? COLORS.accentLight : COLORS.accent,
                    color: loading ? COLORS.textMuted : COLORS.white,
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = COLORS.accentDark
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(197,156,130,0.35)'
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
                fontFamily: 'Raleway, sans-serif',
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
                    fontWeight: 600,
                  }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}

          {/* Benefits */}
          {!success && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '24px',
              marginTop: '28px',
              flexWrap: 'wrap',
            }}>
              {['Earn Karma Points', 'Track Projects', 'Exclusive Offers'].map((benefit, i) => (
                <span
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'Raleway, sans-serif',
                    color: COLORS.textMuted,
                    fontSize: '13px',
                  }}
                >
                  <Check size={14} color={COLORS.accent} />
                  {benefit}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Signup
