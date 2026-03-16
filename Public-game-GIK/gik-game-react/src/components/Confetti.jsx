import { useEffect, useState } from 'react'
import './Confetti.css'

const COLORS = ['#FFD700', '#FF6B35', '#9B59B6', '#FF69B4', '#ffffff']

function Confetti() {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    const newPieces = []
    for (let i = 0; i < 100; i++) {
      newPieces.push({
        id: i,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        rotation: Math.random() * 360,
        isCircle: Math.random() > 0.5
      })
    }
    setPieces(newPieces)

    // Cleanup after animation
    const timer = setTimeout(() => {
      setPieces([])
    }, 4000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="confetti-container">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={`confetti ${piece.isCircle ? 'circle' : ''}`}
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotation}deg)`
          }}
        />
      ))}
    </div>
  )
}

export default Confetti
