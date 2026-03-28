import { useState, useEffect, useRef, useCallback } from 'react'
import { dataMigrationAPI } from '../../utils/api'
import {
  Upload,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Download,
  X,
  Info,
  RefreshCw,
  ChevronDown,
} from 'lucide-react'

const BRAND = '#C59C82'
const BRAND_LIGHT = '#f5ece5'
const BRAND_DARK = '#a37e64'

const DataMigration = () => {
  const [step, setStep] = useState(1)
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [preview, setPreview] = useState(null)
  const [importResults, setImportResults] = useState(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    try {
      const res = await dataMigrationAPI.getEmployees()
      if (res.success) {
        setEmployees(res.data || [])
      } else {
        setError(res.message || 'Failed to fetch employees')
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch employees')
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (f) => {
    setError('')
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ]
    const validExts = ['.xlsx', '.xls', '.csv']
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(f.type) && !validExts.includes(ext)) {
      setError('Invalid file type. Only XLSX, XLS, and CSV files are allowed.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit.')
      return
    }
    setFile(f)
    setPreview(null)
    setImportResults(null)
  }

  const handlePreview = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await dataMigrationAPI.previewPresalesData(formData)
      if (res.success) {
        setPreview(res.data)
        setStep(3)
      } else {
        setError(res.message || 'Failed to parse file')
      }
    } catch (err) {
      setError(err.message || 'Failed to preview file')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file || !selectedEmployee) return
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('employeeId', selectedEmployee)

      const res = await dataMigrationAPI.importPresalesData(formData)
      if (res.success) {
        setImportResults(res.data)
        setStep(4)
      } else {
        setError(res.message || 'Import failed')
      }
    } catch (err) {
      setError(err.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep(1)
    setSelectedEmployee('')
    setFile(null)
    setPreview(null)
    setImportResults(null)
    setError('')
  }

  const selectedEmpName = employees.find(e => e._id === selectedEmployee)?.name || ''

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0' }}>
          Presales Data Migration
        </h1>
        <p style={{ fontSize: '15px', color: '#666', margin: 0 }}>
          Import presales lead data from Excel/CSV files. Leads are matched by phone number; existing leads are updated, new leads are created.
        </p>
      </div>

      {/* Download Template */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 20px', background: BRAND_LIGHT, borderRadius: '10px',
        marginBottom: '24px', border: `1px solid ${BRAND}33`
      }}>
        <Info size={18} style={{ color: BRAND, flexShrink: 0 }} />
        <span style={{ fontSize: '14px', color: '#555', flex: 1 }}>
          Use the official template for 100% import accuracy. Required columns: <b>Client Name</b>, <b>Phone Number</b>.
        </span>
        <button
          onClick={() => dataMigrationAPI.downloadTemplate()}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 18px', background: BRAND, color: '#fff',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap'
          }}
        >
          <Download size={15} /> Download Template
        </button>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', gap: '0' }}>
        {[
          { num: 1, label: 'Select Employee' },
          { num: 2, label: 'Upload File' },
          { num: 3, label: 'Preview Data' },
          { num: 4, label: 'Import Results' },
        ].map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: s.num < step ? 'pointer' : 'default',
            }}
              onClick={() => {
                if (s.num < step && step !== 4) setStep(s.num)
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: step >= s.num ? BRAND : '#e5e7eb',
                color: step >= s.num ? '#fff' : '#9ca3af',
                transition: 'all 0.2s',
              }}>
                {step > s.num ? <CheckCircle2 size={18} /> : s.num}
              </div>
              <span style={{
                fontSize: '13px',
                fontWeight: step === s.num ? '600' : '400',
                color: step >= s.num ? '#1a1a1a' : '#9ca3af',
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
            </div>
            {i < 3 && (
              <div style={{
                flex: 1,
                height: '2px',
                backgroundColor: step > s.num ? BRAND : '#e5e7eb',
                margin: '0 12px',
                transition: 'background-color 0.2s',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#dc2626',
          fontSize: '14px',
        }}>
          <AlertCircle size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Step 1: Select Employee */}
      {step === 1 && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: BRAND_LIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Users size={22} color={BRAND} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
                Select Presales Employee
              </h2>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>
                Choose the employee whose presales data you are migrating. All leads and call activities will be linked to this employee.
              </p>
            </div>
          </div>

          {loadingEmployees ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#666' }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
              Loading employees...
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Employee
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '10px 36px 10px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: selectedEmployee ? '#1a1a1a' : '#9ca3af',
                    backgroundColor: '#fff',
                    appearance: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = BRAND }}
                  onBlur={(e) => { e.target.style.borderColor = '#d1d5db' }}
                >
                  <option value="">-- Select an employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.role?.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#9ca3af',
                }} />
              </div>

              {employees.length === 0 && !loadingEmployees && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  marginTop: '16px',
                  color: '#92400e',
                  fontSize: '13px',
                }}>
                  <Info size={16} />
                  No presales employees found. Make sure employees have the "pre_sales" role assigned.
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedEmployee}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                backgroundColor: selectedEmployee ? BRAND : '#d1d5db',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: selectedEmployee ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { if (selectedEmployee) e.target.style.backgroundColor = BRAND_DARK }}
              onMouseLeave={(e) => { if (selectedEmployee) e.target.style.backgroundColor = BRAND }}
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Upload File */}
      {step === 2 && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: BRAND_LIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileSpreadsheet size={22} color={BRAND} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>
                Upload Presales Data File
              </h2>
              <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>
                Uploading for: <strong>{selectedEmpName}</strong>
              </p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? BRAND : (file ? '#10b981' : '#d1d5db')}`,
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragActive ? BRAND_LIGHT : (file ? '#f0fdf4' : '#f9fafb'),
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            {file ? (
              <div>
                <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 4px 0' }}>
                  {file.name}
                </p>
                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    setPreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  style={{
                    marginTop: '12px',
                    padding: '6px 16px',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <Upload size={40} color={dragActive ? BRAND : '#9ca3af'} style={{ marginBottom: '12px' }} />
                <p style={{ fontSize: '16px', fontWeight: '500', color: '#374151', margin: '0 0 4px 0' }}>
                  {dragActive ? 'Drop your file here' : 'Drag & drop your file here'}
                </p>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                  or click to browse. Supports XLSX, XLS, CSV (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Expected columns info */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Info size={16} color="#0284c7" />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0c4a6e' }}>Expected Columns</span>
            </div>
            <p style={{ fontSize: '12px', color: '#0369a1', margin: 0, lineHeight: '1.6' }}>
              SI No, Lead Source, Final Lead Source, Lead Assigned Month, Lead Assigned Date, Client Name, Phone Number,
              Apartment Name, Assigned To, Alt Num, Call Status, Followup Date, Remarks, Lead Status, Lead Error Status,
              Pipeline, Other Remarks
            </p>
            <p style={{ fontSize: '12px', color: '#0369a1', margin: '8px 0 0 0', lineHeight: '1.6' }}>
              <strong>Remarks format:</strong> Pipe-separated dated entries, e.g. "Feb-12th-RNR|Feb-16th-No requirement"
            </p>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={handlePreview}
              disabled={!file || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                backgroundColor: file && !loading ? BRAND : '#d1d5db',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: file && !loading ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { if (file && !loading) e.target.style.backgroundColor = BRAND_DARK }}
              onMouseLeave={(e) => { if (file && !loading) e.target.style.backgroundColor = BRAND }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Parsing...
                </>
              ) : (
                <>Preview Data <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 3 && preview && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '32px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 4px 0' }}>
                Preview Parsed Data
              </h2>
              <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                Review the data before importing. Employee: <strong>{selectedEmpName}</strong>
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}>
            {[
              { label: 'Total Rows', value: preview.total, color: '#6b7280', bg: '#f3f4f6' },
              { label: 'New Leads', value: preview.new, color: '#059669', bg: '#ecfdf5' },
              { label: 'Existing', value: preview.existing, color: '#d97706', bg: '#fffbeb' },
              { label: 'Invalid', value: preview.invalid, color: '#dc2626', bg: '#fef2f2' },
            ].map((stat) => (
              <div key={stat.label} style={{
                padding: '16px',
                backgroundColor: stat.bg,
                borderRadius: '10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: stat.color, marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Preview Table */}
          <div style={{
            overflowX: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0, zIndex: 1 }}>
                  {['Row', 'Status', 'Client Name', 'Phone', 'Source', 'Lead Status', 'Remarks', 'Existing?'].map((h) => (
                    <th key={h} style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#374151',
                      borderBottom: '2px solid #e5e7eb',
                      whiteSpace: 'nowrap',
                      backgroundColor: '#f9fafb',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid #f3f4f6',
                    backgroundColor: !row.valid ? '#fef2f2' : (row.existing ? '#fffbeb' : '#fff'),
                  }}>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>{row.row}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {row.valid ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: row.existing ? '#fef3c7' : '#d1fae5',
                          color: row.existing ? '#92400e' : '#065f46',
                        }}>
                          {row.existing ? 'Update' : 'New'}
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                        }}>
                          {row.error}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: '500', color: '#1a1a1a' }}>{row.clientName || '-'}</td>
                    <td style={{ padding: '8px 12px', color: '#374151' }}>{row.phone || '-'}</td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>
                      <span title={row.source}>{row.mappedSource}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#6b7280' }}>
                      <span title={row.status}>{row.mappedStatus}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#6b7280', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.remarksCount > 0 ? `${row.remarksCount} entries` : '-'}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#6b7280', fontSize: '12px' }}>
                      {row.existing ? (
                        <span title={`Lead ID: ${row.existing.leadId}`}>
                          {row.existing.leadId || row.existing.name}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
            <button
              onClick={() => setStep(2)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={handleImport}
              disabled={loading || preview.valid === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 28px',
                backgroundColor: !loading && preview.valid > 0 ? '#059669' : '#d1d5db',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: !loading && preview.valid > 0 ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { if (!loading && preview.valid > 0) e.target.style.backgroundColor = '#047857' }}
              onMouseLeave={(e) => { if (!loading && preview.valid > 0) e.target.style.backgroundColor = '#059669' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Importing...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Import {preview.valid} Rows
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && importResults && (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '32px',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <CheckCircle2 size={56} color="#059669" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px 0' }}>
              Migration Complete
            </h2>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Successfully processed {importResults.total} rows
            </p>
          </div>

          {/* Results Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            {[
              { label: 'New Leads Created', value: importResults.imported, color: '#059669', bg: '#ecfdf5', icon: CheckCircle2 },
              { label: 'Leads Updated', value: importResults.updated, color: '#d97706', bg: '#fffbeb', icon: RefreshCw },
              { label: 'Rows Skipped', value: importResults.skipped, color: '#6b7280', bg: '#f3f4f6', icon: ArrowRight },
              { label: 'Errors', value: importResults.errors?.length || 0, color: '#dc2626', bg: '#fef2f2', icon: AlertCircle },
            ].map((stat) => (
              <div key={stat.label} style={{
                padding: '20px',
                backgroundColor: stat.bg,
                borderRadius: '12px',
                textAlign: 'center',
              }}>
                <stat.icon size={24} color={stat.color} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: stat.color, marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Errors List */}
          {importResults.errors && importResults.errors.length > 0 && (
            <div style={{
              border: '1px solid #fecaca',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '24px',
            }}>
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                borderBottom: '1px solid #fecaca',
                fontSize: '14px',
                fontWeight: '600',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertCircle size={16} />
                Errors ({importResults.errors.length})
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {importResults.errors.map((err, i) => (
                  <div key={i} style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #fee2e2',
                    fontSize: '13px',
                    color: '#991b1b',
                  }}>
                    <strong>Row {err.row}</strong>
                    {err.clientName && <span> ({err.clientName})</span>}
                    : {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                backgroundColor: BRAND,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => { e.target.style.backgroundColor = BRAND_DARK }}
              onMouseLeave={(e) => { e.target.style.backgroundColor = BRAND }}
            >
              <RefreshCw size={16} />
              Import Another File
            </button>
          </div>
        </div>
      )}

      {/* Spinner keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default DataMigration
