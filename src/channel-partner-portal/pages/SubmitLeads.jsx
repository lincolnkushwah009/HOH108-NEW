import { useState, useRef, useEffect } from 'react'
import {
  UserPlus,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  XCircle,
  Loader,
  Shield,
  Zap,
  Database,
  ScanLine,
  Copy,
  Phone,
  User
} from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`
const PRIMARY_COLOR = '#C59C82'
const PRIMARY_DARK = '#a8825e'

const CITIES = ['Bengaluru', 'Mysuru', 'Hyderabad']
const CATEGORIES = ['interior', 'construction', 'renovation']

const MIN_SCAN_DURATION = 3500 // 3.5 seconds minimum animation

// Scanning animation component
const ScanningOverlay = ({ phase, scanProgress, currentRow, totalRows, scanMessages }) => {
  return (
    <div style={{
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '20px',
      background: 'linear-gradient(145deg, #0a0f1e 0%, #131b2e 40%, #0d1525 100%)',
      border: '1px solid rgba(197, 156, 130, 0.2)',
      position: 'relative',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      {/* Animated scan line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${PRIMARY_COLOR}, transparent)`,
        animation: 'scanLine 2s ease-in-out infinite',
        zIndex: 2,
      }} />

      {/* Particle dots */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: PRIMARY_COLOR,
            opacity: 0.4,
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animation: `float ${2 + i * 0.5}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>

      {/* Grid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(197, 156, 130, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(197, 156, 130, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
      }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '28px 28px 24px' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: `rgba(197, 156, 130, 0.1)`,
              border: `1px solid rgba(197, 156, 130, 0.25)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'iconGlow 2s ease-in-out infinite',
            }}>
              {phase === 'parsing' && <Database size={20} color={PRIMARY_COLOR} />}
              {phase === 'scanning' && <ScanLine size={20} color={PRIMARY_COLOR} style={{ animation: 'spin 2s linear infinite' }} />}
              {phase === 'matching' && <Copy size={20} color={PRIMARY_COLOR} style={{ animation: 'pulse 1s ease-in-out infinite' }} />}
              {phase === 'complete' && <Shield size={20} color={PRIMARY_COLOR} />}
            </div>
            <div>
              <div style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#e2e8f0',
                letterSpacing: '0.3px',
              }}>
                {phase === 'parsing' && 'Parsing Spreadsheet...'}
                {phase === 'scanning' && 'Scanning Database...'}
                {phase === 'matching' && 'Matching Duplicates...'}
                {phase === 'complete' && 'Analysis Complete'}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(197, 156, 130, 0.8)',
                fontFamily: 'monospace',
                marginTop: '3px',
              }}>
                {scanMessages[scanMessages.length - 1] || ''}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(197, 156, 130, 0.1)',
            border: '1px solid rgba(197, 156, 130, 0.15)',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: phase === 'complete' ? '#22c55e' : PRIMARY_COLOR,
              animation: phase === 'complete' ? 'none' : 'blink 1s ease-in-out infinite',
              boxShadow: `0 0 6px ${phase === 'complete' ? '#22c55e' : PRIMARY_COLOR}`,
            }} />
            <span style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: phase === 'complete' ? '#22c55e' : PRIMARY_COLOR,
              fontWeight: '600',
              letterSpacing: '1px',
            }}>
              {phase === 'complete' ? 'DONE' : 'LIVE'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '20px',
        }}>
          <div style={{
            height: '100%',
            width: `${scanProgress}%`,
            background: `linear-gradient(90deg, ${PRIMARY_COLOR}90, ${PRIMARY_COLOR})`,
            borderRadius: '2px',
            transition: 'width 0.15s ease-out',
            position: 'relative',
            boxShadow: `0 0 12px ${PRIMARY_COLOR}50`,
          }} />
        </div>

        {/* Terminal output */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          padding: '14px 16px',
          fontFamily: 'monospace',
          fontSize: '11px',
          maxHeight: '100px',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          {scanMessages.map((msg, i) => (
            <div key={i} style={{
              color: i === scanMessages.length - 1 ? '#e2e8f0' : 'rgba(148, 163, 184, 0.5)',
              padding: '2px 0',
              display: 'flex',
              gap: '8px',
              animation: i === scanMessages.length - 1 ? 'fadeIn 0.3s ease-out' : 'none',
            }}>
              <span style={{ color: PRIMARY_COLOR, opacity: 0.7 }}>{'>'}</span>
              {msg}
            </div>
          ))}
          <span style={{ animation: 'blink 0.7s ease-in-out infinite', color: PRIMARY_COLOR }}>_</span>
        </div>

        {/* Bottom stats */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginTop: '16px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: 'rgba(148, 163, 184, 0.4)',
        }}>
          <span>ROWS <span style={{ color: '#e2e8f0' }}>{currentRow}/{totalRows || '?'}</span></span>
          <span>PROGRESS <span style={{ color: PRIMARY_COLOR }}>{scanProgress}%</span></span>
          <span>PHASE <span style={{ color: '#e2e8f0', textTransform: 'uppercase' }}>{phase}</span></span>
        </div>
      </div>
    </div>
  )
}

