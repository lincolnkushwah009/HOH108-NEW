/**
 * Shared FAQ Component — Dark theme with accent ? icons
 * Matches Interior Plus FAQ design
 */
import { useState } from 'react'
import { HelpCircle, MessageCircle } from 'lucide-react'
import { COLORS } from '../constants/colors'

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

export default function FAQBlock({ faqs = [], title, subtitle }) {
  const [openIndex, setOpenIndex] = useState(null)

  return (
    <section style={{
      backgroundColor: '#111111',
      borderRadius: '24px',
      padding: 'clamp(48px, 8vw, 80px) clamp(24px, 4vw, 48px)',
      margin: '0 clamp(16px, 4vw, 80px)',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(36px, 5vw, 56px)' }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 24px',
            borderRadius: '50px',
            border: '1px solid rgba(255,255,255,0.12)',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '2.5px',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: "'Raleway', sans-serif",
            marginBottom: '20px',
          }}>
            FAQs
          </span>
          <h2 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: '#fff',
            textTransform: 'uppercase',
            fontWeight: 400,
            lineHeight: 1.3,
          }}>
            {title || 'Have Questions? Here Are'}
            <br />
            <span style={{ fontWeight: 700 }}>{subtitle || 'Quick Answers'}</span>
          </h2>
          <p style={{
            fontFamily: "'Raleway', sans-serif",
            color: 'rgba(255,255,255,0.45)',
            fontSize: '14px',
            marginTop: '12px',
          }}>
            Got questions? We've got answers to some of the most common queries.
          </p>
        </div>

        {/* FAQ Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                style={{
                  borderRadius: '14px',
                  backgroundColor: isOpen ? 'rgba(197,156,130,0.08)' : 'rgba(255,255,255,0.04)',
                  border: isOpen ? '1px solid rgba(197,156,130,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                  transition: `all 0.4s ${EASE}`,
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '18px 20px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {/* Question mark icon */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isOpen ? COLORS.accent : 'rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: `all 0.3s ${EASE}`,
                  }}>
                    <HelpCircle size={16} color={isOpen ? '#111' : 'rgba(255,255,255,0.5)'} strokeWidth={2} />
                  </div>

                  <span style={{
                    flex: 1,
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isOpen ? '#fff' : 'rgba(255,255,255,0.8)',
                    textAlign: 'left',
                    transition: `color 0.3s ${EASE}`,
                  }}>
                    {faq.question}
                  </span>

                  {/* Chat icon on open */}
                  {isOpen && (
                    <MessageCircle size={18} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                  )}
                </button>

                {/* Answer */}
                <div style={{
                  maxHeight: isOpen ? '300px' : '0',
                  overflow: 'hidden',
                  transition: `max-height 0.5s ${EASE}`,
                }}>
                  <p style={{
                    fontFamily: "'Raleway', sans-serif",
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.8,
                    padding: '0 20px 20px 66px',
                  }}>
                    {faq.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <p style={{
          textAlign: 'center',
          fontFamily: "'Raleway', sans-serif",
          color: 'rgba(255,255,255,0.4)',
          fontSize: '13px',
          marginTop: '36px',
        }}>
          Still have questions?{' '}
          <a href="/contact-us" style={{ color: COLORS.accent, textDecoration: 'none', fontWeight: 600 }}>
            Contact Us
          </a>
        </p>
      </div>
    </section>
  )
}
