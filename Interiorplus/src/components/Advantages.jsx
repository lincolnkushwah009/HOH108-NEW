import { FaIndustry, FaShieldAlt, FaCubes } from 'react-icons/fa';

const Advantages = () => {
  const advantages = [
    {
      icon: <FaIndustry />,
      title: 'Factory-Grade Finish',
      description:
        'Every product is manufactured in our state-of-the-art factory ensuring consistent quality and precision finish across all your interiors.',
    },
    {
      icon: <FaShieldAlt />,
      title: 'Up to 10 Years Warranty',
      description:
        'We stand behind our work with an industry-leading warranty of up to 10 years, giving you complete peace of mind.',
    },
    {
      icon: <FaCubes />,
      title: 'Advanced 3D Rendering',
      description:
        'Visualize your dream home before we build it with our cutting-edge 3D rendering technology. See exactly what you\'ll get.',
    },
  ];

  return (
    <section style={{ backgroundColor: '#1A1A1A', padding: '64px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 className="font-heading" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            The Interior Plus <span style={{ color: '#C59C82' }}>Advantage</span>
          </h2>
          <p style={{ color: '#A1A1A1', maxWidth: '672px', margin: '0 auto' }}>
            Experience the difference with our commitment to quality, innovation, and customer satisfaction.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {advantages.map((advantage, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#111111',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center',
                border: '1px solid rgba(197, 156, 130, 0.1)',
              }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'rgba(197, 156, 130, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                color: '#C59C82',
                fontSize: '2rem'
              }}>
                {advantage.icon}
              </div>
              <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {advantage.title}
              </h3>
              <p style={{ color: '#A1A1A1' }}>{advantage.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Advantages;
