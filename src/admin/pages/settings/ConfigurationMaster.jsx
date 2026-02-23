import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Settings, Search, Plus, ChevronRight, ChevronDown, Edit, Trash2,
  Save, Database, Shield, Target, BarChart3, RefreshCw, Info,
  Eye, PenLine, Trash, FileDown, ClipboardCheck, FolderTree,
  Layers, GitBranch, Activity, CheckSquare, ListTodo, Code2,
  Building2, AlertTriangle, X
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Badge, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { useAuth } from '../../context/AuthContext'
import { useCompany } from '../../context/CompanyContext'

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVEL_CONFIG = {
  module:   { color: '#3B82F6', bg: '#EFF6FF', label: 'Module',   icon: Layers },
  phase:    { color: '#10B981', bg: '#ECFDF5', label: 'Phase',    icon: GitBranch },
  process:  { color: '#F59E0B', bg: '#FFFBEB', label: 'Process',  icon: Activity },
  activity: { color: '#8B5CF6', bg: '#F5F3FF', label: 'Activity', icon: CheckSquare },
  task:     { color: '#6B7280', bg: '#F3F4F6', label: 'Task',     icon: ListTodo },
}

const PERMISSION_COLUMNS = [
  { key: 'create',  label: 'Create',  icon: Plus },
  { key: 'read',    label: 'Read',    icon: Eye },
  { key: 'update',  label: 'Update',  icon: PenLine },
  { key: 'delete',  label: 'Delete',  icon: Trash },
  { key: 'approve', label: 'Approve', icon: ClipboardCheck },
  { key: 'export',  label: 'Export',  icon: FileDown },
]

const CHILD_LEVEL_MAP = {
  module: 'phase',
  phase: 'process',
  process: 'activity',
  activity: 'task',
}

// ─── Helper: API Fetch ───────────────────────────────────────────────────────

const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('hoh108_admin_token')
  const companyId = localStorage.getItem('hoh108_active_company')
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Company-Id': companyId || '',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.message || `Request failed (${res.status})`)
  }
  return res.json()
}

// ─── Sub-component: Level Badge ──────────────────────────────────────────────

const LevelBadge = ({ level, size = 'sm' }) => {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.task
  const paddings = { sm: '3px 8px', md: '4px 10px', lg: '5px 12px' }
  const fontSizes = { sm: '10px', md: '11px', lg: '12px' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: paddings[size],
      borderRadius: '6px',
      fontSize: fontSizes[size],
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      background: config.bg,
      color: config.color,
      whiteSpace: 'nowrap',
    }}>
      {config.label}
    </span>
  )
}

// ─── Sub-component: Toggle / Permission Checkbox ─────────────────────────────

const PermissionToggle = ({ checked, onChange, inherited = false }) => (
  <button
    type="button"
    onClick={inherited ? undefined : onChange}
    style={{
      width: '38px',
      height: '20px',
      borderRadius: '10px',
      background: checked
        ? (inherited ? '#d4c4b5' : 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)')
        : '#d1d5db',
      border: 'none',
      cursor: inherited ? 'default' : 'pointer',
      position: 'relative',
      transition: 'background 0.25s ease',
      boxShadow: checked && !inherited ? '0 2px 8px rgba(197,156,130,0.35)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',
      flexShrink: 0,
      opacity: inherited ? 0.65 : 1,
    }}
    title={inherited ? 'Inherited from parent node' : ''}
  >
    <span style={{
      position: 'absolute',
      top: '2px',
      left: checked ? '20px' : '2px',
      width: '16px',
      height: '16px',
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left 0.25s ease',
    }} />
  </button>
)

// ─── Sub-component: Tree Node (Recursive) ────────────────────────────────────

