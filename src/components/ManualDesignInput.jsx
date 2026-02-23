/**
 * ManualDesignInput - 7-Step Questionnaire for 3D Visualization
 * Collects user preferences when no floor plan is available
 */

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Home, Building2, Store, Briefcase, Sofa, Wand2, Clock, Wallet, Sparkles } from 'lucide-react'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  text: '#E5E5E5',
  textMuted: '#9CA3AF'
}

export default function ManualDesignInput({ onGenerate }) {
  const [step, setStep] = useState(1)
  const [preferences, setPreferences] = useState({
    propertyType: '',
    bhkType: '',
    designStyles: [],
    interiorsScope: '',
    budgetRange: '',
    timeline: '',
    personalisation: ''
  })

  const totalSteps = 7

  // Step configurations
  const steps = {
    1: {
      title: 'Property Type',
      subtitle: 'What type of property is this?',
      options: [
        { id: 'apartment', label: 'Apartment', icon: <Building2 size={32} />, desc: 'Flat in a residential complex' },
        { id: 'villa', label: 'Villa', icon: <Home size={32} />, desc: 'Independent house with garden' },
        { id: 'commercial', label: 'Commercial', icon: <Store size={32} />, desc: 'Shop, showroom, restaurant' },
        { id: 'office', label: 'Office', icon: <Briefcase size={32} />, desc: 'Corporate or startup workspace' }
      ],
      field: 'propertyType'
    },
    2: {
      title: 'Layout Type',
      subtitle: 'How many bedrooms do you have?',
      options: [
        { id: '1bhk', label: '1 BHK', desc: 'Living + 1 Bedroom' },
        { id: '2bhk', label: '2 BHK', desc: 'Living + 2 Bedrooms' },
        { id: '3bhk', label: '3 BHK', desc: 'Living + 3 Bedrooms' },
        { id: '4bhk', label: '4+ BHK', desc: 'Living + 4+ Bedrooms' },
        { id: 'studio', label: 'Studio', desc: 'Open layout design' }
      ],
      field: 'bhkType'
    },
    3: {
      title: 'Design Style',
      subtitle: 'Select up to 2 styles you prefer',
      multiSelect: true,
      maxSelect: 2,
      options: [
        { id: 'modern', label: 'Modern', desc: 'Clean lines, neutral tones', color: '#3B82F6' },
        { id: 'contemporary', label: 'Contemporary', desc: 'Trendy & bold accents', color: '#8B5CF6' },
        { id: 'minimalist', label: 'Minimalist', desc: 'Essential & spacious', color: '#6B7280' },
        { id: 'luxury', label: 'Luxury', desc: 'Rich textures & gold', color: '#F59E0B' },
        { id: 'indian-fusion', label: 'Indian Fusion', desc: 'Ethnic patterns & warm tones', color: '#C59C82' }
      ],
      field: 'designStyles'
    },
    4: {
      title: 'Interiors Scope',
      subtitle: 'What level of interiors do you need?',
      options: [
        { id: 'basic', label: 'Basic', desc: 'Essential furniture & paint', price: 'Budget-friendly' },
        { id: 'modular', label: 'Modular', desc: 'Modular kitchen & wardrobes', price: 'Mid-range' },
        { id: 'premium', label: 'Premium', desc: 'False ceiling, designer furniture', price: 'High-end' }
      ],
      field: 'interiorsScope'
    },
    5: {
      title: 'Budget Range',
      subtitle: 'What is your approximate budget?',
      options: [
        { id: '5-10L', label: '₹5 - 10 Lakhs', desc: 'Affordable elegance' },
        { id: '10-20L', label: '₹10 - 20 Lakhs', desc: 'Premium quality' },
        { id: '20-35L', label: '₹20 - 35 Lakhs', desc: 'Luxury finishes' },
        { id: '35L+', label: '₹35 Lakhs+', desc: 'Ultra luxury' }
      ],
      field: 'budgetRange'
    },
    6: {
      title: 'Timeline',
      subtitle: 'When do you want to start?',
      options: [
        { id: 'asap', label: 'ASAP', icon: <Clock size={24} />, desc: 'Ready to begin immediately' },
        { id: '1-3-months', label: '1-3 Months', icon: <Clock size={24} />, desc: 'Planning phase' },
        { id: '3-6-months', label: '3-6 Months', icon: <Clock size={24} />, desc: 'Future project' }
      ],
      field: 'timeline'
    },
    7: {
      title: 'Personalization',
      subtitle: 'Any special requests or preferences?',
      isTextInput: true,
      field: 'personalisation',
      placeholder: 'e.g., "I want a home office corner", "Pet-friendly furniture", "Lots of indoor plants"...'
    }
  }

  const currentStep = steps[step]

  const handleOptionSelect = (optionId) => {
    const field = currentStep.field

    if (currentStep.multiSelect) {
      const currentSelections = preferences[field] || []
      if (currentSelections.includes(optionId)) {
        setPreferences({
          ...preferences,
          [field]: currentSelections.filter(id => id !== optionId)
        })
      } else if (currentSelections.length < currentStep.maxSelect) {
        setPreferences({
          ...preferences,
          [field]: [...currentSelections, optionId]
        })
      }
    } else {
      setPreferences({ ...preferences, [field]: optionId })
      // Auto-advance for single select
      if (step < totalSteps) {
        setTimeout(() => setStep(step + 1), 300)
      }
    }
  }

  const handleTextChange = (value) => {
    setPreferences({ ...preferences, [currentStep.field]: value })
  }

  const canProceed = () => {
    const field = currentStep.field
    if (currentStep.isTextInput) return true // Optional field
    if (currentStep.multiSelect) return (preferences[field]?.length || 0) > 0
    return !!preferences[field]
  }

  const handleGenerate = () => {
    onGenerate(preferences)
  }

  // Summary step (after step 7)
  const renderSummary = () => (
    <div>
      <h3 style={{
        fontFamily: 'Oswald, sans-serif',
        fontSize: '28px',
        color: 'white',
        textAlign: 'center',
        marginBottom: '12px'
      }}>
        Review Your Preferences
      </h3>
      <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>
        Confirm your selections before generating
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {[
          { label: 'Property', value: preferences.propertyType?.charAt(0).toUpperCase() + preferences.propertyType?.slice(1) },
          { label: 'Layout', value: preferences.bhkType?.toUpperCase() },
          { label: 'Style', value: preferences.designStyles?.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') },
          { label: 'Scope', value: preferences.interiorsScope?.charAt(0).toUpperCase() + preferences.interiorsScope?.slice(1) },
          { label: 'Budget', value: preferences.budgetRange },
          { label: 'Timeline', value: preferences.timeline?.replace(/-/g, ' ').toUpperCase() }
        ].map((item, i) => (
          <div
            key={i}
            style={{
              backgroundColor: COLORS.dark,
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(197,156,130,0.2)'
            }}
          >
            <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '15px', color: 'white', fontWeight: 500 }}>
              {item.value || '-'}
            </div>
          </div>
        ))}
      </div>

      {preferences.personalisation && (
        <div style={{
          backgroundColor: COLORS.dark,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '32px',
          border: '1px solid rgba(197,156,130,0.2)'
        }}>
          <div style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Special Requests
          </div>
          <div style={{ fontSize: '15px', color: 'white', lineHeight: 1.6 }}>
            {preferences.personalisation}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => setStep(7)}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            color: COLORS.textMuted,
            padding: '16px 24px',
            borderRadius: '12px',
            border: '2px solid rgba(197,156,130,0.3)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <ArrowLeft size={18} /> Edit
        </button>
        <button
          onClick={handleGenerate}
          style={{
            flex: 2,
            backgroundColor: COLORS.accent,
            color: COLORS.dark,
            padding: '16px 24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <Wand2 size={20} />
          Generate 3D Concept
        </button>
      </div>
    </div>
  )

  if (step > totalSteps) {
    return renderSummary()
  }

  return (
    <div>
      {/* Progress Indicator */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px', color: COLORS.textMuted }}>Step {step} of {totalSteps}</span>
          <span style={{ fontSize: '14px', color: COLORS.accent, fontWeight: 500 }}>{currentStep.title}</span>
        </div>
        <div style={{ height: '6px', backgroundColor: 'rgba(197,156,130,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            backgroundColor: COLORS.accent,
            borderRadius: '3px',
            width: `${(step / totalSteps) * 100}%`,
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Question */}
      <h3 style={{
        fontFamily: 'Oswald, sans-serif',
        fontSize: '28px',
        color: 'white',
        textAlign: 'center',
        marginBottom: '8px'
      }}>
        {currentStep.title}
      </h3>
      <p style={{ color: COLORS.textMuted, textAlign: 'center', marginBottom: '32px' }}>
        {currentStep.subtitle}
      </p>

      {/* Options */}
      {!currentStep.isTextInput ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(${currentStep.options.length <= 3 ? '200px' : '140px'}, 1fr))`,
          gap: '16px',
          marginBottom: '32px'
        }}>
          {currentStep.options.map((option) => {
            const isSelected = currentStep.multiSelect
              ? preferences[currentStep.field]?.includes(option.id)
              : preferences[currentStep.field] === option.id

            return (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className="calc-option-card"
                style={{
                  backgroundColor: isSelected ? COLORS.accent : COLORS.dark,
                  border: `2px solid ${isSelected ? COLORS.accent : 'rgba(197,156,130,0.2)'}`,
                  borderRadius: '16px',
                  padding: '24px 16px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? COLORS.dark : COLORS.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={14} color={isSelected ? 'white' : COLORS.dark} />
                  </div>
                )}

                {option.icon && (
                  <div style={{
                    color: isSelected ? COLORS.dark : COLORS.accent,
                    marginBottom: '12px'
                  }}>
                    {option.icon}
                  </div>
                )}

                {option.color && (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: option.color,
                    margin: '0 auto 12px'
                  }} />
                )}

                <div style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: isSelected ? COLORS.dark : 'white',
                  marginBottom: '4px'
                }}>
                  {option.label}
                </div>

                {option.desc && (
                  <div style={{
                    fontSize: '13px',
                    color: isSelected ? 'rgba(0,0,0,0.6)' : COLORS.textMuted
                  }}>
                    {option.desc}
                  </div>
                )}

                {option.price && (
                  <div style={{
                    fontSize: '12px',
                    color: isSelected ? 'rgba(0,0,0,0.5)' : COLORS.accent,
                    marginTop: '8px',
                    fontWeight: 500
                  }}>
                    {option.price}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ marginBottom: '32px' }}>
          <textarea
            value={preferences[currentStep.field] || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={currentStep.placeholder}
            rows={4}
            style={{
              width: '100%',
              backgroundColor: COLORS.dark,
              border: '2px solid rgba(197,156,130,0.3)',
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              fontSize: '16px',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.6
            }}
          />
          <p style={{ color: COLORS.textMuted, fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
            This field is optional - skip if you prefer
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              color: COLORS.textMuted,
              padding: '16px 24px',
              borderRadius: '12px',
              border: '2px solid rgba(197,156,130,0.3)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={18} /> Back
          </button>
        )}

        {(currentStep.multiSelect || currentStep.isTextInput) && (
          <button
            onClick={() => step < totalSteps ? setStep(step + 1) : setStep(totalSteps + 1)}
            disabled={!canProceed() && !currentStep.isTextInput}
            style={{
              flex: 2,
              backgroundColor: canProceed() || currentStep.isTextInput ? COLORS.accent : 'rgba(197,156,130,0.3)',
              color: canProceed() || currentStep.isTextInput ? COLORS.dark : COLORS.textMuted,
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: canProceed() || currentStep.isTextInput ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {step === totalSteps ? (
              <>Review <Sparkles size={18} /></>
            ) : (
              <>Continue <ArrowRight size={18} /></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
