import { useState, useEffect } from 'react'
import { Plus, Shield, Edit, Trash2, Search, Save, Check, Users, RefreshCw, Lock, UserCog, ChevronRight, Crown, Eye, PenLine, Trash, FileDown, ClipboardCheck, Info, LayoutGrid, Settings, BarChart3, Briefcase, ShoppingCart, Package, DollarSign, UserCheck, Cog, FileText } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Modal } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { rolesAPI } from '../../utils/api'
import { Database } from 'lucide-react'

const RolesPermissions = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('permissions')
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [saving, setSaving] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [roleSearch, setRoleSearch] = useState('')
  const [permissions, setPermissions] = useState({})
  const [hasChanges, setHasChanges] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const [formData, setFormData] = useState({
    roleCode: '',
    roleName: '',
    description: '',
    isActive: true
  })

  const featureGroups = [
    {
      category: 'CRM & Sales',
      icon: BarChart3,
      features: [
        { key: 'Dashboard', name: 'Dashboard', code: 'DSH', icon: LayoutGrid },
        { key: 'Leads', name: 'Leads', code: 'LDS', icon: Users },
        { key: 'Customers', name: 'Customers', code: 'CUS', icon: UserCheck },
        { key: 'Sales', name: 'Sales', code: 'SLS', icon: DollarSign },
      ]
    },
    {
      category: 'Operations',
      icon: Settings,
      features: [
        { key: 'Projects', name: 'Projects', code: 'PRJ', icon: Briefcase },
        { key: 'Procurement', name: 'Procurement', code: 'PRO', icon: ShoppingCart },
        { key: 'Inventory', name: 'Inventory', code: 'INV', icon: Package },
      ]
    },
    {
      category: 'Administration',
      icon: Shield,
      features: [
        { key: 'Finance', name: 'Finance', code: 'FIN', icon: DollarSign },
        { key: 'HR', name: 'HR', code: 'HRM', icon: Users },
        { key: 'Settings', name: 'Settings', code: 'SET', icon: Cog },
        { key: 'Reports', name: 'Reports', code: 'RPT', icon: FileText },
      ]
    }
  ]

  const features = featureGroups.flatMap(g => g.features)

  const allCapabilities = [
    { key: 'view', label: 'View', icon: Eye },
    { key: 'create', label: 'Create', icon: Plus },
    { key: 'edit', label: 'Edit', icon: PenLine },
    { key: 'delete', label: 'Delete', icon: Trash },
    { key: 'approve', label: 'Approve', icon: ClipboardCheck },
    { key: 'export', label: 'Export', icon: FileDown }
  ]

  useEffect(() => { loadRoles() }, [])

  useEffect(() => {
    if (selectedRole) {
      const newPermissions = {}
      features.forEach(feature => {
        newPermissions[feature.key] = {}
        const oldPerms = selectedRole.permissions?.[feature.key] || []
        allCapabilities.forEach(cap => {
          newPermissions[feature.key][cap.key] = oldPerms.includes(cap.key)
        })
      })
      setPermissions(newPermissions)
      setHasChanges(false)
    }
  }, [selectedRole])

  const loadRoles = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await rolesAPI.getAll({})
      const rolesData = response.data || []
      setRoles(rolesData)
      if (rolesData.length > 0 && !selectedRole) {
        setSelectedRole(rolesData[0])
      } else if (selectedRole) {
        const updated = rolesData.find(r => r._id === selectedRole._id)
        if (updated) setSelectedRole(updated)
      }
    } catch (err) {
      console.error('Failed to load roles:', err)
      setError('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedRoles = async () => {
    setSeeding(true)
    try {
      await rolesAPI.seedDefaults()
      await loadRoles()
      alert('Default roles created successfully!')
    } catch (err) {
      console.error('Failed to seed roles:', err)
      alert(err.message || 'Failed to seed roles')
    } finally {
      setSeeding(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingRole) {
        await rolesAPI.update(editingRole._id, formData)
      } else {
        await rolesAPI.create(formData)
      }
      setShowModal(false)
      resetForm()
      loadRoles()
    } catch (err) {
      console.error('Failed to save role:', err)
      alert(err.message || 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this role?')) return
    try {
      await rolesAPI.delete(id)
      if (selectedRole?._id === id) {
        setSelectedRole(roles.find(r => r._id !== id) || null)
      }
      loadRoles()
    } catch (err) {
      console.error('Failed to delete role:', err)
      alert(err.message || 'Failed to delete role')
    }
  }

  const resetForm = () => {
    setFormData({ roleCode: '', roleName: '', description: '', isActive: true })
    setEditingRole(null)
  }

  const openEditModal = (role) => {
    setEditingRole(role)
    setFormData({ roleCode: role.roleCode, roleName: role.roleName, description: role.description, isActive: role.isActive })
    setShowModal(true)
  }

  const handlePermissionChange = (featureKey, capability) => {
    setPermissions(prev => ({
      ...prev,
      [featureKey]: { ...prev[featureKey], [capability]: !prev[featureKey]?.[capability] }
    }))
    setHasChanges(true)
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    setSaving(true)
    try {
      const apiPermissions = {}
      features.forEach(feature => {
        apiPermissions[feature.key] = []
        const featurePerms = permissions[feature.key] || {}
        allCapabilities.forEach(cap => {
          if (featurePerms[cap.key]) apiPermissions[feature.key].push(cap.key)
        })
      })
      await rolesAPI.update(selectedRole._id, { permissions: apiPermissions })
      await loadRoles()
      setHasChanges(false)
      alert('Permissions saved successfully!')
    } catch (err) {
      console.error('Failed to save permissions:', err)
      alert(err.message || 'Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  const filteredRoles = roles.filter(role =>
    role.roleName.toLowerCase().includes(roleSearch.toLowerCase()) ||
    role.roleCode.toLowerCase().includes(roleSearch.toLowerCase())
  )

  const getPermissionCount = (role) => {
    let count = 0
    if (role.permissions) {
      Object.values(role.permissions).forEach(perms => {
        if (Array.isArray(perms)) count += perms.length
      })
    }
    return count
  }

  // Toggle-style permission control
  const PermissionCheck = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: '40px',
        height: '22px',
        borderRadius: '11px',
        background: checked ? 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)' : '#d1d5db',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.25s ease',
        boxShadow: checked ? '0 2px 8px rgba(197,156,130,0.35)' : 'inset 0 1px 3px rgba(0,0,0,0.1)',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '20px' : '2px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.25s ease',
      }} />
    </button>
  )

  // Toggle for form
  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: checked ? '#C59C82' : '#d1d5db',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.2s',
      }} />
    </button>
  )

  if (loading && roles.length === 0) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Manage user roles and access control for your organization"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Settings' }, { label: 'Roles & Permissions' }]}
        actions={
          <div className="flex gap-2">
            {roles.length <= 1 && (
              <Button variant="outline" icon={Database} onClick={handleSeedRoles} loading={seeding}>
                Initialize Roles
              </Button>
            )}
            <Button icon={Plus} onClick={() => { resetForm(); setShowModal(true); }}>
              Add Role
            </Button>
          </div>
        }
      />

      <div style={{ paddingBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Left Panel - Roles List */}
          <div style={{ width: '320px', flexShrink: 0 }}>
            <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e5e7eb', overflow: 'hidden', position: 'sticky', top: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Search */}
              <div style={{ padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', height: '16px', width: '16px', color: '#9ca3af' }} />
                  <input
                    type="text"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="Search roles..."
                    style={{
                      width: '100%',
                      paddingLeft: '38px',
                      paddingRight: '14px',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                      fontSize: '14px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      background: '#f9fafb',
                      outline: 'none',
                      color: '#111827',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>{filteredRoles.length} roles</span>
                  <button
                    onClick={loadRoles}
                    style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Role List */}
              <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
                {filteredRoles.length === 0 && !loading ? (
                  <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <Shield style={{ height: '40px', width: '40px', color: '#d1d5db', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '14px', color: '#9ca3af' }}>No roles found</p>
                  </div>
                ) : (
                  filteredRoles.map((role) => {
                    const isSelected = selectedRole?._id === role._id
                    const permCount = getPermissionCount(role)
                    return (
                      <button
                        key={role._id}
                        onClick={() => setSelectedRole(role)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '16px 20px',
                          textAlign: 'left',
                          border: 'none',
                          borderBottom: '1px solid #f3f4f6',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          background: isSelected ? 'linear-gradient(135deg, #FDF8F4 0%, #F5EDE6 100%)' : '#fff',
                          borderLeft: isSelected ? '3px solid #C59C82' : '3px solid transparent',
                        }}
                      >
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                          fontWeight: '700',
                          color: isSelected ? '#fff' : '#A68B6A',
                          flexShrink: 0,
                          background: isSelected ? 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)' : '#F5EDE6',
                          boxShadow: isSelected ? '0 4px 12px rgba(197,156,130,0.3)' : 'none',
                        }}>
                          {role.roleName.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {role.roleName}
                            </span>
                            {(role.roleCode === 'OWNER' || role.roleCode === 'ADMIN') && (
                              <Crown size={13} style={{ color: '#C59C82', flexShrink: 0 }} />
                            )}
                            {role.isSystem && (
                              <Lock size={11} style={{ color: '#9ca3af', flexShrink: 0 }} />
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{role.userCount || 0} users</span>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '24px',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              background: isSelected ? '#C59C82' : '#f3f4f6',
                              color: isSelected ? '#fff' : '#6b7280',
                            }}>
                              {permCount}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={16} style={{ flexShrink: 0, color: isSelected ? '#C59C82' : '#d1d5db' }} />
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedRole ? (
              <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Role Header */}
                <div style={{ padding: '28px 32px', background: 'linear-gradient(135deg, #FEFCFA 0%, #FDF8F4 100%)', borderBottom: '1px solid #F5EDE6' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)',
                        boxShadow: '0 8px 20px rgba(197,156,130,0.3)',
                      }}>
                        <span style={{ color: '#fff', fontWeight: '800', fontSize: '24px' }}>{selectedRole.roleName.charAt(0)}</span>
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: 0 }}>{selectedRole.roleName}</h2>
                          {(selectedRole.roleCode === 'OWNER' || selectedRole.roleCode === 'ADMIN') && (
                            <Crown size={18} style={{ color: '#C59C82' }} />
                          )}
                        </div>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>{selectedRole.description || 'No description provided'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: selectedRole.isActive ? '#ecfdf5' : '#f9fafb',
                            color: selectedRole.isActive ? '#059669' : '#6b7280',
                            border: `1px solid ${selectedRole.isActive ? '#a7f3d0' : '#e5e7eb'}`,
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: selectedRole.isActive ? '#10b981' : '#9ca3af' }} />
                            {selectedRole.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: '#f9fafb',
                            color: '#4b5563',
                            border: '1px solid #e5e7eb',
                          }}>
                            {selectedRole.isSystem ? <Lock size={11} /> : <UserCog size={11} />}
                            {selectedRole.isSystem ? 'System' : 'Custom'}
                          </span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: '#f9fafb',
                            color: '#4b5563',
                            border: '1px solid #e5e7eb',
                          }}>
                            <Users size={11} />
                            {selectedRole.userCount || 0} users
                          </span>
                        </div>
                      </div>
                    </div>
                    {!selectedRole.isSystem && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => openEditModal(selectedRole)}
                          style={{ padding: '10px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(selectedRole._id)}
                          style={{ padding: '10px', borderRadius: '12px', border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ borderBottom: '1px solid #e5e7eb', padding: '0 32px' }}>
                  <nav style={{ display: 'flex', gap: '0' }}>
                    {[
                      { id: 'permissions', label: 'Permissions', icon: Shield },
                      { id: 'details', label: 'Details', icon: Info }
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
                          borderBottom: `2px solid ${activeTab === tab.id ? '#C59C82' : 'transparent'}`,
                          color: activeTab === tab.id ? '#C59C82' : '#6b7280',
                          background: 'none',
                          border: 'none',
                          borderBottomWidth: '2px',
                          borderBottomStyle: 'solid',
                          borderBottomColor: activeTab === tab.id ? '#C59C82' : 'transparent',
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

                {/* Permissions Tab */}
                {activeTab === 'permissions' && (
                  <div style={{ padding: '28px 32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                      {featureGroups.map((group) => (
                        <div key={group.category}>
                          {/* Category Header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ height: '30px', width: '30px', borderRadius: '8px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <group.icon size={14} style={{ color: '#6b7280' }} />
                            </div>
                            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{group.category}</h3>
                            <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                          </div>

                          {/* Permissions Grid */}
                          <div style={{ borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#f9fafb' }}>
                                  <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', width: '200px' }}>
                                    Module
                                  </th>
                                  {allCapabilities.map((cap) => (
                                    <th key={cap.key} style={{ padding: '14px 8px', textAlign: 'center', width: '80px' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ height: '28px', width: '28px', borderRadius: '8px', background: '#fff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <cap.icon size={13} style={{ color: '#9ca3af' }} />
                                        </div>
                                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cap.label}</span>
                                      </div>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {group.features.map((feature, idx) => (
                                  <tr key={feature.key} style={{ borderTop: '1px solid #f3f4f6', background: idx % 2 === 1 ? '#fafbfc' : '#fff' }}>
                                    <td style={{ padding: '16px 20px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ height: '32px', width: '32px', borderRadius: '8px', background: '#F5EDE6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          <feature.icon size={14} style={{ color: '#A68B6A' }} />
                                        </div>
                                        <div>
                                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{feature.name}</span>
                                          <span style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '10px', fontWeight: '600', color: '#9ca3af', background: '#f3f4f6', borderRadius: '4px', fontFamily: 'monospace' }}>{feature.code}</span>
                                        </div>
                                      </div>
                                    </td>
                                    {allCapabilities.map((cap) => {
                                      const isChecked = permissions[feature.key]?.[cap.key] || false
                                      return (
                                        <td key={cap.key} style={{ padding: '16px 8px', textAlign: 'center' }}>
                                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <PermissionCheck
                                              checked={isChecked}
                                              onChange={() => handlePermissionChange(feature.key, cap.key)}
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
                      ))}
                    </div>

                    {/* Save Button */}
                    {hasChanges && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '28px',
                        padding: '18px 24px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #FDF8F4 0%, #F5EDE6 100%)',
                        border: '1px solid #DDC5B0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C59C82', animation: 'pulse 2s infinite' }} />
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#8B7355' }}>You have unsaved changes</span>
                        </div>
                        <Button icon={Save} onClick={handleSavePermissions} loading={saving}>
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Details Tab */}
                {activeTab === 'details' && (
                  <div style={{ padding: '28px 32px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {[
                        { label: 'Role Code', value: selectedRole.roleCode },
                        { label: 'Base Role', value: selectedRole.baseRole?.replace('_', ' ') || 'Custom' },
                        { label: 'Users Assigned', value: selectedRole.userCount || 0 },
                        { label: 'Created', value: selectedRole.createdAt ? new Date(selectedRole.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A' },
                      ].map(item => (
                        <div key={item.label} style={{ padding: '20px', background: '#f9fafb', borderRadius: '14px', border: '1px solid #f3f4f6' }}>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</label>
                          <p style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: '8px 0 0 0', textTransform: 'capitalize' }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '16px', padding: '20px', borderRadius: '14px', background: '#FDF8F4', border: '1px solid #F5EDE6' }}>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <Info size={18} style={{ color: '#C59C82', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#6B5B45', margin: 0 }}>About this role</h4>
                          <p style={{ fontSize: '13px', color: '#A68B6A', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                            {selectedRole.isSystem
                              ? 'This is a system-defined role. You can modify permissions but cannot delete it.'
                              : 'This is a custom role. You can fully customize its properties and permissions.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e5e7eb', padding: '80px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <EmptyState
                  icon={Shield}
                  title="No role selected"
                  description="Select a role from the list to view or edit permissions"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingRole ? 'Edit Role' : 'Create New Role'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Code</label>
            <input
              type="text"
              value={formData.roleCode}
              onChange={(e) => setFormData({ ...formData, roleCode: e.target.value.toUpperCase().replace(/\s/g, '_') })}
              placeholder="e.g., SALES_MANAGER"
              required
              disabled={editingRole?.isSystem}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none disabled:bg-gray-100"
              style={{ borderRadius: '10px' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px #C59C82'; e.target.style.borderColor = '#C59C82' }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = '#d1d5db' }}
            />
            <p className="text-xs text-gray-500 mt-1">Unique identifier (auto-uppercase)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input
              type="text"
              value={formData.roleName}
              onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              placeholder="e.g., Sales Manager"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none"
              style={{ borderRadius: '10px' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px #C59C82'; e.target.style.borderColor = '#C59C82' }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = '#d1d5db' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role responsibilities..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none resize-none"
              style={{ borderRadius: '10px' }}
              onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px #C59C82'; e.target.style.borderColor = '#C59C82' }}
              onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = '#d1d5db' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '12px' }}>
            <Toggle
              checked={formData.isActive}
              onChange={() => setFormData({ ...formData, isActive: !formData.isActive })}
            />
            <label style={{ fontSize: '14px', color: '#374151' }}>
              <span style={{ fontWeight: '600' }}>Active</span>
              <span style={{ color: '#6b7280', marginLeft: '4px' }}>- Users can be assigned to this role</span>
            </label>
          </div>

          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingRole ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default RolesPermissions
