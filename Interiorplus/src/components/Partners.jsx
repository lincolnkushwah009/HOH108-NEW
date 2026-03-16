// Import partner logos
import actionTesa from '../assets/Our-Partners/image_1627639773Action-Tesa_resize_new.webp';
import hettich from '../assets/Our-Partners/image_1627641652Hettich-Logo_resize_new.webp';
import merino from '../assets/Our-Partners/image_1627641672Merino_resize_new.webp';
import rehau from '../assets/Our-Partners/image_1627641695rehau-logo_resize_new.webp';
import renolit from '../assets/Our-Partners/image_1627641710Renolit_logo_resize_new.webp';
import jowat from '../assets/Our-Partners/image_1628313604NEW-Jowat_new.webp';
import pidilite from '../assets/Our-Partners/image_1631278068NEW-Pidilite_logo_resize_new.webp';
import greenpanel from '../assets/Our-Partners/image_1631278575Greenpanel_Logo_resize_new.webp';
import hka from '../assets/Our-Partners/image_1651586037logo-hka-indien_edit_1.webp';

const Partners = () => {
  const partners = [
    { name: 'Action Tesa', logo: actionTesa },
    { name: 'Hettich', logo: hettich },
    { name: 'Merino', logo: merino },
    { name: 'Rehau', logo: rehau },
    { name: 'Renolit', logo: renolit },
    { name: 'Jowat', logo: jowat },
    { name: 'Pidilite', logo: pidilite },
    { name: 'Greenpanel', logo: greenpanel },
    { name: 'HKA Indien', logo: hka },
  ];

  return (
    <section style={{ padding: '80px 16px', backgroundColor: '#0A0A0A' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{
            fontSize: '14px',
            color: '#C59C82',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px',
          }}>
            Trusted By The Best
          </p>
          <h2 className="font-heading" style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
            color: '#E5E5E5',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Our <span style={{ color: '#C59C82' }}>Partners</span>
          </h2>
        </div>

        {/* Partners Logo Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '32px',
          alignItems: 'center',
          justifyItems: 'center',
        }}>
          {partners.map((partner, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '180px',
                height: '100px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(197, 156, 130, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src={partner.logo}
                alt={partner.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '60px',
                  objectFit: 'contain',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;
