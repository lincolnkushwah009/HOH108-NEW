import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Phone, AlertCircle, Check } from 'lucide-react';
import Header from '../components/Header';

const API_BASE = 'https://hoh108.com/api';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
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
          source: 'InteriorPlus', // To identify leads from this website
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Save token and user data (same keys as HOH108 for shared backend)
      localStorage.setItem('hoh108_token', data.token);
      localStorage.setItem('hoh108_user', JSON.stringify(data.user));

      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
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
          backgroundImage: 'radial-gradient(circle at 70% 80%, rgba(197, 156, 130, 0.1) 0%, transparent 50%)',
        }} />

        <div style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="font-heading" style={{
            fontSize: '32px',
            color: '#FFFFFF',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Create Account
          </h1>
          <p style={{ color: '#A1A1A1', fontSize: '15px' }}>
            Join us and transform your dream home
          </p>
        </div>

        {/* Success Message */}
        {success ? (
          <div style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '24px',
            padding: '48px 32px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Check size={40} color="#22C55E" />
            </div>
            <h2 className="font-heading" style={{ color: '#FFFFFF', fontSize: '24px', marginBottom: '12px', textTransform: 'uppercase' }}>
              Welcome to Interior Plus!
            </h2>
            <p style={{ color: '#A1A1A1', fontSize: '14px' }}>
              Your account has been created successfully. Redirecting...
            </p>
          </div>
        ) : (
          /* Signup Card */
          <div style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '24px',
            padding: '36px 32px',
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
                marginBottom: '20px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}>
                <AlertCircle size={18} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '14px', margin: 0 }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Name Field */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  color: '#E5E5E5',
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
                  backgroundColor: '#242424',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <User size={20} color="#A1A1A1" />
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
                      color: '#FFFFFF',
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
                  color: '#E5E5E5',
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
                  backgroundColor: '#242424',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <Mail size={20} color="#A1A1A1" />
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
                      color: '#FFFFFF',
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
                  color: '#E5E5E5',
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
                  backgroundColor: '#242424',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <Phone size={20} color="#A1A1A1" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9964666610"
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

              {/* Password Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: '#E5E5E5',
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
                    backgroundColor: '#242424',
                    borderRadius: '12px',
                    padding: '14px 12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}>
                    <Lock size={18} color="#A1A1A1" />
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
                        color: '#FFFFFF',
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
                    color: '#E5E5E5',
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
                    backgroundColor: '#242424',
                    borderRadius: '12px',
                    padding: '14px 12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}>
                    <Lock size={18} color="#A1A1A1" />
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
                        color: '#FFFFFF',
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
                color: '#A1A1A1',
                fontSize: '13px',
                marginBottom: '24px',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={() => setShowPassword(!showPassword)}
                  style={{ accentColor: '#C59C82' }}
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
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Sign In Link */}
            <p style={{
              textAlign: 'center',
              color: '#A1A1A1',
              fontSize: '14px',
              marginTop: '24px',
              marginBottom: 0,
            }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#C59C82',
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
          {['Free Consultation', 'Track Projects', 'Exclusive Offers'].map((benefit, i) => (
            <span
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#A1A1A1',
                fontSize: '12px',
              }}
            >
              <Check size={14} color="#C59C82" />
              {benefit}
            </span>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Signup;
