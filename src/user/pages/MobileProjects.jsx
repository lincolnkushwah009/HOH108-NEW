import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Calendar,
  IndianRupee,
  User,
  Phone,
  MoreVertical,
} from 'lucide-react'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.08)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
}

const STATUS_CONFIG = {
  in_progress: { color: COLORS.info, bg: `${COLORS.info}15`, label: 'In Progress' },
  design: { color: COLORS.purple, bg: `${COLORS.purple}15`, label: 'Design Phase' },
  completed: { color: COLORS.success, bg: `${COLORS.success}15`, label: 'Completed' },
  on_hold: { color: COLORS.warning, bg: `${COLORS.warning}15`, label: 'On Hold' },
}

const mockProjects = [
  {
    id: 1,
    name: 'Living Room Renovation',
    type: 'Residential',
    status: 'in_progress',
    progress: 65,
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400',
    location: 'Indiranagar, Bangalore',
    startDate: '2024-01-01',
    estimatedEnd: '2024-02-15',
    budget: 485000,
    spent: 315000,
    designer: { name: 'Priya Sharma', phone: '+91 98765 43210' },
    nextMilestone: 'Furniture Installation',
    daysLeft: 12,
  },
  {
    id: 2,
    name: 'Master Bedroom Design',
    type: 'Residential',
    status: 'design',
    progress: 30,
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400',
    location: 'Koramangala, Bangalore',
    startDate: '2024-01-10',
    estimatedEnd: '2024-03-01',
    budget: 325000,
    spent: 50000,
    designer: { name: 'Rahul Verma', phone: '+91 98765 43211' },
    nextMilestone: 'Design Approval',
    daysLeft: 5,
  },
  {
    id: 3,
    name: 'Office Interior',
    type: 'Commercial',
    status: 'on_hold',
    progress: 45,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
    location: 'MG Road, Bangalore',
    startDate: '2023-12-15',
    estimatedEnd: '2024-02-28',
    budget: 890000,
    spent: 400000,
    designer: { name: 'Priya Sharma', phone: '+91 98765 43210' },
    nextMilestone: 'Client Review',
    daysLeft: null,
  },
]

const MobileProjects = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedProject, setExpandedProject] = useState(null)

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'in_progress', label: 'Active' },
    { id: 'design', label: 'Design' },
    { id: 'completed', label: 'Done' },
  ]

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = activeFilter === 'all' || project.status === activeFilter
    return matchesSearch && matchesFilter
  })

  const formatCurrency = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    }
    return `₹${(amount / 1000).toFixed(0)}K`
  }

  const cardStyle = {
    background: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  }

  return (
    <div>
      {/* Search Bar */}
      <div style={{
        position: 'relative',
        marginBottom: '16px',
      }}>
        <Search style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '20px',
          height: '20px',
          color: COLORS.textMuted,
        }} />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px 14px 48px',
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '14px',
            color: COLORS.textPrimary,
            fontSize: '15px',
            outline: 'none',
          }}
        />
      </div>

      {/* Filter Pills */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        margin: '0 -16px 20px -16px',
        padding: '0 16px',
      }}>
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            style={{
              padding: '10px 18px',
              background: activeFilter === filter.id ? COLORS.accent : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '20px',
              color: activeFilter === filter.id ? COLORS.dark : COLORS.textPrimary,
              fontSize: '14px',
              fontWeight: activeFilter === filter.id ? '600' : '400',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Projects List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredProjects.map((project) => {
          const statusConfig = STATUS_CONFIG[project.status]
          const isExpanded = expandedProject === project.id

          return (
            <div key={project.id} style={cardStyle}>
              {/* Project Image & Status */}
              <div style={{
                height: '140px',
                background: `url(${project.image}) center/cover`,
                position: 'relative',
              }}>
                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  padding: '6px 12px',
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: statusConfig.color,
                  }} />
                  <span style={{ color: COLORS.textPrimary, fontSize: '12px', fontWeight: '500' }}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Days Left */}
                {project.daysLeft && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '6px 10px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <Clock style={{ width: '12px', height: '12px', color: COLORS.warning }} />
                    <span style={{ color: COLORS.textPrimary, fontSize: '11px', fontWeight: '500' }}>
                      {project.daysLeft}d left
                    </span>
                  </div>
                )}

                {/* Progress Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '6px',
                  background: 'rgba(0,0,0,0.3)',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${project.progress}%`,
                    background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
                  }} />
                </div>
              </div>

              {/* Project Info */}
              <div style={{ padding: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <div>
                    <h3 style={{ color: COLORS.textPrimary, fontSize: '17px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      {project.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin style={{ width: '13px', height: '13px', color: COLORS.textMuted }} />
                      <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                        {project.location}
                      </span>
                    </div>
                  </div>
                  <span style={{ color: COLORS.accent, fontSize: '16px', fontWeight: '700' }}>
                    {project.progress}%
                  </span>
                </div>

                {/* Budget Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  marginBottom: '12px',
                }}>
                  <div>
                    <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '0 0 2px 0' }}>Budget</p>
                    <p style={{ color: COLORS.textPrimary, fontSize: '15px', fontWeight: '600', margin: 0 }}>
                      {formatCurrency(project.budget)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '0 0 2px 0' }}>Spent</p>
                    <p style={{ color: COLORS.warning, fontSize: '15px', fontWeight: '600', margin: 0 }}>
                      {formatCurrency(project.spent)}
                    </p>
                  </div>
                </div>

                {/* Next Milestone */}
                <div
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: `${COLORS.info}10`,
                    borderRadius: '10px',
                    marginBottom: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle style={{ width: '18px', height: '18px', color: COLORS.info }} />
                    <div>
                      <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '0 0 2px 0' }}>Next Milestone</p>
                      <p style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '500', margin: 0 }}>
                        {project.nextMilestone}
                      </p>
                    </div>
                  </div>
                  <ChevronRight style={{ width: '18px', height: '18px', color: COLORS.textMuted }} />
                </div>

                {/* View Project Lifecycle Button */}
                <button
                  onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: COLORS.accent,
                    border: 'none',
                    borderRadius: '12px',
                    color: COLORS.dark,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  View Project Lifecycle
                  <ChevronRight style={{ width: '18px', height: '18px' }} />
                </button>

                {/* Designer Info */}
                <button
                  onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: `${COLORS.accent}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <User style={{ width: '18px', height: '18px', color: COLORS.accent }} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '500', margin: 0 }}>
                        {project.designer.name}
                      </p>
                      <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>
                        Designer
                      </p>
                    </div>
                  </div>
                  <a
                    href={`tel:${project.designer.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: COLORS.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Phone style={{ width: '18px', height: '18px', color: COLORS.dark }} />
                  </a>
                </button>
              </div>
            </div>
          )
        })}

        {filteredProjects.length === 0 && (
          <div style={{
            ...cardStyle,
            padding: '48px 24px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Search style={{ width: '28px', height: '28px', color: COLORS.textMuted }} />
            </div>
            <h3 style={{ color: COLORS.textPrimary, fontSize: '17px', fontWeight: '600', margin: '0 0 8px 0' }}>
              No projects found
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: 0 }}>
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileProjects
