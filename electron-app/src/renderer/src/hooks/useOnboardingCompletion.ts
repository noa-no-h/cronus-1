import { useState } from 'react'
import posthog from 'posthog-js'
import { trpc } from '../utils/trpc'

interface UseOnboardingCompletionProps {
  token: string | null
  steps: Array<{ id: string }>
}

export function useOnboardingCompletion({ token, steps }: UseOnboardingCompletionProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [hasOptedInToPosthog, setHasOptedInToPosthog] = useState(false)

  const utils = trpc.useUtils()
  const updateUserReferralMutation = trpc.user.updateUserReferral.useMutation()
  const updateUserPosthogTrackingMutation = trpc.user.updateUserPosthogTracking.useMutation({
    onSuccess: () => {
      // Use trpc utils for more reliable invalidation
      utils.user.getElectronAppSettings.invalidate({ token: token || '' })
    }
  })

  const handleComplete = async (referralSource: string, onComplete: () => void) => {
    console.log(
      '🔍 [ONBOARDING MODAL DEBUG] handleComplete called - starting onboarding completion'
    )
    setIsCompleting(true)

    if (token && referralSource.trim()) {
      console.log('🔍 [ONBOARDING MODAL DEBUG] Updating referral source:', referralSource)
      try {
        await updateUserReferralMutation.mutateAsync({
          token,
          referralSource
        })
        console.log('✅ [ONBOARDING MODAL DEBUG] Referral source updated successfully.')
      } catch (error) {
        console.error('❌ [ONBOARDING MODAL DEBUG] Failed to update referral source:', error)
      }
    }

    console.log('🔍 [ONBOARDING MODAL DEBUG] Starting window tracking')
    try {
      await window.api.enablePermissionRequests()
      console.log(
        '🔍 [ONBOARDING MODAL DEBUG] Permission requests enabled, adding delay before starting tracking'
      )
      await new Promise((resolve) => setTimeout(resolve, 500))
      await window.api.startWindowTracking()
      console.log('🔍 [ONBOARDING MODAL DEBUG] Window tracking started successfully')
    } catch (error) {
      console.error('❌ [ONBOARDING MODAL DEBUG] Failed to start window tracking:', error)
    }

    const showedPosthogStep = steps.some((step) => step.id === 'posthog-opt-in-eu')
    console.log('🔍 [ONBOARDING MODAL DEBUG] PostHog step check:', {
      showedPosthogStep,
      hasOptedInToPosthog
    })
    if (token && showedPosthogStep) {
      try {
        const optedOut = !hasOptedInToPosthog
        console.log('🔍 [ONBOARDING MODAL DEBUG] Updating PostHog preference:', { optedOut })
        await updateUserPosthogTrackingMutation.mutateAsync({
          token,
          optedOutOfPosthogTracking: optedOut
        })

        if (optedOut) {
          posthog.opt_out_capturing()
        } else {
          posthog.opt_in_capturing()
        }

        console.log('✅ [ONBOARDING MODAL DEBUG] PostHog tracking preference updated successfully.')
      } catch (error) {
        console.error(
          '❌ [ONBOARDING MODAL DEBUG] Failed to update PostHog tracking preference:',
          error
        )
      }
    }

    console.log('🔍 [ONBOARDING MODAL DEBUG] Calling onComplete callback in 500ms')
    setTimeout(() => {
      console.log('🔍 [ONBOARDING MODAL DEBUG] Executing onComplete callback now')
      onComplete()
    }, 500)
  }

  return {
    isCompleting,
    hasOptedInToPosthog,
    setHasOptedInToPosthog,
    handleComplete
  }
}
