import { FolderOpen, Plus } from 'lucide-react'

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No data found',
  description = 'There are no items to display.',
  action,
  actionLabel,
}) => {
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 16px',
  }

  const iconContainerStyle = {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
  }

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
    margin: 0,
  }

  const descriptionStyle = {
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center',
    maxWidth: '300px',
    marginBottom: '24px',
    lineHeight: '1.6',
  }

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: '#C59C82',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(197, 156, 130, 0.4)',
    transition: 'all 0.2s',
  }

  return (
    <div style={containerStyle}>
      <div style={iconContainerStyle}>
        <Icon style={{ width: '40px', height: '40px', color: '#94a3b8', strokeWidth: 1.5 }} />
      </div>

      <h3 style={titleStyle}>{title}</h3>
      <p style={descriptionStyle}>{description}</p>

      {action && actionLabel && (
        <button
          onClick={action}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(197, 156, 130, 0.5)'
            e.currentTarget.style.background = '#A68B6A'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(197, 156, 130, 0.4)'
            e.currentTarget.style.background = '#C59C82'
          }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
