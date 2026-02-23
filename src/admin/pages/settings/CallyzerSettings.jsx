import { useState, useEffect } from 'react'
import { callyzerAPI } from '../../utils/api'
import {
  Card,
  Button,
  Input,
  Select,
  LoadingSpinner,
  useToast
} from '../../components/ui'
import {
  Phone,
  Settings,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users,
  CloudDownload,
  Link2,
  Copy,
  Zap,
  Shield
} from 'lucide-react'

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    style={{
      position: 'relative',
      display: 'inline-flex',
      height: '24px',
      width: '44px',
      flexShrink: 0,
      cursor: disabled ? 'not-allowed' : 'pointer',
      borderRadius: '9999px',
      border: '2px solid transparent',
      transition: 'background-color 0.2s',
      background: checked ? '#C59C82' : '#d1d5db',
      opacity: disabled ? 0.5 : 1,
      outline: 'none',
      padding: 0,
    }}
  >
    <span
      style={{
        pointerEvents: 'none',
        display: 'inline-block',
        height: '20px',
        width: '20px',
        borderRadius: '9999px',
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
      }}
    />
  </button>
)

const SectionRow = ({ icon: Icon, iconBg, iconColor, title, description, right, noBorder }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderBottom: noBorder ? 'none' : '1px solid #f1f5f9',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{
        padding: '8px',
        background: iconBg || '#f1f5f9',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon style={{ width: '16px', height: '16px', color: iconColor || '#64748b' }} />
      </div>
      <div>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{title}</p>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>{description}</p>
      </div>
    </div>
    {right}
  </div>
)

const CallyzerSettings = () => {
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const [config, setConfig] = useState({
    apiToken: '',
    isEnabled: false,
    autoSyncCalls: false,
    syncIntervalMinutes: 30
  })

  const [configStatus, setConfigStatus] = useState({
    isConfigured: false,
    lastSyncAt: null,
    syncStatus: 'never',
    webhookUrl: ''
  })

  const [employees, setEmployees] = useState({
    callyzerEmployees: [],
    crmUsers: []
  })

  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('config')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await callyzerAPI.getConfig()
      if (response.success) {
        setConfigStatus({
          isConfigured: response.data.isConfigured,
          lastSyncAt: response.data.lastSyncAt,
          syncStatus: response.data.syncStatus,
          webhookUrl: response.data.webhookUrl
        })
        if (response.data.settings) {
          setConfig(prev => ({
            ...prev,
            ...response.data.settings,
            isEnabled: response.data.isEnabled
          }))
        }
      }
    } catch (error) {
      toast.error('Failed to load Callyzer configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!config.apiToken) {
      toast.error('Please enter API token first')
      return
    }
    try {
      setTesting(true)
      const response = await callyzerAPI.testConnection(config.apiToken)
      if (response.success) {
        toast.success(`Connection successful! ${response.data.totalCalls} calls found today.`)
      } else {
        toast.error(response.message || 'Connection failed')
      }
    } catch (error) {
      toast.error('Failed to test connection')
    } finally {
      setTesting(false)
    }
  }

  const handleSaveConfig = async () => {
    try {
      setSaving(true)
      const response = await callyzerAPI.saveConfig(config)
      if (response.success) {
        toast.success('Configuration saved successfully')
        loadConfig()
      } else {
        toast.error(response.message || 'Failed to save configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleSyncCalls = async () => {
    try {
      setSyncing(true)
      const response = await callyzerAPI.syncCalls({})
      if (response.success) {
        toast.success(response.message)
        loadConfig()
      } else {
        toast.error(response.message || 'Sync failed')
      }
    } catch (error) {
      toast.error('Failed to sync calls')
    } finally {
      setSyncing(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await callyzerAPI.getEmployees()
      if (response.success) {
        setEmployees(response.data)
      }
    } catch (error) {
      toast.error('Failed to load employees')
    }
  }

  const loadStats = async () => {
    try {
      const response = await callyzerAPI.getStats({})
      if (response.success) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleMapEmployee = async (userId, callyzerEmployeeNumber) => {
    try {
      const response = await callyzerAPI.mapEmployee(userId, callyzerEmployeeNumber)
      if (response.success) {
        toast.success('Employee mapped successfully')
        loadEmployees()
      }
    } catch (error) {
      toast.error('Failed to map employee')
    }
  }

  useEffect(() => {
    if (activeTab === 'employees' && configStatus.isConfigured) {
      loadEmployees()
    }
    if (activeTab === 'sync' && configStatus.isConfigured) {
      loadStats()
    }
  }, [activeTab, configStatus.isConfigured])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <LoadingSpinner />
      </div>
    )
  }

  const tabs = [
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'sync', label: 'Sync & Stats', icon: RefreshCw }
  ]

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Phone style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              Callyzer Integration
            </h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Automatic call tracking and sync
            </p>
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: configStatus.isConfigured ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${configStatus.isConfigured ? '#bbf7d0' : '#fde68a'}`,
          borderRadius: '9999px',
        }}>
          {configStatus.isConfigured
            ? <CheckCircle2 style={{ width: '15px', height: '15px', color: '#16a34a' }} />
            : <XCircle style={{ width: '15px', height: '15px', color: '#d97706' }} />
          }
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: configStatus.isConfigured ? '#15803d' : '#b45309',
          }}>
            {configStatus.isConfigured ? 'Connected' : 'Not Configured'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <nav style={{ display: 'flex', gap: '4px' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: isActive ? '#C59C82' : '#94a3b8',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? '#C59C82' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginBottom: '-1px',
                }}
              >
                <tab.icon style={{ width: '15px', height: '15px' }} />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* API Token */}
          <Card padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{
                padding: '8px',
                background: '#FDF8F4',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Shield style={{ width: '16px', height: '16px', color: '#C59C82' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>API Token</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                  From Callyzer: Connectors &gt; API &amp; Webhook &gt; API Config
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
              <div style={{ flex: 1 }}>
                <Input
                  type="password"
                  value={config.apiToken}
                  onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                  placeholder="Enter your Callyzer API token"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
                style={{ whiteSpace: 'nowrap', height: '46px' }}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
          </Card>

          {/* Settings */}
          <Card padding="none">
            <div style={{ padding: '20px 24px 0 24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>Settings</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Configure integration behavior</p>
            </div>
            <div style={{ padding: '4px 24px 8px 24px' }}>
              <SectionRow
                icon={Zap}
                iconBg="#f0fdf4"
                iconColor="#16a34a"
                title="Enable Integration"
                description="Activate Callyzer connection and features"
                right={
                  <Toggle
                    checked={config.isEnabled}
                    onChange={(checked) => setConfig({ ...config, isEnabled: checked })}
                  />
                }
              />
              <SectionRow
                icon={RefreshCw}
                iconBg="#eff6ff"
                iconColor="#2563eb"
                title="Auto-Sync Calls"
                description="Automatically import call logs periodically"
                noBorder
                right={
                  <Toggle
                    checked={config.autoSyncCalls}
                    onChange={(checked) => setConfig({ ...config, autoSyncCalls: checked })}
                  />
                }
              />
            </div>
          </Card>

          {/* Webhook URL */}
          <Card padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  padding: '8px',
                  background: '#FDF8F4',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Link2 style={{ width: '16px', height: '16px', color: '#C59C82' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Webhook URL</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Add this in Callyzer for real-time call updates
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(configStatus.webhookUrl)
                  toast.success('Webhook URL copied!')
                }}
                disabled={!configStatus.webhookUrl}
                style={{ color: '#C59C82' }}
              >
                <Copy style={{ width: '14px', height: '14px' }} />
                Copy
              </Button>
            </div>
            <div style={{
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}>
              <code style={{ fontSize: '13px', color: '#475569', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {configStatus.webhookUrl || 'Configure API token first'}
              </code>
            </div>
          </Card>

          {/* Save */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </div>
      )}

      {/* Employee Mapping Tab */}
      {activeTab === 'employees' && (
        <Card padding="lg">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Employee Mapping</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Map CRM users to Callyzer employee numbers for accurate call tracking
            </p>
          </div>
          {!configStatus.isConfigured ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                display: 'inline-flex',
                padding: '14px',
                background: '#f8fafc',
                borderRadius: '9999px',
                marginBottom: '12px',
              }}>
                <Users style={{ width: '24px', height: '24px', color: '#cbd5e1' }} />
              </div>
              <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
                Configure your API token first to map employees
              </p>
            </div>
          ) : (
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                padding: '12px 20px',
                background: '#f8fafc',
                borderBottom: '1px solid #f1f5f9',
              }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>CRM User</p>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Callyzer Employee</p>
              </div>
              {employees.crmUsers?.map((user, idx) => (
                <div key={user._id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: idx !== employees.crmUsers.length - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: 0 }}>{user.name}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>{user.email}</p>
                  </div>
                  <Select
                    value={user.callyzerEmployeeNumber || ''}
                    onChange={(e) => handleMapEmployee(user._id, e.target.value)}
                  >
                    <option value="">-- Select Employee --</option>
                    {employees.callyzerEmployees?.map((emp) => (
                      <option key={emp.number} value={emp.number}>
                        {emp.name} ({emp.number})
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
              {(!employees.crmUsers || employees.crmUsers.length === 0) && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: '14px' }}>
                  No sales/pre-sales users found
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Sync & Stats Tab */}
      {activeTab === 'sync' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sync Action */}
          <Card padding="lg">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  padding: '8px',
                  background: '#FDF8F4',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <CloudDownload style={{ width: '16px', height: '16px', color: '#C59C82' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Manual Sync</h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Last synced: {configStatus.lastSyncAt
                      ? new Date(configStatus.lastSyncAt).toLocaleString()
                      : 'Never'
                    }
                    {' · '}
                    Status: <span style={{
                      fontWeight: '600',
                      color: configStatus.syncStatus === 'success' ? '#16a34a'
                        : configStatus.syncStatus === 'failed' ? '#dc2626'
                        : '#94a3b8'
                    }}>
                      {configStatus.syncStatus}
                    </span>
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSyncCalls}
                disabled={syncing || !configStatus.isConfigured}
              >
                <RefreshCw style={{ width: '15px', height: '15px', animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </Card>

          {/* Stats Grid */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                { label: 'Total Calls', value: stats.summary?.total_calls || 0, icon: Phone, bg: '#eff6ff', color: '#2563eb' },
                { label: 'Connected', value: stats.summary?.connected_calls || 0, icon: CheckCircle2, bg: '#f0fdf4', color: '#16a34a' },
                { label: 'Missed', value: stats.summary?.missed_calls || 0, icon: XCircle, bg: '#fff7ed', color: '#ea580c' },
              ].map((stat) => (
                <Card key={stat.label} padding="lg">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      padding: '10px',
                      background: stat.bg,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <stat.icon style={{ width: '18px', height: '18px', color: stat.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0, lineHeight: 1 }}>
                        {stat.value}
                      </p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>{stat.label}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CallyzerSettings
