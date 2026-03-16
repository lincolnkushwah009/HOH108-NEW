import { useState } from 'react'
import './ReviewScreen.css'

function ReviewScreen({ onSubmit }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    await onSubmit(rating)
  }

  return (
    <div className="review-screen">
      <div className="brand-logo">GOD IS KIND</div>

      <div className="form-container">
        <h3>⭐ QUICK REVIEW</h3>
        <p className="review-text">
          How do you like the<br />
          <strong>GOD IS KIND</strong> clothing & design?
        </p>

        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              ★
            </span>
          ))}
        </div>

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'SUBMITTING...' : 'SUBMIT & CONTINUE →'}
        </button>

        <p className="skip-text">
          Tap a star to rate, or skip if you prefer
        </p>
      </div>
    </div>
  )
}

export default ReviewScreen
