import { motion } from 'framer-motion'
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react'
import type { TutorialStep as TutorialStepType } from './tutorialSteps'

interface TutorialStepProps {
  step: TutorialStepType
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  position: { top: number; left: number; transformOrigin: string }
}

function StepContent({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: Omit<TutorialStepProps, 'position'>) {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <>
      {/* Skip button */}
      <button
        onClick={onSkip}
        className="absolute top-3 right-3 p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-lg transition-colors z-10"
        aria-label="Skip tutorial"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {isFirstStep && (
          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
        )}

        <h3
          id="tutorial-title"
          className="text-lg font-bold text-surface-900 mb-2 pr-6"
        >
          {step.title}
        </h3>
        <p
          id="tutorial-description"
          className="text-sm text-surface-500 leading-relaxed"
        >
          {step.description}
        </p>
      </div>

      {/* Footer */}
      <div className="px-5 sm:px-6 py-3.5 bg-surface-50/80 border-t border-surface-100 flex items-center justify-between">
        {/* Progress dots */}
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        >
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-5 bg-primary-500'
                  : i < currentStep
                    ? 'w-1.5 bg-primary-300'
                    : 'w-1.5 bg-surface-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <button
              onClick={onPrev}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          <button
            onClick={onNext}
            className="px-4 py-1.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-1"
          >
            {isLastStep ? 'Got it!' : isFirstStep ? "Let's go" : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  )
}

export function TutorialStepCard(props: TutorialStepProps) {
  const { step, position } = props
  const isCentered = step.position === 'center'

  // Centered steps use CSS flexbox centering — reliable regardless of timing
  if (isCentered) {
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ pointerEvents: 'none' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-surface-200 overflow-hidden"
          style={{ pointerEvents: 'auto' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-title"
          aria-describedby="tutorial-description"
        >
          <StepContent {...props} />
        </motion.div>
      </div>
    )
  }

  // Positioned steps (spotlight tooltips) use pixel positioning near the target
  let transform: string
  switch (step.position) {
    case 'top':
      transform = 'translate(-50%, -100%)'
      break
    case 'bottom':
      transform = 'translate(-50%, 0)'
      break
    case 'left':
      transform = 'translate(-100%, -50%)'
      break
    case 'right':
      transform = 'translate(0, -50%)'
      break
    default:
      transform = 'translate(-50%, -50%)'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[70] w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-surface-200 overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        transform,
        transformOrigin: position.transformOrigin,
        pointerEvents: 'auto',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-description"
    >
      <StepContent {...props} />
    </motion.div>
  )
}
