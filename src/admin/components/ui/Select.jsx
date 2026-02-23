import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(({
  label,
  error,
  helper,
  options = [],
  placeholder = 'Select...',
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

  const wrapperStyle = {
    position: 'relative',
  }

  const selectStyle = {
    display: 'block',
    width: '100%',
    padding: '12px 40px 12px 16px',
    fontSize: '14px',
    background: '#f8fafc',
    color: '#1e293b',
    border: error ? '2px solid #fca5a5' : '2px solid #e2e8f0',
    borderRadius: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    appearance: 'none',
    cursor: 'pointer',
    ...style,
  }

  const iconStyle = {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '20px',
    height: '20px',
    color: '#94a3b8',
    pointerEvents: 'none',
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
      <div style={wrapperStyle}>
        <select
          ref={ref}
          style={selectStyle}
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
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown style={iconStyle} />
      </div>
      {error && <p style={errorStyle}>{error}</p>}
      {helper && !error && <p style={helperStyle}>{helper}</p>}
    </div>
  )
})

Select.displayName = 'Select'

export default Select
