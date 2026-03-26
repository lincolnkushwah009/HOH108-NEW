import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, Mail, MapPin, Calendar, FolderKanban, MessageSquare, Plus, X, ArrowLeft, UserCheck, ChevronDown } from 'lucide-react'
import { customersAPI, projectsAPI, usersAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Badge, Avatar, Tabs } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatDate, formatPhone, formatRelativeTime, telHref } from '../../utils/helpers'

const CATEGORY_OPTIONS = [
  { value: 'interior', label: 'Interior Design' },
  { value: 'construction', label: 'Construction' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'education', label: 'Education' },
  { value: 'ods', label: 'ODS' },
  { value: 'other', label: 'Other' }
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const CustomerDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('projects')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [availableProjects, setAvailableProjects] = useState([])
  const [customerProjects, setCustomerProjects] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [showManagerDropdown, setShowManagerDropdown] = useState(false)
  const [teamUsers, setTeamUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [savingManager, setSavingManager] = useState(false)
  const [newProject, setNewProject] = useState({
    projectId: '',
    title: '',
    description: '',
    status: 'active',
    category: 'interior',
    budget: ''
  })
  const [portalPassword, setPortalPassword] = useState('')
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalMsg, setPortalMsg] = useState('')

  useEffect(() => {
    loadCustomer()
    loadCustomerProjects()
  }, [id])

  const loadCustomer = async () => {
    try {
      const response = await customersAPI.getOne(id)
      setCustomer(response.data)
    } catch (err) {
      console.error('Failed to load customer:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomerProjects = async () => {
    try {
      const response = await customersAPI.getProjects(id)
      setCustomerProjects(response.data || [])
    } catch (err) {
      console.error('Failed to load customer projects:', err)
    }
  }

  const loadAvailableProjects = async () => {
    setLoadingProjects(true)
    try {
      const response = await projectsAPI.getAll({ limit: 200 })
      const allProjects = response.data || []
      // Mark projects: available, already assigned to this customer, or assigned to another
      const assignedIds = customerProjects.map(p => p._id)
      const available = allProjects.map(p => ({
        ...p,
        _assignedToThis: assignedIds.includes(p._id),
        _assignedToOther: p.customer && !assignedIds.includes(p._id) && p.customer._id !== id && p.customer !== id,
      }))
      setAvailableProjects(available)
    } catch (err) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleOpenAssignModal = () => {
    setShowAssignModal(true)
    loadAvailableProjects()
  }

  const handleAssignProject = async (projectId) => {
    setAssigning(true)
    try {
      const res = await customersAPI.assignProject(id, projectId)
      alert(res.message || 'Project assigned successfully')
      await loadCustomer()
      await loadCustomerProjects()
      setShowAssignModal(false)
    } catch (err) {
      console.error('Failed to assign project:', err)
      alert(err.message || 'Failed to assign project')
    } finally {
      setAssigning(false)
    }
  }

  // Account Manager functions
  const loadTeamUsers = async () => {
    if (teamUsers.length > 0) return // Already loaded
    setLoadingUsers(true)
    try {
      const response = await usersAPI.getAll({ limit: 100 })
      setTeamUsers(response.data || [])
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAssignManager = async (userId) => {
    setSavingManager(true)
    try {
      await customersAPI.update(id, { accountManager: userId || null })
      await loadCustomer()
      setShowManagerDropdown(false)
    } catch (err) {
      console.error('Failed to assign account manager:', err)
      alert(err.message || 'Failed to assign account manager')
    } finally {
      setSavingManager(false)
    }
  }

  const handleCreateNewProject = async (e) => {
    e.preventDefault()
    setCreateError('')

    if (!newProject.projectId.trim()) {
      setCreateError('Project ID is required')
      return
    }

    setCreating(true)
    try {
      const payload = {
        projectId: newProject.projectId,
        title: newProject.title || newProject.projectId,
        description: newProject.description,
        status: newProject.status,
        category: newProject.category,
        customer: id,
        financials: {
          quotedAmount: parseFloat(newProject.budget) || 0,
          agreedAmount: parseFloat(newProject.budget) || 0,
          finalAmount: parseFloat(newProject.budget) || 0
        }
      }
      await projectsAPI.create(payload)
      await loadCustomer() // Reload customer to get updated projects
      setShowAssignModal(false)
      setShowCreateForm(false)
      setNewProject({
        projectId: '',
        title: '',
        description: '',
        status: 'active',
        category: 'interior',
        budget: ''
      })
    } catch (err) {
      setCreateError(err.message || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleBackToAssign = () => {
    setShowCreateForm(false)
    setCreateError('')
    setNewProject({
      projectId: '',
      title: '',
      description: '',
      status: 'active',
      category: 'interior',
      budget: ''
    })
  }

  const handlePortalPassword = async (e) => {
    e.preventDefault()
    if (!portalPassword || portalPassword.length < 6) {
      setPortalMsg('Password must be at least 6 characters')
      return
    }
    setPortalLoading(true)
    setPortalMsg('')
    try {
      await customersAPI.resetPortalPassword(id, portalPassword)
      setPortalMsg('Portal password updated successfully')
      setPortalPassword('')
      loadCustomer()
    } catch (err) {
      setPortalMsg(err.message || 'Failed to update password')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleTogglePortal = async (enabled) => {
    setPortalLoading(true)
    setPortalMsg('')
    try {
      await customersAPI.enablePortalAccess(id, { enabled, password: enabled && !customer.portalAccess?.enabled ? 'Welcome@123' : undefined })
      setPortalMsg(enabled ? 'Portal access enabled (default password: Welcome@123)' : 'Portal access disabled')
      loadCustomer()
    } catch (err) {
      setPortalMsg(err.message || 'Failed to update portal access')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) return <PageLoader />
  if (!customer) return <div className="text-center py-12 text-gray-500">Customer not found</div>

  const tabs = [
    { id: 'projects', label: 'Projects', count: customerProjects.length },
    { id: 'notes', label: 'Notes', count: customer.notes?.length || 0 },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={customer.customerId}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Customers', path: '/admin/customers' },
          { label: customer.name },
        ]}
        actions={
          <Button variant="outline" icon={MessageSquare}>Add Note</Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start gap-4">
              <Avatar name={customer.name} size="xl" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">{customer.name}</h2>
                  <Badge color={customer.status === 'active' ? 'green' : 'gray'}>{customer.status}</Badge>
                  <Badge color={customer.type === 'business' ? 'purple' : 'blue'}>{customer.type}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{formatPhone(customer.phone)}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{customer.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Customer since {formatDate(customer.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Customer Portal Access */}
          <Card>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' }}>Customer Portal Access</h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                    {customer.portalAccess?.enabled
                      ? 'Portal is enabled - customer can login at /login'
                      : 'Portal is disabled - customer cannot login'}
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePortal(!customer.portalAccess?.enabled)}
                  disabled={portalLoading}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: 'none',
                    background: customer.portalAccess?.enabled ? '#fee2e2' : '#dcfce7',
                    color: customer.portalAccess?.enabled ? '#dc2626' : '#16a34a',
                  }}
                >
                  {customer.portalAccess?.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>

              {customer.portalAccess?.enabled && customer.email && (
                <form onSubmit={handlePortalPassword} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                      Set / Reset Portal Password
                    </label>
                    <input
                      type="text"
                      value={portalPassword}
                      onChange={(e) => setPortalPassword(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
                        border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={portalLoading || !portalPassword}
                    style={{
                      padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: '#C59C82', color: '#fff', border: 'none', cursor: 'pointer',
                      opacity: portalLoading || !portalPassword ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {portalLoading ? 'Saving...' : 'Update Password'}
                  </button>
                </form>
              )}

              {portalMsg && (
                <p style={{
                  fontSize: 13, marginTop: 10, padding: '8px 12px', borderRadius: 6,
                  background: portalMsg.includes('success') || portalMsg.includes('enabled') ? '#dcfce7' : portalMsg.includes('disabled') ? '#fee2e2' : '#fef3c7',
                  color: portalMsg.includes('success') || portalMsg.includes('enabled') ? '#16a34a' : portalMsg.includes('disabled') ? '#dc2626' : '#92400e',
                }}>
                  {portalMsg}
                </p>
              )}
            </div>
          </Card>

          <Tabs tabs={tabs} defaultTab="projects" onChange={setActiveTab} />

          {activeTab === 'projects' && (
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between w-full">
                  <Card.Title>Projects</Card.Title>
                  <Button size="sm" icon={Plus} onClick={handleOpenAssignModal}>
                    Assign Project
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                {customerProjects.length > 0 ? (
                  <div className="space-y-3">
                    {customerProjects.map((project) => (
                      <div
                        key={project._id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => navigate(`/admin/projects/${project._id}`)}
                      >
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <FolderKanban className="h-5 w-5 text-amber-700" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{project.title}</p>
                          <p className="text-sm text-gray-500">{project.status}</p>
                        </div>
                        <Badge color={project.status === 'completed' ? 'green' : 'blue'}>
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No projects yet</p>
                    <Button size="sm" icon={Plus} onClick={handleOpenAssignModal}>
                      Assign First Project
                    </Button>
                  </div>
                )}
              </Card.Content>
            </Card>
          )}

          {activeTab === 'notes' && (
            <Card>
              <Card.Header>
                <Card.Title>Notes</Card.Title>
              </Card.Header>
              <Card.Content>
                {customer.notes?.length > 0 ? (
                  <div className="space-y-4">
                    {customer.notes.map((n, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{n.note}</p>
                        <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(n.addedAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No notes</p>
                )}
              </Card.Content>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between w-full">
                <Card.Title>Account Manager</Card.Title>
                <button
                  onClick={() => { setShowManagerDropdown(!showManagerDropdown); loadTeamUsers() }}
                  style={{ fontSize: 12, color: '#C59C82', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', padding: '4px 0' }}
                >
                  {customer.accountManager ? 'Change' : 'Assign'}
                </button>
              </div>
            </Card.Header>
            <Card.Content>
              {customer.accountManager ? (
                <div className="flex items-center gap-3">
                  <Avatar name={customer.accountManager.name} size="md" />
                  <div style={{ flex: 1 }}>
                    <p className="text-sm font-medium text-gray-900">{customer.accountManager.name}</p>
                    <p className="text-xs text-gray-500">{customer.accountManager.email}</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UserCheck style={{ width: 18, height: 18, color: '#94a3b8' }} />
                  </div>
                  <p className="text-sm text-gray-400">No account manager assigned</p>
                </div>
              )}

              {/* Dropdown to select user */}
              {showManagerDropdown && (
                <div style={{ marginTop: 12, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
                  {loadingUsers ? (
                    <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading users...</div>
                  ) : (
                    <>
                      {customer.accountManager && (
                        <button
                          onClick={() => handleAssignManager(null)}
                          disabled={savingManager}
                          style={{ width: '100%', padding: '10px 14px', background: '#fef2f2', border: 'none', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#dc2626', fontWeight: 500 }}
                        >
                          Remove Account Manager
                        </button>
                      )}
                      {teamUsers.map(user => {
                        const isCurrentManager = customer.accountManager?._id === user._id
                        return (
                          <button
                            key={user._id}
                            onClick={() => !isCurrentManager && handleAssignManager(user._id)}
                            disabled={savingManager || isCurrentManager}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              background: isCurrentManager ? '#f0fdf4' : 'white',
                              border: 'none',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: isCurrentManager ? 'default' : 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => !isCurrentManager && (e.currentTarget.style.background = '#f8fafc')}
                            onMouseLeave={e => (e.currentTarget.style.background = isCurrentManager ? '#f0fdf4' : 'white')}
                          >
                            <Avatar name={user.name} size="sm" />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', margin: 0 }}>{user.name}</p>
                              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{user.email}</p>
                            </div>
                            {isCurrentManager && (
                              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Current</span>
                            )}
                          </button>
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Summary</Card.Title>
            </Card.Header>
            <Card.Content>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Total Projects</dt>
                  <dd className="text-sm font-medium text-gray-900">{customerProjects.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Segment</dt>
                  <dd className="text-sm font-medium text-gray-900">{customer.segment || '-'}</dd>
                </div>
              </dl>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Assign Project Modal */}
      {showAssignModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={() => { setShowAssignModal(false); setShowCreateForm(false); setCreateError(''); }}
          />
          <div style={{
            position: 'relative',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                Assign Project to {customer.name}
              </h3>
              <button
                onClick={() => { setShowAssignModal(false); setShowCreateForm(false); setCreateError(''); }}
                style={{
                  padding: '8px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X style={{ width: '18px', height: '18px', color: '#64748b' }} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {showCreateForm ? (
                /* Create Project Form */
                <form onSubmit={handleCreateNewProject}>
                  <button
                    type="button"
                    onClick={handleBackToAssign}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 0',
                      background: 'none',
                      border: 'none',
                      color: '#C59C82',
                      fontSize: '14px',
                      cursor: 'pointer',
                      marginBottom: '16px',
                    }}
                  >
                    <ArrowLeft style={{ width: '16px', height: '16px' }} />
                    Back to assign existing
                  </button>

                  {createError && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      color: '#991B1B',
                      fontSize: '14px',
                      borderRadius: '10px',
                      marginBottom: '16px',
                    }}>
                      {createError}
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Project ID *
                    </label>
                    <input
                      type="text"
                      value={newProject.projectId}
                      onChange={(e) => setNewProject({ ...newProject, projectId: e.target.value })}
                      placeholder="e.g., PRJ-001"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Project Title
                    </label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      placeholder="Enter project title"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Description
                    </label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="Brief description"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Category
                      </label>
                      <select
                        value={newProject.category}
                        onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        {CATEGORY_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Status
                      </label>
                      <select
                        value={newProject.status}
                        onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Project Value (INR)
                    </label>
                    <input
                      type="number"
                      value={newProject.budget}
                      onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creating}
                    style={{
                      width: '100%',
                      padding: '14px',
                      background: creating ? '#D4B49A' : 'linear-gradient(135deg, #C59C82 0%, #DDC5B0 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: creating ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {creating ? 'Creating...' : 'Create Project'}
                  </button>
                </form>
              ) : (
                <>
                  {/* Create New Project Button */}
                  <button
                    onClick={() => setShowCreateForm(true)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #C59C82 0%, #DDC5B0 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginBottom: '20px',
                    }}
                  >
                    <Plus style={{ width: '20px', height: '20px' }} />
                    Create New Project
                  </button>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px',
                  }}>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>or assign existing</span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  </div>

                  {/* Available Projects List */}
                  {loadingProjects ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      Loading projects...
                    </div>
                  ) : availableProjects.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {availableProjects.map((project) => {
                        const isAssignedToThis = project._assignedToThis
                        const isAssignedToOther = project._assignedToOther
                        const isDisabled = assigning || isAssignedToThis || isAssignedToOther
                        return (
                          <button
                            key={project._id}
                            onClick={() => !isDisabled && handleAssignProject(project._id)}
                            disabled={isDisabled}
                            style={{
                              width: '100%',
                              padding: '14px 16px',
                              background: isAssignedToThis ? '#f0fdf4' : isAssignedToOther ? '#fef2f2' : '#f8fafc',
                              border: `2px solid ${isAssignedToThis ? '#bbf7d0' : isAssignedToOther ? '#fecaca' : '#e2e8f0'}`,
                              borderRadius: '12px',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              textAlign: 'left',
                              transition: 'all 0.2s',
                              opacity: isDisabled && !isAssignedToThis ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => !isDisabled && (e.currentTarget.style.borderColor = '#C59C82')}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = isAssignedToThis ? '#bbf7d0' : isAssignedToOther ? '#fecaca' : '#e2e8f0')}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              background: isAssignedToThis ? '#dcfce7' : '#F5EDE6',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <FolderKanban style={{ width: '20px', height: '20px', color: isAssignedToThis ? '#16a34a' : '#DDC5B0' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                                {project.title}
                              </p>
                              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>
                                {project.status} • {project.projectId}
                                {isAssignedToThis && <span style={{ color: '#16a34a', fontWeight: 600 }}> • Already assigned</span>}
                                {isAssignedToOther && <span style={{ color: '#dc2626', fontWeight: 600 }}> • Assigned to {project.customer?.name || 'another customer'}</span>}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      <FolderKanban style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>No available projects to assign</p>
                      <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>Create a new project above</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerDetail
