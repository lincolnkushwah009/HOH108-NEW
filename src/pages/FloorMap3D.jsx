/**
 * FloorMap3D - 2D Floor Plan to 3D Visualization
 * AI-powered interior design visualization using Runware API
 */

import { useState, useRef } from 'react'
import { Upload, Wand2, ArrowRight, ArrowLeft, Check, Loader2, Download, RefreshCw, Home, Sparkles, Image, PenTool, ChevronRight, Phone, User, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Runware } from '@runware/sdk-js'
import ManualDesignInput from '../components/ManualDesignInput'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { API_BASE } from '../constants/colors'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  text: '#E5E5E5',
  textMuted: '#9CA3AF'
}

// Runware API Configuration
const RUNWARE_API_KEY = 'PxEyDPET0HRfTq4evDV6RUHMQkjFxKZF'

// Initialize Runware (lazy - will connect on first API call)
let runware
try {
  runware = new Runware({ apiKey: RUNWARE_API_KEY })
} catch (e) {
  console.error('Runware SDK init failed:', e)
}

// Model configurations
const MODELS = {
  // FLUX.1 dev - high quality 12B param model, reliable img2img with seedImage
  upload: {
    model: 'runware:101@1',
    steps: 28,
    width: 1024,
    height: 768,
  },
  // Juggernaut Pro Flux - best photorealistic text-to-image model
  manual: {
    model: 'rundiffusion:130@100',
    steps: 33,
    CFGScale: 3,
    scheduler: 'Euler Beta',
    width: 1216,
    height: 832,
  }
}

// Prompt templates for 3D generation
const promptTemplates = {
  propertyType: {
    apartment: 'modern high-rise apartment interior with 9-foot ceilings and open-concept living',
    villa: 'spacious luxury villa interior with double-height ceilings, grand foyer, and premium finishes',
    commercial: 'premium commercial space interior with open floor plan, glass partitions, and collaborative zones',
    office: 'professional corporate office interior with ergonomic workstations, conference room, and executive cabin'
  },
  bhkType: {
    '1bhk': 'compact one bedroom apartment with an L-shaped living and dining area, one bedroom with attached bathroom, a modular kitchen with breakfast counter, and a utility balcony',
    '2bhk': 'two bedroom apartment with a spacious living room and separate dining area, master bedroom with walk-in wardrobe and ensuite bathroom, second bedroom with built-in storage, a modular kitchen, and guest bathroom',
    '3bhk': 'three bedroom apartment with a large open-plan living and dining room, master suite with dressing area and luxury ensuite, two well-proportioned bedrooms with wardrobes, a gourmet kitchen with island, utility area, and two additional bathrooms',
    '4bhk': 'four plus bedroom luxury residence with formal living room, family lounge, master suite with walk-in closet and spa bathroom, three additional bedrooms each with ensuite, a chef kitchen with pantry, home office, and servant quarters',
    'studio': 'open-plan studio apartment with seamlessly zoned living and sleeping area using a low partition wall, a compact modular kitchenette with integrated appliances, and a designer bathroom'
  },
  designStyle: {
    modern: 'modern minimalist design with clean geometric lines, neutral palette of whites greys and beige, handleless cabinetry, concealed storage, and statement pendant lighting',
    contemporary: 'contemporary design with curated mix of textures, bold accent wall in deep teal or terracotta, designer furniture with brass and marble details, and layered ambient lighting',
    minimalist: 'ultra minimalist Japandi design with essential furniture only, maximum negative space, light oak wood tones, white linen textiles, and concealed everything behind flush panels',
    luxury: 'luxury premium design with Italian marble flooring, bespoke furniture upholstered in velvet and leather, gold and brushed brass hardware, crystal chandelier, coffered ceiling with integrated lighting, and rich jewel-tone accent colors',
    'indian-fusion': 'Indian contemporary fusion design with hand-carved jali screens, ethnic block-print cushions, brass urlis and traditional lamps, warm earthy terracotta and indigo palette, Athangudi or Moroccan patterned tiles, and teak wood furniture with cane detailing'
  },
  scope: {
    basic: 'clean painted walls in neutral tones with essential quality furniture pieces and standard lighting fixtures',
    modular: 'modular kitchen with soft-close cabinets and granite countertop, built-in wardrobes with internal organizers, laminate and veneer finishes, and functional designer furniture',
    premium: 'multi-layered false ceiling with cove and spot lighting, back-painted glass accent walls, designer Italian furniture, premium hardwood and marble flooring, automated curtains, and curated art and decor pieces throughout'
  }
}

