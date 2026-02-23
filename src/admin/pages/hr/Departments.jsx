import { useState, useEffect } from 'react'
import { Building2, Users, Search, TrendingUp, ChevronRight, Mail, Phone, RefreshCw } from 'lucide-react'
import { departmentsAPI, employeesAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Modal } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'

const Departments = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDept, setSelectedDept] = useState(null)
  const [deptEmployees, setDeptEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const response = await departmentsAPI.getAll()
      setDepartments(response.data || [])
    } catch (err) {
      console.error('Failed to load departments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeptClick = async (dept) => {
    setSelectedDept(dept)
    setShowModal(true)
    setLoadingEmployees(true)
    setDeptEmployees([])

    try {
      const response = await employeesAPI.getAll({ department: dept.code, limit: 100 })
      setDeptEmployees(response?.data || [])
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoadingEmployees(false)
    }
  }

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedDepartments = [...filteredDepartments].sort((a, b) =>
    (b.employeeCount || 0) - (a.employeeCount || 0)
  )

  const deptColors = {
    MNG: { gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', bg: '#f5f3ff', text: '#7c3aed', light: '#ede9fe' },
    DESIGN: { gradient: 'linear-gradient(135deg, #ec4899, #db2777)', bg: '#fdf2f8', text: '#db2777', light: '#fce7f3' },
    SALES: { gradient: 'linear-gradient(135deg, #10b981, #059669)', bg: '#ecfdf5', text: '#059669', light: '#d1fae5' },
    PRE_SALES: { gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', bg: '#ecfeff', text: '#0891b2', light: '#cffafe' },
    EXECUTION: { gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', bg: '#fffbeb', text: '#d97706', light: '#fef3c7' },
    QC: { gradient: 'linear-gradient(135deg, #C59C82, #A68B6A)', bg: '#FDF8F4', text: '#A68B6A', light: '#F5EDE6' },
    IT: { gradient: 'linear-gradient(135deg, #64748b, #475569)', bg: '#f8fafc', text: '#475569', light: '#e2e8f0' },
    HR: { gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)', bg: '#fff1f2', text: '#e11d48', light: '#ffe4e6' },
    FINANCE: { gradient: 'linear-gradient(135deg, #22c55e, #16a34a)', bg: '#f0fdf4', text: '#16a34a', light: '#dcfce7' },
    MARKETING: { gradient: 'linear-gradient(135deg, #f97316, #ea580c)', bg: '#fff7ed', text: '#ea580c', light: '#ffedd5' },
    PROCUREMENT: { gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', bg: '#eef2ff', text: '#4f46e5', light: '#e0e7ff' },
    BI: { gradient: 'linear-gradient(135deg, #C59C82, #A68B6A)', bg: '#FDF8F4', text: '#A68B6A', light: '#F5EDE6' },
    BD: { gradient: 'linear-gradient(135deg, #14b8a6, #0d9488)', bg: '#f0fdfa', text: '#0d9488', light: '#ccfbf1' },
    CHANNEL_SALES: { gradient: 'linear-gradient(135deg, #84cc16, #65a30d)', bg: '#f7fee7', text: '#65a30d', light: '#ecfccb' },
    ADMIN: { gradient: 'linear-gradient(135deg, #6b7280, #4b5563)', bg: '#f9fafb', text: '#4b5563', light: '#e5e7eb' },
    CRM: { gradient: 'linear-gradient(135deg, #d946ef, #c026d3)', bg: '#fdf4ff', text: '#c026d3', light: '#fae8ff' },
  }

  const getColors = (code) => deptColors[code] || { gradient: 'linear-gradient(135deg, #C59C82, #A68B6A)', bg: '#FDF8F4', text: '#A68B6A', light: '#F5EDE6' }

  const totalEmployees = departments.reduce((acc, d) => acc + (d.employeeCount || 0), 0)
  const activeDepartments = departments.filter(d => (d.employeeCount || 0) > 0).length

  if (loading) return <PageLoader />

  return (
    <div style={{ paddingBottom: '40px' }}>
      <PageHeader
        title="Departments"
        description="Manage your organization structure"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'HR' }, { label: 'Departments' }]}
      />

      {departments.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          padding: '80px 32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <EmptyState
            icon={Building2}
            title="No departments"
            description="Departments can be added from Settings"
          />
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {/* Total Departments */}
            <button
              onClick={loadDepartments}
              style={{
                background: 'linear-gradient(135deg, #C59C82 0%, #A68B6A 100%)',
                borderRadius: '18px',
                padding: '24px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 4px 16px rgba(197,156,130,0.25)',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(197,156,130,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(197,156,130,0.25)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.8)', margin: '0 0 8px 0' }}>Total Departments</p>
                  <p style={{ fontSize: '36px', fontWeight: '800', color: '#fff', margin: 0, lineHeight: 1 }}>{departments.length}</p>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Building2 style={{ width: '24px', height: '24px', color: '#fff' }} />
                </div>
              </div>
            </button>

            {/* Total Employees */}
            <div style={{
              background: '#fff',
              borderRadius: '18px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', margin: '0 0 8px 0' }}>Total Employees</p>
                  <p style={{ fontSize: '36px', fontWeight: '800', color: '#111827', margin: 0, lineHeight: 1 }}>{totalEmployees}</p>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Users style={{ width: '24px', height: '24px', color: '#059669' }} />
                </div>
              </div>
            </div>

            {/* Active Departments */}
            <div style={{
              background: '#fff',
              borderRadius: '18px',
              padding: '24px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280', margin: '0 0 8px 0' }}>Active Departments</p>
                  <p style={{ fontSize: '36px', fontWeight: '800', color: '#111827', margin: 0, lineHeight: 1 }}>{activeDepartments}</p>
                </div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: '#FDF8F4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <TrendingUp style={{ width: '24px', height: '24px', color: '#C59C82' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '24px', maxWidth: '420px' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                  fontSize: '14px',
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  outline: 'none',
                  color: '#111827',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#C59C82'; e.target.style.boxShadow = '0 0 0 3px rgba(197,156,130,0.15)' }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
              />
            </div>
          </div>

          {/* Department Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {sortedDepartments.map((dept) => {
              const colors = getColors(dept.code)
              const hasMembers = (dept.employeeCount || 0) > 0
              const pct = totalEmployees > 0 ? ((dept.employeeCount || 0) / totalEmployees * 100) : 0

              return (
                <button
                  key={dept._id}
                  onClick={() => handleDeptClick(dept)}
                  style={{
                    background: '#fff',
                    borderRadius: '20px',
                    border: '1px solid #e5e7eb',
                    padding: '0',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    opacity: hasMembers ? 1 : 0.6,
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                  }}
                >
                  {/* Top gradient bar */}
                  <div style={{ height: '4px', background: colors.gradient }} />

                  <div style={{ padding: '22px 24px' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '14px',
                          background: colors.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 4px 12px ${colors.text}33`,
                          flexShrink: 0,
                        }}>
                          <Building2 style={{ width: '22px', height: '22px', color: '#fff' }} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
                            {dept.name}
                          </h3>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: colors.text,
                            background: colors.light,
                            borderRadius: '8px',
                            letterSpacing: '0.03em',
                            fontFamily: 'monospace',
                          }}>
                            {dept.code}
                          </span>
                        </div>
                      </div>
                      <ChevronRight style={{ width: '18px', height: '18px', color: '#d1d5db', flexShrink: 0, marginTop: '4px' }} />
                    </div>

                    {/* Description */}
                    {dept.description && (
                      <p style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        margin: '0 0 16px 0',
                        lineHeight: '1.5',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {dept.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div style={{
                      borderTop: '1px solid #f3f4f6',
                      paddingTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: colors.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Users style={{ width: '14px', height: '14px', color: colors.text }} />
                        </div>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: hasMembers ? '#111827' : '#9ca3af',
                        }}>
                          {dept.employeeCount || 0} {(dept.employeeCount || 0) === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      {/* Mini percentage bar */}
                      {hasMembers && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '48px', height: '5px', borderRadius: '3px', background: '#f3f4f6', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '3px', background: colors.gradient, width: `${Math.max(pct, 4)}%`, transition: 'width 0.4s ease' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}>{pct.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {filteredDepartments.length === 0 && searchTerm && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Search style={{ width: '48px', height: '48px', color: '#d1d5db', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>No departments found matching "{searchTerm}"</p>
            </div>
          )}
        </>
      )}

      {/* Department Employees Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedDept(null); setDeptEmployees([]) }}
        title={selectedDept?.name || 'Department'}
        size="lg"
      >
        {selectedDept && (() => {
          const colors = getColors(selectedDept.code)
          return (
            <div>
              {/* Department Header */}
              <div style={{
                padding: '20px',
                borderRadius: '16px',
                background: colors.bg,
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: colors.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${colors.text}33`,
                  }}>
                    <Building2 style={{ width: '26px', height: '26px', color: '#fff' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>{selectedDept.name}</h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{selectedDept.description || 'No description'}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: '0 0 2px 0', lineHeight: 1 }}>{selectedDept.employeeCount || 0}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Members</p>
                  </div>
                </div>
              </div>

              {/* Team Members Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team Members</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>

              {/* Employees List */}
              {loadingEmployees ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    border: '3px solid #F5EDE6',
                    borderTopColor: '#C59C82',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              ) : deptEmployees.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 20px',
                  background: '#f9fafb',
                  borderRadius: '14px',
                }}>
                  <Users style={{ width: '44px', height: '44px', color: '#d1d5db', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>No employees in this department</p>
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {deptEmployees.map((emp) => (
                    <div
                      key={emp._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: '#fafbfc',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fafbfc'}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: colors.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '16px',
                        flexShrink: 0,
                      }}>
                        {emp.name?.charAt(0)?.toUpperCase() || 'E'}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <p style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {emp.name}
                          </p>
                          {emp.status === 'active' && (
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} title="Active" />
                          )}
                        </div>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {emp.designation || emp.role || 'Employee'}
                        </p>
                      </div>

                      {/* Contact */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        {emp.email && (
                          <a
                            href={`mailto:${emp.email}`}
                            onClick={e => e.stopPropagation()}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9ca3af',
                              transition: 'all 0.15s',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#F5EDE6'; e.currentTarget.style.color = '#C59C82' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#9ca3af' }}
                            title={emp.email}
                          >
                            <Mail style={{ width: '15px', height: '15px' }} />
                          </a>
                        )}
                        {emp.phone && (
                          <a
                            href={`tel:${emp.phone}`}
                            onClick={e => e.stopPropagation()}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9ca3af',
                              transition: 'all 0.15s',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.color = '#059669' }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#9ca3af' }}
                            title={emp.phone}
                          >
                            <Phone style={{ width: '15px', height: '15px' }} />
                          </a>
                        )}
                      </div>

                      {/* Employee ID */}
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#d1d5db',
                        fontFamily: 'monospace',
                        flexShrink: 0,
                      }}>
                        {emp.employeeId || ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}

export default Departments
