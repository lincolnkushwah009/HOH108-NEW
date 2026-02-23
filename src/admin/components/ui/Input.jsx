import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  helper,
  icon: Icon,
  type = 'text',
  style = {},
  ...props
}, ref) => {
  const containerStyle = {
    width: '100%',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569',
    marginBottom: '8px',
  }

  const inputWrapperStyle = {
    position: 'relative',
  }

  const iconContainerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    paddingLeft: '16px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  }

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    paddingLeft: Icon ? '48px' : '16px',
    fontSize: '14px',
    background: '#f8fafc',
    color: '#1e293b',
    border: error ? '2px solid #fca5a5' : '2px solid #e2e8f0',
    borderRadius: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    ...style,
  }

  const errorStyle = {
    marginTop: '8px',
    fontSize: '13px',
    color: '#dc2626',
  }

  const helperStyle = {
    marginTop: '8px',
    fontSize: '13px',
    color: '#64748b',
  }

  return (
    <div style={containerStyle}>
      {label && (
        <label style={labelStyle}>{label}</label>
      )}
      <div style={inputWrapperStyle}>
        {Icon && (
          <div style={iconContainerStyle}>
            <Icon style={{ width: '20px', height: '20px', color: '#94a3b8' }} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = error ? '#f87171' : '#C59C82'
            e.target.style.background = 'white'
            e.target.style.boxShadow = error
              ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
              : '0 0 0 3px rgba(197, 156, 130, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#fca5a5' : '#e2e8f0'
            e.target.style.background = '#f8fafc'
            e.target.style.boxShadow = 'none'
          }}
          {...props}
        />
      </div>
      {error && <p style={errorStyle}>{error}</p>}
      {helper && !error && <p style={helperStyle}>{helper}</p>}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
