import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Calendar, IndianRupee, Users, CheckCircle, Clock, GanttChart, Edit,
  ListTodo, Wallet, Play, Layers, MapPin, Building2, User, Target,
  TrendingUp, ArrowRight, FileText, ChevronRight, Plus, Trash2
} from 'lucide-react'
import { projectsAPI, customersAPI, usersAPI, projectWorkflowAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { Button, Badge, Avatar, Tabs, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { PROJECT_STATUSES } from '../../utils/constants'
import ProjectProgressDashboard from '../../components/projects/ProjectProgressDashboard'

const CATEGORY_OPTIONS = [
  { value: 'interior', label: 'Interior Design' },
  { value: 'construction', label: 'Construction' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'education', label: 'Education' },
  { value: 'ods', label: 'ODS' },
  { value: 'other', label: 'Other' }
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

const STATUS_STYLES = {
  active: 'bg-emerald-500 text-white',
  draft: 'bg-gray-400 text-white',
  on_hold: 'bg-amber-500 text-white',
  completed: 'bg-amber-600 text-white',
  cancelled: 'bg-red-500 text-white'
}

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700'
}

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'superadmin'
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInitializeModal, setShowInitializeModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState([])
  const [users, setUsers] = useState([])
  const [workflowCompletion, setWorkflowCompletion] = useState(null)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [milestoneForm, setMilestoneForm] = useState({
    name: '', description: '', dueDate: '', status: 'pending'
  })
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    status: '',
    category: '',
    priority: '',
    customer: '',
    projectManager: '',
    budget: ''
  })

  useEffect(() => {
    loadProject()
    loadCustomers()
    loadUsers()
    loadWorkflowCompletion()
  }, [id])

  const loadProject = async () => {
    try {
      const response = await projectsAPI.getOne(id)
      setProject(response.data)
    } catch (err) {
      console.error('Failed to load project:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll({ limit: 100 })
      setCustomers(response.data || [])
    } catch (err) {
      console.error('Failed to load customers:', err)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAll({ limit: 100 })
      setUsers(response.data || [])
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }

  const loadWorkflowCompletion = async () => {
    try {
      const response = await projectWorkflowAPI.getProjectCompletion(id)
      setWorkflowCompletion(response.data)
    } catch (err) {
      console.log('Workflow not initialized:', err.message)
    }
  }

  const handleInitializeWorkflow = async () => {
    setInitializing(true)
    setError('')
    try {
      await projectWorkflowAPI.initializeProject(id, { entityType: project.category === 'interior' ? 'interior_plus' : 'exterior_plus' })
      await projectWorkflowAPI.createDefaultMilestones(id)
      await loadWorkflowCompletion()
      setShowInitializeModal(false)
    } catch (err) {
      console.error('Failed to initialize workflow:', err)
      setError(err.message || 'Failed to initialize project workflow')
    } finally {
      setInitializing(false)
    }
  }

  const openEditModal = () => {
    setEditForm({
      title: project.title || '',
      description: project.description || '',
      status: project.status || 'active',
      category: project.category || 'interior',
      priority: project.priority || 'medium',
      customer: project.customer?._id || '',
      projectManager: project.projectManager?._id || '',
      budget: project.financials?.agreedAmount || project.financials?.quotedAmount || ''
    })
    setError('')
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        category: editForm.category,
        priority: editForm.priority,
        customer: editForm.customer,
        projectManager: editForm.projectManager || null,
        financials: {
          ...project.financials,
          agreedAmount: parseFloat(editForm.budget) || 0,
          quotedAmount: parseFloat(editForm.budget) || 0
        }
      }

      await projectsAPI.update(id, updateData)
      await loadProject()
      setShowEditModal(false)
    } catch (err) {
      console.error('Failed to update project:', err)
      setError(err.message || 'Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  const openAddMilestone = () => {
    setMilestoneForm({ name: '', description: '', dueDate: '', status: 'pending' })
    setEditingMilestone(null)
    setError('')
    setShowMilestoneModal(true)
  }

  const openEditMilestone = (index) => {
    const m = project.milestones[index]
    setMilestoneForm({
      name: m.name || '',
      description: m.description || '',
      dueDate: m.dueDate ? m.dueDate.slice(0, 10) : '',
      status: m.status || 'pending'
    })
    setEditingMilestone(index)
    setError('')
    setShowMilestoneModal(true)
  }

  const handleSaveMilestone = async () => {
    if (!milestoneForm.name.trim()) return
    setSaving(true)
    setError('')
    try {
      const currentMilestones = [...(project.milestones || [])]
      const milestoneData = {
        name: milestoneForm.name,
        description: milestoneForm.description,
        dueDate: milestoneForm.dueDate || undefined,
        status: milestoneForm.status
      }
      if (editingMilestone !== null) {
        currentMilestones[editingMilestone] = { ...currentMilestones[editingMilestone], ...milestoneData }
      } else {
        currentMilestones.push({ ...milestoneData, order: currentMilestones.length })
      }
      await projectsAPI.update(id, { milestones: currentMilestones })
      await loadProject()
      setShowMilestoneModal(false)
    } catch (err) {
      console.error('Failed to save milestone:', err)
      setError(err.message || 'Failed to save milestone')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMilestone = async (index) => {
    if (!window.confirm(`Delete milestone "${project.milestones[index].name}"?`)) return
    setSaving(true)
    try {
      const filtered = project.milestones.filter((_, i) => i !== index)
      await projectsAPI.update(id, { milestones: filtered })
      await loadProject()
    } catch (err) {
      console.error('Failed to delete milestone:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleMilestoneStatus = async (index) => {
    setSaving(true)
    try {
      const updated = [...project.milestones]
      const current = updated[index]
      if (current.status === 'completed') {
        updated[index] = { ...current, status: 'pending', completedDate: undefined }
      } else {
        updated[index] = { ...current, status: 'completed', completedDate: new Date().toISOString() }
      }
      await projectsAPI.update(id, { milestones: updated })
      await loadProject()
    } catch (err) {
      console.error('Failed to toggle milestone:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) return
    try {
      await projectsAPI.delete(id)
      navigate('/admin/projects')
    } catch (err) {
      console.error('Failed to delete project:', err)
      alert(err.message || 'Failed to delete project')
    }
  }

  if (loading) return <PageLoader />
  if (!project) return <div className="text-center py-12 text-gray-500">Project not found</div>

  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(workflowCompletion ? [{ id: 'progress', label: 'Progress' }] : []),
    { id: 'milestones', label: 'Milestones', count: project.milestones?.length || 0 },
    { id: 'team', label: 'Team', count: project.teamMembers?.length || 0 },
    { id: 'payments', label: 'Payments', count: project.payments?.length || 0 },
  ]

  const completedMilestones = project.milestones?.filter(m => m.status === 'completed').length || 0
  const totalMilestones = project.milestones?.length || 0
  const progress = workflowCompletion?.completionPercentage || project.completion?.completionPercentage || 0
  const budget = project.financials?.agreedAmount || project.financials?.quotedAmount || 0
  const paid = project.financials?.totalPaid || 0
  const pending = budget - paid

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero Section */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ padding: '24px 32px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
            <Link to="/admin/projects" style={{ color: '#6b7280', textDecoration: 'none' }} className="hover:text-gray-700">Projects</Link>
            <ChevronRight style={{ height: '16px', width: '16px' }} />
            <span style={{ color: '#111827', fontWeight: '500' }}>{project.title}</span>
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 }}>{project.title}</h1>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[project.status] || STATUS_STYLES.draft}`}>
                  {project.status?.toUpperCase()}
                </span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${PRIORITY_STYLES[project.priority] || PRIORITY_STYLES.medium}`}>
                  {project.priority}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px', color: '#6b7280' }}>
                <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px' }}>{project.projectId}</span>
                <span style={{ textTransform: 'capitalize' }}>{project.category}{project.subCategory ? ` - ${project.subCategory}` : ''}</span>
                {project.location?.city && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin style={{ height: '16px', width: '16px' }} />
                    {project.location.city}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {workflowCompletion ? (
                <>
                  <Link to={`/admin/projects/${id}/tasks`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ListTodo className="h-4 w-4" />
                      Tasks
                    </Button>
                  </Link>
                  <Link to={`/admin/projects/${id}/payments`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Wallet className="h-4 w-4" />
                      Payments
                    </Button>
                  </Link>
                </>
              ) : (
                <Button size="sm" onClick={() => setShowInitializeModal(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Play className="h-4 w-4" />
                  Initialize
                </Button>
              )}
              <Link to={`/admin/projects/${id}/gantt`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <GanttChart className="h-4 w-4" />
                  Gantt
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={openEditModal} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              {isSuperAdmin && (
                <Button variant="outline" size="sm" onClick={handleDeleteProject} className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {/* Progress */}
            <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #FDF8F4 100%)', borderRadius: '16px', padding: '24px', border: '1px solid #dbeafe' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
                <div style={{ height: '36px', width: '36px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp style={{ height: '18px', width: '18px', color: 'white' }} />
                </div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827' }}>{progress}%</div>
              <div style={{ marginTop: '16px', height: '8px', background: '#bfdbfe', borderRadius: '9999px', overflow: 'hidden' }}>
                <div
                  style={{ height: '100%', background: 'linear-gradient(to right, #3b82f6, #C59C82)', borderRadius: '9999px', transition: 'all 0.5s', width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Budget */}
            <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', borderRadius: '16px', padding: '24px', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget</span>
                <div style={{ height: '36px', width: '36px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IndianRupee style={{ height: '18px', width: '18px', color: 'white' }} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#111827' }}>{formatCurrency(budget)}</div>
              <p style={{ fontSize: '14px', color: '#059669', marginTop: '8px', margin: '8px 0 0 0' }}>{formatCurrency(paid)} received</p>
            </div>

            {/* Timeline */}
            <div style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #F5EDE6 100%)', borderRadius: '16px', padding: '24px', border: '1px solid #DDC5B0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#C59C82', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</span>
                <div style={{ height: '36px', width: '36px', borderRadius: '50%', background: '#DDC5B0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar style={{ height: '18px', width: '18px', color: 'white' }} />
                </div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#111827' }}>
                {project.timeline?.estimatedStartDate
                  ? formatDate(project.timeline.estimatedStartDate, 'short')
                  : 'Not set'}
              </div>
              <p style={{ fontSize: '14px', color: '#C59C82', margin: '8px 0 0 0' }}>
                {project.timeline?.estimatedEndDate
                  ? `to ${formatDate(project.timeline.estimatedEndDate, 'short')}`
                  : 'End date not set'}
              </p>
            </div>

            {/* Tasks */}
            <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', borderRadius: '16px', padding: '24px', border: '1px solid #fed7aa' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks</span>
                <div style={{ height: '36px', width: '36px', borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target style={{ height: '18px', width: '18px', color: 'white' }} />
                </div>
              </div>
              {workflowCompletion && workflowCompletion.totalTasks > 0 ? (
                <>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827' }}>
                    {workflowCompletion.completedTasks || 0}<span style={{ fontSize: '18px', color: '#9ca3af' }}>/{workflowCompletion.totalTasks || 0}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#ea580c', margin: '8px 0 0 0' }}>{workflowCompletion.inProgressTasks || 0} in progress</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827' }}>
                    {completedMilestones}<span style={{ fontSize: '18px', color: '#9ca3af' }}>/{totalMilestones || 0}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#ea580c', margin: '8px 0 0 0' }}>{totalMilestones > 0 ? 'milestones' : 'Not initialized'}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 32px' }}>
          <Tabs tabs={tabs} defaultTab="overview" onChange={setActiveTab} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px' }}>
        {activeTab === 'progress' && workflowCompletion && (
          <ProjectProgressDashboard projectId={id} />
        )}

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            {/* Main Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Description Card */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                    <div style={{ height: '32px', width: '32px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText style={{ height: '16px', width: '16px', color: '#475569' }} />
                    </div>
                    Description
                  </h3>
                </div>
                <div style={{ padding: '24px' }}>
                  <p style={{ color: '#4b5563', lineHeight: '1.7', fontSize: '15px', margin: 0 }}>
                    {project.description || 'No description provided for this project.'}
                  </p>
                </div>
              </div>

              {/* Project Details Card */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Project Details</h3>
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Customer */}
                    <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '16px' }}>Customer</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ height: '48px', width: '48px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
                          <Building2 style={{ height: '24px', width: '24px', color: '#2563eb' }} />
                        </div>
                        <div>
                          <span style={{ color: '#111827', fontWeight: '700', display: 'block', fontSize: '16px' }}>
                            {project.customer?.name || 'Not assigned'}
                          </span>
                          {project.customer?.customerId && (
                            <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>{project.customer.customerId}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Category */}
                    <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '16px' }}>Category</label>
                      <p style={{ color: '#111827', fontWeight: '700', textTransform: 'capitalize', fontSize: '16px', margin: 0 }}>
                        {project.category || 'Not set'}{project.subCategory ? ` - ${project.subCategory}` : ''}
                      </p>
                    </div>

                    {/* Stage */}
                    <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '16px' }}>Stage</label>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 20px', borderRadius: '9999px', fontSize: '14px', fontWeight: '700', background: '#e0e7ff', color: '#8B7355', border: '1px solid #c7d2fe', textTransform: 'capitalize' }}>
                        {project.stage || 'Not set'}
                      </span>
                    </div>

                    {/* Area */}
                    <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '16px' }}>Area</label>
                      <p style={{ color: '#111827', fontWeight: '700', fontSize: '16px', margin: 0 }}>
                        {project.specifications?.area?.value
                          ? `${project.specifications.area.value.toLocaleString()} ${project.specifications.area.unit || 'sqft'}`
                          : 'Not specified'}
                      </p>
                    </div>

                    {/* Location - Full Width */}
                    {project.location && (
                      <div style={{ gridColumn: 'span 2', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '16px' }}>Location</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ height: '48px', width: '48px', borderRadius: '12px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #d1d5db' }}>
                            <MapPin style={{ height: '24px', width: '24px', color: '#4b5563' }} />
                          </div>
                          <span style={{ color: '#374151', fontWeight: '600', fontSize: '15px' }}>
                            {[project.location.address, project.location.city, project.location.state]
                              .filter(Boolean)
                              .join(', ')}
                            {project.location.pincode && ` - ${project.location.pincode}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Summary Card */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                    <div style={{ height: '32px', width: '32px', borderRadius: '8px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IndianRupee style={{ height: '16px', width: '16px', color: '#059669' }} />
                    </div>
                    Financial Summary
                  </h3>
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '24px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Quoted</p>
                      <p style={{ fontSize: '22px', fontWeight: '800', color: '#111827', marginTop: '12px', marginBottom: 0 }}>{formatCurrency(project.financials?.quotedAmount || 0)}</p>
                    </div>
                    <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '24px', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Agreed</p>
                      <p style={{ fontSize: '22px', fontWeight: '800', color: '#1d4ed8', marginTop: '12px', marginBottom: 0 }}>{formatCurrency(project.financials?.agreedAmount || 0)}</p>
                    </div>
                    <div style={{ background: '#ecfdf5', borderRadius: '12px', padding: '24px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
                      <p style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Received</p>
                      <p style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '12px', marginBottom: 0 }}>{formatCurrency(project.financials?.totalPaid || 0)}</p>
                    </div>
                  </div>
                  {pending > 0 && (
                    <div style={{ marginTop: '20px', background: 'linear-gradient(to right, #fff7ed, #fffbeb)', borderRadius: '12px', padding: '20px 24px', border: '1px solid #fdba74', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#c2410c' }}>Pending Amount</span>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: '#ea580c' }}>{formatCurrency(pending)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Project Manager Card */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                    <div style={{ height: '32px', width: '32px', borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User style={{ height: '16px', width: '16px', color: '#C59C82' }} />
                    </div>
                    Project Manager
                  </h3>
                </div>
                <div style={{ padding: '24px' }}>
                  {project.projectManager && project.projectManager.name ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <Avatar name={project.projectManager.name} size="lg" />
                      <div>
                        <p style={{ fontWeight: '700', color: '#111827', fontSize: '16px', margin: 0 }}>{project.projectManager.name}</p>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>{project.projectManager.email || 'No email'}</p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ height: '56px', width: '56px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb' }}>
                        <User style={{ height: '28px', width: '28px', color: '#9ca3af' }} />
                      </div>
                      <div>
                        <p style={{ color: '#6b7280', fontWeight: '600', margin: 0 }}>No manager assigned</p>
                        <p style={{ fontSize: '13px', color: '#9ca3af', margin: '4px 0 0 0' }}>Click edit to assign</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              {workflowCompletion && (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Quick Actions</h3>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Link
                      to={`/admin/projects/${id}/tasks`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: 'white', border: '1px solid #e5e7eb', textDecoration: 'none', transition: 'all 0.2s' }}
                      className="hover:bg-amber-50 hover:border-amber-400"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ height: '40px', width: '40px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bfdbfe' }}>
                          <ListTodo style={{ height: '20px', width: '20px', color: '#2563eb' }} />
                        </div>
                        <span style={{ fontWeight: '700', color: '#374151' }}>View Tasks</span>
                      </div>
                      <ArrowRight style={{ height: '20px', width: '20px', color: '#9ca3af' }} />
                    </Link>
                    <Link
                      to={`/admin/projects/${id}/payments`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: 'white', border: '1px solid #e5e7eb', textDecoration: 'none', transition: 'all 0.2s' }}
                      className="hover:bg-emerald-50 hover:border-emerald-300"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ height: '40px', width: '40px', borderRadius: '10px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #a7f3d0' }}>
                          <Wallet style={{ height: '20px', width: '20px', color: '#059669' }} />
                        </div>
                        <span style={{ fontWeight: '700', color: '#374151' }}>Manage Payments</span>
                      </div>
                      <ArrowRight style={{ height: '20px', width: '20px', color: '#9ca3af' }} />
                    </Link>
                    <Link
                      to={`/admin/projects/${id}/gantt`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', background: 'white', border: '1px solid #e5e7eb', textDecoration: 'none', transition: 'all 0.2s' }}
                      className="hover:bg-amber-50 hover:border-amber-400"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ height: '40px', width: '40px', borderRadius: '10px', background: '#F5EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #D4B49A' }}>
                          <GanttChart style={{ height: '20px', width: '20px', color: '#C59C82' }} />
                        </div>
                        <span style={{ fontWeight: '700', color: '#374151' }}>Gantt Chart</span>
                      </div>
                      <ArrowRight style={{ height: '20px', width: '20px', color: '#9ca3af' }} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Team Preview */}
              {project.teamMembers?.length > 0 && (
                <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                      <div style={{ height: '32px', width: '32px', borderRadius: '8px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users style={{ height: '16px', width: '16px', color: '#ea580c' }} />
                      </div>
                      Team ({project.teamMembers.length})
                    </h3>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <div className="flex -space-x-3">
                      {project.teamMembers.slice(0, 6).map((member, i) => (
                        <Avatar
                          key={i}
                          name={member.user?.name || 'Unknown'}
                          size="md"
                          className="ring-3 ring-white"
                        />
                      ))}
                      {project.teamMembers.length > 6 && (
                        <div className="h-10 w-10 rounded-full bg-gray-100 ring-3 ring-white flex items-center justify-center text-sm font-bold text-gray-600">
                          +{project.teamMembers.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Milestones</h3>
              <Button size="sm" onClick={openAddMilestone} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Milestone
              </Button>
            </div>
            {project.milestones?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {project.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => handleToggleMilestoneStatus(index)}
                      className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 border-0 cursor-pointer transition-colors ${
                        milestone.status === 'completed' ? 'bg-emerald-100 hover:bg-emerald-200' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      title={milestone.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
                    >
                      {milestone.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${milestone.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {milestone.name}
                      </p>
                      {milestone.description && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">{milestone.description}</p>
                      )}
                    </div>
                    {milestone.dueDate && (
                      <span className="text-sm text-gray-500">{formatDate(milestone.dueDate)}</span>
                    )}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      milestone.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      milestone.status === 'delayed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {milestone.status}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditMilestone(index)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-0 cursor-pointer bg-transparent transition-colors"
                        title="Edit milestone"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMilestone(index)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border-0 cursor-pointer bg-transparent transition-colors"
                        title="Delete milestone"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <CheckCircle className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No milestones added yet</p>
                <Button variant="outline" size="sm" onClick={openAddMilestone} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Milestone
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            {project.teamMembers?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 p-6">
                {project.teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <Avatar name={member.user?.name || 'Unknown'} size="lg" />
                    <div>
                      <p className="font-semibold text-gray-900">{member.user?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500 capitalize">{member.role?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No team members assigned</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {project.payments?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {project.payments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        payment.status === 'paid' ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}>
                        <IndianRupee className={`h-5 w-5 ${payment.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 text-sm font-medium rounded-full ${
                      payment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Wallet className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No payments recorded</p>
                {workflowCompletion && (
                  <Link to={`/admin/projects/${id}/payments`}>
                    <Button variant="outline" size="sm">Manage Payments</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Project">
        <form onSubmit={handleUpdate} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Project Title"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            placeholder="Enter project title"
            required
          />

          <Select
            label="Customer"
            value={editForm.customer}
            onChange={(e) => setEditForm({ ...editForm, customer: e.target.value })}
            options={[
              { value: '', label: 'Select a customer' },
              ...customers.map(c => ({ value: c._id, label: `${c.name} (${c.customerId})` }))
            ]}
            required
          />

          <Input
            label="Description"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            placeholder="Brief description of the project"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
            />
            <Input
              label="Budget (INR)"
              type="number"
              value={editForm.budget}
              onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <Select
            label="Project Manager"
            value={editForm.projectManager}
            onChange={(e) => setEditForm({ ...editForm, projectManager: e.target.value })}
            options={[
              { value: '', label: 'Select project manager' },
              ...users.map(u => ({ value: u._id, label: u.name }))
            ]}
          />

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Initialize Workflow Modal */}
      <Modal isOpen={showInitializeModal} onClose={() => setShowInitializeModal(false)} title="Initialize Project Workflow">
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-indigo-50 to-amber-50 rounded-xl border border-indigo-100">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Layers className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">What this does:</h4>
                <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-500" />
                    Creates all phases, activities, and tasks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-500" />
                    Sets up payment milestones
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-500" />
                    Enables task tracking with completion percentage
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-indigo-500" />
                    Allows assigning tasks to team members
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-600">
            This will initialize the workflow for <strong>{project?.title}</strong> using the {project?.category === 'interior' ? 'Interior Plus' : 'Exterior Plus'} template.
          </p>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowInitializeModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInitializeWorkflow} disabled={initializing}>
              {initializing ? 'Initializing...' : 'Initialize Workflow'}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* Milestone Modal */}
      <Modal isOpen={showMilestoneModal} onClose={() => setShowMilestoneModal(false)} title={editingMilestone !== null ? 'Edit Milestone' : 'Add Milestone'}>
        <div className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Name"
            value={milestoneForm.name}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
            placeholder="Milestone name"
            required
          />

          <Input
            label="Description"
            value={milestoneForm.description}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
            placeholder="Brief description (optional)"
          />

          <Input
            label="Due Date"
            type="date"
            value={milestoneForm.dueDate}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
          />

          <Select
            label="Status"
            value={milestoneForm.status}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'delayed', label: 'Delayed' }
            ]}
          />

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMilestoneModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMilestone} disabled={saving || !milestoneForm.name.trim()}>
              {saving ? 'Saving...' : editingMilestone !== null ? 'Save Changes' : 'Add Milestone'}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  )
}

export default ProjectDetail
