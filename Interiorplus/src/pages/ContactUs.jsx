import { useState } from 'react';
import {
  Check,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
} from 'lucide-react';
import { FaInstagram, FaLinkedinIn, FaFacebookF, FaWhatsapp, FaYoutube } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

const API_BASE = 'https://hoh108.com/api';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
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
          email: formData.email,
          phone: formData.phone,
          location: '',
          message: `[INTERIORPLUS - Contact Us] Subject: ${formData.subject}. ${formData.message}`,
          source: 'website',
          service: 'other',
          websiteSource: 'InteriorPlus',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: ['+91 9964666610'],
      action: 'tel:+919964666610',
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['info@interiorplus.in'],
      action: 'mailto:info@interiorplus.in',
    },
    {
      icon: Clock,
      title: 'Working Hours',
      details: ['Mon - Sun: 10:30 AM - 7:30 PM', 'All Days Open'],
      action: null,
    },
  ];

  const locations = [
    {
      city: 'HSR Layout, Bengaluru',
      address: '27th Main Road, HSR Layout Sector 1, Bengaluru, Karnataka 560102',
      phone: '+91 9964666610',
    },
    {
      city: 'Horamavu, Bengaluru',
      address: 'Horamavu Main Road, Bengaluru, Karnataka 560043',
      phone: '+91 9964666611',
    },
    {
      city: 'Hyderabad',
      address: 'Hitech City, Hyderabad, Telangana 500081',
      phone: '+91 9964666613',
    },
  ];

  const socialLinks = [
    { icon: FaInstagram, href: 'https://www.instagram.com/interiorplusindia/', label: 'Instagram' },
    { icon: FaFacebookF, href: 'https://www.facebook.com/InteriorPlus24', label: 'Facebook' },
    { icon: FaLinkedinIn, href: 'https://www.linkedin.com/company/thehomeinteriorplus/', label: 'LinkedIn' },
    { icon: FaYoutube, href: 'https://www.youtube.com/@interiorplusindia', label: 'YouTube' },
    { icon: FaWhatsapp, href: 'https://wa.me/919964666610', label: 'WhatsApp' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, backgroundColor: '#111111' }}>
        {/* Hero Section */}
        <section style={{
          padding: '80px 16px',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #111111 100%)',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="font-heading" style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: '#FFFFFF',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}>
              Get In <span style={{ color: '#C59C82' }}>Touch</span>
            </h1>
            <p style={{
              fontSize: '18px',
              color: '#A1A1A1',
              lineHeight: '1.7',
            }}>
              Have a question or want to discuss your dream interior? We'd love to hear from you.
              Reach out to us and let's create something beautiful together.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section style={{ padding: '60px 16px', backgroundColor: '#0A0A0A' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {contactInfo.map((info, index) => (
                <div
                  key={index}
                  style={{
                    padding: '32px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(197, 156, 130, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <info.icon size={28} color="#C59C82" />
                  </div>
                  <h3 style={{
                    color: '#FFFFFF',
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    {info.title}
                  </h3>
                  {info.details.map((detail, idx) => (
                    <p key={idx} style={{ color: '#A1A1A1', fontSize: '15px', marginBottom: '4px' }}>
                      {info.action ? (
                        <a href={info.action} style={{ color: '#A1A1A1', textDecoration: 'none' }}>
                          {detail}
                        </a>
                      ) : (
                        detail
                      )}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & Map Section */}
        <section style={{ padding: '80px 16px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '48px',
              alignItems: 'start',
            }}>
              {/* Contact Form */}
              <div style={{
                backgroundColor: '#1A1A1A',
                borderRadius: '24px',
                padding: '40px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{ marginBottom: '32px' }}>
                  <h2 className="font-heading" style={{
                    fontSize: '1.75rem',
                    color: '#E5E5E5',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Send Us a <span style={{ color: '#C59C82' }}>Message</span>
                  </h2>
                  <p style={{ color: '#A1A1A1', fontSize: '14px' }}>
                    Fill out the form and we'll get back to you within 24 hours
                  </p>
                </div>

                {success ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                  }}>
                    <div style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}>
                      <Check size={35} color="#22C55E" />
                    </div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '22px', marginBottom: '10px' }}>
                      Message Sent!
                    </h3>
                    <p style={{ color: '#A1A1A1', fontSize: '15px' }}>
                      Thank you for reaching out. We'll get back to you soon.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      style={{
                        marginTop: '24px',
                        padding: '12px 24px',
                        backgroundColor: 'transparent',
                        color: '#C59C82',
                        border: '1px solid #C59C82',
                        borderRadius: '50px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        color: '#EF4444',
                        fontSize: '14px',
                      }}>
                        {error}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your Name *"
                          required
                          style={{
                            padding: '14px 16px',
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            color: '#FFFFFF',
                            fontSize: '15px',
                            outline: 'none',
                          }}
                        />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Phone Number *"
                          required
                          style={{
                            padding: '14px 16px',
                            backgroundColor: '#242424',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            color: '#FFFFFF',
                            fontSize: '15px',
                            outline: 'none',
                          }}
                        />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address *"
                        required
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Subject *"
                        required
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Your Message *"
                        required
                        rows={5}
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          padding: '16px',
                          backgroundColor: loading ? '#242424' : '#C59C82',
                          color: loading ? '#A1A1A1' : '#111111',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {loading ? 'Sending...' : (
                          <>
                            Send Message
                            <Send size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Quick Contact & Social */}
              <div>
                {/* Quick Contact */}
                <div style={{
                  backgroundColor: '#1A1A1A',
                  borderRadius: '24px',
                  padding: '32px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '24px',
                }}>
                  <h3 className="font-heading" style={{
                    fontSize: '1.25rem',
                    color: '#E5E5E5',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Quick <span style={{ color: '#C59C82' }}>Contact</span>
                  </h3>

                  <a
                    href="https://wa.me/919964666610?text=Hi,%20I'm%20interested%20in%20your%20interior%20design%20services"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px 20px',
                      backgroundColor: '#25D366',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      marginBottom: '12px',
                    }}
                  >
                    <FaWhatsapp size={24} color="#FFFFFF" />
                    <div>
                      <p style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '15px', margin: 0 }}>
                        Chat on WhatsApp
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>
                        Quick response guaranteed
                      </p>
                    </div>
                  </a>

                  <a
                    href="tel:+919964666610"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px 20px',
                      backgroundColor: '#242424',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Phone size={24} color="#C59C82" />
                    <div>
                      <p style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '15px', margin: 0 }}>
                        Call Us Now
                      </p>
                      <p style={{ color: '#A1A1A1', fontSize: '13px', margin: 0 }}>
                        +91 9964666610
                      </p>
                    </div>
                  </a>
                </div>

                {/* Social Links */}
                <div style={{
                  backgroundColor: '#1A1A1A',
                  borderRadius: '24px',
                  padding: '32px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}>
                  <h3 className="font-heading" style={{
                    fontSize: '1.25rem',
                    color: '#E5E5E5',
                    marginBottom: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Follow <span style={{ color: '#C59C82' }}>Us</span>
                  </h3>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {socialLinks.map((social, index) => (
                      <a
                        key={index}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={social.label}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '12px',
                          backgroundColor: '#242424',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#A1A1A1',
                          textDecoration: 'none',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <social.icon size={20} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Locations Section */}
        <section style={{ padding: '80px 16px', backgroundColor: '#0A0A0A' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 className="font-heading" style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: '#E5E5E5',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Our <span style={{ color: '#C59C82' }}>Locations</span>
              </h2>
              <p style={{ color: '#A1A1A1', fontSize: '16px' }}>
                Visit us at any of our experience centers
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {locations.map((location, index) => (
                <div
                  key={index}
                  style={{
                    padding: '28px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(197, 156, 130, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <MapPin size={20} color="#C59C82" />
                    </div>
                    <h3 style={{
                      color: '#FFFFFF',
                      fontSize: '18px',
                      fontWeight: '600',
                    }}>
                      {location.city}
                    </h3>
                  </div>
                  <p style={{
                    color: '#A1A1A1',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    marginBottom: '12px',
                  }}>
                    {location.address}
                  </p>
                  <a
                    href={`tel:${location.phone.replace(/\s/g, '')}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#C59C82',
                      fontSize: '14px',
                      textDecoration: 'none',
                    }}
                  >
                    <Phone size={14} />
                    {location.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ContactUs;
