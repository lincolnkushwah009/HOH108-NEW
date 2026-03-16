import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, MapPin, Phone, Mail, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

const API_BASE = 'https://hoh108.com/api';

const Franchise = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

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
          location: formData.city,
          message: formData.message,
          source: 'website',
          service: 'other',
          websiteSource: 'InteriorPlus',
          leadType: 'franchise',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit inquiry');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', city: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { title: 'Robust Supply Chain', desc: 'Integrated supply chain for seamless operations' },
    { title: 'Operational Support', desc: 'Comprehensive end-to-end operational guidance' },
    { title: 'Brand Credibility', desc: 'Leverage our established brand reputation' },
    { title: '300% ROI', desc: 'Projected returns over 5 years' },
    { title: 'Break-even in 24-30 Months', desc: 'Quick return on your investment' },
    { title: '5-Year Partnership', desc: 'Long-term partnership framework' },
  ];

  const responsibilities = [
    'Oversee installation services in your territory',
    'Maintain a premium studio space (3,000-3,500 sq ft)',
    'Ensure brand consistency and quality standards',
    'Manage local marketing and customer relationships',
    'Coordinate with central team for operations',
  ];

  const locations = [
    'Bengaluru (Whitefield, Hebbal)',
    'Kolkata',
    'Chennai',
    'Pune',
    'Mumbai',
  ];

  const faqs = [
    {
      q: 'What is the contract duration?',
      a: 'The franchise agreement is for a 5-year term with options for renewal based on performance.',
    },
    {
      q: 'What is the expected break-even timeline?',
      a: 'Based on our existing franchises, partners typically break even within 24-30 months.',
    },
    {
      q: 'What ROI can I expect?',
      a: 'Our franchise model projects approximately 300% ROI over the 5-year agreement period.',
    },
    {
      q: 'What pre-launch support is provided?',
      a: 'We provide complete support including site selection, interior setup, staff training, marketing launch, and operational handholding.',
    },
    {
      q: 'What is the initial investment required?',
      a: 'The initial investment is approximately ₹1.3 Cr, which includes franchise fee, showroom setup, and initial inventory. Costs may vary by location.',
    },
  ];

  const testimonials = [
    { name: 'Rajesh Kumar', location: 'Bengaluru', quote: 'The support from Interior Plus has been exceptional. Fast response time and quality products.' },
    { name: 'Priya Sharma', location: 'Chennai', quote: 'Best decision I made was partnering with Interior Plus. The brand value speaks for itself.' },
    { name: 'Amit Patel', location: 'Pune', quote: 'The operational support and supply chain integration made starting up incredibly smooth.' },
    { name: 'Neha Gupta', location: 'Kolkata', quote: 'Great ROI and the team is always there to help. Highly recommend this franchise opportunity.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, backgroundColor: '#111111' }}>
        {/* Hero Section */}
        <section style={{
          padding: '80px 16px',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #111111 100%)',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
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

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '48px',
              alignItems: 'start',
            }}>
              {/* Left Content */}
              <div>
                <h1 className="font-heading" style={{
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  color: '#FFFFFF',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: '1.2',
                }}>
                  Become Proud Owner of <span style={{ color: '#C59C82' }}>Interior Plus Franchise</span>
                </h1>
                <p style={{
                  fontSize: '18px',
                  color: '#A1A1A1',
                  lineHeight: '1.7',
                  marginBottom: '24px',
                }}>
                  Join India's leading interior design brand with 20 years of expertise.
                  We provide end-to-end solutions for individual consumers and businesses.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  marginTop: '32px',
                }}>
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(197, 156, 130, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#C59C82', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>₹1.3 Cr</p>
                    <p style={{ color: '#A1A1A1', fontSize: '13px' }}>Initial Investment</p>
                  </div>
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(197, 156, 130, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#C59C82', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>300%</p>
                    <p style={{ color: '#A1A1A1', fontSize: '13px' }}>Projected ROI (5 Years)</p>
                  </div>
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(197, 156, 130, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#C59C82', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>24-30</p>
                    <p style={{ color: '#A1A1A1', fontSize: '13px' }}>Months to Break-even</p>
                  </div>
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(197, 156, 130, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#C59C82', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>3,500</p>
                    <p style={{ color: '#A1A1A1', fontSize: '13px' }}>Sq Ft Showroom</p>
                  </div>
                </div>
              </div>

              {/* Registration Form */}
              <div style={{
                backgroundColor: '#1A1A1A',
                borderRadius: '24px',
                padding: '32px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <h2 className="font-heading" style={{
                  fontSize: '1.5rem',
                  color: '#E5E5E5',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Register Your Interest
                </h2>
                <p style={{ color: '#A1A1A1', fontSize: '14px', marginBottom: '24px' }}>
                  Fill out the form and our team will contact you
                </p>

                {success ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}>
                      <Check size={30} color="#22C55E" />
                    </div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '20px', marginBottom: '8px' }}>
                      Thank You!
                    </h3>
                    <p style={{ color: '#A1A1A1', fontSize: '14px' }}>
                      Our franchise team will contact you within 24 hours.
                    </p>
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
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Full Name *"
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
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City *"
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
                        placeholder="Your Message (Optional)"
                        rows={3}
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
                        {loading ? 'Submitting...' : 'Submit Inquiry'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section style={{ padding: '80px 16px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '48px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Why Partner With <span style={{ color: '#C59C82' }}>Interior Plus</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  style={{
                    padding: '28px 24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <h3 style={{
                    color: '#C59C82',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}>
                    {benefit.title}
                  </h3>
                  <p style={{ color: '#A1A1A1', fontSize: '14px' }}>
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Responsibilities Section */}
        <section style={{ padding: '80px 16px', backgroundColor: '#0A0A0A' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '48px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Franchisee <span style={{ color: '#C59C82' }}>Responsibilities</span>
            </h2>

            <div style={{
              maxWidth: '700px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {responsibilities.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px 24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#C59C82',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#111111',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}>
                    {index + 1}
                  </div>
                  <span style={{ color: '#E5E5E5', fontSize: '15px' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ padding: '80px 16px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '48px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Partner <span style={{ color: '#C59C82' }}>Testimonials</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  style={{
                    padding: '28px 24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <p style={{
                    color: '#E5E5E5',
                    fontSize: '15px',
                    lineHeight: '1.7',
                    marginBottom: '16px',
                    fontStyle: 'italic',
                  }}>
                    "{testimonial.quote}"
                  </p>
                  <p style={{ color: '#C59C82', fontWeight: '600', marginBottom: '4px' }}>
                    {testimonial.name}
                  </p>
                  <p style={{ color: '#A1A1A1', fontSize: '13px' }}>
                    {testimonial.location}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Available Locations */}
        <section style={{ padding: '80px 16px', backgroundColor: '#0A0A0A' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '48px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Available <span style={{ color: '#C59C82' }}>Locations</span>
            </h2>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '16px',
            }}>
              {locations.map((location, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '50px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <MapPin size={16} color="#C59C82" />
                  <span style={{ color: '#E5E5E5', fontSize: '14px' }}>{location}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '80px 16px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '48px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Frequently Asked <span style={{ color: '#C59C82' }}>Questions</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#1A1A1A',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ color: '#E5E5E5', fontSize: '15px', fontWeight: '500' }}>
                      {faq.q}
                    </span>
                    {openFaq === index ? (
                      <ChevronUp size={20} color="#C59C82" />
                    ) : (
                      <ChevronDown size={20} color="#A1A1A1" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div style={{
                      padding: '0 24px 20px',
                      color: '#A1A1A1',
                      fontSize: '14px',
                      lineHeight: '1.7',
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section style={{
          padding: '80px 16px',
          backgroundColor: '#1A1A1A',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Get In Touch
            </h2>
            <p style={{
              color: '#A1A1A1',
              marginBottom: '40px',
              fontSize: '16px',
            }}>
              Have questions? Our franchise team is here to help.
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={20} color="#C59C82" />
                <span style={{ color: '#E5E5E5' }}>+91 9964666610</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={20} color="#C59C82" />
                <span style={{ color: '#E5E5E5' }}>franchise@interiorplus.in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={20} color="#C59C82" />
                <span style={{ color: '#E5E5E5' }}>Mon-Sun: 10:30 AM - 7:30 PM</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Franchise;
