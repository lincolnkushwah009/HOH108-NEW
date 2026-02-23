import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Filter, X, User, Calendar, IndianRupee,
  GripVertical, ChevronRight, Eye, FolderKanban,
  RefreshCw, ArrowRight, MapPin, Clock, AlertCircle,
  Users, ExternalLink, Briefcase
} from 'lucide-react'
import { projectsAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { useCompany } from '../../context/CompanyContext'
import ProjectKanbanDetailModal from '../../components/projects/ProjectKanbanDetailModal'

// ── Default stages fallback ──
const DEFAULT_STAGES = [
  { code: 'initiation', label: 'Initiation', color: '#3B82F6', order: 1 },
  { code: 'design', label: 'Design', color: '#8B5CF6', order: 2 },
  { code: 'approval', label: 'Approval', color: '#F59E0B', order: 3 },
  { code: 'procurement', label: 'Procurement', color: '#EC4899', order: 4 },
  { code: 'execution', label: 'Execution', color: '#6366F1', order: 5 },
  { code: 'qc_snag', label: 'QC & Snag', color: '#14B8A6', order: 6 },
  { code: 'handover', label: 'Handover', color: '#84CC16', order: 7 },
  { code: 'closure', label: 'Closure', color: '#22C55E', order: 8, isFinal: true },
]

const STATUS_CONFIG = {
  active: { label: 'Active', bg: '#D1FAE5', color: '#065F46' },
  draft: { label: 'Draft', bg: '#F3F4F6', color: '#374151' },
  on_hold: { label: 'On Hold', bg: '#FEF3C7', color: '#92400E' },
  completed: { label: 'Completed', bg: '#DBEAFE', color: '#1E40AF' },
  cancelled: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B' },
}

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#6B7280', dot: '#9CA3AF' },
  medium: { label: 'Medium', color: '#D97706', dot: '#F59E0B' },
  high: { label: 'High', color: '#DC2626', dot: '#EF4444' },
  urgent: { label: 'Urgent', color: '#7C2D12', dot: '#DC2626' },
}

