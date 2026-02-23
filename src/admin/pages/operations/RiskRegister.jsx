import { useState, useEffect } from 'react'
import { ShieldAlert, Plus, AlertTriangle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { riskRegisterAPI } from '../../utils/api'

const PROBABILITY_LABELS = { 1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High' }
const IMPACT_LABELS = { 1: 'Negligible', 2: 'Minor', 3: 'Moderate', 4: 'Major', 5: 'Severe' }

const getHeatmapColor = (score) => {
  if (score >= 20) return '#DC2626'
  if (score >= 15) return '#EA580C'
  if (score >= 10) return '#F59E0B'
  if (score >= 5) return '#FBBF24'
  return '#22C55E'
}

const getHeatmapBg = (score) => {
  if (score >= 20) return '#FEE2E2'
  if (score >= 15) return '#FFEDD5'
  if (score >= 10) return '#FEF3C7'
  if (score >= 5) return '#FEF9C3'
  return '#DCFCE7'
}

const RiskRegister = () => {
  const [risks, setRisks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [dashboard, setDashboard] = useState(null)

  // New risk modal
  const [showNewModal, setShowNewModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    project: '',
    category: 'operational',
    description: '',
    probability: 3,
    impact: 3,
    mitigation: '',
    owner: '',
  })

  useEffect(() => {
    loadRisks()
    loadDashboard()
  }, [pagination.page, search, severityFilter, projectFilter])

  const loadRisks = async () => {
    setLoading(true)
    try {
      const res = await riskRegisterAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(severityFilter && { severity: severityFilter }),
        ...(projectFilter && { projectId: projectFilter }),
      })
      setRisks(res.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.pagination?.total || 0,
        totalPages: res.pagination?.pages || 1,
      }))
    } catch (err) {
      console.error('Failed to load risks:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    try {
      const res = await riskRegisterAPI.getDashboard()
      setDashboard(res.data || res)
    } catch (err) {
      console.error('Failed to load risk dashboard:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      project: '',
      category: 'operational',
      description: '',
      probability: 3,
      impact: 3,
      mitigation: '',
      owner: '',
    })
  }

  const handleCreate = async () => {
    if (!formData.description) {
      alert('Please enter a risk description')
      return
    }
    setSaving(true)
    try {
      await riskRegisterAPI.create({
        ...formData,
        probability: Number(formData.probability),
        impact: Number(formData.impact),
      })
      setShowNewModal(false)
      resetForm()
      loadRisks()
      loadDashboard()
    } catch (err) {
      alert(err.message || 'Failed to create risk')
    } finally {
      setSaving(false)
    }
  }

  // Build heatmap data from risks
  const buildHeatmap = () => {
    const grid = {}
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        grid[`${p}-${i}`] = 0
      }
    }
    risks.forEach(risk => {
      const key = `${risk.probability}-${risk.impact}`
      if (grid[key] !== undefined) {
        grid[key]++
      }
    })
    return grid
  }

  const heatmap = buildHeatmap()

  const statusColors = {
    open: 'red',
    mitigated: 'green',
    monitoring: 'yellow',
    closed: 'gray',
    accepted: 'blue',
  }

  const severityLabel = (score) => {
    if (score >= 20) return 'Critical'
    if (score >= 15) return 'High'
    if (score >= 10) return 'Medium'
    if (score >= 5) return 'Low'
    return 'Very Low'
  }

  const severityColor = (score) => {
    if (score >= 20) return 'red'
    if (score >= 15) return 'red'
    if (score >= 10) return 'yellow'
    if (score >= 5) return 'blue'
    return 'green'
  }

  return (
    <div>
      <PageHeader
        title="Risk Register"
        description="Identify, assess, and mitigate project risks"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Operations' }, { label: 'Risk Register' }]}
        actions={<Button icon={Plus} onClick={() => { resetForm(); setShowNewModal(true) }}>New Risk</Button>}
      />

      {/* Dashboard Cards */}
      {dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <Card>
            <Card.Content style={{ padding: 16 }}>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#111827' }}>{dashboard.totalRisks || 0}</p>
              <p style={{ fontSize: 13, color: '#6B7280' }}>Total Risks</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content style={{ padding: 16 }}>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#DC2626' }}>{dashboard.critical || 0}</p>
              <p style={{ fontSize: 13, color: '#6B7280' }}>Critical</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content style={{ padding: 16 }}>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#F59E0B' }}>{dashboard.high || 0}</p>
              <p style={{ fontSize: 13, color: '#6B7280' }}>High</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Content style={{ padding: 16 }}>
              <p style={{ fontSize: 24, fontWeight: 600, color: '#16A34A' }}>{dashboard.mitigated || 0}</p>
              <p style={{ fontSize: 13, color: '#6B7280' }}>Mitigated</p>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Risk Heatmap */}
      <Card style={{ marginBottom: 24 }}>
        <Card.Header title="Risk Heatmap" />
        <Card.Content style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Y-axis label */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
              PROBABILITY
            </div>
            <div style={{ flex: 1 }}>
              {/* Grid rows: probability 5 at top, 1 at bottom */}
              {[5, 4, 3, 2, 1].map((prob) => (
                <div key={prob} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <div style={{ width: 60, fontSize: 11, color: '#6B7280', textAlign: 'right', paddingRight: 8 }}>
                    {PROBABILITY_LABELS[prob]}
                  </div>
                  {[1, 2, 3, 4, 5].map((imp) => {
                    const score = prob * imp
                    const count = heatmap[`${prob}-${imp}`] || 0
                    return (
                      <div
                        key={imp}
                        style={{
                          flex: 1,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 6,
                          background: count > 0 ? getHeatmapColor(score) : getHeatmapBg(score),
                          color: count > 0 ? '#FFFFFF' : getHeatmapColor(score),
                          fontSize: 14,
                          fontWeight: count > 0 ? 700 : 500,
                          border: `1px solid ${getHeatmapColor(score)}33`,
                          cursor: 'default',
                          minWidth: 48,
                        }}
                        title={`P:${prob} x I:${imp} = ${score} | ${count} risk(s)`}
                      >
                        {count > 0 ? count : score}
                      </div>
                    )
                  })}
                </div>
              ))}
              {/* X-axis labels */}
              <div style={{ display: 'flex', marginTop: 8, paddingLeft: 64 }}>
                {[1, 2, 3, 4, 5].map((imp) => (
                  <div key={imp} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#6B7280', minWidth: 48 }}>
                    {IMPACT_LABELS[imp]}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 4, fontSize: 12, fontWeight: 600, color: '#6B7280' }}>
                IMPACT
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }} padding="sm">
        <div style={{ display: 'flex', gap: 16, padding: 16, flexWrap: 'wrap' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search risks..."
            style={{ flex: 1, maxWidth: 320 }}
          />
          <Input
            placeholder="Filter by Project ID"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <Select
            options={[
              { value: '', label: 'All Severities' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          />
        </div>
      </Card>

      {/* Risk Table */}
      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : risks.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title="No risks found"
            description="Add risks to the register to track and mitigate them"
            actionLabel="New Risk"
            onAction={() => { resetForm(); setShowNewModal(true) }}
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Risk ID</Table.Head>
                  <Table.Head>Project</Table.Head>
                  <Table.Head>Description</Table.Head>
                  <Table.Head>Probability</Table.Head>
                  <Table.Head>Impact</Table.Head>
                  <Table.Head>Score</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Owner</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {risks.map((risk) => {
                  const score = (risk.probability || 1) * (risk.impact || 1)
                  return (
                    <Table.Row key={risk._id}>
                      <Table.Cell>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#C59C82' }}>
                          {risk.riskId || `R-${risk._id?.slice(-6)}`}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: 14, color: '#111827' }}>
                          {risk.project?.name || risk.project || '-'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ maxWidth: 200 }}>
                          <p style={{ fontSize: 14, color: '#111827' }}>{risk.description}</p>
                          <p style={{ fontSize: 12, color: '#6B7280', textTransform: 'capitalize' }}>{risk.category}</p>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: 14, color: '#374151' }}>
                          {risk.probability} - {PROBABILITY_LABELS[risk.probability] || ''}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: 14, color: '#374151' }}>
                          {risk.impact} - {IMPACT_LABELS[risk.impact] || ''}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: getHeatmapColor(score),
                            color: '#FFF',
                            fontSize: 12,
                            fontWeight: 700,
                          }}>
                            {score}
                          </div>
                          <Badge color={severityColor(score)}>
                            {severityLabel(score)}
                          </Badge>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={statusColors[risk.status] || 'gray'}>
                          {(risk.status || 'open').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ fontSize: 14, color: '#374151' }}>
                          {risk.owner?.name || risk.owner || '-'}
                        </span>
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
          </>
        )}
      </Card>

      {/* New Risk Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="New Risk"
        description="Add a new risk to the register"
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <Input
              label="Project ID"
              placeholder="Enter project ID"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
            />
          </div>
          <div>
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'operational', label: 'Operational' },
                { value: 'financial', label: 'Financial' },
                { value: 'technical', label: 'Technical' },
                { value: 'schedule', label: 'Schedule' },
                { value: 'resource', label: 'Resource' },
                { value: 'external', label: 'External' },
              ]}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea
              label="Risk Description"
              placeholder="Describe the risk in detail"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Select
              label={`Probability (${formData.probability} - ${PROBABILITY_LABELS[formData.probability]})`}
              value={formData.probability}
              onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              options={[
                { value: 1, label: '1 - Very Low' },
                { value: 2, label: '2 - Low' },
                { value: 3, label: '3 - Medium' },
                { value: 4, label: '4 - High' },
                { value: 5, label: '5 - Very High' },
              ]}
            />
          </div>
          <div>
            <Select
              label={`Impact (${formData.impact} - ${IMPACT_LABELS[formData.impact]})`}
              value={formData.impact}
              onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
              options={[
                { value: 1, label: '1 - Negligible' },
                { value: 2, label: '2 - Minor' },
                { value: 3, label: '3 - Moderate' },
                { value: 4, label: '4 - Major' },
                { value: 5, label: '5 - Severe' },
              ]}
            />
          </div>
          <div style={{
            gridColumn: '1 / -1',
            padding: 12,
            borderRadius: 8,
            background: getHeatmapBg(Number(formData.probability) * Number(formData.impact)),
            border: `1px solid ${getHeatmapColor(Number(formData.probability) * Number(formData.impact))}44`,
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: getHeatmapColor(Number(formData.probability) * Number(formData.impact)) }}>
              Risk Score: {Number(formData.probability) * Number(formData.impact)} ({severityLabel(Number(formData.probability) * Number(formData.impact))})
            </span>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea
              label="Mitigation Strategy"
              placeholder="Describe how this risk will be mitigated"
              value={formData.mitigation}
              onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <Input
              label="Risk Owner"
              placeholder="Responsible person"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            />
          </div>
        </div>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewModal(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Add Risk'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default RiskRegister
