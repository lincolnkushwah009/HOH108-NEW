import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, ArrowLeft, LogOut, Edit2, Check, X } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

const API_BASE = 'https://hoh108.com/api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('hoh108_token');

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetch full user data from API
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch user data');
        }

        const userData = data.user;
        setUser(userData);
        setFormData({ name: userData.name || '', phone: userData.phone || '' });

        // Update localStorage with full user data
        localStorage.setItem('hoh108_user', JSON.stringify(userData));
      } catch (err) {
        console.error('Error fetching user:', err);
        // If token is invalid, redirect to login
        localStorage.removeItem('hoh108_token');
        localStorage.removeItem('hoh108_user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('hoh108_token');
    localStorage.removeItem('hoh108_user');
    navigate('/');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('hoh108_token');
      const response = await fetch(`${API_BASE}/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update local storage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('hoh108_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: user.name || '', phone: user.phone || '' });
    setEditing(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#A1A1A1' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, backgroundColor: '#111111', padding: '48px 0' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 16px' }}>
          {/* Back Button */}
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#A1A1A1',
              textDecoration: 'none',
              fontSize: '14px',
              marginBottom: '32px',
            }}
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>

          {/* Profile Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: '#C59C82',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '40px',
              color: '#111111',
              fontWeight: 'bold',
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h1 className="font-heading" style={{
              fontSize: '28px',
              color: '#FFFFFF',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              My Profile
            </h1>
            <p style={{ color: '#A1A1A1' }}>Manage your account information</p>
          </div>

          {/* Message */}
          {message.text && (
            <div style={{
              padding: '14px 16px',
              borderRadius: '12px',
              marginBottom: '24px',
              backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: message.type === 'success' ? '#22C55E' : '#EF4444',
              fontSize: '14px',
            }}>
              {message.text}
            </div>
          )}

          {/* Profile Card */}
          <div style={{
            backgroundColor: '#1A1A1A',
            borderRadius: '24px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            {/* Edit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#C59C82',
                    border: '1px solid #C59C82',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  <Edit2 size={16} />
                  Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleCancel}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 20px',
                      backgroundColor: 'transparent',
                      color: '#A1A1A1',
                      border: '1px solid #A1A1A1',
                      borderRadius: '50px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 20px',
                      backgroundColor: '#C59C82',
                      color: '#111111',
                      border: 'none',
                      borderRadius: '50px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    <Check size={16} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {/* Profile Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Name */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#A1A1A1',
                  fontSize: '13px',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <User size={14} />
                  Full Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: '#242424',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '500' }}>
                    {user?.name || 'Not provided'}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#A1A1A1',
                  fontSize: '13px',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <Mail size={14} />
                  Email Address
                </label>
                <p style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '500' }}>
                  {user?.email || 'Not provided'}
                </p>
                <p style={{ color: '#A1A1A1', fontSize: '12px', marginTop: '4px' }}>
                  Email cannot be changed
                </p>
              </div>

              {/* Phone */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#A1A1A1',
                  fontSize: '13px',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <Phone size={14} />
                  Phone Number
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: '#242424',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <p style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '500' }}>
                    {user?.phone || 'Not provided'}
                  </p>
                )}
              </div>

              {/* Member Since */}
              <div>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#A1A1A1',
                  fontSize: '13px',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  <Calendar size={14} />
                  Member Since
                </label>
                <p style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '500' }}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'transparent',
              color: '#EF4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            <LogOut size={20} />
            Logout
          </button>

          {/* Quick Links */}
          <div style={{
            marginTop: '32px',
            padding: '24px',
            backgroundColor: '#1A1A1A',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <h3 className="font-heading" style={{
              fontSize: '16px',
              color: '#E5E5E5',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Quick Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                to="/#consultation"
                style={{
                  color: '#C59C82',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                Book a Free Consultation
              </Link>
              <Link
                to="/#kitchen"
                style={{
                  color: '#A1A1A1',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                Explore Modular Kitchens
              </Link>
              <Link
                to="/privacy-policy"
                style={{
                  color: '#A1A1A1',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Profile;
