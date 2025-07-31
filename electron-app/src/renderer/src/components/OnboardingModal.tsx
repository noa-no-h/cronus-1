import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import posthog from 'posthog-js'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'
import { AccessibilityStep } from './Onboarding/AccessibilityStep'
import { CompleteStep } from './Onboarding/CompleteStep'
import { PostHogOptInEuStep } from './Onboarding/PostHogOptInEuStep'
import { ScreenRecordingStep } from './Onboarding/ScreenRecordingStep'
import { WelcomeStep } from './Onboarding/WelcomeStep'
import { AiCategoryCustomization } from './Settings/AiCategoryCustomization'
import GoalInputForm from './Settings/GoalInputForm'
import { PermissionStatus, PermissionType } from './Settings/PermissionsStatus'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from './ui/alert-dialog'
import { Button } from './ui/button'

interface OnboardingModalProps {
  onComplete: () => void
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isDev, setIsDev] = useState(false)
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
  const [showSkipConfirmDialog, setShowSkipConfirmDialog] = useState(false)
  const [hasOptedInToPosthog, setHasOptedInToPosthog] = useState(false)
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const utils = trpc.useUtils()

  const { data: electronSettings } = trpc.user.getElectronAppSettings.useQuery(
    {
      token: token || ''
    },
    {
      enabled: !!token
    }
  )

  const createCategoriesMutation = trpc.category.createCategories.useMutation({
    onSuccess: () => {
      utils.category.getCategories.invalidate()
      utils.category.hasCategories.invalidate()
    }
  })
  const updateUserReferralMutation = trpc.user.updateUserReferral.useMutation()
  const updateUserPosthogTrackingMutation = trpc.user.updateUserPosthogTracking.useMutation({
    onSuccess: () => {
      // Use trpc utils for more reliable invalidation
      utils.user.getElectronAppSettings.invalidate({ token: token || '' })
    }
  })

  useEffect(() => {
    console.log('🚪 Onboarding modal mounted. Enabling permission requests for onboarding.')
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke('enable-permission-requests')
    }
    const checkDevStatus = async () => {
      const env = await window.api.getEnvVariables()
      setIsDev(env.isDev)
    }
    checkDevStatus()
  }, [])

  const { data: userProjectsAndGoals, isLoading: isLoadingGoals } =
    trpc.user.getUserProjectsAndGoals.useQuery({ token: token || '' }, { enabled: !!token })
  const { data: hasCategories, isLoading: isLoadingHasCategories } =
    trpc.category.hasCategories.useQuery({ token: token || '' }, { enabled: !!token })
  const { data: existingReferralSource, isLoading: isLoadingReferral } =
    trpc.user.getUserReferralSource.useQuery({ token: token || '' }, { enabled: !!token })

  useEffect(() => {
    if (!isLoadingGoals) {
      console.log('Fetched user projects and goals:', userProjectsAndGoals)
    }
    if (!isLoadingHasCategories) {
      console.log('Fetched user categories:', hasCategories)
    }
  }, [userProjectsAndGoals, isLoadingGoals])

  const handleSkipOnboarding = () => {
    const completeStepIndex = steps.findIndex((step) => step.id === 'complete')
    if (completeStepIndex !== -1) {
      setCurrentStep(completeStepIndex)
    } else {
      // Fallback if complete step isn't found for some reason
      handleComplete()
    }
  }

  const hasExistingGoals = userProjectsAndGoals && userProjectsAndGoals.trim().length > 0
  const hasExistingReferral = !!existingReferralSource && existingReferralSource.trim().length > 0

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

  const handleGoalsComplete = (goals: string) => {
    setUserGoals(goals)
    handleNext()
  }

  const handleCategoriesComplete = async (categories: any[]) => {
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

  const baseSteps = [
    {
      id: 'welcome',
      title: 'We care about your privacy',
      content: <WelcomeStep />
    },
    {
      id: 'posthog-opt-in-eu',
      title: 'PostHog Usage Analytics',
      content: <PostHogOptInEuStep />
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
    {
      id: 'accessibility',
      title: 'Enable Accessibility Permission',
      content: (
        <AccessibilityStep
          permissionStatus={permissionStatus}
          hasRequestedPermission={hasRequestedPermission}
        />
      )
    },
    {
      id: 'screen-recording',
      title: 'Enable Window OCR Permission',
      content: (
        <ScreenRecordingStep
          screenRecordingStatus={screenRecordingStatus}
          hasRequestedScreenRecording={hasRequestedScreenRecording}
        />
      )
    },
    {
      id: 'complete',
      title: "You're All Set!",
      content: (
        <CompleteStep
          hasExistingReferral={hasExistingReferral}
          referralSource={referralSource}
          setReferralSource={setReferralSource}
          handleNext={handleNext}
        />
      )
    }
  ]

  const steps = baseSteps.filter((step) => {
    if (step.id === 'posthog-opt-in-eu') {
      // Show PostHog step only for EU users
      return user?.isInEU
    }

    if (step.id === 'goals' && hasExistingGoals) {
      return false
    }

    if (step.id === 'ai-categories' && hasCategories) {
      return false
    }

    return true
  })

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
      // Add delay to ensure native _explicitPermissionDialogsEnabled flag is properly set
      // This prevents Chrome Apple Events permission race condition
      await new Promise(resolve => setTimeout(resolve, 500))
      await window.api.startWindowTracking()
    } catch (error) {
      console.error('Failed to start window tracking:', error)
    }

    // Update PostHog tracking preference only if user saw the PostHog step
    const showedPosthogStep = steps.some((step) => step.id === 'posthog-opt-in-eu')
    if (token && showedPosthogStep) {
      try {
        const optedOut = !hasOptedInToPosthog
        await updateUserPosthogTrackingMutation.mutateAsync({
          token,
          optedOutOfPosthogTracking: optedOut
        })

        // Call PostHog opt-out/opt-in methods
        if (optedOut) {
          posthog.opt_out_capturing()
        } else {
          posthog.opt_in_capturing()
        }

        console.log('✅ PostHog tracking preference updated successfully.')
      } catch (error) {
        console.error('❌ Failed to update PostHog tracking preference:', error)
      }
    }

    // Complete the onboarding process
    setTimeout(() => {
      onComplete()
    }, 500)
  }

  if (isLoadingGoals || isLoadingHasCategories || isLoadingReferral) {
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
  const isPosthogOptInStep = currentStepData?.id === 'posthog-opt-in-eu'

  return (
    <>
      <AlertDialog open={showSkipConfirmDialog} onOpenChange={setShowSkipConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to skip?</AlertDialogTitle>
            <AlertDialogDescription>
              This significantly improves the accuracy of AI categorization. Without it, we
              can&apos;t distinguish activities within the same desktop app (e.g., work vs. social).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNext}>
              Proceed with reduced accuracy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            {isDev && (
              <div className="text-center">
                <Button onClick={handleSkipOnboarding} variant="link" size="sm">
                  (Dev) Skip to end
                </Button>
              </div>
            )}
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
                {isPosthogOptInStep ? (
                  <>
                    <Button
                      onClick={() => {
                        setHasOptedInToPosthog(false)
                        handleNext()
                      }}
                      variant="outline"
                    >
                      Decline
                    </Button>
                    <Button
                      onClick={() => {
                        setHasOptedInToPosthog(true)
                        handleNext()
                      }}
                      variant="default"
                    >
                      Accept
                    </Button>
                  </>
                ) : isAccessibilityStep && !hasRequestedPermission ? (
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
                  <>
                    <Button
                      onClick={() => setShowSkipConfirmDialog(true)}
                      variant="outline"
                      size="default"
                      className="min-w-[100px]"
                    >
                      Skip
                    </Button>
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
                  </>
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