// ── Helpers ──
const formatCurrency = (amount) => {
  if (!amount) return '-'
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
  return amount.toLocaleString('en-IN')
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

const getTimeAgo = (date) => {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const hexToRGBA = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ══════════════════════════════════════════════════════════════════
// PROJECT CARD (Draggable)
// ══════════════════════════════════════════════════════════════════
const ProjectCard = ({ project, onDragStart, onDragEnd, isDragging, onClick, onOpenDetail, stageColor }) => {
  const priority = PRIORITY_CONFIG[project.priority] || PRIORITY_CONFIG.medium
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.active
  const completionPct = project.completion?.completionPercentage || 0
  const customerName = project.customer?.name || project.customer || ''
  const managerName = project.projectManager?.name || ''
  const teamCount = project.teamMembers?.length || 0
  const quoted = project.financials?.quotedAmount || 0
  const paid = project.financials?.totalPaid || 0

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, project)}
      onDragEnd={onDragEnd}
      onClick={() => onOpenDetail(project)}
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: `1px solid ${isDragging ? stageColor : '#E5E7EB'}`,
        padding: '14px 16px',
        cursor: 'grab',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
        boxShadow: isDragging
          ? `0 12px 28px ${hexToRGBA(stageColor, 0.25)}`
          : '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseOver={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.borderColor = stageColor
        }
      }}
      onMouseOut={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.borderColor = '#E5E7EB'
        }
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: `linear-gradient(90deg, ${stageColor}, ${hexToRGBA(stageColor, 0.3)})`,
        borderRadius: '12px 12px 0 0',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            margin: 0, fontSize: '13px', fontWeight: '700', color: '#111827',
            lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>{project.title}</h4>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9CA3AF', fontWeight: '500' }}>
            {project.projectId || 'No ID'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: priority.dot }} title={priority.label} />
          <span style={{
            padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600',
            backgroundColor: statusCfg.bg, color: statusCfg.color,
          }}>{statusCfg.label}</span>
        </div>
      </div>

      {/* Customer */}
      {customerName && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
          <User size={12} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          <span style={{
            fontSize: '12px', color: '#6B7280', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{typeof customerName === 'object' ? customerName.name : customerName}</span>
          {project.customer?.customerId && (
            <span style={{ fontSize: '10px', color: '#D1D5DB' }}>({project.customer.customerId})</span>
          )}
        </div>
      )}

      {/* Manager & Team */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        {managerName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
            <Briefcase size={11} style={{ color: '#8B5CF6', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {managerName}
            </span>
          </div>
        )}
        {teamCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            <Users size={11} style={{ color: '#9CA3AF' }} />
            <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '600' }}>{teamCount}</span>
          </div>
        )}
      </div>

      {/* Info Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        {project.location?.city && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={11} style={{ color: '#9CA3AF' }} />
            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{project.location.city}</span>
          </div>
        )}
        {project.financials?.finalAmount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <IndianRupee size={11} style={{ color: '#059669' }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#059669' }}>
              {formatCurrency(project.financials.finalAmount)}
            </span>
          </div>
        )}
      </div>

      {/* Quoted vs Paid mini-bar */}
      {(quoted > 0 || paid > 0) && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '600' }}>Quoted vs Paid</span>
            <span style={{ fontSize: '10px', color: '#059669', fontWeight: '600' }}>
              {quoted > 0 ? `${Math.round((paid / quoted) * 100)}%` : '-'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '3px', fontSize: '10px', color: '#6B7280' }}>
            <span>Q: {formatCurrency(quoted)}</span>
            <span style={{ color: '#D1D5DB' }}>|</span>
            <span style={{ color: '#059669' }}>P: {formatCurrency(paid)}</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {completionPct > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '600' }}>Progress</span>
            <span style={{ fontSize: '10px', color: stageColor, fontWeight: '700' }}>{completionPct}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', backgroundColor: '#F3F4F6', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${completionPct}%`, height: '100%',
              background: `linear-gradient(90deg, ${stageColor}, ${hexToRGBA(stageColor, 0.7)})`,
              borderRadius: '2px', transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {project.timeline?.estimatedEndDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={11} style={{ color: '#9CA3AF' }} />
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{formatDate(project.timeline.estimatedEndDate)}</span>
            </div>
          )}
          <span style={{ fontSize: '10px', color: '#D1D5DB' }}>{getTimeAgo(project.lastActivityAt || project.updatedAt)}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(project) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px',
            backgroundColor: '#F3F4F6', border: 'none', borderRadius: '6px',
            fontSize: '10px', fontWeight: '600', color: '#6B7280', cursor: 'pointer',
          }}
          title="Open full detail page"
        >
          <ExternalLink size={10} /> Detail
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// KANBAN COLUMN
// ══════════════════════════════════════════════════════════════════
const KanbanColumn = ({
  stage, projects, onDragStart, onDragEnd, onDrop,
  dragOverStage, draggedProject, onCardClick, onOpenDetail, isUpdating
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const isCurrentDragTarget = dragOverStage === stage.code
  const projectCount = projects.length

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    // Only trigger if leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    onDrop(e, stage.code)
  }

  const showDropIndicator = isDragOver && draggedProject && draggedProject.stage !== stage.code

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flex: '0 0 300px',
        minWidth: '300px',
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        backgroundColor: showDropIndicator ? hexToRGBA(stage.color, 0.04) : '#F8FAFC',
        border: `2px ${showDropIndicator ? 'dashed' : 'solid'} ${showDropIndicator ? stage.color : 'transparent'}`,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: 'calc(100vh - 240px)',
      }}
    >
      {/* Column Header */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: `2px solid ${stage.color}`,
        position: 'sticky', top: 0, zIndex: 1,
        backgroundColor: showDropIndicator ? hexToRGBA(stage.color, 0.04) : '#F8FAFC',
        borderRadius: '16px 16px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              backgroundColor: stage.color,
              boxShadow: `0 0 0 3px ${hexToRGBA(stage.color, 0.2)}`,
            }} />
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1F2937' }}>
              {stage.label}
            </h3>
          </div>
          <span style={{
            padding: '2px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '700',
            backgroundColor: hexToRGBA(stage.color, 0.12), color: stage.color,
          }}>
            {projectCount}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div style={{
        flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px',
        overflowY: 'auto', minHeight: '80px',
      }}>
        {isUpdating && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px',
            backgroundColor: hexToRGBA(stage.color, 0.08), borderRadius: '8px',
          }}>
            <RefreshCw size={14} style={{ color: stage.color, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '12px', color: stage.color, fontWeight: '600', marginLeft: '6px' }}>Updating...</span>
          </div>
        )}

        {showDropIndicator && (
          <div style={{
            padding: '16px', borderRadius: '10px',
            border: `2px dashed ${stage.color}`,
            backgroundColor: hexToRGBA(stage.color, 0.06),
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s',
          }}>
            <ArrowRight size={16} style={{ color: stage.color }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: stage.color }}>
              Drop here to move to {stage.label}
            </span>
          </div>
        )}

        {projects.map(project => (
          <ProjectCard
            key={project._id}
            project={project}
            stageColor={stage.color}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggedProject?._id === project._id}
            onClick={onCardClick}
            onOpenDetail={onOpenDetail}
          />
        ))}

        {projects.length === 0 && !showDropIndicator && (
          <div style={{
            padding: '28px 16px', textAlign: 'center', color: '#D1D5DB',
            borderRadius: '10px', border: '1px dashed #E5E7EB',
          }}>
            <FolderKanban size={28} style={{ marginBottom: '6px', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '12px', fontWeight: '500' }}>No projects</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MOVE CONFIRMATION TOAST
// ══════════════════════════════════════════════════════════════════
const MoveToast = ({ show, projectTitle, fromStage, toStage, onUndo, stageColor }) => {
  if (!show) return null
  return (
    <div style={{
      position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: '#1F2937', color: '#fff', padding: '14px 24px',
      borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: '14px', zIndex: 2000,
      animation: 'slideUp 0.3s ease-out',
      maxWidth: '90vw',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        backgroundColor: hexToRGBA(stageColor || '#3B82F6', 0.2),
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <ArrowRight size={16} style={{ color: stageColor || '#3B82F6' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {projectTitle}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9CA3AF' }}>
          Moved from <strong style={{ color: '#fff' }}>{fromStage}</strong> to <strong style={{ color: stageColor || '#fff' }}>{toStage}</strong>
        </p>
      </div>
      {onUndo && (
        <button onClick={onUndo} style={{
          padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff',
          border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}>Undo</button>
      )}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// FULL KANBAN BOARD (self-contained: own data, filters, modal)
// Used inside ProjectsList Kanban tab
// ══════════════════════════════════════════════════════════════════
export const KanbanBoardFull = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeCompany } = useCompany()
  const boardRef = useRef(null)

  const [projects, setProjects] = useState([])
  const [stages, setStages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  // Drag state
  const [draggedProject, setDraggedProject] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [updatingProjectId, setUpdatingProjectId] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  // Detail modal state
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Load stages from company config
  useEffect(() => {
    const companyStages = activeCompany?.projectStages || user?.company?.projectStages
    if (companyStages && companyStages.length > 0) {
      const sorted = [...companyStages].sort((a, b) => (a.order || 0) - (b.order || 0))
      setStages(sorted)
    } else {
      setStages(DEFAULT_STAGES)
    }
  }, [activeCompany, user])

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const params = { limit: 500 }
      if (filterStatus) params.status = filterStatus
      const res = await projectsAPI.getAll(params)
      setProjects(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  // Filter projects
  const filteredProjects = projects.filter(p => {
    if (search) {
      const s = search.toLowerCase()
      const title = (p.title || '').toLowerCase()
      const pid = (p.projectId || '').toLowerCase()
      const cname = (typeof p.customer === 'object' ? p.customer?.name : p.customer || '').toLowerCase()
      if (!title.includes(s) && !pid.includes(s) && !cname.includes(s)) return false
    }
    if (filterPriority && p.priority !== filterPriority) return false
    return true
  })

  // Group by stage
  const projectsByStage = {}
  stages.forEach(s => { projectsByStage[s.code] = [] })
  filteredProjects.forEach(p => {
    const stageCode = p.stage || 'initiation'
    if (projectsByStage[stageCode]) {
      projectsByStage[stageCode].push(p)
    } else {
      // Project has a stage not in the config — put in first column
      if (stages.length > 0) {
        projectsByStage[stages[0].code].push(p)
      }
    }
  })

  // ── Drag handlers ──
  const handleDragStart = (e, project) => {
    setDraggedProject(project)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', project._id)
    // Ghost image
    if (e.target) {
      const ghost = e.target.cloneNode(true)
      ghost.style.width = '280px'
      ghost.style.opacity = '0.85'
      ghost.style.transform = 'rotate(3deg)'
      ghost.style.position = 'absolute'
      ghost.style.top = '-1000px'
      document.body.appendChild(ghost)
      e.dataTransfer.setDragImage(ghost, 140, 40)
      setTimeout(() => document.body.removeChild(ghost), 0)
    }
  }

  const handleDragEnd = () => {
    setDraggedProject(null)
    setDragOverStage(null)
  }

  const handleDrop = async (e, targetStageCode) => {
    e.preventDefault()
    if (!draggedProject) return
    if (draggedProject.stage === targetStageCode) {
      setDraggedProject(null)
      setDragOverStage(null)
      return
    }

    const oldStage = draggedProject.stage
    const targetStage = stages.find(s => s.code === targetStageCode)
    const oldStageObj = stages.find(s => s.code === oldStage)

    // Optimistic update
    setProjects(prev => prev.map(p =>
      p._id === draggedProject._id ? { ...p, stage: targetStageCode } : p
    ))

    setDraggedProject(null)
    setDragOverStage(null)
    setUpdatingProjectId(draggedProject._id)

    // Show toast
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({
      projectTitle: draggedProject.title,
      fromStage: oldStageObj?.label || oldStage,
      toStage: targetStage?.label || targetStageCode,
      stageColor: targetStage?.color || '#3B82F6',
      projectId: draggedProject._id,
      oldStage,
    })
    toastTimer.current = setTimeout(() => setToast(null), 4000)

    // API call
    try {
      await projectsAPI.update(draggedProject._id, { stage: targetStageCode })
    } catch (err) {
      // Rollback
      setProjects(prev => prev.map(p =>
        p._id === draggedProject._id ? { ...p, stage: oldStage } : p
      ))
      setToast(null)
      alert(`Failed to move project: ${err.message}`)
    } finally {
      setUpdatingProjectId(null)
    }
  }

  const handleUndo = async () => {
    if (!toast) return
    const { projectId, oldStage } = toast

    setProjects(prev => prev.map(p =>
      p._id === projectId ? { ...p, stage: oldStage } : p
    ))
    setToast(null)
    setUpdatingProjectId(projectId)

    try {
      await projectsAPI.update(projectId, { stage: oldStage })
    } catch (err) {
      fetchProjects()
    } finally {
      setUpdatingProjectId(null)
    }
  }

  const handleCardClick = (project) => {
    navigate(`/admin/projects/${project._id}`)
  }

  const handleOpenDetail = (project) => {
    setSelectedProjectId(project._id)
    setShowDetailModal(true)
  }

  const handleDetailModalClose = () => {
    setShowDetailModal(false)
    setSelectedProjectId(null)
  }

  const handleDetailModalSave = () => {
    fetchProjects()
  }

  const clearFilters = () => {
    setSearch('')
    setFilterStatus('')
    setFilterPriority('')
  }

  const hasFilters = search || filterStatus || filterPriority
  const totalProjects = filteredProjects.length

  // ── Horizontal scroll with mouse wheel ──
  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const handler = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        board.scrollLeft += e.deltaY
      }
    }
    board.addEventListener('wheel', handler, { passive: false })
    return () => board.removeEventListener('wheel', handler)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .kanban-board-full::-webkit-scrollbar { height: 8px; }
        .kanban-board-full::-webkit-scrollbar-track { background: #F3F4F6; border-radius: 4px; }
        .kanban-board-full::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        .kanban-board-full::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
      `}</style>

      {/* Filters + Refresh */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', alignItems: 'center', flexShrink: 0,
      }}>
        <div style={{ position: 'relative', flex: '0 1 260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #E5E7EB',
              borderRadius: '10px', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              backgroundColor: '#fff',
            }}
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
          padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '10px',
          fontSize: '13px', backgroundColor: '#fff', cursor: 'pointer',
        }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{
          padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: '10px',
          fontSize: '13px', backgroundColor: '#fff', cursor: 'pointer',
        }}>
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '9px 14px',
            backgroundColor: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '10px',
            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          }}><X size={14} /> Clear</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            {totalProjects} project{totalProjects !== 1 ? 's' : ''} across {stages.length} phases
            {hasFilters && ' (filtered)'}
          </span>
          <button onClick={fetchProjects} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px',
            backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
          }}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#9CA3AF' }}>
          <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: 0, fontSize: '14px' }}>Loading projects...</p>
        </div>
      ) : error ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#DC2626' }}>
          <AlertCircle size={32} />
          <p style={{ margin: 0, fontSize: '14px' }}>{error}</p>
          <button onClick={fetchProjects} style={{ padding: '8px 16px', backgroundColor: '#3B82F6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : (
        <div
          ref={boardRef}
          className="kanban-board-full"
          style={{
            flex: 1, display: 'flex', gap: '16px', overflowX: 'auto',
            paddingBottom: '16px', minHeight: 0,
          }}
        >
          {stages.map(stage => (
            <KanbanColumn
              key={stage.code}
              stage={stage}
              projects={projectsByStage[stage.code] || []}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              dragOverStage={dragOverStage}
              draggedProject={draggedProject}
              onCardClick={handleCardClick}
              onOpenDetail={handleOpenDetail}
              isUpdating={updatingProjectId && (projectsByStage[stage.code] || []).some(p => p._id === updatingProjectId)}
            />
          ))}
        </div>
      )}

      {/* Move Toast */}
      <MoveToast
        show={!!toast}
        projectTitle={toast?.projectTitle}
        fromStage={toast?.fromStage}
        toStage={toast?.toStage}
        stageColor={toast?.stageColor}
        onUndo={handleUndo}
      />

      {/* Detail Modal */}
      {showDetailModal && selectedProjectId && (
        <ProjectKanbanDetailModal
          projectId={selectedProjectId}
          onClose={handleDetailModalClose}
          onSave={handleDetailModalSave}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// MAIN KANBAN PAGE (wraps KanbanBoardFull with page header)
// ══════════════════════════════════════════════════════════════════
const ProjectKanban = () => {
  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FolderKanban size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#111827' }}>Project Kanban</h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6B7280' }}>
              Drag and drop projects across phases
            </p>
          </div>
        </div>
      </div>

      <KanbanBoardFull />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// EMBEDDABLE KANBAN BOARD (used inside ProjectsList)
// ══════════════════════════════════════════════════════════════════
export const KanbanBoardEmbed = ({ projects: externalProjects, onRefresh }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { activeCompany } = useCompany()
  const boardRef = useRef(null)

  const [projects, setProjects] = useState(externalProjects || [])
  const [stages, setStages] = useState([])

  // Drag state
  const [draggedProject, setDraggedProject] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)
  const [updatingProjectId, setUpdatingProjectId] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  // Sync with external projects
  useEffect(() => {
    setProjects(externalProjects || [])
  }, [externalProjects])

  // Load stages from company config
  useEffect(() => {
    const companyStages = activeCompany?.projectStages || user?.company?.projectStages
    if (companyStages && companyStages.length > 0) {
      const sorted = [...companyStages].sort((a, b) => (a.order || 0) - (b.order || 0))
      setStages(sorted)
    } else {
      setStages(DEFAULT_STAGES)
    }
  }, [activeCompany, user])

  // Group by stage
  const projectsByStage = {}
  stages.forEach(s => { projectsByStage[s.code] = [] })
  projects.forEach(p => {
    const stageCode = p.stage || 'initiation'
    if (projectsByStage[stageCode]) {
      projectsByStage[stageCode].push(p)
    } else if (stages.length > 0) {
      projectsByStage[stages[0].code].push(p)
    }
  })

  // Drag handlers
  const handleDragStart = (e, project) => {
    setDraggedProject(project)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', project._id)
    if (e.target) {
      const ghost = e.target.cloneNode(true)
      ghost.style.width = '280px'
      ghost.style.opacity = '0.85'
      ghost.style.transform = 'rotate(3deg)'
      ghost.style.position = 'absolute'
      ghost.style.top = '-1000px'
      document.body.appendChild(ghost)
      e.dataTransfer.setDragImage(ghost, 140, 40)
      setTimeout(() => document.body.removeChild(ghost), 0)
    }
  }

  const handleDragEnd = () => {
    setDraggedProject(null)
    setDragOverStage(null)
  }

  const handleDrop = async (e, targetStageCode) => {
    e.preventDefault()
    if (!draggedProject) return
    if (draggedProject.stage === targetStageCode) {
      setDraggedProject(null)
      setDragOverStage(null)
      return
    }

    const oldStage = draggedProject.stage
    const targetStage = stages.find(s => s.code === targetStageCode)
    const oldStageObj = stages.find(s => s.code === oldStage)

    // Optimistic update
    setProjects(prev => prev.map(p =>
      p._id === draggedProject._id ? { ...p, stage: targetStageCode } : p
    ))

    setDraggedProject(null)
    setDragOverStage(null)
    setUpdatingProjectId(draggedProject._id)

    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({
      projectTitle: draggedProject.title,
      fromStage: oldStageObj?.label || oldStage,
      toStage: targetStage?.label || targetStageCode,
      stageColor: targetStage?.color || '#3B82F6',
      projectId: draggedProject._id,
      oldStage,
    })
    toastTimer.current = setTimeout(() => setToast(null), 4000)

    try {
      await projectsAPI.update(draggedProject._id, { stage: targetStageCode })
      onRefresh?.()
    } catch (err) {
      setProjects(prev => prev.map(p =>
        p._id === draggedProject._id ? { ...p, stage: oldStage } : p
      ))
      setToast(null)
      alert(`Failed to move project: ${err.message}`)
    } finally {
      setUpdatingProjectId(null)
    }
  }

  const handleUndo = async () => {
    if (!toast) return
    const { projectId, oldStage } = toast
    setProjects(prev => prev.map(p =>
      p._id === projectId ? { ...p, stage: oldStage } : p
    ))
    setToast(null)
    setUpdatingProjectId(projectId)
    try {
      await projectsAPI.update(projectId, { stage: oldStage })
      onRefresh?.()
    } catch (err) {
      onRefresh?.()
    } finally {
      setUpdatingProjectId(null)
    }
  }

  const handleCardClick = (project) => {
    navigate(`/admin/projects/${project._id}`)
  }

  // Detail modal state
  const [embedSelectedProjectId, setEmbedSelectedProjectId] = useState(null)
  const [embedShowDetailModal, setEmbedShowDetailModal] = useState(false)

  const handleOpenDetail = (project) => {
    setEmbedSelectedProjectId(project._id)
    setEmbedShowDetailModal(true)
  }

  // Horizontal scroll with mouse wheel
  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const handler = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        board.scrollLeft += e.deltaY
      }
    }
    board.addEventListener('wheel', handler, { passive: false })
    return () => board.removeEventListener('wheel', handler)
  }, [])

  if (stages.length === 0) return null

  return (
    <div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .kanban-board-embed::-webkit-scrollbar { height: 8px; }
        .kanban-board-embed::-webkit-scrollbar-track { background: #F3F4F6; border-radius: 4px; }
        .kanban-board-embed::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
        .kanban-board-embed::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }
      `}</style>

      <div
        ref={boardRef}
        className="kanban-board-embed"
        style={{
          display: 'flex', gap: '16px', overflowX: 'auto',
          paddingBottom: '16px', minHeight: '400px',
        }}
      >
        {stages.map(stage => (
          <KanbanColumn
            key={stage.code}
            stage={stage}
            projects={projectsByStage[stage.code] || []}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            dragOverStage={dragOverStage}
            draggedProject={draggedProject}
            onCardClick={handleCardClick}
            onOpenDetail={handleOpenDetail}
            isUpdating={updatingProjectId && (projectsByStage[stage.code] || []).some(p => p._id === updatingProjectId)}
          />
        ))}
      </div>

      <MoveToast
        show={!!toast}
        projectTitle={toast?.projectTitle}
        fromStage={toast?.fromStage}
        toStage={toast?.toStage}
        stageColor={toast?.stageColor}
        onUndo={handleUndo}
      />

      {/* Detail Modal */}
      {embedShowDetailModal && embedSelectedProjectId && (
        <ProjectKanbanDetailModal
          projectId={embedSelectedProjectId}
          onClose={() => { setEmbedShowDetailModal(false); setEmbedSelectedProjectId(null) }}
          onSave={() => onRefresh?.()}
        />
      )}
    </div>
  )
}

export default ProjectKanban
