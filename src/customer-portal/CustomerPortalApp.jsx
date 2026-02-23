import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { CustomerAuthProvider, useCustomerAuth } from './context/CustomerAuthContext'
import CustomerLogin from './pages/CustomerLogin'
import CustomerDashboard from './pages/CustomerDashboard'
import CustomerDesigns from './pages/CustomerDesigns'
import CustomerProjects from './pages/CustomerProjects'
import CustomerInvoices from './pages/CustomerInvoices'
import CustomerProfile from './pages/CustomerProfile'
import { LayoutDashboard, Palette, FolderKanban, FileText, User, LogOut, Menu, X } from 'lucide-react'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useCustomerAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#C59C82' }}>Loading...</div>
  return isAuthenticated ? children : <Navigate to="/customer-portal/login" replace />
}

const menuItems = [
  { path: '/customer-portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/customer-portal/designs', label: 'My Designs', icon: Palette },
  { path: '/customer-portal/projects', label: 'My Projects', icon: FolderKanban },
  { path: '/customer-portal/invoices', label: 'Invoices', icon: FileText },
  { path: '/customer-portal/profile', label: 'Profile', icon: User },
]

function Layout() {
  const { customer, logout } = useCustomerAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Sidebar */}
      <aside style={{
        width: 260, background: '#fff', borderRight: '1px solid #E5E7EB',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.2s',
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#C59C82', margin: 0 }}>Interior Plus</h2>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>Customer Portal</p>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {menuItems.map(item => {
            const active = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '12px 20px', border: 'none', cursor: 'pointer', fontSize: 14,
                  background: active ? '#FDF2EC' : 'transparent',
                  color: active ? '#C59C82' : '#4B5563', fontWeight: active ? 600 : 400,
                  borderRight: active ? '3px solid #C59C82' : 'none',
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: '#374151', margin: '0 0 4px' }}>{customer?.name}</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 12px' }}>{customer?.email}</p>
          <button
            onClick={() => { logout(); navigate('/customer-portal/login') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#EF4444',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />}

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 0 }}>
        <header style={{
          background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30,
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Welcome, {customer?.name}</span>
        </header>
        <main style={{ padding: 24 }}>
          <Routes>
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="designs" element={<CustomerDesigns />} />
            <Route path="projects" element={<CustomerProjects />} />
            <Route path="invoices" element={<CustomerInvoices />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function CustomerPortalApp() {
  return (
    <CustomerAuthProvider>
      <Routes>
        <Route path="login" element={<CustomerLogin />} />
        <Route path="*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
      </Routes>
    </CustomerAuthProvider>
  )
}
