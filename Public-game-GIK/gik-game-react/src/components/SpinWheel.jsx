import './SpinWheel.css'

// Three-segment wheel configuration
// Visual display: FREE WIN (45%), TRY AGAIN (35%), JUST MISS (20%)
// Note: Actual win rate is controlled by GameScreen logic (90% overall win rate)
const SEGMENTS = [
  {
    text: 'FREE WIN',
    isWin: true,
    colorStart: '#FFD700',   // Gold gradient start
    colorEnd: '#FFA500',     // Gold gradient end
    textColor: '#1a1a1a'
  },
  {
    text: 'TRY AGAIN',
    isWin: false,
    colorStart: '#FF69B4',   // Pink gradient start
    colorEnd: '#FF1493',     // Pink gradient end
    textColor: '#1a1a1a'
  },
  {
    text: 'JUST MISS',
    isWin: false,
    colorStart: '#9B59B6',   // Purple gradient start
    colorEnd: '#6B2D8B',     // Purple gradient end
    textColor: '#ffffff'
  }
]

function SpinWheel({ rotation, isSpinning = false }) {
  const numSegments = SEGMENTS.length
  const segmentAngle = 360 / numSegments
  const cx = 150
  const cy = 150
  const outerRadius = 140
  const innerRadius = 42 // Where center logo sits

  const createSegmentPath = (index) => {
    const startAngle = index * segmentAngle - 90
    const endAngle = startAngle + segmentAngle
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180

    const x1 = cx + outerRadius * Math.cos(startRad)
    const y1 = cy + outerRadius * Math.sin(startRad)
    const x2 = cx + outerRadius * Math.cos(endRad)
    const y2 = cy + outerRadius * Math.sin(endRad)

    return `M ${cx} ${cy} L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} Z`
  }

  const getTextPosition = (index) => {
    const angleDeg = index * segmentAngle + segmentAngle / 2 - 90
    const angleRad = (angleDeg * Math.PI) / 180
    const textRadius = 95

    return {
      x: cx + textRadius * Math.cos(angleRad),
      y: cy + textRadius * Math.sin(angleRad),
      rotation: angleDeg + 90
    }
  }

  // Generate edge pins/pegs around the wheel
  const generatePins = () => {
    const pins = []
    const pinCount = 24
    const pinRadius = 138

    for (let i = 0; i < pinCount; i++) {
      const angle = (i * 360 / pinCount - 90) * Math.PI / 180
      const x = cx + pinRadius * Math.cos(angle)
      const y = cy + pinRadius * Math.sin(angle)
      pins.push({ x, y, key: i })
    }
    return pins
  }

  const pins = generatePins()

  return (
    <div className="spin-wheel-wrapper">
      <div className="wheel-pointer"></div>
      <div className="wheel-border">
        <svg
          className="spin-wheel-svg"
          viewBox="0 0 300 300"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Gradient definitions */}
          <defs>
            {SEGMENTS.map((segment, index) => (
              <radialGradient
                key={`grad-${index}`}
                id={`segment-gradient-${index}`}
                cx="50%"
                cy="50%"
                r="70%"
              >
                <stop offset="0%" stopColor={segment.colorStart} />
                <stop offset="100%" stopColor={segment.colorEnd} />
              </radialGradient>
            ))}

            {/* Inner shadow filter for depth */}
            <filter id="segment-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/>
            </filter>

            {/* Outer glow for wheel */}
            <filter id="wheel-glow">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Bulb glow filter for pins */}
            <filter id="bulb-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="glow"/>
              <feMerge>
                <feMergeNode in="glow"/>
                <feMergeNode in="glow"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Outer ring for depth */}
          <circle
            cx={cx}
            cy={cy}
            r={outerRadius + 2}
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="4"
          />

          {/* Draw segments with gradients */}
          {SEGMENTS.map((segment, index) => (
            <path
              key={`segment-${index}`}
              d={createSegmentPath(index)}
              fill={`url(#segment-gradient-${index})`}
              stroke="#1a1a1a"
              strokeWidth="2"
              filter="url(#segment-shadow)"
            />
          ))}

          {/* Segment divider lines (spokes) */}
          {SEGMENTS.map((_, index) => {
            const angle = (index * segmentAngle - 90) * Math.PI / 180
            const x2 = cx + outerRadius * Math.cos(angle)
            const y2 = cy + outerRadius * Math.sin(angle)
            return (
              <line
                key={`spoke-${index}`}
                x1={cx}
                y1={cy}
                x2={x2}
                y2={y2}
                stroke="#333"
                strokeWidth="3"
              />
            )
          })}

          {/* Edge pins/pegs - glow like bulbs when spinning */}
          {pins.map(pin => (
            <g key={pin.key} className={isSpinning ? 'pin-glowing' : ''}>
              {/* Outer glow ring when spinning */}
              {isSpinning && (
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r="8"
                  fill="none"
                  className="pin-glow-ring"
                  style={{ animationDelay: `${pin.key * 0.05}s` }}
                />
              )}
              {/* Main bulb */}
              <circle
                cx={pin.x}
                cy={pin.y}
                r="5"
                className={`pin-bulb ${isSpinning ? 'glowing' : ''}`}
                style={{ animationDelay: `${pin.key * 0.05}s` }}
              />
              {/* Highlight */}
              <circle
                cx={pin.x - 1}
                cy={pin.y - 1}
                r="1.5"
                fill="rgba(255,255,255,0.8)"
              />
            </g>
          ))}

          {/* Draw text labels with shadow */}
          {SEGMENTS.map((segment, index) => {
            const pos = getTextPosition(index)
            return (
              <g key={`text-group-${index}`}>
                {/* Text shadow */}
                <text
                  x={pos.x + 1}
                  y={pos.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${pos.rotation}, ${pos.x + 1}, ${pos.y + 1})`}
                  fill="rgba(0,0,0,0.4)"
                  style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    fontFamily: 'Arial Black, sans-serif',
                    letterSpacing: '1px'
                  }}
                >
                  {segment.text}
                </text>
                {/* Main text */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${pos.rotation}, ${pos.x}, ${pos.y})`}
                  fill={segment.textColor}
                  stroke={segment.textColor === '#ffffff' ? 'rgba(0,0,0,0.3)' : 'none'}
                  strokeWidth="0.5"
                  style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    fontFamily: 'Arial Black, sans-serif',
                    letterSpacing: '1px'
                  }}
                >
                  {segment.text}
                </text>
              </g>
            )
          })}

          {/* Inner ring around center */}
          <circle
            cx={cx}
            cy={cy}
            r={innerRadius}
            fill="none"
            stroke="#444"
            strokeWidth="3"
          />
        </svg>
      </div>

      {/* Center Logo - Fixed position, doesn't spin */}
      <div className="center-logo">
        <div className="center-logo-text">
          <span>GOD IS</span>
          <span>KIND</span>
        </div>
      </div>
    </div>
  )
}

export { SEGMENTS }
export default SpinWheel
