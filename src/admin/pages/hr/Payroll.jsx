import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, IndianRupee, Eye, Download, Send, CheckCircle, Clock, Users, Calculator, Printer, X } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Select, Modal } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { payrollAPI } from '../../utils/api'

const Payroll = () => {
  const navigate = useNavigate()
  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [payslipModal, setPayslipModal] = useState({ open: false, payroll: null })
  const payslipRef = useRef(null)

  useEffect(() => {
    loadPayrolls()
  }, [pagination.page, search, monthFilter, statusFilter])

  const loadPayrolls = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter.toLowerCase()
      if (monthFilter) {
        const [month, year] = monthFilter.split('-')
        const monthNum = new Date(`${month} 1, 2000`).getMonth() + 1
        params.month = monthNum
        params.year = parseInt(year)
      }

      const response = await payrollAPI.getAll(params)
      setPayrolls(response.data || [])
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total,
          totalPages: response.pagination.pages
        }))
      }
    } catch (err) {
      console.error('Failed to load payrolls:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    Draft: 'gray',
    Processing: 'yellow',
    Approved: 'blue',
    Paid: 'green',
    OnHold: 'orange',
  }

  // Calculate stats
  const currentMonthPayrolls = payrolls.filter(p => p.payPeriod.month === 'December')
  const stats = {
    totalEmployees: currentMonthPayrolls.length,
    totalGross: currentMonthPayrolls.reduce((sum, p) => sum + p.grossSalary, 0),
    totalNet: currentMonthPayrolls.reduce((sum, p) => sum + p.netSalary, 0),
    pending: currentMonthPayrolls.filter(p => ['Draft', 'Processing'].includes(p.status)).length,
  }

  const handleDownloadPayslip = (payroll) => {
    // Open print dialog for the payslip
    setPayslipModal({ open: true, payroll })
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handlePrintPayslip = () => {
    window.print()
  }

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Manage employee salaries and payroll processing"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'HR' }, { label: 'Payroll' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" icon={Calculator} onClick={() => {}}>Run Payroll</Button>
            <Button icon={Plus} onClick={() => navigate('/admin/payroll/new')}>Add Entry</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#111111]/10 rounded-lg">
              <Users className="h-5 w-5 text-[#111111]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalEmployees}</p>
              <p className="text-sm text-gray-500">Employees</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C59C82]/20 rounded-lg">
              <IndianRupee className="h-5 w-5 text-[#C59C82]" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalGross)}</p>
              <p className="text-sm text-gray-500">Gross Payroll</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <IndianRupee className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalNet)}</p>
              <p className="text-sm text-gray-500">Net Payroll</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6" padding="sm">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employee..."
            className="flex-1 max-w-md"
          />
          <Select
            options={[
              { value: '', label: 'All Months' },
              { value: 'December-2024', label: 'December 2024' },
              { value: 'November-2024', label: 'November 2024' },
              { value: 'October-2024', label: 'October 2024' },
            ]}
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-44"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Processing', label: 'Processing' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Paid', label: 'Paid' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : payrolls.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No payroll records found"
            description="Run payroll to generate salary records"
            action={() => {}}
            actionLabel="Run Payroll"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Employee</Table.Head>
                  <Table.Head>Department</Table.Head>
                  <Table.Head>Pay Period</Table.Head>
                  <Table.Head>Gross Salary</Table.Head>
                  <Table.Head>Deductions</Table.Head>
                  <Table.Head>Net Salary</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {payrolls.map((payroll) => (
                  <Table.Row key={payroll._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {payroll.employee.firstName} {payroll.employee.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{payroll.employee.employeeCode}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">{payroll.employee.department}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-900">
                        {payroll.payPeriod.month} {payroll.payPeriod.year}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(payroll.grossSalary)}</p>
                        <p className="text-xs text-gray-500">Basic: {formatCurrency(payroll.basicSalary)}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-red-600">-{formatCurrency(payroll.totalDeductions)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm font-semibold text-green-600">{formatCurrency(payroll.netSalary)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={statusColors[payroll.status] || 'gray'}>
                        {payroll.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown
                        align="right"
                        trigger={
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        }
                      >
                        <Dropdown.Item icon={Eye} onClick={() => setPayslipModal({ open: true, payroll })}>
                          View Payslip
                        </Dropdown.Item>
                        <Dropdown.Item icon={Download} onClick={() => handleDownloadPayslip(payroll)}>
                          Download Payslip
                        </Dropdown.Item>
                        {payroll.status === 'Draft' && (
                          <Dropdown.Item icon={CheckCircle}>Approve</Dropdown.Item>
                        )}
                        {payroll.status === 'Approved' && (
                          <Dropdown.Item icon={Send}>Process Payment</Dropdown.Item>
                        )}
                      </Dropdown>
                    </Table.Cell>
                  </Table.Row>
                ))}
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

      {/* Payslip Modal */}
      <Modal
        isOpen={payslipModal.open}
        onClose={() => setPayslipModal({ open: false, payroll: null })}
        title=""
        size="xl"
      >
        {payslipModal.payroll && (
          <div ref={payslipRef} className="-m-6 bg-white overflow-hidden print:shadow-none">
            {/* Header Section */}
            <div className="bg-gradient-to-br from-[#111111] via-[#6B5B45] to-[#8B7355] text-white px-8 py-8 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-2xl font-bold text-[#111111]">H</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-wide">HOH108</h2>
                    <p className="text-white/60 text-sm mt-1">HancetGlobe Pvt Ltd</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-[#C59C82] text-[#111111] px-5 py-2 rounded-xl inline-block shadow-lg">
                    <p className="text-sm font-bold tracking-wider">PAYSLIP</p>
                  </div>
                  <p className="text-white/80 text-base mt-3 font-medium">{payslipModal.payroll.payPeriod.month} {payslipModal.payroll.payPeriod.year}</p>
                </div>
              </div>
            </div>

            {/* Employee Info Card */}
            <div className="px-8 -mt-6 relative z-10">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#111111] to-[#A68B6A] rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-lg font-bold text-white">
                        {payslipModal.payroll.employee.firstName.charAt(0)}{payslipModal.payroll.employee.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{payslipModal.payroll.employee.firstName} {payslipModal.payroll.employee.lastName}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{payslipModal.payroll.employee.employeeCode} • {payslipModal.payroll.employee.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                      payslipModal.payroll.status === 'Paid'
                        ? 'bg-[#dcfce7] text-[#16a34a]'
                        : payslipModal.payroll.status === 'Processing'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {payslipModal.payroll.status.toUpperCase()}
                    </span>
                    {payslipModal.payroll.paymentDate && (
                      <p className="text-xs text-gray-400 mt-2">Paid on {formatDate(payslipModal.payroll.paymentDate)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Grid */}
            <div className="px-8 py-8">
              <div className="grid grid-cols-2 gap-8">
                {/* Earnings Section */}
                <div className="bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7]/30 rounded-2xl overflow-hidden border border-green-100">
                  <div className="px-6 py-4 bg-gradient-to-r from-[#22c55e] to-[#16a34a] flex items-center gap-3">
                    <span className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center text-white text-lg font-bold">+</span>
                    <h4 className="font-bold text-white text-base">Earnings</h4>
                  </div>
                  <div className="p-6 space-y-1">
                    <div className="flex justify-between py-3 border-b border-green-100">
                      <span className="text-gray-700">Basic Salary</span>
                      <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.basicSalary)}</span>
                    </div>
                    {payslipModal.payroll.allowances.hra > 0 && (
                      <div className="flex justify-between py-3 border-b border-green-100">
                        <span className="text-gray-700">House Rent Allowance</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.allowances.hra)}</span>
                      </div>
                    )}
                    {payslipModal.payroll.allowances.transport > 0 && (
                      <div className="flex justify-between py-3 border-b border-green-100">
                        <span className="text-gray-700">Transport Allowance</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.allowances.transport)}</span>
                      </div>
                    )}
                    {payslipModal.payroll.allowances.medical > 0 && (
                      <div className="flex justify-between py-3 border-b border-green-100">
                        <span className="text-gray-700">Medical Allowance</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.allowances.medical)}</span>
                      </div>
                    )}
                    {payslipModal.payroll.allowances.special > 0 && (
                      <div className="flex justify-between py-3 border-b border-green-100">
                        <span className="text-gray-700">Special Allowance</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.allowances.special)}</span>
                      </div>
                    )}
                    {payslipModal.payroll.allowances.commission > 0 && (
                      <div className="flex justify-between py-3 border-b border-green-100">
                        <span className="text-gray-700">Commission</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.allowances.commission)}</span>
                      </div>
                    )}
                    {payslipModal.payroll.allowances.overtime > 0 && (
                      <div className="flex justify-between py-3 border-b border-green-100">
                        <span className="text-gray-700">Overtime</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.allowances.overtime)}</span>
                      </div>
                    )}
                    {payslipModal.payroll.allowances.bonus > 0 && (
                      <div className="flex justify-between py-3 border-b border-green-100">
                        <span className="text-gray-700">Bonus</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.allowances.bonus)}</span>
                      </div>
                    )}
                    {/* Gross Total */}
                    <div className="flex justify-between py-4 mt-2 bg-[#22c55e]/10 -mx-6 px-6 rounded-b-xl">
                      <span className="font-bold text-gray-900">Gross Earnings</span>
                      <span className="font-bold text-[#16a34a] text-lg tabular-nums">{formatCurrency(payslipModal.payroll.grossSalary)}</span>
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="bg-gradient-to-br from-[#fef2f2] to-[#fecaca]/20 rounded-2xl overflow-hidden border border-red-100">
                  <div className="px-6 py-4 bg-gradient-to-r from-[#ef4444] to-[#dc2626] flex items-center gap-3">
                    <span className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center text-white text-lg font-bold">−</span>
                    <h4 className="font-bold text-white text-base">Deductions</h4>
                  </div>
                  <div className="p-6 space-y-1">
                    {payslipModal.payroll.deductions.pf > 0 && (
                      <div className="flex justify-between py-3 border-b border-red-100">
                        <span className="text-gray-700">Provident Fund (PF)</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.deductions.pf)}</span>
                      </div>
                    )}
                    {payslipModal.payroll.deductions.tax > 0 && (
                      <div className="flex justify-between py-3 border-b border-red-100">
                        <span className="text-gray-700">Income Tax (TDS)</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.deductions.tax)}</span>
                      </div>
                    )}
                    {payslipModal.payroll.deductions.insurance > 0 && (
                      <div className="flex justify-between py-3 border-b border-red-100">
                        <span className="text-gray-700">Health Insurance</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.deductions.insurance)}</span>
                      </div>
                    )}
                    {payslipModal.payroll.deductions.loanEmi > 0 && (
                      <div className="flex justify-between py-3 border-b border-red-100">
                        <span className="text-gray-700">Loan EMI</span>
                        <span className="text-gray-900 font-semibold tabular-nums">{formatCurrency(payslipModal.payroll.deductions.loanEmi)}</span>
                      </div>
                    )}
                    {/* Total Deductions */}
                    <div className="flex justify-between py-4 mt-2 bg-[#ef4444]/10 -mx-6 px-6 rounded-b-xl">
                      <span className="font-bold text-gray-900">Total Deductions</span>
                      <span className="font-bold text-[#dc2626] text-lg tabular-nums">{formatCurrency(payslipModal.payroll.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Hero Section */}
            <div className="mx-8 mb-8">
              <div className="bg-gradient-to-br from-[#111111] via-[#6B5B45] to-[#8B7355] rounded-2xl p-8 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#C59C82]/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-1/2 w-24 h-24 bg-[#C59C82]/10 rounded-full translate-y-1/2"></div>

                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Net Salary</p>
                    <p className="text-white text-lg mt-1">Take Home Pay</p>
                    <p className="text-white/50 text-sm mt-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Credited via Bank Transfer
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-[#C59C82] tabular-nums">{formatCurrency(payslipModal.payroll.netSalary)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-center text-xs text-gray-400 italic">This is a computer-generated payslip and does not require a signature.</p>
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-5 flex justify-end gap-4 border-t border-gray-100 bg-white print:hidden">
              <button
                onClick={() => setPayslipModal({ open: false, payroll: null })}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Close
              </button>
              <button
                onClick={handlePrintPayslip}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#C59C82] rounded-xl hover:bg-[#A68B6A] transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#C59C82]/30"
              >
                <Printer className="w-4 h-4" />
                Print / Download PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Payroll
