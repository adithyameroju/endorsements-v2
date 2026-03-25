import { useEffect, useRef, useState } from 'react'

/**
 * Wraps a formatted CD/premium value; briefly animates when `value` changes.
 */
export default function AnimatedCdAmount({ value, children, className = '' }) {
  const [flash, setFlash] = useState(false)
  const prev = useRef(value)
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 480)
      return () => clearTimeout(t)
    }
  }, [value])
  return (
    <span className={`${className} ${flash ? 'cd-amount-flash' : ''} inline-block tabular-nums transition-colors duration-300`}>
      {children}
    </span>
  )
}
