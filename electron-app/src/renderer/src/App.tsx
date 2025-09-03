import { usePostHog } from 'posthog-js/react'
import React, { useCallback, useEffect, useState } from 'react'
import { DashboardView } from './components/DashboardView'
import DistractionStatusBar from './components/DistractionStatusBar'
import { trpc } from './utils/trpc'
import { TutorialModal } from './components/Onboarding/TutorialModal'
import { OnboardingModal } from './components/OnboardingModal'
import { QuitConfirmationModal } from './components/QuitConfirmationModal'
import RecategorizeDialog from './components/RecategorizeDialog'
import { SettingsPage } from './components/SettingsPage'
import { Toaster } from './components/ui/toaster'
import { TooltipProvider } from './components/ui/tooltip'
import { UpdateNotification } from './components/UpdateNotification'
import { useAuth } from './contexts/AuthContext'
import { useSettings } from './contexts/SettingsContext'
import { useAccessibilityPermission } from './hooks/useAccessibilityPermission'
import { useActivityTracking } from './hooks/useActivityTracking'
import { useOnboardingLogic } from './hooks/useOnboardingLogicApp'
import { cn } from './lib/utils'

export const APP_NAME = 'Cronus' + (process.env.NODE_ENV === 'development' ? ' Dev' : '')
export const APP_USP = 'The first context-aware, AI distraction and time tracker.'

