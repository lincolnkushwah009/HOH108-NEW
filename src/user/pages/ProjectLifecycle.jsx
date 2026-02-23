import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Clock,
  Package,
  ClipboardCheck,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Camera,
  CheckCircle,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Star,
  Award,
  Briefcase,
  Video,
  FileText,
  Truck,
  Shield,
  PenTool,
  Eye,
  Download,
  Share2,
  MessageCircle,
  ThumbsUp,
  X,
  Check,
  Loader,
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

// Mock project data
const mockProject = {
  id: 'PRJ-2025-001',
  name: 'Living Room Renovation',
  status: 'in_progress',
  progress: 65,
  startDate: '2024-12-01',
  expectedEnd: '2025-02-15',
  location: 'Sector 45, Gurugram',
  budget: 850000,
  spent: 552500,
  description: 'Complete living room renovation including flooring, wall treatments, custom furniture, and lighting design.',
  currentPhase: 'Furniture Installation',
  phases: [
    { name: 'Design & Planning', status: 'completed', progress: 100 },
    { name: 'Demolition & Prep', status: 'completed', progress: 100 },
    { name: 'Electrical & Plumbing', status: 'completed', progress: 100 },
    { name: 'Flooring & Walls', status: 'completed', progress: 100 },
    { name: 'Furniture Installation', status: 'in_progress', progress: 60 },
    { name: 'Finishing & Decor', status: 'pending', progress: 0 },
  ],
}

