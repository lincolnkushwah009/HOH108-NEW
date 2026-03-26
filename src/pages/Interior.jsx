import { useState } from 'react';
import { ArrowRight, CheckCircle, ChevronDown, Palette, Sofa, BedDouble, Bath, LayoutGrid, Briefcase, Phone, Mail, Star, Ruler, Lightbulb, Handshake } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { COLORS } from '../constants/colors';

const Interior = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [activeProcess, setActiveProcess] = useState(0);

  const services = [
    {
      icon: LayoutGrid,
      title: 'Modular Kitchen',
      description: 'Beautifully designed modular kitchens that blend style with smart storage and effortless functionality.',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
      features: ['Custom layouts', 'Premium finishes', 'Smart storage', 'Appliance integration']
    },
    {
      icon: Sofa,
      title: 'Living Room',
      description: 'Create inviting living spaces that reflect your personality with curated furniture, lighting, and decor.',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=400&fit=crop',
      features: ['Space planning', 'Custom furniture', 'Accent walls', 'Lighting design']
    },
    {
      icon: BedDouble,
      title: 'Bedroom',
      description: 'Peaceful, elegant bedrooms designed for comfort and rest with thoughtful textures and calming palettes.',
      image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=400&fit=crop',
      features: ['Wardrobe design', 'Bed styling', 'Ambient lighting', 'Color schemes']
    },
    {
      icon: Bath,
      title: 'Bathroom',
      description: 'Spa-inspired bathrooms with premium fixtures, natural materials, and serene design details.',
      image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600&h=400&fit=crop',
      features: ['Vanity design', 'Tile selection', 'Fixture curation', 'Storage solutions']
    },
    {
      icon: Palette,
      title: 'Wardrobe',
      description: 'Custom wardrobe solutions that maximize storage while elevating the aesthetics of your personal space.',
      image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&h=400&fit=crop',
      features: ['Walk-in closets', 'Sliding doors', 'Modular systems', 'Accessories zone']
    },
    {
      icon: Briefcase,
      title: 'Office',
      description: 'Productive and inspiring office interiors designed for focus, collaboration, and professional impression.',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
      features: ['Ergonomic design', 'Cable management', 'Acoustic planning', 'Brand integration']
    }
  ];

  const whyChooseUs = [
    {
      icon: Star,
      title: 'Award-Winning Designs',
      description: 'Our design team creates spaces recognized for their beauty, innovation, and livability.'
    },
    {
      icon: Ruler,
      title: 'Precision Execution',
      description: 'Every detail is measured, planned, and executed with millimeter accuracy.'
    },
    {
      icon: Lightbulb,
      title: 'Creative Vision',
      description: 'We bring fresh, original ideas that transform ordinary rooms into extraordinary experiences.'
    },
    {
      icon: Handshake,
      title: 'End-to-End Service',
      description: 'From concept mood boards to final styling, we manage every step of your interior journey.'
    }
  ];

  const process = [
    {
      step: '01',
      title: 'Discovery Call',
      description: 'We begin with a detailed conversation about your lifestyle, preferences, and design aspirations. We visit your space and take measurements.'
    },
    {
      step: '02',
      title: 'Concept & Mood Board',
      description: 'Our designers develop a cohesive concept with mood boards, material palettes, and 3D renders so you can visualize your dream space.'
    },
    {
      step: '03',
      title: 'Execution & Styling',
      description: 'Our team brings the design to life with expert craftsmanship, quality materials, and meticulous attention to every detail.'
    },
    {
      step: '04',
      title: 'Final Walkthrough',
      description: 'We style, accessorize, and hand over your beautifully finished space. Every element is checked to ensure perfection.'
    }
  ];

  const faqs = [
    {
      question: 'How long does an interior design project take?',
      answer: 'Timelines depend on scope. A single room typically takes 3-4 weeks, while a full home interior can take 8-14 weeks. We provide a detailed schedule during the planning phase so you always know what to expect.'
    },
    {
      question: 'Do you provide 3D visualizations before starting?',
      answer: 'Yes, we create detailed 3D renders and mood boards for every project. You will see exactly how your space will look before any work begins, with the ability to make revisions until you are fully satisfied.'
    },
    {
      question: 'Can you work with my existing furniture?',
      answer: 'Absolutely. We are happy to incorporate existing pieces you love into the new design. Our designers will suggest how to blend them seamlessly with new elements for a cohesive look.'
    },
    {
      question: 'What is included in your interior design service?',
      answer: 'Our service covers space planning, concept development, 3D visualization, material selection, furniture procurement, project management, installation, and final styling. We handle everything from start to finish.'
    },
    {
      question: 'Do you offer design consultations for small budgets?',
      answer: 'Yes, we offer tiered packages to suit different budgets. Even our consultation-only service provides professional design direction, material recommendations, and a layout plan you can implement at your own pace.'
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
            <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&h=1080&fit=crop" alt="Interior Design" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0.55)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,17,17,0.5) 0%, transparent 60%)' }} />
            <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(48px, 8vw, 80px) clamp(32px, 6vw, 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: '500px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 20px', borderRadius: '9999px', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '24px', fontFamily: "'Raleway', sans-serif" }}>
                Interior Design
              </span>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 300, color: '#ffffff', lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase', marginBottom: '24px', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                Interior<br />
                <span style={{ color: COLORS.accent, fontWeight: 500 }}>Design</span>
              </h1>
              <p style={{ fontFamily: "'Raleway', sans-serif", color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(14px, 1.5vw, 17px)', lineHeight: 1.8, maxWidth: '600px', marginBottom: '32px' }}>
                We craft thoughtfully designed interiors that feel like home. From kitchens to bedrooms, every space is tailored to your lifestyle with elegance and intention.
              </p>
              <a href="/contact-us" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.accent, color: '#ffffff', padding: '14px 32px', borderRadius: '9999px', fontWeight: 500, fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'Raleway', sans-serif" }}>
                Book a Consultation
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Hidden sections — temporarily disabled */}
      {false && <>{/* Intro Section */}
      <section style={{ padding: 'clamp(64px, 10vw, 120px) 24px', backgroundColor: COLORS.white }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <span style={sectionPill('about')}>About Our Design</span>
          <h2 style={{ ...sectionHeading, marginBottom: '24px' }}>
            Spaces That Tell
            <br />
            <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Your Story</span>
          </h2>
          <p style={{
            fontFamily: "'Raleway', sans-serif",
            color: COLORS.textMuted,
            fontSize: 'clamp(15px, 2vw, 17px)',
            lineHeight: 1.8,
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            At HOH108, we believe great interior design is more than aesthetics — it's about creating spaces that enhance how you live, work, and feel every day. Our designers blend functionality with beauty, crafting environments that are uniquely yours. From material selection to final styling, every detail is intentional.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" style={{ padding: 'clamp(64px, 10vw, 120px) 24px', backgroundColor: COLORS.canvas }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={sectionPill('services')}>What We Design</span>
            <h2 style={sectionHeading}>
              Our Interior Design
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Services</span>
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

      {/* Why Choose Us */}
      <section style={{ padding: 'clamp(64px, 10vw, 120px) 24px', backgroundColor: COLORS.white }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={sectionPill('why us')}>The HOH108 Difference</span>
            <h2 style={sectionHeading}>
              Why Choose Us For
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Your Interiors</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '28px'
          }}>
            {whyChooseUs.map((item, index) => {
              const IconComponent = item.icon;
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
                    {item.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Raleway', sans-serif",
                    color: COLORS.textMuted,
                    fontSize: '14px',
                    lineHeight: 1.7
                  }}>
                    {item.description}
                  </p>
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
            <span style={sectionPill('process')}>How We Work</span>
            <h2 style={sectionHeading}>
              Our Design
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Process</span>
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
              Common
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
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <span style={sectionPill('get started')}>Start Your Project</span>
          <h2 style={{
            ...sectionHeading,
            marginBottom: '24px'
          }}>
            Ready to Design Your
            <br />
            <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Dream Interior?</span>
          </h2>
          <p style={{
            fontFamily: "'Raleway', sans-serif",
            color: COLORS.textMuted,
            fontSize: 'clamp(15px, 2vw, 17px)',
            lineHeight: 1.8,
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}>
            Let's bring your vision to life. Book a free consultation with our design team and take the first step toward a space you'll love coming home to.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
            <a href="/contact" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: COLORS.accent,
              color: COLORS.white,
              padding: '16px 40px',
              borderRadius: '9999px',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: "'Raleway', sans-serif",
              transition: 'transform 0.2s',
              letterSpacing: '0.5px'
            }}>
              Book Free Consultation
              <ArrowRight size={18} />
            </a>
          </div>

          <div style={{
            display: 'flex',
            gap: '40px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
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
              <span style={{ fontFamily: "'Raleway', sans-serif", color: COLORS.textDark, fontSize: '15px', fontWeight: 500 }}>interiors@hoh108.com</span>
            </div>
          </div>
        </div>
      </section>

      </>}
      <Footer />
    </div>
  );
};

export default Interior;
