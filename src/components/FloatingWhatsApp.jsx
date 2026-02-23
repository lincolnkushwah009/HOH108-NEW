import { useLocation } from 'react-router-dom'

const WHATSAPP_NUMBER = '918861888572'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

function FloatingWhatsApp() {
  const location = useLocation()

  // Hide on admin, dashboard, and vendor-portal routes
  if (
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/vendor-portal')
  ) {
    return null
  }

  return (
    <>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 9990,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
          cursor: 'pointer',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          textDecoration: 'none',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(37, 211, 102, 0.6)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(37, 211, 102, 0.4)'
        }}
      >
        {/* WhatsApp SVG Icon */}
        <svg
          viewBox="0 0 32 32"
          fill="white"
          width="32"
          height="32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.312 22.616c-.39 1.1-1.932 2.014-3.178 2.28-.852.18-1.964.324-5.71-1.228-4.796-1.986-7.882-6.86-8.122-7.18-.228-.32-1.924-2.562-1.924-4.888 0-2.326 1.218-3.47 1.65-3.942.39-.426 1.038-.622 1.66-.622.2 0 .38.01.54.018.474.02.712.048 1.024.794.39.93 1.338 3.256 1.454 3.494.118.24.236.554.078.874-.148.328-.278.474-.518.748-.238.274-.464.484-.702.778-.218.258-.464.534-.196 1.02.268.478 1.192 1.968 2.562 3.186 1.76 1.564 3.244 2.05 3.704 2.274.348.17.762.138 1.04-.158.354-.378.792-.998 1.236-1.612.316-.438.716-.492 1.098-.33.388.156 2.454 1.158 2.876 1.37.42.21.702.316.806.494.102.176.102 1.028-.288 2.128z" />
        </svg>

        {/* Ripple rings */}
        <span className="whatsapp-ripple whatsapp-ripple-1" />
        <span className="whatsapp-ripple whatsapp-ripple-2" />
        <span className="whatsapp-ripple whatsapp-ripple-3" />
      </a>

      <style>{`
        .whatsapp-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid rgba(37, 211, 102, 0.6);
          animation: whatsappRipple 2.5s ease-out infinite;
          pointer-events: none;
        }
        .whatsapp-ripple-1 {
          animation-delay: 0s;
        }
        .whatsapp-ripple-2 {
          animation-delay: 0.8s;
        }
        .whatsapp-ripple-3 {
          animation-delay: 1.6s;
        }
        @keyframes whatsappRipple {
          0% {
            width: 60px;
            height: 60px;
            opacity: 0.6;
          }
          100% {
            width: 120px;
            height: 120px;
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}

export default FloatingWhatsApp
