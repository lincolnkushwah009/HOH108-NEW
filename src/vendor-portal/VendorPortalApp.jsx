import { Routes, Route, Navigate, Link, useLocation, Outlet } from 'react-router-dom'
import { VendorAuthProvider, useVendorAuth } from './context/VendorAuthContext'

// Pages
import VendorLogin from './pages/VendorLogin'
import VendorDashboard from './pages/VendorDashboard'
import VendorPurchaseOrders from './pages/VendorPurchaseOrders'
import VendorRFQs from './pages/VendorRFQs'
import VendorProfile from './pages/VendorProfile'
import VendorMaterials from './pages/VendorMaterials'

// Icons
import {
  LayoutDashboard,
  Package,
  User,
  LogOut,
  Menu,
  X,
  Building2,
  FileText,
  IndianRupee
} from 'lucide-react'
import { useState } from 'react'

// Protected Route Component
const VendorProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useVendorAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#0d9488',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280' }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/vendor-portal/login" state={{ from: location }} replace />
  }

  return children
}

// Layout Component
const VendorLayout = () => {
  const { vendor, logout } = useVendorAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const menuItems = [
    { path: '/vendor-portal', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/vendor-portal/materials', icon: IndianRupee, label: 'My Materials' },
    { path: '/vendor-portal/rfqs', icon: FileText, label: 'Quotation Requests' },
    { path: '/vendor-portal/purchase-orders', icon: Package, label: 'Purchase Orders' },
    { path: '/vendor-portal/profile', icon: User, label: 'Profile' },
  ]

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            display: 'block',
            '@media (min-width: 768px)': { display: 'none' }
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : '-260px',
        bottom: 0,
        zIndex: 50,
        transition: 'left 0.3s ease',
        '@media (min-width: 768px)': { left: 0 }
      }} className="vendor-sidebar">
        {/* Logo */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              Vendor Portal
            </h1>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>HOH108</p>
          </div>
        </div>

        {/* Menu */}
        <nav style={{ padding: '16px 12px' }}>
          {menuItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.path, item.exact)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  marginBottom: '4px',
                  background: active ? '#0d948815' : 'transparent',
                  color: active ? '#0d9488' : '#6b7280',
                  fontWeight: active ? '500' : '400',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Info & Logout */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '12px',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {vendor?.name?.charAt(0) || 'V'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#1f2937',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {vendor?.name}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                {vendor?.vendorId}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              border: '1px solid #fee2e2',
              borderRadius: '8px',
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: 0,
        minHeight: '100vh'
      }} className="vendor-main">
        {/* Top Bar */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '8px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="vendor-menu-btn"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
            {menuItems.find(item => isActive(item.path, item.exact))?.label || 'Vendor Portal'}
          </h2>
        </header>

        {/* Page Content */}
        <div style={{ padding: '24px' }}>
          <Outlet />
        </div>
      </main>

      {/* Responsive Styles */}
      <style>{`
        @media (min-width: 768px) {
          .vendor-sidebar {
            left: 0 !important;
          }
          .vendor-main {
            margin-left: 260px !important;
          }
          .vendor-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

const VendorPortalApp = () => {
  return (
    <VendorAuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="login" element={<VendorLogin />} />

        {/* Protected Routes */}
        <Route
          element={
            <VendorProtectedRoute>
              <VendorLayout />
            </VendorProtectedRoute>
          }
        >
          <Route index element={<VendorDashboard />} />
          <Route path="materials" element={<VendorMaterials />} />
          <Route path="rfqs" element={<VendorRFQs />} />
          <Route path="rfqs/:id" element={<VendorRFQs />} />
          <Route path="purchase-orders" element={<VendorPurchaseOrders />} />
          <Route path="purchase-orders/:id" element={<VendorPurchaseOrders />} />
          <Route path="profile" element={<VendorProfile />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/vendor-portal" replace />} />
      </Routes>
    </VendorAuthProvider>
  )
}

export default VendorPortalApp
