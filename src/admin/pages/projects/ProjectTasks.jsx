import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, AlertCircle,
  Play, Pause, User, Building2, Percent, Calendar, MoreVertical,
  ArrowLeft, RefreshCw, Filter, Search
} from 'lucide-react'
import { projectWorkflowAPI, projectsAPI, employeesAPI } from '../../utils/api'

const ProjectTasks = () => {
  const { id: projectId } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [tasksData, setTasksData] = useState(null)
  const [completion, setCompletion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedPhases, setExpandedPhases] = useState({})
  const [expandedActivities, setExpandedActivities] = useState({})
  const [selectedTask, setSelectedTask] = useState(null)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [employees, setEmployees] = useState([])
  const [progressValue, setProgressValue] = useState(0)
  const [progressNotes, setProgressNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectRes, tasksRes, completionRes, employeesRes] = await Promise.all([
        projectsAPI.getOne(projectId),
        projectWorkflowAPI.getProjectTasks(projectId),
        projectWorkflowAPI.getProjectCompletion(projectId),
        employeesAPI.getAll({ limit: 100 })
      ])

      setProject(projectRes.data)
      setTasksData(tasksRes.data)
      setCompletion(completionRes.data)
      setEmployees(employeesRes.data || [])

      // Expand all phases by default
      if (tasksRes.data?.grouped) {
        const phases = {}
        Object.keys(tasksRes.data.grouped).forEach(key => {
          phases[key] = true
        })
        setExpandedPhases(phases)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const initializeTasks = async () => {
    try {
      await projectWorkflowAPI.initializeProject(projectId)
      loadData()
    } catch (err) {
      console.error('Failed to initialize:', err)
      alert(err.message || 'Failed to initialize tasks')
    }
  }

  const handleUpdateProgress = async () => {
    if (!selectedTask) return
    setSaving(true)
    try {
      await projectWorkflowAPI.updateTaskProgress(selectedTask._id, {
        percentage: progressValue,
        notes: progressNotes
      })
      setShowProgressModal(false)
      setSelectedTask(null)
      setProgressValue(0)
      setProgressNotes('')
      loadData()
    } catch (err) {
      console.error('Failed to update progress:', err)
      alert(err.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async (ownerType, ownerId, ownerName) => {
    if (!selectedTask) return
    setSaving(true)
    try {
      const response = await projectWorkflowAPI.assignTaskOwner(selectedTask._id, {
        ownerType,
        ownerId,
        ownerName
      })
      // Update selectedTask with new data to show the newly assigned owner
      setSelectedTask(response.data)
      loadData() // Refresh the list in background
    } catch (err) {
      console.error('Failed to assign:', err)
      alert(err.message || 'Failed to assign')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveOwner = async (ownerType, ownerId) => {
    if (!selectedTask) return
    setSaving(true)
    try {
      const response = await projectWorkflowAPI.removeTaskOwner(selectedTask._id, ownerType, ownerId)
      setSelectedTask(response.data)
      loadData()
    } catch (err) {
      console.error('Failed to remove:', err)
      alert(err.message || 'Failed to remove')
    } finally {
      setSaving(false)
    }
  }

  const openProgressModal = (task) => {
    setSelectedTask(task)
    setProgressValue(task.completionPercentage || 0)
    setProgressNotes('')
    setShowProgressModal(true)
  }

  const openAssignModal = (task) => {
    setSelectedTask(task)
    setShowAssignModal(true)
  }

  const togglePhase = (phaseCode) => {
    setExpandedPhases(prev => ({ ...prev, [phaseCode]: !prev[phaseCode] }))
  }

  const toggleActivity = (activityCode) => {
    setExpandedActivities(prev => ({ ...prev, [activityCode]: !prev[activityCode] }))
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
      case 'in_progress': return <Play size={16} style={{ color: '#3b82f6' }} />
      case 'on_hold': return <Pause size={16} style={{ color: '#f59e0b' }} />
      case 'blocked': return <AlertCircle size={16} style={{ color: '#ef4444' }} />
      default: return <Circle size={16} style={{ color: '#94a3b8' }} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#dcfce7', text: '#166534' }
      case 'in_progress': return { bg: '#dbeafe', text: '#1d4ed8' }
      case 'on_hold': return { bg: '#fef3c7', text: '#92400e' }
      case 'blocked': return { bg: '#fee2e2', text: '#991b1b' }
      default: return { bg: '#f1f5f9', text: '#475569' }
    }
  }

  const formatStatus = (status) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not Started'
  }

  const filterTasks = (tasks) => {
    return tasks.filter(task => {
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus
      const matchesSearch = !searchTerm ||
        task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.activityName.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }

  // Styles
  const containerStyle = { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }
  const headerStyle = { marginBottom: '24px' }
  const backButtonStyle = { display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#C59C82', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '16px', background: 'none', border: 'none' }
  const titleStyle = { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }
  const cardStyle = { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }

  const summaryCardStyle = { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', backgroundColor: '#e2e8f0' }
  const summaryItemStyle = { backgroundColor: 'white', padding: '20px', textAlign: 'center' }

  const phaseHeaderStyle = (expanded) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: expanded ? '#f8fafc' : 'white', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' })
  const activityHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 12px 48px', backgroundColor: '#fafafa', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }
  const taskRowStyle = { display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 80px', alignItems: 'center', padding: '12px 20px 12px 72px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }

  const progressBarStyle = (percentage) => ({ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' })
  const progressFillStyle = (percentage) => ({ width: `${percentage}%`, height: '100%', backgroundColor: percentage === 100 ? '#22c55e' : '#C59C82', borderRadius: '4px', transition: 'width 0.3s' })

  const buttonStyle = (variant) => ({ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', backgroundColor: variant === 'primary' ? '#C59C82' : '#f1f5f9', color: variant === 'primary' ? 'white' : '#475569' })

  const modalOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }
  const modalStyle = { backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }
  const modalHeaderStyle = { padding: '24px', borderBottom: '1px solid #e2e8f0' }
  const modalBodyStyle = { padding: '24px' }
  const modalFooterStyle = { padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading...</div>
      </div>
    )
  }

  // No tasks initialized yet
  if (!tasksData?.tasks?.length) {
    return (
      <div style={containerStyle}>
        <button style={backButtonStyle} onClick={() => navigate(`/admin/projects/${projectId}`)}>
          <ArrowLeft size={18} /> Back to Project
        </button>
        <div style={cardStyle}>
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Clock size={36} style={{ color: '#94a3b8' }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>No Tasks Initialized</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Initialize project tasks from the template to start tracking progress.</p>
            <button style={{ ...buttonStyle('primary'), padding: '12px 24px', fontSize: '15px' }} onClick={initializeTasks}>
              <RefreshCw size={18} /> Initialize Tasks from Template
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button style={backButtonStyle} onClick={() => navigate(`/admin/projects/${projectId}`)}>
          <ArrowLeft size={18} /> Back to Project
        </button>
        <h1 style={titleStyle}>{project?.title} - Tasks</h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Track progress across all phases, activities, and tasks</p>
      </div>

      {/* Summary Cards */}
      <div style={cardStyle}>
        <div style={summaryCardStyle}>
          <div style={summaryItemStyle}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#C59C82' }}>{completion?.overallCompletion || 0}%</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Overall Completion</div>
          </div>
          <div style={summaryItemStyle}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b' }}>{tasksData?.summary?.total || 0}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Total Tasks</div>
          </div>
          <div style={summaryItemStyle}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#22c55e' }}>{tasksData?.summary?.completed || 0}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Completed</div>
          </div>
          <div style={summaryItemStyle}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>{tasksData?.summary?.inProgress || 0}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>In Progress</div>
          </div>
          <div style={summaryItemStyle}>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#94a3b8' }}>{tasksData?.summary?.notStarted || 0}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Not Started</div>
          </div>
        </div>
      </div>

      {/* Phase Completion */}
      {completion?.phaseCompletion?.length > 0 && (
        <div style={cardStyle}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>Phase Progress</h3>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {completion.phaseCompletion.map((phase) => (
              <div key={phase._id} style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>{phase.phaseName}</span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#C59C82' }}>{Math.round(phase.avgCompletion || 0)}%</span>
                </div>
                <div style={progressBarStyle(phase.avgCompletion)}>
                  <div style={progressFillStyle(phase.avgCompletion || 0)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                  <span>{phase.completedTasks}/{phase.totalTasks} tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: '16px' }}>
        <div style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 40px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'not_started', 'in_progress', 'completed', 'blocked'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: filterStatus === status ? '#C59C82' : '#f1f5f9',
                  color: filterStatus === status ? 'white' : '#475569'
                }}
              >
                {status === 'all' ? 'All' : formatStatus(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div style={cardStyle}>
        {/* Header Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px 80px', padding: '12px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
          <div>Task</div>
          <div>Owner</div>
          <div>Status</div>
          <div>Progress</div>
          <div></div>
        </div>

        {/* Phases */}
        {Object.entries(tasksData.grouped).map(([phaseCode, phase]) => {
          const phaseTasks = Object.values(phase.activities).flatMap(a => a.tasks)
          const filteredPhaseTasks = filterTasks(phaseTasks)
          const phaseCompletion = phaseTasks.length > 0
            ? Math.round(phaseTasks.reduce((sum, t) => sum + t.completionPercentage, 0) / phaseTasks.length)
            : 0

          if (filteredPhaseTasks.length === 0 && filterStatus !== 'all') return null

          return (
            <div key={phaseCode}>
              {/* Phase Header */}
              <div style={phaseHeaderStyle(expandedPhases[phaseCode])} onClick={() => togglePhase(phaseCode)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {expandedPhases[phaseCode] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <span style={{ fontWeight: '600', fontSize: '15px', color: '#1e293b' }}>{phase.phaseName}</span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>({phaseTasks.length} tasks)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '120px' }}>
                    <div style={progressBarStyle(phaseCompletion)}>
                      <div style={progressFillStyle(phaseCompletion)} />
                    </div>
                  </div>
                  <span style={{ fontWeight: '600', color: '#C59C82', minWidth: '45px' }}>{phaseCompletion}%</span>
                </div>
              </div>

              {/* Activities */}
              {expandedPhases[phaseCode] && Object.entries(phase.activities).map(([activityCode, activity]) => {
                const activityTasks = activity.tasks
                const filteredActivityTasks = filterTasks(activityTasks)
                const activityCompletion = activityTasks.length > 0
                  ? Math.round(activityTasks.reduce((sum, t) => sum + t.completionPercentage, 0) / activityTasks.length)
                  : 0

                if (filteredActivityTasks.length === 0 && filterStatus !== 'all') return null

                return (
                  <div key={activityCode}>
                    {/* Activity Header */}
                    <div style={activityHeaderStyle} onClick={() => toggleActivity(activityCode)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {expandedActivities[activityCode] !== false ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <span style={{ fontWeight: '500', fontSize: '14px', color: '#475569' }}>{activity.activityName}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>({activityTasks.length})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '80px' }}>
                          <div style={{ ...progressBarStyle(activityCompletion), height: '6px' }}>
                            <div style={{ ...progressFillStyle(activityCompletion), height: '6px' }} />
                          </div>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', minWidth: '40px' }}>{activityCompletion}%</span>
                      </div>
                    </div>

                    {/* Tasks */}
                    {expandedActivities[activityCode] !== false && filteredActivityTasks.map((task) => {
                      const statusColor = getStatusColor(task.status)
                      return (
                        <div key={task._id} style={taskRowStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {getStatusIcon(task.status)}
                            <div>
                              <div style={{ fontWeight: '500', color: '#1e293b' }}>{task.taskName}</div>
                              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{task.taskCode}</div>
                            </div>
                          </div>
                          <div>
                            {(task.taskOwners?.length > 0 || task.taskOwner?.employeeName || task.taskOwner?.vendorName) ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                {/* Show from taskOwners array if available, fallback to legacy taskOwner */}
                                {(task.taskOwners?.length > 0 ? task.taskOwners : [task.taskOwner]).filter(o => o?.employeeName || o?.vendorName).slice(0, 2).map((owner, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                                    {owner.ownerType === 'vendor' ? <Building2 size={12} style={{ color: '#DDC5B0' }} /> : <User size={12} style={{ color: '#C59C82' }} />}
                                    <span style={{ color: '#475569' }}>{owner.employeeName || owner.vendorName}</span>
                                  </div>
                                ))}
                                {task.taskOwners?.length > 2 && (
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>+{task.taskOwners.length - 2}</span>
                                )}
                                <button onClick={() => openAssignModal(task)} style={{ fontSize: '11px', color: '#C59C82', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>+</button>
                              </div>
                            ) : (
                              <button onClick={() => openAssignModal(task)} style={{ fontSize: '12px', color: '#C59C82', background: 'none', border: 'none', cursor: 'pointer' }}>
                                + Assign
                              </button>
                            )}
                          </div>
                          <div>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: statusColor.bg,
                              color: statusColor.text
                            }}>
                              {formatStatus(task.status)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ ...progressBarStyle(task.completionPercentage), width: '60px', height: '6px' }}>
                              <div style={{ ...progressFillStyle(task.completionPercentage), height: '6px' }} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>{task.completionPercentage}%</span>
                          </div>
                          <div>
                            <button
                              onClick={() => openProgressModal(task)}
                              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', border: 'none', cursor: 'pointer', backgroundColor: '#f1f5f9', color: '#475569' }}
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Progress Update Modal */}
      {showProgressModal && selectedTask && (
        <div style={modalOverlayStyle} onClick={() => setShowProgressModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Update Progress</h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{selectedTask.taskName}</p>
            </div>
            <div style={modalBodyStyle}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>
                  Progress: {progressValue}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressValue}
                  onChange={(e) => setProgressValue(parseInt(e.target.value))}
                  style={{ width: '100%', height: '8px', borderRadius: '4px', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Notes</label>
                <textarea
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  placeholder="Add progress notes..."
                  style={{ width: '100%', padding: '12px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', resize: 'vertical', minHeight: '100px' }}
                />
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button onClick={() => setShowProgressModal(false)} style={buttonStyle('default')}>Cancel</button>
              <button onClick={handleUpdateProgress} disabled={saving} style={{ ...buttonStyle('primary'), opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : 'Update Progress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedTask && (
        <div style={modalOverlayStyle} onClick={() => { setShowAssignModal(false); setEmployeeSearch(''); }}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Assign Task Owner</h2>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{selectedTask.taskName}</p>
            </div>
            <div style={modalBodyStyle}>
              {/* Currently Assigned */}
              {selectedTask.taskOwners?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Currently Assigned</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedTask.taskOwners.map((owner, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        background: '#E8F5E9',
                        borderRadius: '20px',
                        fontSize: '13px'
                      }}>
                        <span style={{ color: '#2E7D32', fontWeight: '500' }}>{owner.employeeName || owner.vendorName}</span>
                        <button
                          onClick={() => handleRemoveOwner(owner.ownerType, owner.employee || owner.vendor)}
                          disabled={saving}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#C62828',
                            fontSize: '16px',
                            lineHeight: 1,
                            padding: 0,
                            opacity: saving ? 0.5 : 1
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>Add Employee</h4>
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 40px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#C59C82'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {employees.filter(emp => {
                  // Filter out already assigned employees
                  const isAssigned = selectedTask.taskOwners?.some(o => o.employee?.toString() === emp._id.toString())
                  if (isAssigned) return false
                  // Search filter
                  if (!employeeSearch) return true
                  return emp.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                    emp.designation?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                    emp.department?.toLowerCase().includes(employeeSearch.toLowerCase())
                }).map((emp) => (
                  <div
                    key={emp._id}
                    onClick={() => !saving && handleAssign('employee', emp._id, emp.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      marginBottom: '8px',
                      backgroundColor: '#f8fafc',
                      transition: 'background-color 0.2s',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#C59C82', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>
                      {emp.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#1e293b' }}>{emp.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.designation || emp.role}</div>
                    </div>
                    <span style={{ fontSize: '20px', color: '#C59C82' }}>+</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button onClick={() => { setShowAssignModal(false); setEmployeeSearch(''); setSelectedTask(null); }} style={buttonStyle('primary')}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectTasks
