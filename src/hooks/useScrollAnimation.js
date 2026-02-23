import { useEffect, useRef, useState } from 'react'

/**
 * Hook to detect when an element is in viewport and trigger animations
 * @param {Object} options - IntersectionObserver options
 * @returns {[React.RefObject, boolean]} - ref to attach to element and visibility state
 */
export function useScrollAnimation(options = {}) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Once visible, stop observing (animation plays once)
          if (ref.current) {
            observer.unobserve(ref.current)
          }
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
        ...options
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [options.threshold, options.rootMargin])

  return [ref, isVisible]
}

/**
 * Hook to animate multiple children with staggered delay
 * @param {number} childCount - Number of children to animate
 * @param {Object} options - IntersectionObserver options
 * @returns {[React.RefObject, boolean[]]} - ref and array of visibility states
 */
export function useStaggerAnimation(childCount, options = {}) {
  const ref = useRef(null)
  const [visibleItems, setVisibleItems] = useState(Array(childCount).fill(false))

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Stagger the visibility of each item
          for (let i = 0; i < childCount; i++) {
            setTimeout(() => {
              setVisibleItems(prev => {
                const newState = [...prev]
                newState[i] = true
                return newState
              })
            }, i * (options.staggerDelay || 100))
          }

          if (ref.current) {
            observer.unobserve(ref.current)
          }
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
        ...options
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [childCount, options.threshold, options.rootMargin, options.staggerDelay])

  return [ref, visibleItems]
}

export default useScrollAnimation
