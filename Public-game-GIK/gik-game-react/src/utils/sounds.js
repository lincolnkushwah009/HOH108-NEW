// =============================================================================
// SOUND EFFECTS UTILITY
// Uses Web Audio API to generate sounds without external files
// =============================================================================

let audioContext = null

// Initialize audio context on first user interaction
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

/**
 * Play a spinning/ticking sound effect
 * Creates rapid clicking sounds that slow down over time
 */
export function playSpinSound() {
  const ctx = getAudioContext()
  const duration = 4 // 4 seconds total spin time
  const startTime = ctx.currentTime

  // Create multiple ticks that slow down
  let tickTime = 0
  let interval = 0.05 // Start fast

  while (tickTime < duration) {
    // Create a short click/tick sound
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Click sound - short burst
    osc.frequency.value = 800 + Math.random() * 400 // Random pitch variation
    osc.type = 'square'

    // Volume envelope
    const tickStartTime = startTime + tickTime
    gain.gain.setValueAtTime(0.15, tickStartTime)
    gain.gain.exponentialDecayTo && gain.gain.exponentialDecayTo(0.01, tickStartTime + 0.03)
    gain.gain.setValueAtTime(0.15, tickStartTime)
    gain.gain.linearRampToValueAtTime(0.01, tickStartTime + 0.02)

    osc.start(tickStartTime)
    osc.stop(tickStartTime + 0.03)

    // Slow down the ticks over time (ease out effect)
    tickTime += interval
    interval *= 1.08 // Gradually increase interval (slow down)
  }

  // Final landing sound
  setTimeout(() => {
    playLandSound()
  }, duration * 1000 - 200)
}

/**
 * Play a landing/stop sound
 */
function playLandSound() {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.frequency.value = 300
  osc.type = 'sine'

  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)

  osc.start()
  osc.stop(ctx.currentTime + 0.3)
}

/**
 * Play a winning celebration sound
 */
export function playWinSound() {
  const ctx = getAudioContext()
  const startTime = ctx.currentTime

  // Play a triumphant ascending arpeggio
  const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.value = freq
    osc.type = 'sine'

    const noteStart = startTime + i * 0.15
    gain.gain.setValueAtTime(0, noteStart)
    gain.gain.linearRampToValueAtTime(0.25, noteStart + 0.05)
    gain.gain.linearRampToValueAtTime(0.15, noteStart + 0.2)
    gain.gain.linearRampToValueAtTime(0, noteStart + 0.5)

    osc.start(noteStart)
    osc.stop(noteStart + 0.5)
  })

  // Add a sparkle/shimmer effect
  setTimeout(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.frequency.value = 2000 + Math.random() * 2000
        osc.type = 'sine'

        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1)

        osc.start()
        osc.stop(ctx.currentTime + 0.1)
      }, i * 80)
    }
  }, 600)
}

/**
 * Play a "try again" / lose sound
 */
export function playLoseSound() {
  const ctx = getAudioContext()
  const startTime = ctx.currentTime

  // Descending tone
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.frequency.setValueAtTime(400, startTime)
  osc.frequency.linearRampToValueAtTime(200, startTime + 0.4)
  osc.type = 'sine'

  gain.gain.setValueAtTime(0.2, startTime)
  gain.gain.linearRampToValueAtTime(0, startTime + 0.4)

  osc.start(startTime)
  osc.stop(startTime + 0.4)
}

/**
 * Play button click sound
 */
export function playClickSound() {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.frequency.value = 600
  osc.type = 'sine'

  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08)

  osc.start()
  osc.stop(ctx.currentTime + 0.08)
}
