import './SideElements.css'

// Decorative side elements for visual appeal
function SideElements() {
  return (
    <>
      {/* Left Side Decorations */}
      <div className="side-elements left">
        {/* Prize Badge */}
        <div className="prize-badge">
          <span className="badge-icon">🎁</span>
          <span className="badge-text">FREE<br/>PRIZE</span>
        </div>

        {/* Floating Stars */}
        <div className="floating-star star-1">✦</div>
        <div className="floating-star star-2">✧</div>
        <div className="floating-star star-3">★</div>

        {/* Vertical Text */}
        <div className="vertical-text">SPIN & WIN</div>
      </div>

      {/* Right Side Decorations */}
      <div className="side-elements right">
        {/* Winner Badge */}
        <div className="winner-badge">
          <span className="badge-icon">🏆</span>
          <span className="badge-text">BE A<br/>WINNER</span>
        </div>

        {/* Floating Stars */}
        <div className="floating-star star-4">✦</div>
        <div className="floating-star star-5">✧</div>
        <div className="floating-star star-6">★</div>

        {/* Vertical Text */}
        <div className="vertical-text">LUCKY DAY</div>
      </div>

      {/* Top Corner Sparkles */}
      <div className="corner-sparkle top-left">
        <span>✨</span>
        <span>💫</span>
      </div>
      <div className="corner-sparkle top-right">
        <span>💫</span>
        <span>✨</span>
      </div>

      {/* Pulse Dots */}
      <div className="pulse-dot dot-1"></div>
      <div className="pulse-dot dot-2"></div>
      <div className="pulse-dot dot-3"></div>
      <div className="pulse-dot dot-4"></div>
    </>
  )
}

export default SideElements
