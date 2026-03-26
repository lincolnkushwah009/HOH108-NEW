/**
 * Cost Calculator Component - Redesigned
 * Modern, luxury aesthetic matching HOH108 brand
 */

import { useState, useEffect } from 'react'
import { Calculator, Sofa, Building2, Home, ArrowRight, ArrowLeft, Check, ChevronRight, Sparkles, LayoutGrid, Bed, CookingPot, Armchair, UtensilsCrossed, DoorOpen, Flower2, Ruler, Package, Crown, Gem, HardHat, Warehouse } from 'lucide-react'
import { CelebrationEffect } from './Confetti'

const COLORS = {
  dark: '#111111',
  card: '#FFFFFF',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  text: '#0F172A',
  textMuted: '#64748B',
  bg: '#FAF5F2',
  border: 'rgba(15,23,42,0.08)',
}

// 3D-style icon component with gradient background + shadow
function Icon3D({ icon: Icon, size = 48, color = '#fff', bg = 'linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)', shadow = 'rgba(197,156,130,0.4)' }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: size * 0.3,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 ${size * 0.15}px ${size * 0.4}px ${shadow}`,
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Glossy highlight */}
      <div style={{
        position: 'absolute',
        top: '2px',
        left: '15%',
        right: '15%',
        height: '40%',
        borderRadius: '50%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none',
      }} />
      <Icon size={size * 0.48} color={color} strokeWidth={1.8} />
    </div>
  )
}

// ============================================
// INTERIOR CALCULATOR
// ============================================
const INTERIOR_API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

function InteriorCalculator() {
  const [step, setStep] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [data, setData] = useState({
    bhk: '',
    size: '',
    category: '',
    workType: 'full',
    selectedSpaces: [],
    customCarpetArea: ''
  })
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: ''
  })

  // Trigger confetti when reaching results
  useEffect(() => {
    if (step === 7) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [step])

  const pricingCategories = {
    affordable: 1190,
    premium: 1400,
    luxury: 1645,
    superLuxury: 2100
  }

  const sizeMapping = {
    '1BHK': { small: 550, large: 700 },
    '2BHK': { small: 850, large: 1100 },
    '3BHK': { small: 1300, large: 1600 },
    '4BHK': { small: 1800, large: 2300 },
    '5BHK+': { small: 2400, large: 3000 }
  }

  const spaceAllocation = {
    bedroom: 20, kitchen: 12, livingRoom: 20, dining: 10, foyer: 5, puja: 5, furniture: 7
  }

  const roomLimits = {
    '1BHK': { bedroom: 1, kitchen: 1, livingRoom: 1, dining: 1 },
    '2BHK': { bedroom: 2, kitchen: 1, livingRoom: 1, dining: 1 },
    '3BHK': { bedroom: 3, kitchen: 1, livingRoom: 1, dining: 1 },
    '4BHK': { bedroom: 4, kitchen: 2, livingRoom: 2, dining: 2 },
    '5BHK+': { bedroom: 6, kitchen: 2, livingRoom: 2, dining: 2 }
  }

  const spaces = [
    { id: 'bedroom', label: 'Bedroom', icon: Bed, percentage: 20, hasLimit: true },
    { id: 'kitchen', label: 'Kitchen', icon: CookingPot, percentage: 12, hasLimit: true },
    { id: 'livingRoom', label: 'Living Room', icon: Sofa, percentage: 20, hasLimit: true },
    { id: 'dining', label: 'Dining', icon: UtensilsCrossed, percentage: 10, hasLimit: true },
    { id: 'foyer', label: 'Foyer', icon: DoorOpen, percentage: 5, hasLimit: false },
    { id: 'puja', label: 'Puja Room', icon: Flower2, percentage: 5, hasLimit: false },
    { id: 'furniture', label: 'Furniture', icon: Armchair, percentage: 7, hasLimit: false }
  ]

  const getSpaceCount = (spaceId) => data.selectedSpaces.filter(s => s === spaceId).length

  const handleSpaceToggle = (spaceId) => {
    const isSelected = data.selectedSpaces.includes(spaceId)
    if (isSelected) {
      const index = data.selectedSpaces.indexOf(spaceId)
      const newSpaces = [...data.selectedSpaces]
      newSpaces.splice(index, 1)
      setData({ ...data, selectedSpaces: newSpaces })
    } else {
      const limits = roomLimits[data.bhk]
      const currentCount = getSpaceCount(spaceId)
      const limit = limits?.[spaceId]
      if (!limit || currentCount < limit) {
        setData({ ...data, selectedSpaces: [...data.selectedSpaces, spaceId] })
      }
    }
  }

  const calculateCost = () => {
    if (!data.bhk || !data.size || !data.category) return null

    let totalSqFt
    if (data.size === 'custom' && data.customCarpetArea) {
      totalSqFt = parseInt(data.customCarpetArea)
    } else if (sizeMapping[data.bhk]?.[data.size]) {
      totalSqFt = sizeMapping[data.bhk][data.size]
    } else {
      return null
    }

    if (data.workType === 'specific' && data.selectedSpaces.length > 0) {
      totalSqFt = data.selectedSpaces.reduce((acc, space) => acc + (totalSqFt * (spaceAllocation[space] / 100)), 0)
    }

    const categoryRate = pricingCategories[data.category]
    const totalCost = totalSqFt * categoryRate

    return {
      totalCost: Math.round(totalCost),
      minCost: Math.round(totalCost * 0.9),
      maxCost: Math.round(totalCost * 1.1),
      totalSqFt: Math.round(totalSqFt)
    }
  }

  const cost = calculateCost()
  const totalSteps = data.workType === 'specific' ? 6 : 5

  const stepTitles = {
    1: 'Work Type',
    2: 'Home Type',
    3: 'Home Size',
    4: data.workType === 'specific' ? 'Select Rooms' : 'Design Package',
    5: data.workType === 'specific' ? 'Design Package' : 'Your Details',
    6: 'Your Details'
  }

  const handleLeadSubmit = async () => {
    if (!leadForm.name || !leadForm.phone) {
      setSubmitError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const estimatedCost = cost ? `₹${cost.totalCost.toLocaleString('en-IN')}` : 'N/A'
      const response = await fetch(`${INTERIOR_API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone,
          source: 'website',
          service: 'interior',
          websiteSource: 'HOH108',
          notes: [{ content: `Interior Calculator Lead\n\nWork Type: ${data.workType === 'full' ? 'Full Home' : 'Specific Rooms'}\nHome Type: ${data.bhk}\nArea: ${cost?.totalSqFt || 'N/A'} sq.ft\nCategory: ${data.category}\n${data.workType === 'specific' ? `Selected Rooms: ${data.selectedSpaces.join(', ')}\n` : ''}Estimated Cost: ${estimatedCost}` }]
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Failed to submit')

      setStep(7)
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Confetti Effect */}
      <CelebrationEffect isActive={showConfetti} duration={4000} />

      {/* Step Indicator */}
      {step < 7 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: COLORS.textMuted }}>Step {step} of {totalSteps}</span>
            <span style={{ fontSize: '14px', color: COLORS.accent, fontWeight: 500 }}>{stepTitles[step]}</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'rgba(197,156,130,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              backgroundColor: COLORS.accent,
              borderRadius: '3px',
              width: `${(step / totalSteps) * 100}%`,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      )}

      {/* Step 1: Work Type */}
      {step === 1 && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontFamily: "'Oswald', sans-serif", color: COLORS.text, marginBottom: '8px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            What would you like to design?
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '36px', fontFamily: "'Raleway', sans-serif", fontSize: '14px' }}>Choose your project scope</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[
              { id: 'full', icon: Home, title: 'Full Home', desc: 'Complete interior for entire home', bg: 'linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)', shadow: 'rgba(197,156,130,0.35)' },
              { id: 'specific', icon: LayoutGrid, title: 'Specific Rooms', desc: 'Select individual spaces', bg: 'linear-gradient(135deg, #111 0%, #333 100%)', shadow: 'rgba(0,0,0,0.2)' }
            ].map((type) => (
              <div
                key={type.id}
                onClick={() => { setData({ ...data, workType: type.id }); setStep(2) }}
                className="calc-option-card"
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: '20px',
                  padding: '36px 24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: `1px solid ${COLORS.border}`,
                  transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icon3D icon={type.icon} size={56} bg={type.bg} shadow={type.shadow} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: COLORS.text, fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase', letterSpacing: '0.03em' }}>{type.title}</h4>
                <p style={{ fontSize: '13px', color: COLORS.textMuted, fontFamily: "'Raleway', sans-serif", lineHeight: 1.6, marginBottom: '16px' }}>{type.desc}</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: COLORS.accent, fontFamily: "'Raleway', sans-serif" }}>
                  Select <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: BHK Selection */}
      {step === 2 && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px', textAlign: 'center' }}>
            Select your home type
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>Choose the configuration of your home</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {Object.keys(sizeMapping).map((bhk, idx) => {
              const isSelected = data.bhk === bhk
              return (
                <div
                  key={bhk}
                  onClick={() => { setData({ ...data, bhk }); setStep(3) }}
                  className="calc-option-card"
                  style={{
                    backgroundColor: isSelected ? COLORS.accent : COLORS.card,
                    border: `2px solid ${isSelected ? COLORS.accent : COLORS.border}`,
                    borderRadius: '16px',
                    padding: '24px 16px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                    <Icon3D icon={Home} size={36} bg={isSelected ? 'linear-gradient(135deg, #fff 0%, #f0e6dd 100%)' : 'linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)'} color={isSelected ? COLORS.accent : '#fff'} shadow={isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(197,156,130,0.3)'} />
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: isSelected ? '#fff' : COLORS.text, fontFamily: "'Oswald', sans-serif" }}>{bhk}</div>
                </div>
              )
            })}
          </div>

          <button onClick={() => setStep(1)} className="calc-back-btn">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      )}

      {/* Step 3: Size Selection */}
      {step === 3 && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px', textAlign: 'center' }}>
            What's your home size?
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>Select carpet area or enter custom</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
            {[
              { id: 'small', label: 'Compact', sqft: sizeMapping[data.bhk]?.small },
              { id: 'large', label: 'Spacious', sqft: sizeMapping[data.bhk]?.large }
            ].map((size) => (
              <div
                key={size.id}
                onClick={() => { setData({ ...data, size: size.id, customCarpetArea: '' }); setStep(data.workType === 'specific' ? 4 : 5) }}
                className="calc-option-card"
                style={{
                  backgroundColor: COLORS.card, /* white */
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '20px',
                  padding: '32px 24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <Icon3D icon={size.id === 'small' ? Ruler : Package} size={48} bg={size.id === 'small' ? 'linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)' : 'linear-gradient(135deg, #111 0%, #333 100%)'} shadow={size.id === 'small' ? 'rgba(197,156,130,0.35)' : 'rgba(0,0,0,0.2)'} />
                </div>
                <div style={{ fontSize: '16px', color: COLORS.accent, fontWeight: 500, marginBottom: '8px' }}>{size.label}</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: COLORS.text }}>{size.sqft}</div>
                <div style={{ fontSize: '14px', color: COLORS.textMuted }}>sq.ft</div>
              </div>
            ))}
          </div>

          {/* Custom Input */}
          <div style={{ backgroundColor: COLORS.card, /* white */ borderRadius: '16px', padding: '24px', border: `1px dashed ${COLORS.border}` }}>
            <label style={{ display: 'block', fontSize: '14px', color: COLORS.textMuted, marginBottom: '16px', textAlign: 'center' }}>
              Or enter your exact carpet area
            </label>
            <div style={{ display: 'flex', gap: '12px', maxWidth: '400px', margin: '0 auto' }}>
              <input
                type="number"
                value={data.customCarpetArea}
                onChange={(e) => setData({ ...data, customCarpetArea: e.target.value })}
                placeholder="e.g., 1200"
                style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  padding: '14px 18px',
                  color: COLORS.text,
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
              />
              <button
                onClick={() => {
                  if (data.customCarpetArea && parseInt(data.customCarpetArea) > 0) {
                    setData({ ...data, size: 'custom' })
                    setStep(data.workType === 'specific' ? 4 : 5)
                  }
                }}
                style={{
                  backgroundColor: COLORS.accent,
                  color: COLORS.dark,
                  padding: '14px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Go <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <button onClick={() => setStep(2)} className="calc-back-btn">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      )}

      {/* Step 4: Space Selection (specific only) */}
      {step === 4 && data.workType === 'specific' && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px', textAlign: 'center' }}>
            Select spaces to design
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>
            Tap to select • Max for {data.bhk}: {roomLimits[data.bhk]?.bedroom} beds, {roomLimits[data.bhk]?.kitchen} kitchen
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
            {spaces.map((space) => {
              const count = getSpaceCount(space.id)
              const isSelected = count > 0
              const limit = space.hasLimit ? roomLimits[data.bhk]?.[space.id] : null

              return (
                <div
                  key={space.id}
                  onClick={() => handleSpaceToggle(space.id)}
                  className="calc-option-card"
                  style={{
                    backgroundColor: isSelected ? COLORS.accent : COLORS.card,
                    border: `2px solid ${isSelected ? COLORS.accent : COLORS.border}`,
                    borderRadius: '16px',
                    padding: '20px 12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {count > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: COLORS.accent,
                      color: COLORS.dark,
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 700
                    }}>{count}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <Icon3D icon={space.icon} size={32} bg={isSelected ? 'linear-gradient(135deg, #fff 0%, #f0e6dd 100%)' : 'linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)'} color={isSelected ? COLORS.accent : '#fff'} shadow={isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(197,156,130,0.3)'} />
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? COLORS.dark : COLORS.text, fontFamily: "'Raleway', sans-serif" }}>{space.label}</div>
                  {limit && <div style={{ fontSize: '10px', color: isSelected ? 'rgba(0,0,0,0.5)' : COLORS.textMuted, marginTop: '4px' }}>Max {limit}</div>}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
            <button onClick={() => setStep(3)} className="calc-back-btn" style={{ marginTop: 0 }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={() => setStep(5)}
              disabled={data.selectedSpaces.length === 0}
              style={{
                flex: 1,
                backgroundColor: data.selectedSpaces.length > 0 ? COLORS.accent : 'rgba(197,156,130,0.3)',
                color: data.selectedSpaces.length > 0 ? COLORS.dark : COLORS.textMuted,
                padding: '16px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: data.selectedSpaces.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Category Selection */}
      {step === 5 && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px', textAlign: 'center' }}>
            Choose your design package
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>Select based on your style & budget</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[
              { id: 'affordable', icon: Check, title: 'Essential', price: '₹1,190', desc: 'Smart & functional', color: '#4A9D7C' },
              { id: 'premium', icon: Sparkles, title: 'Premium', price: '₹1,400', desc: 'Enhanced finishes', color: '#C59C82' },
              { id: 'luxury', icon: Gem, title: 'Luxury', price: '₹1,645', desc: 'High-end materials', color: '#A67C5B' },
              { id: 'superLuxury', icon: Crown, title: 'Ultra Luxury', price: '₹2,100', desc: 'Bespoke experience', color: '#111' }
            ].map((cat) => (
              <div
                key={cat.id}
                onClick={() => { setData({ ...data, category: cat.id }); setStep(6) }}
                className="calc-option-card"
                style={{
                  backgroundColor: COLORS.card, /* white */
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '20px',
                  padding: '28px 20px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: cat.color
                }} />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <Icon3D icon={cat.icon} size={44} bg={`linear-gradient(135deg, ${cat.color} 0%, ${cat.color}CC 100%)`} shadow={`${cat.color}40`} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.text, marginBottom: '4px' }}>{cat.title}</h4>
                <div style={{ fontSize: '24px', fontWeight: 700, color: cat.color, marginBottom: '4px' }}>{cat.price}</div>
                <div style={{ fontSize: '12px', color: COLORS.textMuted }}>per sq.ft</div>
                <p style={{ fontSize: '13px', color: COLORS.textMuted, marginTop: '12px' }}>{cat.desc}</p>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(data.workType === 'specific' ? 4 : 3)} className="calc-back-btn">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      )}

      {/* Step 6: Lead Capture Form */}
      {step === 6 && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px', textAlign: 'center' }}>
            Almost there!
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>
            Enter your details to view your personalized estimate
          </p>

          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ backgroundColor: COLORS.card, /* white */ borderRadius: '20px', padding: '32px' }}>
              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: COLORS.textMuted, marginBottom: '8px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="Enter your name"
                  style={{
                    width: '100%',
                    backgroundColor: COLORS.bg,
                    border: '2px solid rgba(197,156,130,0.3)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: COLORS.text,
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: COLORS.textMuted, marginBottom: '8px' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  style={{
                    width: '100%',
                    backgroundColor: COLORS.bg,
                    border: '2px solid rgba(197,156,130,0.3)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: COLORS.text,
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: COLORS.textMuted, marginBottom: '8px' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="Enter your email"
                  style={{
                    width: '100%',
                    backgroundColor: COLORS.bg,
                    border: '2px solid rgba(197,156,130,0.3)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: COLORS.text,
                    fontSize: '16px',
                    outline: 'none'
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
                  fontSize: '14px'
                }}>
                  {submitError}
                </div>
              )}

              <button
                onClick={handleLeadSubmit}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  backgroundColor: isSubmitting ? 'rgba(197,156,130,0.5)' : COLORS.accent,
                  color: COLORS.dark,
                  padding: '16px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'View My Estimate'}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </div>
          </div>

          <button onClick={() => setStep(5)} className="calc-back-btn">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      )}

      {/* Step 7: Results */}
      {step === 7 && cost && (
        <div className="calc-step-animate">
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
            borderRadius: '24px',
            padding: '40px 32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative elements */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <Icon3D icon={Sparkles} size={56} bg="linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)" shadow="rgba(197,156,130,0.4)" />
              </div>
              <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px' }}>
                Your Estimate is Ready!
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>Here's a detailed breakdown</p>

              {/* Main Cost Display */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '32px', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>Estimated Investment</div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: COLORS.text, marginBottom: '8px' }}>
                  ₹{cost.totalCost.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                  Range: ₹{cost.minCost.toLocaleString('en-IN')} - ₹{cost.maxCost.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Home Type', value: data.bhk },
                  { label: 'Area', value: `${cost.totalSqFt} sq.ft` },
                  { label: 'Package', value: data.category.charAt(0).toUpperCase() + data.category.slice(1).replace(/([A-Z])/g, ' $1') },
                  { label: 'Scope', value: data.workType === 'full' ? 'Full Home' : `${data.selectedSpaces.length} Rooms` }
                ].map((item, i) => (
                  <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: COLORS.text }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setStep(1)
                  setData({ bhk: '', size: '', category: '', workType: 'full', selectedSpaces: [], customCarpetArea: '' })
                  setLeadForm({ name: '', phone: '', email: '' })
                }}
                style={{
                  backgroundColor: 'white',
                  color: COLORS.accent,
                  padding: '16px 40px',
                  borderRadius: '50px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={18} /> Calculate Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// CONSTRUCTION CALCULATOR
// ============================================
const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

function ConstructionCalculator() {
  const [step, setStep] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [data, setData] = useState({
    projectType: '',
    plotArea: '',
    floors: '',
    category: ''
  })
  const [leadForm, setLeadForm] = useState({
    name: '',
    phone: '',
    email: ''
  })

  // Trigger confetti when reaching results
  useEffect(() => {
    if (step === 6) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [step])

  const floorMultipliers = { 'G': 1.0, 'G+1': 1.8, 'G+2': 2.6, 'G+3': 3.4, 'G+4': 4.2 }

  const residentialRates = {
    affordable: { min: 1155, max: 1260 },
    premium: { min: 1295, max: 1505 },
    luxury: { min: 1505, max: 1925 }
  }

  const commercialRates = {
    affordable: { min: 945, max: 1085 },
    premium: { min: 1085, max: 1295 },
    luxury: { min: 1295, max: 1680 }
  }

  const calculateBuiltUpArea = () => {
    if (!data.plotArea || !data.floors) return 0
    return Math.round(parseInt(data.plotArea) * floorMultipliers[data.floors])
  }

  const calculateCost = () => {
    if (!data.projectType || !data.plotArea || !data.floors || !data.category) return null
    const builtUpArea = calculateBuiltUpArea()
    const rates = data.projectType === 'residential' ? residentialRates[data.category] : commercialRates[data.category]
    const minCost = builtUpArea * rates.min
    const maxCost = builtUpArea * rates.max
    return { builtUpArea, minCost: Math.round(minCost), maxCost: Math.round(maxCost), minCostLakhs: (minCost / 100000).toFixed(1), maxCostLakhs: (maxCost / 100000).toFixed(1) }
  }

  const cost = calculateCost()
  const stepTitles = { 1: 'Project Type', 2: 'Plot Area', 3: 'Floors', 4: 'Category', 5: 'Your Details' }

  const handleLeadSubmit = async () => {
    if (!leadForm.name || !leadForm.phone) {
      setSubmitError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const estimatedCost = cost ? `₹${cost.minCostLakhs}L - ₹${cost.maxCostLakhs}L` : 'N/A'
      const response = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadForm.name,
          email: leadForm.email,
          phone: leadForm.phone,
          source: 'website',
          service: 'construction',
          websiteSource: 'HOH108',
          notes: [{ content: `Construction Calculator Lead\n\nProject Type: ${data.projectType}\nPlot Area: ${data.plotArea} sq.ft\nFloors: ${data.floors}\nCategory: ${data.category}\nBuilt-up Area: ${cost?.builtUpArea || 'N/A'} sq.ft\nEstimated Cost: ${estimatedCost}` }]
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Failed to submit')

      setStep(6)
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Confetti Effect */}
      <CelebrationEffect isActive={showConfetti} duration={4000} />

      {/* Step Indicator */}
      {step < 6 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: COLORS.textMuted }}>Step {step} of 5</span>
            <span style={{ fontSize: '14px', color: COLORS.accent, fontWeight: 500 }}>{stepTitles[step]}</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'rgba(197,156,130,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              backgroundColor: COLORS.accent,
              borderRadius: '3px',
              width: `${(step / 5) * 100}%`,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      )}

      {/* Step 1: Project Type */}
      {step === 1 && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px', textAlign: 'center' }}>
            What are you building?
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>Select your project type</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            {[
              { id: 'residential', icon: Home, title: 'Residential', desc: 'Homes, villas, apartments', bg: 'linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)', shadow: 'rgba(197,156,130,0.35)' },
              { id: 'commercial', icon: Warehouse, title: 'Commercial', desc: 'Offices, shops, warehouses', bg: 'linear-gradient(135deg, #111 0%, #333 100%)', shadow: 'rgba(0,0,0,0.2)' }
            ].map((type) => (
              <div
                key={type.id}
                onClick={() => { setData({ ...data, projectType: type.id }); setStep(2) }}
                className="calc-option-card"
                style={{
                  backgroundColor: COLORS.card,
                  borderRadius: '20px',
                  padding: '36px 24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: `1px solid ${COLORS.border}`,
                  transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s cubic-bezier(0.16,1,0.3,1)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icon3D icon={type.icon} size={56} bg={type.bg} shadow={type.shadow} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: COLORS.text, fontFamily: "'Oswald', sans-serif", textTransform: 'uppercase' }}>{type.title}</h4>
                <p style={{ fontSize: '13px', color: COLORS.textMuted, fontFamily: "'Raleway', sans-serif", marginBottom: '16px' }}>{type.desc}</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: COLORS.accent }}>
                  Select <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Plot Area */}
      {step === 2 && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px', textAlign: 'center' }}>
            Enter your plot area
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>Provide the plot size in square feet</p>

          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ backgroundColor: COLORS.card, /* white */ borderRadius: '20px', padding: '32px', textAlign: 'center' }}>
              <input
                type="number"
                value={data.plotArea}
                onChange={(e) => setData({ ...data, plotArea: e.target.value })}
                placeholder="e.g., 2400"
                style={{
                  width: '100%',
                  backgroundColor: COLORS.bg,
                  border: '2px solid rgba(197,156,130,0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  color: COLORS.text,
                  fontSize: '28px',
                  fontWeight: 600,
                  textAlign: 'center',
                  outline: 'none',
                  marginBottom: '16px'
                }}
                min="400"
                max="20000"
              />
              <div style={{ fontSize: '14px', color: COLORS.textMuted }}>Min: 400 sq.ft • Max: 20,000 sq.ft</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '32px', justifyContent: 'center' }}>
            <button onClick={() => setStep(1)} className="calc-back-btn" style={{ marginTop: 0 }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!data.plotArea || parseInt(data.plotArea) < 400}
              style={{
                backgroundColor: data.plotArea && parseInt(data.plotArea) >= 400 ? COLORS.accent : 'rgba(197,156,130,0.3)',
                color: COLORS.text,
                padding: '16px 40px',
                borderRadius: '12px',
                border: 'none',
                cursor: data.plotArea && parseInt(data.plotArea) >= 400 ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Continue <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Floors */}
      {step === 3 && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px', textAlign: 'center' }}>
            How many floors?
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>Select the number of floors to build</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {Object.keys(floorMultipliers).map((floor, i) => (
              <div
                key={floor}
                onClick={() => { setData({ ...data, floors: floor }); setStep(4) }}
                className="calc-option-card"
                style={{
                  backgroundColor: data.floors === floor ? COLORS.accent : COLORS.card,
                  border: `2px solid ${data.floors === floor ? COLORS.accent : 'rgba(197,156,130,0.2)'}`,
                  borderRadius: '16px',
                  padding: '24px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <Icon3D icon={Building2} size={32} bg="linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)" shadow="rgba(197,156,130,0.3)" />
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.text }}>{floor}</div>
                <div style={{ fontSize: '11px', color: data.floors === floor ? 'rgba(255,255,255,0.8)' : COLORS.textMuted, marginTop: '4px' }}>{i + 1} Floor{i > 0 ? 's' : ''}</div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(2)} className="calc-back-btn">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      )}

      {/* Step 4: Category */}
      {step === 4 && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px', textAlign: 'center' }}>
            Choose construction grade
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>Select based on quality & budget</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { id: 'affordable', icon: Check, title: 'Standard', desc: 'Quality on budget', color: '#4A9D7C' },
              { id: 'premium', icon: Sparkles, title: 'Premium', desc: 'Enhanced materials', color: '#C59C82' },
              { id: 'luxury', icon: Crown, title: 'Luxury', desc: 'Top-tier quality', color: '#111' }
            ].map((cat) => (
              <div
                key={cat.id}
                onClick={() => { setData({ ...data, category: cat.id }); setStep(5) }}
                className="calc-option-card"
                style={{
                  backgroundColor: COLORS.card, /* white */
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '20px',
                  padding: '32px 20px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: cat.color }} />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <Icon3D icon={cat.icon} size={44} bg={`linear-gradient(135deg, ${cat.color} 0%, ${cat.color}CC 100%)`} shadow={`${cat.color}40`} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.text, marginBottom: '8px' }}>{cat.title}</h4>
                <p style={{ fontSize: '13px', color: COLORS.textMuted }}>{cat.desc}</p>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(3)} className="calc-back-btn">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      )}

      {/* Step 5: Lead Capture Form */}
      {step === 5 && (
        <div className="calc-step-animate">
          <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '8px', textAlign: 'center' }}>
            Almost there!
          </h3>
          <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>
            Enter your details to view your personalized estimate
          </p>

          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ backgroundColor: COLORS.card, /* white */ borderRadius: '20px', padding: '32px' }}>
              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: COLORS.textMuted, marginBottom: '8px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                  placeholder="Enter your name"
                  style={{
                    width: '100%',
                    backgroundColor: COLORS.bg,
                    border: '2px solid rgba(197,156,130,0.3)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: COLORS.text,
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: COLORS.textMuted, marginBottom: '8px' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  style={{
                    width: '100%',
                    backgroundColor: COLORS.bg,
                    border: '2px solid rgba(197,156,130,0.3)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: COLORS.text,
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: COLORS.textMuted, marginBottom: '8px' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                  placeholder="Enter your email"
                  style={{
                    width: '100%',
                    backgroundColor: COLORS.bg,
                    border: '2px solid rgba(197,156,130,0.3)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    color: COLORS.text,
                    fontSize: '16px',
                    outline: 'none'
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
                  fontSize: '14px'
                }}>
                  {submitError}
                </div>
              )}

              <button
                onClick={handleLeadSubmit}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  backgroundColor: isSubmitting ? 'rgba(197,156,130,0.5)' : COLORS.accent,
                  color: COLORS.dark,
                  padding: '16px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'View My Estimate'}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </div>
          </div>

          <button onClick={() => setStep(4)} className="calc-back-btn">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      )}

      {/* Step 6: Results */}
      {step === 6 && cost && (
        <div className="calc-step-animate">
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
            borderRadius: '24px',
            padding: '40px 32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <Icon3D icon={Sparkles} size={56} bg="linear-gradient(135deg, #C59C82 0%, #A67C5B 100%)" shadow="rgba(197,156,130,0.4)" />
              </div>
              <h3 style={{ fontSize: '28px', fontFamily: 'Oswald, sans-serif', color: COLORS.text, marginBottom: '24px' }}>
                Construction Estimate Ready!
              </h3>

              {/* Built-up Area */}
              <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>Total Built-up Area</div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: COLORS.text }}>{cost.builtUpArea.toLocaleString()} sq.ft</div>
              </div>

              {/* Main Cost Display */}
              <div style={{ backgroundColor: COLORS.accent, color: COLORS.dark, borderRadius: '20px', padding: '28px', marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>Estimated Cost</div>
                <div style={{ fontSize: '40px', fontWeight: 700 }}>₹{cost.minCostLakhs}L - ₹{cost.maxCostLakhs}L</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '8px' }}>Including structure + finishing</div>
              </div>

              {/* Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Project', value: data.projectType.charAt(0).toUpperCase() + data.projectType.slice(1) },
                  { label: 'Plot', value: `${data.plotArea} sq.ft` },
                  { label: 'Floors', value: data.floors },
                  { label: 'Grade', value: data.category.charAt(0).toUpperCase() + data.category.slice(1) }
                ].map((item, i) => (
                  <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '14px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px', textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: COLORS.text }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setStep(1)
                  setData({ projectType: '', plotArea: '', floors: '', category: '' })
                  setLeadForm({ name: '', phone: '', email: '' })
                }}
                style={{
                  backgroundColor: 'white',
                  color: COLORS.accent,
                  padding: '16px 40px',
                  borderRadius: '50px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={18} /> Calculate Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN COST CALCULATOR
// ============================================
export default function CostCalculator() {
  const [activeTab, setActiveTab] = useState('interior')

  return (
    <div style={{ backgroundColor: COLORS.card, padding: 'clamp(20px, 4vw, 48px) clamp(12px, 2.5vw, 24px)', borderRadius: 'clamp(16px, 3vw, 28px)', boxShadow: '0 8px 40px rgba(0,0,0,0.06)', border: `1px solid ${COLORS.border}` }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Tab Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '4px',
          marginBottom: '40px',
          backgroundColor: COLORS.bg,
          padding: '6px',
          borderRadius: '14px',
          maxWidth: '420px',
          margin: '0 auto 40px',
          border: `1px solid ${COLORS.border}`,
        }}>
          <button
            onClick={() => setActiveTab('interior')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 24px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: "'Raleway', sans-serif",
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              backgroundColor: activeTab === 'interior' ? COLORS.accent : 'transparent',
              color: activeTab === 'interior' ? '#fff' : COLORS.textMuted,
              boxShadow: activeTab === 'interior' ? '0 4px 12px rgba(197,156,130,0.3)' : 'none',
            }}
          >
            <Sofa size={18} />
            Interior
          </button>
          <button
            onClick={() => setActiveTab('construction')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 24px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              fontFamily: "'Raleway', sans-serif",
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              backgroundColor: activeTab === 'construction' ? COLORS.accent : 'transparent',
              color: activeTab === 'construction' ? '#fff' : COLORS.textMuted,
              boxShadow: activeTab === 'construction' ? '0 4px 12px rgba(197,156,130,0.3)' : 'none',
            }}
          >
            <Building2 size={18} />
            Construction
          </button>
        </div>

        {/* Calculator Content */}
        <div style={{
          backgroundColor: COLORS.bg,
          borderRadius: '24px',
          padding: 'clamp(24px, 5vw, 40px)',
          border: `1px solid ${COLORS.border}`,
        }}>
          {activeTab === 'interior' ? <InteriorCalculator /> : <ConstructionCalculator />}
        </div>
      </div>
    </div>
  )
}
