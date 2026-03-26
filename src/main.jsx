import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import FluidCursor from './components/FluidCursor.jsx'
import App from './App.jsx'
import About from './pages/About.jsx'
import Construction from './pages/Construction.jsx'
import Interior from './pages/Interior.jsx'
import Renovation from './pages/Renovation.jsx'
import FloorMap3D from './pages/FloorMap3D.jsx'
import Team from './pages/Team.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Profile from './pages/Profile.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TermsAndConditions from './pages/TermsAndConditions.jsx'
import RefundPolicy from './pages/RefundPolicy.jsx'
import ContactUs from './pages/ContactUs.jsx'
import EduPlusComingSoon from './pages/EduPlusComingSoon.jsx'
import AdminApp from './admin/AdminApp.jsx'
import UserApp from './user/UserApp.jsx'
import VendorPortalApp from './vendor-portal/VendorPortalApp.jsx'
import CustomerPortalApp from './customer-portal/CustomerPortalApp.jsx'
import ChannelPartnerPortalApp from './channel-partner-portal/ChannelPartnerPortalApp.jsx'
import FloatingWhatsApp from './components/FloatingWhatsApp.jsx'

// Check if running in Capacitor (mobile app)
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined

// Home route component - redirects to dashboard on mobile app
const HomeRoute = () => {
  if (isCapacitor) {
    return <Navigate to="/dashboard" replace />
  }
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <FluidCursor />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomeRoute />} />
        <Route path="/about" element={<About />} />
        <Route path="/construction" element={<Construction />} />
        <Route path="/interior" element={<Interior />} />
        <Route path="/renovation" element={<Renovation />} />
        <Route path="/floor-map-3d" element={<FloorMap3D />} />
        <Route path="/team" element={<Team />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/edu-plus" element={<EduPlusComingSoon />} />

        {/* User Dashboard Routes */}
        <Route path="/dashboard/*" element={<UserApp />} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Vendor Portal Routes */}
        <Route path="/vendor-portal/*" element={<VendorPortalApp />} />

        {/* Customer Portal Routes */}
        <Route path="/customer-portal/*" element={<CustomerPortalApp />} />

        {/* Channel Partner Portal Routes */}
        <Route path="/channel-partner-portal/*" element={<ChannelPartnerPortalApp />} />
      </Routes>
      <FloatingWhatsApp />
    </BrowserRouter>
  </StrictMode>,
)
