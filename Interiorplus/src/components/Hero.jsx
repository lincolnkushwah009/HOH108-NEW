import { useState } from 'react';
import heroImage from '../assets/hero-bg.jpg';

const API_BASE = 'https://hoh108.com/api';

const Hero = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.mobile,
          email: formData.email,
          location: formData.pincode,
          source: 'website',
          service: 'consultation',
          websiteSource: 'InteriorPlus',
          message: '[INTERIORPLUS - Homepage] Free consultation request',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit');
      }

      setSuccess(true);
      setFormData({ name: '', mobile: '', email: '', pincode: '' });

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '16px',
    backgroundColor: '#111111',
    border: '1px solid #1A1A1A',
    borderRadius: '12px',
    color: '#E5E5E5',
    fontSize: '1rem',
    outline: 'none',
  };

  return (
    <section id="consultation" style={{
      backgroundColor: '#111111',
      padding: '80px 0',
      backgroundImage: `linear-gradient(rgba(17, 17, 17, 0.85), rgba(17, 17, 17, 0.92)), url(${heroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
          {/* Left Content */}
          <div>
            <h1 className="font-heading" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 'bold', color: '#E5E5E5', lineHeight: 1.2, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dream home interiors can become{' '}
              <span style={{ color: '#C59C82' }}>your reality</span>
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#A1A1A1', marginBottom: '32px' }}>
              We're a team that will blend your ideas with our expertise to create the perfect space for you.
            </p>

            {/* Stats */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
              <div style={{ textAlign: 'center' }}>
                <p className="font-heading" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#C59C82' }}>500+</p>
                <p style={{ color: '#A1A1A1' }}>Happy Homes</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p className="font-heading" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#C59C82' }}>10+</p>
                <p style={{ color: '#A1A1A1' }}>Years Warranty</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p className="font-heading" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#C59C82' }}>45</p>
                <p style={{ color: '#A1A1A1' }}>Days Delivery</p>
              </div>
            </div>
          </div>

          {/* Right - Form */}
          <div style={{ backgroundColor: '#1A1A1A', borderRadius: '24px', padding: '32px', border: '1px solid rgba(197, 156, 130, 0.1)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ backgroundColor: 'rgba(197, 156, 130, 0.1)', color: '#C59C82', padding: '4px 16px', borderRadius: '50px', fontSize: '0.875rem', fontWeight: '500' }}>
                FREE CONSULTATION
              </span>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginTop: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Get Free 3D Design Consultation
              </h2>
              <p style={{ color: '#A1A1A1', marginTop: '8px' }}>
                Fill in your details and our expert will reach out to you
              </p>
            </div>

            {success ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <h3 style={{ color: '#22C55E', fontSize: '20px', marginBottom: '8px' }}>Thank You!</h3>
                <p style={{ color: '#A1A1A1', fontSize: '14px' }}>
                  Our design expert will contact you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {error && (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}>
                    <p style={{ color: '#EF4444', fontSize: '14px', margin: 0 }}>{error}</p>
                  </div>
                )}
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Name *"
                  required
                  disabled={loading}
                  style={inputStyle}
                />
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="Mobile Number *"
                  required
                  pattern="[0-9]{10}"
                  disabled={loading}
                  style={inputStyle}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address *"
                  required
                  disabled={loading}
                  style={inputStyle}
                />
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Pincode *"
                  required
                  pattern="[0-9]{6}"
                  disabled={loading}
                  style={inputStyle}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: loading ? '#242424' : '#C59C82',
                    color: loading ? '#A1A1A1' : '#111111',
                    padding: '16px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '1.125rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Submitting...' : 'Get Free Quote'}
                </button>
              </form>
            )}

            <p style={{ fontSize: '0.75rem', color: '#A1A1A1', textAlign: 'center', marginTop: '16px' }}>
              By submitting this form, you agree to our Privacy Policy and Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
