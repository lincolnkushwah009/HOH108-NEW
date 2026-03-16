import { FaWhatsapp } from 'react-icons/fa';

const WhatsAppButton = () => {
  const phoneNumber = '919964666610';
  const message = 'Hi! I am interested in Interior Plus services. Please help me with more information.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 90,
        width: '56px',
        height: '56px',
        backgroundColor: '#25D366',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        textDecoration: 'none',
      }}
      aria-label="Chat on WhatsApp"
    >
      <FaWhatsapp style={{ color: 'white', fontSize: '1.875rem' }} />
    </a>
  );
};

export default WhatsAppButton;
