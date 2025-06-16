import { useCallback, useEffect, useState } from 'react'
import { ActiveWindowDetails, Category } from 'shared'
import { DashboardView } from './components/DashboardView'
import { OnboardingModal } from './components/OnboardingModal'
import RecategorizeDialog from './components/RecategorizeDialog'
import DistractionStatusBar from './components/ui/DistractionStatusBar'
import { Toaster } from './components/ui/toaster'
import { useAuth } from './contexts/AuthContext'
import { toast } from './hooks/use-toast'
import { uploadActiveWindowEvent } from './lib/activityUploader'
import { SettingsPage } from './pages/SettingsPage'
import { trpc } from './utils/trpc'

export const APP_NAME = 'Cronus' + (process.env.NODE_ENV === 'development' ? ' Dev' : '')
export const APP_USP = 'The first context and goal-aware distraction and productivity tracker.'

export interface ActivityToRecategorize {
  identifier: string
  nameToDisplay: string
  itemType: 'app' | 'website'
  currentCategoryId: string
  currentCategoryName: string
  currentCategoryColor: string
  originalUrl?: string
  startDateMs?: number
  endDateMs?: number
}

export function MainAppContent() {
  const { isAuthenticated, token, user } = useAuth()
  const [activeWindow, setActiveWindow] = useState<ActiveWindowDetails | null>(null)
  const [isMiniTimerVisible, setIsMiniTimerVisible] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const trpcUtils = trpc.useContext()

  const [isRecategorizeDialogOpen, setIsRecategorizeDialogOpen] = useState(false)
  const [recategorizeTarget, setRecategorizeTarget] = useState<ActivityToRecategorize | null>(null)

  const { data: allCategoriesData, isLoading: isLoadingAllCategories } =
    trpc.category.getCategories.useQuery({ token: token || '' }, { enabled: !!token })
  const allCategories: Category[] | undefined = allCategoriesData as Category[] | undefined

  const updateActivityCategoryMutation =
    trpc.activeWindowEvents.updateEventsCategoryInDateRange.useMutation({
      onSuccess: (_data, variables) => {
        toast({
          title: 'Activity Re-categorized',
          description: `${variables.activityIdentifier} has been moved.`
        })
        trpcUtils.activeWindowEvents.getEventsForDateRange.invalidate()
        setIsRecategorizeDialogOpen(false)
        setRecategorizeTarget(null)
      },
      onError: (error) => {
        console.error('Error updating category:', error)
        toast({
          title: 'Error',
          description: 'Failed to re-categorize activity. ' + error.message,
          variant: 'destructive'
        })
      }
    })

  const openRecategorizeDialog = useCallback(
    (target: ActivityToRecategorize) => {
      console.log('Opening re-categorize dialog for:', target)
      setRecategorizeTarget(target)
      setIsRecategorizeDialogOpen(true)
    },
    [setRecategorizeTarget, setIsRecategorizeDialogOpen]
  )

  const handleSaveRecategorize = useCallback(
    (newCategoryId: string) => {
      if (!recategorizeTarget || !token) {
        toast({
          title: 'Error',
          description: 'Missing data for re-categorization.',
          variant: 'destructive'
        })
        return
      }

      let { startDateMs, endDateMs } = recategorizeTarget
      if (startDateMs === undefined || endDateMs === undefined) {
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const endOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
          0,
          0,
          0,
          0
        )
        startDateMs = startOfToday.getTime()
        endDateMs = endOfToday.getTime()
      }

      updateActivityCategoryMutation.mutate({
        token,
        startDateMs: startDateMs,
        endDateMs: endDateMs,
        activityIdentifier: recategorizeTarget.identifier,
        itemType: recategorizeTarget.itemType,
        newCategoryId: newCategoryId
      })
    },
    [recategorizeTarget, token, updateActivityCategoryMutation, toast]
  )

  useEffect(() => {
    const handleRecategorizeRequestFromIPC = (receivedData: any) => {
      console.log('App.tsx: IPC Handler - Raw received data:', receivedData)

      // The received data should be the category object.
      const categoryObject = receivedData as Category

      if (categoryObject && typeof categoryObject === 'object' && categoryObject._id) {
        if (!activeWindow) {
          console.warn('Recategorize request received but activeWindow is null.')
          toast({
            title: 'Cannot recategorize',
            description: 'No active window information available.',
            variant: 'destructive'
          })
          return
        }

        const nameToDisplay = activeWindow.title
        const identifier = activeWindow.url
        const itemType = activeWindow.url ? 'website' : 'app'

        const target: ActivityToRecategorize = {
          identifier: identifier || '',
          nameToDisplay: nameToDisplay,
          itemType: itemType,
          currentCategoryId: categoryObject._id,
          currentCategoryName: categoryObject.name,
          currentCategoryColor: categoryObject.color,
          originalUrl: activeWindow.url || undefined
        }
        console.log('App.tsx: Opening dialog with target from IPC:', target)
        openRecategorizeDialog(target)
      } else {
        console.warn('App.tsx: IPC recategorize request failed. Data received:', receivedData)
      }
    }

    if (window.api && window.api.onDisplayRecategorizePage) {
      const cleanup = window.api.onDisplayRecategorizePage(handleRecategorizeRequestFromIPC)
      return cleanup
    } else {
      console.warn('App.tsx: window.api.onDisplayRecategorizePage not available for IPC.')
      return () => {}
    }
  }, [token, openRecategorizeDialog, activeWindow])

  const eventCreationMutation = trpc.activeWindowEvents.create.useMutation({
    onSuccess: () => {
      trpcUtils.activeWindowEvents.getEventsForDateRange.invalidate()
      // invalidating this because we modify the active window event in the backend
      trpcUtils.activeWindowEvents.getLatestEvent.invalidate()
    },
    onError: (error) => {
      console.error('Error creating active window event:', error)
    }
  })

  // Show onboarding for all authenticated users (every login)
  useEffect(() => {
    if (isAuthenticated && user) {
      setShowOnboarding(true)
    }
  }, [isAuthenticated, user])

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.invoke('set-open-at-login', true)
      // Enable permission requests now that onboarding is complete
      window.electron.ipcRenderer.invoke('enable-permission-requests')
    }
  }

  const handleResetOnboarding = () => {
    setShowOnboarding(true)
  }

  const handleOpenMiniTimer = () => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('show-floating-window')
    }
  }

  useEffect(() => {
    const cleanup = window.api.onActiveWindowChanged((details) => {
      setActiveWindow(details)
      if (details && isAuthenticated && token) {
        uploadActiveWindowEvent(token, details, eventCreationMutation.mutateAsync)
      }
    })
    return cleanup
  }, [isAuthenticated, token, eventCreationMutation.mutateAsync])

  useEffect(() => {
    // Fetch initial state
    const fetchInitialVisibility = async () => {
      if (window.api?.getFloatingWindowVisibility) {
        try {
          const isVisible = await window.api.getFloatingWindowVisibility()
          setIsMiniTimerVisible(isVisible)
        } catch (error) {
          console.error('Failed to get mini timer visibility', error)
        }
      }
    }

    fetchInitialVisibility()

    // Listener for subsequent changes
    const handleVisibilityChange = (_event: unknown, isVisible: boolean) => {
      setIsMiniTimerVisible(isVisible)
    }

    const ipcRenderer = window.electron?.ipcRenderer
    ipcRenderer?.on('floating-window-visibility-changed', handleVisibilityChange)
    return () => {
      ipcRenderer?.removeListener('floating-window-visibility-changed', handleVisibilityChange)
    }
  }, [])

  // auto open mini timer when onboarding is completed and the user is authenticated
  useEffect(() => {
    if (isAuthenticated && !showOnboarding && window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('show-floating-window')
    }
  }, [isAuthenticated, showOnboarding])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="custom-title-bar">{APP_NAME}</div>
      <div className="p-4">
        <DistractionStatusBar
          activeWindow={activeWindow}
          onOpenMiniTimerClick={handleOpenMiniTimer}
          isMiniTimerVisible={isMiniTimerVisible}
          onOpenRecategorizeDialog={openRecategorizeDialog}
          onSettingsClick={() => setIsSettingsOpen(!isSettingsOpen)}
          isSettingsOpen={isSettingsOpen}
        />
      </div>

      <DashboardView className={isSettingsOpen ? 'hidden' : ''} />
      {isSettingsOpen && <SettingsPage onResetOnboarding={handleResetOnboarding} />}

      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      <Toaster />
      {allCategories && recategorizeTarget && (
        <RecategorizeDialog
          open={isRecategorizeDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setRecategorizeTarget(null)
            }
            setIsRecategorizeDialogOpen(isOpen)
          }}
          activityTarget={recategorizeTarget}
          allCategories={allCategories}
          onSave={handleSaveRecategorize}
          isLoading={updateActivityCategoryMutation.isLoading || isLoadingAllCategories}
        />
      )}
    </div>
  )
}
