import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'
import GoalInputForm from './ui/GoalInputForm'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface OnboardingModalProps {
  onComplete: () => void
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const { token } = useAuth()

  const markOnboardingCompleteMutation = trpc.auth.markOnboardingComplete.useMutation()

  const steps = [
    {
      title: 'Welcome!',
      content: (
        <div className="text-center space-y-6">
          <div className="text-7xl mb-6">Zeit</div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            We&apos;ll help you stay focused and track your productivity throughout the day.
          </p>
        </div>
      )
    },
    {
      title: '',
      content: <GoalInputForm onboardingMode={true} onComplete={handleGoalsComplete} />
    },
    {
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-6">
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your productivity tracking is now configured. We&apos;ll start monitoring your activity
            and help you stay focused on your goals.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mt-8 border border-border/50">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> You can always update your goals in Settings or get detailed
              insights about your productivity patterns.
            </p>
          </div>
        </div>
      )
    }
  ]

  function handleGoalsComplete() {
    setCurrentStep(2) // Move to final step
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await markOnboardingCompleteMutation.mutateAsync({ token: token || '' })
      onComplete()
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
      setIsCompleting(false)
    }
  }

  const currentStepData = steps[currentStep]
  const isGoalStep = currentStep === 1
  const isLastStep = currentStep === steps.length - 1

  return (
    <>
      <div className="fixed inset-0 bg-background z-50" onClick={handleSkip} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-card/95 shadow-2xl border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground font-medium">
                Step {currentStep + 1} of {steps.length}
              </div>
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                disabled={isCompleting}
              >
                Skip
              </button>
            </div>

            <div className="w-full bg-muted/60 rounded-full h-2 mb-6">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <CardTitle className="text-2xl font-bold text-card-foreground">
              {currentStepData.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="min-h-[320px] flex items-center justify-center py-4">
              {currentStepData.content}
            </div>

            {!isGoalStep && (
              <div className="flex justify-center pt-6 border-t border-border/50">
                <Button
                  onClick={handleNext}
                  disabled={isCompleting}
                  variant="default"
                  size="default"
                  className="min-w-[140px]"
                >
                  {isCompleting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting up...
                    </div>
                  ) : isLastStep ? (
                    'Get Started!'
                  ) : (
                    'Next'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
