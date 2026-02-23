import { Search, X } from 'lucide-react'

const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  style = {},
}) => {
  const containerStyle = {
    position: 'relative',
    maxWidth: '400px',
    ...style,
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 44px 12px 44px',
    fontSize: '14px',
    background: '#f8fafc',
    color: '#1e293b',
    border: '2px solid #e2e8f0',
    borderRadius: '14px',
    outline: 'none',
    transition: 'all 0.2s',
  }

  const iconStyle = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '18px',
    height: '18px',
    color: '#94a3b8',
    pointerEvents: 'none',
  }

  const clearButtonStyle = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    transition: 'all 0.2s',
  }

  return (
    <div style={containerStyle}>
      <Search style={iconStyle} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={(e) => {
          e.target.style.borderColor = '#C59C82'
          e.target.style.background = 'white'
          e.target.style.boxShadow = '0 0 0 3px rgba(197, 156, 130, 0.1)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e2e8f0'
          e.target.style.background = '#f8fafc'
          e.target.style.boxShadow = 'none'
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={clearButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#475569'
            e.currentTarget.style.background = '#e2e8f0'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8'
            e.currentTarget.style.background = 'none'
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      )}
    </div>
  )
}

export default SearchInput
