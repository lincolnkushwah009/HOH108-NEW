import { useState } from 'react'
import {
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  MessageSquare,
  Calendar,
  IndianRupee,
  Building,
  User,
  Phone,
  Mail,
  FileCheck,
  Send,
} from 'lucide-react'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  cardHover: '#222222',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textMuted: 'rgba(255,255,255,0.6)',
  border: 'rgba(255,255,255,0.1)',
}

const STATUS_CONFIG = {
  pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Pending Review', icon: Clock },
  approved: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: 'Approved', icon: CheckCircle },
  rejected: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Rejected', icon: XCircle },
  expired: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', label: 'Expired', icon: AlertCircle },
  draft: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)', label: 'Draft', icon: FileText },
}

const mockQuotes = [
  {
    id: 'QT-2024-001',
    projectName: 'Living Room Renovation',
    projectType: 'Residential',
    createdDate: '2024-01-15',
    validUntil: '2024-02-15',
    status: 'pending',
    totalAmount: 485000,
    items: [
      { name: 'Custom Sofa Set (3+2)', quantity: 1, unitPrice: 185000, total: 185000 },
      { name: 'Center Table - Marble Top', quantity: 1, unitPrice: 45000, total: 45000 },
      { name: 'TV Unit with Storage', quantity: 1, unitPrice: 78000, total: 78000 },
      { name: 'Curtains & Blinds', quantity: 4, unitPrice: 12000, total: 48000 },
      { name: 'Decorative Lighting', quantity: 6, unitPrice: 8500, total: 51000 },
      { name: 'Wall Paneling', quantity: 1, unitPrice: 78000, total: 78000 },
    ],
    designer: { name: 'Priya Sharma', phone: '+91 98765 43210', email: 'priya@hoh108.com' },
    notes: 'Premium Italian marble for center table. LED strip lighting included in wall paneling.',
  },
  {
    id: 'QT-2024-002',
    projectName: 'Master Bedroom Design',
    projectType: 'Residential',
    createdDate: '2024-01-10',
    validUntil: '2024-02-10',
    status: 'approved',
    totalAmount: 325000,
    items: [
      { name: 'King Size Bed with Hydraulic Storage', quantity: 1, unitPrice: 125000, total: 125000 },
      { name: 'Wardrobe - Walk-in Closet', quantity: 1, unitPrice: 145000, total: 145000 },
      { name: 'Dressing Table with Mirror', quantity: 1, unitPrice: 35000, total: 35000 },
      { name: 'Bedside Tables', quantity: 2, unitPrice: 10000, total: 20000 },
    ],
    designer: { name: 'Rahul Verma', phone: '+91 98765 43211', email: 'rahul@hoh108.com' },
    notes: 'Walnut wood finish. Soft-close hinges on all cabinets.',
    approvedDate: '2024-01-12',
  },
  {
    id: 'QT-2024-003',
    projectName: 'Office Interior',
    projectType: 'Commercial',
    createdDate: '2024-01-05',
    validUntil: '2024-02-05',
    status: 'rejected',
    totalAmount: 890000,
    items: [
      { name: 'Executive Desks', quantity: 5, unitPrice: 45000, total: 225000 },
      { name: 'Conference Table (12 seater)', quantity: 1, unitPrice: 180000, total: 180000 },
      { name: 'Ergonomic Chairs', quantity: 20, unitPrice: 15000, total: 300000 },
      { name: 'Reception Counter', quantity: 1, unitPrice: 95000, total: 95000 },
      { name: 'Partition Walls', quantity: 1, unitPrice: 90000, total: 90000 },
    ],
    designer: { name: 'Priya Sharma', phone: '+91 98765 43210', email: 'priya@hoh108.com' },
    notes: 'Budget exceeded. Client requested revision with reduced scope.',
    rejectedDate: '2024-01-08',
    rejectionReason: 'Budget constraints - requested 30% reduction',
  },
  {
    id: 'QT-2024-004',
    projectName: 'Kitchen Modular',
    projectType: 'Residential',
    createdDate: '2023-12-01',
    validUntil: '2024-01-01',
    status: 'expired',
    totalAmount: 275000,
    items: [
      { name: 'Modular Kitchen Cabinets', quantity: 1, unitPrice: 175000, total: 175000 },
      { name: 'Granite Countertop', quantity: 1, unitPrice: 55000, total: 55000 },
      { name: 'Chimney & Hob', quantity: 1, unitPrice: 45000, total: 45000 },
    ],
    designer: { name: 'Amit Patel', phone: '+91 98765 43212', email: 'amit@hoh108.com' },
    notes: 'L-shaped kitchen with island. Soft-close drawers.',
  },
]

