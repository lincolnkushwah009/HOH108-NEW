import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Eye, BarChart3, Star, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { surveysAPI } from '../../utils/api'

const Surveys = () => {
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // New survey modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    type: 'csat',
    description: '',
    questions: [{ questionText: '', questionType: 'rating', required: true }],
  })

  // Responses modal
  const [showResponsesModal, setShowResponsesModal] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [responses, setResponses] = useState([])
  const [loadingResponses, setLoadingResponses] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalSurveys: 0,
    averageScore: 0,
    responseRate: 0,
    npsScore: null,
  })

  useEffect(() => {
    loadSurveys()
  }, [pagination.page, search])

  const loadSurveys = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await surveysAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
      })
      const data = response.data || response.surveys || []
      setSurveys(data)
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || data.length,
        totalPages: response.pagination?.pages || 1,
      }))

      if (response.stats) {
        setStats({
          totalSurveys: response.stats.totalSurveys || data.length,
          averageScore: response.stats.averageScore || 0,
          responseRate: response.stats.responseRate || 0,
          npsScore: response.stats.npsScore ?? null,
        })
      } else {
        setStats(prev => ({ ...prev, totalSurveys: data.length }))
      }
    } catch (err) {
      console.error('Failed to load surveys:', err)
      setError('Failed to load surveys')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSurvey = async () => {
    if (!newSurvey.title.trim()) return
    setSaving(true)
    try {
      await surveysAPI.create(newSurvey)
      setShowNewModal(false)
      setNewSurvey({
        title: '',
        type: 'csat',
        description: '',
        questions: [{ questionText: '', questionType: 'rating', required: true }],
      })
      await loadSurveys()
    } catch (err) {
      console.error('Failed to create survey:', err)
      setError('Failed to create survey')
    } finally {
      setSaving(false)
    }
  }

  const handleViewResponses = async (survey) => {
    setSelectedSurvey(survey)
    setShowResponsesModal(true)
    setLoadingResponses(true)
    try {
      const response = await surveysAPI.getResponses(survey._id)
      setResponses(response.data || response.responses || [])
    } catch (err) {
      console.error('Failed to load responses:', err)
      setResponses([])
    } finally {
      setLoadingResponses(false)
    }
  }

  const addQuestion = () => {
    setNewSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, { questionText: '', questionType: 'rating', required: true }],
    }))
  }

  const updateQuestion = (index, field, value) => {
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }))
  }

  const removeQuestion = (index) => {
    if (newSurvey.questions.length <= 1) return
    setNewSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }))
  }

  const getStatusColor = (status) => {
    const colors = { draft: 'gray', active: 'green', closed: 'blue' }
    return colors[status] || 'gray'
  }

  const getTypeLabel = (type) => {
    const labels = { csat: 'CSAT', nps: 'NPS', custom: 'Custom' }
    return labels[type] || type
  }

  const calculateNPS = (responsesData) => {
    if (!responsesData || responsesData.length === 0) return null
    const scores = responsesData.map(r => r.score || r.rating || 0)
    const promoters = scores.filter(s => s >= 9).length
    const detractors = scores.filter(s => s <= 6).length
    const total = scores.length
    if (total === 0) return null
    return Math.round(((promoters - detractors) / total) * 100)
  }

  if (loading && surveys.length === 0) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Customer Surveys"
        description="Manage CSAT, NPS, and custom surveys"
        breadcrumbs={[
          { label: 'CRM', path: '/admin/crm' },
          { label: 'Surveys' },
        ]}
        actions={
          <Button icon={Plus} onClick={() => setShowNewModal(true)}>
            New Survey
          </Button>
        }
      />

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#FDF8F4', borderRadius: '12px' }}>
                <ClipboardList style={{ width: '24px', height: '24px', color: '#C59C82' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Total Surveys</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{stats.totalSurveys}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#fffbeb', borderRadius: '12px' }}>
                <Star style={{ width: '24px', height: '24px', color: '#d97706' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Avg Score</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{stats.averageScore.toFixed(1)}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#ecfdf5', borderRadius: '12px' }}>
                <BarChart3 style={{ width: '24px', height: '24px', color: '#059669' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Response Rate</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#059669', margin: 0 }}>{stats.responseRate}%</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#eff6ff', borderRadius: '12px' }}>
                <TrendingUp style={{ width: '24px', height: '24px', color: '#2563eb' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>NPS Score</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb', margin: 0 }}>
                  {stats.npsScore !== null ? stats.npsScore : '--'}
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Surveys Table */}
      <Card>
        <Card.Header title="Surveys" />
        <Card.Content style={{ padding: 20 }}>
          <div style={{ marginBottom: '16px' }}>
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search surveys..."
            />
          </div>

          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {surveys.length === 0 ? (
            <EmptyState
              title="No surveys yet"
              description="Create your first survey to start collecting feedback."
            />
          ) : (
            <>
              <Table>
                <Table.Header>
                  <Table.Row hover={false}>
                    <Table.Head>Survey Name</Table.Head>
                    <Table.Head>Type</Table.Head>
                    <Table.Head>Status</Table.Head>
                    <Table.Head>Responses</Table.Head>
                    <Table.Head>Avg Score</Table.Head>
                    <Table.Head>Created</Table.Head>
                    <Table.Head style={{ textAlign: 'right' }}>Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {surveys.map((survey) => (
                    <Table.Row key={survey._id}>
                      <Table.Cell>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                          {survey.title || survey.name || '-'}
                        </span>
                        {survey.description && (
                          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                            {survey.description.length > 60 ? survey.description.slice(0, 60) + '...' : survey.description}
                          </p>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="purple">{getTypeLabel(survey.type)}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getStatusColor(survey.status)} dot>
                          {survey.status || 'draft'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{survey.responseCount || survey.responses?.length || 0}</Table.Cell>
                      <Table.Cell>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                          {survey.averageScore ? survey.averageScore.toFixed(1) : '-'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{formatDate(survey.createdAt)}</Table.Cell>
                      <Table.Cell style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleViewResponses(survey)}
                        >
                          Responses
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>

              {pagination.totalPages > 1 && (
                <div style={{ marginTop: '16px' }}>
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                  />
                </div>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {/* New Survey Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create New Survey"
        description="Set up a new customer survey"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Survey Title"
            value={newSurvey.title}
            onChange={(e) => setNewSurvey(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Post-Project Satisfaction Survey"
          />

          <Select
            label="Survey Type"
            value={newSurvey.type}
            onChange={(e) => setNewSurvey(prev => ({ ...prev, type: e.target.value }))}
          >
            <option value="csat">CSAT (Customer Satisfaction)</option>
            <option value="nps">NPS (Net Promoter Score)</option>
            <option value="custom">Custom</option>
          </Select>

          <Textarea
            label="Description"
            value={newSurvey.description}
            onChange={(e) => setNewSurvey(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this survey..."
            rows={3}
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Questions</p>
              <Button variant="ghost" size="sm" icon={Plus} onClick={addQuestion}>
                Add Question
              </Button>
            </div>

            {newSurvey.questions.map((q, index) => (
              <div key={index} style={{
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                marginBottom: '12px',
                border: '1px solid #f1f5f9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
                    Question {index + 1}
                  </span>
                  {newSurvey.questions.length > 1 && (
                    <button
                      onClick={() => removeQuestion(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <Input
                  value={q.questionText}
                  onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                  placeholder="Enter your question..."
                  style={{ marginBottom: '8px' }}
                />

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Select
                    value={q.questionType}
                    onChange={(e) => updateQuestion(index, 'questionType', e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="rating">Rating (1-5)</option>
                    <option value="text">Text Response</option>
                    <option value="choice">Multiple Choice</option>
                  </Select>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                      style={{ accentColor: '#C59C82' }}
                    />
                    Required
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Modal.Footer>
          <Button variant="ghost" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleCreateSurvey} disabled={saving || !newSurvey.title.trim()}>
            {saving ? 'Creating...' : 'Create Survey'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Responses Modal */}
      <Modal
        isOpen={showResponsesModal}
        onClose={() => { setShowResponsesModal(false); setSelectedSurvey(null); setResponses([]); }}
        title={selectedSurvey ? `Responses: ${selectedSurvey.title || selectedSurvey.name}` : 'Responses'}
        size="xl"
      >
        {loadingResponses ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading responses...</div>
        ) : responses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No responses yet</div>
        ) : (
          <div>
            {/* Response Summary */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Total Responses</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '4px 0 0 0' }}>{responses.length}</p>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Avg Score</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#C59C82', margin: '4px 0 0 0' }}>
                  {responses.length > 0
                    ? (responses.reduce((sum, r) => sum + (r.score || r.rating || 0), 0) / responses.length).toFixed(1)
                    : '-'
                  }
                </p>
              </div>
              {selectedSurvey?.type === 'nps' && (
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>NPS Score</p>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb', margin: '4px 0 0 0' }}>
                    {calculateNPS(responses) ?? '--'}
                  </p>
                </div>
              )}
            </div>

            {/* Responses Table */}
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>Respondent</Table.Head>
                  <Table.Head>Score</Table.Head>
                  <Table.Head>Feedback</Table.Head>
                  <Table.Head>Date</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {responses.map((resp, index) => (
                  <Table.Row key={resp._id || index}>
                    <Table.Cell>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>
                        {resp.respondentName || resp.customerName || resp.email || 'Anonymous'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{
                        fontWeight: '700',
                        color: (resp.score || resp.rating || 0) >= 4 ? '#059669' : (resp.score || resp.rating || 0) >= 3 ? '#d97706' : '#dc2626',
                      }}>
                        {resp.score || resp.rating || '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ color: '#475569', fontSize: '13px' }}>
                        {resp.feedback || resp.comment || '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>{formatDate(resp.submittedAt || resp.createdAt)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}

        <Modal.Footer>
          <Button variant="ghost" onClick={() => { setShowResponsesModal(false); setSelectedSurvey(null); setResponses([]); }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Surveys
