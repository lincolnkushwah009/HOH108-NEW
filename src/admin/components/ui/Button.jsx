import { forwardRef } from 'react'

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  onClick,
  style = {},
}, ref) => {
  const variantStyles = {
    primary: {
      background: '#C59C82',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 14px rgba(197, 156, 130, 0.4)',
    },
    secondary: {
      background: '#f1f5f9',
      color: '#475569',
      border: 'none',
      boxShadow: 'none',
    },
    outline: {
      background: 'transparent',
      color: '#C59C82',
      border: '2px solid #C59C82',
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: '#475569',
      border: 'none',
      boxShadow: 'none',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
    },
    success: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
    },
  }

  const sizeStyles = {
    xs: { padding: '6px 12px', fontSize: '12px' },
    sm: { padding: '8px 16px', fontSize: '13px' },
    md: { padding: '12px 20px', fontSize: '14px' },
    lg: { padding: '14px 24px', fontSize: '15px' },
    xl: { padding: '16px 32px', fontSize: '16px' },
  }

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600',
    borderRadius: '14px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 0.2s',
    outline: 'none',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  }

  const handleMouseEnter = (e) => {
    if (!disabled && !loading) {
      e.currentTarget.style.transform = 'translateY(-1px)'
      if (variant === 'primary') {
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(197, 156, 130, 0.5)'
        e.currentTarget.style.background = '#A68B6A'
      } else if (variant === 'secondary') {
        e.currentTarget.style.background = '#e2e8f0'
      } else if (variant === 'outline') {
        e.currentTarget.style.background = 'rgba(197, 156, 130, 0.1)'
        e.currentTarget.style.borderColor = '#A68B6A'
      } else if (variant === 'ghost') {
        e.currentTarget.style.background = '#f1f5f9'
      }
    }
  }

  const handleMouseLeave = (e) => {
    if (!disabled && !loading) {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = variantStyles[variant].boxShadow
      e.currentTarget.style.background = variantStyles[variant].background
      if (variant === 'outline') {
        e.currentTarget.style.borderColor = '#C59C82'
      }
    }
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {loading ? (
        <svg
          style={{
            animation: 'spin 1s linear infinite',
            width: '16px',
            height: '16px'
          }}
          viewBox="0 0 24 24"
        >
          <circle
            style={{ opacity: 0.25 }}
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            style={{ opacity: 0.75 }}
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon style={{ width: '16px', height: '16px' }} />
      ) : null}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon style={{ width: '16px', height: '16px' }} />
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  )
})

Button.displayName = 'Button'

export default Button
