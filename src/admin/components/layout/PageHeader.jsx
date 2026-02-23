import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const PageHeader = ({
  title,
  description,
  breadcrumbs = [],
  actions,
}) => {
  const containerStyle = {
    marginBottom: '32px',
  }

  const breadcrumbNavStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    marginBottom: '12px',
  }

  const breadcrumbLinkStyle = {
    color: '#64748b',
    textDecoration: 'none',
    transition: 'color 0.2s',
  }

  const breadcrumbCurrentStyle = {
    color: '#1e293b',
    fontWeight: '500',
  }

  const headerRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  }

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  }

  const descriptionStyle = {
    color: '#64748b',
    marginTop: '4px',
    fontSize: '15px',
  }

  const actionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }

  return (
    <div style={containerStyle}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav style={breadcrumbNavStyle}>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.path || index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {index > 0 && <ChevronRight style={{ width: '16px', height: '16px', color: '#cbd5e1' }} />}
              {crumb.path ? (
                <Link
                  to={crumb.path}
                  style={breadcrumbLinkStyle}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#C59C82'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={breadcrumbCurrentStyle}>{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Title and Actions */}
      <div style={headerRowStyle}>
        <div>
          <h1 style={titleStyle}>{title}</h1>
          {description && (
            <p style={descriptionStyle}>{description}</p>
          )}
        </div>
        {actions && (
          <div style={actionsStyle}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader
