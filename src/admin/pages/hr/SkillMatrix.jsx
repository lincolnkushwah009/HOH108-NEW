import { useState, useEffect } from 'react'
import { Award, Plus, Star, BookOpen, Filter } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { skillMatrixAPI } from '../../utils/api'

const StarRating = ({ value, max = 5 }) => {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={16}
          fill={i < value ? '#C59C82' : 'none'}
          color={i < value ? '#C59C82' : '#D1D5DB'}
        />
      ))}
    </div>
  )
}

const StarInput = ({ value, onChange, max = 5 }) => {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          <Star
            size={20}
            fill={i < value ? '#C59C82' : 'none'}
            color={i < value ? '#C59C82' : '#D1D5DB'}
          />
        </button>
      ))}
    </div>
  )
}

const SkillMatrix = () => {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // Add skill modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    skillName: '',
    category: 'technical',
    currentLevel: 3,
    certifications: '',
    trainingHistory: [{ programName: '', provider: '', date: '', status: 'completed' }],
  })

  // View training modal
  const [showTrainingModal, setShowTrainingModal] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState(null)

  useEffect(() => {
    loadSkills()
  }, [pagination.page, search, departmentFilter, categoryFilter, userFilter])

  const loadSkills = async () => {
    setLoading(true)
    try {
      const res = await skillMatrixAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(departmentFilter && { department: departmentFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(userFilter && { userId: userFilter }),
      })
      setSkills(res.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.pages || 1,
      }))
    } catch (err) {
      console.error('Failed to load skills:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      userId: '',
      skillName: '',
      category: 'technical',
      currentLevel: 3,
      certifications: '',
      trainingHistory: [{ programName: '', provider: '', date: '', status: 'completed' }],
    })
  }

  const handleCreate = async () => {
    if (!formData.skillName) {
      alert('Please enter a skill name')
      return
    }
    setSaving(true)
    try {
      const trainingItems = formData.trainingHistory.filter(t => t.programName)
      await skillMatrixAPI.createOrUpdate({
        userId: formData.userId || undefined,
        skillName: formData.skillName,
        category: formData.category,
        currentLevel: Number(formData.currentLevel),
        certifications: formData.certifications ? formData.certifications.split(',').map(c => c.trim()).filter(Boolean) : [],
        trainingHistory: trainingItems,
      })
      setShowNewModal(false)
      resetForm()
      loadSkills()
    } catch (err) {
      alert(err.message || 'Failed to add skill')
    } finally {
      setSaving(false)
    }
  }

  const addTrainingItem = () => {
    setFormData(prev => ({
      ...prev,
      trainingHistory: [...prev.trainingHistory, { programName: '', provider: '', date: '', status: 'completed' }],
    }))
  }

  const updateTraining = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      trainingHistory: prev.trainingHistory.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }))
  }

  const removeTraining = (index) => {
    if (formData.trainingHistory.length <= 1) return
    setFormData(prev => ({
      ...prev,
      trainingHistory: prev.trainingHistory.filter((_, i) => i !== index),
    }))
  }

  const viewTraining = (skill) => {
    setSelectedSkill(skill)
    setShowTrainingModal(true)
  }

  const categoryColors = {
    technical: 'blue',
    management: 'purple',
    communication: 'green',
    design: 'yellow',
    finance: 'red',
    leadership: 'gray',
  }

  const levelLabels = {
    1: 'Beginner',
    2: 'Basic',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert',
  }

  const certStatusColors = {
    active: 'green',
    expired: 'red',
    pending: 'yellow',
  }

  const trainingStatusColors = {
    completed: 'green',
    in_progress: 'blue',
    planned: 'gray',
    cancelled: 'red',
  }

  // Group skills by user for card display
  const skillsByUser = {}
  skills.forEach(skill => {
    const userName = skill.user?.name || skill.userId || 'Unassigned'
    if (!skillsByUser[userName]) {
      skillsByUser[userName] = { user: skill.user, skills: [] }
    }
    skillsByUser[userName].skills.push(skill)
  })

  return (
    <div>
      <PageHeader
        title="Skill Matrix"
        description="Employee skills, certifications, and training management"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'HR' }, { label: 'Skill Matrix' }]}
        actions={<Button icon={Plus} onClick={() => { resetForm(); setShowNewModal(true) }}>Add Skill</Button>}
      />

      {/* Filters */}
      <Card style={{ marginBottom: 16 }} padding="sm">
        <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search skills..."
            style={{ flex: 1, maxWidth: 280 }}
          />
          <Input
            placeholder="Filter by User ID"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ maxWidth: 180 }}
          />
          <Select
            options={[
              { value: '', label: 'All Departments' },
              { value: 'engineering', label: 'Engineering' },
              { value: 'design', label: 'Design' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'sales', label: 'Sales' },
              { value: 'operations', label: 'Operations' },
              { value: 'hr', label: 'HR' },
              { value: 'finance', label: 'Finance' },
            ]}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          />
          <Select
            options={[
              { value: '', label: 'All Categories' },
              { value: 'technical', label: 'Technical' },
              { value: 'management', label: 'Management' },
              { value: 'communication', label: 'Communication' },
              { value: 'design', label: 'Design' },
              { value: 'finance', label: 'Finance' },
              { value: 'leadership', label: 'Leadership' },
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Skill Cards grouped by user */}
      {loading ? (
        <PageLoader />
      ) : skills.length === 0 ? (
        <Card>
          <EmptyState
            icon={Award}
            title="No skills found"
            description="Add employee skills to build the skill matrix"
            actionLabel="Add Skill"
            onAction={() => { resetForm(); setShowNewModal(true) }}
          />
        </Card>
      ) : (
        <>
          {Object.entries(skillsByUser).map(([userName, group]) => (
            <Card key={userName} style={{ marginBottom: 16 }}>
              <Card.Header title={userName} />
              <Card.Content style={{ padding: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {group.skills.map((skill) => (
                    <div
                      key={skill._id}
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: 10,
                        padding: 16,
                        background: '#FAFAFA',
                        cursor: 'pointer',
                      }}
                      onClick={() => viewTraining(skill)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{skill.skillName}</p>
                          <Badge color={categoryColors[skill.category] || 'gray'}>
                            {(skill.category || 'general').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>Level: {levelLabels[skill.currentLevel] || skill.currentLevel}</span>
                          <StarRating value={skill.currentLevel || 0} />
                        </div>
                        {/* Certifications */}
                        {skill.certifications && skill.certifications.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {(Array.isArray(skill.certifications) ? skill.certifications : [skill.certifications]).map((cert, ci) => {
                                const certName = typeof cert === 'string' ? cert : cert?.name || cert
                                const certStatus = typeof cert === 'object' ? cert?.status : 'active'
                                return (
                                  <span
                                    key={ci}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '2px 8px',
                                      borderRadius: 12,
                                      fontSize: 11,
                                      background: certStatus === 'active' ? '#DCFCE7' : '#FEE2E2',
                                      color: certStatus === 'active' ? '#16A34A' : '#DC2626',
                                    }}
                                  >
                                    <Award size={10} />
                                    {certName}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {/* Training count */}
                        {skill.trainingHistory && skill.trainingHistory.length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <BookOpen size={12} color="#6B7280" />
                            <span style={{ fontSize: 11, color: '#6B7280' }}>
                              {skill.trainingHistory.length} training program{skill.trainingHistory.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          ))}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          />
        </>
      )}

      {/* Add Skill Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Add Skill"
        description="Add a skill entry for an employee"
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Input
              label="User ID (optional)"
              placeholder="Employee ID or leave blank"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Skill Name"
              placeholder="e.g. AutoCAD, Project Management"
              value={formData.skillName}
              onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
            />
          </div>
          <div>
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'technical', label: 'Technical' },
                { value: 'management', label: 'Management' },
                { value: 'communication', label: 'Communication' },
                { value: 'design', label: 'Design' },
                { value: 'finance', label: 'Finance' },
                { value: 'leadership', label: 'Leadership' },
              ]}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Current Level ({levelLabels[formData.currentLevel]})
            </label>
            <StarInput value={formData.currentLevel} onChange={(val) => setFormData({ ...formData, currentLevel: val })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Certifications (comma separated)"
              placeholder="e.g. AWS Certified, PMP, LEED AP"
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
            />
          </div>
        </div>

        {/* Training History */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Training History</label>
            <Button variant="secondary" size="sm" icon={Plus} onClick={addTrainingItem}>Add Training</Button>
          </div>
          {formData.trainingHistory.map((training, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
              <Input
                label={index === 0 ? 'Program Name' : undefined}
                placeholder="Training program"
                value={training.programName}
                onChange={(e) => updateTraining(index, 'programName', e.target.value)}
              />
              <Input
                label={index === 0 ? 'Provider' : undefined}
                placeholder="Provider"
                value={training.provider}
                onChange={(e) => updateTraining(index, 'provider', e.target.value)}
              />
              <Input
                label={index === 0 ? 'Date' : undefined}
                type="date"
                value={training.date}
                onChange={(e) => updateTraining(index, 'date', e.target.value)}
              />
              <Select
                label={index === 0 ? 'Status' : undefined}
                value={training.status}
                onChange={(e) => updateTraining(index, 'status', e.target.value)}
                options={[
                  { value: 'completed', label: 'Completed' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'planned', label: 'Planned' },
                ]}
              />
              <button
                onClick={() => removeTraining(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: formData.trainingHistory.length <= 1 ? 'not-allowed' : 'pointer',
                  padding: 8,
                  color: '#EF4444',
                  fontSize: 18,
                  opacity: formData.trainingHistory.length <= 1 ? 0.3 : 1,
                }}
                disabled={formData.trainingHistory.length <= 1}
              >
                x
              </button>
            </div>
          ))}
        </div>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Saving...' : 'Add Skill'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Training Details Modal */}
      <Modal
        isOpen={showTrainingModal}
        onClose={() => { setShowTrainingModal(false); setSelectedSkill(null) }}
        title={selectedSkill ? `${selectedSkill.skillName} - Training History` : 'Training History'}
        size="lg"
      >
        {selectedSkill && (
          <div>
            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{selectedSkill.skillName}</p>
                  <p style={{ fontSize: 13, color: '#6B7280', textTransform: 'capitalize' }}>{selectedSkill.category}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StarRating value={selectedSkill.currentLevel || 0} />
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{levelLabels[selectedSkill.currentLevel]}</p>
                </div>
              </div>
            </div>

            {selectedSkill.trainingHistory && selectedSkill.trainingHistory.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Program</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Provider</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSkill.trainingHistory.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: '#111827' }}>{t.programName || '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: '#374151' }}>{t.provider || '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: '#6B7280' }}>{t.date ? formatDate(t.date) : '-'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <Badge color={trainingStatusColors[t.status] || 'gray'}>
                          {(t.status || 'completed').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: 32, color: '#6B7280' }}>
                No training history recorded
              </div>
            )}
          </div>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowTrainingModal(false); setSelectedSkill(null) }}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default SkillMatrix
