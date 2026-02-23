const Card = ({
  children,
  padding = 'md',
  hover = false,
  onClick,
  style = {},
}) => {
  const paddingValues = {
    none: '0',
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
  }

  const baseStyle = {
    background: 'white',
    borderRadius: '20px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    padding: paddingValues[padding],
    transition: 'all 0.2s',
    cursor: hover || onClick ? 'pointer' : 'default',
    ...style,
  }

  const handleMouseEnter = (e) => {
    if (hover || onClick) {
      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)'
      e.currentTarget.style.transform = 'translateY(-2px)'
    }
  }

  const handleMouseLeave = (e) => {
    if (hover || onClick) {
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
      e.currentTarget.style.transform = 'translateY(0)'
    }
  }

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ children, style = {} }) => (
  <div style={{ marginBottom: '16px', ...style }}>
    {children}
  </div>
)

const CardTitle = ({ children, style = {} }) => (
  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0, ...style }}>
    {children}
  </h3>
)

const CardDescription = ({ children, style = {} }) => (
  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', margin: 0, ...style }}>
    {children}
  </p>
)

const CardContent = ({ children, style = {} }) => (
  <div style={style}>
    {children}
  </div>
)

const CardFooter = ({ children, style = {} }) => (
  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', ...style }}>
    {children}
  </div>
)

Card.Header = CardHeader
Card.Title = CardTitle
Card.Description = CardDescription
Card.Content = CardContent
Card.Footer = CardFooter

export default Card
