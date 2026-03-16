import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';

const defaultFaqs = [
  {
    question: 'How long does it take to complete a project?',
    answer:
      'Our standard delivery time is 45 days from design finalization. This includes manufacturing at our factory and professional installation at your site. Complex projects may take slightly longer, but we always provide a clear timeline upfront.',
  },
  {
    question: 'What warranty do you offer?',
    answer:
      'We offer up to 10 years warranty on our products. This covers manufacturing defects, hardware failures, and structural issues. Our warranty is one of the most comprehensive in the industry, giving you complete peace of mind.',
  },
  {
    question: 'Do you provide 3D designs before starting?',
    answer:
      'Yes! We provide detailed 3D renders of your space before any work begins. This allows you to visualize exactly how your home will look and make any changes before manufacturing starts. This service is complimentary with our consultation.',
  },
  {
    question: 'What areas do you serve?',
    answer:
      'We currently serve Bengaluru and Hyderabad. We have experience centers and installation teams in both cities. We\'re continuously expanding to more cities across India.',
  },
  {
    question: 'How does the pricing work?',
    answer:
      'Our pricing is transparent and based on the scope of your project. We provide detailed quotations after understanding your requirements. There are no hidden costs - what we quote is what you pay. We also offer flexible payment options.',
  },
  {
    question: 'Can I customize the designs?',
    answer:
      'Absolutely! Every project we do is customized to your specific needs, taste, and space requirements. Our designers work closely with you to create designs that reflect your personality and lifestyle.',
  },
];

const FAQ = ({ faqs = defaultFaqs }) => {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" style={{ backgroundColor: '#1A1A1A', padding: '64px 0' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 className="font-heading" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Frequently Asked <span style={{ color: '#C59C82' }}>Questions</span>
          </h2>
          <p style={{ color: '#A1A1A1' }}>
            Got questions? We've got answers. If you can't find what you're looking for, feel free to contact us.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                border: '1px solid rgba(197, 156, 130, 0.2)',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#111111',
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '24px',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: '600', color: '#E5E5E5', paddingRight: '16px' }}>
                  {faq.question}
                </span>
                <FaChevronDown
                  style={{
                    color: '#C59C82',
                    flexShrink: 0,
                    transition: 'transform 0.3s',
                    transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              <div
                style={{
                  overflow: 'hidden',
                  transition: 'max-height 0.3s, padding 0.3s',
                  maxHeight: openIndex === index ? '500px' : '0',
                  paddingBottom: openIndex === index ? '24px' : '0',
                }}
              >
                <div style={{ padding: '0 24px', color: '#A1A1A1' }}>{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '48px', textAlign: 'center' }}>
          <p style={{ color: '#A1A1A1', marginBottom: '16px' }}>Still have questions?</p>
          <a
            href="/#consultation"
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
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
