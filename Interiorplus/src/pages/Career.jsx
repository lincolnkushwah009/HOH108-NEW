import { useState } from 'react';
import {
  Check,
  Phone,
  Mail,
  ChevronDown,
  Briefcase,
  Users,
  Heart,
  Coffee,
  Award,
  TrendingUp,
  Sparkles,
  Building2,
  GraduationCap,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

const API_BASE = 'https://hoh108.com/api';

const Career = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeValue, setActiveValue] = useState(0);

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
          message: `Position: ${formData.position}, Experience: ${formData.experience} years. ${formData.message}`,
          source: 'website',
          service: 'other',
          websiteSource: 'InteriorPlus',
          leadType: 'career',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', position: '', experience: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { number: '20+', label: 'Years of Excellence' },
    { number: '500+', label: 'Projects Delivered' },
    { number: '100+', label: 'Team Members' },
    { number: '4', label: 'Cities & Growing' },
  ];

  const values = [
    {
      icon: Sparkles,
      title: 'Innovation First',
      desc: 'We push boundaries and embrace new ideas to create exceptional interior solutions.',
      color: '#F59E0B'
    },
    {
      icon: Heart,
      title: 'Customer Obsession',
      desc: 'Every decision we make starts with the customer. Their dream home is our mission.',
      color: '#EF4444'
    },
    {
      icon: Users,
      title: 'Team Spirit',
      desc: 'We believe in collaboration, respect, and growing together as one family.',
      color: '#3B82F6'
    },
    {
      icon: Award,
      title: 'Excellence Always',
      desc: 'We never settle for good enough. Quality is non-negotiable in everything we do.',
      color: '#10B981'
    },
  ];

  const benefits = [
    { icon: TrendingUp, title: 'Career Growth', desc: 'Clear growth paths and promotion opportunities' },
    { icon: GraduationCap, title: 'Learning & Development', desc: 'Regular training and skill enhancement programs' },
    { icon: Coffee, title: 'Work-Life Balance', desc: 'Flexible timings and wellness initiatives' },
    { icon: Heart, title: 'Health Insurance', desc: 'Comprehensive health coverage for you and family' },
    { icon: Award, title: 'Performance Bonus', desc: 'Rewarding excellence with attractive bonuses' },
    { icon: Users, title: 'Team Outings', desc: 'Regular team building and fun activities' },
  ];

  const teamTestimonials = [
    {
      name: 'Priya Menon',
      role: 'Senior Designer',
      tenure: '4 years',
      quote: 'Interior Plus gave me the platform to grow from a junior designer to leading my own projects. The creative freedom and support here is unmatched.',
      image: null,
    },
    {
      name: 'Rahul Sharma',
      role: 'Project Manager',
      tenure: '3 years',
      quote: 'What I love most is the collaborative culture. Everyone from designers to carpenters works together like a family to deliver excellence.',
      image: null,
    },
    {
      name: 'Ananya Reddy',
      role: 'Sales Lead',
      tenure: '2 years',
      quote: 'The growth opportunities here are incredible. I started as a consultant and now lead a team of 5. The company truly invests in its people.',
      image: null,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, backgroundColor: '#111111' }}>
        {/* Hero Section */}
        <section style={{
          padding: '100px 16px',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #111111 50%, #1A1A1A 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '5%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(197, 156, 130, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(197, 156, 130, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(80px)',
          }} />

          <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(197, 156, 130, 0.15)',
                borderRadius: '50px',
                marginBottom: '24px',
              }}>
                <Briefcase size={16} color="#C59C82" />
                <span style={{ color: '#C59C82', fontSize: '14px', fontWeight: '500' }}>We're Hiring</span>
              </div>

              <h1 className="font-heading" style={{
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                color: '#FFFFFF',
                marginBottom: '24px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                lineHeight: '1.1',
              }}>
                Build Your Career,<br />
                <span style={{
                  background: 'linear-gradient(135deg, #C59C82 0%, #E5C4B0 50%, #C59C82 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Design Dreams
                </span>
              </h1>

              <p style={{
                fontSize: '18px',
                color: '#A1A1A1',
                lineHeight: '1.8',
                marginBottom: '40px',
              }}>
                Join India's leading interior design company and be part of a team that transforms
                spaces into stunning homes. We're looking for passionate individuals who want to
                make a difference.
              </p>

              <a
                href="#positions"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 32px',
                  backgroundColor: '#C59C82',
                  color: '#111111',
                  borderRadius: '50px',
                  fontWeight: '600',
                  fontSize: '16px',
                  textDecoration: 'none',
                  transition: 'transform 0.2s',
                }}
              >
                View Open Positions
                <ChevronDown size={20} />
              </a>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              marginTop: '80px',
              maxWidth: '900px',
              margin: '80px auto 0',
            }}>
              {stats.map((stat, index) => (
                <div
                  key={index}
                  style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <p style={{
                    color: '#C59C82',
                    fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    fontFamily: 'Oswald, sans-serif',
                  }}>
                    {stat.number}
                  </p>
                  <p style={{ color: '#A1A1A1', fontSize: '13px' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section style={{ padding: '100px 16px', backgroundColor: '#0A0A0A' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 className="font-heading" style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: '#E5E5E5',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Our <span style={{ color: '#C59C82' }}>Values</span>
              </h2>
              <p style={{ color: '#A1A1A1', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
                These principles guide everything we do and shape our culture
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {values.map((value, index) => (
                <div
                  key={index}
                  onMouseEnter={() => setActiveValue(index)}
                  style={{
                    padding: '32px 28px',
                    backgroundColor: activeValue === index ? '#1A1A1A' : 'transparent',
                    borderRadius: '20px',
                    border: `1px solid ${activeValue === index ? 'rgba(197, 156, 130, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: `${value.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                  }}>
                    <value.icon size={26} color={value.color} />
                  </div>
                  <h3 style={{
                    color: '#FFFFFF',
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    {value.title}
                  </h3>
                  <p style={{ color: '#A1A1A1', fontSize: '15px', lineHeight: '1.7' }}>
                    {value.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section style={{ padding: '100px 16px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 className="font-heading" style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: '#E5E5E5',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Why Join <span style={{ color: '#C59C82' }}>Interior Plus</span>
              </h2>
              <p style={{ color: '#A1A1A1', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
                We offer more than just a job - we offer a career with purpose and great perks
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}>
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(197, 156, 130, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <benefit.icon size={22} color="#C59C82" />
                  </div>
                  <div>
                    <h3 style={{
                      color: '#FFFFFF',
                      fontSize: '17px',
                      fontWeight: '600',
                      marginBottom: '6px',
                    }}>
                      {benefit.title}
                    </h3>
                    <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Testimonials */}
        <section style={{ padding: '100px 16px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 className="font-heading" style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: '#E5E5E5',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Life at <span style={{ color: '#C59C82' }}>Interior Plus</span>
              </h2>
              <p style={{ color: '#A1A1A1', fontSize: '16px' }}>
                Hear from our team members about their journey
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}>
              {teamTestimonials.map((testimonial, index) => (
                <div
                  key={index}
                  style={{
                    padding: '32px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    fontSize: '48px',
                    color: 'rgba(197, 156, 130, 0.2)',
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1,
                  }}>
                    "
                  </div>
                  <p style={{
                    color: '#E5E5E5',
                    fontSize: '16px',
                    lineHeight: '1.8',
                    marginBottom: '24px',
                    fontStyle: 'italic',
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    "{testimonial.quote}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(197, 156, 130, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#C59C82',
                      fontWeight: '600',
                      fontSize: '18px',
                    }}>
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ color: '#FFFFFF', fontWeight: '600', marginBottom: '2px' }}>
                        {testimonial.name}
                      </p>
                      <p style={{ color: '#A1A1A1', fontSize: '13px' }}>
                        {testimonial.role} • {testimonial.tenure}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section id="apply" style={{ padding: '100px 16px', backgroundColor: '#0A0A0A' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2 className="font-heading" style={{
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: '#E5E5E5',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Apply <span style={{ color: '#C59C82' }}>Now</span>
              </h2>
              <p style={{ color: '#A1A1A1', fontSize: '16px' }}>
                Take the first step towards an exciting career
              </p>
            </div>

            <div style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '24px',
              padding: '40px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              {success ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
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
                  <h3 style={{ color: '#FFFFFF', fontSize: '24px', marginBottom: '12px' }}>
                    Application Submitted!
                  </h3>
                  <p style={{ color: '#A1A1A1', fontSize: '16px', lineHeight: '1.7' }}>
                    Thank you for your interest in joining Interior Plus.<br />
                    Our HR team will review your application and get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div style={{
                      padding: '14px 18px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      borderRadius: '10px',
                      marginBottom: '20px',
                      color: '#EF4444',
                      fontSize: '14px',
                    }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Full Name *"
                      required
                      style={{
                        padding: '16px 18px',
                        backgroundColor: '#242424',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
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
                        padding: '16px 18px',
                        backgroundColor: '#242424',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
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
                        padding: '16px 18px',
                        backgroundColor: '#242424',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      placeholder="Years of Experience *"
                      required
                      style={{
                        padding: '16px 18px',
                        backgroundColor: '#242424',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Position Applying For *"
                    required
                    style={{
                      width: '100%',
                      marginTop: '16px',
                      padding: '16px 18px',
                      backgroundColor: '#242424',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      outline: 'none',
                    }}
                  />

                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about yourself and why you want to join Interior Plus (Optional)"
                    rows={4}
                    style={{
                      width: '100%',
                      marginTop: '16px',
                      padding: '16px 18px',
                      backgroundColor: '#242424',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
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
                      width: '100%',
                      marginTop: '24px',
                      padding: '18px',
                      backgroundColor: loading ? '#242424' : '#C59C82',
                      color: loading ? '#A1A1A1' : '#111111',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              )}
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
              fontSize: '1.75rem',
              color: '#E5E5E5',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Have Questions?
            </h2>
            <p style={{
              color: '#A1A1A1',
              marginBottom: '40px',
              fontSize: '16px',
            }}>
              Our HR team is happy to help with any queries about careers at Interior Plus
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(197, 156, 130, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Mail size={20} color="#C59C82" />
                </div>
                <span style={{ color: '#E5E5E5' }}>careers@interiorplus.in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(197, 156, 130, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Phone size={20} color="#C59C82" />
                </div>
                <span style={{ color: '#E5E5E5' }}>+91 9964666610</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(197, 156, 130, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Building2 size={20} color="#C59C82" />
                </div>
                <span style={{ color: '#E5E5E5' }}>Bengaluru, Karnataka</span>
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

export default Career;
