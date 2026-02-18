import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useOnboarding } from './useOnboarding'
import { TutorialSpotlight, getTooltipPosition } from './TutorialSpotlight'
import { TutorialStepCard } from './TutorialStep'

export function TutorialOverlay() {
  const {
    currentStep,
    currentStepData,
    totalSteps,
    nextStep,
    prevStep,
    skipTutorial,
  } = useOnboarding()

  const [tooltipPosition, setTooltipPosition] = useState(() =>
    getTooltipPosition(null, 'center')
  )

  // Reposition tooltip when step changes
  useEffect(() => {
    if (!currentStepData) return

    const updatePosition = () => {
      const pos = getTooltipPosition(currentStepData.target, currentStepData.position)
      setTooltipPosition(pos)
    }

    const scrollAndPosition = () => {
      if (currentStepData.target) {
        const element = document.querySelector(currentStepData.target)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
        }
      }
      setTimeout(updatePosition, 300)
    }

    const timer = setTimeout(scrollAndPosition, 50)

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [currentStepData])

  if (!currentStepData) return null

  return (
    <AnimatePresence>
      {/* Spotlight backdrop */}
      <TutorialSpotlight
        key={`spotlight-${currentStep}`}
        targetSelector={currentStepData.target}
      />

      {/* Click blocker */}
      <div
        key="click-blocker"
        className="fixed inset-0"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto', zIndex: 65 }}
      />

      {/* Step tooltip */}
      <TutorialStepCard
        key={`step-${currentStep}`}
        step={currentStepData}
        currentStep={currentStep}
        totalSteps={totalSteps}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTutorial}
        position={tooltipPosition}
      />
    </AnimatePresence>
  )
}
