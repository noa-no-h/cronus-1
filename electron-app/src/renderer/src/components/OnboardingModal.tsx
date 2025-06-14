import { CheckCircle, Chrome, Loader2, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import chromeAppleEventsScreenshot from './../assets/chrome-apple-events-screenshot.png'
import safariEnableJsScreenshot from './../assets/safari-enable-js.png'
import GoalInputForm from './ui/GoalInputForm'
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
  const [isUsingSafari, setIsUsingSafari] = useState(false)
  const { token } = useAuth()

  // Check permission status when on accessibility step
  useEffect(() => {
    if (currentStep === 2) {
      // Accessibility step
      checkPermissionStatus()
      // Poll permission status every 2 seconds
      const interval = setInterval(checkPermissionStatus, 2000)
      return () => clearInterval(interval)
    }
    return () => {} // Return empty cleanup function when not on accessibility step
  }, [currentStep])

  const checkPermissionStatus = async () => {
    try {
      const status = await window.api.getPermissionStatus(0) // 0 = PermissionType.Accessibility
      setPermissionStatus(status)
    } catch (error) {
      console.error('Failed to check permission status:', error)
    }
  }

  const steps = [
    {
      title: 'Welcome!',
      content: (
        <div className="text-center space-y-6">
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
                2. Click "Accessibility" on the left
                <br />
                3. Check the box next to "Cronus" to enable access
                <br />
                4. Come back here and click "Next" when done
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
      title: 'Browser Setup for Better Tracking',
      content: (
        <div className="text-center space-y-6">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full">
              <Chrome className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            To get the most accurate insights, please enable JavaScript from Apple Events in your
            browser.
          </p>

          {/* Safari/Chrome Toggle */}
          <div className="flex justify-center items-center space-x-4 mb-6">
            <span
              className={`text-sm ${!isUsingSafari ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
            >
              Chrome
            </span>
            <button
              onClick={() => setIsUsingSafari(!isUsingSafari)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isUsingSafari ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isUsingSafari ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm ${isUsingSafari ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
            >
              Safari
            </span>
          </div>

          <div className="text-left max-w-md mx-auto">
            {isUsingSafari ? (
              <ol className="list-decimal pl-6 text-base space-y-2">
                <li>
                  Open Safari and click <strong>Safari</strong> in the menu bar
                </li>
                <li>
                  Select <strong>Settings</strong> (or <strong>Preferences</strong>)
                </li>
                <li>
                  Go to the <strong>Advanced</strong> tab
                </li>
                <li>
                  Check <strong>Show Develop menu in menu bar</strong>
                </li>
                <li>
                  Click <strong>Develop</strong> in the menu bar
                </li>
                <li>
                  Select <strong>Allow JavaScript from Apple Events</strong>
                </li>
              </ol>
            ) : (
              <ol className="list-decimal pl-6 text-base space-y-2">
                <li>
                  Open Chrome and click the <strong>View</strong> menu at the top of your screen.
                </li>
                <li>
                  Select <strong>Developer</strong>
                </li>
                <li>
                  Select <strong>Allow JavaScript from Apple Events</strong>
                </li>
              </ol>
            )}
          </div>

          <div className="flex justify-center mt-4">
            <img
              src={isUsingSafari ? safariEnableJsScreenshot : chromeAppleEventsScreenshot}
              alt={`How to enable JavaScript from Apple Events in ${isUsingSafari ? 'Safari' : 'Chrome'}`}
              className="min-h-[400px] rounded-lg border shadow-lg max-w-full max-h-48 object-contain"
            />
          </div>
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
      // Reset permission-related states when going back from accessibility step
      if (currentStep === 2) {
        setHasRequestedPermission(false)
        setPermissionStatus(null)
        setIsRequestingPermission(false)
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
