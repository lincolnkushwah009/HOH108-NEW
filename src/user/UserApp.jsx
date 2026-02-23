import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider } from './context/UserContext'

// Desktop Layout & Pages
import UserLayout from './components/layout/UserLayout'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Orders from './pages/Orders'
import Deliveries from './pages/Deliveries'
import Quotes from './pages/Quotes'
import Consultations from './pages/Consultations'
import Rewards from './pages/Rewards'
import Designs from './pages/Designs'
import Support from './pages/Support'
import Documents from './pages/Documents'

// Mobile Layout & Pages
import MobileLayout from './components/layout/MobileLayout'
import MobileDashboard from './pages/MobileDashboard'
import MobileProjects from './pages/MobileProjects'
import MobileOrders from './pages/MobileOrders'
import MobileRewards from './pages/MobileRewards'
import MobileServices from './pages/MobileServices'
import ProjectLifecycle from './pages/ProjectLifecycle'

const UserApp = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if running in Capacitor (mobile app) or small screen
    const checkMobile = () => {
      const isCapacitor = window.Capacitor !== undefined
      const isSmallScreen = window.innerWidth < 768
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // Force mobile view for Capacitor apps or small touch devices
      setIsMobile(isCapacitor || (isSmallScreen && isTouchDevice) || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile Routes
  if (isMobile) {
    return (
      <UserProvider>
        <Routes>
          <Route element={<MobileLayout />}>
            <Route index element={<MobileDashboard />} />
            <Route path="projects" element={<MobileProjects />} />
            <Route path="projects/:id" element={<ProjectLifecycle />} />
            <Route path="orders" element={<MobileOrders />} />
            <Route path="deliveries" element={<Deliveries />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="consultations" element={<Consultations />} />
            <Route path="rewards" element={<MobileRewards />} />
            <Route path="designs" element={<Designs />} />
            <Route path="services" element={<MobileServices />} />
            <Route path="support" element={<Support />} />
            <Route path="documents" element={<Documents />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </UserProvider>
    )
  }

  // Desktop Routes
  return (
    <UserProvider>
      <Routes>
        <Route element={<UserLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="orders" element={<Orders />} />
          <Route path="deliveries" element={<Deliveries />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="consultations" element={<Consultations />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="designs" element={<Designs />} />
          <Route path="support" element={<Support />} />
          <Route path="documents" element={<Documents />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </UserProvider>
  )
}

export default UserApp
