import Header from '../components/Header';
import Hero from '../components/Hero';
import Advantages from '../components/Advantages';
import Services from '../components/Services';
import WhyChooseUs from '../components/WhyChooseUs';
import Testimonials from '../components/Testimonials';
import Process from '../components/Process';
import Partners from '../components/Partners';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import FactoryTour from '../components/FactoryTour';

const HomePage = () => {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <main>
        <Hero />
        <Advantages />
        <Services />
        <Partners />
        <WhyChooseUs />
        <Process />
        <FactoryTour />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default HomePage;
