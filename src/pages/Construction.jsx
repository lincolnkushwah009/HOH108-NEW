import { useState } from 'react';
import { ArrowRight, Phone, Mail, MapPin, Users, Shield, Clock, DollarSign, Award, Heart, ChevronLeft, ChevronRight, Home, Building2, Hammer, ClipboardList, X } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

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
  const [currentProject, setCurrentProject] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const nextImage = () => setLightboxIndex((prev) => (prev + 1) % constructionImages.length);
  const prevImage = () => setLightboxIndex((prev) => (prev - 1 + constructionImages.length) % constructionImages.length);

  const features = [
    {
      icon: Users,
      title: 'Experienced Team',
      description: 'Our skilled professionals bring decades of combined expertise to every project.'
    },
    {
      icon: Shield,
      title: 'Quality Materials',
      description: 'We source only the finest materials to ensure lasting durability and beauty.'
    },
    {
      icon: Clock,
      title: 'On-Time Delivery',
      description: 'We respect your timeline and deliver projects on schedule, every time.'
    },
    {
      icon: DollarSign,
      title: 'Transparent Pricing',
      description: 'No hidden costs. Clear, upfront pricing you can trust and budget for.'
    },
    {
      icon: Award,
      title: 'Licensed & Insured',
      description: 'Fully licensed and insured for your complete peace of mind.'
    },
    {
      icon: Heart,
      title: 'Client-Focused Approach',
      description: 'Your vision drives our work. We listen, adapt, and exceed expectations.'
    }
  ];

  const services = [
    {
      icon: Home,
      title: 'Residential Construction',
      description: 'From custom homes to renovations, we bring your residential vision to life with expert craftsmanship.'
    },
    {
      icon: Building2,
      title: 'Commercial Construction',
      description: 'Professional commercial spaces built to specification, on time and within budget.'
    },
    {
      icon: ClipboardList,
      title: 'Project Management',
      description: 'End-to-end project management ensuring smooth execution from concept to completion.'
    }
  ];

  const projects = [
    { title: 'Residential Project', location: 'Bangalore', image: img1 },
    { title: 'Villa Construction', location: 'Mysore', image: img2 },
    { title: 'Modern Home', location: 'Bangalore', image: img3 },
    { title: 'Premium Residence', location: 'Mysore', image: img4 },
    { title: 'Luxury Villa', location: 'Bangalore', image: img5 },
    { title: 'Custom Home', location: 'Mysore', image: img6 },
  ];

  const nextProject = () => {
    setCurrentProject((prev) => (prev + 1) % projects.length);
  };

  const prevProject = () => {
    setCurrentProject((prev) => (prev - 1 + projects.length) % projects.length);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111111', color: '#E5E5E5' }}>
      <Header />

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${img7})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(17, 17, 17, 0.7), rgba(17, 17, 17, 0.9))'
          }} />
        </div>

        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 24px',
          maxWidth: '900px'
        }}>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(36px, 8vw, 72px)',
            fontWeight: 400,
            color: 'white',
            marginBottom: '24px',
            lineHeight: 1.1
          }}>
            Engineering Foundations.
            <br />
            <span style={{ fontStyle: 'italic', color: '#C59C82' }}>Crafting Dreams.</span>
          </h1>
          <p style={{
            color: '#9CA3AF',
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: 1.7
          }}>
            Premium construction services that bring architectural visions to life with precision, quality, and uncompromising craftsmanship.
          </p>
          <a href="/contact-us" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#C59C82',
            color: '#111111',
            padding: '16px 32px',
            borderRadius: '9999px',
            fontSize: '16px',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'transform 0.2s'
          }}>
            Start Your Project
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Building Vision Section */}
      <section style={{ padding: 'clamp(48px, 10vw, 96px) 24px', backgroundColor: '#111111' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block',
            backgroundColor: '#1A1A1A',
            color: '#C59C82',
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '24px'
          }}>
            Our Commitment
          </span>
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 400,
            color: 'white',
            marginBottom: '24px',
            lineHeight: 1.2
          }}>
            Building Your Vision With
            <br />
            <span style={{ fontStyle: 'italic', color: '#C59C82' }}>Integrity And Craftsmanship</span>
          </h2>
          <p style={{
            color: '#9CA3AF',
            fontSize: '16px',
            maxWidth: '700px',
            margin: '0 auto',
            lineHeight: 1.8
          }}>
            At HOH108, we understand that construction is more than just building structures—it's about creating spaces where life happens. Our team combines decades of experience with innovative techniques to deliver exceptional results that stand the test of time.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: 'clamp(48px, 10vw, 96px) 24px', backgroundColor: '#1A1A1A' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: '#111111',
              color: '#C59C82',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '24px'
            }}>
              Why Choose Us
            </span>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 400,
              color: 'white',
              lineHeight: 1.2
            }}>
              Trusted Construction Expertise
              <br />
              <span style={{ fontStyle: 'italic', color: '#C59C82' }}>You Can Rely On</span>
            </h2>
          </div>

          <div className="grid-responsive-3">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} style={{
                  backgroundColor: '#111111',
                  borderRadius: '24px',
                  padding: '32px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'rgba(197, 156, 130, 0.1)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                  }}>
                    <IconComponent size={28} style={{ color: '#C59C82' }} />
                  </div>
                  <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: '12px'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{
                    color: '#9CA3AF',
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

      {/* Services Timeline Section */}
      <section style={{ padding: 'clamp(48px, 10vw, 96px) 24px', backgroundColor: '#111111' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: '#1A1A1A',
              color: '#C59C82',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '24px'
            }}>
              Our Services
            </span>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 400,
              color: 'white',
              lineHeight: 1.2
            }}>
              Our Construction Services
              <br />
              <span style={{ fontStyle: 'italic', color: '#C59C82' }}>Include:</span>
            </h2>
          </div>

          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div key={index} style={{
                  display: 'flex',
                  gap: '24px',
                  position: 'relative',
                  paddingBottom: index === services.length - 1 ? '0' : '48px'
                }}>
                  {/* Timeline Line */}
                  {index !== services.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: '31px',
                      top: '64px',
                      bottom: '0',
                      width: '2px',
                      backgroundColor: '#2A2A2A'
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#C59C82',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <IconComponent size={28} style={{ color: '#111111' }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingTop: '8px' }}>
                    <h3 style={{
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 600,
                      marginBottom: '8px'
                    }}>
                      {service.title}
                    </h3>
                    <p style={{
                      color: '#9CA3AF',
                      fontSize: '15px',
                      lineHeight: 1.7
                    }}>
                      {service.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Project Gallery Section */}
      <section style={{ padding: 'clamp(48px, 10vw, 96px) 24px', backgroundColor: '#1A1A1A' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{
              display: 'inline-block',
              backgroundColor: '#111111',
              color: '#C59C82',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '24px'
            }}>
              Our Portfolio
            </span>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 400,
              color: 'white',
              lineHeight: 1.2
            }}>
              Construction Projects
              <br />
              <span style={{ fontStyle: 'italic', color: '#C59C82' }}>Gallery</span>
            </h2>
          </div>

          {/* Image Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {constructionImages.map((img, index) => (
              <div
                key={index}
                onClick={() => openLightbox(index)}
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  aspectRatio: '4/3'
                }}
              >
                <img
                  src={img}
                  alt={`Construction project ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '16px'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0}
                >
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>
                    View Project
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '48px',
              height: '48px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001
            }}
          >
            <X size={24} color="white" />
          </button>

          {/* Previous Button */}
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
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001
            }}
          >
            <ChevronLeft size={24} color="white" />
          </button>

          {/* Next Button */}
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
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001
            }}
          >
            <ChevronRight size={24} color="white" />
          </button>

          {/* Image */}
          <img
            src={constructionImages[lightboxIndex]}
            alt={`Construction project ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />

          {/* Counter */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'white',
            fontSize: '14px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: '8px 16px',
            borderRadius: '20px'
          }}>
            {lightboxIndex + 1} / {constructionImages.length}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Construction;
