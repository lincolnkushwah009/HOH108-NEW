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

const PrivacyPolicy = () => {
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
            Privacy <span style={{ color: COLORS.accent }}>Policy</span>
          </h1>

          <div style={{ color: COLORS.textMuted, lineHeight: '1.8' }}>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={sectionHeadingStyle}>Introduction</h2>
              <p style={{ marginBottom: '16px' }}>
                This Privacy Policy describes how HOH108 and its affiliates collect, use, share, protect or otherwise process your information/personal data through our website <a href="https://hoh108.com/" style={{ color: COLORS.accent }}>https://hoh108.com/</a>.
              </p>
              <p style={{ marginBottom: '16px' }}>
                You may be able to browse certain sections of the Platform without registering with us. We do not offer any product/service under this Platform outside India and your personal data will primarily be stored and processed in India.
              </p>
              <p>
                By visiting this Platform, providing your information or availing any product/service offered on the Platform, you expressly agree to be bound by the terms and conditions of this Privacy Policy, the Terms of Use and the applicable service/product terms and conditions, and agree to be governed by the laws of India including but not limited to the laws applicable to data protection and privacy. If you do not agree please do not use or access our Platform.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={sectionHeadingStyle}>Collection</h2>
              <p style={{ marginBottom: '16px' }}>
                We collect your personal data when you use our Platform, services or otherwise interact with us during the course of our relationship. This includes information such as name, date of birth, address, phone number, email, proof of identity/address, and sensitive information like payment details or biometric data.
              </p>
              <p>
                We may also track your behavior, preferences, and other information you provide, and collect data about your transactions on our Platform or third-party business partner platforms. You are advised never to share confidential details like card PIN or banking passwords.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={sectionHeadingStyle}>Usage</h2>
              <p>
                We use your personal data to provide the services you request, process orders, enhance customer experience, resolve disputes, troubleshoot problems, detect fraud, enforce our terms, and for marketing research/analysis. Marketing uses will always allow you to opt out.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={sectionHeadingStyle}>Sharing</h2>
              <p>
                We may share your personal data internally within our group entities, affiliates, sellers, logistics partners, payment providers, and other service providers. We may disclose data to government or law enforcement agencies where legally required or in good faith for security, legal, or fraud prevention purposes.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={sectionHeadingStyle}>Security Precautions</h2>
              <p>
                We adopt reasonable security practices and procedures to protect your personal data. However, data transmission over the internet is not fully secure, and users accept the risks associated with it. Protect your login and password at all times.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={sectionHeadingStyle}>Data Deletion and Retention</h2>
              <p>
                You may delete your account from profile/settings, which will erase related information. Deletion may be delayed in case of pending services, claims, or grievances. We retain personal data only as long as required, but may keep anonymized data for research/analysis.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={sectionHeadingStyle}>Your Rights</h2>
              <p>
                You may access, rectify, and update your personal data directly on the Platform. You also have the right to withdraw consent by writing to the Grievance Officer (details below).
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={sectionHeadingStyle}>Consent</h2>
              <p>
                By providing your personal data, you consent to its collection, use, storage, and processing in accordance with this Privacy Policy. You consent to being contacted via SMS, calls, email, or messaging apps for the purposes mentioned herein. Withdrawal of consent may impact services.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 style={sectionHeadingStyle}>Changes to this Privacy Policy</h2>
              <p>
                Please check our Privacy Policy periodically for updates. We may notify you of significant changes as required by law.
              </p>
            </section>

            <section>
              <h2 style={sectionHeadingStyle}>Grievance Officer</h2>
              <div style={{
                backgroundColor: COLORS.card,
                padding: '24px',
                borderRadius: '12px',
                border: `1px solid ${COLORS.border}`
              }}>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: COLORS.textLight }}>Contact:</strong> 8861888424</p>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: COLORS.textLight }}>Email:</strong> support@HOH108.com</p>
                <p><strong style={{ color: COLORS.textLight }}>Time:</strong> Monday - Friday (9:00 - 18:00)</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default PrivacyPolicy