const Quotes = () => {
  const [quotes] = useState(mockQuotes)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedQuote, setExpandedQuote] = useState(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quote.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: quotes.length,
    pending: quotes.filter(q => q.status === 'pending').length,
    approved: quotes.filter(q => q.status === 'approved').length,
    totalValue: quotes.filter(q => q.status === 'approved').reduce((sum, q) => sum + q.totalAmount, 0),
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const cardStyle = {
    background: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  }

  const statCardStyle = {
    ...cardStyle,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 }}>
          Quotes & Estimates
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: '14px', marginTop: '8px' }}>
          View and manage your project quotations
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={statCardStyle}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FileText style={{ width: '24px', height: '24px', color: '#8b5cf6' }} />
          </div>
          <div>
            <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>Total Quotes</p>
            <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>{stats.total}</p>
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Clock style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
          </div>
          <div>
            <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>Pending Review</p>
            <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>{stats.pending}</p>
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircle style={{ width: '24px', height: '24px', color: '#10b981' }} />
          </div>
          <div>
            <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>Approved</p>
            <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>{stats.approved}</p>
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `${COLORS.accent}25`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IndianRupee style={{ width: '24px', height: '24px', color: COLORS.accent }} />
          </div>
          <div>
            <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>Approved Value</p>
            <p style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0 }}>
              {formatCurrency(stats.totalValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '18px',
            height: '18px',
            color: COLORS.textMuted,
          }} />
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <Filter style={{ width: '18px', height: '18px' }} />
            {statusFilter === 'all' ? 'All Status' : STATUS_CONFIG[statusFilter]?.label}
            <ChevronDown style={{ width: '16px', height: '16px' }} />
          </button>

          {showFilterDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              zIndex: 10,
              minWidth: '180px',
            }}>
              {['all', 'pending', 'approved', 'rejected', 'expired'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status)
                    setShowFilterDropdown(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: statusFilter === status ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: 'none',
                    color: statusFilter === status ? COLORS.accent : 'white',
                    fontSize: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {status === 'all' ? 'All Status' : STATUS_CONFIG[status]?.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quotes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredQuotes.map((quote) => {
          const statusConfig = STATUS_CONFIG[quote.status]
          const StatusIcon = statusConfig.icon
          const isExpanded = expandedQuote === quote.id

          return (
            <div key={quote.id} style={cardStyle}>
              {/* Quote Header */}
              <div
                onClick={() => setExpandedQuote(isExpanded ? null : quote.id)}
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `${COLORS.accent}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FileText style={{ width: '24px', height: '24px', color: COLORS.accent }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                        {quote.projectName}
                      </h3>
                      <span style={{
                        padding: '4px 10px',
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        fontSize: '12px',
                        fontWeight: '500',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <StatusIcon style={{ width: '12px', height: '12px' }} />
                        {statusConfig.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px' }}>
                      <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>{quote.id}</span>
                      <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>•</span>
                      <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>{quote.projectType}</span>
                      <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>•</span>
                      <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                        Created {formatDate(quote.createdDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                      {formatCurrency(quote.totalAmount)}
                    </p>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>
                      Valid until {formatDate(quote.validUntil)}
                    </p>
                  </div>
                  <ChevronRight style={{
                    width: '20px',
                    height: '20px',
                    color: COLORS.textMuted,
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }} />
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{
                  borderTop: `1px solid ${COLORS.border}`,
                  padding: '24px',
                  background: 'rgba(0,0,0,0.2)',
                }}>
                  {/* Items Table */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
                      Quotation Items
                    </h4>
                    <div style={{
                      background: COLORS.card,
                      borderRadius: '12px',
                      border: `1px solid ${COLORS.border}`,
                      overflow: 'hidden',
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', color: COLORS.textMuted, fontSize: '12px', fontWeight: '500' }}>Item</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', color: COLORS.textMuted, fontSize: '12px', fontWeight: '500' }}>Qty</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', color: COLORS.textMuted, fontSize: '12px', fontWeight: '500' }}>Unit Price</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', color: COLORS.textMuted, fontSize: '12px', fontWeight: '500' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quote.items.map((item, index) => (
                            <tr key={index} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                              <td style={{ padding: '12px 16px', color: 'white', fontSize: '14px' }}>{item.name}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'center', color: COLORS.textMuted, fontSize: '14px' }}>{item.quantity}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', color: COLORS.textMuted, fontSize: '14px' }}>{formatCurrency(item.unitPrice)}</td>
                              <td style={{ padding: '12px 16px', textAlign: 'right', color: 'white', fontSize: '14px', fontWeight: '500' }}>{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: `2px solid ${COLORS.border}`, background: 'rgba(255,255,255,0.02)' }}>
                            <td colSpan={3} style={{ padding: '14px 16px', textAlign: 'right', color: 'white', fontSize: '14px', fontWeight: '600' }}>Grand Total</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right', color: COLORS.accent, fontSize: '16px', fontWeight: '700' }}>{formatCurrency(quote.totalAmount)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Designer Info & Notes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                        Designer Contact
                      </h4>
                      <div style={{
                        background: COLORS.card,
                        borderRadius: '12px',
                        border: `1px solid ${COLORS.border}`,
                        padding: '16px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: `${COLORS.accent}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <User style={{ width: '20px', height: '20px', color: COLORS.accent }} />
                          </div>
                          <div>
                            <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: 0 }}>{quote.designer.name}</p>
                            <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>Interior Designer</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <a href={`tel:${quote.designer.phone}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: COLORS.textMuted,
                            fontSize: '13px',
                            textDecoration: 'none',
                          }}>
                            <Phone style={{ width: '14px', height: '14px' }} />
                            {quote.designer.phone}
                          </a>
                          <a href={`mailto:${quote.designer.email}`} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: COLORS.textMuted,
                            fontSize: '13px',
                            textDecoration: 'none',
                          }}>
                            <Mail style={{ width: '14px', height: '14px' }} />
                            {quote.designer.email}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                        Notes
                      </h4>
                      <div style={{
                        background: COLORS.card,
                        borderRadius: '12px',
                        border: `1px solid ${COLORS.border}`,
                        padding: '16px',
                      }}>
                        <p style={{ color: COLORS.textMuted, fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                          {quote.notes}
                        </p>
                        {quote.rejectionReason && (
                          <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                          }}>
                            <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: '500', margin: 0 }}>
                              Rejection Reason:
                            </p>
                            <p style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '13px', margin: '4px 0 0 0' }}>
                              {quote.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '24px',
                    paddingTop: '24px',
                    borderTop: `1px solid ${COLORS.border}`,
                  }}>
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: COLORS.accent,
                        border: 'none',
                        borderRadius: '10px',
                        color: COLORS.dark,
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      <Download style={{ width: '16px', height: '16px' }} />
                      Download PDF
                    </button>
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      <MessageSquare style={{ width: '16px', height: '16px' }} />
                      Request Changes
                    </button>
                    {quote.status === 'pending' && (
                      <>
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '10px',
                            color: '#10b981',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          <CheckCircle style={{ width: '16px', height: '16px' }} />
                          Approve
                        </button>
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '10px',
                            color: '#ef4444',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          <XCircle style={{ width: '16px', height: '16px' }} />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredQuotes.length === 0 && (
          <div style={{
            ...cardStyle,
            padding: '60px',
            textAlign: 'center',
          }}>
            <FileText style={{ width: '48px', height: '48px', color: COLORS.textMuted, margin: '0 auto 16px' }} />
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              No quotes found
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: 0 }}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'You don\'t have any quotes yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Quotes
