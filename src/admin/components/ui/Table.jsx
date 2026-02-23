import { ChevronUp, ChevronDown } from 'lucide-react'

const Table = ({ children }) => (
  <div style={{ overflowX: 'auto', borderRadius: '16px' }}>
    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
      {children}
    </table>
  </div>
)

const TableHeader = ({ children }) => (
  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
    {children}
  </thead>
)

const TableBody = ({ children }) => (
  <tbody style={{ background: 'white' }}>
    {children}
  </tbody>
)

const TableRow = ({ children, onClick, hover = true }) => {
  const baseStyle = {
    transition: 'all 0.15s',
    cursor: onClick ? 'pointer' : 'default',
    borderBottom: '1px solid #f8fafc',
  }

  return (
    <tr
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.background = '#fafaff'
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      {children}
    </tr>
  )
}

const TableHead = ({
  children,
  sortable = false,
  sortDirection,
  onSort,
  style = {},
}) => {
  const baseStyle = {
    padding: '16px 20px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: sortable ? 'pointer' : 'default',
    userSelect: sortable ? 'none' : 'auto',
    transition: 'all 0.15s',
    ...style,
  }

  return (
    <th
      style={baseStyle}
      onClick={sortable ? onSort : undefined}
      onMouseEnter={(e) => {
        if (sortable) {
          e.currentTarget.style.color = '#C59C82'
          e.currentTarget.style.background = '#f1f5f9'
        }
      }}
      onMouseLeave={(e) => {
        if (sortable) {
          e.currentTarget.style.color = '#64748b'
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {children}
        {sortable && (
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <ChevronUp
              style={{
                width: '12px',
                height: '12px',
                marginBottom: '-4px',
                color: sortDirection === 'asc' ? '#C59C82' : '#cbd5e1',
              }}
            />
            <ChevronDown
              style={{
                width: '12px',
                height: '12px',
                color: sortDirection === 'desc' ? '#C59C82' : '#cbd5e1',
              }}
            />
          </span>
        )}
      </div>
    </th>
  )
}

const TableCell = ({ children, onClick, style = {} }) => (
  <td
    style={{
      padding: '16px 20px',
      fontSize: '14px',
      color: '#475569',
      ...style,
    }}
    onClick={onClick}
  >
    {children}
  </td>
)

Table.Header = TableHeader
Table.Body = TableBody
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell

export default Table
