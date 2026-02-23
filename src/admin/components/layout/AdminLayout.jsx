import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const sidebarWidth = sidebarCollapsed ? 96 : 280
  const sidebarGap = 24

  // Set body background for admin pages
  useEffect(() => {
    // Add admin-body class and set inline styles for reliability
    document.body.classList.add('admin-body')
    document.body.style.backgroundColor = '#f8fafc'
    document.body.style.color = '#1e293b'
    document.documentElement.style.backgroundColor = '#f8fafc'

    return () => {
      document.body.classList.remove('admin-body')
      document.body.style.backgroundColor = ''
      document.body.style.color = ''
      document.documentElement.style.backgroundColor = ''
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Desktop Sidebar - Fixed */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'block',
        }} className="lg:hidden">
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside style={{
            position: 'absolute',
            left: '16px',
            top: '16px',
            bottom: '16px',
            width: '280px',
          }}>
            <Sidebar collapsed={false} isMobile onClose={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main
        style={{
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          marginLeft: `${sidebarWidth + sidebarGap}px`,
        }}
        className="main-content"
      >
        {/* Header */}
        <Header
          onMenuClick={() => setMobileMenuOpen(true)}
          onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          collapsed={sidebarCollapsed}
        />

        {/* Page Content */}
        <div style={{ padding: '0 24px 32px 24px' }}>
          <Outlet />
        </div>
      </main>

      {/* Mobile styles - override margin */}
      <style>{`
        @media (max-width: 1023px) {
          .main-content {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminLayout
