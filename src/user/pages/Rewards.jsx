import { useState } from 'react'
import {
  Gift,
  Star,
  Trophy,
  Sparkles,
  History,
  ArrowRight,
  ChevronRight,
  Clock,
  ShoppingBag,
  Users,
  MessageSquare,
  Repeat,
  Award,
  Zap,
  Crown,
  Target,
} from 'lucide-react'
import { useUser } from '../context/UserContext'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  cardHover: '#222222',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textMuted: 'rgba(255,255,255,0.6)',
  border: 'rgba(255,255,255,0.1)',
}

const TIER_CONFIG = {
  bronze: { color: '#CD7F32', label: 'Bronze', minPoints: 0, icon: Award },
  silver: { color: '#C0C0C0', label: 'Silver', minPoints: 1000, icon: Star },
  gold: { color: '#FFD700', label: 'Gold', minPoints: 5000, icon: Trophy },
  platinum: { color: '#E5E4E2', label: 'Platinum', minPoints: 15000, icon: Crown },
}

const ACTIVITY_TYPES = {
  purchase: { color: '#10b981', icon: ShoppingBag, label: 'Purchase' },
  referral: { color: '#8b5cf6', icon: Users, label: 'Referral' },
  review: { color: '#f59e0b', icon: MessageSquare, label: 'Review' },
  spin: { color: '#3b82f6', icon: Repeat, label: 'Spin & Win' },
  bonus: { color: '#ec4899', icon: Zap, label: 'Bonus' },
  redeemed: { color: '#ef4444', icon: Gift, label: 'Redeemed' },
}

const mockHistory = [
  { id: 1, type: 'purchase', description: 'Living Room Furniture Order', points: 485, date: '2024-01-15' },
  { id: 2, type: 'spin', description: 'Lucky Spin Winner!', points: 50, date: '2024-01-14' },
  { id: 3, type: 'referral', description: 'Referred Amit Kumar', points: 200, date: '2024-01-10' },
  { id: 4, type: 'review', description: 'Reviewed Master Bedroom Design', points: 25, date: '2024-01-08' },
  { id: 5, type: 'redeemed', description: 'Redeemed ₹500 Voucher', points: -500, date: '2024-01-05' },
  { id: 6, type: 'purchase', description: 'Kitchen Accessories', points: 150, date: '2024-01-03' },
  { id: 7, type: 'bonus', description: 'New Year Bonus', points: 100, date: '2024-01-01' },
  { id: 8, type: 'spin', description: 'Spin & Win', points: 10, date: '2023-12-28' },
]

const rewards = [
  { id: 1, name: '₹500 Shopping Voucher', points: 500, category: 'Vouchers', image: '🎫' },
  { id: 2, name: 'Free Consultation Session', points: 750, category: 'Services', image: '📅' },
  { id: 3, name: '₹2000 Design Credit', points: 2000, category: 'Credits', image: '💳' },
  { id: 4, name: 'Premium Material Upgrade', points: 3000, category: 'Upgrades', image: '✨' },
  { id: 5, name: 'Free Home Styling Session', points: 5000, category: 'Services', image: '🏠' },
  { id: 6, name: 'Exclusive VIP Event Access', points: 7500, category: 'Experiences', image: '🎉' },
]

const spinPrizes = [
  { value: 10, probability: 0.3, color: '#3b82f6' },
  { value: 25, probability: 0.25, color: '#10b981' },
  { value: 50, probability: 0.2, color: '#f59e0b' },
  { value: 100, probability: 0.15, color: '#8b5cf6' },
  { value: 200, probability: 0.08, color: '#ec4899' },
  { value: 500, probability: 0.02, color: '#ef4444' },
]

const Rewards = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('overview')
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState(null)
  const [canSpin, setCanSpin] = useState(true)

  const karmaPoints = user?.karmaPoints || 1250
  const currentTier = Object.entries(TIER_CONFIG)
    .reverse()
    .find(([_, config]) => karmaPoints >= config.minPoints)?.[0] || 'bronze'
  const tierConfig = TIER_CONFIG[currentTier]
  const TierIcon = tierConfig.icon

  const nextTier = Object.entries(TIER_CONFIG).find(([_, config]) => config.minPoints > karmaPoints)
  const pointsToNextTier = nextTier ? nextTier[1].minPoints - karmaPoints : 0
  const progressToNextTier = nextTier
    ? ((karmaPoints - TIER_CONFIG[currentTier].minPoints) / (nextTier[1].minPoints - TIER_CONFIG[currentTier].minPoints)) * 100
    : 100

  const handleSpin = () => {
    if (!canSpin || isSpinning) return

    setIsSpinning(true)
    setSpinResult(null)

    // Simulate spin result based on probability
    const rand = Math.random()
    let cumulative = 0
    let prize = spinPrizes[0]
    for (const p of spinPrizes) {
      cumulative += p.probability
      if (rand <= cumulative) {
        prize = p
        break
      }
    }

    setTimeout(() => {
      setIsSpinning(false)
      setSpinResult(prize.value)
      setCanSpin(false)
    }, 3000)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
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
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: 0 }}>
          Rewards & Karma Points
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: '14px', marginTop: '8px' }}>
          Earn points, unlock rewards, and enjoy exclusive benefits
        </p>
      </div>

      {/* Points & Tier Card */}
      <div style={{
        ...cardStyle,
        background: `linear-gradient(135deg, ${COLORS.card} 0%, rgba(197, 156, 130, 0.1) 100%)`,
        padding: '32px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <TierIcon style={{ width: '28px', height: '28px', color: tierConfig.color }} />
              <span style={{
                padding: '6px 14px',
                background: `${tierConfig.color}20`,
                color: tierConfig.color,
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '20px',
              }}>
                {tierConfig.label} Member
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ color: COLORS.accent, fontSize: '48px', fontWeight: '700' }}>
                {karmaPoints.toLocaleString()}
              </span>
              <span style={{ color: COLORS.textMuted, fontSize: '16px' }}>Karma Points</span>
            </div>
            {nextTier && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                    {pointsToNextTier} points to {nextTier[1].label}
                  </span>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>
                    {Math.round(progressToNextTier)}%
                  </span>
                </div>
                <div style={{
                  width: '300px',
                  height: '8px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${progressToNextTier}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Spin & Win */}
          <div style={{
            textAlign: 'center',
            padding: '24px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(
                ${spinPrizes.map((p, i) => `${p.color} ${i * (360 / spinPrizes.length)}deg ${(i + 1) * (360 / spinPrizes.length)}deg`).join(', ')}
              )`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              animation: isSpinning ? 'spin 0.5s linear infinite' : 'none',
              position: 'relative',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: COLORS.card,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {spinResult ? (
                  <span style={{ color: COLORS.accent, fontSize: '20px', fontWeight: '700' }}>
                    +{spinResult}
                  </span>
                ) : (
                  <Sparkles style={{ width: '32px', height: '32px', color: COLORS.accent }} />
                )}
              </div>
              <div style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '12px solid white',
              }} />
            </div>
            <button
              onClick={handleSpin}
              disabled={!canSpin || isSpinning}
              style={{
                padding: '12px 28px',
                background: canSpin ? COLORS.accent : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '10px',
                color: canSpin ? COLORS.dark : COLORS.textMuted,
                fontSize: '14px',
                fontWeight: '600',
                cursor: canSpin ? 'pointer' : 'not-allowed',
              }}
            >
              {isSpinning ? 'Spinning...' : canSpin ? 'Spin & Win!' : 'Come Back Tomorrow'}
            </button>
            <p style={{ color: COLORS.textMuted, fontSize: '12px', marginTop: '8px' }}>
              1 free spin daily
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'redeem', label: 'Redeem Rewards', icon: Gift },
          { id: 'history', label: 'Points History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: activeTab === tab.id ? COLORS.accent : 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '10px',
                color: activeTab === tab.id ? COLORS.dark : 'white',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
              }}
            >
              <Icon style={{ width: '16px', height: '16px' }} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* How to Earn */}
          <div style={{ ...cardStyle, padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              Ways to Earn Karma Points
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { icon: ShoppingBag, label: 'Make Purchases', points: '1 point per ₹100', color: '#10b981' },
                { icon: Users, label: 'Refer Friends', points: '200 points per referral', color: '#8b5cf6' },
                { icon: MessageSquare, label: 'Write Reviews', points: '25 points each', color: '#f59e0b' },
                { icon: Repeat, label: 'Daily Spin', points: 'Up to 500 points', color: '#3b82f6' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div
                    key={i}
                    style={{
                      padding: '20px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `${item.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                    }}>
                      <Icon style={{ width: '24px', height: '24px', color: item.color }} />
                    </div>
                    <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>
                      {item.label}
                    </h3>
                    <p style={{ color: COLORS.accent, fontSize: '13px', margin: 0 }}>
                      {item.points}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tier Benefits */}
          <div style={{ ...cardStyle, padding: '24px' }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
              Membership Tiers
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {Object.entries(TIER_CONFIG).map(([key, config]) => {
                const Icon = config.icon
                const isCurrentTier = key === currentTier
                return (
                  <div
                    key={key}
                    style={{
                      padding: '20px',
                      background: isCurrentTier ? `${config.color}15` : 'rgba(255,255,255,0.03)',
                      border: isCurrentTier ? `2px solid ${config.color}` : `1px solid ${COLORS.border}`,
                      borderRadius: '12px',
                      position: 'relative',
                    }}
                  >
                    {isCurrentTier && (
                      <span style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '12px',
                        padding: '4px 10px',
                        background: config.color,
                        color: COLORS.dark,
                        fontSize: '10px',
                        fontWeight: '600',
                        borderRadius: '10px',
                      }}>
                        CURRENT
                      </span>
                    )}
                    <Icon style={{ width: '32px', height: '32px', color: config.color, marginBottom: '12px' }} />
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                      {config.label}
                    </h3>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>
                      {config.minPoints.toLocaleString()}+ points
                    </p>
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: `1px solid ${COLORS.border}`,
                    }}>
                      <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: 0 }}>
                        {key === 'bronze' && 'Basic rewards access'}
                        {key === 'silver' && '5% extra points on purchases'}
                        {key === 'gold' && '10% extra points + priority support'}
                        {key === 'platinum' && '15% extra points + exclusive events'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Redeem Tab */}
      {activeTab === 'redeem' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {rewards.map((reward) => {
            const canRedeem = karmaPoints >= reward.points
            return (
              <div key={reward.id} style={cardStyle}>
                <div style={{
                  height: '120px',
                  background: `linear-gradient(135deg, ${COLORS.accent}20 0%, ${COLORS.accentDark}10 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                }}>
                  {reward.image}
                </div>
                <div style={{ padding: '20px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    color: COLORS.textMuted,
                    fontSize: '11px',
                    marginBottom: '8px',
                  }}>
                    {reward.category}
                  </span>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 12px 0' }}>
                    {reward.name}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles style={{ width: '16px', height: '16px', color: COLORS.accent }} />
                      <span style={{ color: COLORS.accent, fontSize: '16px', fontWeight: '700' }}>
                        {reward.points.toLocaleString()}
                      </span>
                    </div>
                    <button
                      disabled={!canRedeem}
                      style={{
                        padding: '8px 16px',
                        background: canRedeem ? COLORS.accent : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        color: canRedeem ? COLORS.dark : COLORS.textMuted,
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: canRedeem ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {canRedeem ? 'Redeem' : 'Not enough points'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={cardStyle}>
          {mockHistory.map((item, index) => {
            const typeConfig = ACTIVITY_TYPES[item.type]
            const Icon = typeConfig.icon
            const isPositive = item.points > 0

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 24px',
                  borderBottom: index < mockHistory.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `${typeConfig.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon style={{ width: '22px', height: '22px', color: typeConfig.color }} />
                  </div>
                  <div>
                    <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                      {item.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{
                        padding: '2px 8px',
                        background: `${typeConfig.color}15`,
                        color: typeConfig.color,
                        fontSize: '11px',
                        fontWeight: '500',
                        borderRadius: '4px',
                      }}>
                        {typeConfig.label}
                      </span>
                      <span style={{ color: COLORS.textMuted, fontSize: '12px' }}>
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <span style={{
                  color: isPositive ? '#10b981' : '#ef4444',
                  fontSize: '16px',
                  fontWeight: '600',
                }}>
                  {isPositive ? '+' : ''}{item.points}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Spin Animation Keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Rewards
