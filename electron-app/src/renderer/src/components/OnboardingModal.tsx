import { CheckCircle, Chrome, Loader2, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import icon from './../assets/icon.png'
import GoalInputForm from './GoalInputForm'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface OnboardingModalProps {
  onComplete: () => void
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<number | null>(null)
  const [isRequestingScreenRecording, setIsRequestingScreenRecording] = useState(false)
  const [hasRequestedScreenRecording, setHasRequestedScreenRecording] = useState(false)
  const [screenRecordingStatus, setScreenRecordingStatus] = useState<number | null>(null)
  const { token } = useAuth()

  // Check permission status when on accessibility step
  useEffect(() => {
    if (currentStep === 2) {
      // Accessibility step
      checkPermissionStatus()
      // Poll permission status every 2 seconds
      const interval = setInterval(checkPermissionStatus, 2000)
      return () => clearInterval(interval)
    } else if (currentStep === 3) {
      // Screen recording step
      checkScreenRecordingStatus()
      // Poll screen recording status every 2 seconds
      const interval = setInterval(checkScreenRecordingStatus, 2000)
      return () => clearInterval(interval)
    }
    return () => {} // Return empty cleanup function when not on permission steps
  }, [currentStep])

  const checkPermissionStatus = async () => {
    try {
      const status = await window.api.getPermissionStatus(0) // 0 = PermissionType.Accessibility
      setPermissionStatus(status)
    } catch (error) {
      console.error('Failed to check permission status:', error)
    }
  }

  const checkScreenRecordingStatus = async () => {
    try {
      const status = await window.api.getPermissionStatus(2) // 2 = PermissionType.ScreenRecording
      setScreenRecordingStatus(status)
    } catch (error) {
      console.error('Failed to check screen recording status:', error)
    }
  }

  const steps = [
    {
      title: 'Welcome!',
      content: (
        <div className="text-center space-y-6">
          <img src={icon} alt="Cronus" className="w-24 h-24 mx-auto" />
          <div className="text-7xl mb-6">Cronus</div>
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
      title: 'Enable Accessibility Permission',
      content: (
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            To track your productivity accurately, we need permission to read window titles and
            content from other applications.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mt-8 border border-border/50">
            <p className="text-sm text-muted-foreground">
              <strong>What this enables:</strong>
              <br />• Automatic app and website tracking
              <br />• Smart categorization of your activities
              <br />• Detailed productivity insights
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mt-4 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Privacy:</strong> All data stays on your device and is only sent to our
              servers with your explicit consent for analysis.
            </p>
          </div>
          {hasRequestedPermission && permissionStatus !== 1 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Next steps:</strong>
                <br />
                1. Go to System Preferences → Security & Privacy → Privacy
                <br />
                2. Click &quot;Accessibility&quot; on the left
                <br />
                3. Check the box next to &quot;Cronus&quot; to enable access
                <br />
                4. Come back here and click &quot;Next&quot; when done
              </p>
            </div>
          )}
          {hasRequestedPermission && permissionStatus === 1 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mt-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <strong>Permission granted! You can now continue.</strong>
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Enable Screen Recording Permission',
      content: (
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-full">
              <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            We need screen recording access to understand what you&apos;re doing to help categorize
            your activity and provide better insights.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mt-8 border border-border/50">
            <p className="text-sm text-muted-foreground">
              <strong>What this enables:</strong>
              <br />• Visual context for better activity categorization
              <br />• Enhanced productivity insights
              <br />• Smarter automatic categorization
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mt-4 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Privacy:</strong> Screenshots are processed locally and only sent to our
              servers with your explicit consent for analysis.
            </p>
          </div>
          {hasRequestedScreenRecording && screenRecordingStatus !== 1 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Next steps:</strong>
                <br />
                1. Go to System Preferences → Security & Privacy → Privacy
                <br />
                2. Click &quot;Screen & System Audio Recording&quot; on the left
                <br />
                3. Check the box next to &quot;Cronus&quot; to enable access
                <br />
                4. Come back here and click &quot;Next&quot; when done
              </p>
            </div>
          )}
          {hasRequestedScreenRecording && screenRecordingStatus === 1 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mt-4 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <strong>Permission granted! You can now continue.</strong>
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your productivity tracking is now configured. We&apos;ll start monitoring your activity
            and help you stay focused on your goals.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 mt-8 border border-border/50">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> You can always update your goals and permissions in Settings.
            </p>
          </div>
        </div>
      )
    }
  ]

  function handleGoalsComplete() {
    setCurrentStep(2) // Move to accessibility permission step
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      // Reset permission-related states when going back from permission steps
      if (currentStep === 2) {
        setHasRequestedPermission(false)
        setPermissionStatus(null)
        setIsRequestingPermission(false)
      } else if (currentStep === 3) {
        setHasRequestedScreenRecording(false)
        setScreenRecordingStatus(null)
        setIsRequestingScreenRecording(false)
      }
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRequestAccessibilityPermission = async () => {
    setIsRequestingPermission(true)
    try {
      // Request accessibility permission
      await window.api.requestPermission(0) // 0 = PermissionType.Accessibility
      setHasRequestedPermission(true)

      // Check permission status after a short delay
      setTimeout(() => {
        checkPermissionStatus()
        setIsRequestingPermission(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to request accessibility permission:', error)
      setIsRequestingPermission(false)
      setHasRequestedPermission(true) // Still mark as requested even if error
    }
  }

  const handleRequestScreenRecordingPermission = async () => {
    setIsRequestingScreenRecording(true)
    try {
      // Request screen recording permission
      await window.api.requestPermission(2) // 2 = PermissionType.ScreenRecording
      setHasRequestedScreenRecording(true)

      // Check permission status after a short delay
      setTimeout(() => {
        checkScreenRecordingStatus()
        setIsRequestingScreenRecording(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to request screen recording permission:', error)
      setIsRequestingScreenRecording(false)
      setHasRequestedScreenRecording(true) // Still mark as requested even if error
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = async () => {
    setIsCompleting(true)
    // No need to call markOnboardingComplete mutation anymore
    // Just complete the onboarding process
    setTimeout(() => {
      onComplete()
    }, 500)
  }

  const currentStepData = steps[currentStep]
  const isGoalStep = currentStep === 1
  const isAccessibilityStep = currentStep === 2
  const isScreenRecordingStep = currentStep === 3
  const isLastStep = currentStep === steps.length - 1

  return (
    <>
      <div className="fixed inset-0 bg-background z-50" onClick={handleSkip} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-card/95 shadow-2xl border-border/50">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="text-sm text-muted-foreground font-medium">
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>

            <div className="w-full bg-muted/60 rounded-full h-2 ">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            <CardTitle className="text-2xl mt-8 font-bold text-card-foreground">
              {currentStepData.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="min-h-[320px] flex items-center justify-center py-4">
              {currentStepData.content}
            </div>

            {!isGoalStep && (
              <div className="flex justify-between items-center pt-6 border-t border-border/50">
                {/* Back button - only show if not on first slide */}
                {currentStep > 0 ? (
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    size="default"
                    className="min-w-[100px]"
                    disabled={isCompleting || isRequestingPermission}
                  >
                    Back
                  </Button>
                ) : (
                  <div></div> // Empty div to maintain spacing
                )}

                {/* Main action button */}
                {isAccessibilityStep && !hasRequestedPermission ? (
                  <Button
                    onClick={handleRequestAccessibilityPermission}
                    disabled={isRequestingPermission}
                    variant="default"
                    size="default"
                    className="min-w-[140px]"
                  >
                    {isRequestingPermission ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Requesting...
                      </div>
                    ) : (
                      'Enable Permission'
                    )}
                  </Button>
                ) : isScreenRecordingStep && !hasRequestedScreenRecording ? (
                  <Button
                    onClick={handleRequestScreenRecordingPermission}
                    disabled={isRequestingScreenRecording}
                    variant="default"
                    size="default"
                    className="min-w-[140px]"
                  >
                    {isRequestingScreenRecording ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Requesting...
                      </div>
                    ) : (
                      'Enable Permission'
                    )}
                  </Button>
                ) : (
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
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
