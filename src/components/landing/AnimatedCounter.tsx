import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface AnimatedCounterProps {
  value: string
  duration?: number
}

/** Extracts leading number and suffix from strings like "75%", "3x", "82%". */
function parseValue(val: string): { num: number; suffix: string; prefix: string } {
  const match = val.match(/^([^0-9]*)(\d+)(.*)$/)
  if (!match) return { num: 0, suffix: val, prefix: '' }
  return { prefix: match[1], num: parseInt(match[2], 10), suffix: match[3] }
}

export default function AnimatedCounter({ value, duration = 1.2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const [display, setDisplay] = useState('0')
  const { num, suffix, prefix } = parseValue(value)

  useEffect(() => {
    if (!isInView) return
    const start = performance.now()
    const durationMs = duration * 1000

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / durationMs, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * num)
      setDisplay(String(current))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [isInView, num, duration])

  return (
    <span ref={ref}>
      {prefix}{display}{suffix}
    </span>
  )
}
