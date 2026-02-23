import { useState } from 'react'
import {
  Gift,
  Sparkles,
  Star,
  Trophy,
  Crown,
  Award,
  ChevronRight,
  History,
  ShoppingBag,
  Users,
  MessageSquare,
  Repeat,
  Zap,
  Target,
} from 'lucide-react'
import { useUser } from '../context/UserContext'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.08)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
}

const TIER_CONFIG = {
  bronze: { color: '#CD7F32', label: 'Bronze', minPoints: 0, icon: Award },
  silver: { color: '#C0C0C0', label: 'Silver', minPoints: 1000, icon: Star },
  gold: { color: '#FFD700', label: 'Gold', minPoints: 5000, icon: Trophy },
  platinum: { color: '#E5E4E2', label: 'Platinum', minPoints: 15000, icon: Crown },
}

const ACTIVITY_TYPES = {
  purchase: { color: COLORS.success, icon: ShoppingBag },
  referral: { color: COLORS.purple, icon: Users },
  review: { color: COLORS.warning, icon: MessageSquare },
  spin: { color: COLORS.info, icon: Repeat },
  bonus: { color: COLORS.pink, icon: Zap },
  redeemed: { color: COLORS.error, icon: Gift },
}

const mockHistory = [
  { id: 1, type: 'purchase', description: 'Living Room Furniture', points: 485, date: 'Today' },
  { id: 2, type: 'spin', description: 'Lucky Spin Winner!', points: 50, date: 'Yesterday' },
  { id: 3, type: 'referral', description: 'Referred Amit Kumar', points: 200, date: 'Jan 10' },
  { id: 4, type: 'redeemed', description: '₹500 Voucher', points: -500, date: 'Jan 5' },
]

const rewards = [
  { id: 1, name: '₹500 Voucher', points: 500, emoji: '🎫' },
  { id: 2, name: 'Free Consultation', points: 750, emoji: '📅' },
  { id: 3, name: '₹2000 Credit', points: 2000, emoji: '💳' },
  { id: 4, name: 'Premium Upgrade', points: 3000, emoji: '✨' },
]

const spinPrizes = [
  { value: 10, color: COLORS.info },
  { value: 25, color: COLORS.success },
  { value: 50, color: COLORS.warning },
  { value: 100, color: COLORS.purple },
  { value: 200, color: COLORS.pink },
  { value: 500, color: COLORS.error },
]

