import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle2, AlertCircle, Layers, GanttChart, GripVertical, ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { projectsAPI } from '../../utils/api'

const ProjectGantt = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [singleProject, setSingleProject] = useState(null)
  const [viewMode, setViewMode] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterStatus, setFilterStatus] = useState('')
  const chartRef = useRef(null)

  const isSingleProjectView = !!id

  useEffect(() => {
    if (isSingleProjectView) {
      loadSingleProject()
    } else {
      loadProjects()
    }
  }, [id, filterStatus])

  const loadSingleProject = async () => {
    setLoading(true)
    try {
      const response = await projectsAPI.getOne(id)
      const project = response.data

      const ganttProject = {
        _id: project._id,
        projectName: project.title,
        projectCode: project.projectId,
        customer: project.customer?.name || 'N/A',
        status: project.status || 'InProgress',
        progress: project.progress || 0,
        startDate: project.startDate ? new Date(project.startDate) : new Date(),
        endDate: project.endDate ? new Date(project.endDate) : new Date(),
        color: getStatusColor(project.status),
        tasks: (project.milestones || []).map((m, idx) => ({
          id: m._id || `task-${idx}`,
          name: m.title || m.name,
          start: m.startDate ? new Date(m.startDate) : new Date(),
          end: m.dueDate ? new Date(m.dueDate) : new Date(),
          progress: m.completed ? 100 : 0,
          status: m.completed ? 'Completed' : 'InProgress',
          color: m.completed ? '#22c55e' : '#3b82f6'
        }))
      }

      setSingleProject(project)
      setProjects([ganttProject])
    } catch (err) {
      console.error('Failed to load project:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      planning: '#94a3b8',
      in_progress: '#3b82f6',
      on_hold: '#f59e0b',
      completed: '#22c55e',
      cancelled: '#ef4444',
    }
    return colors[status] || '#3b82f6'
  }

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await projectsAPI.getAll()
      const projectsData = response.data || []

      const ganttProjects = projectsData.map(project => ({
        _id: project._id,
        projectName: project.title,
        projectCode: project.projectId,
        customer: project.customer?.name || 'N/A',
        status: project.status === 'in_progress' ? 'InProgress' :
                project.status === 'completed' ? 'Completed' :
                project.status === 'on_hold' ? 'Delayed' : 'OnTrack',
        progress: project.progress || 0,
        startDate: project.startDate ? new Date(project.startDate) : new Date(),
        endDate: project.endDate ? new Date(project.endDate) : new Date(),
        color: getStatusColor(project.status),
        tasks: (project.milestones || []).map((m, idx) => ({
          id: m._id || `task-${idx}`,
          name: m.title || m.name,
          start: m.startDate ? new Date(m.startDate) : new Date(),
          end: m.dueDate ? new Date(m.dueDate) : new Date(),
          progress: m.completed ? 100 : 0,
          status: m.completed ? 'Completed' : 'InProgress',
          color: m.completed ? '#22c55e' : '#3b82f6'
        }))
      }))

      let filtered = ganttProjects
      if (filterStatus) {
        filtered = ganttProjects.filter(p => p.status === filterStatus)
      }
      setProjects(filtered)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const getDays = () => {
    const days = []
    const start = new Date(currentDate)
    start.setDate(1)
    start.setMonth(start.getMonth() - 1)

    const monthsToShow = viewMode === 'week' ? 3 : viewMode === 'month' ? 6 : 12
    const endDate = new Date(start)
    endDate.setMonth(endDate.getMonth() + monthsToShow)
    endDate.setDate(endDate.getDate() + 1)

    while (start < endDate) {
      days.push(new Date(start))
      start.setDate(start.getDate() + 1)
    }
    return days
  }

  const days = getDays()
  const dayWidth = viewMode === 'week' ? 40 : viewMode === 'month' ? 28 : 14
  const totalWidth = days.length * dayWidth

  const getMonthGroups = () => {
    const groups = []
    let currentMonth = null
    let currentGroup = null

    days.forEach((day, idx) => {
      const monthKey = `${day.getFullYear()}-${day.getMonth()}`
      if (monthKey !== currentMonth) {
        if (currentGroup) groups.push(currentGroup)
        currentGroup = {
          month: day.toLocaleDateString('en-US', { month: 'short' }),
          year: day.getFullYear(),
          startIdx: idx,
          days: 1
        }
        currentMonth = monthKey
      } else {
        currentGroup.days++
      }
    })
    if (currentGroup) groups.push(currentGroup)
    return groups
  }

  const monthGroups = getMonthGroups()

  const getBarStyle = (startDate, endDate, color) => {
    const rangeStart = days[0]
    const startDiff = Math.floor((startDate - rangeStart) / (1000 * 60 * 60 * 24))
    const endDiff = Math.floor((endDate - rangeStart) / (1000 * 60 * 60 * 24))

    if (endDiff < 0 || startDiff > days.length) {
      return { display: 'none' }
    }

    const visibleStart = Math.max(0, startDiff)
    const visibleEnd = Math.min(days.length - 1, endDiff)
    const duration = visibleEnd - visibleStart + 1

    const left = visibleStart * dayWidth
    const width = Math.max(dayWidth, duration * dayWidth)

    return {
      left: `${left}px`,
      width: `${width}px`,
      backgroundColor: color,
    }
  }

  const formatDateRange = (start, end) => {
    const formatDate = (d) => d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') newDate.setMonth(newDate.getMonth() + direction)
    else if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + (direction * 2))
    else newDate.setMonth(newDate.getMonth() + (direction * 3))
    setCurrentDate(newDate)
  }

  const getStatusBadge = (status) => {
    const config = {
      InProgress: { color: '#3B82F6', bg: '#EFF6FF', label: 'In Progress' },
      OnTrack: { color: '#22C55E', bg: '#F0FDF4', label: 'On Track' },
      Delayed: { color: '#EF4444', bg: '#FEF2F2', label: 'Delayed' },
      AtRisk: { color: '#F59E0B', bg: '#FFFBEB', label: 'At Risk' },
      Completed: { color: '#22C55E', bg: '#F0FDF4', label: 'Completed' },
    }
    return config[status] || { color: '#6B7280', bg: '#F3F4F6', label: status }
  }

  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => ['InProgress', 'OnTrack'].includes(p.status)).length,
    delayed: projects.filter(p => ['Delayed', 'AtRisk'].includes(p.status)).length,
    completed: projects.filter(p => p.status === 'Completed').length,
  }

  const isToday = (day) => {
    const today = new Date()
    return day.getDate() === today.getDate() &&
           day.getMonth() === today.getMonth() &&
           day.getFullYear() === today.getFullYear()
  }

  const isWeekend = (day) => day.getDay() === 0 || day.getDay() === 6

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const config = getStatusBadge(status)
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: config.bg,
        color: config.color,
        whiteSpace: 'nowrap'
      }}>
        {config.label}
      </span>
    )
  }

  // Stats Card Component
  const StatsCard = ({ icon: Icon, value, label, gradient }) => (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #E5E7EB'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon style={{ width: '24px', height: '24px', color: '#FFFFFF' }} />
        </div>
        <div>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{value}</p>
          <p style={{ fontSize: '14px', color: '#6B7280', fontWeight: '500', margin: 0 }}>{label}</p>
        </div>
      </div>
    </div>
  )

  // Loading Spinner
  const LoadingSpinner = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0' }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #E5E7EB',
        borderTopColor: '#111111',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh' }}>
      <PageHeader
        title={isSingleProjectView && singleProject ? `${singleProject.title} - Timeline` : "Project Gantt Chart"}
        description={isSingleProjectView && singleProject ? singleProject.projectId : "Visual timeline view of all projects and tasks"}
        breadcrumbs={isSingleProjectView ? [
          { label: 'Dashboard', path: '/admin' },
          { label: 'Projects', path: '/admin/projects' },
          { label: singleProject?.title || 'Project', path: `/admin/projects/${id}` },
          { label: 'Gantt Chart' }
        ] : [
          { label: 'Dashboard', path: '/admin' },
          { label: 'Projects', path: '/admin/projects' },
          { label: 'Gantt Chart' }
        ]}
        actions={isSingleProjectView ? (
          <Link to={`/admin/projects/${id}`} style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer'
            }}>
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              Back to Project
            </button>
          </Link>
        ) : (
          <Link to="/admin/projects" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              cursor: 'pointer'
            }}>
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              Back to Projects
            </button>
          </Link>
        )}
      />

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <StatsCard
          icon={Layers}
          value={stats.total}
          label="Total Projects"
          gradient="linear-gradient(135deg, #111111 0%, #1a3a5c 100%)"
        />
        <StatsCard
          icon={Clock}
          value={stats.inProgress}
          label="In Progress"
          gradient="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
        />
        <StatsCard
          icon={AlertCircle}
          value={stats.delayed}
          label="Delayed"
          gradient="linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
        />
        <StatsCard
          icon={CheckCircle2}
          value={stats.completed}
          label="Completed"
          gradient="linear-gradient(135deg, #22C55E 0%, #16A34A 100%)"
        />
      </div>

      {/* Gantt Chart Card */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        border: '1px solid #E5E7EB',
        overflow: 'hidden'
      }}>
        {/* Toolbar */}
        <div style={{
          borderBottom: '1px solid #E5E7EB',
          padding: '16px 24px',
          backgroundColor: '#F9FAFB'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <button
                  onClick={() => navigateDate(-1)}
                  style={{
                    padding: '10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRight: '1px solid #E5E7EB',
                    borderRadius: '8px 0 0 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronLeft style={{ width: '20px', height: '20px', color: '#4B5563' }} />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    cursor: 'pointer'
                  }}
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate(1)}
                  style={{
                    padding: '10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderLeft: '1px solid #E5E7EB',
                    borderRadius: '0 8px 8px 0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChevronRight style={{ width: '20px', height: '20px', color: '#4B5563' }} />
                </button>
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1F2937',
                margin: 0
              }}>
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  minWidth: '160px'
                }}
              >
                <option value="">All Projects</option>
                <option value="InProgress">In Progress</option>
                <option value="OnTrack">On Track</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>

              <div style={{
                display: 'flex',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                {['week', 'month', 'quarter'].map((mode, idx) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderRight: idx !== 2 ? '1px solid #E5E7EB' : 'none',
                      borderRadius: idx === 0 ? '8px 0 0 8px' : idx === 2 ? '0 8px 8px 0' : '0',
                      backgroundColor: viewMode === mode ? '#111111' : '#FFFFFF',
                      color: viewMode === mode ? '#FFFFFF' : '#4B5563',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : projects.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <GanttChart style={{ width: '40px', height: '40px', color: '#9CA3AF' }} />
            </div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 8px 0'
            }}>No projects found</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
              Adjust your filters to see projects
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }} ref={chartRef}>
            <div style={{ minWidth: `${320 + totalWidth}px` }}>
              {/* Timeline Header */}
              <div style={{
                display: 'flex',
                position: 'sticky',
                top: 0,
                zIndex: 20,
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #E5E7EB'
              }}>
                {/* Left column header */}
                <div style={{
                  width: '320px',
                  minWidth: '320px',
                  flexShrink: 0,
                  borderRight: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB'
                }}>
                  <div style={{
                    height: '48px',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Project / Task</span>
                  </div>
                  <div style={{
                    height: '32px',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(249, 250, 251, 0.5)'
                  }}>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Duration</span>
                  </div>
                </div>

                {/* Month Headers */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    height: '48px',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    {monthGroups.map((group, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRight: '1px solid #E5E7EB',
                          backgroundColor: '#F9FAFB',
                          fontWeight: '600',
                          fontSize: '14px',
                          color: '#374151',
                          width: `${group.days * dayWidth}px`
                        }}
                      >
                        {group.month} {group.year}
                      </div>
                    ))}
                  </div>
                  {/* Day numbers */}
                  <div style={{
                    display: 'flex',
                    height: '32px',
                    backgroundColor: 'rgba(249, 250, 251, 0.5)'
                  }}>
                    {days.map((day, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          borderRight: '1px solid #E5E7EB',
                          width: `${dayWidth}px`,
                          minWidth: `${dayWidth}px`,
                          backgroundColor: isToday(day) ? '#3B82F6' : isWeekend(day) ? '#F3F4F6' : 'transparent',
                          color: isToday(day) ? '#FFFFFF' : isWeekend(day) ? '#9CA3AF' : '#6B7280',
                          fontWeight: isToday(day) ? '700' : '400'
                        }}
                      >
                        {day.getDate()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart Body */}
              <div style={{ position: 'relative' }}>
                {projects.map((project) => (
                  <div key={project._id}>
                    {/* Project Row */}
                    <div style={{
                      display: 'flex',
                      borderBottom: '1px solid #E5E7EB',
                      backgroundColor: 'rgba(249, 250, 251, 0.8)'
                    }}>
                      {/* Project Info */}
                      <div style={{
                        width: '320px',
                        minWidth: '320px',
                        flexShrink: 0,
                        borderRight: '1px solid #E5E7EB',
                        height: '64px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 16px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%'
                        }}>
                          <GripVertical style={{
                            width: '16px',
                            height: '16px',
                            color: '#D1D5DB',
                            flexShrink: 0
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{
                              fontWeight: '600',
                              color: '#111827',
                              fontSize: '14px',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>{project.projectName}</h4>
                            <p style={{
                              fontSize: '12px',
                              color: '#9CA3AF',
                              margin: 0
                            }}>{formatDateRange(project.startDate, project.endDate)}</p>
                          </div>
                          <StatusBadge status={project.status} />
                        </div>
                      </div>

                      {/* Project Bar Area */}
                      <div style={{
                        flex: 1,
                        position: 'relative',
                        height: '64px'
                      }}>
                        {/* Grid background */}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex'
                        }}>
                          {days.map((day, idx) => (
                            <div
                              key={idx}
                              style={{
                                borderRight: '1px solid #F3F4F6',
                                width: `${dayWidth}px`,
                                minWidth: `${dayWidth}px`,
                                backgroundColor: isToday(day) ? 'rgba(219, 234, 254, 0.5)' : isWeekend(day) ? 'rgba(243, 244, 246, 0.5)' : 'transparent'
                              }}
                            />
                          ))}
                        </div>
                        {/* Project Bar */}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          height: '32px',
                          ...getBarStyle(project.startDate, project.endDate, project.color)
                        }}>
                          <div style={{
                            height: '100%',
                            width: '100%',
                            borderRadius: '6px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 12px',
                            position: 'relative',
                            overflow: 'hidden',
                            backgroundColor: project.color
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              right: 0,
                              backgroundColor: 'rgba(0,0,0,0.2)',
                              width: `${100 - project.progress}%`
                            }} />
                            <span style={{
                              color: '#FFFFFF',
                              fontSize: '12px',
                              fontWeight: '600',
                              position: 'relative',
                              zIndex: 10,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {project.projectName} • {project.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task Rows */}
                    {project.tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          display: 'flex',
                          borderBottom: '1px solid #F3F4F6',
                          backgroundColor: '#FFFFFF'
                        }}
                      >
                        {/* Task Info */}
                        <div style={{
                          width: '320px',
                          minWidth: '320px',
                          flexShrink: 0,
                          borderRight: '1px solid #F3F4F6',
                          height: '56px',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 16px 0 40px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%'
                          }}>
                            <div style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              flexShrink: 0,
                              backgroundColor: task.color
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontSize: '14px',
                                color: '#374151',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>{task.name}</p>
                              <p style={{
                                fontSize: '12px',
                                color: '#9CA3AF',
                                margin: 0
                              }}>{formatDateRange(task.start, task.end)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Task Bar Area */}
                        <div style={{
                          flex: 1,
                          position: 'relative',
                          height: '56px'
                        }}>
                          {/* Grid background */}
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex'
                          }}>
                            {days.map((day, idx) => (
                              <div
                                key={idx}
                                style={{
                                  borderRight: '1px solid rgba(243, 244, 246, 0.5)',
                                  width: `${dayWidth}px`,
                                  minWidth: `${dayWidth}px`,
                                  backgroundColor: isToday(day) ? 'rgba(239, 246, 255, 0.3)' : isWeekend(day) ? 'rgba(249, 250, 251, 0.3)' : 'transparent'
                                }}
                              />
                            ))}
                          </div>
                          {/* Task Bar */}
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: '24px',
                            ...getBarStyle(task.start, task.end, task.color)
                          }}>
                            <div style={{
                              height: '100%',
                              width: '100%',
                              borderRadius: '4px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 8px',
                              position: 'relative',
                              overflow: 'hidden',
                              backgroundColor: task.color,
                              cursor: 'pointer'
                            }}>
                              {task.progress < 100 && (
                                <div style={{
                                  position: 'absolute',
                                  top: 0,
                                  bottom: 0,
                                  right: 0,
                                  backgroundColor: 'rgba(0,0,0,0.2)',
                                  width: `${100 - task.progress}%`
                                }} />
                              )}
                              <span style={{
                                color: '#FFFFFF',
                                fontSize: '12px',
                                fontWeight: '500',
                                position: 'relative',
                                zIndex: 10,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {task.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Legend */}
        <div style={{
          borderTop: '1px solid #E5E7EB',
          padding: '16px 24px',
          backgroundColor: '#F9FAFB'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '32px'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>Legend:</span>
            {[
              { color: '#22c55e', label: 'Completed' },
              { color: '#3b82f6', label: 'In Progress' },
              { color: '#f59e0b', label: 'At Risk' },
              { color: '#ef4444', label: 'Delayed' },
              { color: '#94a3b8', label: 'Pending' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  backgroundColor: item.color
                }} />
                <span style={{
                  fontSize: '14px',
                  color: '#4B5563',
                  fontWeight: '500'
                }}>{item.label}</span>
              </div>
            ))}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: 'auto'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                backgroundColor: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: '700'
              }}>T</div>
              <span style={{
                fontSize: '14px',
                color: '#4B5563',
                fontWeight: '500'
              }}>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default ProjectGantt
