import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import FAQ from '../components/FAQ';

// Import wardrobe images
import wardrobe1 from '../assets/modular-wardrobes/Wardrobe-1.webp';
import wardrobe2 from '../assets/modular-wardrobes/Wardrobe-2.webp';
import wardrobe3 from '../assets/modular-wardrobes/wardrobe-3.webp';
import wardrobe4 from '../assets/modular-wardrobes/wardrobe-4.webp';
import wardrobe5 from '../assets/modular-wardrobes/wardrobe-5.webp';
import wardrobe11 from '../assets/modular-wardrobes/wardrobe-11.webp';
import wardrobe12 from '../assets/modular-wardrobes/wardrobe-12.webp';
import wardrobe13 from '../assets/modular-wardrobes/wardrobe-13.webp';
import wardrobe16 from '../assets/modular-wardrobes/wardrobe-16.webp';
import wardrobe17 from '../assets/modular-wardrobes/wardrobe-17.webp';
import wardrobe18 from '../assets/modular-wardrobes/wardrobe-18.webp';
import wardrobe19 from '../assets/modular-wardrobes/wardrobe-19.webp';
import wardrobeHero from '../assets/modular-wardrobes/img-min-scaled.jpg';

const Wardrobe = () => {
  const wardrobeFaqs = [
    {
      question: 'What types of wardrobe designs are available in Bangalore?',
      answer: 'Interior Plus offers modern modular wardrobes, classic built-in styles, and walk-in closets. We customize designs to suit any home\'s specific needs and preferences.',
    },
    {
      question: 'Where can I find the best sliding wardrobe designs?',
      answer: 'Interior Plus specializes in sliding wardrobe designs that save space and create a sleek, modern appearance using high-quality materials that ensure smooth gliding.',
    },
    {
      question: 'What is a modular wardrobe design?',
      answer: 'These are prefabricated units that can be customized to fit your specific space and storage needs, allowing efficient bedroom use even in awkward corners.',
    },
    {
      question: 'What are the benefits of customized bedroom wardrobes?',
      answer: 'Benefits include perfect fit utilizing every inch of space, matching your style through various finishes and colors, and optimized functionality with pull-out drawers and organizers.',
    },
    {
      question: 'Are modular wardrobes good?',
      answer: 'Yes! They offer affordability, durability with sturdy construction and stain-resistant surfaces, versatility, and easy installation by experienced professionals.',
    },
    {
      question: 'What are reasons to invest in modular wardrobes?',
      answer: 'They increase storage capacity, improve organization of clothes and accessories, and enhance bedroom aesthetics overall while being cost-effective.',
    },
    {
      question: 'What wardrobe type suits small bedrooms?',
      answer: 'Design should utilize vertical space efficiently with adjustable shelves, pull-out drawers, sliding doors, and built-in organizers to maximize storage in compact spaces.',
    },
    {
      question: 'What different wardrobe types exist?',
      answer: 'Walk-in wardrobes, hinged wardrobes, sliding door wardrobes, corner wardrobes, and mirrored wardrobes are available options to suit different needs and spaces.',
    },
    {
      question: 'How to choose the best wardrobe interior design?',
      answer: 'Consider storage requirements, available space, style preferences, and budget. Consulting experts helps tailor designs to your specific needs and lifestyle.',
    },
  ];

  const features = [
    'Sliding door wardrobes for space efficiency',
    'Walk-in closet designs for luxury homes',
    'Premium accessory organizers included',
    'High-quality finishes - Laminate, Veneer, Lacquer',
    'Custom compartments for all storage needs',
    'Soft-close hinges and drawers',
    'Built-in lighting options',
    'Mirror integration and dressing units',
  ];

  const images = [
    wardrobe1,
    wardrobe2,
    wardrobe3,
    wardrobe4,
    wardrobe5,
    wardrobe11,
    wardrobe12,
    wardrobe13,
    wardrobe16,
    wardrobe17,
    wardrobe18,
    wardrobe19,
  ];

  const wardrobeTypes = [
    { name: 'Sliding Wardrobes', desc: 'Space-saving design perfect for compact bedrooms' },
    { name: 'Hinged Wardrobes', desc: 'Classic design with full door opening access' },
    { name: 'Walk-in Closets', desc: 'Luxurious storage solution for larger spaces' },
    { name: 'Corner Wardrobes', desc: 'Maximize unused corner spaces efficiently' },
    { name: 'Built-in Wardrobes', desc: 'Seamless integration with room architecture' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, backgroundColor: '#111111' }}>
        {/* Hero Section */}
        <section style={{
          padding: '80px 16px',
          backgroundImage: `linear-gradient(rgba(17, 17, 17, 0.85), rgba(17, 17, 17, 0.95)), url(${wardrobeHero})`,
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
              Modular Wardrobes <span style={{ color: '#C59C82' }}>Interior Design</span>
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#A1A1A1',
              marginBottom: '24px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Bangalore
            </p>
            <p style={{
              fontSize: '18px',
              color: '#A1A1A1',
              maxWidth: '700px',
              lineHeight: '1.7',
              marginBottom: '32px',
            }}>
              Maximize your storage with beautifully designed wardrobes. Sliding, hinged, or walk-in -
              we create wardrobes that combine style with functionality.
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
              Wardrobe <span style={{ color: '#C59C82' }}>Features</span>
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

        {/* Wardrobe Types */}
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
              Wardrobe <span style={{ color: '#C59C82' }}>Types</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px',
            }}>
              {wardrobeTypes.map((type, index) => (
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
                    alt={`Wardrobe Design ${index + 1}`}
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
        <FAQ faqs={wardrobeFaqs} />

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
              Ready to Organize Your Space?
            </h2>
            <p style={{
              color: '#A1A1A1',
              marginBottom: '32px',
              fontSize: '16px',
              lineHeight: '1.7',
            }}>
              Book a free consultation with our design experts and get a personalized quote for your dream wardrobe.
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

export default Wardrobe;
