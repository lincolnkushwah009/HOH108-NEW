import { useState } from 'react'
import './FormScreen.css'

function FormScreen({ onSubmit }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim() && phone.trim()) {
      onSubmit(name.trim(), phone.trim())
    }
  }

  return (
    <div className="form-screen">
      <div className="brand-logo">GOD IS KIND</div>

      <div className="win-message">
        <span className="emoji">🎉</span>
        <h2>CONGRATULATIONS!</h2>
        <p className="prize">You Won a FREE GOD IS KIND T-Shirt!</p>
      </div>

      <div className="form-container">
        <h3>📝 CLAIM YOUR PRIZE</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Your Full Name</label>
            <input
              type="text"
              id="fullName"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="submit-btn">
            CLAIM MY T-SHIRT →
          </button>
        </form>
      </div>
    </div>
  )
}

export default FormScreen
