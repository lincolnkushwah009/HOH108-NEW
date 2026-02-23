import { useState, useEffect, useCallback } from 'react'
import { mdmAPI } from '../../utils/api'
import { useToast } from '../../components/ui'
import {
  Database, RefreshCw, Search, Download, Upload, Link2, Shield, Activity,
  ChevronDown, ChevronRight, ArrowUpDown, AlertTriangle, CheckCircle2,
  XCircle, Clock, Eye, Layers, GitBranch, BarChart3, Zap, Settings,
  FileText, Users, Package, Briefcase, Building2, IndianRupee, Factory,
  ShoppingCart, Target, Filter, X, ExternalLink, ChevronLeft
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'entities', label: 'Entity Registry', icon: Database },
  { id: 'records', label: 'Golden Records', icon: Layers },
  { id: 'mappings', label: 'ID Mappings', icon: GitBranch },
  { id: 'quality', label: 'Data Quality', icon: Target },
  { id: 'audit', label: 'Audit Trail', icon: Activity },
]

const CATEGORY_CONFIG = {
  party_master: { label: 'Party Masters', color: '#3B82F6', icon: Users, bg: '#EFF6FF' },
  item_master: { label: 'Item Masters', color: '#8B5CF6', icon: Package, bg: '#F5F3FF' },
  employee_master: { label: 'Employee Masters', color: '#EC4899', icon: Users, bg: '#FDF2F8' },
  financial_master: { label: 'Financial Masters', color: '#F59E0B', icon: IndianRupee, bg: '#FFFBEB' },
  location_master: { label: 'Location Masters', color: '#14B8A6', icon: Building2, bg: '#F0FDFA' },
  project_master: { label: 'Project Masters', color: '#6366F1', icon: Briefcase, bg: '#EEF2FF' },
  document_master: { label: 'Document Masters', color: '#EF4444', icon: FileText, bg: '#FEF2F2' },
  configuration: { label: 'Configuration', color: '#6B7280', icon: Settings, bg: '#F9FAFB' },
}

const MODULE_LABELS = {
  o2c: 'Order to Cash', p2p: 'Procure to Pay', h2r: 'Hire to Retire',
  inventory: 'Inventory', ppc: 'Production', project: 'Projects',
  finance: 'Finance', crm: 'CRM', core: 'Core'
}

const STATUS_COLORS = {
  active: '#22C55E', inactive: '#9CA3AF', pending_review: '#F59E0B',
  merged: '#8B5CF6', archived: '#6B7280',
  synced: '#22C55E', pending: '#F59E0B', error: '#EF4444', stale: '#9CA3AF'
}

const QUALITY_COLORS = { high: '#22C55E', medium: '#F59E0B', low: '#EF4444' }

// ==================== Sub-Components ====================

const StatCard = ({ icon: Icon, label, value, sub, color = '#3B82F6', bgColor }) => (
  <div style={{ background: bgColor || '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #E5E7EB', flex: 1, minWidth: 160 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
      <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>}
  </div>
)

const Badge = ({ label, color = '#6B7280' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, background: `${color}15`, color, letterSpacing: 0.3
  }}>{label}</span>
)

const QualityBar = ({ score, width = 120 }) => {
  const color = score >= 80 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width, height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 32 }}>{score}%</span>
    </div>
  )
}

const EmptyState = ({ icon: Icon, title, description, action, actionLabel }) => (
  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
    <div style={{ width: 64, height: 64, borderRadius: 16, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
      <Icon size={28} color="#9CA3AF" />
    </div>
    <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 13, marginBottom: 16 }}>{description}</div>
    {action && (
      <button onClick={action} style={{
        padding: '8px 20px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff',
        fontSize: 13, fontWeight: 600, cursor: 'pointer'
      }}>{actionLabel}</button>
    )}
  </div>
)

