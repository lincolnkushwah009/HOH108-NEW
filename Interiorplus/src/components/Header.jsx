import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaInstagram, FaLinkedinIn, FaFacebookF, FaBars, FaTimes, FaUser } from 'react-icons/fa';
import logo from '../assets/logo.png';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('hoh108_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('hoh108_token');
    localStorage.removeItem('hoh108_user');
    setUser(null);
    navigate('/');
  };

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Modular Kitchen', href: '/modular-kitchen-designers-hsr-layout-bangalore' },
    { name: 'Living Room', href: '/living-room-interior-design-hsr-layout-bangalore' },
    { name: 'Wardrobe', href: '/modular-wardrobes-interior-design-bangalore' },
    { name: 'About Us', href: '/about-us' },
  ];

  return (
    <header style={{ backgroundColor: '#111111', borderBottom: '1px solid #1A1A1A', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Main Navigation */}
      <nav style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src={logo} alt="Interior Plus" style={{ height: '50px', width: 'auto' }} />
          </Link>

          {/* Desktop Navigation */}
          <div className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: '32px' }}>
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                style={{ color: '#A1A1A1', textDecoration: 'none', fontWeight: '500' }}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons - Desktop */}
          <div className="desktop-cta" style={{ display: 'none', alignItems: 'center', gap: '16px' }}>
            <Link
              to="/franchise"
              style={{
                backgroundColor: '#C59C82',
                color: '#111111',
                padding: '10px 20px',
                borderRadius: '50px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Become a Partner
            </Link>
            {user ? (
              <>
                <Link
                  to="/profile"
                  style={{ color: '#A1A1A1', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  <FaUser size={14} />
                  {user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#C59C82',
                    padding: '10px 20px',
                    borderRadius: '50px',
                    fontWeight: '600',
                    border: '1px solid #C59C82',
                    cursor: 'pointer',
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{
                  color: '#A1A1A1',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            style={{ display: 'block', background: 'none', border: 'none', color: '#E5E5E5', fontSize: '1.5rem', cursor: 'pointer' }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div style={{ marginTop: '16px', paddingBottom: '16px', borderTop: '1px solid #1A1A1A', paddingTop: '16px' }}>
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                style={{ display: 'block', padding: '12px 0', color: '#A1A1A1', textDecoration: 'none', fontWeight: '500', borderBottom: '1px solid #1A1A1A' }}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}

            <Link
              to="/franchise"
              style={{
                display: 'block',
                marginTop: '16px',
                backgroundColor: '#C59C82',
                color: '#111111',
                padding: '12px 24px',
                borderRadius: '50px',
                fontWeight: '600',
                textDecoration: 'none',
                textAlign: 'center',
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Become a Partner
            </Link>

            {user ? (
              <>
                <Link
                  to="/profile"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', color: '#E5E5E5', fontWeight: '500', borderBottom: '1px solid #1A1A1A', textDecoration: 'none' }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FaUser size={14} />
                  {user.name}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginTop: '16px',
                    backgroundColor: 'transparent',
                    color: '#C59C82',
                    padding: '12px 24px',
                    borderRadius: '50px',
                    fontWeight: '600',
                    border: '1px solid #C59C82',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{ display: 'block', padding: '12px 0', color: '#A1A1A1', textDecoration: 'none', fontWeight: '500', borderBottom: '1px solid #1A1A1A' }}
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}

            {/* Social Links Mobile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1A1A1A' }}>
              <a href="https://www.instagram.com/interiorplusindia/" target="_blank" rel="noopener noreferrer" style={{ color: '#A1A1A1', textDecoration: 'none' }}>
                <FaInstagram size={20} />
              </a>
              <a href="https://www.linkedin.com/company/thehomeinteriorplus/" target="_blank" rel="noopener noreferrer" style={{ color: '#A1A1A1', textDecoration: 'none' }}>
                <FaLinkedinIn size={20} />
              </a>
              <a href="https://www.facebook.com/InteriorPlus24" target="_blank" rel="noopener noreferrer" style={{ color: '#A1A1A1', textDecoration: 'none' }}>
                <FaFacebookF size={20} />
              </a>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .desktop-cta { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
