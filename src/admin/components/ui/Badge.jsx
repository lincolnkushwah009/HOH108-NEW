const Badge = ({
  children,
  color = 'gray',
  size = 'md',
  dot = false,
}) => {
  const colorStyles = {
    gray: { background: '#f1f5f9', color: '#475569' },
    red: { background: '#fef2f2', color: '#dc2626' },
    yellow: { background: '#fffbeb', color: '#d97706' },
    green: { background: '#ecfdf5', color: '#059669' },
    blue: { background: '#eff6ff', color: '#2563eb' },
    purple: { background: '#FDF8F4', color: '#C59C82' },
    pink: { background: '#fdf2f8', color: '#db2777' },
    orange: { background: '#fff7ed', color: '#ea580c' },
    teal: { background: '#f0fdfa', color: '#0d9488' },
    indigo: { background: '#FDF8F4', color: '#C59C82' },
    emerald: { background: '#ecfdf5', color: '#059669' },
    cyan: { background: '#ecfeff', color: '#0891b2' },
    violet: { background: '#FDF8F4', color: '#C59C82' },
  }

  const sizeStyles = {
    sm: { padding: '4px 10px', fontSize: '10px' },
    md: { padding: '5px 12px', fontSize: '11px' },
    lg: { padding: '6px 14px', fontSize: '12px' },
  }

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '600',
    borderRadius: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    ...colorStyles[color] || colorStyles.gray,
    ...sizeStyles[size],
  }

  const dotStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  }

  return (
    <span style={baseStyle}>
      {dot && <span style={dotStyle} />}
      {children}
    </span>
  )
}

export default Badge
