import { useEffect, useRef, useState } from 'react'

/**
 * AnimatedSection - Animates when scrolled into view
 */
export function AnimatedSection({
  children,
  animation = 'fade-up',
  delay = 0,
  className = '',
  style = {},
  threshold = 0.1
}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold])

  const animations = {
    'fade-up': {
      initial: { opacity: 0, transform: 'translateY(30px)' },
      visible: { opacity: 1, transform: 'translateY(0)' }
    },
    'fade-down': {
      initial: { opacity: 0, transform: 'translateY(-30px)' },
      visible: { opacity: 1, transform: 'translateY(0)' }
    },
    'fade-left': {
      initial: { opacity: 0, transform: 'translateX(-30px)' },
      visible: { opacity: 1, transform: 'translateX(0)' }
    },
    'fade-right': {
      initial: { opacity: 0, transform: 'translateX(30px)' },
      visible: { opacity: 1, transform: 'translateX(0)' }
    },
    'scale': {
      initial: { opacity: 0, transform: 'scale(0.9)' },
      visible: { opacity: 1, transform: 'scale(1)' }
    },
    'fade': {
      initial: { opacity: 0 },
      visible: { opacity: 1 }
    }
  }

  const currentAnim = animations[animation] || animations['fade-up']

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        ...(isVisible ? currentAnim.visible : currentAnim.initial),
        transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`
      }}
    >
      {children}
    </div>
  )
}

/**
 * AnimatedText - Text reveal animation
 */
export function AnimatedText({
  children,
  className = '',
  style = {},
  delay = 0
}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  return (
    <span
      ref={ref}
      className={className}
      style={{
        ...style,
        display: 'inline-block',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        filter: isVisible ? 'blur(0)' : 'blur(5px)',
        transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`
      }}
    >
      {children}
    </span>
  )
}

/**
 * StaggeredGrid - Animates children with staggered delays
 */
export function StaggeredGrid({
  children,
  className = '',
  style = {},
  staggerDelay = 0.1,
  threshold = 0.1
}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold])

  return (
    <div ref={ref} className={className} style={style}>
      {Array.isArray(children) ? children.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * staggerDelay}s`
          }}
        >
          {child}
        </div>
      )) : children}
    </div>
  )
}

/**
 * HoverCard - Card with smooth hover animations
 */
export function HoverCard({
  children,
  className = '',
  style = {},
  hoverEffect = 'lift' // lift, glow, scale, tilt
}) {
  const effects = {
    lift: 'card-lift',
    glow: 'card-glow',
    scale: 'card-scale',
    tilt: 'card-tilt'
  }

  return (
    <div
      className={`${effects[hoverEffect] || 'card-lift'} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

/**
 * AnimatedButton - Button with hover animations
 */
export function AnimatedButton({
  children,
  className = '',
  style = {},
  variant = 'primary', // primary, secondary, arrow
  onClick,
  ...props
}) {
  const variants = {
    primary: 'btn-primary ripple',
    secondary: 'btn-secondary',
    arrow: 'btn-arrow'
  }

  return (
    <button
      className={`${variants[variant] || 'btn-primary'} ${className}`}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * AnimatedImage - Image with zoom/shine effects
 */
export function AnimatedImage({
  src,
  alt,
  className = '',
  style = {},
  effect = 'zoom' // zoom, shine
}) {
  const effects = {
    zoom: 'img-zoom',
    shine: 'img-shine'
  }

  return (
    <div className={`${effects[effect] || 'img-zoom'} ${className}`} style={style}>
      <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
}

/**
 * AnimatedIcon - Icon with hover animations
 */
export function AnimatedIcon({
  children,
  className = '',
  style = {},
  animation = 'bounce' // bounce, pulse, rotate, shake, float
}) {
  const animations = {
    bounce: 'icon-bounce',
    pulse: 'icon-pulse',
    rotate: 'icon-rotate',
    shake: 'icon-shake',
    float: 'icon-float'
  }

  return (
    <span className={`${animations[animation] || 'icon-bounce'} ${className}`} style={{ display: 'inline-flex', ...style }}>
      {children}
    </span>
  )
}

/**
 * CountUp - Animated number counter
 */
export function CountUp({
  end,
  duration = 2000,
  suffix = '',
  prefix = '',
  className = '',
  style = {}
}) {
  const ref = useRef(null)
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)

          const startTime = Date.now()
          const endValue = typeof end === 'string' ? parseInt(end) : end

          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(easeOut * endValue))

            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }

          requestAnimationFrame(animate)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [end, duration, hasAnimated])

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{count}{suffix}
    </span>
  )
}

export default AnimatedSection
