import { CheckCircle, Loader2, Shield, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'
import icon from './../assets/icon.png'
import GoalInputForm from './Settings/GoalInputForm'
import { PermissionStatus, PermissionType } from './Settings/PermissionsStatus'
import { Button } from './ui/button'

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

  useEffect(() => {
    console.log('🚪 Onboarding modal mounted. Enabling permission requests for onboarding.')
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke('enable-permission-requests')
    }
  }, [])

  const { data: userProjectsAndGoals, isLoading: isLoadingGoals } =
    trpc.user.getUserProjectsAndGoals.useQuery({ token: token || '' }, { enabled: !!token })

  const hasExistingGoals = userProjectsAndGoals && userProjectsAndGoals.trim().length > 0

  // Check permission status when on accessibility step
  useEffect(() => {
    const activeStepDefinition = steps[currentStep]
    if (!activeStepDefinition) return

    if (activeStepDefinition.id === 'accessibility') {
      console.log('👀 Polling for Accessibility permission status.')
      // Accessibility step
      checkPermissionStatus()
      // Poll permission status every 2 seconds
      const interval = setInterval(checkPermissionStatus, 2000)
      return () => {
        console.log('🛑 Stopped polling for Accessibility.')
        clearInterval(interval)
      }
    } else if (activeStepDefinition.id === 'screen-recording') {
      console.log('👀 Polling for Screen Recording permission status.')
      // Screen recording step
      checkScreenRecordingStatus()
      // Poll screen recording status every 2 seconds
      const interval = setInterval(checkScreenRecordingStatus, 2000)
      return () => {
        console.log('🛑 Stopped polling for Screen Recording.')
        clearInterval(interval)
      }
    }
    return () => {} // Return empty cleanup function when not on permission steps
  }, [currentStep])

  const checkPermissionStatus = async () => {
    try {
      const status = await window.api.getPermissionStatus(PermissionType.Accessibility) // 0 = PermissionType.Accessibility
      console.log('📦 Raw accessibility status from main:', status)
      console.log(`♿️ Accessibility permission is: ${PermissionStatus[status]}`)
      setPermissionStatus(status)
    } catch (error) {
      console.error('Failed to check permission status:', error)
    }
  }

  const checkScreenRecordingStatus = async () => {
    try {
      const status = await window.api.getPermissionStatus(PermissionType.ScreenRecording) // 2 = PermissionType.ScreenRecording
      console.log('📦 Raw screen recording status from main:', status)
      console.log(`🖥️ Screen Recording permission is: ${PermissionStatus[status]}`)
      setScreenRecordingStatus(status)
    } catch (error) {
      console.error('Failed to check screen recording status:', error)
    }
  }

  const baseSteps = [
    {
      id: 'welcome',
      title: 'Welcome!',
      content: (
        <div className="text-center space-y-6">
          <img src={icon} alt="Cronus" className="w-24 h-24 mx-auto rounded-lg shadow-lg" />
          <div className="text-7xl mb-6">Cronus</div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            We&apos;ll help you stay focused and track your productivity throughout the day.
          </p>
        </div>
      )
    },
    {
      id: 'goals',
      title: '',
      content: <GoalInputForm onboardingMode={true} onComplete={handleGoalsComplete} />
    },
    {
      id: 'accessibility',
      title: 'Enable Accessibility Permission',
      content: (
        <div className="text-center space-y-4 flex flex-col items-center">
          <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
            <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50 max-w-md w-full">
            <h3 className="font-semibold mb-4 text-left text-lg">Why We Need This Permission</h3>
            <ul className="space-y-4 text-left text-muted-foreground">
              <li className="flex items-baseline">
                <span className="text-blue-500 mr-3">&#x2022;</span>
                <span>
                  Automatically track application and website usage to categorize your activities.
                </span>
              </li>
              <li className="flex items-baseline">
                <span className="text-blue-500 mr-3">&#x2022;</span>
                <span>Provide detailed insights into your productivity.</span>
              </li>
            </ul>
          </div>
          {permissionStatus !== 1 && (
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              All data is processed locally on your device. For more information, please refer to
              our{' '}
              <a
                // TODO: add privacy policy link
                href="https://cronushq.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Privacy Policy
              </a>
              .
            </p>
          )}
          {hasRequestedPermission && permissionStatus !== 1 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-left text-blue-800 dark:text-blue-200">
                <div className="font-semibold pb-1">Next steps:</div>
                <br />
                1. Go to System Preferences → Security & Privacy → Privacy
                <br />
                2. Click &quot;Accessibility&quot; on the left
                <br />
                3. Check the box next to &quot;Cronus&quot; to enable access
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
      id: 'screen-recording',
      title: 'Enable Screen Recording Permission',
      content: (
        <div className="text-center space-y-4 flex flex-col items-center">
          <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
            <ShieldCheck className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border border-border/50 max-w-md w-full">
            <h3 className="font-semibold mb-4 text-left text-lg">Why We Need This Permission</h3>
            <ul className="space-y-4 text-left text-muted-foreground">
              <li className="flex items-baseline">
                <span className="text-blue-500 mr-3">&#x2022;</span>
                <span>
                  To automatically categorize your activity, we periodically take a screenshot of
                  your active window.
                </span>
              </li>
              <li className="flex items-baseline">
                <span className="text-blue-500 mr-3">&#x2022;</span>
                <span>
                  We then use Optical Character Recognition (OCR) to understand what you are working
                  on.
                </span>
              </li>
              <li className="flex items-baseline">
                <span className="text-blue-500 mr-3">&#x2022;</span>
                <span>
                  All screenshots are deleted from your device immediately after being processed.
                </span>
              </li>
            </ul>
          </div>

          {screenRecordingStatus !== 1 && (
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              For more information on how we handle your data, please refer to our{' '}
              <a
                href="https://getcronus.app/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Privacy Policy
              </a>
              .
            </p>
          )}

          {hasRequestedScreenRecording && screenRecordingStatus !== 1 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-left text-blue-800 dark:text-blue-200">
                <div className="font-semibold pb-1">Next steps:</div>
                <br />
                1. Go to System Preferences → Security & Privacy → Privacy
                <br />
                2. Click &quot;Screen & System Audio Recording&quot; on the left
                <br />
                3. Check the box next to &quot;Cronus&quot; to enable access
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
      id: 'complete',
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-4 flex flex-col items-center">
          <div className="flex justify-center">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            You&apos;re all set up. Cronus will now track your activity to help you stay focused.
          </p>
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> You can always update your goals and permissions in Settings.
            </p>
          </div>
        </div>
      )
    }
  ]

  const steps = baseSteps.filter((step) => {
    if (step.id === 'goals' && hasExistingGoals) {
      return false
    }
    return true
  })

  function handleGoalsComplete() {
    handleNext()
  }

  const handleNext = () => {
    console.log('🚀 User clicked Next. Proceeding to next step, currentStep:', currentStep)
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      const currentStepId = steps[currentStep]?.id
      // Reset permission-related states when going back from permission steps
      if (currentStepId === 'accessibility') {
        setHasRequestedPermission(false)
        setPermissionStatus(null)
        setIsRequestingPermission(false)
      } else if (currentStepId === 'screen-recording') {
        setHasRequestedScreenRecording(false)
        setScreenRecordingStatus(null)
        setIsRequestingScreenRecording(false)
      }
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRequestAccessibilityPermission = async () => {
    setIsRequestingPermission(true)
    console.log('👉 Requesting Accessibility permission from user...')
    try {
      // Request accessibility permission
      await window.api.requestPermission(PermissionType.Accessibility) // 0 = PermissionType.Accessibility
      setHasRequestedPermission(true)
      console.log('✅ OS dialog for Accessibility permission should be visible.')

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
    console.log('👉 Requesting Screen Recording permission from user...')
    try {
      // Request screen recording permission
      await window.api.requestPermission(PermissionType.ScreenRecording) // 2 = PermissionType.ScreenRecording
      setHasRequestedScreenRecording(true)
      console.log('✅ OS dialog for Screen Recording permission should be visible.')

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

    // Start window tracking now that onboarding is complete
    try {
      await window.api.enablePermissionRequests()
      await window.api.startWindowTracking()
    } catch (error) {
      console.error('Failed to start window tracking:', error)
    }

    // Complete the onboarding process
    setTimeout(() => {
      onComplete()
    }, 500)
  }

  if (isLoadingGoals) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const currentStepData = steps[currentStep]
  const isGoalStep = currentStepData?.id === 'goals'
  const isAccessibilityStep = currentStepData?.id === 'accessibility'
  const isScreenRecordingStep = currentStepData?.id === 'screen-recording'
  const isLastStep = currentStep === steps.length - 1

  return (
    <>
      <div
        className="fixed inset-0 bg-background z-50"
        onClick={isGoalStep ? undefined : handleSkip}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-auto flex flex-col">
          <div className="text-center pb-4">
            <h2 className="text-2xl font-bold text-card-foreground">{currentStepData?.title}</h2>
          </div>

          <div className="space-y-6">
            <div className="w-full bg-muted/60 rounded-full h-2 ">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="min-h-[320px] flex items-center justify-center py-4">
              {currentStepData?.content}
            </div>

            {!isGoalStep && (
              <div className="flex justify-center gap-4 items-center">
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
                      'Grant Permission'
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
                      'Grant Permission'
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
          </div>
        </div>
      </div>
    </>
  )
}
