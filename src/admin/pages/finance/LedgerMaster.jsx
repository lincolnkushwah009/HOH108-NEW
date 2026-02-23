import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Search, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Layers, BookOpen, X } from 'lucide-react'
import { generalLedgerAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Input, useToast } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'

const TABS = [
  { key: 'asset', label: 'Assets', icon: TrendingUp },
  { key: 'liability', label: 'Liabilities', icon: TrendingDown },
  { key: 'expense', label: 'Expenses', icon: Layers },
  { key: 'revenue', label: 'Income', icon: BookOpen },
]

const formatCurrency = (n) => '\u20B9' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })

const LedgerMaster = () => {
  const [activeTab, setActiveTab] = useState('asset')
  const [treeData, setTreeData] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [stats, setStats] = useState({ total: 0, active: 0, assetValue: 0, liabilityValue: 0 })
  const toast = useToast()

  const loadTree = useCallback(async (accountType, isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const response = await generalLedgerAPI.getAccountTree(accountType)
      const data = response.data || response || []
      setTreeData(prev => ({ ...prev, [accountType]: data }))

      // Compute stats from all loaded trees
      if (accountType === 'asset' || isRefresh) {
        computeStats({ ...treeData, [accountType]: data })
      }
    } catch (err) {
      console.error(`Failed to load ${accountType} tree:`, err)
      toast.error(`Failed to load ${accountType} accounts`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [treeData, toast])

  const computeStats = (allTrees) => {
    const countNodes = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return 0
      return nodes.reduce((sum, node) => {
        return sum + 1 + countNodes(node.children)
      }, 0)
    }

    const sumBalance = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return 0
      return nodes.reduce((sum, node) => {
        if (node.children && node.children.length > 0) {
          return sum + sumBalance(node.children)
        }
        return sum + (node.balance?.net || 0)
      }, 0)
    }

    let total = 0
    for (const key of Object.keys(allTrees)) {
      total += countNodes(allTrees[key])
    }

    setStats({
      total,
      active: total,
      assetValue: sumBalance(allTrees.asset || []),
      liabilityValue: sumBalance(allTrees.liability || []),
    })
  }

  useEffect(() => {
    loadAllTrees()
  }, [])

  const loadAllTrees = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled(
        TABS.map(tab => generalLedgerAPI.getAccountTree(tab.key))
      )
      const newTreeData = {}
      TABS.forEach((tab, index) => {
        if (results[index].status === 'fulfilled') {
          const response = results[index].value
          newTreeData[tab.key] = response.data || response || []
        } else {
          newTreeData[tab.key] = []
        }
      })
      setTreeData(newTreeData)
      computeStats(newTreeData)
    } catch (err) {
      console.error('Failed to load trees:', err)
      toast.error('Failed to load chart of accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setSelectedAccount(null)
    loadAllTrees()
  }

  const filterNodes = (nodes, query) => {
    if (!query || !nodes) return nodes
    const lowerQuery = query.toLowerCase()
    return nodes.reduce((filtered, node) => {
      const matchesSelf =
        (node.accountName && node.accountName.toLowerCase().includes(lowerQuery)) ||
        (node.accountCode && node.accountCode.toLowerCase().includes(lowerQuery)) ||
        (node.ledgerCode && node.ledgerCode.toLowerCase().includes(lowerQuery))

      const filteredChildren = filterNodes(node.children, query)
      const hasMatchingChildren = filteredChildren && filteredChildren.length > 0

      if (matchesSelf || hasMatchingChildren) {
        filtered.push({
          ...node,
          children: hasMatchingChildren ? filteredChildren : node.children,
          _forceExpand: hasMatchingChildren && !matchesSelf,
        })
      }
      return filtered
    }, [])
  }

  const currentTree = treeData[activeTab] || []
  const displayTree = searchQuery ? filterNodes(currentTree, searchQuery) : currentTree

  // TreeNode component
  const TreeNode = ({ node, depth = 0 }) => {
    const [expanded, setExpanded] = useState(depth < 2 || !!node._forceExpand)
    const hasChildren = node.children && node.children.length > 0

    useEffect(() => {
      if (node._forceExpand) setExpanded(true)
    }, [node._forceExpand])

    return (
      <div>
        <div
          onClick={() => hasChildren ? setExpanded(!expanded) : setSelectedAccount(node)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', paddingLeft: `${depth * 24 + 12}px`,
            cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
            background: selectedAccount?._id === node._id ? '#FFF5EE' : 'transparent',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => {
            if (selectedAccount?._id !== node._id) e.currentTarget.style.background = '#fafafa'
          }}
          onMouseLeave={e => {
            if (selectedAccount?._id !== node._id) e.currentTarget.style.background = 'transparent'
          }}
        >
          {hasChildren ? (
            expanded
              ? <ChevronDown size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
              : <ChevronRight size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 16, flexShrink: 0 }} />
          )}
          <span style={{ fontWeight: hasChildren ? 600 : 400, fontSize: '14px', color: '#374151', flexShrink: 0 }}>
            {node.accountCode}
          </span>
          <span style={{ flex: 1, fontSize: '14px', color: hasChildren ? '#1F2937' : '#6B7280' }}>
            {node.accountName}
          </span>
          {node.ledgerCode && (
            <span style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: 'monospace', flexShrink: 0 }}>
              {node.ledgerCode}
            </span>
          )}
          {!hasChildren && (
            <span style={{
              fontSize: '14px', fontWeight: 500, flexShrink: 0,
              color: (node.balance?.net || 0) >= 0 ? '#059669' : '#DC2626',
            }}>
              {formatCurrency(node.balance?.net || 0)}
            </span>
          )}
        </div>
        {expanded && hasChildren && node.children.map(child => (
          <TreeNode key={child._id} node={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Ledger Master"
        description="Chart of Accounts - Tree View"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Finance', path: '/admin/finance' },
          { label: 'Ledger Master' },
        ]}
        actions={
          <Button icon={RefreshCw} onClick={handleRefresh} loading={refreshing} variant="secondary">
            Refresh
          </Button>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Card style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Accounts
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
            {stats.total}
          </div>
        </Card>
        <Card style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Accounts
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
            {stats.active}
          </div>
        </Card>
        <Card style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Asset Value
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
            {formatCurrency(stats.assetValue)}
          </div>
        </Card>
        <Card style={{ padding: '18px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Liability Value
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#DC2626', marginTop: '4px' }}>
            {formatCurrency(stats.liabilityValue)}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedAccount ? '1fr 360px' : '1fr', gap: '20px' }}>
        {/* Main Tree Panel */}
        <Card padding="none">
          {/* Tabs */}
          <div style={{
            display: 'flex', borderBottom: '2px solid #f1f5f9',
            padding: '0 16px', gap: '0',
          }}>
            {TABS.map(tab => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSelectedAccount(null) }}
                  style={{
                    padding: '14px 20px', border: 'none', background: 'none',
                    cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                    color: isActive ? '#C59C82' : '#64748b',
                    borderBottom: isActive ? '3px solid #C59C82' : '3px solid transparent',
                    marginBottom: '-2px', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: '8px',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.color = '#475569'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.color = '#64748b'
                  }}
                >
                  <TabIcon size={16} />
                  {tab.label}
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    background: isActive ? 'rgba(197, 156, 130, 0.15)' : '#f1f5f9',
                    color: isActive ? '#C59C82' : '#94a3b8',
                    padding: '2px 8px', borderRadius: '10px',
                  }}>
                    {(treeData[tab.key] || []).length}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
              <Search size={18} style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Search accounts by name, code, or ledger code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 42px',
                  fontSize: '14px', background: '#f8fafc', color: '#1e293b',
                  border: '2px solid #e2e8f0', borderRadius: '12px', outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#C59C82'
                  e.target.style.background = 'white'
                  e.target.style.boxShadow = '0 0 0 3px rgba(197, 156, 130, 0.1)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.background = '#f8fafc'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>

          {/* Tree */}
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {displayTree.length === 0 ? (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                {searchQuery
                  ? `No accounts matching "${searchQuery}"`
                  : 'No accounts found. Seed the Chart of Accounts from Company Master.'
                }
              </div>
            ) : (
              displayTree.map(node => (
                <TreeNode key={node._id} node={node} depth={0} />
              ))
            )}
          </div>
        </Card>

        {/* Detail Panel */}
        {selectedAccount && (
          <Card style={{ padding: '0', alignSelf: 'start', position: 'sticky', top: '20px' }}>
            {/* Detail Header */}
            <div style={{
              padding: '20px', borderBottom: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#C59C82', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Account Detail
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                  {selectedAccount.accountName}
                </div>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                style={{
                  padding: '6px', background: '#f1f5f9', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', color: '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Account Info */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <DetailRow label="Account Code" value={selectedAccount.accountCode} />
                <DetailRow label="Account Name" value={selectedAccount.accountName} />
                {selectedAccount.ledgerCode && (
                  <DetailRow label="Ledger Code" value={selectedAccount.ledgerCode} mono />
                )}
                <DetailRow label="Account Type" value={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '6px' }}>
                    Balance
                  </div>
                  <div style={{
                    fontSize: '22px', fontWeight: 700,
                    color: (selectedAccount.balance?.net || 0) >= 0 ? '#059669' : '#DC2626',
                  }}>
                    {formatCurrency(selectedAccount.balance?.net || 0)}
                  </div>
                </div>
                {selectedAccount.balance && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{
                      padding: '12px', background: 'rgba(16, 185, 129, 0.06)',
                      borderRadius: '10px',
                    }}>
                      <div style={{ fontSize: '11px', color: '#059669', fontWeight: 500 }}>Debit</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#059669', marginTop: '2px' }}>
                        {formatCurrency(selectedAccount.balance?.debit || 0)}
                      </div>
                    </div>
                    <div style={{
                      padding: '12px', background: 'rgba(220, 38, 38, 0.06)',
                      borderRadius: '10px',
                    }}>
                      <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 500 }}>Credit</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#DC2626', marginTop: '2px' }}>
                        {formatCurrency(selectedAccount.balance?.credit || 0)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Transactions Placeholder */}
              <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
                  Recent Transactions
                </div>
                <div style={{
                  padding: '24px 12px', textAlign: 'center',
                  background: '#f8fafc', borderRadius: '10px', color: '#94a3b8', fontSize: '13px',
                }}>
                  Transaction history will appear here
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

const DetailRow = ({ label, value, mono = false }) => (
  <div>
    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '2px' }}>
      {label}
    </div>
    <div style={{
      fontSize: '14px', fontWeight: 500, color: '#1e293b',
      fontFamily: mono ? 'monospace' : 'inherit',
    }}>
      {value || '-'}
    </div>
  </div>
)

export default LedgerMaster
