// Notification sound utility using Web Audio API
let audioContext = null

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

// Play a pleasant notification chime
export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext()

    // Resume audio context if suspended (browser policy)
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    // Create a pleasant two-tone chime
    const frequencies = [523.25, 659.25] // C5 and E5 notes

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = freq
      oscillator.type = 'sine'

      // Envelope for smooth sound
      const startTime = now + (index * 0.15)
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.5)
    })
  } catch (error) {
    console.warn('Could not play notification sound:', error)
  }
}

// Play a more urgent alert sound for high priority tickets
export const playUrgentSound = () => {
  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    // Three quick beeps for urgent notifications
    for (let i = 0; i < 3; i++) {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = 880 // A5 note
      oscillator.type = 'square'

      const startTime = now + (i * 0.2)
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15)

      oscillator.start(startTime)
      oscillator.stop(startTime + 0.2)
    }
  } catch (error) {
    console.warn('Could not play urgent sound:', error)
  }
}

export default playNotificationSound
