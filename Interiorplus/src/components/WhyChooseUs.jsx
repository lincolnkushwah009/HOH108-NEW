import { FaUserTie, FaHandshake, FaDesktop } from 'react-icons/fa';

const WhyChooseUs = () => {
  const reasons = [
    {
      icon: <FaUserTie />,
      title: 'Expert Project Management',
      description: 'Dedicated project managers ensure your project runs smoothly from design to installation, keeping you updated every step of the way.',
    },
    {
      icon: <FaHandshake />,
      title: 'End-to-End Solutions',
      description: 'From initial consultation to final installation, we handle everything. Design, manufacturing, and installation - all under one roof.',
    },
    {
      icon: <FaDesktop />,
      title: '3D Visualization',
      description: 'See your dream home come to life before we start. Our advanced 3D rendering helps you visualize every detail.',
    },
  ];

  return (
    <section style={{ backgroundColor: '#C59C82', padding: '64px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 className="font-heading" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111111', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Why Choose <span style={{ color: '#FFFFFF' }}>Interior Plus</span>?
          </h2>
          <p style={{ color: 'rgba(17, 17, 17, 0.7)', maxWidth: '672px', margin: '0 auto' }}>
            We don't just design spaces, we create experiences that transform how you live.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          {reasons.map((reason, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'rgba(17, 17, 17, 0.1)',
                borderRadius: '16px',
                padding: '32px',
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'rgba(17, 17, 17, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                color: '#111111',
                fontSize: '1.75rem'
              }}>
                {reason.icon}
              </div>
              <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111111', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {reason.title}
              </h3>
              <p style={{ color: 'rgba(17, 17, 17, 0.7)' }}>{reason.description}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <a
            href="#consultation"
            style={{
              display: 'inline-block',
              backgroundColor: '#111111',
              color: '#E5E5E5',
              padding: '16px 32px',
              borderRadius: '50px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Start Your Project Today
          </a>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