// Mock team data
const mockTeam = [
  {
    id: 1,
    name: 'Rahul Sharma',
    role: 'Project Manager',
    designation: 'Senior Project Manager',
    experience: 12,
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    rating: 4.9,
    projectsCompleted: 87,
    specialization: ['Residential', 'Commercial', 'Luxury Homes'],
    portfolio: [
      { image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400', title: 'Modern Villa' },
      { image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400', title: 'Luxury Apartment' },
    ],
    isLead: true,
  },
  {
    id: 2,
    name: 'Priya Patel',
    role: 'Interior Designer',
    designation: 'Lead Designer',
    experience: 8,
    phone: '+91 98765 43211',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    rating: 4.8,
    projectsCompleted: 56,
    specialization: ['Contemporary', 'Minimalist', 'Scandinavian'],
    portfolio: [
      { image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', title: 'Modern Kitchen' },
      { image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400', title: 'Living Space' },
    ],
    isLead: false,
  },
  {
    id: 3,
    name: 'Amit Kumar',
    role: 'Site Engineer',
    designation: 'Senior Site Engineer',
    experience: 10,
    phone: '+91 98765 43212',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    rating: 4.7,
    projectsCompleted: 124,
    specialization: ['Civil Works', 'Structural', 'MEP'],
    portfolio: [
      { image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400', title: 'Construction Site' },
    ],
    isLead: false,
  },
  {
    id: 4,
    name: 'Deepak Verma',
    role: 'Carpenter',
    designation: 'Master Craftsman',
    experience: 15,
    phone: '+91 98765 43213',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    rating: 4.9,
    projectsCompleted: 200,
    specialization: ['Custom Furniture', 'Modular', 'Wood Carving'],
    portfolio: [
      { image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', title: 'Custom Sofa' },
    ],
    isLead: false,
  },
]

// Mock timeline/updates data
const mockUpdates = [
  {
    id: 1,
    type: 'image',
    title: 'Flooring Installation Complete',
    description: 'Italian marble flooring has been installed in the living area',
    media: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    timestamp: '2025-01-02T14:30:00',
    uploadedBy: { name: 'Amit Kumar', role: 'Site Engineer', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
    location: 'Living Room - Zone A',
    phase: 'Flooring & Walls',
    likes: 5,
    comments: 2,
  },
  {
    id: 2,
    type: 'video',
    title: 'Wall Treatment Progress',
    description: 'Textured wall painting in progress - Day 2',
    media: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800',
    thumbnail: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400',
    timestamp: '2025-01-01T11:15:00',
    uploadedBy: { name: 'Rahul Sharma', role: 'Project Manager', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
    location: 'Living Room - Main Wall',
    phase: 'Flooring & Walls',
    likes: 8,
    comments: 4,
  },
  {
    id: 3,
    type: 'image',
    title: 'Custom Sofa Frame',
    description: 'Wooden frame for custom L-shaped sofa ready for upholstery',
    media: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    timestamp: '2024-12-30T16:45:00',
    uploadedBy: { name: 'Deepak Verma', role: 'Carpenter', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
    location: 'Workshop',
    phase: 'Furniture Installation',
    likes: 12,
    comments: 6,
  },
  {
    id: 4,
    type: 'image',
    title: 'Electrical Conduit Installation',
    description: 'Hidden conduits for ambient lighting installed',
    media: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
    timestamp: '2024-12-25T10:00:00',
    uploadedBy: { name: 'Amit Kumar', role: 'Site Engineer', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
    location: 'Living Room - Ceiling',
    phase: 'Electrical & Plumbing',
    likes: 3,
    comments: 1,
  },
]

// Mock materials data
const mockMaterials = [
  {
    id: 1,
    name: 'Italian Marble - Statuario',
    category: 'Flooring',
    quantity: '450 sq.ft',
    vendor: 'Supreme Marble Co.',
    deliveryDate: '2024-12-20',
    status: 'delivered',
    qcStatus: 'approved',
    qcApprovedBy: 'Customer',
    qcApprovedAt: '2024-12-21T10:30:00',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    invoice: 'INV-2024-4521',
    amount: 225000,
    specifications: ['Premium Grade', '18mm Thickness', 'Polished Finish'],
  },
  {
    id: 2,
    name: 'Teak Wood Planks',
    category: 'Furniture',
    quantity: '200 cu.ft',
    vendor: 'Woodcraft Industries',
    deliveryDate: '2024-12-22',
    status: 'delivered',
    qcStatus: 'approved',
    qcApprovedBy: 'Customer',
    qcApprovedAt: '2024-12-23T14:00:00',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    invoice: 'INV-2024-5567',
    amount: 180000,
    specifications: ['Seasoned Wood', 'Grade A', 'Termite Treated'],
  },
  {
    id: 3,
    name: 'Premium Wall Paint - Asian Paints',
    category: 'Painting',
    quantity: '50 Liters',
    vendor: 'Premium Paints Ltd',
    deliveryDate: '2024-12-28',
    status: 'delivered',
    qcStatus: 'pending',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400',
    invoice: 'INV-2024-12456',
    amount: 35000,
    specifications: ['Royale Luxury Emulsion', 'Washable', 'Low VOC'],
  },
  {
    id: 4,
    name: 'LED Strip Lights',
    category: 'Electrical',
    quantity: '100 meters',
    vendor: 'LED World India',
    deliveryDate: '2025-01-05',
    status: 'in_transit',
    qcStatus: 'pending',
    image: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400',
    invoice: 'INV-2025-0012',
    amount: 28000,
    specifications: ['RGB + Warm White', 'Smart Control', 'Waterproof IP65'],
  },
]

// Mock QC Checklist
const mockQCChecklists = [
  {
    id: 1,
    phase: 'Flooring Installation',
    items: [
      { id: 1, item: 'Surface leveling verified', status: 'approved', approvedAt: '2024-12-28' },
      { id: 2, item: 'Marble alignment and pattern check', status: 'approved', approvedAt: '2024-12-29' },
      { id: 3, item: 'Grouting quality inspection', status: 'approved', approvedAt: '2024-12-30' },
      { id: 4, item: 'Final polish and cleaning', status: 'approved', approvedAt: '2025-01-02' },
    ],
    overallStatus: 'completed',
    signedOffBy: 'Customer',
    signedOffAt: '2025-01-02T16:00:00',
  },
  {
    id: 2,
    phase: 'Wall Treatment',
    items: [
      { id: 1, item: 'Wall surface preparation', status: 'approved', approvedAt: '2024-12-26' },
      { id: 2, item: 'Primer application', status: 'approved', approvedAt: '2024-12-27' },
      { id: 3, item: 'Texture finish quality', status: 'pending', approvedAt: null },
      { id: 4, item: 'Final paint coat inspection', status: 'pending', approvedAt: null },
    ],
    overallStatus: 'in_progress',
    signedOffBy: null,
    signedOffAt: null,
  },
  {
    id: 3,
    phase: 'Furniture Installation',
    items: [
      { id: 1, item: 'Wood quality verification', status: 'approved', approvedAt: '2024-12-23' },
      { id: 2, item: 'Joinery and finish inspection', status: 'pending', approvedAt: null },
      { id: 3, item: 'Upholstery fabric approval', status: 'pending', approvedAt: null },
      { id: 4, item: 'Final assembly check', status: 'pending', approvedAt: null },
    ],
    overallStatus: 'in_progress',
    signedOffBy: null,
    signedOffAt: null,
  },
]

const ProjectLifecycle = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [project, setProject] = useState(mockProject)
  const [team, setTeam] = useState(mockTeam)
  const [updates, setUpdates] = useState(mockUpdates)
  const [materials, setMaterials] = useState(mockMaterials)
  const [qcChecklists, setQCChecklists] = useState(mockQCChecklists)
  const [selectedMember, setSelectedMember] = useState(null)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [showQCModal, setShowQCModal] = useState(null)
  const [showMaterialQC, setShowMaterialQC] = useState(null)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'timeline', label: 'Updates', icon: Clock },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'qc', label: 'QC', icon: ClipboardCheck },
  ]

  const cardStyle = {
    background: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
      case 'approved':
        return COLORS.success
      case 'in_progress':
      case 'in_transit':
      case 'pending':
        return COLORS.warning
      case 'rejected':
        return COLORS.error
      default:
        return COLORS.textMuted
    }
  }

  const handleApproveQCItem = (checklistId, itemId) => {
    setQCChecklists(prev => prev.map(cl => {
      if (cl.id === checklistId) {
        return {
          ...cl,
          items: cl.items.map(item =>
            item.id === itemId
              ? { ...item, status: 'approved', approvedAt: new Date().toISOString().split('T')[0] }
              : item
          )
        }
      }
      return cl
    }))
  }

  const handleSignOffChecklist = (checklistId) => {
    setQCChecklists(prev => prev.map(cl => {
      if (cl.id === checklistId) {
        return {
          ...cl,
          overallStatus: 'completed',
          signedOffBy: 'Customer',
          signedOffAt: new Date().toISOString()
        }
      }
      return cl
    }))
    setShowQCModal(null)
  }

  const handleApproveMaterial = (materialId) => {
    setMaterials(prev => prev.map(m =>
      m.id === materialId
        ? { ...m, qcStatus: 'approved', qcApprovedBy: 'Customer', qcApprovedAt: new Date().toISOString() }
        : m
    ))
    setShowMaterialQC(null)
  }

  // Overview Tab
  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Progress Card */}
      <div style={{ ...cardStyle, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ color: COLORS.textPrimary, fontSize: '16px', fontWeight: '600', margin: 0 }}>
              Overall Progress
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
              {project.currentPhase}
            </p>
          </div>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `conic-gradient(${COLORS.accent} ${project.progress * 3.6}deg, ${COLORS.border} 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: COLORS.card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: COLORS.accent, fontSize: '14px', fontWeight: '700' }}>
                {project.progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Phases */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {project.phases.map((phase, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: phase.status === 'completed' ? COLORS.success :
                           phase.status === 'in_progress' ? COLORS.warning : COLORS.border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {phase.status === 'completed' ? (
                  <CheckCircle style={{ width: '14px', height: '14px', color: COLORS.dark }} />
                ) : phase.status === 'in_progress' ? (
                  <Loader style={{ width: '14px', height: '14px', color: COLORS.dark }} />
                ) : (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.textMuted }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  color: phase.status === 'pending' ? COLORS.textMuted : COLORS.textPrimary,
                  fontSize: '13px',
                  fontWeight: '500',
                  margin: 0
                }}>
                  {phase.name}
                </p>
              </div>
              {phase.status !== 'pending' && (
                <span style={{
                  color: phase.status === 'completed' ? COLORS.success : COLORS.warning,
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {phase.progress}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Project Info */}
      <div style={{ ...cardStyle, padding: '20px' }}>
        <h3 style={{ color: COLORS.textPrimary, fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
          Project Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MapPin style={{ width: '18px', height: '18px', color: COLORS.accent }} />
            <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>{project.location}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar style={{ width: '18px', height: '18px', color: COLORS.accent }} />
            <span style={{ color: COLORS.textSecondary, fontSize: '14px' }}>
              {formatDate(project.startDate)} - {formatDate(project.expectedEnd)}
            </span>
          </div>
          <div style={{
            padding: '14px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <div>
              <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>Budget</p>
              <p style={{ color: COLORS.textPrimary, fontSize: '16px', fontWeight: '600', margin: 0 }}>
                ₹{(project.budget / 100000).toFixed(1)}L
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '0 0 4px 0' }}>Spent</p>
              <p style={{ color: COLORS.warning, fontSize: '16px', fontWeight: '600', margin: 0 }}>
                ₹{(project.spent / 100000).toFixed(1)}L
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        <button
          onClick={() => setActiveTab('team')}
          style={{
            ...cardStyle,
            padding: '16px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `${COLORS.info}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Users style={{ width: '22px', height: '22px', color: COLORS.info }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '600', margin: 0 }}>
              View Team
            </p>
            <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '2px 0 0 0' }}>
              {team.length} members
            </p>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('qc')}
          style={{
            ...cardStyle,
            padding: '16px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: `${COLORS.success}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ClipboardCheck style={{ width: '22px', height: '22px', color: COLORS.success }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '600', margin: 0 }}>
              QC Sign-off
            </p>
            <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '2px 0 0 0' }}>
              {qcChecklists.filter(c => c.overallStatus === 'in_progress').length} pending
            </p>
          </div>
        </button>
      </div>
    </div>
  )

  // Team Tab
  const renderTeam = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {team.map((member) => (
        <div
          key={member.id}
          style={cardStyle}
          onClick={() => setSelectedMember(member)}
        >
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={member.avatar}
                  alt={member.name}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    objectFit: 'cover',
                  }}
                />
                {member.isLead && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: COLORS.accent,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${COLORS.card}`,
                  }}>
                    <Star style={{ width: '12px', height: '12px', color: COLORS.dark, fill: COLORS.dark }} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ color: COLORS.textPrimary, fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      {member.name}
                    </h3>
                    <p style={{ color: COLORS.accent, fontSize: '13px', margin: '2px 0 0 0' }}>
                      {member.role}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star style={{ width: '12px', height: '12px', color: COLORS.warning, fill: COLORS.warning }} />
                    <span style={{ color: COLORS.textPrimary, fontSize: '13px', fontWeight: '600' }}>
                      {member.rating}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Briefcase style={{ width: '12px', height: '12px', color: COLORS.textMuted }} />
                    <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>
                      {member.experience} yrs
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award style={{ width: '12px', height: '12px', color: COLORS.textMuted }} />
                    <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>
                      {member.projectsCompleted} projects
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Specializations */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
              {member.specialization.map((spec, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '20px',
                    color: COLORS.textSecondary,
                    fontSize: '11px',
                  }}
                >
                  {spec}
                </span>
              ))}
            </div>

            {/* Contact Button */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <a
                href={`tel:${member.phone}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: `${COLORS.success}15`,
                  border: 'none',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                }}
              >
                <Phone style={{ width: '16px', height: '16px', color: COLORS.success }} />
                <span style={{ color: COLORS.success, fontSize: '13px', fontWeight: '500' }}>Call</span>
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedMember(member)
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: `${COLORS.accent}15`,
                  border: 'none',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Eye style={{ width: '16px', height: '16px', color: COLORS.accent }} />
                <span style={{ color: COLORS.accent, fontSize: '13px', fontWeight: '500' }}>Portfolio</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Timeline/Updates Tab
  const renderTimeline = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {updates.map((update) => (
        <div key={update.id} style={cardStyle}>
          {/* Media */}
          <div
            onClick={() => setSelectedMedia(update)}
            style={{
              height: '200px',
              background: `url(${update.media}) center/cover`,
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            {update.type === 'video' && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Play style={{ width: '24px', height: '24px', color: COLORS.textPrimary, marginLeft: '4px' }} />
              </div>
            )}
            {/* Timestamp Badge */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              padding: '6px 10px',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Clock style={{ width: '12px', height: '12px', color: COLORS.textSecondary }} />
              <span style={{ color: COLORS.textPrimary, fontSize: '11px' }}>
                {formatDate(update.timestamp)} • {formatTime(update.timestamp)}
              </span>
            </div>
            {/* Media Type Badge */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              padding: '6px 10px',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
            }}>
              {update.type === 'video' ? (
                <Video style={{ width: '14px', height: '14px', color: COLORS.textPrimary }} />
              ) : (
                <ImageIcon style={{ width: '14px', height: '14px', color: COLORS.textPrimary }} />
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '16px' }}>
            {/* Uploader Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <img
                src={update.uploadedBy.avatar}
                alt={update.uploadedBy.name}
                style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }}
              />
              <div>
                <p style={{ color: COLORS.textPrimary, fontSize: '13px', fontWeight: '500', margin: 0 }}>
                  {update.uploadedBy.name}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '2px 0 0 0' }}>
                  {update.uploadedBy.role}
                </p>
              </div>
            </div>

            <h3 style={{ color: COLORS.textPrimary, fontSize: '15px', fontWeight: '600', margin: '0 0 6px 0' }}>
              {update.title}
            </h3>
            <p style={{ color: COLORS.textSecondary, fontSize: '13px', margin: '0 0 12px 0', lineHeight: '1.5' }}>
              {update.description}
            </p>

            {/* Location & Phase */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              <span style={{
                padding: '4px 10px',
                background: `${COLORS.info}15`,
                borderRadius: '6px',
                color: COLORS.info,
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <MapPin style={{ width: '10px', height: '10px' }} />
                {update.location}
              </span>
              <span style={{
                padding: '4px 10px',
                background: `${COLORS.accent}15`,
                borderRadius: '6px',
                color: COLORS.accent,
                fontSize: '11px',
              }}>
                {update.phase}
              </span>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: `1px solid ${COLORS.border}`,
            }}>
              <button style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}>
                <ThumbsUp style={{ width: '16px', height: '16px', color: COLORS.textMuted }} />
                <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>{update.likes}</span>
              </button>
              <button style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}>
                <MessageCircle style={{ width: '16px', height: '16px', color: COLORS.textMuted }} />
                <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>{update.comments}</span>
              </button>
              <button style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}>
                <Share2 style={{ width: '16px', height: '16px', color: COLORS.textMuted }} />
              </button>
              <button style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}>
                <Download style={{ width: '16px', height: '16px', color: COLORS.textMuted }} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  // Materials Tab
  const renderMaterials = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {materials.map((material) => (
        <div key={material.id} style={cardStyle}>
          <div style={{ display: 'flex' }}>
            <img
              src={material.image}
              alt={material.name}
              style={{ width: '100px', height: '120px', objectFit: 'cover' }}
            />
            <div style={{ flex: 1, padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '600', margin: 0 }}>
                    {material.name}
                  </h3>
                  <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '2px 0 0 0' }}>
                    {material.category} • {material.quantity}
                  </p>
                </div>
                <span style={{
                  padding: '4px 8px',
                  background: `${getStatusColor(material.status)}15`,
                  borderRadius: '6px',
                  color: getStatusColor(material.status),
                  fontSize: '10px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}>
                  {material.status.replace('_', ' ')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <Truck style={{ width: '12px', height: '12px', color: COLORS.textMuted }} />
                <span style={{ color: COLORS.textSecondary, fontSize: '11px' }}>
                  {material.vendor}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ color: COLORS.accent, fontSize: '14px', fontWeight: '600' }}>
                  ₹{(material.amount / 1000).toFixed(0)}K
                </span>
                {material.qcStatus === 'approved' ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    background: `${COLORS.success}15`,
                    borderRadius: '6px',
                  }}>
                    <CheckCircle style={{ width: '12px', height: '12px', color: COLORS.success }} />
                    <span style={{ color: COLORS.success, fontSize: '11px', fontWeight: '500' }}>QC Approved</span>
                  </div>
                ) : material.status === 'delivered' ? (
                  <button
                    onClick={() => setShowMaterialQC(material)}
                    style={{
                      padding: '6px 12px',
                      background: COLORS.accent,
                      border: 'none',
                      borderRadius: '6px',
                      color: COLORS.dark,
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Approve QC
                  </button>
                ) : (
                  <span style={{ color: COLORS.textMuted, fontSize: '11px' }}>QC Pending</span>
                )}
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div style={{
            padding: '12px 14px',
            background: 'rgba(255,255,255,0.02)',
            borderTop: `1px solid ${COLORS.border}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
          }}>
            {material.specifications.map((spec, idx) => (
              <span
                key={idx}
                style={{
                  padding: '4px 8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  color: COLORS.textSecondary,
                  fontSize: '10px',
                }}
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // QC Tab
  const renderQC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {qcChecklists.map((checklist) => (
        <div key={checklist.id} style={cardStyle}>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ color: COLORS.textPrimary, fontSize: '15px', fontWeight: '600', margin: 0 }}>
                  {checklist.phase}
                </h3>
                <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '4px 0 0 0' }}>
                  {checklist.items.filter(i => i.status === 'approved').length}/{checklist.items.length} items checked
                </p>
              </div>
              <span style={{
                padding: '6px 12px',
                background: `${getStatusColor(checklist.overallStatus)}15`,
                borderRadius: '8px',
                color: getStatusColor(checklist.overallStatus),
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'capitalize',
              }}>
                {checklist.overallStatus.replace('_', ' ')}
              </span>
            </div>

            {/* Checklist Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {checklist.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '10px',
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: item.status === 'approved' ? COLORS.success : COLORS.border,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {item.status === 'approved' ? (
                      <Check style={{ width: '14px', height: '14px', color: COLORS.dark }} />
                    ) : (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS.textMuted }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      color: item.status === 'approved' ? COLORS.textSecondary : COLORS.textPrimary,
                      fontSize: '13px',
                      margin: 0,
                      textDecoration: item.status === 'approved' ? 'line-through' : 'none',
                    }}>
                      {item.item}
                    </p>
                    {item.approvedAt && (
                      <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '2px 0 0 0' }}>
                        Approved on {item.approvedAt}
                      </p>
                    )}
                  </div>
                  {item.status === 'pending' && (
                    <button
                      onClick={() => handleApproveQCItem(checklist.id, item.id)}
                      style={{
                        padding: '6px 12px',
                        background: `${COLORS.success}15`,
                        border: 'none',
                        borderRadius: '6px',
                        color: COLORS.success,
                        fontSize: '11px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Sign Off Section */}
            {checklist.signedOffBy ? (
              <div style={{
                marginTop: '16px',
                padding: '14px',
                background: `${COLORS.success}10`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: `${COLORS.success}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <PenTool style={{ width: '20px', height: '20px', color: COLORS.success }} />
                </div>
                <div>
                  <p style={{ color: COLORS.success, fontSize: '13px', fontWeight: '600', margin: 0 }}>
                    Signed off by {checklist.signedOffBy}
                  </p>
                  <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '2px 0 0 0' }}>
                    {formatDate(checklist.signedOffAt)} at {formatTime(checklist.signedOffAt)}
                  </p>
                </div>
              </div>
            ) : checklist.items.every(i => i.status === 'approved') ? (
              <button
                onClick={() => setShowQCModal(checklist)}
                style={{
                  width: '100%',
                  marginTop: '16px',
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
                <PenTool style={{ width: '18px', height: '18px' }} />
                Sign Off Checklist
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )

  // Member Detail Modal
  const renderMemberModal = () => {
    if (!selectedMember) return null
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 1000,
        overflowY: 'auto',
      }}>
        <div style={{ minHeight: '100%', padding: '20px', paddingTop: '60px' }}>
          {/* Close Button */}
          <button
            onClick={() => setSelectedMember(null)}
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: COLORS.card,
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1001,
            }}
          >
            <X style={{ width: '20px', height: '20px', color: COLORS.textPrimary }} />
          </button>

          {/* Profile Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img
              src={selectedMember.avatar}
              alt={selectedMember.name}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '24px',
                objectFit: 'cover',
                border: `3px solid ${COLORS.accent}`,
              }}
            />
            <h2 style={{ color: COLORS.textPrimary, fontSize: '22px', fontWeight: '700', margin: '16px 0 4px 0' }}>
              {selectedMember.name}
            </h2>
            <p style={{ color: COLORS.accent, fontSize: '15px', margin: 0 }}>
              {selectedMember.designation}
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <div style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
              <p style={{ color: COLORS.accent, fontSize: '24px', fontWeight: '700', margin: 0 }}>
                {selectedMember.experience}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '4px 0 0 0' }}>Years Exp</p>
            </div>
            <div style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
              <p style={{ color: COLORS.accent, fontSize: '24px', fontWeight: '700', margin: 0 }}>
                {selectedMember.projectsCompleted}
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '4px 0 0 0' }}>Projects</p>
            </div>
            <div style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Star style={{ width: '16px', height: '16px', color: COLORS.warning, fill: COLORS.warning }} />
                <span style={{ color: COLORS.accent, fontSize: '24px', fontWeight: '700' }}>
                  {selectedMember.rating}
                </span>
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: '4px 0 0 0' }}>Rating</p>
            </div>
          </div>

          {/* Specializations */}
          <div style={{ ...cardStyle, padding: '16px', marginBottom: '24px' }}>
            <h3 style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
              Specializations
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedMember.specialization.map((spec, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '8px 14px',
                    background: `${COLORS.accent}15`,
                    borderRadius: '20px',
                    color: COLORS.accent,
                    fontSize: '13px',
                  }}
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: COLORS.textPrimary, fontSize: '16px', fontWeight: '600', margin: '0 0 14px 0' }}>
              Portfolio
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {selectedMember.portfolio.map((item, idx) => (
                <div key={idx} style={{ ...cardStyle }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                  />
                  <p style={{
                    color: COLORS.textPrimary,
                    fontSize: '13px',
                    fontWeight: '500',
                    padding: '10px',
                    margin: 0,
                  }}>
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Button */}
          <a
            href={`tel:${selectedMember.phone}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '16px',
              background: COLORS.accent,
              border: 'none',
              borderRadius: '14px',
              color: COLORS.dark,
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            <Phone style={{ width: '20px', height: '20px' }} />
            Call {selectedMember.name.split(' ')[0]}
          </a>
        </div>
      </div>
    )
  }

  // QC Sign-off Modal
  const renderQCModal = () => {
    if (!showQCModal) return null
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{ ...cardStyle, width: '100%', maxWidth: '400px', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: `${COLORS.success}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}>
              <PenTool style={{ width: '28px', height: '28px', color: COLORS.success }} />
            </div>
            <h3 style={{ color: COLORS.textPrimary, fontSize: '18px', fontWeight: '600', margin: 0 }}>
              Sign Off Checklist
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: '8px 0 0 0' }}>
              {showQCModal.phase}
            </p>
          </div>

          <p style={{ color: COLORS.textSecondary, fontSize: '14px', textAlign: 'center', margin: '0 0 24px 0' }}>
            By signing off, you confirm that all {showQCModal.items.length} items have been inspected and approved.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowQCModal(null)}
              style={{
                flex: 1,
                padding: '14px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                color: COLORS.textSecondary,
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSignOffChecklist(showQCModal.id)}
              style={{
                flex: 1,
                padding: '14px',
                background: COLORS.success,
                border: 'none',
                borderRadius: '12px',
                color: COLORS.dark,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Confirm Sign-off
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Material QC Modal
  const renderMaterialQCModal = () => {
    if (!showMaterialQC) return null
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{ ...cardStyle, width: '100%', maxWidth: '400px', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img
              src={showMaterialQC.image}
              alt={showMaterialQC.name}
              style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }}
            />
            <h3 style={{ color: COLORS.textPrimary, fontSize: '16px', fontWeight: '600', margin: 0 }}>
              {showMaterialQC.name}
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
              {showMaterialQC.quantity} • {showMaterialQC.vendor}
            </p>
          </div>

          <div style={{
            padding: '14px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            marginBottom: '20px',
          }}>
            <p style={{ color: COLORS.textSecondary, fontSize: '13px', margin: '0 0 8px 0' }}>
              Specifications:
            </p>
            {showMaterialQC.specifications.map((spec, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <CheckCircle style={{ width: '12px', height: '12px', color: COLORS.success }} />
                <span style={{ color: COLORS.textPrimary, fontSize: '12px' }}>{spec}</span>
              </div>
            ))}
          </div>

          <p style={{ color: COLORS.textSecondary, fontSize: '13px', textAlign: 'center', margin: '0 0 20px 0' }}>
            Please verify that the delivered material matches the specifications above.
          </p>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowMaterialQC(null)}
              style={{
                flex: 1,
                padding: '14px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                color: COLORS.textSecondary,
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleApproveMaterial(showMaterialQC.id)}
              style={{
                flex: 1,
                padding: '14px',
                background: COLORS.success,
                border: 'none',
                borderRadius: '12px',
                color: COLORS.dark,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Approve Material
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '20px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: COLORS.card,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: '20px', height: '20px', color: COLORS.textPrimary }} />
        </button>
        <div>
          <h1 style={{ color: COLORS.textPrimary, fontSize: '20px', fontWeight: '700', margin: 0 }}>
            {project.name}
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '2px 0 0 0' }}>
            {project.id}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        margin: '0 -16px 20px -16px',
        padding: '0 16px',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px',
                background: isActive ? COLORS.accent : COLORS.card,
                border: 'none',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon style={{
                width: '16px',
                height: '16px',
                color: isActive ? COLORS.dark : COLORS.textMuted
              }} />
              <span style={{
                color: isActive ? COLORS.dark : COLORS.textSecondary,
                fontSize: '13px',
                fontWeight: isActive ? '600' : '500',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'team' && renderTeam()}
      {activeTab === 'timeline' && renderTimeline()}
      {activeTab === 'materials' && renderMaterials()}
      {activeTab === 'qc' && renderQC()}

      {/* Modals */}
      {renderMemberModal()}
      {renderQCModal()}
      {renderMaterialQCModal()}
    </div>
  )
}

export default ProjectLifecycle
