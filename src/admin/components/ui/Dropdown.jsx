import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const Dropdown = ({
  trigger,
  children,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollY = window.scrollY || document.documentElement.scrollTop
      const scrollX = window.scrollX || document.documentElement.scrollLeft

      setMenuPosition({
        top: rect.bottom + scrollY + 8,
        left: align === 'right'
          ? rect.right + scrollX - 220
          : rect.left + scrollX,
      })
    }
  }, [isOpen, align])

  const containerStyle = {
    position: 'relative',
    display: 'inline-block',
  }

  const menuStyle = {
    position: 'absolute',
    zIndex: 9999,
    top: menuPosition.top,
    left: menuPosition.left,
    minWidth: '220px',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
    padding: '8px 0',
    overflow: 'hidden',
  }

  return (
    <div style={containerStyle} ref={triggerRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && createPortal(
        <div style={menuStyle} ref={menuRef} onClick={() => setIsOpen(false)}>
          {children}
        </div>,
        document.body
      )}
    </div>
  )
}

const DropdownItem = ({
  children,
  icon: Icon,
  onClick,
  danger = false,
  disabled = false,
}) => {
  const baseStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    fontSize: '14px',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s',
    color: danger ? '#dc2626' : '#475569',
  }

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={baseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? '#fef2f2' : '#FDF8F4'
        e.currentTarget.style.color = danger ? '#b91c1c' : '#C59C82'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'none'
        e.currentTarget.style.color = danger ? '#dc2626' : '#475569'
      }}
    >
      {Icon && <Icon style={{ width: '16px', height: '16px' }} />}
      {children}
    </button>
  )
}

const DropdownDivider = () => (
  <div style={{ margin: '8px 0', borderTop: '1px solid #f1f5f9' }} />
)

const DropdownLabel = ({ children }) => (
  <div style={{
    padding: '8px 16px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }}>
    {children}
  </div>
)

Dropdown.Item = DropdownItem
Dropdown.Divider = DropdownDivider
Dropdown.Label = DropdownLabel

export default Dropdown
