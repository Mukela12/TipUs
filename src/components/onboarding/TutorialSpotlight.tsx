import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

interface TutorialSpotlightProps {
  targetSelector: string | null
}

export function TutorialSpotlight({ targetSelector }: TutorialSpotlightProps) {
  const [rect, setRect] = useState<SpotlightRect | null>(null)

  useEffect(() => {
    if (!targetSelector) {
      setRect(null)
      return
    }

    const updateRect = () => {
      const element = document.querySelector(targetSelector)
      if (element) {
        const r = element.getBoundingClientRect()
        const padding = 8
        setRect({
          top: r.top - padding,
          left: r.left - padding,
          width: r.width + padding * 2,
          height: r.height + padding * 2,
        })
      }
    }

    updateRect()

    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [targetSelector])

  // No target — full dark overlay (for centered welcome modals)
  if (!targetSelector || !rect) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[60]"
      />
    )
  }

  const shadowSpread = Math.max(window.innerWidth, window.innerHeight) * 2

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] pointer-events-none"
    >
      {/* Background overlay with spotlight cutout */}
      <motion.div
        animate={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
        transition={{ duration: 0.3 }}
        className="absolute rounded-lg"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: `0 0 0 ${shadowSpread}px rgba(0, 0, 0, 0.6)`,
        }}
      />

      {/* Highlight ring around target */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: 1,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="absolute rounded-lg ring-2 ring-primary-500 ring-offset-2 ring-offset-transparent"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        }}
      />
    </motion.div>
  )
}

/** Calculate where to position the tooltip relative to the target element */
export function getTooltipPosition(
  targetSelector: string | null,
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
): { top: number; left: number; transformOrigin: string } {
  const tooltipWidth = 320
  const tooltipHeight = 200
  const padding = 16

  if (!targetSelector || position === 'center') {
    return {
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      transformOrigin: 'center center',
    }
  }

  const element = document.querySelector(targetSelector)
  if (!element) {
    return {
      top: window.innerHeight / 2,
      left: window.innerWidth / 2,
      transformOrigin: 'center center',
    }
  }

  const rect = element.getBoundingClientRect()
  const margin = 16

  let top: number
  let left: number
  let transformOrigin: string

  switch (position) {
    case 'top':
      top = Math.max(padding + tooltipHeight, rect.top - margin)
      left = rect.left + rect.width / 2
      transformOrigin = 'bottom center'
      break
    case 'bottom':
      top = Math.min(rect.bottom + margin, window.innerHeight - padding - tooltipHeight)
      left = rect.left + rect.width / 2
      transformOrigin = 'top center'
      break
    case 'left':
      top = Math.max(padding + tooltipHeight / 2, Math.min(rect.top + rect.height / 2, window.innerHeight - padding - tooltipHeight / 2))
      left = rect.left - margin
      transformOrigin = 'center right'
      break
    case 'right':
      top = Math.max(padding + tooltipHeight / 2, Math.min(rect.top + rect.height / 2, window.innerHeight - padding - tooltipHeight / 2))
      left = rect.right + margin
      transformOrigin = 'center left'
      break
    default:
      return { top: window.innerHeight / 2, left: window.innerWidth / 2, transformOrigin: 'center center' }
  }

  left = Math.max(padding + tooltipWidth / 2, Math.min(left, window.innerWidth - padding - tooltipWidth / 2))

  return { top, left, transformOrigin }
}
