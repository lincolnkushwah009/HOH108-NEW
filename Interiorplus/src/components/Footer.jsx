import { FaInstagram, FaLinkedinIn, FaFacebookF, FaPhone, FaEnvelope, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Footer = () => {
  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Modular Kitchen', href: '/modular-kitchen-designers-hsr-layout-bangalore' },
    { name: 'Living Room', href: '/living-room-interior-design-hsr-layout-bangalore' },
    { name: 'Wardrobe', href: '/modular-wardrobes-interior-design-bangalore' },
    { name: 'Become a Partner', href: '/franchise' },
    { name: 'Become a Vendor', href: '/vendor-onboarding' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact Us', href: '/contact-us' },
    { name: 'About Us', href: '/about-us' },
  ];

  const locations = [
    { city: 'Horamavu, Bengaluru', address: 'Karnataka' },
    { city: 'HSR Layout, Bengaluru', address: 'Karnataka' },
    { city: 'Hyderabad', address: 'Telangana' },
  ];

  const socialButtonStyle = {
    width: '40px',
    height: '40px',
    backgroundColor: '#1A1A1A',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#A1A1A1',
    textDecoration: 'none',
  };

  return (
    <footer style={{ backgroundColor: '#111111' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '48px' }}>
          {/* Company Info */}
          <div>
            <a href="#" style={{ display: 'inline-block', marginBottom: '24px', textDecoration: 'none' }}>
              <img src={logo} alt="Interior Plus" style={{ height: '50px', width: 'auto' }} />
            </a>
            <p style={{ color: '#A1A1A1', marginBottom: '24px' }}>
              Transform your dream home interiors into reality with our expert design and installation services.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="https://www.instagram.com/interiorplusindia/" target="_blank" rel="noopener noreferrer" style={socialButtonStyle}>
                <FaInstagram />
              </a>
              <a href="https://www.linkedin.com/company/thehomeinteriorplus/" target="_blank" rel="noopener noreferrer" style={socialButtonStyle}>
                <FaLinkedinIn />
              </a>
              <a href="https://www.facebook.com/InteriorPlus24" target="_blank" rel="noopener noreferrer" style={socialButtonStyle}>
                <FaFacebookF />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading" style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '24px', color: '#E5E5E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {quickLinks.map((link) => (
                <li key={link.name} style={{ marginBottom: '12px' }}>
                  <Link to={link.href} style={{ color: '#A1A1A1', textDecoration: 'none' }}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="font-heading" style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '24px', color: '#E5E5E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Our Locations
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {locations.map((location, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                  <FaMapMarkerAlt style={{ color: '#C59C82', marginTop: '4px', flexShrink: 0 }} />
                  <div>
                    <p style={{ color: '#E5E5E5', margin: 0 }}>{location.city}</p>
                    <p style={{ color: '#A1A1A1', fontSize: '0.875rem', margin: 0 }}>{location.address}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading" style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '24px', color: '#E5E5E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contact Us
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <FaPhone style={{ color: '#C59C82', flexShrink: 0 }} />
                <a href="tel:+919964666610" style={{ color: '#E5E5E5', textDecoration: 'none' }}>
                  +91 9964666610
                </a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <FaEnvelope style={{ color: '#C59C82', flexShrink: 0 }} />
                <a href="mailto:info@interiorplus.in" style={{ color: '#E5E5E5', textDecoration: 'none' }}>
                  info@interiorplus.in
                </a>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaClock style={{ color: '#C59C82', flexShrink: 0 }} />
                <span style={{ color: '#E5E5E5' }}>Mon - Sun: 10:30 AM - 7:30 PM</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: '1px solid #1A1A1A' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <p style={{ color: '#A1A1A1', fontSize: '0.875rem', margin: 0 }}>
              © {new Date().getFullYear()} InteriorPlus | All Rights Reserved
            </p>
            <div style={{ display: 'flex', gap: '24px', fontSize: '0.875rem' }}>
              <Link to="/privacy-policy" style={{ color: '#A1A1A1', textDecoration: 'none' }}>
                Privacy Policy
              </Link>
              <Link to="/terms-and-conditions" style={{ color: '#A1A1A1', textDecoration: 'none' }}>
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
