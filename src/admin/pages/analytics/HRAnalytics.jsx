import { useState, useEffect } from 'react'
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  Building2,
  TrendingUp,
} from 'lucide-react'
import { Card, Badge } from '../../components/ui'
import PageHeader from '../../components/layout/PageHeader'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { apiRequest } from '../../utils/api'

const HRAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [hrData, setHrData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadHRData()
  }, [])

  const loadHRData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest('/analytics/hr-dashboard')
      if (data.success) {
        setHrData(data.data)
      }
    } catch (err) {
      console.error('Failed to load HR analytics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader />

  if (error && !hrData) {
    return (
      <div>
        <PageHeader
          title="HR Analytics"
          description="Headcount, attendance, and leave statistics"
          breadcrumbs={[
            { label: 'Dashboard', path: '/admin' },
            { label: 'Analytics', path: '/admin/analytics' },
            { label: 'HR' },
          ]}
        />
        <EmptyState
          icon={Users}
          title="Unable to load HR data"
          description={error}
        />
      </div>
    )
  }

  // Headcount
  const totalEmployees = hrData?.totalEmployees || hrData?.headcount || 0
  const departments = hrData?.departments || hrData?.byDepartment || []
  const maxDeptCount = departments.length > 0
    ? Math.max(...departments.map((d) => d.count || d.value || d.employees || 0))
    : 0

  // Attendance
  const attendanceRate = hrData?.attendanceRate || hrData?.attendance?.rate || 0
  const presentToday = hrData?.presentToday || hrData?.attendance?.present || 0
  const absentToday = hrData?.absentToday || hrData?.attendance?.absent || 0
  const onLeaveToday = hrData?.onLeaveToday || hrData?.attendance?.onLeave || 0

  // Leave statistics
  const leaveStats = hrData?.leaveStats || hrData?.leaves || {}
  const pendingLeaves = leaveStats.pending || 0
  const approvedLeaves = leaveStats.approved || 0
  const rejectedLeaves = leaveStats.rejected || 0
  const totalLeaveRequests = pendingLeaves + approvedLeaves + rejectedLeaves

  // Department colors
  const deptColors = [
    '#C59C82', '#3B82F6', '#059669', '#8B5CF6', '#EC4899',
    '#F59E0B', '#06B6D4', '#dc2626', '#84cc16', '#f97316',
  ]

  return (
    <div>
      <PageHeader
        title="HR Analytics"
        description="Headcount, attendance, and leave statistics"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Analytics', path: '/admin/analytics' },
          { label: 'HR' },
        ]}
      />

      {/* Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '24px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: '#C59C8215',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Users style={{ width: 24, height: 24, color: '#C59C82' }} />
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>Total Employees</p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '4px 0 0' }}>{totalEmployees}</p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '24px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: '#05966915',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <UserCheck style={{ width: 24, height: 24, color: '#059669' }} />
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>Present Today</p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#059669', margin: '4px 0 0' }}>{presentToday}</p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '24px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: '#dc262615',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Clock style={{ width: 24, height: 24, color: '#dc2626' }} />
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>Absent Today</p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#dc2626', margin: '4px 0 0' }}>{absentToday}</p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '20px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          padding: '24px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: '#d9770615',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            <Calendar style={{ width: 24, height: 24, color: '#d97706' }} />
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>On Leave</p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#d97706', margin: '4px 0 0' }}>{onLeaveToday}</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px',
        marginBottom: '24px',
      }}>
        {/* Headcount by Department */}
        <Card>
          <Card.Header>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Card.Title>Headcount by Department</Card.Title>
                <Card.Description>Employee distribution across departments</Card.Description>
              </div>
              <Building2 style={{ width: 20, height: 20, color: '#94a3b8' }} />
            </div>
          </Card.Header>
          <Card.Content style={{ padding: '0' }}>
            {departments.length > 0 ? (
              departments.map((dept, index) => {
                const name = dept.name || dept.department || dept._id
                const count = dept.count || dept.value || dept.employees || 0
                const percentage = maxDeptCount > 0 ? (count / maxDeptCount) * 100 : 0
                const color = deptColors[index % deptColors.length]

                return (
                  <div key={name} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '3px',
                          background: color,
                        }} />
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#475569' }}>{name}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                        {count} {count === 1 ? 'employee' : 'employees'}
                      </span>
                    </div>
                    <div style={{
                      height: '12px',
                      background: '#f1f5f9',
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: color,
                        borderRadius: '6px',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })
            ) : (
              <EmptyState
                icon={Building2}
                title="No department data"
                description="Department headcount will appear once employees are assigned to departments."
              />
            )}
          </Card.Content>
        </Card>

        {/* Right column: Attendance + Leave */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Attendance Rate */}
          <Card>
            <Card.Header>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Card.Title>Attendance Rate</Card.Title>
                  <Card.Description>Current attendance performance</Card.Description>
                </div>
                <TrendingUp style={{ width: 20, height: 20, color: '#94a3b8' }} />
              </div>
            </Card.Header>
            <Card.Content style={{ padding: '0' }}>
              <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                {/* Circular progress indicator (simplified) */}
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: `conic-gradient(
                    ${attendanceRate >= 90 ? '#059669' : attendanceRate >= 70 ? '#d97706' : '#dc2626'} ${attendanceRate * 3.6}deg,
                    #f1f5f9 ${attendanceRate * 3.6}deg
                  )`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <div style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}>
                    <span style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: attendanceRate >= 90 ? '#059669' : attendanceRate >= 70 ? '#d97706' : '#dc2626',
                    }}>
                      {attendanceRate}%
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Attendance</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
                  <div>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>{presentToday}</span>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>Present</p>
                  </div>
                  <div style={{ width: '1px', background: '#f1f5f9' }} />
                  <div>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>{absentToday}</span>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>Absent</p>
                  </div>
                  <div style={{ width: '1px', background: '#f1f5f9' }} />
                  <div>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#d97706' }}>{onLeaveToday}</span>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0' }}>On Leave</p>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Leave Statistics */}
          <Card>
            <Card.Header>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Card.Title>Leave Statistics</Card.Title>
                  <Card.Description>Leave requests overview</Card.Description>
                </div>
                <Calendar style={{ width: 20, height: 20, color: '#94a3b8' }} />
              </div>
            </Card.Header>
            <Card.Content style={{ padding: '0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Pending */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: '#fffbeb',
                  borderRadius: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#d97706',
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Pending</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#d97706' }}>{pendingLeaves}</span>
                    {totalLeaveRequests > 0 && (
                      <Badge color="yellow" size="sm">
                        {((pendingLeaves / totalLeaveRequests) * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Approved */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: '#ecfdf5',
                  borderRadius: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#059669',
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Approved</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>{approvedLeaves}</span>
                    {totalLeaveRequests > 0 && (
                      <Badge color="green" size="sm">
                        {((approvedLeaves / totalLeaveRequests) * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Rejected */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: '#fef2f2',
                  borderRadius: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#dc2626',
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Rejected</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626' }}>{rejectedLeaves}</span>
                    {totalLeaveRequests > 0 && (
                      <Badge color="red" size="sm">
                        {((rejectedLeaves / totalLeaveRequests) * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Total bar */}
                <div style={{
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Leave Requests</span>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '4px 0 0' }}>
                    {totalLeaveRequests}
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default HRAnalytics