// Animated counter
const AnimatedNumber = ({ value, color }) => {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    let start = 0
    const duration = 800
    const stepTime = Math.max(Math.floor(duration / value), 40)
    const timer = setInterval(() => {
      start++
      setDisplay(start)
      if (start >= value) clearInterval(timer)
    }, stepTime)
    return () => clearInterval(timer)
  }, [value])

  return (
    <span style={{
      fontSize: '36px',
      fontWeight: '800',
      color,
      fontFamily: "'Inter', system-ui, sans-serif",
      lineHeight: 1,
    }}>
      {display}
    </span>
  )
}

const SubmitLeads = () => {
  const [activeTab, setActiveTab] = useState('single')
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', city: '', category: '', propertyType: '', budgetRange: '', notes: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formMessage, setFormMessage] = useState({ type: '', text: '' })

  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [showResults, setShowResults] = useState(false)

  // Scan animation state
  const [scanPhase, setScanPhase] = useState('parsing')
  const [scanProgress, setScanProgress] = useState(0)
  const [scanRow, setScanRow] = useState(0)
  const [scanMessages, setScanMessages] = useState([])
  const scanIntervalRef = useRef(null)

  useEffect(() => {
    if (validationResult && !validationResult.error) {
      const timer = setTimeout(() => setShowResults(true), 400)
      return () => clearTimeout(timer)
    }
    setShowResults(false)
  }, [validationResult])

  // Manage scan animation
  const startScanAnimation = (totalRows) => {
    setScanPhase('parsing')
    setScanProgress(0)
    setScanRow(0)
    setScanMessages(['Initializing scan engine...'])

    const messages = [
      'Reading file headers...',
      `Found ${totalRows || '?'} data rows`,
      'Connecting to lead database...',
      'Starting duplicate check...',
      'Scanning row 1...',
      'Cross-referencing phone numbers...',
      'Checking company records...',
      'Validating data integrity...',
      'Matching against existing leads...',
      'Compiling scan report...',
      'Generating summary...',
      'Scan complete.',
    ]

    let msgIndex = 0
    let progress = 0

    // Phase transitions
    setTimeout(() => setScanPhase('scanning'), 800)
    setTimeout(() => setScanPhase('matching'), 2000)
    setTimeout(() => setScanPhase('complete'), 3200)

    scanIntervalRef.current = setInterval(() => {
      progress += 2.5
      if (progress > 100) progress = 100

      setScanProgress(Math.round(progress))
      setScanRow(prev => Math.min(prev + 1, totalRows || 10))

      if (msgIndex < messages.length && progress > (msgIndex + 1) * (100 / messages.length)) {
        setScanMessages(prev => [...prev.slice(-5), messages[msgIndex]])
        msgIndex++
      }

      if (progress >= 100) {
        clearInterval(scanIntervalRef.current)
      }
    }, 85)
  }

  const stopScanAnimation = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    setScanProgress(100)
    setScanPhase('complete')
    setScanMessages(prev => [...prev.slice(-5), 'Scan complete.'])
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', fontSize: '14px', border: '1px solid #e5e7eb',
    borderRadius: '10px', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box',
    background: '#fafafa',
  }
  const selectStyle = { ...inputStyle, background: '#fafafa', cursor: 'pointer', appearance: 'auto' }
  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', letterSpacing: '0.2px' }

  const handleFormChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const handleSingleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormMessage({ type: '', text: '' })
    try {
      const token = localStorage.getItem('channel_partner_token')
      const response = await fetch(`${API_BASE}/channel-partner-portal/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (response.status === 409) {
        setFormMessage({ type: 'warning', text: data.message || 'Duplicate: Lead with this phone already exists' })
        return
      }
      if (!response.ok) throw new Error(data.message || 'Failed to submit lead')
      setFormMessage({ type: 'success', text: 'Lead submitted successfully!' })
      setFormData({ name: '', phone: '', email: '', city: '', category: '', propertyType: '', budgetRange: '', notes: '' })
    } catch (err) {
      setFormMessage({ type: 'error', text: err.message })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv']
      if (validTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.xls')) {
        setSelectedFile(file); setUploadResult(null); setValidationResult(null); validateFile(file)
      } else {
        setUploadResult({ error: true, message: 'Please upload a valid Excel (.xlsx, .xls) or CSV file' })
      }
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) { setSelectedFile(file); setUploadResult(null); setValidationResult(null); validateFile(file) }
  }

  const validateFile = async (file) => {
    setValidating(true)
    setValidationResult(null)
    setUploadResult(null)
    setShowResults(false)

    // Start animation
    startScanAnimation(10)
    const animStart = Date.now()

    let result = null
    try {
      const token = localStorage.getItem('channel_partner_token')
      const formDataObj = new FormData()
      formDataObj.append('file', file)
      const response = await fetch(`${API_BASE}/channel-partner-portal/leads/validate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataObj
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Validation failed')
      result = data.data
    } catch (err) {
      result = { error: true, message: err.message }
    }

    // Wait for minimum animation duration
    const elapsed = Date.now() - animStart
    const remaining = Math.max(0, MIN_SCAN_DURATION - elapsed)

    setTimeout(() => {
      stopScanAnimation()
      // Small delay after "complete" before showing results
      setTimeout(() => {
        setValidationResult(result)
        setValidating(false)
      }, 500)
    }, remaining)
  }

  const handleBulkUpload = async () => {
    if (!selectedFile) return
    setUploadLoading(true); setUploadResult(null)
    try {
      const token = localStorage.getItem('channel_partner_token')
      const formDataObj = new FormData()
      formDataObj.append('file', selectedFile)
      const response = await fetch(`${API_BASE}/channel-partner-portal/leads/bulk`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formDataObj
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Upload failed')
      setUploadResult({ success: true, created: data.data?.created || 0, duplicates: data.data?.duplicates || [], errors: data.data?.errors || [] })
      setSelectedFile(null); setValidationResult(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setUploadResult({ error: true, message: err.message })
    } finally {
      setUploadLoading(false)
    }
  }

  const downloadTemplate = () => {
    const headers = ['Name', 'Phone', 'Email', 'City', 'Category', 'Property Type', 'Budget Range', 'Notes']
    const sampleRow = ['John Doe', '9876543210', 'john@email.com', 'Bengaluru', 'interior', '2BHK', '10-20 Lakhs', 'Interested in modular kitchen']
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'leads_template.csv'
    document.body.appendChild(a); a.click(); document.body.removeChild(a); window.URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>Submit Leads</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f3f4f6', borderRadius: '12px', padding: '4px' }}>
        {[
          { id: 'single', label: 'Single Lead', icon: UserPlus },
          { id: 'bulk', label: 'Bulk Upload', icon: Upload }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '10px 20px', border: 'none',
              background: isActive ? 'white' : 'transparent',
              fontSize: '14px', fontWeight: '500',
              color: isActive ? '#1f2937' : '#6b7280',
              cursor: 'pointer', borderRadius: '8px',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}>
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Single Lead Form */}
      {activeTab === 'single' && (
        <form onSubmit={handleSingleSubmit}>
          {formMessage.text && (
            <div style={{
              padding: '14px 16px', marginBottom: '20px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', gap: '10px',
              background: formMessage.type === 'success' ? '#dcfce7' : formMessage.type === 'warning' ? '#fef3c7' : '#fee2e2',
              color: formMessage.type === 'success' ? '#16a34a' : formMessage.type === 'warning' ? '#d97706' : '#dc2626',
              border: `1px solid ${formMessage.type === 'success' ? '#bbf7d0' : formMessage.type === 'warning' ? '#fde68a' : '#fecaca'}`,
            }}>
              {formMessage.type === 'success' ? <CheckCircle size={18} /> : formMessage.type === 'warning' ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{formMessage.text}</span>
            </div>
          )}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div><label style={labelStyle}>Name *</label><input type="text" value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} style={inputStyle} placeholder="Enter lead name" onFocus={(e) => { e.target.style.borderColor = PRIMARY_COLOR; e.target.style.background = 'white'; e.target.style.boxShadow = `0 0 0 3px ${PRIMARY_COLOR}15` }} onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none' }} required /></div>
              <div><label style={labelStyle}>Phone *</label><input type="tel" value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} style={inputStyle} placeholder="Enter phone number" onFocus={(e) => { e.target.style.borderColor = PRIMARY_COLOR; e.target.style.background = 'white'; e.target.style.boxShadow = `0 0 0 3px ${PRIMARY_COLOR}15` }} onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none' }} required /></div>
              <div><label style={labelStyle}>Email</label><input type="email" value={formData.email} onChange={(e) => handleFormChange('email', e.target.value)} style={inputStyle} placeholder="Enter email address" onFocus={(e) => { e.target.style.borderColor = PRIMARY_COLOR; e.target.style.background = 'white'; e.target.style.boxShadow = `0 0 0 3px ${PRIMARY_COLOR}15` }} onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none' }} /></div>
              <div><label style={labelStyle}>City *</label><select value={formData.city} onChange={(e) => handleFormChange('city', e.target.value)} style={selectStyle} required><option value="">Select city</option>{CITIES.map(city => (<option key={city} value={city}>{city}</option>))}</select></div>
              <div><label style={labelStyle}>Category *</label><select value={formData.category} onChange={(e) => handleFormChange('category', e.target.value)} style={selectStyle} required><option value="">Select category</option>{CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>))}</select></div>
              <div><label style={labelStyle}>Property Type</label><input type="text" value={formData.propertyType} onChange={(e) => handleFormChange('propertyType', e.target.value)} style={inputStyle} placeholder="e.g., 2BHK, Villa, Office" onFocus={(e) => { e.target.style.borderColor = PRIMARY_COLOR; e.target.style.background = 'white'; e.target.style.boxShadow = `0 0 0 3px ${PRIMARY_COLOR}15` }} onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none' }} /></div>
              <div><label style={labelStyle}>Budget Range</label><input type="text" value={formData.budgetRange} onChange={(e) => handleFormChange('budgetRange', e.target.value)} style={inputStyle} placeholder="e.g., 10-20 Lakhs" onFocus={(e) => { e.target.style.borderColor = PRIMARY_COLOR; e.target.style.background = 'white'; e.target.style.boxShadow = `0 0 0 3px ${PRIMARY_COLOR}15` }} onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none' }} /></div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={formData.notes} onChange={(e) => handleFormChange('notes', e.target.value)} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Additional notes..." onFocus={(e) => { e.target.style.borderColor = PRIMARY_COLOR; e.target.style.background = 'white'; e.target.style.boxShadow = `0 0 0 3px ${PRIMARY_COLOR}15` }} onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; e.target.style.boxShadow = 'none' }} />
            </div>
            <button type="submit" disabled={formLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', background: PRIMARY_COLOR, color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: formLoading ? 'not-allowed' : 'pointer', opacity: formLoading ? 0.6 : 1, transition: 'all 0.2s', boxShadow: `0 2px 8px ${PRIMARY_COLOR}40` }} onMouseOver={(e) => !formLoading && (e.target.style.background = PRIMARY_DARK)} onMouseOut={(e) => !formLoading && (e.target.style.background = PRIMARY_COLOR)}>
              {formLoading ? (<><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>) : (<><UserPlus size={18} /> Submit Lead</>)}
            </button>
          </div>
        </form>
      )}

      {/* Bulk Upload */}
      {activeTab === 'bulk' && (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 4px 0' }}>Upload Excel/CSV File</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Download the template, fill in lead details, and upload</p>
            </div>
            <button onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: `1px solid ${PRIMARY_COLOR}`, borderRadius: '10px', background: 'white', color: PRIMARY_COLOR, fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Download size={18} /> Download Template
            </button>
          </div>

          {/* Drop Zone */}
          {!validating && (
            <div onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} style={{
              border: `2px dashed ${dragActive ? PRIMARY_COLOR : '#d1d5db'}`, borderRadius: '16px',
              padding: '52px 24px', textAlign: 'center', cursor: 'pointer',
              background: dragActive ? `linear-gradient(135deg, ${PRIMARY_COLOR}08, ${PRIMARY_COLOR}04)` : 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
              transition: 'all 0.3s ease', marginBottom: '20px',
              transform: dragActive ? 'scale(1.01)' : 'scale(1)',
            }}>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} style={{ display: 'none' }} />
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 16px',
                background: dragActive ? `${PRIMARY_COLOR}15` : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                <FileSpreadsheet size={28} color={dragActive ? PRIMARY_COLOR : '#94a3b8'} />
              </div>
              {selectedFile ? (
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937', margin: '0 0 4px 0' }}>{selectedFile.name}</p>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '15px', fontWeight: '500', color: '#374151', margin: '0 0 6px 0' }}>Drag and drop your file here, or click to browse</p>
                  <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Supports .xlsx, .xls, and .csv files (max 5MB)</p>
                </div>
              )}
            </div>
          )}

          {/* Scanning Animation */}
          {validating && (
            <ScanningOverlay
              phase={scanPhase}
              scanProgress={scanProgress}
              currentRow={scanRow}
              totalRows={validationResult?.totalRows || 10}
              scanMessages={scanMessages}
            />
          )}

          {/* Validation Results */}
          {validationResult && !validationResult.error && !uploadResult && showResults && (
            <div style={{
              borderRadius: '20px', overflow: 'hidden', marginBottom: '20px',
              border: '1px solid #e2e8f0', animation: 'fadeSlideIn 0.6s ease-out',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}>
              {/* Header */}
              <div style={{
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Shield size={16} color="#22c55e" />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  Scan Report
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'rgba(197, 156, 130, 0.8)', fontFamily: 'monospace' }}>
                  {validationResult.totalRows} rows
                </span>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {/* New */}
                <div style={{
                  padding: '24px 16px', textAlign: 'center',
                  background: validationResult.fresh > 0 ? 'linear-gradient(180deg, #f0fdf4, white)' : 'linear-gradient(180deg, #f8fafc, white)',
                  borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9',
                  animation: 'fadeSlideIn 0.5s ease-out 0.1s both',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 12px',
                    background: validationResult.fresh > 0 ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: validationResult.fresh > 0 ? '0 4px 12px rgba(22, 163, 74, 0.15)' : 'none',
                  }}>
                    <CheckCircle size={22} color={validationResult.fresh > 0 ? '#16a34a' : '#94a3b8'} />
                  </div>
                  <AnimatedNumber value={validationResult.fresh} color={validationResult.fresh > 0 ? '#16a34a' : '#94a3b8'} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: validationResult.fresh > 0 ? '#15803d' : '#64748b', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>New Leads</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{validationResult.fresh > 0 ? 'Ready to import' : 'None found'}</div>
                </div>

                {/* Duplicates */}
                <div style={{
                  padding: '24px 16px', textAlign: 'center',
                  background: validationResult.duplicates?.length > 0 ? 'linear-gradient(180deg, #fffbeb, white)' : 'linear-gradient(180deg, #f8fafc, white)',
                  borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9',
                  animation: 'fadeSlideIn 0.5s ease-out 0.2s both',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 12px',
                    background: validationResult.duplicates?.length > 0 ? 'linear-gradient(135deg, #fef3c7, #fde68a)' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: validationResult.duplicates?.length > 0 ? '0 4px 12px rgba(217, 119, 6, 0.15)' : 'none',
                  }}>
                    <Copy size={22} color={validationResult.duplicates?.length > 0 ? '#d97706' : '#94a3b8'} />
                  </div>
                  <AnimatedNumber value={validationResult.duplicates?.length || 0} color={validationResult.duplicates?.length > 0 ? '#d97706' : '#94a3b8'} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: validationResult.duplicates?.length > 0 ? '#92400e' : '#64748b', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Duplicates</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{validationResult.duplicates?.length > 0 ? 'Already in system' : 'None found'}</div>
                </div>

                {/* Errors */}
                <div style={{
                  padding: '24px 16px', textAlign: 'center',
                  background: validationResult.errors?.length > 0 ? 'linear-gradient(180deg, #fef2f2, white)' : 'linear-gradient(180deg, #f8fafc, white)',
                  borderBottom: '1px solid #f1f5f9',
                  animation: 'fadeSlideIn 0.5s ease-out 0.3s both',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 12px',
                    background: validationResult.errors?.length > 0 ? 'linear-gradient(135deg, #fee2e2, #fecaca)' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: validationResult.errors?.length > 0 ? '0 4px 12px rgba(220, 38, 38, 0.15)' : 'none',
                  }}>
                    <AlertCircle size={22} color={validationResult.errors?.length > 0 ? '#dc2626' : '#94a3b8'} />
                  </div>
                  <AnimatedNumber value={validationResult.errors?.length || 0} color={validationResult.errors?.length > 0 ? '#dc2626' : '#94a3b8'} />
                  <div style={{ fontSize: '11px', fontWeight: '700', color: validationResult.errors?.length > 0 ? '#991b1b' : '#64748b', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Errors</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{validationResult.errors?.length > 0 ? 'Invalid rows' : 'All valid'}</div>
                </div>
              </div>

              {/* Duplicate list */}
              {validationResult.duplicates?.length > 0 && (
                <div style={{ padding: '20px 24px', background: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={13} color="#d97706" />
                    </div>
                    <span style={{ fontWeight: '600', color: '#92400e', fontSize: '13px' }}>Duplicate leads will be skipped</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {validationResult.duplicates.map((dup, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', borderRadius: '12px',
                        background: '#fffbeb', border: '1px solid #fde68a',
                        animation: `fadeSlideIn 0.4s ease-out ${0.4 + i * 0.12}s both`,
                      }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <User size={16} color="#92400e" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', color: '#78350f', fontSize: '14px' }}>{dup.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Phone size={11} color="#b45309" />
                            <span style={{ color: '#b45309', fontSize: '12px' }}>{dup.phone}</span>
                          </div>
                        </div>
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px',
                          background: 'linear-gradient(135deg, #fde68a, #fcd34d)',
                          color: '#78350f', fontSize: '10px', fontWeight: '700',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}>
                          Exists
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error list */}
              {validationResult.errors?.length > 0 && (
                <div style={{ padding: '16px 24px', background: 'white', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertCircle size={13} color="#dc2626" />
                    </div>
                    <span style={{ fontWeight: '600', color: '#991b1b', fontSize: '13px' }}>Rows with errors</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {validationResult.errors.map((err, i) => (
                      <div key={i} style={{ fontSize: '13px', color: '#991b1b', padding: '6px 12px', borderRadius: '6px', background: '#fef2f2' }}>
                        <span style={{ fontWeight: '600' }}>Row {err.row}:</span> {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              {validationResult.fresh > 0 ? (
                <div style={{
                  padding: '14px 24px', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                  borderTop: '1px solid #bbf7d0', fontSize: '13px', color: '#15803d',
                  display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500',
                }}>
                  <Zap size={16} />
                  Ready to import {validationResult.fresh} new lead(s).
                  {validationResult.duplicates?.length > 0 && ` ${validationResult.duplicates.length} duplicate(s) will be skipped.`}
                </div>
              ) : (
                <div style={{
                  padding: '14px 24px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                  borderTop: '1px solid #fde68a', fontSize: '13px', color: '#92400e',
                  display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500',
                }}>
                  <AlertTriangle size={16} />
                  All leads are duplicates or have errors. Nothing to upload.
                </div>
              )}
            </div>
          )}

          {validationResult?.error && (
            <div style={{ padding: '16px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', border: '1px solid #fecaca' }}>
              <AlertCircle size={20} /> {validationResult.message}
            </div>
          )}

          {/* Buttons */}
          {selectedFile && !validating && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button onClick={handleBulkUpload} disabled={uploadLoading || (validationResult && validationResult.fresh === 0)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px',
                  background: (validationResult && validationResult.fresh === 0) ? '#cbd5e1' : `linear-gradient(135deg, ${PRIMARY_COLOR}, ${PRIMARY_DARK})`,
                  color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                  cursor: (uploadLoading || (validationResult && validationResult.fresh === 0)) ? 'not-allowed' : 'pointer',
                  opacity: uploadLoading ? 0.7 : 1, transition: 'all 0.2s',
                  boxShadow: (validationResult && validationResult.fresh === 0) ? 'none' : `0 4px 14px ${PRIMARY_COLOR}40`,
                }}>
                {uploadLoading ? (<><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...</>) : (<><Upload size={18} /> Upload File</>)}
              </button>
              <button onClick={() => { setSelectedFile(null); setValidationResult(null); setUploadResult(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <X size={18} /> Clear
              </button>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div style={{ animation: 'fadeSlideIn 0.5s ease-out' }}>
              {uploadResult.error ? (
                <div style={{ padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                  <AlertCircle size={20} /> {uploadResult.message}
                </div>
              ) : (
                <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid #bbf7d0', background: 'white', boxShadow: '0 4px 20px rgba(22, 163, 74, 0.1)' }}>
                  <div style={{ padding: '28px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 6px 20px rgba(22, 163, 74, 0.3)', animation: 'scaleIn 0.5s ease-out',
                    }}>
                      <CheckCircle size={28} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#15803d' }}>Upload Successful!</div>
                      <div style={{ fontSize: '14px', color: '#16a34a', marginTop: '4px' }}>{uploadResult.created} lead(s) created and assigned to presales</div>
                    </div>
                  </div>
                  {uploadResult.duplicates?.length > 0 && (
                    <div style={{ padding: '12px 28px', borderTop: '1px solid #bbf7d0', background: 'rgba(254, 243, 199, 0.3)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#92400e' }}>
                      <AlertTriangle size={15} /> <span style={{ fontWeight: '500' }}>{uploadResult.duplicates.length} duplicate(s) skipped</span>
                    </div>
                  )}
                  {uploadResult.errors?.length > 0 && (
                    <div style={{ padding: '12px 28px', borderTop: '1px solid #bbf7d0', background: 'rgba(254, 226, 226, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#991b1b' }}>
                      <AlertCircle size={15} /> <span style={{ fontWeight: '500' }}>{uploadResult.errors.length} row(s) had errors</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scanLine { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(180px); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0); } 70% { transform: scale(1.1); } to { transform: scale(1); } }
        @keyframes iconGlow { 0%, 100% { box-shadow: 0 0 0 rgba(197,156,130,0); } 50% { box-shadow: 0 0 16px rgba(197,156,130,0.3); } }
        @keyframes float { from { transform: translateY(0); } to { transform: translateY(-8px); } }
      `}</style>
    </div>
  )
}

export default SubmitLeads