export function MainAppContent(): React.ReactElement {
  const { isAuthenticated, token } = useAuth()
  const { isSettingsOpen, setIsSettingsOpen, setFocusOn } = useSettings()
  const posthog = usePostHog()

  useEffect(() => {
    if (isSettingsOpen) {
      posthog?.capture('viewed_settings')
    } else {
      posthog?.capture('viewed_dashboard')
    }
  }, [isSettingsOpen])

  const [isMiniTimerVisible, setIsMiniTimerVisible] = useState(false)
  const [isTrackingPaused, setIsTrackingPaused] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [isSystemRestarting, setIsSystemRestarting] = useState(false)

  // Fetch today's events for DistractionStatusBar
  const [currentDayStartDateMs, setCurrentDayStartDateMs] = useState<number | null>(null)
  const [currentDayEndDateMs, setCurrentDayEndDateMs] = useState<number | null>(null)

  useEffect(() => {
    const updateDates = (): void => {
      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      setCurrentDayStartDateMs(startOfToday.getTime())
      setCurrentDayEndDateMs(endOfToday.getTime())
    }

    updateDates()
    const intervalId = setInterval(updateDates, 10000)

    return () => clearInterval(intervalId)
  }, [])

  const { data: todayEvents } = trpc.activeWindowEvents.getEventsForDateRange.useQuery(
    {
      token: token || '',
      startDateMs: currentDayStartDateMs!,
      endDateMs: currentDayEndDateMs!
    },
    {
      enabled:
        !!token &&
        typeof token === 'string' &&
        token.length > 0 &&
        currentDayStartDateMs !== null &&
        currentDayEndDateMs !== null,
      refetchInterval: 30000,
      onSuccess: (data) => {
        console.log(
          '🏠 App.tsx fetched today events:',
          data?.length || 0,
          'events',
          `(${currentDayStartDateMs}-${currentDayEndDateMs})`
        )
      },
      select: (data) => {
        if (!data) {
          return []
        }
        return data.map((event) => {
          const e = event as any
          return {
            ...e,
            lastCategorizationAt: e.lastCategorizationAt
              ? new Date(e.lastCategorizationAt)
              : undefined
          }
        })
      }
    }
  )

  // Use the accessibility permission hook
  const { accessibilityPermissionChecked, missingAccessibilityPermissions } =
    useAccessibilityPermission({ token })

  // Use the onboarding logic hook
  const {
    showOnboarding,
    showTutorial,
    setShowTutorial,
    handleOnboardingComplete,
    handleResetOnboarding
  } = useOnboardingLogic({
    permissionsChecked: accessibilityPermissionChecked,
    missingAccessibilityPermissions,
    isAuthenticated
  })

  // Use the activity tracking hook
  const {
    activeWindow,
    isRecategorizeDialogOpen,
    setIsRecategorizeDialogOpen,
    recategorizeTarget,
    setRecategorizeTarget,
    allCategories,
    isLoadingAllCategories,
    openRecategorizeDialog,
    handleSaveRecategorize,
    updateActivityCategoryMutation
  } = useActivityTracking({
    isAuthenticated,
    token,
    isTrackingPaused,
    setIsSettingsOpen,
    setFocusOn
  })

  const handleSettingsClick = useCallback(() => {
    setIsSettingsOpen(!isSettingsOpen)
  }, [setIsSettingsOpen, isSettingsOpen])

  const handleToggleTracking = useCallback(async () => {
    try {
      if (isTrackingPaused) {
        await window.api.resumeWindowTracking()
        setIsTrackingPaused(false)
      } else {
        await window.api.pauseWindowTracking()
        setIsTrackingPaused(true)
      }
    } catch (error) {
      console.error('Failed to toggle tracking:', error)
    }
  }, [isTrackingPaused])

  const handleOpenMiniTimer = (): void => {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('show-floating-window')
    }
  }

  // Mini timer visibility management
  useEffect(() => {
    const fetchInitialVisibility = async (): Promise<void> => {
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

    const handleVisibilityChange = (_event: unknown, isVisible: boolean): void => {
      setIsMiniTimerVisible(isVisible)
    }

    const ipcRenderer = window.electron?.ipcRenderer
    ipcRenderer?.on('floating-window-visibility-changed', handleVisibilityChange)
    return () => {
      ipcRenderer?.removeListener('floating-window-visibility-changed', handleVisibilityChange)
    }
  }, [])

  // Auto-show floating window only after user completes onboarding and is authenticated
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true'

    if (
      isAuthenticated &&
      !showOnboarding &&
      hasCompletedOnboarding &&
      window.electron?.ipcRenderer
    ) {
      window.electron.ipcRenderer.send('show-floating-window')
    }
  }, [isAuthenticated, showOnboarding])

  const handleTutorialClose = (): void => {
    setShowTutorial(false)
    localStorage.setItem('hasSeenTutorial', 'true')
  }

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial') === 'true'
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true'

    if (hasCompletedOnboarding && !hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [])

  // Listen for Cmd+Q keyboard shortcut to show quit confirmation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'q') {
        event.preventDefault()

        const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding') === 'true'
        if (isSystemRestarting || !hasCompletedOnboarding) {
          return
        }

        setShowQuitModal(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSystemRestarting])

  const handleQuitConfirm = async () => {
    try {
      await window.api.confirmQuit()
    } catch (error) {}
  }

  const handleKeepRunning = () => {
    setShowQuitModal(false)
  }

  const handleOpenSettingsFromModal = () => {
    setShowQuitModal(false)
    setIsSettingsOpen(true)
    setFocusOn('pause-tracking')
  }

  const handleSystemRestartBegin = useCallback(() => {
    setIsSystemRestarting(true)
  }, [])

  useEffect(() => {
    document.title = APP_NAME
  }, [])

  return (
    <TooltipProvider delayDuration={150}>
      <div className={cn('flex flex-col', !isSettingsOpen && 'h-screen')}>
        <div className="sticky top-0 z-50 bg-white dark:bg-black">
          <div className="custom-title-bar">
            <span className="app-window-title">{APP_NAME}</span>
          </div>
          <div className="flex-none p-2">
            <DistractionStatusBar
              activeWindow={activeWindow}
              onOpenMiniTimerClick={handleOpenMiniTimer}
              isMiniTimerVisible={isMiniTimerVisible}
              onOpenRecategorizeDialog={openRecategorizeDialog}
              onSettingsClick={handleSettingsClick}
              isSettingsOpen={isSettingsOpen}
              isTrackingPaused={isTrackingPaused}
              onToggleTracking={handleToggleTracking}
              todayEvents={todayEvents as any}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-auto">
          <div className={`flex-1 flex-col min-h-0 ${isSettingsOpen ? 'hidden' : 'flex'}`}>
            <DashboardView />
          </div>
          <div className={`flex-1 flex-col ${isSettingsOpen ? 'flex' : 'hidden'}`}>
            <SettingsPage
              onResetOnboarding={handleResetOnboarding}
              isTrackingPaused={isTrackingPaused}
              onToggleTracking={handleToggleTracking}
            />
          </div>
        </div>

        {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

        <QuitConfirmationModal
          isOpen={showQuitModal}
          onQuit={handleQuitConfirm}
          onKeepRunning={handleKeepRunning}
          onOpenSettings={handleOpenSettingsFromModal}
        />

        <UpdateNotification onRestartBegin={handleSystemRestartBegin} />
        <TutorialModal isFirstVisit={showTutorial} onClose={handleTutorialClose} />
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
            onAddNewCategory={() => {
              setIsRecategorizeDialogOpen(false)
              setRecategorizeTarget(null)
              setIsSettingsOpen(true)
              setFocusOn('categories')
            }}
            setIsSettingsOpen={setIsSettingsOpen}
            setFocusOn={setFocusOn}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
