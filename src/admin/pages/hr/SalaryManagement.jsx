import { useState, useEffect } from 'react'
import { Search, FileText, Edit2, Download, ChevronDown, ChevronUp, IndianRupee, User, Building2, Calendar, Trash2, Plus, AlertCircle, CreditCard, RefreshCw, Clock, Check, X } from 'lucide-react'
import { salaryAPI, salaryDeductionsAPI, employeesAPI } from '../../utils/api'

// Deduction Types
const DEDUCTION_TYPES = [
  { value: 'loan_recovery', label: 'Loan Recovery' },
  { value: 'advance_recovery', label: 'Advance Recovery' },
  { value: 'insurance_premium', label: 'Insurance Premium' },
  { value: 'uniform_deduction', label: 'Uniform Deduction' },
  { value: 'notice_period', label: 'Notice Period Recovery' },
  { value: 'damage_recovery', label: 'Damage/Loss Recovery' },
  { value: 'other', label: 'Other Deduction' }
]

const DEDUCTION_STATUS = {
  active: { label: 'Active', color: '#059669', bgColor: '#dcfce7' },
  paused: { label: 'Paused', color: '#ca8a04', bgColor: '#fef9c3' },
  completed: { label: 'Completed', color: '#2563eb', bgColor: '#dbeafe' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bgColor: '#fee2e2' }
}

