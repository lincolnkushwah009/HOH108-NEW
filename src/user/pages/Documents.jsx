import { useState } from 'react'
import {
  FileBox,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  File,
  Image,
  Video,
  FolderOpen,
  Calendar,
  Clock,
  ChevronDown,
  Grid,
  List,
  Star,
  Share2,
  MoreVertical,
  Check,
  Shield,
  FileCheck,
  Receipt,
  Scroll,
  ClipboardList,
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

const DOCUMENT_TYPES = {
  boq: { label: 'BOQ', icon: ClipboardList, color: '#8b5cf6' },
  contract: { label: 'Contract', icon: Scroll, color: '#3b82f6' },
  invoice: { label: 'Invoice', icon: Receipt, color: '#10b981' },
  warranty: { label: 'Warranty', icon: Shield, color: '#f59e0b' },
  design: { label: 'Design', icon: Image, color: '#ec4899' },
  approval: { label: 'Approval', icon: FileCheck, color: '#06b6d4' },
  other: { label: 'Other', icon: FileText, color: '#6b7280' },
}

const FILE_ICONS = {
  pdf: { icon: FileText, color: '#ef4444' },
  doc: { icon: FileText, color: '#3b82f6' },
  docx: { icon: FileText, color: '#3b82f6' },
  xls: { icon: FileText, color: '#10b981' },
  xlsx: { icon: FileText, color: '#10b981' },
  jpg: { icon: Image, color: '#8b5cf6' },
  jpeg: { icon: Image, color: '#8b5cf6' },
  png: { icon: Image, color: '#8b5cf6' },
  mp4: { icon: Video, color: '#f59e0b' },
}

const mockDocuments = [
  {
    id: 1,
    name: 'Living Room BOQ - Final',
    type: 'boq',
    project: 'Living Room Renovation',
    fileType: 'xlsx',
    size: '245 KB',
    uploadedAt: '2024-01-15',
    uploadedBy: 'Priya Sharma',
    isStarred: true,
    status: 'approved',
  },
  {
    id: 2,
    name: 'Project Contract Agreement',
    type: 'contract',
    project: 'Living Room Renovation',
    fileType: 'pdf',
    size: '1.2 MB',
    uploadedAt: '2024-01-10',
    uploadedBy: 'HOH108 Legal',
    isStarred: true,
    status: 'signed',
  },
  {
    id: 3,
    name: 'Invoice #INV-2024-001',
    type: 'invoice',
    project: 'Living Room Renovation',
    fileType: 'pdf',
    size: '156 KB',
    uploadedAt: '2024-01-12',
    uploadedBy: 'Accounts Team',
    isStarred: false,
    status: 'paid',
  },
  {
    id: 4,
    name: 'Sofa Set Warranty Certificate',
    type: 'warranty',
    project: 'Living Room Renovation',
    fileType: 'pdf',
    size: '89 KB',
    uploadedAt: '2024-01-18',
    uploadedBy: 'Vendor - Milano Furniture',
    isStarred: false,
    status: 'active',
    expiryDate: '2029-01-18',
  },
  {
    id: 5,
    name: '3D Design Renders - Living Room',
    type: 'design',
    project: 'Living Room Renovation',
    fileType: 'pdf',
    size: '8.5 MB',
    uploadedAt: '2024-01-08',
    uploadedBy: 'Priya Sharma',
    isStarred: true,
    status: 'approved',
  },
  {
    id: 6,
    name: 'Material Approval Sheet',
    type: 'approval',
    project: 'Living Room Renovation',
    fileType: 'pdf',
    size: '320 KB',
    uploadedAt: '2024-01-14',
    uploadedBy: 'Rahul Verma',
    isStarred: false,
    status: 'approved',
  },
  {
    id: 7,
    name: 'Master Bedroom BOQ',
    type: 'boq',
    project: 'Master Bedroom Design',
    fileType: 'xlsx',
    size: '198 KB',
    uploadedAt: '2024-01-05',
    uploadedBy: 'Rahul Verma',
    isStarred: false,
    status: 'pending',
  },
  {
    id: 8,
    name: 'Bedroom Design Contract',
    type: 'contract',
    project: 'Master Bedroom Design',
    fileType: 'pdf',
    size: '1.1 MB',
    uploadedAt: '2024-01-06',
    uploadedBy: 'HOH108 Legal',
    isStarred: false,
    status: 'pending_signature',
  },
  {
    id: 9,
    name: 'Mattress Warranty',
    type: 'warranty',
    project: 'Master Bedroom Design',
    fileType: 'pdf',
    size: '75 KB',
    uploadedAt: '2024-01-20',
    uploadedBy: 'Vendor - SleepWell',
    isStarred: false,
    status: 'active',
    expiryDate: '2034-01-20',
  },
  {
    id: 10,
    name: 'Advance Payment Receipt',
    type: 'invoice',
    project: 'Master Bedroom Design',
    fileType: 'pdf',
    size: '112 KB',
    uploadedAt: '2024-01-07',
    uploadedBy: 'Accounts Team',
    isStarred: false,
    status: 'paid',
  },
]

const STATUS_CONFIG = {
  approved: { color: '#10b981', label: 'Approved' },
  pending: { color: '#f59e0b', label: 'Pending' },
  signed: { color: '#10b981', label: 'Signed' },
  pending_signature: { color: '#f59e0b', label: 'Pending Signature' },
  paid: { color: '#10b981', label: 'Paid' },
  active: { color: '#3b82f6', label: 'Active' },
  expired: { color: '#ef4444', label: 'Expired' },
}

const Documents = () => {
  const [documents, setDocuments] = useState(mockDocuments)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedProject, setSelectedProject] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)

  const projects = [...new Set(documents.map(d => d.project))]

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || doc.type === selectedType
    const matchesProject = selectedProject === 'all' || doc.project === selectedProject
    return matchesSearch && matchesType && matchesProject
  })

  const toggleStar = (id) => {
    setDocuments(documents.map(d =>
      d.id === id ? { ...d, isStarred: !d.isStarred } : d
    ))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getFileIcon = (fileType) => {
    const config = FILE_ICONS[fileType] || { icon: File, color: '#6b7280' }
    return config
  }

  const cardStyle = {
    background: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 }}>
          Documents
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: '14px', marginTop: '8px' }}>
          Access your project documents, contracts, invoices, and warranties
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        {Object.entries(DOCUMENT_TYPES).slice(0, 6).map(([key, config]) => {
          const Icon = config.icon
          const count = documents.filter(d => d.type === key).length
          return (
            <div
              key={key}
              onClick={() => setSelectedType(selectedType === key ? 'all' : key)}
              style={{
                ...cardStyle,
                padding: '16px',
                cursor: 'pointer',
                background: selectedType === key ? `${config.color}15` : COLORS.card,
                border: selectedType === key ? `1px solid ${config.color}40` : `1px solid ${COLORS.border}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: `${config.color}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
              }}>
                <Icon style={{ width: '20px', height: '20px', color: config.color }} />
              </div>
              <p style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0 }}>{count}</p>
              <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '4px 0 0 0' }}>{config.label}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
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
            placeholder="Search documents..."
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

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{
            padding: '12px 16px',
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
            minWidth: '200px',
          }}
        >
          <option value="all" style={{ background: COLORS.dark }}>All Projects</option>
          {projects.map((project) => (
            <option key={project} value={project} style={{ background: COLORS.dark }}>
              {project}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '12px',
              background: viewMode === 'list' ? COLORS.accent : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '12px 0 0 12px',
              color: viewMode === 'list' ? COLORS.dark : 'white',
              cursor: 'pointer',
            }}
          >
            <List style={{ width: '18px', height: '18px' }} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '12px',
              background: viewMode === 'grid' ? COLORS.accent : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '0 12px 12px 0',
              color: viewMode === 'grid' ? COLORS.dark : 'white',
              cursor: 'pointer',
            }}
          >
            <Grid style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>

      {/* Documents */}
      {viewMode === 'list' ? (
        <div style={cardStyle}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 140px 140px 100px 80px 100px',
            gap: '16px',
            padding: '14px 20px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: `1px solid ${COLORS.border}`,
          }}>
            <div />
            <span style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
              Document
            </span>
            <span style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
              Type
            </span>
            <span style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
              Project
            </span>
            <span style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
              Status
            </span>
            <span style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
              Size
            </span>
            <span style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', textAlign: 'right' }}>
              Actions
            </span>
          </div>

          {/* Table Body */}
          {filteredDocuments.map((doc, index) => {
            const typeConfig = DOCUMENT_TYPES[doc.type]
            const TypeIcon = typeConfig.icon
            const fileIcon = getFileIcon(doc.fileType)
            const FileIcon = fileIcon.icon
            const statusConfig = STATUS_CONFIG[doc.status]

            return (
              <div
                key={doc.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 140px 140px 100px 80px 100px',
                  gap: '16px',
                  padding: '16px 20px',
                  alignItems: 'center',
                  borderBottom: index < filteredDocuments.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <button
                  onClick={() => toggleStar(doc.id)}
                  style={{
                    padding: '8px',
                    background: 'none',
                    border: 'none',
                    color: doc.isStarred ? '#f59e0b' : COLORS.textMuted,
                    cursor: 'pointer',
                  }}
                >
                  <Star style={{
                    width: '16px',
                    height: '16px',
                    fill: doc.isStarred ? '#f59e0b' : 'transparent',
                  }} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${fileIcon.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FileIcon style={{ width: '20px', height: '20px', color: fileIcon.color }} />
                  </div>
                  <div>
                    <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                      {doc.name}
                    </p>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '2px 0 0 0' }}>
                      {formatDate(doc.uploadedAt)} • {doc.uploadedBy}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TypeIcon style={{ width: '14px', height: '14px', color: typeConfig.color }} />
                  <span style={{ color: 'white', fontSize: '13px' }}>{typeConfig.label}</span>
                </div>

                <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                  {doc.project}
                </span>

                <span style={{
                  padding: '4px 10px',
                  background: `${statusConfig.color}15`,
                  color: statusConfig.color,
                  fontSize: '11px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                }}>
                  {statusConfig.label}
                </span>

                <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                  {doc.size}
                </span>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    style={{
                      padding: '8px',
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
                    }}
                    title="Preview"
                  >
                    <Eye style={{ width: '16px', height: '16px' }} />
                  </button>
                  <button
                    style={{
                      padding: '8px',
                      background: COLORS.accent,
                      border: 'none',
                      borderRadius: '8px',
                      color: COLORS.dark,
                      cursor: 'pointer',
                    }}
                    title="Download"
                  >
                    <Download style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            )
          })}

          {filteredDocuments.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <FileBox style={{ width: '48px', height: '48px', color: COLORS.textMuted, margin: '0 auto 16px' }} />
              <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
                No documents found
              </h3>
              <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: 0 }}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      ) : (
        // Grid View
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}>
          {filteredDocuments.map((doc) => {
            const typeConfig = DOCUMENT_TYPES[doc.type]
            const TypeIcon = typeConfig.icon
            const fileIcon = getFileIcon(doc.fileType)
            const FileIcon = fileIcon.icon
            const statusConfig = STATUS_CONFIG[doc.status]

            return (
              <div key={doc.id} style={cardStyle}>
                <div style={{
                  height: '120px',
                  background: `linear-gradient(135deg, ${typeConfig.color}15 0%, ${typeConfig.color}05 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <FileIcon style={{ width: '48px', height: '48px', color: fileIcon.color }} />
                  <button
                    onClick={() => toggleStar(doc.id)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '6px',
                      background: 'rgba(0,0,0,0.3)',
                      border: 'none',
                      borderRadius: '6px',
                      color: doc.isStarred ? '#f59e0b' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <Star style={{
                      width: '14px',
                      height: '14px',
                      fill: doc.isStarred ? '#f59e0b' : 'transparent',
                    }} />
                  </button>
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    padding: '4px 8px',
                    background: `${typeConfig.color}20`,
                    color: typeConfig.color,
                    fontSize: '10px',
                    fontWeight: '600',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}>
                    {doc.fileType}
                  </span>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <TypeIcon style={{ width: '14px', height: '14px', color: typeConfig.color }} />
                    <span style={{ color: typeConfig.color, fontSize: '11px', fontWeight: '500' }}>
                      {typeConfig.label}
                    </span>
                  </div>
                  <h3 style={{
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    margin: '0 0 8px 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {doc.name}
                  </h3>
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '0 0 12px 0' }}>
                    {doc.project}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      background: `${statusConfig.color}15`,
                      color: statusConfig.color,
                      fontSize: '10px',
                      fontWeight: '500',
                      borderRadius: '4px',
                    }}>
                      {statusConfig.label}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        style={{
                          padding: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        <Eye style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        style={{
                          padding: '6px',
                          background: COLORS.accent,
                          border: 'none',
                          borderRadius: '6px',
                          color: COLORS.dark,
                          cursor: 'pointer',
                        }}
                      >
                        <Download style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Warranty Expiry Notice */}
      {documents.filter(d => d.type === 'warranty' && d.expiryDate).length > 0 && (
        <div style={{
          ...cardStyle,
          marginTop: '24px',
          padding: '20px 24px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
            <div>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                Active Warranties
              </h3>
              <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
                You have {documents.filter(d => d.type === 'warranty' && d.status === 'active').length} active warranty documents.
                Keep them safe for future claims.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Documents
