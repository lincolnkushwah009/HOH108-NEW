import { useState, useRef, useEffect } from 'react'
import SpinWheel, { SEGMENTS } from './SpinWheel'
import { playSpinSound, playWinSound, playLoseSound, playClickSound } from '../utils/sounds'
import './GameScreen.css'

// =============================================================================
// SPIN WHEEL GAME LOGIC
// =============================================================================
// Rules:
// 1. Three outcomes on wheel: FREE WIN (45%), TRY AGAIN (35%), JUST MISS (20%)
// 2. Only "FREE WIN" means the user wins
// 3. Maximum 3 spins per user
// 4. Win on any spin → game stops immediately
// 5. OVERALL WIN RATE: 90% of users will win, 10% will lose all spins
// 6. If user is destined to win, they win on a random spin (1, 2, or 3)
// 7. Result is determined at game start, wheel animation matches the outcome
// =============================================================================

// Messages shown when user loses a spin
const LOSE_MESSAGES = {
  'TRY AGAIN': [
    "So Close! Give it another spin!",
    "Almost There! Try again!",
    "The universe is building suspense!",
    "Your winning spin is coming!"
  ],
  'JUST MISS': [
    "Ooh, just missed! One more try!",
    "That was SO close!",
    "Nearly there! Spin again!",
    "Just a hair away!"
  ]
}

/**
 * Determines the game outcome at the start
 * 90% chance to win (on random spin 1, 2, or 3)
 * 10% chance to lose all spins
 *
 * @returns {object} { willWin: boolean, winOnSpin: number|null }
 */
function determineGameOutcome() {
  // Use multiple random calls with timestamp for better randomization
  const timestamp = Date.now()
  const random1 = Math.random()
  const random2 = Math.random()

  // Mix randomness sources for win/lose decision
  const winChance = (random1 + random2) / 2

  if (winChance < 0.90) {
    // 90% - User will WIN on one of the 3 spins
    // Use timestamp + random for truly random spin selection
    const spinRandom = Math.random() * 1000 + (timestamp % 1000)
    const winOnSpin = (Math.floor(spinRandom) % 3) + 1 // 1, 2, or 3

    console.log('🎰 Game outcome: WIN on spin', winOnSpin, '(random value:', spinRandom % 3, ')')
    return { willWin: true, winOnSpin }
  } else {
    // 10% - User will LOSE all 3 spins
    console.log('🎰 Game outcome: LOSE all spins')
    return { willWin: false, winOnSpin: null }
  }
}

/**
 * Gets the segment index for win or loss
 * @param {boolean} shouldWin - Whether this spin should be a win
 * @returns {number} Segment index (0: FREE WIN, 1: TRY AGAIN, 2: JUST MISS)
 */
function getSegmentForOutcome(shouldWin) {
  if (shouldWin) {
    return 0 // FREE WIN segment
  } else {
    // Randomly pick between TRY AGAIN (1) and JUST MISS (2)
    return Math.random() < 0.65 ? 1 : 2
  }
}

/**
 * Calculates the rotation angle needed to land on a specific segment
 * The pointer is at the top (12 o'clock position)
 *
 * @param {number} segmentIndex - The target segment to land on (0, 1, or 2)
 * @param {number} currentRotation - Current wheel rotation in degrees
 * @returns {number} Total rotation needed
 */
function calculateRotation(segmentIndex, currentRotation) {
  // CORRECT target angles - calculated based on:
  // Pointer is at top (270° in SVG coords / -90°)
  // At rotation R, pointer points to wheel angle (270 - R)
  // FREE WIN center: 330° (-30°) → need R = 300° so pointer hits 330°
  // TRY AGAIN center: 90° → need R = 180° so pointer hits 90°
  // JUST MISS center: 210° → need R = 60° so pointer hits 210°
  const targetAngles = [300, 180, 60]
  const targetAngle = targetAngles[segmentIndex]

  // Current wheel position (0-360)
  const currentAngle = ((currentRotation % 360) + 360) % 360

  // Calculate how much more to rotate to reach target (always moving forward)
  let angleToTarget = targetAngle - currentAngle
  if (angleToTarget <= 0) {
    angleToTarget += 360 // Ensure wheel always moves forward
  }

  // Add full rotations for dramatic spinning (5-7 full spins)
  const fullRotations = 5 + Math.floor(Math.random() * 3)

  // Small random offset to vary landing position within segment
  // Each segment is 120°, so ±40° keeps us well within the segment
  const randomOffset = (Math.random() - 0.5) * 80

  // New rotation = current + full spins + angle to reach target + offset
  const newRotation = currentRotation + (fullRotations * 360) + angleToTarget + randomOffset

  console.log(`🎯 Segment ${segmentIndex} (${['FREE WIN', 'TRY AGAIN', 'JUST MISS'][segmentIndex]}): target=${targetAngle}°, final=${(newRotation % 360).toFixed(1)}°`)

  return newRotation
}

/**
 * Gets a random message based on the outcome type
 */
function getRandomMessage(outcomeText) {
  const messages = LOSE_MESSAGES[outcomeText] || LOSE_MESSAGES['TRY AGAIN']
  return messages[Math.floor(Math.random() * messages.length)]
}

// =============================================================================
// GAME SCREEN COMPONENT
// =============================================================================

