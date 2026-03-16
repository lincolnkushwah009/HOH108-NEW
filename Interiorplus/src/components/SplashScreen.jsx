import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';

const SplashScreen = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Complete splash after fade animation (2.5 seconds total)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#111111',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      {/* Logo Container with Glow Effect */}
      <div
        style={{
          position: 'relative',
          animation: 'logoFloat 2s ease-in-out infinite',
        }}
      >
        {/* Glow behind logo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(197, 156, 130, 0.3) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'pulseGlow 2s ease-in-out infinite',
          }}
        />

        {/* Logo */}
        <img
          src={logo}
          alt="Interior Plus"
          style={{
            height: '80px',
            width: 'auto',
            position: 'relative',
            zIndex: 1,
            animation: 'logoScale 0.8s ease-out forwards',
          }}
        />
      </div>

      {/* Tagline */}
      <p
        style={{
          color: '#A1A1A1',
          fontSize: '14px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginTop: '24px',
          animation: 'fadeInUp 0.8s ease-out 0.3s forwards',
          opacity: 0,
        }}
      >
        Transform Your Space
      </p>

      {/* Loading indicator */}
      <div
        style={{
          marginTop: '48px',
          display: 'flex',
          gap: '8px',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#C59C82',
              borderRadius: '50%',
              animation: `dotBounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes logoScale {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.5;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.8;
          }
        }

        @keyframes fadeInUp {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes dotBounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
