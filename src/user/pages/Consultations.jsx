import { useState } from 'react'
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  Phone,
  Mail,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  MessageSquare,
  Star,
  Building,
  Home,
  Palette,
} from 'lucide-react'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  cardHover: '#222222',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textMuted: 'rgba(255,255,255,0.6)',
  border: 'rgba(255,255,255,0.1)',
}

const CONSULTATION_TYPES = {
  site_visit: { label: 'Site Visit', icon: MapPin, color: '#10b981' },
  video_call: { label: 'Video Call', icon: Video, color: '#3b82f6' },
  office_meeting: { label: 'Office Meeting', icon: Building, color: '#8b5cf6' },
}

const STATUS_CONFIG = {
  upcoming: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'Upcoming' },
  completed: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: 'Completed' },
  cancelled: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: 'Cancelled' },
  rescheduled: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'Rescheduled' },
}

const mockConsultations = [
  {
    id: 'CON-001',
    type: 'site_visit',
    date: '2024-01-20',
    time: '10:00 AM',
    duration: '2 hours',
    status: 'upcoming',
    project: 'Living Room Renovation',
    designer: {
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya@hoh108.com',
      rating: 4.9,
      reviews: 124,
      image: null,
    },
    location: '42, Park Street, Indiranagar, Bangalore - 560038',
    notes: 'Initial site measurement and design discussion',
    agenda: ['Take measurements', 'Discuss layout options', 'Review material samples'],
  },
  {
    id: 'CON-002',
    type: 'video_call',
    date: '2024-01-18',
    time: '3:00 PM',
    duration: '1 hour',
    status: 'upcoming',
    project: 'Master Bedroom Design',
    designer: {
      name: 'Rahul Verma',
      phone: '+91 98765 43211',
      email: 'rahul@hoh108.com',
      rating: 4.8,
      reviews: 98,
      image: null,
    },
    location: null,
    meetingLink: 'https://meet.hoh108.com/consultation/CON-002',
    notes: 'Design presentation and feedback session',
    agenda: ['Present 3D renders', 'Discuss color schemes', 'Review furniture selections'],
  },
  {
    id: 'CON-003',
    type: 'office_meeting',
    date: '2024-01-10',
    time: '11:00 AM',
    duration: '1.5 hours',
    status: 'completed',
    project: 'Office Interior',
    designer: {
      name: 'Priya Sharma',
      phone: '+91 98765 43210',
      email: 'priya@hoh108.com',
      rating: 4.9,
      reviews: 124,
      image: null,
    },
    location: 'HOH108 Design Studio, MG Road, Bangalore',
    notes: 'Contract signing and material selection',
    agenda: ['Review final quote', 'Select materials', 'Sign contract'],
    feedback: {
      rating: 5,
      comment: 'Very helpful session. Priya explained everything clearly.',
    },
  },
  {
    id: 'CON-004',
    type: 'site_visit',
    date: '2024-01-05',
    time: '2:00 PM',
    duration: '2 hours',
    status: 'cancelled',
    project: 'Kitchen Modular',
    designer: {
      name: 'Amit Patel',
      phone: '+91 98765 43212',
      email: 'amit@hoh108.com',
      rating: 4.7,
      reviews: 76,
      image: null,
    },
    location: '15, 2nd Cross, Koramangala, Bangalore',
    notes: 'Cancelled due to schedule conflict',
    cancellationReason: 'Client requested reschedule due to personal emergency',
  },
]

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
]

const designers = [
  { id: 1, name: 'Priya Sharma', specialty: 'Residential', rating: 4.9, available: true },
  { id: 2, name: 'Rahul Verma', specialty: 'Modern', rating: 4.8, available: true },
  { id: 3, name: 'Amit Patel', specialty: 'Modular', rating: 4.7, available: false },
]

