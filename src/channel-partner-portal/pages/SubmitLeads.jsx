import { useState, useRef } from 'react'
import {
  UserPlus,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  Loader
} from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`
const PRIMARY_COLOR = '#C59C82'
const PRIMARY_DARK = '#a8825e'

const CITIES = ['Bengaluru', 'Mysuru', 'Hyderabad']
const CATEGORIES = ['interior', 'construction', 'renovation']

const SubmitLeads = () => {
  const [activeTab, setActiveTab] = useState('single')
  const fileInputRef = useRef(null)

  // Single lead form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    category: '',
    propertyType: '',
    budgetRange: '',
    notes: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formMessage, setFormMessage] = useState({ type: '', text: '' })

  // Bulk upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const selectStyle = {
    ...inputStyle,
    background: 'white',
    cursor: 'pointer',
    appearance: 'auto',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSingleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('channel_partner_token')
      const response = await fetch(`${API_BASE}/channel-partner-portal/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.status === 409) {
        setFormMessage({
          type: 'warning',
          text: data.message || 'Duplicate: Lead with this phone already exists'
        })
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit lead')
      }

      setFormMessage({ type: 'success', text: 'Lead submitted successfully!' })
      setFormData({
        name: '',
        phone: '',
        email: '',
        city: '',
        category: '',
        propertyType: '',
        budgetRange: '',
        notes: ''
      })
    } catch (err) {
      setFormMessage({ type: 'error', text: err.message })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ]
      if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.xls')) {
        setSelectedFile(file)
        setUploadResult(null)
      } else {
        setUploadResult({
          error: true,
          message: 'Please upload a valid Excel (.xlsx, .xls) or CSV file'
        })
      }
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setUploadResult(null)
    }
  }

  const handleBulkUpload = async () => {
    if (!selectedFile) return

    setUploadLoading(true)
    setUploadResult(null)

    try {
      const token = localStorage.getItem('channel_partner_token')
      const formDataObj = new FormData()
      formDataObj.append('file', selectedFile)

      const response = await fetch(`${API_BASE}/channel-partner-portal/leads/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed')
      }

      setUploadResult({
        success: true,
        created: data.data?.created || 0,
        duplicates: data.data?.duplicates || [],
        errors: data.data?.errors || []
      })
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setUploadResult({ error: true, message: err.message })
    } finally {
      setUploadLoading(false)
    }
  }

  const downloadTemplate = () => {
    // Generate a CSV template for download
    const headers = ['Name', 'Phone', 'Email', 'City', 'Category', 'Property Type', 'Budget Range', 'Notes']
    const sampleRow = ['John Doe', '9876543210', 'john@email.com', 'Bengaluru', 'interior', '2BHK', '10-20 Lakhs', 'Interested in modular kitchen']
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
        Submit Leads
      </h1>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '0'
      }}>
        {[
          { id: 'single', label: 'Single Lead', icon: UserPlus },
          { id: 'bulk', label: 'Bulk Upload', icon: Upload }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                fontSize: '14px',
                fontWeight: '500',
                color: isActive ? PRIMARY_COLOR : '#6b7280',
                cursor: 'pointer',
                borderBottom: isActive ? `2px solid ${PRIMARY_COLOR}` : '2px solid transparent',
                marginBottom: '-1px'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Single Lead Form */}
      {activeTab === 'single' && (
        <form onSubmit={handleSingleSubmit}>
          {/* Message */}
          {formMessage.text && (
            <div style={{
              padding: '16px',
              marginBottom: '24px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: formMessage.type === 'success' ? '#dcfce7'
                : formMessage.type === 'warning' ? '#fef3c7'
                : '#fee2e2',
              color: formMessage.type === 'success' ? '#16a34a'
                : formMessage.type === 'warning' ? '#d97706'
                : '#dc2626'
            }}>
              {formMessage.type === 'success' ? <CheckCircle size={20} />
                : formMessage.type === 'warning' ? <AlertTriangle size={20} />
                : <AlertCircle size={20} />}
              {formMessage.text}
            </div>
          )}

          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '24px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter lead name"
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter phone number"
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  style={inputStyle}
                  placeholder="Enter email address"
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* City */}
              <div>
                <label style={labelStyle}>City *</label>
                <select
                  value={formData.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  style={selectStyle}
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  required
                >
                  <option value="">Select city</option>
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  style={selectStyle}
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} style={{ textTransform: 'capitalize' }}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Property Type */}
              <div>
                <label style={labelStyle}>Property Type</label>
                <input
                  type="text"
                  value={formData.propertyType}
                  onChange={(e) => handleFormChange('propertyType', e.target.value)}
                  style={inputStyle}
                  placeholder="e.g., 2BHK, Villa, Office"
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Budget Range */}
              <div>
                <label style={labelStyle}>Budget Range</label>
                <input
                  type="text"
                  value={formData.budgetRange}
                  onChange={(e) => handleFormChange('budgetRange', e.target.value)}
                  style={inputStyle}
                  placeholder="e.g., 10-20 Lakhs"
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                style={{
                  ...inputStyle,
                  minHeight: '100px',
                  resize: 'vertical'
                }}
                placeholder="Additional notes about the lead..."
                onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={formLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 32px',
                background: PRIMARY_COLOR,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: formLoading ? 'not-allowed' : 'pointer',
                opacity: formLoading ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => !formLoading && (e.target.style.background = PRIMARY_DARK)}
              onMouseOut={(e) => !formLoading && (e.target.style.background = PRIMARY_COLOR)}
            >
              {formLoading ? (
                <>
                  <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Submitting...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Submit Lead
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Bulk Upload */}
      {activeTab === 'bulk' && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          padding: '24px'
        }}>
          {/* Download Template */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 4px 0' }}>
                Upload Excel/CSV File
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Download the template, fill in lead details, and upload
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                border: `1px solid ${PRIMARY_COLOR}`,
                borderRadius: '8px',
                background: 'white',
                color: PRIMARY_COLOR,
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Download size={18} />
              Download Template
            </button>
          </div>

          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? PRIMARY_COLOR : '#d1d5db'}`,
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragActive ? `${PRIMARY_COLOR}08` : '#f9fafb',
              transition: 'all 0.2s',
              marginBottom: '24px'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <FileSpreadsheet size={48} color={dragActive ? PRIMARY_COLOR : '#9ca3af'} style={{ margin: '0 auto 16px' }} />
            {selectedFile ? (
              <div>
                <p style={{ fontSize: '16px', fontWeight: '500', color: '#1f2937', margin: '0 0 4px 0' }}>
                  {selectedFile.name}
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '16px', fontWeight: '500', color: '#374151', margin: '0 0 8px 0' }}>
                  Drag and drop your file here, or click to browse
                </p>
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                  Supports .xlsx, .xls, and .csv files
                </p>
              </div>
            )}
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={handleBulkUpload}
                disabled={uploadLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 32px',
                  background: PRIMARY_COLOR,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: uploadLoading ? 'not-allowed' : 'pointer',
                  opacity: uploadLoading ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {uploadLoading ? (
                  <>
                    <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload File
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
                Clear
              </button>
            </div>
          )}

          {/* Upload Results */}
          {uploadResult && (
            <div>
              {uploadResult.error ? (
                <div style={{
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#fee2e2',
                  color: '#dc2626'
                }}>
                  <AlertCircle size={20} />
                  {uploadResult.message}
                </div>
              ) : (
                <div>
                  {/* Success Summary */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: '#dcfce7',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <CheckCircle size={20} />
                    <span style={{ fontWeight: '500' }}>
                      {uploadResult.created} lead(s) created successfully
                    </span>
                  </div>

                  {/* Duplicates */}
                  {uploadResult.duplicates && uploadResult.duplicates.length > 0 && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: '#fef3c7',
                      marginBottom: '16px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <AlertTriangle size={18} color="#d97706" />
                        <span style={{ fontWeight: '600', color: '#92400e', fontSize: '14px' }}>
                          {uploadResult.duplicates.length} Duplicate(s) Found
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {uploadResult.duplicates.map((phone, i) => (
                          <span key={i} style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: 'rgba(146,64,14,0.1)',
                            color: '#92400e',
                            fontSize: '13px'
                          }}>
                            {phone}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: '#fee2e2'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <AlertCircle size={18} color="#dc2626" />
                        <span style={{ fontWeight: '600', color: '#991b1b', fontSize: '14px' }}>
                          {uploadResult.errors.length} Error(s)
                        </span>
                      </div>
                      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {uploadResult.errors.map((err, i) => (
                          <div key={i} style={{
                            padding: '8px 12px',
                            borderBottom: i < uploadResult.errors.length - 1 ? '1px solid rgba(220,38,38,0.15)' : 'none',
                            fontSize: '13px',
                            color: '#991b1b'
                          }}>
                            <span style={{ fontWeight: '500' }}>Row {err.row}:</span> {err.error || err.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default SubmitLeads
