import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import Header from '../components/Header';

const API_BASE = 'https://hoh108.com/api';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and user data (same keys as HOH108 for shared backend)
      localStorage.setItem('hoh108_token', data.token);
      localStorage.setItem('hoh108_user', JSON.stringify(data.user));

      // Redirect to home
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111111' }}>
      <Header />
      <div style={{
        minHeight: 'calc(100vh - 82px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(197, 156, 130, 0.1) 0%, transparent 50%)',
        }} />

        <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="font-heading" style={{
            fontSize: '32px',
            color: '#FFFFFF',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Welcome Back
          </h1>
          <p style={{ color: '#A1A1A1', fontSize: '15px' }}>
            Sign in to access your account
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          backgroundColor: '#1A1A1A',
          borderRadius: '24px',
          padding: '40px 32px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}>
          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <AlertCircle size={18} color="#EF4444" />
              <p style={{ color: '#EF4444', fontSize: '14px', margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#E5E5E5',
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
                backgroundColor: '#242424',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <Mail size={20} color="#A1A1A1" />
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
                    color: '#FFFFFF',
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
                color: '#E5E5E5',
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
                backgroundColor: '#242424',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <Lock size={20} color="#A1A1A1" />
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
                    color: '#FFFFFF',
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
                    color: '#A1A1A1',
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
                backgroundColor: loading ? '#242424' : '#C59C82',
                color: loading ? '#A1A1A1' : '#111111',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
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
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
            <span style={{ color: '#A1A1A1', fontSize: '13px' }}>or</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          </div>

          {/* Sign Up Link */}
          <p style={{ textAlign: 'center', color: '#A1A1A1', fontSize: '14px', margin: 0 }}>
            Don't have an account?{' '}
            <Link
              to="/signup"
              style={{
                color: '#C59C82',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Sign up for free
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          color: '#A1A1A1',
          fontSize: '12px',
          marginTop: '32px',
        }}>
          By signing in, you agree to our{' '}
          <Link to="/privacy-policy" style={{ color: '#C59C82', textDecoration: 'none' }}>
            Privacy Policy
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
};

export default Login;
