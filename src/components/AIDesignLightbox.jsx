import { useState, useRef, useEffect } from 'react'
import {
  X,
  Upload,
  Home,
  Layers,
  Palette,
  Sparkles,
  Check,
  ChevronRight,
  FileImage,
  AlertCircle,
  Loader2,
  ArrowRight,
  User,
  Phone,
  Mail,
} from 'lucide-react'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

// Color constants matching HOH108 brand
const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  cardLight: '#242424',
  accent: '#C59C82',
  accentLight: '#DDC5B0',
  accentDark: '#A68B6A',
  textMuted: '#A1A1A1',
  textLight: '#E5E5E5',
  white: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderAccent: 'rgba(197, 156, 130, 0.3)',
}

// Style options - only thing that can't be detected from floor plan
const STYLE_OPTIONS = [
  { id: 'modern', label: 'Modern Minimal', desc: 'Clean lines, neutral tones' },
  { id: 'contemporary', label: 'Contemporary', desc: 'Trendy and bold' },
  { id: 'luxury', label: 'Luxury Classic', desc: 'Elegant and premium' },
  { id: 'scandinavian', label: 'Scandinavian', desc: 'Light and cozy' },
  { id: 'industrial', label: 'Industrial', desc: 'Raw and urban' },
  { id: 'indian-fusion', label: 'Indian Fusion', desc: 'Traditional meets modern' },
]

