import Header from '../components/Header'
import Footer from '../components/Footer'
import { COLORS } from '../constants/colors'

const sectionHeadingStyle = {
  fontFamily: "'Oswald', sans-serif",
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: COLORS.textLight,
  marginBottom: '16px',
  textTransform: 'uppercase'
}

const RefundPolicy = () => {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <main style={{ backgroundColor: COLORS.dark, padding: '120px 0 64px' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{
            fontFamily: "'Oswald', sans-serif",
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: COLORS.textLight,
            marginBottom: '32px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Refund & Cancellation <span style={{ color: COLORS.accent }}>Policy</span>
          </h1>

          <div style={{ color: COLORS.textMuted, lineHeight: '1.8' }}>

            <section style={{ marginBottom: '32px' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <li style={{
                  backgroundColor: COLORS.card,
                  padding: '24px',
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.border}`,
                  borderLeft: `4px solid ${COLORS.accent}`
                }}>
                  <p>Non-refundable once the design process begins.</p>
                </li>
                <li style={{
                  backgroundColor: COLORS.card,
                  padding: '24px',
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.border}`,
                  borderLeft: `4px solid ${COLORS.accent}`
                }}>
                  <p>If a project is cancelled during execution, refunds are only applicable for unexecuted work, minus a <strong style={{ color: COLORS.textLight }}>15% administrative fee</strong>.</p>
                </li>
                <li style={{
                  backgroundColor: COLORS.card,
                  padding: '24px',
                  borderRadius: '12px',
                  border: `1px solid ${COLORS.border}`,
                  borderLeft: `4px solid ${COLORS.accent}`
                }}>
                  <p>Approved refunds are issued within <strong style={{ color: COLORS.textLight }}>10-15 business days</strong> via the original payment method.</p>
                </li>
              </ul>
            </section>

            <section>
              <h2 style={sectionHeadingStyle}>Contact Us</h2>
              <div style={{
                backgroundColor: COLORS.card,
                padding: '24px',
                borderRadius: '12px',
                border: `1px solid ${COLORS.border}`
              }}>
                <p style={{ marginBottom: '8px' }}>For refund or cancellation queries, please reach out to us:</p>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: COLORS.textLight }}>Phone:</strong> +91 8861888424</p>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: COLORS.textLight }}>Email:</strong> support@HOH108.com</p>
                <p><strong style={{ color: COLORS.textLight }}>Hours:</strong> Monday - Friday (9:00 - 18:00)</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default RefundPolicy
