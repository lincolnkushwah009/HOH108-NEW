import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import FAQ from '../components/FAQ';

// Import kitchen images
import kitchen1 from '../assets/modular-kitchen/Kitchen-1-scaled.jpg';
import kitchen2 from '../assets/modular-kitchen/Kitchen-2.jpg';
import kitchen3 from '../assets/modular-kitchen/Kitchen-3.jpg';
import kitchen4 from '../assets/modular-kitchen/kitchen-4.jpg';
import kitchen6 from '../assets/modular-kitchen/kitchen-6.jpg';
import kitchen7 from '../assets/modular-kitchen/kitchen-7.png';
import kitchen8 from '../assets/modular-kitchen/kitchen-8.jpeg';
import kitchen9 from '../assets/modular-kitchen/kitchen-9.jpeg';
import kitchen10 from '../assets/modular-kitchen/kitchen-10.jpg';
import kitchen11 from '../assets/modular-kitchen/Kitchen-11.jpg';
import kitchenHero from '../assets/modular-kitchen/Untitled-design-1.jpg';

const ModularKitchen = () => {
  const kitchenFaqs = [
    {
      question: 'Is interior designing and modular kitchens worth it for homes?',
      answer: 'Absolutely! Interior Plus creates high-quality modular kitchens with a factory finish at affordable prices. Such investments save time and money long-term while maximizing space.',
    },
    {
      question: 'How to choose modular kitchen interiors?',
      answer: 'Consider your space, storage requirements, and cooking habits. Interior Plus offers consultations to help you design the perfect layout and choose features that fit your lifestyle, with stain and water-resistant surfaces.',
    },
    {
      question: 'How to plan a small modular kitchen design in India?',
      answer: 'Interior Plus specializes in space-saving solutions! We can help you create a functional and stylish kitchen, even in a compact area with customizable modular units for maximizing compact spaces.',
    },
    {
      question: 'Can modular kitchen designs be customized?',
      answer: 'Yes! You can choose from a variety of cabinets, drawers, countertops, and accessories to personalize your dream kitchen, allowing designs reflecting individual taste.',
    },
    {
      question: 'Why do people go for modular kitchens?',
      answer: 'Benefits include factory-finished quality, durability with stain-resistant surfaces, customization options, and easy installation of prefabricated units.',
    },
    {
      question: 'Which is the best kitchen design studio in Bangalore?',
      answer: 'We recommend checking out Interior Plus\'s portfolio and reviews to see if their style aligns with your vision. With over 15 years of experience, we deliver quality solutions.',
    },
    {
      question: 'How can I find the best modular kitchen design for my budget?',
      answer: 'Consulting design experts helps customize solutions matching requirements within budget constraints. We offer flexible payment options and transparent pricing.',
    },
    {
      question: 'Are there affordable modular kitchen options available?',
      answer: 'Yes! Interior Plus offers factory-grade modular kitchen designs that are not only affordable but also highly customizable to fit your needs and budget.',
    },
  ];

  const features = [
    'Custom cabinet designs tailored to your space',
    'Premium hardware fittings from top brands',
    'Waterproof and termite-resistant materials',
    'Soft-close mechanisms for all drawers',
    'Smart storage solutions for maximum efficiency',
    'Modern finishes - Matte, Glossy, Acrylic',
    'Island kitchen and parallel kitchen options',
    'Built-in appliance integration',
  ];

  const images = [
    kitchen1,
    kitchen2,
    kitchen3,
    kitchen4,
    kitchen6,
    kitchen7,
    kitchen8,
    kitchen9,
    kitchen10,
    kitchen11,
  ];

  const kitchenTypes = [
    { name: 'L-Shaped Kitchen', desc: 'Perfect for medium-sized spaces with efficient workflow' },
    { name: 'U-Shaped Kitchen', desc: 'Maximum storage and counter space for large kitchens' },
    { name: 'Parallel Kitchen', desc: 'Ideal for narrow spaces with dual work zones' },
    { name: 'Island Kitchen', desc: 'Modern design with central workspace and seating' },
    { name: 'Straight Kitchen', desc: 'Space-saving design for compact apartments' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, backgroundColor: '#111111' }}>
        {/* Hero Section */}
        <section style={{
          padding: '80px 16px',
          backgroundImage: `linear-gradient(rgba(17, 17, 17, 0.85), rgba(17, 17, 17, 0.95)), url(${kitchenHero})`,
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
              Modular Kitchen <span style={{ color: '#C59C82' }}>Designers</span>
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
              Transform your cooking space with our premium modular kitchens. Designed for efficiency,
              style, and durability - we create kitchens that inspire culinary creativity.
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
              Why Choose Our <span style={{ color: '#C59C82' }}>Modular Kitchens</span>
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

        {/* Kitchen Types */}
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
              Kitchen <span style={{ color: '#C59C82' }}>Layouts</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
            }}>
              {kitchenTypes.map((type, index) => (
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
                    {type.name}
                  </h3>
                  <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                    {type.desc}
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
                    alt={`Modular Kitchen Design ${index + 1}`}
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
        <FAQ faqs={kitchenFaqs} />

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
              Ready to Transform Your Kitchen?
            </h2>
            <p style={{
              color: '#A1A1A1',
              marginBottom: '32px',
              fontSize: '16px',
              lineHeight: '1.7',
            }}>
              Book a free consultation with our design experts and get a personalized quote for your dream kitchen.
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

export default ModularKitchen;
