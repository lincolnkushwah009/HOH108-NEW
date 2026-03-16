import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';
import HomePage from './pages/HomePage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import ModularKitchen from './pages/ModularKitchen';
import LivingRoom from './pages/LivingRoom';
import Wardrobe from './pages/Wardrobe';
import Franchise from './pages/Franchise';
import VendorOnboarding from './pages/VendorOnboarding';
import Career from './pages/Career';
import ContactUs from './pages/ContactUs';
import AboutUs from './pages/AboutUs';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/modular-kitchen-designers-hsr-layout-bangalore" element={<ModularKitchen />} />
          <Route path="/living-room-interior-design-hsr-layout-bangalore" element={<LivingRoom />} />
          <Route path="/modular-wardrobes-interior-design-bangalore" element={<Wardrobe />} />
          <Route path="/franchise" element={<Franchise />} />
          <Route path="/vendor-onboarding" element={<VendorOnboarding />} />
          <Route path="/careers" element={<Career />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/about-us" element={<AboutUs />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
