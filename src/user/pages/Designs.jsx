import { useState } from 'react'
import {
  Palette,
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Download,
  Share2,
  Trash2,
  Eye,
  Calendar,
  Tag,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wand2,
  Clock,
  FolderOpen,
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

const CATEGORIES = [
  { id: 'all', label: 'All Designs' },
  { id: 'living', label: 'Living Room' },
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bathroom', label: 'Bathroom' },
  { id: 'office', label: 'Office' },
  { id: 'outdoor', label: 'Outdoor' },
]

const STYLE_TAGS = [
  'Modern', 'Contemporary', 'Minimalist', 'Traditional', 'Industrial',
  'Scandinavian', 'Bohemian', 'Rustic', 'Art Deco', 'Mid-Century'
]

const mockDesigns = [
  {
    id: 1,
    name: 'Modern Living Room Concept',
    category: 'living',
    style: 'Modern',
    createdAt: '2024-01-15',
    isFavorite: true,
    prompt: 'A spacious modern living room with large windows, minimalist furniture, and warm neutral tones',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
    colors: ['#E8DED4', '#8B7355', '#2C2C2C', '#FFFFFF'],
  },
  {
    id: 2,
    name: 'Cozy Bedroom Retreat',
    category: 'bedroom',
    style: 'Scandinavian',
    createdAt: '2024-01-14',
    isFavorite: true,
    prompt: 'A cozy Scandinavian bedroom with soft textiles, natural wood elements, and soft lighting',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
    colors: ['#F5F0EB', '#D4C4B5', '#6B5B4F', '#1A1A1A'],
  },
  {
    id: 3,
    name: 'Minimalist Kitchen Design',
    category: 'kitchen',
    style: 'Minimalist',
    createdAt: '2024-01-12',
    isFavorite: false,
    prompt: 'A sleek minimalist kitchen with handleless cabinets, marble countertops, and integrated appliances',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    colors: ['#FFFFFF', '#E0E0E0', '#333333', '#C59C82'],
  },
  {
    id: 4,
    name: 'Industrial Home Office',
    category: 'office',
    style: 'Industrial',
    createdAt: '2024-01-10',
    isFavorite: false,
    prompt: 'An industrial-style home office with exposed brick, metal accents, and vintage furniture',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    colors: ['#8B4513', '#4A4A4A', '#D4A574', '#1A1A1A'],
  },
  {
    id: 5,
    name: 'Luxury Master Bath',
    category: 'bathroom',
    style: 'Contemporary',
    createdAt: '2024-01-08',
    isFavorite: true,
    prompt: 'A luxurious contemporary bathroom with freestanding tub, marble tiles, and gold fixtures',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
    colors: ['#E8E2DC', '#D4AF37', '#2C2C2C', '#FFFFFF'],
  },
  {
    id: 6,
    name: 'Bohemian Reading Nook',
    category: 'living',
    style: 'Bohemian',
    createdAt: '2024-01-05',
    isFavorite: false,
    prompt: 'A cozy bohemian reading nook with layered textiles, plants, and warm lighting',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
    colors: ['#C19A6B', '#8B4513', '#228B22', '#F5DEB3'],
  },
  {
    id: 7,
    name: 'Outdoor Patio Design',
    category: 'outdoor',
    style: 'Modern',
    createdAt: '2024-01-03',
    isFavorite: false,
    prompt: 'A modern outdoor patio with comfortable seating, fire pit, and ambient lighting',
    image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800',
    colors: ['#4A5D23', '#8B7355', '#333333', '#F5F5F5'],
  },
  {
    id: 8,
    name: 'Kids Bedroom Fun',
    category: 'bedroom',
    style: 'Contemporary',
    createdAt: '2024-01-01',
    isFavorite: false,
    prompt: 'A playful kids bedroom with colorful accents, creative storage, and fun wall decor',
    image: 'https://images.unsplash.com/photo-1617104678098-de229db51175?w=800',
    colors: ['#FFB6C1', '#87CEEB', '#98FB98', '#FFFFFF'],
  },
]

const Designs = () => {
  const [designs, setDesigns] = useState(mockDesigns)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedDesign, setSelectedDesign] = useState(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         design.style.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || design.category === selectedCategory
    const matchesFavorite = !showFavoritesOnly || design.isFavorite
    return matchesSearch && matchesCategory && matchesFavorite
  })

  const toggleFavorite = (id) => {
    setDesigns(designs.map(d =>
      d.id === id ? { ...d, isFavorite: !d.isFavorite } : d
    ))
  }

  const deleteDesign = (id) => {
    setDesigns(designs.filter(d => d.id !== id))
    if (selectedDesign?.id === id) {
      setSelectedDesign(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
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
            Saved Designs
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: '14px', marginTop: '8px' }}>
            Your AI-generated design inspirations and concepts
          </p>
        </div>
        <button
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
          <Wand2 style={{ width: '18px', height: '18px' }} />
          Create New Design
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {[
          { label: 'Total Designs', value: designs.length, icon: Palette, color: '#8b5cf6' },
          { label: 'Favorites', value: designs.filter(d => d.isFavorite).length, icon: Heart, color: '#ef4444' },
          { label: 'This Month', value: 6, icon: Calendar, color: '#10b981' },
          { label: 'AI Credits Left', value: 25, icon: Sparkles, color: COLORS.accent },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
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
                <Icon style={{ width: '24px', height: '24px', color: stat.color }} />
              </div>
              <div>
                <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: 0 }}>{stat.label}</p>
                <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '18px',
            height: '18px',
            color: COLORS.textMuted,
          }} />
          <input
            type="text"
            placeholder="Search designs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '10px 16px',
                background: selectedCategory === cat.id ? COLORS.accent : 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '10px',
                color: selectedCategory === cat.id ? COLORS.dark : 'white',
                fontSize: '13px',
                fontWeight: selectedCategory === cat.id ? '600' : '400',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: showFavoritesOnly ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
            border: showFavoritesOnly ? '1px solid rgba(239, 68, 68, 0.3)' : `1px solid ${COLORS.border}`,
            borderRadius: '10px',
            color: showFavoritesOnly ? '#ef4444' : 'white',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <Heart style={{ width: '16px', height: '16px', fill: showFavoritesOnly ? '#ef4444' : 'transparent' }} />
          Favorites
        </button>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '10px',
              background: viewMode === 'grid' ? COLORS.accent : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '10px 0 0 10px',
              color: viewMode === 'grid' ? COLORS.dark : 'white',
              cursor: 'pointer',
            }}
          >
            <Grid style={{ width: '18px', height: '18px' }} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '10px',
              background: viewMode === 'list' ? COLORS.accent : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '0 10px 10px 0',
              color: viewMode === 'list' ? COLORS.dark : 'white',
              cursor: 'pointer',
            }}
          >
            <List style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </div>

      {/* Designs Grid/List */}
      {filteredDesigns.length > 0 ? (
        <div style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(3, 1fr)' : undefined,
          flexDirection: viewMode === 'list' ? 'column' : undefined,
          gap: '20px',
        }}>
          {filteredDesigns.map((design) => (
            viewMode === 'grid' ? (
              // Grid Card
              <div
                key={design.id}
                style={{
                  ...cardStyle,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onClick={() => setSelectedDesign(design)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  position: 'relative',
                  height: '200px',
                  background: `url(${design.image}) center/cover`,
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(design.id)
                    }}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.5)',
                      border: 'none',
                      borderRadius: '8px',
                      color: design.isFavorite ? '#ef4444' : 'white',
                      cursor: 'pointer',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Heart style={{
                      width: '18px',
                      height: '18px',
                      fill: design.isFavorite ? '#ef4444' : 'transparent',
                    }} />
                  </button>
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    display: 'flex',
                    gap: '6px',
                  }}>
                    {design.colors.map((color, i) => (
                      <div
                        key={i}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: color,
                          border: '2px solid rgba(255,255,255,0.3)',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: 0 }}>
                      {design.name}
                    </h3>
                    <span style={{
                      padding: '4px 8px',
                      background: `${COLORS.accent}15`,
                      color: COLORS.accent,
                      fontSize: '11px',
                      fontWeight: '500',
                      borderRadius: '4px',
                    }}>
                      {design.style}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock style={{ width: '12px', height: '12px', color: COLORS.textMuted }} />
                    <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>
                      {formatDate(design.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // List Card
              <div
                key={design.id}
                style={{
                  ...cardStyle,
                  display: 'flex',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedDesign(design)}
              >
                <div style={{
                  width: '200px',
                  background: `url(${design.image}) center/cover`,
                }} />
                <div style={{ flex: 1, padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                        {design.name}
                      </h3>
                      <span style={{
                        padding: '4px 10px',
                        background: `${COLORS.accent}15`,
                        color: COLORS.accent,
                        fontSize: '12px',
                        fontWeight: '500',
                        borderRadius: '6px',
                      }}>
                        {design.style}
                      </span>
                    </div>
                    <p style={{ color: COLORS.textMuted, fontSize: '13px', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                      {design.prompt}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FolderOpen style={{ width: '14px', height: '14px', color: COLORS.textMuted }} />
                        <span style={{ color: COLORS.textMuted, fontSize: '12px', textTransform: 'capitalize' }}>
                          {design.category}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock style={{ width: '14px', height: '14px', color: COLORS.textMuted }} />
                        <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>
                          {formatDate(design.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(design.id)
                      }}
                      style={{
                        padding: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '8px',
                        color: design.isFavorite ? '#ef4444' : 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <Heart style={{
                        width: '18px',
                        height: '18px',
                        fill: design.isFavorite ? '#ef4444' : 'transparent',
                      }} />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      <Download style={{ width: '18px', height: '18px' }} />
                    </button>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div style={{
          ...cardStyle,
          padding: '60px',
          textAlign: 'center',
        }}>
          <Palette style={{ width: '48px', height: '48px', color: COLORS.textMuted, margin: '0 auto 16px' }} />
          <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
            No designs found
          </h3>
          <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: '0 0 24px 0' }}>
            {searchQuery || selectedCategory !== 'all' || showFavoritesOnly
              ? 'Try adjusting your search or filters'
              : 'Start creating AI-powered design concepts'}
          </p>
          <button
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
            <Wand2 style={{ width: '18px', height: '18px' }} />
            Create Your First Design
          </button>
        </div>
      )}

      {/* Design Detail Modal */}
      {selectedDesign && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '40px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            background: COLORS.card,
            borderRadius: '20px',
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
            display: 'flex',
          }}>
            {/* Image */}
            <div style={{
              flex: 1,
              background: `url(${selectedDesign.image}) center/cover`,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                display: 'flex',
                gap: '8px',
              }}>
                {selectedDesign.colors.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: color,
                      border: '2px solid rgba(255,255,255,0.3)',
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Details */}
            <div style={{ width: '380px', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                padding: '24px',
                borderBottom: `1px solid ${COLORS.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div>
                  <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
                    {selectedDesign.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: `${COLORS.accent}15`,
                      color: COLORS.accent,
                      fontSize: '12px',
                      fontWeight: '500',
                      borderRadius: '6px',
                    }}>
                      {selectedDesign.style}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      background: 'rgba(255,255,255,0.05)',
                      color: COLORS.textMuted,
                      fontSize: '12px',
                      borderRadius: '6px',
                      textTransform: 'capitalize',
                    }}>
                      {selectedDesign.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDesign(null)}
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

              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase' }}>
                    AI Prompt Used
                  </h3>
                  <p style={{ color: 'white', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                    "{selectedDesign.prompt}"
                  </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Color Palette
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {selectedDesign.colors.map((color, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          background: color,
                          border: `1px solid ${COLORS.border}`,
                          marginBottom: '4px',
                        }} />
                        <span style={{ color: COLORS.textMuted, fontSize: '10px' }}>{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ color: COLORS.textMuted, fontSize: '12px', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Created
                  </h3>
                  <p style={{ color: 'white', fontSize: '14px', margin: 0 }}>
                    {formatDate(selectedDesign.createdAt)}
                  </p>
                </div>
              </div>

              <div style={{
                padding: '20px 24px',
                borderTop: `1px solid ${COLORS.border}`,
                display: 'flex',
                gap: '12px',
              }}>
                <button
                  onClick={() => toggleFavorite(selectedDesign.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: selectedDesign.isFavorite ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                    border: selectedDesign.isFavorite ? '1px solid rgba(239, 68, 68, 0.3)' : `1px solid ${COLORS.border}`,
                    borderRadius: '10px',
                    color: selectedDesign.isFavorite ? '#ef4444' : 'white',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <Heart style={{ width: '16px', height: '16px', fill: selectedDesign.isFavorite ? '#ef4444' : 'transparent' }} />
                  {selectedDesign.isFavorite ? 'Favorited' : 'Favorite'}
                </button>
                <button
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: COLORS.accent,
                    border: 'none',
                    borderRadius: '10px',
                    color: COLORS.dark,
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <Download style={{ width: '16px', height: '16px' }} />
                  Download
                </button>
                <button
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  <Share2 style={{ width: '16px', height: '16px' }} />
                </button>
                <button
                  onClick={() => deleteDesign(selectedDesign.id)}
                  style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '10px',
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Designs