const SalaryManagement = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSlipModal, setShowSlipModal] = useState(false)
  const [showDeductionsModal, setShowDeductionsModal] = useState(false)
  const [showAddDeductionModal, setShowAddDeductionModal] = useState(false)
  const [salaryData, setSalaryData] = useState(null)
  const [slipData, setSlipData] = useState(null)
  const [deductions, setDeductions] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [activeTab, setActiveTab] = useState('salary') // 'salary' | 'deductions'
  const [formData, setFormData] = useState({
    basicSalary: 0,
    hra: 0,
    otherAllowances: 0,
    deductions: {
      professionalTax: 200,
      incomeTax: 0,
      otherDeductions: 0
    },
    config: {
      epfoApplicable: true,
      esicApplicable: false,
      ptState: 'Maharashtra',
      panNumber: '',
      uanNumber: '',
      bankAccountNumber: '',
      bankName: '',
      ifscCode: ''
    },
    reason: ''
  })

  // Deduction form state
  const [deductionForm, setDeductionForm] = useState({
    deductionType: 'loan_recovery',
    description: '',
    totalAmount: '',
    deductionMode: 'monthly',
    monthlyAmount: '',
    startMonth: '',
    endMonth: '',
    referenceId: '',
    notes: ''
  })

  useEffect(() => {
    loadEmployees()
  }, [search])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const response = await salaryAPI.getAll({ search })
      setEmployees(response.data || [])
    } catch (err) {
      console.error('Failed to load employees:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDeductions = async (employeeId) => {
    try {
      const response = await salaryDeductionsAPI.getAll(employeeId)
      setDeductions(response.data || [])
    } catch (err) {
      console.error('Failed to load deductions:', err)
    }
  }

  const handleEditSalary = async (employee) => {
    setSelectedEmployee(employee)
    if (employee.salary && employee.salary.basicSalary > 0) {
      setFormData({
        basicSalary: employee.salary.basicSalary || 0,
        hra: employee.salary.hra || 0,
        otherAllowances: employee.salary.otherAllowances || 0,
        deductions: {
          professionalTax: employee.salary.deductions?.professionalTax || 200,
          incomeTax: employee.salary.deductions?.incomeTax || 0,
          otherDeductions: employee.salary.deductions?.otherDeductions || 0
        },
        config: {
          epfoApplicable: employee.salary.config?.epfoApplicable ?? true,
          esicApplicable: employee.salary.config?.esicApplicable ?? false,
          ptState: employee.salary.config?.ptState || 'Maharashtra',
          panNumber: employee.salary.config?.panNumber || '',
          uanNumber: employee.salary.config?.uanNumber || '',
          bankAccountNumber: employee.salary.config?.bankAccountNumber || '',
          bankName: employee.salary.config?.bankName || '',
          ifscCode: employee.salary.config?.ifscCode || ''
        },
        reason: ''
      })
    } else {
      setFormData({
        basicSalary: 0,
        hra: 0,
        otherAllowances: 0,
        deductions: { professionalTax: 200, incomeTax: 0, otherDeductions: 0 },
        config: { epfoApplicable: true, esicApplicable: false, ptState: 'Maharashtra', panNumber: '', uanNumber: '', bankAccountNumber: '', bankName: '', ifscCode: '' },
        reason: ''
      })
    }
    setShowEditModal(true)
  }

  const handleSaveSalary = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await salaryAPI.update(selectedEmployee._id, formData)
      setShowEditModal(false)
      loadEmployees()
    } catch (err) {
      console.error('Failed to save salary:', err)
      alert(err.message || 'Failed to save salary')
    } finally {
      setSaving(false)
    }
  }

  const handleViewSlip = async (employee) => {
    setSelectedEmployee(employee)
    try {
      const response = await salaryAPI.getSlip(employee._id)
      setSlipData(response.data)
      setShowSlipModal(true)
    } catch (err) {
      console.error('Failed to load salary slip:', err)
      alert(err.message || 'Failed to load salary slip')
    }
  }

  // Deductions Management
  const handleOpenDeductions = async (employee) => {
    setSelectedEmployee(employee)
    await loadDeductions(employee._id)
    setShowDeductionsModal(true)
  }

  const handleAddDeduction = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await salaryDeductionsAPI.add(selectedEmployee._id, {
        ...deductionForm,
        totalAmount: parseFloat(deductionForm.totalAmount),
        monthlyAmount: deductionForm.monthlyAmount ? parseFloat(deductionForm.monthlyAmount) : undefined
      })
      await loadDeductions(selectedEmployee._id)
      setShowAddDeductionModal(false)
      setDeductionForm({
        deductionType: 'loan_recovery',
        description: '',
        totalAmount: '',
        deductionMode: 'monthly',
        monthlyAmount: '',
        startMonth: '',
        endMonth: '',
        referenceId: '',
        notes: ''
      })
    } catch (err) {
      console.error('Failed to add deduction:', err)
      alert(err.message || 'Failed to add deduction')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateDeductionStatus = async (deductionId, status) => {
    try {
      await salaryDeductionsAPI.update(selectedEmployee._id, deductionId, { status })
      await loadDeductions(selectedEmployee._id)
    } catch (err) {
      console.error('Failed to update deduction:', err)
      alert(err.message || 'Failed to update deduction')
    }
  }

  const handleDeleteDeduction = async (deductionId) => {
    if (!confirm('Are you sure you want to delete this deduction?')) return
    try {
      await salaryDeductionsAPI.delete(selectedEmployee._id, deductionId)
      await loadDeductions(selectedEmployee._id)
    } catch (err) {
      console.error('Failed to delete deduction:', err)
      alert(err.message || 'Failed to delete deduction')
    }
  }

  const handleRecordDeduction = async (deductionId, amount, month) => {
    try {
      await salaryDeductionsAPI.recordDeduction(selectedEmployee._id, deductionId, { amount, month })
      await loadDeductions(selectedEmployee._id)
    } catch (err) {
      console.error('Failed to record deduction:', err)
      alert(err.message || 'Failed to record deduction')
    }
  }

  const handleDelete = async (employee) => {
    if (!confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
      return
    }
    setDeleting(employee._id)
    try {
      await employeesAPI.delete(employee._id)
      loadEmployees()
    } catch (err) {
      console.error('Failed to delete employee:', err)
      alert(err.message || 'Failed to delete employee')
    } finally {
      setDeleting(null)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const calculatePreview = () => {
    const basic = parseFloat(formData.basicSalary) || 0
    const hra = parseFloat(formData.hra) || 0
    const otherAllowances = parseFloat(formData.otherAllowances) || 0
    const gross = basic + hra + otherAllowances

    const epfoEmployee = formData.config.epfoApplicable ? Math.round(basic * 0.12) : 0
    const esicEmployee = formData.config.esicApplicable && gross <= 21000 ? Math.round(gross * 0.0075) : 0
    const pt = parseFloat(formData.deductions?.professionalTax) || 200
    const it = parseFloat(formData.deductions?.incomeTax) || 0
    const otherDed = parseFloat(formData.deductions?.otherDeductions) || 0

    const totalDeductions = epfoEmployee + esicEmployee + pt + it + otherDed
    const netSalary = gross - totalDeductions

    const epfoEmployer = formData.config.epfoApplicable ? Math.round(basic * 0.12) : 0
    const esicEmployer = formData.config.esicApplicable && gross <= 21000 ? Math.round(gross * 0.0325) : 0
    const gratuity = Math.round(basic * 0.0481)
    const ctc = gross + epfoEmployer + esicEmployer + gratuity

    return { gross, epfoEmployee, esicEmployee, totalDeductions, netSalary, epfoEmployer, esicEmployer, gratuity, ctc }
  }

  // Styles
  const containerStyle = { padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }
  const headerStyle = { marginBottom: '24px' }
  const titleStyle = { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }
  const subtitleStyle = { fontSize: '14px', color: '#64748b' }
  const cardStyle = { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }
  const searchContainerStyle = { padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' }
  const searchInputStyle = { flex: 1, maxWidth: '400px', position: 'relative' }
  const inputStyle = { width: '100%', padding: '12px 16px 12px 44px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s' }
  const tableStyle = { width: '100%', borderCollapse: 'collapse' }
  const thStyle = { padding: '16px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }
  const tdStyle = { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' }
  const avatarStyle = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#C59C82', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px' }
  const badgeStyle = (color) => ({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500', backgroundColor: color === 'green' ? '#dcfce7' : color === 'yellow' ? '#fef9c3' : '#fee2e2', color: color === 'green' ? '#166534' : color === 'yellow' ? '#854d0e' : '#991b1b' })
  const buttonStyle = (variant) => ({ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', backgroundColor: variant === 'primary' ? '#C59C82' : variant === 'success' ? '#22c55e' : variant === 'warning' ? '#f59e0b' : '#f1f5f9', color: variant === 'primary' || variant === 'success' || variant === 'warning' ? 'white' : '#475569' })

  const modalOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }
  const modalStyle = { backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }
  const modalHeaderStyle = { padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
  const modalTitleStyle = { fontSize: '20px', fontWeight: '600', color: '#1e293b' }
  const modalBodyStyle = { padding: '24px' }
  const modalFooterStyle = { padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }

  const formGroupStyle = { marginBottom: '20px' }
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }
  const formInputStyle = { width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }
  const selectStyle = { ...formInputStyle, backgroundColor: 'white' }
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }
  const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', color: '#475569' }
  const tabStyle = (active) => ({
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    borderBottom: active ? '2px solid #C59C82' : '2px solid transparent',
    color: active ? '#C59C82' : '#64748b',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none'
  })

  const preview = calculatePreview()

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Salary Management</h1>
        <p style={subtitleStyle}>Manage employee salary structure, deductions, and generate payslips</p>
      </div>

      {/* Main Card */}
      <div style={cardStyle}>
        {/* Search */}
        <div style={searchContainerStyle}>
          <div style={searchInputStyle}>
            <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: '20px', height: '20px' }} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>No employees found</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table style={{ ...tableStyle, minWidth: '1100px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Basic Salary</th>
                <th style={thStyle}>Gross</th>
                <th style={thStyle}>Net Salary</th>
                <th style={thStyle}>CTC</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <>
                  <tr key={emp._id} style={{ cursor: 'pointer' }} onClick={() => setExpandedRow(expandedRow === emp._id ? null : emp._id)}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={avatarStyle}>{emp.name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{emp.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.employeeId || emp.email}</div>
                        </div>
                        {expandedRow === emp._id ? <ChevronUp size={16} style={{ color: '#94a3b8' }} /> : <ChevronDown size={16} style={{ color: '#94a3b8' }} />}
                      </div>
                    </td>
                    <td style={tdStyle}>{emp.department || '-'}</td>
                    <td style={tdStyle}>{formatCurrency(emp.salary?.basicSalary)}</td>
                    <td style={tdStyle}>{formatCurrency(emp.salary?.grossSalary)}</td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: '#059669' }}>{formatCurrency(emp.salary?.netSalary)}</td>
                    <td style={{ ...tdStyle, fontWeight: '600', color: '#C59C82' }}>{formatCurrency(emp.salary?.ctc)}</td>
                    <td style={tdStyle}>
                      {emp.salary?.basicSalary > 0 ? (
                        <span style={badgeStyle('green')}>Configured</span>
                      ) : (
                        <span style={badgeStyle('yellow')}>Not Set</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                        <button style={buttonStyle('default')} onClick={() => handleEditSalary(emp)}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button style={buttonStyle('warning')} onClick={() => handleOpenDeductions(emp)}>
                          <CreditCard size={14} /> Deductions
                        </button>
                        {emp.salary?.basicSalary > 0 && (
                          <button style={buttonStyle('success')} onClick={() => handleViewSlip(emp)}>
                            <FileText size={14} /> Slip
                          </button>
                        )}
                        <button
                          style={{ ...buttonStyle('default'), backgroundColor: '#fee2e2', color: '#991b1b' }}
                          onClick={() => handleDelete(emp)}
                          disabled={deleting === emp._id}
                        >
                          <Trash2 size={14} /> {deleting === emp._id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === emp._id && emp.salary?.basicSalary > 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0, backgroundColor: '#f8fafc' }}>
                        <div style={{ padding: '20px 40px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                            {/* Earnings */}
                            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Earnings</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Basic</span><span style={{ fontWeight: '500' }}>{formatCurrency(emp.salary?.basicSalary)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>HRA</span><span style={{ fontWeight: '500' }}>{formatCurrency(emp.salary?.hra)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Allowances</span><span style={{ fontWeight: '500' }}>{formatCurrency(emp.salary?.otherAllowances)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontWeight: '600' }}><span>Gross</span><span style={{ color: '#059669' }}>{formatCurrency(emp.salary?.grossSalary)}</span></div>
                              </div>
                            </div>
                            {/* Deductions */}
                            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Deductions</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>EPFO (12%)</span><span style={{ fontWeight: '500' }}>{formatCurrency(emp.salary?.deductions?.epfoEmployee)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>ESIC</span><span style={{ fontWeight: '500' }}>{formatCurrency(emp.salary?.deductions?.esicEmployee)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Prof. Tax</span><span style={{ fontWeight: '500' }}>{formatCurrency(emp.salary?.deductions?.professionalTax)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Income Tax</span><span style={{ fontWeight: '500' }}>{formatCurrency(emp.salary?.deductions?.incomeTax)}</span></div>
                              </div>
                            </div>
                            {/* Employer Contribution */}
                            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Employer Contrib.</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>EPFO (12%)</span><span style={{ fontWeight: '500' }}>{formatCurrency(emp.salary?.employerContributions?.epfoEmployer)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>ESIC (3.25%)</span><span style={{ fontWeight: '500' }}>{formatCurrency(emp.salary?.employerContributions?.esicEmployer)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Gratuity</span><span style={{ fontWeight: '500' }}>{formatCurrency(emp.salary?.employerContributions?.gratuity)}</span></div>
                              </div>
                            </div>
                            {/* Summary */}
                            <div style={{ backgroundColor: '#C59C82', padding: '16px', borderRadius: '12px', color: 'white' }}>
                              <h4 style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase', marginBottom: '12px' }}>Summary</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.8 }}>Net Salary</span><span style={{ fontWeight: '600', fontSize: '16px' }}>{formatCurrency(emp.salary?.netSalary)}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px' }}><span style={{ opacity: 0.8 }}>Annual CTC</span><span style={{ fontWeight: '600', fontSize: '16px' }}>{formatCurrency(emp.salary?.ctc * 12)}</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Edit Salary Modal */}
      {showEditModal && (
        <div style={modalOverlayStyle} onClick={() => setShowEditModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>Edit Salary Structure</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{selectedEmployee?.name} - {selectedEmployee?.designation || 'Employee'}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#94a3b8' }}>&times;</button>
            </div>
            <form onSubmit={handleSaveSalary}>
              <div style={modalBodyStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  {/* Left Column - Input Fields */}
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IndianRupee size={16} /> Earnings
                    </h3>
                    <div style={gridStyle}>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>Basic Salary *</label>
                        <input
                          type="number"
                          value={formData.basicSalary}
                          onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                          style={formInputStyle}
                          required
                        />
                      </div>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>HRA</label>
                        <input
                          type="number"
                          value={formData.hra}
                          onChange={(e) => setFormData({ ...formData, hra: e.target.value })}
                          style={formInputStyle}
                        />
                      </div>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>Other Allowances</label>
                        <input
                          type="number"
                          value={formData.otherAllowances}
                          onChange={(e) => setFormData({ ...formData, otherAllowances: e.target.value })}
                          style={formInputStyle}
                        />
                      </div>
                    </div>

                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', marginTop: '24px' }}>Deductions</h3>
                    <div style={gridStyle}>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>Professional Tax</label>
                        <input
                          type="number"
                          value={formData.deductions?.professionalTax || 0}
                          onChange={(e) => setFormData({ ...formData, deductions: { ...formData.deductions, professionalTax: e.target.value } })}
                          style={formInputStyle}
                        />
                      </div>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>Income Tax (TDS)</label>
                        <input
                          type="number"
                          value={formData.deductions?.incomeTax || 0}
                          onChange={(e) => setFormData({ ...formData, deductions: { ...formData.deductions, incomeTax: e.target.value } })}
                          style={formInputStyle}
                        />
                      </div>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>Other Deductions</label>
                        <input
                          type="number"
                          value={formData.deductions?.otherDeductions || 0}
                          onChange={(e) => setFormData({ ...formData, deductions: { ...formData.deductions, otherDeductions: e.target.value } })}
                          style={formInputStyle}
                        />
                      </div>
                    </div>

                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', marginTop: '24px' }}>Statutory Settings</h3>
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={formData.config?.epfoApplicable}
                          onChange={(e) => setFormData({ ...formData, config: { ...formData.config, epfoApplicable: e.target.checked } })}
                          style={{ width: '18px', height: '18px', accentColor: '#C59C82' }}
                        />
                        EPFO Applicable
                      </label>
                      <label style={checkboxLabelStyle}>
                        <input
                          type="checkbox"
                          checked={formData.config?.esicApplicable}
                          onChange={(e) => setFormData({ ...formData, config: { ...formData.config, esicApplicable: e.target.checked } })}
                          style={{ width: '18px', height: '18px', accentColor: '#C59C82' }}
                        />
                        ESIC Applicable
                      </label>
                    </div>

                    <div style={gridStyle}>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>PAN Number</label>
                        <input
                          type="text"
                          value={formData.config?.panNumber || ''}
                          onChange={(e) => setFormData({ ...formData, config: { ...formData.config, panNumber: e.target.value.toUpperCase() } })}
                          style={formInputStyle}
                          placeholder="ABCDE1234F"
                        />
                      </div>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>UAN Number</label>
                        <input
                          type="text"
                          value={formData.config?.uanNumber || ''}
                          onChange={(e) => setFormData({ ...formData, config: { ...formData.config, uanNumber: e.target.value } })}
                          style={formInputStyle}
                        />
                      </div>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>Bank Name</label>
                        <input
                          type="text"
                          value={formData.config?.bankName || ''}
                          onChange={(e) => setFormData({ ...formData, config: { ...formData.config, bankName: e.target.value } })}
                          style={formInputStyle}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>Bank Account Number</label>
                        <input
                          type="text"
                          value={formData.config?.bankAccountNumber || ''}
                          onChange={(e) => setFormData({ ...formData, config: { ...formData.config, bankAccountNumber: e.target.value } })}
                          style={formInputStyle}
                        />
                      </div>
                      <div style={formGroupStyle}>
                        <label style={labelStyle}>IFSC Code</label>
                        <input
                          type="text"
                          value={formData.config?.ifscCode || ''}
                          onChange={(e) => setFormData({ ...formData, config: { ...formData.config, ifscCode: e.target.value.toUpperCase() } })}
                          style={formInputStyle}
                        />
                      </div>
                    </div>

                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Revision Reason</label>
                      <input
                        type="text"
                        value={formData.reason || ''}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        style={formInputStyle}
                        placeholder="e.g., Annual increment, Promotion"
                      />
                    </div>
                  </div>

                  {/* Right Column - Preview */}
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Salary Breakup Preview</h3>
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
                      <table style={{ width: '100%', fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'left', padding: '8px 0', color: '#64748b', fontWeight: '600' }}>Particulars</th>
                            <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748b', fontWeight: '600' }}>Monthly</th>
                            <th style={{ textAlign: 'right', padding: '8px 0', color: '#64748b', fontWeight: '600' }}>Yearly</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td colSpan={3} style={{ padding: '8px 0', fontWeight: '600', color: '#059669', borderTop: '1px solid #e2e8f0' }}>EARNINGS</td></tr>
                          <tr><td style={{ padding: '6px 0', color: '#475569' }}>Basic Salary</td><td style={{ textAlign: 'right' }}>{formatCurrency(formData.basicSalary)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(formData.basicSalary * 12)}</td></tr>
                          <tr><td style={{ padding: '6px 0', color: '#475569' }}>HRA</td><td style={{ textAlign: 'right' }}>{formatCurrency(formData.hra)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(formData.hra * 12)}</td></tr>
                          <tr><td style={{ padding: '6px 0', color: '#475569' }}>Other Allowances</td><td style={{ textAlign: 'right' }}>{formatCurrency(formData.otherAllowances)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(formData.otherAllowances * 12)}</td></tr>
                          <tr style={{ backgroundColor: '#dcfce7' }}><td style={{ padding: '10px 0', fontWeight: '600' }}>Gross Salary</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(preview.gross)}</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(preview.gross * 12)}</td></tr>

                          <tr><td colSpan={3} style={{ padding: '12px 0 8px', fontWeight: '600', color: '#dc2626' }}>DEDUCTIONS</td></tr>
                          <tr><td style={{ padding: '6px 0', color: '#475569' }}>EPFO Employee (12%)</td><td style={{ textAlign: 'right' }}>{formatCurrency(preview.epfoEmployee)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(preview.epfoEmployee * 12)}</td></tr>
                          <tr><td style={{ padding: '6px 0', color: '#475569' }}>ESIC Employee (0.75%)</td><td style={{ textAlign: 'right' }}>{formatCurrency(preview.esicEmployee)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(preview.esicEmployee * 12)}</td></tr>
                          <tr><td style={{ padding: '6px 0', color: '#475569' }}>Professional Tax</td><td style={{ textAlign: 'right' }}>{formatCurrency(formData.deductions?.professionalTax)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(formData.deductions?.professionalTax * 12)}</td></tr>
                          <tr><td style={{ padding: '6px 0', color: '#475569' }}>Income Tax (TDS)</td><td style={{ textAlign: 'right' }}>{formatCurrency(formData.deductions?.incomeTax)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(formData.deductions?.incomeTax * 12)}</td></tr>
                          <tr style={{ backgroundColor: '#fee2e2' }}><td style={{ padding: '10px 0', fontWeight: '600' }}>Total Deductions</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(preview.totalDeductions)}</td><td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(preview.totalDeductions * 12)}</td></tr>

                          <tr style={{ backgroundColor: '#dbeafe' }}><td style={{ padding: '12px 0', fontWeight: '700', fontSize: '14px' }}>Net Salary</td><td style={{ textAlign: 'right', fontWeight: '700', fontSize: '14px', color: '#1d4ed8' }}>{formatCurrency(preview.netSalary)}</td><td style={{ textAlign: 'right', fontWeight: '700', fontSize: '14px', color: '#1d4ed8' }}>{formatCurrency(preview.netSalary * 12)}</td></tr>

                          <tr><td colSpan={3} style={{ padding: '12px 0 8px', fontWeight: '600', color: '#C59C82' }}>EMPLOYER CONTRIBUTIONS</td></tr>
                          <tr><td style={{ padding: '6px 0', color: '#475569' }}>EPFO Employer (12%)</td><td style={{ textAlign: 'right' }}>{formatCurrency(preview.epfoEmployer)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(preview.epfoEmployer * 12)}</td></tr>
                          <tr><td style={{ padding: '6px 0', color: '#475569' }}>ESIC Employer (3.25%)</td><td style={{ textAlign: 'right' }}>{formatCurrency(preview.esicEmployer)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(preview.esicEmployer * 12)}</td></tr>
                          <tr><td style={{ padding: '6px 0', color: '#475569' }}>Gratuity (4.81%)</td><td style={{ textAlign: 'right' }}>{formatCurrency(preview.gratuity)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(preview.gratuity * 12)}</td></tr>

                          <tr style={{ backgroundColor: '#C59C82', color: 'white' }}><td style={{ padding: '12px 8px', fontWeight: '700', fontSize: '15px', borderRadius: '8px 0 0 8px' }}>CTC</td><td style={{ textAlign: 'right', fontWeight: '700', fontSize: '15px' }}>{formatCurrency(preview.ctc)}</td><td style={{ textAlign: 'right', fontWeight: '700', fontSize: '15px', borderRadius: '0 8px 8px 0' }}>{formatCurrency(preview.ctc * 12)}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div style={modalFooterStyle}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ ...buttonStyle('default'), padding: '12px 24px' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...buttonStyle('primary'), padding: '12px 24px', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save Salary'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deductions Management Modal */}
      {showDeductionsModal && (
        <div style={modalOverlayStyle} onClick={() => setShowDeductionsModal(false)}>
          <div style={{ ...modalStyle, maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>Manage Deductions</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{selectedEmployee?.name} - {selectedEmployee?.employeeId}</p>
              </div>
              <button onClick={() => setShowDeductionsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#94a3b8' }}>&times;</button>
            </div>
            <div style={modalBodyStyle}>
              {/* Add Deduction Button */}
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AlertCircle size={20} style={{ color: '#f59e0b' }} />
                  <span style={{ color: '#64748b', fontSize: '14px' }}>
                    {deductions.filter(d => d.status === 'active').length} active deductions
                  </span>
                </div>
                <button
                  onClick={() => setShowAddDeductionModal(true)}
                  style={buttonStyle('primary')}
                >
                  <Plus size={16} /> Add Deduction
                </button>
              </div>

              {/* Deductions List */}
              {deductions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                  <CreditCard size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>No deductions configured</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {deductions.map((ded) => (
                    <div
                      key={ded._id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px',
                        backgroundColor: 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>
                              {DEDUCTION_TYPES.find(t => t.value === ded.deductionType)?.label || ded.deductionType}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '500',
                              backgroundColor: DEDUCTION_STATUS[ded.status]?.bgColor,
                              color: DEDUCTION_STATUS[ded.status]?.color
                            }}>
                              {DEDUCTION_STATUS[ded.status]?.label}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{ded.description}</p>
                          <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
                            <div>
                              <span style={{ color: '#64748b' }}>Total: </span>
                              <span style={{ fontWeight: '600' }}>{formatCurrency(ded.totalAmount)}</span>
                            </div>
                            <div>
                              <span style={{ color: '#64748b' }}>Deducted: </span>
                              <span style={{ fontWeight: '600', color: '#059669' }}>{formatCurrency(ded.deductedAmount)}</span>
                            </div>
                            <div>
                              <span style={{ color: '#64748b' }}>Balance: </span>
                              <span style={{ fontWeight: '600', color: '#dc2626' }}>{formatCurrency(ded.balanceAmount)}</span>
                            </div>
                            {ded.monthlyAmount > 0 && (
                              <div>
                                <span style={{ color: '#64748b' }}>Monthly: </span>
                                <span style={{ fontWeight: '600' }}>{formatCurrency(ded.monthlyAmount)}</span>
                              </div>
                            )}
                          </div>
                          {/* Progress Bar */}
                          <div style={{ marginTop: '12px', backgroundColor: '#e2e8f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                backgroundColor: '#059669',
                                borderRadius: '4px',
                                width: `${Math.min(100, (ded.deductedAmount / ded.totalAmount) * 100)}%`,
                                transition: 'width 0.3s'
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {ded.status === 'active' && (
                            <button
                              onClick={() => handleUpdateDeductionStatus(ded._id, 'paused')}
                              style={{ ...buttonStyle('default'), padding: '6px 12px' }}
                              title="Pause"
                            >
                              <Clock size={14} />
                            </button>
                          )}
                          {ded.status === 'paused' && (
                            <button
                              onClick={() => handleUpdateDeductionStatus(ded._id, 'active')}
                              style={{ ...buttonStyle('success'), padding: '6px 12px' }}
                              title="Resume"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDeduction(ded._id)}
                            style={{ ...buttonStyle('default'), padding: '6px 12px', backgroundColor: '#fee2e2', color: '#991b1b' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {/* Deduction History */}
                      {ded.deductionHistory?.length > 0 && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                          <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Deduction History</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {ded.deductionHistory.slice(-6).map((h, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: '4px 10px',
                                  backgroundColor: '#f1f5f9',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  color: '#475569'
                                }}
                              >
                                {h.month}: {formatCurrency(h.amount)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={modalFooterStyle}>
              <button onClick={() => setShowDeductionsModal(false)} style={{ ...buttonStyle('default'), padding: '12px 24px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Deduction Modal */}
      {showAddDeductionModal && (
        <div style={modalOverlayStyle} onClick={() => setShowAddDeductionModal(false)}>
          <div style={{ ...modalStyle, maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>Add New Deduction</h2>
              <button onClick={() => setShowAddDeductionModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#94a3b8' }}>&times;</button>
            </div>
            <form onSubmit={handleAddDeduction}>
              <div style={modalBodyStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Deduction Type *</label>
                    <select
                      value={deductionForm.deductionType}
                      onChange={(e) => setDeductionForm({ ...deductionForm, deductionType: e.target.value })}
                      style={selectStyle}
                      required
                    >
                      {DEDUCTION_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Deduction Mode</label>
                    <select
                      value={deductionForm.deductionMode}
                      onChange={(e) => setDeductionForm({ ...deductionForm, deductionMode: e.target.value })}
                      style={selectStyle}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="one_time">One Time</option>
                    </select>
                  </div>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Description *</label>
                  <input
                    type="text"
                    value={deductionForm.description}
                    onChange={(e) => setDeductionForm({ ...deductionForm, description: e.target.value })}
                    style={formInputStyle}
                    placeholder="e.g., Laptop advance recovery"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Total Amount *</label>
                    <input
                      type="number"
                      value={deductionForm.totalAmount}
                      onChange={(e) => setDeductionForm({ ...deductionForm, totalAmount: e.target.value })}
                      style={formInputStyle}
                      required
                    />
                  </div>
                  {deductionForm.deductionMode === 'monthly' && (
                    <div style={formGroupStyle}>
                      <label style={labelStyle}>Monthly Amount</label>
                      <input
                        type="number"
                        value={deductionForm.monthlyAmount}
                        onChange={(e) => setDeductionForm({ ...deductionForm, monthlyAmount: e.target.value })}
                        style={formInputStyle}
                        placeholder="Auto-calculate if empty"
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Start Month</label>
                    <input
                      type="month"
                      value={deductionForm.startMonth}
                      onChange={(e) => setDeductionForm({ ...deductionForm, startMonth: e.target.value })}
                      style={formInputStyle}
                    />
                  </div>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>End Month</label>
                    <input
                      type="month"
                      value={deductionForm.endMonth}
                      onChange={(e) => setDeductionForm({ ...deductionForm, endMonth: e.target.value })}
                      style={formInputStyle}
                    />
                  </div>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Reference ID (Advance/Loan ID)</label>
                  <input
                    type="text"
                    value={deductionForm.referenceId}
                    onChange={(e) => setDeductionForm({ ...deductionForm, referenceId: e.target.value })}
                    style={formInputStyle}
                    placeholder="e.g., ADV-2024-001"
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Notes</label>
                  <textarea
                    value={deductionForm.notes}
                    onChange={(e) => setDeductionForm({ ...deductionForm, notes: e.target.value })}
                    style={{ ...formInputStyle, minHeight: '80px', resize: 'vertical' }}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div style={modalFooterStyle}>
                <button type="button" onClick={() => setShowAddDeductionModal(false)} style={{ ...buttonStyle('default'), padding: '12px 24px' }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ ...buttonStyle('primary'), padding: '12px 24px', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Adding...' : 'Add Deduction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Slip Modal */}
      {showSlipModal && slipData && (
        <div style={modalOverlayStyle} onClick={() => setShowSlipModal(false)}>
          <div style={{ ...modalStyle, maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>Salary Slip</h2>
                <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{slipData.period?.month} {slipData.period?.year}</p>
              </div>
              <button onClick={() => setShowSlipModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#94a3b8' }}>&times;</button>
            </div>
            <div style={modalBodyStyle}>
              {/* Employee Info */}
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <User size={18} style={{ color: '#C59C82' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Employee Name</div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{slipData.employee?.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Building2 size={18} style={{ color: '#C59C82' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Department</div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{slipData.employee?.department || 'N/A'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calendar size={18} style={{ color: '#C59C82' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Employee ID</div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{slipData.employee?.employeeId || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Salary Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Earnings */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#dcfce7', padding: '12px 16px', fontWeight: '600', color: '#166534' }}>Earnings</div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>Basic Salary</span><span style={{ fontWeight: '500' }}>{formatCurrency(slipData.earnings?.basicSalary)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>HRA</span><span style={{ fontWeight: '500' }}>{formatCurrency(slipData.earnings?.hra)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>Other Allowances</span><span style={{ fontWeight: '500' }}>{formatCurrency(slipData.earnings?.otherAllowances)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: '600', fontSize: '15px' }}><span>Gross Salary</span><span style={{ color: '#059669' }}>{formatCurrency(slipData.earnings?.grossSalary)}</span></div>
                  </div>
                </div>

                {/* Deductions */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ backgroundColor: '#fee2e2', padding: '12px 16px', fontWeight: '600', color: '#991b1b' }}>Deductions</div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>EPFO Employee</span><span style={{ fontWeight: '500' }}>{formatCurrency(slipData.deductions?.epfoEmployee)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>ESIC Employee</span><span style={{ fontWeight: '500' }}>{formatCurrency(slipData.deductions?.esicEmployee)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>Professional Tax</span><span style={{ fontWeight: '500' }}>{formatCurrency(slipData.deductions?.professionalTax)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}><span style={{ color: '#64748b' }}>Income Tax</span><span style={{ fontWeight: '500' }}>{formatCurrency(slipData.deductions?.incomeTax)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: '600', fontSize: '15px' }}><span>Total Deductions</span><span style={{ color: '#dc2626' }}>{formatCurrency(slipData.deductions?.totalDeductions)}</span></div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div style={{ backgroundColor: '#C59C82', borderRadius: '12px', padding: '24px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'white' }}>
                  <div style={{ fontSize: '14px', opacity: 0.8 }}>Net Salary (Take Home)</div>
                  <div style={{ fontSize: '28px', fontWeight: '700' }}>{formatCurrency(slipData.netSalary)}</div>
                </div>
                <button style={{ backgroundColor: 'white', color: '#C59C82', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={18} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalaryManagement
