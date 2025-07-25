import { CheckCircle, Loader2, Shield, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import gdprlogoblue from '../assets/gdpr-logo-blue.svg'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'
import { AiCategoryCustomization } from './Settings/AiCategoryCustomization'
import GoalInputForm from './Settings/GoalInputForm'
import { PermissionStatus, PermissionType } from './Settings/PermissionsStatus'
import { Button } from './ui/button'
import { Input } from './ui/input'

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
  const [userGoals, setUserGoals] = useState('')
  const [isAiCategoriesLoading, setIsAiCategoriesLoading] = useState(false)
  const [referralSource, setReferralSource] = useState('')
  const { token } = useAuth()
  const utils = trpc.useUtils()
  const createCategoriesMutation = trpc.category.createCategories.useMutation({
    onSuccess: () => {
      utils.category.getCategories.invalidate()
      utils.category.hasCategories.invalidate()
    }
  })
  const updateUserReferralMutation = trpc.user.updateUserReferral.useMutation()

  useEffect(() => {
    console.log('🚪 Onboarding modal mounted. Enabling permission requests for onboarding.')
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke('enable-permission-requests')
    }
  }, [])

  const { data: userProjectsAndGoals, isLoading: isLoadingGoals } =
    trpc.user.getUserProjectsAndGoals.useQuery({ token: token || '' }, { enabled: !!token })
  const { data: hasCategories, isLoading: isLoadingHasCategories } =
    trpc.category.hasCategories.useQuery({ token: token || '' }, { enabled: !!token })

  useEffect(() => {
    if (!isLoadingGoals) {
      console.log('Fetched user projects and goals:', userProjectsAndGoals)
    }
    if (!isLoadingHasCategories) {
      console.log('Fetched user categories:', hasCategories)
    }
  }, [userProjectsAndGoals, isLoadingGoals])

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

  // Platform check for macos
  const isMac = process.platform === 'darwin'

  // Platform-aware base steps
  const baseSteps = [
    {
      id: 'welcome',
      title: 'We care about your privacy',
      content: (
        <div className="text-center space-y-6">
          <img src={gdprlogoblue} alt="GDPR Logo" className="h-32 mx-auto" />
          <p className="text-md text-muted-foreground max-w-md mx-auto leading-relaxed">
            To categorize your activity, we periodically take screenshots of your active window and
            use OCR to extract text. The screenshot is deleted immediately. The extracted text is
            processed to analyze your activity. For more details, please read our{' '}
            <a
              href="https://cronushq.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Privacy Policy
            </a>
            .
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
      id: 'ai-categories',
      title: 'Customize Your Categories',
      content: (
        <AiCategoryCustomization
          onComplete={handleCategoriesComplete}
          goals={userGoals}
          onLoadingChange={setIsAiCategoriesLoading}
        />
      )
    },
    // Only include permission steps on macOS
    ...(isMac
      ? [
          {
            id: 'accessibility',
            title: 'Enable Accessibility Permission',
            content: (
              <div className="text-center space-y-4 flex flex-col items-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
                  <Shield className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="bg-muted/30 rounded-lg p-4 border border-border/50 max-w-md w-full">
                  <h3 className="font-semibold mb-2 text-left text-md">
                    Why We Need This Permission
                  </h3>
                  <ul className="space-y-4 text-left text-muted-foreground">
                    <li className="flex items-baseline">
                      <span className="text-blue-500 mr-3">&#x2022;</span>
                      <span>
                        Automatically track application and website usage to categorize your
                        activities.
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
                    All data is processed locally on your device. For more information, please refer
                    to our{' '}
                    <a
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
                  <div className="w-full bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mt-4 border border-green-200 dark:border-green-800">
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
              <div className="text-center space-y-6 flex flex-col items-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
                  <ShieldCheck className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>

                <div className="bg-muted/30 rounded-lg p-4 border border-border/50 max-w-md w-full">
                  <h3 className="font-semibold mb-2 text-left text-md">
                    Improve Time Tracking Accuracy
                  </h3>
                  <ul className="space-y-4 text-left text-muted-foreground">
                    <li className="flex items-baseline">
                      <span className="text-blue-500 mr-3">&#x2022;</span>
                      <span>
                        We use on-device Optical Character Recognition (OCR) to analyze temporary
                        screenshots of your active window, allowing for automatic activity
                        categorization.
                      </span>
                    </li>
                    <li className="flex items-baseline">
                      <span className="text-blue-500 mr-3">&#x2022;</span>
                      <span>
                        Screenshots are{' '}
                        <div className="inline-block font-semibold">deleted immediately</div> after
                        processing and are{' '}
                        <div className="inline-block font-semibold">never stored or uploaded</div>.
                      </span>
                    </li>
                  </ul>
                </div>

                {screenRecordingStatus !== 1 && (
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    For more information on how we handle your data, please refer to our{' '}
                    <a
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

                {hasRequestedScreenRecording && screenRecordingStatus !== 1 && (
                  <div className="bg-blue-50 w-full dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-left text-blue-800 dark:text-blue-200">
                      <div className="font-semibold pb-1">Next steps:</div>
                      <ul className="list-disc list-inside">
                        <li>Go to System Preferences → Security & Privacy → Privacy</li>
                        <li>Click &quot;Screen & System Audio Recording&quot; on the left</li>
                        <li>Check the box next to &quot;Cronus&quot; to enable access</li>
                      </ul>
                    </p>
                  </div>
                )}
                {hasRequestedScreenRecording && screenRecordingStatus === 1 && (
                  <div className="bg-green-50 w-full dark:bg-green-900/20 rounded-lg p-4 mt-4 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-200 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <strong>Permission granted! You can now continue.</strong>
                    </p>
                  </div>
                )}
              </div>
            )
          }
        ]
      : []),
    {
      id: 'complete',
      title: "You're All Set!",
      content: (
        <div className="text-center space-y-6 flex flex-col items-center">
          <div className="flex justify-center">
            <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            You&apos;re all set up. Cronus will now track your activity to help you stay focused.
          </p>
          <div className="w-full max-w-md mx-auto space-y-4">
            <div className="text-left flex flex-col gap-1">
              <label
                htmlFor="referral"
                className="font-medium text-base text-foreground mb-4 block"
              >
                Btw, how did you hear about Cronus?{' '}
                <div className="text-xs text-muted-foreground">Optional</div>
              </label>
              <Input
                id="referral"
                type="text"
                placeholder="e.g. Twitter, a friend, Google search..."
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNext()
                  }
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )
    }
  ]

  const steps = baseSteps.filter((step) => {
    if (step.id === 'goals' && hasExistingGoals) {
      return false
    }

    if (step.id === 'ai-categories' && hasCategories) {
      return false
    }

    return true
  })

  function handleGoalsComplete(goals: string) {
    setUserGoals(goals)
    handleNext()
  }

  async function handleCategoriesComplete(categories: any[]) {
    if (token && categories.length > 0) {
      try {
        await createCategoriesMutation.mutateAsync({
          token,
          categories
        })
      } catch (error) {
        console.error('Failed to save categories:', error)
      }
    }
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

    if (token && referralSource.trim()) {
      try {
        await updateUserReferralMutation.mutateAsync({
          token,
          referralSource
        })
        console.log('✅ Referral source updated successfully.')
      } catch (error) {
        console.error('❌ Failed to update referral source:', error)
      }
    }

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

  if (isLoadingGoals || isLoadingHasCategories) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  const currentStepData = steps[currentStep]
  const isGoalStep = currentStepData?.id === 'goals'
  const isAiCategoriesStep = currentStepData?.id === 'ai-categories'
  const isAccessibilityStep = currentStepData?.id === 'accessibility'
  const isScreenRecordingStep = currentStepData?.id === 'screen-recording'
  const isLastStep = currentStep === steps.length - 1
  const isWelcomeStep = currentStepData?.id === 'welcome'

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
                className="bg-gradient-to-r from-[#213BF7] to-[#8593FB] h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="min-h-[320px] flex items-center justify-center pt-4">
              {currentStepData?.content}
            </div>

            {!isGoalStep && !isAiCategoriesStep && !isAiCategoriesLoading && (
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
                    ) : isWelcomeStep ? (
                      'Accept'
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
