import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';

const PrivacyPolicy = () => {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <main style={{ backgroundColor: '#111111', padding: '64px 0' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 16px' }}>
          <h1 className="font-heading" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '32px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Privacy <span style={{ color: '#C59C82' }}>Policy</span>
          </h1>

          <div style={{ color: '#A1A1A1', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '24px', color: '#E5E5E5' }}>
              Last updated: December 2024
            </p>

            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                1. Introduction
              </h2>
              <p style={{ marginBottom: '16px' }}>
                Welcome to IP Home Furnishings Pvt Ltd (Interior Plus). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                2. Information We Collect
              </h2>
              <p style={{ marginBottom: '16px' }}>
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
              </p>
              <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>Identity Data: includes first name, last name, username or similar identifier.</li>
                <li style={{ marginBottom: '8px' }}>Contact Data: includes email address, telephone numbers, and physical address.</li>
                <li style={{ marginBottom: '8px' }}>Technical Data: includes internet protocol (IP) address, browser type and version, time zone setting and location.</li>
                <li style={{ marginBottom: '8px' }}>Usage Data: includes information about how you use our website and services.</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                3. How We Use Your Information
              </h2>
              <p style={{ marginBottom: '16px' }}>
                We use your personal data for the following purposes:
              </p>
              <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>To provide and maintain our services</li>
                <li style={{ marginBottom: '8px' }}>To notify you about changes to our services</li>
                <li style={{ marginBottom: '8px' }}>To provide customer support</li>
                <li style={{ marginBottom: '8px' }}>To gather analysis or valuable information so that we can improve our services</li>
                <li style={{ marginBottom: '8px' }}>To detect, prevent and address technical issues</li>
                <li style={{ marginBottom: '8px' }}>To send you promotional communications (with your consent)</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                4. Data Security
              </h2>
              <p style={{ marginBottom: '16px' }}>
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. We limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                5. Your Rights
              </h2>
              <p style={{ marginBottom: '16px' }}>
                Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
              </p>
              <ul style={{ listStyle: 'disc', paddingLeft: '24px', marginBottom: '16px' }}>
                <li style={{ marginBottom: '8px' }}>Request access to your personal data</li>
                <li style={{ marginBottom: '8px' }}>Request correction of your personal data</li>
                <li style={{ marginBottom: '8px' }}>Request erasure of your personal data</li>
                <li style={{ marginBottom: '8px' }}>Object to processing of your personal data</li>
                <li style={{ marginBottom: '8px' }}>Request restriction of processing your personal data</li>
                <li style={{ marginBottom: '8px' }}>Request transfer of your personal data</li>
                <li style={{ marginBottom: '8px' }}>Right to withdraw consent</li>
              </ul>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                6. Cookies
              </h2>
              <p style={{ marginBottom: '16px' }}>
                Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                7. Third-Party Links
              </h2>
              <p style={{ marginBottom: '16px' }}>
                This website may include links to third-party websites, plug-ins and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.
              </p>
            </section>

            <section style={{ marginBottom: '32px' }}>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                8. Contact Us
              </h2>
              <p style={{ marginBottom: '16px' }}>
                If you have any questions about this privacy policy or our privacy practices, please contact us at:
              </p>
              <div style={{ backgroundColor: '#1A1A1A', padding: '24px', borderRadius: '12px', border: '1px solid rgba(197, 156, 130, 0.1)' }}>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: '#E5E5E5' }}>Email:</strong> info@interiorplus.in</p>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: '#E5E5E5' }}>Phone:</strong> +91 9964666610</p>
                <p><strong style={{ color: '#E5E5E5' }}>Address:</strong> Bengaluru, Karnataka, India</p>
              </div>
            </section>

            <section>
              <h2 className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E5E5E5', marginBottom: '16px', textTransform: 'uppercase' }}>
                9. Changes to This Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default PrivacyPolicy;
