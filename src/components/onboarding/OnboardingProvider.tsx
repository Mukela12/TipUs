import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { OnboardingContext, type OnboardingContextType } from './OnboardingContext'
import { TutorialOverlay } from './TutorialOverlay'
import { getOnboardingKey, type TutorialStep } from './tutorialSteps'
import { useAuthStore } from '@/stores/authStore'

interface OnboardingProviderProps {
  steps: TutorialStep[]
  children: React.ReactNode
}

export function OnboardingProvider({ steps, children }: OnboardingProviderProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const user = useAuthStore((s) => s.user)

  // Check if onboarding was already completed (desktop only — sidebar targets aren't visible on mobile)
  useEffect(() => {
    if (!user?.id) return
    if (window.innerWidth < 1024) return

    const key = getOnboardingKey(user.id)
    const completed = localStorage.getItem(key)
    if (!completed) {
      // Show tutorial after a short delay so the dashboard renders first
      const timer = setTimeout(() => setIsActive(true), 600)
      return () => clearTimeout(timer)
    }
  }, [user?.id])

  const currentStepData = isActive ? steps[currentStep] ?? null : null

  const markComplete = useCallback(() => {
    if (!user?.id) return
    localStorage.setItem(getOnboardingKey(user.id), 'true')
  }, [user?.id])

  const startTutorial = useCallback(() => {
    setCurrentStep(0)
    setIsActive(true)
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      markComplete()
      setIsActive(false)
    }
  }, [currentStep, steps.length, markComplete])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const skipTutorial = useCallback(() => {
    markComplete()
    setIsActive(false)
  }, [markComplete])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipTutorial()
      else if (e.key === 'Enter' || e.key === 'ArrowRight') nextStep()
      else if (e.key === 'ArrowLeft') prevStep()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isActive, nextStep, prevStep, skipTutorial])

  const value: OnboardingContextType = {
    isActive,
    currentStep,
    currentStepData,
    totalSteps: steps.length,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {isActive && typeof document !== 'undefined' && createPortal(<TutorialOverlay />, document.body)}
    </OnboardingContext.Provider>
  )
}
