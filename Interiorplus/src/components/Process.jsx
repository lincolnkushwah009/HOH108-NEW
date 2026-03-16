import { FaComments, FaPencilRuler, FaTools } from 'react-icons/fa';

const Process = () => {
  const steps = [
    { icon: <FaComments />, step: '01', title: 'Consultation', description: 'Book a free consultation with our design experts. Share your vision, preferences, and requirements.' },
    { icon: <FaPencilRuler />, step: '02', title: 'Design & Planning', description: 'Our designers create detailed 3D renders of your space. Review, refine, and finalize your design.' },
    { icon: <FaTools />, step: '03', title: 'Execution & Delivery', description: 'We manufacture in our factory and install at your home. Your dream space is ready in just 45 days.' },
  ];

  return (
    <section style={{ backgroundColor: '#111111', padding: '64px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 className="font-heading" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            House to Home in <span style={{ color: '#C59C82' }}>3 Simple Steps</span>
          </h2>
          <p style={{ color: '#A1A1A1', maxWidth: '672px', margin: '0 auto' }}>
            Our streamlined process makes transforming your space easy and stress-free.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          {steps.map((step, index) => (
            <div key={index} style={{ position: 'relative', paddingTop: '24px' }}>
              {/* Step Number */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: '16px',
                width: '48px',
                height: '48px',
                backgroundColor: '#C59C82',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111111',
                fontWeight: 'bold',
                fontSize: '1.125rem',
                zIndex: 10
              }}>
                {step.step}
              </div>

              <div style={{
                backgroundColor: '#1A1A1A',
                borderRadius: '16px',
                padding: '32px',
                border: '1px solid rgba(197, 156, 130, 0.1)',
                height: '100%'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#C59C82',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                  color: '#111111',
                  fontSize: '1.5rem'
                }}>
                  {step.icon}
                </div>
                <h3 className="font-heading" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {step.title}
                </h3>
                <p style={{ color: '#A1A1A1' }}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <a
            href="#consultation"
            style={{
              display: 'inline-block',
              backgroundColor: '#C59C82',
              color: '#111111',
              padding: '16px 32px',
              borderRadius: '50px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            Start Your Journey
          </a>
        </div>
      </div>
    </section>
  );
};

export default Process;
