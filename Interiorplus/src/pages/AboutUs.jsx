import { Link } from 'react-router-dom';
import { ArrowLeft, Target, Eye, Award, Users, Clock, Shield, Palette, Wrench } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

// Director Images
import sandeepImg from '../assets/Team/Directors/Sandeep.jpeg';
import chandanImg from '../assets/Team/Directors/Chandan-Sharma.jpeg';

// Team Images
import shobhaImg from '../assets/Team/CoreTeam/Shobha.png';
import sujeetImg from '../assets/Team/CoreTeam/Sujeet.png';
import venkateshImg from '../assets/Team/CoreTeam/venkatesh.png';
import surajImg from '../assets/Team/CoreTeam/Suraj.webp';
import karthikImg from '../assets/Team/CoreTeam/Karthik.png';
import avinashImg from '../assets/Team/CoreTeam/avinash.png';
import praveenImg from '../assets/Team/CoreTeam/Praveen.png';

const AboutUs = () => {
  const stats = [
    { number: '20+', label: 'Years Experience' },
    { number: '5000+', label: 'Happy Customers' },
    { number: '10', label: 'Years Warranty' },
    { number: '4', label: 'Cities' },
  ];

  const directors = [
    { name: 'Mr. Sandeep Selvam', role: 'Director', image: sandeepImg },
    { name: 'Mr. Chandan Kumar Sharma', role: 'Director', image: chandanImg },
  ];

  const team = [
    { name: 'Ms. Shobha', role: 'HR Head', image: shobhaImg },
    { name: 'Mr. Sujeet', role: 'Production Head', image: sujeetImg },
    { name: 'Mr. Venkatesh', role: 'Associate Community Manager', image: venkateshImg },
    { name: 'Mr. Suraj', role: 'Community Manager', image: surajImg },
    { name: 'Mr. Karthik', role: 'AGM Sales', image: karthikImg },
    { name: 'Mr. Avinash', role: 'AGM Operations', image: avinashImg },
    { name: 'Mr. Praveen', role: 'AGM Business', image: praveenImg },
  ];

  const values = [
    { icon: Award, title: 'Quality Excellence', desc: 'Premium materials and craftsmanship in every project' },
    { icon: Users, title: 'Customer First', desc: 'Your satisfaction is our top priority' },
    { icon: Clock, title: 'Timely Delivery', desc: 'We respect your time and deliver on schedule' },
    { icon: Shield, title: '10 Year Warranty', desc: 'Long-term protection for your investment' },
  ];

  const services = [
    { icon: Palette, title: 'Design Consultation', desc: 'Expert guidance for your interior vision' },
    { icon: Eye, title: '3D Visualization', desc: 'See your space before we build it' },
    { icon: Wrench, title: 'Manufacturing', desc: 'State-of-the-art production facility' },
    { icon: Target, title: 'Installation', desc: 'Professional installation by trained teams' },
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

            <div style={{ maxWidth: '800px' }}>
              <h1 className="font-heading" style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                color: '#FFFFFF',
                marginBottom: '24px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: '1.2',
              }}>
                About <span style={{ color: '#C59C82' }}>Interior Plus</span>
              </h1>
              <p style={{
                fontSize: '18px',
                color: '#A1A1A1',
                lineHeight: '1.8',
                marginBottom: '16px',
              }}>
                Interior Plus is dedicated to providing end-to-end interior design solutions for individual
                consumers and businesses alike. We make global-standard interior design accessible and
                affordable for Indian consumers.
              </p>
              <p style={{
                fontSize: '16px',
                color: '#A1A1A1',
                lineHeight: '1.8',
              }}>
                With state-of-the-art technology and collaborations with top-notch companies, we've pioneered
                contemporary design approaches throughout India.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section style={{ padding: '60px 16px', backgroundColor: '#0A0A0A' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '32px',
            }}>
              {stats.map((stat, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <p style={{
                    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                    fontWeight: 'bold',
                    color: '#C59C82',
                    marginBottom: '8px',
                  }}>
                    {stat.number}
                  </p>
                  <p style={{ color: '#A1A1A1', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section style={{ padding: '80px 16px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '48px',
              alignItems: 'center',
            }}>
              <div>
                <h2 className="font-heading" style={{
                  fontSize: '2rem',
                  color: '#E5E5E5',
                  marginBottom: '24px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Our <span style={{ color: '#C59C82' }}>Story</span>
                </h2>
                <p style={{
                  color: '#A1A1A1',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  marginBottom: '16px',
                }}>
                  Founded two decades ago as a modest carpentry operation, Interior Plus has evolved into
                  one of India's leading interior design companies. What started with small projects has
                  grown into large-scale commercial ventures.
                </p>
                <p style={{
                  color: '#A1A1A1',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  marginBottom: '16px',
                }}>
                  Over the past five years, we've significantly expanded our B2B market presence while
                  continuing to serve professionals, corporations, and individual clients with the same
                  dedication and craftsmanship.
                </p>
                <p style={{
                  color: '#A1A1A1',
                  fontSize: '16px',
                  lineHeight: '1.8',
                }}>
                  Today, we operate across multiple cities with a state-of-the-art manufacturing facility,
                  a talented team of designers, and a commitment to making every home beautiful.
                </p>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}>
                <div style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  aspectRatio: '1',
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80"
                    alt="Interior Design"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  aspectRatio: '1',
                  marginTop: '32px',
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80"
                    alt="Kitchen Design"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  aspectRatio: '1',
                  marginTop: '-32px',
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&q=80"
                    alt="Wardrobe Design"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  aspectRatio: '1',
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80"
                    alt="Living Room"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section style={{ padding: '80px 16px', backgroundColor: '#0A0A0A' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '32px',
            }}>
              <div style={{
                padding: '40px',
                backgroundColor: '#1A1A1A',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(197, 156, 130, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                }}>
                  <Target size={28} color="#C59C82" />
                </div>
                <h3 className="font-heading" style={{
                  fontSize: '1.5rem',
                  color: '#E5E5E5',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Our Mission
                </h3>
                <p style={{ color: '#A1A1A1', lineHeight: '1.7' }}>
                  To transform every living space into a personalized haven that reflects our clients'
                  unique personalities and lifestyles, while maintaining the highest standards of quality
                  and affordability.
                </p>
              </div>
              <div style={{
                padding: '40px',
                backgroundColor: '#1A1A1A',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(197, 156, 130, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                }}>
                  <Eye size={28} color="#C59C82" />
                </div>
                <h3 className="font-heading" style={{
                  fontSize: '1.5rem',
                  color: '#E5E5E5',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Our Vision
                </h3>
                <p style={{ color: '#A1A1A1', lineHeight: '1.7' }}>
                  To be India's most trusted interior design brand, known for innovative designs,
                  exceptional craftsmanship, and customer-centric approach that makes world-class
                  interiors accessible to every Indian home.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
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
              Our <span style={{ color: '#C59C82' }}>Values</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
            }}>
              {values.map((value, index) => (
                <div
                  key={index}
                  style={{
                    padding: '32px 24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(197, 156, 130, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <value.icon size={24} color="#C59C82" />
                  </div>
                  <h3 style={{
                    color: '#E5E5E5',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    {value.title}
                  </h3>
                  <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                    {value.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
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
              What We <span style={{ color: '#C59C82' }}>Offer</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
            }}>
              {services.map((service, index) => (
                <div
                  key={index}
                  style={{
                    padding: '32px 24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(197, 156, 130, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <service.icon size={24} color="#C59C82" />
                  </div>
                  <h3 style={{
                    color: '#E5E5E5',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    {service.title}
                  </h3>
                  <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                    {service.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership Team */}
        <section style={{ padding: '80px 16px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Our <span style={{ color: '#C59C82' }}>Leadership</span>
            </h2>
            <p style={{
              color: '#A1A1A1',
              textAlign: 'center',
              marginBottom: '48px',
              maxWidth: '600px',
              margin: '0 auto 48px',
            }}>
              Meet the visionaries driving Interior Plus forward
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '48px',
              marginBottom: '64px',
              flexWrap: 'wrap',
            }}>
              {directors.map((director, index) => (
                <div
                  key={index}
                  style={{
                    textAlign: 'center',
                    maxWidth: '280px',
                  }}
                >
                  <div style={{
                    position: 'relative',
                    width: '220px',
                    height: '220px',
                    margin: '0 auto 24px',
                  }}>
                    {/* Outer glow ring */}
                    <div style={{
                      position: 'absolute',
                      inset: '0',
                      borderRadius: '50%',
                      background: 'conic-gradient(from 0deg, transparent, #C59C82, #E8D5C4, #C59C82, transparent)',
                      animation: 'spinGlow 3s linear infinite',
                      filter: 'blur(2px)',
                    }} />
                    {/* Inner glow ring */}
                    <div style={{
                      position: 'absolute',
                      inset: '4px',
                      borderRadius: '50%',
                      background: 'conic-gradient(from 180deg, transparent, rgba(197, 156, 130, 0.8), transparent)',
                      animation: 'spinGlow 3s linear infinite reverse',
                    }} />
                    {/* Dark background to create ring effect */}
                    <div style={{
                      position: 'absolute',
                      inset: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#111111',
                    }} />
                    <img
                      src={director.image}
                      alt={director.name}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #1A1A1A',
                        boxShadow: '0 0 30px rgba(197, 156, 130, 0.3)',
                      }}
                    />
                  </div>
                  <h3 style={{
                    color: '#C59C82',
                    fontSize: '22px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}>
                    {director.name}
                  </h3>
                  <div style={{
                    width: '40px',
                    height: '3px',
                    backgroundColor: '#C59C82',
                    margin: '0 auto 12px',
                    borderRadius: '2px',
                  }} />
                  <p style={{ color: '#A1A1A1', fontSize: '14px', letterSpacing: '0.05em' }}>
                    {director.role}
                  </p>
                </div>
              ))}
            </div>

            <style>{`
              @keyframes spinGlow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>

            {/* Key Team Members */}
            <h3 className="font-heading" style={{
              fontSize: '1.5rem',
              color: '#E5E5E5',
              marginBottom: '32px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Key Team Members
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '20px',
            }}>
              {team.map((member, index) => (
                <div
                  key={index}
                  style={{
                    padding: '24px 20px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      objectPosition: 'top center',
                      margin: '0 auto 16px',
                      display: 'block',
                      border: '2px solid rgba(197, 156, 130, 0.3)',
                    }}
                  />
                  <h4 style={{
                    color: '#E5E5E5',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '6px',
                  }}>
                    {member.name}
                  </h4>
                  <p style={{ color: '#A1A1A1', fontSize: '12px' }}>
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          padding: '80px 16px',
          backgroundColor: '#1A1A1A',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Let's Create Something Beautiful
            </h2>
            <p style={{
              color: '#A1A1A1',
              marginBottom: '32px',
              fontSize: '16px',
              lineHeight: '1.7',
            }}>
              Ready to transform your space? Book a free consultation with our design experts today.
            </p>
            <Link
              to="/#consultation"
              style={{
                display: 'inline-block',
                backgroundColor: '#C59C82',
                color: '#111111',
                padding: '16px 40px',
                borderRadius: '50px',
                fontWeight: '600',
                textDecoration: 'none',
                fontSize: '16px',
              }}
            >
              Book Free Consultation
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default AboutUs;