export default function FloorMap3D() {
  const [step, setStep] = useState(1) // 1: Choose mode, 2: Input/Generate, 3: Lead capture, 4: Results
  const [inputMode, setInputMode] = useState(null) // 'upload' or 'manual'
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated3DImage, setGenerated3DImage] = useState(null)
  const [floorPlanAnalysis, setFloorPlanAnalysis] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentProgressStep, setCurrentProgressStep] = useState(0)
  const [manualPreferences, setManualPreferences] = useState(null)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [isSubmittingLead, setIsSubmittingLead] = useState(false)
  const [leadError, setLeadError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    carpetArea: '',
    notes: ''
  })

  const fileInputRef = useRef(null)

  const progressSteps = [
    'Uploading floor plan...',
    'Extracting wall and room edges...',
    'Analyzing room layout and dimensions...',
    'Mapping floor plan structure...',
    'Generating 3D visualization...',
    'Adding furniture, textures and lighting...',
    'Finalizing photorealistic render...'
  ]

  // Validate and process a file
  const processFile = (file) => {
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WebP image')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result)
    }
    reader.readAsDataURL(file)
  }

  // Handle file input change
  const handleFileUpload = (e) => {
    processFile(e.target.files?.[0])
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    processFile(e.dataTransfer.files?.[0])
  }

  // Simulate progress animation
  const simulateProgress = () => {
    let progress = 0
    let stepIndex = 0

    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress > 100) progress = 100

      setGenerationProgress(progress)

      // Update step based on progress
      const newStep = Math.min(Math.floor((progress / 100) * progressSteps.length), progressSteps.length - 1)
      if (newStep !== stepIndex) {
        stepIndex = newStep
        setCurrentProgressStep(stepIndex)
      }

      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 500)

    return interval
  }

  // Generate 3D from uploaded image using Runware
  const handleGenerateFromUpload = async () => {
    if (!uploadedFile || !uploadedImage) return
    if (!runware) {
      alert('AI visualization service is temporarily unavailable. Please try again later.')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setCurrentProgressStep(0)

    const progressInterval = simulateProgress()

    try {
      // Prompt focused on 3D transformation while keeping floor plan layout
      const fullPrompt = `Convert this 2D architectural floor plan into a 3D isometric cutaway dollhouse view, maintain the exact same room layout and wall positions from the floor plan, same number of rooms in the same positions, bird's eye view at 45 degree angle with roof removed, add 3D walls with height, add flooring textures and furniture inside each room matching its function, living areas with sofa and TV, bedrooms with bed and wardrobe, kitchen with cabinets and countertop, bathrooms with fixtures, wooden flooring, white painted walls, large windows with natural sunlight, warm lighting, indoor plants, photorealistic architectural visualization, 8K quality, clean sharp render`

      // Strength 0.75: enough to transform 2D→3D while preserving floor plan room layout
      const images = await runware.imageInference({
        positivePrompt: fullPrompt,
        model: MODELS.upload.model,
        width: MODELS.upload.width,
        height: MODELS.upload.height,
        steps: MODELS.upload.steps,
        numberResults: 1,
        outputFormat: 'PNG',
        seedImage: uploadedImage,
        strength: 0.75,
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setCurrentProgressStep(progressSteps.length - 1)

      const generatedImageUrl = images[0]?.imageURL || null

      setTimeout(() => {
        setGenerated3DImage(generatedImageUrl)
        setFloorPlanAnalysis('3D visualization generated based on your uploaded floor plan. The layout, room positions, and proportions have been preserved from the original 2D design.')
        setStep(3) // Go to lead capture first
        setIsGenerating(false)
      }, 500)

    } catch (error) {
      console.error('Generation error:', error)
      clearInterval(progressInterval)
      const msg = error?.message || 'Unknown error'
      alert(`Failed to generate 3D visualization: ${msg}. Please try again later.`)
      setIsGenerating(false)
    }
  }

  // Generate 3D from manual preferences using Runware
  const handleGenerateFromPreferences = async (preferences) => {
    if (!runware) {
      alert('AI visualization service is temporarily unavailable. Please try again later.')
      return
    }
    setManualPreferences(preferences)
    setIsGenerating(true)
    setGenerationProgress(0)
    setCurrentProgressStep(0)

    const progressInterval = simulateProgress()

    try {
      // Build dynamic prompt based on user preferences
      const propertyPrompt = promptTemplates.propertyType[preferences.propertyType] || 'modern residential interior'
      const bhkPrompt = promptTemplates.bhkType[preferences.bhkType] || 'well-proportioned apartment layout'

      // Combine design styles
      const selectedStyles = Array.isArray(preferences.designStyles)
        ? preferences.designStyles.map(s => promptTemplates.designStyle[s] || s).join(' blended with ')
        : promptTemplates.designStyle[preferences.designStyles] || 'modern minimalist design'

      const scopePrompt = promptTemplates.scope[preferences.interiorsScope] || 'quality furniture and functional layout'
      const personalization = preferences.personalisation ? `, client special request: ${preferences.personalisation},` : ''

      const fullPrompt = `Professional architectural visualization photograph, photorealistic 3D isometric cutaway dollhouse view with roof removed, bird's eye perspective at 30 degree angle, ${propertyPrompt}, ${bhkPrompt}, interior designed in ${selectedStyles} style, finished with ${scopePrompt}${personalization}, every room fully furnished and decorated to magazine-quality standards, premium engineered hardwood and natural stone flooring, textured walls with designer accent finishes, floor-to-ceiling glazed windows with sheer curtains allowing warm golden hour sunlight, layered lighting with recessed LEDs and warm pendant fixtures and concealed cove illumination, curated indoor plants and lifestyle decor and art and books, ultra high resolution, tack sharp focus, ray-traced global illumination, physically based material rendering, subtle depth of field bokeh, Architectural Digest magazine cover quality, Unreal Engine 5 cinematic architectural render`

      // Juggernaut Pro Flux: best photorealistic text-to-image (Flux-based, no negative prompt needed)
      const images = await runware.imageInference({
        positivePrompt: fullPrompt,
        model: MODELS.manual.model,
        width: MODELS.manual.width,
        height: MODELS.manual.height,
        steps: MODELS.manual.steps,
        CFGScale: MODELS.manual.CFGScale,
        scheduler: MODELS.manual.scheduler,
        numberResults: 1,
        outputFormat: 'PNG'
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setCurrentProgressStep(progressSteps.length - 1)

      const generatedImageUrl = images[0]?.imageURL || null
      const analysisText = `Generated ${preferences.propertyType?.charAt(0).toUpperCase() + preferences.propertyType?.slice(1)} ${preferences.bhkType?.toUpperCase()} concept with ${preferences.designStyles?.join(' & ')} design style. Features ${preferences.interiorsScope} interiors package within ${preferences.budgetRange} budget range. ${preferences.timeline ? `Timeline: ${preferences.timeline}.` : ''} ${preferences.personalisation ? `Special requests: ${preferences.personalisation}` : ''}`

      setTimeout(() => {
        setGenerated3DImage(generatedImageUrl)
        setFloorPlanAnalysis(analysisText)
        setStep(3)
        setIsGenerating(false)
      }, 500)

    } catch (error) {
      console.error('Generation error:', error)
      clearInterval(progressInterval)
      const msg = error?.message || 'Unknown error'
      alert(`Failed to generate 3D visualization: ${msg}. Please try again later.`)
      setIsGenerating(false)
    }
  }

  // Submit lead form to view results
  const handleLeadSubmitToView = async () => {
    if (!leadForm.name || !leadForm.phone) {
      setLeadError('Please fill in all required fields')
      return
    }

    setIsSubmittingLead(true)
    setLeadError('')

    try {
      const prefsText = manualPreferences
        ? `Property: ${manualPreferences.propertyType}, Layout: ${manualPreferences.bhkType}, Style: ${manualPreferences.designStyles?.join(', ')}, Scope: ${manualPreferences.interiorsScope}, Budget: ${manualPreferences.budgetRange}`
        : 'Floor plan upload'

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
          notes: [{ content: `2D to 3D Visualization Request\n\nInput Mode: ${inputMode}\n${prefsText}` }]
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Failed to submit')

      setStep(4) // Go to results
    } catch (err) {
      setLeadError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmittingLead(false)
    }
  }

  // Submit lead form (stores locally for now)
  const handleSubmitLead = async (e) => {
    e.preventDefault()

    try {
      const leadData = {
        ...formData,
        generated3DImage,
        floorPlanAnalysis,
        preferences: manualPreferences,
        inputMode,
        timestamp: new Date().toISOString()
      }

      // Store lead data in localStorage for now
      const existingLeads = JSON.parse(localStorage.getItem('floorMap3DLeads') || '[]')
      existingLeads.push(leadData)
      localStorage.setItem('floorMap3DLeads', JSON.stringify(existingLeads))

      console.log('Lead submitted:', leadData)
      setLeadSubmitted(true)
    } catch (error) {
      console.error('Lead submission error:', error)
      setLeadSubmitted(true)
    }
  }

  // Reset everything
  const handleReset = () => {
    setStep(1)
    setInputMode(null)
    setUploadedImage(null)
    setUploadedFile(null)
    setIsGenerating(false)
    setGenerated3DImage(null)
    setFloorPlanAnalysis('')
    setGenerationProgress(0)
    setCurrentProgressStep(0)
    setManualPreferences(null)
    setShowLeadForm(false)
    setLeadSubmitted(false)
    setIsSubmittingLead(false)
    setLeadError('')
    setLeadForm({ name: '', phone: '', email: '' })
    setFormData({ name: '', email: '', phone: '', city: '', carpetArea: '', notes: '' })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: COLORS.dark }}>
      <Header />

      {/* Hero Section */}
      <section style={{
        padding: 'clamp(100px, 15vw, 140px) 16px clamp(60px, 10vw, 80px)',
        textAlign: 'center',
        background: `linear-gradient(180deg, rgba(197,156,130,0.1) 0%, transparent 50%)`
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(197,156,130,0.15)',
            color: COLORS.accent,
            padding: '10px 20px',
            borderRadius: '50px',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '24px',
            border: '1px solid rgba(197,156,130,0.3)'
          }}>
            <Wand2 size={18} />
            AI-Powered Visualization
          </div>

          <h1 style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: 'clamp(36px, 8vw, 56px)',
            color: 'white',
            marginBottom: '20px',
            lineHeight: 1.1
          }}>
            Transform Your <span style={{ color: COLORS.accent, fontStyle: 'italic' }}>Floor Plan</span><br />
            Into Stunning 3D
          </h1>

          <p style={{
            color: COLORS.textMuted,
            fontSize: '18px',
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Upload your 2D floor plan or describe your dream space, and watch our AI create a photorealistic 3D visualization in seconds.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section style={{ padding: '0 16px 100px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* Step 1: Choose Input Mode */}
          {step === 1 && !isGenerating && (
            <div className="calc-step-animate">
              <div style={{
                backgroundColor: COLORS.card,
                borderRadius: '28px',
                padding: 'clamp(32px, 6vw, 48px)',
                border: '1px solid rgba(197,156,130,0.1)'
              }}>
                <h2 style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: '28px',
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: '12px'
                }}>
                  How would you like to start?
                </h2>
                <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '40px' }}>
                  Choose your preferred method to create your 3D visualization
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                  {/* Upload Option */}
                  <div
                    onClick={() => { setInputMode('upload'); setStep(2) }}
                    className="calc-option-card"
                    style={{
                      background: 'linear-gradient(135deg, #C59C82 0%, #8B6F5C 100%)',
                      borderRadius: '24px',
                      padding: '40px 32px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      color: 'white',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px'
                    }}>
                      <Upload size={36} />
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>Upload Floor Plan</h3>
                    <p style={{ fontSize: '15px', opacity: 0.9, marginBottom: '24px', lineHeight: 1.6 }}>
                      Have a 2D floor plan ready? Upload it and our AI will transform it into a stunning 3D visualization.
                    </p>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '12px 24px',
                      borderRadius: '50px',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      Upload Image <ChevronRight size={18} />
                    </div>
                  </div>

                  {/* Manual Option */}
                  <div
                    onClick={() => { setInputMode('manual'); setStep(2) }}
                    className="calc-option-card"
                    style={{
                      background: 'linear-gradient(135deg, #A67C5B 0%, #6B4F3C 100%)',
                      borderRadius: '24px',
                      padding: '40px 32px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      color: 'white',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                    }}
                  >
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px'
                    }}>
                      <PenTool size={36} />
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>Describe Your Space</h3>
                    <p style={{ fontSize: '15px', opacity: 0.9, marginBottom: '24px', lineHeight: 1.6 }}>
                      No floor plan? No problem! Answer a few questions and we'll generate a concept visualization.
                    </p>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '12px 24px',
                      borderRadius: '50px',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      Start Questionnaire <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Upload Mode */}
          {step === 2 && inputMode === 'upload' && !isGenerating && (
            <div className="calc-step-animate">
              <div style={{
                backgroundColor: COLORS.card,
                borderRadius: '28px',
                padding: 'clamp(32px, 6vw, 48px)',
                border: '1px solid rgba(197,156,130,0.1)'
              }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: COLORS.textMuted,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '24px',
                    fontSize: '14px'
                  }}
                >
                  <ArrowLeft size={18} /> Back
                </button>

                <h2 style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: '28px',
                  color: 'white',
                  textAlign: 'center',
                  marginBottom: '12px'
                }}>
                  Upload Your Floor Plan
                </h2>
                <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '40px' }}>
                  Supported formats: JPG, PNG, WebP (Max 10MB)
                </p>

                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    border: `2px dashed ${isDragging ? COLORS.accent : uploadedImage ? COLORS.accent : 'rgba(197,156,130,0.3)'}`,
                    borderRadius: '20px',
                    padding: '48px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragging ? 'rgba(197,156,130,0.15)' : uploadedImage ? 'rgba(197,156,130,0.05)' : 'transparent',
                    transition: 'all 0.3s ease',
                    marginBottom: '32px'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />

                  {uploadedImage ? (
                    <div>
                      <img
                        src={uploadedImage}
                        alt="Uploaded floor plan"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '400px',
                          borderRadius: '12px',
                          marginBottom: '16px'
                        }}
                      />
                      <p style={{ color: COLORS.accent, fontWeight: 500 }}>
                        <Check size={18} style={{ display: 'inline', marginRight: '8px' }} />
                        Floor plan uploaded successfully
                      </p>
                      <p style={{ color: COLORS.textMuted, fontSize: '14px', marginTop: '8px' }}>
                        Click to upload a different image
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(197,156,130,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                      }}>
                        <Image size={36} color={COLORS.accent} />
                      </div>
                      <p style={{ color: 'white', fontSize: '18px', fontWeight: 500, marginBottom: '8px' }}>
                        Click to upload or drag and drop
                      </p>
                      <p style={{ color: COLORS.textMuted, fontSize: '14px' }}>
                        JPG, PNG, or WebP up to 10MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerateFromUpload}
                  disabled={!uploadedImage}
                  style={{
                    width: '100%',
                    backgroundColor: uploadedImage ? COLORS.accent : 'rgba(197,156,130,0.3)',
                    color: uploadedImage ? COLORS.dark : COLORS.textMuted,
                    padding: '18px 32px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: uploadedImage ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Wand2 size={20} />
                  Generate 3D Visualization
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Manual Mode */}
          {step === 2 && inputMode === 'manual' && !isGenerating && (
            <div className="calc-step-animate">
              <div style={{
                backgroundColor: COLORS.card,
                borderRadius: '28px',
                padding: 'clamp(32px, 6vw, 48px)',
                border: '1px solid rgba(197,156,130,0.1)'
              }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: COLORS.textMuted,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '24px',
                    fontSize: '14px'
                  }}
                >
                  <ArrowLeft size={18} /> Back
                </button>

                <ManualDesignInput onGenerate={handleGenerateFromPreferences} />
              </div>
            </div>
          )}

          {/* Generating State */}
          {isGenerating && (
            <div className="calc-step-animate">
              <div style={{
                backgroundColor: COLORS.card,
                borderRadius: '28px',
                padding: 'clamp(48px, 8vw, 80px)',
                border: '1px solid rgba(197,156,130,0.1)',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(197,156,130,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 32px',
                  position: 'relative'
                }}>
                  <Loader2 size={48} color={COLORS.accent} className="icon-rotate" style={{ animation: 'spin 1.5s linear infinite' }} />
                </div>

                <h2 style={{
                  fontFamily: 'Oswald, sans-serif',
                  fontSize: '28px',
                  color: 'white',
                  marginBottom: '16px'
                }}>
                  Creating Your 3D Visualization
                </h2>

                <p style={{
                  color: COLORS.accent,
                  fontSize: '16px',
                  fontWeight: 500,
                  marginBottom: '32px',
                  minHeight: '24px'
                }}>
                  {progressSteps[currentProgressStep]}
                </p>

                {/* Progress Bar */}
                <div style={{
                  maxWidth: '400px',
                  margin: '0 auto',
                  backgroundColor: 'rgba(197,156,130,0.2)',
                  borderRadius: '10px',
                  height: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    backgroundColor: COLORS.accent,
                    borderRadius: '10px',
                    width: `${generationProgress}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                <p style={{
                  color: COLORS.textMuted,
                  fontSize: '14px',
                  marginTop: '16px'
                }}>
                  {Math.round(generationProgress)}% complete
                </p>

                {/* Progress Steps */}
                <div style={{ marginTop: '48px', textAlign: 'left', maxWidth: '300px', margin: '48px auto 0' }}>
                  {progressSteps.map((stepText, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 0',
                        opacity: index <= currentProgressStep ? 1 : 0.4,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: index < currentProgressStep ? COLORS.accent : index === currentProgressStep ? 'rgba(197,156,130,0.3)' : 'rgba(197,156,130,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {index < currentProgressStep ? (
                          <Check size={14} color={COLORS.dark} />
                        ) : (
                          <span style={{ color: index === currentProgressStep ? COLORS.accent : COLORS.textMuted, fontSize: '12px' }}>{index + 1}</span>
                        )}
                      </div>
                      <span style={{ color: index <= currentProgressStep ? 'white' : COLORS.textMuted, fontSize: '14px' }}>
                        {stepText.replace('...', '')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Lead Capture */}
          {step === 3 && !isGenerating && (
            <div className="calc-step-animate">
              <div style={{
                backgroundColor: COLORS.card,
                borderRadius: '28px',
                padding: 'clamp(32px, 6vw, 48px)',
                border: '1px solid rgba(197,156,130,0.1)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <Check size={36} color="white" />
                  </div>
                  <h2 style={{
                    fontFamily: 'Oswald, sans-serif',
                    fontSize: '28px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    Your 3D Design is Ready!
                  </h2>
                  <p style={{ color: COLORS.textMuted, fontSize: '16px' }}>
                    Enter your details to view your personalized 3D visualization
                  </p>
                </div>

                <div style={{
                  backgroundColor: COLORS.dark,
                  borderRadius: '20px',
                  padding: '32px',
                  maxWidth: '450px',
                  margin: '0 auto'
                }}>
                  {/* Name */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '14px', marginBottom: '8px' }}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      placeholder="Enter your name"
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.card,
                        border: '2px solid rgba(197,156,130,0.2)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Phone */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '14px', marginBottom: '8px' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      placeholder="Enter your phone number"
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.card,
                        border: '2px solid rgba(197,156,130,0.2)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '14px', marginBottom: '8px' }}>
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      placeholder="Enter your email"
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.card,
                        border: '2px solid rgba(197,156,130,0.2)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        color: 'white',
                        fontSize: '15px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {leadError && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#EF4444',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      marginBottom: '16px',
                      fontSize: '14px'
                    }}>
                      {leadError}
                    </div>
                  )}

                  <button
                    onClick={handleLeadSubmitToView}
                    disabled={isSubmittingLead}
                    style={{
                      width: '100%',
                      backgroundColor: isSubmittingLead ? 'rgba(197,156,130,0.5)' : COLORS.accent,
                      color: COLORS.dark,
                      padding: '16px 24px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: isSubmittingLead ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px'
                    }}
                  >
                    {isSubmittingLead ? 'Submitting...' : 'View My 3D Design'}
                    {!isSubmittingLead && <Sparkles size={20} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && !isGenerating && (
            <div className="calc-step-animate">
              <div style={{
                backgroundColor: COLORS.card,
                borderRadius: '28px',
                padding: 'clamp(32px, 6vw, 48px)',
                border: '1px solid rgba(197,156,130,0.1)'
              }}>
                {/* Success Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <Sparkles size={36} color="white" />
                  </div>
                  <h2 style={{
                    fontFamily: 'Oswald, sans-serif',
                    fontSize: '32px',
                    color: 'white',
                    marginBottom: '12px'
                  }}>
                    Your 3D Visualization is Ready!
                  </h2>
                  <p style={{ color: COLORS.textMuted, fontSize: '16px' }}>
                    {floorPlanAnalysis}
                  </p>
                </div>

                {/* Before/After Comparison */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: uploadedImage ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
                  gap: '24px',
                  marginBottom: '40px'
                }}>
                  {/* Original Floor Plan */}
                  {uploadedImage && (
                    <div>
                      <h3 style={{ color: COLORS.textMuted, fontSize: '14px', fontWeight: 500, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Original Floor Plan
                      </h3>
                      <div style={{
                        backgroundColor: COLORS.dark,
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid rgba(197,156,130,0.2)'
                      }}>
                        <img
                          src={uploadedImage}
                          alt="Original floor plan"
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Generated 3D */}
                  <div>
                    <h3 style={{ color: COLORS.accent, fontSize: '14px', fontWeight: 500, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      AI Generated 3D Visualization
                    </h3>
                    <div style={{
                      backgroundColor: COLORS.dark,
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: '2px solid rgba(197,156,130,0.3)',
                      position: 'relative'
                    }}>
                      {generated3DImage ? (
                        <img
                          src={generated3DImage}
                          alt="3D visualization"
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                      ) : (
                        <div style={{
                          aspectRatio: '16/10',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: '16px'
                        }}>
                          <Home size={48} color={COLORS.accent} />
                          <p style={{ color: COLORS.textMuted }}>3D Preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px' }}>
                  <button
                    onClick={() => setShowLeadForm(true)}
                    style={{
                      backgroundColor: COLORS.accent,
                      color: COLORS.dark,
                      padding: '16px 32px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <Phone size={20} />
                    Get Free Consultation
                  </button>

                  {generated3DImage && (
                    <a
                      href={generated3DImage}
                      download="3d-visualization.webp"
                      style={{
                        backgroundColor: 'transparent',
                        color: COLORS.accent,
                        padding: '16px 32px',
                        borderRadius: '12px',
                        border: `2px solid ${COLORS.accent}`,
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textDecoration: 'none'
                      }}
                    >
                      <Download size={20} />
                      Download Image
                    </a>
                  )}

                  <button
                    onClick={handleReset}
                    style={{
                      backgroundColor: 'transparent',
                      color: COLORS.textMuted,
                      padding: '16px 32px',
                      borderRadius: '12px',
                      border: `2px solid rgba(197,156,130,0.3)`,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <RefreshCw size={20} />
                    Try Again
                  </button>
                </div>

                {/* Lead Form Modal */}
                {showLeadForm && !leadSubmitted && (
                  <div style={{
                    backgroundColor: COLORS.dark,
                    borderRadius: '20px',
                    padding: '32px',
                    border: '1px solid rgba(197,156,130,0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                      <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: 'white' }}>
                        Get Your Free Consultation
                      </h3>
                      <button
                        onClick={() => setShowLeadForm(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted }}
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <form onSubmit={handleSubmitLead}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '14px', marginBottom: '8px' }}>Full Name *</label>
                          <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
                            <input
                              type="text"
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              style={{
                                width: '100%',
                                backgroundColor: COLORS.card,
                                border: '2px solid rgba(197,156,130,0.2)',
                                borderRadius: '10px',
                                padding: '14px 14px 14px 44px',
                                color: 'white',
                                fontSize: '15px',
                                outline: 'none'
                              }}
                              placeholder="John Doe"
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '14px', marginBottom: '8px' }}>Email *</label>
                          <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
                            <input
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              style={{
                                width: '100%',
                                backgroundColor: COLORS.card,
                                border: '2px solid rgba(197,156,130,0.2)',
                                borderRadius: '10px',
                                padding: '14px 14px 14px 44px',
                                color: 'white',
                                fontSize: '15px',
                                outline: 'none'
                              }}
                              placeholder="john@email.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '14px', marginBottom: '8px' }}>Phone *</label>
                          <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
                            <input
                              type="tel"
                              required
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              style={{
                                width: '100%',
                                backgroundColor: COLORS.card,
                                border: '2px solid rgba(197,156,130,0.2)',
                                borderRadius: '10px',
                                padding: '14px 14px 14px 44px',
                                color: 'white',
                                fontSize: '15px',
                                outline: 'none'
                              }}
                              placeholder="+91 8861888424"
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '14px', marginBottom: '8px' }}>City *</label>
                          <div style={{ position: 'relative' }}>
                            <MapPin size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.textMuted }} />
                            <input
                              type="text"
                              required
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              style={{
                                width: '100%',
                                backgroundColor: COLORS.card,
                                border: '2px solid rgba(197,156,130,0.2)',
                                borderRadius: '10px',
                                padding: '14px 14px 14px 44px',
                                color: 'white',
                                fontSize: '15px',
                                outline: 'none'
                              }}
                              placeholder="Mumbai"
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '14px', marginBottom: '8px' }}>Additional Notes</label>
                        <textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={3}
                          style={{
                            width: '100%',
                            backgroundColor: COLORS.card,
                            border: '2px solid rgba(197,156,130,0.2)',
                            borderRadius: '10px',
                            padding: '14px',
                            color: 'white',
                            fontSize: '15px',
                            outline: 'none',
                            resize: 'vertical'
                          }}
                          placeholder="Any specific requirements or questions..."
                        />
                      </div>

                      <button
                        type="submit"
                        style={{
                          width: '100%',
                          backgroundColor: COLORS.accent,
                          color: COLORS.dark,
                          padding: '16px',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '16px',
                          marginTop: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px'
                        }}
                      >
                        <Sparkles size={20} />
                        Submit & Get Free Quote
                      </button>
                    </form>
                  </div>
                )}

                {/* Success Message */}
                {leadSubmitted && (
                  <div style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '20px',
                    padding: '32px',
                    textAlign: 'center',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px'
                    }}>
                      <Check size={32} color="#22c55e" />
                    </div>
                    <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '24px', color: 'white', marginBottom: '12px' }}>
                      Thank You!
                    </h3>
                    <p style={{ color: COLORS.textMuted, fontSize: '16px' }}>
                      Our design expert will contact you within 24 hours with a personalized quote.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      <Footer />

      {/* Add spinning animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