function AIDesignLightbox({ isOpen, onClose, onGenerate }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState('modern') // Default to modern
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: ''
  })

  const fileInputRef = useRef(null)
  const modalRef = useRef(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentStep(1)
        setUploadedFile(null)
        setPreviewUrl(null)
        setSelectedStyle('modern')
        setIsGenerating(false)
        setIsSubmitting(false)
        setSubmitError('')
        setLeadForm({ name: '', phone: '', email: '' })
      }, 300)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Handle file upload
  const handleFileUpload = (file) => {
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        alert('Please upload a JPG, PNG, or PDF file')
        return
      }
      setUploadedFile(file)
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileUpload(file)
  }

  // Handle lead submission
  const handleLeadSubmit = async () => {
    if (!leadForm.name || !leadForm.phone) {
      setSubmitError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const styleName = STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label || 'Modern Minimal'
      const response = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone,
          source: 'website',
          service: '2d-to-3d',
          websiteSource: 'HOH108',
          notes: [{ content: `2D to 3D Design Request\n\nDesign Style: ${styleName}\nFile Name: ${uploadedFile?.name || 'N/A'}\nFile Type: ${uploadedFile?.type || 'N/A'}` }]
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Failed to submit')

      setCurrentStep(3) // Move to generate step
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle generation
  const handleGenerate = async () => {
    setIsGenerating(true)

    // Simulate API call or pass to parent
    if (onGenerate) {
      await onGenerate({
        file: uploadedFile,
        style: selectedStyle
      })
    }

    setTimeout(() => {
      setIsGenerating(false)
      onClose()
    }, 3000)
  }

  // Check if can proceed to next step
  const canProceed = () => {
    if (currentStep === 1) return uploadedFile !== null
    return true
  }

  // 3-step flow: Upload → Details → Generate
  const steps = [
    { num: 1, label: 'Upload & Style' },
    { num: 2, label: 'Your Details' },
    { num: 3, label: 'Generate' },
  ]

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: COLORS.overlay,
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.3s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Modal Container */}
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          backgroundColor: COLORS.card,
          borderRadius: '16px',
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          animation: 'scaleIn 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
        className="ai-lightbox-modal"
      >
        {/* Left Section - Visual */}
        <div
          style={{
            position: 'relative',
            backgroundColor: COLORS.dark,
            minHeight: '400px',
            display: window.innerWidth <= 768 ? 'none' : 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            overflow: 'hidden',
          }}
          className="ai-lightbox-visual"
        >
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(197, 156, 130, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(197, 156, 130, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            opacity: 0.5,
          }} />

          {/* Architectural Visual */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {/* Blueprint to 3D Transformation Visual */}
            <div style={{
              position: 'relative',
              width: '280px',
              height: '280px',
            }}>
              {/* Blueprint Layer */}
              <div style={{
                position: 'absolute',
                inset: 0,
                border: `2px solid ${COLORS.accent}`,
                borderRadius: '8px',
                opacity: 0.3,
                transform: 'perspective(500px) rotateX(15deg) rotateY(-15deg)',
              }}>
                {/* Blueprint Grid Lines */}
                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                  <defs>
                    <pattern id="blueprintGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke={COLORS.accent} strokeWidth="0.5" opacity="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#blueprintGrid)" />
                  {/* Floor plan lines */}
                  <rect x="20" y="20" width="100" height="80" fill="none" stroke={COLORS.accent} strokeWidth="1"/>
                  <rect x="130" y="20" width="120" height="120" fill="none" stroke={COLORS.accent} strokeWidth="1"/>
                  <rect x="20" y="110" width="100" height="100" fill="none" stroke={COLORS.accent} strokeWidth="1"/>
                  <rect x="130" y="150" width="120" height="60" fill="none" stroke={COLORS.accent} strokeWidth="1"/>
                </svg>
              </div>

              {/* 3D Render Layer */}
              <div style={{
                position: 'absolute',
                inset: '20px',
                background: `linear-gradient(135deg, ${COLORS.cardLight} 0%, ${COLORS.dark} 100%)`,
                borderRadius: '12px',
                border: `1px solid ${COLORS.borderAccent}`,
                boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 60px ${COLORS.accent}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'floatAnimation 4s ease-in-out infinite',
              }}>
                {/* Interior Preview Icon */}
                <div style={{
                  width: '80%',
                  height: '80%',
                  background: `linear-gradient(180deg, ${COLORS.accent}10 0%, transparent 100%)`,
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}>
                  <Sparkles size={48} color={COLORS.accent} strokeWidth={1.5} />
                  <span style={{
                    fontSize: '12px',
                    color: COLORS.accent,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}>AI Powered</span>
                </div>
              </div>

              {/* Floating UI Elements */}
              <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                backgroundColor: COLORS.card,
                border: `1px solid ${COLORS.borderAccent}`,
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                animation: 'floatAnimation 3s ease-in-out infinite 0.5s',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#4ADE80',
                }} />
                <span style={{ fontSize: '11px', color: COLORS.textMuted }}>Processing</span>
              </div>

              <div style={{
                position: 'absolute',
                bottom: '-10px',
                left: '-30px',
                backgroundColor: COLORS.card,
                border: `1px solid ${COLORS.borderAccent}`,
                borderRadius: '8px',
                padding: '10px 14px',
                animation: 'floatAnimation 3.5s ease-in-out infinite 1s',
              }}>
                <span style={{ fontSize: '10px', color: COLORS.textMuted, display: 'block' }}>Render Quality</span>
                <span style={{ fontSize: '14px', color: COLORS.accent, fontWeight: 600 }}>4K Ultra HD</span>
              </div>
            </div>

            {/* Bottom Text */}
            <p style={{
              marginTop: '40px',
              fontSize: '13px',
              color: COLORS.textMuted,
              textAlign: 'center',
              maxWidth: '260px',
              lineHeight: 1.6,
            }}>
              Transform your 2D floor plans into stunning 3D visualizations with our AI technology
            </p>
          </div>
        </div>

        {/* Right Section - Content */}
        <div style={{
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          backgroundColor: COLORS.card,
          overflowY: 'auto',
          maxHeight: '90vh',
        }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.borderColor = COLORS.accent
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = COLORS.border
            }}
          >
            <X size={18} color={COLORS.textMuted} />
          </button>

          {/* Header */}
          <div style={{ marginBottom: '24px', paddingRight: '40px' }}>
            <h2 style={{
              fontFamily: "'Oswald', sans-serif",
              fontSize: '28px',
              color: COLORS.white,
              marginBottom: '8px',
              lineHeight: 1.2,
            }}>
              Get Your <span style={{ color: COLORS.accent }}>3D Home Design</span> in Minutes
            </h2>
            <p style={{
              fontSize: '14px',
              color: COLORS.textMuted,
              lineHeight: 1.5,
            }}>
              Upload your floor plan and receive an AI-generated 3D design instantly.
            </p>
          </div>

          {/* Step Indicators */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '28px',
          }}>
            {steps.map((step, idx) => (
              <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: currentStep >= step.num ? COLORS.accent : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${currentStep >= step.num ? COLORS.accent : COLORS.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                  }}>
                    {currentStep > step.num ? (
                      <Check size={14} color={COLORS.dark} />
                    ) : (
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: currentStep >= step.num ? COLORS.dark : COLORS.textMuted,
                      }}>{step.num}</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '13px',
                    color: currentStep >= step.num ? COLORS.white : COLORS.textMuted,
                    fontWeight: currentStep === step.num ? 500 : 400,
                  }}>{step.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{
                    width: '40px',
                    height: '1px',
                    backgroundColor: currentStep > step.num ? COLORS.accent : COLORS.border,
                    margin: '0 8px',
                    transition: 'all 0.3s ease',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {/* Step 1: Upload + Style Selection */}
            {currentStep === 1 && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${isDragging ? COLORS.accent : uploadedFile ? COLORS.accent : COLORS.border}`,
                    borderRadius: '12px',
                    padding: uploadedFile ? '20px' : '32px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragging ? `${COLORS.accent}08` : uploadedFile ? `${COLORS.accent}05` : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.3s ease',
                    marginBottom: '20px',
                  }}
                >
                  {uploadedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Floor plan preview"
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            backgroundColor: COLORS.dark,
                          }}
                        />
                      ) : (
                        <FileImage size={40} color={COLORS.accent} />
                      )}
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <p style={{ color: COLORS.white, fontSize: '14px', fontWeight: 500 }}>
                          {uploadedFile.name}
                        </p>
                        <p style={{ color: COLORS.accent, fontSize: '12px', marginTop: '4px' }}>
                          <Check size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Ready to generate
                        </p>
                      </div>
                      <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>Change</span>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: `${COLORS.accent}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}>
                        <Upload size={24} color={COLORS.accent} />
                      </div>
                      <p style={{ color: COLORS.white, fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                        Upload your floor plan
                      </p>
                      <p style={{ color: COLORS.textMuted, fontSize: '12px' }}>
                        JPG, PNG, PDF (max 10MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  style={{ display: 'none' }}
                />

                {/* Style Selection - Compact Grid */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: COLORS.textMuted,
                    marginBottom: '12px',
                  }}>
                    <Palette size={16} color={COLORS.accent} />
                    Choose Design Style
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                  }}>
                    {STYLE_OPTIONS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: `1px solid ${selectedStyle === style.id ? COLORS.accent : COLORS.border}`,
                          backgroundColor: selectedStyle === style.id ? `${COLORS.accent}10` : 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: selectedStyle === style.id ? COLORS.accent : COLORS.textLight,
                          display: 'block',
                        }}>{style.label}</span>
                        <span style={{
                          fontSize: '11px',
                          color: COLORS.textMuted,
                        }}>{style.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Lead Capture Form */}
            {currentStep === 2 && (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  padding: '24px',
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: COLORS.textMuted,
                    marginBottom: '20px',
                    textAlign: 'center',
                  }}>
                    Enter your details to view your personalized 3D design
                  </p>

                  {/* Name */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      color: COLORS.textMuted,
                      marginBottom: '8px',
                    }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      placeholder="Enter your name"
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.dark,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: COLORS.white,
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Phone */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      color: COLORS.textMuted,
                      marginBottom: '8px',
                    }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.dark,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: COLORS.white,
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      color: COLORS.textMuted,
                      marginBottom: '8px',
                    }}>
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      placeholder="Enter your email"
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.dark,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: COLORS.white,
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {submitError && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#EF4444',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      fontSize: '13px',
                    }}>
                      {submitError}
                    </div>
                  )}

                  <button
                    onClick={handleLeadSubmit}
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      backgroundColor: isSubmitting ? 'rgba(197,156,130,0.5)' : COLORS.accent,
                      color: COLORS.dark,
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {isSubmitting ? 'Submitting...' : 'View My 3D Design'}
                    {!isSubmitting && <ArrowRight size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Generate */}
            {currentStep === 3 && (
              <div style={{ animation: 'fadeIn 0.3s ease-out', textAlign: 'center', padding: '20px 0' }}>
                {isGenerating ? (
                  <div>
                    {/* Loading Animation */}
                    <div style={{
                      width: '120px',
                      height: '120px',
                      margin: '0 auto 24px',
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: `2px solid ${COLORS.border}`,
                        borderRadius: '50%',
                      }} />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: `2px solid transparent`,
                        borderTopColor: COLORS.accent,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                      <div style={{
                        position: 'absolute',
                        inset: '20px',
                        backgroundColor: `${COLORS.accent}10`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Sparkles size={32} color={COLORS.accent} />
                      </div>
                    </div>
                    <h3 style={{
                      fontSize: '18px',
                      color: COLORS.white,
                      marginBottom: '8px',
                    }}>Generating Your 3D Design</h3>
                    <p style={{
                      fontSize: '14px',
                      color: COLORS.textMuted,
                    }}>Our AI is transforming your floor plan...</p>
                  </div>
                ) : (
                  <div>
                    {/* Summary */}
                    <div style={{
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderRadius: '12px',
                      padding: '24px',
                      marginBottom: '24px',
                      textAlign: 'left',
                    }}>
                      <h4 style={{
                        fontSize: '14px',
                        color: COLORS.textMuted,
                        marginBottom: '16px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}>Ready to Generate</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: COLORS.textMuted, fontSize: '14px' }}>Floor Plan</span>
                          <span style={{ color: COLORS.white, fontSize: '14px' }}>{uploadedFile?.name || '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: COLORS.textMuted, fontSize: '14px' }}>Design Style</span>
                          <span style={{ color: COLORS.accent, fontSize: '14px', textTransform: 'capitalize' }}>
                            {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label || 'Modern Minimal'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={handleGenerate}
                      style={{
                        width: '100%',
                        padding: '16px 32px',
                        backgroundColor: COLORS.accent,
                        color: COLORS.dark,
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = `0 8px 24px ${COLORS.accent}40`
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <Sparkles size={20} />
                      Generate 3D Design
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          {!isGenerating && !isSubmitting && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: `1px solid ${COLORS.border}`,
            }}>
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: 'transparent',
                    color: COLORS.textMuted,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = COLORS.accent
                    e.currentTarget.style.color = COLORS.white
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = COLORS.border
                    e.currentTarget.style.color = COLORS.textMuted
                  }}
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep === 1 && (
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!canProceed()}
                  style={{
                    padding: '14px 28px',
                    backgroundColor: canProceed() ? COLORS.accent : COLORS.border,
                    color: canProceed() ? COLORS.dark : COLORS.textMuted,
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: canProceed() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    opacity: canProceed() ? 1 : 0.5,
                  }}
                >
                  Continue
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          )}

          {/* Trust Badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '20px',
            flexWrap: 'wrap',
          }}>
            {[
              'No technical drawings required',
              'Free to try',
            ].map((text, i) => (
              <span
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: COLORS.textMuted,
                }}
              >
                <Check size={12} color={COLORS.accent} />
                {text}
              </span>
            ))}
          </div>

          {/* Disclaimer */}
          <p style={{
            fontSize: '10px',
            color: COLORS.textMuted,
            textAlign: 'center',
            marginTop: '12px',
            opacity: 0.7,
          }}>
            AI-generated designs are conceptual and refined by our expert designers
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes floatAnimation {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ai-lightbox-modal {
          overflow: hidden;
        }

        .ai-lightbox-modal > div:last-child {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .ai-lightbox-modal > div:last-child::-webkit-scrollbar {
          width: 6px;
        }

        .ai-lightbox-modal > div:last-child::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
        }

        .ai-lightbox-modal > div:last-child::-webkit-scrollbar-thumb {
          background: rgba(197, 156, 130, 0.3);
          border-radius: 3px;
        }

        @media (max-width: 768px) {
          .ai-lightbox-modal {
            grid-template-columns: 1fr !important;
            max-height: 95vh;
          }

          .ai-lightbox-visual {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default AIDesignLightbox
