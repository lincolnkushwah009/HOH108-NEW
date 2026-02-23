import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sofa,
  Hammer,
  PaintBucket,
  Building2,
  Wrench,
  Sparkles,
  ChevronRight,
  Clock,
  Star,
  CheckCircle,
  Phone,
  MessageCircle,
  Calendar,
  ArrowRight,
} from 'lucide-react'

const COLORS = {
  dark: '#111111',
  darker: '#0A0A0A',
  card: '#1A1A1A',
  cardElevated: '#222222',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  accentLight: '#D4B59A',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.08)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}

const services = [
  {
    id: 'interior',
    name: 'Interior Design',
    description: 'Transform your living spaces with our expert interior design services. From concept to completion.',
    icon: Sofa,
    color: '#C59C82',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
    features: ['Space Planning', '3D Visualization', 'Material Selection', 'Project Management'],
    startingPrice: '50,000',
    duration: '4-8 weeks',
    rating: 4.9,
    reviews: 128,
  },
  {
    id: 'renovation',
    name: 'Home Renovation',
    description: 'Complete renovation services to breathe new life into your home with modern upgrades.',
    icon: Hammer,
    color: '#f59e0b',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
    features: ['Structural Changes', 'Electrical Work', 'Plumbing', 'Flooring'],
    startingPrice: '2,00,000',
    duration: '8-16 weeks',
    rating: 4.8,
    reviews: 95,
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Build your dream home from ground up with our comprehensive construction services.',
    icon: Building2,
    color: '#3b82f6',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
    features: ['Architecture', 'Civil Work', 'MEP Services', 'Quality Control'],
    startingPrice: '25,00,000',
    duration: '12-24 months',
    rating: 4.9,
    reviews: 67,
  },
  {
    id: 'painting',
    name: 'Painting Services',
    description: 'Professional painting services with premium quality paints and expert craftsmanship.',
    icon: PaintBucket,
    color: '#10b981',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800',
    features: ['Wall Painting', 'Texture Finish', 'Waterproofing', 'Polishing'],
    startingPrice: '15,000',
    duration: '3-7 days',
    rating: 4.7,
    reviews: 203,
  },
  {
    id: 'repair',
    name: 'Repairs & Maintenance',
    description: 'Quick and reliable repair services for all your home maintenance needs.',
    icon: Wrench,
    color: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
    features: ['Plumbing Repairs', 'Electrical Fixes', 'Carpentry', 'AC Service'],
    startingPrice: '500',
    duration: '1-3 days',
    rating: 4.6,
    reviews: 342,
  },
  {
    id: 'modular',
    name: 'Modular Solutions',
    description: 'Custom modular kitchens, wardrobes, and furniture designed for your space.',
    icon: Sparkles,
    color: '#ec4899',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    features: ['Modular Kitchen', 'Wardrobes', 'TV Units', 'Storage Solutions'],
    startingPrice: '1,50,000',
    duration: '4-6 weeks',
    rating: 4.8,
    reviews: 156,
  },
]

const MobileServices = () => {
  const navigate = useNavigate()
  const [selectedService, setSelectedService] = useState(null)

  const cardStyle = {
    background: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  }

  const handleBookService = (service) => {
    navigate('/dashboard/consultations')
  }

  return (
    <div style={{ paddingBottom: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: COLORS.textPrimary, fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>
          On Demand Services
        </h1>
        <p style={{ color: COLORS.textSecondary, fontSize: '14px', margin: 0 }}>
          Professional home services at your fingertips
        </p>
      </div>

      {/* Featured Banner */}
      <div style={{
        ...cardStyle,
        background: `linear-gradient(135deg, ${COLORS.accent}20 0%, ${COLORS.accentDark}20 100%)`,
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: `${COLORS.accent}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Calendar style={{ width: '28px', height: '28px', color: COLORS.accent }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: COLORS.textPrimary, fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Free Consultation
          </p>
          <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>
            Book a free consultation with our experts
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/consultations')}
          style={{
            padding: '10px 16px',
            background: COLORS.accent,
            border: 'none',
            borderRadius: '10px',
            color: COLORS.dark,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Book Now
        </button>
      </div>

      {/* Services List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {services.map((service) => {
          const Icon = service.icon
          return (
            <div
              key={service.id}
              style={cardStyle}
            >
              {/* Service Image */}
              <div style={{
                height: '140px',
                background: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.9) 100%), url(${service.image}) center/cover`,
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '16px',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <Star style={{ width: '12px', height: '12px', color: COLORS.warning, fill: COLORS.warning }} />
                  <span style={{ color: COLORS.textPrimary, fontSize: '12px', fontWeight: '600' }}>
                    {service.rating}
                  </span>
                  <span style={{ color: COLORS.textMuted, fontSize: '11px' }}>
                    ({service.reviews})
                  </span>
                </div>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: `${service.color}30`,
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon style={{ width: '22px', height: '22px', color: service.color }} />
                </div>
              </div>

              {/* Service Content */}
              <div style={{ padding: '16px' }}>
                <h3 style={{ color: COLORS.textPrimary, fontSize: '17px', fontWeight: '600', margin: '0 0 8px 0' }}>
                  {service.name}
                </h3>
                <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  {service.description}
                </p>

                {/* Features */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '16px',
                }}>
                  {service.features.map((feature, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '20px',
                        color: COLORS.textSecondary,
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle style={{ width: '10px', height: '10px', color: COLORS.success }} />
                      {feature}
                    </span>
                  ))}
                </div>

                {/* Price & Duration */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                }}>
                  <div>
                    <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '0 0 2px 0' }}>Starting from</p>
                    <p style={{ color: COLORS.accent, fontSize: '18px', fontWeight: '700', margin: 0 }}>
                      ₹{service.startingPrice}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '0 0 2px 0' }}>Duration</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock style={{ width: '12px', height: '12px', color: COLORS.textSecondary }} />
                      <span style={{ color: COLORS.textSecondary, fontSize: '13px', fontWeight: '500' }}>
                        {service.duration}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleBookService(service)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: COLORS.accent,
                      border: 'none',
                      borderRadius: '12px',
                      color: COLORS.dark,
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    Book Consultation
                    <ArrowRight style={{ width: '16px', height: '16px' }} />
                  </button>
                  <button
                    style={{
                      width: '48px',
                      height: '48px',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Phone style={{ width: '20px', height: '20px', color: COLORS.textSecondary }} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Contact Support */}
      <div style={{
        ...cardStyle,
        padding: '20px',
        marginTop: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: `${COLORS.info}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <MessageCircle style={{ width: '26px', height: '26px', color: COLORS.info }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: COLORS.textPrimary, fontSize: '15px', fontWeight: '600', margin: '0 0 4px 0' }}>
            Need Help Choosing?
          </p>
          <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>
            Chat with our experts for personalized recommendations
          </p>
        </div>
        <ChevronRight style={{ width: '20px', height: '20px', color: COLORS.textMuted }} />
      </div>
    </div>
  )
}

export default MobileServices
