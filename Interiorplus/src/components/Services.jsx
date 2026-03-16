import { useState } from 'react';
import { FaArrowRight } from 'react-icons/fa';

// Import kitchen images
import kitchen1 from '../assets/modular-kitchen/Kitchen-1-scaled.jpg';
import kitchen2 from '../assets/modular-kitchen/Kitchen-2.jpg';
import kitchen3 from '../assets/modular-kitchen/Kitchen-3.jpg';

// Import living room images
import living1 from '../assets/living-room/Living-1.webp';
import living2 from '../assets/living-room/Living-2.jpg';
import living3 from '../assets/living-room/living-3-scaled.jpg';

// Import wardrobe images
import wardrobe1 from '../assets/modular-wardrobes/Wardrobe-1.webp';
import wardrobe2 from '../assets/modular-wardrobes/Wardrobe-2.webp';
import wardrobe3 from '../assets/modular-wardrobes/wardrobe-3.webp';

const Services = () => {
  const [activeTab, setActiveTab] = useState('kitchen');

  const services = {
    kitchen: {
      title: 'Modular Kitchen',
      description: 'Transform your cooking space with our premium modular kitchens. Designed for efficiency, style, and durability.',
      features: ['Custom cabinet designs', 'Premium hardware fittings', 'Waterproof materials', 'Soft-close mechanisms', 'Smart storage solutions'],
      images: [kitchen1, kitchen2, kitchen3],
    },
    livingRoom: {
      title: 'Living Room',
      description: 'Create a stunning living space that reflects your personality. From TV units to complete living room solutions.',
      features: ['Custom TV unit designs', 'False ceiling solutions', 'Accent wall designs', 'Lighting integration', 'Space optimization'],
      images: [living1, living2, living3],
    },
    wardrobe: {
      title: 'Wardrobe',
      description: 'Maximize your storage with beautifully designed wardrobes. Sliding, hinged, or walk-in - we have it all.',
      features: ['Sliding door options', 'Walk-in closet designs', 'Accessory organizers', 'Premium finishes', 'Custom compartments'],
      images: [wardrobe1, wardrobe2, wardrobe3],
    },
  };

  const activeService = services[activeTab];

  return (
    <section id="kitchen" style={{ backgroundColor: '#111111', padding: '64px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 className="font-heading" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Our <span style={{ color: '#C59C82' }}>Services</span>
          </h2>
          <p style={{ color: '#A1A1A1', maxWidth: '672px', margin: '0 auto' }}>
            Explore our range of interior design services crafted to perfection.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', marginBottom: '48px' }}>
          {Object.keys(services).map((key) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '12px 24px',
                borderRadius: '50px',
                fontWeight: '600',
                border: activeTab === key ? 'none' : '1px solid rgba(197, 156, 130, 0.2)',
                backgroundColor: activeTab === key ? '#C59C82' : '#1A1A1A',
                color: activeTab === key ? '#111111' : '#A1A1A1',
                cursor: 'pointer',
              }}
            >
              {services[key].title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'start' }}>
          {/* Info */}
          <div>
            <h3 className="font-heading" style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {activeService.title}
            </h3>
            <p style={{ color: '#A1A1A1', marginBottom: '24px' }}>{activeService.description}</p>

            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '32px' }}>
              {activeService.features.map((feature, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: '#C59C82', borderRadius: '50%', flexShrink: 0 }}></span>
                  <span style={{ color: '#E5E5E5' }}>{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="#consultation"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#C59C82',
                color: '#111111',
                padding: '12px 24px',
                borderRadius: '50px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Get Free Quote
              <FaArrowRight />
            </a>
          </div>

          {/* Gallery */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {activeService.images.map((image, index) => (
              <div
                key={index}
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  gridColumn: index === 0 ? 'span 2' : 'span 1',
                }}
              >
                <img
                  src={image}
                  alt={`${activeService.title} ${index + 1}`}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
