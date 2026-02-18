import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { OnboardingContext, type OnboardingContextType } from './OnboardingContext'
import { TutorialOverlay } from './TutorialOverlay'
import type { TutorialStep } from './tutorialSteps'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

interface OnboardingProviderProps {
  steps: TutorialStep[]
  children: React.ReactNode
}

export function OnboardingProvider({ steps, children }: OnboardingProviderProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const user = useAuthStore((s) => s.user)
  const session = useAuthStore((s) => s.session)

  // Show tutorial only once: check user_metadata.onboarding_completed
  // Desktop only — sidebar spotlight targets aren't visible on mobile
  useEffect(() => {
    if (!user?.id || !session) return
    if (window.innerWidth < 1024) return

    // Check auth metadata (persisted server-side, survives device/browser changes)
    const metadata = session.user.user_metadata
    if (metadata?.onboarding_completed) return

    // Show tutorial after a short delay so the dashboard renders first
    const timer = setTimeout(() => setIsActive(true), 600)
    return () => clearTimeout(timer)
  }, [user?.id, session])

  const currentStepData = isActive ? steps[currentStep] ?? null : null

  const markComplete = useCallback(() => {
    if (!user?.id) return
    // Persist to auth user_metadata so it's remembered across devices/logins
    supabase.auth.updateUser({
      data: { onboarding_completed: true },
    })
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