const Consultations = () => {
  const [consultations] = useState(mockConsultations)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingStep, setBookingStep] = useState(1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedDesigner, setSelectedDesigner] = useState(null)

  const filteredConsultations = consultations.filter(c => {
    if (activeTab === 'upcoming') return c.status === 'upcoming' || c.status === 'rescheduled'
    if (activeTab === 'past') return c.status === 'completed' || c.status === 'cancelled'
    return true
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getDaysInMonth = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const cardStyle = {
    background: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 }}>
            Consultations
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px', marginTop: '8px' }}>
            Schedule and manage your design consultations
          </p>
        </div>
        <button
          onClick={() => {
            setShowBookingModal(true)
            setBookingStep(1)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: COLORS.accent,
            border: 'none',
            borderRadius: '12px',
            color: COLORS.dark,
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          Book Consultation
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[
          { label: 'Upcoming', value: consultations.filter(c => c.status === 'upcoming').length, color: '#3b82f6' },
          { label: 'Completed', value: consultations.filter(c => c.status === 'completed').length, color: '#10b981' },
          { label: 'This Month', value: 3, color: '#8b5cf6' },
          { label: 'Total Hours', value: '12.5', color: COLORS.accent },
        ].map((stat, i) => (
          <div key={i} style={{
            ...cardStyle,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `${stat.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Calendar style={{ width: '24px', height: '24px', color: stat.color }} />
            </div>
            <div>
              <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>{stat.label}</p>
              <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['upcoming', 'past', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab ? COLORS.accent : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '10px',
              color: activeTab === tab ? COLORS.dark : 'white',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'past' ? 'Past' : tab === 'upcoming' ? 'Upcoming' : 'All'}
          </button>
        ))}
      </div>

      {/* Consultations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredConsultations.map((consultation) => {
          const typeConfig = CONSULTATION_TYPES[consultation.type]
          const TypeIcon = typeConfig.icon
          const statusConfig = STATUS_CONFIG[consultation.status]

          return (
            <div key={consultation.id} style={cardStyle}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Left */}
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {/* Date Box */}
                    <div style={{
                      width: '80px',
                      textAlign: 'center',
                      padding: '16px',
                      background: `${COLORS.accent}15`,
                      borderRadius: '12px',
                    }}>
                      <p style={{ color: COLORS.accent, fontSize: '12px', fontWeight: '600', margin: 0, textTransform: 'uppercase' }}>
                        {new Date(consultation.date).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: '4px 0' }}>
                        {new Date(consultation.date).getDate()}
                      </p>
                      <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: 0 }}>
                        {new Date(consultation.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                    </div>

                    {/* Details */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                          {consultation.project}
                        </h3>
                        <span style={{
                          padding: '4px 10px',
                          background: statusConfig.bg,
                          color: statusConfig.color,
                          fontSize: '12px',
                          fontWeight: '500',
                          borderRadius: '6px',
                        }}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <TypeIcon style={{ width: '16px', height: '16px', color: typeConfig.color }} />
                          <span style={{ color: typeConfig.color, fontSize: '13px', fontWeight: '500' }}>
                            {typeConfig.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock style={{ width: '14px', height: '14px', color: COLORS.textMuted }} />
                          <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                            {consultation.time} • {consultation.duration}
                          </span>
                        </div>
                      </div>

                      {consultation.location && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '12px' }}>
                          <MapPin style={{ width: '14px', height: '14px', color: COLORS.textMuted, marginTop: '2px' }} />
                          <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                            {consultation.location}
                          </span>
                        </div>
                      )}

                      {/* Designer Info */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '10px',
                        marginTop: '16px',
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: `${COLORS.accent}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <User style={{ width: '20px', height: '20px', color: COLORS.accent }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                            {consultation.designer.name}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Star style={{ width: '12px', height: '12px', color: '#f59e0b', fill: '#f59e0b' }} />
                              <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '500' }}>
                                {consultation.designer.rating}
                              </span>
                            </div>
                            <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>
                              ({consultation.designer.reviews} reviews)
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <a
                            href={`tel:${consultation.designer.phone}`}
                            style={{
                              padding: '8px',
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              color: 'white',
                            }}
                          >
                            <Phone style={{ width: '16px', height: '16px' }} />
                          </a>
                          <a
                            href={`mailto:${consultation.designer.email}`}
                            style={{
                              padding: '8px',
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              color: 'white',
                            }}
                          >
                            <Mail style={{ width: '16px', height: '16px' }} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right - Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {consultation.status === 'upcoming' && (
                      <>
                        {consultation.type === 'video_call' && (
                          <button
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '10px 16px',
                              background: '#3b82f6',
                              border: 'none',
                              borderRadius: '10px',
                              color: 'white',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                            }}
                          >
                            <Video style={{ width: '16px', height: '16px' }} />
                            Join Call
                          </button>
                        )}
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: '10px',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          <Calendar style={{ width: '16px', height: '16px' }} />
                          Reschedule
                        </button>
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '10px',
                            color: '#ef4444',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          <X style={{ width: '16px', height: '16px' }} />
                          Cancel
                        </button>
                      </>
                    )}
                    {consultation.status === 'completed' && !consultation.feedback && (
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
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
                        <Star style={{ width: '16px', height: '16px' }} />
                        Leave Feedback
                      </button>
                    )}
                  </div>
                </div>

                {/* Agenda */}
                {consultation.agenda && consultation.status !== 'cancelled' && (
                  <div style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: `1px solid ${COLORS.border}`,
                  }}>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '500', marginBottom: '12px', textTransform: 'uppercase' }}>
                      Agenda
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {consultation.agenda.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 14px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '8px',
                          }}
                        >
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: consultation.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {consultation.status === 'completed' ? (
                              <Check style={{ width: '10px', height: '10px', color: '#10b981' }} />
                            ) : (
                              <span style={{ color: COLORS.textMuted, fontSize: '10px' }}>{i + 1}</span>
                            )}
                          </div>
                          <span style={{ color: 'white', fontSize: '13px' }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {consultation.feedback && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <p style={{ color: '#10b981', fontSize: '13px', fontWeight: '500', margin: 0 }}>Your Feedback</p>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            style={{
                              width: '14px',
                              height: '14px',
                              color: i < consultation.feedback.rating ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                              fill: i < consultation.feedback.rating ? '#f59e0b' : 'transparent',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0 }}>
                      "{consultation.feedback.comment}"
                    </p>
                  </div>
                )}

                {/* Cancellation Reason */}
                {consultation.cancellationReason && (
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}>
                    <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: '500', margin: '0 0 4px 0' }}>
                      Cancellation Reason
                    </p>
                    <p style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '14px', margin: 0 }}>
                      {consultation.cancellationReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {filteredConsultations.length === 0 && (
          <div style={{
            ...cardStyle,
            padding: '60px',
            textAlign: 'center',
          }}>
            <Calendar style={{ width: '48px', height: '48px', color: COLORS.textMuted, margin: '0 auto 16px' }} />
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              No consultations found
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: '0 0 24px 0' }}>
              {activeTab === 'upcoming' ? 'You don\'t have any upcoming consultations' : 'No past consultations to show'}
            </p>
            <button
              onClick={() => setShowBookingModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: COLORS.accent,
                border: 'none',
                borderRadius: '12px',
                color: COLORS.dark,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus style={{ width: '18px', height: '18px' }} />
              Book Your First Consultation
            </button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '600px',
            background: COLORS.card,
            borderRadius: '20px',
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                  Book Consultation
                </h2>
                <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: '4px 0 0 0' }}>
                  Step {bookingStep} of 3
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                style={{
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              {/* Step 1: Select Type */}
              {bookingStep === 1 && (
                <div>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    Select Consultation Type
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(CONSULTATION_TYPES).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedType(key)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px 20px',
                            background: selectedType === key ? `${config.color}15` : 'rgba(255,255,255,0.03)',
                            border: `2px solid ${selectedType === key ? config.color : 'transparent'}`,
                            borderRadius: '12px',
                            color: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: `${config.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Icon style={{ width: '24px', height: '24px', color: config.color }} />
                          </div>
                          <div>
                            <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{config.label}</p>
                            <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
                              {key === 'site_visit' && 'Designer visits your location'}
                              {key === 'video_call' && 'Virtual meeting from anywhere'}
                              {key === 'office_meeting' && 'Visit our design studio'}
                            </p>
                          </div>
                          {selectedType === key && (
                            <Check style={{ width: '20px', height: '20px', color: config.color, marginLeft: 'auto' }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Select Date & Time */}
              {bookingStep === 2 && (
                <div>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    Select Date & Time
                  </h3>

                  {/* Calendar */}
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}>
                        <ChevronLeft style={{ width: '20px', height: '20px' }} />
                      </button>
                      <span style={{ color: 'white', fontSize: '16px', fontWeight: '500' }}>
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '8px' }}>
                        <ChevronRight style={{ width: '20px', height: '20px' }} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span key={i} style={{ color: COLORS.textMuted, fontSize: '12px', padding: '8px' }}>{d}</span>
                      ))}
                      {getDaysInMonth().map((day, i) => (
                        <button
                          key={i}
                          disabled={!day || day < new Date().getDate()}
                          onClick={() => day && setSelectedDate(day)}
                          style={{
                            padding: '10px',
                            background: selectedDate === day ? COLORS.accent : 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            color: !day || day < new Date().getDate() ? 'rgba(255,255,255,0.2)' : selectedDate === day ? COLORS.dark : 'white',
                            fontSize: '14px',
                            cursor: day && day >= new Date().getDate() ? 'pointer' : 'default',
                            fontWeight: selectedDate === day ? '600' : '400',
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
                    Available Time Slots
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        style={{
                          padding: '12px',
                          background: selectedTime === time ? COLORS.accent : 'rgba(255,255,255,0.03)',
                          border: selectedTime === time ? 'none' : `1px solid ${COLORS.border}`,
                          borderRadius: '10px',
                          color: selectedTime === time ? COLORS.dark : 'white',
                          fontSize: '13px',
                          fontWeight: selectedTime === time ? '600' : '400',
                          cursor: 'pointer',
                        }}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Select Designer */}
              {bookingStep === 3 && (
                <div>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    Select Designer
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {designers.map((designer) => (
                      <button
                        key={designer.id}
                        disabled={!designer.available}
                        onClick={() => setSelectedDesigner(designer.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          padding: '16px 20px',
                          background: selectedDesigner === designer.id ? `${COLORS.accent}15` : 'rgba(255,255,255,0.03)',
                          border: `2px solid ${selectedDesigner === designer.id ? COLORS.accent : 'transparent'}`,
                          borderRadius: '12px',
                          color: 'white',
                          cursor: designer.available ? 'pointer' : 'not-allowed',
                          textAlign: 'left',
                          opacity: designer.available ? 1 : 0.5,
                        }}
                      >
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: `${COLORS.accent}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <User style={{ width: '24px', height: '24px', color: COLORS.accent }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>{designer.name}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>{designer.specialty}</span>
                            <span style={{ color: COLORS.textMuted }}>•</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Star style={{ width: '12px', height: '12px', color: '#f59e0b', fill: '#f59e0b' }} />
                              <span style={{ color: '#f59e0b', fontSize: '13px' }}>{designer.rating}</span>
                            </div>
                          </div>
                        </div>
                        {!designer.available && (
                          <span style={{ color: '#ef4444', fontSize: '12px' }}>Not Available</span>
                        )}
                        {selectedDesigner === designer.id && (
                          <Check style={{ width: '20px', height: '20px', color: COLORS.accent }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '24px',
              borderTop: `1px solid ${COLORS.border}`,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              {bookingStep > 1 ? (
                <button
                  onClick={() => setBookingStep(bookingStep - 1)}
                  style={{
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Back
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => {
                  if (bookingStep < 3) {
                    setBookingStep(bookingStep + 1)
                  } else {
                    setShowBookingModal(false)
                    // Handle booking confirmation
                  }
                }}
                disabled={
                  (bookingStep === 1 && !selectedType) ||
                  (bookingStep === 2 && (!selectedDate || !selectedTime)) ||
                  (bookingStep === 3 && !selectedDesigner)
                }
                style={{
                  padding: '12px 24px',
                  background: COLORS.accent,
                  border: 'none',
                  borderRadius: '10px',
                  color: COLORS.dark,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: (
                    (bookingStep === 1 && !selectedType) ||
                    (bookingStep === 2 && (!selectedDate || !selectedTime)) ||
                    (bookingStep === 3 && !selectedDesigner)
                  ) ? 0.5 : 1,
                }}
              >
                {bookingStep === 3 ? 'Confirm Booking' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Consultations
