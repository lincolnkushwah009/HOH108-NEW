import { useState, useEffect } from 'react'
import { BarChart3, Flame, Sun, Snowflake, RefreshCw, Calculator } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const LeadScoring = () => {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [recalculating, setRecalculating] = useState(false)
  const [calculatingId, setCalculatingId] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  const [stats, setStats] = useState({
    averageScore: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
  })

  useEffect(() => {
    loadScoredLeads()
  }, [pagination.page, search])

  const loadScoredLeads = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      })
      if (search) params.set('search', search)

      const response = await apiRequest(`/core/lead-scoring?${params.toString()}`)
      const rawData = response.data || []

      // Map LeadScore documents to a flat shape the UI expects
      const data = rawData.map(item => ({
        _id: item.lead?._id || item._id,
        scoreId: item._id,
        name: item.lead?.name || '-',
        leadName: item.lead?.name || '-',
        phone: item.lead?.phone || '',
        email: item.lead?.email || '',
        source: item.lead?.source || '-',
        score: item.totalScore || 0,
        grade: item.grade || '-',
        assignedTo: item.lead?.assignedTo || null,
        assignedToName: item.lead?.assignedTo?.name || '',
        lastActivity: item.updatedAt,
        updatedAt: item.updatedAt,
      }))

      setLeads(data)
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || data.length || 0,
        totalPages: response.pagination?.pages || Math.ceil((data.length || 0) / prev.limit) || 1,
      }))

      // Calculate stats from mapped data
      const hot = data.filter(l => l.score > 80).length
      const warm = data.filter(l => l.score >= 50 && l.score <= 80).length
      const cold = data.filter(l => l.score < 50).length
      const avg = data.length > 0 ? Math.round(data.reduce((sum, l) => sum + (l.score || 0), 0) / data.length) : 0

      setStats({
        averageScore: avg,
        hotLeads: hot,
        warmLeads: warm,
        coldLeads: cold,
      })
    } catch (err) {
      console.error('Failed to load scored leads:', err)
      setError('Failed to load lead scores')
    } finally {
      setLoading(false)
    }
  }

  const handleRecalculateAll = async () => {
    setRecalculating(true)
    try {
      await apiRequest('/core/lead-scoring/bulk-calculate', { method: 'POST' })
      await loadScoredLeads()
    } catch (err) {
      console.error('Failed to recalculate scores:', err)
      setError('Failed to recalculate scores')
    } finally {
      setRecalculating(false)
    }
  }

  const handleCalculateSingle = async (leadId) => {
    setCalculatingId(leadId)
    try {
      const response = await apiRequest(`/core/lead-scoring/calculate/${leadId}`, { method: 'POST' })
      const updated = response.data || response
      setLeads(prev => prev.map(l =>
        l._id === leadId ? { ...l, score: updated.totalScore || l.score, grade: updated.grade || l.grade } : l
      ))
    } catch (err) {
      console.error('Failed to calculate score:', err)
    } finally {
      setCalculatingId(null)
    }
  }

  const getScoreColor = (score) => {
    if (score > 80) return '#059669'
    if (score >= 50) return '#d97706'
    return '#dc2626'
  }

  const getScoreLabel = (score) => {
    if (score > 80) return 'Hot'
    if (score >= 50) return 'Warm'
    return 'Cold'
  }

  const getScoreBadgeColor = (score) => {
    if (score > 80) return 'green'
    if (score >= 50) return 'yellow'
    return 'red'
  }

  const getGradeColor = (grade) => {
    const colors = { A: 'green', B: 'blue', C: 'yellow', D: 'red' }
    return colors[grade] || 'gray'
  }

  const filteredLeads = search
    ? leads.filter(l =>
        (l.name || l.leadName || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.source || '').toLowerCase().includes(search.toLowerCase())
      )
    : leads

  if (loading && leads.length === 0) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Lead Scoring"
        description="Score and prioritize leads based on engagement and profile data"
        breadcrumbs={[
          { label: 'CRM', path: '/admin/crm' },
          { label: 'Lead Scoring' },
        ]}
        actions={
          <Button
            icon={RefreshCw}
            onClick={handleRecalculateAll}
            disabled={recalculating}
          >
            {recalculating ? 'Recalculating...' : 'Recalculate All'}
          </Button>
        }
      />

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#FDF8F4', borderRadius: '12px' }}>
                <BarChart3 style={{ width: '24px', height: '24px', color: '#C59C82' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Average Score</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>{stats.averageScore}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#ecfdf5', borderRadius: '12px' }}>
                <Flame style={{ width: '24px', height: '24px', color: '#059669' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Hot Leads</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#059669', margin: 0 }}>{stats.hotLeads}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#fffbeb', borderRadius: '12px' }}>
                <Sun style={{ width: '24px', height: '24px', color: '#d97706' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Warm Leads</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#d97706', margin: 0 }}>{stats.warmLeads}</p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', backgroundColor: '#fef2f2', borderRadius: '12px' }}>
                <Snowflake style={{ width: '24px', height: '24px', color: '#dc2626' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Cold Leads</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626', margin: 0 }}>{stats.coldLeads}</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Lead Scores Table */}
      <Card>
        <Card.Header title="Scored Leads" />
        <Card.Content style={{ padding: 20 }}>
          <div style={{ marginBottom: '16px' }}>
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name or source..."
            />
          </div>

          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {filteredLeads.length === 0 ? (
            <EmptyState
              title="No scored leads"
              description="Lead scores will appear here once calculated."
            />
          ) : (
            <>
              <Table>
                <Table.Header>
                  <Table.Row hover={false}>
                    <Table.Head>Lead Name</Table.Head>
                    <Table.Head>Source</Table.Head>
                    <Table.Head>Score</Table.Head>
                    <Table.Head>Grade</Table.Head>
                    <Table.Head>Category</Table.Head>
                    <Table.Head>Last Activity</Table.Head>
                    <Table.Head>Assigned To</Table.Head>
                    <Table.Head style={{ textAlign: 'right' }}>Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredLeads.map((lead) => (
                    <Table.Row key={lead._id}>
                      <Table.Cell>
                        <span style={{ fontWeight: '600', color: '#1e293b' }}>
                          {lead.name || lead.leadName || '-'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{lead.source || '-'}</Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '60px',
                            height: '6px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: '3px',
                            overflow: 'hidden',
                          }}>
                            <div style={{
                              width: `${Math.min(lead.score || 0, 100)}%`,
                              height: '100%',
                              backgroundColor: getScoreColor(lead.score),
                              borderRadius: '3px',
                              transition: 'width 0.3s ease',
                            }} />
                          </div>
                          <span style={{ fontWeight: '700', color: getScoreColor(lead.score), fontSize: '14px' }}>
                            {lead.score || 0}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getGradeColor(lead.grade)}>
                          {lead.grade || '-'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getScoreBadgeColor(lead.score)} dot>
                          {getScoreLabel(lead.score)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{formatDate(lead.lastActivity || lead.updatedAt)}</Table.Cell>
                      <Table.Cell>{lead.assignedTo?.name || lead.assignedToName || '-'}</Table.Cell>
                      <Table.Cell style={{ textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Calculator}
                          onClick={() => handleCalculateSingle(lead._id)}
                          disabled={calculatingId === lead._id}
                        >
                          {calculatingId === lead._id ? 'Calculating...' : 'Calculate'}
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
    </div>
  )
}

export default LeadScoring
