import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { trpc } from '../utils/trpc'

export function useOnboardingQueries() {
  const [isDev, setIsDev] = useState(false)
  const [userGoals, setUserGoals] = useState('')
  const [isAiCategoriesLoading, setIsAiCategoriesLoading] = useState(false)
  const [referralSource, setReferralSource] = useState('')

  const { token } = useAuth()
  const utils = trpc.useUtils()

  const { data: electronSettings } = trpc.user.getElectronAppSettings.useQuery(
    {
      token: token || ''
    },
    {
      enabled: !!token
    }
  )

  const { data: userProjectsAndGoals, isLoading: isLoadingGoals } =
    trpc.user.getUserProjectsAndGoals.useQuery({ token: token || '' }, { enabled: !!token })

  const { data: hasCategories, isLoading: isLoadingHasCategories } =
    trpc.category.hasCategories.useQuery({ token: token || '' }, { enabled: !!token })

  const { data: existingReferralSource, isLoading: isLoadingReferral } =
    trpc.user.getUserReferralSource.useQuery({ token: token || '' }, { enabled: !!token })

  const createCategoriesMutation = trpc.category.createCategories.useMutation({
    onSuccess: () => {
      utils.category.getCategories.invalidate()
      utils.category.hasCategories.invalidate()
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

  useEffect(() => {
    if (!isLoadingGoals) {
      console.log('Fetched user projects and goals:', userProjectsAndGoals)
    }
    if (!isLoadingHasCategories) {
      console.log('Fetched user categories:', hasCategories)
    }
  }, [userProjectsAndGoals, isLoadingGoals, hasCategories, isLoadingHasCategories])

  const handleGoalsComplete = (goals: string) => {
    setUserGoals(goals)
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
  }

  const hasExistingGoals = userProjectsAndGoals && userProjectsAndGoals.trim().length > 0
  const hasExistingReferral = !!existingReferralSource && existingReferralSource.trim().length > 0

  const isLoading = isLoadingGoals || isLoadingHasCategories || isLoadingReferral

  return {
    isDev,
    userGoals,
    isAiCategoriesLoading,
    setIsAiCategoriesLoading,
    referralSource,
    setReferralSource,
    electronSettings,
    userProjectsAndGoals,
    hasCategories,
    existingReferralSource,
    hasExistingGoals,
    hasExistingReferral,
    isLoading,
    handleGoalsComplete,
    handleCategoriesComplete,
    utils
  }
}
