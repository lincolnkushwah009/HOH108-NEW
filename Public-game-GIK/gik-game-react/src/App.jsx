import { useState } from 'react'
import GameScreen from './components/GameScreen'
import FormScreen from './components/FormScreen'
import ReviewScreen from './components/ReviewScreen'
import ThankYouScreen from './components/ThankYouScreen'
import Confetti from './components/Confetti'
import SideElements from './components/SideElements'
import './App.css'

// API Configuration - Update for production
const API_BASE_URL = 'https://hoh108.com/api'

function App() {
  const [currentScreen, setCurrentScreen] = useState('game')
  const [showConfetti, setShowConfetti] = useState(false)
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    rating: 0,
    spinsUsed: 0
  })

  const handleWin = (spinsUsed) => {
    setUserData(prev => ({ ...prev, spinsUsed }))
    setShowConfetti(true)
    setTimeout(() => {
      setCurrentScreen('form')
    }, 2000)
  }

  const handleFormSubmit = (name, phone) => {
    setUserData(prev => ({ ...prev, name, phone }))
    setShowConfetti(false)
    setCurrentScreen('review')
  }

  const handleReviewSubmit = async (rating) => {
    const finalData = { ...userData, rating }
    setUserData(finalData)

    // Format data for the leads endpoint
    const leadData = {
      name: finalData.name,
      phone: finalData.phone,
      service: 'game',
      source: 'event',
      sourceDetails: 'GIK Spin Wheel Game',
      websiteSource: 'InteriorPlus',  // Maps to InteriorPlus company
      message: `GIK Spin Wheel Winner - Rating: ${rating}/5 stars - Spins used: ${finalData.spinsUsed}`,
      tags: ['spin-wheel-winner', 'gik-campaign']
    }

    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      })
      const result = await response.json()
      console.log('Lead saved:', result)
    } catch (error) {
      console.error('Error saving lead:', error)
    }

    setShowConfetti(true)
    setCurrentScreen('thankyou')
  }

  return (
    <div className="app">
      {/* Animated Background Particles */}
      <div className="bg-animation">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Side Decorative Elements */}
      <SideElements />

      {showConfetti && <Confetti />}

      <div className="container">
        {currentScreen === 'game' && <GameScreen onWin={handleWin} />}
        {currentScreen === 'form' && <FormScreen onSubmit={handleFormSubmit} />}
        {currentScreen === 'review' && <ReviewScreen onSubmit={handleReviewSubmit} />}
        {currentScreen === 'thankyou' && <ThankYouScreen />}
      </div>
    </div>
  )
}

export default App
