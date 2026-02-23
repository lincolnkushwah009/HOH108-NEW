import { getInitials, stringToColor } from '../../utils/helpers'

const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
}) => {
  const sizeValues = {
    xs: { width: '24px', height: '24px', fontSize: '10px' },
    sm: { width: '36px', height: '36px', fontSize: '12px' },
    md: { width: '44px', height: '44px', fontSize: '14px' },
    lg: { width: '56px', height: '56px', fontSize: '16px' },
    xl: { width: '64px', height: '64px', fontSize: '18px' },
  }

  const initials = getInitials(name || alt)
  const bgColor = stringToColor(name || alt)

  const baseStyle = {
    borderRadius: '12px',
    objectFit: 'cover',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    ...sizeValues[size],
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        style={baseStyle}
      />
    )
  }

  return (
    <div
      style={{
        ...baseStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        color: 'white',
        backgroundColor: bgColor,
      }}
    >
      {initials}
    </div>
  )
}

const AvatarGroup = ({ children, max = 4, size = 'md' }) => {
  const sizeValues = {
    xs: { width: '24px', height: '24px', fontSize: '10px' },
    sm: { width: '36px', height: '36px', fontSize: '12px' },
    md: { width: '44px', height: '44px', fontSize: '14px' },
    lg: { width: '56px', height: '56px', fontSize: '16px' },
    xl: { width: '64px', height: '64px', fontSize: '18px' },
  }

  const childArray = Array.isArray(children) ? children : [children]
  const visible = childArray.slice(0, max)
  const remaining = childArray.length - max

  const containerStyle = {
    display: 'flex',
  }

  const itemStyle = {
    marginLeft: '-8px',
    border: '2px solid white',
    borderRadius: '12px',
  }

  const remainingStyle = {
    ...sizeValues[size],
    marginLeft: '-8px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#e2e8f0',
    color: '#475569',
    fontWeight: '600',
    border: '2px solid white',
  }

  return (
    <div style={containerStyle}>
      {visible.map((child, index) => (
        <div
          key={index}
          style={index === 0 ? { borderRadius: '12px' } : itemStyle}
        >
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div style={remainingStyle}>
          +{remaining}
        </div>
      )}
    </div>
  )
}

Avatar.Group = AvatarGroup

export default Avatar
