import './FloatingTshirt.css'

// 3D T-Shirt SVG Component with premium styling
function FloatingTshirt({ position, color = 'gold' }) {
  const colors = {
    gold: {
      main: '#FFD700',
      light: '#FFEA00',
      dark: '#B8860B',
      glow: 'rgba(255, 215, 0, 0.5)'
    },
    purple: {
      main: '#B24BF3',
      light: '#D68FFF',
      dark: '#7B2FA0',
      glow: 'rgba(178, 75, 243, 0.5)'
    },
    cyan: {
      main: '#00F5FF',
      light: '#7FFFFF',
      dark: '#00A8B0',
      glow: 'rgba(0, 245, 255, 0.5)'
    },
    orange: {
      main: '#FF6B35',
      light: '#FF9F7A',
      dark: '#CC4A1A',
      glow: 'rgba(255, 107, 53, 0.5)'
    }
  }

  const c = colors[color] || colors.gold

  return (
    <div className={`floating-tshirt-3d ${position}`}>
      <svg
        viewBox="0 0 100 100"
        className="tshirt-svg"
        style={{
          filter: `drop-shadow(0 0 20px ${c.glow}) drop-shadow(0 10px 30px rgba(0,0,0,0.3))`
        }}
      >
        {/* T-Shirt Shape with 3D gradient */}
        <defs>
          <linearGradient id={`tshirt-grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c.light} />
            <stop offset="30%" stopColor={c.main} />
            <stop offset="70%" stopColor={c.main} />
            <stop offset="100%" stopColor={c.dark} />
          </linearGradient>
          <linearGradient id={`tshirt-highlight-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id="inner-shadow">
            <feOffset dx="0" dy="2" />
            <feGaussianBlur stdDeviation="2" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.3" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Main T-Shirt Body */}
        <path
          d="M25 25 L15 35 L25 45 L25 85 L75 85 L75 45 L85 35 L75 25 L65 30 C60 35 40 35 35 30 L25 25 Z"
          fill={`url(#tshirt-grad-${color})`}
          stroke={c.dark}
          strokeWidth="1.5"
          filter="url(#inner-shadow)"
        />

        {/* Collar */}
        <ellipse
          cx="50"
          cy="28"
          rx="12"
          ry="6"
          fill="#0a0a0a"
          stroke={c.dark}
          strokeWidth="1"
        />

        {/* Highlight overlay */}
        <path
          d="M25 25 L15 35 L25 45 L25 50 L75 50 L75 45 L85 35 L75 25 L65 30 C60 35 40 35 35 30 L25 25 Z"
          fill={`url(#tshirt-highlight-${color})`}
          opacity="0.6"
        />

        {/* Left Sleeve Fold */}
        <line x1="25" y1="45" x2="30" y2="40" stroke={c.dark} strokeWidth="0.5" opacity="0.5" />

        {/* Right Sleeve Fold */}
        <line x1="75" y1="45" x2="70" y2="40" stroke={c.dark} strokeWidth="0.5" opacity="0.5" />

        {/* Body Center Line (subtle) */}
        <line x1="50" y1="35" x2="50" y2="82" stroke={c.dark} strokeWidth="0.3" opacity="0.2" />

        {/* GIK Text on shirt */}
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fill="#0a0a0a"
          fontSize="10"
          fontWeight="900"
          fontFamily="Arial Black, sans-serif"
          opacity="0.3"
        >
          GIK
        </text>
      </svg>
    </div>
  )
}

export default FloatingTshirt
