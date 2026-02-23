import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  MoreVertical,
  Eye,
  FileText,
  MessageSquare,
} from 'lucide-react'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textMuted: 'rgba(255,255,255,0.6)',
}

const Projects = () => {
  const [viewMode, setViewMode] = useState('grid')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const projects = [
    {
      id: 1,
      name: '3BHK Interior - Whitefield',
      type: 'Interior Design',
      status: 'In Progress',
      progress: 65,
      phase: 'Execution',
      startDate: '15 Nov 2025',
      expectedCompletion: '28 Feb 2026',
      location: 'Whitefield, Bangalore',
      budget: '18,50,000',
      spent: '12,02,500',
      image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop',
      manager: 'Rahul Sharma',
      lastUpdate: '2 hours ago',
    },
    {
      id: 2,
      name: 'Villa Renovation - HSR Layout',
      type: 'Renovation',
      status: 'Design Phase',
      progress: 30,
      phase: 'Design Approval',
      startDate: '1 Dec 2025',
      expectedCompletion: '30 Apr 2026',
      location: 'HSR Layout, Bangalore',
      budget: '45,00,000',
      spent: '13,50,000',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
      manager: 'Priya Menon',
      lastUpdate: '1 day ago',
    },
    {
      id: 3,
      name: 'Office Space - Koramangala',
      type: 'Commercial Interior',
      status: 'Completed',
      progress: 100,
      phase: 'Handover',
      startDate: '1 Aug 2025',
      expectedCompletion: '30 Nov 2025',
      location: 'Koramangala, Bangalore',
      budget: '32,00,000',
      spent: '31,50,000',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
      manager: 'Amit Verma',
      lastUpdate: '1 month ago',
    },
    {
      id: 4,
      name: '2BHK Apartment - Electronic City',
      type: 'Interior Design',
      status: 'On Hold',
      progress: 45,
      phase: 'Procurement',
      startDate: '20 Oct 2025',
      expectedCompletion: 'TBD',
      location: 'Electronic City, Bangalore',
      budget: '12,00,000',
      spent: '5,40,000',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
      manager: 'Sneha Reddy',
      lastUpdate: '3 days ago',
    },
  ]

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'in progress': return '#6366f1'
      case 'design phase': return '#8b5cf6'
      case 'completed': return '#10b981'
      case 'on hold': return '#f59e0b'
      default: return COLORS.accent
    }
  }

  const filteredProjects = projects.filter(p => {
    if (filterStatus !== 'all' && p.status.toLowerCase() !== filterStatus) return false
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
          My Projects
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: '15px' }}>
          Track and manage all your ongoing and completed projects.
        </p>
      </div>

      {/* Filters & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '18px',
            height: '18px',
            color: 'rgba(255,255,255,0.4)',
          }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              background: COLORS.card,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = COLORS.accent}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '12px 16px',
              background: COLORS.card,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Status</option>
            <option value="in progress">In Progress</option>
            <option value="design phase">Design Phase</option>
            <option value="completed">Completed</option>
            <option value="on hold">On Hold</option>
          </select>

          {/* View Toggle */}
          <div style={{
            display: 'flex',
            background: COLORS.card,
            borderRadius: '10px',
            padding: '4px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 12px',
                background: viewMode === 'grid' ? COLORS.accent : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: viewMode === 'grid' ? COLORS.dark : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Grid style={{ width: '18px', height: '18px' }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 12px',
                background: viewMode === 'list' ? COLORS.accent : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: viewMode === 'list' ? COLORS.dark : 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <List style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }} className="project-stats">
        {[
          { label: 'Total Projects', value: projects.length, color: COLORS.accent },
          { label: 'In Progress', value: projects.filter(p => p.status === 'In Progress').length, color: '#6366f1' },
          { label: 'Completed', value: projects.filter(p => p.status === 'Completed').length, color: '#10b981' },
          { label: 'On Hold', value: projects.filter(p => p.status === 'On Hold').length, color: '#f59e0b' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: COLORS.card,
              borderRadius: '12px',
              padding: '16px 20px',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: COLORS.textMuted, fontSize: '14px' }}>{stat.label}</span>
            <span style={{ color: stat.color, fontSize: '24px', fontWeight: '700' }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Projects Grid/List */}
      {viewMode === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px',
        }}>
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/dashboard/projects/${project.id}`}
              style={{
                background: COLORS.card,
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'
                e.currentTarget.style.borderColor = `${COLORS.accent}30`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', height: '180px' }}>
                <img
                  src={project.image}
                  alt={project.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: `${getStatusColor(project.status)}`,
                  color: 'white',
                }}>
                  {project.status}
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '60px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                }} />
              </div>

              {/* Content */}
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: COLORS.accent, fontSize: '12px', fontWeight: '500' }}>{project.type}</span>
                  <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginTop: '4px' }}>{project.name}</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin style={{ width: '14px', height: '14px', color: COLORS.textMuted }} />
                    <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>{project.location.split(',')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar style={{ width: '14px', height: '14px', color: COLORS.textMuted }} />
                    <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>{project.expectedCompletion}</span>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>Progress</span>
                    <span style={{ color: COLORS.accent, fontSize: '13px', fontWeight: '600' }}>{project.progress}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${project.progress}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${getStatusColor(project.status)}, ${getStatusColor(project.status)}aa)`,
                      borderRadius: '3px',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {/* Budget */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                }}>
                  <div>
                    <p style={{ color: COLORS.textMuted, fontSize: '11px', marginBottom: '2px' }}>Budget</p>
                    <p style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Rs. {project.budget}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: COLORS.textMuted, fontSize: '11px', marginBottom: '2px' }}>Spent</p>
                    <p style={{ color: COLORS.accent, fontSize: '14px', fontWeight: '600' }}>Rs. {project.spent}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div style={{
          background: COLORS.card,
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
        }}>
          {filteredProjects.map((project, index) => (
            <Link
              key={project.id}
              to={`/dashboard/projects/${project.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px 24px',
                borderBottom: index < filteredProjects.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <img
                src={project.image}
                alt={project.name}
                style={{ width: '80px', height: '60px', borderRadius: '10px', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>{project.name}</h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    background: `${getStatusColor(project.status)}20`,
                    color: getStatusColor(project.status),
                  }}>
                    {project.status}
                  </span>
                </div>
                <p style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                  {project.type} | {project.location}
                </p>
              </div>
              <div style={{ width: '150px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>Progress</span>
                  <span style={{ color: COLORS.accent, fontSize: '12px', fontWeight: '600' }}>{project.progress}%</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${project.progress}%`,
                    height: '100%',
                    background: getStatusColor(project.status),
                    borderRadius: '2px',
                  }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: '120px' }}>
                <p style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Rs. {project.budget}</p>
                <p style={{ color: COLORS.textMuted, fontSize: '12px' }}>Budget</p>
              </div>
              <ChevronRight style={{ width: '20px', height: '20px', color: COLORS.textMuted }} />
            </Link>
          ))}
        </div>
      )}

      {/* Responsive Styles */}
      <style>{`
        .project-stats {
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 1024px) {
          .project-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .project-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default Projects
