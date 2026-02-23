import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
}) => {
  const modalRef = useRef(null)

  const sizeWidths = {
    sm: '448px',
    md: '512px',
    lg: '672px',
    xl: '896px',
    full: '1152px',
  }

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    overflowY: 'auto',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 16px',
  }

  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
  }

  const modalStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: sizeWidths[size],
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  }

  const headerStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '24px 24px 0',
  }

  const titleStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  }

  const descriptionStyle = {
    marginTop: '6px',
    fontSize: '14px',
    color: '#64748b',
  }

  const closeButtonStyle = {
    padding: '8px',
    margin: '-8px',
    color: '#94a3b8',
    background: 'none',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const contentStyle = {
    padding: '24px',
  }

  return (
    <div style={overlayStyle}>
      <div style={backdropStyle} onClick={onClose} />
      <div
        ref={modalRef}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showClose) && (
          <div style={headerStyle}>
            <div>
              {title && <h3 style={titleStyle}>{title}</h3>}
              {description && <p style={descriptionStyle}>{description}</p>}
            </div>
            {showClose && (
              <button
                onClick={onClose}
                style={closeButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#475569'
                  e.currentTarget.style.background = '#f1f5f9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8'
                  e.currentTarget.style.background = 'none'
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            )}
          </div>
        )}
        <div style={contentStyle}>{children}</div>
      </div>
    </div>
  )
}

const ModalFooter = ({ children }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '20px',
    marginTop: '8px',
    borderTop: '1px solid #f1f5f9',
  }}>
    {children}
  </div>
)

Modal.Footer = ModalFooter

export default Modal
