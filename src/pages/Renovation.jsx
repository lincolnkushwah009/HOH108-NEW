import { useState } from 'react';
import { ArrowRight, Users, Shield, Clock, DollarSign, Award, Heart, Home, Building2, Paintbrush, Wrench, RefreshCw, Sparkles, CheckCircle, Phone, Mail, ChevronDown } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { COLORS } from '../constants/colors';

const Renovation = () => {
  const [activeProcess, setActiveProcess] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    {
      icon: Users,
      title: 'Expert Craftsmen',
      description: 'Our skilled team transforms spaces with precision, bringing decades of renovation expertise to every project.'
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: 'Premium materials and meticulous workmanship backed by our comprehensive satisfaction guarantee.'
    },
    {
      icon: Clock,
      title: 'Minimal Disruption',
      description: 'Efficient project timelines designed to get you back to normal life as quickly as possible.'
    },
    {
      icon: DollarSign,
      title: 'Fixed Pricing',
      description: 'Detailed quotes with no hidden costs. Know your full investment upfront before we begin.'
    },
    {
      icon: Award,
      title: 'Design Excellence',
      description: 'Creative solutions that maximize space, natural light, and everyday functionality.'
    },
    {
      icon: Heart,
      title: 'Personalized Approach',
      description: 'Every renovation is tailored to your unique lifestyle, taste, and budget requirements.'
    }
  ];

  const services = [
    {
      icon: Home,
      title: 'Complete Home Renovation',
      description: 'Full-scale transformations that reimagine your entire living space from floor to ceiling.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
      features: ['Structural modifications', 'Layout redesign', 'Modern upgrades', 'Energy efficiency']
    },
    {
      icon: Paintbrush,
      title: 'Kitchen Remodeling',
      description: 'Transform your kitchen into a functional, beautiful heart of your home.',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
      features: ['Custom cabinetry', 'Premium countertops', 'Modern appliances', 'Smart storage']
    },
    {
      icon: Sparkles,
      title: 'Bathroom Renovation',
      description: 'Create spa-like retreats with modern fixtures and elegant finishes.',
      image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop',
      features: ['Luxury fixtures', 'Tile work', 'Vanity design', 'Lighting design']
    },
    {
      icon: Building2,
      title: 'Commercial Renovation',
      description: 'Upgrade your business space to enhance productivity and impress clients.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
      features: ['Office redesign', 'Retail makeovers', 'Restaurant fit-outs', 'Lobby upgrades']
    },
    {
      icon: RefreshCw,
      title: 'Room Additions',
      description: 'Expand your living space with seamlessly integrated room additions.',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop',
      features: ['Bedroom additions', 'Home offices', 'Sunrooms', 'In-law suites']
    },
    {
      icon: Wrench,
      title: 'Restoration & Repair',
      description: 'Preserve heritage while modernizing functionality in older properties.',
      image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop',
      features: ['Heritage restoration', 'Structural repairs', 'Foundation work', 'Weatherproofing']
    }
  ];

  const process = [
    {
      step: '01',
      title: 'Consultation',
      description: 'We start with an in-depth discussion to understand your vision, needs, and budget. Our team assesses your space and provides initial recommendations.'
    },
    {
      step: '02',
      title: 'Design & Planning',
      description: 'Our designers create detailed plans and 3D visualizations. We finalize materials, timelines, and provide a comprehensive fixed-price quote.'
    },
    {
      step: '03',
      title: 'Renovation',
      description: 'Our skilled craftsmen execute the renovation with precision. Regular updates keep you informed, and our project managers ensure quality at every stage.'
    },
    {
      step: '04',
      title: 'Final Reveal',
      description: 'Walk through your transformed space with our team. We address any final touches and ensure your complete satisfaction before project completion.'
    }
  ];

  const faqs = [
    {
      question: 'How long does a typical renovation take?',
      answer: 'Project timelines vary based on scope. A bathroom renovation typically takes 2-3 weeks, a kitchen remodel 4-6 weeks, and a complete home renovation 8-12 weeks. We provide a detailed timeline during the planning phase.'
    },
    {
      question: 'Do you provide a fixed-price quote?',
      answer: 'Yes, we provide comprehensive fixed-price quotes after the initial consultation and site assessment. There are no hidden costs or surprise charges. Any changes to scope are discussed and approved by you before proceeding.'
    },
    {
      question: 'Can I live in my home during renovation?',
      answer: 'In most cases, yes. We plan the renovation in phases to minimize disruption to your daily life. For extensive whole-home renovations, we may recommend temporary relocation for certain phases.'
    },
    {
      question: 'What materials do you use?',
      answer: 'We source premium materials from trusted suppliers. During the planning phase, you will select from curated options that balance quality, aesthetics, and budget. We never compromise on structural or safety materials.'
    },
    {
      question: 'Do you handle permits and approvals?',
      answer: 'Absolutely. Our team manages all necessary permits, approvals, and inspections required for your renovation project. This is included in our project management scope.'
    }
  ];

  const sectionPill = (text) => ({
    display: 'inline-block',
    backgroundColor: COLORS.canvas,
    color: COLORS.accent,
    padding: '8px 20px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '20px',
    border: `1px solid ${COLORS.border}`
  });

  const sectionHeading = {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 'clamp(28px, 5vw, 44px)',
    fontWeight: 400,
    color: COLORS.textDark,
    lineHeight: 1.2,
    textTransform: 'uppercase'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.white, color: COLORS.textDark }}>
      <Header />

      {/* Hero Section */}
      <section style={{ padding: '80px 0 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 80px)' }}>
          <div style={{ position: 'relative', width: '100%', borderRadius: '20px', overflow: 'hidden', minHeight: '500px' }}>
            <img src="https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1920&h=1080&fit=crop" alt="Renovation" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0.55)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,17,17,0.5) 0%, transparent 60%)' }} />
            <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(48px, 8vw, 80px) clamp(32px, 6vw, 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: '500px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 20px', borderRadius: '9999px', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '24px', fontFamily: "'Raleway', sans-serif" }}>
                Renovation Services
              </span>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 300, color: '#ffffff', lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase', marginBottom: '24px', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                Renovation<br />
                <span style={{ color: COLORS.accent, fontWeight: 500 }}>Services</span>
              </h1>
              <p style={{ fontFamily: "'Raleway', sans-serif", color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(14px, 1.5vw, 17px)', lineHeight: 1.8, maxWidth: '600px', marginBottom: '32px' }}>
                From dated to dazzling. Our expert renovation services breathe new life into homes and commercial spaces with thoughtful design and flawless execution.
              </p>
              <a href="/contact-us" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.accent, color: '#ffffff', padding: '14px 32px', borderRadius: '9999px', fontWeight: 500, fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'Raleway', sans-serif" }}>
                Start Your Renovation
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" style={{ padding: 'clamp(64px, 10vw, 120px) 24px', backgroundColor: COLORS.white }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={sectionPill('services')}>Our Services</span>
            <h2 style={sectionHeading}>
              Comprehensive Renovation
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Solutions</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '32px'
          }}>
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div key={index} style={{
                  backgroundColor: COLORS.white,
                  borderRadius: '20px',
                  border: `1px solid ${COLORS.border}`,
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'default'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(15,23,42,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={service.image}
                      alt={service.title}
                      style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      left: '16px',
                      width: '48px',
                      height: '48px',
                      backgroundColor: COLORS.white,
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                      <IconComponent size={22} style={{ color: COLORS.accent }} />
                    </div>
                  </div>
                  <div style={{ padding: '28px' }}>
                    <h3 style={{
                      fontFamily: "'Oswald', sans-serif",
                      color: COLORS.textDark,
                      fontSize: '20px',
                      fontWeight: 500,
                      marginBottom: '10px',
                      textTransform: 'uppercase'
                    }}>
                      {service.title}
                    </h3>
                    <p style={{
                      fontFamily: "'Raleway', sans-serif",
                      color: COLORS.textMuted,
                      fontSize: '14px',
                      lineHeight: 1.7,
                      marginBottom: '20px'
                    }}>
                      {service.description}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {service.features.map((feature, idx) => (
                        <span key={idx} style={{
                          backgroundColor: COLORS.canvas,
                          color: COLORS.accent,
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 500,
                          fontFamily: "'Raleway', sans-serif"
                        }}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section style={{ padding: 'clamp(64px, 10vw, 120px) 24px', backgroundColor: COLORS.canvas }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={sectionPill('process')}>Our Process</span>
            <h2 style={sectionHeading}>
              How We Transform
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Your Space</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '32px'
          }}>
            {process.map((step, index) => (
              <div
                key={index}
                onClick={() => setActiveProcess(index)}
                style={{
                  backgroundColor: activeProcess === index ? COLORS.accent : COLORS.white,
                  borderRadius: '20px',
                  padding: '36px 28px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `1px solid ${activeProcess === index ? COLORS.accent : COLORS.border}`,
                  textAlign: 'center'
                }}
              >
                <div style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '48px',
                  fontWeight: 300,
                  color: activeProcess === index ? COLORS.white : COLORS.accentLight,
                  marginBottom: '16px',
                  lineHeight: 1
                }}>
                  {step.step}
                </div>
                <h3 style={{
                  fontFamily: "'Oswald', sans-serif",
                  color: activeProcess === index ? COLORS.white : COLORS.textDark,
                  fontSize: '20px',
                  fontWeight: 500,
                  marginBottom: '12px',
                  textTransform: 'uppercase'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontFamily: "'Raleway', sans-serif",
                  color: activeProcess === index ? 'rgba(255,255,255,0.85)' : COLORS.textMuted,
                  fontSize: '14px',
                  lineHeight: 1.7
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: 'clamp(64px, 10vw, 120px) 24px', backgroundColor: COLORS.white }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={sectionPill('features')}>The HOH108 Difference</span>
            <h2 style={sectionHeading}>
              Why Choose Us For Your
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Renovation Project</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '28px'
          }}>
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} style={{
                  backgroundColor: COLORS.white,
                  borderRadius: '20px',
                  padding: '36px',
                  textAlign: 'center',
                  border: `1px solid ${COLORS.border}`,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(15,23,42,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: COLORS.canvas,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <IconComponent size={28} style={{ color: COLORS.accent }} />
                  </div>
                  <h3 style={{
                    fontFamily: "'Oswald', sans-serif",
                    color: COLORS.textDark,
                    fontSize: '18px',
                    fontWeight: 500,
                    marginBottom: '12px',
                    textTransform: 'uppercase'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Raleway', sans-serif",
                    color: COLORS.textMuted,
                    fontSize: '14px',
                    lineHeight: 1.7
                  }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: 'clamp(64px, 10vw, 120px) 24px', backgroundColor: COLORS.dark }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: 'rgba(197,156,130,0.15)',
              color: COLORS.accent,
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '20px',
              border: '1px solid rgba(197,156,130,0.2)'
            }}>
              FAQ
            </span>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 400,
              color: COLORS.white,
              lineHeight: 1.2,
              textTransform: 'uppercase'
            }}>
              Frequently Asked
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Questions</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, index) => (
              <div key={index} style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
                transition: 'border-color 0.3s ease'
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{
                    fontFamily: "'Raleway', sans-serif",
                    color: COLORS.white,
                    fontSize: '16px',
                    fontWeight: 600
                  }}>
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={20}
                    style={{
                      color: COLORS.accent,
                      transition: 'transform 0.3s ease',
                      transform: openFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                      marginLeft: '16px'
                    }}
                  />
                </button>
                {openFaq === index && (
                  <div style={{
                    padding: '0 24px 20px',
                    fontFamily: "'Raleway', sans-serif",
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: '14px',
                    lineHeight: 1.8
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" style={{ padding: 'clamp(64px, 10vw, 120px) 24px', backgroundColor: COLORS.canvas }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            alignItems: 'center',
            gap: '48px'
          }}>
            {/* Left Content */}
            <div>
              <span style={sectionPill('cta')}>Get Started</span>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 400,
                color: COLORS.textDark,
                marginBottom: '24px',
                lineHeight: 1.2,
                textTransform: 'uppercase'
              }}>
                Ready to Transform
                <br />
                <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Your Space?</span>
              </h2>
              <p style={{
                fontFamily: "'Raleway', sans-serif",
                color: COLORS.textMuted,
                fontSize: '16px',
                lineHeight: 1.8,
                marginBottom: '32px'
              }}>
                Let's discuss your renovation dreams. Whether it's a single room refresh or a complete home transformation, our team is ready to bring your vision to life.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: COLORS.white,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${COLORS.border}`
                  }}>
                    <Phone size={18} style={{ color: COLORS.accent }} />
                  </div>
                  <span style={{ fontFamily: "'Raleway', sans-serif", color: COLORS.textDark, fontSize: '15px', fontWeight: 500 }}>+91 8861888424</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    backgroundColor: COLORS.white,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${COLORS.border}`
                  }}>
                    <Mail size={18} style={{ color: COLORS.accent }} />
                  </div>
                  <span style={{ fontFamily: "'Raleway', sans-serif", color: COLORS.textDark, fontSize: '15px', fontWeight: 500 }}>renovation@hoh108.com</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div style={{
              backgroundColor: COLORS.white,
              borderRadius: '20px',
              padding: 'clamp(28px, 5vw, 44px)',
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 20px 60px rgba(15,23,42,0.06)'
            }}>
              <h3 style={{
                fontFamily: "'Oswald', sans-serif",
                color: COLORS.textDark,
                fontSize: '22px',
                fontWeight: 500,
                marginBottom: '28px',
                textTransform: 'uppercase'
              }}>
                Get a Free Consultation
              </h3>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Your Name"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.border}`,
                    fontSize: '14px',
                    fontFamily: "'Raleway', sans-serif",
                    color: COLORS.textDark,
                    backgroundColor: COLORS.canvas,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.border}`,
                    fontSize: '14px',
                    fontFamily: "'Raleway', sans-serif",
                    color: COLORS.textDark,
                    backgroundColor: COLORS.canvas,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.border}`,
                    fontSize: '14px',
                    fontFamily: "'Raleway', sans-serif",
                    color: COLORS.textDark,
                    backgroundColor: COLORS.canvas,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <select
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.border}`,
                    fontSize: '14px',
                    fontFamily: "'Raleway', sans-serif",
                    color: COLORS.textMuted,
                    backgroundColor: COLORS.canvas,
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select Renovation Type</option>
                  <option value="full-home">Complete Home Renovation</option>
                  <option value="kitchen">Kitchen Remodeling</option>
                  <option value="bathroom">Bathroom Renovation</option>
                  <option value="commercial">Commercial Renovation</option>
                  <option value="room-addition">Room Addition</option>
                  <option value="restoration">Restoration & Repair</option>
                </select>
                <textarea
                  placeholder="Tell us about your renovation project..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    border: `1px solid ${COLORS.border}`,
                    fontSize: '14px',
                    fontFamily: "'Raleway', sans-serif",
                    color: COLORS.textDark,
                    backgroundColor: COLORS.canvas,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    backgroundColor: COLORS.accent,
                    color: COLORS.white,
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: "'Raleway', sans-serif",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s',
                    letterSpacing: '0.5px'
                  }}
                >
                  Schedule Consultation
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Renovation;
