import Header from '../components/Header';
import Footer from '../components/Footer';
import { COLORS } from '../constants/colors';

const Interior = () => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark }}>
      <Header />
      <main style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        padding: '120px 24px 64px',
        textAlign: 'center',
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        <h1 style={{
          fontFamily: "'Oswald', sans-serif",
          fontSize: '3rem',
          fontWeight: 'bold',
          color: COLORS.textLight,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 16px',
        }}>
          Coming <span style={{ color: COLORS.accent }}>Soon</span>
        </h1>

        <p style={{
          fontSize: '1.15rem',
          color: COLORS.textMuted,
          maxWidth: 520,
          lineHeight: 1.7,
          margin: '0 0 40px',
        }}>
          We're crafting something beautiful. Our Interior Design services page is under construction and will be live shortly.
        </p>

        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 32px',
            background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
            color: '#fff',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
        >
          Back to Home
        </a>
      </main>
      <Footer />
    </div>
  );
};

export default Interior;