const TreeNode = ({ node, depth = 0, selectedId, onSelect, searchQuery, expandedIds, onToggleExpand }) => {
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selectedId === node._id
  const isExpanded = expandedIds.has(node._id)
  const config = LEVEL_CONFIG[node.level] || LEVEL_CONFIG.task

  // Filter logic: show node if it or any descendant matches search
  const matchesSearch = !searchQuery || node.name?.toLowerCase().includes(searchQuery.toLowerCase())
  const childrenMatch = node.children?.some(child => nodeMatchesSearch(child, searchQuery))
  if (searchQuery && !matchesSearch && !childrenMatch) return null

  return (
    <div>
      <button
        onClick={() => onSelect(node)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 12px',
          paddingLeft: `${12 + depth * 20}px`,
          textAlign: 'left',
          border: 'none',
          borderBottom: '1px solid #f3f4f6',
          cursor: 'pointer',
          transition: 'all 0.15s',
          background: isSelected ? 'linear-gradient(135deg, #FDF8F4 0%, #F5EDE6 100%)' : '#fff',
          borderLeft: isSelected ? `3px solid ${config.color}` : '3px solid transparent',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = '#fafbfc'
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = '#fff'
        }}
      >
        {/* Expand / Collapse */}
        <span
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggleExpand(node._id)
          }}
          style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            borderRadius: '4px',
            cursor: hasChildren ? 'pointer' : 'default',
            color: '#94a3b8',
          }}
        >
          {hasChildren ? (
            isExpanded
              ? <ChevronDown style={{ width: '14px', height: '14px' }} />
              : <ChevronRight style={{ width: '14px', height: '14px' }} />
          ) : (
            <span style={{ width: '14px' }} />
          )}
        </span>

        {/* Level indicator dot */}
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
        }} />

        {/* Node name */}
        <span style={{
          flex: 1,
          fontSize: '13px',
          fontWeight: isSelected ? '600' : '500',
          color: isSelected ? '#111827' : '#374151',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {node.name}
        </span>

        {/* Level badge (compact) */}
        <span style={{
          fontSize: '9px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: config.color,
          opacity: 0.7,
          flexShrink: 0,
        }}>
          {config.label}
        </span>
      </button>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child._id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              searchQuery={searchQuery}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Helper: check if node or any descendant matches search
function nodeMatchesSearch(node, query) {
  if (!query) return true
  if (node.name?.toLowerCase().includes(query.toLowerCase())) return true
  return node.children?.some(child => nodeMatchesSearch(child, query)) || false
}

// Helper: collect all node IDs from tree
function collectAllNodeIds(nodes) {
  const ids = new Set()
  const walk = (list) => {
    list?.forEach(n => {
      ids.add(n._id)
      if (n.children) walk(n.children)
    })
  }
  walk(nodes)
  return ids
}

// Helper: find a node by ID in the tree
function findNodeInTree(nodes, id) {
  for (const n of nodes || []) {
    if (n._id === id) return n
    const found = findNodeInTree(n.children, id)
    if (found) return found
  }
  return null
}

// ─── Main Component ──────────────────────────────────────────────────────────

const ConfigurationMaster = () => {
  const { user } = useAuth()
  const { activeCompany } = useCompany()
  const toast = useToast()

  // Core state
  const [tree, setTree] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [activeTab, setActiveTab] = useState('details')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Permissions state
  const [roles, setRoles] = useState([])
  const [nodePermissions, setNodePermissions] = useState([])
  const [permissionChanges, setPermissionChanges] = useState({})
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(false)

  // KRA/KPI state
  const [kras, setKras] = useState([])
  const [kpis, setKpis] = useState([])
  const [selectedKraId, setSelectedKraId] = useState('')
  const [selectedKpiIds, setSelectedKpiIds] = useState([])
  const [savingKraKpi, setSavingKraKpi] = useState(false)
  const [loadingKraKpi, setLoadingKraKpi] = useState(false)

  // Modal state
  const [showNodeModal, setShowNodeModal] = useState(false)
  const [editingNode, setEditingNode] = useState(null) // null = add, object = edit
  const [addingChildTo, setAddingChildTo] = useState(null) // parent node for add-child
  const [nodeForm, setNodeForm] = useState({ name: '', description: '', code: '' })
  const [savingNode, setSavingNode] = useState(false)

  // Seeding state
  const [seedingHierarchy, setSeedingHierarchy] = useState(false)
  const [seedingPermissions, setSeedingPermissions] = useState(false)

  // ─── Data Loading ─────────────────────────────────────────────────────────

  const loadTree = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await apiFetch('/api/process-config/tree')
      const treeData = data.data || data.tree || data || []
      setTree(Array.isArray(treeData) ? treeData : [])
      // If we had a selected node, refresh it from the new tree
      if (selectedNode) {
        const refreshed = findNodeInTree(Array.isArray(treeData) ? treeData : [], selectedNode._id)
        if (refreshed) setSelectedNode(refreshed)
      }
    } catch (err) {
      console.error('Failed to load tree:', err)
      if (!silent) toast.error('Failed to load configuration tree')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedNode])

  const loadRoles = useCallback(async () => {
    try {
      const companyId = activeCompany?._id || localStorage.getItem('hoh108_active_company')
      const data = await apiFetch(`/api/roles?company=${companyId}`)
      setRoles(data.data || data.roles || data || [])
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }, [activeCompany])

  const loadNodePermissions = useCallback(async (nodeId) => {
    setLoadingPermissions(true)
    try {
      const data = await apiFetch(`/api/role-permissions/by-node/${nodeId}`)
      const perms = data.data || data.permissions || data || []
      setNodePermissions(Array.isArray(perms) ? perms : [])
      setPermissionChanges({})
    } catch (err) {
      console.error('Failed to load permissions:', err)
      setNodePermissions([])
    } finally {
      setLoadingPermissions(false)
    }
  }, [])

  const loadKrasAndKpis = useCallback(async () => {
    setLoadingKraKpi(true)
    try {
      const [kraData, kpiData] = await Promise.all([
        apiFetch('/api/kras'),
        apiFetch('/api/kpi'),
      ])
      setKras(kraData.data || kraData.kras || kraData || [])
      setKpis(kpiData.data || kpiData.kpis || kpiData || [])
    } catch (err) {
      console.error('Failed to load KRAs/KPIs:', err)
    } finally {
      setLoadingKraKpi(false)
    }
  }, [])

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    loadTree()
    loadRoles()
  }, [])

  // When a node is selected, load its permissions and KRA/KPI data
  useEffect(() => {
    if (selectedNode?._id) {
      loadNodePermissions(selectedNode._id)
      // Set KRA/KPI from selected node
      setSelectedKraId(selectedNode.kra?._id || selectedNode.kra || '')
      const kpiIdsList = (selectedNode.kpis || []).map(k => typeof k === 'object' ? k._id : k)
      setSelectedKpiIds(kpiIdsList)
    }
  }, [selectedNode?._id])

  // Load KRAs/KPIs when switching to that tab
  useEffect(() => {
    if (activeTab === 'kra-kpi' && kras.length === 0) {
      loadKrasAndKpis()
    }
  }, [activeTab])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectNode = (node) => {
    setSelectedNode(node)
    setActiveTab('details')
  }

  const handleToggleExpand = (nodeId) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  const handleExpandAll = () => {
    setExpandedIds(collectAllNodeIds(tree))
  }

  const handleCollapseAll = () => {
    setExpandedIds(new Set())
  }

  // ─── Seed Handlers ────────────────────────────────────────────────────────

  const handleSeedHierarchy = async () => {
    setSeedingHierarchy(true)
    try {
      await apiFetch('/api/process-config/seed-defaults', { method: 'POST' })
      toast.success('Default hierarchy seeded successfully')
      await loadTree(true)
    } catch (err) {
      toast.error(err.message || 'Failed to seed defaults')
    } finally {
      setSeedingHierarchy(false)
    }
  }

  const handleSeedPermissions = async () => {
    setSeedingPermissions(true)
    try {
      await apiFetch('/api/role-permissions/seed-defaults', { method: 'POST' })
      toast.success('Default role permissions seeded successfully')
      if (selectedNode?._id) loadNodePermissions(selectedNode._id)
    } catch (err) {
      toast.error(err.message || 'Failed to seed permissions')
    } finally {
      setSeedingPermissions(false)
    }
  }

  // ─── Node CRUD ────────────────────────────────────────────────────────────

  const openAddModuleModal = () => {
    setEditingNode(null)
    setAddingChildTo(null)
    setNodeForm({ name: '', description: '', code: '' })
    setShowNodeModal(true)
  }

  const openAddChildModal = () => {
    if (!selectedNode) return
    setEditingNode(null)
    setAddingChildTo(selectedNode)
    setNodeForm({ name: '', description: '', code: '' })
    setShowNodeModal(true)
  }

  const openEditNodeModal = () => {
    if (!selectedNode) return
    setEditingNode(selectedNode)
    setAddingChildTo(null)
    setNodeForm({
      name: selectedNode.name || '',
      description: selectedNode.description || '',
      code: selectedNode.code || '',
    })
    setShowNodeModal(true)
  }

  const handleSaveNode = async (e) => {
    e.preventDefault()
    if (!nodeForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSavingNode(true)
    try {
      if (editingNode) {
        // Update existing node
        await apiFetch(`/api/process-config/${editingNode._id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: nodeForm.name.trim(),
            description: nodeForm.description.trim(),
            code: nodeForm.code.trim(),
          }),
        })
        toast.success('Node updated successfully')
      } else if (addingChildTo) {
        // Add child to selected node
        const childLevel = CHILD_LEVEL_MAP[addingChildTo.level]
        if (!childLevel) {
          toast.error('Cannot add children to task-level nodes')
          setSavingNode(false)
          return
        }
        await apiFetch('/api/process-config', {
          method: 'POST',
          body: JSON.stringify({
            name: nodeForm.name.trim(),
            description: nodeForm.description.trim(),
            code: nodeForm.code.trim(),
            level: childLevel,
            parent: addingChildTo._id,
          }),
        })
        toast.success('Child node added successfully')
        // Expand parent so user can see the new child
        setExpandedIds(prev => new Set([...prev, addingChildTo._id]))
      } else {
        // Add new top-level module
        await apiFetch('/api/process-config', {
          method: 'POST',
          body: JSON.stringify({
            name: nodeForm.name.trim(),
            description: nodeForm.description.trim(),
            code: nodeForm.code.trim(),
            level: 'module',
          }),
        })
        toast.success('Module created successfully')
      }
      setShowNodeModal(false)
      await loadTree(true)
    } catch (err) {
      toast.error(err.message || 'Failed to save node')
    } finally {
      setSavingNode(false)
    }
  }

  const handleDeleteNode = async () => {
    if (!selectedNode) return
    if (selectedNode.children && selectedNode.children.length > 0) {
      toast.error('Cannot delete a node that has children. Remove children first.')
      return
    }
    if (!confirm(`Are you sure you want to delete "${selectedNode.name}"?`)) return
    try {
      await apiFetch(`/api/process-config/${selectedNode._id}`, { method: 'DELETE' })
      toast.success('Node deleted successfully')
      setSelectedNode(null)
      await loadTree(true)
    } catch (err) {
      toast.error(err.message || 'Failed to delete node')
    }
  }

  // ─── Permission Handlers ──────────────────────────────────────────────────

  const getPermissionValue = (roleId, permKey) => {
    // Check local changes first
    const changeKey = `${roleId}_${permKey}`
    if (permissionChanges[changeKey] !== undefined) return permissionChanges[changeKey]
    // Then check loaded permissions
    const rolePerm = nodePermissions.find(p => (p.role?._id || p.role) === roleId)
    if (rolePerm) {
      return rolePerm.permissions?.[permKey] || false
    }
    return false
  }

  const getPermissionInherited = (roleId, permKey) => {
    const rolePerm = nodePermissions.find(p => (p.role?._id || p.role) === roleId)
    if (rolePerm) {
      return rolePerm.inherited?.[permKey] || false
    }
    return false
  }

  const handlePermissionToggle = (roleId, permKey) => {
    const current = getPermissionValue(roleId, permKey)
    setPermissionChanges(prev => ({
      ...prev,
      [`${roleId}_${permKey}`]: !current,
    }))
  }

  const hasPermissionChanges = Object.keys(permissionChanges).length > 0

  const handleSavePermissions = async () => {
    if (!selectedNode?._id) return
    setSavingPermissions(true)
    try {
      // Build bulk payload: array of { role, processConfig, permissions }
      const permissionsByRole = {}

      // Start with existing permissions
      nodePermissions.forEach(p => {
        const roleId = p.role?._id || p.role
        permissionsByRole[roleId] = { ...(p.permissions || {}) }
      })

      // Apply changes
      Object.entries(permissionChanges).forEach(([key, value]) => {
        const [roleId, permKey] = key.split('_')
        if (!permissionsByRole[roleId]) permissionsByRole[roleId] = {}
        permissionsByRole[roleId][permKey] = value
      })

      // Also include roles that may not have had permissions before
      roles.forEach(r => {
        if (!permissionsByRole[r._id]) {
          permissionsByRole[r._id] = {}
          PERMISSION_COLUMNS.forEach(col => {
            const changeKey = `${r._id}_${col.key}`
            if (permissionChanges[changeKey] !== undefined) {
              permissionsByRole[r._id][col.key] = permissionChanges[changeKey]
            }
          })
        }
      })

      const bulkData = Object.entries(permissionsByRole).map(([roleId, perms]) => ({
        role: roleId,
        processConfig: selectedNode._id,
        permissions: perms,
      }))

      await apiFetch('/api/role-permissions/bulk', {
        method: 'POST',
        body: JSON.stringify({ permissions: bulkData }),
      })

      toast.success('Permissions saved successfully')
      setPermissionChanges({})
      loadNodePermissions(selectedNode._id)
    } catch (err) {
      toast.error(err.message || 'Failed to save permissions')
    } finally {
      setSavingPermissions(false)
    }
  }

  // ─── KRA/KPI Handlers ────────────────────────────────────────────────────

  const handleKpiToggle = (kpiId) => {
    setSelectedKpiIds(prev =>
      prev.includes(kpiId) ? prev.filter(id => id !== kpiId) : [...prev, kpiId]
    )
  }

  const handleSaveKraKpi = async () => {
    if (!selectedNode?._id) return
    setSavingKraKpi(true)
    try {
      await apiFetch(`/api/process-config/${selectedNode._id}/kra-kpi`, {
        method: 'PUT',
        body: JSON.stringify({
          kra: selectedKraId || null,
          kpis: selectedKpiIds,
        }),
      })
      toast.success('KRA/KPI mapping saved successfully')
      await loadTree(true)
    } catch (err) {
      toast.error(err.message || 'Failed to save KRA/KPI mapping')
    } finally {
      setSavingKraKpi(false)
    }
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  const treeIsEmpty = tree.length === 0 && !loading
  const canAddChild = selectedNode && selectedNode.level !== 'task'
  const canDelete = selectedNode && (!selectedNode.children || selectedNode.children.length === 0)

  const modalTitle = editingNode
    ? `Edit ${LEVEL_CONFIG[editingNode.level]?.label || 'Node'}`
    : addingChildTo
      ? `Add ${LEVEL_CONFIG[CHILD_LEVEL_MAP[addingChildTo.level]]?.label || 'Child'} to "${addingChildTo.name}"`
      : 'Add Module'

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading && tree.length === 0) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Configuration Master"
        description="Manage hierarchical process configuration, permissions, and KRA/KPI mappings"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Settings' },
          { label: 'Configuration Master' },
        ]}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {treeIsEmpty && (
              <Button
                variant="outline"
                icon={Database}
                onClick={handleSeedHierarchy}
                loading={seedingHierarchy}
              >
                Seed Default Hierarchy
              </Button>
            )}
            <Button
              variant="secondary"
              icon={Shield}
              onClick={handleSeedPermissions}
              loading={seedingPermissions}
              size="sm"
            >
              Seed Role Permissions
            </Button>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: '24px', paddingBottom: '32px', minHeight: 'calc(100vh - 200px)' }}>

        {/* ─── Left Panel: Tree ─────────────────────────────────────────── */}
        <div style={{ width: '35%', flexShrink: 0 }}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            position: 'sticky',
            top: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 160px)',
          }}>
            {/* Tree Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderTree style={{ width: '18px', height: '18px', color: '#C59C82' }} />
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827' }}>Process Hierarchy</span>
                </div>
                <button
                  onClick={() => loadTree(true)}
                  style={{
                    padding: '6px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s',
                  }}
                  title="Refresh tree"
                >
                  <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', height: '16px', width: '16px', color: '#9ca3af' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search nodes..."
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '14px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    fontSize: '13px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                    outline: 'none',
                    color: '#111827',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#C59C82'
                    e.target.style.boxShadow = '0 0 0 3px rgba(197,156,130,0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Expand/Collapse + Count */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>
                  {tree.length} module{tree.length !== 1 ? 's' : ''}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={handleExpandAll}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}
                    title="Expand all"
                  >
                    Expand
                  </button>
                  <button
                    onClick={handleCollapseAll}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}
                    title="Collapse all"
                  >
                    Collapse
                  </button>
                </div>
              </div>
            </div>

            {/* Tree Nodes */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {tree.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                  <FolderTree style={{ height: '40px', width: '40px', color: '#d1d5db', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '14px', color: '#9ca3af', margin: '0 0 4px 0' }}>No configuration nodes</p>
                  <p style={{ fontSize: '12px', color: '#d1d5db', margin: 0 }}>Seed defaults or add a module to get started</p>
                </div>
              ) : (
                tree.map(node => (
                  <TreeNode
                    key={node._id}
                    node={node}
                    depth={0}
                    selectedId={selectedNode?._id}
                    onSelect={handleSelectNode}
                    searchQuery={searchQuery}
                    expandedIds={expandedIds}
                    onToggleExpand={handleToggleExpand}
                  />
                ))
              )}
            </div>

            {/* Add Module Button */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6' }}>
              <Button
                variant="outline"
                icon={Plus}
                onClick={openAddModuleModal}
                size="sm"
                style={{ width: '100%' }}
              >
                Add Module
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Right Panel: Detail ──────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selectedNode ? (
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              {/* Node Header */}
              <div style={{
                padding: '24px 32px',
                background: 'linear-gradient(135deg, #FEFCFA 0%, #FDF8F4 100%)',
                borderBottom: '1px solid #F5EDE6',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: LEVEL_CONFIG[selectedNode.level]?.bg || '#f3f4f6',
                      border: `2px solid ${LEVEL_CONFIG[selectedNode.level]?.color || '#6B7280'}`,
                    }}>
                      {(() => {
                        const IconComp = LEVEL_CONFIG[selectedNode.level]?.icon || ListTodo
                        return <IconComp style={{ width: '24px', height: '24px', color: LEVEL_CONFIG[selectedNode.level]?.color || '#6B7280' }} />
                      })()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
                          {selectedNode.name}
                        </h2>
                        <LevelBadge level={selectedNode.level} size="md" />
                      </div>
                      {selectedNode.code && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: '6px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#9ca3af',
                          background: '#f3f4f6',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                        }}>
                          {selectedNode.code}
                        </span>
                      )}
                      {selectedNode.description && (
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 0 0', lineHeight: '1.5' }}>
                          {selectedNode.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={openEditNodeModal}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        cursor: 'pointer',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      title="Edit node"
                    >
                      <Edit size={16} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={handleDeleteNode}
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          border: '1px solid #fecaca',
                          background: '#fff',
                          cursor: 'pointer',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}
                        title="Delete node"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ borderBottom: '1px solid #e5e7eb', padding: '0 32px' }}>
                <nav style={{ display: 'flex', gap: '0' }}>
                  {[
                    { id: 'details', label: 'Details', icon: Info },
                    { id: 'permissions', label: 'Permissions', icon: Shield },
                    { id: 'kra-kpi', label: 'KRA / KPI', icon: Target },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '14px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        background: 'none',
                        border: 'none',
                        borderBottom: '2px solid transparent',
                        borderBottomColor: activeTab === tab.id ? '#C59C82' : 'transparent',
                        color: activeTab === tab.id ? '#C59C82' : '#6b7280',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* ─── Tab: Details ──────────────────────────────────────── */}
              {activeTab === 'details' && (
                <div style={{ padding: '28px 32px' }}>
                  {/* Detail grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[
                      { label: 'Code', value: selectedNode.code || 'N/A' },
                      { label: 'Level', value: null, custom: <LevelBadge level={selectedNode.level} size="lg" /> },
                      { label: 'Name', value: selectedNode.name },
                      { label: 'Children', value: selectedNode.children?.length || 0 },
                    ].map(item => (
                      <div key={item.label} style={{
                        padding: '20px',
                        background: '#f9fafb',
                        borderRadius: '14px',
                        border: '1px solid #f3f4f6',
                      }}>
                        <label style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#9ca3af',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {item.label}
                        </label>
                        {item.custom ? (
                          <div style={{ marginTop: '8px' }}>{item.custom}</div>
                        ) : (
                          <p style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: '#111827',
                            margin: '8px 0 0 0',
                          }}>
                            {item.value}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  {selectedNode.description && (
                    <div style={{
                      marginTop: '16px',
                      padding: '20px',
                      borderRadius: '14px',
                      background: '#f9fafb',
                      border: '1px solid #f3f4f6',
                    }}>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        Description
                      </label>
                      <p style={{
                        fontSize: '14px',
                        color: '#374151',
                        margin: '8px 0 0 0',
                        lineHeight: '1.6',
                      }}>
                        {selectedNode.description}
                      </p>
                    </div>
                  )}

                  {/* Departments */}
                  {selectedNode.departments && selectedNode.departments.length > 0 && (
                    <div style={{
                      marginTop: '16px',
                      padding: '20px',
                      borderRadius: '14px',
                      background: '#f9fafb',
                      border: '1px solid #f3f4f6',
                    }}>
                      <label style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        Departments
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                        {selectedNode.departments.map((dept, i) => (
                          <span key={i} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: '#EFF6FF',
                            color: '#2563eb',
                          }}>
                            <Building2 style={{ width: '12px', height: '12px' }} />
                            {typeof dept === 'object' ? dept.name : dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legacy mapping */}
                  {selectedNode.legacyMapping && (
                    <div style={{
                      marginTop: '16px',
                      padding: '20px',
                      borderRadius: '14px',
                      background: '#FFFBEB',
                      border: '1px solid #FEF3C7',
                    }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Info size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#92400E', margin: 0 }}>Legacy Mapping</h4>
                          <p style={{ fontSize: '13px', color: '#B45309', margin: '4px 0 0 0', lineHeight: '1.5' }}>
                            {typeof selectedNode.legacyMapping === 'object'
                              ? JSON.stringify(selectedNode.legacyMapping)
                              : selectedNode.legacyMapping}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Child button */}
                  {canAddChild && (
                    <div style={{ marginTop: '24px' }}>
                      <Button
                        variant="outline"
                        icon={Plus}
                        onClick={openAddChildModal}
                        size="sm"
                      >
                        Add {LEVEL_CONFIG[CHILD_LEVEL_MAP[selectedNode.level]]?.label || 'Child'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Tab: Permissions ──────────────────────────────────── */}
              {activeTab === 'permissions' && (
                <div style={{ padding: '28px 32px' }}>
                  {loadingPermissions ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <RefreshCw size={24} style={{ color: '#C59C82', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                      <p style={{ color: '#9ca3af', marginTop: '12px', fontSize: '14px' }}>Loading permissions...</p>
                    </div>
                  ) : roles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <Shield style={{ width: '40px', height: '40px', color: '#d1d5db', margin: '0 auto 8px' }} />
                      <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>No roles found. Create roles first.</p>
                    </div>
                  ) : (
                    <>
                      {/* Permission Matrix Table */}
                      <div style={{ borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                            <thead>
                              <tr style={{ background: '#f9fafb' }}>
                                <th style={{
                                  padding: '14px 20px',
                                  textAlign: 'left',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#6b7280',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  width: '200px',
                                  position: 'sticky',
                                  left: 0,
                                  background: '#f9fafb',
                                  zIndex: 1,
                                }}>
                                  Role
                                </th>
                                {PERMISSION_COLUMNS.map(col => (
                                  <th key={col.key} style={{
                                    padding: '14px 8px',
                                    textAlign: 'center',
                                    width: '90px',
                                  }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                      <div style={{
                                        height: '28px',
                                        width: '28px',
                                        borderRadius: '8px',
                                        background: '#fff',
                                        border: '1px solid #e5e7eb',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}>
                                        <col.icon size={13} style={{ color: '#9ca3af' }} />
                                      </div>
                                      <span style={{
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        color: '#9ca3af',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                      }}>
                                        {col.label}
                                      </span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {roles.map((role, idx) => (
                                <tr key={role._id} style={{
                                  borderTop: '1px solid #f3f4f6',
                                  background: idx % 2 === 1 ? '#fafbfc' : '#fff',
                                }}>
                                  <td style={{
                                    padding: '14px 20px',
                                    position: 'sticky',
                                    left: 0,
                                    background: idx % 2 === 1 ? '#fafbfc' : '#fff',
                                    zIndex: 1,
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        color: '#A68B6A',
                                        background: '#F5EDE6',
                                        flexShrink: 0,
                                      }}>
                                        {(role.roleName || role.name || '?').charAt(0)}
                                      </div>
                                      <div>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                                          {role.roleName || role.name}
                                        </span>
                                        {role.roleCode && (
                                          <span style={{
                                            display: 'block',
                                            fontSize: '10px',
                                            color: '#9ca3af',
                                            fontFamily: 'monospace',
                                            marginTop: '2px',
                                          }}>
                                            {role.roleCode}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  {PERMISSION_COLUMNS.map(col => {
                                    const isChecked = getPermissionValue(role._id, col.key)
                                    const isInherited = getPermissionInherited(role._id, col.key)
                                    return (
                                      <td key={col.key} style={{ padding: '14px 8px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                          <PermissionToggle
                                            checked={isChecked}
                                            onChange={() => handlePermissionToggle(role._id, col.key)}
                                            inherited={isInherited}
                                          />
                                        </div>
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Legend */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginTop: '16px',
                        fontSize: '12px',
                        color: '#9ca3af',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '24px', height: '12px', borderRadius: '6px', background: 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)' }} />
                          <span>Direct permission</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '24px', height: '12px', borderRadius: '6px', background: '#d4c4b5', opacity: 0.65 }} />
                          <span>Inherited from parent</span>
                        </div>
                      </div>

                      {/* Save bar */}
                      {hasPermissionChanges && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: '24px',
                          padding: '18px 24px',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #FDF8F4 0%, #F5EDE6 100%)',
                          border: '1px solid #DDC5B0',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#C59C82',
                            }} />
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#8B7355' }}>
                              You have unsaved permission changes
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setPermissionChanges({})
                                loadNodePermissions(selectedNode._id)
                              }}
                            >
                              Discard
                            </Button>
                            <Button
                              icon={Save}
                              onClick={handleSavePermissions}
                              loading={savingPermissions}
                              size="sm"
                            >
                              Save Permissions
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ─── Tab: KRA / KPI ────────────────────────────────────── */}
              {activeTab === 'kra-kpi' && (
                <div style={{ padding: '28px 32px' }}>
                  {loadingKraKpi ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                      <RefreshCw size={24} style={{ color: '#C59C82', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                      <p style={{ color: '#9ca3af', marginTop: '12px', fontSize: '14px' }}>Loading KRA/KPI data...</p>
                    </div>
                  ) : (
                    <>
                      {/* Current KRA */}
                      <div style={{ marginBottom: '28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#FEF3C7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Target size={16} style={{ color: '#D97706' }} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Key Result Area (KRA)</h3>
                            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                              Assign a KRA to this process node
                            </p>
                          </div>
                        </div>

                        {/* Current KRA display */}
                        {selectedNode.kra && (
                          <div style={{
                            padding: '14px 16px',
                            background: '#FFFBEB',
                            borderRadius: '12px',
                            border: '1px solid #FEF3C7',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}>
                            <Target size={14} style={{ color: '#D97706' }} />
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#92400E' }}>
                              Current: {typeof selectedNode.kra === 'object' ? selectedNode.kra.name : selectedNode.kra}
                            </span>
                          </div>
                        )}

                        <Select
                          label="Select KRA"
                          value={selectedKraId}
                          onChange={(e) => setSelectedKraId(e.target.value)}
                          placeholder="Choose a KRA..."
                          options={(Array.isArray(kras) ? kras : []).map(k => ({
                            value: k._id,
                            label: k.name || k.title || k.kraName || k._id,
                          }))}
                        />
                      </div>

                      {/* Divider */}
                      <div style={{ height: '1px', background: '#e5e7eb', margin: '28px 0' }} />

                      {/* KPIs */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#DBEAFE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <BarChart3 size={16} style={{ color: '#2563EB' }} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>Key Performance Indicators (KPIs)</h3>
                            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                              Select one or more KPIs to map to this node
                            </p>
                          </div>
                        </div>

                        {/* Current KPIs display */}
                        {selectedNode.kpis && selectedNode.kpis.length > 0 && (
                          <div style={{
                            padding: '14px 16px',
                            background: '#EFF6FF',
                            borderRadius: '12px',
                            border: '1px solid #DBEAFE',
                            marginBottom: '12px',
                          }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#1E40AF', display: 'block', marginBottom: '8px' }}>
                              Currently mapped ({selectedNode.kpis.length}):
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {selectedNode.kpis.map((kpi, i) => (
                                <span key={i} style={{
                                  padding: '3px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  background: '#DBEAFE',
                                  color: '#1D4ED8',
                                }}>
                                  {typeof kpi === 'object' ? (kpi.name || kpi.title || kpi.kpiName) : kpi}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* KPI multi-select as checkboxes */}
                        <div style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '14px',
                          maxHeight: '280px',
                          overflowY: 'auto',
                        }}>
                          {(Array.isArray(kpis) ? kpis : []).length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center' }}>
                              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                                No KPIs available. Create KPIs in the KPI Master first.
                              </p>
                            </div>
                          ) : (
                            (Array.isArray(kpis) ? kpis : []).map((kpi, idx) => {
                              const kpiId = kpi._id
                              const isChecked = selectedKpiIds.includes(kpiId)
                              return (
                                <label
                                  key={kpiId}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderBottom: idx < kpis.length - 1 ? '1px solid #f3f4f6' : 'none',
                                    cursor: 'pointer',
                                    transition: 'background 0.1s',
                                    background: isChecked ? '#EFF6FF' : 'transparent',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isChecked) e.currentTarget.style.background = '#fafbfc'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = isChecked ? '#EFF6FF' : 'transparent'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleKpiToggle(kpiId)}
                                    style={{
                                      width: '16px',
                                      height: '16px',
                                      accentColor: '#C59C82',
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                    }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                                      {kpi.name || kpi.title || kpi.kpiName || kpi._id}
                                    </span>
                                    {kpi.description && (
                                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {kpi.description}
                                      </p>
                                    )}
                                  </div>
                                  {kpi.unit && (
                                    <span style={{
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      color: '#6b7280',
                                      background: '#f3f4f6',
                                      flexShrink: 0,
                                    }}>
                                      {kpi.unit}
                                    </span>
                                  )}
                                </label>
                              )
                            })
                          )}
                        </div>

                        {/* Selected count */}
                        {selectedKpiIds.length > 0 && (
                          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                            {selectedKpiIds.length} KPI{selectedKpiIds.length !== 1 ? 's' : ''} selected
                          </p>
                        )}
                      </div>

                      {/* Save bar */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: '28px',
                        paddingTop: '20px',
                        borderTop: '1px solid #f3f4f6',
                      }}>
                        <Button
                          icon={Save}
                          onClick={handleSaveKraKpi}
                          loading={savingKraKpi}
                        >
                          Save Mapping
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* No node selected */
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              border: '1px solid #e5e7eb',
              padding: '80px 32px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <EmptyState
                icon={Settings}
                title="No node selected"
                description="Select a node from the hierarchy tree to view its details, permissions, and KRA/KPI mappings"
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Add / Edit Node Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={showNodeModal}
        onClose={() => { setShowNodeModal(false); setEditingNode(null); setAddingChildTo(null) }}
        title={modalTitle}
        size="md"
      >
        <form onSubmit={handleSaveNode}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Level indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: '#f9fafb',
              borderRadius: '12px',
            }}>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Level:</span>
              <LevelBadge
                level={
                  editingNode
                    ? editingNode.level
                    : addingChildTo
                      ? CHILD_LEVEL_MAP[addingChildTo.level]
                      : 'module'
                }
                size="md"
              />
              {addingChildTo && (
                <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>
                  Parent: {addingChildTo.name}
                </span>
              )}
            </div>

            <Input
              label="Name"
              value={nodeForm.name}
              onChange={(e) => setNodeForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter node name..."
              required
            />

            <Input
              label="Code"
              value={nodeForm.code}
              onChange={(e) => setNodeForm(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
              placeholder="e.g., SAL_MGMT"
              helper="Unique identifier code (auto-uppercase)"
            />

            <div style={{ width: '100%' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#475569',
                marginBottom: '8px',
              }}>
                Description
              </label>
              <textarea
                value={nodeForm.description}
                onChange={(e) => setNodeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this node..."
                rows={3}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '14px',
                  background: '#f8fafc',
                  color: '#1e293b',
                  border: '2px solid #e2e8f0',
                  borderRadius: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C59C82'
                  e.target.style.background = 'white'
                  e.target.style.boxShadow = '0 0 0 3px rgba(197, 156, 130, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.background = '#f8fafc'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          <Modal.Footer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setShowNodeModal(false); setEditingNode(null); setAddingChildTo(null) }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={savingNode}>
              {editingNode ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ConfigurationMaster
