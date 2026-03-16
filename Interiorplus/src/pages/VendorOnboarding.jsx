import { useState } from 'react';
import { Check, Phone, Mail, Clock, ChevronDown, ChevronUp, Package, Truck, Shield, Award } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

const API_BASE = 'https://hoh108.com/api';

const VendorOnboarding = () => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    city: '',
    category: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.city,
          message: `Company: ${formData.companyName}, Category: ${formData.category}. ${formData.message}`,
          source: 'website',
          service: 'other',
          websiteSource: 'InteriorPlus',
          leadType: 'vendor',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccess(true);
      setFormData({ name: '', companyName: '', email: '', phone: '', city: '', category: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Plywood & Laminates',
    'Hardware & Fittings',
    'Modular Kitchen Components',
    'Wardrobe Accessories',
    'Lighting Solutions',
    'Glass & Mirrors',
    'Flooring Materials',
    'Paint & Finishes',
    'Electrical Components',
    'Other',
  ];

  const benefits = [
    { icon: Package, title: 'Bulk Orders', desc: 'Consistent high-volume orders throughout the year' },
    { icon: Truck, title: 'Timely Payments', desc: 'Reliable payment cycles with transparent terms' },
    { icon: Shield, title: 'Long-term Partnership', desc: 'Build lasting business relationships with us' },
    { icon: Award, title: 'Brand Association', desc: 'Associate with a premium interior design brand' },
  ];

  const requirements = [
    'GST registration and valid business license',
    'Minimum 2 years of experience in the industry',
    'Ability to meet quality standards and specifications',
    'Capacity to handle bulk orders with timely delivery',
    'Competitive pricing with transparent cost structure',
  ];

  const productCategories = [
    { name: 'Plywood & Laminates', items: 'MDF, HDF, Particle Board, Decorative Laminates' },
    { name: 'Hardware & Fittings', items: 'Hinges, Drawer Slides, Handles, Locks' },
    { name: 'Kitchen Components', items: 'Baskets, Tandem Boxes, Cutlery Trays, Shutters' },
    { name: 'Wardrobe Accessories', items: 'Pull-out Units, Shoe Racks, Tie & Belt Holders' },
  ];

  const faqs = [
    {
      q: 'What is the vendor onboarding process?',
      a: 'Submit your application through this form. Our procurement team will review your profile, conduct quality assessments, and schedule a meeting to discuss terms and pricing.',
    },
    {
      q: 'What are the payment terms?',
      a: 'Payment terms are typically 30-45 days from delivery, depending on the product category and order volume. Specific terms will be discussed during the onboarding process.',
    },
    {
      q: 'Do you require product samples?',
      a: 'Yes, we require product samples for quality evaluation before finalizing the partnership. Sample requirements will be communicated after initial application review.',
    },
    {
      q: 'What is the minimum order quantity?',
      a: 'MOQ varies by product category. We work with vendors who can handle both small custom orders and large bulk requirements.',
    },
    {
      q: 'How long does the onboarding process take?',
      a: 'The typical onboarding process takes 2-4 weeks, including documentation verification, sample evaluation, and commercial terms finalization.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, backgroundColor: '#111111' }}>
        {/* Hero Section */}
        <section style={{
          padding: '80px 16px',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #111111 100%)',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '48px',
              alignItems: 'start',
            }}>
              {/* Left Content */}
              <div>
                <h1 className="font-heading" style={{
                  fontSize: 'clamp(2rem, 5vw, 3rem)',
                  color: '#FFFFFF',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  lineHeight: '1.2',
                }}>
                  Become a <span style={{ color: '#C59C82' }}>Vendor Partner</span>
                </h1>
                <p style={{
                  fontSize: '18px',
                  color: '#A1A1A1',
                  lineHeight: '1.7',
                  marginBottom: '24px',
                }}>
                  Join our network of trusted suppliers and grow your business with Interior Plus.
                  We're looking for quality-focused vendors to support our premium interior solutions.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  marginTop: '32px',
                }}>
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(197, 156, 130, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#C59C82', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>500+</p>
                    <p style={{ color: '#A1A1A1', fontSize: '13px' }}>Projects Annually</p>
                  </div>
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(197, 156, 130, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#C59C82', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>20+</p>
                    <p style={{ color: '#A1A1A1', fontSize: '13px' }}>Years Experience</p>
                  </div>
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(197, 156, 130, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#C59C82', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>50+</p>
                    <p style={{ color: '#A1A1A1', fontSize: '13px' }}>Active Vendors</p>
                  </div>
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'rgba(197, 156, 130, 0.1)',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#C59C82', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>Pan India</p>
                    <p style={{ color: '#A1A1A1', fontSize: '13px' }}>Network Coverage</p>
                  </div>
                </div>
              </div>

              {/* Registration Form */}
              <div style={{
                backgroundColor: '#1A1A1A',
                borderRadius: '24px',
                padding: '32px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <h2 className="font-heading" style={{
                  fontSize: '1.5rem',
                  color: '#E5E5E5',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Apply as Vendor
                </h2>
                <p style={{ color: '#A1A1A1', fontSize: '14px', marginBottom: '24px' }}>
                  Fill out the form and our procurement team will contact you
                </p>

                {success ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}>
                      <Check size={30} color="#22C55E" />
                    </div>
                    <h3 style={{ color: '#FFFFFF', fontSize: '20px', marginBottom: '8px' }}>
                      Application Submitted!
                    </h3>
                    <p style={{ color: '#A1A1A1', fontSize: '14px' }}>
                      Our procurement team will review your application and contact you within 3-5 business days.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {error && (
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        color: '#EF4444',
                        fontSize: '14px',
                      }}>
                        {error}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Contact Person Name *"
                        required
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Company Name *"
                        required
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email Address *"
                        required
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone Number *"
                        required
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City / Location *"
                        required
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          outline: 'none',
                        }}
                      />
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: formData.category ? '#FFFFFF' : '#A1A1A1',
                          fontSize: '15px',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="" disabled>Select Product Category *</option>
                        {categories.map((cat, index) => (
                          <option key={index} value={cat} style={{ color: '#FFFFFF', backgroundColor: '#242424' }}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Brief description of your products/services (Optional)"
                        rows={3}
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#242424',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          padding: '16px',
                          backgroundColor: loading ? '#242424' : '#C59C82',
                          color: loading ? '#A1A1A1' : '#111111',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: loading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {loading ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section style={{ padding: '80px 16px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '48px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Why Partner With <span style={{ color: '#C59C82' }}>Interior Plus</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  style={{
                    padding: '28px 24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(197, 156, 130, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <benefit.icon size={24} color="#C59C82" />
                  </div>
                  <h3 style={{
                    color: '#C59C82',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}>
                    {benefit.title}
                  </h3>
                  <p style={{ color: '#A1A1A1', fontSize: '14px' }}>
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Categories We Source */}
        <section style={{ padding: '80px 16px', backgroundColor: '#0A0A0A' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '48px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Products We <span style={{ color: '#C59C82' }}>Source</span>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {productCategories.map((category, index) => (
                <div
                  key={index}
                  style={{
                    padding: '24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <h3 style={{
                    color: '#C59C82',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '12px',
                  }}>
                    {category.name}
                  </h3>
                  <p style={{ color: '#A1A1A1', fontSize: '14px', lineHeight: '1.6' }}>
                    {category.items}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section style={{ padding: '80px 16px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '48px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Vendor <span style={{ color: '#C59C82' }}>Requirements</span>
            </h2>

            <div style={{
              maxWidth: '700px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {requirements.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px 24px',
                    backgroundColor: '#1A1A1A',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#C59C82',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Check size={16} color="#111111" />
                  </div>
                  <span style={{ color: '#E5E5E5', fontSize: '15px' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ padding: '80px 16px', backgroundColor: '#0A0A0A' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '48px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}>
              Frequently Asked <span style={{ color: '#C59C82' }}>Questions</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#1A1A1A',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ color: '#E5E5E5', fontSize: '15px', fontWeight: '500' }}>
                      {faq.q}
                    </span>
                    {openFaq === index ? (
                      <ChevronUp size={20} color="#C59C82" />
                    ) : (
                      <ChevronDown size={20} color="#A1A1A1" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div style={{
                      padding: '0 24px 20px',
                      color: '#A1A1A1',
                      fontSize: '14px',
                      lineHeight: '1.7',
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section style={{
          padding: '80px 16px',
          backgroundColor: '#1A1A1A',
        }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
            <h2 className="font-heading" style={{
              fontSize: '2rem',
              color: '#E5E5E5',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Get In Touch
            </h2>
            <p style={{
              color: '#A1A1A1',
              marginBottom: '40px',
              fontSize: '16px',
            }}>
              Have questions? Our procurement team is here to help.
            </p>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '32px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Phone size={20} color="#C59C82" />
                <span style={{ color: '#E5E5E5' }}>+91 9964666610</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={20} color="#C59C82" />
                <span style={{ color: '#E5E5E5' }}>vendors@interiorplus.in</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={20} color="#C59C82" />
                <span style={{ color: '#E5E5E5' }}>Mon-Sat: 10:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default VendorOnboarding;
