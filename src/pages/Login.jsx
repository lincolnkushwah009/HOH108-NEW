import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Header from '../components/Header'
import { COLORS, API_BASE } from '../constants/colors'

const EASE = [0.16, 1, 0.3, 1]

function Login() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Login failed')
      localStorage.setItem('hoh108_token', data.token)
      localStorage.setItem('hoh108_user', JSON.stringify(data.user))
      navigate('/')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, phone: signupPhone, password: signupPassword }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Registration failed')
      localStorage.setItem('hoh108_token', data.token)
      localStorage.setItem('hoh108_user', JSON.stringify(data.user))
      navigate('/')
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%',
    backgroundColor: '#F5F5F5',
    border: 'none',
    borderRadius: '50px',
    padding: '16px 24px',
    color: '#0F172A',
    fontSize: '14px',
    fontFamily: "'Raleway', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF5F2' }}>
      <Header />

      <div style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(100px, 12vw, 140px) clamp(16px, 4vw, 80px) 60px',
      }}>
        {/* Main container — fixed size, overflow hidden for sliding */}
        <div className="login-container" style={{
          width: '100%',
          maxWidth: '880px',
          height: '560px',
          position: 'relative',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          backgroundColor: '#fff',
        }}>

          {/* ===== SIGN IN FORM (always on left half) ===== */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '50%',
            height: '100%',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 1,
          }}>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '32px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: '8px' }}>
              Sign In
            </h1>
            <p style={{ fontFamily: "'Raleway', sans-serif", color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>
              Sign in with Email & Password
            </p>

            {error && !isSignUp && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertCircle size={15} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0, fontFamily: "'Raleway', sans-serif" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Enter E-mail" required style={{ ...inputStyle, marginBottom: '14px' }} />
              <div style={{ position: 'relative', marginBottom: '14px' }}>
                <input type={showPassword ? 'text' : 'password'} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter Password" required style={{ ...inputStyle, paddingRight: '50px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p style={{ textAlign: 'center', marginBottom: '18px' }}>
                <Link to="#" style={{ fontFamily: "'Raleway', sans-serif", color: COLORS.accent, fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>Forgot Password?</Link>
              </p>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '15px',
                background: 'linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)',
                color: '#fff', border: 'none', borderRadius: '50px',
                fontSize: '13px', fontWeight: 700, fontFamily: "'Raleway', sans-serif",
                textTransform: 'uppercase', letterSpacing: '1.5px',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
                {loading && !isSignUp ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* ===== SIGN UP FORM (always on right half) ===== */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '100%',
            padding: '40px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 1,
          }}>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '28px', fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', marginBottom: '6px', textAlign: 'center' }}>
              Create Account
            </h1>
            <p style={{ fontFamily: "'Raleway', sans-serif", color: '#64748B', fontSize: '13px', marginBottom: '24px', textAlign: 'center' }}>
              Register with E-mail
            </p>

            {error && isSignUp && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: '10px', marginBottom: '12px', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertCircle size={15} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0, fontFamily: "'Raleway', sans-serif" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSignup}>
              <input type="text" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="Name" required style={{ ...inputStyle, marginBottom: '12px' }} />
              <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="Enter E-mail" required style={{ ...inputStyle, marginBottom: '12px' }} />
              <input type="tel" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} placeholder="Phone Number" required style={{ ...inputStyle, marginBottom: '12px' }} />
              <div style={{ position: 'relative', marginBottom: '20px' }}>
                <input type={showPassword ? 'text' : 'password'} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Enter Password" required style={{ ...inputStyle, paddingRight: '50px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '15px',
                background: 'linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)',
                color: '#fff', border: 'none', borderRadius: '50px',
                fontSize: '13px', fontWeight: 700, fontFamily: "'Raleway', sans-serif",
                textTransform: 'uppercase', letterSpacing: '1.5px',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              }}>
                {loading && isSignUp ? 'Creating...' : 'Sign Up'}
              </button>
            </form>
          </div>

          {/* ===== SLIDING DARK OVERLAY PANEL ===== */}
          <motion.div
            animate={{ x: isSignUp ? '-100%' : '0%' }}
            transition={{ type: 'spring', stiffness: 200, damping: 30, mass: 0.8 }}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '50%',
              height: '100%',
              backgroundColor: '#111111',
              borderRadius: '20px',
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 40px',
              textAlign: 'center',
            }}
          >
            <motion.div
              key={isSignUp ? 'welcome' : 'hello'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease: EASE }}
            >
              <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '32px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', marginBottom: '16px' }}>
                {isSignUp ? 'Welcome Back!' : 'Hello There!'}
              </h2>
              <p style={{ fontFamily: "'Raleway', sans-serif", color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: 1.7, maxWidth: '260px', margin: '0 auto 32px' }}>
                {isSignUp
                  ? 'Already have an account? Sign in to access your dashboard and projects.'
                  : 'New to HOH108? Create an account and start designing your dream home.'}
              </p>
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                style={{
                  padding: '14px 40px',
                  borderRadius: '50px',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: "'Raleway', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="max-width: 880px"] {
            height: auto !important;
          }
          div[style*="max-width: 880px"] > div[style*="width: 50%"] {
            position: relative !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Login
