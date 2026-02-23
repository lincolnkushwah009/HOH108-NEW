import { ChevronLeft, ChevronRight } from 'lucide-react'

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) return null

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderTop: '1px solid #f1f5f9',
  }

  const infoStyle = {
    fontSize: '14px',
    color: '#64748b',
  }

  const highlightStyle = {
    fontWeight: '500',
    color: '#475569',
  }

  const pagesContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  }

  const navButtonStyle = (disabled) => ({
    padding: '8px',
    background: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  })

  const pageButtonStyle = (isActive) => ({
    minWidth: '36px',
    height: '36px',
    padding: '0 12px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: isActive ? 'linear-gradient(135deg, #C59C82 0%, #DDC5B0 100%)' : 'transparent',
    color: isActive ? 'white' : '#475569',
    boxShadow: isActive ? '0 4px 12px rgba(197, 156, 130, 0.3)' : 'none',
  })

  const ellipsisStyle = {
    padding: '0 8px',
    color: '#94a3b8',
  }

  return (
    <div style={containerStyle}>
      <div style={infoStyle}>
        Showing <span style={highlightStyle}>{startItem}</span> to{' '}
        <span style={highlightStyle}>{endItem}</span> of{' '}
        <span style={highlightStyle}>{totalItems}</span> results
      </div>

      <div style={pagesContainerStyle}>
        <button
          style={navButtonStyle(currentPage === 1)}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.color = '#C59C82'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          <ChevronLeft style={{ width: '18px', height: '18px' }} />
        </button>

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} style={ellipsisStyle}>
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={pageButtonStyle(currentPage === page)}
              onMouseEnter={(e) => {
                if (currentPage !== page) {
                  e.currentTarget.style.background = '#FDF8F4'
                  e.currentTarget.style.color = '#C59C82'
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== page) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#475569'
                }
              }}
            >
              {page}
            </button>
          )
        ))}

        <button
          style={navButtonStyle(currentPage === totalPages)}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          onMouseEnter={(e) => {
            if (currentPage !== totalPages) {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.color = '#C59C82'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          <ChevronRight style={{ width: '18px', height: '18px' }} />
        </button>
      </div>
    </div>
  )
}

export default Pagination
