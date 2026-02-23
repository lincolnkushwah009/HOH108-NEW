import { useEffect, useState } from 'react'

const COLORS = ['#C59C82', '#DDC5B0', '#A68B6A', '#FFD700', '#FDB913', '#E5E5E5', '#FFFFFF']

function randomInRange(min, max) {
  return Math.random() * (max - min) + min
}

function ConfettiPiece({ delay, color, startX }) {
  const [style, setStyle] = useState({})

  useEffect(() => {
    const size = randomInRange(8, 14)
    const rotation = randomInRange(0, 360)
    const duration = randomInRange(2, 4)
    const endX = startX + randomInRange(-100, 100)
    const shape = Math.random() > 0.5 ? 'circle' : 'square'

    setStyle({
      position: 'absolute',
      width: `${size}px`,
      height: shape === 'circle' ? `${size}px` : `${size * 0.6}px`,
      backgroundColor: color,
      borderRadius: shape === 'circle' ? '50%' : '2px',
      left: `${startX}%`,
      top: '-20px',
      opacity: 1,
      transform: `rotate(${rotation}deg)`,
      animation: `confetti-fall ${duration}s ease-out ${delay}s forwards`
    })
  }, [delay, color, startX])

  return <div style={style} />
}

export default function Confetti({ isActive, duration = 3000 }) {
  const [pieces, setPieces] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isActive) {
      setIsVisible(true)

      // Generate confetti pieces
      const newPieces = []
      const pieceCount = 80

      for (let i = 0; i < pieceCount; i++) {
        newPieces.push({
          id: i,
          delay: randomInRange(0, 0.5),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          startX: randomInRange(10, 90)
        })
      }

      setPieces(newPieces)

      // Hide after duration
      const timer = setTimeout(() => {
        setIsVisible(false)
        setPieces([])
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isActive, duration])

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          25% {
            transform: translateY(25vh) rotate(180deg) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) rotate(360deg) scale(0.9);
            opacity: 0.9;
          }
          75% {
            transform: translateY(75vh) rotate(540deg) scale(0.8);
            opacity: 0.6;
          }
          100% {
            transform: translateY(110vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
      {pieces.map(piece => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.delay}
          color={piece.color}
          startX={piece.startX}
        />
      ))}
    </div>
  )
}

// Burst Confetti - More dramatic effect
export function ConfettiBurst({ isActive, duration = 3000 }) {
  const [pieces, setPieces] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isActive) {
      setIsVisible(true)

      const newPieces = []
      const pieceCount = 100

      for (let i = 0; i < pieceCount; i++) {
        const angle = (i / pieceCount) * 360
        const velocity = randomInRange(300, 600)
        const size = randomInRange(6, 12)

        newPieces.push({
          id: i,
          angle,
          velocity,
          size,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotationSpeed: randomInRange(-720, 720),
          delay: randomInRange(0, 0.2)
        })
      }

      setPieces(newPieces)

      const timer = setTimeout(() => {
        setIsVisible(false)
        setPieces([])
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isActive, duration])

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {pieces.map(piece => (
        <BurstPiece key={piece.id} {...piece} />
      ))}
    </div>
  )
}

function BurstPiece({ angle, velocity, size, color, rotationSpeed, delay }) {
  const radians = (angle * Math.PI) / 180
  const endX = Math.cos(radians) * velocity
  const endY = Math.sin(radians) * velocity + 400 // Add gravity effect

  return (
    <div style={{
      position: 'absolute',
      width: `${size}px`,
      height: `${size * 0.6}px`,
      backgroundColor: color,
      borderRadius: '2px',
      left: '50%',
      top: '40%',
      opacity: 0,
      animation: `burst-${angle} 2s ease-out ${delay}s forwards`
    }}>
      <style>{`
        @keyframes burst-${angle} {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + ${endX}px), calc(-50% + ${endY}px)) rotate(${rotationSpeed}deg) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Celebration effect with stars and sparkles
export function CelebrationEffect({ isActive, duration = 3000 }) {
  const [elements, setElements] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isActive) {
      setIsVisible(true)

      const newElements = []

      // Add confetti
      for (let i = 0; i < 60; i++) {
        newElements.push({
          id: `confetti-${i}`,
          type: 'confetti',
          delay: randomInRange(0, 0.5),
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          startX: randomInRange(5, 95),
          size: randomInRange(8, 14)
        })
      }

      // Add sparkles
      for (let i = 0; i < 20; i++) {
        newElements.push({
          id: `sparkle-${i}`,
          type: 'sparkle',
          delay: randomInRange(0, 1),
          x: randomInRange(10, 90),
          y: randomInRange(20, 60)
        })
      }

      setElements(newElements)

      const timer = setTimeout(() => {
        setIsVisible(false)
        setElements([])
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isActive, duration])

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes confetti-drop {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes sparkle-burst {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      {elements.map(el => {
        if (el.type === 'confetti') {
          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                width: `${el.size}px`,
                height: `${el.size * 0.6}px`,
                backgroundColor: el.color,
                borderRadius: '2px',
                left: `${el.startX}%`,
                top: '-20px',
                animation: `confetti-drop ${randomInRange(2, 3.5)}s ease-out ${el.delay}s forwards`
              }}
            />
          )
        }

        if (el.type === 'sparkle') {
          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.x}%`,
                top: `${el.y}%`,
                fontSize: '24px',
                animation: `sparkle-burst 1s ease-out ${el.delay}s forwards`,
                opacity: 0
              }}
            >
              ✨
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
