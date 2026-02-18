import { createContext } from 'react'
import type { TutorialStep } from './tutorialSteps'

export interface OnboardingContextType {
  isActive: boolean
  currentStep: number
  currentStepData: TutorialStep | null
  totalSteps: number
  startTutorial: () => void
  nextStep: () => void
  prevStep: () => void
  skipTutorial: () => void
}

export const OnboardingContext = createContext<OnboardingContextType | null>(null)
