import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { attendanceAPI, employeesAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Avatar, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatDate, formatDateTime } from '../../utils/helpers'
import { ATTENDANCE_STATUSES } from '../../utils/constants'

const Attendance = () => {
  const [attendance, setAttendance] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [attRes, empRes] = await Promise.all([
        attendanceAPI.getAll({ date: selectedDate }),
        employeesAPI.getAll({ limit: 100 }),
      ])
      setAttendance(attRes.data || [])
      setEmployees(empRes.data || [])
    } catch (err) {
      console.error('Failed to load attendance:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'late':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const stats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    leave: attendance.filter(a => a.status === 'on-leave').length,
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Track daily attendance"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Attendance' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.present}</p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.absent}</p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.late}</p>
              <p className="text-sm text-gray-500">Late</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.leave}</p>
              <p className="text-sm text-gray-500">On Leave</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Date Selector */}
      <Card className="mb-6" padding="sm">
        <div className="flex items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
          <p className="text-sm text-gray-500">
            Showing attendance for <span className="font-medium text-gray-900">{formatDate(selectedDate)}</span>
          </p>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Employee</Table.Head>
                <Table.Head>Check In</Table.Head>
                <Table.Head>Check Out</Table.Head>
                <Table.Head>Duration</Table.Head>
                <Table.Head>Status</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {attendance.length > 0 ? (
                attendance.map((record) => (
                  <Table.Row key={record._id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <Avatar name={record.employee?.name} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{record.employee?.name}</p>
                          <p className="text-xs text-gray-500">{record.employee?.department?.name || '-'}</p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {record.checkIn?.time ? (
                        <div>
                          <p className="text-sm text-gray-900">{new Date(record.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                          {record.checkIn.location && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {record.checkIn.location}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {record.checkOut?.time ? (
                        <p className="text-sm text-gray-900">{new Date(record.checkOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-600">{record.duration || '-'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <Badge color={ATTENDANCE_STATUSES[record.status]?.color || 'gray'}>
                          {ATTENDANCE_STATUSES[record.status]?.label || record.status}
                        </Badge>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    <p className="text-center text-gray-500 py-8">No attendance records for this date</p>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        )}
      </Card>
    </div>
  )
}

export default Attendance
