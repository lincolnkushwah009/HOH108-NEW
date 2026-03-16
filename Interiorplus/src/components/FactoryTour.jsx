import { FaIndustry, FaPlay } from 'react-icons/fa';

const FactoryTour = () => {
  return (
    <section style={{ backgroundColor: '#111111', padding: '64px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <FaIndustry style={{ color: '#C59C82', fontSize: '1.5rem' }} />
            <h2 className="font-heading" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#E5E5E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Factory <span style={{ color: '#C59C82' }}>Tour</span>
            </h2>
          </div>
          <p style={{ color: '#A1A1A1', maxWidth: '672px', margin: '0 auto' }}>
            Take a virtual tour of our state-of-the-art manufacturing facility where quality meets craftsmanship.
          </p>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            style={{
              backgroundColor: '#1A1A1A',
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid rgba(197, 156, 130, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src="https://www.youtube.com/embed/32wWddPx4N4?start=24"
                title="Interior Plus Factory Tour"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
          </div>

          {/* Feature highlights */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginTop: '40px'
          }}>
            {[
              { title: 'Modern Machinery', desc: 'German-engineered precision tools' },
              { title: 'Quality Control', desc: 'Multi-stage inspection process' },
              { title: 'Skilled Craftsmen', desc: 'Experienced & trained workforce' }
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#1A1A1A',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid rgba(197, 156, 130, 0.1)',
                  textAlign: 'center'
                }}
              >
                <h4 className="font-heading" style={{ color: '#C59C82', fontWeight: '600', marginBottom: '8px' }}>
                  {item.title}
                </h4>
                <p style={{ color: '#A1A1A1', fontSize: '0.875rem' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FactoryTour;