// Record Detail Modal
const RecordDetailModal = ({ record, onClose }) => {
  if (!record) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1, borderRadius: '16px 16px 0 0' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{record.displayName || 'Record Detail'}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{record.entityCode} / {record.sourceHumanId || record.displayId}</div>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Status & Quality */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Status</div>
              <Badge label={record.status?.toUpperCase()} color={STATUS_COLORS[record.status] || '#6B7280'} />
            </div>
            <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Quality Score</div>
              <QualityBar score={record.qualityScore || 0} />
            </div>
            <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Completeness</div>
              <QualityBar score={record.completeness || 0} />
            </div>
            <div style={{ flex: 1, minWidth: 140, padding: 16, borderRadius: 10, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>Sync Status</div>
              <Badge label={record.syncStatus?.toUpperCase()} color={STATUS_COLORS[record.syncStatus] || '#6B7280'} />
            </div>
          </div>

          {/* Golden Record Fields */}
          {record.fieldValues && record.fieldValues.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Golden Record Fields</div>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                {record.fieldValues.map((fv, i) => (
                  <div key={i} style={{ display: 'flex', padding: '10px 16px', background: i % 2 === 0 ? '#fff' : '#F9FAFB', borderBottom: i < record.fieldValues.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <div style={{ flex: 1, fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{fv.fieldName}</div>
                    <div style={{ flex: 2, fontSize: 13, color: '#111827' }}>{String(fv.value ?? '-')}</div>
                    <div style={{ width: 60, textAlign: 'right' }}>
                      <span style={{ fontSize: 11, color: fv.confidence >= 80 ? '#22C55E' : '#F59E0B' }}>{fv.confidence}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cross-References */}
          {record.mappings && record.mappings.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Cross-References ({record.mappings.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {record.mappings.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <Link2 size={14} color="#6B7280" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                      {m.sourceEntity === record.entityCode ? m.targetEntity : m.sourceEntity}
                    </span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {m.sourceEntity === record.entityCode ? (m.targetHumanId || m.targetDisplayName) : (m.sourceHumanId || m.sourceDisplayName)}
                    </span>
                    <Badge label={m.relationship?.replace(/_/g, ' ')} color="#6366F1" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Version History */}
          {record.versions && record.versions.length > 0 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#374151' }}>Version History</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {record.versions.slice(-10).reverse().map((v, i) => (
                  <div key={i} style={{ padding: '10px 16px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>v{v.versionNumber}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF' }}>{v.createdByName} · {new Date(v.createdAt).toLocaleDateString()}</span>
                    </div>
                    {v.changes?.map((c, j) => (
                      <div key={j} style={{ fontSize: 12, color: '#6B7280' }}>
                        {c.fieldName}: <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>{String(c.oldValue || '-')}</span> → <span style={{ color: '#22C55E' }}>{String(c.newValue || '-')}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// ==================== Main Component ====================

const MDMDashboard = () => {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Dashboard State
  const [dashboard, setDashboard] = useState(null)

  // Entities State
  const [entities, setEntities] = useState([])
  const [entityFilter, setEntityFilter] = useState('')
  const [expandedCategories, setExpandedCategories] = useState({})

  // Records State
  const [records, setRecords] = useState([])
  const [recordsPagination, setRecordsPagination] = useState({})
  const [recordFilters, setRecordFilters] = useState({ entityCode: '', status: '', search: '', page: 1 })
  const [selectedRecord, setSelectedRecord] = useState(null)

  // Mappings State
  const [mappings, setMappings] = useState([])
  const [mappingsPagination, setMappingsPagination] = useState({})
  const [mappingFilters, setMappingFilters] = useState({ sourceEntity: '', targetEntity: '', page: 1 })

  // Quality State
  const [quality, setQuality] = useState(null)

  // Audit State
  const [audits, setAudits] = useState([])
  const [auditPagination, setAuditPagination] = useState({})
  const [auditFilters, setAuditFilters] = useState({ entityCode: '', action: '', page: 1 })

  // Load data based on active tab
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await mdmAPI.getDashboard()
      if (res.success) setDashboard(res.data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const loadEntities = useCallback(async () => {
    try {
      setLoading(true)
      const res = await mdmAPI.getEntities()
      if (res.success) setEntities(res.data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (recordFilters.entityCode) params.entityCode = recordFilters.entityCode
      if (recordFilters.status) params.status = recordFilters.status
      if (recordFilters.search) params.search = recordFilters.search
      params.page = recordFilters.page
      params.limit = 30
      const res = await mdmAPI.getRecords(params)
      if (res.success) {
        setRecords(res.data)
        setRecordsPagination(res.pagination)
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, recordFilters])

  const loadMappings = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page: mappingFilters.page, limit: 30 }
      if (mappingFilters.sourceEntity) params.sourceEntity = mappingFilters.sourceEntity
      if (mappingFilters.targetEntity) params.targetEntity = mappingFilters.targetEntity
      const res = await mdmAPI.getMappings(params)
      if (res.success) {
        setMappings(res.data)
        setMappingsPagination(res.pagination)
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, mappingFilters])

  const loadQuality = useCallback(async () => {
    try {
      setLoading(true)
      const res = await mdmAPI.getQuality()
      if (res.success) setQuality(res.data)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const loadAudit = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page: auditFilters.page, limit: 30 }
      if (auditFilters.entityCode) params.entityCode = auditFilters.entityCode
      if (auditFilters.action) params.action = auditFilters.action
      const res = await mdmAPI.getAudit(params)
      if (res.success) {
        setAudits(res.data)
        setAuditPagination(res.pagination)
      }
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast, auditFilters])

  useEffect(() => {
    if (activeTab === 'overview') loadDashboard()
    else if (activeTab === 'entities') loadEntities()
    else if (activeTab === 'records') loadRecords()
    else if (activeTab === 'mappings') loadMappings()
    else if (activeTab === 'quality') loadQuality()
    else if (activeTab === 'audit') loadAudit()
  }, [activeTab, loadDashboard, loadEntities, loadRecords, loadMappings, loadQuality, loadAudit])

  // Actions
  const handleSeedEntities = async () => {
    try {
      setSyncing(true)
      const res = await mdmAPI.seedEntities(false)
      addToast(res.message || 'Entity registry seeded', 'success')
      loadEntities()
      loadDashboard()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncAll = async () => {
    try {
      setSyncing(true)
      addToast('Seeding entity registry & starting full sync...', 'info')
      // Step 1: Ensure entity registry is seeded
      await mdmAPI.seedEntities(false).catch(() => {})
      // Step 2: Full sync all entities
      const res = await mdmAPI.syncAll()
      const synced = res.data?.filter(r => r.status === 'synced').length || 0
      const totalCreated = res.data?.reduce((sum, r) => sum + (r.created || 0), 0) || 0
      const totalUpdated = res.data?.reduce((sum, r) => sum + (r.updated || 0), 0) || 0
      addToast(`Sync complete: ${synced} entities, ${totalCreated} created, ${totalUpdated} updated`, 'success')
      // Step 3: Auto-discover cross-references
      await mdmAPI.autoDiscover().catch(() => {})
      // Reload all data
      loadDashboard()
      loadEntities()
      if (activeTab === 'records') loadRecords()
      if (activeTab === 'mappings') loadMappings()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncEntity = async (entityCode) => {
    try {
      setSyncing(true)
      const res = await mdmAPI.syncEntity(entityCode)
      addToast(res.message, 'success')
      loadEntities()
      if (activeTab === 'records') loadRecords()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleAutoDiscover = async () => {
    try {
      setSyncing(true)
      const res = await mdmAPI.autoDiscover()
      addToast(res.message, 'success')
      loadMappings()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSyncing(false)
    }
  }

  const handleViewRecord = async (id) => {
    try {
      const res = await mdmAPI.getRecord(id)
      if (res.success) setSelectedRecord(res.data)
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  // Group entities by category
  const groupedEntities = entities.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = []
    acc[e.category].push(e)
    return acc
  }, {})

  const filteredGroups = entityFilter
    ? Object.entries(groupedEntities).reduce((acc, [cat, ents]) => {
        const filtered = ents.filter(e =>
          e.entityName.toLowerCase().includes(entityFilter.toLowerCase()) ||
          e.entityCode.toLowerCase().includes(entityFilter.toLowerCase())
        )
        if (filtered.length > 0) acc[cat] = filtered
        return acc
      }, {})
    : groupedEntities

  // ==================== RENDER TABS ====================

  const renderOverview = () => {
    if (!dashboard) return <EmptyState icon={Database} title="No Data Yet" description="Seed the entity registry and sync master data to see the dashboard" action={handleSeedEntities} actionLabel="Seed Entity Registry" />

    const { totalEntities, totalMasterRecords, totalMappings, duplicateCount, avgQualityScore, avgCompleteness, qualityDistribution, sourceEntityCounts } = dashboard

    return (
      <div>
        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatCard icon={Database} label="Registered Entities" value={totalEntities} color="#3B82F6" />
          <StatCard icon={Layers} label="Golden Records" value={totalMasterRecords} color="#8B5CF6" />
          <StatCard icon={GitBranch} label="ID Mappings" value={totalMappings} color="#14B8A6" />
          <StatCard icon={Target} label="Avg Quality" value={`${avgQualityScore}%`} sub={`${avgCompleteness}% completeness`} color={avgQualityScore >= 80 ? '#22C55E' : avgQualityScore >= 50 ? '#F59E0B' : '#EF4444'} />
          <StatCard icon={AlertTriangle} label="Duplicates" value={duplicateCount} color="#EF4444" />
        </div>

        {/* Quality Distribution */}
        {qualityDistribution && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Data Quality Distribution</div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              {[
                { label: 'High (80-100%)', value: qualityDistribution.high || 0, color: QUALITY_COLORS.high },
                { label: 'Medium (50-79%)', value: qualityDistribution.medium || 0, color: QUALITY_COLORS.medium },
                { label: 'Low (<50%)', value: qualityDistribution.low || 0, color: QUALITY_COLORS.low }
              ].map((q, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: 16, borderRadius: 10, background: `${q.color}08`, border: `1px solid ${q.color}25` }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: q.color }}>{q.value}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{q.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Entity Counts */}
        {sourceEntityCounts && sourceEntityCounts.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Master Data Records by Entity</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {sourceEntityCounts.filter(e => e.count > 0).sort((a, b) => b.count - a.count).map((e, i) => {
                const catConf = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG.configuration
                const CatIcon = catConf.icon
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: catConf.bg, border: `1px solid ${catConf.color}25` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${catConf.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CatIcon size={16} color={catConf.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{e.entityName}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{e.entityCode}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: catConf.color }}>{e.count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Audit */}
        {dashboard.recentAudits && dashboard.recentAudits.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent MDM Activity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dashboard.recentAudits.slice(0, 10).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                  <Activity size={14} color="#6B7280" />
                  <span style={{ fontSize: 12, color: '#374151', flex: 1 }}>{a.description}</span>
                  <Badge label={a.action} color="#6366F1" />
                  <span style={{ fontSize: 11, color: '#9CA3AF', minWidth: 80, textAlign: 'right' }}>{a.performedByName}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', minWidth: 90, textAlign: 'right' }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderEntities = () => {
    if (entities.length === 0) {
      return <EmptyState icon={Database} title="Entity Registry Empty" description="Seed the default entity registry to register all master data entities" action={handleSeedEntities} actionLabel="Seed Entity Registry" />
    }

    return (
      <div>
        {/* Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              placeholder="Search entities..."
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }}
            />
          </div>
          <button onClick={handleSeedEntities} disabled={syncing} style={{
            padding: '10px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151'
          }}>
            <Upload size={14} />
            Re-seed Registry
          </button>
        </div>

        {/* Grouped Entities */}
        {Object.entries(filteredGroups).map(([cat, ents]) => {
          const catConf = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.configuration
          const CatIcon = catConf.icon
          const isExpanded = expandedCategories[cat] !== false

          return (
            <div key={cat} style={{ marginBottom: 16, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div
                onClick={() => toggleCategory(cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer',
                  background: catConf.bg, borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none'
                }}
              >
                {isExpanded ? <ChevronDown size={16} color="#6B7280" /> : <ChevronRight size={16} color="#6B7280" />}
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${catConf.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CatIcon size={16} color={catConf.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{catConf.label}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 8 }}>({ents.length})</span>
                </div>
              </div>

              {isExpanded && (
                <div>
                  {ents.map((entity, i) => (
                    <div key={entity.entityCode} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px 12px 56px',
                      borderBottom: i < ents.length - 1 ? '1px solid #F3F4F6' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ flex: 2 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{entity.entityName}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{entity.description?.substring(0, 80)}</div>
                      </div>
                      <div style={{ width: 100 }}>
                        <Badge label={entity.entityCode} color={catConf.color} />
                      </div>
                      <div style={{ width: 100 }}>
                        <Badge label={MODULE_LABELS[entity.primaryModule] || entity.primaryModule} color="#6366F1" />
                      </div>
                      <div style={{ width: 80 }}>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>{entity.mongoModel}</span>
                      </div>
                      <div style={{ width: 80, textAlign: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{entity.stats?.totalRecords || 0}</span>
                      </div>
                      <div style={{ width: 60, textAlign: 'center' }}>
                        {entity.isCritical && <Badge label="Critical" color="#EF4444" />}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSyncEntity(entity.entityCode) }}
                        disabled={syncing}
                        style={{
                          padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff',
                          fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280'
                        }}
                      >
                        <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> Sync
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderRecords = () => {
    return (
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              value={recordFilters.search}
              onChange={(e) => setRecordFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              placeholder="Search records..."
              style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none' }}
            />
          </div>
          <select
            value={recordFilters.entityCode}
            onChange={(e) => setRecordFilters(f => ({ ...f, entityCode: e.target.value, page: 1 }))}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', background: '#fff' }}
          >
            <option value="">All Entities</option>
            {(dashboard?.entities || entities).map(e => (
              <option key={e.code || e.entityCode} value={e.code || e.entityCode}>{e.name || e.entityName}</option>
            ))}
          </select>
          <select
            value={recordFilters.status}
            onChange={(e) => setRecordFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', background: '#fff' }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending_review">Pending Review</option>
            <option value="merged">Merged</option>
          </select>
          <button onClick={() => handleSyncAll()} disabled={syncing} style={{
            padding: '10px 16px', borderRadius: 8, border: 'none', background: '#3B82F6', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: syncing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: syncing ? 0.7 : 1
          }}>
            <RefreshCw size={14} style={syncing ? { animation: 'spin 1s linear infinite' } : {}} /> {syncing ? 'Syncing...' : 'Sync All'}
          </button>
        </div>

        {/* Records Table */}
        {records.length === 0 ? (
          <EmptyState icon={Layers} title="No Golden Records" description="Sync master data to create golden records" action={handleSyncAll} actionLabel="Sync All Entities" />
        ) : (
          <>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' }}>Entity</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' }}>Record ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' }}>Category</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' }}>Quality</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' }}>Sync</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((rec, i) => (
                      <tr key={rec._id} style={{ borderBottom: '1px solid #F3F4F6' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <td style={{ padding: '10px 16px' }}>
                          <Badge label={rec.entityCode} color={(CATEGORY_CONFIG[entities.find(e => e.entityCode === rec.entityCode)?.category] || { color: '#6B7280' }).color} />
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 500, color: '#3B82F6', fontFamily: 'monospace' }}>
                          {rec.sourceHumanId || rec.displayId || '-'}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                          {rec.displayName || '-'}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#6B7280' }}>
                          {rec.displayCategory || '-'}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <QualityBar score={rec.qualityScore || 0} width={80} />
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <Badge label={rec.status} color={STATUS_COLORS[rec.status] || '#6B7280'} />
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <Badge label={rec.syncStatus} color={STATUS_COLORS[rec.syncStatus] || '#6B7280'} />
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <button onClick={() => handleViewRecord(rec._id)} style={{
                            padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff',
                            fontSize: 11, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6B7280'
                          }}>
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {recordsPagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                <button
                  onClick={() => setRecordFilters(f => ({ ...f, page: f.page - 1 }))}
                  disabled={recordFilters.page <= 1}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer', opacity: recordFilters.page <= 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ padding: '6px 12px', fontSize: 12, color: '#6B7280' }}>
                  Page {recordsPagination.page} of {recordsPagination.pages} ({recordsPagination.total} records)
                </span>
                <button
                  onClick={() => setRecordFilters(f => ({ ...f, page: f.page + 1 }))}
                  disabled={recordFilters.page >= recordsPagination.pages}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer', opacity: recordFilters.page >= recordsPagination.pages ? 0.5 : 1 }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const renderMappings = () => {
    return (
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={mappingFilters.sourceEntity}
            onChange={(e) => setMappingFilters(f => ({ ...f, sourceEntity: e.target.value, page: 1 }))}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', background: '#fff' }}
          >
            <option value="">All Source Entities</option>
            {(dashboard?.entities || entities).map(e => (
              <option key={e.code || e.entityCode} value={e.code || e.entityCode}>{e.name || e.entityName}</option>
            ))}
          </select>
          <select
            value={mappingFilters.targetEntity}
            onChange={(e) => setMappingFilters(f => ({ ...f, targetEntity: e.target.value, page: 1 }))}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', background: '#fff' }}
          >
            <option value="">All Target Entities</option>
            {(dashboard?.entities || entities).map(e => (
              <option key={e.code || e.entityCode} value={e.code || e.entityCode}>{e.name || e.entityName}</option>
            ))}
          </select>
          <button onClick={handleAutoDiscover} disabled={syncing} style={{
            padding: '10px 16px', borderRadius: 8, border: 'none', background: '#8B5CF6', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: syncing ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto'
          }}>
            <Zap size={14} /> Auto-Discover Mappings
          </button>
        </div>

        {mappings.length === 0 ? (
          <EmptyState icon={GitBranch} title="No ID Mappings" description="Auto-discover cross-references between entities or create them manually" action={handleAutoDiscover} actionLabel="Discover Mappings" />
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    {['Source Entity', 'Source ID', 'Source Name', '', 'Target Entity', 'Target ID', 'Target Name', 'Relationship', 'Module'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: i === 3 ? 'center' : 'left', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m, i) => (
                    <tr key={m._id} style={{ borderBottom: '1px solid #F3F4F6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                    >
                      <td style={{ padding: '10px 16px' }}><Badge label={m.sourceEntity} color="#3B82F6" /></td>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'monospace', color: '#3B82F6' }}>{m.sourceHumanId || '-'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#374151' }}>{m.sourceDisplayName || '-'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}><Link2 size={14} color="#9CA3AF" /></td>
                      <td style={{ padding: '10px 16px' }}><Badge label={m.targetEntity} color="#8B5CF6" /></td>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'monospace', color: '#8B5CF6' }}>{m.targetHumanId || '-'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#374151' }}>{m.targetDisplayName || '-'}</td>
                      <td style={{ padding: '10px 16px' }}><Badge label={m.relationship?.replace(/_/g, ' ')} color="#14B8A6" /></td>
                      <td style={{ padding: '10px 16px' }}><Badge label={MODULE_LABELS[m.module] || m.module} color="#6366F1" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mappingsPagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button onClick={() => setMappingFilters(f => ({ ...f, page: f.page - 1 }))} disabled={mappingFilters.page <= 1}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer', opacity: mappingFilters.page <= 1 ? 0.5 : 1 }}><ChevronLeft size={14} /></button>
            <span style={{ padding: '6px 12px', fontSize: 12, color: '#6B7280' }}>Page {mappingsPagination.page} of {mappingsPagination.pages}</span>
            <button onClick={() => setMappingFilters(f => ({ ...f, page: f.page + 1 }))} disabled={mappingFilters.page >= mappingsPagination.pages}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer', opacity: mappingFilters.page >= mappingsPagination.pages ? 0.5 : 1 }}><ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    )
  }

  const renderQuality = () => {
    if (!quality) return <EmptyState icon={Target} title="No Quality Data" description="Sync golden records first to see data quality metrics" />

    const { overall, byEntity, issuesByType, lowQualityRecords } = quality

    return (
      <div>
        {/* Overall Quality Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard icon={Target} label="Overall Quality" value={`${Math.round(overall.avgQuality || 0)}%`} color={overall.avgQuality >= 80 ? '#22C55E' : overall.avgQuality >= 50 ? '#F59E0B' : '#EF4444'} />
          <StatCard icon={CheckCircle2} label="Completeness" value={`${Math.round(overall.avgCompleteness || 0)}%`} color="#3B82F6" />
          <StatCard icon={AlertTriangle} label="Open Issues" value={overall.totalIssues || 0} color="#F59E0B" />
        </div>

        {/* Issues by Type */}
        {issuesByType && issuesByType.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Open Issues by Type</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {issuesByType.map((issue, i) => (
                <div key={i} style={{ padding: '12px 20px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FDE68A', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}>{issue.count}</div>
                  <div style={{ fontSize: 12, color: '#92400E', textTransform: 'capitalize' }}>{issue._id || 'Unknown'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quality by Entity */}
        {byEntity && byEntity.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Quality by Entity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {byEntity.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', borderRadius: 8, background: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                  <Badge label={e._id} color="#3B82F6" />
                  <span style={{ fontSize: 12, color: '#6B7280', width: 80 }}>{e.totalRecords} records</span>
                  <QualityBar score={Math.round(e.avgQuality || 0)} width={200} />
                  <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 'auto' }}>
                    Completeness: {Math.round(e.avgCompleteness || 0)}%
                  </span>
                  {e.duplicates > 0 && <Badge label={`${e.duplicates} dups`} color="#EF4444" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Quality Records */}
        {lowQualityRecords && lowQualityRecords.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} /> Low Quality Records (below 50%)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {lowQualityRecords.map((rec, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                  <Badge label={rec.entityCode} color="#EF4444" />
                  <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{rec.displayName || rec.displayId}</span>
                  <QualityBar score={rec.qualityScore || 0} width={100} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderAudit = () => {
    return (
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select
            value={auditFilters.entityCode}
            onChange={(e) => setAuditFilters(f => ({ ...f, entityCode: e.target.value, page: 1 }))}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', background: '#fff' }}
          >
            <option value="">All Entities</option>
            {(dashboard?.entities || entities).map(e => (
              <option key={e.code || e.entityCode} value={e.code || e.entityCode}>{e.name || e.entityName}</option>
            ))}
          </select>
          <select
            value={auditFilters.action}
            onChange={(e) => setAuditFilters(f => ({ ...f, action: e.target.value, page: 1 }))}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13, outline: 'none', background: '#fff' }}
          >
            <option value="">All Actions</option>
            {['create', 'update', 'delete', 'sync', 'merge', 'link', 'approve', 'quality_check'].map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>

        {audits.length === 0 ? (
          <EmptyState icon={Activity} title="No Audit Records" description="MDM actions will be logged here automatically" />
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            {audits.map((audit, i) => {
              const actionColors = {
                create: '#22C55E', update: '#3B82F6', delete: '#EF4444', sync: '#8B5CF6',
                merge: '#F59E0B', link: '#14B8A6', approve: '#22C55E', quality_check: '#6366F1',
                golden_record_created: '#22C55E', golden_record_updated: '#3B82F6'
              }
              return (
                <div key={audit._id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px',
                  borderBottom: i < audits.length - 1 ? '1px solid #F3F4F6' : 'none'
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${actionColors[audit.action] || '#6B7280'}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2
                  }}>
                    <Activity size={14} color={actionColors[audit.action] || '#6B7280'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#374151', marginBottom: 4 }}>{audit.description}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Badge label={audit.entityCode} color="#3B82F6" />
                      <Badge label={audit.action.replace(/_/g, ' ')} color={actionColors[audit.action] || '#6B7280'} />
                      {audit.sourceHumanId && <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>{audit.sourceHumanId}</span>}
                    </div>
                    {audit.changes && audit.changes.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        {audit.changes.slice(0, 3).map((c, j) => (
                          <div key={j} style={{ fontSize: 11, color: '#6B7280' }}>
                            {c.fieldName}: <span style={{ color: '#EF4444' }}>{String(c.oldValue || '-')}</span> → <span style={{ color: '#22C55E' }}>{String(c.newValue || '-')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{audit.performedByName}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(audit.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {auditPagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button onClick={() => setAuditFilters(f => ({ ...f, page: f.page - 1 }))} disabled={auditFilters.page <= 1}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer', opacity: auditFilters.page <= 1 ? 0.5 : 1 }}><ChevronLeft size={14} /></button>
            <span style={{ padding: '6px 12px', fontSize: 12, color: '#6B7280' }}>Page {auditPagination.page} of {auditPagination.pages}</span>
            <button onClick={() => setAuditFilters(f => ({ ...f, page: f.page + 1 }))} disabled={auditFilters.page >= auditPagination.pages}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12, cursor: 'pointer', opacity: auditFilters.page >= auditPagination.pages ? 0.5 : 1 }}><ChevronRight size={14} /></button>
          </div>
        )}
      </div>
    )
  }

  // ==================== MAIN RENDER ====================

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={26} color="#3B82F6" />
            Master Data Management
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
            Centralized registry, golden records, ID mapping & data governance across all modules
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={async () => { setSyncing(true); await mdmAPI.refreshStats().catch(() => {}); setSyncing(false); loadDashboard() }} disabled={syncing} style={{
            padding: '10px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151'
          }}>
            <RefreshCw size={14} /> Refresh Stats
          </button>
          <button onClick={handleSyncAll} disabled={syncing} style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: syncing ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(59,130,246,0.3)'
          }}>
            <Zap size={14} /> {syncing ? 'Syncing...' : 'Full Sync'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F3F4F6', borderRadius: 10, padding: 4, overflow: 'auto' }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 8,
                border: 'none', background: isActive ? '#fff' : 'transparent',
                color: isActive ? '#3B82F6' : '#6B7280', fontSize: 13, fontWeight: isActive ? 600 : 500,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <div style={{ fontSize: 13 }}>Loading...</div>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'entities' && renderEntities()}
          {activeTab === 'records' && renderRecords()}
          {activeTab === 'mappings' && renderMappings()}
          {activeTab === 'quality' && renderQuality()}
          {activeTab === 'audit' && renderAudit()}
        </>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />}

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default MDMDashboard