const MobileRewards = () => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState('rewards')
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

    const rand = Math.random()
    let prize = spinPrizes[0]
    const probabilities = [0.3, 0.25, 0.2, 0.15, 0.08, 0.02]
    let cumulative = 0
    for (let i = 0; i < spinPrizes.length; i++) {
      cumulative += probabilities[i]
      if (rand <= cumulative) {
        prize = spinPrizes[i]
        break
      }
    }

    setTimeout(() => {
      setIsSpinning(false)
      setSpinResult(prize.value)
      setCanSpin(false)
    }, 3000)
  }

  const cardStyle = {
    background: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  }

  return (
    <div>
      {/* Points & Tier Card */}
      <div style={{
        ...cardStyle,
        background: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.accentDark} 100%)`,
        padding: '24px 20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Sparkles style={{ width: '18px', height: '18px', color: COLORS.dark }} />
              <span style={{ color: COLORS.dark, fontSize: '13px', fontWeight: '500', opacity: 0.8 }}>
                Karma Points
              </span>
            </div>
            <p style={{ color: COLORS.dark, fontSize: '40px', fontWeight: '800', margin: 0 }}>
              {karmaPoints.toLocaleString()}
            </p>
          </div>
          <div style={{
            padding: '8px 14px',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <TierIcon style={{ width: '16px', height: '16px', color: tierConfig.color }} />
            <span style={{ color: COLORS.dark, fontSize: '13px', fontWeight: '600' }}>
              {tierConfig.label}
            </span>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: COLORS.dark, fontSize: '12px', opacity: 0.8 }}>
                {pointsToNextTier} pts to {nextTier[1].label}
              </span>
              <span style={{ color: COLORS.dark, fontSize: '12px', fontWeight: '600' }}>
                {Math.round(progressToNextTier)}%
              </span>
            </div>
            <div style={{
              height: '6px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progressToNextTier}%`,
                background: COLORS.dark,
                borderRadius: '3px',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Spin & Win Section */}
      <div style={{
        ...cardStyle,
        padding: '24px 20px',
        marginBottom: '20px',
        textAlign: 'center',
      }}>
        <h3 style={{ color: COLORS.textPrimary, fontSize: '18px', fontWeight: '600', margin: '0 0 20px 0' }}>
          Spin & Win Daily 🎰
        </h3>

        {/* Spin Wheel */}
        <div style={{
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: `conic-gradient(
            ${spinPrizes.map((p, i) => `${p.color} ${i * 60}deg ${(i + 1) * 60}deg`).join(', ')}
          )`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          animation: isSpinning ? 'spin 0.3s linear infinite' : 'none',
          position: 'relative',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: COLORS.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `4px solid ${COLORS.dark}`,
          }}>
            {spinResult ? (
              <div>
                <p style={{ color: COLORS.accent, fontSize: '24px', fontWeight: '800', margin: 0 }}>
                  +{spinResult}
                </p>
                <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: 0 }}>Points!</p>
              </div>
            ) : (
              <Sparkles style={{ width: '36px', height: '36px', color: COLORS.accent }} />
            )}
          </div>
          {/* Pointer */}
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '16px solid white',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          }} />
        </div>

        <button
          onClick={handleSpin}
          disabled={!canSpin || isSpinning}
          style={{
            width: '100%',
            padding: '14px',
            background: canSpin ? COLORS.accent : 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '12px',
            color: canSpin ? COLORS.dark : COLORS.textMuted,
            fontSize: '15px',
            fontWeight: '600',
            cursor: canSpin ? 'pointer' : 'not-allowed',
          }}
        >
          {isSpinning ? 'Spinning...' : canSpin ? 'Spin Now!' : 'Come Back Tomorrow'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
      }}>
        {[
          { id: 'rewards', label: 'Rewards', icon: Gift },
          { id: 'history', label: 'History', icon: History },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                background: activeTab === tab.id ? COLORS.accent : 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '12px',
                color: activeTab === tab.id ? COLORS.dark : COLORS.textPrimary,
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                cursor: 'pointer',
              }}
            >
              <Icon style={{ width: '18px', height: '18px' }} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Rewards Grid */}
      {activeTab === 'rewards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
        }}>
          {rewards.map((reward) => {
            const canRedeem = karmaPoints >= reward.points
            return (
              <div key={reward.id} style={cardStyle}>
                <div style={{
                  height: '80px',
                  background: `linear-gradient(135deg, ${COLORS.accent}20 0%, ${COLORS.accentDark}10 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                }}>
                  {reward.emoji}
                </div>
                <div style={{ padding: '14px' }}>
                  <h4 style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>
                    {reward.name}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles style={{ width: '14px', height: '14px', color: COLORS.accent }} />
                      <span style={{ color: COLORS.accent, fontSize: '14px', fontWeight: '700' }}>
                        {reward.points}
                      </span>
                    </div>
                    <button
                      disabled={!canRedeem}
                      style={{
                        padding: '6px 12px',
                        background: canRedeem ? COLORS.accent : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '6px',
                        color: canRedeem ? COLORS.dark : COLORS.textMuted,
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: canRedeem ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* History List */}
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
                  padding: '14px 16px',
                  borderBottom: index < mockHistory.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${typeConfig.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon style={{ width: '20px', height: '20px', color: typeConfig.color }} />
                  </div>
                  <div>
                    <p style={{ color: COLORS.textPrimary, fontSize: '14px', fontWeight: '500', margin: 0 }}>
                      {item.description}
                    </p>
                    <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: '2px 0 0 0' }}>
                      {item.date}
                    </p>
                  </div>
                </div>
                <span style={{
                  color: isPositive ? COLORS.success : COLORS.error,
                  fontSize: '15px',
                  fontWeight: '600',
                }}>
                  {isPositive ? '+' : ''}{item.points}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* How to Earn */}
      <div style={{
        ...cardStyle,
        padding: '20px',
        marginTop: '20px',
      }}>
        <h3 style={{ color: COLORS.textPrimary, fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0' }}>
          Ways to Earn
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { icon: ShoppingBag, label: 'Make Purchases', points: '1pt/₹100', color: COLORS.success },
            { icon: Users, label: 'Refer Friends', points: '+200 pts', color: COLORS.purple },
            { icon: MessageSquare, label: 'Write Reviews', points: '+25 pts', color: COLORS.warning },
            { icon: Repeat, label: 'Daily Spin', points: 'Up to 500', color: COLORS.info },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon style={{ width: '18px', height: '18px', color: item.color }} />
                  </div>
                  <span style={{ color: COLORS.textPrimary, fontSize: '14px' }}>{item.label}</span>
                </div>
                <span style={{ color: COLORS.accent, fontSize: '13px', fontWeight: '600' }}>
                  {item.points}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spin Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default MobileRewards
