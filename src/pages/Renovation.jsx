import { useState } from 'react';
import { ArrowRight, Users, Shield, Clock, DollarSign, Award, Heart, ChevronLeft, ChevronRight, Home, Building2, Paintbrush, Wrench, RefreshCw, Sparkles, CheckCircle, MapPin, Phone, Mail } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Renovation = () => {
  const [currentProject, setCurrentProject] = useState(0);
  const [activeProcess, setActiveProcess] = useState(0);

  const features = [
    {
      icon: Users,
      title: 'Expert Craftsmen',
      description: 'Our skilled team transforms spaces with precision, bringing decades of renovation expertise.'
    },
    {
      icon: Shield,
      title: 'Quality Guaranteed',
      description: 'Premium materials and meticulous workmanship backed by our satisfaction guarantee.'
    },
    {
      icon: Clock,
      title: 'Minimal Disruption',
      description: 'Efficient project timelines designed to get you back to normal life quickly.'
    },
    {
      icon: DollarSign,
      title: 'Fixed Pricing',
      description: 'Detailed quotes with no hidden costs. Know your investment upfront.'
    },
    {
      icon: Award,
      title: 'Design Excellence',
      description: 'Creative solutions that maximize space, light, and functionality.'
    },
    {
      icon: Heart,
      title: 'Personalized Approach',
      description: 'Every renovation is tailored to your lifestyle, taste, and budget.'
    }
  ];

  const services = [
    {
      icon: Home,
      title: 'Complete Home Renovation',
      description: 'Full-scale transformations that reimagine your entire living space from floor to ceiling.',
      features: ['Structural modifications', 'Layout redesign', 'Modern upgrades', 'Energy efficiency']
    },
    {
      icon: Paintbrush,
      title: 'Kitchen Remodeling',
      description: 'Transform your kitchen into a functional, beautiful heart of your home.',
      features: ['Custom cabinetry', 'Premium countertops', 'Modern appliances', 'Smart storage']
    },
    {
      icon: Sparkles,
      title: 'Bathroom Renovation',
      description: 'Create spa-like retreats with modern fixtures and elegant finishes.',
      features: ['Luxury fixtures', 'Tile work', 'Vanity design', 'Lighting design']
    },
    {
      icon: Building2,
      title: 'Commercial Renovation',
      description: 'Upgrade your business space to enhance productivity and impress clients.',
      features: ['Office redesign', 'Retail makeovers', 'Restaurant fit-outs', 'Lobby upgrades']
    },
    {
      icon: RefreshCw,
      title: 'Room Additions',
      description: 'Expand your living space with seamlessly integrated room additions.',
      features: ['Bedroom additions', 'Home offices', 'Sunrooms', 'In-law suites']
    },
    {
      icon: Wrench,
      title: 'Restoration & Repair',
      description: 'Preserve heritage while modernizing functionality in older properties.',
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

  const projects = [
    {
      title: 'Modern Kitchen Transformation',
      location: 'Bangalore, KA',
      category: 'Kitchen',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'
    },
    {
      title: 'Luxury Bathroom Remodel',
      location: 'Mysore, KA',
      category: 'Bathroom',
      image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop'
    },
    {
      title: 'Complete Villa Renovation',
      location: 'Bangalore, KA',
      category: 'Full Home',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
    },
    {
      title: 'Office Space Makeover',
      location: 'Bangalore, KA',
      category: 'Commercial',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop'
    }
  ];

  const stats = [
    { value: '200+', label: 'Renovations Completed' },
    { value: '98%', label: 'Client Satisfaction' },
    { value: '15+', label: 'Years Experience' },
    { value: '45-Day', label: 'Avg. Project Time' }
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
          backgroundImage: 'url(https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1920&h=1080&fit=crop)',
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
          <span style={{
            display: 'inline-block',
            backgroundColor: 'rgba(197, 156, 130, 0.2)',
            color: '#C59C82',
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '24px',
            border: '1px solid rgba(197, 156, 130, 0.3)'
          }}>
            Complete Renovation Services
          </span>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(36px, 8vw, 72px)',
            fontWeight: 400,
            color: 'white',
            marginBottom: '24px',
            lineHeight: 1.1
          }}>
            Transform Your Space.
            <br />
            <span style={{ fontStyle: 'italic', color: '#C59C82' }}>Elevate Your Life.</span>
          </h1>
          <p style={{
            color: '#9CA3AF',
            fontSize: '18px',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: 1.7
          }}>
            From dated to dazzling. Our expert renovation services breathe new life into homes and commercial spaces with thoughtful design and flawless execution.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#contact" style={{
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
              Start Your Renovation
              <ArrowRight size={18} />
            </a>
            <a href="#portfolio" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '9999px',
              fontSize: '16px',
              fontWeight: 500,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.3)',
              transition: 'border-color 0.2s'
            }}>
              View Our Work
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '48px 24px', backgroundColor: '#1A1A1A' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '32px',
            textAlign: 'center'
          }}>
            {stats.map((stat, index) => (
              <div key={index}>
                <div style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 'clamp(32px, 5vw, 48px)',
                  fontWeight: 400,
                  color: '#C59C82',
                  marginBottom: '8px'
                }}>
                  {stat.value}
                </div>
                <div style={{ color: '#9CA3AF', fontSize: '14px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Renovation Section */}
      <section style={{ padding: 'clamp(48px, 10vw, 96px) 24px', backgroundColor: '#111111' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="grid-responsive-2" style={{ alignItems: 'center', gap: '48px' }}>
            {/* Image */}
            <div style={{
              position: 'relative',
              borderRadius: '24px',
              overflow: 'hidden'
            }}>
              <img
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=500&fit=crop"
                alt="Renovation in progress"
                style={{
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '24px',
                left: '24px',
                right: '24px',
                backgroundColor: 'rgba(17, 17, 17, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <RefreshCw size={24} style={{ color: '#C59C82' }} />
                  <div>
                    <div style={{ color: 'white', fontWeight: 600 }}>Seamless Transformations</div>
                    <div style={{ color: '#9CA3AF', fontSize: '13px' }}>From concept to completion</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
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
                Why Renovate With Us
              </span>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 'clamp(28px, 5vw, 42px)',
                fontWeight: 400,
                color: 'white',
                marginBottom: '24px',
                lineHeight: 1.2
              }}>
                Reimagine Your Space
                <br />
                <span style={{ fontStyle: 'italic', color: '#C59C82' }}>Without The Hassle</span>
              </h2>
              <p style={{
                color: '#9CA3AF',
                fontSize: '16px',
                lineHeight: 1.8,
                marginBottom: '32px'
              }}>
                Renovation doesn't have to be stressful. At HOH108, we handle every aspect of your project—from initial design to final cleanup. Our experienced team delivers stunning transformations on time and on budget, with minimal disruption to your daily life.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {['Fixed-price quotes', 'Dedicated project manager', 'Quality materials', 'Clean worksite'].map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={20} style={{ color: '#C59C82' }} />
                    <span style={{ color: '#E5E5E5', fontSize: '14px' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
              The HOH108 Difference
            </span>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 400,
              color: 'white',
              lineHeight: 1.2
            }}>
              Why Choose Us For Your
              <br />
              <span style={{ fontStyle: 'italic', color: '#C59C82' }}>Renovation Project</span>
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
                  textAlign: 'center',
                  transition: 'transform 0.3s ease'
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

      {/* Services Section */}
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
              Comprehensive Renovation
              <br />
              <span style={{ fontStyle: 'italic', color: '#C59C82' }}>Solutions</span>
            </h2>
          </div>

          <div className="grid-responsive-3">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <div key={index} style={{
                  backgroundColor: '#1A1A1A',
                  borderRadius: '24px',
                  padding: '32px',
                  border: '1px solid rgba(197, 156, 130, 0.1)',
                  transition: 'border-color 0.3s ease'
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    backgroundColor: '#C59C82',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                  }}>
                    <IconComponent size={26} style={{ color: '#111111' }} />
                  </div>
                  <h3 style={{
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 600,
                    marginBottom: '12px'
                  }}>
                    {service.title}
                  </h3>
                  <p style={{
                    color: '#9CA3AF',
                    fontSize: '14px',
                    lineHeight: 1.7,
                    marginBottom: '20px'
                  }}>
                    {service.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {service.features.map((feature, idx) => (
                      <span key={idx} style={{
                        backgroundColor: 'rgba(197, 156, 130, 0.1)',
                        color: '#C59C82',
                        padding: '6px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px'
                      }}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
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
              Our Process
            </span>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 400,
              color: 'white',
              lineHeight: 1.2
            }}>
              How We Transform
              <br />
              <span style={{ fontStyle: 'italic', color: '#C59C82' }}>Your Space</span>
            </h2>
          </div>

          <div className="grid-responsive-2" style={{ gap: '48px', alignItems: 'start' }}>
            {/* Process Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {process.map((step, index) => (
                <div
                  key={index}
                  onClick={() => setActiveProcess(index)}
                  style={{
                    backgroundColor: activeProcess === index ? '#C59C82' : '#111111',
                    borderRadius: '20px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: '32px',
                      fontWeight: 400,
                      color: activeProcess === index ? '#111111' : '#C59C82'
                    }}>
                      {step.step}
                    </span>
                    <h3 style={{
                      color: activeProcess === index ? '#111111' : 'white',
                      fontSize: '18px',
                      fontWeight: 600
                    }}>
                      {step.title}
                    </h3>
                  </div>
                  {activeProcess === index && (
                    <p style={{
                      color: 'rgba(17, 17, 17, 0.8)',
                      fontSize: '14px',
                      lineHeight: 1.7,
                      marginTop: '16px',
                      paddingLeft: '56px'
                    }}>
                      {step.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Process Image */}
            <div style={{
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'sticky',
              top: '120px'
            }}>
              <img
                src={[
                  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=500&fit=crop',
                  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=500&fit=crop',
                  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&h=500&fit=crop',
                  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=500&fit=crop'
                ][activeProcess]}
                alt={process[activeProcess].title}
                style={{
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  transition: 'opacity 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Work Section */}
      <section id="portfolio" style={{ padding: 'clamp(48px, 10vw, 96px) 24px', backgroundColor: '#111111' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
              Portfolio
            </span>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 400,
              color: 'white',
              lineHeight: 1.2
            }}>
              Recent Renovation
              <br />
              <span style={{ fontStyle: 'italic', color: '#C59C82' }}>Transformations</span>
            </h2>
          </div>

          {/* Project Carousel */}
          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: '24px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <img
                src={projects[currentProject].image}
                alt={projects[currentProject].title}
                style={{
                  width: '100%',
                  height: '500px',
                  objectFit: 'cover'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(17, 17, 17, 0.9), transparent)',
                padding: '60px 32px 32px'
              }}>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: '#C59C82',
                  color: '#111111',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 500,
                  marginBottom: '12px'
                }}>
                  {projects[currentProject].category}
                </span>
                <h3 style={{
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  {projects[currentProject].title}
                </h3>
                <p style={{
                  color: '#9CA3AF',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <MapPin size={14} />
                  {projects[currentProject].location}
                </p>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevProject}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              <ChevronLeft size={24} style={{ color: '#111111' }} />
            </button>
            <button
              onClick={nextProject}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
            >
              <ChevronRight size={24} style={{ color: '#111111' }} />
            </button>
          </div>

          {/* Navigation Dots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '24px'
          }}>
            {projects.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentProject(index)}
                style={{
                  width: index === currentProject ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: index === currentProject ? '#C59C82' : 'rgba(197, 156, 130, 0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section with Contact Form */}
      <section id="contact" style={{ padding: 'clamp(48px, 10vw, 96px) 24px', backgroundColor: '#C59C82' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="grid-responsive-2" style={{ alignItems: 'center', gap: '48px' }}>
            {/* Left Content */}
            <div>
              <h2 style={{
                fontFamily: "'Oswald', sans-serif",
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 400,
                color: '#111111',
                marginBottom: '24px',
                lineHeight: 1.2
              }}>
                Ready to Transform
                <br />
                <span style={{ fontStyle: 'italic' }}>Your Space?</span>
              </h2>
              <p style={{
                color: 'rgba(17, 17, 17, 0.8)',
                fontSize: '16px',
                lineHeight: 1.8,
                marginBottom: '32px'
              }}>
                Let's discuss your renovation dreams. Whether it's a single room refresh or a complete home transformation, our team is ready to bring your vision to life.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'rgba(17, 17, 17, 0.1)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Phone size={18} style={{ color: '#111111' }} />
                  </div>
                  <span style={{ color: '#111111', fontSize: '14px' }}>+91 8861888424</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'rgba(17, 17, 17, 0.1)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Mail size={18} style={{ color: '#111111' }} />
                  </div>
                  <span style={{ color: '#111111', fontSize: '14px' }}>renovation@hoh108.com</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: 'clamp(24px, 5vw, 40px)'
            }}>
              <h3 style={{
                color: '#111111',
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '24px'
              }}>
                Get a Free Consultation
              </h3>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="consultation-input"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="consultation-input"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="consultation-input"
                />
                <select
                  className="consultation-input"
                  style={{ cursor: 'pointer' }}
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
                  className="consultation-input"
                  style={{ resize: 'vertical' }}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    backgroundColor: '#111111',
                    color: 'white',
                    borderRadius: '9999px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s'
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
