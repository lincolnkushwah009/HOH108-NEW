import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import FAQ from '../components/FAQ';

// Import living room images
import living1 from '../assets/living-room/Living-1.webp';
import living2 from '../assets/living-room/Living-2.jpg';
import living3 from '../assets/living-room/living-3-scaled.jpg';
import living4 from '../assets/living-room/living-4-scaled.jpg';
import living5 from '../assets/living-room/living-5.jpeg';
import living6 from '../assets/living-room/living-6.jpeg';
import living7 from '../assets/living-room/living-7.webp';
import living9 from '../assets/living-room/living-9.jpg';
import living10 from '../assets/living-room/living-10.jpg';
import livingHero from '../assets/living-room/img-113-min-scaled.jpg';

const LivingRoom = () => {
  const livingRoomFaqs = [
    {
      question: 'Who are the best interior designers in Bangalore?',
      answer: 'Interior Plus is a leading interior design service provider in Bangalore. With over 15 years of experience, they deliver affordable solutions in the industry.',
    },
    {
      question: 'Can you give an example of a modern room interior design?',
      answer: 'Browse Interior Plus\'s portfolio for modern room interior designs created with high-quality, factory-finish materials that showcase contemporary styles.',
    },
    {
      question: 'Should we get the interior design done in the drawing room?',
      answer: 'Yes! Design work in the drawing room helps you express your unique style and makes your home more welcoming for family and guests.',
    },
    {
      question: 'How do people afford interior designers?',
      answer: 'Interior designers are not a luxury anymore. Businesses like Interior Plus offer affordable interior design services with flexible payment options.',
    },
    {
      question: 'What do people struggle most with interior design?',
      answer: 'Interior design challenges include managing material procurement, project management, and installation. Professional services help eliminate these inefficiencies.',
    },
    {
      question: 'What are the best interior design ideas for a living room?',
      answer: 'The ideal design suits your style, accommodates your needs, and fits your budget. Consulting professional designers helps identify the best approach for your space.',
    },
    {
      question: 'Can an interior designer design even a small room?',
      answer: 'Yes! Designers should be involved in small room projects since their expertise optimizes space utilization efficiently, making even compact spaces functional and beautiful.',
    },
    {
      question: 'How can I find the best interior design for my living room on a budget?',
      answer: 'Seek affordable companies offering cost-effective solutions. Modular designs and versatile furniture pieces help maximize your budget while achieving great results.',
    },
  ];

  const features = [
    'Custom TV unit designs with hidden wiring',
    'False ceiling solutions with ambient lighting',
    'Accent wall designs with PU/Veneer finish',
    'Smart lighting integration',
    'Space optimization for all room sizes',
    'Premium sofa and seating arrangements',
    'Modular storage and display units',
    'Customized center table designs',
  ];

  const images = [
    living1,
    living2,
    living3,
    living4,
    living5,
    living6,
    living7,
    living9,
    living10,
  ];

  const designStyles = [
    { name: 'Contemporary', desc: 'Clean lines with a mix of modern and classic elements' },
    { name: 'Minimalist', desc: 'Simple, clutter-free spaces with functional furniture' },
    { name: 'Traditional Indian', desc: 'Rich textures, warm colors, and cultural elements' },
    { name: 'Modern Luxury', desc: 'Premium materials with sophisticated aesthetics' },
    { name: 'Scandinavian', desc: 'Light, airy spaces with natural materials' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, backgroundColor: '#111111' }}>
        {/* Hero Section */}
        <section style={{
          padding: '80px 16px',
          backgroundImage: `linear-gradient(rgba(17, 17, 17, 0.85), rgba(17, 17, 17, 0.95)), url(${livingHero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h1 className="font-heading" style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: '#FFFFFF',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Living Room <span style={{ color: '#C59C82' }}>Interior Design</span>
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#A1A1A1',
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              HSR Layout, Bangalore
            </p>
            <p style={{
              fontSize: '18px',
              color: '#A1A1A1',
              maxWidth: '700px',
              lineHeight: '1.7',
              marginBottom: '32px',
            }}>
              Create a stunning living space that reflects your personality. From TV units to complete
              living room solutions - we design spaces that bring families together.
            </p>
            <Link
              to="/#consultation"
              style={{
                display: 'inline-block',
                backgroundColor: '#C59C82',
                color: '#111111',
                padding: '16px 32px',
                borderRadius: '50px',
                fontWeight: '600',
                textDecoration: 'none',
                fontSize: '16px',
              }}
            >
              Get Free Quote
            </Link>
          </div>
        </section>

        {/* Features Section */}
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
              Living Room <span style={{ color: '#C59C82' }}>Features</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    padding: '20px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(197, 156, 130, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Check size={14} color="#C59C82" />
                  </div>
                  <span style={{ color: '#E5E5E5', fontSize: '15px' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Design Styles */}
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
              Design <span style={{ color: '#C59C82' }}>Styles</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
            }}>
              {designStyles.map((style, index) => (
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
                  <h3 style={{
                    color: '#C59C82',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    {style.name}
                  </h3>
                  <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                    {style.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Section */}
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
              Our <span style={{ color: '#C59C82' }}>Work</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}>
              {images.map((image, index) => (
                <div
                  key={index}
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    aspectRatio: '4/3',
                  }}
                >
                  <img
                    src={image}
                    alt={`Living Room Design ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQ faqs={livingRoomFaqs} />

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
              Ready to Transform Your Living Room?
            </h2>
            <p style={{
              color: '#A1A1A1',
              marginBottom: '32px',
              fontSize: '16px',
              lineHeight: '1.7',
            }}>
              Book a free consultation with our design experts and get a personalized quote for your dream living space.
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

export default LivingRoom;