function GameScreen({ onWin }) {
  // Game state
  const [spinsLeft, setSpinsLeft] = useState(3)       // Remaining spins (max 3)
  const [isSpinning, setIsSpinning] = useState(false) // Wheel animation in progress
  const [rotation, setRotation] = useState(0)         // Current wheel rotation
  const [message, setMessage] = useState(null)        // Result message to display
  const [messageType, setMessageType] = useState('')  // 'win' or 'lose' for styling
  const [gameEnded, setGameEnded] = useState(false)   // True when game is over
  const [bonusSpinUsed, setBonusSpinUsed] = useState(false) // Track if bonus spin was given

  // Pre-determined game outcome (set once at game start)
  const gameOutcomeRef = useRef(null)
  // Track current spin number (1, 2, or 3)
  const currentSpinRef = useRef(0)
  // Track total spins used for analytics
  const totalSpinsRef = useRef(0)

  // Determine game outcome when component mounts
  useEffect(() => {
    gameOutcomeRef.current = determineGameOutcome()
    console.log('Game outcome determined:', gameOutcomeRef.current)
  }, [])

  /**
   * Main spin handler - executes the complete spin sequence
   */
  const spinWheel = () => {
    // Prevent spin if already spinning, no spins left, or game ended
    if (isSpinning || spinsLeft <= 0 || gameEnded) return

    setIsSpinning(true)
    setMessage(null)

    // Play click and spin sounds
    playClickSound()
    playSpinSound()

    // Increment spin counter
    currentSpinRef.current += 1
    const currentSpin = currentSpinRef.current

    // STEP 1: Check if this spin should be a WIN based on pre-determined outcome
    const gameOutcome = gameOutcomeRef.current
    const shouldWinThisSpin = gameOutcome.willWin && gameOutcome.winOnSpin === currentSpin

    // STEP 2: Get the appropriate segment
    const outcomeIndex = getSegmentForOutcome(shouldWinThisSpin)
    const outcome = SEGMENTS[outcomeIndex]

    // STEP 3: Calculate rotation to land on the determined segment
    const newRotation = calculateRotation(outcomeIndex, rotation)
    setRotation(newRotation)

    // STEP 4: Wait for wheel animation to complete (4 seconds), then process result
    setTimeout(() => {
      totalSpinsRef.current += 1
      const newSpinsLeft = spinsLeft - 1
      setSpinsLeft(newSpinsLeft)

      if (shouldWinThisSpin) {
        // === USER WON ===
        playWinSound()
        setMessageType('win')
        setMessage('🎉 CONGRATULATIONS! YOU WON! 🎉')
        setGameEnded(true)
        setIsSpinning(false)

        // Trigger win callback (for form screen transition)
        onWin(totalSpinsRef.current)
      } else {
        // === USER LOST THIS SPIN ===
        playLoseSound()
        if (newSpinsLeft > 0) {
          // Still has spins remaining - show encouragement message
          setMessageType('lose')
          setMessage(getRandomMessage(outcome.text))
          setIsSpinning(false)
        } else {
          // No spins remaining - check if "TRY AGAIN" gives bonus spin
          if (outcome.text === 'TRY AGAIN' && !bonusSpinUsed) {
            // Give bonus spin for landing on "TRY AGAIN" on last spin!
            setBonusSpinUsed(true)
            setSpinsLeft(1) // Give 1 bonus spin
            setMessageType('bonus')
            setMessage('🎁 TRY AGAIN = BONUS SPIN! One more chance!')
            setIsSpinning(false)
            console.log('🎁 Bonus spin awarded for TRY AGAIN on last spin!')
          } else {
            // "JUST MISS" or bonus already used - game over with loss
            setMessageType('final-loss')
            setMessage('😢 Better luck next time! All spins used.')
            setGameEnded(true)
            setIsSpinning(false)
          }
        }
      }
    }, 4000) // Match this with CSS transition duration
  }

  // Determine button state and text
  const getButtonText = () => {
    if (gameEnded) return 'GAME OVER'
    if (isSpinning) return 'SPINNING...'
    return '🎰 SPIN TO WIN!'
  }

  const isButtonDisabled = isSpinning || spinsLeft <= 0 || gameEnded

  return (
    <div className="game-screen">
      {/* Brand Header */}
      <div className="brand-logo">GOD IS KIND</div>
      <p className="tagline">Wear the Message. Spread Kindness.</p>

      {/* Spins Counter */}
      <div className="spin-counter">
        🎯 SPINS LEFT: <span>{spinsLeft}</span>
      </div>

      {/* Spin Wheel Component */}
      <SpinWheel rotation={rotation} isSpinning={isSpinning} />

      {/* Spin Button */}
      <button
        className="spin-btn"
        onClick={spinWheel}
        disabled={isButtonDisabled}
      >
        {getButtonText()}
      </button>

      {/* Result Message */}
      {message && (
        <div className={`result-message ${messageType}`}>
          {message}
          {messageType === 'lose' && spinsLeft > 0 && (
            <small>Spins remaining: {spinsLeft}</small>
          )}
        </div>
      )}

      {/* Game Instructions */}
      <div className="instructions">
        <p>🎁 <span className="highlight">You get 3 chances to spin!</span></p>
        <p>Land on FREE WIN to claim your prize! 🎉</p>
      </div>

      {/* Probability Info (for transparency) */}
      <div className="probability-info">
        <small>45% chance to win on each spin!</small>
      </div>
    </div>
  )
}

export default GameScreen
