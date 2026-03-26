import { useState } from 'react';
import { FiArrowRight, FiPhone, FiChevronLeft, FiChevronRight, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import { HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineClock, HiOutlineCurrencyDollar, HiOutlineBadgeCheck, HiOutlineHeart } from 'react-icons/hi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { COLORS } from '../constants/colors';

// Import all construction images
import img1 from '../assets/Construction Images/1.jpg';
import img2 from '../assets/Construction Images/2.jpg';
import img3 from '../assets/Construction Images/3.jpg';
import img4 from '../assets/Construction Images/4.jpg';
import img5 from '../assets/Construction Images/5.jpg';
import img6 from '../assets/Construction Images/6.jpg';
import img7 from '../assets/Construction Images/7.jpg';
import img8 from '../assets/Construction Images/8.jpg';
import img9 from '../assets/Construction Images/9.jpg';
import img10 from '../assets/Construction Images/10.jpg';
import img11 from '../assets/Construction Images/11.jpg';
import img12 from '../assets/Construction Images/12.jpg';
import img13 from '../assets/Construction Images/13.jpg';
import img14 from '../assets/Construction Images/14.jpg';
import img15 from '../assets/Construction Images/15.jpg';
import img16 from '../assets/Construction Images/16.jpg';
import img17 from '../assets/Construction Images/17.jpg';
import img18 from '../assets/Construction Images/18.jpg';
import img19 from '../assets/Construction Images/19.jpg';
import img20 from '../assets/Construction Images/20.jpg';
import img21 from '../assets/Construction Images/21.jpg';
import img22 from '../assets/Construction Images/22.jpg';
import img23 from '../assets/Construction Images/23.jpg';
import img24 from '../assets/Construction Images/24.jpg';
import img25 from '../assets/Construction Images/25.jpg';
import img26 from '../assets/Construction Images/26.jpg';
import img27 from '../assets/Construction Images/27.jpg';
import img28 from '../assets/Construction Images/28.jpg';
import img29 from '../assets/Construction Images/29.jpg';
import img30 from '../assets/Construction Images/30.jpg';
import img31 from '../assets/Construction Images/31.jpg';
import img32 from '../assets/Construction Images/32.jpg';
import img33 from '../assets/Construction Images/33.jpg';

const constructionImages = [
  img1, img2, img3, img4, img5, img6, img7, img8, img9, img10,
  img11, img12, img13, img14, img15, img16, img17, img18, img19, img20,
  img21, img22, img23, img24, img25, img26, img27, img28, img29, img30,
  img31, img32, img33
];

const Construction = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % constructionImages.length);
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + constructionImages.length) % constructionImages.length);

  const features = [
    {
      icon: <HiOutlineUserGroup size={28} />,
      title: 'Experienced Team',
      description: 'Our skilled professionals bring decades of combined expertise to every project.'
    },
    {
      icon: <HiOutlineShieldCheck size={28} />,
      title: 'Quality Materials',
      description: 'We source only the finest materials to ensure lasting durability and beauty.'
    },
    {
      icon: <HiOutlineClock size={28} />,
      title: 'On-Time Delivery',
      description: 'We respect your timeline and deliver projects on schedule, every time.'
    },
    {
      icon: <HiOutlineCurrencyDollar size={28} />,
      title: 'Transparent Pricing',
      description: 'No hidden costs. Clear, upfront pricing you can trust and budget for.'
    },
    {
      icon: <HiOutlineBadgeCheck size={28} />,
      title: 'Licensed & Insured',
      description: 'Fully licensed and insured for your complete peace of mind.'
    },
    {
      icon: <HiOutlineHeart size={28} />,
      title: 'Client-Focused',
      description: 'Your vision drives our work. We listen, adapt, and exceed expectations.'
    }
  ];

  const services = [
    {
      title: 'Residential Construction',
      description: 'From custom homes to renovations, we bring your residential vision to life with expert craftsmanship and attention to every detail.',
      image: img1
    },
    {
      title: 'Commercial Construction',
      description: 'Professional commercial spaces built to specification, on time and within budget. Offices, retail, and more.',
      image: img5
    },
    {
      title: 'Industrial Construction',
      description: 'End-to-end industrial project management ensuring smooth execution from concept to completion with safety compliance.',
      image: img10
    }
  ];

  const faqs = [
    {
      question: 'How long does a typical construction project take?',
      answer: 'Project timelines vary based on scope and complexity. A standard residential project typically takes 8-14 months, while smaller renovations may be completed in 3-6 months. We provide detailed timelines during the planning phase.'
    },
    {
      question: 'What is included in your construction services?',
      answer: 'Our services cover everything from initial planning and design through to final handover. This includes site preparation, structural work, electrical and plumbing, interior finishing, landscaping, and quality inspections at every stage.'
    },
    {
      question: 'Do you handle permits and regulatory approvals?',
      answer: 'Yes, we manage all necessary permits, approvals, and regulatory compliance on your behalf. Our team is well-versed in local building codes and ensures your project meets all legal requirements.'
    },
    {
      question: 'How do you ensure quality during construction?',
      answer: 'We implement a multi-stage quality assurance process with regular inspections, use only certified materials from trusted suppliers, and employ skilled professionals who follow industry best practices at every step.'
    },
    {
      question: 'Can I make changes during the construction process?',
      answer: 'We understand that needs evolve. Minor modifications can be accommodated with minimal impact. For significant changes, we provide revised timelines and cost estimates for your approval before proceeding.'
    }
  ];

  /* ─── Shared Styles ─── */
  const pill = {
    display: 'inline-block',
    backgroundColor: COLORS.canvas,
    color: COLORS.accent,
    padding: '6px 18px',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    marginBottom: '16px',
    border: `1px solid ${COLORS.border}`
  };

  const sectionHeading = {
    fontFamily: "'Oswald', sans-serif",
    fontSize: 'clamp(28px, 5vw, 44px)',
    fontWeight: 400,
    color: COLORS.textDark,
    lineHeight: 1.15,
    marginBottom: '16px'
  };

  const bodyText = {
    fontFamily: "'Raleway', sans-serif",
    color: COLORS.textMuted,
    fontSize: 'clamp(14px, 1.5vw, 16px)',
    lineHeight: 1.75,
    maxWidth: '640px',
    margin: '0 auto'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.white, color: COLORS.textDark }}>
      <Header />

      {/* ═══════ 1. HERO SECTION ═══════ */}
      <section style={{ padding: '80px 0 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 80px)' }}>
          <div style={{ position: 'relative', width: '100%', borderRadius: '20px', overflow: 'hidden', minHeight: '500px' }}>
            <img src={img7} alt="Construction" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(17,17,17,0.55)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,17,17,0.5) 0%, transparent 60%)' }} />
            <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(48px, 8vw, 80px) clamp(32px, 6vw, 64px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: '500px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 20px', borderRadius: '9999px', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '24px', fontFamily: "'Raleway', sans-serif" }}>
                Construction
              </span>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 300, color: '#ffffff', lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase', marginBottom: '24px', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                Engineering Foundations.<br />
                <span style={{ color: COLORS.accent, fontWeight: 500 }}>Crafting Dreams.</span>
              </h1>
              <p style={{ fontFamily: "'Raleway', sans-serif", color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(14px, 1.5vw, 17px)', lineHeight: 1.8, maxWidth: '600px', marginBottom: '32px' }}>
                Premium construction services that bring architectural visions to life with precision, quality, and uncompromising craftsmanship.
              </p>
              <a href="/contact-us" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.accent, color: '#ffffff', padding: '14px 32px', borderRadius: '9999px', fontWeight: 500, fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', fontFamily: "'Raleway', sans-serif" }}>
                Start Your Project
                <FiArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Hidden sections — temporarily disabled */}
      {false && <> {/* ═══════ 2. FEATURES BENTO GRID ═══════ */}
      <section style={{
        padding: 'clamp(56px, 10vw, 100px) 24px',
        backgroundColor: COLORS.canvas
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
            <span style={pill}>Why Choose Us</span>
            <h2 style={sectionHeading}>
              Trusted Construction Expertise
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>You Can Rely On</span>
            </h2>
            <p style={bodyText}>
              At HOH108, we combine decades of experience with innovative techniques to deliver exceptional results that stand the test of time.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'auto auto',
            gap: 'clamp(14px, 2vw, 20px)',
            maxWidth: '1100px',
            margin: '0 auto'
          }} className="construction-bento-grid">
            {features.map((feature, index) => {
              const isLarge = index === 0 || index === 5;
              return (
                <div key={index} style={{
                  backgroundColor: COLORS.white,
                  borderRadius: '20px',
                  padding: isLarge ? 'clamp(28px, 3vw, 40px)' : 'clamp(24px, 2.5vw, 32px)',
                  border: `1px solid ${COLORS.border}`,
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'default',
                  gridColumn: isLarge ? 'span 2' : 'span 1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(15,23,42,0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '52px',
                    height: '52px',
                    backgroundColor: COLORS.canvas,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.accent
                  }}>
                    {feature.icon}
                  </div>
                  <h3 style={{
                    fontFamily: "'Oswald', sans-serif",
                    color: COLORS.textDark,
                    fontSize: isLarge ? 'clamp(18px, 2vw, 22px)' : 'clamp(16px, 1.8vw, 19px)',
                    fontWeight: 500,
                    margin: 0,
                    lineHeight: 1.3
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Raleway', sans-serif",
                    color: COLORS.textMuted,
                    fontSize: '14px',
                    lineHeight: 1.7,
                    margin: 0
                  }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ 3. SERVICES SECTION ═══════ */}
      <section style={{
        padding: 'clamp(56px, 10vw, 100px) 24px',
        backgroundColor: COLORS.white
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
            <span style={pill}>Our Services</span>
            <h2 style={sectionHeading}>
              Construction Services
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>We Offer</span>
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'clamp(16px, 2.5vw, 24px)',
            maxWidth: '1200px',
            margin: '0 auto'
          }} className="construction-services-grid">
            {services.map((service, index) => (
              <div key={index} style={{
                borderRadius: '20px',
                overflow: 'hidden',
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.white,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default'
              }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(15,23,42,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  position: 'relative',
                  aspectRatio: '16/10',
                  overflow: 'hidden'
                }}>
                  <img
                    src={service.image}
                    alt={service.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60%',
                    background: 'linear-gradient(to top, rgba(15,23,42,0.4) 0%, transparent 100%)',
                    pointerEvents: 'none'
                  }} />
                </div>
                <div style={{ padding: 'clamp(20px, 2.5vw, 28px)' }}>
                  <h3 style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: 'clamp(18px, 2vw, 22px)',
                    fontWeight: 500,
                    color: COLORS.textDark,
                    marginBottom: '10px',
                    lineHeight: 1.3
                  }}>
                    {service.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Raleway', sans-serif",
                    color: COLORS.textMuted,
                    fontSize: '14px',
                    lineHeight: 1.7,
                    marginBottom: '18px'
                  }}>
                    {service.description}
                  </p>
                  <a href="/contact-us" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: COLORS.accent,
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontFamily: "'Raleway', sans-serif",
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase'
                  }}>
                    Learn More <FiArrowRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 4. GALLERY SECTION ═══════ */}
      <section style={{
        padding: 'clamp(56px, 10vw, 100px) 24px',
        backgroundColor: COLORS.canvas
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
            <span style={pill}>Our Portfolio</span>
            <h2 style={sectionHeading}>
              Construction Projects
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Gallery</span>
            </h2>
          </div>

          <div style={{
            columns: 'clamp(1, 3, 4)',
            columnCount: 3,
            columnGap: 'clamp(12px, 1.5vw, 18px)'
          }} className="construction-gallery-masonry">
            {constructionImages.map((img, index) => (
              <div
                key={index}
                onClick={() => openLightbox(index)}
                style={{
                  breakInside: 'avoid',
                  marginBottom: 'clamp(12px, 1.5vw, 18px)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(15,23,42,0.12)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <img
                  src={img}
                  alt={`Construction project ${index + 1}`}
                  loading="lazy"
                  style={{
                    width: '100%',
                    display: 'block',
                    transition: 'transform 0.4s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.5) 0%, transparent 60%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '18px'
                }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                  onMouseOut={(e) => e.currentTarget.style.opacity = 0}
                >
                  <span style={{
                    color: COLORS.white,
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: "'Raleway', sans-serif",
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    View Project
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ 5. FAQ SECTION ═══════ */}
      <section style={{
        padding: 'clamp(56px, 10vw, 100px) 24px',
        backgroundColor: COLORS.card
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 56px)' }}>
            <span style={{
              ...pill,
              backgroundColor: 'rgba(197,156,130,0.12)',
              color: COLORS.accent,
              border: '1px solid rgba(197,156,130,0.2)'
            }}>
              FAQ
            </span>
            <h2 style={{
              ...sectionHeading,
              color: COLORS.white
            }}>
              Frequently Asked
              <br />
              <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Questions</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: '16px',
                  border: `1px solid ${isOpen ? 'rgba(197,156,130,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  overflow: 'hidden',
                  transition: 'border-color 0.3s ease'
                }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '20px 24px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: '16px'
                    }}
                  >
                    <span style={{
                      fontFamily: "'Raleway', sans-serif",
                      fontSize: 'clamp(14px, 1.5vw, 16px)',
                      fontWeight: 600,
                      color: isOpen ? COLORS.accent : COLORS.white,
                      lineHeight: 1.4,
                      transition: 'color 0.3s ease'
                    }}>
                      {faq.question}
                    </span>
                    <span style={{
                      flexShrink: 0,
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isOpen ? COLORS.accent : 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isOpen ? COLORS.white : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.3s ease'
                    }}>
                      {isOpen ? <FiMinus size={16} /> : <FiPlus size={16} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{
                      padding: '0 24px 20px',
                    }}>
                      <p style={{
                        fontFamily: "'Raleway', sans-serif",
                        color: 'rgba(255,255,255,0.55)',
                        fontSize: '14px',
                        lineHeight: 1.8,
                        margin: 0
                      }}>
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ 6. CTA SECTION ═══════ */}
      <section style={{
        padding: 'clamp(56px, 10vw, 100px) 24px',
        backgroundColor: COLORS.dark,
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <span style={{
            ...pill,
            backgroundColor: 'rgba(197,156,130,0.12)',
            color: COLORS.accent,
            border: '1px solid rgba(197,156,130,0.2)'
          }}>
            Get Started
          </span>
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 400,
            color: COLORS.white,
            lineHeight: 1.15,
            marginBottom: '16px'
          }}>
            Ready to Build Your
            <br />
            <span style={{ fontStyle: 'italic', color: COLORS.accent }}>Dream Space?</span>
          </h2>
          <p style={{
            fontFamily: "'Raleway', sans-serif",
            color: 'rgba(255,255,255,0.55)',
            fontSize: 'clamp(14px, 1.5vw, 16px)',
            lineHeight: 1.75,
            maxWidth: '520px',
            margin: '0 auto clamp(28px, 4vw, 40px)'
          }}>
            Let us turn your vision into reality. Contact our team today for a free consultation and project estimate.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/contact-us" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: COLORS.accent,
              color: COLORS.white,
              padding: '14px 32px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: "'Raleway', sans-serif",
              letterSpacing: '0.3px',
              transition: 'background-color 0.25s'
            }}>
              Get Free Quote
              <FiArrowRight size={16} />
            </a>
            <a href="tel:+919876543210" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              color: COLORS.white,
              padding: '14px 32px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              fontFamily: "'Raleway', sans-serif",
              border: '1px solid rgba(255,255,255,0.15)',
              transition: 'border-color 0.25s'
            }}>
              <FiPhone size={15} />
              Call Us Now
            </a>
          </div>
        </div>
      </section>

      </>}
      {/* ═══════ LIGHTBOX ═══════ */}
      {lightboxOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.96)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '44px',
              height: '44px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
              color: 'white',
              backdropFilter: 'blur(8px)'
            }}
          >
            <FiX size={20} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
              color: 'white',
              backdropFilter: 'blur(8px)'
            }}
          >
            <FiChevronLeft size={22} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001,
              color: 'white',
              backdropFilter: 'blur(8px)'
            }}
          >
            <FiChevronRight size={22} />
          </button>

          <img
            src={constructionImages[lightboxIndex]}
            alt={`Construction project ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '12px'
            }}
          />

          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: COLORS.white,
            fontSize: '13px',
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 600,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            padding: '8px 20px',
            borderRadius: '9999px',
            backdropFilter: 'blur(8px)',
            letterSpacing: '0.5px'
          }}>
            {lightboxIndex + 1} / {constructionImages.length}
          </div>
        </div>
      )}

      <Footer />

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 900px) {
          .construction-bento-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .construction-bento-grid > div {
            grid-column: span 1 !important;
          }
          .construction-services-grid {
            grid-template-columns: 1fr !important;
            max-width: 480px !important;
          }
          .construction-gallery-masonry {
            column-count: 2 !important;
          }
        }
        @media (max-width: 600px) {
          .construction-bento-grid {
            grid-template-columns: 1fr !important;
          }
          .construction-gallery-masonry {
            column-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Construction;
